/* Two steps when an order is tapped: first "Order ready" (texts the customer), then "Picked up".
   Picked up stays available as a smaller link, for customers who arrive before the order was marked ready. */
(function(){
  var st=document.createElement('style');
  st.textContent='.pop.stagepop{outline:none}'
   +'.pop.stagepop .sub{margin:0 0 4px}'
   +'.pop.stagepop .state{margin:0 0 18px;font-size:14px}'
   +'.pop.stagepop .state b{color:var(--ink);font-weight:600}'
   +'.pop.stagepop .primary{display:block;width:100%;text-align:center}'
   +'.pop.stagepop .stagenote{font-size:13px;margin:8px 0 0}'
   +'.pop.stagepop .minor{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:16px;font-size:14px}'
   +'.pop.stagepop .minor .link{font-size:14px;color:var(--ink2)}'
   ;
  document.head.appendChild(st);
})();
function readyTime(o){var t=String(o.ready||'').slice(11,16);return t?fmtT(t):''}
askPick=function(o){
  var el=$('#pop'),first=esc(o.name.split(' ')[0]),r=!!o.ready,paid=isPaid(o);
  var state=(r?'<b>Ready'+(readyTime(o)?' since '+readyTime(o):'')+'</b>':'Not ready yet')+', '+(paid?'<b>paid</b>':'not paid');
  el.innerHTML='<div class="pop stagepop" role="dialog" aria-modal="true" aria-label="Order for '+esc(o.name)+'" tabindex="-1" data-stage="'+o.id+'"><h3>'+esc(o.name)+'</h3>'
   +'<p class="sub">'+fmtT(o.time)+', '+esc(labelItems(o))+'</p><p class="state">'+state+'</p>'
   +(r?'<button class="btn primary" data-act="popyes" data-id="'+o.id+'">Picked up</button>'
      :'<button class="btn primary" data-act="stready" data-id="'+o.id+'">Order ready</button>')
   +(!r&&textsOn(o)?'<p class="stagenote">Sends '+first+' a text that it is ready for pickup.</p>':'')
   +'<div class="minor">'
   +(r?'<button class="link" data-act="readytoggle2" data-id="'+o.id+'">Undo ready</button>'
      :'<button class="link" data-act="popyes" data-id="'+o.id+'">Picked up already</button>')
   +'<button class="link" data-act="paidtoggle" data-id="'+o.id+'">'+(paid?'Mark not paid':'Mark paid')+'</button>'
   +'<button class="link danger" data-act="popcancel" data-id="'+o.id+'">Cancel order</button>'
   +'<button class="link" data-act="popno">Back</button></div></div>';
  el.hidden=false;el.querySelector('.pop').focus();
};
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-act="stready"],[data-act="readytoggle2"]');if(!b)return;
  ev.stopPropagation();
  var o=orders.find(function(x){return x.id===b.dataset.id});if(!o)return;
  if(b.dataset.act==='stready'){closePop();markReady(o,true)}
  else{markReady(o,false);askPick(o)}
},true);
/* After "Mark paid" inside this popup, redraw it so the state line updates. */
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('.stagepop [data-act="paidtoggle"]');if(!b)return;
  var o=orders.find(function(x){return x.id===b.dataset.id});if(o)askPick(o);
});
(function(){var h=document.querySelector('.help');if(h&&h.firstChild&&h.firstChild.nodeType===3)h.firstChild.nodeValue=h.firstChild.nodeValue.replace('Tap an order to cross it out when it is picked up.','Tap an order to mark it ready or picked up.')})();
