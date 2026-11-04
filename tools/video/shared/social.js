// Shared by the vertical social videos (1080×1920): the glass "hero" shape that morphs between
// scenes, its shapes, the section label at the top, scene layers, and word-by-word captions.
// Everything stays inside the area TikTok, Reels and Shorts leave clear (top 240 px, bottom 420 px).
gsap.registerPlugin(MorphSVGPlugin);
const RED = "#ff6b6b", GREEN = "#3ddc84", AMBER = "#ffb84d";

// ---------- shapes for the hero, in an 860 × 860 box ----------
const rr = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
const crect = (w, h, r, cy = 430) => rr(430 - w / 2, cy - h / 2, w, h, r);
const circ = (r, cy = 430) => `M${430 - r} ${cy}A${r} ${r} 0 1 1 ${430 + r} ${cy}A${r} ${r} 0 1 1 ${430 - r} ${cy}Z`;
const SHAPES = {
  artboard: crect(740, 540, 36),
  ring: circ(300),
  doc: "M170 90H600L690 180V770H170Z",
  browser: crect(780, 560, 28),
  phone: crect(420, 800, 64),
  bubble: "M110 170H750A50 50 0 0 1 800 220V600A50 50 0 0 1 750 650H200L120 730L135 650H110A50 50 0 0 1 60 600V220A50 50 0 0 1 110 170Z",
  pill: crect(760, 150, 68),        // radii a touch under half the height: a zero-length edge makes the morph glitch
  two: rr(40, 210, 360, 440, 30) + rr(460, 210, 360, 440, 30),
  invoice: "M180 90H680V770L637 740L594 770L551 740L508 770L465 740L422 770L379 740L336 770L293 740L250 770L207 740L180 760Z",
  plane: "M120 470L770 170L590 720L440 560L360 690L350 520Z",
  plate: crect(820, 420, 40),
  button: crect(560, 170, 78)
};
// the Drafty Labs mark (the four petals of the logo), scaled into the box
SHAPES.logo = (() => {
  const s = 560 / 144, ox = 232.09, oy = 500;
  const petals = [...LOGO.matchAll(/<path fill="[^"]+" d="([^"]+)"/g)].slice(0, 4).map(m => m[1]);
  const tx = (cmd, nums) => {
    const abs = cmd === cmd.toUpperCase(), up = cmd.toUpperCase();
    return nums.map((v, i) => {
      if (up === "H") return abs ? (v - ox) * s + 430 : v * s;
      if (up === "V") return abs ? (v - oy) * s + 430 : v * s;
      return abs ? (i % 2 ? (v - oy) * s + 430 : (v - ox) * s + 430) : v * s;
    }).map(v => +v.toFixed(2));
  };
  return petals.map(d => [...d.matchAll(/([MmHhVvCcQqLlZz])([^MmHhVvCcQqLlZz]*)/g)].map(([, c, n]) => c + tx(c, (n.match(/-?\d*\.?\d+/g) || []).map(Number)).join(" ")).join("")).join("");
})();

// ---------- the frame: kicker, hero, scene layers, captions ----------
// kicks: the section labels at the top, as [label, colour]; the last one is usually "" (none)
function frame(kicks) {
  const st = $("#scenes");
  st.innerHTML = `
    <div class="kick" id="kick">${kicks.map(([k, c], i) => `<div class="kicker" data-k="${i}" style="color:${c || "var(--blue)"};letter-spacing:.32em">${k}</div>`).join("")}</div>
    <div id="hbox">
      <div id="under"></div>
      <svg id="hsvg" viewBox="0 0 860 860" width="860" height="860" style="overflow:visible;filter:drop-shadow(0 40px 80px rgba(0,0,0,.45))">
        <defs><linearGradient id="glassG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f3ef" stop-opacity=".16"/><stop offset="1" stop-color="#f4f3ef" stop-opacity=".04"/></linearGradient></defs>
        <path id="hero" d="${SHAPES.artboard}" fill="url(#glassG)" stroke="rgba(244,243,239,.26)" stroke-width="2"/>
        <path id="heroB" d="${SHAPES.artboard}" fill="${BLUE}" opacity="0"/>
      </svg>
      <div id="layers"></div>
    </div>
    <div id="cap"></div>`;
}
const L = (id, html, under) => { const d = document.createElement("div"); d.className = "ov"; d.id = id; d.innerHTML = html; $(under ? "#under" : "#layers").append(d); return d; };
// a scene's layer fades in at a and out before b
function span(id, a, b) {
  tl.fromTo("#" + id, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .7, ease: "silk" }, a + .2);
  if (b != null) tl.to("#" + id, { autoAlpha: 0, y: -20, duration: .4, ease: "power2.in" }, b - .4);
}
const morph = (shape, at, dur = 1) => tl.to(["#hero", "#heroB"], { morphSVG: SHAPES[shape], duration: dur, ease: "glide" }, at - .45);
function kicker(k, at) {
  tl.to("#kick [data-k]", { autoAlpha: 0, y: -14, duration: .35, ease: "power2.in" }, at - .4);
  tl.fromTo(`#kick [data-k="${k}"]`, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .6 }, at);
}
const chip = (txt, style = "") => `<span style="display:inline-block;padding:12px 22px;border-radius:999px;font:600 28px/1 var(--sans);${style}">${txt}</span>`;

// ---------- captions: a few words at a time, the spoken word in blue ----------
function captions() {
  const chunks = [];
  let cur = [];
  WORDS.forEach((w, i) => {
    cur.push(i);
    const len = cur.reduce((n, j) => n + WORDS[j].w.length + 1, 0);
    if (/[.?!:]["”]?$/.test(w.w) || cur.length >= 4 || len > 20) { chunks.push(cur); cur = []; }
  });
  if (cur.length) chunks.push(cur);
  const cap = $("#cap"), clean = w => w.replace(/^["“]|["”]$/g, "");
  let shown = -1;
  hooks.push(t => {
    let c = -1;
    for (let k = 0; k < chunks.length; k++) if (WORDS[chunks[k][0]].t <= t + .02) c = k;
    const last = chunks[chunks.length - 1], end = WORDS[last[last.length - 1]].t + 1.2;
    if (c < 0 || t > end || t > T("follow") - .2) { cap.innerHTML = ""; shown = -1; return; }
    if (c !== shown) { cap.innerHTML = chunks[c].map(i => `<span>${clean(WORDS[i].w)}</span>`).join(""); shown = c; }
    const spans = cap.children, a = WORDS[chunks[c][0]].t, p = Math.min(1, (t - a) / .18);
    cap.style.opacity = p; cap.style.transform = `translateY(${(1 - p) * 18}px) scale(${.96 + .04 * p})`;
    chunks[c].forEach((i, j) => { spans[j].style.color = WORDS[i].t <= t + .02 && (i + 1 >= WORDS.length || WORDS[i + 1].t > t + .02) ? BLUE : WORDS[i].t <= t ? CREAM : "rgba(244,243,239,.38)"; });
  });
}
