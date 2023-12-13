const crypto=require('crypto');
const _secret=get_secret();

function get_secret(){
    const fallback='NOT SECRET';
    const jr_root=process.env['JR_ROOT'];
    if(undefined===jr_root) return fallback;
    let security=jr_root+'/.security.json';
    try{
        security=require('fs').readFileSync(security);
        security=JSON.parse(security);
    }catch(err){
        console.error(err.message);
        return fallback;
    }
    if(undefined===security.secret) return fallback;
    return security.secret;
}

function hash_hmac(str){
    // returns Base64url encoded string
    const hmac = crypto.createHmac('sha256',_secret);
    hmac.update(str);
    return hmac.digest('base64url');
}

function base64url_encode(str){
	// Encode to Base64 String
    let res=Buffer.from(str, 'utf8').toString('base64url');
	return res;
}

function base64url_decode(str){
	res = Buffer.from(str,'base64url').toString('utf8');
	return res;
}

function tokenize(payload){
	// encode static header
	header = {
        alg: "HS256",
        typ: "JWT"
    };
	header = JSON.stringify(header);
	header = base64url_encode(header);

	// encode payload
	token = JSON.stringify(payload);	
	token = base64url_encode(token);
	token = header + '.' + token;

	// add base64url encoded signature hash
	signature = hash_hmac(token);

	// create signed token
	token = token + '.' + signature;
	return token;
}

function detokenize(token){
	const temp = token.split('.');
	if (temp.length !== 3) return null;
	let header = temp[0];
	let payload = temp[1];
	let signature = temp[2];
	
	//verify signature or fail
    let hash=hash_hmac(header + '.' + payload);

    signature=Buffer.from(signature, 'base64url');
    hash=Buffer.from(hash, 'base64url');
	if (!crypto.timingSafeEqual(hash,signature)) return null;

	//decode payload
	payload = base64url_decode(payload);
	payload = JSON.parse(payload);

	if (undefined === payload['exp']) return null;
	if (!Number.isInteger(payload['exp'])) return null;

	if (payload['exp'] < Date.now()) return null;

	return payload;
}

exports.secret=function(){
    return _secret;
}

exports.verify=function(request){
    const header=request.headers['authorization'];
    if(!header) return false;

    const tmp=header.trim().split(' ');
    if(tmp[0].toLowerCase()!=='bearer') return false;

    const payload=detokenize(tmp[1]);
    //check if token is valid
    if (null===payload) return false;

    //check if permission to read and execute is granted
    const permissions=payload.per || '';
    if(!permissions.includes('x')) return false;
    if(!permissions.includes('r')) return false;

    //get instance
    const instance=payload.ins || false;
    if(!instance) return false;

    return {header, instance, permissions};
}

exports.token=function(instance, permissions, exp_minutes){
    // issue token for specific instance with permission string and expiry
    const payload={
        sub: 'batch',
        per: permissions || 'x',
        ins: instance || 'public',
        exp: Date.now()+((exp_minutes|| 20)*60*1000)
    };
    return tokenize(payload);
}
