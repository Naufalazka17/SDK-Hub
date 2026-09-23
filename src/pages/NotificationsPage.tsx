import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCheck, ClipboardList, RefreshCw, 
  AtSign, FileText, Flag, ArrowRight, X, ExternalLink,
  Bell, Loader2, BellRing, BellOff, Sparkles
} from 'lucide-react';
import { Drawer } from '../components/common/Drawer';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { pushNotificationService } from '../services/pushNotificationService';
import type { Notification } from '../types';
import { toast } from 'sonner';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, requestPushPermission, pushPermission } = useNotification();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const handleOpenNotification = async (notif: Notification) => {
    setSelectedNotification(notif);
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'mentions') return n.type === 'MENTION' || n.type === 'REVISION_REQUEST';
    return true;
  });

  const mentionsCount = notifications.filter(
    (n) => n.type === 'MENTION' || n.type === 'REVISION_REQUEST'
  ).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK':
        return {
          icon: ClipboardList,
          color: 'text-[var(--accent-primary)]',
          bg: 'bg-[var(--accent-subtle)] border border-[var(--accent-border)]',
        };
      case 'STATUS':
        return {
          icon: RefreshCw,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border border-blue-500/30',
        };
      case 'MENTION':
      case 'REVISION_REQUEST':
        return {
          icon: AtSign,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border border-amber-500/30',
        };
      case 'FILE':
        return {
          icon: FileText,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border border-emerald-500/30',
        };
      case 'MILESTONE':
        return {
          icon: Flag,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border border-emerald-500/30',
        };
      default:
        return {
          icon: Flag,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10 border border-slate-500/30',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {t('notifications.title', 'Notifications')}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {t('notifications.subtitle', 'Pantau aktivitas proyek, penugasan tugas baru, dan pengumuman sistem secara real-time.')}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>{t('notifications.markAllRead', 'Tandai Semua Dibaca')} ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Push Notification Integration Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            pushPermission === 'granted'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500'
              : 'bg-orange-500/15 border border-orange-500/30 text-[#F58320]'
          }`}>
            {pushPermission === 'granted' ? <BellRing className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Push Notification Web & PWA
              </span>
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                pushPermission === 'granted'
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              }`}>
                {pushPermission === 'granted' ? 'Aktif' : 'Belum Aktif'}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {pushPermission === 'granted'
                ? 'Notifikasi tugas baru, status proyek, dan pesan chat akan muncul langsung di browser dan lockscreen PWA.'
                : 'Aktifkan izin notifikasi browser agar selalu menerima pemberitahuan realtime bahkan saat tab ditutup.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {pushPermission !== 'granted' ? (
            <button
              type="button"
              onClick={async () => {
                const res = await requestPushPermission();
                if (res === 'granted') {
                  toast.success('Push notification berhasil diaktifkan!');
                  pushNotificationService.sendNotification({
                    title: 'SDK Hub - Push Notifikasi Aktif',
                    body: 'Notifikasi sistem dan chat sekarang akan masuk langsung ke perangkat Anda.',
                    url: '/notifications'
                  });
                } else {
                  toast.error('Izin notifikasi ditolak oleh browser.');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Aktifkan Notifikasi</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                pushNotificationService.sendNotification({
                  title: 'SDK Hub Test Push Notification',
                  body: 'Uji coba berhasil! Notifikasi realtime siap menerima pesan chat dan update proyek.',
                  url: '/notifications'
                });
                toast.success('Notifikasi uji coba dikirim!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F58320]" />
              <span>Uji Coba Push</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Filter Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{t('notifications.tabAll', 'Semua')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-mono">
              {notifications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'unread'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{t('notifications.tabUnread', 'Belum Dibaca')}</span>
            {unreadCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold border border-[var(--accent-border)] font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mentions')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mentions'
                ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-bold'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span>{t('notifications.tabMentions', 'Mentions & Request')}</span>
            {mentionsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-mono">
                {mentionsCount}
              </span>
            )}
          </button>
        </div>

        <div className="text-[11px] text-[var(--text-muted)] pb-2 sm:pb-0">
          {t('notifications.syncInfo', 'Sync otomatis dengan database • Klik untuk baca')}
        </div>
      </div>

      {/* Notification Items List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
            <span>{t('common.loading', 'Memuat notifikasi...')}</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-12 text-center text-xs text-[var(--text-muted)]">
            {t('notifications.emptyDesc', 'Tidak ada notifikasi dalam kategori ini')}
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const { icon: Icon, color, bg } = getNotificationIcon(notif.type);

            return (
              <div
                key={notif.id}
                onClick={() => handleOpenNotification(notif)}
                className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  !notif.is_read
                    ? 'bg-[var(--bg-surface-elevated)] border-[var(--border-light)] hover:border-[var(--accent-primary)] shadow-xs'
                    : 'bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--border-light)] opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Icon Box */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>

                  {/* Body */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {notif.title}
                      </h2>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0 animate-pulse" />
                      )}
                      <span className="text-[11px] text-[var(--text-muted)]">
                        • {new Date(notif.created_at || '').toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-[11px]">
                      <span className="font-semibold text-[var(--text-muted)] uppercase tracking-wider text-[10px]">
                        {notif.type}
                      </span>
                      {notif.entity_type && (
                        <span className="text-[var(--text-secondary)]">
                          Ref: {notif.entity_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  <span className="text-xs font-semibold text-[var(--accent-primary)] flex items-center gap-1">
                    Detail <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Context Right Slide-over Drawer */}
      <Drawer
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Detail Notifikasi"
        subtitle={selectedNotification?.title || 'Notification Context'}
      >
        {selectedNotification && (
          <div className="p-6 space-y-6">
            {/* Status Pill */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                Status Pembacaan
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sudah Dibaca (Tersimpan di Database)
              </span>
            </div>

            {/* Notification Message */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Isi Pesan
              </span>
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] leading-relaxed">
                {selectedNotification.message}
              </div>
            </div>

            {/* Technical Metadata */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {t('notifications.entityInfo', 'Informasi Entitas')}
              </span>
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">{t('notifications.categoryType', 'Kategori Tipe')}</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedNotification.type}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">{t('notifications.receivedTime', 'Waktu Diterima')}</span>
                  <span className="font-mono text-[11px] text-[var(--text-primary)]">
                    {new Date(selectedNotification.created_at || '').toLocaleString()}
                  </span>
                </div>
                {selectedNotification.entity_type && (
                  <div className="flex justify-between py-1 border-b border-[var(--border-subtle)]">
                    <span className="text-[var(--text-secondary)]">Entity Type</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedNotification.entity_type}
                    </span>
                  </div>
                )}
                {selectedNotification.entity_id && (
                  <div className="flex justify-between py-1">
                    <span className="text-[var(--text-secondary)]">Entity ID</span>
                    <span className="font-mono text-[10px] text-[var(--text-muted)] truncate max-w-[180px]">
                      {selectedNotification.entity_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Jump Navigation */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedNotification(null);
                  if (selectedNotification.type === 'TASK') {
                    navigate('/kanban');
                  } else if (selectedNotification.type === 'MILESTONE') {
                    navigate('/cockpit');
                  } else {
                    navigate('/projects');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                <span>{t('notifications.openRelated', 'Buka Halaman Terkait')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
