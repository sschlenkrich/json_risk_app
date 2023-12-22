exports.instrument_mapping=function(){
    // set curve
    this.instrument.disc_curve="CONST_CURVE";
	if (this.instrument.type==="bond") return 0;
	// set more params for callables
    this.instrument.fwd_curve="CONST_CURVE";
    this.instrument.surface="CONST_SURFACE"
}
