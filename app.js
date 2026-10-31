/* Magic Spot — app logic. Plain JS, no build step. Same architecture as Pour Decisions. */
(() => {
  "use strict";

  const SPOTS = window.SPOTS;
  const CITY = window.CITY;
  const byId = Object.fromEntries(SPOTS.map((s) => [s.id, s]));
  const $ = (s) => document.querySelector(s);

  // ── Storage (best effort: the app works without it) ──────────────────────
  const store = {
    get(k, fallback) {
      try { const v = localStorage.getItem("ms." + k); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(k, v) { try { localStorage.setItem("ms." + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  // ── Time, always in Miami ────────────────────────────────────────────────
  const WD = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const WEEK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const DAY_NAME = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CITY.tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  // ?now=2026-11-01T10:30 pins the clock to a Miami time, for previewing.
  const nowParam = new URLSearchParams(location.search).get("now");
  function cityNow() {
    let date, mins, pinned = false;
    if (nowParam && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(nowParam)) {
      const [d, t] = nowParam.split("T"); const [h, m] = t.split(":").map(Number);
      date = d; mins = h * 60 + m; pinned = true;
    } else {
      const p = Object.fromEntries(parts.formatToParts(new Date()).map((x) => [x.type, x.value]));
      date = `${p.year}-${p.month}-${p.day}`; mins = (+p.hour % 24) * 60 + +p.minute;
    }
    return { date, mins, pinned, wd: WD[new Date(date + "T12:00:00Z").getUTCDay()] };
  }
  const dayLabel = (date) => new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  function fmtTime(mins) {
    let h = Math.floor(mins / 60) % 24; const m = mins % 60;
    if (h === 0 && m === 0) return "midnight";
    const ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12;
    return m ? `${h}:${String(m).padStart(2, "0")}${ap}` : `${h}${ap}`;
  }
  const toMins = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

  // ── Hours ────────────────────────────────────────────────────────────────
  // Specs are "HH:MM-HH:MM" (closing after midnight is written 24:30, 25:00…) or "closed".
  const ranges = (spec) => (!spec || spec === "closed" ? [] : spec.split(",").map((r) => { const [o, c] = r.split("-"); return { o: toMins(o), c: toMins(c) }; }));
  const is247 = (s) => s.hours && WEEK.every((d) => s.hours[d] === "00:00-24:00");
  function hoursText(s, wd) {
    const spec = s.hours && s.hours[wd];
    if (!spec) return { text: "Not listed", cls: "unk" };
    if (spec === "closed") return { text: "Closed", cls: "closed" };
    return { text: ranges(spec).map((r) => (r.o === 0 && r.c >= 1440 ? "24 hours" : `${fmtTime(r.o)}–${fmtTime(r.c)}`)).join(", "), cls: "" };
  }
  function status(s, now) {
    if (!s.hours) return { cls: "unknown", text: "" };
    if (is247(s)) return { cls: "open", text: "Open 24 hours", open: true };
    const m = now.mins;
    // Still open from last night?
    const prev = WD[(WD.indexOf(now.wd) + 6) % 7];
    for (const r of ranges(s.hours[prev])) if (r.c > 1440 && m < r.c - 1440) return { cls: "open", text: `Open until ${fmtTime(r.c - 1440)}`, open: true };
    const spec = s.hours[now.wd];
    if (!spec) return { cls: "unknown", text: "" };
    if (spec === "closed") return { cls: "closed", text: "Closed today" };
    for (const r of ranges(spec)) {
      if (m >= r.o && m < r.c) {
        const left = r.c - m;
        if (left <= 45) return { cls: "soon", text: `Closes in ${left} min`, open: true };
        return { cls: "open", text: `Open until ${fmtTime(r.c)}`, open: true };
      }
      if (m < r.o) return { cls: "later", text: `Opens ${fmtTime(r.o)}` };
    }
    return { cls: "closed", text: "Closed now" };
  }

  // ── Distance ─────────────────────────────────────────────────────────────
  function meters(a, b) {
    const R = 6371000, t = Math.PI / 180;
    const x = (b.lng - a.lng) * t * Math.cos(((a.lat + b.lat) / 2) * t), y = (b.lat - a.lat) * t;
    return R * Math.hypot(x, y);
  }
  // Straight-line distance stretched for the street grid, at an easy 80 m a minute.
  const walkMins = (m) => Math.max(1, Math.round((m * 1.3) / 80));
  const WALK_LIMIT = 30; // beyond this, show miles: you'd drive, not walk
  const miles = (m) => (m * 1.25) / 1609.34; // road distance, roughly
  function distHtml(m) {
    const w = walkMins(m);
    if (w <= WALK_LIMIT) return `${walkSvg}${w} min`;
    const mi = miles(m);
    return `${carSvg}${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  const distWords = (m) => (walkMins(m) <= WALK_LIMIT ? `${walkMins(m)} min walk` : `${miles(m).toFixed(1)} mi`);

  // ── State ────────────────────────────────────────────────────────────────
  const saved = store.get("ui", {});
  const state = {
    tab: saved.tab === "tips" ? "tips" : "find",
    kinds: new Set(saved.kinds || []), // empty = everything
    dest: saved.dest || null,          // { name, sub, lat, lng }: where you're going
    sel: null,
    me: null,
    collapsed: false,
    driving: false,                     // Drive mode: phone in a car dock
    navApp: saved.navApp === "apple" ? "apple" : "google", // which app turn-by-turn hands off to
    driveTarget: null,                  // the car park you tapped Go on
    arrived: false,
    speed: 0,                           // metres a second, from location fixes
  };
  const saveUi = () => store.set("ui", { tab: state.tab, kinds: [...state.kinds], dest: state.dest, navApp: state.navApp });
  const inCity = () => state.me && meters(state.me, CITY.center) < 60000;
  // Distances are measured from where you're going, else from you, else from Downtown.
  const origin = () => state.dest || (inCity() ? state.me : CITY.center);
  const originWords = () => (state.dest ? `from ${state.dest.name}` : inCity() ? "from you" : "from Downtown");

  // One-shot animation cues, consumed by the next render.
  const fx = { list: true };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const anim = (ms) => (reducedMotion ? 0 : ms);
  const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  function enterRows(listEl) {
    if (!fx.list) return;
    [...listEl.children].slice(0, 12).forEach((li, i) => { li.style.setProperty("--n", i); li.classList.add("enter"); });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fold = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const walkSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13" cy="4.5" r="1.8"/><path d="m9 21 2.5-6.5L14 17v4M7 12.5l2.5-4.5 4 1.5 2.5 3.5M11.5 14.5 13 9"/></svg>';
  const carSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14v-4.5L17 7H7l-2 5.5z"/><path d="M5 17v2M19 17v2M5 12.5h14"/><circle cx="8" cy="15" r=".6"/><circle cx="16" cy="15" r=".6"/></svg>';
  const mapSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/></svg>';
  const pinSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  const KIND = {
    garage: { label: "Garage", glyph: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11"/><path d="M8 20v-7h8v7M8 16.5h8"/></svg>' },
    lot: { label: "Lot", glyph: "P" },
    ride: { label: "Park & ride", glyph: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 10h12M9 13.5h.01M15 13.5h.01M9 16l-2 4M15 16l2 4"/></svg>' },
  };
  const OPERATOR = {
    MPA: "Miami Parking Authority", County: "Miami-Dade County", "Miami Beach": "City of Miami Beach",
    Metrorail: "Miami-Dade Transit", "Park & Ride": "Miami-Dade Transit", Airport: "Miami-Dade Aviation",
    "County parks": "Miami-Dade Parks (MPA-managed)", "Coral Gables": "City of Coral Gables",
  };
  const isFree = (s) => !!s.free || /^free/i.test(s.rate || "") || /free/i.test(s.rate || "");
  const priceHtml = (s) => {
    if (s.only) return `<span class="row-price unk">${esc(s.only.split(":")[0])}</span>`;
    if (!s.rate) return `<span class="row-price unk">Rates not listed</span>`;
    return `<span class="row-price${/free/i.test(s.rate) ? " free" : ""}">${esc(s.rate)}</span>`;
  };
  const gmaps = (s) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.q);
  const gmapsDrive = (s) => "https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=" + encodeURIComponent(s.approx ? `${s.lat},${s.lng}` : s.q);
  const gmapsWalkTo = (s, d) => `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${s.lat},${s.lng}&destination=${d.lat},${d.lng}`;

  function matches(s) { return !state.kinds.size || state.kinds.has(s.kind); }

  // The one list row: kind dot and name · price · area and status · distance.
  function rowHtml(s, now) {
    const st = status(s, now);
    const sub = [esc(s.area)];
    if (s.only) sub.push('<span class="st st-only">Restricted</span>');
    else if (st.text) sub.push(`<span class="st st-${st.cls}">${esc(st.text)}</span>`);
    const d = meters(origin(), s);
    return `<li class="row k-${s.kind}${s.only ? " is-only" : ""}${state.sel === s.id ? " is-sel" : ""}" data-id="${s.id}">
      <button type="button" class="row-main" data-open="${s.id}">
        <span class="row-top"><i class="dot"></i><span class="row-name">${esc(s.name)}</span></span>
        ${priceHtml(s)}
        <span class="row-sub">${sub.join(" · ")}</span>
        <span class="row-walk" aria-label="${distWords(d)} ${esc(originWords())}">${distHtml(d)}</span>
      </button>
    </li>`;
  }

  // ── Brand row: only shows a time when previewing ─────────────────────────
  function renderClock(now) {
    const el = $("#clock");
    el.hidden = !now.pinned;
    if (now.pinned) el.innerHTML = `<span>Preview</span><span>${esc(dayLabel(now.date))}, ${fmtTime(now.mins)}</span>`;
  }

  // ── Find ─────────────────────────────────────────────────────────────────
  function renderFind(now) {
    document.querySelectorAll(".kinds .chip").forEach((b) => b.setAttribute("aria-pressed", String(state.kinds.has(b.dataset.kind))));
    const o = origin();
    const all = SPOTS.filter(matches).map((s) => ({ s, d: meters(o, s) })).sort((a, b) => a.d - b.d);
    const usable = all.filter((x) => !x.s.only), only = all.filter((x) => x.s.only);
    $("#list").innerHTML = usable.map(({ s }) => rowHtml(s, now)).join("");
    enterRows($("#list"));
    $("#list-empty").hidden = all.length > 0;
    $("#only-wrap").innerHTML = only.length ? `<h3 class="subhead">Permit or residents only</h3>
      <ol class="list">${only.map(({ s }) => rowHtml(s, now)).join("")}</ol>` : "";

    const dest = $("#dest");
    if (state.dest) {
      // Say so plainly when nothing in the list is within an easy walk.
      const nearest = usable[0] && walkMins(usable[0].d);
      dest.innerHTML = `<p class="dest">${pinSvg}<span>Parking near</span><b>${esc(state.dest.name)}</b>
        <button type="button" class="link" id="dest-clear">Clear</button></p>
        ${nearest > 20 ? `<p class="hint">Nothing in this list is within a 20-minute walk. The nearest is ${nearest > WALK_LIMIT ? distWords(usable[0].d) : `${nearest} min`} away; there may be private garages closer.</p>` : ""}`;
    } else if (inCity()) {
      dest.innerHTML = `<p class="hint">Nearest to you. Type where you're going to sort by walking time from there.</p>`;
    } else {
      dest.innerHTML = `<p class="hint">Type where you're going to sort by walking time from there, or <button type="button" class="link" id="btn-locprompt">use my location</button>.</p>`;
    }
  }

  // ── Tips (the parts of the parking list that aren't places) ──────────────
  function renderTips() {
    const el = $("#tips");
    if (el.children.length) return;
    el.innerHTML = `<div class="tips">
      <section class="tip"><h2>Free parking at a glance</h2>
        <p>There's very little completely free, unrestricted car parking in central Miami. The genuinely free government options:</p>
        <div class="card"><ul class="free-list">
          <li><b>Metrobus Park &amp; Ride lots</b><span>Most are free; you're parking to ride the bus. Open 5am–10pm, no overnight.</span></li>
          <li><b>5th &amp; Alton Garage, Miami Beach</b><span>First 2 hours free with a retail receipt or validation.</span></li>
          <li><b>County garages: jurors and disabled parkers</b><span>No charge at Hickman, Cultural Center, West Lot and Overtown Transit Village, subject to availability.</span></li>
          <li><b>County garages: Board meetings</b><span>First 2 hours free for county residents attending a Board of County Commissioners meeting.</span></li>
          <li><b>County garages: 15-minute grace period</b><span>Cultural Center, West Lot, Garage 5 and Overtown Transit Village.</span></li>
          <li><b>Metromover</b><span>The ride is free: park cheaply at a Metrorail or county garage and ride around Downtown and Brickell.</span></li>
          <li><b>Hurricane / flood parking</b><span>City of Miami residents who enrol in advance; only during an activated watch or flood event.</span></li>
          <li><b>Miami Beach flood / king-tide openings</b><span>Free for Miami Beach residents when announced; non-residents pay. Convention Center, 5th &amp; Alton and City Hall garages are usually excluded.</span></li>
          <li><b>Amelia Earhart Park, Hialeah</b><span>Reported free on weekdays, $4 at weekends. Unverified: check on arrival.</span></li>
          <li><b>Coral Gables meters</b><span>Reported free on Sundays and select holidays. Check the meter.</span></li>
        </ul></div></section>

      <section class="tip"><h2>Cheapest options that actually work</h2>
        <ul>
          <li><b>Downtown for a full day:</b> a county garage ($15 for 2.5–12 hours), or a Metrorail station ($4.50 a day) plus a train ride, then the free Metromover.</li>
          <li><b>South Beach:</b> city garages are $3 an hour with a $22 daily cap (42nd Street: $2, $16 cap). Street meters there are $4 an hour.</li>
          <li><b>The airport:</b> MIA Economy Park-and-Ride, $12 a day with a free shuttle, instead of the terminal garages.</li>
          <li><b>Staying a month:</b> a county monthly pass ($74.90), a Miami Beach resident monthly ($70 + tax) or an MPA monthly lot.</li>
        </ul></section>

      <section class="tip"><h2>Street meters</h2>
        <p><b>City of Miami:</b> pay with PayByPhone or ParkMobile using the zone number on the sign. Roughly $0.75–$1.50 an hour in central areas. For more than a couple of hours, a downtown garage is usually better value.</p>
        <p><b>Miami Beach</b> zones:</p>
        <div class="card tbl-wrap"><table class="tbl">
          <thead><tr><th>Zone</th><th>Street</th><th>Lots</th><th>Resident</th><th>Enforced</th></tr></thead>
          <tbody>
            <tr><td>Entertainment District</td><td>$4/hr</td><td>$2/hr</td><td>$1/hr</td><td>24 hours</td></tr>
            <tr><td>South Beach</td><td>$4/hr</td><td>$2/hr</td><td>$1/hr</td><td>9am–3am</td></tr>
            <tr><td>East Middle Beach</td><td>$3/hr</td><td>$2/hr</td><td>$1/hr</td><td>9am–3am</td></tr>
            <tr><td>West Middle Beach</td><td>$1/hr</td><td>$1/hr</td><td>–</td><td>8am–6pm</td></tr>
            <tr><td>North Beach (north of 63rd)</td><td>$1/hr</td><td>$1/hr</td><td>–</td><td>8am–11pm</td></tr>
          </tbody></table></div>
        <p>Entertainment District: Ocean Dr to Pennsylvania Ave, 5th to 15th St. South Beach: south of 23rd St. Time limits vary by bay, so read the sign.</p>
      </section>

      <section class="tip"><h2>How to pay</h2>
        <ul>
          <li><b>City of Miami (MPA):</b> PayByPhone or ParkMobile, by the zone number on the sign.</li>
          <li><b>Miami-Dade County garages:</b> pay at the facility.</li>
          <li><b>Miami Beach:</b> ParkMobile or PayByPhone. Registered residents get $1 an hour and no app fees.</li>
          <li><b>Metrorail:</b> the ticket machine ($4.50 a day) or PayByPhone ($4.85). You have to actually ride transit.</li>
        </ul></section>

      <section class="tip"><h2>Watch for</h2>
        <ul>
          <li>Event rates at loanDepot Park, the Arsht Center and in the Art Deco District.</li>
          <li>Low clearances: Knight Center Garage is 6'2".</li>
          <li>Two different "Courthouse Center" garages: the MPA's at 40 NW 3rd St is public; the County's at 175 NW 1st Ave is monthly only.</li>
        </ul></section>

      <section class="tip"><h2>Not on the map</h2>
        <p>The Miami Parking Authority runs about 60 more numbered lots (Lot 1, Lot 13, Lot 37…). Its directory doesn't publish their addresses, so they can't be placed honestly here. Find them on the <a class="link" href="https://commerce.miamiparking.com/facility/findparking" target="_blank" rel="noopener">MPA's own map</a>.</p>
      </section>

      <p class="list-foot">Prices and hours as checked on ${esc(CITY.checked)}. Event, flood and hurricane rates override them.
        <br><button type="button" class="link quiet" data-about>About this app</button></p>
    </div>`;
  }

  // ── Sheet (place details) ────────────────────────────────────────────────
  let sheetId = null;
  const ABOUT = "about";
  function renderSheet(now) {
    if (!sheetId || sheetId === ABOUT) return;
    const s = byId[sheetId];
    const st = status(s, now);
    const d = meters(origin(), s);
    const notes = [];
    if (s.only) notes.push(`<div class="note"><b>Restricted.</b> ${esc(s.only)}.</div>`);
    if (s.rule) notes.push(`<div class="note"><b>Rule.</b> ${esc(s.rule)}</div>`);
    if (s.warn) notes.push(`<div class="note"><b>Heads up.</b> ${esc(s.warn)}</div>`);
    if (s.free) notes.push(`<div class="note free"><b>Free:</b> ${esc(s.free)}</div>`);
    const anyHours = s.hours && WEEK.some((w) => s.hours[w]);
    const tags = [s.code && `Code ${s.code}`, ...(s.notes || [])].filter(Boolean);

    $("#sheet").className = `sheet k-${s.kind}`;
    $("#sheet-body").innerHTML = `
      <div>
        <h2 class="d-name" id="sheet-title">${esc(s.name)}</h2>
        <div class="d-meta"><i class="dot"></i>${KIND[s.kind].label} · ${esc(s.area)} · ${distWords(d)} ${esc(originWords())}</div>
        ${st.text ? `<div class="d-meta"><span class="st st-${st.cls}">${esc(st.text)}</span></div>` : ""}
      </div>
      ${s.rate ? `<p class="d-price${/free/i.test(s.rate) ? " free" : ""}">${esc(s.rate)}</p>` : ""}
      ${notes.join("")}
      <div class="d-sec"><h3>Rates</h3><p>${esc(s.rates || "Not listed. Check the posted rate at the entrance or the operator's page.")}</p></div>
      <div class="d-sec"><h3>Hours</h3>
        ${anyHours ? `<table class="hours"><tbody>${WEEK.map((w) => {
          const h = hoursText(s, w);
          return `<tr class="${w === now.wd ? "today" : ""}"><td>${DAY_NAME[w]}</td><td class="${h.cls}">${esc(h.text)}</td></tr>`;
        }).join("")}</tbody></table>` : `<p>Not listed.</p>`}
        ${s.hoursNote ? `<p style="margin-top:6px">${esc(s.hoursNote)}</p>` : ""}
      </div>
      ${tags.length ? `<ul class="tags">${tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
      <div class="d-sec"><h3>Address</h3>
        <p class="addr">${esc(s.addr || s.area)}${s.approx ? ` <small>· the pin marks ${s.addr && /&|and/.test(s.addr) ? "the intersection" : "the place it's named after"}; check the entrance on the operator's map</small>` : ""}</p></div>
      <div class="d-sec"><h3>Run by</h3><p>${esc(OPERATOR[s.op] || s.op)}. <a class="link" href="${esc(s.link)}" target="_blank" rel="noopener">Operator page</a></p></div>`;
    $("#sheet-actions").hidden = false;
    $("#sheet-actions").innerHTML = `
      <a class="btn primary" href="${gmapsDrive(s)}" target="_blank" rel="noopener">${carSvg}Drive here</a>
      ${state.dest
        ? `<a class="btn" href="${gmapsWalkTo(s, state.dest)}" target="_blank" rel="noopener" aria-label="Walking directions from here to ${esc(state.dest.name)}">${walkSvg}Walk to ${esc(state.dest.name.length > 14 ? "there" : state.dest.name)}</a>`
        : `<a class="btn" href="${gmaps(s)}" target="_blank" rel="noopener">${mapSvg}Google Maps</a>`}`;
  }
  function renderAbout() {
    $("#sheet").className = "sheet";
    $("#sheet-body").innerHTML = `
      <div><h2 class="d-name" id="sheet-title">About Magic Spot</h2>
        <div class="d-meta">Free and government-run parking in Miami, sorted by how far you'll walk to where you're going.</div></div>
      <div class="d-sec"><h3>Check before you park</h3>
        <p>Rates, hours and free-parking rules come from a parking list checked on ${esc(CITY.checked)}. They change, and event, flood and hurricane rates override them. Always read the sign at the entrance. Nothing here is a reservation.</p></div>
      <div class="d-sec"><h3>What's included</h3>
        <p>Government-run garages and lots (City of Miami, Miami-Dade County, Miami Beach, Coral Gables), Metrorail and Park &amp; Ride parking, county parks and the airport's economy lot. Not private garages, hotel valets or individual meters. Dashed pins mark a station, park, landmark or intersection rather than an exact entrance.</p></div>
      <div class="d-sec"><h3>Not affiliated</h3>
        <p>This app isn't affiliated with or endorsed by any parking operator. To report something wrong, <a class="link" href="https://github.com/thinkscientist/magicspot/issues" target="_blank" rel="noopener">open an issue on GitHub</a>.</p></div>
      <div class="d-sec"><h3>Your privacy</h3>
        <p>No accounts, tracking or analytics. Your location is used only on your phone. When you search for a place, what you type is sent to Photon (a free OpenStreetMap search) to find it. The map, fonts and search services see your IP address like any website.</p></div>
      <div class="d-sec"><h3>Credits and licence</h3>
        <p>Map data © <a class="link" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>, tiles by <a class="link" href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>, place search by <a class="link" href="https://photon.komoot.io" target="_blank" rel="noopener">Photon</a>, drawn with MapLibre GL JS. The app's code is <a class="link" href="LICENSE" target="_blank" rel="noopener">MIT licensed</a> and provided as is, without warranty.</p></div>`;
    $("#sheet-actions").innerHTML = ""; $("#sheet-actions").hidden = true;
  }
  let lastFocus = null, closeTimer = null;
  function showSheet() {
    clearTimeout(closeTimer);
    $("#sheet").classList.remove("is-closing"); $("#scrim").classList.remove("is-closing");
    $("#sheet").style.transform = ""; $("#sheet").style.transition = "";
    lastFocus = document.activeElement;
    $("#peek").hidden = true; $("#scrim").hidden = false; $("#sheet").hidden = false;
    $("#sheet-body").scrollTop = 0;
    $("#sheet-close").focus({ preventScroll: true });
  }
  function openSheet(id) { sheetId = id; select(id, { pan: true }); showSheet(); renderSheet(cityNow()); }
  function openAbout() { sheetId = ABOUT; renderAbout(); showSheet(); }
  function closeSheet() {
    if (!sheetId) return;
    sheetId = null;
    const sheet = $("#sheet"), scrim = $("#scrim");
    sheet.classList.add("is-closing"); scrim.classList.add("is-closing");
    closeTimer = setTimeout(() => {
      sheet.hidden = true; scrim.hidden = true;
      sheet.classList.remove("is-closing"); scrim.classList.remove("is-closing");
      sheet.style.transform = ""; sheet.style.transition = "";
    }, reducedMotion ? 0 : 200);
    renderPeek(cityNow());
    if (lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  // ── Peek (pin tapped on the map) ─────────────────────────────────────────
  let peekFor = null;
  function renderPeek(now) {
    const el = $("#peek");
    if (!state.sel || sheetId) { el.hidden = true; peekFor = null; return; }
    const s = byId[state.sel];
    const st = status(s, now);
    const sub = [distWords(meters(origin(), s))];
    if (st.text && !s.only) sub.push(`<span class="st st-${st.cls}">${esc(st.text)}</span>`);
    el.className = `peek k-${s.kind}`;
    el.innerHTML = `
      <button type="button" class="row-main" data-open="${s.id}">
        <span class="row-top"><i class="dot"></i><span class="row-name">${esc(s.name)}</span></span>
        ${priceHtml(s)}
        <span class="row-sub">${sub.join(" · ")}</span>
      </button>
      <a class="btn primary small" href="${gmapsDrive(s)}" target="_blank" rel="noopener" aria-label="Drive to ${esc(s.name)} in Google Maps">${carSvg}Drive</a>`;
    el.hidden = false;
    if (peekFor !== state.sel) { peekFor = state.sel; replay(el, "enter"); }
  }

  // ── Map ──────────────────────────────────────────────────────────────────
  // OpenFreeMap vector tiles drawn by MapLibre: free, no key. The style's colours are
  // replaced with the --map-* design tokens, so the map follows the app's palette and theme.
  const map = new maplibregl.Map({
    container: "map", style: "https://tiles.openfreemap.org/styles/positron",
    center: [CITY.center.lng, CITY.center.lat], zoom: 11,
    attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, maxPitch: 0,
  });
  map.touchZoomRotate.disableRotation();

  // ── List drawer: drag the title row to slide the list away, and back ─────
  const drawer = $("#drawer"), brand = $("#brand"), stage = $("#stage");
  const wide = () => window.matchMedia("(min-width: 900px)").matches;
  const collapsedY = () => drawer.offsetHeight - brand.offsetHeight;
  function placeDrawer(y) {
    drawer.style.setProperty("--drawer-y", `${y}px`);
    stage.style.setProperty("--map-bottom", `${wide() ? 0 : Math.max(0, drawer.offsetHeight - y)}px`);
  }
  function syncMapPadding(animate) {
    const y = state.collapsed ? collapsedY() : 0;
    const padding = { top: parseFloat(getComputedStyle($(".mapwrap")).paddingTop) || 0, bottom: wide() ? 0 : drawer.offsetHeight - y, left: 0, right: 0 };
    if (animate && !reducedMotion) map.easeTo({ padding, duration: 380 }); else map.setPadding(padding);
  }
  function setCollapsed(collapsed, animate = true) {
    state.collapsed = collapsed && !wide();
    placeDrawer(state.collapsed ? collapsedY() : 0);
    $("#panel").inert = state.collapsed;
    const h = $("#handle");
    h.setAttribute("aria-expanded", String(!state.collapsed));
    h.setAttribute("aria-label", state.collapsed ? "Show the list" : "Hide the list");
    syncMapPadding(animate);
  }
  setCollapsed(false, false);
  let drag = null, ignoreClickUntil = 0;
  brand.addEventListener("pointerdown", (e) => {
    if (wide() || e.button > 0) return;
    drag = { id: e.pointerId, y0: e.clientY, last: e.clientY, t: e.timeStamp, v: 0, moved: false, from: state.collapsed ? collapsedY() : 0, max: collapsedY() };
    brand.setPointerCapture(e.pointerId);
  });
  brand.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.y0;
    if (!drag.moved) { if (Math.abs(dy) < 6) return; drag.moved = true; drawer.classList.add("dragging"); stage.classList.add("dragging"); }
    let y = drag.from + dy;
    if (y < 0) y /= 3; else if (y > drag.max) y = drag.max + (y - drag.max) / 3;
    placeDrawer(y);
    const dt = e.timeStamp - drag.t;
    if (dt > 0) drag.v = 0.6 * drag.v + 0.4 * ((e.clientY - drag.last) / dt);
    drag.last = e.clientY; drag.t = e.timeStamp;
  });
  function endDrag() {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    ignoreClickUntil = performance.now() + 400;
    drawer.classList.remove("dragging"); stage.classList.remove("dragging");
    const y = d.from + (d.last - d.y0);
    setCollapsed(d.v > 0.35 ? true : d.v < -0.35 ? false : y > d.max / 2);
  }
  brand.addEventListener("pointerup", endDrag);
  brand.addEventListener("pointercancel", endDrag);
  brand.addEventListener("click", () => { if (performance.now() > ignoreClickUntil && !wide()) setCollapsed(!state.collapsed); });

  function applyMapTheme() {
    const css = getComputedStyle(document.documentElement);
    const t = (n) => css.getPropertyValue(n).trim();
    const paint = (ids, prop, v) => ids.forEach((id) => { if (map.getLayer(id)) map.setPaintProperty(id, prop, v); });
    paint(["background"], "background-color", t("--map-land"));
    paint(["landuse_residential"], "fill-color", t("--map-land"));
    paint(["water"], "fill-color", t("--map-water"));
    paint(["waterway"], "line-color", t("--map-water"));
    paint(["park", "landcover_wood"], "fill-color", t("--map-park"));
    paint(["building"], "fill-color", t("--map-building"));
    paint(["building"], "fill-outline-color", t("--map-building-line"));
    paint(["road_area_pier"], "fill-color", t("--map-road"));
    paint(["highway_path", "highway_minor", "road_pier"], "line-color", t("--map-road"));
    paint(["highway_major_inner", "highway_major_subtle", "highway_motorway_inner", "highway_motorway_subtle", "highway_motorway_bridge_inner", "tunnel_motorway_inner"], "line-color", t("--map-road-major"));
    paint(["highway_major_casing", "highway_motorway_casing", "highway_motorway_bridge_casing", "tunnel_motorway_casing"], "line-color", t("--map-road-casing"));
    paint(["railway", "railway_dashline", "railway_transit", "railway_transit_dashline", "railway_service", "railway_service_dashline"], "line-color", t("--map-rail"));
    for (const l of map.getStyle().layers) {
      if (l.type !== "symbol") continue;
      const water = /water/.test(l.id);
      map.setPaintProperty(l.id, "text-color", t(water ? "--map-water-label" : "--map-label"));
      map.setPaintProperty(l.id, "text-halo-color", t(water ? "--map-water" : "--map-land"));
    }
  }
  map.on("load", () => {
    for (const l of map.getStyle().layers) if (/^label_(state|country)/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
    document.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
    applyMapTheme();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (map.isStyleLoaded()) applyMapTheme(); });
  const zoomClass = () => $("#map").classList.toggle("zoomed-out", map.getZoom() < 12.5);
  map.on("zoom", zoomClass);

  // Add a marker, keeping its own accessible name (MapLibre relabels every marker
  // "Map marker" each time it's added, so screen readers would never hear the name).
  function addMarker(m, label) {
    m.addTo(map);
    if (label) m.getElement().setAttribute("aria-label", label); else m.getElement().setAttribute("aria-hidden", "true");
    return m;
  }
  const html = (s) => { const d = document.createElement("div"); d.innerHTML = s.trim(); return d.firstChild; };

  const markers = {};
  for (const s of SPOTS) {
    const el = html(`<div class="pin k-${s.kind}${s.approx ? " is-approx" : ""}${isFree(s) ? " is-free" : ""}${s.only ? " is-only" : ""}" role="button" tabindex="0">
      <span class="pin-b">${KIND[s.kind].glyph}</span></div>`);
    el.addEventListener("click", (e) => { e.stopPropagation(); select(s.id, { from: "map" }); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(s.id); } });
    markers[s.id] = { m: new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]), el, on: false,
      label: `${s.name}: ${s.rate || KIND[s.kind].label}` };
  }
  let destMarker = null;
  function renderDestMarker() {
    if (destMarker) { destMarker.remove(); destMarker = null; }
    if (!state.dest) return;
    destMarker = addMarker(new maplibregl.Marker({ element: html('<div class="dest-pin"><svg viewBox="0 0 34 40" aria-hidden="true"><path d="M17 39s-13-11.4-13-22a13 13 0 0 1 26 0c0 10.6-13 22-13 22z"/><circle cx="17" cy="17" r="5"/></svg></div>'), anchor: "bottom" })
      .setLngLat([state.dest.lng, state.dest.lat]), `Where you're going: ${state.dest.name}`);
  }

  function renderMarkers(now) {
    for (const s of SPOTS) {
      const mk = markers[s.id];
      const show = matches(s) || state.sel === s.id || (state.driving && driveIds.has(s.id));
      if (show !== mk.on) {
        mk.on = show; clearTimeout(mk.leave);
        if (show) {
          if (map.loaded()) {
            const a = map.project([s.lng, s.lat]), c = map.project(map.getCenter());
            mk.el.firstElementChild.style.animationDelay = `${Math.round(Math.min(420, Math.hypot(a.x - c.x, a.y - c.y) * 1.4))}ms`;
          }
          mk.el.classList.remove("is-leaving");
          if (!mk.inMap) { addMarker(mk.m, mk.label); mk.inMap = true; }
        } else {
          mk.el.classList.add("is-leaving");
          mk.leave = setTimeout(() => { mk.m.remove(); mk.inMap = false; mk.el.classList.remove("is-leaving"); }, reducedMotion ? 0 : 240);
        }
      }
      if (!show) continue;
      mk.el.classList.toggle("is-closed", status(s, now).cls === "closed");
      mk.el.classList.toggle("is-sel", state.sel === s.id);
      mk.el.classList.toggle("is-cand", driveIds.has(s.id));
      mk.el.classList.toggle("is-target", state.driveTarget === s.id);
      mk.el.style.zIndex = state.sel === s.id ? 3 : s.only ? 0 : 1;
    }
  }
  function fitTo(points, instant) {
    if (!points.length) return;
    const duration = instant ? 0 : anim(700);
    if (points.length === 1) { map.flyTo({ center: points[0], zoom: 15, duration }); return; }
    const b = points.reduce((acc, p) => acc.extend(p), new maplibregl.LngLatBounds(points[0], points[0]));
    map.fitBounds(b, { padding: 50, maxZoom: 15.5, duration });
  }
  // Frame where you're going and the nearest few places to park.
  function fitDest(instant) {
    if (!state.dest) return;
    const near = SPOTS.filter((s) => matches(s) && !s.only).map((s) => ({ s, d: meters(state.dest, s) })).sort((a, b) => a.d - b.d).slice(0, 4);
    fitTo([[state.dest.lng, state.dest.lat], ...near.map(({ s }) => [s.lng, s.lat])], instant);
  }
  function fitAll(instant) {
    const core = SPOTS.filter((s) => matches(s) && meters(CITY.center, s) < 16000); // Downtown to the Beach and the Gables
    fitTo(core.map((s) => [s.lng, s.lat]), instant);
  }

  function select(id, { from, pan } = {}) {
    state.sel = id;
    const s = byId[id];
    if (from === "map" || pan) map.easeTo({ center: [s.lng, s.lat], offset: [0, -30], duration: anim(450) });
    renderAll();
    const row = from === "map" && !state.collapsed && document.querySelector(`.view:not([hidden]) [data-id="${id}"]`);
    if (row) {
      const panel = $("#panel"), r = row.getBoundingClientRect(), pr = panel.getBoundingClientRect(), top = 110;
      if (r.top < pr.top + top || r.bottom > pr.bottom) panel.scrollTo({ top: panel.scrollTop + r.top - pr.top - top, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }
  map.on("click", () => { if (state.sel && !sheetId) { state.sel = null; renderAll(); } });

  // ── Where are you going? ─────────────────────────────────────────────────
  // As you type: matching car parks from the list, then real places from Photon
  // (OpenStreetMap search; free, no key, built for search-as-you-type).
  const qEl = $("#q"), sugEl = $("#suggest");
  let sugItems = [], sugActive = -1, sugTimer = null, sugAbort = null;
  function placeSub(p) {
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    return [street, p.district || p.locality, p.city].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
  }
  function drawSuggest(local, places, note) {
    sugItems = [...local.map((s) => ({ type: "spot", s })), ...places.map((p) => ({ type: "place", p }))];
    sugActive = -1;
    let out = "";
    if (places.length) out += `<li class="s-head" role="presentation">Places</li>` + places.map((p, i) => `<li role="option" id="sg-${local.length + i}">
      <button type="button" data-sug="${local.length + i}"><span class="s-ico place">${pinSvg}</span><span class="s-name">${esc(p.name)}</span><span class="s-sub">${esc(p.sub)}</span></button></li>`).join("");
    if (local.length) out += `<li class="s-head" role="presentation">Car parks</li>` + local.map((s, i) => `<li role="option" id="sg-${i}">
      <button type="button" data-sug="${i}" class="k-${s.kind}"><span class="s-ico">${KIND[s.kind].glyph}</span><span class="s-name">${esc(s.name)}</span><span class="s-sub">${esc([s.area, s.rate].filter(Boolean).join(" · "))}</span></button></li>`).join("");
    if (note) out += `<li class="s-note" role="presentation">${esc(note)}</li>`;
    sugEl.innerHTML = out;
    const open = !!out;
    sugEl.hidden = !open;
    qEl.closest(".search").setAttribute("aria-expanded", String(open));
  }
  function closeSuggest() { sugEl.hidden = true; sugEl.innerHTML = ""; sugItems = []; qEl.closest(".search").setAttribute("aria-expanded", "false"); }
  function searchLocal(q) {
    const words = fold(q).split(/\s+/).filter(Boolean);
    return SPOTS.filter((s) => { const hay = fold([s.name, s.area, s.op, s.code, s.addr].join(" ")); return words.every((w) => hay.includes(w)); }).slice(0, 4);
  }
  async function searchPlaces(q) {
    sugAbort?.abort(); sugAbort = new AbortController();
    const c = map.getCenter();
    const url = `https://photon.komoot.io/api/?limit=6&lang=en&bbox=-80.90,25.40,-80.10,26.00&lat=${c.lat.toFixed(4)}&lon=${c.lng.toFixed(4)}&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { signal: sugAbort.signal });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const seen = new Set();
    return j.features.map((f) => ({ name: f.properties.name || placeSub(f.properties), sub: placeSub(f.properties), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }))
      .filter((p) => p.name && !seen.has(p.name + p.sub) && seen.add(p.name + p.sub)).slice(0, 5);
  }
  qEl.addEventListener("input", () => {
    const q = qEl.value.trim();
    $("#q-clear").hidden = !qEl.value;
    clearTimeout(sugTimer);
    if (q.length < 2) { closeSuggest(); return; }
    const local = searchLocal(q);
    drawSuggest(local, [], q.length >= 3 ? "Searching places…" : "");
    if (q.length < 3) return;
    sugTimer = setTimeout(async () => {
      try { const places = await searchPlaces(q); if (qEl.value.trim() === q) drawSuggest(local, places, places.length || local.length ? "" : "No matches in Miami-Dade."); }
      catch (e) { if (e.name !== "AbortError" && qEl.value.trim() === q) drawSuggest(local, [], "Couldn't search places just now. Check your connection."); }
    }, 250);
  });
  function pickSuggestion(i) {
    const it = sugItems[i]; if (!it) return;
    closeSuggest(); qEl.blur();
    if (it.type === "place") setDest({ name: it.p.name, sub: it.p.sub, lat: it.p.lat, lng: it.p.lng });
    else { qEl.value = state.dest ? state.dest.name : ""; $("#q-clear").hidden = !qEl.value; openSheet(it.s.id); }
  }
  qEl.addEventListener("keydown", (e) => {
    if (sugEl.hidden || !sugItems.length) { if (e.key === "Escape") qEl.blur(); return; }
    const order = [...sugEl.querySelectorAll("[data-sug]")].map((b) => +b.dataset.sug);
    const pos = order.indexOf(sugActive);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      sugActive = order[(pos + (e.key === "ArrowDown" ? 1 : order.length - 1 + (pos < 0 ? 1 : 0))) % order.length];
      sugEl.querySelectorAll("[data-sug]").forEach((b) => b.classList.toggle("active", +b.dataset.sug === sugActive));
      qEl.setAttribute("aria-activedescendant", `sg-${sugActive}`);
    } else if (e.key === "Enter") { e.preventDefault(); pickSuggestion(sugActive >= 0 ? sugActive : order[0]); }
    else if (e.key === "Escape") closeSuggest();
  });
  qEl.addEventListener("focus", () => { if (state.collapsed) setCollapsed(false); if (qEl.value.trim().length >= 2 && state.dest && qEl.value === state.dest.name) qEl.select(); });
  qEl.addEventListener("blur", () => setTimeout(() => { if (!sugEl.contains(document.activeElement)) closeSuggest(); }, 150));

  function setDest(d) {
    state.dest = d; state.sel = null; saveUi();
    qEl.value = d.name; $("#q-clear").hidden = false;
    renderDestMarker(); fx.list = true; $("#panel").scrollTop = 0; renderAll(); fitDest(false);
  }
  function clearDest() {
    state.dest = null; saveUi();
    qEl.value = ""; $("#q-clear").hidden = true; closeSuggest();
    renderDestMarker(); fx.list = true; renderAll();
    if (inCity()) map.flyTo({ center: [state.me.lng, state.me.lat], zoom: 14, duration: anim(600) }); else fitAll(false);
  }

  // ── Location ─────────────────────────────────────────────────────────────
  let watchId = null, meMarker = null, firstFix = true, lastRenderAt = null;
  function startWatch(center) {
    if (!("geolocation" in navigator)) { toast("This browser can't share your location."); return; }
    $("#btn-locate").classList.add("on");
    if (watchId != null) { if (center && state.me) map.flyTo({ center: [state.me.lng, state.me.lat], zoom: Math.max(map.getZoom(), 14), duration: anim(600) }); return; }
    firstFix = true;
    watchId = navigator.geolocation.watchPosition((pos) => {
      const prev = state.me;
      state.me = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, t: pos.timestamp };
      // Speed: from the fix if the phone gives it, otherwise from the last two fixes.
      const sp = pos.coords.speed;
      state.speed = sp != null && sp >= 0 ? sp : prev && state.me.t > prev.t ? meters(prev, state.me) / ((state.me.t - prev.t) / 1000) : 0;
      state.speedAt = Date.now();
      onDriveFix();
      if (!meMarker) meMarker = addMarker(new maplibregl.Marker({ element: html('<div class="me-dot"></div>') }).setLngLat([state.me.lng, state.me.lat]), "You are here");
      else meMarker.setLngLat([state.me.lng, state.me.lat]);
      if (firstFix) {
        firstFix = false;
        if (!inCity()) toast("You're not in Miami yet, so distances are from Downtown or where you're going.");
        else if (center || !state.dest) map.jumpTo({ center: [state.me.lng, state.me.lat], zoom: 14 });
        lastRenderAt = state.me; renderAll(); return;
      }
      if (!state.dest && (!lastRenderAt || meters(lastRenderAt, state.me) > 60)) { lastRenderAt = state.me; renderAll(); }
    }, (err) => {
      $("#btn-locate").classList.remove("on");
      navigator.geolocation.clearWatch(watchId); watchId = null;
      toast(err.code === 1 ? "Location is blocked. Allow it for this site in your browser settings." : "Couldn't find your location. Try again in a moment.");
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  let toastTimer = null;
  function toast(msg, action) {
    const el = $("#toast");
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button" id="toast-act">${esc(action.label)}</button>` : ""}`;
    el.classList.remove("is-leaving"); el.hidden = false;
    if (action) $("#toast-act").onclick = () => { el.hidden = true; action.run(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add("is-leaving");
      toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove("is-leaving"); }, reducedMotion ? 0 : 180);
    }, 4000);
  }

  // ── Drive mode ───────────────────────────────────────────────────────────
  // For a phone in a car dock: the best three car parks for where you're going, in big
  // cards. Tapping one hands turn-by-turn navigation to Google Maps or Apple Maps. Nothing
  // to type while moving; the screen stays awake; arriving shows what you need at the gate.
  const MOVING = 3;      // m/s (~7 mph): changing the destination is off above this
  const DRIVING = 6;     // m/s (~13 mph): offer Drive mode above this
  const ARRIVED = 200;   // metres from the car park
  let driveIds = new Set(), wakeLock = null, offeredDrive = false, fastFixes = 0, lastFollow = null;
  // A parked phone can stop getting location updates, so a speed reading expires after 10 seconds.
  const moving = () => state.speed > MOVING && Date.now() - (state.speedAt || 0) < 10000;
  const navUrl = (s) => {
    const where = s.approx ? `${s.lat},${s.lng}` : s.q;
    return state.navApp === "apple"
      ? `https://maps.apple.com/?daddr=${encodeURIComponent(where)}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&travelmode=driving&dir_action=navigate&destination=${encodeURIComponent(where)}`;
  };
  // Best three: car parks anyone can use (not park & ride: you're driving to the place),
  // nearest to where you're going, with anything closed right now pushed down.
  function driveCandidates(now) {
    const o = state.dest || (inCity() ? state.me : CITY.center);
    const pool = SPOTS.filter((s) => !s.only && s.kind !== "ride").map((s) => ({ s, d: meters(o, s), st: status(s, now) }));
    const rank = (x) => x.d + (x.st.cls === "closed" || x.st.cls === "later" ? 5000 : 0);
    pool.sort((a, b) => rank(a) - rank(b));
    const top = pool.slice(0, 3);
    if (state.driveTarget && !top.some((x) => x.s.id === state.driveTarget)) top[2] = pool.find((x) => x.s.id === state.driveTarget);
    return top;
  }
  const shortDest = () => (state.dest ? (state.dest.name.length > 18 ? "there" : state.dest.name) : "");
  function priceSpan(s, cls) {
    if (!s.rate) return `<span class="${cls} unk">Rates not listed</span>`;
    return `<span class="${cls}${/free/i.test(s.rate) ? " free" : ""}">${esc(s.rate)}</span>`;
  }
  function renderDrive(now) {
    const cands = driveCandidates(now);
    driveIds = new Set(cands.map((x) => x.s.id));
    $("#drive-title").innerHTML = state.dest
      ? `<small>Parking near</small><b>${esc(state.dest.name)}</b>`
      : `<small>Parking near</small><b>${inCity() ? "you" : "Downtown Miami"}</b>`;
    $("#drive-nav").innerHTML = `${state.navApp === "apple" ? "Apple Maps" : "Google Maps"}<small>navigates</small>`;
    const target = state.driveTarget && byId[state.driveTarget];
    const body = $("#drive-body");

    if (target && state.arrived) {
      const facts = [];
      if (s_only(target)) facts.push(s_only(target));
      if (target.rule) facts.push(target.rule);
      if (target.free) facts.push(`Free: ${target.free}`);
      for (const n of target.notes || []) if (/clearance|spaces|entrance/i.test(n)) facts.push(n);
      const h = hoursText(target, now.wd);
      if (h.cls !== "unk") facts.push(`Today: ${h.text}`);
      if (target.warn) facts.push(target.warn);
      body.innerHTML = `
        <div class="arrive"><div class="drive-title"><small>You're at</small></div>
          <h2>${esc(target.name)}</h2>
          ${target.rate ? `<p class="lead${/free/i.test(target.rate) ? " free" : ""}">${esc(target.rate)}</p>` : ""}
          ${facts.length ? `<ul class="facts">${facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
        </div>
        <div class="drive-actions">
          ${state.dest
            ? `<a class="btn primary" href="${gmapsWalkTo(target, state.dest)}" target="_blank" rel="noopener">${walkSvg}Walk to ${esc(shortDest())}</a>`
            : `<a class="btn primary" href="${gmaps(target)}" target="_blank" rel="noopener">${mapSvg}Google Maps</a>`}
          <button type="button" class="btn" id="drive-done">Done</button>
        </div>`;
      return;
    }

    const o = inCity() ? state.me : null;
    body.innerHTML = `
      <ol class="drive-cards">${cands.map(({ s, st }) => {
        const bits = [];
        if (o) bits.push(`${miles(meters(o, s)).toFixed(1)} mi away`);
        if (state.dest) bits.push(`${walkMins(meters(s, state.dest))} min walk to ${esc(shortDest())}`);
        else if (!o) bits.push(esc(s.area));
        if (st.text) bits.push(`<span class="st st-${st.cls}">${esc(st.text)}</span>`);
        const isT = state.driveTarget === s.id;
        return `<li><a class="dcard k-${s.kind}${isT ? " is-target" : ""}" href="${navUrl(s)}" target="_blank" rel="noopener" data-drive-go="${s.id}"
            aria-label="Navigate to ${esc(s.name)}, ${esc(s.rate || "rates not listed")}">
          <span class="dc-text"><span class="dc-name">${esc(s.name)}</span>${priceSpan(s, "dc-price")}<span class="dc-meta">${bits.join(" · ")}</span></span>
          <span class="dc-go">${isT ? "Navigating" : "Go"}</span></a></li>`;
      }).join("")}</ol>
      <p class="drive-note">${!state.me
        ? 'Turn on location so the map can follow you.'
        : moving()
          ? "Destination changes are off while you're moving."
          : `<button type="button" class="link" id="drive-change">${state.dest ? "Change destination" : "Set a destination"}</button>${state.driveTarget ? ' · <button type="button" class="link" id="drive-parked">I\'ve parked</button>' : ""}`}</p>`;
  }
  const s_only = (s) => s.only || "";

  function syncDrivePadding(animate) {
    const el = $("#drive");
    const land = window.matchMedia("(orientation: landscape) and (max-height: 560px)").matches;
    const padding = { top: parseFloat(getComputedStyle($(".mapwrap")).paddingTop) || 0, left: 0,
      bottom: land ? 0 : el.offsetHeight, right: land ? el.offsetWidth : 0 };
    if (animate && !reducedMotion) map.easeTo({ padding, duration: 380 }); else map.setPadding(padding);
  }
  function driveFrame(instant) {
    const t = state.driveTarget && byId[state.driveTarget];
    const pts = [];
    if (inCity()) pts.push([state.me.lng, state.me.lat]);
    if (t && !state.arrived) pts.push([t.lng, t.lat]);
    else if (!inCity() || !t) for (const id of driveIds) pts.push([byId[id].lng, byId[id].lat]);
    if (state.dest && !t) pts.push([state.dest.lng, state.dest.lat]);
    if (pts.length) fitTo(pts, instant);
    lastFollow = state.me;
  }
  async function keepAwake() {
    try { wakeLock = await navigator.wakeLock?.request("screen"); } catch { /* not allowed here; fine */ }
  }
  let driveTick = null;
  function enterDrive() {
    state.driving = true; state.sel = null; state.arrived = false;
    clearInterval(driveTick); driveTick = setInterval(() => renderDrive(cityNow()), 5000); // e.g. unlock once stopped
    if (sheetId) closeSheet();
    $("#app").classList.add("driving"); $("#drive").hidden = false;
    if (watchId == null) startWatch(false);
    keepAwake();
    renderAll();
    requestAnimationFrame(() => { syncDrivePadding(false); driveFrame(false); });
  }
  function exitDrive() {
    state.driving = false; state.driveTarget = null; state.arrived = false; driveIds = new Set();
    clearInterval(driveTick);
    $("#app").classList.remove("driving"); $("#drive").hidden = true;
    try { wakeLock?.release(); } catch {} wakeLock = null;
    setCollapsed(state.collapsed, false);
    renderAll();
  }
  function onDriveFix() {
    if (!state.driving) {
      // Moving at driving speed for a few fixes: offer Drive mode, once.
      fastFixes = state.speed > DRIVING ? fastFixes + 1 : 0;
      if (fastFixes >= 2 && !offeredDrive) { offeredDrive = true; toast("Looks like you're driving.", { label: "Drive mode", run: enterDrive }); }
      return;
    }
    const t = state.driveTarget && byId[state.driveTarget];
    if (t && !state.arrived && meters(state.me, t) < ARRIVED) { state.arrived = true; navigator.vibrate?.([20, 60, 20]); driveFrame(false); }
    renderDrive(cityNow()); renderMarkers(cityNow());
    if (!lastFollow || meters(lastFollow, state.me) > 40) driveFrame(false);
  }
  document.addEventListener("visibilitychange", () => { if (state.driving && !document.hidden) keepAwake(); });
  window.matchMedia("(orientation: landscape)").addEventListener?.("change", () => { if (state.driving) setTimeout(() => { syncDrivePadding(false); driveFrame(true); }, 200); });

  // ── Render ───────────────────────────────────────────────────────────────
  function renderAll() {
    const now = cityNow();
    renderClock(now);
    document.querySelectorAll(".tabs button").forEach((b) => { if (b.dataset.tab === state.tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    document.querySelectorAll(".view").forEach((v) => { v.hidden = v.dataset.view !== state.tab; });
    if (state.driving) renderDrive(now);
    if (state.tab === "find") renderFind(now); else renderTips();
    renderMarkers(now);
    renderPeek(now);
    renderSheet(now);
    fx.list = false;
  }
  // A filter change plays in two beats: old rows fade out, then new rows rise in.
  let swapTimer = null;
  function changeFilter() {
    document.querySelectorAll(".kinds .chip").forEach((b) => b.setAttribute("aria-pressed", String(state.kinds.has(b.dataset.kind))));
    renderMarkers(cityNow());
    const list = $("#list"), panel = $("#panel");
    clearTimeout(swapTimer);
    const swap = () => { list.classList.remove("leaving"); panel.scrollTop = 0; fx.list = true; renderAll(); };
    if (reducedMotion || !list.children.length) { swap(); return; }
    list.classList.add("leaving");
    swapTimer = setTimeout(swap, 180);
  }

  // ── Events ───────────────────────────────────────────────────────────────
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.sug != null) { e.preventDefault(); pickSuggestion(+t.dataset.sug); return; }
    if (t.dataset.driveGo) {
      // The link opens navigation; remember where you're heading so the app can greet you there.
      state.driveTarget = t.dataset.driveGo; state.arrived = false;
      setTimeout(() => { renderAll(); driveFrame(false); }, 0);
      return;
    }
    if (t.dataset.open) { openSheet(t.dataset.open); return; }
    if ("about" in t.dataset) { openAbout(); return; }
    if (t.dataset.kind) {
      const k = t.dataset.kind;
      if (state.kinds.has(k)) state.kinds.delete(k); else state.kinds.add(k);
      saveUi(); changeFilter(); return;
    }
    if (t.dataset.tab) {
      if (state.collapsed) setCollapsed(false);
      if (state.tab === t.dataset.tab) { $("#panel").scrollTo({ top: 0, behavior: "smooth" }); return; }
      state.tab = t.dataset.tab; state.sel = null; fx.list = true; saveUi();
      $("#panel").scrollTop = 0; renderAll(); return;
    }
    switch (t.id) {
      case "btn-locate": case "btn-locprompt": startWatch(true); return;
      case "q-clear": case "dest-clear": clearDest(); return;
      case "btn-drive": enterDrive(); return;
      case "drive-exit": case "drive-done": exitDrive(); return;
      case "drive-nav": state.navApp = state.navApp === "apple" ? "google" : "apple"; saveUi(); renderAll();
        toast(`Navigation opens in ${state.navApp === "apple" ? "Apple Maps" : "Google Maps"}.`); return;
      case "drive-parked": state.arrived = true; renderAll(); driveFrame(false); return;
      case "drive-change":
        if (moving()) return;
        exitDrive(); state.tab = "find"; setCollapsed(false); renderAll(); qEl.focus(); return;
      case "sheet-close": closeSheet(); return;
      default: return;
    }
  });
  // Keep the suggestion list open while it's being tapped.
  sugEl.addEventListener("pointerdown", (e) => e.preventDefault());
  $("#scrim").addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheetId) closeSheet(); });

  // Swipe the details sheet down to close it.
  (() => {
    const sheet = $("#sheet"), body = $("#sheet-body");
    let y0 = null, dy = 0;
    sheet.addEventListener("touchstart", (e) => {
      if (e.target.closest(".sheet-actions") || body.scrollTop > 0) { y0 = null; return; }
      y0 = e.touches[0].clientY; dy = 0; sheet.style.transition = "none";
    }, { passive: true });
    sheet.addEventListener("touchmove", (e) => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) sheet.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sheet.addEventListener("touchend", () => {
      if (y0 == null) return; y0 = null;
      if (dy > 90) { closeSheet(); return; }
      sheet.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1)"; sheet.style.transform = "";
    });
  })();

  // ── Boot ─────────────────────────────────────────────────────────────────
  if (state.dest) { qEl.value = state.dest.name; $("#q-clear").hidden = false; renderDestMarker(); }
  renderAll();
  requestAnimationFrame(() => { map.resize(); if (state.dest) fitDest(true); else fitAll(true); zoomClass(); });
  window.addEventListener("resize", () => { map.resize(); setCollapsed(state.collapsed, false); });
  setInterval(renderAll, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) renderAll(); });
  navigator.permissions?.query({ name: "geolocation" }).then((r) => { if (r.state === "granted") startWatch(false); }, () => {});
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
