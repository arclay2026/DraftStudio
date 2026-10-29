/* =====================================================================
   DESIGN BASICS — the figures (js/academy.js shows them)
   Still, labelled diagrams in one textbook style: white paper, ink, one
   blue for what matters, thin leader lines and measurements.
   DSFigures.cover[key]() draws a lesson card (4:3); DSFigures.fig[name]()
   draws a figure inside a lesson (16:9). Both return SVG markup.
   Type figures measure the real fonts (canvas measureText), so call them
   after document.fonts.ready.
   ===================================================================== */
(function () {
  const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif";
  const SERIF = "Georgia, 'Times New Roman', serif";
  const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
  const INK = "#16181d", MUTE = "#6b7280", FAINT = "#9aa0aa", LINE = "#d9dce1", SOFT = "#f3f4f6", PAPER = "#ffffff";
  const BLUE = "#1f7aff", RED = "#e5484d", GREEN = "#1f9d55";
  let uid = 0;

  /* ---------- Small helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const attrs = o => Object.entries(o).filter(([, v]) => v != null && v !== false).map(([k, v]) => `${k}="${v}"`).join(" ");
  const svg = (w, h, body, title) =>
    `<svg class="af" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="${PAPER}"/>${body}</svg>`;
  const text = (x, y, s, o = {}) => `<text ${attrs({
    x, y, "font-family": o.ff || SANS, "font-size": o.size || 13, "font-weight": o.w || 500, fill: o.fill || MUTE,
    "text-anchor": o.anchor, "letter-spacing": o.ls, "dominant-baseline": o.base, "font-style": o.italic ? "italic" : null, opacity: o.op
  })}>${esc(s)}</text>`;
  // An uppercase caption above a part of a figure
  const cap = (x, y, s, o = {}) => text(x, y, s.toUpperCase(), Object.assign({ size: 10.5, w: 600, fill: FAINT, ls: 1.2 }, o));
  const rect = (x, y, w, h, o = {}) => `<rect ${attrs({ x, y, width: w, height: h, rx: o.r, fill: o.fill || "none", stroke: o.stroke, "stroke-width": o.sw, "stroke-dasharray": o.dash, opacity: o.op })}/>`;
  const line = (x1, y1, x2, y2, o = {}) => `<line ${attrs({ x1, y1, x2, y2, stroke: o.stroke || LINE, "stroke-width": o.sw || 1, "stroke-dasharray": o.dash, "stroke-linecap": o.cap || "round", opacity: o.op })}/>`;
  const circle = (cx, cy, r, o = {}) => `<circle ${attrs({ cx, cy, r, fill: o.fill || "none", stroke: o.stroke, "stroke-width": o.sw, "stroke-dasharray": o.dash, opacity: o.op })}/>`;
  const path = (d, o = {}) => `<path ${attrs({ d, fill: o.fill || "none", stroke: o.stroke, "stroke-width": o.sw, "stroke-linejoin": "round", "stroke-linecap": "round", "stroke-dasharray": o.dash, opacity: o.op, "fill-rule": o.rule })}/>`;
  // A callout: a thin line from a point to its label, with a dot on the point
  const lead = (x1, y1, x2, y2, label, o = {}) => line(x1, y1, x2, y2, { stroke: o.stroke || FAINT }) + circle(x1, y1, 2.6, { fill: o.stroke || INK })
    + text(x2 + (o.anchor === "end" ? -6 : 6), y2 + 4, label, { size: o.size || 12, w: 500, fill: o.fill || INK, anchor: o.anchor });
  // A measurement: end ticks, a line between and the value in the middle
  const dim = (x1, y1, x2, y2, label, o = {}) => {
    const c = o.stroke || BLUE, v = x1 === x2, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const t = v ? line(x1 - 5, y1, x1 + 5, y1, { stroke: c }) + line(x2 - 5, y2, x2 + 5, y2, { stroke: c })
      : line(x1, y1 - 5, x1, y1 + 5, { stroke: c }) + line(x2, y2 - 5, x2, y2 + 5, { stroke: c });
    const lab = label ? (v ? text(mx + 8, my + 4, label, { size: 11, w: 600, fill: c })
      : `${rect(mx - (label.length * 3.4 + 7), my - 9, label.length * 6.8 + 14, 18, { r: 9, fill: PAPER })}${text(mx, my + 4, label, { size: 11, w: 600, fill: c, anchor: "middle" })}`) : "";
    return line(x1, y1, x2, y2, { stroke: c }) + t + lab;
  };
  const badge = (x, y, n, o = {}) => circle(x, y, o.r || 11, { fill: o.fill || INK }) + text(x, y + 4, n, { size: o.size || 11.5, w: 700, fill: PAPER, anchor: "middle" });
  const tick = (x, y, ok) => circle(x, y, 9, { fill: ok ? GREEN : RED }) + (ok
    ? path(`M${x - 4} ${y} l3 3 l5 -6`, { stroke: PAPER, sw: 1.8 })
    : path(`M${x - 3.2} ${y - 3.2} l6.4 6.4 M${x + 3.2} ${y - 3.2} l-6.4 6.4`, { stroke: PAPER, sw: 1.8 }));
  // Grey bars standing in for lines of body text
  const lines = (x, y, w, n, o = {}) => Array.from({ length: n }, (_, i) =>
    rect(x, y + i * (o.gap || 12), i === n - 1 ? w * (o.last || .62) : w, o.h || 5, { r: (o.h || 5) / 2, fill: o.fill || "#dfe2e6" })).join("");
  const arrow = (x1, y1, x2, y2, o = {}) => {
    const a = Math.atan2(y2 - y1, x2 - x1), s = o.head || 8, c = o.stroke || INK;
    return line(x1, y1, x2, y2, { stroke: c, sw: o.sw || 1.6, dash: o.dash }) +
      path(`M${x2 - s * Math.cos(a - .45)} ${y2 - s * Math.sin(a - .45)} L${x2} ${y2} L${x2 - s * Math.cos(a + .45)} ${y2 - s * Math.sin(a + .45)}`, { stroke: c, sw: o.sw || 1.6 });
  };
  const curve = (d, o = {}) => path(d, { stroke: o.stroke || INK, sw: o.sw || 1.6, dash: o.dash });
  const grad = (stops, o = {}) => { const id = "afg" + ++uid; return { id, def: `<linearGradient id="${id}" x1="${o.x1 || 0}" y1="${o.y1 || 0}" x2="${o.x2 == null ? 1 : o.x2}" y2="${o.y2 || 0}">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join("")}</linearGradient>` }; };

  /* ---------- Colour maths ---------- */
  const hsl = (h, s, l) => {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return "#" + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
  };
  const lum = hex => {
    const n = parseInt(hex.slice(1), 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

  /* ---------- Font metrics, measured on a canvas ---------- */
  const ctx = document.createElement("canvas").getContext("2d");
  const measure = (ff, weight, size, s) => { ctx.font = `${weight} ${size}px ${ff}`; const m = ctx.measureText(s); return { up: m.actualBoundingBoxAscent, down: m.actualBoundingBoxDescent, w: m.width }; };

  /* ---------- The colour wheel ---------- */
  const HUES = [["Red", 0], ["Orange", 30], ["Yellow", 55], ["Lime", 90], ["Green", 130], ["Teal", 165], ["Cyan", 190], ["Azure", 210], ["Blue", 230], ["Violet", 265], ["Purple", 290], ["Pink", 330]];
  const hueAt = i => hsl(HUES[i % 12][1], 82, 55);
  const wheel = (cx, cy, r, o = {}) => {
    const r2 = r * (o.hole || .58), seg = Math.PI * 2 / 12;
    let s = "";
    for (let i = 0; i < 12; i++) {
      const a0 = -Math.PI / 2 + (i - .5) * seg + .012, a1 = a0 + seg - .024;
      const p = (rr, a) => `${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`;
      s += path(`M${p(r, a0)} A${r} ${r} 0 0 1 ${p(r, a1)} L${p(r2, a1)} A${r2} ${r2} 0 0 0 ${p(r2, a0)} Z`, { fill: hueAt(i), op: o.dim && !o.dim.includes(i) ? .28 : 1 });
    }
    return s;
  };
  const wheelPt = (cx, cy, r, i) => { const a = -Math.PI / 2 + i * Math.PI * 2 / 12; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const swatchRow = (x, y, cols, o = {}) => cols.map((c, i) => rect(x + i * ((o.w || 34) + (o.gap || 6)), y, o.w || 34, o.h || 34, { r: o.r || 8, fill: c, stroke: c.toLowerCase() === "#ffffff" ? LINE : null })
    + (o.hex ? text(x + i * ((o.w || 34) + (o.gap || 6)) + (o.w || 34) / 2, y + (o.h || 34) + 15, c.toUpperCase(), { size: 9.5, w: 600, fill: MUTE, anchor: "middle", ff: MONO }) : "")).join("");

  /* =====================================================================
     COLOUR
     ===================================================================== */
  const colourWheel = () => {
    const cx = 250, cy = 225, r = 150;
    let s = wheel(cx, cy, r, { hole: .56 });
    const A = i => -Math.PI / 2 + i * Math.PI * 2 / 12;
    const arc = (a0, a1, rr, c) => { const p = a => `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`; return path(`M${p(a0)} A${rr} ${rr} 0 0 1 ${p(a1)}`, { stroke: c, sw: 4 }); };
    s += arc(A(-1.45), A(2.45), r + 10, "#f08a24") + arc(A(3.55), A(9.45), r + 10, "#3b82f6");
    HUES.forEach(([n], i) => {
      const [x, y] = wheelPt(cx, cy, r + 30, i), right = x > cx + 4, left = x < cx - 4;
      s += text(x, y + 4, n, { size: 11.5, w: 600, fill: INK, anchor: right ? "start" : left ? "end" : "middle" });
    });
    const [ax, ay] = wheelPt(cx, cy, r * .78, 0), [bx, by] = wheelPt(cx, cy, r * .78, 6);
    s += line(ax, ay, bx, by, { stroke: INK, sw: 1.2, dash: "4 4", op: .6 }) + circle(ax, ay, 5, { fill: PAPER, stroke: INK, sw: 1.5 }) + circle(bx, by, 5, { fill: PAPER, stroke: INK, sw: 1.5 });
    s += `<g transform="translate(520 52)">` + cap(0, 0, "12 hues, 30° apart") +
      text(0, 30, "Warm half", { size: 15, w: 700, fill: "#d9711a" }) + text(0, 50, "Reds, oranges and yellows feel", { size: 12.5 }) + text(0, 66, "energetic, friendly and loud.", { size: 12.5 }) +
      text(0, 104, "Cool half", { size: 15, w: 700, fill: "#2f6fe0" }) + text(0, 124, "Greens, blues and violets feel", { size: 12.5 }) + text(0, 140, "calm, trustworthy and quiet.", { size: 12.5 }) +
      text(0, 178, "Neighbours", { size: 15, w: 700, fill: INK }) + text(0, 198, "Hues side by side share a base", { size: 12.5 }) + text(0, 214, "colour, so they always blend.", { size: 12.5 }) +
      text(0, 252, "Opposites (dashed line)", { size: 15, w: 700, fill: INK }) + text(0, 272, "Hues across the wheel clash on", { size: 12.5 }) + text(0, 288, "purpose: maximum contrast.", { size: 12.5 }) +
      `</g>`;
    return svg(800, 450, s, "A 12-hue colour wheel with warm and cool halves labelled");
  };

  const colourHsl = () => {
    let s = "", g = grad(Array.from({ length: 13 }, (_, i) => hsl(i * 30, 85, 55)));
    s += `<defs>${g.def}</defs>`;
    s += cap(40, 52, "Hue · which colour") + rect(40, 64, 520, 44, { r: 10, fill: `url(#${g.id})` });
    [0, 60, 120, 180, 240, 300, 360].forEach(d => { const x = 40 + d / 360 * 520; s += line(x, 112, x, 120, { stroke: FAINT }) + text(x, 134, d + "°", { size: 10.5, anchor: "middle" }); });
    s += cap(40, 182, "Saturation · how strong");
    [0, 20, 40, 60, 80, 100].forEach((v, i) => { s += rect(40 + i * 88, 194, 80, 40, { r: 8, fill: hsl(215, v, 52) }) + text(80 + i * 88, 252, v + "%", { size: 11, w: 600, anchor: "middle" }); });
    s += cap(40, 300, "Lightness · how light or dark");
    [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach((v, i) => { s += rect(40 + i * 58.2, 312, 52, 40, { r: 8, fill: hsl(215, 80, v) }) + text(66 + i * 58.2, 370, v + "%", { size: 11, w: 600, anchor: "middle" }); });
    // worked example
    const c = hsl(215, 85, 55);
    s += `<g transform="translate(600 64)">` + rect(0, 0, 170, 300, { r: 14, fill: SOFT }) + rect(16, 16, 138, 92, { r: 10, fill: c }) +
      text(16, 136, "One colour, three numbers", { size: 11.5, w: 700, fill: INK }) + text(16, 162, "hsl(215, 85%, 55%)", { size: 12, w: 600, fill: BLUE, ff: MONO }) +
      text(16, 196, "215°", { size: 13, w: 700, fill: INK }) + text(56, 196, "a blue hue", { size: 12 }) +
      text(16, 220, "85%", { size: 13, w: 700, fill: INK }) + text(56, 220, "strong, vivid", { size: 12 }) +
      text(16, 244, "55%", { size: 13, w: 700, fill: INK }) + text(56, 244, "middle lightness", { size: 12 }) +
      text(16, 278, "Hex: " + c.toUpperCase(), { size: 11, w: 600, fill: MUTE, ff: MONO }) + `</g>`;
    return svg(800, 420, s, "Hue, saturation and lightness shown as three scales, with a worked example");
  };

  const colourHarmony = () => {
    const sets = [
      ["Complementary", [0, 6], "Opposite hues. Bold, high energy."],
      ["Analogous", [10, 11, 0], "Neighbours. Calm and natural."],
      ["Triadic", [0, 4, 8], "Three evenly spaced. Lively, balanced."],
      ["Split complementary", [0, 5, 7], "A hue plus the two beside its opposite."]
    ];
    let s = "";
    sets.forEach(([name, idx, note], k) => {
      const ox = 22 + k * 196, cx = ox + 86, cy = 118, r = 70;
      s += wheel(cx, cy, r, { hole: .5, dim: idx });
      const pts = idx.map(i => wheelPt(cx, cy, r * .75, i));
      if (pts.length > 1) s += path("M" + pts.map(p => p.join(" ")).join(" L") + (pts.length > 2 ? " Z" : ""), { stroke: INK, sw: 1.4 });
      pts.forEach(([x, y], j) => { s += circle(x, y, 7, { fill: hueAt(idx[j]), stroke: PAPER, sw: 2.5 }); });
      s += text(cx, 226, name, { size: 13.5, w: 700, fill: INK, anchor: "middle" });
      // a palette built from the harmony: the hues plus a light and a dark tint of the first
      const pal = idx.map(i => hsl(HUES[i][1], 78, 52)).concat([hsl(HUES[idx[0]][1], 60, 94), hsl(HUES[idx[0]][1], 45, 16)]).slice(0, 5);
      const w = 26, gap = 4, total = pal.length * w + (pal.length - 1) * gap;
      s += swatchRow(cx - total / 2, 244, pal, { w, h: 26, gap, r: 6 });
      const words = note.split(" "), half = Math.ceil(words.length / 2);
      s += text(cx, 300, words.slice(0, half).join(" "), { size: 11.5, anchor: "middle" }) + text(cx, 316, words.slice(half).join(" "), { size: 11.5, anchor: "middle" });
    });
    return svg(800, 350, s, "Four colour harmonies on the colour wheel, each with a palette built from it");
  };

  const colour603010 = () => {
    const bg = "#f7f1e6", sec = "#1e3a34", acc = "#e8743b";
    let s = "";
    // a café poster built with the rule
    s += `<g transform="translate(60 40)">` + rect(0, 0, 260, 340, { r: 12, fill: bg, stroke: LINE }) +
      rect(20, 20, 220, 150, { r: 8, fill: sec }) + circle(130, 95, 38, { fill: "#2c5249" }) + path("M108 95 q22 -30 44 0 q-22 30 -44 0 Z", { fill: bg, op: .9 }) +
      text(20, 206, "Slow Mornings", { size: 26, w: 800, fill: sec, ls: -.6 }) + text(20, 230, "Coffee & pastries · Open 7am", { size: 12, w: 500, fill: sec, op: .75 }) +
      lines(20, 248, 200, 3, { fill: "#d9d0bf", gap: 11, h: 4 }) +
      rect(20, 288, 104, 32, { r: 16, fill: acc }) + text(72, 309, "Visit us", { size: 12.5, w: 700, fill: "#fff", anchor: "middle" }) +
      rect(188, 30, 44, 20, { r: 10, fill: acc }) + text(210, 44, "NEW", { size: 10, w: 800, fill: "#fff", anchor: "middle", ls: .6 }) + `</g>`;
    // the proportion bar
    s += `<g transform="translate(390 60)">` + cap(0, 0, "How the colour is shared") +
      rect(0, 16, 216, 40, { fill: bg }) + rect(216, 16, 108, 40, { fill: sec }) + rect(324, 16, 36, 40, { fill: acc }) + rect(0, 16, 360, 40, { stroke: LINE }) +
      text(108, 41, "60%", { size: 13, w: 700, fill: sec, anchor: "middle" }) + text(270, 41, "30%", { size: 13, w: 700, fill: "#fff", anchor: "middle" }) + text(342, 41, "10", { size: 11, w: 700, fill: "#fff", anchor: "middle" });
    const row = (y, c, n, t1, t2) => rect(0, y, 34, 34, { r: 8, fill: c, stroke: c === bg ? LINE : null }) + text(48, y + 14, n, { size: 14, w: 700, fill: INK }) + text(48, y + 32, t1, { size: 12 }) + text(48, y + 48, t2, { size: 12 });
    s += row(98, bg, "60% · Dominant", "The background and big areas.", "Sets the overall mood.") +
      row(178, sec, "30% · Secondary", "Text, image panels, cards.", "Gives the design its structure.") +
      row(258, acc, "10% · Accent", "Buttons, badges, one key word.", "Says “look here”. Use it sparingly.") + `</g>`;
    return svg(800, 420, s, "A café poster coloured with the 60-30-10 rule, with the proportions explained");
  };

  const colourContrast = () => {
    const pairs = [["#ffffff", "#1f7aff"], ["#16181d", "#ffd23f"], ["#9ca3af", "#ffffff"], ["#ffffff", "#1e3a34"], ["#ff6b6b", "#ff9f43"], ["#3d3d3d", "#f3f4f6"]];
    let s = "";
    pairs.forEach(([fg, bgc], i) => {
      const x = 30 + (i % 3) * 252, y = 30 + Math.floor(i / 3) * 190, r = contrast(fg, bgc), ok = r >= 4.5;
      s += rect(x, y, 236, 108, { r: 12, fill: bgc, stroke: bgc === "#ffffff" ? LINE : null }) +
        text(x + 18, y + 48, "Aa  Readable", { size: 26, w: 700, fill: fg, ls: -.5 }) + text(x + 18, y + 76, "Small text needs the most contrast.", { size: 11.5, w: 500, fill: fg });
      s += tick(x + 12, y + 132, ok) + text(x + 28, y + 136, r.toFixed(1) + " : 1", { size: 14, w: 700, fill: INK }) +
        text(x + 92, y + 136, ok ? "Passes for body text" : r >= 3 ? "Large text only" : "Hard to read", { size: 12, fill: ok ? GREEN : RED, w: 600 }) +
        text(x + 28, y + 156, `${fg.toUpperCase()} on ${bgc.toUpperCase()}`, { size: 10.5, ff: MONO, fill: FAINT });
    });
    return svg(800, 410, s, "Six text and background pairs with their measured contrast ratios");
  };

  /* =====================================================================
     TYPOGRAPHY
     ===================================================================== */
  // Guide-line labels on the right, nudged apart when two lines sit close together
  const guideLabels = (list, x, gap) => {
    const out = list.slice().sort((a, b) => a[0] - b[0]);
    for (let k = 1; k < out.length; k++) if (out[k][3] - out[k - 1][3] < gap) out[k][3] = out[k - 1][3] + gap;
    return out.map(([y, n, c, ly]) => text(x, ly + 4, n, { size: 12, w: 600, fill: c }) + (Math.abs(ly - y) > 1 ? line(x - 14, y, x - 4, ly, { stroke: c }) : "")).join("");
  };
  const typeAnatomy = () => {
    const ff = SERIF, word = "Typography", x0 = 70, base = 270;
    const size = Math.min(150, 150 * 560 / measure(ff, 400, 150, word).w);
    const cap1 = measure(ff, 400, size, "H").up, xh = measure(ff, 400, size, "x").up, asc = measure(ff, 400, size, "d").up, desc = measure(ff, 400, size, "p").down;
    const W = measure(ff, 400, size, word).w;
    let s = rect(x0 - 10, base - xh, W + 20, xh, { fill: "rgba(31,122,255,.06)" });
    const G = [[base - asc, "Ascender line", MUTE], [base - cap1, "Cap height", MUTE], [base - xh, "x-height", BLUE], [base, "Baseline", RED], [base + desc, "Descender line", MUTE]];
    G.forEach(([y, , c]) => { s += line(x0 - 10, y, x0 + W + 10, y, { stroke: c, sw: 1, dash: c === RED ? null : "5 4" }); });
    s += guideLabels(G.map(g => [g[0], g[1], g[2], g[0]]), x0 + W + 26, 16);
    s += text(x0, base, word, { size, w: 400, fill: INK, ff });
    s += lead(x0 + 6, base - cap1 + 3, x0 + 40, 52, "Serif: the small foot or flag at a stroke's end");
    s += dim(44, base - xh, 44, base, "", { stroke: BLUE }) + text(36, base - xh / 2 + 4, "x", { size: 12, w: 700, fill: BLUE, anchor: "end" });
    s += text(x0 - 10, 372, "Lowercase letters sit between the baseline and the x-height. Tall letters (d, h, k) reach the ascender", { size: 12.5 });
    s += text(x0 - 10, 390, "line; letters with tails (g, p, y) drop to the descender line. A big x-height reads well at small sizes.", { size: 12.5 });
    return svg(800, 410, s, "The anatomy of type: ascender, cap height, x-height, baseline and descender");
  };

  const typeFamilies = () => {
    const kinds = [
      ["Serif", SERIF, 400, "Small feet on the letters.", "Feels classic, trusted.", "Books, editorial, luxury."],
      ["Sans-serif", SANS, 500, "Clean strokes, no feet.", "Feels modern, clear.", "Apps, websites, signage."],
      ["Monospace", MONO, 500, "Every letter is as wide.", "Feels technical, precise.", "Code, receipts, data."],
      ["Display", SANS, 800, "Made for big sizes only.", "Feels loud, expressive.", "Headlines, posters, logos."]
    ];
    let s = "";
    kinds.forEach(([n, ff, w, a, b, c], i) => {
      const x = 24 + i * 192;
      s += rect(x, 24, 176, 344, { r: 14, fill: SOFT });
      s += text(x + 88, 150, "Ag", { size: i === 3 ? 92 : 84, w, fill: INK, ff, anchor: "middle", ls: i === 3 ? -5 : 0 });
      if (i === 2) { s += rect(x + 44, 86, 44, 80, { stroke: BLUE, dash: "3 3" }) + rect(x + 88, 86, 44, 80, { stroke: BLUE, dash: "3 3" }); }
      if (i === 0) s += circle(x + 66, 160, 16, { stroke: RED, sw: 1.5 }) + text(x + 66, 196, "serif", { size: 10.5, w: 600, fill: RED, anchor: "middle" });
      s += text(x + 18, 236, n, { size: 16, w: 700, fill: INK }) + text(x + 18, 262, a, { size: 11.5 }) + text(x + 18, 280, b, { size: 11.5 });
      s += cap(x + 18, 316, "Use for") + text(x + 18, 336, c, { size: 11.5, w: 600, fill: INK });
    });
    return svg(800, 392, s, "Four kinds of typeface: serif, sans-serif, monospace and display");
  };

  const typeScale = () => {
    const steps = [["Caption", 12.8], ["Body", 16], ["Lead", 20], ["H3", 25], ["H2", 31.3], ["H1", 39.1], ["Display", 48.8]];
    let s = cap(40, 40, "A type scale · each size is 1.25 × the one before");
    let y = 76;
    steps.slice().reverse().forEach(([n, px]) => {
      y += px * 1.02 + 10;
      s += text(40, y, n, { size: 11.5, w: 600, fill: FAINT }) + text(120, y, "Design is thinking made visual", { size: px * .78, w: n === "Body" || n === "Caption" || n === "Lead" ? 400 : 700, fill: INK, ls: px > 30 ? -1 : 0 }) +
        text(760, y, px + " px", { size: 11, w: 600, fill: BLUE, anchor: "end", ff: MONO });
    });
    return svg(800, 420, s, "A type scale from 12.8 to 48.8 pixels, each step 1.25 times larger");
  };

  const typeWeights = () => {
    let s = cap(40, 40, "One family, six weights");
    [[300, "Light"], [400, "Regular"], [500, "Medium"], [600, "Semibold"], [700, "Bold"], [800, "Extra bold"]].forEach(([w, n], i) => {
      const x = 40 + i * 124;
      s += text(x, 118, "Ag", { size: 58, w, fill: INK }) + text(x, 148, n, { size: 12, w: 600, fill: INK }) + text(x, 166, String(w), { size: 11, fill: BLUE, ff: MONO });
    });
    s += line(40, 200, 760, 200);
    s += text(40, 236, "Heavier weights shout, lighter weights whisper.", { size: 13, w: 600, fill: INK }) +
      text(40, 256, "Two or three weights from one family give you plenty of contrast: Bold for headings, Regular for", { size: 12.5 }) +
      text(40, 274, "reading, Medium for buttons and labels.", { size: 12.5 });
    return svg(800, 300, s, "Six font weights from Light 300 to Extra bold 800");
  };

  const typeLeading = () => {
    const para = ["Good spacing lets the eye", "find the start of the next", "line without effort, so", "reading feels easy and", "nobody gives up halfway."];
    const block = (x, lh, label, ok) => {
      let s = cap(x, 46, label) + tick(x + 302, 42, ok);
      para.forEach((l, i) => { s += text(x, 86 + i * 15 * lh, l, { size: 15, w: 400, fill: INK }); });
      if (ok) s += dim(x - 14, 86 - 11, x - 14, 86 - 11 + 15 * lh, "", { stroke: BLUE }) + text(x - 20, 86 + 15 * lh / 2 - 6, "1.5", { size: 10.5, w: 700, fill: BLUE, anchor: "end" });
      return s;
    };
    let s = block(70, 1.0, "Line height 1.0 · cramped", false) + block(450, 1.5, "Line height 1.5 · comfortable", true);
    s += line(40, 222, 760, 222);
    s += cap(40, 256, "Line length (the measure)");
    s += rect(40, 272, 720, 40, { r: 8, fill: SOFT });
    s += rect(40, 272, 300, 40, { r: 8, fill: "rgba(31,122,255,.12)" }) + rect(340, 272, 200, 40, { fill: "rgba(31,155,85,.14)" }) + rect(540, 272, 220, 40, { r: 8, fill: "rgba(229,72,77,.1)" });
    s += text(190, 297, "Under 45 · choppy", { size: 12, w: 600, fill: BLUE, anchor: "middle" }) + text(440, 297, "45–75 characters ✓", { size: 12, w: 700, fill: GREEN, anchor: "middle" }) + text(650, 297, "Over 75 · tiring", { size: 12, w: 600, fill: RED, anchor: "middle" });
    s += text(40, 340, "Aim for about 60 characters per line for body text: roughly 10 to 12 words.", { size: 12.5 });
    return svg(800, 360, s, "Line height and line length compared: cramped versus comfortable");
  };

  const typeTracking = () => {
    const row = (y, label, val, sample, o) => cap(40, y - o.size * .78 - 14, label) + text(40, y, sample, o) + text(760, y - 6, val, { size: 12, w: 700, fill: BLUE, anchor: "end", ff: MONO });
    let s = row(100, "Big headline · tighten it", "−2%", "Bold ideas", { size: 52, w: 800, fill: INK, ls: -1.6 }) +
      row(184, "Body text · leave it alone", "0", "Spacing that the type designer chose for reading.", { size: 17, w: 400, fill: INK }) +
      row(268, "Small uppercase labels · open them up", "+10%", "NEW COLLECTION · SPRING", { size: 13, w: 700, fill: INK, ls: 1.4 }) +
      row(352, "Never this: loose lowercase body text", "+12%", "spaced out words fall apart", { size: 17, w: 400, fill: RED, ls: 2.2 });
    s += line(40, 300, 760, 300);
    return svg(800, 380, s, "Letter spacing: tight for headlines, normal for body text, open for small capitals");
  };

  const typePairing = () => {
    const card = (x, ok, title, hf, hw, bf, note) => rect(x, 30, 236, 250, { r: 14, fill: SOFT }) + tick(x + 214, 52, ok) +
      text(x + 20, 96, title, { size: 30, w: hw, fill: INK, ff: hf, ls: -.8 }) + text(x + 20, 122, "A short subtitle sits here", { size: 13, w: 500, fill: INK, ff: bf }) +
      [0, 1, 2, 3].map(i => text(x + 20, 150 + i * 17, ["Body text in the second font", "carries the reading. The pair", "should differ clearly, not", "almost match."][i], { size: 11.5, w: 400, fill: MUTE, ff: bf })).join("") +
      line(x + 20, 228, x + 216, 228) + text(x + 20, 252, note[0], { size: 11.5, w: 600, fill: ok ? INK : RED }) + text(x + 20, 268, note[1], { size: 11, fill: MUTE });
    let s = card(24, true, "Big Sale", SERIF, 700, SANS, ["Serif heading + sans body", "Contrast in shape. Classic pair."]) +
      card(282, true, "Big Sale", SANS, 800, SANS, ["One family, two weights", "Contrast in weight. Always safe."]) +
      card(540, false, "Big Sale", SANS, 500, SANS, ["Medium heading + regular body", "Too similar: looks like a mistake."]);
    s += text(24, 316, "Rule of thumb: two fonts at most, and make them clearly different in shape, weight or size.", { size: 12.5, w: 500, fill: INK });
    return svg(800, 340, s, "Three font pairings: two good pairs and one that is too similar");
  };

  /* =====================================================================
     LAYOUT
     ===================================================================== */
  const layoutGrid = () => {
    const X = 60, Y = 50, W = 680, H = 300, m = 40, g = 16, cols = 12, cw = (W - m * 2 - g * (cols - 1)) / cols;
    const colX = i => X + m + i * (cw + g), span = (a, n) => [colX(a), n * cw + (n - 1) * g];
    let s = rect(X, Y, W, H, { r: 10, fill: PAPER, stroke: LINE });
    for (let i = 0; i < cols; i++) s += rect(colX(i), Y, cw, H, { fill: "rgba(229,72,77,.07)" });
    // content placed on the grid
    let [x, w] = span(0, 12); s += rect(x, Y + 24, w, 26, { r: 5, fill: "#2b2f36" });
    [x, w] = span(0, 7); s += rect(x, Y + 72, w, 200, { r: 8, fill: "#c9d6ea" }) + path(`M${x} ${Y + 272} l90 -80 l60 50 l70 -70 l${w - 220} 100 Z`, { fill: "#9fb5d8" });
    [x, w] = span(7, 5); s += rect(x, Y + 72, w * .9, 18, { r: 4, fill: "#2b2f36" }) + rect(x, Y + 98, w * .7, 18, { r: 4, fill: "#2b2f36" }) + lines(x, Y + 134, w, 6, { gap: 13 }) + rect(x, Y + 232, 92, 30, { r: 15, fill: BLUE });
    // labels
    s += dim(X, Y + H + 22, X + m, Y + H + 22, "Margin", { stroke: RED }) + dim(colX(1) - g, Y + H + 22, colX(1), Y + H + 22, "", { stroke: RED }) + text(colX(1) - g / 2, Y + H + 44, "Gutter", { size: 11, w: 600, fill: RED, anchor: "middle" });
    s += text(colX(4) + cw / 2, Y + H + 26, "Column", { size: 11, w: 600, fill: RED, anchor: "middle" }) + line(colX(4) + cw / 2, Y + H + 14, colX(4) + cw / 2, Y + H - 2, { stroke: RED });
    s += text(X + W, Y - 14, "12 columns", { size: 12, w: 700, fill: INK, anchor: "end" }) + text(X, Y - 14, "Image spans 7 columns · text spans 5", { size: 12, w: 500 });
    return svg(800, 420, s, "A 12-column grid with margins, columns and gutters, and content placed on it");
  };

  const layoutSpacing = () => {
    const scale = [4, 8, 16, 24, 32, 48, 64];
    let s = cap(40, 44, "A spacing scale · every gap comes from this list");
    scale.forEach((v, i) => { const y = 64 + i * 40; s += rect(40, y, v * 3.2, 24, { r: 4, fill: i === 2 || i === 3 ? BLUE : "#bcd3fb" }) + text(40 + v * 3.2 + 10, y + 16, v + " px", { size: 12, w: 600, fill: INK, ff: MONO }); });
    // a card using the scale
    const cx = 470, cy = 60;
    s += `<g transform="translate(${cx} ${cy})">` + rect(0, 0, 290, 300, { r: 14, fill: SOFT }) +
      rect(24, 24, 242, 120, { r: 10, fill: "#c9d6ea" }) + rect(24, 168, 170, 16, { r: 4, fill: "#2b2f36" }) + lines(24, 200, 242, 3, { gap: 13 }) + rect(24, 252, 110, 32, { r: 16, fill: BLUE }) +
      dim(0, 300 - 8, 24, 300 - 8, "24") + dim(24 + 242 / 2, 144, 24 + 242 / 2, 168, "24") + dim(220, 184, 220, 200, "16") + dim(170, 226, 170, 252, "24") + `</g>`;
    s += text(40, 394, "Padding, gaps and margins all use the same few numbers from the scale.", { size: 12.5 });
    return svg(800, 410, s, "A spacing scale from 4 to 64 pixels and a card that uses it");
  };

  const layoutAlign = () => {
    const card = (ox, aligned) => {
      const xs = aligned ? [0, 0, 0, 0] : [6, 22, -8, 14];
      let s = rect(ox, 50, 330, 290, { r: 12, fill: SOFT });
      const L = ox + 34;
      s += rect(L + xs[0], 82, 180, 22, { r: 5, fill: "#2b2f36" }) + rect(L + xs[1], 122, 250, 70, { r: 8, fill: "#c9d6ea" }) +
        lines(L + xs[2], 212, 240, 4, { gap: 13 }) + rect(L + xs[3], 280, 104, 32, { r: 16, fill: BLUE });
      if (aligned) s += line(L, 64, L, 328, { stroke: RED, sw: 1.2 }) + text(L + 4, 344 + 14, "One shared left edge", { size: 11.5, w: 600, fill: RED });
      else [L + xs[0], L + xs[1], L + xs[2], L + xs[3]].forEach((x, i) => { s += line(x, [76, 116, 206, 274][i], x, [110, 198, 260, 318][i], { stroke: RED, sw: 1, dash: "3 3", op: .7 }); });
      return s;
    };
    let s = card(40, false) + card(430, true);
    s += cap(40, 36, "Before · four different edges") + cap(430, 36, "After · everything on one line");
    s += arrow(380, 195, 420, 195, { stroke: FAINT });
    return svg(800, 380, s, "Before and after: misaligned elements, then the same elements aligned to one edge");
  };

  const layoutProximity = () => {
    const item = (x, y) => rect(x, y, 40, 40, { r: 9, fill: "#c9d6ea" }) + rect(x + 52, y + 9, 110, 10, { r: 3, fill: "#2b2f36" }) + rect(x + 52, y + 26, 80, 7, { r: 3, fill: "#dfe2e6" });
    const step = 46, top = 64, gap2 = top + 3 * step + 36;
    let s = cap(40, 44, "Even gaps · what goes with what?") + cap(440, 44, "Grouped · two clear sets");
    for (let i = 0; i < 6; i++) s += item(40, top + i * (step + 6));
    for (let i = 0; i < 3; i++) s += item(440, top + i * step) + item(440, gap2 + i * step);
    s += rect(430, top - 9, 230, 3 * step + 12, { r: 12, stroke: BLUE, dash: "4 4" }) + rect(430, gap2 - 9, 230, 3 * step + 12, { r: 12, stroke: BLUE, dash: "4 4" });
    s += dim(690, top + 40, 690, top + step, "6") + dim(690, top + 2 * step + 40, 690, gap2, "42");
    s += text(440, 392, "Small gaps inside a group, big gaps between groups.", { size: 12.5, w: 600, fill: INK });
    return svg(800, 410, s, "Proximity: the same items with even spacing and then grouped by spacing");
  };

  const layoutWhitespace = () => {
    const flyer = (ox, roomy) => {
      let s = rect(ox, 40, 320, 330, { r: 12, fill: PAPER, stroke: LINE });
      if (!roomy) {
        s += rect(ox + 8, 48, 304, 26, { r: 3, fill: "#2b2f36" }) + rect(ox + 8, 78, 150, 110, { r: 4, fill: "#c9d6ea" }) + rect(ox + 162, 78, 150, 110, { r: 4, fill: "#e3c9b8" }) +
          lines(ox + 8, 194, 304, 9, { gap: 9, h: 4 }) + rect(ox + 8, 280, 98, 26, { r: 4, fill: BLUE }) + rect(ox + 110, 280, 98, 26, { r: 4, fill: RED }) + rect(ox + 212, 280, 100, 26, { r: 4, fill: "#f0b429" }) +
          lines(ox + 8, 312, 304, 5, { gap: 9, h: 4 });
      } else {
        s += rect(ox + 40, 76, 200, 26, { r: 4, fill: "#2b2f36" }) + rect(ox + 40, 124, 240, 120, { r: 8, fill: "#c9d6ea" }) +
          lines(ox + 40, 268, 220, 3, { gap: 13 }) + rect(ox + 40, 318, 110, 30, { r: 15, fill: BLUE });
        s += dim(ox, 392, ox + 40, 392, "40", { stroke: GREEN }) + dim(ox + 160, 102, ox + 160, 124, "", { stroke: GREEN });
      }
      return s;
    };
    let s = flyer(40, false) + flyer(440, true) + cap(40, 28, "Crammed · nothing stands out") + cap(440, 28, "With white space · calm and clear");
    return svg(800, 410, s, "The same flyer crammed full and then given generous white space");
  };

  /* =====================================================================
     HIERARCHY
     ===================================================================== */
  const hierOrder = () => {
    const X = 60, Y = 30;
    let s = `<defs><radialGradient id="afh${++uid}"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".55"/><stop offset=".5" stop-color="#ffb23c" stop-opacity=".25"/><stop offset="1" stop-color="#ffd23c" stop-opacity="0"/></radialGradient></defs>`;
    const heat = `url(#afh${uid})`;
    s += rect(X, Y, 330, 360, { r: 12, fill: PAPER, stroke: LINE });
    s += rect(X + 30, Y + 40, 250, 40, { r: 6, fill: "#2b2f36" }) + rect(X + 30, Y + 98, 270, 130, { r: 10, fill: "#c9d6ea" }) + rect(X + 30, Y + 246, 190, 14, { r: 4, fill: "#5b616b" }) +
      lines(X + 30, Y + 272, 260, 3, { gap: 12 }) + rect(X + 30, Y + 312, 120, 32, { r: 16, fill: BLUE });
    s += circle(X + 140, Y + 60, 80, { fill: heat }) + circle(X + 165, Y + 160, 70, { fill: heat, op: .8 }) + circle(X + 90, Y + 328, 46, { fill: heat, op: .7 });
    s += badge(X + 300, Y + 58, "1") + badge(X + 312, Y + 116, "2") + badge(X + 240, Y + 252, "3") + badge(X + 168, Y + 328, "4");
    s += curve(`M${X + 300} ${Y + 70} C ${X + 330} ${Y + 90}, ${X + 330} ${Y + 100}, ${X + 312} ${Y + 104}`, { stroke: FAINT, dash: "3 4" }) +
      curve(`M${X + 312} ${Y + 128} C ${X + 300} ${Y + 200}, ${X + 260} ${Y + 230}, ${X + 245} ${Y + 241}`, { stroke: FAINT, dash: "3 4" }) +
      curve(`M${X + 236} ${Y + 263} C ${X + 220} ${Y + 300}, ${X + 190} ${Y + 320}, ${X + 179} ${Y + 324}`, { stroke: FAINT, dash: "3 4" });
    s += `<g transform="translate(440 60)">` + cap(0, 0, "Where eyes go, in order") +
      [["1", "The headline", "Biggest and darkest, so it's seen first."], ["2", "The picture", "Large images pull the eye next."], ["3", "The subheading", "Explains the headline in a few words."], ["4", "The button", "Strong colour: the thing to do."]]
        .map(([n, a, b], i) => badge(11, 34 + i * 70, n) + text(32, 38 + i * 70, a, { size: 14, w: 700, fill: INK }) + text(32, 58 + i * 70, b, { size: 12 })).join("") + `</g>`;
    s += text(440, 370, "Warm areas show where most people look.", { size: 11.5, fill: FAINT });
    return svg(800, 420, s, "A poster with a reading order of one to four and a heatmap of attention");
  };

  const hierSize = () => {
    const items = ["Summer Market", "Saturday 14 June · 9am to 2pm", "Food, crafts and live music", "Free entry"];
    let s = cap(40, 40, "Everything the same · nothing leads") + cap(440, 40, "Ranked by size and weight");
    s += rect(30, 54, 340, 300, { r: 12, fill: SOFT }) + rect(430, 54, 340, 300, { r: 12, fill: SOFT });
    items.forEach((t, i) => { s += text(54, 104 + i * 34, t, { size: 16, w: 500, fill: INK }); });
    s += text(454, 120, "Summer Market", { size: 38, w: 800, fill: INK, ls: -1 }) + text(454, 156, "Saturday 14 June · 9am to 2pm", { size: 16, w: 600, fill: INK }) +
      text(454, 184, "Food, crafts and live music", { size: 14, w: 400, fill: MUTE }) + rect(454, 214, 104, 32, { r: 16, fill: BLUE }) + text(506, 235, "Free entry", { size: 12.5, w: 700, fill: "#fff", anchor: "middle" });
    s += badge(760, 108, "1", { r: 9, size: 10 }) + badge(760, 152, "2", { r: 9, size: 10 }) + badge(760, 182, "4", { r: 9, size: 10 }) + badge(576, 230, "3", { r: 9, size: 10 });
    s += text(40, 390, "Same words, same order. On the right, size, weight and colour tell the reader what matters most.", { size: 12.5, w: 500, fill: INK });
    return svg(800, 410, s, "The same text set at one size and then ranked by size, weight and colour");
  };

  const hierColour = () => {
    let s = cap(40, 40, "Contrast decides what stands out");
    // a pricing row: one plan pops
    [0, 1, 2].forEach(i => {
      const x = 40 + i * 168, on = i === 1;
      s += rect(x, 60, 152, 200, { r: 12, fill: on ? INK : SOFT }) + rect(x + 18, 82, 60, 10, { r: 3, fill: on ? "#ffffff" : "#5b616b" }) +
        text(x + 18, 136, ["R0", "R99", "R249"][i], { size: 30, w: 800, fill: on ? "#fff" : INK, ls: -1 }) + lines(x + 18, 156, 116, 3, { gap: 12, fill: on ? "#4b5059" : "#dfe2e6" }) +
        rect(x + 18, 212, 116, 30, { r: 15, fill: on ? BLUE : "#e3e5e9" }) + (on ? rect(x + 90, 72, 50, 18, { r: 9, fill: BLUE }) + text(x + 115, 85, "Best", { size: 10, w: 800, fill: "#fff", anchor: "middle" }) : "");
    });
    s += badge(40 + 168 + 18, 60, "A", { fill: BLUE, r: 10, size: 10.5 }) + badge(40 + 168 + 148, 72, "B", { fill: BLUE, r: 10, size: 10.5 }) + badge(40 + 168 + 148, 227, "C", { fill: BLUE, r: 10, size: 10.5 });
    s += [["A", "A dark card among light ones", "Contrast with the neighbours"], ["B", "A small badge", "Adds a reason to choose it"], ["C", "One strong colour", "One clear action to take"]]
      .map(([n, a, b], k) => badge(568, 82 + k * 58, n, { fill: BLUE, r: 10, size: 10.5 }) + text(586, 86 + k * 58, a, { size: 13, w: 700, fill: INK }) + text(586, 104 + k * 58, b, { size: 12 })).join("");
    s += text(40, 300, "If everything is bright, nothing is. Keep most things quiet (greys, white, black) and save your", { size: 12.5 });
    s += text(40, 318, "strongest colour for the one thing you want people to notice or click.", { size: 12.5 });
    return svg(800, 340, s, "Three price cards where colour and contrast make the middle one stand out");
  };

  const hierPatterns = () => {
    const page = (ox, kind) => {
      let s = rect(ox, 50, 330, 300, { r: 12, fill: PAPER, stroke: LINE });
      if (kind === "F") {
        s += rect(ox + 24, 74, 220, 18, { r: 4, fill: "#2b2f36" });
        for (let i = 0; i < 6; i++) s += rect(ox + 24, 112 + i * 36, 14, 14, { r: 3, fill: "#c9d6ea" }) + rect(ox + 46, 114 + i * 36, i < 2 ? 240 : 120 - i * 10, 9, { r: 3, fill: "#c3c8cf" });
        s += path(`M${ox + 30} 84 H${ox + 290} M${ox + 30} 84 V330 M${ox + 30} 156 H${ox + 230}`, { stroke: RED, sw: 3, op: .75 });
      } else {
        s += rect(ox + 24, 72, 70, 16, { r: 4, fill: "#2b2f36" }) + rect(ox + 226, 72, 80, 16, { r: 8, fill: BLUE });
        s += rect(ox + 24, 130, 282, 110, { r: 10, fill: "#c9d6ea" });
        s += rect(ox + 24, 288, 120, 30, { r: 15, fill: BLUE }) + rect(ox + 226, 292, 80, 22, { r: 4, fill: "#c3c8cf" });
        s += path(`M${ox + 40} 80 L${ox + 290} 80 L${ox + 50} 302 L${ox + 290} 302`, { stroke: RED, sw: 3, op: .75 });
      }
      return s;
    };
    let s = page(40, "F") + page(430, "Z");
    s += cap(40, 36, "F pattern · text-heavy pages") + cap(430, 36, "Z pattern · simple pages and ads");
    s += text(40, 376, "People read the top line, then the start of each line below.", { size: 12 }) + text(430, 376, "The eye zig-zags from top left to bottom right.", { size: 12 });
    s += text(40, 394, "Put key words at the start of headings.", { size: 12, w: 600, fill: INK }) + text(430, 394, "Put the button where the Z ends.", { size: 12, w: 600, fill: INK });
    return svg(800, 410, s, "The F and Z scanning patterns drawn over two page layouts");
  };

  const hierSquint = () => {
    const id = "afb" + ++uid;
    const poster = ox => rect(ox, 50, 300, 300, { r: 12, fill: PAPER, stroke: LINE }) + rect(ox + 28, 82, 200, 34, { r: 6, fill: "#2b2f36" }) +
      rect(ox + 28, 134, 244, 110, { r: 10, fill: "#9fb5d8" }) + lines(ox + 28, 262, 230, 3, { gap: 12 }) + rect(ox + 28, 306, 112, 30, { r: 15, fill: BLUE });
    let s = `<defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
    s += poster(40) + `<g filter="url(#${id})">${poster(460)}</g>`;
    s += cap(40, 36, "Your design") + cap(460, 36, "Squint at it (or blur it)");
    s += arrow(360, 200, 440, 200, { stroke: FAINT });
    s += text(460, 368, "Still visible: the headline and the button.", { size: 12.5, w: 600, fill: GREEN });
    s += text(40, 392, "Blur hides the details and leaves only the hierarchy. If the important parts vanish, make them bigger or bolder.", { size: 12.5 });
    return svg(800, 410, s, "The squint test: a poster shown sharp and blurred");
  };

  /* =====================================================================
     LOGOS (a made-up brand, Nova)
     ===================================================================== */
  // The Nova mark: a circle cut by a smaller circle, with a dot. Built from two circles and one dot.
  const novaMark = (cx, cy, r, c = INK, bg = PAPER) => circle(cx, cy, r, { fill: c }) + circle(cx + r * .42, cy - r * .3, r * .62, { fill: bg }) + circle(cx + r * .42, cy - r * .3, r * .2, { fill: c });
  const logoTypes = () => {
    const tile = (i, name, note, art) => { const x = 20 + i * 154; return rect(x, 30, 142, 150, { r: 12, fill: SOFT }) + art(x + 71, 105) + text(x + 8, 210, name, { size: 13, w: 700, fill: INK }) + text(x + 8, 228, note[0], { size: 11 }) + text(x + 8, 244, note[1], { size: 11 }); };
    let s = tile(0, "Wordmark", ["The name, set in", "a chosen font."], (x, y) => text(x, y + 10, "nova", { size: 36, w: 800, fill: INK, anchor: "middle", ls: -1.5 })) +
      tile(1, "Lettermark", ["Initials only. Good", "for long names."], (x, y) => rect(x - 34, y - 34, 68, 68, { r: 18, fill: INK }) + text(x, y + 15, "N", { size: 42, w: 800, fill: PAPER, anchor: "middle" })) +
      tile(2, "Symbol", ["A picture with no", "words. Needs fame."], (x, y) => novaMark(x, y, 34)) +
      tile(3, "Combination", ["Symbol plus name.", "The most common."], (x, y) => novaMark(x - 40, y, 18) + text(x - 14, y + 9, "nova", { size: 26, w: 800, fill: INK, ls: -1 })) +
      tile(4, "Emblem", ["Words inside a", "shape, like a seal."], (x, y) => circle(x, y, 38, { stroke: INK, sw: 3 }) + circle(x, y, 30, { stroke: INK, sw: 1 }) + text(x, y + 5, "NOVA", { size: 13, w: 800, fill: INK, anchor: "middle", ls: 1.5 }) + text(x, y + 20, "EST. 2024", { size: 6.5, w: 700, fill: INK, anchor: "middle", ls: 1 }));
    s += text(20, 290, "Start simple. Most new brands do best with a wordmark or a combination mark.", { size: 12.5, w: 500, fill: INK });
    return svg(800, 310, s, "Five kinds of logo for a made-up brand called Nova");
  };

  const logoGrid = () => {
    const cx = 220, cy = 210, r = 120;
    let s = "";
    for (let i = 0; i <= 12; i++) { s += line(cx - 180 + i * 30, 30, cx - 180 + i * 30, 390, { stroke: "#eceef1" }) + line(40, 30 + i * 30, 400, 30 + i * 30, { stroke: "#eceef1" }); }
    s += novaMark(cx, cy, r, "#e8eefc", PAPER);
    s += circle(cx, cy, r, { stroke: BLUE, sw: 1.4, dash: "5 4" }) + circle(cx + r * .42, cy - r * .3, r * .62, { stroke: RED, sw: 1.4, dash: "5 4" }) + circle(cx + r * .42, cy - r * .3, r * .2, { stroke: INK, sw: 1.2, dash: "3 3" });
    s += line(cx, cy, cx - r, cy, { stroke: BLUE }) + text(cx - r / 2, cy - 7, "r", { size: 13, w: 700, fill: BLUE, anchor: "middle" }) + circle(cx, cy, 3, { fill: BLUE });
    s += lead(cx - r * .7, cy + r * .7, 40, 412, "Circle 1 · radius r", { stroke: BLUE, fill: BLUE });
    s += lead(cx + r * .42 + r * .62 * .7, cy - r * .3 - r * .62 * .7, 330, 18, "Circle 2 · 0.62 r", { stroke: RED, fill: RED });
    s += arrow(420, 210, 480, 210, { stroke: FAINT });
    s += novaMark(620, 160, 90) + text(620, 300, "Final mark", { size: 14, w: 700, fill: INK, anchor: "middle" }) + text(620, 320, "Two circles and a dot. Simple", { size: 12, anchor: "middle" }) + text(620, 336, "enough to draw from memory.", { size: 12, anchor: "middle" });
    return svg(800, 430, s, "The Nova mark built from two circles on a grid, then shown finished");
  };

  const logoColour = () => {
    const tile = (x, bg, c, name, note, word = INK) => rect(x, 30, 176, 176, { r: 14, fill: bg, stroke: bg === PAPER ? LINE : null }) + novaMark(x + 54, 118, 24, c, bg) + text(x + 86, 127, "nova", { size: 26, w: 800, fill: word, ls: -1 }) +
      text(x, 232, name, { size: 13, w: 700, fill: INK }) + text(x, 250, note, { size: 11.5 });
    let s = tile(24, PAPER, BLUE, "Full colour", "The main version.", INK) + tile(214, PAPER, INK, "One colour", "For stamps, fax, engraving.", INK) +
      tile(404, "#16181d", PAPER, "Reversed", "White on dark backgrounds.", PAPER) + tile(594, BLUE, PAPER, "On brand colour", "Knocked out of a fill.", PAPER);
    s += text(24, 300, "A strong logo works in one flat colour first. Colour adds feeling, but the shape must carry it alone.", { size: 12.5, w: 500, fill: INK });
    return svg(800, 320, s, "The Nova logo in full colour, one colour, reversed and on a brand colour");
  };

  const logoSize = () => {
    let s = cap(40, 40, "Clear space · keep this area empty");
    const x0 = 150, y0 = 150, u = 34;
    s += rect(x0 - u, y0 - u - 30, 230 + u * 2, 60 + u * 2, { r: 8, fill: "rgba(31,122,255,.07)", stroke: BLUE, dash: "4 4" });
    s += novaMark(x0 + 30, y0, 30, BLUE) + text(x0 + 72, y0 + 12, "nova", { size: 40, w: 800, fill: INK, ls: -1.5 });
    s += dim(x0 - u, y0 - 30 - u - 14, x0, y0 - 30 - u - 14, "x") + dim(x0 + 230, y0 + 30 + 14, x0 + 230 + u, y0 + 30 + 14, "x");
    s += text(40, 270, "x = the height of the dot's circle. Nothing else (text, edges, other logos) goes inside the box.", { size: 12 });
    s += line(40, 296, 760, 296);
    s += cap(40, 326, "The small-size test");
    [64, 40, 24, 16].forEach((px, i) => { const k = px / 64, x = [60, 290, 470, 610][i]; s += novaMark(x + 30 * k, 380, 30 * k, BLUE) + text(x + 66 * k, 380 + 12 * k, "nova", { size: 40 * k, w: 800, fill: INK, ls: -1.5 * k }) + text(x, 418, px + " px tall", { size: 11, w: 600, fill: MUTE }); });
    return svg(800, 430, s, "Clear space around the Nova logo, and the logo tested at four small sizes");
  };

  /* =====================================================================
     MOCKUPS
     ===================================================================== */
  const shirt = (x, y, s, c) => path(`M${x - 40 * s} ${y - 70 * s} L${x - 14 * s} ${y - 80 * s} Q${x} ${y - 66 * s} ${x + 14 * s} ${y - 80 * s} L${x + 40 * s} ${y - 70 * s} L${x + 66 * s} ${y - 40 * s} L${x + 48 * s} ${y - 24 * s} L${x + 36 * s} ${y - 36 * s} L${x + 36 * s} ${y + 70 * s} L${x - 36 * s} ${y + 70 * s} L${x - 36 * s} ${y - 36 * s} L${x - 48 * s} ${y - 24 * s} L${x - 66 * s} ${y - 40 * s} Z`, { fill: c, stroke: "rgba(0,0,0,.12)", sw: 1 });
  const mockFlat = () => {
    let s = cap(40, 40, "Flat artwork") + cap(450, 40, "The same artwork in a mockup");
    s += rect(40, 60, 300, 260, { r: 12, fill: PAPER, stroke: LINE }) + novaMark(150, 190, 34, BLUE) + text(194, 202, "nova", { size: 40, w: 800, fill: INK, ls: -1.5 });
    s += arrow(360, 190, 430, 190, { stroke: FAINT });
    const g = grad(["#eef1f5", "#dfe4ea"], { x2: 0, y2: 1 });
    s += `<defs>${g.def}</defs>` + rect(450, 60, 310, 260, { r: 12, fill: `url(#${g.id})` });
    s += `<ellipse cx="605" cy="306" rx="96" ry="10" fill="rgba(0,0,0,.12)"/>` + shirt(605, 214, 1.15, "#1d2430");
    s += novaMark(588, 170, 9, PAPER, "#1d2430") + text(601, 174, "nova", { size: 13, w: 800, fill: PAPER, ls: -.5 });
    s += path("M560 230 q20 30 0 60 M650 220 q-12 40 4 70", { stroke: "rgba(255,255,255,.08)", sw: 6 });
    s += text(40, 352, "A mockup shows the client how the design will look in real life, before anything is printed.", { size: 12.5, w: 500, fill: INK });
    return svg(800, 370, s, "A flat logo, then the same logo shown on a T-shirt in a mockup");
  };

  const mockSmart = () => {
    let s = "";
    // a layers panel
    s += `<g transform="translate(36 40)">` + rect(0, 0, 250, 250, { r: 12, fill: "#2b2d31" }) + text(16, 26, "Layers", { size: 12, w: 700, fill: "#e8e8e8" }) +
      [["Shadows & folds", "#5b5f66", false], ["Your design", BLUE, true], ["Shirt colour", "#e8743b", false], ["Background", "#9aa0aa", false]].map(([n, c, on], i) =>
        rect(8, 42 + i * 48, 234, 42, { r: 8, fill: on ? "rgba(31,122,255,.28)" : "transparent", stroke: on ? BLUE : null }) + rect(18, 50 + i * 48, 26, 26, { r: 5, fill: c }) +
        (on ? rect(36, 68 + i * 48, 12, 12, { r: 3, fill: PAPER }) + rect(39, 71 + i * 48, 6, 6, { r: 1, fill: BLUE }) : "") + text(56, 67 + i * 48, n, { size: 12, w: on ? 700 : 500, fill: "#e8e8e8" }) +
        (on ? text(56, 82 + i * 48, "Smart Object", { size: 10, w: 600, fill: "#9cc2ff" }) : "")).join("") + `</g>`;
    s += badge(36, 32, "1", { fill: BLUE });
    s += arrow(296, 116, 372, 116, { stroke: FAINT }) + text(334, 104, "Double-click", { size: 11, w: 600, fill: INK, anchor: "middle" });
    // the smart object's contents
    s += `<g transform="translate(380 40)">` + rect(0, 0, 200, 170, { r: 12, fill: PAPER, stroke: LINE }) + rect(0, 0, 200, 26, { r: 12, fill: SOFT }) + rect(0, 14, 200, 12, { fill: SOFT }) +
      text(12, 18, "design.psb", { size: 11, w: 600, fill: MUTE }) + novaMark(70, 96, 22, BLUE) + text(98, 104, "nova", { size: 24, w: 800, fill: INK, ls: -1 }) + `</g>`;
    s += badge(380, 32, "2", { fill: BLUE }) + text(380, 236, "Paste your artwork here,", { size: 12, w: 600, fill: INK }) + text(380, 252, "then Save (Ctrl/⌘ + S).", { size: 12 });
    s += arrow(590, 116, 640, 116, { stroke: FAINT }) + text(615, 104, "Save", { size: 11, w: 600, fill: INK, anchor: "middle" });
    // the updated scene
    s += `<g transform="translate(650 40)">` + rect(0, 0, 120, 170, { r: 12, fill: "#e9edf2" }) + shirt(60, 92, .62, "#1d2430") + novaMark(52, 72, 5, PAPER, "#1d2430") + text(59, 75, "nova", { size: 8, w: 800, fill: PAPER }) + `</g>`;
    s += badge(650, 32, "3", { fill: BLUE }) + text(650, 236, "The scene updates,", { size: 12, w: 600, fill: INK }) + text(650, 252, "with folds and light.", { size: 12 });
    s += line(36, 300, 770, 300);
    s += text(36, 330, "A smart object is a box inside the mockup. Whatever you put in the box is bent, shaded and lit to match the photo.", { size: 12.5 });
    s += text(36, 348, "The layers above it (shadows, folds) stay on top, which is why the result looks printed, not pasted.", { size: 12.5 });
    return svg(800, 370, s, "How a smart object mockup works in three steps: double-click, replace, save");
  };

  const mockScenes = () => {
    const icon = {
      cup: (x, y) => path(`M${x - 22} ${y - 26} h44 l-6 52 h-32 Z`, { fill: "#e8743b" }) + rect(x - 24, y - 32, 48, 8, { r: 3, fill: "#2b2f36" }),
      shirt: (x, y) => shirt(x, y + 4, .42, "#1d2430"),
      phone: (x, y) => rect(x - 18, y - 34, 36, 68, { r: 7, fill: "#2b2f36" }) + rect(x - 14, y - 28, 28, 52, { r: 3, fill: "#9fb5d8" }),
      card: (x, y) => `<g transform="rotate(-8 ${x} ${y})">` + rect(x - 34, y - 20, 68, 40, { r: 4, fill: PAPER, stroke: LINE }) + rect(x - 26, y - 10, 24, 6, { r: 2, fill: "#2b2f36" }) + rect(x - 26, y + 2, 40, 4, { r: 2, fill: "#c3c8cf" }) + `</g>`,
      bottle: (x, y) => rect(x - 8, y - 38, 16, 14, { r: 3, fill: "#2b2f36" }) + rect(x - 18, y - 24, 36, 60, { r: 10, fill: "#7fb89a" }) + rect(x - 18, y - 4, 36, 18, { fill: PAPER, op: .85 }),
      sign: (x, y) => rect(x - 36, y - 26, 72, 40, { r: 4, fill: "#2b2f36" }) + rect(x - 3, y + 14, 6, 22, { fill: "#5b616b" }) + rect(x - 24, y - 12, 48, 8, { r: 2, fill: "#f0b429" })
    };
    const rows = [["Café or bakery", "Cups, bags,|menus", "cup"], ["Clothing", "T-shirts, hoodies,|labels", "shirt"], ["App or tech", "Phones, laptops,|screens", "phone"],
      ["Agency", "Business cards,|letterheads", "card"], ["Beauty, drinks", "Bottles, jars,|boxes", "bottle"], ["Shop, restaurant", "Signs, storefronts,|flags", "sign"]];
    let s = "";
    rows.forEach(([a, b, k], i) => {
      const x = 24 + (i % 3) * 256, y = 24 + Math.floor(i / 3) * 170;
      s += rect(x, y, 240, 150, { r: 12, fill: SOFT }) + icon[k](x + 60, y + 72) + text(x + 112, y + 62, a, { size: 13, w: 700, fill: INK }) + b.split("|").map((t, k) => text(x + 112, y + 82 + k * 16, t, { size: 11.5 })).join("");
    });
    s += text(24, 374, "Show the design where the client's customers will actually see it.", { size: 12.5, w: 500, fill: INK });
    return svg(800, 390, s, "Six kinds of business and the mockup scenes that suit each one");
  };

  const mockBoard = () => {
    let s = rect(30, 24, 740, 330, { r: 14, fill: SOFT });
    const g = grad(["#eef1f5", "#dde3ea"], { x2: 0, y2: 1 });
    s += `<defs>${g.def}</defs>` + rect(50, 44, 380, 290, { r: 10, fill: `url(#${g.id})` }) + shirt(240, 196, 1.2, "#1d2430") + novaMark(222, 150, 10, PAPER, "#1d2430") + text(236, 154, "nova", { size: 14, w: 800, fill: PAPER });
    s += rect(446, 44, 150, 100, { r: 10, fill: PAPER }) + novaMark(484, 94, 14, BLUE) + text(502, 101, "nova", { size: 20, w: 800, fill: INK, ls: -1 });
    s += rect(604, 44, 146, 100, { r: 10, fill: INK }) + novaMark(640, 94, 14, PAPER, INK) + text(658, 101, "nova", { size: 20, w: 800, fill: PAPER, ls: -1 });
    s += rect(446, 154, 304, 70, { r: 10, fill: PAPER }) + swatchRow(462, 180, [BLUE, INK, "#e8eefc", "#f0b429"], { w: 28, h: 28, gap: 8, r: 8 }) +
      text(620, 192, "#1F7AFF", { size: 10.5, ff: MONO, fill: MUTE }) + text(620, 208, "#16181D", { size: 10.5, ff: MONO, fill: MUTE });
    s += rect(446, 234, 304, 100, { r: 10, fill: PAPER }) + text(462, 296, "Aa", { size: 36, w: 800, fill: INK }) + text(522, 280, "Inter", { size: 14, w: 700, fill: INK }) + text(522, 298, "Headings Bold · Body Regular", { size: 11 }) + lines(462, 312, 270, 2, { gap: 10 });
    s += cap(66, 66, "1 · Hero mockup") + cap(462, 62, "2 · Logo, light") + cap(620, 62, "3 · and dark", { fill: "#8b9099" }) + cap(462, 168, "4 · Palette") + cap(462, 252, "5 · Type");
    return svg(800, 370, s, "A client presentation board: a hero mockup, the logo on light and dark, the palette and the font");
  };

  /* =====================================================================
     CARD COVERS (4:3)
     ===================================================================== */
  const cover = {
    colour() {
      let s = wheel(250, 300, 190, { hole: .54 });
      const pts = [0, 4, 8].map(i => wheelPt(250, 300, 190 * .77, i));
      s += path("M" + pts.map(p => p.join(" ")).join(" L") + " Z", { stroke: INK, sw: 2 }) + pts.map(([x, y], j) => circle(x, y, 10, { fill: hueAt([0, 4, 8][j]), stroke: PAPER, sw: 3.5 })).join("");
      s += text(250, 296, "Triadic", { size: 22, w: 700, fill: INK, anchor: "middle" }) + text(250, 322, "0° · 120° · 240°", { size: 14, fill: MUTE, anchor: "middle" });
      s += cap(500, 110, "Palette", { size: 13 });
      [hsl(0, 78, 52), hsl(130, 60, 42), hsl(230, 72, 56), hsl(0, 60, 95), "#16181d"].forEach((c, i) => {
        s += rect(500, 128 + i * 66, 52, 52, { r: 12, fill: c, stroke: i === 3 ? LINE : null }) + text(568, 152 + i * 66, ["Main", "Second", "Third", "Light", "Dark"][i], { size: 15, w: 700, fill: INK }) + text(568, 172 + i * 66, c.toUpperCase(), { size: 12.5, fill: MUTE, ff: MONO });
      });
      return svg(800, 600, s, "A colour wheel with a triadic harmony and the palette it makes");
    },
    type() {
      const ff = SERIF, size = 230, base = 380, x0 = 70;
      const xh = measure(ff, 400, size, "x").up, cap1 = measure(ff, 400, size, "H").up, asc = measure(ff, 400, size, "f").up, desc = measure(ff, 400, size, "g").down, W = measure(ff, 400, size, "Hxgf").w;
      let s = rect(x0 - 16, base - xh, W + 32, xh, { fill: "rgba(31,122,255,.07)" });
      const G = [[base - asc, "Ascender", MUTE], [base - cap1, "Cap height", MUTE], [base - xh, "x-height", BLUE], [base, "Baseline", RED], [base + desc, "Descender", MUTE]];
      G.forEach(([y, , c]) => { s += line(x0 - 16, y, x0 + W + 16, y, { stroke: c, dash: c === RED ? null : "6 5", sw: 1.4 }); });
      s += guideLabels(G.map(g => [g[0], g[1], g[2], g[0]]), x0 + W + 34, 20).replace(/font-size="12"/g, 'font-size="16"');
      s += text(x0, base, "Hxgf", { size, w: 400, fill: INK, ff });
      s += text(x0 - 16, 540, "Anatomy of type", { size: 20, w: 700, fill: INK }) + text(x0 - 16, 566, "The five lines every letter sits on.", { size: 15, fill: MUTE });
      return svg(800, 600, s, "The anatomy of type: five guide lines drawn through the letters H, x, g and f");
    },
    layout() {
      const X = 60, Y = 60, W = 680, H = 400, m = 40, g = 16, cols = 12, cw = (W - m * 2 - g * (cols - 1)) / cols;
      const colX = i => X + m + i * (cw + g), span = n => n * cw + (n - 1) * g;
      let s = rect(X, Y, W, H, { r: 14, fill: PAPER, stroke: LINE });
      for (let i = 0; i < cols; i++) s += rect(colX(i), Y, cw, H, { fill: "rgba(229,72,77,.08)" });
      s += rect(colX(0), Y + 36, span(12), 30, { r: 6, fill: "#2b2f36" }) + rect(colX(0), Y + 96, span(7), 270, { r: 10, fill: "#c9d6ea" }) +
        path(`M${colX(0)} ${Y + 366} l120 -110 l80 70 l90 -90 l${span(7) - 290} 130 Z`, { fill: "#9fb5d8" }) +
        rect(colX(7), Y + 96, span(5) * .9, 26, { r: 5, fill: "#2b2f36" }) + rect(colX(7), Y + 132, span(5) * .65, 26, { r: 5, fill: "#2b2f36" }) + lines(colX(7), Y + 186, span(5), 7, { gap: 16, h: 6 }) +
        rect(colX(7), Y + 318, 130, 40, { r: 20, fill: BLUE });
      s += dim(X, Y + H + 30, X + m, Y + H + 30, "Margin", { stroke: RED }) + dim(colX(2) - g, Y + H + 30, colX(2), Y + H + 30, "Gutter", { stroke: RED }) + text(X + W, Y + H + 35, "12-column grid", { size: 15, w: 700, fill: INK, anchor: "end" });
      return svg(800, 600, s, "A page layout on a 12-column grid with margins and gutters marked");
    },
    hierarchy() {
      let s = `<defs><radialGradient id="afc${++uid}"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".5"/><stop offset=".55" stop-color="#ffb23c" stop-opacity=".2"/><stop offset="1" stop-color="#ffd23c" stop-opacity="0"/></radialGradient></defs>`;
      const heat = `url(#afc${uid})`;
      s += rect(170, 50, 460, 500, { r: 16, fill: PAPER, stroke: LINE }) + rect(210, 100, 320, 52, { r: 8, fill: "#2b2f36" }) + rect(210, 180, 380, 180, { r: 12, fill: "#c9d6ea" }) +
        rect(210, 388, 260, 18, { r: 5, fill: "#5b616b" }) + lines(210, 420, 360, 3, { gap: 16, h: 6 }) + rect(210, 480, 160, 42, { r: 21, fill: BLUE });
      s += circle(360, 126, 110, { fill: heat }) + circle(400, 270, 100, { fill: heat, op: .8 }) + circle(290, 500, 66, { fill: heat, op: .75 });
      s += badge(580, 126, "1", { r: 16, size: 15 }) + badge(612, 196, "2", { r: 16, size: 15 }) + badge(500, 398, "3", { r: 16, size: 15 }) + badge(400, 500, "4", { r: 16, size: 15 });
      return svg(800, 600, s, "A poster with numbered reading order and a heatmap of where people look");
    },
    logos() {
      let s = "";
      for (let i = 0; i <= 16; i++) { s += line(80 + i * 40, 60, 80 + i * 40, 540, { stroke: "#eceef1" }) + line(80, 60 + i * 30, 720, 60 + i * 30, { stroke: "#eceef1" }); }
      const cx = 400, cy = 270, r = 150;
      s += novaMark(cx, cy, r, BLUE);
      s += circle(cx, cy, r, { stroke: INK, sw: 1.4, dash: "6 5" }) + circle(cx + r * .42, cy - r * .3, r * .62, { stroke: RED, sw: 1.4, dash: "6 5" }) + circle(cx + r * .42, cy - r * .3, r * .2, { stroke: INK, sw: 1.2, dash: "4 4" });
      s += line(cx, cy, cx - r, cy, { stroke: INK, sw: 1.2 }) + circle(cx, cy, 4, { fill: INK }) + text(cx - r / 2, cy - 8, "r", { size: 16, w: 700, fill: INK, anchor: "middle" });
      s += text(400, 500, "nova", { size: 44, w: 800, fill: INK, anchor: "middle", ls: -2 });
      return svg(800, 600, s, "A logo mark constructed from circles on a grid");
    },
    mockups() {
      const g = grad(["#eef1f5", "#d9dfe7"], { x2: 0, y2: 1 });
      let s = `<defs>${g.def}</defs>` + rect(0, 0, 800, 600, { fill: `url(#${g.id})` });
      s += `<ellipse cx="400" cy="520" rx="170" ry="16" fill="rgba(0,0,0,.12)"/>` + shirt(400, 330, 2.1, "#1d2430");
      s += rect(330, 210, 140, 100, { stroke: BLUE, sw: 2, dash: "7 5" }) + rect(322, 202, 16, 16, { fill: PAPER, stroke: BLUE, sw: 2 }) + rect(462, 302, 16, 16, { fill: PAPER, stroke: BLUE, sw: 2 });
      s += novaMark(370, 260, 22, PAPER, "#1d2430") + text(400, 270, "nova", { size: 30, w: 800, fill: PAPER, ls: -1 });
      s += rect(480, 150, 150, 32, { r: 16, fill: BLUE }) + text(555, 171, "Smart Object", { size: 14, w: 700, fill: PAPER, anchor: "middle" }) + line(480, 166, 470, 210, { stroke: BLUE, sw: 1.5 });
      return svg(800, 600, s, "A T-shirt mockup with the smart object area outlined");
    }
  };

  window.DSFigures = {
    cover,
    fig: {
      colourWheel, colourHsl, colourHarmony, colour603010, colourContrast,
      typeAnatomy, typeFamilies, typeScale, typeWeights, typeLeading, typeTracking, typePairing,
      layoutGrid, layoutSpacing, layoutAlign, layoutProximity, layoutWhitespace,
      hierOrder, hierSize, hierColour, hierPatterns, hierSquint,
      logoTypes, logoGrid, logoColour, logoSize,
      mockFlat, mockSmart, mockScenes, mockBoard
    }
  };
})();
