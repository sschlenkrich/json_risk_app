<?php 
function fail($status, $msg){
	http_response_code($status);
	#$msg=htmlentities($msg);
	header('Content-type: application/json');
	echo json_encode([ 'success' => 'false', 'msg' => $msg ]);
	exit();
}

function succeed($obj){
	http_response_code(200);
	header('Content-type: application/json');
	echo json_encode([ 'success' => 'true', 'res' => $obj ]);
	exit();
}

function jr_get_prop($obj, $field){
	if (is_array($obj)) $obj=(object) $obj;
	if (!isset($obj->$field)) return null;
	return $obj->$field;
}

?>
