<?php


function invalid_token(){
	setcookie(
		'access_token',
		'deleted',
		1,  	# expires in the past, deletes cookie
		'/', 	# path
		'', 	# domain    
		false, 	# secure
		true	# httponly
	);
	fail(401, "Invalid authorization token.");
}

function base64url_encode($str){
	// Encode to Base64 String
	$res = base64_encode($str);

	// Encode to Base64URL String
	$res = strtr($res, '+/', '-_');
	$res = rtrim($res, '=');
	return $res;
}


function base64url_decode($str){
	//convert from Base64URL
	$res = strtr($str, '-_', '+/') . '=';

	//decode string
	$res = base64_decode($res);
	return $res;
}

function tokenize($payload){
	// encode static header
	$header = ['alg'=>'HS256', 'typ'=>'JWT'];
	$header = json_encode($header);
	$header = base64url_encode($header);

	// encode payload
	$token = json_encode($payload);	
	$token = base64url_encode($token);
	$token = $header . '.' . $token;

	// add signature Hash
	$signature = hash_hmac('sha256', $token, $_SERVER['JR_SECRET'], true);

	// encode signature
	$signature = base64url_encode($signature);

	// create signed token
	$token = $token . '.' . $signature;
	return $token;
}

function detokenize($token){
	$temp = explode('.', $token);
	if (count($temp) !== 3) return null;
	$header = $temp[0];
	$payload = $temp[1];
	$signature = $temp[2];

	//decode signature
	$signature = base64url_decode($signature);
	
	//verify signature or fail
	if (!hash_equals(hash_hmac('sha256', $header . '.' . $payload, $_SERVER['JR_SECRET'], true), $signature)) return null;

	//decode payload
	$payload = base64_decode($payload);
	$payload = json_decode($payload, false);

	if (!isset($payload->exp)) return null;
	if (!is_numeric($payload->exp)) return null;


	$now=new DateTimeImmutable();
	$now=$now->getTimestamp();
	if ($payload->exp < $now) return null;

	return $payload;
}

#
# if user is not authenticated at all, user object without any rights
#
$nobody = (object) ['sub'=>'nobody', 'name'=>'Anonymous User', 'ins' => 'public', 'per'=>'r'];
$user=$nobody;

#
# use token if present
#
$temp = null;

# API calls from scripts user HTTP_AUTHORIZATION header
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
	$temp = trim($_SERVER['HTTP_AUTHORIZATION']);
}

if (null!=$temp) {
	if (preg_match('/Bearer\s(\S+)/', $temp, $matches)) {
		$temp = detokenize($matches[1]);
		if (null == $temp) invalid_token();
		$temp->has = null; # do not expose hash to other scripts 
		$user=$temp;
	}
}

# API calls from browser use cookie
if(null==$temp && isset($_COOKIE['access_token'])){
	$temp = trim($_COOKIE['access_token']);
	$temp = detokenize($temp);
	if (null == $temp) invalid_token();
	$temp->has = null; # do not expose hash to other scripts 
	$user=$temp;
}

?>
