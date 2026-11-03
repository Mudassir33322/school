<?php
declare(strict_types=1);
require dirname(__DIR__) . '/app/actions.php';
if ($_SERVER['REQUEST_METHOD']==='POST') handle_action();
$page=(string)($_GET['page']??'dashboard');
$allowed=['login','company','dashboard','setup','people','academics','timetable','attendance','homework','exams','finance','notices','resources','reports','documents','leave'];
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
if($isAdmin)$allowedPages+=array_fill_keys(['setup','people','academics','timetable','attendance','homework','exams','resources','reports','documents'],true);
if($isFinance)$allowedPages+=array_fill_keys(['finance','reports'],true);
if($isTeacher)$allowedPages+=array_fill_keys(['timetable','attendance','homework','exams','academics','reports'],true);
if($isStudent||$isParent)$allowedPages+=array_fill_keys(['timetable','attendance','homework','exams','finance','documents'],true);
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
function stat(string $label,string $value,string $icon): void{
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
function selection_data(int $school): array{
 return [
 'branches'=>many('SELECT id,CONCAT(name," (",code,")") name FROM branches WHERE school_id=? ORDER BY name',[$school]),
 'classes'=>many('SELECT id,name FROM classes WHERE school_id=? ORDER BY sort_order,name',[$school]),
 'sections'=>many('SELECT sections.id,CONCAT(classes.name," / ",sections.name) name FROM sections JOIN classes ON classes.id=sections.class_id WHERE sections.school_id=? ORDER BY classes.name,sections.name',[$school]),
 'subjects'=>many('SELECT id,name FROM subjects WHERE school_id=? ORDER BY name',[$school]),
 'teachers'=>many("SELECT id,full_name name FROM users WHERE school_id=? AND role='teacher' AND status='active' ORDER BY full_name",[$school]),
 'students'=>many("SELECT users.id,CONCAT(users.full_name,' (',student_profiles.admission_no,')') name FROM student_profiles JOIN users ON users.id=student_profiles.user_id WHERE student_profiles.school_id=? ORDER BY users.full_name",[$school]),
 'parents'=>many("SELECT id,full_name name FROM users WHERE school_id=? AND role='parent' AND status='active' ORDER BY full_name",[$school]),
 'accounts'=>many("SELECT id,full_name name FROM users WHERE school_id=? AND role='student' AND status='active' ORDER BY full_name",[$school]),
 ];
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
$titleMap=['company'=>'Company Control','dashboard'=>'Dashboard','setup'=>'School Setup','people'=>'People & Enrollment','academics'=>'Academics','timetable'=>'Timetable','attendance'=>'Attendance','homework'=>'Homework','exams'=>'Examinations','finance'=>'Fees & Finance','notices'=>'Notices','resources'=>'Resources & Operations','reports'=>'Reports','documents'=>'Documents & Cards','leave'=>'Leave Requests'];
$title=$titleMap[$page]??'Dashboard';
$navIcons=['dashboard'=>'◈','setup'=>'⚙','people'=>'♙','academics'=>'▦','timetable'=>'◷','attendance'=>'✓','homework'=>'✎','exams'=>'▤','finance'=>'₨','notices'=>'◇','resources'=>'▣','reports'=>'▥','documents'=>'▤','leave'=>'◫'];
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
 echo '<div class="grid">';stat('Registered Schools',(string)count($schools),'▣');stat('Active Schools',(string)count(array_filter($schools,fn($x)=>$x['status']==='active')),'✓');echo '</div>';
 panel('Register New School');form_start('company_school','company');field('School Name','name');field('Unique School Code','code');field('Admin Email','email','email');field('Temporary Admin Password (12+ chars)','password','password');pick('Delivery Model','delivery_model',['saas'=>'SaaS subscription','direct'=>'One-time license']);form_end('Create School');end_panel();
 panel('School Accounts');rows_table($schools,['id'=>'ID','name'=>'School','code'=>'Code','delivery_model'=>'Delivery','status'=>'Status','branches'=>'Branches','created_at'=>'Created']);end_panel();
 panel('Change School Status');form_start('company_status','company');pick('School','school_id',opts($schools));pick('Status','status',['active'=>'Active','suspended'=>'Suspended']);form_end('Update');end_panel();
}else{
 $d=selection_data($school);$branches=opts($d['branches']);$classes=opts($d['classes']);$sections=opts($d['sections']);$subjects=opts($d['subjects']);$teachers=opts($d['teachers']);$students=opts($d['students']);$parents=opts($d['parents']);
 if($page==='dashboard'){
  echo '<div class="grid">';
  if($isAdmin||$isFinance){stat('Students',count_rows('student_profiles',$school),'♙');stat('Teachers',(string)(one("SELECT COUNT(*) n FROM users WHERE school_id=? AND role='teacher'",[$school])['n']??0),'♧');stat('Classes',count_rows('classes',$school),'▦');stat('Branches',count_rows('branches',$school),'▣');}
  elseif($isTeacher){stat('Allocated Classes',(string)(one('SELECT COUNT(*) n FROM teacher_allocations WHERE school_id=? AND teacher_user_id=?',[$school,$u['id']])['n']??0),'▦');stat('Homework Assigned',(string)(one('SELECT COUNT(*) n FROM homework WHERE school_id=? AND teacher_user_id=?',[$school,$u['id']])['n']??0),'✎');}
  else{stat('Linked Students',(string)count($studentIds),'♙');}
  echo '</div>';
  panel('Recent Notices');
  $aud=$isStudent?'students':($isParent?'parents':($isTeacher?'teachers':'all'));
  rows_table(many("SELECT title,body,created_at FROM notices WHERE school_id=? AND audience IN ('all',?) ORDER BY id DESC LIMIT 8",[$school,$aud]),['title'=>'Title','body'=>'Message','created_at'=>'Published']);end_panel();
  panel('Getting started');echo '<p class="muted">Recommended flow: configure academic year and class sections, create parent and student accounts, enroll students, assign teachers, publish timetable, take attendance, issue homework, record results and generate invoices.</p>';end_panel();
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
   panel('Issue Fee Invoice');form_start('fee_invoice','finance');pick('Student','student_user_id',$students);field('Invoice No','invoice_no');field('Description','description');field('Amount (PKR)','amount','number');field('Due Date','due_date','date');form_end('Generate Invoice');end_panel();
  }
  $sql='SELECT fi.id,fi.invoice_no,u.full_name student,fi.description,fi.amount,fi.due_date,COALESCE(SUM(fp.amount),0) paid,fi.amount-COALESCE(SUM(fp.amount),0) balance FROM fee_invoices fi JOIN users u ON u.id=fi.student_user_id LEFT JOIN fee_payments fp ON fp.invoice_id=fi.id AND fp.school_id=fi.school_id WHERE fi.school_id=?';$args=[$school];
  if($isStudent||$isParent){[$cond,$a]=student_filter('fi.student_user_id',$studentIds);$sql.=' AND '.$cond;$args=array_merge($args,$a);}
  $sql.=' GROUP BY fi.id,fi.invoice_no,u.full_name,fi.description,fi.amount,fi.due_date ORDER BY fi.id DESC LIMIT 200';
  $invoices=many($sql,$args);
  panel('Student Fee Ledger');rows_table($invoices,['id'=>'ID','invoice_no'=>'Invoice','student'=>'Student','description'=>'Description','amount'=>'Total','paid'=>'Paid','balance'=>'Balance','due_date'=>'Due']);end_panel();
  if($isFinance){
   panel('Receive Fee Payment');form_start('fee_payment','finance');pick('Invoice','invoice_id',opts($invoices,'id','invoice_no'));field('Amount Received','amount','number');pick('Mode','mode',['cash'=>'Cash','bank'=>'Bank','cheque'=>'Cheque','online_manual'=>'Manual Online']);field('Reference','reference','text','',false);form_end('Record Payment');end_panel();
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
  panel('Transport Routes');rows_table(many('SELECT name,vehicle,driver_name,monthly_fee FROM transport_routes WHERE school_id=?',[$school]),['name'=>'Route','vehicle'=>'Vehicle','driver_name'=>'Driver','monthly_fee'=>'Monthly Fee']);end_panel();
  panel('Register Route');form_start('transport_route','resources');pick('Branch','branch_id',$branches);field('Route','name');field('Vehicle','vehicle','text','',false);field('Driver','driver_name','text','',false);field('Monthly Fee','monthly_fee','number','0');form_end();end_panel();
  panel('Inventory');rows_table(many('SELECT name,sku,quantity FROM inventory_items WHERE school_id=?',[$school]),['name'=>'Item','sku'=>'SKU','quantity'=>'Stock']);end_panel();
  panel('Add Inventory Item');form_start('inventory_item','resources');pick('Branch','branch_id',$branches);field('Item Name','name');field('SKU','sku','text','',false);field('Quantity','quantity','number','0');form_end();end_panel();
 }
 if($page==='reports'){
  panel('School Summary');
  echo '<div class="grid">';foreach(['student_profiles'=>'Enrolled Students','attendance'=>'Attendance Entries','homework'=>'Homework','exams'=>'Exams','fee_invoices'=>'Invoices'] as $table=>$label)stat($label,count_rows($table,$school),'▤');echo '</div>';end_panel();
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
