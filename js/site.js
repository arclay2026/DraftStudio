/* =====================================================================
   DRAFT STUDIO — SITE SCRIPT
   Builds the header, footer, search and every page from js/data.js.
   You shouldn't need to edit this file to add designs.
   ===================================================================== */
(function () {
  "use strict";

  const DS = window.DS;
  const ICONS = window.DS_ICONS || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  const CATS = [
    { name: "Mockups",   slug: "mockups",   blurb: "Photoshop scenes with smart objects. Drop your design in, done.", formats: ["PSD"] },
    { name: "Vectors",   slug: "vectors",   blurb: "Illustrations, shapes, badges and patterns that scale to any size.", formats: ["AI", "SVG", "EPS"] },
    { name: "Logos",     slug: "logos",     blurb: "Editable logo files, ready to rename and make your own.", formats: ["AI", "SVG", "PDF"] },
    { name: "Templates", slug: "templates", blurb: "Flyers, posters, social posts and cards with editable text.", formats: ["PSD", "AI", "PDF"] }
  ];

  /* ---------- Language ---------- */
  // The markup is written in English. For other languages the page head loads
  // js/i18n/<code>.js first (window.DS_I18N); i18n() then swaps every text
  // node and label that has an entry, including anything added later.
  const LANGS = { en: "English", fr: "Français", es: "Español", pt: "Português", ar: "العربية", zh: "中文" };
  const LANG = document.documentElement.lang in LANGS ? document.documentElement.lang : "en";

  function i18n() {
    const root = document.documentElement;
    const done = () => root.classList.remove("i18n-wait");
    const D = window.DS_I18N;
    if (LANG === "en" || !D) return done();
    const S = D.strings || {};
    const P = (D.patterns || []).map(([re, out]) => [new RegExp(re), out]);
    const one = s => {
      if (S[s] != null) return S[s];
      for (const [re, o] of P) if (re.test(s)) return s.replace(re, (...m) => o.replace(/\$(\d)/g, (_, n) => S[m[n]] || m[n]));
      return null;
    };
    const tr = raw => {
      const s = raw.trim();
      if (!s || !/[A-Za-z]/.test(s)) return null;
      let out = one(s);
      // "Mockups · 3 weeks ago": translate each part on its own
      if (out == null && s.includes(" · ")) {
        const parts = s.split(" · "), got = parts.map(x => one(x));
        if (got.some(x => x != null)) out = parts.map((x, i) => got[i] ?? x).join(" · ");
      }
      return out == null ? null : raw.replace(s, out);
    };
    const ATTRS = ["placeholder", "aria-label", "title", "data-tip", "data-label", "alt"];
    const SKIP = "script, style, code, pre, [data-no-i18n], .qs-preview, .qs-look, .qt-stage svg";
    const attrs = el => ATTRS.forEach(a => {
      const v = el.getAttribute(a);
      if (!v) return;
      const o = tr(v);
      if (o != null && o !== v) el.setAttribute(a, o);
    });
    const walk = node => {
      if (node.nodeType === 3) {
        const p = node.parentElement;
        if (!p || p.closest(SKIP) || p.tagName === "TEXTAREA") return;  // a text box's content is the visitor's own text
        const o = tr(node.nodeValue);
        if (o != null && o !== node.nodeValue) node.nodeValue = o;
        return;
      }
      if (node.nodeType !== 1 || node.closest(SKIP)) return;
      attrs(node);
      node.childNodes.forEach(walk);
    };
    walk(document.body);
    document.title = document.title.split(" · ").map(x => tr(x) || x).join(" · ");
    new MutationObserver(ms => ms.forEach(m => {
      if (m.type === "attributes") { if (!m.target.closest(SKIP)) attrs(m.target); }
      else if (m.type === "characterData") walk(m.target);
      else m.addedNodes.forEach(walk);
    })).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    done();
  }

  /* ---------- Helpers ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Library icons (the free icons people download) keep their own line drawing.
  // A few break a line with a <mask>, so every copy gets its own mask id.
  let maskN = 0;
  const libIcon = (id, cls = "") => {
    let body = ICONS[id] || "";
    if (body.includes("__ID__")) body = body.split("__ID__").join("ic" + (++maskN));
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  };
  // Interface icons come from js/ui-icons.js (Phosphor, regular weight)
  const UI_ICONS = window.DS_UI_ICONS || {};
  const icon = (id, cls = "") => (UI_ICONS[id]
    ? `<svg class="${cls}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${UI_ICONS[id]}</svg>`
    : libIcon(id, cls));
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const catOf = name => CATS.find(c => c.name === name || c.slug === slug(name));

  // Newest first; catalogue numbers follow the order things were added (oldest = DS-001)
  const items = DS.items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  items.slice().reverse().forEach((it, i) => { it.num = "DS–" + String(i + 1).padStart(3, "0"); });

  const isPaid = it => !!it.price;
  // "R450", or "From R450" when the price is a starting price
  const priceText = it => (it.priceFrom ? "From " : "") + it.price;
  // Orientation: set it on a design with orientation: "vertical" (etc.), or it's worked out from the first "W × H" in specs
  const orientationOf = it => {
    if (it.orientation) return it.orientation;
    const m = String(it.specs || "").match(/(\d[\d\s,.]*)\s*[×x]\s*(\d[\d\s,.]*)/);
    if (!m) return "";
    const w = parseFloat(m[1].replace(/[\s,]/g, "")), h = parseFloat(m[2].replace(/[\s,]/g, ""));
    const r = w / h;
    return r >= 2 ? "panoramic" : r > 1.05 ? "horizontal" : r < .95 ? "vertical" : "square";
  };
  const formatsOf = it => {
    const list = isPaid(it) ? (it.includes || []) : (it.files || []).map(f => f.format.toUpperCase());
    return list.filter(f => f !== "ZIP").filter((f, i, a) => a.indexOf(f) === i);
  };
  const isExternal = p => /^https?:\/\//.test(p);
  // Big files live on Google Drive; their buttons carry the Drive logo
  const DRIVE = `<img class="gd" src="assets/google-drive.svg" alt="" width="14" height="14">`;
  const fmtBadge = (f, extra = "") => `<span class="fmt ${extra}" data-f="${esc(f)}">${esc(f)}</span>`;
  const itemUrl = it => `item.html?id=${encodeURIComponent(it.id)}`;
  // Lighter WebP copies of previews (tools/build-images.py): "sm" for thumbnails,
  // "md" for big previews. Falls back to the original if a copy isn't there yet.
  // width/height from js/preview-sizes.js let the page keep the space before the picture arrives
  const arOf = src => { const d = (window.DS_SIZES || {})[src]; return d ? +(d[0] / d[1]).toFixed(4) : 1; };
  const dims = src => { const d = (window.DS_SIZES || {})[src]; return d ? ` width="${d[0]}" height="${d[1]}"` : ""; };
  const imgSrc = (src, size) => {
    const m = /^previews\/([^/]+)\.(jpe?g|png)$/i.exec(src || "");
    const lite = m ? `previews/${size}/${m[1]}.webp` : src;
    return `src="${esc(lite)}"${dims(src)}${lite !== src ? ` onerror="this.onerror=null;this.src='${esc(src)}'"` : ""}`;
  };
  // Big previews: phones take the 640px copy, larger screens the 1400px one
  const imgSet = (src, sizes) => {
    const m = /^previews\/([^/]+)\.(jpe?g|png)$/i.exec(src || "");
    if (!m) return `src="${esc(src)}"${dims(src)}`;
    return `src="previews/md/${m[1]}.webp"${dims(src)} srcset="previews/sm/${m[1]}.webp 640w, previews/md/${m[1]}.webp 1400w" sizes="${sizes}" onerror="this.onerror=null;this.removeAttribute('srcset');this.src='${esc(src)}'"`;
  };
  const waLink = text => `https://wa.me/${DS.site.whatsapp}?text=${encodeURIComponent(text)}`;
  const mailLink = (subject, body = "") => `mailto:${DS.site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("is-on"), 2200);
  }

  function copy(text, msg) {
    const done = () => toast(msg || "Copied");
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => fallback());
    else fallback();
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { toast("Couldn't copy"); }
      ta.remove();
    }
  }

  // Tooltips: one styled bubble for every icon-only control (its aria-label) and anything with data-tip.
  // Native title attributes are converted on first hover so the browser's grey box never shows.
  function tooltips() {
    if (!matchMedia("(hover: hover)").matches) return;
    const tip = document.createElement("div");
    tip.className = "tip"; tip.setAttribute("role", "tooltip"); tip.hidden = true;
    document.body.appendChild(tip);
    const SKIP = ".logo, [data-slides] *, .sel-toggle, .dd-toggle, .sel-menu *, .dd-menu *, .ch-fab, .ch-send";
    let cur = null, timer = 0;
    const textOf = el => {
      if (el.hasAttribute("title")) { el.dataset.tip = el.getAttribute("title"); el.removeAttribute("title"); }
      if (el.dataset.tip) return el.dataset.tip;
      if (el.matches(SKIP) || el.textContent.trim()) return "";
      return el.getAttribute("aria-label") || "";
    };
    const find = t => {
      const el = t.closest && t.closest("[data-tip], [title], button[aria-label], a[aria-label], label[aria-label]");
      return el && textOf(el) ? el : null;
    };
    const place = () => {
      if (!cur) return;
      tip.textContent = textOf(cur);
      const r = cur.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, gap = 9;
      const below = r.top - h - gap < 8;
      const left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2));
      tip.style.left = left + "px";
      tip.style.top = (below ? r.bottom + gap : r.top - h - gap) + "px";
      tip.style.setProperty("--ax", (r.left + r.width / 2 - left) + "px");
      tip.classList.toggle("is-below", below);
    };
    const show = (el, wait) => {
      clearTimeout(timer);
      cur = el;
      timer = setTimeout(() => { if (cur !== el) return; tip.hidden = false; place(); requestAnimationFrame(() => tip.classList.add("is-on")); }, wait);
    };
    const hide = () => { clearTimeout(timer); cur = null; tip.classList.remove("is-on"); tip.hidden = true; };
    document.addEventListener("mouseover", e => { const el = find(e.target); if (el !== cur) el ? show(el, tip.classList.contains("is-on") ? 0 : 280) : hide(); });
    document.addEventListener("focusin", e => { const el = find(e.target); if (el && e.target.matches(":focus-visible")) show(el, 0); });
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide); // a click starts something new (menus, the colour picker)
    addEventListener("scroll", hide, { passive: true });
    document.addEventListener("keydown", e => { if (e.key === "Escape") hide(); });
  }

  // Colour picker: replaces the browser's picker for every <input type="color"> on the site.
  // It writes back to the input and fires "input" while dragging and "change" when it closes,
  // so page code keeps listening to the input as before.
  function colorPicker() {
    const RECENT_KEY = "ds-recent-colours";
    const loadRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } };
    const hsvRgb = (h, s, v) => {
      const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
      return [f(5) * 255, f(3) * 255, f(1) * 255];
    };
    const rgbHsv = (r, g, b) => {
      r /= 255; g /= 255; b /= 255;
      const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
      const h = d ? 60 * (mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4) : 0;
      return [(h + 360) % 360, mx ? d / mx : 0, mx];
    };
    const pk = document.createElement("div");
    pk.className = "cpick"; pk.hidden = true;
    pk.setAttribute("role", "dialog"); pk.setAttribute("aria-label", "Pick a colour");
    pk.innerHTML = `
      <div class="cp-sv" data-sv><span class="cp-thumb" data-sv-thumb></span></div>
      <div class="cp-row">
        ${"EyeDropper" in window ? `<button type="button" class="cp-drop" data-drop aria-label="Pick from screen">${icon("eyedropper")}</button>` : ""}
        <span class="cp-now" data-now></span>
        <div class="cp-hue" data-hue><span class="cp-thumb" data-hue-thumb></span></div>
      </div>
      <div class="cp-fields">
        <label class="cp-hex"><span>#</span><input data-hex maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex"></label>
        <label><input data-ch="0" inputmode="numeric" aria-label="Red"><small>R</small></label>
        <label><input data-ch="1" inputmode="numeric" aria-label="Green"><small>G</small></label>
        <label><input data-ch="2" inputmode="numeric" aria-label="Blue"><small>B</small></label>
      </div>
      <div class="cp-recent" data-recent></div>`;
    document.body.appendChild(pk);
    const sv = $("[data-sv]", pk), hue = $("[data-hue]", pk), hexIn = $("[data-hex]", pk);
    let target = null, hsv = [0, 0, 0], start = "";

    const hex = () => rgbHex(...hsvRgb(...hsv));
    const render = (skip) => {
      const c = hex(), [r, g, b] = hexRgb(c);
      sv.style.setProperty("--hue", `hsl(${hsv[0]}, 100%, 50%)`);
      $("[data-sv-thumb]", pk).style.cssText = `left:${hsv[1] * 100}%;top:${(1 - hsv[2]) * 100}%;background:${c}`;
      $("[data-hue-thumb]", pk).style.cssText = `left:${hsv[0] / 360 * 100}%;background:hsl(${hsv[0]}, 100%, 50%)`;
      $("[data-now]", pk).style.background = c;
      if (skip !== "hex") hexIn.value = c.slice(1).toUpperCase();
      if (skip !== "rgb") $$("[data-ch]", pk).forEach((el, i) => { el.value = [r, g, b][i]; });
    };
    const emit = () => {
      if (!target) return;
      target.value = hex();
      target.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const set = (c, skip) => { hsv = rgbHsv(...hexRgb(c)); render(skip); emit(); };
    const drawRecent = () => {
      const list = loadRecent();
      $("[data-recent]", pk).innerHTML = list.length ? `<small>Recent</small>` + list.map(c => `<button type="button" style="background:${c}" data-recent-c="${c}" aria-label="${c}"></button>`).join("") : "";
    };
    const place = () => {
      const r = target.getBoundingClientRect(), w = pk.offsetWidth, h = pk.offsetHeight;
      const below = r.bottom + 10 + h < innerHeight || r.top - h - 10 < 0;
      pk.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + scrollX + "px";
      pk.style.top = (below ? r.bottom + 10 : r.top - h - 10) + scrollY + "px";
    };
    const open = input => {
      if (target === input) return close();
      if (target) close();
      target = input; start = input.value;
      hsv = rgbHsv(...hexRgb(/^#[0-9a-f]{6}$/i.test(input.value) ? input.value : "#0f0f0f"));
      drawRecent(); render();
      pk.hidden = false; place();
      requestAnimationFrame(() => pk.classList.add("is-on"));
    };
    const close = () => {
      if (!target) return;
      const t = target, c = hex();
      target = null;
      pk.classList.remove("is-on"); pk.hidden = true;
      if (c !== start.toLowerCase()) {
        try { localStorage.setItem(RECENT_KEY, JSON.stringify([c].concat(loadRecent().filter(x => x !== c)).slice(0, 9))); } catch (e) {}
        if (t.isConnected) t.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };
    const drag = (el, fn) => el.addEventListener("pointerdown", e => {
      e.preventDefault(); el.setPointerCapture(e.pointerId);
      const move = ev => { const r = el.getBoundingClientRect(); fn(Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height))); render(); emit(); };
      move(e);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", () => el.removeEventListener("pointermove", move), { once: true });
    });
    drag(sv, (x, y) => { hsv[1] = x; hsv[2] = 1 - y; });
    drag(hue, x => { hsv[0] = Math.min(359.9, x * 360); });
    hexIn.addEventListener("input", () => {
      const v = hexIn.value.replace(/[^0-9a-f]/gi, "");
      const full = v.length === 3 ? v.split("").map(x => x + x).join("") : v;
      if (full.length === 6) set("#" + full.toLowerCase(), "hex");
    });
    $$("[data-ch]", pk).forEach(el => el.addEventListener("input", () => {
      const rgb = $$("[data-ch]", pk).map(x => Math.max(0, Math.min(255, parseInt(x.value, 10) || 0)));
      set(rgbHex(...rgb), "rgb");
    }));
    pk.addEventListener("keydown", e => { if (e.key === "Enter") close(); });
    pk.addEventListener("click", e => {
      const rc = e.target.closest("[data-recent-c]"); if (rc) set(rc.dataset.recentC);
      if (e.target.closest("[data-drop]")) new window.EyeDropper().open().then(r => set(r.sRGBHex.toLowerCase())).catch(() => {});
    });
    // Take over every colour input, now and in content drawn later
    document.addEventListener("click", e => {
      const input = e.target.closest && e.target.closest('input[type="color"]');
      if (input) { e.preventDefault(); open(input); return; }
      if (target && !pk.contains(e.target)) close();
    }, true);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && target) { set(start); close(); }
      const input = e.target.closest && e.target.closest('input[type="color"]');
      if (input && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(input); }
    });
    addEventListener("resize", () => target && place());
  }

  // Saved designs live in the visitor's browser only
  const SAVE_KEY = "ds-saved";
  const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { return []; } };
  let saved = loadSaved();
  const isSaved = id => saved.includes(id);
  const toggleSaved = id => {
    saved = isSaved(id) ? saved.filter(x => x !== id) : saved.concat(id);
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(saved)); } catch (e) {}
    document.dispatchEvent(new CustomEvent("ds:saved"));
    return isSaved(id);
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-save]"); if (!b) return;
    e.preventDefault();
    const on = toggleSaved(b.dataset.save);
    $$(`[data-save="${b.dataset.save}"]`).forEach(x => { x.setAttribute("aria-pressed", on); x.setAttribute("aria-label", on ? "Remove from saved" : "Save"); });
    toast(on ? "Saved" : "Removed from saved");
  });

  let cardN = 0;
  function card(it) {
    const on = isSaved(it.id);
    const early = cardN++ < 3;
    return `
      <article class="card${slug(it.category) === "logos" ? " is-logo" : ""} reveal">
        <div class="card-media">
          <img ${imgSrc(it.preview, "sm")} alt=""${early ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">
          <button class="card-save glass-btn" type="button" data-save="${esc(it.id)}" aria-pressed="${on}" aria-label="${on ? "Remove from saved" : "Save"}">${icon("bookmark")}</button>
          <span class="card-cta glass-btn" aria-hidden="true">${ARR}</span>
        </div>
        <div class="card-body">
          <h3><a href="${itemUrl(it)}">${esc(it.title)}</a></h3>
          <p class="sub">${esc(it.category)}${it.specs ? " · " + esc(it.specs.split("·")[0].trim()) : ""}</p>
        </div>
      </article>`;
  }

  /* ---------- Header & footer ---------- */
  // Diagonal arrow used in the round badge on dark pill buttons
  const ARR = icon("arrow-up-right");

  // Extra glyphs for the side menu that the icon set doesn't have
  Object.assign(ICONS, {
    "ui-qr": '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 17h4v4h-4"/>',
    "ui-side": '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>'
  });

  // Side menu icons: Google Material Symbols, Rounded, weight 400, 24px (Apache 2.0,
  // js/vendor/material-symbols-LICENSE.txt). Sources in assets/side-icons/.
  const SIDE_ICONS = {
    "home": "M240-200h120v-200q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400v200h120v-360L480-740 240-560v360Zm-80 0v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H560q-17 0-28.5-11.5T520-160v-200h-80v200q0 17-11.5 28.5T400-120H240q-33 0-56.5-23.5T160-200Zm320-270Z",
    "browse-all": "M680-640h-80q-17 0-28.5-11.5T560-680q0-17 11.5-28.5T600-720h80v-80q0-17 11.5-28.5T720-840q17 0 28.5 11.5T760-800v80h80q17 0 28.5 11.5T880-680q0 17-11.5 28.5T840-640h-80v80q0 17-11.5 28.5T720-520q-17 0-28.5-11.5T680-560v-80ZM480-160h360q17 0 28.5-11.5T880-200v-200q0-17-11.5-28.5T840-440H480q-17 0-28.5 11.5T440-400v200q0 17 11.5 28.5T480-160ZM120-520h320q17 0 28.5-11.5T480-560v-200q0-17-11.5-28.5T440-800H120q-17 0-28.5 11.5T80-760v200q0 17 11.5 28.5T120-520Zm0 360h200q17 0 28.5-11.5T360-200v-200q0-17-11.5-28.5T320-440H120q-17 0-28.5 11.5T80-400v200q0 17 11.5 28.5T120-160Zm400-200ZM400-600ZM280-360Zm240 120v-120h280v120H520ZM160-600v-120h240v120H160Zm0 360v-120h120v120H160Z",
    "mockups": "m240-522-40 22q-14 8-30 4t-24-18L66-654q-8-14-4-30t18-24l230-132h70q9 0 14.5 5.5T400-820v20q0 33 23.5 56.5T480-720q33 0 56.5-23.5T560-800v-20q0-9 5.5-14.5T580-840h70l230 132q14 8 18 24t-4 30l-80 140q-8 14-23.5 17.5T760-501l-40-20v361q0 17-11.5 28.5T680-120H280q-17 0-28.5-11.5T240-160v-362Zm80-134v456h320v-456l124 68 42-70-172-100q-15 51-56.5 84.5T480-640q-56 0-97.5-33.5T326-758L154-658l42 70 124-68Zm160 177Z",
    "vectors": "M480-720h80v-80h-80v80ZM200-400h80v-80h-80v80Zm480 240h80v-80h-80v80ZM520-760ZM240-440Zm480 240Zm-120 40v-20L320-320H200q-33 0-56.5-23.5T120-400v-80q0-33 23.5-56.5T200-560h92l108-124v-116q0-33 23.5-56.5T480-880h80q33 0 56.5 23.5T640-800v80q0 33-23.5 56.5T560-640h-92L360-516v126l245 122q8-23 28.5-37.5T680-320h80q33 0 56.5 23.5T840-240v80q0 33-23.5 56.5T760-80h-80q-33 0-56.5-23.5T600-160Z",
    "logos": "M200 -120Q183 -120 171.5 -131.5Q160 -143 160 -160V-257Q160 -273 166 -287.5Q172 -302 183 -313L687 -816Q699 -828 714 -834Q729 -840 744 -840Q760 -840 774.5 -834Q789 -828 800 -816L856 -760Q868 -749 874 -734.5Q880 -720 880 -704Q880 -689 874 -674Q868 -659 856 -647L353 -143Q342 -132 327.5 -126Q313 -120 297 -120ZM240 -200H296L689 -592L661 -621L632 -649L240 -256ZM800 -703 743 -760ZM661 -621 632 -649 689 -592ZM560 -120Q634 -120 697 -157Q760 -194 760 -260Q760 -292 744 -315.5Q728 -339 702 -359Q688 -369 672 -369Q656 -369 645 -357Q634 -345 634 -327.5Q634 -310 648 -300Q662 -289 671 -280Q680 -271 680 -260Q680 -237 643.5 -218.5Q607 -200 560 -200Q543 -200 531.5 -188.5Q520 -177 520 -160Q520 -143 531.5 -131.5Q543 -120 560 -120ZM360 -720Q360 -706 342.5 -694.5Q325 -683 262 -654Q182 -619 151 -590.5Q120 -562 120 -520Q120 -494 132 -474Q144 -454 163 -439Q176 -428 192 -429.5Q208 -431 219 -444Q230 -457 229 -473Q228 -489 215 -500Q208 -505 204 -510Q200 -515 200 -520Q200 -532 218 -544Q236 -556 294 -581Q382 -619 411 -650Q440 -681 440 -720Q440 -775 396 -807.5Q352 -840 280 -840Q235 -840 199.5 -824Q164 -808 145 -785Q134 -772 136 -756Q138 -740 151 -730Q164 -719 180 -721Q196 -723 207 -734Q221 -748 238 -754Q255 -760 280 -760Q321 -760 340.5 -748Q360 -736 360 -720Z",
    "templates": "M120-440v-320q0-33 23.5-56.5T200-840h240v400H120Zm240-80Zm160-320h240q33 0 56.5 23.5T840-760v160H520v-240Zm0 720v-400h320v320q0 33-23.5 56.5T760-120H520ZM120-360h320v240H200q-33 0-56.5-23.5T120-200v-160Zm240 80Zm240-400Zm0 240Zm-400-80h160v-240H200v240Zm400-160h160v-80H600v80Zm0 240v240h160v-240H600ZM200-280v80h160v-80H200Z",
    "icons": "m297-581 149-243q6-10 15-14.5t19-4.5q10 0 19 4.5t15 14.5l149 243q6 10 6 21t-5 20q-5 9-14 14.5t-21 5.5H331q-12 0-21-5.5T296-540q-5-9-5-20t6-21ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-60v-240q0-17 11.5-28.5T160-420h240q17 0 28.5 11.5T440-380v240q0 17-11.5 28.5T400-100H160q-17 0-28.5-11.5T120-140Zm580-20q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z",
    "palettes": "M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-177 23q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120-160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm200 0q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17Zm120 160q17-17 17-43t-17-43q-17-17-43-17t-43 17q-17 17-17 43t17 43q17 17 43 17t43-17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z",
    "qr": "M120-560v-240q0-17 11.5-28.5T160-840h240q17 0 28.5 11.5T440-800v240q0 17-11.5 28.5T400-520H160q-17 0-28.5-11.5T120-560Zm80-40h160v-160H200v160Zm-80 440v-240q0-17 11.5-28.5T160-440h240q17 0 28.5 11.5T440-400v240q0 17-11.5 28.5T400-120H160q-17 0-28.5-11.5T120-160Zm80-40h160v-160H200v160Zm320-360v-240q0-17 11.5-28.5T560-840h240q17 0 28.5 11.5T840-800v240q0 17-11.5 28.5T800-520H560q-17 0-28.5-11.5T520-560Zm80-40h160v-160H600v160Zm160 480v-80h80v80h-80ZM520-360v-80h80v80h-80Zm80 80v-80h80v80h-80Zm-80 80v-80h80v80h-80Zm80 80v-80h80v80h-80Zm80-80v-80h80v80h-80Zm0-160v-80h80v80h-80Zm80 80v-80h80v80h-80Z",
    "canvas": "M440-80q-33 0-56.5-23.5T360-160v-160H240q-33 0-56.5-23.5T160-400v-280q0-66 47-113t113-47h440q17 0 28.5 11.5T800-800v400q0 33-23.5 56.5T720-320H600v160q0 33-23.5 56.5T520-80h-80ZM240-560h480v-200h-40v120q0 17-11.5 28.5T640-600q-17 0-28.5-11.5T600-640v-120h-40v40q0 17-11.5 28.5T520-680q-17 0-28.5-11.5T480-720v-40H320q-33 0-56.5 23.5T240-680v120Zm0 160h480v-80H240v80Zm0 0v-80 80Z",
    "websites": "M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H160v400Z",
    "portfolio": "M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h207q16 0 30.5 6t25.5 17l57 57h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z",
    "pricing": "M856-390 570-104q-12 12-27 18t-30 6q-15 0-30-6t-27-18L103-457q-11-11-17-25.5T80-513v-287q0-33 23.5-56.5T160-880h287q16 0 31 6.5t26 17.5l352 353q12 12 17.5 27t5.5 30q0 15-5.5 29.5T856-390ZM513-160l286-286-353-354H160v286l353 354ZM260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z",
    "learn": "M242-249q-20-11-31-29.5T200-320v-192l-96-53q-11-6-16-15t-5-20q0-11 5-20t16-15l338-184q9-5 18.5-7.5T480-829q10 0 19.5 2.5T518-819l381 208q10 5 15.5 14.5T920-576v256q0 17-11.5 28.5T880-280q-17 0-28.5-11.5T840-320v-236l-80 44v192q0 23-11 41.5T718-249L518-141q-9 5-18.5 7.5T480-131q-10 0-19.5-2.5T442-141L242-249Zm238-203 274-148-274-148-274 148 274 148Zm0 241 200-108v-151l-161 89q-9 5-19 7.5t-20 2.5q-10 0-20-2.5t-19-7.5l-161-89v151l200 108Zm0-241Zm0 121Zm0 0Z",
    "license": "M395-475q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35Zm85 355L293-58q-20 7-36.5-5T240-95v-254q-38-42-59-96t-21-115q0-134 93-227t227-93q134 0 227 93t93 227q0 61-21 115t-59 96v254q0 20-16.5 32T667-58l-187-62Zm170-270q70-70 70-170t-70-170q-70-70-170-70t-170 70q-70 70-70 170t70 170q70 70 170 70t170-70ZM320-159l160-41 160 41v-124q-35 20-75.5 31.5T480-240q-44 0-84.5-11.5T320-283v124Zm160-62Z",
    "settings": "M433 -80Q406 -80 386.5 -98Q367 -116 363 -142L354 -208Q341 -213 329.5 -220Q318 -227 307 -235L245 -209Q220 -198 195 -207Q170 -216 156 -239L109 -321Q95 -344 101 -370Q107 -396 128 -413L181 -453Q180 -460 180 -466.5Q180 -473 180 -480Q180 -487 180 -493.5Q180 -500 181 -507L128 -547Q107 -564 101 -590Q95 -616 109 -639L156 -721Q170 -744 195 -753Q220 -762 245 -751L307 -725Q318 -733 330 -740Q342 -747 354 -752L363 -818Q367 -844 386.5 -862Q406 -880 433 -880H527Q554 -880 573.5 -862Q593 -844 597 -818L606 -752Q619 -747 630.5 -740Q642 -733 653 -725L715 -751Q740 -762 765 -753Q790 -744 804 -721L851 -639Q865 -616 859 -590Q853 -564 832 -547L779 -507Q780 -500 780 -493.5Q780 -487 780 -480Q780 -473 780 -466.5Q780 -460 778 -453L831 -413Q852 -396 858 -370Q864 -344 850 -321L802 -239Q788 -216 763 -207Q738 -198 713 -209L653 -235Q642 -227 630 -220Q618 -213 606 -208L597 -142Q593 -116 573.5 -98Q554 -80 527 -80ZM440 -160H519L533 -266Q564 -274 590.5 -289.5Q617 -305 639 -327L738 -286L777 -354L691 -419Q696 -433 698 -448.5Q700 -464 700 -480Q700 -496 698 -511.5Q696 -527 691 -541L777 -606L738 -674L639 -632Q617 -655 590.5 -670.5Q564 -686 533 -694L520 -800H441L427 -694Q396 -686 369.5 -670.5Q343 -655 321 -633L222 -674L183 -606L269 -542Q264 -527 262 -512Q260 -497 260 -480Q260 -464 262 -449Q264 -434 269 -419L183 -354L222 -286L321 -328Q343 -305 369.5 -289.5Q396 -274 427 -266ZM482 -340Q540 -340 581 -381Q622 -422 622 -480Q622 -538 581 -579Q540 -620 482 -620Q423 -620 382.5 -579Q342 -538 342 -480Q342 -422 382.5 -381Q423 -340 482 -340ZM480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Q480 -480 480 -480Z",
    "fold": "M200 -120Q167 -120 143.5 -143.5Q120 -167 120 -200V-760Q120 -793 143.5 -816.5Q167 -840 200 -840H760Q793 -840 816.5 -816.5Q840 -793 840 -760V-200Q840 -167 816.5 -143.5Q793 -120 760 -120ZM320 -200V-760H200Q200 -760 200 -760Q200 -760 200 -760V-200Q200 -200 200 -200Q200 -200 200 -200ZM400 -200H760Q760 -200 760 -200Q760 -200 760 -200V-760Q760 -760 760 -760Q760 -760 760 -760H400ZM320 -200H200Q200 -200 200 -200Q200 -200 200 -200Q200 -200 200 -200Q200 -200 200 -200H320Z"
  };
  const sideIcon = id => `<svg viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d="${SIDE_ICONS[id]}"/></svg>`;

  /* Side menu: a dashboard-style rail on the left. On phones it becomes a
     drawer behind a slim top bar. */
  function header(active) {
    const GROUPS = [
      { items: [["index.html", "Home", "home", "home"], ["browse.html", "Browse all", "browse", "browse-all"]] },
      { title: "Files", items: [["browse.html?cat=mockups", "Mockups", "mockups", "mockups"], ["browse.html?cat=vectors", "Vectors", "vectors", "vectors"],
        ["browse.html?cat=logos", "Logos", "logos", "logos"], ["browse.html?cat=templates", "Templates", "templates", "templates"], ["icons.html", "Icons", "icons", "icons"]] },
      { title: "Tools", items: [["palettes.html", "Palettes", "palettes", "palettes"], ["qr.html", "QR Code Studio", "qr", "qr", true], ["canvas.html", "Canvas", "canvas", "canvas", true]] },
      { title: "Studio", items: [["websites.html", "Websites", "websites", "websites", true]]
        .concat((DS.clientLogos || []).length ? [["portfolio.html", "Portfolio", "portfolio", "portfolio", true]] : [])
        .concat([["pricing.html", "Pricing", "pricing", "pricing"]]) },
      { title: "Help", items: [["learn.html", "Learn", "learn", "learn"], ["license.html", "License", "license", "license"]] }
    ];
    // A fifth `true` marks a page as new: it gets a NEW badge (a dot when the menu is folded)
    const link = ([href, label, key, ic, fresh]) =>
      `<a class="side-link${fresh ? " has-new" : ""}" href="${href}" data-label="${label}"${active === key ? ' aria-current="page"' : ""}>${sideIcon(ic)}<span>${label}</span>${fresh ? '<em class="side-new" data-no-i18n>New</em>' : ""}</a>`;
    const el = $("[data-header]");
    if (!el) return;
    el.outerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <header class="topbar">
        <a class="logo" href="index.html" aria-label="Draft Studio home"><img class="logo-l" src="assets/logo.svg" alt="Draft Studio" width="133" height="28"><img class="logo-d" src="assets/logo-dark.svg" alt="Draft Studio" width="133" height="28"></a>
        <button class="icon-btn" type="button" aria-label="Search" data-open-search>${icon("search")}</button>
        <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="side">${icon("menu")}</button>
      </header>
      <aside class="side" id="side" aria-label="Main">
        <div class="side-top">
          <a class="logo" href="index.html" aria-label="Draft Studio home">
            <img class="logo-full logo-l" src="assets/logo.svg" alt="Draft Studio" width="133" height="28">
            <img class="logo-full logo-d" src="assets/logo-dark.svg" alt="Draft Studio" width="133" height="28">
            <span class="logo-mark" aria-hidden="true"><img class="logo-l" src="assets/logo-mark.svg" alt="" width="28" height="28"><img class="logo-d" src="assets/logo-mark-dark.svg" alt="" width="28" height="28"></span>
          </a>
          <button class="side-fold" type="button" aria-label="Collapse menu" data-side-fold>${sideIcon("fold")}</button>
        </div>
        <nav class="side-nav" aria-label="Main">
          ${GROUPS.map(g => `<div class="side-group">${g.title ? `<p class="side-label">${g.title}</p>` : ""}${g.items.map(link).join("")}</div>`).join("")}
        </nav>
        <div class="side-foot">
          <button class="side-link set-btn" type="button" data-label="Settings" aria-expanded="false" aria-controls="settings" data-open-settings>${sideIcon("settings")}<span>Settings</span></button>
        </div>
      </aside>
      <div class="side-scrim" data-side-close></div>`;
  }

  function footer() {
    const el = $("[data-footer]");
    if (!el) return;
    const s = DS.site;
    const wa = s.whatsapp || "";
    const waPretty = wa.length > 9 ? `+${wa.slice(0, 2)} ${wa.slice(2, 4)} ${wa.slice(4, 7)} ${wa.slice(7)}` : wa;
    el.outerHTML = `
      <footer class="footer">
        <div class="wrap">
          <div class="fgrid">
            <div class="f-brand">
              <a class="logo" href="index.html" aria-label="Draft Studio home"><img class="f-logo-w" src="assets/logo-dark.svg" alt="Draft Studio" width="152" height="32"><img class="f-logo-k" src="assets/logo.svg" alt="Draft Studio" width="152" height="32"></a>
              <p>${esc(s.tagline)}</p>
            </div>
            <nav class="f-links" aria-label="Files">
              <h2>Files</h2>
              <ul>${CATS.map(c => `<li><a href="browse.html?cat=${c.slug}">${c.name}</a></li>`).join("")}<li><a href="icons.html">Icons</a></li><li><a href="palettes.html">Palettes</a></li><li><a href="qr.html">QR Code Studio</a></li><li><a href="canvas.html">Canvas</a></li></ul>
            </nav>
            <nav class="f-links" aria-label="Studio">
              <h2>Studio</h2>
              <ul>
                <li><a href="learn.html">Learn</a></li>
                <li><a href="license.html">License</a></li>
                <li><a href="license.html#faq">FAQ</a></li>
                <li><a href="${waLink("Hi Draft Studio, I'd like to request a design: ")}" target="_blank" rel="noopener">Request a design</a></li>
              </ul>
            </nav>
            <div class="f-links">
              <h2>Contact</h2>
              <ul>
                <li><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>
                ${wa ? `<li><a href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">${esc(waPretty)}</a></li>` : ""}
                ${s.instagram ? `<li><a href="${esc(s.instagram)}" target="_blank" rel="noopener">Instagram</a></li>` : ""}
              </ul>
            </div>
          </div>
          <div class="f-bottom">
            <span>© ${new Date().getFullYear()} ${esc(s.name)}</span>
            <a href="#top" data-top>Back to top ↑</a>
          </div>
        </div>
      </footer>`;
  }

  /* ---------- Search overlay ---------- */
  // Search results for a query: files, icons and categories (search pop-up and home search)
  function searchHtml(raw) {
    const input = { value: raw };
    const q = input.value.trim().toLowerCase();
    const hit = x => x.toLowerCase().includes(q);
    const its = items.filter(it => !q || hit([it.title, it.category, (it.tags || []).join(" "), formatsOf(it).join(" ")].join(" "))).slice(0, 6);
    const ics = q ? DS.icons.filter(i => hit([i.name, i.group, i.tags.join(" ")].join(" "))).slice(0, 6) : [];
    const cats = CATS.filter(c => !q || hit(c.name + " " + c.formats.join(" ")));
    let html = "";
    if (its.length) html += `<div class="group">Files</div>` + its.map(it => `
      <a href="${itemUrl(it)}"><span class="thumb"><img ${imgSrc(it.preview, "sm")} alt="" loading="lazy"></span>
        <span><span class="t">${esc(it.title)}</span><br><span class="s">${esc(it.category)} · ${formatsOf(it).join(", ")}</span></span></a>`).join("");
    if (ics.length) html += `<div class="group">Icons</div>` + ics.map(i => `
      <a href="icons.html#${i.id}"><span class="thumb">${libIcon(i.id)}</span>
        <span><span class="t">${esc(i.name)}</span><br><span class="s">Icon · ${esc(i.group)}</span></span></a>`).join("");
    if (cats.length) html += `<div class="group">Categories</div>` + cats.map(c => `
      <a href="browse.html?cat=${c.slug}"><span class="thumb">${icon("folder")}</span>
        <span><span class="t">${c.name}</span><br><span class="s">${c.formats.join(" · ")}</span></span></a>`).join("");
    if (q) html += `<a href="browse.html?q=${encodeURIComponent(input.value.trim())}"><span class="thumb">${icon("arrow-right")}</span><span><span class="t">See all results for “${esc(input.value.trim())}”</span></span></a>`;
    if (!its.length && !ics.length && !cats.length) html = `<div class="none">Nothing matches “${esc(input.value)}” yet.<br>Press Enter to search all files.</div>`;
    return html;
  }


  // Arrow keys move through results; Enter opens one, or all results for the query
  function searchKeys(e, input, results, active) {
    const links = $$("a", results);
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && links.length) {
      e.preventDefault();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle("is-active", i === active));
      links[active].scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (links[active]) location.href = links[active].href;
      else if (input.value.trim()) location.href = `browse.html?q=${encodeURIComponent(input.value.trim())}`;
    }
    return active;
  }

  /* Home: the big search bar above the headline, with results right under it */
  function heroSearch() {
    const form = $("[data-hsearch]");
    if (!form) return;
    const input = $("input", form), results = $("[data-hsearch-results]", form);
    let active = -1;
    const show = on => { form.classList.toggle("is-open", on); input.setAttribute("aria-expanded", on); };
    const render = () => { results.innerHTML = searchHtml(input.value); active = -1; show(true); };
    input.addEventListener("focus", render);
    input.addEventListener("input", render);
    input.addEventListener("keydown", e => {
      if (e.key === "Escape") { show(false); input.blur(); return; }
      active = searchKeys(e, input, results, active);
    });
    form.addEventListener("submit", e => { e.preventDefault(); if (input.value.trim()) location.href = `browse.html?q=${encodeURIComponent(input.value.trim())}`; else input.focus(); });
    document.addEventListener("pointerdown", e => { if (!form.contains(e.target)) show(false); });
    // Placeholder cycles through ideas while the field is empty and idle
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ideas = $$("[data-hsearch-ideas] span", form).map(x => x.textContent);
    let n = 0;
    if (!calm && ideas.length) setInterval(() => {
      if (document.activeElement === input || input.value) return;
      n = (n + 1) % ideas.length;
      input.classList.add("is-swap");
      setTimeout(() => { input.placeholder = ideas[n]; input.classList.remove("is-swap"); }, 220);
    }, 2800);
  }

  function searchModal() {
    const wrap = document.createElement("div");
    wrap.className = "search-modal";
    wrap.innerHTML = `
      <div class="search-box" role="dialog" aria-modal="true" aria-label="Search">
        <label class="search-field">${icon("search")}<span class="sr-only">Search</span>
          <input type="search" placeholder="Search mockups, logos, icons…" autocomplete="off">
          <span class="kbd">Esc</span>
        </label>
        <div class="search-results"></div>
      </div>`;
    document.body.appendChild(wrap);
    const input = $("input", wrap), results = $(".search-results", wrap);
    let active = -1;

    const render = () => {
      results.innerHTML = searchHtml(input.value);
      active = -1;
    };
    const open = () => { const mm = $("#mobile-menu.is-open"); if (mm) $(".menu-btn").click(); wrap.classList.add("is-open"); document.body.style.overflow = "hidden"; input.value = ""; render(); input.focus(); };
    const close = () => { wrap.classList.remove("is-open"); document.body.style.overflow = ""; };
    input.addEventListener("input", render);
    input.addEventListener("keydown", e => { active = searchKeys(e, input, results, active); });
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && wrap.classList.contains("is-open")) close();
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        e.preventDefault();
        const hs = $("[data-hsearch] input");
        if (hs) { hs.scrollIntoView({ block: "center", behavior: "smooth" }); hs.focus({ preventScroll: true }); } else open();
      }
    });
    $$("[data-open-search]").forEach(b => b.addEventListener("click", open));
  }

  /* ---------- Shared behaviour ---------- */
  function chrome() {
    // The page sits on a raised panel beside the side menu
    const main = $("main"), foot = $(".footer");
    if (main) {
      const shell = document.createElement("div");
      shell.className = "shell";
      main.before(shell);
      shell.append(main);
      if (foot) shell.append(foot);
    }

    const bar = $(".topbar");
    const onScroll = () => bar && bar.classList.toggle("is-scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    // Desktop: fold the menu down to an icon rail (remembered). Phones: drawer.
    const root = document.documentElement, side = $("#side"), mb = $(".menu-btn");
    const fold = $("[data-side-fold]");
    const setRail = on => {
      if (on) root.dataset.rail = ""; else delete root.dataset.rail;
      fold.setAttribute("aria-label", on ? "Expand menu" : "Collapse menu");
      try { on ? localStorage.setItem("ds-rail", "1") : localStorage.removeItem("ds-rail"); } catch (e) {}
    };
    fold && fold.addEventListener("click", () => { side.classList.remove("is-peek"); setRail(!root.hasAttribute("data-rail")); });
    // Folded: hovering (or tabbing into) the rail slides the full menu out over the page
    let peekT = 0;
    const peek = (on, wait) => {
      clearTimeout(peekT);
      peekT = setTimeout(() => side.classList.toggle("is-peek", on && root.hasAttribute("data-rail") && matchMedia("(min-width: 1024px)").matches), wait);
    };
    if (side) {
      side.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") peek(true, 90); });
      side.addEventListener("pointerleave", () => peek(false, 160));
      side.addEventListener("focusin", () => peek(true, 0));
      side.addEventListener("focusout", e => { if (!side.contains(e.relatedTarget)) peek(false, 0); });
    }
    if (fold) fold.setAttribute("aria-label", root.hasAttribute("data-rail") ? "Expand menu" : "Collapse menu");
    const setDrawer = open => {
      side.classList.toggle("is-open", open);
      document.body.classList.toggle("side-open", open);
      mb.setAttribute("aria-expanded", open);
      mb.innerHTML = icon(open ? "close" : "menu");
      document.body.style.overflow = open ? "hidden" : "";
    };
    window.DSCloseDrawer = () => side.classList.contains("is-open") && setDrawer(false);
    mb && mb.addEventListener("click", () => setDrawer(!side.classList.contains("is-open")));
    $("[data-side-close]").addEventListener("click", () => setDrawer(false));
    document.addEventListener("keydown", e => { if (e.key === "Escape" && side.classList.contains("is-open")) setDrawer(false); });
    matchMedia("(min-width: 1024px)").addEventListener("change", e => e.matches && window.DSCloseDrawer());
    $$("[data-open-search]").forEach(b => b.addEventListener("click", () => window.DSCloseDrawer()));

    $$("[data-top]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); scrollTo({ top: 0 }); }));
    searchModal();
  }

  function reveal(root = document) {
    const els = $$(".reveal:not(.is-in)", root);
    if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("is-in")); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e, i) => { e.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(e); });
  }

  /* =====================================================================
     PAGES
     ===================================================================== */

  /* ---------- Home ---------- */
  function home() {
    // Logos shelf: the three newest logos, each on its own brand colour (its second preview when it has one)
    const stack = $("[data-logo-stack]");
    if (stack) {
      const logos = items.filter(it => it.category === "Logos" && !it.sold).slice(0, 3);
      if (logos.length) stack.innerHTML = logos.map(it => `<span><img ${imgSrc((it.gallery && it.gallery[0]) || it.preview, "sm")} alt="" loading="lazy"></span>`).join("");
      stack.dataset.n = logos.length;
    }
    heroFx();
    heroSearch();

    $$("[data-item-count]").forEach(el => { el.textContent = items.length; });
    $$("[data-icon-total]").forEach(el => { el.textContent = DS.icons.length; });
    $$("[data-icon-groups]").forEach(el => { el.textContent = new Set(DS.icons.map(i => i.group)).size; });

    // Shelves: file counts, and open a panel on hover / focus
    $$("[data-cat-count]").forEach(el => {
      const n = items.filter(i => slug(i.category) === el.dataset.catCount).length;
      el.textContent = n ? `${n} file${n === 1 ? "" : "s"}` : "Coming soon";
    });
    const shelves = $("[data-shelves]");
    if (shelves) {
      const panels = $$(".shelf", shelves);
      const open = p => panels.forEach(x => x.classList.toggle("is-open", x === p));
      panels.forEach(p => {
        p.addEventListener("mouseenter", () => { if (matchMedia("(hover: hover)").matches) open(p); });
        p.addEventListener("focus", () => open(p));
      });
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { shelves.classList.add("in-view"); io.disconnect(); } }), { threshold: .3 });
        io.observe(shelves);
      }
    }

    // Fresh drops: a featured latest drop, the next ones beside it, and a request card
    const drops = $("[data-latest]"), seg = $("[data-latest-filters]");
    if (drops) {
      const thumb = $(".seg-thumb", seg);
      seg.insertAdjacentHTML("beforeend", [{ name: "All", slug: "all" }].concat(CATS).map((c, i) => {
        const n = c.slug === "all" ? items.length : items.filter(it => slug(it.category) === c.slug).length;
        return `<button type="button" data-cat="${c.slug}" aria-pressed="${i === 0}">${c.name}<span class="n">${n}</span></button>`;
      }).join(""));
      const moveThumb = () => {
        const b = $("[aria-pressed=true]", seg); if (!b) return;
        thumb.style.width = b.offsetWidth + "px";
        thumb.style.transform = `translateX(${b.offsetLeft}px)`;
      };
      const draw = cat => {
        const list = items.filter(i => cat === "all" || slug(i.category) === cat).slice(0, 5);
        const c = catOf(cat);
        const latest = list[0];
        $("[data-drops-note]").textContent = latest ? `Last drop ${ago(latest.date)}` : "";
        if (!list.length) { drops.className = "drops is-empty"; drops.innerHTML = requestCard(c, true); reveal(drops); return; }
        const [first, ...rest] = list;
        drops.className = "drops n" + Math.min(rest.length, 4);
        drops.innerHTML = featuredDrop(first) + rest.slice(0, 3).map(dropCard).join("") + requestCard(c);
        reveal(drops);
      };
      seg.addEventListener("click", e => {
        const b = e.target.closest("[data-cat]"); if (!b) return;
        $$("[data-cat]", seg).forEach(x => x.setAttribute("aria-pressed", x === b));
        moveThumb();
        draw(b.dataset.cat);
      });
      addEventListener("resize", moveThumb);
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(moveThumb);
      moveThumb();
      draw("all");
    }


    const lx = $("[data-lx]");
    if (lx) licenseChecker(lx);

    // Icon showcase: colour swatches, hover preview, icon grid
    const pt = $("[data-pt]");
    if (pt) paletteTeaser(pt);

    const qt = $("[data-qt]");
    if (qt) qrTeaser(qt);

    const ix = $("[data-ix]");
    if (ix) {
      const grid = $("[data-ix-grid]", ix), sw = $("[data-ix-swatches]", ix);
      const picks = ["pen-tool", "brush", "palette", "layers", "magic", "camera", "image", "crop",
        "rocket", "bolt", "heart", "star", "globe", "music", "coffee", "gift",
        "cloud", "sun", "leaf", "map-pin", "plane", "car", "trophy", "lightbulb",
        "home", "search", "user", "bell", "mail", "chat", "share", "download",
        "cart", "bag", "wallet", "tag", "calendar", "clock", "lock", "smile"].map(id => DS.icons.find(i => i.id === id)).filter(Boolean);
      // White, then the "Playground" palette from js/data.js
      const play = ((DS.palettes || []).find(p => p.name === "Playground") || { colors: [] }).colors;
      const NAMES = { "#ff595e": "Red", "#ffca3a": "Yellow", "#8ac926": "Green", "#1982c4": "Blue", "#6a4c93": "Purple" };
      const colours = [["White", "#ffffff"]].concat(play.map(c => [NAMES[c] || c, c]));
      sw.innerHTML = colours.map(([n, c], i) => `<button type="button" style="--sw:${c}" aria-label="${n}" aria-pressed="${i === 0}" data-c="${c}"></button>`).join("");
      grid.innerHTML = picks.map(i => `<a href="icons.html#${i.id}" data-id="${i.id}" aria-label="${esc(i.name)} icon">${libIcon(i.id)}</a>`).join("");
      const show = ic => {
        $("[data-ix-big]", ix).innerHTML = libIcon(ic.id);
        $("[data-ix-name]", ix).textContent = ic.name;
        $("[data-ix-group]", ix).textContent = ic.group + " icon";
        $("[data-ix-link]", ix).href = `icons.html#${ic.id}`;
        $$("a", grid).forEach(a => a.classList.toggle("is-on", a.dataset.id === ic.id));
      };
      grid.addEventListener("mouseover", e => { const a = e.target.closest("[data-id]"); if (a) show(DS.icons.find(i => i.id === a.dataset.id)); });
      grid.addEventListener("focusin", e => { const a = e.target.closest("[data-id]"); if (a) show(DS.icons.find(i => i.id === a.dataset.id)); });
      sw.addEventListener("click", e => {
        const b = e.target.closest("[data-c]"); if (!b) return;
        ix.style.setProperty("--ic", b.dataset.c);
        ix.classList.add("is-tinted");
        $$("button", sw).forEach(x => x.setAttribute("aria-pressed", x === b));
      });
      show(picks[0]);
    }

    // CTA links
    $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-mail]").forEach(a => { a.href = mailLink(a.dataset.mail); });
  }

  /* ---------- Hero effects (home) ---------- */
  function heroFx() {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onScreen = (el, fn, threshold = .2) => {
      if (!("IntersectionObserver" in window)) return fn(true);
      new IntersectionObserver(es => es.forEach(e => fn(e.isIntersecting)), { threshold }).observe(el);
    };

    // Rotating word: mockup → logo → vector → template → icon
    const rot = $("[data-rotator]");
    if (rot) {
      const words = $$("span", rot);
      let i = 0;
      // On narrow screens the word gets a line of its own so the headline doesn't reflow on every change
      const fit = () => {
        rot.classList.toggle("is-fixed", innerWidth < 900);
        rot.style.width = words[i].getBoundingClientRect().width + "px";
      };
      (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
      addEventListener("resize", fit);
      if (!calm) setInterval(() => {
        const prev = words[i];
        i = (i + 1) % words.length;
        prev.classList.remove("is-on"); prev.classList.add("is-out");
        words[i].classList.remove("is-out"); words[i].classList.add("is-on");
        setTimeout(() => prev.classList.remove("is-out"), 750);
        fit();
      }, 2400);
    }

    // Spotlight and floating chips follow the pointer
    const panel = $("[data-hero]");
    if (panel && matchMedia("(hover: hover)").matches && !calm) {
      const chips = $$(".fchip", panel);
      panel.addEventListener("pointermove", e => {
        const r = panel.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        panel.style.setProperty("--mx", x + "px");
        panel.style.setProperty("--my", y + "px");
        panel.classList.add("is-lit");
        const dx = x / r.width - .5, dy = y / r.height - .5;
        chips.forEach((c, n) => {
          const depth = [18, 26, 12][n] || 16;
          c.style.setProperty("--px", (-dx * depth) + "px");
          c.style.setProperty("--py", (-dy * depth) + "px");
        });
      });
      panel.addEventListener("pointerleave", () => panel.classList.remove("is-lit"));
    }

    // Photo card: crossfading slideshow of the mockups, with story-style bars
    const box = $("[data-slides]");
    if (box) {
      const slides = items.filter(i => slug(i.category) === "mockups").slice(0, 5);
      if (!slides.length) slides.push(...items.slice(0, 3));
      const pos = { "t-shirt-mockup-one": "30%", "hoodie-mockup-one": "42%" };
      box.insertAdjacentHTML("afterbegin", slides.map((it, n) => `<figure class="slide${n === 0 ? " is-on" : ""}" style="--pos:${pos[it.id] || "40%"}"><img ${imgSet(it.preview, "(max-width: 900px) 92vw, 60vw")} alt="${esc(it.title)}"${n ? ' loading="lazy"' : ' fetchpriority="high"'} decoding="async"></figure>`).join(""));
      const figs = $$(".slide", box), bars = $(".slides-bars", box), link = $(".slides-link", box), title = $("[data-slide-title]", box);
      bars.innerHTML = slides.length > 1 ? slides.map(() => "<i></i>").join("") : "";
      let n = 0, t = null;
      const go = k => {
        n = k;
        figs.forEach((f, j) => f.classList.toggle("is-on", j === n));
        $$("i", bars).forEach((b, j) => { b.className = j < n ? "done" : ""; });
        const bar = $$("i", bars)[n]; if (bar) { void bar.offsetWidth; bar.className = "is-on"; }
        link.href = itemUrl(slides[n]);
        link.setAttribute("aria-label", slides[n].title);
        title.textContent = `${slides[n].title.split("—")[0].trim()} · ${isPaid(slides[n]) ? priceText(slides[n]) : "free " + (formatsOf(slides[n])[0] || "")}`;
        title.style.animation = "none"; void title.offsetWidth; title.style.animation = "";
      };
      go(0);
      if (slides.length > 1 && !calm) {
        const start = () => { if (!t) t = setInterval(() => go((n + 1) % slides.length), 5000); };
        const stop = () => { clearInterval(t); t = null; };
        onScreen(box, vis => vis ? start() : stop());
      }
    }

    // Dot card: a pixel download arrow falls through the grid; "100%" counts up
    const dots = $("[data-dots]");
    if (dots) {
      const COLS = 7, ROWS = 5;
      dots.innerHTML = Array.from({ length: COLS * ROWS }, () => "<i></i>").join("");
      const cells = $$("i", dots);
      const ARROW = ["...X...", "...X...", ".X.X.X.", "..XXX..", "...X..."];
      const period = ROWS + ARROW.length + 2;
      let step = 0, timer = null;
      const paint = () => {
        cells.forEach((c, k) => {
          const r = Math.floor(k / COLS), col = k % COLS;
          const ar = r - (step - ARROW.length);
          const lit = ar >= 0 && ar < ARROW.length && ARROW[ar][col] === "X";
          const trail = !lit && ar - 1 >= 0 && ar - 1 < ARROW.length && ARROW[ar - 1][col] === "X";
          c.className = lit ? "on" : trail ? "trail" : "";
        });
      };
      if (calm) { step = ARROW.length; paint(); }
      else onScreen(dots, vis => {
        clearInterval(timer); timer = null;
        if (vis) timer = setInterval(() => { step = (step + 1) % period; paint(); }, 160);
      });
      const num = $("[data-count-to]");
      if (num && !calm) {
        let done = false;
        onScreen(num, vis => {
          if (!vis || done) return; done = true;
          const to = +num.dataset.countTo, t0 = performance.now();
          const tick = now => { const p = Math.min(1, (now - t0) / 1400); num.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
          requestAnimationFrame(tick);
        }, .6);
      }
    }
  }

  /* ---------- Format explorer (home) ---------- */
  const APPS = {
    photoshop: { name: "Photoshop", icon: "photoshop" },
    photopea: { name: "Photopea", icon: "photopea", free: true },
    affinity: { name: "Affinity", icon: "affinity" },
    illustrator: { name: "Illustrator", icon: "illustrator" },
    inkscape: { name: "Inkscape", icon: "inkscape", free: true },
    figma: { name: "Figma", icon: "figma", free: true },
    canva: { name: "Canva", icon: "canva", free: true }
  };
  const FORMATS = [
    { ext: "PSD", name: "Photoshop documents", short: "Layered mockups and templates",
      desc: "Layered files with smart objects. Double-click the smart object, paste your design, save, and the mockup updates with realistic lighting and folds.",
      best: ["Mockups", "Social templates", "Photo edits"], apps: ["photoshop", "photopea", "affinity"] },
    { ext: "AI", name: "Illustrator artwork", short: "The original vector source",
      desc: "The master file. Every shape, colour and letter stays fully editable, so you can rename a logo, recolour it or pull it apart.",
      best: ["Logos", "Illustrations", "Brand assets"], apps: ["illustrator", "affinity", "inkscape"] },
    { ext: "SVG", name: "Scalable vectors", short: "Works almost everywhere",
      desc: "Lightweight vectors that stay razor sharp at any size. Drop them into websites, Figma, Canva or a Cricut and they just work.",
      best: ["Websites", "Icons", "Cut files"], apps: ["figma", "canva", "inkscape"] },
    { ext: "EPS", name: "Print-ready vectors", short: "What printers ask for",
      desc: "The classic vector format for print shops, sign makers and embroidery. Send it as is and it prints crisp at any size.",
      best: ["Signage", "Merch printing", "Embroidery"], apps: ["illustrator", "affinity", "inkscape"] },
    { ext: "PDF", name: "Share & print", short: "Send it anywhere",
      desc: "Opens on any device. Vector PDFs keep their sharp edges, so they're perfect for client previews and sending straight to print.",
      best: ["Client previews", "Print", "Presentations"], apps: ["illustrator", "affinity", "canva"] },
    { ext: "PNG", name: "Ready to post", short: "Transparent, high-res images",
      desc: "High-resolution images with transparent backgrounds. No design app needed: post it, place it, or drop it into a slide.",
      best: ["Social posts", "Slides", "Quick use"], apps: ["canva", "figma", "photopea"] }
  ];

  function formatExplorer(root) {
    const ARROW = icon("arrow-right");
    root.innerHTML = `
      <div class="fx-list" role="tablist" aria-label="File formats">
        ${FORMATS.map((f, i) => `
          <button class="fx-row" type="button" role="tab" id="fx-tab-${f.ext}" aria-controls="fx-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">
            <span class="ext">.${f.ext.toLowerCase()}</span>
            <span class="meta"><b>${f.name}</b><span>${f.short}</span></span>
            <span class="go">${ARROW}</span>
            <span class="bar"></span>
          </button>`).join("")}
      </div>
      <div class="fx-panel" id="fx-panel" role="tabpanel"></div>`;
    const panel = $(".fx-panel", root), rows = $$(".fx-row", root);
    let cur = 0, timer = null;

    const show = (i, focus) => {
      cur = i;
      const f = FORMATS[i];
      const n = items.filter(it => formatsOf(it).includes(f.ext)).length;
      root.dataset.f = f.ext;
      rows.forEach((r, j) => { r.setAttribute("aria-selected", j === i); r.tabIndex = j === i ? 0 : -1; });
      if (focus) rows[i].focus();
      panel.setAttribute("aria-labelledby", "fx-tab-" + f.ext);
      panel.innerHTML = `
        <span class="watermark" aria-hidden="true">.${f.ext.toLowerCase()}</span>
        <div class="fx-top fx-anim">
          <div class="fx-doc" aria-hidden="true"><i></i><i></i><i></i><i></i><span class="tag">${f.ext}</span></div>
          <div class="fx-head">
            <span class="eyebrow"><span class="dot"></span>.${f.ext.toLowerCase()} file</span>
            <h3>${f.name}</h3>
          </div>
        </div>
        <p class="fx-desc fx-anim">${f.desc}</p>
        <div class="fx-anim">
          <span class="fx-label">Opens in</span>
          <div class="fx-apps">${f.apps.map(a => APPS[a]).map(a => `<span class="fx-app"><img src="assets/apps/${a.icon}.svg" alt="">${a.name}${a.free ? " <small>Free</small>" : ""}</span>`).join("")}</div>
        </div>
        <div class="fx-anim">
          <span class="fx-label">Best for</span>
          <div class="fx-best">${f.best.map(b => `<span>${b}</span>`).join("")}</div>
        </div>
        <div class="fx-foot fx-anim">
          <a class="btn btn-dark btn-lg" href="browse.html?format=${f.ext}">Browse .${f.ext.toLowerCase()} files <span class="arr">${ARR}</span></a>
          <span class="count">${n ? `${n} file${n === 1 ? "" : "s"} available` : "New files coming soon"}</span>
        </div>`;
      panel.classList.remove("is-swapping"); void panel.offsetWidth; panel.classList.add("is-swapping");
    };

    // Auto-advance like a slideshow until the visitor interacts with it
    const stopAuto = () => { clearInterval(timer); timer = null; root.classList.remove("is-auto"); };
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("is-auto");
      timer = setInterval(() => show((cur + 1) % FORMATS.length), 6000);
    }

    rows.forEach((r, i) => {
      r.addEventListener("click", () => { stopAuto(); show(i); });
      r.addEventListener("mouseenter", () => { if (matchMedia("(hover: hover)").matches) { stopAuto(); show(i); } });
      r.addEventListener("keydown", e => {
        const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); stopAuto(); show((cur + d + FORMATS.length) % FORMATS.length, true); }
      });
    });
    panel.addEventListener("pointerenter", stopAuto);
    show(0);
  }

  /* ---------- License checker (home) ---------- */
  const USES = [
    { q: "Client work", tone: "yes", a: "Use any free file in work you deliver to clients, and charge for that work." },
    { q: "Merch you sell", tone: "yes", a: "T-shirts, hoodies, mugs, stickers. Put our designs in your product and sell it." },
    { q: "Social media posts", tone: "yes", a: "Posts, stories, ads and thumbnails. No credit needed (a tag is always nice)." },
    { q: "Websites & apps", tone: "yes", a: "Icons, logos and graphics in sites and apps, personal or commercial." },
    { q: "Print & packaging", tone: "yes", a: "Flyers, posters, labels, boxes. Print as many copies as you need." },
    { q: "Pitch decks", tone: "yes", a: "Make your slides look expensive. Nobody needs to know." },
    { q: "My own brand logo", tone: "but", a: "You can, but free logos can be downloaded by anyone. For a logo only you own, buy an exclusive one." },
    { q: "Reselling the files", tone: "no", a: "Please don't sell our files as they are, alone or in a bundle. Make something new with them instead." },
    { q: "Re-uploading them", tone: "no", a: "Don't post our files on other download sites. Link to Draft Studio instead, so people get the latest version." },
    { q: "Claiming you made them", tone: "no", a: "Use them in your work, sure. Just don't present the original files as your own design." }
  ];
  const WORD = { yes: "Yes.", no: "No.", but: "Yes, but…" };
  const STAMP = { yes: "Free to<br>use", no: "Not<br>allowed", but: "Read the<br>fine print" };

  function licenseChecker(root) {
    const ticket = $("[data-lx-ticket]", root), uses = $("[data-lx-uses]", root);
    const mark = t => t === "yes" ? icon("check") : t === "no" ? icon("close") : icon("lightbulb");
    uses.innerHTML = USES.map((u, i) => `<button type="button" data-i="${i}" data-tone="${u.tone}" aria-pressed="${i === 0}"><i>${mark(u.tone)}</i>${esc(u.q)}</button>`).join("");
    const show = i => {
      const u = USES[i];
      ticket.dataset.tone = u.tone;
      ticket.innerHTML = `
        <span class="lx-stamp" aria-hidden="true">${STAMP[u.tone]}</span>
        <p class="lx-q lx-anim">Can I use Draft Studio files for <b>${esc(u.q.toLowerCase())}</b>?</p>
        <div class="lx-a lx-anim"><span class="word">${WORD[u.tone]}</span><p>${esc(u.a)}</p></div>
        <div class="lx-foot"><span>Draft Studio license</span><span>Free files · v1</span></div>`;
      ticket.classList.remove("is-swap"); void ticket.offsetWidth; ticket.classList.add("is-swap");
      $$("button", uses).forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i));
    };
    uses.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) show(+b.dataset.i); });
    uses.addEventListener("mouseover", e => { const b = e.target.closest("[data-i]"); if (b && matchMedia("(hover: hover)").matches && b.getAttribute("aria-pressed") !== "true") show(+b.dataset.i); });
    show(0);
  }

  /* ---------- Palettes teaser (home) ---------- */
  // Cycles through a few hand-picked palettes; click a swatch to copy it, a row to jump to it.
  function paletteTeaser(root) {
    const P = DS.palettes || [];
    const picks = [0, 4, 7, 16, 9, 25, 33, 5].filter(i => P[i]);
    if (!picks.length) return;
    const sw = $("[data-pt-sw]", root), rows = $("[data-pt-rows]", root), dots = $("[data-pt-dots]", root), meta = $(".pt-meta", root);
    const max = Math.max(...picks.map(i => P[i].colors.length));
    sw.innerHTML = Array.from({ length: max }, (_, k) => `<button type="button" style="--i:${k}"><span></span></button>`).join("");
    dots.innerHTML = picks.map(() => "<i></i>").join("");
    let n = 0, timer = 0;
    const show = k => {
      n = (k + picks.length) % picks.length;
      const p = P[picks[n]];
      $$("button", sw).forEach((b, i) => {
        const c = p.colors[i];
        b.hidden = !c; if (!c) return;
        b.style.setProperty("--c", c); b.style.setProperty("--ink", inkOn(c));
        b.dataset.copy = c; b.setAttribute("aria-label", `Copy ${c}`);
        $("span", b).textContent = c.slice(1).toUpperCase();
      });
      $("[data-pt-name]", root).textContent = p.name;
      $("[data-pt-mood]", root).textContent = `${p.mood} · ${p.colors.length} colours`;
      $("[data-pt-open]", root).href = "palettes.html#" + p.colors.map(c => c.slice(1)).join("-");
      $$("i", dots).forEach((d, i) => d.classList.toggle("on", i === n));
      rows.innerHTML = [1, 2, 3].map(d => {
        const j = (n + d) % picks.length, q = P[picks[j]];
        return `<button type="button" data-pt-go="${j}" style="--i:${d - 1}" aria-label="Show ${esc(q.name)}">${q.colors.map(c => `<i style="background:${c}"></i>`).join("")}</button>`;
      }).join("");
      // Restart the swap choreography: colour wave, sheen, labels and rows ease in
      [sw, meta, rows].forEach(el => { el.classList.remove("is-swap"); void el.offsetWidth; el.classList.add("is-swap"); });
    };
    const play = () => { clearInterval(timer); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => show(n + 1), 3200); };
    rows.addEventListener("click", e => { const b = e.target.closest("[data-pt-go]"); if (b) { show(+b.dataset.ptGo); play(); } });
    dots.addEventListener("click", e => { const i = $$("i", dots).indexOf(e.target); if (i > -1 && i !== n) { show(i); play(); } });
    sw.addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copy(b.dataset.copy.toUpperCase(), `${b.dataset.copy.toUpperCase()} copied`); });
    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", play);
    show(0); play();
  }

  /* ---------- QR Studio teaser (home) ---------- */
  // A live QR code that morphs between looks in a ripple, gets "scanned" by a laser
  // and tilts in 3D toward the pointer. Every module is its own <rect>, so shape,
  // size, rotation and colour all animate with plain CSS transitions.
  function qrTeaser(root) {
    if (!window.qrcode) return;
    const q = window.qrcode(0, "M");
    q.addData("https://arclay2026.github.io/DraftStudio/qr.html");
    q.make();
    const n = q.getModuleCount(), m = 2, S = n + m * 2, mid = (n - 1) / 2;
    const finder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    const svg = $("[data-qt-svg]", root);
    svg.setAttribute("viewBox", `0 0 ${S} ${S}`);
    let cells = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y) || !q.isDark(y, x)) continue;
      const d = Math.hypot(x - mid, y - mid);
      cells += `<rect class="qt-m" x="${x + m}" y="${y + m}" width="1" height="1" style="--d:${d.toFixed(2)};--px:${(x / n).toFixed(3)};--py:${(y / n).toFixed(3)}"/>`;
    }
    const eyes = [[0, 0], [n - 7, 0], [0, n - 7]].map(([x, y]) =>
      `<rect class="qt-ring" x="${x + m + .5}" y="${y + m + .5}" width="6" height="6"/><rect class="qt-ball" x="${x + m + 2}" y="${y + m + 2}" width="3" height="3"/>`).join("");
    svg.innerHTML = `<rect class="qt-bg" width="${S}" height="${S}"/>${cells}${eyes}`;
    const mods = $$(".qt-m", svg), card = $("[data-qt-card]", root);

    const LOOKS = [
      { name: "Studio",  rx: .28, s: .9,  rot: 0,  c1: "#0f0f0f", c2: "#0f0f0f", bg: "#ffffff", ring: 1.6, ball: .8 },
      { name: "Neon",    rx: .5,  s: .84, rot: 0,  c1: "#2de2e6", c2: "#f6019d", bg: "#0d0221", ring: 3,   ball: 1.5 },
      { name: "Diamond", rx: .06, s: .74, rot: 45, c1: "#283618", c2: "#606c38", bg: "#fefae0", ring: .6,  ball: .2, eye: "#bc6c25" },
      { name: "Sunset",  rx: .5,  s: .9,  rot: 0,  c1: "#c2410c", c2: "#7f1d1d", bg: "#fff7ed", ring: 2.2, ball: 1.5 },
      { name: "Classic", rx: 0,   s: 1,   rot: 0,  c1: "#0f0f0f", c2: "#0f0f0f", bg: "#ffffff", ring: 0,   ball: 0 },
      { name: "Ocean",   rx: .5,  s: .82, rot: 0,  c1: "#00b4d8", c2: "#03045e", bg: "#eaf6fb", ring: 3,   ball: .7 },
      { name: "Violet",  rx: .2,  s: .7,  rot: 45, c1: "#7b2cbf", c2: "#f72585", bg: "#ffffff", ring: 1.2, ball: 1.5 }
    ];
    const mix = (a, b, t) => { const A = hexRgb(a), B = hexRgb(b); return rgbHex(...A.map((v, i) => v + (B[i] - v) * t)); };
    const dots = $("[data-qt-dots]", root);
    dots.innerHTML = LOOKS.map(() => "<i></i>").join("");
    let n0 = 0;
    const apply = k => {
      n0 = (k + LOOKS.length) % LOOKS.length;
      const L = LOOKS[n0];
      root.style.setProperty("--qt-bg", L.bg);
      root.style.setProperty("--qt-rx", L.rx);
      root.style.setProperty("--qt-s", L.s);
      root.style.setProperty("--qt-rot", L.rot + "deg");
      root.style.setProperty("--qt-ring", L.ring);
      root.style.setProperty("--qt-ball", L.ball);
      root.style.setProperty("--qt-eye", L.eye || L.c1);
      root.style.setProperty("--qt-glow", L.c2 === L.c1 ? "#1f7aff" : L.c2);
      // Each module takes its own colour along the diagonal, so gradients morph smoothly too
      mods.forEach(r => { const t = (+r.style.getPropertyValue("--px") + +r.style.getPropertyValue("--py")) / 2; r.style.fill = mix(L.c1, L.c2, t); });
      $("[data-qt-name]", root).textContent = L.name;
      $$("[data-qt-sw]", root).forEach((s, i) => { s.style.background = [L.c1, L.c2, L.bg][i]; });
      $$("i", dots).forEach((d, i) => d.classList.toggle("on", i === n0));
      card.classList.remove("is-scan"); void card.offsetWidth; card.classList.add("is-scan");
    };

    // Autoplay only while the card is on screen
    let timer = 0, visible = false;
    const play = () => { clearInterval(timer); if (visible && !matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => apply(n0 + 1), 3600); };
    let started = false;
    if ("IntersectionObserver" in window) new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && !started) { started = true; apply(n0); } // first view: replay the ripple build
      play();
    }, { threshold: .3 }).observe(root);
    dots.addEventListener("click", e => { const i = $$("i", dots).indexOf(e.target); if (i > -1) { apply(i); play(); } });

    // Smooth 3D tilt toward the pointer (eased every frame)
    const stage = $("[data-qt-stage]", root), tilt = $("[data-qt-tilt]", root);
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      tilt.style.transform = `rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg)`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .01 ? requestAnimationFrame(loop) : 0;
    };
    const aim = (x, y) => { tx = x; ty = y; if (!raf) raf = requestAnimationFrame(loop); };
    if (matchMedia("(hover: hover)").matches) {
      stage.addEventListener("pointermove", e => { const r = stage.getBoundingClientRect(); aim(((e.clientX - r.left) / r.width - .5) * 16, -((e.clientY - r.top) / r.height - .5) * 16); });
      stage.addEventListener("pointerleave", () => aim(0, 0));
    }
    apply(0);
  }

  /* ---------- Fresh drops pieces (home) ---------- */
  function ago(date) {
    if (!date) return "";
    const days = Math.round((Date.now() - new Date(date + "T00:00").getTime()) / 864e5);
    const rtf = new Intl.RelativeTimeFormat(LANG, { numeric: "auto" });
    if (days <= 0) return rtf.format(0, "day");
    if (days === 1) return rtf.format(-1, "day");
    if (days < 7) return rtf.format(-days, "day");
    if (days < 31) return rtf.format(-Math.round(days / 7), "week");
    if (days < 365) return rtf.format(-Math.round(days / 30), "month");
    return rtf.format(-Math.round(days / 365), "year");
  }

  function dropAction(it) {
    if (isPaid(it)) return { label: `Buy · ${priceText(it)}`, href: itemUrl(it) };
    const files = it.files || [];
    const zip = files.find(f => f.format.toUpperCase() === "ZIP");
    const one = files.length === 1 ? files[0] : null;
    const f = zip || one;
    if (f) return { label: `Download free ${zip ? "· all formats" : "· ." + f.format.toLowerCase()}`, href: f.path, ext: isExternal(f.path), dl: !isExternal(f.path) };
    return { label: "Get it free", href: itemUrl(it) };
  }

  function featuredDrop(it) {
    const a = dropAction(it);
    return `
      <article class="drop drop-feat reveal">
        <img ${imgSet(it.preview, "(max-width: 900px) 92vw, 55vw")} alt="" loading="lazy" decoding="async">
        <div class="drop-top">
          <span class="drop-new"><i></i>Latest drop</span>
        </div>
        <div class="drop-panel">
          <div class="drop-meta"><span>${it.num}</span><span>${esc(it.category)}</span><span>Added ${ago(it.date)}</span></div>
          <h3><a href="${itemUrl(it)}">${esc(it.title)}</a></h3>
          ${it.specs ? `<div class="drop-fmts"><span class="drop-spec">${esc(it.specs.split("·")[0].trim())}</span></div>` : ""}
          <div class="drop-actions">
            <a class="btn ${/^Download/.test(a.label) ? "btn-dl" : "btn-dark"}" href="${esc(a.href)}"${a.ext ? ' target="_blank" rel="noopener"' : ""}${a.dl ? " download" : ""}>${esc(a.label)} <span class="arr${a.ext ? " gd-arr" : ""}">${a.ext ? DRIVE : ARR}</span></a>
            <a class="btn" href="${itemUrl(it)}">Details</a>
          </div>
        </div>
      </article>`;
  }

  function dropCard(it) {
    return `
      <article class="drop drop-card reveal">
        <img ${imgSrc(it.preview, "sm")} alt="" loading="lazy" decoding="async">
        <div class="drop-info">
          <span><b><a href="${itemUrl(it)}">${esc(it.title)}</a></b><small>${esc(it.category)} · ${ago(it.date)}</small></span>
          <span class="go" aria-hidden="true">${ARR}</span>
        </div>
      </article>`;
  }

  function requestCard(cat, empty) {
    const what = cat ? cat.name.toLowerCase().replace(/s$/, "") : "design";
    return `
      <article class="drop drop-req reveal">
        <span class="req-icon">${icon("plus")}</span>
        <div>
          <h3>${empty ? `Fresh ${esc(cat ? cat.name.toLowerCase() : "files")} <br>are on the way.` : `Your ${esc(what)} <br>could be next.`}</h3>
          <p>${empty ? "Nothing on this shelf yet. Tell us what you'd like and it could be the first drop." : "Tell us what you need. Popular requests become free drops for everyone."}</p>
        </div>
        <a class="btn btn-dark" href="${waLink(`Hi Draft Studio, I'd like to request a ${what}: `)}" target="_blank" rel="noopener">Request a drop <span class="arr">${ARR}</span></a>
      </article>`;
  }

  function emptyState(cat) {
    const name = cat ? cat.name.toLowerCase() : "files";
    return `<div class="empty">
      <h3>Fresh ${esc(name)} are on the way.</h3>
      <p>Nothing here yet. Tell us what you'd like to see and we'll draft it.</p>
      <a class="btn btn-dark" href="${waLink(`Hi Draft Studio, I'd like to request ${cat ? "some " + name : "a design"}: `)}" target="_blank" rel="noopener">${icon("chat")} Request on WhatsApp</a>
    </div>`;
  }

  /* ---------- Browse ---------- */
  function browse() {
    const params = new URLSearchParams(location.search);
    const state = { cat: params.get("cat") || "all", q: params.get("q") || "", fmt: params.get("format") || "", lic: params.get("license") || "", ori: params.get("orientation") || "", color: params.get("color") || "", letter: (params.get("letter") || "").toUpperCase(), type: params.get("type") || "", sort: params.get("sort") || "new" };
    if (state.sort === "free") { state.sort = "new"; state.lic = "free"; } // old "Free only" sort links
    const grid = $("[data-results]"), count = $("[data-count]");
    const cats = $("[data-cats]"), fmts = $("[data-fmts]"), q = $("[data-q]"), sort = $("[data-sort]");
    const allFmts = ["PSD", "AI", "SVG", "EPS", "PDF", "PNG"];

    // Category dropdown
    const CAT_ICON = { all: "grid", mockups: "t-shirt", vectors: "pen-tool", logos: "vector", templates: "file", saved: "bookmark" };
    const options = [{ name: "All files", slug: "all" }].concat(CATS, [{ name: "Saved", slug: "saved" }]);
    const countOf = c => c.slug === "all" ? items.length : c.slug === "saved" ? saved.length : items.filter(it => slug(it.category) === c.slug).length;
    const menu = $("[data-dd-menu]", cats), ddBtn = $("[data-dd-btn]", cats);
    const renderMenu = () => {
      menu.innerHTML = options.map((c, i) => `${c.slug === "saved" ? '<span class="dd-sep"></span>' : ""}
        <button type="button" role="option" data-cat="${c.slug}" aria-selected="${state.cat === c.slug}">
          <span class="dd-ico">${icon(CAT_ICON[c.slug] || "folder")}</span><span class="dd-name">${c.name}</span>
          ${c.slug === "saved" ? `<span class="dd-n" data-saved-n>${countOf(c)}</span>` : ""}
          ${icon("check", "dd-tick")}
        </button>`).join("");
    };
    const setOpen = open => { cats.classList.toggle("is-open", open); ddBtn.setAttribute("aria-expanded", open); };
    ddBtn.addEventListener("click", e => { e.stopPropagation(); const open = !cats.classList.contains("is-open"); if (open) closeDropdowns(); setOpen(open); });
    document.addEventListener("click", e => { if (!cats.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
    renderMenu();
    fmts.value = allFmts.includes(state.fmt) ? state.fmt : "";
    const lic = $("[data-license]");
    if (!["free", "premium"].includes(state.lic)) state.lic = "";
    lic.value = state.lic;
    const ori = $("[data-orient]");
    if (!["horizontal", "vertical", "square", "panoramic"].includes(state.ori)) state.ori = "";
    ori.value = state.ori;
    q.value = state.q;
    sort.value = state.sort;

    const sync = () => {
      const p = new URLSearchParams();
      if (state.cat !== "all") p.set("cat", state.cat);
      if (state.q) p.set("q", state.q);
      if (state.fmt) p.set("format", state.fmt);
      if (state.lic) p.set("license", state.lic);
      if (state.ori) p.set("orientation", state.ori);
      if (state.color) p.set("color", state.color);
      if (state.letter) p.set("letter", state.letter);
      if (state.type) p.set("type", state.type);
      if (state.sort !== "new") p.set("sort", state.sort);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    };

    const draw = () => {
      const cat = catOf(state.cat);
      const mine = state.cat === "saved";
      $("[data-title]").innerHTML = mine ? `Saved <span class="hl">files.</span>` : cat ? esc(cat.name) : state.q ? `“${esc(state.q)}”` : `Every <span class="hl">file.</span>`;
      $("[data-lede]").textContent = mine ? "Your favourites, kept in this browser. Tap the bookmark on any design to add it here." : cat ? cat.blurb : "Every mockup, vector, logo and template in the studio. Free to download, free to use.";
      document.title = (mine ? "Saved" : cat ? cat.name : "Browse") + " · Draft Studio";
      const cur = options.find(o => o.slug === state.cat) || options[0];
      renderMenu();
      $("[data-dd-label]", cats).textContent = cur.name;
      $("[data-dd-ico]", cats).innerHTML = icon(CAT_ICON[cur.slug] || "folder");
      // Only the Saved view shows a count
      const n = $("[data-dd-n]", cats);
      n.textContent = cur.slug === "saved" ? countOf(cur) : "";
      n.hidden = cur.slug !== "saved";

      // Letter and Type only make sense for logos; Orientation doesn't (they're all square)
      const logos = state.cat === "logos";
      ldd.hidden = typeWrap.hidden = !logos;
      oriWrap.hidden = logos;
      if (logos && state.ori) { state.ori = ""; ori.value = ""; ori.dispatchEvent(new Event("sync")); }
      if (!logos && (state.letter || state.type)) { state.letter = state.type = ""; typeSel.value = ""; typeSel.dispatchEvent(new Event("sync")); paintLetter(); }

      const ql = state.q.toLowerCase();
      let list = items.filter(it =>
        (state.cat === "all" || (state.cat === "saved" ? isSaved(it.id) : slug(it.category) === state.cat)) &&
        (!state.fmt || formatsOf(it).includes(state.fmt)) &&
        (!state.lic || (state.lic === "premium") === isPaid(it)) &&
        (!state.ori || orientationOf(it) === state.ori) &&
        (!state.color || (it.colors || []).includes(state.color)) &&
        (!state.letter || letterOf(it) === state.letter) &&
        (!state.type || typesOf(it).some(t => slug(t) === state.type)) &&
        (!ql || [it.title, it.category, it.description, (it.tags || []).join(" "), formatsOf(it).join(" ")].join(" ").toLowerCase().includes(ql)));
      if (state.sort === "az") list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
      if (state.sort === "old") list = list.slice().reverse();

      count.textContent = `${list.length} result${list.length === 1 ? "" : "s"}`;
      grid.innerHTML = list.length ? list.map(card).join("") : state.cat === "saved"
        ? `<div class="empty"><h3>Nothing saved yet.</h3><p>Tap the bookmark on any design to keep it here.</p><a class="btn btn-dark" href="browse.html">Browse files</a></div>`
        : emptyState(state.q || state.fmt || state.lic || state.ori || state.color || state.letter || state.type ? null : cat);
      reveal(grid);
      sync();
    };

    menu.addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (b) { state.cat = b.dataset.cat; setOpen(false); draw(); } });
    fmts.addEventListener("change", () => { state.fmt = fmts.value; draw(); });
    lic.addEventListener("change", () => { state.lic = lic.value; draw(); });
    ori.addEventListener("change", () => { state.ori = ori.value; draw(); });

    // Colour dropdown: a grid of swatches
    const COLORS = DS.colors || {};
    if (!COLORS[state.color]) state.color = "";
    const cdd = $("[data-color-dd]"), cmenu = $("[data-color-menu]"), ctoggle = $(".sel-toggle", cdd);
    const nice = k => k.replace(/-/g, " ").replace(/^./, c => c.toUpperCase());
    const paintColor = () => {
      $("[data-color-label]").innerHTML = state.color
        ? `<i class="sw-dot" style="--sw:${COLORS[state.color]}"></i>${esc(nice(state.color))}`
        : `${icon("palette", "sel-shape")}Any colour`;
      cmenu.innerHTML = `<div class="sw-grid">${Object.entries(COLORS).map(([k, v]) =>
        `<button type="button" class="sw" style="--sw:${v}" data-color="${esc(k)}" aria-pressed="${state.color === k}" aria-label="${esc(nice(k))}" data-tip="${esc(nice(k))}"></button>`).join("")}</div>
        <button type="button" class="sw-clear" data-color=""${state.color ? "" : " disabled"}>Any colour</button>`;
    };
    const setColorOpen = open => { cdd.classList.toggle("is-open", open); ctoggle.setAttribute("aria-expanded", open); };
    ctoggle.addEventListener("click", e => { e.stopPropagation(); const open = !cdd.classList.contains("is-open"); if (open) closeDropdowns(); setColorOpen(open); });
    cmenu.addEventListener("click", e => {
      const b = e.target.closest("[data-color]"); if (!b) return;
      state.color = b.dataset.color; setColorOpen(false); paintColor(); draw();
    });
    document.addEventListener("click", e => { if (!cdd.contains(e.target)) setColorOpen(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") setColorOpen(false); });
    paintColor();

    // Logos: Letter dropdown (an A–Z grid; letters with no logo yet are greyed out) and Type
    const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const letterOf = it => (it.letter || (/\bletter ([a-z])\b/i.exec(it.title) || [])[1] || "").toUpperCase();
    const typesOf = it => [].concat(it.type || "Other");
    const hasLetter = new Set(items.filter(it => it.category === "Logos").map(letterOf));
    if (!LETTERS.includes(state.letter)) state.letter = "";
    const ldd = $("[data-letter-dd]"), lmenu = $("[data-letter-menu]"), ltoggle = $(".sel-toggle", ldd);
    const paintLetter = () => {
      $("[data-letter-label]").innerHTML = state.letter
        ? `<i class="lt-chip" data-no-i18n>${state.letter}</i>Letter ${state.letter}`
        : `${icon("type", "sel-shape")}Any letter`;
      lmenu.innerHTML = `<div class="lt-grid" data-no-i18n>${LETTERS.map(l =>
        `<button type="button" class="lt" data-letter="${l}" aria-pressed="${state.letter === l}" aria-label="Letter ${l}"${hasLetter.has(l) ? "" : " disabled"}>${l}</button>`).join("")}</div>
        <button type="button" class="sw-clear" data-letter=""${state.letter ? "" : " disabled"}>Any letter</button>`;
    };
    const setLetterOpen = open => { ldd.classList.toggle("is-open", open); ltoggle.setAttribute("aria-expanded", open); };
    ltoggle.addEventListener("click", e => { e.stopPropagation(); const open = !ldd.classList.contains("is-open"); if (open) closeDropdowns(); setLetterOpen(open); });
    lmenu.addEventListener("click", e => {
      const b = e.target.closest("[data-letter]"); if (!b || b.disabled) return;
      state.letter = b.dataset.letter; setLetterOpen(false); paintLetter(); draw();
    });
    document.addEventListener("click", e => { if (!ldd.contains(e.target)) setLetterOpen(false); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") setLetterOpen(false); });
    paintLetter();
    const TYPES = DS.logoTypes || [];
    const typeSel = $("[data-type]"), typeWrap = $("[data-type-wrap]"), oriWrap = ori.closest(".sel-wrap");
    typeSel.insertAdjacentHTML("beforeend", TYPES.map(t => `<option value="${slug(t)}">${esc(t)}</option>`).join(""));
    if (!TYPES.some(t => slug(t) === state.type)) state.type = "";
    typeSel.value = state.type;
    typeSel.addEventListener("change", () => { state.type = typeSel.value; draw(); });

    q.addEventListener("input", () => { state.q = q.value.trim(); draw(); });
    sort.addEventListener("change", () => { state.sort = sort.value; draw(); });
    document.addEventListener("ds:saved", () => { $$("[data-saved-n]").forEach(n => { n.textContent = saved.length; }); if (state.cat === "saved") draw(); else renderMenu(); });
    draw();
  }

  /* ---------- Item ---------- */
  // The file view: big preview on the left, details and downloads on the right.
  // Used by item.html and by the quick-view pop-up.
  function itemBody(it) {
    const fmts = formatsOf(it);
    const cat = catOf(it.category);
    const zip = (it.files || []).find(f => f.format.toUpperCase() === "ZIP");
    const fileName = f => f.name || f.path.split("/").pop();
    // One file at a time: pick a format, then download. Starts on the format
    // chosen in Settings > Default download when this file has it.
    const singles = (it.files || []).filter(f => f !== zip);
    const want = pref("format").toUpperCase();
    const start = Math.max(0, singles.findIndex(f => f.format.toUpperCase() === want));
    // Formats with an app logo show it instead of the text badge
    const APP_ICON = { PSD: "photoshop" };
    const fileBadge = ext => APP_ICON[ext] ? `<span class="dlx-app"><img src="assets/apps/${APP_ICON[ext]}.svg" alt="${ext}" width="28" height="28"></span>` : fmtBadge(ext);
    const fileLine = f => `${fileBadge(f.format.toUpperCase())}
        <span class="name"><b>${esc(fileName(f))}</b><small>${isExternal(f.path) ? `${DRIVE}Google Drive` : esc(f.size || "")}</small></span>`;
    const picker = !singles.length ? "" : `
      <div class="dlx" data-dlx>
        <div class="dlx-pick">
          <button class="dlx-btn" type="button" aria-haspopup="listbox" aria-expanded="false" data-dlx-toggle${singles.length < 2 ? " disabled" : ""}>
            <span class="sr-only">Choose a format:</span><span class="dlx-cur" data-dlx-cur>${fileLine(singles[start])}</span>${singles.length < 2 ? "" : `<span class="dlx-toggle" aria-hidden="true">${icon("chev")}</span>`}
          </button>
          <div class="dlx-menu" role="listbox" aria-label="Formats">
            ${singles.map((f, i) => `<button type="button" role="option" aria-selected="${i === start}" data-dlx-opt="${i}"
              data-href="${esc(f.path)}" data-name="${esc(fileName(f))}" data-ext="${isExternal(f.path) ? 1 : ""}">${fileLine(f)}${icon("check", "dlx-tick")}</button>`).join("")}
          </div>
        </div>
        <a class="btn btn-dl dlx-go" data-dlx-go>${icon("download")}<span>Download</span></a>
      </div>`;
    const actions = isPaid(it) ? `
      <div class="price-box">
        <span class="mono mute">${it.sold ? "Sold" : "Exclusive · sold once"}</span>
        <div class="amount">${it.priceFrom ? '<small>From</small> ' : ""}${esc(it.price)}</div>
        <p>You get ${esc((it.includes || []).join(", "))}. Once it's sold it comes off the shelf for good.</p>
        ${it.sold ? `<span class="btn" aria-disabled="true">Sold</span>` :
          `<a class="btn btn-dark" href="${waLink(`Hi Draft Studio, I'd like to buy “${it.title}” (${it.num}), ${it.priceFrom ? "priced from" : "for"} ${it.price}.`)}" target="_blank" rel="noopener">${icon("chat")} Buy on WhatsApp</a>`}
      </div>` : `
      ${it.requires ? `<div class="notice">${icon("lightbulb")}<span>This file needs <b>${esc(it.requires)}</b> (or free Photopea in your browser).</span></div>` : ""}
      ${zip ? `<a class="btn btn-dl dl-all" href="${esc(zip.path)}" download>${icon("download")} Download all${zip.size ? " · " + esc(zip.size) : ""}</a>` : ""}
      ${picker}`;
    return `
          <div class="item-media">
            <button class="frame" type="button" data-zoom aria-label="Zoom preview" style="--ar:${arOf(it.preview)}">
              <img ${imgSet(it.preview, "(max-width: 900px) 92vw, 50vw")} alt="${esc(it.title)} preview" fetchpriority="high">
              <span class="zoom-hint">${icon("search")} Zoom</span>
            </button>
            ${shotsOf(it).length > 1 ? `<div class="item-thumbs" role="group" aria-label="Previews">${shotsOf(it).map((src, i) => `
              <button type="button" data-shot="${i}" aria-pressed="${i === 0}" aria-label="Preview ${i + 1}"><img ${imgSrc(src, "sm")} alt="" loading="lazy"></button>`).join("")}</div>` : ""}
          </div>
          <div class="item-info">
            <h1>${esc(it.title)}</h1>
            <p class="desc">${esc(it.description || "")}</p>
            <dl class="specs">
              ${it.specs ? `<div><dt>Size</dt><dd>${esc(it.specs)}</dd></div>` : ""}
              <div><dt>Formats</dt><dd>${fmts.join(", ")}</dd></div>
              ${it.requires ? `<div><dt>Opens in</dt><dd>${esc(it.requires)}</dd></div>` : ""}
              <div><dt>Added</dt><dd>${it.date ? new Date(it.date + "T00:00").toLocaleDateString(LANG, { day: "numeric", month: "long", year: "numeric" }) : "—"}</dd></div>
              <div><dt>License</dt><dd>${isPaid(it) ? "Exclusive, full rights to the buyer" : "Free for personal &amp; commercial use"}</dd></div>
            </dl>
            ${actions}
            <div class="item-actions">
              <button class="btn btn-sm" type="button" data-share>${icon("share")} Share</button>
              <a class="btn btn-sm" href="browse.html?cat=${cat ? cat.slug : ""}">More ${esc(it.category.toLowerCase())}</a>
            </div>
            ${isPaid(it) ? "" : `<p class="lic-note">${esc(DS.site.license)} <a href="license.html">Read the license</a></p>`}
          </div>`;
  }

  // Full-screen zoom, shared by the page and the pop-up
  let lightbox = null;
  // The main preview plus any extra gallery images
  const shotsOf = it => [it.preview, ...(it.gallery || [])].filter(Boolean);
  function zoom(it, src = it.preview) {
    if (!lightbox) {
      lightbox = document.createElement("div");
      lightbox.className = "lightbox";
      document.body.appendChild(lightbox);
      const shut = () => { lightbox.classList.remove("is-open"); if (!document.documentElement.classList.contains("qv-lock")) document.body.style.overflow = ""; };
      lightbox.addEventListener("click", shut);
      document.addEventListener("keydown", e => { if (e.key === "Escape" && lightbox.classList.contains("is-open")) { e.stopImmediatePropagation(); shut(); } }, true);
    }
    lightbox.innerHTML = `<img src="${esc(src)}" alt="${esc(it.title)} preview"><button class="icon-btn" type="button" aria-label="Close">${icon("close")}</button>`;
    lightbox.classList.add("is-open"); document.body.style.overflow = "hidden";
  }

  function bindItem(root, it) {
    const fmts = formatsOf(it);
    downloadPicker(root);
    let shot = it.preview;
    $("[data-zoom]", root).addEventListener("click", () => zoom(it, shot));
    // Thumbnails swap the main preview
    $$("[data-shot]", root).forEach(b => b.addEventListener("click", () => {
      const src = shotsOf(it)[+b.dataset.shot];
      if (!src || src === shot) return;
      shot = src;
      const img = $("[data-zoom] img", root), tmp = document.createElement("div");
      tmp.innerHTML = `<img ${imgSet(src, "(max-width: 900px) 92vw, 50vw")} alt="${esc(it.title)} preview">`;
      img.replaceWith(tmp.firstChild);
      $("[data-zoom]", root).style.setProperty("--ar", arOf(src));
      $$("[data-shot]", root).forEach(x => x.setAttribute("aria-pressed", x === b));
    }));
    $("[data-share]", root).addEventListener("click", () => {
      // The d/ page has the design's own preview card for WhatsApp, X and others
      const url = (DS.site.url || new URL(".", location.href).href) + `d/${encodeURIComponent(it.id)}.html`;
      const data = { title: it.title + " · Draft Studio", text: isPaid(it) ? it.title : `Free ${fmts.join("/")} download: ${it.title}`, url };
      if (navigator.share) navigator.share(data).catch(() => {});
      else copy(url, "Link copied");
    });
  }

  function downloadPicker(root) {
    const box = $("[data-dlx]", root);
    if (!box) return;
    const btn = $("[data-dlx-toggle]", box), menu = $(".dlx-menu", box), go = $("[data-dlx-go]", box);
    const opts = $$("[data-dlx-opt]", box);
    const pick = o => {
      opts.forEach(x => x.setAttribute("aria-selected", x === o));
      $("[data-dlx-cur]", box).innerHTML = o.innerHTML.replace(/<svg class="dlx-tick[\s\S]*?<\/svg>/, "");
      go.href = o.dataset.href;
      if (o.dataset.ext) { go.target = "_blank"; go.rel = "noopener"; go.removeAttribute("download"); go.innerHTML = `<span class="gd-chip">${DRIVE}</span><span>Open in Drive</span>`; }
      else { go.removeAttribute("target"); go.download = o.dataset.name; go.innerHTML = `${icon("download")}<span>Download</span>`; }
    };
    const setOpen = on => { box.classList.toggle("is-open", on); btn.setAttribute("aria-expanded", on); };
    pick(opts.find(o => o.getAttribute("aria-selected") === "true") || opts[0]);
    btn.addEventListener("click", e => { e.stopPropagation(); setOpen(!box.classList.contains("is-open")); if (box.classList.contains("is-open")) (opts.find(o => o.getAttribute("aria-selected") === "true") || opts[0]).focus(); });
    opts.forEach(o => o.addEventListener("click", () => { pick(o); setOpen(false); btn.focus(); }));
    menu.addEventListener("keydown", e => {
      const i = opts.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length].focus(); }
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); btn.focus(); }
    });
    document.addEventListener("click", e => { if (!box.contains(e.target)) setOpen(false); });
  }

  function item() {
    // d/<id>.html pages carry their id; item.html?id=… reads it from the address
    const id = document.body.dataset.id || new URLSearchParams(location.search).get("id");
    const it = items.find(i => i.id === id);
    const main = $("[data-item]");
    if (!it) {
      main.innerHTML = `<div class="wrap section"><div class="empty"><h3>That file has moved.</h3><p>We couldn't find “${esc(id || "")}”. Try browsing instead.</p><a class="btn btn-dark" href="browse.html">Browse all files</a></div></div>`;
      return;
    }
    document.title = `${it.title} · Draft Studio`;
    // item.html?id=… is the same page as d/<id>.html; point search engines there
    const canon = $('link[rel="canonical"]');
    if (canon && !document.body.dataset.id && DS.site.url) canon.href = DS.site.url + `d/${encodeURIComponent(it.id)}.html`;
    const cat = catOf(it.category);
    const related = items.filter(i => i !== it && i.category === it.category).concat(items.filter(i => i !== it && i.category !== it.category)).slice(0, 4);

    main.innerHTML = `
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="index.html">Home</a><span>/</span>
          <a href="browse.html?cat=${cat ? cat.slug : ""}">${esc(it.category)}</a><span>/</span>
          <span>${it.num}</span>
        </nav>
        <div class="item">${itemBody(it)}</div>
      </div>
      ${related.length ? `
      <section class="section">
        <div class="wrap">
          <div class="sec-head"><div><span class="eyebrow"><span class="dot"></span>Keep going</span><h2>You might also like</h2></div>
          <a class="link-arrow" href="browse.html">Browse everything ${icon("arrow-right")}</a></div>
          <div class="grid">${related.map(card).join("")}</div>
        </div>
      </section>` : ""}`;
    bindItem(main, it);
    reveal(main);
  }

  /* ---------- Quick view ---------- */
  // Clicking any file card opens the file in a large pop-up instead of a new page.
  // The address bar still changes to the file's own link, so sharing, refreshing and Back all work.
  function quickView() {
    const qv = document.createElement("div");
    qv.className = "qv"; qv.hidden = true;
    qv.innerHTML = `
      <div class="qv-backdrop" data-qv-close></div>
      <div class="qv-panel" role="dialog" aria-modal="true" aria-label="File preview" tabindex="-1">
        <div class="qv-bar" data-qv-drag>
          <span class="qv-grab" aria-hidden="true"></span>
          <span class="qv-pos" data-qv-pos></span>
          <div class="qv-tools">
            <button class="qv-btn" type="button" data-qv-step="-1" aria-label="Previous file">${icon("arrow-left")}</button>
            <button class="qv-btn" type="button" data-qv-step="1" aria-label="Next file">${icon("arrow-right")}</button>
            <a class="qv-btn" href="browse.html" data-qv-full aria-label="Open full page">${icon("external-link")}</a>
            <button class="qv-btn is-dark" type="button" data-qv-close aria-label="Close">${icon("close")}</button>
          </div>
        </div>
        <div class="qv-body" data-qv-body></div>
      </div>`;
    document.body.appendChild(qv);
    const panel = $(".qv-panel", qv), body = $("[data-qv-body]", qv);
    let cur = null, list = [], returnTo = null;
    const idOf = a => {
      try {
        const u = new URL(a.href, location.href);
        return /\/item\.html$/.test(u.pathname) && u.origin === location.origin ? u.searchParams.get("id") : null;
      } catch (e) { return null; }
    };
    const pageIds = () => $$('a[href*="item.html?id="]').filter(a => !a.closest(".qv, .search-box")).map(idOf)
      .filter((id, i, a) => id && a.indexOf(id) === i && items.some(x => x.id === id));
    const show = (id, how) => {
      const it = items.find(i => i.id === id); if (!it) return;
      cur = id;
      if (!list.includes(id)) list = pageIds();
      body.innerHTML = `<div class="item is-qv">${itemBody(it)}</div>`;
      bindItem(body, it);
      const n = list.indexOf(id);
      $("[data-qv-pos]", qv).innerHTML = n > -1 && list.length > 1 ? `<b>${String(n + 1).padStart(2, "0")}</b> / ${String(list.length).padStart(2, "0")}` : `<b>${it.num}</b>`;
      $$("[data-qv-step]", qv).forEach(b => { b.disabled = list.length < 2; });
      $("[data-qv-full]", qv).href = itemUrl(it);
      if (how === "push") history.pushState({ qv: id }, "", itemUrl(it));
      if (how === "replace") history.replaceState({ qv: id }, "", itemUrl(it));
      if (qv.hidden) {
        returnTo = document.activeElement;
        document.documentElement.style.setProperty("--qv-origin", (scrollY + innerHeight / 2) + "px");
        document.documentElement.style.setProperty("--qv-pull", 0);
        // keep the page from shifting when the scrollbar disappears under the lock
        document.documentElement.style.paddingRight = (innerWidth - document.documentElement.clientWidth) + "px";
        qv.hidden = false; document.documentElement.classList.add("qv-lock");
        requestAnimationFrame(() => qv.classList.add("is-open"));
      }
      body.scrollTop = 0; panel.focus({ preventScroll: true });
    };
    const hide = () => {
      if (!cur) return;
      cur = null; list = [];
      qv.classList.remove("is-open"); document.documentElement.classList.remove("qv-lock"); document.documentElement.style.paddingRight = "";
      setTimeout(() => { if (!cur) { qv.hidden = true; panel.style.transform = panel.style.transition = ""; const bd = $(".qv-backdrop", qv); bd.style.opacity = bd.style.transition = ""; } }, 560);
      if (returnTo && returnTo.focus) returnTo.focus({ preventScroll: true });
    };
    const close = () => { if (history.state && history.state.qv) history.back(); else hide(); };
    const step = d => { if (list.length < 2) return; const n = list.indexOf(cur); show(list[(n + d + list.length) % list.length], "replace"); };

    document.addEventListener("click", e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.closest(".search-box")) return;
      const id = idOf(a);
      if (!id || !items.some(x => x.id === id)) return;
      if (!cur && pref("open") === "page") return;  // Settings > Open files in > Full page
      e.preventDefault();
      show(id, cur ? "replace" : "push");
    });
    qv.addEventListener("click", e => {
      if (e.target.closest("[data-qv-close]")) close();
      const s = e.target.closest("[data-qv-step]"); if (s) step(+s.dataset.qvStep);
    });
    document.addEventListener("keydown", e => {
      if (!cur) return;
      if (e.key === "Escape") close();
      else if (!e.target.closest("input, textarea") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) step(e.key === "ArrowRight" ? 1 : -1);
    });
    addEventListener("popstate", e => { if (e.state && e.state.qv) show(e.state.qv); else hide(); });

    // Drag the sheet by its top bar: it follows the pointer 1:1, rubber-bands upward,
    // and a long pull or a quick flick down dismisses it (iOS sheet behaviour)
    const bar = $("[data-qv-drag]", qv), backdrop = $(".qv-backdrop", qv), html = document.documentElement;
    let drag = null;
    bar.addEventListener("pointerdown", e => {
      if (e.button || e.target.closest("button, a")) return;
      drag = { y0: e.clientY, last: e.clientY, lt: performance.now(), v: 0, dy: 0, on: false, id: e.pointerId };
    });
    addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dy = e.clientY - drag.y0;
      if (!drag.on) {
        if (Math.abs(dy) < 4) return;
        drag.on = true; try { bar.setPointerCapture(drag.id); } catch (err) {}
        panel.classList.add("is-dragging"); html.classList.add("qv-dragging");
        panel.style.transition = "none"; backdrop.style.transition = "none";
      }
      const now = performance.now();
      drag.v = .8 * ((e.clientY - drag.last) / Math.max(1, now - drag.lt)) + .2 * drag.v;
      drag.last = e.clientY; drag.lt = now; drag.dy = dy;
      const y = dy >= 0 ? dy : -Math.pow(-dy, .62); // resistance when pulled up
      const pull = Math.max(0, Math.min(1, dy / (panel.offsetHeight * .8)));
      panel.style.transform = `translateY(${y.toFixed(1)}px)`;
      backdrop.style.opacity = String(1 - pull * .9);
      html.style.setProperty("--qv-pull", pull.toFixed(3));
    });
    const endDrag = e => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      const d = drag; drag = null;
      if (!d.on) return;
      panel.classList.remove("is-dragging"); html.classList.remove("qv-dragging");
      const dismiss = d.dy > panel.offsetHeight * .22 || (d.v > .4 && d.dy > 20);
      if (dismiss) {
        // carry the flick's speed: faster flicks finish quicker
        const ms = Math.round(Math.max(220, Math.min(520, (panel.offsetHeight - d.dy) / Math.max(.8, d.v * 1.4))));
        panel.style.transition = `transform ${ms}ms cubic-bezier(.2, .7, .3, 1)`; backdrop.style.transition = `opacity ${ms}ms ease`;
        html.style.setProperty("--qv-pull", 1);
        if (navigator.vibrate) navigator.vibrate(6);
        requestAnimationFrame(() => { panel.style.transform = ""; backdrop.style.opacity = ""; close(); });
      } else {
        panel.style.transition = "transform var(--dur-bouncy) var(--spring-bouncy)"; backdrop.style.transition = "";
        panel.style.transform = ""; backdrop.style.opacity = ""; html.style.setProperty("--qv-pull", 0);
        setTimeout(() => { panel.style.transition = ""; }, 600);
      }
    };
    addEventListener("pointerup", endDrag);
    addEventListener("pointercancel", endDrag);
  }

  /* ---------- Press feedback (iOS style) ---------- */
  // Anything tappable shrinks a touch under the finger and springs back on release.
  // Uses the Web Animations API on the `scale` property, so it never fights the
  // element's own CSS transforms, and it can be interrupted mid-motion.
  const SPRING_BOUNCY = "linear(0, 0.035, 0.125, 0.249, 0.389, 0.531, 0.665, 0.784, 0.885, 0.966, 1.026, 1.068, 1.094, 1.106, 1.108, 1.102, 1.091, 1.077, 1.062, 1.046, 1.032, 1.02, 1.01, 1.002, 0.996, 0.992, 0.989, 0.988, 0.988, 0.989, 0.991, 0.992, 0.994, 0.995, 0.997, 0.998, 1)";
  function pressFX() {
    if (!document.body.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const springOK = (() => { try { return CSS.supports("transition-timing-function", "linear(0, 1)"); } catch (e) { return false; } })();
    const SEL = [".btn", ".card", ".drop-card", ".drop-req", ".pal", ".qs-tile", ".qs-type", ".qs-look", ".qs-ico", ".qs-seg-btn", ".qs-iconbtn", ".qs-upload",
      ".pal-btn", ".pt-rows button", ".pt-swatches button", ".glass-btn", ".qv-btn", ".icon-btn", ".icon-cell", ".swatch", ".sel-btn", ".dd-btn",
      ".side-link", ".hsearch-go", ".fx-row", ".lx-uses button", ".chip", ".seg button", ".ix-grid a", ".ps-tool", ".ps-theme button",
      ".pg-base", ".cp-drop", ".cp-recent button", ".shelves > *", ".logo", ".pg-hexes button", ".qt-dots i", ".pt-dots i"].join(",");
    const scaleOf = el => { const w = el.offsetWidth; return w > 420 ? .985 : w > 200 ? .97 : w > 64 ? .95 : .9; };
    const anim = (el, to, down) => {
      const from = parseFloat(getComputedStyle(el).scale) || 1;
      if (el._press) el._press.cancel();
      el._press = el.animate([{ scale: from }, { scale: to }], down
        ? { duration: 140, easing: "cubic-bezier(.2, .8, .2, 1)", fill: "forwards" }
        : { duration: springOK ? 580 : 420, easing: springOK ? SPRING_BOUNCY : "cubic-bezier(.34, 1.56, .64, 1)", fill: "forwards" });
      if (!down) el._press.onfinish = () => { if (el._press) { el._press.cancel(); el._press = null; } };
    };
    document.addEventListener("pointerdown", e => {
      if (e.button) return;
      const el = e.target.closest(SEL);
      if (!el || el.disabled || el.closest("[data-qv-drag]")) return;
      anim(el, scaleOf(el), true);
      const up = () => { anim(el, 1, false); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); el.removeEventListener("pointerleave", up); };
      addEventListener("pointerup", up); addEventListener("pointercancel", up); el.addEventListener("pointerleave", up);
    }, { passive: true });
  }

  /* ---------- Icons ---------- */
  function icons() {
    const grid = $("[data-icons]"), groups = $("[data-groups]"), q = $("[data-q]"), insp = $("[data-inspector]");
    const names = ["All"].concat(DS.icons.map(i => i.group).filter((g, i, a) => a.indexOf(g) === i));
    const state = { group: "All", q: "", color: "", size: 28, sel: null };
    const swatches = [
      { c: "", label: "Black (default)" }, { c: "#8a8a8a", label: "Grey" }, { c: "#31a8ff", label: "Blue" },
      { c: "#ff6b5c", label: "Coral" }, { c: "#ff9a00", label: "Orange" }, { c: "#b98cff", label: "Violet" }
    ];

    groups.innerHTML = names.map(g => `<option value="${esc(g)}">${g === "All" ? "All icons" : esc(g)}</option>`).join("");
    groups.value = state.group;

    const svgFile = (ic, color, px) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${color || "currentColor"}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${(ICONS[ic.id] || "").split("__ID__").join(ic.id + "-cut")}</svg>`;

    const drawInspector = () => {
      const ic = state.sel;
      if (!ic) return;
      // Settings > Default download picks which button leads
      const pngFirst = pref("format") === "png" || pref("format") === "jpg";
      const dlSvg = `<a class="btn${pngFirst ? "" : " btn-dl"}" data-dl-svg>${icon("download")} Download SVG</a>`;
      const dlPng = `<button class="btn${pngFirst ? " btn-dl" : ""}" type="button" data-dl-png>${icon(pngFirst ? "download" : "image")} Download PNG · 512px</button>`;
      insp.innerHTML = `
        <div class="big" style="--ic:${state.color || "var(--fg)"}">${libIcon(ic.id)}</div>
        <span class="mono mute">${esc(ic.group)}</span>
        <h3>${esc(ic.name)}</h3>
        <div class="opts">
          <label>Colour
            <div class="swatches">
              ${swatches.map(s => `<button class="swatch" type="button" data-c="${s.c}" aria-label="${s.label}" aria-pressed="${state.color === s.c}" style="background:${s.c || "var(--fg)"}"></button>`).join("")}
              <span class="swatch custom" data-tip="Custom colour"><input type="color" aria-label="Custom colour" value="${state.color || "#0f0f0f"}"></span>
            </div>
          </label>
          <label>Preview size · <span data-size-label>${state.size}px</span>
            <input type="range" min="16" max="48" step="any" value="${state.size}" data-size>
          </label>
        </div>
        <div class="btns">
          ${pngFirst ? dlPng + dlSvg : dlSvg + dlPng}
          <button class="btn" type="button" data-copy>${icon("copy")} Copy SVG code</button>
        </div>`;
      const svgText = svgFile(ic, state.color, 24);
      const a = $("[data-dl-svg]", insp);
      a.href = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
      a.download = ic.id + ".svg";
      $("[data-copy]", insp).addEventListener("click", () => copy(svgText, "SVG code copied"));
      $("[data-dl-png]", insp).addEventListener("click", () => {
        const img = new Image();
        const src = svgFile(ic, state.color || "#0f0f0f", 512);
        img.onload = () => {
          const cv = document.createElement("canvas"); cv.width = cv.height = 512;
          cv.getContext("2d").drawImage(img, 0, 0, 512, 512);
          cv.toBlob(b => { const l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = ic.id + ".png"; l.click(); toast("PNG downloaded"); });
        };
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
      });
      $$("[data-c]", insp).forEach(b => b.addEventListener("click", () => { state.color = b.dataset.c; apply(); }));
      const ci = $("input[type=color]", insp);
      ci.addEventListener("input", () => { // live while picking; rebuild (download links) when the picker closes
        state.color = ci.value;
        grid.style.setProperty("--ic", state.color); $(".big", insp).style.setProperty("--ic", state.color);
        $$("[data-c]", insp).forEach(x => x.setAttribute("aria-pressed", "false"));
      });
      ci.addEventListener("change", apply);
      $("[data-size]", insp).addEventListener("input", e => { const v = +e.target.value; state.size = Math.round(v); $("[data-size-label]", insp).textContent = state.size + "px"; grid.style.setProperty("--isz", v + "px"); });
    };

    const apply = () => { grid.style.setProperty("--ic", state.color || "var(--fg)"); drawInspector(); };
    document.addEventListener("ds-pref", e => { if (e.detail.name === "format") drawInspector(); });

    const select = (ic, scroll) => {
      state.sel = ic;
      $$("[data-id]", grid).forEach(b => b.setAttribute("aria-pressed", b.dataset.id === ic.id));
      history.replaceState(null, "", "#" + ic.id);
      drawInspector();
      if (scroll && innerWidth <= 1100) insp.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const draw = () => {
      const ql = state.q.toLowerCase();
      const list = DS.icons.filter(i => (state.group === "All" || i.group === state.group) &&
        (!ql || [i.name, i.group, i.tags.join(" ")].join(" ").toLowerCase().includes(ql)));
      $("[data-count]").textContent = `${list.length} icon${list.length === 1 ? "" : "s"}`;
      grid.innerHTML = list.length ? list.map(i => `<button class="icon-cell" type="button" data-id="${i.id}" aria-pressed="${state.sel && state.sel.id === i.id}">${libIcon(i.id)}<span>${esc(i.name)}</span></button>`).join("")
        : `<div class="empty"><h3>No icon called that yet.</h3><p>Ask for it and we'll draw it.</p><a class="btn btn-dark" href="${waLink("Hi Draft Studio, could you add an icon for: " + state.q)}" target="_blank" rel="noopener">${icon("chat")} Request an icon</a></div>`;
    };

    groups.addEventListener("change", () => { state.group = groups.value; draw(); });
    q.addEventListener("input", () => { state.q = q.value.trim(); draw(); });
    grid.addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) select(DS.icons.find(i => i.id === b.dataset.id), true); });

    draw();
    const fromHash = DS.icons.find(i => i.id === location.hash.slice(1));
    select(fromHash || DS.icons[0], false);
    if (fromHash) setTimeout(() => { const b = $(`[data-id="${fromHash.id}"]`, grid); b && b.scrollIntoView({ block: "center" }); }, 50);
  }

  /* ---------- Colour palettes ---------- */
  // Colour maths: hex <-> rgb <-> hsl, plus readable text on any swatch
  const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgbHex = (r, g, b) => "#" + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const hslHex = (h, s, l) => {
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return rgbHex(f(0) * 255, f(8) * 255, f(4) * 255);
  };
  const hexHsl = hex => {
    let [r, g, b] = hexRgb(hex).map(v => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    let h = 0, s = 0;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    return [(h + 360) % 360, s * 100, l * 100];
  };
  const lum = hex => hexRgb(hex).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
  const inkOn = hex => lum(hex) > .36 ? "#0f0f0f" : "#ffffff";
  const rnd = (a, b) => a + Math.random() * (b - a);

  const paletteCss = (colors, name = "palette") => `:root {\n${colors.map((c, i) => `  --${slug(name)}-${i + 1}: ${c};`).join("\n")}\n}`;

  // A clean 1600×900 PNG: tall swatches with each hex underneath
  function palettePng(colors, name) {
    const W = 1600, H = 900, pad = 64, top = 120, sw = (W - pad * 2) / colors.length, sh = 560;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#0f0f0f"; x.font = "600 40px Inter, system-ui, sans-serif"; x.textBaseline = "alphabetic";
    x.fillText(name, pad, 84);
    x.fillStyle = "#8a8a8a"; x.font = "500 20px Inter, system-ui, sans-serif"; x.textAlign = "right";
    x.fillText("Draft Studio", W - pad, 84); x.textAlign = "left";
    x.save(); x.beginPath(); x.roundRect(pad, top, W - pad * 2, sh, 28); x.clip();
    colors.forEach((col, i) => { x.fillStyle = col; x.fillRect(pad + i * sw, top, Math.ceil(sw), sh); });
    x.restore();
    colors.forEach((col, i) => {
      const cx = pad + i * sw;
      x.fillStyle = "#0f0f0f"; x.font = "600 26px Inter, system-ui, sans-serif";
      x.fillText(col.toUpperCase(), cx + 4, top + sh + 58);
      x.fillStyle = "#8a8a8a"; x.font = "400 18px Inter, system-ui, sans-serif";
      x.fillText("RGB " + hexRgb(col).join(" "), cx + 4, top + sh + 90);
    });
    c.toBlob(b => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(b); a.download = `${slug(name)}${/palette/i.test(name) ? "" : "-palette"}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast("PNG downloaded");
    });
  }

  // Harmony rules: each returns `n` colours around a base hue
  function harmony(mode, n, base) {
    const [bh, bs, bl] = base ? hexHsl(base) : [rnd(0, 360), rnd(55, 85), rnd(45, 60)];
    const ramp = i => n === 1 ? 50 : 18 + (i / (n - 1)) * 70; // dark → light
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : i / (n - 1);
      let h, s, l;
      switch (mode) {
        case "analogous": h = bh + (t - .5) * 70; s = bs * rnd(.8, 1.05); l = ramp(i); break;
        case "mono": h = bh + rnd(-4, 4); s = Math.max(18, bs * rnd(.6, 1)); l = ramp(i); break;
        case "complement": h = i < Math.ceil(n / 2) ? bh : bh + 180; s = bs * rnd(.75, 1); l = ramp(i); break;
        case "split": h = bh + [0, 150, 210][i % 3]; s = bs * rnd(.75, 1); l = ramp(i) * .85 + 8; break;
        case "triad": h = bh + [0, 120, 240][i % 3]; s = bs * rnd(.7, 1); l = 30 + t * 50; break;
        case "pastel": h = bh + i * rnd(30, 70); s = rnd(55, 80); l = rnd(80, 90); break;
        case "earthy": h = bh % 60 + 20 + rnd(-15, 25); s = rnd(18, 45); l = 20 + t * 62; break;
        default: // smart random: neighbouring hues + one accent, smooth light/dark ramp
          h = i === n - 2 && n > 3 ? bh + 180 + rnd(-20, 20) : bh + rnd(-35, 35);
          s = rnd(45, 90); l = 14 + t * 74 + rnd(-6, 6);
      }
      out.push(hslHex(h, Math.max(0, Math.min(100, s)), Math.max(6, Math.min(96, l))));
    }
    if (base && mode !== "pastel") { // keep the exact base colour in the palette, at its closest spot
      const idx = out.reduce((best, c, i) => Math.abs(hexHsl(c)[2] - bl) < Math.abs(hexHsl(out[best])[2] - bl) ? i : best, 0);
      out[idx] = base;
    }
    return out;
  }

  function palettes() {
    const pg = $("[data-pg]"), strip = $("[data-pg-strip]", pg), preview = $("[data-ps-preview]", pg);
    const mode = $("[data-pg-mode]"), count = $("[data-pg-count]"), baseIn = $("[data-pg-base]");
    const state = { colors: [], locked: [], base: "", dark: false };

    const LOCK = icon("lock");
    const UNLOCK = icon("unlock");

    // Roles: lightest = background, darkest = text, most saturated = primary, then accent, the rest surfaces
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const grade = r => r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "Low";
    const PREVIEW_HTML_ = `
      <div class="pv-nav"><span class="pv-logo"><i></i>Studio</span><span class="pv-links"><i></i><i></i><i></i></span><span class="pv-btn pv-sm">Sign up</span></div>
      <div class="pv-hero">
        <span class="pv-tag">New season</span>
        <h3>Colour that<br>does the work.</h3>
        <p>See your palette on a real layout before you commit to it.</p>
        <div class="pv-row"><span class="pv-btn">Get started</span><span class="pv-ghost">Learn more</span></div>
      </div>
      <div class="pv-cards">
        <div class="pv-card"><small>Growth</small><b>84%</b><div class="pv-bars"><i style="height:38%"></i><i style="height:62%"></i><i style="height:48%"></i><i style="height:80%"></i><i style="height:66%"></i><i style="height:94%"></i></div></div>
        <div class="pv-card pv-alt"><div class="pv-avatars"><i></i><i></i><i></i></div><small>Team</small><b>12 people</b><span class="pv-line"></span><span class="pv-line s"></span></div>
      </div>`;
    const rolesOf = colors => {
      const idx = colors.map((c, i) => i);
      const byLum = idx.slice().sort((a, b) => lum(colors[b]) - lum(colors[a]));
      const bg = byLum[0], ink = byLum[byLum.length - 1];
      const rest = idx.filter(i => i !== bg && i !== ink).sort((a, b) => hexHsl(colors[b])[1] - hexHsl(colors[a])[1]);
      const r = {}; r[bg] = "Background"; r[ink] = "Text";
      rest.forEach((i, k) => { r[i] = ["Primary", "Accent", "Surface", "Surface 2", "Surface 3"][k]; });
      return { r, bg, ink, primary: rest[0] ?? ink, accent: rest[1] ?? rest[0] ?? ink, surface: rest[2] };
    };
    preview.innerHTML = PREVIEW_HTML_;
    const paint = () => {
      const c = state.colors, ro = rolesOf(c);
      const light = c[ro.bg], dark = c[ro.ink];
      // A page needs a true light or dark ground: tint white/black with the palette when it has none
      const paper = lum(light) > .55 ? light : rgbHex(...hexRgb(light).map(v => v * .1 + 255 * .9));
      const night = lum(dark) < .06 ? dark : rgbHex(...hexRgb(dark).map(v => v * .3 + 15 * .7));
      const bg = state.dark ? night : paper, ink = state.dark ? paper : night;
      const pri = c[ro.primary], acc = c[ro.accent];
      const surf = ro.surface != null ? c[ro.surface] : rgbHex(...hexRgb(bg).map((v, k) => v * .9 + hexRgb(ink)[k] * .1));
      const v = preview.style;
      v.setProperty("--bg", bg); v.setProperty("--ink", ink); v.setProperty("--pri", pri); v.setProperty("--on-pri", inkOn(pri));
      v.setProperty("--acc", acc); v.setProperty("--on-acc", inkOn(acc)); v.setProperty("--surf", surf);
      v.setProperty("--on-surf", ratio(surf, bg) > ratio(surf, ink) ? bg : ink);
      $$(".pv-bars i", preview).forEach((b, i) => { b.style.background = c[i % c.length]; });
      $$(".pv-avatars i", preview).forEach((b, i) => { b.style.background = [pri, acc, dark][i]; });
      return ro;
    };
    const drawGen = () => {
      const ro = paint(), c = state.colors, bg = c[ro.bg];
      strip.innerHTML = c.map((col, i) => {
        const [h, s, l] = hexHsl(col), rgb = hexRgb(col);
        const vs = i === ro.bg ? c[ro.ink] : bg, r = ratio(col, vs);
        return `
          <div class="ps-row" data-i="${i}" style="--c:${col}">
            <button type="button" class="ps-chip" data-copy="${col}" aria-label="Copy ${col}"></button>
            <div class="ps-info">
              <span class="ps-role">${ro.r[i]}</span>
              <button type="button" class="ps-hex" data-copy="${col}">${col.toUpperCase()}</button>
              <span class="ps-meta">RGB ${rgb.join(" ")} · HSL ${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%</span>
            </div>
            <span class="ps-score" data-grade="${grade(r)}" data-tip="Contrast against ${i === ro.bg ? "text" : "background"}">${r.toFixed(1)} <b>${grade(r)}</b></span>
            <div class="ps-tools">
              <button type="button" class="ps-tool" data-lock="${i}" aria-pressed="${!!state.locked[i]}" aria-label="${state.locked[i] ? "Unlock" : "Lock"} colour">${state.locked[i] ? LOCK : UNLOCK}</button>
              <label class="ps-tool" aria-label="Edit colour">${icon("eyedropper")}<input type="color" value="${col}" data-edit="${i}"></label>
            </div>
          </div>`;
      }).join("");
      history.replaceState(null, "", "#" + c.map(x => x.slice(1)).join("-"));
    };
    const generate = () => {
      const n = +count.value;
      const fresh = harmony(mode.value, n, state.base || (state.locked.some(Boolean) ? state.colors[state.locked.findIndex(Boolean)] : ""));
      state.colors = fresh.map((c, i) => state.locked[i] && state.colors[i] ? state.colors[i] : c);
      state.locked.length = n;
      drawGen();
      pg.classList.remove("is-new"); void pg.offsetWidth; pg.classList.add("is-new");
    };
    const load = colors => { state.colors = colors.slice(0, 7); state.locked = []; count.value = String(Math.max(3, state.colors.length)); count.dispatchEvent(new Event("sync")); drawGen(); };

    // Start from a shared link (#ff6b35-f7931e-…) or a fresh palette
    const fromHash = location.hash.slice(1).split("-").filter(h => /^[0-9a-f]{6}$/i.test(h)).map(h => "#" + h.toLowerCase());
    if (fromHash.length >= 2) load(fromHash); else generate();

    $("[data-pg-go]", pg).addEventListener("click", generate);
    mode.addEventListener("change", generate);
    count.addEventListener("change", generate);
    baseIn.addEventListener("input", () => {
      state.base = baseIn.value;
      $("[data-pg-base-chip]", pg).style.background = state.base;
      $("[data-pg-base-txt]", pg).textContent = state.base.toUpperCase();
      pg.classList.add("has-base");
      generate();
    });
    document.addEventListener("keydown", e => {
      if (e.code !== "Space" || e.target.closest("input, textarea, select, a, [contenteditable]")) return;
      if (e.target.closest("button") && !e.target.closest("[data-pg-strip], [data-pg-go]")) return; // let other buttons work
      e.preventDefault(); generate();
    });
    pg.addEventListener("click", e => {
      const l = e.target.closest("[data-lock]");
      if (l) { const i = +l.dataset.lock; state.locked[i] = !state.locked[i]; drawGen(); return; }
    });
    pg.addEventListener("input", e => {
      const ed = e.target.closest("[data-edit]"); if (!ed) return;
      const i = +ed.dataset.edit; state.colors[i] = ed.value; state.locked[i] = true;
      const row = $(`.ps-row[data-i="${i}"]`, strip);
      row.style.setProperty("--c", ed.value); $(".ps-hex", row).textContent = ed.value.toUpperCase();
      const [h, sat, l] = hexHsl(ed.value);
      $(".ps-meta", row).textContent = `RGB ${hexRgb(ed.value).join(" ")} · HSL ${Math.round(h)} ${Math.round(sat)}% ${Math.round(l)}%`;
      paint();
    });
    pg.addEventListener("change", e => { if (e.target.closest("[data-edit]")) drawGen(); });
    $("[data-pg-hex]", pg).addEventListener("click", () => copy(state.colors.map(c => c.toUpperCase()).join(", "), "HEX codes copied"));
    $("[data-pg-css]", pg).addEventListener("click", () => copy(paletteCss(state.colors), "CSS copied"));
    $("[data-pg-link]", pg).addEventListener("click", () => copy(location.href, "Link copied"));
    $("[data-pg-png]", pg).addEventListener("click", () => palettePng(state.colors, "Draft Studio palette"));
    $$("[data-ps-theme]", pg).forEach(b => b.addEventListener("click", () => {
      state.dark = b.dataset.psTheme === "dark";
      $$("[data-ps-theme]", pg).forEach(x => x.setAttribute("aria-pressed", x === b));
      preview.classList.toggle("is-dark", state.dark); paint();
    }));

    // Library of hand-picked palettes
    const grid = $("[data-pal-grid]"), moodSel = $("[data-pal-mood]"), q = $("[data-pal-q]");
    const PALS = DS.palettes || [];
    const moods = PALS.map(p => p.mood).filter((m, i, a) => a.indexOf(m) === i);
    moodSel.innerHTML = `<option value="">All moods</option>` + moods.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join("");
    const lib = { mood: "", q: "" };
    const drawLib = () => {
      const ql = lib.q.toLowerCase().replace(/^#/, "");
      const list = PALS.filter(p => (!lib.mood || p.mood === lib.mood) &&
        (!ql || [p.name, p.mood, p.colors.join(" ")].join(" ").toLowerCase().includes(ql)));
      $("[data-pal-count]").textContent = `${list.length} palette${list.length === 1 ? "" : "s"}`;
      grid.innerHTML = list.length ? list.map(p => {
        const i = PALS.indexOf(p), ro = rolesOf(p.colors);
        // Bar widths follow the 60-30-10 idea: background widest, then text, primary, accent, surfaces
        const W = { Background: 34, Text: 22, Primary: 18, Accent: 13 };
        const w = p.colors.map((c, k) => W[ro.r[k]] || 13 / Math.max(1, p.colors.length - 4));
        return `
          <article class="pal reveal">
            <span class="pal-num">${String(i + 1).padStart(2, "0")}</span>
            <div class="pal-name"><h3>${esc(p.name)}</h3><p>${esc(p.mood)} · ${p.colors.length} colours</p></div>
            <div class="pal-ribbon">${p.colors.map((c, k) => `<button type="button" style="--c:${c};--ink:${inkOn(c)};flex:${w[k]}" data-copy="${c}" aria-label="Copy ${c}"><span>${c.slice(1).toUpperCase()}</span></button>`).join("")}</div>
            <div class="pal-hexes">${p.colors.map(c => `<span>${c.slice(1).toUpperCase()}</span>`).join("")}</div>
            <div class="pal-actions">
              <button type="button" class="pal-btn" data-pal-open="${i}" aria-label="Edit in generator">${icon("magic")}</button>
              <button type="button" class="pal-btn" data-pal-css="${i}" aria-label="Copy CSS">${icon("copy")}</button>
              <button type="button" class="pal-btn is-dl" data-pal-png="${i}" aria-label="Download PNG">${icon("download")}</button>
            </div>
          </article>`;
      }).join("") : `<div class="empty"><h3>No palette matches that.</h3><p>Try another word, or make one with the generator above.</p></div>`;
      reveal(grid);
    };
    moodSel.addEventListener("change", () => { lib.mood = moodSel.value; drawLib(); });
    q.addEventListener("input", () => { lib.q = q.value.trim(); drawLib(); });
    grid.addEventListener("click", e => {
      const b = e.target.closest("[data-pal-open], [data-pal-css], [data-pal-png]"); if (!b) return;
      const p = PALS[+(b.dataset.palOpen || b.dataset.palCss || b.dataset.palPng)];
      if (b.dataset.palCss) copy(paletteCss(p.colors, p.name), "CSS copied");
      else if (b.dataset.palPng) palettePng(p.colors, p.name);
      else { load(p.colors); pg.scrollIntoView({ behavior: "smooth", block: "start" }); toast(`${p.name} loaded in the generator`); }
    });
    // Any [data-copy] on the page copies its hex
    document.addEventListener("click", e => { const c = e.target.closest("[data-copy]"); if (c) copy(c.dataset.copy.toUpperCase(), `${c.dataset.copy.toUpperCase()} copied`); });
    drawLib();
  }

  /* ---------- Learn ---------- */
  function canvas() {
    if (window.DSCanvas) window.DSCanvas({ $, $$, esc, icon, libIcon, DS });
  }

  function learn() {
    if (window.DSAcademy) window.DSAcademy({ $, $$, esc, icon, waLink });
    const fx = $("[data-formats]");
    if (fx) formatExplorer(fx);
  }

  /* ---------- License ---------- */
  function license() {
    const lx = $("[data-lx]");
    if (lx) licenseChecker(lx);
    const el = $("[data-license-text]");
    if (el) el.textContent = DS.site.license;
    $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-mail]").forEach(a => { a.href = mailLink(a.dataset.mail); });
  }

  // Only one dropdown may be open at a time
  function closeDropdowns() {
    $$(".dd.is-open, .sel.is-open").forEach(d => {
      d.classList.remove("is-open");
      const t = $("[aria-expanded]", d); if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  /* ---------- Custom dropdowns for every <select class="select"> ---------- */
  // The native select stays in the page (hidden) and keeps the value, so page code
  // can keep reading select.value and listening for "change".
  function enhanceSelects(scope = document) {
    $$("select.select:not(.sel-native)", scope).forEach(sel => {
      const wrap = document.createElement("div");
      wrap.className = "sel";
      wrap.innerHTML = `
        <div class="sel-btn">
          <span class="sel-txt"><b></b></span>
          <button class="sel-toggle" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(sel.dataset.label || "Choose")}">
            ${icon("chev")}
          </button>
        </div>
        <div class="sel-menu" role="listbox"></div>`;
      sel.after(wrap);
      sel.classList.add("sel-native");
      sel.tabIndex = -1;
      const label = $(".sel-txt b", wrap), menu = $(".sel-menu", wrap), toggle = $(".sel-toggle", wrap);
      const tick = icon("check");
      // Options may carry data-shape="horizontal|vertical|square|panoramic|any" for a small outline icon
      const SHAPES = { horizontal: [18, 12], vertical: [12, 18], square: [14, 14], panoramic: [20, 9] };
      const shape = o => {
        const k = o && o.dataset.shape; if (!k) return "";
        if (k === "any") return `<svg class="sel-shape" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M12 3v18M3 12h9"/></svg>`;
        const [w, h] = SHAPES[k];
        return `<svg class="sel-shape" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><rect x="${(24 - w) / 2}" y="${(24 - h) / 2}" width="${w}" height="${h}" rx="2.5"/></svg>`;
      };
      const render = () => {
        const cur = sel.options[sel.selectedIndex];
        label.innerHTML = cur ? shape(cur) + esc(cur.text) : "";
        menu.innerHTML = Array.from(sel.options).map(o => `<button type="button" role="option" data-v="${esc(o.value)}" aria-selected="${o.value === sel.value}"><span>${shape(o)}${esc(o.text)}</span>${tick}</button>`).join("");
      };
      const setOpen = open => { wrap.classList.toggle("is-open", open); toggle.setAttribute("aria-expanded", open); };
      toggle.addEventListener("click", e => { e.stopPropagation(); render(); const open = !wrap.classList.contains("is-open"); if (open) closeDropdowns(); setOpen(open); });
      menu.addEventListener("click", e => {
        const b = e.target.closest("[data-v]"); if (!b) return;
        sel.value = b.dataset.v;
        sel.dispatchEvent(new Event("change"));
        render(); setOpen(false);
      });
      document.addEventListener("click", e => { if (!wrap.contains(e.target)) setOpen(false); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") setOpen(false); });
      sel.addEventListener("sync", render); // page code changed the value without a user pick
      render();
    });
  }

  window.DSEnhanceSelects = scope => enhanceSelects(scope);

  /* ---------- Sliders: a custom track and handle that glide ---------- */
  // Each <input type="range"> gets a drawn track, fill and handle. The real input stays
  // on top (invisible) so dragging, keys and screen readers work as normal; the drawing
  // eases towards the value every frame, so the handle glides instead of jumping.
  function sliders() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frac = el => {
      const min = el.min === "" ? 0 : +el.min, max = el.max === "" ? 100 : +el.max;
      return max > min ? Math.min(1, Math.max(0, (+el.value - min) / (max - min))) : 0;
    };
    const paint = w => w.style.setProperty("--pv", w._cur.toFixed(5));
    const moving = new Set();
    let raf = 0, last = 0;
    const tick = now => {
      const dt = Math.min(64, now - (last || now - 16)); last = now;
      const k = 1 - Math.exp(-dt / 38);   // smoothing: about 90% of the way in 90ms
      moving.forEach(w => {
        w._cur += (w._to - w._cur) * k;
        if (Math.abs(w._to - w._cur) < 0.0004) { w._cur = w._to; moving.delete(w); }
        paint(w);
      });
      raf = moving.size ? requestAnimationFrame(tick) : (last = 0);
    };
    const go = el => {
      const w = el._rng;
      if (!w) return;
      w._to = frac(el);
      if (reduce) { w._cur = w._to; paint(w); return; }
      moving.add(w);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const wrap = el => {
      if (el._rng || el.type !== "range") return;
      const w = document.createElement("span");
      w.className = "rng";
      el.before(w);
      w.append(el);
      w.insertAdjacentHTML("beforeend", '<span class="rng-track" aria-hidden="true"><span class="rng-fill"></span></span><span class="rng-thumb" aria-hidden="true"></span>');
      el._rng = w;
      w._cur = w._to = frac(el);
      paint(w);
    };
    const all = node => {
      if (node.nodeType !== 1) return;
      if (node.matches('input[type="range"]')) wrap(node);
      node.querySelectorAll('input[type="range"]').forEach(wrap);
    };
    document.addEventListener("input", e => { if (e.target._rng) go(e.target); }, true);
    document.addEventListener("change", e => { if (e.target._rng) go(e.target); }, true);
    document.addEventListener("pointerdown", e => { const w = e.target._rng; if (w) w.classList.add("is-active"); }, true);
    addEventListener("pointerup", () => $$(".rng.is-active").forEach(w => w.classList.remove("is-active")));
    addEventListener("pointercancel", () => $$(".rng.is-active").forEach(w => w.classList.remove("is-active")));
    // values set by page code (reset buttons, saved settings) glide too
    const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    if (d && d.set) Object.defineProperty(HTMLInputElement.prototype, "value", { get: d.get, set(v) { d.set.call(this, v); if (this._rng) go(this); }, configurable: true, enumerable: d.enumerable });
    new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(all))).observe(document.body, { childList: true, subtree: true });
    all(document.body);
  }

  /* ---------- QR Studio (qr.html) ---------- */
  // The studio lives in js/qr-studio.js; it gets the shared helpers from here.
  function qr() {
    if (window.QRStudio) window.QRStudio({ $, $$, esc, icon, libIcon, copy, toast, inkOn, hexRgb, lum, ICONS, pref, palettes: DS.palettes || [] });
  }

  /* ---------- Settings (gear in the header) ---------- */
  // Each preference lives in localStorage as "ds-<name>"; leaving the default
  // removes the key. The head of every page applies theme and text size before
  // paint; the others are read where they are used through pref().
  const PREFS = {
    theme:  { key: "ds-theme",  def: "device",  opts: { light: "Light", dark: "Dark", device: "Device" } },
    text:   { key: "ds-text",   def: "default", opts: { default: "Default", large: "Large", larger: "Larger" } },
    open:   { key: "ds-open",   def: "quick",   opts: { quick: "Quick view", page: "Full page" } },
    format: { key: "ds-format", def: "auto",    opts: { auto: "Auto", png: "PNG", svg: "SVG", jpg: "JPG" } },
    lang:   { key: "ds-lang",   def: "auto",    opts: Object.assign({ auto: "Automatic" }, LANGS) }
  };
  const pref = name => {
    const p = PREFS[name];
    try { const v = localStorage.getItem(p.key); return v in p.opts ? v : p.def; } catch (e) { return p.def; }
  };

  function settings() {
    const root = document.documentElement;
    const meta = $('meta[name="theme-color"]');
    const paintMeta = () => meta && meta.setAttribute("content", getComputedStyle(document.body).backgroundColor);
    const paintRoot = () => {
      const t = pref("theme"), x = pref("text");
      // Some pages (the portfolio) always stay light, whatever the setting
      if (root.hasAttribute("data-theme-lock")) root.dataset.theme = "light";
      else if (t === "device") delete root.dataset.theme; else root.dataset.theme = t;
      if (x === "default") delete root.dataset.text; else root.dataset.text = x;
    };

    const NOTES = {
      text: { default: "The size the site was designed at", large: "A little bigger, easier to read", larger: "Biggest, for small or far-away screens" },
      open: { quick: "A big preview sheet; flip through files without leaving the page", page: "Go straight to the file's own page" },
      lang: { auto: "Matches your browser's language", en: "English (original)", fr: "French", es: "Spanish", pt: "Portuguese", ar: "Arabic · right to left", zh: "Chinese (Simplified)" },
      format: { auto: "SVG for icons, PNG for QR codes", png: "Pixels, works everywhere", svg: "Vector, stays sharp at any size", jpg: "Smallest file, no transparency (QR codes; icons use PNG)" }
    };
    const TITLES = { lang: "Language", appearance: "Appearance", text: "Text size", open: "Open files in", format: "Default download" };

    const head = (title, back) => back
      ? `<div class="set-head"><button class="set-back" type="button" data-set-back>${icon("chevron-right")}<span>Settings</span></button><b>${title}</b><span></span></div>`
      : `<div class="set-head"><span></span><b>${title}</b><button class="set-x" type="button" aria-label="Close settings" data-set-close>${icon("close")}</button></div>`;
    const row = (view, ico, label) => `
      <button class="set-row" type="button" data-set-go="${view}">
        <i class="set-ico" data-set-ico="${view}">${icon(ico)}</i><span>${label}</span><em data-set-val="${view}"></em>${icon("chevron-right")}
      </button>`;
    const list = name => `
      <div class="set-group set-list" role="radiogroup" aria-label="${TITLES[name]}">
        ${Object.entries(PREFS[name].opts).map(([v, l]) => `
          <button class="set-opt" type="button" role="radio" aria-checked="false" data-pick="${name}" data-v="${v}">
            <span><b>${l}</b><small>${NOTES[name][v]}</small></span><i class="set-check" aria-hidden="true">${icon("check")}</i>
          </button>`).join("")}
      </div>`;
    const tile = t => `
      <button class="set-theme" type="button" role="radio" aria-checked="false" data-pick="theme" data-v="${t}">
        <span class="set-prev is-${t}" aria-hidden="true"><span><i></i><i></i><i></i></span><span><i></i><i></i><i></i></span></span>
        <b>${PREFS.theme.opts[t]}</b>
        <span class="set-tick" aria-hidden="true">${icon("check")}</span>
      </button>`;

    const el = document.createElement("div");
    el.className = "set";
    el.id = "settings";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Settings");
    el.hidden = true;
    el.innerHTML = `
      <div class="set-view is-on" data-view="root">
        ${head("Settings")}
        <p class="set-label">Display</p>
        <div class="set-group">${row("lang", "globe", "Language")}${row("appearance", "sun", "Appearance")}${row("text", "type", "Text size")}</div>
        <p class="set-label">Files</p>
        <div class="set-group">${row("open", "eye", "Open files in")}${row("format", "download", "Default download")}</div>
        <div class="set-group set-gap">
          <button class="set-row set-danger" type="button" data-set-clear><i class="set-ico">${icon("trash")}</i><span data-clear-label>Clear my saved stuff</span></button>
        </div>
        <p class="set-note">Removes your settings, saved files, QR design and recent colours from this browser.</p>
      </div>
      <div class="set-view" data-view="appearance">
        ${head("Appearance", true)}
        <p class="set-label">Theme</p>
        <div class="set-group set-themes" role="radiogroup" aria-label="Theme">${Object.keys(PREFS.theme.opts).map(tile).join("")}</div>
        <p class="set-note">Device follows your system and switches on its own.</p>
      </div>
      <div class="set-view" data-view="text">
        ${head("Text size", true)}
        ${list("text")}
        <p class="set-note">Headings stay the same; body text, labels and buttons grow.</p>
      </div>
      <div class="set-view" data-view="lang">
        ${head("Language", true)}
        ${list("lang")}
      </div>
      <div class="set-view" data-view="open">
        ${head("Open files in", true)}
        ${list("open")}
      </div>
      <div class="set-view" data-view="format">
        ${head("Default download", true)}
        ${list("format")}
        <p class="set-note">Used by QR Code Studio and the icon set. Palettes and design files keep their own formats.</p>
      </div>`;
    document.body.appendChild(el);

    const views = $$(".set-view", el);
    const fit = v => { el.style.height = v.offsetHeight + "px"; };
    const go = name => {
      const back = name === "root";
      views.forEach(v => {
        const on = v.dataset.view === name;
        v.classList.toggle("is-on", on);
        v.classList.toggle("is-left", !on && !back);
        v.inert = !on;
      });
      fit(views.find(v => v.dataset.view === name));
    };

    const sync = () => {
      const t = pref("theme");
      $$("[data-set-val]", el).forEach(e => {
        const name = e.dataset.setVal === "appearance" ? "theme" : e.dataset.setVal;
        e.textContent = PREFS[name].opts[pref(name)];
      });
      $('[data-set-ico="appearance"]', el).innerHTML = icon(t === "dark" ? "moon" : t === "light" ? "sun" : "monitor");
      $$("[data-pick]", el).forEach(b => b.setAttribute("aria-checked", b.dataset.v === pref(b.dataset.pick)));
    };
    const refresh = () => { paintRoot(); sync(); paintMeta(); };

    const apply = (name, v) => {
      if (pref(name) === v) return;
      const set = () => {
        try { v === PREFS[name].def ? localStorage.removeItem(PREFS[name].key) : localStorage.setItem(PREFS[name].key, v); } catch (e) {}
        refresh();
        document.dispatchEvent(new CustomEvent("ds-pref", { detail: { name, value: v } }));
        if (name === "lang") setTimeout(() => location.reload(), 180);  // the page head loads the new dictionary
      };
      // Theme changes cross-fade the whole page when the browser can
      const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (name === "theme" && document.startViewTransition && !calm) {
        root.classList.add("is-theming");
        document.startViewTransition(set).finished.finally(() => root.classList.remove("is-theming"));
      } else set();
      if (name === "text") requestAnimationFrame(() => fit($('[data-view="text"]', el)));
      // The QR studio's format menu follows a new default straight away
      const fmt = $('select[data-k="exp.fmt"]');
      if (name === "format" && fmt && v !== "auto" && fmt.value !== v) {
        fmt.value = v;
        fmt.dispatchEvent(new Event("change", { bubbles: true }));
        fmt.dispatchEvent(new Event("sync"));
      }
    };

    // Clear: first tap arms it, a second tap within 3 seconds wipes everything
    const clearBtn = $("[data-set-clear]", el), clearLabel = $("[data-clear-label]", el);
    const disarm = () => { clearBtn.classList.remove("is-armed"); clearLabel.textContent = "Clear my saved stuff"; };
    const clearAll = () => {
      if (!clearBtn.classList.contains("is-armed")) {
        clearBtn.classList.add("is-armed");
        clearLabel.textContent = "Tap again to clear everything";
        clearTimeout(clearBtn._t);
        clearBtn._t = setTimeout(disarm, 3000);
        return;
      }
      clearTimeout(clearBtn._t);
      try { Object.keys(localStorage).filter(k => k.startsWith("ds-")).forEach(k => localStorage.removeItem(k)); } catch (e) {}
      disarm();
      refresh();
      toast("All cleared. Starting fresh");
      setTimeout(() => location.reload(), 900);
    };

    let lastBtn = null;
    const open = (on, from) => {
      if (on === !el.hidden) return;
      clearTimeout(el._t);
      if (on) {
        lastBtn = from || $(".set-btn");
        el.hidden = false;
        go("root");
        requestAnimationFrame(() => el.classList.add("is-open"));
        setTimeout(() => $(".set-row", el).focus({ preventScroll: true }), 60);
      } else {
        el.classList.remove("is-open");
        disarm();
        el._t = setTimeout(() => { el.hidden = true; }, 260);
        if (lastBtn && el.contains(document.activeElement)) lastBtn.focus({ preventScroll: true });
      }
      $$(".set-btn").forEach(b => b.setAttribute("aria-expanded", on));
    };
    const toRoot = () => { go("root"); $(".set-row", el).focus({ preventScroll: true }); };

    $$("[data-open-settings]").forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      if (innerWidth < 1024 && window.DSCloseDrawer) window.DSCloseDrawer();
      open(el.hidden, b);
    }));
    el.addEventListener("click", e => {
      const t = e.target.closest("[data-pick], [data-set-go], [data-set-back], [data-set-close], [data-set-clear]");
      if (!t) return;
      if (t.dataset.pick) apply(t.dataset.pick, t.dataset.v);
      else if (t.dataset.setGo) {
        const view = t.dataset.setGo, name = view === "appearance" ? "theme" : view;
        go(view);
        setTimeout(() => $(`[data-pick="${name}"][data-v="${pref(name)}"]`, el).focus({ preventScroll: true }), 60);
      }
      else if (t.hasAttribute("data-set-back")) toRoot();
      else if (t.hasAttribute("data-set-clear")) clearAll();
      else open(false);
    });
    // Arrow keys move through each list, like a native radio group
    el.addEventListener("keydown", e => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      const cur = document.activeElement.closest && document.activeElement.closest("[data-pick]");
      if (!keys[e.key] || !cur) return;
      e.preventDefault();
      const all = $$(`[data-pick="${cur.dataset.pick}"]`, el), i = all.indexOf(cur);
      const next = all[(i + keys[e.key] + all.length) % all.length];
      next.focus(); apply(next.dataset.pick, next.dataset.v);
    });
    document.addEventListener("pointerdown", e => { if (!el.hidden && !el.contains(e.target) && !e.target.closest("[data-open-settings]")) open(false); });
    document.addEventListener("keydown", e => {
      if (e.key !== "Escape" || el.hidden) return;
      const sub = views.find(v => v.classList.contains("is-on") && v.dataset.view !== "root");
      sub ? toRoot() : open(false);
    });

    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintMeta);
    window.addEventListener("storage", e => { if (!e.key || e.key.startsWith("ds-")) refresh(); });
    refresh();
  }

  // GitHub Pages lets browsers keep a page for up to 10 minutes. If a newer
  // version is live, reload once so nobody sits on a stale page.
  function freshness() {
    const meta = $('meta[name="ds-version"]');
    if (!meta || !window.fetch || location.protocol === "file:") return;
    fetch("version.json?t=" + Date.now(), { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (!j || !j.v || !(j.v > meta.content)) return;
        const key = "ds-reloaded-" + j.v;
        try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch (e) { return; }
        location.reload();
      })
      .catch(() => {});
  }

  /* ---------- Visitor stats (GoatCounter, when DS.site.goatcounter is set) ----------
     Counts page views and a few actions — downloads, WhatsApp and email
     clicks, searches, shares, chat opens — without cookies or personal data.
     Actions show in GoatCounter as paths like "download/mato-logo.svg". */
  const statsQueue = [];
  const track = (path, title) => {
    if (!DS.site.goatcounter) return;
    const ev = { path: String(path).toLowerCase().replace(/\s+/g, "-").slice(0, 120), title: title || path, event: true };
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count(ev); else statsQueue.push(ev);
  };
  function stats() {
    const code = DS.site.goatcounter;
    if (!code || /^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${code}.goatcounter.com/count`;
    s.onload = () => { while (statsQueue.length) window.goatcounter.count(statsQueue.shift()); };
    document.head.appendChild(s);

    const fileOf = el => {
      const href = el.getAttribute("href") || "";
      return el.getAttribute("download") || (href.startsWith("blob:") ? "" : href.split(/[/?#]/).filter(Boolean).pop()) || "";
    };
    document.addEventListener("click", e => {
      const el = e.target.closest("a, button");
      if (!el) return;
      const href = el.getAttribute("href") || "";
      const id = document.body.dataset.id || new URLSearchParams(location.search).get("id") || "";
      if (href.includes("wa.me/")) return track("contact/whatsapp", "WhatsApp");
      if (href.startsWith("mailto:")) return track("contact/email", "Email");
      if (el.matches("[data-share]")) return track(`share/${id}`, "Share");
      if (el.matches("[data-dl-svg], [data-dl-png]")) return track(`download/icon-${location.hash.slice(1) || "icon"}.${el.matches("[data-dl-svg]") ? "svg" : "png"}`, "Icon download");
      if (el.matches("[data-qs-dl]")) return track("download/qr-code", "QR code download");
      if (el.matches("[data-pg-png], [data-pal-png]")) return track("download/palette-png", "Palette download");
      if (el.matches("a[download], .dlx-go, .dl-all") || href.includes("drive.google.com")) return track(`download/${fileOf(el) || id || "file"}`, "File download");
    }, true);
    const q = new URLSearchParams(location.search).get("q");
    if (q) track(`search/${q.trim()}`, "Search");
    document.addEventListener("ds-chat-open", () => track("chat/open", "Chat opened"));
  }

  /* ---------- Boot ---------- */
  const page = document.body.dataset.page;
  freshness();
  // A tab left open also checks again when you come back to it, so it picks up updates
  let lastCheck = Date.now();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || Date.now() - lastCheck < 30000) return;
    lastCheck = Date.now();
    freshness();
  });
  stats();
  i18n();
  header(page === "browse" ? (new URLSearchParams(location.search).get("cat") || "browse") : page);
  footer();
  chrome();
  settings();
  ({ home, browse, item, icons, palettes, qr, learn, license, canvas }[page] || (() => {}))();
  enhanceSelects();
  sliders();
  tooltips();
  colorPicker();
  quickView();
  pressFX();
  reveal();
  if (window.DSChat) window.DSChat({ $, $$, esc, icon, libIcon, imgSrc, items, DS, itemUrl, formatsOf, fmtBadge, waLink, mailLink, FORMATS, APPS, LANG });
})();
