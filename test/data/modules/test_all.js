exports.depends=['pricing', 'common_attributes', 'cashflows', 'test_assignment', 'test_mapping', 'test_pnl','test_filter'];

exports.simulation_once=function(){
	this.results.notional=this.instrument.notional;
}
