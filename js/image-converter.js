/* =====================================================================
   DRAFTY LABS — IMAGE CONVERTER
   Convert, compress and resize images, many at once, entirely in the
   browser: files are decoded and re-encoded with <canvas>, never uploaded.
   - Only formats this browser can really encode are offered (a browser
     that can't write WebP or AVIF silently hands back a PNG, so each one
     is tested with a 1 px image first).
   - "Target size" finds the highest quality that fits (binary search),
     then shrinks the image if even the lowest quality is too big.
   - Re-encoding the same format can make a file bigger; then the
     original is kept.
   - "Download all" builds a .zip here (stored, no compression: images
     are already compressed).
   site.js calls window.ImageConverter(kit) with its shared helpers.
   ===================================================================== */
(function () {
  "use strict";

  const FORMATS = {
    jpg:  { type: "image/jpeg", ext: "jpg",  name: "JPG",  lossy: true,  alpha: false },
    png:  { type: "image/png",  ext: "png",  name: "PNG",  lossy: false, alpha: true },
    webp: { type: "image/webp", ext: "webp", name: "WebP", lossy: true,  alpha: true },
    avif: { type: "image/avif", ext: "avif", name: "AVIF", lossy: true,  alpha: true }
  };
  const MAX_FILES = 60;
  const DEF = { fmt: "jpg", mode: "quality", q: 82, kb: 200, size: "original", w: 1920, pct: 50, bg: "#ffffff" };
  const KEY = "ds-ic";

  /* ---------- Small helpers ---------- */
  const kb = n => n < 1024 ? n + " B" : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0) + " KB" : (n / 1048576).toFixed(n < 10485760 ? 2 : 1) + " MB";
  const baseName = n => n.replace(/\.[^.]+$/, "") || "image";
  const extOf = n => (n.match(/\.([^.]+)$/) || [, ""])[1].toLowerCase();
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // Largest canvas a browser will draw (iOS Safari caps it at about 16.7 megapixels)
  const MAX_AREA = isIOS ? 16777216 : 100000000;
  const toBlob = (c, type, q) => new Promise(r => { try { c.toBlob(r, type, q); } catch (e) { r(null); } });
  const tick = () => new Promise(r => setTimeout(r, 0));

  /* ---------- What this browser can write ---------- */
  async function encoders() {
    const c = document.createElement("canvas"); c.width = c.height = 2;
    const ok = {};
    for (const [k, f] of Object.entries(FORMATS)) {
      const b = await toBlob(c, f.type, .8);
      ok[k] = !!b && b.type === f.type;
    }
    return ok;
  }

  /* ---------- Read an image file ---------- */
  // createImageBitmap honours the photo's rotation (EXIF); <img> is the fallback (SVG, older Safari, HEIC in Safari)
  async function decode(file) {
    const svg = file.type === "image/svg+xml" || extOf(file.name) === "svg";
    if (!svg && window.createImageBitmap) {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
        return { src: bmp, w: bmp.width, h: bmp.height, svg, done: () => bmp.close && bmp.close() };
      } catch (e) { /* fall through */ }
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw new Error("open"); }
    let w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) { w = 1024; h = 1024; }
    // A vector has no pixels of its own: draw small ones at 1024 px or more
    if (svg && Math.max(w, h) < 1024) { const s = 1024 / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
    return { src: img, w, h, svg, done: () => URL.revokeObjectURL(url) };
  }

  // Does the picture use transparency? (checked on a small copy)
  function hasAlpha(src, w, h) {
    try {
      const s = Math.min(1, 160 / Math.max(w, h));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
      const x = c.getContext("2d", { willReadFrequently: true });
      x.drawImage(src, 0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    } catch (e) {}
    return false;
  }

  // Draw at the new size; big reductions go in halves so fine detail doesn't shimmer
  function draw(src, sw, sh, w, h, bg) {
    let cur = src, cw = sw, ch = sh;
    while (cw / w > 2.2 && ch / h > 2.2) {
      const t = document.createElement("canvas");
      t.width = Math.max(w, Math.round(cw / 2)); t.height = Math.max(h, Math.round(ch / 2));
      const tx = t.getContext("2d");
      tx.imageSmoothingQuality = "high";
      tx.drawImage(cur, 0, 0, t.width, t.height);
      cur = t; cw = t.width; ch = t.height;
    }
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
    x.imageSmoothingQuality = "high";
    x.drawImage(cur, 0, 0, w, h);
    return c;
  }

  /* ---------- Zip (stored) ---------- */
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  async function zip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    const d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    let off = 0;
    for (const f of files) {
      const data = new Uint8Array(await f.blob.arrayBuffer()), name = enc.encode(f.name), crc = crc32(data);
      const lh = new DataView(new ArrayBuffer(30));
      [[0, 0x04034b50, 4], [4, 20, 2], [6, 0x0800, 2], [8, 0, 2], [10, time, 2], [12, date, 2], [14, crc, 4], [18, data.length, 4], [22, data.length, 4], [26, name.length, 2], [28, 0, 2]]
        .forEach(([o, v, n]) => n === 4 ? lh.setUint32(o, v, true) : lh.setUint16(o, v, true));
      parts.push(lh, name, data);
      const ch = new DataView(new ArrayBuffer(46));
      [[0, 0x02014b50, 4], [4, 20, 2], [6, 20, 2], [8, 0x0800, 2], [10, 0, 2], [12, time, 2], [14, date, 2], [16, crc, 4], [20, data.length, 4], [24, data.length, 4], [28, name.length, 2],
        [30, 0, 2], [32, 0, 2], [34, 0, 2], [36, 0, 2], [38, 0, 4], [42, off, 4]]
        .forEach(([o, v, n]) => n === 4 ? ch.setUint32(o, v, true) : ch.setUint16(o, v, true));
      central.push(ch, name);
      off += 30 + name.length + data.length;
    }
    const size = central.reduce((s, p) => s + p.byteLength, 0);
    const end = new DataView(new ArrayBuffer(22));
    [[0, 0x06054b50, 4], [4, 0, 2], [6, 0, 2], [8, files.length, 2], [10, files.length, 2], [12, size, 4], [16, off, 4], [20, 0, 2]]
      .forEach(([o, v, n]) => n === 4 ? end.setUint32(o, v, true) : end.setUint16(o, v, true));
    return new Blob([...parts, ...central, end], { type: "application/zip" });
  }

  const save = (blob, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ---------- The tool ---------- */
  window.ImageConverter = async function (kit) {
    const { $, $$, esc, toast } = kit;
    const root = $("[data-ic]");
    if (!root) return;
    const can = await encoders();

    let S = { ...DEF };
    try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
    if (!can[S.fmt]) S.fmt = "jpg";
    const store = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

    const list = $("[data-ic-list]", root), drop = $("[data-ic-drop]", root), input = $("[data-ic-input]", root);
    const sum = $("[data-ic-sum]", root), dlAll = $("[data-ic-all]", root);
    let files = [], seq = 0, run = 0;

    /* -- settings UI -- */
    $$("[data-ic-fmt]", root).forEach(b => {
      const k = b.dataset.icFmt;
      if (!can[k]) b.remove();   // only offer what this browser can really write
    });
    $(".ic-fmts", root).dataset.n = $$("[data-ic-fmt]", root).length;
    const field = k => $(`[data-k="${k}"]`, root);
    const paint = () => {
      $$("[data-ic-fmt]", root).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.icFmt === S.fmt)));
      $$("[data-set]", root).forEach(b => b.setAttribute("aria-pressed", String(S[b.dataset.set] === b.dataset.v)));
      const lossy = FORMATS[S.fmt].lossy;
      root.classList.toggle("is-lossy", lossy);
      root.classList.toggle("is-jpg", S.fmt === "jpg");
      root.classList.toggle("is-target", S.mode === "target");
      root.classList.toggle("is-width", S.size === "width");
      root.classList.toggle("is-pct", S.size === "pct");
      field("q").value = S.q; field("kb").value = S.kb; field("w").value = S.w; field("pct").value = S.pct; field("bg").value = S.bg;
      $("[data-out-for='q']", root).textContent = S.q + "%";
      $("[data-out-for='pct']", root).textContent = S.pct + "%";
      const bg = field("bg").closest(".qs-color");
      bg.style.setProperty("--sw", S.bg); $("span", bg).textContent = S.bg.toUpperCase();
      $("[data-ic-qnote]", root).textContent = lossy
        ? (S.mode === "target" ? "We find the best quality that fits. If it still won't fit, the image is made smaller." : "80% looks the same to most eyes and is far smaller.")
        : (S.mode === "target" ? "PNG has no quality setting, so the image is made smaller until it fits." : "PNG keeps every pixel exactly, so there's no quality setting.");
    };
    let wait;
    const changed = () => { store(); paint(); clearTimeout(wait); wait = setTimeout(convertAll, 260); };
    root.addEventListener("click", e => {
      const f = e.target.closest("[data-ic-fmt]");
      if (f && !f.disabled) { S.fmt = f.dataset.icFmt; return changed(); }
      const s = e.target.closest("[data-set]");
      if (s) { S[s.dataset.set] = s.dataset.v; return changed(); }
    });
    root.addEventListener("input", e => {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      if (k === "bg") S.bg = e.target.value;
      else {
        const v = parseFloat(e.target.value);
        if (!isFinite(v)) return;
        const lim = { q: [5, 100], kb: [5, 50000], w: [16, 16000], pct: [5, 100] }[k];
        S[k] = Math.round(Math.min(lim[1], Math.max(lim[0], v)));
        if (k === "q" || k === "pct") { store(); $(`[data-out-for='${k}']`, root).textContent = S[k] + "%"; clearTimeout(wait); wait = setTimeout(convertAll, 260); return; }
      }
      store(); clearTimeout(wait); wait = setTimeout(() => { paint(); convertAll(); }, k === "bg" ? 200 : 600);
    });
    $("[data-ic-reset]", root).addEventListener("click", () => { S = { ...DEF }; if (!can[S.fmt]) S.fmt = "jpg"; changed(); });

    /* -- adding files -- */
    const ICON_IMG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="1.75"/><path d="m21 15-4.5-4.5L6 21"/></svg>`;
    const ICON_DL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg>`;
    const ICON_X = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
    const imageish = f => /^image\//.test(f.type) || /^(jpe?g|png|webp|avif|gif|bmp|svg|heic|heif|ico|tiff?)$/.test(extOf(f.name));

    function add(fl) {
      const pick = [...fl].filter(imageish);
      const skipped = fl.length - pick.length;
      const room = MAX_FILES - files.length;
      if (pick.length > room) toast(`Up to ${MAX_FILES} images at a time`);
      pick.slice(0, Math.max(0, room)).forEach(file => {
        const it = { id: ++seq, file, state: "wait" };
        files.push(it);
        list.insertAdjacentHTML("beforeend", `
          <div class="ic-row" data-id="${it.id}" data-state="wait">
            <span class="ic-thumb">${ICON_IMG}</span>
            <div class="ic-meta"><b></b><small>Waiting…</small></div>
            <span class="ic-save"></span>
            <button class="ic-btn ic-dl" type="button" aria-label="Download" disabled>${ICON_DL}</button>
            <button class="ic-btn ic-x" type="button" aria-label="Remove">${ICON_X}</button>
          </div>`);
        $(`.ic-row[data-id="${it.id}"] .ic-meta b`, list).textContent = file.name;
      });
      if (skipped) toast(skipped === 1 ? "That file isn't an image" : `${skipped} files weren't images`);
      layout();
      convertAll();
    }

    input.addEventListener("change", () => { add(input.files); input.value = ""; });
    $$("[data-ic-pick]", root).forEach(b => b.addEventListener("click", () => input.click()));
    drop.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    // Drag and drop anywhere on the page; the drop zone lights up
    let depth = 0;
    const isFiles = e => e.dataTransfer && [...(e.dataTransfer.types || [])].includes("Files");
    addEventListener("dragenter", e => { if (!isFiles(e)) return; e.preventDefault(); depth++; root.classList.add("is-drag"); });
    addEventListener("dragleave", e => { if (!isFiles(e)) return; if (--depth <= 0) { depth = 0; root.classList.remove("is-drag"); } });
    addEventListener("dragover", e => { if (isFiles(e)) e.preventDefault(); });
    addEventListener("drop", e => {
      if (!isFiles(e)) return;
      e.preventDefault(); depth = 0; root.classList.remove("is-drag");
      if (e.dataTransfer.files.length) add(e.dataTransfer.files);
    });
    // Paste a screenshot or a copied image
    addEventListener("paste", e => {
      if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
      const fl = [...((e.clipboardData && e.clipboardData.files) || [])];
      if (!fl.length) return;
      e.preventDefault();
      add(fl.map((f, i) => f.name && f.name !== "image.png" ? f : new File([f], `pasted-image${fl.length > 1 ? "-" + (i + 1) : ""}.${(f.type.split("/")[1] || "png").replace("jpeg", "jpg")}`, { type: f.type })));
    });

    list.addEventListener("click", e => {
      const row = e.target.closest(".ic-row"); if (!row) return;
      const it = files.find(f => f.id === +row.dataset.id); if (!it) return;
      if (e.target.closest(".ic-x")) {
        files = files.filter(f => f !== it);
        if (it.url) URL.revokeObjectURL(it.url);
        row.remove(); layout(); summary();
      } else if (e.target.closest(".ic-dl") && it.out) save(it.out, it.outName);
    });
    $("[data-ic-clear]", root).addEventListener("click", () => {
      run++;
      files.forEach(f => f.url && URL.revokeObjectURL(f.url));
      files = []; list.innerHTML = ""; layout(); summary();
    });
    dlAll.addEventListener("click", async () => {
      const ready = files.filter(f => f.out);
      if (!ready.length) return;
      if (ready.length === 1) return save(ready[0].out, ready[0].outName);
      dlAll.disabled = true;
      // unique names inside the zip
      const seen = {};
      const named = ready.map(f => {
        let n = f.outName; const k = n.toLowerCase();
        if (seen[k]) { n = n.replace(/(\.[^.]+)$/, ` (${++seen[k]})$1`); } else seen[k] = 1;
        return { name: n, blob: f.out };
      });
      try { save(await zip(named), "drafty-labs-images.zip"); } catch (e) { toast("Couldn't make the zip. Try downloading one by one."); }
      dlAll.disabled = false;
    });

    function layout() {
      root.classList.toggle("has-files", files.length > 0);
      dlAll.querySelector("span").textContent = files.length > 1 ? "Download all (.zip)" : "Download";
    }
    function summary() {
      const done = files.filter(f => f.out);
      const busy = files.some(f => f.state === "work" || f.state === "wait");
      const a = done.reduce((s, f) => s + f.file.size, 0), b = done.reduce((s, f) => s + f.out.size, 0);
      const n = files.length;
      let t = n ? `${n} image${n > 1 ? "s" : ""}` : "";
      if (done.length) {
        const p = Math.round((1 - b / a) * 100);
        t += ` · ${kb(a)} → ${kb(b)}` + (p > 0 ? ` (−${p}%)` : p < 0 ? ` (+${-p}%)` : "");
      }
      sum.textContent = busy ? (n ? t + " · working…" : "") : t;
      dlAll.disabled = !done.length || busy;
    }

    /* -- converting -- */
    function sizeFor(w, h) {
      let s = 1;
      if (S.size === "width" && w > S.w) s = S.w / w;
      if (S.size === "pct") s = S.pct / 100;
      let nw = Math.max(1, Math.round(w * s)), nh = Math.max(1, Math.round(h * s));
      let cut = false;
      if (nw * nh > MAX_AREA) { const k = Math.sqrt(MAX_AREA / (nw * nh)); nw = Math.floor(nw * k); nh = Math.floor(nh * k); cut = true; }
      return [nw, nh, cut];
    }

    async function convertOne(it, token) {
      const row = $(`.ic-row[data-id="${it.id}"]`, list);
      if (!row) return;
      const meta = $(".ic-meta small", row), badge = $(".ic-save", row), dl = $(".ic-dl", row);
      const set = st => { it.state = st; row.dataset.state = st; };
      set("work"); meta.textContent = "Converting…"; dl.disabled = true;
      const F = FORMATS[S.fmt];
      let pic;
      try { pic = await decode(it.file); }
      catch (e) {
        if (token !== run) return;
        set("error"); badge.textContent = "";
        const heic = /^hei[cf]$/.test(extOf(it.file.name)) || /hei[cf]/.test(it.file.type);
        meta.textContent = heic ? "iPhone HEIC photos only open in Safari. Try this page in Safari, or set Camera › Formats › Most Compatible."
                                : "This file couldn't be opened. It may be damaged, or a format your browser can't read.";
        return;
      }
      try {
        if (token !== run) return;
        const [w, h, cut] = sizeFor(pic.w, pic.h);
        let shrunk = cut;
        const alpha = !F.alpha && /png|webp|gif|svg|avif|heic|tif|ico/.test(it.file.type + extOf(it.file.name)) && hasAlpha(pic.src, pic.w, pic.h);
        const bg = F.alpha ? null : S.bg;
        let canvas = draw(pic.src, pic.w, pic.h, w, h, bg), blob, q = S.q / 100, scaled = 1, note = "";
        const lim = S.kb * 1024;
        if (S.mode === "target") {
          // Highest quality that fits, then smaller and smaller pictures if needed
          let best = null;
          for (let step = 0; step < 9 && !best; step++) {
            if (step) {
              scaled *= .82;
              canvas = draw(pic.src, pic.w, pic.h, Math.max(1, Math.round(w * scaled)), Math.max(1, Math.round(h * scaled)), bg);
            }
            if (F.lossy) {
              let lo = .05, hi = .95, keep = null;
              const top = await toBlob(canvas, F.type, hi);
              if (top && top.size <= lim) keep = top;
              else {
                for (let i = 0; i < 7; i++) {
                  const mid = (lo + hi) / 2, b = await toBlob(canvas, F.type, mid);
                  if (token !== run) return;
                  if (b && b.size <= lim) { keep = b; lo = mid; } else hi = mid;
                }
                if (!keep) { const b = await toBlob(canvas, F.type, .05); if (b && b.size <= lim) keep = b; }
              }
              best = keep;
            } else {
              const b = await toBlob(canvas, F.type);
              if (b && b.size <= lim) best = b;
            }
            await tick();
            if (token !== run) return;
          }
          blob = best || await toBlob(canvas, F.type, F.lossy ? .05 : undefined);
          if (!best) note = `Couldn't get it under ${kb(lim)}; this is the smallest we could make`;
        } else {
          blob = await toBlob(canvas, F.type, F.lossy ? q : undefined);
          if (!blob) { // the canvas was too big for this device: try smaller
            scaled = .7; shrunk = true; canvas = draw(pic.src, pic.w, pic.h, Math.round(w * .7), Math.round(h * .7), bg);
            blob = await toBlob(canvas, F.type, F.lossy ? q : undefined);
          }
        }
        if (token !== run) return;
        if (!blob) throw new Error("encode");
        const outW = canvas.width, outH = canvas.height;
        let out = blob, kept = false;
        // Same format, same size, and our copy is bigger: keep the original
        if (S.mode !== "target" && it.file.type === F.type && outW === pic.w && outH === pic.h && blob.size >= it.file.size) { out = it.file; kept = true; }
        it.out = out;
        it.outName = baseName(it.file.name) + "." + F.ext;
        if (it.url) URL.revokeObjectURL(it.url);
        it.url = URL.createObjectURL(out);
        $(".ic-thumb", row).innerHTML = `<img src="${it.url}" alt="">`;
        $(".ic-meta b", row).textContent = it.outName;
        const dims = outW === pic.w && outH === pic.h ? `${outW} × ${outH}` : `${pic.w} × ${pic.h} → ${outW} × ${outH}`;
        const extra = kept ? "Already as small as it gets, so the original is kept"
          : note || (alpha ? `Transparent areas filled with ${S.bg.toUpperCase()}` : "")
          || (/gif/.test(it.file.type) ? "GIFs: the first frame only" : "")
          || (shrunk ? "Made smaller to fit your browser's limit" : "");
        meta.textContent = `${dims} · ${kb(it.file.size)} → ${kb(out.size)}` + (extra ? ` · ${extra}` : "");
        // a vector drawn as pixels isn't "compression", so no percentage for SVGs
        const p = pic.svg ? null : Math.round((1 - out.size / it.file.size) * 100);
        badge.textContent = p == null ? "" : p > 0 ? `−${p}%` : p < 0 ? `+${Math.min(999, -p)}%` : "0%";
        badge.className = "ic-save" + (p > 0 ? " is-good" : p < 0 ? " is-up" : "");
        set(note ? "warn" : "done"); dl.disabled = false;
      } catch (e) {
        if (token !== run) return;
        set("error"); badge.textContent = "";
        meta.textContent = "Couldn't convert this one. Try a smaller size or another format.";
      } finally { pic && pic.done(); }
    }

    async function convertAll() {
      const token = ++run;
      files.forEach(f => { if (f.state !== "error") { f.state = "wait"; } });
      summary();
      for (const it of files.slice()) {
        if (token !== run) return;
        if (!files.includes(it)) continue;
        await convertOne(it, token);
        summary();
        await tick();
      }
      if (token === run) summary();
    }

    paint(); layout(); summary();
  };
})();
