/* ---------- events ---------- */
document.addEventListener('click',function(ev){
  var hl=ev.target.closest('.ent .hl,.ent .en,.ent .circle');
  if(hl){var hb=hl.closest('[data-id]');if(hb){toggleMark(hb.dataset.id+(hl.classList.contains('en')?'n':hl.classList.contains('circle')?'c':''),hl);return}}
  var el=ev.target.closest('[data-act]');if(!el)return;
  var a=el.dataset.act,id=el.dataset.id;
  switch(a){
    case 'tab':switchTab(el.dataset.t);break;
    case 'confirm':confirmOrder(id);break;
    case 'opennew':{var w=orders.find(function(x){return x.id===id});if(!w)break;state.tab='week';state.week=mondayOf(fromKey(w.date));state.sheet={type:'order',id:id};state.confirmDel=false;renderBoard();renderSheet();break}
    case 'range':state.range=el.dataset.r;state.hmax=50;state.go=true;renderBoard();break;
    case 'metric':state.metric=el.dataset.m;state.go=true;renderBoard();break;
    case 'export':ex=exDefaults(el.dataset.s);state.sheet={type:'export'};renderSheet();exPreview();break;
    case 'exchip':{var rr=exRange(el.dataset.r);ex.from=rr[0];ex.to=rr[1];$('#ex-from').value=ex.from;$('#ex-to').value=ex.to;exPreview();break}
    case 'exgo':{var xl=exList();if(!xl.length){toast('No orders match those filters');break}if(el.dataset.f==='pdf')openReport(reportHtml(xl));else downloadCsv(xl);state.sheet=null;renderSheet();break}
    case 'hmore':state.hmax+=100;fillList();break;
    case 'cmore':state.cmax=1e9;fillCust();break;
    case 'cust':state.sheet={type:'cust',k:el.dataset.k};renderSheet();break;
    case 'custrepeat':{
      var cl=custOrders(el.dataset.k);if(!cl.length)break;
      var lo=cl[0],keep=lo.items.filter(function(i){var p=findProd(i.code);return p&&!p.gone&&p.on&&!isDraft(p)}),td=new Date();
      if(td.getDay()===0)td=addDays(td,1);
      state.sheet={type:'order',date:key(td),pre:{name:lo.name,phone:lo.phone,items:keep,note:''}};renderSheet();
      if(keep.length<lo.items.length)toast(keep.length?'Some items are no longer on sale and were left out':'None of those items are on sale now, pick new ones');
      break}
    case 'cross':{var co=orders.find(function(x){return x.id===id});if(!co)break;if(co.status==='picked'){askUndo(co);break}askPick(co);break}
    case 'popyes':closePop();toggle(id);break;
    case 'popundo':closePop();toggle(id);break;
    case 'popno':closePop();break;
    case 'popcancel':if(!el.dataset.arm){el.dataset.arm='1';el.textContent='Tap again to cancel order';break}closePop();remove(id).catch(writeFail);renderBoard();toast('Order cancelled');break;
    case 'edit':state.sheet={type:'order',id:id};state.confirmDel=false;renderSheet();break;
    case 'add':state.sheet={type:'order',date:el.dataset.d};renderSheet();break;
    case 'bake':state.sheet={type:'bake',date:el.dataset.d};renderSheet();break;
    case 'numbers':state.sheet={type:'numbers'};renderSheet();break;
    case 'closeday':closeDay(el.dataset.d);break;
    case 'close':{var wasC=state.sheet&&state.sheet.type==='cust';state.sheet=null;state.confirmDel=false;renderSheet();if(wasC&&state.tab==='history')fillCust();break}
    case 'padd':{
      var gid='gn'+Date.now().toString(36),np={code:'n'+Date.now().toString(36).slice(-6),grp:'',gid:gid,name:'',short:'',auto:true,pieces:NaN,price:NaN,on:true,gone:false};
      prods.push(np);var pl=$('#plist'),em=$('#pempty');if(em)em.remove();
      pl.insertAdjacentHTML('beforeend',prodGroup(gid,[np],true));
      var ns=pl.lastElementChild;ns.querySelector('[data-pg]').focus();try{ns.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}
      break}
    case 'gadd':{
      var gs=el.closest('.pg'),gn=gs.querySelector('[data-pg]').value,gp={code:'n'+Date.now().toString(36).slice(-6),grp:gn,gid:gs.dataset.g,name:'',short:'',auto:true,pieces:NaN,price:NaN,on:true,gone:false};
      prods.push(gp);gs.querySelector('.pft').insertAdjacentHTML('beforebegin',prodRow(gp,true));
      var gr=gs.querySelector('.pft').previousElementSibling;gr.querySelector('input').focus();try{gr.scrollIntoView({block:'nearest',behavior:'smooth'})}catch(e){}
      break}
    case 'gimgdel':{
      var is=el.closest('.pg');prods.forEach(function(p){if(p.gid===is.dataset.g)p.img=''});
      hideImg(is.querySelector('.pimg'));queueSave();break}
    case 'ptoggle':{
      var trow=el.closest('.prow'),tp=prodByCode(trow.dataset.code);if(!tp)break;
      tp.on=!tp.on;trow.classList.toggle('off',!tp.on);el.classList.toggle('on',tp.on);el.setAttribute('aria-checked',tp.on);
      el.querySelector('span').textContent=tp.on?'':'Sold out';queueSave();break}
    case 'pdel':{
      if(!el.dataset.arm){el.dataset.arm='1';el.textContent='Sure?';setTimeout(function(){if(el.isConnected){delete el.dataset.arm;el.innerHTML='&times;'}},3000);break}
      var drow=el.closest('.prow'),dsec=drow.closest('.pg'),dp=prodByCode(drow.dataset.code);if(!dp)break;
      var at=prods.indexOf(dp),dg=dp.gid;
      if(dp.base)prods[at]=Object.assign({},dp.base,{gone:true,base:dp.base});else prods.splice(at,1);
      var tgt=prods.some(function(x){return x.gid===dg&&!x.gone})?drow:dsec;
      var hh=tgt.offsetHeight,fin=function(){tgt.remove();if(!$('#plist').children.length)$('#plist').innerHTML='<p class="muted" id="pempty" style="margin:14px 0">Nothing yet. Add the first product.</p>'};
      if(tgt.animate){tgt.style.pointerEvents='none';tgt.style.overflow='hidden';var an=tgt.animate([{height:hh+'px',opacity:1},{height:'0px',opacity:0,paddingTop:'0px',paddingBottom:'0px',marginTop:'0px'}],{duration:240,easing:'cubic-bezier(.3,.7,.2,1)',fill:'forwards'});an.onfinish=fin}else fin();
      if(dp.base)queueSave();
      break}
    case 'weekprev':turn(-1,function(){state.week=addDays(state.week,-7)});break;
    case 'weeknext':turn(1,function(){state.week=addDays(state.week,7)});break;
    case 'weekthis':{var tw=homeWeek();if(+tw!==+state.week)turn(tw>state.week?1:-1,function(){state.week=tw});break}
    case 'del':
      if(!state.confirmDel){state.confirmDel=true;el.textContent='Tap again to delete'}
      else{state.confirmDel=false;state.sheet=null;remove(id).catch(writeFail);renderBoard();renderSheet();toast('Order deleted')}
      break;
    case 'copytext':{
      var o=orders.find(function(x){return x.id===id});if(!o)break;
      var txt=confirmText(o),ta=$('#msg');
      var fail=function(){ta.value=txt;ta.hidden=false;ta.removeAttribute('readonly');ta.focus();ta.select();toast('Copy was blocked. The text is selected, copy it from there.')};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(function(){toast('Copied')},fail);else fail();
      break}
  }
});
document.addEventListener('input',function(ev){
  var t=ev.target;
  if(t&&t.hasAttribute&&t.hasAttribute('data-pg')){
    var sec=t.closest('.pg'),gid=sec.dataset.g;
    prods.forEach(function(p){if(p.gid===gid&&!p.gone){p.grp=t.value;p.name=mkName(p);autoShort(p)}});
    refreshHints();queueSave();return;
  }
  var pe=t&&t.dataset&&t.dataset.pf;
  if(pe){
    var prow=t.closest('.prow'),pp=prodByCode(prow.dataset.code);if(!pp)return;
    var val=t.value;
    if(pe==='price'){var nn=parseFloat(String(val).replace(/[^0-9.,]/g,'').replace(',','.'));pp.price=isNaN(nn)?NaN:Math.round(nn*100)/100}
    else if(pe==='short'){pp.short=String(val).replace(/[^A-Za-z0-9]/g,'').slice(0,8);pp.auto=!pp.short;if(pp.auto)autoShort(pp)}
    else{var n2=parseInt(String(val).replace(/\D/g,''),10);pp.pieces=isNaN(n2)?NaN:n2;pp.name=mkName(pp);autoShort(pp)}
    refreshHints();queueSave();return;
  }
  if(ev.target&&ev.target.id==='h-q'){state.q=ev.target.value;state.hmax=50;fillList()}
  if(ev.target&&ev.target.id==='c-q'){state.cq=ev.target.value;state.cmax=10;fillCust()}
  if(ev.target&&ev.target.id==='c-note'&&state.sheet&&state.sheet.type==='cust')setNote(state.sheet.k,ev.target.value);});
document.addEventListener('change',function(ev){
  var f=ev.target;
  if(f&&f.hasAttribute&&f.hasAttribute('data-pimg')){
    var file=f.files&&f.files[0];if(!file)return;
    var sec=f.closest('.pg'),box=sec.querySelector('.pimg'),gid=sec.dataset.g;f.value='';
    shrink(file).then(function(data){
      showImg(box,data);setPStatus('Uploading');
      return api({action:'saveImage',data:data}).then(function(j){
        imgs[j.id]=data;box.dataset.img=j.id;
        prods.forEach(function(p){if(p.gid===gid&&!p.gone)p.img=j.id});
        queueSave();
      });
    }).catch(function(e){
      hideImg(box);var prev=prods.filter(function(p){return p.gid===gid&&p.img})[0];
      if(prev){box.dataset.img=prev.img;hydrate(sec)}
      setPStatus('');
      toast(String(e&&e.message)==='unknown action'?'Update the Apps Script first, then photos can upload.':'That photo did not upload. Try a different picture.');
    });
    return;
  }
  var pe=ev.target&&ev.target.dataset&&ev.target.dataset.pf;if(!pe)return;
  var pp=prodByCode(ev.target.closest('.prow').dataset.code);if(!pp)return;
  var v=pp[pe];ev.target.value=(typeof v==='number'&&isNaN(v))||v==null?'':v;
});
document.addEventListener('click',function(ev){if(ev.target.id==='pop')closePop()});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&!$('#pop').hidden){closePop();return}if(ev.key==='Escape'&&state.sheet){state.sheet=null;renderSheet()}});

document.addEventListener('visibilitychange',function(){
  if(document.hidden)return;
  var k=key(new Date());
  if(k!==lastDay){lastDay=k;state.week=homeWeek();if(state.tab==='week'&&!state.sheet)renderBoard()}
});
renderBoard();init();setInterval(markSoon,30000);
window.addEventListener('resize',placeBar);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(placeBar);
