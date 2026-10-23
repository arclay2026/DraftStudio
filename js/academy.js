/* =====================================================================
   DESIGN BASICS — the free beginner course on the Learn page
   Six lesson cards, each with a live scene of what the lesson teaches
   (js/academy-scenes.js). Clicking a card opens a glimpse of the lesson: what you'll
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

  /* ---------- Scene player ----------
     Scenes come from js/academy-scenes.js. One frame loop drives every scene
     that's on screen; the rest sit still. Reduced motion shows one still frame. */
  const SCENES = window.DSScenes || {};
  const STILL = { colour: 3.4, type: 3.2, layout: 7.6, hierarchy: 7.2, logos: 8.2, mockups: 6.6 };
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const players = new Set();
  let raf = 0, last = 0;
  const mount = (stage, key) => {
    stage.textContent = "";
    if (!SCENES[key]) return null;
    const el = document.createElement("div");
    el.className = "ax-scene";
    stage.appendChild(el);
    const p = { el, scene: SCENES[key](el), t: calm ? STILL[key] : 0, W: 0, H: 0, live: false };
    p.fit = () => {
      p.W = el.offsetWidth; p.H = el.offsetHeight;
      if (p.W) { p.scene.measure(p.W, p.H); p.scene.update(p.t, p.W, p.H); }
    };
    if ("ResizeObserver" in window) new ResizeObserver(p.fit).observe(el);
    else requestAnimationFrame(p.fit);
    players.add(p);
    return p;
  };
  const tick = now => {
    const dt = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    let any = false;
    players.forEach(p => {
      if (!p.el.isConnected) { players.delete(p); return; }
      if (!p.live || !p.W) return;
      any = true;
      p.t = (p.t + dt) % p.scene.dur;
      p.scene.update(p.t, p.W, p.H);
    });
    raf = any ? requestAnimationFrame(tick) : 0;
    if (!any) last = 0;
  };
  const play = (p, on) => {
    if (!p) return;
    p.live = on;
    if (on && !calm && !raf) raf = requestAnimationFrame(tick);
  };

  const card = (l, i) => `
    <button class="ac-card reveal" type="button" data-ac="${i}" style="--d:${i}">
      <span class="ac-stage ac-${l.key}" aria-hidden="true"></span>
      <span class="ac-info">
        <span class="ac-meta"><b>${String(i + 1).padStart(2, "0")}</b><span>${l.time}</span></span>
        <span class="ac-title-row"><strong>${l.title}</strong>${icon("arrow-right")}</span>
        <span class="ac-line">${l.line}</span>
      </span>
    </button>`;
  root.innerHTML = `<div class="ac-grid">${LESSONS.map(card).join("")}</div>`;

  // Scenes only play while they're on screen
  const cards = $$(".ac-card", root);
  cards.forEach(c => { c._p = mount($(".ac-stage", c), LESSONS[+c.dataset.ac].key); });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => play(e.target._p, e.isIntersecting)), { threshold: .15 });
    cards.forEach(c => io.observe(c));
  } else cards.forEach(c => play(c._p, true));

  // Pointer tilt with a soft glare (mouse and trackpad only)
  if (!calm && matchMedia("(hover: hover) and (pointer: fine)").matches) cards.forEach(c => {
    const stage = $(".ac-stage", c);
    c.addEventListener("pointermove", e => {
      const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      stage.style.setProperty("--ry", ((x - .5) * 7).toFixed(2) + "deg");
      stage.style.setProperty("--rx", ((.5 - y) * 5).toFixed(2) + "deg");
      stage.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      stage.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    });
    c.addEventListener("pointerleave", () => ["--rx", "--ry"].forEach(v => stage.style.removeProperty(v)));
  });

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
  let cur = 0, lastCard = null, big = null;

  const fill = i => {
    cur = (i + LESSONS.length) % LESSONS.length;
    const l = LESSONS[cur];
    const stage = $("[data-ac-stage]", sheet);
    stage.className = `ac-big ac-stage ac-${l.key}`;
    if (big) players.delete(big);
    big = mount(stage, l.key);
    play(big, !sheet.hidden);
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
    play(big, true);
    requestAnimationFrame(() => sheet.classList.add("is-open"));
    setTimeout(() => panel.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    sheet.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    sheet._t = setTimeout(() => { sheet.hidden = true; play(big, false); }, 320);
    if (lastCard) lastCard.focus({ preventScroll: true });
  };
  root.addEventListener("click", e => { const c = e.target.closest("[data-ac]"); if (c) { lastCard = c; open(+c.dataset.ac); } });
  sheet.addEventListener("click", e => {
    if (e.target.closest("[data-ac-close]")) close();
    const g = e.target.closest("[data-ac-go]");
    if (g) fill(cur + +g.dataset.acGo);
  });
  document.addEventListener("keydown", e => {
    if (sheet.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") fill(cur + (e.key === "ArrowRight" ? 1 : -1));
  });
};
