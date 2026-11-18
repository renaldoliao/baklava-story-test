/* ---------- export: CSV for the week, CSV or a printable report for history ---------- */
var ex=null;
var EXR=[['week','This week'],['last','Last week'],['next','Next week'],['4w','Last 4 weeks'],['month','This month'],['all','All time']];
function exRange(r){
  var n=new Date(),mon=mondayOf(n);
  if(r==='week')return [key(mon),key(addDays(mon,5))];
  if(r==='last')return [key(addDays(mon,-7)),key(addDays(mon,-2))];
  if(r==='next')return [key(addDays(mon,7)),key(addDays(mon,12))];
  if(r==='4w')return [key(addDays(mon,-21)),''];
  if(r==='month')return [key(new Date(n.getFullYear(),n.getMonth(),1,12)),key(new Date(n.getFullYear(),n.getMonth()+1,0,12))];
  return ['',''];
}
function exDefaults(scope){var r=scope==='week'?[key(state.week),key(addDays(state.week,5))]:exRange(state.range);return {scope:scope,from:r[0],to:r[1],status:'all',source:'all',header:true,full:false}}
function exList(){
  return orders.filter(function(o){
    return (!ex.from||o.date>=ex.from)&&(!ex.to||o.date<=ex.to)&&(ex.status==='all'||o.status===ex.status)&&(ex.source==='all'||(ex.source==='web')===isWeb(o));
  });
}
function exChips(){return EXR.map(function(x){var r=exRange(x[0]),on=r[0]===ex.from&&r[1]===ex.to;return '<button type="button" data-act="exchip" data-r="'+x[0]+'" aria-pressed="'+on+'" class="'+(on?'on':'')+'">'+x[1]+'</button>'}).join('')}
function exportHtml(){
  var wk=ex.scope==='week',sel=function(id,opts,v){return '<select id="'+id+'">'+opts.map(function(o){return '<option value="'+o[0]+'"'+(o[0]===v?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select>'};
  return '<h2>'+(wk?'Download orders':'Export history')+'</h2><div class="ex">'
   +'<p class="exl">Dates</p><div class="pick" id="ex-chips" role="group" aria-label="Date range">'+exChips()+'</div>'
   +'<div class="two"><div class="fld"><label for="ex-from">From</label><input id="ex-from" type="date" value="'+ex.from+'"></div><div class="fld"><label for="ex-to">To</label><input id="ex-to" type="date" value="'+ex.to+'"></div></div>'
   +'<div class="two"><div class="fld"><label for="ex-status">Status</label>'+sel('ex-status',[['all','All'],['pending','To confirm'],['new','Confirmed, not picked up'],['picked','Picked up']],ex.status)+'</div><div class="fld"><label for="ex-source">Source</label>'+sel('ex-source',[['all','All'],['web','Online'],['hand','By hand']],ex.source)+'</div></div>'
   +'<label class="chk"><input type="checkbox" id="ex-header"'+(ex.header?' checked':'')+'><span>Put the pull time, filters and totals at the top of the CSV</span></label>'
   +(wk?'':'<label class="chk"><input type="checkbox" id="ex-full"'+(ex.full?' checked':'')+'><span>Add every order as a list at the end of the report</span></label>')
   +'<p class="hint num" id="ex-count" style="margin-top:14px"></p>'
   +'<div class="acts">'+(wk?'<button class="btn" type="button" data-act="exgo" data-f="csv">Download CSV</button>':'<button class="btn" type="button" data-act="exgo" data-f="pdf">Open report</button><button class="link" type="button" data-act="exgo" data-f="csv">Download data (CSV)</button>')+'<button class="link" type="button" data-act="close">Cancel</button></div>'
   +(wk?'':'<p class="hint" style="margin-top:12px">A CSV cannot hold charts, so the report opens as a page you can save as a PDF.</p>')+'</div>';
}
function exPreview(){
  var el=$('#ex-count');if(!el||!ex)return;
  var l=exList(),a=agg(l);
  el.textContent=l.length?l.length+(l.length===1?' order':' orders')+', '+a.pc.toLocaleString('en-US')+' pieces, '+money(a.rev):'No orders match these filters.';
  var c=$('#ex-chips');if(c)c.innerHTML=exChips();
}
function exSync(ev){
  var t=ev.target;if(!ex||!t||!t.id||t.id.indexOf('ex-')!==0)return;
  var id=t.id;
  if(id==='ex-from')ex.from=t.value;else if(id==='ex-to')ex.to=t.value;else if(id==='ex-status')ex.status=t.value;else if(id==='ex-source')ex.source=t.value;else if(id==='ex-header')ex.header=t.checked;else if(id==='ex-full')ex.full=t.checked;else return;
  exPreview();
}
document.addEventListener('input',exSync);document.addEventListener('change',exSync);

function nowStamp(){var n=new Date(),hm=pad(n.getHours())+':'+pad(n.getMinutes());return {long:n.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})+' at '+fmtT(hm),iso:key(n)+' '+hm,file:key(n)+'-'+pad(n.getHours())+pad(n.getMinutes())}}
var fmtFull=function(k){return fromKey(k).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})};
function rangeText(){return ex.from&&ex.to?fmtFull(ex.from)+' to '+fmtFull(ex.to):ex.from?'From '+fmtFull(ex.from):ex.to?'Up to '+fmtFull(ex.to):'All dates'}
var STL={all:'All',pending:'To confirm',new:'Confirmed, not picked up',picked:'Picked up'},SRL={all:'All',web:'Online',hand:'By hand'};
function filterText(){return 'Status: '+STL[ex.status]+'. Source: '+SRL[ex.source]+'.'}
function byWhen(a,b){var x=a.date+a.time,y=b.date+b.time;return x<y?-1:x>y?1:0}
function csvCell(v,safe){if(typeof v==='number')return String(v);v=String(v==null?'':v);if(safe&&/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'}
function saveBlob(text,type,name){
  var blob=new Blob([text],{type:type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(url)},1500);
}
function downloadCsv(list){
  var ns=nowStamp(),L=list.slice().sort(byWhen),out=[];
  var head=['Date','Day','Time','Name','Phone','Items','Pieces','Total','Note','Paid','Status','Source','Pulled at'];
  if(ex.header){
    var a=agg(L);
    [['Baklava Story orders'],['Pulled on',ns.long],['Dates',rangeText()],['Filters',filterText()],['Orders',a.n],['Pieces',a.pc],['Booked',a.rev],['Average order',Math.round(a.rev/a.n*100)/100],[]].forEach(function(r){out.push(r.map(function(v){return csvCell(v)}).join(','))});
  }
  out.push(head.join(','));
  L.forEach(function(o){
    out.push([o.date,fromKey(o.date).toLocaleDateString('en-US',{weekday:'long'}),fmtT(o.time),o.name,o.phone,labelItems(o),pieces(o),total(o),o.note,o.paid==='none'?'':o.paid,o.status==='picked'?'picked up':o.status==='pending'?'to confirm':'confirmed',isWeb(o)?'online':'by hand',ns.iso].map(function(v,i){return csvCell(v,i===3||i===5||i===8)}).join(','));
  });
  saveBlob('﻿'+out.join('\r\n')+'\r\n','text/csv;charset=utf-8','baklava-story-orders_'+L[0].date+'_to_'+L[L.length-1].date+'_pulled-'+ns.file+'.csv');
  toast('Downloaded '+L.length+(L.length===1?' order':' orders'));
}

/* the report: one printable page with charts, saved as a PDF from the browser */
function cm(v){return v>=1000?'$'+(Math.round(v/100)/10)+'k':money(v)}
function barSvg(rows,fmt,H){
  var W=720,pl=6,pr=6,pt=24,pb=30,n=rows.length;H=H||190;
  var mx=Math.max.apply(null,rows.map(function(r){return r[1]}).concat(1)),gap=n>20?3:n>12?6:12,bw=Math.max(5,(W-pl-pr-gap*(n-1))/n),ch=H-pt-pb,pk=0;
  rows.forEach(function(r,i){if(r[1]>rows[pk][1])pk=i});
  var every=Math.ceil(n/16),s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" font-family="Albert Sans,system-ui,sans-serif">';
  rows.forEach(function(r,i){
    var h=r[1]?Math.max(2,Math.round(r[1]/mx*ch)):0,x=pl+i*(bw+gap),y=H-pb-h,cx=(x+bw/2).toFixed(1);
    if(h)s+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+bw.toFixed(1)+'" height="'+h+'" fill="'+(i===pk?'#fde047':'#000')+'" stroke="#000" stroke-width="1.5"/>';
    if(n<=14||(i===pk&&r[1]))s+='<text x="'+cx+'" y="'+(y-6)+'" text-anchor="middle" font-size="12" font-weight="700">'+fmt(r[1])+'</text>';
    if(r[0]&&i%every===0)s+='<text x="'+cx+'" y="'+(H-10)+'" text-anchor="middle" font-size="11.5" fill="#555">'+r[0]+'</text>';
  });
  return s+'<line x1="'+pl+'" y1="'+(H-pb)+'" x2="'+(W-pr)+'" y2="'+(H-pb)+'" stroke="#000" stroke-width="1.5"/></svg>';
}
function reportHtml(L){
  var ns=nowStamp(),tot=agg(L),n=L.length,WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var picked=L.filter(function(o){return o.status==='picked'}).length;
  var byCust=group(L,function(o){var p=String(o.phone).replace(/\D/g,'');return p.length>=7?p:o.name.trim().toLowerCase()});
  var repeat=byCust.filter(function(c){return c.a.n>1}).length;
  var dates=L.map(function(o){return o.date}).sort(),first=dates[0],last=dates[n-1];
  var span=Math.round((fromKey(last)-fromKey(first))/86400000)+1,ser=[],serT,zero={n:0,pc:0,rev:0};
  if(span<=14){
    serT='day by day';var bd={};group(L,function(o){return o.date}).forEach(function(g){bd[g.k]=g.a});
    for(var dd=fromKey(first);key(dd)<=last;dd=addDays(dd,1)){var kk=key(dd);if(dd.getDay()===0&&!bd[kk])continue;ser.push([dd.toLocaleDateString('en-US',{weekday:'short'})+' '+dd.getDate(),bd[kk]||zero])}
  }else{
    serT='week by week';var bwk={};group(L,function(o){return key(mondayOf(fromKey(o.date)))}).forEach(function(g){bwk[g.k]=g.a});
    var cur=mondayOf(fromKey(first)),end=mondayOf(fromKey(last));
    while(cur<=end){ser.push([fmtShort(cur),bwk[key(cur)]||zero]);cur=addDays(cur,7)}
    ser=ser.slice(-26);
  }
  var pr={};L.forEach(function(o){o.items.forEach(function(i){var p=prodOf(i.code),f=pr[i.code]=pr[i.code]||{name:p.name,t:0,pc:0,rev:0};f.t+=i.qty;f.pc+=i.qty*(+p.pieces||0);f.rev+=i.qty*(+p.price||0)})});
  var prR=Object.keys(pr).map(function(k){return pr[k]}).sort(function(a,b){return b.pc-a.pc}),prMax=Math.max.apply(null,prR.map(function(x){return x.pc}).concat(1));
  var wdG={};group(L,function(o){return fromKey(o.date).getDay()}).forEach(function(g){wdG[g.k]=g.a});
  var wdR=[1,2,3,4,5,6].concat(wdG[0]?[0]:[]).map(function(i){return [WD[i].slice(0,3),(wdG[i]||zero).n]});
  var tm={};L.forEach(function(o){tm[o.time]=(tm[o.time]||0)+1});
  var tR=slotList().map(function(t){var h=+t.slice(0,2);return [t.slice(3)==='00'?(h%12||12)+(h>=12?'p':'a'):'',tm[t]||0]});
  var tSlots=slotList().slice().sort(function(a,b){return (tm[b]||0)-(tm[a]||0)});
  var onl=L.filter(isWeb).length,hand=n-onl,onlPct=Math.round(onl/n*100);
  var bestDay=wdR.slice().sort(function(a,b){return b[1]-a[1]})[0],bestDayName=WD[['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(bestDay[0])];
  var notes=[];
  if(prR.length)notes.push('<b>'+esc(prR[0].name)+'</b> sold the most, '+prR[0].pc.toLocaleString('en-US')+' pieces across '+prR[0].t+(prR[0].t===1?' box.':' boxes.'));
  if(n>=3)notes.push('<b>'+bestDayName+'</b> was the busiest day with '+Math.round(bestDay[1]/n*100)+'% of orders.');
  if(n>=5&&tm[tSlots[0]])notes.push('Pickups bunch up around <b>'+fmtT(tSlots[0])+'</b>.');
  if(onl&&hand)notes.push('<b>'+onlPct+'%</b> of orders came in online, the rest were written by hand.');
  else if(onl)notes.push('Every order came in online.');
  if(repeat)notes.push('<b>'+repeat+'</b> of '+byCust.length+' customers ordered more than once.');
  var css="*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}body{margin:0;background:#f1f1f1;color:#000;font:400 15px/1.5 'Albert Sans',system-ui,sans-serif}"
   +".tb{max-width:860px;margin:0 auto;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:14px;color:#666}.tb button{font:600 15px 'Albert Sans',system-ui,sans-serif;background:#000;color:#fff;border:0;padding:12px 20px;cursor:pointer}"
   +".pg{max-width:860px;margin:0 auto 40px;background:#fff;border:1px solid #000;padding:44px 48px 36px}"
   +".brand{font:700 16px/1 'Bricolage Grotesque',sans-serif;margin:0 0 28px}h1{font:700 46px/1.05 'Bricolage Grotesque',sans-serif;letter-spacing:-.02em;margin:0 0 8px}"
   +".rng{font:700 22px/1.2 'Bricolage Grotesque',sans-serif;margin:0}.meta{color:#666;font-size:13.5px;margin:6px 0 0}"
   +".hero{display:flex;flex-wrap:wrap;gap:22px 48px;align-items:flex-end;margin:30px 0 0;padding-top:22px;border-top:2px solid #000}"
   +".big b{display:block;font:700 68px/1.05 'Bricolage Grotesque',sans-serif;letter-spacing:-.03em}.big mark{background:#fde047;color:#000;padding:0 8px;margin-left:-8px}.big span{color:#666;font-size:14px}"
   +".sum{display:flex;flex-wrap:wrap;gap:16px 34px}.sum b{display:block;font:700 26px/1.1 'Bricolage Grotesque',sans-serif}.sum span{font-size:13px;color:#666}"
   +"h2{font:700 21px/1.15 'Bricolage Grotesque',sans-serif;margin:36px 0 10px;padding-bottom:6px;border-bottom:2px solid #000}section{break-inside:avoid}"
   +".note{color:#666;font-size:13.5px;margin:0 0 8px}ul.in{margin:0;padding-left:20px}ul.in li{margin:0 0 7px}"
   +"table{width:100%;border-collapse:collapse}th,td{padding:8px 10px 8px 0;border-bottom:1px solid #e8e8e8;text-align:left;vertical-align:middle;font-variant-numeric:tabular-nums}th{font-size:13px;font-weight:600;color:#666;border-bottom:1px solid #bdbdbd}.r{text-align:right}.nw{white-space:nowrap}td:last-child,th:last-child{padding-right:0}tr{break-inside:avoid}thead{display:table-header-group}"
   +".bc{width:34%}.bc i{display:block;height:11px;background:#000}.bc i.top{background:#fde047;box-shadow:inset 0 0 0 1.5px #000}"
   +".split{display:flex;height:22px;border:1.5px solid #000;margin:8px 0 6px}.split i{display:block;height:100%}.split .a{background:#000}.split .b{background:#fde047}.leg{display:flex;justify-content:space-between;font-size:14px}"
   +".foot{margin:34px 0 0;padding-top:12px;border-top:1px solid #bdbdbd;color:#666;font-size:12.5px}"
   +"@page{size:letter;margin:14mm}@media print{body{background:#fff}.tb{display:none}.pg{border:0;padding:0;margin:0;max-width:none}}"
   +"@media(max-width:640px){.pg{padding:26px 18px}h1{font-size:34px}.big b{font-size:52px}}";
  var h='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Baklava Story report '+esc(rangeText())+'</title>'
   +'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600&family=Bricolage+Grotesque:opsz,wght@12..96,700&display=swap"><style>'+css+'</style></head><body>'
   +'<div class="tb"><span>Choose Save as PDF in the print window.</span><button onclick="window.print()">Save as PDF</button></div><div class="pg">'
   +'<p class="brand">Baklava Story</p><h1>Sales report</h1><p class="rng">'+esc(rangeText())+'</p><p class="meta">Pulled '+esc(ns.long)+'. '+esc(filterText())+'</p>'
   +'<div class="hero"><div class="big"><b><mark>'+money(tot.rev)+'</mark></b><span>booked from '+n+(n===1?' order':' orders')+'</span></div><div class="sum">'
   +'<div><b>'+tot.pc.toLocaleString('en-US')+'</b><span>pieces</span></div><div><b>'+money(tot.rev/n)+'</b><span>average order</span></div><div><b>'+byCust.length+'</b><span>customers</span></div><div><b>'+picked+'</b><span>picked up</span></div></div></div>'
   +(notes.length?'<section><h2>What stood out</h2><ul class="in">'+notes.map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></section>':'')
   +'<section><h2>Booked, '+serT+'</h2>'+barSvg(ser.map(function(x){return [x[0],x[1].rev]}),cm)+'</section>'
   +'<section><h2>Pieces, '+serT+'</h2>'+barSvg(ser.map(function(x){return [x[0],x[1].pc]}),function(v){return v.toLocaleString('en-US')})+'</section>'
   +'<section><h2>What sells</h2><table><thead><tr><th>Product</th><th class="bc"></th><th class="r">Boxes</th><th class="r">Pieces</th><th class="r">Booked</th></tr></thead><tbody>'
   +prR.map(function(x,i){return '<tr><td>'+esc(x.name)+'</td><td class="bc"><i'+(i===0?' class="top"':'')+' style="width:'+Math.round(x.pc/prMax*100)+'%"></i></td><td class="r">'+x.t+'</td><td class="r">'+x.pc.toLocaleString('en-US')+'</td><td class="r">'+money(x.rev)+'</td></tr>'}).join('')+'</tbody></table></section>'
   +'<section><h2>Orders by weekday</h2>'+barSvg(wdR,function(v){return String(v)},150)+'</section>'
   +'<section><h2>Orders by pickup time</h2>'+barSvg(tR,function(v){return String(v)},150)+'</section>'
   +'<section><h2>Online and by hand</h2><div class="split"><i class="a" style="width:'+onlPct+'%"></i><i class="b" style="width:'+(100-onlPct)+'%"></i></div><div class="leg"><span><b>'+onl+'</b> online</span><span><b>'+hand+'</b> by hand</span></div></section>'
   +'<section><h2>Regulars</h2><p class="note">Matched by phone number, or by name when there is none.</p><table><thead><tr><th>Customer</th><th class="r">Orders</th><th class="r">Pieces</th><th class="r">Booked</th><th class="r">Last order</th></tr></thead><tbody>'
   +byCust.slice().sort(function(a,b){return b.a.n-a.a.n||b.a.pc-a.a.pc}).slice(0,10).map(function(c){var lo=c.list.reduce(function(m,o){return o.date>m?o.date:m},'');return '<tr><td>'+esc(c.list[0].name)+'</td><td class="r">'+c.a.n+'</td><td class="r">'+c.a.pc.toLocaleString('en-US')+'</td><td class="r">'+money(c.a.rev)+'</td><td class="r">'+fmtShort(fromKey(lo))+'</td></tr>'}).join('')+'</tbody></table></section>'
   +(ex.full?'<h2>All orders</h2><table><thead><tr><th>Date</th><th>Time</th><th>Name</th><th>Items</th><th>Note</th><th class="r">Total</th></tr></thead><tbody>'+L.slice().sort(byWhen).map(function(o){return '<tr><td class="nw">'+fromKey(o.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+'</td><td class="nw">'+fmtT(o.time)+'</td><td>'+esc(o.name)+'</td><td>'+esc(labelItems(o))+'</td><td>'+esc(o.note)+'</td><td class="r">'+money(total(o))+'</td></tr>'}).join('')+'</tbody></table>':'')
   +'<p class="foot">Pulled from the Baklava Story order dashboard on '+esc(ns.long)+'. Booked uses the current prices from the Products tab.</p></div></body></html>';
  return h;
}
function openReport(html){
  var blob=new Blob([html],{type:'text/html;charset=utf-8'}),url=URL.createObjectURL(blob),w=window.open(url,'_blank');
  if(!w){saveBlob(html,'text/html;charset=utf-8','baklava-story-report_'+nowStamp().file+'.html');toast('Pop-ups are blocked, so the report was saved as a file. Open it, then print to PDF.')}
  else setTimeout(function(){URL.revokeObjectURL(url)},120000);
}
function fillList(){var el=$('#h-list');if(el)el.innerHTML=histList()}

/* ---------- customers: a card per customer, opened from Regulars in History ---------- */
var notes={},notesLive=false,ntimer=null,nbusy=false,npend={};
function custKey(o){var d=usDigits(o.phone);return d.length>=7?d:'n:'+String(o.name||'').trim().toLowerCase()}
function custOrders(k){return orders.filter(function(o){return custKey(o)===k}).sort(function(a,b){var x=a.date+a.time,y=b.date+b.time;return x<y?1:x>y?-1:0})}
function loadNotes(){
  return fetch(API_URL+'?action=notes&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j&&j.notes&&typeof j.notes==='object'){notesLive=true;if(!ntimer&&!nbusy&&!Object.keys(npend).length)notes=j.notes}
  }).catch(function(){});
}
function setNStatus(t){
  var el=$('#c-save');if(!el)return;el.textContent=t;clearTimeout(setNStatus.t);
  if(t==='Saved')setNStatus.t=setTimeout(function(){if(el.isConnected)el.textContent=''},2200);
}
function setNote(k,v){
  v=String(v).slice(0,500);if(v.trim())notes[k]=v;else delete notes[k];
  npend[k]=1;setNStatus('Saving');clearTimeout(ntimer);ntimer=setTimeout(flushNotes,600);
}
function flushNotes(){
  ntimer=null;var ks=Object.keys(npend);if(!ks.length)return;npend={};
  if(!configured){setNStatus('Saved here only');return}
  nbusy=true;
  Promise.all(ks.map(function(k){return api({action:'saveNote',key:k,note:notes[k]||''})})).then(function(){nbusy=false;notesLive=true;setNStatus('Saved')}).catch(function(e){
    nbusy=false;setNStatus(String(e&&e.message)==='unknown action'?'Not saved. Update the Apps Script first.':'Not saved. Check the connection, then edit again.');
  });
}
function fillCust(){
  var el=$('#c-list');if(!el)return;
  var q=(state.cq||'').trim().toLowerCase(),qd=q.replace(/\D/g,'');
  var gs=group(inRange(orders),custKey).map(function(c){
    var l=c.list.slice().sort(function(a,b){var x=a.date+a.time,y=b.date+b.time;return x<y?1:x>y?-1:0});
    c.name=l[0].name;c.last=l[0].date;c.phones=l.map(function(o){return rawDigits(o.phone)}).join(' ');c.names=l.map(function(o){return o.name.toLowerCase()}).join(' ');return c;
  }).sort(function(a,b){return b.a.n-a.a.n||b.a.pc-a.a.pc||(a.last<b.last?1:-1)});
  if(q)gs=gs.filter(function(c){return c.names.indexOf(q)>=0||(qd.length>=3&&c.phones.indexOf(qd)>=0)});
  var shown=gs.slice(0,state.cmax),cnt=$('#c-count');
  if(cnt)cnt.textContent=gs.length+(gs.length===1?' customer':' customers')+(q?' match':'');
  el.innerHTML='<div class=\"tb\" style=\"--cols:1.7fr 64px 70px 84px 1fr\"><div class=\"tr th\"><span></span><span class=\"r\">Orders</span><span class=\"r\">Pieces</span><span class=\"r\">Booked</span><span>Last order</span></div>'
   +shown.map(function(c){return '<button type=\"button\" class=\"tr cust\" data-act=\"cust\" data-k=\"'+esc(c.k)+'\"><span class=\"lbl\">'+esc(c.name)+(notes[c.k]?'<small>has a note</small>':'')+'</span><span class=\"r num\">'+c.a.n+'</span><span class=\"r num\">'+c.a.pc.toLocaleString('en-US')+'</span><span class=\"r num\">'+money(c.a.rev)+'</span><span>'+fmtShort(fromKey(c.last))+'</span></button>'}).join('')+'</div>'
   +(gs.length>shown.length?'<button class=\"link hmore\" data-act=\"cmore\">Show all ('+gs.length+')</button>':'')+(gs.length?'':'<p class=\"muted\" style=\"margin:10px 0\">Nobody matches.</p>');
}
function custHtml(k){
  var L=custOrders(k);
  if(!L.length)return '<h2>Customer</h2><p class=\"muted\">No orders found for this customer.</p>';
  var a=agg(L),lo=L[0],first=L[L.length-1],by={};
  L.forEach(function(o){var seen={};o.items.forEach(function(i){var f=by[i.code]=by[i.code]||{n:0,q:0};f.q+=i.qty;if(!seen[i.code]){f.n++;seen[i.code]=1}})});
  var usual=Object.keys(by).sort(function(x,y){return by[y].n-by[x].n||by[y].q-by[x].q}).slice(0,3);
  var ST={picked:'picked up',pending:'to confirm',new:'confirmed'};
  return '<h2>'+esc(lo.name)+'</h2><p class=\"sub\" style=\"margin:-8px 0 14px\">'+(lo.phone?esc(lo.phone)+', ':'')+'ordering since '+fmtFull(first.date)+'</p>'
   +'<div class=\"stats\"><div><b class=\"num\">'+a.n+'</b><span>orders</span></div><div><b class=\"num\">'+money(a.rev)+'</b><span>spent</span></div><div><b class=\"num\">'+money(a.rev/a.n)+'</b><span>average order</span></div></div>'
   +'<p class=\"exl\">Usually orders</p><div class=\"plines\" style=\"margin:0 0 18px\">'+usual.map(function(c){return '<div class=\"pl\"><span class=\"pn\">'+esc(prodOf(c).name)+'<small>in '+by[c].n+' of '+a.n+(a.n===1?' order':' orders')+'</small></span></div>'}).join('')+'</div>'
   +'<div class=\"fld\"><label for=\"c-note\">Note about this customer</label><textarea id=\"c-note\" maxlength=\"500\" placeholder=\"allergic to nuts, always picks up late\">'+esc(notes[k]||'')+'</textarea><p class=\"hint\" id=\"c-save\"></p></div>'
   +'<div class=\"acts\"><button class=\"btn\" type=\"button\" data-act=\"custrepeat\" data-k=\"'+esc(k)+'\">Repeat last order</button><button class=\"link\" type=\"button\" data-act=\"close\">Close</button></div>'
   +'<p class=\"hint\" style=\"margin-top:8px\">Last order: '+fmtShort(fromKey(lo.date))+', '+esc(shortLabel(lo))+'</p>'
   +'<p class=\"exl\" style=\"margin:24px 0 4px\">All orders</p><div>'+L.map(function(o){
     return '<button type=\"button\" class=\"crow'+(o.status==='picked'?' picked':'')+'\" data-act=\"edit\" data-id=\"'+o.id+'\"><span class=\"cd num\">'+fromKey(o.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+', '+fmtT(o.time)+'</span><span class=\"cp num\">'+money(total(o))+'</span><span class=\"ci\">'+esc(shortLabel(o))+'</span><span class=\"cs\">'+ST[o.status]+'</span></button>';
   }).join('')+'</div>';
}
