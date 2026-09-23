import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import { KANBAN_COLUMNS, KanbanColumnId } from '../../types';
import { taskService } from '../../services/taskService';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  initialData?: {
    title?: string;
    description?: string;
    projectId?: string;
    stageKey?: KanbanColumnId;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sourceMessageId?: string;
    isWaitingForClient?: boolean;
  };
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  initialData,
}) => {
  const { projects, currentProject } = useProject();
  const { availableProfiles, currentProfile } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [projectId, setProjectId] = useState(initialData?.projectId || currentProject?.id || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [stageKey, setStageKey] = useState<KanbanColumnId>(initialData?.stageKey || 'TODO');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>(initialData?.priority || 'MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('8');
  const [isWaitingForClient, setIsWaitingForClient] = useState(initialData?.isWaitingForClient || false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStageKey('TODO');
    setPriority('MEDIUM');
    setAssigneeId('');
    setDueDate('');
    setEstimatedHours('8');
    setIsWaitingForClient(false);
    setIsBlocked(false);
    setBlockedReason('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setProjectId(initialData.projectId || currentProject?.id || (projects[0]?.id ?? ''));
        setStageKey(initialData.stageKey || 'TODO');
        setPriority(initialData.priority || 'MEDIUM');
        setIsWaitingForClient(initialData.isWaitingForClient || false);
        setAssigneeId('');
        setDueDate('');
        setEstimatedHours('8');
        setIsBlocked(false);
        setBlockedReason('');
      } else {
        resetForm();
        setProjectId(currentProject?.id || (projects[0]?.id ?? ''));
      }
    }
  }, [isOpen, initialData, currentProject, projects]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    try {
      setIsSubmitting(true);
      await taskService.createTask({
        project_id: projectId,
        stage_key: stageKey,
        title: title.trim(),
        description: description.trim(),
        priority,
        assignee_id: assigneeId || undefined,
        reporter_id: currentProfile?.id,
        due_date: dueDate || undefined,
        estimated_hours: parseFloat(estimatedHours) || 0,
        is_blocked: isBlocked,
        blocked_reason: isBlocked ? blockedReason : undefined,
        is_waiting_for_client: isWaitingForClient,
        source_message_id: initialData?.sourceMessageId,
      });

      toast.success(isId ? 'Tugas berhasil dibuat!' : 'Task created successfully');
      resetForm();
      onClose();
      if (onTaskCreated) onTaskCreated();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      toast.error(err?.message || (isId ? 'Gagal membuat tugas' : 'Failed to create task'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-xl bg-[var(--bg-surface-elevated)] rounded-t-2xl sm:rounded-xl shadow-2xl border border-[var(--border-default)] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Buat Tugas Baru' : 'Create New Task'}
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {isId ? 'Tugaskan, tentukan prioritas, dan kirimkan tugas ke pipeline' : 'Assign, prioritize, and dispatch tasks into the pipeline'}
            </p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Project Selection */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              {isId ? 'Proyek' : 'Project'} <span className="text-[var(--accent-primary)]">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="" disabled>{isId ? 'Pilih Target Proyek' : 'Select Target Project'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Task Title */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              {isId ? 'Judul Tugas' : 'Task Title'} <span className="text-[var(--accent-primary)]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isId ? 'contoh: Integrasi otentikasi login pengguna' : 'e.g. Define authentication flow'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Task Description */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              {isId ? 'Deskripsi & Kriteria Penerimaan' : 'Description & Acceptance Criteria'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isId ? 'Berikan konteks teknis, endpoint, dan ketentuan validasi...' : 'Provide technical context, endpoints, and validation requirements...'}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-y"
            />
          </div>

          {/* Stage & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Tahapan Pipeline' : 'Pipeline Stage'}
              </label>
              <select
                value={stageKey}
                onChange={(e) => setStageKey(e.target.value as KanbanColumnId)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                {KANBAN_COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Prioritas' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="LOW">{isId ? 'Rendah' : 'Low'}</option>
                <option value="MEDIUM">{isId ? 'Sedang' : 'Medium'}</option>
                <option value="HIGH">{isId ? 'Tinggi' : 'High'}</option>
                <option value="CRITICAL">{isId ? 'Kritis (Blocker)' : 'Critical (Blocker)'}</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Penerima Tugas' : 'Assignee'}
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="">{isId ? 'Belum Ditugaskan' : 'Unassigned'}</option>
                {availableProfiles.filter(p => p.role_id !== 'CLIENT').map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.position || p.role_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Target Tenggat Waktu' : 'Target Deadline'}
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Estimasi Jam' : 'Estimated Hours'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              </div>
            </div>

            {/* Waiting for Client Checkbox */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 rounded-lg border border-amber-500/30 bg-amber-500/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isWaitingForClient}
                  onChange={(e) => setIsWaitingForClient(e.target.checked)}
                  className="rounded text-[var(--accent-primary)] focus:ring-[var(--accent-primary)] w-4 h-4"
                />
                <span className="text-[11px] font-semibold text-amber-300">
                  {isId ? 'Menunggu Tanggapan Klien' : 'Waiting for Client Response'}
                </span>
              </label>
            </div>
          </div>

          {/* Blocker Settings */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 p-2 rounded-lg border border-red-500/30 bg-red-500/10 cursor-pointer">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="rounded text-red-500 focus:ring-red-500 w-4 h-4"
              />
              <span className="text-[11px] font-semibold text-red-300">
                {isId ? 'Tandai Terkendala (Is Blocked)' : 'Mark as Blocked (Is Blocked)'}
              </span>
            </label>

            {isBlocked && (
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-semibold text-red-300 uppercase tracking-wider">
                  {isId ? 'Alasan Kendala' : 'Blocked Reason'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required={isBlocked}
                  value={blockedReason}
                  onChange={(e) => setBlockedReason(e.target.value)}
                  placeholder={isId ? 'contoh: Menunggu kredensial API sandbox dari klien...' : 'e.g. Waiting for API sandbox credentials...'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-red-500/40 bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-red-400"
                />
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3.5 border-t border-[var(--border-default)] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pb-safe sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] rounded-lg transition-colors text-center"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isSubmitting 
                ? (isId ? 'Membuat...' : 'Creating...') 
                : (isId ? 'Buat & Kirim Tugas' : 'Create & Dispatch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
