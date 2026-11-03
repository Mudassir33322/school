<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit("CLI only\n");
require dirname(__DIR__).'/app/core.php';
$school=one("SELECT id FROM schools WHERE code='smoke-school'");
if(!$school)throw new RuntimeException('Smoke school missing');
$s=(int)$school['id'];
$main=one("SELECT id FROM branches WHERE school_id=? AND code='MAIN'",[$s]);
$student=one("SELECT id FROM users WHERE school_id=? AND email='student@smoke.invalid'",[$s]);
if(!$main||!$student)throw new RuntimeException('Prerequisite users missing');
db()->beginTransaction();
try{
 run("INSERT INTO branches(school_id,name,code) VALUES (?,'East Campus','EAST')",[$s]);
 $east=(int)db()->lastInsertId();
 run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'accountant','Other Branch Accountant','east-accountant@smoke.invalid',?)",
  [$s,$east,password_hash('TestPassword2026!',PASSWORD_DEFAULT)]);
 run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'parent','Test Guardian','fee-parent@smoke.invalid',?)",
  [$s,(int)$main['id'],password_hash('TestPassword2026!',PASSWORD_DEFAULT)]);
 $parent=(int)db()->lastInsertId();
 run("UPDATE student_profiles SET parent_user_id=? WHERE school_id=? AND user_id=?",[$parent,$s,$student['id']]);
 db()->commit();
 echo "PASS: parent and cross-campus accounting fixtures\n";
}catch(Throwable $e){db()->rollBack();throw $e;}
