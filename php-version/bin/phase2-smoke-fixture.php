<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') exit("CLI only\n");
require dirname(__DIR__).'/app/core.php';
$school=one("SELECT id FROM schools WHERE code='smoke-school'");
if(!$school)throw new RuntimeException('Missing smoke school');
$schoolId=(int)$school['id'];
$branch=one("SELECT id FROM branches WHERE school_id=? AND code='MAIN'",[$schoolId]);
$class=one("SELECT id FROM classes WHERE school_id=? AND name='Class 9'",[$schoolId]);
if(!$branch||!$class)throw new RuntimeException('Run phase 1 smoke first');
$branchId=(int)$branch['id'];$classId=(int)$class['id'];
db()->beginTransaction();
try{
 run("INSERT INTO sections(school_id,branch_id,class_id,name,capacity) VALUES (?,?,?,'A',40)",[$schoolId,$branchId,$classId]);
 $sectionId=(int)db()->lastInsertId();
 run("INSERT INTO subjects(school_id,name,code) VALUES (?,'Mathematics','MATH')",[$schoolId]);
 $subjectId=(int)db()->lastInsertId();
 run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'student','Test Learner','student@smoke.invalid',?)",[$schoolId,$branchId,password_hash('TestPassword2026!',PASSWORD_DEFAULT)]);
 $studentId=(int)db()->lastInsertId();
 run("INSERT INTO student_profiles(school_id,branch_id,user_id,class_id,section_id,admission_no) VALUES (?,?,?,?,?,'SMOKE-001')",[$schoolId,$branchId,$studentId,$classId,$sectionId]);
 run("INSERT INTO exams(school_id,branch_id,class_id,section_id,subject_id,title,exam_date,max_marks,passing_marks) VALUES (?,?,?,?,?,'Mathematics Midterm','2026-11-15',100,33)",[$schoolId,$branchId,$classId,$sectionId,$subjectId]);
 run("INSERT INTO fee_invoices(school_id,branch_id,student_user_id,invoice_no,description,amount,due_date) VALUES (?,?,?,'SMOKE-FEE-1','Tuition November',1000,'2026-11-30')",[$schoolId,$branchId,$studentId]);
 db()->commit();
 echo "PASS: Phase 2 fixture created\n";
}catch(Throwable $e){db()->rollBack();throw $e;}
