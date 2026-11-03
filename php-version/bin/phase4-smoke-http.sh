#!/usr/bin/env bash
set -euo pipefail
BASE_URL="http://127.0.0.1:8080"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
[[ -n "$TOKEN" ]] || { echo "No CSRF token"; exit 1; }
post() {
 local status
 status="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST --data-urlencode "_csrf=$TOKEN" "$@" "$BASE_URL/")"
 [[ "$status" == '302' ]] || { echo "Expected redirect, got $status"; cat "$PAGE"; exit 1; }
}
post --data-urlencode 'action=login' --data-urlencode 'portal=school' \
 --data-urlencode 'school_code=smoke-school' --data-urlencode 'email=admin@smoke.invalid' \
 --data-urlencode 'password=SmokeTestPassword2026!'
SCHOOL="$(php -r 'require "app/core.php";echo one("SELECT id FROM schools WHERE code=?",["smoke-school"])["id"];')"
BRANCH="$(php -r 'require "app/core.php";echo one("SELECT id FROM branches WHERE school_id=? AND code=?",[(int)$argv[1],"MAIN"])["id"];' "$SCHOOL")"
STUDENT="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE school_id=? AND email=?",[(int)$argv[1],"student@smoke.invalid"])["id"];' "$SCHOOL")"
post --data-urlencode 'action=transport_route' --data-urlencode '_back=transport' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode 'name=Route A' \
 --data-urlencode 'vehicle=BUS-001' --data-urlencode 'driver_name=Example Driver' \
 --data-urlencode 'monthly_fee=1800' --data-urlencode 'seat_capacity=1'
ROUTE="$(php -r 'require "app/core.php";echo one("SELECT id FROM transport_routes WHERE name=?",["Route A"])["id"];')"
post --data-urlencode 'action=transport_assign' --data-urlencode '_back=transport' \
 --data-urlencode "route_id=$ROUTE" --data-urlencode "student_user_id=$STUDENT"
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM transport_assignments WHERE released_at IS NULL")["n"]!==1)exit(1);'
post --data-urlencode 'action=transport_assign' --data-urlencode '_back=transport' \
 --data-urlencode "route_id=$ROUTE" --data-urlencode "student_user_id=$STUDENT"
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM transport_assignments")["n"]!==1)exit(1);'
echo 'PASS: duplicate active student transport assignment rejected'

# Second user tests seat capacity even when a different student requests the route.
php -r '
require "app/core.php";
$s=(int)$argv[1]; $b=(int)$argv[2];
$c=one("SELECT id FROM classes WHERE school_id=? AND name=?",[$s,"Class 10"]);
$sec=one("SELECT id FROM sections WHERE school_id=? AND class_id=?",[$s,$c["id"]]);
run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'\''student'\'','\''Other Student'\'','\''second@smoke.invalid'\'',?)",[$s,$b,password_hash("TestPassword2026!",PASSWORD_DEFAULT)]);
$id=(int)db()->lastInsertId();
run("INSERT INTO student_profiles(school_id,branch_id,user_id,class_id,section_id,admission_no) VALUES (?,?,?,?,?,?)",[$s,$b,$id,$c["id"],$sec["id"],"SMOKE-002"]);
' "$SCHOOL" "$BRANCH"
SECOND="$(php -r 'require "app/core.php";echo one("SELECT id FROM users WHERE email=?",["second@smoke.invalid"])["id"];')"
post --data-urlencode 'action=transport_assign' --data-urlencode '_back=transport' \
 --data-urlencode "route_id=$ROUTE" --data-urlencode "student_user_id=$SECOND"
php -r 'require "app/core.php";if((int)one("SELECT COUNT(*) n FROM transport_assignments")["n"]!==1)exit(1);'
echo 'PASS: capacity-one route rejects second student'

ASSIGNMENT="$(php -r 'require "app/core.php";echo one("SELECT id FROM transport_assignments WHERE released_at IS NULL")["id"];')"
post --data-urlencode 'action=transport_release' --data-urlencode '_back=transport' \
 --data-urlencode "assignment_id=$ASSIGNMENT"
post --data-urlencode 'action=transport_assign' --data-urlencode '_back=transport' \
 --data-urlencode "route_id=$ROUTE" --data-urlencode "student_user_id=$SECOND"
php -r 'require "app/core.php";$a=(int)one("SELECT COUNT(*) n FROM transport_assignments WHERE released_at IS NULL")["n"];$t=(int)one("SELECT COUNT(*) n FROM transport_assignments")["n"];if($a!==1||$t!==2)exit(1);'
echo 'PASS: seat release allows reassignment'

post --data-urlencode 'action=inventory_item' --data-urlencode '_back=resources' \
 --data-urlencode "branch_id=$BRANCH" --data-urlencode 'name=Whiteboard Markers' \
 --data-urlencode 'sku=CI-WHITE-001' --data-urlencode 'quantity=5'
ITEM="$(php -r 'require "app/core.php";echo one("SELECT id FROM inventory_items WHERE sku=?",["CI-WHITE-001"])["id"];')"
post --data-urlencode 'action=inventory_move' --data-urlencode '_back=resources' \
 --data-urlencode "item_id=$ITEM" --data-urlencode 'movement_type=receipt' \
 --data-urlencode 'quantity=3' --data-urlencode 'reason=New shipment'
post --data-urlencode 'action=inventory_move' --data-urlencode '_back=resources' \
 --data-urlencode "item_id=$ITEM" --data-urlencode 'movement_type=issue' \
 --data-urlencode 'quantity=6' --data-urlencode 'reason=Issued to classroom'
post --data-urlencode 'action=inventory_move' --data-urlencode '_back=resources' \
 --data-urlencode "item_id=$ITEM" --data-urlencode 'movement_type=issue' \
 --data-urlencode 'quantity=3' --data-urlencode 'reason=Overdraw attempt'
php -r '
require "app/core.php";$id=(int)$argv[1];
$i=one("SELECT quantity FROM inventory_items WHERE id=?",[$id]);
$m=many("SELECT movement_type,quantity,balance_before,balance_after FROM inventory_movements WHERE item_id=? ORDER BY id",[$id]);
if((int)$i["quantity"]!==2||count($m)!==3)exit(1);
if($m[0]["movement_type"]!=="opening"||(int)$m[0]["balance_after"]!==5)exit(1);
if($m[1]["movement_type"]!=="receipt"||(int)$m[1]["balance_after"]!==8)exit(1);
if($m[2]["movement_type"]!=="issue"||(int)$m[2]["balance_after"]!==2)exit(1);
echo "PASS: inventory movements reconcile and negative stock blocked\n";' "$ITEM"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=transport" > "$PAGE"
grep -q 'Student Route Assignments' "$PAGE"
curl -fsS -b "$COOKIE" "$BASE_URL/?page=resources" > "$PAGE"
grep -q 'Stock Movement Ledger' "$PAGE"
echo 'PASS: transport and inventory pages rendered'
