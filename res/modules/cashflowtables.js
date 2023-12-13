exports.simulation_once=function(){
	let cashflowtable=null;
	// bonds and swaps
	if ('function' === typeof this.object.get_cash_flows) cashflowtable=this.object.get_cash_flows(this.fc);
	// callable bonds
	if ('object' === typeof this.object.base) cashflowtable=this.object.base.get_cash_flows(this.fc);
	// swaptions
	if ('object' === typeof this.object.swap) cashflowtable=this.object.swap.get_cash_flows(this.fc);

	if (!cashflowtable) return;
	// swaps and swaptions have fix and float cashflow tables
	if (cashflowtable.fixed_leg && cashflowtable.float_leg){
		this.results.cashflowtable_float=cashflowtable.float_leg;
		this.results.cashflowtable_fix=cashflowtable.fixed_leg;
	}else{
		this.results.cashflowtable=cashflowtable;
	}
};
