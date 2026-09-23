import React, { useState, useEffect } from 'react';
import { 
  Clock, History, BarChart3, Play, Square, Calendar, 
  User, CheckCircle2, AlertTriangle, ArrowUpRight 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { timeTrackingService } from '../services/timeTrackingService';
import { activityService } from '../services/activityService';
import { taskService } from '../services/taskService';
import { TimeEntry, ActivityLogWithDetails, TaskWithDetails } from '../types';

export const TimeTrackingReportsPage: React.FC = () => {
  const { currentProject } = useProject();
  const { currentProfile, role } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'TIMESHEET' | 'ACTIVITY' | 'ANALYTICS'>('TIMESHEET');
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [activities, setActivities] = useState<ActivityLogWithDetails[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);

  // Manual Clock In Form
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [notes, setNotes] = useState('');
  const [isClocking, setIsClocking] = useState(false);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);

  const loadData = async () => {
    try {
      const [rawEntries, rawActs, taskList] = await Promise.all([
        timeTrackingService.getTimeEntries({
          projectId: currentProject?.id,
          viewerRole: role,
          viewerUserId: currentProfile?.id,
        }),
        activityService.getActivityLogs(currentProject?.id, 100),
        taskService.getTasks(currentProject?.id),
      ]);

      // Role-based filtering for time entries:
      // - ADMIN: sees all records
      // - PROJECT_LEAD: sees all records EXCEPT ADMIN
      // - STAFF: sees only own records
      let scopedEntries = rawEntries;
      if (role === 'STAFF') {
        scopedEntries = rawEntries.filter((e) => e.user_id === currentProfile?.id);
      } else if (role === 'PROJECT_LEAD') {
        scopedEntries = rawEntries.filter((e) => e.user?.role_id !== 'ADMIN');
      }
      setTimeEntries(scopedEntries);

      // Role-based filtering for audit activities:
      // - ADMIN: sees all
      // - PROJECT_LEAD: does not see ADMIN activities
      // - STAFF: sees only own activities
      let scopedActs = rawActs;
      if (role === 'STAFF') {
        scopedActs = rawActs.filter((a) => a.actor_id === currentProfile?.id);
      } else if (role === 'PROJECT_LEAD') {
        scopedActs = rawActs.filter((a) => a.actor?.role_id !== 'ADMIN');
      }
      setActivities(scopedActs);

      if (currentProfile) {
        const active = await timeTrackingService.getActiveTimeEntry(currentProfile.id);
        setActiveEntry(active);
      }
    } catch (err) {
      console.error('Error loading time tracking data:', err);
    }
  };

  useEffect(() => {
    loadData();

    if (!currentProject?.id) return;

    const channel = supabase
      .channel(`realtime:time-tracking-${currentProject.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries',
          filter: `project_id=eq.${currentProject.id}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentProject, currentProfile]);

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    try {
      setIsClocking(true);
      await timeTrackingService.clockIn({
        userId: currentProfile.id,
        projectId: currentProject?.id,
        taskId: selectedTaskId || undefined,
        notes: notes || 'Sprint orchestration work',
      });
      setNotes('');
      setSelectedTaskId('');
      loadData();
    } catch (err) {
      console.error('Clock in failed:', err);
    } finally {
      setIsClocking(false);
    }
  };

  const handleStopShift = async () => {
    if (!activeEntry) return;

    try {
      setIsClocking(true);
      await timeTrackingService.clockOut(activeEntry.id);
      setActiveEntry(null);
      loadData();
    } catch (err) {
      console.error('Clock out failed:', err);
    } finally {
      setIsClocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--accent-primary)]" />
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              {t('timetracking.title', 'Presensi Jam Kerja, Audit Aktivitas & Laporan SLA')}
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {currentProject ? currentProject.title : (language === 'id' ? 'Semua Proyek' : 'All Projects')} • {t('timetracking.subtitle', 'Catatan presensi terverifikasi dan telemetri siklus hidup proyek.')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[var(--bg-surface-subtle)] p-1 rounded-lg border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setActiveTab('TIMESHEET')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'TIMESHEET' 
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs font-bold' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('timetracking.timesheet', 'Timesheet')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVITY')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ACTIVITY' 
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs font-bold' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('timetracking.activityAudit', 'Audit Aktivitas')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'ANALYTICS' 
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] shadow-xs font-bold' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t('timetracking.executiveAnalytics', 'Analitik Eksekutif')}
          </button>
        </div>
      </div>

      {/* Tab 1: Timesheet & Clock In/Out Form */}
      {activeTab === 'TIMESHEET' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Active Stopwatch Card */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-xs p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {t('timetracking.liveStopwatch', 'Live Shift Stopwatch')}
                </span>
                <div className="text-sm font-bold text-[var(--text-primary)] mt-1">
                  {activeEntry ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>{t('timetracking.activeShiftSince', 'Shift Aktif sejak')} {new Date(activeEntry.clock_in).toLocaleTimeString()}</span>
                    </div>
                  ) : (
                    t('timetracking.notClockedIn', 'Belum Clock In — Pilih Tugas & Mulai Shift')
                  )}
                </div>
              </div>

              {activeEntry ? (
                <button
                  type="button"
                  disabled={isClocking}
                  onClick={handleStopShift}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>{t('timetracking.clockOut', 'Clock Out & Simpan Durasi')}</span>
                </button>
              ) : (
                <form onSubmit={handleStartShift} className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)]"
                  >
                    <option value="">{t('timetracking.linkTask', 'Hubungkan ke Tugas (Opsional)')}</option>
                    {tasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('timetracking.notesPlaceholder', 'Catatan aktivitas shift...')}
                    className="px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)] min-w-[200px]"
                  />

                  <button
                    type="submit"
                    disabled={isClocking}
                    className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{t('timetracking.clockIn', 'Clock In')}</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Timesheet History Table */}
          <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {role === 'ADMIN'
                    ? (language === 'id' ? 'Riwayat Presensi Lengkap (Seluruh Tim & Admin)' : 'Complete Attendance History (All Team & Admin)')
                    : role === 'PROJECT_LEAD'
                    ? (language === 'id' ? 'Riwayat Presensi Tim (Staff & Project Lead)' : 'Team Attendance History (Staff & Project Lead)')
                    : (language === 'id' ? 'Riwayat Presensi Saya' : 'My Attendance History')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  role === 'ADMIN' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                    : role === 'PROJECT_LEAD'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {role === 'ADMIN' ? 'Akses Admin: Lengkap' : role === 'PROJECT_LEAD' ? 'Akses Lead: Tim Non-Admin' : 'Akses Staf: Pribadi'}
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">{timeEntries.length} entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-subtle)] text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border-default)]">
                  <tr>
                    <th className="p-3.5">{t('timetracking.engineer', 'Engineer')}</th>
                    <th className="p-3.5">{t('timetracking.projectTask', 'Proyek / Tugas')}</th>
                    <th className="p-3.5">{t('timetracking.clockInTime', 'Jam Masuk')}</th>
                    <th className="p-3.5">{t('timetracking.clockOutTime', 'Jam Keluar')}</th>
                    <th className="p-3.5">{t('timetracking.duration', 'Durasi')}</th>
                    <th className="p-3.5">{t('timetracking.notes', 'Catatan')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {timeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                        {t('timetracking.noEntries', 'Belum ada catatan presensi tersimpan.')}
                      </td>
                    </tr>
                  ) : (
                    timeEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[var(--bg-surface-subtle)] transition-colors">
                        <td className="p-3.5 font-bold text-[var(--text-primary)] flex items-center gap-2">
                          <img
                            src={entry.user?.avatar_url || '/logo.png'}
                            alt={entry.user?.full_name}
                            className="w-6 h-6 rounded-full object-cover border border-[var(--border-default)]"
                          />
                          <span>{entry.user?.full_name || 'Engineer'}</span>
                        </td>
                        <td className="p-3.5 text-[var(--text-primary)]">
                          <div className="font-medium">{entry.project?.title || 'General'}</div>
                          {entry.task && <div className="text-[10px] text-[var(--text-muted)]">{entry.task.title}</div>}
                        </td>
                        <td className="p-3.5 font-mono text-[var(--text-secondary)]">
                          {new Date(entry.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3.5 font-mono text-[var(--text-secondary)]">
                          {entry.clock_out ? new Date(entry.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                            <span className="text-emerald-500 font-semibold animate-pulse">Running</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-[var(--text-primary)] font-mono">
                          {entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : 'In Progress'}
                        </td>
                        <td className="p-3.5 text-[var(--text-secondary)] max-w-xs truncate">
                          {entry.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Activity Audit Log (#34) */}
      {activeTab === 'ACTIVITY' && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-xs overflow-hidden animate-in fade-in">
          <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-[var(--text-primary)]">
                  {t('timetracking.immutableAudit', 'Immutable Project Audit Trail')}
                </h2>
                <span className="text-[10px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
                  {role === 'ADMIN' ? 'Cakupan: Semua Audit' : role === 'PROJECT_LEAD' ? 'Cakupan: Tim Non-Admin' : 'Cakupan: Aktivitas Saya'}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                {t('timetracking.immutableSubtitle', 'Immutable operational mutations across projects and tasks')}
              </p>
            </div>
            <span className="text-[10px] font-mono text-[var(--accent-primary)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
              PostgreSQL Trigger Log
            </span>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                {t('timetracking.noEntries', 'Belum ada log aktivitas.')}
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-4 flex items-start justify-between gap-4 hover:bg-[var(--bg-surface-subtle)] text-xs transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] mt-1.5 shrink-0"></div>
                    <div>
                      <div className="text-[var(--text-primary)]">
                        <span className="font-bold">{act.actor?.full_name || 'System Operator'}: </span>
                        <span className="font-semibold text-[var(--accent-primary)]">{act.action}</span> on {act.entity_type}
                      </div>
                      {act.details && (
                        <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-1 bg-[var(--bg-surface-subtle)] p-1.5 rounded border border-[var(--border-default)]">
                          {JSON.stringify(act.details)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                    {new Date(act.created_at || '').toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Executive Analytics */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
          <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('timetracking.sprintVelocity', 'Sprint Velocity')}
            </div>
            <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">38.5 pts</div>
            <div className="text-xs text-emerald-500 font-semibold">+14% vs last cycle</div>
          </div>

          <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('timetracking.slaCompliance', 'SLA Compliance Rate')}
            </div>
            <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono">96.2%</div>
            <div className="text-xs text-[var(--text-secondary)]">Target SLA: 95.0%</div>
          </div>

          <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border-default)] shadow-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t('timetracking.clientResponseSla', 'Client Response SLA')}
            </div>
            <div className="text-3xl font-extrabold text-amber-500 font-mono">54 hrs</div>
            <div className="text-xs text-amber-500/80">Average approval turnaround</div>
          </div>
        </div>
      )}
    </div>
  );
};
