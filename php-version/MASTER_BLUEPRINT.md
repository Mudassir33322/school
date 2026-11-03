# CampusOS Core PHP + MySQL — Master Scope and Acceptance Blueprint

Status: **scope/acceptance specification, NOT a claim of implemented or tested functionality**.
Updated: 2026-11-03.
Source of truth for the PHP conversion of `Mudassir33322/school`; preserve original Next.js `main`.

## Non-negotiable product constraints
- Deliver one integrated, installable, commercial-grade school management system in **Core PHP 8.2+ (no framework), MySQL 8+, HTML5/CSS3/vanilla JS**. Shared-hosting compatible, no Node runtime needed to deploy.
- Maintain the *original UI/UX patterns and styling*: indigo `#4f46e5`, dark-navy sidebar, white cards, light background, responsive layouts, sidebar/header/form/table styles, and equivalent navigation. Recreate behavior accessibly in PHP rather than merely copying static pixels.
- One school may have many branches/campuses. The **Company Control Portal** can provision and manage multiple customer schools in SaaS or direct-license models. All school data is isolated by `school_id`; branch and academic-session permissions must be checked at record level.
- Every module requires actual CRUD, validation, permissions, state transitions, relational integrity, auditability, views, printable/exportable outputs as applicable, and tested success/error cases; never count an empty route or a button as a completed feature.
- **No AI features**. No hardcoded demo credentials. No fake payment success: finance starts with internal/cash/bank-recorded ledgers and can add external gateways only after secure implementation.
- Pakistan-ready defaults: PKR, timezone Asia/Karachi, optional Urdu/English, configurable academic terms, fee challans and print layouts. School logo/stamp and numbering configurable.

## Roles and portal coverage
- Company: vendor owner / company control, licensing, SaaS plans, school onboarding, subscriptions, renewals, support, updates, and activity monitoring.
- School leadership: owner, principal, vice principal, school admin, registrar/front desk, academic coordinator/HOD.
- Academic: class teacher, subject teacher, substitute teacher, student, parent/guardian (including multiple linked children).
- Operations: accountant/cashier, HR/payroll officer, librarian, transport manager/driver, inventory/facilities, gate/security, nurse/counselor; optional alumni/hostel/cafeteria extensions.
- Permissions must be per-action and per-record, not just hiding menu items. All roles have relevant functional dashboards; minimize access by default.

## Module inventory — no silent omissions
1. Company control: school customer CRM, provisioning, direct licenses, SaaS plans/subscription lifecycle, invoices/receipts, expiry/grace/suspension, support tickets, updates, monitoring, activity/audit.
2. School configuration: school profile, branding, branches, session/terms, academic calendar, class/section/subjects, grading scales, holidays, rooms, periods, school policy settings.
3. Identity/security: invitations/onboarding, safe credential reset, roles/permissions, sessions, audit logs, access revocation, secure storage/upload, backup/restore.
4. Admissions: inquiry/application, applicant documents, eligibility, review/approval, fee if applicable, enrollment, admission/roll numbers, waitlist/reject, parents linked.
5. Students/guardians: profiles, emergency contacts, school/branch/section, roster, status/history, promotions, transfers, withdrawals, alumni, siblings.
6. Staff/teachers: profiles, qualifications, employment status, class teacher/subject assignments, workload, substitution.
7. Timetable: period/break/room setup, teacher availability, class/teacher schedules, overlap/conflict checks, substitution and published timetable versions.
8. Curriculum/academics: syllabi, subject learning outcomes, academic plans, lesson planning, learning resources, coverage tracking.
9. Attendance: student daily/period/subject; staff attendance; late arrivals, absences, leave request/approval, corrections and audit, alerts and parent/student visibility.
10. Homework/assignments: create/publish, class/subject targeting, attachments, deadlines, student submission/resubmission, marking, feedback, late status and parent visibility.
11. Exams: exam calendar, question bank, paper authoring, objective/subjective marking, moderation, grades, grade locks, result approval/publish, ranks/analytics, report cards, archives and corrections.
12. Fees and accounts: structures/concessions/scholarships, scheduled charges, invoices/challans, installments, payment recording/allocation, receipts, refunds/reversals, dues, defaulters, ledger/reconciliation, accounting exports.
13. HR/payroll: leave, attendance, salary components, deductions, payroll calculations, approvals, payslips, payroll reports, full history.
14. Communications: notices, calendar/events, targeted recipients, in-app notifications, PTMs, parent communication logs, reminders; optional email/SMS integrations.
15. Library: book/catalog/copies, borrowing, returns, overdue/fines, student/staff history.
16. Transport: routes, vehicles, drivers, stops, allocations, fees, attendance/boarding and maintenance/incident records.
17. Inventory/facilities: items/assets, stock movement, issue/return, purchase/maintenance records.
18. Hostel/cafeteria (extended): beds/rooms/allocations, dining menus/charges, permissions and receipts, if institution enables them.
19. Student welfare: health/emergency records with strict privacy, counseling, discipline, safeguarding, authorized case notes.
20. Gate/visitors: visitor sign-in, entry/exit logs, pickup authorization; least-privilege access.
21. Documents/templates: student and staff ID cards, QR verification, admission documents, certificates, result cards, fee challans, invoices, pay slips, transfer/leaving certificates; school branding, editable templates, preview, bulk print/PDF, issue/reissue archive.
22. Reports and administration: exportable real-data dashboards (not random/placeholder figures), student/class/teacher/attendance/exam/fees/accounting/payroll reports, date/branch/session filters, imports and migrations, backup/restore testing.
23. Support/integrations: documented update processes, license checks that do not silently erase school data, safe optional adapters (e.g. email/SMS), import/export APIs where needed.

## Required end-to-end flows (acceptance gates)
A. **Company → School:** customer lead → contract → SaaS/direct license → school provisioning → administrator onboarding → branch creation → plan/expiry/renewal and support. License expiry must never erase existing records.
B. **Academic setup:** school admin → academic session → class → section → subject → rooms/periods → staff/teacher assignments → timetable conflict validation → publish.
C. **Admissions:** applicant registration → documents/guardian → review/approve → student profile & enrollment created atomically → unique admission/roll number → class/section roster → parent-child link → account permissions → attendance/fees/homework visibility. Prevent duplicate or cross-branch links.
D. **Teacher and attendance:** staff onboarding → teaching allocation → published timetable → teacher marks only assigned class/subject → absent/late/leave → audited correction approval → parent/student dashboards and reports.
E. **Homework:** teacher creates homework for authorized sections → due date & resource → student submits authenticated work (not arbitrary student ID) → deadline/resubmission rules → teacher grading/feedback → parent view.
F. **Exam:** exam schedule & subjects → questions/paper → moderation/approval → marks entry → review → approved result lock/publish → student/parent access → printable report card & archive → authorized correction path.
G. **Fee/accounting:** fee plan → student assessment/concession → challan/invoice → payment allocation/receipt → ledger → outstanding balance & reminder → refund/reversal approval and reconciliation. Never accept unverified gateway callbacks as paid.
H. **HR/payroll:** employee contract → attendance/leave → manager approval/substitute assignment → salary computation/deductions → payroll approval → payslip/ledger/history.
I. **Student lifecycle:** transfer/section change/promotion/withdrawal → fees/results history retained → current timetable/permissions updated → transfer/leaving certificates produced without record loss.
J. **Templates:** configure template/branding → preview → generate single/bulk PDF → issue → optional QR verification → archive and reissue audit.
K. **Daily services:** library issue/return/fine, transport route allocation and fare, inventory stock movement, visitors and health/discipline with role-specific privacy and reports.
L. **Quality controls:** cross-school user cannot see/update unrelated records; teacher cannot edit other sections; parent can view only linked children; student cannot impersonate; suspended user is blocked; concurrency/duplicate actions produce safe outcomes; backups can be restored.

## Definition of done — apply to every workflow
- UI page(s) wired to real PHP handlers and MySQL tables with transactions and foreign keys, not placeholders.
- Authentication, per-role + per-school/branch/session + per-record authorization on **every** server-side action.
- Server validation, CSRF protection, output escaping, prepared queries, upload validation, rate-limited login, safe password hashing, session protections, audit records and error states.
- Create/view/update/cancel/print operations match permissions; reports are derived from actual records.
- Tested happy path, denied-role path, incorrect input, duplicate handling, cross-tenant isolation and data retention.
- Responsive/mobile-friendly UI faithful to original styling, useful empty/loading/error states.
- Reproducible installer/schema/migrations, no secrets in ZIP, documented config, sample non-sensitive data, deployment guide, tests/test report.
- **Final ZIP status is NOT achieved until code passes lint and functional end-to-end testing.** Label unimplemented flows explicitly.

## Delivery checkpoints
1. Source-to-module gap audit and this master scope.
2. Secure PHP/MySQL foundation and Company/School/Teacher/Student/Parent role dashboards.
3. Academic setup, admission/enrollment, attendance, teacher assignment, timetable, homework.
4. Exams/results and fees/accounting; documents and reports.
5. Operations (HR, library, transport, inventory, visitors, welfare), support/licensing.
6. Integrated regression/security/print/export/install tests, defects resolved, single final ZIP.
These are checkpoints, not separate unfinished deliverables. No feature is considered done by checklist entry alone.
