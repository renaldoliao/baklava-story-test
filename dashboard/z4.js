/* Motion polish: everything that appears now also leaves smoothly (popups, side sheets, toasts),
   redraws no longer replay entrance animations, and status tags confirm a change with a small pulse. */
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
(function(){
  var E='cubic-bezier(.2,.8,.2,1)',X='cubic-bezier(.4,0,1,1)';
  var st=document.createElement('style');
  st.textContent='@keyframes fadeout{to{opacity:0}}'
   +'@keyframes popout{to{opacity:0;transform:translateY(6px) scale(.97)}}'
   +'@keyframes slideout{to{opacity:0;transform:translateX(40px)}}'
   +'@keyframes sinkout{to{opacity:0;transform:translateY(8px)}}'
   +'@keyframes tagpulse{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08);opacity:1}100%{transform:none}}'
   +'@keyframes rowin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}'
   +'@keyframes swapin{from{opacity:.4}to{opacity:1}}'
   +'#pop.leaving{animation:fadeout .16s '+X+' forwards}#pop.leaving .pop{animation:popout .16s '+X+' forwards}'
   +'#pop.still .pop{animation:swapin .18s ease}'
   +'#layer.leaving .scrim{animation:fadeout .2s '+X+' forwards}#layer.leaving .sheet{animation:slideout .2s '+X+' forwards}'
   +'#layer.leaving .sheet.mid{animation:popout .18s '+X+' forwards}'
   +'#layer.still .sheet,#layer.still .scrim{animation:none}'
   +'.toast.out{animation:sinkout .2s '+X+' forwards}'
   +'.paidtag.pulse,.readytag.pulse{animation:tagpulse .38s '+E+'}'
   +'.ptn .row.fresh,.ptn .prow.fresh{animation:rowin .36s '+E+' both}'
   +'.ptn{animation:none}'
   +'@media(prefers-reduced-motion:reduce){#pop.leaving,#pop.leaving .pop,#layer.leaving .scrim,#layer.leaving .sheet,.toast.out,.paidtag.pulse,.readytag.pulse,.ptn .row.fresh,.ptn .prow.fresh{animation:none!important}}';
  document.head.appendChild(st);
})();

/* Popups: fade out on close. If new content arrives while closing, it simply stays open. */
var _closePop4=closePop,popTimer=0,popOpen=false,popQuiet=false;
closePop=function(){
  var el=$('#pop');
  if(el.hidden||REDUCE){_closePop4();return}
  el.classList.remove('still');el.classList.add('leaving');clearTimeout(popTimer);
  popTimer=setTimeout(function(){if(el.classList.contains('leaving')){popQuiet=true;el.classList.remove('leaving','still');_closePop4();popQuiet=false}},160);
};
(function(){
  var el=$('#pop');
  new MutationObserver(function(recs){
    var swapped=recs.some(function(r){return r.type==='childList'});
    if(swapped&&!popQuiet){
      if(el.classList.contains('leaving')){clearTimeout(popTimer);el.classList.remove('leaving')}
      else if(popOpen&&!el.hidden)el.classList.add('still');
    }
    if(el.hidden)el.classList.remove('still');
    popOpen=!el.hidden;
  }).observe(el,{childList:true,attributes:true,attributeFilter:['hidden']});
  /* opening a fresh popup should animate, so drop "still" whenever the popup was closed */
  var cp=closePop;closePop=function(){cp();setTimeout(function(){if($('#pop').hidden)$('#pop').classList.remove('still')},170)};
})();

/* Side sheets: slide out on close, and no replayed slide-in when the same sheet redraws. */
var _renderSheet4=renderSheet,sheetTimer=0;
renderSheet=function(){
  var L=$('#layer'),has=!!L.querySelector('.sheet');
  if(!state.sheet&&has&&!REDUCE){
    if(L.classList.contains('leaving'))return;
    L.classList.add('leaving');clearTimeout(sheetTimer);
    sheetTimer=setTimeout(function(){L.classList.remove('leaving');if(!state.sheet)_renderSheet4()},200);
    return;
  }
  clearTimeout(sheetTimer);
  var keep=has&&!L.classList.contains('leaving');
  L.classList.remove('leaving');
  if(keep)L.classList.add('still');
  var r=_renderSheet4.apply(this,arguments);
  if(keep)requestAnimationFrame(function(){requestAnimationFrame(function(){L.classList.remove('still')})});
  return r;
};

/* Toasts: rise in, sink out. A new message while one is showing just swaps the text. */
toast=function(m){
  var t=$('#toast'),showing=!t.hidden&&!t.classList.contains('out');
  t.textContent=m;t.classList.remove('out');
  if(!showing){t.hidden=true;void t.offsetWidth;t.hidden=false}
  clearTimeout(toast.t);clearTimeout(toast.h);
  toast.t=setTimeout(function(){
    if(REDUCE){t.hidden=true;return}
    t.classList.add('out');toast.h=setTimeout(function(){t.hidden=true;t.classList.remove('out')},200);
  },3200);
};

/* A small pulse on the Ready or Paid tag that just changed, and nowhere else. */
var pulseId='';
var _srcTag4=srcTag;
srcTag=function(o){
  var h=_srcTag4(o);
  return o.id===pulseId?h.replace('class="paidtag"','class="paidtag pulse"').replace('class="readytag"','class="readytag pulse"'):h;
};
function pulse(id){pulseId=id;setTimeout(function(){if(pulseId===id)pulseId=''},400)}
var _markReady4=markReady;
markReady=function(o,on){pulse(o.id);return _markReady4.apply(this,arguments)};
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('[data-act="paidtoggle"]');if(b)pulse(b.dataset.id)},true);

/* Partners: keep showing the list while it refreshes after a save, and let new rows rise in. */
var pHad=false,pSeen=null;
var _partnersHtml4=partnersHtml;
partnersHtml=function(){
  if(ploaded)pHad=true;
  if(!ploaded&&pHad){ploaded=true;var h0=_partnersHtml4();ploaded=false;return h0}
  return _partnersHtml4();
};
var _renderBoard4=renderBoard;
renderBoard=function(){
  var r=_renderBoard4.apply(this,arguments);
  if(state.tab==='partners'&&ploaded){
    var now={};
    Array.prototype.forEach.call(document.querySelectorAll('.ptn [data-act="pinv"],.ptn .prow'),function(b){
      var id=b.dataset.id;now[id]=1;
      if(pSeen&&!pSeen[id]){var row=b.closest('.row')||b;row.classList.add('fresh')}
    });
    pSeen=now;
  }
  return r;
};
