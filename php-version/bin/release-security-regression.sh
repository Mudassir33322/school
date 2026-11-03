#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT

# Existing multi-phase CI has already created MAIN, EAST, Class 10, admin and principal.
php -r '
require "app/core.php";
$s=(int)one("SELECT id FROM schools WHERE code=?",["smoke-school"])["id"];
$east=(int)one("SELECT id FROM branches WHERE school_id=? AND code=?",[$s,"EAST"])["id"];
$class=(int)one("SELECT id FROM classes WHERE school_id=? AND name=?",[$s,"Class 10"])["id"];
$admin=(int)one("SELECT id FROM users WHERE school_id=? AND email=?",[$s,"admin@smoke.invalid"])["id"];
run("INSERT INTO sections(school_id,branch_id,class_id,name,capacity) VALUES (?,?,? ,?,?)",[$s,$east,$class,"East-9",35]);
$section=(int)db()->lastInsertId();
run("INSERT INTO admission_applications(school_id,branch_id,class_id,section_id,applicant_name,applicant_email,guardian_name,guardian_email,guardian_phone,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",
 [$s,$east,$class,$section,"EAST-PRIVATE-APPLICANT","east-private@smoke.invalid","Test Parent","east-parent@smoke.invalid","0000000",$admin]);
run("INSERT INTO library_books(school_id,branch_id,title,copies) VALUES (?,?,?,?)",[$s,$east,"EAST-PRIVATE-BOOK",2]);
run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,? ,?,?,?,?)",[$s,$east,"student","EAST-PRIVATE-STUDENT","east-private-student@smoke.invalid",password_hash("TestPassword2026!",PASSWORD_DEFAULT)]);
$id=(int)db()->lastInsertId();
run("INSERT INTO student_profiles(school_id,branch_id,user_id,class_id,section_id,admission_no) VALUES (?,?,?,?,?,?)",[$s,$east,$id,$class,$section,"EAST-SECRET-001"]);
echo "PASS: second-campus sensitive data fixtures created\n";
'
login(){
 : > "$COOKIE"
 curl -fsS -b "$COOKIE" -c "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
 TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
 [[ -n "$TOKEN" ]] || { echo "ERROR: no login token"; exit 1; }
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode '_csrf='"$TOKEN" --data-urlencode 'action=login' \
  --data-urlencode 'portal=school' --data-urlencode 'school_code=smoke-school' \
  --data-urlencode "email=$1" --data-urlencode "password=$2" "$BASE_URL/")"
 [[ "$status" == '302' ]] || { echo "ERROR: cannot login $1 ($status)"; exit 1; }
}
denied(){
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
 [[ "$status" == '403' ]] || { echo "ERROR: expected 403 but got $status"; cat "$PAGE"; exit 1; }
}
post(){
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
 [[ "$status" == '302' ]] || { echo "ERROR: expected redirect but got $status"; cat "$PAGE"; exit 1; }
}
absent(){
 php -r 'require "app/core.php";if(one("SELECT id FROM users WHERE email=?",[$argv[1]]))exit(1);' "$1"
}

login "salary-principal@smoke.invalid" "TestPassword2026!"
denied --data-urlencode 'action=branch' --data-urlencode '_back=setup' --data-urlencode 'name=Rogue Branch' --data-urlencode 'code=ROGUE'
denied --data-urlencode 'action=class' --data-urlencode '_back=setup' --data-urlencode 'name=Rogue Class'
denied --data-urlencode 'action=session_activate' --data-urlencode '_back=setup' --data-urlencode 'session_id=1'
denied --data-urlencode 'action=notice' --data-urlencode '_back=notices' --data-urlencode 'title=Rogue Notice' --data-urlencode 'body=Test Notice'
post --data-urlencode 'action=person' --data-urlencode '_back=people' --data-urlencode 'role=accountant' \
 --data-urlencode 'branch_id=1' --data-urlencode 'full_name=Rogue Accountant' \
 --data-urlencode 'email=rogue-accountant@smoke.invalid' --data-urlencode 'password=VeryLongSecurePassword2026!'
absent 'rogue-accountant@smoke.invalid'
EAST="$(php -r 'require "app/core.php";echo one("SELECT id FROM branches WHERE code=?",["EAST"])["id"];')"
post --data-urlencode 'action=person' --data-urlencode '_back=people' --data-urlencode 'role=teacher' \
 --data-urlencode "branch_id=$EAST" --data-urlencode 'full_name=Rogue East Teacher' \
 --data-urlencode 'email=rogue-teacher@smoke.invalid' --data-urlencode 'password=VeryLongSecurePassword2026!'
absent 'rogue-teacher@smoke.invalid'
post --data-urlencode 'action=library_book' --data-urlencode '_back=resources' --data-urlencode "branch_id=$EAST" \
 --data-urlencode 'title=Rogue East Book' --data-urlencode 'copies=3'
php -r 'require "app/core.php";if(one("SELECT id FROM library_books WHERE title=?",["Rogue East Book"]))exit(1);'
echo "PASS: principal cannot change global setup, mint privileged accounts or write other-campus books"

curl -fsS -b "$COOKIE" "$BASE_URL/?page=admissions" > "$PAGE"
! grep -q 'EAST-PRIVATE-APPLICANT' "$PAGE" || { echo "ERROR: principal saw other-campus admission"; exit 1; }
curl -fsS -b "$COOKIE" "$BASE_URL/?page=people" > "$PAGE"
! grep -q 'EAST-PRIVATE-STUDENT' "$PAGE" || { echo "ERROR: principal saw other-campus student"; exit 1; }
curl -fsS -b "$COOKIE" "$BASE_URL/?page=resources" > "$PAGE"
! grep -q 'EAST-PRIVATE-BOOK' "$PAGE" || { echo "ERROR: principal saw other-campus library book"; exit 1; }
curl -fsS -b "$COOKIE" "$BASE_URL/?page=setup" > "$PAGE"
! grep -q 'Create Branch' "$PAGE" || { echo "ERROR: principal has school-wide branch form"; exit 1; }
! grep -q 'Add Subject' "$PAGE" || { echo "ERROR: principal has school-wide subject form"; exit 1; }
echo "PASS: principal user interface isolates campus admissions, students, library and global setup"

MAIN="$(php -r 'require "app/core.php";echo one("SELECT id FROM branches WHERE code=?",["MAIN"])["id"];')"
post --data-urlencode 'action=person' --data-urlencode '_back=people' --data-urlencode 'role=teacher' \
 --data-urlencode "branch_id=$MAIN" --data-urlencode 'full_name=Local Teacher' \
 --data-urlencode 'email=local-teacher@smoke.invalid' --data-urlencode 'password=VeryLongSecurePassword2026!'
php -r 'require "app/core.php";if(!one("SELECT id FROM users WHERE email=?",["local-teacher@smoke.invalid"]))exit(1);'
echo "PASS: principal retains authorized own-campus teacher onboarding"

login "admin@smoke.invalid" "SmokeTestPassword2026!"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=admissions" > "$PAGE"
grep -q 'EAST-PRIVATE-APPLICANT' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=resources" > "$PAGE"
grep -q 'EAST-PRIVATE-BOOK' "$PAGE"
echo "PASS: school admin retains full school oversight"
