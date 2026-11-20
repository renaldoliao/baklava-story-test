/* v2.2 (Studio 1801 test copy, Nov 21 2026). Loaded after z17.js, before j5.js.
   1. The Layer Card (loyalty). Baklava is made of layers, so every visit adds a layer to the customer's card,
      found by phone number. Picked-up orders count by themselves, counter sales with a phone number count,
      staff can add one by hand and undo it the same day. Layer 5: a Turkish coffee on us. Layer 10: a small
      tray on us. Then the card starts again. Rewards and card size are set in the backend (Script Properties).
   2. Counter tab: record coffee and other counter sales in a few taps (payment stays in Square). With a phone
      number the sale also adds a layer, so Tolgay learns who his coffee customers are.
   3. "Reward ready" tag on order cards in the Week board, so the reward is given at pickup.
   4. Bake list counts confirmed orders only, and lists the orders still waiting to be confirmed separately. */

(function(){
  var st=document.createElement('style');
  st.textContent=''
   +'.lc h2{font:700 28px/1.1 var(--f-head);margin:0 0 4px}'
   +'.lc .sub{color:var(--ink2);margin:0 0 18px;max-width:660px}'
   +'.lc .box{padding:16px;border:1px solid var(--ink);margin:0 0 22px;background:var(--paper)}'
   +'.lc .row{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) auto;gap:10px;align-items:end}'
   +'.lc label{display:block;font-size:14px;font-weight:600;color:var(--ink2);margin-bottom:4px}'
   +'.lc input,.lc select{width:100%;min-height:48px;font-size:17px;padding:8px 10px;border:1px solid var(--ink);background:#fff;border-radius:0}'
   +'.lc .btn{min-height:48px;white-space:nowrap}'
   +'.lc .hint{font-size:14px;color:var(--ink2);margin:8px 0 0}'
   +'.lc .find{margin:0 0 10px}'
   +'.lc .card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 16px;align-items:center;padding:12px 0;border-bottom:1px solid var(--rule2)}'
   +'.lc .grp{font:700 12px/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin:22px 0 4px}'
   +'.lc .showall{margin:14px 0 0}'
   +'.lc .card b.nm{font-size:18px}.lc .ph{color:var(--ink2);font-size:15px;margin-left:8px}'
   +'.lc .layers{display:flex;gap:4px;margin:10px 0 4px;align-items:flex-end}'
   +'.lc .layers i{display:block;width:26px;height:10px;border:1.5px solid var(--ink);border-radius:2px;position:relative}'
   +'.lc .layers i.on{background:var(--ink)}'
   +'.lc .layers i.goal{height:16px}'
   +'.lc .layers i.goal::after{content:attr(data-at);position:absolute;top:-17px;left:0;font:700 10px/1 var(--f-ui);color:var(--ink2)}'
   +'.lc .cnt{font-size:14px;color:var(--ink2);margin-top:4px}'
   +'.lc .rw{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:8px;padding:8px 10px;background:#fde047;color:#000;font-weight:600}'
   +'.lc .rw .btn{min-height:40px;background:#000;color:#fff}'
   +'.lc .acts{display:flex;flex-direction:column;align-items:flex-end;gap:6px}'
   +'.lc .acts .link{font-size:15px;min-height:40px;padding:8px 0}'
   +'.lc .empty{color:var(--ink2);padding:14px 0}'
   +'.lc .tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:0 0 16px}'
   +'.lc .tile{min-height:84px;border:1px solid var(--ink);background:#fff;text-align:left;padding:12px;font:600 17px/1.2 var(--f-ui);border-radius:0;cursor:pointer;position:relative}'
   +'.lc .tile small{display:block;font-weight:400;color:var(--ink2);margin-top:6px}'
   +'.lc .tile .q{position:absolute;top:8px;right:8px;min-width:26px;height:26px;border-radius:13px;background:var(--ink);color:#fff;font:700 14px/26px var(--f-ui);text-align:center}'
   +'.lc .ticket .tl{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--rule2)}'
   +'.lc .ticket .tl .qs{display:flex;align-items:center;gap:6px}'
   +'.lc .ticket .tl button{min-width:44px;min-height:44px;border:1px solid var(--ink);background:#fff;font-size:20px;border-radius:0;text-align:center;padding:0}'
   +'.lc .tot{display:flex;justify-content:space-between;font:700 22px/1.2 var(--f-ui);margin:12px 0}'
   +'.lc .peek{margin:10px 0 0;padding:10px 12px;background:var(--paper);border-left:0;font-size:15px}'
   +'.lc .sales .sl{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:10px;padding:8px 0;border-bottom:1px solid var(--rule2);font-size:15px}'
   +'.lc .sum{display:flex;gap:28px;flex-wrap:wrap;margin:0 0 10px}.lc .sum b{display:block;font-size:26px}'
   +'.rwtag{display:inline-block;margin-left:6px;padding:0 6px;font:700 11px/1.7 var(--f-ui);background:#fde047;color:#000;vertical-align:middle}'
   +'.bkwait{margin-top:16px;padding-top:12px;border-top:1px solid var(--rule2);color:var(--ink2)}'
   +'@media(max-width:700px){.lc .row{grid-template-columns:1fr 1fr}.lc .row .btn{grid-column:1/-1}}';
  document.head.appendChild(st);
  var bar=document.querySelector('.tabs .tabbar');
  if(bar)bar.insertAdjacentHTML('beforebegin','<button data-act="tab" data-t="counter">Counter</button><button data-act="tab" data-t="layers">Layer Card</button>');
})();

/* ---------- shared: Layer Card data ---------- */
var lc={size:10,steps:[],name:'The Layer Card',cards:[],byKey:{},loaded:false,loading:false,q:'',arm:''};
function lcKey(p){var d=rawDigits(p);return d.length===11&&d.charAt(0)==='1'?d.slice(1):d}
function lcSet(j){
  lc.size=j.size||10;lc.steps=j.steps||[];lc.name=j.name||lc.name;lc.cards=j.cards||[];lc.byKey={};
  lc.cards.forEach(function(c){lc.byKey[c.key]=c});lc.loaded=true;
}
function lcPut(c){if(!c)return;var i=lc.cards.findIndex(function(x){return x.key===c.key});if(i>=0)lc.cards[i]=c;else lc.cards.unshift(c);lc.byKey[c.key]=c}
function loadLayers(){
  if(lc.loading||!configured)return Promise.resolve();lc.loading=true;
  return fetch(API_URL+'?action=rewards&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);lcSet(j);
  }).catch(function(e){toast(String(e.message||e))}).then(function(){lc.loading=false;
    if(state.tab==='layers'||state.tab==='counter')renderBoard();else tagRewards();});
}
function lcBar(c){
  var h='',goals={};lc.steps.forEach(function(s){goals[s.at]=1});
  for(var i=1;i<=lc.size;i++)h+='<i class="'+(i<=c.onCard?'on ':'')+(goals[i]?'goal':'')+'"'+(goals[i]?' data-at="'+i+'"':'')+'></i>';
  return '<span class="layers" aria-label="'+c.onCard+' of '+lc.size+' layers">'+h+'</span>';
}
function lcReadyHtml(c){
  return c.rewards.filter(function(r){return r.ready>0}).map(function(r){
    var arm=lc.arm===c.key+'|'+r.at;
    return '<div class="rw">Layer '+r.at+': '+esc(r.text)+(r.ready>1?' (x'+r.ready+')':'')
      +' <button class="btn" data-act="lcgive" data-k="'+esc(c.key)+'" data-at="'+r.at+'">'+(arm?'Tap again to give it':'Give it now')+'</button></div>';
  }).join('');
}
function lcSummary(c){
  return 'Layer '+c.onCard+' of '+lc.size+'. '+(c.ready?'':'Next: '+esc(c.next.text.charAt(0).toLowerCase()+c.next.text.slice(1))+' in '+c.next.left+(c.next.left===1?' visit.':' visits.'));
}

/* ---------- 1. The Layer Card screen ---------- */
function layersHtml(){
  var rules=lc.steps.map(function(s){return 'layer '+s.at+': <b>'+esc(s.text.charAt(0).toLowerCase()+s.text.slice(1))+'</b>'}).join(', ');
  var head='<div class="lc book hist"><h2>'+esc(lc.name)+'</h2><p class="sub">Baklava is made of layers, and so is a regular. Every visit adds one layer to the customer’s card, found by phone number: '
   +'picked-up orders count by themselves, counter sales count when you add the number. '+(rules?'Rewards on every card of '+lc.size+': '+rules+'. ':'')+'Then the card starts again.</p>'
   +'<div class="box"><div class="row"><div><label for="lc-phone">Phone number</label><input id="lc-phone" type="tel" inputmode="tel" autocomplete="off" placeholder="(415) 555-0123"></div>'
   +'<div><label for="lc-name">Name</label><input id="lc-name" type="text" autocomplete="off" placeholder="First name"></div>'
   +'<button class="btn" data-act="lcadd">Add a layer</button></div><p class="hint">For a visit the system did not see, like a walk-in purchase. Coffee and counter sales: use the Counter tab, it adds the layer for you.</p></div>';
  if(!lc.loaded)return head+'<p class="empty">Loading cards</p></div>';
  var q=lc.q.trim().toLowerCase(),qd=rawDigits(q),list=lc.cards.filter(function(c){
    if(!q)return true;return (qd.length>=3&&c.key.indexOf(qd)>=0)||String(c.name).toLowerCase().indexOf(q)>=0});
  var ready=lc.cards.filter(function(c){return c.ready>0}).length;
  var regs=lc.cards.filter(function(c){return c.layers>=3}).length,given=lc.cards.reduce(function(s,c){return s+c.rewards.reduce(function(t,r){return t+r.given},0)},0);
  var visits=lc.cards.reduce(function(s,c){return s+c.layers},0);
  return head+'<div class="sum"><div><b>'+lc.cards.length+'</b>customers with a card</div><div><b>'+regs+'</b>regulars, 3+ visits</div><div><b>'+(lc.cards.length?(visits/lc.cards.length).toFixed(1):0)+'</b>visits per customer</div><div><b>'+ready+'</b>with a reward waiting</div><div><b>'+given+'</b>rewards given</div></div>'
   +'<input class="find" id="lc-find" type="search" placeholder="Search name or phone" value="'+esc(lc.q)+'" autocomplete="off">'
   +(list.length?lcListHtml(list,!!q):'<p class="empty">'+(q?'No card matches that.':'No cards yet. A card starts when an order is picked up, or with a counter sale.')+'</p>')+'</div>';
}
function lcListHtml(list,searching){
  if(searching)return list.map(lcCardHtml).join('');
  var ready=list.filter(function(c){return c.ready>0}),rest=list.filter(function(c){return !c.ready}).sort(function(a,b){return b.layers-a.layers||(b.last>a.last?1:-1)});
  var max=lc.max||12,h='';
  if(ready.length)h+='<div class="grp">Reward waiting ('+ready.length+')</div>'+ready.map(lcCardHtml).join('');
  h+='<div class="grp">Everyone else, most visits first ('+rest.length+')</div>'+rest.slice(0,max).map(lcCardHtml).join('');
  if(rest.length>max)h+='<button class="link showall" data-act="lcmore">Show all '+rest.length+'</button>';
  return h;
}
function lcCardHtml(c){
  var today=key(new Date()),handToday=(c.log||[]).some(function(l){return l.kind==='stamp'&&String(l.when).slice(0,10)===today});
  return '<div class="card"><div><b class="nm">'+esc(c.name||'No name')+'</b><span class="ph">'+esc(fmtPhone(c.phone))+'</span>'
   +lcBar(c)+'<div class="cnt">'+lcSummary(c)+' '+c.layers+(c.layers===1?' visit':' visits')+' in total: '+c.orders+' picked-up '+(c.orders===1?'order':'orders')
   +(c.extra?', '+c.extra+' at the counter or by hand':'')+'.</div>'+lcReadyHtml(c)+'</div>'
   +'<div class="acts"><button class="btn" data-act="lcplus" data-k="'+esc(c.key)+'">+1 layer</button>'
   +(handToday?'<button class="link" data-act="lcundo" data-k="'+esc(c.key)+'">Undo a layer added today</button>':'')+'</div></div>';
}

/* ---------- 2. Counter screen ---------- */
var ct={menu:[],sales:[],today:'',loaded:false,loading:false,ticket:{},phone:'',name:'',busy:false};
function loadCounter(){
  if(ct.loading||!configured)return;ct.loading=true;
  fetch(API_URL+'?action=counter&days=7&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);ct.menu=j.menu||[];ct.sales=j.sales||[];ct.today=j.today;ct.loaded=true;
  }).catch(function(e){toast(String(e.message||e))}).then(function(){ct.loading=false;if(state.tab==='counter')renderBoard()});
}
function ctTotal(){return ct.menu.reduce(function(s,m){return s+(ct.ticket[m.name]||0)*m.price},0)}
function counterHtml(){
  if(!ct.loaded)return '<div class="lc book hist"><h2>Counter</h2><p class="empty">Loading the counter menu</p></div>';
  var items=Object.keys(ct.ticket).filter(function(n){return ct.ticket[n]>0});
  var tiles=ct.menu.map(function(m){var q=ct.ticket[m.name]||0;return '<button class="tile" data-act="ctadd" data-n="'+esc(m.name)+'">'+esc(m.name)+'<small>'+money(m.price)+'</small>'+(q?'<span class="q">'+q+'</span>':'')+'</button>'}).join('');
  var ticket=items.map(function(n){var m=ct.menu.find(function(x){return x.name===n});return '<div class="tl"><span>'+esc(n)+'</span><span class="qs"><button data-act="ctminus" data-n="'+esc(n)+'" aria-label="One less '+esc(n)+'">-</button><b class="num">'+ct.ticket[n]+'</b><button data-act="ctadd" data-n="'+esc(n)+'" aria-label="One more '+esc(n)+'">+</button><span class="num" style="min-width:64px;text-align:right">'+money((m?m.price:0)*ct.ticket[n])+'</span></span></div>'}).join('');
  var k=lcKey(ct.phone),c=k.length>=10&&lc.byKey[k];
  var peek=k.length>=10?'<div class="peek">'+(c?'<b>'+esc(c.name||'')+'</b> '+lcBar(c)+lcSummary(c)+' This sale adds a layer.'+lcReadyHtml(c):'New customer: this sale starts their '+esc(lc.name.replace(/^the /i,''))+'.')+'</div>':'';
  var todays=ct.sales.filter(function(s){return s.date===ct.today}).slice().reverse();
  var drinks=0;todays.forEach(function(s){String(s.items).split(/, (?=\d+ x )/).forEach(function(p){var m=p.match(/^(\d+) x (.+)$/);if(m&&!/baklava|piece/i.test(m[2]))drinks+=+m[1]})});
  return '<div class="lc book hist"><h2>Counter</h2><p class="sub">Tap what the customer is buying, take payment in Square as usual, then save it here. Add their phone number and the visit goes on their '+esc(lc.name.replace(/^the /i,''))+'.</p>'
   +'<div class="tiles">'+tiles+'</div>'
   +'<div class="box ticket">'+(items.length?ticket+'<div class="tot"><span>Total</span><span class="num">'+money(ctTotal())+'</span></div>':'<p class="empty" style="padding:0">Tap an item above to start a sale.</p>')
   +'<div class="row" style="margin-top:10px"><div><label for="ct-phone">Phone number (optional)</label><input id="ct-phone" type="tel" inputmode="tel" autocomplete="off" placeholder="For their '+esc(lc.name.replace(/^the /i,''))+'" value="'+esc(ct.phone)+'"></div>'
   +'<div><label for="ct-name">Name (optional)</label><input id="ct-name" type="text" autocomplete="off" value="'+esc(ct.name)+'"></div>'
   +'<button class="btn" data-act="ctsave"'+(items.length&&!ct.busy?'':' disabled')+'>'+(ct.busy?'Saving':'Save sale')+'</button></div>'+peek+'</div>'
   +'<h3 style="margin:8px 0">Today at the counter</h3><div class="sum"><div><b>'+todays.length+'</b>sales</div><div><b>'+drinks+'</b>drinks</div><div><b>'
   +money(todays.reduce(function(s,x){return s+x.total},0))+'</b>'+(isStaff()?'':'taken')+'</div><div><b>'+todays.filter(function(s){return s.phone}).length+'</b>with a phone number</div></div>'
   +'<div class="sales">'+(todays.length?todays.map(function(s){return '<div class="sl"><span class="num">'+esc(String(s.at).slice(11,16))+'</span><span>'+esc(s.items)+(s.name?' <span class="muted">'+esc(s.name)+'</span>':'')+'</span><span class="num">'+money(s.total)+'</span></div>'}).join(''):'<p class="empty">No counter sales yet today.</p>')+'</div></div>';
}

/* ---------- screens ---------- */
var _renderBoard18=renderBoard;
renderBoard=function(){
  if(state.tab!=='layers'&&state.tab!=='counter'){var r=_renderBoard18.apply(this,arguments);tagRewards();return r}
  if(typeof turning!=='undefined'&&turning){dirty=true;return}
  var f=document.activeElement&&document.activeElement.id,keep={};
  ['lc-phone','lc-name','ct-phone','ct-name'].forEach(function(id){var e=document.getElementById(id);if(e)keep[id]=e.value});
  setTabsUI();$('.help').hidden=true;$('#notice').hidden=true;
  $('#view').innerHTML=state.tab==='layers'?layersHtml():counterHtml();
  Object.keys(keep).forEach(function(id){var e=document.getElementById(id);if(e&&!e.value)e.value=keep[id]});
  if(f){var e=document.getElementById(f);if(e){e.focus();try{if(e.type!=='tel'&&e.value)e.setSelectionRange(e.value.length,e.value.length)}catch(x){}}}
  var nw=Date.now();
  if(!lc.loaded&&nw-(lc.tried||0)>15000){lc.tried=nw;loadLayers()}
  if(state.tab==='counter'&&!ct.loaded&&nw-(ct.tried||0)>15000){ct.tried=nw;loadCounter()}
};
var _switchTab18=switchTab;
switchTab=function(t){if(t==='layers'||t==='counter'){lc.loaded=false;lc.tried=0;if(t==='counter'){ct.loaded=false;ct.tried=0}}return _switchTab18.apply(this,arguments)};

document.addEventListener('input',function(ev){
  var id=ev.target.id;
  if(id==='lc-find'){lc.q=ev.target.value;renderBoard();return}
  if(id==='lc-phone'){var k=lcKey(ev.target.value);if(k.length>=10){var c=lc.byKey[k],nm=$('#lc-name');if(c&&nm&&!nm.value)nm.value=c.name||'';lc.q=k;renderBoard()}return}
  if(id==='ct-phone'){ct.phone=ev.target.value;var k2=lcKey(ct.phone),c2=lc.byKey[k2];if(k2.length>=10){if(c2&&!ct.name)ct.name=c2.name||'';renderBoard()}else if(k2.length===9)renderBoard();return}
  if(id==='ct-name'){ct.name=ev.target.value;return}
});
function lcPost(body){
  return api(body).then(function(j){if(j.cards){lcSet(j)}renderBoard();return j});
}
document.addEventListener('click',function(ev){
  var t=ev.target.closest&&ev.target.closest('[data-act^="lc"],[data-act^="ct"]');if(!t)return;
  var a=t.dataset.act;if(!/^(lcadd|lcplus|lcundo|lcgive|ctadd|ctminus|ctsave|lcmore)$/.test(a))return;
  ev.stopPropagation();
  if(a==='lcmore'){lc.max=1e9;renderBoard();return}
  if(a==='ctadd'){ct.ticket[t.dataset.n]=Math.min(20,(ct.ticket[t.dataset.n]||0)+1);renderBoard();return}
  if(a==='ctminus'){ct.ticket[t.dataset.n]=Math.max(0,(ct.ticket[t.dataset.n]||0)-1);renderBoard();return}
  if(a==='ctsave'){
    if(ct.busy)return;
    var items=Object.keys(ct.ticket).filter(function(n){return ct.ticket[n]>0}).map(function(n){return {name:n,qty:ct.ticket[n]}});
    if(!items.length)return;
    if(ct.phone.trim()&&!phoneOk(ct.phone)){toast('That phone number does not look right. Clear it if the customer did not give one.');return}
    ct.busy=true;renderBoard();
    api({action:'counterSale',items:items,phone:ct.phone.trim(),name:ct.name.trim()}).then(function(j){
      ct.sales=ct.sales.concat((j.counter&&j.counter.sales||[]).filter(function(s){return !ct.sales.some(function(x){return x.id===s.id})}));
      if(j.card)lcPut(j.card);
      var msg='Saved '+money(j.total);
      if(j.card){msg+='. '+(j.card.name||'They')+' is on layer '+j.card.onCard+' of '+lc.size;var rr=j.card.rewards.filter(function(r){return r.ready>0})[0];if(rr)msg+='. Reward ready: '+rr.text}
      toast(msg);ct.ticket={};ct.phone='';ct.name='';
    }).catch(function(e){toast(String(e.message||e))}).then(function(){ct.busy=false;renderBoard()});
    return;
  }
  if(a==='lcadd'){
    var ph=$('#lc-phone').value.trim(),nm=$('#lc-name').value.trim();
    if(!phoneOk(ph)){toast('Enter the customer’s phone number first.');$('#lc-phone').focus();return}
    t.disabled=true;
    lcPost({action:'stamp',phone:ph,name:nm,count:1,note:'Added by hand'}).then(function(){toast('Added a layer for '+(nm||fmtPhone(ph)));lc.q='';$('#lc-phone').value='';$('#lc-name').value=''})
      .catch(function(e){toast(String(e.message||e))}).then(function(){t.disabled=false});
    return;
  }
  var c=lc.byKey[t.dataset.k];if(!c)return;
  if(a==='lcplus'){t.disabled=true;lcPost({action:'stamp',phone:c.phone,name:c.name,count:1,note:'Added by hand'}).then(function(){toast('Added a layer for '+(c.name||fmtPhone(c.phone)))}).catch(function(e){toast(String(e.message||e))}).then(function(){t.disabled=false});return}
  if(a==='lcundo'){t.disabled=true;lcPost({action:'unstamp',phone:c.phone,name:c.name}).then(function(){toast('Took back one layer for '+(c.name||fmtPhone(c.phone)))}).catch(function(e){toast(String(e.message||e))}).then(function(){t.disabled=false});return}
  if(a==='lcgive'){
    var armKey=c.key+'|'+t.dataset.at;
    if(lc.arm!==armKey){lc.arm=armKey;renderBoard();return}
    lc.arm='';
    lcPost({action:'redeem',phone:c.phone,name:c.name,at:+t.dataset.at}).then(function(){toast('Given. '+(c.name||'The customer')+' got: layer '+t.dataset.at+' reward')}).catch(function(e){toast(String(e.message||e))});
  }
});

/* ---------- 3. "Reward ready" tag on the Week board ---------- */
function tagRewards(){
  if(state.tab!=='week'||!lc.loaded)return;
  document.querySelectorAll('#view .ent button.body[data-id]').forEach(function(b){
    if(b.querySelector('.rwtag'))return;
    var o=orders.find(function(x){return x.id===b.dataset.id});if(!o||o.status==='cancelled'||o.status==='picked'||o.date<key(new Date()))return;
    var c=lc.byKey[lcKey(o.phone)];if(!c||!c.ready)return;
    var r=c.rewards.filter(function(x){return x.ready>0})[0];
    var nm=b.querySelector('.en')||b;
    nm.insertAdjacentHTML('beforeend','<span class="rwtag" title="'+esc(r.text)+'">Reward ready</span>');
  });
}
/* load the cards once at start for the tags, then refresh with the board every few minutes */
setTimeout(function(){if(configured)loadLayers()},1500);
setInterval(function(){if(configured&&!document.hidden&&state.tab==='week'){lc.loading=false;loadLayers()}},300000);

/* ---------- 4. Bake list: confirmed orders only, waiting ones listed apart ---------- */
var _bakeHtml18=bakeHtml;
bakeHtml=function(k){
  var all=onDay;
  var waiting=all(k).filter(function(o){return o.status==='pending'});
  var keep=onDay;onDay=function(d){return keep(d).filter(function(o){return o.status!=='pending'})};
  var h;try{h=_bakeHtml18(k)}finally{onDay=keep}
  h=h.replace(/(\d+) x 1 pieces/g,function(_,n){return n+' ordered'});
  if(waiting.length){
    var wp=waiting.reduce(function(s,o){return s+pieces(o)},0);
    var w='<div class="bkwait"><b>Not in this list: '+waiting.length+' online '+(waiting.length===1?'order':'orders')+' waiting to be confirmed ('+wp+' pieces).</b><br>Confirm them on the Week board and they join the bake list.</div>';
    h=h.replace('<div class="acts" style="margin-top:20px">',w+'<div class="acts" style="margin-top:20px">');
  }
  return h;
};
