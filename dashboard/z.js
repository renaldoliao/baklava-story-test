/* Tolgay's requests: "New order" wording, a Paid mark on orders, and a Call button. Loaded after y.js, before j5.js. */
(function(){
  var st=document.createElement('style');
  st.textContent='.paidtag{display:inline-block;margin-left:8px;padding:0 6px;font:700 11px/1.6 var(--f-ui);background:#fde047;color:#000}'
   +'.ent.picked .paidtag{opacity:.6}'
   +'.pop .paidline{display:flex;align-items:center;gap:12px;margin:-4px 0 16px;font-size:15px}'
   +'.pop .paidline b{font-weight:700}'
   +'.pop .paidline .link{font-size:14px}';
  document.head.appendChild(st);
})();
function isPaid(o){return o&&o.paid==='paid'}

/* Rename "Write an order" everywhere it is drawn. */
var _renderBoard=renderBoard;
renderBoard=function(){
  _renderBoard.apply(this,arguments);
  Array.prototype.forEach.call(document.querySelectorAll('#view [data-act="add"]'),function(b){b.textContent=b.classList.contains('addline')?'+ New order':'New order'});
};
var _renderSheet=renderSheet;
renderSheet=function(){
  _renderSheet.apply(this,arguments);
  var h=document.querySelector('#layer .sheet h2');if(h&&h.textContent==='Write an order')h.textContent='New order';
  Array.prototype.forEach.call(document.querySelectorAll('#layer [data-act="add"]'),function(b){b.textContent='New order'});
};

/* Paid: a yellow tag on the order, a checkbox in the order form, and a switch in the pickup popup. */
var _srcTag=srcTag;
srcTag=function(o){return _srcTag(o)+(isPaid(o)?'<span class="paidtag">Paid</span>':'')};
var _formHtml=formHtml;
formHtml=function(o,isEdit){
  var h=_formHtml(o,isEdit),at=h.indexOf('<div class="fld"><label for="f-note">');
  if(at<0)return h;
  return h.slice(0,at)+'<div class="fld"><label class="chk"><input type="checkbox" id="f-paid"'+(isPaid(o)?' checked':'')+'><span>Paid already<small class="chkn">Tick when the customer paid in advance.</small></span></label></div>'+h.slice(at);
};
var _save=save;
save=function(o,text){
  var c=document.getElementById('f-paid');
  if(c&&state.sheet&&state.sheet.type==='order')o.paid=c.checked?'paid':'none';
  return _save(o,text);
};
function paidLine(o){
  return '<p class="paidline">'+(isPaid(o)?'<b>Paid</b>':'<span>Not paid yet</span>')+'<button type="button" class="link" data-act="paidtoggle" data-id="'+o.id+'">'+(isPaid(o)?'Mark as not paid':'Mark as paid')+'</button></p>';
}
function addPaidLine(o){var a=document.querySelector('#pop .pop .acts');if(a)a.insertAdjacentHTML('beforebegin',paidLine(o))}
var _askPick=askPick;askPick=function(o){_askPick(o);addPaidLine(o)};
var _askUndo=askUndo;askUndo=function(o){_askUndo(o);addPaidLine(o)};
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-act="paidtoggle"]');if(!b)return;
  var o=orders.find(function(x){return x.id===b.dataset.id});if(!o)return;
  o.paid=isPaid(o)?'none':'paid';
  save(o).catch(writeFail);
  renderBoard();
  var line=b.closest('.paidline');if(line)line.outerHTML=paidLine(o);
  toast(o.name+(isPaid(o)?' marked as paid':' marked as not paid'));
});

/* Call a customer. The dashboard runs on an iPad, which cannot place phone calls itself, so Call opens
   Google Voice with the customer's number filled in. Calls go out from the bakery's Google Voice number. */
(function(){
  var st=document.createElement('style');
  st.textContent='.ent .side{display:flex;flex-direction:column;align-items:flex-end;flex:none}'
   +'.ent .side .ed,.ent .side .conf{min-height:0}'
   +'.ent .callbtn{font:500 14px/1.2 var(--f-ui);color:var(--ink);text-decoration:underline;text-underline-offset:3px;padding:10px 12px 10px 0;min-height:44px}'
   +'.pop .callnum{font:700 26px/1.2 var(--f-head);color:var(--ink);margin:6px 0 16px;font-variant-numeric:tabular-nums}'
   +'.pop .callacts{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}'
   +'.pop .callacts .btn{text-decoration:none;display:inline-block}'
   +'.pop .callnote{font-size:13px;color:var(--ink2);margin:14px 0 0}';
  document.head.appendChild(st);
})();
function gvLink(phone){var d=usDigits(phone);return 'https://voice.google.com/u/0/calls?a=nc,%2B1'+d}
function addCallButtons(){
  Array.prototype.forEach.call(document.querySelectorAll('#view .ent'),function(ent){
    if(ent.querySelector('.callbtn'))return;
    var act=ent.querySelector('.ed,.conf');if(!act)return;
    var o=orders.find(function(x){return x.id===act.dataset.id});if(!o||!usOk(o.phone))return;
    var side=document.createElement('div');side.className='side';
    act.parentNode.insertBefore(side,act);side.appendChild(act);
    side.insertAdjacentHTML('beforeend','<button type="button" class="callbtn" data-act="callcust" data-id="'+o.id+'" aria-label="Call '+esc(o.name)+'">call</button>');
  });
}
var _renderBoard2=renderBoard;
renderBoard=function(){_renderBoard2.apply(this,arguments);addCallButtons()};
function askCall(o){
  var el=$('#pop');
  el.innerHTML='<div class="pop" role="dialog" aria-modal="true" aria-label="Call customer"><h3>Call '+esc(o.name.split(' ')[0])+'</h3><p class="callnum">'+esc(fmtPhone(o.phone))+'</p>'
   +'<div class="callacts"><a class="btn" id="pop-yes" href="'+gvLink(o.phone)+'" target="_blank" rel="noopener">Call with Google Voice</a><button type="button" class="link" data-act="copynum" data-num="'+esc(fmtPhone(o.phone))+'">Copy number</button><button type="button" class="link" data-act="popno">Back</button></div>'
   +'<p class="callnote">Rings from the bakery number, <span style="white-space:nowrap">(415) 766-7929</span>.</p></div>';
  el.hidden=false;$('#pop-yes').focus();
}
document.addEventListener('click',function(ev){
  var t=ev.target.closest&&ev.target.closest('[data-act="callcust"],[data-act="copynum"]');if(!t)return;
  ev.stopPropagation();
  if(t.dataset.act==='callcust'){var o=orders.find(function(x){return x.id===t.dataset.id});if(o)askCall(o);return}
  var n=t.dataset.num;
  (navigator.clipboard?navigator.clipboard.writeText(n):Promise.reject()).then(function(){toast('Copied '+n)},function(){toast(n)});
},true);

/* Owner and staff. The server decides the role and never sends prices to staff. This only tidies the screen:
   staff see the Week board, orders and bake lists, without History, Products, Week numbers or exports. */
(function(){
  var st=document.createElement('style');
  st.textContent='body.staff .tabs,body.staff [data-act="numbers"],body.staff [data-act="export"]{display:none!important}';
  document.head.appendChild(st);
})();
function cachedRole(){try{var v=localStorage.getItem('bs-role')||'',p=v.split('|');return p[0]&&p[0]===sessionCode()?p[1]:''}catch(e){return ''}}
function setRole(role,session){
  try{localStorage.setItem('bs-role',(session||sessionCode())+'|'+role)}catch(e){}
  applyRole(role);
}
function applyRole(role){
  var staff=role==='staff',was=document.body.classList.contains('staff');
  document.body.classList.toggle('staff',staff);
  if(staff&&state.tab!=='week'){state.tab='week';state.sheet=null;renderSheet();renderBoard();if(typeof setTabsUI==='function')setTabsUI()}
  else if(staff!==was&&state.sheet)renderSheet();
}
applyRole(cachedRole());
(function(){
  var f=window.fetch;
  window.fetch=function(u){
    var p=f.apply(this,arguments);
    if(String(u).indexOf(API_URL)!==0)return p;
    return p.then(function(res){
      res.clone().json().then(function(j){if(j&&(j.role==='staff'||j.role==='owner'))setRole(j.role,j.session)}).catch(function(){});
      return res;
    });
  };
})();

/* Ready for pickup. About 15 minutes before a confirmed order's pickup time the iPad asks whether it is ready.
   Marking it ready texts the customer once (only if they ticked the text box). Staff can also mark it from the order popup. */
(function(){
  var st=document.createElement('style');
  st.textContent='.readytag{display:inline-block;margin-left:8px;padding:0 6px;font:700 11px/1.6 var(--f-ui);background:#000;color:#fff}'
   +'.ent.picked .readytag{display:none}'
   +'.pop .readyline{display:flex;align-items:center;gap:12px;margin:-8px 0 16px;font-size:15px}'
   +'.pop .readyline b{font-weight:700}.pop .readyline .link{font-size:14px}'
   +'.pop .askwhen{font-size:15px;color:var(--ink2);margin:0 0 4px}'
   +'.pop .askitems{margin:0 0 16px}';
  document.head.appendChild(st);
})();
var _fromRow=fromRow;
fromRow=function(r){var o=_fromRow(r);o.ready=String(r.ready||'');o.optin=String(r.optin||'');return o};
var _toRow=toRow;
toRow=function(o){var r=_toRow(o);if(o.ready!==undefined)r.ready=o.ready||'';return r};
var _save3=save;
save=function(o,text){
  var old=orders.find(function(x){return x.id===o.id});
  if(old&&old!==o){if(o.ready===undefined)o.ready=old.ready;if(o.optin===undefined)o.optin=old.optin}
  return _save3(o,text);
};
var _srcTag2=srcTag;
srcTag=function(o){return _srcTag2(o)+(o.ready&&o.status!=='picked'?'<span class="readytag">Ready</span>':'')};
function textsOn(o){return o.optin==='yes'&&usOk(o.phone)}
function nowStamp(){var d=new Date();return key(d)+' '+pad(d.getHours())+':'+pad(d.getMinutes())}
function markReady(o,on){
  o.ready=on?nowStamp():'';
  renderBoard();
  if(configured)api({action:'ready',id:o.id,ready:!!on}).catch(function(){o.ready=on?'':nowStamp();renderBoard();writeFail()});
  toast(on?(o.name+' is ready'+(textsOn(o)?', text on its way':'')):(o.name+' is not ready'));
}
function readyLine(o){
  return '<p class="readyline">'+(o.ready?'<b>Ready</b>':'<span>Not ready yet</span>')+'<button type="button" class="link" data-act="readytoggle" data-id="'+o.id+'">'+(o.ready?'Undo ready':(textsOn(o)?'Mark ready and text':'Mark ready'))+'</button></p>';
}
var _askPick2=askPick;
askPick=function(o){_askPick2(o);var a=document.querySelector('#pop .pop .paidline')||document.querySelector('#pop .pop .acts');if(a&&o.status==='new')a.insertAdjacentHTML('beforebegin',readyLine(o))};

/* The 15 minute check. Runs every 30 seconds while the dashboard is open. */
var READY_LEAD=15,readySnooze={};
function readySkipped(){try{return JSON.parse(localStorage.getItem('bs-rdy-skip')||'{}')}catch(e){return {}}}
function skipReady(id){var s=readySkipped();s[id]=1;try{localStorage.setItem('bs-rdy-skip',JSON.stringify(s))}catch(e){}}
function minsUntil(o){var p=o.time.split(':'),n=new Date();return (+p[0]*60+ +p[1])-(n.getHours()*60+n.getMinutes())}
function askReady(o){
  var m=minsUntil(o),el=$('#pop');
  el.innerHTML='<div class="pop" role="dialog" aria-modal="true" aria-label="Is this order ready?" data-ask="'+o.id+'"><h3>Is '+esc(o.name.split(' ')[0])+'’s order ready?</h3>'
   +'<p class="askwhen">Pickup at '+fmtT(o.time)+(m>0?', in '+m+' min':m===0?', now':', '+(-m)+' min ago')+'</p><p class="askitems">'+esc(labelItems(o))+'</p>'
   +'<div class="acts"><button class="btn" data-act="askyes" data-id="'+o.id+'" id="pop-yes">'+(textsOn(o)?'Ready, text '+esc(o.name.split(' ')[0]):'Ready')+'</button><button class="link" data-act="asklater" data-id="'+o.id+'">Not yet</button><button class="link" data-act="askskip" data-id="'+o.id+'">Don’t ask again</button></div></div>';
  el.hidden=false;$('#pop-yes').focus();
}
function checkReady(){
  if(!loaded||state.sheet||!$('#pop').hidden||document.hidden)return;
  var tk=key(new Date()),skip=readySkipped(),now=Date.now();
  var due=orders.filter(function(o){
    if(o.date!==tk||o.status!=='new'||o.ready||skip[o.id]||(readySnooze[o.id]||0)>now)return false;
    var m=minsUntil(o);return m<=READY_LEAD&&m>=-60;
  }).sort(function(a,b){return a.time<b.time?-1:1});
  if(due.length)askReady(due[0]);
}
setInterval(checkReady,30000);setTimeout(checkReady,4000);
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-act="readytoggle"],[data-act="askyes"],[data-act="asklater"],[data-act="askskip"]');if(!b)return;
  ev.stopPropagation();
  var o=orders.find(function(x){return x.id===b.dataset.id});if(!o)return;
  var a=b.dataset.act;
  if(a==='readytoggle'){markReady(o,!o.ready);var l=b.closest('.readyline');if(l)l.outerHTML=readyLine(o);return}
  closePop();
  if(a==='askyes')markReady(o,true);
  else if(a==='asklater'){readySnooze[o.id]=Date.now()+5*60000;toast('Asking again in 5 minutes')}
  else skipReady(o.id);
},true);
