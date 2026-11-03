#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
php bin/phase2-smoke-fixture.php
curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
[[ -n "$TOKEN" ]] || { echo "ERROR: No CSRF token"; exit 1; }
post () {
  curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
     --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/" | grep -q '^302$'
}
post --data-urlencode 'action=login' --data-urlencode 'portal=school' --data-urlencode 'school_code=smoke-school' \
  --data-urlencode 'email=admin@smoke.invalid' --data-urlencode 'password=SmokeTestPassword2026!'
EXAM="$(php -r 'require "app/core.php"; echo one("SELECT id FROM exams WHERE title=?",["Mathematics Midterm"])["id"];')"
STUDENT="$(php -r 'require "app/core.php"; echo one("SELECT id FROM users WHERE email=?",["student@smoke.invalid"])["id"];')"
INVOICE="$(php -r 'require "app/core.php"; echo one("SELECT id FROM fee_invoices WHERE invoice_no=?",["SMOKE-FEE-1"])["id"];')"

post --data-urlencode 'action=exam_mark' --data-urlencode "exam_id=$EXAM" \
  --data-urlencode "student_user_id=$STUDENT" --data-urlencode 'marks=75' --data-urlencode '_back=exams'
php -r 'require "app/core.php"; if ((float)one("SELECT marks FROM exam_results LIMIT 1")["marks"]!==75.0) exit(1);'
post --data-urlencode 'action=publish_exam' --data-urlencode "exam_id=$EXAM" --data-urlencode '_back=exams'
php -r 'require "app/core.php"; if ((int)one("SELECT published FROM exams LIMIT 1")["published"]!==1) exit(1);'
post --data-urlencode 'action=exam_mark' --data-urlencode "exam_id=$EXAM" \
  --data-urlencode "student_user_id=$STUDENT" --data-urlencode 'marks=95' --data-urlencode '_back=exams'
php -r 'require "app/core.php"; if ((float)one("SELECT marks FROM exam_results LIMIT 1")["marks"]!==75.0) exit(1);'
echo "PASS: exam publish locks subsequent marking"

post --data-urlencode 'action=fee_adjustment' --data-urlencode "invoice_id=$INVOICE" \
 --data-urlencode 'adjustment_type=scholarship' --data-urlencode 'amount=200' --data-urlencode 'reason=Merit scholarship' --data-urlencode '_back=finance'
post --data-urlencode 'action=fee_payment' --data-urlencode "invoice_id=$INVOICE" \
 --data-urlencode 'mode=cash' --data-urlencode 'amount=800' --data-urlencode '_back=finance'
post --data-urlencode 'action=fee_payment' --data-urlencode "invoice_id=$INVOICE" \
 --data-urlencode 'mode=cash' --data-urlencode 'amount=1' --data-urlencode '_back=finance'
php -r '
require "app/core.php";
$discount=(float)one("SELECT COALESCE(SUM(amount),0) x FROM fee_adjustments")["x"];
$paid=(float)one("SELECT COALESCE(SUM(amount),0) x FROM fee_payments")["x"];
if($discount!==200.0||$paid!==800.0) {
 fwrite(STDERR,"Incorrect discount/payment amounts: $discount $paid\n"); exit(1);
}
'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q 'Concessions' "$PAGE"
echo "PASS: fee concession, payment allocation and overdraft rejection"
