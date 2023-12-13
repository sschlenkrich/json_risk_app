<?PHP

/*
Copyright (c) 2023 Dr. Tilman Wolff-Siemssen

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


function retrieve_number($str){
	$in=$str;
	if (1==substr_count($in,',') && 0==substr_count($in,'.')) $in=str_replace(',','.',$in);
	if(is_numeric($in)) return floatval($in);
	return null;
}


function update_raw($db,$header,$lines){
	/*
	Supplied data has the structure
	NAME;TAG;DATE;VALUE
	EXAMPLE;1D;2020-01-01;0.0001
	EXAMPLE;2D;2020-01-01;0.0002
	EXAMPLE2;1D;2020-01-01;0.0003
	EXAMPLE2;2D;2020-01-01;0.0004

	optionally, include desc and/or meta:
	NAME;TAG;DATE;VALUE;DESC;META
	EXAMPLE;1D;2020-01-01;0.0001;Example Description;{"example meta": true}
	EXAMPLE;2D;2020-01-01;0.0002;Example Description;{"example meta": true}

	Here, order of columns is irrelevant and automatically detected. However, NAME must be in the first column.
	
	*/

	$col_name=0; // NAME is always in the first column
	$col_tag=array_search('TAG',$header);
	$col_dt=array_search('DATE',$header);
	$col_value=array_search('VALUE',$header);
	$col_desc=array_search('DESC',$header);
	$col_meta=array_search('META',$header);

	if(false===$col_name || false===$col_tag){
		$db->exec('ROLLBACK;');
		fail(400,"Invalid csv header supplied. Must contain at least NAME and TAG.");
	}

	$name=null;
	$tag=null;
	$dt=null;
	$value=null;
	$meta=null;
	$desc=null;
	$linenum=0;
	$success=0;

	$defs_statement=$db->prepare("REPLACE INTO ts_def(ts_id,name,tag,meta,desc) VALUES(
									(SELECT ts_id FROM ts_def WHERE name=:name AND tag=:tag),
									:name,
									:tag,
									IFNULL(:meta,(SELECT meta FROM ts_def WHERE name=:name AND tag=:tag)),
									IFNULL(:desc,(SELECT desc FROM ts_def WHERE name=:name AND tag=:tag))
	)");
	$defs_statement->bindParam(':name', $name);
	$defs_statement->bindParam(':tag', $tag);
	$defs_statement->bindParam(':meta', $meta);
	$defs_statement->bindParam(':desc', $desc);


	$values_statement=$db->prepare("REPLACE INTO ts_data(ts_id, dt, value) VALUES(
									  (select ts_id from ts_def where name=:name and tag=:tag),
									  strftime('%s',:dt),
									  :value
	)");
	$values_statement->bindParam(':name', $name);
	$values_statement->bindParam(':tag', $tag);
	$values_statement->bindParam(':dt', $dt);
	$values_statement->bindParam(':value', $value);


	foreach($lines as $line) {
		$linenum++;

		if (''==$line) continue;
		$line=explode(";",trim($line));
		if(sizeof($line)!=sizeof($header)){  //ensure csv structure is valid
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid data in csv, line length does not match header (line $linenum).");
		}

		//get values from csv line
		$name=(false===$col_name) ? '' : $line[$col_name];    //empty string will fail validation
		$tag=(false===$col_tag) ? '' : $line[$col_tag];       //empty string will fail validation
		$dt=(false===$col_dt) ? '' : $line[$col_dt];          //empty string will be skipped
		$value=(false===$col_value) ? '' : $line[$col_value]; //empty string will be skipped
		$meta=(false===$col_meta) ? null : $line[$col_meta];  //null will not trigger an update
		$desc=(false===$col_desc) ? null : $line[$col_desc];  //null will not trigger an update
		if(''===$meta) $meta=null; //null will not trigger an update but empty string would
		if(''===$desc) $desc=null; //null will not trigger an update but empty string would	

		if("NAME"==$name || 1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $name)){  //ensure valid name
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid time series name (line $linenum).");
		}

		if(1!=preg_match('/^[a-zA-Z0-9+-_]+$/', $tag)){  //ensure valid tag
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid time series tag (line $linenum).");
		}

		//update defs
		if(!$defs_statement->execute()){
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid data in csv (line $linenum).");
		}

		//update values if any
		if(''===$dt) continue;
		if(''===$value) continue;

		if (strtotime($dt)==false){ //ensure date string is valid
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid date string in csv (line $linenum).");
		}

		$value=retrieve_number($value);
		if ($value===null){ //ensure value is valid
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Value in csv does not convert to a valid number (line $linenum).");
		}

		if($values_statement->execute()){
			$success++;
		}else{
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid data in csv or invalid time series name (line $linenum).");
		}
	}
	return $success;
}


function update_pivotised($db,$header,$lines){
	/*
	Supplied data has the structure
	EXAMPLE;1D;2D;1Y;2Y
	2020-01-01;0.0001;0.0002;0.0003;0.0004
	2020-01-02;0.0002;0.0001;0.0002;0.0003
	2020-01-03;0.0003;0.0000;0.0001;0.0002
	2020-01-04;0.0004;0.0004;0.0000;0.0001
	*/
	$ts_name=$header[0];

	$tag=null;
	$dt=null;
	$value=null;
	$success=0;

	$sql="REPLACE INTO ts_data(ts_id, dt, value) VALUES((select ts_id from ts_def where name=:name and tag=:tag),strftime('%s',:dt),:value)";
	$statement=$db->prepare($sql);
	$statement->bindParam(':name', $ts_name);
	$statement->bindParam(':tag', $tag);
	$statement->bindParam(':dt', $dt);
	$statement->bindParam(':value', $value);

	foreach($lines as $line) {
		if (''==$line) continue;
		$line=explode(";",trim($line));
		if(sizeof($line)!=sizeof($header)){  //ensure csv structure is valid
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid data in csv, line length does not match header.");
		}
		$dt=$line[0];
		if (strtotime($dt)==false){ //ensure date string is valid
			//throw error, rollback and and exit
			$db->exec('ROLLBACK;');
			fail(400,"Invalid date string in csv.");
		}
		
		for($i=1; $i<sizeof($header); $i++){ //handle all tags
			$value=retrieve_number($line[$i]);
			if ($value===null) continue;
			$tag=$header[$i];
			if($statement->execute()){
				$success++;
			}else{
				//throw error, rollback and and exit
				$db->exec('ROLLBACK;');
				fail(400,"Invalid data in csv or invalid time series name." . implode(";",$line));
			}
		}
	}
	return $success;
}


//Update time series data
//get uploaded content
$upfile=null;
if (isset($_FILES['file'])) $upfile=$_FILES['file'];
if (isset($_FILES['FILE'])) $upfile=$_FILES['FILE'];

if($upfile && $upfile['size']){
	//file has positive size, get its contents as array
	$lines=file($upfile['tmp_name']);
}else{
	//throw error and exit
	fail(400,"No file uploaded");
}

$header=array_shift($lines);
$header=explode(";",trim($header));

//todo: validate header, must contain all valid fields

$db=new SQLite3($ts_database_file);
$db->busyTimeout(3000);

$db->exec('BEGIN;');


if('NAME'==$header[0]){
	$num_success=update_raw($db,$header,$lines);
}else{
	$num_success=update_pivotised($db,$header,$lines);
}

$db->exec('COMMIT;');
unset($db);
succeed([ 'num_success' => $num_success ]);
