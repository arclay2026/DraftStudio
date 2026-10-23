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
      task: "Recolour the poster for a coffee shop: warm, calm and easy to read.",
      tips: ["Drag round the wheel to change the main colour", "Tap a harmony to get colours that match", "Click the headline to write your own"],
      tool: ["palettes.html", "Practise in the palette generator"]
    },
    {
      key: "type", title: "Typography", time: "6 min",
      line: "Choose fonts and pair them like a pro.",
      intro: "Most designs are mostly words. You'll learn what separates serif from sans, how to pair two fonts that get along, and the spacing tricks that make text feel expensive.",
      learn: ["Serif, sans-serif and display fonts", "Pairing a heading font with a body font", "Size, weight and line height", "Letter spacing for headlines and labels"],
      task: "Make \"Bold ideas.\" feel luxury, then make it loud.",
      tips: ["Light weight and wide tracking feel calm and expensive", "Heavy weight and tight tracking feel loud", "Click the headline to type your own words"],
      tool: ["browse.html?cat=templates", "Try it on a template"]
    },
    {
      key: "layout", title: "Layout", time: "5 min",
      line: "Grids, spacing and alignment that feel calm.",
      intro: "Good layouts feel effortless because everything lines up. You'll learn how designers use grids, consistent spacing and alignment to turn a messy page into a clean one.",
      learn: ["Columns and grids", "One spacing scale for everything", "Aligning to edges, not eyeballing", "White space is not wasted space"],
      task: "Drag every block back until the whole page lines up.",
      tips: ["Red guides appear when an edge lines up", "Blocks snap into place when you're close", "Turn on Grid to see the six columns"],
      tool: ["canvas.html", "Practise in Canvas"]
    },
    {
      key: "hierarchy", title: "Hierarchy", time: "4 min",
      line: "Make the important thing impossible to miss.",
      intro: "People scan before they read. You'll learn how size, weight, colour and position guide the eye, so viewers see the right thing first, second and third.",
      learn: ["What the eye notices first", "Size and weight to rank information", "Colour and contrast for emphasis", "Leading the eye through a design"],
      task: "Flip Hierarchy on and off, and watch where eyes go.",
      tips: ["The heatmap shows where people look", "Numbers show what they see first, second and third", "Big, dark and colourful things win attention"],
      tool: ["canvas.html", "Practise in Canvas"]
    },
    {
      key: "logos", title: "Logos", time: "6 min",
      line: "What makes a logo simple, memorable and yours.",
      intro: "A great logo is simple enough to draw from memory. You'll learn the main logo types, how designers build marks on a grid, and how to test a logo at tiny sizes.",
      learn: ["Wordmarks, lettermarks and symbols", "Building a mark from simple shapes", "Choosing a logo colour", "The small-size and one-colour test"],
      task: "Draw your own mark with the pen tool.",
      tips: ["Click to add points", "Press and drag to pull a curve", "Click your first point to close the shape"],
      tool: ["browse.html?cat=logos", "Pull apart an editable logo"]
    },
    {
      key: "mockups", title: "Mockups", time: "4 min",
      line: "Present your work so clients say yes.",
      intro: "The same design looks ten times better on a real product. You'll learn how smart-object mockups work, how to choose the right scene, and how to present work to clients.",
      learn: ["How smart objects work", "Placing a design in seconds", "Choosing scenes that match the brand", "Presenting work to clients"],
      task: "Give the hoodie a new brand colour.",
      tips: ["Pick a colour in the smart object", "Press Save to update the mockup", "Only the brand-coloured parts change"],
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
    const p = { el, scene: SCENES[key](el), t: calm ? STILL[key] : 0, W: 0, H: 0, live: false, hands: null };
    p.fit = () => {
      p.W = el.offsetWidth; p.H = el.offsetHeight;
      if (!p.W) return;
      p.scene.measure(p.W, p.H);
      if (p.hands) p.hands.render(); else p.scene.update(p.t, p.W, p.H);
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
          <button type="button" class="btn btn-dark" data-ac-try>${icon("play")}<span>Try it yourself</span></button>
          <a class="btn" data-ac-tool></a>
          <a class="btn" data-ac-notify target="_blank" rel="noopener">${icon("bell")}<span>Tell me when it's out</span></a>
        </div>
        <p class="ac-soon"><i></i><span>Full lesson coming soon. Free, no sign-up.</span></p>
      </div>
      <div class="ac-body-col ac-play-col" hidden>
        <div class="ac-top">
          <span class="ac-step" data-ac-play-step></span>
          <span class="ac-nav">
            <button type="button" data-ac-back aria-label="Back to the lesson">${icon("arrow-left")}</button>
            <button type="button" data-ac-close aria-label="Close">${icon("close")}</button>
          </span>
        </div>
        <h2>Try it yourself</h2>
        <p class="ac-task" data-ac-task></p>
        <ul class="ac-list ac-tips" data-ac-tips></ul>
        <div class="ac-actions">
          <button type="button" class="btn btn-dark" data-ac-save>${icon("download")}<span>Download PNG</span></button>
          <button type="button" class="btn" data-ac-share>${icon("share")}<span>Share</span></button>
          <button type="button" class="btn" data-ac-reset>${icon("refresh")}<span>Start over</span></button>
        </div>
        <p class="ac-soon"><span>Nothing is uploaded. Your design stays on this device.</span></p>
      </div>
    </div>`;
  document.body.appendChild(sheet);
  const panel = $(".ac-panel", sheet);
  let cur = 0, lastCard = null, big = null;

  const fill = i => {
    cur = (i + LESSONS.length) % LESSONS.length;
    const l = LESSONS[cur];
    const stage = $("[data-ac-stage]", sheet);
    panel.classList.remove("is-play");
    $(".ac-play-col", sheet).hidden = true;
    stage.setAttribute("aria-hidden", "true");
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
  /* ---------- Try it yourself: the big scene hands its controls to the visitor ---------- */
  const tryIt = () => {
    const l = LESSONS[cur], stage = $("[data-ac-stage]", sheet);
    if (big) players.delete(big);
    big = mount(stage, l.key);
    if (!big) return;
    big.el.classList.add("is-play");
    big.fit();
    big.hands = big.scene.play();
    stage.removeAttribute("aria-hidden");
    panel.classList.add("is-play");
    $(".ac-play-col", sheet).hidden = false;
    $("[data-ac-play-step]", sheet).textContent = `Your turn · ${l.title}`;
    $("[data-ac-task]", sheet).textContent = l.task;
    $("[data-ac-tips]", sheet).innerHTML = l.tips.map(x => `<li>${icon("lightbulb")}<span>${esc(x)}</span></li>`).join("");
  };
  // The finished PNG: the visitor's design on a soft backdrop with a small credit line
  const picture = async () => {
    const hands = big && big.hands, l = LESSONS[cur];
    if (!hands) return null;
    const art = hands.snap ? hands.snap() : await window.DSScenes.snapshot(hands.art);
    if (!art) return null;
    const pad = Math.round(art.width * .07), foot = Math.round(art.width * .06);
    const c = document.createElement("canvas");
    c.width = art.width + pad * 2; c.height = art.height + pad * 2 + foot;
    const x = c.getContext("2d"), rad = art.width * .02;
    x.fillStyle = "#f3f3f1"; x.fillRect(0, 0, c.width, c.height);
    const card = () => { x.beginPath(); if (x.roundRect) x.roundRect(pad, pad, art.width, art.height, rad); else x.rect(pad, pad, art.width, art.height); };
    x.save(); x.shadowColor = "rgba(0, 0, 0, .16)"; x.shadowBlur = pad * .6; x.shadowOffsetY = pad * .15; card(); x.fillStyle = "#fff"; x.fill(); x.restore();
    x.save(); card(); x.clip(); x.drawImage(art, pad, pad); x.restore();
    const y = pad + art.height + (pad + foot) / 2;
    x.textBaseline = "middle";
    x.fillStyle = "#0f0f0f"; x.font = `600 ${Math.round(foot * .34)}px Inter, system-ui, sans-serif`; x.fillText("Draft Studio", pad, y);
    x.fillStyle = "#666"; x.font = `400 ${Math.round(foot * .3)}px Inter, system-ui, sans-serif`; x.textAlign = "right";
    x.fillText(`Design Basics · ${l.title}`, c.width - pad, y);
    return new Promise(res => c.toBlob(res, "image/png"));
  };
  const nudge = msg => { const S = big && big.el; if (S) { const el = S.querySelector(".ax-toast") || S.appendChild(Object.assign(document.createElement("span"), { className: "ax-toast" })); el.textContent = msg; el.classList.add("is-on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("is-on"), 2600); } };
  const fileName = () => `draft-studio-${LESSONS[cur].key}.png`;
  const download = async () => {
    const blob = await picture();
    if (!blob) { nudge("Close your shape first."); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    nudge("Saved to your downloads.");
  };
  const share = async () => {
    const blob = await picture();
    if (!blob) { nudge("Close your shape first."); return; }
    const file = new File([blob], fileName(), { type: "image/png" });
    const text = "I made this in the free Design Basics course on Draft Studio.";
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Draft Studio", text }); } catch (e) { /* closed the share sheet */ }
    } else window.open("https://wa.me/?text=" + encodeURIComponent(`${text} ${location.href.split("#")[0]}`), "_blank", "noopener");
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
    if (e.target.closest("[data-ac-try]") || e.target.closest("[data-ac-reset]")) tryIt();
    if (e.target.closest("[data-ac-back]")) fill(cur);
    if (e.target.closest("[data-ac-save]")) download();
    if (e.target.closest("[data-ac-share]")) share();
    const g = e.target.closest("[data-ac-go]");
    if (g) fill(cur + +g.dataset.acGo);
  });
  document.addEventListener("keydown", e => {
    if (sheet.hidden) return;
    if (e.key === "Escape") close();
    if (panel.classList.contains("is-play") || e.target.isContentEditable) return;   // keys belong to the design while playing
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") fill(cur + (e.key === "ArrowRight" ? 1 : -1));
  });
};
