# Incremental Implementation Tasks: Execution Blueprint

This blueprint breaks down the end-to-end development and deployment of the **Compliance Training & Certification Tracker** into sequential phases. Every task includes a binary completion checkbox `[ ]` and explicit pitfalls to avoid.

---

## Phase 1: Project Setup, Database & Connection Layer

**Goal:** Establish a runnable Next.js 14+ project with Tailwind CSS, provision the PostgreSQL schema, and verify live database connectivity.

### Tasks
- [x] **1.1 Scaffold Next.js Application**
  - Run terminal command:
    ```bash
    npx create-next-app@latest compliance-tracker --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
    cd compliance-tracker
    ```
  - Install database client (prefer `postgres` or `@neondatabase/serverless` for lightweight zero-dependency connection):
    ```bash
    npm install postgres lucide-react
    ```
- [x] **1.2 Provision Database & Execute Schema**
  - Open Neon (neon.tech) or Supabase (supabase.com) SQL Editor.
  - Run the schema and seed scripts from `spec.md` (creating `compliance_records` table, indexes, and initial 7 rows).
  - Copy the pooled connection string (`postgres://...sslmode=require`).
- [x] **1.3 Configure Environment & Database Client**
  - Create `.env.local`:
    ```env
    DATABASE_URL="postgres://user:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require"
    ```
  - Create `lib/db.ts`:
    ```typescript
    import postgres from 'postgres';

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.warn('⚠️ DATABASE_URL is not set. Database operations will fail.');
    }

    // Reuse client across hot-reloads in development
    const sql = postgres(connectionString || '', {
      ssl: 'require',
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });

    export default sql;
    ```
- [x] **1.4 Verify Local Connectivity**
  - Create a quick verification test or start `npm run dev` to ensure no dependency errors.

> ⚠️ **Pitfalls to Avoid:**
> - *Connection exhaustion in serverless:* Never instantiate `postgres()` inside a handler function without reusing the connection singleton, otherwise serverless spin-ups exhaust connection pools.
> - *Direct vs Pooled URL:* If using Supabase or Neon, always use the **pooled** connection port (`6543` on Supabase, `-pooler` host on Neon) rather than the direct connection port.

---

## Phase 2: Domain Logic & Server Actions

**Goal:** Implement status computation, validation guards, and server actions for fetching, inserting, renewing, and deleting compliance records.

### Tasks
- [ ] **2.1 TypeScript Domain Types & Date Utility**
  - Create `types/compliance.ts` with `ComplianceRecord`, `CreateRecordInput`, `ComplianceStatus`, and `MetricSummary`.
  - Create `lib/compliance-utils.ts` to implement:
    ```typescript
    import { ComplianceStatus } from '@/types/compliance';

    export function getComplianceStatus(expirationDate: string | Date): ComplianceStatus {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exp = new Date(expirationDate);
      exp.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'EXPIRED';
      if (diffDays <= 30) return 'EXPIRING_SOON';
      return 'COMPLIANT';
    }
    ```
- [ ] **2.2 Implement Server Actions (`app/actions.ts`)**
  - Create `getComplianceRecords()` with status auto-computation so runtime dates stay accurate without cron jobs:
    ```typescript
    'use server';
    import sql from '@/lib/db';
    import { getComplianceStatus } from '@/lib/compliance-utils';
    import { revalidatePath } from 'next/cache';
    import { ComplianceRecord, CreateRecordInput } from '@/types/compliance';

    export async function getComplianceRecords() {
      try {
        const rows = await sql<ComplianceRecord[]>`
          SELECT * FROM compliance_records ORDER BY expiration_date ASC
        `;
        // Runtime sync status in case dates advanced
        return rows.map(r => ({
          ...r,
          status: getComplianceStatus(r.expiration_date),
          completion_date: new Date(r.completion_date).toISOString().split('T')[0],
          expiration_date: new Date(r.expiration_date).toISOString().split('T')[0],
        }));
      } catch (err) {
        console.error('Fetch error:', err);
        return [];
      }
    }
    ```
  - Implement `createComplianceRecord(formData)`:
    - Validate inputs (email format, non-empty strings, `exp >= comp`).
    - Calculate initial status.
    - Insert into SQL.
    - Call `revalidatePath('/')`.
  - Implement `renewComplianceRecord(id)`:
    - Set `completion_date = CURRENT_DATE`.
    - Set `expiration_date = CURRENT_DATE + INTERVAL '1 year'`.
    - Set `status = 'COMPLIANT'`.
    - Call `revalidatePath('/')`.
  - Implement `deleteComplianceRecord(id)`:
    - Execute `DELETE FROM compliance_records WHERE id = ${id}`.
    - Call `revalidatePath('/')`.
  - Implement `resetDemoData()`:
    - Truncate or delete existing rows.
    - Re-insert default seed rows using `CURRENT_DATE +/- INTERVAL`.
    - Call `revalidatePath('/')`.
- [ ] **2.3 Sanity Check Server Actions**
  - Verify zero TypeScript compiler errors (`npx tsc --noEmit`).

> ⚠️ **Pitfalls to Avoid:**
> - *Timezone Drift:* PostgreSQL `DATE` types converted to JavaScript `Date` can shift back by one day depending on the server's local timezone. Always format as ISO `YYYY-MM-DD` strings.
> - *Forgetting `revalidatePath`*: Mutating the database without calling `revalidatePath('/')` leaves the UI showing stale data.

---

## Phase 3: UI Layout & Component Assembly

**Goal:** Assemble the responsive executive dashboard: metric cards, search/filter controls, interactive intake modal, and the roster table with one-click actions.

### Tasks
- [ ] **3.1 Executive Metric Summary Cards**
  - Create `components/MetricCards.tsx`:
    - Total Tracked Records.
    - Compliant Count + Compliance Rate %.
    - Expiring Soon Count (styled in warning amber).
    - Overdue / Non-Compliant Count (styled in urgent rose).
- [ ] **3.2 Record Intake Modal / Form**
  - Create `components/IntakeModal.tsx` (`'use client'`):
    - Input fields: Full Name, Email, Department (select dropdown), Course Title, Completion Date (default `today`), Expiration Date (default `+1 year`).
    - Client-side submit handler with `useTransition` for instant loading spinner feedback.
    - Auto-close on success and reset form.
- [ ] **3.3 Filterable Roster Table & Action Buttons**
  - Create `components/RosterTable.tsx` (`'use client'`):
    - Search input (live filtering by name, email, or course).
    - Department filter select dropdown.
    - Status tabs (`All`, `Compliant`, `Expiring Soon`, `Expired`).
    - Rows with Status Badges:
      - `COMPLIANT`: `bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20`
      - `EXPIRING_SOON`: `bg-amber-50 text-amber-700 ring-1 ring-amber-600/20`
      - `EXPIRED`: `bg-rose-50 text-rose-700 ring-1 ring-rose-600/20`
    - Action buttons:
      - "Mark Renewed" button invoking `renewComplianceRecord(id)`.
      - Delete icon invoking `deleteComplianceRecord(id)`.
      - Header "Reset Demo Data" button and table empty state with a "Load Demo Records" trigger.
- [ ] **3.4 Dashboard Page Integration (`app/page.tsx`)**
  - Assemble components in `app/page.tsx`:
    - Mark file `export const dynamic = 'force-dynamic';`.
    - Fetch initial records via `getComplianceRecords()`.
    - Compute metrics and pass down to `MetricCards` and `RosterTable`.

> ⚠️ **Pitfalls to Avoid:**
> - *Client/Server Hydration Mismatch:* Rendering `new Date().toLocaleDateString()` directly in JSX causes mismatch between server rendering and browser timezone. Keep dates as static `YYYY-MM-DD` strings or format inside a client hook.
> - *Table layout blowups on mobile:* Wrap the table in `overflow-x-auto` to prevent viewport distortion on mobile screens.

---

## Phase 4: Git, Vercel Deployment & Environment Config

**Goal:** Push repository to GitHub, trigger Vercel build, inject environment variables, and verify a zero-error deployment.

### Tasks
- [ ] **4.1 Production Build Test Locally**
  - Run:
    ```bash
    npm run build
    ```
  - Verify build outputs:
    - Route `/` rendered as Dynamic (`λ`).
    - Zero TypeScript compilation errors.
    - Zero ESLint blocking warnings.
- [ ] **4.2 Git Initialization & GitHub Push**
  - Initialize and push:
    ```bash
    git init
    git add .
    git commit -m "feat: complete compliance training & certification tracker"
    gh repo create compliance-tracker --public --source=. --push
    # (Or manually link remote: git remote add origin <URL> && git push -u origin main)
    ```
- [ ] **4.3 Vercel Deployment & Environment Variable Injection**
  - Option A (Vercel CLI):
    ```bash
    npx vercel --prod --env DATABASE_URL="<YOUR_POSTGRES_URL>"
    ```
  - Option B (Vercel Dashboard):
    - Import GitHub repository.
    - In **Environment Variables**, add `DATABASE_URL` with pooled connection string.
    - Click **Deploy**.
    - Watch deployment logs until green "Ready" state is achieved.

> ⚠️ **Pitfalls to Avoid:**
> - *Missing `DATABASE_URL` on Vercel:* If Next.js tries to statically optimize a page at build time without `DATABASE_URL`, the build will crash. Ensure `export const dynamic = 'force-dynamic'` is present in `app/page.tsx` or set the env var in Vercel before the first build.
> - *Untracked `.env.local`:* Never commit credentials to GitHub; inject them strictly via Vercel Project Settings.

---

## Phase 5: Smoke Testing & Verification

**Goal:** Validate all live user paths on the production URL and verify key interactive workflows.

### Tasks
- [ ] **5.1 End-to-End Smoke Test on Production URL**
  - [ ] **Metric Cards Check:** Confirm total count matches number of rows and percentages are accurate.
  - [ ] **Intake Form:** Add a new record (e.g. "Ada Lovelace", "ada@cyberdyne.io", "Engineering", "HIPAA Security", today, +1 year). Verify table updates instantly.
  - [ ] **One-Click Renewal:** Find an expired or expiring record, click "Mark Renewed". Verify badge changes to emerald `COMPLIANT` and stats re-calculate.
  - [ ] **Search & Filters:** Search for "Ada", filter by department "Engineering", click "Expiring Soon" tab. Confirm instant reactivity.
  - [ ] **Delete Action:** Delete a test record and verify clean removal.
