import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not configured. Database operations will use fallback mode.');
}

const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

// Reuse connection client across hot-reloads in development
export const sql =
  globalForPostgres.sql ??
  (connectionString
    ? postgres(connectionString, {
        ssl: 'require',
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      })
    : null);

if (process.env.NODE_ENV !== 'production' && sql) {
  globalForPostgres.sql = sql;
}

/**
 * Initializes the compliance_records table and indexes in PostgreSQL if they do not exist.
 */
export async function ensureDatabaseSchema() {
  if (!sql) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS compliance_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_name VARCHAR(255) NOT NULL,
        employee_email VARCHAR(255) NOT NULL,
        department VARCHAR(100) NOT NULL,
        course_name VARCHAR(255) NOT NULL,
        completion_date DATE NOT NULL,
        expiration_date DATE NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'COMPLIANT',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_compliance_records_department ON compliance_records(department);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_compliance_records_status ON compliance_records(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_compliance_records_expiration ON compliance_records(expiration_date ASC);`;

    const countRes = await sql`SELECT count(*)::int as count FROM compliance_records`;
    if (countRes[0]?.count === 0) {
      await seedDatabase();
    }
  } catch (err) {
    console.error('Failed to initialize PostgreSQL schema:', err);
  }
}

/**
 * Inserts the realistic initial seed dataset.
 */
export async function seedDatabase() {
  if (!sql) return;

  await sql`
    INSERT INTO compliance_records (employee_name, employee_email, department, course_name, completion_date, expiration_date, status)
    VALUES
      ('Sarah Connor', 's.connor@cyberdyne.io', 'Security', 'SOC2 Security Awareness 2026', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 'COMPLIANT'),
      ('Marcus Wright', 'm.wright@cyberdyne.io', 'Engineering', 'AWS Certified Solutions Architect', CURRENT_DATE - INTERVAL '180 days', CURRENT_DATE + INTERVAL '185 days', 'COMPLIANT'),
      ('Elena Rostova', 'e.rostova@cyberdyne.io', 'Finance', 'Anti-Money Laundering (AML) v3', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 'COMPLIANT'),
      ('James Holden', 'j.holden@cyberdyne.io', 'Operations', 'OSHA Standard Safety Protocol', CURRENT_DATE - INTERVAL '345 days', CURRENT_DATE + INTERVAL '20 days', 'EXPIRING_SOON'),
      ('Naomi Nagata', 'n.nagata@cyberdyne.io', 'Engineering', 'Secure Code Review & OWASP Top 10', CURRENT_DATE - INTERVAL '355 days', CURRENT_DATE + INTERVAL '10 days', 'EXPIRING_SOON'),
      ('Alex Kamal', 'a.kamal@cyberdyne.io', 'Operations', 'Hazardous Materials Handling', CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '35 days', 'EXPIRED'),
      ('Amos Burton', 'a.burton@cyberdyne.io', 'Security', 'Physical Security & Access Control', CURRENT_DATE - INTERVAL '420 days', CURRENT_DATE - INTERVAL '55 days', 'EXPIRED');
  `;
}

export default sql;
