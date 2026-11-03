# 🏫 School Management System - Complete UI Upgrade Plan

> **Date:** 2026-07-13
> **Current UI Rating:** 4/10
> **Target UI Rating:** 8-9/10
> **Style:** Modern Minimal (Linear/Notion inspired)

---

## 📦 Phase 1: Install Dependencies

```bash
npm install recharts framer-motion @tanstack/react-table react-hook-form zod @hookform/resolvers
```

| Package | Purpose |
|---------|---------|
| recharts | Charts for dashboards, reports, analytics |
| framer-motion | Page transitions, staggered animations, exit animations |
| @tanstack/react-table | Sortable, filterable data tables |
| react-hook-form + zod | Form validation, multi-step wizards |

---

## 🎨 Phase 2: globals.css Upgrade

**File:** `src/app/globals.css`

Changes:
- Add skeleton pulse animation (`.animate-skeleton`)
- Add stagger animation utilities (`.stagger-1` through `.stagger-6`)
- Add `prefers-reduced-motion` media query
- Add smooth color transition on dark mode toggle (`transition-colors duration-300`)
- Add gradient utilities (`.bg-gradient-primary`, `.bg-gradient-mesh`)
- Add focus-visible global styles
- Improve custom scrollbar for Firefox

---

## 🧩 Phase 3: Core UI Components Upgrade

### 3.1 Button (`src/components/ui/button.tsx`)
- Add `loading` prop with inline spinner icon
- Add `active:scale-[0.98]` to ALL variants (not just primary)
- Add `icon` size variant for icon-only buttons
- Add gradient variant for primary CTAs
- Add `asChild` pattern via render prop

### 3.2 Card (`src/components/ui/card.tsx`)
- Add hover lift effect: `hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`
- Fix `stat` variant (currently no-op - check actually changes styles)
- Add `accentColor` prop for colored top border stripe
- Add `onClick` prop for clickable cards with cursor-pointer
- Add `loading` prop for skeleton placeholder state

### 3.3 Table (`src/components/ui/table.tsx`)
- Add column sorting (click header arrows to sort)
- Add row selection (checkbox column)
- Add sticky header (`sticky top-0`)
- Replace spinner loading with skeleton rows (3-5 animated placeholder rows)
- Add row click handler prop
- Improve empty state with illustration

### 3.4 Modal (`src/components/ui/modal.tsx`)
- Wrap in framer-motion AnimatePresence for enter/exit animation
- Add `onConfirm` / `confirmText` / `cancelText` props for confirm dialog
- Add focus trap (tab cycles within modal)
- Add backdrop click animation

### 3.5 Input (`src/components/ui/input.tsx`)
- Add `type="password"` with show/hide eye toggle button
- Add character count display option
- Add `debounced` prop for search inputs (auto 300ms debounce)

### 3.6 Loading (`src/components/ui/loading.tsx`)
- Already accepts both `text` and `message` props (unified) ✅
- No changes needed

---

## ➕ Phase 4: New Components

### 4.1 Skeleton (`src/components/ui/skeleton.tsx`)
- Animated placeholder matching common layout shapes
- Variants: `text`, `circle`, `rect`, `card`, `table-row`
- Uses CSS `animate-pulse` with custom gradient shimmer

### 4.2 Tabs (`src/components/ui/tabs.tsx`)
- Animated tab bar with sliding underline indicator
- Variants: `underline` (default), `pills`
- Keyboard navigation (arrow keys)
- Uses framer-motion for underline animation

### 4.3 Breadcrumbs (`src/components/ui/breadcrumbs.tsx`)
- Auto-generated from pathname
- Home icon > Section > Page
- Clickable middle segments
- Responsive (collapses on mobile)

### 4.4 EmptyState (`src/components/ui/empty-state.tsx`)
- SVG illustration per context (no-data, no-results, error, success)
- Title + description + optional action button
- Consistent empty state across all pages

### 4.5 PageHeader (`src/components/ui/page-header.tsx`)
- Title + subtitle + breadcrumb + action buttons area
- Consistent spacing and typography across all pages
- Replaces ad-hoc `<h1>` + `<p>` patterns

### 4.6 SearchInput (`src/components/ui/search-input.tsx`)
- Built-in debounced search (300ms)
- Search icon + clear button (X)
- Uses Input component internally
- Placeholder text prop

### 4.7 ActionMenu (`src/components/ui/action-menu.tsx`)
- Dropdown menu for table row actions
- Replaces 4-5 separate action buttons per row
- Three-dot icon trigger
- Items with icons and labels
- Keyboard accessible

---

## 🏗️ Phase 5: Layout Upgrade

### 5.1 Sidebar (`src/components/layout/sidebar.tsx`)
- Add section labels: "Main" (Dashboard), "Academics" (Students, Teachers, etc.), "Admin" (Reports, Settings)
- Active state: left accent bar (4px rounded) instead of full bg fill
- Add badge/notification count on nav items
- Add tooltip on hover when collapsed (replace browser title)

### 5.2 Header (`src/components/layout/header.tsx`)
- Add breadcrumb navigation below title
- Notification bell: dropdown with list of notifications (not just red dot)
- User dropdown: add profile link, role badge
- Dark mode toggle: smooth 300ms color transition

### 5.3 AppShell (`src/components/layout/app-shell.tsx`)
- Wrap `<main>` in framer-motion `<AnimatePresence>` for page transitions
- Smooth fade between route changes

---

## 🔐 Phase 6: Login Page Upgrade

**File:** `src/app/login/page.tsx`

- Add show/hide password toggle (Eye/EyeOff icon)
- Add "Forgot Password?" link (even if non-functional)
- Add "Remember me" checkbox
- Improve error animation (shake effect)
- Make hero panel visible on tablet (not just lg+)
- Add smooth input focus animations
- Add role-specific color themes for the active role pill

---

## 📊 Phase 7: Admin Dashboard Upgrade

**File:** `src/app/(dashboard)/admin/dashboard/page.tsx`

- Add welcome banner: "Good morning, Admin" with time-of-day greeting
- Stat cards: hover lift effect + staggered fade-in animation (framer-motion)
- Activity timeline: colored dots per type, connector lines between items
- Quick actions: icon with gradient background, hover scale effect
- Add trend arrows on stat cards (up/down with percentage)
- Replace hardcoded colors with consistent theme colors

---

## 🎓 Phase 8: Student Dashboard Upgrade

**File:** `src/app/(dashboard)/student/dashboard/page.tsx`

- Add SVG attendance ring chart (animated stroke on load)
- Add homework progress bar ("3/5 completed")
- Today's timetable: color-coded time blocks per subject
- Add motivational greeting based on time
- Add streak/achievement indicators
- Stat cards: hover lift + staggered animation

---

## 👨‍👩‍👧 Phase 9: Parent Dashboard Upgrade

**File:** `src/app/(dashboard)/parent/dashboard/page.tsx`

- Animated SVG donut chart (stroke animation on mount)
- Fee breakdown: mini pie chart or progress bar
- Notices: expandable cards (click to expand full text)
- Add child selector if parent has multiple children
- Quick links with gradient backgrounds

---

## 📈 Phase 10: Reports Page Upgrade

**File:** `src/app/(dashboard)/admin/reports/page.tsx`

- Replace `Math.random()` bar chart with Recharts `<BarChart>`
- Add Recharts `<PieChart>` for fee distribution
- Add Recharts `<LineChart>` for attendance trend
- Replace hand-rolled `ChartBar` and `StatCard` with Recharts components
- Add date range picker for fee reports
- Export: implement CSV export (download as .csv file)
- Student report: load attendance % and avg marks from API (currently shows "-")

---

## 🔧 Phase 11: Fix All 6 Stub Features

### 11.1 Student Homework Submission
**File:** `src/app/(dashboard)/student/homework/page.tsx`
- Connect `handleSubmitHomework()` to `POST /api/homework/[id]/submit`
- Send content + file to backend API
- Refresh homework list after submission

### 11.2 Student Fee Receipt Download
**File:** `src/app/(dashboard)/student/fees/page.tsx`
- Generate PDF receipt using jspdf + html2canvas
- Include: student name, fee amount, date, receipt number, school stamp

### 11.3 Student Report Card Download
**File:** `src/app/(dashboard)/student/results/page.tsx`
- Generate PDF report card using jspdf
- Include: student info, subject-wise marks, total, grade, school header

### 11.4 Student Rank Calculation
**File:** `src/app/(dashboard)/student/results/page.tsx`
- Fetch all student results for same exam
- Calculate rank based on total marks
- Display actual rank instead of "--"

### 11.5 Parent Fee Payment
**File:** `src/app/(dashboard)/parent/fees/page.tsx`
- Add payment modal with simulated gateway
- Form: amount, payment method (cash/bank/online)
- Call `POST /api/fees/collect` to record payment
- Update fee status after payment

### 11.6 Parent Report Card Download
**File:** `src/app/(dashboard)/parent/results/page.tsx`
- Same as student report card PDF (reuse function)

---

## 📋 Phase 12: Upgrade All List Pages

**Files:** All pages under admin/students, admin/teachers, admin/staff, admin/exams, admin/homework, admin/notices, admin/fees

Changes per page:
- Replace `<Loading text="...">` with skeleton table rows
- Add sortable column headers (click to sort, arrow indicators)
- Fix pagination: show max 7 buttons with ellipsis (... 4 5 [6] 7 8 ...)
- Add "Results per page" selector (10, 25, 50)
- Add row hover effect (smooth bg transition)
- Replace individual action buttons with ActionMenu dropdown
- Add student count summary above table

---

## 📝 Phase 13: Upgrade All Form Pages

**Files:** All "new" and "edit" pages under admin/

Changes:
- Add multi-step wizard for long forms (New Student, New Teacher)
  - Step 1: Personal Info
  - Step 2: Academic Info
  - Step 3: Guardian/Contact
  - Progress bar at top
- Add validation on blur (not just on submit)
- Add loading spinner in submit button (use new Button loading prop)
- Add form field descriptions/help text

---

## 📅 Phase 14: Timetable Upgrade

**File:** `src/app/(dashboard)/admin/timetable/page.tsx`

- Color coding by subject (each subject gets a unique color)
- Highlight current time period
- Replace raw `<table>` with styled grid component
- Add "Now" indicator line

---

## 📱 Phase 15: Mobile Improvements

**Files:** All list/table pages, AppShell

Changes:
- Add mobile card layout for tables (cards instead of horizontal scroll)
- Add bottom navigation bar on mobile (5 main nav items)
- Improve touch targets (min 44px)
- Swipe-friendly modals (swipe down to close)

---

## 🌙 Phase 16: Dark Mode Polish

**Files:** `src/app/globals.css`, `src/components/layout/header.tsx`

- Add `transition: background-color 300ms, color 300ms` to body
- Persist theme in localStorage (already done ✅)
- Add system preference detection on first load
- Smooth toggle animation (rotate icon on switch)

---

## ✅ Phase 17: Final Build Test

```bash
npm run build
```

- Fix any TypeScript errors
- Fix any ESLint warnings
- Test all 4 role logins
- Test all major pages load without errors
- Verify API routes still work

---

## 📁 Files to Create/Modify Summary

| Action | Count | Files |
|--------|-------|-------|
| New components | 7 | skeleton.tsx, tabs.tsx, breadcrumbs.tsx, empty-state.tsx, page-header.tsx, search-input.tsx, action-menu.tsx |
| Upgrade components | 5 | button.tsx, card.tsx, table.tsx, modal.tsx, input.tsx |
| Upgrade layout | 3 | sidebar.tsx, header.tsx, app-shell.tsx |
| Upgrade CSS | 1 | globals.css |
| Upgrade dashboards | 3 | admin/dashboard, student/dashboard, parent/dashboard |
| Upgrade login | 1 | login/page.tsx |
| Fix stubs | 4 | student/homework, student/fees, student/results, parent/fees, parent/results |
| Upgrade list pages | ~8 | admin/students, teachers, staff, exams, homework, notices, fees, attendance |
| Upgrade form pages | ~6 | admin/*/new, admin/*/edit |
| Upgrade reports | 1 | admin/reports |
| Upgrade timetable | 1 | admin/timetable |
| Config | 1 | package.json |
| **TOTAL** | **~40** | |

---

## 🎯 Execution Order

1. **Phase 1** → Install packages (unblocks recharts, framer-motion)
2. **Phase 2** → globals.css (foundation for all animations)
3. **Phase 3** → Core components (foundation for all pages)
4. **Phase 4** → New components (used by upgraded pages)
5. **Phase 5** → Layout (affects every page)
6. **Phase 6** → Login (first thing users see)
7. **Phase 11** → Fix stubs (functional fixes)
8. **Phase 7-9** → Dashboards (most visible pages)
9. **Phase 10** → Reports (most broken page)
10. **Phase 12-13** → Lists and forms
11. **Phase 14-16** → Polish
12. **Phase 17** → Final test

---

*Plan created for School Management System UI upgrade.*
*All phases to be executed sequentially.*
