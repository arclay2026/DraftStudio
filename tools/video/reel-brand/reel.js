// Drafty Labs brand reel: 16 s, 1080×1920, 60 fps. One paused GSAP timeline, drawn exactly with seek(t),
// so shared/render.js can step it frame by frame. Every cut lands on a beat (120 bpm: a beat every 0.5 s),
// so trending audio added in the app lines up. Sound effects (sfx) are scheduled on the same beats.
//   0.0  hook      DESIGN / THAT / HITS.   three hits with camera shake and a flash
//   1.5  whip  →   "Free files." + what's inside
//   3.0  fly-through: real files on 3D cards rushing past the camera
//   6.5  the tools, popping into a 2×2 grid
//   9.5  a tilted wall of logos racing upward: "Made by one designer."
//  12.0  the logo builds itself, the name wipes in, a shine, the call to action
gsap.registerPlugin(SplitText, CustomEase);
CustomEase.create("silk", "0.16, 1, 0.3, 1");
CustomEase.create("snapIn", "0.05, 0.9, 0.1, 1");
CustomEase.create("pop", "0.34, 1.56, 0.64, 1");
const W = 1080, H = 1920, FPS = 60, DURATION = 16;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tl = gsap.timeline({ paused: true, defaults: { ease: "silk", duration: 1 } });
const SFX = [], hooks = [];
const sfx = (n, t, g = 1, p = 0) => SFX.push({ n, t: +t.toFixed(3), g, p });
const BLUE = "#1f7aff";

function layer(id, a, b, html) {
  const el = document.createElement("div");
  el.className = "layer"; el.id = id; el.innerHTML = html;
  $("#scenes").append(el);
  tl.set(el, { visibility: "visible" }, a);
  if (b != null) tl.set(el, { visibility: "hidden" }, b);
  return el;
}
// a quick camera shake (deterministic, so every render is identical)
function shake(at, amp = 18, d = .32) {
  const k = [[1, -.6], [-.8, .9], [.6, .4], [-.4, -.5], [.2, .2], [0, 0]];
  tl.to("#cam", { keyframes: k.map(([x, y], i) => ({ x: x * amp * (1 - i / k.length), y: y * amp * (1 - i / k.length), duration: d / k.length })), ease: "none" }, at);
}
function flash(at, o = .35) { tl.fromTo("#flash", { opacity: o }, { opacity: 0, duration: .35, ease: "power2.out" }, at); }
// a whip: out fast to one side with motion blur, the next thing in from the other side
function whipOut(el, at, dir = -1) { tl.to(el, { x: dir * 1400, filter: "blur(40px)", duration: .26, ease: "power3.in" }, at); }
function whipIn(el, at, dir = 1) { tl.fromTo(el, { x: dir * 1400, filter: "blur(40px)" }, { x: 0, filter: "blur(0px)", duration: .5, ease: "snapIn" }, at); }

// ---------- 1 · hook ----------
function hook() {
  const s = layer("s1", 0, 1.78, `
    <div class="abs" id="h-grp" style="inset:0">
      <div class="word" id="w1" style="top:560px">DESIGN</div>
      <div class="word" id="w2" style="top:800px">THAT</div>
      <div class="word" id="w3" style="top:1040px;color:${BLUE}">HITS.</div>
    </div>`);
  [["#w1", .12], ["#w2", .62], ["#w3", 1.12]].forEach(([w, t], i) => {
    tl.fromTo(w, { scale: 2.6, opacity: 0, filter: "blur(36px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: .3, ease: "expo.out" }, t);
    shake(t + .05, i === 2 ? 26 : 16); flash(t + .04, i === 2 ? .45 : .22);
    sfx(i === 2 ? "impact" : "thud", t + .05, i === 2 ? 1 : .8);
  });
  tl.to("#w3", { scale: 1.06, duration: .3, ease: "power2.out" }, 1.25);
  whipOut("#h-grp", 1.52, -1); sfx("whoosh", 1.62, .9, -.4);
}

// ---------- 2 · free files ----------
function free() {
  const s = layer("s2", 1.55, 3.2, `
    <i class="rule" id="r1" style="left:90px;right:90px;top:700px"></i>
    <i class="rule" id="r2" style="left:90px;right:90px;top:1250px"></i>
    <div class="abs" id="f-grp" style="left:0;right:0;top:760px;text-align:center">
      <div class="big"><span style="color:${BLUE}">Free</span> files.</div>
      <div class="kick" id="f-k" style="margin-top:70px;color:var(--mute)">Mockups · Logos · Templates</div>
    </div>`);
  whipIn("#f-grp", 1.62, 1);
  tl.from(["#r1", "#r2"], { scaleX: 0, duration: .8, stagger: .1, ease: "silk" }, 1.7);
  const sp = SplitText.create("#f-k", { type: "chars" });
  tl.from(sp.chars, { opacity: 0, y: 24, duration: .4, stagger: .018, ease: "power3.out" }, 2.05);
  sfx("tick", 2.05, .5);
  // fly through the words into the next scene
  tl.to("#f-grp", { scale: 7, opacity: 0, filter: "blur(18px)", duration: .55, ease: "power3.in" }, 2.7);
  tl.to(["#r1", "#r2"], { opacity: 0, duration: .3 }, 2.8);
  sfx("riser", 3.0, .7);
}

// ---------- 3 · fly-through ----------
function flythrough() {
  const CARDS = [
    ["previews/md/t-shirt-mockup-one.webp", 620, 820, -170, -14],
    ["previews/md/kaven-logo-2.webp", 600, 600, 190, 16],
    ["previews/md/hoodie-mockup-one.webp", 620, 820, -150, -12],
    ["previews/md/wiltz-logo-2.webp", 600, 600, 180, 14],
    ["previews/md/mato-logo-2.webp", 600, 600, -40, -6]];
  const s = layer("s3", 3.0, 6.55, `
    <div class="abs" id="fly" style="inset:0;perspective:1300px;perspective-origin:50% 48%">
      ${CARDS.map(([src, w, h], i) => `<div class="card3d" id="c${i}" style="width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px"><img src="../../../${src}" alt=""></div>`).join("")}
    </div>
    <div class="abs" id="fly-cap" style="left:0;right:0;top:1500px;text-align:center"><span id="fc" class="big" style="display:block;font-size:84px">Ready to download.</span></div>`);
  CARDS.forEach(([, , , x, ry], i) => {
    const a = 3.05 + i * .5, last = i === CARDS.length - 1;
    const c = `#c${i}`;
    tl.fromTo(c, { z: -1900, x: x * 1.8, rotateY: ry, rotateZ: ry * -.3, opacity: 0 },
      { z: last ? 0 : 900, x: last ? 0 : -x * .8, rotateY: last ? 0 : -ry * .6, rotateZ: 0, opacity: 1, duration: last ? 1.1 : 1.35, ease: last ? "expo.out" : "power2.in" }, a);
    tl.set(c, { opacity: 0 }, a + .02);
    tl.to(c, { opacity: 1, duration: .25, ease: "none" }, a + .02);
    if (!last) { tl.to(c, { filter: "blur(22px)", duration: .3, ease: "power2.in" }, a + 1.05); tl.to(c, { opacity: 0, duration: .18, ease: "none" }, a + 1.17); }
    tl.fromTo(c, { "--sx": "-120%" }, { "--sx": "140%", duration: .9, ease: "power2.inOut" }, a + .3);
    sfx("whoosh_soft", a + (last ? .6 : 1.2), .55, i % 2 ? .5 : -.5);
  });
  // the last card lands, takes a breath, then everything punches out
  tl.to("#c4", { scale: 1.04, duration: 1.2, ease: "none" }, 5.2);
  tl.from("#fc", { y: 70, opacity: 0, filter: "blur(16px)", duration: .7, ease: "silk" }, 5.15);
  tl.to("#fly-cap", { opacity: 0, duration: .25 }, 6.2);
  tl.to("#c4", { scale: 0, rotate: 12, opacity: 0, filter: "blur(10px)", duration: .32, ease: "power3.in" }, 6.2);
  sfx("snap", 6.5, .8); flash(6.5, .3);
}

// ---------- 4 · tools ----------
function tools() {
  const T = [["qr", "QR Studio", 80, 600, -6], ["barcode", "Barcodes", 560, 600, 5], ["palettes", "Palettes", 80, 1080, 4], ["convert", "Converter", 560, 1080, -5]];
  const s = layer("s4", 6.5, 9.55, `
    <div class="abs" id="t-head" style="left:80px;right:80px;top:300px">
      <div class="kick" style="color:${BLUE}">Free tools</div>
      <div class="big" id="t-h" style="font-size:112px;margin-top:26px">That just work.</div>
    </div>
    <div class="abs" id="t-grid" style="inset:0">
      ${T.map(([k, n, x, y]) => `<div class="tile" id="t-${k}" style="left:${x}px;top:${y}px"><img src="shots/${k}-sq.jpg" alt=""><b>${n}</b></div>`).join("")}
    </div>`);
  const sp = SplitText.create("#t-h", { type: "words" });
  tl.from(sp.words, { y: 70, opacity: 0, filter: "blur(14px)", duration: .7, stagger: .07, ease: "silk" }, 6.6);
  tl.from("#t-head .kick", { opacity: 0, x: -30, duration: .5 }, 6.55);
  T.forEach(([k, , , , r], i) => {
    const a = 7.0 + i * .14;
    tl.fromTo(`#t-${k}`, { scale: .4, rotate: r * 3, opacity: 0, y: 120 }, { scale: 1, rotate: 0, opacity: 1, y: 0, duration: .75, ease: "pop" }, a);
    tl.from(`#t-${k} b`, { opacity: 0, y: 16, duration: .4 }, a + .35);
    sfx(i % 2 ? "pop" : "pop_low", a + .08, .6, i % 2 ? .35 : -.35);
  });
  // a slow push in, then the tiles scatter on the beat
  tl.fromTo("#t-grid", { scale: 1 }, { scale: 1.06, duration: 1.8, ease: "none", transformOrigin: "50% 60%" }, 7.6);
  T.forEach(([k, , x, y], i) => tl.to(`#t-${k}`, { x: (x < 300 ? -1 : 1) * 1100, y: (y < 900 ? -1 : 1) * 300, rotate: (x < 300 ? -1 : 1) * 20, filter: "blur(24px)", duration: .32, ease: "power3.in" }, 9.2 + i * .02));
  tl.to("#t-head", { opacity: 0, y: -60, filter: "blur(12px)", duration: .3, ease: "power3.in" }, 9.2);
  sfx("whoosh", 9.45, .9, 0);
}

// ---------- 5 · the wall ----------
function wall() {
  const IMG = ["kaven-logo-2", "t-shirt-mockup-one", "wiltz-logo", "mato-logo-2", "hoodie-mockup-one", "kaven-logo", "wiltz-logo-2", "mato-logo"];
  const RAT = [1, 1.25, .8, 1, 1.3, .75, 1, 1.2];
  const col = c => { let h = ""; for (let i = 0; i < 9; i++) { const k = (i + c * 3) % IMG.length; h += `<div class="pin" style="height:${Math.round(380 * RAT[(i + c) % RAT.length])}px"><img src="../../../previews/md/${IMG[k]}.webp" alt=""></div>`; } return `<div class="pcol" id="pc${c}">${h}${h}</div>`; };
  const s = layer("s5", 9.5, 12.1, `
    <div class="pinwall" id="pw">${[0, 1, 2, 3].map(col).join("")}</div>
    <div class="abs" style="inset:0;background:radial-gradient(80% 40% at 50% 50%, rgba(8,8,10,.95), rgba(8,8,10,.7) 55%, rgba(8,8,10,.45) 85%)"></div>
    <div class="abs" id="m-grp" style="left:0;right:0;top:760px;text-align:center">
      <div class="kick" style="color:var(--mute)">Every file</div>
      <div class="big" id="m-1" style="margin-top:34px">Made by</div>
      <div class="big" id="m-2" style="color:${BLUE}">one designer.</div>
    </div>`);
  tl.fromTo("#pw", { scale: 1.25, opacity: 0 }, { scale: 1, opacity: .8, duration: .8, ease: "silk" }, 9.5);
  [0, 1, 2, 3].forEach(c => tl.fromTo(`#pc${c}`, { yPercent: c % 2 ? -50 : 0 }, { yPercent: c % 2 ? -20 : -30, duration: 2.6, ease: "none" }, 9.5));
  ["#m-1", "#m-2"].forEach((m, i) => { const sp = SplitText.create(m, { type: "chars" }); tl.from(sp.chars, { y: 80, opacity: 0, filter: "blur(12px)", duration: .7, stagger: .025, ease: "silk" }, 9.9 + i * .3); });
  tl.from("#m-grp .kick", { opacity: 0, letterSpacing: "1em", duration: .8 }, 9.75);
  sfx("shimmer", 10.0, .6); sfx("swell", 11.6, .7);
  // collapse to a point of light
  tl.to("#s5", { scale: .2, opacity: 0, filter: "blur(30px)", duration: .45, ease: "power3.in", transformOrigin: "50% 48%" }, 11.62);
}

// ---------- 6 · logo ----------
function logo() {
  const ms = 400 / 167, mx = 540, my = 800;
  const petals = PETALS.map((d, i) => `<path id="pt${i}" d="${d}" fill="${i === 3 ? BLUE : "#f4f3ef"}"/>`).join("");
  const s = layer("s6", 12.0, null, `
    <div class="abs" id="glow" style="left:540px;top:800px;width:1400px;height:1400px;margin:-700px 0 0 -700px;border-radius:50%;background:radial-gradient(circle, rgba(31,122,255,.45), rgba(31,122,255,.1) 35%, transparent 65%)"></div>
    <svg class="abs" id="mark" style="left:0;top:0;width:1080px;height:1920px;overflow:visible" viewBox="0 0 1080 1920">
      <g transform="translate(${mx} ${my}) scale(${ms}) translate(-225.38 -500)">${petals}</g>
    </svg>
    <div class="abs" id="nm" style="left:150px;top:1080px;width:780px;clip-path:inset(0 100% 0 0)">
      <svg viewBox="360.7 451.2 498.4 107.5" style="width:780px;display:block;overflow:visible"><path fill="#f4f3ef" transform="translate(0 9.9)" d="${NAME_PATH}"/></svg>
      <i id="shine" class="abs" style="top:-20px;bottom:-20px;left:0;width:180px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);mix-blend-mode:overlay;transform:translateX(-300px) skewX(-18deg)"></i>
    </div>
    <div class="abs" id="tag" style="left:0;right:0;top:1290px;text-align:center;font:500 44px/1.2 var(--sans);color:var(--mute);letter-spacing:-.02em">Free design files &amp; tools.</div>
    <div class="abs" id="cta" style="left:0;right:0;top:1400px;text-align:center"><span class="pill">Link in bio <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></span></div>`);
  tl.fromTo("#glow", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "silk" }, 12.05);
  // the four petals fly in from the corners and lock together
  const FROM = [[-520, 620, -120], [-520, -620, 110], [520, 620, 120], [520, -620, -100]];
  FROM.forEach(([x, y, r], i) => {
    const a = 12.1 + i * .09;
    tl.fromTo(`#pt${i}`, { x: x / ms, y: y / ms, rotate: r, scale: .2, opacity: 0, transformOrigin: "50% 50%", svgOrigin: "225.38 500" },
      { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, duration: .8, ease: "pop" }, a);
    sfx("snap", a + .55, .55, x > 0 ? .4 : -.4);
  });
  tl.fromTo("#mark", { scale: 1 }, { scale: 1.08, duration: .25, ease: "power2.out", yoyo: true, repeat: 1, transformOrigin: "540px 800px" }, 12.85);
  shake(12.9, 10, .25); flash(12.9, .25); sfx("impact", 12.9, .7);
  // the name wipes in, a shine crosses it
  tl.to("#nm", { clipPath: "inset(0 0% 0 0)", duration: .9, ease: "power3.inOut" }, 13.15);
  sfx("slide", 13.3, .5);
  tl.to("#shine", { x: 980, duration: 1.1, ease: "power2.inOut" }, 13.9);
  sfx("shimmer", 14.2, .5);
  tl.from("#tag", { opacity: 0, y: 30, duration: .7 }, 14.0);
  tl.fromTo("#cta .pill", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .7, ease: "pop" }, 14.5);
  sfx("ding", 14.6, .55);
  tl.to("#cta .pill", { scale: 1.05, duration: .5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 15.1);
  tl.to("#glow", { scale: 1.12, duration: 2.5, ease: "sine.inOut" }, 13.4);
}

// ---------- ambient: drifting light, live film grain ----------
function ambient() {
  const o1 = $("#o1"), o2 = $("#o2");
  o1.style.setProperty("--c", BLUE); o2.style.setProperty("--c", "#6b4dff");
  hooks.push(t => {
    o1.style.left = 540 + 260 * Math.sin(t * .6) + "px"; o1.style.top = 520 + 180 * Math.cos(t * .45) + "px";
    o2.style.left = 560 + 300 * Math.cos(t * .4) + "px"; o2.style.top = 1480 + 160 * Math.sin(t * .55) + "px";
    const k = t < 1.6 ? .12 : t < 12 ? .32 : .18;
    o1.style.setProperty("--o", k); o2.style.setProperty("--o", k * .7);
  });
  const g = $("#grain"), c = g.getContext("2d"), img = c.createImageData(400, 400);
  hooks.push(t => {
    let s = Math.floor(t * 24) * 9301 + 49297;   // a new grain 24 times a second, the same on every render
    for (let i = 0; i < img.data.length; i += 4) { s = (s * 9301 + 49297) % 233280; const v = (s / 233280) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    c.putImageData(img, 0, 0);
  });
}

(async () => {
  await document.fonts.load('800 100px "Inter Display"'); await document.fonts.load('700 100px "Inter Display"'); await document.fonts.ready;
  ambient(); hook(); free(); flythrough(); tools(); wall(); logo();
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  tl.set({}, {}, DURATION);
  window.seek = t => { tl.seek(t, true); hooks.forEach(h => h(t)); };
  Object.assign(window, { SFX, DURATION, FPS, INTRO: 0, SIZE: [W, H] });
  window.seek(0); window.ready = true;
  if (/render/.test(location.search)) return;
  // preview: fit the window; space plays/pauses, arrows skip 1 s; ?t=5 starts at 5 s
  const st = $("#stage"), fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); st.style.transform = `scale(${k})`; st.style.left = (innerWidth - W * k) / 2 + "px"; st.style.top = (innerHeight - H * k) / 2 + "px"; };
  fit(); addEventListener("resize", fit);
  let t = +(new URLSearchParams(location.search).get("t") || 0), playing = !/still/.test(location.search), last = performance.now();
  const loop = now => { if (playing) { t += (now - last) / 1000; if (t > DURATION) t = 0; window.seek(t); } last = now; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  addEventListener("keydown", e => { if (e.code === "Space") playing = !playing; if (e.key === "ArrowRight") t += 1; if (e.key === "ArrowLeft") t = Math.max(0, t - 1); window.seek(t); });
})();
