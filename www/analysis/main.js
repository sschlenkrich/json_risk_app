var app = angular.module('riskapp', []);

app.controller('main_ctrl', ['$scope', function($scope) { // Controller für index.html


    /* definition of scope und worker (worker.js) */
    $scope.params = {
        available: null,
        selection: null,
		loaded: null
    };
    $scope.scenarios = {
        available: null,
        selection: null,
		loaded: []
    };
    
    $scope.res = null;
    $scope.errors = [];
    $scope.warnings = [];
	
	$scope.clear_errors=function(){
		$scope.errors=[];
	}

	$scope.clear_warnings=function(){
		$scope.warnings=[];
	}

	$scope.clear_messages=function(){
		$scope.errors=[];
		$scope.warnings=[];
	}

	$scope.instrument={
		type: 'bond',
		maturity: '2040-01-01',
		notional: 100,
		tenor: 12,
		fixed_rate: 0.0015
	};

	if(window.location.search){
		try{
			let tmp=window.location.search.substring(1);
			tmp=decodeURIComponent(tmp);
			$scope.instrument=JSON.parse(tmp);
		}catch{
		}
	}

    function repl(key, value) {
        if (key === '$$hashKey') return undefined; //exclude angularJS internal variable
        return value;
    }


	$scope.editor = {
		json: JSON.stringify($scope.instrument,repl,2),
	};

	$scope.edit_json = function(){
		// restore json from instrument object
		$scope.editor.json=JSON.stringify($scope.instrument,repl,2);
	}

	$scope.edit_fields = function(){
		// remove json text, activates fields editor
		$scope.editor.json='';
	}

	$scope.fields=[
		"bdc",
		"calendar",
		"call_tenor",
		"cap_rate",
		"conditions_valid_until",
		"currency",
		"current_accrued_interest",
		"dcc",
		"disc_curve",
		"effective_date",
		"excl_margin",
		"first_date",
		"first_exercise_date",
		"fixed_rate",
		"fixing_first_date",
		"fixing_next_to_last_date",
		"fixing_stub_end",
		"fixing_stub_long",
		"fixing_tenor",
		"float_bdc",
		"float_current_rate",
		"float_dcc",
		"float_spread",
		"float_tenor",
		"floor_rate",
		"fwd_curve",
		"id",
		"interest_capitalization",
		"is_payer",
		"is_short",
		"linear_amortization",
		"market_value",
		"maturity",
		"next_to_last_date",
		"notional",
		"opportunity_spread",
		"quantity",
		"repay_amount",
		"repay_first_date",
		"repay_next_to_last_date",
		"repay_stub_end",
		"repay_stub_long",
		"repay_tenor",
		"residual_spread",
		"settlement_days",
		"simple_calibration",
		"spread_curve",
		"stub_end",
		"stub_long",
		"sub_portfolio",
		"surface",
		"tenor",
		"type"
	];
    
    $scope.update_params_list = function() {
        load_params_list($scope); // function in import.js
    }

    $scope.update_params_list();

    $scope.load_params = function() {
        load_params_from_server($scope); // function in import.js            
    }

    $scope.update_scenarios_list = function() {
        load_scenarios_list($scope); // function in import.js
    }

    $scope.update_scenarios_list();

    $scope.load_scenarios = function() {
        load_scenarios_from_server($scope); // function in import.js            
    }

	$scope.worker = new Worker('/assets/js/worker.js');
	$scope.worker.postMessage({
		modules: ['pricing','params_assignment','cashflowtables', 'cashflows']
	});

	function cashflow_sort(a,b){
		return a[0].localeCompare(b[0]);
	}

    $scope.worker.onmessage = function(e) {
        if (e.data.res) { //success
            $scope.res=e.data.res;
			if($scope.res.cashflow) $scope.res.cashflow=Object.entries($scope.res.cashflow).sort(cashflow_sort);
			if($scope.res.interest_cashflow) $scope.res.interest_cashflow=Object.entries($scope.res.interest_cashflow).sort(cashflow_sort);
			if($scope.res.principal_cashflow) $scope.res.principal_cashflow=Object.entries($scope.res.principal_cashflow).sort(cashflow_sort);
        } else if (e.data.warning) { //warning
            $scope.warnings.push(e.data.msg);
        } else { //error
			let msg=(e.data || {}).msg || 'An unknown error occurred';
            $scope.errors.push(msg);
        }
		$scope.$apply();
	}

    //worker process error handling
    $scope.worker.onerror = function(e) {
        $scope.errors.push("An error occurred in the worker process. " + (e.message || ""));
    }

	$scope.calculate_with_json = function(){
		// clear results,errors and warnings
		$scope.res=null;
		$scope.clear_messages();
		// parse JSON
		try{
			$scope.instrument=JSON.parse($scope.editor.json);
		}catch(e){
			$scope.errors.push(e.message);
			return 0;
		}
		//send instrument to worker
        $scope.worker.postMessage({
                    instrument: $scope.instrument
        });
    }

    $scope.calculate = function() {
		// clear results,errors and warnings
		$scope.res=null;
		$scope.clear_messages();
		//send instrument to worker
        $scope.worker.postMessage({
                    instrument: $scope.instrument
        });
    }

}]);
