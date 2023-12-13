const fs=require('fs'); // file system functions
const auth=require('./auth.js'); // authentication functions

const instance=process.argv[2];
const permissions=process.argv[3];
const exp_minutes=process.argv[4];

const token=auth.token(instance, permissions, exp_minutes);
console.log(token);
