<?php

function list_users($appdir){ //lists params files in directory
	global $user;	
	$files = scandir($appdir);
	$res=array();
	foreach ($files as $file) {
		$temp=null;
		if (!preg_match ( '/^([a-zA-Z0-9_\-@.]+)\.json$/' , $file, $temp)) continue;
		$temp=read_user_file($user->ins,$temp[1]);
		unset($temp->has);
		$res[]=$temp;
	}
	succeed($res);
}

function update_user(){
	global $user;	
	$json = file_get_contents('php://input');
	$obj=json_decode($json);

	$sub=jr_get_prop($obj,"sub");
	$ema=jr_get_prop($obj,"ema");
	$per=jr_get_prop($obj,"per");
	$locked=(bool)jr_get_prop($obj,"locked");

	// ensure valid user name is submit
	if (null == $sub) fail(400, "Must provide user name" . $json);
	if (!preg_match ( '/^[a-zA-Z0-9_\-@.]+$/' , $sub)) fail(400, "User name is not valid, must contain only letters, numbers and .-_@ chars.");

	// ensure valid email
	if (!filter_var($ema, FILTER_VALIDATE_EMAIL)) fail(400, "Invalid E-Mail address submitted.");

	// ensure valid permissions
	if (!preg_match ( '/^[rwxuc]*$/' , $per)) fail(400, "Invalid permissions, must contain only rwxuc chars.");

	// create new user or update?
	if (user_exists($user->ins,$sub)){
		$original_user=read_user_file($user->ins,$sub);
		$msg='User was updated.';
	}else{
		$original_user=(object)['sub' => $sub];
		$msg='User was created.';
	}

	$original_user->ema=$ema;
	$original_user->per=$per;
	$original_user->locked=$locked;
	$original_user->ins=$user->ins; // ensure same instance as the user currently locked in

	store_user_file($original_user);
	succeed($msg);
}


//
// main program
//

header('Content-Type: application/json'); //return result or error message in JSON format

if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'u')) fail(401, "user not authorized for user management.");

$appdir=$jr->datadir . '/' . $user->ins . '/user';
if (!is_dir($appdir)) fail(404, "instance does not exist or contains no users.");


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	update_user();
}else{
	list_users($appdir);
}









