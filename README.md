# Baklava Story order system, Version 2 (TEST COPY)

Version 2 is a **test copy** of the live system, made by Studio 1801 on Nov 18, 2026.
It starts from Kevin's Version 1 snapshot (`baklava-story-v1.zip`, taken Nov 18, 2026)
and is wired to a **separate test Google Sheet**, so nothing done here can reach
Tolgay's live orders.

- **Live (Tolgay uses this, do not touch):** Sheet "Baklava Story Orders",
  baklava-story.vercel.app, baklava-story-orders.vercel.app
- **Test (this copy):** Sheet "Baklava Story – TEST (Studio 1801 testing only)"
  in Aldo's Google Drive, plus the test sites deployed from this repo

When a change is tested and approved here, it gets copied to the live system by hand.

---

## What changed in v2 (latest first)

### v2.0.1 — Nov 19, 2026: connected to the test backend
- The TEST Sheet's script is now online as a web app. Its address is filled
  into `order-page/config.js` and `dashboard/config.js`.
- Checked: the test backend answers and returns the six trays from the TEST Sheet.
- Texts are in test mode (`TEXT_MODE` = `test` in Script Properties), so no
  real texts are sent.

### v2.0 — Nov 18, 2026: test copy set up
- **Points at the test backend, not the live one.** The live backend address was
  removed from `order-page/index.html` and `dashboard/j1.js`. Both now read the
  address from a new `config.js` file in their folder.
- **New `config.js` in `order-page/` and `dashboard/`.** It holds the test backend
  address. If the address is empty, or is ever set to Tolgay's live one, the site
  shows a red bar and refuses to connect.
- **Orange "TEST COPY" bar** at the top of both sites, so nobody mistakes them
  for the real thing.
- **Guard in `backend/Code.gs`.** If the script is ever pasted into Tolgay's live
  Sheet, it stops itself. The Sheet menu is renamed "Baklava Story (TEST)".
- No other code was changed. Everything else is exactly Version 1.

Add new entries above this line when you change something (v2.1, v2.2, ...).

---

## What is in here

- `order-page/`  The customer order page. One static HTML file, no login.
  `privacy/` and `terms/` are linked from the text opt-in. `optin.svg` is the
  opt-in image. `config.js` is the test backend address (new in v2).
- `dashboard/`  The staff dashboard. Static files with a login. Plain JavaScript,
  no build step. `config.js` is the test backend address (new in v2).
- `backend/Code.gs`  The Apps Script backend. In the test setup it lives inside
  the TEST Sheet under Extensions > Apps Script.

## How it fits together

The order page and the dashboard both call one Apps Script web app (the address
in `config.js`). That script reads and writes the tabs of the Sheet it is
attached to. There is no other server.

## Setting up the test backend (one time)

1. Open the TEST Sheet ("Baklava Story – TEST (Studio 1801 testing only)").
2. Extensions > Apps Script. Delete what is in `Code.gs`, paste all of
   `backend/Code.gs` from this repo, and Save.
3. Project Settings (gear icon) > Script Properties > add `TEXT_MODE` = `test`.
   This keeps texts from going to anyone. Do **not** add `TELNYX_KEY`.
4. Deploy > **New deployment** > type: Web app. Execute as: Me. Who has access:
   Anyone. Deploy, allow the permissions, and copy the web app URL (ends in `/exec`).
   (New deployment is right here because this is the first one for the TEST Sheet.
   After this, always use Manage deployments > edit > New version, so the URL stays the same.)
5. Paste that URL into `order-page/config.js` and `dashboard/config.js`.
6. Back in the Sheet, reload it. Use the menu "Baklava Story (TEST)" >
   "Add or reset a login" to make your own test login. The missing tabs
   (Products, Messages, Users and so on) are created by the script on first use.

## Deploying the test sites

Both sites are static, with no build step. On Vercel (Aldo's personal account,
**not** the studio1801 team), make two projects from this repo:

- Test order page: framework Other, no build command, root directory `order-page`
- Test dashboard: framework Other, no build command, root directory `dashboard`

## Dashboard file order (read this before editing)

The dashboard is layered on purpose. `index.html` loads `s.css` and `x.css`, then
`config.js`, then `j1.js` to `j4.js`, then the patch files `x.js`, `y.js`, `z.js`,
`z2.js` to `z16.js`, and `j5.js` last. Later files override earlier code. The
comment at the top of each file says what it changes. Do not reorder the script
tags. For a new change, add a new z file (next is `z17.js`) and load it before
`j5.js`, or edit the file that already owns that feature.

Some values live in more than one place. The dashboard keeps its own `SLOT_CAP`
and `DAY_CAP` in `j1.js`, and `Code.gs` has the real ones, so change both. The
menu, address and pickup times are set in `Code.gs`, in the order page, and in
`dashboard/z16.js`.

## Not in this repo

No keys or passwords. Logins are salted hashes in the Users tab of the TEST Sheet.
The test Sheet has its own logins, separate from Tolgay's.

## Reference

`Baklava_Story_Developer_Handoff.pdf` (from Kevin) has the long version: tabs,
API actions, business rules and gotchas.
