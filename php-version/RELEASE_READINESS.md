# CampusOS: Release Readiness & Safety Gate

**Status: DEVELOPMENT RELEASE CANDIDATE — NOT APPROVED FOR PRODUCTION.**

This package consolidates the current Core PHP 8.2+ / MySQL 8 implementation. A ZIP download, a green automated workflow or a polished UI is not sufficient evidence of enterprise production readiness.

## What automated CI currently verifies
- PHP syntax across project, MySQL 8 fresh schema import, required extensions and CLI database preflight.
- Direct school bootstrap; login, CSRF, session logout, company/school separation.
- Selected exams/result publication, attendance-adjacent academic flows, fee payment limits, refund balances, tuition/transport billing, installment schedules, and payroll approval/pay states.
- Student promotion and library issue/return, transport seat allocation, inventory movement records.
- Selected role access checks including employee payslip privacy, student-parent fee statement isolation, accountant cross-campus restrictions, and principal global-operation/campus-visibility restrictions.

**CI does not prove:** production throughput, security against all attack paths, UI/browser parity, data migration correctness, or actual hosting behavior.

## Mandatory enterprise release gates still OPEN
1. All-role and cross-school object-level security/penetration testing and documented authorization matrix for every action and report.
2. Original Next.js interface comparison at desktop and mobile sizes with signed-off navigation, typography, components, data grids, forms and UX accessibility.
3. Full accounting engine: Chart of Accounts / GL are schema scaffolding only, not an approved financial posting workflow; no automatic invoice/payroll journal reconciliation.
4. HR onboarding, employment records, statutory deduction rules, payroll bank integration, and multi-campus payroll reconciliation.
5. Backup/restore with tested restore drills, audited retention schedules, access-controlled downloads, point-in-time strategy and disaster-recovery objectives.
6. SaaS plan enforcement, contract terms, license/subscription renewal logic, suspension and secure tenant provisioning.
7. Comprehensive admission migrations, import/export, file/document storage with scanning and upload authorization, notification delivery and cancellation workflows.
8. Online exams/question bank, advanced report designer, configurable print templates, and other planned modules referenced in MASTER_BLUEPRINT.md.
9. Formal concurrency/load tests, performance budgets, pagination and long-running job/queue design.
10. Independent deployment security review (HTTPS, secure cookies behind reverse proxies, cron access, PHP error logs, protected configuration, SQL permissions, patch strategy), user acceptance testing, privacy/legal reviews.

## Deployment safety
- **Do not deploy with real students, parent, staff or payroll data at this stage.**
- Use a staging MySQL database and test accounts. Back up before applying any migration.
- Fresh install: import database/schema.sql only. Upgrades: apply only missing versioned migrations in order; never re-import the full schema into a live database.
- Configure web document root to php-version/public/; keep config.php, app/, database/, and bin/ outside document root.
- Use HTTPS only, app_env=production, PHP 8.2+, pdo_mysql, mbstring, no public PHP errors, and least-privilege database credentials.
- Run php bin/check.php and all GitHub CI tests, then verify representative end-to-end workflows with the actual hosting stack.
- Company and school credentials must be changed to unique, strong passwords. CI credentials exist solely in disposable test environments.

## Current deliverable description
The generated archive is a **single consolidated Core PHP/MySQL DEVELOPMENT RELEASE CANDIDATE** including source, database schema, migrations, existing role portals, assets and automated test scripts. It is not a commercially certified enterprise release.

Do not change this status to "production-ready" until the mandatory gates are closed and documented by responsible reviewers.
