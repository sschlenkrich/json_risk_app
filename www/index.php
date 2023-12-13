<?php 

#
# change into webroot and include common.php
#

chdir($_SERVER['DOCUMENT_ROOT']);
require 'common.php';
require 'auth.php';

#
# construct jr object containing api path info
#
$jr=(object)[];
$jr->path=trim($_SERVER['PATH_INFO'],'/');
$jr->path_array=explode('/',$jr->path . '/////'); # makes sure at least four path elements exist
$jr->webroot=$_SERVER['DOCUMENT_ROOT'];
$jr->datadir=$_SERVER['JR_DATADIR'];
$jr->tmpdir=$_SERVER['JR_TMPDIR'];

#
# path must begin with /api
#
if ('api' != $jr->path_array[0]) fail(404, "Invalid API endpoint.");

$app=$jr->path_array[1];

#
# if path was /api, serve list of apps
#
if ('' == $app){
	#serve list of apps
	$list=scandir($jr->webroot);
	$result=array();
	foreach ($list as $dir){
		if ('.' == $dir) continue;
		if (!is_dir($dir)) continue;
		if (!file_exists($dir . '/index.php')) continue;
		$result[]=$dir;
	}
	succeed($result);
}

#
# if path was /api/<some app>, include that app's index.php if it exists
#

$app=$jr->webroot . '/' . $app . '/index.php';
if (!file_exists($app)) fail(404, "Invalid API endpoint.");
$jr->path_rel=implode('/',$jr->path_array);
require $app;

