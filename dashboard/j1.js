/* Placeholders to confirm with the owner. */
var DEFAULTS=[['12P','Pistachio 12 pieces',12,25],['12W','Walnut 12 pieces',12,25],['12M','Mixed 12 pieces',12,25],['35P','Pistachio 35 pieces',35,55],['35W','Walnut 35 pieces',35,55],['35M','Mixed 35 pieces',35,55],['70P','Pistachio 70 pieces',70,99],['70W','Walnut 70 pieces',70,99],['70M','Mixed 70 pieces',70,99]];
function grpOf(n){var g=String(n).replace(/\s*\b\d+\s*(?:pieces?|pcs?|pc)?\s*$/i,'').trim();return g||String(n).trim()}
function pickShort(p,used){
  var g=String(p.grp||'').toLowerCase().replace(/[^a-z0-9]/g,''),n=p.pieces;if(!g||!(n>=1))return '';
  for(var i=1;i<=Math.min(g.length,4);i++){var c=g.slice(0,i)+'x'+n;if(!used[c])return c}
  var k=2;while(used[g.charAt(0)+'x'+n+'-'+k])k++;
  return g.charAt(0)+'x'+n+'-'+k;
}
function usedShorts(except){var u={};prods.forEach(function(q){if(q!==except&&!q.gone&&q.short)u[String(q.short).toLowerCase()]=1});return u}
function dupShort(p){var s=String(p.short||'').toLowerCase();return !!s&&prods.some(function(q){return q!==p&&!q.gone&&String(q.short||'').toLowerCase()===s})}
function decorate(list){
  var ids={},n=0,used={};
  list.forEach(function(p){var g=grpOf(p.name),k=g.toLowerCase();p.grp=g;p.gid=ids[k]||(ids[k]='g'+(++n));p.auto=!p.short;if(p.short)used[String(p.short).toLowerCase()]=1});
  list.forEach(function(p){if(p.short||p.gone)return;p.short=pickShort(p,used);if(p.short)used[p.short.toLowerCase()]=1});
  return list;
}
function mkName(p){var g=String(p.grp||'').trim();return g&&p.pieces>=1?g+' '+p.pieces+' pieces':''}
var prods=decorate(DEFAULTS.map(function(d){return {code:d[0],name:d[1],pieces:d[2],price:d[3],on:true,gone:false}}));
var prodsLive=false,pdirty=false,pbusy=false,pver=0,ptimer=null;
var SLOT_CAP=3, DAY_CAP=400, ADDRESS='1830 Harrison St';
var DAYNAMES=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

var $=function(s,r){return (r||document).querySelector(s)};
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var pad=function(n){return String(n).padStart(2,'0')};
var key=function(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
var rawDigits=function(v){return String(v==null?'':v).replace(/\D/g,'')};
var isIntl=function(v){var t=String(v==null?'':v).trim();return t[0]==='+'&&rawDigits(t)[0]!=='1'};
var usDigits=function(v){var d=rawDigits(v);if(d[0]==='1')d=d.slice(1);return d};
var usOk=function(v){var d=usDigits(v);return !isIntl(v)&&/^[2-9]\d{2}[2-9]\d{6}$/.test(d)&&d.slice(1,3)!=='11'&&d.slice(4,6)!=='11'&&!/^(\d)\1{9}$/.test(d)};
var phoneOk=function(v){if(isIntl(v)){var n=rawDigits(v).length;return n>=8&&n<=15}return usOk(v)};
var fmtPhone=function(v){if(isIntl(v))return '+'+rawDigits(v).slice(0,15);var d=usDigits(v).slice(0,10);if(!d)return '';if(d.length<4)return '('+d;if(d.length<7)return '('+d.slice(0,3)+') '+d.slice(3);return '('+d.slice(0,3)+') '+d.slice(3,6)+'-'+d.slice(6)};
var fromKey=function(k){var p=k.split('-').map(Number);return new Date(p[0],p[1]-1,p[2],12)};
var addDays=function(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x};
var mondayOf=function(d){var x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x};
var fmtT=function(t){var p=t.split(':').map(Number),h=p[0],m=p[1];return (h%12||12)+(m?':'+pad(m):'')+(h>=12?' pm':' am')};
var fmtLong=function(d){return d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})};
var fmtShort=function(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})};
var money=function(n){n=Math.round((+n||0)*100)/100;return '$'+n.toLocaleString('en-US',{minimumFractionDigits:n%1?2:0,maximumFractionDigits:2})};
function findProd(code){var c=String(code).toUpperCase();for(var i=0;i<prods.length;i++)if(String(prods[i].code).toUpperCase()===c)return prods[i];return null}
function prodOf(code){return findProd(code)||{code:String(code),name:String(code),pieces:0,price:0,on:false,gone:true}}
var pieces=function(o){return o.items.reduce(function(s,i){return s+(+prodOf(i.code).pieces||0)*i.qty},0)};
var total=function(o){return o.items.reduce(function(s,i){return s+(+prodOf(i.code).price||0)*i.qty},0)};
var shortItems=function(o){return o.items.map(function(i){return i.qty+'x'+i.code}).join(', ')};
var labelItems=function(o){return o.items.map(function(i){return i.qty+' x '+prodOf(i.code).name}).join(', ')};
var longItems=labelItems;
var codeOf=function(i){var p=prodOf(i.code);return p.short||p.name};
var shortLabel=function(o){return o.items.map(function(i){return i.qty+' x '+codeOf(i)}).join(', ')};
var labelLines=function(o){return o.items.map(function(i){return esc(i.qty+' x '+codeOf(i))}).join('<br>')};

/* Orders are stored as "2x35P, 1x12W": quantity, then the product code from the Products tab. */
function parseItems(str){
  var out=[],bad=false;
  String(str==null?'':str).split(/[,;\n]+/).forEach(function(part){
    part=part.trim();if(!part)return;
    var m=part.match(/^(?:(\d+)\s*x\s*)?([A-Za-z0-9]+)$/i);
    if(!m){bad=true;return}
    var code=m[2];
    if(/^\d+$/.test(code)&&findProd(code+'P'))code=code+'P';
    var p=findProd(code);
    out.push({code:p?p.code:code,qty:Math.min(99,Math.max(1,+(m[1]||1)))});
  });
  return {items:out,bad:bad};
}

/* ---------- example orders (invented names and numbers) ---------- */
function makeSample(monday,today,nowT){
  var T=[
   [0,'10:00','Marisol R.','415-555-0112',[[35,'P',1]],''],[0,'12:30','Dan K.','415-555-0147',[[12,'P',2]],''],[0,'15:00','Priya S.','415-555-0163',[[70,'P',1]],'less sweet'],
   [1,'11:00','Tom A.','415-555-0129',[[12,'W',1],[12,'P',1]],''],[1,'14:00','Hye-jin L.','415-555-0171',[[35,'M',1]],''],[1,'16:30','Alder Studio','415-555-0190',[[70,'P',2]],'office order, 2 boxes','deposit'],
   [2,'10:30','Ruth B.','415-555-0104',[[12,'P',1]],''],[2,'13:00','Carlos M.','415-555-0138',[[35,'P',1],[12,'W',1]],''],[2,'15:30','Leila H.','415-555-0155',[[70,'W',1]],'gift, no price sticker'],[2,'17:00','Ben F.','415-555-0186',[[12,'M',2]],''],
   [3,'12:00','Anya V.','415-555-0121',[[12,'P',3]],''],[3,'16:00','Katie O.','415-555-0149',[[70,'P',1],[35,'W',1]],'less sweet'],
   [4,'10:00','Nadia P.','415-555-0166',[[35,'P',1]],''],[4,'11:30','Jonah T.','415-555-0133',[[12,'M',2]],''],[4,'14:00','Ellis & Co.','415-555-0198',[[70,'P',2],[35,'M',1]],'pick up by driver','deposit'],[4,'15:30','Sofia R.','415-555-0117',[[12,'P',1]],'call when outside'],[4,'17:00','Marcus D.','415-555-0175',[[35,'W',1]],''],
   [5,'10:00','Lena G.','415-555-0142',[[70,'P',1]],''],[5,'11:00','Imran Q.','415-555-0158',[[35,'P',2]],''],[5,'12:30','Wei C.','415-555-0181',[[12,'W',2]],''],[5,'14:00','Dolores V.','415-555-0109',[[70,'M',1]],'birthday, write Abuela 80','full'],[5,'15:30','Sam N.','415-555-0192',[[12,'P',1]],''],
   [7,'11:00','Marisol R.','415-555-0112',[[35,'P',1]],''],[8,'13:00','Priya S.','415-555-0163',[[70,'P',1]],'less sweet'],[10,'12:00','Alder Studio','415-555-0190',[[70,'P',2]],'office order, 2 boxes','deposit']
  ];
  var tk=key(today);
  return T.map(function(r,i){
    var d=key(addDays(monday,r[0])),st='new';
    if(d<tk||(d===tk&&r[1]<nowT))st='picked';
    return {id:'sample'+pad(i),sample:true,name:r[2],phone:r[3],date:d,time:r[1],
      items:r[4].map(function(x){return {code:x[0]+x[1],qty:x[2]}}),note:r[5],paid:r[6]||'none',status:st};
  });
}

/* ---------- state and data ---------- */
var now=new Date();
function homeWeek(){var n=new Date();return mondayOf(n.getDay()===0?addDays(n,1):n)}
var lastDay=key(now);
var state={week:homeWeek(),sheet:null,confirmDel:false,tab:'week',q:'',hmax:50,cq:'',cmax:10,range:'all',metric:'pieces',go:false,justId:''};
var shutDays={},orders=[],loaded=false,col=null,dbCol=null,live=false;
var marks={};try{marks=JSON.parse(localStorage.getItem('bs-marks')||'{}')||{}}catch(e){marks={}}
function toggleMark(id,el){if(marks[id])delete marks[id];else marks[id]=1;try{localStorage.setItem('bs-marks',JSON.stringify(marks))}catch(e){}el.classList.toggle('marked',!!marks[id])}

var API_URL=window.BS_TEST_API_URL||'', TOKEN='qJCIlsOmZU__eR-3';
var configured=API_URL.indexOf('https://')===0, why='';
function api(body){
  return fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(Object.assign({token:TOKEN},body))})
    .then(function(r){return r.json()}).then(function(j){if(j.error)throw new Error(j.error);return j});
}
function fromRow(r){
  var p=parseItems(String(r.items||''));
  return {id:String(r.id),name:String(r.name||''),phone:String(r.phone||''),date:String(r.date).slice(0,10),time:String(r.time).slice(0,5),items:p.items,note:String(r.note||''),paid:r.paid||'none',status:r.status==='picked'?'picked':r.status==='pending'?'pending':'new',sample:String(r.sample).toLowerCase()==='true',source:String(r.source||'')==='web'?'web':'hand',seen:String(r.seen||'')};
}
function toRow(o){return {id:o.id,date:o.date,time:o.time,name:o.name,phone:o.phone||'',items:shortItems(o),note:o.note||'',paid:o.paid||'none',status:o.status==='picked'?'picked':o.status==='pending'?'pending':'new',sample:o.sample?'true':'',source:o.source==='web'?'web':'hand',seen:o.seen||''}}
function putLocal(o){var i=orders.findIndex(function(x){return x.id===o.id});if(i>=0)orders[i]=o;else orders.push(o)}
function writeFail(){toast('That did not save to the spreadsheet. Check the internet connection and try again.')}
function save(o,text){putLocal(o);return configured?api({action:'upsert',row:toRow(o),text:!!text}):Promise.resolve()}
function remove(id){orders=orders.filter(function(o){return o.id!==id});return configured?api({action:'delete',id:id}):Promise.resolve()}
function flash(id){state.justId=id;clearTimeout(flash.t);flash.t=setTimeout(function(){state.justId=''},700)}
var closeBusy=0;
function closeDay(k){
  var on=!shutDays[k],n=onDay(k).length;
  if(on)shutDays[k]=1;else delete shutDays[k];
  renderBoard();
  toast(on?'Closed '+fmtLong(fromKey(k))+' to online orders'+(n?'. The '+n+(n===1?' order already booked stays.':' orders already booked stay.'):'.'):'Reopened '+fmtLong(fromKey(k)));
  if(!configured)return;
  closeBusy++;
  api({action:'closeDay',date:k,closed:on}).then(function(){closeBusy--}).catch(function(e){
    closeBusy--;if(on)delete shutDays[k];else shutDays[k]=1;renderBoard();
    toast(String(e&&e.message)==='unknown action'?'Update the Apps Script first, then days can be closed.':'That did not save. Check the connection and try again.');
  });
}
function toggle(id){
  var o=orders.find(function(x){return x.id===id});if(!o)return;
  o.status=o.status==='picked'?'new':'picked';flash(id);renderBoard();
  if(configured)api({action:'status',id:id,status:o.status}).catch(writeFail);
}
function load(){
  return loadProducts().then(loadNotes).then(function(){return fetch(API_URL+'?action=list&token='+encodeURIComponent(TOKEN))}).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);
    var first=!loaded,known={};orders.forEach(function(o){known[o.id]=1});
    if(Array.isArray(j.closed)&&!closeBusy){shutDays={};j.closed.forEach(function(d){shutDays[d]=1})}orders=j.rows.filter(function(r){return r.id}).map(fromRow);loaded=true;live=true;why='';state.go=false;
    var fresh=orders.filter(function(o){return o.status==='pending'&&!known[o.id]});
    if(!first&&fresh.length){toast(fresh.length>1?fresh.length+' new online orders to confirm':'New online order from '+fresh[0].name+', confirm it');chime()}
    renderBoard();
  }).catch(function(e){why=(e&&e.message)||'could not reach it';if(!loaded)fallback();else{live=false;renderBoard()}});
}
/* ---------- products ---------- */
function fromProd(p){var o={code:String(p.code),name:String(p.name||''),pieces:+p.pieces||0,price:+p.price||0,on:p.on===true||p.on==='yes',gone:p.gone===true||p.gone==='yes',img:String(p.img||''),short:String(p.short||'')};o.base=snap(o);return o}
function snap(p){return {code:p.code,name:p.name,pieces:p.pieces,price:p.price,on:p.on,gone:p.gone,img:p.img||'',short:p.short||''}}
function toProd(p){return {code:p.code,name:String(p.name).trim(),pieces:p.pieces,price:p.price,on:!!p.on,gone:!!p.gone,img:p.img||'',short:p.short||''}}
function isDraft(p){return !String(p.name).trim()||!(p.pieces>=1)||!(p.price>=0)||dupShort(p)}
function loadProducts(){
  return fetch(API_URL+'?action=products&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(!Array.isArray(j.products))return;
    prodsLive=true;
    if(!pdirty&&!pbusy&&!prods.some(isDraft))prods=decorate(j.products.map(fromProd));
  }).catch(function(){});
}
function setPStatus(t){
  var el=$('#psave');if(!el)return;
  el.textContent=t;el.classList.remove('fade');
  clearTimeout(setPStatus.t);
  if(t==='Saved')setPStatus.t=setTimeout(function(){el.classList.add('fade')},2200);
}
function queueSave(){pdirty=true;pver++;setPStatus('Saving');clearTimeout(ptimer);ptimer=setTimeout(flushProds,600)}
function flushProds(){
  if(pbusy){ptimer=setTimeout(flushProds,300);return}
  var gi={};prods.forEach(function(p){if(!p.gone&&p.img&&!gi[p.gid])gi[p.gid]=p.img});prods.forEach(function(p){if(!p.gone)p.img=gi[p.gid]||''});
  var v=pver,list=prods.filter(function(p){return !isDraft(p)});
  if(!configured){pdirty=false;setPStatus('Saved here only');return}
  pbusy=true;
  api({action:'saveProducts',products:list.map(toProd)}).then(function(){
    pbusy=false;prodsLive=true;
    list.forEach(function(p){p.base=snap(p)});
    if(pver===v){pdirty=false;setPStatus('Saved')}
  }).catch(function(e){
    pbusy=false;
    setPStatus(String(e&&e.message)==='unknown action'?'Not saved. Update the Apps Script first.':'Not saved. Check the connection, then edit again.');
  });
}
function prodByCode(c){for(var i=0;i<prods.length;i++)if(prods[i].code===c)return prods[i];return null}
var PHINT='Fill in the name, size and price to put this on the order page.';
function hintFor(p){return dupShort(p)?'That code is already used by another size.':isDraft(p)?PHINT:''}
function refreshHints(){Array.prototype.forEach.call(document.querySelectorAll('.prow'),function(r){var q=prodByCode(r.dataset.code);if(q)r.querySelector('.phint').textContent=hintFor(q)})}
function autoShort(p){
  if(!p.auto)return;
  p.short=pickShort(p,usedShorts(p));
  var inp=document.querySelector('.prow[data-code="'+p.code+'"] [data-pf="short"]');
  if(inp&&inp!==document.activeElement)inp.value=p.short;
}
function prodRow(p,fresh){
  return '<div class="prow'+(p.on?'':' off')+(fresh?' fresh':'')+'" data-code="'+esc(p.code)+'">'
   +'<span class="pf"><input data-pf="pieces" aria-label="Pieces" type="text" inputmode="numeric" value="'+(isNaN(p.pieces)?'':p.pieces)+'" placeholder="12" autocomplete="off"></span>'
   +'<span class="pf"><input data-pf="short" aria-label="Code" type="text" maxlength="8" value="'+esc(p.short||'')+'" placeholder="px12" autocomplete="off" autocapitalize="characters" spellcheck="false"></span>'
   +'<span class="pf"><span class="pw"><i>$</i><input data-pf="price" aria-label="Price" type="text" inputmode="decimal" value="'+(isNaN(p.price)?'':p.price)+'" autocomplete="off"></span></span>'
   +'<button type="button" class="sw'+(p.on?' on':'')+'" role="switch" aria-checked="'+!!p.on+'" aria-label="On sale" title="On sale" data-act="ptoggle"><i aria-hidden="true"></i><span>'+(p.on?'':'Sold out')+'</span></button>'
   +'<button type="button" class="prm x" data-act="pdel" aria-label="Remove this size">&times;</button>'
   +'<p class="phint">'+hintFor(p)+'</p></div>';
}
function prodGroup(gid,list,fresh){
  var l=list.slice().sort(function(a,b){return (isNaN(a.pieces)?1e9:a.pieces)-(isNaN(b.pieces)?1e9:b.pieces)});
  var gi=l.map(function(p){return p.img}).filter(Boolean)[0]||'';
  return '<section class="pg'+(fresh?' fresh':'')+'" data-g="'+esc(gid)+'"><label class="pimg'+(gi?' has':'')+'" data-img="'+esc(gi)+'"><input type="file" accept="image/*" data-pimg aria-label="Upload a photo"><span>'+(gi?'Change photo':'Add a photo')+'</span></label>'
   +'<div class="pbody"><input class="pgn" data-pg aria-label="Name" type="text" maxlength="26" value="'+esc(l[0].grp)+'" placeholder="Name, like Pistachio" autocomplete="off">'
   +'<div class="pcap" aria-hidden="true"><span>Pieces</span><span>Code</span><span>Price</span><span></span><span></span></div>'
   +l.map(function(p){return prodRow(p)}).join('')
   +'<div class="pft"><button type="button" class="prm" data-act="gadd">Add a size</button><button type="button" class="prm gimg" data-act="gimgdel">Remove photo</button></div></div></section>';
}
var imgs={};
function getImg(id,cb){
  if(imgs[id]){cb(imgs[id]);return}
  if(!configured)return;
  fetch(API_URL+'?action=image&id='+encodeURIComponent(id)).then(function(r){return r.json()}).then(function(j){if(j&&j.data){imgs[id]=j.data;cb(j.data)}}).catch(function(){});
}
function showImg(box,data){
  var old=box.querySelector('img');if(old)old.remove();
  var im=document.createElement('img');im.alt='';im.src=data;box.insertBefore(im,box.firstChild);
  box.classList.add('has');box.querySelector('span').textContent='Change photo';
}
function hideImg(box){
  var old=box.querySelector('img');if(old)old.remove();
  box.classList.remove('has');box.dataset.img='';box.querySelector('span').textContent='Add a photo';
}
function hydrate(root){
  Array.prototype.forEach.call(root.querySelectorAll('.pimg[data-img]'),function(box){
    var id=box.dataset.img;if(!id||box.querySelector('img'))return;
    getImg(id,function(d){if(box.dataset.img===id&&!box.querySelector('img'))showImg(box,d)});
  });
}
function shrink(file){
  return new Promise(function(res,rej){
    var url=URL.createObjectURL(file),im=new Image();
    im.onload=function(){
      URL.revokeObjectURL(url);
      var W=480,H=360,c=document.createElement('canvas');c.width=W;c.height=H;
      var x=c.getContext('2d'),r=Math.max(W/im.width,H/im.height),w=im.width*r,h=im.height*r;
      x.fillStyle='#fff';x.fillRect(0,0,W,H);x.drawImage(im,(W-w)/2,(H-h)/2,w,h);
      var q=.78,d=c.toDataURL('image/jpeg',q);
      while(d.length>45000&&q>.3){q-=.08;d=c.toDataURL('image/jpeg',q)}
      if(d.length>45000){rej(new Error('too big'));return}
      res(d);
    };
    im.onerror=function(){URL.revokeObjectURL(url);rej(new Error('not an image'))};
    im.src=url;
  });
}
function prodGroups(){
  var ids=[],by={};
  prods.filter(function(p){return !p.gone}).forEach(function(p){if(!by[p.gid]){by[p.gid]=[];ids.push(p.gid)}by[p.gid].push(p)});
  return ids.map(function(g){return prodGroup(g,by[g])}).join('');
}
function prodHtml(){
  var list=prods.filter(function(p){return !p.gone});
  return '<div class="book hist prodtab'+(state.go?' go':'')+'"><div class="phead"><div><h2>Products</h2><p class="sub">What the order page offers. Changes save on their own.</p></div><div class="pact"><span class="psave" id="psave" aria-live="polite"></span><button class="btn" data-act="padd">Add a product</button></div></div>'
   +(prodsLive?'':'<p class="pwarn">Products are not connected to the spreadsheet yet, so changes here will not save. Update the Apps Script, then reload this page.</p>')
   +'<div class="plist" id="plist">'+(list.length?prodGroups():'<p class="muted" id="pempty" style="margin:14px 0">Nothing yet. Add the first product.</p>')+'</div>'
   +'<p class="sub pfoot">Each card is one product with its sizes. Switch a size off to mark it sold out and hide it from the order page. Removing keeps old orders as they were.</p></div>';
}
function bakeIdle(){var a=document.activeElement;return pdirty||pbusy||(a&&a.closest&&a.closest('#plist'))}

function init(){
  if(!configured){why='paste the web app link into API_URL';fallback();return}
  load();
  setInterval(function(){if(!state.sheet||state.sheet.type!=='order')load()},20000);
}
function fallback(){
  live=false;var n=new Date();orders=makeSample(mondayOf(n),n,pad(n.getHours())+':'+pad(n.getMinutes()));loaded=true;renderBoard();
}
function onDay(k){return orders.filter(function(o){return o.date===k}).sort(function(a,b){return a.time<b.time?-1:a.time>b.time?1:0})}
function dayPieces(k){return onDay(k).reduce(function(s,o){return s+pieces(o)},0)}
function srcTag(o){return isWeb(o)?'<span class="src web">online</span>'+(o.status==='pending'?'<span class="newtag">to confirm</span>':''):'<span class="src hand">by hand</span>'}
function isWeb(o){return o.source==='web'}
function chime(){try{var C=window.AudioContext||window.webkitAudioContext,c=new C(),t=c.currentTime;[784,1047].forEach(function(f,i){var o=c.createOscillator(),g=c.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.16);g.gain.linearRampToValueAtTime(.18,t+i*.16+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.16+.4);o.connect(g);g.connect(c.destination);o.start(t+i*.16);o.stop(t+i*.16+.45)})}catch(e){}}
function markSeen(ids){
  var list=orders.filter(function(o){return ids.indexOf(o.id)>=0&&!o.seen});
  if(!list.length)return;
  list.forEach(function(o){o.seen='yes'});
  if(configured)api({action:'seen',ids:list.map(function(o){return o.id})}).catch(writeFail);
}
function setTabsUI(){
  var hist=state.tab!=='week';
  $('.weeknav').classList.toggle('off',hist);$('.toplinks').classList.toggle('off',hist);
  Array.prototype.forEach.call(document.querySelectorAll('.tabs button'),function(b){var on=b.dataset.t===state.tab;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  placeBar();
}
function placeBar(){
  var b=$('.tabs button.on'),bar=$('.tabbar');if(!b||!bar||!b.offsetWidth)return;
  bar.style.width=(b.offsetWidth-24)+'px';bar.style.transform='translateX('+(b.offsetLeft+12)+'px)';
}
function switchTab(t){
  var v=$('#view');
  if(turning||state.tab===t)return;
  state.tab=t;state.sheet=null;state.go=true;renderSheet();
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce||!v.animate||!loaded){renderBoard();window.scrollTo(0,0);return}
  setTabsUI();
  turning=true;
  var out=v.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(6px)'}],{duration:140,easing:'ease-in',fill:'forwards'});
  var go=function(){
    turning=false;out.cancel();renderBoard();window.scrollTo(0,0);
    v.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:340,easing:'cubic-bezier(.2,.7,.2,1)'});
  };
  var done=false;out.onfinish=function(){if(!done){done=true;go()}};setTimeout(function(){if(!done){done=true;go()}},400);
}
var noticeN=0;
function renderNotice(){
  var el=$('#notice'),n=orders.filter(function(o){return o.status==='pending'}).sort(function(a,b){return (a.date+a.time)<(b.date+b.time)?-1:1});
  if(!n.length){noticeN=0;el.hidden=true;el.innerHTML='';document.title='Baklava Story Orders';return}
  var anim=n.length!==noticeN;noticeN=n.length;el.hidden=false;
  el.innerHTML='<div class="notice'+(anim?' in':'')+'" role="status"><b>'+n.length+(n.length>1?' online orders to confirm':' online order to confirm')+'</b><div class="ni">'
    +n.slice(0,4).map(function(o){return '<button data-act="opennew" data-id="'+o.id+'">'+esc(o.name)+', '+fromKey(o.date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})+' '+fmtT(o.time)+', '+esc(shortLabel(o))+'</button>'}).join('')
    +(n.length>4?'<span>and '+(n.length-4)+' more</span>':'')+'</div></div>';
  document.title='('+n.length+') Baklava Story Orders';
}
function confirmOrder(id){
  var o=orders.find(function(x){return x.id===id});if(!o||o.status!=='pending')return;
  o.status='new';flash(id);
  if(state.sheet){state.sheet=null;renderSheet()}
  renderBoard();
  toast('Confirmed '+o.name+(usOk(o.phone)?', text on its way':''));
  if(configured)api({action:'confirm',id:id}).catch(function(){o.status='pending';renderBoard();writeFail()});
}
function askPick(o){
  var el=$('#pop');
  el.innerHTML='<div class="pop" role="dialog" aria-modal="true" aria-label="Confirm order pickup"><h3>Confirm order pickup</h3><p>'+esc(o.name)+', '+fmtT(o.time)+', '+esc(labelItems(o))+'</p><div class="acts"><button class="btn" data-act="popyes" data-id="'+o.id+'" id="pop-yes">Confirm</button><button class="link" data-act="popno">Back</button><button class="link danger" data-act="popcancel" data-id="'+o.id+'">Cancel order</button></div></div>';
  el.hidden=false;$('#pop-yes').focus();
}
function askUndo(o){
  var el=$('#pop');
  el.innerHTML='<div class="pop" role="dialog" aria-modal="true" aria-label="Order picked up"><h3>Order picked up</h3><p>'+esc(o.name)+', '+fmtT(o.time)+', '+esc(labelItems(o))+'</p><div class="acts"><button class="btn" data-act="popundo" data-id="'+o.id+'" id="pop-yes">Not picked up</button><button class="link" data-act="popno">Back</button><button class="link danger" data-act="popcancel" data-id="'+o.id+'">Cancel order</button></div></div>';
  el.hidden=false;$('#pop-yes').focus();
}
function closePop(){var el=$('#pop');el.hidden=true;el.innerHTML=''}
function toast(m){var t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){t.hidden=true},3200)}

/* ---------- the notebook ---------- */
function renderBoard(){
  if(turning){dirty=true;return}
  $('#range').textContent=fmtShort(state.week)+' to '+fmtShort(addDays(state.week,5));
  (function(){var d=Math.round((state.week-homeWeek())/604800000);$('#rangesub').textContent=d===0?'This week':d===-1?'Last week':d===1?'Next week':d>0?d+' weeks ahead':(-d)+' weeks ago'})();
  $('#sync').innerHTML=!loaded?'':live?'':'Not connected to the spreadsheet. These are example orders and changes are not saved.'+(why?' ('+why+')':'');
  renderNotice();
  var v=$('#view'),hist=state.tab==='history';
  setTabsUI();$('.help').hidden=state.tab!=='week';
  if(!loaded){v.innerHTML='<p class="muted">Loading the board</p>';return}
  if(hist){
    var ae=document.activeElement,hid=ae&&(ae.id==='h-q'||ae.id==='c-q')?ae.id:'';
    v.innerHTML=histHtml();fillList();fillCust();
    if(hid){var q=$('#'+hid);q.focus();q.setSelectionRange(q.value.length,q.value.length)}
    return;
  }
  if(state.tab==='products'){
    if(v.querySelector('#plist')&&bakeIdle())return;
    v.innerHTML=prodHtml();hydrate(v);return;
  }
  if(!orders.length&&live){
    v.innerHTML='<div class="book empty"><h2>The notebook is empty</h2><p>Add the first order to get started.</p><div class="acts"><button class="btn" data-act="add" data-d="'+key(new Date())+'">Write an order</button></div></div>';
    return;
  }
  var tk=key(new Date());
  var cols=DAYNAMES.map(function(nm,i){
    var d=addDays(state.week,i),k=key(d),list=onDay(k),pc=dayPieces(k);
    var ents=list.slice().sort(function(a,b){return (a.status==='pending'?0:1)-(b.status==='pending'?0:1)}).map(function(o){
      return '<div class="ent '+o.status+(o.id===state.justId?' just':'')+'"><button class="body" data-act="'+(o.status==='pending'?'edit':'cross')+'" data-id="'+o.id+'" '+(o.status==='pending'?'':'aria-pressed="'+(o.status==='picked')+'" ')+'aria-label="'+esc(o.name)+', '+fmtT(o.time)+(isWeb(o)?', online order':', by hand')+(o.status==='picked'?', picked up':'')+'"><span class="et"><span class="hl num '+(isWeb(o)?'web':'hand')+(marks[o.id]?' marked':'')+'" data-k="'+o.date+'" data-t="'+o.time+'" data-s="'+o.status+'">'+fmtT(o.time)+'</span></span>'+srcTag(o)+'<span class="en'+(marks[o.id+'n']?' marked':'')+'">'+esc(o.name)+'</span><span class="ei">'+labelLines(o)+'</span>'+(o.phone?'<span class="ph num">'+esc(o.phone)+'</span>':'')+(o.note?'<span class="circle'+(marks[o.id+'c']?' marked':'')+'">'+esc(o.note)+'</span>':'')+(notes[custKey(o)]?'<span class="cnote">'+esc(notes[custKey(o)])+'</span>':'')+'</button>'+(o.status==='pending'?'<button class="conf" data-act="confirm" data-id="'+o.id+'" aria-label="Confirm order for '+esc(o.name)+'">Confirm</button>':'<button class="ed" data-act="edit" data-id="'+o.id+'" aria-label="Edit '+esc(o.name)+'">edit</button>')+'</div>';
    }).join('');
    return '<div class="col'+(k===tk?' istoday':'')+(shutDays[k]?' isclosed':'')+'"><button class="dh" data-act="bake" data-d="'+k+'"><span class="dn"><span>'+nm+'</span></span><span class="dd">'+fmtShort(d)+'</span> <span class="load num">'+(pc?' &middot; '+pc+' pc':'')+'</span>'+(shutDays[k]?'<span class="closedtag">Closed online</span>':'')+'</button>'+ents+'<button class="addline" data-act="add" data-d="'+k+'">+ write an order</button><button class="addline closeday" data-act="closeday" data-d="'+k+'">'+(shutDays[k]?'Closed to online orders. Reopen':'Close this day to online orders')+'</button></div>';
  }).join('');
  v.innerHTML='<div class="book"><div class="week">'+cols+'</div></div>';
  markSoon();
  if(!renderBoard.sc&&live&&window.innerWidth<=700&&+state.week===+homeWeek()){renderBoard.sc=1;var td=$('.istoday');if(td)setTimeout(function(){window.scrollTo({top:Math.max(0,td.getBoundingClientRect().top+window.scrollY-8)})},60)}
}
function markSoon(){
  var n=new Date(),tk=key(n),nm=n.getHours()*60+n.getMinutes();
  Array.prototype.forEach.call(document.querySelectorAll('.hl[data-k]'),function(e){var p=e.dataset.t.split(':'),d=+p[0]*60+ +p[1]-nm;e.classList.toggle('soon',e.dataset.k===tk&&e.dataset.s==='new'&&d<=120&&d>=-30)});
}
