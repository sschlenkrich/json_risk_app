const http = require("http");
const process=require("process");
const fs=require("fs");
const worker_pool=require('./worker_pool.js'); // pool of workers
const runner=require('./runner.js'); // watches for runs submitted and executes them in separate processes
const auth=require('./auth.js'); // authentication
const util=require('./util.js'); // utility functions
const jr_tmpdir=process.env['JR_TMPDIR']; // temp dir
const socket=`${jr_tmpdir}/agent.sock`; // socket for communication with nginx
const pidfile=`${jr_tmpdir}/agent.pid`; // pid file

// simple cache for params
const cache={
	_cache: {},
	_atime: {},
	get: function(url,instance){
		let t=Date.now();
		this._atime[url]=t;
		return this._cache[instance + url];
	},
	set: function(url,instance,params){
        //store params
		let t=Date.now();
		this._cache[instance + url]=params;
		this._atime[instance + url]=t;
        //delete old items from cache
		for (let u of Object.keys(this._atime)){
			if (this._atime[u] < t-60000){
				delete this._cache[u];
				delete this._atime[u];
			} 
		}
	},
	has: function(url, instance){
        //check if params exist in cache
		return (instance + url) in this._cache;
	}
}


if (pidfile) fs.writeFileSync(pidfile,process.pid.toFixed(0));

const error_handler = function (res,status,message){
		res.setHeader("Content-Type", "application/json");
		res.writeHead(status);
		res.end(`{ "msg" : "${message}"}`);
		util.jr_log(`Sending error status ${status} ${message}`);
}

const throttle = function (stream){
		stream.setHeader("Content-Type", "application/json");
		stream.setHeader("Retry-After", "10");
		stream.writeHead(429);
		stream.end(`{ "msg" : "Too many requests."}`);
}
const send_params = function (instance, params, worker){
	worker.postMessage({params: params});
	worker.params=params;
    worker.instance=instance;
}

const calculate = function (worker, instruments, res){
	worker.stream_queue.unshift(res);
	worker.postMessage({instruments: instruments});
}

const get_params_and_calculate = function (params, worker, instruments, res, subject){	
	const h = params.startsWith('https://') ? require('https') : require('http');
    const options={
        headers: {
            authorization: subject.header
        }
    };
	h.get(params, options, (p_res) => {
		if (p_res.statusCode !== 200){
			error_handler(res,500, "Error getting params from backend: server returns status " + p_res.statusCode);
			return 0;
		}
		let p_body = '';

		// A chunk of data has been recieved.
		p_res.on('data', (chunk) => {
			p_body += chunk;
		});

		// The whole response has been received. Print out the result.
		p_res.on('end', () => {
			try{
				p_body=JSON.parse(p_body);
			}catch(err){
				error_handler(res,400, "Error getting params from backend: " + err.message);
				return 0;
			}
			cache.set(subject.instance, params,p_body);
			send_params(subject.instance, p_body, worker);
			calculate(worker,instruments,res);
		});

	}).on("error", (err) => {
		error_handler(res,500, "Error getting params from backend: " + err.message);
	});
}


const request_handler = function (body, res, subject) {
    if(typeof body.params_url !== 'string'){
        error_handler(res, 400, 'Body does not contain string-valued params_url property');
        return;
    }
    if(false===body.params_url.startsWith('https://') && false===body.params_url.startsWith('http://')){
        error_handler(res, 400, 'Body contains invalid params_url property');
        return;
    }
    if(!Array.isArray(body.instruments)){
        error_handler(res, 400, 'Body does not contain array-valued instruments property');
        return;
    }
	const params=body.params_url;
	let worker=worker_pool.get_worker(subject.instance, params);
	if (null===worker){
		throttle(res);
	}else if (worker.params===params && worker.instance===subject.instance){
		calculate(worker, body.instruments, res);
	}else if(cache.has(subject.instance, params)){
		send_params(subject.instance,cache.get(subject.instance, params), worker);
		calculate(worker,body.instruments,res);
	}else{
		get_params_and_calculate(params, worker, body.instruments, res, subject);
	}
}

const request_listener = function (req, res) {
    const subject=auth.verify(req);
    if(false===subject){
        error_handler(res,401,"Not authorized");
    }
	else if(req.method === 'GET'){
	    res.setHeader("Content-Type", "application/json");
    	res.writeHead(200);
    	res.end(JSON.stringify(worker_pool.status(),null,2));
	}else if(req.method === 'POST'){
		let body = '';
		req.on('data', function(data) {
		  body += data;
		});
		req.on('end', function() {
			try{
				body=JSON.parse(body);
			}catch(err){
				error_handler(res,400,"Invalid JSON, could not parse");
				return 0;
			}
			request_handler(body,res,subject);
		});
		req.on('error', function(err){
			error_handler(res,500,err.msg);
		});
	}else{
		error_handler(res,405,"Method not allowed");
	}
};

const cleanup=function(){
	util.jr_log('Stopping server..');
	server.close(() => {
		util.jr_log('Server stopped');
		if (pidfile) fs.unlinkSync(pidfile);
		process.exit();
	});
};
process.on('SIGQUIT', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

process.on('uncaughtException', function(e) {
	util.jr_fail('ERROR: An uncaught exception occurred');
	console.log(e.stack);
	if (pidfile) fs.unlinkSync(pidfile);
	process.exit(1);
});

util.jr_log("Starting server...");
const server = http.createServer(request_listener);
server.listen(socket);

