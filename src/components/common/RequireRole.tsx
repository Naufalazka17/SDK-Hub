import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

interface RequireRoleProps {
  allowed: Role[];
  children: React.ReactNode;
}

export const RequireRole: React.FC<RequireRoleProps> = ({ allowed, children }) => {
  const { currentProfile, role, isLoading } = useAuth();
  const location = useLocation();
  const lastToastPathRef = useRef<string | null>(null);

  const isAllowed = role ? allowed.includes(role) : false;

  useEffect(() => {
    if (!isLoading && currentProfile && !isAllowed) {
      if (lastToastPathRef.current !== location.pathname) {
        toast.error(`Akses Ditolak: Role Anda (${role}) tidak memiliki izin untuk halaman ini.`);
        lastToastPathRef.current = location.pathname;
      }
    }
  }, [isLoading, isAllowed, location.pathname, role, currentProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--border-default)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  // If not logged in, redirect directly to /login
  if (!currentProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAllowed) {
    const fallbackPath = role === 'CLIENT' ? '/cockpit' : '/';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
