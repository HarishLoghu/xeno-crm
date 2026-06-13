'use client';

import { useEffect, useRef } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string | React.ReactNode;
  trend?: number;
  trendLabel?: string;
  className?: string;
  pulseGreen?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  className = '',
  pulseGreen = false,
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
      className={`glass-card p-5 group relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] hover:border-violet-500/30 ${
        pulseGreen ? 'animate-pulse-glow-emerald border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pulseGreen ? 'from-emerald-500/20 to-teal-500/20' : 'from-violet-500/20 to-blue-500/20'} flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-300`}>
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
      <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>

      {trendLabel && (
        <p className="text-[11px] text-slate-500 mt-2 font-medium uppercase tracking-wider">{trendLabel}</p>
      )}
    </div>
  );
}
