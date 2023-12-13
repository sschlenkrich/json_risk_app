let jr_render_report=function(data,meta,spec){
	// inputs
	let grouping=spec.grouping;	
	let fields=spec.fields;
	let scfields=spec['per-scenario fields'];
	let scenarios=spec.scenarios;

	// outputs
	let headers=[];
	let rows=[];


	// scratch variables
	let row,temp,i,j,k;

	// get indexes for scenarios
	let scen_idx=[];
	for (i=0;i<scenarios.length;i++){
		temp=meta.scenarios.indexOf(scenarios[i]);
		if (temp>=0) scen_idx.push(temp);
	}


	// make first level header
	row=[];
	if (grouping.length>0){
		row.push({
			text: "Grouping",
			colspan: grouping.length
		});
	}

	if (fields.length>0){
		row.push({
			text: "Fields",
			colspan: fields.length
		});
	}

	if (scfields.length>0){
		for (i=0;i<scenarios.length;i++){			
			row.push({
				text: meta.scenarios[scen_idx[i]],
				colspan: scfields.length
			});
		}
	}

	headers.push(row);

	// make second level header
	row=[];
	for (i=0;i<grouping.length;i++){	
		row.push({
			text: grouping[i],
			colspan: 1
		});
	}

	for (i=0;i<fields.length;i++){	
		row.push({
			text: fields[i],
			colspan: 1
		});
	}

	
	for (i=0;i<scenarios.length;i++){
		for (j=0;j<scfields.length;j++){			
			row.push({
				text: scfields[j],
				colspan: 1
			});
		}
	}
	
	headers.push(row);

	// make data rows
	for(k=0;k<data.length;k++){
		row=[];
		for (i=0;i<grouping.length;i++){	
			row.push(data[k][grouping[i]]);
		}

		for (i=0;i<fields.length;i++){	
			temp=data[k][fields[i]];
			row.push(Array.isArray(temp) ? temp[0] : temp);
		}

		
		for (i=0;i<scenarios.length;i++){
			for (j=0;j<scfields.length;j++){	
				temp=data[k][scfields[j]];		
				row.push(Array.isArray(temp) ? temp[scen_idx[i]] : null);
			}
		}
		rows.push(row);
	}

	return {
		headers: headers,
		rows: rows,
		num_header_cols: grouping.length
	};
}

let render_csv=function(report,separator){
	let n;
	let result='';
	let newline=false;
	for (line of report.headers){
		if (newline) result+='\n';
		newline=true;
		for (cell of line){
			n=cell.colspan;
			while (n>0){
				result+=cell.text+separator;
				n--;
			}
		}
	}
	for (line of report.rows){
		result+='\n';
		for (cell of line){
			n=(cell*1===cell) ? cell.toExponential() : cell;
			result+=n+separator;
		}
	}
	return result;
}
