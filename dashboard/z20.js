/* v2.4 (Studio 1801 test copy, Nov 21 2026). Loaded after z19.js, before j5.js.
   Today: the screen the dashboard opens on. Everything the shop needs for the day on one iPad screen:
   - five numbers: pickups left, orders to confirm, trays to bake, counter so far, expected today (owner only)
   - every pickup today in time order with one big button for the next step:
     Confirm (online order waiting), Ready (asks first, texts the customer), Picked up (marks paid too)
   - what is late, what needs a decision, what to bake, which customers have a reward waiting
   - tomorrow at a glance, so the evening prep is obvious
   It reuses the existing order actions, so it behaves exactly like the Week board. */

(function(){
  var st=document.createElement('style');
  st.textContent=''
   +':root{--yel:#FFC300}'
   +'.rwtag,.lc .rw{background:var(--yel)!important}'
   +'.td{padding:4px 0 40px}'
   +'.td .top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin:0 0 18px}'
   +'.td .top h2{font:600 40px/0.95 var(--f-head);letter-spacing:-0.02em;margin:0}'
   +'.td .top .dt{font-size:17px;color:var(--ink2);margin-top:6px}'
   +'.td .clock{font:600 40px/0.95 var(--f-head);letter-spacing:-0.02em;text-align:right}'
   +'.td .clock small{display:block;font:400 14px/1.3 var(--f-ui);color:var(--ink2);margin-top:6px;letter-spacing:0}'
   +'.td .kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:var(--ink);border:1px solid var(--ink);margin:0 0 22px}'
   +'.td .kpi{background:var(--paper);padding:14px 16px 16px;text-align:left;border:0;font:inherit;color:inherit;border-radius:0}'
   +'.td button.kpi{cursor:pointer}'
   +'.td .kpi b{display:block;font:600 34px/1 var(--f-head);letter-spacing:-0.02em}'
   +'.td .kpi span{display:block;font-size:14px;color:var(--ink2);margin-top:6px;line-height:1.3}'
   +'.td .kpi.hot{background:var(--yel)}.td .kpi.hot span{color:#000}'
   +'.td .cols{display:grid;grid-template-columns:minmax(0,1.75fr) minmax(0,1fr);gap:22px;align-items:start}'
   +'.td .panel{background:var(--paper);border:1px solid var(--ink);margin:0 0 18px}'
   +'.td .panel h3{font:600 18px/1.2 var(--f-head);margin:0;padding:14px 16px;border-bottom:1px solid var(--ink);display:flex;justify-content:space-between;align-items:baseline;gap:10px}'
   +'.td .panel h3 small{font:400 14px/1.2 var(--f-ui);color:var(--ink2)}'
   +'.td .sec{font:700 12px/1 var(--f-ui);letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);padding:14px 16px 6px}'
   +'.td .pu{display:grid;grid-template-columns:104px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 16px;border-top:1px solid var(--rule2)}'
   +'.td .pu:first-of-type{border-top:0}'
   +'.td .pu .tm{font:600 22px/1 var(--f-head);letter-spacing:-0.01em;white-space:nowrap}'
   +'.td .pu .tm small{display:block;font:400 13px/1.2 var(--f-ui);color:var(--ink2);margin-top:4px;letter-spacing:0}'
   +'.td .pu .who{font-size:18px;font-weight:600;line-height:1.25}'
   +'.td .pu .it{font-size:15px;line-height:1.35;color:var(--ink);margin-top:2px}'
   +'.td .pu .nt{font-size:14px;color:var(--ink2);margin-top:3px;font-style:italic}'
   +'.td .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}'
   +'.td .chip{font:700 11px/1.7 var(--f-ui);letter-spacing:.06em;text-transform:uppercase;padding:0 7px;border:1px solid var(--ink);border-radius:999px}'
   +'.td .chip.y{background:var(--yel);border-color:var(--yel)}.td .chip.k{background:var(--ink);color:#fff}.td .chip.g{color:var(--ink2);border-color:var(--rule)}'
   +'.td .pu .go{display:flex;flex-direction:column;align-items:flex-end;gap:6px}'
   +'.td .pu .go .btn{min-height:48px;min-width:132px;font-size:16px}'
   +'.td .pu .go .link{font-size:14px;min-height:36px;padding:6px 0}'
   +'.td .pu.late{background:#FFF7D6}'
   +'.td .pu.done{opacity:.55}.td .pu.done .who{text-decoration:line-through}'
   +'.td .pu .body{all:unset;cursor:pointer;display:block}'
   +'.td .empty{padding:18px 16px;color:var(--ink2)}'
   +'.td .li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid var(--rule2);font-size:15px}'
   +'.td .li:first-of-type{border-top:0}.td .li b.n{font:600 22px/1 var(--f-head)}'
   +'.td .li .btn{min-height:40px;font-size:15px}'
   +'.td .li small{display:block;color:var(--ink2);font-size:13px;margin-top:2px}'
   +'.td .foot{padding:10px 16px 14px;font-size:14px;color:var(--ink2);border-top:1px solid var(--rule2)}'
   +'.td .foot .link{font-size:14px}'
   +'.td .closed{padding:16px 18px;background:var(--ink);color:#fff;margin:0 0 18px;font-size:17px}'
   +'@media(max-width:1023px){.td .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.td .cols{grid-template-columns:1fr}}'
   +'@media(max-width:700px){.tabs{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tabs button{flex:0 0 auto;padding:14px 12px}}'
   +'@media(max-width:620px){.td .top{align-items:flex-start;flex-direction:column;gap:8px}.td .clock{text-align:left;font-size:26px}.td .top h2{font-size:32px}'+'.td .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.td .kpi:last-child{grid-column:1/-1}.td .kpi b{font-size:28px}'
   +'.td .pu{grid-template-columns:78px minmax(0,1fr);gap:10px}.td .pu .tm{font-size:17px;white-space:normal}.td .pu .go{grid-column:2;flex-direction:row;justify-content:flex-start;align-items:center;gap:14px}.td .pu .go .btn{min-width:0}}';
  document.head.appendChild(st);
  var bar=document.querySelector('.tabs .tabbar'),first=document.querySelector('.tabs button[data-t="week"]');
  if(first)first.insertAdjacentHTML('beforebegin','<button data-act="tab" data-t="today">Today</button>');
})();
state.tab='today';

function tdNowMin(){var n=new Date();return n.getHours()*60+n.getMinutes()}
function tdMin(t){var p=String(t).split(':');return +p[0]*60+ +p[1]}
function tdMoney(o){try{return total(o)}catch(e){return 0}}
function tdChips(o,c){
  var h='';
  if(o.status==='pending')h+='<span class="chip y">To confirm</span>';
  else if(o.status==='picked')h+='<span class="chip g">Picked up</span>';
  else if(o.ready)h+='<span class="chip k">Ready</span>';
  else h+='<span class="chip g">Not ready</span>';
  if(isPaid(o))h+='<span class="chip g">Paid</span>';
  h+='<span class="chip g">'+(isWeb(o)?'Online':'By hand')+'</span>';
  if(c&&c.ready&&o.status!=='picked')h+='<span class="chip y">Reward ready</span>';
  return '<div class="chips">'+h+'</div>';
}
function tdRow(o,now,isToday){
  var c=lc.loaded&&lc.byKey[lcKey(o.phone)],m=tdMin(o.time)-now,late=isToday&&o.status!=='picked'&&m<-10;
  var when=!isToday?'':o.status==='picked'?'':m>59?'in '+Math.floor(m/60)+' h '+(m%60?m%60+' min':''):m>0?'in '+m+' min':m>=-10?'now':Math.round(-m)+' min late';
  var btn;
  if(o.status==='pending')btn='<button class="btn" data-act="confirm" data-id="'+o.id+'">Confirm</button>';
  else if(o.status==='picked')btn='<button class="link" data-act="cross" data-id="'+o.id+'">Undo</button>';
  else if(!o.ready)btn='<button class="btn" data-act="tdready" data-id="'+o.id+'">Ready</button>';
  else btn='<button class="btn" data-act="cross" data-id="'+o.id+'">Picked up</button>';
  return '<div class="pu'+(late?' late':'')+(o.status==='picked'?' done':'')+'">'
   +'<div class="tm num">'+fmtT(o.time)+(when?'<small>'+when+'</small>':'')+'</div>'
   +'<button class="body" data-act="'+(o.status==='pending'?'edit':'cross')+'" data-id="'+o.id+'" aria-label="'+esc(o.name)+', '+fmtT(o.time)+'"><div class="who">'+esc(o.name)+'</div>'
   +'<div class="it">'+esc(labelItems(o))+(isStaff()?'':' <span style="color:var(--ink2)">&middot; '+money(tdMoney(o))+'</span>')+'</div>'
   +(o.note?'<div class="nt">'+esc(o.note)+'</div>':'')+tdChips(o,c)+'</button>'
   +'<div class="go">'+btn+(o.phone&&o.status!=='picked'?'<button class="link" data-act="callcust" data-id="'+o.id+'">Call</button>':'')+'</div></div>';
}
function tdBake(list){
  var by={};list.forEach(function(o){o.items.forEach(function(i){var p=prodOf(i.code);by[p.name]=(by[p.name]||0)+i.qty*(+p.pieces||1)})});
  var keys=Object.keys(by).sort(function(a,b){return by[b]-by[a]});
  return {keys:keys,by:by,total:keys.reduce(function(s,k){return s+by[k]},0)};
}
function todayHtml(){
  var d=new Date(),tk=key(d),now=tdNowMin(),sun=d.getDay()===0,shut=typeof shutDays!=='undefined'&&shutDays[tk];
  var all=onDay(tk).filter(function(o){return o.status!=='cancelled'}).sort(function(a,b){return a.time<b.time?-1:1});
  var open=all.filter(function(o){return o.status!=='picked'}),done=all.filter(function(o){return o.status==='picked'});
  var pendingAll=orders.filter(function(o){return o.status==='pending'&&o.date>=tk}).sort(function(a,b){return (a.date+a.time)<(b.date+b.time)?-1:1});
  var confirmed=all.filter(function(o){return o.status!=='pending'}),bake=tdBake(confirmed.filter(function(o){return o.status!=='picked'}));
  var nd=addDays(d,1);if(nd.getDay()===0)nd=addDays(nd,1);var nk=key(nd);
  var tom=onDay(nk).filter(function(o){return o.status!=='cancelled'}),tomBake=tdBake(tom.filter(function(o){return o.status!=='pending'}));
  var ctToday=(ct.sales||[]).filter(function(s){return s.date===ct.today||s.date===tk});
  var drinks=0;ctToday.forEach(function(s){String(s.items).split(/, (?=\d+ x )/).forEach(function(p){var m=p.match(/^(\d+) x (.+)$/);if(m&&!/baklava|piece/i.test(m[2]))drinks+=+m[1]})});
  var ctSum=ctToday.reduce(function(s,x){return s+x.total},0);
  var expect=all.reduce(function(s,o){return s+tdMoney(o)},0)+ctSum;
  var late=open.filter(function(o){return o.status!=='pending'&&tdMin(o.time)-now<-10});
  var rewardsToday=lc.loaded?all.filter(function(o){var c=lc.byKey[lcKey(o.phone)];return c&&c.ready&&o.status!=='picked'}):[];
  var nextUp=open.filter(function(o){return tdMin(o.time)-now>=-10});

  var h='<div class="td"><div class="top"><div><h2>Today</h2><div class="dt">'+fmtLong(d)+'</div></div>'
   +'<div class="clock num" id="td-clock">'+fmtT(String(d.getHours())+':'+pad(d.getMinutes()))+'<small>Open 9:30 am to 6 pm, last pickup 5:45 pm</small></div></div>';
  if(sun)h+='<div class="closed">Closed on Sundays. Monday at a glance is below.</div>';
  else if(shut)h+='<div class="closed">This day is closed to online orders. Orders already booked are still listed.</div>';

  h+='<div class="kpis">'
   +'<button class="kpi'+(late.length?' hot':'')+'" data-act="tdjump" data-to="td-pickups"><b class="num">'+open.filter(function(o){return o.status!=='pending'}).length+'</b><span>pickups left'+(done.length?', '+done.length+' picked up':'')+(late.length?'<br><b style="font:inherit;display:inline">'+late.length+' late</b>':'')+'</span></button>'
   +'<button class="kpi'+(pendingAll.length?' hot':'')+'" data-act="tdjump" data-to="td-confirm"><b class="num">'+pendingAll.length+'</b><span>online '+(pendingAll.length===1?'order':'orders')+' to confirm</span></button>'
   +'<button class="kpi" data-act="tdjump" data-to="td-bake"><b class="num">'+bake.total+'</b><span>trays still to hand out today</span></button>'
   +'<button class="kpi" data-act="tab" data-t="counter"><b class="num">'+(isStaff()?drinks:money(ctSum))+'</b><span>at the counter'+(isStaff()?' (drinks)':', '+drinks+' drinks')+'</span></button>'
   +(isStaff()?'<div class="kpi"><b class="num">'+rewardsToday.length+'</b><span>rewards to give today</span></div>':'<div class="kpi"><b class="num">'+money(expect)+'</b><span>expected today, orders and counter</span></div>')
   +'</div><div class="cols"><div>';

  h+='<div class="panel" id="td-pickups"><h3>Pickups today <small>'+all.length+' '+(all.length===1?'order':'orders')+'</small></h3>';
  if(!all.length)h+='<p class="empty">'+(sun?'No pickups on Sundays.':'No pickups booked for today yet.')+'</p>';
  else{
    var lateL=open.filter(function(o){return o.status!=='pending'&&tdMin(o.time)-now<-10});
    if(lateL.length)h+='<div class="sec">Late, not picked up yet</div>'+lateL.map(function(o){return tdRow(o,now,true)}).join('');
    if(nextUp.length)h+='<div class="sec">Coming up</div>'+nextUp.map(function(o){return tdRow(o,now,true)}).join('');
    var pendLate=open.filter(function(o){return o.status==='pending'&&tdMin(o.time)-now<-10});
    if(pendLate.length)h+='<div class="sec">Never confirmed</div>'+pendLate.map(function(o){return tdRow(o,now,true)}).join('');
    if(done.length)h+='<div class="sec">Picked up</div>'+done.slice().reverse().map(function(o){return tdRow(o,now,true)}).join('');
  }
  h+='</div>';
  h+='<div class="panel"><h3>'+(sun?'Monday':'Tomorrow')+', '+fmtShort(nd)+' <small>'+tom.length+' '+(tom.length===1?'order':'orders')+', '+tomBake.total+' trays confirmed</small></h3>'
   +(tomBake.keys.length?tomBake.keys.map(function(k){return '<div class="li"><span>'+esc(k)+'</span><b class="n num">'+tomBake.by[k]+'</b></div>'}).join(''):'<p class="empty">Nothing confirmed yet.</p>')
   +'<div class="foot"><button class="link" data-act="bake" data-d="'+nk+'">Open the bake list</button></div></div>';
  h+='</div><div>';

  h+='<div class="panel" id="td-confirm"><h3>Waiting for you <small>'+pendingAll.length+'</small></h3>'
   +(pendingAll.length?pendingAll.slice(0,5).map(function(o){var dd=fromKey(o.date);return '<div class="li"><div><b>'+esc(o.name)+'</b><small>'+(o.date===tk?'Today':dd.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}))+', '+fmtT(o.time)+' &middot; '+esc(labelItems(o))+'</small></div><button class="btn" data-act="confirm" data-id="'+o.id+'">Confirm</button></div>'}).join('')
     +(pendingAll.length>5?'<div class="foot">'+(pendingAll.length-5)+' more on the <button class="link" data-act="tab" data-t="week">Week board</button></div>':'')
    :'<p class="empty">Nothing to confirm. New online orders show up here.</p>')+'</div>';

  h+='<div class="panel" id="td-bake"><h3>Hand out today <small>confirmed, not picked up</small></h3>'
   +(bake.keys.length?bake.keys.map(function(k){return '<div class="li"><span>'+esc(k)+'</span><b class="n num">'+bake.by[k]+'</b></div>'}).join(''):'<p class="empty">Nothing left to hand out today.</p>')
   +'<div class="foot"><button class="link" data-act="bake" data-d="'+tk+'">Full bake list for today</button></div></div>';

  h+='<div class="panel"><h3>'+esc((lc.name||'Layer Card'))+' <small>rewards to give today</small></h3>'
   +(!lc.loaded?'<p class="empty">Loading cards</p>':rewardsToday.length?rewardsToday.map(function(o){var c=lc.byKey[lcKey(o.phone)],r=c.rewards.filter(function(x){return x.ready>0})[0];return '<div class="li"><div><b>'+esc(o.name)+'</b><small>'+fmtT(o.time)+' &middot; Layer '+r.at+': '+esc(r.text)+'</small></div><button class="btn" data-act="tdlayers" data-k="'+esc(c.key)+'">Open card</button></div>'}).join('')
     :'<p class="empty">No rewards waiting for today’s customers.</p>')
   +'<div class="foot">'+(lc.loaded?lc.cards.length+' customers have a card. ':'')+'<button class="link" data-act="tab" data-t="layers">See all cards</button></div></div>';

  h+='<div class="panel"><h3>Counter today <small>'+ctToday.length+' '+(ctToday.length===1?'sale':'sales')+'</small></h3>'
   +'<div class="li"><span>Drinks</span><b class="n num">'+drinks+'</b></div>'
   +(isStaff()?'':'<div class="li"><span>Taken at the counter</span><b class="n num">'+money(ctSum)+'</b></div>')
   +'<div class="li"><span>With a phone number</span><b class="n num">'+ctToday.filter(function(s){return s.phone}).length+'</b></div>'
   +'<div class="foot"><button class="btn" data-act="tab" data-t="counter" style="min-height:44px">Open the counter</button></div></div>';
  h+='</div></div></div>';
  return h;
}

var _renderBoard20=renderBoard;
renderBoard=function(){
  if(state.tab!=='today')return _renderBoard20.apply(this,arguments);
  if(typeof turning!=='undefined'&&turning){dirty=true;return}
  setTabsUI();$('.help').hidden=true;$('#notice').hidden=true;
  var y=window.scrollY;$('#view').innerHTML=todayHtml();if(y)window.scrollTo(0,y);
  var now=Date.now();
  if(!lc.loaded&&!lc.loading&&now-(lc.tried||0)>30000){lc.tried=now;loadLayers()}
  if(!ct.loaded&&!ct.loading&&now-(ct.tried||0)>30000){ct.tried=now;loadCounter()}
};
/* Counter and Layer Card data feed Today too */
var _loadCounter20=loadCounter;
loadCounter=function(){_loadCounter20();var w=setInterval(function(){if(!ct.loading){clearInterval(w);if(state.tab==='today'&&ct.loaded)renderBoard()}},400)};
var _switchTab20=switchTab;
switchTab=function(t){if(t==='today'){ct.loaded=false;lc.loaded=false;ct.tried=0;lc.tried=0}return _switchTab20.apply(this,arguments)};
/* keep the clock and the "in 12 min" labels fresh */
setInterval(function(){if(state.tab==='today'&&!state.sheet&&$('#pop').hidden&&!document.hidden)renderBoard()},60000);

document.addEventListener('click',function(ev){
  var t=ev.target.closest&&ev.target.closest('[data-act="tdready"],[data-act="tdjump"],[data-act="tdlayers"]');if(!t)return;
  ev.stopPropagation();var a=t.dataset.act;
  if(a==='tdready'){var o=orders.find(function(x){return x.id===t.dataset.id});if(o)askReady(o);return}
  if(a==='tdjump'){var el=document.getElementById(t.dataset.to);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(a==='tdlayers'){lc.q=t.dataset.k;switchTab('layers');}
});

/* History: a "Coffee and the Layer Card" section, before Regulars. Last 8 weeks of counter sales. */
var hc={sales:[],loaded:false,loading:false};
function loadHistCounter(){
  if(hc.loading||!configured||Date.now()-(hc.tried||0)<30000)return;hc.loading=true;hc.tried=Date.now();
  fetch(API_URL+'?action=counter&days=56&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);hc.sales=j.sales||[];hc.loaded=true;
  }).catch(function(){}).then(function(){hc.loading=false;if(state.tab==='history'&&hc.loaded)renderBoard()});
}
function coffeeHtml(){
  if(!hc.loaded){loadHistCounter();return '<h2>Coffee and the Layer Card</h2><p class="sub">Loading counter sales</p>'}
  var drinksOf=function(s){var n=0;String(s.items).split(/, (?=\d+ x )/).forEach(function(p){var m=p.match(/^(\d+) x (.+)$/);if(m&&!/baklava|piece/i.test(m[2]))n+=+m[1]});return n};
  var weeks={},top={},withPh=0,sum=0,dr=0;
  hc.sales.forEach(function(s){
    var wk=key(mondayOf(fromKey(s.date)));var w=weeks[wk]=weeks[wk]||{n:0,d:0,t:0};w.n++;w.d+=drinksOf(s);w.t+=s.total;
    String(s.items).split(/, (?=\d+ x )/).forEach(function(p){var m=p.match(/^(\d+) x (.+)$/);if(m)top[m[2]]=(top[m[2]]||0)+ +m[1]});
    if(s.phone)withPh++;sum+=s.total;dr+=drinksOf(s);
  });
  var wks=Object.keys(weeks).sort().reverse(),tops=Object.keys(top).sort(function(a,b){return top[b]-top[a]}).slice(0,5);
  var regs=lc.loaded?lc.cards.filter(function(c){return c.layers>=3}).length:0,given=lc.loaded?lc.cards.reduce(function(s,c){return s+c.rewards.reduce(function(t,r){return t+r.given},0)},0):0;
  var h='<h2>Coffee and the Layer Card</h2><p class="sub">Counter sales from the last 8 weeks, and how the loyalty card is doing. Counter sales are not in the order numbers above.</p>'
   +'<div class="stats" style="display:flex;gap:34px;flex-wrap:wrap;margin:0 0 18px">'
   +'<div><b style="display:block;font:600 34px/1 var(--f-head)">'+dr+'</b>drinks sold</div>'
   +(isStaff()?'':'<div><b style="display:block;font:600 34px/1 var(--f-head)">'+money(sum)+'</b>at the counter</div>')
   +'<div><b style="display:block;font:600 34px/1 var(--f-head)">'+(hc.sales.length?Math.round(withPh*100/hc.sales.length):0)+'%</b>of sales on a Layer Card</div>'
   +(lc.loaded?'<div><b style="display:block;font:600 34px/1 var(--f-head)">'+lc.cards.length+'</b>customers with a card, '+regs+' regulars</div><div><b style="display:block;font:600 34px/1 var(--f-head)">'+given+'</b>rewards given</div>':'')
   +'</div>';
  if(wks.length){
    var mx=Math.max.apply(null,wks.map(function(k){return weeks[k].d}))||1;
    h+='<table class="ht" style="width:100%;border-collapse:collapse;margin:0 0 18px"><thead><tr><th style="text-align:left;padding:6px 0">Week of</th><th style="text-align:right">Sales</th><th style="text-align:right">Drinks</th>'+(isStaff()?'':'<th style="text-align:right">Taken</th>')+'<th style="width:32%"></th></tr></thead><tbody>'
     +wks.map(function(k){var w=weeks[k];return '<tr style="border-top:1px solid var(--rule2)"><td style="padding:8px 0">'+fmtShort(fromKey(k))+'</td><td style="text-align:right" class="num">'+w.n+'</td><td style="text-align:right" class="num">'+w.d+'</td>'+(isStaff()?'':'<td style="text-align:right" class="num">'+money(w.t)+'</td>')+'<td style="padding-left:14px"><span style="display:block;height:10px;background:var(--ink);width:'+Math.round(w.d*100/mx)+'%"></span></td></tr>'}).join('')+'</tbody></table>';
    h+='<p class="sub" style="margin-bottom:22px">Best sellers: '+tops.map(function(n){return esc(n)+' ('+top[n]+')'}).join(', ')+'.</p>';
  }else h+='<p class="sub">No counter sales yet. Use the Counter tab to record coffee and other counter sales.</p>';
  return h;
}
var _histHtml20=histHtml;
histHtml=function(){
  var h=String(_histHtml20.apply(this,arguments));if(!lc.loaded&&!lc.loading)loadLayers();
  var i=h.indexOf('<h2>Regulars</h2>');return i>=0?h.slice(0,i)+coffeeHtml()+h.slice(i):h+coffeeHtml();
};
