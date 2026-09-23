import { Database } from './database.types';

export type Role = 'ADMIN' | 'PROJECT_LEAD' | 'STAFF' | 'CLIENT';

export type DeliveryModel = 'Consulting' | 'Custom' | 'Subscription';

export type TemplateType =
  | 'Healthcare System'
  | 'Social Analysis'
  | 'Digital Public Service'
  | 'Custom Application'
  | 'API Integration'
  | 'Blank Workflow';

export const SDK_PROJECT_STAGES = [
  { key: 'PITCHING', label: 'PITCHING', step: 1 },
  { key: 'DEMO_PRESENTATION', label: 'DEMO / PRESENTATION', step: 2 },
  { key: 'ADMINISTRATION', label: 'ADMINISTRATION', step: 3 },
  { key: 'PKS_CONTRACT_PROPOSAL', label: 'PKS / CONTRACT / PROPOSAL', step: 4 },
  { key: 'TIMELINE', label: 'TIMELINE', step: 5 },
  { key: 'ANALYSIS', label: 'ANALYSIS', step: 6 },
  { key: 'DEVELOPMENT', label: 'DEVELOPMENT', step: 7 },
  { key: 'STAGING', label: 'STAGING', step: 8 },
  { key: 'QA_SIT', label: 'QA / SIT', step: 9 },
  { key: 'BUSINESS_API_STRESS_TESTING', label: 'BUSINESS / API / STRESS / BUG TESTING', step: 10 },
  { key: 'UAT', label: 'UAT', step: 11 },
  { key: 'PILOT', label: 'PILOT', step: 12 },
  { key: 'GO_LIVE', label: 'GO-LIVE', step: 13 },
  { key: 'MAINTENANCE', label: 'MAINTENANCE', step: 14 },
  { key: 'COMPLETED', label: 'COMPLETED', step: 15 },
] as const;

export type SDKStageKey = typeof SDK_PROJECT_STAGES[number]['key'];

export const KANBAN_COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-300', dotColor: 'bg-slate-400' },
  { id: 'TODO', label: 'To Do', color: 'border-blue-400', dotColor: 'bg-blue-400' },
  { id: 'ANALYSIS', label: 'Analysis', color: 'border-indigo-400', dotColor: 'bg-indigo-400' },
  { id: 'DEVELOPMENT', label: 'Development', color: 'border-sky-500', dotColor: 'bg-sky-500' },
  { id: 'STAGING', label: 'Staging', color: 'border-teal-500', dotColor: 'bg-teal-500' },
  { id: 'QA_SIT', label: 'QA / SIT', color: 'border-amber-500', dotColor: 'bg-amber-500' },
  { id: 'TESTING', label: 'Stress / Bug Test', color: 'border-orange-500', dotColor: 'bg-orange-500' },
  { id: 'UAT', label: 'UAT Client', color: 'border-purple-500', dotColor: 'bg-purple-500' },
  { id: 'PILOT', label: 'Pilot Run', color: 'border-violet-500', dotColor: 'bg-violet-500' },
  { id: 'GO_LIVE', label: 'Go-Live', color: 'border-emerald-500', dotColor: 'bg-emerald-500' },
  { id: 'MAINTENANCE', label: 'Maintenance', color: 'border-cyan-500', dotColor: 'bg-cyan-500' },
  { id: 'DONE', label: 'Done', color: 'border-green-600', dotColor: 'bg-green-500' },
] as const;

export type KanbanColumnId = typeof KANBAN_COLUMNS[number]['id'];

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Client = Database['public']['Tables']['clients']['Row'];
export type Milestone = Database['public']['Tables']['milestones']['Row'];
export type ProjectTimeline = Database['public']['Tables']['project_timelines']['Row'];
export type TimeEntry = Database['public']['Tables']['time_entries']['Row'];
export type FileItem = Database['public']['Tables']['files']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
export type Revision = Database['public']['Tables']['revisions']['Row'];
export type Approval = Database['public']['Tables']['approvals']['Row'];
export type ProjectStage = Database['public']['Tables']['project_stages']['Row'];

export interface ProjectWithDetails extends Project {
  client?: Client | null;
  lead?: Profile | null;
  stages?: ProjectStage[];
  task_count?: number;
  completed_task_count?: number;
}

export interface TaskWithDetails extends Task {
  assignee?: Profile | null;
  reporter?: Profile | null;
  project?: Project | null;
  dependencies?: Task[];
  comments_count?: number;
}

export interface StaffUtilization {
  profile: Profile;
  assignedTasks: Task[];
  totalEstimatedHours: number;
  allocatedWeeklyHours: number;
  utilizationPercentage: number;
  isOverloaded: boolean; // > 90%
}

export interface ActivityLogWithDetails extends ActivityLog {
  actor?: Profile | null;
  project?: Project | null;
}
