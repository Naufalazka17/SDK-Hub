import { supabase } from '../lib/supabase';
import { Approval, Revision } from '../types';

export const revisionApprovalService = {
  async getRevisions(projectId?: string): Promise<Revision[]> {
    let query = supabase
      .from('revisions')
      .select('*, client:clients(*), affected_task:tasks(*)')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Revision[];
  },

  async createRevision(revisionData: {
    project_id: string;
    client_id?: string;
    affected_task_id?: string;
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impact_level: 'LOW' | 'MODERATE' | 'MAJOR';
    potential_delay_days?: number;
  }): Promise<Revision> {
    const { data, error } = await supabase
      .from('revisions')
      .insert({
        ...revisionData,
        status: 'Requested',
        potential_delay_days: revisionData.potential_delay_days || (revisionData.impact_level === 'MAJOR' ? 5 : 2),
      })
      .select()
      .single();

    if (error) throw error;

    // Log Activity
    await supabase.from('activity_logs').insert({
      project_id: revisionData.project_id,
      action: 'REVISION_CREATED',
      entity_type: 'REVISION',
      entity_id: data.id,
      details: { title: data.title, priority: data.priority, impact: data.impact_level },
    });

    // Notify Project Lead
    const { data: project } = await supabase
      .from('projects')
      .select('lead_id, title')
      .eq('id', revisionData.project_id)
      .single();

    if (project?.lead_id) {
      await supabase.from('notifications').insert({
        user_id: project.lead_id,
        title: 'New Client Revision Request',
        message: `Klien mengajukan revisi baru pada ${project.title}: "${data.title}" (Potensi delay: ${data.potential_delay_days} hari)`,
        type: 'REVISION_REQUEST',
        entity_id: data.id,
        entity_type: 'REVISION',
      });
    }

    return data;
  },

  async updateRevisionStatus(
    revisionId: string,
    status: 'Requested' | 'Reviewing' | 'Approved' | 'Rejected' | 'In Progress' | 'Completed'
  ): Promise<Revision> {
    const { data, error } = await supabase
      .from('revisions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', revisionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getApprovals(projectId?: string): Promise<Approval[]> {
    let query = supabase
      .from('approvals')
      .select('*, client:clients(*), deliverable:files(*)')
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Approval[];
  },

  async submitApprovalDecision(params: {
    approvalId: string;
    decision: 'Approved' | 'Revision Requested';
    reason?: string;
    clientId?: string;
    projectId?: string;
    title?: string;
  }): Promise<Approval> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.approvalId);
    let data: Approval | null = null;

    if (isUUID) {
      const { data: updated, error: updateError } = await supabase
        .from('approvals')
        .update({
          status: params.decision,
          reason: params.reason || (params.decision === 'Approved' ? 'Disetujui oleh Client PIC' : 'Revisi diajukan'),
          decision_date: new Date().toISOString(),
        })
        .eq('id', params.approvalId)
        .select()
        .maybeSingle();

      if (!updateError && updated) {
        data = updated as Approval;
      }
    }

    // If row did not exist or approvalId was a mock/fallback string (e.g. del-3)
    if (!data && params.projectId) {
      const { data: inserted, error: insertError } = await supabase
        .from('approvals')
        .insert({
          project_id: params.projectId,
          title: params.title || 'Deliverable Submission',
          client_id: params.clientId || null,
          status: params.decision,
          reason: params.reason || (params.decision === 'Approved' ? 'Disetujui oleh Client PIC' : 'Revisi diajukan'),
          decision_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Fallback approval insert error:', insertError);
        throw insertError;
      }
      data = inserted as Approval;
    }

    if (!data) {
      throw new Error('Gagal mencatat status persetujuan deliverable.');
    }

    // Log Activity
    if (data.project_id) {
      await supabase.from('activity_logs').insert({
        project_id: data.project_id,
        action: 'APPROVAL_SUBMITTED',
        entity_type: 'APPROVAL',
        entity_id: data.id,
        details: { decision: params.decision, reason: params.reason, title: data.title },
      });

      // Notify Project Lead
      const { data: project } = await supabase
        .from('projects')
        .select('lead_id, title')
        .eq('id', data.project_id)
        .single();

      if (project?.lead_id) {
        await supabase.from('notifications').insert({
          user_id: project.lead_id,
          title: `Deliverable ${params.decision}: ${data.title}`,
          message: `Klien memberikan status [${params.decision}] untuk ${data.title}. ${params.reason ? `Alasan: "${params.reason}"` : ''}`,
          type: 'APPROVAL_REQUIRED',
          entity_id: data.id,
          entity_type: 'APPROVAL',
        });
      }
    }

    return data;
  },
};
