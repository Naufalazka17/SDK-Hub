import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Folder, Users, 
  BarChart2, Bell, Settings,
  Code, Building2, GanttChart, FolderArchive,
  ChevronLeft, ChevronRight, Activity, MessageSquare,
  LayoutTemplate, Clock, CheckSquare, Layers, Globe, X,
  ArrowDownToLine
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { can } from '../../lib/permissions';
import { toast } from 'sonner';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false, 
  onToggleCollapse, 
  onCloseMobile 
}) => {
  const { role, isClient } = useAuth();
  const { unreadCount, unreadChatCount } = useNotification();
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = () => {
    navigate('/download');
    if (onCloseMobile) onCloseMobile();
  };

  const chatBadgeText = unreadChatCount > 0 ? (unreadChatCount > 99 ? '99+' : String(unreadChatCount)) : undefined;
  const notifBadgeText = unreadCount > 0 ? (unreadCount > 99 ? '99+' : String(unreadCount)) : undefined;

  // 1. Core Links
  const coreLinks = isClient ? [] : [
    { 
      to: '/', 
      label: role === 'STAFF' 
        ? (language === 'id' ? 'Dashboard Staf' : 'Staff Dashboard') 
        : role === 'PROJECT_LEAD' 
          ? (language === 'id' ? 'Pusat Project Lead' : 'Project Lead Hub') 
          : (language === 'id' ? 'Dashboard Eksekutif' : 'Executive Dashboard'), 
      icon: LayoutDashboard, 
      exact: true 
    },
  ];

  // 2. Project Workspace Links (Per-Project)
  let projectWorkspaceLinks: any[] = [];
  if (isClient) {
    projectWorkspaceLinks = [
      { to: '/cockpit', label: t('nav.cockpit', 'Kokpit Klien'), icon: Building2 },
    ];
  } else {
    projectWorkspaceLinks = [
      { to: '/kanban', label: t('nav.kanban', 'Papan Orkestrasi'), icon: CheckSquare },
      { to: '/timeline', label: t('nav.timeline', 'Jadwal Proyek'), icon: GanttChart, exact: true },
      ...(role === 'ADMIN' || role === 'PROJECT_LEAD' ? [{ to: '/cockpit', label: t('nav.cockpit', 'Kokpit Klien'), icon: Building2 }] : []),
      { to: '/files', label: t('nav.files', 'Berkas & Dokumen'), icon: FolderArchive },
    ];
  }

  // 3. General Operations Links (Menu Umum)
  let generalLinks: any[] = [];
  if (isClient) {
    generalLinks = [
      { 
        to: '/chat', 
        label: t('nav.projectChat', 'Chat Proyek'), 
        icon: MessageSquare,
        badge: chatBadgeText,
      },
    ];
  } else {
    const timeTrackingLabel = role === 'ADMIN'
      ? (language === 'id' ? 'Riwayat Presensi Lengkap' : 'All Attendance History')
      : role === 'PROJECT_LEAD'
      ? (language === 'id' ? 'Riwayat Presensi Tim' : 'Team Attendance')
      : (language === 'id' ? 'Riwayat Presensi Saya' : 'My Attendance');

    generalLinks = [
      { to: '/timeline/global', label: t('nav.globalTimeline', 'Timeline Global'), icon: Globe },
      { 
        to: '/chat', 
        label: t('nav.chat', 'Chat'), 
        icon: MessageSquare,
        badge: chatBadgeText,
      },
      ...(role === 'ADMIN' || role === 'PROJECT_LEAD' ? [
        { to: '/resources', label: t('nav.resources', 'Resources & Tim'), icon: Users },
      ] : []),
      { to: '/time-tracking', label: timeTrackingLabel, icon: Clock },
    ];
  }

  // 4. Governance & Management Links (Admin & Project Lead)
  let managementLinks: any[] = [];
  if (role === 'ADMIN') {
    managementLinks = [
      { to: '/clients', label: t('nav.clients', 'Manajemen Klien'), icon: Building2 },
      { to: '/templates', label: t('nav.templates', 'Workflow Templates'), icon: LayoutTemplate },
      { to: '/activity', label: t('nav.activity', 'Activity Audit Log'), icon: Activity },
      { to: '/users', label: t('nav.users', 'Manajemen Pengguna'), icon: Users },
      { to: '/reports', label: t('nav.reports', 'Laporan & Analytics'), icon: BarChart2 },
    ];
  } else if (role === 'PROJECT_LEAD') {
    managementLinks = [
      { to: '/clients', label: t('nav.clients', 'Manajemen Klien'), icon: Building2 },
      { to: '/templates', label: t('nav.templates', 'Workflow Templates'), icon: LayoutTemplate },
      { to: '/activity', label: t('nav.activity', 'Activity Audit Log'), icon: Activity },
      { to: '/reports', label: t('nav.reports', 'Laporan & Analytics'), icon: BarChart2 },
    ];
  }

  // 5. System Links
  const otherLinks = [
    { 
      to: '/notifications', 
      label: t('nav.notifications', 'Notifikasi'), 
      icon: Bell, 
      badge: notifBadgeText,
    },
    { to: '/settings', label: t('nav.settings', 'Pengaturan'), icon: Settings },
  ];

  const renderNavLink = (link: any) => {
    const Icon = link.icon;
    const isActive = link.exact
      ? location.pathname === link.to
      : location.pathname.startsWith(link.to);

    return (
      <NavLink
        key={link.to}
        to={link.to}
        title={isCollapsed ? `${link.label} ${link.badge ? `(${link.badge})` : ''}` : undefined}
        onClick={onCloseMobile}
        className={`relative flex items-center rounded-lg text-xs font-medium transition-all ${
          isCollapsed 
            ? 'justify-center p-2.5' 
            : 'gap-2.5 px-3 py-2'
        } ${
          isActive
            ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-bold shadow-xs'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] border border-transparent'
        }`}
      >
        <div className="relative shrink-0 flex items-center justify-center">
          <Icon className="w-4 h-4" />
          {isCollapsed && link.badge && (
            <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center font-mono ring-2 ring-[var(--bg-sidebar)] animate-pulse">
              {link.badge}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <>
            <span className="truncate flex-1">{link.label}</span>
            {link.badge && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono tracking-tight shadow-2xs animate-pulse">
                {link.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <aside 
      className={`h-full flex flex-col justify-between bg-[var(--bg-sidebar)] border-r border-[var(--border-default)] select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Top Section: Logo Branding */}
      <div>
        <div className={`h-14 px-3.5 flex items-center border-b border-[var(--border-default)] ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          <NavLink to={isClient ? "/cockpit" : "/"} className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-xs font-mono font-bold text-sm shrink-0">
              <Code className="w-4 h-4" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                  SDK Hub
                </span>
              </div>
            )}
          </NavLink>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-mono font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                v2.5
              </span>
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="p-2 space-y-3.5 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
          {/* Section: CORE */}
          {coreLinks.length > 0 && (
            <div className="space-y-1">
              {coreLinks.map(renderNavLink)}
            </div>
          )}

          {/* Section: PROJECT WORKSPACE (Per-Project) */}
          {projectWorkspaceLinks.length > 0 && (
            <div>
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('nav.section.project', 'Project Workspace')}
                </div>
              )}
              <div className="space-y-1 mt-0.5">
                {projectWorkspaceLinks.map(renderNavLink)}
              </div>
            </div>
          )}

          {/* Section: GENERAL OPERATIONS */}
          {generalLinks.length > 0 && (
            <div>
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('nav.section.general', 'General & Operations')}
                </div>
              )}
              <div className="space-y-1 mt-0.5">
                {generalLinks.map(renderNavLink)}
              </div>
            </div>
          )}

          {/* Section: MANAGEMENT */}
          {managementLinks.length > 0 && (
            <div>
              {!isCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {t('nav.section.governance', 'Tata Kelola')}
                </div>
              )}
              <div className="space-y-1 mt-0.5">
                {managementLinks.map(renderNavLink)}
              </div>
            </div>
          )}

          {/* Section: OTHER */}
          <div>
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {t('nav.section.system', 'System')}
              </div>
            )}
            <div className="space-y-1 mt-0.5">
              {otherLinks.map(renderNavLink)}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Section: PWA Install & Collapse Toggle */}
      <div className="p-3 border-t border-[var(--border-default)] space-y-1.5">
        {!isInstalled && (
          <button
            type="button"
            onClick={handleInstallClick}
            className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isCollapsed
                ? 'justify-center p-2 text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)]'
                : 'gap-2 px-2.5 py-1.5 bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] hover:bg-[var(--accent-subtle)]/80'
            }`}
            title={language === 'id' ? 'Unduh / Pasang Aplikasi (PWA)' : 'Download / Install App (PWA)'}
          >
            <ArrowDownToLine className="w-4 h-4 shrink-0" />
            {!isCollapsed && (
              <span className="truncate">
                {language === 'id' ? 'Unduh Aplikasi (PWA)' : 'Download App (PWA)'}
              </span>
            )}
          </button>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors text-xs cursor-pointer"
            title={isCollapsed ? (language === 'id' ? 'Perluas Sidebar' : 'Expand Sidebar') : (language === 'id' ? 'Ciutkan Sidebar' : 'Collapse Sidebar')}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 w-full justify-start px-1">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] font-medium">{language === 'id' ? 'Ciutkan Sidebar' : 'Collapse Sidebar'}</span>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
};
