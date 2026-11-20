# Baklava Story order system, Version 2.3 (TEST COPY)

Version 2 is a **test copy** of the live system, made by Studio 1801 on Nov 18, 2026.
It starts from Kevin's Version 1 snapshot (`baklava-story-v1.zip`, taken Nov 18, 2026)
and is wired to a **separate test Google Sheet**, so nothing done here can reach
Tolgay's live orders.

- **Live (Tolgay uses this, do not touch):** Sheet "Baklava Story Orders",
  baklava-story.vercel.app, baklava-story-orders.vercel.app
- **Test (this copy):** Sheet "Baklava Story TEST (Studio 1801 testing only)"
  in Aldo's Google Drive, plus the test sites deployed from this repo

When a change is tested and approved here, it gets copied to the live system by hand.

---

## What changed in v2 (latest first)

### v2.3, Nov 21, 2026: rewards changed from the dashboard, special treats
- **Card settings (owner only).** Layer Card tab, "Card settings": the program's name,
  how many visits fill a card (3 to 20), up to 5 rewards each on its own layer, whether
  the "ready" text mentions the layer, and a switch to pause the program. Saved in the
  backend (`cardSettings` action, Script Properties), used at once by every card, the
  texts and the order page. Before: only by typing JSON into Script Properties.
- **Order page panel follows the settings** (new public `card` action: program name,
  size and rewards only, never customer data). Hidden when the program is paused.
- **Special treat.** On any card: give one customer a one-off gift with a note
  (birthday, sorry for the wait). Kept on the card, does not change the layers
  (`treat` action, kind "treat" in the Rewards tab).
- **History on each card**: the latest 8 entries, newest first: layers added by hand or at
  the counter, layers taken back, rewards given, treats, and the count of picked-up orders.
- Files: `backend/Code.gs` (publish a New version), new `dashboard/z19.js`,
  `dashboard/index.html`, `order-page/index.html`.

### v2.2, Nov 21, 2026: The Layer Card, Counter, bake list
A concept to show Tolgay, built so he can try it for real on the test copy.

**The Layer Card (loyalty, replaces the v2.1 stamp card).** Baklava is made of
layers, so every visit adds one layer to the customer's card, found by phone number.
- Picked-up orders count by themselves. Counter sales with a phone number count.
  Staff can add a layer by hand, and undo one added by mistake the same day.
- One layer per visit, not per item, so the cost stays predictable.
- Rewards on every card of 10: layer 5 "A Turkish coffee on us" (brings tray
  customers to the coffee), layer 10 "A small tray on us". Then the card starts
  again; rewards wait on the card until given.
- The "ready" text tells the customer where they are, for example "Picking up adds
  layer 4 of 10 to your Baklava Story card."
- Settings in Script Properties: `CARD_SIZE`, `CARD_REWARDS` (JSON), `CARD_NAME`,
  `CARD_IN_TEXTS` = `off` to leave the line out of texts.
- Dashboard tab "Layer Card": every card as 10 layers, rewards ready with
  "Give it now" (tap twice), "+1 layer", "Undo a layer added today", search.
- Order page: a "The Layer Card" panel explains it to customers, and the confirmation
  says the pickup adds a layer.

**Counter (coffee without online ordering).** Dashboard tab "Counter": tap the items,
take payment in Square as usual, save. With a phone number the sale adds a layer and
shows the customer's card, including a reward that is ready. Shows today's sales,
drinks and total. The menu is the new "Counter menu" tab in the Sheet (placeholder
prices: Turkish coffee $4.50, espresso $3.50, cappuccino $5, latte $5.50, iced latte
$6, Turkish tea $3, baklava 2 pieces $6). Sales go to the new "Counter" tab.

**Week board:** a "Reward ready" tag on the order of a customer with a reward waiting,
so it is given at pickup.

**Bake list:** counts confirmed orders only. Orders waiting to be confirmed are listed
apart, so the kitchen never bakes for an unconfirmed (possibly fake) order. "105 x 1
pieces" now reads "105 ordered".

**Order page:** "Open Monday to Saturday, 9:30 am to 6 pm. Last pickup 5:45 pm."
(6 pm is closing time.)

**Fixes:** 0 layers is refused (before, 0 became 1). A card shows the name from the
customer's latest order.

Files: `backend/Code.gs` (publish a New version), new `dashboard/z18.js`,
`dashboard/z17.js` (old Rewards screen removed), `dashboard/index.html`,
`order-page/index.html`. Test Sheet renamed "Baklava Story TEST (Studio 1801
testing only)".

### v2.1, Nov 19, 2026: fixes from testing, Tolgay's answers, Rewards
Backend (`backend/Code.gs`, paste it and publish a **New version**):
- **Fixed: confirmation text said the wrong pickup day.** Before: an order for
  Thursday Nov 19 was texted as "Wednesday, November 18" when the script's time
  zone was not San Francisco. After: the day is always worked out in San Francisco
  time (new `shopDay_`). Partner invoice dates had the same bug and are fixed too.
- **Full address.** Before: "1830 Harrison St, Ste B". After: "1830 Harrison St,
  Ste B, San Francisco, CA 94103" (Tolgay's answer, Nov 18). Also in
  `order-page/index.html` (2 places) and `dashboard/z16.js`.
- **Price at the time of the order.** New last column `prices` in the Orders tab.
  Before: changing a price changed the "Booked" total of past orders. After: each
  order keeps the prices it was made at. Older orders without it still use today's price.
- **Reports skip orders waiting to be confirmed.** Before: unconfirmed (possibly
  fake) orders counted as booked sales. After: Summary, Breakdown and Customers
  count confirmed orders only.
- **Spam limits per phone number.** Before: one person could fill a whole day with
  fake orders, or use up the shop-wide 40 orders an hour. After: max 3 orders
  waiting to be confirmed per phone number, and max 5 online orders an hour per
  phone number (`MAX_PENDING_PER_PHONE`, `PHONE_PER_HOUR`).
- **Quantity check.** Before: 0 became 1 and 401 became 99 without telling anyone.
  After: each line must be 1 to 20, the same as the order page.
- **Short codes when the Products tab is new.** Before: blank, so the dashboard
  invented codes like "mxl". After: sp, sw, mp, mw, lp, lw.
- **New: Rewards** (`stamp`, `redeem`, `rewards` actions, new `Rewards` tab).
  Every picked-up order is 1 stamp. Staff add stamps by hand (for a coffee at the
  counter). At 10 stamps the reward can be given and the card starts again. Goal and
  reward wording can be changed in Script Properties: `REWARD_GOAL`, `REWARD_TEXT`.

Order page (`order-page/index.html`):
- **Customers can call the shop.** Before: only "message us on Instagram". After:
  "Questions? Call or text us at (415) 766-7929" under the title, on the confirmation,
  and in the small print. Tapping it calls on a phone. (Google Voice number Tolgay gave.)
- Full address with zip on the page and the confirmation.

Dashboard (new `dashboard/z17.js`, plus small edits):
- **iPad held upright.** Before: the week board ran off the right edge. After: 3 days per row.
- **Partners tab hidden.** Tolgay keeps partner invoices in Square. The code stays.
- **"Add an item" list shows tray names.** Before: "1 pieces, $27.50 (sp)". After:
  "Small tray, Pistachio, $27.50".
- **History and the report** use the price at the time of the order and skip
  unconfirmed orders (same as the backend).
- **New Rewards tab**: add stamps by phone number, see every card, give the reward.
- `j1.js`: "The 1 order already booked stay" now reads "stays".

Still open with Tolgay: is 6:00 PM a pickup slot or closing time? (Last slot is 5:45 PM.)
What is the real reward? (Placeholder: "A free small tray or a free coffee" at 10 stamps.)

### v2.0.1, Nov 19, 2026: connected to the test backend
- The TEST Sheet's script is now online as a web app. Its address is filled
  into `order-page/config.js` and `dashboard/config.js`.
- Checked: the test backend answers and returns the six trays from the TEST Sheet.
- Texts are in test mode (`TEXT_MODE` = `test` in Script Properties), so no
  real texts are sent.

### v2.0, Nov 18, 2026: test copy set up
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

1. Open the TEST Sheet ("Baklava Story TEST (Studio 1801 testing only)").
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
`z2.js` to `z19.js`, and `j5.js` last. Later files override earlier code. The
comment at the top of each file says what it changes. Do not reorder the script
tags. For a new change, add a new z file (next is `z20.js`) and load it before
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
