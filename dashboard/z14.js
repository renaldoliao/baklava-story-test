/* Owner setup and Team.
   The demo login is the way in until the owner makes the system their own: they pick a username and password,
   the demo login is deleted by the script, and a staff sign-up code is made. After that the owner can see and
   change the code, and remove people or reset their passwords, from the Team button. The script decides every
   one of these; this file only draws the screens. */
(function(){
  var st=document.createElement('style');
  st.textContent=[
    'body.staff .nb.tb-team,body.demo .nb.tb-team{display:none!important}',
    '#claimbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;border:2px solid var(--ink);background:var(--paper);padding:12px 16px;margin:0 0 14px;animation:rise .35s cubic-bezier(.2,.8,.2,1)}',
    '#claimbar p{margin:0;font-size:16px;font-weight:500}#claimbar p b{font-weight:700}',
    '#claimbar .btn{min-height:44px}',
    '.tmsub{margin:-6px 0 18px;color:var(--ink2)}',
    '.sheet h3.tmh{font:700 18px/1.2 var(--f-head);margin:22px 0 8px}',
    '.jc{border:2px solid var(--ink);padding:16px 16px 12px;margin:0 0 6px}',
    '.jc .muted{font-size:14px;margin:0 0 10px}',
    '.jcode{display:inline-block;font-family:var(--f-hand);font-size:34px;line-height:1.15;font-weight:700;letter-spacing:.06em;background:#fde047;padding:2px 12px 0;user-select:all;-webkit-user-select:all}',
    '.jcrow{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:2px 0 10px}',
    '.jcoff{font-weight:600;margin:0 0 6px}',
    '.tmrow{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 0;border-top:1px solid var(--rule2)}',
    '.tmrow b{font:700 19px/1.1 var(--f-head)}.tmrow small{display:block;color:var(--ink2);font-size:14px;margin-top:3px}',
    '.tmrow .you{font:500 14px var(--f-ui);color:var(--ink2);margin-left:8px}',
    '.tmrow .tma{display:flex;gap:18px;align-items:center}',
    '.tmrow .tma button{min-height:44px;display:inline-flex;align-items:center;font-weight:600}',
    '.tmrow form{flex:1 1 100%;display:flex;gap:14px;align-items:flex-end;flex-wrap:wrap;margin-top:2px;animation:rise .25s cubic-bezier(.2,.8,.2,1)}',
    '.tmrow form .fld{flex:1 1 220px;margin:0}',
    '.tmrev{animation:rise .38s cubic-bezier(.2,.8,.2,1)}',
    '.tmrev .jcode{font-size:44px;margin:6px 0 14px}',
    '@media(prefers-reduced-motion:reduce){#claimbar,.tmrow form,.tmrev{animation:none}}',
    '@media(max-width:700px){#claimbar .btn{width:100%;text-align:center}}'
  ].join('\n');
  document.head.appendChild(st);
})();

var IS_DEMO=false,claimShown=false;
function setDemo(on){
  if(on===IS_DEMO&&(!on||document.getElementById('claimbar')))return;
  IS_DEMO=on;document.body.classList.toggle('demo',on);
  var bar=document.getElementById('claimbar');
  if(!on){if(bar)bar.remove();return}
  if(!bar){
    bar=document.createElement('div');bar.id='claimbar';
    bar.innerHTML='<p><b>You are in the demo.</b> Set your own username and password to make this yours.</p><button class="btn" type="button" data-act="claim">Make it mine</button>';
    var n=document.getElementById('notice');n.parentNode.insertBefore(bar,n);
  }
  if(!claimShown){claimShown=true;setTimeout(function(){if(IS_DEMO&&!state.sheet)openClaim()},900)}
}
(function(){
  var f=window.fetch;
  window.fetch=function(u){
    var p=f.apply(this,arguments);
    if(String(u).indexOf(API_URL)!==0)return p;
    return p.then(function(res){
      res.clone().json().then(function(j){if(j&&typeof j.demo==='boolean')setDemo(j.demo)}).catch(function(){});
      return res;
    });
  };
})();

/* Team button, owners only (hidden for staff and in the demo by the style above) */
(function(){
  var box=document.querySelector('.toplinks');if(!box)return;
  box.insertAdjacentHTML('afterbegin','<button class="nb tb-team" type="button" data-act="team">Team</button>');
})();

function openMid(html,label){
  $('#layer').innerHTML='<div class="scrim" data-act="close"></div><aside class="sheet mid" role="dialog" aria-label="'+label+'"><button class="x" data-act="close">Close</button><div id="midbody">'+html+'</div></aside>';
  state.sheet={type:'partner'};
}
function swapMid(html){var b=document.getElementById('midbody');if(b)b.innerHTML=html}
function copyText(t){
  function done(){toast('Copied')}
  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,function(){toast('Press and hold the code to copy it')});return}}catch(e){}
  toast('Press and hold the code to copy it');
}

/* Step 1: the owner chooses their own login */
function openClaim(){
  openMid('<h2>Make this yours</h2><p class="tmsub">You are using the demo login. Pick the username and password you will use from now on. The demo login stops working as soon as you save.</p>'
   +'<form id="claimf" autocomplete="on" novalidate>'
   +'<div class="fld"><label for="cl-user">Your username</label><input id="cl-user" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></div>'
   +pwField('cl-pw','Your password (8 or more characters)','new-password')
   +pwField('cl-pw2','Type the password again','new-password')
   +'<p class="hint warn" id="cl-err" role="alert" hidden></p>'
   +'<div class="acts"><button class="btn" type="submit">Save my login</button><button type="button" class="link" data-act="close">Later</button></div></form>','Make this yours');
  var f=$('#claimf'),err=$('#cl-err');
  setTimeout(function(){var i=$('#cl-user');if(i)i.focus()},60);
  f.addEventListener('click',function(ev){
    var t=ev.target.closest&&ev.target.closest('.pwshow');if(!t||!t.dataset.for)return;
    var i=$('#'+t.dataset.for),on=i.type==='password';i.type=on?'text':'password';t.textContent=on?'Hide':'Show';
  });
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var u=$('#cl-user').value.trim().toLowerCase(),p=$('#cl-pw').value,p2=$('#cl-pw2').value,m='';
    if(!/^[a-z0-9._-]{2,32}$/.test(u))m='Usernames are 2 to 32 letters, numbers, dots, dashes or underscores.';
    else if(p.length<8)m='Passwords need at least 8 characters.';
    else if(p!==p2)m='The two passwords do not match.';
    if(m){err.textContent=m;err.hidden=false;return}
    err.hidden=true;
    var b=f.querySelector('[type=submit]');b.disabled=true;b.textContent='Saving';
    api({action:'claim',username:u,password:p}).then(function(j){
      keepIn(j.session);TOKEN=j.session;setDemo(false);
      claimDone(u,j.joinCode);
    }).catch(function(e){b.disabled=false;b.textContent='Save my login';err.textContent=String(e.message||e);err.hidden=false});
  });
}

/* Step 2: they get the staff code */
function claimDone(user,code){
  swapMid('<div class="tmrev"><h2>You are set, '+esc(user)+'</h2>'
   +'<p class="tmsub" style="margin-top:0">Sign in with your own username and password from now on. The demo login is gone.</p>'
   +'<p class="muted" style="margin:0">Your staff sign-up code</p><b class="jcode" id="rv-code">'+esc(code)+'</b>'
   +'<p class="muted" style="font-size:15px">Staff type this on the sign-in page, under Create a login, to make their own username and password. They see orders only, no prices. You can see it or change it any time under Team.</p>'
   +'<div class="acts"><button class="btn" type="button" data-act="close">Done</button><button class="link" type="button" data-act="tmcopy" data-code="'+esc(code)+'">Copy code</button></div></div>');
  toast('Your login is saved');
}

/* Team sheet */
var team=null;
function openTeam(){
  $('#layer').innerHTML='<div class="scrim" data-act="close"></div><aside class="sheet psheet" role="dialog" aria-label="Team"><button class="x" data-act="close">Close</button><div id="teambody"><h2>Team</h2><p class="muted">Loading</p></div></aside>';
  state.sheet={type:'partner'};
  fetch(API_URL+'?action=team&token='+encodeURIComponent(TOKEN)).then(function(r){return r.json()}).then(function(j){
    if(j.error)throw new Error(j.error);team=j;drawTeam();
  }).catch(function(e){var b=$('#teambody');if(b)b.innerHTML='<h2>Team</h2><p>'+esc(String(e.message||'Could not load the team. Check the connection and try again.'))+'</p>'});
}
function fmtSince(s){
  var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(s||''));if(!m)return '';
  var mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2]-1];
  return mo+' '+(+m[3])+', '+m[1];
}
function drawTeam(){
  var b=$('#teambody');if(!b||!team)return;
  var jc=team.joinOn
   ?'<div class="jcrow"><b class="jcode" id="jc-code">'+esc(team.joinCode)+'</b><button class="link" type="button" data-act="tmcopy" data-code="'+esc(team.joinCode)+'">Copy</button></div>'
    +'<div class="acts"><button class="link" type="button" data-act="tmnew">Make a new code</button><button class="link danger" type="button" data-act="tmoff">Turn off sign-up</button></div>'
    +'<p class="hint">A new code stops the old one working. People who already signed up stay signed up.</p>'
   :'<p class="jcoff">Sign-up is off. Nobody new can create a login.</p><div class="acts"><button class="btn" type="button" data-act="tmnew">Turn on with a new code</button></div>';
  var rows=team.users.map(function(u){
    var who=esc(u.username),role=u.role==='owner'?'Owner, sees everything':'Staff, sees orders only';
    var acts=u.me?'':'<div class="tma"><button class="link" type="button" data-act="tmpw" data-u="'+who+'">Reset password</button><button class="link danger" type="button" data-act="tmrm" data-u="'+who+'">Remove</button></div>';
    return '<div class="tmrow" data-row="'+who+'"><span><b>'+who+'</b>'+(u.me?'<span class="you">You</span>':'')+'<small>'+role+(u.created?', since '+fmtSince(u.created):'')+'</small></span>'+acts+'</div>';
  }).join('');
  b.innerHTML='<h2>Team</h2><p class="tmsub">Who can sign in to this dashboard.</p>'
   +'<div class="jc"><h3 class="tmh" style="margin:0 0 4px">Staff sign-up code</h3><p class="muted">Staff type this on the sign-in page, under Create a login. They see orders only, no prices.</p>'+jc+'</div>'
   +'<h3 class="tmh">People</h3>'+rows;
}
function teamCall(body,okMsg,btn){
  if(btn)btn.disabled=true;
  return api(body).then(function(j){team=j;drawTeam();if(okMsg)toast(okMsg)}).catch(function(e){if(btn)btn.disabled=false;toast(String(e.message||e))});
}
document.addEventListener('click',function(ev){
  var el=ev.target.closest&&ev.target.closest('[data-act]');if(!el)return;
  var a=el.dataset.act;
  if(a==='claim'){openClaim();return}
  if(a==='team'){openTeam();return}
  if(a==='tmcopy'){copyText(el.dataset.code||'');return}
  if(a==='tmnew'){
    if(team&&team.joinOn&&!el.dataset.arm){el.dataset.arm='1';el.textContent='Tap again to stop the old code';return}
    teamCall({action:'setJoin',mode:'new'},'New code ready',el);return;
  }
  if(a==='tmoff'){
    if(!el.dataset.arm){el.dataset.arm='1';el.textContent='Tap again to turn off';return}
    teamCall({action:'setJoin',mode:'off'},'Sign-up is off',el);return;
  }
  if(a==='tmrm'){
    if(!el.dataset.arm){el.dataset.arm='1';el.textContent='Tap again to remove';return}
    teamCall({action:'removeUser',username:el.dataset.u},'Removed '+el.dataset.u,el);return;
  }
  if(a==='tmpw'){
    var row=el.closest('.tmrow'),old=row.querySelector('form');
    if(old){old.remove();return}
    row.insertAdjacentHTML('beforeend','<form autocomplete="off" novalidate><div class="fld"><label>New password for '+esc(el.dataset.u)+' (8 or more characters)</label><input type="text" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="New password"></div><button class="btn" type="submit">Save password</button></form>');
    var f=row.querySelector('form'),inp=f.querySelector('input');inp.focus();
    f.addEventListener('submit',function(e2){
      e2.preventDefault();
      if(inp.value.length<8){toast('Passwords need at least 8 characters.');inp.focus();return}
      teamCall({action:'resetPassword',username:el.dataset.u,password:inp.value},'Password changed for '+el.dataset.u+'. They sign in again with it.',f.querySelector('button'));
    });
  }
});
