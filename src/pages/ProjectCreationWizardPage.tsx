import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, UploadCloud, FileText, Plus,
  Building2, ArrowLeft, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { projectService } from '../services/projectService';
import { clientService } from '../services/clientService';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { DeliveryModel, Client } from '../types';
import { AddClientModal } from '../components/common/AddClientModal';

export const ProjectCreationWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentProfile, role } = useAuth();
  const { refreshProjects } = useProject();

  const [projectName, setProjectName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const [deliveryModel, setDeliveryModel] = useState<DeliveryModel>('Custom');
  const [projectTemplate, setProjectTemplate] = useState('Blank Project');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients from Supabase on mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        setIsLoadingClients(true);
        const list = await clientService.getClients();
        setClients(list);
        if (list.length > 0 && !clientId) {
          setClientId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load clients:', err);
      } finally {
        setIsLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  const handleClientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsAddClientModalOpen(true);
    } else {
      setClientId(val);
    }
  };

  const handleClientCreated = (newClient: Client) => {
    setClients((prev) => [newClient, ...prev]);
    setClientId(newClient.id);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!clientId) {
      toast.error('Silakan pilih client untuk proyek ini');
      return;
    }

    try {
      setIsSubmitting(true);
      await projectService.createProject(
        {
          title: projectName.trim(),
          client_id: clientId,
          description: description.trim() || undefined,
          delivery_model: deliveryModel,
          template_type: projectTemplate,
          start_date: startDate,
          target_end_date: endDate || undefined,
          lead_id: currentProfile?.id,
        },
        role
      );

      await refreshProjects();
      toast.success('Proyek baru berhasil dibuat di database!');
      setProjectName('');
      setDescription('');
      setEndDate('');
      setUploadedFiles([]);
      setDeliveryModel('Custom');
      setProjectTemplate('Blank Project');
      navigate('/projects');
    } catch (err: any) {
      console.error('Error creating project:', err);
      toast.error(err.message || 'Gagal membuat proyek baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Inline Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientCreated={handleClientCreated}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Projects</span>
          </button>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            Create New Project
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Konfigurasikan detail inisialisasi proyek dan integrasikan langsung dengan database.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 space-y-6"
      >
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Project Information
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Tentukan identitas proyek, organisasi client, dan parameter operasional.
          </p>
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-6 space-y-5">
          {/* Row 1: Project Name & Client Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Project Name <span className="text-[var(--accent-primary)]">*</span>
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Sistem Informasi Rekam Medis"
                className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Client <span className="text-[var(--accent-primary)]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="text-[11px] text-[var(--accent-primary)] hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add New Client</span>
                </button>
              </div>

              <div className="relative">
                <select
                  required
                  value={clientId}
                  onChange={handleClientSelectChange}
                  disabled={isLoadingClients}
                  className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                >
                  <option value="" disabled>
                    {isLoadingClients ? 'Memuat data client...' : 'Pilih Client...'}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company && c.company !== c.name ? `(${c.company})` : ''}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-[var(--accent-primary)]">
                    ➕ + Add New Client...
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Delivery Model & Project Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Delivery Model
              </label>
              <select
                value={deliveryModel}
                onChange={(e) => setDeliveryModel(e.target.value as DeliveryModel)}
                className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="Custom">Custom Application</option>
                <option value="Consulting">Consulting / Architecture</option>
                <option value="Subscription">Managed Services / Subscription</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Project Template
              </label>
              <select
                value={projectTemplate}
                onChange={(e) => setProjectTemplate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="Blank Project">Blank Project (Mulai dari Nol - 0 Task)</option>
                <option value="Healthcare System">Healthcare System</option>
                <option value="Social Analysis">Social Analysis & Big Data</option>
                <option value="Digital Public Service">Digital Public Service</option>
                <option value="Custom Application">Standard Enterprise Application</option>
                <option value="API Integration">API Integration & Gateway</option>
              </select>
            </div>
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Target End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-primary)]">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ruang lingkup, arsitektur teknis, dan target capaian proyek..."
              className="w-full px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors resize-none"
            />
          </div>

          {/* Upload Documents Zone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-primary)]">
              Project Attachments / Specs
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('project-files-input')?.click()}
              className="border-2 border-dashed border-[var(--border-default)] hover:border-[var(--accent-primary)] rounded-xl p-6 text-center cursor-pointer transition-colors bg-[var(--bg-surface-subtle)]"
            >
              <input
                id="project-files-input"
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-[var(--accent-primary)] mx-auto mb-2" />
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                Drag and drop files here, or browse
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Supports PDF, DOCX, XLSX, Figma files up to 50MB
              </p>
            </div>

            {/* Uploaded Files Pills */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-xs text-[var(--text-primary)]"
                  >
                    <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                    <span className="truncate max-w-[160px]">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[var(--border-subtle)] pt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            disabled={isSubmitting}
            className="px-4 py-2 border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat Proyek...</span>
              </>
            ) : (
              <span>Create Project</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
