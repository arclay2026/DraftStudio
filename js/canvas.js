/* =====================================================================
   CANVAS — a free design editor for practice (canvas.html)
   Built on Fabric.js 5 (js/vendor/fabric.min.js, MIT licence).
   Everything runs in the browser: designs autosave to this device
   (IndexedDB) and download as PNG, JPG, SVG or a project file.
   site.js calls window.DSCanvas(kit) on the Canvas page.
   ===================================================================== */
window.DSCanvas = function (kit) {
  const { $, $$, esc, icon, DS } = kit;
  const root = $("[data-canvas]");
  if (!root || !window.fabric) return;
  const F = window.fabric;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // Text that isn't in the page (dialogs, default words on the canvas) in the visitor's language
  const tr = s => (window.DS_I18N && window.DS_I18N.strings && window.DS_I18N.strings[s]) || s;
  const round = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k; };

  /* ---------- Editor icons (the site set covers the rest) ---------- */
  const UI = {
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    minus: '<path d="M5 12h14"/>',
    shapes: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><circle cx="17" cy="17" r="4"/><path d="M17 3l4 7h-8z"/>',
    "eye-off": '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.9 3.7M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 5.1-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.2"/>',
    front: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
    back: '<rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 8v10a2 2 0 0 1-2 2H8"/>',
    "al-left": '<path d="M4 3v18"/><rect x="8" y="6" width="12" height="4" rx="1"/><rect x="8" y="14" width="7" height="4" rx="1"/>',
    "al-center": '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
    "al-right": '<path d="M20 3v18"/><rect x="4" y="6" width="12" height="4" rx="1"/><rect x="9" y="14" width="7" height="4" rx="1"/>',
    "al-top": '<path d="M3 4h18"/><rect x="6" y="8" width="4" height="12" rx="1"/><rect x="14" y="8" width="4" height="7" rx="1"/>',
    "al-middle": '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
    "al-bottom": '<path d="M3 20h18"/><rect x="6" y="4" width="4" height="12" rx="1"/><rect x="14" y="9" width="4" height="7" rx="1"/>',
    "t-left": '<path d="M4 6h16M4 12h10M4 18h13"/>',
    "t-center": '<path d="M4 6h16M7 12h10M5.5 18h13"/>',
    "t-right": '<path d="M4 6h16M10 12h10M7 18h13"/>',
    "t-justify": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    group: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><rect x="7" y="7" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/>',
    ungroup: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    fit: '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    italic: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
    underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'
  };
  const ui = (id, cls = "") => (UI[id]
    ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI[id]}</svg>`
    : icon(id, cls));

  /* ---------- Sizes, fonts, briefs ---------- */
  const SIZES = [
    ["Instagram post", 1080, 1080], ["Instagram portrait", 1080, 1350], ["Story", 1080, 1920],
    ["Poster", 1240, 1754], ["Presentation", 1920, 1080], ["YouTube thumbnail", 1280, 720],
    ["Facebook ad", 1200, 628], ["Business card", 1050, 600], ["Logo", 1000, 1000]
  ];
  const FONTS = {
    "Inter": [400, 500, 600, 700], "Poppins": [400, 500, 600, 700, 800], "Montserrat": [400, 500, 600, 700, 800],
    "Space Grotesk": [400, 500, 700], "Syne": [400, 600, 700, 800], "Archivo Black": [400], "Bebas Neue": [400],
    "Oswald": [400, 500, 700], "Playfair Display": [400, 600, 700, 800], "DM Serif Display": [400], "Lora": [400, 600, 700],
    "Georgia": [400, 700], "Caveat": [400, 700]
  };
  const WEIGHT_NAMES = { 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold", 800: "Extra bold" };
  const PAIRS = [["Bebas Neue", 400, "Inter", 400], ["Playfair Display", 700, "Lora", 400], ["Archivo Black", 400, "Inter", 400],
    ["Syne", 800, "Space Grotesk", 400], ["DM Serif Display", 400, "Inter", 400], ["Caveat", 700, "Poppins", 400]];
  const PAL = (DS.palettes || []).map(p => p.colors);
  const pal = name => ((DS.palettes || []).find(p => p.name === name) || { colors: ["#0f0f0f", "#1f7aff", "#ffffff"] }).colors;
  const BRIEFS = [
    { title: "Coffee shop opening", client: "Bean There", size: 0, palette: "Coffee House",
      task: "An Instagram post announcing the grand opening of Bean There, a small neighbourhood coffee shop. Saturday, 8 AM.",
      tip: "Make the opening date impossible to miss." },
    { title: "Jazz night poster", client: "The Blue Room", size: 3, palette: "Midnight Neon",
      task: "A poster for Thursday Jazz Night at The Blue Room. 8 PM, free entry.",
      tip: "One big headline, then the details in a smaller, quieter size." },
    { title: "Fitness app launch", client: "Pulse", size: 2, palette: "Citrus Pop",
      task: "A story for the launch of Pulse, a 10-minute workout app. Add a clear call to action.",
      tip: "Keep the key text away from the top and bottom edges of a story." },
    { title: "Bakery business card", client: "Crumb & Co", size: 7, palette: "Peach Fuzz",
      task: "A business card for Crumb & Co, a family bakery. Name, phone and address.",
      tip: "Leave space around the edges. Cards get trimmed when printed." },
    { title: "YouTube thumbnail", client: "Design Tips Weekly", size: 5, palette: "Black & Amber",
      task: "A thumbnail for a video called \"5 design mistakes beginners make\".",
      tip: "Use 3 to 5 words, big enough to read on a phone." },
    { title: "Plant shop logo", client: "Leaf & Co", size: 8, palette: "Forest Floor",
      task: "A simple logo for Leaf & Co, a small plant shop.",
      tip: "Test it small: it should still read when it's tiny." },
    { title: "Sneaker sale ad", client: "Stride", size: 6, palette: "Miami Vice",
      task: "A Facebook ad for 40% off all sneakers this weekend only.",
      tip: "Lead with the number. 40% is the hook." },
    { title: "Book cover", client: "The Quiet Ocean", size: 3, palette: "Ocean Depths",
      task: "A cover for a novel called The Quiet Ocean by M. Rivers.",
      tip: "The title should still read as a small thumbnail in a shop." },
    { title: "Taco truck menu", client: "Loco Tacos", size: 3, palette: "Chilli Market",
      task: "A menu with five tacos and their prices for the Loco Tacos food truck.",
      tip: "Line the prices up on one edge so they're easy to scan." },
    { title: "Podcast cover", client: "Side Project", size: 0, palette: "Ultra Violet",
      task: "Cover art for Side Project, a podcast about building things after work.",
      tip: "Podcast apps show covers tiny. Keep it to the name and one shape." },
    { title: "Wedding invitation", client: "Ama & Leo", size: 3, palette: "Dusty Rose",
      task: "An invitation to the wedding of Ama & Leo, 14 June, Cape Town.",
      tip: "Pair one elegant serif with one simple sans." },
    { title: "Event ticket", client: "Neon Nights", size: 6, palette: "Tokyo Night",
      task: "A ticket for Neon Nights, a rooftop DJ party. Date, time, venue, seat.",
      tip: "Group the details so each one is easy to find." }
  ];

  /* ---------- Markup ---------- */
  const rail = [["brief", "target", "Brief"], ["templates", "grid", "Templates"], ["text", "type", "Text"], ["shapes", "shapes", "Shapes"],
    ["images", "image", "Images"], ["icons", "smile", "Icons"], ["colours", "palette", "Colours"], ["layers", "layers", "Layers"]];
  root.innerHTML = `
    <div class="cv-top">
      <div class="cv-file">
        <input class="cv-name" data-name value="${tr("Untitled design")}" aria-label="Design name" spellcheck="false" maxlength="60">
        <span class="cv-saved" data-saved></span>
      </div>
      <div class="cv-tools">
        <button type="button" class="cv-ib" data-act="undo" aria-label="Undo" data-tip="Undo">${ui("undo")}</button>
        <button type="button" class="cv-ib" data-act="redo" aria-label="Redo" data-tip="Redo">${ui("redo")}</button>
        <span class="cv-sep"></span>
        <button type="button" class="cv-ib" data-act="zoom-out" aria-label="Zoom out">${ui("minus")}</button>
        <button type="button" class="cv-zoom" data-act="fit" aria-label="Fit to screen" data-zoom>100%</button>
        <button type="button" class="cv-ib" data-act="zoom-in" aria-label="Zoom in">${ui("plus")}</button>
      </div>
      <div class="cv-actions">
        <button type="button" class="cv-btn" data-act="new">${ui("plus")}<span>New</span></button>
        <div class="cv-pop-wrap">
          <button type="button" class="cv-btn is-blue" data-act="export" aria-haspopup="true" aria-expanded="false">${ui("download")}<span>Download</span></button>
          <div class="cv-pop" data-export hidden>
            <span class="cv-lbl">File type</span>
            <div class="cv-seg" data-fmt><button type="button" class="is-on" data-v="png">PNG</button><button type="button" data-v="jpg">JPG</button><button type="button" data-v="svg">SVG</button></div>
            <span class="cv-lbl">Size</span>
            <div class="cv-seg" data-scale><button type="button" class="is-on" data-v="1">1×</button><button type="button" data-v="2">2×</button><button type="button" data-v="0.5">0.5×</button></div>
            <label class="cv-check" data-transp><input type="checkbox"><span>Transparent background</span></label>
            <button type="button" class="cv-btn is-blue is-wide" data-act="download">${ui("download")}<span>Download</span></button>
            <span class="cv-pop-sep"></span>
            <button type="button" class="cv-link" data-act="save-file">${ui("file")}<span>Save project file</span></button>
            <button type="button" class="cv-link" data-act="open-file">${ui("folder")}<span>Open project file</span></button>
          </div>
        </div>
      </div>
    </div>
    <div class="cv-body">
      <nav class="cv-rail" aria-label="Tools">
        ${rail.map(([k, ic, label]) => `<button type="button" class="cv-tab" data-tab="${k}" aria-pressed="false">${ui(ic)}<span>${label}</span></button>`).join("")}
      </nav>
      <aside class="cv-drawer" data-drawer hidden>
        <div class="cv-drawer-head"><strong data-drawer-title></strong><button type="button" class="cv-ib" data-act="close-drawer" aria-label="Close panel">${ui("close")}</button></div>
        <div class="cv-drawer-body" data-drawer-body></div>
      </aside>
      <div class="cv-stage" data-stage>
        <div class="cv-page" data-page-el><canvas></canvas></div>
        <div class="cv-drop" data-drop><span>${ui("upload")}Drop images to add them</span></div>
      </div>
      <aside class="cv-props" data-props aria-label="Properties"></aside>
    </div>
    <input type="file" accept="image/*" multiple hidden data-file-img>
    <input type="file" accept=".json,application/json" hidden data-file-json>`;

  const stage = $("[data-stage]", root), props = $("[data-props]", root), drawer = $("[data-drawer]", root);
  const nameIn = $("[data-name]", root), savedEl = $("[data-saved]", root), zoomEl = $("[data-zoom]", root);

  /* ---------- Fabric setup ---------- */
  F.Object.prototype.set({
    transparentCorners: false, cornerColor: "#ffffff", cornerStrokeColor: "#1f7aff", borderColor: "#1f7aff",
    cornerSize: 10, cornerStyle: "circle", borderScaleFactor: 1.5, padding: 0, borderOpacityWhenMoving: .5
  });
  F.Textbox.prototype.set({ editingBorderColor: "#1f7aff", cursorColor: "#1f7aff", selectionColor: "rgba(31, 122, 255, .22)" });
  if (F.Canvas2dFilterBackend) F.filterBackend = new F.Canvas2dFilterBackend();
  const PROPS = ["name", "locked", "kind", "kindRadius", "selectable", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation"];
  const cv = new F.Canvas($("canvas", root), {
    preserveObjectStacking: true, backgroundColor: "#ffffff", stopContextMenu: true,
    selectionColor: "rgba(31, 122, 255, .08)", selectionBorderColor: "#1f7aff", selectionLineWidth: 1
  });
  let W = 1080, H = 1350, zoom = 1, fitting = true, brief = null;
  const unit = () => Math.min(W, H) / 1080;   // sizes are designed for a 1080 px page

  /* ---------- Zoom and size ---------- */
  const setZoom = z => {
    zoom = clamp(z, .05, 4);
    cv.setZoom(zoom);
    cv.setDimensions({ width: Math.round(W * zoom), height: Math.round(H * zoom) });
    zoomEl.textContent = Math.round(zoom * 100) + "%";
  };
  const fit = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    const pad = innerWidth < 900 ? 28 : 72;
    setZoom(Math.min((r.width - pad) / W, (r.height - pad) / H));
    fitting = true;
  };
  if ("ResizeObserver" in window) new ResizeObserver(() => { if (fitting) fit(); }).observe(stage);
  const setSize = (w, h) => { W = Math.round(clamp(w, 50, 6000)); H = Math.round(clamp(h, 50, 6000)); fit(); };
  stage.addEventListener("pointerdown", e => { if (e.target === stage) { cv.discardActiveObject(); cv.requestRenderAll(); } });
  stage.addEventListener("wheel", e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    fitting = false;
    setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });

  /* ---------- Fonts ---------- */
  const fontReady = {};
  const loadFont = (family, weight = 400) => {
    if (family === "Georgia") return Promise.resolve();
    const key = family + weight;
    if (!fontReady[key]) fontReady[key] = (document.fonts ? document.fonts.load(`${weight} 40px "${family}"`) : Promise.resolve())
      .then(() => { F.util.clearFabricFontCache(family); }).catch(() => {});
    return fontReady[key];
  };
  const loadFontsOf = objs => Promise.all(objs.flatMap(o => (o.type === "group" ? o.getObjects() : [o]))
    .filter(o => o.fontFamily).map(o => loadFont(o.fontFamily, o.fontWeight)));
  const refreshText = () => { cv.getObjects().forEach(o => { if (o.initDimensions) { o.initDimensions(); o.setCoords(); } }); cv.requestRenderAll(); };

  /* ---------- Object factories ---------- */
  const BLUE = "#1f7aff", INK = "#0f0f0f";
  // Arabic and Hebrew letters only join when a line is drawn in one go, so right-to-left text gets no letter spacing
  const RTL = /[\u0590-\u08ff]/;
  const textbox = (str, o = {}) => {
    const t = new F.Textbox(str, Object.assign({
      fontFamily: "Inter", fontSize: 64, fontWeight: 700, fill: INK, width: 700, lineHeight: 1.1, charSpacing: -10,
      textAlign: "left", name: "Text", kind: "text"
    }, o));
    if (RTL.test(str)) t.set({ charSpacing: 0, direction: "rtl", textAlign: "right" });
    return t;
  };
  const STAR = n => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? 42 : 100, a = Math.PI / n * i - Math.PI / 2; return { x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a) }; });
  const POLY = n => Array.from({ length: n }, (_, i) => { const a = Math.PI * 2 / n * i - Math.PI / 2; return { x: 100 + 100 * Math.cos(a), y: 100 + 100 * Math.sin(a) }; });
  const SHAPES = {
    rect: ["Rectangle", () => new F.Rect({ width: 360, height: 360, fill: BLUE })],
    rounded: ["Rounded rectangle", () => new F.Rect({ width: 360, height: 360, rx: 48, ry: 48, fill: BLUE })],
    circle: ["Circle", () => new F.Circle({ radius: 180, fill: BLUE })],
    triangle: ["Triangle", () => new F.Triangle({ width: 380, height: 330, fill: BLUE })],
    star: ["Star", () => new F.Polygon(STAR(5), { fill: BLUE, scaleX: 1.8, scaleY: 1.8 })],
    hexagon: ["Hexagon", () => new F.Polygon(POLY(6), { fill: BLUE, scaleX: 1.8, scaleY: 1.8 })],
    arrow: ["Arrow", () => new F.Path("M0 70 H230 V20 L330 110 L230 200 V150 H0 Z", { fill: BLUE })],
    heart: ["Heart", () => new F.Path("M170 300 C 60 220 0 160 0 95 C 0 40 42 0 95 0 C 128 0 155 18 170 45 C 185 18 212 0 245 0 C 298 0 340 40 340 95 C 340 160 280 220 170 300 Z", { fill: BLUE })],
    blob: ["Blob", () => new F.Path("M205 18C268 30 330 80 338 150C346 222 300 300 225 325C150 350 62 322 26 255C-10 188 10 102 66 55C112 16 152 8 205 18Z", { fill: BLUE })],
    line: ["Line", () => new F.Line([0, 0, 420, 0], { stroke: INK, strokeWidth: 8, strokeLineCap: "round", fill: INK })]
  };
  const SHAPE_SVG = {
    rect: '<rect x="5" y="5" width="30" height="30"/>', rounded: '<rect x="5" y="5" width="30" height="30" rx="7"/>',
    circle: '<circle cx="20" cy="20" r="15"/>', triangle: '<path d="M20 5 36 34H4z"/>',
    star: '<path d="m20 4 4.4 10.2 11 .9-8.4 7.2 2.6 10.8L20 27.4l-9.6 5.7 2.6-10.8-8.4-7.2 11-.9z"/>',
    hexagon: '<path d="m20 4 14 8v16l-14 8-14-8V12z"/>', arrow: '<path d="M4 16h18V9l14 11-14 11v-7H4z"/>',
    heart: '<path d="M20 34C9 26 4 20 4 13.5 4 8.8 7.6 5 12.2 5c3.4 0 6 1.8 7.8 4.6C21.8 6.8 24.4 5 27.8 5 32.4 5 36 8.8 36 13.5 36 20 31 26 20 34z"/>',
    blob: '<path d="M24 5c7 1.4 12.6 6.5 13 14 .5 8-4.6 15.4-12 17.2C17.6 38 9 35.6 6 29 2.6 21.6 4.4 12.8 10 8.4 14.2 5 18.8 4 24 5z"/>',
    line: '<path d="M5 20h30" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"/>'
  };

  // Place a new object in the middle of the page, scaled for the page size
  function place(o, { scale = true, select = true } = {}) {
    const k = scale ? unit() : 1;
    if (k !== 1) {
      if (o.type === "textbox") o.set({ fontSize: o.fontSize * k, width: o.width * k });
      else o.set({ scaleX: (o.scaleX || 1) * k, scaleY: (o.scaleY || 1) * k });
    }
    o.set({ strokeUniform: o.kind !== "icon" });
    if (o.type === "textbox") o.initDimensions();
    o.set({ left: (W - o.getScaledWidth()) / 2, top: (H - o.getScaledHeight()) / 2 });
    cv.add(o);
    o.setCoords();
    if (select) cv.setActiveObject(o);
    cv.requestRenderAll();
    return o;
  }

  /* ---------- History, autosave ---------- */
  const store = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open("ds-canvas", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("d");
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const run = (mode, fn) => open().then(db => new Promise((res, rej) => {
      const tx = db.transaction("d", mode), req = fn(tx.objectStore("d"));
      tx.oncomplete = () => res(req && req.result); tx.onerror = () => rej(tx.error);
    }));
    return { get: k => run("readonly", s => s.get(k)), set: (k, v) => run("readwrite", s => s.put(v, k)) };
  })();
  const hist = { stack: [], i: -1, busy: 0 };
  const snapshot = () => JSON.stringify({ app: "draft-studio-canvas", v: 1, name: nameIn.value, W, H, brief: brief ? BRIEFS.indexOf(brief) : -1, canvas: cv.toJSON(PROPS) });
  let commitT = 0, saveT = 0;
  const changed = () => { if (hist.busy) return; clearTimeout(commitT); commitT = setTimeout(commit, 200); };
  function commit() {
    const s = snapshot();
    if (s === hist.stack[hist.i]) return;
    hist.stack = hist.stack.slice(0, hist.i + 1);
    hist.stack.push(s);
    if (hist.stack.length > 80) hist.stack.shift();
    hist.i = hist.stack.length - 1;
    syncUndo();
    renderLayers();
    clearTimeout(saveT);
    savedEl.textContent = "Saving…";
    saveT = setTimeout(() => store.set("current", s).then(() => { savedEl.textContent = "Saved on this device"; })
      .catch(() => { savedEl.textContent = "Not saved: download a project file"; }), 500);
  }
  const syncUndo = () => {
    $("[data-act=undo]", root).disabled = hist.i <= 0;
    $("[data-act=redo]", root).disabled = hist.i >= hist.stack.length - 1;
  };
  function restore(s, { keepHistory = true } = {}) {
    let d;
    try { d = typeof s === "string" ? JSON.parse(s) : s; } catch (e) { return Promise.reject(e); }
    if (!d || !d.canvas) return Promise.reject(new Error("not a design"));
    hist.busy++;
    nameIn.value = d.name || tr("Untitled design");
    brief = BRIEFS[d.brief] || null;
    setSize(d.W || 1080, d.H || 1080);
    return new Promise(res => {
      cv.loadFromJSON(d.canvas, () => {
        loadFontsOf(cv.getObjects()).then(refreshText);
        cv.renderAll();
        hist.busy--;
        if (!keepHistory) { hist.stack = [JSON.stringify(d)]; hist.i = 0; syncUndo(); }
        renderLayers(); renderProps(); renderBrief();
        res();
      });
    });
  }
  const undo = () => { if (hist.i > 0) { hist.i--; restore(hist.stack[hist.i]).then(() => { syncUndo(); store.set("current", hist.stack[hist.i]).catch(() => {}); }); } };
  const redo = () => { if (hist.i < hist.stack.length - 1) { hist.i++; restore(hist.stack[hist.i]).then(() => { syncUndo(); store.set("current", hist.stack[hist.i]).catch(() => {}); }); } };
  cv.on({ "object:added": changed, "object:removed": changed, "object:modified": changed });
  nameIn.addEventListener("change", changed);

  /* ---------- Smart guides: snap to the page and to other objects ---------- */
  let guides = [];
  cv.on("object:moving", e => {
    const o = e.target, th = 6 / zoom, b = o.getBoundingRect(true, true);
    const xs = [0, W / 2, W], ys = [0, H / 2, H];
    cv.getObjects().forEach(t => {
      if (t === o || !t.visible || (o.type === "activeSelection" && o.contains(t))) return;
      const r = t.getBoundingRect(true, true);
      xs.push(r.left, r.left + r.width / 2, r.left + r.width); ys.push(r.top, r.top + r.height / 2, r.top + r.height);
    });
    const near = (targets, mine) => {
      let best = null;
      targets.forEach(v => mine.forEach(m => { const d = v - m; if (Math.abs(d) < th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, v }; }));
      return best;
    };
    guides = [];
    const bx = near(xs, [b.left, b.left + b.width / 2, b.left + b.width]);
    const by = near(ys, [b.top, b.top + b.height / 2, b.top + b.height]);
    if (bx) { o.left += bx.d; guides.push({ x: bx.v }); }
    if (by) { o.top += by.d; guides.push({ y: by.v }); }
    o.setCoords();
  });
  cv.on("before:render", () => { if (cv.contextTop) cv.clearContext(cv.contextTop); });
  cv.on("after:render", () => {
    if (!guides.length || !cv.contextTop) return;
    const c = cv.contextTop;
    c.save();
    c.strokeStyle = "#ff4f3a"; c.lineWidth = 1;
    guides.forEach(g => {
      c.beginPath();
      if (g.x != null) { c.moveTo(g.x * zoom + .5, 0); c.lineTo(g.x * zoom + .5, H * zoom); }
      else { c.moveTo(0, g.y * zoom + .5); c.lineTo(W * zoom, g.y * zoom + .5); }
      c.stroke();
    });
    c.restore();
  });
  cv.on("mouse:up", () => { if (guides.length) { guides = []; cv.requestRenderAll(); } });

  // Bake scaling into real sizes, so text keeps a true font size and rectangles keep their corners
  cv.on("object:modified", e => {
    const o = e.target;
    if (!o) return;
    if (o.type === "textbox" && (o.scaleX !== 1 || o.scaleY !== 1)) {
      const k = o.scaleY;
      o.set({ fontSize: round(o.fontSize * k, 1), width: o.width * o.scaleX, scaleX: 1, scaleY: 1 });
      o.initDimensions(); o.setCoords();
    } else if (o.type === "rect" && (o.scaleX !== 1 || o.scaleY !== 1)) {
      o.set({ width: o.width * o.scaleX, height: o.height * o.scaleY, scaleX: 1, scaleY: 1 });
      o.setCoords();
    }
    renderProps();
  });

  /* ---------- Selection helpers ---------- */
  const active = () => cv.getActiveObjects();
  const parts = o => (o.type === "group" && o.kind === "icon" ? o.getObjects() : [o]);
  const reselect = list => {
    cv.discardActiveObject();
    if (list.length === 1) cv.setActiveObject(list[0]);
    else if (list.length > 1) cv.setActiveObject(new F.ActiveSelection(list, { canvas: cv }));
    cv.requestRenderAll();
  };
  const lockState = (o, on) => o.set({
    locked: on, hasControls: !on, lockMovementX: on, lockMovementY: on, lockScalingX: on, lockScalingY: on, lockRotation: on
  });
  const kindOf = o => (o.kind === "icon" ? "icon" : o.type === "textbox" ? "text" : o.type === "image" ? "image" : o.type === "group" ? "group" : "shape");

  function remove() {
    const list = active().filter(o => !o.locked);
    if (!list.length) return;
    cv.discardActiveObject();
    list.forEach(o => cv.remove(o));
    cv.requestRenderAll();
  }
  let clip = null;
  const copy = () => { const o = cv.getActiveObject(); if (o) o.clone(c => { clip = c; }, PROPS); };
  const paste = (offset = 24) => {
    if (!clip) return;
    clip.clone(c => {
      cv.discardActiveObject();
      c.set({ left: c.left + offset, top: c.top + offset, evented: true });
      if (c.type === "activeSelection") { c.canvas = cv; c.forEachObject(o => cv.add(o)); c.setCoords(); }
      else cv.add(c);
      clip.set({ left: clip.left + offset, top: clip.top + offset });
      cv.setActiveObject(c);
      cv.requestRenderAll();
    }, PROPS);
  };
  const duplicate = () => { const o = cv.getActiveObject(); if (!o) return; o.clone(c => { clip = c; paste(); }, PROPS); };
  function align(dir) {
    const list = active();
    if (!list.length) return;
    const multi = list.length > 1;
    cv.discardActiveObject();
    const boxes = list.map(o => o.getBoundingRect(true, true));
    const ref = multi ? boxes.reduce((a, b) => {
      const l = Math.min(a.left, b.left), t = Math.min(a.top, b.top);
      return { left: l, top: t, width: Math.max(a.left + a.width, b.left + b.width) - l, height: Math.max(a.top + a.height, b.top + b.height) - t };
    }) : { left: 0, top: 0, width: W, height: H };
    list.forEach((o, i) => {
      const b = boxes[i];
      const dx = { left: ref.left - b.left, center: ref.left + ref.width / 2 - (b.left + b.width / 2), right: ref.left + ref.width - (b.left + b.width) }[dir] || 0;
      const dy = { top: ref.top - b.top, middle: ref.top + ref.height / 2 - (b.top + b.height / 2), bottom: ref.top + ref.height - (b.top + b.height) }[dir] || 0;
      o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords();
    });
    reselect(list);
    changed();
  }
  const arrange = how => {
    const o = cv.getActiveObject();
    if (!o) return;
    ({ front: () => cv.bringToFront(o), back: () => cv.sendToBack(o), forward: () => cv.bringForward(o), backward: () => cv.sendBackwards(o) })[how]();
    cv.requestRenderAll(); changed();
  };
  const group = () => {
    const o = cv.getActiveObject();
    if (o && o.type === "activeSelection") { const g = o.toGroup(); g.set({ name: "Group" }); cv.requestRenderAll(); changed(); renderProps(); }
  };
  const ungroup = () => {
    const o = cv.getActiveObject();
    if (o && o.type === "group" && o.kind !== "icon") { o.toActiveSelection(); cv.requestRenderAll(); changed(); renderProps(); }
  };

  /* ---------- Colours on the page ---------- */
  const toHex = c => {
    if (!c || typeof c !== "string") return "#000000";
    try { const col = new F.Color(c); return "#" + col.toHex().toLowerCase(); } catch (e) { return "#000000"; }
  };
  const docColours = () => {
    const set = new Set();
    (brief ? pal(brief.palette) : []).forEach(c => set.add(c.toLowerCase()));
    cv.getObjects().forEach(o => parts(o).forEach(p => [p.fill, p.stroke].forEach(c => { if (typeof c === "string" && c && c !== "transparent") set.add(toHex(c)); })));
    if (typeof cv.backgroundColor === "string") set.add(toHex(cv.backgroundColor));
    [INK, "#ffffff", BLUE].forEach(c => set.add(c));
    return [...set].slice(0, 14);
  };

  /* ---------- Properties panel ---------- */
  const lbl = t => `<span class="cv-lbl">${t}</span>`;
  const num = (k, v, o = {}) => `<label class="cv-num"><span>${o.label || ""}</span><input type="number" inputmode="decimal" data-k="${k}" value="${round(v, o.d || 0)}" step="${o.step || 1}"${o.min != null ? ` min="${o.min}"` : ""}${o.max != null ? ` max="${o.max}"` : ""}></label>`;
  const colour = (k, v) => `
    <div class="cv-colour"><label class="cv-sw-in" style="--c:${toHex(v)}"><input type="color" data-k="${k}" value="${toHex(v)}" aria-label="Colour"></label>
    <input class="cv-hexin" data-hex="${k}" value="${toHex(v).toUpperCase()}" maxlength="7" spellcheck="false" aria-label="Hex"></div>
    <div class="cv-chips">${docColours().map(c => `<button type="button" style="--c:${c}" data-chip="${k}" data-v="${c}" aria-label="${c}"></button>`).join("")}</div>`;
  const range = (k, v, min, max, step = 1, suffix = "") => `<div class="cv-range"><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${v}"><output>${round(v, step < 1 ? 1 : 0)}${suffix}</output></div>`;
  const seg = (k, v, opts) => `<div class="cv-seg">${opts.map(([val, html, label]) => `<button type="button" data-set="${k}" data-v="${val}" class="${String(v) === String(val) ? "is-on" : ""}" aria-label="${label || val}"${label ? ` data-tip="${label}"` : ""}>${html}</button>`).join("")}</div>`;
  const section = (title, html) => `<section class="cv-sec">${title ? `<h3>${title}</h3>` : ""}${html}</section>`;

  function renderProps() {
    const list = active(), o = cv.getActiveObject();
    if (!list.length) {
      const preset = SIZES.findIndex(([, w, h]) => w === W && h === H);
      props.innerHTML = section("Page", `
        ${lbl("Size")}
        <select class="select cv-select" data-size-preset data-label="Page size">
          ${SIZES.map(([n, w, h], i) => `<option value="${i}"${i === preset ? " selected" : ""}>${n} · ${w} × ${h}</option>`).join("")}
          <option value="custom"${preset < 0 ? " selected" : ""}>Custom size</option>
        </select>
        <div class="cv-2">${num("pageW", W, { label: "W", min: 50, max: 6000 })}${num("pageH", H, { label: "H", min: 50, max: 6000 })}</div>
        ${lbl("Background")}${colour("bg", cv.backgroundColor)}`) +
        section("", `<p class="cv-hint">Pick a tool on the left to add text, shapes, images or icons. Drag images straight onto the page.</p>
          <p class="cv-keys"><kbd>⌘/Ctrl Z</kbd> Undo <kbd>⌘/Ctrl D</kbd> Duplicate <kbd>Delete</kbd> Remove <kbd>Arrows</kbd> Nudge</p>`);
      if (window.DSEnhanceSelects) window.DSEnhanceSelects(props);
      return;
    }
    const multi = list.length > 1 && o.type === "activeSelection";
    const k = multi ? "multi" : kindOf(o);
    const b = o.getBoundingRect(true, true);
    let html = "";
    if (k === "text") {
      const weights = FONTS[o.fontFamily] || [400, 700];
      html += section("Text", `
        <button type="button" class="cv-font" data-font-btn style="font-family:'${esc(o.fontFamily)}'">${esc(o.fontFamily)}${icon("chevron-right")}</button>
        <div class="cv-fontlist" data-fontlist hidden>${Object.keys(FONTS).map(f => `<button type="button" data-font="${esc(f)}" style="font-family:'${esc(f)}'" class="${f === o.fontFamily ? "is-on" : ""}">${esc(f)}</button>`).join("")}</div>
        <div class="cv-2">
          <select class="select cv-select" data-k="fontWeight" data-label="Weight">${weights.map(w => `<option value="${w}"${+o.fontWeight === w ? " selected" : ""}>${WEIGHT_NAMES[w]}</option>`).join("")}</select>
          ${num("fontSize", o.fontSize, { label: "Size", min: 4, max: 2000, d: 1 })}
        </div>
        ${seg("textAlign", o.textAlign, [["left", ui("t-left"), "Align left"], ["center", ui("t-center"), "Align centre"], ["right", ui("t-right"), "Align right"], ["justify", ui("t-justify"), "Justify"]])}
        <div class="cv-2">
          <div class="cv-seg"><button type="button" data-toggle="fontStyle" class="${o.fontStyle === "italic" ? "is-on" : ""}" aria-label="Italic" data-tip="Italic">${ui("italic")}</button><button type="button" data-toggle="underline" class="${o.underline ? "is-on" : ""}" aria-label="Underline" data-tip="Underline">${ui("underline")}</button></div>
          <button type="button" class="cv-btn is-soft" data-act="caps">Aa → AA</button>
        </div>
        ${lbl("Letter spacing")}${range("charSpacing", o.charSpacing, -200, 800, 5)}
        ${lbl("Line height")}${range("lineHeight", o.lineHeight, .6, 3, .05)}
        ${lbl("Colour")}${colour("fill", o.fill)}`);
    }
    if (k === "shape") {
      const isLine = o.type === "line";
      html += section(isLine ? "Line" : "Shape", `
        ${isLine ? "" : lbl("Fill") + colour("fill", o.fill)}
        ${lbl(isLine ? "Colour" : "Border")}${colour("stroke", o.stroke || (isLine ? INK : "#0f0f0f"))}
        ${lbl(isLine ? "Thickness" : "Border width")}${range("strokeWidth", o.strokeWidth || 0, 0, 80, 1, "px")}
        ${o.type === "rect" ? lbl("Corner radius") + range("rx", o.rx || 0, 0, Math.round(Math.min(o.width, o.height) / 2), 1, "px") : ""}`);
    }
    if (k === "icon") {
      const p = o.getObjects ? o.getObjects()[0] : o;
      html += section("Icon", `${lbl("Colour")}${colour("iconColour", p.stroke)}${lbl("Line width")}${range("iconWidth", p.strokeWidth || 1.75, .5, 4, .25)}`);
    }
    if (k === "image") {
      const f = o.filters || [];
      const val = (T, key, d) => { const x = f.find(t => t && t.type === T); return x ? x[key] : d; };
      html += section("Image", `
        ${lbl("Corner radius")}${range("imgRadius", o.kindRadius || 0, 0, 400, 2, "px")}
        ${lbl("Brightness")}${range("brightness", round(val("Brightness", "brightness", 0) * 100), -100, 100, 1)}
        ${lbl("Contrast")}${range("contrast", round(val("Contrast", "contrast", 0) * 100), -100, 100, 1)}
        ${lbl("Saturation")}${range("saturation", round(val("Saturation", "saturation", 0) * 100), -100, 100, 1)}
        <label class="cv-check"><input type="checkbox" data-k="grayscale"${f.some(t => t && t.type === "Grayscale") ? " checked" : ""}><span>Black and white</span></label>`);
    }
    if (k === "multi" || k === "group") {
      html += section(k === "group" ? "Group" : `${list.length} selected`, `
        ${lbl("Align to each other")}
        ${seg("align", "", [["left", ui("al-left"), "Left"], ["center", ui("al-center"), "Centre"], ["right", ui("al-right"), "Right"], ["top", ui("al-top"), "Top"], ["middle", ui("al-middle"), "Middle"], ["bottom", ui("al-bottom"), "Bottom"]])}
        ${k === "multi" ? `<button type="button" class="cv-btn is-soft is-wide" data-act="group">${ui("group")}<span>Group</span></button>` : `<button type="button" class="cv-btn is-soft is-wide" data-act="ungroup">${ui("ungroup")}<span>Ungroup</span></button>`}`);
    }
    html += section("Layout", `
      ${k !== "multi" ? `<div class="cv-2">${num("x", b.left, { label: "X" })}${num("y", b.top, { label: "Y" })}</div>
      <div class="cv-2">${num("w", o.getScaledWidth(), { label: "W", min: 1 })}${num("h", o.getScaledHeight(), { label: "H", min: 1 })}</div>
      <div class="cv-2">${num("angle", o.angle, { label: "↻", min: -360, max: 360 })}<span></span></div>` : ""}
      ${k !== "multi" && k !== "group" ? lbl("Align to page") + seg("pagealign", "", [["left", ui("al-left"), "Left"], ["center", ui("al-center"), "Centre"], ["right", ui("al-right"), "Right"], ["top", ui("al-top"), "Top"], ["middle", ui("al-middle"), "Middle"], ["bottom", ui("al-bottom"), "Bottom"]]) : ""}
      ${lbl("Opacity")}${range("opacity", round((o.opacity ?? 1) * 100), 0, 100, 1, "%")}
      ${k !== "multi" ? `<label class="cv-check"><input type="checkbox" data-k="shadow"${o.shadow ? " checked" : ""}><span>Shadow</span></label>` : ""}`);
    html += section("", `
      <div class="cv-row-btns">
        <button type="button" class="cv-ib" data-arr="front" aria-label="Bring to front" data-tip="Bring to front">${ui("front")}</button>
        <button type="button" class="cv-ib" data-arr="back" aria-label="Send to back" data-tip="Send to back">${ui("back")}</button>
        <button type="button" class="cv-ib" data-act="duplicate" aria-label="Duplicate" data-tip="Duplicate">${ui("copy")}</button>
        <button type="button" class="cv-ib" data-act="lock" aria-label="${o.locked ? "Unlock" : "Lock"}" data-tip="${o.locked ? "Unlock" : "Lock"}">${ui(o.locked ? "lock" : "unlock")}</button>
        <button type="button" class="cv-ib is-danger" data-act="delete" aria-label="Delete" data-tip="Delete">${ui("trash")}</button>
      </div>`);
    props.innerHTML = html;
    if (window.DSEnhanceSelects) window.DSEnhanceSelects(props);
  }
  // Live numbers while dragging, without rebuilding the panel
  const liveNumbers = () => {
    const o = cv.getActiveObject();
    if (!o) return;
    const b = o.getBoundingRect(true, true);
    const put = (k, v) => { const el = $(`[data-k="${k}"]`, props); if (el && document.activeElement !== el) el.value = round(v); };
    put("x", b.left); put("y", b.top); put("w", o.getScaledWidth()); put("h", o.getScaledHeight()); put("angle", o.angle);
  };
  cv.on({ "object:moving": liveNumbers, "object:scaling": liveNumbers, "object:rotating": liveNumbers });
  cv.on({ "selection:created": () => { renderProps(); renderLayers(); openSheet(); }, "selection:updated": () => { renderProps(); renderLayers(); }, "selection:cleared": () => { renderProps(); renderLayers(); } });

  // Apply a property change to the selection
  function apply(k, v, done = true) {
    const list = active();
    if (k === "bg") { cv.backgroundColor = v; cv.requestRenderAll(); if (done) changed(); return; }
    if (k === "pageW" || k === "pageH") { setSize(k === "pageW" ? +v : W, k === "pageH" ? +v : H); if (done) changed(); return; }
    if (k === "align") { align(v); return; }
    if (k === "pagealign") {
      const o = cv.getActiveObject(); if (!o) return;
      const b = o.getBoundingRect(true, true);
      const dx = { left: -b.left, center: (W - b.width) / 2 - b.left, right: W - b.width - b.left }[v] || 0;
      const dy = { top: -b.top, middle: (H - b.height) / 2 - b.top, bottom: H - b.height - b.top }[v] || 0;
      o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords(); cv.requestRenderAll(); changed(); return;
    }
    const target = cv.getActiveObject();
    list.forEach(o => {
      switch (k) {
        case "fill": case "stroke":
          if (o.kind === "icon") parts(o).forEach(p => p.set("stroke", v));
          else o.set(k, v);
          if (k === "stroke" && !o.strokeWidth && o.type !== "line") o.set("strokeWidth", 4);
          break;
        case "iconColour": parts(o).forEach(p => p.set("stroke", v)); break;
        case "iconWidth": parts(o).forEach(p => p.set("strokeWidth", +v)); break;
        case "strokeWidth": o.set("strokeWidth", +v); if (+v && !o.stroke) o.set("stroke", INK); break;
        case "rx": if (o.type === "rect") o.set({ rx: +v, ry: +v }); break;
        case "opacity": o.set("opacity", +v / 100); break;
        case "fontSize": case "charSpacing": case "lineHeight": o.set(k, +v); break;
        case "fontWeight": o.set("fontWeight", +v); loadFont(o.fontFamily, +v).then(() => { o.initDimensions(); cv.requestRenderAll(); }); break;
        case "textAlign": o.set("textAlign", v); break;
        case "fontStyle": o.set("fontStyle", o.fontStyle === "italic" ? "normal" : "italic"); break;
        case "underline": o.set("underline", !o.underline); break;
        case "shadow": o.set("shadow", v ? new F.Shadow({ color: "rgba(0,0,0,.28)", blur: 40 * unit(), offsetX: 0, offsetY: 16 * unit() }) : null); break;
        case "imgRadius": {
          const r = +v / (o.scaleX || 1);
          o.kindRadius = +v;
          o.set("clipPath", r ? new F.Rect({ width: o.width, height: o.height, rx: r, ry: r, originX: "center", originY: "center" }) : null);
          break;
        }
        case "brightness": case "contrast": case "saturation": case "grayscale": {
          const T = { brightness: "Brightness", contrast: "Contrast", saturation: "Saturation", grayscale: "Grayscale" }[k];
          o.filters = (o.filters || []).filter(f => f && f.type !== T);
          if (k === "grayscale") { if (v) o.filters.push(new F.Image.filters.Grayscale()); }
          else if (+v) o.filters.push(new F.Image.filters[T]({ [k]: +v / 100 }));
          o.applyFilters();
          break;
        }
        default: break;
      }
      if (o.type === "textbox") o.initDimensions();
      o.setCoords();
    });
    if (target && list.length === 1) {
      const o = target, b = o.getBoundingRect(true, true);
      if (k === "x") o.set("left", o.left + (+v - b.left));
      if (k === "y") o.set("top", o.top + (+v - b.top));
      if (k === "w" && +v > 0) { if (o.type === "textbox") { o.set("width", +v / o.scaleX); o.initDimensions(); } else o.set("scaleX", +v / o.width); }
      if (k === "h" && +v > 0 && o.type !== "textbox") o.set("scaleY", +v / o.height);
      if (k === "angle") o.rotate(+v);
      o.setCoords();
    }
    cv.requestRenderAll();
    if (done) changed();
  }
  props.addEventListener("input", e => {
    const el = e.target;
    if (el.matches("[data-hex]")) {
      if (/^#[0-9a-f]{6}$/i.test(el.value)) { apply(el.dataset.hex, el.value, false); const sw = el.previousElementSibling; if (sw) sw.style.setProperty("--c", el.value); }
      return;
    }
    if (!el.dataset.k) return;
    const v = el.type === "checkbox" ? el.checked : el.value;
    if (el.type === "range") { const out = el.nextElementSibling; if (out) out.textContent = round(+v, +el.step < 1 ? 1 : 0) + (out.textContent.match(/[%px]+$/) || [""])[0]; }
    if (el.type === "color") { const hexIn = el.closest(".cv-colour").querySelector("[data-hex]"); hexIn.value = el.value.toUpperCase(); el.parentElement.style.setProperty("--c", el.value); }
    if (el.type === "number" && el.value === "") return;
    apply(el.dataset.k, v, el.type === "checkbox");
  });
  props.addEventListener("change", e => {
    const el = e.target;
    if (el.matches("[data-size-preset]")) {
      if (el.value !== "custom") { const [, w, h] = SIZES[+el.value]; setSize(w, h); changed(); renderProps(); }
      return;
    }
    if (el.matches("[data-hex]")) { changed(); renderProps(); return; }
    if (el.dataset.k && el.type !== "checkbox") { apply(el.dataset.k, el.type === "number" ? +el.value : el.value); if (el.type === "color") renderProps(); }
  });
  props.addEventListener("click", e => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.chip) { apply(t.dataset.chip, t.dataset.v); renderProps(); return; }
    if (t.dataset.set) { apply(t.dataset.set, t.dataset.v); if (t.dataset.set === "textAlign") renderProps(); return; }
    if (t.dataset.toggle) { apply(t.dataset.toggle, true); t.classList.toggle("is-on"); return; }
    if (t.dataset.arr) { arrange(t.dataset.arr); return; }
    if (t.hasAttribute("data-font-btn")) { const l = $("[data-fontlist]", props); l.hidden = !l.hidden; return; }
    if (t.dataset.font) { setFont(t.dataset.font); return; }
    act(t.dataset.act);
  });
  async function setFont(family) {
    const list = active().filter(o => o.type === "textbox");
    const weights = FONTS[family] || [400];
    await Promise.all(list.map(o => {
      const w = weights.includes(+o.fontWeight) ? +o.fontWeight : weights.reduce((a, b) => (Math.abs(b - o.fontWeight) < Math.abs(a - o.fontWeight) ? b : a));
      o.set("fontWeight", w);
      return loadFont(family, w);
    }));
    list.forEach(o => { o.set("fontFamily", family); o.initDimensions(); o.setCoords(); });
    cv.requestRenderAll(); changed(); renderProps();
  }

  /* ---------- Drawer (left panels) ---------- */
  let tab = null;
  const TITLES = Object.fromEntries(rail.map(([k, , l]) => [k, l]));
  const panels = {
    brief: () => `<div data-brief-box></div>`,
    templates: () => `<p class="cv-hint">Start from a layout, then make it yours.</p><div class="cv-tpls">${TEMPLATES.map((t, i) => `<button type="button" class="cv-tpl" data-tpl="${i}"><img alt="" data-tpl-img="${i}" width="${t.w}" height="${t.h}"><span>${t.name}</span></button>`).join("")}</div>`,
    text: () => `
      <button type="button" class="cv-addtext h" data-text="heading">Add a heading</button>
      <button type="button" class="cv-addtext s" data-text="sub">Add a subheading</button>
      <button type="button" class="cv-addtext b" data-text="body">Add body text</button>
      <h4 class="cv-sub">Font pairs</h4>
      <div class="cv-pairs">${PAIRS.map(([a, aw, b2, bw], i) => `<button type="button" class="cv-pair" data-pair="${i}"><b style="font-family:'${a}';font-weight:${aw}">${a}</b><span style="font-family:'${b2}';font-weight:${bw}">with ${b2}</span></button>`).join("")}</div>`,
    shapes: () => `<div class="cv-grid">${Object.entries(SHAPES).map(([k, [n]]) => `<button type="button" class="cv-shape" data-shape="${k}" aria-label="${n}" data-tip="${n}"><svg viewBox="0 0 40 40" fill="currentColor">${SHAPE_SVG[k]}</svg></button>`).join("")}</div>`,
    images: () => `
      <button type="button" class="cv-btn is-blue is-wide" data-act="upload">${ui("upload")}<span>Upload images</span></button>
      <p class="cv-hint">Or drag images onto the page, or paste one. They stay on your device.</p>
      <div class="cv-uploads" data-uploads></div>`,
    icons: () => `<label class="cv-search">${icon("search")}<input type="search" data-icon-q placeholder="Search icons" aria-label="Search icons"></label>
      <div class="cv-icons" data-icons>${Object.keys(window.DS_ICONS || {}).map(n => `<button type="button" data-icon="${n}" aria-label="${n}" title="${n}">${icon(n)}</button>`).join("")}</div>`,
    colours: () => `<p class="cv-hint">Tap a colour to use it on what you've selected, or on the page.</p>
      <div class="cv-pals">${(DS.palettes || []).map(p => `<div class="cv-pal"><span>${esc(p.name)}</span><div>${p.colors.map(c => `<button type="button" style="--c:${c}" data-paint="${c}" aria-label="${c}"></button>`).join("")}</div></div>`).join("")}</div>`,
    layers: () => `<ul class="cv-layers" data-layers></ul>`
  };
  function openTab(k) {
    if (tab === k && !drawer.hidden) { closeDrawer(); return; }
    tab = k;
    $$(".cv-tab", root).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tab === k)));
    $("[data-drawer-title]", root).textContent = TITLES[k];
    $("[data-drawer-body]", root).innerHTML = panels[k]();
    drawer.hidden = false;
    root.classList.add("has-drawer");
    if (k === "brief") renderBrief();
    if (k === "templates") thumbs();
    if (k === "layers") renderLayers();
    if (k === "images") renderUploads();
    if (k === "text") Promise.all(PAIRS.flatMap(([a, aw, b2, bw]) => [loadFont(a, aw), loadFont(b2, bw)])).catch(() => {});
  }
  function closeDrawer() {
    drawer.hidden = true; tab = null; root.classList.remove("has-drawer");
    $$(".cv-tab", root).forEach(b => b.setAttribute("aria-pressed", "false"));
  }
  $(".cv-rail", root).addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) openTab(b.dataset.tab); });

  drawer.addEventListener("click", async e => {
    const t = e.target.closest("button");
    if (!t) return;
    const s = unit();
    if (t.dataset.text) {
      const T = {
        heading: [tr("Add a heading"), { fontSize: 110, fontWeight: 700, charSpacing: -20, width: 860, name: "Heading" }],
        sub: [tr("Add a subheading"), { fontSize: 56, fontWeight: 600, charSpacing: -10, width: 760, name: "Subheading" }],
        body: [tr("Add a little bit of body text. Keep lines short so they're easy to read."), { fontSize: 32, fontWeight: 400, charSpacing: 0, lineHeight: 1.45, width: 640, name: "Body text" }]
      }[t.dataset.text];
      place(textbox(T[0], T[1]));
      closeOnPhone();
    } else if (t.dataset.pair) {
      const [a, aw, b2, bw] = PAIRS[+t.dataset.pair];
      await Promise.all([loadFont(a, aw), loadFont(b2, bw)]);
      const head = textbox(tr("Big ideas start here"), { fontFamily: a, fontWeight: aw, fontSize: 104, width: 820, lineHeight: 1, charSpacing: a === "Bebas Neue" ? 20 : -20, name: "Heading" });
      const body = textbox(tr("A short line of supporting text that explains the idea."), { fontFamily: b2, fontWeight: bw, fontSize: 34, width: 820, lineHeight: 1.4, charSpacing: 0, name: "Body text" });
      place(head, { select: false });
      place(body, { select: false });
      const gap = 28 * s;
      const total = head.getScaledHeight() + gap + body.getScaledHeight();
      head.set({ top: (H - total) / 2 }); body.set({ top: head.top + head.getScaledHeight() + gap, left: head.left });
      head.setCoords(); body.setCoords();
      reselect([head, body]);
      closeOnPhone();
    } else if (t.dataset.shape) {
      const [n, make] = SHAPES[t.dataset.shape];
      const o = make(); o.set({ name: n, kind: "shape" });
      place(o);
      closeOnPhone();
    } else if (t.dataset.icon) {
      addIcon(t.dataset.icon);
      closeOnPhone();
    } else if (t.dataset.paint) {
      const list = active();
      if (list.length) { apply(list.some(o => o.type === "line") ? "stroke" : "fill", t.dataset.paint); }
      else apply("bg", t.dataset.paint);
      renderProps();
    } else if (t.dataset.tpl) {
      useTemplate(+t.dataset.tpl);
    } else if (t.dataset.up) {
      addImage(uploads[+t.dataset.up]);
      closeOnPhone();
    } else if (t.dataset.briefShuffle != null) {
      briefPick = (briefPick + 1 + Math.floor(Math.random() * (BRIEFS.length - 1))) % BRIEFS.length;
      renderBrief();
    } else if (t.dataset.briefStart != null) {
      startBrief(BRIEFS[briefPick]);
    } else act(t.dataset.act);
  });
  drawer.addEventListener("input", e => {
    if (!e.target.matches("[data-icon-q]")) return;
    const q = e.target.value.trim().toLowerCase();
    $$("[data-icon]", drawer).forEach(b => { b.hidden = q && !b.dataset.icon.includes(q); });
  });
  const closeOnPhone = () => { if (innerWidth < 900) closeDrawer(); };

  function addIcon(name) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${window.DS_ICONS[name]}</svg>`;
    F.loadSVGFromString(svg, (objs, opts) => {
      const g = F.util.groupSVGElements(objs, opts);
      g.set({ name: name.replace(/-/g, " ").replace(/^./, c => c.toUpperCase()), kind: "icon" });
      g.scaleToWidth(260 * unit());
      place(g, { scale: false });
    });
  }

  /* ---------- Images ---------- */
  const uploads = [];
  const MAX = 2400;
  const readImage = file => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
        if (k === 1 && file.size < 1.5e6) { res(r.result); return; }
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(/png|gif|webp/.test(file.type) ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", .9));
      };
      img.onerror = rej;
      img.src = r.result;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const addImage = url => F.Image.fromURL(url, img => {
    if (!img || !img.width) return;
    const k = Math.min(W * .7 / img.width, H * .7 / img.height, 1);
    img.set({ scaleX: k, scaleY: k, name: "Image", kind: "image" });
    place(img, { scale: false });
  });
  async function addFiles(files) {
    const list = [...files].filter(f => /^image\//.test(f.type));
    for (const f of list) {
      try {
        const url = await readImage(f);
        uploads.unshift(url);
        addImage(url);
      } catch (e) { /* not an image we can read */ }
    }
    renderUploads();
  }
  const renderUploads = () => {
    const box = $("[data-uploads]", root);
    if (box) box.innerHTML = uploads.map((u, i) => `<button type="button" data-up="${i}" aria-label="Add this image again"><img src="${u}" alt=""></button>`).join("");
  };
  const fileImg = $("[data-file-img]", root), fileJson = $("[data-file-json]", root);
  fileImg.addEventListener("change", () => { addFiles(fileImg.files); fileImg.value = ""; });
  let dragDepth = 0;
  stage.addEventListener("dragenter", e => { if ([...(e.dataTransfer.types || [])].includes("Files")) { dragDepth++; root.classList.add("is-dropping"); } });
  stage.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; root.classList.remove("is-dropping"); } });
  stage.addEventListener("dragover", e => e.preventDefault());
  stage.addEventListener("drop", e => { e.preventDefault(); dragDepth = 0; root.classList.remove("is-dropping"); addFiles(e.dataTransfer.files); });
  document.addEventListener("paste", e => {
    if (e.target.closest && e.target.closest("input, textarea, [contenteditable]")) return;
    const o = cv.getActiveObject();
    if (o && o.isEditing) return;
    const files = [...(e.clipboardData && e.clipboardData.files || [])];
    if (files.length) { e.preventDefault(); addFiles(files); }
    else if (clip) { e.preventDefault(); paste(); }
  });

  /* ---------- Layers ---------- */
  const KIND_ICON = { text: "type", image: "image", icon: "smile", group: "layers", shape: "shapes" };
  function renderLayers() {
    const ul = $("[data-layers]", root);
    if (!ul) return;
    const objs = cv.getObjects(), sel = active();
    if (!objs.length) { ul.innerHTML = `<li class="cv-empty">Nothing on the page yet.</li>`; return; }
    ul.innerHTML = objs.map((o, i) => [o, i]).reverse().map(([o, i]) => `
      <li draggable="true" data-ly="${i}" class="${sel.includes(o) ? "is-on" : ""}${o.visible === false ? " is-hidden" : ""}">
        <span class="cv-ly-ic">${ui(KIND_ICON[kindOf(o)])}</span>
        <span class="cv-ly-name"${o.type === "textbox" ? " data-no-i18n" : ""}>${esc(o.kind === "text" || o.type === "textbox" ? (o.text || "").slice(0, 28) || o.name : o.name || o.type)}</span>
        <button type="button" data-ly-eye aria-label="${o.visible === false ? "Show" : "Hide"}">${ui(o.visible === false ? "eye-off" : "eye")}</button>
        <button type="button" data-ly-lock aria-label="${o.locked ? "Unlock" : "Lock"}" class="${o.locked ? "is-on" : ""}">${ui(o.locked ? "lock" : "unlock")}</button>
      </li>`).join("");
  }
  drawer.addEventListener("click", e => {
    const li = e.target.closest("[data-ly]");
    if (!li) return;
    const o = cv.getObjects()[+li.dataset.ly];
    if (!o) return;
    if (e.target.closest("[data-ly-eye]")) { o.set("visible", o.visible === false); if (!o.visible) cv.discardActiveObject(); cv.requestRenderAll(); changed(); renderLayers(); return; }
    if (e.target.closest("[data-ly-lock]")) { lockState(o, !o.locked); cv.requestRenderAll(); changed(); renderLayers(); renderProps(); return; }
    if (o.visible !== false) { cv.setActiveObject(o); cv.requestRenderAll(); }
  });
  let dragLy = null;
  drawer.addEventListener("dragstart", e => { const li = e.target.closest("[data-ly]"); if (li) { dragLy = +li.dataset.ly; e.dataTransfer.effectAllowed = "move"; } });
  drawer.addEventListener("dragover", e => { if (dragLy != null && e.target.closest("[data-ly]")) e.preventDefault(); });
  drawer.addEventListener("drop", e => {
    const li = e.target.closest("[data-ly]");
    if (dragLy == null || !li) return;
    e.preventDefault();
    const o = cv.getObjects()[dragLy];
    cv.moveTo(o, +li.dataset.ly);
    dragLy = null;
    cv.requestRenderAll(); changed(); renderLayers();
  });

  /* ---------- Templates ---------- */
  const T = (str, o) => textbox(str, Object.assign({ charSpacing: 0 }, o));
  const TEMPLATES = [
    { name: "Bold poster", w: 1080, h: 1350, bg: "#0f0f0f", make: () => [
      new F.Circle({ radius: 300, fill: BLUE, left: 430, top: 80, name: "Circle", kind: "shape" }),
      T("2026", { fontSize: 34, fontWeight: 600, fill: "#ffffff", left: 80, top: 80, width: 300, name: "Year" }),
      T("MAKE IT BOLD.", { fontFamily: "Archivo Black", fontWeight: 400, fontSize: 168, lineHeight: .92, charSpacing: -30, fill: "#ffffff", left: 76, top: 720, width: 940, name: "Headline" }),
      T("A poster template from Draft Studio. Change every word.", { fontSize: 32, fontWeight: 400, fill: "#bdbdbd", left: 80, top: 1170, width: 700, lineHeight: 1.35, name: "Caption" })] },
    { name: "Quote post", w: 1080, h: 1080, bg: "#f4f1de", make: () => [
      T("“", { fontFamily: "Playfair Display", fontWeight: 700, fontSize: 320, fill: "#e07a5f", left: 84, top: 40, width: 300, lineHeight: 1, name: "Quote mark" }),
      T("Design is thinking made visual.", { fontFamily: "Playfair Display", fontWeight: 600, fontSize: 96, lineHeight: 1.05, charSpacing: -10, fill: "#3d405b", left: 90, top: 330, width: 880, name: "Quote" }),
      new F.Rect({ width: 90, height: 8, fill: "#e07a5f", left: 92, top: 800, name: "Line", kind: "shape" }),
      T("Saul Bass", { fontSize: 34, fontWeight: 600, fill: "#3d405b", left: 90, top: 840, width: 500, name: "Author" })] },
    { name: "Event flyer", w: 1080, h: 1350, bg: "#ffd23f", make: () => [
      new F.Circle({ radius: 150, fill: "#ee4266", left: 740, top: 110, name: "Circle", kind: "shape" }),
      T("JAZZ\nNIGHT", { fontFamily: "Bebas Neue", fontWeight: 400, fontSize: 330, lineHeight: .82, charSpacing: 10, fill: "#540d6e", left: 70, top: 110, width: 900, name: "Headline" }),
      new F.Rect({ width: 1080, height: 560, fill: "#540d6e", left: 0, top: 790, name: "Panel", kind: "shape" }),
      T("Thursday · 8 PM\nThe Blue Room", { fontSize: 52, fontWeight: 700, lineHeight: 1.25, charSpacing: -10, fill: "#ffd23f", left: 70, top: 880, width: 900, name: "Details" }),
      T("FREE ENTRY", { fontSize: 30, fontWeight: 700, charSpacing: 300, fill: "#ffd23f", left: 70, top: 1210, width: 600, name: "Note" })] },
    { name: "Business card", w: 1050, h: 600, bg: "#ffffff", make: () => [
      new F.Rect({ width: 380, height: 600, fill: INK, left: 0, top: 0, name: "Side", kind: "shape" }),
      T("AM", { fontFamily: "Syne", fontWeight: 800, fontSize: 130, charSpacing: -40, fill: "#ffffff", left: 70, top: 222, width: 260, name: "Monogram" }),
      T("Alex Morgan", { fontSize: 56, fontWeight: 700, charSpacing: -20, fill: INK, left: 440, top: 160, width: 560, name: "Name" }),
      T("Brand designer", { fontSize: 30, fontWeight: 400, fill: "#666666", left: 440, top: 232, width: 560, name: "Role" }),
      new F.Rect({ width: 60, height: 6, fill: BLUE, left: 442, top: 316, name: "Line", kind: "shape" }),
      T("hello@alexmorgan.design\n+27 82 000 0000", { fontSize: 27, fontWeight: 400, lineHeight: 1.6, fill: INK, left: 440, top: 360, width: 560, name: "Contact" })] },
    { name: "YouTube thumbnail", w: 1280, h: 720, bg: BLUE, make: () => [
      new F.Circle({ radius: 240, fill: "#ffffff", left: 760, top: 120, name: "Circle", kind: "shape" }),
      T("Aa", { fontFamily: "Playfair Display", fontWeight: 700, fontSize: 240, fill: BLUE, left: 838, top: 210, width: 400, lineHeight: 1, name: "Letters" }),
      T("5 DESIGN\nTIPS", { fontFamily: "Archivo Black", fontWeight: 400, fontSize: 124, lineHeight: .95, charSpacing: -20, fill: "#ffffff", left: 70, top: 150, width: 900, name: "Headline" }),
      new F.Rect({ width: 390, height: 96, rx: 48, ry: 48, fill: "#ffd23f", left: 70, top: 500, name: "Tag", kind: "shape" }),
      T("for beginners", { fontSize: 44, fontWeight: 700, charSpacing: -10, fill: INK, left: 70, top: 521, width: 390, textAlign: "center", name: "Tag text" })] },
    { name: "Story", w: 1080, h: 1920, bg: "#ee4266", make: () => [
      new F.Rect({ width: 1080, height: 1920, left: 0, top: 0, name: "Background", kind: "shape",
        fill: new F.Gradient({ type: "linear", coords: { x1: 0, y1: 0, x2: 1080, y2: 1920 }, colorStops: [{ offset: 0, color: "#ff6b35" }, { offset: 1, color: "#ee4266" }] }) }),
      T("NEW\nDROP", { fontFamily: "Bebas Neue", fontWeight: 400, fontSize: 400, lineHeight: .82, charSpacing: 10, fill: "#ffffff", left: 80, top: 220, width: 920, name: "Headline" }),
      new F.Rect({ width: 920, height: 760, rx: 44, ry: 44, fill: "rgba(255,255,255,0.18)", left: 80, top: 940, name: "Card", kind: "shape" }),
      T("Limited edition", { fontSize: 46, fontWeight: 600, fill: "#ffffff", left: 140, top: 1000, width: 700, name: "Card title" }),
      T("Swipe up to shop", { fontSize: 44, fontWeight: 700, fill: "#ffffff", left: 80, top: 1770, width: 920, textAlign: "center", name: "Call to action" })] }
  ];
  const tplFonts = t => Promise.all(t.make().filter(o => o.fontFamily).map(o => loadFont(o.fontFamily, o.fontWeight)));
  const thumbCache = {};
  async function thumbs() {
    for (let i = 0; i < TEMPLATES.length; i++) {
      const img = $(`[data-tpl-img="${i}"]`, root);
      if (!img) continue;
      if (!thumbCache[i]) {
        const t = TEMPLATES[i];
        await tplFonts(t);
        const sc = new F.StaticCanvas(null, { width: t.w, height: t.h, backgroundColor: t.bg, enableRetinaScaling: false });
        t.make().forEach(o => sc.add(o));
        sc.renderAll();
        thumbCache[i] = sc.toDataURL({ format: "jpeg", quality: .85, multiplier: 360 / Math.max(t.w, t.h) });
        sc.dispose();
      }
      const el = $(`[data-tpl-img="${i}"]`, root);
      if (el) el.src = thumbCache[i];
    }
  }
  const isEmpty = () => !cv.getObjects().length;
  async function useTemplate(i) {
    if (!isEmpty() && !confirm(tr("Replace your design with this template? You can undo it."))) return;
    const t = TEMPLATES[i];
    await tplFonts(t);
    hist.busy++;
    cv.clear();
    setSize(t.w, t.h);
    cv.backgroundColor = t.bg;
    t.make().forEach(o => { o.set({ strokeUniform: true }); cv.add(o); });
    refreshText();
    hist.busy--;
    changed(); renderProps();
    closeOnPhone();
  }

  /* ---------- Practice briefs ---------- */
  let briefPick = Math.floor(Math.random() * BRIEFS.length);
  function renderBrief() {
    const box = $("[data-brief-box]", root);
    if (!box) return;
    const b = BRIEFS[briefPick], [sn, sw, sh] = SIZES[b.size], on = brief === b;
    box.innerHTML = `
      <p class="cv-hint">Practise like a real designer: take a brief, design it, then download it for your portfolio.</p>
      <article class="cv-brief${on ? " is-on" : ""}">
        <span class="cv-brief-client">${esc(b.client)}</span>
        <h4>${esc(b.title)}</h4>
        <p>${esc(b.task)}</p>
        <dl><dt>Format</dt><dd>${sn} · ${sw} × ${sh}</dd><dt>Palette</dt><dd><span class="cv-brief-pal">${pal(b.palette).map(c => `<i style="--c:${c}"></i>`).join("")}</span></dd></dl>
        <p class="cv-brief-tip">${icon("lightbulb")}<span>${esc(b.tip)}</span></p>
      </article>
      <div class="cv-2">
        <button type="button" class="cv-btn is-blue" data-brief-start>${on ? "Restart brief" : "Start this brief"}</button>
        <button type="button" class="cv-btn" data-brief-shuffle>${ui("shuffle")}<span>Another</span></button>
      </div>
      ${brief && !on ? `<p class="cv-hint">Working on: <b>${esc(brief.title)}</b></p>` : ""}`;
  }
  function startBrief(b) {
    if (!isEmpty() && !confirm(tr("Start a new design for this brief? Your current design will be replaced. You can undo it."))) return;
    const [, w, h] = SIZES[b.size], colours = pal(b.palette);
    hist.busy++;
    cv.clear();
    brief = b;
    nameIn.value = b.title;
    setSize(w, h);
    cv.backgroundColor = colours[colours.length - 1];
    hist.busy--;
    changed(); renderBrief(); renderProps();
    closeOnPhone();
  }

  /* ---------- Export, files ---------- */
  const slug = s => (s || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design";
  const saveBlob = (blob, file) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = file;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const exp = { fmt: "png", scale: 1 };
  async function download() {
    cv.discardActiveObject(); guides = [];
    await loadFontsOf(cv.getObjects());
    const name = slug(nameIn.value);
    if (exp.fmt === "svg") {
      const svg = cv.toSVG({ width: W, height: H, viewBox: { x: 0, y: 0, width: W, height: H } });
      const fonts = [...new Set(cv.getObjects().flatMap(o => parts(o)).map(o => o.fontFamily).filter(f => f && f !== "Georgia"))];
      const css = fonts.length ? `<style>@import url("https://fonts.googleapis.com/css2?${fonts.map(f => "family=" + f.replace(/ /g, "+") + ":wght@400;500;600;700;800").join("&")}&display=swap");</style>` : "";
      saveBlob(new Blob([svg.replace(/(<svg[^>]*>)/, `$1${css}`)], { type: "image/svg+xml" }), name + ".svg");
    } else {
      const bg = cv.backgroundColor, transp = exp.fmt === "png" && $("[data-transp] input", root).checked;
      if (transp) cv.backgroundColor = null;
      if (exp.fmt === "jpg" && !bg) cv.backgroundColor = "#ffffff";
      cv.renderAll();
      const url = cv.toDataURL({ format: exp.fmt === "jpg" ? "jpeg" : "png", quality: .92, multiplier: exp.scale / zoom });
      cv.backgroundColor = bg; cv.renderAll();
      const blob = await (await fetch(url)).blob();
      saveBlob(blob, `${name}.${exp.fmt}`);
    }
    toggleExport(false);
    toast("Downloaded");
  }
  const toast = msg => {
    let t = $(".cv-toast", root);
    if (!t) { t = document.createElement("div"); t.className = "cv-toast"; t.setAttribute("role", "status"); $(".cv-body", root).appendChild(t); }
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("is-on"), 2200);
  };
  const exportBox = $("[data-export]", root), exportBtn = $("[data-act=export]", root);
  const toggleExport = on => { exportBox.hidden = !on; exportBtn.setAttribute("aria-expanded", String(on)); };
  exportBox.addEventListener("click", e => {
    const b = e.target.closest("[data-v]");
    if (!b) return;
    const group = b.closest("[data-fmt], [data-scale]");
    $$("button", group).forEach(x => x.classList.toggle("is-on", x === b));
    if (group.matches("[data-fmt]")) { exp.fmt = b.dataset.v; $("[data-transp]", root).hidden = exp.fmt !== "png"; $("[data-scale]", root).classList.toggle("is-off", exp.fmt === "svg"); }
    else exp.scale = +b.dataset.v;
  });
  document.addEventListener("click", e => { if (!exportBox.hidden && !e.target.closest(".cv-pop-wrap")) toggleExport(false); });
  fileJson.addEventListener("change", () => {
    const f = fileJson.files[0];
    fileJson.value = "";
    if (!f) return;
    f.text().then(s => restore(s).then(() => { changed(); toast("Project opened"); })).catch(() => toast("That file isn't a Draft Studio design."));
  });

  /* ---------- Actions and keys ---------- */
  function act(a) {
    switch (a) {
      case "undo": undo(); break;
      case "redo": redo(); break;
      case "zoom-in": fitting = false; setZoom(zoom * 1.2); break;
      case "zoom-out": fitting = false; setZoom(zoom / 1.2); break;
      case "fit": fit(); break;
      case "export": toggleExport(exportBox.hidden); break;
      case "download": download(); break;
      case "save-file": saveBlob(new Blob([snapshot()], { type: "application/json" }), slug(nameIn.value) + ".design.json"); toggleExport(false); break;
      case "open-file": fileJson.click(); toggleExport(false); break;
      case "new":
        if (isEmpty() || confirm(tr("Start a new design? You can undo it."))) {
          hist.busy++; cv.clear(); cv.backgroundColor = "#ffffff"; brief = null; nameIn.value = tr("Untitled design"); hist.busy--;
          changed(); renderProps(); renderBrief();
        }
        break;
      case "upload": fileImg.click(); break;
      case "close-drawer": closeDrawer(); break;
      case "delete": remove(); break;
      case "duplicate": duplicate(); break;
      case "group": group(); break;
      case "ungroup": ungroup(); break;
      case "caps": active().forEach(o => { if (o.type === "textbox") { const up = o.text === o.text.toUpperCase(); o.set("text", up ? o.text.toLowerCase().replace(/(^|[.!?]\s+|\n)([a-z])/g, (m, p, c) => p + c.toUpperCase()) : o.text.toUpperCase()); o.initDimensions(); } }); cv.requestRenderAll(); changed(); break;
      case "lock": { const o = cv.getActiveObject(); if (o) { lockState(o, !o.locked); cv.requestRenderAll(); changed(); renderProps(); renderLayers(); } break; }
      default: break;
    }
  }
  $(".cv-top", root).addEventListener("click", e => { const b = e.target.closest("[data-act]"); if (b) act(b.dataset.act); });
  document.addEventListener("keydown", e => {
    const t = e.target;
    if (t.closest && t.closest("input, textarea, select, [contenteditable]")) return;
    const o = cv.getActiveObject();
    if (o && o.isEditing) return;
    const mod = e.metaKey || e.ctrlKey, key = e.key.toLowerCase();
    if (mod && key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && key === "y") { e.preventDefault(); redo(); }
    else if (mod && key === "d") { e.preventDefault(); duplicate(); }
    else if (mod && key === "c") { if (o) { e.preventDefault(); copy(); } }
    else if (mod && key === "a") { e.preventDefault(); reselect(cv.getObjects().filter(x => x.visible !== false && !x.locked)); }
    else if (mod && key === "g") { e.preventDefault(); e.shiftKey ? ungroup() : group(); }
    else if (mod && key === "s") { e.preventDefault(); commit(); toast("Saved on this device"); }
    else if ((key === "delete" || key === "backspace") && o) { e.preventDefault(); remove(); }
    else if (key === "escape") { cv.discardActiveObject(); cv.requestRenderAll(); toggleExport(false); }
    else if (key.startsWith("arrow") && o && !o.locked) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 1;
      o.set({ left: o.left + (key === "arrowleft" ? -d : key === "arrowright" ? d : 0), top: o.top + (key === "arrowup" ? -d : key === "arrowdown" ? d : 0) });
      o.setCoords(); cv.requestRenderAll(); liveNumbers(); changed();
    }
  });

  /* ---------- Phones: panels slide up from the bottom ---------- */
  const openSheet = () => { if (innerWidth < 900) root.classList.add("has-props"); };
  cv.on("selection:cleared", () => root.classList.remove("has-props"));

  /* ---------- Start: reopen the last design, or begin with a brief ---------- */
  setSize(W, H);
  store.get("current").then(s => (s ? restore(s, { keepHistory: false }) : Promise.reject()))
    .then(() => { savedEl.textContent = "Saved on this device"; })
    .catch(() => {
      setSize(1080, 1350);
      hist.stack = [snapshot()]; hist.i = 0; syncUndo();
      renderProps();
      if (tab !== "brief" && innerWidth >= 900) openTab("brief");
    });
  renderProps();
  syncUndo();
  if (innerWidth >= 900) openTab("brief");
  const qBrief = new URLSearchParams(location.search).get("brief");
  if (qBrief != null && BRIEFS[+qBrief]) { briefPick = +qBrief; renderBrief(); }
};
