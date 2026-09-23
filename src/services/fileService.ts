import { supabase } from '../lib/supabase';
import { FileItem } from '../types';

export const fileService = {
  async getFiles(projectId?: string, category?: string): Promise<FileItem[]> {
    let query = supabase
      .from('files')
      .select('*, uploaded_by_profile:profiles(*)')
      .order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FileItem[];
  },

  async uploadFile(params: {
    file: File;
    projectId: string;
    category: string;
    uploadedBy: string;
    isConfidential?: boolean;
  }): Promise<FileItem> {
    const timestamp = Date.now();
    const cleanFileName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `projects/${params.projectId}/${params.category}/${timestamp}_${cleanFileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('sdk-files')
      .upload(storagePath, params.file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      throw uploadError;
    }

    // Insert record in files table (rely on Postgres DEFAULT now() for created_at)
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        project_id: params.projectId,
        category: params.category,
        name: params.file.name,
        storage_path: storagePath,
        file_size: params.file.size,
        mime_type: params.file.type,
        uploaded_by: params.uploadedBy,
        is_confidential: params.isConfidential || false,
        version: 1,
      })
      .select()
      .single();

    if (dbError || !fileRecord) {
      await supabase.storage.from('sdk-files').remove([storagePath]);
      throw dbError || new Error('Failed to record file');
    }

    // Insert initial version record with rollback protection
    try {
      const { error: versionError } = await supabase.from('file_versions').insert({
        file_id: fileRecord.id,
        version_number: 1,
        storage_path: storagePath,
        change_summary: 'Initial artifact upload',
        uploaded_by: params.uploadedBy,
      });
      if (versionError) throw versionError;
    } catch (err) {
      await supabase.storage.from('sdk-files').remove([storagePath]);
      await supabase.from('files').delete().eq('id', fileRecord.id);
      throw err;
    }

    // Log Activity
    await supabase.from('activity_logs').insert({
      project_id: params.projectId,
      actor_id: params.uploadedBy,
      action: 'FILE_UPLOADED',
      entity_type: 'FILE',
      entity_id: fileRecord.id,
      details: { file_name: fileRecord.name, category: fileRecord.category, size: fileRecord.file_size },
    });

    return fileRecord;
  },

  getFileDownloadUrl(storagePath: string): string {
    const { data } = supabase.storage.from('sdk-files').getPublicUrl(storagePath);
    return data.publicUrl;
  },

  async deleteFile(fileId: string, storagePath: string): Promise<void> {
    try {
      await supabase.storage.from('sdk-files').remove([storagePath]);
    } catch (e) {
      console.warn('Storage remove warning:', e);
    }
    // Delete file_versions first in case no ON DELETE CASCADE
    await supabase.from('file_versions').delete().eq('file_id', fileId);
    const { error } = await supabase.from('files').delete().eq('id', fileId);
    if (error) throw error;
  },
};
