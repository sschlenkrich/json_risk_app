<?PHP

function delete_tempfiles($appdir){ //lists scenarios files in directory
	$files = scandir($appdir);
	foreach ($files as $file) {
		if (!preg_match ( '/^tmp_[a-zA-Z0-9_\-]*\.json$/' , $file)) continue;
		if (fileatime($appdir . $file) < time() - (24 * 60 * 60)) unlink($appdir . $file);
	}

}

function list_scenarios($appdir){ //lists scenario files in directory
	$files = scandir($appdir);
	$res=array();
	foreach ($files as $file) {
		if (!preg_match ( '/^[a-zA-Z0-9_\-]*\.json$/' , $file)) continue;
		if (preg_match ( '/^tmp_[a-zA-Z0-9_\-]*\.json$/' , $file)) continue;
		$res[]=basename($file,'.json');
	}
	rsort($res);
	echo json_encode($res, JSON_PRETTY_PRINT);
}

function serve_scenarios($file_path){ //serve file
	if (file_exists($file_path)){
		readfile($file_path);
		exit;
	}else{
		fail(404, "the requested file does not exist.");
	}
}

function upload_scenarios($appdir){ //upload file

	if (empty($_POST)){
		fail(400, "invalid request, possibly the server upload size limit was violated.");
	}

	$name=null;
	if (isset($_POST['name'])) $name=$_POST['name'];
	if (isset($_POST['NAME'])) $name=$_POST['NAME'];

	$tempstore=false;
	if (isset($_POST['temp'])) $tempstore=("true"==strtolower($_POST['temp']));
	if (isset($_POST['TEMP'])) $tempstore=("true"==strtolower($_POST['TEMP']));

	if($name==null && (!$tempstore)){
		fail(400, "invalid request, must set name.");
	}
	if(!preg_match ( '/^[a-zA-Z0-9_\-]+$/' , $name) && !$tempstore){
		fail(400, "invalid name was provided, must contain only letters, numbers, dashes and underscores."); 	
	}

	if(preg_match ( '/^tmp_[a-zA-Z0-9_\-]+$/' , $name) && !$tempstore){
		fail(400, "invalid name was provided, must not begin with tmp_."); 	
	}

	$upfile=null;
	if (isset($_FILES['file'])) $upfile=$_FILES['file'];
	if (isset($_FILES['FILE'])) $upfile=$_FILES['FILE'];

	if(!$upfile){
		fail(400, "no file was uploaded, must upload file."); 
	}
	if($upfile['error']==UPLOAD_ERR_INI_SIZE){
		fail(413, "the uploaded file was too big, violating server upload size limit."); 
	}
	if(!$upfile['size']){
		fail(400, "no valid file was uploaded, size is zero."); 
	}
	if($upfile['error']!==UPLOAD_ERR_OK){
		fail(500, "an unhandled error occurred uploading the file."); 
	}
	if(null===json_decode(file_get_contents($upfile['tmp_name']))){
		fail(400, "no valid file was uploaded, could not parse json content."); 
	}

	if($tempstore){
		$prefix='tmp_';
		$name=md5_file($upfile['tmp_name']);
	}else{
		$prefix='';
	}
	if(!move_uploaded_file ( $upfile['tmp_name'] , $appdir . '/' . $prefix . $name . '.json')){
		fail(500, "could not store uploaded file, maybe a permission error or no space left on server."); 	
	}
	echo '{"error": "false", "message": "successful", "path": "' . $prefix . $name . '.json"}';
}

header('Content-Type: application/json'); //return result or error message in JSON format

if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'r')) fail(401, "user not authorized.");

$appdir=$jr->datadir . '/' . $user->ins;
if (!is_dir($appdir)) fail(404, "instance does not exist.");
$appdir=$jr->datadir . '/' . $user->ins . '/scenarios';
if (!is_dir($appdir)){
	if(!mkdir($appdir)) fail(500, "could not create data directory.");
}

delete_tempfiles($appdir);
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if(false===strpos($user->per,'w')) fail(401, "user not authorized.");
	upload_scenarios($appdir);
}else{
	if($jr->path_array[2]) serve_scenarios($appdir . '/' . $jr->path_array[2] . '.json');
	list_scenarios($appdir);
}


?>
