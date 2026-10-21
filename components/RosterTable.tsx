'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { ComplianceRecord, ComplianceStatus } from '@/types/compliance';
import { renewComplianceRecord, deleteComplianceRecord, resetDemoData } from '@/app/actions';
import { formatRelativeDays } from '@/lib/compliance-utils';
import {
  Search,
  Filter,
  RotateCw,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';

interface RosterTableProps {
  initialRecords: ComplianceRecord[];
  activeStatusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onOpenIntake: () => void;
  isLiveDb: boolean;
}

const DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Security',
  'Operations',
  'Finance',
  'Legal',
  'People Ops',
];

const STATUS_URGENCY: Record<ComplianceStatus, number> = {
  EXPIRED: 1,
  EXPIRING_SOON: 2,
  COMPLIANT: 3,
};

export default function RosterTable({
  initialRecords,
  activeStatusFilter,
  onStatusFilterChange,
  onOpenIntake,
  isLiveDb,
}: RosterTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    return initialRecords
      .filter((record) => {
        // Status filter
        if (activeStatusFilter !== 'ALL' && record.status !== activeStatusFilter) {
          return false;
        }

        // Department filter
        if (
          selectedDept !== 'All Departments' &&
          record.department.toLowerCase() !== selectedDept.toLowerCase()
        ) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = record.employee_name.toLowerCase().includes(q);
          const matchEmail = record.employee_email.toLowerCase().includes(q);
          const matchCourse = record.course_name.toLowerCase().includes(q);
          if (!matchName && !matchEmail && !matchCourse) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by urgency: EXPIRED -> EXPIRING_SOON -> COMPLIANT
        const urgencyDiff = STATUS_URGENCY[a.status] - STATUS_URGENCY[b.status];
        if (urgencyDiff !== 0) return urgencyDiff;
        // Secondary sort by expiration date ascending
        return (
          new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
        );
      });
  }, [initialRecords, activeStatusFilter, selectedDept, searchQuery]);

  // Counts for status tabs
  const counts = useMemo(() => {
    return {
      ALL: initialRecords.length,
      COMPLIANT: initialRecords.filter((r) => r.status === 'COMPLIANT').length,
      EXPIRING_SOON: initialRecords.filter((r) => r.status === 'EXPIRING_SOON').length,
      EXPIRED: initialRecords.filter((r) => r.status === 'EXPIRED').length,
    };
  }, [initialRecords]);

  const handleRenew = (id: string) => {
    setActiveActionId(id);
    startTransition(async () => {
      await renewComplianceRecord(id);
      setActiveActionId(null);
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this compliance record?')) {
      setActiveActionId(id);
      startTransition(async () => {
        await deleteComplianceRecord(id);
        setActiveActionId(null);
      });
    }
  };

  const handleReset = () => {
    if (confirm('Reset database to the initial 7 demo compliance records?')) {
      startTransition(async () => {
        await resetDemoData();
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-colors">
      {/* Table Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'All Records', count: counts.ALL },
              { id: 'COMPLIANT', label: 'Compliant', count: counts.COMPLIANT },
              { id: 'EXPIRING_SOON', label: 'Expiring Soon', count: counts.EXPIRING_SOON },
              { id: 'EXPIRED', label: 'Expired', count: counts.EXPIRED },
            ].map((tab) => {
              const active = activeStatusFilter === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => onStatusFilterChange(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      active
                        ? 'bg-slate-800 dark:bg-slate-200 text-slate-200 dark:text-slate-800'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleReset}
              disabled={isPending}
              title="Reset records to default demo data"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset Demo Data</span>
            </button>

            <button
              type="button"
              onClick={onOpenIntake}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Log Completion</span>
            </button>
          </div>
        </div>

        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Global Search */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search by employee name, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 py-1.5 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 bg-slate-50/50 dark:bg-slate-950/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Dropdown */}
          <div className="relative sm:w-56">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 py-1.5 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 bg-white dark:bg-slate-800 cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {dept}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
          <thead className="bg-slate-50/75 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th scope="col" className="px-5 py-3">
                Employee
              </th>
              <th scope="col" className="px-4 py-3">
                Department
              </th>
              <th scope="col" className="px-4 py-3">
                Certification / Training
              </th>
              <th scope="col" className="px-4 py-3">
                Completed
              </th>
              <th scope="col" className="px-4 py-3">
                Expires On
              </th>
              <th scope="col" className="px-4 py-3">
                Audit Status
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-3 text-slate-400">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        No compliance records found
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        {searchQuery || selectedDept !== 'All Departments'
                          ? 'Try adjusting your search criteria or resetting filters.'
                          : 'No records registered in the database yet.'}
                      </p>
                    </div>
                    {initialRecords.length === 0 && (
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        Load Demo Records
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isItemPending = isPending && activeActionId === record.id;
                const daysRemaining = record.daysRemaining ?? 0;

                // Status badge styling
                let badgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-500/20';
                let StatusIcon = CheckCircle2;
                let statusLabel = 'Compliant';

                if (record.status === 'COMPLIANT') {
                  badgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 ring-emerald-600/20 dark:ring-emerald-500/30';
                  StatusIcon = CheckCircle2;
                  statusLabel = 'Compliant';
                } else if (record.status === 'EXPIRING_SOON') {
                  badgeClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 ring-amber-600/20 dark:ring-amber-500/30';
                  StatusIcon = Clock;
                  statusLabel = 'Expiring Soon';
                } else if (record.status === 'EXPIRED') {
                  badgeClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 ring-rose-600/20 dark:ring-rose-500/30';
                  StatusIcon = AlertTriangle;
                  statusLabel = 'Expired';
                }

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Employee */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {record.employee_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {record.employee_email}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                        {record.department}
                      </span>
                    </td>

                    {/* Course */}
                    <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {record.course_name}
                    </td>

                    {/* Completed */}
                    <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {record.completion_date}
                    </td>

                    {/* Expires On */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-slate-900 dark:text-white">
                        {record.expiration_date}
                      </div>
                      <div
                        className={`text-[10px] font-medium mt-0.5 ${
                          record.status === 'EXPIRED'
                            ? 'text-rose-600 dark:text-rose-400'
                            : record.status === 'EXPIRING_SOON'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {formatRelativeDays(daysRemaining)}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${badgeClass}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRenew(record.id)}
                          disabled={isItemPending}
                          title="Mark renewed (+1 year)"
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors disabled:opacity-50"
                        >
                          {isItemPending ? (
                            <Loader2 className="h-3 w-3 animate-spin text-slate-500" />
                          ) : (
                            <RotateCw className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                          )}
                          <span>Renew</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(record.id)}
                          disabled={isItemPending}
                          title="Delete record"
                          className="rounded-md p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 px-5 py-3 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div>
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredRecords.length}</span>{' '}
          of <span className="font-semibold text-slate-700 dark:text-slate-200">{initialRecords.length}</span> total records
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              isLiveDb ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span>{isLiveDb ? 'Live PostgreSQL (Neon)' : 'Demo Sandbox'}</span>
        </div>
      </div>
    </div>
  );
}
