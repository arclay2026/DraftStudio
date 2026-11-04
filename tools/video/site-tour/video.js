// The Drafty Labs site tour: the logo intro, a title, seven parts (each a screen recording of the real
// site in a browser window, with a drawn cursor, click ripples and slow camera pushes), and a
// "Coming soon" ending. clips/clips.js holds each recording's start time, cursor moves and clicks.
const CLIPS = window.CLIPS || {};
const CLICK = decodeURIComponent(location.pathname.replace(/[^/]*$/, "")) + "click.mp3";
const ease = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
const PARTS = [
  // [clip, chapter cue, first cue, next cue, chapter word, chapter title, address]
  ["part1", "ch1", "side", "ch2", "one", "Finding your way around", "draftylabs.com"],
  ["part2", "ch2", "home", "ch3", "two", "Free files", "draftylabs.com"],
  ["part3", "ch3", "canvas", "ch4", "three", "Canvas", "draftylabs.com/canvas"],
  ["part4", "ch4", "qr", "ch5", "four", "QR Code Studio", "draftylabs.com/qr"],
  ["part5", "ch5", "barcode", "ch6", "five", "Barcodes &amp; palettes", "draftylabs.com/barcode"],
  ["part6", "ch6", "learn", "ch7", "six", "Learn", "draftylabs.com/learn"],
  ["part7", "ch7", "studio", "outro", "seven", "The studio", "draftylabs.com/websites"]];

// ---------- the title ----------
function title() {
  const a = T("title"), b = T("ch1");
  const PILLARS = [["Free files", "Mockups, logos, vectors", "M4 4h16v16H4z"], ["Pro tools", "Canvas, QR, barcodes, palettes", "M4 20l6-6m-2-6 8 8 4-12z"], ["Free lessons", "Design Basics, read to you", "M3 8l9-5 9 5-9 5zm4 3v5c3 2 7 2 10 0v-5"]];
  scene("title", a - .2, b, `
    <div class="abs kicker" id="ti-k" style="left:160px;top:250px">First look · Coming soon</div>
    <div class="abs" id="ti-big" style="left:150px;top:290px;font:600 200px/1.02 var(--sans);letter-spacing:-.06em">Meet <span class="rainbow" id="ti-name">Drafty Labs.</span></div>
    <div class="abs" id="ti-p" style="left:160px;top:600px;width:1600px;display:grid;grid-template-columns:repeat(3,1fr);gap:28px">
      ${PILLARS.map(([n, d, ic]) => `<div class="card ti-c" style="height:240px;padding:38px 40px">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="${BLUE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${ic}"/></svg>
        <div style="font:600 54px/1 var(--sans);letter-spacing:-.04em;margin-top:30px">${n}</div><div class="sub" style="font-size:28px;margin-top:12px">${d}</div></div>`).join("")}</div>
    <div class="abs" id="ti-soon" style="left:160px;top:900px;display:flex;align-items:center;gap:16px;padding:16px 28px;border-radius:999px;border:1.5px solid rgba(31,122,255,.7);font:600 30px/1 var(--sans)">
      <i style="width:14px;height:14px;border-radius:50%;background:${BLUE};box-shadow:0 0 20px ${BLUE}"></i>Coming soon</div>`);
  textIn($("#ti-k"), a);
  tl.from("#ti-big", { yPercent: 30, opacity: 0, filter: "blur(16px)", duration: 1.4 }, a + .05);
  tl.fromTo("#ti-name", { backgroundPosition: "0% 0" }, { backgroundPosition: "100% 0", duration: b - a, ease: "none" }, a);
  fadeIn($$(".ti-c"), T("what") + .6, { y: 70, st: .14 });
  fadeIn("#ti-soon", T("soon") - .1, { y: 24, s: .9, ease: "pop" });
  tl.to("#ti-soon", { boxShadow: "0 0 60px rgba(31,122,255,.45)", duration: .8, yoyo: true, repeat: 1 }, T("soon") + .8);
  light(INTRO, "#1f7aff", "#8c5cff", "#22c1ee", .3);
}

// ---------- a recorded part: the window, its video, the cursor ----------
function part([key, ch, first, next, word, name, address]) {
  const c = CLIPS[key]; if (!c) return;
  const a = T(first) - .9, b = T(next);
  const v = document.createElement("video");
  Object.assign(v, { src: `clips/${key}.webm`, muted: true, preload: "auto", playsInline: true });
  $("#cam").append(v);
  // the video shows its own frame for every moment of the part
  hooks.push(t => {
    const on = t >= a - .05 && t <= b;
    v.style.visibility = on ? "visible" : "hidden";
    if (!on || !v.duration) return;
    const target = Math.min(Math.max(t - c.start, 0), v.duration - .02);
    if (Math.abs(v.currentTime - target) < .0005) return;
    return new Promise(res => { v.addEventListener("seeked", () => requestAnimationFrame(() => res()), { once: true }); v.currentTime = target; });
  });
  // the window comes forward with the part and steps back for the next chapter card
  tl.set("#win", { visibility: "visible" }, a);
  tl.fromTo("#win", { y: 90, scale: .94, opacity: 0, filter: "blur(10px)" }, { y: 0, scale: 1, opacity: 1, filter: "blur(0px)", duration: 1, ease: "silk" }, a);
  tl.to("#win", { y: -40, scale: .97, opacity: 0, filter: "blur(10px)", duration: .6, ease: "power2.in" }, b - .65);
  tl.set("#win", { visibility: "hidden" }, b);
  tl.set("#url-t", { textContent: address }, a);
  tl.set("#cam", { scale: 1, x: 0, y: 0 }, a);
  // the cursor: the logged moves, eased, along a gentle arc
  const cur = $("#cur");
  hooks.push(t => {
    if (t < a || t > b) return;
    let pos = c.moves[0].to;
    for (const m of c.moves) {
      if (t >= m.t1) { pos = m.to; continue; }
      if (t > m.t0) { const u = ease((t - m.t0) / (m.t1 - m.t0)), dx = m.to.x - m.from.x, dy = m.to.y - m.from.y, d = Math.hypot(dx, dy) || 1, bow = Math.min(36, d * .07) * Math.sin(Math.PI * u);
        pos = { x: m.from.x + dx * u - dy / d * bow, y: m.from.y + dy * u + dx / d * bow }; }
      break;
    }
    const press = c.clicks.some(k => t >= k.t && t < k.t + .12);
    cur.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${press ? .86 : 1})`;
  });
  tl.set(cur, { visibility: "visible" }, a); tl.set(cur, { visibility: "hidden" }, b);
  // a ripple and the click sound on every click
  c.clicks.forEach(k => {
    const r = document.createElement("i"); r.className = "rip"; r.style.left = k.x + "px"; r.style.top = k.y + "px"; $("#cam").append(r);
    tl.fromTo(r, { scale: .3, opacity: 1 }, { scale: 1.5, opacity: 0, duration: .5, ease: "power2.out", immediateRender: false }, k.t);
    sfx(CLICK, k.t, .6);
  });
}
// a slow camera push towards a point of the page (x, y in page pixels), and back out
function push(at, x, y, s = 1.6, hold = 2, out = true) {
  const W = 1600, H = 900, tx = Math.min(0, Math.max(W - W * s, W / 2 - x * s)), ty = Math.min(0, Math.max(H - H * s, H / 2 - y * s));
  tl.to("#cam", { scale: s, x: tx, y: ty, duration: 1.1, ease: "glide" }, at);
  if (out) tl.to("#cam", { scale: 1, x: 0, y: 0, duration: 1, ease: "glide" }, at + 1.1 + hold);
}
function chip(at, text, hold = 1.8) {
  const d = document.createElement("div"); d.className = "chip2"; d.innerHTML = text; $("#chips").append(d);
  tl.fromTo(d, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .5, ease: "silk", immediateRender: false }, at);
  tl.to(d, { opacity: 0, y: -10, duration: .4, ease: "power2.in" }, at + hold);
}
function camera() {
  // the address bar follows the page within a part
  [["browse", "draftylabs.com/browse"], ["open", "draftylabs.com/browse?file=hoodie"], ["license", "draftylabs.com/license"], ["premium", "draftylabs.com/browse?cat=logos"],
   ["palettes", "draftylabs.com/palettes"], ["diagrams", "draftylabs.com/learn/colour"], ["pricing", "draftylabs.com/pricing"], ["portfolio", "draftylabs.com/portfolio"]]
    .forEach(([c, u]) => tl.set("#url-t", { textContent: u }, T(c) + .3));
  // 1 · settings and Drafty
  push(T("settings") + .3, 300, 640, 1.55, T("drafty") - T("settings") - 1.9);
  chip(T("settings") + 1.4, "Dark mode", 1.6); chip(T("lang") + .4, "Six languages", 1.6); chip(T("size") + .6, "Bigger text", 1.2);
  push(T("drafty") + .6, 1400, 560, 1.45, T("ch2") - T("drafty") - 2.6);
  // 2 · filters, the download, exclusive logos
  push(T("ftype") - .4, 600, 200, 1.5, T("save") - T("ftype") - 1.5);
  chip(T("open") + 1, "No sign-up · No watermark", T("free") - T("open") + 1.6);
  push(T("formats") - .3, 1250, 650, 1.45, T("free") - T("formats") + .4);
  push(T("exclusive") - .5, 1250, 560, 1.4, T("ch3") - T("exclusive") - 2.2);
  // 3 · the tool column, the font menu, export
  push(T("pen") - .5, 160, 330, 1.7, T("text") - T("pen") - 1.3);
  push(T("fontsearch") - .2, 380, 260, 1.5, T("recolour") - T("fontsearch") - .6);
  push(T("export") + .4, 800, 450, 1.25, 1.5);
  // 4 · the content types, then the finished code
  push(T("qrcontent") - .2, 1240, 300, 1.5, T("qrpattern") - T("qrcontent") - 2);
  push(T("qrcheck") - .1, 470, 560, 1.4, T("qrexport") - T("qrcheck") + .2);
  // 5 · barcode formats, the palette generator
  push(T("bformats") - .3, 1240, 300, 1.5, T("blooks") - T("bformats") - 1);
  push(T("roles") - .3, 1280, 520, 1.35, T("copy") - T("roles") - 1.3);
  // 6 · the read-aloud highlight
  push(T("listen") + .8, 800, 420, 1.4, T("videos") - T("listen") - 1.5);
}

// ---------- the ending ----------
function ending() {
  const a = T("outro"), e = T("end");
  scene("end", a - .2, e + .2, `
    ${[["files", "Free files."], ["protools", "Pro tools."], ["freelessons", "Free lessons."]].map(([c, w], k) => `<div class="abs h1 en-w" id="en-${c}" style="left:160px;top:${200 + k * 140}px;font-size:120px">${w}</div>`).join("")}
    <div class="abs" id="en-soon" style="left:150px;top:640px;overflow:hidden;padding:0 30px 30px 0"><div class="rainbow" id="en-big" style="font:600 220px/1.02 var(--sans);letter-spacing:-.06em">Coming soon.</div></div>
    <div class="abs sub" id="en-f" style="left:160px;top:910px">Follow along, so you’re the first to know.</div>`);
  ["files", "protools", "freelessons"].forEach(c => textIn($("#en-" + c), T(c) - .05));
  tl.to(".en-w", { opacity: .35, duration: .6 }, T("launch") - .2);
  tl.from("#en-big", { yPercent: 100, duration: 1.3 }, T("launch") - .1);
  tl.fromTo("#en-big", { backgroundPosition: "0% 0" }, { backgroundPosition: "100% 0", duration: e - a + 2, ease: "none" }, a);
  textIn($("#en-f"), T("follow"));
  // the end card: the logo comes together
  const s = scene("endcard", e - .1, null, `<div class="abs kicker" id="e-next" style="left:0;right:0;top:720px;text-align:center;letter-spacing:.5em;color:var(--mute)">Coming soon</div>`);
  const L = logoLockup("e-logo", 436); s.prepend(L.box); assemble(L, e, true);
  tl.fromTo("#e-next", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 1.4 }, e + 2.4);
  light(a, "#ff4d4d", "#1f7aff", "#ffd53d", .3);
  light(e, "#0d2a5c", "#0b1430", "#0b0b0d", .55);
}

build({
  bare: true, tag: "First look · Coming soon",
  scenes() {
    intro(this);
    $("#view").insertAdjacentHTML("beforeend", `<svg id="cur" width="30" height="30" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.6-3.6 6.4z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
    $("#cam").append($("#cur"));
    title();
    PARTS.forEach((p, k) => { chapterCard(k + 1, p[4], p[5], T(p[1]), T(p[2]) - .9); part(p); });
    $("#cam").append($("#cur"));   // the cursor sits above every recording and ripple
    camera();
    ending();
    // sound: only the clicks (the engine's own effects stay out of this video)
    for (let i = SFX.length - 1; i >= 0; i--) if (SFX[i].n !== CLICK) SFX.splice(i, 1);
  }
});
