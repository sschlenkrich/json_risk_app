// utility functions for logging etc.
const format_date=function(d){
    const Y=d.getFullYear();
    let M=d.getMonth()+1;
    let D=d.getDate();
    // prepend zeros on one-digit numbers
    M=('0' + M).slice(-2);
    D=('0' + D).slice(-2);
    return `${Y}-${M}-${D}`;
}

const format_time=function(d){
    const D=format_date(d);
    let H=d.getHours();
    let M=d.getMinutes();
    let S=d.getSeconds();
    // prepend zeros on one-digit numbers
    H=('0' + H).slice(-2);
    M=('0' + M).slice(-2);
    S=('0' + S).slice(-2);
    return `${D} ${H}:${M}:${S}`;
}

const jr_timestamp=function(){
    return format_time(new Date());
}


const jr_fail=function(msg, exit_code){
    let message=`${jr_timestamp()} ERROR: ${msg}.`
    console.log(message);
    // only if valid exit code is given, exit process
    if(Number.isInteger(exit_code)) process.exit(exit_code);
    return message;
}

const jr_warn=function(msg){
    let message=`${jr_timestamp()} WARN : ${msg}.`;
    console.log(message);
    return message;
}

const jr_log=function(msg){
    let message=`${jr_timestamp()} INFO : ${msg}.`;
    console.log(message);
    return message;
}


const jr_debug=function(msg){
    let message=`${jr_timestamp()} DEBUG: ${msg}.`;
    console.log(message);
    return message;
}

const jr_noop=function(){};

exports.format_date=format_date;
exports.format_time=format_time;
exports.jr_log=jr_log;
exports.jr_warn=jr_warn;
exports.jr_debug=jr_debug;
exports.jr_fail=jr_fail;
exports.jr_debug=(process.env['JR_DEBUG'] === '1') ? jr_debug: jr_noop;

