#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
php bin/phase7-fee-refunds-fixture.php
MONTH="$(php -r 'require "app/core.php";echo date("Y-m");')"
STUDENT="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE email=?",["student@smoke.invalid"])["id"];')"
INVOICE="$(php -r '
require "app/core.php";$m=$argv[1];$u=(int)$argv[2];
$r=one("SELECT id,amount FROM fee_invoices WHERE billing_month=? AND student_user_id=?",[$m,$u]);
if(!$r||(float)$r["amount"]!==4300.0)exit(1);echo $r["id"];
' "$MONTH" "$STUDENT")"
login(){
  : > "$COOKIE"
  curl -fsS -b "$COOKIE" -c "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
  TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
  [[ -n "$TOKEN" ]] || { echo "ERROR: CSRF missing"; exit 1; }
  local code
  code="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode 'action=login' --data-urlencode "_csrf=$TOKEN" \
    --data-urlencode 'portal=school' --data-urlencode 'school_code=smoke-school' \
    --data-urlencode "email=$1" --data-urlencode "password=$2" "$BASE_URL/")"
  [[ "$code" == '302' ]] || { echo "ERROR: login failed for $1: $code"; exit 1; }
}
post(){
  local code
  code="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$code" == '302' ]] || { echo "ERROR: expected redirect $code"; cat "$PAGE"; exit 1; }
}
deny403(){
  local code
  code="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
    --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$code" == '403' ]] || { echo "ERROR: expected access denied but got $code"; exit 1; }
}
balance(){
  php -r '
  require "app/core.php";$id=(int)$argv[1];
  $invoice=one("SELECT amount FROM fee_invoices WHERE id=?",[$id]);
  $gross=(float)one("SELECT COALESCE(SUM(amount),0) n FROM fee_payments WHERE invoice_id=?",[$id])["n"];
  $refund=(float)one("SELECT COALESCE(SUM(amount),0) n FROM fee_refunds WHERE invoice_id=?",[$id])["n"];
  $discount=(float)one("SELECT COALESCE(SUM(amount),0) n FROM fee_adjustments WHERE invoice_id=?",[$id])["n"];
  $net=$gross-$refund;$due=(float)$invoice["amount"]-$net-$discount;
  if(abs($net-(float)$argv[2])>0.001||abs($refund-(float)$argv[3])>0.001||abs($discount-(float)$argv[4])>0.001||abs($due-(float)$argv[5])>0.001){
   fwrite(STDERR,"ERROR: net=$net refund=$refund discount=$discount due=$due\n");exit(1);
  }
  ' "$INVOICE" "$1" "$2" "$3" "$4"
}
login 'admin@smoke.invalid' 'SmokeTestPassword2026!'
post --data-urlencode 'action=fee_payment' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'amount=1000' --data-urlencode 'mode=cash'
PAYMENT="$(php -r 'require "app/core.php";echo one("SELECT id FROM fee_payments WHERE invoice_id=? ORDER BY id DESC LIMIT 1",[(int)$argv[1]])["id"];' "$INVOICE")"
balance 1000 0 0 3300
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=400' \
  --data-urlencode 'mode=cash' --data-urlencode 'reason=Partial overcollection returned'
balance 600 400 0 3700
echo 'PASS: partial refund reduced net paid and increased balance'
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=700' \
  --data-urlencode 'mode=cash' --data-urlencode 'reason=Over-refund attempt'
balance 600 400 0 3700
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=100' \
  --data-urlencode 'mode=bank' --data-urlencode 'reason=Missing reference'
balance 600 400 0 3700
echo 'PASS: over-refund and missing bank reference rejected'
post --data-urlencode 'action=fee_adjustment' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'amount=200' \
  --data-urlencode 'adjustment_type=concession' --data-urlencode 'reason=Financial assistance'
balance 600 400 200 3500
post --data-urlencode 'action=fee_payment' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'amount=3600' --data-urlencode 'mode=cash'
balance 600 400 200 3500
post --data-urlencode 'action=fee_payment' --data-urlencode '_back=finance' \
  --data-urlencode "invoice_id=$INVOICE" --data-urlencode 'amount=3500' --data-urlencode 'mode=cash'
balance 4100 400 200 0
echo 'PASS: concession and refunded amount respected by payment cap'
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=600' \
  --data-urlencode 'mode=bank' --data-urlencode 'reference=CI-REFUND-001' \
  --data-urlencode 'reason=Refund remaining original payment'
balance 3500 1000 200 600
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=1' \
  --data-urlencode 'mode=cash' --data-urlencode 'reason=Duplicate refund'
balance 3500 1000 200 600
echo 'PASS: cumulative full refund and duplicate over-refund rejected'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance" > "$PAGE"
grep -q 'Refund Audit History' "$PAGE"
grep -q 'Net Paid' "$PAGE"
grep -q 'Fee Payment History & Receipts' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance&receipt=$PAYMENT" > "$PAGE"
grep -q 'Fee Payment Receipt' "$PAGE"
grep -q 'Net retained against this payment' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance&statement=$STUDENT" > "$PAGE"
grep -q 'Student Fee Statement' "$PAGE"
grep -q '600.00' "$PAGE"
echo 'PASS: finance refund ledger and printable receipt/statement render'
login 'east-accountant@smoke.invalid' 'TestPassword2026!'
post --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=10' \
  --data-urlencode 'mode=cash' --data-urlencode 'reason=Other campus attempt'
balance 3500 1000 200 600
status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" "$BASE_URL/?page=finance&receipt=$PAYMENT")"
[[ "$status" == '404' ]] || { echo "ERROR: other campus receipt accessible"; exit 1; }
echo 'PASS: accountant cannot refund or print another campus payment'
login 'fee-parent@smoke.invalid' 'TestPassword2026!'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance&receipt=$PAYMENT" > "$PAGE"
grep -q 'Fee Payment Receipt' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=finance&statement=$STUDENT" > "$PAGE"
grep -q 'Student Fee Statement' "$PAGE"
deny403 --data-urlencode 'action=fee_refund' --data-urlencode '_back=finance' \
  --data-urlencode "payment_id=$PAYMENT" --data-urlencode 'amount=10' \
  --data-urlencode 'mode=cash' --data-urlencode 'reason=Unauthorized parent'
echo 'PASS: guardian can print linked student records but cannot record refund'
login 'second@smoke.invalid' 'TestPassword2026!'
status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" "$BASE_URL/?page=finance&receipt=$PAYMENT")"
[[ "$status" == '404' ]] || { echo "ERROR: peer receipt exposed"; exit 1; }
status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" "$BASE_URL/?page=finance&statement=$STUDENT")"
[[ "$status" == '404' ]] || { echo "ERROR: peer statement exposed"; exit 1; }
echo 'PASS: student cannot access another student receipt or statement'
