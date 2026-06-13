'use client';

interface InsightCardProps {
  id: string;
  type: 'win_back' | 'churn_risk' | 'cross_sell' | 'over_messaging';
  title: string;
  description: string;
  onDismiss?: (id: string) => void;
  onLaunch?: (id: string) => void;
}

const typeConfig = {
  win_back: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
    label: 'Win Back',
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/20',
  },
  churn_risk: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    label: 'Churn Risk',
    accentBg: 'bg-red-500/10',
    accentText: 'text-red-400',
    accentBorder: 'border-red-500/20',
  },
  cross_sell: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m8 6 4-4 4 4"/><path d="M12 2v10.3"/><path d="M4.93 10.93 2 22h20l-2.93-11.07"/></svg>,
    label: 'Cross-Sell',
    accentBg: 'bg-purple-500/10',
    accentText: 'text-purple-400',
    accentBorder: 'border-purple-500/20',
  },
  over_messaging: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>,
    label: 'Over-Messaging',
    accentBg: 'bg-orange-500/10',
    accentText: 'text-orange-400',
    accentBorder: 'border-orange-500/20',
  },
};

export default function InsightCard({
  id,
  type,
  title,
  description,
  onDismiss,
  onLaunch,
}: InsightCardProps) {
  const config = typeConfig[type];

  return (
    <div className="glass-card-static p-5 group relative animate-fade-in-up border border-white/5">
      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={() => onDismiss(id)}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
          aria-label="Dismiss insight"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      )}

      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${config.accentBg} ${config.accentText} border ${config.accentBorder}`}
        >
          <span className="opacity-90">{config.icon}</span>
          {config.label}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-sm font-semibold text-white mb-2 leading-snug pr-6">
        {title}
      </h3>
      <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[40px]">
        {description}
      </p>

      {/* Action */}
      {onLaunch && (
        <button
          onClick={() => onLaunch(id)}
          className="w-full py-2 rounded-lg text-[13px] font-medium text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5"
        >
          Launch Campaign
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      )}
    </div>
  );
}
