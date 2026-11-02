// PLU Diaspora Chapter SA — membership card generator (86 × 54 mm, landscape).
// card(version, side, data) returns one SVG in millimetres, with a 3 mm bleed on every side.
// Everything security-print-like (guilloche, rosettes, microtext, latent watermark, MRZ) is drawn
// here as vectors, so the PDFs stay sharp at any print resolution.
(function () {
  const W = 86, H = 54, B = 3;
  const UG = { black: "#0b0b0b", yellow: "#FCDC04", red: "#D90000" };
  const f2 = n => Math.round(n * 100) / 100;
  const SANS = "'Barlow Condensed', 'Arial Narrow', sans-serif", SERIF = "'Cinzel', 'Trajan Pro', serif", MONO = "'IBM Plex Mono', 'OCR-B', monospace";
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  // ── pattern generators ──────────────────────────────────────────────────────────
  const poly = pts => "M" + pts.map(p => f2(p[0]) + "," + f2(p[1])).join("L");
  // n parallel sine lines, each shifted in phase, forming a moiré ribbon
  function waves({ x0 = -B, x1 = W + B, y, amp, len, n, phase = .22, gap = 0, env = () => 1, step = .35, tilt = 0 }) {
    let d = "";
    for (let k = 0; k < n; k++) {
      const pts = [];
      for (let x = x0; x <= x1 + step; x += step) pts.push([x, y + k * gap + tilt * (x - x0) + amp * env(x) * Math.sin(2 * Math.PI * x / len + k * phase)]);
      d += poly(pts);
    }
    return d;
  }
  // a woven ring: `layers` closed curves wobbling `lobes` times round the circle
  function rosette({ cx, cy, r, a, lobes, layers, b = 0, lobes2 = 0 }) {
    let d = "";
    for (let j = 0; j < layers; j++) {
      const pts = [], N = Math.max(360, Math.round(r * 60));
      for (let i = 0; i <= N; i++) {
        const t = i / N * 2 * Math.PI, ph = j * 2 * Math.PI / (lobes * layers);
        const rr = r + a * Math.sin(lobes * (t + ph)) + b * Math.sin(lobes2 * (t - ph));
        pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
      }
      d += poly(pts) + "Z";
    }
    return d;
  }
  // concentric wavy rings (the "lathe" background of banknotes)
  function lathe({ cx, cy, r0, r1, dr, amp, freq, twist = .3 }) {
    let d = "";
    for (let r = r0, k = 0; r <= r1; r += dr, k++) {
      const pts = [], N = Math.max(240, Math.round(2 * Math.PI * r / .4));
      for (let i = 0; i <= N; i++) {
        const t = i / N * 2 * Math.PI, rr = r + amp * Math.sin(freq * t + k * twist);
        pts.push([cx + rr * Math.cos(t), cy + rr * Math.sin(t)]);
      }
      d += poly(pts) + "Z";
    }
    return d;
  }
  // hypotrochoid star for seals
  function spiro({ cx, cy, R, r, d, scale }) {
    const pts = [], turns = r / gcd(R, r), N = 2400;
    for (let i = 0; i <= N; i++) {
      const t = i / N * 2 * Math.PI * turns;
      pts.push([cx + scale * ((R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t)), cy + scale * ((R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t))]);
    }
    return poly(pts) + "Z";
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  const path = (d, stroke, w, op = 1, extra = "") => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-opacity="${op}" ${extra}/>`;
  const txt = (s, x, y, size, o = {}) => `<text x="${f2(x)}" y="${f2(y)}" font-size="${size}" font-family="${o.font || SANS}" font-weight="${o.weight || 600}" fill="${o.fill || "#111"}"${o.anchor ? ` text-anchor="${o.anchor}"` : ""}${o.ls != null ? ` letter-spacing="${o.ls}"` : ""}${o.op != null ? ` fill-opacity="${o.op}"` : ""}${o.fit ? ` data-fit="${o.fit}"` : ""}${o.len ? ` textLength="${o.len}" lengthAdjust="spacing"` : ""}${o.extra || ""}>${esc(s)}</text>`;
  // microtext: a sentence repeated until it fills a line
  const MICRO = "PATRIOTIC LEAGUE OF UGANDA • PLU DIASPORA CHAPTER SA • FOR GOD AND MY COUNTRY • ";
  const micro = (x, y, len, size, fill, op = .8, o = {}) => txt(MICRO.repeat(Math.ceil(len / (size * 22)) + 1).slice(0, Math.floor(len / (size * .47))), x, y, size, { fill, op, weight: 500, len, ...o });
  // machine-readable-zone look (TD1 cards use 30 characters per line)
  const mrzLine = s => (s + "<".repeat(30)).slice(0, 30);

  // logos: the main badge (full colour) and the watermark (single-colour silhouette)
  const LR = 388.47; // outer radius of the badge in the 1080 artboard
  const place = (cx, cy, d) => { const s = d / (2 * LR); return `translate(${f2(cx - 540 * s)} ${f2(cy - 540 * s)}) scale(${s.toFixed(5)})`; };
  const badge = (cx, cy, d) => `<g transform="${place(cx, cy, d)}">${window.LOGO_MAIN}</g>`;
  // latent image: fine engraved lines that only show inside the logo silhouette, over a faint tint
  // (a clip path rather than a mask, so the PDF keeps it as vectors)
  function latent(id, cx, cy, d, color, lineOp, tintOp) {
    const r = d / 2 + 1;
    return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse" transform="${place(cx, cy, d)}">${window.LOGO_WM}</clipPath>
      <g fill="${color}" fill-opacity="${tintOp}" transform="${place(cx, cy, d)}">${window.LOGO_WM}</g>
      <g clip-path="url(#${id})">${path(waves({ x0: cx - r, x1: cx + r, y: cy - r, amp: .35, len: 2.6, n: Math.ceil(2 * r / .3), gap: .3, phase: .0, step: .2 }), color, .13, lineOp)}</g>`;
  }
  const IRIS = id => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd3ef"/><stop offset=".2" stop-color="#c9f2ff"/><stop offset=".4" stop-color="#fff2a8"/>
      <stop offset=".6" stop-color="#d9c9ff"/><stop offset=".8" stop-color="#bff7de"/><stop offset="1" stop-color="#ffd3ef"/></linearGradient>`;
  // holographic seal: iridescent disc + white spirograph + tiny text ring
  function seal(id, cx, cy, r, op = .9) {
    return `<g opacity="${op}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id})"/>
      ${path(spiro({ cx, cy, R: 96, r: 36, d: 30, scale: r / 92 }), "#fff", .07, .95)}
      ${path(rosette({ cx, cy, r: r * .93, a: .12, lobes: 40, layers: 2 }), "#fff", .06, .9)}
      <circle cx="${cx}" cy="${cy}" r="${f2(r * .32)}" fill="#fff" fill-opacity=".55"/>
      ${txt("PLU", cx, cy + r * .1, r * .26, { font: SERIF, weight: 700, fill: "#8a6d1f", anchor: "middle", op: .9 })}</g>`;
  }
  // the three numbered fields
  function fields({ x, y, gap, data, label, value, cde, blank, rule, num, valSize = 3.3, maxw }) {
    const rows = [["01", "NAME", data.name, value], ["02", "TITLE", data.title, value], ["03", "CDE", data.cde, cde]];
    return rows.map(([n, l, v, style], k) => {
      const yy = y + k * gap;
      return (num ? txt(n, x, yy, 1.45, { fill: num, weight: 600, font: MONO }) : "") +
        txt(l, x + (num ? 3.4 : 0), yy, 1.6, { fill: label, weight: 600, ls: ".22em" }) +
        (blank ? "" : txt(v, x, yy + 4.25, style.size || valSize, { fill: style.fill, weight: style.weight || 600, font: style.font || SANS, ls: style.ls || ".02em", fit: maxw })) +
        (rule ? `<line x1="${x}" x2="${x + maxw}" y1="${f2(yy + 5.4)}" y2="${f2(yy + 5.4)}" stroke="${rule}" stroke-width=".1"/>` : "");
    }).join("");
  }
  const flagRule = (x, y, w, h = .42) => [UG.black, UG.yellow, UG.red].map((c, k) => `<rect x="${x}" y="${f2(y + k * h)}" width="${w}" height="${h}" fill="${c}"/>`).join("");

  // ── the three versions ─────────────────────────────────────────────────────────
  const V = {};

  // V1 · Heritage — ivory security paper, sepia engraving, the flag as a fine rule
  V[1] = (side, data, blank, id) => {
    const ink = "#16130d", sep = "#7c6a43";
    let s = `<defs>${IRIS(id + "ir")}
      <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stop-color="#f8f3e6"/><stop offset="1" stop-color="#efe8d6"/></linearGradient>
      <linearGradient id="${id}rb" x1="0" x2="1"><stop offset="0" stop-color="${UG.yellow}" stop-opacity=".16"/><stop offset=".5" stop-color="${UG.yellow}" stop-opacity="0"/><stop offset="1" stop-color="${UG.red}" stop-opacity=".045"/></linearGradient></defs>
      <rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="url(#${id}bg)"/>
      <rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="url(#${id}rb)"/>`;
    if (side === "front") {
      s += path(lathe({ cx: 17, cy: 31, r0: 13.2, r1: 82, dr: .9, amp: .55, freq: 28 }), sep, .06, .2);
      s += path(waves({ y: 15.6, amp: 1.5, len: 19, n: 10, phase: .26, env: x => .6 + .4 * Math.sin(x / 13) }), sep, .07, .2);
      s += `<rect x="${-B}" y="44.6" width="${W + 2 * B}" height="${H - 44.6 + B}" fill="#fffdf6" fill-opacity=".62"/>`;
      s += path(waves({ y: 44.6, amp: .5, len: 7, n: 3, phase: 1.1 }), sep, .07, .5);
      s += latent(id + "lt", 68.5, 28, 31, "#6b5a33", .3, .025);
      s += micro(6, 3, 74, .55, sep);
      s += txt("PATRIOTIC LEAGUE OF UGANDA", 6, 6.6, 1.75, { fill: "#6b5a33", ls: ".34em" });
      s += txt("MEMBERSHIP CARD", 80, 6.6, 1.75, { fill: UG.red, anchor: "end", ls: ".26em", weight: 700 });
      s += txt("PLU DIASPORA CHAPTER SA", 6, 12.2, 4.7, { font: SERIF, weight: 700, fill: ink, ls: ".03em", fit: 74 });
      s += flagRule(6, 14.1, 22) + micro(30, 15.25, 50, .55, sep, .9);
      s += path(rosette({ cx: 17, cy: 31, r: 12.4, a: .55, lobes: 30, layers: 4 }), sep, .07, .75);
      s += path(rosette({ cx: 17, cy: 31, r: 12.4, a: .35, lobes: 45, layers: 2, b: .2, lobes2: 15 }), UG.red, .05, .45);
      s += `<circle cx="17" cy="31" r="11.35" fill="none" stroke="${sep}" stroke-width=".08" stroke-opacity=".7"/>`;
      s += badge(17, 31, 20.6);
      s += seal(id + "ir", 26.8, 39.6, 3.6, .92);
      s += fields({ x: 34, y: 20.6, gap: 8, data, blank, maxw: 46, num: UG.red, label: "#6f6247", rule: blank ? "#b7a983" : null,
        value: { fill: ink }, cde: { fill: UG.red, font: MONO, size: 3, weight: 600, ls: ".08em" } });
      s += txt(mrzLine("PLU<DIASPORA<CHAPTER<SA"), 5, 48.6, 2.55, { font: MONO, weight: 500, fill: ink, op: .82, len: 76 });
      s += txt(mrzLine("MEMBER<<UGA<<ZAF<<PATRIOTIC"), 5, 51.8, 2.55, { font: MONO, weight: 500, fill: ink, op: .82, len: 76 });
    } else s += back({ id, ink, line: sep, tint: "#6b5a33", accent: UG.red, flag: true });
    return s;
  };

  // V2 · Diplomat — passport-cover black with gold engraving, the flag as a corner sash
  V[2] = (side, data, blank, id) => {
    const gold = "#cfae5a", ink = "#f4efe2";
    let s = `<defs>${IRIS(id + "ir")}
      <radialGradient id="${id}bg" cx=".3" cy=".55" r=".9"><stop offset="0" stop-color="#1f2128"/><stop offset="1" stop-color="#08090b"/></radialGradient>
      <linearGradient id="${id}gd" x1="0" x2="1"><stop offset="0" stop-color="#a8843a"/><stop offset=".45" stop-color="#f3dc95"/><stop offset=".7" stop-color="#c79f4c"/><stop offset="1" stop-color="#8f6d2a"/></linearGradient>
      <clipPath id="${id}cp"><rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}"/></clipPath></defs>
      <rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="url(#${id}bg)"/>`;
    // Uganda flag sash across the top-right corner: bands between the lines (86 - x) + y = d
    const band = (d1, d2, fill) => `<polygon points="${83 - d1},-3 ${83 - d2},-3 89,${d2 + 3} 89,${d1 + 3}" fill="${fill}"/>`;
    const sash = band(7.6, 7.8, `url(#${id}gd)`) + band(7.8, 9.3, UG.black) + band(9.3, 10.8, UG.yellow) + band(10.8, 12.3, UG.red) + band(12.3, 12.5, `url(#${id}gd)`);
    const frame = `<rect x="1.9" y="1.9" width="${W - 3.8}" height="${H - 3.8}" rx="1.6" fill="none" stroke="url(#${id}gd)" stroke-width=".16"/>
      <rect x="2.45" y="2.45" width="${W - 4.9}" height="${H - 4.9}" rx="1.2" fill="none" stroke="${gold}" stroke-width=".05" stroke-opacity=".7"/>`;
    if (side === "front") {
      s += path(lathe({ cx: 17, cy: 31, r0: 13.4, r1: 84, dr: 1, amp: .6, freq: 32, twist: .25 }), gold, .055, .2);
      s += path(waves({ y: 40.5, amp: 2.2, len: 24, n: 16, phase: .2, env: x => .5 + .5 * Math.cos(x / 15) }), gold, .06, .18);
      s += latent(id + "lt", 69, 29, 30, gold, .24, .025);
      s += frame + sash;
      s += micro(5, 4.5, 50, .55, gold, .75);
      s += txt("PATRIOTIC LEAGUE OF UGANDA", 6, 8, 1.75, { fill: gold, ls: ".34em" });
      s += txt("PLU DIASPORA CHAPTER SA", 6, 13.4, 4.7, { font: SERIF, weight: 700, fill: `url(#${id}gd)`, ls: ".03em", fit: 66 });
      s += `<rect x="6" y="15.3" width="40" height=".12" fill="url(#${id}gd)"/>` + txt("MEMBERSHIP CARD", 48, 15.95, 1.6, { fill: UG.yellow, ls: ".3em", weight: 700 });
      s += path(rosette({ cx: 17, cy: 31.5, r: 12.2, a: .5, lobes: 36, layers: 4 }), `url(#${id}gd)`, .07, .9);
      s += path(rosette({ cx: 17, cy: 31.5, r: 12.2, a: .3, lobes: 18, layers: 3, b: .25, lobes2: 54 }), gold, .045, .55);
      s += `<circle cx="17" cy="31.5" r="11.1" fill="none" stroke="url(#${id}gd)" stroke-width=".12"/>`;
      s += badge(17, 31.5, 20.4);
      s += seal(id + "ir", 27, 40, 3.5, .85);
      s += fields({ x: 34, y: 21.5, gap: 7.6, data, blank, maxw: 44, num: UG.yellow, label: "#b59a5c", rule: blank ? "#5c5139" : null,
        value: { fill: ink }, cde: { fill: gold, font: MONO, size: 3, weight: 600, ls: ".08em" } });
      s += `<rect x="5" y="44.9" width="76" height=".08" fill="${gold}" fill-opacity=".55"/>`;
      s += txt(mrzLine("PLU<DIASPORA<CHAPTER<SA"), 5, 48, 2.45, { font: MONO, weight: 500, fill: gold, op: .78, len: 76 });
      s += txt(mrzLine("MEMBER<<UGA<<ZAF<<PATRIOTIC"), 5, 50.9, 2.45, { font: MONO, weight: 500, fill: gold, op: .78, len: 76 });
    } else s += back({ id, ink, line: gold, tint: gold, accent: UG.yellow, frame, dark: true, gold: `url(#${id}gd)` });
    return s;
  };

  // V3 · Republic — modern national-ID layout: black header, yellow + red bands (the flag in order)
  V[3] = (side, data, blank, id) => {
    const ink = "#121417", line = "#5d6b66";
    let s = `<defs>${IRIS(id + "ir")}
      <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f7f3"/><stop offset="1" stop-color="#e7ebe7"/></linearGradient>
      <linearGradient id="${id}rw" x1="0" x2="1"><stop offset="0" stop-color="${UG.yellow}"/><stop offset=".55" stop-color="#f08a00"/><stop offset="1" stop-color="${UG.red}"/></linearGradient></defs>
      <rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${H + 2 * B}" fill="url(#${id}bg)"/>`;
    if (side === "front") {
      s += path(waves({ y: 17, amp: 3.2, len: 46, n: 26, gap: .55, phase: .09, tilt: .1 }), `url(#${id}rw)`, .07, .42);
      s += path(lathe({ cx: 86, cy: 54, r0: 4, r1: 40, dr: .8, amp: .45, freq: 22 }), line, .05, .2);
      s += latent(id + "lt", 62, 30.5, 28, "#3e4a46", .24, .025);
      s += `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${12.6 + B}" fill="${UG.black}"/>`;
      s += path(waves({ y: 1.2, amp: .9, len: 12, n: 9, gap: 1.1, phase: .5 }), "#ffffff", .05, .12);
      s += `<rect x="${-B}" y="12.6" width="${W + 2 * B}" height=".85" fill="${UG.yellow}"/><rect x="${-B}" y="13.45" width="${W + 2 * B}" height=".85" fill="${UG.red}"/>`;
      s += txt("PLU DIASPORA CHAPTER SA", 26, 7.1, 4.3, { font: SERIF, weight: 700, fill: "#fff", ls: ".03em", fit: 56 });
      s += txt("PATRIOTIC LEAGUE OF UGANDA  ·  MEMBERSHIP CARD", 26, 10.4, 1.6, { fill: UG.yellow, ls: ".22em", fit: 56 });
      s += `<circle cx="13.6" cy="13.3" r="10.6" fill="#f7f7f3"/>`;
      s += path(rosette({ cx: 13.6, cy: 13.3, r: 10.1, a: .4, lobes: 32, layers: 4 }), line, .06, .7);
      s += badge(13.6, 13.3, 18.2);
      s += micro(4, 26.6, 19.5, .5, line, .9) + micro(4, 27.5, 19.5, .5, UG.red, .7);
      s += seal(id + "ir", 13.6, 35.5, 5, .95);
      // kinegram strip
      s += `<rect x="80.2" y="17.5" width="3.2" height="25" rx="1.6" fill="url(#${id}ir)" opacity=".85"/>` +
        path(waves({ x0: 80.2, x1: 83.4, y: 18.5, amp: .35, len: 1.6, n: 24, gap: 1, phase: .4, step: .1 }), "#fff", .06, .9);
      s += fields({ x: 26, y: 19.6, gap: 8.1, data, blank, maxw: 50, num: UG.red, label: "#5a6460", rule: blank ? "#a9b3ae" : "#c3cbc6",
        value: { fill: ink, size: 3.4 }, cde: { fill: UG.red, font: MONO, size: 3.05, weight: 600, ls: ".08em" } });
      s += `<rect x="${-B}" y="44.3" width="${W + 2 * B}" height="${H - 44.3 + B}" fill="#fff" fill-opacity=".7"/>`;
      s += `<rect x="${-B}" y="44.3" width="${W + 2 * B}" height=".1" fill="${line}" fill-opacity=".5"/>`;
      s += txt(mrzLine("PLU<DIASPORA<CHAPTER<SA"), 5, 48.4, 2.5, { font: MONO, weight: 500, fill: ink, op: .8, len: 76 });
      s += txt(mrzLine("MEMBER<<UGA<<ZAF<<PATRIOTIC"), 5, 51.6, 2.5, { font: MONO, weight: 500, fill: ink, op: .8, len: 76 });
    } else s += back({ id, ink, line, tint: "#3e4a46", accent: UG.red, header: true });
    return s;
  };

  // the reverse side: shared layout, themed per version
  function back({ id, ink, line, tint, accent, flag, frame, dark, gold, header }) {
    let s = path(lathe({ cx: 43, cy: 23.5, r0: 15.6, r1: 60, dr: .9, amp: .5, freq: 36 }), line, .055, dark ? .16 : .2);
    s += path(waves({ y: 36.5, amp: 1.6, len: 21, n: 9, phase: .26 }), line, .06, dark ? .16 : .2);
    s += path(rosette({ cx: 43, cy: 23.5, r: 15, a: .5, lobes: 44, layers: 4 }), gold || line, .06, .6);
    s += path(rosette({ cx: 43, cy: 23.5, r: 15, a: .3, lobes: 22, layers: 2, b: .2, lobes2: 66 }), accent, .045, .4);
    s += latent(id + "lb", 43, 23.5, 26, tint, dark ? .34 : .42, .035);
    if (frame) s += frame;
    let top = 3;
    if (flag) { s += `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${B + 1}" fill="${UG.black}"/><rect x="${-B}" y="1" width="${W + 2 * B}" height=".7" fill="${UG.yellow}"/><rect x="${-B}" y="1.7" width="${W + 2 * B}" height=".7" fill="${UG.red}"/>`; top = 2.4; }
    if (header) { s += `<rect x="${-B}" y="${-B}" width="${W + 2 * B}" height="${B + 2.2}" fill="${UG.black}"/><rect x="${-B}" y="2.2" width="${W + 2 * B}" height=".7" fill="${UG.yellow}"/><rect x="${-B}" y="2.9" width="${W + 2 * B}" height=".7" fill="${UG.red}"/>`; top = 3.6; }
    s += txt("PLU DIASPORA CHAPTER SA", 43, top + 4.6, 2.5, { font: SERIF, weight: 700, fill: gold || ink, anchor: "middle", ls: ".06em" });
    s += micro(20, top + 6.2, 46, .5, line, .85);
    s += txt("THIS CARD IS THE PROPERTY OF THE PATRIOTIC LEAGUE OF UGANDA, SOUTH AFRICAN CHAPTER.", 43, 41.2, 1.55, { fill: ink, anchor: "middle", ls: ".07em", weight: 600, op: .85 });
    s += txt("IT MUST BE SHOWN ON REQUEST. IF FOUND, PLEASE RETURN IT TO THE CHAPTER.", 43, 43.3, 1.55, { fill: ink, anchor: "middle", ls: ".07em", weight: 600, op: .85 });
    const c = dark ? line : ink;
    const sig = (x, label) => `<line x1="${x}" x2="${x + 28}" y1="48.4" y2="48.4" stroke="${c}" stroke-width=".1" stroke-opacity=".8"/>` + txt(label, x, 50.4, 1.4, { fill: c, ls: ".22em", op: .75 });
    s += sig(9, "MEMBER'S SIGNATURE") + sig(49, "AUTHORISED SIGNATURE");
    return s;
  }

  window.card = function (v, side, data, blank) {
    const id = `v${v}${side[0]}${blank ? "b" : ""}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-B} ${-B} ${W + 2 * B} ${H + 2 * B}" width="${W + 2 * B}mm" height="${H + 2 * B}mm" data-card="${id}">${V[v](side, data, blank, id)}</svg>`;
  };
  window.CARD = { W, H, B };
})();
