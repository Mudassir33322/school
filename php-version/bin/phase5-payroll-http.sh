#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
php bin/phase5-payroll-fixture.php
SCHOOL="$(php -r 'require "app/core.php";echo one("SELECT id FROM schools WHERE code=?",["smoke-school"])["id"];')"
EMPLOYEE="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE school_id=? AND email=?",[(int)$argv[1],"salary-employee@smoke.invalid"])["id"];' "$SCHOOL")"
login() {
  : > "$COOKIE"
  curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
  TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
  [[ -n "$TOKEN" ]] || { echo "ERROR: CSRF absent"; exit 1; }
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "action=login" --data-urlencode "_csrf=$TOKEN" \
    --data-urlencode "portal=school" --data-urlencode "school_code=smoke-school" \
    --data-urlencode "email=$1" --data-urlencode "password=$2" "$BASE_URL/")"
  [[ "$status" == "302" ]] || { echo "ERROR: login returned $status for $1"; exit 1; }
}
post() {
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$status" == "302" ]] || { echo "ERROR: expected redirect, got $status"; cat "$PAGE"; exit 1; }
}
deny403() {
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$status" == "403" ]] || { echo "ERROR: expected 403, got $status"; cat "$PAGE"; exit 1; }
}
assert_status() {
  php -r 'require "app/core.php";$p=one("SELECT status FROM payroll_entries WHERE id=?",[(int)$argv[1]]);if(!$p||$p["status"]!==$argv[2]){fwrite(STDERR,"Unexpected payroll state\n");exit(1);}' "$1" "$2"
}
login "admin@smoke.invalid" "SmokeTestPassword2026!"
post --data-urlencode 'action=payroll' --data-urlencode '_back=payroll' \
  --data-urlencode "employee_user_id=$EMPLOYEE" --data-urlencode "month_key=2026-11" \
  --data-urlencode 'basic=1000' --data-urlencode 'allowance=200' \
  --data-urlencode 'deduction=50' --data-urlencode 'notes=Monthly salary'
PAYROLL="$(php -r 'require "app/core.php";echo one("SELECT id FROM payroll_entries WHERE month_key=?",["2026-11"])["id"];')"
assert_status "$PAYROLL" "draft"
post --data-urlencode 'action=payroll_pay' --data-urlencode "_back=payroll" \
  --data-urlencode "payroll_id=$PAYROLL" --data-urlencode 'payment_mode=cash'
assert_status "$PAYROLL" "draft"
echo 'PASS: salary draft created and unapproved payment blocked'

login "salary-employee@smoke.invalid" "TestPassword2026!"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=payroll" > "$PAGE"
grep -q 'My Paid Payslips' "$PAGE"
if grep -q 'Monthly salary' "$PAGE"; then echo 'ERROR: employee saw draft payroll'; exit 1; fi
status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" "$BASE_URL/?page=payroll&print=$PAYROLL")"
[[ "$status" == "404" ]] || { echo "ERROR: draft printable for employee"; exit 1; }
deny403 --data-urlencode 'action=payroll_approve' --data-urlencode "_back=payroll" --data-urlencode "payroll_id=$PAYROLL"
echo 'PASS: employee cannot view draft or approve salary'

login "salary-accountant@smoke.invalid" "TestPassword2026!"
deny403 --data-urlencode 'action=payroll_approve' --data-urlencode '_back=payroll' --data-urlencode "payroll_id=$PAYROLL"
assert_status "$PAYROLL" "draft"
echo 'PASS: accountant cannot approve salary'

login "salary-principal@smoke.invalid" "TestPassword2026!"
post --data-urlencode 'action=payroll_approve' --data-urlencode '_back=payroll' --data-urlencode "payroll_id=$PAYROLL"
assert_status "$PAYROLL" "approved"
deny403 --data-urlencode 'action=payroll_pay' --data-urlencode '_back=payroll' --data-urlencode "payroll_id=$PAYROLL" --data-urlencode 'payment_mode=cash'
echo 'PASS: principal approves but cannot record payment'

login "salary-accountant@smoke.invalid" "TestPassword2026!"
post --data-urlencode 'action=payroll_pay' --data-urlencode '_back=payroll' \
  --data-urlencode "payroll_id=$PAYROLL" --data-urlencode 'payment_mode=bank'
assert_status "$PAYROLL" "approved"
post --data-urlencode 'action=payroll_pay' --data-urlencode '_back=payroll' \
  --data-urlencode "payroll_id=$PAYROLL" --data-urlencode 'payment_mode=bank' \
  --data-urlencode 'payment_reference=CI-TRANSFER-001'
assert_status "$PAYROLL" "paid"
post --data-urlencode 'action=payroll_pay' --data-urlencode '_back=payroll' \
  --data-urlencode "payroll_id=$PAYROLL" --data-urlencode 'payment_mode=bank' \
  --data-urlencode 'payment_reference=CI-TRANSFER-001'
php -r '
require "app/core.php";
$id=(int)$argv[1];
$p=one("SELECT basic,allowance,deduction,approved_by,paid_by,payment_mode,payment_reference FROM payroll_entries WHERE id=?",[$id]);
$events=many("SELECT event_type FROM payroll_events WHERE payroll_id=? ORDER BY id",[$id]);
if((float)$p["basic"]+(float)$p["allowance"]-(float)$p["deduction"]!==1150.0)exit(1);
if($p["approved_by"]===null||$p["paid_by"]===null||$p["payment_mode"]!=="bank"||$p["payment_reference"]!=="CI-TRANSFER-001")exit(1);
if(array_column($events,"event_type")!==["created","approved","paid"])exit(1);
echo "PASS: audit trail and manual payment are consistent\n";
' "$PAYROLL"
echo 'PASS: bank payment requires reference and duplicate payment blocked'

login "salary-employee@smoke.invalid" "TestPassword2026!"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=payroll" > "$PAGE"
grep -q 'My Paid Payslips' "$PAGE"
grep -q '1150.00' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=payroll&print=$PAYROLL" > "$PAGE"
grep -q 'Salary Payslip' "$PAGE"
grep -q 'CI-TRANSFER-001' "$PAGE"
grep -q '1,150.00' "$PAGE"
echo 'PASS: staff can view and print only paid salary'

login "other-employee@smoke.invalid" "TestPassword2026!"
status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" "$BASE_URL/?page=payroll&print=$PAYROLL")"
[[ "$status" == "404" ]] || { echo 'ERROR: employee can view another employee payslip'; exit 1; }
echo 'PASS: another employee cannot view private payslip'
