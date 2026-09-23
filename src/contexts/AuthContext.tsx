import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Profile, Role } from '../types';

interface AuthContextType {
  currentProfile: Profile | null;
  role: Role;
  isLoading: boolean;
  isAdmin: boolean;
  isProjectLead: boolean;
  isStaff: boolean;
  isClient: boolean;
  isDemoMode: boolean;
  switchProfileByRole: (role: Role) => Promise<void>;
  devSwitchProfile: (role: Role) => Promise<void>;
  loginWithEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  updateCurrentProfileAvatar: (avatarUrl: string) => void;
  setCurrentProfile: (profile: Profile) => void;
  refreshProfiles: () => Promise<void>;
  availableProfiles: Profile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role_id', { ascending: true });

      if (!error && data && data.length > 0) {
        setAvailableProfiles(data);

        // Only restore authenticated profile if an active session exists in current browser session
        const hasActiveSession = sessionStorage.getItem('sdk_session_authenticated') === 'true';
        const savedProfileId = hasActiveSession ? localStorage.getItem('sdk_active_profile_id') : null;
        const matched = savedProfileId ? data.find((p) => p.id === savedProfileId) : null;

        if (matched) {
          setCurrentProfile(matched);
        } else {
          // No active authenticated session — user must log in first
          setCurrentProfile(null);
          sessionStorage.removeItem('sdk_session_authenticated');
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const devSwitchProfile = async (targetRole: Role) => {
    const target = availableProfiles.find((p) => p.role_id === targetRole);
    if (target) {
      setIsDemoMode(true);
      setCurrentProfile(target);
      sessionStorage.setItem('sdk_session_authenticated', 'true');
      localStorage.setItem('sdk_active_profile_id', target.id);
      toast.info(`Aktif sebagai ${targetRole} (${target.full_name})`);
    }
  };

  const switchProfileByRole = async (targetRole: Role) => {
    await devSwitchProfile(targetRole);
  };

  const loginWithEmail = async (email: string): Promise<boolean> => {
    const trimmed = email.trim().toLowerCase();
    const matched = availableProfiles.find((p) => p.email.toLowerCase() === trimmed);
    if (matched) {
      setIsDemoMode(false);
      setCurrentProfile(matched);
      sessionStorage.setItem('sdk_session_authenticated', 'true');
      localStorage.setItem('sdk_active_profile_id', matched.id);
      toast.success(`Selamat datang kembali, ${matched.full_name}!`);
      return true;
    }
    toast.error(`Profil dengan email "${email}" tidak ditemukan.`);
    return false;
  };

  const logout = () => {
    setCurrentProfile(null);
    sessionStorage.removeItem('sdk_session_authenticated');
    localStorage.removeItem('sdk_active_profile_id');
    toast.info('Anda telah keluar dari sistem.');
  };

  const updateCurrentProfileAvatar = (avatarUrl: string) => {
    if (!currentProfile) return;
    const updated = { ...currentProfile, avatar_url: avatarUrl };
    setCurrentProfile(updated);
    setAvailableProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? updated : p))
    );
  };

  const role: Role = (currentProfile?.role_id as Role) || 'PROJECT_LEAD';
  const isAdmin = role === 'ADMIN';
  const isProjectLead = role === 'PROJECT_LEAD' || role === 'ADMIN';
  const isStaff = role === 'STAFF';
  const isClient = role === 'CLIENT';

  return (
    <AuthContext.Provider
      value={{
        currentProfile,
        role,
        isLoading,
        isAdmin,
        isProjectLead,
        isStaff,
        isClient,
        isDemoMode,
        switchProfileByRole,
        devSwitchProfile,
        loginWithEmail,
        logout,
        updateCurrentProfileAvatar,
        setCurrentProfile,
        refreshProfiles: fetchProfiles,
        availableProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
