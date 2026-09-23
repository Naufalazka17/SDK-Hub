import { supabase } from '../lib/supabase';
import { Conversation, Message, Profile, Task } from '../types';

let isEnsuringDefaultChannels = false;

export const chatService = {
  /**
   * Cleans up duplicate channels with the same title or project_id
   */
  async cleanupDuplicateChannels(): Promise<void> {
    try {
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, title, project_id, created_at')
        .order('created_at', { ascending: true });

      if (!convs || convs.length === 0) return;

      const seen = new Set<string>();
      const idsToDelete: string[] = [];

      for (const c of convs) {
        const key = c.project_id ? `proj:${c.project_id}` : `title:${c.title.trim().toLowerCase()}`;
        if (seen.has(key)) {
          idsToDelete.push(c.id);
        } else {
          seen.add(key);
        }
      }

      if (idsToDelete.length > 0) {
        await supabase.from('messages').delete().in('conversation_id', idsToDelete);
        await supabase.from('conversation_members').delete().in('conversation_id', idsToDelete);
        await supabase.from('conversations').delete().in('id', idsToDelete);
      }
    } catch (e) {
      console.warn('Cleanup duplicate channels note:', e);
    }
  },

  /**
   * Automatically ensures default channels exist:
   * 1. "Staff Only"
   * 2. "Project Lead & Admin"
   * 3. Channels for each project
   */
  async ensureDefaultChannels(): Promise<void> {
    if (isEnsuringDefaultChannels) return;
    isEnsuringDefaultChannels = true;

    try {
      // First clean up any existing duplicate entries in the database
      await this.cleanupDuplicateChannels();

      const { data: existingConvs } = await supabase.from('conversations').select('id, title, project_id');
      const convTitles = (existingConvs || []).map((c) => c.title.toLowerCase().trim());

      // 1. Staff Only
      if (!convTitles.includes('staff only')) {
        await supabase.from('conversations').insert({
          title: 'Staff Only',
          type: 'GROUP',
          is_internal: true,
        });
      }

      // 2. Project Lead & Admin
      if (!convTitles.includes('project lead & admin')) {
        await supabase.from('conversations').insert({
          title: 'Project Lead & Admin',
          type: 'GROUP',
          is_internal: true,
        });
      }

      // 3. Project Channels
      const { data: projects } = await supabase.from('projects').select('id, title, code');
      if (projects) {
        for (const proj of projects) {
          const hasChannel = (existingConvs || []).some((c) => c.project_id === proj.id);
          if (!hasChannel) {
            await supabase.from('conversations').insert({
              title: `${proj.code} • ${proj.title}`,
              project_id: proj.id,
              type: 'PROJECT',
              is_internal: false,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Warning creating default channels:', err);
    } finally {
      isEnsuringDefaultChannels = false;
    }
  },

  /**
   * Deletes a conversation and its associated messages/members
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await supabase.from('messages').delete().eq('conversation_id', conversationId);
    await supabase.from('conversation_members').delete().eq('conversation_id', conversationId);
    const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
    if (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  async getConversations(projectId?: string | null): Promise<Conversation[]> {
    let query = supabase.from('conversations').select('*').order('created_at', { ascending: false });
    if (projectId) {
      query = query.or(`project_id.eq.${projectId},project_id.is.null`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createConversation(params: {
    title: string;
    projectId?: string | null;
    type?: string;
    isInternal?: boolean;
  }): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        title: params.title,
        project_id: params.projectId || null,
        type: params.type || 'GROUP',
        is_internal: params.isInternal ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * WhatsApp-style Group Creator with member selection
   */
  async createGroupWithMembers(params: {
    title: string;
    projectId?: string | null;
    isInternal?: boolean;
    memberIds: string[];
    createdById?: string;
  }): Promise<Conversation> {
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        title: params.title.trim(),
        project_id: params.projectId || null,
        type: 'GROUP',
        is_internal: params.isInternal ?? true,
      })
      .select()
      .single();

    if (convError || !conv) throw convError;

    // Collect all members to insert
    const allMemberIds = Array.from(new Set([...params.memberIds, ...(params.createdById ? [params.createdById] : [])]));
    if (allMemberIds.length > 0) {
      const memberRows = allMemberIds.map((uid) => ({
        conversation_id: conv.id,
        user_id: uid,
      }));
      await supabase.from('conversation_members').insert(memberRows);
    }

    // Send initial system message
    await this.sendMessage(
      conv.id,
      null,
      `Grup "${conv.title}" berhasil dibuat dengan ${allMemberIds.length} anggota.`,
      { isSystem: true }
    );

    return conv;
  },

  async uploadAttachment(file: File, conversationId: string): Promise<{
    name: string;
    url: string;
    size: number;
    type: string;
  }> {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `chat/${conversationId}/${timestamp}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('sdk-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Chat attachment upload failed:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage.from('sdk-files').getPublicUrl(storagePath);
    return {
      name: file.name,
      url: data.publicUrl,
      size: file.size,
      type: file.type,
    };
  },

  async getMessages(conversationId: string): Promise<(Message & { sender?: Profile | null })[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as (Message & { sender?: Profile | null })[];
  },

  async sendMessage(
    conversationId: string,
    senderId: string | null,
    content: string,
    options?: {
      attachments?: any[];
      replyToId?: string;
      isSystem?: boolean;
    }
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        attachments: options?.attachments || [],
        reply_to_id: options?.replyToId || null,
        is_system: options?.isSystem || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // #28: Chat -> Task Bridge
  async createTaskFromMessage(params: {
    messageId: string;
    messageContent: string;
    conversationId: string;
    projectId: string;
    reporterId: string;
    assigneeId?: string;
    taskTitle?: string;
    taskDescription?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }): Promise<Task> {
    // 1. Create the task in Kanban (defaults to 'DEVELOPMENT' or 'TODO')
    const title = params.taskTitle || `Revisi: ${params.messageContent.slice(0, 60)}...`;
    const description = params.taskDescription || `Dibuat dari pesan chat: "${params.messageContent}"`;

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id: params.projectId,
        stage_key: 'BACKLOG',
        title,
        description,
        priority: params.priority || 'HIGH',
        status: 'TODO',
        reporter_id: params.reporterId,
        assignee_id: params.assigneeId || null,
        source_message_id: params.messageId,
        is_waiting_for_client: false,
      })
      .select()
      .single();

    if (taskError || !task) throw taskError;

    // 2. Post automatic system message in conversation (FLOW 6.3)
    await this.sendMessage(
      params.conversationId,
      null,
      `Task created from client message. (Task: "${title}", Stage: BACKLOG)`,
      { isSystem: true }
    );

    // 3. Log Activity
    await supabase.from('activity_logs').insert({
      project_id: params.projectId,
      actor_id: params.reporterId,
      action: 'TASK_CREATED_FROM_CHAT',
      entity_type: 'TASK',
      entity_id: task.id,
      details: { title: task.title, source_message_id: params.messageId },
    });

    return task;
  },
};
