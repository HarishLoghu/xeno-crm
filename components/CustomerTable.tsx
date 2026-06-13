'use client';

import { useState, useMemo } from 'react';
import type { Customer } from '@/types';
import HealthScoreBadge from './HealthScoreBadge';

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
                className="group hover:bg-white/[0.02] transition-colors duration-150 cursor-default"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 flex items-center justify-center text-xs font-bold text-indigo-300 shrink-0">
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
                  <span className="text-sm text-slate-400 capitalize">
                    {customer.bestChannel || getBestChannel(customer) || '—'}
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
