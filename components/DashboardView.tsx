'use client';

import React, { useState } from 'react';
import { ComplianceRecord, MetricSummary } from '@/types/compliance';
import MetricCards from '@/components/MetricCards';
import RosterTable from '@/components/RosterTable';
import IntakeModal from '@/components/IntakeModal';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Plus, Database, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  initialRecords: ComplianceRecord[];
  isLiveDatabase: boolean;
  metrics: MetricSummary;
}

export default function DashboardView({
  initialRecords,
  isLiveDatabase,
  metrics,
}: DashboardViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-150">
      {/* Top Executive Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                    CertifyTrack
                  </h1>
                  <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-500/30">
                    Executive Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                  Compliance Training & Certification Assurance Dashboard
                </p>
              </div>
            </div>

            {/* Right Tools & CTA */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Database Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Database className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                <span className="font-medium">
                  {isLiveDatabase ? 'Neon PostgreSQL' : 'Local Sandbox'}
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${
                    isLiveDatabase ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-900' : 'bg-amber-400'
                  }`}
                />
              </div>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Primary Intake CTA */}
              <button
                type="button"
                onClick={() => setIsIntakeOpen(true)}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-indigo-600 px-3 sm:px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Log Completion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner if in sandbox mode */}
        {!isLiveDatabase && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Running in local sandbox mode:</strong> Changes are stored in-memory. Add your Neon connection string in <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">.env.local</code> to activate live persistence.
              </span>
            </div>
          </div>
        )}

        {/* Executive Metric Summary Cards */}
        <section aria-label="Executive Metrics">
          <MetricCards
            metrics={metrics}
            selectedStatus={selectedStatus}
            onSelectStatus={(status) => setSelectedStatus(status)}
          />
        </section>

        {/* Filterable Urgency Roster Table */}
        <section aria-label="Compliance Records Roster">
          <RosterTable
            initialRecords={initialRecords}
            activeStatusFilter={selectedStatus}
            onStatusFilterChange={(status) => setSelectedStatus(status)}
            onOpenIntake={() => setIsIntakeOpen(true)}
            isLiveDb={isLiveDatabase}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-4 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} CertifyTrack • Enterprise Compliance Operations</p>
          <p>Deterministic UTC date reconciliation • Zero-drift audit sync</p>
        </div>
      </footer>

      {/* Intake Modal */}
      <IntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
      />
    </div>
  );
}
