# CampusOS — Core PHP / MySQL conversion

This is a separate implementation under \`php-version/\` on branch \`core-php-mysql-conversion\`. It does not alter the original Next.js source. Styling follows the original navy sidebar, indigo highlights, clean cards and responsive layout. This is **a development build, not a verified production release**.

## Requirements
- PHP 8.2+ with PDO MySQL and mbstring
- MySQL 8+
- Apache/mod_rewrite recommended, or PHP local development server
- A fresh database and credentials; HTTPS for any real deployment

## Setup
1. Create an empty MySQL database called \`campusos\` (or another name).
2. Import \`php-version/database/schema.sql\` with your MySQL administration client.
3. Copy \`php-version/config.example.php\` to \`php-version/config.php\` and enter database credentials. **Never commit config.php.**
4. On the command line, from \`php-version/\` run \`php bin/install.php company "Company Owner" owner@example.com\`. Follow prompt for a long password.
5. Or create a direct-sale school with \`php bin/install.php school "Example School" example-school admin@example.com\`.
6. For local preview, from \`php-version/\` run \`php -S localhost:8000 -t public\` and browse \`http://localhost:8000/?page=login\`. For real hosting, configure the site document root to \`php-version/public/\` and keep \`app/\`, \`database/\`, \`bin/\` and \`config.php\` outside the public document root.

## Implemented source files
- \`app/core.php\`: PDO database connection, session helpers, CSRF, school/role checks, audit and login attempt throttling
- \`app/actions.php\`: POST handlers for school and academic operations
- \`database/schema.sql\`: initial relational schema for school/branch/users and many school records
- \`bin/install.php\`: CLI-only initial account setup
- \`public/index.php\`: initial role-based forms, tables, school setup, teacher/student/parent views, company school registration
- \`public/assets/style.css\`: responsive indigo/navy style based on the original design
- \`public/assets/app.js\`: small sidebar and confirmation interactions
- \`MASTER_BLUEPRINT.md\`: planned full-system scope

## Basic school workflow (first implementation)
Vendor creates a school and main branch -> school admin logs in using school code -> creates classes/sections/subjects -> creates parent/student/teacher accounts -> enrolls a student and links a parent -> allocates a teacher -> creates timetable -> marks attendance -> assigns homework -> student submits -> teacher grades -> exam/marks -> admin publishes -> finance issues and records fees.

## Not yet complete or tested
- Selected workflows have passed GitHub Actions with PHP 8.2 and MySQL 8 (syntax, schema import, basic login/admin action, exams/fees, promotion/library). The newer transport/inventory tests must pass separately before those modules are considered smoke-tested. The packaged ZIP is a development preview, **not** a production-ready enterprise release.
- Full original UI parity (screen-by-screen), original source data migration, dynamic form dependencies, pagination, deep filtered reporting and automated test suite are outstanding.
- Initial admissions approval and enrollment, promotion/transfer history, exam publishing lock, fee concessions, library issue/return, transport assignments, inventory movements and a **basic audited monthly payroll workflow** are present. Full HR contracts, attendance-driven salary calculation, employee onboarding, accounting ledger integration, tax/statutory deductions, lesson plans, online exams, chat, hostel, staff substitution, notification delivery, advanced reports and configurable print templates remain outstanding.
- SaaS renewal/expiration enforcement and license enforcement, backups/restore, file uploads, bulk imports and exports are outstanding.
- Role isolation and multi-tenant relationships must be integration tested and hardened before production.
- A **known risk to address** is parent/teacher/admin object-level authorization and branch-level cross-checks everywhere. Do not enter real student data until security review is complete.
- Selected automated PHP lint/SQL/HTTP smoke tests have passed; comprehensive all-role, all-branch, multi-school security and UI tests have **not** passed.

## Release acceptance criteria
A phase should be called installable only after: PHP syntax lint, schema import, company and school creation, logins for each role, access-denied tests, form submit/read-back tests, CSRF test, tenant isolation test, backup validation and smoke test. When these pass, package only \`php-version/\` in the distribution ZIP.

## Updating an older PHP preview installation
- **Back up the existing database first.** Do not reimport the full schema into an active installation.
- For upgrades from the previous Phase 3 preview to the new transport/inventory features, execute `database/migrations/2026_11_03_transport_inventory.sql` **once**, then deploy the updated PHP files. This migration adds route seat capacity and creates transport/inventory movement tables; it is not intended to be rerun.
- For a fresh database, import the full `database/schema.sql` instead; do **not** also apply the migration.
- Transport assign/release is now available to school admins/principals, with student and parent read-only views. A route records occupied/maximum seats; students cannot hold two active assignments. Student campus transfer requires previous transport assignment to be released.
- Stock receipts and issues are written to an immutable-style transaction history and inventory quantities cannot go negative through these new forms. Direct manual edits to `inventory_items.quantity` bypass the history and should be prohibited outside controlled migrations.
- Student/parent transport billing is currently **not** automatically integrated with fee invoice generation; the route's monthly charge is informational until that integration is implemented.

## HR & Payroll (incremental Phase 3 development preview)
- Roles: school admin and accountant create draft monthly salaries; admin or campus principal approves; admin or accountant records **only payments already made**. Principal can approve salaries for their own campus but cannot record payment. Employees (teacher/staff) see their own **paid** payslips only; draft and approved payroll are hidden from them.
- The salary calculation is **Basic + Allowances - Deductions = Net** in PKR. Duplicate employee/month entries and negative net amounts are rejected. Every new record/approval/payment creates a separate payroll event.
- For each salary month, the sequence is **Draft -> Approved -> Paid**. Both transitions are one-way; payment cannot be registered before approval or twice. Bank, cheque and manual transfer payment records require a reference number. A saved payment is **manual bookkeeping, not a banking transaction**.
- The Payroll page offers printable HTML payslips for paid records; there is **no generated PDF, tax engine, banking API, or automatic pay-run** in this release.
- After backing up the MySQL database, upgrading an installation from the earlier Transport/Inventory preview requires running **database/migrations/2026_11_03_payroll_workflow.sql** exactly once, then deploying updated PHP code. It preserves legacy paid rows without inventing historical approval metadata, and converts legacy unpaid rows to drafts. If you installed multiple preview updates in sequence, apply *each missing migration in order*. Fresh installations use only **database/schema.sql** and must not import the migration.
- This development preview is not cleared for real payroll/personnel data without end-to-end security review, migration rehearsal, backup verification and hosting hardening.


## Monthly class fee plans and challans (development preview)
- On **Fees & Finance**, school admin creates/updates a **monthly tuition plan per campus and class**. School admin or the assigned-campus accountant then selects month and due date and generates student challans. This initial workflow does **not** automatically run on a timer.
- For each actively enrolled student in the selected campus/class, the generated invoice includes one tuition line (the class plan amount) and, if applicable, one transport line using the last route assignment that overlaps the month. Transport is billed at the full monthly rate, **not prorated**. Future months reflect the current plan/rate at generation time; previously issued invoices retain their original snapshot.
- One monthly invoice per school/student/month is enforced by a MySQL unique index, even if generation is repeated or the student changes classes. Generation batches process **up to 200 currently unbilled students at a time**; repeat until the screen reports zero new invoices. A class with a zero-tuition plan only invoices students who have a chargeable transport assignment.
- Existing manual invoices remain separate; their billing_month is null. Check for **manually invoiced charges** before bulk generation to avoid business-level duplicates. This is an incremental billing workflow, **not yet** a comprehensive arrears/reconciliation, refund, installment, scholarship rules or accounting system.
- Finance screens show the invoice amount, concessions, paid amount, outstanding balance and monthly tuition/transport line items. Parents/students only see linked student invoices. Accountant records are campus-scoped, and only school admin can edit fee plans.
- Back up the database first when upgrading from an older preview. Apply the additive **database/migrations/2026_11_03_monthly_fee_billing.sql** once, after earlier missed migrations in order, then deploy the new PHP code. For a fresh installation, use the current **database/schema.sql only**.
- All pricing currently uses **PKR** and manual internal payments. No payment gateway is invoked by these forms. Production adoption requires multi-tenant, role, financial and migration acceptance testing with real-world scenarios.


## Fee refunds, receipts and student statements (development preview)
- School admin / accountant may record a **manual refund** against an existing payment. The original payment is retained; a new fee_refunds record contains amount, reason, manual method, optional cash reference / required non-cash reference, refund operator, and timestamp. A record means the refund **was already paid externally**; the software does not transfer money.
- Every payment can be refunded partially or fully, but cumulative refunds cannot exceed the original payment. All refund/payment/concession calculations lock the invoice record in a MySQL transaction. Net Paid = Sum of payments − Sum of refunds; Outstanding = Invoice amount − concessions − Net Paid. This prevents duplicate or excessive refund amounts through these workflows.
- **Fees & Finance** now lists gross payments, refunds, net retained amounts, the refund audit ledger, and printable HTML payment receipts / per-student fee statements. A receipt continues to show the original amount and any subsequent refunds. Statements reflect all currently visible invoices and net balances.
- Student and parent accounts can access **only their own or linked students'** receipts and statements. Accountants are restricted to their assigned campus. Non-finance users cannot record a refund. The print view is HTML with a browser Print control, not a server-generated PDF.
- When upgrading an older preview, back up your database and execute the additive **database/migrations/2026_11_03_fee_refunds.sql** once, **after any missed earlier migrations**, then deploy the updated PHP code. Fresh installs use the full current schema and **do not execute the migrations**.
- This is internal financial bookkeeping only. Banking settlements, real refunds, asynchronous payment providers, receipts authentication by an external gateway, tax/reconciliation journals, approval workflow for refunds, and all-role/multi-tenant production security sign-off are still outstanding.
