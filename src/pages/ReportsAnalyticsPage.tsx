import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart2, Lightbulb, AlertTriangle, 
  Loader2, CheckCircle2,
  FolderKanban, Clock, Target, Layers
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { userService, UserWithDetails } from '../services/userService';
import { taskService } from '../services/taskService';
import { useLanguage } from '../contexts/LanguageContext';
import { ProjectWithDetails, TaskWithDetails } from '../types';

export const ReportsAnalyticsPage: React.FC = () => {
  const { language } = useLanguage();
  const isId = language === 'id';

  const [timeRange, setTimeRange] = useState('Last 30 Days');
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');

  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [teamMembers, setTeamMembers] = useState<UserWithDetails[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setIsLoading(true);
        const [projList, userList, taskList] = await Promise.all([
          projectService.getProjects(),
          userService.getUsers(),
          taskService.getTasks(),
        ]);
        setProjects(projList);
        setTeamMembers(userList);
        setTasks(taskList);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, []);

  // Filter projects according to selection
  const filteredProjects = useMemo(() => {
    if (selectedProjectId === 'ALL') return projects;
    return projects.filter((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Tasks for filtered projects
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'ALL') return tasks;
    return tasks.filter((t) => t.project_id === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Overall Task Completion Stats
  const totalTasksCount = filteredTasks.length;
  const completedTasksCount = filteredTasks.filter((t) => t.stage_key === 'DONE').length;
  const inProgressTasksCount = filteredTasks.filter((t) => t.stage_key !== 'DONE' && t.stage_key !== 'BACKLOG').length;
  const overallCompletionRate = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Live team productivity from real tasks
  const teamProductivity = useMemo(() => {
    return teamMembers
      .filter((u) => u.role_id !== 'CLIENT')
      .map((u) => {
        const userTasks = filteredTasks.filter((t) => t.assignee_id === u.id);
        const completed = userTasks.filter((t) => t.stage_key === 'DONE').length;
        const total = userTasks.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : (u.utilization_percentage || 75);

        const avatar = u.full_name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          id: u.id,
          name: u.full_name,
          role: u.position || u.role_id,
          avatar,
          avatarUrl: u.avatar_url,
          rate: Math.min(100, Math.max(10, rate)),
          tasksCount: total,
          completedCount: completed,
        };
      });
  }, [teamMembers, filteredTasks]);

  // Delayed projects detection
  const delayedProjects = useMemo(() => {
    const now = new Date();
    return filteredProjects
      .filter((p) => {
        if (!p.target_end_date) return false;
        const target = new Date(p.target_end_date);
        return p.stage !== 'COMPLETED' && target < now;
      })
      .map((p) => {
        const target = new Date(p.target_end_date!);
        const now = new Date();
        const diffDays = Math.ceil((now.getTime() - target.getTime()) / (1000 * 3600 * 24));
        return {
          id: p.id,
          name: p.title,
          expectedEnd: target.toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          delay: isId ? `+${diffDays} hari` : `+${diffDays} days`,
          status: isId ? 'Terlambat' : 'Delayed',
        };
      });
  }, [filteredProjects, isId]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {isId ? 'Laporan & Analitik' : 'Reports & Analytics'}
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            {isId ? 'Analitik Database Langsung' : 'Live Database Analytics'}
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {isId 
            ? 'Analisis performa penyelesaian proyek, beban kerja, dan produktivitas tim lintas sprint pengiriman.' 
            : 'Analyze project delivery performance, workload distribution, and team productivity across sprints.'}
        </p>
      </div>

      {/* Filter Row & Sync status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          >
            <option value="Last 30 Days">{isId ? '30 Hari Terakhir' : 'Last 30 Days'}</option>
            <option value="Last Quarter">{isId ? 'Kuartal Terakhir' : 'Last Quarter'}</option>
            <option value="Year to Date">{isId ? 'Tahun Berjalan (YTD)' : 'Year to Date'}</option>
          </select>

          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          >
            <option value="ALL">
              {isId ? `Semua Proyek (${projects.length})` : `All Projects (${projects.length})`}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>{isId ? 'Tersinkronisasi Langsung dengan Database' : 'Live Synchronized with Database'}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">{isId ? 'Menghitung analitik database...' : 'Calculating database analytics...'}</span>
        </div>
      ) : (
        <>
          {/* Top Grid: Delivery Performance (Left) & Team Productivity (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Delivery Performance & Sprint Progress (Replaces Costs vs Budget) */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {isId ? 'Performa Pengiriman Proyek' : 'Delivery Performance & Progress'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isId 
                      ? 'Tingkat penyelesaian tugas dan pencapaian milestone delivery seluruh proyek.' 
                      : 'Task completion throughput and delivery milestone progression.'}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>{overallCompletionRate}% {isId ? 'Selesai' : 'Completed'}</span>
                </span>
              </div>

              {/* 3 Metrics in Row */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                    {isId ? 'Total Tugas' : 'Total Tasks'}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] font-mono mt-0.5">
                    {totalTasksCount}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                    {isId ? 'Sedang Dikerjakan' : 'In Progress'}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-blue-400 font-mono mt-0.5">
                    {inProgressTasksCount}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] block">
                    {isId ? 'Tugas Selesai' : 'Completed'}
                  </span>
                  <div className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <span>{completedTasksCount}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                </div>
              </div>

              {/* Project Streams Progress Bars */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">
                    {isId ? 'Alur Pengerjaan Tiap Proyek' : 'Active Project Progress'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {filteredProjects.length} {isId ? 'Proyek' : 'Projects'}
                  </span>
                </div>

                <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                  {filteredProjects.map((p) => {
                    const projTasks = tasks.filter((t) => t.project_id === p.id);
                    const done = projTasks.filter((t) => t.stage_key === 'DONE').length;
                    const pct = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : (p.progress_percentage ?? 0);

                    return (
                      <div key={p.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-[var(--text-primary)] truncate max-w-[220px]">
                            {p.title}
                          </span>
                          <span className="font-mono text-[11px] text-[var(--text-secondary)] shrink-0">
                            {done}/{projTasks.length} {isId ? 'tugas' : 'tasks'} • {pct}%
                          </span>
                        </div>

                        <div className="h-2 bg-[var(--bg-surface-subtle)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 2: Team Productivity */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 flex flex-col justify-between space-y-5 shadow-xs">
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {isId ? 'Produktivitas Tim' : 'Team Productivity'}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {isId 
                        ? 'Tingkat penyelesaian tugas dan kapasitas tim rekayasa perangkat lunak.' 
                        : 'Delivery completion and task throughput across engineering team.'}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 rounded border border-[var(--border-default)]">
                    {teamProductivity.length} {isId ? 'Anggota' : 'Members'}
                  </span>
                </div>

                {/* Members List */}
                <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)] max-h-72 overflow-y-auto pr-1">
                  {teamProductivity.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2.5 w-40 shrink-0">
                        <div className="w-7 h-7 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[10px] text-[var(--text-primary)] shrink-0 overflow-hidden">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            m.avatar
                          )}
                        </div>
                        <div className="truncate">
                          <span className="font-semibold text-[var(--text-primary)] block truncate">
                            {m.name}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block truncate">
                            {m.role}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex-1 bg-[var(--bg-surface-subtle)] h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            m.rate >= 80 ? 'bg-emerald-500' : m.rate >= 60 ? 'bg-[var(--accent-primary)]' : 'bg-slate-500'
                          }`}
                          style={{ width: `${m.rate}%` }}
                        />
                      </div>

                      <div className="text-right w-24 shrink-0">
                        <div className="font-mono font-bold text-[var(--text-primary)]">
                          {m.rate}%
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">
                          {m.completedCount}/{m.tasksCount} {isId ? 'tugas' : 'tasks'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer SLA */}
              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{isId ? 'Target SLA Pengiriman' : 'Target delivery SLA'}</span>
                <span className="font-mono font-semibold text-[var(--text-primary)]">
                  &ge; 75% {isId ? 'per periode cadence' : 'per cadence'}
                </span>
              </div>
            </div>
          </div>

          {/* Delayed Projects Table */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-[var(--border-default)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Pemantau Keterlambatan Proyek' : 'Delayed Projects Monitor'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isId 
                    ? 'Proyek yang terindikasi melewati target tanggal rilis milestone.' 
                    : 'Projects tracking behind target milestone delivery dates.'}
                </p>
              </div>

              <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
                delayedProjects.length > 0 
                  ? 'text-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--accent-border)]'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
              }`}>
                {delayedProjects.length > 0 
                  ? (isId ? `${delayedProjects.length} Proyek Perlu Evaluasi` : `${delayedProjects.length} Items Requiring Review`)
                  : (isId ? 'Semua Proyek Sesuai Target' : 'All Projects On Track')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
                  <tr>
                    <th className="py-2.5 px-5">{isId ? 'Proyek' : 'Project'}</th>
                    <th className="py-2.5 px-4">{isId ? 'Target Tanggal Akhir' : 'Expected End Date'}</th>
                    <th className="py-2.5 px-4">{isId ? 'Deviasi Jadwal' : 'Timeline Deviation'}</th>
                    <th className="py-2.5 px-4 text-right">{isId ? 'Status' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {delayedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-[var(--text-muted)]">
                        {isId 
                          ? '✓ Tidak ada proyek yang mengalami keterlambatan target tanggal.' 
                          : '✓ No projects are tracking behind schedule.'}
                      </td>
                    </tr>
                  ) : (
                    delayedProjects.map((dp) => (
                      <tr key={dp.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[var(--text-primary)]">
                          {dp.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                          {dp.expectedEnd}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-primary)]">
                          {dp.delay}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            <span>{dp.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project & Operational Insights Card */}
          <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-start gap-4 shadow-xs">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
              <h4 className="text-xs font-bold text-[var(--text-primary)]">
                {isId ? 'Wawasan Pengiriman & Produktivitas Tim' : 'Project Delivery & Team Insights'}
              </h4>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>
                  {isId 
                    ? `Total ${filteredProjects.length} proyek aktif sedang berjalan dengan rata-rata penyelesaian sprint di angka `
                    : `Total of ${filteredProjects.length} active projects in delivery with average sprint completion at `}
                  <strong className="text-[var(--text-primary)]">{overallCompletionRate}%</strong>.
                </li>
                <li>
                  {isId 
                    ? `Kapasitas dan utilisasi tim engineering saat ini berada di rata-rata `
                    : `Overall engineering team capacity utilization is tracking at `}
                  <strong className="text-[var(--text-primary)]">
                    {teamProductivity.length > 0 ? Math.round(teamProductivity.reduce((sum, t) => sum + t.rate, 0) / teamProductivity.length) : 80}%
                  </strong>.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
