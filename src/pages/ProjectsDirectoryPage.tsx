import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, MoreHorizontal, ChevronLeft, ChevronRight,
  Trash2, ExternalLink, Loader2, AlertTriangle, X
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { can } from '../lib/permissions';
import { projectService } from '../services/projectService';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

export const ProjectsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading, refreshProjects, setCurrentProjectId } = useProject();
  const { role, isClient, currentProfile } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // If role is Client, filter only projects assigned to this client
  const clientScopedProjects = isClient && currentProfile?.client_id
    ? projects.filter((p) => p.client_id === currentProfile.client_id)
    : projects;

  // Extract unique client names for filter dropdown
  const uniqueClients = Array.from(
    new Set(
      projects
        .map((p) => (p as any).client?.name || p.client_id)
        .filter(Boolean)
    )
  );

  const filteredProjects = clientScopedProjects.filter((p) => {
    const clientName = (p as any).client?.name || 'Acme Corp';
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.stage === statusFilter;
    const matchesClient = clientFilter === 'All' || clientName === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await projectService.deleteProject(projectToDelete.id, role);
      await refreshProjects();
      toast.success(isId ? `Proyek "${projectToDelete.title}" berhasil dihapus dari database.` : `Project "${projectToDelete.title}" deleted successfully.`);
      setProjectToDelete(null);
    } catch (err: any) {
      console.error('Error deleting project:', err);
      toast.error(err.message || (isId ? 'Gagal menghapus proyek' : 'Failed to delete project'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal (Admin only) */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {isId ? 'Hapus Proyek?' : 'Delete Project?'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isId ? 'Aksi ini permanen dan akan menghapus seluruh task terkait di database.' : 'This action is permanent and will remove all related tasks in the database.'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] font-semibold">
              {projectToDelete.title}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isId ? 'Menghapus...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isId ? 'Hapus Permanen' : 'Delete Permanently'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {isId ? 'Direktori Proyek' : 'Projects Directory'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId ? 'Lihat, kelola, dan pantau status seluruh portofolio proyek perangkat lunak.' : 'View, manage, and monitor the entire software project portfolio.'}
          </p>
        </div>

        {/* Create Project Button: Visible ONLY for Admin & Project Lead */}
        {can(role, 'project:create') && (
          <button
            type="button"
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isId ? 'Buat Proyek Baru' : 'New Project'}</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isId ? 'Cari berdasarkan judul, kode proyek, atau klien...' : 'Search by title, project code, or client...'}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="All">{isId ? 'Semua Tahapan' : 'All Stages'}</option>
          <option value="PITCHING">PITCHING</option>
          <option value="ANALYSIS">ANALYSIS</option>
          <option value="DEVELOPMENT">DEVELOPMENT</option>
          <option value="STAGING">STAGING</option>
          <option value="QA_SIT">QA / SIT</option>
          <option value="UAT">UAT</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>

        {/* Client Dropdown */}
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="All">{isId ? 'Semua Klien' : 'All Clients'}</option>
          {uniqueClients.map((client) => (
            <option key={String(client)} value={String(client)}>
              {String(client)}
            </option>
          ))}
        </select>
      </div>

      {/* Projects Cards (Mobile < md) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
            <span className="text-xs">{isId ? 'Memuat proyek dari database...' : 'Loading projects from database...'}</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
            <p className="text-xs">{isId ? 'Tidak ada proyek yang sesuai dengan kriteria pencarian' : 'No projects matching search criteria'}</p>
          </div>
        ) : (
          filteredProjects.map((p) => {
            const clientName = (p as any).client?.name || 'Subaga Internal';
            const progress = p.progress_percentage || 0;

            return (
              <div
                key={p.id}
                onClick={() => {
                  setCurrentProjectId(p.id);
                  navigate(isClient ? `/projects/${p.id}/cockpit` : `/projects/${p.id}`);
                }}
                className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xs space-y-3 cursor-pointer hover:border-[var(--accent-primary)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[var(--accent-primary)]">
                    {p.code}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {p.stage}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)] leading-snug">
                    {p.title}
                  </h3>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {clientName} • {p.template_type}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                    <span>{isId ? 'Progres' : 'Progress'}</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg-surface-subtle)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-primary)]"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                  <span>{p.start_date || 'N/A'} – {p.target_end_date || (isId ? 'Berjalan' : 'Ongoing')}</span>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => navigate(isClient ? `/projects/${p.id}/cockpit` : `/projects/${p.id}`)}
                      className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]"
                      title={isId ? 'Buka' : 'Open'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    {can(role, 'project:delete') && (
                      <button
                        type="button"
                        onClick={() => setProjectToDelete({ id: p.id, title: p.title })}
                        className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                        title={isId ? 'Hapus Proyek' : 'Delete Project'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Projects Table Card (Tablet & Desktop >= md) */}
      <div className="hidden md:block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto touch-pan-x no-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-secondary)] font-semibold bg-[var(--bg-surface-subtle)]">
                <th className="py-2.5 px-4">{isId ? 'Kode' : 'Code'}</th>
                <th className="py-2.5 px-4">{isId ? 'Nama Proyek' : 'Project Name'}</th>
                <th className="py-2.5 px-4">{isId ? 'Klien' : 'Client'}</th>
                <th className="py-2.5 px-4">{isId ? 'Progres' : 'Progress'}</th>
                <th className="py-2.5 px-4">{isId ? 'Fase' : 'Stage'}</th>
                <th className="py-2.5 px-4">{isId ? 'Jadwal' : 'Timeline'}</th>
                <th className="py-2.5 px-4 text-right">{isId ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Memuat proyek dari database...' : 'Loading projects from database...'}</span>
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    {isId ? 'Tidak ada proyek yang sesuai dengan kriteria pencarian' : 'No projects matching search criteria'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const clientName = (p as any).client?.name || 'Subaga Internal';
                  const progress = p.progress_percentage || 0;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setCurrentProjectId(p.id);
                        navigate(isClient ? `/projects/${p.id}/cockpit` : `/projects/${p.id}`);
                      }}
                      className="hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[var(--accent-primary)]">
                        {p.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                          {p.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {p.delivery_model} • {p.template_type}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] font-medium">
                        {clientName}
                      </td>
                      <td className="py-3 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[var(--bg-surface-subtle)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--accent-primary)]"
                              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[var(--text-secondary)] w-8 text-right">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {p.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[var(--text-muted)]">
                        {p.start_date || 'N/A'} – {p.target_end_date || (isId ? 'Berjalan' : 'Ongoing')}
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(isClient ? `/projects/${p.id}/cockpit` : `/projects/${p.id}`)}
                            title={isId ? 'Buka Proyek' : 'Open Project'}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Action: Visible ONLY to Admin */}
                          {can(role, 'project:delete') && (
                            <button
                              type="button"
                              onClick={() => setProjectToDelete({ id: p.id, title: p.title })}
                              title={isId ? 'Hapus Proyek (Admin Only)' : 'Delete Project (Admin Only)'}
                              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-[var(--border-default)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{isId ? `Menampilkan ${filteredProjects.length} proyek aktif` : `Showing ${filteredProjects.length} active projects`}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="p-1 rounded border border-[var(--border-default)] text-[var(--text-muted)] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-[var(--text-primary)]">1</span>
            <button
              type="button"
              disabled
              className="p-1 rounded border border-[var(--border-default)] text-[var(--text-muted)] disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
