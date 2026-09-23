/**
 * Push Notification Service for SDK Hub
 * Provides unified Web and PWA push notifications for system alerts, tasks, approvals, and realtime chats.
 */

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  silent?: boolean;
}

let audioCtx: AudioContext | null = null;

export const pushNotificationService = {
  /**
   * Check if browser / web environment supports notifications
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  /**
   * Initialize AudioContext safely on or after user interaction
   */
  initAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
        }
      } catch (e) {
        console.warn('Failed to init AudioContext:', e);
      }
    } else if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  },

  /**
   * Check current notification permission status
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  /**
   * Requests permission to send desktop / mobile push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      localStorage.setItem('sdk_push_permission', permission);
      return permission;
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return 'denied';
    }
  },

  /**
   * Play an audible notification sound for incoming chat or alert
   */
  playNotificationSound() {
    if (!audioCtx) {
      this.initAudioContext();
    }
    if (!audioCtx) return;

    try {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio context may be restricted by browser policy before user interaction
    }
  },

  /**
   * Sends a push notification to the user via Service Worker (PWA) or native Notification API
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    // If permission is not yet granted, attempt requesting if user clicked recently
    let perm = Notification.permission;
    if (perm !== 'granted') {
      // Don't spam prompt if denied
      if (perm === 'denied') return false;
      perm = await this.requestPermission();
      if (perm !== 'granted') return false;
    }

    // Play subtle chime sound
    if (!payload.silent) {
      this.playNotificationSound();
    }

    const defaultIcon = '/favicon.svg';
    const notificationOptions: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || defaultIcon,
      badge: payload.badge || defaultIcon,
      tag: payload.tag || `sdk-${Date.now()}`,
      data: {
        url: payload.url || '/',
      },
    };

    // Try service worker registration first (optimal for PWA and background delivery)
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(payload.title, notificationOptions);
          return true;
        }
      } catch (swErr) {
        console.warn('Service Worker notification failed, falling back to Notification API:', swErr);
      }
    }

    // Fallback to native Window Notification
    try {
      const notif = new Notification(payload.title, notificationOptions);
      notif.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
        notif.close();
      };
      return true;
    } catch (notifErr) {
      console.warn('Native notification failed:', notifErr);
      return false;
    }
  },
};
