import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, FileText, Loader2, FolderKanban,
  MessageSquare, AlertCircle, ChevronRight, AlertTriangle,
  Upload, Download, HardDrive, X
} from 'lucide-react';
import { ProjectSubTabs } from '../components/common/ProjectSubTabs';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Milestone, TaskWithDetails, Approval, Revision, FileItem } from '../types';
import { taskService } from '../services/taskService';
import { revisionApprovalService } from '../services/revisionApprovalService';
import { fileService } from '../services/fileService';
import { toast } from 'sonner';

export const ClientCockpitPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProject, projects, setCurrentProjectId } = useProject();
  const { currentProfile, isClient } = useAuth();
  const { language } = useLanguage();

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [clientFiles, setClientFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Revision Modal states
  const [revisionModalApproval, setRevisionModalApproval] = useState<Approval | null>(null);
  const [revisionTitle, setRevisionTitle] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionImpact, setRevisionImpact] = useState<'LOW' | 'MODERATE' | 'MAJOR'>('MODERATE');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // File Upload states for Client
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('deliverables');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const activeProject = currentProject || (projects.length > 0 ? projects[0] : null);

  const loadCockpitData = async () => {
    if (!activeProject) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [milestonesRes, projectTasks, projectApprovals, projectRevisions, projectFiles] = await Promise.all([
        supabase.from('milestones').select('*').eq('project_id', activeProject.id).order('target_date', { ascending: true }),
        taskService.getTasks(activeProject.id),
        revisionApprovalService.getApprovals(activeProject.id),
        revisionApprovalService.getRevisions(activeProject.id),
        fileService.getFiles(activeProject.id),
      ]);

      setMilestones(milestonesRes.data || []);
      setTasks(projectTasks || []);
      setApprovals(projectApprovals || []);
      setRevisions(projectRevisions || []);
      setClientFiles(projectFiles || []);
    } catch (err) {
      console.error('Failed to load cockpit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCockpitData();
  }, [activeProject?.id]);

  const clientName = activeProject?.client?.name || activeProject?.client?.company || (language === 'id' ? 'Mitra Klien' : 'Client Partner');
  const projectTitle = activeProject?.title || (language === 'id' ? 'Kokpit Proyek' : 'Project Cockpit');

  // Live calculation of progress
  const completedTasks = tasks.filter((t) => t.stage_key === 'DONE').length;
  const totalTasks = tasks.length;
  const progressPct = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : (activeProject?.progress_percentage ?? 0);

  // Pending Approvals
  const pendingApprovals = approvals.filter((a) => a.status === 'Pending');

  const handleApprove = async (approval: Approval) => {
    try {
      setIsSubmittingDecision(true);
      await revisionApprovalService.submitApprovalDecision({
        approvalId: approval.id,
        projectId: activeProject?.id,
        title: approval.title,
        decision: 'Approved',
        reason: language === 'id' ? 'Disetujui oleh Client PIC' : 'Approved by Client PIC',
        clientId: activeProject?.client_id || undefined,
      });
      toast.success(
        language === 'id' 
          ? `Deliverable "${approval.title}" berhasil disetujui! Proyek dilanjutkan.` 
          : `Deliverable "${approval.title}" approved successfully! Project resumes.`
      );
      loadCockpitData();
    } catch (err: any) {
      toast.error(err.message || (language === 'id' ? 'Gagal menyetujui deliverable' : 'Failed to approve deliverable'));
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleOpenRevisionModal = (approval: Approval) => {
    setRevisionModalApproval(approval);
    setRevisionTitle(language === 'id' ? `Revisi: ${approval.title}` : `Revision: ${approval.title}`);
    setRevisionNotes('');
    setRevisionImpact('MODERATE');
  };

  const handleCloseRevisionModal = () => {
    setRevisionModalApproval(null);
    setRevisionTitle('');
    setRevisionNotes('');
    setRevisionImpact('MODERATE');
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadFileObj(null);
    setUploadDescription('');
    setUploadCategory('Requirements');
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalApproval || !activeProject) return;
    if (!revisionNotes.trim()) {
      toast.error(language === 'id' ? 'Catatan perbaikan revisi wajib diisi.' : 'Correction notes are required.');
      return;
    }

    try {
      setIsSubmittingDecision(true);
      // 1. Submit approval decision as 'Revision Requested' (safe with non-UUID or UUID)
      await revisionApprovalService.submitApprovalDecision({
        approvalId: revisionModalApproval.id,
        projectId: activeProject.id,
        title: revisionModalApproval.title,
        decision: 'Revision Requested',
        reason: revisionNotes,
        clientId: activeProject.client_id || undefined,
      });

      // 2. Create entry in revisions table to start workflow tracker
      await revisionApprovalService.createRevision({
        project_id: activeProject.id,
        client_id: activeProject.client_id || undefined,
        title: revisionTitle,
        description: revisionNotes,
        priority: revisionImpact === 'MAJOR' ? 'CRITICAL' : 'HIGH',
        impact_level: revisionImpact,
        potential_delay_days: revisionImpact === 'MAJOR' ? 5 : revisionImpact === 'MODERATE' ? 2 : 1,
      });

      toast.success(
        language === 'id' 
          ? 'Permintaan revisi berhasil dikirim ke Project Lead. Status delay mulai dipantau.' 
          : 'Revision request sent to Project Lead. Delay status is now tracked.'
      );
      handleCloseRevisionModal();
      loadCockpitData();
    } catch (err: any) {
      toast.error(err.message || (language === 'id' ? 'Gagal mengirim permintaan revisi' : 'Failed to send revision request'));
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleUploadClientFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileObj || !activeProject || !currentProfile) {
      toast.error(language === 'id' ? 'Pilih berkas terlebih dahulu.' : 'Please select a file first.');
      return;
    }

    try {
      setIsUploading(true);
      await fileService.uploadFile({
        file: uploadFileObj,
        projectId: activeProject.id,
        category: uploadCategory,
        uploadedBy: currentProfile.id,
        isConfidential: false,
      });

      toast.success(
        language === 'id' 
          ? `Berkas "${uploadFileObj.name}" berhasil diunggah.` 
          : `File "${uploadFileObj.name}" uploaded successfully.`
      );
      handleCloseUploadModal();
      loadCockpitData();
    } catch (err: any) {
      toast.error(err.message || (language === 'id' ? 'Gagal mengunggah berkas.' : 'Failed to upload file.'));
    } finally {
      setIsUploading(false);
    }
  };

  // Fallback milestones if table has none yet
  const displayedMilestones = milestones.length > 0 
    ? milestones.map((m, idx) => ({
        step: `${idx + 1}. ${m.title}`,
        status: m.status === 'REACHED' ? (language === 'id' ? 'Selesai' : 'Completed') : m.status === 'IN_PROGRESS' ? (language === 'id' ? 'Sedang Berjalan' : 'In Progress') : (language === 'id' ? 'Mendatang' : 'Upcoming'),
        statusColor: m.status === 'REACHED' 
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
          : m.status === 'IN_PROGRESS'
          ? 'text-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--accent-border)]'
          : 'text-slate-400 bg-slate-500/10 border-slate-500/30',
        description: m.description || (language === 'id' ? 'Titik pemeriksaan pencapaian milestone' : 'Milestone delivery checkpoint'),
        date: m.target_date ? new Date(m.target_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (language === 'id' ? 'Tertunda' : 'Pending'),
        isDone: m.status === 'REACHED',
        isCurrent: m.status === 'IN_PROGRESS',
        isUpcoming: m.status === 'PLANNED',
      }))
    : [
        {
          step: language === 'id' ? '1. Inisiasi & Ruang Lingkup' : '1. Inception & Scope',
          status: progressPct >= 20 ? (language === 'id' ? 'Selesai' : 'Completed') : (language === 'id' ? 'Sedang Berjalan' : 'In Progress'),
          statusColor: progressPct >= 20 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--accent-border)]',
          description: language === 'id' ? 'Definisi cakupan, persetujuan spesifikasi, & kickoff arsitektur' : 'Scope definition, BRD approval, & architecture kickoff',
          date: activeProject?.start_date ? new Date(activeProject.start_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (language === 'id' ? 'Kickoff' : 'Kickoff'),
          isDone: progressPct >= 20,
          isCurrent: progressPct < 20,
          isUpcoming: false,
        },
        {
          step: language === 'id' ? '2. Desain Sistem & Prototipe' : '2. System Design & Prototype',
          status: progressPct >= 50 ? (language === 'id' ? 'Selesai' : 'Completed') : progressPct >= 20 ? (language === 'id' ? 'Sedang Berjalan' : 'In Progress') : (language === 'id' ? 'Mendatang' : 'Upcoming'),
          statusColor: progressPct >= 50 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : progressPct >= 20 ? 'text-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--accent-border)]' : 'text-slate-400 bg-slate-500/10 border-slate-500/30',
          description: language === 'id' ? 'Sistem desain, skema basis data, dan persetujuan antarmuka' : 'Design system, database schema, and client sign-off',
          date: language === 'id' ? 'Review Tahap' : 'Stage Review',
          isDone: progressPct >= 50,
          isCurrent: progressPct >= 20 && progressPct < 50,
          isUpcoming: progressPct < 20,
        },
        {
          step: language === 'id' ? '3. Pengembangan Utama' : '3. Core Development',
          status: progressPct >= 80 ? (language === 'id' ? 'Selesai' : 'Completed') : progressPct >= 50 ? (language === 'id' ? 'Sedang Berjalan' : 'In Progress') : (language === 'id' ? 'Mendatang' : 'Upcoming'),
          statusColor: progressPct >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : progressPct >= 50 ? 'text-[var(--accent-primary)] bg-[var(--accent-subtle)] border-[var(--accent-border)]' : 'text-slate-400 bg-slate-500/10 border-slate-500/30',
          description: language === 'id' ? 'Rekayasa full-stack & integrasi gateway antarmuka pemrograman' : 'Full-stack engineering & API integration gateway',
          date: language === 'id' ? 'Fase Aktif' : 'Active Phase',
          isDone: progressPct >= 80,
          isCurrent: progressPct >= 50 && progressPct < 80,
          isUpcoming: progressPct < 50,
        },
        {
          step: language === 'id' ? '4. Uji Penerimaan & Peluncuran' : '4. Final SIT / UAT & Go-Live',
          status: progressPct >= 100 ? (language === 'id' ? 'Selesai' : 'Completed') : (language === 'id' ? 'Mendatang' : 'Upcoming'),
          statusColor: progressPct >= 100 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' : 'text-slate-400 bg-slate-500/10 border-slate-500/30',
          description: language === 'id' ? 'Pengujian kepatuhan, uji pengguna, & peluncuran ke lingkungan produksi' : 'Acceptance testing, compliance check, & production rollout',
          date: activeProject?.target_end_date ? new Date(activeProject.target_end_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (language === 'id' ? 'Ditentukan kemudian' : 'TBD'),
          isDone: progressPct >= 100,
          isCurrent: false,
          isUpcoming: progressPct < 100,
        },
      ];

  const defaultDeliverables = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      title: language === 'id' ? 'Dokumen Kebutuhan Sistem & Arsitektur' : 'System Requirements & Architecture Document',
      description: language === 'id' ? 'Spesifikasi perangkat lunak yang disetujui, kamus data, dan kebijakan keamanan' : 'Approved software specifications, data dictionary, and security policy',
      date: activeProject?.start_date ? new Date(activeProject.start_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US') : (language === 'id' ? 'Awal' : 'Initial'),
      status: 'Approved',
      version: 'v1.0',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      title: language === 'id' ? 'Integrasi API & Endpoint Layanan' : 'API Integration & Service Endpoints',
      description: language === 'id' ? 'Middleware autentikasi, penghubung microservices, dan skema basis data' : 'Authentication middleware, microservices connector, and database schema',
      date: language === 'id' ? 'Putaran 2' : 'Sprint 2',
      status: progressPct >= 40 ? 'Approved' : 'Pending',
      version: 'v1.2',
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      title: language === 'id' ? 'Pengiriman Aplikasi & Build Staging' : 'Application Delivery & Staging Build',
      description: language === 'id' ? 'Antarmuka pengguna responsif, alur operasional utama, dan logika bisnis' : 'Responsive user interface, core operational flow, and business logic',
      date: language === 'id' ? 'Putaran 3' : 'Sprint 3',
      status: progressPct >= 80 ? 'Approved' : progressPct >= 40 ? 'Pending' : 'In Progress',
      version: 'v2.0-rc1',
    },
    {
      id: '00000000-0000-4000-8000-000000000004',
      title: language === 'id' ? 'Rilis Final & Serah Terima Produksi' : 'Final Release & Production Handover',
      description: language === 'id' ? 'Penerapan produksi, verifikasi audit keamanan, dan dokumentasi administrator' : 'Production deployment, security audit verification, and admin documentation',
      date: activeProject?.target_end_date ? new Date(activeProject.target_end_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US') : (language === 'id' ? 'Target Selesai' : 'Target End'),
      status: progressPct >= 100 ? 'Approved' : 'Planned',
      version: 'v2.0',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {language === 'id' ? 'Kokpit Klien' : 'Client Cockpit'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {language === 'id'
              ? 'Progres proyek, tahapan milestone, verifikasi berkas deliverable, dan pelacakan revisi.'
              : 'Project progress, milestones, verified deliverables, and revision tracking.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] w-full sm:w-auto max-w-full">
            <FolderKanban className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                if (e.target.value) setCurrentProjectId(e.target.value);
              }}
              className="px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] font-medium w-full sm:w-auto max-w-full sm:max-w-xs truncate"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} - {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex-1 sm:flex-initial"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Unggah Berkas' : 'Upload File'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/chat')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors flex-1 sm:flex-initial"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Chat Tim' : 'Project Chat'}</span>
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 truncate max-w-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="truncate">{language === 'id' ? 'Klien' : 'Client'}: {clientName}</span>
          </span>
        </div>
      </div>

      {/* Sub-tabs (Only visible for internal users, or hidden for client) */}
      {!isClient && <ProjectSubTabs activeTab="cockpit" />}

      {/* Flow 5.2: Pending Actions Banner */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-amber-300">
                {language === 'id'
                  ? `Tindakan Diperlukan: ${pendingApprovals.length} Berkas Membutuhkan Peninjauan Anda`
                  : `Action Required: ${pendingApprovals.length} Deliverable(s) Require Your Review`}
              </h3>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                {language === 'id'
                  ? 'Silakan tinjau berkas hasil kerja yang telah diselesaikan tim untuk melanjutkan ke tahapan berikutnya.'
                  : 'Please review deliverables submitted by the SDK team to proceed to the next milestone.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {pendingApprovals.slice(0, 1).map((appr) => (
              <div key={appr.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(appr)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{language === 'id' ? 'Setujui' : 'Approve'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenRevisionModal(appr)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold transition-colors"
                >
                  {language === 'id' ? 'Minta Revisi' : 'Request Revision'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 text-[var(--text-secondary)]">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-primary)]" />
          <span className="text-xs">
            {language === 'id' ? 'Memuat status proyek dari basis data...' : 'Loading project status from database...'}
          </span>
        </div>
      ) : (
        <>
          {/* Card 1: Executive Overview */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
                  {language === 'id' ? 'Ringkasan Eksekutif' : 'Executive Overview'}
                </span>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                  {projectTitle}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
                  {language === 'id' ? (
                    <>Selamat datang, <strong className="text-[var(--text-primary)]">{clientName}</strong>. Berikut adalah ringkasan progres verifikasi produk digital Anda secara transparan.</>
                  ) : (
                    <>Welcome, <strong className="text-[var(--text-primary)]">{clientName}</strong>. Here is the verified progress summary of your digital product delivery.</>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-3.5 py-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">
                    {language === 'id' ? 'Tahap Saat Ini' : 'Current Stage'}
                  </span>
                  <span className="font-semibold text-[var(--accent-primary)] flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                    {activeProject?.stage || 'ANALYSIS'}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">
                    {language === 'id' ? 'Tugas Selesai' : 'Completed Tasks'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] mt-0.5 block font-mono">
                    {completedTasks} / {totalTasks}
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] block uppercase font-semibold">
                    {language === 'id' ? 'Target Selesai' : 'Target Release'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] font-mono mt-0.5 block">
                    {activeProject?.target_end_date ? new Date(activeProject.target_end_date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (language === 'id' ? 'Ditentukan kemudian' : 'TBD')}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar with Milestone Ticks */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    {language === 'id' ? 'Progres Keseluruhan Proyek' : 'Overall Project Progress'}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] block">
                    {language === 'id'
                      ? 'Status real-time dihitung otomatis dari penyelesaian tugas dan pencapaian milestone'
                      : 'Real-time status calculated automatically from tasks and milestone completions'}
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-[var(--text-primary)] font-mono tracking-tight">
                  {progressPct}<span className="text-sm font-normal text-[var(--text-muted)]">%</span>
                </div>
              </div>

              <div className="w-full bg-[var(--bg-surface-subtle)] h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500" 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>

              <div className="grid grid-cols-4 text-[10px] font-medium text-[var(--text-muted)] pt-1">
                <span>0% {language === 'id' ? 'Inisiasi' : 'Inception'}</span>
                <span className="text-center">25% {language === 'id' ? 'Desain & Prototipe' : 'Design & Prototype'}</span>
                <span className="text-center">50% {language === 'id' ? 'Pengembangan Utama' : 'Core Build'}</span>
                <span className="text-right">100% {language === 'id' ? 'Peluncuran Produksi' : 'Production Release'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Project Milestones */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {language === 'id' ? 'Tahapan Pencapaian (Milestones)' : 'Project Milestones'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {language === 'id'
                    ? 'Titik pemeriksaan tahapan mulai dari inisiasi hingga serah terima akhir.'
                    : 'Milestone checkpoints from inception to final handover.'}
                </p>
              </div>
              <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-default)]">
                {displayedMilestones.length} {language === 'id' ? 'Pencapaian' : 'Milestones'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayedMilestones.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    m.isCurrent
                      ? 'bg-[var(--bg-surface-subtle)] border-[var(--accent-border)]'
                      : 'bg-[var(--bg-input)] border-[var(--border-default)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${m.isDone ? 'text-emerald-400' : m.isCurrent ? 'text-[var(--accent-primary)]' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px]">{m.step}</span>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-0.2 rounded-full border ${m.statusColor}`}>
                      {m.status}
                    </span>
                  </div>

                  <div className="text-xs text-[var(--text-secondary)] leading-snug line-clamp-2">
                    {m.description}
                  </div>

                  <div className="text-[11px] font-mono text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    {m.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Project Deliverables & Approval Matrix (Flow 5.2) */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-7 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {language === 'id' ? 'Hasil Kerja & Verifikasi Berkas' : 'Deliverables & File Verification'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {language === 'id'
                    ? `Arsip berkas serah terima dan persetujuan resmi oleh perwakilan ${clientName}.`
                    : `Verified deliverables repository and formal approvals by ${clientName}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold self-start sm:self-auto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Unggah Berkas Klien' : 'Upload Client File'}</span>
              </button>
            </div>

            <div className="space-y-3">
              {(approvals.length > 0 ? approvals : defaultDeliverables).map((item: any, idx) => {
                const isApproved = item.status === 'Approved';
                const isPending = item.status === 'Pending';
                const isRevision = item.status === 'Revision Requested';

                return (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-lg shrink-0 ${
                        isApproved ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        isPending ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[var(--text-primary)]">
                            {item.title}
                          </h4>
                          {item.version && (
                            <span className="text-[10px] font-mono bg-[var(--bg-surface)] px-1.5 py-0.2 rounded border border-[var(--border-default)] text-[var(--text-muted)]">
                              {item.version}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {item.description || item.reason || (language === 'id' ? 'Berkas hasil deliverable implementasi sistem.' : 'System implementation deliverable file.')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 sm:self-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isApproved ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                        isPending ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                        isRevision ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                        'text-slate-400 bg-slate-500/10 border-slate-500/30'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {item.status === 'Approved' ? (language === 'id' ? 'Disetujui' : 'Approved') :
                         item.status === 'Pending' ? (language === 'id' ? 'Menunggu Persetujuan' : 'Pending Approval') :
                         item.status === 'Revision Requested' ? (language === 'id' ? 'Revisi Diajukan' : 'Revision Requested') :
                         item.status}
                      </span>

                      {/* Action buttons if Pending */}
                      {isPending && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(item)}
                            className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-semibold"
                          >
                            {language === 'id' ? 'Setujui' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRevisionModal(item)}
                            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-semibold"
                          >
                            {language === 'id' ? 'Revisi' : 'Revision'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Client Uploaded Files Section */}
            <div className="pt-5 border-t border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[var(--accent-primary)]" />
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">
                    {language === 'id' ? 'Berkas Unggahan & Lampiran Klien' : 'Client Files & Shared Attachments'}
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  {clientFiles.length} {language === 'id' ? 'berkas' : 'files'}
                </span>
              </div>

              {clientFiles.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-[var(--border-default)] text-center text-xs text-[var(--text-muted)] space-y-2">
                  <p>{language === 'id' ? 'Belum ada berkas yang diunggah oleh klien untuk proyek ini.' : 'No files uploaded by client for this project yet.'}</p>
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-primary)] hover:underline font-semibold"
                  >
                    <Upload className="w-3 h-3" />
                    {language === 'id' ? 'Unggah berkas sekarang' : 'Upload a file now'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientFiles.map((file) => {
                    const downloadUrl = fileService.getFileDownloadUrl(file.storage_path);
                    return (
                      <div
                        key={file.id}
                        className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
                              <span>{file.category || (language === 'id' ? 'Umum' : 'General')}</span>
                              <span>•</span>
                              <span>{file.file_size ? `${(file.file_size / 1024).toFixed(1)} KB` : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-surface)] border border-[var(--border-default)] shrink-0 transition-colors"
                          title={language === 'id' ? 'Unduh Berkas' : 'Download File'}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Revision Workflow Tracker (Flow 5.2) */}
          {revisions.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    {language === 'id' ? 'Pelacak Siklus Revisi' : 'Revision Lifecycle Tracker'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {language === 'id'
                      ? 'Transparansi siklus penanganan: Diajukan → Ditinjau → Disetujui/Ditolak → Dikerjakan → Selesai'
                      : 'Transparent lifecycle: Requested → Reviewing → Approved/Rejected → In Progress → Completed'}
                  </p>
                </div>
                <span className="text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded">
                  {revisions.length} {language === 'id' ? 'Permintaan' : 'Requests'}
                </span>
              </div>

              <div className="space-y-3">
                {revisions.map((rev) => {
                  const stages = ['Requested', 'Reviewing', 'Approved', 'In Progress', 'Completed'];
                  const currentIndex = stages.indexOf(rev.status);

                  return (
                    <div
                      key={rev.id}
                      className="p-4 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-xs text-[var(--text-primary)]">
                            {rev.title}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {rev.description}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {language === 'id' ? 'Potensi Penundaan' : 'Potential Delay'}: +{rev.potential_delay_days || 2} {language === 'id' ? 'Hari' : 'Days'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {rev.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual Flow Stages */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)] text-[10px] overflow-x-auto">
                        {stages.map((stg, sIdx) => {
                          const isDone = sIdx <= currentIndex;
                          const isCur = sIdx === currentIndex;
                          const localizedStage = language === 'id' ? (
                            stg === 'Requested' ? 'Diajukan' :
                            stg === 'Reviewing' ? 'Ditinjau' :
                            stg === 'Approved' ? 'Disetujui' :
                            stg === 'In Progress' ? 'Dikerjakan' :
                            stg === 'Completed' ? 'Selesai' : stg
                          ) : stg;

                          return (
                            <React.Fragment key={stg}>
                              <div className={`px-2 py-1 rounded font-medium flex items-center gap-1 shrink-0 ${
                                isCur ? 'bg-[var(--accent-primary)] text-white font-bold' :
                                isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-default)]'
                              }`}>
                                {isDone && <CheckCircle2 className="w-2.5 h-2.5" />}
                                <span>{localizedStage}</span>
                              </div>
                              {sIdx < stages.length - 1 && (
                                <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3">
            <span>{language === 'id' ? 'Kokpit Klien SDK Hub • Tampilan terverifikasi untuk' : 'SDK Hub Client Cockpit • Verified view for'} {projectTitle}</span>
            <span>{language === 'id' ? 'Rahasia & Terlindungi' : 'Confidential'} • {clientName}</span>
          </div>
        </>
      )}

      {/* Client File Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {language === 'id' ? 'Unggah Berkas Proyek' : 'Upload Project File'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseUploadModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadClientFile} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {language === 'id' ? 'Pilih Berkas' : 'Select File'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFileObj(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs text-[var(--text-primary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--accent-primary)] file:text-white hover:file:bg-[var(--accent-hover)] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {language === 'id' ? 'Kategori Berkas' : 'File Category'}
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="Requirements">{language === 'id' ? 'Dokumen Kebutuhan & Spesifikasi' : 'Requirements & Specifications'}</option>
                  <option value="Design">{language === 'id' ? 'Desain & Aset Pendukung' : 'Design & Assets'}</option>
                  <option value="Deliverable">{language === 'id' ? 'Hasil Kerja & Deliverable' : 'Deliverables'}</option>
                  <option value="Review">{language === 'id' ? 'Catatan Masukan & Revisi' : 'Feedback & Review'}</option>
                  <option value="Contract">{language === 'id' ? 'Berita Acara & Legalitas' : 'Sign-Off & Contract'}</option>
                  <option value="Other">{language === 'id' ? 'Lainnya' : 'Other'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {language === 'id' ? 'Keterangan Tambahan (Opsional)' : 'Description (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={language === 'id' ? 'Tuliskan catatan singkat mengenai isi berkas...' : 'Add brief notes regarding this file...'}
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'id' ? 'Unggah Sekarang' : 'Upload Now'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Request Modal (Flow 5.2) */}
      {revisionModalApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {language === 'id' ? 'Pengajuan Revisi Hasil Kerja' : 'Deliverable Revision Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseRevisionModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="p-4 space-y-4">
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-300">
                {language === 'id'
                  ? 'Catatan: Mengajukan revisi akan mengubah status hasil kerja menjadi "Revisi Diajukan" dan mencatat potensi penundaan pada jadwal proyek.'
                  : 'Note: Requesting a revision will mark the deliverable as "Revision Requested" and register potential schedule impact.'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {language === 'id' ? 'Judul Perbaikan / Revisi' : 'Revision Title'}
                </label>
                <input
                  type="text"
                  required
                  value={revisionTitle}
                  onChange={(e) => setRevisionTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {language === 'id' ? 'Detail Bagian yang Perlu Direvisi' : 'Detailed Revision Feedback'} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder={language === 'id' ? 'Jelaskan secara spesifik poin apa saja yang belum sesuai ekspektasi...' : 'Specify in detail which aspects need improvement...'}
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  {language === 'id' ? 'Estimasi Dampak Terhadap Jadwal' : 'Estimated Schedule Impact'}
                </label>
                <select
                  value={revisionImpact}
                  onChange={(e: any) => setRevisionImpact(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="LOW">{language === 'id' ? 'Ringan (+1 Hari Kerja)' : 'Minor (+1 Business Day)'}</option>
                  <option value="MODERATE">{language === 'id' ? 'Sedang (+2 Hari Kerja)' : 'Moderate (+2 Business Days)'}</option>
                  <option value="MAJOR">{language === 'id' ? 'Signifikan (+5 Hari Kerja)' : 'Major (+5 Business Days)'}</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleCloseRevisionModal}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
                >
                  {language === 'id' ? 'Batal' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDecision}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmittingDecision && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'id' ? 'Kirim Permintaan Revisi' : 'Submit Revision Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
