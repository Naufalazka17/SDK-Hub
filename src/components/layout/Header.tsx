import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Search, Plus, Bell, ChevronDown, Check,
  Menu, Shield, Sun, Moon, PanelLeftClose, PanelLeftOpen,
  LogOut, Settings, ExternalLink, CheckCheck, X, FolderKanban,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { can } from '../../lib/permissions';
import { Role } from '../../types';

interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onToggleMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenNewTask: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleMobileMenu,
  onOpenSearch,
  onOpenNewTask,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProfile, role, switchProfileByRole, logout, isClient } = useAuth();
  const { currentProject, projects, setCurrentProjectId } = useProject();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate dynamic breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const isId = language === 'id';
    if (path === '/' || path === '/dashboard') {
      return [
        { label: 'SDK Hub', to: '/' },
        { label: isId ? 'Dashboard' : 'Dashboard', active: true },
      ];
    }
    if (path === '/projects/new') {
      return [
        { label: 'SDK Hub', to: '/' },
        { label: isId ? 'Proyek' : 'Projects', to: '/projects' },
        { label: isId ? 'Buat Proyek Baru' : 'Create New Project', active: true },
      ];
    }
    if (path.startsWith('/projects/') && path.includes('/board')) {
      return [
        { label: isId ? 'Proyek' : 'Projects', to: '/projects' },
        { label: currentProject?.title || (isId ? 'Rincian Proyek' : 'Project Detail'), to: `/projects/${currentProject?.id || ''}` },
        { label: isId ? 'Papan Orkestrasi' : 'Orchestration Board', active: true },
      ];
    }
    if (path === '/kanban') {
      return [
        { label: isId ? 'Ruang Kerja' : 'Workspace', to: '/' },
        { label: isId ? 'Papan Orkestrasi' : 'Orchestration Board', active: true },
      ];
    }
    if (path.startsWith('/projects/') && path.includes('/timeline') || path === '/timeline') {
      return [
        { label: isId ? 'Proyek' : 'Projects', to: '/projects' },
        { label: currentProject?.title || (isId ? 'Rincian Proyek' : 'Project Detail'), to: `/projects/${currentProject?.id || ''}` },
        { label: isId ? 'Sumber Daya & Jadwal' : 'Resources & Timeline', active: true },
      ];
    }
    if (path.startsWith('/projects/') && path.includes('/cockpit') || path === '/cockpit') {
      return [
        { label: 'SDK Hub', to: '/cockpit' },
        { label: isId ? 'Kokpit Klien' : 'Client Cockpit', active: true },
      ];
    }
    if (path.startsWith('/projects/') && path.includes('/files') || path === '/files') {
      return [
        { label: isId ? 'Proyek' : 'Projects', to: '/projects' },
        { label: isId ? 'Gudang Berkas' : 'Files Repository', active: true },
      ];
    }
    if (path.startsWith('/projects/')) {
      return [
        { label: isId ? 'Proyek' : 'Projects', to: '/projects' },
        { label: currentProject?.title || (isId ? 'Ringkasan Proyek' : 'Project Overview'), active: true },
      ];
    }
    if (path === '/projects') {
      return [
        { label: 'SDK Hub', to: '/' },
        { label: isId ? 'Daftar Proyek' : 'Projects Directory', active: true },
      ];
    }
    if (path === '/users') {
      return [
        { label: isId ? 'Manajemen' : 'Management', to: '/' },
        { label: isId ? 'Manajemen Pengguna' : 'Users Directory', active: true },
      ];
    }
    if (path === '/resources') {
      return [
        { label: isId ? 'Ruang Kerja' : 'Workspace', to: '/' },
        { label: isId ? 'Manajemen Sumber Daya' : 'Resources Directory', active: true },
      ];
    }
    if (path === '/reports') {
      return [
        { label: isId ? 'Manajemen' : 'Management', to: '/' },
        { label: isId ? 'Laporan & Analitik' : 'Reports & Analytics', active: true },
      ];
    }
    if (path === '/notifications') {
      return [
        { label: isId ? 'Ruang Kerja' : 'Workspace', to: '/' },
        { label: isId ? 'Notifikasi' : 'Notifications', active: true },
      ];
    }
    if (path === '/settings') {
      return [
        { label: isId ? 'Ruang Kerja' : 'Workspace', to: '/' },
        { label: isId ? 'Pengaturan' : 'Settings', active: true },
      ];
    }
    if (path === '/chat') {
      return [
        { label: isId ? 'Ruang Kerja' : 'Workspace', to: '/' },
        { label: 'Chat', active: true },
      ];
    }
    if (path === '/clients') {
      return [
        { label: isId ? 'Manajemen' : 'Management', to: '/' },
        { label: isId ? 'Manajemen Klien' : 'Clients Directory', active: true },
      ];
    }
    if (path === '/templates') {
      return [
        { label: isId ? 'Manajemen' : 'Management', to: '/' },
        { label: isId ? 'Template Alur Kerja' : 'Project Templates', active: true },
      ];
    }
    if (path === '/activity') {
      return [
        { label: isId ? 'Manajemen' : 'Management', to: '/' },
        { label: isId ? 'Log Audit Aktivitas' : 'Activity Audit Log', active: true },
      ];
    }
    if (path === '/time-tracking') {
      return [
        { label: isId ? 'Ruang Kerja' : 'Workspace', to: '/' },
        { label: isId ? 'Presensi Jam Kerja' : 'Time Tracking & Timesheet', active: true },
      ];
    }
    return [
      { label: 'SDK Hub', to: '/' },
      { label: isId ? 'Ruang Kerja' : 'Workspace', active: true },
    ];
  };

  const breadcrumbs = getBreadcrumbs();
  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="h-16 px-2.5 sm:px-4 lg:px-6 bg-[var(--bg-header)] border-b border-[var(--border-default)] flex items-center justify-between sticky top-0 z-30 min-w-0">
      {/* Left Area: Sidebar Toggle & Dynamic Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Desktop Sidebar Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? (language === 'id' ? 'Buka Sidebar' : 'Open Sidebar') : (language === 'id' ? 'Tutup Sidebar' : 'Collapse Sidebar')}
            className="hidden lg:flex p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors shrink-0"
          aria-label="Open mobile navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Selector Dropdown (Point 5) */}
        <div className="relative" ref={projectRef}>
          <button
            type="button"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-colors text-xs text-[var(--text-primary)] max-w-[120px] xs:max-w-[150px] sm:max-w-[280px] shadow-2xs group"
            title={language === 'id' ? 'Pilih Proyek Aktif' : 'Select Active Project'}
          >
            <FolderKanban className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
            <span className="font-mono font-bold text-[var(--accent-primary)] truncate max-w-[70px] xs:max-w-[100px] sm:max-w-none">
              {currentProject?.code || 'PRJ'}
            </span>
            <span className="truncate font-semibold hidden sm:inline text-[var(--text-primary)]">
              {currentProject?.title || (language === 'id' ? 'Pilih Proyek...' : 'Select Project...')}
            </span>
            <ChevronDown className="w-3 h-3 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 ml-auto transition-transform" />
          </button>

          {isProjectDropdownOpen && (
            <div className="fixed inset-x-3 sm:absolute sm:left-0 sm:inset-x-auto mt-1.5 sm:w-84 max-w-sm bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="p-2.5 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
                <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>{language === 'id' ? 'Pilih Proyek Aktif' : 'Select Active Project'}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">{projects.length} {language === 'id' ? 'Proyek' : 'Projects'}</span>
                </div>
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder={language === 'id' ? 'Cari kode atau judul proyek...' : 'Search project code or title...'}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                {projects
                  .filter((p) =>
                    p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
                    p.code.toLowerCase().includes(projectSearch.toLowerCase())
                  )
                  .map((p) => {
                    const isSelected = p.id === currentProject?.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setCurrentProjectId(p.id);
                          setIsProjectDropdownOpen(false);
                          toast.success(language === 'id' ? `Proyek aktif: ${p.code} • ${p.title}` : `Active project: ${p.code} • ${p.title}`);
                          const pathname = location.pathname;
                          if (pathname.includes('/projects/') && pathname.includes('/board')) {
                            navigate(`/projects/${p.id}/board`);
                          } else if (pathname.includes('/projects/') && pathname.includes('/timeline')) {
                            navigate(`/projects/${p.id}/timeline`);
                          } else if (pathname.includes('/projects/') && pathname.includes('/cockpit')) {
                            navigate(`/projects/${p.id}/cockpit`);
                          } else if (pathname.includes('/projects/') && pathname.includes('/files')) {
                            navigate(`/projects/${p.id}/files`);
                          }
                        }}
                        className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition-colors text-xs ${
                          isSelected 
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-bold border border-[var(--accent-border)]' 
                            : 'hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <div className="w-6 h-6 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-center font-mono text-[10px] font-bold text-[var(--accent-primary)] shrink-0">
                          {p.code.slice(-2)}
                        </div>
                        <div className="truncate flex-1">
                          <div className="text-[var(--text-primary)] font-semibold truncate">{p.title}</div>
                          <div className="text-[10px] text-[var(--text-muted)] truncate">
                            {p.code} • {(p as any).client?.name || 'Internal SDK'}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Route Indicator */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-secondary)] truncate">
          <span className="text-[var(--text-muted)] text-[11px]">/</span>
          {breadcrumbs.filter((_, idx) => idx > 0).map((crumb, idx) => (
            <React.Fragment key={crumb.label + idx}>
              {idx > 0 && <span className="text-[var(--text-muted)] text-[11px]">/</span>}
              {crumb.active ? (
                <span className="font-semibold text-[var(--text-primary)] truncate">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to || '#'}
                  className="hover:text-[var(--text-primary)] transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Area: Search, Theme Switcher, Notifications, Quick Actions, Profile */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Search Bar Input (⌘K) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] hover:border-[var(--border-light)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-xs w-44 lg:w-56"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t('header.searchPlaceholder', 'Search projects, tasks...')}</span>
          <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
            ⌘K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="sm:hidden p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Language Switcher (ID / EN) */}
        <button
          type="button"
          onClick={toggleLanguage}
          title={language === 'id' ? 'Ganti ke Bahasa Inggris (Switch to English)' : 'Switch to Indonesian (Ganti ke Bahasa Indonesia)'}
          className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] font-bold bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-mono cursor-pointer"
          aria-label="Toggle language"
        >
          <Languages className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
          <span className="uppercase tracking-wider">{language}</span>
        </button>

        {/* Theme Switcher (Sun / Moon) */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Ganti tema (Saat ini: ${theme})`}
          className="p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
          aria-label="Toggle color theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            title={t('header.notifications', 'Notifications')}
            className="relative p-1.5 sm:p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer"
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent-primary)] ring-2 ring-[var(--bg-header)] animate-pulse" />
            )}
          </button>

          {/* Notifications Quick Popup */}
          {isNotifDropdownOpen && (
            <div className="fixed inset-x-3 sm:absolute sm:right-0 sm:inset-x-auto mt-2 sm:w-96 max-w-sm ml-auto bg-[var(--bg-surface-elevated)] rounded-xl shadow-2xl border border-[var(--border-default)] overflow-hidden z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface)]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                    {t('header.notifications', 'Notifications')}
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] font-semibold border border-[var(--accent-border)] font-mono shrink-0">
                      {unreadCount} {t('header.unread', 'unread')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-medium mr-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>{t('header.markAllRead', 'Mark all read')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNotifDropdownOpen(false)}
                    className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer ml-1"
                    title={t('header.closeNotifications', 'Tutup notifikasi')}
                    aria-label={t('header.closeNotifications', 'Tutup notifikasi')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    {t('header.noNotifications', 'Tidak ada notifikasi baru')}
                  </div>
                ) : (
                  recentNotifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={async () => {
                        await markAsRead(n.id);
                        setIsNotifDropdownOpen(false);
                        navigate('/notifications');
                      }}
                      className={`p-3 text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                        !n.is_read
                          ? 'bg-[var(--accent-subtle)]/30 hover:bg-[var(--accent-subtle)]/50'
                          : 'hover:bg-[var(--bg-surface-subtle)]'
                      }`}
                    >
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                          {n.message}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">
                          {new Date(n.created_at || '').toLocaleDateString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
                <Link
                  to="/notifications"
                  onClick={() => setIsNotifDropdownOpen(false)}
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline block py-1"
                >
                  {t('header.viewAllNotifications', 'Lihat Semua Notifikasi →')}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Role-Specific Quick Action (Admin/Lead/Staff: New Task, Hidden for Client) */}
        {can(role, 'task:create') && !isClient && (
          <button
            onClick={onOpenNewTask}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('header.newTask', 'New Task')}</span>
          </button>
        )}

        {/* User Profile Card & Role Switcher */}
        <div className="relative" ref={profileRef}>
          <button
            id="header-profile-trigger"
            type="button"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 sm:pr-2 rounded-lg hover:bg-[var(--bg-surface-subtle)] transition-colors text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 border border-[var(--border-light)] shrink-0 flex items-center justify-center font-bold text-xs text-white">
              {currentProfile?.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.full_name || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentProfile?.full_name?.substring(0, 2).toUpperCase() || 'UB'
              )}
            </div>

            <div className="hidden lg:flex flex-col">
              <span className="text-xs font-semibold text-[var(--text-primary)] leading-tight truncate">
                {currentProfile?.full_name || 'David Chen'}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] leading-none">
                {role}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
          </button>

          {/* Profile Dropdown */}
          {isProfileDropdownOpen && (
            <div className="fixed inset-x-3 sm:absolute sm:right-0 sm:inset-x-auto mt-2 sm:w-64 max-w-xs ml-auto bg-[var(--bg-surface-elevated)] rounded-xl shadow-2xl border border-[var(--border-default)] py-2 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-[var(--border-default)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--accent-primary)] border-2 border-[var(--border-default)] flex items-center justify-center font-bold text-xs text-white shrink-0">
                    {currentProfile?.avatar_url ? (
                      <img
                        src={currentProfile.avatar_url}
                        alt={currentProfile.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      currentProfile?.full_name?.substring(0, 2).toUpperCase() || 'UB'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {currentProfile?.full_name || 'Arya Subaga'}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {currentProfile?.email || 'arya.admin@subaga.id'}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-mono">
                    {role}
                  </span>
                  {currentProfile?.department && (
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      • {currentProfile.department}
                    </span>
                  )}
                </div>
              </div>

              {/* Account Actions */}
              <div className="pt-2 px-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] rounded-lg transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span>{t('header.accountSettings', 'Account & Settings')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>{t('header.logout', 'Sign Out (Keluar)')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
