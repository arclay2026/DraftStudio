/* Websites showcase: websites.html (a card per site) and preview.html?id= (the
   live site full-screen with a desktop / tablet / phone switch). Data: DS.sites in js/data.js. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ICONS = {
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "message-circle": '<path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/>',
    "calculator": '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    "search": '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>',
    "qr-code": '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
    "pen-line": '<path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    "file-text": '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    "badge-check": '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m16 9-5.5 5.5L8 12"/>',
    "sparkles": '<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
    "monitor": '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
    "tablet": '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/>',
    "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "external-link": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    "layers": '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/>',
    "zap": '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
    "gauge": '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
    "app-window": '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M10 4v4"/><path d="M2 8h20"/><path d="M6 4v4"/>'
  };
  const ic = (id, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id] || ""}</svg>`;
  const SITES = (window.DS && DS.sites) || [];
  const byId = id => SITES.find(s => s.id === id) || SITES[0];
  const host = u => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const wa = s => `https://wa.me/${DS.site.whatsapp}?text=${encodeURIComponent(`Hi Draft Studio, I saw ${s.name} on your site and I'd like a website like it for my business.`)}`;
  const page = document.body.dataset.page;

  /* ---------- Site cards (websites.html) ---------- */
  // <div data-sites data-limit="2"> shows that many (newest first)
  $$("[data-sites]").forEach(grid => {
    const list = SITES.slice(0, +grid.dataset.limit || SITES.length);
    grid.innerHTML = list.map(s => `
      <article class="sc">
        <a class="sc-win" href="preview.html?id=${encodeURIComponent(s.id)}" aria-label="Live preview of ${esc(s.name)}">
          <div class="sb-bar"><i></i><i></i><i></i><span>${ic("globe")}${esc(host(s.url))}</span></div>
          <div class="sb-view"><img src="${esc(s.shot)}" alt="${esc(s.name)} website" loading="lazy" decoding="async"></div>
        </a>
        <div class="sc-body">
          <div class="sc-text">
            <span class="sc-type">${esc(s.type)} · ${esc(s.year)}</span>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.summary)}</p>
            <div class="sc-tags">${(s.tags || []).map(t => `<span>${esc(t)}</span>`).join("")}</div>
          </div>
          <a class="btn btn-dark" href="preview.html?id=${encodeURIComponent(s.id)}">${ic("eye")}Live preview</a>
        </div>
      </article>`).join("");
  });

  // WhatsApp buttons on these pages (data-wa="message")
  $$("[data-wa]").forEach(a => { a.href = `https://wa.me/${DS.site.whatsapp}?text=${encodeURIComponent(a.dataset.wa)}`; a.target = "_blank"; a.rel = "noopener"; });

  /* ---------- pricing.html: website packages ---------- */
  const plans = $("[data-plans]");
  if (plans && DS.webPackages) {
    const TICK = ic("check", 2.6);
    const pwa = name => `https://wa.me/${DS.site.whatsapp}?text=${encodeURIComponent(`Hi Draft Studio, I'm interested in your ${name} package (website).`)}`;
    plans.innerHTML = DS.webPackages.map(k => `
      <article class="pl${k.popular ? " is-pop" : ""}">
        <div class="pl-top">
          <h2>${esc(k.name)}</h2>
          ${k.popular ? '<span class="pl-badge">Most popular</span>' : ""}
        </div>
        <p class="pl-desc">${esc(k.desc)}</p>
        <div class="pl-price">${k.from ? "<small>From</small>" : ""}<b>${esc(k.price)}</b><span>once-off</span></div>
        <a class="btn ${k.popular ? "btn-light" : "btn-dark"} pl-btn" href="${pwa(k.name)}" target="_blank" rel="noopener">Get started</a>
        <ul>${k.items.map(i => `<li>${TICK}<span>${esc(i)}</span></li>`).join("")}</ul>
      </article>`).join("");
    const note = $("[data-plans-note]");
    if (note && DS.webPackagesNote) note.textContent = DS.webPackagesNote;
  }

  /* ---------- Home: the newest site as a small "recent work" example ---------- */
  const feat = $("[data-site-feature]");
  if (feat && SITES[0]) {
    const s = SITES[0], go = `preview.html?id=${encodeURIComponent(s.id)}`;
    feat.innerHTML = `
      <span class="wsv-label">Recent work</span>
      <a class="sc-win" href="${go}" aria-label="Live preview of ${esc(s.name)}">
        <div class="sb-bar"><i></i><i></i><i></i><span>${ic("globe")}${esc(host(s.url))}</span></div>
        <div class="sb-view"><img src="${esc(s.shot)}" alt="${esc(s.name)} website" loading="lazy" decoding="async"></div>
      </a>
      <div class="wsv-cap"><span><b>${esc(s.name)}</b>${esc(s.type)}</span><a href="${go}">Live preview ${ic("arrow-up-right")}</a></div>`;
  }

  /* ---------- preview.html ---------- */
  if (page === "preview") {
    const s = byId(new URLSearchParams(location.search).get("id"));
    if (!s) return;
    document.title = `${s.name} — live preview · Draft Studio`;
    $("[data-pv-name]").textContent = s.name;
    $("[data-pv-host]").textContent = host(s.url);
    $("[data-pv-back]").href = "websites.html";
    $("[data-pv-open]").href = s.url;
    $("[data-pv-start]").href = wa(s);
    const frame = $("[data-pv-frame]"), stage = $("[data-pv-stage]");
    frame.src = s.frame || s.url;
    // Phones and tablets don't show a scrollbar, so hide the site's own one in those
    // modes (it also narrows the page). Only possible when the site is on the same
    // origin as this page (both on GitHub Pages); otherwise this quietly does nothing.
    const frameDoc = () => { try { return frame.contentDocument; } catch (e) { return null; } };
    const scrollbar = () => {
      const d = frameDoc(); if (!d || !d.documentElement) return;
      if (!d.getElementById("ds-pv-style")) {
        const st = d.createElement("style"); st.id = "ds-pv-style";
        st.textContent = "html.ds-pv-touch{scrollbar-width:none}html.ds-pv-touch::-webkit-scrollbar,html.ds-pv-touch *::-webkit-scrollbar{display:none}";
        (d.head || d.documentElement).append(st);
      }
      d.documentElement.classList.toggle("ds-pv-touch", stage.dataset.device !== "desktop");
    };
    frame.addEventListener("load", () => { stage.classList.add("is-loaded"); scrollbar(); });
    const seg = $("[data-pv-seg]");
    const set = d => {
      stage.dataset.device = d;
      $$("button", seg).forEach(b => b.setAttribute("aria-pressed", b.dataset.device === d));
      scrollbar();
      const on = $(`[data-device="${d}"]`, seg), th = $(".pv-thumb", seg);
      th.style.width = on.offsetWidth + "px"; th.style.transform = `translateX(${on.offsetLeft - 4}px)`;
    };
    seg.addEventListener("click", e => { const b = e.target.closest("[data-device]"); if (b) set(b.dataset.device); });
    addEventListener("resize", () => set(stage.dataset.device));
    set(matchMedia("(max-width: 700px)").matches ? "phone" : "desktop");
  }
})();
