'use client';

interface InsightCardProps {
  id: string;
  type: 'win_back' | 'churn_risk' | 'cross_sell' | 'over_messaging';
  title: string;
  description: string;
  customerCount?: number;
  onDismiss?: (id: string) => void;
  onLaunch?: (id: string) => void;
}

const typeConfig = {
  win_back: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
    label: 'Win Back',
    borderClass: 'border-l-[2px] border-l-emerald-500/50 border-white/[0.08]',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    buttonClass: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
    hoverGlowClass: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)]',
    statColorClass: 'text-emerald-400',
  },
  churn_risk: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    label: 'Churn Risk',
    borderClass: 'border-l-[2px] border-l-red-500/50 border-white/[0.08]',
    badgeClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
    buttonClass: 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20',
    hoverGlowClass: 'hover:shadow-[0_8px_30px_rgba(239,68,68,0.1)]',
    statColorClass: 'text-red-400',
  },
  cross_sell: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m8 6 4-4 4 4"/><path d="M12 2v10.3"/><path d="M4.93 10.93 2 22h20l-2.93-11.07"/></svg>,
    label: 'Cross-Sell',
    borderClass: 'border-l-[2px] border-l-purple-500/50 border-white/[0.08]',
    badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    buttonClass: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20',
    hoverGlowClass: 'hover:shadow-[0_8px_30px_rgba(139,92,246,0.1)]',
    statColorClass: 'text-purple-400',
  },
  over_messaging: {
    icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="9" y1="10" x2="15" y2="10"/></svg>,
    label: 'Over-Messaging',
    borderClass: 'border-l-[2px] border-l-orange-500/50 border-white/[0.08]',
    badgeClass: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    buttonClass: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20',
    hoverGlowClass: 'hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)]',
    statColorClass: 'text-orange-400',
  },
};

export default function InsightCard({
  id,
  type,
  title,
  description,
  customerCount,
  onDismiss,
  onLaunch,
}: InsightCardProps) {
  const config = typeConfig[type];

  // Extract count from description if not explicitly provided
  const match = description.match(/^(\d+)/);
  const displayCount = customerCount ?? (match ? parseInt(match[1]) : 0);
  
  // Clean up the description so we don't repeat the number if it's there
  let displayDesc = description;
  if (match) {
    displayDesc = description.replace(/^(\d+)\s*customers?\s*/i, '');
    displayDesc = displayDesc.charAt(0).toUpperCase() + displayDesc.slice(1);
  }

  return (
    <div 
      className={`relative p-6 flex flex-col justify-between bg-white/[0.03] backdrop-blur-[10px] border border-white/[0.08] rounded-2xl transition-all duration-300 hover:-translate-y-[2px] group animate-fade-in-up ${config.borderClass} ${config.hoverGlowClass}`}
    >
      <div>
        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(id)}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
            aria-label="Dismiss insight"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        )}

        {/* Type badge */}
        <div className="flex items-center mb-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.badgeClass}`}
          >
            <span>{config.icon}</span>
            {config.label}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2 leading-snug pr-6 capitalize">
          {title}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {displayDesc}
        </p>
      </div>

      <div>
        {/* Stat Number */}
        <div className="mb-5 flex flex-col">
          <span className={`text-4xl font-extrabold tracking-tight ${config.statColorClass}`}>
            {displayCount.toLocaleString()}
          </span>
          <span className="text-xs uppercase tracking-widest font-semibold text-slate-500 mt-1">
            Eligible Customers
          </span>
        </div>

        {/* Action */}
        {onLaunch && (
          <button
            onClick={() => onLaunch(id)}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${config.buttonClass}`}
          >
            Launch Campaign
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}
