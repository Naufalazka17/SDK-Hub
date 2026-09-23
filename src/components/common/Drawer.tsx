import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  children,
  footer,
  widthClass = 'w-full sm:w-[480px] lg:w-[520px]',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`relative ${widthClass} h-full bg-[var(--bg-surface-elevated)] border-l border-[var(--border-default)] shadow-2xl flex flex-col z-10 animate-drawer-in`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && <div className="text-[var(--accent-primary)] shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[var(--text-primary)] truncate">{title}</h2>
              {subtitle && <div className="text-[11px] text-[var(--text-secondary)]">{subtitle}</div>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-subtle)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">{children}</div>

        {/* Footer actions */}
        {footer && (
          <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-center gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
