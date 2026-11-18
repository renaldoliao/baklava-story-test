/* v2.1 (Studio 1801 test copy, Nov 19 2026). Loaded after z16.js, before j5.js.
   1. iPad held upright: the week board shows 3 days per row instead of running off the screen.
   2. Partners tab hidden: Tolgay keeps doing partner invoices in Square. The code stays, so it can come back.
   3. "Add an item" lists the tray name ("Small tray, Pistachio, $27.50") instead of "1 pieces, $27.50 (sp)".
   4. Prices: each order keeps the price it was made at (the new "prices" column), so changing a price
      no longer rewrites past sales in History and the report.
   5. History and the report no longer count orders still waiting to be confirmed.
   6. Rewards: a stamp card per phone number. Every picked-up order is 1 stamp, staff can add stamps by hand
      (for example a coffee bought at the counter), and give the reward when the card is full. */

(function(){
  var st=document.createElement('style');
  st.textContent=''
   /* 1. iPad portrait: 3 days per row */
   +'@media(min-width:701px) and (max-width:1023px){.spiral{min-width:0}.week{grid-template-columns:repeat(3,minmax(0,1fr));min-width:0}'
   +'.col{min-height:260px}.col:nth-child(3n+1){border-left:0}.col:nth-child(n+4){border-top:2px solid var(--ink)}}'
   /* 2. Partners tab hidden */
   +'.tabs button[data-t="partners"]{display:none!important}'
   /* 6. Rewards screen */
   +'.rw h2{font:700 28px/1.1 var(--f-head);margin:0 0 4px}'
   +'.rw .sub{color:var(--ink2);margin:0 0 18px;max-width:640px}'
   +'.rw .add{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 90px auto;gap:10px;align-items:end;padding:16px;border:1px solid var(--ink);margin:0 0 22px;background:var(--paper)}'
   +'.rw .add label{display:block;font-size:14px;font-weight:600;color:var(--ink2);margin-bottom:4px}'
   +'.rw .add input,.rw .add select{width:100%;min-height:48px;font-size:17px;padding:8px 10px;border:1px solid var(--ink);background:#fff;border-radius:0}'
   +'.rw .add .btn{min-height:48px;white-space:nowrap}'
   +'.rw .add .hint{grid-column:1/-1;font-size:14px;color:var(--ink2);margin:0}'
   +'.rw .find{width:100%;min-height:48px;font-size:17px;padding:8px 12px;border:1px solid var(--ink);margin:0 0 10px;border-radius:0}'
   +'.rw .card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;align-items:center;padding:14px 0;border-bottom:1px solid var(--rule2)}'
   +'.rw .card b{font-size:18px}.rw .card .ph{color:var(--ink2);font-size:15px;margin-left:8px}'
   +'.rw .dots{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}'
   +'.rw .dots i{width:16px;height:16px;border-radius:50%;border:2px solid var(--ink);display:block}'
   +'.rw .dots i.on{background:var(--ink)}'
   +'.rw .cnt{font-size:14px;color:var(--ink2);margin-top:4px}'
   +'.rw .ready{display:inline-block;padding:2px 8px;font:700 12px/1.6 var(--f-ui);background:#fde047;color:#000;margin-left:8px}'
   +'.rw .acts{display:flex;flex-direction:column;align-items:flex-end;gap:8px}'
   +'.rw .acts .btn{min-height:44px}.rw .acts .link{font-size:15px;min-height:44px;padding:10px 0}'
   +'.rw .empty{color:var(--ink2);padding:14px 0}'
   +'@media(max-width:700px){.rw .add{grid-template-columns:1fr 1fr}.rw .add .btn{grid-column:1/-1}}';
  document.head.appendChild(st);
  var nav=document.querySelector('.tabs'),bar=nav&&nav.querySelector('.tabbar');
  if(nav&&bar)bar.insertAdjacentHTML('beforebegin','<button data-act="tab" data-t="rewards">Rewards</button>');
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

/* 6. Rewards */
var rw={goal:10,text:'',cards:[],loaded:false,loading:false,q:'',arm:''};
function rwKey(p){var d=rawDigits(p);return d.length===11&&d.charAt(0)==='1'?d.slice(1):d}
function loadRewards(){
  if(rw.loading)return;rw.loading=true;
  fetch(API_URL+'?action=rewards&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);rw.goal=j.goal;rw.text=j.text;rw.cards=j.cards||[];rw.loaded=true;
  }).catch(function(e){toast(String(e.message||e))}).then(function(){rw.loading=false;if(state.tab==='rewards')renderBoard()});
}
function rwDots(n,goal){var h='';for(var i=0;i<goal;i++)h+='<i class="'+(i<n?'on':'')+'"></i>';return '<span class="dots" aria-hidden="true">'+h+'</span>'}
function rwCardHtml(c){
  var inCard=c.stamps-c.ready*rw.goal,showN=c.ready?rw.goal:inCard,arm=rw.arm===c.key;
  return '<div class="card"><div><b>'+esc(c.name||'No name')+'</b><span class="ph">'+esc(fmtPhone(c.phone))+'</span>'
   +(c.ready?'<span class="ready">Reward ready'+(c.ready>1?' x'+c.ready:'')+'</span>':'')
   +rwDots(showN,rw.goal)
   +'<div class="cnt">'+(c.ready?'Card full. ':'')+showN+' of '+rw.goal+' stamps. '+c.orders+' picked-up '+(c.orders===1?'order':'orders')+(c.extra?', '+c.extra+' added by hand':'')+(c.used?', '+c.used+' '+(c.used===1?'reward':'rewards')+' given':'')+'.</div></div>'
   +'<div class="acts"><button class="btn" data-act="rwplus" data-k="'+esc(c.key)+'">+1 stamp</button>'
   +(c.ready?'<button class="link" data-act="rwgive" data-k="'+esc(c.key)+'">'+(arm?'Tap again to give: '+esc(rw.text):'Give reward')+'</button>':'')
   +'</div></div>';
}
function rewardsHtml(){
  var head='<div class="rw book hist"><h2>Rewards</h2><p class="sub">A stamp card for every customer, by phone number. Every picked-up order adds a stamp by itself. '
   +'Add stamps by hand for things bought at the counter, like a coffee. At '+rw.goal+' stamps the customer gets: <b>'+esc(rw.text||'their reward')+'</b>.</p>'
   +'<div class="add"><div><label for="rw-phone">Phone number</label><input id="rw-phone" type="tel" inputmode="tel" autocomplete="off" placeholder="(415) 555-0123"></div>'
   +'<div><label for="rw-name">Name</label><input id="rw-name" type="text" autocomplete="off" placeholder="First name"></div>'
   +'<div><label for="rw-n">Stamps</label><select id="rw-n"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>'
   +'<button class="btn" data-act="rwadd">Add stamps</button><p class="hint">For a coffee or anything bought at the counter. A known number shows its card below as you type.</p></div>';
  if(!rw.loaded)return head+'<p class="empty">Loading stamp cards</p></div>';
  var q=rw.q.trim().toLowerCase(),qd=rawDigits(q),list=rw.cards.filter(function(c){
    if(!q)return true;return (qd.length>=3&&c.key.indexOf(qd)>=0)||String(c.name).toLowerCase().indexOf(q)>=0});
  return head+'<input class="find" id="rw-find" type="search" placeholder="Search name or phone" value="'+esc(rw.q)+'" autocomplete="off">'
   +(list.length?list.map(rwCardHtml).join(''):'<p class="empty">'+(q?'No card matches that.':'No stamp cards yet. They start when an order is picked up, or when you add a stamp above.')+'</p>')+'</div>';
}
function rwPost(body){
  return api(body).then(function(j){rw.goal=j.goal;rw.text=j.text;rw.cards=j.cards||[];rw.loaded=true;rw.arm='';if(state.tab==='rewards')renderBoard();return j});
}
var _renderBoard17=renderBoard;
renderBoard=function(){
  if(state.tab!=='rewards')return _renderBoard17.apply(this,arguments);
  if(typeof turning!=='undefined'&&turning){dirty=true;return}
  var f=document.activeElement&&document.activeElement.id,keep={};
  ['rw-phone','rw-name','rw-n'].forEach(function(id){var e=document.getElementById(id);if(e)keep[id]=e.value});
  setTabsUI();$('.help').hidden=true;$('#notice').hidden=true;
  $('#view').innerHTML=rewardsHtml();
  Object.keys(keep).forEach(function(id){var e=document.getElementById(id);if(e)e.value=keep[id]});
  if(f){var e=document.getElementById(f);if(e){e.focus();if(e.setSelectionRange&&e.type!=='tel'&&e.value)try{e.setSelectionRange(e.value.length,e.value.length)}catch(x){}}}
  if(!rw.loaded)loadRewards();
};
document.addEventListener('input',function(ev){
  if(ev.target.id==='rw-find'){rw.q=ev.target.value;renderBoard();return}
  if(ev.target.id==='rw-phone'){
    var k=rwKey(ev.target.value),c=k.length>=10&&rw.cards.find(function(x){return x.key===k});
    var nm=document.getElementById('rw-name');if(c&&nm&&!nm.value)nm.value=c.name||'';
    if(k.length>=10){rw.q=k;var fd=document.getElementById('rw-find');if(fd)fd.value=k;renderBoard()}
  }
});
document.addEventListener('click',function(ev){
  var t=ev.target.closest&&ev.target.closest('[data-act="rwadd"],[data-act="rwplus"],[data-act="rwgive"]');if(!t)return;
  ev.stopPropagation();
  var a=t.dataset.act;
  if(a==='rwadd'){
    var ph=$('#rw-phone').value.trim(),nm=$('#rw-name').value.trim(),n=+$('#rw-n').value||1;
    if(!phoneOk(ph)){toast('Enter the customer’s phone number first.');$('#rw-phone').focus();return}
    t.disabled=true;
    rwPost({action:'stamp',phone:ph,name:nm,count:n,note:'Added by hand'}).then(function(){
      toast('Added '+n+(n===1?' stamp':' stamps')+' for '+(nm||fmtPhone(ph)));
      $('#rw-phone').value='';$('#rw-name').value='';$('#rw-n').value='1';
    }).catch(function(e){toast(String(e.message||e))}).then(function(){t.disabled=false});
    return;
  }
  var c=rw.cards.find(function(x){return x.key===t.dataset.k});if(!c)return;
  if(a==='rwplus'){
    t.disabled=true;
    rwPost({action:'stamp',phone:c.phone,name:c.name,count:1,note:'Added by hand'}).then(function(){toast('Added a stamp for '+(c.name||fmtPhone(c.phone)))})
      .catch(function(e){toast(String(e.message||e))}).then(function(){t.disabled=false});
    return;
  }
  if(a==='rwgive'){
    if(rw.arm!==c.key){rw.arm=c.key;renderBoard();return}
    rwPost({action:'redeem',phone:c.phone,name:c.name}).then(function(){toast('Reward given to '+(c.name||fmtPhone(c.phone))+'. The card starts again.')})
      .catch(function(e){toast(String(e.message||e))});
  }
});
/* Stamp cards change when an order is picked up, so reload them next time the tab opens. */
var _switchTab17=switchTab;
switchTab=function(t){if(t==='rewards')rw.loaded=false;return _switchTab17.apply(this,arguments)};
