// The AI-designs social video (1080×1920, 60 fps): everyday moments where AI images promise what a
// business can't deliver, and what it costs them. The AI ads and the real photos sit in glass frames
// cut to each photo's exact shape; the hero morphs between them, then through a review, a file, a
// banner, a shirt and an invoice into the Draft Studio mark. The hero, shapes, captions and frame are in ../shared/social.js.
Object.assign(SHAPES, {
  review: crect(760, 440, 36),
  banner: crect(820, 320, 22),
  shirt: "M250 160L350 120Q430 170 510 120L610 160L740 270L670 360L610 320V760H250V320L190 360L120 270Z"
});
const PINK = "#ff8fb1", CYAN = "#22c1ee";
const center = (html, top, extra = "") => `<div style="position:absolute;left:0;right:0;top:${top}px;display:flex;justify-content:center;${extra}">${html}</div>`;
const pixelLogo = (cell) => { let s = ""; for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const d = Math.hypot(x - 5.5, y - 5.5); if (d < 5.6 && !(d < 2.6 && x > 4)) s += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${d < 3.6 ? BLUE : "#8c5cff"}"/>`; } return `<svg width="${cell * 12}" height="${cell * 12}" viewBox="0 0 ${cell * 12} ${cell * 12}" shape-rendering="crispEdges">${s}</svg>`; };

// ---------- photo frames: every glass frame takes its photo's exact shape ----------
// the photos in images/ and their sizes: "ad" ones are AI-generated, "real" ones show what people got
const PH = { "ad-sofa": [1774, 887], "real-sofa2": [1774, 887], "ad-burger": [1312, 1199], "real-burger": [1254, 1254],
  "ad-pool": [1448, 1086], "real-carpark": [1672, 941], "ad-sign": [1448, 1086], "ad-hand": [1312, 1199], "real-coffee": [1086, 1448] };
const PR = 30;   // corner radius of every photo frame
function phRect(k, cy = 430, mw = 800, mh = 760) {
  const [w, h] = PH[k], s = Math.min(mw / w, mh / h), W = Math.round(w * s), H = Math.round(h * s);
  return { w: W, h: H, x: Math.round(430 - W / 2), y: Math.round(cy - H / 2) };
}
const phShape = (...a) => { const r = phRect(...a); return rr(r.x, r.y, r.w, r.h, PR); };
// a frame exactly over the hero, holding stacked layers
const phFrame = (id, r, layers, extra = "") => `<div id="${id}" style="position:absolute;left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px;border-radius:${PR}px;overflow:hidden;${extra}">${layers}</div>`;
const phImg = (k, fit = "cover", extra = "") => `<img src="images/${k}.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:${fit};${extra}">`;
const phTag = (t, c) => `<span style="position:absolute;left:18px;top:18px;padding:10px 16px;border-radius:999px;background:${c || "rgba(11,11,13,.72)"};border:1.5px solid rgba(244,243,239,.25);font:700 19px/1 var(--sans);letter-spacing:.16em;color:#fff">${t}</span>`;
const morphTo = (d, at, dur = .9) => tl.to(["#hero", "#heroB"], { morphSVG: d, duration: dur, ease: "glide" }, at - .45);
// editing: a slow push-in on photos, a camera flash on reveals, a punch on the jokes
const kenBurns = (sel, a, b, to = 1.07) => tl.fromTo(sel, { scale: 1 }, { scale: to, duration: Math.max(.5, b - a), ease: "none" }, a);
// (immediateRender off: otherwise the flash's starting value would show from the first frame)
const flash = at => tl.fromTo("#fx-flash", { autoAlpha: .7 }, { autoAlpha: 0, duration: .45, ease: "power2.out", immediateRender: false }, at);
const punch = (at, k = 1.05) => tl.fromTo("#hbox", { scale: 1 }, { scale: k, duration: .12, yoyo: true, repeat: 1, ease: "power2.out", transformOrigin: "50% 50%" }, at);

// ---------- the scenes ----------
function shop() {
  const a = T("hook"), b = T("name"), r = phRect("ad-sofa", 360);
  const back = (c1, c2) => `<i style="position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 30%, ${c1}, ${c2})"></i><i style="position:absolute;left:12%;right:12%;bottom:9%;height:9%;border-radius:50%;background:rgba(0,0,0,.28);filter:blur(14px)"></i>`;
  L("s-shop", `
    ${phFrame("sh-frame", r, `
      <div class="sh-ad" style="position:absolute;inset:0">${back("#fbf4ea", "#d8cbbb")}${phImg("ad-sofa", "contain")}${phTag("AI AD", BLUE)}</div>
      <div id="sh-real" style="position:absolute;inset:0;clip-path:inset(0 100% 0 0)">${back("#8e8a84", "#5e5b57")}${phImg("real-sofa2", "contain", "filter:saturate(.75) brightness(.92)")}${phTag("REALITY", RED)}</div>
      <i id="sh-handle" style="position:absolute;top:0;bottom:0;left:0;width:4px;margin-left:-2px;background:#fff;box-shadow:0 0 20px rgba(255,255,255,.8);opacity:0"></i>`)}
    <div id="sh-buy" style="position:absolute;left:${r.x}px;right:${r.x}px;top:${r.y + r.h + 36}px">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font:700 50px/1 var(--sans);letter-spacing:-.03em">Emerald Velvet Sofa</div><div style="font:600 28px/1 var(--sans);color:${AMBER}">★ 4.9</div></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:24px"><div style="font:700 44px/1 var(--sans)">$1,299</div><div style="padding:20px 40px;border-radius:999px;background:${BLUE};font:600 28px/1 var(--sans)">Add to cart</div></div></div>
    <div id="sh-got" style="position:absolute;left:0;right:0;top:${r.y + r.h + 50}px;display:flex;justify-content:center">${chip("📦  Delivered. Hmm.", "background:rgba(244,243,239,.12);font-size:32px;padding:16px 28px")}</div>`);
  span("s-shop", a - .3, b);
  tl.fromTo("#sh-frame", { scale: .9 }, { scale: 1, duration: .8, ease: "silk" }, a - .1);
  gsap.set("#sh-got", { autoAlpha: 0 });
  // the slider wipes the ad away to show what came
  const w = hook2Wipe();
  function hook2Wipe() {
    const at = T("hook2") - .15;
    tl.set("#sh-handle", { opacity: 1 }, at);
    tl.fromTo("#sh-real", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: .7, ease: "glide" }, at);
    tl.fromTo("#sh-handle", { left: "0%" }, { left: "100%", duration: .7, ease: "glide" }, at);
    tl.set("#sh-handle", { opacity: 0 }, at + .72);
    return at;
  }
  tl.to("#sh-buy", { autoAlpha: 0, y: -16, duration: .35 }, w);
  tl.fromTo("#sh-got", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5, ease: "pop" }, w + .5);
  punch(w + .7, 1.04);
  tl.fromTo("#hsvg", { scale: .85, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: .7, ease: "silk" }, 0);
}

function ageOf() {
  const a = T("name"), b = T("menu");
  morph("ring", a);
  L("s-age", `
    ${center(`<svg width="150" height="150" viewBox="0 0 24 24"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" fill="url(#ag)"/><defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8c5cff"/><stop offset="1" stop-color="${CYAN}"/></linearGradient></defs></svg>`, 200)}
    ${center(`<div style="text-align:center;font:700 88px/1.04 var(--sans);letter-spacing:-.05em">The age of<br><span style="background:linear-gradient(90deg,#8c5cff,${CYAN});-webkit-background-clip:text;background-clip:text;color:transparent">AI designs.</span></div>`, 390)}`);
  span("s-age", a, b);
  hooks.push(t => { if (t < a - .3 || t > b + .1) return; const s = $("#s-age svg"); if (s) s.style.transform = `rotate(${(t - a) * 40}deg) scale(${1 + .06 * Math.sin((t - a) * 4)})`; });
}

function menu() {
  const a = T("menu"), b = T("hotel"), rA = phRect("ad-burger", 410, 800, 700), rB = phRect("real-burger", 410, 800, 700);
  morphTo(phShape("ad-burger", 410, 800, 700), a);
  L("s-menu", `${phFrame("mn-ad", rA, `<img class="mn-kb" src="images/ad-burger.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">${phTag("AI AD", BLUE)}`)}
    <div id="m-tags"><div style="position:absolute;left:${rA.x + 40}px;top:${rA.y + rA.h * .66}px">${chip("melted cheese", "background:#ffd23d;color:#3a2a00;font-size:30px")}</div><div style="position:absolute;right:${rA.x + 30}px;top:${rA.y + rA.h * .28}px">${chip("fresh lettuce", "background:#5fcf5a;color:#06210f;font-size:30px")}</div></div>`);
  span("s-menu", a, T("menu3"));
  kenBurns(".mn-kb", a, T("menu3"));
  gsap.set("#m-tags > div", { autoAlpha: 0 });
  tl.fromTo("#m-tags > div", { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .5, stagger: .45, ease: "pop" }, T("menu2") + .15);
  // what arrived
  morphTo(phShape("real-burger", 410, 800, 700), T("menu3"), .5);
  L("s-menu2", `${phFrame("mn-real", rB, `<img class="mn-kb2" src="images/real-burger.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">${phTag("WHAT ARRIVED", RED)}`)}`);
  tl.fromTo("#s-menu2", { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, T("menu3") - .05);
  tl.to("#s-menu2", { autoAlpha: 0, y: -20, duration: .4, ease: "power2.in" }, b - .4);
  flash(T("menu3") - .05); punch(T("menu3") + .1);
  kenBurns(".mn-kb2", T("menu3"), b, 1.05);
}

function hotel() {
  const a = T("hotel"), b = T("off"), rP = phRect("ad-pool", 390, 800, 600), rC = phRect("real-carpark", 390, 800, 600);
  morphTo(phShape("ad-pool", 390, 800, 600), a);
  const rowTop = Math.max(rP.y + rP.h, rC.y + rC.h) + 34;
  L("s-hotel", `
    ${phFrame("ht-pool", rP, `<img class="ht-kb" src="images/ad-pool.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">${phTag("AI AD", BLUE)}`)}
    ${phFrame("ht-car", rC, `<img class="ht-kb2" src="images/real-carpark.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">${phTag("REAL VIEW", RED)}`)}
    <div style="position:absolute;left:${rP.x}px;right:${rP.x}px;top:${rowTop}px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font:700 44px/1 var(--sans);letter-spacing:-.03em">Sea View Resort</div><div style="font:600 28px/1 var(--sans);color:${AMBER};margin-top:12px">★★★★★</div></div>
      <div id="h-tag"></div></div>
    <div id="h-never" style="position:absolute;left:0;right:0;top:${rC.y + rC.h / 2 - 50}px;display:flex;justify-content:center"><div style="padding:16px 38px;border:7px solid ${RED};border-radius:18px;color:${RED};font:800 68px/1 var(--sans);letter-spacing:.04em;transform:rotate(-8deg);background:rgba(11,11,13,.6)">NEVER EXISTED</div></div>`);
  span("s-hotel", a, b);
  kenBurns(".ht-kb", a, T("carpark"));
  gsap.set(["#ht-car", "#h-never"], { autoAlpha: 0 });
  const tag = $("#h-tag");
  hooks.push(t => { if (t < a - .3 || t > b + .1) return;
    tag.innerHTML = t < T("view") ? chip("Infinity pool", `background:${CYAN};color:#002230;font-size:28px`) : t < T("real") ? chip("Ocean view", `background:${BLUE};font-size:28px`) : t < T("pool") ? chip("The real view", "background:rgba(244,243,239,.14);font-size:28px") : chip("Pool?", `background:rgba(255,107,107,.18);color:${RED};font-size:28px`); });
  // the frame reshapes to the real photo
  const at = T("carpark") - .15;
  morphTo(phShape("real-carpark", 390, 800, 600), at + .2, .5);
  tl.to("#ht-pool", { autoAlpha: 0, duration: .2 }, at);
  tl.fromTo("#ht-car", { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, at);
  flash(at); punch(at + .15);
  kenBurns(".ht-kb2", at, b, 1.05);
  tl.fromTo("#h-never", { autoAlpha: 0, scale: 2.4 }, { autoAlpha: 1, scale: 1, duration: .35, ease: "power4.in" }, T("nopool") + .15);
  punch(T("nopool") + .5, 1.06);
}

function signs() {
  const a = T("off"), b = T("cost"), rS = phRect("ad-sign", 400, 800, 640), rH = phRect("ad-hand", 400, 800, 640);
  morphTo(phShape("ad-sign", 400, 800, 640), a);
  const LZ = 2.4, LR = 140;   // magnifier zoom and radius
  L("s-sign", `
    ${phFrame("sg-frame", rS, `<img src="images/ad-sign.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">${phTag("AI AD", BLUE)}`)}
    <div id="sg-lens" style="position:absolute;left:0;top:0;width:${LR * 2}px;height:${LR * 2}px;margin:-${LR}px 0 0 -${LR}px;border-radius:50%;border:8px solid ${CREAM};box-shadow:0 24px 60px rgba(0,0,0,.6);
      background:url(images/ad-sign.png) no-repeat;background-size:${rS.w * LZ}px ${rS.h * LZ}px"><i style="position:absolute;right:-64px;bottom:-64px;width:26px;height:96px;border-radius:13px;background:${CREAM};transform:rotate(-45deg)"></i></div>
    <div id="sg-q" style="position:absolute;left:0;right:0;top:${rS.y + rS.h + 30}px;display:flex;justify-content:center">${chip("“COFEE”? ☕", `background:${AMBER};color:#2a1a00;font-size:34px;padding:16px 28px`)}</div>`);
  span("s-sign", a, T("hands"));
  // the lens slides along the sign and settles on the misspelling
  const L0 = { x: .2 };
  gsap.set(["#sg-lens", "#sg-q"], { autoAlpha: 0 });
  tl.fromTo("#sg-lens", { autoAlpha: 0, scale: .4 }, { autoAlpha: 1, scale: 1, duration: .45, ease: "pop" }, T("text") + .1);
  tl.fromTo(L0, { x: .2 }, { x: .76, duration: 1.5, ease: "glide" }, T("text") + .4);
  tl.fromTo("#sg-q", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .45, ease: "pop" }, T("text") + 1.8);
  const lens = $("#sg-lens"), SY = .175;
  hooks.push(t => { if (t < a - .3 || t > T("hands") + .1) return;
    const cx = rS.x + L0.x * rS.w, cy = rS.y + SY * rS.h;
    lens.style.left = cx + "px"; lens.style.top = cy + "px";
    lens.style.backgroundPosition = `${-(L0.x * rS.w * LZ - LR)}px ${-(SY * rS.h * LZ - LR)}px`; });
  // six fingers: a zoom into the hand, and the fingers counted
  morphTo(phShape("ad-hand", 400, 800, 640), T("hands"), .5);
  const Z = 1.6, OX = .6, OY = .5;   // zoom, and its centre on the hand (fractions of the photo)
  const TIPS = [[.392, .401], [.537, .401], [.654, .401], [.75, .409], [.812, .431], [.716, .582]];
  const at = (f, len, o) => o + (f * len - o) * Z;
  L("s-hand", `
    ${phFrame("hd-frame", rH, `<img id="hd-img" src="images/ad-hand.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:${OX * 100}% ${OY * 100}%">${phTag("AI AD", BLUE)}
      ${TIPS.map(([fx, fy], k) => `<span class="hd-n" style="position:absolute;left:${at(fx, rH.w, OX * rH.w)}px;top:${at(fy, rH.h, OY * rH.h)}px;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:50%;background:${k === 5 ? RED : CREAM};color:${k === 5 ? "#fff" : "#111"};display:grid;place-items:center;font:800 32px/1 var(--sans);box-shadow:0 8px 20px rgba(0,0,0,.45)">${k + 1}</span>`).join("")}`)}
    <div id="hd-q" style="position:absolute;left:0;right:0;top:${rH.y + rH.h + 30}px;display:flex;justify-content:center">${chip("6 fingers?! 🫠", `background:${RED};color:#fff;font-size:34px;padding:16px 28px`)}</div>
    <div id="hd-off" style="position:absolute;left:0;right:0;top:${rH.y + rH.h + 30}px;display:flex;justify-content:center"><div style="font:700 50px/1 var(--sans);letter-spacing:-.03em">Something feels off.</div></div>`);
  tl.fromTo("#s-hand", { autoAlpha: 0 }, { autoAlpha: 1, duration: .15 }, T("hands") - .05);
  tl.to("#s-hand", { autoAlpha: 0, y: -20, duration: .4, ease: "power2.in" }, b - .4);
  flash(T("hands") - .05);
  gsap.set([".hd-n", "#hd-q", "#hd-off"], { autoAlpha: 0 });
  tl.fromTo("#hd-img", { scale: 1 }, { scale: Z, duration: .6, ease: "glide" }, T("hands") + .15);
  tl.fromTo(".hd-n", { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: 1, duration: .3, stagger: .17, ease: "pop" }, T("hands") + .7);
  tl.fromTo("#hd-q", { autoAlpha: 0, scale: .7 }, { autoAlpha: 1, scale: 1, duration: .35, ease: "pop" }, T("hands") + 1.75);
  punch(T("hands") + 1.75, 1.06);
  tl.to("#hd-q", { autoAlpha: 0, duration: .25 }, T("feel") - .1);
  tl.fromTo("#hd-off", { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 }, T("feel"));
  // the uneasy feeling: a jittery colour-split glitch on the photo
  hooks.push(t => { const f = $("#hd-frame"); if (!f) return;
    if (t < T("feel") - .05 || t > b + .1) { f.style.filter = ""; f.style.transform = ""; return; }
    const k = Math.floor(t * 20), j = ((k * 9301 + 49297) % 233280) / 233280;
    f.style.transform = j > .7 ? `translate(${(j - .85) * 30}px, ${(j - .8) * 12}px)` : "";
    f.style.filter = j > .7 ? `hue-rotate(${(j - .7) * 300}deg) saturate(1.6)` : ""; });
  hooks.push(t => { const n = $("#hd-off"); if (!n || t < T("feel") - .05 || t > b + .1) return; const k = Math.sin((t - T("feel")) * 30) * 3;
    n.style.textShadow = `${k}px 0 rgba(255,60,90,.6), ${-k}px 0 rgba(60,200,255,.6)`; });
}

function cost() {
  const a = T("cost"), b = T("cheap");
  L("s-cust", `${center(`<div style="font:700 60px/1.05 var(--sans);text-align:center;letter-spacing:-.04em">The real<br>problem.</div>`, 250)}
    <div id="cu-row" style="position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center;gap:24px">${["#ffb84d", "#ff8fb1", "#22c1ee", "#3ddc84", "#8c5cff"].map(c => `<div class="cu" style="width:110px;height:110px;border-radius:50%;background:${c};display:grid;place-items:center;font-size:52px">🙂</div>`).join("")}</div>
    ${center(`<div id="cu-lab" style="font:600 30px/1 var(--sans);color:${RED}">Fooled customers don’t come back</div>`, 578)}`);
  morph("plate", a);
  span("s-cust", a, T("review"));
  const cus = $$(".cu");
  gsap.set("#cu-lab", { autoAlpha: 0 });
  tl.from(cus, { scale: 0, duration: .5, stagger: .08, ease: "pop" }, a + .4);
  [1, 2, 4].forEach((k, j) => { tl.to(cus[k], { x: 260, autoAlpha: 0, duration: .7, ease: "power2.in" }, T("back") + .5 + j * .2); });
  hooks.push(t => { if (t < a - .3 || t > T("review") + .1) return; cus.forEach((c, k) => { c.textContent = t > T("back") + .2 && [1, 2, 4].includes(k) ? "😒" : "🙂"; }); });
  tl.fromTo("#cu-lab", { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, T("back") + .8);
  // one star: "nothing like the pictures"
  morph("review", T("review"));
  L("s-rev", `
    <div style="position:absolute;left:110px;right:110px;top:250px">
      <div style="display:flex;align-items:center;gap:18px"><i style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,#ff8fb1,#8c5cff);display:grid;place-items:center;font:700 30px/1 var(--sans);font-style:normal">J</i>
        <div><div style="font:600 32px/1 var(--sans)">Jamie R.</div><div class="dim" style="font-size:22px;margin-top:6px">Verified customer · today</div></div></div>
      <div id="rv-stars" style="margin-top:30px;font-size:58px;letter-spacing:.08em"><span style="color:${AMBER}">★</span><span style="color:rgba(244,243,239,.2)">★★★★</span></div>
      <div style="margin-top:20px;font:600 44px/1.15 var(--sans);letter-spacing:-.02em">“Nothing like the pictures.”</div></div>`);
  span("s-rev", T("review"), T("doubt"));
  // now every photo gets doubted
  const rC = phRect("real-coffee", 420, 800, 720);
  morphTo(phShape("real-coffee", 420, 800, 720), T("doubt"));
  const dt = (t, x, y) => `<div class="db" style="position:absolute;left:${x}px;top:${y}px">${chip(t, "background:rgba(11,11,13,.78);border:1.5px solid rgba(244,243,239,.28);font-size:30px")}</div>`;
  L("s-doubt", `
    ${phFrame("db-frame", rC, `<img class="db-kb" src="images/real-coffee.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`)}
    ${dt("Is this AI? 🤔", rC.x - 50, rC.y + 70)}${dt("Looks fake", rC.x + rC.w - 170, rC.y + 260)}${dt("AI again?", rC.x - 30, rC.y + rC.h - 230)}
    <div id="db-real" style="position:absolute;left:0;right:0;top:${rC.y + rC.h + 24}px;display:flex;justify-content:center">${chip("Even real photos get doubted", `background:${GREEN};color:#06210f;font-size:28px`)}</div>`);
  kenBurns(".db-kb", T("doubt"), b, 1.06);
  span("s-doubt", T("doubt"), b);
  gsap.set([".db", "#db-real"], { autoAlpha: 0 });
  tl.fromTo(".db", { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .45, stagger: .35, ease: "pop" }, T("doubt") + .5);
  tl.fromTo("#db-real", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5 }, T("real2"));
}

function logoFile() {
  const a = T("cheap"), b = T("tool");
  morph("doc", a);
  L("s-file", `
    ${center(pixelLogo(18), 200)}
    ${center(`<div class="mono" style="font-size:28px">logo.png</div>`, 470)}
    ${center(chip("512 × 512 · AI · Free", "background:rgba(244,243,239,.12)"), 530)}`);
  span("s-file", a, T("printer"));
  morph("banner", T("printer"));
  L("s-print", `
    <div style="position:absolute;left:30px;right:30px;top:270px;height:320px;display:flex;align-items:center;justify-content:center;gap:30px;overflow:hidden">${pixelLogo(24)}<div style="font:800 80px/1 var(--sans);letter-spacing:-.04em;filter:blur(2.5px)">GRAND OPENING</div></div>
    ${center(chip("⚠  File too small to print", `background:rgba(255,184,77,.18);color:${AMBER}`), 650)}`);
  span("s-print", T("printer"), T("shirt"));
  morph("shirt", T("shirt"));
  L("s-shirt", `${center(`<div style="filter:blur(5px);opacity:.9">${pixelLogo(10)}</div>`, 320)}${center(chip("Blurry 😬", `background:rgba(255,107,107,.18);color:${RED}`), 800)}`);
  span("s-shirt", T("shirt"), T("redo"));
  morph("invoice", T("redo"));
  L("s-redo", `
    <div style="position:absolute;left:230px;right:230px;top:150px">
      <div class="mono" style="font-size:24px;letter-spacing:.3em;color:var(--blue)">INVOICE</div>
      <div style="font:700 44px/1 var(--sans);margin:18px 0 26px;letter-spacing:-.03em">Logo redesign</div>
      ${["Vector logo", "Print-ready files", "Brand colours"].map(l => `<div style="display:flex;justify-content:space-between;padding:20px 0;border-bottom:1.5px solid rgba(244,243,239,.14);font:500 28px/1.2 var(--sans)"><span>${l}</span><span>✓</span></div>`).join("")}</div>
    ${center(`<div id="rd-cheap" style="font:700 40px/1.15 var(--sans);text-align:center;letter-spacing:-.02em">Cheap now.<br><span style="color:${RED}">Expensive later.</span></div>`, 560)}`);
  span("s-redo", T("redo"), b);
  tl.fromTo("#rd-cheap", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .6 }, T("redo") + 1.2);
}

function truth() {
  const a = T("tool");
  morph("ring", a);
  L("s-tool", `${center(`<svg width="130" height="130" viewBox="0 0 24 24"><path d="M12 2l2.2 6.6L21 11l-6.8 2.4L12 20l-2.2-6.6L3 11l6.8-2.4z" fill="${CYAN}"/></svg>`, 210)}
    ${center(`<div style="text-align:center;font:700 80px/1.05 var(--sans);letter-spacing:-.05em">AI is a<br>great tool.</div>`, 390)}`);
  span("s-tool", a, T("truth"));
  morph("plate", T("truth"));
  L("s-truth", `${center(`<div style="text-align:center;font:700 76px/1.06 var(--sans);letter-spacing:-.05em">Your customers<br>deserve <span style="color:${GREEN}">the truth.</span></div>`, 330)}
    <div id="tr-list" style="position:absolute;left:0;right:0;top:700px;display:flex;justify-content:center;gap:14px">${["Real products", "Real photos", "Real design"].map(t => chip("✓ " + t, `background:${GREEN};color:#06210f`)).join("")}</div>`);
  span("s-truth", T("truth"), T("follow") + .5);
  const items = $$("#tr-list > span");
  ["r1", "r2", "r3"].forEach((c, k) => tl.fromTo(items[k], { autoAlpha: 0, y: 20, scale: .8 }, { autoAlpha: 1, y: 0, scale: 1, duration: .45, ease: "pop" }, T(c)));
  // the plate becomes the Draft Studio mark
  morph("logo", T("follow") + .5, 1.2);
  tl.to("#hero", { opacity: .2, duration: .6 }, T("follow") + .7);
  L("s-logo", `<div style="position:absolute;left:150px;top:150px;width:560px;height:560px">${LOGO.replace(/viewBox="[^"]+"/, 'viewBox="160.66 428.57 142.85 142.86"').replace("<svg ", '<svg width="560" height="560" ')}</div>
    <div style="position:absolute;left:-40px;right:-40px;top:790px;text-align:center"><div style="font:700 64px/1 var(--sans);letter-spacing:-.04em">Follow Draft Studio</div><div class="sub" style="font-size:30px;margin-top:16px">Real design, made simple.</div>
    <div id="lg-next" style="margin-top:30px;display:flex;justify-content:center">${chip("Part 2 · Spot the AI logo 👀", `background:${BLUE};font-size:28px`)}</div></div>`);
  tl.fromTo("#s-logo", { autoAlpha: 0 }, { autoAlpha: 1, duration: .7 }, T("follow") + 1);
  tl.fromTo("#lg-next", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .5, ease: "pop" }, T("follow") + 1.7);
}

build({
  bare: true,
  scenes() {
    frame([["Real life"], ["The signs", AMBER], ["The cost", RED], ["The truth", GREEN], [""]]);
    gsap.set("#kick [data-k]", { autoAlpha: 0 });
    const d0 = phShape("ad-sofa", 360);
    gsap.set(["#hero", "#heroB"], { attr: { d: d0 } });
    $("#scenes").insertAdjacentHTML("beforeend", `<i id="fx-flash" style="position:absolute;inset:0;background:#fff;visibility:hidden;opacity:0;pointer-events:none"></i>`);
    shop(); ageOf(); menu(); hotel(); signs(); cost(); logoFile(); truth();
    kicker(0, T("hook")); kicker(1, T("off")); kicker(2, T("cost")); kicker(3, T("tool")); kicker(4, T("follow"));
    captions();
    light(0, "#ff8fb1", "#1f7aff", "#8c5cff", .3);
    light(T("menu"), "#ffb84d", "#ff6b6b", "#1f7aff", .26);
    light(T("hotel"), "#22c1ee", "#ff8a5a", "#6a4cff", .26);
    light(T("off"), "#ffb84d", "#8c5cff", "#1f7aff", .24);
    light(T("cost"), "#ff6b6b", "#8c5cff", "#1f7aff", .24);
    light(T("tool"), "#3ddc84", "#22c1ee", "#1f7aff", .26);
    light(T("follow"), "#1f7aff", "#8c5cff", "#0b0b0d", .32);
  }
});
