import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { soundService } from '../services/soundService';
import type { Notification } from '../types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  unreadChatCount: number;
  clearUnreadChat: () => void;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestPushPermission: () => Promise<NotificationPermission>;
  pushPermission: NotificationPermission;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(() => {
    const saved = localStorage.getItem('sdk_unread_chat_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    return pushNotificationService.getPermission();
  });

  const requestPushPermission = useCallback(async () => {
    const perm = await pushNotificationService.requestPermission();
    setPushPermission(perm);
    return perm;
  }, []);

  const clearUnreadChat = useCallback(() => {
    setUnreadChatCount(0);
    localStorage.setItem('sdk_unread_chat_count', '0');
    localStorage.setItem('sdk_chat_last_read_at', new Date().toISOString());
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!currentProfile?.id) {
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);
      const data = await notificationService.getNotifications(currentProfile.id);
      setNotifications(data);

      // Check unread messages from other users
      if (window.location.pathname !== '/chat') {
        // Fetch user's conversation IDs first
        const { data: userConvs } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', currentProfile.id);

        const convIds = (userConvs || []).map((c: any) => c.conversation_id);

        if (convIds.length > 0) {
          const lastRead = localStorage.getItem('sdk_chat_last_read_at');
          let query = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .neq('sender_id', currentProfile.id)
            .eq('is_system', false);

          if (lastRead) {
            query = query.gt('created_at', lastRead);
          }

          const { count, error } = await query;
          if (!error && typeof count === 'number') {
            const initialCount = count > 0 ? count : (!lastRead ? 3 : 0);
            setUnreadChatCount(initialCount);
            localStorage.setItem('sdk_unread_chat_count', String(initialCount));
          }
        } else {
          setUnreadChatCount(0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    fetchNotifications();

    if (!currentProfile?.id) return;

    // Check & request push permission if not determined
    if (pushNotificationService.isSupported() && Notification.permission === 'default') {
      pushNotificationService.requestPermission().then(setPushPermission).catch(() => {});
    }

    // Subscribe to realtime database changes
    const unsubscribe = notificationService.subscribeToNotifications(
      currentProfile.id,
      (changedNotif, eventType) => {
        setNotifications((prev: Notification[]) => {
          if (eventType === 'INSERT') {
            // Trigger Push Notification for Web & PWA
            pushNotificationService.sendNotification({
              title: changedNotif.title || 'Notifikasi SDK Hub',
              body: changedNotif.message || 'Anda memiliki notifikasi baru.',
              url: '/notifications',
              tag: `notif-${changedNotif.id}`,
            });

            // Prepend new notification if not already in list
            if (prev.some((n: Notification) => n.id === changedNotif.id)) return prev;
            return [changedNotif, ...prev];
          } else if (eventType === 'UPDATE') {
            return prev.map((n: Notification) => (n.id === changedNotif.id ? changedNotif : n));
          } else if (eventType === 'DELETE') {
            return prev.filter((n: Notification) => n.id !== changedNotif.id);
          }
          return prev;
        });
      }
    );

    // Subscribe to realtime chat messages to trigger push notification and increment unread badge
    const chatMsgChannel = supabase
      .channel('realtime:all-chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: any) => {
          const newMsg = payload.new;
          if (newMsg && newMsg.sender_id !== currentProfile.id && !newMsg.is_system) {
            // Play subtle audio ping if enabled
            soundService.playMessageNotificationSound();

            // Trigger Push Notification for Web & PWA
            pushNotificationService.sendNotification({
              title: 'Pesan Baru di SDK Hub',
              body: newMsg.content || 'Anda menerima pesan chat baru.',
              url: '/chat',
              tag: `chat-${newMsg.conversation_id || newMsg.id}`,
            });

            // Check if current window path is /chat
            if (window.location.pathname !== '/chat') {
              setUnreadChatCount((prev: number) => {
                const next = prev + 1;
                localStorage.setItem('sdk_unread_chat_count', String(next));
                return next;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(chatMsgChannel);
    };
  }, [currentProfile?.id, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const target = notifications.find((n: Notification) => n.id === notificationId);
    if (!target || target.is_read) return; // Prevent double request if already read

    // Optimistic UI update
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );

    try {
      await notificationService.markAsRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert on error
      setNotifications((prev: Notification[]) =>
        prev.map((n: Notification) => (n.id === notificationId ? { ...n, is_read: false } : n))
      );
      toast.error('Gagal memperbarui status notifikasi');
    }
  };

  const markAllAsRead = async () => {
    if (!currentProfile?.id) return;
    const hasUnread = notifications.some((n: Notification) => !n.is_read);
    if (!hasUnread) return;

    // Snapshot for rollback
    const previous = [...notifications];

    // Optimistic UI update
    setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, is_read: true })));

    try {
      await notificationService.markAllAsRead(currentProfile.id);
      toast.success('Semua notifikasi telah ditandai sudah dibaca');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setNotifications(previous);
      toast.error('Gagal menandai semua notifikasi');
    }
  };

  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadChatCount,
        clearUnreadChat,
        isLoading,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        requestPushPermission,
        pushPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
