
var app = angular.module('riskapp', []); 

app.controller('main_ctrl', ['$scope', function($scope) { // Controller für index.html

    /* definition of scope und worker (worker.js) */
	
	$scope.available_params={list: null, selection: null};
    $scope.display={
		popup: null
	};

	$scope.editor={
		json: null,
		key: '',
		kind: ''
	};
        
    $scope.update_params_list=function(){ 
	    load_params_list($scope);  // function in import.js
    }

    $scope.update_params_list();

    $scope.load_params=function(){ 
	    load_params_from_server($scope);    // function in import.js            
    }

    $scope.save_params=function(){ 
	    save_params($scope);    // function in upload.js            
    }


    $scope.delete_params=function(){ 
	    $scope.params={valuation_date: $scope.params.valuation_date, name: "New_Parameters"};
	    $scope.res=null;
    }

    $scope.export_params=function(){ 
	    export_to_json_file($scope.params, "params.json"); // Funktion aus export.js
    }
        
    $scope.view=function(item){  
            $scope.editor.index=-1;
            $scope.editor.json=JSON.stringify(item, repl, 1);
            window.scrollTo(0, 0); 
    }

    $scope.edit=function(key,value,kind){  
        $scope.editor.key=key
		$scope.editor.kind=kind
        $scope.editor.json=JSON.stringify(value, null, 1);
        window.scrollTo(0, 0);
    }

    $scope.create=function(kind){  
        $scope.editor.key=''
		$scope.editor.kind=kind
		let item=null;
    	if (kind==='scalars'){	    
			item={
				type: "scalar",
				tags: ["scalars"],
				value: [1]
			};
    	}
    	if (kind==='curves'){	    
			item={
				type: "yield",
				tags: ["yield"],
				labels: ["1y","2Y"],
				zcs: ["0.0001","0.0002"],
			};
    	}
    	if (kind==='surfaces'){	    
			item={
				type: "bachelier",
				tags: ["swaption"],
				labels_expiry: ["3m","6M","1y","2Y"],				
				labels_term: ["1y","2Y"],	
				zcs: [["0.0001","0.0002"],["0.0001","0.0002"],["0.0001","0.0002"],["0.0001","0.0002"]]
			};
    	}
    	if (kind==='calendars'){	    
			item={dates: [
				"2022-12-31",
				"2023/12/31",
				"31.12.2024"
			]};
    	}
		$scope.editor.json=JSON.stringify(item, null, 1);
        window.scrollTo(0, 0);
    }


    $scope.cancel_editor=function(){
            $scope.editor={
				json: null,
				key: '',
				kind: ''
			};
    }

    $scope.add_as_new=function(){
            if ($scope.editor.json && $scope.editor.kind!==''){
                    var item=JSON.parse($scope.editor.json);
                    var key=prompt("Enter name for new object","NEW");
					if (key){
						if (!$scope.params) $scope.params={};
                        if (!$scope.params[$scope.editor.kind]) $scope.params[$scope.editor.kind]={};    
						$scope.params[$scope.editor.kind][key]=item;
					}
					$scope.cancel_editor();
            }
    }

    $scope.save=function(){
            if ($scope.editor.json && $scope.editor.kind!=='' && $scope.editor.key!==''){
                    var item=JSON.parse($scope.editor.json);
					$scope.params[$scope.editor.kind][$scope.editor.key]=item;
					$scope.cancel_editor();
            }
    }


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

	    
    $scope.remove_parameter=function(key,value,kind){  
    	
    	if (kind==='scalars'){	    
	    	delete $scope.params.scalars[key];
	    	if (Object.keys($scope.params.scalars).length === 0) delete $scope.params.scalars;
    	}
    	if (kind==='curves'){	    
	    	delete $scope.params.curves[key];
	    	if (Object.keys($scope.params.curves).length === 0) delete $scope.params.curves;
    	}
    	if (kind==='surfaces'){	    
	    	delete $scope.params.surfaces[key];
	    	if (Object.keys($scope.params.surfaces).length === 0) delete $scope.params.surfaces;
    	}
    	if (kind==='calendars'){	    
	    	delete $scope.params.calendars[key];
	    	if (Object.keys($scope.params.calendars).length === 0) delete $scope.params.calendars;
    	}
	}

    /* II. general functions */
	$scope.import_file=function(type, kind, url){

        if (type==='csv'){
		    if (url) return import_data(url, kind, $scope);
		    var f = document.createElement('input');
		    f.setAttribute('type', 'file');
		    f.addEventListener('change', function(evt){import_data_csv(evt.target.files[0], kind, $scope);}, false);
		    f.click();
		    return 0;
        }else if(type==='json'){
            var uploadDatei;
            var f = document.createElement('input');
		    f.setAttribute('type', 'file');
            f.addEventListener('change', function(evt){import_data_json(evt.target.files[0], $scope);}, false);		    
		    f.click();
            return 0; 
        }
    }    
}]);

