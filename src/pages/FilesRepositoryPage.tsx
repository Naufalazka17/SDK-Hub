import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderArchive, Upload, Download, FileText, Lock, 
  Search, HardDrive, Trash2, AlertTriangle, Loader2,
  Zap, Layers
} from 'lucide-react';
import { List } from 'react-window';
import { toast } from 'sonner';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { fileService } from '../services/fileService';
import { FileItem } from '../types';
import { ProjectSubTabs } from '../components/common/ProjectSubTabs';
import { can } from '../lib/permissions';
import { useLanguage } from '../contexts/LanguageContext';

const VIRTUALIZATION_THRESHOLD = 50;

export const FilesRepositoryPage: React.FC = () => {
  const { currentProject } = useProject();
  const { currentProfile, role } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';
  const canDeleteFiles = can(role, 'file:delete');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('deliverables');
  const [searchQuery, setSearchQuery] = useState('');
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [simulate1000Files, setSimulate1000Files] = useState(false);

  const categories = [
    { id: 'all', label: isId ? 'Semua Berkas' : 'All Artifacts' },
    { id: 'deliverables', label: isId ? 'Deliverables & Rilis' : 'Deliverables & Releases' },
    { id: 'requirements', label: isId ? 'SRS & Arsitektur' : 'SRS & Architecture' },
    { id: 'design', label: isId ? 'Desain & Prototipe' : 'UI/UX Prototypes' },
    { id: 'development', label: isId ? 'Spesifikasi Kode & API' : 'Source & API Specs' },
    { id: 'testing', label: isId ? 'Pengujian SIT & Keamanan' : 'SIT & Security Audits' },
    { id: 'reports', label: isId ? 'Laporan Eksekutif' : 'Executive Reports' },
  ];

  const loadFiles = async () => {
    try {
      const data = await fileService.getFiles(currentProject?.id, selectedCategory);
      setFiles(data);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentProject, selectedCategory]);

  // Generate 1,200 simulated files to verify virtualization scalability (> 1.000 documents)
  const simulatedFiles: FileItem[] = useMemo(() => {
    if (!simulate1000Files) return [];
    const catKeys = ['deliverables', 'requirements', 'design', 'development', 'testing', 'reports'];
    const extensions = ['pdf', 'docx', 'xlsx', 'zip', 'fig', 'ts', 'sql', 'drawio'];
    const titles = [
      'SRS-Architecture-Blueprint', 'Security-Penetration-Audit', 'Database-Schema-Migration',
      'API-Gateway-OpenAPI-Spec', 'User-Flow-Figma-Design', 'SIT-Test-Matrix-Report',
      'Executive-Summary-Sprint', 'Deployment-Kubernetes-Manifest', 'Disaster-Recovery-Plan',
      'Data-Privacy-Compliance-Check'
    ];
    return Array.from({ length: 1200 }, (_, i) => {
      const cat = catKeys[i % catKeys.length];
      const ext = extensions[i % extensions.length];
      const title = titles[i % titles.length];
      return {
        id: `virtual-file-${i + 1}`,
        project_id: currentProject?.id || 'demo-proj',
        name: `SDK-${title}-${String(i + 1).padStart(4, '0')}.${ext}`,
        storage_path: `mock/files/${title}-${i + 1}.${ext}`,
        category: cat,
        mime_type: ext === 'pdf' ? 'application/pdf' : 'application/octet-stream',
        file_size: 1024 * 1024 * (0.8 + (i % 30) * 0.35),
        is_confidential: i % 7 === 0,
        version: 1 + (i % 4),
        uploaded_by: currentProfile?.id || 'sys-admin',
        created_at: new Date(Date.now() - i * 7200 * 1000).toISOString(),
      };
    });
  }, [simulate1000Files, currentProject?.id, currentProfile?.id]);

  const activeFileList = simulate1000Files ? simulatedFiles : files;

  const filteredFiles = useMemo(() => {
    return activeFileList.filter((f) => {
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeFileList, selectedCategory, searchQuery]);

  const isVirtualized = filteredFiles.length >= VIRTUALIZATION_THRESHOLD;

  const renderFileRow = (file: FileItem, style?: React.CSSProperties) => {
    const downloadUrl = fileService.getFileDownloadUrl(file.storage_path);
    const fileSizeMB = file.file_size ? (file.file_size / (1024 * 1024)).toFixed(2) : '1.2';

    return (
      <div 
        key={file.id} 
        style={style}
        className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-surface-hover)] transition-colors group border-b border-[var(--border-subtle)] box-border"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] flex items-center justify-center shrink-0 border border-[var(--accent-border)]">
            <FileText className="w-5 h-5" />
          </div>
          <div className="truncate flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)] truncate">{file.name}</span>
              {file.is_confidential && (
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/30 shrink-0">
                  <Lock className="w-2.5 h-2.5" /> {isId ? 'Rahasia' : 'Confidential'}
                </span>
              )}
              <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] px-1.5 py-0.2 rounded border border-[var(--border-default)] shrink-0">
                v{file.version || 1}.0
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
              {isId ? 'Kategori:' : 'Category:'} <span className="font-semibold text-[var(--text-primary)]">{file.category}</span> • {fileSizeMB} MB • {isId ? 'Diunggah' : 'Uploaded'} {new Date(file.created_at || '').toLocaleDateString(isId ? 'id-ID' : 'en-US')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 transition-colors shadow-xs"
            title={isId ? 'Unduh berkas' : 'Download file'}
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            <span className="hidden sm:inline">{isId ? 'Unduh' : 'Download'}</span>
          </a>

          {/* Delete button - Hidden for STAFF & CLIENT, only visible to ADMIN & PROJECT_LEAD */}
          {canDeleteFiles && (
            <button
              onClick={() => setFileToDelete(file)}
              className="px-2.5 py-1.5 rounded-lg border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-xs font-medium flex items-center gap-1 transition-colors"
              title={isId ? 'Hapus berkas' : 'Delete file'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isId ? 'Hapus' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject || !currentProfile) return;

    try {
      setIsUploading(true);
      await fileService.uploadFile({
        file,
        projectId: currentProject.id,
        category: uploadCategory,
        uploadedBy: currentProfile.id,
        isConfidential: uploadCategory === 'contract',
      });

      toast.success(`File "${file.name}" uploaded successfully.`);
      loadFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Upload failed. Please check storage bucket permissions.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      setIsDeleting(true);
      await fileService.deleteFile(fileToDelete.id, fileToDelete.storage_path);
      toast.success(`File "${fileToDelete.name}" deleted successfully.`);
      setFileToDelete(null);
      loadFiles();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete file. Please check permissions.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
            {isId ? 'Berkas & Deliverables' : 'Files & Deliverables'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {currentProject ? currentProject.title : 'SISINFO'} • {isId ? 'Repositori aset dan berkas proyek terpusat' : 'Centralized immutable asset repository'}
          </p>
        </div>

        {/* Upload Button - only if not CLIENT */}
        {role !== 'CLIENT' && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-input)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              {categories.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            
            <label className="px-3.5 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? (isId ? 'Mengunggah...' : 'Uploading...') : (isId ? 'Unggah Berkas' : 'Upload File')}</span>
              <input
                type="file"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <ProjectSubTabs activeTab="files" />

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] font-bold shadow-xs'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Files Grid / List Card */}
      <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-default)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isId ? 'Cari nama berkas...' : 'Search file name...'}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-input)] rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-primary)]"
              />
            </div>

            {/* Stress Test Simulation Toggle for 1000+ files */}
            <button
              type="button"
              onClick={() => setSimulate1000Files((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                simulate1000Files
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-default)]'
              }`}
              title={isId ? 'Uji performa virtualisasi dengan 1.200 dokumen' : 'Test react-window virtualization with 1,200 documents'}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{simulate1000Files ? (isId ? 'Simulasi 1.200 Berkas (ON)' : 'Simulate 1.2k Files (ON)') : (isId ? 'Tes 1.200 Berkas' : 'Test 1.2k Files')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isVirtualized && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Virtual List (react-window)</span>
              </span>
            )}
            <span className="text-[11px] text-[var(--text-secondary)] font-mono bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
              {isId ? `Total: ${filteredFiles.length.toLocaleString()} berkas` : `Total: ${filteredFiles.length.toLocaleString()} files`}
            </span>
          </div>
        </div>

        <div>
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
              <HardDrive className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
              <div>{isId ? `Tidak ada berkas di kategori "${categories.find(c => c.id === selectedCategory)?.label || selectedCategory}"` : `No files found in category "${selectedCategory}"`}</div>
            </div>
          ) : isVirtualized ? (
            /* Virtualized rendering via react-window for high document volumes (>50 up to 1000+ files) */
            <div className="w-full">
              <List<any>
                rowCount={filteredFiles.length}
                rowHeight={76}
                rowProps={{}}
                style={{ height: Math.min(filteredFiles.length * 76, 560), width: '100%' }}
                rowComponent={(props: any) =>
                  renderFileRow(filteredFiles[props.index], props.style)
                }
              />
            </div>
          ) : (
            /* Standard DOM rendering for typical small project lists */
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredFiles.map((file) => renderFileRow(file))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  {isId ? 'Hapus Berkas?' : 'Delete File?'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {isId 
                    ? `Apakah Anda yakin ingin menghapus "${fileToDelete.name}"? Tindakan ini akan menghapus berkas secara permanen dari penyimpanan dan basis data.`
                    : `Are you sure you want to delete "${fileToDelete.name}"? This will permanently remove the file from storage and database records.`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg transition-colors"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteFile}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isId ? 'Menghapus...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isId ? 'Konfirmasi Hapus' : 'Confirm Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
