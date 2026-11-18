/* Partners: wholesale customers who pay by check. Own prices, own orders (kept off the Week board),
   one invoice per order, emailed from the dashboard. Owner logins only: staff never see this tab. */
(function(){
  var st=document.createElement('style');
  st.textContent='.ptn h2{font:700 28px/1.1 var(--f-head);margin:0}'
   +'.ptn .phead{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin:4px 0 6px}'
   +'.ptn .phead .btn{flex:none}'
   +'.ptn .owed{margin:0 0 22px;color:var(--ink2)}.ptn .owed b{color:var(--ink)}'
   +'.ptn h3{font:700 19px/1.2 var(--f-head);margin:26px 0 8px;padding-bottom:6px;border-bottom:2px solid var(--ink)}'
   +'.ptn .row{display:grid;grid-template-columns:92px 1fr auto;gap:4px 16px;align-items:start;padding:12px 0;border-bottom:1px solid var(--rule2)}'
   +'.ptn .row .inv{font-weight:700;font-variant-numeric:tabular-nums}.ptn .row .inv small{display:block;font-weight:400;color:var(--ink2)}'
   +'.ptn .row .what b{display:block}.ptn .row .what span{color:var(--ink2);font-size:15px}'
   +'.ptn .row .amt{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}'
   +'.ptn .row .acts2{grid-column:2/-1;display:flex;flex-wrap:wrap;gap:6px 18px;font-size:14px;color:var(--ink2)}'
   +'.ptn .row .acts2 .link{color:var(--ink2);font-size:14px}'
   +'.ptn .unpaid{display:inline-block;padding:0 6px;font:700 11px/1.6 var(--f-ui);background:#000;color:#fff;margin-top:4px}'
   +'.ptn .ispaid{display:inline-block;padding:0 6px;font:700 11px/1.6 var(--f-ui);background:#fde047;color:#000;margin-top:4px}'
   +'.ptn .prow{display:flex;justify-content:space-between;gap:16px;width:100%;text-align:left;padding:12px 0;border-bottom:1px solid var(--rule2)}'
   +'.ptn .prow b{display:block}.ptn .prow span{color:var(--ink2);font-size:15px}.ptn .prow .r{text-align:right;flex:none}'
   +'.ptn .empty{color:var(--ink2);padding:12px 0}'
   +'.psheet .prices{display:grid;grid-template-columns:1fr 110px;gap:4px 14px;align-items:end;margin:6px 0 18px}'
   +'.psheet .prices .pn{font-size:15px;padding-bottom:10px}.psheet .prices .pn small{color:var(--ink2);display:block}'
   +'.psheet .plh{font-size:14px;font-weight:600;color:var(--ink2);margin:8px 0 2px}'
   +'.psheet .line{display:grid;grid-template-columns:1fr 80px auto;gap:10px;align-items:end;margin-bottom:8px}'
   +'.psheet .line .link{padding-bottom:12px;font-size:14px;color:var(--ink2)}'
   +'.psheet .ptot{font-weight:700;font-size:18px;margin:10px 0 18px;font-variant-numeric:tabular-nums}'
   +'.psheet .acts{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center}'
   +'@media(max-width:600px){.ptn .row{grid-template-columns:1fr auto}.ptn .row .inv{grid-column:1/-1}.ptn .row .acts2{grid-column:1/-1}}';
  document.head.appendChild(st);
  var nav=document.querySelector('.tabs'),bar=nav&&nav.querySelector('.tabbar');
  if(nav&&bar)bar.insertAdjacentHTML('beforebegin','<button data-act="tab" data-t="partners">Partners</button>');
})();
var pdata={partners:[],porders:[]},ploaded=false,ploading=false,parmed='';
function pget(q){return fetch(API_URL+'?action='+q+'&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){if(j.error)throw new Error(j.error);return j})}
function loadPartners(){
  if(ploading)return;ploading=true;
  pget('partners').then(function(j){pdata={partners:j.partners||[],porders:j.porders||[]};ploaded=true}).catch(function(e){toast(String(e.message||e))}).then(function(){ploading=false;if(state.tab==='partners')renderBoard()});
}
function partnerOf(id){return pdata.partners.find(function(p){return p.id===id})}
function pprices(p){try{return JSON.parse(p&&p.prices||'{}')||{}}catch(e){return {}}}
function priceFor(p,code){var o=pprices(p);return o[code]!=null?+o[code]:+(prodOf(code).price||0)}
function itemsLabel(str){var r=parseItems(str);return (r.items||[]).map(function(i){return i.qty+' x '+prodOf(i.code).name}).join(', ')}
function shortDay(k){return fromKey(k).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function partnersHtml(){
  if(!ploaded)return '<div class="ptn"><p class="muted">Loading partners</p></div>';
  var os=pdata.porders.slice().sort(function(a,b){return (b.date+b.invoice)<(a.date+a.invoice)?-1:1});
  var unpaid=os.filter(function(o){return !o.paid}),owed=unpaid.reduce(function(s,o){return s+(+o.total||0)},0);
  var rows=os.map(function(o){
    var p=partnerOf(o.partner)||{name:'(removed partner)'},arm=parmed===o.id;
    return '<div class="row"><div class="inv">'+esc(o.invoice)+'<small>'+shortDay(o.date)+'</small></div>'
     +'<div class="what"><b>'+esc(p.name)+'</b><span>'+esc(itemsLabel(o.items))+'</span>'+(o.note?'<span> ('+esc(o.note)+')</span>':'')+'</div>'
     +'<div class="amt">'+money(+o.total||0)+'<br>'+(o.paid?'<span class="ispaid">Paid</span>':'<span class="unpaid">Unpaid</span>')+'</div>'
     +'<div class="acts2"><button class="link" data-act="pinv" data-id="'+o.id+'">View invoice</button>'
     +'<button class="link" data-act="pmail" data-id="'+o.id+'">'+(arm?'Tap again to email '+esc(p.email||''):'Email invoice')+'</button>'
     +'<button class="link" data-act="ppaid" data-id="'+o.id+'">'+(o.paid?'Mark unpaid':'Mark paid')+'</button>'
     +'<button class="link" data-act="pedit" data-id="'+o.id+'">Edit</button>'
     +(o.sent?'<span>Emailed '+esc(shortDay(o.sent.slice(0,10)))+'</span>':'')+'</div></div>';
  }).join('');
  var plist=pdata.partners.slice().sort(function(a,b){return a.name.toLowerCase()<b.name.toLowerCase()?-1:1}).map(function(p){
    var mine=pdata.porders.filter(function(o){return o.partner===p.id}),due=mine.filter(function(o){return !o.paid}).reduce(function(s,o){return s+(+o.total||0)},0);
    return '<button class="prow" data-act="ppartner" data-id="'+p.id+'"><span><b>'+esc(p.name)+'</b>'+esc([p.contact,p.email].filter(Boolean).join(', '))+'</span><span class="r">'+mine.length+' invoice'+(mine.length===1?'':'s')+(due?'<br><b>'+money(due)+' unpaid</b>':'')+'</span></button>';
  }).join('');
  return '<div class="ptn"><div class="phead"><h2>Partners</h2><button class="btn" data-act="pneworder">New partner order</button><button class="link" data-act="pnewpartner">Add a partner</button></div>'
   +'<p class="owed">'+(unpaid.length?'<b>'+money(owed)+'</b> unpaid across '+unpaid.length+' invoice'+(unpaid.length===1?'':'s')+'.':'Everything is paid.')+'</p>'
   +'<h3>Invoices</h3>'+(rows||'<p class="empty">No partner orders yet. Add a partner, then make their first order.</p>')
   +'<h3>Partners</h3>'+(plist||'<p class="empty">No partners yet.</p>')+'</div>';
}
var _renderBoard3=renderBoard;
renderBoard=function(){
  if(state.tab!=='partners')return _renderBoard3.apply(this,arguments);
  if(turning){dirty=true;return}
  setTabsUI();$('.help').hidden=true;$('#notice').hidden=true;
  $('#view').innerHTML=partnersHtml();
  if(!ploaded)loadPartners();
};
function openPSheet(html){
  $('#layer').innerHTML='<div class="scrim" data-act="close"></div><aside class="sheet psheet" role="dialog" aria-label="Partners"><button class="x" data-act="close">Close</button>'+html+'</aside>';
  state.sheet={type:'partner'};
}
function partnerForm(p){
  p=p||{};var pr=pprices(p);
  var list=prods.filter(function(x){return !x.gone&&!isDraft(x)});
  openPSheet('<h2>'+(p.id?'Edit partner':'Add a partner')+'</h2><form id="pf" autocomplete="off">'
   +'<div class="fld"><label for="pf-name">Business name</label><input id="pf-name" value="'+esc(p.name||'')+'"></div>'
   +'<div class="two"><div class="fld"><label for="pf-contact">Contact person</label><input id="pf-contact" value="'+esc(p.contact||'')+'"></div>'
   +'<div class="fld"><label for="pf-phone">Phone</label><input id="pf-phone" type="tel" value="'+esc(p.phone||'')+'"></div></div>'
   +'<div class="fld"><label for="pf-email">Email for invoices</label><input id="pf-email" type="email" value="'+esc(p.email||'')+'"></div>'
   +'<div class="fld"><label for="pf-address">Address on the invoice</label><input id="pf-address" value="'+esc(p.address||'')+'"></div>'
   +'<p class="plh">Their prices</p><p class="muted" style="font-size:14px;margin:0 0 6px">Leave a box empty to use the regular price.</p><div class="prices">'
   +list.map(function(x){return '<div class="pn">'+esc(x.name)+'<small>Regular '+money(x.price)+'</small></div><input inputmode="decimal" data-pc="'+esc(x.code)+'" placeholder="'+esc(String(x.price))+'" value="'+(pr[x.code]!=null?esc(String(pr[x.code])):'')+'" aria-label="Price for '+esc(x.name)+'">'}).join('')
   +'</div><div class="fld"><label for="pf-note">Note</label><input id="pf-note" value="'+esc(p.note||'')+'" placeholder="Delivery days, who to ask for"></div>'
   +'<div class="acts"><button class="btn" type="submit">Save partner</button><button type="button" class="link" data-act="close">Cancel</button></div></form>');
  $('#pf').addEventListener('submit',function(ev){
    ev.preventDefault();var prices={};
    Array.prototype.forEach.call(document.querySelectorAll('#pf [data-pc]'),function(i){if(i.value.trim()!=='')prices[i.dataset.pc]=i.value.trim().replace(/[$,]/g,'')});
    var body={action:'savePartner',partner:{id:p.id||'',name:$('#pf-name').value,contact:$('#pf-contact').value,phone:$('#pf-phone').value,email:$('#pf-email').value,address:$('#pf-address').value,note:$('#pf-note').value,prices:prices}};
    var b=ev.target.querySelector('[type=submit]');b.disabled=true;
    api(body).then(function(){state.sheet=null;renderSheet();toast('Saved '+body.partner.name.trim());ploaded=false;loadPartners()}).catch(function(e){b.disabled=false;toast(String(e.message||e))});
  });
}
function porderForm(o){
  o=o||{};
  if(!pdata.partners.length){toast('Add a partner first');partnerForm();return}
  var q=[];(parseItems(o.items||'').items||[]).forEach(function(i){q.push({code:i.code,qty:i.qty})});if(!q.length)q.push({code:'',qty:1});
  var list=prods.filter(function(x){return !x.gone&&!isDraft(x)});
  function draw(){
    var pid=$('#po-partner')?$('#po-partner').value:(o.partner||pdata.partners[0].id),p=partnerOf(pid);
    $('#po-lines').innerHTML=q.map(function(l,i){
      return '<div class="line"><div class="fld" style="margin:0"><select data-li="'+i+'" data-k="code"><option value="">Pick an item</option>'+list.map(function(x){return '<option value="'+esc(x.code)+'"'+(x.code===l.code?' selected':'')+'>'+esc(x.name)+', '+money(priceFor(p,x.code))+'</option>'}).join('')+'</select></div>'
       +'<div class="fld" style="margin:0"><input data-li="'+i+'" data-k="qty" inputmode="numeric" value="'+l.qty+'" aria-label="Quantity"></div>'
       +(q.length>1?'<button type="button" class="link" data-rm="'+i+'">Remove</button>':'<span></span>')+'</div>';
    }).join('');
    var tot=q.reduce(function(s,l){return s+(l.code?priceFor(p,l.code)*(+l.qty||0):0)},0);
    $('#po-tot').textContent='Total '+money(tot);
  }
  openPSheet('<h2>'+(o.id?'Edit '+esc(o.invoice):'New partner order')+'</h2><form id="po" autocomplete="off">'
   +'<div class="two"><div class="fld"><label for="po-partner">Partner</label><select id="po-partner">'+pdata.partners.map(function(p){return '<option value="'+p.id+'"'+(p.id===o.partner?' selected':'')+'>'+esc(p.name)+'</option>'}).join('')+'</select></div>'
   +'<div class="fld"><label for="po-date">Date</label><input id="po-date" type="date" value="'+(o.date||key(new Date()))+'"></div></div>'
   +'<p class="plh">Items</p><div id="po-lines"></div><button type="button" class="link" id="po-add">+ Add another item</button>'
   +'<p class="ptot" id="po-tot"></p>'
   +'<div class="fld"><label for="po-note">Note on the invoice</label><input id="po-note" value="'+esc(o.note||'')+'" placeholder="PO number, delivery details"></div>'
   +'<div class="acts"><button class="btn" type="submit">'+(o.id?'Save changes':'Save and make invoice')+'</button><button type="button" class="link" data-act="close">Cancel</button>'
   +(o.id?'<button type="button" class="link danger" id="po-del">Delete this invoice</button>':'')+'</div></form>');
  draw();
  $('#po-partner').addEventListener('change',draw);
  $('#po-lines').addEventListener('input',function(ev){var t=ev.target;if(t.dataset.li==null)return;q[+t.dataset.li][t.dataset.k]=t.dataset.k==='qty'?t.value.replace(/\D/g,''):t.value;if(t.tagName==='SELECT')draw();else{var p=partnerOf($('#po-partner').value);$('#po-tot').textContent='Total '+money(q.reduce(function(s,l){return s+(l.code?priceFor(p,l.code)*(+l.qty||0):0)},0))}});
  $('#po-lines').addEventListener('change',function(ev){if(ev.target.tagName==='SELECT'){q[+ev.target.dataset.li].code=ev.target.value;draw()}});
  $('#po-lines').addEventListener('click',function(ev){var b=ev.target.closest('[data-rm]');if(b){q.splice(+b.dataset.rm,1);draw()}});
  $('#po-add').addEventListener('click',function(){q.push({code:'',qty:1});draw()});
  var del=$('#po-del');if(del)del.addEventListener('click',function(){if(!del.dataset.arm){del.dataset.arm=1;del.textContent='Tap again to delete';return}api({action:'deletePartnerOrder',id:o.id}).then(function(){state.sheet=null;renderSheet();toast('Deleted '+o.invoice);ploaded=false;loadPartners()}).catch(writeFail)});
  $('#po').addEventListener('submit',function(ev){
    ev.preventDefault();
    var items=q.filter(function(l){return l.code&&+l.qty>0}).map(function(l){return (+l.qty)+'x'+l.code}).join(', ');
    if(!items){toast('Add at least one item');return}
    var b=ev.target.querySelector('[type=submit]');b.disabled=true;
    api({action:'savePartnerOrder',order:{id:o.id||'',partner:$('#po-partner').value,date:$('#po-date').value,items:items,note:$('#po-note').value}})
      .then(function(j){state.sheet=null;renderSheet();toast((o.id?'Saved ':'Made invoice ')+(j.invoice||''));ploaded=false;loadPartners()})
      .catch(function(e){b.disabled=false;toast(String(e.message||e))});
  });
}
function viewInvoice(id){
  var w=window.open('','_blank');
  if(w)w.document.write('<p style="font-family:sans-serif;padding:40px">Loading invoice</p>');
  pget('invoice&id='+encodeURIComponent(id)).then(function(j){
    if(w){w.document.open();w.document.write(j.html);w.document.close()}
    else toast('Allow pop-ups for this page to open invoices');
  }).catch(function(e){if(w)w.close();toast(String(e.message||e))});
}
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-act^="p"]');if(!b)return;
  var a=b.dataset.act,id=b.dataset.id;
  if(!/^(pneworder|pnewpartner|ppartner|pedit|pinv|pmail|ppaid)$/.test(a))return;
  ev.stopPropagation();
  var o=id&&pdata.porders.find(function(x){return x.id===id});
  if(a!=='pmail'&&parmed){parmed=''}
  if(a==='pneworder')porderForm();
  else if(a==='pnewpartner')partnerForm();
  else if(a==='ppartner')partnerForm(partnerOf(id));
  else if(a==='pedit'&&o)porderForm(o);
  else if(a==='pinv')viewInvoice(id);
  else if(a==='ppaid'&&o){o.paid=o.paid?'':key(new Date());renderBoard();api({action:'partnerPaid',id:id,paid:!!o.paid}).then(function(){toast(o.invoice+(o.paid?' marked paid':' marked unpaid'))}).catch(function(){o.paid=o.paid?'':'x';renderBoard();writeFail()})}
  else if(a==='pmail'&&o){
    var p=partnerOf(o.partner);
    if(!p||!p.email){toast('Add an email for this partner first');partnerForm(p);return}
    if(parmed!==id){parmed=id;renderBoard();return}
    parmed='';b.textContent='Sending';b.disabled=true;
    api({action:'emailInvoice',id:id}).then(function(j){toast('Sent '+o.invoice+' to '+j.to+(j.from?' from '+j.from:''));ploaded=false;loadPartners()}).catch(function(e){toast(String(e.message||e));renderBoard()});
  }
},true);
var _renderSheet3=renderSheet;
renderSheet=function(){if(state.sheet&&state.sheet.type==='partner')return;return _renderSheet3.apply(this,arguments)};
