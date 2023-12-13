const fs=require('fs');
const child_process=require('child_process');
const jr_datadir=process.env['JR_DATADIR'];
const jr_root=process.env['JR_ROOT'];
const jr_run=`${jr_root}/res/js/run.js`
const util=require('./util.js'); // utility functions

const options_readdir={
    withFileTypes: true,
    recursive: false,
    encoding: 'utf8'
}

const filter_dirs=function(dirent){
    return dirent.isDirectory();
}

const filter_submits=function(dirent){
    if (!dirent.isFile()) return false;
    if (!dirent.name.endsWith('json.submitted')) return false;
    return true;
}

const start_run=function(instance, run_name){
    util.jr_log(`Executing ${run_name} on instance ${instance}`);
    const args=[instance, run_name];
    const options={
        detached: true,
        stdio: 'ignore'
    };
    try{
        let cp=child_process.fork(jr_run, args, options);
        cp.unref();
        fs.unlinkSync(`${jr_datadir}/${instance}/runs/${run_name}.json.submitted`);
    }catch(e){
        util.jr_fail(`Error executing ${run_name} on instance ${instance}: ${e.message}`);
    }
}

const start_all_runs=function(){
    // get instances
    const instances=fs.readdirSync(jr_datadir, options_readdir).filter(filter_dirs);
    for (let i of instances){
        let rundir=`${jr_datadir}/${i.name}/runs`;
        if (!fs.existsSync(rundir)) continue;
        // get submits
        const submits=fs.readdirSync(rundir,options_readdir).filter(filter_submits);
        for (let s of submits){
            let file_name=`${jr_datadir}/${i.name}/runs/${s.name}`;
            let run_name=s.name.slice(0,-15);
            start_run(i.name,run_name);
        }
    }
}


process.on('SIGUSR1', start_all_runs);

setInterval(start_all_runs, 30 * 1000);
