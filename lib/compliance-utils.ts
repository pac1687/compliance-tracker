import { ComplianceStatus, MetricSummary } from '@/types/compliance';

/**
 * Calculates dynamic compliance status and exact days remaining relative to today's date (midnight).
 */
export function calculateComplianceStatus(expirationDateStr: string | Date): {
  status: ComplianceStatus;
  daysRemaining: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(expirationDateStr);
  expiration.setHours(0, 0, 0, 0);

  const diffMs = expiration.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'EXPIRED', daysRemaining };
  } else if (daysRemaining <= 30) {
    return { status: 'EXPIRING_SOON', daysRemaining };
  } else {
    return { status: 'COMPLIANT', daysRemaining };
  }
}

/**
 * Convenience helper returning just the ComplianceStatus union value.
 */
export function getComplianceStatus(expirationDateStr: string | Date): ComplianceStatus {
  return calculateComplianceStatus(expirationDateStr).status;
}

/**
 * Human-readable contextual relative time representation.
 */
export function formatRelativeDays(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const abs = Math.abs(daysRemaining);
    return `${abs} ${abs === 1 ? 'day' : 'days'} overdue`;
  }
  if (daysRemaining === 0) {
    return 'Expires today';
  }
  return `Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
}

/**
 * Computes high-level executive dashboard metrics from a list of records.
 */
export function computeMetrics(records: { status: ComplianceStatus }[]): MetricSummary {
  const total = records.length;
  const compliant = records.filter((r) => r.status === 'COMPLIANT').length;
  const expiringSoon = records.filter((r) => r.status === 'EXPIRING_SOON').length;
  const expired = records.filter((r) => r.status === 'EXPIRED').length;
  const complianceRate = total > 0 ? Number(((compliant / total) * 100).toFixed(1)) : 0;

  return { total, compliant, expiringSoon, expired, complianceRate };
}
