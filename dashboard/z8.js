/* No frozen screens. Every call to the Sheet gives up after a fixed time instead of waiting forever,
   so one stuck request (laptop asleep, wifi switching, Google stalling) can never stop the board from refreshing.
   Products and day notes are re-read at most once a minute; the orders on every refresh. */
(function(){
  var f=window.fetch;
  window.fetch=function(u,o){
    if(String(u).indexOf(API_URL)!==0)return f.apply(this,arguments);
    var post=o&&String(o.method||'').toUpperCase()==='POST';
    var c=new AbortController(),t=setTimeout(function(){c.abort()},post?30000:15000);
    var p=f.call(this,u,Object.assign({},o||{},{signal:c.signal}));
    p.then(function(r){r.clone().text().then(function(){clearTimeout(t)},function(){clearTimeout(t)})},function(){clearTimeout(t)});
    return p;
  };
})();
function memo(fn,ms){var at=0,p=null;return function(force){if(!force&&p&&Date.now()-at<ms)return p;at=Date.now();p=fn();return p}}
var _lp8=loadProducts,_ln8=loadNotes;
loadProducts=memo(_lp8,60000);
loadNotes=memo(_ln8,30000);
/* Refresh: the order list, products and notes are asked for at the same time (not one after another),
   and the copy of the board kept on this device is updated on every change, so opening or reloading
   the dashboard shows the latest board instantly instead of an old snapshot. */
function saveCopy(){if(!live||!configured)return;try{lastRows=orders.map(toRow);writeCache()}catch(e){}}
function load8(){
  var started=Date.now();
  Promise.all([loadProducts(),loadNotes()]).then(function(){if(loaded&&!state.sheet)renderBoard()});
  return fetch(API_URL+'?action=list&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);
    var first=!loaded,known={},mine={};orders.forEach(function(o){known[o.id]=1;mine[o.id]=o});
    if(Array.isArray(j.closed)&&!closeBusy){shutDays={};j.closed.forEach(function(d){shutDays[d]=1})}
    var fresh=j.rows.filter(function(r){return r.id&&String(r.status).toLowerCase()!=='cancelled'}).map(fromRow);
    Object.keys(pendingW).forEach(function(id){
      var w=pendingW[id];
      if(w.n===0&&w.done&&started>w.done){delete pendingW[id];return}
      var i=fresh.findIndex(function(o){return o.id===id});
      if(w.gone){if(i>=0)fresh.splice(i,1);return}
      if(mine[id]){if(i>=0)fresh[i]=mine[id];else fresh.push(mine[id])}
    });
    orders=fresh;loaded=true;live=true;why='';state.go=false;
    var nw=orders.filter(function(o){return o.status==='pending'&&!known[o.id]});
    if(!first&&nw.length){toast(nw.length>1?nw.length+' new online orders to confirm':'New online order from '+nw[0].name+', confirm it');chime()}
    renderBoard();
  }).catch(function(e){why=(e&&e.message)||'could not reach it';if(!loaded)fallback();else{live=false;renderBoard()}});
}
var _rb8=renderBoard;
renderBoard=function(){var r=_rb8.apply(this,arguments);saveCopy();return r};
/* a refresh that is somehow still running after 20 seconds no longer blocks the next one */
var busySince=0;
load=function(){
  if(loadBusy&&Date.now()-busySince<20000)return Promise.resolve();
  loadBusy=true;busySince=Date.now();
  var mine=busySince;
  return load8().then(function(){if(busySince===mine)loadBusy=false},function(){if(busySince===mine)loadBusy=false});
};
/* Partners: fetched in the background after sign in, so the tab opens with the list already there.
   If it fails, it says so and tries again a few seconds later instead of spinning. */
var pfail=false;
loadPartners=function(){
  if(ploading)return;ploading=true;
  pget('partners').then(function(j){pdata={partners:j.partners||[],porders:j.porders||[]};ploaded=true;pfail=false})
    .catch(function(){pfail=true;setTimeout(function(){if(!ploaded&&state.tab==='partners')loadPartners()},4000)})
    .then(function(){ploading=false;if(state.tab==='partners')renderBoard()});
};
var _ph8=partnersHtml;
partnersHtml=function(){
  var h=_ph8.apply(this,arguments);
  return (!ploaded&&pfail)?h.replace('Loading partners','Could not reach the Sheet. Trying again...'):h;
};
setTimeout(function(){if(signedIn()&&!isStaff()&&!ploaded)loadPartners()},2500);
