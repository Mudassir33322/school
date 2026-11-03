<?php
declare(strict_types=1);
require dirname(__DIR__) . '/app/actions.php';
if ($_SERVER['REQUEST_METHOD']==='POST') handle_action();
$page=(string)($_GET['page']??'dashboard');
$allowed=['login','company','dashboard','admissions','setup','people','academics','timetable','attendance','homework','exams','finance','payroll','notices','resources','transport','reports','documents','leave'];
if(!in_array($page,$allowed,true)) {http_response_code(404);exit('Page not found');}
$vendor=null;$u=null;
if($page==='company')$vendor=require_company();
elseif($page!=='login')$u=require_school();
else { if(current_user())redirect('dashboard'); if(company_user())redirect('company'); }
$school=(int)($u['school_id']??0);
$role=(string)($u['role']??'');
$isAdmin=in_array($role,['admin','principal'],true);
$isFinance=in_array($role,['admin','accountant'],true);
$isTeacher=$role==='teacher';
$isStudent=$role==='student';
$isParent=$role==='parent';
$studentIds=$u?user_children($u):[];
$allowedPages=['dashboard'=>true,'notices'=>true,'leave'=>true];
if($isAdmin)$allowedPages+=array_fill_keys(['payroll','admissions','setup','people','academics','timetable','attendance','homework','exams','resources','transport','reports','documents'],true);
if($isFinance)$allowedPages+=array_fill_keys(['finance','payroll','reports'],true);
if($isTeacher)$allowedPages+=array_fill_keys(['payroll','timetable','attendance','homework','exams','academics','reports'],true);
if($role==='staff')$allowedPages['payroll']=true;
if($isStudent||$isParent)$allowedPages+=array_fill_keys(['timetable','attendance','homework','exams','finance','transport','documents'],true);
if($u&&!isset($allowedPages[$page])) {http_response_code(403);exit('Access denied');}
function field(string $label,string $name,string $type='text',string $value='',bool $required=true): void {
 echo '<div class="field"><label for="'.h($name).'">'.h($label).'</label><input id="'.h($name).'" name="'.h($name).'" type="'.h($type).'" value="'.h($value).'"'.($required?' required':'').'></div>';
}
function pick(string $label,string $name,array $options,bool $required=true): void {
 echo '<div class="field"><label>'.h($label).'</label><select name="'.h($name).'"'.($required?' required':'').'><option value="">Choose...</option>';
 foreach($options as $k=>$v) echo '<option value="'.h($k).'">'.h($v).'</option>';
 echo '</select></div>';
}
function opts(array $rows,string $key='id',string $label='name'): array{
 $out=[];foreach($rows as $r)$out[(string)$r[$key]]=(string)$r[$label];return $out;
}
function form_start(string $action,string $back): void{
 echo '<form method="post" action="/"><input type="hidden" name="action" value="'.h($action).'"><input type="hidden" name="_back" value="'.h($back).'">'.csrf_input().'<div class="form-grid">';
}
function form_end(string $title='Save'): void{
 echo '</div><button class="btn btn-primary" type="submit">'.h($title).'</button></form>';
}
function panel(string $heading): void { echo '<div class="card"><h2>'.h($heading).'</h2>'; }
function end_panel(): void{echo '</div>';}
function rows_table(array $rows,array $cols): void{
 echo '<div class="table-wrap"><table class="table"><thead><tr>';
 foreach($cols as $v)echo '<th>'.h($v).'</th>';
 echo '</tr></thead><tbody>';
 foreach($rows as $r){echo '<tr>';foreach($cols as $col=>$v)echo '<td>'.h($r[$col]??'—').'</td>';echo '</tr>';}
 if(!$rows)echo '<tr><td colspan="'.count($cols).'">No records yet.</td></tr>';
 echo '</tbody></table></div>';
}
function stat_card(string $label,string $value,string $icon): void{
 echo '<div class="card"><div class="stat-icon">'.h($icon).'</div><p class="stat-label">'.h($label).'</p><p class="stat-value">'.h($value).'</p></div>';
}
function count_rows(string $table,int $school): string{
 $safe=['users','branches','classes','sections','student_profiles','teacher_allocations','attendance','homework','exams','fee_invoices'];
 if(!in_array($table,$safe,true))return '0';
 return (string)(one('SELECT COUNT(*) n FROM '.$table.' WHERE school_id=?',[$school])['n']??'0');
}
function student_filter(string $field,array $ids): array{
 if(!$ids)return ['1=0',[]];
 return [$field.' IN ('.implode(',',array_fill(0,count($ids),'?')).')',$ids];
}
function selection_data(int $school, array $user): array{
 $role=$user['role'];
 $all=in_array($role,['admin','principal'],true);
 $teacher=$role==='teacher';
 $finance=$role==='accountant';
 $empty=['branches'=>[],'classes'=>[],'sections'=>[],'subjects'=>[],'teachers'=>[],'students'=>[],'parents'=>[],'accounts'=>[]];
 // Student and parent portals never preload the whole school directory.
 if(!$all&&!$teacher&&!$finance)return $empty;
 $data=$empty;
 if($all){
  $data['branches']=many('SELECT id,CONCAT(name," (",code,")") name FROM branches WHERE school_id=? ORDER BY name',[$school]);
  $data['classes']=many('SELECT id,name FROM classes WHERE school_id=? ORDER BY sort_order,name',[$school]);
  $data['sections']=many('SELECT sections.id,CONCAT(classes.name," / ",sections.name) name FROM sections JOIN classes ON classes.id=sections.class_id WHERE sections.school_id=? ORDER BY classes.name,sections.name',[$school]);
  $data['subjects']=many('SELECT id,name FROM subjects WHERE school_id=? ORDER BY name',[$school]);
  $data['teachers']=many("SELECT id,full_name name FROM users WHERE school_id=? AND role='teacher' AND status='active' ORDER BY full_name",[$school]);
  $data['parents']=many("SELECT id,full_name name FROM users WHERE school_id=? AND role='parent' AND status='active' ORDER BY full_name",[$school]);
  $data['accounts']=many("SELECT id,full_name name FROM users WHERE school_id=? AND role='student' AND status='active' ORDER BY full_name",[$school]);
 }
 if($teacher){
  $id=(int)$user['id'];
  $data['classes']=many("SELECT DISTINCT c.id,c.name FROM classes c JOIN teacher_allocations a ON a.class_id=c.id AND a.school_id=c.school_id WHERE a.school_id=? AND a.teacher_user_id=? ORDER BY c.name",[$school,$id]);
  $data['sections']=many("SELECT DISTINCT s.id,CONCAT(c.name,' / ',s.name) name FROM sections s JOIN classes c ON c.id=s.class_id JOIN teacher_allocations a ON a.section_id=s.id AND a.school_id=s.school_id WHERE a.school_id=? AND a.teacher_user_id=? ORDER BY name",[$school,$id]);
  $data['subjects']=many("SELECT DISTINCT sub.id,sub.name FROM subjects sub JOIN teacher_allocations a ON a.subject_id=sub.id AND a.school_id=sub.school_id WHERE a.school_id=? AND a.teacher_user_id=? ORDER BY sub.name",[$school,$id]);
  $data['students']=many("SELECT DISTINCT u.id,CONCAT(u.full_name,' (',sp.admission_no,')') name FROM student_profiles sp JOIN users u ON u.id=sp.user_id AND u.school_id=sp.school_id JOIN teacher_allocations a ON a.school_id=sp.school_id AND a.section_id=sp.section_id AND a.branch_id=sp.branch_id WHERE sp.school_id=? AND a.teacher_user_id=? AND u.status='active' ORDER BY name",[$school,$id]);
 } elseif($all||$finance){
  $sql="SELECT users.id,CONCAT(users.full_name,' (',student_profiles.admission_no,')') name FROM student_profiles JOIN users ON users.id=student_profiles.user_id AND users.school_id=student_profiles.school_id WHERE student_profiles.school_id=? AND users.status='active'";
  $params=[$school];
  if($finance&&!$all){$sql.=' AND student_profiles.branch_id=?';$params[]=(int)$user['branch_id'];}
  $data['students']=many($sql.' ORDER BY users.full_name',$params);
 }
 return $data;
}
if($page==='finance' && (isset($_GET['receipt'])||isset($_GET['statement']))){
 $isReceipt=isset($_GET['receipt']);
 $id=filter_var($isReceipt?$_GET['receipt']:$_GET['statement'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
 if(!$id){http_response_code(404);exit('Financial record not found');}
 if($isReceipt){
  $p=one("SELECT p.*,fi.invoice_no,fi.student_user_id,fi.branch_id,fi.description,fi.due_date,u.full_name student FROM fee_payments p JOIN fee_invoices fi ON fi.id=p.invoice_id AND fi.school_id=p.school_id JOIN users u ON u.id=fi.student_user_id AND u.school_id=fi.school_id WHERE p.school_id=? AND p.id=?",[$school,(int)$id]);
  if(!$p || (($isStudent||$isParent)&&!in_array((int)$p['student_user_id'],$studentIds,true)) || ($role==='accountant'&&(int)$u['branch_id']!==(int)$p['branch_id'])){
   http_response_code(404);exit('Receipt not found or not accessible');
  }
  $refundTotal=(float)(one("SELECT COALESCE(SUM(amount),0) total FROM fee_refunds WHERE school_id=? AND payment_id=?",[$school,$id])['total']??0);
  $printTitle='Fee Payment Receipt #'.$id;
 }else{
  $student=one("SELECT u.id,u.full_name,sp.admission_no,sp.branch_id FROM users u JOIN student_profiles sp ON sp.user_id=u.id AND sp.school_id=u.school_id WHERE u.school_id=? AND u.id=? AND u.role='student'",[$school,(int)$id]);
  if(!$student || (($isStudent||$isParent)&&!in_array((int)$id,$studentIds,true))){
   http_response_code(404);exit('Statement not found or not accessible');
  }
  $statementSql="SELECT fi.invoice_no,fi.description,fi.billing_month,fi.amount,fi.due_date,COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.school_id=fi.school_id AND fp.invoice_id=fi.id),0) gross_paid,COALESCE((SELECT SUM(fr.amount) FROM fee_refunds fr WHERE fr.school_id=fi.school_id AND fr.invoice_id=fi.id),0) refunded,COALESCE((SELECT SUM(fa.amount) FROM fee_adjustments fa WHERE fa.school_id=fi.school_id AND fa.invoice_id=fi.id),0) concession FROM fee_invoices fi WHERE fi.school_id=? AND fi.student_user_id=?";
  $statementArgs=[$school,(int)$id];
  if($role==='accountant'){$statementSql.=' AND fi.branch_id=?';$statementArgs[]=(int)$u['branch_id'];}
  $statementRows=many($statementSql.' ORDER BY fi.due_date,fi.id',$statementArgs);
  if(!$statementRows){http_response_code(404);exit('No invoices available for statement');}
  $overallBalance=0.0;
  foreach($statementRows as &$sr){
   $sr['net_paid']=(float)$sr['gross_paid']-(float)$sr['refunded'];
   $sr['balance']=(float)$sr['amount']-(float)$sr['concession']-$sr['net_paid'];
   $overallBalance += $sr['balance'];
  }
  unset($sr);
  $printTitle='Student Fee Statement';
 }
 ?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title><?=h($printTitle)?> | <?=h($u['school_name'])?></title><style>
 body{font-family:Arial,Helvetica,sans-serif;color:#152344;background:#f0f4fb;padding:32px;margin:0}
 .sheet{max-width:850px;margin:auto;background:white;padding:36px;border-radius:16px;box-shadow:0 9px 32px #17255415}
 .top{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #4f46e5;padding-bottom:16px;gap:18px}
 .top h1{margin:0;color:#312e81}.muted{color:#64748b}.total{font-weight:bold;color:#312e81}
 table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:11px 7px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:13px}th{background:#f8fafc}td.num{text-align:right;white-space:nowrap}
 .btn{border:0;background:#4f46e5;color:white;border-radius:9px;padding:12px 18px;cursor:pointer}.foot{font-size:12px;color:#64748b;margin-top:25px}
 @media print{body{background:white;padding:0}.sheet{box-shadow:none;border-radius:0;padding:0}.no-print{display:none}}
 </style></head><body><main class="sheet"><div class="top"><div><h1><?=h($u['school_name'])?></h1><p class="muted"><?=h($printTitle)?></p></div><strong>CampusOS</strong></div>
 <?php if($isReceipt): ?>
 <h2>Payment Record #<?=h($p['id'])?></h2>
 <p><strong>Student:</strong> <?=h($p['student'])?></p>
 <p><strong>Invoice:</strong> <?=h($p['invoice_no'])?> — <?=h($p['description'])?></p>
 <p><strong>Recorded:</strong> <?=h($p['created_at'])?></p>
 <p><strong>Method:</strong> <?=h($p['mode'])?> | <strong>Reference:</strong> <?=h($p['reference']?:'Not supplied')?></p>
 <table><tr><th>Description</th><th>PKR</th></tr><tr><td>Original payment received</td><td class="num"><?=h(number_format((float)$p['amount'],2))?></td></tr><tr><td>Subsequent refunds</td><td class="num">-<?=h(number_format($refundTotal,2))?></td></tr><tr><td class="total">Net retained against this payment</td><td class="num total"><?=h(number_format((float)$p['amount']-$refundTotal,2))?></td></tr></table>
 <?php else: ?>
 <h2>Student Fee Statement</h2><p><strong>Student:</strong> <?=h($student['full_name'])?> | <strong>Admission #:</strong> <?=h($student['admission_no'])?></p>
 <table><thead><tr><th>Invoice</th><th>Month / Due</th><th>Charge</th><th>Concessions</th><th>Refunds</th><th>Net Paid</th><th>Balance</th></tr></thead><tbody>
 <?php foreach($statementRows as $sr): ?>
 <tr><td><?=h($sr['invoice_no'])?></td><td><?=h($sr['billing_month']?:'Manual')?> / <?=h($sr['due_date'])?></td><td class="num"><?=h(number_format((float)$sr['amount'],2))?></td><td class="num"><?=h(number_format((float)$sr['concession'],2))?></td><td class="num"><?=h(number_format((float)$sr['refunded'],2))?></td><td class="num"><?=h(number_format((float)$sr['net_paid'],2))?></td><td class="num"><?=h(number_format((float)$sr['balance'],2))?></td></tr>
 <?php endforeach; ?>
 <tr><td colspan="6" class="total">Total Outstanding (PKR)</td><td class="num total"><?=h(number_format($overallBalance,2))?></td></tr></tbody></table>
 <?php endif; ?>
 <p class="foot">Generated from the school's internal fee records. Manual payment/refund entries do not independently verify bank settlement.</p>
 <p class="no-print"><button class="btn" onclick="window.print()">Print <?=h($isReceipt?'Receipt':'Statement')?></button></p>
 </main></body></html><?php
 exit;
}
if($page==='payroll' && isset($_GET['print'])){
 $printId=filter_var($_GET['print'],FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
 if(!$printId){http_response_code(404);exit('Payslip not found');}
 $sql="SELECT p.*,e.full_name employee,e.role employee_role,b.name branch_name FROM payroll_entries p JOIN users e ON e.id=p.employee_user_id AND e.school_id=p.school_id LEFT JOIN branches b ON b.id=p.branch_id AND b.school_id=p.school_id WHERE p.school_id=? AND p.id=? AND p.status='paid'";
 $args=[$school,(int)$printId];
 if(in_array($role,['teacher','staff'],true)){$sql.=' AND p.employee_user_id=?';$args[]=(int)$u['id'];}
 if(in_array($role,['principal','accountant'],true)){$sql.=' AND p.branch_id=?';$args[]=(int)$u['branch_id'];}
 $payslip=one($sql,$args);
 if(!$payslip){http_response_code(404);exit('Paid payslip not found or not accessible');}
 $net=number_format((float)$payslip['basic']+(float)$payslip['allowance']-(float)$payslip['deduction'],2);
 ?><!doctype html><html lang="en"><head><meta charset="utf-8"><title>Salary Payslip <?=h($payslip['month_key'])?> | <?=h($u['school_name'])?></title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,sans-serif;background:#f2f5fc;color:#152344;margin:0;padding:36px}.sheet{max-width:690px;margin:auto;background:white;padding:36px;border-radius:16px;box-shadow:0 10px 34px #17255413}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #4f46e5;padding-bottom:20px}.muted{color:#6b7280}.header{color:#312e81}table{width:100%;border-collapse:collapse;margin-top:22px}td,th{padding:13px;border-bottom:1px solid #e4e7f0;text-align:left}td:last-child,th:last-child{text-align:right}.total{font-size:21px;font-weight:bold;color:#312e81}.print{background:#4f46e5;color:white;border:0;border-radius:9px;padding:12px 18px;cursor:pointer}@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;padding:0}.no-print{display:none}}</style></head><body><div class="sheet"><div class="top"><div><h1 class="header"><?=h($u['school_name'])?></h1><p class="muted">Employee Salary Payslip</p></div><div><strong><?=h($payslip['month_key'])?></strong><p class="muted">PKR</p></div></div><p><strong>Employee:</strong> <?=h($payslip['employee'])?> <span class="muted">(<?=h(ucfirst($payslip['employee_role']))?>)</span></p><p><strong>Campus:</strong> <?=h($payslip['branch_name'])?></p><p><strong>Payroll ID:</strong> <?=h($payslip['id'])?></p><table><tr><th>Component</th><th>PKR</th></tr><tr><td>Basic Salary</td><td><?=h(number_format((float)$payslip['basic'],2))?></td></tr><tr><td>Allowances</td><td><?=h(number_format((float)$payslip['allowance'],2))?></td></tr><tr><td>Deductions</td><td>-<?=h(number_format((float)$payslip['deduction'],2))?></td></tr><tr class="total"><td>Net Salary</td><td><?=h($net)?></td></tr></table><p><strong>Status:</strong> Paid (manually recorded)</p><p><strong>Date recorded:</strong> <?=h($payslip['paid_at'])?></p><p><strong>Method:</strong> <?=h(str_replace('_',' ',(string)$payslip['payment_mode']))?></p><p><strong>Reference:</strong> <?=h($payslip['payment_reference']?:'Not applicable')?></p><p class="muted">This payslip reflects the school’s internal salary record, not external bank confirmation.</p><p class="no-print"><button class="print" onclick="window.print()">Print Payslip</button></p></div></body></html><?php
 exit;
}
if($page==='login'):
 $portal=($_GET['portal']??'school')==='company'?'company':'school';
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Login | CampusOS</title><link rel="stylesheet" href="/assets/style.css"></head><body>
<div class="auth-page"><section class="auth-hero"><div class="brand-icon">C</div><h1>One campus.<br>Every possibility.</h1><p>School management, intelligently organized. Inspired by your original navy and indigo dashboard.</p></section>
<section class="auth-box"><div class="auth-card"><span class="badge"><?= $portal==='company'?'Company Control':'School Workspace' ?></span><h2>Welcome back</h2><p class="muted">Enter your account details to continue.</p>
<?php if(isset($_SESSION['flash'])): $f=$_SESSION['flash'];unset($_SESSION['flash']);?><div class="alert alert-error"><?=h($f['message'])?></div><?php endif;?>
<?php form_start('login','login');?><input type="hidden" name="portal" value="<?=h($portal)?>">
<?php if($portal==='school')field('School code','school_code'); ?>
<?php field('Email','email','email');field('Password','password','password');form_end('Sign in'); ?>
<div class="auth-links"><a href="<?=h(url('login',['portal'=>$portal==='company'?'school':'company']))?>">Switch to <?= $portal==='company'?'school':'company' ?> login</a></div></div></section></div><script src="/assets/app.js"></script></body></html>
<?php exit;endif;
$titleMap=['company'=>'Company Control','dashboard'=>'Dashboard','admissions'=>'Admissions','setup'=>'School Setup','people'=>'People & Enrollment','academics'=>'Academics','timetable'=>'Timetable','attendance'=>'Attendance','homework'=>'Homework','exams'=>'Examinations','finance'=>'Fees & Finance','payroll'=>'HR & Payroll','notices'=>'Notices','resources'=>'Resources & Operations','transport'=>'Transport','reports'=>'Reports','documents'=>'Documents & Cards','leave'=>'Leave Requests'];
$title=$titleMap[$page]??'Dashboard';
$navIcons=['dashboard'=>'◈','admissions'=>'▤','setup'=>'⚙','people'=>'♙','academics'=>'▦','timetable'=>'◷','attendance'=>'✓','homework'=>'✎','exams'=>'▤','finance'=>'₨','payroll'=>'▦','notices'=>'◇','resources'=>'▣','transport'=>'◈','reports'=>'▥','documents'=>'▤','leave'=>'◫'];
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title><?=h($title)?> | CampusOS</title><link rel="stylesheet" href="/assets/style.css"></head><body>
<div class="layout"><aside class="sidebar"><div class="brand"><span class="brand-icon">C</span><span>CampusOS</span></div><nav><div class="nav-label">Workspace</div>
<?php if($vendor):?><a href="<?=h(url('company'))?>" aria-current="page"><span class="nav-icon">◈</span>Company Control</a>
<?php else:foreach($allowedPages as $p=>$enabled):?><a href="<?=h(url($p))?>"<?= $p===$page?' aria-current="page"':'' ?>><span class="nav-icon"><?=h($navIcons[$p]??'•')?></span><?=h($titleMap[$p]??ucfirst($p))?></a><?php endforeach;endif;?>
</nav><div class="side-footer"><?=h($vendor?'Vendor Workspace':($u['school_name']??''))?></div></aside>
<div class="main-shell"><header class="topbar"><div style="display:flex;align-items:center;gap:14px"><button type="button" data-toggle-sidebar class="mobile-menu" aria-label="Open navigation">☰</button><strong><?=h($title)?></strong></div><div class="topbar-right"><span class="small muted"><?=h($vendor?$vendor['email']:$u['role'])?></span><span class="avatar"><?=h(strtoupper(substr((string)($vendor['name']??$u['full_name']??'U'),0,1)))?></span>
<form method="post" action="/"><?=csrf_input()?><input type="hidden" name="action" value="logout"><button class="btn btn-sm">Log out</button></form></div></header>
<main class="content"><div class="page-head"><div><h1><?=h($title)?></h1><p><?=h($vendor?'Manage customers and licensed schools':($u['school_name']??''))?></p></div></div>
<?php if(isset($_SESSION['flash'])):$f=$_SESSION['flash'];unset($_SESSION['flash']);?><div class="alert <?= ($f['type']??'')==='error'?'alert-error':'' ?>"><?=h($f['message'])?></div><?php endif;?>
<?php
if($vendor){
 $schools=many('SELECT s.id,s.name,s.code,s.delivery_model,s.status,s.created_at,COUNT(b.id) branches FROM schools s LEFT JOIN branches b ON b.school_id=s.id GROUP BY s.id,s.name,s.code,s.delivery_model,s.status,s.created_at ORDER BY s.id DESC');
 echo '<div class="grid">';stat_card('Registered Schools',(string)count($schools),'▣');stat_card('Active Schools',(string)count(array_filter($schools,fn($x)=>$x['status']==='active')),'✓');echo '</div>';
 panel('Register New School');form_start('company_school','company');field('School Name','name');field('Unique School Code','code');field('Admin Email','email','email');field('Temporary Admin Password (12+ chars)','password','password');pick('Delivery Model','delivery_model',['saas'=>'SaaS subscription','direct'=>'One-time license']);form_end('Create School');end_panel();
 panel('School Accounts');rows_table($schools,['id'=>'ID','name'=>'School','code'=>'Code','delivery_model'=>'Delivery','status'=>'Status','branches'=>'Branches','created_at'=>'Created']);end_panel();
 panel('Change School Status');form_start('company_status','company');pick('School','school_id',opts($schools));pick('Status','status',['active'=>'Active','suspended'=>'Suspended']);form_end('Update');end_panel();
}else{
 $d=selection_data($school,$u);$branches=opts($d['branches']);$classes=opts($d['classes']);$sections=opts($d['sections']);$subjects=opts($d['subjects']);$teachers=opts($d['teachers']);$students=opts($d['students']);$parents=opts($d['parents']);
 if($page==='dashboard'){
  echo '<div class="grid">';
  if($isAdmin||$isFinance){stat_card('Students',count_rows('student_profiles',$school),'♙');stat_card('Teachers',(string)(one("SELECT COUNT(*) n FROM users WHERE school_id=? AND role='teacher'",[$school])['n']??0),'♧');stat_card('Classes',count_rows('classes',$school),'▦');stat_card('Branches',count_rows('branches',$school),'▣');}
  elseif($isTeacher){stat_card('Allocated Classes',(string)(one('SELECT COUNT(*) n FROM teacher_allocations WHERE school_id=? AND teacher_user_id=?',[$school,$u['id']])['n']??0),'▦');stat_card('Homework Assigned',(string)(one('SELECT COUNT(*) n FROM homework WHERE school_id=? AND teacher_user_id=?',[$school,$u['id']])['n']??0),'✎');}
  else{stat_card('Linked Students',(string)count($studentIds),'♙');}
  echo '</div>';
  panel('Recent Notices');
  $aud=$isStudent?'students':($isParent?'parents':($isTeacher?'teachers':'all'));
  rows_table(many("SELECT title,body,created_at FROM notices WHERE school_id=? AND audience IN ('all',?) ORDER BY id DESC LIMIT 8",[$school,$aud]),['title'=>'Title','body'=>'Message','created_at'=>'Published']);end_panel();
  panel('Getting started');echo '<p class="muted">Recommended flow: configure academic year and class sections, create parent and student accounts, enroll students, assign teachers, publish timetable, take attendance, issue homework, record results and generate invoices.</p>';end_panel();
 }
 if($page==='admissions'){
   panel('New Admission Application');
   form_start('admission_apply','admissions');
   pick('Branch','branch_id',$branches);pick('Requested Class','class_id',$classes);pick('Requested Section','section_id',$sections);
   field('Applicant Name','applicant_name');field('Applicant Email','applicant_email','email');
   field('Guardian Name','guardian_name');field('Guardian Email','guardian_email','email');field('Guardian Phone','guardian_phone','tel');
   form_end('Register Application');end_panel();
   $apps=many("SELECT a.id,a.applicant_name,a.applicant_email,a.guardian_name,a.guardian_phone,a.status,a.admission_number,c.name class_name,s.name section_name,a.created_at FROM admission_applications a JOIN classes c ON c.id=a.class_id JOIN sections s ON s.id=a.section_id WHERE a.school_id=? ORDER BY a.id DESC LIMIT 150",[$school]);
   panel('Admission Applications');rows_table($apps,['id'=>'ID','applicant_name'=>'Applicant','applicant_email'=>'Email','guardian_name'=>'Guardian','guardian_phone'=>'Contact','class_name'=>'Class','section_name'=>'Section','status'=>'Status','admission_number'=>'Admission #','created_at'=>'Submitted']);end_panel();
   $pending=array_values(array_filter($apps,fn($x)=>$x['status']==='pending'));
   panel('Review Pending Application');form_start('admission_review','admissions');pick('Application','application_id',opts($pending,'id','applicant_name'));pick('Review Decision','decision',['approved'=>'Approve','rejected'=>'Reject']);form_end('Save Review');end_panel();
   $approved=array_values(array_filter($apps,fn($x)=>$x['status']==='approved'));
   panel('Enroll Approved Applicant');
   echo '<p class="muted small">This atomically creates the student profile, creates or links the guardian and reserves a section seat. For an existing guardian email, the existing guardian account is linked.</p>';
   form_start('admission_enroll','admissions');pick('Approved Application','application_id',opts($approved,'id','applicant_name'));field('Admission Number','admission_no');
   field('Student Initial Password (12+ chars)','student_password','password');
   field('Guardian Initial Password (only for a new guardian, 12+ chars)','guardian_password','password','',false);
   form_end('Create Student & Enroll');end_panel();
 }
 if($page==='setup'){
  panel('Create Branch');form_start('branch','setup');field('Branch Name','name');field('Code','code');field('City','city','text','',false);form_end();end_panel();
  panel('Academic Year');form_start('academic_session','setup');field('Session Name','name');field('Start Date','start_date','date');field('End Date','end_date','date');form_end();end_panel();
  $sessions=many('SELECT id,name,start_date,end_date,is_current FROM school_sessions WHERE school_id=? ORDER BY start_date DESC',[$school]);
  panel('Academic Sessions');rows_table($sessions,['name'=>'Session','start_date'=>'Start','end_date'=>'End','is_current'=>'Current']);end_panel();
  panel('Set Current Academic Session');form_start('session_activate','setup');pick('Academic Session','session_id',opts($sessions));form_end('Activate Session');end_panel();
  panel('Add Class');form_start('class','setup');field('Class Name','name');form_end();end_panel();
  panel('Add Section');form_start('section','setup');pick('Branch','branch_id',$branches);pick('Class','class_id',$classes);field('Section Name','name');field('Capacity','capacity','number','40');form_end();end_panel();
  panel('Add Subject');form_start('subject','setup');field('Subject Name','name');field('Subject Code','code');form_end();end_panel();
  panel('Current Structure');rows_table(many('SELECT c.name class_name,s.name section_name,b.name branch_name,s.capacity FROM sections s JOIN classes c ON c.id=s.class_id JOIN branches b ON b.id=s.branch_id WHERE s.school_id=? ORDER BY c.name,s.name',[$school]),['class_name'=>'Class','section_name'=>'Section','branch_name'=>'Branch','capacity'=>'Capacity']);end_panel();
 }
 if($page==='people'){
  if($isAdmin){
   panel('Create User Account');form_start('person','people');pick('Role','role',['admin'=>'Administrator','principal'=>'Principal','accountant'=>'Accountant','teacher'=>'Teacher','student'=>'Student','parent'=>'Parent','staff'=>'Staff']);pick('Branch','branch_id',$branches);field('Full Name','full_name');field('Email','email','email');field('Password (12+ chars)','password','password');form_end('Create Account');end_panel();
   panel('Enroll Student / Link Parent');form_start('student_enrollment','people');pick('Student Account','student_user_id',opts($d['accounts']));pick('Parent','parent_user_id',$parents,false);pick('Branch','branch_id',$branches);pick('Class','class_id',$classes);pick('Section','section_id',$sections);field('Admission Number','admission_no');field('Roll Number','roll_no','text','',false);form_end('Enroll Student');end_panel();
  }
  if($isAdmin){
   panel('Promotion / Section Change / Campus Transfer');
   echo '<p class="muted small">Select the destination class and section. This keeps previous attendance, grades and fees intact and writes an academic movement history. Activate the current academic session first.</p>';
   form_start('student_move','people');
   pick('Enrolled Student','student_user_id',$students);
   pick('Movement Type','movement_type',['promotion'=>'Promote to new class','section_change'=>'Change section','transfer'=>'Transfer to another campus']);
   pick('Destination Branch','to_branch_id',$branches);
   pick('Destination Class','to_class_id',$classes);
   pick('Destination Section','to_section_id',$sections);
   field('Reason / Approval Note','reason');
   form_end('Save Student Movement');end_panel();
   panel('Student Academic Movement History');
   rows_table(many("SELECT sm.id,u.full_name student,sm.movement_type,fb.name from_branch,tb.name to_branch,fc.name from_class,tc.name to_class,fs.name from_section,ts.name to_section,y.name academic_year,sm.reason,sm.created_at FROM student_movements sm JOIN users u ON u.id=sm.student_user_id AND u.school_id=sm.school_id JOIN branches fb ON fb.id=sm.from_branch_id JOIN branches tb ON tb.id=sm.to_branch_id JOIN classes fc ON fc.id=sm.from_class_id JOIN classes tc ON tc.id=sm.to_class_id JOIN sections fs ON fs.id=sm.from_section_id JOIN sections ts ON ts.id=sm.to_section_id JOIN school_sessions y ON y.id=sm.academic_session_id WHERE sm.school_id=? ORDER BY sm.id DESC LIMIT 150",[$school]),['student'=>'Student','movement_type'=>'Movement','from_class'=>'Old Class','to_class'=>'New Class','from_section'=>'Old Section','to_section'=>'New Section','from_branch'=>'Old Branch','to_branch'=>'New Branch','academic_year'=>'Session','reason'=>'Reason','created_at'=>'Date']);
   end_panel();
  }
  panel('Student Directory');
  $sql="SELECT u.full_name,sp.admission_no,sp.roll_no,c.name class_name,s.name section_name FROM student_profiles sp JOIN users u ON u.id=sp.user_id JOIN classes c ON c.id=sp.class_id JOIN sections s ON s.id=sp.section_id WHERE sp.school_id=? ORDER BY u.full_name";
  rows_table(many($sql,[$school]),['full_name'=>'Student','admission_no'=>'Admission #','roll_no'=>'Roll #','class_name'=>'Class','section_name'=>'Section']);end_panel();
 }
 if($page==='academics'){
  if($isAdmin){
   panel('Allocate Teacher To Section & Subject');form_start('allocation','academics');pick('Teacher','teacher_user_id',$teachers);pick('Class','class_id',$classes);pick('Section','section_id',$sections);pick('Subject','subject_id',$subjects);form_end();end_panel();
  }
  panel('Teaching Allocations');
  $sql='SELECT u.full_name teacher,c.name class_name,s.name section_name,sub.name subject FROM teacher_allocations ta JOIN users u ON u.id=ta.teacher_user_id JOIN classes c ON c.id=ta.class_id JOIN sections s ON s.id=ta.section_id JOIN subjects sub ON sub.id=ta.subject_id WHERE ta.school_id=?';
  $args=[$school];if($isTeacher){$sql.=' AND ta.teacher_user_id=?';$args[]=$u['id'];}
  rows_table(many($sql.' ORDER BY c.name,s.name',$args),['teacher'=>'Teacher','class_name'=>'Class','section_name'=>'Section','subject'=>'Subject']);end_panel();
 }
 if($page==='timetable'){
  if($isAdmin){
   panel('Schedule Class Period');form_start('timetable','timetable');pick('Class','class_id',$classes);pick('Section','section_id',$sections);pick('Subject','subject_id',$subjects);pick('Teacher','teacher_user_id',$teachers);pick('Weekday','weekday',['1'=>'Monday','2'=>'Tuesday','3'=>'Wednesday','4'=>'Thursday','5'=>'Friday','6'=>'Saturday','7'=>'Sunday']);field('Period Number','period_no','number');field('Start Time','start_time','time');field('End Time','end_time','time');form_end();end_panel();
  }
  $sql='SELECT c.name class_name,s.name section_name,sub.name subject,u.full_name teacher,t.weekday,t.period_no,t.start_time,t.end_time FROM timetable t JOIN classes c ON c.id=t.class_id JOIN sections s ON s.id=t.section_id JOIN subjects sub ON sub.id=t.subject_id JOIN users u ON u.id=t.teacher_user_id WHERE t.school_id=?';$args=[$school];
  if($isTeacher){$sql.=' AND t.teacher_user_id=?';$args[]=$u['id'];}
  if($isStudent||$isParent){[$cond,$studentArgs]=student_filter('sp.user_id',$studentIds);$sql.=' AND EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.school_id=t.school_id AND sp.section_id=t.section_id AND '.$cond.')';$args=array_merge($args,$studentArgs);}
  panel('Weekly Timetable');rows_table(many($sql.' ORDER BY t.weekday,t.period_no',$args),['class_name'=>'Class','section_name'=>'Section','subject'=>'Subject','teacher'=>'Teacher','weekday'=>'Weekday','period_no'=>'Period','start_time'=>'Start','end_time'=>'End']);end_panel();
 }
 if($page==='attendance'){
  if($isAdmin||$isTeacher){
   panel('Mark Student Attendance');form_start('attendance','attendance');pick('Student','student_user_id',$students);field('Date','day','date',date('Y-m-d'));pick('Status','status',['present'=>'Present','absent'=>'Absent','late'=>'Late','leave'=>'Leave']);form_end();end_panel();
  }
  $sql='SELECT u.full_name student,a.day,a.status,c.name class_name,s.name section_name FROM attendance a JOIN users u ON u.id=a.student_user_id JOIN classes c ON c.id=a.class_id JOIN sections s ON s.id=a.section_id WHERE a.school_id=?';$args=[$school];
  if($isTeacher){$sql.=' AND EXISTS(SELECT 1 FROM teacher_allocations ta WHERE ta.school_id=a.school_id AND ta.section_id=a.section_id AND ta.teacher_user_id=?)';$args[]=$u['id'];}
  if($isStudent||$isParent){[$cond,$a]=student_filter('a.student_user_id',$studentIds);$sql.=' AND '.$cond;$args=array_merge($args,$a);}
  panel('Attendance Register');rows_table(many($sql.' ORDER BY a.day DESC LIMIT 250',$args),['student'=>'Student','day'=>'Date','status'=>'Status','class_name'=>'Class','section_name'=>'Section']);end_panel();
 }
 if($page==='homework'){
  if($isAdmin||$isTeacher){
   panel('Assign Homework');form_start('homework','homework');pick('Class','class_id',$classes);pick('Section','section_id',$sections);pick('Subject','subject_id',$subjects);if($isAdmin)pick('Assigned Teacher','teacher_user_id',$teachers);field('Title','title');echo '<div class="field"><label>Instructions</label><textarea name="instructions" required></textarea></div>';field('Due At','due_at','datetime-local');field('Close At','close_at','datetime-local');field('Maximum Marks','max_marks','number','10');form_end();end_panel();
  }
  $sql='SELECT hw.id,hw.title,hw.instructions,c.name class_name,s.name section_name,sub.name subject,hw.due_at,hw.close_at,hw.max_marks FROM homework hw JOIN classes c ON c.id=hw.class_id JOIN sections s ON s.id=hw.section_id JOIN subjects sub ON sub.id=hw.subject_id WHERE hw.school_id=?';$args=[$school];
  if($isTeacher){$sql.=' AND EXISTS(SELECT 1 FROM teacher_allocations ta WHERE ta.school_id=hw.school_id AND ta.section_id=hw.section_id AND ta.subject_id=hw.subject_id AND ta.teacher_user_id=?)';$args[]=$u['id'];}
  if($isStudent||$isParent){[$cond,$a]=student_filter('sp.user_id',$studentIds);$sql.=' AND EXISTS(SELECT 1 FROM student_profiles sp WHERE sp.school_id=hw.school_id AND sp.section_id=hw.section_id AND '.$cond.')';$args=array_merge($args,$a);}
  $homework=many($sql.' ORDER BY hw.id DESC LIMIT 100',$args);
  panel('Assignments');rows_table($homework,['id'=>'ID','title'=>'Title','subject'=>'Subject','class_name'=>'Class','section_name'=>'Section','due_at'=>'Deadline','close_at'=>'Closes']);end_panel();
  if($isStudent){
   panel('Submit Homework');form_start('homework_submit','homework');pick('Assignment','homework_id',opts($homework,'id','title'));echo '<div class="field"><label>Your Work</label><textarea name="answer_text" required></textarea></div>';form_end('Submit');end_panel();
  }
  if($isTeacher||$isAdmin){
   $subs=many('SELECT hs.id,us.full_name student,hw.title assignment,hs.submitted_at,hs.marks FROM homework_submissions hs JOIN homework hw ON hw.id=hs.homework_id JOIN users us ON us.id=hs.student_user_id WHERE hs.school_id=? '.($isTeacher?'AND hw.teacher_user_id=? ':'').'ORDER BY hs.submitted_at DESC LIMIT 100',$isTeacher?[$school,$u['id']]:[$school]);
   panel('Student Submissions');rows_table($subs,['id'=>'ID','student'=>'Student','assignment'=>'Assignment','submitted_at'=>'Submitted','marks'=>'Marks']);end_panel();
   panel('Grade Submission');form_start('homework_grade','homework');pick('Submission','submission_id',opts($subs,'id','student'));field('Marks','marks','number');field('Feedback','feedback','text','',false);form_end('Grade');end_panel();
  }
 }
 if($page==='exams'){
  if($isAdmin||$isTeacher){
   panel('Create Exam');form_start('exam','exams');pick('Class','class_id',$classes);pick('Section','section_id',$sections);pick('Subject','subject_id',$subjects);field('Exam Name','title');field('Date','exam_date','date');field('Maximum Marks','max_marks','number','100');field('Passing Marks','passing_marks','number','33');form_end();end_panel();
  }
  $sql='SELECT e.id,e.title,c.name class_name,s.name section_name,sub.name subject,e.exam_date,e.max_marks,e.published FROM exams e JOIN classes c ON c.id=e.class_id JOIN sections s ON s.id=e.section_id JOIN subjects sub ON sub.id=e.subject_id WHERE e.school_id=?';$args=[$school];
  if($isTeacher){$sql.=' AND EXISTS(SELECT 1 FROM teacher_allocations ta WHERE ta.school_id=e.school_id AND ta.section_id=e.section_id AND ta.subject_id=e.subject_id AND ta.teacher_user_id=?)';$args[]=$u['id'];}
  if($isStudent||$isParent){[$cond,$a]=student_filter('sp.user_id',$studentIds);$sql.=' AND e.published=1 AND EXISTS(SELECT 1 FROM student_profiles sp WHERE sp.school_id=e.school_id AND sp.section_id=e.section_id AND '.$cond.')';$args=array_merge($args,$a);}
  $exams=many($sql.' ORDER BY e.exam_date DESC LIMIT 100',$args);
  panel('Examination Schedule');rows_table($exams,['id'=>'ID','title'=>'Exam','class_name'=>'Class','section_name'=>'Section','subject'=>'Subject','exam_date'=>'Date','max_marks'=>'Max','published'=>'Published']);end_panel();
  if($isAdmin||$isTeacher){
   panel('Record Marks');form_start('exam_mark','exams');pick('Exam','exam_id',opts($exams,'id','title'));pick('Student','student_user_id',$students);field('Obtained Marks','marks','number');form_end('Record Marks');end_panel();
  }
  if($isAdmin){panel('Publish Exam Result');form_start('publish_exam','exams');pick('Exam','exam_id',opts($exams,'id','title'));form_end('Publish Results');end_panel();}
  $sql='SELECT u.full_name student,e.title exam,er.marks,e.max_marks,IF(er.marks>=e.passing_marks,"Pass","Fail") outcome FROM exam_results er JOIN exams e ON e.id=er.exam_id JOIN users u ON u.id=er.student_user_id WHERE er.school_id=?';$args=[$school];
  if($isStudent||$isParent){[$cond,$a]=student_filter('er.student_user_id',$studentIds);$sql.=' AND e.published=1 AND '.$cond;$args=array_merge($args,$a);}
  if($isTeacher){$sql.=' AND EXISTS(SELECT 1 FROM teacher_allocations ta WHERE ta.school_id=e.school_id AND ta.section_id=e.section_id AND ta.teacher_user_id=?)';$args[]=$u['id'];}
  panel('Results');rows_table(many($sql.' ORDER BY er.id DESC LIMIT 200',$args),['student'=>'Student','exam'=>'Exam','marks'=>'Marks','max_marks'=>'Out of','outcome'=>'Outcome']);end_panel();
 }
 if($page==='finance'){
  if($isFinance){
   $feeBranchesSql="SELECT id,name FROM branches WHERE school_id=?";
   $feeBranchesArgs=[$school];
   if($role==='accountant'){$feeBranchesSql.=' AND id=?';$feeBranchesArgs[]=(int)$u['branch_id'];}
   $feeBranches=many($feeBranchesSql.' ORDER BY name',$feeBranchesArgs);
   $feeClasses=$classes;
   if($role==='accountant')$feeClasses=opts(many("SELECT DISTINCT c.id,c.name FROM classes c JOIN sections se ON se.class_id=c.id AND se.school_id=c.school_id WHERE c.school_id=? AND se.branch_id=? ORDER BY c.name",[$school,(int)$u['branch_id']]));
   $feePlansSql="SELECT f.id,b.name campus,c.name class_name,f.monthly_tuition FROM fee_plans f JOIN branches b ON b.id=f.branch_id AND b.school_id=f.school_id JOIN classes c ON c.id=f.class_id AND c.school_id=f.school_id WHERE f.school_id=?";
   $feePlansArgs=[$school];
   if($role==='accountant'){$feePlansSql.=' AND f.branch_id=?';$feePlansArgs[]=(int)$u['branch_id'];}
   panel('Class Monthly Fee Plans');
   rows_table(many($feePlansSql.' ORDER BY b.name,c.name',$feePlansArgs),['campus'=>'Campus','class_name'=>'Class','monthly_tuition'=>'Monthly Tuition (PKR)']);end_panel();
   if($role==='admin'){
    panel('Create / Update Tuition Fee Plan');
    form_start('fee_plan_save','finance');
    pick('Campus','branch_id',opts($feeBranches));pick('Class','class_id',$classes);field('Monthly Tuition (PKR)','monthly_tuition','number','0');
    form_end('Save Monthly Plan');end_panel();
   }
   panel('Generate Monthly Tuition & Transport Challans');
   echo '<p class="muted small">Invoices are created for active enrolled students in the selected campus/class, maximum 200 per request. The current fee plan is combined with the last transport assignment overlapping that month. One transport fee is charged per student; amounts are not prorated. Running the same month again will skip already billed students.</p>';
   form_start('fee_month_generate','finance');
   pick('Campus','branch_id',opts($feeBranches));pick('Class','class_id',$feeClasses);
   field('Billing Month','billing_month','month',date('Y-m'));
   field('Payment Due Date','due_date','date',date('Y-m-t'));
   form_end('Generate Monthly Challans');end_panel();
  }
  if($isFinance){
   panel('Issue Fee Invoice');form_start('fee_invoice','finance');pick('Student','student_user_id',$students);field('Invoice No','invoice_no');field('Description','description');field('Amount (PKR)','amount','number');field('Due Date','due_date','date');form_end('Generate Invoice');end_panel();
  }
  $grossExpr="COALESCE((SELECT SUM(fp.amount) FROM fee_payments fp WHERE fp.school_id=fi.school_id AND fp.invoice_id=fi.id),0)";
  $refundExpr="COALESCE((SELECT SUM(fr.amount) FROM fee_refunds fr WHERE fr.school_id=fi.school_id AND fr.invoice_id=fi.id),0)";
  $concessionExpr="COALESCE((SELECT SUM(fa.amount) FROM fee_adjustments fa WHERE fa.school_id=fi.school_id AND fa.invoice_id=fi.id),0)";
  $sql="SELECT fi.id,fi.student_user_id,fi.invoice_no,u.full_name student,fi.description,fi.amount,fi.due_date,fi.billing_month,fi.source,($grossExpr-$refundExpr) paid,$refundExpr refunded,$concessionExpr concessions,fi.amount-($grossExpr-$refundExpr)-$concessionExpr balance FROM fee_invoices fi JOIN users u ON u.id=fi.student_user_id AND u.school_id=fi.school_id WHERE fi.school_id=?";$args=[$school];
  if($isStudent||$isParent){[$cond,$a]=student_filter('fi.student_user_id',$studentIds);$sql.=' AND '.$cond;$args=array_merge($args,$a);}
  if($role==='accountant'){$sql.=' AND fi.branch_id=?';$args[]=(int)$u['branch_id'];}
  $sql.=' ORDER BY fi.id DESC LIMIT 200';
  $invoices=many($sql,$args);
  panel('Student Fee Ledger');rows_table($invoices,['id'=>'ID','invoice_no'=>'Invoice','student'=>'Student','billing_month'=>'Month','source'=>'Source','description'=>'Description','amount'=>'Original','concessions'=>'Concessions','paid'=>'Net Paid','refunded'=>'Refunded','balance'=>'Balance','due_date'=>'Due']);end_panel();
  $itemsSql="SELECT fi.invoice_no,u.full_name student,it.item_type,it.description,it.amount FROM fee_invoice_items it JOIN fee_invoices fi ON fi.id=it.invoice_id AND fi.school_id=it.school_id JOIN users u ON u.id=fi.student_user_id AND u.school_id=fi.school_id WHERE it.school_id=?";
  $itemArgs=[$school];
  if($isStudent||$isParent){[$scope,$a]=student_filter('fi.student_user_id',$studentIds);$itemsSql.=' AND '.$scope;$itemArgs=array_merge($itemArgs,$a);}
  if($role==='accountant'){$itemsSql.=' AND fi.branch_id=?';$itemArgs[]=(int)$u['branch_id'];}
  panel('Monthly Invoice Line Items');
  rows_table(many($itemsSql.' ORDER BY it.id DESC LIMIT 250',$itemArgs),['invoice_no'=>'Invoice','student'=>'Student','item_type'=>'Type','description'=>'Charge','amount'=>'Amount (PKR)']);end_panel();
  $paySql="SELECT fp.id,fp.invoice_id,fi.invoice_no,fi.student_user_id,u.full_name student,fp.amount gross_amount,COALESCE((SELECT SUM(r.amount) FROM fee_refunds r WHERE r.payment_id=fp.id AND r.school_id=fp.school_id),0) refunded,fp.amount-COALESCE((SELECT SUM(r.amount) FROM fee_refunds r WHERE r.payment_id=fp.id AND r.school_id=fp.school_id),0) refundable,fp.mode,fp.reference,fp.created_at FROM fee_payments fp JOIN fee_invoices fi ON fi.id=fp.invoice_id AND fi.school_id=fp.school_id JOIN users u ON u.id=fi.student_user_id AND u.school_id=fi.school_id WHERE fp.school_id=?";
  $payArgs=[$school];
  if($isStudent||$isParent){[$cond,$a]=student_filter('fi.student_user_id',$studentIds);$paySql.=' AND '.$cond;$payArgs=array_merge($payArgs,$a);}
  if($role==='accountant'){$paySql.=' AND fi.branch_id=?';$payArgs[]=(int)$u['branch_id'];}
  $paymentRows=many($paySql.' ORDER BY fp.id DESC LIMIT 200',$payArgs);
  panel('Fee Payment History & Receipts');
  rows_table($paymentRows,['id'=>'Receipt ID','invoice_no'=>'Invoice','student'=>'Student','gross_amount'=>'Received','refunded'=>'Refunded','refundable'=>'Net Retained','mode'=>'Mode','reference'=>'Reference','created_at'=>'Date']);end_panel();
  panel('Print Fee Receipts and Student Statements');
  if(!$paymentRows&&!$invoices)echo '<p class="muted">No fee payment records available yet.</p>';
  foreach($paymentRows as $row){
    echo '<p><a target="_blank" rel="noopener noreferrer" href="'.h(url('finance',['receipt'=>(int)$row['id']])).'">Print receipt #'.h($row['id']).' — '.h($row['invoice_no']).'</a></p>';
  }
  $printedStudents=[];
  foreach($invoices as $row){
    $studentId=(int)$row['student_user_id'];
    if(isset($printedStudents[$studentId]))continue;
    $printedStudents[$studentId]=true;
    echo '<p><a target="_blank" rel="noopener noreferrer" href="'.h(url('finance',['statement'=>$studentId])).'">Print student fee statement — '.h($row['student']).'</a></p>';
  }
  end_panel();
  $refundSql="SELECT r.id,fi.invoice_no,u.full_name student,r.payment_id,r.amount,r.mode,r.reference,r.reason,r.created_at FROM fee_refunds r JOIN fee_invoices fi ON fi.id=r.invoice_id AND fi.school_id=r.school_id JOIN users u ON u.id=fi.student_user_id AND u.school_id=fi.school_id WHERE r.school_id=?";
  $refundArgs=[$school];
  if($isStudent||$isParent){[$cond,$a]=student_filter('fi.student_user_id',$studentIds);$refundSql.=' AND '.$cond;$refundArgs=array_merge($refundArgs,$a);}
  if($role==='accountant'){$refundSql.=' AND fi.branch_id=?';$refundArgs[]=(int)$u['branch_id'];}
  panel('Refund Audit History');
  rows_table(many($refundSql.' ORDER BY r.id DESC LIMIT 150',$refundArgs),['invoice_no'=>'Invoice','payment_id'=>'Original Payment','student'=>'Student','amount'=>'Refund PKR','mode'=>'Method','reference'=>'Reference','reason'=>'Reason','created_at'=>'Recorded']);end_panel();
  if($isFinance){
   panel('Grant Fee Concession / Scholarship');form_start('fee_adjustment','finance');pick('Invoice','invoice_id',opts($invoices,'id','invoice_no'));pick('Type','adjustment_type',['concession'=>'Concession','scholarship'=>'Scholarship','waiver'=>'Waiver']);field('Amount (PKR)','amount','number');field('Reason','reason');form_end('Approve Adjustment');end_panel();
   panel('Receive Fee Payment');form_start('fee_payment','finance');pick('Invoice','invoice_id',opts($invoices,'id','invoice_no'));field('Amount Received','amount','number');pick('Mode','mode',['cash'=>'Cash','bank'=>'Bank','cheque'=>'Cheque','online_manual'=>'Manual Online']);field('Reference','reference','text','',false);form_end('Record Payment');end_panel();
   $refundablePayments=array_values(array_filter($paymentRows,fn($p)=>(float)$p['refundable']>0));
   panel('Record Fee Refund');
   echo '<p class="muted small">Use only after money has actually been returned. This records an internal refund and increases the outstanding balance; it does not send money.</p>';
   form_start('fee_refund','finance');pick('Original Payment','payment_id',opts($refundablePayments,'id','invoice_no'));
   field('Refund Amount (PKR)','amount','number');pick('Refund Method','mode',['cash'=>'Cash','bank'=>'Bank','cheque'=>'Cheque','online_manual'=>'Manual Online']);field('Transaction Reference (non-cash)','reference','text','',false);field('Reason','reason');form_end('Record Refund');end_panel();
  }
 }
 if($page==='payroll'){
   $manages=in_array($role,['admin','principal','accountant'],true);
   $canDraft=in_array($role,['admin','accountant'],true);
   $canApprove=in_array($role,['admin','principal'],true);
   $canPay=in_array($role,['admin','accountant'],true);
   if($canDraft){
     $employeeSql="SELECT id,CONCAT(full_name,' / ',role) name FROM users WHERE school_id=? AND role IN ('admin','principal','accountant','teacher','staff') AND status='active' AND branch_id IS NOT NULL AND id<>?";
     $employeeArgs=[$school,(int)$u['id']];
     if($role==='accountant'){$employeeSql.=' AND branch_id=?';$employeeArgs[]=(int)$u['branch_id'];}
     $employeeList=many($employeeSql.' ORDER BY full_name',$employeeArgs);
     panel('Create Monthly Salary Draft');
     echo '<p class="muted small">Amounts in PKR. Draft must be approved before a manual payment can be recorded.</p>';
     form_start('payroll','payroll');
     pick('Employee','employee_user_id',opts($employeeList));
     field('Payroll Month (YYYY-MM)','month_key','month',date('Y-m'));
     field('Basic Salary (PKR)','basic','number');
     field('Allowances (PKR)','allowance','number','0');
     field('Deductions (PKR)','deduction','number','0');
     field('Notes','notes','text','',false);
     form_end('Save Draft');end_panel();
   }
   $salarySql="SELECT p.id,p.employee_user_id,u.full_name employee,b.name campus,p.month_key,p.basic,p.allowance,p.deduction,ROUND(p.basic+p.allowance-p.deduction,2) net,p.status,p.notes,p.approved_at,p.paid_at,p.payment_mode,p.payment_reference FROM payroll_entries p JOIN users u ON u.id=p.employee_user_id AND u.school_id=p.school_id LEFT JOIN branches b ON b.id=p.branch_id AND b.school_id=p.school_id WHERE p.school_id=?";
   $salaryArgs=[$school];
   if(in_array($role,['teacher','staff'],true)){$salarySql.=" AND p.employee_user_id=? AND p.status='paid'";$salaryArgs[]=(int)$u['id'];}
   if(in_array($role,['principal','accountant'],true)){$salarySql.=' AND p.branch_id=?';$salaryArgs[]=(int)$u['branch_id'];}
   $payrollRows=many($salarySql.' ORDER BY p.month_key DESC,p.id DESC LIMIT 150',$salaryArgs);
   panel($manages?'Payroll Register':'My Paid Payslips');
   rows_table($payrollRows,['id'=>'Payroll ID','employee'=>'Employee','campus'=>'Campus','month_key'=>'Month','basic'=>'Basic','allowance'=>'Allowances','deduction'=>'Deductions','net'=>'Net PKR','status'=>'Status','paid_at'=>'Paid On']);
   end_panel();
   if($canApprove){
     $drafts=array_values(array_filter($payrollRows,fn($entry)=>$entry['status']==='draft'));
     panel('Approve Monthly Salary');
     form_start('payroll_approve','payroll');pick('Draft Payroll','payroll_id',opts($drafts,'id','employee'));form_end('Approve Salary');end_panel();
   }
   if($canPay){
     $approved=array_values(array_filter($payrollRows,fn($entry)=>$entry['status']==='approved'));
     panel('Record Approved Salary Payment');
     echo '<p class="muted small">Only record payments actually made. This action does not send money or integrate with a bank.</p>';
     form_start('payroll_pay','payroll');pick('Approved Payroll','payroll_id',opts($approved,'id','employee'));
     pick('Payment Method','payment_mode',['cash'=>'Cash','bank'=>'Bank','cheque'=>'Cheque','manual_transfer'=>'Manual Bank Transfer']);
     field('Bank / Receipt Reference','payment_reference','text','',false);form_end('Record Payment');end_panel();
   }
   $paidRows=array_values(array_filter($payrollRows,fn($entry)=>$entry['status']==='paid'));
   panel('Print Payslips');
   if(!$paidRows)echo '<p class="muted">No paid payroll records available yet.</p>';
   foreach($paidRows as $paidRow){
     $href=url('payroll',['print'=>(int)$paidRow['id']]);
     echo '<p><a href="'.h($href).'" target="_blank" rel="noopener noreferrer">Payslip: '.h($paidRow['employee']).' — '.h($paidRow['month_key']).' (PKR '.h($paidRow['net']).')</a></p>';
   }
   end_panel();
   if($manages){
     $eventSql="SELECT ev.event_type,emp.full_name employee,p.month_key,actor.full_name performed_by,ev.note,ev.created_at FROM payroll_events ev JOIN payroll_entries p ON p.id=ev.payroll_id AND p.school_id=ev.school_id JOIN users emp ON emp.id=p.employee_user_id AND emp.school_id=p.school_id JOIN users actor ON actor.id=ev.actor_user_id AND actor.school_id=ev.school_id WHERE ev.school_id=?";
     $eventArgs=[$school];if(in_array($role,['principal','accountant'],true)){$eventSql.=' AND p.branch_id=?';$eventArgs[]=(int)$u['branch_id'];}
     panel('Salary Audit History');rows_table(many($eventSql.' ORDER BY ev.id DESC LIMIT 100',$eventArgs),['employee'=>'Employee','month_key'=>'Month','event_type'=>'Action','performed_by'=>'Performed By','note'=>'Note','created_at'=>'Recorded']);end_panel();
   }
 }
 if($page==='notices'){
  if($isAdmin){panel('Publish Notice');form_start('notice','notices');field('Title','title');echo '<div class="field"><label>Message</label><textarea name="body" required></textarea></div>';pick('Audience','audience',['all'=>'Everyone','teachers'=>'Teachers','students'=>'Students','parents'=>'Parents']);form_end('Publish');end_panel();}
  $aud=$isStudent?'students':($isParent?'parents':($isTeacher?'teachers':'all'));
  panel('Notice Board');rows_table(many("SELECT title,body,audience,created_at FROM notices WHERE school_id=? AND audience IN ('all',?) ORDER BY id DESC",[$school,$aud]),['title'=>'Title','body'=>'Message','audience'=>'Audience','created_at'=>'Published']);end_panel();
 }
 if($page==='resources'){
  panel('Library Catalog');rows_table(many('SELECT title,author,isbn,copies FROM library_books WHERE school_id=?',[$school]),['title'=>'Book','author'=>'Author','isbn'=>'ISBN','copies'=>'Copies']);end_panel();
  panel('Register Book');form_start('library_book','resources');pick('Branch','branch_id',$branches);field('Book Title','title');field('Author','author','text','',false);field('ISBN','isbn','text','',false);field('Copies','copies','number','1');form_end();end_panel();
  $books=many("SELECT b.id,CONCAT(b.title,' (',br.name,')') name,b.copies,COALESCE((SELECT COUNT(*) FROM library_loans l WHERE l.book_id=b.id AND l.school_id=b.school_id AND l.returned_at IS NULL),0) checked_out FROM library_books b JOIN branches br ON br.id=b.branch_id AND br.school_id=b.school_id WHERE b.school_id=? ORDER BY b.title",[$school]);
  panel('Library Stock and Availability');rows_table($books,['name'=>'Book / Branch','copies'=>'Total Copies','checked_out'=>'Checked Out']);end_panel();
  $borrowers=many("SELECT u.id,CONCAT(u.full_name,' (',b.name,')') name FROM users u JOIN branches b ON b.id=u.branch_id AND b.school_id=u.school_id WHERE u.school_id=? AND u.status='active' AND u.role IN ('student','teacher','staff','principal') ORDER BY u.full_name",[$school]);
  panel('Issue Library Book');form_start('library_loan','resources');pick('Book','book_id',opts($books));pick('Borrower','borrower_user_id',opts($borrowers));field('Return Due Date','due_date','date',date('Y-m-d',strtotime('+14 days')));form_end('Issue Book');end_panel();
  $activeLoans=many("SELECT l.id,b.title book,u.full_name borrower,br.name campus,l.issue_date,l.due_date,CASE WHEN l.due_date<CURDATE() THEN 'Overdue' ELSE 'On Loan' END status FROM library_loans l JOIN library_books b ON b.id=l.book_id AND b.school_id=l.school_id JOIN users u ON u.id=l.borrower_user_id AND u.school_id=l.school_id JOIN branches br ON br.id=l.branch_id WHERE l.school_id=? AND l.returned_at IS NULL ORDER BY l.due_date,l.id LIMIT 200",[$school]);
  panel('Active Library Loans');rows_table($activeLoans,['id'=>'Loan ID','book'=>'Book','borrower'=>'Borrower','campus'=>'Campus','issue_date'=>'Issue Date','due_date'=>'Due Date','status'=>'Status']);end_panel();
  panel('Return Library Book');form_start('library_return','resources');pick('Active Loan','loan_id',opts($activeLoans,'id','book'));form_end('Mark Returned');end_panel();
  panel('Recent Library Returns');rows_table(many("SELECT b.title book,u.full_name borrower,l.returned_at,l.due_date FROM library_loans l JOIN library_books b ON b.id=l.book_id AND b.school_id=l.school_id JOIN users u ON u.id=l.borrower_user_id AND u.school_id=l.school_id WHERE l.school_id=? AND l.returned_at IS NOT NULL ORDER BY l.returned_at DESC LIMIT 60",[$school]),['book'=>'Book','borrower'=>'Borrower','due_date'=>'Due Date','returned_at'=>'Returned At']);end_panel();

  $stockSql='SELECT i.id,i.name,i.sku,i.quantity,b.name campus FROM inventory_items i JOIN branches b ON b.id=i.branch_id AND b.school_id=i.school_id WHERE i.school_id=?';
  $stockArgs=[$school];if($role==='principal'){$stockSql.=' AND i.branch_id=?';$stockArgs[]=(int)$u['branch_id'];}
  $inventory=many($stockSql.' ORDER BY i.name',$stockArgs);
  panel('Live Inventory Balances');rows_table($inventory,['name'=>'Item','sku'=>'SKU','quantity'=>'Available','campus'=>'Campus']);end_panel();
  panel('Register Inventory Item');form_start('inventory_item','resources');pick('Branch','branch_id',$branches);field('Item Name','name');field('SKU','sku','text','',false);field('Opening Quantity','quantity','number','0');form_end('Create Item');end_panel();
  panel('Receive / Issue Stock');form_start('inventory_move','resources');pick('Inventory Item','item_id',opts($inventory));pick('Movement','movement_type',['receipt'=>'Receive into stock','issue'=>'Issue from stock']);field('Quantity','quantity','number');field('Reason / Reference','reason');form_end('Record Stock Movement');end_panel();
  $ledgerSql="SELECT im.id,i.name item,b.name campus,im.movement_type,im.quantity,im.balance_before,im.balance_after,im.reason,im.created_at FROM inventory_movements im JOIN inventory_items i ON i.id=im.item_id AND i.school_id=im.school_id JOIN branches b ON b.id=im.branch_id AND b.school_id=im.school_id WHERE im.school_id=?";
  $ledgerArgs=[$school];if($role==='principal'){$ledgerSql.=' AND im.branch_id=?';$ledgerArgs[]=(int)$u['branch_id'];}
  panel('Stock Movement Ledger');rows_table(many($ledgerSql.' ORDER BY im.id DESC LIMIT 150',$ledgerArgs),['item'=>'Item','campus'=>'Branch','movement_type'=>'Movement','quantity'=>'Quantity','balance_before'=>'Before','balance_after'=>'After','reason'=>'Reason','created_at'=>'Date']);end_panel();
 }

 if($page==='transport'){
   $routeSql="SELECT tr.id,tr.name,tr.vehicle,tr.driver_name,tr.monthly_fee,tr.seat_capacity,b.name campus,(SELECT COUNT(*) FROM transport_assignments a WHERE a.school_id=tr.school_id AND a.route_id=tr.id AND a.released_at IS NULL) occupied FROM transport_routes tr JOIN branches b ON b.id=tr.branch_id AND b.school_id=tr.school_id WHERE tr.school_id=?";
   $routeArgs=[$school];
   if($role==='principal'){$routeSql.=' AND tr.branch_id=?';$routeArgs[]=(int)$u['branch_id'];}
   if($isStudent||$isParent){[$scope,$userParams]=student_filter('x.student_user_id',$studentIds);$routeSql.=' AND EXISTS (SELECT 1 FROM transport_assignments x WHERE x.school_id=tr.school_id AND x.route_id=tr.id AND x.released_at IS NULL AND '.$scope.')';$routeArgs=array_merge($routeArgs,$userParams);}
   $routes=many($routeSql.' ORDER BY tr.name',$routeArgs);
   panel($isAdmin?'Transport Routes & Seat Availability':'Your Transport Route');
   rows_table($routes,['name'=>'Route','campus'=>'Campus','vehicle'=>'Vehicle','driver_name'=>'Driver','monthly_fee'=>'Monthly Fee (PKR)','seat_capacity'=>'Total Seats','occupied'=>'Assigned Seats']);end_panel();
   if($isAdmin){
     panel('Register Transport Route');form_start('transport_route','transport');pick('Branch','branch_id',$branches);field('Route Name','name');field('Vehicle','vehicle','text','',false);field('Driver','driver_name','text','',false);field('Monthly Fee (PKR)','monthly_fee','number','0');field('Seat Capacity','seat_capacity','number','30');form_end('Create Route');end_panel();
     panel('Assign Student To Transport');form_start('transport_assign','transport');pick('Route','route_id',opts($routes));pick('Enrolled Student','student_user_id',$students);form_end('Assign Seat');end_panel();
   }
   $sql="SELECT ta.id,u.full_name student,tr.name route,tr.vehicle,tr.driver_name,ta.assigned_on,ta.released_at,b.name campus FROM transport_assignments ta JOIN users u ON u.id=ta.student_user_id AND u.school_id=ta.school_id JOIN transport_routes tr ON tr.id=ta.route_id AND tr.school_id=ta.school_id JOIN branches b ON b.id=ta.branch_id AND b.school_id=ta.school_id WHERE ta.school_id=?";
   $args=[$school];
   if($role==='principal'){$sql.=' AND ta.branch_id=?';$args[]=(int)$u['branch_id'];}
   if($isStudent||$isParent){[$scope,$a]=student_filter('ta.student_user_id',$studentIds);$sql.=' AND '.$scope;$args=array_merge($args,$a);}
   if(!$isAdmin)$sql.=' AND ta.released_at IS NULL';
   $assignments=many($sql.' ORDER BY ta.id DESC LIMIT 150',$args);
   panel($isAdmin?'Student Route Assignments':'Student Pickup & Drop-off');
   rows_table($assignments,['student'=>'Student','route'=>'Route','vehicle'=>'Vehicle','driver_name'=>'Driver','campus'=>'Campus','assigned_on'=>'Assigned','released_at'=>'Released']);end_panel();
   if($isAdmin){
     $active=array_values(array_filter($assignments,fn($item)=>$item['released_at']===null));
     panel('Release Student From Route');form_start('transport_release','transport');pick('Active Assignment','assignment_id',opts($active,'id','student'));form_end('Release Seat');end_panel();
   }
 }
 if($page==='reports'){
  panel('School Summary');
  echo '<div class="grid">';foreach(['student_profiles'=>'Enrolled Students','attendance'=>'Attendance Entries','homework'=>'Homework','exams'=>'Exams','fee_invoices'=>'Invoices'] as $table=>$label)stat_card($label,count_rows($table,$school),'▤');echo '</div>';end_panel();
  panel('Reporting Note');echo '<p class="muted">These are live database summaries. Full filtered reports, printable export and advanced analytics are scheduled for later phases.</p>';end_panel();
 }
 if($page==='documents'){
  if($isAdmin){panel('Issue Certificate');form_start('certificate','documents');pick('Student','student_user_id',$students);field('Certificate Title','title');echo '<div class="field"><label>Certificate Body</label><textarea name="body" required></textarea></div>';field('Issue Date','issued_on','date',date('Y-m-d'));form_end('Issue');end_panel();}
  $sql='SELECT u.full_name student,c.title,c.body,c.issued_on FROM certificates c JOIN users u ON u.id=c.student_user_id WHERE c.school_id=?';$args=[$school];
  if($isStudent||$isParent){[$cond,$a]=student_filter('c.student_user_id',$studentIds);$sql.=' AND '.$cond;$args=array_merge($args,$a);}
  panel('Issued Certificates');rows_table(many($sql.' ORDER BY c.id DESC',$args),['student'=>'Student','title'=>'Certificate','body'=>'Text','issued_on'=>'Issued']);end_panel();
  if($isAdmin){
   panel('Student ID Cards');echo '<div class="no-print"><button class="btn" onclick="window.print()">Print Cards</button></div>';
   foreach(many('SELECT u.full_name,c.name class_name,s.name section_name,sp.admission_no FROM student_profiles sp JOIN users u ON u.id=sp.user_id JOIN classes c ON c.id=sp.class_id JOIN sections s ON s.id=sp.section_id WHERE sp.school_id=? ORDER BY u.full_name LIMIT 100',[$school]) as $row) echo '<div class="id-card"><header>'.h($u['school_name']).'</header><h2>'.h($row['full_name']).'</h2><p>'.h($row['class_name'].' - '.$row['section_name']).'</p><p>Admission: '.h($row['admission_no']).'</p></div>';
   end_panel();
  }
 }
 if($page==='leave'){
  panel('Apply for Leave');form_start('leave','leave');field('From','start_date','date');field('To','end_date','date');echo '<div class="field"><label>Reason</label><textarea name="reason" required></textarea></div>';form_end('Send Request');end_panel();
  $sql='SELECT l.id,u.full_name applicant,l.start_date,l.end_date,l.reason,l.status FROM leave_requests l JOIN users u ON u.id=l.user_id WHERE l.school_id=?';$args=[$school];if(!$isAdmin){$sql.=' AND l.user_id=?';$args[]=$u['id'];}
  $requests=many($sql.' ORDER BY l.id DESC LIMIT 100',$args);
  panel('Leave Requests');rows_table($requests,['id'=>'ID','applicant'=>'Applicant','start_date'=>'Start','end_date'=>'End','reason'=>'Reason','status'=>'Status']);end_panel();
  if($isAdmin){panel('Approve / Reject');form_start('leave_decide','leave');pick('Request','request_id',opts($requests,'id','applicant'));pick('Decision','status',['approved'=>'Approve','rejected'=>'Reject']);form_end('Save Decision');end_panel();}
 }
}
?>
</main></div></div><script src="/assets/app.js"></script></body></html>
