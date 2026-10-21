# CertifyTrack — Compliance Training & Certification Tracker

[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Vercel-emerald?style=for-the-badge&logo=vercel)](https://compliance-tracker-beta-two.vercel.app/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791?style=for-the-badge&logo=postgresql)](https://neon.tech/)

**CertifyTrack** is an executive-grade compliance and certification tracking web application built for security, engineering, and operations leadership. It delivers real-time visibility into workforce training credentials, automates expiration tracking, and streamlines certification renewal workflows with sub-second feedback loops.

🔗 **Live Deployment:** [https://compliance-tracker-beta-two.vercel.app/](https://compliance-tracker-beta-two.vercel.app/)

---

## Table of Contents
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Interview & Architectural Highlights](#interview--architectural-highlights)

---

## Key Features

- **Executive Metric Cards**: Real-time summary overview tracking Total Certifications, Workforce Compliance Rate (%), Expiring Soon (within 30 days), and Overdue/Expired certifications.
- **Dynamic Runtime Status Computation**: Automatically calculates and synchronizes compliance status (`COMPLIANT`, `EXPIRING_SOON`, `EXPIRED`) on every read using UTC-safe date math, eliminating the need for brittle background cron workers.
- **Interactive Compliance Roster**:
  - Instant client-side search across employee names, email addresses, and certification titles.
  - Multi-department filter tabs (All, Engineering, Security, Finance, Operations).
  - Status filter tabs (All, Compliant, Expiring Soon, Overdue).
  - Clean pagination and responsive mobile-optimized card/table layout.
- **One-Click Renewal Workflow**: Quick renewal action immediately updates the record's completion date to today and advances expiration by 365 days, instantly refreshing compliance rates and status badges via React Server Actions.
- **New Certification Intake Modal**: Clean dialog for issuing new certifications with input validation, departmental assignment, and instant optimistic table insertion.
- **Executive Dark Mode**: Full light/dark mode support powered by Tailwind CSS 4, utilizing `useSyncExternalStore` for SSR safety and an inline `<head>` script to eliminate theme-switching flicker (FOUC).
- **Live Database Health Pill & Reset**: Visual badge confirming active pooled connection to Neon PostgreSQL, accompanied by a quick-reset action to restore initial demo data during presentations.

---

## Architecture & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) | React Server Components (RSC) for zero-JS initial data load & Partial Prerendering |
| **UI Library** | [React 19](https://react.dev/) | Actions, transitions (`useTransition`), and modern hooks |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict type definitions across database, server actions, and UI |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Modern CSS design system with `@variant dark` class isolation |
| **Icons** | [Lucide React](https://lucide.dev/) | Clean, accessible iconography |
| **Database** | [Neon PostgreSQL](https://neon.tech/) | Serverless PostgreSQL connected over PgBouncer connection pooling |
| **Driver** | [`postgres`](https://github.com/porsager/postgres) | Lightweight, zero-dependency, high-performance PostgreSQL client |
| **Hosting** | [Vercel](https://vercel.com/) | Edge-optimized deployment with automatic Git CI/CD |

---

## Database Schema

The core domain model uses a high-performance indexed table structure:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table definition
CREATE TABLE compliance_records (
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

-- Performance Indexes for search and dashboard aggregations
CREATE INDEX idx_compliance_records_department ON compliance_records(department);
CREATE INDEX idx_compliance_records_status ON compliance_records(status);
CREATE INDEX idx_compliance_records_expiration ON compliance_records(expiration_date ASC);
```

---

## Project Structure

```text
├── app/
│   ├── actions.ts           # Server Actions: CRUD mutations & demo data reset
│   ├── globals.css          # Tailwind CSS v4 directives & dark mode variant
│   ├── layout.tsx           # Root layout with anti-flash theme script
│   └── page.tsx             # Server Component with Suspense database streaming
├── components/
│   ├── DashboardView.tsx    # Client orchestrator: state, modals, and filters
│   ├── IntakeModal.tsx      # Modal form for creating compliance records
│   ├── MetricCards.tsx      # Executive metric summary cards
│   ├── RosterTable.tsx      # Interactive roster with search, filter & actions
│   └── ThemeToggle.tsx      # Light/dark mode toggle (SSR-safe via useSyncExternalStore)
├── lib/
│   ├── compliance-utils.ts  # Runtime status calculation & UTC date utilities
│   └── db.ts                # Singleton PostgreSQL client connection pool
├── types/
│   └── compliance.ts        # TypeScript models, inputs, and summary types
├── scripts/
│   └── test-phase2.mjs      # Server Action integration test suite
└── spec.md                  # Comprehensive technical specification
```

---

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- A PostgreSQL database instance (recommended: free serverless tier from [Neon](https://neon.tech))

### 1. Clone the repository
```bash
git clone https://github.com/pac1687/compliance-tracker.git
cd compliance-tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```env
DATABASE_URL="postgres://user:password@ep-xyz-pooler.region.neon.tech/neondb?sslmode=require"
```
*(Make sure to use the **pooled** connection string with the `-pooler` hostname for serverless compatibility).*

### 4. Run database migrations and seed data
Execute the SQL statements from the [Database Schema](#database-schema) section or run the seed query in your Neon SQL console.

### 5. Start the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Configuration

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon or PostgreSQL pooled connection string | `postgres://user:pass@ep-cool-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |

---

## Deployment

The project is optimized for deployment on **Vercel**:

1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com/new).
3. In **Settings > Environment Variables**, add `DATABASE_URL` with your Neon pooled connection string.
4. Click **Deploy**. Vercel will automatically build the Next.js App Router application and wire up zero-config production caching.

---

## Interview & Architectural Highlights

- **Dynamic Runtime Evaluation**: Compliance status is calculated dynamically on database retrieval based on the current date, guaranteeing that records automatically switch to `EXPIRING_SOON` (<= 30 days) or `EXPIRED` (< 0 days) without requiring cron jobs.
- **Partial Prerendering (PPR) Resilience**: Dynamic database calls in `app/page.tsx` are wrapped in `<Suspense>` boundaries to ensure compatibility with Next.js 16's strict cache component rules.
- **Zero-Flicker Dark Mode**: An inline script inside the `<head>` checks `localStorage` and `prefers-color-scheme` before the first paint, eliminating light-mode flashes on page refresh.
- **Serverless Connection Management**: Uses the lightweight `postgres` client configured with connection pool limits (`max: 10`) and idle timeouts to prevent exhausting connections in serverless edge environments.
