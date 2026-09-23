import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
import { RequireRole } from './components/common/RequireRole';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsDirectoryPage } from './pages/ProjectsDirectoryPage';
import { ProjectCreationWizardPage } from './pages/ProjectCreationWizardPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { OrchestrationBoardPage } from './pages/OrchestrationBoardPage';
import { TimelineGanttPage } from './pages/TimelineGanttPage';
import { ClientCockpitPage } from './pages/ClientCockpitPage';
import { ReportsAnalyticsPage } from './pages/ReportsAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { RealtimeChatPage } from './pages/RealtimeChatPage';
import { FilesRepositoryPage } from './pages/FilesRepositoryPage';
import { LoginPage } from './pages/LoginPage';
import { ClientsPage } from './pages/ClientsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { TimeTrackingReportsPage } from './pages/TimeTrackingReportsPage';
import { GlobalTimelinePage } from './pages/GlobalTimelinePage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { InstallTutorialPage } from './pages/InstallTutorialPage';
import { pushNotificationService } from './services/pushNotificationService';

const RootRedirect: React.FC = () => {
  const { currentProfile, role, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--border-default)] border-t-[var(--accent-primary)] rounded-full animate-spin" />
      </div>
    );
  }
  if (!currentProfile) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'CLIENT') {
    return <Navigate to="/cockpit" replace />;
  }
  return <DashboardPage />;
};

export function App() {
  useEffect(() => {
    const initAudio = () => {
      pushNotificationService.initAudioContext();
      document.removeEventListener('click', initAudio);
    };
    document.addEventListener('click', initAudio);
    return () => document.removeEventListener('click', initAudio);
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Toaster 
            richColors 
            closeButton 
            position="top-right" 
            toastOptions={{
              classNames: {
                closeButton: '!left-auto !right-2 !top-2',
              },
            }}
          />
          <AuthProvider>
            <ProjectProvider>
              <NotificationProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route element={<AppLayout />}>
                  {/* Dashboard / Root */}
                  <Route
                    path="/"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <RootRedirect />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <RootRedirect />
                      </RequireRole>
                    }
                  />

                  {/* Projects Suite */}
                  <Route
                    path="/projects"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <ProjectsDirectoryPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/projects/new"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD']}>
                        <ProjectCreationWizardPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/projects/:id"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <ProjectDetailPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/projects/:id/board"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <OrchestrationBoardPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/projects/:id/timeline"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <TimelineGanttPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/projects/:id/cockpit"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'CLIENT']}>
                        <ClientCockpitPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/projects/:id/files"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <FilesRepositoryPage />
                      </RequireRole>
                    }
                  />

                  {/* Orchestration & Timeline Direct Routes */}
                  <Route
                    path="/kanban"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <OrchestrationBoardPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/timeline"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <TimelineGanttPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/cockpit"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'CLIENT']}>
                        <ClientCockpitPage />
                      </RequireRole>
                    }
                  />

                  {/* Resources & Management */}
                  <Route
                    path="/resources"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD']}>
                        <ResourcesPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <RequireRole allowed={['ADMIN']}>
                        <UsersPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD']}>
                        <ReportsAnalyticsPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/timeline/global"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <GlobalTimelinePage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/activity"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD']}>
                        <ActivityLogPage />
                      </RequireRole>
                    }
                  />

                  {/* Other: Notifications & Settings */}
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Operations: Chat & Files */}
                  <Route
                    path="/chat"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF', 'CLIENT']}>
                        <RealtimeChatPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/files"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <FilesRepositoryPage />
                      </RequireRole>
                    }
                  />

                  {/* Flow 2.3: Clients & Flow 2.5: Templates */}
                  <Route
                    path="/clients"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD']}>
                        <ClientsPage />
                      </RequireRole>
                    }
                  />
                  <Route
                    path="/templates"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD']}>
                        <TemplatesPage />
                      </RequireRole>
                    }
                  />

                  {/* Time Tracking & Timesheets */}
                  <Route
                    path="/time-tracking"
                    element={
                      <RequireRole allowed={['ADMIN', 'PROJECT_LEAD', 'STAFF']}>
                        <TimeTrackingReportsPage />
                      </RequireRole>
                    }
                  />

                  {/* PWA Download / Install Tutorial */}
                  <Route path="/download" element={<InstallTutorialPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NotificationProvider>
          </ProjectProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
