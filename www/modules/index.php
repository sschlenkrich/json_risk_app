<?PHP

function list_modules($appdir, $root){
	$res=array();

	// serve list of modules
	$list=scandir($appdir);
	foreach ($list as $file){
		if (is_dir($file)) continue;
		if ('.js' === substr($file,-3)) $result[]=substr($file,0,-3);
	}

	$list=scandir($root . '/../res/modules/');
	foreach ($list as $file){
		if (is_dir($file)) continue;
		if ('.js' === substr($file,-3)) $result[]=substr($file,0,-3);
	}

	$result=array_unique($result);
	sort($result);
	succeed($result);
}

function serve_module($appdir, $root, $module){
	//standard modules are in the res/modules folder
	$path_std=$root . '/../res/modules/' . $module . '.js';
	//user modules are in the res/modules folder
	$path_user=$appdir . '/' . $module . '.js';
	if (file_exists($path_user)){
		// user modules take precedence
		header('Content-Type: text/javascript');
		readfile($path_user);
		exit;
	}elseif (file_exists($path_std)){
		// send standard module if no user module exists
		header('Content-Type: text/javascript');
		readfile($path_std);
		exit;
	}else{
		fail(404, "the requested module does not exist.");
	}
}

if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'r')) fail(401, "user not authorized.");

$appdir=$jr->datadir . '/' . $user->ins;
if (!is_dir($appdir)) fail(404, "instance does not exist.");
$appdir=$jr->datadir . '/' . $user->ins . '/modules';
if (!is_dir($appdir)){
	if(!mkdir($appdir)) fail(500, "could not create data directory.");
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	if($jr->path_array[2]) serve_module($appdir, $jr->webroot, $jr->path_array[2]);
	list_modules($appdir, $jr->webroot);
}else{
	fail(405, "Method not allowed.");
}

?>
