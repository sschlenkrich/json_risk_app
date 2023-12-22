exports.instrument_mapping=function(){
	const t=this.instrument.test_code
	// rate and daycount
	if(t % 2 < 1){
		this.instrument.dcc="act/365";
		this.instrument.fixed_rate=0.0365;
	}else{
		this.instrument.dcc="act/360";
		this.instrument.fixed_rate=0.0360;
	}

	// assets and liabilities
	if(t % 4 < 2){
		this.instrument.accounting="assets";
	}else{
		this.instrument.accounting="liabilities";
		this.instrument.notional*=-1;
	}

	// tenor
	this.instrument.tenor=12

	// start date
	this.instrument.effective_date="2023-12-31";

	// maturities starting from one year
	this.instrument.maturity=new Date(2025,0,t*8);
	
	if ('bond'===this.instrument.type) return 0;
	// fields for callables

	// call date starting from 6 months
	this.instrument.first_exercise_date=new Date(2024,6,t*4);
	this.instrument.call_tenor=t % 12;
}
