// hidden variables
let _portfolio=null;
let _params_url=null;
let _success_callback=null;
let _error_callback=null;
let _debug_callback=null;
let _info_callback=null;
let _nodes=[];

const get_subportfolio=function(chunk_size){    
    let res=[];
    for (let i=0;i<chunk_size;i++){
        if (0===_portfolio.length) return res;
        res.push(_portfolio.shift());
    }
    return res;
}

const return_subportfolio=function(s){
    while (s.length>0){
        _portfolio.unshift(s.pop());
    }
}

const request_options={
    headers: {
        authorization: null,
    },
    method: 'POST'
}

const CalculationNode=function(u){
    const host=u;
    const url=u+'/calculation';
    const params_url=_params_url;
    const http = url.startsWith("https://") ? require("https") : require("http");
    let pending=0;
    let offline=false;
    let total_time=0;
    let total_instruments=0;
    let chunk_size=10;

    this.status=function(){
        return {pending, offline};
    }
    
    const request=function(is_master){
        let instruments=get_subportfolio(chunk_size);
        if (0===instruments.length){
            // nothing left in portfolio, but failing requests could put something back, so if master request, try again after 10 seconds
            if (is_master) setTimeout(request, 10*1000, true);
            return;
        }
        pending++;
        let req=http.request(url, request_options, (res) => {
            // server has responded
            if (offline && is_master){
                _info_callback(`Server ${host} is online again`);
                offline=false;
            }
            if (res.statusCode === 429){
                // server is throttling, put subportfolio back onto the stack and send new request after 10 seconds only if master request
                return_subportfolio(instruments);
                pending--;
                if (is_master) setTimeout(request, 10*1000, true);
                _debug_callback(`Server ${host} is very busy, throttling requests`);         
            }

	        let data='';
	        res.setEncoding('utf8');
	        res.on('data', (chunk) => {
        		data+=chunk;
	        });
	        res.on('end', () => {
                // even on error, agent always returns JSON
                try{
        		    data=JSON.parse(data);
                }catch(e){
                    return_subportfolio(instruments);   
                    _error_callback(`Server ${host} returns status ${res.statusCode} and invalid JSON: ${e.message}`);
                }
                if (res.statusCode === 200){                  
                    // on sucess, execute success callback and make more requests
                    pending--;
                     _success_callback(data.res);
                    // always make new request with the same master status          
                    request(is_master);
                    // update stats
                    total_time+=data.time;
                    total_instruments+=data.res.length;
                    
                    if(is_master){
                        // master may even increase the load by making one more request
                        request(false);

                        // master also tunes chunk size based on stats
                        chunk_size=1000*total_instruments/(1+total_time);
                        if(total_instruments<1000) chunk_size=10;
                        if(chunk_size<1) chunk_size=1;
                        if(chunk_size>50) chunk_size=50;
                        _debug_callback(`Server ${host}: Resetting chunk size to ${chunk_size}`);
                    }
                }else if(res.statusCode!==429){
                    // under the other statuses, server returns a message in JSON
                    return_subportfolio(instruments);
                    _error_callback(`Server ${host} returns error status ${res.statusCode}: ${data.msg}`);
                }
	        });
        });

        req.on('error', (e) => {
            // server is offline, put subportfolio back onto the stack
            return_subportfolio(instruments);
            pending--;
            // master request is responsible for setting the offline flag and trying again after 2 minutes.
            if (is_master){
                if (!offline){
                    _info_callback(`Server ${host} is offline`);
                }
                offline=true;
                setTimeout(request, 2*60*1000, true);
            }
        });
    
        req.write(JSON.stringify({instruments, params_url}));
        req.end();
    }
    // start master request, i.e. request with index 0
    request(true);
    return this;
}

const status={
    nodes_total: 0,
    nodes_online: 0,
    instruments_total: 0,
    instruments_remaining: 0
}

exports.instance=function(i){
    let instance=i;
    const auth=require('./auth.js');
    // get initial token
    request_options.headers.authorization="Bearer " + auth.token(instance, 'rx', 12);
    // renew token from time to time
    setInterval(() => {
        request_options.headers.authorization="Bearer " + auth.token(instance, 'rx', 12);
    }, 10*60*1000);
}

exports.portfolio=function(p){
    _portfolio=p;
    status.instruments_total=p.length;
    // random shuffle
    for (let i=_portfolio.length-1;i>0;i--){
        const j = Math.floor(Math.random() * (i + 1));
        const temp = _portfolio[i];
        _portfolio[i] = _portfolio[j];
        _portfolio[j] = temp;
    }
}

exports.params_url=function(p){
    _params_url=p;
}

exports.success_callback=function(func){
    _success_callback=func;
}

exports.debug_callback=function(func){
    _debug_callback=func;
}

exports.error_callback=function(func){
    _error_callback=func;
}

exports.info_callback=function(func){
    _info_callback=func;
}

exports.add_url=function(url){
    let n=new CalculationNode(url)
    _nodes.push(n);
    status.nodes_total=_nodes.length;
}

exports.status=function(){
    status.nodes_online=status.nodes_total;
    status.instruments_remaining=_portfolio.length;
    for(let n of _nodes){
        let s=n.status();
        if(s.offline) status.nodes_online--;
        status.instruments_remaining+=s.pending;
    }
     return status;
}


