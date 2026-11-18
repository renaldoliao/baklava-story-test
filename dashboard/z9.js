/* Partner orders are real orders. Saving one puts it on the Week board and in that day's bake list,
   tagged "partner", at its pickup or delivery time. Ready, picked up, paid and cancel work from the board
   like any order and stay in step with the invoice. Editing one opens the partner order form. */
var _fromRow9=fromRow;
fromRow=function(r){var o=_fromRow9(r);if(String(r.source||'')==='partner')o.source='partner';return o};
var _toRow9=toRow;
toRow=function(o){var r=_toRow9(o);if(o.source==='partner')r.source='partner';return r};
function isPartner(o){return o&&o.source==='partner'}
var _srcTag9=srcTag;
srcTag=function(o){var h=_srcTag9(o);return isPartner(o)?h.replace('<span class="src hand">by hand</span>','<span class="src partner">partner</span>'):h};
var _total9=total;
total=function(o){
  if(isPartner(o)){var po=pdata.porders.find(function(x){return 'po'+x.id===o.id});if(po)return +po.total||0}
  return _total9(o);
};
(function(){var s=document.createElement('style');s.textContent='.src.partner{color:var(--ink);font-weight:700}';document.head.appendChild(s)})();

/* pickup or delivery time on the partner order form */
var _porderForm9=porderForm;
porderForm=function(o){
  _porderForm9(o);
  var d=$('#po-date');if(!d||$('#po-time'))return;
  var row=d.closest('.two');
  row.insertAdjacentHTML('afterend','<div class="two"><div class="fld"><label for="po-time">Pickup or delivery time</label><input id="po-time" type="time" step="900" value="'+esc((o&&o.time)||'10:00')+'"></div><div></div></div>');
  var plh=document.querySelector('#po .plh');
  if(plh&&!(o&&o.id))plh.insertAdjacentHTML('beforebegin','<p class="muted" style="margin:0 0 12px">This goes on the Week board and the bake list, and makes the invoice.</p>');
};
function syncPartnerTab(){ploaded=false;loadPartners()}
var _api9=api;
api=function(body){
  body=body||{};
  if(body.action==='savePartnerOrder'&&body.order){var t=$('#po-time');if(t&&t.value)body.order.time=t.value}
  var p=_api9(body);
  if(body.action==='savePartnerOrder')p.then(function(j){
    if(j&&j.row){putLocal(fromRow(j.row));renderBoard();
      setTimeout(function(){toast((body.order.id?'Saved ':'Made invoice ')+(j.invoice||'')+'. It is on the board for '+fromKey(j.row.date).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})+'.')},50)}
    else setTimeout(function(){toast('The spreadsheet script is out of date, so this is not on the board. Paste the latest Code.gs and deploy a new version.')},50);
  },function(){});
  if(body.action==='deletePartnerOrder')p.then(function(){orders=orders.filter(function(o){return o.id!=='po'+body.id});renderBoard()},function(){});
  if(/^po/.test(String(body.id||''))&&(body.action==='patch'||body.action==='status'))p.then(syncPartnerTab,function(){});
  if(body.action==='partnerPaid')p.then(function(){var o=orders.find(function(x){return x.id==='po'+body.id});if(o){o.paid=body.paid===true?'paid':'none';renderBoard()}},function(){});
  return p;
};
/* Editing a partner order from the board or History opens the partner order form */
function openPartnerOrder(id){
  if(isStaff()){toast('Only the owner can change partner orders.');return}
  var po=pdata.porders.find(function(x){return 'po'+x.id===id});
  if(po){porderForm(po);return}
  pget('partners').then(function(j){pdata={partners:j.partners||[],porders:j.porders||[]};ploaded=true;
    var p2=pdata.porders.find(function(x){return 'po'+x.id===id});if(p2)porderForm(p2);else toast('That invoice was deleted.')}).catch(function(){toast('Could not reach the Sheet. Try again in a moment.')});
}
document.addEventListener('click',function(ev){
  var b=ev.target.closest&&ev.target.closest('[data-act="edit"]');if(!b)return;
  var o=orders.find(function(x){return x.id===b.dataset.id});
  if(!isPartner(o))return;
  ev.preventDefault();ev.stopPropagation();openPartnerOrder(o.id);
},true);
