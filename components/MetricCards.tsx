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
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      badge: 'All Records',
      badgeColor: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
      activeRing: 'ring-2 ring-indigo-600',
    },
    {
      id: 'COMPLIANT',
      title: 'Fully Compliant',
      value: metrics.compliant,
      subtext: `${metrics.complianceRate}% adherence rate`,
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      badge: `${metrics.complianceRate}% Rate`,
      badgeColor: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      activeRing: 'ring-2 ring-emerald-600',
    },
    {
      id: 'EXPIRING_SOON',
      title: 'Expiring Soon',
      value: metrics.expiringSoon,
      subtext: 'Action required within 30 days',
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      badge: '≤ 30 Days',
      badgeColor: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      activeRing: 'ring-2 ring-amber-500',
    },
    {
      id: 'EXPIRED',
      title: 'Overdue / Expired',
      value: metrics.expired,
      subtext: 'Requires immediate renewal',
      icon: AlertOctagon,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      badge: 'Audit Hazard',
      badgeColor: 'bg-rose-50 text-rose-700 ring-rose-600/20',
      activeRing: 'ring-2 ring-rose-600',
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
            className={`text-left relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 focus:outline-hidden ${
              isSelected ? `${card.activeRing} shadow-md` : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {card.value}
              </span>
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${card.badgeColor}`}
              >
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">{card.subtext}</p>
          </button>
        );
      })}
    </div>
  );
}
