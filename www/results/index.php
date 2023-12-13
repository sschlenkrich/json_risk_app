<?PHP

function list_dates($appdir){ //lists params files in directory
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

function list_results_for_date($appdir, $datum){ //lists params files in directory
	if (!is_dir($appdir . '/' . $datum)) return array();

	$dirs = scandir($appdir . '/' . $datum);
	$res=array();
	foreach ($dirs as $dir) {
		if (!is_dir($appdir . '/' . $datum . '/' . $dir)) continue;
		if (!preg_match ( '/^[a-zA-Z0-9\-_]+$/' , $dir)) continue;
		$res[]=array(
			'name' => $dir,
			'date' => $datum
		);
	}
	return $res;
}

function list_results($appdir, $datum){ //lists files in directory
	if(preg_match( '/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/' ,$datum)){
		// date specified explicitly
		$res=list_results_for_date($appdir, $datum);
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
			$res=array_merge(list_results_for_date($appdir,$datum),$res);
		}
		succeed($res);
	}
	fail(404, "Invalid date specified");
}


function serve_results($path, $spec){ //serve file
	include 'results/aggregate.php';
	$results=jr_aggregate($path,$spec,0,1);
    $meta=json_decode(file_get_contents($path . '/meta.json'),false);
	succeed( ['meta'=>$meta, 'results'=>$results] );
	exit();
}



if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'r')) fail(401, "user not authorized.");

$appdir=$jr->datadir . '/' . $user->ins;
if (!is_dir($appdir)) fail(404, "instance does not exist.");
$appdir .= '/results';
if (!is_dir($appdir)){
	if(!mkdir($appdir)) fail(500, "could not create data directory.");
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	if($jr->path_array[3]){
		# serve results file
		serve_results($appdir . '/' . $jr->path_array[2]. '/' . $jr->path_array[3], null);
	}else{
		# serve results context list
		list_results($appdir, $jr->path_array[2]);
	}
}else if ($_SERVER['REQUEST_METHOD'] === 'POST'){
	if($jr->path_array[3]){
		# serve results based on json input report specification
		$spec=file_get_contents('php://input');
		$spec=json_decode($spec);
		serve_results($appdir . '/' . $jr->path_array[2]. '/' . $jr->path_array[3], $spec);
	}else{
		fail(405, "Method not allowed");
	}
}else{
	fail(405, "Method not allowed");
}


#?>
