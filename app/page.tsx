import { Suspense } from 'react';
import { getComplianceRecords } from '@/app/actions';
import { computeMetrics } from '@/lib/compliance-utils';
import DashboardView from '@/components/DashboardView';

async function DashboardContainer() {
  const { records, isLiveDatabase } = await getComplianceRecords();
  const metrics = computeMetrics(records);

  return (
    <DashboardView
      initialRecords={records}
      isLiveDatabase={isLiveDatabase}
      metrics={metrics}
    />
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-slate-500">Loading compliance roster...</p>
          </div>
        </div>
      }
    >
      <DashboardContainer />
    </Suspense>
  );
}
