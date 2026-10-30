// The Typography lesson video: its own scenes. The engine (../shared/engine.js) does the rest.
// Type is measured from the real fonts (canvas measureText), so the guide lines sit exactly on the letters.
// (single quotes inside, so a stack can sit in a style="…" attribute)
const SERIF = "'Playfair Display', Georgia, serif", MONO = "'JetBrains Mono', monospace", DISPLAY = "'Bebas Neue', Impact, sans-serif";
const SANS = "'Inter Display', Inter, sans-serif", BODY = "Inter, sans-serif";
const metrics = (font, size, weight = 400) => {
  const c = document.createElement("canvas").getContext("2d");
  c.font = `${weight} ${size}px ${font}`;
  const m = ch => c.measureText(ch);
  return { x: m("x").actualBoundingBoxAscent, cap: m("H").actualBoundingBoxAscent, asc: m("d").actualBoundingBoxAscent,
    desc: m("p").actualBoundingBoxDescent, width: s => c.measureText(s).width };
};
const PARA = "Good typography is invisible. It guides the eye from line to line, so the reader thinks about the words and never about the letters. Size, spacing and rhythm do the quiet work that makes a page feel calm and easy to read.";

function title() {
  const end = T("ch1");
  const ROULETTE = [[SERIF, 700], [DISPLAY, 400], [MONO, 700], [SANS, 200], ["FreeSerif, serif", 400], [SANS, 900], [SERIF, 400], ["'DejaVu Sans', sans-serif", 700]];
  const MOCK = (w, h, rows) => `<div class="card t-mock" style="width:${w}px;height:${h}px;padding:34px;display:flex;flex-direction:column;gap:16px">${rows}</div>`;
  const bar = (w, hgt, o = .5) => `<i class="t-bar" style="display:block;width:${w}%;height:${hgt}px;border-radius:${hgt / 2}px;background:rgba(244,243,239,${o})"></i>`;
  const NAMES = "Helvetica Futura Garamond Baskerville Bodoni Didot Gill Sans Frutiger Univers Avenir Caslon Rockwell Optima Gotham Proxima Nova Montserrat Lato Raleway Poppins Playfair Merriweather Roboto Georgia Verdana Clarendon Akzidenz Grotesk Trajan Copperplate Eurostile Bauhaus Didone Spectral Lora Oswald Bebas Archivo Manrope Satoshi Sora".split(" ");
  scene("title", INTRO - .2, end, `
    <div class="abs kicker" id="t-k" style="left:160px;top:250px">Design Basics — Lesson 02</div>
    <div class="abs" id="t-big" style="left:150px;top:300px;font-size:270px;line-height:1.05;letter-spacing:-.05em;white-space:nowrap">${[..."Typography"].map(c => `<span class="t-l">${c}</span>`).join("")}</div>
    <div class="abs" id="t-mocks" style="left:160px;top:380px;display:flex;gap:28px;align-items:flex-start">
      ${MOCK(520, 560, `<div class="mono dim" style="font-size:18px;letter-spacing:.2em">POSTER</div>${bar(90, 56, .85)}${bar(70, 56, .85)}${bar(40, 18)}${bar(55, 18)}<div style="flex:1"></div>${bar(35, 44, .7)}`)}
      ${MOCK(520, 560, `<div class="mono dim" style="font-size:18px;letter-spacing:.2em">APP</div>${bar(60, 34, .85)}${bar(95, 14)}${bar(88, 14)}${bar(92, 14)}${bar(50, 14)}<div style="flex:1"></div>${bar(100, 60, .8)}`)}
      ${MOCK(520, 560, `<div class="mono dim" style="font-size:18px;letter-spacing:.2em">WEBSITE</div>${bar(85, 40, .85)}${bar(65, 40, .85)}${bar(96, 14)}${bar(90, 14)}${bar(94, 14)}${bar(60, 14)}<div style="flex:1"></div>${bar(30, 50, .7)}`)}
    </div>
    <div class="abs h2" id="t-words" style="left:160px;top:250px">Most designs are mostly <span class="blue">words.</span></div>
    <div class="abs" id="t-wall" style="left:0;top:0;width:1920px;height:1080px;overflow:hidden">
      ${Array.from({ length: 7 }, (_, r) => `<div class="t-row" style="position:absolute;left:0;top:${150 + r * 120}px;white-space:nowrap;font-size:76px;line-height:1;color:rgba(244,243,239,.16)">${Array.from({ length: 14 }, (_, k) => { const n = NAMES[(r * 7 + k * 3) % NAMES.length], [f, w] = ROULETTE[(r + k) % ROULETTE.length]; return `<span style="font-family:${f};font-weight:${w};margin-right:60px">${n}</span>`; }).join("")}</div>`).join("")}
    </div>
    <div class="abs h1" id="t-p1" style="left:160px;top:370px;width:1640px;font-size:104px">It’s not about a hundred fonts.<i id="t-strike" class="abs" style="left:0;top:56px;width:1480px;height:7px;background:var(--blue);transform-origin:0 50%"></i></div>
    <div class="abs h1" id="t-p2" style="left:160px;top:540px;width:1640px;font-size:104px">It’s about a few simple <span class="blue">rules.</span></div>
    <div class="abs" id="t-chips" style="left:160px;top:330px;width:1600px;display:grid;grid-template-columns:repeat(5,1fr);gap:26px">
      ${[["01", "Anatomy of a letter", SERIF, "Ag"], ["02", "Kinds of font", DISPLAY, "AG"], ["03", "Size & weight", SANS, "Aa"], ["04", "Spacing", BODY, "A a"], ["05", "Pairing", SERIF, "Aa"]].map(([n, w, f, s], k) => `
        <div class="card t-chip" style="height:420px;padding:40px 34px;display:flex;flex-direction:column">
          <div class="mono blue" style="font-size:22px;letter-spacing:.2em">${n}</div>
          <div style="margin-top:28px;font-family:${f};font-size:110px;line-height:1;font-weight:${k === 2 ? 800 : 400};letter-spacing:${k === 3 ? ".3em" : "-.02em"}">${s}</div>
          <div style="margin-top:auto;font:600 42px/1.08 var(--sans);letter-spacing:-.03em">${w}</div></div>`).join("")}
    </div>`);
  // "Typography" spins through typefaces, letter by letter, and settles into Inter
  const letters = $$("#t-big .t-l"), a = T("title");
  gsap.set("#t-big", { autoAlpha: 0 });
  tl.set("#t-big", { autoAlpha: 1 }, a);
  tl.from(letters, { yPercent: 60, opacity: 0, duration: 1, stagger: .05 }, a);
  hooks.push(t => {
    if (t < a - .3 || t > T("words") + .5) return;
    const f = Math.floor(t * 15);
    letters.forEach((l, i) => {
      const settled = t >= a + .5 + i * .14, [fam, w] = settled ? [SANS, 600] : ROULETTE[(f + i * 3) % ROULETTE.length];
      l.style.fontFamily = fam; l.style.fontWeight = w;
    });
  });
  textIn($("#t-k"), a + .3);
  // most designs are mostly words: three layouts, all text
  tl.to("#t-big", { y: -200, scale: .42, transformOrigin: "0 0", autoAlpha: 0, duration: 1.1, ease: "glide" }, T("words") - .3);
  tl.to("#t-k", { autoAlpha: 0, duration: .4 }, T("words") - .3);
  textIn($("#t-words"), T("words"));
  fadeIn($$(".t-mock"), T("words") + .2, { y: 80, st: .12 });
  tl.from($$(".t-mock .t-bar"), { scaleX: 0, transformOrigin: "0 50%", duration: .8, stagger: .02 }, T("words") + .5);
  // good type makes the difference: the text turns blue
  tl.to($$(".t-mock .t-bar"), { backgroundColor: "rgba(31,122,255,.9)", duration: .5, stagger: .015 }, T("skill"));
  // not a hundred fonts…
  fadeOut(["#t-words", ".t-mock"], T("promise") - .3, { st: .04 });
  gsap.set("#t-wall", { autoAlpha: 0 });
  tl.to("#t-wall", { autoAlpha: 1, duration: .8 }, T("promise") - .1);
  $$(".t-row").forEach((r, k) => tl.fromTo(r, { x: k % 2 ? -1400 : -200 }, { x: k % 2 ? -200 : -1400, duration: T("learn") - T("promise") + 1, ease: "none" }, T("promise") - .1));
  textIn($("#t-p1"), T("promise"), { st: .04 });
  gsap.set("#t-strike", { scaleX: 0 });
  tl.to("#t-strike", { scaleX: 1, duration: .8, ease: "glide" }, T("rules") - .1);
  tl.to("#t-p1 .wd", { color: "rgba(244,243,239,.3)", duration: .8 }, T("rules") - .1);
  textIn($("#t-p2"), T("rules"), { st: .05 });
  // …a few simple rules, in five parts
  const parts = Math.min(T("learn") - .4, T("rules") + 1.9);
  fadeOut(["#t-p1", "#t-p2", "#t-wall"], parts - .3);
  fadeIn($$(".t-chip"), parts, { y: 80, st: .09 });
  light(INTRO, "#1f7aff", "#8c5cff", "#22c1ee", .28);
}

function anatomy() {
  const a = T("lines"), b = T("ch2");
  const m0 = metrics(SERIF, 100), word = "Glyphs";
  const size = Math.min(440, 980 / m0.width(word) * 100), m = metrics(SERIF, size);
  const X0 = 180, BASE = 690, R = 1290;
  const Y = { asc: BASE - m.asc, cap: BASE - m.cap, x: BASE - m.x, base: BASE, desc: BASE + m.desc };
  const LINES = [["asc", "Ascender line", "#22c1ee"], ["cap", "Cap height", "#8c5cff"], ["x", "x-height", "#1f7aff"], ["base", "Baseline", "#ffd53d"], ["desc", "Descender line", "#ff6b6b"]];
  const LY = {};
  [...LINES].reverse().forEach(([k], i, a) => { LY[k] = i ? Math.min(Y[k], LY[a[i - 1][0]] - 44) : Y[k]; });
  const sc = scene("anat", a - .1, b, `
    <svg class="abs" style="left:0;top:0" width="1920" height="1080" viewBox="0 0 1920 1080">
      <rect id="a-band" x="${X0 - 40}" y="${Y.x}" width="${R - X0 + 40}" height="${BASE - Y.x}" fill="rgba(31,122,255,.16)"/>
      ${LINES.map(([k, , c]) => `<line class="a-line" id="a-${k}" x1="${X0 - 40}" x2="${R}" y1="${Y[k]}" y2="${Y[k]}" stroke="${c}" stroke-width="3"/>`).join("")}
      <text id="a-word" x="${X0}" y="${BASE}" font-family="${SERIF}" font-size="${size}" fill="${CREAM}">${[...word].map((c, i) => `<tspan class="a-ch" data-i="${i}">${c}</tspan>`).join("")}</text>
    </svg>
    ${LINES.map(([k, n, c]) => `<div class="abs a-lab" id="a-lab-${k}" style="left:${R + 30}px;top:${LY[k] - 20}px;font:600 32px/40px var(--sans);letter-spacing:-.02em;white-space:nowrap"><i style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};margin-right:14px"></i>${n}</div>`).join("")}
    <div class="abs kicker" id="a-k" style="left:${X0}px;top:200px">Five invisible lines</div>
    <div class="abs" id="a-cmp" style="left:160px;top:230px;width:1600px">
      ${[["Large x-height", "Inter", BODY, true], ["Small x-height", "FreeSerif", "FreeSerif, serif", false]].map(([h, n, f, good], k) => `
        <div class="abs a-col" style="left:${k * 820}px;top:0;width:760px">
          <div class="h2" style="font-size:56px">${h}</div><div class="sub" style="font-size:28px;margin-top:8px">${n}</div>
          <svg width="760" height="230" style="display:block;margin-top:30px;overflow:visible"><rect class="a-xb" x="-10" y="${170 - metrics(f, 150).x}" width="${metrics(f, 150).width("xenon") + 20}" height="${metrics(f, 150).x}" fill="rgba(31,122,255,.18)"/><text x="0" y="170" font-family="${f}" font-size="150" fill="${CREAM}">xenon</text></svg>
          <div class="a-small" style="margin-top:40px;font-family:${f};font-size:26px;line-height:1.5;color:rgba(244,243,239,.9)">The quick brown fox jumps over the lazy dog, again and again, at a small size.</div>
          <div class="a-verdict" style="margin-top:22px;font:600 28px/1 var(--sans);color:${good ? "#3ddc84" : "rgba(244,243,239,.5)"}">${good ? "✓ Stays clear when small" : "Gets harder to read"}</div></div>`).join("")}
    </div>`);
  // the word first, then each guide line as it is named
  gsap.set([...$$(".a-line", sc), "#a-band", ...$$(".a-lab", sc), "#a-cmp", ...$$(".a-small, .a-verdict", sc)], { autoAlpha: 0 });
  tl.from("#a-word", { opacity: 0, y: 40, duration: 1.3 }, a);
  textIn($("#a-k"), a + .2);
  // every line at once, faint, as "the same set of invisible lines" is said
  tl.set($$(".a-line", sc), { autoAlpha: 1 }, a + .6);
  tl.fromTo($$(".a-line", sc), { drawSVG: "0%", opacity: .25 }, { drawSVG: "100%", opacity: .25, duration: 1.2, stagger: .08, ease: "glide" }, a + .6);
  const show = (k, at) => { tl.to(`#a-${k}`, { opacity: 1, duration: .5 }, at); tl.fromTo(`#a-lab-${k}`, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: .8 }, at); };
  const chars = $$(".a-ch", sc), tint = (idx, c, at) => idx.forEach(i => tl.to(chars[i], { fill: c, duration: .5 }, at));
  show("base", T("baseline"));
  show("x", T("xheight")); tl.to("#a-band", { autoAlpha: 1, duration: .8 }, T("xheight"));
  show("cap", T("cap")); tint([0], "#b9a6ff", T("cap")); tint([0], CREAM, T("asc"));
  show("asc", T("asc")); tint([1, 4], "#7fd8f5", T("asc"));
  show("desc", T("desc")); tint([1, 4], CREAM, T("desc")); tint([2, 3], "#ff9b9b", T("desc")); tint([2, 3], CREAM, T("xmatter"));
  // the x-height matters most
  tl.to([...$$(".a-line", sc), ...$$(".a-lab", sc)].filter(e => !/-x$/.test(e.id)), { opacity: .15, duration: .6 }, T("xmatter"));
  tl.to("#a-band", { fill: "rgba(31,122,255,.4)", duration: .6, yoyo: true, repeat: 1 }, T("xmatter") + .2);
  // large against small, then both set small
  tl.to(["#a-word", "#a-band", ...$$(".a-line, .a-lab", sc), "#a-k"], { autoAlpha: 0, y: -30, duration: .6, ease: "power2.in" }, T("bigx") - .4);
  tl.set("#a-cmp", { autoAlpha: 1 }, T("bigx"));
  tl.from($$(".a-col", sc), { y: 60, opacity: 0, duration: 1.1, stagger: .15 }, T("bigx"));
  tl.fromTo($$(".a-small", sc), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .9, stagger: .1 }, T("small"));
  tl.fromTo($$(".a-verdict", sc), { autoAlpha: 0 }, { autoAlpha: 1, duration: .8, stagger: .15 }, T("small") + .8);
  light(a, "#1f7aff", "#8c5cff", "#ffd53d", .22);
}

function kinds() {
  const a = T("serif"), b = T("ch3");
  const K = [["Serif", SERIF, 400, "Ag", "Classic · Trustworthy", "Books, editorial, luxury", "classic"],
    ["Sans-serif", SANS, 500, "Ag", "Modern · Clean", "Apps, websites, signs", "modern"],
    ["Monospace", MONO, 400, "iW", "Equal widths", "Code and numbers", "code"],
    ["Display", DISPLAY, 400, "AG", "Big and loud", "Headlines only", "headlines"]];
  const sc = scene("kinds", a - .1, b, K.map(([n, f, w, s, feel, use], k) => `
    <div class="abs card k-card" style="left:${140 + k * 415}px;top:200px;width:390px;height:680px;padding:40px">
      <div style="position:relative;height:300px;display:flex;align-items:center">
        ${k === 2 ? `<i class="k-cell" style="position:absolute;left:0;top:44px;width:132px;height:220px;border:2px dashed rgba(31,122,255,.8);border-radius:6px"></i><i class="k-cell" style="position:absolute;left:132px;top:44px;width:132px;height:220px;border:2px dashed rgba(31,122,255,.8);border-radius:6px"></i>` : ""}
        <div style="position:relative;font-family:${f};font-weight:${w};font-size:${k === 3 ? 260 : 220}px;line-height:1;letter-spacing:${k === 2 ? 0 : "-.02em"}">${s}</div></div>
      <div style="font:600 52px/1 var(--sans);letter-spacing:-.035em;margin-top:20px">${n}</div>
      <div class="k-feel sub" style="font-size:28px;margin-top:14px">${feel}</div>
      <div class="k-use" style="position:absolute;left:40px;right:40px;bottom:40px;padding-top:22px;border-top:1.5px solid var(--line);font-size:26px;font-weight:600">${use}</div>
      ${k === 2 ? `<div class="k-code mono2" style="position:absolute;left:40px;right:40px;bottom:120px;font-size:24px;color:#7fd8f5">size = 16;</div>` : ""}
      ${k === 3 ? `<div class="k-head disp" style="position:absolute;left:40px;right:40px;bottom:112px;font-size:58px;line-height:1;color:var(--blue)">BIG HEADLINES</div>` : ""}
    </div>`).join(""));
  const cards = $$(".k-card", sc);
  gsap.set([...$$(".k-feel, .k-use, .k-code, .k-head, .k-cell", sc)], { autoAlpha: 0 });
  ["serif", "sans", "mono", "display"].forEach((c, k) => {
    fadeIn(cards[k], T(c), { y: 80 });
    if (k) tl.to(cards.slice(0, k), { opacity: .45, duration: .6 }, T(c));
    tl.fromTo($$(".k-feel, .k-use", cards[k]), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8, stagger: .2 }, T(K[k][6]));
  });
  tl.fromTo($$(".k-cell", sc), { autoAlpha: 0, scale: .9 }, { autoAlpha: 1, scale: 1, duration: .6, stagger: .15 }, T("mono") + .5);
  tl.fromTo(".k-code", { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: .7 }, T("code"));
  tl.fromTo(".k-head", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7 }, T("headlines"));
  tl.to(cards, { opacity: 1, duration: .8 }, T("headlines") + 1.4);
  light(a, "#ffd53d", "#1f7aff", "#ff4fa3", .2);
}

function sizes() {
  const a = T("random"), b = T("weight");
  const RAND = [[17, 260, 300, -2], [22, 900, 250, 3], [29, 520, 520, -1], [13, 1250, 600, 2], [35, 300, 720, 1]];
  const STEPS = [12.8, 16, 20, 25, 31.25, 39.06, 48.83];
  let y = 905;
  const rows = STEPS.map(px => { const s = px * 2.1; const r = { px, s, y }; y -= s * 1.12 + 14; return r; });
  const sc = scene("sizes", a - .1, b, `
    ${RAND.map(([px, x, yy, r]) => `<div class="abs z-r" style="left:${x}px;top:${yy}px;transform:rotate(${r}deg)"><div style="font:600 ${px * 3}px/1 var(--sans);letter-spacing:-.03em">Heading</div><div class="mono dim" style="font-size:22px;margin-top:8px">${px} px?</div></div>`).join("")}
    <div class="abs h2" id="z-eye" style="left:1180px;top:240px;width:640px">Sizes picked by eye<span class="dim">: nothing relates.</span></div>
    ${rows.map(({ px, s, y }) => `<div class="abs z-row" style="left:170px;top:${y - s}px;display:flex;align-items:baseline;gap:34px">
      <span class="mono z-px" style="width:110px;font-size:24px;color:var(--mute);text-align:right">${px % 1 ? px.toFixed(1) : px} px</span>
      <span class="z-s" style="font:600 ${s}px/1 var(--sans);letter-spacing:-.03em;white-space:nowrap">Typography</span></div>`).join("")}
    ${rows.slice(1).map(({ y, s }) => `<div class="abs mono z-x" style="left:${170 + 144 + metrics(SANS, s, 600).width("Typography") * .97 + 26}px;top:${y - s * .42 - 12}px;font-size:24px;color:var(--blue)">×1.25</div>`).join("")}
    <div class="abs" id="z-side" style="left:1180px;top:240px;width:640px">
      <div class="h2" id="z-t">A type scale</div>
      <div class="sub" id="z-sub" style="margin-top:20px">Each size is the one before it, multiplied by the same number.</div>
      <div id="z-ratio" style="margin-top:50px;font:600 170px/1 var(--sans);letter-spacing:-.05em">×<span class="blue">1.25</span></div>
      <div id="z-16" style="margin-top:40px;padding:22px 28px;border-radius:24px;border:1.5px solid rgba(31,122,255,.6);font:600 32px/1.3 var(--sans)">16 px <span class="dim" style="font-weight:500">is the minimum for body text on screens.</span></div>
    </div>`);
  const rs = $$(".z-r", sc), zrows = $$(".z-row", sc), xs = $$(".z-x", sc);
  gsap.set([...zrows, ...xs, "#z-side", "#z-ratio", "#z-16", "#z-sub"], { autoAlpha: 0 });
  // sizes by eye: scattered and unrelated
  tl.from(rs, { opacity: 0, scale: .6, duration: .9, stagger: .1, ease: "pop" }, a);
  textIn($("#z-eye"), a + .3);
  // a scale: they line up, smallest to largest
  tl.to(rs, { opacity: 0, scale: .8, y: 40, duration: .5, stagger: .04, ease: "power2.in" }, T("scale") - .4);
  textOut($("#z-eye"), T("scale") - .4);
  tl.fromTo(zrows, { autoAlpha: 0, x: -60 }, { autoAlpha: 1, x: 0, duration: .9, stagger: .07 }, T("scale"));
  tl.set("#z-side", { autoAlpha: 1 }, T("scale"));
  tl.from("#z-t", { opacity: 0, y: 30, duration: .9 }, T("scale"));
  tl.fromTo("#z-sub", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .9 }, T("multiply"));
  tl.fromTo(xs, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: .5, stagger: .08 }, T("multiply") + .3);
  tl.fromTo("#z-ratio", { autoAlpha: 0, scale: .8, transformOrigin: "0 50%" }, { autoAlpha: 1, scale: 1, duration: 1, ease: "pop" }, T("ratio"));
  // 16, then 20, 25, 31, 39 light up as they are read
  const lit = (k, at) => { tl.to($(".z-s", zrows[k]), { color: "#7fb3ff", duration: .3 }, at); tl.to($(".z-px", zrows[k]), { color: CREAM, duration: .3 }, at); };
  [1, 2, 3, 4, 5].forEach((k, j) => lit(k, T("steps") + j * (T("body16") - T("steps")) / 5.5));
  tl.to($$(".z-s", sc).filter((_, k) => k !== 1), { color: "rgba(244,243,239,.35)", duration: .6 }, T("body16"));
  tl.to($(".z-s", zrows[1]), { color: BLUE, duration: .6 }, T("body16"));
  tl.fromTo("#z-16", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .9 }, T("body16") + .2);
  light(a, "#1f7aff", "#22c1ee", "#8c5cff", .2);
}

function weights() {
  const a = T("weight"), b = T("ch4");
  const W = { w: 400 };
  const NAMES = { 100: "Thin", 200: "ExtraLight", 300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold", 900: "Black" };
  const sc = scene("weights", a - .1, b, `
    <div class="abs" id="w-word" style="left:0;right:0;top:250px;text-align:center;font:400 260px/1 var(--sans);letter-spacing:-.04em">Weight</div>
    <div class="abs" id="w-scale" style="left:260px;top:620px;width:1400px">
      <div style="position:relative;height:6px;border-radius:3px;background:var(--line)"><i id="w-mark" style="position:absolute;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;background:var(--blue);box-shadow:0 0 30px rgba(31,122,255,.6)"></i></div>
      <div style="display:flex;justify-content:space-between;margin-top:30px">${Object.keys(NAMES).map(w => `<span class="mono" style="font-size:22px;color:var(--mute);width:60px;text-align:center">${w}</span>`).join("")}</div>
      <div id="w-name" style="margin-top:40px;text-align:center;font:600 40px/1 var(--sans)"></div>
    </div>
    <div class="abs h2" id="w-three" style="left:160px;top:200px">Three weights are enough</div>
    ${[["Regular", 400, "Reading", `<div style="font:400 30px/1.55 var(--sans)">${PARA.slice(0, 140)}…</div>`],
      ["Semibold", 600, "Buttons & labels", `<div style="display:flex;gap:16px;flex-wrap:wrap"><span style="padding:22px 36px;border-radius:999px;background:var(--blue);font:600 30px/1 var(--sans)">Get started</span><span style="padding:22px 36px;border-radius:999px;border:1.5px solid var(--line);font:600 30px/1 var(--sans)">Learn more</span></div>`],
      ["Bold", 700, "Headings", `<div style="font:700 66px/1.02 var(--sans);letter-spacing:-.04em">Type that feels designed.</div>`]].map(([n, w, use, demo], k) => `
      <div class="abs card w-col" style="left:${160 + k * 540}px;top:330px;width:500px;height:560px;padding:40px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font:${w} 48px/1 var(--sans);letter-spacing:-.03em">${n}</span><span class="mono blue" style="font-size:26px">${w}</span></div>
        <div class="sub" style="font-size:28px;margin-top:10px">${use}</div>
        <div style="margin-top:auto">${demo}</div></div>`).join("")}`);
  const word = $("#w-word", sc), mark = $("#w-mark", sc), name = $("#w-name", sc);
  hooks.push(t => {
    if (!live(a, b)(t)) return;
    const w = Math.round(W.w / 100) * 100;
    word.style.fontWeight = w; mark.style.left = (W.w - 100) / 8 + "%"; name.innerHTML = `${NAMES[w]} <span class="dim mono" style="font-size:28px">${w}</span>`;
  });
  tl.from(word, { opacity: 0, y: 50, duration: 1.2 }, a);
  fadeIn("#w-scale", a + .3, { y: 30 });
  // thin all the way to black
  tl.fromTo(W, { w: 400 }, { w: 100, duration: .8, ease: "glide" }, T("range") - .1);
  tl.to(W, { w: 900, duration: 2.2, ease: "glide" }, T("range") + .8);
  // three weights cover almost everything
  tl.to([word, "#w-scale"], { autoAlpha: 0, y: -40, duration: .6, ease: "power2.in" }, T("three") - .4);
  textIn($("#w-three"), T("three"));
  const cols = $$(".w-col", sc);
  ["regular", "semibold", "bold"].forEach((c, k) => fadeIn(cols[k], T(c), { y: 70 }));
  light(a, "#8c5cff", "#1f7aff", "#ffd53d", .2);
}

function spacing() {
  const a = T("leading"), b = T("ch5");
  const S = { lh: 1.3, w: 900, tr0: 0, tr1: 0 };
  const sc = scene("spacing", a - .1, b, `
    <div class="abs" id="s-lh" style="left:160px;top:250px;width:900px">
      <div id="s-para" style="font:400 36px/1.3 var(--sans);letter-spacing:-.01em;color:rgba(244,243,239,.92)">${PARA}</div>
    </div>
    <div class="abs" id="s-lhside" style="left:1180px;top:260px;width:620px">
      <div class="kicker" style="color:var(--mute)">Line height</div>
      <div id="s-lhval" style="font:600 170px/1 var(--sans);letter-spacing:-.05em;margin-top:26px;font-variant-numeric:tabular-nums"></div>
      <div id="s-tight" class="h2" style="font-size:52px;margin-top:30px;color:#ff6b6b">Too tight</div>
      <div id="s-good" class="h2" style="font-size:52px;margin-top:30px;color:#3ddc84;position:absolute;top:226px">About 1.5 × the size</div>
    </div>
    <div class="abs" id="s-meas" style="left:160px;top:240px;width:1600px">
      <div class="h2" id="s-mt" style="font-size:60px">Line length</div>
      <div id="s-mpara" style="margin-top:40px;font:400 30px/1.55 var(--sans);color:rgba(244,243,239,.9)">${PARA} ${PARA}</div>
      <div id="s-count" style="margin-top:34px;font:600 34px/1 var(--sans)"></div>
    </div>
    <div class="abs" id="s-screen" style="left:260px;top:200px;width:1400px;height:720px;border-radius:30px;border:2px solid var(--line);background:rgba(244,243,239,.03);overflow:hidden">
      <div style="height:54px;border-bottom:1.5px solid var(--line);display:flex;align-items:center;gap:12px;padding:0 24px"><i style="width:14px;height:14px;border-radius:50%;background:#ff6b6b"></i><i style="width:14px;height:14px;border-radius:50%;background:#ffd53d"></i><i style="width:14px;height:14px;border-radius:50%;background:#3ddc84"></i></div>
      <div style="width:620px;margin:60px auto 0"><div style="font:700 48px/1.1 var(--sans);letter-spacing:-.03em">A narrow column</div>
        <div style="margin-top:24px;font:400 22px/1.6 var(--sans);color:rgba(244,243,239,.75)">${PARA} ${PARA.slice(0, 120)}…</div></div>
      <i class="s-gut" style="position:absolute;left:0;top:54px;bottom:0;width:390px;background:repeating-linear-gradient(45deg,rgba(31,122,255,.12) 0 12px,transparent 12px 24px)"></i>
      <i class="s-gut" style="position:absolute;right:0;top:54px;bottom:0;width:390px;background:repeating-linear-gradient(45deg,rgba(31,122,255,.12) 0 12px,transparent 12px 24px)"></i>
    </div>
    <div class="abs" id="s-tr" style="left:160px;top:210px;width:1600px">
      ${[["Big headline", "tr0", "−1% to −3%", `font:700 150px/1 var(--sans)`, "Headline"], ["Body text", null, "0", `font:400 34px/1.5 var(--sans);color:rgba(244,243,239,.85)`, "Body text keeps the spacing its designer gave it."], ["Small capitals", "tr1", "+5% to +12%", `font:600 30px/1 var(--sans);text-transform:uppercase`, "Small label"]].map(([n, key, v, style, txt], k) => `
        <div class="s-row" style="display:flex;align-items:center;gap:40px;padding:${k ? 46 : 0}px 0 46px;border-bottom:1.5px solid var(--line)">
          <div style="width:300px;flex:none"><div style="font:600 34px/1.1 var(--sans)">${n}</div><div class="mono s-val" style="font-size:26px;margin-top:10px;color:var(--blue)">${v}</div></div>
          <div class="s-sample"${key ? ` data-k="${key}"` : ""} style="${style};white-space:nowrap">${txt}</div></div>`).join("")}
    </div>`);
  const para = $("#s-para", sc), val = $("#s-lhval", sc), mpara = $("#s-mpara", sc), count = $("#s-count", sc);
  const cw = metrics(BODY, 30).width(PARA) / PARA.length;   // the average letter width of the paragraph
  const samples = $$(".s-sample[data-k]", sc);
  hooks.push(t => {
    if (!live(a, b)(t)) return;
    para.style.lineHeight = S.lh; val.textContent = S.lh.toFixed(1) + "×";
    mpara.style.width = S.w + "px";
    const n = Math.round(S.w / cw), ok = n >= 45 && n <= 75;
    count.innerHTML = `≈ ${n} characters per line <span style="color:${ok ? "#3ddc84" : "#ff6b6b"};margin-left:16px">${ok ? "✓ Easy to read" : n > 75 ? "✕ Too long" : "✕ Too short"}</span>`;
    samples.forEach(s => (s.style.letterSpacing = S[s.dataset.k] + "em"));
  });
  gsap.set(["#s-tight", "#s-good", "#s-meas", "#s-screen", "#s-tr"], { autoAlpha: 0 });
  // line height: tight, then comfortable
  tl.from("#s-lh", { opacity: 0, y: 50, duration: 1.2 }, a);
  fadeIn("#s-lhside", a + .3, { y: 30 });
  tl.to(S, { lh: .95, duration: 1, ease: "glide" }, T("cramped"));
  tl.fromTo("#s-tight", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .6 }, T("cramped") + .3);
  tl.to(S, { lh: 1.5, duration: 1.2, ease: "glide" }, T("comfy"));
  tl.to("#s-tight", { autoAlpha: 0, duration: .4 }, T("comfy"));
  tl.fromTo("#s-good", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7 }, T("comfy") + .4);
  // line length: edge to edge is too long; 45-75 characters reads well
  tl.to(["#s-lh", "#s-lhside"], { autoAlpha: 0, y: -30, duration: .5, ease: "power2.in" }, T("measure") - .4);
  tl.set(S, { w: 1600 }, T("measure") - .4);
  fadeIn("#s-meas", T("measure"), { y: 30 });
  tl.to(S, { w: 66 * cw, duration: 1.4, ease: "glide" }, T("chars"));
  // on a wide screen: a narrow column
  tl.to("#s-meas", { autoAlpha: 0, y: -30, duration: .5, ease: "power2.in" }, T("column") - .3);
  fadeIn("#s-screen", T("column"), { y: 50, s: .96 });
  tl.from($$(".s-gut", sc), { opacity: 0, duration: .8, stagger: .1 }, T("column") + .7);
  // letter spacing: tighten big type, open up small capitals, leave body text alone
  tl.to("#s-screen", { autoAlpha: 0, y: -30, duration: .5, ease: "power2.in" }, T("tracking") - .4);
  tl.set("#s-tr", { autoAlpha: 1 }, T("tracking"));
  tl.from($$(".s-row", sc), { opacity: 0, y: 40, duration: .9, stagger: .12 }, T("tracking"));
  tl.to(S, { tr0: -.035, duration: 1.2, ease: "glide" }, T("tight") + .2);
  tl.to(S, { tr1: .12, duration: 1.2, ease: "glide" }, T("caps") + .2);
  light(a, "#22c1ee", "#1f7aff", "#3ddc84", .2);
}

function pairing() {
  const a = T("two"), b = T("recap");
  const CARD = (k, hf, hw, verdict, good, note) => `
    <div class="abs card p-card" style="left:${140 + k * 560}px;top:270px;width:520px;height:600px;padding:44px">
      <div class="p-h" style="font-family:${hf};font-weight:${hw};font-size:58px;line-height:1.06;letter-spacing:${hf === SERIF ? "-.01em" : "-.035em"}">The quiet power of space</div>
      <div class="p-b" style="margin-top:26px;font:400 24px/1.6 var(--sans);color:rgba(244,243,239,.78)">Good layouts breathe. Space guides the eye and gives every element room to matter.</div>
      <div class="p-v" style="position:absolute;left:44px;right:44px;bottom:40px;padding-top:22px;border-top:1.5px solid var(--line)">
        <div style="font:600 32px/1 var(--sans);color:${good ? "#3ddc84" : "#ff6b6b"}">${verdict}</div><div class="sub" style="font-size:24px;margin-top:10px">${note}</div></div>
    </div>`;
  const sc = scene("pair", a - .1, b, `
    <div class="abs h2" id="p-t" style="left:140px;top:150px">Two fonts, <span class="blue">clear contrast</span></div>
    ${CARD(0, SERIF, 700, "✓ Intentional", true, "Serif headings, sans-serif body")}
    ${CARD(1, "'Liberation Sans', Arial, sans-serif", 400, "✕ Looks like a mistake", false, "Two almost-identical sans-serifs")}
    ${CARD(2, SANS, 800, "✓ Always safe", true, "One family: size and weight do the work")}
    <div class="abs p-tag" id="p-tag-h" style="left:690px;top:330px;font:600 26px/1 var(--sans);color:var(--blue)">← Headings</div>
    <div class="abs p-tag" id="p-tag-b" style="left:690px;top:520px;font:600 26px/1 var(--sans);color:var(--blue)">← Body text</div>`);
  const cards = $$(".p-card", sc);
  gsap.set([...$$(".p-v, .p-tag", sc), "#p-t"], { autoAlpha: 0 });
  // two fonts: one for headings, one for the body
  fadeIn(cards[0], a, { y: 70 });
  tl.fromTo("#p-tag-h", { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: .7 }, T("headfont"));
  tl.fromTo("#p-tag-b", { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: .7 }, T("bodyfont"));
  textIn($("#p-t"), T("contrastp"));
  tl.set("#p-t", { autoAlpha: 1 }, T("contrastp"));
  tl.to(".p-tag", { autoAlpha: 0, duration: .4 }, T("classicpair") - .3);
  tl.fromTo($(".p-v", cards[0]), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8 }, T("classicpair") + .2);
  fadeIn(cards[1], T("similar"), { y: 70 });
  tl.fromTo($(".p-v", cards[1]), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8 }, T("similar") + 1);
  fadeIn(cards[2], T("onefamily"), { y: 70 });
  tl.fromTo($(".p-v", cards[2]), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8 }, T("onefamily") + 1.2);
  light(a, "#ffd53d", "#1f7aff", "#ff6b6b", .2);
}

const ICONS = [
  `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke-width="3"><path d="M4 14h56" stroke="#22c1ee"/><path d="M4 28h56" stroke="#1f7aff"/><path d="M4 46h56" stroke="#ffd53d"/><path d="M4 58h56" stroke="#ff6b6b"/><text x="14" y="46" font-family="Playfair Display" font-size="44" fill="${CREAM}" stroke="none">x</text></svg>`,
  `<div style="width:64px;height:64px;display:flex;align-items:center;gap:2px;font-size:34px;line-height:1"><span style="font-family:${SERIF}">A</span><span style="font-family:${SANS};font-weight:600">g</span></div>`,
  `<div style="display:flex;gap:4px;width:64px;height:64px;align-items:flex-end">${[18, 28, 40, 52, 64].map(h => `<i style="flex:1;height:${h}px;border-radius:4px;background:${h === 28 ? BLUE : CREAM}"></i>`).join("")}</div>`,
  `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="${CREAM}" stroke-width="5" stroke-linecap="round"><path d="M6 14h40M6 32h46M6 50h30"/><path d="M58 16v32M54 20l4-4 4 4M54 44l4 4 4-4" stroke="${BLUE}" stroke-width="3"/></svg>`,
  `<div style="width:64px;height:64px;display:flex;flex-direction:column;justify-content:center;line-height:1"><span style="font-family:${SERIF};font-weight:700;font-size:30px">Aa</span><span style="font-family:${BODY};font-size:20px;color:var(--mute)">Aa</span></div>`];

build({
  num: "02", name: "Typography", next: "Layout",
  fonts: ["400 100px 'Playfair Display'", "700 100px 'Playfair Display'", "400 100px 'JetBrains Mono'", "700 100px 'JetBrains Mono'", "400 100px 'Bebas Neue'"],
  chapters: ["The anatomy of a letter", "The main kinds of font", "Size & weight", "Spacing", "Pairing fonts"],
  scenes() {
    title();
    chapterCard(1, "one", "The anatomy of a letter", T("ch1"), T("lines"));
    anatomy();
    chapterCard(2, "two", "The main kinds of font", T("ch2"), T("serif"));
    kinds();
    chapterCard(3, "three", "Size and weight", T("ch3"), T("random"));
    sizes(); weights();
    chapterCard(4, "four", "Spacing", T("ch4"), T("leading"));
    spacing();
    chapterCard(5, "five", "Pairing fonts", T("ch5"), T("two"));
    pairing();
  },
  recap: {
    kicker: "Typography, in five rules",
    lines: ["Letters sit on five guide lines; the x-height matters most.", "Serif is classic, sans-serif modern, mono technical, display loud.", "Pick sizes from a type scale, with 16 px body text.", "Line height about 1.5, and 45 to 75 characters a line.", "Pair two clearly different fonts, or one family."],
    icons: ICONS, light: ["#1f7aff", "#8c5cff", "#22c1ee"]
  },
  outro: { title: "That’s typography.", size: 196, tryit: 'Now try it yourself in <span class="blue">Canvas.</span>' }
});
