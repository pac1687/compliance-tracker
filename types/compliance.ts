export type ComplianceStatus = 'COMPLIANT' | 'EXPIRING_SOON' | 'EXPIRED';

export interface ComplianceRecord {
  id: string;
  employee_name: string;
  employee_email: string;
  department: string;
  course_name: string;
  completion_date: string; // ISO string (YYYY-MM-DD)
  expiration_date: string; // ISO string (YYYY-MM-DD)
  status: ComplianceStatus;
  created_at?: string;
  daysRemaining?: number;
}

export interface CreateRecordInput {
  employee_name: string;
  employee_email: string;
  department: string;
  course_name: string;
  completion_date: string; // YYYY-MM-DD
  expiration_date: string; // YYYY-MM-DD
}

export interface MetricSummary {
  total: number;
  compliant: number;
  expiringSoon: number;
  expired: number;
  complianceRate: number; // Percentage rounded to 1 decimal
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
