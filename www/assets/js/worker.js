importScripts('/assets/js/json_risk.js'); // makes JsonRisk available in global scope
importScripts('/assets/js/module_support.js'); // makes module_support available in global scope

/* I. main logic called by main.js */

var has_params=false;
var modules=[];

onmessage = function(e) {
	var d=e.data;
	if (d.params){
		try{
			JsonRisk.store_params(d.params);
			has_params=true;
		}catch(ex){
			postMessage({error: true, msg: ex.message});
		}		
	}
	if (d.modules){
        if (!Array.isArray(d.modules)){
			postMessage({error: true, msg: 'Invalid modules configuration', id: null});
			return 0;
        }
        modules=module_support.load_modules_and_dependencies(d.modules);
	}
	if (d.instrument){
		if(!has_params){
			postMessage({error: true, msg: 'No parameters loaded', id: null});
			return 0;
		}

        // ensure id is a string
        d.instrument.id="" + (d.instrument.id || "undefined");

		// call instrument_mapping instructions from all modules
		try{
			for (let j=0;j<modules.length;j++){
			// check if instrument_mapping exists
				if (typeof modules[j].instrument_mapping === "function"){
						modules[j].instrument_mapping.call({
						instrument: d.instrument,
						params: JsonRisk.get_params()
					});
				};
			}
		}catch(ex){
			postMessage({warning: true, msg: ex.message, id: d.instrument.id})
		}

		try{
			// run generic JSON risk simulation
			var res=JsonRisk.simulation(d.instrument,modules);
            res.id=d.instrument.id;
			postMessage({res: res});
		}catch(ex){
			postMessage({error: true, msg: ex.message, id: d.instrument.id});
		}
	}
}
