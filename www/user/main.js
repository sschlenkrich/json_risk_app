/*
	Password update logic
*/

function jrpassword(){
	const form=document.getElementById('jrpassword');
	const fd=new FormData(form);
	// remove password field if password unset
	const req=new XMLHttpRequest();

	req.addEventListener('load', function(evt){
		if (req.responseText){
			alert(req.responseText);
		}else{
			alert("Internal application error");
		}
	});

	req.addEventListener('error', function(evt){
		alert("Internal application error.");	
	});

	req.open('POST', '/api/user/password');         
	req.send(fd);

}


/*
	User management logic
*/
var app = angular.module('riskapp', []); 

app.controller('main_ctrl', ['$scope', '$http', function($scope, $http) { // Controller für index.html


    /* definition of scope und worker (worker.js) */
	$scope.accounts=[];
	$scope.account=null;
    $scope.display={
		tab: 'password',
		alert_text: null,
		alert_error: false
	}

	$scope.update=function(){
		$http({
			method: 'GET',
			url: '/api/user/mgmt'
		}).then(function successCallback(response) {
			if (Array.isArray(response.data.res)){
				$scope.account=null;
				$scope.accounts=response.data.res;
			}
		  }, function errorCallback(response) {
			$scope.display.alert_error=true;
			$scope.display.alert_text=(response.data || {msg: "An error occurred."}).msg;
		});
	}

	$scope.edit=function(acc){
		$scope.account={
			sub: acc.sub,
			ema: acc.ema,
			per: acc.per,
			locked: acc.locked,
			create: false
		};
	}

	$scope.lock=function(acc){
		$scope.account={
			sub: acc.sub,
			ema: acc.ema,
			per: acc.per,
			locked: true,
			create: false
		};
		$scope.save();
		$scope.account=null;
	}

	$scope.unlock=function(acc){
		$scope.account={
			sub: acc.sub,
			ema: acc.ema,
			per: acc.per,
			locked: false,
			create: false
		};
		$scope.save();
		$scope.account=null;
	}


	$scope.add=function(){
		$scope.account={
			sub: "",
			ema: "",
			per: "r",
			locked: false,
			create: true
		};
	}

	$scope.cancel=function(){
		$scope.account=null;
	}

	$scope.save=function(){
		$http({
			method: 'POST',
			url: '/api/user/mgmt',
			data: $scope.account
		}).then(function successCallback(response) {
			$scope.display.alert_error=false;
			$scope.display.alert_text=response.data.res;
			$scope.account=null;
			$scope.update();
		  }, function errorCallback(response) {
			$scope.display.alert_error=true;
			$scope.display.alert_text=(response.data || {msg: "An error occurred."}).msg;
		});
	}

	$scope.update();

}]);

