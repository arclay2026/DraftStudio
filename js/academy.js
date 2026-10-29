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

  /* ---------- Listen: the lesson read aloud ----------
     Two voices, one player. When the lesson's narration has been recorded
     (audio/<key>-<part>.mp3, made in ElevenLabs from the scripts in voiceover/),
     the recording plays and the highlight follows it. Otherwise the browser's own
     speech engine reads the same script: free, offline, nothing uploaded, one
     sentence at a time (Chrome cuts off long utterances). Either way the paragraph
     being read is highlighted and kept in view. */
  // skip back / forward: a triangle against a bar
  const SKIP = back => `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"${back ? ' style="transform:scaleX(-1)"' : ""}><path d="M6 5.6v12.8c0 .8.9 1.3 1.6.8l9-6.4c.6-.4.6-1.2 0-1.6l-9-6.4C6.9 4.3 6 4.8 6 5.6Z"/><rect x="17.5" y="5" width="2.2" height="14" rx="1.1"/></svg>`;
  const SAY = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  const SAY_SEL = "h1, .ac-lead, .ac-sec h2, .ac-sec > p, .ac-fig figcaption, .ac-tip, .ac-bad li, .ac-good li, .ac-practise p:last-child";
  const RATES = [1, 1.25, 1.5, .75];
  const script = i => window.DS_LESSON_SCRIPT(LESSONS[i], i);
  const say = { blocks: [], scr: null, i: 0, playing: false, started: false, token: 0, voice: null, rate: 1, fails: 0, mode: "voice", part: -1 };
  try { say.rate = RATES.includes(+localStorage.getItem("ds-listen-rate")) ? +localStorage.getItem("ds-listen-rate") : 1; } catch (e) { /* private mode */ }
  const pickVoice = () => {
    const score = v => (/natural|neural|online/i.test(v.name) ? 8 : 0) + (/google/i.test(v.name) ? 4 : 0) +
      (/samantha|daniel|serena|karen|moira|libby|sonia|aria|jenny|ryan|guy|emma/i.test(v.name) ? 3 : 0) + (/en[-_]GB/i.test(v.lang) ? 1 : 0) + (v.localService ? 0 : 1);
    say.voice = speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)).sort((a, b) => score(b) - score(a))[0] || null;
  };
  if (SAY) { pickVoice(); speechSynthesis.addEventListener ? speechSynthesis.addEventListener("voiceschanged", pickVoice) : (speechSynthesis.onvoiceschanged = pickVoice); }
  // Is the lesson recorded? (a quick look for its first file, remembered)
  const recorded = {};
  const hasAudio = i => recorded[i] || (recorded[i] = fetch(script(i).file(0), { method: "HEAD", cache: "no-store" }).then(r => r.ok).catch(() => false));
  const au = new Audio();
  au.preload = "auto";
  // Where in a part each block starts, as a share of the part (by length, plus a pause per block)
  const shares = part => { const w = part.map(j => say.scr.blocks[j].length + 45), t = w.reduce((a, b) => a + b, 0); let acc = 0; return w.map(x => { const s0 = acc / t; acc += x; return s0; }); };
  const partOf = i => say.scr.parts.findIndex(p => p.includes(i));

  const sentences = t => (t.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+[”"’)]*\s*|[^.!?]+$/g) || [t]).map(x => x.trim()).filter(Boolean);
  const sayMark = () => {
    say.blocks.forEach((b, k) => b.classList.toggle("is-saying", say.started && k === say.i));
    const el = say.blocks[say.i];
    if (!el || !say.started) return;
    const r = el.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
    if (r.top < sr.top + 70 || r.bottom > sr.bottom - 40) scroller.scrollTo({ top: scroller.scrollTop + r.top - sr.top - 110, behavior: "smooth" });
  };
  const sayUi = () => {
    $("[data-say-ui]", reader).hidden = !(SAY || recorded.ok);
    $("[data-say-more]", reader).hidden = !say.started;
    reader.classList.toggle("is-listening", say.started);
    $$("[data-say=toggle]", reader).forEach(b => {
      b.classList.toggle("is-on", say.playing);
      b.querySelector("svg").outerHTML = icon(say.playing ? "pause" : "play");
      const lab = say.playing ? "Pause" : say.started ? "Resume" : "Listen";
      if (b.classList.contains("ac-say-main")) { b.querySelector("span").textContent = lab; b.setAttribute("aria-label", lab === "Listen" ? "Listen to this lesson" : lab); }
      else b.querySelector("b").textContent = say.playing ? "Pause reading" : say.started ? "Resume reading" : "Listen to this lesson";
    });
    $("[data-say=rate]", reader).textContent = String(say.rate).replace(/^0/, "") + "×";
  };

  /* the recording */
  const playFrom = i => {
    const p = partOf(i);
    if (p < 0) { sayStop(); return; }
    // the latest request wins, even if the file is still loading
    say.want = shares(say.scr.parts[p])[say.scr.parts[p].indexOf(i)];
    const go = () => { if (au.duration) au.currentTime = say.want * au.duration; au.playbackRate = say.rate; if (say.playing) au.play().catch(() => {}); };
    say.i = i; say.hold = Date.now() + 700; sayMark();
    if (say.part !== p) { say.part = p; au.src = say.scr.file(p); au.addEventListener("loadedmetadata", go, { once: true }); au.load(); }
    else if (au.readyState >= 1) go();
  };
  au.addEventListener("timeupdate", () => {
    if (say.mode !== "audio" || !say.started || !au.duration || Date.now() < say.hold) return;  // hold: let a jump settle first
    const part = say.scr.parts[say.part], sh = shares(part), f = au.currentTime / au.duration;
    let k = 0; while (k + 1 < sh.length && sh[k + 1] <= f) k++;
    if (part[k] !== say.i) { say.i = part[k]; sayMark(); }
  });
  au.addEventListener("ended", () => {
    if (say.mode !== "audio" || !say.started) return;
    if (say.part + 1 < say.scr.parts.length) playFrom(say.scr.parts[say.part + 1][0]); else sayStop();
  });
  // a part that won't load: carry on with the browser voice from the same place
  au.addEventListener("error", () => { if (say.mode === "audio" && say.started && au.getAttribute("src")) { say.mode = "voice"; if (SAY) sayAt(say.i); else sayStop(); } });

  /* the browser voice */
  const sayAt = i => {
    const tok = ++say.token;
    if (SAY) speechSynthesis.cancel();
    say.i = Math.max(0, i);
    if (say.mode === "audio") { playFrom(say.i); return; }
    sayMark();
    const text = say.scr.blocks[say.i];
    if (text == null || !SAY) { sayStop(); return; }
    const parts = sentences(text);
    const next = k => {
      if (tok !== say.token || !say.playing) return;
      if (k >= parts.length) { sayAt(say.i + 1); return; }
      const u = new SpeechSynthesisUtterance(parts[k]);
      if (say.voice) u.voice = say.voice;
      u.lang = say.voice ? say.voice.lang : "en-GB";
      u.rate = say.rate;
      u.onend = () => { say.fails = 0; next(k + 1); };
      u.onerror = e => {
        if (e.error === "interrupted" || e.error === "canceled") return;
        // no working voice on this device: stop instead of racing through the lesson
        if (++say.fails >= 3) { sayStop(); const b = $(".ac-listen small", doc); if (b) b.textContent = "Your device has no voice for reading aloud. Try another browser."; return; }
        next(k + 1);
      };
      speechSynthesis.speak(u);
    };
    setTimeout(() => next(0), 60);  // Chrome drops a speak() that follows cancel() too closely
  };
  function sayStop() {
    say.token++; say.playing = false; say.started = false; say.part = -1;
    if (SAY) speechSynthesis.cancel();
    au.pause(); au.removeAttribute("src");
    say.blocks.forEach(b => b.classList.remove("is-saying"));
    if ($("[data-say-ui]", reader)) sayUi();
  }
  const sayAction = async what => {
    if (what === "toggle") {
      if (say.playing) { say.playing = false; say.token++; if (SAY) speechSynthesis.cancel(); au.pause(); }
      else if (say.started) { say.playing = true; if (say.mode === "audio") au.play().catch(() => {}); else sayAt(say.i); }
      else {
        const lesson = cur;
        say.scr = script(cur); say.blocks = $$(SAY_SEL, doc); say.i = 0; say.part = -1;
        say.mode = (await hasAudio(cur)) ? "audio" : "voice";
        if (lesson !== cur) return;
        say.started = true; say.playing = true; sayAt(0);
      }
    } else if (what === "prev" || what === "next") {
      say.playing = true;
      sayAt(Math.min(say.scr.blocks.length - 1, Math.max(0, say.i + (what === "next" ? 1 : -1))));
    } else if (what === "rate") {
      say.rate = RATES[(RATES.indexOf(say.rate) + 1) % RATES.length];
      try { localStorage.setItem("ds-listen-rate", say.rate); } catch (e) { /* private mode */ }
      au.playbackRate = say.rate;
      if (say.playing && say.mode === "voice") sayAt(say.i);
    }
    sayUi();
  };
  // the big Listen button says which voice you'll hear
  const sayLabel = i => hasAudio(i).then(ok => {
    if (ok) recorded.ok = true;
    const sm = $(".ac-listen small", doc);
    if (sm && cur === i) sm.textContent = `About ${LESSONS[i].time.replace(" read", "")} · ${ok ? "narrated" : "read aloud by your device"}`;
    if (cur === i) sayUi();
  });
  addEventListener("pagehide", () => { if (SAY) speechSynthesis.cancel(); au.pause(); });

  /* ---------- The reader ---------- */
  const reader = document.createElement("div");
  reader.className = "ac-reader";
  reader.hidden = true;
  reader.innerHTML = `
    <div class="ac-backdrop" data-ac-close></div>
    <article class="ac-panel" role="dialog" aria-modal="true" aria-labelledby="ac-title" tabindex="-1">
      <header class="ac-bar">
        <span class="ac-say" data-say-ui hidden>
          <button type="button" class="ac-say-main" data-say="toggle" aria-label="Listen to this lesson">${icon("play")}<span>Listen</span></button>
          <span class="ac-say-more" data-say-more hidden>
            <button type="button" data-say="prev" aria-label="Previous paragraph" data-tip="Previous paragraph">${SKIP(true)}</button>
            <button type="button" data-say="next" aria-label="Next paragraph" data-tip="Next paragraph">${SKIP(false)}</button>
            <button type="button" class="ac-say-rate" data-say="rate" aria-label="Reading speed" data-tip="Reading speed" data-no-i18n>1×</button>
          </span>
        </span>
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

  const figure = (name, caption, n) => `<figure class="ac-fig">${FIG.fig[name] ? FIG.fig[name]() : ""}<figcaption><b>Figure ${n}</b> ${esc(caption)}</figcaption></figure>`;
  const lessonHtml = (l, i) => {
    const next = LESSONS[(i + 1) % LESSONS.length];
    return `
      <p class="ac-kicker">Design Basics · Lesson ${i + 1} of ${LESSONS.length}</p>
      <h1 id="ac-title">${esc(l.title)}</h1>
      <p class="ac-lead">${esc(l.intro)}</p>
      ${SAY || recorded.ok ? `<button type="button" class="ac-listen" data-say="toggle">${icon("play")}<span><b>Listen to this lesson</b><small>About ${l.time.replace(" read", "")} · read aloud by your device</small></span></button>` : ""}
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
    sayStop();
    cur = (i + LESSONS.length) % LESSONS.length;
    const l = LESSONS[cur];
    $("[data-ac-step]", reader).textContent = `Lesson ${cur + 1} of ${LESSONS.length} · ${l.time}`;
    doc.innerHTML = lessonHtml(l, cur);
    say.blocks = [];
    sayUi();
    sayLabel(cur);
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
    sayStop();
    reader.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    reader._t = setTimeout(() => { reader.hidden = true; }, 300);
    if (/^#lesson-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    if (lastCard) lastCard.focus({ preventScroll: true });
  };
  root.addEventListener("click", e => { const c = e.target.closest("[data-ac]"); if (c) { lastCard = c; open(+c.dataset.ac); } });
  reader.addEventListener("click", e => {
    if (e.target.closest("[data-ac-close]")) { close(); return; }
    const sb = e.target.closest("[data-say]");
    if (sb) { sayAction(sb.dataset.say); return; }
    // while listening, a click on a paragraph reads from there
    if (say.started && !e.target.closest("a, button")) { const k = say.blocks.indexOf(e.target.closest(SAY_SEL)); if (k > -1) { say.playing = true; sayAt(k); sayUi(); } }
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
  if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => { drawCards(); if (!reader.hidden) { const y = scroller.scrollTop; fill(cur); scroller.scrollTop = y; } });
};
