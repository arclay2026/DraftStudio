/* =====================================================================
   DRAFT STUDIO — BARCODE STUDIO
   A barcode designer: EAN-13, UPC-A, EAN-8, Code 128, Code 39, ITF-14.
   The encoders are written from the GS1 / ISO specs and tested against
   ZXing. Every design is drawn as SVG, then read back from its pixels
   (slightly blurred, like a scanner sees it) before we call it scannable.
   site.js calls window.BarcodeStudio(kit) with its shared helpers.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Symbol tables ---------- */
  // Code 128: bar/space widths of each of the 107 symbols (103-105 are the starts, 106 the stop)
  const C128 = ("212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 " +
    "123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 " +
    "131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 " +
    "213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 " +
    "112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 " +
    "421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112").split(" ");
  // EAN / UPC digit patterns: L (odd parity), R (its inverse), G (R reversed); and the first digit of an EAN-13 picks the L/G mix
  const L = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
  const R = L.map(p => p.replace(/./g, c => (c === "0" ? "1" : "0")));
  const G = R.map(p => p.split("").reverse().join(""));
  const PARITY = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
  // Code 39: nine elements per character (bar, space, bar…), 1 = wide
  const C39 = {
    0: "000110100", 1: "100100001", 2: "001100001", 3: "101100000", 4: "000110001", 5: "100110000", 6: "001110000", 7: "000100101", 8: "100100100", 9: "001100100",
    A: "100001001", B: "001001001", C: "101001000", D: "000011001", E: "100011000", F: "001011000", G: "000001101", H: "100001100", I: "001001100", J: "000011100",
    K: "100000011", L: "001000011", M: "101000010", N: "000010011", O: "100010010", P: "001010010", Q: "000000111", R: "100000110", S: "001000110", T: "000010110",
    U: "110000001", V: "011000001", W: "111000000", X: "010010001", Y: "110010000", Z: "011010000", "-": "010000101", ".": "110000100", " ": "011000100",
    "$": "010101000", "/": "010100010", "+": "010001010", "%": "000101010", "*": "010010100"
  };
  // Interleaved 2 of 5: five elements per digit, 1 = wide
  const ITF = ["00110", "10001", "01001", "11000", "00101", "10100", "01100", "00011", "10010", "01010"];

  // GS1 check digit: weights 3, 1, 3… counted from the right
  const gtinCheck = ds => { let s = 0; for (let i = ds.length - 1, w = 3; i >= 0; i--, w = 4 - w) s += +ds[i] * w; return (10 - (s % 10)) % 10; };

  /* ---------- Formats ---------- */
  // Each turns the typed text into { value } (with its check digit) or { error }, and encodes a value into
  // bars ({x, w, g}: position and width in modules, g = a guard bar that runs down between the digits),
  // the human-readable text, and the quiet zone it needs either side.
  const digitsOnly = s => s.replace(/[\s-]/g, "");
  const gtin = (n, name) => raw => {
    const d = digitsOnly(raw);
    if (!d) return { error: `Type the ${n - 1} digits of your ${name} number.` };
    if (!/^\d+$/.test(d)) return { error: `${name} uses digits only.` };
    if (d.length === n - 1) return { value: d + gtinCheck(d), note: `Check digit ${gtinCheck(d)} added` };
    if (d.length === n) return gtinCheck(d.slice(0, -1)) === +d.slice(-1) ? { value: d, note: "Check digit verified" }
      : { error: `The last digit should be ${gtinCheck(d.slice(0, -1))}. Leave it off and we'll add the right one.` };
    return { error: `${name} needs ${n - 1} digits (we add the ${n === 13 ? "13th" : n === 12 ? "12th" : n === 8 ? "8th" : "14th"}). You have ${d.length}.` };
  };
  const bitsToBars = (bits, guardAt) => {
    const bars = [];
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== "1") continue;
      const last = bars[bars.length - 1], g = guardAt(i);
      if (last && last.x + last.w === i && last.g === g) last.w++;
      else bars.push({ x: i, w: 1, g });
    }
    return bars;
  };
  const inRanges = rs => i => rs.some(([a, b]) => i >= a && i < b);
  const widthsToBars = widths => {
    const bars = []; let x = 0;
    widths.forEach((w, k) => { if (k % 2 === 0) bars.push({ x, w, g: false }); x += w; });
    return { bars, W: x };
  };

  const FORMATS = {
    ean13: { name: "EAN-13", hint: "Product barcode used worldwide. 12 digits; we add the 13th.", ph: "590123412345", sample: "590123412345", retail: true,
      prep: gtin(13, "EAN-13"),
      encode(v) {
        const p = PARITY[+v[0]];
        let bits = "101";
        for (let k = 1; k <= 6; k++) bits += (p[k - 1] === "L" ? L : G)[+v[k]];
        bits += "01010";
        for (let k = 7; k <= 12; k++) bits += R[+v[k]];
        bits += "101";
        return { bars: bitsToBars(bits, inRanges([[0, 3], [45, 50], [92, 95]])), W: 95, quiet: [11, 7],
          text: [{ t: v[0], x: -3, a: "end" }, { t: v.slice(1, 7), x: 24 }, { t: v.slice(7), x: 71 }] };
      } },
    upca: { name: "UPC-A", hint: "Product barcode for the USA and Canada. 11 digits; we add the 12th.", ph: "03600029145", sample: "03600029145", retail: true,
      prep: gtin(12, "UPC-A"),
      encode(v) {
        let bits = "101";
        for (let k = 0; k < 6; k++) bits += L[+v[k]];
        bits += "01010";
        for (let k = 6; k < 12; k++) bits += R[+v[k]];
        bits += "101";
        return { bars: bitsToBars(bits, inRanges([[0, 10], [45, 50], [85, 95]])), W: 95, quiet: [9, 9],
          text: [{ t: v[0], x: -3, a: "end", small: true }, { t: v.slice(1, 6), x: 27.5 }, { t: v.slice(6, 11), x: 67.5 }, { t: v[11], x: 98, a: "start", small: true }] };
      } },
    ean8: { name: "EAN-8", hint: "Short product barcode for small packs. 7 digits; we add the 8th.", ph: "9638507", sample: "9638507", retail: true,
      prep: gtin(8, "EAN-8"),
      encode(v) {
        let bits = "101";
        for (let k = 0; k < 4; k++) bits += L[+v[k]];
        bits += "01010";
        for (let k = 4; k < 8; k++) bits += R[+v[k]];
        bits += "101";
        return { bars: bitsToBars(bits, inRanges([[0, 3], [31, 36], [64, 67]])), W: 67, quiet: [7, 7],
          text: [{ t: v.slice(0, 4), x: 17 }, { t: v.slice(4), x: 50 }] };
      } },
    code128: { name: "Code 128", hint: "Letters, numbers and symbols. Shipping labels, stock and tickets.", ph: "DS-2026-0001", sample: "DS-2026-0001",
      prep(raw) {
        if (!raw) return { error: "Type the text for your barcode." };
        if (/[^\x20-\x7e]/.test(raw)) return { error: "Code 128 takes plain letters, numbers and keyboard symbols (no accents or emoji)." };
        if (raw.length > 60) return { error: "Keep it under 60 characters so it stays scannable." };
        return { value: raw };
      },
      encode(v) {
        // Code set B for text, switching to C (two digits per symbol) for runs of four or more digits
        const run = i => { let n = 0; while (i + n < v.length && v[i + n] >= "0" && v[i + n] <= "9") n++; return n; };
        const codes = [];
        let set = run(0) >= 4 && run(0) % 2 === 0 ? "C" : "B", i = 0;
        codes.push(set === "C" ? 105 : 104);
        while (i < v.length) {
          if (set === "C") {
            if (run(i) >= 2) { codes.push(+v.substr(i, 2)); i += 2; continue; }
            codes.push(100); set = "B";
          } else if (run(i) >= 4) {
            if (run(i) % 2) { codes.push(v.charCodeAt(i) - 32); i++; }
            codes.push(99); set = "C";
          } else { codes.push(v.charCodeAt(i) - 32); i++; }
        }
        codes.push(codes.reduce((s, c, k) => s + c * (k || 1), 0) % 103, 106);
        const { bars, W } = widthsToBars(codes.flatMap(c => C128[c].split("").map(Number)));
        return { bars, W, quiet: [10, 10], text: [{ t: v, x: W / 2 }] };
      } },
    code39: { name: "Code 39", hint: "Capital letters, numbers and - . $ / + %. ID cards and asset tags.", ph: "DS-2026", sample: "DS-2026",
      prep(raw) {
        const v = raw.toUpperCase();
        if (!v) return { error: "Type the text for your barcode." };
        const bad = [...new Set(v.replace(/[0-9A-Z\-. $/+%]/g, ""))];
        if (bad.length) return { error: `Code 39 can't hold ${bad.map(c => `“${c}”`).join(" ")}. Try Code 128 instead.` };
        if (v.length > 40) return { error: "Keep it under 40 characters so it stays scannable." };
        return { value: v, note: raw !== v ? "Shown in capitals, as Code 39 needs" : "" };
      },
      encode(v) {
        const widths = [];
        [..."*" + v + "*"].forEach((ch, k, a) => { C39[ch].split("").forEach(b => widths.push(b === "1" ? 3 : 1)); if (k < a.length - 1) widths.push(1); });
        const { bars, W } = widthsToBars(widths);
        return { bars, W, quiet: [10, 10], text: [{ t: `*${v}*`, x: W / 2 }] };
      } },
    itf14: { name: "ITF-14", hint: "Outer cartons and shipping boxes. 13 digits; we add the 14th.", ph: "1540014128876", sample: "1540014128876", itf: true,
      prep: gtin(14, "ITF-14"),
      encode(v) {
        const N = 1, Wd = 2.5, widths = [N, N, N, N];
        for (let k = 0; k < v.length; k += 2) {
          const a = ITF[+v[k]], b = ITF[+v[k + 1]];
          for (let e = 0; e < 5; e++) widths.push(a[e] === "1" ? Wd : N, b[e] === "1" ? Wd : N);
        }
        widths.push(Wd, N, N);
        const { bars, W } = widthsToBars(widths);
        return { bars, W, quiet: [10, 10], text: [{ t: `${v[0]} ${v.slice(1, 3)} ${v.slice(3, 8)} ${v.slice(8, 13)} ${v[13]}`, x: W / 2 }] };
      } }
  };
  const ORDER = ["ean13", "upca", "ean8", "code128", "code39", "itf14"];

  /* ---------- Drawing ---------- */
  const f = v => +(+v).toFixed(3);
  const escXml = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const FONTS = {
    sans: `font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="500"`,
    mono: `font-family="'OCR B', 'OCR-B', 'SF Mono', Menlo, Consolas, 'Courier New', monospace" font-weight="500"`
  };
  // The barcode as SVG, in module units. Returns the SVG, its height/width ratio, and where the bars sit (for the scan check).
  function buildSVG(st, fmt, enc, opts = {}) {
    const F = FORMATS[fmt], retail = !!F.retail, showText = st.text !== "none";
    const W = enc.W, H = f(W * st.height / 100), q = st.margin;
    const fs = f((retail ? 10 : Math.min(9, W / Math.max(6, enc.text[0].t.length) * 1.5)) * st.textSize);
    const guardDrop = retail && showText && st.guards ? fs * .55 : 0;
    const bearer = F.itf && st.bearer ? 4 : 0;
    // retail digits sit in the quiet zone: leave room for them even when the margin is small
    const padL = Math.max(q, retail && showText && enc.text[0].a === "end" ? fs * .8 + 3 : 0) + bearer;
    const padR = Math.max(q, retail && showText && enc.text[enc.text.length - 1].a === "start" ? fs * .8 + 3 : 0) + bearer;
    const pv = Math.max(4, q * .55);
    // the bars, or the bearer frame around them when there is one; text and caption sit outside it
    const top = bearer ? -(pv * .5 + bearer) : 0, base = bearer ? H + pv * .5 + bearer : H;
    const textTop = retail && st.guards ? H + fs * .2 : base + 2.5;
    const cap = (st.caption || "").trim();
    const capFs = f(Math.min(fs * 1.15, (W + padL + padR - 6) / Math.max(1, cap.length * .6)));   // shrinks to fit the width
    const capH = cap ? capFs * 1.25 : 0;
    const bottom = showText ? textTop + fs * 1.05 : base;
    const x0 = -padL, y0 = top - pv - capH, w = W + padL + padR, h = bottom + pv - y0;
    const rad = f(Math.min(w, h) * st.radius / 100 * .25);
    const ink = st.c1, round = st.bars === "rounded";
    const barPath = enc.bars.map(b => {
      const bh = b.g ? H + guardDrop : H, r = round ? Math.min(b.w / 2, .5) : 0;
      return r ? `M${f(b.x + r)} 0H${f(b.x + b.w - r)}A${r} ${r} 0 0 1 ${f(b.x + b.w)} ${r}V${f(bh - r)}A${r} ${r} 0 0 1 ${f(b.x + b.w - r)} ${f(bh)}H${f(b.x + r)}A${r} ${r} 0 0 1 ${f(b.x)} ${f(bh - r)}V${r}A${r} ${r} 0 0 1 ${f(b.x + r)} 0Z`
        : `M${f(b.x)} 0h${f(b.w)}v${f(bh)}h${f(-b.w)}Z`;
    }).join("");
    const font = FONTS[st.font] || FONTS.sans;
    const texts = showText ? enc.text.map(t => `<text x="${f(t.x)}" y="${f(textTop + fs * .82)}" font-size="${f(t.small ? fs * .72 : fs)}" text-anchor="${t.a || "middle"}"${!retail ? ` textLength="${f(Math.min(W, t.t.length * fs * .62))}" lengthAdjust="spacingAndGlyphs"` : ""}>${escXml(t.t)}</text>`).join("") : "";
    const capText = cap ? `<text x="${f(W / 2)}" y="${f(top - pv * .45 - capFs * .25)}" font-size="${capFs}" text-anchor="middle" font-weight="600">${escXml(cap)}</text>` : "";
    const frame = bearer ? `<path fill-rule="evenodd" d="M${f(-padL)} ${f(-bearer - pv * .5)}h${f(W + padL + padR)}v${f(H + bearer * 2 + pv)}h${f(-(W + padL + padR))}Z M${f(-padL + bearer)} ${f(-pv * .5)}h${f(W + padL + padR - bearer * 2)}v${f(H + pv)}h${f(-(W + padL + padR - bearer * 2))}Z"/>` : "";
    const bg = st.transparent ? "" : `<rect x="${f(x0)}" y="${f(y0)}" width="${f(w)}" height="${f(h)}" rx="${rad}" fill="${st.bg}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}"${opts.id ? ` id="${opts.id}"` : ""}>` +
      `${bg}<g fill="${ink}"${round ? "" : ' shape-rendering="crispEdges"'}><path d="${barPath}"/>${frame}</g>` +
      `<g fill="${ink}" ${font}>${texts}${capText}</g></svg>`;
    return { svg, ratio: h / w, box: { x0, y0, w, h, H, W } };
  }

  /* ---------- Looks ---------- */
  const LOOKS = [
    { name: "Classic", c1: "#0f0f0f", bg: "#ffffff", bars: "square", font: "sans", radius: 0 },
    { name: "Studio", c1: "#111111", bg: "#f4f3ef", bars: "rounded", font: "sans", radius: 40 },
    { name: "Ink", c1: "#0b2a6f", bg: "#eef4ff", bars: "square", font: "mono", radius: 30 },
    { name: "Forest", c1: "#173f2f", bg: "#e9f3ec", bars: "rounded", font: "sans", radius: 40 },
    { name: "Cocoa", c1: "#3b2416", bg: "#f6ead9", bars: "square", font: "mono", radius: 20 },
    { name: "Receipt", c1: "#1a1a1a", bg: "#fbfaf5", bars: "square", font: "mono", radius: 6 }
  ];

  const DEFAULT = {
    fmt: "ean13", data: {}, height: 45, margin: 11, bars: "square", guards: true, bearer: true,
    c1: "#0f0f0f", bg: "#ffffff", transparent: false, radius: 0,
    text: "below", font: "sans", textSize: 1, caption: "",
    exp: { fmt: "png", px: 1200 }
  };

  window.DSBarcode = { FORMATS, buildSVG };   // for testing the encoders outside the page

  window.BarcodeStudio = function (kit) {
    const { $, $$, esc, icon, copy, toast, lum } = kit;
    const root = $("[data-bs]");
    if (!root) return;
    let dragging = null, frame = 0;
    const KEY = "ds-barcode";
    const clone = o => JSON.parse(JSON.stringify(o));
    const load = () => {
      try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && FORMATS[s.fmt]) return Object.assign(clone(DEFAULT), s, { exp: Object.assign(clone(DEFAULT.exp), s.exp) }); } catch (e) {}
      return clone(DEFAULT);
    };
    let st = load();
    const fmtPref = kit.pref ? kit.pref("format") : "auto";
    if (fmtPref !== "auto") st.exp.fmt = fmtPref;
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
    const get = path => path.split(".").reduce((o, k) => o && o[k], st);
    const set = (path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((o, k) => o[k], st)[last] = v; };
    const raw = () => (st.data[st.fmt] != null ? st.data[st.fmt] : FORMATS[st.fmt].sample);

    /* ----- Build the panel ----- */
    const mini = k => { const F = FORMATS[k], e = F.encode(F.prep(F.sample).value);
      return `<svg viewBox="-2 -2 ${e.W + 4} ${e.W * .42 + 4}" preserveAspectRatio="none"><path fill="currentColor" d="${e.bars.map(b => `M${b.x} 0h${b.w}v${b.g ? e.W * .42 : e.W * .34}h${-b.w}Z`).join("")}"/></svg>`; };
    $("[data-bs-types]", root).innerHTML = ORDER.map(k => `<button type="button" class="qs-type bs-type" data-fmt="${k}" aria-pressed="false"><span class="bs-mini">${mini(k)}</span><span>${FORMATS[k].name}</span></button>`).join("");
    const field = $("[data-bs-field]", root), hint = $("[data-bs-hint]", root);
    const drawField = () => {
      const F = FORMATS[st.fmt];
      field.placeholder = F.ph; field.value = raw();
      field.inputMode = F.retail || F.itf ? "numeric" : "text";
      $("[data-bs-label]", root).textContent = F.retail || F.itf ? `${F.name} number` : "Text";
      hint.textContent = F.hint;
      $$(".bs-type", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.fmt === st.fmt));
    };
    const looksEl = $("[data-bs-looks]", root);
    const lookSample = FORMATS.ean13.encode("5901234123457");
    looksEl.innerHTML = LOOKS.map((l, i) => `<button type="button" class="qs-look bs-look" data-look="${i}" data-tip="${l.name}"><span>${buildSVG(Object.assign(clone(DEFAULT), l), "ean13", lookSample).svg}</span><small>${l.name}</small></button>`).join("");

    /* ----- Sync inputs with state ----- */
    const OUT = { height: v => `${Math.round(v)}%`, margin: v => `${Math.round(v)} bars`, radius: v => `${Math.round(v)}%`, textSize: v => `${Math.round(v * 100)}%` };
    const sync = () => {
      $$("[data-set]", root).forEach(b => b.setAttribute("aria-pressed", String(get(b.dataset.set)) === b.dataset.v));
      $$("[data-k]", root).forEach(el => {
        const v = get(el.dataset.k);
        if (el.type === "checkbox") el.checked = !!v;
        else if (el.type === "color") { el.value = v; const sw = el.closest(".qs-color"); if (sw) { sw.style.setProperty("--sw", v); const t = $("span", sw); if (t) t.textContent = v.toUpperCase(); } }
        else if (el.tagName === "SELECT") { el.value = String(v); el.dispatchEvent(new Event("sync")); }
        else if (!(el.type === "range" && el === dragging) && el.value !== String(v)) el.value = v;
        const out = OUT[el.dataset.k] && $(`[data-out-for="${el.dataset.k}"]`, root);
        if (out) out.textContent = OUT[el.dataset.k](v);
      });
      const F = FORMATS[st.fmt];
      root.classList.toggle("is-retail", !!F.retail);
      root.classList.toggle("is-itf", !!F.itf);
      root.classList.toggle("has-text", st.text !== "none");
    };

    /* ----- Render + scan check ----- */
    const stage = $("[data-bs-preview]", root), meter = $("[data-bs-meter]", root), info = $("[data-bs-info]", root);
    let last = null, checkT = 0, checkId = 0;
    const setMeter = (state, title, sub) => { meter.dataset.state = state; $("b", meter).textContent = title; $("small", meter).textContent = sub; };
    const render = () => {
      const F = FORMATS[st.fmt], p = F.prep(raw());
      save();
      if (p.error) {
        last = null;
        stage.innerHTML = `<div class="qs-err">${icon("close")}<b>Not quite yet</b><span>${esc(p.error)}</span></div>`;
        info.textContent = F.name;
        setMeter("bad", "Check the content", p.error);
        return;
      }
      const enc = F.encode(p.value), r = buildSVG(st, st.fmt, enc);
      last = { svg: r.svg, ratio: r.ratio, box: r.box, enc, value: p.value };
      stage.innerHTML = r.svg;
      info.textContent = [F.name, `${p.value.length} characters`, p.note].filter(Boolean).join(" · ");
      clearTimeout(checkT);
      setMeter("wait", "Checking…", "Reading your barcode the way a scanner would.");
      checkT = setTimeout(scanCheck, 260);
    };
    const svgImage = (svg, px, ratio) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = rej;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", `<svg width="${px}" height="${Math.round(px * ratio)}" `));
    });
    // Read one line across the bars, as a scanner does, and compare the bar and gap widths with what they should be
    const reads = async (L, mpx, blur) => {
      const px = Math.round(L.box.w * mpx), img = await svgImage(L.svg, px, L.ratio);
      const cv = document.createElement("canvas"); cv.width = px; cv.height = Math.round(px * L.ratio);
      const x = cv.getContext("2d", { willReadFrequently: true });
      x.fillStyle = st.transparent ? (lum(st.c1) > .5 ? "#0f0f0f" : "#ffffff") : st.bg; x.fillRect(0, 0, cv.width, cv.height);
      x.filter = blur ? `blur(${blur}px)` : "none";
      x.drawImage(img, 0, 0, cv.width, cv.height);
      const y = Math.round((L.box.H * .45 - L.box.y0) / L.box.h * cv.height);
      const row = x.getImageData(0, y, cv.width, 1).data, g = [];
      for (let i = 0; i < row.length; i += 4) g.push(.2126 * row[i] + .7152 * row[i + 1] + .0722 * row[i + 2]);
      const lo = Math.min(...g), hi = Math.max(...g);
      if (hi - lo < 40) return false;
      const dark = lum(st.c1) < lum(st.transparent ? "#ffffff" : st.bg), mid = (lo + hi) / 2;
      const runs = []; let cur = null, n = 0;
      g.forEach(v => { const b = dark ? v < mid : v > mid; if (b === cur) n++; else { if (cur !== null) runs.push([cur, n]); cur = b; n = 1; } });
      runs.push([cur, n]);
      // expected: the bar and gap widths in modules (the frame of an ITF-14 shows up as two extra bars)
      const want = []; let pos = 0;
      L.enc.bars.forEach(b => { if (b.x > pos) want.push(b.x - pos, b.w); else if (want.length) want[want.length - 1] += b.w; else want.push(b.w); pos = b.x + b.w; });
      const got = runs.filter(([b]) => b !== null).map(([, n]) => n / mpx);
      const body = got.slice(got.findIndex((_, i) => runs[i][0]), got.length - (runs[runs.length - 1][0] ? 0 : 1));
      const inner = FORMATS[st.fmt].itf && st.bearer ? body.slice(2, -2) : body;
      if (inner.length !== want.length) return false;
      return inner.every((w, i) => Math.abs(w - want[i]) <= Math.max(.5, want[i] * .25));
    };
    const scanCheck = async () => {
      const id = ++checkId, L = last;
      if (!L) return;
      try {
        let ok = false;
        for (const [mpx, blur] of [[3, .6], [2, .8], [4, 1.4]]) { if (await reads(L, mpx, blur)) { ok = true; break; } if (id !== checkId) return; }
        if (id !== checkId) return;
        const bgC = st.transparent ? "#ffffff" : st.bg, contrast = (Math.max(lum(st.c1), lum(bgC)) + .05) / (Math.min(lum(st.c1), lum(bgC)) + .05);
        const need = Math.max(...L.enc.quiet);
        if (!ok) setMeter("bad", "Won't scan", contrast < 3 ? "The bars and background are too close in colour. Make the bars much darker." : "The bars blur together. Try a taller barcode or square bars.");
        else if (lum(st.c1) > lum(bgC)) setMeter("warn", "Light bars on dark", "Phone apps read it, but most shop scanners need dark bars on a light background.");
        else if (st.margin < need) setMeter("warn", "Needs more space", `Scanners need a clear margin either side: at least ${need} bar widths. Raise the quiet zone.`);
        else if (contrast < 4.5) setMeter("warn", "Scans, low contrast", "It reads, but darker bars are safer once it's printed.");
        else setMeter("ok", "Scans perfectly", FORMATS[st.fmt].retail ? "Read back from the pixels. For shops, the number must be registered with GS1." : "We read it back from the pixels the way a scanner would.");
      } catch (e) { if (id === checkId) setMeter("ok", "Ready", "Test it with a scanner app before printing."); }
    };

    /* ----- Events ----- */
    const changed = () => { sync(); render(); };
    const changedSoon = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; changed(); }); };
    root.addEventListener("pointerdown", e => { if (e.target.matches('input[type="range"]')) dragging = e.target; });
    addEventListener("pointerup", () => { if (dragging) { dragging = null; sync(); } });
    root.addEventListener("click", e => {
      const t = e.target.closest("[data-fmt]");
      if (t) { st.fmt = t.dataset.fmt; drawField(); changed(); return; }
      const s = e.target.closest("[data-set]");
      if (s) { const cur = get(s.dataset.set), v = s.dataset.v; set(s.dataset.set, typeof cur === "number" ? +v : v); changed(); return; }
      const lk = e.target.closest("[data-look]");
      if (lk) { const l = LOOKS[+lk.dataset.look]; Object.assign(st, clone(l), { transparent: false }); delete st.name; changed(); toast(`${l.name} look applied`); return; }
      if (e.target.closest("[data-bs-dl]")) { download(); return; }
      if (e.target.closest("[data-bs-copy]")) { copyImage(); return; }
      if (e.target.closest("[data-bs-svgcode]")) { if (last) copy(last.svg, "SVG code copied"); return; }
      if (e.target.closest("[data-bs-sample]")) { st.data[st.fmt] = FORMATS[st.fmt].sample; drawField(); changed(); return; }
      if (e.target.closest("[data-bs-reset]")) { const keep = { fmt: st.fmt, data: st.data }; st = Object.assign(clone(DEFAULT), keep); changed(); toast("Design reset"); }
    });
    root.addEventListener("input", e => {
      if (e.target === field) { st.data[st.fmt] = field.value; render(); return; }
      const k = e.target.closest("[data-k]");
      if (!k) return;
      const cur = get(k.dataset.k);
      const num = k.dataset.k === "margin" ? Math.round(+k.value) : +k.value;
      set(k.dataset.k, k.type === "checkbox" ? k.checked : typeof cur === "number" ? num : k.value);
      if (k.type === "range") { dragging = dragging || k; changedSoon(); } else if (k.type === "text") render(); else changed();
    });
    root.addEventListener("change", e => {
      const k = e.target.closest("select[data-k]");
      if (k) { const cur = get(k.dataset.k); set(k.dataset.k, typeof cur === "number" ? +k.value : k.value); changed(); }
    });

    /* ----- Export ----- */
    const fileBase = () => "draftstudio-" + st.fmt + "-" + (last ? last.value.replace(/[^a-z0-9]+/gi, "-").slice(0, 32).replace(/^-+|-+$/g, "") : "barcode");
    const toBlob = async (fmt, px) => {
      const img = await svgImage(last.svg, px, last.ratio);
      const cv = document.createElement("canvas"); cv.width = px; cv.height = Math.round(px * last.ratio);
      const x = cv.getContext("2d");
      if (fmt === "jpg") { x.fillStyle = st.transparent ? "#ffffff" : st.bg; x.fillRect(0, 0, cv.width, cv.height); }
      x.drawImage(img, 0, 0, cv.width, cv.height);
      return new Promise(r => cv.toBlob(r, fmt === "jpg" ? "image/jpeg" : "image/png", .95));
    };
    const save_ = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
    async function download() {
      if (!last) { toast("Fix the content first"); return; }
      const { fmt, px } = st.exp;
      if (fmt === "svg") { save_(new Blob([last.svg], { type: "image/svg+xml" }), fileBase() + ".svg"); toast("SVG downloaded"); return; }
      save_(await toBlob(fmt, +px), `${fileBase()}-${px}.${fmt}`);
      toast(`${fmt.toUpperCase()} downloaded · ${px}px wide`);
    }
    async function copyImage() {
      if (!last) return;
      try {
        const blob = await toBlob("png", 1200);
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast("Image copied, paste it anywhere");
      } catch (e) { copy(last.svg, "Copied as SVG code"); }
    }

    drawField();
    sync();
    render();
  };
})();
