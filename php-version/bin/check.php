<?php
declare(strict_types=1);
/**
 * Run from php-version/: php bin/check.php
 * Does not create or alter data. Exit nonzero when preflight fails.
 */
if (PHP_SAPI!=='cli') exit("This preflight is CLI only.\n");
$root=dirname(__DIR__);
$errors=[];
$required=['app/core.php','app/actions.php','public/index.php','public/assets/style.css','public/assets/app.js','database/schema.sql','config.php'];
foreach($required as $file){if(!is_file($root.'/'.$file))$errors[]="Missing file: $file";}
if(PHP_VERSION_ID<80200)$errors[]='PHP 8.2 or newer is required';
foreach(['pdo_mysql','mbstring'] as $ext){if(!extension_loaded($ext))$errors[]="Missing PHP extension: $ext";}
if(!function_exists('random_bytes')||!function_exists('password_hash'))$errors[]='Required cryptography functions unavailable';
foreach(glob($root.'/app/*.php')?:[] as $path){
 $cmd=escapeshellarg(PHP_BINARY).' -l '.escapeshellarg($path).' 2>&1';
 exec($cmd,$output,$exit);
 if($exit!==0)$errors[]=basename($path).' syntax: '.implode("\n",$output);
 $output=[];
}
foreach([$root.'/public/index.php',$root.'/bin/install.php'] as $path){
 $cmd=escapeshellarg(PHP_BINARY).' -l '.escapeshellarg($path).' 2>&1';
 exec($cmd,$output,$exit);
 if($exit!==0)$errors[]=basename($path).' syntax: '.implode("\n",$output);
 $output=[];
}
if(!$errors){
 try {
  $c=require $root.'/config.php';
  if(!is_array($c))throw new RuntimeException('Configuration must be an array');
  foreach(['db_host','db_port','db_name','db_user','db_pass'] as $key){
   if(!array_key_exists($key,$c))throw new RuntimeException("Missing config setting: $key");
  }
  $pdo=new PDO('mysql:host='.$c['db_host'].';port='.(int)$c['db_port'].';dbname='.$c['db_name'].';charset=utf8mb4',
   $c['db_user'],$c['db_pass'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_TIMEOUT=>5]);
  $tables=['schools','branches','users','vendor_users','student_profiles','teacher_allocations','attendance','homework','homework_submissions','exams','exam_results','fee_invoices','fee_payments','audit_logs','login_attempts'];
  $q=$pdo->query('SHOW TABLES');
  $have=array_flip($q->fetchAll(PDO::FETCH_COLUMN));
  foreach($tables as $table)if(!isset($have[$table]))$errors[]="Missing database table: $table";
 }catch(Throwable $e){$errors[]='Database preflight: '.$e->getMessage();}
}
if($errors){fwrite(STDERR,"FAIL:\n- ".implode("\n- ",$errors)."\n");exit(1);}
echo "PASS: file requirements, PHP syntax, extensions and MySQL schema preflight.\n";
echo "NOTE: This is not an end-to-end test or security audit.\n";
