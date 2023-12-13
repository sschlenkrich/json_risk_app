var app = angular.module('series', []); 

app.controller('main_ctrl', [ '$scope', '$http', function($scope, $http) {
  
    // bindings
    $scope.query={
        available: [],
        name: '',
        from: '',
        to: '',
        interpolate: 'true'
    }

    $scope.display = {
		tab : 'overview',
        ts_def : null,
        ts_data : null,
        is_loading : 0,
        alert_text : null,
        alert_error : false,
		del: null
    }

    // show and download 
    $scope.showData = function(){
        return $scope.getTimeSeries();      
    }

    $scope.refresh = function() {
		$scope.display.ts_data=null;
		$scope.display.alert_text=null;
		$scope.display.alert_error=false;
		$scope.display.del=null;
		$scope.display.is_loading=0;

        $scope.getTimeSeriesDefinitions();
	    $scope.getAvailableTimeSeries();
    }


    $scope.getAvailableTimeSeries = function() {
		$scope.display.is_loading++;        
		$http(
            {
                method: 'GET',
                url: '/api/series/names',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        ).then(function (response, data, headers, status, config) {
            $scope.query.available = response.data.res; 
			$scope.display.is_loading--;           
        }).catch(function(response) {
            // show error in the alert bar
            $scope.display.alert_error = true;
            $scope.display.alert_text = "Error: Unable to download time series names. Return code: " + response.status;
			$scope.display.is_loading--;
        });   
    }
    
    $scope.getTimeSeriesDefinitions = function() {
		$scope.display.is_loading++;
        $http(
            {
                method: 'GET',
                url: '/api/series/definitions',
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        ).then(function (response, data, headers, status, config) {
            $scope.display.ts_def = response.data.res;
			$scope.display.is_loading--;   
            
        }).catch(function(response) {
            $scope.display.is_loading = false;
            // show error in the alert bar
            $scope.display.alert_error = true;
            $scope.display.alert_text = "Error: Unable to download time series definitions. Return code: " + response.status;
			$scope.display.is_loading--;
        });   
    }

    $scope.getTimeSeries = function() {
		$scope.display.is_loading++;
        let query=$scope.query;        
        if (!query.name) return;
        let url = '/api/series/table/' + query.name + '?FORMAT=CSV';

        if(query.from) url += '&FROM=' + query.from;
        if(query.to) url += '&TO=' + query.to;
        if(query.asof) url += '&ASOF=' + query.asof;
		if(query.interpolate) url += '&INTERPOLATE=' + query.interpolate;
        $http(
            {
                method: 'GET',
                url: url,
                headers: {
                    'Content-Type': 'text/csv',
                }
            }
        ).then(function (response, data, headers, status, config) {
            
            $scope.display.is_loading--;
            $scope.display.ts_data = Papa.parse(response.data).data;

        }).catch(function(response) {
            $scope.display.is_loading--;
           
            // show error in the alert bar
            $scope.display.alert_error = true;
            $scope.display.alert_text = "Error: Unable to download time series data. Return code: " + response.status;     
        });        
    }

    $scope.sendData = function() {
		$scope.display.is_loading++;
        var form=document.getElementById('form_data');
        var fd = new FormData(form);
        $http(
            {
                method: 'POST',
                url: '/api/series/data',
				headers: {'Content-Type': undefined},
                data: fd,
            }
        ).then(function (response, data, headers, status, config) {
			$scope.display.is_loading--; 
            if(response.status === 200) {               
                var result = response.data;
                if (result.success){
                    $scope.display.alert_error =  false;
                    $scope.display.alert_text = "Data upload was successful. " + result.res.num_success + " records updated.";
					$scope.getAvailableTimeSeries();
					$scope.getTimeSeriesDefinitions();             
                }else{  
                    $scope.display.alert_error = true;
                    if(result.num_invalid>0){
                        $scope.display.alert_text = "Error: all " + result.num_failure + " records were invalid.";	
                    }else{
                        $scope.display.alert_text = result.error_message || "Error: an error occurred, but the error message could not be retrieved.";
                    }
    
                } 
            }  else {
                $scope.display.alert_error = true;
                $scope.display.alert_text = "Error: an unexpected error occurred.";
            }
        }).catch(function(response) {
			$scope.display.is_loading--; 
            if(response.status === 401) {          
                $scope.display.alert_error = true;
                $scope.display.alert_text = "Error: upload not authorized.";    
            } else if (response.status === 400) {
				result=response.data;
                $scope.display.alert_error = true;			
                $scope.display.alert_text = result.msg || "Error: an error occurred, but the error message could not be retrieved.";
            }else {
                	
                $scope.display.alert_error = true;
                $scope.display.alert_text = "Could not send data to server. Error " + response.status;
            }
            
        }); 

    }

    $scope.deleteTimeSeries = function() {
		let url='/api/series/data/';
		url += $scope.display.del.name;
		if ($scope.display.del.tag) url+= '/' + $scope.display.del.tag;
		$scope.display.is_loading++;
		$scope.display.del=null;
		$http(
            {
                method: 'DELETE',
                url: url
            }
        ).then(function (response, data, headers, status, config) {
			$scope.display.is_loading--; 
    		$scope.getAvailableTimeSeries();
			$scope.getTimeSeriesDefinitions();            
        }).catch(function(response) {
            // show error in the alert bar
			$scope.display.is_loading--;
            $scope.display.alert_error = true;
            $scope.display.alert_text = "Error: Unable to delete time series data. Return code: " + response.status;
        });   
    }

    $scope.refresh();

}]);


