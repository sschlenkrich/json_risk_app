# Modules

JSON Risk App modules provide a powerful arsenal to customize the application for functional purposes such as curve assignment, custom mapping rules, custom filters and custom reporting attributes. For each calculation, users can select one or more modules. When modules depend on each other, JSON Risk App takes care of pulling in dependencies and executing the modules in the right order. Modules reside on the `<JR_DATADIR>` in the *modules* subfolder for each instance. JSON Risk App also provides a number of standard modules that are available on all instances. Files in the instance's *modules* folder override the standard modules if they have the same name.

Technically, each module is a CommonJS-conformant JavaScript file, i.e. it provides functionality by attaching functions to the `export` property. Users can view the available modules. Below, we describe what functionality modules can export.

## Pre-simulation instrument mapping

To perform mapping steps on instrument level before the instrument is simulated, i.e. attach discount curves or populate other fields, a module may export the function `instrument_mapping`. This function is called without arguments. Within the function, access the instrument by `this.instrument` and the parameters object by `this.params`. Below is an example module code. The example sets a day count convention of "30/360" for instruments if their `sub_portfolio` property ends with "Loans".


```

// Example 1
exports.instrument_mapping=function(){
	// set daycount for loans
	sub_portfolio=this.instrument.sub_portfolio;
	if (!sub_portfolio) sub_portfolio="";
	if (sub_portfolio.endsWith("Loans")) this.instrument.dcc="30/360";	
}


``` 

The second example attaches "DISC_CURVE" to the `discount_curve` attribute if "DISC_CURVE" is included in the parameters and the instrument does not have a discount curve yet.

```

// Example 2
exports.instrument_mapping=function(){
	// do nothing if instrument has discount curve
	if (this.instrument.discount_curve) return;

	// do nothing if "DISC_CURVE" does not exist
	if (! "DISC_CURVE" in this.params.curves) return;
	
	// attach
	this.instrument.discount_curve="DISC_CURVE";
}


```

## Instrument filters

Users can filter instrument for calculations by using modules that export the `instrument_filter` property. It is called with each instrument from the portfolios that are selected in a run. It is called with the instrument as single argument. If the function returns `true`, the instrument is included, if it returns `false`, the instrument is excluded from calculations. Here is an example that includes only callable instruments.

```

exports.instrument_filter=function(instrument){
    if (instrument.type==='callable_bond') return true;
    if (instrument.type==='swaption') return true;
    return false;
}

```

## Dependencies

By exporting an array of module names in the `depends` property, a module pulls in dependencies automatically. The features of the modules pulled in are executed in order of dependency. Here is an example:

```
// Example 4

// dependencies
exports.depends=['pricing', 'cashflows'];

export.instrument_mapping=function(){
	// other functionality of this module, executed after `instrument_mapping` functions of all the dependencies have been executed
}

export.simulation_once=function(){
	// other functionality of this module, executed after `simulation_once` functions of all the dependencies have been executed
}

``` 


## Simulation

Within simulations, it is often convenient to add functionality that is either executed once per simulation, or for every scenario. Functions that modules export under the `exports.simulation_once` property are executed once before scenarios are executed. Functions exported under the `exports.simulation_scenario` property are executed per scenario, also in the base scenario. Both functions are called without arguments and have access to a number of context properties:

 - `this.instrument`: The instrument being simulated, after `instrument_mapping` functionality of all other modules has been executed				
 - `this.object`: The internal object JSON Risk generated for each instrument before simulating (see JSON Risk library docs)
 - `this.params`: The stored parameters object with curves, surfaces, scalars, and scenarios
 - `this.num_scen`: The total number of scenarios going to be simulated, including the base scenario
 - `this.idx_scen`: The current index of scenarios being simulated, 0 in the base scenario and within the `simulation_once` function
 - `this.dc`: The JSON Risk curve object used as discount curve
 - `this.sc`: The JSON Risk curve object used as spread curve
 - `this.fc`: The JSON Risk curve object used as forward curve
 - `this.su`: The JSON Risk surface object used as volatility
 - `this.qu`: The JSON Risk scalar object used as equity quote
 - `this.fx`: The JSON Risk scalar object used as fx quote
 - `this.results`: An object where all results are attached to
 - `JsonRisk` : Access to the JSON Risk library functionality

The example below calculates a `scenario_pnl` result property based on the `present_value` vector that is calculated by the builtin *pricing* module. Since this example module depends on the *pricing* module to be executed before, it exports a `depends` property (see dependencies section above).

```

// Example 5

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



```


