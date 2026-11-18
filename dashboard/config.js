/* =====================================================================
   Baklava Story v2 — TEST COPY SETTINGS (Studio 1801 testing only)

   This file decides which backend (Google Sheet + Apps Script) this site
   talks to. It must ALWAYS point at the TEST Sheet's web app, never at
   Tolgay's live one.

   How to fill it in:
   1. Deploy the Apps Script inside the TEST Sheet as a web app.
   2. Copy the web app URL (ends in /exec).
   3. Paste it between the quotes below, in BOTH copies of this file:
      order-page/config.js and dashboard/config.js
   ===================================================================== */

window.BS_TEST_API_URL = ''; // <-- paste the TEST web app URL here

/* ---- Safety guard: do not edit below this line ---------------------- */
(function () {
  // Tolgay's LIVE backend id. If it ever shows up here, the site refuses to run.
  var LIVE_ID = 'AKfycbxeHxkeAwbmC9UAfxmoeCxMVRVslJM5TiMZM0VVAk_bc8EKy_iM7V81z8LPeTxQTr4';
  var url = String(window.BS_TEST_API_URL || '');
  var problem = '';
  if (url.indexOf(LIVE_ID) >= 0) problem = 'This test copy is pointed at Tolgay’s LIVE system. Stopped. Put the TEST web app URL in config.js.';
  else if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) problem = 'Not connected yet. Paste the TEST web app URL into config.js.';
  if (problem) window.BS_TEST_API_URL = 'about:blank#blocked';

  function bar() {
    var b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:sticky;top:0;z-index:99999;padding:8px 12px;font:600 13px/1.3 system-ui,sans-serif;text-align:center;color:#fff;background:' + (problem ? '#C62828' : '#E65100');
    b.textContent = problem ? 'TEST COPY — ' + problem : 'TEST COPY — Studio 1801 testing only. Not Tolgay’s live system.';
    document.body.insertBefore(b, document.body.firstChild);
  }
  if (document.body) bar(); else document.addEventListener('DOMContentLoaded', bar);
})();
