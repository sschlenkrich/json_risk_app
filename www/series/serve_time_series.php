<?PHP

/*

Copyright (c) 2018 Dr. Tilman Wolff-Siemssen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

function serve_time_series_names($db){
	//Get relevant time series defs
	$sql="SELECT DISTINCT name FROM ts_def ORDER BY name asc";
	$results = $db->query($sql);
	$ts_names=array();
	while ($row = $results->fetchArray(SQLITE3_ASSOC)) { 
			array_push($ts_names, $row['name']);
	}
	$db->exec('ROLLBACK;');
	unset($db);
	succeed($ts_names);
}


function serve_time_series_definitions($db, $name){
	$where_clause="";	
	if($name){
		if("NAME"==$name || 1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $name)){  //ensure valid name
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid time series name.");
		}	
		$where_clause=" WHERE name='$name' ";
	}
	//Get relevant time series defs
	$sql="SELECT name, tag, desc, meta FROM ts_def
			$where_clause
			ORDER BY name ASC, cast(tag as INTEGER) * case LOWER(SUBSTR(tag, -1)) WHEN 'y' THEN 360 WHEN 'm' THEN 30 WHEN 'w' THEN 7 ELSE 1 END asc, tag ASC
	";

	$ts_defs=array();
	$results = $db->query($sql);
	if(!$results) return $ts_defs;
	$temp=null;
	while ($row = $results->fetchArray(SQLITE3_ASSOC)) { 
		$temp=$row['meta'];
		$temp=json_decode($temp, true);
		if($temp) $row['meta']=$temp;	
		array_push($ts_defs, $row);
	}
	$db->exec('ROLLBACK;');
	unset($db);
	succeed($ts_defs);
}

function get_time_series_dates($db,$fromdate,$todate){
	
	$sql="SELECT DISTINCT dt FROM ts_data
		WHERE dt >= $fromdate
		AND   dt <  $todate
		ORDER BY dt ASC
	";	
	$results = $db->query($sql);
	$ts_dates =array();
	if(!$results) return $ts_dates;

	while ($row = $results->fetchArray(SQLITE3_ASSOC)) { 
		array_push($ts_dates, $row['dt']);
	} 
	return $ts_dates; 
}

function get_time_series_data($db, $ts_name, $fromdate, $todate){
	
	$sql="SELECT tag,
       			 dt,
       			 value
		FROM   ts_data
			   INNER JOIN ts_def
				       ON ts_data.ts_id = ts_def.ts_id
		WHERE  NAME = '$ts_name'
		ORDER  BY dt ASC,
				  Cast(tag AS INTEGER) * CASE Lower(Substr(tag, -1))
				                                           WHEN 'y' THEN 360
				                                           WHEN 'm' THEN 30
				                                           WHEN 'w' THEN 7
				                                           ELSE 1
				                                         END ASC";

	$results = $db->query($sql);
		
	$ts_data =array();
	if(!$results) return $ts_data;

	$dt=null;
	$tag=null;
	while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
		if($row['dt']!=$dt || $row['tag']!= $tag){
			//most recent update
			array_push($ts_data, $row);
			$dt=$row['dt'];
			$tag=$row['tag'];
		} //throw away data if not most recent update
	} 
	return $ts_data;
}

function serve_time_series($db,$ts_name){
	
	header('Content-Type: text/csv');
                
	/* parse request to extract from and to dates. 
	   For dates from and to accepts both unix timestamp and YYYY-mm-dd date formats
	*/ 
			
	$fromdate = null;
	$todate = null;
	$interpolate = null;

	//read GET params

	if(isset($_GET['FROM'])) $fromdate=$_GET['FROM'];
	if(isset($_GET['TO'])) $todate=$_GET['TO'];
	if(isset($_GET['INTERPOLATE'])) $interpolate=$_GET['INTERPOLATE'];

	//also accept lowercase for convenience

	if(isset($_GET['from'])) $fromdate=$_GET['from'];
	if(isset($_GET['to'])) $todate=$_GET['to'];
	if(isset($_GET['interpolate'])) $interpolate=$_GET['interpolate'];
	$interpolate=('true'==strtolower($interpolate));

	if($ts_name==null && isset($_GET['name'])) $ts_name=$_GET['name'];
	if($ts_name==null && isset($_GET['NAME'])) $ts_name=$_GET['NAME'];
	//if no name is set, return array of names
	if($ts_name==null){
		serve_time_series_names();
		exit();
	}
    header('Content-Disposition: attachment; filename=' . $ts_name . '.csv');

	if ($fromdate!= null){
		$fromdate=(strlen((int)$fromdate) == strlen($fromdate))? 
				$fromdate: strtotime($fromdate);
	}
	if ($todate!= null){
		$todate = (strlen((int)$todate) == strlen($todate))? 
				$todate : strtotime($todate.'+1 day');
				/* if todate is timestamp, prepare a sql query that includes the date,
				if it is string, transform to timestamp to time 00:00:00 of the following day,
				and prepare the sql query up to, but excluding, this time*/ 		 
	}


	if($fromdate==null) $fromdate=PHP_INT_MIN;
	if($todate==null) $todate=PHP_INT_MAX;
  					
	$tags = get_tags($db, $ts_name);  // get tags from db
	if (!count($tags)) err_name_not_found(); //exit if no tags of that name were found

	$dates = get_time_series_dates($db, PHP_INT_MIN, PHP_INT_MAX);   // get dates from db
	$results = get_time_series_data($db, $ts_name, PHP_INT_MIN, PHP_INT_MAX);  // get time series data from db
	$results = pivot($results, $tags, $dates); //pivotise results
	$db->exec("ROLLBACK;");
			
	unset($db);  // unset connection to the database

	if($interpolate){
		include 'series/interpolation.php';
	}

	//write out results	
	header('Content-Type: text/csv');
	echo $ts_name.";".implode(";", $tags);
	$ndates=count($dates);
	for ($idate=0;$idate<$ndates;$idate++){
		if ($dates[$idate]<$fromdate) continue;
		if ($dates[$idate]>$todate) continue;
		echo "\r\n" . date('Y-m-d',$dates[$idate]) . ";" . implode(";", $results[$idate]);
	}
	exit();
}

function pivot($input,$tags,$dates) {
	$ntags=count($tags);
	$ndates=count($dates);
	$ninput=count($input);
	$iinput=0;
	if(0==$ndates) return Array();

	//initialise result
	$res=array_fill(0, $ndates, array_fill(0, $ntags, null));
	if(0==$ninput) return $res; //return null data if no data found

	//loop through input
	for ($idate=0;$idate<$ndates;$idate++){
		for($itag=0;$itag<$ntags;$itag++){	
			if($tags[$itag]==$input[$iinput]['tag'] && $dates[$idate]==$input[$iinput]['dt']){
				//record fits tag and date, add it to result and retrieve next row
				$res[$idate][$itag]=$input[$iinput]['value'];
				$iinput++;	
			}
			if ($iinput>=$ninput) break;	
		}
		if ($iinput>=$ninput) break;
	}
	return $res;
}

function get_tags($db,$ts_name) {			
	$where_clause="";	
	if($ts_name){
		if("NAME"==$ts_name || 1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $ts_name)){  //ensure valid name
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid time series name.");
		}	
		$where_clause=" WHERE name='$ts_name' ";
	}
	//Get relevant time series defs
	$sql="SELECT tag FROM ts_def
			$where_clause
			ORDER BY name asc, cast(tag as INTEGER) * case LOWER(SUBSTR(tag, -1)) WHEN 'y' THEN 360 WHEN 'm' THEN 30 WHEN 'w' THEN 7 ELSE 1 END asc, tag asc
	";
	$results = $db->query($sql);
	$tags=array();
	
	while ($row = $results->fetchArray(SQLITE3_ASSOC)) { 
		array_push($tags, $row['tag']);
	}
	return $tags;
}

// simple array to csv conversion, without pivoting, useful for outputting  /def as csv:
function array_to_csv($input) {
	$keystring='';
	foreach($input[0] as $key => $key_value) {
		$keystring .= $key.";";
	}
	$output = substr($keystring,0,-1);
	foreach($input as $row) {
		$valuestring="\r\n";	
		foreach($row as $key => $key_value){
			$valuestring .= $key_value.";";
		}
		$output .= substr($valuestring,0,-1);
	}	
	return $output;							
}

function export($db,$name){
	$where_clause="";	
	if($name){
		if("NAME"==$name || 1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $name)){  //ensure valid name
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid time series name.");
		}	
		$where_clause=" WHERE name='$name' ";
	}

	header('Content-Type: text/csv');
	echo "NAME;TAG;DATE;VALUE;DESC;META";

	//definitions
	$sql="SELECT name,tag,desc,meta
		  FROM 	 ts_def
		  $where_clause
		  ORDER BY
			name asc,
			cast(tag as INTEGER) * case LOWER(SUBSTR(tag, -1)) WHEN 'y' THEN 360 WHEN 'm' THEN 30 WHEN 'w' THEN 7 ELSE 1 END asc
	";

	$results = $db->query($sql);
	if (!$results) exit();

	while ($row = $results->fetchArray(SQLITE3_ASSOC)) {	
		echo "\n" . $row['name'] . ";" . $row['tag'] . ";;;" . $row['desc']. ";" . $row['meta'];
	}
	
	//data
	$sql="SELECT name,tag,dt,value
		  FROM 	 ts_data inner join ts_def on ts_data.ts_id=ts_def.ts_id
		  $where_clause
		  ORDER BY
			name asc,
			dt asc,
			cast(tag as INTEGER) * case LOWER(SUBSTR(tag, -1)) WHEN 'y' THEN 360 WHEN 'm' THEN 30 WHEN 'w' THEN 7 ELSE 1 END asc
	";

	$results = $db->query($sql);

	while ($row = $results->fetchArray(SQLITE3_ASSOC)) {	
		echo "\n" . $row['name'] . ";" . $row['tag'] . ";" . date('Y-m-d',$row['dt']) . ";" . $row['value'] . ";;";
	}
}

//open readonly
$db=new SQLite3($ts_database_file, SQLITE3_OPEN_READONLY);

$db->busyTimeout(3000);

$db->exec('BEGIN;');
if('data'==$jr->path_array[2]) export($db,$jr->path_array[3]);
if('definitions'==$jr->path_array[2]) serve_time_series_definitions($db,$jr->path_array[3]);
if('names'==$jr->path_array[2]) serve_time_series_names($db);
if('table'==$jr->path_array[2]) serve_time_series($db,$jr->path_array[3]);
$db->exec("ROLLBACK;");
unset($db);  // unset connection to the database
exit();

