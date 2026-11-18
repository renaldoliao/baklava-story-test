/* Session: wherever the page used to send the old shared token, it now sends this device's session code. */
function sessionCode(){try{return localStorage.getItem('bs-session')||''}catch(e){return ''}}
TOKEN=sessionCode();
signedIn=function(){return !!sessionCode()};
var _keepIn=keepIn;
keepIn=function(s){_keepIn(s);if(s)TOKEN=s};

/* If the script says the session is no longer good (expired, signed out elsewhere, login removed), go back to the sign in screen. */
var _fetch=window.fetch.bind(window),bouncing=false;
function bounce(){
  if(bouncing)return;bouncing=true;
  try{sessionStorage.setItem('bs-ended','1');localStorage.removeItem('bs-in');localStorage.removeItem('bs-session');localStorage.removeItem(CK)}catch(e){}
  location.reload();
}
window.fetch=function(u,o){
  var p=_fetch(u,o);
  if(typeof u==='string'&&u.indexOf(API_URL)===0)p.then(function(r){return r.clone().json()}).then(function(j){if(j&&j.error==='please sign in')bounce()}).catch(function(){});
  return p;
};
var _showLock=showLock;
showLock=function(){
  _showLock();
  try{if(sessionStorage.getItem('bs-ended')){sessionStorage.removeItem('bs-ended');var e=document.getElementById('lockerr');e.textContent='You were signed out. Sign in again.';e.hidden=false}}catch(x){}
};

/* Sign out: ends this device's session on the server, clears what is kept here, and returns to the sign in screen. */
(function(){
  if(!LOGIN_ON)return;
  var box=document.querySelector('.toplinks');if(!box)return;
  box.insertAdjacentHTML('beforeend','<button class="nb" id="signout" type="button">Sign out</button>');
  document.getElementById('signout').addEventListener('click',function(){
    var s=sessionCode();
    function done(){try{localStorage.removeItem('bs-in');localStorage.removeItem('bs-session');localStorage.removeItem(CK)}catch(e){}location.reload()}
    if(!s){done();return}
    var t=setTimeout(done,1500);
    callAuth({action:'logout',session:s}).catch(function(){}).then(function(){clearTimeout(t);done()});
  });
})();
