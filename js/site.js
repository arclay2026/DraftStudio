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

  /* ---------- Helpers ---------- */
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (id, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id] || ""}</svg>`;
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const catOf = name => CATS.find(c => c.name === name || c.slug === slug(name));

  // Newest first; catalogue numbers follow the order things were added (oldest = DS-001)
  const items = DS.items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  items.slice().reverse().forEach((it, i) => { it.num = "DS–" + String(i + 1).padStart(3, "0"); });

  const isPaid = it => !!it.price;
  const formatsOf = it => {
    const list = isPaid(it) ? (it.includes || []) : (it.files || []).map(f => f.format.toUpperCase());
    return list.filter(f => f !== "ZIP").filter((f, i, a) => a.indexOf(f) === i);
  };
  const isExternal = p => /^https?:\/\//.test(p);
  const fmtBadge = (f, extra = "") => `<span class="fmt ${extra}" data-f="${esc(f)}">${esc(f)}</span>`;
  const itemUrl = it => `item.html?id=${encodeURIComponent(it.id)}`;
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

  function card(it) {
    const fmts = formatsOf(it);
    const tag = isPaid(it) ? `<span class="price-tag">${esc(it.price)}</span>` : `<span class="free-tag">Free</span>`;
    return `
      <article class="card reveal">
        <div class="card-media">
          <img src="${esc(it.preview)}" alt="" loading="lazy">
          <div class="card-badges">
            <span class="fmts">${fmts.slice(0, 2).map(f => fmtBadge(f, "solid")).join("")}${fmts.length > 2 ? `<span class="fmt solid more">+${fmts.length - 2}</span>` : ""}</span>
            ${tag}
          </div>
          <span class="card-cta" aria-hidden="true">${icon(isPaid(it) ? "arrow-right" : "download")}</span>
        </div>
        <div class="card-body">
          <div>
            <h3><a href="${itemUrl(it)}">${esc(it.title)}</a></h3>
            <p class="sub">${esc(it.category)}${it.specs ? " · " + esc(it.specs.split("·")[0].trim()) : ""}</p>
          </div>
          <span class="num">${it.num}</span>
        </div>
      </article>`;
  }

  /* ---------- Header & footer ---------- */
  // Diagonal arrow used in the round badge on dark pill buttons
  const ARR = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;

  function header(active) {
    const link = (href, label, key) => `<a href="${href}"${active === key ? ' aria-current="page"' : ""}>${label}</a>`;
    const more = [
      { href: "browse.html?cat=vectors", label: "Vectors", key: "vectors", note: "AI · SVG · EPS" },
      { href: "icons.html", label: "Icons", key: "icons", note: "SVG · PNG" },
      { href: "license.html", label: "License", key: "license", note: "& FAQ" }
    ];
    const el = $("[data-header]");
    if (!el) return;
    el.outerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <header class="nav">
        <div class="nav-in">
          <a class="logo" href="index.html" aria-label="Draft Studio home">
            <img src="assets/logo.svg" alt="Draft Studio" width="180" height="28">
          </a>
          <nav class="nav-links" aria-label="Main">
            ${link("index.html", "Home", "home")}
            ${link("browse.html?cat=mockups", "Mockups", "mockups")}
            ${link("browse.html?cat=logos", "Logos", "logos")}
            ${link("browse.html?cat=templates", "Templates", "templates")}
            <div class="nav-more">
              <button class="nav-more-btn${more.some(m => m.key === active) ? " is-current" : ""}" type="button" aria-expanded="false" aria-haspopup="true">More ${icon("chevron-right")}</button>
              <div class="nav-drop">
                ${more.map(m => `<a href="${m.href}"${active === m.key ? ' aria-current="page"' : ""}>${m.label}<small>${m.note}</small></a>`).join("")}
                <button type="button" data-open-search>Search<small>press /</small></button>
              </div>
            </div>
          </nav>
          <div class="nav-tools">
            <a class="btn btn-dark btn-nav" href="browse.html">Browse files <span class="arr">${ARR}</span></a>
            <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon("menu")}</button>
          </div>
        </div>
      </header>
      <div class="mobile-menu" id="mobile-menu" aria-label="Menu">
        <a href="index.html">Home</a>
        ${CATS.map(c => `<a href="browse.html?cat=${c.slug}">${c.name}<span>${c.formats.join(" · ")}</span></a>`).join("")}
        <a href="icons.html">Icons<span>SVG · PNG</span></a>
        <a href="license.html">License<span>FAQ</span></a>
        <button type="button" data-open-search>Search<span>Find a file</span></button>
        <a class="btn btn-dark btn-lg" href="browse.html">Browse files <span class="arr">${ARR}</span></a>
      </div>`;
  }

  function footer() {
    const el = $("[data-footer]");
    if (!el) return;
    const s = DS.site;
    el.outerHTML = `
      <footer class="footer">
        <div class="wrap">
          <div class="footer-top">
            <div>
              <a class="logo" href="index.html" aria-label="Draft Studio home">
                <img src="assets/logo.svg" alt="Draft Studio" width="180" height="28">
              </a>
              <p class="footer-blurb">${esc(s.tagline)}</p>
            </div>
            <div>
              <h4>Files</h4>
              <ul>${CATS.map(c => `<li><a href="browse.html?cat=${c.slug}">${c.name}</a></li>`).join("")}<li><a href="icons.html">Icons</a></li></ul>
            </div>
            <div>
              <h4>Studio</h4>
              <ul>
                <li><a href="license.html">License</a></li>
                <li><a href="license.html#faq">FAQ</a></li>
                <li><a href="${mailLink("Design request")}">Request a design</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:${esc(s.email)}">Email</a></li>
                <li><a href="https://wa.me/${esc(s.whatsapp)}" target="_blank" rel="noopener">WhatsApp</a></li>
                ${s.instagram ? `<li><a href="${esc(s.instagram)}" target="_blank" rel="noopener">Instagram</a></li>` : ""}
              </ul>
            </div>
          </div>
          <div class="footer-word" aria-hidden="true"><span>Draft</span><span class="hl">Studio.</span></div>
          <div class="footer-bottom">
            <span>© ${new Date().getFullYear()} ${esc(s.name)}. Free files, made with care.</span>
            <a href="#top" data-top>Back to top ↑</a>
          </div>
        </div>
      </footer>`;
  }

  /* ---------- Search overlay ---------- */
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
      const q = input.value.trim().toLowerCase();
      const hit = s => s.toLowerCase().includes(q);
      const its = items.filter(it => !q || hit([it.title, it.category, (it.tags || []).join(" "), formatsOf(it).join(" ")].join(" "))).slice(0, 6);
      const ics = q ? DS.icons.filter(i => hit([i.name, i.group, i.tags.join(" ")].join(" "))).slice(0, 6) : [];
      const cats = CATS.filter(c => !q || hit(c.name + " " + c.formats.join(" ")));
      let html = "";
      if (its.length) html += `<div class="group">Files</div>` + its.map(it => `
        <a href="${itemUrl(it)}"><span class="thumb"><img src="${esc(it.preview)}" alt=""></span>
          <span><span class="t">${esc(it.title)}</span><br><span class="s">${esc(it.category)} · ${formatsOf(it).join(", ")}</span></span></a>`).join("");
      if (ics.length) html += `<div class="group">Icons</div>` + ics.map(i => `
        <a href="icons.html#${i.id}"><span class="thumb">${icon(i.id)}</span>
          <span><span class="t">${esc(i.name)}</span><br><span class="s">Icon · ${esc(i.group)}</span></span></a>`).join("");
      if (cats.length) html += `<div class="group">Categories</div>` + cats.map(c => `
        <a href="browse.html?cat=${c.slug}"><span class="thumb">${icon("folder")}</span>
          <span><span class="t">${c.name}</span><br><span class="s">${c.formats.join(" · ")}</span></span></a>`).join("");
      if (q) html += `<a href="browse.html?q=${encodeURIComponent(input.value.trim())}"><span class="thumb">${icon("arrow-right")}</span><span><span class="t">See all results for “${esc(input.value.trim())}”</span></span></a>`;
      if (!its.length && !ics.length && !cats.length) html = `<div class="none">Nothing matches “${esc(input.value)}” yet.<br>Press Enter to search all files.</div>`;
      results.innerHTML = html;
      active = -1;
    };

    const open = () => { const mm = $("#mobile-menu.is-open"); if (mm) $(".menu-btn").click(); wrap.classList.add("is-open"); document.body.style.overflow = "hidden"; input.value = ""; render(); input.focus(); };
    const close = () => { wrap.classList.remove("is-open"); document.body.style.overflow = ""; };
    input.addEventListener("input", render);
    input.addEventListener("keydown", e => {
      const links = $$("a", results);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length;
        links.forEach((l, i) => l.classList.toggle("is-active", i === active));
        links[active] && links[active].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (links[active]) location.href = links[active].href;
        else if (input.value.trim()) location.href = `browse.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
    wrap.addEventListener("click", e => { if (e.target === wrap) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && wrap.classList.contains("is-open")) close();
      if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
    $$("[data-open-search]").forEach(b => b.addEventListener("click", open));
  }

  /* ---------- Shared behaviour ---------- */
  function chrome() {
    const nav = $(".nav");
    const onScroll = () => nav && nav.classList.toggle("is-scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true }); onScroll();

    const more = $(".nav-more"), moreBtn = $(".nav-more-btn");
    if (more) {
      const setMore = open => { more.classList.toggle("is-open", open); moreBtn.setAttribute("aria-expanded", open); };
      moreBtn.addEventListener("click", e => { e.stopPropagation(); setMore(!more.classList.contains("is-open")); });
      if (matchMedia("(hover: hover)").matches) {
        more.addEventListener("mouseenter", () => setMore(true));
        more.addEventListener("mouseleave", () => setMore(false));
      }
      document.addEventListener("click", e => { if (!more.contains(e.target)) setMore(false); });
      document.addEventListener("keydown", e => { if (e.key === "Escape") setMore(false); });
    }

    const mb = $(".menu-btn"), mm = $("#mobile-menu");
    mb && mb.addEventListener("click", () => {
      const open = !mm.classList.contains("is-open");
      mm.classList.toggle("is-open", open);
      mb.setAttribute("aria-expanded", open);
      mb.innerHTML = icon(open ? "close" : "menu");
      document.body.style.overflow = open ? "hidden" : "";
    });

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
    // Hero dot card (decorative): the first dots light up one after another
    const dots = $("[data-dots]");
    if (dots) {
      const lit = [0, 1, 2, 3, 4, 7, 8, 9];
      dots.innerHTML = Array.from({ length: 21 }, (_, i) => `<i class="${lit.includes(i) ? "on" : ""}" style="--n:${lit.indexOf(i)}"></i>`).join("");
    }
    $$("[data-item-count]").forEach(el => { el.textContent = items.length; });
    $$("[data-icon-total]").forEach(el => { el.textContent = DS.icons.length; });

    // Category tiles: counts
    $$("[data-cat-count]").forEach(el => {
      const n = items.filter(i => slug(i.category) === el.dataset.catCount).length;
      el.innerHTML = n ? `${n} file${n === 1 ? "" : "s"}` : `<span class="soon">Coming soon</span>`;
    });
    $$("[data-icon-count]").forEach(el => { el.textContent = DS.icons.length + " icons"; });
    const ig = $("[data-tile-icons]");
    if (ig) ig.innerHTML = ["brush", "pen-tool", "layers", "palette", "image", "vector", "crop", "type", "camera", "eyedropper", "magic", "ruler", "folder", "download", "heart", "star", "rocket", "bolt"].map(i => `<span>${icon(i)}</span>`).join("");

    // Fresh drops with filter chips
    const grid = $("[data-latest]"), chips = $("[data-latest-filters]");
    if (grid) {
      const draw = cat => {
        const list = items.filter(i => cat === "all" || slug(i.category) === cat).slice(0, 8);
        grid.innerHTML = list.length ? list.map(card).join("") : emptyState(catOf(cat));
        reveal(grid);
      };
      chips.innerHTML = [{ name: "All", slug: "all" }].concat(CATS).map((c, i) => {
        const n = c.slug === "all" ? items.length : items.filter(it => slug(it.category) === c.slug).length;
        return `<button class="chip" type="button" data-cat="${c.slug}" aria-pressed="${i === 0}">${c.name} <span class="n">${n}</span></button>`;
      }).join("");
      chips.addEventListener("click", e => {
        const b = e.target.closest("[data-cat]"); if (!b) return;
        $$("[data-cat]", chips).forEach(x => x.setAttribute("aria-pressed", x === b));
        draw(b.dataset.cat);
      });
      draw("all");
    }

    const fx = $("[data-formats]");
    if (fx) formatExplorer(fx);

    // Icon wall
    const wall = $("[data-icon-wall]");
    if (wall) wall.innerHTML = DS.icons.slice(0, 36).map(i => `<a href="icons.html#${i.id}" title="${esc(i.name)}" aria-label="${esc(i.name)} icon">${icon(i.id)}</a>`).join("");

    // CTA links
    $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-mail]").forEach(a => { a.href = mailLink(a.dataset.mail); });
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
    const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
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
    const state = { cat: params.get("cat") || "all", q: params.get("q") || "", fmt: params.get("format") || "", sort: params.get("sort") || "new" };
    const grid = $("[data-results]"), count = $("[data-count]");
    const cats = $("[data-cats]"), fmts = $("[data-fmts]"), q = $("[data-q]"), sort = $("[data-sort]");
    const allFmts = ["PSD", "AI", "SVG", "EPS", "PDF", "PNG"];

    cats.innerHTML = [{ name: "All", slug: "all" }].concat(CATS).map(c => {
      const n = c.slug === "all" ? items.length : items.filter(it => slug(it.category) === c.slug).length;
      return `<button class="chip" type="button" data-cat="${c.slug}">${c.name} <span class="n">${n}</span></button>`;
    }).join("");
    fmts.innerHTML = allFmts.map(f => `<button class="chip" type="button" data-fmt="${f}">${fmtBadge(f)}</button>`).join("");
    q.value = state.q;
    sort.value = state.sort;

    const sync = () => {
      const p = new URLSearchParams();
      if (state.cat !== "all") p.set("cat", state.cat);
      if (state.q) p.set("q", state.q);
      if (state.fmt) p.set("format", state.fmt);
      if (state.sort !== "new") p.set("sort", state.sort);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    };

    const draw = () => {
      const cat = catOf(state.cat);
      $("[data-title]").innerHTML = cat ? esc(cat.name) : state.q ? `“${esc(state.q)}”` : `Every <span class="hl">file.</span>`;
      $("[data-lede]").textContent = cat ? cat.blurb : "Every mockup, vector, logo and template in the studio. Free to download, free to use.";
      document.title = (cat ? cat.name : "Browse") + " · Draft Studio";
      $$("[data-cat]", cats).forEach(b => b.setAttribute("aria-pressed", b.dataset.cat === state.cat));
      $$("[data-fmt]", fmts).forEach(b => b.setAttribute("aria-pressed", b.dataset.fmt === state.fmt));

      const ql = state.q.toLowerCase();
      let list = items.filter(it =>
        (state.cat === "all" || slug(it.category) === state.cat) &&
        (!state.fmt || formatsOf(it).includes(state.fmt)) &&
        (!ql || [it.title, it.category, it.description, (it.tags || []).join(" "), formatsOf(it).join(" ")].join(" ").toLowerCase().includes(ql)));
      if (state.sort === "az") list = list.slice().sort((a, b) => a.title.localeCompare(b.title));
      if (state.sort === "old") list = list.slice().reverse();
      if (state.sort === "free") list = list.filter(i => !isPaid(i));

      count.textContent = `${list.length} result${list.length === 1 ? "" : "s"}`;
      grid.innerHTML = list.length ? list.map(card).join("") : emptyState(state.q || state.fmt ? null : cat);
      reveal(grid);
      sync();
    };

    cats.addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (b) { state.cat = b.dataset.cat; draw(); } });
    fmts.addEventListener("click", e => { const b = e.target.closest("[data-fmt]"); if (b) { state.fmt = state.fmt === b.dataset.fmt ? "" : b.dataset.fmt; draw(); } });
    q.addEventListener("input", () => { state.q = q.value.trim(); draw(); });
    sort.addEventListener("change", () => { state.sort = sort.value; draw(); });
    draw();
  }

  /* ---------- Item ---------- */
  function item() {
    const id = new URLSearchParams(location.search).get("id");
    const it = items.find(i => i.id === id);
    const main = $("[data-item]");
    if (!it) {
      main.innerHTML = `<div class="wrap section"><div class="empty"><h3>That file has moved.</h3><p>We couldn't find “${esc(id || "")}”. Try browsing instead.</p><a class="btn btn-dark" href="browse.html">Browse all files</a></div></div>`;
      return;
    }
    document.title = `${it.title} · Draft Studio`;
    const cat = catOf(it.category);
    const fmts = formatsOf(it);
    const zip = (it.files || []).find(f => f.format.toUpperCase() === "ZIP");
    const fileName = f => f.name || f.path.split("/").pop();
    const dlRow = f => {
      const ext = isExternal(f.path);
      return `<a class="dl" href="${esc(f.path)}" ${ext ? 'target="_blank" rel="noopener"' : `download="${esc(fileName(f))}"`}>
        ${fmtBadge(f.format.toUpperCase())}
        <span class="name"><b>${esc(fileName(f))}</b><small>${ext ? "Opens Google Drive" : esc(f.size || "")}</small></span>
        ${icon(ext ? "external-link" : "download")}
      </a>`;
    };

    const actions = isPaid(it) ? `
      <div class="price-box">
        <span class="mono mute">${it.sold ? "Sold" : "Exclusive · sold once"}</span>
        <div class="amount">${esc(it.price)}</div>
        <p>You get ${esc((it.includes || []).join(", "))}. Once it's sold it comes off the shelf for good.</p>
        ${it.sold ? `<span class="btn" aria-disabled="true">Sold</span>` :
          `<a class="btn btn-dark" href="${waLink(`Hi Draft Studio, I'd like to buy “${it.title}” (${it.num}) for ${it.price}.`)}" target="_blank" rel="noopener">${icon("chat")} Buy on WhatsApp</a>`}
      </div>` : `
      ${it.requires ? `<div class="notice">${icon("lightbulb")}<span>This file needs <b>${esc(it.requires)}</b> (or free Photopea in your browser).</span></div>` : ""}
      ${zip ? `<a class="btn btn-dark dl-all" href="${esc(zip.path)}" download>${icon("download")} Download all${zip.size ? " · " + esc(zip.size) : ""}</a>` : ""}
      <div class="downloads">${(it.files || []).filter(f => f !== zip).map(dlRow).join("")}</div>`;

    const related = items.filter(i => i !== it && i.category === it.category).concat(items.filter(i => i !== it && i.category !== it.category)).slice(0, 4);

    main.innerHTML = `
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb">
          <a href="index.html">Home</a><span>/</span>
          <a href="browse.html?cat=${cat ? cat.slug : ""}">${esc(it.category)}</a><span>/</span>
          <span>${it.num}</span>
        </nav>
        <div class="item">
          <div class="item-media">
            <button class="frame" type="button" data-zoom aria-label="Enlarge preview">
              <img src="${esc(it.preview)}" alt="${esc(it.title)} preview">
              <span class="zoom-hint">${icon("search")} Zoom</span>
            </button>
          </div>
          <div class="item-info">
            <span class="eyebrow"><span class="dot"></span>${it.num} · ${esc(it.category)}</span>
            <h1>${esc(it.title)}</h1>
            <p class="desc">${esc(it.description || "")}</p>
            <div class="item-fmts">${fmts.map(f => fmtBadge(f)).join("")}${isPaid(it) ? "" : `<span class="free-tag">Free</span>`}</div>
            <dl class="specs">
              ${it.specs ? `<div><dt>Size</dt><dd>${esc(it.specs)}</dd></div>` : ""}
              <div><dt>Formats</dt><dd>${fmts.join(", ")}</dd></div>
              ${it.requires ? `<div><dt>Opens in</dt><dd>${esc(it.requires)}</dd></div>` : ""}
              <div><dt>Added</dt><dd>${it.date ? new Date(it.date + "T00:00").toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "—"}</dd></div>
              <div><dt>License</dt><dd>${isPaid(it) ? "Exclusive, full rights to the buyer" : "Free for personal &amp; commercial use"}</dd></div>
            </dl>
            ${actions}
            <div class="item-actions">
              <button class="btn btn-sm" type="button" data-share>${icon("share")} Share</button>
              <a class="btn btn-sm" href="browse.html?cat=${cat ? cat.slug : ""}">More ${esc(it.category.toLowerCase())}</a>
            </div>
            ${isPaid(it) ? "" : `<p class="lic-note">${esc(DS.site.license)} <a href="license.html">Read the license</a></p>`}
          </div>
        </div>
      </div>
      ${related.length ? `
      <section class="section">
        <div class="wrap">
          <div class="sec-head"><div><span class="eyebrow"><span class="dot"></span>Keep going</span><h2>You might also like</h2></div>
          <a class="link-arrow" href="browse.html">Browse everything ${icon("arrow-right")}</a></div>
          <div class="grid">${related.map(card).join("")}</div>
        </div>
      </section>` : ""}`;

    // Zoom
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<img src="${esc(it.preview)}" alt="${esc(it.title)} preview"><button class="icon-btn" type="button" aria-label="Close">${icon("close")}</button>`;
    document.body.appendChild(lb);
    const closeLb = () => { lb.classList.remove("is-open"); document.body.style.overflow = ""; };
    $("[data-zoom]").addEventListener("click", () => { lb.classList.add("is-open"); document.body.style.overflow = "hidden"; });
    lb.addEventListener("click", closeLb);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeLb(); });

    $("[data-share]").addEventListener("click", () => {
      const data = { title: it.title + " · Draft Studio", text: isPaid(it) ? it.title : `Free ${fmts.join("/")} download: ${it.title}`, url: location.href };
      if (navigator.share) navigator.share(data).catch(() => {});
      else copy(location.href, "Link copied");
    });
    reveal(main);
  }

  /* ---------- Icons ---------- */
  function icons() {
    const grid = $("[data-icons]"), groups = $("[data-groups]"), q = $("[data-q]"), insp = $("[data-inspector]");
    const names = ["All"].concat(DS.icons.map(i => i.group).filter((g, i, a) => a.indexOf(g) === i));
    const state = { group: "All", q: "", color: "", size: 28, sel: null };
    const swatches = [
      { c: "", label: "Theme" }, { c: "#86de4e", label: "Lime" }, { c: "#31a8ff", label: "Blue" },
      { c: "#ff6b5c", label: "Coral" }, { c: "#ff9a00", label: "Orange" }, { c: "#b98cff", label: "Violet" }
    ];

    groups.innerHTML = names.map(g => `<button class="chip" type="button" data-g="${esc(g)}">${esc(g)} <span class="n">${g === "All" ? DS.icons.length : DS.icons.filter(i => i.group === g).length}</span></button>`).join("");

    const svgFile = (ic, color, px) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${color || "currentColor"}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONS[ic.id]}</svg>`;

    const drawInspector = () => {
      const ic = state.sel;
      if (!ic) return;
      insp.innerHTML = `
        <div class="big" style="--ic:${state.color || "var(--fg)"}">${icon(ic.id)}</div>
        <span class="mono mute">${esc(ic.group)}</span>
        <h3>${esc(ic.name)}</h3>
        <div class="opts">
          <label>Colour
            <div class="swatches">
              ${swatches.map(s => `<button class="swatch" type="button" data-c="${s.c}" aria-label="${s.label}" aria-pressed="${state.color === s.c}" style="background:${s.c || "var(--fg)"}"></button>`).join("")}
              <span class="swatch custom" title="Custom colour"><input type="color" aria-label="Custom colour" value="${state.color || "#86de4e"}"></span>
            </div>
          </label>
          <label>Preview size · <span data-size-label>${state.size}px</span>
            <input type="range" min="16" max="48" step="2" value="${state.size}" data-size>
          </label>
        </div>
        <div class="btns">
          <a class="btn btn-dark" data-dl-svg>${icon("download")} Download SVG</a>
          <button class="btn" type="button" data-dl-png>${icon("image")} Download PNG · 512px</button>
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
      $("input[type=color]", insp).addEventListener("input", e => { state.color = e.target.value; apply(); });
      $("[data-size]", insp).addEventListener("input", e => { state.size = +e.target.value; $("[data-size-label]", insp).textContent = state.size + "px"; grid.style.setProperty("--isz", state.size + "px"); });
    };

    const apply = () => { grid.style.setProperty("--ic", state.color || "var(--fg)"); drawInspector(); };

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
      $$("[data-g]", groups).forEach(b => b.setAttribute("aria-pressed", b.dataset.g === state.group));
      $("[data-count]").textContent = `${list.length} icon${list.length === 1 ? "" : "s"}`;
      grid.innerHTML = list.length ? list.map(i => `<button class="icon-cell" type="button" data-id="${i.id}" aria-pressed="${state.sel && state.sel.id === i.id}">${icon(i.id)}<span>${esc(i.name)}</span></button>`).join("")
        : `<div class="empty"><h3>No icon called that yet.</h3><p>Ask for it and we'll draw it.</p><a class="btn btn-dark" href="${waLink("Hi Draft Studio, could you add an icon for: " + state.q)}" target="_blank" rel="noopener">${icon("chat")} Request an icon</a></div>`;
    };

    groups.addEventListener("click", e => { const b = e.target.closest("[data-g]"); if (b) { state.group = b.dataset.g; draw(); } });
    q.addEventListener("input", () => { state.q = q.value.trim(); draw(); });
    grid.addEventListener("click", e => { const b = e.target.closest("[data-id]"); if (b) select(DS.icons.find(i => i.id === b.dataset.id), true); });

    draw();
    const fromHash = DS.icons.find(i => i.id === location.hash.slice(1));
    select(fromHash || DS.icons[0], false);
    if (fromHash) setTimeout(() => { const b = $(`[data-id="${fromHash.id}"]`, grid); b && b.scrollIntoView({ block: "center" }); }, 50);
  }

  /* ---------- License ---------- */
  function license() {
    const el = $("[data-license-text]");
    if (el) el.textContent = DS.site.license;
    $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener"; });
    $$("[data-mail]").forEach(a => { a.href = mailLink(a.dataset.mail); });
  }

  /* ---------- Boot ---------- */
  const page = document.body.dataset.page;
  header(page === "browse" ? (new URLSearchParams(location.search).get("cat") || "browse") : page);
  footer();
  chrome();
  ({ home, browse, item, icons, license }[page] || (() => {}))();
  reveal();
})();
