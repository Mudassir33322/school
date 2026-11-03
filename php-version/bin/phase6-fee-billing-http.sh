#!/usr/bin/env bash
set -euxo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
SCHOOL="$(php -r 'require "app/core.php";echo one("SELECT id FROM schools WHERE code=?",["smoke-school"])["id"];')"
BRANCH="$(php -r 'require "app/core.php";echo one("SELECT id FROM branches WHERE school_id=? AND code=?",[(int)$argv[1],"MAIN"])["id"];' "$SCHOOL")"
CLASS="$(php -r 'require "app/core.php";echo one("SELECT id FROM classes WHERE school_id=? AND name=?",[(int)$argv[1],"Class 10"])["id"];' "$SCHOOL")"
STUDENT="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE school_id=? AND email=?",[(int)$argv[1],"student@smoke.invalid"])["id"];' "$SCHOOL")"
SECOND="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE school_id=? AND email=?",[(int)$argv[1],"second@smoke.invalid"])["id"];' "$SCHOOL")"
MONTH="$(php -r 'require "app/core.php";echo date("Y-m");')"
DUE="$(php -r 'require "app/core.php";echo date("Y-m-t");')"
NEXT_MONTH="$(php -r 'require "app/core.php";echo (new DateTimeImmutable("first day of next month"))->format("Y-m");')"
NEXT_DUE="$(php -r 'require "app/core.php";echo (new DateTimeImmutable("last day of next month"))->format("Y-m-d");')"
login() {
  : > "$COOKIE"
  curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
  TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
  [[ -n "$TOKEN" ]] || { echo "Missing CSRF token"; exit 1; }
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode 'action=login' --data-urlencode "_csrf=$TOKEN" \
    --data-urlencode 'portal=school' --data-urlencode 'school_code=smoke-school' \
    --data-urlencode "email=$1" --data-urlencode "password=$2" "$BASE_URL/")"
  [[ "$status" == '302' ]] || { echo "Login error for $1: $status"; exit 1; }
}
post() {
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$status" == '302' ]] || { echo "Expected redirect 302; got $status"; cat "$PAGE"; exit 1; }
}
deny403() {
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$status" == '403' ]] || { echo "Expected 403; got $status"; cat "$PAGE"; exit 1; }
}
check_month() {
  php -r '
  require "app/core.php";
  [$school,$month,$first,$second,$tuition,$transport]=array_slice($argv,1);
  $invoices=many("SELECT id,student_user_id,amount,source FROM fee_invoices WHERE school_id=? AND billing_month=? ORDER BY student_user_id",[(int)$school,$month]);
  if(count($invoices)!==2) {fwrite(STDERR,"Expected two invoices, found ".count($invoices)."\n");exit(1);}
  foreach($invoices as $invoice){
    $expected=(int)$invoice["student_user_id"]===(int)$first?(float)$tuition:(float)$tuition+(float)$transport;
    if(abs((float)$invoice["amount"]-$expected)>0.0001 || $invoice["source"]!=="monthly")exit(1);
    $items=many("SELECT item_type,amount FROM fee_invoice_items WHERE school_id=? AND invoice_id=?",[(int)$school,(int)$invoice["id"]]);
    if(count($items)!==((int)$invoice["student_user_id"]===(int)$first?1:2))exit(1);
    $sum=array_sum(array_map(fn($x)=>(float)$x["amount"],$items));
    if(abs($sum-$expected)>0.0001)exit(1);
  }
  echo "PASS: $month tuition/transport invoices and item totals reconciled\n";
  ' "$SCHOOL" "$1" "$STUDENT" "$SECOND" "$2" "1800"
}
login 'admin@smoke.invalid' 'SmokeTestPassword2026!'
post --data-urlencode 'action=fee_plan_save' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" --data-urlencode 'monthly_tuition=2500'
post --data-urlencode 'action=fee_month_generate' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" \
 --data-urlencode "billing_month=$MONTH" --data-urlencode "due_date=$DUE"
check_month "$MONTH" 2500
post --data-urlencode 'action=fee_month_generate' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" \
 --data-urlencode "billing_month=$MONTH" --data-urlencode "due_date=$DUE"
check_month "$MONTH" 2500
echo 'PASS: monthly generation is idempotent'

post --data-urlencode 'action=fee_plan_save' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" --data-urlencode 'monthly_tuition=2800'
check_month "$MONTH" 2500
post --data-urlencode 'action=fee_month_generate' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" \
 --data-urlencode "billing_month=$NEXT_MONTH" --data-urlencode "due_date=$NEXT_DUE"
check_month "$NEXT_MONTH" 2800
echo 'PASS: plan changes do not alter existing invoices'

login 'salary-accountant@smoke.invalid' 'TestPassword2026!'
deny403 --data-urlencode 'action=fee_plan_save' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" --data-urlencode 'monthly_tuition=9999'
post --data-urlencode 'action=fee_month_generate' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" \
 --data-urlencode "billing_month=$MONTH" --data-urlencode "due_date=$DUE"
check_month "$MONTH" 2500
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q 'Class Monthly Fee Plans' "$PAGE"
grep -q 'Monthly Invoice Line Items' "$PAGE"
echo 'PASS: accountant may bill their campus but cannot modify plans'

login 'student@smoke.invalid' 'TestPassword2026!'
deny403 --data-urlencode 'action=fee_month_generate' --data-urlencode '_back=finance' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode "class_id=$CLASS" \
 --data-urlencode "billing_month=$MONTH" --data-urlencode "due_date=$DUE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q 'Monthly Invoice Line Items' "$PAGE"
grep -q 'Class tuition' "$PAGE"
if grep -q 'Transport: Route A' "$PAGE"; then echo 'ERROR: student can see another student transport fee item'; exit 1; fi
echo 'PASS: student can view own charges, cannot generate invoices or see peer line items'
