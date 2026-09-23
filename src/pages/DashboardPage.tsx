import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { 
  Folder, CheckSquare, ShieldCheck, Plus, ArrowRight, 
  History, Loader2, Play, Square, Clock, AlertTriangle, 
  Users, CheckCircle2, MessageSquare, Flame, BarChart3, 
  Briefcase, ChevronRight, Calendar, AlertCircle, PieChart as PieIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { can } from '../lib/permissions';
import { taskService } from '../services/taskService';
import { activityService } from '../services/activityService';
import { timeTrackingService } from '../services/timeTrackingService';
import { ProjectHealthScore } from '../components/common/ProjectHealthScore';
import { PieChartSkeleton } from '../components/common/PieChartSkeleton';
import { ActivityLogWithDetails, TaskWithDetails, TimeEntry, KanbanColumnId } from '../types';
import { toast } from 'sonner';

export const DashboardPage: React.FC = () => {
  const { projects, isLoading: isProjectsLoading, setCurrentProjectId } = useProject();
  const { role, isClient, currentProfile } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  // Guard: CLIENT must always be routed to cockpit
  if (isClient || role === 'CLIENT') {
    return <Navigate to="/cockpit" replace />;
  }

  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [activities, setActivities] = useState<ActivityLogWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Staff Time Tracking State
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockInNotes, setClockInNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isClocking, setIsClocking] = useState(false);
  const timerRef = useRef<any>(null);

  // Staff Task Filter
  const [staffTaskFilter, setStaffTaskFilter] = useState<'ALL' | 'DEVELOPMENT' | 'DONE'>('ALL');

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [taskList, actList] = await Promise.all([
        taskService.getTasks(),
        activityService.getActivityLogs(undefined, 8),
      ]);
      setTasks(taskList);
      setActivities(actList);

      // Check active clock-in if staff
      if (currentProfile?.id) {
        const active = await timeTrackingService.getActiveTimeEntry(currentProfile.id);
        setActiveEntry(active);
        if (active?.clock_in) {
          const diffSec = Math.floor((Date.now() - new Date(active.clock_in).getTime()) / 1000);
          setElapsedSeconds(Math.max(0, diffSec));
        }
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentProfile?.id]);

  // Timer tick for clock-in
  useEffect(() => {
    if (activeEntry?.clock_in) {
      timerRef.current = setInterval(() => {
        const diffSec = Math.floor((Date.now() - new Date(activeEntry.clock_in).getTime()) / 1000);
        setElapsedSeconds(Math.max(0, diffSec));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeEntry?.clock_in]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClockIn = async () => {
    if (!currentProfile?.id) return;
    try {
      setIsClocking(true);
      const entry = await timeTrackingService.clockIn({
        userId: currentProfile.id,
        projectId: selectedProjectId || (projects[0]?.id),
        notes: clockInNotes || (language === 'id' ? 'Bekerja pada tugas harian SDK' : 'Daily SDK sprint orchestration task'),
      });
      setActiveEntry(entry);
      setClockInNotes('');
      toast.success(language === 'id' ? 'Presensi masuk berhasil! Penghitung waktu mulai berjalan.' : 'Clock In successful! Timer started.');
    } catch (err: any) {
      toast.error(err.message || (language === 'id' ? 'Gagal presensi masuk' : 'Clock In failed'));
    } finally {
      setIsClocking(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEntry?.id) return;
    try {
      setIsClocking(true);
      await timeTrackingService.clockOut(activeEntry.id);
      setActiveEntry(null);
      setElapsedSeconds(0);
      toast.success(language === 'id' ? 'Presensi keluar berhasil! Durasi kerja tersimpan di log aktivitas.' : 'Clock Out successful! Duration saved to activity log.');
      loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || (language === 'id' ? 'Gagal presensi keluar' : 'Clock Out failed'));
    } finally {
      setIsClocking(false);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStage: KanbanColumnId) => {
    try {
      await taskService.moveTaskStage(taskId, newStage, undefined, currentProfile?.id);
      toast.success(language === 'id' ? `Status tugas berhasil diperbarui ke ${newStage}` : `Task status updated to ${newStage}`);
      loadDashboardData();
    } catch (err: any) {
      toast.error(language === 'id' ? 'Gagal memperbarui status tugas' : 'Failed to update task status');
    }
  };

  // Filter projects if role is Client
  const visibleProjects = isClient && currentProfile?.client_id
    ? projects.filter((p) => p.client_id === currentProfile.client_id)
    : projects;

  // Real KPI metrics calculated from database
  const activeProjectsCount = visibleProjects.filter((p) => p.stage !== 'COMPLETED').length;
  const openTasksCount = tasks.filter((t) => t.stage_key !== 'DONE').length;
  const completedProjectsCount = visibleProjects.filter((p) => p.stage === 'COMPLETED').length;

  // Project status distribution for Admin Pie Chart
  const projectStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      ACTIVE: 0,
      PLANNING: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
    };
    visibleProjects.forEach((p) => {
      const s = ((p as any).status || (p.stage === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE')).toUpperCase();
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts.ACTIVE++;
      }
    });
    return [
      { name: language === 'id' ? 'Aktif' : 'Active', value: counts.ACTIVE, color: '#10B981' },
      { name: language === 'id' ? 'Perencanaan' : 'Planning', value: counts.PLANNING, color: '#3B82F6' },
      { name: language === 'id' ? 'Ditunda' : 'On Hold', value: counts.ON_HOLD, color: '#F59E0B' },
      { name: language === 'id' ? 'Selesai' : 'Completed', value: counts.COMPLETED, color: '#8B5CF6' },
    ].filter((item) => item.value > 0);
  }, [visibleProjects, language]);

  const renderStatusPieChart = () => {
    if (isProjectsLoading || isLoading) {
      return (
        <PieChartSkeleton 
          title={language === 'id' ? 'Distribusi Status Proyek' : 'Project Status Distribution'} 
        />
      );
    }

    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {language === 'id' ? 'Distribusi Status Proyek' : 'Project Status Distribution'}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
            {visibleProjects.length} {language === 'id' ? 'Proyek' : 'Projects'}
          </span>
        </div>

      <div className="h-48 w-full">
        {projectStatusDistribution.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
            {language === 'id' ? 'Tidak ada data status proyek' : 'No project status data'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectStatusDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={40}
                outerRadius={62}
                paddingAngle={4}
              >
                {projectStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={28}
                formatter={(value) => (
                  <span className="text-[10px] text-[var(--text-secondary)] font-medium mr-1.5">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

  // Staff specific metrics
  const myAssignedTasks = tasks.filter((t) => t.assignee_id === currentProfile?.id);
  const myPendingTasks = myAssignedTasks.filter((t) => t.stage_key !== 'DONE');
  const myDoneTasks = myAssignedTasks.filter((t) => t.stage_key === 'DONE');
  const displayedStaffTasks = myAssignedTasks.filter((t) => {
    if (staffTaskFilter === 'DEVELOPMENT') return t.stage_key === 'DEVELOPMENT';
    if (staffTaskFilter === 'DONE') return t.stage_key === 'DONE';
    return true;
  });

  // Project Lead specific metrics
  const myLedProjects = visibleProjects.filter((p) => p.lead_id === currentProfile?.id || role === 'ADMIN');
  const clientOverdueTasks = tasks.filter((t) => t.is_waiting_for_client);
  const blockedTasks = tasks.filter((t) => t.is_blocked || t.priority === 'CRITICAL');

  // Client view redirect helper
  if (isClient) {
    const primaryProject = visibleProjects[0];
    return (
      <div className="space-y-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-primary)] mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {language === 'id' ? 'Selamat Datang di Client Cockpit' : 'Welcome to Client Cockpit'}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
              {language === 'id' 
                ? 'Pantau progres implementasi proyek, status milestone, dan persetujuan deliverable Anda secara langsung.' 
                : 'Monitor project implementation progress, milestone statuses, and deliverable approvals directly.'}
            </p>
          </div>
          {primaryProject ? (
            <button
              type="button"
              onClick={() => navigate(`/projects/${primaryProject.id}/cockpit`)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <span>{language === 'id' ? `Buka Cockpit ${primaryProject.title}` : `Open ${primaryProject.title} Cockpit`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'id' ? 'Belum ada proyek aktif yang ditugaskan ke organisasi Anda.' : 'No active projects assigned to your organization yet.'}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {role === 'STAFF' 
                ? t('dashboard.staffWorkspace', 'Ruang Kerja Staf') 
                : role === 'PROJECT_LEAD' 
                ? t('dashboard.leadWorkspace', 'Pusat Project Lead') 
                : t('dashboard.adminWorkspace', 'Dashboard Eksekutif')}
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {role === 'STAFF' 
              ? t('dashboard.staffSubtitle', 'Pencatatan jam kerja, daftar tugas aktif, dan pelacakan sprint Anda.')
              : role === 'PROJECT_LEAD'
              ? t('dashboard.leadSubtitle', 'Pemantauan proyek binaan, delegasi tugas sprint, dan respon persetujuan klien.')
              : t('dashboard.adminSubtitle', 'Ringkasan status proyek, alokasi beban kerja, dan kesehatan operasional SDK.')}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {can(role, 'project:create') && (
            <button
              type="button"
              onClick={() => navigate('/projects/new')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('dashboard.newProjectBtn', 'Proyek Baru')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/chat')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-secondary)] cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROLE: STAFF SPECIFIC VIEW (Flow 4.1 & Flow 4.4) */}
      {/* ========================================================= */}
      {role === 'STAFF' && (
        <div className="space-y-6">
          {/* Clock In / Clock Out Interactive Card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  activeEntry 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse' 
                    : 'bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border-[var(--border-default)]'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">
                      {activeEntry ? t('dashboard.workingActive', 'Sedang Bekerja') : t('dashboard.attendanceStandby', 'Presensi Kerja')}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeEntry ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {activeEntry ? t('dashboard.statusActive', 'Aktif') : t('dashboard.statusStandby', 'Siaga')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {activeEntry 
                      ? (language === 'id' 
                          ? `Mulai sejak ${new Date(activeEntry.clock_in).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • Durasi otomatis dicatat ke timesheet` 
                          : `Started at ${new Date(activeEntry.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • Duration automatically logged to timesheet`)
                      : t('dashboard.clockInPrompt', 'Mulai hari kerja Anda dengan menekan tombol Masuk Kerja di samping.')}
                  </p>
                </div>
              </div>

              {/* Timer display & Clock In / Out button */}
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 w-full sm:w-auto">
                {activeEntry && (
                  <div className="font-mono text-xl font-extrabold text-[var(--text-primary)] bg-[var(--bg-surface-subtle)] px-3 py-1 rounded-lg border border-[var(--border-default)] text-center">
                    {formatTimer(elapsedSeconds)}
                  </div>
                )}

                {activeEntry ? (
                  <button
                    type="button"
                    onClick={handleClockOut}
                    disabled={isClocking}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer w-full sm:w-auto"
                  >
                    {isClocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                    <span>{t('dashboard.clockOutAction', 'Keluar Kerja')}</span>
                  </button>
                ) : (
                  <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="px-2.5 py-1.5 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none w-full sm:w-auto max-w-full sm:max-w-xs truncate"
                    >
                      <option value="">{t('dashboard.selectProject', 'Pilih Proyek...')}</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.code} - {p.title}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleClockIn}
                      disabled={isClocking}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
                    >
                      {isClocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      <span>{t('dashboard.clockInAction', 'Masuk Kerja')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Staff KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.assignedTasks', 'Tugas Ditugaskan')}</div>
              <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">{myAssignedTasks.length}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                {myPendingTasks.length} {t('dashboard.activeTasksPending', 'tugas aktif belum selesai')}
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.completedTasksSprint', 'Tugas Selesai (Sprint Ini)')}</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{myDoneTasks.length}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">
                {myAssignedTasks.length > 0 ? Math.round((myDoneTasks.length / myAssignedTasks.length) * 100) : 0}% {t('dashboard.completionRate', 'tingkat penyelesaian')}
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.weeklyAllocation', 'Alokasi Mingguan')}</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">40 {t('dashboard.hoursUnit', 'Jam')}</div>
              <div className="w-full bg-[var(--bg-surface-subtle)] h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
          </div>

          {/* Staff Task List with Quick Stage Actions */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('dashboard.myTasksTitle', 'Tugas Saya')}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">{t('dashboard.myTasksSubtitle', 'Kelola progres tugas secara langsung tanpa berpindah tab.')}</p>
              </div>

              <div className="flex items-center gap-1.5">
                {(['ALL', 'DEVELOPMENT', 'DONE'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setStaffTaskFilter(filter)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      staffTaskFilter === filter
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {filter === 'ALL' 
                      ? t('dashboard.filterAll', 'Semua') 
                      : filter === 'DEVELOPMENT' 
                      ? t('dashboard.filterInProgress', 'Sedang Berjalan') 
                      : t('dashboard.filterDone', 'Selesai')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              {displayedStaffTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  {t('dashboard.noTasksFilter', 'Tidak ada tugas yang sesuai dengan filter saat ini.')}
                </div>
              ) : (
                displayedStaffTasks.map((tItem) => (
                  <div
                    key={tItem.id}
                    className="p-3.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{tItem.title}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                          tItem.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          tItem.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {tItem.priority === 'CRITICAL' 
                            ? (language === 'id' ? 'Kritis' : 'Critical') 
                            : tItem.priority === 'HIGH' 
                            ? (language === 'id' ? 'Tinggi' : 'High') 
                            : tItem.priority === 'MEDIUM' 
                            ? (language === 'id' ? 'Sedang' : 'Medium') 
                            : (language === 'id' ? 'Rendah' : 'Low')}
                        </span>
                        {tItem.is_blocked && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-500 text-white">
                            {language === 'id' ? 'TERHAMBAT' : 'BLOCKED'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                        <span>{tItem.project?.title || 'SDK Project'}</span>
                        <span>•</span>
                        <span>{language === 'id' ? 'Estimasi:' : 'Est:'} {tItem.estimated_hours || 4}h</span>
                        {tItem.due_date && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400">
                              {language === 'id' ? 'Tenggat:' : 'Due:'} {new Date(tItem.due_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick stage toggle buttons */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)] mr-1">
                        {tItem.stage_key}
                      </span>
                      {tItem.stage_key !== 'DEVELOPMENT' && tItem.stage_key !== 'DONE' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tItem.id, 'DEVELOPMENT')}
                          className="px-2.5 py-1 rounded bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          {t('dashboard.startWork', 'Mulai Kerja')}
                        </button>
                      )}
                      {tItem.stage_key === 'DEVELOPMENT' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tItem.id, 'QA_SIT')}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          {t('dashboard.submitReview', 'Ajukan Review')}
                        </button>
                      )}
                      {tItem.stage_key !== 'DONE' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(tItem.id, 'DONE')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          {t('dashboard.completeTask', 'Selesai')}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE: PROJECT LEAD SPECIFIC VIEW (Flow 3.1 & Flow 3.9) */}
      {/* ========================================================= */}
      {role === 'PROJECT_LEAD' && (
        <div className="space-y-6">
          {/* Client Overdue Alert Banner (Flow 3.9) */}
          {clientOverdueTasks.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-amber-300">
                    {language === 'id' 
                      ? `Perhatian: ${clientOverdueTasks.length} Tugas Sedang Menunggu Respon Klien` 
                      : `Attention: ${clientOverdueTasks.length} Tasks Waiting for Client Response`}
                  </h3>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    {t('dashboard.clientOverdueDesc', 'Klien belum merespon verifikasi. Segera tindak lanjuti via chat untuk mencegah potensi keterlambatan timeline proyek.')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('dashboard.followUpChat', 'Tindak Lanjut via Chat')}</span>
              </button>
            </div>
          )}

          {/* 4 Project Lead KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.projectsLed', 'Proyek yang Dipimpin')}</div>
              <div className="text-2xl font-bold font-mono text-[var(--text-primary)] mt-1">{myLedProjects.length}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{t('dashboard.activeOrchestration', 'Dalam orkestrasi aktif')}</div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.tasksNeedAttention', 'Tugas Butuh Perhatian')}</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{blockedTasks.length}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{t('dashboard.blockedCritical', 'Terhambat / Prioritas Kritis')}</div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.waitingClientResponse', 'Menunggu Respon Klien')}</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{clientOverdueTasks.length}</div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{t('dashboard.pendingClientReview', 'Menunggu review klien')}</div>
            </div>

            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
              <div className="text-xs text-[var(--text-secondary)] font-semibold">{t('dashboard.healthyProjects', 'Proyek Sehat')}</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {myLedProjects.length > 0 ? myLedProjects.filter((p) => (p.progress_percentage || 0) >= 50).length : 0}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-1">{language === 'id' ? 'Skor kesehatan > 80%' : 'Health score > 80%'}</div>
            </div>
          </div>

          {/* My Led Projects List */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('dashboard.myGuidedProjects', 'Proyek Binaan Saya')}</h3>
                <p className="text-[11px] text-[var(--text-secondary)]">{t('dashboard.myGuidedSubtitle', 'Akses cepat ke Kanban, Timeline Gantt, dan Cockpit Klien.')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myLedProjects.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[var(--accent-primary)]">{p.code}</span>
                        <ProjectHealthScore />
                      </div>
                      <h4 className="font-bold text-sm text-[var(--text-primary)] mt-1">{p.title}</h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {t('dashboard.clientLabel', 'Klien:')} {(p as any).client?.name || 'Internal SDK'} • {p.template_type}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)]">{t('dashboard.progressLabel', 'Progres Implementasi')}</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{p.progress_percentage || 0}%</span>
                    </div>
                    <div className="w-full bg-[var(--bg-surface)] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[var(--accent-primary)] h-full rounded-full" style={{ width: `${p.progress_percentage || 0}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => setSelectedProjectForDetail(p)}
                      className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-xs text-[var(--accent-primary)] font-semibold transition-colors cursor-pointer"
                    >
                      {language === 'id' ? 'Detail' : 'Details'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${p.id}/kanban`)}
                      className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-xs text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      Kanban
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${p.id}/timeline`)}
                      className="px-2.5 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-xs text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      Timeline
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${p.id}/cockpit`)}
                      className="px-2.5 py-1 rounded bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Cockpit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Status Distribution for Project Lead */}
          {renderStatusPieChart()}
        </div>
      )}

      {/* ========================================================= */}
      {/* ROLE: ADMIN SPECIFIC VIEW (Flow 2.1) */}
      {/* ========================================================= */}
      {role === 'ADMIN' && (
        <div className="space-y-6">
          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: Active Projects */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 relative overflow-hidden shadow-xs hover:border-[var(--border-light)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t('dashboard.activeProjects', 'Proyek Aktif')}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-primary)]">
                  <Folder className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight font-mono">
                  {activeProjectsCount}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  +{visibleProjects.length} total
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                {t('dashboard.operationalPipeline', 'Proyek dalam alur operasional')}
              </div>
            </div>

            {/* KPI 2: Open Tasks */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 relative overflow-hidden shadow-xs hover:border-[var(--border-light)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t('dashboard.openSprintTasks', 'Tugas Sprint Terbuka')}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight font-mono">
                  {openTasksCount}
                </span>
                <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                  {t('dashboard.activeSprintBadge', 'Sprint Aktif')}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                {t('dashboard.teamWorkingTasks', 'Tugas sedang dikerjakan tim')}
              </div>
            </div>

            {/* KPI 3: Completed Projects */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 relative overflow-hidden shadow-xs hover:border-[var(--border-light)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t('dashboard.completedProjects', 'Proyek Selesai')}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight font-mono">
                  {completedProjectsCount}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {t('dashboard.deliveredBadge', 'Terserah Terima')}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                {t('dashboard.handedOverVerified', 'Proyek serah terima & terverifikasi')}
              </div>
            </div>

            {/* KPI 4: Health Score Overview */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 relative overflow-hidden shadow-xs hover:border-[var(--border-light)] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {t('dashboard.projectHealth', 'Kesehatan Proyek')}
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                  92%
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {t('dashboard.healthyBadge', 'Sehat')}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">
                {t('dashboard.formulaVerified', 'Formula 30/30/20/20 terverifikasi')}
              </div>
            </div>
          </div>

          {/* Main Grid: Left 2/3 (Projects Table with Health Scores) and Right 1/3 (Recent Activity Feed) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Recent Projects Table */}
            <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {t('dashboard.recentProjectsHealth', 'Proyek Terkini & Status Kesehatan')}
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {t('dashboard.recentProjectsSubtitle', 'Status, progres, dan skor kesehatan proyek di database')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/projects')}
                  className="text-xs font-semibold text-[var(--accent-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{t('dashboard.viewAllProjects', 'Lihat semua proyek')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-default)] text-[var(--text-secondary)] font-semibold">
                      <th className="py-2 px-3">{t('dashboard.colProject', 'Proyek')}</th>
                      <th className="py-2 px-3">{t('dashboard.colClient', 'Klien')}</th>
                      <th className="py-2 px-3">{t('dashboard.colHealth', 'Kesehatan')}</th>
                      <th className="py-2 px-3">{t('dashboard.colProgress', 'Progres')}</th>
                      <th className="py-2 px-3">{t('dashboard.colStage', 'Fase')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {isProjectsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-[var(--accent-primary)]" />
                          <span>{t('dashboard.loadingProjects', 'Memuat data proyek...')}</span>
                        </td>
                      </tr>
                    ) : visibleProjects.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
                          {t('dashboard.noProjectsRegistered', 'Belum ada proyek yang terdaftar')}
                        </td>
                      </tr>
                    ) : (
                      visibleProjects.slice(0, 5).map((p) => {
                        const clientName = (p as any).client?.name || 'Subaga Internal';
                        const progress = p.progress_percentage || 0;

                        return (
                          <tr
                            key={p.id}
                            onClick={() => setSelectedProjectForDetail(p)}
                            className="hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer group"
                            title={language === 'id' ? 'Klik untuk melihat detail lengkap proyek' : 'Click to view project details'}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[11px] text-[var(--accent-primary)] font-mono shrink-0">
                                  {p.code.substring(p.code.length - 2)}
                                </div>
                                <div className="truncate max-w-[180px]">
                                  <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                                    {p.title}
                                  </div>
                                  <div className="text-[10px] text-[var(--text-muted)] truncate">
                                    {p.delivery_model} • {p.template_type}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[var(--text-secondary)] font-medium truncate max-w-[120px]">
                              {clientName}
                            </td>
                            <td className="py-3 px-3">
                              <ProjectHealthScore />
                            </td>
                            <td className="py-3 px-3 w-28">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-[var(--bg-surface-subtle)] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-[var(--accent-primary)]"
                                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px] text-[var(--text-secondary)] w-7 text-right">
                                  {progress}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                                {p.stage}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Project Status Distribution & Recent Activity Feed */}
            <div className="space-y-6">
              {/* Project Status Pie Chart */}
              {renderStatusPieChart()}

              {/* Recent Activity Feed */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[var(--accent-primary)]" />
                    <h2 className="text-sm font-bold text-[var(--text-primary)]">
                      {t('dashboard.recentActivityLog', 'Log Aktivitas Terkini')}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Live</span>
                </div>

              <div className="space-y-4">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-[var(--accent-primary)]" />
                    <span>{t('dashboard.loadingActivities', 'Memuat log aktivitas...')}</span>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                    {t('dashboard.noRecentActivity', 'Belum ada aktivitas terbaru')}
                  </div>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      {/* Outer Ring */}
                      <div className="w-4 h-4 rounded-full border-2 border-[var(--accent-primary)] flex items-center justify-center shrink-0 mt-0.5 bg-[var(--bg-surface)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      </div>

                      {/* Activity Details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {act.action.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] truncate">
                          {act.actor?.full_name || 'System Actor'} • {act.project?.title || act.entity_type}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {new Date(act.created_at || '').toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
      {/* Project Details Modal directly in Dashboard */}
      {selectedProjectForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl max-w-2xl w-full shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[var(--border-default)] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-[var(--accent-subtle)] text-[var(--accent-primary)] px-2 py-0.5 rounded border border-[var(--accent-border)]">
                    {selectedProjectForDetail.code}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {selectedProjectForDetail.stage}
                  </span>
                  <ProjectHealthScore />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  {selectedProjectForDetail.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedProjectForDetail.description || (language === 'id' ? 'Sistem digital dan orchestrator alur kerja terpadu.' : 'Digital system and unified delivery orchestrator.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectForDetail(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Grid Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <span className="text-[10px] text-[var(--text-muted)] block">{t('modal.clientOrg', 'Klien / Organisasi')}</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {(selectedProjectForDetail as any).client?.name || 'Internal SDK'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <span className="text-[10px] text-[var(--text-muted)] block">{t('modal.deliveryModel', 'Model Pengiriman')}</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedProjectForDetail.delivery_model || 'Agile Hybrid'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <span className="text-[10px] text-[var(--text-muted)] block">{t('modal.workflowTemplate', 'Templat Alur Kerja')}</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedProjectForDetail.template_type || 'Standard'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <span className="text-[10px] text-[var(--text-muted)] block">{t('modal.targetRelease', 'Target Rilis')}</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  {selectedProjectForDetail.target_end_date ? new Date(selectedProjectForDetail.target_end_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US') : 'TBD'}
                </span>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-1.5 p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text-primary)]">{t('modal.projectProgress', 'Kemajuan Proyek')}</span>
                <span className="font-mono font-bold text-[var(--accent-primary)]">{selectedProjectForDetail.progress_percentage || 0}%</span>
              </div>
              <div className="w-full bg-[var(--bg-surface)] h-2 rounded-full overflow-hidden">
                <div className="bg-[var(--accent-primary)] h-full rounded-full" style={{ width: `${selectedProjectForDetail.progress_percentage || 0}%` }} />
              </div>
            </div>

            {/* Quick Actions to Sub-Modules */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {t('modal.quickModuleActions', 'Aksi Cepat Modul Proyek')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProjectId(selectedProjectForDetail.id);
                    navigate(`/projects/${selectedProjectForDetail.id}/board`);
                  }}
                  className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-border)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{t('modal.kanbanBoard', 'Papan Kanban')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProjectId(selectedProjectForDetail.id);
                    navigate(`/projects/${selectedProjectForDetail.id}/timeline`);
                  }}
                  className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-border)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>{t('modal.ganttTimeline', 'Timeline Gantt')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProjectId(selectedProjectForDetail.id);
                    navigate(`/projects/${selectedProjectForDetail.id}/cockpit`);
                  }}
                  className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-border)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('modal.clientCockpit', 'Client Cockpit')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProjectId(selectedProjectForDetail.id);
                    navigate(`/projects/${selectedProjectForDetail.id}/files`);
                  }}
                  className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent-border)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Folder className="w-4 h-4" />
                  <span>{t('modal.filesRepository', 'Berkas Dokumen')}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => {
                  setCurrentProjectId(selectedProjectForDetail.id);
                  toast.success(language === 'id' ? `Proyek ${selectedProjectForDetail.code} dijadikan proyek aktif di header.` : `Project ${selectedProjectForDetail.code} set as active in header.`);
                  setSelectedProjectForDetail(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {t('modal.setActiveProject', 'Jadikan Proyek Aktif')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedProjectForDetail(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {t('modal.close', 'Tutup')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
