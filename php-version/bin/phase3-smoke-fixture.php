<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit("CLI only\n");
require dirname(__DIR__).'/app/core.php';
$school=one("SELECT id FROM schools WHERE code='smoke-school'");
if(!$school)throw new RuntimeException("Run earlier smoke tests first");
$sid=(int)$school['id'];
$branch=one("SELECT id FROM branches WHERE school_id=? AND code='MAIN'",[$sid]);
$class9=one("SELECT id FROM classes WHERE school_id=? AND name='Class 9'",[$sid]);
$learner=one("SELECT id FROM users WHERE school_id=? AND email='student@smoke.invalid'",[$sid]);
if(!$branch||!$class9||!$learner)throw new RuntimeException("Missing Phase 2 fixtures");
$bid=(int)$branch['id'];
db()->beginTransaction();
try{
 run("INSERT INTO school_sessions(school_id,name,start_date,end_date,is_current) VALUES (?,'2026-2027','2026-08-01','2027-07-31',1)",[$sid]);
 run("INSERT INTO classes(school_id,name,sort_order) VALUES (?,'Class 10',10)",[$sid]);
 $class10=(int)db()->lastInsertId();
 run("INSERT INTO sections(school_id,branch_id,class_id,name,capacity) VALUES (?,?,?,'B',2)",[$sid,$bid,$class10]);
 run("INSERT INTO library_books(school_id,branch_id,title,author,isbn,copies) VALUES (?,?,'School Mathematics 9','CampusOS Test Author','CI-BOOK-009',1)",[$sid,$bid]);
 db()->commit();
 echo "PASS: academic session, destination class and library book fixtures created\n";
}catch(Throwable $e){db()->rollBack();throw $e;}
