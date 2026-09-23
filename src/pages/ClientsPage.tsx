import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Mail, Phone, MapPin, ExternalLink, 
  Send, Trash2, Edit2, Search, CheckCircle2, AlertCircle, Copy, Loader2, Users, Key, ShieldCheck
} from 'lucide-react';
import { clientService, CreateClientInput } from '../services/clientService';
import { userService } from '../services/userService';
import { credentialService } from '../services/credentialService';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Client } from '../types';
import { toast } from 'sonner';

export const ClientsPage: React.FC = () => {
  const { role } = useAuth();
  const { projects } = useProject();
  const { language } = useLanguage();
  const isId = language === 'id';
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [invitingClient, setInvitingClient] = useState<Client | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-created client credentials modal state
  const [createdCredentials, setCreatedCredentials] = useState<{
    clientName: string;
    picName: string;
    email: string;
    password: string;
    phone: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateClientInput>({
    name: '',
    company: '',
    pic_name: '',
    pic_email: '',
    pic_phone: '',
    address: '',
  });

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const data = await clientService.getClients();
      setClients(data);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      toast.error('Gagal memuat data klien');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      company: '',
      pic_name: '',
      pic_email: '',
      pic_phone: '',
      address: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company || client.name,
      pic_name: client.pic_name || '',
      pic_email: client.pic_email,
      pic_phone: client.pic_phone || '',
      address: '',
    });
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      company: '',
      pic_name: '',
      pic_email: '',
      pic_phone: '',
      address: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.pic_email.trim()) {
      toast.error('Nama organisasi dan email PIC wajib diisi');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingClient) {
        await clientService.updateClient(editingClient.id, {
          name: formData.name,
          company: formData.company || formData.name,
          pic_name: formData.pic_name,
          pic_email: formData.pic_email,
          pic_phone: formData.pic_phone,
        });
        toast.success(`Data klien ${formData.name} berhasil diperbarui`);
        handleCloseModal();
      } else {
        const newClient = await clientService.createClient(formData, role);

        // Generate 6-digit random numeric password
        const randomPassword = String(Math.floor(100000 + Math.random() * 900000));
        let createdUserId = newClient.id;

        try {
          const userProfile = await userService.createUser({
            full_name: formData.pic_name?.trim() || formData.name.trim(),
            email: formData.pic_email.trim().toLowerCase(),
            role_id: 'CLIENT',
            department: formData.company?.trim() || formData.name.trim(),
            position: 'Client PIC / Representative',
            phone: formData.pic_phone?.trim() || undefined,
            client_id: newClient.id,
          }, role);
          createdUserId = userProfile.id;
        } catch (userErr: any) {
          console.warn('Auto profile creation note:', userErr);
        }

        // Save password into credential service
        credentialService.setUserPassword(createdUserId, formData.pic_email.trim().toLowerCase(), randomPassword);

        // Open modal showing generated credentials
        setCreatedCredentials({
          clientName: formData.name,
          picName: formData.pic_name || formData.name,
          email: formData.pic_email.trim().toLowerCase(),
          password: randomPassword,
          phone: formData.pic_phone?.trim() || '-',
        });

        toast.success(`Klien "${formData.name}" & Akun Portal otomatis dibuat!`);
        handleCloseModal();
      }
      loadClients();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan klien');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (client: Client) => {
    const projectCount = projects.filter((p) => p.client_id === client.id).length;
    if (projectCount > 0) {
      toast.error(`Tidak dapat menghapus klien: Ada ${projectCount} proyek aktif yang terikat.`);
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus klien "${client.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await clientService.deleteClient(client.id);
      toast.success(`Klien "${client.name}" berhasil dihapus`);
      loadClients();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus klien');
    }
  };

  const handleSendInvite = async (client: Client) => {
    try {
      setIsSendingInvite(true);
      setInvitingClient(client);
      const res = await clientService.sendInvitation(client.id, client.pic_email, client.pic_name);
      setInviteUrl(res.inviteUrl);
      toast.success(`Undangan berhasil disimulasikan ke ${client.pic_email}`);
    } catch (err: any) {
      toast.error('Gagal mengirim undangan');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link undangan disalin ke clipboard!');
  };

  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      c.pic_email.toLowerCase().includes(q) ||
      (c.pic_name && c.pic_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isId ? 'Manajemen Klien & Organisasi' : 'Client & Organization Management'}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)]">
              {isId ? `${clients.length} Mitra` : `${clients.length} ${clients.length === 1 ? 'Partner' : 'Partners'}`}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {isId ? 'Daftar seluruh klien organisasi mitra SDK, Person In Charge (PIC), dan akses Client Cockpit.' : 'Directory of all SDK partner client organizations, Person In Charge (PIC), and Client Cockpit access.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isId ? 'Tambah Klien Baru' : 'Add New Client'}</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isId ? 'Cari nama klien, PIC, atau email...' : 'Search client name, PIC, or email...'}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
      </div>

      {/* Mobile Client Cards (< md) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
            <span>{isId ? 'Memuat data klien...' : 'Loading clients data...'}</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-[var(--text-primary)]">{isId ? 'Tidak ada klien ditemukan' : 'No clients found'}</p>
            <p className="text-[11px] mt-1">{isId ? 'Coba sesuaikan kata kunci pencarian atau daftarkan klien baru.' : 'Try adjusting search keywords or register a new client.'}</p>
          </div>
        ) : (
          filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => p.client_id === client.id);

            return (
              <div
                key={client.id}
                className="p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center font-bold text-sm text-[var(--accent-primary)] shrink-0">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">
                        {client.name}
                      </h3>
                      {client.company && client.company !== client.name && (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {client.company}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]">
                    {clientProjects.length} {isId ? 'Proyek' : 'Projects'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">{client.pic_name || '—'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {isId ? 'PIC Resmi' : 'Official PIC'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] font-mono truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span className="truncate">{client.pic_email}</span>
                  </div>
                  {client.pic_phone && (
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px] font-mono">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{client.pic_phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => handleSendInvite(client)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)] text-xs text-[var(--text-secondary)] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isId ? 'Undang' : 'Invite'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(client)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-secondary)] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(client)}
                    className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title={isId ? 'Hapus' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Table of Clients (Desktop >= md) */}
      <div className="hidden md:block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto touch-pan-x no-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[650px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">{isId ? 'Organisasi / Klien' : 'Organization / Client'}</th>
                <th className="py-3 px-4">{isId ? 'Person In Charge (PIC)' : 'Person In Charge (PIC)'}</th>
                <th className="py-3 px-4">{isId ? 'Kontak & Email' : 'Contact & Email'}</th>
                <th className="py-3 px-4 text-center">{isId ? 'Proyek Terkait' : 'Related Projects'}</th>
                <th className="py-3 px-4 text-right">{isId ? 'Aksi' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[var(--accent-primary)]" />
                    <span>{isId ? 'Memuat data klien...' : 'Loading clients data...'}</span>
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-[var(--text-primary)]">{isId ? 'Tidak ada klien ditemukan' : 'No clients found'}</p>
                    <p className="text-[11px] mt-1">{isId ? 'Coba sesuaikan kata kunci pencarian atau daftarkan klien baru.' : 'Try adjusting search keywords or register a new client.'}</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientProjects = projects.filter((p) => p.client_id === client.id);

                  return (
                    <tr key={client.id} className="hover:bg-[var(--bg-surface-subtle)] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center font-bold text-sm text-[var(--accent-primary)] shrink-0">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-primary)] text-sm">
                              {client.name}
                            </div>
                            {client.company && client.company !== client.name && (
                              <div className="text-[11px] text-[var(--text-muted)]">
                                {client.company}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--text-primary)]">
                          {client.pic_name || '—'}
                        </div>
                        <span className="inline-block px-1.5 py-0.5 mt-1 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {isId ? 'PIC Resmi' : 'Official PIC'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                          <span className="font-mono text-[11px]">{client.pic_email}</span>
                        </div>
                        {client.pic_phone && (
                          <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                            <span className="font-mono text-[11px]">{client.pic_phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]">
                          {isId ? `${clientProjects.length} Proyek` : `${clientProjects.length} ${clientProjects.length === 1 ? 'Project' : 'Projects'}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendInvite(client)}
                            title={isId ? 'Kirim Undangan Aktivasi Cockpit ke PIC' : 'Send Cockpit Activation Invite to PIC'}
                            className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-border)] text-[var(--text-secondary)] transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(client)}
                            title={isId ? 'Edit Data Klien' : 'Edit Client Data'}
                            className="p-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(client)}
                            title={isId ? 'Hapus Klien' : 'Delete Client'}
                            className="p-1.5 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/40 transition-colors"
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

      {/* Add/Edit Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  {editingClient ? 'Edit Data Klien Organisasi' : 'Tambah Klien Organisasi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Nama Klien / Organisasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="misal: RS Hermina, Diskominfo"
                    className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Entitas Perusahaan / PT
                  </label>
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="misal: PT Medika Sejahtera"
                    className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Nama PIC Resmi
                  </label>
                  <input
                    type="text"
                    value={formData.pic_name || ''}
                    onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                    placeholder="misal: dr. Budi Santoso"
                    className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Email PIC Resmi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.pic_email}
                    onChange={(e) => setFormData({ ...formData, pic_email: e.target.value })}
                    placeholder="pic@instansi.go.id"
                    className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Nomor WhatsApp / HP PIC
                </label>
                <input
                  type="text"
                  value={formData.pic_phone || ''}
                  onChange={(e) => setFormData({ ...formData, pic_phone: e.target.value })}
                  placeholder="+62 812-xxxx-xxxx"
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Alamat Kantor / Domisili
                </label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Gedung Cyber 2, Lt. 12, Jakarta Selatan..."
                  className="w-full px-3 py-2 bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-default)]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingClient ? 'Simpan Perubahan' : 'Daftarkan Klien'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {invitingClient && inviteUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-md shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Undangan Berhasil Disimulasikan!
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Link aktivasi login Client Cockpit untuk <strong>{invitingClient.name}</strong>
                </p>
              </div>
            </div>

            <div className="bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-lg p-3 space-y-2">
              <div className="text-[11px] text-[var(--text-secondary)]">
                Dikirim ke: <strong className="text-[var(--text-primary)]">{invitingClient.pic_email}</strong> ({invitingClient.pic_name || 'PIC'})
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full px-2.5 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded text-[11px] font-mono text-[var(--text-primary)] truncate"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(inviteUrl)}
                  className="px-2.5 py-1.5 rounded bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[var(--text-muted)]">
              Klien dapat menggunakan link ini untuk langsung menetapkan password dan masuk ke <strong>Client Cockpit</strong> untuk memantau status proyek dan menyetujui deliverables.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setInvitingClient(null);
                  setInviteUrl(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Generated Client Account Credentials Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-[var(--text-primary)] tracking-tight">
                    {isId ? 'Akun Portal Klien Berhasil Dibuat Otomatis!' : 'Client Portal Account Created Automatically!'}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isId
                    ? 'Pengguna baru dengan role CLIENT dan kata sandi 6 digit acak telah aktif di sistem.'
                    : 'A new CLIENT user with a 6-digit random password is now active in the system.'}
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    {isId ? 'Organisasi / Perusahaan' : 'Organization'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {createdCredentials.clientName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    {isId ? 'Nama PIC' : 'PIC Name'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {createdCredentials.picName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    {isId ? 'Nomor Kontak / HP' : 'Contact Phone'}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {createdCredentials.phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Role & Akses
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    CLIENT (Client Cockpit)
                  </span>
                </div>
              </div>

              {/* Monospace Credentials Box */}
              <div className="mt-2 pt-3 border-t border-[var(--border-default)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    {isId ? 'Username / Email Login:' : 'Login Username / Email:'}
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-surface)] px-2.5 py-1 rounded border border-[var(--border-default)]">
                    {createdCredentials.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#F58320]" />
                    {isId ? 'Kata Sandi (6 Digit Acak):' : 'Password (6 Random Digits):'}
                  </span>
                  <span className="font-mono text-base font-extrabold tracking-widest text-[#F58320] bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-lg">
                    {createdCredentials.password}
                  </span>
                </div>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)]/60 p-3 rounded-lg border border-[var(--border-default)]">
              <AlertCircle className="w-4 h-4 text-[#F58320] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                {isId
                  ? 'Klien dapat langsung masuk di halaman Login menggunakan email dan kata sandi di atas. Setelah login, klien akan langsung diarahkan ke Client Cockpit.'
                  : 'The client can directly log in at the Login page using the email and password above. Upon login, they will be routed to the Client Cockpit.'}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const info = `*Kredensial Akses Client SDK Hub*\nOrganisasi: ${createdCredentials.clientName}\nPIC: ${createdCredentials.picName}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}\nPortal Login: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(info);
                  toast.success(isId ? 'Kredensial klien berhasil disalin ke clipboard!' : 'Client credentials copied to clipboard!');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent-primary)] border border-[var(--accent-border)] hover:bg-[var(--accent-subtle)]/80 text-xs font-bold transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{isId ? 'Salin Kredensial Lengkap' : 'Copy Full Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold transition-colors shadow-xs"
              >
                {isId ? 'Selesai' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
