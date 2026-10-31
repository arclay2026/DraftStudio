// The perfectionism social video (1080×1920, 60 fps). One glass "hero" shape in the middle never
// cuts: it morphs from an artboard into a loop, a file, a browser, a phone, a chat, a progress bar,
// two cards, an invoice, a timer, a paper plane, a button and finally the Draft Studio mark, while
// each real-life scene plays inside it. Captions run word by word with the voice.
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
// the Draft Studio mark (the four petals of the logo), scaled into the box
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
function frame() {
  const st = $("#scenes");
  st.innerHTML = `
    <div class="kick" id="kick">${["The problem", "Real life", "The truth", "The fix", ""].map((k, i) => `<div class="kicker" data-k="${i}" style="color:${i === 3 ? GREEN : "var(--blue)"};letter-spacing:.32em">${k}</div>`).join("")}</div>
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

// ---------- the scenes ----------
function hook() {
  const a = T("hook"), b = T("name");
  const S = { x: 0, n: 1 };
  L("s-hook", `
    <div class="mono dim" style="position:absolute;left:60px;top:116px;font-size:24px">Lumen — logo.ai</div>
    <i id="h-guide" style="position:absolute;left:429px;top:160px;width:2px;height:540px;background:repeating-linear-gradient(${RED} 0 10px,transparent 10px 18px)"></i>
    <div id="h-logo" style="position:absolute;left:0;right:0;top:330px;display:flex;align-items:center;justify-content:center;gap:26px">
      <svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="22" fill="${AMBER}"/>${Array.from({ length: 8 }, (_, k) => { const an = k * Math.PI / 4; return `<line x1="${48 + Math.cos(an) * 32}" y1="${48 + Math.sin(an) * 32}" x2="${48 + Math.cos(an) * 44}" y2="${48 + Math.sin(an) * 44}" stroke="${AMBER}" stroke-width="7" stroke-linecap="round"/>`; }).join("")}</svg>
      <span style="font:600 104px/1 var(--sans);letter-spacing:-.05em">lumen</span></div>
    <svg id="h-cursor" style="position:absolute;left:560px;top:420px" width="54" height="54" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.5-3.5 6.5z" fill="${CREAM}" stroke="#0b0b0d" stroke-width="1.2"/></svg>
    <div id="h-x" class="mono" style="position:absolute;right:80px;top:640px;padding:10px 18px;border-radius:12px;background:rgba(11,11,13,.6);font-size:28px"></div>
    <div id="h-n" style="position:absolute;right:60px;top:-10px;text-align:right;font:800 150px/1 var(--sans);letter-spacing:-.06em;color:${BLUE}"></div>`);
  span("s-hook", a - .2, b);
  const xEl = $("#h-x"), nEl = $("#h-n");
  hooks.push(t => {
    if (t < a - .3 || t > b + .1) return;
    xEl.textContent = `X  ${482 + Math.round(S.x / 12)}`;
    nEl.textContent = t >= T("count") - .1 ? `${Math.round(S.n)}×` : "";
    $("#h-guide").style.opacity = Math.abs(S.x) < 2 ? 1 : 0;
  });
  // two pixels left (shown big), two pixels back, then over and over
  tl.to(S, { x: -24, duration: .5, ease: "glide" }, a + 1.4);
  tl.to(S, { x: 0, duration: .5, ease: "glide" }, T("hook2") + .2);
  const reps = 9, dur = Math.max(1.6, b - T("count") - .9);
  for (let k = 0; k < reps; k++) tl.to(S, { x: k % 2 ? 0 : -24, duration: dur / reps, ease: "power1.inOut" }, T("count") + k * dur / reps);
  tl.fromTo(S, { n: 1 }, { n: 47, duration: dur, ease: "power2.in" }, T("count"));
  hooks.push(t => { if (t < a - .3 || t > b + .1) return; $("#h-logo").style.transform = `translateX(${S.x}px)`; $("#h-cursor").style.transform = `translateX(${S.x}px)`; });
  tl.fromTo("#h-n", { scale: .6, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: "pop" }, T("count"));
}

function nameScene() {
  const a = T("name"), b = T("s1");
  morph("ring", a);
  L("s-name", `
    <svg style="position:absolute;inset:0" viewBox="0 0 860 860"><g id="n-loop"><circle cx="430" cy="430" r="350" fill="none" stroke="${BLUE}" stroke-width="5" stroke-dasharray="1500 700" stroke-linecap="round"/><path d="M430 62l22 18-22 18" fill="none" stroke="${BLUE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-12 430 430)"/></g></svg>
    <div style="position:absolute;left:-60px;right:-60px;top:370px;text-align:center;font:700 112px/1 var(--sans);letter-spacing:-.055em">Perfectionism.</div>
    <div id="n-tags">${["Logos", "Websites", "Posters", "Apps", "Brands"].map((t, k) => `<div class="n-tag" style="position:absolute;left:430px;top:430px">${chip(t, "background:rgba(244,243,239,.1);border:1.5px solid rgba(244,243,239,.2);transform:translate(-50%,-50%)")}</div>`).join("")}</div>`);
  span("s-name", a, b);
  const tags = $$(".n-tag");
  hooks.push(t => {
    if (t < a - .3 || t > b + .1) return;
    $("#n-loop").setAttribute("transform", `rotate(${(t - a) * 90} 430 430)`);
    tags.forEach((g, k) => { const an = [-140, -90, -40, 60, 120][k] * Math.PI / 180, show = Math.min(1, Math.max(0, (t - T("common") - k * .12) / .4)), fl = Math.sin((t - a) * 1.6 + k) * 8;
      g.style.transform = `translate(${Math.cos(an) * 345 * show}px, ${Math.sin(an) * 345 * show + fl}px)`; g.style.opacity = show; });
  });
}

function fileScene() {
  const a = T("s1"), b = T("s2"), name = "logo_final_FINAL_v12.ai";
  morph("doc", a);
  L("s-ghost", Array.from({ length: 11 }, (_, k) => `<div class="g-doc glass" style="position:absolute;left:170px;top:90px;width:520px;height:680px;border-radius:6px;transform-origin:50% 120%"><div class="mono dim" style="position:absolute;left:24px;bottom:20px;font-size:20px">v${k + 1}</div></div>`).join(""), true);
  L("s-file", `
    <svg style="position:absolute;inset:0" viewBox="0 0 860 860"><path d="M600 90V180H690Z" fill="rgba(244,243,239,.22)"/></svg>
    <div style="position:absolute;left:0;right:0;top:250px;display:flex;justify-content:center"><div style="width:220px;height:220px;border-radius:44px;background:#ff9a00;display:grid;place-items:center;font:800 110px/1 var(--sans);color:#2b1300;letter-spacing:-.04em">Ai</div></div>
    <div id="f-name" class="mono" style="position:absolute;left:190px;right:190px;top:560px;text-align:center;font-size:30px;line-height:1.35;word-break:break-all"></div>`);
  span("s-file", a, b); span("s-ghost", T("file"), b);
  tl.fromTo($$(".g-doc"), { rotation: 0, opacity: 0 }, { rotation: (k) => -32 + k * 6.4, opacity: .55, duration: 1.1, stagger: .04, ease: "silk" }, T("file") + .1);
  const nm = $("#f-name");
  hooks.push(t => { if (t < a - .3 || t > b + .1) return; const n = Math.max(0, Math.min(name.length, Math.floor((t - T("file") - .2) * 16))); nm.innerHTML = name.slice(0, n) + (n < name.length && t > T("file") ? `<span style="color:${BLUE}">|</span>` : ""); });
}

function portfolio() {
  const a = T("s2"), b = T("s3"), M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  morph("browser", a);
  L("s-port", `
    <div style="position:absolute;left:80px;top:180px;display:flex;gap:12px"><i style="width:18px;height:18px;border-radius:50%;background:${RED}"></i><i style="width:18px;height:18px;border-radius:50%;background:${AMBER}"></i><i style="width:18px;height:18px;border-radius:50%;background:${GREEN}"></i></div>
    <div class="mono dim" style="position:absolute;left:0;right:0;top:174px;text-align:center;font-size:24px">yourname.design</div>
    <i style="position:absolute;left:40px;right:40px;top:226px;height:1.5px;background:rgba(244,243,239,.2)"></i>
    <div style="position:absolute;left:0;right:0;top:330px;text-align:center;font:700 96px/1 var(--sans);letter-spacing:-.05em">Coming soon</div>
    <div class="sub" style="position:absolute;left:0;right:0;top:450px;text-align:center;font-size:32px">My portfolio is launching soon.</div>
    <div id="p-up" style="position:absolute;left:0;right:0;top:560px;text-align:center"></div>`);
  span("s-port", a, b);
  const up = $("#p-up");
  hooks.push(t => {
    if (t < a - .3 || t > b + .1) return;
    const k = Math.floor((t - T("months")) / .22);
    up.innerHTML = t < T("months") ? "" : k < M.length ? chip(`Last updated: ${M[Math.max(0, k)]}`, "background:rgba(244,243,239,.1)") : chip("Last updated: 8 months ago", `background:rgba(255,107,107,.16);color:${RED}`);
  });
}

function feed() {
  const a = T("s3"), b = T("s4");
  morph("phone", a);
  const G = [["#ff6b6b", "#ffb84d"], ["#1f7aff", "#8c5cff"], ["#3ddc84", "#22c1ee"], ["#ff4fa3", "#8c5cff"], ["#ffd53d", "#ff6b1a"], ["#22c1ee", "#1f7aff"], ["#8c5cff", "#ff4fa3"], ["#3ddc84", "#ffd53d"]];
  L("s-feed", `
    <div style="position:absolute;left:236px;top:46px;width:388px;height:768px;border-radius:52px;overflow:hidden">
      <div id="fd-col" style="position:absolute;left:18px;right:18px;top:20px">${[...G, ...G].map(([c1, c2], k) => `<div style="height:300px;margin-bottom:18px;border-radius:26px;background:linear-gradient(${120 + k * 25}deg,${c1},${c2});position:relative"><i style="position:absolute;left:18px;bottom:18px;width:120px;height:14px;border-radius:7px;background:rgba(255,255,255,.7)"></i><i style="position:absolute;right:18px;bottom:14px;font:600 20px/1 var(--sans);color:#fff">♥ ${(k * 731) % 900 + 100}</i></div>`).join("")}</div>
      <div id="fd-mine" style="position:absolute;left:30px;right:30px;top:180px;height:380px;border-radius:26px;background:linear-gradient(160deg,#2a2a33,#3a3a48);border:2px solid rgba(244,243,239,.3);display:grid;place-items:center">
        <div style="text-align:center"><div style="font:700 44px/1 var(--sans)">My design</div><div class="dim" style="font-size:24px;margin-top:10px">draft_3.png</div></div></div>
      <div id="fd-trash" style="position:absolute;left:0;right:0;bottom:60px;text-align:center">${chip("🗑  Moved to trash", `background:rgba(255,107,107,.18);color:${RED}`)}</div>
    </div>`);
  span("s-feed", a, b);
  hooks.push(t => { if (t < a - .3 || t > b + .1) return; $("#fd-col").style.transform = `translateY(${-((t - a) * 260) % (8 * 318)}px)`; });
  gsap.set(["#fd-mine", "#fd-trash"], { autoAlpha: 0 });
  tl.fromTo("#fd-mine", { autoAlpha: 0, scale: .8 }, { autoAlpha: 1, scale: 1, duration: .5, ease: "pop" }, T("delete") - .3);
  tl.to("#fd-mine", { scale: .05, y: 330, autoAlpha: 0, duration: .7, ease: "power3.in" }, T("delete") + .6);
  tl.fromTo("#fd-trash", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5 }, T("delete") + 1.2);
}

function client() {
  const a = T("s4"), b = T("why");
  morph("bubble", a);
  const msg = (side, txt, time, cls) => `<div class="${cls}" style="display:flex;justify-content:${side === "l" ? "flex-start" : "flex-end"};margin-top:18px"><div style="max-width:470px;padding:18px 24px;border-radius:24px;font:500 30px/1.3 var(--sans);${side === "l" ? "background:rgba(244,243,239,.12)" : `background:${BLUE}`}">${txt}<div style="font-size:18px;opacity:.6;margin-top:6px">${time}</div></div></div>`;
  L("s-client", `
    <div style="position:absolute;left:110px;right:110px;top:200px">
      <div style="display:flex;align-items:center;gap:16px"><i style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,${AMBER},${RED});display:grid;place-items:center;font:700 26px/1 var(--sans);font-style:normal">M</i><div><div style="font:600 30px/1 var(--sans)">Maya · Client</div><div class="dim" style="font-size:20px;margin-top:6px">Lumen</div></div>
        <span id="c-late" style="margin-left:auto">${chip("3 days late", `background:rgba(255,107,107,.18);color:${RED}`)}</span></div>
      <div id="c-msgs" style="position:relative;height:300px;overflow:hidden;margin-top:6px"><div id="c-roll">
        ${msg("l", "Hi! Any update on the logo?", "Mon 9:14", "c-m")}${msg("l", "Hello? 👋", "Thu 16:02", "c-m")}
        ${msg("r", "Sorry! I fixed the kerning.", "Thu 16:05", "c-m")}${msg("l", "Looks the same to me?", "Thu 16:06", "c-m")}</div></div></div>`);
  span("s-client", a, b);
  const ms = $$(".c-m");
  gsap.set([...ms, "#c-late"], { autoAlpha: 0 });
  // the client's messages fit before the reply, however short the line is
  const g = Math.max(1.6, T("notice") - a);
  tl.fromTo(ms[0], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5 }, a + g * .12);
  tl.fromTo(ms[1], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5 }, a + g * .42);
  tl.fromTo("#c-late", { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .5, ease: "pop" }, a + g * .62);
  tl.to("#c-roll", { y: -250, duration: .6, ease: "glide" }, T("notice") - .1);
  tl.fromTo(ms[2], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5 }, T("notice"));
  tl.fromTo(ms[3], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .5 }, T("notice") + 1);
}

function truth() {
  const a = T("why"), b = T("nobody"), P = { p: 0 };
  morph("pill", a);
  L("s-truth", `
    <div class="dim" style="position:absolute;left:50px;top:300px;font:600 26px/1 var(--sans)">Design progress</div>
    <div id="t-pct" style="position:absolute;right:50px;top:286px;font:700 40px/1 var(--sans)"></div>
    <div style="position:absolute;left:58px;top:363px;width:744px;height:134px;border-radius:67px;overflow:hidden"><i id="t-fill" style="position:absolute;left:0;top:0;bottom:0;width:0;border-radius:67px;background:linear-gradient(90deg,${BLUE},#6aa8ff)"></i></div>
    <div id="t-rows" style="position:absolute;left:50px;right:50px;top:560px;display:grid;gap:18px">
      <div class="t-row" style="display:flex;justify-content:space-between;font:600 32px/1 var(--sans)"><span>The first 80%</span><span style="color:${GREEN}">1 day</span></div>
      <div class="t-row" style="display:flex;justify-content:space-between;font:600 32px/1 var(--sans)"><span>The last 20%</span><span style="color:${RED}">3 more days</span></div></div>`);
  span("s-truth", a, b);
  hooks.push(t => { if (t < a - .3 || t > b + .1) return; $("#t-fill").style.width = P.p + "%"; $("#t-pct").textContent = Math.round(P.p) + "%"; });
  tl.to(P, { p: 80, duration: .9, ease: "power2.out" }, T("last20"));
  tl.to(P, { p: 100, duration: Math.max(1.5, b - T("last20") - 1.4), ease: "none" }, T("last20") + 1);
  tl.from($$(".t-row"), { opacity: 0, x: -30, duration: .6, stagger: .5 }, T("last20") + .5);
}

function nobody() {
  const a = T("nobody"), b = T("pay");
  morph("two", a);
  const lg = `<div style="display:flex;align-items:center;gap:12px"><svg width="44" height="44" viewBox="0 0 96 96"><circle cx="48" cy="48" r="24" fill="${AMBER}"/></svg><span style="font:600 50px/1 var(--sans);letter-spacing:-.05em">lumen</span></div>`;
  L("s-nobody", `
    <div style="position:absolute;left:0;right:0;top:120px;text-align:center;font:700 52px/1 var(--sans);letter-spacing:-.03em">Spot the difference?</div>
    ${["v11", "v12"].map((v, k) => `<div style="position:absolute;left:${40 + k * 420}px;top:210px;width:360px;height:440px;display:grid;place-items:center"><div style="transform:translateX(${k ? 1 : 0}px)">${lg}</div><span class="mono dim" style="position:absolute;bottom:26px;font-size:24px">${v}</span></div>`).join("")}
    <div id="nb-ans" style="position:absolute;left:0;right:0;top:700px;text-align:center">${chip("2 px. Nobody will see it.", "background:rgba(244,243,239,.1)")}</div>`);
  span("s-nobody", a, b);
  tl.fromTo("#nb-ans", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5 }, a + 1.3);
}

function invoice() {
  const a = T("pay"), b = T("fix");
  morph("invoice", a);
  const row = (l, r, cls = "", st = "") => `<div class="${cls}" style="display:flex;justify-content:space-between;padding:20px 0;border-bottom:1.5px solid rgba(244,243,239,.14);font:500 28px/1.2 var(--sans);${st}"><span>${l}</span><span>${r}</span></div>`;
  L("s-inv", `
    <div style="position:absolute;left:230px;right:230px;top:150px">
      <div class="mono" style="font-size:24px;letter-spacing:.3em;color:var(--blue)">INVOICE</div>
      <div style="font:700 44px/1 var(--sans);margin:18px 0 26px;letter-spacing:-.03em">Lumen logo</div>
      ${row("Logo design", "✓")}${row("Brand colours", "✓")}${row("Moving pixels (47×)", "$0", "i-x", "color:rgba(244,243,239,.5);text-decoration:line-through")}</div>
    <div id="i-stamp" style="position:absolute;left:0;right:0;top:520px;display:flex;justify-content:center"><div style="padding:16px 46px;border:6px solid ${GREEN};border-radius:18px;color:${GREEN};font:800 76px/1 var(--sans);letter-spacing:.06em;transform:rotate(-10deg)">PAID</div></div>`);
  span("s-inv", a, b);
  tl.fromTo("#i-stamp", { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: .45, ease: "power4.in" }, T("finished") + .4);
}

function fixes() {
  const a = T("fix"), end = T("done"), R = { r: 1, p: 0 };
  // "So here's how to fix it."
  L("s-fixt", `<div style="position:absolute;left:-40px;right:-40px;top:330px;text-align:center;font:700 112px/1.02 var(--sans);letter-spacing:-.055em">How to<br><span style="color:${GREEN}">fix it.</span></div>`);
  morph("plate", a);
  span("s-fixt", a, T("f1"));
  const num = n => `<div style="position:absolute;left:0;right:0;top:40px;display:flex;justify-content:center"><div style="width:84px;height:84px;border-radius:50%;background:${GREEN};color:#06210f;display:grid;place-items:center;font:800 44px/1 var(--sans)">${n}</div></div>`;
  // 1: a time limit
  morph("ring", T("f1"));
  L("s-f1", `${num(1)}
    <svg style="position:absolute;inset:0" viewBox="0 0 860 860"><circle id="f1-ring" cx="430" cy="430" r="262" fill="none" stroke="${GREEN}" stroke-width="16" stroke-linecap="round" transform="rotate(-90 430 430)"/></svg>
    <div id="f1-time" style="position:absolute;left:0;right:0;top:360px;text-align:center;font:700 110px/1 var(--sans);letter-spacing:-.04em;font-variant-numeric:tabular-nums"></div>
    <div class="sub" style="position:absolute;left:0;right:0;top:490px;text-align:center;font-size:32px">Time limit</div>
    <div id="f1-v" style="position:absolute;left:0;right:0;top:790px;display:flex;justify-content:center;gap:16px">${["V1", "V2", "V3"].map((v, k) => chip(v + (k === 1 ? "  ✓ best" : ""), k === 1 ? `background:${GREEN};color:#06210f` : "background:rgba(244,243,239,.12)")).join("")}</div>`);
  span("s-f1", T("f1"), T("f2"));
  tl.fromTo("#f1-ring", { drawSVG: "100%" }, { drawSVG: "0%", duration: T("f2") - T("f1") - .6, ease: "none" }, T("f1") + .2);
  tl.fromTo(R, { r: 1 }, { r: 0, duration: T("f2") - T("f1") - .6, ease: "none" }, T("f1") + .2);
  hooks.push(t => { if (t < T("f1") - .3 || t > T("f2") + .1) return; const s = Math.round(R.r * 7200); $("#f1-time").textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; });
  tl.from($$("#f1-v > span"), { opacity: 0, y: 20, duration: .5, stagger: .15 }, T("f1b"));
  // 2: great, not perfect
  L("s-f2", `${num(2)}
    <svg style="position:absolute;inset:0" viewBox="0 0 860 860"><circle cx="430" cy="430" r="262" fill="none" stroke="rgba(244,243,239,.12)" stroke-width="16"/><circle id="f2-ring" cx="430" cy="430" r="262" fill="none" stroke="${BLUE}" stroke-width="16" stroke-linecap="round" transform="rotate(-90 430 430)"/></svg>
    <div id="f2-pct" style="position:absolute;left:0;right:0;top:350px;text-align:center;font:800 150px/1 var(--sans);letter-spacing:-.05em"></div>
    <div class="sub" style="position:absolute;left:0;right:0;top:510px;text-align:center;font-size:32px">Great, not perfect</div>`);
  span("s-f2", T("f2"), T("f2b"));
  tl.fromTo("#f2-ring", { drawSVG: "0%" }, { drawSVG: "80%", duration: 1.4, ease: "glide" }, T("f2") + .3);
  tl.fromTo(R, { p: 0 }, { p: 80, duration: 1.4, ease: "glide" }, T("f2") + .3);
  hooks.push(t => { if (t < T("f2") - .3 || t > T("f2b") + .1) return; $("#f2-pct").textContent = Math.round(R.p) + "%"; });
  morph("two", T("f2b"));
  L("s-f2b", `
    <div style="position:absolute;left:40px;top:210px;width:360px;height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;border-radius:30px;box-shadow:0 0 0 3px ${GREEN},0 0 60px rgba(61,220,132,.35)">
      <div style="font:800 90px/1 var(--sans)">80%</div>${chip("✓ Shipped", `background:${GREEN};color:#06210f`)}</div>
    <div style="position:absolute;left:460px;top:210px;width:360px;height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;opacity:.55">
      <div style="font:800 90px/1 var(--sans)">100%</div>${chip("🔒 Still on your screen", "background:rgba(244,243,239,.12)")}</div>`);
  span("s-f2b", T("f2b"), T("f3"));
  // 3: ship it, then improve it
  morph("plane", T("f3"));
  L("s-f3", `${num(3)}
    <div id="f3-v" style="position:absolute;left:0;right:0;top:780px;display:flex;justify-content:center;gap:14px;align-items:center">${chip("v1 · shipped", "background:rgba(244,243,239,.12)")}<span style="font:600 34px/1 var(--sans)">→</span>${chip("v2 · better", `background:${BLUE}`)}</div>`);
  span("s-f3", T("f3"), T("f4"));
  tl.to("#hsvg", { x: 60, y: -60, duration: .9, ease: "power2.inOut", yoyo: true, repeat: 1 }, T("f3") + .7);
  tl.from($$("#f3-v > *"), { opacity: 0, y: 20, duration: .5, stagger: .2 }, T("f3b"));
  // 4: compare with your past self
  morph("two", T("f4"));
  const bars = hs => `<div style="display:flex;align-items:flex-end;gap:12px;height:180px">${hs.map(h => `<i style="width:38px;height:${h}px;border-radius:8px;background:currentColor"></i>`).join("")}</div>`;
  L("s-f4", `${num(4)}
    <div style="position:absolute;left:40px;top:210px;width:360px;height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;color:rgba(244,243,239,.6)">${bars([50, 70, 60, 90])}<div style="font:600 32px/1 var(--sans);color:var(--cream)">You, last year</div></div>
    <div style="position:absolute;left:460px;top:210px;width:360px;height:440px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;color:${GREEN}">${bars([90, 120, 140, 175])}<div style="font:600 32px/1 var(--sans);color:var(--cream)">You, now ↑</div></div>
    <div id="f4-x" style="position:absolute;left:0;right:0;top:720px;text-align:center">${chip("✕  Not someone else’s best", `background:rgba(255,107,107,.16);color:${RED}`)}</div>`);
  span("s-f4", T("f4"), end);
  tl.fromTo("#f4-x", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5 }, T("f4b"));
}

function finale() {
  const a = T("done");
  morph("plate", a);
  L("s-done", `<div style="position:absolute;left:0;right:0;top:300px;text-align:center;font:700 92px/1.04 var(--sans);letter-spacing:-.05em">Done is better<br>than <span style="color:${BLUE}">perfect.</span></div>`);
  span("s-done", a, T("ship"));
  morph("button", T("ship") - .05, .6);
  tl.to("#heroB", { opacity: 1, duration: .6 }, T("ship") - .2);
  L("s-ship", `<div style="position:absolute;left:0;right:0;top:395px;text-align:center;font:700 62px/1 var(--sans);letter-spacing:-.03em">Ship it  →</div>`);
  span("s-ship", T("ship") - .1, T("follow") + .55);
  tl.to("#hsvg", { scale: .94, transformOrigin: "50% 50%", duration: .12, yoyo: true, repeat: 1, ease: "power2.inOut" }, T("ship") + .45);
  // the button becomes the Draft Studio mark
  // the button becomes the Draft Studio mark while "Follow Draft Studio" is said
  morph("logo", T("follow") + .55, 1.2);
  tl.to("#heroB", { opacity: 0, duration: .8 }, T("follow") + .35);
  tl.to("#hero", { opacity: .2, duration: .6 }, T("follow") + .7);
  L("s-logo", `<div style="position:absolute;left:150px;top:150px;width:560px;height:560px">${LOGO.replace(/viewBox="[^"]+"/, 'viewBox="160.66 428.57 142.85 142.86"').replace("<svg ", '<svg width="560" height="560" ')}</div>
    <div style="position:absolute;left:-40px;right:-40px;top:790px;text-align:center"><div style="font:700 64px/1 var(--sans);letter-spacing:-.04em">Follow Draft Studio</div><div class="sub" style="font-size:30px;margin-top:16px">Design lessons, made simple.</div></div>`);
  tl.fromTo("#s-logo", { autoAlpha: 0 }, { autoAlpha: 1, duration: .7 }, T("follow") + 1.05);
  kicker(4, a);
}

build({
  bare: true,
  scenes() {
    frame();
    gsap.set("#kick [data-k]", { autoAlpha: 0 });
    hook(); nameScene(); fileScene(); portfolio(); feed(); client(); truth(); nobody(); invoice(); fixes(); finale();
    kicker(0, T("hook")); kicker(1, T("s1")); kicker(2, T("why")); kicker(3, T("fix"));
    tl.fromTo("#hsvg", { scale: .85, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: .8, ease: "silk" }, 0);
    captions();
    light(0, "#1f7aff", "#8c5cff", "#ff6b6b", .3);
    light(T("s1"), "#ffb84d", "#1f7aff", "#ff4fa3", .26);
    light(T("why"), "#1f7aff", "#22c1ee", "#8c5cff", .26);
    light(T("fix"), "#3ddc84", "#1f7aff", "#22c1ee", .26);
    light(T("done"), "#1f7aff", "#8c5cff", "#0b0b0d", .32);
  }
});
