exports.simulation_once=function(){
	this.results.present_value=new Array(this.num_scen);
};

exports.simulation_scenario=function(){
	var i=this.idx_scen;
	var dc=this.dc;
	var sc=this.sc;
	var fc=this.fc;
	var su=this.su;
    var qu=this.qu;
	switch (this.instrument.type.toLowerCase()){
		case "bond":
		case "floater":
		case "fxterm":
		case "irregular_bond":
		this.results.present_value[i]=this.object.present_value(dc,sc,fc);
		break;
		case "swap":
		case "swaption":
		this.results.present_value[i]=this.object.present_value(dc,fc,su);
		break;
		case "callable_bond":
		this.results.present_value[i]=this.object.present_value(dc,sc,fc,su);
        break;
		case "equity":
		this.results.present_value[i]=this.object.present_value(qu);
		break;
	}
	// if currency is provided and not EUR, convert or throw error
	if (!this.instrument.currency) return;
	if (this.instrument.currency === 'EUR') return;
	this.results.present_value[i]/=JsonRisk.get_safe_scalar(this.fx).get_value();
};
