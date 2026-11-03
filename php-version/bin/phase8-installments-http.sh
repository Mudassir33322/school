#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
SCHOOL="$(php -r 'require "app/core.php";echo one("SELECT id FROM schools WHERE code=?",["smoke-school"])["id"];')"
MONTH="$(php -r 'require "app/core.php";echo date("Y-m");')"
FIRST="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE email=?",["student@smoke.invalid"])["id"];')"
SECOND="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE email=?",["second@smoke.invalid"])["id"];')"
INVOICE="$(php -r 'require "app/core.php";echo one("SELECT id FROM fee_invoices WHERE student_user_id=? AND billing_month=?",[(int)$argv[1],$argv[2]])["id"];' "$FIRST" "$MONTH")"
INVOICE2="$(php -r 'require "app/core.php";echo one("SELECT id FROM fee_invoices WHERE student_user_id=? AND billing_month=?",[(int)$argv[1],$argv[2]])["id"];' "$SECOND" "$MONTH")"
login(){
 : > "$COOKIE"
 curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
 TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
 [[ -n "$TOKEN" ]] || { echo "No login CSRF"; exit 1; }
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode "_csrf=$TOKEN" --data-urlencode 'action=login' --data-urlencode 'portal=school' \
  --data-urlencode 'school_code=smoke-school' --data-urlencode "email=$1" --data-urlencode "password=$2" "$BASE_URL/")"
 [[ "$status" == '302' ]] || { echo "ERROR: login $1 gave $status"; exit 1; }
}
post(){
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
 [[ "$status" == '302' ]] || { echo "ERROR: POST returned $status"; exit 1; }
}
deny403(){
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
 [[ "$status" == '403' ]] || { echo "ERROR: expected 403, got $status"; exit 1; }
}
check_schedule(){
 php -r '
 require "app/core.php";
 $id=(int)$argv[1];
 $p=one("SELECT id,installment_count FROM fee_installment_plans WHERE school_id=? AND invoice_id=?",[(int)$argv[2],$id]);
 if(!$p)exit(1);
 $rows=many("SELECT sequence_no,due_date,amount FROM fee_installments WHERE school_id=? AND plan_id=? ORDER BY sequence_no",[(int)$argv[2],$p["id"]]);
 if(count($rows)!==(int)$argv[3]||(int)$p["installment_count"]!==(int)$argv[3])exit(1);
 $expected=explode(",",$argv[4]);
 $sum=0;
 foreach($rows as $k=>$row){
  if($row["due_date"]!==$expected[$k]||(int)$row["sequence_no"]!==$k+1)exit(1);
  $sum+=(int)round((float)$row["amount"]*100);
 }
 if($sum!==(int)$argv[5]){fwrite(STDERR,"Wrong installment sum: $sum\n");exit(1);}
 echo "PASS: exact $sum cents and anchored due dates\n";
 ' "$1" "$SCHOOL" "$2" "$3" "$4"
}
login 'admin@smoke.invalid' 'SmokeTestPassword2026!'
post --data-urlencode 'action=fee_installments_create' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'installment_count=3' \
  --data-urlencode 'first_due_date=2026-01-31'
check_schedule "$INVOICE" 3 "2026-01-31,2026-02-28,2026-03-31" 430000
post --data-urlencode 'action=fee_installments_create' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'installment_count=3' \
  --data-urlencode 'first_due_date=2026-01-31'
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM fee_installment_plans WHERE invoice_id=?",[(int)$argv[1]])["n"]!==1)exit(1);' "$INVOICE"
post --data-urlencode 'action=fee_installments_create' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE2" --data-urlencode 'installment_count=2' \
  --data-urlencode 'first_due_date=2026-05-15'
check_schedule "$INVOICE2" 2 "2026-05-15,2026-06-15" 430000
echo "PASS: duplicate plans blocked and schedules sum to invoice exactly"

# After Phase 7, first invoice has 3,500 net paid + 200 concession, leaving 600 outstanding.
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q 'Installment Schedule &amp; Live Dues' "$PAGE"
grep -q '600.00' "$PAGE"
grep -q 'Overdue' "$PAGE"
post --data-urlencode 'action=fee_payment' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'amount=600' --data-urlencode 'mode=cash'
php -r '
require "app/core.php";$id=(int)$argv[1];
$i=one("SELECT amount FROM fee_invoices WHERE id=?",[$id]);
$p=(float)one("SELECT SUM(amount) n FROM fee_payments WHERE invoice_id=?",[$id])["n"];
$r=(float)one("SELECT SUM(amount) n FROM fee_refunds WHERE invoice_id=?",[$id])["n"];
$d=(float)one("SELECT SUM(amount) n FROM fee_adjustments WHERE invoice_id=?",[$id])["n"];
if(abs((float)$i["amount"]-$p+$r-$d)>0.005)exit(1);
' "$INVOICE"
REFUND_SOURCE="$(php -r 'require "app/core.php";echo one("SELECT id FROM fee_payments WHERE invoice_id=? AND amount=3500",[(int)$argv[1]])["id"];' "$INVOICE")"
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$REFUND_SOURCE" --data-urlencode 'amount=100' \
  --data-urlencode 'mode=cash' --data-urlencode 'reason=Reconciliation adjustment'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q '100.00' "$PAGE"
echo 'PASS: paid installments settle and refund reopens outstanding dues'

login 'east-accountant@smoke.invalid' 'TestPassword2026!'
post --data-urlencode 'action=fee_installments_create' --data-urlencode '_back=finance' \
 --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'installment_count=4' \
 --data-urlencode 'first_due_date=2026-04-01'
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM fee_installment_plans WHERE invoice_id=?",[(int)$argv[1]])["n"]!==1)exit(1);' "$INVOICE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=reports" > "$PAGE"
grep -q 'Financial Reconciliation' "$PAGE"
if grep -q 'M2026' "$PAGE"; then echo 'ERROR: east accountant can see other campus fee rows'; exit 1; fi
echo 'PASS: other campus accountant sees no unrelated plan or financial entries'

login 'fee-parent@smoke.invalid' 'TestPassword2026!'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q 'Installment Schedule &amp; Live Dues' "$PAGE"
grep -q '2026-02-28' "$PAGE"
if grep -q '2026-05-15' "$PAGE"; then echo 'ERROR: guardian saw another student plan'; exit 1; fi
deny403 --data-urlencode 'action=fee_installments_create' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'installment_count=4' \
  --data-urlencode 'first_due_date=2026-04-01'
echo 'PASS: linked guardian sees only their schedule and cannot create installments'

login 'student@smoke.invalid' 'TestPassword2026!'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q '2026-03-31' "$PAGE"
if grep -q '2026-05-15' "$PAGE"; then echo 'ERROR: student saw peer schedule'; exit 1; fi
echo 'PASS: enrolled student can see only their own installment dues'

login 'admin@smoke.invalid' 'SmokeTestPassword2026!'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=reports" > "$PAGE"
grep -q 'Financial Reconciliation' "$PAGE"
grep -q 'Receipts &amp; Refunds' "$PAGE"
grep -q 'Outstanding' "$PAGE"
grep -q 'Overdue Invoices' "$PAGE"
echo 'PASS: financial reconciliation, cash movement and overdue dashboards render'
