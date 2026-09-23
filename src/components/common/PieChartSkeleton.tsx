import React from 'react';

interface PieChartSkeletonProps {
  title?: string;
  className?: string;
}

export const PieChartSkeleton: React.FC<PieChartSkeletonProps> = ({
  title = 'Memuat Distribusi Status...',
  className = '',
}) => {
  return (
    <div
      className={`bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 space-y-4 shadow-xs relative overflow-hidden ${className}`}
      aria-label="Memuat data visualisasi chart"
    >
      {/* Header shimmer */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[var(--bg-surface-subtle)] animate-pulse" />
          <div className="h-4 w-36 rounded bg-[var(--bg-surface-subtle)] animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded bg-[var(--bg-surface-subtle)] animate-pulse" />
      </div>

      {/* Donut Chart Skeleton */}
      <div className="h-48 w-full flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center">
          {/* Animated Donut Ring SVG */}
          <svg className="w-32 h-32 -rotate-90 animate-pulse" viewBox="0 0 120 120">
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="var(--bg-surface-subtle)"
              strokeWidth="16"
              fill="transparent"
              className="opacity-40"
            />
            {/* Segment 1 */}
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="var(--border-default)"
              strokeWidth="16"
              strokeDasharray="95 180"
              strokeDashoffset="0"
              strokeLinecap="round"
              fill="transparent"
              className="opacity-70"
            />
            {/* Segment 2 */}
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="var(--bg-surface-subtle)"
              strokeWidth="16"
              strokeDasharray="60 215"
              strokeDashoffset="-100"
              strokeLinecap="round"
              fill="transparent"
              className="opacity-90"
            />
            {/* Segment 3 */}
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="var(--border-subtle)"
              strokeWidth="16"
              strokeDasharray="45 230"
              strokeDashoffset="-165"
              strokeLinecap="round"
              fill="transparent"
              className="opacity-50"
            />
          </svg>

          {/* Center Hole Details */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-surface-subtle)] animate-ping opacity-25" />
            <span className="text-[10px] font-medium text-[var(--text-muted)] animate-pulse mt-0.5">
              ...
            </span>
          </div>
        </div>

        {/* Legend Shimmer Placeholders */}
        <div className="flex items-center justify-center gap-3 mt-3 w-full px-4">
          <div className="flex items-center gap-1.5 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-surface-subtle)]" />
            <div className="h-2.5 w-14 rounded bg-[var(--bg-surface-subtle)]" />
          </div>
          <div className="flex items-center gap-1.5 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-surface-subtle)]" />
            <div className="h-2.5 w-16 rounded bg-[var(--bg-surface-subtle)]" />
          </div>
          <div className="flex items-center gap-1.5 animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--bg-surface-subtle)]" />
            <div className="h-2.5 w-12 rounded bg-[var(--bg-surface-subtle)]" />
          </div>
        </div>
      </div>

      {/* Modern Shimmer Light Reflection Sweep */}
      <div 
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
        style={{
          animation: 'shimmerSweep 2.2s infinite',
        }}
      />
      <style>{`
        @keyframes shimmerSweep {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};
