#
# test reports api
#

JAVASCRIPT='
let response=require("fs").readFileSync(0);
let {meta, results}=JSON.parse(response).res;
response=null;

let l=meta.scenario_groups.length
if( l !== 2){
	console.log(`total number of scenario groups is ${l}, should be 2`);
	process.exit(1);
}

l=meta.scenario_groups[0].length+meta.scenario_groups[1].length
if( l !== 182){
	console.log(`total number of scenarios is ${l}, should be 182`);
	process.exit(1);
}

for (const r of results){
	let n=0;	
	for(const [key, value] of Object.entries(r.principal_cashflow)){
		if (key.startsWith("2023")) continue;
		n+=value;
	}
	if (n!==r.notional){
		console.log(`total future principal cashflow is ${n}, should be ${r.notional}`);
		process.exit(1);
	}
	if (0===r.notional) continue;
	let base=r.present_value[0];
	for(let i=0;i<r.present_value.length;i++){
		let pv=r.present_value[i];
		let pnl=r.pnl_scenario[i];
		if(Math.abs(pv-base-pnl)>0.01){
			console.log(`pnl is ${pnl}, but pv is ${pv} and base is ${base}`);
			process.exit(1);
		}
		if(0.99> pv/r.notional || 1.11 < pv/r.notional){
			console.log(`pv is ${pv} and notional is ${r.notional}, they should be closer`);
			process.exit(1);
		}
	}
}
'


#
# group by sub_portfolio (standard)
#
jr_curl api/results/2023-12-31/TEST_RUN | node -e "$JAVASCRIPT" || jr_test_fail


#
# group by accounting
#
jr_curl api/results/2023-12-31/TEST_RUN -X POST --data '{"grouping": ["accounting"]}'| node -e "$JAVASCRIPT" || jr_test_fail

#
# group by accounting and type
#
jr_curl api/results/2023-12-31/TEST_RUN -X POST --data '{"grouping": ["accounting","type"]}'| node -e "$JAVASCRIPT" || jr_test_fail


#
# group by accounting, type, and dcc
#
jr_curl api/results/2023-12-31/TEST_RUN -X POST --data '{"grouping": ["accounting","type","dcc"]}'| node -e "$JAVASCRIPT" || jr_test_fail

jr_test_succeed

