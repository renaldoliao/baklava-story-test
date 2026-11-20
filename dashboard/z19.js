/* v2.3 (Studio 1801 test copy, Nov 21 2026). Loaded after z18.js, before j5.js.
   1. Card settings (owner only): change the Layer Card from the dashboard. Name, how many layers make a card,
      which reward sits on which layer, whether the "ready" text mentions the layer, or switch the program off.
      Saved in the backend, used by every card, the texts and the order page at once.
   2. Special treat: give one customer a one-off gift (birthday, sorry for the wait). Kept on their card,
      does not change their layers.
   3. History on each card: the latest layers, rewards and treats, newest first. */

(function(){
  var st=document.createElement('style');
  st.textContent=''
   +'.lc .h2row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap}'
   +'.lc .h2row .btn{min-height:44px;background:#fff;color:#000;border:1px solid #000}'
   +'.lc .off{margin:0 0 16px;padding:10px 12px;background:#000;color:#fff;font-weight:600}'
   +'.lc .more{display:flex;gap:18px;flex-wrap:wrap;margin-top:6px}.lc .more .link{font-size:15px;min-height:40px;padding:8px 0}'
   +'.lc .treat{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;margin-top:8px;align-items:center}'
   +'.lc .treat input{min-height:44px}'
   +'.lc .hist{margin-top:8px;font-size:14px;color:var(--ink2);border-left:2px solid var(--rule2);padding-left:10px}'
   +'.lc .hist div{padding:3px 0}.lc .hist b{color:var(--ink);font-weight:600}'
   +'.cs h2{margin:0 0 6px}.cs .muted{margin:0 0 16px}'
   +'.cs .fld{margin:0 0 14px}.cs label{display:block;font-size:14px;font-weight:600;color:var(--ink2);margin-bottom:4px}'
   +'.cs input[type=text],.cs select{width:100%;min-height:48px;font-size:17px;padding:8px 10px;border:1px solid var(--ink);background:#fff;border-radius:0}'
   +'.cs .step{display:grid;grid-template-columns:110px minmax(0,1fr) 44px;gap:8px;margin:0 0 8px;align-items:center}'
   +'.cs .step button{min-height:48px;border:1px solid var(--ink);background:#fff;font-size:20px;border-radius:0}'
   +'.cs .chk{display:flex;gap:10px;align-items:flex-start;margin:10px 0;font-size:15px}.cs .chk input{width:22px;height:22px;margin-top:1px}'
   +'.cs .prev{margin:16px 0;padding:12px 14px;background:#111;color:#fff;font-size:15px;line-height:1.45}.cs .prev b{color:#FFC300}'
   +'.cs .acts{display:flex;gap:12px;align-items:center;margin-top:18px}';
  document.head.appendChild(st);
})();

/* keep the program switches from the backend */
var _lcSet19=lcSet;
lcSet=function(j){_lcSet19(j);lc.inTexts=j.inTexts!==false;lc.on=j.on!==false};

/* ---------- 1. Card settings ---------- */
var cs=null;
function csRead(){
  if(!cs)return;var L=$('#layer');if(!L.querySelector('.cs'))return;
  cs.name=$('#cs-name').value;cs.size=+$('#cs-size').value||cs.size;
  cs.steps=Array.prototype.map.call(L.querySelectorAll('.cs .step'),function(r){return {at:+r.querySelector('select').value,text:r.querySelector('input').value}});
  cs.inTexts=$('#cs-texts').checked;cs.on=$('#cs-on').checked;
}
function csHtml(){
  var opts=function(sel,max){var h='';for(var i=1;i<=max;i++)h+='<option value="'+i+'"'+(i===sel?' selected':'')+'>Layer '+i+'</option>';return h};
  var sizes='';for(var n=3;n<=20;n++)sizes+='<option'+(n===cs.size?' selected':'')+'>'+n+'</option>';
  var good=cs.steps.filter(function(s){return String(s.text).trim()}).slice().sort(function(a,b){return a.at-b.at});
  return '<h2>Card settings</h2><p class="muted">What every customer earns. Changes apply to every card, the texts and the order page as soon as you save.</p>'
   +'<div class="fld"><label for="cs-name">Name of the program</label><input type="text" id="cs-name" maxlength="40" value="'+esc(cs.name)+'"></div>'
   +'<div class="fld"><label for="cs-size">Visits to fill a card</label><select id="cs-size" data-act="cssize">'+sizes+'</select></div>'
   +'<label>Rewards</label>'
   +cs.steps.map(function(s,i){return '<div class="step"><select aria-label="Layer for reward '+(i+1)+'">'+opts(s.at,cs.size)+'</select>'
     +'<input type="text" maxlength="60" placeholder="For example: A Turkish coffee on us" value="'+esc(s.text)+'" aria-label="Reward '+(i+1)+'">'
     +'<button type="button" data-act="csdel" data-i="'+i+'" aria-label="Remove reward '+(i+1)+'">&times;</button></div>'}).join('')
   +(cs.steps.length<5?'<button type="button" class="link" data-act="csadd">+ Add a reward</button>':'')
   +'<label class="chk"><input type="checkbox" id="cs-texts"'+(cs.inTexts?' checked':'')+'><span>Tell customers their layer in the "ready for pickup" text</span></label>'
   +'<label class="chk"><input type="checkbox" id="cs-on"'+(cs.on?' checked':'')+'><span>Program is on. Untick to pause it: cards keep their layers, the order page panel and the text line are hidden.</span></label>'
   +'<div class="prev">Customers will see: <b>'+esc(cs.name||'The Layer Card')+'</b>. Every visit adds a layer. '
   +(good.length?good.map(function(s){return 'Layer '+s.at+': '+esc(s.text)}).join('. ')+'.':'No rewards yet.')+' A full card is '+cs.size+' layers, then it starts again.</div>'
   +'<div class="acts"><button type="button" class="btn" data-act="cssave">Save settings</button><button type="button" class="link" data-act="close">Cancel</button></div>';
}
function openCardSettings(){
  cs={name:lc.name,size:lc.size,steps:(lc.steps||[]).map(function(s){return {at:s.at,text:s.text}}),inTexts:lc.inTexts!==false,on:lc.on!==false};
  if(!cs.steps.length)cs.steps=[{at:Math.min(5,cs.size),text:''}];
  state.sheet={type:'card'};csPaint();
}
function csPaint(){
  $('#layer').innerHTML='<div class="scrim" data-act="close"></div><aside class="sheet cs" role="dialog" aria-label="Card settings"><button class="x" data-act="close">Close</button>'+csHtml()+'</aside>';
}
var _renderSheet19=renderSheet;
renderSheet=function(){if(state.sheet&&state.sheet.type==='card')return;return _renderSheet19.apply(this,arguments)};

/* ---------- 2 and 3. Treat and history on each card ---------- */
lc.treat='';lc.hist={};
function lcHistHtml(c){
  var lab={stamp:'Layer added by hand',counter:'Counter sale, layer added',unstamp:'Layer taken back',redeem:'Reward given',treat:'Special treat'};
  var rows=(c.log||[]).map(function(l){
    var what=l.kind==='redeem'?'Reward given: '+esc(String(l.note).replace(/^layer\s*/i,'layer '))
      :l.kind==='treat'?'Special treat: <b>'+esc(l.note)+'</b>':(lab[l.kind]||esc(l.kind));
    return '<div><span class="num">'+esc(String(l.when).slice(5,16).replace('-','/'))+'</span> '+what+'</div>';
  });
  if(c.orders)rows.push('<div>'+c.orders+' picked-up '+(c.orders===1?'order':'orders')+' counted from the Week board</div>');
  return '<div class="hist">'+(rows.length?rows.join(''):'<div>Nothing yet.</div>')+'</div>';
}
var _lcCardHtml19=lcCardHtml;
lcCardHtml=function(c){
  var h=_lcCardHtml19(c),k=esc(c.key),extra='<div class="more"><button class="link" data-act="lctreat" data-k="'+k+'">Special treat</button>'
   +'<button class="link" data-act="lchist" data-k="'+k+'">'+(lc.hist[c.key]?'Hide history':'History')+'</button></div>';
  if(lc.treat===c.key)extra+='<div class="treat"><input type="text" id="lc-treat" maxlength="80" placeholder="For example: Birthday, a piece of baklava on us" aria-label="Special treat for '+esc(c.name||'')+'">'
   +'<button class="btn" data-act="lctreatgo" data-k="'+k+'">Give</button><button class="link" data-act="lctreatx">Cancel</button></div>';
  if(lc.hist[c.key])extra+=lcHistHtml(c);
  var i=h.indexOf('<div class="acts">');
  return i>0?h.slice(0,i).replace(/<\/div>$/,'')+extra+'</div>'+h.slice(i):h+extra;
};
var _layersHtml19=layersHtml;
layersHtml=function(){
  var h=_layersHtml19();
  var btn=isStaff()?'':'<button class="btn" data-act="cardset">Card settings</button>';
  h=h.replace(/<h2>([\s\S]*?)<\/h2>/,'<div class="h2row"><h2>$1</h2>'+btn+'</div>');
  if(lc.loaded&&lc.on===false)h=h.replace('<p class="sub">','<p class="off">The program is paused. Cards keep their layers. Customers do not see it until you switch it back on in Card settings.</p><p class="sub">');
  return h;
};

/* ---------- clicks ---------- */
document.addEventListener('change',function(ev){
  if(ev.target.id==='cs-size'&&cs){csRead();cs.steps.forEach(function(s){if(s.at>cs.size)s.at=cs.size});csPaint()}
  else if(cs&&ev.target.closest&&ev.target.closest('.cs')){csRead();var p=$('#layer .prev');if(p){var tmp=document.createElement('div');tmp.innerHTML=csHtml();p.innerHTML=tmp.querySelector('.prev').innerHTML}}
});
document.addEventListener('input',function(ev){
  if(cs&&ev.target.closest&&ev.target.closest('.cs')&&ev.target.type==='text'){csRead();var p=$('#layer .prev');if(p){var tmp=document.createElement('div');tmp.innerHTML=csHtml();p.innerHTML=tmp.querySelector('.prev').innerHTML}}
});
document.addEventListener('click',function(ev){
  var t=ev.target.closest&&ev.target.closest('[data-act]');if(!t)return;var a=t.dataset.act;
  if(!/^(cardset|csadd|csdel|cssave|lctreat|lctreatx|lctreatgo|lchist)$/.test(a))return;
  ev.stopPropagation();
  if(a==='cardset'){openCardSettings();return}
  if(a==='csadd'){csRead();var used={};cs.steps.forEach(function(s){used[s.at]=1});var at=cs.size;while(used[at]&&at>1)at--;cs.steps.push({at:at,text:''});csPaint();var ins=$('#layer').querySelectorAll('.cs .step input');if(ins.length)ins[ins.length-1].focus();return}
  if(a==='csdel'){csRead();cs.steps.splice(+t.dataset.i,1);csPaint();return}
  if(a==='cssave'){
    csRead();
    var steps=cs.steps.filter(function(s){return String(s.text).trim()});
    if(!steps.length){toast('Add at least one reward.');return}
    t.disabled=true;t.textContent='Saving';
    api({action:'cardSettings',name:cs.name,size:cs.size,steps:steps,inTexts:cs.inTexts,on:cs.on}).then(function(j){
      lcSet(j);state.sheet=null;cs=null;$('#layer').innerHTML='';renderBoard();
      toast('Saved. Every card, the texts and the order page now use these rewards.');
    }).catch(function(e){toast(String(e.message||e));t.disabled=false;t.textContent='Save settings'});
    return;
  }
  if(a==='lchist'){lc.hist[t.dataset.k]=!lc.hist[t.dataset.k];renderBoard();return}
  if(a==='lctreat'){lc.treat=lc.treat===t.dataset.k?'':t.dataset.k;renderBoard();var i=$('#lc-treat');if(i)i.focus();return}
  if(a==='lctreatx'){lc.treat='';renderBoard();return}
  if(a==='lctreatgo'){
    var c=lc.byKey[t.dataset.k],v=($('#lc-treat')||{}).value||'';
    if(!c)return;if(v.trim().length<2){toast('Write what you are giving them.');return}
    t.disabled=true;
    api({action:'treat',phone:c.phone,name:c.name,text:v.trim()}).then(function(j){
      if(j.cards)lcSet(j);lc.treat='';lc.hist[c.key]=true;renderBoard();toast('Treat given to '+(c.name||fmtPhone(c.phone))+': '+v.trim());
    }).catch(function(e){toast(String(e.message||e));t.disabled=false});
  }
});
