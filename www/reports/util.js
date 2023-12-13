const update_fields=function(sc){
	let temp={};
	for (let i=0;i<sc.results.length;i++){
		Object.assign(temp,sc.results[i])
	}
	delete temp._grouping;
	sc.fields=Object.keys(temp);
	sc.fields.sort(function(a,b){ return a.localeCompare(b);});
}

const update_scenarios=function(response){
    if(!Array.isArray(response.meta.scenario_groups)) alert("An internal error occurred: server response does not include scenario info");
    let scenarios=['Base'];
    for (let g of response.meta.scenario_groups){
        if(!Array.isArray(g)) alert("An internal error occurred: server response includes invalid scenario info");
        for ( let s of g){
            scenarios.push(s.name);
        }
    }
    return scenarios;
}

const number_format = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  roundingMode: 'halfExpand'
});

const filter_scalars=function(value){
	if (null===value) return '';
	if (undefined===value) return '';
	switch(typeof value){
		case 'number':
			if (Math.abs(value)<0.5) return value.toFixed(6);
			return number_format.format(value);
		case 'string':
			return value;
		case 'boolean':
			return value ? "True" : "False";
		case 'object':
			return "Object/Array";
	}
	return "Error";
}
