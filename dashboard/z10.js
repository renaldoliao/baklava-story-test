/* One line of changes, in order. Every change to an order (new, edit, ready, picked up, paid, cancel, confirm)
   goes into a queue kept on this device and is sent to the Sheet one at a time, in the order it was made.
   Google never receives two changes for the same moment at once, so they can never land in the wrong order.
   Tapping the same thing twice before it is sent keeps only the last tap. Until the Sheet has a change and the
   board has re-read the Sheet after that, the board keeps showing what was tapped, so nothing flips back.
   The queue survives reloads, closed tabs and lost wifi, and carries on where it left off. */
var Q_KEY='bs-q',Q_ACTS=/^(upsert|status|patch|ready|confirm|delete)$/;
var q=[],qBusy=false,qWait=0,qOffline=false,qAck={},qCb={},qFlight=null;
function qLoad(){try{q=JSON.parse(localStorage.getItem(Q_KEY)||'[]')||[]}catch(e){q=[]}q.forEach(function(x){delete x.sent})}
function qSave(){try{localStorage.setItem(Q_KEY,JSON.stringify(q))}catch(e){}}
function qId(b){return b.action==='upsert'?(b.row&&b.row.id):b.id}
function qField(b){return b.action==='upsert'?'row':b.action==='patch'?'patch:'+Object.keys(b.fields||{}).sort().join(','):b.action==='delete'?'status':b.action}
qLoad();
/* The saved copy of the board is read before Ready, the text opt-in and partner tags are known, which is why
   Ready vanished after a reload. Read it again now that they are. */
(function(){try{var c=JSON.parse(localStorage.getItem(CK)||'null');if(!c||!Array.isArray(c.rows))return;
  var by={};c.rows.forEach(function(r){if(r&&r.id)by[r.id]=r});
  orders=orders.map(function(o){return by[o.id]?fromRow(by[o.id]):o});
}catch(e){}})();
/* changes still waiting from the previous version move into the queue */
(function(){try{var old=obRead();if(old.length){old.forEach(function(x){var b=Object.assign({},x.b);delete b._replay;delete b.token;q.push({k:x.k,b:b})});obWrite([]);qSave()}}catch(e){}})();

function qHas(id){return q.some(function(x){return qId(x.b)===id})}
function qGone(id){
  var g=false;q.forEach(function(x){if(qId(x.b)!==id)return;if(x.b.action==='delete'||(x.b.action==='status'&&x.b.status==='cancelled'))g=true;else if(x.b.action==='upsert'||x.b.action==='status')g=false});
  return g;
}
api=(function(prev){return function(body){
  body=body||{};
  if(!Q_ACTS.test(body.action||'')||!configured)return prev(body);
  var b=JSON.parse(JSON.stringify(body));delete b.token;
  var id=qId(b),f=qField(b),k='q'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  /* a newer tap on the same thing replaces one that has not been sent yet */
  if(b.action!=='confirm'){
    for(var i=q.length-1;i>=0;i--){
      var x=q[i];if(x===qFlight||qId(x.b)!==id||qField(x.b)!==f)continue;
      if(f==='row'){var keepText=x.b.text===true;x.b=b;if(keepText)x.b.text=true;qSave();saveLine();var cb0=qCb[x.k];return new Promise(function(res,rej){qCb[x.k]={res:function(j){if(cb0)cb0.res(j);res(j)},rej:function(e){if(cb0)cb0.rej(e);rej(e)}}})}
      q.splice(i,1);if(qCb[x.k]){qCb[x.k].res({ok:true,replaced:true});delete qCb[x.k]}
    }
  }
  q.push({k:k,b:b});qSave();saveLine();
  var p=new Promise(function(res,rej){qCb[k]={res:res,rej:rej}});
  setTimeout(qPump,0);
  return p;
}})(api);

function qPump(){
  if(qBusy||!q.length||!configured||!signedIn()||Date.now()<qWait)return;
  qBusy=true;
  var x=q[0];qFlight=x;
  function drop(){var i=q.indexOf(x);if(i>=0)q.splice(i,1);qSave()}
  _api6(Object.assign({},x.b)).then(function(j){
    drop();qAck[qId(x.b)]=Date.now();qOffline=false;qWait=0;
    if(qCb[x.k]){qCb[x.k].res(j);delete qCb[x.k]}
    if(/^po/.test(String(qId(x.b)||''))&&/^(patch|status)$/.test(x.b.action)&&typeof syncPartnerTab==='function')syncPartnerTab();
  },function(e){
    var m=String(e&&e.message);
    if(/^(NET|BUSY)$/.test(m)){qOffline=true;qWait=Date.now()+5000;return}
    /* the Sheet refused it: drop it and put the screen back (the caller shows why) */
    drop();qAck[qId(x.b)]=Date.now();
    if(qCb[x.k]){qCb[x.k].rej(e);delete qCb[x.k]}else{writeFail(e);load()}
  }).then(function(){qBusy=false;qFlight=null;saveLine();if(q.length)setTimeout(qPump,qWait?Math.max(0,qWait-Date.now()):0)});
}
setInterval(qPump,2000);
window.addEventListener('online',function(){qWait=0;qPump()});
setTimeout(qPump,800);

/* Saving happens quietly in the background. The only message is when there is no connection, so nobody
   thinks a change is saved when it is not. The line takes no space when it is empty. */
var qSince=0;
saveLine=function(){
  var el=$('#savestate');
  if(!el){var s=$('#sync');if(!s)return;s.insertAdjacentHTML('afterend','<p class="sync" id="savestate" aria-live="polite" hidden></p>');el=$('#savestate')}
  var n=q.length,off=n&&(qOffline||navigator.onLine===false);
  el.textContent=off?'No connection. '+n+(n===1?' change is':' changes are')+' kept on this device and will save when it is back.':'';
  el.hidden=!off;
};
setInterval(saveLine,1000);

/* Merging a refresh: an order with a change still in the queue, or saved after this refresh was asked for,
   shows what was tapped. Everything else shows the Sheet. */
load8=function(){
  var started=Date.now();
  Promise.all([loadProducts(),loadNotes()]).then(function(){if(loaded&&!state.sheet)renderBoard()});
  return fetch(API_URL+'?action=list&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);
    var first=!loaded,known={},mine={};orders.forEach(function(o){known[o.id]=1;mine[o.id]=o});
    if(Array.isArray(j.closed)&&!closeBusy){shutDays={};j.closed.forEach(function(d){shutDays[d]=1})}
    var fresh=j.rows.filter(function(r){return r.id&&String(r.status).toLowerCase()!=='cancelled'}).map(fromRow),seen={};
    fresh=fresh.filter(function(o){
      seen[o.id]=1;
      return !(qHas(o.id)&&qGone(o.id));
    }).map(function(o){
      var hold=qHas(o.id)||(qAck[o.id]||0)>=started;
      return hold&&mine[o.id]?mine[o.id]:o;
    });
    /* new orders that have not reached the Sheet yet stay on the board */
    Object.keys(mine).forEach(function(id){if(!seen[id]&&(qHas(id)||(qAck[id]||0)>=started)&&!qGone(id))fresh.push(mine[id])});
    Object.keys(qAck).forEach(function(id){if(qAck[id]<started-60000)delete qAck[id]});
    orders=fresh;loaded=true;live=true;why='';state.go=false;
    var nw=orders.filter(function(o){return o.status==='pending'&&!known[o.id]});
    if(!first&&nw.length){toast(nw.length>1?nw.length+' new online orders to confirm':'New online order from '+nw[0].name+', confirm it');chime()}
    if(state.sheet&&state.sheet.type==='order')return;
    renderBoard();
  }).catch(function(e){why=(e&&e.message)||'could not reach it';if(!loaded)fallback();else{live=false;renderBoard()}});
};
