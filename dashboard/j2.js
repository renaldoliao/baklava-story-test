/* ---------- history ---------- */
function agg(list){return list.reduce(function(a,o){a.n++;a.pc+=pieces(o);a.rev+=total(o);return a},{n:0,pc:0,rev:0})}
function group(list,fn){var m={},ks=[];list.forEach(function(o){var k=fn(o);if(!m[k]){m[k]=[];ks.push(k)}m[k].push(o)});return ks.map(function(k){return {k:k,list:m[k],a:agg(m[k])}})}
function tbl(cols,head,rows,bar){
  var mx=Math.max.apply(null,rows.map(function(r){return r[3]}).concat(1));
  return '<div class="tbw"><div class="tb" style="--cols:'+cols+'"><div class="tr th">'+head.map(function(h,i){return '<span class="'+(i&&i<4?'r':'')+'">'+h+'</span>'}).join('')+'</div>'
   +rows.map(function(r){
     var last=bar?'<span class="bar"><i style="width:'+Math.round(r[3]/mx*100)+'%"></i></span>':(r[4]!=null?'<span>'+r[4]+'</span>':'');
     return '<div class="tr"><span class="lbl">'+r[0]+'</span><span class="r num">'+r[1]+'</span><span class="r num">'+r[2]+'</span><span class="r num">'+money(r[3])+'</span>'+last+'</div>';
   }).join('')+'</div></div>';
}
function donut(rows,unit,label){
  var tot=rows.reduce(function(a,x){return a+x[1]},0);if(!tot)return '';
  var C=2*Math.PI*40,off=0,sh=['#000000','#5c5c5c','#9a9a9a','#d0d0d0'];
  var arcs=rows.map(function(x,i){var len=x[1]/tot*C,d=rows.length>1?Math.max(0,len-1.6):len;var a='<circle cx="60" cy="60" r="40" fill="none" stroke="'+sh[i%4]+'" stroke-width="22" stroke-dasharray="'+d.toFixed(2)+' '+(C-d).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 60 60)"/>';off+=len;return a}).join('');
  var lg=rows.map(function(x,i){return '<li><i style="background:'+sh[i%4]+'"></i><span>'+x[0]+'</span><b>'+Math.round(x[1]/tot*100)+'%</b></li>'}).join('');
  return '<div class="pie"><svg viewBox="0 0 120 120" role="img" aria-label="'+label+'">'+arcs+'<text class="pt" x="60" y="62">'+tot.toLocaleString('en-US')+'</text><text class="pl" x="60" y="75">'+unit+'</text></svg><ul>'+lg+'</ul></div>';
}
function wcols(rows,fmt,label){
  var mx=Math.max.apply(null,rows.map(function(x){return x[1]}).concat(1));
  return '<div class="wcols" role="img" aria-label="'+label+'">'+rows.map(function(x){return '<div><b>'+(fmt?fmt(x[1]):x[1])+'</b><i style="height:'+Math.round(x[1]/mx*78)+'px"></i><span>'+x[0]+'</span></div>'}).join('')+'</div>';
}
var RANGES=[['all','All time'],['month','This month'],['4w','Last 4 weeks'],['week','This week']];
function inRange(list){
  var tk=key(new Date()),mon=mondayOf(new Date()),r=state.range;
  if(r==='month')return list.filter(function(o){return o.date.slice(0,7)===tk.slice(0,7)});
  if(r==='4w'){var from=key(addDays(mon,-21));return list.filter(function(o){return o.date>=from})}
  if(r==='week'){var a=key(mon),b=key(addDays(mon,5));return list.filter(function(o){return o.date>=a&&o.date<=b})}
  return list;
}
function pickHtml(){
  return '<div class="pick" role="group" aria-label="Time range"><small>Show</small>'+RANGES.map(function(x){return '<button data-act="range" data-r="'+x[0]+'" aria-pressed="'+(state.range===x[0])+'" class="'+(state.range===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('')+'<button class="csv" data-act="export" data-s="history">Export CSV or report</button></div>';
}
function timeChart(all){
  var m=state.metric,val=function(a){return m==='orders'?a.n:m==='pieces'?a.pc:a.rev},fmt=m==='booked'?money:null,rows=[];
  if(state.range==='week'){
    var mon=mondayOf(new Date());
    rows=DAYNAMES.map(function(nm,i){var k=key(addDays(mon,i));return [nm.slice(0,3),val(agg(all.filter(function(o){return o.date===k})))]});
  }else{
    var ws=group(all,function(o){return key(mondayOf(fromKey(o.date)))}).map(function(g){return g.k}).sort(),by={};
    group(all,function(o){return key(mondayOf(fromKey(o.date)))}).forEach(function(g){by[g.k]=val(g.a)});
    var cur=fromKey(ws[0]),end=fromKey(ws[ws.length-1]),list=[];
    while(cur<=end){list.push(key(cur));cur=addDays(cur,7)}
    rows=list.slice(-12).map(function(k){return [fmtShort(fromKey(k)),by[k]||0]});
  }
  var M=[['orders','Orders'],['pieces','Pieces'],['booked','Booked']];
  return '<h2>'+(state.range==='week'?'Day by day':'Week by week')+'</h2><div class="pick" role="group" aria-label="What to chart"><small>Chart</small>'+M.map(function(x){return '<button data-act="metric" data-m="'+x[0]+'" aria-pressed="'+(state.metric===x[0])+'" class="'+(state.metric===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('')+'</div>'+wcols(rows,fmt,'Chart over time')+(state.range==='week'?'':'<p class="sub">Each bar is a week, labelled with its Monday.</p>');
}
function histHtml(){
  if(!orders.length)return '<div class="book empty"><h2>No orders yet</h2><p>Past orders collect here as you write them.</p></div>';
  var all=inRange(orders);
  if(!all.length)return '<div class="book hist">'+pickHtml()+'<h2>Nothing in this range</h2><p class="sub">Pick another time above.</p></div>';
  var tot=agg(all),picked=all.filter(function(o){return o.status==='picked'}).length;
  var byCust=group(all,custKey);
  var repeat=byCust.filter(function(c){return c.a.n>1}).length;
  var tk=key(new Date()),thisMonth=tk.slice(0,7),thisWeek=key(mondayOf(new Date()));
  var months=group(all,function(o){return o.date.slice(0,7)}).sort(function(a,b){return a.k<b.k?1:-1}).map(function(g){
    var p=g.k.split('-'),nm=new Date(+p[0],+p[1]-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
    return [nm+(g.k===thisMonth?'<small>this month</small>':''),g.a.n,g.a.pc,g.a.rev];
  });
  var weeks=group(all,function(o){return key(mondayOf(fromKey(o.date)))}).sort(function(a,b){return a.k<b.k?1:-1}).map(function(g){
    var m=fromKey(g.k);
    return [fmtShort(m)+' to '+fmtShort(addDays(m,5))+(g.k===thisWeek?'<small>this week</small>':''),g.a.n,g.a.pc,g.a.rev];
  });
  var pr={};
  all.forEach(function(o){o.items.forEach(function(i){var p=prodOf(i.code),f=pr[i.code]=pr[i.code]||{name:p.name,t:0,pc:0,rev:0};f.t+=i.qty;f.pc+=i.qty*(+p.pieces||0);f.rev+=i.qty*(+p.price||0)})});
  var prRows=Object.keys(pr).sort(function(a,b){return pr[b].pc-pr[a].pc}).map(function(k){return [esc(pr[k].name),pr[k].t,pr[k].pc,pr[k].rev]});
  var prPie=prRows.slice(0,3).map(function(x){return [x[0],x[2]]});if(prRows.length>3)prPie.push(['Other',prRows.slice(3).reduce(function(a,x){return a+x[2]},0)]);
  var WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var wdRows=group(all,function(o){return fromKey(o.date).getDay()}).sort(function(a,b){return ((a.k+6)%7)-((b.k+6)%7)}).map(function(g){return [WD[g.k],g.a.n,g.a.pc,g.a.rev]});
  var wdFull=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].concat(wdRows.some(function(x){return x[0]==='Sunday'})?['Sunday']:[]).map(function(nm){var f=wdRows.filter(function(x){return x[0]===nm})[0];return [nm,f?f[1]:0]});
  var onl=all.filter(isWeb),hand=all.filter(function(o){return !isWeb(o)}),srcRows=[['Online',onl.length,onl.reduce(function(s,o){return s+pieces(o)},0),onl.reduce(function(s,o){return s+total(o)},0)],['By hand',hand.length,hand.reduce(function(s,o){return s+pieces(o)},0),hand.reduce(function(s,o){return s+total(o)},0)]].filter(function(x){return x[1]>0});
  var C4='1fr 54px 64px 74px',C5='1.7fr 64px 70px 84px 1fr';
  return '<div class="book hist'+(state.go?' go':'')+'">'+pickHtml()+'<h2>'+RANGES.filter(function(x){return x[0]===state.range})[0][1]+'</h2><div class="hsum">'
   +'<div><b class="num">'+tot.n+'</b><span>orders</span></div><div><b class="num">'+tot.pc.toLocaleString('en-US')+'</b><span>pieces</span></div><div><b class="num">'+money(tot.rev)+'</b><span>booked</span></div>'
   +'<div><b class="num">'+money(tot.rev/tot.n)+'</b><span>average order</span></div><div><b class="num">'+byCust.length+'</b><span>customers, '+repeat+' came back</span></div><div><b class="num">'+picked+'</b><span>picked up</span></div></div>'
   +'<p class="sub" style="margin-top:12px">Booked uses the current prices from the Products tab.</p>'
   +timeChart(all)
   +'<h2>By month</h2>'+tbl(C5,['','Orders','Pieces','Booked',''],months,true)
   +'<h2>By week</h2><p class="sub">Monday to Saturday, newest first.</p>'+tbl(C5,['','Orders','Pieces','Booked',''],weeks,true)
   +'<div class="hgrid"><div><h2>By product</h2>'+donut(prPie,'pieces','Pieces by product')+tbl(C4,['','Sold','Pieces','Booked'],prRows)+'</div><div><h2>By weekday</h2>'+wcols(wdFull.map(function(x){return [x[0].slice(0,3),x[1]]}),null,'Orders by weekday')+tbl(C4,['','Orders','Pieces','Booked'],wdRows)+'</div><div><h2>Online or by hand</h2>'+donut(srcRows.map(function(x){return [x[0],x[1]]}),'orders','Orders online or by hand')+tbl(C4,['','Orders','Pieces','Booked'],srcRows)+'</div></div>'
   +'<h2>Regulars</h2><p class="sub">Orders in this range, matched by phone number or by name when there is none. Tap a name to see everything they have ordered.</p><div class="hq"><div class="fld"><label for="c-q">Search name or phone</label><input id="c-q" type="search" placeholder="marisol, 415" value="'+esc(state.cq)+'"></div></div><p class="sub" id="c-count"></p><div class="tbw" id="c-list"></div>'
   +'<h2>Every order</h2><div class="hq"><div class="fld"><label for="h-q">Search name, phone, note or date</label><input id="h-q" type="search" placeholder="priya, 415, birthday, oct 17" value="'+esc(state.q)+'"></div></div><p class="sub" id="h-count"></p><div class="tbw" id="h-list"></div></div>'
   +'';
}
function histList(){
  var q=(state.q||'').trim().toLowerCase();
  var all=orders.slice().sort(function(a,b){var x=a.date+a.time,y=b.date+b.time;return x<y?1:x>y?-1:0});
  if(q)all=all.filter(function(o){return (o.name+' '+o.phone+' '+o.note+' '+shortItems(o)+' '+shortLabel(o)+' '+labelItems(o)+' '+o.date+' '+fmtLong(fromKey(o.date))).toLowerCase().indexOf(q)>=0});
  var shown=all.slice(0,state.hmax);
  $('#h-count').textContent=all.length+(all.length===1?' order':' orders')+(q?' match':'');
  return shown.map(function(o){
    return '<button class="hrow '+o.status+'" data-act="edit" data-id="'+o.id+'"><span class="num">'+fromKey(o.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+'</span><span class="et"><span class="hl num '+(isWeb(o)?'web':'hand')+'">'+fmtT(o.time)+'</span></span><span class="nm">'+esc(o.name)+(isWeb(o)?'<span class="src web">online</span>':'<span class="src hand">by hand</span>')+'</span><span class="it">'+labelLines(o)+'</span><span class="nt">'+esc(o.note)+'</span><span class="num r" style="text-align:right">'+money(total(o))+'</span></button>';
  }).join('')+(all.length>shown.length?'<button class="link hmore" data-act="hmore">Show more ('+(all.length-shown.length)+' left)</button>':'')+(all.length?'':'<p class="muted" style="margin:10px 0">Nothing matches.</p>');
}
