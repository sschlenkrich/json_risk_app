<?PHP

function _compare($a,$b){
    return $b['mtime'] - $a['mtime'];
}

function get_executions($appdir){ //lists executions
	$dirs = scandir($appdir, SCANDIR_SORT_NONE);
    $res=array();
	foreach ($dirs as $dir) {
		if (!preg_match ( '/^[0-9]+$/' , $dir)) continue;
		if (!is_dir($appdir . '/' . $dir)) continue;
        if (!file_exists($appdir . '/' . $dir . '/run.json')) continue;
        if (!file_exists($appdir . '/' . $dir . '/status.json')) continue;
        
        $exec=json_decode(file_get_contents($appdir . '/'  . $dir . '/run.json'), true);
        if (!isset($exec['name'])) continue;

        $status=json_decode(file_get_contents($appdir . '/'  . $dir . '/status.json'), true);
        $mtime=filemtime($appdir . '/' . $dir . '/status.json');
        $exec['id']=$dir;
        $exec['mtime']=$mtime;
        $exec['status']=$status['status'];
        $exec['message']=$status['message'];
        $exec['has_warnings']=$status['has_warnings'];
        $exec['percentage']=$status['percentage'];
        $exec['status_link']='/api/runs/' . $dir . '/status';
        $exec['run_link']='/api/runs/' . $dir . '/run.json';
        $exec['log_link']='/api/runs/' . $dir . '/run.log';
        $res[]=$exec;
	}
    usort($res,'_compare');
    return $res;
}


function serve_all_runs($appdir){ //lists templates and populate status info from latest execution
    $executions=get_executions($appdir);
	$files = scandir($appdir, SCANDIR_SORT_NONE);
    $res=array();
	foreach ($files as $file) {
		if (!preg_match ( '/^[a-zA-Z0-9_-]+\.json$/' , $file)) continue;
		if (is_dir($appdir . '/' . $file)) continue;
        $templ=json_decode(file_get_contents($appdir . '/' . $file), true);
        $name=basename($file,'.json');
        $templ['name']=$name;
        $templ['mtime']=0;
        $templ['status']='not run';
        foreach($executions as $exec){
            if ($exec['name']===$name){
                $templ['status']=$exec['status'];
                $templ['percentage']=$exec['percentage'];
                $templ['mtime']=$exec['mtime'];
                break;
            }
        }
        // add submitted status if run was submitted
        if(file_exists($appdir . '/' . $file . '.submitted')) $templ['status']='submitted';
        $res[]=$templ;
	}
    usort($res,'_compare');
    $res=array('templates' => $res, 'executions' => $executions);
    succeed($res);
}

function serve_additional_info($appdir, $exec, $item){
    if (!preg_match ( '/^[0-9]+$/' , $exec)) fail(400, "Invalid execution id");
    if($item === 'run.log'){
        $log=true;
    }else if($item === 'run.json'){
        $log=false;
    }else{
        fail(404, "Requested item does not exist");
    }
    $filename=$appdir . '/' . $exec . '/' . $item;
    if(!file_exists($filename)) fail(404, "Requested file does not exist.");


    if($log){
        // serve log as plain text
        header('Content-Type: text/plain');
    }else{
        // serve run info as JSON
        header('Content-Type: application/json');
    }

    readfile($filename);
    exit;

}

function notify_agent(){
    // try to notify agent that a run has been submitted. If this fails, the run will be picked up by the agent via regular polling.
    global $jr;
    try{
        $pidfile=$jr->tmpdir. '/agent.pid';
        $pid=file_get_contents($pidfile);
        $pid=intval($pid);
        // send SIGUSR1
        posix_kill($pid, 10);
    }catch(Exception $e){
    }
}

function update_run($appdir, $run_name){
    global $user;
    $name=basename($run_name,'.json');
    $filename=$appdir . '/' . $name . '.json';
    if (!preg_match ( '/^[a-zA-Z0-9_-]+$/' , $name)) fail(400, "Invalid run name.");

    // get posted data
    $run=file_get_contents('php://input');
    $run=json_decode($run,true);
    $execute=false;
    if(isset($run['execute'])){
        $execute=$run['execute'];
    }

    if(true===$execute){
        // if user posts execution, they need to have the permission to
        if(false===strpos($user->per,'x')) fail(401, "user not authorized.");

        // if run is already submitted, do not execute
        if(file_exists($filename . '.submitted')) fail(400, "run $name has already been submitted for execution.");

        // check if run is already running and fail in that case
        $executions=get_executions($appdir);
        foreach($executions as $exec){
            if ($exec['name']===$name && $exec['status']==='running') fail(400, "run $name is already running");
        }
    }

    // get template if already present
    $template=array();
    if(file_exists($filename)){
        $template=file_get_contents($filename);
        $template=json_decode($template, true);
    }

    // update template with posted data if set
    if(isset($run['portfolios'])) $template['portfolios']=$run['portfolios'];
    if(isset($run['params'])) $template['params']=$run['params'];
    if(isset($run['scenario_groups'])) $template['scenario_groups']=$run['scenario_groups'];
    if(isset($run['modules'])) $template['modules']=$run['modules'];
    if(isset($run['valuation_date'])) $template['valuation_date']=$run['valuation_date'];

    // store template and submit execution if posted
    $template=json_encode($template);
    file_put_contents($filename . '.tmp', $template);
    rename($filename . '.tmp', $filename);
    if(true===$execute){
        copy($filename, $filename . '.submitted');
        notify_agent();
    }
    succeed("Run was updated");
}

function delete_run($appdir, $run_name){
    $name=basename($run_name,'.json');
    if (!preg_match ( '/^[a-zA-Z0-9_-]+$/' , $name)) fail(400, "Invalid run name.");

    $filename=$appdir . '/' . $name . '.json';

    if (!file_exists($filename)) fail(400, "Run does not exist");
    unlink($filename);

    $filename=$filename . '.submitted';
    if (file_exists($filename)) unlink($filename);
}


if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'r')) fail(401, "user not authorized.");

$appdir=$jr->datadir . '/' . $user->ins;
if (!is_dir($appdir)) fail(404, "instance does not exist.");
$appdir=$jr->datadir . '/' . $user->ins . '/runs';
if (!is_dir($appdir)){
	if(!mkdir($appdir)) fail(500, "could not create data directory.");
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if(false===strpos($user->per,'w')) fail(401, "user not authorized.");
    // update or execute a run
    if(!$jr->path_array[2]) fail(405, "Method not allowed on this path.");	
    update_run($appdir, $jr->path_array[2]);
}else if($_SERVER['REQUEST_METHOD'] === 'DELETE'){
    if(false===strpos($user->per,'w')) fail(401, "user not authorized.");
    // delete a run
    if(!$jr->path_array[2]) fail(405, "Method not allowed on this path.");	
    delete_run($appdir, $jr->path_array[2]);
}else if($_SERVER['REQUEST_METHOD'] === 'GET'){
	if($jr->path_array[3]) serve_additional_info($appdir, $jr->path_array[2], $jr->path_array[3]);
	serve_all_runs($appdir);
}else{
    fail(405, "Method not allowed.");
}
?>
