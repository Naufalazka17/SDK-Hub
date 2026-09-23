import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ProjectWithDetails } from '../types';
import { projectService } from '../services/projectService';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: ProjectWithDetails[];
  currentProject: ProjectWithDetails | null;
  setCurrentProjectId: (id: string) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProfile, role, isClient, isLoading: isAuthLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProjects = useCallback(async () => {
    if (isAuthLoading) return;

    try {
      setIsLoading(true);
      const data = await projectService.getProjects();

      // Enforce strict multi-tenant / client project isolation
      let scopedProjects = data;
      const isClientUser = role === 'CLIENT' || currentProfile?.role_id === 'CLIENT' || isClient;
      if (isClientUser) {
        const clientOrgId = currentProfile?.client_id;
        const profileEmail = currentProfile?.email?.trim().toLowerCase();

        scopedProjects = data.filter((p) => {
          if (clientOrgId && p.client_id === clientOrgId) return true;
          if (p.client) {
            if (clientOrgId && (p.client as any).id === clientOrgId) return true;
            if (profileEmail && (p.client as any).pic_email?.trim().toLowerCase() === profileEmail) return true;
          }
          return false;
        });
      }

      setProjects(scopedProjects);

      if (scopedProjects.length > 0) {
        const savedProjId = localStorage.getItem('sdk_active_project_id');
        const matched = scopedProjects.find((p) => p.id === savedProjId) || scopedProjects[0];
        setCurrentProject(matched);
        localStorage.setItem('sdk_active_project_id', matched.id);
      } else {
        setCurrentProject(null);
        localStorage.removeItem('sdk_active_project_id');
      }
    } catch (err) {
      console.error('Error fetching projects in context:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, currentProfile?.id, currentProfile?.client_id, currentProfile?.email, role, isClient]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const setCurrentProjectId = (id: string) => {
    // RBAC Security Validation:
    // Only allow setting a project ID if it exists within the authorized scoped projects list
    const matched = projects.find((p) => p.id === id);
    if (matched) {
      setCurrentProject(matched);
      localStorage.setItem('sdk_active_project_id', matched.id);
    } else {
      console.warn(`[Security Alert] Unauthorized project switch attempt to id "${id}" by role "${role}"`);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        setCurrentProjectId,
        isLoading,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
