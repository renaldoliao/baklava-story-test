/* Partner invoices, readable at one glance: when it is due (day and time) comes first, then who it is for,
   every item on its own line with the piece count, the note, how to reach them, and where the order stands
   (not made yet, ready, picked up), whether it is paid, and whether the invoice has been emailed.
   Orders still to be picked up are listed first, soonest first. Finished ones follow, newest first. */
(function(){
  var st=document.createElement('style');
  st.textContent=
   '.ptn .row .inv .due{display:block;font:700 19px/1.15 var(--f-head);letter-spacing:0}'
  +'.ptn .row .inv .at{display:block;font-weight:700;font-size:16px;margin-top:2px}'
  +'.ptn .row .inv .dueword{display:block;font-weight:600;font-size:13px;color:var(--ink2);margin-bottom:2px}'
  +'.ptn .row .inv .dueword.soon{color:var(--ink)}'
  +'.ptn .row .inv small.no{display:block;margin-top:10px;font-weight:400;font-size:13px;color:var(--ink2)}'
  +'.ptn .row .what .ln{display:block;font-size:16px;color:var(--ink);padding:1px 0}'
  +'.ptn .row .what .ln i{font-style:normal;color:var(--ink2)}'
  +'.ptn .row .what .sum{display:block;font-size:14px;color:var(--ink2);margin:3px 0 0}'
  +'.ptn .row .what .meta{display:block;font-size:14px;color:var(--ink2);margin-top:6px}'
  +'.ptn .row .what .note{display:block;font-size:15px;color:var(--ink);margin-top:6px;font-style:italic}'
  +'.ptn .row .amt .stage{display:block;font-weight:700;font-size:14px;margin-top:6px}'
  +'.ptn .row .amt .stage.go{color:var(--ink)}'
  +'.ptn .row .amt .stage.done{color:var(--ink2);font-weight:500}'
  +'.ptn .row .amt .mailed{display:block;font-weight:400;font-size:13px;color:var(--ink2);margin-top:2px}'
  +'.ptn .row.over .inv .dueword{color:#000;font-weight:700}'
  /* a paid order can still be waiting to be picked up, so the day and time are never crossed out */
  +'.ptn .row .inv,.ptn .row.paid .inv{text-decoration:none;color:var(--ink)}'
  +'.ptn .row.paid .inv small.no{text-decoration:line-through;text-decoration-thickness:2px;color:var(--ink2)}'
  +'@media(min-width:601px) and (max-width:1100px){.ptn .row{grid-template-columns:128px 1fr auto}}';
  document.head.appendChild(st);
})();

var _pHtml12=partnersHtml;
partnersHtml=function(){
  var h=_pHtml12.apply(this,arguments);
  if(!ploaded&&!pHad)return h;
  var a=h.indexOf('<h3>Invoices</h3>'),b=h.indexOf('<h3>Partners</h3>');
  if(a<0||b<0||b<a)return h;
  var tk=key(new Date()),tm=key(new Date(Date.now()+86400000));
  function boardOf(o){return orders.find(function(x){return x.id==='po'+o.id})}
  function picked(o){var r=boardOf(o);return !!(r&&r.status==='picked')}
  function when(o){return String(o.date).slice(0,10)+' '+String(o.time||'10:00').slice(0,5)}
  var all=pdata.porders.slice();
  var open=all.filter(function(o){return !picked(o)}).sort(function(x,y){return when(x)<when(y)?-1:1});
  var done=all.filter(picked).sort(function(x,y){return when(x)<when(y)?1:-1});
  var rows=open.concat(done).map(function(o){
    var p=partnerOf(o.partner)||{name:'(removed partner)'},arm=parmed===o.id,r=boardOf(o),pk=!!(r&&r.status==='picked');
    var d=String(o.date).slice(0,10),t=String(o.time||'10:00').slice(0,5),dd=fromKey(d);
    var word=d===tk?'Today':d===tm?'Tomorrow':dd.toLocaleDateString('en-US',{weekday:'long'});
    var late=!pk&&d<tk;
    var its=parseItems(o.items).items||[],pcs=its.reduce(function(s,i){return s+(+prodOf(i.code).pieces||0)*i.qty},0),boxes=its.reduce(function(s,i){return s+i.qty},0);
    var lines=its.map(function(i){var q=prodOf(i.code);return '<span class="ln"><b style="display:inline">'+i.qty+' x</b> '+esc(q.name)+'</span>'}).join('');
    var contact=[p.contact,p.phone].filter(Boolean).join(', ');
    var meta=[contact,p.address].filter(Boolean).map(function(x){return '<span class="meta">'+esc(x)+'</span>'}).join('');
    var stage=pk?'<span class="stage done">Picked up</span>':(r&&r.ready)?'<span class="stage go">Ready</span>':'<span class="stage">Not made yet</span>';
    var mailed=o.sent?'<span class="mailed">Emailed '+esc(shortDay(o.sent.slice(0,10)))+'</span>':'<span class="mailed">Not emailed yet</span>';
    return '<div class="row'+(late?' over':'')+'"><div class="inv"><span class="dueword'+(d===tk||d===tm||late?' soon':'')+'">'+(late?'Was due '+word:word)+'</span>'
     +'<span class="due">'+esc(shortDay(d))+'</span><span class="at">'+esc(fmtT(t))+'</span><small class="no">'+esc(o.invoice)+'</small></div>'
     +'<div class="what"><b>'+esc(p.name)+'</b>'+lines
     +'<span class="sum">'+boxes+(boxes===1?' item':' items')+(pcs?', '+pcs+' pieces':'')+'</span>'
     +(o.note?'<span class="note">'+esc(o.note)+'</span>':'')+meta+'</div>'
     +'<div class="amt"><span class="amtn">'+money(+o.total||0)+'</span><br>'+(o.paid?'<span class="ispaid">Paid</span>':'<span class="unpaid">Unpaid</span>')+stage+mailed+'</div>'
     +'<div class="acts2"><button class="link" data-act="pinv" data-id="'+o.id+'">View invoice</button>'
     +'<button class="link" data-act="pmail" data-id="'+o.id+'">'+(arm?'Tap again to email '+esc(p.email||''):'Email invoice')+'</button>'
     +'<button class="link" data-act="ppaid" data-id="'+o.id+'">'+(o.paid?'Mark unpaid':'Mark paid')+'</button>'
     +'<button class="link" data-act="pedit" data-id="'+o.id+'">Edit</button></div></div>';
  }).join('');
  return h.slice(0,a)+'<h3>Invoices</h3>'+(rows||'<p class="empty">No partner orders yet. Add a partner, then make their first order.</p>')+h.slice(b);
};
