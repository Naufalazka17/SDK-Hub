import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Calendar, Search, Filter, ArrowRight, 
  ChevronLeft, ChevronRight, CheckSquare, Clock, 
  ShieldCheck, Loader2, Sparkles, Building2
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ProjectHealthScore } from '../components/common/ProjectHealthScore';
import { ProjectWithDetails } from '../types';
import { toast } from 'sonner';

export const GlobalTimelinePage: React.FC = () => {
  const { projects, isLoading, setCurrentProjectId } = useProject();
  const { isClient, currentProfile } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [baseYear, setBaseYear] = useState<number>(2026);

  // Month definition for the Gantt columns
  const months = useMemo(() => [
    { label: 'Jan', month: 0 },
    { label: 'Feb', month: 1 },
    { label: 'Mar', month: 2 },
    { label: 'Apr', month: 3 },
    { label: isId ? 'Mei' : 'May', month: 4 },
    { label: 'Jun', month: 5 },
    { label: 'Jul', month: 6 },
    { label: isId ? 'Agu' : 'Aug', month: 7 },
    { label: 'Sep', month: 8 },
    { label: isId ? 'Okt' : 'Oct', month: 9 },
    { label: 'Nov', month: 10 },
    { label: isId ? 'Des' : 'Dec', month: 11 },
  ], [isId]);

  // Visible projects based on client role
  const visibleProjects = isClient && currentProfile?.client_id
    ? projects.filter((p) => p.client_id === currentProfile.client_id)
    : projects;

  const filteredProjects = visibleProjects.filter((p) => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((p as any).client?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = stageFilter === 'ALL' ? true : p.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // Calculate coordinates for project bar
  const calculateBarPosition = (startDateStr?: string | null, endDateStr?: string | null) => {
    const yearStart = new Date(baseYear, 0, 1).getTime();
    const yearEnd = new Date(baseYear, 11, 31).getTime();
    const yearDuration = yearEnd - yearStart;

    const start = startDateStr ? new Date(startDateStr).getTime() : new Date(baseYear, 0, 15).getTime();
    const end = endDateStr ? new Date(endDateStr).getTime() : new Date(baseYear, 7, 30).getTime();

    // Clamp within the baseYear bounds
    const clampedStart = Math.max(yearStart, Math.min(yearEnd, start));
    const clampedEnd = Math.max(clampedStart, Math.min(yearEnd, end));

    const leftPct = ((clampedStart - yearStart) / yearDuration) * 100;
    const widthPct = Math.max(2.5, ((clampedEnd - clampedStart) / yearDuration) * 100);

    return { leftPct, widthPct };
  };

  // Today marker position
  const today = new Date();
  const yearStart = new Date(baseYear, 0, 1).getTime();
  const yearEnd = new Date(baseYear, 11, 31).getTime();
  const todayPct = today.getFullYear() === baseYear
    ? ((today.getTime() - yearStart) / (yearEnd - yearStart)) * 100
    : null;

  const handleSelectProject = (project: ProjectWithDetails) => {
    setCurrentProjectId(project.id);
    toast.success(isId ? `Proyek aktif dialihkan ke ${project.code} • ${project.title}` : `Active project switched to ${project.code} • ${project.title}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Jadwal Global & Bagan Gantt' : 'Global Timeline & Gantt Chart'}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]">
              <Globe className="w-3.5 h-3.5" />
              <span>{visibleProjects.length} {isId ? 'Proyek Terjadwal' : 'Scheduled Projects'}</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId 
              ? 'Peta jadwal pengerjaan lintas seluruh proyek SDK, dari tanggal inisiasi hingga deadline akhir rilis.'
              : 'Cross-project delivery timeline map from initiation to target release.'}
          </p>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setBaseYear((prev) => prev - 1)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] rounded transition-colors"
              title={isId ? 'Tahun Sebelumnya' : 'Previous Year'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold font-mono text-[var(--text-primary)]">
              {baseYear}
            </span>
            <button
              type="button"
              onClick={() => setBaseYear((prev) => prev + 1)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] rounded transition-colors"
              title={isId ? 'Tahun Berikutnya' : 'Next Year'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isId ? 'Cari kode, nama proyek, atau klien...' : 'Search code, project name, or client...'}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-[var(--text-muted)] flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>{isId ? 'Fase:' : 'Stage:'}</span>
          </span>
          {['ALL', 'PLANNING', 'DEVELOPMENT', 'QA_SIT', 'UAT', 'COMPLETED'].map((stg) => (
            <button
              key={stg}
              type="button"
              onClick={() => setStageFilter(stg)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors shrink-0 ${
                stageFilter === stg
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {stg === 'ALL' ? (isId ? 'Semua' : 'All') : stg}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
            <span>{isId ? 'Memuat seluruh jadwal proyek...' : 'Loading all project timelines...'}</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            {isId ? 'Tidak ada proyek yang sesuai dengan filter pencarian.' : 'No projects match the search filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Row: Left Meta Header and Right Months */}
              <div className="grid grid-cols-12 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-xs font-bold text-[var(--text-secondary)]">
                {/* Meta Column (4 cols) */}
                <div className="col-span-4 p-3 border-r border-[var(--border-default)]">
                  {isId ? 'Informasi Proyek' : 'Project Information'}
                </div>

                {/* Timeline Grid Months (8 cols) */}
                <div className="col-span-8 grid grid-cols-12 divide-x divide-[var(--border-subtle)] text-center text-[11px] font-mono">
                  {months.map((m) => (
                    <div key={m.label} className="py-3 px-1">
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body: Project Rows */}
              <div className="divide-y divide-[var(--border-subtle)]">
                {filteredProjects.map((p) => {
                  const clientName = (p as any).client?.name || (isId ? 'Subaga Internal' : 'Subaga Internal');
                  const progress = p.progress_percentage || 0;
                  const { leftPct, widthPct } = calculateBarPosition(p.start_date, p.target_end_date);
                  const isCompleted = p.stage === 'COMPLETED';

                  return (
                    <div
                      key={p.id}
                      className="grid grid-cols-12 hover:bg-[var(--bg-surface-subtle)] transition-colors group"
                    >
                      {/* Left: Project Card Summary (4 cols) */}
                      <div className="col-span-4 p-3.5 border-r border-[var(--border-default)] flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]">
                              {p.code}
                            </span>
                            <ProjectHealthScore />
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                              {p.stage}
                            </span>
                          </div>

                          <h3 className="font-bold text-xs text-[var(--text-primary)] mt-1.5 truncate group-hover:text-[var(--accent-primary)] transition-colors">
                            {p.title}
                          </h3>

                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3 h-3 text-[var(--text-muted)]" />
                            <span className="truncate">{clientName}</span>
                          </div>
                        </div>

                        {/* Dates & Actions */}
                        <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
                          <span className="font-mono">
                            {p.start_date ? new Date(p.start_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' }) : 'Jan'} 
                            {' → '}
                            {p.target_end_date ? new Date(p.target_end_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (isId ? 'Des' : 'Dec')}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectProject(p);
                                navigate(`/projects/${p.id}/board`);
                              }}
                              className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[10px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                            >
                              Kanban
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectProject(p);
                                navigate(`/projects/${p.id}/timeline`);
                              }}
                              className="px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[10px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                            >
                              Timeline
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Gantt Bar Timeline (8 cols) */}
                      <div className="col-span-8 p-3.5 relative flex items-center">
                        {/* Background Grid Lines for 12 months */}
                        <div className="absolute inset-0 grid grid-cols-12 divide-x divide-[var(--border-subtle)] pointer-events-none opacity-40">
                          {months.map((m) => (
                            <div key={m.label} className="h-full" />
                          ))}
                        </div>

                        {/* Today Marker */}
                        {todayPct !== null && todayPct >= 0 && todayPct <= 100 && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none"
                            style={{ left: `${todayPct}%` }}
                            title="Hari Ini"
                          >
                            <span className="absolute -top-1 -left-2 w-4 h-2 bg-rose-500 text-[8px] text-white flex items-center justify-center rounded-xs font-mono">
                              Now
                            </span>
                          </div>
                        )}

                        {/* Project Schedule Bar */}
                        <div
                          className="relative h-8 rounded-lg overflow-hidden shadow-xs transition-all cursor-pointer group/bar flex items-center px-2.5 z-0"
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          onClick={() => handleSelectProject(p)}
                          title={`${p.title} (${progress}% selesai)`}
                        >
                          {/* Background Bar */}
                          <div className={`absolute inset-0 ${
                            isCompleted ? 'bg-emerald-600/30 border border-emerald-500/50' : 'bg-[var(--accent-primary)]/25 border border-[var(--accent-border)]'
                          }`} />

                          {/* Progress Fill */}
                          <div
                            className={`absolute top-0 bottom-0 left-0 transition-all duration-300 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'
                            }`}
                            style={{ width: `${progress}%` }}
                          />

                          {/* Text on Bar */}
                          <div className="relative z-10 flex items-center justify-between w-full text-[11px] font-bold text-white drop-shadow-xs truncate">
                            <span className="truncate pr-1">{p.code} • {p.title}</span>
                            <span className="font-mono text-[10px] shrink-0 bg-black/40 px-1.5 py-0.2 rounded">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
