import { supabase } from '../lib/supabase';
import { TimeEntry, Role } from '../types';

export const timeTrackingService = {
  async getActiveTimeEntry(userId: string): Promise<TimeEntry | null> {
    const { data, error } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active time entry:', error);
      return null;
    }
    return data;
  },

  async clockIn(params: {
    userId: string;
    projectId?: string;
    taskId?: string;
    notes?: string;
  }): Promise<TimeEntry> {
    // Check if there is already an unclosed clock-in and close it
    const active = await this.getActiveTimeEntry(params.userId);
    if (active) {
      await this.clockOut(active.id);
    }

    const { data, error } = await supabase
      .from('time_entries')
      .insert({
        user_id: params.userId,
        project_id: params.projectId || null,
        task_id: params.taskId || null,
        clock_in: new Date().toISOString(),
        notes: params.notes || 'Working on project orchestration',
      })
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    await supabase.from('activity_logs').insert({
      project_id: params.projectId || null,
      actor_id: params.userId,
      action: 'CLOCK_IN',
      entity_type: 'TIME_ENTRY',
      entity_id: data.id,
      details: { clock_in: data.clock_in, notes: data.notes },
    });

    return data;
  },

  async clockOut(timeEntryId: string): Promise<TimeEntry> {
    const { data: entry } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', timeEntryId)
      .single();

    const clockOutTime = new Date();
    const clockInTime = entry ? new Date(entry.clock_in) : clockOutTime;
    const durationMinutes = Math.max(1, Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000));

    const { data, error } = await supabase
      .from('time_entries')
      .update({
        clock_out: clockOutTime.toISOString(),
        duration_minutes: durationMinutes,
      })
      .eq('id', timeEntryId)
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    if (entry) {
      await supabase.from('activity_logs').insert({
        project_id: entry.project_id,
        actor_id: entry.user_id,
        action: 'CLOCK_OUT',
        entity_type: 'TIME_ENTRY',
        entity_id: timeEntryId,
        details: { duration_minutes: durationMinutes },
      });
    }

    return data;
  },

  async getTimeEntries(options?: {
    userId?: string;
    projectId?: string;
    limit?: number;
    viewerRole?: Role;
    viewerUserId?: string;
  }) {
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        user:profiles!time_entries_user_id_fkey(*),
        project:projects(*),
        task:tasks(*)
      `)
      .order('clock_in', { ascending: false });

    // Role-based scoping:
    // If viewer is STAFF, restrict query strictly to viewerUserId
    if (options?.viewerRole === 'STAFF' && options?.viewerUserId) {
      query = query.eq('user_id', options.viewerUserId);
    } else if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.projectId) query = query.eq('project_id', options.projectId);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;

    let entries = data || [];

    // If viewer is PROJECT_LEAD: exclude records where user is ADMIN
    if (options?.viewerRole === 'PROJECT_LEAD') {
      entries = entries.filter((entry: any) => entry.user?.role_id !== 'ADMIN');
    }

    // If viewer is STAFF: ensure only viewer's records (safety guarantee)
    if (options?.viewerRole === 'STAFF' && options?.viewerUserId) {
      entries = entries.filter((entry: any) => entry.user_id === options.viewerUserId);
    }

    return entries;
  },
};
