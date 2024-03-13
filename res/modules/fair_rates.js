exports.depends=['params_assignment'];

function get_curve(name,params){
    let c=params.curves[name];
    if (!c) return null;

    return {
        times: c.times,
        dfs:c.dfs[0]
    };
}

exports.instrument_mapping=function(){
    // attach a fair rate to each bond or swap that does not have fixed_rate set
    if('swap'!==this.instrument.type && 'bond' !== this.instrument.type) return null; //only swaps and bonds so far
    if(!!this.instrument.fixed_rate) return null; // instrument has a fixed_rate already
    if(0===this.instrument.fixed_rate) return null; // instrument has a fixed_rate already
    
    // copy all instrument properties to temporary instrument
    let instr=Object.assign({}, this.instrument);
    // set temp fixed rate
    instr.fixed_rate=0;

    let obj,rate,dc,sc,fc;
    dc=get_curve(instr.disc_curve, this.params);
    if(!dc) return null;
    if('bond'===instr.type){
        sc=get_curve(instr.spread_curve,this.params);
        obj=new JsonRisk.fixed_income(instr)
        rate=obj.fair_rate_or_spread(dc,sc);
    }
    
    if('swap'===instr.type){
        fc=get_curve(instr.fwd_curve,this.params);
        if(!fc) return null;
        obj=new JsonRisk.swap(instr)
        rate=obj.fair_rate(dc,fc);
    }
    
    this.instrument.fixed_rate=rate;
}

