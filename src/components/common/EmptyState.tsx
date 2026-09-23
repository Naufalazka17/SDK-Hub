import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = FolderOpen,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-8 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface-subtle)] flex flex-col items-center justify-center text-center space-y-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-xs flex items-center justify-center text-[var(--text-muted)]">
        <Icon className="w-6 h-6 text-[var(--text-muted)]" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-1 px-4 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
