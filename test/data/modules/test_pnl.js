// make sure pricing is done first
exports.depends=['pricing'];

exports.simulation_once=function(){
    // initialize pnl array
    this.results.pnl_scenario=new Array(this.num_scen);
};

exports.simulation_scenario=function(){
    // get scenario index
    let i = this.idx_scen;

    // calculate pnl as the difference between scenario present value and base present value
    this.results.pnl_scenario[i] = this.results.present_value[i] - this.results.present_value[0];
};
