<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit("CLI only\n");
require dirname(__DIR__).'/app/core.php';
$s=one("SELECT id FROM schools WHERE code='smoke-school'");
if(!$s)throw new RuntimeException('Run earlier smoke tests first');
$school=(int)$s['id'];
$branch=one("SELECT id FROM branches WHERE school_id=? AND code='MAIN'",[$school]);
if(!$branch)throw new RuntimeException('Missing school branch');
$branchId=(int)$branch['id'];
$people=[
 ['staff','Payroll Test Employee','salary-employee@smoke.invalid'],
 ['staff','Other Test Employee','other-employee@smoke.invalid'],
 ['accountant','Payroll Test Accountant','salary-accountant@smoke.invalid'],
 ['principal','Payroll Test Principal','salary-principal@smoke.invalid'],
];
db()->beginTransaction();
try{
 foreach($people as [$role,$name,$email]){
  if(one("SELECT id FROM users WHERE school_id=? AND email=?",[$school,$email]))throw new RuntimeException('Duplicate payroll fixture');
  run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,?,?,?,?)",
   [$school,$branchId,$role,$name,$email,password_hash('TestPassword2026!',PASSWORD_DEFAULT)]);
 }
 db()->commit();
 echo "PASS: Payroll HR test accounts created\n";
}catch(Throwable $e){db()->rollBack();throw $e;}
