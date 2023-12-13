<?PHP

/*
GET /api/series/definitions -> export all definitions
GET /api/series/names -> get all time series names
GET /api/series/data -> export all
GET /api/series/data/NAME -> export data for single name
GET /api/series/table/NAME -> export data for single name pivotised
POST /api/series/data -> upload pivotised or non-pivotised data
DELETE /api/series/data/NAME -> delete name
DELETE /api/series/data/NAME/TAG -> delete tag

*/
if(!$user) fail(401, "user not authenticated.");
if(!$user->ins) fail(401, "user not authorized.");
if(!$user->per) fail(401, "user not authorized.");
if(false===strpos($user->per,'r')) fail(401, "user not authorized.");

$appdir=$jr->datadir . '/' . $user->ins;
if (!is_dir($appdir)) fail(404, "instance does not exist.");
$appdir=$jr->datadir . '/' . $user->ins . '/series';
if (!is_dir($appdir)){
	if(!mkdir($appdir)) fail(500, "could not create data directory.");
}

$ts_database_file=$appdir . '/db.sqlite';

//create database and table if not existing
$db=new SQLite3($ts_database_file);
$db->busyTimeout(3000);

$db->exec('BEGIN;');

$sql="CREATE TABLE IF NOT EXISTS ts_data(
	ts_id INTEGER NOT NULL,
	dt INTEGER NOT NULL,
	value REAL NOT NULL,
	PRIMARY KEY (ts_id, dt))";

$db->exec($sql);

$sql="CREATE TABLE IF NOT EXISTS ts_def(
	ts_id INTEGER NOT NULL PRIMARY KEY,
	name TEXT NOT NULL,
	tag TEXT,
	meta TEXT,
	desc TEXT,
	CONSTRAINT unique_series_def UNIQUE (name, tag))";

$db->exec($sql);
$db->exec('COMMIT;');
unset($db);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if(false===strpos($user->per,'w')) fail(401, "user not authorized.");
	if('data' != $jr->path_array[2]) fail(404, "invalid api endpoint.");
	include "series/update_time_series.php";
}else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
	if(false===strpos($user->per,'w')) fail(401, "user not authorized.");
	if('data' != $jr->path_array[2]) fail(404, "invalid api endpoint.");
	include "series/delete_time_series.php";
}else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
	include "series/serve_time_series.php";
}else{
	fail(405, "Method not allowed");
}


