import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Pencil, MoreHorizontal, Calendar, 
  Clock, Shield, Building, Sparkles, Loader2,
  FolderKanban, Users, Activity
} from 'lucide-react';
import { ProjectSubTabs } from '../components/common/ProjectSubTabs';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { supabase } from '../lib/supabase';
import { ProjectWithDetails, TaskWithDetails, ActivityLogWithDetails } from '../types';
import { can } from '../lib/permissions';
import { toast } from 'sonner';

interface ProjectMemberWithProfile {
  id: string;
  user_id: string;
  role_in_project: string;
  allocated_hours_per_week: number | null;
  profile: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    position: string | null;
    department: string | null;
    role_id: string;
  } | null;
}

const isValidUuid = (val?: string): val is string => 
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentProject, setCurrentProjectId, projects } = useProject();
  const { role } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [project, setProject] = useState<ProjectWithDetails | null>(null);
  const [members, setMembers] = useState<ProjectMemberWithProfile[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [activities, setActivities] = useState<ActivityLogWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize and load specific project by ID safely
  useEffect(() => {
    let isMounted = true;

    const loadProjectData = async () => {
      const targetId = id;
      
      // If id is not a valid UUID, gracefully redirect to currentProject or first project
      if (!isValidUuid(targetId)) {
        if (currentProject?.id && isValidUuid(currentProject.id)) {
          navigate(`/projects/${currentProject.id}`, { replace: true });
          return;
        }
        if (projects.length > 0 && isValidUuid(projects[0]?.id)) {
          navigate(`/projects/${projects[0].id}`, { replace: true });
          return;
        }
        setIsLoading(false);
        return;
      }

      const activeId: string = targetId;

      try {
        setIsLoading(true);
        setCurrentProjectId(activeId);

        // Fetch project details, members, tasks, and activities concurrently
        const [projData, membersRes, taskList, activityRes] = await Promise.all([
          projectService.getProjectById(activeId),
          supabase
            .from('project_members')
            .select('*, profile:profiles(*)')
            .eq('project_id', activeId),
          taskService.getTasks(activeId),
          supabase
            .from('activity_logs')
            .select('*, actor:profiles(*)')
            .eq('project_id', activeId)
            .order('created_at', { ascending: false })
            .limit(6),
        ]);

        if (!isMounted) return;

        if (projData) {
          setProject(projData);
        } else {
          const found = projects.find((p) => p.id === targetId);
          if (found) setProject(found);
        }

        setMembers((membersRes.data || []) as ProjectMemberWithProfile[]);
        setTasks(taskList || []);
        setActivities((activityRes.data || []) as ActivityLogWithDetails[]);
      } catch (err: any) {
        console.error('Error loading project details:', err);
        if (isMounted) {
          toast.error(isId ? 'Gagal memuat detail proyek dari database' : 'Failed to load project details from database');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadProjectData();

    return () => {
      isMounted = false;
    };
  }, [id, currentProject?.id, projects.length]);

  // Fallback to currentProject if not loaded yet
  const displayProject = project || currentProject;

  const projectTitle = displayProject?.title || (isId ? 'Memuat Proyek...' : 'Loading Project...');
  const projectCode = displayProject?.code || 'PRJ';
  const clientName = (displayProject as any)?.client?.name || (displayProject as any)?.client?.company || (isId ? 'Proyek Internal Subaga' : 'Internal Subaga Project');

  // Live task completion calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.stage_key === 'DONE').length;
  const completionPct = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : (displayProject?.progress_percentage ?? 0);

  // Active milestone / stage
  const currentStage = displayProject?.stage || 'PITCHING';

  return (
    <div className="space-y-6">
      {/* Top Header Row with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {projectTitle}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {currentStage}
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId ? 'Klien' : 'Client'}: <strong className="text-[var(--text-primary)]">{clientName}</strong> • {projectCode}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-xs font-semibold text-[var(--text-secondary)]">
              {isId ? 'Kemajuan Keseluruhan' : 'Overall Completion'}{' '}
              <span className="font-bold text-[var(--text-primary)]">{completionPct}%</span>
            </div>
            <div className="w-48 bg-[var(--bg-surface-subtle)] h-2 rounded-full overflow-hidden mt-1.5">
              <div 
                className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }} 
              />
            </div>
          </div>

          {/* Action Buttons: Only shown if user has permission (Hidden for Staff) */}
          <div className="flex items-center gap-2">
            {can(role, 'project:edit') && (
              <button
                type="button"
                onClick={() => toast.info(isId ? 'Fitur edit detail proyek akan segera dibuka' : 'Edit project feature coming soon')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{isId ? 'Ubah Proyek' : 'Edit Project'}</span>
              </button>
            )}
            {can(role, 'project:delete') && (
              <button
                type="button"
                title={isId ? 'Kelola Proyek' : 'Manage Project'}
                onClick={() => toast.info(isId ? 'Akses manajemen proyek' : 'Project management access')}
                className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)]"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reusable Project Sub-tabs (Highlight Overview only when exactly on Overview) */}
      <ProjectSubTabs activeTab="overview" />

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">{isId ? 'Memuat data proyek dari database...' : 'Loading project data from database...'}</span>
        </div>
      ) : (
        /* Main Grid: Left 2/3 and Right 1/3 */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Project Description */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-2.5 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {isId ? 'Deskripsi Proyek' : 'Project Description'}
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                {displayProject?.description || 
                  (isId 
                    ? `${projectTitle} adalah inisiatif digital yang dikelola melalui kerangka pengiriman SDK Hub dengan model ${displayProject?.delivery_model || 'Custom'}.`
                    : `${projectTitle} is a digital initiative managed through SDK Hub delivery framework under the ${displayProject?.delivery_model || 'Custom'} model.`)}
              </p>
            </div>

            {/* Section 2: Current Delivery Milestone */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {isId ? 'Tahap & Progres Saat Ini' : 'Current Stage & Progress'}
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {completedTasks} {isId ? 'dari' : 'of'} {totalTasks} {isId ? 'Tugas Selesai' : 'Tasks Completed'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {currentStage}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-blue-400 bg-blue-500/10 border border-blue-500/30">
                    ● {isId ? 'Tahap Pengiriman Aktif' : 'Active Delivery Stage'}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isId ? 'Templat' : 'Template'}: <strong className="text-[var(--text-primary)]">{displayProject?.template_type || 'Custom Application'}</strong> • {isId ? 'Model Pengiriman' : 'Delivery Model'}: <strong className="text-[var(--text-primary)]">{displayProject?.delivery_model || 'Custom'}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)] font-medium">
                    {isId ? 'Tingkat Penyelesaian Tugas' : 'Task Completion Rate'}
                  </span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{completionPct}%</span>
                </div>
                <div className="w-full bg-[var(--bg-surface-subtle)] h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, completionPct))}%` }} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                <span>{isId ? 'Skor Kesehatan' : 'Health Score'}: <strong className="text-emerald-400 font-mono">{displayProject?.health_score ?? 95}%</strong></span>
                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Target: {displayProject?.target_end_date ? new Date(displayProject.target_end_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</span>
                </div>
              </div>
            </div>

            {/* Section 3: Recent Activity */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {isId ? 'Aktivitas Terkini' : 'Recent Activity'}
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {isId ? 'Jejak Aktivitas Langsung' : 'Live Activity Trail'}
                </span>
              </div>

              <div className="space-y-4">
                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                    {isId ? 'Belum ada riwayat aktivitas terbaru untuk proyek ini.' : 'No recent activity recorded for this project.'}
                  </div>
                ) : (
                  activities.map((act) => {
                    const details = act.details as Record<string, any> | null;
                    const detailLabel = details?.title || details?.task_title || details?.file_name || '';
                    return (
                      <div key={act.id} className="flex items-start gap-3 text-xs">
                        <div className="w-3 h-3 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-surface)] mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[var(--text-primary)] leading-tight">
                            {act.action.replace(/_/g, ' ')}{detailLabel ? `: ${detailLabel}` : ''}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                            {act.actor?.full_name || 'System User'} <span className="mx-1">•</span> {new Date(act.created_at || '').toLocaleString(isId ? 'id-ID' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Card 1: Team Members */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                    {isId ? 'Tim Proyek' : 'Project Team'}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                    {members.length}
                  </span>
                </div>

                {/* Manage Team Button: Hidden for Staff */}
                {can(role, 'project:edit') && (
                  <button
                    type="button"
                    onClick={() => navigate('/resources')}
                    className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                  >
                    {isId ? 'Kelola' : 'Manage'}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {members.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                    {isId ? 'Belum ada anggota tim yang dialokasikan.' : 'No team members allocated yet.'}
                  </div>
                ) : (
                  members.map((member) => {
                    const avatar = member.profile?.full_name
                      ? member.profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'NA';

                    return (
                      <div key={member.id} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-center justify-center font-bold text-[10px] text-[var(--text-primary)] shrink-0 overflow-hidden">
                            {member.profile?.avatar_url ? (
                              <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              avatar
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--text-primary)] truncate">
                              {member.profile?.full_name || 'Member'}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] truncate">
                              {member.profile?.position || member.profile?.department || 'Contributor'}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] px-2 py-0.5 rounded-md shrink-0 font-medium bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                          {member.role_in_project}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Card 2: Project Information */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Informasi Proyek' : 'Project Information'}
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">{isId ? 'Pimpinan Proyek' : 'Project Lead'}</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {displayProject?.lead?.full_name || (isId ? 'Ulba (Project Manager)' : 'Ulba (Project Manager)')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">{isId ? 'Model Pengiriman' : 'Delivery Model'}</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {displayProject?.delivery_model || 'Custom'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">{isId ? 'Tanggal Mulai' : 'Start Date'}</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {displayProject?.start_date ? new Date(displayProject.start_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : (isId ? 'Tertunda' : 'Pending')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-secondary)]">{isId ? 'Target Selesai' : 'Target End Date'}</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {displayProject?.target_end_date ? new Date(displayProject.target_end_date).toLocaleDateString(isId ? 'id-ID' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'TBD'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[var(--text-secondary)]">{isId ? 'Templat Alur Kerja' : 'Project Template'}</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {displayProject?.template_type || 'Custom Application'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
