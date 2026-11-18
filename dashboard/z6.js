/* Staying fresh and never undoing someone else's change.
   1. Paid is saved on its own (it no longer re-sends the whole order, which could carry an old "not picked up").
   2. A failed pickup or paid change snaps back on screen instead of pretending it saved.
   3. The board checks the Sheet every 8 seconds, and right away when the iPad wakes or the tab comes back. */
SAFE_RETRY=/^(upsert|status|ready|confirm|seen|delete|closeDay|saveNote|partnerPaid|deletePartnerOrder|saveProducts|patch)$/;
trackWrite=function(body){
  var a=body.action,id=a==='upsert'?body.row&&body.row.id:/^(delete|status|ready|confirm|patch)$/.test(a)?body.id:'';
  if(!id)return null;
  var w=pendingW[id]||(pendingW[id]={n:0,done:0,gone:false});
  w.n++;w.done=0;if(a==='delete'||(a==='status'&&body.status==='cancelled'))w.gone=true;
  return function(){w.n--;if(w.n<=0){w.n=0;w.done=Date.now()}};
};
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-act="paidtoggle"]');if(!b)return;
  ev.stopPropagation();
  var o=orders.find(function(x){return x.id===b.dataset.id});if(!o)return;
  var prev=o.paid;o.paid=isPaid(o)?'none':'paid';
  function redraw(){
    renderBoard();
    if($('#pop .stagepop'))askPick(o);
    else{var l=document.querySelector('#pop .paidline');if(l)l.outerHTML=paidLine(o)}
  }
  redraw();toast(o.name+(isPaid(o)?' marked as paid':' marked as not paid'));
  if(!configured)return;
  api({action:'patch',id:o.id,fields:{paid:o.paid}}).catch(function(e){
    if(/unknown action/i.test(String(e&&e.message)))return save(o);
    throw e;
  }).catch(function(e){o.paid=prev;redraw();writeFail(e)});
},true);
toggle=function(id){
  var o=orders.find(function(x){return x.id===id});if(!o)return;
  var prev=o.status;o.status=o.status==='picked'?'new':'picked';flash(id);renderBoard();
  if(configured)api({action:'status',id:id,status:o.status}).catch(function(e){o.status=prev;renderBoard();writeFail(e)});
};
var _load6=load,loadBusy=false;
load=function(){
  if(loadBusy)return Promise.resolve();
  loadBusy=true;
  return _load6().then(function(){loadBusy=false},function(){loadBusy=false});
};
function quickCheck(){if(!document.hidden&&signedIn()&&(!state.sheet||state.sheet.type!=='order'))load()}
setInterval(quickCheck,8000);
document.addEventListener('visibilitychange',function(){if(!document.hidden)quickCheck()});
window.addEventListener('focus',quickCheck);
window.addEventListener('online',quickCheck);
