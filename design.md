# Design System & UI Specification: Compliance Training & Certification Tracker

This document establishes the visual design system, component hierarchy, design tokens, and user experience patterns for the **Compliance Training & Certification Tracker**.

---

## 1. Visual Language & Core Principles

- **Executive & Dense**: High signal-to-noise ratio designed for compliance officers, engineering managers, and auditors who need to triage compliance risks in seconds.
- **Urgency-Driven Color Semantics**: Color is used purposefully to draw immediate attention to audit hazards (Expired) and upcoming deadlines (Expiring Soon) without overwhelming the interface.
- **Tactile & Responsive**: Instant visual feedback for actions (one-click renewals, deletions, filter switches) using optimistic transitions, subtle shadows, and crisp border treatments.

---

## 2. Design Tokens & Color Palette

### 2.1 Neutral Surfaces & Typography
| Token | Tailwind Class | Hex / HSL | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `bg-slate-50` / `bg-zinc-900` | `#F8FAFC` / `#18181B` | Global dashboard backdrop |
| **Surface (Card/Modal)** | `bg-white` / `bg-zinc-800` | `#FFFFFF` / `#27272A` | Metric cards, table container, dialog panels |
| **Border / Divider** | `border-slate-200` | `#E2E8F0` | Structural dividers, table borders, card outlines |
| **Text Primary** | `text-slate-900` | `#0F172A` | Card titles, employee names, primary headings |
| **Text Muted / Secondary** | `text-slate-500` | `#64748B` | Subtitles, employee email addresses, metadata labels |
| **Interactive Primary** | `bg-indigo-600` / `hover:bg-indigo-700` | `#4F46E5` | Primary CTA ("+ Log Completion"), active tab states |

### 2.2 Semantic Status Colors
| Status | Badge Background | Badge Text | Ring / Border | Icon Style |
| :--- | :--- | :--- | :--- | :--- |
| **COMPLIANT** | `bg-emerald-50` | `text-emerald-700` | `ring-1 ring-emerald-600/20` | CheckCircle2 (Emerald) |
| **EXPIRING_SOON** | `bg-amber-50` | `text-amber-700` | `ring-1 ring-amber-600/20` | Clock / AlertTriangle (Amber) |
| **EXPIRED** | `bg-rose-50` | `text-rose-700` | `ring-1 ring-rose-600/20` | ShieldAlert / AlertCircle (Rose) |

### 2.3 Typography Stack
- **Headings & UI Text**: `font-sans` (`Inter`, system-ui, -apple-system, sans-serif)
- **Dates & Monospace**: `font-mono` for deterministic alignment of ISO dates (`YYYY-MM-DD`) and days-remaining counters.

---

## 3. Layout Anatomy & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│  Navbar: App Brand ("CertifyTrack") • Live Status Badge • Help Link    │
├────────────────────────────────────────────────────────────────────────┤
│  Executive Metric Cards (4-column responsive grid):                    │
│  [ Total Records ]  [ Compliant Rate ]  [ Expiring Soon ]  [ Overdue ] │
├────────────────────────────────────────────────────────────────────────┤
│  Triage Controls Toolbar:                                              │
│  [ Search Input... ] [ Dept Dropdown ▾ ] [ Status Tabs ] [+ Log Record]│
├────────────────────────────────────────────────────────────────────────┤
│  Compliance Roster Table (Urgency Sorted):                             │
│  ┌──────────────┬────────────┬─────────────┬───────────┬──────────────┐│
│  │ Employee     │ Department │ Course      │ Expiration│ Actions      ││
│  ├──────────────┼────────────┼─────────────┼───────────┼──────────────┤│
│  │ Ada Lovelace │ Engineering│ SOC2 Secure │ [Expired] │ [Renew] [🗑] ││
│  │ Marcus Vance │ Security   │ HIPAA Train │ [12 Days] │ [Renew] [🗑] ││
│  └──────────────┴────────────┴─────────────┴───────────┴──────────────┘│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 Executive Metric Summary Cards
- **Grid Layout**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Card Structure**:
  - Top: Micro-label (`text-xs uppercase font-semibold tracking-wider text-slate-500`) + Status Icon.
  - Middle: High-contrast metric figure (`text-3xl font-extrabold text-slate-900`).
  - Bottom: Contextual subtext (e.g. `92.4% compliance rate`, `Requires immediate intervention`).

### 4.2 Triage Controls Toolbar
- **Search Bar**: Sticky-ready search input with a magnifying glass icon, keyboard shortcut indicator (`/`), and clear button.
- **Department Filter**: Custom styled select menu (`All Departments`, `Engineering`, `Security`, `Operations`, `Finance`, `Legal`, `People Ops`).
- **Status Filter Pills**: Segmented pill tabs with count badges (`All`, `Compliant`, `Expiring Soon`, `Expired`).
- **Action Buttons**:
  - Primary CTA: High-contrast button with `+` icon (`+ Log Completion`).
  - Utility CTA: Ghost button with refresh icon (`Reset Demo Data`) to easily restore clean presentation data.

### 4.3 Compliance Roster Table
- **Urgency Sort by Default**: Records with `EXPIRED` status appear first, followed by `EXPIRING_SOON`, then `COMPLIANT`.
- **Columns**:
  1. **Employee**: Two-tier line item (Full name in bold font, email in subdued 12px font below).
  2. **Department**: Clean rounded pill badge (`bg-slate-100 text-slate-600 text-xs font-medium px-2.5 py-0.5`).
  3. **Certification / Course**: Primary text with tooltip if overflowing.
  4. **Completed Date**: Subdued monospace ISO date (`YYYY-MM-DD`).
  5. **Expires On**: Primary monospace date + relative countdown pill (e.g., `in 14 days`, `3 days overdue`).
  6. **Audit Status**: Vibrant status badge with soft background and 1px colored ring.
  7. **Quick Actions**:
     - **"Mark Renewed"**: Secondary button with a circular refresh icon that immediately triggers server action.
     - **"Delete"**: Subtle red hover trash icon button with confirmation guard.
- **Empty State**: Centered illustration card with text: *"No compliance records found"* and an instant `"Load Demo Data"` button.

### 4.4 Intake Modal ("+ Log Completion")
- **Dialog Treatment**: Centered modal with glassmorphism backdrop (`backdrop-blur-sm bg-slate-900/40`).
- **Form Fields**:
  - Employee Full Name (autofocused input with validation feedback).
  - Work Email (validated email pattern).
  - Department (standard dropdown selector).
  - Course Title (autocomplete or text input).
  - Completion Date (date picker default to `Today`).
  - Expiration Date (auto-calculates to `Today + 1 Year` with manual override option).
- **Actions**: "Cancel" ghost button and "Save Record" submit button with animated spinner during pending server action transitions.

---

## 5. Micro-Interactions & Motion

- **Optimistic UI Updates**: Using React `useTransition` to prevent sluggish UI blocking while Server Actions execute.
- **Hover Transitions**: `transition duration-150 ease-in-out` on table rows, buttons, and status tabs.
- **Card Hover Elevation**: Subtle lift (`hover:shadow-md hover:border-slate-300`) on metric cards.
- **Status Switch Animation**: Smooth horizontal tab highlight indicator.
