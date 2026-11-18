/* Products: changes wait for the owner to press Save changes, then say plainly that they are live. */
var BTN='<button type="button" class="savebtn" data-act="psave">Save changes</button>';
var dirtyG={},lastG='';
var _prodHtml=prodHtml,_prodGroup=prodGroup;
prodHtml=function(){return _prodHtml().replace('Changes save on their own.','Edits go live when you press Save changes.')};
prodGroup=function(gid,list,fresh){var h=_prodGroup(gid,list,fresh);return dirtyG[gid]?h.replace('data-act="gadd">Add a size</button>','data-act="gadd">Add a size</button>'+BTN):h};
['input','change','click'].forEach(function(t){document.addEventListener(t,function(ev){var c=ev.target.closest&&ev.target.closest('.pg');if(c)lastG=c.dataset.g},true)});
function queueSave(){
  pdirty=true;pver++;clearTimeout(ptimer);
  var sec=lastG&&document.querySelector('.pg[data-g="'+lastG+'"]');
  if(sec){dirtyG[lastG]=1;if(!sec.querySelector('.savebtn'))sec.querySelector('[data-act="gadd"]').insertAdjacentHTML('afterend',BTN)}
  else if(!$('.savebtn')){var any=document.querySelector('.pg');if(any){dirtyG[any.dataset.g]=1;any.querySelector('[data-act="gadd"]').insertAdjacentHTML('afterend',BTN)}else{var a=$('.pact');if(a)a.insertAdjacentHTML('afterbegin',BTN)}}
  setPStatus('Unsaved changes');
}
function flushProds(){
  if(pbusy)return;
  var bad=prods.filter(function(p){return !p.gone&&isDraft(p)})[0];
  if(bad){
    var nm=String(bad.grp||'').trim()?'':'name',what=nm||(!(bad.pieces>=1)?'pieces':!(bad.price>=0)?'price':'code'),row=document.querySelector('.prow[data-code="'+bad.code+'"]'),sec=row&&row.closest('.pg');
    var f=what==='name'?(sec&&sec.querySelector('[data-pg]')):row&&row.querySelector('[data-pf="'+(what==='code'?'short':what)+'"]');
    var label={name:'a name',pieces:'the number of pieces',price:'a price',code:'a different code'}[what];
    toast((String(bad.grp||'').trim()||'The new product')+' needs '+label+' before you can save.');
    if(f){f.focus();try{f.scrollIntoView({block:'center',behavior:'smooth'})}catch(e){}}
    return;
  }
  var gi={};prods.forEach(function(p){if(!p.gone&&p.img&&!gi[p.gid])gi[p.gid]=p.img});prods.forEach(function(p){if(!p.gone)p.img=gi[p.gid]||''});
  var v=pver,list=prods.filter(function(p){return !isDraft(p)}),skipped=prods.filter(function(p){return !p.gone&&isDraft(p)}).length,btns=Array.prototype.slice.call(document.querySelectorAll('.savebtn'));
  if(!configured){pdirty=false;dirtyG={};btns.forEach(function(x){x.remove()});setPStatus('Saved here only');return}
  pbusy=true;btns.forEach(function(x){x.disabled=true;x.textContent='Saving'});
  api({action:'saveProducts',products:list.map(toProd)}).then(function(){
    pbusy=false;prodsLive=true;
    list.forEach(function(p){p.base=snap(p)});
    if(pver===v){pdirty=false;dirtyG={};btns.forEach(function(x){x.remove()});setPStatus('Saved')}
    else btns.forEach(function(x){x.disabled=false;x.textContent='Save changes'});
    toast('Saved. The order page is updated.');
  }).catch(function(e){
    pbusy=false;btns.forEach(function(x){x.disabled=false;x.textContent='Save changes'});
    var m=String(e&&e.message||'');
    if(m==='unknown action'){setPStatus('Not saved');toast('Not saved. Update the Apps Script first.');return}
    if(/failed to fetch|networkerror|load failed/i.test(m)||!m){setPStatus('Not saved');toast('Not saved. Check the connection, then press Save changes again.');return}
    setPStatus('Not saved');toast('Not saved. '+m);
  });
}
document.addEventListener('click',function(ev){if(ev.target.closest&&ev.target.closest('[data-act="psave"]'))flushProds()});
window.addEventListener('beforeunload',function(ev){if(pdirty){ev.preventDefault();ev.returnValue=''}});
function hintFor(p){
  if(dupShort(p))return 'That code is already used by another size.';
  if(!String(p.grp||'').trim())return 'Add a name for this product.';
  if(!(p.pieces>=1))return 'Add the number of pieces.';
  if(!(p.price>=0))return 'Add a price to put this on the order page.';
  return '';
}

/* Speed: the three spreadsheet reads run together instead of one after another, and the last
   board is kept on this device so it appears at once while fresh data loads. */
var CK='bs-cache-v1',rawProds=null,lastRows=null;
function writeCache(){try{localStorage.setItem(CK,JSON.stringify({rows:lastRows,closed:Object.keys(shutDays),notes:notes,products:rawProds}))}catch(e){}}
(function(){
  var c=null;try{c=JSON.parse(localStorage.getItem(CK)||'null')}catch(e){}
  if(c&&Array.isArray(c.rows)){
    orders=c.rows.filter(function(r){return r.id}).map(fromRow);lastRows=c.rows;
    shutDays={};(c.closed||[]).forEach(function(d){shutDays[d]=1});
    if(c.notes&&typeof c.notes==='object')notes=c.notes;
    if(Array.isArray(c.products)&&c.products.length){rawProds=c.products;prods=decorate(c.products.map(fromProd))}
    loaded=true;live=true;
  }
})();
function load(){
  var tk=encodeURIComponent(TOKEN),get=function(a){return fetch(API_URL+'?action='+a+'&token='+tk).then(function(r){return r.json()})};
  get('products').then(function(j){
    if(!Array.isArray(j.products))return;
    prodsLive=true;rawProds=j.products;
    if(!pdirty&&!pbusy&&!prods.some(isDraft)){prods=decorate(j.products.map(fromProd));if(loaded)renderBoard()}
    writeCache();
  }).catch(function(){});
  get('notes').then(function(j){
    if(j&&j.notes&&typeof j.notes==='object'){notesLive=true;if(!ntimer&&!nbusy&&!Object.keys(npend).length){notes=j.notes;if(loaded)renderBoard()}}
    writeCache();
  }).catch(function(){});
  return get('list').then(function(j){
    if(j.error)throw new Error(j.error);
    var first=!loaded,known={};orders.forEach(function(o){known[o.id]=1});
    if(Array.isArray(j.closed)&&!closeBusy){shutDays={};j.closed.forEach(function(d){shutDays[d]=1})}
    lastRows=j.rows;orders=j.rows.filter(function(r){return r.id}).map(fromRow);loaded=true;live=true;why='';state.go=false;
    var fresh=orders.filter(function(o){return o.status==='pending'&&!known[o.id]});
    if(!first&&fresh.length){toast(fresh.length>1?fresh.length+' new online orders to confirm':'New online order from '+fresh[0].name+', confirm it');chime()}
    renderBoard();writeCache();
  }).catch(function(e){why=(e&&e.message)||'could not reach it';if(!loaded)fallback();else{live=false;renderBoard()}});
}

/* Sign in screen. Talks to the script's login and signup actions. Until the script has them (older version),
   it falls back to the demo login below so the demo keeps working. */
var LOGIN_ON=true;
function signedIn(){try{return localStorage.getItem('bs-in')==='1'}catch(e){return false}}
function keepIn(session){try{localStorage.setItem('bs-in','1');if(session)localStorage.setItem('bs-session',session)}catch(e){}}
function callAuth(body){
  return fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)}).then(function(r){return r.json()});
}
function verifyPassword(pw,user){
  return callAuth({action:'login',username:user,password:pw}).then(function(j){
    if(j&&j.ok){keepIn(j.session);return {ok:true}}
    if(j&&j.error==='unknown action')return {ok:false,error:'That username or password did not work. Try again.'};
    return {ok:false,error:(j&&j.error)||'That username or password did not work. Try again.'};
  });
}
function createLogin(user,pw,code){
  return callAuth({action:'signup',username:user,password:pw,code:code}).then(function(j){
    if(j&&j.ok){keepIn(j.session);return {ok:true}}
    if(j&&j.error==='unknown action')return {ok:false,error:'Joining is not set up yet. Ask the owner to add you.'};
    return {ok:false,error:(j&&j.error)||'Could not create the login. Try again.'};
  });
}
function enterBoard(el){
  var w=document.querySelector('.wrap'),calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  _init();
  if(calm){el.remove();return}
  el.classList.add('out');if(w)w.classList.add('arrive');
  setTimeout(function(){el.remove();if(w)w.classList.remove('arrive')},650);
}
function pwField(id,label,auto){
  return '<div class="fld"><label for="'+id+'">'+label+'</label><div class="pwrow"><input id="'+id+'" type="password" autocomplete="'+auto+'"><button type="button" class="pwshow" data-for="'+id+'">Show</button></div></div>';
}
function showLock(){
  var el=document.createElement('div');el.id='lock';
  el.innerHTML='<div class="lockcard"><div class="lockhead"><img src="logo.webp" width="360" height="180" alt="Baklava Story, freshly made with love"></div><div class="lockbody">'
   +'<form id="lockf" novalidate><h1 class="locktitle">Orders dashboard</h1>'
   +'<div class="fld"><label for="lockuser">Username</label><input id="lockuser" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></div>'
   +pwField('lockpw','Password','current-password')
   +'<p class="lockerr" id="lockerr" role="alert" hidden></p><button class="btn lockbtn" type="submit">Sign in</button>'
   +'<p class="lockalt">New here? <button type="button" class="pwshow" id="goJoin">Create a login</button></p>'
   +'</form>'
   +'<form id="joinf" novalidate hidden><h1 class="locktitle">Create a login</h1>'
   +'<div class="fld"><label for="joinuser">Choose a username</label><input id="joinuser" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></div>'
   +pwField('joinpw','Choose a password (8 or more characters)','new-password')
   +'<div class="fld"><label for="joincode">Join code from the owner</label><input id="joincode" type="text" autocomplete="off" autocapitalize="none" spellcheck="false"></div>'
   +'<p class="lockerr" id="joinerr" role="alert" hidden></p><button class="btn lockbtn" type="submit">Create login</button>'
   +'<p class="lockalt"><button type="button" class="pwshow" id="goBack">Back to sign in</button></p></form>'
   +'</div></div>';
  document.body.appendChild(el);
  var lf=$('#lockf'),jf=$('#joinf');
  el.addEventListener('click',function(ev){
    var t=ev.target.closest&&ev.target.closest('.pwshow');if(!t)return;
    if(t.dataset.for){var i=$('#'+t.dataset.for),on=i.type==='password';i.type=on?'text':'password';t.textContent=on?'Hide':'Show';i.focus();return}
    if(t.id==='goJoin'){lf.hidden=true;jf.hidden=false;$('#joinuser').focus()}
    if(t.id==='goBack'){jf.hidden=true;lf.hidden=false;$('#lockuser').focus()}
  });
  function wire(form,errId,fields,run,idle){
    var er=$('#'+errId),btn=form.querySelector('.lockbtn');
    form.addEventListener('submit',function(ev){
      ev.preventDefault();er.hidden=true;
      for(var i=0;i<fields.length;i++){var f=fields[i],inp=$('#'+f[0]);if(!inp.value.trim()){er.textContent=f[1];er.hidden=false;inp.focus();return}}
      btn.disabled=true;btn.textContent=idle[1];
      run().then(function(r){
        if(r&&r.ok){enterBoard(el);return}
        er.textContent=(r&&r.error)||'That did not work. Try again.';er.hidden=false;
      }).catch(function(){er.textContent='Could not reach the server. Check the connection and try again.';er.hidden=false}).then(function(){btn.disabled=false;btn.textContent=idle[0]});
    });
  }
  wire(lf,'lockerr',[['lockuser','Enter your username.'],['lockpw','Enter your password.']],function(){return verifyPassword($('#lockpw').value,$('#lockuser').value)},['Sign in','Signing in']);
  wire(jf,'joinerr',[['joinuser','Choose a username.'],['joinpw','Choose a password.'],['joincode','Enter the join code from the owner.']],function(){return createLogin($('#joinuser').value,$('#joinpw').value,$('#joincode').value)},['Create login','Creating']);
  $('#lockuser').focus();
}
var _init=init;
init=function(){if(LOGIN_ON&&!signedIn()){showLock();return}_init()};
