// The AI-designs social video (1080×1920, 60 fps): everyday moments where AI images promise what a
// business can't deliver, and what it costs them. One glass hero shape morphs through a shop card,
// a delivery box, a menu, a listing, a shop sign, a review, a photo, a file, a banner, a shirt and
// an invoice into the Draft Studio mark. The hero, shapes, captions and frame are in ../shared/social.js.
Object.assign(SHAPES, {
  card: crect(560, 760, 48),
  box: "M150 340L430 250L710 340V690L430 790L150 690Z",
  menu: crect(620, 800, 40),
  listing: crect(780, 640, 32),
  sign: crect(800, 300, 28, 250),
  review: crect(760, 440, 36),
  photo: crect(700, 600, 30),
  banner: crect(820, 320, 22),
  shirt: "M250 160L350 120Q430 170 510 120L610 160L740 270L670 360L610 320V760H250V320L190 360L120 270Z"
});
const PINK = "#ff8fb1", CYAN = "#22c1ee";
const center = (html, top, extra = "") => `<div style="position:absolute;left:0;right:0;top:${top}px;display:flex;justify-content:center;${extra}">${html}</div>`;

// ---------- drawings ----------
const sofa = (glossy) => glossy
  ? `<svg width="420" height="230" viewBox="0 0 420 230"><defs><linearGradient id="sf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc2d8"/><stop offset="1" stop-color="#d77aa8"/></linearGradient></defs>
      <rect x="40" y="20" width="340" height="120" rx="46" fill="url(#sf)"/><rect x="10" y="80" width="80" height="120" rx="36" fill="url(#sf)"/><rect x="330" y="80" width="80" height="120" rx="36" fill="url(#sf)"/>
      <rect x="70" y="110" width="140" height="80" rx="30" fill="#ffd6e5"/><rect x="210" y="110" width="140" height="80" rx="30" fill="#ffd6e5"/>
      <ellipse cx="150" cy="50" rx="60" ry="10" fill="#fff" opacity=".35"/><rect x="60" y="196" width="16" height="30" rx="6" fill="#8a5a44"/><rect x="344" y="196" width="16" height="30" rx="6" fill="#8a5a44"/></svg>`
  : `<svg width="260" height="130" viewBox="0 0 260 130"><path d="M20 60Q130 40 240 60V100Q130 120 20 100Z" fill="#8d8d93"/><path d="M30 40Q130 20 230 40V70Q130 52 30 70Z" fill="#a3a3a8"/>
      <rect x="6" y="56" width="34" height="50" rx="14" fill="#7c7c82"/><rect x="220" y="56" width="34" height="50" rx="14" fill="#7c7c82"/><rect x="40" y="104" width="8" height="18" fill="#555"/><rect x="214" y="104" width="8" height="22" fill="#555" transform="rotate(8 218 110)"/></svg>`;
const burger = (dream) => dream
  ? `<svg width="420" height="320" viewBox="0 0 420 320"><defs><linearGradient id="bn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b25a"/><stop offset="1" stop-color="#c8701f"/></linearGradient></defs>
      <path d="M50 130Q50 30 210 30T370 130Z" fill="url(#bn)"/>${[[120, 80], [170, 60], [230, 58], [290, 82], [200, 100], [140, 108], [270, 106]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#fff6e0"/>`).join("")}
      <path class="b-let" d="M40 136Q70 120 100 140T160 136T220 142T280 134T340 142T382 136V156H40Z" fill="#5fcf5a"/>
      <path class="b-chs" d="M44 156H376V170L340 172L328 206L314 172H220L206 214L192 172H110L96 200L84 172H44Z" fill="#ffd23d"/>
      <rect x="44" y="168" width="332" height="56" rx="26" fill="#6b3a1f"/><path d="M50 232H370Q370 280 210 280T50 232Z" fill="url(#bn)"/>
      <ellipse cx="150" cy="56" rx="50" ry="10" fill="#fff" opacity=".3"/></svg>`
  : `<svg width="360" height="200" viewBox="0 0 360 200"><path d="M50 110Q60 80 190 82T320 104Z" fill="#b98a55" transform="rotate(-4 180 100)"/><path d="M58 112H306V122H58Z" fill="#7d8f55"/>
      <path d="M62 120H300L292 128L170 126L120 130Z" fill="#d9c070"/><rect x="62" y="124" width="236" height="26" rx="12" fill="#4a3324"/><path d="M58 154H306Q300 176 182 176T58 154Z" fill="#b98a55"/></svg>`;
const pool = `<svg width="700" height="420" viewBox="0 0 700 420"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4cff"/><stop offset=".7" stop-color="#ff8a5a"/></linearGradient>
    <linearGradient id="se" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f7aff"/><stop offset="1" stop-color="#22c1ee"/></linearGradient></defs>
    <rect width="700" height="230" fill="url(#sk)"/><circle cx="520" cy="190" r="56" fill="#ffd27a"/><rect y="200" width="700" height="80" fill="url(#se)"/>
    <rect y="270" width="700" height="150" fill="#e9d8c4"/><path d="M60 290H640L600 400H100Z" fill="#43d6f0"/><path d="M120 320H520" stroke="#fff" stroke-width="5" opacity=".6"/><path d="M180 350H560" stroke="#fff" stroke-width="5" opacity=".5"/>
    <g fill="#2a5d3a"><path d="M40 270Q60 160 30 120Q80 150 64 270Z"/><path d="M640 270Q650 170 690 130Q670 190 664 270Z"/></g></svg>`;
const carpark = `<svg width="700" height="420" viewBox="0 0 700 420"><rect width="700" height="200" fill="#9aa0a8"/><rect y="150" width="700" height="60" fill="#7a7f87"/><rect y="200" width="700" height="220" fill="#4b4e54"/>
    ${[120, 260, 400, 540].map(x => `<path d="M${x} 230L${x - 40} 420" stroke="#e8e8e8" stroke-width="6"/>`).join("")}
    ${[[150, "#c94a4a"], [430, "#4a6fc9"]].map(([x, c]) => `<g transform="translate(${x} 270)"><rect width="160" height="62" rx="18" fill="${c}"/><rect x="26" y="-30" width="104" height="40" rx="14" fill="${c}"/><circle cx="36" cy="64" r="16" fill="#222"/><circle cx="124" cy="64" r="16" fill="#222"/></g>`).join("")}
    <rect x="20" y="60" width="120" height="70" rx="6" fill="#2f6fdd"/><text x="80" y="108" text-anchor="middle" fill="#fff" font-family="Inter Display" font-weight="800" font-size="48">P</text></svg>`;
const hand = `<svg width="300" height="300" viewBox="0 0 300 300"><g fill="#f0c6a0" stroke="#c99a74" stroke-width="3">
    ${[[52, 110, -22], [86, 70, -10], [122, 52, 0], [158, 52, 4], [194, 66, 12], [228, 96, 22]].map(([x, y, r]) => `<rect x="${x}" y="${y}" width="32" height="${150 - y + 60}" rx="16" transform="rotate(${r} ${x + 16} 220)"/>`).join("")}
    <rect x="62" y="160" width="190" height="130" rx="60"/></g></svg>`;
const pixelLogo = (cell) => { let s = ""; for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const d = Math.hypot(x - 5.5, y - 5.5); if (d < 5.6 && !(d < 2.6 && x > 4)) s += `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${d < 3.6 ? BLUE : "#8c5cff"}"/>`; } return `<svg width="${cell * 12}" height="${cell * 12}" viewBox="0 0 ${cell * 12} ${cell * 12}" shape-rendering="crispEdges">${s}</svg>`; };

// ---------- the scenes ----------
function shop() {
  const a = T("hook"), b = T("name");
  L("s-shop", `
    ${center(`<div class="mono dim" style="font-size:22px;letter-spacing:.2em">SHOP · LIVING ROOM</div>`, 80)}
    ${center(sofa(true), 160)}
    <div style="position:absolute;left:190px;right:190px;top:430px"><div style="font:700 56px/1 var(--sans);letter-spacing:-.03em">Cloud Sofa</div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;font:600 30px/1 var(--sans)"><span>$299</span><span style="color:${AMBER}">★ 4.9</span></div>
      <div style="margin-top:34px;padding:22px;border-radius:999px;background:${BLUE};text-align:center;font:600 30px/1 var(--sans)">Add to cart</div></div>`);
  L("s-box", `
    <svg style="position:absolute;inset:0" viewBox="0 0 860 860"><path d="M150 340L430 430L710 340M430 430V790" fill="none" stroke="rgba(244,243,239,.26)" stroke-width="2"/><path d="M290 295L570 385" stroke="#c9a46a" stroke-width="26" opacity=".5"/></svg>
    ${center(sofa(false), 470)}
    ${center(chip("📦 Delivered", "background:rgba(11,11,13,.6)"), 640)}`);
  span("s-shop", a - .2, T("hook2"));
  morph("box", T("hook2"));
  span("s-box", T("hook2"), b);
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
  const a = T("menu"), b = T("hotel");
  morph("menu", a);
  L("s-menu", `
    ${center(`<div style="text-align:center"><div class="mono" style="font-size:22px;letter-spacing:.3em;color:${AMBER}">BURGER CO.</div><div style="font:700 50px/1 var(--sans);margin-top:12px;letter-spacing:-.03em">The Classic</div></div>`, 60)}
    ${center(`<div id="m-dream">${burger(true)}</div>`, 200)}
    <div id="m-tags"><div style="position:absolute;left:150px;top:340px">${chip("melted cheese", `background:#ffd23d;color:#3a2a00`)}</div><div style="position:absolute;right:150px;top:300px">${chip("fresh lettuce", "background:#5fcf5a;color:#06210f")}</div></div>
    ${center(`<div style="font:700 44px/1 var(--sans)">$12.99</div>`, 560)}
    ${center(`<div class="sub" style="font-size:28px">Juicy. Stacked. Perfect.</div>`, 620)}`);
  L("s-menu2", `
    ${center(`<div class="mono" style="font-size:22px;letter-spacing:.3em;color:${RED}">WHAT ARRIVED</div>`, 120)}
    ${center(burger(false), 290)}
    ${center(`<div style="font:600 34px/1.3 var(--sans);text-align:center;color:rgba(244,243,239,.75)">It had a rough week.</div>`, 560)}`);
  span("s-menu", a, T("menu3"));
  gsap.set("#m-tags > div", { autoAlpha: 0 });
  tl.fromTo("#m-tags > div", { autoAlpha: 0, scale: .6 }, { autoAlpha: 1, scale: 1, duration: .5, stagger: .5, ease: "pop" }, T("menu2") + .2);
  span("s-menu2", T("menu3"), b);
  tl.fromTo("#s-menu2 svg", { y: -60, scaleY: 1.3 }, { y: 0, scaleY: 1, duration: .6, ease: "bounce.out" }, T("menu3") + .3);
}

function hotel() {
  const a = T("hotel"), b = T("off");
  morph("listing", a);
  const frameImg = (inner, id) => `<div id="${id}" style="position:absolute;left:80px;top:150px;width:700px;height:420px;border-radius:20px;overflow:hidden">${inner}</div>`;
  L("s-hotel", `
    ${frameImg(pool, "h-pool")}${frameImg(carpark, "h-car")}
    <div style="position:absolute;left:80px;right:80px;top:600px;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font:700 42px/1 var(--sans);letter-spacing:-.03em">Sea View Resort</div><div style="font:600 26px/1 var(--sans);color:${AMBER};margin-top:10px">★★★★★</div></div>
      <div id="h-tag"></div></div>
    <div id="h-never" style="position:absolute;left:0;right:0;top:300px;display:flex;justify-content:center"><div style="padding:14px 34px;border:6px solid ${RED};border-radius:16px;color:${RED};font:800 60px/1 var(--sans);letter-spacing:.04em;transform:rotate(-8deg);background:rgba(11,11,13,.55)">NEVER EXISTED</div></div>`);
  span("s-hotel", a, b);
  gsap.set(["#h-car", "#h-never"], { autoAlpha: 0 });
  const tag = $("#h-tag");
  hooks.push(t => { if (t < a - .3 || t > b + .1) return;
    tag.innerHTML = t < T("view") ? chip("Infinity pool", `background:${CYAN};color:#002230`) : t < T("real") ? chip("Ocean view", `background:${BLUE}`) : t < T("pool") ? chip("Actual view", "background:rgba(244,243,239,.14)") : chip("Pool?", `background:rgba(255,107,107,.18);color:${RED}`); });
  tl.fromTo("#h-car", { autoAlpha: 0, clipPath: "inset(0 100% 0 0)" }, { autoAlpha: 1, clipPath: "inset(0 0% 0 0)", duration: .9, ease: "glide" }, T("carpark") - .2);
  tl.fromTo("#h-never", { autoAlpha: 0, scale: 2.2 }, { autoAlpha: 1, scale: 1, duration: .4, ease: "power4.in" }, T("nopool") + .2);
}

function signs() {
  const a = T("off"), b = T("cost");
  morph("sign", a);
  const SIGN = [["F", 0], ["R", 2], ["E", -3], ["S", 1], ["H", 4], [" ", 0], ["B", -2], ["A", 3], ["K", 0], ["K", -5], ["R", 2], ["Y", 6], [" ", 0], ["&", 0], [" ", 0], ["C", -1], ["Ø", 3], ["F", 0], ["E", -4], ["F", 2], ["E", 7]];
  L("s-sign", `
    <div id="sg" style="position:absolute;left:30px;right:30px;top:150px;height:200px;display:flex;justify-content:center;align-items:center;font:800 56px/1 var(--sans);letter-spacing:.02em;color:${AMBER};white-space:pre">
      ${SIGN.map(([c, r], k) => `<span style="display:inline-block;transform:rotate(${r}deg) translateY(${(k % 3) * 3 - 3}px) scaleX(${1 + (k % 4) * .06})">${c}</span>`).join("")}</div>
    <div id="sg-lens" style="position:absolute;left:520px;top:120px;width:230px;height:230px;border-radius:50%;border:8px solid ${CREAM};box-shadow:0 20px 50px rgba(0,0,0,.5)"><i style="position:absolute;right:-60px;bottom:-60px;width:24px;height:90px;border-radius:12px;background:${CREAM};transform:rotate(-45deg)"></i></div>
    <div id="sg-hand" style="position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center;align-items:center;gap:30px">${hand}<div style="font:800 120px/1 var(--sans);color:${RED}">6?</div></div>
    <div id="sg-off" style="position:absolute;left:0;right:0;top:780px;text-align:center;font:700 54px/1 var(--sans);letter-spacing:-.03em">Something feels off.</div>`);
  span("s-sign", a, b);
  gsap.set(["#sg-lens", "#sg-hand", "#sg-off"], { autoAlpha: 0 });
  tl.fromTo("#sg-lens", { autoAlpha: 0, scale: .4 }, { autoAlpha: 1, scale: 1, duration: .5, ease: "pop" }, T("text") + .3);
  tl.to("#sg-lens", { x: -330, duration: 1.4, ease: "glide" }, T("text") + .9);
  tl.fromTo("#sg-hand", { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .6 }, T("hands") - .1);
  tl.to("#sg-lens", { autoAlpha: 0, duration: .3 }, T("hands") - .2);
  tl.fromTo("#sg-off", { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, T("feel"));
  // the uneasy feeling: a slight colour-split shimmer
  hooks.push(t => { if (t < T("feel") - .1 || t > b + .1) { $("#s-sign").style.textShadow = ""; return; } const k = Math.sin((t - T("feel")) * 30) * 3;
    $("#s-sign").style.textShadow = `${k}px 0 rgba(255,60,90,.55), ${-k}px 0 rgba(60,200,255,.55)`; });
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
  morph("photo", T("doubt"));
  L("s-doubt", `
    <div style="position:absolute;left:80px;top:130px;width:700px;height:600px;border-radius:30px;overflow:hidden;background:linear-gradient(160deg,#3a2a20,#1c1410)">
      <svg width="700" height="600" viewBox="0 0 700 600"><ellipse cx="350" cy="470" rx="230" ry="40" fill="#120c08"/><path d="M230 280H470L450 450Q350 480 250 450Z" fill="#f4f3ef"/><path d="M470 320Q540 330 530 380T460 420" fill="none" stroke="#f4f3ef" stroke-width="22"/>
        <ellipse cx="350" cy="285" rx="120" ry="20" fill="#5a3418"/><path d="M300 240Q290 200 310 170M350 230Q340 180 362 150M400 240Q392 205 410 180" stroke="#f4f3ef" stroke-width="6" fill="none" opacity=".35"/></svg></div>
    <div class="db" style="position:absolute;left:60px;top:150px">${chip("Is this AI? 🤔", "background:rgba(11,11,13,.75);border:1.5px solid rgba(244,243,239,.25)")}</div>
    <div class="db" style="position:absolute;right:60px;top:300px">${chip("Looks fake", "background:rgba(11,11,13,.75);border:1.5px solid rgba(244,243,239,.25)")}</div>
    <div class="db" style="position:absolute;left:110px;top:520px">${chip("AI again?", "background:rgba(11,11,13,.75);border:1.5px solid rgba(244,243,239,.25)")}</div>
    <div id="db-real" style="position:absolute;right:90px;top:640px">${chip("📷 Real photo", `background:${GREEN};color:#06210f`)}</div>`);
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
    <div style="position:absolute;left:-40px;right:-40px;top:790px;text-align:center"><div style="font:700 64px/1 var(--sans);letter-spacing:-.04em">Follow Draft Studio</div><div class="sub" style="font-size:30px;margin-top:16px">Real design, made simple.</div></div>`);
  tl.fromTo("#s-logo", { autoAlpha: 0 }, { autoAlpha: 1, duration: .7 }, T("follow") + 1);
}

build({
  bare: true,
  scenes() {
    frame([["Real life"], ["The signs", AMBER], ["The cost", RED], ["The truth", GREEN], [""]]);
    gsap.set("#kick [data-k]", { autoAlpha: 0 });
    gsap.set("#hero", { attr: { d: SHAPES.card } }); gsap.set("#heroB", { attr: { d: SHAPES.card } });
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
