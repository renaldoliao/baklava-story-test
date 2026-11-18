/* Seamless changes on the Week board. Nothing blinks, jumps or fades in from nothing.
   - Orders glide from where they were to where they are now (confirming an online order moves it from the
     top of its day to its time slot, and the orders around it slide to make room).
   - The yellow "to confirm" colour drains out of a card that was just confirmed.
   - The "online orders to confirm" banner stays put while the count changes, and folds away smoothly when
     the last one is confirmed, so the board eases up instead of jumping.
   - When a side sheet is closing, the board waits a beat so the movement is seen, not hidden behind it. */
(function(){
  var st=document.createElement('style');
  st.textContent=
   '.notice.in{animation:none}'
  +'.ent.just{animation:none}'
  +'.ent.just:not(.picked) .body{animation:none}'
  +'#notice{overflow:hidden}';
  document.head.appendChild(st);
})();

var EASE13='cubic-bezier(.2,.8,.2,1)';
function sheetClosing13(){var L=$('#layer');return !!(L&&L.classList.contains('leaving'))}

/* ---- the banner ---- */
var _renderNotice13=renderNotice,noteAnim13=null,folding13=false;
renderNotice=function(){
  var el=$('#notice');
  if(REDUCE||!el||!el.animate){return _renderNotice13.apply(this,arguments)}
  /* already folding away and nothing is waiting to be confirmed: let it finish, do not start it again */
  if(folding13&&noteAnim13&&!orders.some(function(o){return o.status==='pending'}))return;
  if(noteAnim13){try{noteAnim13.cancel()}catch(e){}noteAnim13=null;folding13=false;el.style.height=''}
  var had=!el.hidden&&!!el.firstElementChild,oldHTML=el.innerHTML,oldH=had?el.getBoundingClientRect().height:0;
  var r=_renderNotice13.apply(this,arguments);
  var el2=$('#notice'),has=!el2.hidden&&!!el2.firstElementChild;
  var nt=el2.querySelector('.notice');if(nt)nt.classList.remove('in');
  if(had&&!has){
    /* last one confirmed: keep the banner in place and fold it away */
    el2.hidden=false;el2.innerHTML=oldHTML;
    var a=el2.animate([{height:oldH+'px',opacity:1},{height:'0px',opacity:0}],{duration:300,delay:sheetClosing13()?140:0,easing:'cubic-bezier(.4,0,.2,1)',fill:'both'});
    noteAnim13=a;folding13=true;
    var done=function(){if(noteAnim13!==a)return;noteAnim13=null;folding13=false;try{a.cancel()}catch(e){}el2.hidden=true;el2.innerHTML=''};
    a.onfinish=done;setTimeout(done,700);
  }else if(!had&&has){
    var h=el2.getBoundingClientRect().height;
    var b=el2.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:320,easing:EASE13});
    noteAnim13=b;b.onfinish=function(){if(noteAnim13===b)noteAnim13=null};
  }
  return r;
};

/* ---- the cards ---- */
function snap13(){
  var m={},v=$('#view');if(!v)return m;
  Array.prototype.forEach.call(v.querySelectorAll('.ent'),function(e){
    var b=e.querySelector('[data-id]');if(!b)return;
    var r=e.getBoundingClientRect();m[b.dataset.id]={x:r.left,y:r.top};
  });
  return m;
}
var _renderBoard13=renderBoard;
renderBoard=function(){
  if(REDUCE||state.tab!=='week'||!$('#view').animate)return _renderBoard13.apply(this,arguments);
  var wk=+state.week,before=snap13(),had=Object.keys(before).length>0;
  var r=_renderBoard13.apply(this,arguments);
  if(!had||wk!==+state.week||state.tab!=='week')return r;
  var delay=sheetClosing13()?150:0,moved=0;
  Array.prototype.forEach.call($('#view').querySelectorAll('.ent'),function(e){
    var b=e.querySelector('[data-id]');if(!b)return;
    var id=b.dataset.id,old=before[id],nr=e.getBoundingClientRect();
    if(old){
      var dx=old.x-nr.left,dy=old.y-nr.top;
      if(Math.abs(dx)>1||Math.abs(dy)>1){
        moved++;
        e.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:Math.min(520,300+Math.abs(dy)*0.35),delay:delay,easing:EASE13,fill:'backwards'});
      }
      if(id===state.justId&&!e.classList.contains('picked')&&!e.classList.contains('pending')){
        /* just confirmed: the yellow drains out */
        e.animate([{backgroundColor:'#fff4a8'},{backgroundColor:'rgba(255,244,168,0)'}],{duration:900,delay:delay+80,easing:'ease-out',fill:'backwards'});
      }
    }else{
      e.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:340,delay:delay+60,easing:EASE13,fill:'backwards'});
    }
  });
  return r;
};
