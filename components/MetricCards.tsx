'use client';

import React from 'react';
import { MetricSummary } from '@/types/compliance';
import { ShieldCheck, AlertTriangle, AlertOctagon, Layers } from 'lucide-react';

interface MetricCardsProps {
  metrics: MetricSummary;
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export default function MetricCards({
  metrics,
  selectedStatus,
  onSelectStatus,
}: MetricCardsProps) {
  const cards = [
    {
      id: 'ALL',
      title: 'Total Tracked',
      value: metrics.total,
      subtext: 'Active training certifications',
      icon: Layers,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-100 dark:border-indigo-900/50',
      badge: 'All Records',
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 ring-indigo-600/20 dark:ring-indigo-500/30',
      activeRing: 'ring-2 ring-indigo-600 dark:ring-indigo-500',
    },
    {
      id: 'COMPLIANT',
      title: 'Fully Compliant',
      value: metrics.compliant,
      subtext: `${metrics.complianceRate}% adherence rate`,
      icon: ShieldCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100 dark:border-emerald-900/50',
      badge: `${metrics.complianceRate}% Rate`,
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30',
      activeRing: 'ring-2 ring-emerald-600 dark:ring-emerald-500',
    },
    {
      id: 'EXPIRING_SOON',
      title: 'Expiring Soon',
      value: metrics.expiringSoon,
      subtext: 'Action required within 30 days',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-100 dark:border-amber-900/50',
      badge: '≤ 30 Days',
      badgeColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30',
      activeRing: 'ring-2 ring-amber-500 dark:ring-amber-400',
    },
    {
      id: 'EXPIRED',
      title: 'Overdue / Expired',
      value: metrics.expired,
      subtext: 'Requires immediate renewal',
      icon: AlertOctagon,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-100 dark:border-rose-900/50',
      badge: 'Audit Hazard',
      badgeColor: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 ring-rose-600/20 dark:ring-rose-500/30',
      activeRing: 'ring-2 ring-rose-600 dark:ring-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.id;

        return (
          <button
            type="button"
            key={card.id}
            onClick={() => onSelectStatus?.(card.id)}
            className={`text-left relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 focus:outline-hidden ${
              isSelected ? `${card.activeRing} shadow-md` : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {card.value}
              </span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.subtext}</p>
          </button>
        );
      })}
    </div>
  );
}
