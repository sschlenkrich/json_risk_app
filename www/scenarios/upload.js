const save_scenarios=function(sc){
	const repl=function(key,value){
		if (key==='$$hashKey') return undefined; //exclude angluarJS internal variable
		if (value===null) return undefined; //exclude null values
		return value;
	};
	const req=new XMLHttpRequest();
	const fd=new FormData();                
	fd.append("name", sc.display.name || '');
	const blob = new Blob([JSON.stringify(sc.scenario_group, repl, 2)], {type : 'application/json'});
    fd.append("file", blob);

	req.addEventListener('load', function(evt){
		if(req.status===200){
			console.log("Success, scenario group was uploaded");
			load_scenarios_list(sc);
			sc.display.popup=null;
		}else{
			let msg="Could not upload scenarios: " + req.status;
			if (req.responseText){
				let temp=JSON.parse(req.responseText);
				temp=temp.msg || null;
				if (temp) msg+=", " + temp;
			}
			alert(msg);
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not upload scenarios: (unknown status)");
	});
	req.open('POST', '/api/scenarios/');
	req.send(fd);
}


