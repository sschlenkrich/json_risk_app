//declare JsonRisk in the safe global worker scope, like in the web worker
global.JsonRisk=require('../../www/assets/js/json_risk.js');
const module_support=require('../../www/assets/js/module_support.js');
const {parentPort} = require('worker_threads');

var has_params=false;
var modules=[];

parentPort.on('message', function(d) {
	if (d.params){
		try{
			JsonRisk.store_params(d.params);
			// set valuation date which is already sanitized during storage
            JsonRisk.valuation_date=JsonRisk.get_params().valuation_date;
            modules=(d.params.modules || []).map((m) => {
                return module_support.from_base64url(m.source, m.name);
            });
			has_params=true;
		}catch(ex){
			parentPort.postMessage({error: true, status: 400, msg: ex.message});
		}		
		return 0;
	}
	if (d.instruments){
		if(!has_params){
			parentPort.postMessage({error: true, status: 500, msg: 'No parameters loaded'});
			return 0;
		}
		if(!Array.isArray(d.instruments) && !d.instruments.length){
			parentPort.postMessage({error: true, status: 400, msg: 'Invalid request, instruments must be an array'});
			return 0;
		}
		var res=[];
        var time=Date.now();
		var item;	
		while (d.instruments.length>0){
			let instrument=d.instruments.pop();

            // ensure id is a string
            instrument.id="" + (instrument.id || "undefined");

			try{
                // instrument mapping
                for (let j=0;j<modules.length;j++){
                    // check if instrument_mapping exists
                    if (typeof modules[j].instrument_mapping === "function"){
                        modules[j].instrument_mapping.call({
                            instrument: instrument,
                            params: JsonRisk.get_params()
                        });
                    };
                }

				// run generic JSON risk simulation
				item=JsonRisk.simulation(instrument,modules);
				item.id=instrument.id;
				res.push(item);
			}catch(ex){
				res.push({id: instrument.id, error: true, msg: ex.message});
			}
		}
        time=Date.now()-time;
        if(time<0) time=0;
		parentPort.postMessage({error: false, status: 200, res: res, time: time});
		return 0;
	}
	parentPort.postMessage({error: true, status: 400, msg: "Invalid message sent to worker. Must contain params or instruments."});
	return 0;
});

