function export_to_json_file(data, fname){
	var repl=function(key,value){
		if (key==='$$hashKey') return undefined; //exclude angluarJS internal variable
		if (value===null) return undefined; //exclude null values
		return value;
	};
    var export_data=JSON.stringify(data, repl, 1);
        
    var a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,'+encodeURIComponent(export_data);
    a.download=fname;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    return null;
}

