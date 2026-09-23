import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { CreateTaskModal } from '../common/CreateTaskModal';

export const AppLayout: React.FC = () => {
  const { currentProfile, isLoading } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sdk_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sdk_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-app)]">
        <div className="w-8 h-8 border-4 border-[var(--border-default)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col font-sans text-[var(--text-primary)]">
      {/* Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CreateTaskModal isOpen={isNewTaskOpen} onClose={() => setIsNewTaskOpen(false)} />

      {/* Main Layout Frame */}
      <div className="flex flex-1 min-h-screen">
        {/* Desktop Sidebar with Collapse Transition */}
        <div className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-60'
        }`}>
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </div>

        {/* Mobile Drawer Backdrop & Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] bg-[var(--bg-sidebar)] h-full z-10 animate-drawer-in shadow-2xl flex flex-col border-r border-[var(--border-default)]">
              <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-6 lg:pb-0">
          <Header
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={toggleSidebarCollapse}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenNewTask={() => setIsNewTaskOpen(true)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            <Outlet context={{ onOpenNewTask: () => setIsNewTaskOpen(true) }} />
          </main>
        </div>
      </div>
    </div>
  );
};
