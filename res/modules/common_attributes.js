
exports.simulation_once=function(){
// store (all string valued) instrument attributes into results object
	var results=this.results;
		for ([key,value] of Object.entries(this.instrument)){
			if (key.charAt(0)==='$') continue;
			if ('string' === typeof value) results[key]=value;
		}
	if(this.instrument.tenor) this.results.tenor=this.instrument.tenor + 'M';
			
}
