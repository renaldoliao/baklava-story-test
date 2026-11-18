/* iPad: every tap target is at least 44px (the visible text stays the same size), taps answer instantly,
   and paid partner invoices are crossed out. The cross-out fades in when an invoice is marked paid and
   fades out when it is marked unpaid, instead of the whole list redrawing. */
(function(){
  var st=document.createElement('style');
  st.textContent=
   'html{-webkit-tap-highlight-color:transparent}'
  +'button,[data-act],a,label,input,select,textarea{touch-action:manipulation}'
  +'button,[data-act]{-webkit-user-select:none;user-select:none}'
  /* paid invoices */
  +'.ptn .row .inv,.ptn .row .what b,.ptn .row .what span,.ptn .row .amt .amtn{text-decoration:line-through;text-decoration-thickness:2px;text-decoration-color:transparent;transition:text-decoration-color .28s ease,color .28s ease}'
  +'.ptn .row.paid .inv,.ptn .row.paid .what b,.ptn .row.paid .what span,.ptn .row.paid .amt .amtn{text-decoration-color:currentColor;color:var(--ink2)}'
  +'.ptn .row.paid .inv small{text-decoration:none}'
  +'.ptn .row .ispaid,.ptn .row .unpaid{transition:background-color .28s ease,color .28s ease}'
  /* press feedback and hit areas on touch screens */
  +'@media(pointer:coarse){'
  +'.tabs button{min-height:48px}'
  +'.tabs button,.tabbar button,.btn,.link,[data-act="edit"],[data-act="numbers"],[data-act="signout"],[data-act="export"],[data-act="prev"],[data-act="next"],[data-act="ppartner"],.ptn .row .acts2 button{position:relative}'
  +'.link::after,[data-act="edit"]::after,[data-act="export"]::after,.ptn .row .acts2 button::after{content:"";position:absolute;left:-10px;right:-10px;top:-12px;bottom:-12px}'
  +'.ptn .row .acts2{gap:12px 22px;margin-top:2px}'
  +'.ptn .phead{gap:14px 26px}'
  +'.ptn .phead .btn{min-height:52px;padding-left:24px;padding-right:24px}'
  +'.ptn .row{padding:16px 0}'
  +'.ptn .prow{min-height:64px;padding:14px 0;align-items:center}'
  +'.btn:active,.ptn .prow:active{opacity:.7}'
  +'.link:active{opacity:.55}'
  +'.ptn .prow,.btn{transition:opacity .08s}'
  +'}'
  /* iPad portrait and small landscape: keep the invoice line readable */
  +'@media(min-width:601px) and (max-width:1100px){.ptn .row{grid-template-columns:104px 1fr auto}}'
  +'@media(prefers-reduced-motion:reduce){.ptn .row .inv,.ptn .row .what b,.ptn .row .what span,.ptn .row .amt .amtn,.ptn .row .ispaid,.ptn .row .unpaid{transition:none}}';
  document.head.appendChild(st);
})();

/* wrap the amount so it can be crossed out without the Paid / Unpaid tag below it */
var _pHtml11=partnersHtml;
partnersHtml=function(){
  var h=_pHtml11.apply(this,arguments);
  return h.replace(/<div class="amt">([^<]*)<br>/g,'<div class="amt"><span class="amtn">$1</span><br>');
};

/* mark rows paid, and play the change only for the invoice that just changed */
var pPaidSeen=null;
var _renderBoard11=renderBoard;
renderBoard=function(){
  var r=_renderBoard11.apply(this,arguments);
  if(state.tab!=='partners'||!ploaded)return r;
  var now={},flip=[];
  Array.prototype.forEach.call(document.querySelectorAll('.ptn .row'),function(row){
    var b=row.querySelector('[data-act="pinv"]');if(!b)return;
    var id=b.dataset.id,o=pdata.porders.find(function(x){return x.id===id});if(!o)return;
    var paid=!!o.paid;now[id]=paid;
    if(pPaidSeen&&id in pPaidSeen&&pPaidSeen[id]!==paid&&!REDUCE){
      /* draw the old look first, then switch on the next frame so the change fades */
      if(!paid)row.classList.add('paid');
      flip.push([row,paid]);
    }else if(paid)row.classList.add('paid');
  });
  pPaidSeen=now;
  if(flip.length)requestAnimationFrame(function(){requestAnimationFrame(function(){
    flip.forEach(function(f){f[0].classList.toggle('paid',f[1])});
  })});
  return r;
};
