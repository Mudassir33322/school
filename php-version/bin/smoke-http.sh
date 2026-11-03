#!/usr/bin/env bash
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
COOKIE="$(mktemp)"
PAGE="$(mktemp)"
trap 'rm -f "$COOKIE" "$PAGE"' EXIT
curl -fsS -c "$COOKIE" -b "$COOKIE" "$BASE_URL/?page=login" > "$PAGE"
TOKEN="$(sed -n 's/.*name="_csrf" value="\([^"]*\)".*/\1/p' "$PAGE" | head -n1)"
if [[ -z "$TOKEN" ]]; then echo "ERROR: missing login CSRF token"; exit 1; fi
STATUS="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode "action=login" --data-urlencode "_csrf=$TOKEN" \
  --data-urlencode "portal=school" --data-urlencode "school_code=smoke-school" \
  --data-urlencode "email=admin@smoke.invalid" \
  --data-urlencode "password=SmokeTestPassword2026!" "$BASE_URL/")"
if [[ "$STATUS" != "302" ]]; then echo "ERROR: expected school login redirect, got $STATUS"; cat "$PAGE"; exit 1; fi
curl -fsS -b "$COOKIE" "$BASE_URL/?page=dashboard" > "$PAGE"
grep -q 'Smoke Test School' "$PAGE"
grep -q 'School Setup' "$PAGE"
echo "PASS: authenticated school admin dashboard"

curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode "action=class" --data-urlencode "_back=setup" --data-urlencode "_csrf=$TOKEN" \
  --data-urlencode "name=Class 9" "$BASE_URL/" | grep -q '^302$'
php -r 'require "app/core.php"; if (!one("SELECT id FROM classes WHERE name=? AND school_id=(SELECT id FROM schools WHERE code=?)",["Class 9","smoke-school"])) exit(1); echo "PASS: school class created".PHP_EOL;'

STATUS="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" "$BASE_URL/?page=company")"
[[ "$STATUS" == '302' ]] || { echo "ERROR: school user unexpectedly accessed company portal ($STATUS)"; exit 1; }
echo "PASS: company portal separation"

curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" -X POST \
  --data-urlencode "action=logout" --data-urlencode "_csrf=$TOKEN" "$BASE_URL/" | grep -q '^302$'
STATUS="$(curl -sS -o "$PAGE" -w '%{http_code}' -b "$COOKIE" -c "$COOKIE" "$BASE_URL/?page=dashboard")"
[[ "$STATUS" == '302' ]] || { echo "ERROR: dashboard remained accessible after logout ($STATUS)"; exit 1; }
echo "PASS: logout invalidates school session"
