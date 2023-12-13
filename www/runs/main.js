var app = angular.module('riskapp', []); 

app.controller('main_ctrl', ['$scope', '$http', '$interval', function($scope, $http, $interval) { // Controller für index.html
	
    $scope.runs={
        templates: [],
        executions: []
    }

    $scope.display={
		history: false
	};

	$scope.editor={
		json: null
	};
        
    $scope.edit=function(item){  
            $scope.editor.json=JSON.stringify(item, repl, 1);
            window.scrollTo(0, 0); 
    };

    $scope.create=function(){  
		let item={
            name: "NEW_RUN",
            portfolios:[],
            params:[],
            scenario_groups:[],
            modules:[],
            valuation_date: null
        };
		$scope.editor.json=JSON.stringify(item, repl, 1);
        window.scrollTo(0, 0);
    };


    $scope.cancel_editor=function(){
            $scope.editor={
				json: null
			};
    };

    $scope.save=function(){
            if ($scope.editor.json){
                    var item=JSON.parse($scope.editor.json);
                    delete item.execute;
					$scope.send(item);
					$scope.cancel_editor();
            }
    };

    $scope.execute=function(item){
        let temp=Object.assign({}, item);
        temp.execute=true;
        $scope.send(temp);
    };


    $scope.$watch('editor.json', function(){

            $scope.editor.valid=false;
            $scope.editor.msg="";
            try{
                    JSON.parse($scope.editor.json); //test if JSON is valid
            }catch(e){
                    $scope.editor.msg=e.message;
                    return 0;
            }
            $scope.editor.valid=true;
    }, true);

    const error_callback=function(response){
            let msg=response?.data?.msg;
			alert(`Request failed: ${msg}`);
    }

   	$scope.update=function(){
		$http({
			method: 'GET',
			url: '/api/runs'
		}).then(function success_callback(response) {
			$scope.runs=response.data.res;
		  }, error_callback);
	};


   	$scope.send=function(item){
        let name=item.name;
		$http({
			method: 'POST',
			url: '/api/runs/' + name,
            data: item
		}).then(function success_callback(response) {
			$scope.update();
		  }, error_callback);
	};

   	$scope.remove=function(item){
        let name=item.name;
		$http({
			method: 'DELETE',
			url: '/api/runs/' + name
		}).then(function success_callback(response) {
			$scope.update();
		  }, error_callback);
	};

	function repl(key,value){
        if (key==='mtime') return undefined;
        if (key==='status') return undefined;
        if (key==='percentage') return undefined;
        if (key==='execute') return undefined;
		if (key==='$$hashKey') return undefined; // exclude angularJS internal variable
		return value;
	}

    $scope.update();

    $interval($scope.update, 30*1000);
}]);

