/* v2.1 (Studio 1801 test copy, Nov 19 2026). Loaded after z16.js, before j5.js.
   1. iPad held upright: the week board shows 3 days per row instead of running off the screen.
   2. Partners tab hidden: Tolgay keeps doing partner invoices in Square. The code stays, so it can come back.
   3. "Add an item" lists the tray name ("Small tray, Pistachio, $27.50") instead of "1 pieces, $27.50 (sp)".
   4. Prices: each order keeps the price it was made at (the new "prices" column), so changing a price
      no longer rewrites past sales in History and the report.
   5. History and the report no longer count orders still waiting to be confirmed.
   6. (v2.1 Rewards, replaced by The Layer Card in z18.js) */

(function(){
  var st=document.createElement('style');
  st.textContent=''
   /* 1. iPad portrait: 3 days per row */
   +'@media(min-width:701px) and (max-width:1023px){.spiral{min-width:0}.week{grid-template-columns:repeat(3,minmax(0,1fr));min-width:0}'
   +'.col{min-height:260px}.col:nth-child(3n+1){border-left:0}.col:nth-child(n+4){border-top:2px solid var(--ink)}}'
   /* 2. Partners tab hidden */
   +'.tabs button[data-t="partners"]{display:none!important}';
  document.head.appendChild(st);
  var nav=document.querySelector('.tabs'),bar=nav&&nav.querySelector('.tabbar');
})();

/* 3. Tray names in the "Add an item" list. The list is rebuilt by j4.js, so rename the options each time it changes. */
(function(){
  function fix(sel){
    Array.prototype.forEach.call(sel.options,function(o){
      if(!o.value||o.dataset.v21)return;var p=prodOf(o.value);if(!p||!p.name)return;
      o.dataset.v21='1';o.textContent=p.name+(isStaff()?'':', '+money(p.price));
    });
    Array.prototype.forEach.call(sel.querySelectorAll('optgroup'),function(g){if(g.children.length===1&&g.label===prodOf(g.children[0].value).name)g.label=''});
  }
  new MutationObserver(function(){var s=document.getElementById('f-add');if(s)fix(s)}).observe(document.body,{childList:true,subtree:true});
})();

/* 4. Price at the time of the order. */
var _fromRow17=fromRow;
fromRow=function(r){var o=_fromRow17(r);try{o.prices=JSON.parse(String(r.prices||'{}'))||{}}catch(e){o.prices={}}return o};
var _total17=total;
total=function(o){
  if(o&&o.source!=='partner'&&o.prices&&Object.keys(o.prices).length)
    return o.items.reduce(function(s,i){var c=String(i.code).toUpperCase(),p=o.prices[c];return s+(p!=null?+p:(+prodOf(i.code).price||0))*i.qty},0);
  return _total17(o);
};

/* 5. History and the report count confirmed orders only. */
var NOTE_OLD='Booked uses the current prices from the Products tab.',
    NOTE_NEW='Booked uses the price at the time of each order. Orders waiting to be confirmed are not counted.';
function withoutPending17(fn,args){
  var keep=orders;orders=orders.filter(function(o){return o.status!=='pending'});
  try{return fn.apply(null,args)}finally{orders=keep}
}
var _histHtml17=histHtml;
histHtml=function(){return String(withoutPending17(_histHtml17,arguments)).split(NOTE_OLD).join(NOTE_NEW)};
var _reportHtml17=reportHtml;
reportHtml=function(L){return String(_reportHtml17((L||[]).filter(function(o){return o.status!=='pending'}))).split(NOTE_OLD).join(NOTE_NEW)};

/* 6. Rewards moved to z18.js in v2.2 (The Layer Card). */
