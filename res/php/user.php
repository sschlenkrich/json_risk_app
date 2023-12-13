<?php
$instance=$argv[1];
$username=$argv[2];
$password=$argv[3];

$hash=password_hash($password, PASSWORD_DEFAULT);

$obj=[	'ins' => $instance, # instance name
	'sub' => $username, # user name
	'has' => $hash,	    # password hash
	'per' => 'u'	    # permission to manage users
];
$json=json_encode($obj);
echo $json;
?>
