const wt=require('worker_threads');
const N=require('os').cpus().length;
const pool=new Array(N);

const handler=function(data){
	let stream=this.stream_queue.pop();
	stream.setHeader("Content-Type", "application/json");
    stream.writeHead(data.status);
    stream.end(JSON.stringify(data));
	if (true===data.error){
		// log error
		console.log(data.msg);
	}
}

for (let i=0;i<N;i++){
	pool[i]=new wt.Worker('./res/js/worker.js');
	pool[i].stream_queue=[];
	pool[i].params=null;
    pool[i].instance=null;
	pool[i].idle=function(){
		return this.stream_queue.length===0;
	}
	pool[i].available=function(){
		return this.stream_queue.length<2;
	}
	pool[i].on('message', handler);
}

exports.get_worker = function(instance, params){

	// prio 1 - get idle worker with params
	for (let w of pool){
		if (w.idle() && w.instance===instance && w.params===params) return w;
	}
	// prio 2 - get any idle worker
	for (let w of pool){
		if (w.idle()) return w;
	}
	// prio 3 - get available worker with params
	for (let w of pool){
		if (w.available() && w.instance===instance && w.params===params) return w;
	}
	// prio 4 - get any available worker
	for (let w of pool){
		if (w.available()) return w;
	}
	// no worker found
	return null;
}

exports.status = function(){
	let res=[];	
	for (let i=0;i<N;i++){
		res.push({
			index: i,
			idle: pool[i].idle(),
			queue: pool[i].stream_queue.length
		});
	}
	return res;
}
