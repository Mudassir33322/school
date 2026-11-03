<?php
declare(strict_types=1);
require_once __DIR__.'/core.php';
function required_text(string $name,int $max=190): string {
 $v=trim((string)($_POST[$name]??''));
 if($v===''||mb_strlen($v)>$max) throw new InvalidArgumentException("Invalid ".str_replace('_',' ',$name));
 return $v;
}
function positive_id(string $key): int {
 $v=filter_var($_POST[$key]??null,FILTER_VALIDATE_INT,['options'=>['min_range'=>1]]);
 if(!$v) throw new InvalidArgumentException("Invalid ".$key);
 return (int)$v;
}
function date_input(string $name): string {
 $v=required_text($name,10);
 $d=DateTimeImmutable::createFromFormat('!Y-m-d',$v);
 if(!$d || $d->format('Y-m-d')!==$v) throw new InvalidArgumentException("Invalid date.");
 return $v;
}
function money_input(string $key): float {
 $v=$_POST[$key]??null;
 if(!is_scalar($v)||!is_numeric($v)||(float)$v<0) throw new InvalidArgumentException('Invalid amount.');
 return round((float)$v,2);
}
function ownership(string $table,int $id,int $school): void { assert_school_row($table,$id,$school); }
function must_be_active_school(int $school): void {
 if(!one("SELECT id FROM schools WHERE id=? AND status='active'",[$school])) throw new InvalidArgumentException('School is not active');
}
function school_user(int $id,int $school,string $role=''): array {
 $u=one("SELECT * FROM users WHERE id=? AND school_id=? AND status='active'",[$id,$school]);
 if(!$u || ($role!=='' && $u['role']!==$role)) throw new InvalidArgumentException('Invalid user for this school');
 return $u;
}
function verify_section(int $school,int $section,int $class=0,int $branch=0): array {
 $s=assert_school_row('sections',$section,$school);
 if(($class && (int)$s['class_id']!==$class)||($branch && (int)$s['branch_id']!==$branch)) throw new InvalidArgumentException('Section does not match class / branch');
 return $s;
}
function verify_student(int $school,int $student): array {
 school_user($student,$school,'student');
 $sp=one("SELECT * FROM student_profiles WHERE user_id=? AND school_id=?",[$student,$school]);
 if(!$sp) throw new InvalidArgumentException('Student profile missing');
 return $sp;
}
function handle_action(): never {
 if($_SERVER['REQUEST_METHOD']!=='POST') { http_response_code(405); exit('POST required'); }
 verify_csrf();
 $action=(string)($_POST['action']??'');
 try {
  if($action==='logout') { logout_everything(); redirect('login'); }
  if($action==='login') {
   $portal=(string)($_POST['portal']??'school'); $email=strtolower(required_text('email')); $password=(string)($_POST['password']??'');
   $code=strtolower(trim((string)($_POST['school_code']??'')));
   $identifier=($portal==='company'?'company':$code).':'.$email;
   if(login_limited($identifier)) throw new InvalidArgumentException('Too many attempts. Try again after 15 minutes.');
   if($portal==='company') {
    $u=one("SELECT * FROM vendor_users WHERE email=? AND active=1",[$email]);
    if(!$u || !password_verify($password,$u['password_hash'])) { failed_login($identifier); throw new InvalidArgumentException('Invalid login credentials'); }
    session_regenerate_id(true); unset($_SESSION['school_user']);$_SESSION['vendor_user']=$u['id'];
    clear_login_attempts($identifier); redirect('company');
   }
   if(!preg_match('/^[a-z0-9-]{3,48}$/',$code)) throw new InvalidArgumentException('Invalid school code');
   $u=one("SELECT u.*,s.status AS school_status FROM users u JOIN schools s ON s.id=u.school_id WHERE s.code=? AND u.email=? AND u.status='active'",[$code,$email]);
   if(!$u || $u['school_status']!=='active' || !password_verify($password,$u['password_hash'])) {
    failed_login($identifier); throw new InvalidArgumentException('Invalid login credentials');
   }
   session_regenerate_id(true); unset($_SESSION['vendor_user']);$_SESSION['school_user']=['id'=>$u['id'],'school_id'=>$u['school_id']];
   clear_login_attempts($identifier); redirect('dashboard');
  }
  if($action==='company_school') {
    require_company();
    $name=required_text('name');$code=strtolower(required_text('code',48));$email=strtolower(required_text('email'));$password=(string)($_POST['password']??'');
    $model=(string)($_POST['delivery_model']??'saas');
    if(!preg_match('/^[a-z0-9-]{3,48}$/',$code)||!filter_var($email,FILTER_VALIDATE_EMAIL)||strlen($password)<12||!in_array($model,['saas','direct'],true)) throw new InvalidArgumentException('Invalid school details or password (minimum 12 characters).');
    db()->beginTransaction();
    try{
     run("INSERT INTO schools(name,code,delivery_model,email) VALUES (?,?,?,?)",[$name,$code,$model,$email]);
     $school=(int)db()->lastInsertId();
     run("INSERT INTO branches(school_id,name,code) VALUES (?,?,'MAIN')",[$school,'Main Campus']);$branch=(int)db()->lastInsertId();
     run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'admin',?,?,?)",[$school,$branch,'School Administrator',$email,password_hash($password,PASSWORD_DEFAULT)]);
     if($model==='saas')run("INSERT INTO subscriptions(school_id,plan_name,status) VALUES (?,'Starter','trial')",[$school]);
     else run("INSERT INTO licenses(school_id,license_ref) VALUES (?,?)",[$school,bin2hex(random_bytes(20))]);
     db()->commit();audit(null,null,'create','school',$school);flash('School registered. Share school code with the administrator.');
    }catch(Throwable $e){db()->rollBack();throw $e;}
    redirect('company');
  }
  if($action==='company_status'){
   require_company();$school=positive_id('school_id');$status=(string)($_POST['status']??'');
   if(!in_array($status,['active','suspended'],true)) throw new InvalidArgumentException('Invalid status');
   run("UPDATE schools SET status=? WHERE id=?",[$status,$school]);audit(null,null,'status','school',$school);flash('School status updated.');redirect('company');
  }
  $u=require_school();$school=(int)$u['school_id'];$actor=(int)$u['id'];$branch=(int)($u['branch_id']??0);
  if(in_array($action,['admission_apply','admission_review','admission_enroll','student_move','library_loan','library_return','transport_assign','transport_release','inventory_move','branch','academic_session','session_activate','class','section','subject','person','student_enrollment','allocation','timetable','notice','library_book','transport_route','inventory_item','certificate','fee_invoice','fee_adjustment','payroll'],true)){
   require_roles(['admin','principal','accountant']);
   $academic=['admission_apply','admission_review','admission_enroll','student_move','library_loan','library_return','transport_assign','transport_release','inventory_move','branch','academic_session','class','section','subject','person','student_enrollment','allocation','timetable','notice','library_book','transport_route','inventory_item','certificate'];
   if(in_array($action,$academic,true)&&$u['role']==='accountant')throw new InvalidArgumentException('Accountant access restricted');
   $finance=['fee_invoice','fee_adjustment','payroll'];
   if(in_array($action,$finance,true)&&!in_array($u['role'],['admin','accountant'],true))throw new InvalidArgumentException('Finance access restricted');
  }
  switch($action){
   case 'admission_apply':
    $b=positive_id('branch_id');$c=positive_id('class_id');$sec=positive_id('section_id');
    assert_branch($b,$school);ownership('classes',$c,$school);verify_section($school,$sec,$c,$b);
    $email=strtolower(required_text('applicant_email'));$guardianEmail=strtolower(required_text('guardian_email'));
    if(!filter_var($email,FILTER_VALIDATE_EMAIL)||!filter_var($guardianEmail,FILTER_VALIDATE_EMAIL))throw new InvalidArgumentException('Invalid applicant or guardian email');
    if($email===$guardianEmail)throw new InvalidArgumentException('Student and guardian emails must differ');
    run("INSERT INTO admission_applications(school_id,branch_id,class_id,section_id,applicant_name,applicant_email,guardian_name,guardian_email,guardian_phone,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)",[
      $school,$b,$c,$sec,required_text('applicant_name',160),$email,required_text('guardian_name',160),$guardianEmail,required_text('guardian_phone',48),$actor
    ]);break;
   case 'admission_review':
    $app=positive_id('application_id');$decision=(string)($_POST['decision']??'');
    if(!in_array($decision,['approved','rejected'],true))throw new InvalidArgumentException('Invalid review decision');
    $record=assert_school_row('admission_applications',$app,$school);
    if($record['status']!=='pending')throw new InvalidArgumentException('Only pending applications may be reviewed');
    $affected=run("UPDATE admission_applications SET status=?,reviewed_by=?,reviewed_at=NOW() WHERE id=? AND school_id=? AND status='pending'",[$decision,$actor,$app,$school]);
    if(!$affected)throw new InvalidArgumentException('Application was already reviewed');break;
   case 'admission_enroll':
    $app=positive_id('application_id');$admissionNo=required_text('admission_no',64);
    $studentPassword=(string)($_POST['student_password']??'');$guardianPassword=(string)($_POST['guardian_password']??'');
    if(strlen($studentPassword)<12)throw new InvalidArgumentException('Student password must contain at least 12 characters');
    db()->beginTransaction();
    try{
      $application=one("SELECT * FROM admission_applications WHERE id=? AND school_id=? FOR UPDATE",[$app,$school]);
      if(!$application||$application['status']!=='approved')throw new InvalidArgumentException('Only approved applications can be enrolled');
      $b=(int)$application['branch_id'];$sec=(int)$application['section_id'];$c=(int)$application['class_id'];
      $section=one("SELECT * FROM sections WHERE id=? AND school_id=? AND branch_id=? AND class_id=? FOR UPDATE",[$sec,$school,$b,$c]);
      if(!$section)throw new InvalidArgumentException('Invalid section assignment');
      $count=(int)(one("SELECT COUNT(*) n FROM student_profiles WHERE school_id=? AND section_id=?",[$school,$sec])['n']??0);
      if($count >= (int)$section['capacity'])throw new InvalidArgumentException('This section has reached capacity');
      if(one("SELECT id FROM users WHERE school_id=? AND email=?",[$school,$application['applicant_email']]))throw new InvalidArgumentException('Applicant account email already exists');
      $parent=one("SELECT id,role,branch_id FROM users WHERE school_id=? AND email=? FOR UPDATE",[$school,$application['guardian_email']]);
      if($parent){
        if($parent['role']!=='parent'||(int)$parent['branch_id']!==$b)throw new InvalidArgumentException('Guardian account has an incompatible role or branch');
        $parentId=(int)$parent['id'];
      }else{
        if(strlen($guardianPassword)<12)throw new InvalidArgumentException('New guardian password must contain at least 12 characters');
        run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'parent',?,?,?)",[$school,$b,$application['guardian_name'],$application['guardian_email'],password_hash($guardianPassword,PASSWORD_DEFAULT)]);
        $parentId=(int)db()->lastInsertId();
      }
      run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'student',?,?,?)",[$school,$b,$application['applicant_name'],$application['applicant_email'],password_hash($studentPassword,PASSWORD_DEFAULT)]);
      $studentId=(int)db()->lastInsertId();
      run("INSERT INTO student_profiles(school_id,branch_id,user_id,parent_user_id,class_id,section_id,admission_no) VALUES (?,?,?,?,?,?,?)",[$school,$b,$studentId,$parentId,$c,$sec,$admissionNo]);
      $updated=run("UPDATE admission_applications SET status='enrolled',enrolled_student_user_id=?,enrolled_parent_user_id=?,admission_number=? WHERE school_id=? AND id=? AND status='approved'",[$studentId,$parentId,$admissionNo,$school,$app]);
      if(!$updated)throw new RuntimeException('Application could not be marked enrolled');
      db()->commit();
      audit($school,$actor,'enroll','admission_application',$app);
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'branch':
    $code=strtoupper(required_text('code',32));if(!preg_match('/^[A-Z0-9-]+$/',$code))throw new InvalidArgumentException('Invalid branch code');
    run("INSERT INTO branches (school_id,name,code,city) VALUES (?,?,?,?)",[$school,required_text('name'),$code,trim((string)($_POST['city']??''))]);
    break;
   case 'academic_session':
    $start=date_input('start_date');$end=date_input('end_date');
    if($end<=$start)throw new InvalidArgumentException('End date must be later');
    run("INSERT INTO school_sessions(school_id,name,start_date,end_date,is_current) VALUES (?,?,?,?,0)",[$school,required_text('name',60),$start,$end]);
    break;
   case 'session_activate':
    $session=assert_school_row('school_sessions',positive_id('session_id'),$school);
    db()->beginTransaction();
    try {
     run('UPDATE school_sessions SET is_current=0 WHERE school_id=?',[$school]);
     run('UPDATE school_sessions SET is_current=1 WHERE id=? AND school_id=?',[$session['id'],$school]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'class':
    run("INSERT INTO classes(school_id,name) VALUES (?,?)",[$school,required_text('name',80)]);break;
   case 'subject':
    run("INSERT INTO subjects(school_id,name,code) VALUES (?,?,?)",[$school,required_text('name',100),strtoupper(required_text('code',32))]);break;
   case 'section':
    $b=positive_id('branch_id');$c=positive_id('class_id');
    assert_branch($b,$school);ownership('classes',$c,$school);
    $capacity=positive_id('capacity');if($capacity>200)throw new InvalidArgumentException('Capacity too high');
    run("INSERT INTO sections(school_id,branch_id,class_id,name,capacity) VALUES (?,?,?,?,?)",[$school,$b,$c,required_text('name',32),$capacity]);break;
   case 'person':
    $r=(string)($_POST['role']??'');$name=required_text('full_name');$email=strtolower(required_text('email'));
    $pw=(string)($_POST['password']??'');$b=positive_id('branch_id');
    if(!in_array($r,['admin','principal','accountant','teacher','student','parent','staff'],true)||strlen($pw)<12||!filter_var($email,FILTER_VALIDATE_EMAIL))throw new InvalidArgumentException('Invalid role, email or password (minimum 12 characters)');
    assert_branch($b,$school);if($r==='admin' && $u['role']!=='admin')throw new InvalidArgumentException('Only school admin can create another admin');run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,?,?,?,?)",[$school,$b,$r,$name,$email,password_hash($pw,PASSWORD_DEFAULT)]);
    break;
   case 'student_enrollment':
    $id=positive_id('student_user_id');$parent=($_POST['parent_user_id']??'')!==''?positive_id('parent_user_id'):null;
    $b=positive_id('branch_id');$c=positive_id('class_id');$s=positive_id('section_id');
    $studentAccount=school_user($id,$school,'student');
    if($parent)school_user($parent,$school,'parent');
    assert_branch($b,$school);ownership('classes',$c,$school);verify_section($school,$s,$c,$b);
    if((int)$studentAccount['branch_id']!==$b)throw new InvalidArgumentException('Student account branch must match enrollment branch');
    // Lock the section row to serialize capacity checks for concurrent enrollments.
    db()->beginTransaction();
    try {
     $section=one('SELECT id,capacity FROM sections WHERE school_id=? AND id=? FOR UPDATE',[$school,$s]);
     if(!$section)throw new InvalidArgumentException('Section no longer exists');
     $count=(int)(one('SELECT COUNT(*) n FROM student_profiles WHERE school_id=? AND section_id=?',[$school,$s])['n']??0);
     if($count >= (int)$section['capacity'])throw new InvalidArgumentException('Section is full');
     run("INSERT INTO student_profiles(school_id,branch_id,user_id,parent_user_id,class_id,section_id,admission_no,roll_no) VALUES (?,?,?,?,?,?,?,?)",[$school,$b,$id,$parent,$c,$s,required_text('admission_no',64),trim((string)($_POST['roll_no']??''))]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'student_move':
    $student=positive_id('student_user_id');
    $toBranch=positive_id('to_branch_id');
    $toClass=positive_id('to_class_id');
    $toSection=positive_id('to_section_id');
    $type=(string)($_POST['movement_type']??'');
    $reason=required_text('reason',255);
    if(!in_array($type,['promotion','section_change','transfer'],true))throw new InvalidArgumentException('Invalid student movement type');
    assert_branch($toBranch,$school);
    ownership('classes',$toClass,$school);
    verify_section($school,$toSection,$toClass,$toBranch);
    db()->beginTransaction();
    try {
     $session=one("SELECT id FROM school_sessions WHERE school_id=? AND is_current=1 LIMIT 1",[$school]);
     if(!$session)throw new InvalidArgumentException('Activate an academic session before moving students');
     $profile=one("SELECT * FROM student_profiles WHERE user_id=? AND school_id=? FOR UPDATE",[$student,$school]);
     if(!$profile)throw new InvalidArgumentException('Student enrollment not found');
     $fromBranch=(int)$profile['branch_id'];$fromClass=(int)$profile['class_id'];$fromSection=(int)$profile['section_id'];
     if($fromBranch===$toBranch && $fromClass===$toClass && $fromSection===$toSection)throw new InvalidArgumentException('Student is already in that section');
     if($u['role']==='principal' && ((int)$u['branch_id']!==$fromBranch || (int)$u['branch_id']!==$toBranch))throw new InvalidArgumentException('Principal cannot move students between campuses');
     if($type==='promotion' && ($toClass===$fromClass || $toBranch!==$fromBranch))throw new InvalidArgumentException('Promotion must change class within the current branch');
     if($type==='section_change' && ($toClass!==$fromClass || $toBranch!==$fromBranch))throw new InvalidArgumentException('Section change must stay in the same class and campus');
     if($type==='transfer' && $toBranch===$fromBranch)throw new InvalidArgumentException('Transfer must target a different campus');
     if($toBranch!==$fromBranch){
      $activeTransport=(int)(one("SELECT COUNT(*) n FROM transport_assignments WHERE school_id=? AND student_user_id=? AND released_at IS NULL",[$school,$student])['n']??0);
      if($activeTransport>0)throw new InvalidArgumentException('Release active transport assignment before transferring campus');
      $activeLoans=(int)(one("SELECT COUNT(*) n FROM library_loans WHERE school_id=? AND borrower_user_id=? AND returned_at IS NULL",[$school,$student])['n']??0);
      if($activeLoans>0)throw new InvalidArgumentException('Return active library loans before transferring campus');
     }
     // Lock destination section; all enrollments and student moves acquire this row before capacity check.
     $destination=one("SELECT id,capacity FROM sections WHERE id=? AND school_id=? AND branch_id=? AND class_id=? FOR UPDATE",[$toSection,$school,$toBranch,$toClass]);
     if(!$destination)throw new InvalidArgumentException('Destination section no longer exists');
     $occupied=(int)(one("SELECT COUNT(*) n FROM student_profiles WHERE school_id=? AND section_id=?",[$school,$toSection])['n']??0);
     if($occupied >= (int)$destination['capacity'])throw new InvalidArgumentException('Destination section is full');
     run("UPDATE student_profiles SET branch_id=?,class_id=?,section_id=? WHERE school_id=? AND user_id=?",[$toBranch,$toClass,$toSection,$school,$student]);
     run("UPDATE users SET branch_id=? WHERE school_id=? AND id=? AND role='student'",[$toBranch,$school,$student]);
     run("INSERT INTO student_movements(school_id,student_user_id,from_branch_id,to_branch_id,from_class_id,to_class_id,from_section_id,to_section_id,academic_session_id,movement_type,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [$school,$student,$fromBranch,$toBranch,$fromClass,$toClass,$fromSection,$toSection,(int)$session['id'],$type,$reason,$actor]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'library_loan':
    $bookId=positive_id('book_id');$borrowerId=positive_id('borrower_user_id');
    $due=date_input('due_date');$today=date('Y-m-d');
    if($due<$today)throw new InvalidArgumentException('Due date cannot be in the past');
    db()->beginTransaction();
    try {
     // Lock book to prevent two concurrent requests oversubscribing available copies.
     $book=one("SELECT * FROM library_books WHERE id=? AND school_id=? FOR UPDATE",[$bookId,$school]);
     if(!$book)throw new InvalidArgumentException('Book not found');
     if($u['role']==='principal' && (int)$u['branch_id']!==(int)$book['branch_id'])throw new InvalidArgumentException('Book belongs to another campus');
     $borrower=school_user($borrowerId,$school);
     if(!in_array($borrower['role'],['student','teacher','staff','principal'],true))throw new InvalidArgumentException('Only students and staff can borrow books');
     if((int)$borrower['branch_id']!==(int)$book['branch_id'])throw new InvalidArgumentException('Borrower must belong to book campus');
     if($borrower['role']==='student'){
      $sp=verify_student($school,$borrowerId);
      if((int)$sp['branch_id']!==(int)$book['branch_id'])throw new InvalidArgumentException('Student has transferred campus');
     }
     $taken=(int)(one("SELECT COUNT(*) n FROM library_loans WHERE school_id=? AND book_id=? AND returned_at IS NULL",[$school,$bookId])['n']??0);
     if($taken >= (int)$book['copies'])throw new InvalidArgumentException('No copies currently available');
     $duplicate=one("SELECT id FROM library_loans WHERE school_id=? AND book_id=? AND borrower_user_id=? AND returned_at IS NULL",[$school,$bookId,$borrowerId]);
     if($duplicate)throw new InvalidArgumentException('Borrower already has this book');
     run("INSERT INTO library_loans(school_id,branch_id,book_id,borrower_user_id,issue_date,due_date,issued_by) VALUES (?,?,?,?,?,?,?)",[$school,$book['branch_id'],$bookId,$borrowerId,$today,$due,$actor]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'library_return':
    $loanId=positive_id('loan_id');
    db()->beginTransaction();
    try {
     $loan=one("SELECT * FROM library_loans WHERE id=? AND school_id=? FOR UPDATE",[$loanId,$school]);
     if(!$loan)throw new InvalidArgumentException('Loan not found');
     if($u['role']==='principal' && (int)$u['branch_id']!==(int)$loan['branch_id'])throw new InvalidArgumentException('Loan belongs to another campus');
     if($loan['returned_at']!==null)throw new InvalidArgumentException('Book already returned');
     run("UPDATE library_loans SET returned_at=NOW(),returned_by=? WHERE id=? AND school_id=? AND returned_at IS NULL",[$actor,$loanId,$school]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'allocation':
    $teacher=positive_id('teacher_user_id');$c=positive_id('class_id');$s=positive_id('section_id');$sub=positive_id('subject_id');
    school_user($teacher,$school,'teacher');ownership('classes',$c,$school);ownership('subjects',$sub,$school);
    $section=verify_section($school,$s,$c);$b=(int)$section['branch_id'];
    $teacherAccount=school_user($teacher,$school,'teacher');
    if((int)$teacherAccount['branch_id']!==$b)throw new InvalidArgumentException('Teacher belongs to a different branch');
    run("INSERT INTO teacher_allocations(school_id,branch_id,teacher_user_id,class_id,section_id,subject_id) VALUES (?,?,?,?,?,?)",[$school,$b,$teacher,$c,$s,$sub]);break;
   case 'timetable':
    $c=positive_id('class_id');$s=positive_id('section_id');$sub=positive_id('subject_id');$teacher=positive_id('teacher_user_id');
    ownership('classes',$c,$school);ownership('subjects',$sub,$school);school_user($teacher,$school,'teacher');
    $section=verify_section($school,$s,$c);$b=(int)$section['branch_id'];
    $teacherAccount=school_user($teacher,$school,'teacher');
    if((int)$teacherAccount['branch_id']!==$b)throw new InvalidArgumentException('Teacher belongs to a different branch');
    if(!is_teacher_assigned(['id'=>$teacher,'role'=>'teacher','school_id'=>$school],$c,$s,$sub))throw new InvalidArgumentException('Teacher must first be allocated');
    $day=positive_id('weekday');$period=positive_id('period_no');
    if($day>7||$period>20)throw new InvalidArgumentException('Invalid day or period');
    $st=required_text('start_time',8);$en=required_text('end_time',8);
    if(!preg_match('/^\d{2}:\d{2}$/',$st)||!preg_match('/^\d{2}:\d{2}$/',$en)||$st>=$en)throw new InvalidArgumentException('Invalid times');
    run("INSERT INTO timetable(school_id,branch_id,class_id,section_id,subject_id,teacher_user_id,weekday,period_no,start_time,end_time) VALUES (?,?,?,?,?,?,?,?,?,?)",[$school,$b,$c,$s,$sub,$teacher,$day,$period,$st,$en]);break;
   case 'attendance':
    require_roles(['admin','principal','teacher']);
    $student=positive_id('student_user_id');$day=date_input('day');$status=(string)($_POST['status']??'');
    if(!in_array($status,['present','absent','late','leave'],true))throw new InvalidArgumentException('Invalid attendance status');
    $p=verify_student($school,$student);
    if(!allowed_branch($u,(int)$p['branch_id']))throw new InvalidArgumentException('Branch not allowed');
    if(!is_teacher_assigned($u,(int)$p['class_id'],(int)$p['section_id']))throw new InvalidArgumentException('You are not assigned to this section');
    run("INSERT INTO attendance(school_id,branch_id,student_user_id,class_id,section_id,day,status,entered_by) VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),entered_by=VALUES(entered_by)",
      [$school,$p['branch_id'],$student,$p['class_id'],$p['section_id'],$day,$status,$actor]);break;
   case 'homework':
    require_roles(['admin','principal','teacher']);
    $c=positive_id('class_id');$s=positive_id('section_id');$sub=positive_id('subject_id');
    ownership('classes',$c,$school);ownership('subjects',$sub,$school);$section=verify_section($school,$s,$c);
    if(!is_teacher_assigned($u,$c,$s,$sub)||!allowed_branch($u,(int)$section['branch_id']))throw new InvalidArgumentException('Not assigned to this subject / branch');
    $assignedTeacher=$u['role']==='teacher'?$actor:positive_id('teacher_user_id');
    $teacherAccount=school_user($assignedTeacher,$school,'teacher');
    if((int)$teacherAccount['branch_id']!==(int)$section['branch_id']||!is_teacher_assigned(['id'=>$assignedTeacher,'role'=>'teacher','school_id'=>$school],$c,$s,$sub))throw new InvalidArgumentException('Choose an allocated teacher for this subject');
    $due=required_text('due_at',20);$close=required_text('close_at',20);
    if(!strtotime($due)||!strtotime($close)||strtotime($close)<strtotime($due))throw new InvalidArgumentException('Closing time must follow due time');
    $max=money_input('max_marks');if($max<=0||$max>1000)throw new InvalidArgumentException('Invalid max marks');
    run("INSERT INTO homework(school_id,branch_id,class_id,section_id,subject_id,teacher_user_id,title,instructions,due_at,close_at,max_marks) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
     [$school,$section['branch_id'],$c,$s,$sub,$assignedTeacher,required_text('title'),required_text('instructions',50000),str_replace('T',' ',$due),str_replace('T',' ',$close),$max]);break;
   case 'homework_submit':
    require_roles(['student']);
    $hw=assert_school_row('homework',positive_id('homework_id'),$school);
    $p=verify_student($school,$actor);
    if((int)$p['section_id']!==(int)$hw['section_id'] || (int)$p['class_id']!==(int)$hw['class_id'])throw new InvalidArgumentException('Homework not assigned to you');
    if(strtotime($hw['close_at'])<time())throw new InvalidArgumentException('Submission is closed');
    $answer=required_text('answer_text',100000);
    run("INSERT INTO homework_submissions(school_id,homework_id,student_user_id,answer_text) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE answer_text=VALUES(answer_text),submitted_at=CURRENT_TIMESTAMP",
     [$school,$hw['id'],$actor,$answer]);break;
   case 'homework_grade':
    require_roles(['admin','principal','teacher']);
    $subm=assert_school_row('homework_submissions',positive_id('submission_id'),$school);
    $hw=assert_school_row('homework',(int)$subm['homework_id'],$school);
    if(!is_teacher_assigned($u,(int)$hw['class_id'],(int)$hw['section_id'],(int)$hw['subject_id'])||($u['role']==='teacher' && (int)$hw['teacher_user_id']!==$actor))throw new InvalidArgumentException('You cannot grade another teacher\'s homework');
    $marks=money_input('marks');if($marks>(float)$hw['max_marks'])throw new InvalidArgumentException('Marks exceed maximum');
    run("UPDATE homework_submissions SET marks=?,feedback=?,graded_by=? WHERE id=? AND school_id=?",[$marks,trim((string)($_POST['feedback']??'')),$actor,$subm['id'],$school]);break;
   case 'exam':
    require_roles(['admin','principal','teacher']);
    $c=positive_id('class_id');$s=positive_id('section_id');$sub=positive_id('subject_id');ownership('classes',$c,$school);ownership('subjects',$sub,$school);
    $section=verify_section($school,$s,$c);
    if(!is_teacher_assigned($u,$c,$s,$sub)||!allowed_branch($u,(int)$section['branch_id']))throw new InvalidArgumentException('Not assigned to this subject / branch');
    $max=money_input('max_marks');$passing=money_input('passing_marks');
    if($max<=0||$passing>$max)throw new InvalidArgumentException('Invalid marks');
    run("INSERT INTO exams(school_id,branch_id,class_id,section_id,subject_id,title,exam_date,max_marks,passing_marks) VALUES (?,?,?,?,?,?,?,?,?)",
     [$school,$section['branch_id'],$c,$s,$sub,required_text('title'),date_input('exam_date'),$max,$passing]);break;
   case 'exam_mark':
    require_roles(['admin','principal','teacher']);
    $examId=positive_id('exam_id');$student=positive_id('student_user_id');
    $marks=money_input('marks');
    db()->beginTransaction();
    try {
     // Exam record lock serializes marking with publication.
     $ex=one("SELECT * FROM exams WHERE id=? AND school_id=? FOR UPDATE",[$examId,$school]);
     if(!$ex)throw new InvalidArgumentException('Exam not found');
     if((int)$ex['published']===1)throw new InvalidArgumentException('Published results are locked. No marks can be changed.');
     $p=verify_student($school,$student);
     if((int)$p['section_id']!==(int)$ex['section_id'] || (int)$p['class_id']!==(int)$ex['class_id'])throw new InvalidArgumentException('Student not in exam section');
     if(!is_teacher_assigned($u,(int)$ex['class_id'],(int)$ex['section_id'],(int)$ex['subject_id'])||!allowed_branch($u,(int)$ex['branch_id']))throw new InvalidArgumentException('Teacher is not assigned to this exam');
     if($marks>(float)$ex['max_marks'])throw new InvalidArgumentException('Marks exceed maximum');
     run("INSERT INTO exam_results(school_id,exam_id,student_user_id,marks,recorded_by) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE marks=VALUES(marks),recorded_by=VALUES(recorded_by)",
      [$school,$ex['id'],$student,$marks,$actor]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'publish_exam':
    require_roles(['admin','principal']);
    $examId=positive_id('exam_id');
    db()->beginTransaction();
    try {
     $ex=one("SELECT * FROM exams WHERE id=? AND school_id=? FOR UPDATE",[$examId,$school]);
     if(!$ex)throw new InvalidArgumentException('Exam not found');
     if((int)$ex['published']===1)throw new InvalidArgumentException('Exam already published');
     $enrolled=(int)(one("SELECT COUNT(*) n FROM student_profiles WHERE school_id=? AND branch_id=? AND section_id=? AND class_id=?",[$school,$ex['branch_id'],$ex['section_id'],$ex['class_id']])['n']??0);
     $marked=(int)(one("SELECT COUNT(*) n FROM exam_results WHERE school_id=? AND exam_id=?",[$school,$examId])['n']??0);
     if($enrolled===0||$enrolled!==$marked)throw new InvalidArgumentException("Cannot publish: $marked of $enrolled students marked");
     run("UPDATE exams SET published=1 WHERE id=? AND school_id=? AND published=0",[$examId,$school]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'fee_invoice':
    $student=positive_id('student_user_id');$p=verify_student($school,$student);
    if(!allowed_branch($u,(int)$p['branch_id']))throw new InvalidArgumentException('Student belongs to another branch');
    $amount=money_input('amount');if($amount<=0)throw new InvalidArgumentException('Amount must exceed zero');
    run("INSERT INTO fee_invoices(school_id,branch_id,student_user_id,invoice_no,description,amount,due_date) VALUES (?,?,?,?,?,?,?)",
     [$school,$p['branch_id'],$student,required_text('invoice_no',64),required_text('description'),$amount,date_input('due_date')]);break;
   case 'fee_adjustment':
    require_roles(['admin','accountant']);
    $invoiceId=positive_id('invoice_id');
    $type=(string)($_POST['adjustment_type']??'');
    if(!in_array($type,['concession','scholarship','waiver'],true))throw new InvalidArgumentException('Invalid fee adjustment type');
    $amount=money_input('amount');
    if($amount<=0)throw new InvalidArgumentException('Adjustment must be positive');
    $reason=required_text('reason',255);
    db()->beginTransaction();
    try {
     $invoice=one("SELECT * FROM fee_invoices WHERE id=? AND school_id=? FOR UPDATE",[$invoiceId,$school]);
     if(!$invoice||!allowed_branch($u,(int)$invoice['branch_id']))throw new InvalidArgumentException('Invoice not found for your branch');
     $adjusted=(float)(one("SELECT COALESCE(SUM(amount),0) amt FROM fee_adjustments WHERE school_id=? AND invoice_id=?",[$school,$invoiceId])['amt']??0);
     $paid=(float)(one("SELECT COALESCE(SUM(amount),0) amt FROM fee_payments WHERE school_id=? AND invoice_id=?",[$school,$invoiceId])['amt']??0);
     if($amount+$paid+$adjusted>(float)$invoice['amount']+0.0001)throw new InvalidArgumentException('Discount would exceed unpaid invoice balance');
     run("INSERT INTO fee_adjustments(school_id,invoice_id,adjustment_type,amount,reason,approved_by) VALUES (?,?,?,?,?,?)",[$school,$invoiceId,$type,$amount,$reason,$actor]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'fee_payment':
    require_roles(['admin','accountant']);
    $invoice=assert_school_row('fee_invoices',positive_id('invoice_id'),$school);
    if(!allowed_branch($u,(int)$invoice['branch_id']))throw new InvalidArgumentException('Invoice belongs to another branch');
    $amount=money_input('amount');$mode=(string)($_POST['mode']??'cash');
    if(!in_array($mode,['cash','bank','cheque','online_manual'],true)||$amount<=0)throw new InvalidArgumentException('Invalid payment');
    db()->beginTransaction();
    try{
     // Lock parent invoice row, not an aggregate result, to serialize concurrent payments.
     one("SELECT id FROM fee_invoices WHERE id=? AND school_id=? FOR UPDATE",[$invoice['id'],$school]);
     $paid=(float)(one("SELECT COALESCE(SUM(amount),0) amt FROM fee_payments WHERE school_id=? AND invoice_id=?",[$school,$invoice['id']])['amt']??0);
     $adjusted=(float)(one("SELECT COALESCE(SUM(amount),0) amt FROM fee_adjustments WHERE school_id=? AND invoice_id=?",[$school,$invoice['id']])['amt']??0);
     if($paid+$adjusted+$amount>(float)$invoice['amount']+0.0001)throw new InvalidArgumentException('Payment exceeds discounted balance');
     run("INSERT INTO fee_payments(school_id,invoice_id,amount,mode,reference,received_by) VALUES (?,?,?,?,?,?)",
      [$school,$invoice['id'],$amount,$mode,trim((string)($_POST['reference']??'')),$actor]);db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}break;
   case 'notice':
    $audience=(string)($_POST['audience']??'all');
    if(!in_array($audience,['all','teachers','students','parents'],true))throw new InvalidArgumentException('Invalid audience');
    run("INSERT INTO notices(school_id,title,body,audience) VALUES (?,?,?,?)",[$school,required_text('title'),required_text('body',50000),$audience]);break;
   case 'library_book':
    $b=positive_id('branch_id');assert_branch($b,$school);
    run("INSERT INTO library_books(school_id,branch_id,title,author,isbn,copies) VALUES (?,?,?,?,?,?)",
      [$school,$b,required_text('title'),trim((string)($_POST['author']??'')),trim((string)($_POST['isbn']??'')),positive_id('copies')]);break;
   case 'transport_route':
    $b=positive_id('branch_id');assert_branch($b,$school);
    if(!allowed_branch($u,$b))throw new InvalidArgumentException('Cannot manage another campus');
    $seats=positive_id('seat_capacity');
    if($seats>120)throw new InvalidArgumentException('Maximum capacity is 120 seats');
    run("INSERT INTO transport_routes(school_id,branch_id,name,vehicle,driver_name,monthly_fee,seat_capacity) VALUES (?,?,?,?,?,?,?)",
      [$school,$b,required_text('name'),trim((string)($_POST['vehicle']??'')),trim((string)($_POST['driver_name']??'')),money_input('monthly_fee'),$seats]);break;
   case 'transport_assign':
    $routeId=positive_id('route_id');$studentId=positive_id('student_user_id');
    db()->beginTransaction();
    try{
     $route=one("SELECT * FROM transport_routes WHERE id=? AND school_id=? FOR UPDATE",[$routeId,$school]);
     if(!$route||!allowed_branch($u,(int)$route['branch_id']))throw new InvalidArgumentException('Route not available to this campus');
     $studentProfile=verify_student($school,$studentId);
     if((int)$studentProfile['branch_id']!==(int)$route['branch_id'])throw new InvalidArgumentException('Student and route campuses must match');
     $existing=one("SELECT id FROM transport_assignments WHERE school_id=? AND student_user_id=? AND released_at IS NULL",[$school,$studentId]);
     if($existing)throw new InvalidArgumentException('Student already has an active transport route');
     $occupied=(int)(one("SELECT COUNT(*) n FROM transport_assignments WHERE school_id=? AND route_id=? AND released_at IS NULL",[$school,$routeId])['n']??0);
     if($occupied >= (int)$route['seat_capacity'])throw new InvalidArgumentException('No free seats on this route');
     run("INSERT INTO transport_assignments(school_id,branch_id,route_id,student_user_id,assigned_on,assigned_by) VALUES (?,?,?,?,CURDATE(),?)",
      [$school,$route['branch_id'],$routeId,$studentId,$actor]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'transport_release':
    $assignmentId=positive_id('assignment_id');
    db()->beginTransaction();
    try{
     $assignment=one("SELECT * FROM transport_assignments WHERE id=? AND school_id=? FOR UPDATE",[$assignmentId,$school]);
     if(!$assignment||!allowed_branch($u,(int)$assignment['branch_id']))throw new InvalidArgumentException('Assignment not accessible');
     if($assignment['released_at']!==null)throw new InvalidArgumentException('Assignment already released');
     run("UPDATE transport_assignments SET released_at=NOW(),released_by=? WHERE id=? AND school_id=? AND released_at IS NULL",[$actor,$assignmentId,$school]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'inventory_item':
    $b=positive_id('branch_id');assert_branch($b,$school);
    if(!allowed_branch($u,$b))throw new InvalidArgumentException('Cannot manage inventory in another campus');
    $raw=(string)($_POST['quantity']??'0');
    if(!ctype_digit($raw)||(int)$raw>1000000)throw new InvalidArgumentException('Initial stock must be 0 to 1,000,000');
    $initial=(int)$raw;
    db()->beginTransaction();
    try {
     run("INSERT INTO inventory_items(school_id,branch_id,name,sku,quantity) VALUES (?,?,?,?,?)",
      [$school,$b,required_text('name'),trim((string)($_POST['sku']??'')),$initial]);
     $itemId=(int)db()->lastInsertId();
     if($initial>0){
      run("INSERT INTO inventory_movements(school_id,branch_id,item_id,movement_type,quantity,balance_before,balance_after,reason,performed_by) VALUES (?,?,?,'opening',?,0,?,'Initial stock',?)",
       [$school,$b,$itemId,$initial,$initial,$actor]);
     }
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'inventory_move':
    $itemId=positive_id('item_id');
    $kind=(string)($_POST['movement_type']??'');
    if(!in_array($kind,['receipt','issue'],true))throw new InvalidArgumentException('Invalid stock movement type');
    $qty=positive_id('quantity');
    if($qty>1000000)throw new InvalidArgumentException('Movement quantity is too large');
    $reason=required_text('reason',255);
    db()->beginTransaction();
    try{
     $item=one("SELECT * FROM inventory_items WHERE id=? AND school_id=? FOR UPDATE",[$itemId,$school]);
     if(!$item||!allowed_branch($u,(int)$item['branch_id']))throw new InvalidArgumentException('Inventory item not available to this campus');
     $before=(int)$item['quantity'];
     $after=$kind==='receipt'?$before+$qty:$before-$qty;
     if($after<0)throw new InvalidArgumentException('Cannot issue more items than current stock');
     if($after>100000000)throw new InvalidArgumentException('Stock balance exceeds limit');
     run("UPDATE inventory_items SET quantity=? WHERE id=? AND school_id=?",[$after,$itemId,$school]);
     run("INSERT INTO inventory_movements(school_id,branch_id,item_id,movement_type,quantity,balance_before,balance_after,reason,performed_by) VALUES (?,?,?,?,?,?,?,?,?)",
      [$school,$item['branch_id'],$itemId,$kind,$qty,$before,$after,$reason,$actor]);
     db()->commit();
    }catch(Throwable $e){db()->rollBack();throw $e;}
    break;
   case 'payroll':
    $employee=positive_id('employee_user_id');$person=school_user($employee,$school);
    if(!in_array($person['role'],['teacher','staff','principal','accountant'],true))throw new InvalidArgumentException('Not an employee');
    $month=required_text('month_key',7);if(!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/',$month))throw new InvalidArgumentException('Invalid month');
    run("INSERT INTO payroll_entries(school_id,employee_user_id,month_key,basic,allowance,deduction) VALUES (?,?,?,?,?,?)",
     [$school,$employee,$month,money_input('basic'),money_input('allowance'),money_input('deduction')]);break;
   case 'certificate':
    $student=positive_id('student_user_id');verify_student($school,$student);
    run("INSERT INTO certificates(school_id,student_user_id,title,body,issued_on) VALUES (?,?,?,?,?)",
     [$school,$student,required_text('title'),required_text('body',10000),date_input('issued_on')]);break;
   case 'leave':
    $start=date_input('start_date');$end=date_input('end_date');
    if($end<$start)throw new InvalidArgumentException('Invalid leave range');
    run("INSERT INTO leave_requests(school_id,user_id,start_date,end_date,reason) VALUES (?,?,?,?,?)",
      [$school,$actor,$start,$end,required_text('reason',5000)]);break;
   case 'leave_decide':
    require_roles(['admin','principal']);$req=assert_school_row('leave_requests',positive_id('request_id'),$school);
    $st=(string)($_POST['status']??'');if(!in_array($st,['approved','rejected'],true))throw new InvalidArgumentException('Invalid status');
    run("UPDATE leave_requests SET status=? WHERE id=? AND school_id=?",[$st,$req['id'],$school]);break;
   default:throw new InvalidArgumentException('Unknown action');
  }
  audit($school,$actor,'create_or_update',$action,null);
  flash('Saved successfully.');$back=(string)($_POST['_back']??'dashboard');
  $approved=['dashboard','admissions','setup','people','academics','attendance','homework','exams','finance','notices','resources','reports','documents','leave','timetable'];
  redirect(in_array($back,$approved,true)?$back:'dashboard');
 }catch(PDOException $e) {
    error_log($e->getMessage());
    flash('Database operation failed. Check duplicate values, relations and required fields.','error');
 }catch(Throwable $e){ flash($e instanceof InvalidArgumentException?$e->getMessage():'Request failed. Check server logs.','error');if(!($e instanceof InvalidArgumentException))error_log($e->getMessage()); }
 $back=(string)($_POST['_back']??'dashboard');$approved=['dashboard','company','admissions','setup','people','academics','attendance','homework','exams','finance','notices','resources','reports','documents','leave','timetable','login'];
 redirect(in_array($back,$approved,true)?$back:'dashboard');
}
