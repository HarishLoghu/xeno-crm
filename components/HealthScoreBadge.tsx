'use client';

interface HealthScoreBadgeProps {
  score: number;
  label: string;
}

export default function HealthScoreBadge({ score, label }: HealthScoreBadgeProps) {
  const config = getConfig(label);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${config.text}`}>{label}</span>
        <span className="text-slate-400 font-medium">{Math.round(score)}</span>
      </div>
      <div className="h-1.5 w-full bg-white/[0.05] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${config.barColor} transition-all duration-1000 ease-out`} 
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }} 
        />
      </div>
    </div>
  );
}

function getConfig(label: string) {
  const normalized = label.toLowerCase().replace(/[\s_-]/g, '');

  if (normalized === 'healthy') {
    return {
      text: 'text-emerald-400',
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    };
  }

  if (normalized === 'atrisk') {
    return {
      text: 'text-orange-400',
      barColor: 'bg-gradient-to-r from-orange-500 to-amber-400',
    };
  }

  // Burned
  return {
    text: 'text-rose-400',
    barColor: 'bg-gradient-to-r from-rose-500 to-red-400',
  };
}
