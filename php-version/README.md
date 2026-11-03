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
- The current branch has **not** been successfully run against a live MySQL database here. It has no verified installable ZIP.
- Full original UI parity (screen-by-screen), original source data migration, dynamic form dependencies, pagination, deep filtered reporting and automated test suite are outstanding.
- Advanced admissions review workflow, student promotion/transfer, fee concessions and accounting ledger, lesson plans, question-bank-based online exams, chat, hostel, library issue/return, transport assignments, stock movements, comprehensive HR, substitution, printing designer and notification delivery are outstanding.
- SaaS renewal/expiration enforcement and license enforcement, backups/restore, file uploads, bulk imports and exports are outstanding.
- Role isolation and multi-tenant relationships must be integration tested and hardened before production.
- A **known risk to address** is parent/teacher/admin object-level authorization and branch-level cross-checks everywhere. Do not enter real student data until security review is complete.
- PHP lint, SQL import and end-to-end role tests have not yet passed.

## Release acceptance criteria
A phase should be called installable only after: PHP syntax lint, schema import, company and school creation, logins for each role, access-denied tests, form submit/read-back tests, CSRF test, tenant isolation test, backup validation and smoke test. When these pass, package only \`php-version/\` in the distribution ZIP.
