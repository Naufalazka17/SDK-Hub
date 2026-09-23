import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import { projectService } from '../../services/projectService';

interface ProjectHealthScoreProps {
  metrics?: {
    timelineAdherencePercent: number;
    taskCompletionPercent: number;
    clientResponseScore: number;
    resourceUtilizationScore: number;
  };
  scoreOverride?: number;
  statusOverride?: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  variant?: 'badge' | 'detailed' | 'pill';
  showBreakdown?: boolean;
}

export const ProjectHealthScore: React.FC<ProjectHealthScoreProps> = ({
  metrics = {
    timelineAdherencePercent: 88,
    taskCompletionPercent: 78,
    clientResponseScore: 85,
    resourceUtilizationScore: 80,
  },
  scoreOverride,
  statusOverride,
  variant = 'badge',
  showBreakdown = false,
}) => {
  const calculated = projectService.calculateHealthScore(metrics);
  const score = scoreOverride ?? calculated.score;
  const status = statusOverride ?? calculated.status;

  const config = {
    HEALTHY: {
      label: 'Healthy',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bar: 'bg-emerald-500',
      icon: ShieldCheck,
    },
    AT_RISK: {
      label: 'At Risk',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bar: 'bg-amber-500',
      icon: AlertTriangle,
    },
    CRITICAL: {
      label: 'Critical',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      bar: 'bg-rose-500',
      icon: AlertCircle,
    },
  }[status];

  const Icon = config.icon;

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.bg} ${config.border} ${config.text} border`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.bar}`} />
        <span className="font-mono">{score}%</span>
        <span>• {config.label}</span>
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bg} ${config.text}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                Project Health Score
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                Formula: 30% Timeline • 30% Task • 20% Client • 20% Resource
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-xl font-mono font-bold ${config.text}`}>{score}%</span>
            <span
              className={`block text-[10px] font-semibold uppercase tracking-wider ${config.text}`}
            >
              {config.label}
            </span>
          </div>
        </div>

        {showBreakdown && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px]">
            <div>
              <span className="text-[var(--text-secondary)]">Timeline (30%):</span>{' '}
              <span className="font-mono text-[var(--text-primary)]">
                {metrics.timelineAdherencePercent}%
              </span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Tasks (30%):</span>{' '}
              <span className="font-mono text-[var(--text-primary)]">
                {metrics.taskCompletionPercent}%
              </span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Client Resp (20%):</span>{' '}
              <span className="font-mono text-[var(--text-primary)]">
                {metrics.clientResponseScore}%
              </span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Resource Util (20%):</span>{' '}
              <span className="font-mono text-[var(--text-primary)]">
                {metrics.resourceUtilizationScore}%
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${config.bg} ${config.border} ${config.text}`}
      title={`Health Score: ${score}% (${config.label})`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="font-mono font-bold">{score}%</span>
    </div>
  );
};
