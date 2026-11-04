// The Layout lesson video: its own scenes and sound design. The engine (../shared/engine.js) does the
// logo intro, chapter cards, recap, outro and chrome; sfx() lays the sound effects (shared/sfx/*.wav).
const C = { blue: BLUE, cyan: "#22c1ee", violet: "#8c5cff", yellow: "#ffd53d", red: "#ff6b6b", green: "#3ddc84" };
const px = v => Math.round(v) + "px";
const box = (cls, x, y, w, h, extra = "") => `<i class="${cls}" style="left:${px(x)};top:${px(y)};width:${px(w)};height:${px(h)};${extra}"></i>`;
const tag = (id, text, color, x, y, extra = "") => `<div class="tag" id="${id}" style="left:${px(x)};top:${px(y)};background:${color};color:#0b0b0d;${extra}">${text}</div>`;
// a horizontal dimension line with arrow ends
const dimH = (id, x, y, w, color, label) => `<div class="abs" id="${id}" style="left:${px(x)};top:${px(y)};width:${px(w)}">
  <svg width="${w}" height="24" style="display:block;overflow:visible"><path d="M2 12H${w - 2}M10 4 2 12l8 8M${w - 10} 4l8 8-8 8" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
  ${label ? `<div class="meas" style="left:50%;top:34px;transform:translateX(-50%);color:${color}">${label}</div>` : ""}</div>`;
const dimV = (id, x, y, h, color, label, side = 1) => `<div class="abs" id="${id}" style="left:${px(x)};top:${px(y)};height:${px(h)}">
  <svg width="24" height="${h}" style="display:block;overflow:visible"><path d="M12 2V${h - 2}M4 10l8-8 8 8M4 ${h - 10}l8 8 8-8" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
  ${label ? `<div class="meas" style="${side > 0 ? "left:40px" : "right:40px"};top:50%;transform:translateY(-50%);color:${color}">${label}</div>` : ""}</div>`;
const check = (id, x, y, text) => `<div class="abs" id="${id}" style="left:${px(x)};top:${px(y)};display:flex;align-items:center;gap:16px;font:600 34px/1 var(--sans);letter-spacing:-.02em">
  <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="${C.green}"/><path class="ck" d="M14 25l7 7 13-15" fill="none" stroke="#0b0b0d" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${text}</div>`;
function checkIn(id, at, s = "success") {
  fadeIn(`#${id}`, at, { y: 20, s: .9, ease: "pop" });
  tl.fromTo(`#${id} .ck`, { drawSVG: "0%" }, { drawSVG: "100%", duration: .5, ease: "power2.out" }, at + .2);
  sfx(s, at + .15, .5);
}

// ---------- the opening: chaos settles into a calm layout ----------
// the website the chaos settles into (inside a frame at 860,200 1000×640), shared with the grid part
// (a three-column grid: columns at 60, 370 and 680, each 260 wide)
const SITE = [  // [class, x, y, w, h] relative to the frame
  ["bar h", 60, 50, 220, 30], ["bar", 680, 58, 70, 14], ["bar", 775, 58, 70, 14], ["bar", 870, 58, 70, 14],
  ["blk img", 60, 130, 570, 300], ["bar h", 680, 150, 260, 34], ["bar h", 680, 200, 200, 34], ["bar", 680, 270, 260, 14], ["bar", 680, 300, 235, 14], ["bar", 680, 330, 250, 14], ["btn", 680, 380, 170, 50],
  ["blk img2", 60, 470, 260, 120], ["blk img3", 370, 470, 260, 120], ["blk", 680, 470, 260, 120]];
function opening() {
  const a = T("title"), end = T("ch1");
  const FX = 860, FY = 200;
  const rnd = (k, s) => { const r = Math.sin(k * 91.7 + s * 13.3) * 43758.5; return r - Math.floor(r); };
  const TOOLS = [["01", "Grid", `<svg width="120" height="110" viewBox="0 0 120 110">${[0, 1, 2, 3].map(k => `<rect x="${6 + k * 28}" y="6" width="22" height="98" rx="5" fill="rgba(31,122,255,${k === 1 ? .9 : .35})"/>`).join("")}</svg>`],
    ["02", "Spacing scale", `<svg width="130" height="110" viewBox="0 0 130 110">${[8, 16, 24, 40, 56].map((h, k) => `<rect x="${4 + k * 25}" y="${104 - h * 1.7}" width="18" height="${h * 1.7}" rx="4" fill="${k === 2 ? BLUE : "rgba(244,243,239,.6)"}"/>`).join("")}</svg>`],
    ["03", "Alignment", `<svg width="130" height="110" viewBox="0 0 130 110"><path d="M10 4v102" stroke="${BLUE}" stroke-width="4"/><rect x="10" y="14" width="100" height="16" rx="6" fill="rgba(244,243,239,.8)"/><rect x="10" y="46" width="70" height="16" rx="6" fill="rgba(244,243,239,.5)"/><rect x="10" y="78" width="90" height="16" rx="6" fill="rgba(244,243,239,.5)"/></svg>`],
    ["04", "Proximity", `<svg width="130" height="110" viewBox="0 0 130 110">${[0, 1].map(g => [0, 1, 2].map(k => `<rect x="${4 + g * 70}" y="${10 + k * 22}" width="52" height="16" rx="5" fill="${g ? "rgba(244,243,239,.55)" : BLUE}"/>`).join("")).join("")}</svg>`],
    ["05", "White space", `<svg width="130" height="110" viewBox="0 0 130 110"><rect x="3" y="3" width="124" height="104" rx="12" fill="none" stroke="rgba(244,243,239,.4)" stroke-width="3" stroke-dasharray="7 7"/><circle cx="65" cy="55" r="14" fill="${BLUE}"/></svg>`]];
  const sc = scene("open", a - .2, end, `
    <div class="abs kicker" id="o-k" style="left:160px;top:250px">Design Basics — Lesson 03</div>
    <div class="abs" id="o-big" style="left:150px;top:300px;font:600 230px/1.05 var(--sans);letter-spacing:-.055em">Layout</div>
    <div class="abs sub" id="o-sub" style="left:160px;top:580px;width:620px">Where things go on the page.</div>
    <div class="abs frame" id="o-frame" style="left:${FX}px;top:${FY}px;width:1000px;height:640px"></div>
    <div class="abs" id="o-guides" style="left:${FX}px;top:${FY}px;width:1000px;height:640px">${[0, 1, 2].map(k => box("col", 60 + k * 310, 0, 260, 640, "opacity:.6")).join("")}</div>
    <div class="abs" id="o-site" style="left:${FX}px;top:${FY}px;width:1000px;height:640px">${SITE.map(([c, x, y, w, h]) => box(c + " o-el", x, y, w, h)).join("")}</div>
    ${check("o-ok", 1500, 880, "Calm & obvious")}
    <div class="abs h1" id="o-p1" style="left:160px;top:200px;width:1600px;font-size:100px">It doesn’t come from <span id="o-talent">talent.</span></div>
    <i id="o-strike" class="abs" style="left:1205px;top:252px;width:360px;height:7px;background:${C.red};transform-origin:0 50%"></i>
    <div class="abs h1" id="o-p2" style="left:160px;top:320px;width:1600px;font-size:100px">It comes from a few simple <span class="blue">tools.</span></div>
    ${TOOLS.map(([n, w, ic], k) => `<div class="card tool o-tool" style="left:${160 + k * 326}px"><div class="ic">${ic}</div><div class="num" style="margin-top:44px">${n}</div><div style="margin-top:14px;font:600 40px/1.08 var(--sans);letter-spacing:-.03em">${w}</div></div>`).join("")}`);
  const els = $$(".o-el", sc);
  // the strike-through sits exactly on "talent." (measured from the real type)
  { const st = $("#stage").getBoundingClientRect(), r = $("#o-talent").getBoundingClientRect();
    Object.assign($("#o-strike").style, { left: px(r.left - st.left - 4), width: px(r.width + 8), top: px(r.top - st.top + r.height * .56) }); }
  // the title rises, while the page's pieces tumble in, scattered and crooked
  textIn($("#o-k"), a);
  tl.from("#o-big", { yPercent: 40, opacity: 0, filter: "blur(18px)", duration: 1.4 }, a + .1);
  sfx("whoosh_low", a + .3, .55); sfx("thud", a + .45, .45);
  textIn($("#o-sub"), a + .8);
  els.forEach((e, k) => gsap.set(e, { x: (rnd(k, 1) - .5) * 520, y: (rnd(k, 2) - .5) * 360, rotation: (rnd(k, 3) - .5) * 50, scale: .7 + rnd(k, 4) * .5 }));
  tl.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5, stagger: .05 }, a + .4);
  [0, 3, 6, 9, 12].forEach((k, i) => sfx("pop_low", a + .45 + k * .05, .25, (i % 2 ? .4 : -.4)));
  gsap.set(["#o-frame", "#o-guides"], { autoAlpha: 0 });
  // drift a little while it is chaos
  hooks.push(t => { if (t < a || t > T("calm") + .1) return; const d = t - a; els.forEach((e, k) => { e.style.translate = `${Math.sin(d * .9 + k) * 10}px ${Math.cos(d * .7 + k * 2) * 10}px`; }); });
  hooks.push(t => { if (t > T("calm") + .1) els.forEach(e => (e.style.translate = "0px 0px")); });
  // calm: every piece glides home into a clean website
  const c = T("calm");
  tl.to(els, { x: 0, y: 0, rotation: 0, scale: 1, duration: 1.3, ease: "glide", stagger: .045 }, c - .1);
  tl.to("#o-frame", { autoAlpha: 1, duration: 1 }, c + .2);
  els.forEach((e, k) => { if (k % 3 === 0) sfx("snap", c + 1.05 + k * .045, .3, (k / els.length - .5)); });
  sfx("whoosh", c + .45, .5);
  // as if nothing could be anywhere else: the hidden grid shows for a moment
  const n = T("nothing");
  tl.to("#o-guides", { autoAlpha: 1, duration: .6 }, n);
  tl.from($$("#o-guides .col"), { scaleY: 0, transformOrigin: "50% 0", duration: .9, stagger: .07, ease: "glide" }, n);
  tl.to("#o-guides", { autoAlpha: 0, duration: 1 }, n + 2.2);
  checkIn("o-ok", n + .6);
  [0, 1, 2, 3].forEach(k => sfx("tick", n + .1 + k * .07, .3));
  // not talent…
  const p = T("promise");
  fadeOut(["#o-k", "#o-big", "#o-sub", "#o-frame", "#o-site", "#o-ok"], p - .45, { st: .03 });
  sfx("whoosh_soft", p - .2, .45);
  textIn($("#o-p1"), p, { st: .04 });
  gsap.set("#o-strike", { scaleX: 0 });
  tl.to("#o-strike", { scaleX: 1, duration: .55, ease: "power2.out" }, p + 1.6);
  tl.to("#o-talent", { opacity: .4, duration: .5 }, p + 1.6);
  sfx("slide", p + 1.7, .4);
  // …a few simple tools: five cards, one per part
  const tt = T("tools");
  textIn($("#o-p2"), tt, { st: .04 });
  fadeIn($$(".o-tool", sc), tt + .6, { y: 90, st: .1 });
  [0, 1, 2, 3, 4].forEach(k => sfx("pop", tt + .9 + k * .1, .35, (k - 2) * .3));
  // let's learn them: each card lights in turn
  $$(".o-tool", sc).forEach((cd, k) => tl.to(cd, { borderColor: "rgba(31,122,255,.9)", backgroundColor: "rgba(31,122,255,.12)", duration: .3, yoyo: true, repeat: 1 }, T("learn") + k * .14));
  sfx("shimmer", T("learn") + .2, .35);
  light(a, "#1f7aff", "#8c5cff", "#22c1ee", .26);
  light(p, "#ff6b6b", "#1f7aff", "#8c5cff", .2);
}

// ---------- part one: the grid ----------
function grid() {
  const a = T("grid"), end = T("ch2");
  const FX = 260, FY = 200, FW = 1400, FH = 680, M = 100, G = 24, N = 12, CW = (FW - 2 * M - (N - 1) * G) / N;
  const colX = k => M + k * (CW + G), span = (k, n) => n * CW + (n - 1) * G;
  // the content, snapped to columns: [class, first column, columns spanned, y, height]
  const CONTENT = [["bar h", 0, 3, 50, 30], ["bar", 8, 1, 58, 14], ["bar", 9, 1, 58, 14], ["bar", 10, 2, 58, 14],
    ["blk img", 0, 7, 120, 300], ["bar h", 7, 5, 140, 36], ["bar h", 7, 4, 192, 36], ["bar", 7, 5, 262, 14], ["bar", 7, 4, 292, 14], ["bar", 7, 5, 322, 14], ["btn", 7, 2, 370, 54],
    ["blk img2", 0, 4, 460, 170], ["blk img3", 4, 4, 460, 170], ["blk", 8, 4, 460, 170]];
  const sc = scene("grid", a - .2, end, `
    <div class="abs frame" id="g-frame" style="left:${FX}px;top:${FY}px;width:${FW}px;height:${FH}px">
      ${Array.from({ length: N }, (_, k) => box("col g-col", colX(k), 0, CW, FH)).join("")}
      <i class="abs g-mar" style="left:0;top:0;width:${M}px;height:${FH}px;background:rgba(255,213,61,.22)"></i>
      <i class="abs g-mar" style="left:${FW - M}px;top:0;width:${M}px;height:${FH}px;background:rgba(255,213,61,.22)"></i>
      ${Array.from({ length: N - 1 }, (_, k) => box("g-gut abs", colX(k) + CW, 0, G, FH, "background:rgba(34,193,238,.45)")).join("")}
      ${Array.from({ length: N }, (_, k) => `<div class="abs mono g-n" style="left:${px(colX(k))};width:${px(CW)};top:${FH / 2 - 30}px;text-align:center;font-size:44px;font-weight:600">${k + 1}</div>`).join("")}
      ${CONTENT.map(([c, k, n, y, h]) => box(c + " g-el", colX(k), y, span(k, n), h)).join("")}
    </div>
    ${dimH("g-dm1", FX, FY + FH + 26, M, C.yellow, "")}${dimH("g-dm2", FX + FW - M, FY + FH + 26, M, C.yellow, "")}
    ${tag("g-tm", "Margins", C.yellow, FX + M + 20, FY + FH + 20)}
    ${tag("g-tc", "Column", "#7fb0ff", FX + colX(5) - 20, FY - 64)}
    ${tag("g-tg", "Gutter", C.cyan, FX + colX(8) - 30, FY - 64)}
    ${tag("g-t12", "12 columns", BLUE, FX + FW - 230, FY - 64, "color:#fff")}
    ${check("g-ok", FX + FW - 300, FY + FH + 24, "Everything in order")}`);
  const cols = $$(".g-col", sc), els = $$(".g-el", sc);
  fadeIn("#g-frame", a - .2, { y: 30, s: .97 });
  sfx("whoosh_soft", a - .05, .4);
  gsap.set([...$$(".g-mar, .g-gut, .g-n", sc), "#g-dm1", "#g-dm2", "#g-tm", "#g-tc", "#g-tg", "#g-t12", "#g-ok"], { autoAlpha: 0 });
  // invisible columns drop in, one after another
  tl.from(cols, { scaleY: 0, transformOrigin: "50% 0", duration: 1, stagger: .06, ease: "glide" }, a + .2);
  cols.forEach((_, k) => k % 2 || sfx("tick", a + .45 + k * .06, .25, (k / N - .5) * 1.2));
  // margins
  const m = T("margins");
  tl.to($$(".g-mar", sc), { autoAlpha: 1, duration: .5 }, m);
  fadeIn(["#g-dm1", "#g-dm2"], m + .1, { y: 0, s: .6, ease: "pop" });
  fadeIn("#g-tm", m + .2, { y: 14 });
  sfx("blip", m + .1, .4); sfx("slide", m + .25, .3);
  tl.to($$(".g-mar", sc), { opacity: .25, duration: .6 }, T("columns"));
  // columns
  const c = T("columns");
  tl.to(cols, { backgroundColor: "rgba(31,122,255,.34)", duration: .4, stagger: .025 }, c);
  tl.to(cols[5], { backgroundColor: "rgba(31,122,255,.65)", duration: .4 }, c + .3);
  fadeIn("#g-tc", c + .3, { y: 14 }); sfx("blip", c + .3, .35);
  // gutters
  const g = T("gutters");
  tl.to(cols, { backgroundColor: "rgba(31,122,255,.16)", duration: .5 }, g);
  tl.to($$(".g-gut", sc), { autoAlpha: 1, duration: .4, stagger: .03 }, g);
  fadeIn("#g-tg", g + .3, { y: 14 }); sfx("blip_hi", g + .3, .35);
  // twelve columns, counted
  const tw = T("twelve");
  tl.to($$(".g-gut", sc), { autoAlpha: 0, duration: .5 }, tw - .2);
  $$(".g-n", sc).forEach((nEl, k) => { tl.fromTo(nEl, { autoAlpha: 0, y: 20, scale: .6 }, { autoAlpha: 1, y: 0, scale: 1, duration: .45, ease: "pop" }, tw + k * .08); sfx(k % 2 ? "blip_hi" : "blip", tw + .05 + k * .08, .22, (k / N - .5)); });
  fadeIn("#g-t12", tw + .9, { y: 14 });
  // everything snaps to them
  const s = T("snap");
  tl.to([...$$(".g-n", sc), "#g-tm", "#g-tc", "#g-tg", "#g-t12", "#g-dm1", "#g-dm2"], { autoAlpha: 0, duration: .4 }, s - .2);
  tl.to($$(".g-mar", sc), { opacity: 0, duration: .4 }, s - .2);
  els.forEach((e, k) => {
    const d = k * .07;
    tl.fromTo(e, { autoAlpha: 0, x: (k % 2 ? 1 : -1) * (60 + k * 6), y: -40 - (k % 3) * 30, rotation: (k % 2 ? 6 : -6) }, { autoAlpha: 1, x: 0, y: 0, rotation: 0, duration: .55, ease: "back.out(2)" }, s + d);
    if (k % 2 === 0) sfx("snap", s + d + .4, .32, (k / els.length - .5));
  });
  // order: the grid fades back, the page stands on its own
  const o = T("order");
  tl.to(cols, { backgroundColor: "rgba(31,122,255,.06)", borderColor: "rgba(31,122,255,.18)", duration: 1 }, o);
  checkIn("g-ok", o + .3);
  light(a, "#1f7aff", "#22c1ee", "#8c5cff", .24);
}

// ---------- part two: a spacing scale ----------
function spacing() {
  const a = T("random"), end = T("ch3");
  const X = 220, W = 600, Y0 = 220;
  const ITEMS = [["bar h", 320, 44], ["blk img", W, 210], ["bar", 540, 22], ["bar", 470, 22], ["btn", 220, 64]];
  const BAD = [13, 22, 9, 31], GOOD = [16, 24, 16, 32], K = 3;     // gaps, drawn 3× bigger to read on screen
  const stackY = gaps => { const ys = [Y0]; ITEMS.slice(0, -1).forEach(([, , h], i) => ys.push(ys[i] + h + gaps[i] * K)); return ys; };
  const yb = stackY(BAD), yg = stackY(GOOD);
  const SCALE = [4, 8, 16, 24, 32, 48, 64];
  const sc = scene("space", a - .2, end, `
    <div class="abs card" id="s-card" style="left:${X - 60}px;top:${Y0 - 60}px;width:${W + 120}px;height:${yg[4] + 64 - Y0 + 120}px"></div>
    ${ITEMS.map(([c, w, h], i) => box(c + " s-el", X, yb[i], w, h)).join("")}
    ${BAD.map((g, i) => `<div class="abs s-gap" style="left:${X + W + 20 - 80}px;top:${yb[i] + ITEMS[i][2]}px;height:${g * K}px">
      <i class="s-fill" style="position:absolute;left:${-W + 60}px;width:${W}px;top:0;bottom:0;background:rgba(255,107,107,.22)"></i>
      <div class="meas s-lab" style="left:${80}px;top:50%;transform:translateY(-50%);color:${C.red};font-size:30px">${g}px</div></div>`).join("")}
    <div class="abs kicker" id="s-k" style="left:1080px;top:230px">Spacing scale</div>
    <div class="abs" id="s-scale" style="left:1080px;top:290px;height:200px;display:flex;align-items:flex-end;gap:24px">
      ${SCALE.map(v => `<div class="s-step" style="display:flex;flex-direction:column;align-items:center;gap:16px"><i style="display:block;width:${v * 2 + 8}px;height:${v * 2 + 8}px;border-radius:${Math.min(18, v / 3 + 4)}px;background:${BLUE}"></i><span class="mono" style="font-size:32px;font-weight:600">${v}</span></div>`).join("")}
    </div>
    <div class="abs sub" id="s-note" style="left:1080px;top:540px;width:680px">Only these gaps. Nothing in between.</div>
    <div class="abs" id="s-pulse" style="left:1080px;top:680px;width:680px;height:120px">${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `<i class="s-beat" style="position:absolute;left:${k * 88}px;bottom:0;width:44px;height:${[40, 70, 40, 100, 40, 70, 40, 120][k]}px;border-radius:10px;background:rgba(244,243,239,.25)"></i>`).join("")}</div>`);
  const els = $$(".s-el", sc), gaps = $$(".s-gap", sc);
  fadeIn("#s-card", a - .2, { y: 30 });
  fadeIn(els, a, { y: 40, st: .08 });
  sfx("whoosh_soft", a, .4);
  gsap.set([...gaps, "#s-k", "#s-note", "#s-pulse"], { autoAlpha: 0 });
  // by eye: odd gaps, measured in red
  const p = T("px");
  gaps.forEach((g, i) => { tl.fromTo(g, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: .5, ease: "back.out(2)" }, p + i * .3); sfx("tick_low", p + .05 + i * .3, .35); });
  sfx("error", p + 1.4, .3);
  hooks.push(t => { const on = t > p && t < T("rhythm"); els.forEach((e, k) => { e.style.translate = on ? `${Math.sin(t * 7 + k * 2) * 2}px 0px` : "0px 0px"; }); });
  // the professional's short list, read out one by one
  const s = T("scale"), st = T("steps");
  textIn($("#s-k"), s);
  const steps = $$(".s-step", sc);
  steps.forEach((e, k) => { const at = st + k * .56; tl.fromTo(e, { autoAlpha: 0, y: 30, scale: .5 }, { autoAlpha: 1, y: 0, scale: 1, duration: .5, ease: "pop" }, at); sfx(k % 2 ? "blip_hi" : "blip", at + .05, .3 + k * .03, (k / 6 - .5)); });
  // only those gaps: the stack re-spaces itself on the scale, the labels turn green
  const r = T("rhythm");
  textIn($("#s-note"), r);
  els.forEach((e, i) => tl.to(e, { top: yg[i], duration: .8, ease: "glide" }, r + .2));
  gaps.forEach((g, i) => {
    tl.to(g, { top: yg[i] + ITEMS[i][2], height: GOOD[i] * K, duration: .8, ease: "glide" }, r + .2);
    tl.to($(".s-fill", g), { backgroundColor: "rgba(61,220,132,.22)", duration: .4 }, r + .5);
    tl.to($(".s-lab", g), { color: C.green, duration: .3 }, r + .5);
    tl.set($(".s-lab", g), { textContent: GOOD[i] + "px" }, r + .55);
    sfx("snap", r + .95 + i * .04, .3);
  });
  // a steady rhythm: a beat that pulses through the gaps
  const f = T("feel");
  fadeIn("#s-pulse", f - .2, { y: 20 });
  const beats = $$(".s-beat", sc);
  beats.forEach((b, k) => tl.to(b, { backgroundColor: BLUE, duration: .18, yoyo: true, repeat: 1 }, f + k * .22));
  beats.forEach((b, k) => k % 2 || sfx("tick", f + k * .22, .22));
  sfx("swell", f + .4, .3);
  light(a, "#ff6b6b", "#1f7aff", "#3ddc84", .2);
  light(r, "#3ddc84", "#1f7aff", "#22c1ee", .22);
}

// ---------- part three: alignment ----------
function alignment() {
  const a = T("ragged"), end = T("ch4");
  const X = 560, OFF = [0, 26, -18, 38, 12, -10];
  const ROWS = [["bar", 160, 18, 230], ["bar h", 640, 40, 290], ["bar h", 520, 40, 346], ["bar", 600, 16, 430], ["blk img", 600, 230, 476], ["btn", 220, 58, 740]];
  const sc = scene("align", a - .2, end, `
    ${ROWS.map(([c, w, h, y], i) => box(c + " a-el", X + OFF[i], y, w, h)).join("")}
    ${OFF.map((o, i) => `<i class="abs a-bad" style="left:${X + o - 1}px;top:${ROWS[i][3] - 26}px;width:3px;height:${ROWS[i][2] + 52}px;background:repeating-linear-gradient(${C.red} 0 8px, transparent 8px 14px)"></i>`).join("")}
    <i class="abs" id="a-edge" style="left:${X - 2}px;top:170px;width:4px;height:680px;background:${BLUE};box-shadow:0 0 24px rgba(31,122,255,.8);transform-origin:50% 0"></i>
    ${tag("a-q", "Almost aligned = a mistake", C.red, 1240, 330)}
    ${tag("a-one", "One shared edge", BLUE, 1240, 330, "color:#fff")}
    ${check("a-ok", 1240, 470, "Intentional")}`);
  const els = $$(".a-el", sc), bad = $$(".a-bad", sc);
  fadeIn(els, a - .1, { y: 40, st: .07 });
  sfx("whoosh_soft", a, .4);
  gsap.set([...bad, "#a-q", "#a-one", "#a-ok"], { autoAlpha: 0 });
  gsap.set("#a-edge", { scaleY: 0 });
  // it looks like a mistake: every edge is a little off
  const w = T("wrong");
  tl.to(bad, { autoAlpha: 1, duration: .25, stagger: .07 }, w);
  fadeIn("#a-q", w + .3, { y: 14 });
  sfx("error", w + .25, .35);
  tl.to(els, { x: "+=6", duration: .07, yoyo: true, repeat: 5, ease: "none" }, w + .3);
  // pick one edge, and line everything up along it
  const e = T("edge");
  tl.to(["#a-q"], { autoAlpha: 0, duration: .3 }, e);
  tl.to("#a-edge", { scaleY: 1, duration: .9, ease: "glide" }, e);
  sfx("slide", e + .3, .45);
  fadeIn("#a-one", e + .5, { y: 14 });
  const l = T("line");
  els.forEach((el, i) => { tl.to(el, { left: X, duration: .55, ease: "back.out(1.6)" }, l + i * .11); if (OFF[i]) sfx("snap", l + .35 + i * .11, .32); });
  tl.to(bad, { autoAlpha: 0, duration: .4, stagger: .05 }, l + .2);
  // clean
  const c = T("clean");
  tl.to("#a-edge", { boxShadow: "0 0 60px rgba(31,122,255,1)", duration: .4, yoyo: true, repeat: 1 }, c);
  checkIn("a-ok", c + .3);
  light(a, "#ff6b6b", "#8c5cff", "#1f7aff", .2);
  light(e, "#1f7aff", "#22c1ee", "#8c5cff", .24);
}

// ---------- part four: proximity ----------
function proximity() {
  const a = T("groups"), end = T("ch5");
  // three cards (image, title, text): first spaced evenly (ambiguous), then grouped
  const COLW = 380, IMG = 200, TT = 30, TX = 16;
  const even = { x0: 260, gx: 110, y: [230, 530, 640] };      // every gap the same
  const grp = { x0: 220, gx: 170, y: [250, 470, 520] };       // small gaps inside, big between
  const parts = [["blk img", IMG], ["bar h", TT], ["bar", TX]];
  const sc = scene("prox", a - .2, end, `
    ${[0, 1, 2].map(g => `<div class="abs card p-bg" style="left:${grp.x0 + g * (COLW + grp.gx) - 30}px;top:${grp.y[0] - 30}px;width:${COLW + 60}px;height:${grp.y[2] + TX - grp.y[0] + 60}px"></div>`).join("")}
    ${[0, 1, 2].map(g => parts.map(([c, h], i) => box(`${c} p-el p-g${g} p-i${i}`, even.x0 + g * (COLW + even.gx), even.y[i], i === 2 ? COLW * .8 : i === 1 ? COLW * .65 : COLW, h, i === 0 ? `background:${["linear-gradient(135deg,#1f7aff,#8c5cff)", "linear-gradient(135deg,#22c1ee,#1f7aff)", "linear-gradient(135deg,#ffd53d,#ff6b6b)"][g]}` : "")).join("")).join("")}
    ${dimV("p-small", grp.x0 - 76, grp.y[0] + IMG - 2, grp.y[1] - grp.y[0] - IMG + 4, C.cyan, "small", -1)}
    ${dimH("p-big", grp.x0 + COLW + 34, grp.y[0] + 80, grp.gx - 68, C.yellow, "big")}
    ${[0, 1, 2].map(g => `<div class="abs mono p-num" style="left:${grp.x0 + g * (COLW + grp.gx) + COLW / 2 - 30}px;top:${grp.y[2] + 90}px;width:60px;height:60px;border-radius:30px;background:${BLUE};display:grid;place-items:center;font-size:28px;font-weight:600">${g + 1}</div>`).join("")}`);
  const els = $$(".p-el", sc);
  fadeIn(els, a - .2, { y: 30, st: .03 });
  sfx("whoosh_soft", a, .4);
  gsap.set([...$$(".p-bg, .p-num", sc), "#p-small", "#p-big"], { autoAlpha: 0 });
  // things that belong together move together
  const g0 = a + 1.4;
  [0, 1, 2].forEach(g => parts.forEach((_, i) => tl.to($$(`.p-g${g}.p-i${i}`, sc), { left: grp.x0 + g * (COLW + grp.gx), top: grp.y[i], duration: 1.1, ease: "glide" }, g0 + g * .08)));
  tl.to($$(".p-bg", sc), { autoAlpha: 1, duration: .8, stagger: .1 }, g0 + .7);
  sfx("whoosh", g0 + .45, .4); [0, 1, 2].forEach(g => sfx("thud", g0 + 1.05 + g * .08, .3, (g - 1) * .5));
  // small gaps inside, big gaps between
  fadeIn("#p-small", T("small") + .1, { y: 0, s: .6, ease: "pop" }); sfx("blip", T("small") + .15, .35);
  fadeIn("#p-big", T("big") + .1, { y: 0, s: .6, ease: "pop" }); sfx("blip_hi", T("big") + .15, .35);
  // the structure reads before a single word: three groups count off
  const r = T("read");
  $$(".p-num", sc).forEach((n, k) => { tl.fromTo(n, { autoAlpha: 0, scale: .4 }, { autoAlpha: 1, scale: 1, duration: .5, ease: "pop" }, r + k * .25); sfx("pop", r + .1 + k * .25, .35, (k - 1) * .5); });
  $$(".p-bg", sc).forEach((b, k) => tl.to(b, { borderColor: "rgba(31,122,255,.8)", duration: .3, yoyo: true, repeat: 1 }, r + k * .25));
  light(a, "#22c1ee", "#1f7aff", "#ffd53d", .22);
}

// ---------- part five: white space ----------
function whiteSpace() {
  const a = T("crowded"), end = T("recap");
  const LOUD = [["SALE!", 120, 210, 150, C.red, -8], ["NEW", 1460, 230, 110, C.yellow, 6], ["50% OFF", 900, 260, 130, "#fff", -3], ["BUY NOW", 300, 760, 100, BLUE, 4],
    ["HOT", 1500, 700, 120, "#ff9f1a", -10], ["LIMITED", 760, 820, 76, C.green, 2], ["FREE", 1180, 520, 96, "#ff4fa3", 9], ["★★★★★", 180, 520, 70, C.yellow, -4],
    ["TODAY", 520, 420, 84, C.cyan, -6], ["!!!", 1650, 470, 130, C.red, 12], ["DEAL", 1100, 760, 92, C.violet, -7], ["WOW", 620, 200, 88, "#ff9f1a", 5]];
  const sc = scene("white", a - .2, end, `
    <div class="abs" id="w-loud">${LOUD.map(([t, x, y, s, c, r]) => `<div class="shout w-l" style="left:${x}px;top:${y}px;font-size:${s}px;color:${c};transform:rotate(${r}deg)">${t}</div>`).join("")}
      ${[[240, 360, 180], [1300, 330, 140], [820, 560, 220], [1520, 860, 120], [420, 640, 110]].map(([x, y, s], k) => `<i class="abs w-l" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;border-radius:${k % 2 ? "50%" : "24px"};background:${[C.violet, C.cyan, "#ff4fa3", C.yellow, C.green][k]};opacity:.7"></i>`).join("")}</div>
    <div class="abs h1" id="w-t" style="left:0;right:0;top:470px;text-align:center">White space isn’t <span class="blue">empty.</span></div>
    <div class="abs" id="w-prod" style="left:560px;top:190px;width:800px;height:700px;border-radius:40px;background:#f4f3ef;color:#0b0b0d;overflow:hidden">
      <div class="abs" id="w-pad" style="left:90px;top:90px;right:90px;bottom:90px;border:2.5px dashed rgba(31,122,255,.55);border-radius:20px"></div>
      <div class="abs mono" style="left:0;right:0;top:150px;text-align:center;font-size:20px;letter-spacing:.4em;color:#8a8a8f">NEW · COLLECTION</div>
      <i class="abs" id="w-orb" style="left:310px;top:230px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle at 35% 30%, #fff, #c9c7c0 55%, #8f8d86)"></i>
      <div class="abs" style="left:0;right:0;top:460px;text-align:center;font:600 64px/1 var(--sans);letter-spacing:-.04em">Calm.</div>
      <div class="abs" style="left:0;right:0;top:545px;text-align:center;font-size:24px;color:#6b6b72">Less, but better.</div>
    </div>
    ${dimV("w-d1", 948, 192, 86, BLUE, "space", 1)}${dimH("w-d2", 562, 528, 86, BLUE, "")}
    ${tag("w-prem", "Premium = calm & confident", BLUE, 1380, 760, "color:#fff")}`);
  const loud = $$(".w-l", sc);
  // every space filled: it slams in, piece by piece
  loud.forEach((l, k) => { tl.fromTo(l, { autoAlpha: 0, scale: 1.8 }, { autoAlpha: 1, scale: 1, duration: .35, ease: "back.out(2.5)" }, a + k * .09); if (k % 2 === 0) sfx("pop_low", a + .12 + k * .09, .28, (k % 4 - 1.5) / 2); });
  sfx("thud", a + .1, .4);
  // everything shouts…
  const s = T("shout");
  hooks.push(t => { const on = t > s && t < T("nobody") + .4, amp = on ? 6 : 0; loud.forEach((l, k) => { l.style.translate = `${Math.sin(t * 31 + k * 3) * amp}px ${Math.cos(t * 27 + k) * amp}px`; }); });
  [0, 1, 2, 3, 4, 5].forEach(k => sfx(k % 2 ? "pop" : "pop_low", s + k * .12, .3, (k % 3 - 1) * .6));
  // …and nobody listens
  const n = T("nobody");
  tl.to("#w-loud", { opacity: .18, filter: "grayscale(1) blur(2px)", duration: .9 }, n);
  sfx("whoosh_low", n + .2, .4);
  // white space isn't empty
  const sp = T("space");
  tl.to("#w-loud", { autoAlpha: 0, scale: 1.08, duration: .6, ease: "power2.in" }, sp - .3);
  textIn($("#w-t"), sp, { st: .05 });
  sfx("whoosh_soft", sp, .35);
  // room to breathe: a calm product card, its padding drawn
  const b = T("breathe");
  textOut($("#w-t"), b - .3);
  gsap.set(["#w-prod", "#w-d1", "#w-d2", "#w-prem"], { autoAlpha: 0 });
  tl.fromTo("#w-prod", { autoAlpha: 0, scale: .9, y: 40 }, { autoAlpha: 1, scale: 1, y: 0, duration: 1.3 }, b);
  tl.fromTo("#w-pad", { scale: .55, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "glide" }, b + .5);
  fadeIn(["#w-d1", "#w-d2"], b + 1.2, { y: 0, s: .6, ease: "pop" });
  sfx("swell", b + .6, .4); sfx("blip", b + 1.25, .3);
  tl.fromTo("#w-orb", { y: 12 }, { y: -12, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: 3 }, b + .4);
  // premium brands feel calm and confident
  const p = T("premium");
  fadeIn("#w-prem", p + .3, { y: 14 });
  sfx("shimmer", p + .35, .45);
  light(a, "#ff6b6b", "#ffd53d", "#ff4fa3", .26);
  light(sp, "#1f7aff", "#0b1430", "#8c5cff", .2);
}

// ---------- the new name: Drafty Labs, formerly Draft Studio ----------
function rename() {
  const a = T("rename"), f = T("formerly"), w = T("why"), n = T("next");
  // the look-alikes: one per cell of a 6 × 4 grid, the middle left clear for the logo
  const CROWD = [];
  [180, 480, 780, 1140, 1440, 1740].forEach((x, i) => [200, 410, 640, 870].forEach((y, j) => {
    if (x > 600 && x < 1320 && y > 300 && y < 760) return;
    const k = i * 4 + j, jit = v => (Math.sin(k * 12.9 + v) * 43758.5 % 1) * 50;
    CROWD.push([x + jit(1), y + jit(2), 22 + (k % 4) * 7, (k % 5 - 2) * 4]);
  }));
  scene("rename", a - .2, n + .4, `
    ${CROWD.map(([x, y, sz, r]) => `<div class="abs r-c" style="left:${px(x)};top:${px(y)};transform:translate(-50%,-50%) rotate(${r}deg);font:600 ${sz}px/1 var(--sans);color:rgba(244,243,239,.35);white-space:nowrap">Draft Studio</div>`).join("")}
    <div class="abs kicker" id="r-k" style="left:0;right:0;top:250px;text-align:center;letter-spacing:.5em">A new name</div>
    <div class="abs" id="r-logo" style="left:620px;top:310px;width:680px">${LOGO.replace("<svg ", '<svg width="680" ')}</div>
    <div class="abs sub" id="r-was" style="left:0;right:0;top:540px;text-align:center">formerly known as</div>
    <div class="abs" id="r-old" style="left:0;right:0;top:590px;text-align:center"><span style="position:relative;display:inline-block;font:600 64px/1 var(--sans);letter-spacing:-.04em;color:rgba(244,243,239,.6)">Draft Studio<i id="r-strike" style="position:absolute;left:-8px;right:-8px;top:52%;height:6px;border-radius:3px;background:${C.red};transform-origin:0 50%"></i></span></div>
    <div class="abs" id="r-ours" style="left:0;right:0;top:600px;display:flex;justify-content:center">${check("r-ok", 0, 0, "A name that’s truly ours").replace('class="abs" id="r-ok" style="left:0px;top:0px;', 'id="r-ok" style="position:relative;')}</div>`);
  // "That's layout" makes way
  tl.to(["#z-mask", "#z-try"], { autoAlpha: 0, y: -40, duration: .6, ease: "power2.in" }, a - .5);
  sfx("whoosh", a - .2, .45);
  textIn($("#r-k"), a);
  tl.fromTo("#r-logo", { autoAlpha: 0, scale: .8, filter: "blur(16px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "silk" }, a + .1);
  sfx("impact", a + .3, .45); sfx("shimmer", a + .35, .5);
  // formerly Draft Studio: the old name, crossed out
  textIn($("#r-was"), f);
  fadeIn("#r-old", f + .2, { y: 20 });
  gsap.set("#r-strike", { scaleX: 0 });
  tl.to("#r-strike", { scaleX: 1, duration: .5, ease: "power2.out" }, f + 1.1);
  sfx("slide", f + 1.2, .4);
  // too many Draft Studios out there: they crowd in, then fade, leaving the one that's ours
  const crowd = $$(".r-c");
  crowd.forEach((c, k) => tl.fromTo(c, { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .4, ease: "back.out(2)" }, w + k * .045));
  [0, 4, 8, 12, 16].forEach(k => sfx("pop_low", w + .1 + k * .045, .22, (k / 20 - .5) * 1.4));
  tl.to(crowd, { autoAlpha: 0, scale: .8, filter: "blur(8px)", duration: .8, stagger: .02 }, w + 2.4);
  tl.to(["#r-was", "#r-old"], { autoAlpha: 0, y: -20, duration: .5 }, w + 2.4);
  sfx("whoosh_low", w + 2.6, .4);
  gsap.set("#r-ok", { autoAlpha: 0 });
  checkIn("r-ok", w + 3);
  tl.to("#r-logo", { scale: 1.06, duration: .5, yoyo: true, repeat: 1, ease: "sine.inOut" }, w + 3);
  light(a, "#1f7aff", "#8c5cff", "#22c1ee", .3);
}

const ICONS = [
  `<svg width="64" height="64" viewBox="0 0 64 64">${[0, 1, 2, 3].map(k => `<rect x="${4 + k * 15}" y="4" width="11" height="56" rx="3" fill="rgba(31,122,255,${k === 1 ? .95 : .4})"/>`).join("")}</svg>`,
  `<svg width="64" height="64" viewBox="0 0 64 64">${[8, 16, 28, 40, 56].map((h, k) => `<rect x="${2 + k * 12.6}" y="${60 - h}" width="9" height="${h}" rx="3" fill="${k === 2 ? BLUE : CREAM}"/>`).join("")}</svg>`,
  `<svg width="64" height="64" viewBox="0 0 64 64"><path d="M8 4v56" stroke="${BLUE}" stroke-width="4"/><rect x="8" y="10" width="48" height="10" rx="4" fill="${CREAM}"/><rect x="8" y="28" width="34" height="10" rx="4" fill="${CREAM}" opacity=".6"/><rect x="8" y="46" width="42" height="10" rx="4" fill="${CREAM}" opacity=".6"/></svg>`,
  `<svg width="64" height="64" viewBox="0 0 64 64">${[0, 1].map(g => [0, 1, 2].map(k => `<rect x="${2 + g * 34}" y="${12 + k * 15}" width="26" height="10" rx="3" fill="${g ? CREAM : BLUE}"/>`).join("")).join("")}</svg>`,
  `<svg width="64" height="64" viewBox="0 0 64 64"><rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="${CREAM}" stroke-width="3" stroke-dasharray="6 6" opacity=".6"/><circle cx="32" cy="32" r="8" fill="${BLUE}"/></svg>`];

build({
  num: "03", name: "Layout", next: "Hierarchy",
  chapters: ["The grid", "A spacing scale", "Alignment", "Proximity", "White space"],
  scenes() {
    opening();
    chapterCard(1, "one", "The grid", T("ch1"), T("grid"));
    grid();
    chapterCard(2, "two", "A spacing scale", T("ch2"), T("random"));
    spacing();
    chapterCard(3, "three", "Alignment", T("ch3"), T("ragged"));
    alignment();
    chapterCard(4, "four", "Proximity", T("ch4"), T("groups"));
    proximity();
    chapterCard(5, "five", "White space", T("ch5"), T("crowded"));
    whiteSpace();
  },
  recap: {
    kicker: "Layout, in five rules",
    lines: ["Use a grid, with margins and gutters.", "Choose every gap from a spacing scale.", "Line things up along one shared edge.", "Small gaps inside groups, big gaps between.", "Let white space do its work."],
    icons: ICONS, light: ["#1f7aff", "#22c1ee", "#8c5cff"]
  },
  outro: { title: "That’s layout.", size: 220, tryit: 'Now try it yourself in <span class="blue">Canvas.</span>' },
  after: rename
});
