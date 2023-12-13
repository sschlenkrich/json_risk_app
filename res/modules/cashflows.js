function dateformat(d){
	return  d.getFullYear()
		+ "-"
		+ ("0"+(d.getMonth()+1)).slice(-2)
		+ "-"
		+ ("0" + d.getDate()).slice(-2);
}

function add_cashflows(dates, payments, target){
	for (let i=0;i<dates.length;i++){
		let key=dateformat(dates[i]);
		let value=payments[i];
		if(value!==0){
			if (!target[key]){
				target[key]=value;
			}else{
				target[key]+=value;
			}
		}
		if(0===target[key]) delete target[key];
	}
}

exports.simulation_once=function(){
	let cashflowtable1=null;
	let cashflowtable2=null;
	// bonds and swaps
	if ('function' === typeof this.object.get_cash_flows) cashflowtable1=this.object.get_cash_flows(this.fc);
	// callable bonds
	if ('object' === typeof this.object.base) cashflowtable1=this.object.base.get_cash_flows(this.fc);
	// swaptions
	if ('object' === typeof this.object.swap) cashflowtable1=this.object.swap.get_cash_flows(this.fc);

	if (!cashflowtable1) return;
	// swaps and swaptions have fix and float cashflow tables
	if (cashflowtable1.fixed_leg && cashflowtable1.float_leg){
		cashflowtable2=cashflowtable1.float_leg;
		cashflowtable1=cashflowtable1.fixed_leg;
	}

	let cashflow={},interest_cashflow={},principal_cashflow={};
	add_cashflows(cashflowtable1.date_pmt,cashflowtable1.pmt_interest,interest_cashflow);
	add_cashflows(cashflowtable1.date_pmt,cashflowtable1.pmt_interest,cashflow);
	add_cashflows(cashflowtable1.date_pmt,cashflowtable1.pmt_principal,principal_cashflow);
	add_cashflows(cashflowtable1.date_pmt,cashflowtable1.pmt_principal,cashflow);

	if(cashflowtable2){
		add_cashflows(cashflowtable2.date_pmt,cashflowtable2.pmt_interest,interest_cashflow);
		add_cashflows(cashflowtable2.date_pmt,cashflowtable2.pmt_interest,cashflow);
		add_cashflows(cashflowtable2.date_pmt,cashflowtable2.pmt_principal,principal_cashflow);
		add_cashflows(cashflowtable2.date_pmt,cashflowtable2.pmt_principal,cashflow);
	}

	this.results.cashflow=cashflow;
	this.results.interest_cashflow=interest_cashflow;
	this.results.principal_cashflow=principal_cashflow;
};	
