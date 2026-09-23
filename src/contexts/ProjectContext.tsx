import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectWithDetails } from '../types';
import { projectService } from '../services/projectService';

interface ProjectContextType {
  projects: ProjectWithDetails[];
  currentProject: ProjectWithDetails | null;
  setCurrentProjectId: (id: string) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);

      if (data.length > 0) {
        const savedProjId = localStorage.getItem('sdk_active_project_id');
        const matched = data.find((p) => p.id === savedProjId) || data[0];
        setCurrentProject(matched);
      }
    } catch (err) {
      console.error('Error fetching projects in context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const setCurrentProjectId = (id: string) => {
    const matched = projects.find((p) => p.id === id);
    if (matched) {
      setCurrentProject(matched);
      localStorage.setItem('sdk_active_project_id', matched.id);
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
