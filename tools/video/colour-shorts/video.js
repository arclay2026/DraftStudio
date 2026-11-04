// The Colour lesson as five vertical Shorts (1080×1920), one per rule. Each Short is the lesson's own
// recording between two chapter cues, with the scenes laid out for a phone: the visual in the middle,
// the words under it, everything clear of the top 240 px and bottom 420 px that the apps cover.
// ?part=1…5 builds one Short; render-shorts.sh renders all five.
const PARTS = [
  { ch: "ch1", next: "ch2", first: "wheel", title: "The colour wheel", color: "#ff5a4e", fn: () => wheelV() },
  { ch: "ch2", next: "ch3", first: "hsl", title: "Hue, saturation<br>&amp; lightness", color: "#22c1ee", fn: () => hslV() },
  { ch: "ch3", next: "ch4", first: "harmony", title: "Colour harmonies", color: "#ffd53d", fn: () => harmV() },
  { ch: "ch4", next: "ch5", first: "messy", title: "The 60 · 30 · 10 rule", color: "#3ddc84", fn: () => ruleV() },
  { ch: "ch5", next: "recap", first: "contrast", title: "Contrast keeps<br>text readable", color: BLUE, fn: () => contrastV() }];
const PART = Math.min(5, Math.max(1, +(new URLSearchParams(location.search).get("part") || 1)));
const P = PARTS[PART - 1];
// the window this Short covers: from just before "Part one…" to the end card after its last word
window.CLIP = { from: +(T(P.ch) - .1).toFixed(2), voiceEnd: T(P.next) - .15, to: +(T(P.next) + 2.8).toFixed(2) };

// ---------- the frame every Short shares ----------
function opener() {
  const a = T(P.ch), f = T(P.first);
  // a cover, full from the first frame: the rule number and its name
  scene("open", a - 1.3, f, `
    <div class="abs mono" id="op-k" style="left:0;right:0;top:420px;text-align:center;font-size:26px;letter-spacing:.4em;color:${P.color}">COLOUR · RULE ${PART} OF 5</div>
    <div class="abs" id="op-n" style="left:0;right:0;top:500px;text-align:center;font:700 460px/1 var(--sans);letter-spacing:-.06em;color:transparent;-webkit-text-stroke:3px rgba(244,243,239,.55)">0${PART}</div>
    <i class="abs" id="op-line" style="left:240px;width:600px;top:1010px;height:4px;border-radius:2px;background:${P.color};transform-origin:50% 50%"></i>
    <div class="abs h1" id="op-t" style="left:60px;right:60px;top:1060px;text-align:center;font-size:104px">${P.title}</div>`);
  tl.from("#op-n", { yPercent: 25, opacity: 0, duration: 1, ease: "silk" }, a - 1.3);
  tl.from("#op-line", { scaleX: 0, duration: .9, ease: "glide" }, a - 1.2);
  tl.from(["#op-k", "#op-t"], { y: 30, opacity: 0, duration: .9, stagger: .1 }, a - 1.2);
  // the running header, once the lesson starts
  scene("hdr", f - .4, T(P.next) - .2, `
    <div class="abs mono" id="hd-k" style="left:80px;top:270px;font-size:24px;letter-spacing:.34em;color:${P.color}">COLOUR · RULE ${PART} / 5</div>
    <div class="abs" id="hd-t" style="left:80px;top:310px;width:920px;font:600 58px/1.04 var(--sans);letter-spacing:-.035em">${P.title.replace("<br>", " ")}</div>`);
  tl.from(["#hd-k", "#hd-t"], { y: 20, opacity: 0, duration: .8, stagger: .08 }, f - .4);
}
function endCard() {
  const e = T(P.next), nx = PARTS[PART];
  const s = scene("endc", e - .3, null, `
    <div class="abs" id="ec-logo" style="left:240px;top:640px;width:600px">${LOGO.replace("<svg ", '<svg width="600" ')}</div>
    <div class="abs mono" id="ec-k" style="left:0;right:0;top:900px;text-align:center;font-size:26px;letter-spacing:.34em;color:var(--mute)">${nx ? `NEXT · RULE ${PART + 1} OF 5` : "ALL 5 RULES DONE"}</div>
    <div class="abs h2" id="ec-t" style="left:60px;right:60px;top:950px;text-align:center;font-size:72px">${nx ? nx.title : "That’s colour."}</div>
    <div class="abs sub" id="ec-f" style="left:0;right:0;top:${nx && nx.title.includes("<br>") ? 1130 : 1060}px;text-align:center">${nx ? "Follow so you don’t miss it." : "Follow for more design lessons."}</div>`);
  tl.from("#ec-logo", { scale: .85, opacity: 0, filter: "blur(14px)", duration: 1, ease: "silk" }, e - .2);
  tl.from(["#ec-k", "#ec-t", "#ec-f"], { y: 30, opacity: 0, duration: .9, stagger: .12 }, e + .3);
  light(e - .3, "#0d2a5c", "#0b1430", P.color, .4);
}

// ---------- 1 · the colour wheel ----------
function wheelV() {
  const a = T("wheel"), b = T("ch2");
  const HUES = Array.from({ length: 12 }, (_, k) => k * 30);
  const seg = (r0, r1, a0, a1) => {
    const [x0, y0] = polar(r1, a0), [x1, y1] = polar(r1, a1), [x2, y2] = polar(r0, a1), [x3, y3] = polar(r0, a0);
    return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
  };
  const NAMES = { 0: "Red", 1: "Orange", 2: "Yellow", 4: "Green", 8: "Blue", 9: "Violet" };
  const s = scene("wheel", a - .3, b, `
    <svg class="abs" id="w-svg" style="left:190px;top:420px;width:700px;height:700px;overflow:visible" viewBox="-410 -410 820 820">
      ${HUES.map(h => `<g class="w-seg"><path d="${seg(190, 330, h - 14.2, h + 14.2)}" fill="${hsl(h, 88, 56)}"/></g>`).join("")}
      <line id="w-opp" x1="0" y1="-352" x2="0" y2="352" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"/>
      <line id="w-split" x1="${polar(370, 105)[0]}" y1="${polar(370, 105)[1]}" x2="${polar(370, 285)[0]}" y2="${polar(370, 285)[1]}" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"/>
      ${Object.entries(NAMES).map(([k, n]) => { const [x, y] = polar(388, k * 30); return `<text class="w-name" x="${x}" y="${y + 10}" fill="${CREAM}" font-size="32" font-weight="600" text-anchor="${Math.abs(x) < 30 ? "middle" : x > 0 ? "start" : "end"}" font-family="Inter Display">${n}</text>`; }).join("")}
      <g id="w-mid"><text y="16" font-size="132" font-weight="600" text-anchor="middle" fill="${CREAM}" font-family="Inter Display" letter-spacing="-6">12</text>
        <text y="66" font-size="28" text-anchor="middle" fill="rgba(244,243,239,.55)" font-family="Inter Display" font-weight="500">hues</text></g>
    </svg>
    <div class="abs" id="w-txt" style="left:80px;top:1170px;width:920px;height:330px">
      <div class="h2" id="w-t1">Twelve pure colours</div><div class="abs sub" id="w-s1" style="top:96px;width:920px">Arranged in a circle.</div>
      <div class="abs h2" id="w-t2" style="top:0">Neighbours</div><div class="abs sub" id="w-s2" style="top:96px;width:920px">Side by side. They share a base, so they blend smoothly.</div>
      <div class="abs" id="w-blend" style="top:210px;width:920px;height:100px;border-radius:28px;background:linear-gradient(90deg, ${hsl(240, 88, 56)}, ${hsl(210, 88, 56)})"></div>
      <div class="abs h2" id="w-t3" style="top:0">Opposites</div><div class="abs sub" id="w-s3" style="top:96px;width:920px">Straight across. As different as two colours can be.</div>
      <div class="abs" id="w-pair" style="top:210px;display:flex;gap:20px">
        <i style="width:450px;height:100px;border-radius:28px;background:${hsl(0, 88, 56)}"></i><i style="width:450px;height:100px;border-radius:28px;background:${hsl(180, 88, 50)}"></i></div>
      <div class="abs" style="left:0;right:0;top:232px;text-align:center"><span class="kicker" id="w-energy" style="display:inline-block;padding:16px 26px;border-radius:999px;background:rgba(11,11,13,.82);color:#fff">Contrast &amp; energy</span></div>
      <div class="abs h2" id="w-t4" style="top:0">Warm &amp; cool</div><div class="abs sub" id="w-s4" style="top:96px;width:920px">The wheel splits in two.</div>
      ${[["warm", "Warm", "Energetic · Urgent", "Food brands", [0, 30, 50]], ["cool", "Cool", "Calm · Trustworthy", "Banks &amp; tech", [150, 200, 230]]].map(([id, t, w, ex, hs], k) => `
        <div class="abs card" id="w-${id}" style="left:${k * 470}px;top:180px;width:450px;height:330px;padding:30px 32px">
          <div style="display:flex;gap:10px">${hs.map(h => `<i class="chip" style="margin:0;width:44px;height:44px;border-radius:13px;background:${hsl(h, 88, 56)}"></i>`).join("")}</div>
          <div style="font:600 58px/1 var(--sans);letter-spacing:-.04em;margin-top:30px">${t}</div>
          <div class="sub" style="font-size:26px;margin-top:10px">${w}</div>
          <div class="w-ex" style="position:absolute;left:32px;right:32px;bottom:28px;padding-top:18px;border-top:1.5px solid var(--line);font-size:26px;font-weight:600">${ex}</div></div>`).join("")}
    </div>`);
  const segs = $$(".w-seg", s);
  tl.from(segs, { scale: .5, rotation: -40, opacity: 0, svgOrigin: "0 0", duration: 1.4, stagger: .055, ease: "silk" }, a);
  textIn($("#w-t1"), a + .1); textIn($("#w-s1"), a + .35);
  gsap.set(["#w-opp", "#w-split"], { drawSVG: "50% 50%", autoAlpha: 0 });
  const names = $$(".w-name", s);
  ["c_red", "c_orange", "c_yellow", "c_green", "c_blue", "c_violet"].forEach((c, k) => tl.from(names[k], { opacity: 0, y: 14, duration: .7 }, T(c) - .05));
  tl.from("#w-mid", { opacity: 0, scale: .6, svgOrigin: "0 0", duration: 1.2 }, T("circle") - .2);
  const state = (at, on, push) => segs.forEach((g, k) => {
    const hi = !on || on.includes(k), [x, y] = polar(hi ? push || 0 : 0, k * 30);
    tl.to(g, { opacity: hi ? 1 : .14, x, y, duration: 1, ease: "silk" }, at);
  });
  tl.to([...names, "#w-mid"], { opacity: 0, duration: .6 }, T("neighbours") - .2);
  state(T("neighbours") - .2, [7, 8], 26);
  textOut($("#w-t1"), T("neighbours") - .4); textOut($("#w-s1"), T("neighbours") - .4);
  textIn($("#w-t2"), T("neighbours")); textIn($("#w-s2"), T("blend") - .2);
  tl.fromTo("#w-blend", { autoAlpha: 0, clipPath: "inset(0 100% 0 0 round 28px)" }, { autoAlpha: 1, clipPath: "inset(0 0% 0 0 round 28px)", duration: 1.4, ease: "glide" }, T("blend"));
  state(T("opposites") - .2, [0, 6], 26);
  tl.set("#w-opp", { autoAlpha: 1 }, T("opposites"));
  tl.to("#w-opp", { drawSVG: "0% 100%", duration: 1.1, ease: "glide" }, T("opposites"));
  textOut($("#w-t2"), T("opposites") - .4); textOut($("#w-s2"), T("opposites") - .4); fadeOut("#w-blend", T("opposites") - .4);
  textIn($("#w-t3"), T("opposites")); textIn($("#w-s3"), T("opposites") + .3);
  gsap.set(["#w-pair", "#w-energy"], { autoAlpha: 0 });
  tl.set("#w-pair", { autoAlpha: 1 }, T("energy") - .3);
  fadeIn($$("#w-pair i"), T("energy") - .3, { y: 40, st: .12 });
  tl.set("#w-energy", { autoAlpha: 1 }, T("energy") + .5);
  textIn($("#w-energy"), T("energy") + .5);
  // warm & cool: the wheel shrinks up, the words and two cards take the space below
  state(T("split") - .2, null, 0);
  tl.to("#w-opp", { drawSVG: "50% 50%", duration: .6, ease: "power2.in" }, T("split") - .4);
  tl.set("#w-opp", { autoAlpha: 0 }, T("split") + .2);
  tl.to("#w-svg", { y: -150, scale: .66, transformOrigin: "50% 50%", duration: 1.2, ease: "glide" }, T("split") - .3);
  tl.to("#w-txt", { y: -260, duration: 1.2, ease: "glide" }, T("split") - .3);
  tl.set("#w-split", { autoAlpha: 1 }, T("split") + .1);
  tl.to("#w-split", { drawSVG: "0% 100%", duration: 1.2, ease: "glide" }, T("split") + .1);
  [["#w-t3"], ["#w-s3"], ["#w-energy"]].forEach(([n]) => textOut($(n), T("split") - .5));
  fadeOut("#w-pair", T("split") - .5);
  textIn($("#w-t4"), T("split")); textIn($("#w-s4"), T("split") + .3);
  state(T("warm") - .1, [10, 11, 0, 1, 2, 3], 24);
  fadeIn("#w-warm", T("warm"), { y: 60 });
  tl.from("#w-warm .w-ex", { opacity: 0, x: -20, duration: .8 }, T("food"));
  tl.to("#w-warm", { borderColor: "rgba(255,120,60,.6)", duration: .8 }, T("food"));
  state(T("cool") - .1, [4, 5, 6, 7, 8, 9], 24);
  fadeIn("#w-cool", T("cool"), { y: 60 });
  tl.to("#w-warm", { opacity: .45, borderColor: "rgba(244,243,239,.14)", duration: .8 }, T("cool"));
  tl.from("#w-cool .w-ex", { opacity: 0, x: -20, duration: .8 }, T("banks"));
  tl.to("#w-cool", { borderColor: "rgba(31,122,255,.7)", duration: .8 }, T("banks"));
  light(T("ch1") - 1.3, "#ff4d4d", "#22c1ee", "#ffd53d", .26);
  tl.to(orbs[0], { "--c": "#ff7a3d", duration: 2 }, T("warm"));
  tl.to(orbs[1], { "--c": "#1f7aff", duration: 2 }, T("cool"));
}

// ---------- 2 · hue, saturation and lightness ----------
function hslV() {
  const a = T("hsl"), b = T("ch3");
  const S = { h: 215, s: 85, l: 55 };
  const ROWS = [["Hue", "Which colour · 0–360°"], ["Saturation", "How strong · grey → vivid"], ["Lightness", "How light · black → white"]];
  const sc = scene("hslsc", a - .3, b, `
    <div class="abs" id="h-sw" style="left:300px;top:430px;width:480px;height:480px;border-radius:110px"></div>
    <div class="abs" id="h-ui" style="left:160px;top:430px;width:760px;height:560px;padding:64px 70px;color:hsl(215 60% 15%)">
      <div style="display:flex;align-items:center;gap:16px;font:600 26px/1 var(--sans)"><i style="width:40px;height:40px;border-radius:12px;background:hsl(215 85% 55%)"></i>Bluebird</div>
      <div style="font:600 70px/1.02 var(--sans);letter-spacing:-.045em;margin-top:56px">Fresh ideas,<br>every day.</div>
      <div style="margin-top:28px;display:grid;gap:14px"><i style="height:16px;width:520px;border-radius:8px;background:hsl(215 40% 45% / .45)"></i><i style="height:16px;width:420px;border-radius:8px;background:hsl(215 40% 45% / .45)"></i></div>
      <div style="position:absolute;left:70px;bottom:64px;padding:24px 44px;border-radius:999px;background:hsl(215 85% 55%);color:#fff;font:600 30px/1 var(--sans)">Get started</div>
      <i class="h-ring" id="h-r0" style="position:absolute;inset:-14px;border-radius:62px"></i>
      <i class="h-ring" id="h-r1" style="position:absolute;left:56px;bottom:50px;width:276px;height:106px;border-radius:999px"></i>
      <i class="h-ring" id="h-r2" style="position:absolute;left:56px;top:140px;width:470px;height:180px;border-radius:24px"></i>
    </div>
    <div class="abs mono" id="h-ro" style="left:0;right:0;top:950px;text-align:center;font-size:42px"></div>
    ${ROWS.map(([n, c], k) => `
      <div class="abs h-row" style="left:80px;top:${1040 + k * 150}px;width:920px">
        <div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font:600 46px/1 var(--sans);letter-spacing:-.035em">${n}</div><div class="mono h-val" style="font-size:36px"></div></div>
        <div class="h-track" style="position:relative;margin-top:22px;height:20px;border-radius:10px"><i class="h-knob" style="position:absolute;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;border:6px solid ${CREAM};box-shadow:0 10px 30px rgba(0,0,0,.45)"></i></div>
        <div class="sub" style="font-size:24px;margin-top:16px">${c}</div></div>`).join("")}
    <div class="abs h1" id="h-keep" style="left:80px;top:1060px;width:920px;font-size:96px">Keep the <span class="blue">hue.</span></div>
    <div class="abs h1" id="h-change" style="left:80px;top:1180px;width:920px;font-size:96px">Change the other two.</div>
    ${[["Soft background", 95], ["Bright button", 55], ["Deep text", 15]].map(([n, l], k) => `
      <div class="abs h-fam" style="left:160px;top:${1040 + k * 128}px;display:flex;align-items:center;gap:28px">
        <i style="width:92px;height:92px;border-radius:26px;background:hsl(215 ${k === 2 ? 60 : 85}% ${l}%);border:1.5px solid var(--line)"></i>
        <div><div style="font:600 46px/1.05 var(--sans);letter-spacing:-.03em">${n}</div><div class="mono dim" style="font-size:24px;margin-top:8px">hsl(215, ${k === 2 ? 60 : 85}%, ${l}%)</div></div></div>`).join("")}
    <div class="abs" id="h-badge" style="left:160px;top:1428px;padding:16px 28px;border-radius:999px;border:1.5px solid rgba(31,122,255,.6);font:600 28px/1 var(--sans)"><span class="blue">Same hue</span> · 215°</div>`);
  gsap.set($$(".h-ring", sc), { boxShadow: `0 0 0 4px ${BLUE}`, opacity: 0 });
  const rows = $$(".h-row", sc), vals = $$(".h-val", sc), tracks = $$(".h-track", sc), knobs = $$(".h-knob", sc);
  tracks[0].style.background = `linear-gradient(90deg, ${Array.from({ length: 13 }, (_, k) => hsl(k * 30, 85, 55)).join(",")})`;
  hooks.push(t => {
    if (!live(a - .3, b)(t)) return;
    const { h, s, l } = S, hh = Math.round(h), c = hsl(h, s, l);
    $("#h-sw").style.background = c;
    $("#h-ro").innerHTML = `hsl(<span style="color:${hsl(h, 85, 65)}">${hh % 360 === 0 && h > 1 ? 360 : hh}</span>, ${Math.round(s)}%, ${Math.round(l)}%)`;
    vals[0].textContent = `${hh}°`; vals[1].textContent = `${Math.round(s)}%`; vals[2].textContent = `${Math.round(l)}%`;
    tracks[1].style.background = `linear-gradient(90deg, ${hsl(h, 0, l)}, ${hsl(h, 100, l)})`;
    tracks[2].style.background = `linear-gradient(90deg, ${hsl(h, s, 0)}, ${hsl(h, s, 50)}, ${hsl(h, s, 100)})`;
    [h / 360, s / 100, l / 100].forEach((p, k) => { knobs[k].style.left = p * 100 + "%"; knobs[k].style.background = c; });
  });
  tl.from("#h-sw", { scale: .6, opacity: 0, duration: 1.3 }, a);
  fadeIn(rows, a + .2, { y: 0, st: .12 }); tl.from(rows, { x: 80, duration: 1.2, stagger: .12 }, a + .2);
  fadeIn("#h-ro", a + .6, { y: 20 });
  const focus = (k, at) => rows.forEach((r, j) => tl.to(r, { opacity: j === k ? 1 : .28, duration: .6 }, at));
  focus(0, T("hue") - .2);
  tl.to(S, { h: 0, duration: 1.4, ease: "glide" }, T("hue"));
  tl.to(S, { h: 360, duration: 2.6, ease: "glide" }, T("degrees"));
  tl.set(S, { h: 0 }, T("degrees") + 2.65);
  tl.to(S, { h: 215, duration: 1.2, ease: "glide" }, T("degrees") + 2.7);
  focus(1, T("sat") - .2);
  tl.to(S, { s: 0, duration: 1.3, ease: "glide" }, T("sat"));
  tl.to(S, { s: 100, duration: 2, ease: "glide" }, T("grey"));
  tl.to(S, { s: 85, duration: .8, ease: "glide" }, T("grey") + 2.05);
  focus(2, T("light") - .2);
  tl.to(S, { l: 6, duration: 1.3, ease: "glide" }, T("light"));
  tl.to(S, { l: 96, duration: 2.2, ease: "glide" }, T("bw"));
  tl.to(S, { l: 55, duration: 1, ease: "glide" }, T("bw") + 2.25);
  fadeOut([...rows, "#h-ro"], T("trick") - .3, { st: .06 });
  textIn($("#h-keep"), T("keep"));
  textIn($("#h-change"), T("change"));
  textOut($("#h-keep"), T("family") - .3); textOut($("#h-change"), T("family") - .3);
  tl.to("#h-sw", { left: 160, width: 760, height: 560, borderRadius: 48, duration: 1.2, ease: "glide" }, T("family"));
  tl.to(S, { l: 95, duration: 1.2, ease: "glide" }, T("family"));
  gsap.set("#h-ui > :not(.h-ring)", { opacity: 0 });
  tl.fromTo("#h-ui > :not(.h-ring)", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: .1 }, T("family") + .7);
  const fam = $$(".h-fam", sc);
  ["f_bg", "f_btn", "f_text"].forEach((c, k) => {
    fadeIn(fam[k], T(c), { y: 30 });
    tl.to(`#h-r${k}`, { opacity: 1, duration: .5 }, T(c));
    tl.to(`#h-r${k}`, { opacity: 0, duration: .6 }, T(c) + 1.6);
  });
  fadeIn("#h-badge", T("match"), { y: 30 });
  tl.to("#h-badge", { borderColor: BLUE, boxShadow: "0 0 60px rgba(31,122,255,.35)", duration: 1 }, T("match") + .6);
  light(T("ch2") - 1.3, "#1f7aff", "#0e3a8a", "#22c1ee", .3);
}

// ---------- 3 · harmonies ----------
function harmV() {
  const a = T("harmony"), b = T("ch4");
  const D = { a: 215, b: 215, c: 215, bv: 0, cv: 0, av: 0, rot: 0 };
  const R = 298, CX = 320;
  const RECIPES = [["Complementary", "Two opposites · bold, eye-catching"], ["Analogous", "Three neighbours · calm, natural"], ["Triadic", "Evenly spaced · playful, balanced"]];
  const sc = scene("harm", a - .3, b, `
    <div class="abs" id="r-ring" style="left:220px;top:420px;width:640px;height:640px;border-radius:50%;
      background:conic-gradient(${Array.from({ length: 13 }, (_, k) => hsl(k * 30, 88, 56)).join(",")});
      -webkit-mask:radial-gradient(circle, transparent calc(50% - 45px), #000 calc(50% - 44px));mask:radial-gradient(circle, transparent calc(50% - 45px), #000 calc(50% - 44px))"></div>
    <div class="abs" id="r-pal" style="left:345px;top:695px;display:flex;gap:10px">${"<i></i>".repeat(5)}</div>
    <div class="abs" id="r-dots" style="left:220px;top:420px;width:640px;height:640px">
      <svg width="640" height="640" style="position:absolute;inset:0;overflow:visible"><path id="r-line" fill="rgba(244,243,239,.06)" stroke="${CREAM}" stroke-width="3" stroke-linejoin="round"/></svg>
      ${["a", "b", "c"].map(k => `<i class="r-dot" id="r-${k}" style="position:absolute;width:64px;height:64px;margin:-32px 0 0 -32px;border-radius:50%;border:7px solid ${CREAM};box-shadow:0 12px 30px rgba(0,0,0,.5)"></i>`).join("")}
    </div>
    ${RECIPES.map(([n, d], k) => `
      <div class="abs r-row" style="left:80px;top:${1120 + k * 122}px;width:920px;padding-left:32px">
        <i class="r-bar" style="position:absolute;left:0;top:6px;width:5px;height:86px;border-radius:3px;background:${BLUE}"></i>
        <div style="font:600 50px/1.05 var(--sans);letter-spacing:-.035em">${n}</div><div class="sub" style="font-size:27px;margin-top:8px">${d}</div></div>`).join("")}`);
  const pal = $$("#r-pal i", sc);
  pal.forEach(p => p.style.cssText = "width:70px;height:90px;border-radius:18px;transform-origin:50% 100%");
  const dots = ["a", "b", "c"].map(k => $("#r-" + k, sc)), rows = $$(".r-row", sc);
  const mode = t => t < T("analog") - .1 ? 0 : t < T("triad") - .1 ? 1 : 2;
  hooks.push(t => {
    if (!live(a - .3, b)(t)) return;
    const m = mode(t), A = [D.a + D.rot, D.b + D.rot, D.c + D.rot], V = [D.av, D.bv, D.cv];
    const pts = A.map(h => { const [x, y] = polar(R, h); return [CX + x, CX + y]; });
    dots.forEach((d, k) => { d.style.left = pts[k][0] + "px"; d.style.top = pts[k][1] + "px"; d.style.background = hsl(A[k], 88, 56);
      d.style.transform = `scale(${V[k]})`; d.style.opacity = Math.min(1, V[k] * 1.5); });
    const p = (m === 0 ? [0, 1] : [0, 1, 2]).map(k => pts[k]);
    $("#r-line").setAttribute("d", D.bv < .02 ? "" : "M" + p.map(q => q.join(" ")).join("L") + (m === 2 ? "Z" : ""));
    $("#r-line").style.opacity = Math.min(D.bv, m === 0 ? 1 : D.cv);
    const [h1, h2, h3] = A;
    const PAL = [[hsl(h1, 75, 22), hsl(h1, 85, 52), hsl(h1, 70, 86), hsl(h2, 95, 55), hsl(h2, 90, 84)],
      [hsl(h3, 70, 36), hsl(h3, 65, 60), hsl(h2, 75, 46), hsl(h1, 85, 52), hsl(h1, 60, 88)],
      [hsl(h1, 85, 52), hsl(h2, 82, 58), hsl(h3, 80, 52), hsl(h1, 55, 16), hsl(h3, 40, 93)]][m];
    pal.forEach((s, k) => s.style.background = PAL[k]);
  });
  tl.from("#r-ring", { rotation: -120, scale: .7, opacity: 0, duration: 1.8, ease: "silk" }, a);
  fadeIn(rows, a + .3, { y: 30, st: .1 });
  tl.to(rows, { opacity: .3, duration: .6 }, T("where"));
  tl.to(D, { av: 1, duration: .9, ease: "pop" }, T("where") + .3);
  const pick = (k, at) => { rows.forEach((r, j) => tl.to(r, { opacity: j === k ? 1 : .3, duration: .6 }, at));
    tl.fromTo(pal, { scaleY: 0 }, { scaleY: 1, duration: .8, stagger: .06, ease: "silk" }, at + .3);
    tl.set("#r-pal", { autoAlpha: 1 }, at + .3); };
  gsap.set("#r-pal", { autoAlpha: 0 });
  pick(0, T("comp") - .1);
  tl.to(D, { bv: 1, duration: .6, ease: "power2.out" }, T("comp"));
  tl.fromTo(D, { b: 215 }, { b: 35, duration: 1.5, ease: "glide" }, T("comp"));
  tl.to("#r-pal", { scale: 1.06, transformOrigin: "50% 50%", duration: .4, yoyo: true, repeat: 1, ease: "power2.inOut" }, T("comp2"));
  pick(1, T("analog") - .1);
  tl.to(D, { b: 180, duration: 1.4, ease: "glide" }, T("analog"));
  tl.set(D, { c: 215 }, T("analog") - .01);
  tl.to(D, { cv: 1, duration: .6, ease: "power2.out" }, T("analog"));
  tl.to(D, { c: 150, duration: 1.4, ease: "glide" }, T("analog") + .1);
  pick(2, T("triad") - .1);
  tl.to(D, { b: 335, c: 95, duration: 1.6, ease: "glide" }, T("triad"));
  tl.to(rows, { opacity: 1, duration: .6 }, T("pick"));
  tl.to(D, { rot: 150, duration: 4.2, ease: "glide" }, T("pick"));
  light(T("ch3") - 1.3, "#ffd53d", "#8c5cff", "#3ddc84", .24);
}

// ---------- 4 · the 60-30-10 rule ----------
function ruleV() {
  const a = T("messy"), b = T("ch5");
  const CRM = "#efe5cf", GRN = "#1d4a39", ORG = "#ff6b1a";
  const sc = scene("rule", a - .3, b, `
    <div class="abs" id="p" style="left:250px;top:410px;width:580px;height:780px;border-radius:30px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.55);transform:scale(.8);transform-origin:50% 0">
      <div class="abs" id="p-bg" style="inset:0;background:${CRM}"></div>
      <div class="abs" id="p-head" style="left:0;top:0;width:580px;height:330px;background:${GRN};padding:56px 52px;color:${CRM}">
        <div class="mono" style="font-size:18px;letter-spacing:.3em;opacity:.7">SINCE 2019</div>
        <div style="font:700 84px/.96 var(--sans);letter-spacing:-.05em;margin-top:30px">Morning<br>Roast</div></div>
      <div class="abs" id="p-cup" style="left:190px;top:380px;width:200px;height:200px;border-radius:50%;border:30px solid ${GRN}"></div>
      <div class="abs" id="p-lines" style="left:52px;top:630px;display:grid;gap:14px"><i style="width:300px;height:14px;border-radius:7px;background:${GRN};opacity:.75"></i><i style="width:220px;height:14px;border-radius:7px;background:${GRN};opacity:.75"></i></div>
      <div class="abs" id="p-btn" style="right:44px;bottom:44px;padding:26px 40px;border-radius:999px;background:${ORG};color:#fff;font:700 28px/1 var(--sans)">Order now</div>
      <div class="abs" id="p-new" style="right:40px;top:270px;width:118px;height:118px;border-radius:50%;background:${ORG};color:#fff;display:grid;place-items:center;font:700 28px/1 var(--sans);transform:rotate(-12deg)">New</div>
      <div class="abs" id="pm" style="inset:0">
        <i class="pm-b" style="position:absolute;left:0;top:0;width:100%;height:34%;background:${GRN}"></i><i class="pm-b" style="position:absolute;left:0;top:34%;width:100%;height:33%;background:${ORG}"></i><i class="pm-b" style="position:absolute;left:0;top:67%;width:100%;height:33%;background:${CRM}"></i>
        <div style="position:absolute;left:52px;top:60px;font:700 84px/.96 var(--sans);letter-spacing:-.05em;color:${ORG}">Morning<br><span style="color:${CRM}">Roast</span></div>
        <div style="position:absolute;left:52px;top:400px;padding:26px 40px;border-radius:999px;background:${GRN};color:${ORG};font:700 28px/1 var(--sans)">Order now</div>
        <div style="position:absolute;right:52px;bottom:70px;width:200px;height:200px;border-radius:50%;border:30px solid ${ORG}"></div></div>
    </div>
    <div class="abs h2" id="u-eq" style="left:80px;top:1100px;width:920px">Equal amounts look messy.</div>
    ${[["60%", "Dominant", "The background and large areas"], ["30%", "Secondary", "Structure: headers, shapes, text"], ["10%", "Accent", "Buttons and key details"]].map(([n, t, d], k) => `
      <div class="abs u-num" style="left:80px;top:1060px;width:920px;display:flex;align-items:flex-end;gap:34px">
        <div class="u-big" style="font:700 200px/.86 var(--sans);letter-spacing:-.06em;color:${[CREAM, "#5fb38c", ORG][k]}">${n}</div>
        <div style="padding-bottom:6px"><div class="u-t" style="font:600 54px/1.05 var(--sans);letter-spacing:-.035em">${t}</div>
        <div class="sub u-d" style="margin-top:8px;font-size:28px">${d}</div></div></div>`).join("")}
    <div class="abs" id="u-bar" style="left:80px;top:1340px;width:920px;height:72px;display:flex;gap:8px">
      <i class="u-seg" style="width:33.33%;border-radius:22px 8px 8px 22px;background:${CRM}"></i><i class="u-seg" style="width:33.33%;border-radius:8px;background:${GRN};box-shadow:inset 0 0 0 2px rgba(244,243,239,.25)"></i><i class="u-seg" style="width:33.33%;border-radius:8px 22px 22px 8px;background:${ORG}"></i></div>
    <div class="abs mono dim" id="u-leg" style="left:80px;top:1432px;width:920px;display:flex;font-size:24px;letter-spacing:.1em"><span style="width:60%">60</span><span style="width:30%">30</span><span>10</span></div>
    <div class="abs h1" id="u-calm" style="left:80px;top:1080px;width:920px;font-size:96px">Uneven amounts.<br><span class="dim">Calm and clear.</span></div>`);
  const segs = $$(".u-seg", sc), nums = $$(".u-num", sc);
  gsap.set(["#p-head", "#p-cup", "#p-lines", "#p-btn", "#p-new", ...nums, "#u-leg"], { autoAlpha: 0 });
  tl.from("#p", { y: 80, opacity: 0, duration: 1.4 }, a);
  tl.from($$(".pm-b", sc), { scaleY: 0, transformOrigin: "50% 0", duration: 1, stagger: .12, ease: "silk" }, a + .2);
  textIn($("#u-eq"), a + .2);
  tl.from(segs, { scaleX: 0, transformOrigin: "0 50%", duration: 1.1, stagger: .1 }, a + .5);
  textOut($("#u-eq"), T("r60") - .4);
  tl.to($$(".pm-b, #pm > div", sc), { scaleY: 0, transformOrigin: "50% 100%", opacity: 0, duration: .8, stagger: .05, ease: "power3.in" }, T("r60") - .3);
  const num = (k, at) => { const n = nums[k];
    tl.set(n, { autoAlpha: 1 }, at);
    tl.from($(".u-big", n), { yPercent: 60, opacity: 0, duration: 1.2 }, at);
    tl.from([$(".u-t", n), $(".u-d", n)], { y: 30, opacity: 0, duration: 1, stagger: .12 }, at + .2);
    if (k < 2) tl.to(n, { autoAlpha: 0, y: -30, duration: .5, ease: "power2.in" }, T(["r30", "r10"][k]) - .4); };
  num(0, T("r60"));
  tl.to(segs[0], { width: "60%", duration: 1.3, ease: "glide" }, T("r60"));
  tl.to([segs[1], segs[2]], { width: "20%", duration: 1.3, ease: "glide" }, T("r60"));
  num(1, T("r30"));
  tl.to(segs[1], { width: "30%", duration: 1.2, ease: "glide" }, T("r30"));
  tl.to(segs[2], { width: "10%", duration: 1.2, ease: "glide" }, T("r30"));
  tl.fromTo("#p-head", { autoAlpha: 0, yPercent: -100 }, { autoAlpha: 1, yPercent: 0, duration: 1.2, ease: "silk" }, T("r30b") - .2);
  tl.fromTo(["#p-cup", "#p-lines"], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1, stagger: .15 }, T("r30b"));
  num(2, T("r10"));
  tl.fromTo(segs[2], { boxShadow: "0 0 0 0 rgba(255,107,26,0)" }, { boxShadow: "0 0 40px 6px rgba(255,107,26,.6)", duration: .6, yoyo: true, repeat: 1 }, T("r10") + .2);
  tl.fromTo(["#p-btn", "#p-new"], { autoAlpha: 0, scale: .3 }, { autoAlpha: 1, scale: 1, duration: .9, stagger: .2, ease: "pop" }, T("r10b"));
  tl.set("#p-new", { rotation: -12 }, T("r10b"));
  fadeIn("#u-leg", T("r10b") + .4, { y: 10 });
  tl.to(nums[2], { autoAlpha: 0, y: -30, duration: .5, ease: "power2.in" }, T("uneven") - .4);
  textIn($("#u-calm"), T("uneven"));
  light(T("ch4") - 1.3, "#ff6b1a", "#1d4a39", "#efe5cf", .22);
}

// ---------- 5 · contrast ----------
function contrastV() {
  const a = T("contrast"), b = T("recap");
  const lum = rgb => { const c = rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  const ratioOf = (x, y) => { const [p, q] = [lum(x), lum(y)].sort((m, n) => n - m); return (p + .05) / (q + .05); };
  const rgbOf = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const K = { l: 94 };
  const sc = scene("contr", a - .3, b, `
    <div class="abs" id="k-card" style="left:80px;top:420px;width:920px;height:560px;border-radius:48px;background:${CREAM};padding:64px 72px">
      <div id="k-aa" style="font:600 270px/1 var(--sans);letter-spacing:-.06em">Aa</div>
      <div id="k-cap" style="font:500 36px/1.3 var(--sans);margin-top:30px;letter-spacing:-.015em">Text has to stand out from its background.</div></div>
    <div class="abs" style="left:80px;top:1030px;width:920px">
      <div class="kicker" id="k-k" style="color:var(--mute)">Contrast ratio</div>
      <div style="display:flex;align-items:center;gap:30px;margin-top:18px">
        <div id="k-num" style="font:600 130px/1 var(--sans);letter-spacing:-.05em;font-variant-numeric:tabular-nums"></div>
        <div id="k-pill" style="padding:14px 26px;border-radius:999px;font:600 28px/1 var(--sans)"></div></div>
      <div id="k-meter" style="position:relative;margin-top:46px;height:14px;border-radius:7px;background:linear-gradient(90deg,#ff4d4d 0%,#ff4d4d 30%,#3ddc84 31%,#3ddc84 100%);opacity:.9">
        <i style="position:absolute;left:30.5%;top:-16px;width:3px;height:46px;background:${CREAM}"></i>
        <i id="k-mark" style="position:absolute;top:50%;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:${CREAM};box-shadow:0 6px 20px rgba(0,0,0,.5)"></i></div>
      <div class="sub" id="k-note" style="margin-top:30px">At least <b style="color:var(--cream)">4.5 : 1</b> for body text.</div>
      <div class="abs h2" id="k-hue" style="top:220px;width:920px">Hue doesn’t count.<br><span class="blue">Only lightness.</span></div>
    </div>
    <svg class="abs" id="k-check" style="left:420px;top:1030px" width="240" height="240" viewBox="0 0 300 300">
      <circle cx="150" cy="150" r="138" fill="none" stroke="${BLUE}" stroke-width="8"/><path d="M92 156l40 40 78-88" fill="none" stroke="${CREAM}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="abs h2" id="k-every" style="left:0;right:0;top:1300px;text-align:center">Check every text colour.</div>`);
  const card = $("#k-card", sc), num = $("#k-num", sc), pill = $("#k-pill", sc), mark = $("#k-mark", sc);
  hooks.push(t => {
    if (!live(a - .3, b)(t)) return;
    if (t < T("huefail") - .3) { const c = `hsl(222 18% ${K.l}%)`; $("#k-aa").style.color = c; $("#k-cap").style.color = c; }
    const r = ratioOf(rgbOf(getComputedStyle($("#k-aa")).color), rgbOf(getComputedStyle(card).backgroundColor));
    num.textContent = r.toFixed(1) + " : 1";
    const ok = r >= 4.5;
    pill.textContent = ok ? "✓  Passes" : "✕  Too low";
    pill.style.background = ok ? "rgba(61,220,132,.16)" : "rgba(255,77,77,.16)";
    pill.style.color = ok ? "#3ddc84" : "#ff6b6b";
    mark.style.left = Math.min(100, Math.log(r) / Math.log(21) * 100) + "%";
  });
  tl.from(card, { y: 60, opacity: 0, duration: 1.3 }, a);
  fadeIn(["#k-k", "#k-num", "#k-pill"], a + .3, { y: 30, st: .1 });
  tl.to(K, { l: 10, duration: 2.1, ease: "glide" }, T("measured") - .2);
  gsap.set(["#k-meter", "#k-note", "#k-hue", "#k-check", "#k-every"], { autoAlpha: 0 });
  fadeIn("#k-meter", T("ratio") - .2, { y: 20 }); fadeIn("#k-note", T("ratio"), { y: 20 });
  const gap = T("huefail") - T("ratio");
  tl.to(K, { l: 62, duration: gap * .3, ease: "glide" }, T("ratio") + gap * .25);
  tl.to(K, { l: 24, duration: gap * .25, ease: "glide" }, T("ratio") + gap * .6);
  tl.to(card, { backgroundColor: "#2f9a48", duration: 1.1, ease: "glide" }, T("huefail") - .3);
  tl.to(["#k-aa", "#k-cap"], { color: "#e8423c", duration: 1.1, ease: "glide" }, T("huefail") - .3);
  fadeOut(["#k-meter", "#k-note"], T("huefail") - .2);
  tl.set("#k-hue", { autoAlpha: 1 }, T("onlylight") - .1);
  textIn($("#k-hue"), T("onlylight") - .1);
  tl.to(card, { filter: "grayscale(1)", duration: 1.4, ease: "glide" }, T("onlylight"));
  tl.to(card, { filter: "grayscale(0)", duration: 1, ease: "glide" }, T("redgreen"));
  tl.fromTo(card, { x: 0 }, { x: 10, duration: .07, repeat: 5, yoyo: true, ease: "none" }, T("hard"));
  tl.to(card, { backgroundColor: CREAM, duration: 1, ease: "glide" }, T("check") - .2);
  tl.to(["#k-aa", "#k-cap"], { color: "#11141a", duration: 1, ease: "glide" }, T("check") - .2);
  tl.to(["#k-k", "#k-num", "#k-pill"], { autoAlpha: 0, y: -20, duration: .5, ease: "power2.in" }, T("check") - .4);
  textOut($("#k-hue"), T("check") - .4);
  tl.set("#k-check", { autoAlpha: 1 }, T("check"));
  tl.from("#k-check circle", { drawSVG: "0%", duration: 1.1, ease: "glide" }, T("check"));
  tl.from("#k-check path", { drawSVG: "0%", duration: .7, ease: "power2.out" }, T("check") + .7);
  tl.set("#k-every", { autoAlpha: 1 }, T("check") + .3);
  textIn($("#k-every"), T("check") + .3);
  light(T("ch5") - 1.3, "#3ddc84", "#ff4d4d", "#1f7aff", .2);
}

build({
  bare: true,
  scenes() { opener(); P.fn(); endCard(); }
});
