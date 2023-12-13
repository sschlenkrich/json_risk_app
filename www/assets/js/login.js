var jr_user=null;
var jr_instance=null;

function setuser(obj){
	jr_user=obj.sub;
	jr_instance=obj.ins;
	let dom_login=document.getElementById('jrlogin');
	let dom_logout=document.getElementById('jrlogout');
	let dom_loginstatus=document.getElementById('jrloginstatus');
	
	if (dom_login) dom_login.classList.add("collapse");
	if (dom_logout) dom_logout.classList.remove("collapse");
	if (dom_loginstatus) dom_loginstatus.innerHTML=`Logged in as ${obj.sub} on instance ${obj.ins}`;

	//refresh user 2 minutes before token expires
	let tte=obj.exp*1000 - Date.now();
	setTimeout(jrrefresh, tte-2000);
}


function setnobody(msg){
	jr_user=null;
	jr_instance=null;
	let dom_login=document.getElementById('jrlogin');
	let dom_logout=document.getElementById('jrlogout');
	let dom_loginstatus=document.getElementById('jrloginstatus');
	if (dom_login) dom_login.reset();
	if (dom_login) dom_login.classList.remove("collapse");
	if (dom_logout) dom_logout.classList.add("collapse");
	if (dom_loginstatus) dom_loginstatus.innerHTML=msg;
}

function jrlogin(){
	const form=document.getElementById('jrlogin');
	const fd=new FormData(form);
	// remove password field if password unset
	if(fd.get('pwd')==='') fd.delete('pwd');
	const req=new XMLHttpRequest();

	req.addEventListener('load', function(evt){
		if(req.status===200){
			let result=JSON.parse(req.responseText);
			if (result.success){
				if(typeof result.res === 'object'){
					setuser(result.res);
				}else{
					setnobody(result.res);	
				}
			}else{
				setnobody("Internal application error.");
			}
		}else if(req.status===401){
				let result;
				if (req.responseText){
					result=JSON.parse(req.responseText);
				}else{
					result={msg: "Access denied"};
				}
				setnobody(result.msg);
		}else{
			setnobody("Internal application error.");
		}
	});

	req.addEventListener('error', function(evt){
		setnobody("Internal application error.");	
	});

	req.open('POST', '/api/user/token');         
	req.send(fd);

}

function jrrefresh(){
	const req=new XMLHttpRequest();

	req.addEventListener('load', function(evt){
		if(req.status===200){
			let result=JSON.parse(req.responseText);
			if (result.success){
				if(typeof result.res === 'object'){
					setuser(result.res);
				}else{
					setnobody(result.res);	
				}
			}else{
				setnobody("Internal application error.");
			}
		}else if(req.status===401){
				setnobody("")
		}else{
			setnobody("Internal application error.");
		}
	});

	req.addEventListener('error', function(evt){
		setnobody("Internal application error.");	
	});

	req.open('GET', '/api/user/token');         
	req.send();
}

function jrlogout(){
	const req=new XMLHttpRequest();

	req.addEventListener('load', function(evt){
		setnobody("Logout successful.");
	});

	req.addEventListener('error', function(evt){
		setnobody("Internal application error.");	
	});

	req.open('POST', '/api/user/logout');         
	req.send();
}

window.addEventListener("load",jrrefresh);


