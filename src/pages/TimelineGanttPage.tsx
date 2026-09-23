import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, AlertTriangle, X, 
  ChevronLeft, ChevronRight, Calendar, Loader2
} from 'lucide-react';
import { ProjectSubTabs } from '../components/common/ProjectSubTabs';
import { CreateTaskModal } from '../components/common/CreateTaskModal';
import { taskService } from '../services/taskService';
import { userService, UserWithDetails } from '../services/userService';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../contexts/LanguageContext';
import { TaskWithDetails } from '../types';
import { toast } from 'sonner';

interface GanttAllocation {
  taskId: string;
  title: string;
  code: string;
  startPct: number;
  widthPct: number;
  isConflict: boolean;
  startDateStr: string;
  dueDateStr: string;
}

interface MemberTimeline {
  id: string;
  avatar: string;
  avatarUrl?: string | null;
  name: string;
  role: string;
  allocations: GanttAllocation[];
}

export const TimelineGanttPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, projects } = useProject();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');
  // Default to today
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [showWarning, setShowWarning] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Effective project ID filter
  const effectiveProjectId = currentProject?.id || (projects.length > 0 ? projects[0].id : undefined);

  const loadTimelineData = async () => {
    try {
      setIsLoading(true);
      const [fetchedUsers, fetchedTasks] = await Promise.all([
        userService.getUsers(),
        taskService.getTasks(effectiveProjectId),
      ]);
      setUsers(fetchedUsers);
      setTasks(fetchedTasks);
    } catch (err: any) {
      console.error('Error loading timeline data:', err);
      toast.error(isId ? 'Gagal memuat timeline dari database' : 'Failed to load timeline from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineData();
  }, [effectiveProjectId]);

  // Window bounds calculation based on viewMode and currentDate
  const { windowStart, windowEnd, timeRangeLabel, weekDays, daysInMonth } = useMemo(() => {
    const yr = currentDate.getFullYear();
    const mo = currentDate.getMonth();

    if (viewMode === 'month') {
      const start = new Date(yr, mo, 1, 0, 0, 0, 0);
      const numDays = new Date(yr, mo + 1, 0).getDate();
      const end = new Date(yr, mo, numDays, 23, 59, 59, 999);
      const label = currentDate.toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' });
      return {
        windowStart: start,
        windowEnd: end,
        timeRangeLabel: label,
        weekDays: [] as { dayName: string; dayNum: number; date: Date }[],
        daysInMonth: numDays,
      };
    } else {
      // Week mode (Monday to Sunday)
      const d = new Date(currentDate);
      const day = d.getDay(); // 0 is Sun, 1 is Mon...
      const diff = (day === 0 ? -6 : 1) - day;
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff, 0, 0, 0, 0);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6, 23, 59, 59, 999);

      const days = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(start);
        dayDate.setDate(start.getDate() + i);
        days.push({
          dayName: dayDate.toLocaleDateString(isId ? 'id-ID' : 'en-US', { weekday: 'short' }),
          dayNum: dayDate.getDate(),
          date: dayDate,
        });
      }

      const startStr = start.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });
      const endStr = end.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
      const label = `${startStr} - ${endStr}`;

      return {
        windowStart: start,
        windowEnd: end,
        timeRangeLabel: label,
        weekDays: days,
        daysInMonth: 0,
      };
    }
  }, [currentDate, viewMode, isId]);

  const totalWindowMs = windowEnd.getTime() - windowStart.getTime();

  // Dynamic TODAY marker calculation
  const today = new Date();
  const isTodayInWindow = today.getTime() >= windowStart.getTime() && today.getTime() <= windowEnd.getTime();
  const todayPct = isTodayInWindow && totalWindowMs > 0
    ? ((today.getTime() - windowStart.getTime()) / totalWindowMs) * 100
    : null;

  // Compute Gantt allocations and conflict detection filtered by time window
  const { memberTimelines, detectedConflicts } = useMemo(() => {
    const conflictsList: { memberName: string; task1: string; task2: string; dates: string }[] = [];

    // Filter team members who are not CLIENT
    const relevantUsers = users.filter((u) => u.role_id !== 'CLIENT');

    const timelines: MemberTimeline[] = relevantUsers.map((user) => {
      const userTasks = tasks.filter((t) => t.assignee_id === user.id);

      const allocations: GanttAllocation[] = [];

      userTasks.forEach((t) => {
        // Determine task start and end
        let tStart: Date | null = null;
        let tEnd: Date | null = null;

        if (t.start_date) {
          tStart = new Date(t.start_date);
        } else if (t.created_at) {
          tStart = new Date(t.created_at);
        }

        if (t.due_date) {
          tEnd = new Date(t.due_date);
        } else if (tStart) {
          tEnd = new Date(tStart.getTime() + 5 * 86400000);
        }

        if (!tStart || !tEnd || isNaN(tStart.getTime()) || isNaN(tEnd.getTime())) {
          return;
        }

        if (tEnd < tStart) {
          tEnd = new Date(tStart.getTime() + 86400000);
        }

        // Overlap condition: task start <= window end AND task end >= window start
        const overlaps = tStart.getTime() <= windowEnd.getTime() && tEnd.getTime() >= windowStart.getTime();
        if (!overlaps) {
          return; // Strictly filter out tasks that do not fall in current window!
        }

        // Percentage position in window
        const clampedStart = Math.max(tStart.getTime(), windowStart.getTime());
        const clampedEnd = Math.min(tEnd.getTime(), windowEnd.getTime());

        const startPct = Math.max(0, Math.min(100, ((clampedStart - windowStart.getTime()) / totalWindowMs) * 100));
        const rawWidthPct = Math.max(0, ((clampedEnd - clampedStart) / totalWindowMs) * 100);
        const minWidth = viewMode === 'week' ? 10 : 4;
        const widthPct = Math.min(100 - startPct, Math.max(minWidth, rawWidthPct));

        const startStr = tStart.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });
        const endStr = tEnd.toLocaleDateString(isId ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });

        allocations.push({
          taskId: t.id,
          title: t.title,
          code: (t as any).code || `${t.project?.code || 'PRJ'}-${t.id.slice(0, 4).toUpperCase()}`,
          startPct,
          widthPct,
          isConflict: false,
          startDateStr: startStr,
          dueDateStr: endStr,
        });
      });

      // Detect overlap conflicts among active allocations
      for (let i = 0; i < allocations.length; i++) {
        for (let j = i + 1; j < allocations.length; j++) {
          const a = allocations[i];
          const b = allocations[j];
          const overlap = a.startPct < (b.startPct + b.widthPct) && (a.startPct + a.widthPct) > b.startPct;
          if (overlap) {
            a.isConflict = true;
            b.isConflict = true;
            if (!conflictsList.some((c) => c.memberName === user.full_name)) {
              conflictsList.push({
                memberName: user.full_name,
                task1: a.title,
                task2: b.title,
                dates: timeRangeLabel,
              });
            }
          }
        }
      }

      const avatar = user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return {
        id: user.id,
        avatar,
        avatarUrl: user.avatar_url,
        name: user.full_name,
        role: user.position || user.role_id,
        allocations,
      };
    });

    return { memberTimelines: timelines, detectedConflicts: conflictsList };
  }, [users, tasks, windowStart, windowEnd, totalWindowMs, viewMode, timeRangeLabel, isId]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else {
      setCurrentDate((prev) => new Date(prev.getTime() - 7 * 86400000));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else {
      setCurrentDate((prev) => new Date(prev.getTime() + 7 * 86400000));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const totalAllocationsCount = memberTimelines.reduce((acc, m) => acc + m.allocations.length, 0);

  return (
    <div className="space-y-6">
      {/* Create Task / Allocation Modal */}
      <CreateTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onTaskCreated={loadTimelineData}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Sumber Daya & Jadwal' : 'Resources & Timeline'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {isId ? 'Gantt Database Langsung' : 'Live Database Gantt'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId
              ? 'Kelola jadwal tim, deteksi konflik alokasi jam kerja, dan rencanakan milestone sprint.'
              : 'Manage team schedule, detect allocation conflicts, and plan sprint milestones.'}
          </p>
          <p className="text-[11px] text-[var(--accent-primary)] font-medium mt-1.5 flex items-center gap-1 sm:hidden">
            <span>⇄</span> {isId ? 'Geser horizontal bagan jadwal di bawah untuk melihat detail timeline' : 'Swipe horizontally below to view timeline details'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              toast.info(isId ? 'Membuka dialog alokasi sumber daya...' : 'Opening resource allocation dialog...');
              navigate('/resources');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Tambah Alokasi' : 'Add Allocation'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <ProjectSubTabs activeTab="timeline" />

      {/* Filter & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Week/Month Selector */}
          <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isId ? 'Minggu' : 'Week'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-2.5 sm:px-3 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] font-bold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isId ? 'Bulan' : 'Month'}
            </button>
          </div>

          {/* Time Window Navigation */}
          <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2 py-1 text-xs shadow-xs">
            <button 
              type="button"
              onClick={handlePrev}
              title={isId ? 'Periode Sebelumnya' : 'Previous Period'}
              className="p-0.5 sm:p-1 hover:text-[var(--text-primary)] text-[var(--text-muted)] rounded hover:bg-[var(--bg-surface-subtle)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-[var(--text-primary)] px-1 sm:px-2 font-mono capitalize text-center text-xs">
              {timeRangeLabel}
            </span>
            <button 
              type="button"
              onClick={handleNext}
              title={isId ? 'Periode Berikutnya' : 'Next Period'}
              className="p-0.5 sm:p-1 hover:text-[var(--text-primary)] text-[var(--text-muted)] rounded hover:bg-[var(--bg-surface-subtle)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToday}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span>{isId ? 'Hari Ini' : 'Today'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {detectedConflicts.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>
                {detectedConflicts.length} {isId ? 'Konflik Jadwal' : `Schedule Conflict${detectedConflicts.length > 1 ? 's' : ''}`}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              <span>{isId ? '✓ Tidak Ada Konflik' : '✓ No Conflicts'}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>{memberTimelines.length} {isId ? 'Anggota Tim' : 'Team Members'}</span>
          </span>
        </div>
      </div>

      {/* Warning Banner for Schedule Conflicts */}
      {showWarning && detectedConflicts.length > 0 && (
        <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200">
              {isId ? (
                <>
                  <strong>{detectedConflicts[0].memberName}</strong> ditugaskan pada tugas bersamaan: "{detectedConflicts[0].task1}" & "{detectedConflicts[0].task2}".
                </>
              ) : (
                <>
                  <strong>{detectedConflicts[0].memberName}</strong> is assigned to overlapping tasks: "{detectedConflicts[0].task1}" & "{detectedConflicts[0].task2}".
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                toast.info(isId ? 'Silakan sesuaikan jadwal tugas di Papan Orkestrasi' : 'Please adjust task schedule in the Orchestration Board');
              }}
              className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-colors"
            >
              {isId ? 'Tinjau Alokasi' : 'Review Allocation'}
            </button>
            <button
              type="button"
              onClick={() => setShowWarning(false)}
              className="text-amber-400/70 hover:text-amber-300 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Timeline Gantt Grid Card */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">{isId ? 'Memuat timeline dari database...' : 'Loading timeline from database...'}</span>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto touch-pan-x no-scrollbar">
            <div className="min-w-[760px] lg:min-w-full">
              {/* Table / Gantt Header */}
              <div className="grid grid-cols-12 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider py-2.5 px-4 items-center">
            <div className="col-span-3">{isId ? 'Anggota Tim' : 'Team Member'}</div>
            <div className="col-span-2">{isId ? 'Peran' : 'Role'}</div>
            
            {/* Timeline scale header */}
            <div className="col-span-7 relative h-6 flex items-center">
              {viewMode === 'month' ? (
                <div className="w-full grid grid-cols-6 text-center font-mono text-[10px]">
                  <span>1</span>
                  <span>6</span>
                  <span>12</span>
                  <span>18</span>
                  <span>24</span>
                  <span>{daysInMonth}</span>
                </div>
              ) : (
                <div className="w-full grid grid-cols-7 text-center font-mono text-[10px]">
                  {weekDays.map((d, i) => (
                    <span key={i} className="truncate">
                      {d.dayName} {d.dayNum}
                    </span>
                  ))}
                </div>
              )}

              {/* Dynamic TODAY Badge Indicator */}
              {todayPct !== null && (
                <div 
                  className="absolute top-0 -translate-x-1/2 z-20 pointer-events-none"
                  style={{ left: `${todayPct}%` }}
                >
                  <span className="bg-[#FF8000] text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow">
                    {isId ? 'HARI INI' : 'TODAY'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Member Allocation Rows */}
          <div className="divide-y divide-[var(--border-subtle)]">
            {memberTimelines.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-12 items-center py-4 px-4 hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                {/* Member Info */}
                <div className="col-span-3 flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[10px] text-[var(--text-primary)] shrink-0 overflow-hidden">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      member.avatar
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {member.name}
                  </span>
                </div>

                {/* Role */}
                <div className="col-span-2 text-[11px] text-[var(--text-secondary)] truncate pr-2">
                  {member.role}
                </div>

                {/* Gantt Bar Lane */}
                <div className="col-span-7 relative h-8 bg-[var(--bg-input)] rounded-lg overflow-hidden border border-[var(--border-subtle)] flex items-center">
                  {/* Subtle Grid Lines */}
                  {viewMode === 'week' ? (
                    <div className="grid grid-cols-7 h-full w-full absolute inset-0 pointer-events-none divide-x divide-[var(--border-subtle)] opacity-40" />
                  ) : (
                    <div className="grid grid-cols-6 h-full w-full absolute inset-0 pointer-events-none divide-x divide-[var(--border-subtle)] opacity-40" />
                  )}

                  {/* Vertical TODAY indicator line */}
                  {todayPct !== null && (
                    <div 
                      className="absolute top-0 bottom-0 w-px bg-[#FF8000]/70 pointer-events-none z-10" 
                      style={{ left: `${todayPct}%` }}
                    />
                  )}

                  {member.allocations.length === 0 ? (
                    <div className="w-full text-center text-[10px] text-[var(--text-muted)] italic z-0">
                      {isId ? 'Tidak ada alokasi aktif untuk periode ini' : 'No active allocations for this period'}
                    </div>
                  ) : (
                    member.allocations.map((alloc) => (
                      <div
                        key={alloc.taskId}
                        style={{
                          left: `${alloc.startPct}%`,
                          width: `${alloc.widthPct}%`,
                        }}
                        className={`absolute h-6 rounded px-2 flex items-center justify-between text-[10px] truncate transition-transform hover:scale-[1.01] ${
                          alloc.isConflict
                            ? 'bg-amber-950/80 border border-amber-500 text-amber-200 font-semibold z-20 shadow-md shadow-amber-500/10'
                            : 'bg-[#1E293B] border border-slate-700 text-slate-200 z-10'
                        }`}
                        title={`${alloc.title} (${alloc.startDateStr} - ${alloc.dueDateStr})`}
                      >
                        <span className="truncate flex items-center gap-1">
                          {alloc.isConflict && <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />}
                          <span className="truncate">{alloc.title}</span>
                        </span>

                        {alloc.code && (
                          <span className={`text-[9px] font-mono px-1 rounded ml-1 shrink-0 ${
                            alloc.isConflict ? 'bg-amber-600 text-black font-bold' : 'text-slate-400'
                          }`}>
                            {alloc.code}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
              </div>
            </div>
          </div>

          {/* Footer with Legend */}
          <div className="px-5 py-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
            <span>
              {isId 
                ? `Menampilkan ${totalAllocationsCount} alokasi aktif untuk: ${timeRangeLabel}` 
                : `Showing ${totalAllocationsCount} active live allocations for: ${timeRangeLabel}`}
            </span>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#1E293B] border border-slate-700"></span>
                <span>{isId ? 'Alokasi Standar' : 'Standard Allocation'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-950 border border-amber-500"></span>
                <span>{isId ? 'Konflik Jadwal' : 'Schedule Conflict'}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF8000]"></span>
                <span>{isId ? 'Hari Ini' : 'Current Day'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
