'use client';

interface HealthScoreBadgeProps {
  score: number;
  label: string;
}

export default function HealthScoreBadge({ score, label }: HealthScoreBadgeProps) {
  const config = getConfig(label);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        border transition-all duration-300
        ${config.bg} ${config.text} ${config.border}
        ${config.animation}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dot}`}
      />
      <span>{Math.round(score)}</span>
      <span className="opacity-70">·</span>
      <span>{label}</span>
    </span>
  );
}

function getConfig(label: string) {
  const normalized = label.toLowerCase().replace(/[\s_-]/g, '');

  if (normalized === 'healthy') {
    return {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      dot: 'bg-emerald-400',
      animation: '',
    };
  }

  if (normalized === 'atrisk') {
    return {
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/15',
      dot: 'bg-orange-400',
      animation: '',
    };
  }

  // Burned
  return {
    bg: 'bg-red-500/10',
    text: 'text-red-300',
    border: 'border-red-500/15',
    dot: 'bg-red-400',
    animation: '',
  };
}
