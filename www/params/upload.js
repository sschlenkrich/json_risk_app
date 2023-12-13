const save_params=function(sc){
	const repl=function(key,value){
		if (key==='$$hashKey') return undefined; //exclude angluarJS internal variable
		if (value===null) return undefined; //exclude null values
		return value;
	};
	const req=new XMLHttpRequest();
	const fd=new FormData();                
	fd.append("name", sc.params.name);
	const blob = new Blob([JSON.stringify(sc.params, repl, 2)], {type : 'application/json'});
    fd.append("file", blob);

	req.addEventListener('load', function(evt){
		if(req.status===200){
			console.log("Success, params were uploaded");
			load_params_list(sc);
			sc.display.popup=null;
		}else{
			alert("Could not upload params: " + req.status);
		}
	});

	
	req.addEventListener('error', function(evt){
		alert("Could not upload params from server: (unknown status)");
	});
	req.open('POST', '/api/params/');
	req.send(fd);
}


