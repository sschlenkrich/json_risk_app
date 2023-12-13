<?PHP

function list_dates($appdir){ //lists date subdirs in portfolio directory
	// loop through all dates
	$files = scandir($appdir);
	$res=array();
	foreach ($files as $file) {
		if (!preg_match ( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/' , $file)) continue;
		if (!is_dir($appdir .'/' . $file)) continue;
		$res[]=$file;
	}
	return $res;
}

function list_portfolios_for_date($appdir, $datum){ //lists portfolio files in date directory
	if (!is_dir($appdir . '/' . $datum)) return array();

	$files = scandir($appdir . '/' . $datum);
	$res=array();
	foreach ($files as $file) {
		if (preg_match ( '/[a-zA-Z0-9\-_]+.csv.gz/' , $file)){
			$res[]=array(
				'name' => basename($file,'.csv.gz'),
				'date' => $datum
			);
		}
		if (preg_match ( '/[a-zA-Z0-9\-_]+.json.gz/' , $file)){
			$res[]=array(
				'name' => basename($file,'.json.gz'),
				'date' => $datum
			);
		}
	}
	return $res;
}

function list_portfolios($appdir, $datum){ //lists dates, portfolio files for a specific date, or for all dates
	if(preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/' ,$datum)){
		// date specified explicitliy
		$res=list_portfolios_for_date($appdir, $datum);
		succeed($res);
	}
	$dates=list_dates($appdir);
	if(''==$datum){
		// no date specified, list dates
		
		succeed($dates);
	}
	if('all'==$datum){
		//list all portfolios
		$res=array();
		foreach ($dates as $datum) {
			$res=array_merge(list_portfolios_for_date($appdir,$datum),$res);
		}
		succeed($res);
	}
	fail(404, "Invalid date specified");
}


function serve_portfolio($file_path){ //serve file
	if (is_readable($file_path . '.json.gz')){
		header('Content-Type: application/json;charset=utf-8');
		$file_path_ext=$file_path . '.json.gz';
	}else if (is_readable($file_path . '.csv.gz')){
		header('Content-Type: text/csv;charset=utf-8');
		$file_path_ext=$file_path . '.csv.gz';
	}else{
		fail(404, "The requested file does not exist or is not readable.");
	}
	if(strpos($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '', 'gzip') !== false){
		header('Content-Encoding: gzip');
		readfile($file_path_ext);	
	}else{
		readgzfile($file_path_ext);
	}
	exit();
}

function store_portfolio($appdir,$datum,$name){
	// check validity	
	if (!preg_match ( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/' , $datum)){
		fail(400, "invalid date format, must be yyyy-mm-dd.");
	}
	if (!preg_match ( '/^[a-zA-Z0-9\-_]+$/' , $name)){
		fail(400, "invalid portfolio name, must contain only letters, numbers, hyphens and underscores.");
	}

	// make directory
	$path=$appdir . '/' . $datum;
	if(!is_dir($path)){
		if(!mkdir($path)) fail(500, "could not create data directory.");
	}
	
	// create tempfile and store data
	if (!$tempfile=tempnam($path, $name)) fail(500, "could not create temp file.");
	if (!file_put_contents($tempfile, file_get_contents('php://input'))) fail(500, "could not save portfolio to temp file.");

	// move tempfile atomically
	if (!rename($tempfile, $path . '/' . $name . '.json.gz')) fail(500, "could not store portfolio on server.");
	succeed("Portfolio was stored successfully.");
}

if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'r')) fail(401, "user not authorized.");

$appdir=$jr->datadir . '/' . $user->ins;
if (!is_dir($appdir)) fail(404, "instance does not exist.");
$appdir .= '/portfolio';
if (!is_dir($appdir)){
	if(!mkdir($appdir)) fail(500, "could not create data directory.");
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	if($jr->path_array[3]){
		# serve portfolio file
		serve_portfolio($appdir . '/' . $jr->path_array[2]. '/' . $jr->path_array[3]);
	}else{
		# serve portfolio list
		list_portfolios($appdir, $jr->path_array[2]);
	}
}else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if($jr->path_array[3]){
		# store portfolio on server if permissions are correct
		if(false===strpos($user->per,'w')) fail(401, "user not authorized.");
		store_portfolio($appdir, $jr->path_array[2],$jr->path_array[3]);
	}else{
		fail(405, "Method not allowed on this path");
	}
}else{
	fail(405, "Method not allowed");
}
delete_tempfiles($appdir);

#?>
