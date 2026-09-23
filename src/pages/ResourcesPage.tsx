import React, { useState, useEffect } from 'react';
import { 
  Search, Pencil, CheckSquare, Briefcase, 
  Loader2, Calendar, Clock, AlertTriangle,
  FolderKanban, X, Save, Plus, Trash2,
  UploadCloud, User
} from 'lucide-react';
import { Drawer } from '../components/common/Drawer';
import { userService, UserWithDetails } from '../services/userService';
import { projectService } from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Project, TaskWithDetails, KANBAN_COLUMNS } from '../types';
import { toast } from 'sonner';
import { can } from '../lib/permissions';

export const ResourcesPage: React.FC = () => {
  const { role: currentUserRole } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';
  const canEditAllocation = can(currentUserRole, 'resource:edit');

  const [resources, setResources] = useState<UserWithDetails[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [availFilter, setAvailFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');

  // Selected resource for Drawer
  const [selectedResource, setSelectedResource] = useState<UserWithDetails | null>(null);
  const [drawerActiveTab, setDrawerActiveTab] = useState<'overview' | 'tasks' | 'edit'>('overview');

  // Assigned tasks for the selected resource
  const [assignedTasks, setAssignedTasks] = useState<TaskWithDetails[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Edit allocation form state
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<number>(40);
  const [editProjectAllocations, setEditProjectAllocations] = useState<{ projectId: string; title: string; allocatedHours: number }[]>([]);
  const [selectedNewProjectId, setSelectedNewProjectId] = useState<string>('');
  const [newProjectHours, setNewProjectHours] = useState<number>(10);
  const [isSavingAllocation, setIsSavingAllocation] = useState(false);

  // New Resource Modal State (CRUD: Create)
  const [isNewResourceModalOpen, setIsNewResourceModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'PROJECT_LEAD' | 'STAFF' | 'CLIENT'>('STAFF');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newPosition, setNewPosition] = useState('Senior Engineer');
  const [newWeeklyCapacity, setNewWeeklyCapacity] = useState(40);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoPreview, setNewPhotoPreview] = useState<string>('');
  const [newInitialProjectId, setNewInitialProjectId] = useState('');
  const [newInitialHours, setNewInitialHours] = useState(20);
  const [isSubmittingNewResource, setIsSubmittingNewResource] = useState(false);

  // Delete Resource Confirmation State (CRUD: Delete)
  const [resourceToDelete, setResourceToDelete] = useState<UserWithDetails | null>(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [usersList, projectsList] = await Promise.all([
        userService.getUsers(),
        projectService.getProjects(),
      ]);
      setResources(usersList);
      setAllProjects(projectsList);
    } catch (err: any) {
      console.error('Failed to load resources:', err);
      toast.error(isId ? 'Gagal memuat data sumber daya dari database' : 'Failed to load resource data from database');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setNewPhotoPreview(result);
        setNewPhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetNewResourceForm = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('STAFF');
    setNewDepartment('Engineering');
    setNewPosition('Senior Engineer');
    setNewWeeklyCapacity(40);
    setNewPhotoUrl('');
    setNewPhotoPreview('');
    setNewInitialProjectId('');
    setNewInitialHours(20);
  };

  const handleCloseNewResourceModal = () => {
    setIsNewResourceModalOpen(false);
    resetNewResourceForm();
  };

  const handleCreateNewResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      toast.error('Nama lengkap dan email wajib diisi.');
      return;
    }

    try {
      setIsSubmittingNewResource(true);
      const created = await userService.createUser(
        {
          full_name: newFullName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim() || undefined,
          role_id: newRole,
          department: newDepartment.trim(),
          position: newPosition.trim(),
          avatar_url: newPhotoUrl || undefined,
          max_weekly_hours: Number(newWeeklyCapacity) || 40,
        },
        currentUserRole
      );

      // If initial project allocated, create member allocation
      if (newInitialProjectId && created?.id) {
        await userService.updateAllocation(
          created.id,
          Number(newWeeklyCapacity) || 40,
          [{ projectId: newInitialProjectId, allocatedHours: Number(newInitialHours) || 20 }],
          currentUserRole
        );
      }

      toast.success(`Resource ${created.full_name} (${created.role_id}) berhasil ditambahkan!`);
      handleCloseNewResourceModal();
      await loadData();
    } catch (err: any) {
      console.error('Error creating resource:', err);
      toast.error(err.message || 'Gagal menambahkan resource baru.');
    } finally {
      setIsSubmittingNewResource(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      setIsDeletingResource(true);
      await userService.deleteUser(resourceToDelete.id, currentUserRole);
      toast.success(`Resource "${resourceToDelete.full_name}" berhasil dihapus dari sistem.`);
      setResourceToDelete(null);
      if (selectedResource?.id === resourceToDelete.id) {
        setSelectedResource(null);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error deleting resource:', err);
      toast.error(err.message || 'Gagal menghapus resource.');
    } finally {
      setIsDeletingResource(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When selectedResource changes, load their assigned tasks and prepare edit state
  useEffect(() => {
    if (!selectedResource) {
      setAssignedTasks([]);
      return;
    }

    const loadTasksForUser = async () => {
      try {
        setIsLoadingTasks(true);
        const tasks = await userService.getUserTasks(selectedResource.id);
        setAssignedTasks(tasks);
      } catch (err) {
        console.error('Error loading tasks for user:', err);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    loadTasksForUser();

    // Prepare edit state
    setMaxWeeklyHours(selectedResource.max_weekly_hours || 40);
    const existing = (selectedResource.assigned_projects || []).map((p) => ({
      projectId: p.id,
      title: p.title,
      allocatedHours: p.allocated_hours_per_week || 0,
    }));
    setEditProjectAllocations(existing);
  }, [selectedResource]);

  const handleOpenEditAllocation = (res?: UserWithDetails) => {
    if (res) setSelectedResource(res);
    setDrawerActiveTab('edit');
  };

  const handleOpenViewTasks = (res?: UserWithDetails) => {
    if (res) setSelectedResource(res);
    setDrawerActiveTab('tasks');
  };

  const handleSaveAllocation = async () => {
    if (!selectedResource) return;

    try {
      setIsSavingAllocation(true);
      await userService.updateAllocation(
        selectedResource.id,
        maxWeeklyHours,
        editProjectAllocations.map((p) => ({
          projectId: p.projectId,
          allocatedHours: p.allocatedHours,
        })),
        currentUserRole
      );

      toast.success(`Alokasi untuk ${selectedResource.full_name} berhasil diperbarui di database!`);
      const updatedUsers = await userService.getUsers();
      setResources(updatedUsers);

      // Refresh currently selected resource view
      const updatedUser = updatedUsers.find((u) => u.id === selectedResource.id);
      if (updatedUser) {
        setSelectedResource(updatedUser);
      }
      setDrawerActiveTab('overview');
    } catch (err: any) {
      console.error('Error saving allocation:', err);
      toast.error(err.message || 'Gagal memperbarui alokasi sumber daya');
    } finally {
      setIsSavingAllocation(false);
    }
  };

  const handleAddProjectToAllocation = () => {
    if (!selectedNewProjectId) return;
    const projectToAdd = allProjects.find((p) => p.id === selectedNewProjectId);
    if (!projectToAdd) return;

    if (editProjectAllocations.some((p) => p.projectId === selectedNewProjectId)) {
      toast.error('Proyek ini sudah ada di daftar alokasi');
      return;
    }

    setEditProjectAllocations((prev) => [
      ...prev,
      {
        projectId: projectToAdd.id,
        title: projectToAdd.title,
        allocatedHours: newProjectHours || 10,
      },
    ]);
    setSelectedNewProjectId('');
  };

  const handleRemoveProjectFromAllocation = (projectId: string) => {
    setEditProjectAllocations((prev) => prev.filter((p) => p.projectId !== projectId));
  };

  // Filter logic
  const filteredResources = resources.filter((r) => {
    const matchesSearch =
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.position && r.position.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'All' || r.position === roleFilter || r.role_id === roleFilter;

    let availCategory = 'Available';
    const util = r.utilization_percentage || 0;
    if (util >= 90) availCategory = 'Fully Allocated';
    else if (util > 0) availCategory = 'Partially Allocated';

    const matchesAvail = availFilter === 'All' || availCategory === availFilter;

    const matchesProject =
      projectFilter === 'All' ||
      (r.assigned_projects || []).some((p) => p.title.toLowerCase().includes(projectFilter.toLowerCase()));

    return matchesSearch && matchesRole && matchesAvail && matchesProject;
  });

  // Calculate live stats
  const totalAvailable = resources.filter((r) => (r.utilization_percentage || 0) === 0).length;
  const totalPartially = resources.filter((r) => (r.utilization_percentage || 0) > 0 && (r.utilization_percentage || 0) < 90).length;
  const totalOverloaded = resources.filter((r) => (r.utilization_percentage || 0) >= 90).length;

  return (
    <div className="space-y-6">
      {/* Delete Resource Confirmation Modal */}
      {resourceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-default)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Hapus Resource?</h3>
                <p className="text-xs text-[var(--text-secondary)]">Aksi ini permanen dan akan menghapus user dari daftar tim & alokasi proyek.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]">
              <div className="font-bold">{resourceToDelete.full_name}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{resourceToDelete.email} • {resourceToDelete.role_id}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setResourceToDelete(null)}
                disabled={isDeletingResource}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteResource}
                disabled={isDeletingResource}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {isDeletingResource ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Permanen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Resource / User Modal */}
      {isNewResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div 
            className="w-full max-w-lg bg-[var(--bg-surface-elevated)] rounded-xl border border-[var(--border-default)] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--accent-primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Tambah Resource Baru</h3>
              </div>
              <button 
                onClick={handleCloseNewResourceModal} 
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewResource} className="space-y-4">
              {/* Photo Profile Upload */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-700 border-2 border-[var(--accent-primary)] flex items-center justify-center shrink-0 relative">
                  {newPhotoPreview ? (
                    <img src={newPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-white opacity-60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">Foto Profil</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Upload JPG/PNG atau gunakan avatar otomatis</div>
                  <label className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-input)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[10px] font-semibold text-[var(--text-primary)] cursor-pointer transition-colors">
                    <UploadCloud className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>Pilih Foto</span>
                    <input type="file" accept="image/*" onChange={handlePhotoFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                    Nama Lengkap <span className="text-[var(--accent-primary)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Budi Santoso"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                    Email Perusahaan <span className="text-[var(--accent-primary)]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="budi@subaga.id"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Role & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="PROJECT_LEAD">PROJECT_LEAD</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CLIENT">CLIENT</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">Nomor Telepon</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Department & Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">Divisi / Department</label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. Engineering / Product"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">Jabatan / Keahlian</label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Capacity & Initial Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">Kapasitas (Jam/Minggu)</label>
                  <input
                    type="number"
                    min={10}
                    max={80}
                    value={newWeeklyCapacity}
                    onChange={(e) => setNewWeeklyCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">Tautkan Proyek Awal (Opsional)</label>
                  <select
                    value={newInitialProjectId}
                    onChange={(e) => setNewInitialProjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="">-- Belum Ada Proyek --</option>
                    {allProjects.map((p) => (
                      <option key={p.id} value={p.id}>{p.code} • {p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseNewResourceModal}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewResource}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingNewResource ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan Resource</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Manajemen Sumber Daya' : 'Resources Management'}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              {isId ? 'Database Langsung' : 'Live Database'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId ? 'Kelola kapasitas tim, edit alokasi jam mingguan, dan pantau penugasan tugas.' : 'Manage team capacity, edit weekly hour allocations, and inspect assigned tasks.'}
          </p>
        </div>

        {canEditAllocation && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNewResourceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isId ? 'Tambah Sumber Daya' : 'New Resource'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? 'Cari berdasarkan nama, email, jabatan...' : 'Search by name, email, role...'}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span>{isId ? 'Peran:' : 'Role:'}</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="All">{isId ? 'Semua Peran' : 'All Roles'}</option>
              <option value="ADMIN">Admin</option>
              <option value="PROJECT_LEAD">Project Lead</option>
              <option value="STAFF">{isId ? 'Staf / Engineer' : 'Staff / Engineer'}</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span>{isId ? 'Ketersediaan:' : 'Availability:'}</span>
            <select
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="All">{isId ? 'Semua' : 'All'}</option>
              <option value="Partially Allocated">{isId ? 'Dialokasikan Sebagian' : 'Partially Allocated'}</option>
              <option value="Fully Allocated">{isId ? 'Alokasi Penuh (>90%)' : 'Fully Allocated (>90%)'}</option>
              <option value="Available">{isId ? 'Tersedia (0%)' : 'Available (0%)'}</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <span>{isId ? 'Proyek:' : 'Project:'}</span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="All">{isId ? 'Semua Proyek' : 'All Projects'}</option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.title}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium self-end sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            {isId
              ? `${resources.length} Anggota Tim • ${totalAvailable} Tersedia • ${totalPartially} Sebagian • ${totalOverloaded} Penuh`
              : `${resources.length} Team Members • ${totalAvailable} Available • ${totalPartially} Partially • ${totalOverloaded} Full`}
          </span>
        </div>
      </div>

      {/* Resources Table */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">{isId ? 'Memuat data tim dan alokasi dari database...' : 'Loading team data and allocations from database...'}</span>
        </div>
      ) : (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto touch-pan-x no-scrollbar">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
                <tr>
                  <th className="py-2.5 px-5">{isId ? 'Nama & Email' : 'Name & Email'}</th>
                  <th className="py-2.5 px-4">{isId ? 'Jabatan / Peran' : 'Position / Role'}</th>
                  <th className="py-2.5 px-4">{isId ? 'Departemen' : 'Department'}</th>
                  <th className="py-2.5 px-4">{isId ? 'Proyek Aktif' : 'Active Projects'}</th>
                  <th className="py-2.5 px-4">{isId ? 'Alokasi Jam' : 'Allocated Hours'}</th>
                  <th className="py-2.5 px-4">{isId ? 'Utilitas' : 'Utilization'}</th>
                  <th className="py-2.5 px-4 text-right">{isId ? 'Aksi' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredResources.map((r) => {
                  const util = r.utilization_percentage || 0;
                  const totalHrs = r.total_allocated_hours || 0;
                  const maxHrs = r.max_weekly_hours || 40;

                  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
                  let badgeText = isId ? 'Tersedia' : 'Available';
                  if (util >= 100) {
                    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
                    badgeText = isId ? 'Kelebihan Beban' : 'Overallocated';
                  } else if (util >= 80) {
                    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
                    badgeText = isId ? 'Beban Tinggi' : 'High Load';
                  } else if (util > 0) {
                    badgeColor = 'text-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--accent-border)]';
                    badgeText = isId ? 'Sebagian' : 'Partially Allocated';
                  }

                  return (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelectedResource(r);
                        setDrawerActiveTab('overview');
                      }}
                      className={`hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer ${
                        selectedResource?.id === r.id ? 'bg-[var(--bg-surface-subtle)]' : ''
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-[var(--border-default)] flex items-center justify-center font-bold text-[10px] text-white shrink-0 overflow-hidden">
                            {r.avatar_url ? (
                              <img src={r.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              r.full_name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">
                              {r.full_name}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)] font-mono">
                              {r.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[var(--text-secondary)] font-medium">
                        {r.position || r.role_id}
                      </td>

                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {r.department || 'General'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(r.assigned_projects && r.assigned_projects.length > 0) ? (
                            r.assigned_projects.map((p) => (
                              <span 
                                key={p.id}
                                className="px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[10px] text-[var(--text-primary)] font-medium truncate max-w-[140px]"
                                title={`${p.title} (${p.allocated_hours_per_week}h/wk)`}
                              >
                                {p.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">
                              {isId ? 'Tidak ada proyek aktif' : 'No active projects'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                        {totalHrs}h / {maxHrs}h
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{badgeText} ({util}%)</span>
                          </span>
                          <div className="w-24 bg-[var(--bg-surface-subtle)] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${util >= 100 ? 'bg-rose-500' : util >= 80 ? 'bg-amber-500' : 'bg-[var(--accent-primary)]'}`}
                              style={{ width: `${Math.min(util, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewTasks(r);
                            }}
                            className="px-2 py-1 rounded bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1"
                            title={isId ? 'Lihat Tugas Tertugaskan' : 'View Assigned Tasks'}
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>{isId ? 'Tugas' : 'Tasks'}</span>
                          </button>
                          {canEditAllocation && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditAllocation(r);
                              }}
                              className="px-2 py-1 rounded bg-[var(--bg-surface-subtle)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)] border border-[var(--border-default)] text-[10px] font-semibold text-[var(--text-secondary)] transition-colors inline-flex items-center gap-1"
                              title={isId ? 'Edit Profil & Alokasi' : 'Edit Profile & Allocation'}
                            >
                              <Pencil className="w-3 h-3" />
                              <span>{isId ? 'Ubah' : 'Edit'}</span>
                            </button>
                          )}
                          {currentUserRole === 'ADMIN' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResourceToDelete(r);
                              }}
                              className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-semibold transition-colors inline-flex items-center gap-1"
                              title={isId ? 'Hapus Sumber Daya' : 'Delete Resource'}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{isId ? 'Hapus' : 'Delete'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Right Drawer: Resource Details, Tasks & Edit Allocation */}
      <Drawer
        isOpen={Boolean(selectedResource)}
        onClose={() => setSelectedResource(null)}
        title={
          drawerActiveTab === 'edit'
            ? (isId ? 'Edit Alokasi Sumber Daya' : 'Edit Resource Allocation')
            : drawerActiveTab === 'tasks'
            ? (isId ? 'Tugas Tertugaskan' : 'Assigned Tasks')
            : (isId ? 'Detail Sumber Daya' : 'Resource Details')
        }
        icon={<Briefcase className="w-4 h-4" />}
        footer={
          drawerActiveTab === 'edit' ? (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setDrawerActiveTab('overview')}
                className="w-1/3 py-2 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveAllocation}
                disabled={isSavingAllocation}
                className="w-2/3 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isSavingAllocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isId ? 'Simpan Perubahan' : 'Save Changes'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              {canEditAllocation && (
                <button
                  type="button"
                  onClick={() => handleOpenEditAllocation()}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isId ? 'Ubah Alokasi' : 'Edit Allocation'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenViewTasks()}
                className="flex-1 py-2.5 rounded-lg bg-[var(--accent-subtle)] hover:bg-[var(--accent-subtle)]/80 border border-[var(--accent-border)] text-xs font-semibold text-[var(--accent-primary)] flex items-center justify-center gap-2 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>View Tasks ({assignedTasks.length})</span>
              </button>
            </div>
          )
        }
      >
        {selectedResource && (
          <div className="space-y-6">
            {/* Header Resource Profile */}
            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-slate-800 border border-[var(--border-default)] flex items-center justify-center font-bold text-base text-white shrink-0 overflow-hidden">
                {selectedResource.avatar_url ? (
                  <img src={selectedResource.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  selectedResource.full_name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                  {selectedResource.full_name}
                </h3>
                <div className="text-xs text-[var(--text-secondary)]">
                  {selectedResource.position || selectedResource.role_id} • {selectedResource.department || 'General'}
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                  {selectedResource.email}
                </div>
              </div>
            </div>

            {/* Tab Navigation in Drawer */}
            <div className="flex border-b border-[var(--border-subtle)] gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDrawerActiveTab('overview')}
                className={`pb-2 border-b-2 transition-colors ${
                  drawerActiveTab === 'overview'
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Overview & Projects
              </button>
              <button
                type="button"
                onClick={() => setDrawerActiveTab('tasks')}
                className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                  drawerActiveTab === 'tasks'
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Assigned Tasks</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg-surface-subtle)] text-[10px] font-mono border border-[var(--border-default)]">
                  {assignedTasks.length}
                </span>
              </button>
              {canEditAllocation && (
                <button
                  type="button"
                  onClick={() => setDrawerActiveTab('edit')}
                  className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                    drawerActiveTab === 'edit'
                      ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Allocation</span>
                </button>
              )}
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerActiveTab === 'overview' && (
              <div className="space-y-6">
                {/* Allocation Capacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Allocation Capacity
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedResource.total_allocated_hours || 0}h / {selectedResource.max_weekly_hours || 40}h ({selectedResource.utilization_percentage || 0}% Committed)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[var(--bg-surface-subtle)] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (selectedResource.utilization_percentage || 0) >= 100
                          ? 'bg-rose-500'
                          : (selectedResource.utilization_percentage || 0) >= 80
                          ? 'bg-amber-500'
                          : 'bg-[var(--accent-primary)]'
                      }`}
                      style={{ width: `${Math.min(selectedResource.utilization_percentage || 0, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-mono pt-1">
                    <span>Committed: {selectedResource.total_allocated_hours || 0} hrs/week</span>
                    <span>Remaining: {Math.max(0, (selectedResource.max_weekly_hours || 40) - (selectedResource.total_allocated_hours || 0))} hrs/week</span>
                  </div>
                </div>

                {/* Assigned Projects */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Assigned Projects ({selectedResource.assigned_projects?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => setDrawerActiveTab('edit')}
                      className="text-[11px] text-[var(--accent-primary)] hover:underline font-semibold"
                    >
                      + Ubah Alokasi
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(!selectedResource.assigned_projects || selectedResource.assigned_projects.length === 0) ? (
                      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-center text-xs text-[var(--text-muted)]">
                        Belum ada proyek yang dialokasikan untuk team member ini.
                      </div>
                    ) : (
                      selectedResource.assigned_projects.map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[var(--text-primary)]">
                              {p.title}
                            </span>
                            <span className="font-mono font-semibold text-[var(--accent-primary)]">
                              {p.allocated_hours_per_week} hrs/week
                            </span>
                          </div>

                          <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
                            <span>Role: <strong className="text-[var(--text-primary)]">{p.role_in_project}</strong></span>
                            <span className="font-mono text-[var(--text-muted)]">{p.code}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ASSIGNED TASKS */}
            {drawerActiveTab === 'tasks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Assigned Tasks ({assignedTasks.length})
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)]">From Live Tasks Table</span>
                </div>

                {isLoadingTasks ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-primary)]" />
                    <span>Memuat task anggota tim...</span>
                  </div>
                ) : assignedTasks.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] text-center space-y-2">
                    <CheckSquare className="w-6 h-6 text-[var(--text-muted)] mx-auto opacity-50" />
                    <p className="text-xs text-[var(--text-muted)]">
                      Tidak ada task aktif yang di-assign ke {selectedResource.full_name}.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                    {assignedTasks.map((t) => {
                      const col = KANBAN_COLUMNS.find((c) => c.id === t.stage_key);
                      return (
                        <div
                          key={t.id}
                          className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] transition-all space-y-2 text-xs shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-[var(--text-primary)] leading-snug">
                              {t.title}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                              t.priority === 'CRITICAL' || t.priority === 'HIGH'
                                ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                            }`}>
                              {t.priority}
                            </span>
                          </div>

                          {t.project && (
                            <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                              <FolderKanban className="w-3 h-3 text-[var(--text-muted)]" />
                              <span className="truncate">{t.project.title}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[10px]">
                            <span className="inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-[var(--border-default)]">
                              <span className={`w-1.5 h-1.5 rounded-full ${col?.dotColor || 'bg-slate-400'}`}></span>
                              <span>{col?.label || t.stage_key}</span>
                            </span>

                            <div className="flex items-center gap-3 text-[var(--text-muted)] font-mono">
                              {t.estimated_hours ? (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{t.estimated_hours}h</span>
                                </div>
                              ) : null}
                              {t.due_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EDIT ALLOCATION */}
            {drawerActiveTab === 'edit' && (
              <div className="space-y-5">
                <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] space-y-1">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    Atur Kapasitas & Alokasi Mingguan
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Perubahan langsung disimpan ke tabel <code className="font-mono text-[var(--accent-primary)]">profiles</code> dan <code className="font-mono text-[var(--accent-primary)]">project_members</code> di database.
                  </p>
                </div>

                {/* Max Weekly Hours */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    Kapasitas Mingguan Maksimal (Jam/Minggu)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={80}
                    value={maxWeeklyHours}
                    onChange={(e) => setMaxWeeklyHours(parseInt(e.target.value) || 40)}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-mono"
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">Standar jam kerja penuh waktu adalah 40 jam/minggu.</span>
                </div>

                {/* Project-specific hours */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    Alokasi per Proyek
                  </label>

                  <div className="space-y-2.5">
                    {editProjectAllocations.length === 0 ? (
                      <div className="p-3 border border-dashed border-[var(--border-subtle)] rounded-lg text-center text-[11px] text-[var(--text-muted)]">
                        Belum ada proyek dalam alokasi. Tambahkan proyek di bawah.
                      </div>
                    ) : (
                      editProjectAllocations.map((p, idx) => (
                        <div
                          key={p.projectId}
                          className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="font-medium text-[var(--text-primary)] truncate flex-1">
                            {p.title}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input
                              type="number"
                              min={0}
                              max={60}
                              value={p.allocatedHours}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setEditProjectAllocations((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, allocatedHours: val } : item
                                  )
                                );
                              }}
                              className="w-16 px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-xs text-center font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                            <span className="text-[11px] text-[var(--text-muted)]">jam</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveProjectFromAllocation(p.projectId)}
                              className="p-1 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                              title="Hapus alokasi proyek"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add another project */}
                <div className="p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-2">
                  <span className="text-[11px] font-bold text-[var(--text-primary)]">
                    + Tambah Proyek ke Alokasi
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedNewProjectId}
                      onChange={(e) => setSelectedNewProjectId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="">Pilih Proyek...</option>
                      {allProjects
                        .filter((ap) => !editProjectAllocations.some((ep) => ep.projectId === ap.id))
                        .map((ap) => (
                          <option key={ap.id} value={ap.id}>
                            {ap.title}
                          </option>
                        ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={newProjectHours}
                      onChange={(e) => setNewProjectHours(parseInt(e.target.value) || 10)}
                      placeholder="Jam"
                      className="w-16 px-2 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-center font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <button
                      type="button"
                      onClick={handleAddProjectToAllocation}
                      disabled={!selectedNewProjectId}
                      className="px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-40 transition-colors"
                    >
                      Tambah
                    </button>
                  </div>
                </div>

                {/* Calculated summary */}
                {(() => {
                  const total = editProjectAllocations.reduce((sum, p) => sum + p.allocatedHours, 0);
                  const util = Math.round((total / (maxWeeklyHours || 40)) * 100);
                  const isOver = total > maxWeeklyHours;

                  return (
                    <div className={`p-3 rounded-xl border space-y-1.5 ${
                      isOver 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                        : 'bg-[var(--bg-surface)] border-[var(--border-default)] text-[var(--text-secondary)]'
                    }`}>
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>Total Jam Teralokasi:</span>
                        <span className="font-mono text-sm text-[var(--text-primary)]">{total}h / {maxWeeklyHours}h ({util}%)</span>
                      </div>
                      {isOver && (
                        <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Peringatan: Alokasi melebihi kapasitas kerja maksimal sebesar {total - maxWeeklyHours} jam!</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};
