<?php
declare(strict_types=1);
if (!is_file(dirname(__DIR__) . '/config.php')) {
    http_response_code(503);
    exit('Configuration missing. Copy config.example.php to config.php and configure your database.');
}
define('APP_CONFIG', require dirname(__DIR__) . '/config.php');
date_default_timezone_set((string)(APP_CONFIG['timezone'] ?? 'Asia/Karachi'));
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_name('campusos_sid');
    session_set_cookie_params(['httponly'=>true, 'secure'=>(!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'), 'samesite'=>'Lax', 'path'=>'/']);
    session_start();
}
function db(): PDO {
    static $db = null;
    if ($db instanceof PDO) return $db;
    $c = APP_CONFIG;
    $dsn = 'mysql:host='.$c['db_host'].';port='.(int)$c['db_port'].';dbname='.$c['db_name'].';charset=utf8mb4';
    $db = new PDO($dsn, $c['db_user'], $c['db_pass'], [
        PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES=>false,
    ]);
    return $db;
}
function one(string $sql, array $args=[]): ?array {
    $s=db()->prepare($sql); $s->execute($args);
    return $s->fetch() ?: null;
}
function many(string $sql, array $args=[]): array {
    $s=db()->prepare($sql); $s->execute($args);
    return $s->fetchAll();
}
function run(string $sql, array $args=[]): int {
    $s=db()->prepare($sql); $s->execute($args);
    return $s->rowCount();
}
function h(mixed $v): string { return htmlspecialchars((string)($v??''), ENT_QUOTES|ENT_SUBSTITUTE, 'UTF-8'); }
function url(string $page, array $args=[]): string { return '/?'.http_build_query(['page'=>$page]+$args); }
function redirect(string $page, array $args=[]): never { header('Location: '.url($page,$args)); exit; }
function flash(string $message, string $type='success'): void { $_SESSION['flash']=['message'=>$message,'type'=>$type]; }
function csrf(): string { return $_SESSION['csrf']??=bin2hex(random_bytes(32)); }
function csrf_input(): string { return '<input type="hidden" name="_csrf" value="'.h(csrf()).'">'; }
function verify_csrf(): void {
    if (!hash_equals(csrf(), (string)($_POST['_csrf']??''))) { http_response_code(419); exit('Invalid form token. Refresh and retry.'); }
}
function current_user(): ?array {
    $s=$_SESSION['school_user']??null;
    if (!is_array($s) || empty($s['id']) || empty($s['school_id'])) return null;
    return one("SELECT u.id,u.school_id,u.branch_id,u.role,u.full_name,u.email,u.status,s.name AS school_name,s.code AS school_code,s.status AS school_status FROM users u JOIN schools s ON s.id=u.school_id WHERE u.id=? AND u.school_id=? LIMIT 1",[(int)$s['id'],(int)$s['school_id']]);
}
function company_user(): ?array {
    $id=$_SESSION['vendor_user']??null;
    return $id?one("SELECT id,name,email FROM vendor_users WHERE id=? AND active=1",[(int)$id]):null;
}
function require_school(): array {
    $u=current_user();
    if (!$u || $u['status']!=='active' || $u['school_status']!=='active') redirect('login');
    return $u;
}
function require_company(): array { $u=company_user(); if (!$u) redirect('login',['portal'=>'company']); return $u; }
function require_roles(array $roles): array {
    $u=require_school();
    if (!in_array($u['role'],$roles,true)) { http_response_code(403); exit('Access denied.'); }
    return $u;
}
function assert_school_row(string $table,int $id,int $school): array {
    $tables=['branches','users','school_sessions','classes','sections','subjects','student_profiles','teacher_allocations','timetable','attendance','homework','homework_submissions','exams','exam_results','fee_invoices','fee_payments','notices','library_books','transport_routes','inventory_items','payroll_entries','certificates','leave_requests'];
    if (!in_array($table,$tables,true)) throw new InvalidArgumentException('Invalid table');
    $row=one("SELECT * FROM ".$table." WHERE id=? AND school_id=?",[$id,$school]);
    if (!$row) { http_response_code(404); exit('Record not found.'); }
    return $row;
}
function audit(?int $schoolId,?int $userId,string $event,string $entity,?int $entityId=null): void {
    run("INSERT INTO audit_logs (school_id,user_id,event,entity,entity_id,ip_address) VALUES (?,?,?,?,?,?)",
        [$schoolId,$userId,$event,$entity,$entityId,substr((string)($_SERVER['REMOTE_ADDR']??''),0,45)]);
}
function school_id(): int { return (int)require_school()['school_id']; }
function user_id(): int { return (int)require_school()['id']; }
function assert_branch(int $branchId,int $schoolId): void {
    if (!one('SELECT id FROM branches WHERE id=? AND school_id=?',[$branchId,$schoolId])) throw new InvalidArgumentException('Invalid branch');
}
function allowed_branch(array $u,int $branchId): bool {
    return $u['role']==='admin' || ($branchId>0 && !empty($u['branch_id']) && (int)$u['branch_id']===$branchId);
}
function user_children(array $u): array {
    if ($u['role']==='student') return [(int)$u['id']];
    if ($u['role']==='parent') return array_map('intval',array_column(many("SELECT user_id FROM student_profiles WHERE school_id=? AND parent_user_id=?",[$u['school_id'],$u['id']]),'user_id'));
    return [];
}
function is_teacher_assigned(array $u,int $classId,int $sectionId,int $subjectId=0): bool {
    if (in_array($u['role'],['admin','principal'],true)) return true;
    if ($u['role']!=='teacher') return false;
    $sql="SELECT 1 FROM teacher_allocations WHERE school_id=? AND teacher_user_id=? AND class_id=? AND section_id=?";
    $args=[$u['school_id'],$u['id'],$classId,$sectionId];
    if ($subjectId) { $sql.=" AND subject_id=?"; $args[]=$subjectId; }
    return (bool)one($sql." LIMIT 1",$args);
}
function login_limited(string $identifier): bool {
    $ip=substr((string)($_SERVER['REMOTE_ADDR']??''),0,45);
    return (int)(one("SELECT COUNT(*) n FROM login_attempts WHERE identifier=? AND ip_address=? AND created_at > DATE_SUB(NOW(),INTERVAL 15 MINUTE)",[$identifier,$ip])['n']??0)>=8;
}
function failed_login(string $identifier): void {
    run("INSERT INTO login_attempts (identifier,ip_address) VALUES (?,?)",[$identifier,substr((string)($_SERVER['REMOTE_ADDR']??''),0,45)]);
}
function clear_login_attempts(string $identifier): void {
    run("DELETE FROM login_attempts WHERE identifier=? AND ip_address=?",[$identifier,substr((string)($_SERVER['REMOTE_ADDR']??''),0,45)]);
}
function logout_everything(): void { $_SESSION=[]; session_regenerate_id(true); }
