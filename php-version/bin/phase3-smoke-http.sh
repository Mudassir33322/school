#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
php bin/phase3-smoke-fixture.php
curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
[[ -n "$TOKEN" ]] || { echo "ERROR: CSRF token missing"; exit 1; }
post () {
  local status
  status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
   --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
  [[ "$status" == "302" ]] || { echo "ERROR: expected redirect, got $status"; cat "$PAGE"; exit 1; }
}
post --data-urlencode 'action=login' --data-urlencode 'portal=school' \
  --data-urlencode 'school_code=smoke-school' --data-urlencode 'email=admin@smoke.invalid' \
  --data-urlencode 'password=SmokeTestPassword2026!'
STUDENT="$(php -r 'require "app/core.php"; echo one("SELECT id FROM users WHERE email=?",["student@smoke.invalid"])["id"];')"
SCHOOL="$(php -r 'require "app/core.php"; echo one("SELECT id FROM schools WHERE code=?",["smoke-school"])["id"];')"
BRANCH="$(php -r 'require "app/core.php"; echo one("SELECT id FROM branches WHERE school_id=? AND code=?",[(int)$argv[1],"MAIN"])["id"];' "$SCHOOL")"
CLASS10="$(php -r 'require "app/core.php"; echo one("SELECT id FROM classes WHERE school_id=? AND name=?",[(int)$argv[1],"Class 10"])["id"];' "$SCHOOL")"
SECTION10="$(php -r 'require "app/core.php"; echo one("SELECT id FROM sections WHERE school_id=? AND class_id=?",[(int)$argv[1],(int)$argv[2]])["id"];' "$SCHOOL" "$CLASS10")"
BOOK="$(php -r 'require "app/core.php"; echo one("SELECT id FROM library_books WHERE school_id=? AND isbn=?",[(int)$argv[1],"CI-BOOK-009"])["id"];' "$SCHOOL")"
post --data-urlencode 'action=student_move' --data-urlencode '_back=people' \
  --data-urlencode "student_user_id=$STUDENT" --data-urlencode 'movement_type=promotion' \
  --data-urlencode "to_branch_id=$BRANCH" --data-urlencode "to_class_id=$CLASS10" \
  --data-urlencode "to_section_id=$SECTION10" --data-urlencode 'reason=Academic promotion CI'
php -r '
require "app/core.php";
$p=one("SELECT class_id,section_id FROM student_profiles WHERE user_id=?",[(int)$argv[1]]);
$n=(int)one("SELECT COUNT(*) n FROM student_movements WHERE student_user_id=?",[(int)$argv[1]])["n"];
if(!$p||(int)$p["class_id"]!==(int)$argv[2]||(int)$p["section_id"]!==(int)$argv[3]||$n!==1)exit(1);
echo "PASS: promotion persisted with history\n";' "$STUDENT" "$CLASS10" "$SECTION10"
post --data-urlencode 'action=student_move' --data-urlencode '_back=people' \
  --data-urlencode "student_user_id=$STUDENT" --data-urlencode 'movement_type=promotion' \
  --data-urlencode "to_branch_id=$BRANCH" --data-urlencode "to_class_id=$CLASS10" \
  --data-urlencode "to_section_id=$SECTION10" --data-urlencode 'reason=Invalid repeated promotion'
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM student_movements")["n"]!==1)exit(1);'
echo "PASS: same-section repeat move blocked"

DUE="$(date -u -d '+20 days' '+%F')"
post --data-urlencode 'action=library_loan' --data-urlencode '_back=resources' \
  --data-urlencode "book_id=$BOOK" --data-urlencode "borrower_user_id=$STUDENT" \
  --data-urlencode "due_date=$DUE"
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM library_loans WHERE returned_at IS NULL")["n"]!==1)exit(1);'
post --data-urlencode 'action=library_loan' --data-urlencode '_back=resources' \
  --data-urlencode "book_id=$BOOK" --data-urlencode "borrower_user_id=$STUDENT" \
  --data-urlencode "due_date=$DUE"
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM library_loans")["n"]!==1)exit(1);'
echo "PASS: book stock cannot be oversubscribed"
LOAN="$(php -r 'require "app/core.php";echo one("SELECT id FROM library_loans WHERE returned_at IS NULL")["id"];')"
post --data-urlencode 'action=library_return' --data-urlencode '_back=resources' --data-urlencode "loan_id=$LOAN"
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM library_loans WHERE returned_at IS NULL")["n"]!==0)exit(1);'
post --data-urlencode 'action=library_loan' --data-urlencode '_back=resources' \
  --data-urlencode "book_id=$BOOK" --data-urlencode "borrower_user_id=$STUDENT" \
  --data-urlencode "due_date=$DUE"
php -r '
require "app/core.php";
$all=(int)one("SELECT COUNT(*) n FROM library_loans")["n"];
$active=(int)one("SELECT COUNT(*) n FROM library_loans WHERE returned_at IS NULL")["n"];
if($all!==2||$active!==1)exit(1);
echo "PASS: return restores copy availability\n";'
curl -fsS -b "$COOKIE" "$BASE_URL/?page=people" > "$PAGE"
grep -q 'Movement History' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=resources" > "$PAGE"
grep -q 'Active Library Loans' "$PAGE"
echo "PASS: movement and circulation screens render"
