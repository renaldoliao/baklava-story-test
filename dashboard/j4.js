/* ---------- page turn ---------- */
function isStaff(){return document.body.classList.contains('staff')}
var turning=false,dirty=false;
function makeLeaf(src,w,h){
  var N=16,sw=Math.ceil(w/N),segs=[],root=document.createElement('div'),parent=root;
  root.className='leaf';root.style.width=w+'px';root.style.height=h+'px';
  for(var i=0;i<N;i++){
    var s=document.createElement('div'),clip=document.createElement('div'),c=src.cloneNode(true),back=document.createElement('div'),shade=document.createElement('div');
    s.className='seg';s.style.width=(i<N-1?sw+1:w-sw*(N-1))+'px';s.style.height=h+'px';if(i)s.style.left=sw+'px';
    clip.className='clip';back.className='back';shade.className='shade';
    c.style.cssText='position:absolute;top:0;left:'+(-i*sw)+'px;width:'+w+'px;height:'+h+'px;margin:0';
    clip.appendChild(c);clip.appendChild(back);clip.appendChild(shade);s.appendChild(clip);parent.appendChild(s);parent=s;segs.push({s:s,back:back,shade:shade});
  }
  return {root:root,segs:segs};
}
function turn(dir,change){
  var v=$('#view'),book=v.firstElementChild,html=document.documentElement;
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(turning)return;
  if(!book||!book.classList.contains('book')||reduce){change();renderBoard();return}
  if(window.innerWidth<=700){change();renderBoard();if(v.animate)v.animate([{opacity:0,transform:'translateX('+(dir>0?'':'-')+'28px)'},{opacity:1,transform:'none'}],{duration:260,easing:'cubic-bezier(.2,.7,.2,1)'});return}
  var w=book.offsetWidth,h=book.offsetHeight,old=book.cloneNode(true);
  change();renderBoard();
  var nb=v.firstElementChild;
  if(!nb||!nb.classList.contains('book'))return;
  turning=true;html.style.overflowX='hidden';
  var src=old;
  if(dir<0){src=nb.cloneNode(true);old.style.width=w+'px';old.style.height=h+'px';old.classList.add('under');v.appendChild(old);nb.style.visibility='hidden'}
  var L=makeLeaf(src,w,h),cast=document.createElement('div');
  cast.className='cast';cast.style.width=w+'px';cast.style.height=h+'px';
  v.appendChild(cast);v.appendChild(L.root);
  var D=1000,t0=null,done=false;
  function paint(p){
    var a=-p*178,bend=Math.sin(Math.PI*p)*3.4;
    L.segs.forEach(function(g,i){
      g.s.style.transform='rotateY('+(i?bend:a)+'deg)';
      var abs=a+i*bend;
      g.back.style.opacity=Math.min(1,Math.max(0,(-abs-86)/8));
      g.shade.style.opacity=(Math.abs(Math.sin(abs*Math.PI/180))*.09).toFixed(3);
    });
    L.root.style.opacity=p>.88?Math.max(0,(1-p)/.12):1;
    cast.style.opacity=(Math.sin(Math.PI*p)*.6).toFixed(3);
  }
  function finish(){
    if(done)return;done=true;
    L.root.remove();cast.remove();if(old.parentNode)old.remove();nb.style.visibility='';
    turning=false;html.style.overflowX='';
    if(dirty){dirty=false;renderBoard()}
  }
  function step(ts){
    if(done)return;if(t0===null)t0=ts;
    var t=Math.min(1,(ts-t0)/D),e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    paint(dir>0?e:1-e);
    if(t<1)requestAnimationFrame(step);else finish();
  }
  paint(dir>0?0:1);requestAnimationFrame(step);setTimeout(finish,D+500);
}

/* ---------- sheets ---------- */
function slotList(){var a=[],h=10,m=0;while(h<18){a.push(pad(h)+':'+pad(m));m+=30;if(m===60){m=0;h++}}return a}
function formHtml(o,isEdit){
  return '<h2>'+(isEdit?'Edit order':'Write an order')+'</h2>'+(isEdit&&o.status==='pending'?'<div class="acts" style="margin:-4px 0 16px"><button type="button" class="btn" data-act="confirm" data-id="'+o.id+'">Confirm order</button><span class="muted" style="font-size:14px">Waiting for you. If they ticked the text box, they get a text when you confirm.</span></div>':'')+'<p class="daybig" id="f-daybig"></p><div class="days" id="f-days" role="group" aria-label="Day"></div><form id="f" autocomplete="off">'
  +'<div class="two"><div class="fld"><label for="f-date">Another date</label><input id="f-date" type="date" value="'+o.date+'"></div><div class="fld"><label for="f-time">Time</label><select id="f-time"></select></div></div>'
  +'<div class="fld"><label for="f-name">Name</label><input id="f-name" class="hand" type="text" value="'+esc(o.name)+'"></div>'
  +'<div class="fld"><label for="f-phone">Phone</label><input id="f-phone" type="tel" inputmode="tel" value="'+esc(o.phone)+'"><p class="hint" id="f-ret"></p>'
  +(isEdit?'':'<label class="chk" id="f-textlab"><input type="checkbox" id="f-text" disabled><span>Send the customer a confirmation text<small class="chkn">Ask them first. Tick this only if they say yes.</small></span></label>')+'</div>'
  +'<div class="fld"><label id="f-itl" for="f-add">Items</label><select id="f-add"></select><div id="f-items" class="plines" role="group" aria-labelledby="f-itl"></div><p class="hint num" id="f-prev"></p></div>'
  +'<div class="fld"><label for="f-note">Note</label><textarea id="f-note" placeholder="less sweet, gift box, call when outside">'+esc(o.note)+'</textarea></div>'
  +'<div class="acts"><button class="btn" type="submit">'+(isEdit?'Save changes':'Save order')+'</button><button type="button" class="link" data-act="close">Cancel</button></div>'
  +(isEdit?'<div class="acts" style="margin-top:22px"><button type="button" class="link" data-act="copytext" data-id="'+o.id+'">Copy confirmation text</button><button type="button" class="link danger" data-act="del" data-id="'+o.id+'" id="delbtn">Delete order</button></div><textarea id="msg" hidden readonly style="font:500 15px/1.4 var(--f-ui);margin-top:12px"></textarea>':'')
  +'</form>';
}
function bakeHtml(k){
  var list=onDay(k),by={};
  list.forEach(function(o){o.items.forEach(function(i){var p=prodOf(i.code),f=by[i.code]=by[i.code]||{name:p.name,per:+p.pieces||0,qty:0};f.qty+=i.qty})});
  var tp=list.reduce(function(s,o){return s+pieces(o)},0);
  var rows=Object.keys(by).sort(function(a,b){return by[b].qty*by[b].per-by[a].qty*by[a].per}).map(function(c){
    var f=by[c];
    return '<div class="fl"><div><b>'+esc(f.name)+'</b><small>'+f.qty+' x '+f.per+' pieces</small></div><b class="num">'+f.qty*f.per+'</b></div>';
  }).join('');
  return '<h2>Bake list, '+fmtLong(fromKey(k))+'</h2>'+(list.length?'<p class="big num">'+tp+'</p><p class="muted" style="margin:4px 0 14px">pieces across '+list.length+' order'+(list.length>1?'s':'')+', daily limit '+DAY_CAP+'</p>'+rows:'<p class="muted">Nothing booked for this day.</p>')
   +'<div class="acts" style="margin-top:20px"><button class="btn" data-act="add" data-d="'+k+'">Write an order</button></div>';
}
function numbersHtml(){
  var days=DAYNAMES.map(function(_,i){return key(addDays(state.week,i))});
  var wk=orders.filter(function(o){return days.indexOf(o.date)>=0});
  var rev=wk.reduce(function(s,o){return s+total(o)},0),pc=wk.reduce(function(s,o){return s+pieces(o)},0);
  var per=days.map(dayPieces),mx=Math.max(DAY_CAP,Math.max.apply(null,per));
  return '<h2>'+fmtShort(state.week)+' to '+fmtShort(addDays(state.week,5))+'</h2><div class="stats"><div><b class="num">'+wk.length+'</b><span>orders</span></div><div><b class="num">'+pc+'</b><span>pieces</span></div><div><b class="num">'+money(rev)+'</b><span>booked</span></div></div>'
   +per.map(function(v,i){return '<div class="dayrow"><span>'+DAYNAMES[i].slice(0,3)+' '+fromKey(days[i]).getDate()+'</span><span class="b'+(v>DAY_CAP?' over':'')+'"><i style="width:'+v/mx*100+'%"></i></span><span class="num">'+v+'</span></div>'}).join('')
   +'<p class="muted" style="font-size:14px;margin-top:12px">Pieces booked per day. A day turns red above '+DAY_CAP+'.</p>';
}
function renderSheet(){
  var L=$('#layer'),s=state.sheet;
  if(!s){L.innerHTML='';return}
  var body='';
  if(s.type==='order'){
    var e=s.id&&orders.find(function(o){return o.id===s.id});
    body=formHtml(e||Object.assign({date:s.date,time:'',name:'',phone:'',note:''},s.pre||{}),!!e);
  }else if(s.type==='export')body=exportHtml();
  else if(s.type==='cust')body=custHtml(s.k);
  else if(s.type==='bake')body=bakeHtml(s.date);
  else body=numbersHtml();
  L.innerHTML='<div class="scrim" data-act="close"></div><aside class="sheet'+(s.type==='export'||s.type==='cust'?' mid':'')+'" role="dialog" aria-label="Details"><button class="x" data-act="close">Close</button>'+body+'</aside>';
  if(s.type==='order')wireForm(s);
}
function wireForm(s){
  var e=s.id&&orders.find(function(o){return o.id===s.id});
  var dateEl=$('#f-date'),timeEl=$('#f-time'),itemsEl=$('#f-items');
  function slots(){
    var list=onDay(dateEl.value).filter(function(o){return !e||o.id!==e.id}),cur=timeEl.value||(e?e.time:'');
    timeEl.innerHTML='<option value="">Pick a time</option>'+slotList().map(function(t){
      var n=list.filter(function(o){return o.time===t}).length,full=n>=SLOT_CAP;
      return '<option value="'+t+'"'+(full?' disabled':'')+(t===cur?' selected':'')+'>'+fmtT(t)+(full?' (full)':n?' ('+n+' booked)':'')+'</option>';
    }).join('');
  }
  var q={};(e?e.items:(s.pre&&s.pre.items)||[]).forEach(function(i){q[i.code]=(q[i.code]||0)+i.qty});
  function cur(){return Object.keys(q).filter(function(c){return q[c]>0}).map(function(c){return {code:c,qty:q[c]}})}
  var addEl=$('#f-add');
  function opts(){
    var avail=prods.filter(function(p){return !p.gone&&!isDraft(p)&&p.on&&!q[p.code]}),gs=[],by={};
    avail.forEach(function(p){if(!by[p.gid]){by[p.gid]=[];gs.push(p.gid)}by[p.gid].push(p)});
    addEl.innerHTML='<option value="">'+(avail.length||cur().length?'Add an item':'Nothing is on sale')+'</option>'+gs.map(function(g){
      var l=by[g].sort(function(a,b){return a.pieces-b.pieces});
      return '<optgroup label="'+esc(l[0].grp)+'">'+l.map(function(p){return '<option value="'+esc(p.code)+'">'+p.pieces+' pieces'+(isStaff()?'':', '+money(p.price))+(p.short?'  ('+esc(p.short)+')':'')+'</option>'}).join('')+'</optgroup>';
    }).join('');
    addEl.disabled=!avail.length;
  }
  var lastAdd='';
  function lines(){
    var ids=Object.keys(q).filter(function(c){return q[c]>0});
    itemsEl.innerHTML=ids.map(function(c){
      var p=prodOf(c);
      return '<div class="pl has'+(c===lastAdd?' fresh':'')+'" data-code="'+esc(c)+'"><span class="pn">'+esc(p.name)+'<small>'+[isStaff()?'':money(p.price),p.short?esc(p.short):'',p.on?'':'sold out'].filter(Boolean).join(', ')+'</small></span><span class="step"><button type="button" data-q="-1" aria-label="One less '+esc(p.name)+'">-</button><b class="num">'+q[c]+'</b><button type="button" data-q="1" aria-label="One more '+esc(p.name)+'">+</button></span></div>';
    }).join('');
    lastAdd='';opts();
  }
  addEl.addEventListener('change',function(){
    var c=addEl.value;if(!c)return;
    q[c]=1;lastAdd=c;lines();prev();
  });
  itemsEl.addEventListener('click',function(ev){
    var b=ev.target.closest('[data-q]');if(!b)return;
    var row=b.closest('.pl'),c=row.dataset.code,n=Math.max(0,Math.min(99,(q[c]||0)+ +b.dataset.q));
    q[c]=n;
    if(n===0){row.style.transition='opacity .16s ease';row.style.opacity='0';setTimeout(lines,150)}else{var qb=row.querySelector('b');qb.textContent=n;qb.classList.remove('tick');void qb.offsetWidth;qb.classList.add('tick')}
    prev();
  });
  function prev(){
    var items=cur(),h=$('#f-prev');
    if(!items.length){h.textContent='';h.className='hint';return}
    var pc=0,pr=0;items.forEach(function(i){var p=prodOf(i.code);pc+=(+p.pieces||0)*i.qty;pr+=(+p.price||0)*i.qty});
    var day=dayPieces(dateEl.value)-(e&&e.date===dateEl.value?pieces(e):0);
    h.textContent=pc+' pieces'+(isStaff()?'':', '+money(pr));h.className='hint num'+(day+pc>DAY_CAP?' warn':'');
    if(day+pc>DAY_CAP)h.textContent+='. That day goes over '+DAY_CAP+' pieces.';
  }
  function days(){
    if(!dateEl.value)return;
    var cur=dateEl.value,mon=mondayOf(fromKey(cur)),tk=key(new Date());
    $('#f-daybig').textContent=fmtLong(fromKey(cur));
    $('#f-days').innerHTML=DAYNAMES.map(function(nm,i){
      var d=addDays(mon,i),k=key(d);
      return '<button type="button" data-day="'+k+'" class="'+(k===cur?'on ':'')+(k===tk?'today':'')+'" aria-pressed="'+(k===cur)+'" aria-label="'+fmtLong(d)+'"><small>'+nm.slice(0,3)+'</small><b class="num">'+d.getDate()+'</b></button>';
    }).join('');
  }
  $('#f-days').addEventListener('click',function(ev){
    var b=ev.target.closest('[data-day]');if(!b)return;
    dateEl.value=b.dataset.day;days();slots();prev();
  });
  dateEl.addEventListener('change',function(){days();slots();prev()});
  $('#f-phone').addEventListener('input',function(ev){
    if(!(ev.inputType&&ev.inputType.indexOf('delete')===0)){var f=fmtPhone(this.value);if(f!==this.value&&/\d/.test(this.value))this.value=f}
    var d=usDigits(this.value),r=$('#f-ret'),tx=$('#f-text');
    if(tx){var ok=usOk(this.value);tx.disabled=!ok;if(!ok)tx.checked=false}
    if(isIntl(this.value)&&phoneOk(this.value)){r.textContent='Number outside the US. Texts only go to US numbers, so this one will not get a text.';return}
    if(d.length<7){r.textContent='';return}
    var past=orders.filter(function(o){return usDigits(o.phone)===d});
    if(past.length){r.textContent='Returning customer, '+past.length+' past order'+(past.length>1?'s':'');if(!$('#f-name').value)$('#f-name').value=past[0].name}else r.textContent='';
  });
  $('#f').addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=$('#f-name').value.trim(),date=dateEl.value,time=timeEl.value,items=cur();
    if(!name){toast('Add a name');$('#f-name').focus();return}
    if(!date){toast('Pick a day');dateEl.focus();return}
    if(!time){toast('Pick a time');timeEl.focus();return}
    if(!items.length){toast('Pick at least one item');return}
    var ph=$('#f-phone').value.trim();
    if(ph&&(!e||ph!==e.phone)&&!phoneOk(ph)){toast('That phone number looks wrong. US numbers need 10 digits, other countries start with + and the country code.');$('#f-phone').focus();return}
    var o={id:e?e.id:'o'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),name:name,phone:(phoneOk(ph)?fmtPhone(ph):ph),date:date,time:time,items:items,note:$('#f-note').value.trim(),paid:e?e.paid:'none',status:e?e.status:'new',sample:e?!!e.sample:false,source:e?e.source:'hand',seen:e?e.seen:''};
    var tx=$('#f-text'),wantText=!!(tx&&tx.checked&&!e);
    save(o,wantText).catch(writeFail);flash(o.id);
    state.week=mondayOf(fromKey(date));state.sheet=null;state.confirmDel=false;
    renderBoard();renderSheet();toast((e?'Saved ':'Added ')+name+(wantText?', confirmation text on its way':''));
  });
  lines();days();slots();prev();
  if(s.pre)$('#f-phone').dispatchEvent(new Event('input'));
  if(!e)setTimeout(function(){var t=s.pre?$('#f-time'):$('#f-name');if(t)t.focus()},60);
}
function confirmText(o){
  var d=fromKey(o.date);
  return 'Hi '+o.name.split(' ')[0]+', your Baklava Story order is confirmed: '+longItems(o)+', pickup '+d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+' at '+fmtT(o.time)+', '+ADDRESS+'.'+(o.note?' Noted: '+o.note+'.':'')+' Reply here if anything needs to change.';
}
