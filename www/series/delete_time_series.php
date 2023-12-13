<?PHP

/*
Copyright (c) 2018 Dr. Tilman Wolff-Siemssen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function delete_name($db,$name,$tag){
	if("NAME"==$name || 1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $name)){  //ensure valid name
		//throw error, rollback and and exit
		$db->exec('ROLLBACK;');
		fail(400,"Invalid time series name.");
	}

	$where_clause=" WHERE name='$name' ";

	if(''!=$tag && 1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $tag)){  //ensure valid tag
		//throw error, rollback and and exit
		$db->exec('ROLLBACK;');
		fail(400,"Invalid time series tag.");
	}

	if (''!=$tag) $where_clause.=" AND tag='$tag' ";
	
	$sql="DELETE FROM ts_data WHERE ts_id IN (SELECT ts_id FROM ts_def $where_clause)";
	$db->exec($sql);

	$sql="DELETE FROM ts_def $where_clause";
	$db->exec($sql);
}

//Update time series data

//create database and table if not existing
$db=new SQLite3($ts_database_file);
$db->busyTimeout(3000);

$db->exec('BEGIN;');

$num_success=delete_name($db,$jr->path_array[3],$jr->path_array[4]);

$db->exec('COMMIT;');
unset($db);
succeed([ 'num_success' => $num_success ]);
