'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

interface CampaignFunnelProps {
  stats: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

const GRADIENT_COLORS = [
  { main: '#6366f1', light: '#818cf8' },
  { main: '#7c3aed', light: '#a78bfa' },
  { main: '#8b5cf6', light: '#c084fc' },
  { main: '#a855f7', light: '#d8b4fe' },
  { main: '#10b981', light: '#34d399' },
];

export default function CampaignFunnel({ stats }: CampaignFunnelProps) {
  const data = [
    { name: 'Sent', value: stats.sent, pct: 100 },
    {
      name: 'Delivered',
      value: stats.delivered,
      pct: stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 100) : 0,
    },
    {
      name: 'Opened',
      value: stats.opened,
      pct: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
    },
    {
      name: 'Clicked',
      value: stats.clicked,
      pct: stats.sent > 0 ? Math.round((stats.clicked / stats.sent) * 100) : 0,
    },
    {
      name: 'Converted',
      value: stats.converted,
      pct: stats.sent > 0 ? Math.round((stats.converted / stats.sent) * 100) : 0,
    },
  ];

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 24, right: 20, left: 0, bottom: 8 }}
          barCategoryGap="20%"
        >
          <defs>
            {GRADIENT_COLORS.map((color, i) => (
              <linearGradient
                key={i}
                id={`funnel-gradient-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color.light} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color.main} stopOpacity={0.7} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(23, 24, 41, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            labelStyle={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: '#94a3b8', fontSize: 12 }}
            formatter={(value: number, _name: string, props: { payload: { pct: number } }) => [
              `${value.toLocaleString()} (${props.payload.pct}%)`,
              '',
            ]}
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <Bar
            dataKey="value"
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#funnel-gradient-${index})`}
              />
            ))}
            <LabelList
              dataKey="pct"
              position="top"
              formatter={(v: number) => `${v}%`}
              style={{
                fill: '#94a3b8',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
