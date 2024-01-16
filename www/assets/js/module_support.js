/*

Brief support library for the JSON Risk module system

*/

(function(root){
    const _comp=function(a,b){
        if(Array.isArray(a.depends)){
            if(a.depends.indexOf(b.name)>-1) return 1;
        }
        if(Array.isArray(b.depends)){
            if(b.depends.indexOf(a.name)>-1) return -1;
        }
        return 0;
    }

    const from_string=function(source, name){
        let _module = module.constructor;
        let m = new _module();
        m._compile(source, name);
        m.name=name;
        return m.exports;
    }

    const from_base64url=function(source, name){
        let s=Buffer.from(source, 'base64url').toString('utf8');
        return from_string(s, name);
    }

    const add_module=function(modules, name){
        // works only in browser in a worker context, else return null
        if('function' !== typeof importScripts) return null;
	    let uri='/api/modules/' + name;
	    self.module={
		    exports: {name}
	    };
	    self.exports=self.module.exports;
	    importScripts(uri);
        modules.push(self.module.exports);
        // also add all dependencies if not present already
        if(Array.isArray(self.module.exports.depends)){
            for (m of self.module.exports.depends){
                let found=false;
                for (let loaded of modules){
                    if(m===loaded.name) found=true
                }
                if (found) continue;
                add_module(modules, m);
            }
        }
    }

    const sort_modules=function(modules){
        modules.sort(_comp);
    }


    const load_modules_and_dependencies=function(namelist){
        // works only in browser in a worker context, else return null
        if('function' !== typeof importScripts) return null;
        let modules=[];
        let temp=null;
        if(!Array.isArray(namelist)) return modules;
        for (let m of namelist){
            add_module(modules,m);
        }
        modules.sort(_comp);
        return modules;
    }
    
    if('function'=== typeof importScripts){
        // worker
        this.module_support={load_modules_and_dependencies};
    }

    if (typeof module === 'object' && typeof exports !== 'undefined'){
        // nodejs
        exports.from_base64url=from_base64url;
        exports.from_string=from_string;
        exports.sort_modules=sort_modules;
    }
    
})(this);
