/* =====================================================================
   DESIGN BASICS — the free beginner course on the Learn page
   Six lesson cards, each with a small animated scene of what the lesson
   teaches. Clicking a card opens a glimpse of the lesson: what you'll
   learn and which free tool to practise with. Full lessons come later.
   site.js calls window.DSAcademy(kit) on the Learn page.
   ===================================================================== */
window.DSAcademy = function (kit) {
  const { $, $$, esc, icon, waLink } = kit;
  const root = $("[data-academy]");
  if (!root) return;

  const LESSONS = [
    {
      key: "colour", title: "Colour", time: "5 min",
      line: "Pick colours that work together, every time.",
      intro: "Colour sets the mood before anyone reads a word. You'll learn the colour wheel, the three harmonies designers use most, and how to keep text readable on any background.",
      learn: ["How the colour wheel works", "Complementary, analogous and triadic palettes", "The 60-30-10 rule for balanced designs", "Contrast that keeps text readable"],
      tool: ["palettes.html", "Practise in the palette generator"]
    },
    {
      key: "type", title: "Typography", time: "6 min",
      line: "Choose fonts and pair them like a pro.",
      intro: "Most designs are mostly words. You'll learn what separates serif from sans, how to pair two fonts that get along, and the spacing tricks that make text feel expensive.",
      learn: ["Serif, sans-serif and display fonts", "Pairing a heading font with a body font", "Size, weight and line height", "Letter spacing for headlines and labels"],
      tool: ["browse.html?cat=templates", "Try it on a template"]
    },
    {
      key: "layout", title: "Layout", time: "5 min",
      line: "Grids, spacing and alignment that feel calm.",
      intro: "Good layouts feel effortless because everything lines up. You'll learn how designers use grids, consistent spacing and alignment to turn a messy page into a clean one.",
      learn: ["Columns and grids", "One spacing scale for everything", "Aligning to edges, not eyeballing", "White space is not wasted space"],
      tool: ["browse.html?cat=templates", "Study a template's grid"]
    },
    {
      key: "hierarchy", title: "Hierarchy", time: "4 min",
      line: "Make the important thing impossible to miss.",
      intro: "People scan before they read. You'll learn how size, weight, colour and position guide the eye, so viewers see the right thing first, second and third.",
      learn: ["What the eye notices first", "Size and weight to rank information", "Colour and contrast for emphasis", "Leading the eye through a design"],
      tool: ["qr.html", "Practise with QR Code Studio labels"]
    },
    {
      key: "logos", title: "Logos", time: "6 min",
      line: "What makes a logo simple, memorable and yours.",
      intro: "A great logo is simple enough to draw from memory. You'll learn the main logo types, how designers build marks on a grid, and how to test a logo at tiny sizes.",
      learn: ["Wordmarks, lettermarks and symbols", "Building a mark from simple shapes", "Choosing a logo colour", "The small-size and one-colour test"],
      tool: ["browse.html?cat=logos", "Pull apart an editable logo"]
    },
    {
      key: "mockups", title: "Mockups", time: "4 min",
      line: "Present your work so clients say yes.",
      intro: "The same design looks ten times better on a real product. You'll learn how smart-object mockups work, how to choose the right scene, and how to present work to clients.",
      learn: ["How smart objects work", "Placing a design in seconds", "Choosing scenes that match the brand", "Presenting work to clients"],
      tool: ["browse.html?cat=mockups", "Use a free mockup"]
    }
  ];

  /* ---------- Animated scenes, one per lesson ---------- */
  const ART = {
    colour: () => `
      <div class="ac-wheel"><i></i><b class="ac-pin a"></b><b class="ac-pin b"></b></div>
      <div class="ac-swatches">${[0, 1, 2, 3, 4].map(i => `<span style="--i:${i}"></span>`).join("")}</div>
      <div class="ac-tags"><em>Complementary</em><em>Analogous</em><em>Triadic</em></div>`,
    type: () => `
      <div class="ac-specimen">
        <span class="ac-guides" aria-hidden="true"><i></i><i></i><i></i></span>
        <b class="ac-aa s1">Aa</b><b class="ac-aa s2">Aa</b><b class="ac-aa s3">Aa</b>
      </div>
      <div class="ac-pair"><b>Heading</b><span></span><span></span><span class="short"></span></div>`,
    layout: () => `
      <div class="ac-board">
        <span class="ac-cols">${"<i></i>".repeat(6)}</span>
        <span class="ac-blk img"></span><span class="ac-blk h1"></span><span class="ac-blk h2"></span>
        <span class="ac-blk p1"></span><span class="ac-blk p2"></span><span class="ac-blk btn"></span>
      </div>`,
    hierarchy: () => `
      <div class="ac-poster">
        <span class="ac-kicker"></span><span class="ac-title"></span><span class="ac-sub"></span>
        <span class="ac-body"></span><span class="ac-body"></span><span class="ac-cta"></span>
        <svg class="ac-path" viewBox="0 0 200 150" aria-hidden="true"><path d="M30 40 C 120 30, 170 60, 110 82 S 40 112, 70 124"/></svg>
        <em class="ac-n n1">1</em><em class="ac-n n2">2</em><em class="ac-n n3">3</em>
      </div>`,
    logos: () => `
      <svg class="ac-logo" viewBox="0 0 220 150" aria-hidden="true">
        <g class="ac-lines"><path d="M10 30H210M10 75H210M10 120H210M40 10V140M85 10V140M130 10V140"/></g>
        <g class="ac-circles"><circle cx="85" cy="75" r="45"/><circle cx="85" cy="75" r="26"/><circle cx="40" cy="75" r="45"/></g>
        <path class="ac-mark" d="M40 30h45a45 45 0 0 1 0 90H40z M62 52v46h23a23 23 0 0 0 0-46z"/>
        <text class="ac-word" x="146" y="86">Dore</text>
      </svg>`,
    mockups: () => `
      <div class="ac-scene">
        <img src="previews/sm/hoodie-mockup-one.webp" onerror="this.onerror=null;this.src='previews/hoodie-mockup-one.jpg'" alt="" loading="lazy">
        <span class="ac-art"><b>DS</b></span>
        <span class="ac-print"><b>DS</b></span>
        <span class="ac-cursor"></span>
      </div>`
  };

  const card = (l, i) => `
    <button class="ac-card reveal" type="button" data-ac="${i}" style="--d:${i}">
      <span class="ac-stage ac-${l.key}" aria-hidden="true">${ART[l.key]()}</span>
      <span class="ac-info">
        <span class="ac-meta"><b>${String(i + 1).padStart(2, "0")}</b><span>${l.time}</span></span>
        <span class="ac-title-row"><strong>${l.title}</strong>${icon("arrow-right")}</span>
        <span class="ac-line">${l.line}</span>
      </span>
    </button>`;
  root.innerHTML = `<div class="ac-grid">${LESSONS.map(card).join("")}</div>`;

  // Scenes only play while they're on screen
  const cards = $$(".ac-card", root);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("is-live", e.isIntersecting)), { threshold: .15 });
    cards.forEach(c => io.observe(c));
  } else cards.forEach(c => c.classList.add("is-live"));

  /* ---------- Lesson glimpse ---------- */
  const sheet = document.createElement("div");
  sheet.className = "ac-sheet";
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="ac-backdrop" data-ac-close></div>
    <div class="ac-panel" role="dialog" aria-modal="true" aria-labelledby="ac-sheet-title" tabindex="-1">
      <div class="ac-big" data-ac-stage aria-hidden="true"></div>
      <div class="ac-body-col">
        <div class="ac-top">
          <span class="ac-step" data-ac-step></span>
          <span class="ac-nav">
            <button type="button" data-ac-go="-1" aria-label="Previous lesson">${icon("arrow-left")}</button>
            <button type="button" data-ac-go="1" aria-label="Next lesson">${icon("arrow-right")}</button>
            <button type="button" data-ac-close aria-label="Close">${icon("close")}</button>
          </span>
        </div>
        <h2 id="ac-sheet-title" data-ac-title></h2>
        <p class="ac-intro" data-ac-intro></p>
        <p class="ac-label">What you'll learn</p>
        <ul class="ac-list" data-ac-list></ul>
        <div class="ac-actions">
          <a class="btn btn-dark" data-ac-tool></a>
          <a class="btn" data-ac-notify target="_blank" rel="noopener">${icon("bell")}<span>Tell me when it's out</span></a>
        </div>
        <p class="ac-soon"><i></i><span>Full lesson coming soon. Free, no sign-up.</span></p>
      </div>
    </div>`;
  document.body.appendChild(sheet);
  const panel = $(".ac-panel", sheet);
  let cur = 0, lastCard = null;

  const fill = i => {
    cur = (i + LESSONS.length) % LESSONS.length;
    const l = LESSONS[cur];
    const stage = $("[data-ac-stage]", sheet);
    stage.className = `ac-big ac-stage ac-${l.key}`;
    stage.innerHTML = ART[l.key]();
    $("[data-ac-step]", sheet).textContent = `Lesson ${cur + 1} of ${LESSONS.length} · ${l.time}`;
    $("[data-ac-title]", sheet).textContent = l.title;
    $("[data-ac-intro]", sheet).textContent = l.intro;
    $("[data-ac-list]", sheet).innerHTML = l.learn.map(x => `<li>${icon("check")}<span>${esc(x)}</span></li>`).join("");
    const tool = $("[data-ac-tool]", sheet);
    tool.href = l.tool[0];
    tool.innerHTML = `<span>${esc(l.tool[1])}</span> <span class="arr">${icon("arrow-right")}</span>`;
    $("[data-ac-notify]", sheet).href = waLink(`Hi Draft Studio, please let me know when the "${l.title}" lesson is out.`);
  };
  const open = i => {
    fill(i);
    clearTimeout(sheet._t);
    sheet.hidden = false;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => { sheet.classList.add("is-open"); $(".ac-big", sheet).classList.add("is-live"); });
    setTimeout(() => panel.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    sheet.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    sheet._t = setTimeout(() => { sheet.hidden = true; }, 320);
    if (lastCard) lastCard.focus({ preventScroll: true });
  };
  root.addEventListener("click", e => { const c = e.target.closest("[data-ac]"); if (c) { lastCard = c; open(+c.dataset.ac); } });
  sheet.addEventListener("click", e => {
    if (e.target.closest("[data-ac-close]")) close();
    const g = e.target.closest("[data-ac-go]");
    if (g) { fill(cur + +g.dataset.acGo); $(".ac-big", sheet).classList.add("is-live"); }
  });
  document.addEventListener("keydown", e => {
    if (sheet.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") { fill(cur + (e.key === "ArrowRight" ? 1 : -1)); $(".ac-big", sheet).classList.add("is-live"); }
  });
};
