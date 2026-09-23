import { supabase } from '../lib/supabase';
import { ActivityLog, ActivityLogWithDetails, Role } from '../types';

export const activityService = {
  async getActivityLogs(projectId?: string, limit = 50, viewerRole?: Role): Promise<ActivityLogWithDetails[]> {
    let query = supabase
      .from('activity_logs')
      .select('*, actor:profiles(*), project:projects(*)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;

    let logs = (data || []) as ActivityLogWithDetails[];

    // If viewer is PROJECT_LEAD: cannot view activities performed by ADMIN
    if (viewerRole === 'PROJECT_LEAD') {
      logs = logs.filter((l) => l.actor?.role_id !== 'ADMIN');
    }

    return logs;
  },

  async logActivity(params: {
    projectId?: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: any;
  }): Promise<void> {
    await supabase.from('activity_logs').insert({
      project_id: params.projectId || null,
      actor_id: params.actorId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || {},
    });
  },
};
