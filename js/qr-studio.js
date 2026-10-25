/* =====================================================================
   DRAFT STUDIO — QR STUDIO
   A QR code designer. Encoding: js/vendor/qrcode.min.js (qrcode-generator).
   Scan check: js/vendor/jsqr.min.js (jsQR) decodes every design live.
   Everything is drawn as SVG, so exports are sharp at any size.
   site.js calls window.QRStudio(kit) with its shared helpers.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Content types ---------- */
  const enc = s => encodeURIComponent(s || "");
  const wifiEsc = s => String(s || "").replace(/([\\;,:"])/g, "\\$1");
  const TYPES = {
    url: { label: "Link", icon: "link", fields: [{ k: "url", label: "Website address", ph: "https://yourbrand.com" }],
      make: d => d.url || "" },
    text: { label: "Text", icon: "type", fields: [{ k: "text", label: "Your text", ph: "Anything you like…", area: true }],
      make: d => d.text || "" },
    wifi: { label: "Wi-Fi", icon: "globe", fields: [
        { k: "ssid", label: "Network name", ph: "Studio Wi-Fi" },
        { k: "pass", label: "Password", ph: "••••••••" },
        { k: "auth", label: "Security", options: [["WPA", "WPA / WPA2"], ["WEP", "WEP"], ["nopass", "No password"]] }],
      make: d => `WIFI:T:${d.auth || "WPA"};S:${wifiEsc(d.ssid)};${d.auth === "nopass" ? "" : `P:${wifiEsc(d.pass)};`};` },
    whatsapp: { label: "WhatsApp", icon: "chat", fields: [
        { k: "num", label: "Phone number (with country code)", ph: "27 73 668 4875" },
        { k: "msg", label: "Message", ph: "Hi! I saw your QR code…", area: true }],
      make: d => `https://wa.me/${(d.num || "").replace(/\D/g, "")}${d.msg ? "?text=" + enc(d.msg) : ""}` },
    email: { label: "Email", icon: "mail", fields: [
        { k: "to", label: "Email address", ph: "hello@yourbrand.com" },
        { k: "subject", label: "Subject", ph: "Hello" },
        { k: "body", label: "Message", ph: "Write your message…", area: true }],
      make: d => `mailto:${d.to || ""}${d.subject || d.body ? "?" + [d.subject && "subject=" + enc(d.subject), d.body && "body=" + enc(d.body)].filter(Boolean).join("&") : ""}` },
    phone: { label: "Call", icon: "phone", fields: [{ k: "tel", label: "Phone number", ph: "+27 73 668 4875" }],
      make: d => `tel:${(d.tel || "").replace(/[^\d+]/g, "")}` },
    sms: { label: "SMS", icon: "smartphone", fields: [
        { k: "num", label: "Phone number", ph: "+27 73 668 4875" },
        { k: "msg", label: "Message", ph: "Your message…", area: true }],
      make: d => `SMSTO:${(d.num || "").replace(/[^\d+]/g, "")}:${d.msg || ""}` },
    vcard: { label: "Contact", icon: "user", fields: [
        { k: "first", label: "First name", ph: "Alex", half: true }, { k: "last", label: "Last name", ph: "Mokoena", half: true },
        { k: "tel", label: "Phone", ph: "+27 73 668 4875", half: true }, { k: "email", label: "Email", ph: "alex@brand.com", half: true },
        { k: "org", label: "Company", ph: "Draft Studio", half: true }, { k: "title", label: "Job title", ph: "Designer", half: true },
        { k: "web", label: "Website", ph: "https://brand.com" }],
      make: d => ["BEGIN:VCARD", "VERSION:3.0", `N:${d.last || ""};${d.first || ""}`, `FN:${[d.first, d.last].filter(Boolean).join(" ")}`,
        d.org && `ORG:${d.org}`, d.title && `TITLE:${d.title}`, d.tel && `TEL;TYPE=CELL:${d.tel}`, d.email && `EMAIL:${d.email}`,
        d.web && `URL:${d.web}`, "END:VCARD"].filter(Boolean).join("\n") }
  };

  /* ---------- Shapes ---------- */
  const DOTS = [["square", "Square"], ["rounded", "Rounded"], ["dots", "Dots"], ["fluid", "Liquid"], ["leaf", "Leaf"],
    ["diamond", "Diamond"], ["star", "Sparkle"], ["vlines", "Columns"], ["hlines", "Rows"], ["tiny", "Pixel"]];
  const FRAMES = [["square", "Square"], ["soft", "Soft"], ["rounded", "Rounded"], ["circle", "Circle"], ["leaf", "Leaf"], ["dashed", "Dotted"]];
  const BALLS = [["square", "Square"], ["rounded", "Rounded"], ["circle", "Circle"], ["diamond", "Diamond"], ["leaf", "Leaf"], ["star", "Sparkle"]];
  const LOGO_ICONS = ["link", "globe", "chat", "mail", "phone", "camera", "music", "map-pin", "cart", "heart", "star", "play", "calendar", "user", "gift", "coffee"];

  /* ---------- Geometry helpers (all in module units) ---------- */
  const f = v => +v.toFixed(3);
  // Rounded rect path with per-corner radii [tl, tr, br, bl]
  const rr = (x, y, w, h, r) => {
    const [a, b, c, d] = (Array.isArray(r) ? r : [r, r, r, r]).map(v => Math.max(0, Math.min(v, w / 2, h / 2)));
    return `M${f(x + a)} ${f(y)}H${f(x + w - b)}${b ? `A${f(b)} ${f(b)} 0 0 1 ${f(x + w)} ${f(y + b)}` : ""}V${f(y + h - c)}` +
      `${c ? `A${f(c)} ${f(c)} 0 0 1 ${f(x + w - c)} ${f(y + h)}` : ""}H${f(x + d)}${d ? `A${f(d)} ${f(d)} 0 0 1 ${f(x)} ${f(y + h - d)}` : ""}` +
      `V${f(y + a)}${a ? `A${f(a)} ${f(a)} 0 0 1 ${f(x + a)} ${f(y)}` : ""}Z`;
  };
  const circle = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  const diamond = (cx, cy, h) => `M${f(cx)} ${f(cy - h)}L${f(cx + h)} ${f(cy)}L${f(cx)} ${f(cy + h)}L${f(cx - h)} ${f(cy)}Z`;
  const sparkle = (cx, cy, R, k = .44) => {
    const r = R * k; let d = "";
    for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2, rad = i % 2 ? r : R; d += (i ? "L" : "M") + f(cx + Math.cos(a) * rad) + " " + f(cy + Math.sin(a) * rad); }
    return d + "Z";
  };

  // Path for all data modules. dark(x, y) tells whether a neighbouring module is drawn.
  function dotsPath(style, n, dark, ox, oy, scale) {
    let d = "";
    const s = scale, pad = (1 - s) / 2;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (!dark(x, y)) continue;
      const X = ox + x, Y = oy + y, cx = X + .5, cy = Y + .5;
      switch (style) {
        case "square": d += rr(X + pad - .01, Y + pad - .01, s + .02, s + .02, 0); break;
        case "tiny": d += rr(X + .12, Y + .12, .76, .76, .1); break;
        case "rounded": d += rr(X + pad, Y + pad, s, s, s * .36); break;
        case "dots": d += circle(cx, cy, s * .46); break;
        case "diamond": d += diamond(cx, cy, s * .56); break;
        case "star": d += sparkle(cx, cy, s * .72, .52); break;
        case "leaf": d += rr(X + pad, Y + pad, s, s, [s * .5, 0, s * .5, 0]); break;
        case "fluid": {
          const L = dark(x - 1, y), R = dark(x + 1, y), T = dark(x, y - 1), B = dark(x, y + 1), k = .5;
          d += rr(X - .005, Y - .005, 1.01, 1.01, [!L && !T ? k : 0, !R && !T ? k : 0, !R && !B ? k : 0, !L && !B ? k : 0]);
          break;
        }
        case "vlines": if (!dark(x, y - 1)) { let e = y; while (dark(x, e + 1)) e++; const w = .84 * s; d += rr(cx - w / 2, Y + .05, w, e - y + .9, w / 2); } break;
        case "hlines": if (!dark(x - 1, y)) { let e = x; while (dark(e + 1, y)) e++; const h = .84 * s; d += rr(X + .05, cy - h / 2, e - x + .9, h, h / 2); } break;
      }
    }
    return d;
  }

  // Finder "eyes": the 7×7 frame and the 3×3 ball. corner: 0 top-left, 1 top-right, 2 bottom-left
  function eyeFramePath(style, x, y, corner) {
    const leafO = corner === 0 ? [3.2, 0, 3.2, 0] : [0, 3.2, 0, 3.2], leafI = corner === 0 ? [2.2, 0, 2.2, 0] : [0, 2.2, 0, 2.2];
    switch (style) {
      case "soft": return rr(x, y, 7, 7, 1.2) + rr(x + 1, y + 1, 5, 5, .5);
      case "rounded": return rr(x, y, 7, 7, 2.4) + rr(x + 1, y + 1, 5, 5, 1.5);
      case "circle": return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
      case "leaf": return rr(x, y, 7, 7, leafO) + rr(x + 1, y + 1, 5, 5, leafI);
      case "dashed": {
        let d = "";
        for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if (i === 0 || j === 0 || i === 6 || j === 6) d += circle(x + i + .5, y + j + .5, .44);
        return d;
      }
      default: return rr(x, y, 7, 7, 0) + rr(x + 1, y + 1, 5, 5, 0);
    }
  }
  // Diamond centre: an octagon so the middle rows stay solid for scanners
  const diamondBall = (X, Y) => { const c = .7; return `M${f(X + c)} ${f(Y - .15)}H${f(X + 3 - c)}L${f(X + 3.15)} ${f(Y + c)}V${f(Y + 3 - c)}L${f(X + 3 - c)} ${f(Y + 3.15)}H${f(X + c)}L${f(X - .15)} ${f(Y + 3 - c)}V${f(Y + c)}Z`; };
  function eyeBallPath(style, x, y, corner) {
    const X = x + 2, Y = y + 2;
    switch (style) {
      case "rounded": return rr(X, Y, 3, 3, .9);
      case "circle": return circle(X + 1.5, Y + 1.5, 1.62);
      case "diamond": return diamondBall(X, Y);
      case "leaf": return rr(X - .08, Y - .08, 3.16, 3.16, corner === 0 ? [1.25, 0, 1.25, 0] : [0, 1.25, 0, 1.25]);
      case "star": return sparkle(X + 1.5, Y + 1.5, 1.85, .62);
      default: return rr(X, Y, 3, 3, 0);
    }
  }

  /* ---------- The renderer ---------- */
  // Returns { svg, payloadOk } for a state. Pure function of state + matrix.
  function encode(text, ec) {
    const q = window.qrcode(0, ec);
    q.addData(text || " ");
    q.make();
    return q;
  }

  function buildSVG(st, q, ICONS, opts = {}) {
    const n = q.getModuleCount(), m = st.margin, S = n + m * 2;
    const inFinder = (x, y) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
    // Logo area: a centred box of modules left empty so the logo sits on a clean plate
    const hasLogo = st.logo.kind !== "none" && (st.logo.kind === "icon" || st.logo.src);
    let lb = null;
    if (hasLogo) {
      let size = Math.round(n * st.logo.size);
      if ((n - size) % 2) size++;
      const pad = st.logo.plate === "none" ? 0 : 1;
      const box = size + pad * 2, s0 = (n - box) / 2;
      lb = { x0: s0, x1: s0 + box, size, pad };
    }
    const cleared = (x, y) => lb && x >= lb.x0 && x < lb.x1 && y >= lb.x0 && y < lb.x1;
    const dark = (x, y) => x >= 0 && y >= 0 && x < n && y < n && !inFinder(x, y) && !cleared(x, y) && q.isDark(y, x);

    const id = opts.id || "q";
    const grad = st.fill === "solid" ? "" : st.fill === "linear"
      ? (() => { const a = (st.angle - 90) * Math.PI / 180, cx = m + n / 2, cy = m + n / 2, r = n / 2;
          return `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${f(cx - Math.cos(a) * r)}" y1="${f(cy - Math.sin(a) * r)}" x2="${f(cx + Math.cos(a) * r)}" y2="${f(cy + Math.sin(a) * r)}"><stop offset="0" stop-color="${st.c1}"/><stop offset="1" stop-color="${st.c2}"/></linearGradient>`; })()
      : `<radialGradient id="${id}g" gradientUnits="userSpaceOnUse" cx="${f(m + n / 2)}" cy="${f(m + n / 2)}" r="${f(n * .72)}"><stop offset="0" stop-color="${st.c1}"/><stop offset="1" stop-color="${st.c2}"/></radialGradient>`;
    const ink = st.fill === "solid" ? st.c1 : `url(#${id}g)`;
    const frameInk = st.eyeFrameC || ink, ballInk = st.eyeBallC || ink;

    // Label frame around the code
    const L = st.label, hasLabel = L.style !== "none" && L.text.trim();
    const lh = hasLabel ? S * .2 : 0, gap = hasLabel && L.style !== "caption" ? S * .06 : 0;
    const W = S, H = S + lh + gap;
    const bgFill = st.transparent ? "none" : st.bg;
    const rad = st.radius / 100 * S * .5;
    let out = "";
    if (hasLabel && L.style === "banner") {
      out += `<rect width="${f(W)}" height="${f(H)}" rx="${f(Math.max(rad, S * .05))}" fill="${L.c}"/>`;
      const p = S * .045;
      out += `<rect x="${f(p)}" y="${f(p)}" width="${f(W - p * 2)}" height="${f(S - p * 2)}" rx="${f(Math.max(rad * .8, S * .03))}" fill="${st.transparent ? "#fff" : st.bg}"/>`;
    } else if (!st.transparent) {
      out += `<rect width="${f(W)}" height="${f(hasLabel && L.style === "caption" ? H : S)}" rx="${f(rad)}" fill="${bgFill}"/>`;
    }

    // Banner shrinks the code a little to make room for the coloured border
    const k = hasLabel && L.style === "banner" ? .91 : 1, t = (S - S * k) / 2;
    out += `<g transform="translate(${f(t)} ${f(t)}) scale(${k})">`;
    out += `<path fill="${ink}" d="${dotsPath(st.dot, n, dark, m, m, st.scale)}"/>`;
    [[0, 0, 0], [n - 7, 0, 1], [0, n - 7, 2]].forEach(([x, y, c]) => {
      out += `<path fill="${frameInk}" fill-rule="evenodd" d="${eyeFramePath(st.eyeFrame, m + x, m + y, c)}"/>`;
      out += `<path fill="${ballInk}" d="${eyeBallPath(st.eyeBall, m + x, m + y, c)}"/>`;
    });
    if (lb) {
      const x = m + lb.x0, w = lb.x1 - lb.x0, c = m + n / 2, plateC = st.logo.plateC || (st.transparent ? "#fff" : st.bg);
      if (st.logo.plate === "circle") out += `<circle cx="${f(c)}" cy="${f(c)}" r="${f(w / 2)}" fill="${plateC}"/>`;
      else if (st.logo.plate !== "none") out += `<path fill="${plateC}" d="${rr(x, x, w, w, st.logo.plate === "rounded" ? w * .26 : 0)}"/>`;
      const ls = lb.size * (st.logo.plate === "circle" ? .78 : .92), lx = c - ls / 2;
      if (st.logo.kind === "icon") {
        out += `<svg x="${f(lx)}" y="${f(lx)}" width="${f(ls)}" height="${f(ls)}" viewBox="0 0 24 24" fill="none" stroke="${st.logo.color || (st.fill === "solid" ? st.c1 : st.c2)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[st.logo.icon] || ""}</svg>`;
      } else {
        out += `<image href="${st.logo.src}" x="${f(lx)}" y="${f(lx)}" width="${f(ls)}" height="${f(ls)}" preserveAspectRatio="xMidYMid meet"/>`;
      }
    }
    out += `</g>`;

    if (hasLabel) {
      const esc = s => s.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
      const txt = esc(L.text.trim().slice(0, 28)), fs = Math.min(lh * .36, (W * .82) / Math.max(4, txt.length * .62));
      const font = `font-family="Inter, 'Helvetica Neue', Arial, sans-serif" font-weight="700" letter-spacing="${f(fs * .06)}"`;
      if (L.style === "caption") {
        out += `<text x="${f(W / 2)}" y="${f(S + lh * .42)}" text-anchor="middle" dominant-baseline="middle" font-size="${f(fs)}" ${font} fill="${L.c}">${txt}</text>`;
      } else if (L.style === "banner") {
        out += `<text x="${f(W / 2)}" y="${f(S + (lh + gap) * .44)}" text-anchor="middle" dominant-baseline="middle" font-size="${f(fs)}" ${font} fill="${L.tc}">${txt}</text>`;
      } else {
        const pw = Math.min(W * .86, txt.length * fs * .72 + fs * 2.6), ph = lh * .78, py = S + gap * .5;
        out += `<path fill="${L.c}" d="M${f(W / 2 - fs * .45)} ${f(py + .01)}L${f(W / 2)} ${f(py - fs * .42)}L${f(W / 2 + fs * .45)} ${f(py + .01)}Z"/>`;
        out += `<rect x="${f(W / 2 - pw / 2)}" y="${f(py)}" width="${f(pw)}" height="${f(ph)}" rx="${f(ph / 2)}" fill="${L.c}"/>`;
        out += `<text x="${f(W / 2)}" y="${f(py + ph / 2)}" text-anchor="middle" dominant-baseline="central" font-size="${f(fs)}" ${font} fill="${L.tc}">${txt}</text>`;
      }
    }
    const px = opts.px ? ` width="${opts.px}" height="${f(opts.px * H / W)}"` : "";
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}"${px} shape-rendering="geometricPrecision">${grad ? `<defs>${grad}</defs>` : ""}${out}</svg>`, ratio: H / W };
  }

  /* ---------- Looks (presets) ---------- */
  const LOOKS = [
    { name: "Classic", dot: "square", eyeFrame: "square", eyeBall: "square", fill: "solid", c1: "#0f0f0f", bg: "#ffffff", eyeFrameC: "", eyeBallC: "" },
    { name: "Studio", dot: "rounded", eyeFrame: "rounded", eyeBall: "rounded", fill: "solid", c1: "#0f0f0f", bg: "#ffffff", eyeFrameC: "", eyeBallC: "" },
    { name: "Liquid", dot: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: "linear", c1: "#3a0ca3", c2: "#f72585", angle: 135, bg: "#ffffff", eyeFrameC: "", eyeBallC: "" },
    { name: "Midnight", dot: "dots", eyeFrame: "circle", eyeBall: "circle", fill: "solid", c1: "#ffffff", bg: "#0f0f0f", eyeFrameC: "", eyeBallC: "#ff2d95" },
    { name: "Sunset", dot: "leaf", eyeFrame: "leaf", eyeBall: "leaf", fill: "linear", c1: "#c2410c", c2: "#7f1d1d", angle: 160, bg: "#fff7ed", eyeFrameC: "", eyeBallC: "" },
    { name: "Ocean", dot: "dots", eyeFrame: "soft", eyeBall: "rounded", fill: "radial", c1: "#0077b6", c2: "#03045e", bg: "#eaf6fb", eyeFrameC: "", eyeBallC: "" },
    { name: "Neon", dot: "fluid", eyeFrame: "rounded", eyeBall: "circle", fill: "linear", c1: "#2de2e6", c2: "#f6019d", angle: 135, bg: "#0d0221", eyeFrameC: "", eyeBallC: "" },
    { name: "Columns", dot: "vlines", eyeFrame: "rounded", eyeBall: "rounded", fill: "linear", c1: "#0f0f0f", c2: "#3a506b", angle: 90, bg: "#ffffff", eyeFrameC: "", eyeBallC: "" },
    { name: "Forest", dot: "diamond", eyeFrame: "soft", eyeBall: "diamond", fill: "solid", c1: "#283618", bg: "#fefae0", eyeFrameC: "#bc6c25", eyeBallC: "#bc6c25" },
    { name: "Pixel", dot: "tiny", eyeFrame: "soft", eyeBall: "square", fill: "solid", c1: "#141414", bg: "#f4f4f4", eyeFrameC: "", eyeBallC: "#2b5bff" }
  ];

  const DEFAULT = {
    type: "url", data: { url: "https://arclay2026.github.io/DraftStudio/", auth: "WPA" },
    dot: "rounded", scale: .9, eyeFrame: "rounded", eyeBall: "rounded",
    fill: "solid", c1: "#0f0f0f", c2: "#2b5bff", angle: 135, eyeFrameC: "", eyeBallC: "",
    bg: "#ffffff", transparent: false, radius: 8, margin: 3, ec: "M",
    logo: { kind: "none", icon: "link", src: "", size: .22, plate: "circle", plateC: "", color: "" },
    label: { style: "none", text: "SCAN ME", c: "#0f0f0f", tc: "#ffffff" },
    exp: { fmt: "png", px: 1024 }
  };

  window.QRStudio = function (kit) {
    const { $, $$, esc, icon, libIcon, copy, toast, inkOn, hexRgb, lum, ICONS, palettes } = kit;
    let dragging = null, frame = 0; // the slider being dragged, and the pending redraw
    const root = $("[data-qs]");
    if (!root || !window.qrcode) return;

    const KEY = "ds-qr";
    const clone = o => JSON.parse(JSON.stringify(o));
    const load = () => {
      try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.type) return Object.assign(clone(DEFAULT), s, { logo: Object.assign(clone(DEFAULT.logo), s.logo), label: Object.assign(clone(DEFAULT.label), s.label), exp: Object.assign(clone(DEFAULT.exp), s.exp) }); } catch (e) {}
      return clone(DEFAULT);
    };
    let st = load();
    // Settings > Default download sets the export format for each visit
    const fmtPref = kit.pref ? kit.pref("format") : "auto";
    if (fmtPref !== "auto") st.exp.fmt = fmtPref;
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { const s = clone(st); s.logo.src = ""; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e2) {} } };
    const get = path => path.split(".").reduce((o, k) => o && o[k], st);
    const set = (path, v) => { const ks = path.split("."), last = ks.pop(); ks.reduce((o, k) => o[k], st)[last] = v; };
    const payload = () => TYPES[st.type].make(st.data || {});

    /* ----- Build the panel ----- */
    const tile = (group, v, label, svg) => `<button type="button" class="qs-tile" data-set="${group}" data-v="${v}" aria-pressed="false" data-tip="${label}"><span class="qs-tile-art">${svg}</span><small>${label}</small></button>`;
    // Mini samples so each option shows what it looks like
    const SAMPLE = [[1,1,0,1,1],[1,0,1,1,0],[0,1,1,0,1],[1,1,0,1,1],[1,0,1,1,1]];
    const sampleDots = style => `<svg viewBox="-.3 -.3 5.6 5.6"><path fill="currentColor" d="${dotsPath(style, 5, (x, y) => x >= 0 && y >= 0 && x < 5 && y < 5 && SAMPLE[y][x] === 1, 0, 0, .9)}"/></svg>`;
    const sampleFrame = style => `<svg viewBox="-.5 -.5 8 8"><path fill="currentColor" fill-rule="evenodd" d="${eyeFramePath(style, 0, 0, 0)}"/><path fill="currentColor" opacity=".35" d="${eyeBallPath("square", 0, 0, 0)}"/></svg>`;
    const sampleBall = style => `<svg viewBox="-.5 -.5 8 8"><path fill="currentColor" opacity=".25" fill-rule="evenodd" d="${eyeFramePath("square", 0, 0, 0)}"/><path fill="currentColor" d="${eyeBallPath(style, 0, 0, 0)}"/></svg>`;

    $("[data-qs-types]", root).innerHTML = Object.entries(TYPES).map(([k, t]) => `<button type="button" class="qs-type" data-type="${k}" aria-pressed="false">${icon(t.icon)}<span>${t.label}</span></button>`).join("");
    $("[data-qs-dots]", root).innerHTML = DOTS.map(([v, l]) => tile("dot", v, l, sampleDots(v))).join("");
    $("[data-qs-frames]", root).innerHTML = FRAMES.map(([v, l]) => tile("eyeFrame", v, l, sampleFrame(v))).join("");
    $("[data-qs-balls]", root).innerHTML = BALLS.map(([v, l]) => tile("eyeBall", v, l, sampleBall(v))).join("");
    $("[data-qs-icons]", root).innerHTML = LOGO_ICONS.map(i => `<button type="button" class="qs-ico" data-icon="${i}" aria-label="${i.replace("-", " ")} logo" aria-pressed="false">${libIcon(i)}</button>`).join("");

    const fieldsEl = $("[data-qs-fields]", root);
    const drawFields = () => {
      const t = TYPES[st.type];
      st.data = st.data || {};
      fieldsEl.innerHTML = t.fields.map(fd => {
        const v = esc(st.data[fd.k] || "");
        const input = fd.options
          ? `<select class="select" data-field="${fd.k}" data-label="${esc(fd.label)}">${fd.options.map(([o, l]) => `<option value="${o}"${(st.data[fd.k] || fd.options[0][0]) === o ? " selected" : ""}>${l}</option>`).join("")}</select>`
          : fd.area ? `<textarea class="qs-input" rows="3" data-field="${fd.k}" placeholder="${esc(fd.ph)}">${v}</textarea>`
          : `<input class="qs-input" type="text" data-field="${fd.k}" placeholder="${esc(fd.ph)}" value="${v}" autocomplete="off" spellcheck="false">`;
        return `<label class="qs-f${fd.half ? " is-half" : ""}"><span>${esc(fd.label)}</span>${input}</label>`;
      }).join("");
      $$(".qs-type", root).forEach(b => b.setAttribute("aria-pressed", b.dataset.type === st.type));
      if (window.DSEnhanceSelects) window.DSEnhanceSelects(fieldsEl);
    };

    const looksEl = $("[data-qs-looks]", root);
    const looksQ = encode("DRAFT STUDIO", "M");
    const lookState = l => Object.assign(clone(DEFAULT), { margin: 2, radius: 14, scale: .9, c2: l.c2 || l.c1 }, l);
    looksEl.innerHTML = LOOKS.map((l, i) => `<button type="button" class="qs-look" data-look="${i}" data-tip="${l.name}"><span>${buildSVG(lookState(l), looksQ, ICONS, { id: "lk" + i }).svg}</span><small>${l.name}</small></button>`).join("") +
      `<button type="button" class="qs-look is-random" data-surprise data-tip="Surprise me">${icon("magic")}<small>Surprise</small></button>`;

    /* ----- Sync inputs with state ----- */
    const sync = () => {
      $$("[data-set]", root).forEach(b => b.setAttribute("aria-pressed", String(get(b.dataset.set)) === b.dataset.v));
      $$("[data-k]", root).forEach(el => {
        const v = get(el.dataset.k);
        if (el.type === "checkbox") el.checked = !!v;
        else if (el.type === "color") { el.value = v || "#000000"; const sw = el.closest(".qs-color"); if (sw) { sw.style.setProperty("--sw", v || "transparent"); sw.classList.toggle("is-auto", !v); const t = $("span", sw); if (t) t.textContent = v ? v.toUpperCase() : (sw.dataset.auto || "Auto"); } }
        else if (el.tagName === "SELECT") { el.value = String(v); el.dispatchEvent(new Event("sync")); }
        else if (!(el.type === "range" && el === dragging)) el.value = v; // never tug a slider while it's being dragged
        const out = el.dataset.out && $(`[data-out-for="${el.dataset.k}"]`, root);
        if (out) out.textContent = el.dataset.out.replace("{}", Math.round(el.dataset.k === "logo.size" ? v * 100 : el.dataset.k === "scale" ? v * 100 : v));
      });
      root.classList.toggle("is-gradient", st.fill !== "solid");
      root.classList.toggle("is-linear", st.fill === "linear");
      root.classList.toggle("has-label", st.label.style !== "none");
      root.classList.toggle("has-logo", st.logo.kind !== "none");
      $$("[data-icon]", root).forEach(b => b.setAttribute("aria-pressed", st.logo.kind === "icon" && st.logo.icon === b.dataset.icon));
      $("[data-qs-upload]", root).classList.toggle("is-on", st.logo.kind === "image");
      $("[data-qs-nologo]", root).setAttribute("aria-pressed", st.logo.kind === "none");
    };

    /* ----- Render + scan check ----- */
    const stage = $("[data-qs-preview]", root), meter = $("[data-qs-meter]", root);
    let lastSVG = "", lastRatio = 1, checkT = 0, checkId = 0;
    const render = () => {
      const text = payload();
      let q;
      try { q = encode(text, st.ec); } catch (e) { stage.innerHTML = `<div class="qs-err">${icon("close")}<b>That's too much for one code.</b><span>Shorten the content or lower error correction.</span></div>`; setMeter("bad", "Too long", "QR codes hold up to about 2,900 characters."); return; }
      const r = buildSVG(st, q, ICONS);
      lastSVG = r.svg; lastRatio = r.ratio;
      stage.innerHTML = lastSVG;
      $("[data-qs-info]", root).textContent = `Version ${q.typeNumber || Math.round((q.getModuleCount() - 17) / 4)} · ${q.getModuleCount()}×${q.getModuleCount()} · ${text.length} characters`;
      save();
      clearTimeout(checkT);
      setMeter("wait", "Checking…", "Reading your code the way a phone camera would.");
      checkT = setTimeout(() => scanCheck(text), 320);
    };
    const setMeter = (state, title, sub) => {
      meter.dataset.state = state;
      $("b", meter).textContent = title; $("small", meter).textContent = sub;
    };
    const svgImage = (svg, px) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = rej;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", `<svg width="${px}" height="${Math.round(px * lastRatio)}" `));
    });
    // Phones see a slightly blurred, smaller image; we try a few sizes and blur levels like a camera would
    const ATTEMPTS = [[400, 0], [400, 1.4], [560, 2.2], [300, .8], [640, 3]];
    // True when jsQR reads `svg` back as `text` at any of the camera-like attempts
    const decodes = async (svg, ratio, text, alive = () => true) => {
      for (const [px, blur] of ATTEMPTS) {
        const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", `<svg width="${px}" height="${Math.round(px * ratio)}" `)); });
        if (!alive()) return null;
        const cv = document.createElement("canvas"); cv.width = px; cv.height = Math.round(px * ratio);
        const x = cv.getContext("2d", { willReadFrequently: true });
        x.fillStyle = st.transparent ? (lum(st.c1) > .5 ? "#0f0f0f" : "#ffffff") : st.bg; x.fillRect(0, 0, cv.width, cv.height);
        x.filter = blur ? `blur(${blur}px)` : "none";
        x.drawImage(img, 0, 0, cv.width, cv.height);
        const res = window.jsQR(x.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: "attemptBoth" });
        if (res && res.data === text) return true;
        await new Promise(r => setTimeout(r));
        if (!alive()) return null;
      }
      return false;
    };
    const scanCheck = async text => {
      const id = ++checkId;
      if (!window.jsQR) { setMeter("ok", "Ready", "Test it with your phone camera before printing."); return; }
      try {
        const ok = await decodes(lastSVG, lastRatio, text, () => id === checkId);
        if (ok === null) return;
        const bgL = lum(st.transparent ? "#ffffff" : st.bg), contrast = (Math.max(lum(st.c1), bgL) + .05) / (Math.min(lum(st.c1), bgL) + .05);
        if (ok && contrast >= 4) setMeter("ok", "Scans perfectly", "We decoded this design the way a phone camera would.");
        else if (ok) setMeter("warn", "Scans, low contrast", "It reads, but more contrast between code and background is safer for print.");
        else if (contrast < 2.5) setMeter("bad", "Hard to scan", "Make the code much darker (or lighter) than the background.");
        else setMeter("warn", "Test with your phone", st.logo.kind !== "none" ? "Our checker couldn't confirm it. A smaller logo or higher error correction helps." : "Our checker couldn't confirm it. Bigger dots, solid corners or more quiet zone help.");
      } catch (e) { if (id === checkId) setMeter("ok", "Ready", "Test it with your phone camera before printing."); }
    };

    /* ----- Events ----- */
    const changed = () => { sync(); render(); };
    // Sliders redraw once per frame, however fast the pointer moves
    const changedSoon = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; changed(); }); };
    root.addEventListener("pointerdown", e => { if (e.target.matches('input[type="range"]')) dragging = e.target; });
    addEventListener("pointerup", () => { dragging = null; });
    root.addEventListener("click", e => {
      const t = e.target.closest("[data-type]");
      if (t) { st.type = t.dataset.type; st.data = st.data || {}; drawFields(); changed(); return; }
      const s = e.target.closest("[data-set]");
      if (s) { const cur = get(s.dataset.set), v = s.dataset.v; set(s.dataset.set, typeof cur === "number" ? +v : v); changed(); return; }
      const ic = e.target.closest("[data-icon]");
      if (ic) { st.logo.kind = "icon"; st.logo.icon = ic.dataset.icon; bumpEC(); changed(); return; }
      if (e.target.closest("[data-qs-nologo]")) { st.logo.kind = "none"; changed(); return; }
      const lk = e.target.closest("[data-look]");
      if (lk) { const l = LOOKS[+lk.dataset.look]; Object.assign(st, { c2: l.c2 || l.c1, angle: 135 }, clone(l)); delete st.name; changed(); toast(`${l.name} look applied`); return; }
      if (e.target.closest("[data-surprise]")) { surprise(); return; }
      const auto = e.target.closest("[data-auto]");
      if (auto) { set(auto.dataset.auto, ""); changed(); return; }
      const dl = e.target.closest("[data-qs-dl]");
      if (dl) { download(); return; }
      if (e.target.closest("[data-qs-copy]")) { copyImage(); return; }
      if (e.target.closest("[data-qs-svgcode]")) { copy(lastSVG, "SVG code copied"); return; }
      if (e.target.closest("[data-qs-reset]")) { const keep = { type: st.type, data: st.data }; st = Object.assign(clone(DEFAULT), keep); changed(); toast("Design reset"); }
    });
    root.addEventListener("input", e => {
      const fd = e.target.closest("[data-field]");
      if (fd) { st.data[fd.dataset.field] = fd.value; render(); return; }
      const k = e.target.closest("[data-k]");
      if (!k) return;
      const cur = get(k.dataset.k);
      set(k.dataset.k, k.type === "checkbox" ? k.checked : typeof cur === "number" ? +k.value : k.value);
      if (k.type === "color" && k.dataset.k === "c1" && st.fill === "solid") st.c2 = st.c2 || k.value;
      if (k.type === "range") { dragging = dragging || k; changedSoon(); } else changed();
    });
    root.addEventListener("change", e => {
      const fd = e.target.closest("[data-field]");
      if (fd) { st.data[fd.dataset.field] = fd.value; render(); return; }
      const k = e.target.closest("select[data-k]");
      if (k) { const cur = get(k.dataset.k); set(k.dataset.k, typeof cur === "number" ? +k.value : k.value); changed(); }
    });
    const bumpEC = () => { if (st.ec === "L" || st.ec === "M") { st.ec = "Q"; toast("Error correction raised to Q so the logo stays scannable"); } };

    // Logo upload
    const up = $("[data-qs-file]", root);
    up.addEventListener("change", () => {
      const file = up.files[0]; if (!file) return;
      if (file.size > 4e6) { toast("Pick an image under 4 MB"); return; }
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => { // shrink big images so the design stays light
          const s = Math.min(1, 512 / Math.max(img.width, img.height)), cv = document.createElement("canvas");
          cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          st.logo.src = file.type === "image/svg+xml" ? rd.result : cv.toDataURL("image/png");
          st.logo.kind = "image"; bumpEC(); changed();
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
      up.value = "";
    });

    // Surprise: a palette from the library, a random pattern, always readable
    const pick = a => a[Math.floor(Math.random() * a.length)];
    let rolling = false;
    async function surprise() {
      if (rolling) return;
      rolling = true;
      let name = "";
      try {
        for (let i = 0; i < 6; i++) {
          name = roll();
          const text = payload(), r = buildSVG(st, encode(text, st.ec), ICONS);
          if (!window.jsQR || await decodes(r.svg, r.ratio, text)) break;
        }
      } catch (e) {}
      rolling = false;
      changed(); toast(`Surprise: ${name || "new look"}`);
    }
    function roll() {
      const p = pick(palettes.length ? palettes : [{ colors: ["#0f0f0f", "#ffffff", "#2b5bff"] }]);
      const cs = p.colors.slice().sort((a, b) => lum(a) - lum(b));
      const darkC = cs[0], light = cs[cs.length - 1];
      const ratio = (lum(light) + .05) / (lum(darkC) + .05);
      const flip = Math.random() < .2 && ratio > 6;
      Object.assign(st, {
        dot: pick(DOTS.filter(d => d[0] !== "star"))[0], eyeFrame: pick(FRAMES)[0], eyeBall: pick(BALLS.filter(d => d[0] !== "star"))[0],
        fill: pick(["solid", "linear", "radial"]), angle: pick([45, 90, 135, 180]),
        c1: flip ? light : darkC, c2: flip ? light : (cs[1] && lum(cs[1]) < .25 ? cs[1] : darkC),
        bg: ratio >= 4.5 ? (flip ? darkC : light) : "#ffffff",
        eyeFrameC: "", eyeBallC: Math.random() < .5 && cs.length > 2 ? cs[Math.floor(cs.length / 2)] : ""
      });
      // Keep it readable: every ink colour needs real contrast with the background
      const cr = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
      const inkOk = c => cr(c, st.bg) >= 4.5;
      if (!inkOk(st.c1) || (st.fill !== "solid" && !inkOk(st.c2))) {
        st.bg = lum(st.c1) > .4 ? "#0f0f0f" : "#ffffff";
        if (!inkOk(st.c1)) st.c1 = lum(st.bg) > .5 ? darkC : light;
        if (!inkOk(st.c2)) st.c2 = st.c1;
        if (!inkOk(st.c1)) { st.c1 = st.c2 = lum(st.bg) > .5 ? "#0f0f0f" : "#ffffff"; }
      }
      if (st.eyeBallC && cr(st.eyeBallC, st.bg) < 3) st.eyeBallC = "";
      return p.name;
    }

    /* ----- Export ----- */
    const fileBase = () => "draftstudio-qr-" + (st.type === "url" ? (st.data.url || "").replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 32).replace(/-+$/, "") || "code" : st.type);
    const toBlob = async (fmt, px) => {
      const img = await svgImage(lastSVG, px);
      const cv = document.createElement("canvas"); cv.width = px; cv.height = Math.round(px * lastRatio);
      const x = cv.getContext("2d");
      if (fmt === "jpg") { x.fillStyle = st.transparent ? "#ffffff" : st.bg; x.fillRect(0, 0, cv.width, cv.height); }
      x.drawImage(img, 0, 0, cv.width, cv.height);
      return new Promise(r => cv.toBlob(r, fmt === "jpg" ? "image/jpeg" : "image/png", .95));
    };
    const save_ = (blob, name) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); };
    async function download() {
      const { fmt, px } = st.exp;
      if (fmt === "svg") { save_(new Blob([lastSVG], { type: "image/svg+xml" }), fileBase() + ".svg"); toast("SVG downloaded"); return; }
      save_(await toBlob(fmt, +px), `${fileBase()}-${px}.${fmt}`);
      toast(`${fmt.toUpperCase()} downloaded · ${px}px`);
    }
    async function copyImage() {
      try {
        const blob = await toBlob("png", 1024);
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast("Image copied, paste it anywhere");
      } catch (e) { copy(lastSVG, "Copied as SVG code"); }
    }

    drawFields();
    sync();
    render();
  };
})();
