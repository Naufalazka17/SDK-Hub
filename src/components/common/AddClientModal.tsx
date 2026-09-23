import React, { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { clientService } from '../../services/clientService';
import { Client } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: Client) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { role } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [picName, setPicName] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setCompany('');
    setPicName('');
    setPicEmail('');
    setPicPhone('');
    setAddress('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(isId ? 'Nama klien wajib diisi' : 'Client name is required');
      return;
    }
    if (!picEmail.trim()) {
      toast.error(isId ? 'Email PIC wajib diisi' : 'PIC email is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const newClient = await clientService.createClient(
        {
          name: name.trim(),
          company: company.trim() || name.trim(),
          pic_name: picName.trim() || name.trim(),
          pic_email: picEmail.trim(),
          pic_phone: picPhone.trim() || undefined,
          address: address.trim() || undefined,
        },
        role
      );

      toast.success(isId ? `Klien "${newClient.name}" berhasil ditambahkan!` : `Client "${newClient.name}" created successfully!`);
      onClientCreated(newClient);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Failed to create client:', err);
      toast.error(err.message || (isId ? 'Gagal menambahkan klien baru' : 'Failed to create new client'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-lg bg-[var(--bg-surface-elevated)] rounded-t-2xl sm:rounded-2xl border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-primary)] font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                {isId ? 'Tambah Klien Baru' : 'Add New Client'}
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {isId ? 'Daftarkan organisasi klien baru langsung ke database' : 'Register new client organization directly to database'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Row 1: Client Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Nama Klien / Organisasi' : 'Client / Org Name'} <span className="text-[var(--accent-primary)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isId ? 'contoh: RSUD Kota Digital' : 'e.g. RSUD Kota Digital'}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <Building2 className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Nama Legal Perusahaan' : 'Company Legal Name'}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={isId ? 'contoh: PT Sehat Mandiri' : 'e.g. PT Sehat Mandiri'}
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Row 2: PIC Name & PIC Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Nama Kontak PIC' : 'PIC Contact Name'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder={isId ? 'contoh: dr. Budi Santoso' : 'e.g. dr. Budi Santoso'}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                {isId ? 'Email PIC' : 'PIC Email'} <span className="text-[var(--accent-primary)]">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={picEmail}
                  onChange={(e) => setPicEmail(e.target.value)}
                  placeholder="pic@domain.id"
                  className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Row 3: Phone */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              {isId ? 'Nomor Telepon' : 'Phone Number'}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="+62 812-xxxx-xxxx"
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Row 4: Address */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-[var(--text-primary)] uppercase tracking-wider">
              {isId ? 'Alamat Kantor' : 'Office Address'}
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={isId ? 'Jl. Sudirman No. 12, Jakarta' : 'Jl. Sudirman No. 12, Jakarta'}
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
              />
              <MapPin className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-3" />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3.5 border-t border-[var(--border-default)] pb-safe sm:pb-0 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 text-center justify-center"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isId ? 'Mendaftarkan...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isId ? 'Daftarkan Klien' : 'Create Client'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
