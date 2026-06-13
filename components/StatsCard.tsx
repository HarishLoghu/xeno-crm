'use client';

import { useEffect, useRef } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: number;
  trendLabel?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  className = '',
}: StatsCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, []);

  const trendColor =
    trend && trend > 0
      ? 'text-emerald-400'
      : trend && trend < 0
        ? 'text-rose-400'
        : 'text-slate-400';

  const trendIcon = trend && trend > 0 ? '↑' : trend && trend < 0 ? '↓' : '';

  return (
    <div
      ref={cardRef}
      className={`glass-card gradient-border p-5 group cursor-default ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <span>{trendIcon}</span>
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-1 font-medium">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>

      {trendLabel && (
        <p className="text-xs text-slate-500 mt-2 font-medium">{trendLabel}</p>
      )}
    </div>
  );
}
