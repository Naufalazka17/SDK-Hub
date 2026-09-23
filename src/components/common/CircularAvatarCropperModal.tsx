import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, UploadCloud, RotateCcw, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface CircularAvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

export const CircularAvatarCropperModal: React.FC<CircularAvatarCropperModalProps> = ({
  isOpen,
  onClose,
  onAvatarUpdated,
}) => {
  const { currentProfile, updateCurrentProfileAvatar } = useAuth();
  const { language } = useLanguage();
  const isId = language === 'id';

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImageSrc(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(isId ? 'Format file tidak didukung. Harap gunakan format PNG, JPG, atau WebP.' : 'Unsupported file format. Please use PNG, JPG, or WebP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      toast.error(isId ? 'Ukuran file terlalu besar. Maksimum ukuran adalah 5 MB.' : 'File size is too large. Maximum size is 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - pan.x,
      y: e.touches[0].clientY - pan.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !currentProfile) return;

    try {
      setIsSaving(true);

      const canvas = document.createElement('canvas');
      const CROP_SIZE = 400; // Output dimension
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error(isId ? 'Gagal membuat context canvas' : 'Canvas context could not be created');

      // Create image object
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Clip circle on canvas
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate source and destination draw coordinates
      // Preview circle diameter is 240px
      const PREVIEW_SIZE = 240;
      const scaleFactor = CROP_SIZE / PREVIEW_SIZE;

      const renderedW = img.naturalWidth * zoom * scaleFactor;
      const renderedH = img.naturalHeight * zoom * scaleFactor;
      const drawX = CROP_SIZE / 2 - renderedW / 2 + pan.x * scaleFactor;
      const drawY = CROP_SIZE / 2 - renderedH / 2 + pan.y * scaleFactor;

      ctx.drawImage(img, drawX, drawY, renderedW, renderedH);

      // 1. Generate optimized Base64 data URL from canvas (240x240 circular cropped avatar)
      // This serves as an immediate, guaranteed fallback if Supabase storage bucket is unconfigured
      const base64Avatar = canvas.toDataURL('image/png', 0.92);
      let finalAvatarUrl = base64Avatar;

      // 2. Attempt storage upload to 'sdk-files' bucket (or 'avatars')
      try {
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
        });

        if (blob) {
          const fileName = `${currentProfile.id}-${Date.now()}.png`;
          const filePath = `avatars/${fileName}`;

          // Attempt 1: Upload to standard bucket 'sdk-files'
          let uploadResult = await supabase.storage
            .from('sdk-files')
            .upload(filePath, blob, {
              contentType: 'image/png',
              upsert: true,
            });

          // Attempt 2: If 'sdk-files' is not found, try 'avatars'
          if (uploadResult.error && uploadResult.error.message?.toLowerCase().includes('bucket not found')) {
            uploadResult = await supabase.storage
              .from('avatars')
              .upload(fileName, blob, {
                contentType: 'image/png',
                upsert: true,
              });

            if (!uploadResult.error) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);
              if (publicUrl) finalAvatarUrl = publicUrl;
            }
          } else if (!uploadResult.error) {
            const { data: { publicUrl } } = supabase.storage
              .from('sdk-files')
              .getPublicUrl(filePath);
            if (publicUrl) finalAvatarUrl = publicUrl;
          } else {
            console.warn('Storage bucket upload encountered non-fatal issue, using database data URL:', uploadResult.error.message);
          }
        }
      } catch (storageErr) {
        console.warn('Storage upload error, proceeding with high-quality database base64 avatar:', storageErr);
      }

      // 3. Update database profile with finalAvatarUrl
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: finalAvatarUrl })
        .eq('id', currentProfile.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(isId ? `Gagal menyimpan URL avatar: ${updateError.message}` : `Failed to save avatar URL: ${updateError.message}`);
      }

      // 4. Update AuthContext and notify application state
      updateCurrentProfileAvatar(finalAvatarUrl);
      if (onAvatarUpdated) onAvatarUpdated(finalAvatarUrl);

      toast.success(isId ? 'Foto profil berhasil diperbarui!' : 'Profile picture updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error saving cropped avatar:', err);
      toast.error(err.message || (isId ? 'Gagal menyimpan foto profil' : 'Failed to save profile picture'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentProfile) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', currentProfile.id);

      if (error) throw error;

      updateCurrentProfileAvatar('');
      if (onAvatarUpdated) onAvatarUpdated('');
      toast.success(isId ? 'Foto profil berhasil dihapus' : 'Profile picture removed');
      onClose();
    } catch (err: any) {
      toast.error(err.message || (isId ? 'Gagal menghapus foto profil' : 'Failed to remove profile picture'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-[var(--bg-surface-elevated)] rounded-2xl border border-[var(--border-default)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              {isId ? 'Perbarui Foto Profil' : 'Update Profile Picture'}
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {isId ? 'Unggah, posisikan, dan crop foto profil Anda' : 'Upload, reposition, and crop your profile picture'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
          />

          {!imageSrc ? (
            /* Upload Prompt Box */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-56 border-2 border-dashed border-[var(--border-light)] hover:border-[var(--accent-primary)] rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors bg-[var(--bg-surface)]/50 group"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-primary)] mb-3 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)]">
                {isId ? 'Pilih Foto dari Perangkat' : 'Choose Photo from Device'}
              </span>
              <span className="text-[11px] text-[var(--text-secondary)] mt-1">
                {isId ? 'Mendukung PNG, JPG, WebP (Maks. 5 MB)' : 'Supports PNG, JPG, WebP (Max 5 MB)'}
              </span>
            </div>
          ) : (
            /* Interactive Circular Cropper Area */
            <div className="space-y-4 w-full flex flex-col items-center">
              {/* Circular Viewport */}
              <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="w-60 h-60 rounded-full border-2 border-[var(--accent-primary)] bg-black overflow-hidden relative cursor-grab active:cursor-grabbing shadow-inner select-none flex items-center justify-center"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop preview"
                  draggable={false}
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                  }}
                  className="max-w-none max-h-none pointer-events-none select-none"
                />
              </div>

              {/* Instructions */}
              <p className="text-[11px] text-[var(--text-muted)] text-center">
                {isId ? 'Geser (drag) foto untuk mengatur posisi di dalam lingkaran' : 'Drag photo to adjust position inside circle'}
              </p>

              {/* Zoom Slider Control */}
              <div className="w-full max-w-xs space-y-1.5 px-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium">
                  <span className="flex items-center gap-1">
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </span>
                  <span className="font-mono text-[10px] text-[var(--accent-primary)]">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] border border-[var(--border-default)]"
                  />
                  <ZoomIn className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
                </div>
              </div>

              {/* Action helper buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isId ? 'Reset Posisi' : 'Reset Position'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {isId ? 'Ganti Berkas' : 'Change File'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
          {currentProfile?.avatar_url ? (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isSaving}
              className="text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
            >
              {isId ? 'Hapus Foto' : 'Remove Photo'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-surface-subtle)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              {isId ? 'Batal' : 'Cancel'}
            </button>

            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={!imageSrc || isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isId ? 'Menyimpan...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isId ? 'Simpan Foto' : 'Save Photo'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
