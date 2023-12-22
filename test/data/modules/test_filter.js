exports.instrument_filter=function(instrument){
    if (instrument.test_code>1000) return false;
	return true;
}
