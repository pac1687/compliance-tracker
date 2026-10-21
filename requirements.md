# Functional Requirements: Compliance Training & Certification Tracker

## 1. Dashboard Views & UI Layout

The interface must present a dense, high-signal single-page dashboard optimized for rapid triage by compliance officers, engineering managers, and team leads.

### 1.1 Executive Metric Summary Cards (Header Row)
Four responsive metric cards displayed prominently at the top of the dashboard:

1. **Total Records Tracked**:
   - Total number of active employee-certification pairs.
   - Subtext: Total records registered in database.
2. **Fully Compliant**:
   - Count and percentage of records with status = `COMPLIANT`.
   - Visual: Emerald indicator / checkmark icon.
3. **Expiring Soon ($\le$ 30 Days)**:
   - Count of records nearing expiration requiring proactive intervention.
   - Visual: Amber warning indicator / alert triangle icon.
4. **Overdue / Non-Compliant**:
   - Count of expired records failing compliance audit standards.
   - Visual: Rose danger indicator / shield alert icon.

### 1.2 Search & Filter Controls
Placed immediately above the data table to allow immediate client-side or server-driven filtering:
- **Global Search Input**: Real-time debounce or instant client-side filter matching `employee_name`, `employee_email`, or `course_name`.
- **Department Dropdown**: Filter by specific departments (`All`, `Engineering`, `Security`, `Operations`, `Finance`, `Legal`, `People Ops`).
- **Status Filter Tabs**: Quick-switch pills: `All`, `Compliant`, `Expiring Soon`, `Expired`.
- **Demo Data Reset Button**: Subdued utility button ("Reset Demo Data" with a database/refresh icon) to restore clean presentation data on demand without opening the database console.
- **Intake Action Button**: High-contrast "Log Completion" button triggering the intake modal or drawer.

### 1.3 Compliance Roster Table
Tabular view displaying records sorted by urgency (Expired and Expiring Soon sorted first by default):
- **Employee**: Full name (bold) with email subtext (`text-xs text-gray-500`).
- **Department**: Subdued pill badge or plain text.
- **Course / Certification**: Clean text display (e.g. "SOC2 Awareness", "AWS Solutions Architect").
- **Completed On**: Deterministic ISO date formatting (`YYYY-MM-DD`).
- **Expires On**: Deterministic ISO date formatting (`YYYY-MM-DD`) with relative time context (e.g. "in 12 days", "35 days ago").
- **Audit Status**: High-contrast status badge:
  - `COMPLIANT`: Green badge (`Active`)
  - `EXPIRING_SOON`: Amber badge (`Expiring Soon`)
  - `EXPIRED`: Red badge (`Expired / Non-Compliant`)
- **Actions Column**:
  - **Renew (1-Click)**: Secondary button with refresh icon ("Mark Renewed") that advances expiration by +1 year.
  - **Delete**: Ghost/danger trash button with immediate server action execution.
- **Empty State Behavior**:
  - When zero records exist (e.g. after testing deletes), the table displays a friendly empty state card with a prominent "Load Demo Records" button that invokes `resetDemoData()`.

---

## 2. User Interactions & Workflows

### 2.1 Workflow A: Record Intake (Logging a Completed Training)
- **Trigger**: Click "+ Log Completion" button.
- **Experience**: Modal dialog or collapsible card overlay with focused form inputs:
  - Employee Full Name (text, required)
  - Employee Work Email (email, required)
  - Department (select dropdown with standard list or custom text, required)
  - Course / Certification Title (text, required)
  - Completion Date (date picker, defaults to `Today`)
  - Validity Duration / Expiration Date:
    - Default preset: 1 Year (+365 days from completion date).
    - Can be manually adjusted via date input.
- **Feedback**: Loading spinner on submit button; auto-close modal on success; instant table row update via `revalidatePath`.

### 2.2 Workflow B: One-Click Renewal
- **Trigger**: User clicks "Mark Renewed" icon/button on an existing row (especially useful for Expiring Soon or Expired records).
- **Execution**:
  - Updates `completion_date` to current date (`TODAY`).
  - Sets `expiration_date` to `TODAY + 1 YEAR`.
  - Recalculates status to `COMPLIANT`.
  - Persists directly to PostgreSQL via server action.
- **Feedback**: Button enters brief pending state (`aria-busy="true"`), badge updates instantly to green `COMPLIANT`.

### 2.3 Workflow C: Record Deletion
- **Trigger**: User clicks the trash icon on a row.
- **Execution**: Deletes the row by UUID via `deleteComplianceRecord(id)`.
- **Feedback**: Row disappears from table and metric counters decrement instantly.

---

## 3. Data Validation Rules

Both client and server must enforce standard safety boundaries to maintain data integrity:

### 3.1 Field-Level Constraints
| Field | Type | Validation Rules | Error Message |
| :--- | :--- | :--- | :--- |
| `employee_name` | String | Trimmed length $\ge 2$, max 255 chars | "Employee name is required (min 2 characters)." |
| `employee_email` | String | Regex match `^[^\s@]+@[^\s@]+\.[^\s@]+$` | "Valid business email address required." |
| `department` | String | Selected from allowable options or non-empty | "Please select a department." |
| `course_name` | String | Trimmed length $\ge 3$, max 255 chars | "Course or certification name is required." |
| `completion_date` | Date | Valid ISO date, cannot be $> 30$ days in future | "Completion date cannot be in the future." |
| `expiration_date` | Date | Must be $\ge$ `completion_date` | "Expiration date must be on or after completion date." |

### 3.2 Server-Side Guard Example

```typescript
export function validateRecordInput(input: CreateRecordInput): string | null {
  if (!input.employee_name || input.employee_name.trim().length < 2) {
    return 'Employee name must be at least 2 characters.';
  }
  if (!input.employee_email || !input.employee_email.includes('@')) {
    return 'A valid email address is required.';
  }
  if (!input.course_name || input.course_name.trim().length < 3) {
    return 'Course name must be at least 3 characters.';
  }
  if (!input.completion_date || !input.expiration_date) {
    return 'Both completion and expiration dates are required.';
  }

  const comp = new Date(input.completion_date);
  const exp = new Date(input.expiration_date);
  if (exp < comp) {
    return 'Expiration date must be on or after completion date.';
  }

  return null; // Valid
}
```

---

## 4. Deployment Acceptance Criteria

To pass the technical interview standard, the project must satisfy all of the following:

- [ ] **Zero Build Warnings/Errors**: `npm run build` exits with code `0` locally and on Vercel CI.
- [ ] **Deterministic Server Rendering**: Pages must not produce hydration mismatch warnings between server HTML and client browser timestamps.
- [ ] **Environment Variable Handling**:
  - Works with standard `DATABASE_URL` or `POSTGRES_URL`.
  - Database connection fails gracefully with clear error guidance if credentials are missing.
- [ ] **Dynamic Data Handling**:
  - Dashboard route explicitly marked `export const dynamic = 'force-dynamic'` to prevent stale static generation at build time.
- [ ] **Responsive Design**: Clean display on both desktop ($1280\text{px}+$) and mobile viewports ($375\text{px}$).
- [ ] **Zero-Friction Vercel Deployment**: Live public production URL reachable with verified read/write capability to PostgreSQL.