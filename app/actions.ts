'use server';

import { revalidatePath } from 'next/cache';
import sql, { ensureDatabaseSchema, seedDatabase } from '@/lib/db';
import { calculateComplianceStatus } from '@/lib/compliance-utils';
import { ComplianceRecord, CreateRecordInput, ActionResponse } from '@/types/compliance';

function safeRevalidatePath(path = '/') {
  try {
    revalidatePath(path);
  } catch {
    // Safely no-op when executed outside a Next.js server request context (e.g. unit tests)
  }
}

// Initial baseline seed data for demonstration and fallback
function getInitialDemoRecords(): ComplianceRecord[] {
  return [
    {
      id: 'demo-1',
      employee_name: 'Sarah Connor',
      employee_email: 's.connor@cyberdyne.io',
      department: 'Security',
      course_name: 'SOC2 Security Awareness 2026',
      completion_date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 305 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'COMPLIANT',
    },
    {
      id: 'demo-2',
      employee_name: 'Marcus Wright',
      employee_email: 'm.wright@cyberdyne.io',
      department: 'Engineering',
      course_name: 'AWS Certified Solutions Architect',
      completion_date: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 185 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'COMPLIANT',
    },
    {
      id: 'demo-3',
      employee_name: 'Elena Rostova',
      employee_email: 'e.rostova@cyberdyne.io',
      department: 'Finance',
      course_name: 'Anti-Money Laundering (AML) v3',
      completion_date: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 275 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'COMPLIANT',
    },
    {
      id: 'demo-4',
      employee_name: 'James Holden',
      employee_email: 'j.holden@cyberdyne.io',
      department: 'Operations',
      course_name: 'OSHA Standard Safety Protocol',
      completion_date: new Date(Date.now() - 345 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'EXPIRING_SOON',
    },
    {
      id: 'demo-5',
      employee_name: 'Naomi Nagata',
      employee_email: 'n.nagata@cyberdyne.io',
      department: 'Engineering',
      course_name: 'Secure Code Review & OWASP Top 10',
      completion_date: new Date(Date.now() - 355 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'EXPIRING_SOON',
    },
    {
      id: 'demo-6',
      employee_name: 'Alex Kamal',
      employee_email: 'a.kamal@cyberdyne.io',
      department: 'Operations',
      course_name: 'Hazardous Materials Handling',
      completion_date: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() - 35 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'EXPIRED',
    },
    {
      id: 'demo-7',
      employee_name: 'Amos Burton',
      employee_email: 'a.burton@cyberdyne.io',
      department: 'Security',
      course_name: 'Physical Security & Access Control',
      completion_date: new Date(Date.now() - 420 * 24 * 3600 * 1000).toISOString().split('T')[0],
      expiration_date: new Date(Date.now() - 55 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'EXPIRED',
    },
  ];
}

let localRecords: ComplianceRecord[] = getInitialDemoRecords();
let schemaChecked = false;

/**
 * Fetches compliance records with dynamic runtime status calculations.
 */
export async function getComplianceRecords(): Promise<{
  records: ComplianceRecord[];
  isLiveDatabase: boolean;
}> {
  if (sql) {
    try {
      if (!schemaChecked) {
        await ensureDatabaseSchema();
        schemaChecked = true;
      }

      const rows = await sql<
        {
          id: string;
          employee_name: string;
          employee_email: string;
          department: string;
          course_name: string;
          completion_date: string;
          expiration_date: string;
          status: string;
          created_at: string;
        }[]
      >`
        SELECT * FROM compliance_records ORDER BY expiration_date ASC
      `;

      const records: ComplianceRecord[] = rows.map((r) => {
        const compDateStr = new Date(r.completion_date).toISOString().split('T')[0];
        const expDateStr = new Date(r.expiration_date).toISOString().split('T')[0];
        const calc = calculateComplianceStatus(expDateStr);

        return {
          id: String(r.id),
          employee_name: r.employee_name,
          employee_email: r.employee_email,
          department: r.department,
          course_name: r.course_name,
          completion_date: compDateStr,
          expiration_date: expDateStr,
          status: calc.status,
          daysRemaining: calc.daysRemaining,
          created_at: r.created_at ? new Date(r.created_at).toISOString() : undefined,
        };
      });

      return { records, isLiveDatabase: true };
    } catch (err) {
      console.error('PostgreSQL query error, using local fallback store:', err);
    }
  }

  // Local fallback
  const records = localRecords.map((r) => {
    const calc = calculateComplianceStatus(r.expiration_date);
    return {
      ...r,
      status: calc.status,
      daysRemaining: calc.daysRemaining,
    };
  });

  return { records, isLiveDatabase: false };
}

/**
 * Validates and logs a new compliance record.
 */
export async function createComplianceRecord(
  input: CreateRecordInput
): Promise<ActionResponse<ComplianceRecord>> {
  try {
    // Input validation guards
    if (!input.employee_name?.trim()) {
      return { success: false, error: 'Employee name is required.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.employee_email || !emailRegex.test(input.employee_email.trim())) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (!input.department?.trim()) {
      return { success: false, error: 'Department is required.' };
    }
    if (!input.course_name?.trim()) {
      return { success: false, error: 'Course or certification title is required.' };
    }
    if (!input.completion_date) {
      return { success: false, error: 'Completion date is required.' };
    }
    if (!input.expiration_date) {
      return { success: false, error: 'Expiration date is required.' };
    }
    if (new Date(input.expiration_date) < new Date(input.completion_date)) {
      return { success: false, error: 'Expiration date cannot be earlier than completion date.' };
    }

    const calc = calculateComplianceStatus(input.expiration_date);

    if (sql) {
      try {
        const inserted = await sql`
          INSERT INTO compliance_records (
            employee_name,
            employee_email,
            department,
            course_name,
            completion_date,
            expiration_date,
            status
          ) VALUES (
            ${input.employee_name.trim()},
            ${input.employee_email.trim().toLowerCase()},
            ${input.department.trim()},
            ${input.course_name.trim()},
            ${input.completion_date},
            ${input.expiration_date},
            ${calc.status}
          )
          RETURNING *
        `;

        safeRevalidatePath('/');
        const row = inserted[0];
        return {
          success: true,
          data: {
            id: String(row.id),
            employee_name: row.employee_name,
            employee_email: row.employee_email,
            department: row.department,
            course_name: row.course_name,
            completion_date: new Date(row.completion_date).toISOString().split('T')[0],
            expiration_date: new Date(row.expiration_date).toISOString().split('T')[0],
            status: calc.status,
            daysRemaining: calc.daysRemaining,
          },
        };
      } catch (dbErr) {
        console.error('PostgreSQL insert error, mutating local store instead:', dbErr);
      }
    }

    const newRecord: ComplianceRecord = {
      id: `local-${Date.now()}`,
      employee_name: input.employee_name.trim(),
      employee_email: input.employee_email.trim().toLowerCase(),
      department: input.department.trim(),
      course_name: input.course_name.trim(),
      completion_date: input.completion_date,
      expiration_date: input.expiration_date,
      status: calc.status,
      daysRemaining: calc.daysRemaining,
    };

    localRecords.unshift(newRecord);
    safeRevalidatePath('/');
    return { success: true, data: newRecord };
  } catch (error) {
    console.error('Create record error:', error);
    return { success: false, error: 'Failed to create compliance record.' };
  }
}

/**
 * Renews an existing compliance record by advancing expiration by +1 year and resetting status to COMPLIANT.
 */
export async function renewComplianceRecord(id: string): Promise<ActionResponse> {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    if (sql) {
      try {
        await sql`
          UPDATE compliance_records
          SET
            completion_date = CURRENT_DATE,
            expiration_date = CURRENT_DATE + INTERVAL '1 year',
            status = 'COMPLIANT'
          WHERE id = ${id}
        `;
        safeRevalidatePath('/');
        return { success: true };
      } catch (dbErr) {
        console.error('PostgreSQL update error, mutating local store:', dbErr);
      }
    }

    localRecords = localRecords.map((r) =>
      r.id === id
        ? {
            ...r,
            completion_date: todayStr,
            expiration_date: nextYearStr,
            status: 'COMPLIANT',
            daysRemaining: 365,
          }
        : r
    );

    safeRevalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Renew record error:', error);
    return { success: false, error: 'Failed to renew certification.' };
  }
}

/**
 * Deletes a compliance record.
 */
export async function deleteComplianceRecord(id: string): Promise<ActionResponse> {
  try {
    if (sql) {
      try {
        await sql`DELETE FROM compliance_records WHERE id = ${id}`;
        safeRevalidatePath('/');
        return { success: true };
      } catch (dbErr) {
        console.error('PostgreSQL delete error, mutating local store:', dbErr);
      }
    }

    localRecords = localRecords.filter((r) => r.id !== id);
    safeRevalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Delete record error:', error);
    return { success: false, error: 'Failed to delete certification record.' };
  }
}

/**
 * Resets data back to the clean 7 seed demo records.
 */
export async function resetDemoData(): Promise<ActionResponse> {
  try {
    if (sql) {
      try {
        await sql`TRUNCATE TABLE compliance_records`;
        await seedDatabase();
        safeRevalidatePath('/');
        return { success: true };
      } catch (dbErr) {
        console.error('PostgreSQL reset error, resetting local store:', dbErr);
      }
    }

    localRecords = getInitialDemoRecords();
    safeRevalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Reset demo data error:', error);
    return { success: false, error: 'Failed to reset demo dataset.' };
  }
}
