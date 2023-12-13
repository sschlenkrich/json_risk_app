const load_scenarios_from_server=function(sc){
	if (!sc.available_scenarios.selection){
		alert("No scenario group selected");
		return 0;
	}
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.scenario_group=JSON.parse(req.responseText);
			sc.display.name=sc.available_scenarios.selection;
			sc.display.popup=null;          
            sc.$apply();
		}else{
			alert("Could not load scenario group from server");
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not load scenario group from server");
	});
	req.open('GET', '/api/scenarios/' + sc.available_scenarios.selection);
	req.send();
}

const load_scenarios_list=function(sc){
	var req=new XMLHttpRequest();	
	req.addEventListener('load', function(evt){
		if(req.status===200){
			sc.available_scenarios.list=JSON.parse(req.responseText);
			sc.available_scenarios.selection=sc.available_scenarios.list[0];
            sc.$apply();                       
		}else{
			//silent error
			console.log("Could not load list of available scenarios groups from server");
		}
	});	
	req.addEventListener('error', function(evt){
		//silent error
		console.log("Could not load list of available scenario groups from server");
	});
	req.open('GET', '/api/scenarios/');
	req.send();	
}



const import_data_json=function(fil, sc){   
	fil.text().then(text => {		
		sc.scenario_group=JSON.parse(text);	 
		sc.$apply();
	});
}



