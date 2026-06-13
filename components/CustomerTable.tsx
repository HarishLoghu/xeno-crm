'use client';

import { useState, useMemo } from 'react';
import type { Customer } from '@/types';
import HealthScoreBadge from './HealthScoreBadge';

const avatarGradients = [
  'from-violet-500/30 to-fuchsia-500/30 text-violet-300',
  'from-emerald-500/30 to-teal-500/30 text-emerald-300',
  'from-blue-500/30 to-cyan-500/30 text-blue-300',
  'from-orange-500/30 to-amber-500/30 text-orange-300',
  'from-rose-500/30 to-pink-500/30 text-rose-300',
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarGradients[Math.abs(hash) % avatarGradients.length];
}

interface CustomerTableProps {
  customers: Customer[];
}

type SortKey = 'name' | 'email' | 'healthScore' | 'bestChannel' | 'lastMessaged' | 'totalOrders';
type SortDir = 'asc' | 'desc';

export default function CustomerTable({ customers }: CustomerTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('healthScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...customers].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortKey) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'email':
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case 'healthScore':
          aVal = a.healthScore;
          bVal = b.healthScore;
          break;
        case 'bestChannel':
          aVal = (a.bestChannel || '').toLowerCase();
          bVal = (b.bestChannel || '').toLowerCase();
          break;
        case 'lastMessaged':
          aVal = a.lastMessaged || '';
          bVal = b.lastMessaged || '';
          break;
        case 'totalOrders':
          aVal = a.totalOrders ?? a._count?.orders ?? 0;
          bVal = b.totalOrders ?? b._count?.orders ?? 0;
          break;
      }

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, sortKey, sortDir]);

  const SortHeader = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer group select-none hover:text-slate-200 transition-colors"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <span className="text-slate-600 group-hover:text-slate-400 transition-colors">
          {sortKey === sortKeyName ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </div>
    </th>
  );

  if (customers.length === 0) {
    return (
      <div className="glass-card-static p-12 text-center">
        <div className="text-5xl mb-4 opacity-40">👥</div>
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No customers found</h3>
        <p className="text-sm text-slate-500">
          Try adjusting your filters or search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-static overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <SortHeader label="Name" sortKeyName="name" />
              <SortHeader label="Email" sortKeyName="email" />
              <SortHeader label="Health Score" sortKeyName="healthScore" />
              <SortHeader label="Best Channel" sortKeyName="bestChannel" />
              <SortHeader label="Last Messaged" sortKeyName="lastMessaged" />
              <SortHeader label="Orders" sortKeyName="totalOrders" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sorted.map((customer) => (
              <tr
                key={customer.id}
                className="group hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all duration-200 cursor-default"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(customer.name)} flex items-center justify-center text-xs font-bold shrink-0`}>
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                      {customer.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-400">
                    {customer.email || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <HealthScoreBadge
                    score={customer.healthScore}
                    label={customer.healthLabel}
                  />
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-400 capitalize">
                    {(() => {
                      const channel = (customer.bestChannel || getBestChannel(customer) || '').toLowerCase();
                      if (channel === 'whatsapp') {
                        return (
                          <>
                            <svg className="text-emerald-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            {channel}
                          </>
                        );
                      }
                      if (channel === 'email') {
                        return (
                          <>
                            <svg className="text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            {channel}
                          </>
                        );
                      }
                      return channel || '—';
                    })()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-400">
                    {customer.lastMessaged
                      ? formatRelativeTime(customer.lastMessaged)
                      : '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-medium text-slate-300">
                    {customer.totalOrders ?? customer._count?.orders ?? 0}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getBestChannel(customer: Customer): string {
  const profile = customer.engagementProfile as Record<string, Record<string, number>>;
  if (!profile || typeof profile !== 'object') return '';
  const bestChannel = profile.bestChannel;
  if (typeof bestChannel === 'string') return bestChannel;
  return '';
}

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}
