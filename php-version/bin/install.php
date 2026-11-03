<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') exit("CLI only.\n");
require dirname(__DIR__) . '/app/core.php';
function secret(string $label): string {
    fwrite(STDOUT,$label.': '); $v=trim((string)fgets(STDIN));
    if (strlen($v)<12) throw new RuntimeException('Choose a password with at least 12 characters.');
    return $v;
}
$mode=$argv[1]??'';
if ($mode==='company') {
    $name=$argv[2]??''; $email=strtolower(trim($argv[3]??''));
    if (!$name || !filter_var($email,FILTER_VALIDATE_EMAIL)) exit("php bin/install.php company \"Owner Name\" owner@example.com\n");
    $p=secret('Company admin password');
    run("INSERT INTO vendor_users(name,email,password_hash) VALUES (?,?,?)",[$name,$email,password_hash($p,PASSWORD_DEFAULT)]);
    echo "Company owner created. Open /?page=login&portal=company\n";
} elseif ($mode==='school') {
    $name=$argv[2]??''; $code=strtolower(trim($argv[3]??'')); $email=strtolower(trim($argv[4]??''));
    if (!$name || !preg_match('/^[a-z0-9-]{3,48}$/',$code) || !filter_var($email,FILTER_VALIDATE_EMAIL)) exit("php bin/install.php school \"School Name\" school-code admin@example.com\n");
    $p=secret('School admin password'); db()->beginTransaction();
    try {
        run("INSERT INTO schools(name,code,delivery_model) VALUES (?,?,'direct')",[$name,$code]);
        $school=(int)db()->lastInsertId();
        run("INSERT INTO branches(school_id,name,code) VALUES (?,?,?)",[$school,'Main Campus','MAIN']);
        $branch=(int)db()->lastInsertId();
        run("INSERT INTO users(school_id,branch_id,role,full_name,email,password_hash) VALUES (?,?,'admin',?,?,?)",[$school,$branch,'School Administrator',$email,password_hash($p,PASSWORD_DEFAULT)]);
        db()->commit(); echo "Direct school created. School code: $code\n";
    } catch(Throwable $e) { db()->rollBack(); throw $e; }
} else {
    echo "Commands:\n php bin/install.php company \"Owner Name\" owner@example.com\n php bin/install.php school \"School Name\" code admin@example.com\n";
}
