// scripts/test-phase2.mjs
import assert from 'node:assert';
import { calculateComplianceStatus, formatRelativeDays, computeMetrics } from '../lib/compliance-utils.ts';
import {
  getComplianceRecords,
  createComplianceRecord,
  renewComplianceRecord,
  deleteComplianceRecord,
  resetDemoData,
} from '../app/actions.ts';

console.log('🧪 Starting Phase 2 Unit & Server Action Tests...\n');

// 1. Date math & Status computation test
console.log('1. Testing calculateComplianceStatus...');
const pastDate = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0];
const soonDate = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0];
const futureDate = new Date(Date.now() + 200 * 24 * 3600 * 1000).toISOString().split('T')[0];

const resPast = calculateComplianceStatus(pastDate);
assert.strictEqual(resPast.status, 'EXPIRED', 'Past date must be EXPIRED');
assert.ok(resPast.daysRemaining < 0, 'Days remaining must be negative for past date');

const resSoon = calculateComplianceStatus(soonDate);
assert.strictEqual(resSoon.status, 'EXPIRING_SOON', 'Date within 30 days must be EXPIRING_SOON');
assert.ok(resSoon.daysRemaining <= 30 && resSoon.daysRemaining >= 0, 'Days remaining must be between 0 and 30');

const resFuture = calculateComplianceStatus(futureDate);
assert.strictEqual(resFuture.status, 'COMPLIANT', 'Date > 30 days must be COMPLIANT');
assert.ok(resFuture.daysRemaining > 30, 'Days remaining must be > 30');

console.log('   ✅ calculateComplianceStatus tests passed!');

// 2. Relative Days Formatting Test
console.log('2. Testing formatRelativeDays...');
assert.strictEqual(formatRelativeDays(-3), '3 days overdue');
assert.strictEqual(formatRelativeDays(0), 'Expires today');
assert.strictEqual(formatRelativeDays(12), 'Expires in 12 days');
console.log('   ✅ formatRelativeDays tests passed!');

// 3. Metrics Summary Test
console.log('3. Testing computeMetrics...');
const sampleRecords = [
  { status: 'COMPLIANT' },
  { status: 'COMPLIANT' },
  { status: 'EXPIRING_SOON' },
  { status: 'EXPIRED' },
];
const metrics = computeMetrics(sampleRecords);
assert.strictEqual(metrics.total, 4);
assert.strictEqual(metrics.compliant, 2);
assert.strictEqual(metrics.expiringSoon, 1);
assert.strictEqual(metrics.expired, 1);
assert.strictEqual(metrics.complianceRate, 50.0);
console.log('   ✅ computeMetrics tests passed!');

// 4. Server Actions CRUD Test
console.log('4. Testing Server Actions CRUD & Reset...');

// Fetch initial records
const initialFetch = await getComplianceRecords();
console.log(`   - Fetched initial records: ${initialFetch.records.length} records found (Live DB: ${initialFetch.isLiveDatabase})`);
assert.ok(initialFetch.records.length >= 7, 'Expected at least 7 seed records');

// Create record with validation guard test
const invalidCreate = await createComplianceRecord({
  employee_name: '',
  employee_email: 'invalid-email',
  department: 'Engineering',
  course_name: 'Test Course',
  completion_date: '2026-01-01',
  expiration_date: '2026-01-02',
});
assert.strictEqual(invalidCreate.success, false, 'Validation should reject empty name');

// Create valid record
const validCreate = await createComplianceRecord({
  employee_name: 'Ada Lovelace',
  employee_email: 'ada@cyberdyne.io',
  department: 'Engineering',
  course_name: 'HIPAA Security Protocol',
  completion_date: new Date().toISOString().split('T')[0],
  expiration_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
});
assert.strictEqual(validCreate.success, true, 'Valid record should be created');
const createdId = validCreate.data.id;
console.log(`   - Created test record with ID: ${createdId}`);

// Verify record was inserted
const afterCreate = await getComplianceRecords();
assert.ok(afterCreate.records.some((r) => r.id === createdId), 'New record should exist in records list');

// Renew record test
const renewRes = await renewComplianceRecord(createdId);
assert.strictEqual(renewRes.success, true, 'Renewal action should succeed');
console.log('   - Renewed test record');

// Delete record test
const deleteRes = await deleteComplianceRecord(createdId);
assert.strictEqual(deleteRes.success, true, 'Delete action should succeed');
const afterDelete = await getComplianceRecords();
assert.ok(!afterDelete.records.some((r) => r.id === createdId), 'Deleted record should no longer exist');
console.log('   - Deleted test record');

// Reset demo data test
const resetRes = await resetDemoData();
assert.strictEqual(resetRes.success, true, 'Reset demo data should succeed');
const afterReset = await getComplianceRecords();
assert.strictEqual(afterReset.records.length, 7, 'Reset records should restore exact 7 seed items');
console.log('   - Reset demo records confirmed');

console.log('\n🎉 ALL PHASE 2 TESTS PASSED SUCCESSFULLY!');
