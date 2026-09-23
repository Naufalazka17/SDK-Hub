import React, { useState } from 'react';
import { 
  User, Sliders, Palette, Shield, 
  Camera, Trash2, Loader2, Volume2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { CircularAvatarCropperModal } from '../components/common/CircularAvatarCropperModal';
import { supabase } from '../lib/supabase';
import { soundService } from '../services/soundService';

export const SettingsPage: React.FC = () => {
  const { currentProfile, role, setCurrentProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isId = language === 'id';

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'appearance' | 'account'>('profile');
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Profile Form State
  const [fullName, setFullName] = useState(currentProfile?.full_name || 'David Chen');
  const [email, setEmail] = useState(currentProfile?.email || 'david.chen@subaga.id');
  const [department, setDepartment] = useState(currentProfile?.department || 'Engineering');
  const [position, setPosition] = useState(currentProfile?.position || 'Senior Project Lead');
  const [contactNumber, setContactNumber] = useState(currentProfile?.phone || '+62 812 3456 7890');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Preferences State
  const [timezone, setTimezone] = useState('(GMT+07:00) Jakarta');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [taskNotifs, setTaskNotifs] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(() => soundService.isSoundEnabled());

  // Update profile form when active profile changes
  React.useEffect(() => {
    if (currentProfile) {
      setFullName(currentProfile.full_name || '');
      setEmail(currentProfile.email || '');
      setDepartment(currentProfile.department || 'Engineering');
      setPosition(currentProfile.position || 'Team Member');
      setContactNumber(currentProfile.phone || '+62 812 3456 7890');
    }
  }, [currentProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProfile) return;

    try {
      setIsSavingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: contactNumber.trim(),
          department: department.trim(),
          position: position.trim(),
        })
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentProfile(data);
      toast.success('Profil berhasil diperbarui di database!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Gagal memperbarui profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', currentProfile.id);

      if (error) throw error;

      setCurrentProfile({ ...currentProfile, avatar_url: null });
      toast.success('Foto profil dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus foto profil');
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Cropper Modal */}
      <CircularAvatarCropperModal
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          {isId ? 'Pengaturan' : 'Settings'}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {isId ? 'Kelola profil pengguna, foto profil avatar, preferensi sistem, dan konfigurasi akun.' : 'Manage user profile, avatar photo, system preferences, and account configuration.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Sub-nav */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-2 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
              activeTab === 'profile'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isId ? 'Profil' : 'Profile'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
              activeTab === 'account'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{isId ? 'Akun & Avatar' : 'Account & Avatar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
              activeTab === 'appearance'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{isId ? 'Tampilan' : 'Appearance'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
              activeTab === 'preferences'
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isId ? 'Preferensi' : 'Preferences'}</span>
          </button>
        </div>

        {/* Right Stacked Form Cards */}
        <div className="md:col-span-3 space-y-6">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Profil Pribadi' : 'Personal Profile'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Informasi identitas akun dan jabatan Anda di organisasi.' : 'Account identity information and your position in the organization.'}
                </p>
              </div>

              {/* Profile Avatar Quick View */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border-2 border-[var(--accent-primary)] flex items-center justify-center font-bold text-base text-white shrink-0 shadow-md">
                    {currentProfile?.avatar_url ? (
                      <img
                        src={currentProfile.avatar_url}
                        alt={fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      fullName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {fullName}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {email} <span className="mx-1">•</span> {position}
                    </div>
                    <div className="mt-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]">
                        {role}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isId ? 'Ganti Foto' : 'Change Photo'}</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    {isId ? 'Nama Lengkap' : 'Full Name'} <span className="text-[var(--accent-primary)]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Email Perusahaan' : 'Corporate Email'}
                    </label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full px-3.5 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-muted)] cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Nomor Telepon' : 'Contact Phone'}
                    </label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Departemen' : 'Department'}
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Peran / Jabatan' : 'Role / Position Title'}
                    </label>
                    <input
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isId ? 'Menyimpan...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <span>{isId ? 'Simpan Perubahan' : 'Save Changes'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Account & Avatar */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Profile Picture Upload & Circular Crop Card */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    {isId ? 'Foto Profil' : 'Profile Picture'}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {isId ? 'Upload foto profil Anda. Anda dapat melakukan crop berbentuk bulat dan zoom dengan presisi.' : 'Upload your profile picture. You can crop it into a circle and zoom with precision.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                  {/* Large Circular Avatar Display */}
                  <div className="relative group cursor-pointer" onClick={() => setIsCropModalOpen(true)}>
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-[var(--accent-primary)] flex items-center justify-center font-bold text-xl text-white shadow-lg transition-transform group-hover:scale-105">
                      {currentProfile?.avatar_url ? (
                        <img
                          src={currentProfile.avatar_url}
                          alt={currentProfile.full_name || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        currentProfile?.full_name?.substring(0, 2).toUpperCase() || 'UB'
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                      <Camera className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Actions & Instructions */}
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {isId ? 'Foto Profil Saat Ini' : 'Current Profile Photo'}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] max-w-sm">
                      {isId ? 'Foto akan tampil di Header, Dashboard, Direktori Pengguna, dan Riwayat Aktivitas tim.' : 'Photo will appear in Header, Dashboard, Users Directory, and Team Activity Log.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCropModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{isId ? 'Ganti Foto' : 'Change Photo'}</span>
                      </button>

                      {currentProfile?.avatar_url && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isId ? 'Hapus Foto' : 'Remove Photo'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password & Security */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Keamanan & Kredensial' : 'Security & Credentials'}
                </h2>
                <div className="p-4 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Password Akun' : 'Account Password'}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {isId ? `Kirim tautan reset password ke email terdaftar (${currentProfile?.email}).` : `Send password reset link to registered email (${currentProfile?.email}).`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success(isId ? `Tautan reset password terkirim ke ${currentProfile?.email}` : `Password reset link sent to ${currentProfile?.email}`)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
                  >
                    {isId ? 'Kirim Reset Password' : 'Send Reset Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Appearance */}
          {activeTab === 'appearance' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Tampilan' : 'Appearance'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Sesuaikan tampilan tema warna SDK Hub sesuai kenyamanan Anda.' : 'Customize SDK Hub color theme for your comfort.'}
                </p>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  {isId ? 'Pilihan Tema Tampilan' : 'Theme Selection'}
                </span>

                {/* 3 Theme Options Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Dark Theme Card */}
                  <div
                    onClick={() => setTheme('dark')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-subtle)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-light)]'
                    }`}
                  >
                    <div className="h-16 rounded-lg bg-[#0B0F19] border border-slate-800 p-2 space-y-1.5 flex flex-col justify-center">
                      <div className="w-10 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      <div className="w-16 h-1.5 rounded-full bg-slate-700" />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs font-semibold text-[var(--text-primary)]">
                      {theme === 'dark' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      )}
                      <span>{isId ? 'Gelap' : 'Dark'}</span>
                    </div>
                  </div>

                  {/* Light Theme Card */}
                  <div
                    onClick={() => setTheme('light')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      theme === 'light'
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-subtle)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-light)]'
                    }`}
                  >
                    <div className="h-16 rounded-lg bg-white border border-slate-200 p-2 space-y-1.5 flex flex-col justify-center">
                      <div className="w-10 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      <div className="w-16 h-1.5 rounded-full bg-slate-300" />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs font-semibold text-[var(--text-primary)]">
                      {theme === 'light' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      )}
                      <span>{isId ? 'Terang' : 'Light'}</span>
                    </div>
                  </div>

                  {/* System Theme Card */}
                  <div
                    onClick={() => setTheme('system')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      theme === 'system'
                        ? 'border-[var(--accent-primary)] bg-[var(--bg-surface-subtle)]'
                        : 'border-[var(--border-default)] hover:border-[var(--border-light)]'
                    }`}
                  >
                    <div className="h-16 rounded-lg overflow-hidden border border-slate-700 flex">
                      <div className="w-1/2 bg-[#0B0F19] p-2 flex flex-col justify-center">
                        <div className="w-6 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      </div>
                      <div className="w-1/2 bg-white p-2 flex flex-col justify-center">
                        <div className="w-6 h-1.5 rounded-full bg-slate-300" />
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-2.5 text-xs font-semibold text-[var(--text-primary)]">
                      {theme === 'system' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
                      )}
                      <span>{isId ? 'Sistem' : 'System'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Preferences */}
          {activeTab === 'preferences' && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Preferensi' : 'Preferences'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isId ? 'Pengaturan bahasa, zona waktu, dan notifikasi email.' : 'Preferences for language, timezone, and email alerts.'}
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Bahasa Tampilan' : 'Display Language'}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => {
                        const newLang = e.target.value as 'id' | 'en';
                        setLanguage(newLang);
                        toast.success(newLang === 'id' ? 'Bahasa berhasil diubah ke Bahasa Indonesia!' : 'Language successfully changed to English (US)!');
                      }}
                      className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)] cursor-pointer"
                    >
                      <option value="id">🇮🇩 Bahasa Indonesia (ID)</option>
                      <option value="en">🇬🇧 English (US)</option>
                    </select>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isId ? 'Pilih bahasa antarmuka aplikasi.' : 'Choose application interface language.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      {isId ? 'Zona Waktu' : 'Timezone'}
                    </label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    >
                      <option value="(GMT+07:00) Jakarta">(GMT+07:00) Asia/Jakarta (WIB)</option>
                      <option value="(GMT+08:00) Makassar">(GMT+08:00) Asia/Makassar (WITA)</option>
                      <option value="(GMT+09:00) Jayapura">(GMT+09:00) Asia/Jayapura (WIT)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {isId ? 'Notifikasi Email' : 'Email Notifications'}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {isId ? 'Kirim ringkasan harian saat ada task baru' : 'Send daily digest when there are new tasks'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifs}
                      onChange={(e) => setEmailNotifs(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)]">
                        {isId ? 'Peringatan Penugasan Tugas' : 'Task Assignment Alerts'}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {isId ? 'Pemberitahuan otomatis saat Anda ditugaskan ke sprint' : 'Automatic notification when you are assigned to a sprint'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={taskNotifs}
                      onChange={(e) => setTaskNotifs(e.target.checked)}
                      className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                    />
                  </div>

                  {/* Recommendation 1: Chat Sound Alert & Test Button */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
                    <div>
                      <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>{isId ? 'Suara Notifikasi Chat (Chime Audio)' : 'Chat Sound Alerts (Chime Audio)'}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {isId ? 'Bunyikan nada lonceng halus saat pesan chat baru masuk secara real-time' : 'Play subtle chime ping when new realtime chat messages arrive'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          soundService.playMessageNotificationSound();
                          toast.success(isId ? 'Nada lonceng notifikasi diuji!' : 'Chime notification sound tested!');
                        }}
                        className="px-2.5 py-1 rounded text-[10px] font-semibold border border-[var(--border-default)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] transition-colors cursor-pointer"
                      >
                        {isId ? 'Tes Suara' : 'Test Sound'}
                      </button>
                      <input
                        type="checkbox"
                        checked={soundAlerts}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setSoundAlerts(val);
                          soundService.setSoundEnabled(val);
                          if (val) {
                            soundService.playMessageNotificationSound();
                            toast.success(isId ? 'Suara notifikasi diaktifkan' : 'Sound notifications enabled');
                          } else {
                            toast.info(isId ? 'Suara notifikasi dimatikan' : 'Sound notifications disabled');
                          }
                        }}
                        className="w-4 h-4 accent-[var(--accent-primary)] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
