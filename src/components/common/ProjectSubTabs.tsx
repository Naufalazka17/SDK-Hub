import React from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { 
  Info, Columns3, GanttChart, 
  FolderArchive, Building2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { can } from '../../lib/permissions';

interface ProjectSubTabsProps {
  activeTab?: 'overview' | 'board' | 'timeline' | 'files' | 'cockpit';
}

const isValidUuid = (val?: string) => 
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export const ProjectSubTabs: React.FC<ProjectSubTabsProps> = ({ activeTab }) => {
  const { id } = useParams<{ id?: string }>();
  const { role, isClient } = useAuth();
  const { currentProject, projects } = useProject();
  const { language } = useLanguage();

  const isId = language === 'id';

  // Determine valid target project ID without falling back to invalid slug strings
  const effectiveProjectId = (id && isValidUuid(id))
    ? id
    : (currentProject?.id && isValidUuid(currentProject.id))
      ? currentProject.id
      : (projects.length > 0 && isValidUuid(projects[0]?.id))
        ? projects[0].id
        : undefined;

  const allTabs = [
    {
      key: 'overview',
      label: isId ? 'Ringkasan Proyek' : 'Overview',
      icon: Info,
      to: effectiveProjectId ? `/projects/${effectiveProjectId}` : '/dashboard',
      exact: true,
      visible: true,
    },
    {
      key: 'board',
      label: isId ? 'Papan Orkestrasi' : 'Orchestration Board',
      icon: Columns3,
      to: effectiveProjectId ? `/projects/${effectiveProjectId}/board` : '/kanban',
      visible: can(role, 'board:view') && !isClient,
    },
    {
      key: 'timeline',
      label: isId ? 'Sumber Daya & Jadwal' : 'Resources & Timeline',
      icon: GanttChart,
      to: effectiveProjectId ? `/projects/${effectiveProjectId}/timeline` : '/timeline',
      visible: can(role, 'timeline:view') && !isClient,
    },
    {
      key: 'files',
      label: isId ? 'Berkas & Dokumen' : 'Files & Documents',
      icon: FolderArchive,
      to: effectiveProjectId ? `/projects/${effectiveProjectId}/files` : '/files',
      visible: true,
    },
    {
      key: 'cockpit',
      label: isId ? 'Kokpit Klien' : 'Client Cockpit',
      icon: Building2,
      to: effectiveProjectId ? `/projects/${effectiveProjectId}/cockpit` : '/cockpit',
      visible: can(role, 'cockpit:view'),
    },
  ];

  const visibleTabs = allTabs.filter((t) => t.visible);

  return (
    <div className="relative border-b border-[var(--border-default)]">
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0 pt-1">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isTabActive = activeTab !== undefined ? activeTab === tab.key : undefined;

          return (
            <NavLink
              key={tab.key}
              to={tab.to}
              end={tab.key === 'overview'}
              className={({ isActive: routerActive }) => {
                const active = isTabActive !== undefined ? isTabActive : routerActive;
                return `flex items-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-[var(--accent-primary)] text-[var(--text-primary)] font-bold'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-light)]'
                }`;
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {(isTabActive !== undefined ? isTabActive : false) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0"></span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};
