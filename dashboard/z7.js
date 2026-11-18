/* Nothing typed is ever lost. Every order change is written to an outbox on this device before it is sent.
   If the page reloads, closes, or loses internet before Google confirms, the change is shown again and
   re-sent the next time the dashboard opens. A small line shows "Saving" until everything is in the Sheet. */
var OUTBOX_KEY='bs-outbox',OUTBOX_ACTS=/^(upsert|status|patch|ready|confirm|delete)$/;
function obRead(){try{return JSON.parse(localStorage.getItem(OUTBOX_KEY)||'[]')||[]}catch(e){return []}}
function obWrite(a){try{localStorage.setItem(OUTBOX_KEY,JSON.stringify(a))}catch(e){}}
function obAdd(body){var k='w'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),a=obRead();a.push({k:k,b:body,t:Date.now()});obWrite(a);return k}
function obDrop(k){obWrite(obRead().filter(function(x){return x.k!==k}))}
var inflight=0;
function saveLine(){
  var el=$('#savestate');
  if(!el){var s=$('#sync');if(!s)return;s.insertAdjacentHTML('afterend','<p class="sync" id="savestate" aria-live="polite"></p>');el=$('#savestate')}
  var n=obRead().length;
  el.textContent=n?(navigator.onLine===false?'Offline. '+n+(n===1?' change':' changes')+' will save when the connection is back.':'Saving '+n+(n===1?' change':' changes')+'...'):'';
}
var _api7=api;
api=function(body){
  body=body||{};
  if(!OUTBOX_ACTS.test(body.action||'')||body._replay)return _api7(body);
  var k=obAdd(body);inflight++;saveLine();
  return _api7(body).then(function(j){obDrop(k);inflight--;saveLine();return j},function(e){
    inflight--;
    /* the server said no (bad data, old script): drop it, the error is shown. A dropped connection: keep it for later. */
    if(!/^(NET|BUSY)$/.test(String(e&&e.message)))obDrop(k);
    saveLine();throw e;
  });
};
/* On open: put unsaved new or edited orders back on the board, then send everything still waiting. */
var replaying=false,preReg={};
function replayOutbox(){
  if(replaying||!configured||!signedIn())return;
  var a=obRead();if(!a.length){saveLine();return}
  replaying=true;
  var chain=Promise.resolve();
  a.forEach(function(x){
    chain=chain.then(function(){
      var b=Object.assign({},x.b,{_replay:1});delete b.token;
      var fin=preReg[x.k];delete preReg[x.k];
      return _api7(b).then(function(){obDrop(x.k);if(fin)fin()},function(e){if(fin)fin();if(!/^(NET|BUSY)$/.test(String(e&&e.message)))obDrop(x.k);else throw e});
    });
  });
  chain.catch(function(){}).then(function(){replaying=false;saveLine();load()});
}
(function(){
  var a=obRead();
  a.forEach(function(x){
    var b=x.b;
    if(b.action==='upsert'&&b.row&&b.row.id){
      putLocal(fromRow(b.row));
      var w=pendingW[b.row.id]||(pendingW[b.row.id]={n:0,done:0,gone:false});w.n++;
      preReg[x.k]=function(){w.n--;if(w.n<=0){w.n=0;w.done=Date.now()}};
    }
  });
  setTimeout(function(){saveLine();replayOutbox()},1500);
})();
setInterval(function(){if(obRead().length&&!inflight)replayOutbox()},15000);
window.addEventListener('online',function(){replayOutbox()});
window.addEventListener('offline',saveLine);
/* Closing or reloading while something is still saving asks first (where the browser allows it). */
window.addEventListener('beforeunload',function(e){if(inflight>0){e.preventDefault();e.returnValue=''}});
