/* Saving reliability: a dropped connection or a busy Google server is retried automatically (safe actions only),
   and when a save really fails the message says why instead of always blaming the internet. */
var SAFE_RETRY=/^(upsert|status|ready|confirm|seen|delete|closeDay|saveNote|partnerPaid|deletePartnerOrder|saveProducts)$/;
var lastSaveErr=null;
function saveWhy(e){
  var m=String(e&&e.message||e||'');
  if(/unknown action/i.test(m))return 'The spreadsheet script is out of date. Paste the latest Code.gs and deploy a new version.';
  if(/only the owner/i.test(m))return m;
  if(/^(NET|BUSY)$/.test(m))return 'Not saved. The connection dropped or Google was busy. Try again in a moment.';
  if(m)return 'Not saved: '+m;
  return 'Not saved. Try again in a moment.';
}
var _api5=api;
api=function(body){
  var tries=0;
  function once(){
    tries++;
    return fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({token:TOKEN},body))})
      .catch(function(){throw new Error('NET')})
      .then(function(r){return r.text()})
      .then(function(t){var j;try{j=JSON.parse(t)}catch(e){throw new Error('BUSY')}if(j.error)throw new Error(j.error);return j})
      .catch(function(e){
        var transient=/^(NET|BUSY)$/.test(e.message);
        if(transient&&tries<3&&SAFE_RETRY.test(body.action||''))return new Promise(function(r){setTimeout(r,tries*1200)}).then(once);
        lastSaveErr=e;throw e;
      });
  }
  return once();
};
writeFail=function(e){toast(saveWhy(e&&e.message?e:lastSaveErr))};

/* No more "it came back": the board refreshes from the Sheet every 20 seconds, and a refresh could land
   while a change was still being written. Changes still saving (or saved after that refresh started)
   now win over the refresh, so a cancelled order stays gone and an edit stays put. */
var pendingW={};
function trackWrite(body){
  var a=body.action,id=a==='upsert'?body.row&&body.row.id:/^(delete|status|ready|confirm)$/.test(a)?body.id:'';
  if(!id)return null;
  var w=pendingW[id]||(pendingW[id]={n:0,done:0,gone:false});
  w.n++;w.done=0;if(a==='delete'||(a==='status'&&body.status==='cancelled'))w.gone=true;
  return function(){w.n--;if(w.n<=0){w.n=0;w.done=Date.now()}};
}
var _api6=api;
api=function(body){
  var fin=trackWrite(body||{});
  var p=_api6(body);
  if(fin)p.then(fin,fin);
  return p;
};
load=function(){
  var started=Date.now();
  return loadProducts().then(loadNotes).then(function(){return fetch(API_URL+'?action=list&token='+encodeURIComponent(TOKEN))}).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);
    var first=!loaded,known={},mine={};orders.forEach(function(o){known[o.id]=1;mine[o.id]=o});
    if(Array.isArray(j.closed)&&!closeBusy){shutDays={};j.closed.forEach(function(d){shutDays[d]=1})}
    var fresh=j.rows.filter(function(r){return r.id&&String(r.status).toLowerCase()!=='cancelled'}).map(fromRow);
    Object.keys(pendingW).forEach(function(id){
      var w=pendingW[id];
      if(w.n===0&&w.done&&started>w.done){delete pendingW[id];return}
      var i=fresh.findIndex(function(o){return o.id===id});
      if(w.gone){if(i>=0)fresh.splice(i,1);return}
      if(mine[id]){if(i>=0)fresh[i]=mine[id];else fresh.push(mine[id])}
    });
    orders=fresh;loaded=true;live=true;why='';state.go=false;
    var nw=orders.filter(function(o){return o.status==='pending'&&!known[o.id]});
    if(!first&&nw.length){toast(nw.length>1?nw.length+' new online orders to confirm':'New online order from '+nw[0].name+', confirm it');chime()}
    renderBoard();
  }).catch(function(e){why=(e&&e.message)||'could not reach it';if(!loaded)fallback();else{live=false;renderBoard()}});
};

/* Cancel keeps a record: the order is marked cancelled in the Orders tab (greyed and struck through there)
   instead of being erased, and it disappears from the board, bake lists and reports. */
remove=function(id){
  orders=orders.filter(function(o){return o.id!==id});
  return configured?api({action:'status',id:id,status:'cancelled'}):Promise.resolve();
};
/* The edit form's delete button does the same thing now, so it says so. */
var _formHtml5=formHtml;
formHtml=function(o,isEdit){return _formHtml5(o,isEdit).replace('id="delbtn">Delete order<','id="delbtn">Cancel this order<')};
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('#delbtn');if(b)setTimeout(function(){if(b.textContent==='Tap again to delete')b.textContent='Tap again to cancel'},0)});
var _toast5=toast;
toast=function(m){return _toast5(m==='Order deleted'?'Order cancelled':m)};
