// =====================================================================
// Baklava Story v2 — TEST COPY (Studio 1801 testing only)
// Paste this into the Apps Script of the TEST Sheet
// ("Baklava Story – TEST (Studio 1801 testing only)"), never into Tolgay's.
// The guard below stops this script if it is ever run inside the live Sheet.
// =====================================================================
const LIVE_SHEET_ID_ = '1wuRyo7VLoDn1NXjfTCa4eNCcPBDAIJW8ks9E9SdugB0';
function testGuard_() {
  if (SpreadsheetApp.getActive().getId() === LIVE_SHEET_ID_) throw new Error('This is the v2 TEST script. It must not run inside Tolgay\'s live Sheet.');
}

// Baklava Story order board: this Google Sheet is the database.
// Extensions > Apps Script, paste this whole file, Save, then Deploy > Manage deployments >
// pencil icon > Version: New version > Deploy. The web app URL stays the same.
const SHEET = 'Orders';
const COLS = ['id', 'date', 'time', 'name', 'phone', 'items', 'note', 'paid', 'status', 'sample', 'source', 'seen', 'optin', 'ready'];
const SLOT_CAP = 3, DAY_CAP = 400, MAX_DAYS_AHEAD = 45, MIN_LEAD_MIN = 120, MAX_PER_HOUR = 40;
const SHOP_TZ = 'America/Los_Angeles';

// Products live in the Products tab of this sheet and are edited from the dashboard's Products tab.
// These are only the starting rows, used once when the Products tab does not exist yet.
const PROD_SHEET = 'Products';
const PCOLS = ['code', 'name', 'pieces', 'price', 'on', 'gone', 'img', 'short'];
const IMG_SHEET = 'Images';
const DEFAULT_PRODUCTS = [
  ['SP', 'Small tray, Pistachio', 1, 27.5], ['SW', 'Small tray, Walnut', 1, 27.5],
  ['MP', 'Medium tray, Pistachio', 1, 74.5], ['MW', 'Medium tray, Walnut', 1, 74.5],
  ['LP', 'Large tray, Pistachio', 1, 107.5], ['LW', 'Large tray, Walnut', 1, 107.5]
];
let PM_ = null;

const ADDRESS = '1830 Harrison St, Ste B'; // confirmed with the owner Nov 16

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    const first = ss.getSheets()[0];
    if (first.getRange('A1').getValue() === 'id') { first.setName(SHEET); sh = first; }
    else { sh = ss.insertSheet(SHEET); sh.appendRow(COLS); }
  }
  // make sure the header row has every column (adds source and seen to older sheets)
  const head = sh.getRange(1, 1, 1, COLS.length).getValues()[0];
  COLS.forEach(function (c, i) { if (head[i] === '') sh.getRange(1, i + 1).setValue(c); });
  return sh;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function norm_(v, key) {
  const s = String(v);
  if (key === 'date') {
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[0];
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (us) return us[3] + '-' + ('0' + us[1]).slice(-2) + '-' + ('0' + us[2]).slice(-2);
    const t = new Date(s);
    if (!isNaN(t)) return Utilities.formatDate(t, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  if (key === 'time') {
    const m = s.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (m) {
      let h = +m[1];
      const ap = (m[3] || '').toUpperCase();
      if (ap === 'PM' && h < 12) h += 12;
      if (ap === 'AM' && h === 12) h = 0;
      return ('0' + h).slice(-2) + ':' + m[2];
    }
  }
  return s;
}
function read_() {
  const v = sheet_().getDataRange().getDisplayValues();
  const head = v.shift();
  const st = head.indexOf('status');
  // Cancelled orders stay in the Orders tab as a record, but nothing else counts them: board, slots, reports.
  return v.filter(function (r) { return r[0] !== '' && (st < 0 || String(r[st]).toLowerCase() !== 'cancelled'); }).map(function (r) {
    const o = {};
    head.forEach(function (h, i) { o[h] = norm_(r[i], h); });
    return o;
  });
}
function findRow_(sh, id) {
  const ids = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
  for (let i = 1; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 1;
  return -1;
}
// ---- products
function prodSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(PROD_SHEET);
  if (!sh) {
    sh = ss.insertSheet(PROD_SHEET);
    sh.getRange(1, 1, 1, PCOLS.length).setValues([PCOLS]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, DEFAULT_PRODUCTS.length, PCOLS.length).setValues(DEFAULT_PRODUCTS.map(function (d) { return [d[0], d[1], d[2], d[3], 'yes', '', '', '']; }));
    [150, 260, 70, 70, 60, 60, 90, 80].forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  } else {
    for (let c = 0; c < PCOLS.length; c++) {
      if (String(sh.getRange(1, c + 1).getValue()) !== PCOLS[c]) sh.getRange(1, c + 1).setValue(PCOLS[c]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
    }
  }
  return sh;
}
function readProducts_() {
  const sh = prodSheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, PCOLS.length).getValues().filter(function (r) { return String(r[0]) !== ''; }).map(function (r) {
    return { code: String(r[0]), name: String(r[1]), pieces: +r[2] || 0, price: +r[3] || 0, on: String(r[4]) === 'yes', gone: String(r[5]) === 'yes', img: String(r[6] || ''), short: String(r[7] || '') };
  });
}
function prodMap_() {
  if (!PM_) { PM_ = {}; readProducts_().forEach(function (p) { PM_[p.code.toUpperCase()] = p; }); }
  return PM_;
}
// Staff save the whole list. Anything the list leaves out stays exactly as it was.
function cleanProducts_(list) {
  if (!Array.isArray(list) || list.length > 80) return null;
  const seen = {}, seenShort = {}, out = [];
  for (let k = 0; k < list.length; k++) {
    const p = list[k] || {};
    const code = String(p.code || '');
    const name = String(p.name || '').replace(/^[=+\-@\s]+/, '').trim().slice(0, 40);
    const pieces = Math.round(+p.pieces), price = Math.round(+p.price * 100) / 100;
    if (!/^[A-Za-z0-9]{1,8}$/.test(code) || seen[code.toUpperCase()]) return null;
    if (!name || !(pieces >= 1 && pieces <= 1000) || !(price >= 0 && price <= 9999)) return null;
    const short = String(p.short || '').trim();
    if (short && !/^[A-Za-z0-9]{1,8}$/.test(short)) return null;
    if (short && p.gone !== true) { if (seenShort[short.toUpperCase()]) return null; seenShort[short.toUpperCase()] = true; }
    seen[code.toUpperCase()] = true;
    const img = /^[A-Za-z0-9]{1,12}$/.test(String(p.img || '')) ? String(p.img) : '';
    out.push({ code: code, name: name, pieces: pieces, price: price, on: p.on === true, gone: p.gone === true, img: img, short: short });
  }
  readProducts_().forEach(function (p) { if (!seen[p.code.toUpperCase()]) out.push(p); });
  return out;
}
function writeProducts_(list) {
  const sh = prodSheet_();
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, PCOLS.length).clearContent();
  if (!list.length) return;
  const rng = sh.getRange(2, 1, list.length, PCOLS.length);
  rng.setNumberFormat('@');
  rng.setValues(list.map(function (p) { return [p.code, p.name, p.pieces, p.price, p.on ? 'yes' : 'no', p.gone ? 'yes' : '', p.img || '', p.short || '']; }));
  sh.getRange(2, 3, list.length, 2).setNumberFormat('0.##');
}
// ---- product photos: small JPEGs kept as text in a hidden Images tab
function imgSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(IMG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(IMG_SHEET);
    sh.getRange(1, 1, 1, 2).setValues([['id', 'data']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.hideSheet();
  }
  return sh;
}
function saveImage_(data) {
  data = String(data || '');
  if (data.length > 48000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(data)) return null;
  const sh = imgSheet_();
  const id = 'i' + Math.random().toString(36).slice(2, 10);
  const r = sh.getLastRow() + 1;
  const rng = sh.getRange(r, 1, 1, 2);
  rng.setNumberFormat('@');
  rng.setValues([[id, data]]);
  return id;
}
function readImage_(id) {
  id = String(id || '');
  if (!/^[A-Za-z0-9]{1,12}$/.test(id)) return '';
  const sh = imgSheet_();
  const n = sh.getLastRow() - 1;
  if (n < 1) return '';
  const rows = sh.getRange(2, 1, n, 2).getValues();
  for (let k = 0; k < rows.length; k++) if (String(rows[k][0]) === id) return String(rows[k][1]);
  return '';
}
// ---- customer notes: one line per customer in a hidden Notes tab, keyed by phone digits (or the name when there is no phone)
const NOTE_SHEET = 'Notes';
function noteSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(NOTE_SHEET);
  if (!sh) {
    sh = ss.insertSheet(NOTE_SHEET);
    sh.getRange(1, 1, 1, 2).setValues([['key', 'note']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:B').setNumberFormat('@');
    sh.hideSheet();
  }
  return sh;
}
function readNotes_() {
  const sh = noteSheet_(), n = sh.getLastRow() - 1, out = {};
  if (n < 1) return out;
  sh.getRange(2, 1, n, 2).getDisplayValues().forEach(function (r) { if (r[0] && r[1]) out[r[0]] = r[1]; });
  return out;
}
function saveNote_(key, note) {
  key = String(key == null ? '' : key);
  note = String(note == null ? '' : note).slice(0, 500);
  if (!key || key.length > 120) return false;
  const sh = noteSheet_(), n = sh.getLastRow() - 1;
  let r = -1;
  if (n > 0) {
    const keys = sh.getRange(2, 1, n, 1).getDisplayValues();
    for (let k = 0; k < keys.length; k++) if (keys[k][0] === key) { r = k + 2; break; }
  }
  if (!note.trim()) { if (r > 0) sh.deleteRow(r); return true; }
  if (r < 0) r = sh.getLastRow() + 1;
  const rng = sh.getRange(r, 1, 1, 2);
  rng.setNumberFormat('@');
  rng.setValues([[key, note]]);
  return true;
}
// ---- closed days: dates the owner has closed to online orders from the Week tab, kept in a hidden Closed tab
const CLOSED_SHEET = 'Closed';
function closedSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CLOSED_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CLOSED_SHEET);
    sh.getRange(1, 1).setValue('date').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
    sh.hideSheet();
  }
  return sh;
}
function readClosed_() {
  const sh = closedSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const today = shopNow_().date;
  return sh.getRange(2, 1, n, 1).getDisplayValues().map(function (r) { return r[0]; }).filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d) && d >= today; });
}
function setClosed_(date, closed) {
  date = String(date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const sh = closedSheet_(), n = sh.getLastRow() - 1;
  let r = -1;
  if (n > 0) {
    const v = sh.getRange(2, 1, n, 1).getDisplayValues();
    for (let k = 0; k < v.length; k++) if (v[k][0] === date) { r = k + 2; break; }
  }
  if (closed && r < 0) { const c = sh.getRange(sh.getLastRow() + 1, 1); c.setNumberFormat('@'); c.setValue(date); }
  if (!closed && r > 0) sh.deleteRow(r);
  return true;
}
// ---- logins: one row per person in a hidden Users tab. Only a salted hash is kept, never the password itself.
const USER_SHEET = 'Users';
const UCOLS = ['username', 'salt', 'hash', 'active', 'created', 'role'];
// role: owner sees everything. staff sees orders only: no prices, revenue, History or Products. Empty means owner.
const HASH_ROUNDS = 1000, MIN_PASSWORD = 8;
function userSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(USER_SHEET);
  if (!sh) {
    sh = ss.insertSheet(USER_SHEET);
    sh.getRange(1, 1, 1, UCOLS.length).setValues([UCOLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:F').setNumberFormat('@');
    sh.hideSheet();
  }
  if (sh.getRange(1, 6).getValue() === '') sh.getRange(1, 6).setValue('role').setFontWeight('bold');
  return sh;
}
function roleOf_(username) {
  const sh = userSheet_(), r = username && userRow_(sh, username);
  if (!r) return 'staff';
  return String(sh.getRange(r, 6).getDisplayValues()[0][0]).trim().toLowerCase() === 'staff' ? 'staff' : 'owner';
}
function cleanUser_(name) {
  const u = String(name == null ? '' : name).trim().toLowerCase();
  return /^[a-z0-9._-]{2,32}$/.test(u) ? u : '';
}
function hex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function hashPw_(salt, password) {
  let d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + password, Utilities.Charset.UTF_8);
  for (let i = 1; i < HASH_ROUNDS; i++) {
    d = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, d.concat(Utilities.newBlob(salt).getBytes()));
  }
  return hex_(d);
}
function sameText_(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
function userRow_(sh, username) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const names = sh.getRange(2, 1, n, 1).getDisplayValues();
  for (let i = 0; i < n; i++) if (names[i][0] === username) return i + 2;
  return 0;
}
// Used by the sign in step: true only for an active user with the right password.
function checkLogin_(username, password) {
  const u = cleanUser_(username), sh = userSheet_(), r = u && userRow_(sh, u);
  const row = r ? sh.getRange(r, 1, 1, UCOLS.length).getDisplayValues()[0] : ['', 'none', '', 'no', ''];
  const ok = sameText_(hashPw_(row[1], String(password || '')), row[2]);
  return !!(r && ok && row[3] === 'yes');
}
function addUser_(username, password, role) {
  const u = cleanUser_(username);
  if (!u) throw new Error('Usernames are 2 to 32 letters, numbers, dots, dashes or underscores.');
  if (String(password || '').length < MIN_PASSWORD) throw new Error('Passwords need at least ' + MIN_PASSWORD + ' characters.');
  const sh = userSheet_(), salt = Utilities.getUuid() + Utilities.getUuid(), hash = hashPw_(salt, String(password));
  const r = userRow_(sh, u);
  if (r) { sh.getRange(r, 2, 1, 3).setValues([[salt, hash, 'yes']]); if (role) sh.getRange(r, 6).setValue(role); endSessionsFor_(u); return 'reset'; }
  sh.appendRow([u, salt, hash, 'yes', Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd'), role || 'staff']);
  return 'added';
}
function removeUser_(username) {
  const u = cleanUser_(username), sh = userSheet_(), r = u && userRow_(sh, u);
  if (!r) return false;
  sh.deleteRow(r);
  endSessionsFor_(u);
  return true;
}
function listUsers_() {
  const sh = userSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, UCOLS.length).getDisplayValues().map(function (r) { return { username: r[0], active: r[3] === 'yes', created: r[4], role: String(r[5]).toLowerCase() === 'staff' ? 'staff' : 'owner' }; });
}
// Sheet menu: Baklava Story > Logins
function ask_(title, text) {
  const ui = SpreadsheetApp.getUi(), res = ui.prompt(title, text, ui.ButtonSet.OK_CANCEL);
  return res.getSelectedButton() === ui.Button.OK ? res.getResponseText() : null;
}
function menuAddLogin() {
  const ui = SpreadsheetApp.getUi();
  const u = ask_('Add or reset a login', 'Username (letters, numbers, dots, dashes):');
  if (u === null) return;
  const p = ask_('Add or reset a login', 'Password for ' + u.trim().toLowerCase() + ' (at least ' + MIN_PASSWORD + ' characters). It is not saved anywhere, only a scrambled version is:');
  if (p === null) return;
  const k = ask_('Add or reset a login', 'Type owner or staff. Owner sees everything. Staff sees orders only, no prices or revenue:');
  if (k === null) return;
  const role = String(k).trim().toLowerCase();
  if (role !== 'owner' && role !== 'staff') { ui.alert('Not saved', 'Type owner or staff.', ui.ButtonSet.OK); return; }
  try { ui.alert('Done', 'Login ' + addUser_(u, p, role) + ': ' + cleanUser_(u) + ' (' + role + ')', ui.ButtonSet.OK); }
  catch (e) { ui.alert('Not saved', String(e.message || e), ui.ButtonSet.OK); }
}
function menuRemoveLogin() {
  const ui = SpreadsheetApp.getUi(), u = ask_('Remove a login', 'Username to remove:');
  if (u === null) return;
  ui.alert(removeUser_(u) ? 'Removed ' + cleanUser_(u) : 'No login with that username.');
}
function menuListLogins() {
  const ui = SpreadsheetApp.getUi(), list = listUsers_();
  ui.alert('Logins', list.length ? list.map(function (x) { return x.username + ', ' + x.role + (x.active ? '' : ' (off)') + ', since ' + x.created; }).join('\n') : 'No logins yet.', ui.ButtonSet.OK);
}
// Run once from the editor to confirm hashing works. Leaves nothing behind.
function selfTestLogins() {
  const t = 'zz-test-login';
  addUser_(t, 'correct horse 1');
  const good = checkLogin_(t, 'correct horse 1'), bad = checkLogin_(t, 'wrong password'), none = checkLogin_('nobody-here', 'x');
  removeUser_(t);
  const stored = JSON.stringify(listUsers_());
  const pass = good && !bad && !none && stored.indexOf('correct horse') < 0;
  SpreadsheetApp.getUi().alert(pass ? 'Logins check passed' : 'Logins check FAILED', 'right password: ' + good + '\nwrong password: ' + bad + '\nunknown user: ' + none, SpreadsheetApp.getUi().ButtonSet.OK);
}

// ---- sessions and sign in. A device that signs in gets a long random code that lasts 30 days.
// Only a scrambled copy of the code is kept in the hidden Sessions tab.
const SESS_SHEET = 'Sessions';
const SESSION_DAYS = 30, MAX_FAILS = 5, MAX_JOIN_FAILS = 10, FAIL_WINDOW_SEC = 600;
function sessSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SESS_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SESS_SHEET);
    sh.getRange(1, 1, 1, 3).setValues([['hash', 'username', 'expires']]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('A:C').setNumberFormat('@');
    sh.hideSheet();
  }
  return sh;
}
function sessHash_(token) {
  return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'session:' + String(token), Utilities.Charset.UTF_8));
}
function newSession_(username) {
  const sh = sessSheet_(), now = Date.now(), n = sh.getLastRow() - 1;
  if (n > 0) {
    const ex = sh.getRange(2, 3, n, 1).getDisplayValues();
    for (let i = n - 1; i >= 0; i--) if (Number(ex[i][0]) < now) sh.deleteRow(i + 2);
  }
  const token = (Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  sh.appendRow([sessHash_(token), username, String(now + SESSION_DAYS * 86400000)]);
  return token;
}
function checkSession_(token) {
  if (!token) return '';
  const sh = sessSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return '';
  const h = sessHash_(token), rows = sh.getRange(2, 1, n, 3).getDisplayValues();
  for (let i = 0; i < n; i++) {
    if (sameText_(rows[i][0], h)) return Number(rows[i][2]) > Date.now() ? rows[i][1] : '';
  }
  return '';
}
function endSessionsFor_(username) {
  const sh = sessSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return;
  const names = sh.getRange(2, 2, n, 1).getDisplayValues();
  for (let i = n - 1; i >= 0; i--) if (names[i][0] === username) sh.deleteRow(i + 2);
}
function endSession_(token) {
  if (!token) return;
  const sh = sessSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return;
  const h = sessHash_(token), rows = sh.getRange(2, 1, n, 1).getDisplayValues();
  for (let i = 0; i < n; i++) if (sameText_(rows[i][0], h)) { sh.deleteRow(i + 2); return; }
}
function tries_(key) { return Number(CacheService.getScriptCache().get(key) || 0); }
function miss_(key) { CacheService.getScriptCache().put(key, String(tries_(key) + 1), FAIL_WINDOW_SEC); }
function clearTries_(key) { CacheService.getScriptCache().remove(key); }
const SIGN_IN = 'please sign in';
const WAIT_MSG = 'Too many tries. Wait a few minutes and try again.';
function login_(b) {
  const u = cleanUser_(b.username), key = 'fail:' + (u || 'none');
  if (tries_(key) >= MAX_FAILS) return { error: WAIT_MSG };
  if (!u || !checkLogin_(u, b.password)) { miss_(key); return { error: 'That username or password did not work.' }; }
  clearTries_(key);
  return { ok: true, username: u, role: roleOf_(u), demo: isDemo_(u), session: newSession_(u) };
}
// New people can join from the sign in page, but only with the join code the team sets from the Sheet menu.
function signup_(b) {
  const code = String(PropertiesService.getScriptProperties().getProperty('JOIN_CODE') || '');
  if (!code) return { error: 'Joining is turned off. Ask the owner to add you.' };
  if (tries_('fail:join') >= MAX_JOIN_FAILS) return { error: WAIT_MSG };
  if (!sameText_(normCode_(b.code), normCode_(code))) { miss_('fail:join'); return { error: 'That join code is not right.' }; }
  const u = cleanUser_(b.username);
  if (!u) return { error: 'Usernames are 2 to 32 letters, numbers, dots, dashes or underscores.' };
  if (String(b.password || '').length < MIN_PASSWORD) return { error: 'Passwords need at least ' + MIN_PASSWORD + ' characters.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (userRow_(userSheet_(), u)) return { error: 'That username is taken. Pick another.' };
    addUser_(u, b.password, 'staff');
  } finally {
    lock.releaseLock();
  }
  return { ok: true, username: u, role: 'staff', session: newSession_(u) };
}
function menuSetJoinCode() {
  const ui = SpreadsheetApp.getUi(), props = PropertiesService.getScriptProperties();
  const now = props.getProperty('JOIN_CODE') || '';
  const c = ask_('Join code', (now ? 'Current join code: ' + now : 'Joining is off right now.') +
    '\n\nNew people type the join code on the sign in page to make their own staff login.\nType a new code to change it, type off to turn joining off, or press Cancel to keep it as it is.');
  if (c === null || !c.trim()) return;
  if (c.trim().toLowerCase() === 'off') { props.deleteProperty('JOIN_CODE'); ui.alert('Joining is off.'); return; }
  if (c.trim().length < 6) { ui.alert('Not saved', 'Use at least 6 characters.', ui.ButtonSet.OK); return; }
  props.setProperty('JOIN_CODE', c.trim());
  ui.alert('Join code saved: ' + c.trim());
}

// ---- owner setup. The demo login (user "admin") is the way in until the owner claims the system:
// they pick their own username and password, the demo login is deleted, and a random join code is made for staff.
// After that only the owner can see or change the join code and the team.
const DEMO_USER = 'admin';
function normCode_(c) { return String(c == null ? '' : c).replace(/[\s-]/g, '').toLowerCase(); }
function claimed_() { return PropertiesService.getScriptProperties().getProperty('CLAIMED') === '1'; }
function isDemo_(username) { return !claimed_() && String(username) === DEMO_USER; }
function newJoinCode_() {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + Utilities.getUuid(), Utilities.Charset.UTF_8);
  let c = '';
  for (let i = 0; i < 8; i++) c += A.charAt((bytes[i] & 0xff) % A.length);
  return c.slice(0, 4) + '-' + c.slice(4);
}
function claim_(who, b) {
  if (!isDemo_(who)) return { error: 'This was already set up.' };
  const u = cleanUser_(b.username);
  if (!u) return { error: 'Usernames are 2 to 32 letters, numbers, dots, dashes or underscores.' };
  if (u === DEMO_USER) return { error: 'Pick a username of your own.' };
  if (String(b.password || '').length < MIN_PASSWORD) return { error: 'Passwords need at least ' + MIN_PASSWORD + ' characters.' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (claimed_()) return { error: 'This was already set up.' };
    if (userRow_(userSheet_(), u)) return { error: 'That username is taken. Pick another.' };
    addUser_(u, b.password, 'owner');
    removeUser_(DEMO_USER);
    const code = newJoinCode_(), props = PropertiesService.getScriptProperties();
    props.setProperty('JOIN_CODE', code);
    props.setProperty('CLAIMED', '1');
    return { ok: true, username: u, role: 'owner', demo: false, joinCode: code, session: newSession_(u) };
  } finally { lock.releaseLock(); }
}
function teamData_(me) {
  const code = String(PropertiesService.getScriptProperties().getProperty('JOIN_CODE') || '');
  return { me: me, joinCode: code, joinOn: !!code, users: listUsers_().map(function (x) { x.me = x.username === me; return x; }) };
}
function ownerCount_() { return listUsers_().filter(function (x) { return x.role === 'owner' && x.active; }).length; }
function teamAction_(who, b) {
  const props = PropertiesService.getScriptProperties();
  if (b.action === 'setJoin') {
    if (b.mode === 'off') { props.deleteProperty('JOIN_CODE'); return teamData_(who); }
    if (b.mode === 'new') { props.setProperty('JOIN_CODE', newJoinCode_()); return teamData_(who); }
    const c = String(b.code || '').trim();
    if (c.length < 6) return { error: 'Use at least 6 characters.' };
    props.setProperty('JOIN_CODE', c);
    return teamData_(who);
  }
  const u = cleanUser_(b.username), sh = userSheet_();
  if (!u || !userRow_(sh, u)) return { error: 'No login with that username.' };
  if (u === who) return { error: 'You cannot change your own login here.' };
  if (b.action === 'removeUser') {
    if (roleOf_(u) === 'owner' && ownerCount_() < 2) return { error: 'There has to be at least one owner.' };
    removeUser_(u);
    return teamData_(who);
  }
  if (b.action === 'resetPassword') {
    if (String(b.password || '').length < MIN_PASSWORD) return { error: 'Passwords need at least ' + MIN_PASSWORD + ' characters.' };
    addUser_(u, b.password);
    return teamData_(who);
  }
  return { error: 'unknown action' };
}

// ---- Clean slate. Wipes every test order, partner, invoice, note, closed day and text log. Keeps the menu (Products),
// the Messages wording, product photos and logins. Only works before the owner has claimed the system.
function clearTestData_() {
  const ss = SpreadsheetApp.getActive(), done = {};
  [SHEET, PARTNER_SHEET, PORDER_SHEET, NOTE_SHEET, CLOSED_SHEET, TEXT_SHEET].forEach(function (name) {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const n = sh.getLastRow() - 1;
    if (n > 0) sh.getRange(2, 1, n, Math.max(1, sh.getLastColumn())).clearContent();
    done[name] = Math.max(0, n);
  });
  try { rebuild_(); } catch (e) { }
  return done;
}
function menuClearTestData() {
  const ui = SpreadsheetApp.getUi();
  if (claimed_()) { ui.alert('Not cleared', 'The owner has already taken this over, so real orders may be in here. Clearing is turned off.', ui.ButtonSet.OK); return; }
  const a = ask_('Clear all test data', 'This deletes every order, partner, invoice, note, closed day and text log. It keeps the menu, the text wording, product photos and logins. It cannot be undone.\n\nType CLEAR to continue:');
  if (a === null || String(a).trim() !== 'CLEAR') { if (a !== null) ui.alert('Nothing was deleted.'); return; }
  const d = clearTestData_();
  ui.alert('Clean slate', Object.keys(d).map(function (k) { return k + ': ' + d[k] + ' rows removed'; }).join('\n'), ui.ButtonSet.OK);
}

// "1x70P, 2x12W" -> [{code, qty}] using the codes in the Products tab. Null when something does not match.
function parseItems_(str) {
  const pm = prodMap_();
  const out = [];
  const parts = String(str == null ? '' : str).split(/[,;\n]+/);
  for (let k = 0; k < parts.length; k++) {
    const part = parts[k].trim();
    if (!part) continue;
    const m = part.match(/^(?:(\d+)\s*x\s*)?([A-Za-z0-9]+)$/i);
    if (!m) return null;
    let key = m[2].toUpperCase();
    if (/^\d+$/.test(key) && pm[key + 'P']) key = key + 'P';
    const p = pm[key];
    if (!p) return null;
    out.push({ code: p.code, qty: Math.min(99, Math.max(1, +(m[1] || 1))) });
  }
  return out.length ? out : null;
}
function prodOf_(code) { return prodMap_()[String(code).toUpperCase()] || { code: code, name: code, pieces: 0, price: 0, on: false, gone: true }; }
function pieces_(items) { return items.reduce(function (s, i) { return s + prodOf_(i.code).pieces * i.qty; }, 0); }
function shopNow_() {
  const p = Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd HH:mm').split(' ');
  return { date: p[0], time: p[1] };
}
function slotList_() {
  const a = [];
  // Pickup times: 9:30 AM to 5:30 PM every half hour, plus a last slot at 5:45 PM (shop closes at 6).
  for (let h = 9; h < 18; h++) { if (h > 9) a.push(('0' + h).slice(-2) + ':00'); a.push(('0' + h).slice(-2) + ':30'); }
  a.push('17:45');
  return a;
}
function dayOfWeek_(ymd) {
  const p = ymd.split('-').map(Number);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
}
function addDaysYmd_(ymd, n) {
  const p = ymd.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
}

// Public, read only: how full each slot is. No names or phone numbers leave the sheet here.
function slots_() {
  const now = shopNow_();
  const slots = {}, pcs = {};
  read_().forEach(function (r) {
    if (r.date < now.date) return;
    slots[r.date] = slots[r.date] || {};
    slots[r.date][r.time] = (slots[r.date][r.time] || 0) + 1;
    const it = parseItems_(r.items);
    pcs[r.date] = (pcs[r.date] || 0) + (it ? pieces_(it) : 0);
  });
  return { slots: slots, pieces: pcs, closed: readClosed_(), now: now, slotCap: SLOT_CAP, dayCap: DAY_CAP, times: slotList_(), daysAhead: MAX_DAYS_AHEAD };
}

// Public: a customer order from the order page.
function intake_(b) {
  if (b.website) return { ok: true };                       // honeypot, bots fill this
  const name = String(b.name || '').replace(/^[=+\-@\s]+/, '').trim().slice(0, 60);
  const phoneRaw = String(b.phone || '').trim().slice(0, 24);
  const phone = phoneOk_(phoneRaw) ? fmtPhone_(phoneRaw) : phoneRaw;
  const note = String(b.note || '').replace(/^[=+\-@\s]+/, '').trim().slice(0, 200);
  const date = String(b.date || ''), time = String(b.time || '');
  const items = parseItems_(b.items);
  if (!name) return { error: 'Add your name.' };
  if (!phoneOk_(phoneRaw)) return { error: 'Enter a US number like (415) 555-0199. For a number outside the US, start with + and the country code.' };
  if (!items || items.length > 12) return { error: 'Pick at least one item.' };
  if (items.some(function (i) { const p = prodOf_(i.code); return !p.on || p.gone; })) return { error: 'One of those items is not available any more. The list has been refreshed, please pick again.', reload: true };
  const pc = pieces_(items);
  if (pc > DAY_CAP) return { error: 'That is more than we can bake in a day. Please message us.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || slotList_().indexOf(time) < 0) return { error: 'Pick a day and a time.' };
  const now = shopNow_();
  if (date < now.date || date > addDaysYmd_(now.date, MAX_DAYS_AHEAD)) return { error: 'That day is not open for orders.' };
  if (dayOfWeek_(date) === 0) return { error: 'We are closed on Sundays.' };
  if (readClosed_().indexOf(date) >= 0) return { error: 'We are not taking online orders for that day. Please pick another day.', reload: true };
  if (date === now.date) {
    const nm = +now.time.slice(0, 2) * 60 + +now.time.slice(3), tm = +time.slice(0, 2) * 60 + +time.slice(3);
    if (tm - nm < MIN_LEAD_MIN) return { error: 'That time is too soon. Pick a later slot.' };
  }
  const cache = CacheService.getScriptCache();
  const hour = 'intake_' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHH');
  const n = +(cache.get(hour) || 0);
  if (n >= MAX_PER_HOUR) return { error: 'We are getting a lot of orders right now. Please try again in a bit.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = read_();
    const itemsText = items.map(function (i) { return i.qty + 'x' + i.code; }).join(', ');
    const same = rows.filter(function (r) { return r.date === date && r.time === time && r.phone === phone && r.items === itemsText; })[0];
    if (same) return { ok: true, id: same.id, date: date, time: time };   // double tap
    const atSlot = rows.filter(function (r) { return r.date === date && r.time === time; }).length;
    if (atSlot >= SLOT_CAP) return { error: 'That time just filled up. Pick another.', full: true };
    let dayPc = 0;
    rows.forEach(function (r) { if (r.date === date) { const it = parseItems_(r.items); if (it) dayPc += pieces_(it); } });
    if (dayPc + pc > DAY_CAP) return { error: 'That day is full. Pick another day.', full: true };
    const id = 'w' + Utilities.getUuid().replace(/-/g, '').slice(0, 9);
    const row = { id: id, date: date, time: time, name: name, phone: phone, items: itemsText, note: note, paid: 'none', status: 'pending', sample: '', source: 'web', seen: '', optin: b.optin === true ? 'yes' : '', ready: '' };
    const sh = sheet_();
    const r = sh.getLastRow() + 1;
    const rng = sh.getRange(r, 1, 1, COLS.length);
    rng.setNumberFormat('@');
    rng.setValues([COLS.map(function (c) { return row[c]; })]);
    cache.put(hour, String(n + 1), 3600);
    safeRebuild_();
    // No text yet: the order waits on the dashboard until the owner confirms it. The text goes out then, and only if the customer ticked the opt-in box.
    return { ok: true, id: id, date: date, time: time };
  } finally {
    lock.releaseLock();
  }
}


// ---------------------------------------------------------------------------------------------
// Texts: phone number helpers, then the Telnyx sender below.
// ---------------------------------------------------------------------------------------------
function fmtTime_(t) {
  const h = +t.slice(0, 2), m = t.slice(3, 5);
  return (h % 12 || 12) + (m === '00' ? '' : ':' + m) + (h >= 12 ? ' pm' : ' am');
}
function rawDigits_(p) { return String(p == null ? '' : p).replace(/\D/g, ''); }
function isIntl_(p) {
  const t = String(p == null ? '' : p).trim();
  return t.charAt(0) === '+' && rawDigits_(t).charAt(0) !== '1';
}
function usDigits_(p) {
  let d = rawDigits_(p);
  if (d.charAt(0) === '1') d = d.slice(1);
  return d;
}
function usOk_(p) {
  const d = usDigits_(p);
  return !isIntl_(p) && /^[2-9]\d{2}[2-9]\d{6}$/.test(d) && d.slice(1, 3) !== '11' && d.slice(4, 6) !== '11' && !/^(\d)\1{9}$/.test(d);
}
function phoneOk_(p) {
  if (isIntl_(p)) { const n = rawDigits_(p).length; return n >= 8 && n <= 15; }
  return usOk_(p);
}
function fmtPhone_(p) {
  if (isIntl_(p)) return '+' + rawDigits_(p).slice(0, 15);
  const d = usDigits_(p);
  return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
}
// +1XXXXXXXXXX for US/Canada, +CCXXXX for other countries, '' when it is not a usable number.
// Only numbers that start with +1 are texted.
function e164_(p) {
  if (!phoneOk_(p)) return '';
  return isIntl_(p) ? '+' + rawDigits_(p) : '+1' + usDigits_(p);
}
// ---- Texts go straight to Telnyx. Setup (once): in Apps Script, Project Settings > Script Properties, add
// TELNYX_KEY = your Telnyx API key. Optional: TELNYX_FROM (defaults to the 888 number) and TEXT_MODE = test
// (logs what would be sent without sending). Then pick Baklava Story > Texts: turn on retries.
// Every send is written to the hidden Texts tab: sent to Telnyx, delivered, failed, and why.
const TEXT_SHEET = 'Texts';
const TCOLS = ['logged', 'order', 'kind', 'to', 'status', 'tries', 'telnyx id', 'detail', 'message'];
const TELNYX_FROM_DEFAULT = '+18885200246';
const TEXT_MAX_TRIES = 3, TEXT_MAX_AGE_HOURS = 3;

function textSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(TEXT_SHEET);
  if (!sh) {
    sh = ss.insertSheet(TEXT_SHEET);
    sh.getRange(1, 1, 1, TCOLS.length).setValues([TCOLS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange('B:I').setNumberFormat('@');
    sh.hideSheet();
  }
  return sh;
}
function textProps_() {
  const p = PropertiesService.getScriptProperties();
  return { key: p.getProperty('TELNYX_KEY') || '', from: p.getProperty('TELNYX_FROM') || TELNYX_FROM_DEFAULT, test: String(p.getProperty('TEXT_MODE') || '').toLowerCase() === 'test' };
}
// One call to Telnyx. Returns { ok, id, status, detail, retry } where retry means "worth trying again later".
function telnyxSend_(to, text, idemKey) {
  const cfg = textProps_();
  if (cfg.test) return { ok: true, id: '', status: 'test, not sent', detail: 'TEXT_MODE is test' };
  if (!cfg.key) return { ok: false, status: 'failed', detail: 'No TELNYX_KEY in Script Properties', retry: true };
  try {
    const res = UrlFetchApp.fetch('https://api.telnyx.com/v2/messages', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + cfg.key, 'Idempotency-Key': idemKey },
      payload: JSON.stringify({ from: cfg.from, to: to, text: text })
    });
    const code = res.getResponseCode();
    let j = {};
    try { j = JSON.parse(res.getContentText()); } catch (e) { }
    if (code >= 200 && code < 300 && j.data) {
      const st = j.data.to && j.data.to[0] ? j.data.to[0].status : 'queued';
      return { ok: true, id: j.data.id || '', status: 'sent to Telnyx', detail: st };
    }
    const err = j.errors && j.errors[0] ? (j.errors[0].code + ' ' + (j.errors[0].detail || j.errors[0].title || '')) : ('HTTP ' + code);
    // 429 and 5xx are temporary. 4xx (bad number, unverified, no credit) will not fix itself by retrying soon.
    return { ok: false, status: 'failed', detail: err.slice(0, 300), retry: code === 429 || code >= 500 };
  } catch (e) {
    return { ok: false, status: 'failed', detail: 'Network: ' + String(e).slice(0, 200), retry: true };
  }
}
function logText_(orderId, kind, to, message) {
  const sh = textSheet_(), r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, TCOLS.length).setValues([[new Date(), orderId, kind, to, 'sending', 0, '', '', message]]);
  return r;
}
function attempt_(sh, r) {
  const v = sh.getRange(r, 1, 1, TCOLS.length).getValues()[0];
  const tries = (+v[5] || 0) + 1;
  const out = telnyxSend_(String(v[3]), String(v[8]), 'bs-' + v[1] + '-' + v[2] + '-' + r);
  sh.getRange(r, 5, 1, 4).setValues([[out.ok ? out.status : (out.retry && tries < TEXT_MAX_TRIES ? 'retry' : 'failed'), tries, out.id || v[6], out.detail || '']]);
  return out;
}
// The wording of each text lives in the Messages tab, so it can be changed without touching code.
// If the tab is missing, a cell is empty, or a {word} is misspelled, the built-in wording below is used instead.
const MSG_SHEET = 'Messages';
const MSG_DEFAULTS = [
  ['Confirmation', 'Hi {name}, your Baklava Story order is confirmed: {items}, pickup {day} at {time}, {address}.{noteline} Reply STOP to opt out.', 'Sent when you confirm an online order, if the customer ticked the text box.'],
  ['Ready', 'Hi {name}, your Baklava Story order is ready for pickup at {address}. Reply STOP to opt out.', 'Sent when you mark an order ready, if the customer ticked the text box.']
];
function msgExample_() {
  return 'SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE(B#,"{name}","Sarah"),"{items}","1 x Pistachio 35 pieces"),"{day}","Tuesday, November 10"),"{time}","1 pm"),"{address}","' + ADDRESS + '"),"{noteline}"," Noted: birthday."),"  "," ")';
}
function ensureMessages_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(MSG_SHEET);
  const fresh = !sh;
  if (fresh) sh = ss.insertSheet(MSG_SHEET);
  sh.getRange(1, 1, 1, 6).setValues([['Message', 'Text (edit this column)', 'When it is sent', 'Characters', 'Texts per message', 'Preview with an example order']])
    .setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
  if (fresh) {
    sh.getRange(2, 1, MSG_DEFAULTS.length, 3).setValues(MSG_DEFAULTS);
    sh.setFrozenRows(1);
    sh.setColumnWidths(1, 1, 120); sh.setColumnWidth(2, 460); sh.setColumnWidth(3, 260); sh.setColumnWidth(4, 90); sh.setColumnWidth(5, 120); sh.setColumnWidth(6, 460);
    sh.getRange(2, 1, 10, 6).setWrap(true).setVerticalAlignment('top');
    sh.getRange(2, 2, MSG_DEFAULTS.length, 1).setBackground('#FFF4A8');
    sh.getRange(5, 1, 1, 2).merge().setValue('You can use these words in a message. They fill in for each order:')
      .setFontWeight('bold');
    sh.getRange(6, 1, 6, 3).setValues([
      ['{name}', 'Customer first name, like Sarah', ''],
      ['{items}', 'What they ordered, like 1 x Pistachio 35 pieces, 2 x Walnut 12 pieces', ''],
      ['{day}', 'Pickup day, like Tuesday, November 10', ''],
      ['{time}', 'Pickup time, like 1 pm', ''],
      ['{address}', 'The pickup address', ''],
      ['{noteline}', 'Their note, like Noted: birthday. It is left out when there is no note.', '']
    ]);
    sh.getRange(12, 1, 1, 3).merge().setValue('Each text is billed per segment: 160 characters is one, then about 153 per extra segment. Emoji and curly quotes cut that to 70, so avoid them. If a message does not say Reply STOP, it is added automatically.')
      .setWrap(true).setFontColor('#666666');
    sh.setRowHeight(12, 64);
  }
  for (let r = 2; r <= 1 + MSG_DEFAULTS.length; r++) {
    sh.getRange(r, 4).setFormula('=LEN(B' + r + ')');
    sh.getRange(r, 5).setFormula('=IF(B' + r + '="","",IF(LEN(' + 'F' + r + ')<=160,1,ROUNDUP(LEN(F' + r + ')/153,0)))');
    sh.getRange(r, 6).setFormula('=' + msgExample_().replace(/#/g, r));
  }
  return sh;
}
function customMsg_(label) {
  try {
    const sh = ensureMessagesQuiet_();
    if (!sh) return '';
    const rows = sh.getRange(2, 1, MSG_DEFAULTS.length, 2).getValues();
    for (let i = 0; i < rows.length; i++) if (String(rows[i][0]).trim().toLowerCase() === label.toLowerCase()) return String(rows[i][1] || '').trim();
  } catch (e) { /* fall back to the built-in wording */ }
  return '';
}
function ensureMessagesQuiet_() {
  return SpreadsheetApp.getActive().getSheetByName(MSG_SHEET) || ensureMessages_();
}
function fillMsg_(t, vars) {
  return t.replace(/\{(\w+)\}/g, function (m, k) { return Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m; }).replace(/ {2,}/g, ' ').trim();
}
function textFor_(row, kind) {
  const items = parseItems_(row.items) || [];
  const vars = {
    name: String(row.name).trim().split(' ')[0],
    items: items.map(function (i) { return i.qty + ' x ' + prodOf_(i.code).name; }).join(', '),
    day: Utilities.formatDate(new Date(row.date + 'T12:00:00'), SHOP_TZ, 'EEEE, MMMM d'),
    time: fmtTime_(row.time),
    address: ADDRESS,
    noteline: row.note ? ' Noted: ' + row.note + '.' : ''
  };
  const def = MSG_DEFAULTS[kind === 'ready' ? 1 : 0], custom = customMsg_(def[0]);
  let out = fillMsg_(custom || def[1], vars);
  if (custom && /\{\w+\}/.test(out)) out = fillMsg_(def[1], vars);   // a misspelled {word}: use the built-in wording
  if (!/stop/i.test(out)) out += ' Reply STOP to opt out.';
  return out;
}
// Send one text for an order. Never throws: the order is already saved, a text problem must not undo it.
function notify_(row, event) {
  try {
    const to = e164_(row.phone);
    if (!to || to.indexOf('+1') !== 0) return;
    const kind = event === 'ready' ? 'ready' : 'confirmation';
    // Never text the same order twice for the same reason, even if the dashboard re-sends a save.
    const ts = textSheet_(), n = ts.getLastRow() - 1;
    if (n > 0) {
      const seen = ts.getRange(Math.max(2, n - 498), 2, Math.min(n, 500), 4).getDisplayValues();
      if (seen.some(function (x) { return x[0] === String(row.id) && x[1] === kind && !/^(failed|gave up|not delivered)$/.test(x[3]); })) return;
    }
    const r = logText_(row.id, kind, to, textFor_(row, kind));
    attempt_(textSheet_(), r);
  } catch (e) { /* ignore */ }
}
// Runs every 10 minutes once retries are turned on: resends texts that failed for a temporary reason,
// and checks whether texts Telnyx accepted were actually delivered.
function retryTexts() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return;
  try {
    rebuildIfDirty_();
    const sh = textSheet_(), n = sh.getLastRow() - 1;
    if (n < 1) return;
    const rows = sh.getRange(2, 1, n, TCOLS.length).getValues(), now = Date.now(), key = textProps_().key;
    for (let i = Math.max(0, n - 300); i < n; i++) {
      const v = rows[i], r = i + 2, age = (now - new Date(v[0]).getTime()) / 3600000;
      if (v[4] === 'retry' || v[4] === 'sending') {
        if (age > TEXT_MAX_AGE_HOURS) sh.getRange(r, 5, 1, 4).setValues([['gave up', v[5], v[6], 'Too old to send: ' + v[7]]]);
        else attempt_(sh, r);
      } else if (v[4] === 'sent to Telnyx' && v[6] && key && age < 48) {
        try {
          const res = UrlFetchApp.fetch('https://api.telnyx.com/v2/messages/' + encodeURIComponent(v[6]), { headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true });
          const j = JSON.parse(res.getContentText());
          const t = j.data && j.data.to && j.data.to[0];
          if (!t) continue;
          const errs = (j.data.errors || []).map(function (x) { return x.code + ' ' + (x.detail || x.title || ''); }).join('; ');
          if (t.status === 'delivered') sh.getRange(r, 5).setValue('delivered');
          else if (/failed|expired/.test(t.status)) sh.getRange(r, 5, 1, 4).setValues([['not delivered', v[5], v[6], (t.status + ' ' + errs).trim().slice(0, 300)]]);
          else sh.getRange(r, 8).setValue(t.status);
        } catch (e) { /* try again next run */ }
      }
    }
  } finally {
    lock.releaseLock();
  }
}
// ---- Texts menu
function menuTextSetup() {
  const ui = SpreadsheetApp.getUi(), cfg = textProps_();
  const has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'retryTexts'; });
  ui.alert('Texts setup',
    'Telnyx key: ' + (cfg.key ? 'added' : 'missing. Add TELNYX_KEY in Project Settings > Script Properties.') +
    '\nSending from: ' + cfg.from +
    '\nMode: ' + (cfg.test ? 'test (nothing is sent, only logged)' : 'live') +
    '\nRetries every 10 minutes: ' + (has ? 'on' : 'off. Pick Texts: turn on retries.'), ui.ButtonSet.OK);
}
function menuTextRetriesOn() {
  const has = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'retryTexts'; });
  if (!has) ScriptApp.newTrigger('retryTexts').timeBased().everyMinutes(10).create();
  SpreadsheetApp.getUi().alert('Retries are on. Failed texts are tried again every 10 minutes, and delivery is checked.');
}
function menuTextTest() {
  const ui = SpreadsheetApp.getUi();
  const a = ui.prompt('Send a test text', 'US phone number to text, for example (415) 555-0199:', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  const to = e164_(a.getResponseText());
  if (!to || to.indexOf('+1') !== 0) { ui.alert('That is not a US number.'); return; }
  const r = logText_('test', 'test', to, 'Baklava Story test text. If you got this, texts are working. Reply STOP to opt out.');
  const out = attempt_(textSheet_(), r);
  ui.alert(out.ok ? 'Telnyx accepted it (' + out.status + '). Check the phone. The Texts tab shows delivered or not within about 10 minutes once retries are on.' : 'It did not go through: ' + out.detail + '\nDetails are in the hidden Texts tab.');
}
function menuShowTextLog() { const sh = textSheet_(); sh.showSheet(); sh.activate(); }

// ---------------------------------------------------------------------------------------------
// Partners: wholesale customers who pay by check. Their own prices, and one invoice per order that can be
// emailed from the dashboard. Every partner order is also a real order on the Week board and in the bake list
// (Orders tab, source "partner", id "po" + the invoice row id), kept in step with its invoice. Owner logins only.
// ---------------------------------------------------------------------------------------------
const PARTNER_SHEET = 'Partners', PORDER_SHEET = 'Partner orders';
const PTCOLS = ['id', 'name', 'contact', 'email', 'phone', 'address', 'prices', 'note', 'active', 'created'];
const POCOLS = ['id', 'invoice', 'partner', 'date', 'items', 'prices', 'total', 'note', 'paid', 'sent', 'created', 'time'];
const INVOICE_FROM = 'hey@baklavastory.com';
const BAKERY_PHONE = '(415) 766-7929';

function tabSheet_(name, cols) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');
    sh.hideSheet();
  }
  return sh;
}
function readTab_(name, cols) {
  const sh = tabSheet_(name, cols), n = sh.getLastRow() - 1;
  if (sh.getLastColumn() < cols.length) sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
  if (n < 1) return [];
  return sh.getRange(2, 1, n, cols.length).getDisplayValues().filter(function (r) { return r[0] !== ''; }).map(function (r) {
    const o = {}; cols.forEach(function (c, i) { o[c] = r[i]; }); return o;
  });
}
function rowOf_(sh, id) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const ids = sh.getRange(2, 1, n, 1).getDisplayValues();
  for (let i = 0; i < n; i++) if (ids[i][0] === id) return i + 2;
  return 0;
}
function writeRow_(name, cols, o) {
  const sh = tabSheet_(name, cols);
  let r = rowOf_(sh, o.id);
  if (!r) r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, cols.length).setNumberFormat('@').setValues([cols.map(function (c) { return o[c] == null ? '' : String(o[c]); })]);
}
function clean_(v, n) { return String(v == null ? '' : v).replace(/^[=+\-@\s]+/, '').trim().slice(0, n || 200); }
function parseJson_(s) { try { return JSON.parse(s || '{}') || {}; } catch (e) { return {}; } }
function money_(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
function escH_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

function partnersData_() {
  return { partners: readTab_(PARTNER_SHEET, PTCOLS), porders: readTab_(PORDER_SHEET, POCOLS) };
}
function savePartner_(p) {
  if (!p) return { error: 'Missing partner.' };
  const name = clean_(p.name, 80);
  if (!name) return { error: 'Add the business name.' };
  const email = clean_(p.email, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email does not look right.' };
  const prices = {};
  Object.keys(p.prices || {}).forEach(function (code) {
    const v = Number(p.prices[code]);
    if (prodMap_()[String(code).toUpperCase()] && isFinite(v) && v >= 0 && String(p.prices[code]) !== '') prices[String(code).toUpperCase()] = Math.round(v * 100) / 100;
  });
  const old = p.id ? readTab_(PARTNER_SHEET, PTCOLS).filter(function (x) { return x.id === p.id; })[0] : null;
  const o = {
    id: old ? old.id : 'p' + Utilities.getUuid().replace(/-/g, '').slice(0, 9), name: name, contact: clean_(p.contact, 80), email: email,
    phone: clean_(p.phone, 30), address: clean_(p.address, 200), prices: JSON.stringify(prices), note: clean_(p.note, 300),
    active: p.active === false ? 'no' : 'yes', created: old ? old.created : Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd')
  };
  writeRow_(PARTNER_SHEET, PTCOLS, o);
  return { ok: true, id: o.id };
}
function savePartnerOrder_(b) {
  const p = readTab_(PARTNER_SHEET, PTCOLS).filter(function (x) { return x.id === b.partner; })[0];
  if (!p) return { error: 'Pick a partner.' };
  const items = parseItems_(b.items);
  if (!items || !items.length) return { error: 'Add at least one item.' };
  const date = String(b.date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Pick a date.' };
  const time = /^\d{2}:\d{2}$/.test(String(b.time || '')) ? String(b.time) : '10:00';
  const own = parseJson_(p.prices), unit = {};
  let total = 0;
  items.forEach(function (i) {
    const c = String(i.code).toUpperCase(), price = own[c] != null ? Number(own[c]) : Number(prodOf_(c).price) || 0;
    unit[c] = price; total += price * i.qty;
  });
  const all = readTab_(PORDER_SHEET, POCOLS), old = b.id ? all.filter(function (x) { return x.id === b.id; })[0] : null;
  let inv = old ? old.invoice : '';
  if (!inv) {
    const max = all.reduce(function (m, x) { const n = +String(x.invoice).replace(/\D/g, ''); return n > m ? n : m; }, 1000);
    inv = 'INV-' + (max + 1);
  }
  const o = {
    id: old ? old.id : 'v' + Utilities.getUuid().replace(/-/g, '').slice(0, 9), invoice: inv, partner: p.id, date: date,
    items: items.map(function (i) { return i.qty + 'x' + String(i.code).toUpperCase(); }).join(', '), prices: JSON.stringify(unit),
    total: (Math.round(total * 100) / 100).toFixed(2), note: clean_(b.note, 300), paid: old ? old.paid : '', sent: old ? old.sent : '',
    created: old ? old.created : Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd HH:mm'), time: time
  };
  writeRow_(PORDER_SHEET, POCOLS, o);
  const row = boardRowFor_(o, p);
  safeRebuild_();
  return { ok: true, id: o.id, invoice: inv, row: row };
}
function setPartnerPaid_(id, paid) {
  const sh = tabSheet_(PORDER_SHEET, POCOLS), r = rowOf_(sh, id);
  if (!r) return { error: 'Invoice not found.' };
  sh.getRange(r, POCOLS.indexOf('paid') + 1).setValue(paid ? Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd') : '');
  boardSet_('po' + id, 'paid', paid ? 'paid' : 'none');
  return { ok: true };
}
function deletePartnerOrder_(id) {
  const sh = tabSheet_(PORDER_SHEET, POCOLS), r = rowOf_(sh, id);
  if (r) sh.deleteRow(r);
  boardSet_('po' + id, 'status', 'cancelled');
  return { ok: true };
}
// The partner order's row on the Week board. Status and ready are kept when the invoice is edited.
function boardRowFor_(o, p) {
  const sh = sheet_(), id = 'po' + o.id;
  let r = findRow_(sh, id);
  const cur = r > 0 ? sh.getRange(r, 1, 1, COLS.length).getDisplayValues()[0] : null;
  const row = {
    id: id, date: o.date, time: o.time || '10:00', name: p.name, phone: p.phone || '', items: o.items,
    note: o.invoice + (o.note ? ', ' + o.note : ''), paid: o.paid ? 'paid' : 'none',
    status: cur && cur[COLS.indexOf('status')] && cur[COLS.indexOf('status')] !== 'cancelled' ? cur[COLS.indexOf('status')] : 'new',
    sample: '', source: 'partner', seen: 'yes', optin: '', ready: cur ? cur[COLS.indexOf('ready')] : ''
  };
  if (r < 0) r = sh.getLastRow() + 1;
  sh.getRange(r, 1, 1, COLS.length).setNumberFormat('@').setValues([COLS.map(function (c) { return String(row[c] == null ? '' : row[c]); })]);
  return row;
}
function boardSet_(id, col, val) {
  const sh = sheet_(), r = findRow_(sh, id);
  if (r > 0) sh.getRange(r, COLS.indexOf(col) + 1).setValue(val);
}
function invoiceHtml_(id) {
  const o = readTab_(PORDER_SHEET, POCOLS).filter(function (x) { return x.id === id; })[0];
  if (!o) return null;
  const p = readTab_(PARTNER_SHEET, PTCOLS).filter(function (x) { return x.id === o.partner; })[0] || { name: '(partner removed)' };
  const unit = parseJson_(o.prices), items = parseItems_(o.items) || [];
  const day = Utilities.formatDate(new Date(o.date + 'T12:00:00'), SHOP_TZ, 'MMMM d, yyyy');
  const rows = items.map(function (i) {
    const c = String(i.code).toUpperCase(), u = Number(unit[c]) || 0;
    return '<tr><td>' + escH_(prodOf_(c).name) + '</td><td class="n">' + i.qty + '</td><td class="n">' + money_(u) + '</td><td class="n">' + money_(u * i.qty) + '</td></tr>';
  }).join('');
  const bill = [p.name, p.contact, p.address, p.email, p.phone].filter(Boolean).map(escH_).join('<br>');
  return '<!doctype html><html><head><meta charset="utf-8"><title>Invoice ' + escH_(o.invoice) + '</title><style>'
    + 'body{font-family:Helvetica,Arial,sans-serif;color:#000;margin:0;padding:40px;font-size:14px;line-height:1.5}'
    + '.top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px}'
    + 'h1{font-size:28px;margin:0}.muted{color:#555}.n{text-align:right}'
    + 'table{width:100%;border-collapse:collapse;margin:24px 0}th{text-align:left;border-bottom:1px solid #000;padding:8px 6px;font-size:13px}td{padding:8px 6px;border-bottom:1px solid #ddd}'
    + '.tot td{border:0;font-weight:700;font-size:16px;padding-top:14px}.paid{display:inline-block;background:#fde047;font-weight:700;padding:2px 8px;margin-top:6px}'
    + '</style></head><body><div class="top"><div><h1>Baklava Story</h1><div class="muted">' + escH_(ADDRESS) + ', San Francisco<br>' + INVOICE_FROM + '<br>' + BAKERY_PHONE + '</div></div>'
    + '<div class="n"><b style="font-size:20px">Invoice ' + escH_(o.invoice) + '</b><br><span class="muted">Order date ' + day + '</span>' + (o.paid ? '<br><span class="paid">Paid</span>' : '') + '</div></div>'
    + '<div class="muted" style="font-size:12px">Bill to</div><div>' + bill + '</div>'
    + '<table><tr><th>Item</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr>' + rows
    + '<tr class="tot"><td colspan="3" class="n">Total</td><td class="n">' + money_(Number(o.total) || 0) + '</td></tr></table>'
    + (o.note ? '<p><b>Note:</b> ' + escH_(o.note) + '</p>' : '')
    + '<p>' + (o.paid ? 'Paid, thank you.' : 'Please pay by check, made out to Baklava Story.') + '</p>'
    + '<p class="muted" style="margin-top:40px">Questions about this invoice? Email ' + INVOICE_FROM + ' or call ' + BAKERY_PHONE + '.</p></body></html>';
}
function emailInvoice_(id) {
  const o = readTab_(PORDER_SHEET, POCOLS).filter(function (x) { return x.id === id; })[0];
  if (!o) return { error: 'Invoice not found.' };
  const p = readTab_(PARTNER_SHEET, PTCOLS).filter(function (x) { return x.id === o.partner; })[0];
  if (!p || !p.email) return { error: 'This partner has no email. Add one on their partner page.' };
  const html = invoiceHtml_(id);
  const pdf = Utilities.newBlob(html, 'text/html', o.invoice + '.html').getAs('application/pdf').setName('Baklava Story ' + o.invoice + '.pdf');
  const subject = 'Invoice ' + o.invoice + ' from Baklava Story';
  const body = '<p>Hi ' + escH_((p.contact || p.name).split(' ')[0]) + ',</p><p>Attached is invoice ' + escH_(o.invoice) + ' from Baklava Story for ' + money_(Number(o.total) || 0) + '.' + (o.paid ? ' It is already paid, this copy is for your records.' : ' Please pay by check, made out to Baklava Story.') + '</p><p>Thank you,<br>Baklava Story</p>';
  const props = PropertiesService.getScriptProperties();
  const key = String(props.getProperty('RESEND_KEY') || '').trim();
  let from;
  if (key) {
    // Resend. RESEND_FROM looks like: Baklava Story <hey@baklavastory.com> (or onboarding@resend.dev while testing).
    from = String(props.getProperty('RESEND_FROM') || 'Baklava Story <onboarding@resend.dev>').trim();
    const res = UrlFetchApp.fetch('https://api.resend.com/emails', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + key },
      payload: JSON.stringify({ from: from, to: [p.email], reply_to: INVOICE_FROM, subject: subject, html: body,
        attachments: [{ filename: pdf.getName(), content: Utilities.base64Encode(pdf.getBytes()) }] })
    });
    const code = res.getResponseCode();
    if (code < 200 || code >= 300) {
      let why = '';
      try { why = JSON.parse(res.getContentText()).message || ''; } catch (e) { why = ''; }
      return { error: 'Email was not sent' + (why ? ': ' + why : ' (error ' + code + ').') };
    }
  } else {
    // No Resend key yet: send through this Google account. It uses hey@baklavastory.com when that is the account or a "Send mail as" address.
    let me = '';
    try { me = Session.getEffectiveUser().getEmail(); } catch (e) { me = ''; }
    const canAlias = me.toLowerCase() === INVOICE_FROM || GmailApp.getAliases().map(function (x) { return x.toLowerCase(); }).indexOf(INVOICE_FROM) >= 0;
    const opts = { name: 'Baklava Story', attachments: [pdf], replyTo: INVOICE_FROM, htmlBody: body };
    if (canAlias) opts.from = INVOICE_FROM;
    GmailApp.sendEmail(p.email, subject, subject + ' is attached as a PDF.', opts);
    from = canAlias ? INVOICE_FROM : (me || 'this Google account');
  }
  const sh = tabSheet_(PORDER_SHEET, POCOLS), r = rowOf_(sh, id);
  if (r) sh.getRange(r, POCOLS.indexOf('sent') + 1).setValue(Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd HH:mm'));
  return { ok: true, from: from, to: p.email };
}
// Run once from the editor after adding RESEND_KEY: it asks for the permission Resend needs and checks the key.
function authResend() {
  const key = String(PropertiesService.getScriptProperties().getProperty('RESEND_KEY') || '').trim();
  if (!key) { Logger.log('RESEND_KEY is not set yet. Add it in Project Settings > Script Properties, then run this again.'); return; }
  const res = UrlFetchApp.fetch('https://api.resend.com/domains', { headers: { Authorization: 'Bearer ' + key }, muteHttpExceptions: true });
  const txt = res.getContentText();
  const ok = res.getResponseCode() === 200 || txt.indexOf('restricted_api_key') >= 0; // a sending-only key cannot list domains, which is fine
  Logger.log(ok ? 'Resend key works.' : 'Resend answered ' + res.getResponseCode() + ': ' + txt);
}

// ---------------------------------------------------------------------------------------------
// Report tabs: Summary, Breakdown, Customers. Rebuilt from the Orders tab after every change,
// and any time you pick Baklava Story > Refresh reports. Do not type in these tabs, they are overwritten.
// ---------------------------------------------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function onOpen() {
  testGuard_();
  rebuildIfDirty_();
  try { ensureMessages_(); } catch (e) { /* the Messages tab is created on the next open */ }
  SpreadsheetApp.getUi().createMenu('Baklava Story (TEST)').addItem('Refresh reports', 'refreshReports').addItem('Tidy the Orders tab', 'menuTidyOrders').addSeparator().addItem('Add or reset a login', 'menuAddLogin').addItem('Remove a login', 'menuRemoveLogin').addItem('List logins', 'menuListLogins').addItem('Set the join code', 'menuSetJoinCode').addSeparator().addItem('Clear all test data', 'menuClearTestData').addSeparator().addItem('Texts: check setup', 'menuTextSetup').addItem('Texts: send a test text', 'menuTextTest').addItem('Texts: turn on retries', 'menuTextRetriesOn').addItem('Texts: show the log', 'menuShowTextLog').addToUi();
}
function refreshReports() { rebuild_(); }

function shortDate_(ymd) { const p = ymd.split('-'); return MON3[+p[1] - 1] + ' ' + (+p[2]); }
function mondayOfYmd_(ymd) { return addDaysYmd_(ymd, -((dayOfWeek_(ymd) + 6) % 7)); }
function price_(items) { return items.reduce(function (s, i) { return s + prodOf_(i.code).price * i.qty; }, 0); }

function loadOrders_() {
  return read_().filter(function (r) { return r.source !== 'partner'; }).map(function (r) {
    const items = parseItems_(r.items) || [];
    return { id: r.id, date: r.date, time: r.time, name: r.name, phone: r.phone, items: items, status: r.status, source: r.source,
      pcs: pieces_(items), rev: price_(items) };
  });
}
function agg_(list) {
  return list.reduce(function (a, o) { a.n++; a.pcs += o.pcs; a.rev += o.rev; return a; }, { n: 0, pcs: 0, rev: 0 });
}
function groupBy_(list, fn) {
  const m = {}, keys = [];
  list.forEach(function (o) { const k = fn(o); if (!m[k]) { m[k] = []; keys.push(k); } m[k].push(o); });
  return keys.map(function (k) { return { k: k, list: m[k], a: agg_(m[k]) }; });
}

// writes a titled table at (row, 1); returns the next free row
function table_(sh, row, title, head, rows, fmts) {
  sh.getRange(row, 1).setValue(title).setFontWeight('bold').setFontSize(13);
  row += 1;
  sh.getRange(row, 1, 1, head.length).setValues([head]).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
  for (let c = 2; c <= head.length; c++) if (fmts[c - 1] !== '@') sh.getRange(row, c).setHorizontalAlignment('right');
  row += 1;
  if (rows.length) {
    head.forEach(function (_, c) {
      const col = sh.getRange(row, c + 1, rows.length, 1);
      col.setNumberFormat(fmts[c] || '@');
      if (c > 0 && fmts[c] !== '@') col.setHorizontalAlignment('right');
    });
    sh.getRange(row, 1, rows.length, head.length).setValues(rows.map(function (r) { return r.map(function (v) { return typeof v === 'number' ? v : String(v); }); }));
    sh.getRange(row, 1, rows.length, head.length).setBorder(false, false, true, false, false, true, '#dddddd', SpreadsheetApp.BorderStyle.SOLID);
    row += rows.length;
  } else {
    sh.getRange(row, 1).setValue('Nothing yet').setFontColor('#666666');
    row += 1;
  }
  return row + 1;
}
function freshSheet_(name, widths) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  sh.clear();
  sh.setHiddenGridlines(true);
  widths.forEach(function (w, i) { sh.setColumnWidth(i + 1, w); });
  return sh;
}
function stamp_(sh, title, cols) {
  sh.getRange(1, 1).setValue(title).setFontWeight('bold').setFontSize(18);
  sh.getRange(2, 1).setValue('Updated ' + Utilities.formatDate(new Date(), SHOP_TZ, 'MMM d, yyyy h:mm a') + '. This tab is rebuilt automatically from the Orders tab, do not type in it.').setFontColor('#666666');
}

// Keeps the Orders tab easy to read: sorted by pickup day and time, sensible widths, a status dropdown,
// and colors: to confirm (yellow), picked up (grey), cancelled (grey, struck through).
function tidyOrders_() {
  const sh = sheet_(), n = sh.getLastRow() - 1;
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold').setBackground('#000000').setFontColor('#ffffff');
  if (n > 1) sh.getRange(2, 1, n, COLS.length).sort([{ column: COLS.indexOf('date') + 1, ascending: true }, { column: COLS.indexOf('time') + 1, ascending: true }]);
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('ORDERS_STYLED') === '3') return;
  const widths = { id: 100, date: 90, time: 60, name: 150, phone: 120, items: 160, note: 240, paid: 60, status: 90, sample: 60, source: 70, seen: 50, optin: 60, ready: 130 };
  COLS.forEach(function (c, i) { sh.setColumnWidth(i + 1, widths[c] || 90); });
  const L = function (c) { return String.fromCharCode(65 + COLS.indexOf(c)); };
  const all = sh.getRange('A2:' + L(COLS[COLS.length - 1]) + '2000');
  const statusCol = sh.getRange(L('status') + '2:' + L('status') + '2000');
  statusCol.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['pending', 'new', 'picked', 'cancelled'], true).setAllowInvalid(false).build());
  sh.getRange(L('paid') + '2:' + L('paid') + '2000').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['none', 'paid'], true).setAllowInvalid(true).build());
  const f = function (v) { return '=$' + L('status') + '2="' + v + '"'; };
  sh.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f('cancelled')).setFontColor('#9a9a9a').setStrikethrough(true).setBackground('#f3f3f3').setRanges([all]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f('pending')).setBackground('#fff4c2').setRanges([all]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(f('picked')).setFontColor('#8a8a8a').setRanges([all]).build()
  ]);
  p.setProperty('ORDERS_STYLED', '3');
}
// Baklava Story > Tidy the Orders tab: also cleans up old phone numbers into one format.
function menuTidyOrders() {
  const sh = sheet_(), n = sh.getLastRow() - 1, c = COLS.indexOf('phone') + 1;
  if (n > 0) {
    const rng = sh.getRange(2, c, n, 1), v = rng.getDisplayValues();
    rng.setNumberFormat('@').setValues(v.map(function (x) { return [phoneOk_(x[0]) ? fmtPhone_(x[0]) : x[0]]; }));
  }
  PropertiesService.getScriptProperties().deleteProperty('ORDERS_STYLED');
  rebuild_();
  SpreadsheetApp.getUi().alert('Orders tab tidied: sorted by pickup day, phone numbers cleaned up, colors and dropdowns set.');
}

function rebuild_() {
  const all = loadOrders_();
  const now = shopNow_();
  tidyOrders_();

  // ---- Summary
  let sh = freshSheet_('Summary', [210, 90, 90, 100, 110]);
  stamp_(sh, 'Baklava Story, summary');
  const tot = agg_(all);
  const byCust = groupBy_(all, function (o) { const d = String(o.phone).replace(/\D/g, ''); return d.length >= 7 ? d : o.name.trim().toLowerCase(); });
  const online = all.filter(function (o) { return o.source === 'web'; }).length;
  const totals = [
    ['Orders', tot.n], ['Pieces', tot.pcs], ['Booked', tot.rev], ['Average order', tot.n ? Math.round(tot.rev / tot.n) : 0],
    ['Customers', byCust.length], ['Customers who came back', byCust.filter(function (c) { return c.a.n > 1; }).length],
    ['Picked up', all.filter(function (o) { return o.status === 'picked'; }).length],
    ['Online orders', online], ['Orders by hand', all.length - online]
  ];
  let row = table_(sh, 4, 'All orders', ['', 'Total'], totals, ['@', '#,##0']);
  sh.getRange(8, 2).setNumberFormat('$#,##0'); sh.getRange(9, 2).setNumberFormat('$#,##0');
  const months = groupBy_(all, function (o) { return o.date.slice(0, 7); }).sort(function (a, b) { return a.k < b.k ? 1 : -1; }).map(function (g) {
    const p = g.k.split('-');
    return [MONTHS[+p[1] - 1] + ' ' + p[0] + (g.k === now.date.slice(0, 7) ? ' (this month)' : ''), g.a.n, g.a.pcs, g.a.rev];
  });
  row = table_(sh, row, 'By month', ['Month', 'Orders', 'Pieces', 'Booked'], months, ['@', '#,##0', '#,##0', '$#,##0']);
  const thisWeek = mondayOfYmd_(now.date);
  const weeks = groupBy_(all, function (o) { return mondayOfYmd_(o.date); }).sort(function (a, b) { return a.k < b.k ? 1 : -1; }).map(function (g) {
    return [shortDate_(g.k) + ' to ' + shortDate_(addDaysYmd_(g.k, 5)) + (g.k === thisWeek ? ' (this week)' : ''), g.a.n, g.a.pcs, g.a.rev];
  });
  row = table_(sh, row, 'By week, Monday to Saturday', ['Week', 'Orders', 'Pieces', 'Booked'], weeks, ['@', '#,##0', '#,##0', '$#,##0']);
  sh.getRange(row, 1).setValue('Booked uses the current prices in the Products tab.').setFontColor('#666666');

  // ---- Breakdown
  sh = freshSheet_('Breakdown', [210, 90, 90, 100]);
  stamp_(sh, 'Baklava Story, breakdown');
  const pr = {};
  all.forEach(function (o) {
    o.items.forEach(function (i) {
      const p = prodOf_(i.code);
      const f = pr[i.code] = pr[i.code] || { name: p.name, t: 0, pcs: 0, rev: 0 };
      f.t += i.qty; f.pcs += i.qty * p.pieces; f.rev += i.qty * p.price;
    });
  });
  const pRows = Object.keys(pr).sort(function (a, b) { return pr[b].pcs - pr[a].pcs; }).map(function (k) { return [pr[k].name, pr[k].t, pr[k].pcs, pr[k].rev]; });
  const dRows = groupBy_(all, function (o) { return (dayOfWeek_(o.date) + 6) % 7; }).sort(function (a, b) { return a.k - b.k; }).map(function (g) { return [WEEKDAYS[g.k], g.a.n, g.a.pcs, g.a.rev]; });
  row = table_(sh, 4, 'By product', ['Product', 'Sold', 'Pieces', 'Booked'], pRows, ['@', '#,##0', '#,##0', '$#,##0']);
  table_(sh, row, 'By weekday', ['Weekday', 'Orders', 'Pieces', 'Booked'], dRows, ['@', '#,##0', '#,##0', '$#,##0']);

  // ---- Customers
  sh = freshSheet_('Customers', [170, 120, 70, 70, 90, 100, 100]);
  stamp_(sh, 'Baklava Story, customers');
  const cRows = byCust.slice().sort(function (a, b) { return b.a.n - a.a.n || b.a.rev - a.a.rev; }).map(function (c) {
    const dates = c.list.map(function (o) { return o.date; }).sort();
    return [c.list[0].name, c.list[0].phone, c.a.n, c.a.pcs, c.a.rev, dates[0], dates[dates.length - 1]];
  });
  table_(sh, 4, 'Everyone who ordered, most orders first', ['Name', 'Phone', 'Orders', 'Pieces', 'Booked', 'First order', 'Last order'], cRows, ['@', '@', '#,##0', '#,##0', '$#,##0', '@', '@']);

  SpreadsheetApp.getActive().setActiveSheet(sheet_());
}
// Saving an order should be fast. The Orders tab is sorted on every change (cheap); the three report tabs
// rebuild at most once a minute, and otherwise when the Sheet is opened or the 10 minute timer runs.
function safeRebuild_() {
  try {
    tidyOrders_();
    const c = CacheService.getScriptCache();
    if (c.get('rebuiltRecently')) { c.put('reportsDirty', '1', 21600); return; }
    rebuild_();
    c.put('rebuiltRecently', '1', 60); c.remove('reportsDirty');
  } catch (e) { /* the order is saved, the report tabs catch up on the next change */ }
}
function rebuildIfDirty_() {
  const c = CacheService.getScriptCache();
  if (!c.get('reportsDirty')) return;
  try { rebuild_(); c.remove('reportsDirty'); c.put('rebuiltRecently', '1', 60); } catch (e) { }
}

function doGet(e) {
  testGuard_();
  if (e.parameter.action === 'slots') return out_(slots_());
  if (e.parameter.action === 'products') {
    // The order page asks without a token and only sees what is on sale. Staff see everything.
    const all = readProducts_(), who = checkSession_(e.parameter.token);
    if (!who) return out_({ products: all.filter(function (p) { return p.on && !p.gone; }) });
    const role = roleOf_(who);
    // Staff never receive prices, so revenue cannot be worked out on their screen.
    return out_({ role: role, products: role === 'staff' ? all.map(function (p) { const q = Object.assign({}, p); q.price = 0; return q; }) : all });
  }
  if (e.parameter.action === 'image') return out_({ data: readImage_(e.parameter.id) });
  const who = checkSession_(e.parameter.token);
  if (!who) return out_({ error: SIGN_IN });
  if (e.parameter.action === 'notes') return out_({ notes: readNotes_() });
  if (e.parameter.action === 'partners' || e.parameter.action === 'invoice') {
    if (roleOf_(who) === 'staff') return out_({ error: 'Only the owner can see partners.' });
    if (e.parameter.action === 'partners') return out_(partnersData_());
    const html = invoiceHtml_(String(e.parameter.id || ''));
    return out_(html ? { html: html } : { error: 'Invoice not found.' });
  }
  if (e.parameter.action === 'team') {
    if (roleOf_(who) === 'staff') return out_({ error: 'Only the owner can see the team.' });
    if (isDemo_(who)) return out_({ error: 'Make this login yours first.' });
    return out_(teamData_(who));
  }
  return out_({ rows: read_(), closed: readClosed_(), role: roleOf_(who), demo: isDemo_(who) });
}
function doPost(e) {
  testGuard_();
  const b = JSON.parse(e.postData.contents);
  if (b.action === 'intake') return out_(intake_(b));
  if (b.action === 'login') return out_(login_(b));
  if (b.action === 'signup') return out_(signup_(b));
  if (b.action === 'logout') { endSession_(b.session); return out_({ ok: true }); }
  const who = checkSession_(b.token);
  if (!who) return out_({ error: SIGN_IN });
  if (b.action === 'claim') return out_(claim_(who, b));
  if (/^(setJoin|removeUser|resetPassword)$/.test(b.action)) {
    if (roleOf_(who) === 'staff') return out_({ error: 'Only the owner can change the team.' });
    if (isDemo_(who)) return out_({ error: 'Make this login yours first.' });
    const tl = LockService.getScriptLock(); tl.waitLock(10000);
    try { return out_(teamAction_(who, b)); } finally { tl.releaseLock(); }
  }
  if ((b.action === 'saveProducts' || b.action === 'saveImage') && roleOf_(who) === 'staff') return out_({ error: 'Only the owner can change products.' });
  if (/^(savePartner|savePartnerOrder|partnerPaid|deletePartnerOrder|emailInvoice)$/.test(b.action)) {
    if (roleOf_(who) === 'staff') return out_({ error: 'Only the owner can change partners.' });
    if (b.action === 'emailInvoice') {
      try { return out_(emailInvoice_(String(b.id))); } catch (err) {
        const m = String(err.message || err);
        if (/permission/i.test(m)) return out_({ error: 'Email is not switched on yet. In the Apps Script editor, run refreshReports once and allow Gmail, then try again.' });
        return out_({ error: 'Email did not send: ' + m.slice(0, 200) });
      }
    }
    const pl = LockService.getScriptLock(); pl.waitLock(10000);
    try {
      if (b.action === 'savePartner') return out_(savePartner_(b.partner));
      if (b.action === 'savePartnerOrder') return out_(savePartnerOrder_(b.order || {}));
      if (b.action === 'partnerPaid') return out_(setPartnerPaid_(String(b.id), b.paid === true));
      return out_(deletePartnerOrder_(String(b.id)));
    } finally { pl.releaseLock(); }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    if (b.action === 'upsert') {
      let r = findRow_(sh, b.row.id);
      // The dashboard does not send optin. Keep what the customer chose, and record staff consent when they tick "send a text".
      if (b.row.optin == null) b.row.optin = r > 0 ? String(sh.getRange(r, COLS.indexOf('optin') + 1).getValue()) : '';
      if (b.text === true) b.row.optin = 'yes';
      if (b.row.ready == null) b.row.ready = r > 0 ? String(sh.getRange(r, COLS.indexOf('ready') + 1).getValue()) : '';
      // Editing an order never changes whether it was picked up, cancelled or marked ready: those have their own
      // actions. This stops a screen that was a few seconds behind from undoing a pickup another screen just made.
      if (r > 0) {
        const cur = sh.getRange(r, 1, 1, COLS.length).getDisplayValues()[0];
        b.row.status = cur[COLS.indexOf('status')] || b.row.status;
        b.row.ready = cur[COLS.indexOf('ready')];
        if (cur[COLS.indexOf('source')] === 'partner') return out_({ error: 'Edit partner orders from the Partners tab.' });
      }
      const vals = COLS.map(function (c) { return b.row[c] == null ? '' : String(b.row[c]); });
      if (r < 0) r = sh.getLastRow() + 1;
      const rng = sh.getRange(r, 1, 1, COLS.length);
      rng.setNumberFormat('@');
      rng.setValues([vals]);
      safeRebuild_();
      if (b.text === true && usOk_(b.row.phone)) notify_(b.row, 'staff');
    } else if (b.action === 'patch') {
      // Change single fields of an order without touching the rest of the row.
      const r = findRow_(sh, b.id), allowed = { paid: ['none', 'paid'] };
      if (r < 1) return out_({ error: 'Order not found.' });
      Object.keys(b.fields || {}).forEach(function (k) {
        if (allowed[k] && allowed[k].indexOf(String(b.fields[k])) >= 0) sh.getRange(r, COLS.indexOf(k) + 1).setValue(String(b.fields[k]));
      });
      if (/^po/.test(String(b.id)) && b.fields && b.fields.paid) setPartnerPaid_(String(b.id).slice(2), b.fields.paid === 'paid');
      safeRebuild_();
    } else if (b.action === 'status') {
      if (['pending', 'new', 'picked', 'cancelled'].indexOf(b.status) < 0) return out_({ error: 'Unknown status.' });
      const r = findRow_(sh, b.id);
      if (r > 0) sh.getRange(r, COLS.indexOf('status') + 1).setValue(b.status);
      if (b.status === 'cancelled' && /^po/.test(String(b.id))) deletePartnerOrder_(String(b.id).slice(2));
      safeRebuild_();
    } else if (b.action === 'seen') {
      (b.ids || []).forEach(function (id) {
        const r = findRow_(sh, id);
        if (r > 0) sh.getRange(r, COLS.indexOf('seen') + 1).setValue('yes');
      });
    } else if (b.action === 'delete') {
      // Older dashboards call this to cancel. Keep the row and mark it cancelled instead of erasing it.
      const r = findRow_(sh, b.id);
      if (r > 0) sh.getRange(r, COLS.indexOf('status') + 1).setValue('cancelled');
      safeRebuild_();
    } else if (b.action === 'confirm') {
      const r = findRow_(sh, b.id);
      if (r > 0) {
        const vals = sh.getRange(r, 1, 1, COLS.length).getDisplayValues()[0];
        const row = {};
        COLS.forEach(function (c, i) { row[c] = norm_(vals[i], c); });
        if (row.status === 'pending') {
          sh.getRange(r, COLS.indexOf('status') + 1).setValue('new');
          row.status = 'new';
          safeRebuild_();
          if (row.optin === 'yes' && usOk_(row.phone)) notify_(row, 'confirmed');
        }
      }
    } else if (b.action === 'ready') {
      // Staff marked the order ready. Text the customer once, only if they opted in.
      const r = findRow_(sh, b.id);
      if (r > 0) {
        const cell = sh.getRange(r, COLS.indexOf('ready') + 1);
        if (b.ready === false) cell.setValue('');
        else if (!String(cell.getValue())) {
          cell.setValue(Utilities.formatDate(new Date(), SHOP_TZ, 'yyyy-MM-dd HH:mm'));
          const vals = sh.getRange(r, 1, 1, COLS.length).getDisplayValues()[0], row = {};
          COLS.forEach(function (c, i) { row[c] = norm_(vals[i], c); });
          if (row.optin === 'yes' && usOk_(row.phone)) notify_(row, 'ready');
        }
      }
    } else if (b.action === 'closeDay') {
      if (!setClosed_(b.date, b.closed === true)) return out_({ error: 'bad date' });
    } else if (b.action === 'saveNote') {
      if (!saveNote_(b.key, b.note)) return out_({ error: 'bad note' });
    } else if (b.action === 'saveImage') {
      const id = saveImage_(b.data);
      if (!id) return out_({ error: 'That photo is too large. Try a smaller picture.' });
      return out_({ ok: true, id: id });
    } else if (b.action === 'saveProducts') {
      const list = cleanProducts_(b.products);
      if (!list) return out_({ error: 'Check the product list: every product needs a name, a price and a piece count.' });
      writeProducts_(list);
      PM_ = null;
      safeRebuild_();
    } else {
      return out_({ error: 'unknown action' });
    }
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
