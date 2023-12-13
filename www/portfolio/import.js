var import_data_csv=function(fil, kind, sc){
        var pp_config={
	        header: false,
        	dynamicTyping: true,
	        worker: false,
	        delimiter: "",
	        skipEmptyLines: true
        };

        pp_config.complete=function(results,file){
                if (!sc.portfolio.instruments) sc.portfolio.instruments=[];
                var i,j, error_found;
                for (i=0; i<results.data.length; i++){
                        error_found=false;
                        for (j=0; j<results.errors.length; j++){
                                if (results.errors[j].row===i) error_found=true;
                        }
                        if (!error_found) sc.portfolio.instruments.push(results.data[i]);
                }
				sc.update_columns();
                sc.$apply();
        }
        pp_config.header=true;
     
		// download file with ajax if url, else just parse
		pp_config.download=("string"===typeof(fil)),
		Papa.parse(fil,pp_config)
}

var import_data_json=function(fil, sc){   
    fil.text().then(text => {
		if (!sc.portfolio.instruments) sc.portfolio.instruments=[];
		var portfolio_in;
		portfolio_in=JSON.parse(text);
		for (j=0; j<portfolio_in.length;j++){
			sc.portfolio.instruments.push(portfolio_in[j]);
		}	
		sc.update_columns();                      
		sc.$apply();
    });
}



