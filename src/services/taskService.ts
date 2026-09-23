import { supabase } from '../lib/supabase';
import { Task, TaskWithDetails, KanbanColumnId } from '../types';

export const taskService = {
  async getTasks(projectId?: string): Promise<TaskWithDetails[]> {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(*),
        reporter:profiles!tasks_reporter_id_fkey(*),
        project:projects(*)
      `)
      .order('position_order', { ascending: true });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }

    return (data || []) as TaskWithDetails[];
  },

  async createTask(taskData: {
    project_id: string;
    stage_key: KanbanColumnId;
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    assignee_id?: string;
    reporter_id?: string;
    start_date?: string;
    due_date?: string;
    estimated_hours?: number;
    is_blocked?: boolean;
    blocked_reason?: string;
    is_waiting_for_client?: boolean;
    source_message_id?: string;
  }): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        client_waiting_since: taskData.is_waiting_for_client ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    await supabase.from('activity_logs').insert({
      project_id: taskData.project_id,
      actor_id: taskData.reporter_id || null,
      action: 'TASK_CREATED',
      entity_type: 'TASK',
      entity_id: data.id,
      details: { title: data.title, priority: data.priority, stage_key: data.stage_key },
    });

    return data;
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    
    // Auto-track client_waiting_since if toggling waiting_for_client
    if (updates.is_waiting_for_client === true && !updates.client_waiting_since) {
      payload.client_waiting_since = new Date().toISOString();
    } else if (updates.is_waiting_for_client === false) {
      payload.client_waiting_since = null;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async moveTaskStage(
    taskId: string,
    newStageKey: KanbanColumnId,
    newPosition?: number,
    actorId?: string
  ): Promise<Task> {
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    const fromStage = currentTask?.stage_key || 'UNKNOWN';

    const updatePayload: {
      stage_key: KanbanColumnId;
      updated_at: string;
      position_order?: number;
    } = {
      stage_key: newStageKey,
      updated_at: new Date().toISOString(),
    };
    if (newPosition !== undefined) {
      updatePayload.position_order = newPosition;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    // Log Activity for Kanban drag and drop
    if (data.project_id) {
      await supabase.from('activity_logs').insert({
        project_id: data.project_id,
        actor_id: actorId || null,
        action: 'TASK_MOVED',
        entity_type: 'TASK',
        entity_id: data.id,
        details: { from_stage: fromStage, to_stage: newStageKey, task_title: data.title, position_order: newPosition },
      });
    }

    return data;
  },

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
  },

  async getTaskComments(taskId: string) {
    const { data, error } = await supabase
      .from('task_comments')
      .select('*, author:profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async addTaskComment(taskId: string, authorId: string, content: string, isInternal = true) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        author_id: authorId,
        content,
        is_internal: isInternal,
      })
      .select('*, author:profiles(*)')
      .single();

    if (error) throw error;
    return data;
  },
};
