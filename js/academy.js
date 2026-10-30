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
      <div class="ac-scroll" data-ac-scroll><div class="ac-vn-slot" data-vn-slot hidden></div><div class="ac-doc" data-ac-doc></div></div>
    </article>`;
  document.body.appendChild(reader);
  const panel = $(".ac-panel", reader), scroller = $("[data-ac-scroll]", reader), doc = $("[data-ac-doc]", reader);
  let cur = 0, lastCard = null;

  /* ---------- Voice note: a narrated lesson, played like a chat voice message ----------
     The recording (audio/<key>.mp3) comes with audio/<key>.json: its length, a waveform
     (one height per bar) and the second each highlighted paragraph starts. */
  const BARS = 96, RATES = [1, 1.5, 2];
  const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.7v12.6c0 .8.9 1.3 1.6.9l10-6.3c.6-.4.6-1.3 0-1.7l-10-6.3C8.9 4.4 8 4.9 8 5.7Z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.3"/><rect x="13.5" y="5" width="4" height="14" rx="1.3"/></svg>';
  const clock = t => { t = Math.max(0, Math.round(t || 0)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; };
  const bars = () => Array.from({ length: BARS }, (_, k) => `<i style="--i:${k}"></i>`).join("");
  const voiceNote = () => `
      <div class="ac-vn" data-vn>
        <button type="button" class="ac-vn-play" data-vn-play aria-label="Play the narration">${PLAY}</button>
        <span class="ac-vn-time" data-vn-time>0:00</span>
        <div class="ac-vn-wave" data-vn-wave role="slider" tabindex="0" aria-label="Narration position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
          <span class="ac-vn-bars" data-vn-bars>${bars()}</span>
          <span class="ac-vn-bars is-played" data-vn-played aria-hidden="true">${bars()}</span>
          <b class="ac-vn-dot"></b>
        </div>
        <span class="ac-vn-time is-total" data-vn-total>0:00</span>
        <button type="button" class="ac-vn-rate" data-vn-rate aria-label="Playback speed" data-no-i18n>1×</button>
      </div>`;
  const vn = { audio: new Audio(), data: null, rate: 1, blocks: [], at: -1 };
  vn.audio.preload = "metadata";
  const vnEl = sel => $(sel, reader);
  const vnPaint = () => {
    const a = vn.audio, dur = a.duration || (vn.data && vn.data.duration) || 0, p = dur ? Math.min(1, a.currentTime / dur) : 0;
    const box = vnEl("[data-vn]");
    if (!box) return;
    box.style.setProperty("--p", (p * 100).toFixed(2) + "%");
    box.classList.toggle("is-playing", !a.paused);
    const play = vnEl("[data-vn-play]"), state = a.paused ? "play" : "pause";
    if (play.dataset.state !== state) {  // swap the icon only when it changes, so its pop plays once
      play.dataset.state = state;
      play.innerHTML = a.paused ? PLAY : PAUSE;
      play.setAttribute("aria-label", a.paused ? "Play the narration" : "Pause the narration");
    }
    vnEl("[data-vn-time]").textContent = clock(a.currentTime);
    vnEl("[data-vn-total]").textContent = clock(dur);
    vnEl("[data-vn-wave]").setAttribute("aria-valuenow", Math.round(p * 100));
    // highlight the paragraph being read
    const st = vn.data && vn.data.starts;
    let k = -1;
    if (st && (a.currentTime > 0)) { k = 0; while (k + 1 < st.length && st[k + 1] <= a.currentTime + .05) k++; }
    if (k !== vn.at) {
      vn.at = k;
      vn.blocks.forEach((b, j) => b.classList.toggle("is-saying", j === k && !a.paused));
      const el = vn.blocks[k];
      if (el && !a.paused) {
        const r = el.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
        const under = box.offsetHeight + 40;  // keep the paragraph clear of the pinned player
        if (r.top < sr.top + under || r.bottom > sr.bottom - 40) scroller.scrollTo({ top: scroller.scrollTop + r.top - sr.top - under - 30, behavior: "smooth" });
      }
    } else if (vn.blocks[k]) vn.blocks[k].classList.toggle("is-saying", !a.paused);
  };
  ["timeupdate", "play", "pause", "loadedmetadata", "ended"].forEach(ev => vn.audio.addEventListener(ev, vnPaint));
  // Sound waves: while it plays, each bar moves with the voice (Web Audio analyser on the recording).
  // Set up on the first play, since browsers only start audio processing after a tap.
  const calmVn = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let actx = null, analyser = null, freq = null, waveRaf = 0;
  const live = new Float32Array(BARS), scale = new Float32Array(BARS).fill(1);
  const waveOn = () => {
    if (calmVn) return;
    if (!actx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
        analyser = actx.createAnalyser();
        analyser.fftSize = 256; analyser.smoothingTimeConstant = .72;
        actx.createMediaElementSource(vn.audio).connect(analyser);
        analyser.connect(actx.destination);
        freq = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) { actx = null; analyser = null; }
    }
    if (actx && actx.state === "suspended") actx.resume();
    if (!waveRaf) waveRaf = requestAnimationFrame(waveTick);
  };
  const waveTick = () => {
    waveRaf = 0;
    const box = vnEl("[data-vn]");
    if (!box) return;
    const playing = !vn.audio.paused;
    if (analyser && playing) analyser.getByteFrequencyData(freq);
    const sets = [$$("[data-vn-bars] i", box), $$("[data-vn-played] i", box)];
    let moving = false;
    for (let k = 0; k < BARS; k++) {
      // speech lives in the low bins; scatter them so neighbouring bars don't move as one
      const bin = 1 + ((k * 7) % 26), target = analyser && playing ? Math.min(1, freq[bin] / 210) : playing ? .5 + .5 * Math.sin(performance.now() / 140 + k) : 0;
      live[k] += (target - live[k]) * (target > live[k] ? .5 : .14);
      // playing: the bar follows the voice; paused: it glides back to the recording's shape
      const want = playing ? .55 + live[k] * .75 : 1;
      scale[k] += (want - scale[k]) * (playing ? .6 : .12);
      if (Math.abs(scale[k] - 1) > .01) moving = true;
      const sc = scale[k].toFixed(3);
      sets[0][k].style.setProperty("--l", sc); sets[1][k].style.setProperty("--l", sc);
    }
    box.style.setProperty("--level", (live.reduce((a, b) => a + b, 0) / BARS).toFixed(3));
    if (playing || moving) waveRaf = requestAnimationFrame(waveTick);
    else { scale.fill(1); live.fill(0); sets.flat().forEach(b => b.style.removeProperty("--l")); box.style.removeProperty("--level"); }
  };
  vn.audio.addEventListener("play", waveOn);
  vn.audio.addEventListener("pause", () => { if (!waveRaf) waveRaf = requestAnimationFrame(waveTick); });
  vn.audio.addEventListener("ended", () => { vn.audio.currentTime = 0; vnPaint(); });
  const vnSetup = l => {
    vn.audio.pause();
    scale.fill(1); live.fill(0);
    vn.at = -1; vn.data = null;
    if (!l.audio) { vn.audio.removeAttribute("src"); return; }
    vn.blocks = $$("h1, .ac-lead, .ac-sec h2, .ac-sec > p, .ac-fig figcaption, .ac-tip, .ac-bad li, .ac-good li, .ac-practise p:last-child", doc);
    vn.audio.src = l.audio + ".mp3";
    vn.audio.playbackRate = vn.rate;
    const rb = vnEl("[data-vn-rate]");
    if (rb) rb.textContent = vn.rate + "×";
    fetch(l.audio + ".json").then(r => (r.ok ? r.json() : null)).then(d => {
      if (!d || LESSONS[cur].audio !== l.audio) return;
      vn.data = d;
      const peaks = d.peaks || [];
      $$("[data-vn-bars] i, [data-vn-played] i", reader).forEach((b, j) => { b.style.setProperty("--h", Math.round((peaks[j % BARS] || .4) * 100) + "%"); });
      requestAnimationFrame(() => { const box = vnEl("[data-vn]"); if (box) box.classList.add("is-ready"); });  // the bars grow in
      vnPaint();
    }).catch(() => {});
    vnPaint();
  };
  const vnSeek = x => {
    const w = vnEl("[data-vn-wave]"), r = w.getBoundingClientRect(), dur = vn.audio.duration || (vn.data && vn.data.duration);
    if (!dur) return;
    let f = (x - r.left) / r.width;
    if (getComputedStyle(w).direction === "rtl") f = 1 - f;
    vn.audio.currentTime = Math.max(0, Math.min(.999, f)) * dur;
    vnPaint();
  };
  reader.addEventListener("pointerdown", e => {
    const w = e.target.closest("[data-vn-wave]");
    if (!w) return;
    e.preventDefault();
    vnSeek(e.clientX);
    const move = ev => vnSeek(ev.clientX), up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); };
    addEventListener("pointermove", move); addEventListener("pointerup", up);
  });
  reader.addEventListener("keydown", e => {
    if (!e.target.closest("[data-vn-wave]") || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    vn.audio.currentTime = Math.max(0, vn.audio.currentTime + (e.key === "ArrowRight" ? 5 : -5));
  });
  reader.addEventListener("click", e => {
    if (e.target.closest("[data-vn-play]")) { if (vn.audio.paused) vn.audio.play().catch(() => {}); else vn.audio.pause(); }
    const rb = e.target.closest("[data-vn-rate]");
    if (rb) { vn.rate = RATES[(RATES.indexOf(vn.rate) + 1) % RATES.length]; vn.audio.playbackRate = vn.rate; rb.textContent = vn.rate + "×"; }
  });
  addEventListener("pagehide", () => vn.audio.pause());

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
    const slot = $("[data-vn-slot]", reader);
    slot.innerHTML = l.audio ? voiceNote() : "";
    slot.hidden = !l.audio;
    vnSetup(l);
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
    vn.audio.pause();
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
