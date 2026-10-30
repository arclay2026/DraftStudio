/* =====================================================================
   DESIGN BASICS — the free beginner course on the Learn page
   Six lesson cards, each with a labelled diagram (js/academy-figures.js).
   A card opens the full written lesson in a reader: sections with figures,
   common mistakes, a recap and a tool to practise in. Lessons have their
   own address (learn.html#lesson-colour) so they can be shared.
   site.js calls window.DSAcademy(kit) on the Learn page.
   ===================================================================== */
window.DSAcademy = function (kit) {
  const { $, $$, esc, icon } = kit;
  const root = $("[data-academy]");
  const FIG = window.DSFigures;
  if (!root || !FIG) return;

  const LESSONS = window.DS_LESSONS || [];

  /* ---------- Cards ---------- */
  const cover = l => (FIG.cover[l.key] ? FIG.cover[l.key]() : "");
  const card = (l, i) => `
    <button class="ac-card reveal" type="button" data-ac="${i}" style="--d:${i}">
      <span class="ac-stage" aria-hidden="true">${cover(l)}</span>
      <span class="ac-info">
        <span class="ac-meta"><b>Lesson ${i + 1}</b><span>${l.time} · ${l.sections.length} parts</span></span>
        <span class="ac-title-row"><strong>${l.title}</strong>${icon("arrow-right")}</span>
        <span class="ac-line">${l.line}</span>
      </span>
    </button>`;
  const drawCards = () => { root.innerHTML = `<div class="ac-grid">${LESSONS.map(card).join("")}</div>`; };
  drawCards();

  /* ---------- The reader ---------- */
  const reader = document.createElement("div");
  reader.className = "ac-reader";
  reader.hidden = true;
  reader.innerHTML = `
    <div class="ac-backdrop" data-ac-close></div>
    <article class="ac-panel" role="dialog" aria-modal="true" aria-labelledby="ac-title" tabindex="-1">
      <header class="ac-bar">
        <span class="ac-step" data-ac-step></span>
        <span class="ac-nav">
          <button type="button" data-ac-go="-1" aria-label="Previous lesson">${icon("arrow-left")}</button>
          <button type="button" data-ac-go="1" aria-label="Next lesson">${icon("arrow-right")}</button>
          <button type="button" data-ac-close aria-label="Close">${icon("close")}</button>
        </span>
        <i class="ac-progress" data-ac-progress></i>
      </header>
      <div class="ac-scroll" data-ac-scroll><div class="ac-doc" data-ac-doc></div></div>
    </article>`;
  document.body.appendChild(reader);
  const panel = $(".ac-panel", reader), scroller = $("[data-ac-scroll]", reader), doc = $("[data-ac-doc]", reader);
  let cur = 0, lastCard = null;

  const figure = (name, caption, n) => `<figure class="ac-fig" data-fig="${name}">${FIG.fig[name] ? FIG.fig[name]() : ""}<figcaption><b>Figure ${n}</b> ${esc(caption)}</figcaption></figure>`;
  const lessonHtml = (l, i) => {
    const next = LESSONS[(i + 1) % LESSONS.length];
    return `
      <p class="ac-kicker">Design Basics · Lesson ${i + 1} of ${LESSONS.length}</p>
      <h1 id="ac-title">${esc(l.title)}</h1>
      <p class="ac-lead">${esc(l.intro)}</p>
      <nav class="ac-toc" aria-label="In this lesson">
        <p class="ac-label">In this lesson</p>
        <ol>${l.sections.map((s, k) => `<li><a href="#ac-s${k + 1}" data-ac-jump="${k + 1}">${esc(s.h)}</a></li>`).join("")}</ol>
      </nav>
      ${l.sections.map((s, k) => `
        <section class="ac-sec" id="ac-s${k + 1}">
          <h2><span>${k + 1}</span>${esc(s.h)}</h2>
          ${s.body.map(p => `<p>${p}</p>`).join("")}
          ${figure(s.fig, s.caption, k + 1)}
          ${s.tip ? `<aside class="ac-tip"><b>Pro tip</b><p>${esc(s.tip)}</p></aside>` : ""}
        </section>`).join("")}
      <section class="ac-sec ac-end">
        <h2>Common mistakes</h2>
        <ul class="ac-bad">${l.mistakes.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
        <h2>Recap</h2>
        <ul class="ac-good">${l.recap.map(m => `<li>${icon("check")}<span>${esc(m)}</span></li>`).join("")}</ul>
        <div class="ac-practise">
          <div><p class="ac-label">Practise it</p><p>${esc(l.practise[2])}</p></div>
          <a class="btn btn-dark" href="${l.practise[0]}">${esc(l.practise[1])} <span class="arr">${icon("arrow-right")}</span></a>
        </div>
        <button type="button" class="ac-next" data-ac-go="1">
          <span class="ac-next-cover" aria-hidden="true">${cover(next)}</span>
          <span><small>Next lesson</small><b>${esc(next.title)}</b><span>${esc(next.line)}</span></span>
          ${icon("arrow-right")}
        </button>
      </section>`;
  };
  const fill = i => {
    cur = (i + LESSONS.length) % LESSONS.length;
    const l = LESSONS[cur];
    $("[data-ac-step]", reader).textContent = `Lesson ${cur + 1} of ${LESSONS.length} · ${l.time}`;
    doc.innerHTML = lessonHtml(l, cur);
    scroller.scrollTop = 0;
    progress();
    if (location.hash !== "#lesson-" + l.key) history.replaceState(null, "", "#lesson-" + l.key);
  };
  const progress = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    $("[data-ac-progress]", reader).style.transform = `scaleX(${max > 0 ? Math.min(1, scroller.scrollTop / max) : 0})`;
  };
  scroller.addEventListener("scroll", progress, { passive: true });

  const open = i => {
    fill(i);
    clearTimeout(reader._t);
    reader.hidden = false;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => reader.classList.add("is-open"));
    setTimeout(() => panel.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    reader.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    reader._t = setTimeout(() => { reader.hidden = true; }, 300);
    if (/^#lesson-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    if (lastCard) lastCard.focus({ preventScroll: true });
  };
  root.addEventListener("click", e => { const c = e.target.closest("[data-ac]"); if (c) { lastCard = c; open(+c.dataset.ac); } });
  reader.addEventListener("click", e => {
    if (e.target.closest("[data-ac-close]")) { close(); return; }
    const g = e.target.closest("[data-ac-go]");
    if (g) { fill(cur + +g.dataset.acGo); return; }
    const j = e.target.closest("[data-ac-jump]");
    if (j) { e.preventDefault(); const t = $("#ac-s" + j.dataset.acJump, doc); if (t) scroller.scrollTo({ top: t.offsetTop - 70, behavior: "smooth" }); }
  });
  document.addEventListener("keydown", e => {
    if (reader.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") fill(cur + (e.key === "ArrowRight" ? 1 : -1));
  });

  // Open a lesson from its address (learn.html#lesson-colour)
  const fromHash = () => { const k = (/^#lesson-(\w+)/.exec(location.hash) || [])[1], i = LESSONS.findIndex(l => l.key === k); if (i > -1) open(i); };
  fromHash();
  addEventListener("hashchange", () => { if (reader.hidden) fromHash(); });

  // The type figures measure real fonts: draw again once the web fonts have arrived
  // Only the drawings are replaced: redrawing the cards themselves would leave them invisible,
  // because the page's fade-in has already started watching the first ones
  if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => {
    $$(".ac-card .ac-stage", root).forEach((st, k) => { st.innerHTML = cover(LESSONS[k]); });
    if (!reader.hidden) $$(".ac-fig", doc).forEach(f => { const sv = f.querySelector("svg"), name = f.dataset.fig; if (sv && name && FIG.fig[name]) sv.outerHTML = FIG.fig[name](); });
  });
};
