// "AI Design Review · Ep. 1 · Bakery": 34 s, 1080×1920, 60 fps, no sound effects (made to carry a trending sound).
// One paused GSAP timeline drawn exactly with seek(t), so shared/render.js can render it frame by frame.
//   0.0  hook: "I asked AI to design a bakery logo." / "It did not go well."
//   3.2  round 1  the spelling      2/10
//   8.0  round 2  the croissant     1/10
//  12.8  round 3  the colours       1/10
//  17.6  round 4  the size test     0/10
//  22.4  "Same brief. Real designer." the clean logo builds itself, passes three tests, 10/10
//  29.6  "AI is a tool, not a designer." Drafty Labs, link in bio
// Text always fades and focuses in whole (no masked slides that cut letters).
gsap.registerPlugin(SplitText, CustomEase, DrawSVGPlugin);
CustomEase.create("silk", "0.16, 1, 0.3, 1");
CustomEase.create("pop", "0.34, 1.56, 0.64, 1");
const W = 1080, H = 1920, FPS = 60, DURATION = 34;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const tl = gsap.timeline({ paused: true, defaults: { ease: "silk", duration: 1 } });
const hooks = [];
const RED = "#ff4d4d", GREEN = "#3ddc84", BLUE = "#1f7aff";

function layer(id, a, b, html) {
  const el = document.createElement("div");
  el.className = "layer"; el.id = id; el.innerHTML = html;
  $("#scenes").append(el);
  tl.set(el, { visibility: "visible" }, a);
  if (b != null) tl.set(el, { visibility: "hidden" }, b);
  return el;
}
// words rise, fade and come into focus, whole (nothing is ever clipped)
function words(sel, at, o = {}) {
  const sp = SplitText.create(sel, { type: "words" });
  tl.from(sp.words, { y: o.y ?? 50, opacity: 0, filter: "blur(12px)", duration: o.d ?? .6, stagger: o.st ?? .06, ease: "silk" }, at);
  return sp;
}
function out(sel, at, d = .35) { tl.to(sel, { opacity: 0, y: -40, filter: "blur(14px)", duration: d, ease: "power3.in" }, at); }
function shake(at, amp = 14, d = .3) {
  const k = [[1, -.6], [-.8, .9], [.6, .4], [-.4, -.5], [.2, .2], [0, 0]];
  tl.to("#cam", { keyframes: k.map(([x, y], i) => ({ x: x * amp * (1 - i / k.length), y: y * amp * (1 - i / k.length), duration: d / k.length })), ease: "none" }, at);
}
// a hand-drawn marker loop around (cx, cy), drawn on with DrawSVG
const loop = (cx, cy, rx, ry) => {
  const p = []; for (let i = 0; i <= 56; i++) { const a = i / 52 * Math.PI * 2 - .5, w = 1 + .06 * Math.sin(i * 1.7); p.push(`${(cx + rx * w * Math.cos(a)).toFixed(1)} ${(cy + ry * w * Math.sin(a)).toFixed(1)}`); }
  return "M" + p.join("L");
};

// ---------- persistent header (rounds) ----------
function header() {
  layer("hdr", 3.0, 22.5, `
    <div class="abs kick" id="hd-k" style="left:110px;top:236px;color:${BLUE}">AI Design Review · Ep. 1</div>
    <div class="abs" id="hd-b" style="left:110px;top:272px;font:500 32px/1 var(--sans);color:var(--mute)">The brief: a bakery logo</div>
    <div class="abs" id="hd-s" style="right:110px;top:240px;text-align:right">
      ${[1, 2, 3, 4].map(i => `<i id="dot${i}" style="display:inline-block;width:20px;height:20px;border-radius:50%;margin-left:12px;background:rgba(244,243,239,.18)"></i>`).join("")}
    </div>`);
  tl.from(["#hd-k", "#hd-b", "#hd-s"], { opacity: 0, y: -24, filter: "blur(8px)", duration: .6, stagger: .08 }, 3.05);
  tl.to(["#hd-k", "#hd-b", "#hd-s"], { opacity: 0, y: -24, filter: "blur(8px)", duration: .35, stagger: .04, ease: "power3.in" }, 22.1);
}

// ---------- hook ----------
function hook() {
  layer("hook", 0, 3.25, `
    <div class="abs" id="fan" style="inset:0">
      ${[["aiBadge", 120, 380, -14], ["aiCroissant", 600, 330, 11], ["aiCrypto", 150, 1150, 9], ["aiBadge", 620, 1200, -8]].map(([f, x, y, r], i) =>
        `<div class="abs fanc" id="fc${i}" style="left:${x}px;top:${y}px;width:360px;height:360px;border-radius:36px;overflow:hidden;transform:rotate(${r}deg);box-shadow:0 40px 80px -30px #000">${window[f]("h" + i)}</div>`).join("")}
    </div>
    <div class="abs" style="inset:0;background:radial-gradient(70% 38% at 50% 48%, rgba(10,10,12,.94), rgba(10,10,12,.55) 70%, rgba(10,10,12,.35))"></div>
    <div class="abs big" id="hk1" style="left:70px;right:70px;top:700px;text-align:center">I asked AI to design a bakery logo.</div>
    <div class="abs" id="hk2" style="left:0;right:0;top:1060px;text-align:center;font:700 64px/1 var(--sans);letter-spacing:-.03em;color:${RED}">It did not go well.</div>`);
  [0, 1, 2, 3].forEach(i => tl.from(`#fc${i}`, { scale: .3, opacity: 0, rotate: i % 2 ? 40 : -40, duration: .8, ease: "pop" }, .1 + i * .09));
  tl.to("#fan", { scale: 1.08, duration: 3.2, ease: "none" }, 0);
  words("#hk1", .25, { st: .07 });
  tl.from("#hk2", { scale: 1.8, opacity: 0, filter: "blur(20px)", duration: .4, ease: "expo.out" }, 1.75);
  shake(1.8, 12);
  tl.to(["#hk1", "#hk2"], { opacity: 0, scale: .9, filter: "blur(16px)", duration: .35, ease: "power3.in" }, 2.85);
  tl.to(".fanc", { opacity: 0, scale: .6, duration: .35, ease: "power3.in", stagger: .03 }, 2.85);
}

// ---------- one round ----------
// focus: [x, y] on the 600-unit logo to zoom into; note: draws a marker loop there
function round(n, t0, title, svg, focus, zoom, caption, score, extra) {
  const id = "r" + n, fx = focus[0] / 600 * 860, fy = focus[1] / 600 * 860;
  const L = layer(id, t0, t0 + 4.85, `
    <div class="abs" id="${id}-lab" style="left:110px;top:352px">
      <span class="kick" style="color:${RED}">Round ${n} / 4</span>
      <span style="margin-left:22px;font:700 50px/1 var(--sans);letter-spacing:-.03em">${title}</span>
    </div>
    <div class="card" id="${id}-card"><div class="zin" id="${id}-z">${svg}
      <svg class="note" id="${id}-note" viewBox="0 0 600 600" style="left:0;top:0;width:860px;height:860px">
        <path id="${id}-loop" d="${loop(focus[0], focus[1], extra.rx || 90, extra.ry || 50)}" fill="none" stroke="${RED}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div></div>
    <div class="abs cap" id="${id}-cap" style="left:70px;right:70px;top:1340px">${caption}</div>
    <div class="stamp" id="${id}-st" style="color:${score === "10/10" ? GREEN : RED}">${score}<small>${extra.verdict || "VERDICT"}</small></div>`);
  tl.from(`#${id}-lab`, { opacity: 0, x: -40, filter: "blur(10px)", duration: .55 }, t0 + .05);
  tl.fromTo(`#${id}-card`, { scale: .82, opacity: 0, filter: "blur(18px)", y: 60 }, { scale: 1, opacity: 1, filter: "blur(0px)", y: 0, duration: .75, ease: "silk" }, t0 + .1);
  tl.to(`#dot${n}`, { background: RED, scale: 1.25, duration: .4, ease: "pop" }, t0 + .2);
  // zoom into the flaw and circle it
  tl.to(`#${id}-z`, { scale: zoom, transformOrigin: `${fx}px ${fy}px`, duration: .7, ease: "power3.inOut" }, t0 + 1.05);
  tl.from(`#${id}-loop`, { drawSVG: "0%", duration: .55, ease: "power2.inOut" }, t0 + 1.55);
  words(`#${id}-cap`, t0 + 1.5, { st: .05 });
  if (extra.during) extra.during(t0);
  // back out, the verdict slams down
  tl.to(`#${id}-z`, { scale: 1, duration: .6, ease: "power3.inOut" }, t0 + 3.05);
  tl.to(`#${id}-loop`, { opacity: 0, duration: .3 }, t0 + 3.05);
  tl.fromTo(`#${id}-st`, { scale: 2.6, opacity: 0, rotate: -24 }, { scale: 1, opacity: 1, rotate: -11, duration: .32, ease: "expo.out" }, t0 + 3.55);
  shake(t0 + 3.6, 16);
  // exit
  tl.to(`#${id}-card`, { x: -1300, rotate: -8, filter: "blur(30px)", duration: .38, ease: "power3.in" }, t0 + 4.45);
  tl.to(`#${id}-st`, { x: -1300, rotate: -30, duration: .38, ease: "power3.in" }, t0 + 4.47);
  out([`#${id}-cap`, `#${id}-lab`], t0 + 4.4);
  return L;
}

function rounds() {
  round(1, 3.2, "The spelling", aiBadge("r1"), [300, 92], 1.9, "It spelled bakery like it was having a stroke.", "2/10", { rx: 170, ry: 46, verdict: "CAN'T READ IT" });
  round(2, 8.0, "The croissant", aiCroissant("r2"), [422, 205], 2.0, "This croissant has been through things.", "1/10", { rx: 62, ry: 70, verdict: "SEEK HELP" });
  round(3, 12.8, "The colours", aiCrypto("r3"), [300, 330], 1.35, "Every AI logo looks like it's selling crypto.", "1/10", { rx: 230, ry: 140, verdict: "NOT A BAKERY" });
  // round 4: the same badge shrunk to business-card and app-icon size, where it turns to mush
  round(4, 17.6, "The size test", aiBadge("r4"), [300, 300], 1, "On a business card, it's a fingerprint.", "0/10", { rx: 0, ry: 0, verdict: "UNUSABLE",
    during: t0 => {
      const L = $("#r4");
      L.insertAdjacentHTML("beforeend", `
        <div class="abs" id="r4-bc" style="left:150px;top:640px;width:780px;height:450px;border-radius:22px;background:#f6f1e8;box-shadow:0 40px 80px -30px #000;color:#3b2416;opacity:0">
          <div class="abs" style="left:56px;top:56px;width:92px;height:92px;filter:blur(.9px)">${aiBadge("r4s")}</div>
          <div class="abs" style="left:56px;top:300px;font:700 40px/1.1 var(--sans);letter-spacing:-.02em">Thandi Mokoena</div>
          <div class="abs" style="left:56px;top:350px;font:500 26px/1.3 var(--sans);color:#8a6a4d">Head baker · 082 123 4567</div>
          <div class="abs" style="left:56px;top:162px;font:600 20px/1 var(--mono);letter-spacing:.2em;color:#b0896a">← YOUR LOGO</div>
        </div>
        <div class="abs" id="r4-mag" style="left:520px;top:520px;width:300px;height:300px;border-radius:50%;overflow:hidden;border:8px solid #f4f3ef;box-shadow:0 30px 60px -20px #000;opacity:0;background:#f6f1e8">
          <div class="abs" style="left:-40px;top:-40px;width:380px;height:380px;filter:blur(7px)">${aiBadge("r4m")}</div>
        </div>`);
      tl.to("#r4-card", { scale: .107, x: 96, y: 256, transformOrigin: "0px 0px", duration: .9, ease: "power3.inOut" }, t0 + .95);
      tl.set("#r4-card", { opacity: 0 }, t0 + 1.82);
      tl.set("#r4-card", { zIndex: 5 }, t0 + .9);
      tl.fromTo("#r4-bc", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .5 }, t0 + 1.15);
      tl.fromTo("#r4-mag", { scale: .3, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: "pop" }, t0 + 1.9);
      tl.to(["#r4-bc", "#r4-mag"], { opacity: 0, filter: "blur(20px)", duration: .35, ease: "power3.in" }, t0 + 4.4);
    } });
  // round 4's card is replaced by the business card, so its zoom/loop are no-ops; keep its stamp over the card
}

// ---------- the designer's version ----------
function designer() {
  const t0 = 22.4;
  layer("dsg", t0, 29.75, `
    <div class="abs" id="d-h" style="left:0;right:0;top:300px;text-align:center">
      <div class="kick" style="color:${GREEN}">Same brief</div>
      <div style="margin-top:22px;font:700 76px/1 var(--sans);letter-spacing:-.04em">Real designer.</div>
    </div>
    <div class="card" id="d-card">${realLogo("d")}
      <svg class="note" viewBox="0 0 600 600" style="left:0;top:0;width:860px;height:860px">
        <g id="d-guides" fill="none" stroke="${BLUE}" stroke-width="2" stroke-dasharray="6 7" opacity=".8">
          <circle cx="300" cy="260" r="163"/><circle cx="300" cy="303" r="82"/><line x1="40" y1="260" x2="560" y2="260"/><line x1="300" y1="40" x2="300" y2="590"/>
        </g>
      </svg>
    </div>
    <div class="abs cap" id="d-cap" style="left:70px;right:70px;top:1340px">Simple shapes. Reads at any size.</div>
    <div class="tile" id="tl1" style="left:90px;top:960px">${realLogo("p", { bg: "#c9a07a", ink: "#3b2416", fill: "#f1d3a6", accent: "#5a3a22" })}</div>
    <div class="tile" id="tl2" style="left:400px;top:960px;background:#3b2416">${realLogo("i", { mark: true, bg: "#f4ede2" })}</div>
    <div class="tile" id="tl3" style="left:710px;top:960px">${realLogo("m", { mono: true, ink: "#111", fill: "#111", bg: "#fff" })}</div>
    <div class="tlabel" id="lb1" style="left:90px;top:1262px"><b>✓</b>Packaging</div>
    <div class="tlabel" id="lb2" style="left:400px;top:1262px"><b>✓</b>App icon</div>
    <div class="tlabel" id="lb3" style="left:710px;top:1262px"><b>✓</b>One colour</div>
    <div class="stamp" id="d-st" style="color:${GREEN};left:700px;top:430px">10/10<small>HIRE THEM</small></div>`);
  tl.from("#d-h .kick", { opacity: 0, letterSpacing: "1em", duration: .7 }, t0 + .05);
  tl.from("#d-h > div:last-child", { opacity: 0, scale: 1.4, filter: "blur(18px)", duration: .45, ease: "expo.out" }, t0 + .25);
  // the logo builds: guides draw, the badge grows, five segments pop in, the name focuses in
  const card = "#d-card";
  tl.fromTo(card, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .6 }, t0 + .45);
  tl.set(`${card} .rl-badge, ${card} .rl-seg, ${card} .rl-name, ${card} .rl-sub`, { opacity: 0 }, 0);
  tl.from("#d-guides > *", { drawSVG: "0%", duration: .8, stagger: .08, ease: "power2.inOut" }, t0 + .6);
  tl.fromTo(`${card} .rl-badge`, { opacity: 0, scale: 0, transformOrigin: "300px 300px" }, { opacity: 1, scale: 1, duration: .7, ease: "pop" }, t0 + 1.2);
  $$(`${card} .rl-seg`).forEach((s, i) => tl.fromTo(s, { opacity: 0, scale: 0, transformOrigin: "center center" }, { opacity: 1, scale: 1, duration: .5, ease: "pop" }, t0 + 1.55 + [2, 1, 3, 0, 4].indexOf(i) * .1));
  tl.fromTo([`${card} .rl-name`, `${card} .rl-sub`], { opacity: 0, y: 24, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: .7, stagger: .12 }, t0 + 2.2);
  tl.to("#d-guides", { opacity: 0, duration: .5 }, t0 + 2.6);
  words("#d-cap", t0 + 2.4, { st: .05 });
  // the tests: the card steps up, three versions pop in below
  tl.to(card, { scale: .52, y: -150, duration: .7, ease: "power3.inOut" }, t0 + 3.6);
  out("#d-h", t0 + 3.55);
  out("#d-cap", t0 + 3.5, .3);
  ["#tl1", "#tl2", "#tl3"].forEach((s, i) => tl.from(s, { opacity: 0, y: 80, scale: .7, duration: .6, ease: "pop" }, t0 + 4.0 + i * .14));
  ["#lb1", "#lb2", "#lb3"].forEach((s, i) => tl.from(s, { opacity: 0, y: 20, duration: .4 }, t0 + 4.35 + i * .14));
  tl.fromTo("#d-st", { scale: 2.6, opacity: 0, rotate: -24 }, { scale: 1, opacity: 1, rotate: -11, duration: .32, ease: "expo.out" }, t0 + 5.25);
  shake(t0 + 5.3, 16);
  tl.to(["#d-card", "#tl1", "#tl2", "#tl3", "#lb1", "#lb2", "#lb3", "#d-st"], { opacity: 0, scale: .85, filter: "blur(20px)", duration: .4, stagger: .02, ease: "power3.in" }, t0 + 6.85);
}

// ---------- outro ----------
function outro() {
  const t0 = 29.6, ms = 260 / 167;
  layer("out", t0, null, `
    <div class="abs big" id="o-1" style="left:60px;right:60px;top:560px;text-align:center;font-size:96px">AI is a tool,</div>
    <div class="abs big" id="o-2" style="left:60px;right:60px;top:670px;text-align:center;font-size:96px;color:${BLUE}">not a designer.</div>
    <svg class="abs" id="o-mark" style="left:0;top:0;width:1080px;height:1920px;overflow:visible" viewBox="0 0 1080 1920">
      <g transform="translate(540 1000) scale(${ms}) translate(-225.38 -500)">${PETALS.map((d, i) => `<path class="o-pt" d="${d}" fill="${i === 3 ? BLUE : "#f4f3ef"}"/>`).join("")}</g>
    </svg>
    <div class="abs" id="o-q" style="left:0;right:0;top:1180px;text-align:center;font:500 42px/1.2 var(--sans);color:var(--mute);letter-spacing:-.02em">Need a logo that actually works?</div>
    <div class="abs" id="o-cta" style="left:0;right:0;top:1270px;text-align:center"><span class="pill">Drafty Labs · link in bio</span></div>`);
  words("#o-1", t0 + .05, { st: .08 }); words("#o-2", t0 + .35, { st: .08 });
  const F = [[-420, 500, -120], [-420, -500, 110], [420, 500, 120], [420, -500, -100]];
  $$(".o-pt").forEach((p, i) => tl.fromTo(p, { x: F[i][0] / ms, y: F[i][1] / ms, rotate: F[i][2], scale: .2, opacity: 0, svgOrigin: "225.38 500" },
    { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, duration: .8, ease: "pop" }, t0 + 1.0 + i * .08));
  tl.from("#o-q", { opacity: 0, y: 30, filter: "blur(10px)", duration: .7 }, t0 + 1.8);
  tl.fromTo("#o-cta .pill", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .7, ease: "pop" }, t0 + 2.2);
  tl.to("#o-cta .pill", { scale: 1.05, duration: .5, ease: "sine.inOut", yoyo: true, repeat: 2 }, t0 + 2.9);
}

// ---------- ambient ----------
function ambient() {
  const o1 = $("#o1"), o2 = $("#o2");
  o1.style.setProperty("--c", BLUE); o2.style.setProperty("--c", "#8a3cff");
  hooks.push(t => {
    o1.style.left = 540 + 260 * Math.sin(t * .5) + "px"; o1.style.top = 560 + 160 * Math.cos(t * .4) + "px";
    o2.style.left = 560 + 280 * Math.cos(t * .35) + "px"; o2.style.top = 1450 + 150 * Math.sin(t * .5) + "px";
    // the light warms to red during the roasts and to green for the designer
    const c = t < 3.2 ? BLUE : t < 22.4 ? RED : t < 29.6 ? GREEN : BLUE;
    o1.style.setProperty("--c", c); o1.style.setProperty("--o", t < 3.2 ? .22 : .2); o2.style.setProperty("--o", .16);
  });
  const g = $("#grain"), cx = g.getContext("2d"), img = cx.createImageData(400, 400);
  hooks.push(t => {
    let s = Math.floor(t * 24) * 9301 + 49297;
    for (let i = 0; i < img.data.length; i += 4) { s = (s * 9301 + 49297) % 233280; const v = (s / 233280) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    cx.putImageData(img, 0, 0);
  });
}

(async () => {
  await Promise.all(['700 100px "Inter Display"', '800 100px "Inter Display"', '700 80px "Playfair"', '600 30px "Inter"'].map(f => document.fonts.load(f)));
  await document.fonts.ready;
  ambient(); hook(); header(); rounds(); designer(); outro();
  tl.set({}, {}, DURATION);
  window.seek = t => { tl.seek(t, true); hooks.forEach(h => h(t)); };
  Object.assign(window, { SFX: [], DURATION, FPS, INTRO: 0, SIZE: [W, H] });
  window.seek(0); window.ready = true;
  if (/render/.test(location.search)) return;
  const st = $("#stage"), fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); st.style.transform = `scale(${k})`; st.style.left = (innerWidth - W * k) / 2 + "px"; st.style.top = (innerHeight - H * k) / 2 + "px"; };
  fit(); addEventListener("resize", fit);
  let t = +(new URLSearchParams(location.search).get("t") || 0), playing = true, last = performance.now();
  const step = now => { if (playing) { t += (now - last) / 1000; if (t > DURATION) t = 0; window.seek(t); } last = now; requestAnimationFrame(step); };
  requestAnimationFrame(step);
  addEventListener("keydown", e => { if (e.code === "Space") playing = !playing; if (e.key === "ArrowRight") t += 1; if (e.key === "ArrowLeft") t = Math.max(0, t - 1); window.seek(t); });
})();
