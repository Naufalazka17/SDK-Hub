import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, LayoutGrid, List, GripVertical, 
  ArrowRight, CheckCircle2, RotateCcw, Loader2,
  FolderKanban, Trash2
} from 'lucide-react';
import { ProjectSubTabs } from '../components/common/ProjectSubTabs';
import { CreateTaskModal } from '../components/common/CreateTaskModal';
import { taskService } from '../services/taskService';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { KANBAN_COLUMNS, KanbanColumnId, TaskWithDetails } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const OrchestrationBoardPage: React.FC = () => {
  const { currentProject, projects } = useProject();
  const { currentProfile } = useAuth();
  const { t, language } = useLanguage();

  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('CURRENT');
  const [activeView, setActiveView] = useState<'kanban' | 'table'>('kanban');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<KanbanColumnId | null>(null);

  // Determine active project id filter
  const effectiveProjectId = selectedProjectId === 'CURRENT' 
    ? (currentProject?.id || (projects.length > 0 ? projects[0].id : undefined))
    : selectedProjectId === 'ALL'
    ? undefined
    : selectedProjectId;

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await taskService.getTasks(effectiveProjectId);
      setTasks(data);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      toast.error('Gagal memuat task dari database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('realtime:orchestration-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          loadTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveProjectId]);

  // Delete task handler
  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    const confirmMsg = language === 'id'
      ? `Apakah Anda yakin ingin menghapus tugas "${taskTitle}"? Tindakan ini permanen.`
      : `Are you sure you want to delete task "${taskTitle}"? This action is permanent.`;

    if (!window.confirm(confirmMsg)) return;

    // Optimistic removal
    const prevTasks = [...tasks];
    setTasks((current) => current.filter((t) => t.id !== taskId));

    try {
      await taskService.deleteTask(taskId);
      toast.success(
        language === 'id'
          ? `Tugas "${taskTitle}" berhasil dihapus.`
          : `Task "${taskTitle}" deleted successfully.`
      );
    } catch (err: any) {
      console.error('Failed to delete task:', err);
      toast.error(
        language === 'id'
          ? 'Gagal menghapus tugas dari database.'
          : 'Failed to delete task from database.'
      );
      setTasks(prevTasks);
    }
  };

  // Move task helper
  const handleMoveTask = async (taskId: string, targetStage: KanbanColumnId) => {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const previousStage = tasks[taskIndex].stage_key as KanbanColumnId;
    if (previousStage === targetStage) return;

    // Optimistic update
    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      stage_key: targetStage,
      updated_at: new Date().toISOString(),
    };
    setTasks(updatedTasks);

    try {
      await taskService.moveTaskStage(taskId, targetStage, undefined, currentProfile?.id);
      const stageName = KANBAN_COLUMNS.find((c) => c.id === targetStage)?.label || targetStage;
      toast.success(`Task dipindahkan ke stage ${stageName}`);
    } catch (err: any) {
      console.error('Error moving task stage:', err);
      toast.error('Gagal memindahkan stage task di database');
      // Revert on error
      loadTasks();
    }
  };

  // Next Stage helper
  const handleNextStage = (task: TaskWithDetails) => {
    const currentIdx = KANBAN_COLUMNS.findIndex((c) => c.id === task.stage_key);
    if (currentIdx === -1 || currentIdx >= KANBAN_COLUMNS.length - 1) return;
    const nextCol = KANBAN_COLUMNS[currentIdx + 1];
    handleMoveTask(task.id, nextCol.id);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) {
      setDragOverColId(colId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    setDragOverColId(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      handleMoveTask(taskId, colId);
    }
    setDraggedTaskId(null);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project?.code && t.project.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.assignee?.full_name && t.assignee.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <CreateTaskModal 
        isOpen={isNewTaskOpen} 
        onClose={() => setIsNewTaskOpen(false)} 
        onTaskCreated={loadTasks}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {t('board.title', 'Orchestration Board')}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
              {t('board.badge', '12 Stages • Live Database')}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {t('board.subtitle', 'End-to-end 12-stage delivery pipeline. Drag and drop cards across any stage or advance via Next Stage.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNewTaskOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('board.createTask', 'Create Task')}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <ProjectSubTabs activeTab="board" />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-60 min-w-[160px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('board.searchPlaceholder', 'Search tasks, code, assignee...')}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-primary)] font-medium cursor-pointer"
          >
            <option value="All">{language === 'id' ? 'Semua Prioritas' : 'All Priorities'}</option>
            <option value="CRITICAL">{language === 'id' ? 'Kritis' : 'Critical'}</option>
            <option value="HIGH">{language === 'id' ? 'Tinggi' : 'High'}</option>
            <option value="MEDIUM">{language === 'id' ? 'Sedang' : 'Medium'}</option>
            <option value="LOW">{language === 'id' ? 'Rendah' : 'Low'}</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
            <span>{filteredTasks.length} {language === 'id' ? 'Total Tugas' : 'Tasks Total'}</span>
          </div>

          <div className="flex items-center bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setActiveView('kanban')}
              className={`p-1 rounded ${activeView === 'kanban' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-muted)]'}`}
              aria-label="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveView('table')}
              className={`p-1 rounded ${activeView === 'table' ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-muted)]'}`}
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">{language === 'id' ? 'Memuat papan orkestrasi dari basis data...' : 'Loading orchestration board from database...'}</span>
        </div>
      ) : activeView === 'kanban' ? (
        /* Full 12-Column Kanban Board */
        <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x no-scrollbar">
          <div className="flex gap-4 items-start min-w-max">
            {KANBAN_COLUMNS.map((col, colIdx) => {
              const colTasks = filteredTasks.filter((t) => t.stage_key === col.id);
              const isOver = dragOverColId === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`w-[290px] min-w-[290px] shrink-0 bg-[var(--bg-surface)] border rounded-xl p-3.5 space-y-3 transition-colors ${
                    isOver 
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-subtle)]/30 ring-2 ring-[var(--accent-primary)]/20' 
                      : 'border-[var(--border-default)]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor || 'bg-slate-400'}`}></span>
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {col.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                        {colTasks.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsNewTaskOpen(true)}
                      className="p-1 rounded hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      title={language === 'id' ? 'Buat tugas di tahap ini' : 'Create task in this stage'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2.5 min-h-[350px]">
                    {colTasks.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed border-[var(--border-subtle)] rounded-lg text-[11px] text-[var(--text-muted)]">
                        {language === 'id' ? 'Tarik tugas ke sini' : 'Drag task here'}
                      </div>
                    ) : (
                      colTasks.map((task) => {
                        const isDone = task.stage_key === 'DONE';
                        const nextCol = colIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIdx + 1] : null;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className={`p-3.5 rounded-lg bg-[var(--bg-input)] border transition-all cursor-grab active:cursor-grabbing space-y-2.5 shadow-xs ${
                              draggedTaskId === task.id ? 'opacity-50 border-dashed border-[var(--accent-primary)]' : 'border-[var(--border-default)] hover:border-[var(--accent-primary)]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-semibold text-[var(--text-muted)]">
                                {task.project?.code || 'TASK'}-{task.id.slice(0, 4).toUpperCase()}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id, task.title);
                                  }}
                                  className="p-1 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                  title={language === 'id' ? 'Hapus tugas' : 'Delete task'}
                                  aria-label={language === 'id' ? 'Hapus tugas' : 'Delete task'}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <GripVertical className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-50" />
                              </div>
                            </div>

                            <h4 className="text-xs font-semibold text-[var(--text-primary)] leading-snug">
                              {task.title}
                            </h4>

                            {task.project && (
                              <div className="text-[10px] text-[var(--text-secondary)] truncate">
                                📁 {task.project.title}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 text-[10px]">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                                  task.priority === 'CRITICAL' || task.priority === 'HIGH'
                                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                                    : task.priority === 'MEDIUM'
                                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                    : 'text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] border-[var(--border-default)]'
                                }`}>
                                  ● {task.priority === 'CRITICAL' ? (language === 'id' ? 'Kritis' : 'Critical') :
                                      task.priority === 'HIGH' ? (language === 'id' ? 'Tinggi' : 'High') :
                                      task.priority === 'MEDIUM' ? (language === 'id' ? 'Sedang' : 'Medium') :
                                      (language === 'id' ? 'Rendah' : 'Low')}
                                </span>

                                {task.due_date && (
                                  <div className="flex items-center gap-1 text-[var(--text-muted)] font-mono">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(task.due_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                )}
                              </div>

                              <div 
                                className="w-6 h-6 rounded-full bg-slate-800 border border-[var(--border-default)] flex items-center justify-center font-bold text-[9px] text-white shrink-0"
                                title={task.assignee?.full_name || (language === 'id' ? 'Belum Ditugaskan' : 'Unassigned')}
                              >
                                {task.assignee?.full_name
                                  ? task.assignee.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                                  : 'NA'}
                              </div>
                            </div>

                            {/* Dual Movement Action Buttons */}
                            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center gap-1.5">
                              {!isDone ? (
                                <>
                                  {nextCol && (
                                    <button
                                      type="button"
                                      onClick={() => handleNextStage(task)}
                                      className="flex-1 py-1 px-2 rounded bg-[var(--bg-surface)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)] border border-[var(--border-default)] hover:border-[var(--accent-border)] text-[10px] font-semibold text-[var(--text-secondary)] transition-all flex items-center justify-center gap-1"
                                      title={`${language === 'id' ? 'Lanjut ke' : 'Advance to'} ${nextCol.label}`}
                                    >
                                      <span>{language === 'id' ? 'Tahap Lanjut' : 'Next Stage'}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTask(task.id, 'DONE')}
                                    className="py-1 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold transition-all flex items-center justify-center gap-1"
                                    title={language === 'id' ? 'Tandai Selesai' : 'Mark Done'}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{language === 'id' ? 'Selesai' : 'Done'}</span>
                                  </button>
                                </>
                              ) : (
                                <div className="w-full flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{language === 'id' ? 'Selesai' : 'Done'}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTask(task.id, 'BACKLOG')}
                                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>{language === 'id' ? 'Buka Kembali' : 'Reopen'}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto touch-pan-x no-scrollbar">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
                <tr>
                  <th className="py-2.5 px-5">{language === 'id' ? 'Judul Tugas' : 'Task Title'}</th>
                  <th className="py-2.5 px-4">{language === 'id' ? 'Proyek' : 'Project'}</th>
                  <th className="py-2.5 px-4">{language === 'id' ? 'Status Tahap' : 'Stage Status'}</th>
                  <th className="py-2.5 px-4">{language === 'id' ? 'Prioritas' : 'Priority'}</th>
                  <th className="py-2.5 px-4">{language === 'id' ? 'Penanggung Jawab' : 'Assignee'}</th>
                  <th className="py-2.5 px-4">{language === 'id' ? 'Tenggat Waktu' : 'Due Date'}</th>
                  <th className="py-2.5 px-4 text-right">{language === 'id' ? 'Aksi Cepat' : 'Quick Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                      {language === 'id' ? 'Tidak ada tugas yang ditemukan.' : 'No tasks found.'}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => {
                    const isDone = t.stage_key === 'DONE';

                    return (
                      <tr key={t.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {t.title}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-muted)]">
                            {t.project?.code || 'PRJ'}-{t.id.slice(0, 4).toUpperCase()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                          {t.project?.title || (language === 'id' ? 'Proyek Tidak Dikenal' : 'Unknown Project')}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={t.stage_key}
                            onChange={(e) => handleMoveTask(t.id, e.target.value as KanbanColumnId)}
                            className="px-2 py-1 bg-[var(--bg-input)] border border-[var(--border-default)] rounded text-[11px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          >
                            {KANBAN_COLUMNS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            t.priority === 'CRITICAL' || t.priority === 'HIGH'
                              ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                              : t.priority === 'MEDIUM'
                              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                              : 'text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] border-[var(--border-default)]'
                          }`}>
                            {t.priority === 'CRITICAL' ? (language === 'id' ? 'Kritis' : 'Critical') :
                             t.priority === 'HIGH' ? (language === 'id' ? 'Tinggi' : 'High') :
                             t.priority === 'MEDIUM' ? (language === 'id' ? 'Sedang' : 'Medium') :
                             (language === 'id' ? 'Rendah' : 'Low')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                          {t.assignee?.full_name || (language === 'id' ? 'Belum Ditugaskan' : 'Unassigned')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-muted)]">
                          {t.due_date ? new Date(t.due_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US') : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isDone ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleNextStage(t)}
                                  className="px-2.5 py-1 rounded bg-[var(--bg-surface-subtle)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)] text-[11px] font-semibold text-[var(--text-primary)] border border-[var(--border-default)] transition-colors inline-flex items-center gap-1"
                                >
                                  <span>{language === 'id' ? 'Lanjut' : 'Next'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTask(t.id, 'DONE')}
                                  className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{language === 'id' ? 'Selesai' : 'Done'}</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-emerald-400 font-semibold inline-flex items-center gap-1 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{language === 'id' ? 'Selesai' : 'Done'}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(t.id, t.title)}
                              className="p-1.5 rounded text-[var(--text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors inline-flex items-center"
                              title={language === 'id' ? 'Hapus tugas' : 'Delete task'}
                              aria-label={language === 'id' ? 'Hapus tugas' : 'Delete task'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
