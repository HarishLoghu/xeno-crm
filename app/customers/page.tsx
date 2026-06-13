'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Customer } from '@/types';
import CustomerTable from '@/components/CustomerTable';

const TABS = ['All', 'Healthy', 'At Risk', 'Burned'] as const;
type TabFilter = (typeof TABS)[number];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 50;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTab !== 'All') params.set('healthLabel', activeTab);
      params.set('page', String(page));
      params.set('limit', String(perPage));

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : data.customers || []);
        if (data.pagination) {
          setTotalCount(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeTab, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab]);

  const tabCounts: Record<TabFilter, number> = {
    All: customers.filter((c) => activeTab === 'All').length || customers.length,
    Healthy: customers.filter((c) => c.healthLabel === 'Healthy').length,
    'At Risk': customers.filter((c) => c.healthLabel === 'At Risk').length,
    Burned: customers.filter((c) => c.healthLabel === 'Burned').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Customers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {totalCount.toLocaleString()} total customers in your database
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
            🔍
          </span>
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 glass-card-static rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200
              flex items-center gap-2
              ${
                activeTab === tab
                  ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }
            `}
          >
            {tab}
            <span
              className={`
                px-1.5 py-0.5 rounded-md text-[10px] font-bold
                ${
                  activeTab === tab
                    ? 'bg-indigo-500/30 text-indigo-200'
                    : 'bg-white/[0.06] text-slate-500'
                }
              `}
            >
              {tabCounts[tab]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="glass-card-static overflow-hidden">
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                <div className="skeleton h-4 rounded flex-1" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CustomerTable customers={customers} />
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, totalCount)} of {totalCount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-ghost py-2 px-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <div className="flex items-center gap-1">
              {(() => {
                const pages = [];
                const start = Math.max(1, page - 2);
                const end = Math.min(totalPages, start + 4);
                for (let p = start; p <= end; p++) {
                  pages.push(
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`
                        w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200
                        ${
                          page === p
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
                        }
                      `}
                    >
                      {p}
                    </button>
                  );
                }
                if (end < totalPages) {
                  pages.push(<span key="ellipsis" className="text-xs text-slate-600 px-1">...</span>);
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => setPage(totalPages)}
                      className="w-8 h-8 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      {totalPages}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-ghost py-2 px-3 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
