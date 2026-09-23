import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileCode2, HeartPulse, LineChart, Landmark, Layers, Network, 
  Plus, CheckCircle2, ArrowRight, Eye, Copy, Sparkles 
} from 'lucide-react';
import { TEMPLATE_STARTER_TASKS } from '../services/projectService';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'sonner';

interface TemplateItem {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  tasks: Array<{ title: string; description: string; priority: string; estimated_hours: number }>;
}

const TEMPLATES_LIST: TemplateItem[] = [
  {
    id: 'Healthcare System',
    title: 'Healthcare System',
    category: 'Sistem Informasi Kesehatan',
    icon: HeartPulse,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    description: 'Workflow standar implementasi SIMRS, integrasi BPJS VClaim/Antrean, bridging SatuSehat Kemenkes FHIR R4, dan E-Klaim.',
    tasks: TEMPLATE_STARTER_TASKS['Healthcare System'] || [],
  },
  {
    id: 'Social Analysis',
    title: 'Social Analysis',
    category: 'Big Data & AI',
    icon: LineChart,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    description: 'Pipeline scraping media sosial, ingestion Elasticsearch, analisis sentimen IndoBERT NLP, dan dashboard analitik interaktif.',
    tasks: TEMPLATE_STARTER_TASKS['Social Analysis'] || [],
  },
  {
    id: 'Digital Public Service',
    title: 'Digital Public Service',
    category: 'Smart City & Pemerintahan',
    icon: Landmark,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    description: 'Portal layanan publik SPBE Kemenpan-RB, bridging Identitas Kependudukan Digital, pengaduan warga, dan TTE BSrE sertifikat elektronik.',
    tasks: TEMPLATE_STARTER_TASKS['Digital Public Service'] || [],
  },
  {
    id: 'Custom Application',
    title: 'Custom Application',
    category: 'Enterprise App',
    icon: Layers,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    description: 'Arsitektur aplikasi enterprise fullstack, modul autentikasi RBAC, workflow persetujuan berjenjang, dan reporting otomatis.',
    tasks: [
      { title: 'Penyusunan Software Requirement Specification (SRS)', description: 'Dokumentasi detail use case, entity relationship, dan non-functional requirements.', priority: 'HIGH', estimated_hours: 16 },
      { title: 'Setup Repositori CI/CD & Security Scanning', description: 'Automasi pipeline build Docker, SonarQube quality gate, dan automated unit tests.', priority: 'MEDIUM', estimated_hours: 12 },
      { title: 'Pengembangan Database Schema & Migration Script', description: 'Skema PostgreSQL dengan index optimization dan trigger history audit trail.', priority: 'HIGH', estimated_hours: 20 },
      { title: 'Implementasi Core Business Logic & User Acceptance Test', description: 'Pengembangan backend API endpoint dan sesi UAT bertahap bersama pengguna.', priority: 'CRITICAL', estimated_hours: 40 },
    ],
  },
  {
    id: 'API Integration',
    title: 'API Integration',
    category: 'System Bridging',
    icon: Network,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    description: 'Integrasi third-party API, webhook dispatcher, payment gateway, sync data otomatis, serta penanganan rate-limiting.',
    tasks: [
      { title: 'Analisis Spesifikasi API Partner & Autentikasi OAuth2', description: 'Review format request payload, signature token, dan TLS certificate validation.', priority: 'HIGH', estimated_hours: 12 },
      { title: 'Pembuatan Middleware Message Queue & Retry Logic', description: 'Arsitektur async queue dengan exponential backoff retry untuk mitigasi downtime pihak ketiga.', priority: 'CRITICAL', estimated_hours: 24 },
      { title: 'Pengujian End-to-End Sandbox Transaction Flow', description: 'Simulasi webhook event trigger dan sinkronisasi saldo/status ke sistem internal.', priority: 'HIGH', estimated_hours: 16 },
    ],
  },
  {
    id: 'Blank Workflow',
    title: 'Blank Workflow',
    category: 'Custom Scratch',
    icon: FileCode2,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    description: 'Mulai dari kanvas kosong tanpa starter task bawaan. Cocok untuk proyek eksperimental, riset, atau eksplorasi R&D bebas.',
    tasks: [],
  },
];

export const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isId = language === 'id';
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);

  const handleUseTemplate = (templateTitle: string) => {
    navigate(`/projects/new?template=${encodeURIComponent(templateTitle)}`);
  };

  const handleDuplicate = (template: TemplateItem) => {
    toast.success(isId ? `Template "${template.title}" berhasil diduplikasi untuk modifikasi kustom.` : `Template "${template.title}" duplicated for custom editing.`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Manajemen Workflow Templates' : 'Workflow Templates'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-3 h-3" />
              {isId ? '6 Preset Standar SDK' : '6 SDK Standard Presets'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId 
              ? 'Gunakan template workflow teruji untuk mempercepat inisiasi proyek dan memastikan standar arsitektur terpenuhi.' 
              : 'Use proven workflow templates to accelerate project initiation and ensure architecture standards.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleUseTemplate('Blank Workflow')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isId ? 'Buat Proyek dengan Template' : 'Create Project with Template'}</span>
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TEMPLATES_LIST.map((template) => {
          const Icon = template.icon;
          const totalHours = template.tasks.reduce((acc, t) => acc + (t.estimated_hours || 0), 0);

          return (
            <div
              key={template.id}
              className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 flex flex-col justify-between hover:border-[var(--border-light)] transition-all shadow-xs group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl border ${template.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border border-[var(--border-default)]">
                    {template.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed line-clamp-3">
                    {template.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <div>
                    <strong className="text-[var(--text-primary)] font-mono">{template.tasks.length}</strong> {isId ? 'tugas awal' : 'starter tasks'}
                  </div>
                  <span>•</span>
                  <div>
                    <strong className="text-[var(--text-primary)] font-mono">{totalHours}</strong> {isId ? 'jam estimasi' : 'estimated hours'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-5 mt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isId ? 'Pratinjau Tugas' : 'Preview Tasks'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(template.title)}
                  className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors"
                  title={isId ? 'Gunakan template untuk proyek baru' : 'Use template for new project'}
                >
                  <span>{isId ? 'Pakai' : 'Use'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg border ${selectedTemplate.color}`}>
                  <selectedTemplate.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    {isId ? `Detail Tugas Awal: ${selectedTemplate.title}` : `Starter Tasks Detail: ${selectedTemplate.title}`}
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {isId 
                      ? `${selectedTemplate.tasks.length} tugas otomatis yang akan dibuat ke Backlog` 
                      : `${selectedTemplate.tasks.length} automated tasks to be generated into Backlog`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                &times;
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {selectedTemplate.tasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  {isId 
                    ? 'Template ini adalah alur kerja kosong (Blank). Tugas dapat ditambahkan secara manual di Kanban.' 
                    : 'This template is a blank workflow. Tasks can be added manually on Kanban.'}
                </div>
              ) : (
                selectedTemplate.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-xs text-[var(--text-primary)]">
                        {idx + 1}. {task.title}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          task.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          task.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {task.priority}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-default)]">
                          {task.estimated_hours}h
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {task.description}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-[var(--border-default)] bg-[var(--bg-surface-subtle)]">
              <button
                type="button"
                onClick={() => handleDuplicate(selectedTemplate)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isId ? 'Duplikasi Preset' : 'Duplicate Preset'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
                >
                  {isId ? 'Tutup' : 'Close'}
                </button>
                <button
                  type="button"
                  onClick={() => handleUseTemplate(selectedTemplate.title)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isId ? 'Gunakan Template Ini' : 'Use This Template'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
