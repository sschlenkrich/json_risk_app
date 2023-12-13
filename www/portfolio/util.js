const number_format = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  roundingMode: 'halfExpand'
});

const filter_scalars=function(value){
	if (null===value) return '';
	if (undefined===value) return '';
	switch(typeof value){
		case 'number':
			if (Math.abs(value)<0.5) return value.toFixed(6);
			return number_format.format(value);
		case 'string':
			return value;
		case 'boolean':
			return value ? "True" : "False";
		case 'object':
			return "Object/Array";
	}
	return "Error";
}

const default_instrument_first_columns = ["id","type","sub_portfolio"];

const collect_instrument_keys = function(instruments) {
    let temp = {};
    Object.assign(temp, ...instruments);
    temp = Object.keys(temp);
    temp.splice(temp.indexOf('$$hashKey'), 1);
    default_instrument_first_columns.forEach((item) => temp.splice(temp.indexOf(item), 1));
    temp = temp.sort(function(a,b){ return a.localeCompare(b) });

    return default_instrument_first_columns.concat(temp);
}

