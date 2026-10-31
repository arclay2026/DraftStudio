// The engine shared by every lesson video: one paused GSAP timeline that any frame can be drawn
// from exactly with seek(t) (shared/render.js steps through it at 30 fps and pipes the frames to ffmpeg).
// Cue times come from the lesson's narration (script.js): estimated from its words, or, once the
// voice is recorded, measured from the recording (timing.js). Each lesson's video.js draws its own
// scenes and calls build() with its details; the logo intro, chapter cards, recap, outro, end card,
// chrome, film grain and drifting light live here.
gsap.registerPlugin(SplitText, CustomEase, DrawSVGPlugin);
CustomEase.create("silk", "0.16, 1, 0.3, 1");
CustomEase.create("glide", "0.65, 0, 0.35, 1");
CustomEase.create("pop", "0.34, 1.45, 0.64, 1");

// The frame: lesson videos are 1920×1080 at 30 fps with a 6.4 s logo intro; a page can set
// window.VIDEO first to change that (the vertical social videos: 1080×1920 at 60 fps, no intro).
const V = Object.assign({ w: 1920, h: 1080, fps: 30, intro: 6.4, endHold: 5.5 }, window.VIDEO || {});
// WPS and the pauses are fitted to the ElevenLabs voice at speed 1.00 (the Colour narration)
const INTRO = V.intro, WPS = 2.78, END_HOLD = V.endHold, FPS = V.fps;
const BLUE = "#1f7aff", CREAM = "#f4f3ef";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ---------- cues ----------
const WORDS = [];   // every spoken word with its estimated time (the captions use these)
const estimate = (() => {
  const out = {};
  let t = INTRO;
  NARRATION.trim().split(/\n\s*\n/).forEach(par => {
    const chapter = /^\{ch\d\}/.test(par.trim());
    for (const m of par.matchAll(/\{(\w+)\}|([^\s{]+)/g)) {
      if (m[1]) { out[m[1]] = +t.toFixed(2); continue; }
      WORDS.push({ w: m[2], t: +t.toFixed(2) });
      t += 1 / WPS;
      if (/[,;:]["”]?$/.test(m[2])) t += .2;
      else if (/[.?!]["”]?$/.test(m[2])) t += .45;
    }
    t += chapter ? 1 : .55;
  });
  return out;
})();
const CUE = Object.assign({}, estimate, window.TIMING || {});
// once the voice is recorded, word times measured from it replace the estimates
if (window.WORD_TIMES && window.WORD_TIMES.length === WORDS.length) WORDS.forEach((w, i) => (w.t = window.WORD_TIMES[i]));
const T = n => { if (!(n in CUE)) throw new Error("no cue: " + n); return CUE[n]; };
const DURATION = +(T("end") + END_HOLD).toFixed(2);

const tl = gsap.timeline({ paused: true, defaults: { ease: "silk", duration: 1 } });
const hooks = [];   // per-frame drawing for things a tween can't express (live colours, dots on a ring)

// ---------- helpers ----------
const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${s}% ${l}%)`;
const polar = (r, a) => [r * Math.sin(a * Math.PI / 180), -r * Math.cos(a * Math.PI / 180)];
function scene(id, a, b, html) {
  const s = document.createElement("section");
  s.className = "scene"; s.id = id; s.innerHTML = html;
  $("#scenes").append(s);
  tl.set(s, { visibility: "visible" }, a);
  if (b != null) {
    tl.to(s, { opacity: 0, scale: 1.015, filter: "blur(12px)", duration: .65, ease: "power2.in" }, b - .65);
    tl.set(s, { visibility: "hidden" }, b);
  }
  return s;
}
const live = (a, b) => t => t >= a - .05 && t <= b + .05;
// words (or letters) rise into place from behind a mask
function textIn(node, at, o = {}) {
  const sp = SplitText.create(node, { type: o.chars ? "lines,words,chars" : "lines,words", mask: "lines" });
  node._parts = o.chars ? sp.chars : sp.words;
  gsap.set(node, { autoAlpha: 0 });
  tl.set(node, { autoAlpha: 1 }, at);
  tl.from(node._parts, { yPercent: 120, duration: o.d ?? 1.2, stagger: o.st ?? .035, ease: "silk" }, at);
  return node;
}
function textOut(node, at, o = {}) {
  const d = o.d ?? .55, st = o.st ?? .012;
  tl.to(node._parts, { yPercent: -120, duration: d, stagger: st, ease: "power3.in" }, at);
  tl.set(node, { autoAlpha: 0 }, at + d + st * node._parts.length);
}
// a block fades up into place
function fadeIn(node, at, o = {}) {
  tl.fromTo(node, { autoAlpha: 0, y: o.y ?? 40, scale: o.s ?? 1 }, { autoAlpha: 1, y: 0, scale: 1, duration: o.d ?? 1.1, ease: o.ease ?? "silk", stagger: o.st ?? 0 }, at);
}
function fadeOut(node, at, o = {}) {
  tl.to(node, { autoAlpha: 0, y: o.y ?? -30, duration: o.d ?? .55, ease: "power2.in", stagger: o.st ?? 0 }, at);
}
const orbs = ["#o1", "#o2", "#o3"].map(s => $(s));
function light(at, c1, c2, c3, o = .42) {
  [c1, c2, c3].forEach((c, k) => tl.to(orbs[k], { "--c": c, "--o": k === 2 ? o * .7 : o, duration: 2.4, ease: "glide" }, at));
}

// ---------- the logo ----------
function logoLockup(id, top) {
  const box = document.createElement("div");
  box.className = "abs lockup"; box.id = id;
  box.style.cssText = `left:480px;top:${top}px;width:960px`;
  box.innerHTML = LOGO.replace("<svg ", '<svg width="960" ');
  const svg = $("svg", box);
  svg.insertAdjacentHTML("afterbegin", `<defs>${[0, 1, 2, 3].map(k => `<filter id="${id}-f${k}" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="0"/></filter>`).join("")}
    <clipPath id="${id}-clip"><rect x="300" y="420" width="0" height="160"/></clipPath></defs>`);
  const petals = $$(":scope > path", svg);
  petals.forEach((p, k) => p.setAttribute("filter", `url(#${id}-f${k})`));
  $(":scope > g", svg).setAttribute("clip-path", `url(#${id}-clip)`);
  return { box, petals, blurs: $$("feGaussianBlur", svg), clip: $(`#${id}-clip rect`, svg) };
}
// the four petals swirl in and lock together, the blue one last; then the name slides out
function assemble(L, at, quick) {
  const DIR = [[-1, 1], [-1, -1], [1, 1], [1, -1]], k0 = quick ? .7 : 1;
  gsap.set(L.box, { x: 376 });
  L.petals.forEach((p, k) => {
    const blue = k === 3, start = at + (blue ? .75 * k0 : .14 * k * k0);
    const from = blue ? { rotation: 220, scale: .08, opacity: 0, svgOrigin: "232.09 500" }
      : { x: DIR[k][0] * 170, y: DIR[k][1] * 170, rotation: DIR[k][0] * DIR[k][1] * -130, scale: .3, opacity: 0, svgOrigin: "232.09 500" };
    tl.from(p, { ...from, duration: blue ? 1.35 : 1.6 * k0, ease: blue ? "pop" : "silk" }, start);
    tl.fromTo(L.blurs[k], { attr: { stdDeviation: 16 } }, { attr: { stdDeviation: 0 }, duration: 1.2 * k0, ease: "power2.out" }, start);
  });
  tl.to(L.box, { x: 0, duration: 1.25, ease: "glide" }, at + 2.25 * k0);
  tl.fromTo(L.clip, { attr: { width: 0 } }, { attr: { width: 560 }, duration: 1.3, ease: "glide" }, at + 2.4 * k0);
  return at + 1.45 * k0;   // when the blue petal lands
}

// ---------- scenes every lesson has ----------
function intro(les) {
  const s = scene("intro", 0, INTRO + .15, `<i class="abs" id="flash" style="left:610px;top:166px;width:700px;height:700px;border-radius:50%;
      background:radial-gradient(circle, rgba(31,122,255,.85), rgba(31,122,255,.25) 35%, transparent 68%)"></i>
    <div class="abs kicker" id="i-tag" style="left:0;right:0;top:720px;text-align:center;letter-spacing:.5em">Design Basics · Lesson ${les.num}</div>`);
  const L = logoLockup("i-logo", 436);
  s.prepend(L.box);
  const landed = assemble(L, .35);
  // a flash of brand blue as the last petal locks in (it sits behind the mark, which starts centred)
  tl.fromTo("#flash", { scale: .15, opacity: 0 }, { scale: 1, opacity: 1, duration: .35, ease: "power2.out" }, landed - .1);
  tl.to("#flash", { scale: 2, opacity: 0, duration: 1.5, ease: "power2.out" }, landed + .25);
  tl.fromTo("#i-tag", { autoAlpha: 0, y: 18, letterSpacing: ".9em" }, { autoAlpha: 1, y: 0, letterSpacing: ".5em", duration: 1.6, ease: "silk" }, 3.6);
  tl.to([L.box, "#i-tag"], { scale: .94, autoAlpha: 0, filter: "blur(14px)", duration: .9, ease: "power2.in" }, INTRO - 1);
  light(0, "#0d2a5c", "#0b1430", "#0b0b0d", .55);
}

function chapterCard(n, word, title, a, b) {
  const s = scene("ch" + n, a - .1, b, `
    <div class="ch-num">0${n}</div><div class="ch-line"></div>
    <div class="ch-k kicker">Part ${word}</div><div class="ch-t h1">${title}</div>`);
  tl.from($(".ch-num", s), { yPercent: 40, opacity: 0, duration: 1.6, ease: "silk" }, a - .1);
  tl.from($(".ch-line", s), { scaleX: 0, duration: 1.3, ease: "glide" }, a);
  textIn($(".ch-k", s), a + .1);
  textIn($(".ch-t", s), a + .2, { st: .05 });
}

function recap(les) {
  const a = T("recap"), b = T("outro");
  const { icons: ICON, lines: LINES, kicker } = les.recap;
  const sc = scene("recap", a - .1, b, `
    <div class="abs kicker" id="q-k" style="left:160px;top:250px">${kicker}</div>
    <div class="abs" id="q-t" style="left:150px;top:290px;font:600 200px/1 var(--sans);letter-spacing:-.06em">Recap</div>
    ${LINES.map((l, k) => `
      <div class="abs q-row" style="left:760px;top:${210 + k * 140}px;width:1020px;display:flex;align-items:center;gap:36px;padding-bottom:30px;border-bottom:1.5px solid var(--line)">
        <span class="mono blue" style="font-size:24px;letter-spacing:.14em;width:44px">0${k + 1}</span>
        <span style="flex:none;width:64px;height:64px">${ICON[k]}</span>
        <span style="font:600 42px/1.15 var(--sans);letter-spacing:-.025em">${l}</span></div>`).join("")}`);
  textIn($("#q-k"), a); textIn($("#q-t"), a + .1, { chars: true, st: .05 });
  $$(".q-row", sc).forEach((r, k) => {
    gsap.set(r, { autoAlpha: 0 });
    tl.fromTo(r, { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 1.1 }, T("rc" + (k + 1)) - .1);
    if (k) tl.to($$(".q-row", sc)[k - 1], { opacity: .5, duration: .6 }, T("rc" + (k + 1)));
  });
  tl.to($$(".q-row", sc), { opacity: 1, duration: .8 }, T("rc5") + 2.4);
  light(a, ...(les.recap.light || ["#1f7aff", "#8c5cff", "#ff4d4d"]), .24);
}

function outro(les) {
  const a = T("outro"), e = T("end");
  scene("outro", a - .1, e + .2, `
    <div class="abs" id="z-mask" style="left:150px;top:260px;overflow:hidden;padding:0 30px 40px 0">
      <div class="rainbow" id="z-big" style="font:600 ${les.outro.size || 240}px/1.02 var(--sans);letter-spacing:-.06em">${les.outro.title}</div></div>
    <div class="abs h2" id="z-try" style="left:160px;top:620px;width:1600px">${les.outro.tryit}</div>
    <div class="abs sub" id="z-next" style="left:160px;top:740px">See you in the next lesson.</div>`);
  tl.from("#z-big", { yPercent: 100, duration: 1.5 }, a);
  tl.fromTo("#z-big", { backgroundPosition: "0% 0" }, { backgroundPosition: "100% 0", duration: e - a + 1, ease: "none" }, a);
  textIn($("#z-try"), T("tryit")); textIn($("#z-next"), T("next"));
  // the end card: the logo comes together once more
  const s = scene("endcard", e - .2, null, `
    <div class="abs kicker" id="e-next" style="left:0;right:0;top:720px;text-align:center;letter-spacing:.5em;color:var(--mute)">Next lesson · ${les.next}</div>`);
  const L = logoLockup("e-logo", 436);
  s.prepend(L.box);
  assemble(L, e, true);
  tl.fromTo("#e-next", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.4 }, e + 2.4);
  light(a, "#ff4d4d", "#1f7aff", "#ffd53d", .3);
  light(e, "#0d2a5c", "#0b1430", "#0b0b0d", .55);
}

function chrome(les) {
  const CH = [["", "Introduction"], ...les.chapters.map((t, k) => ["0" + (k + 1), t]), ["", "Recap"]];
  const starts = [T("title"), T("ch1"), T("ch2"), T("ch3"), T("ch4"), T("ch5"), T("recap"), T("outro")];
  const c = $("#chrome");
  c.innerHTML = `<div class="brand">${LOGO.replace(/viewBox="[^"]+"/, 'viewBox="158 426 148 148"').replace("<svg ", '<svg width="34" height="34" ')}${les.name} <span>· Design Basics</span></div>
    <div class="chap">${CH.map(([n, t]) => `<div>${n ? `<b>${n}</b>` : ""}${t}</div>`).join("")}</div>
    <div class="progress">${"<i><b></b></i>".repeat(5)}</div>`;
  gsap.set(c, { autoAlpha: 0 });
  tl.to(c, { autoAlpha: 1, duration: 1 }, INTRO + .4);
  tl.to(c, { autoAlpha: 0, duration: .8 }, T("outro") - .4);
  const labels = $$(".chap div", c);
  gsap.set(labels, { yPercent: 110 });
  labels.forEach((l, k) => {
    tl.to(l, { yPercent: 0, duration: .9 }, starts[k] + (k ? .2 : .5));
    tl.to(l, { yPercent: -110, duration: .6, ease: "power2.in" }, starts[k + 1] - .2);
  });
  $$(".progress b", c).forEach((f, k) => tl.to(f, { scaleX: 1, duration: starts[k + 2] - starts[k + 1], ease: "none" }, starts[k + 1]));
}

// ---------- film grain and drifting light ----------
function grain() {
  const g = $("#grain"), x = g.getContext("2d"), img = x.createImageData(512, 512);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < img.data.length; i += 4) { const v = rnd() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0);
  g.style.cssText += `width:${V.w + 128}px;height:${V.h + 128}px;image-rendering:pixelated;background:#808080`;
  hooks.push(t => {
    const f = Math.round(t * FPS), r = Math.sin(f * 12.9898) * 43758.5453;
    g.style.transform = `translate(${Math.round((r - Math.floor(r)) * 60)}px, ${Math.round(((r * 7.31) % 1 + 1) % 1 * 60)}px)`;
    const kx = V.w / 1920, ky = V.h / 1080;
    orbs[0].style.left = (470 + 190 * Math.sin(t * .09)) * kx + "px"; orbs[0].style.top = (330 + 110 * Math.cos(t * .07)) * ky + "px";
    orbs[1].style.left = (1480 + 170 * Math.cos(t * .08)) * kx + "px"; orbs[1].style.top = (800 + 120 * Math.sin(t * .1)) * ky + "px";
    orbs[2].style.left = (1250 + 230 * Math.sin(t * .05 + 1)) * kx + "px"; orbs[2].style.top = (160 + 100 * Math.cos(t * .09)) * ky + "px";
  });
}

// ---------- build, then seek / play ----------
async function build(les) {
  // web fonts load only when used; a lesson that measures its type loads them first
  await Promise.all((les.fonts || []).map(f => document.fonts.load(f)));
  await document.fonts.ready;
  orbs.forEach(o => { o.style.setProperty("--c", "#0b0b0d"); o.style.setProperty("--o", "0"); });
  grain();
  // a bare video (the social ones) draws everything itself: no logo intro, recap, outro or chrome
  if (les.bare) les.scenes();
  else { intro(les); les.scenes(); recap(les); outro(les); chrome(les); }
  tl.set({}, {}, DURATION);
  window.seek = t => { tl.seek(t, true); hooks.forEach(h => h(t)); };
  window.DURATION = DURATION; window.FPS = FPS; window.CUES = CUE; window.INTRO = INTRO; window.SIZE = [V.w, V.h];
  window.seek(0);
  window.ready = true;
  if (!/render/.test(location.search)) preview();
}
// preview in a browser: scales to the window; space plays and pauses, arrows skip 5 s, 0-5 jump to the parts
function preview() {
  const st = $("#stage"), fit = () => { const k = Math.min(innerWidth / V.w, innerHeight / V.h); st.style.transform = `scale(${k})`; st.style.position = "absolute"; st.style.left = (innerWidth - V.w * k) / 2 + "px"; st.style.top = (innerHeight - V.h * k) / 2 + "px"; };
  fit(); addEventListener("resize", fit);
  let t = +(new URLSearchParams(location.search).get("t") || 0), playing = true, last = performance.now();
  const loop = now => { if (playing) { t = Math.min(DURATION, t + (now - last) / 1000); window.seek(t); } last = now; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  addEventListener("keydown", e => {
    if (e.code === "Space") playing = !playing;
    if (e.key === "ArrowRight") t += 5; if (e.key === "ArrowLeft") t = Math.max(0, t - 5);
    if (/^[0-5]$/.test(e.key)) t = +e.key ? T("ch" + e.key) - .5 : 0;
    window.seek(t);
  });
}
