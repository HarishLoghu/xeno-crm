'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { Customer, Campaign, InsightCardData } from '@/types';
import StatsCard from '@/components/StatsCard';
import InsightCard from '@/components/InsightCard';

const HEALTH_COLORS = {
  Healthy: '#4ade80',
  'At Risk': '#fb923c',
  Burned: '#f87171',
};

function SkeletonCard() {
  return (
    <div className="glass-card-static p-5">
      <div className="skeleton w-10 h-10 rounded-xl mb-3" />
      <div className="skeleton w-20 h-3 rounded mb-2" />
      <div className="skeleton w-28 h-7 rounded" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="glass-card-static p-6">
      <div className="skeleton w-36 h-5 rounded mb-6" />
      <div className="skeleton w-full h-[200px] rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights] = useState<InsightCardData[]>([
    {
      id: '1',
      type: 'churn_risk',
      title: 'High Value Churn Risk',
      description:
        '47 customers were previously active but have gone silent. A targeted win-back campaign with a 10% discount could re-engage them before they churn.',
      segmentData: {},
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'cross_sell',
      title: 'Cross-sell Window',
      description:
        '35 customers who purchased phones/laptops in the last 30 days are 3.2x more likely to buy accessories. Recommend cases and chargers.',
      segmentData: {},
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'over_messaging',
      title: 'Over-messaging Risk',
      description:
        '12 customers received 5+ messages this week with zero clicks. Consider suppressing them for the next 48 hours.',
      segmentData: {},
      dismissed: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [custRes, campRes] = await Promise.all([
          fetch('/api/customers?limit=10000'),
          fetch('/api/campaigns'),
        ]);

        if (custRes.ok) {
          const data = await custRes.json();
          setCustomers(Array.isArray(data) ? data : data.customers || []);
          if (data.pagination) setTotalCustomers(data.pagination.total);
        }
        if (campRes.ok) {
          const data = await campRes.json();
          setCampaigns(Array.isArray(data) ? data : data.campaigns || []);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const healthy = customers.filter((c) => c.healthLabel === 'Healthy').length;
  const atRisk = customers.filter((c) => c.healthLabel === 'At Risk').length;
  const burned = customers.filter((c) => c.healthLabel === 'Burned').length;

  const pieData = [
    { name: 'Healthy', value: healthy || 1 },
    { name: 'At Risk', value: atRisk || 0 },
    { name: 'Burned', value: burned || 0 },
  ].filter((d) => d.value > 0);

  const activeCampaigns = campaigns.filter((c) => c.status === 'running');
  const recentCampaigns = campaigns.slice(0, 4);

  const suppressedToday = customers.filter((c) => {
    const profile = c.engagementProfile as Record<string, unknown>;
    return profile?.suppressed === true;
  }).length;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent opacity-60 pointer-events-none" />

      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time customer intelligence
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          {[...Array(5)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 stagger-children">
          <StatsCard
            title="Total Customers"
            value={totalCustomers.toLocaleString()}
            icon="👥"
            trend={12}
            trendLabel="vs last month"
          />
          <StatsCard
            title="Healthy"
            value={healthy.toLocaleString()}
            icon="💚"
            trend={8}
            trendLabel={`${totalCustomers > 0 ? Math.round((healthy / totalCustomers) * 100) : 0}% of total`}
          />
          <StatsCard
            title="At Risk"
            value={atRisk.toLocaleString()}
            icon="⚠️"
            trend={-3}
            trendLabel="Needs attention"
          />
          <StatsCard
            title="Burned"
            value={burned.toLocaleString()}
            icon="🔥"
            trend={-15}
            trendLabel="Over-communicated"
          />
          <StatsCard
            title="Suppressed Today"
            value={suppressedToday.toLocaleString()}
            icon="🛡️"
            trendLabel="Protected from fatigue"
            pulseGreen={suppressedToday > 0}
          />
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Distribution Pie */}
        {loading ? (
          <SkeletonChart />
        ) : (
          <div className="glass-card-static p-6 animate-fade-in-up">
            <h2 className="text-base font-semibold text-white mb-1">
              Health Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Customer base health breakdown
            </p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={HEALTH_COLORS[entry.name as keyof typeof HEALTH_COLORS]}
                        filter="url(#glow)"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(23, 24, 41, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      backdropFilter: 'blur(16px)',
                    }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                    itemStyle={{ color: '#94a3b8', fontSize: 12 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-slate-400 ml-1">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Active Campaigns */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Active Campaigns
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeCampaigns.length} running
              </p>
            </div>
            <a
              href="/campaigns"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              View all →
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card-static p-4">
                  <div className="skeleton w-40 h-4 rounded mb-2" />
                  <div className="skeleton w-24 h-3 rounded mb-3" />
                  <div className="skeleton w-full h-2 rounded" />
                </div>
              ))}
            </div>
          ) : recentCampaigns.length === 0 ? (
            <div className="glass-card-static p-8 text-center">
              <div className="text-4xl mb-3 opacity-40">📣</div>
              <p className="text-sm text-slate-400">No campaigns yet</p>
              <a
                href="/campaigns/new"
                className="btn-primary inline-flex mt-4 text-xs"
              >
                Create your first campaign
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((campaign) => (
                <a
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="glass-card block p-4 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                        {campaign.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {campaign.goal}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <StatusBadge status={campaign.status} />
                      <ChannelBadge channel={campaign.channel} />
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                      <span>{campaign.totalDelivered} delivered</span>
                      <span>
                        {campaign.totalSent > 0
                          ? Math.round(
                              (campaign.totalDelivered / campaign.totalSent) * 100
                            )
                          : 0}
                        % delivery rate
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${
                            campaign.totalSent > 0
                              ? Math.round(
                                  (campaign.totalDelivered / campaign.totalSent) *
                                    100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Insights */}
      <div className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              Recent Insights
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              AI-powered recommendations
            </p>
          </div>
          <a
            href="/insights"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            View all →
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.slice(0, 3).map((insight) => (
            <InsightCard
              key={insight.id}
              id={insight.id}
              type={insight.type}
              title={insight.title}
              description={insight.description}
              onLaunch={(id) => {
                window.location.href = `/campaigns/new?insight=${id}`;
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    draft: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      dot: 'bg-slate-400',
    },
    running: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      dot: 'bg-sky-400',
    },
    completed: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
    },
    failed: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
    },
  };

  const c = config[status] || config.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${c.dot} ${
          status === 'running' ? 'animate-pulse' : ''
        }`}
      />
      {status}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const icons: Record<string, string> = {
    whatsapp: '💬',
    sms: '📱',
    email: '📧',
    rcs: '✨',
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-[10px] text-slate-500 font-medium uppercase tracking-wider">
      <span>{icons[channel] || '📨'}</span>
      {channel}
    </span>
  );
}
