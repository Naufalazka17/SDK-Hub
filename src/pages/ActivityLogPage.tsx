import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Search, Filter, RefreshCw, FolderKanban, 
  CheckSquare, FileText, Clock, MessageSquare, Building2, 
  UserCheck, ChevronDown, ChevronUp, Database, ArrowUpDown,
  Download, Eye, ShieldCheck
} from 'lucide-react';
import { activityService } from '../services/activityService';
import { projectService } from '../services/projectService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ActivityLogWithDetails, ProjectWithDetails } from '../types';

export const ActivityLogPage: React.FC = () => {
  const { language } = useLanguage();
  const { role } = useAuth();
  const isId = language === 'id';
  const [logs, setLogs] = useState<ActivityLogWithDetails[]>([]);
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const fetchLogs = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setIsLoading(true);

      const [logsData, projectsData] = await Promise.all([
        activityService.getActivityLogs(undefined, 200, role),
        projectService.getProjects(),
      ]);

      setLogs(logsData);
      setProjects(projectsData);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLogIds(new Set(filteredLogs.map(l => l.id)));
  };

  const collapseAll = () => {
    setExpandedLogIds(new Set());
  };

  // Filter and Sort
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // Role check: If viewer is PROJECT_LEAD, hide logs created by or involving ADMIN
        if (role === 'PROJECT_LEAD' && log.actor?.role_id === 'ADMIN') {
          return false;
        }

        // Project filter
        if (selectedProjectId !== 'ALL' && log.project_id !== selectedProjectId) {
          return false;
        }

        // Entity type filter
        if (selectedEntity !== 'ALL') {
          const entity = (log.entity_type || '').toLowerCase();
          if (selectedEntity === 'task' && !entity.includes('task')) return false;
          if (selectedEntity === 'project' && !entity.includes('project')) return false;
          if (selectedEntity === 'file' && !entity.includes('file')) return false;
          if (selectedEntity === 'time' && !entity.includes('time') && !entity.includes('attendance')) return false;
          if (selectedEntity === 'chat' && !entity.includes('chat') && !entity.includes('message')) return false;
          if (selectedEntity === 'client' && !entity.includes('client')) return false;
          if (selectedEntity === 'revision' && !entity.includes('revision') && !entity.includes('approval')) return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const actionText = (log.action || '').toLowerCase();
          const actorName = (log.actor?.full_name || '').toLowerCase();
          const actorRole = (log.actor?.role_id || '').toLowerCase();
          const projectTitle = (log.project?.title || '').toLowerCase();
          const entityType = (log.entity_type || '').toLowerCase();
          const detailsStr = JSON.stringify(log.details || {}).toLowerCase();

          return (
            actionText.includes(q) ||
            actorName.includes(q) ||
            actorRole.includes(q) ||
            projectTitle.includes(q) ||
            entityType.includes(q) ||
            detailsStr.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, selectedProjectId, selectedEntity, searchTerm, sortOrder]);

  // Metric stats
  const metrics = useMemo(() => {
    const total = logs.length;
    const uniqueActors = new Set(logs.map(l => l.actor_id).filter(Boolean)).size;
    const taskActions = logs.filter(l => (l.entity_type || '').toLowerCase().includes('task')).length;
    const projectActions = logs.filter(l => (l.entity_type || '').toLowerCase().includes('project')).length;
    return { total, uniqueActors, taskActions, projectActions };
  }, [logs]);

  // Helpers
  const getEntityIcon = (entityType: string) => {
    const et = (entityType || '').toLowerCase();
    if (et.includes('task')) return <CheckSquare className="w-4 h-4 text-sky-400" />;
    if (et.includes('project')) return <FolderKanban className="w-4 h-4 text-indigo-400" />;
    if (et.includes('file')) return <FileText className="w-4 h-4 text-emerald-400" />;
    if (et.includes('time') || et.includes('attendance')) return <Clock className="w-4 h-4 text-amber-400" />;
    if (et.includes('chat') || et.includes('message')) return <MessageSquare className="w-4 h-4 text-purple-400" />;
    if (et.includes('client')) return <Building2 className="w-4 h-4 text-teal-400" />;
    if (et.includes('profile') || et.includes('user')) return <UserCheck className="w-4 h-4 text-pink-400" />;
    return <Activity className="w-4 h-4 text-[var(--accent-primary)]" />;
  };

  const getActionBadgeColor = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('delete') || act.includes('remove') || act.includes('reject')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
    if (act.includes('create') || act.includes('add') || act.includes('approve') || act.includes('success')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (act.includes('update') || act.includes('edit') || act.includes('move') || act.includes('status')) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
    if (act.includes('warn') || act.includes('alert') || act.includes('revision')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
    return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
  };

  const formatTimestamp = (dateString: string | null) => {
    if (!dateString) return { relative: isId ? 'Baru saja' : 'Just now', full: '-' };
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let relative = '';
    if (diffMins < 1) relative = isId ? 'Baru saja' : 'Just now';
    else if (diffMins < 60) relative = isId ? `${diffMins} mnt lalu` : `${diffMins}m ago`;
    else if (diffHours < 24) relative = isId ? `${diffHours} jam lalu` : `${diffHours}h ago`;
    else if (diffDays < 7) relative = isId ? `${diffDays} hr lalu` : `${diffDays}d ago`;
    else relative = date.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });

    const full = date.toLocaleString(isId ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return { relative, full };
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sdk-activity-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider flex-wrap">
            <ShieldCheck className="w-4 h-4" />
            <span>{isId ? 'Audit & Tata Kelola' : 'Audit & Governance'}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border normal-case font-mono ${
              role === 'ADMIN'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            }`}>
              {role === 'ADMIN' 
                ? (isId ? 'Cakupan: Seluruh Sistem (Penuh)' : 'Scope: System-Wide (Full)')
                : (isId ? 'Cakupan: Tim Non-Admin' : 'Scope: Non-Admin Team')}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mt-1 flex items-center gap-3">
            {isId ? 'Activity Audit Log' : 'Activity Audit Log'}
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-mono">
              {filteredLogs.length} {isId ? 'Events' : 'Events'}
            </span>
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isId
              ? 'Riwayat log audit terintegrasi untuk pemantauan alokasi, progres tugas, persetujuan klien, dan tata kelola sistem SDK.'
              : 'Integrated audit log history for monitoring allocations, task progress, client approvals, and SDK system governance.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-xs cursor-pointer"
            title={isId ? 'Ekspor JSON' : 'Export JSON'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isId ? 'Export' : 'Export'}</span>
          </button>
          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isId ? 'Refresh' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Total Log Recorded</span>
            <Activity className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2 font-mono">
            {metrics.total}
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {isId ? 'Aktivitas tersimpan di database' : 'Activities stored in database'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Active Actors</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2 font-mono">
            {metrics.uniqueActors}
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {isId ? 'User melakukan aksi audit' : 'Users performing audit actions'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Task Workflow Events</span>
            <CheckSquare className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2 font-mono">
            {metrics.taskActions}
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {isId ? 'Perubahan status & kanban' : 'Status & kanban changes'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Project Milestones</span>
            <FolderKanban className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-[var(--text-primary)] mt-2 font-mono">
            {metrics.projectActions}
          </div>
          <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {isId ? 'Inisiasi & modifikasi proyek' : 'Project initiation & modifications'}
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isId ? 'Cari aktor, tindakan, judul proyek, atau payload...' : 'Search actor, action, project title, or payload...'}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent-primary)] focus:outline-hidden text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
          </div>

          {/* Project dropdown */}
          <div className="w-full md:w-56">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              aria-label="Filter Proyek"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] focus:border-[var(--accent-primary)] focus:outline-hidden text-xs text-[var(--text-primary)]"
            >
              <option value="ALL">{isId ? 'Semua Proyek' : 'All Projects'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code ? `[${p.code}] ` : ''}{p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] hover:border-[var(--border-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 cursor-pointer"
            title={isId ? 'Urutkan Waktu' : 'Sort Time'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              {sortOrder === 'desc'
                ? (isId ? 'Terbaru Dulu' : 'Newest First')
                : (isId ? 'Terlama Dulu' : 'Oldest First')}
            </span>
          </button>
        </div>

        {/* Category Pills & Expand All */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-[var(--text-tertiary)] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> {isId ? 'Kategori:' : 'Category:'}
            </span>
            {[
              { id: 'ALL', label: isId ? 'Semua Kategori' : 'All Categories' },
              { id: 'task', label: 'Tasks' },
              { id: 'project', label: 'Projects' },
              { id: 'time', label: isId ? 'Presensi / Jam' : 'Attendance / Time' },
              { id: 'file', label: isId ? 'Berkas' : 'Files' },
              { id: 'chat', label: 'Chat' },
              { id: 'client', label: 'Client' },
              { id: 'revision', label: isId ? 'Revisi & Approval' : 'Revisions & Approvals' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedEntity(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  selectedEntity === cat.id
                    ? 'bg-[var(--accent-primary)] text-white font-semibold shadow-xs'
                    : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="text-[11px] text-[var(--accent-primary)] hover:underline font-medium cursor-pointer"
            >
              {isId ? 'Buka Semua Payload' : 'Expand All Payloads'}
            </button>
            <span className="text-[var(--border-default)]">•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:underline cursor-pointer"
            >
              {isId ? 'Tutup Semua' : 'Collapse All'}
            </button>
          </div>
        </div>
      </div>

      {/* Logs Feed */}
      {isLoading ? (
        <div className="p-12 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="w-8 h-8 border-3 border-[var(--border-default)] border-t-[var(--accent-primary)] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {isId ? 'Memuat riwayat audit log...' : 'Loading audit logs history...'}
          </p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <Activity className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {isId ? 'Tidak ada log aktivitas ditemukan' : 'No activity logs found'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
            {isId
              ? 'Tidak ada aktivitas yang sesuai dengan kriteria filter atau pencarian Anda saat ini.'
              : 'No activities match your current filter or search criteria.'}
          </p>
          {(searchTerm || selectedEntity !== 'ALL' || selectedProjectId !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedEntity('ALL');
                setSelectedProjectId('ALL');
              }}
              className="mt-4 px-3 py-1.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-subtle)] transition-colors cursor-pointer"
            >
              {isId ? 'Reset Filter' : 'Reset Filters'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const timeInfo = formatTimestamp(log.created_at);
            const isExpanded = expandedLogIds.has(log.id);
            const hasDetails = log.details && Object.keys(log.details).length > 0;

            return (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-hover)] transition-all shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Avatar & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Actor Avatar or Icon */}
                    <div className="relative shrink-0 mt-0.5">
                      {log.actor?.avatar_url ? (
                        <img
                          src={log.actor.avatar_url}
                          alt={log.actor.full_name || 'User'}
                          className="w-9 h-9 rounded-full object-cover border border-[var(--border-default)]"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-bold text-xs flex items-center justify-center">
                          {log.actor?.full_name ? log.actor.full_name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)]">
                        {getEntityIcon(log.entity_type)}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          {log.actor?.full_name || 'Sistem Otomatis (SDK System)'}
                        </span>
                        {log.actor?.role_id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)] font-semibold uppercase">
                            {log.actor.role_id.replace('_', ' ')}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </div>

                      {/* Main Message / Action summary */}
                      <p className="text-xs text-[var(--text-primary)] mt-1.5 break-words font-medium">
                        {log.action}
                        {log.entity_type ? (
                          <span className="text-[var(--text-secondary)] font-normal">
                            {' '}pada entitas <span className="font-mono text-[var(--accent-primary)]">{log.entity_type}</span>
                          </span>
                        ) : null}
                      </p>

                      {/* Project Tag & Timestamp */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[var(--text-tertiary)]">
                        {log.project && (
                          <span className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                            <FolderKanban className="w-3 h-3 text-[var(--accent-primary)]" />
                            {log.project.code ? `[${log.project.code}] ` : ''}{log.project.title}
                          </span>
                        )}
                        <span title={timeInfo.full} className="hover:text-[var(--text-secondary)] cursor-help">
                          🕒 {timeInfo.relative} ({timeInfo.full})
                        </span>
                        {log.entity_id && (
                          <span className="font-mono text-[10px]">
                            ID: {log.entity_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Expand Payload Button */}
                  {hasDetails && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(log.id)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] transition-colors cursor-pointer"
                      title="Lihat Detail Payload"
                    >
                      <Eye className="w-3 h-3 text-[var(--accent-primary)]" />
                      <span className="text-[11px] font-medium hidden sm:inline">
                        {isExpanded ? 'Tutup Payload' : 'Payload'}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Expanded Details JSON viewer */}
                {isExpanded && hasDetails && (
                  <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1">
                        <Database className="w-3 h-3 text-[var(--accent-primary)]" />
                        Audit Log Details / Payload
                      </span>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(log.details, null, 2))}
                        className="text-[10px] text-[var(--accent-primary)] hover:underline font-mono cursor-pointer"
                      >
                        Salin JSON
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 text-[11px] font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-60">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
