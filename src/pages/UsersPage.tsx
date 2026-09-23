import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, User, Trash2, Shield,
  Mail, Phone, Building, Loader2, X, Check, UploadCloud,
  Eye, EyeOff, Key, RefreshCw, Clock, Save
} from 'lucide-react';
import { Drawer } from '../components/common/Drawer';
import { userService, UserWithDetails } from '../services/userService';
import { credentialService } from '../services/credentialService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Role } from '../types';
import { toast } from 'sonner';

export const UsersPage: React.FC = () => {
  const { role, currentProfile, setCurrentProfile } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('password123');
  const [newShowPassword, setNewShowPassword] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<Role>('STAFF');
  const [newDepartment, setNewDepartment] = useState('Engineering');
  const [newPosition, setNewPosition] = useState('Engineer');
  const [newAvatarPreview, setNewAvatarPreview] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit User Drawer State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editShowPassword, setEditShowPassword] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('STAFF');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [editMaxWeeklyHours, setEditMaxWeeklyHours] = useState(40);
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Load users from Supabase
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetUserForm = () => {
    setNewFullName('');
    setNewEmail('');
    setNewPassword('password123');
    setNewShowPassword(false);
    setNewPhone('');
    setNewRole('STAFF');
    setNewDepartment('Engineering');
    setNewPosition('Engineer');
    setNewAvatarPreview('');
  };

  const handleCloseAddUser = () => {
    setIsAddUserOpen(false);
    resetUserForm();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      toast.error('Nama dan email wajib diisi');
      return;
    }

    const assignedPass = newPassword.trim() || 'password123';

    try {
      setIsSubmittingUser(true);
      const created = await userService.createUser(
        {
          full_name: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim() || undefined,
          role_id: newRole,
          department: newDepartment.trim() || (newRole === 'CLIENT' ? 'Klien Eksternal' : 'Engineering'),
          position: newPosition.trim() || (newRole === 'CLIENT' ? 'PIC Klien' : 'Team Member'),
          avatar_url: newAvatarPreview || undefined,
        },
        role
      );

      // Persist password so newly created user or client can immediately login!
      credentialService.setUserPassword(created.id, created.email, assignedPass);

      toast.success(
        `Akun ${newFullName} (${newRole}) berhasil dibuat dengan password "${assignedPass}"! Pengguna dapat langsung masuk di /login.`
      );
      handleCloseAddUser();
      await loadUsers();
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'Gagal menambahkan user');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleOpenEditUser = (u: UserWithDetails) => {
    setSelectedUser(u);
    setEditFullName(u.full_name || '');
    setEditEmail(u.email || '');
    const currentPass = credentialService.getUserPassword(u.id) || credentialService.getUserPassword(u.email) || 'password123';
    setEditPassword(currentPass);
    setEditShowPassword(false);
    setEditPhone(u.phone || '');
    setEditRole((u.role_id as Role) || 'STAFF');
    setEditDepartment(u.department || '');
    setEditPosition(u.position || '');
    setEditAvatarPreview(u.avatar_url || '');
    setEditMaxWeeklyHours(u.max_weekly_hours || 40);
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!editFullName.trim() || !editEmail.trim()) {
      toast.error('Nama dan email tidak boleh kosong.');
      return;
    }

    try {
      setIsSavingUser(true);
      const updated = await userService.updateUser(
        selectedUser.id,
        {
          full_name: editFullName.trim(),
          email: editEmail.trim().toLowerCase(),
          role_id: editRole,
          department: editDepartment.trim(),
          position: editPosition.trim(),
          phone: editPhone.trim() || null,
          avatar_url: editAvatarPreview || selectedUser.avatar_url,
          max_weekly_hours: Number(editMaxWeeklyHours) || 40,
        },
        role
      );

      // Save password if set/changed
      if (editPassword.trim()) {
        credentialService.setUserPassword(selectedUser.id, editEmail.trim(), editPassword.trim());
      }

      // If updating currently logged in profile, sync with AuthContext
      if (currentProfile?.id === selectedUser.id) {
        setCurrentProfile({
          ...currentProfile,
          full_name: editFullName.trim(),
          email: editEmail.trim().toLowerCase(),
          role_id: editRole,
          department: editDepartment.trim(),
          position: editPosition.trim(),
          phone: editPhone.trim(),
          avatar_url: editAvatarPreview || selectedUser.avatar_url,
        });
      }

      toast.success(`Data akun ${editFullName} berhasil diperbarui secara menyeluruh!`);
      setSelectedUser({
        ...selectedUser,
        ...updated,
        assigned_projects: selectedUser.assigned_projects,
      });
      await loadUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(err.message || 'Gagal memperbarui data user');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini dari sistem?')) return;
    try {
      await userService.deleteUser(userId, role);
      toast.success('User berhasil dihapus');
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.position?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role_id === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div
            className="w-full max-w-lg bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-default)] shadow-2xl p-6 space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {isId ? 'Tambah Pengguna Baru' : 'Add New User Account'}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {isId 
                    ? 'Buat akun staf, lead, atau klien baru lengkap dengan kata sandi login' 
                    : 'Provision staff, lead, or client accounts with login credentials'}
                </p>
              </div>
              <button 
                type="button"
                onClick={handleCloseAddUser} 
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-surface-subtle)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {/* Photo Upload */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 border-2 border-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  {newAvatarPreview ? (
                    <img src={newAvatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-white opacity-50" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {isId ? 'Foto Profil Pengguna' : 'User Profile Photo'}
                  </div>
                  <label className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-input)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[11px] font-semibold text-[var(--text-primary)] cursor-pointer transition-colors shadow-xs">
                    <UploadCloud className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Pilih Foto' : 'Choose Photo'}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                  {isId ? 'Nama Lengkap' : 'Full Name'} <span className="text-[var(--accent-primary)]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Ahmad Fauzi / dr. Budi Santoso"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                    {isId ? 'Email Perusahaan / Akun' : 'Account Email'} <span className="text-[var(--accent-primary)]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="ahmad@subaga.id"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                    {isId ? 'Nomor Telepon' : 'Contact Phone'}
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Password Field with Toggle & Generator */}
              <div className="space-y-1 p-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)] uppercase">
                    <Key className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Kata Sandi Awal (Password)' : 'Initial Password'}</span>
                    <span className="text-[var(--accent-primary)]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(credentialService.generateRandomPassword())}
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-primary)] hover:underline font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isId ? 'Acak Sandi' : 'Generate'}</span>
                  </button>
                </div>
                <div className="relative mt-1">
                  <input
                    type={newShowPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. password123 atau rahasia2026"
                    className="w-full px-3 py-2 pr-9 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewShowPassword(!newShowPassword)}
                    className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                    aria-label="Toggle password"
                  >
                    {newShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {isId 
                    ? 'Pengguna/klien dapat langsung masuk menggunakan email dan kata sandi ini di laman /login.' 
                    : 'The user/client can immediately log in with this email and password at /login.'}
                </p>
              </div>

              {/* Role & Division */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                    {isId ? 'Peran Sistem' : 'System Role'}
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as Role;
                      setNewRole(r);
                      if (r === 'CLIENT') {
                        setNewDepartment('Organisasi Klien');
                        setNewPosition('Direktur / PIC');
                      } else if (r === 'ADMIN') {
                        setNewDepartment('Executive Management');
                        setNewPosition('Administrator');
                      } else if (r === 'PROJECT_LEAD') {
                        setNewDepartment('Project Delivery');
                        setNewPosition('Senior Project Lead');
                      } else {
                        setNewDepartment('Engineering');
                        setNewPosition('Engineer');
                      }
                    }}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--accent-primary)]"
                  >
                    <option value="STAFF">STAFF (Staf Engineer / QA / Desain)</option>
                    <option value="PROJECT_LEAD">PROJECT_LEAD (Lead Proyek)</option>
                    <option value="ADMIN">ADMIN (Administrator Sistem)</option>
                    <option value="CLIENT">CLIENT (Klien Eksternal / PIC)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                    {newRole === 'CLIENT' 
                      ? (isId ? 'Organisasi / RSUD / PT' : 'Client Organization') 
                      : (isId ? 'Divisi / Departemen' : 'Division / Department')}
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    placeholder="e.g. RSUD Sehat, Engineering, Design"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase">
                  {newRole === 'CLIENT' 
                    ? (isId ? 'Jabatan PIC Klien' : 'Client Title / Position') 
                    : (isId ? 'Keahlian / Jabatan' : 'Skill / Position Title')}
                </label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="e.g. Direktur RSUD / Lead Frontend Dev"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[var(--border-default)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseAddUser}
                  disabled={isSubmittingUser}
                  className="px-4 py-2 border border-[var(--border-default)] text-xs rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
                >
                  {isId ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="flex items-center gap-1.5 px-5 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmittingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isId ? 'Menyimpan...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{isId ? 'Simpan Pengguna & Kredensial' : 'Save User & Credentials'}</span>
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {isId ? 'Direktori Pengguna' : 'Users Directory'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId ? 'Kelola data anggota tim, peran hak akses sistem, dan penugasan proyek.' : 'Manage team member records, system access roles, and project assignments.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddUserOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isId ? 'Tambah Pengguna' : 'Add User'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isId ? 'Cari user berdasarkan nama, email, posisi...' : 'Search users by name, email, position...'}
            className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full md:w-auto px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
        >
          <option value="All">{isId ? 'Semua Peran' : 'All Roles'}</option>
          <option value="ADMIN">ADMIN</option>
          <option value="PROJECT_LEAD">PROJECT_LEAD</option>
          <option value="STAFF">STAFF</option>
          <option value="CLIENT">CLIENT</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">{isId ? 'Pengguna' : 'User'}</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">{isId ? 'Peran' : 'Role'}</th>
                <th className="py-3 px-4">{isId ? 'Departemen' : 'Department'}</th>
                <th className="py-3 px-4">{isId ? 'Proyek Aktif' : 'Active Projects'}</th>
                <th className="py-3 px-4 text-right">{isId ? 'Tindakan' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Memuat data pengguna...' : 'Loading users...'}</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--text-muted)]">
                    {isId ? 'Tidak ada pengguna ditemukan' : 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenEditUser(u)}
                    className="hover:bg-[var(--bg-surface-subtle)] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 border border-[var(--border-default)] flex items-center justify-center font-bold text-xs text-white shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                          ) : (
                            u.full_name?.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {u.full_name}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {u.position || (isId ? 'Anggota Tim' : 'Team Member')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                      {u.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-mono">
                        <Shield className="w-3 h-3" />
                        {u.role_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      {u.department || (isId ? 'Umum' : 'General')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                        {u.assigned_projects_count || 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditUser(u)}
                        className="text-xs font-semibold text-[var(--accent-primary)] hover:underline"
                      >
                        {isId ? 'Detail & Edit' : 'Detail & Edit'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive User Details & Account Edit Drawer */}
      <Drawer
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={isId ? 'Detail & Ubah Akun Pengguna' : 'User Details & Account Management'}
        subtitle={selectedUser?.full_name || 'User Profile'}
      >
        {selectedUser && (
          <form onSubmit={handleSaveEditedUser} className="p-6 space-y-5">
            {/* Header Avatar Edit */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-[var(--accent-primary)] flex items-center justify-center font-bold text-base text-white shrink-0">
                {editAvatarPreview ? (
                  <img src={editAvatarPreview} alt={editFullName} className="w-full h-full object-cover" />
                ) : (
                  editFullName?.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {isId ? 'Foto Profil & Avatar' : 'Profile Picture'}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[10px] font-semibold text-[var(--text-primary)] cursor-pointer transition-colors">
                    <UploadCloud className="w-3 h-3 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Ubah Foto' : 'Change Photo'}</span>
                    <input type="file" accept="image/*" onChange={handleEditPhotoUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditAvatarPreview(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(editFullName)}&backgroundColor=0284c7`)}
                    className="px-2 py-1 rounded bg-[var(--bg-input)] border border-[var(--border-default)] text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Editable Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                {isId ? 'Nama Lengkap Akun' : 'Full Name'} <span className="text-[var(--accent-primary)]">*</span>
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Editable Email */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                {isId ? 'Email Perusahaan / Login' : 'Account Email'} <span className="text-[var(--accent-primary)]">*</span>
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Editable Password / Reset Password */}
            <div className="space-y-1 p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  <Key className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  <span>{isId ? 'Ubah / Atur Kata Sandi (Password)' : 'Change / Reset Password'}</span>
                </label>
                <button
                  type="button"
                  onClick={() => setEditPassword(credentialService.generateRandomPassword())}
                  className="inline-flex items-center gap-1 text-[11px] text-[var(--accent-primary)] hover:underline font-semibold"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isId ? 'Acak Sandi Baru' : 'Generate'}</span>
                </button>
              </div>
              <div className="relative mt-1">
                <input
                  type={editShowPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru untuk akun ini"
                  className="w-full px-3 py-2 pr-9 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setEditShowPassword(!editShowPassword)}
                  className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                  aria-label="Toggle password"
                >
                  {editShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">
                {isId 
                  ? 'Administrator dapat langsung mengubah atau mereset password akun pengguna/klien ini.' 
                  : 'Admins can directly update or reset the password for this user/client.'}
              </p>
            </div>

            {/* Editable Role */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                {isId ? 'Peran Sistem (Role)' : 'System Role'}
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as Role)}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] font-semibold focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="STAFF">STAFF (Staf Engineer / QA / Desain)</option>
                <option value="PROJECT_LEAD">PROJECT_LEAD (Lead Proyek)</option>
                <option value="ADMIN">ADMIN (Administrator Sistem)</option>
                <option value="CLIENT">CLIENT (Klien Eksternal / PIC)</option>
              </select>
            </div>

            {/* Division & Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  {editRole === 'CLIENT' 
                    ? (isId ? 'Organisasi Klien' : 'Organization') 
                    : (isId ? 'Divisi / Departemen' : 'Department')}
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  {editRole === 'CLIENT' 
                    ? (isId ? 'Jabatan Klien' : 'Client Position') 
                    : (isId ? 'Keahlian / Posisi' : 'Position')}
                </label>
                <input
                  type="text"
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* Phone & Capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  {isId ? 'Nomor Telepon' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-[var(--text-primary)] uppercase">
                  {isId ? 'Beban Jam Mingguan' : 'Weekly Capacity (Hrs)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={editMaxWeeklyHours}
                  onChange={(e) => setEditMaxWeeklyHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {/* Assigned Projects Readout */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-default)]">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {isId ? 'Proyek Ditugaskan' : 'Assigned Projects'} ({selectedUser.assigned_projects_count || 0})
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {!selectedUser.assigned_projects || selectedUser.assigned_projects.length === 0 ? (
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs text-[var(--text-muted)] text-center">
                    {isId ? 'Belum ada proyek yang ditugaskan' : 'No projects assigned'}
                  </div>
                ) : (
                  selectedUser.assigned_projects.map((proj) => (
                    <div
                      key={proj.id}
                      className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">{proj.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-mono">{proj.code}</div>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]">
                        {proj.role_in_project}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Save & Delete Action Buttons */}
            <div className="pt-4 border-t border-[var(--border-default)] space-y-2">
              <button
                type="submit"
                disabled={isSavingUser}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSavingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isId ? 'Menyimpan Perubahan...' : 'Saving Changes...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isId ? 'Simpan Seluruh Perubahan Akun' : 'Save Account Changes'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleDeleteUser(selectedUser.id)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isId ? 'Hapus Pengguna Ini' : 'Delete This User'}</span>
              </button>
            </div>
          </form>
        )}
      </Drawer>
    </div>
  );
};
