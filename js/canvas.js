/* =====================================================================
   CANVAS — Draft Studio's free design studio (canvas.html)
   A desktop-style workspace: a menu bar, a control bar for the selection,
   a tool column, docked Layers/Assets and Properties panels, a status bar
   with zoom, artboard and cursor position, a ⌘K command palette and a
   minimap. Vector paths with editable anchors, shape combining
   (paper.js, loaded on demand), clipping masks, recolouring, repeat
   grids, QR codes, blend modes, history and full-screen preview.
   Built on Fabric.js 5 (js/vendor/fabric.min.js, MIT licence).
   Everything stays in the browser: designs autosave to this device
   (IndexedDB) and export as PNG, JPG, SVG or a project file.
   site.js calls window.DSCanvas(kit) on the Canvas page.
   ===================================================================== */
window.DSCanvas = function (kit) {
  const { $, $$, esc, icon, libIcon, DS } = kit;
  const root = $("[data-canvas]");
  if (!root || !window.fabric) return;
  const F = window.fabric;
  // Fabric 5 brings back a text's path for Text but not IText, so text on a path would not reopen
  if (!F.IText.__withPath) {
    const base = F.IText.fromObject;
    F.IText.fromObject = (obj, cb) => {
      const path = obj.path;
      if (!path) return base(obj, cb);
      return base(Object.assign({}, obj, { path: null }), t => F.Path.fromObject(path, p => { t.set("path", p); cb(t); }));
    };
    F.IText.__withPath = true;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k; };
  // Text that isn't in the page (dialogs, default words on the canvas) in the visitor's language
  const tr = s => (window.DS_I18N && window.DS_I18N.strings && window.DS_I18N.strings[s]) || s;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const keyLabel = k => (k || "").replace("mod+", mac ? "⌘" : "Ctrl+").replace("shift+", mac ? "⇧" : "Shift+").replace("alt+", mac ? "⌥" : "Alt+");
  const isTyping = t => t && t.closest && t.closest("input, textarea, select, [contenteditable]");
  const loadScript = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });

  /* =====================================================================
     Icons
     ===================================================================== */
  // Custom glyphs Phosphor has no match for; everything else comes from js/ui-icons.js
  const UI = {
    none: '<path d="M5 19 19 5" stroke="#ff453a" stroke-width="2.2"/>',
    guides: '<path d="M8 3v18M3 15h18" stroke-dasharray="3 2"/>',
    "add-anchor": '<path d="M3 20C6 13 11 10 18 10"/><rect x="7.5" y="11.5" width="4" height="4" fill="currentColor" stroke="none"/><path d="M18 2.5v5M15.5 5h5"/>',
    "del-anchor": '<path d="M3 20C6 13 11 10 18 10"/><rect x="7.5" y="11.5" width="4" height="4" fill="currentColor" stroke="none"/><path d="M15.5 5h5"/>',
    anchor: '<path d="M3 20C6 13 11 10 18 10"/><rect x="7.5" y="11.5" width="4" height="4" fill="currentColor" stroke="none"/><path d="m15 6.5 3-3 3 3"/>',
    arc: '<path d="M4 20C4 11 11 4 20 4"/><rect x="2.5" y="18.5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="18.5" y="2.5" width="3" height="3" fill="currentColor" stroke="none"/>',
    pgrid: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3v18M3 12h18"/>',
    typepath: '<path d="M3 20C7 13 17 13 21 20"/><path d="M8 3.5h8M12 3.5v8"/>'
  };
  const PH = window.DS_UI_ICONS || {};
  const ui = (id, cls = "") => (window.DS_MAT_SVG && window.DS_MAT_SVG(id, cls)) || (PH[id]
    ? `<svg class="${cls}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${PH[id]}</svg>`
    : UI[id]
      ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI[id]}</svg>`
      : icon(id, cls));
  // The Draft Studio mark: ink in the interface text colour, one petal in the site blue
  const MARK_SVG = `<svg class="cx-mark" viewBox="174 174 652 652" aria-hidden="true"><path d="M490.41,820.79h0c-171.87,0-311.2-139.33-311.2-311.2h0q311.2,0,311.2,311.2Z" fill="currentColor"/><path d="M490.41,179.21h0c-171.87,0-311.2,139.33-311.2,311.2h0q311.2,0,311.2-311.2Z" fill="currentColor"/><path d="M509.59,820.79h0c171.87,0,311.2-139.33,311.2-311.2h0q-311.2,0-311.2,311.2Z" fill="currentColor"/><path d="M509.59,179.21h0c171.87,0,311.2,139.33,311.2,311.2h0q-311.2,0-311.2-311.2Z" fill="#1f7aff"/></svg>`;

  /* =====================================================================
     Data: tools, sizes, fonts, briefs, swatches, shapes
     ===================================================================== */
  // Dock groups: the first tool shows; the rest open from the little arrow
  const TOOL_GROUPS = [
    [["select", "Move", "V"], ["direct", "Edit Points", "A"], ["lasso", "Lasso", "Q"], ["magic-wand", "Magic Wand", "Y"]],
    [["artboard", "Artboard", "shift+O"], ["crop-tool", "Crop Image", ""]],
    "|",
    [["pen", "Pen", "P"], ["curvature", "Curvature", ""], ["add-anchor", "Add Anchor Point", "+"], ["del-anchor", "Delete Anchor Point", "-"], ["anchor", "Anchor Point", "shift+C"]],
    [["rect", "Rectangle", "M"], ["rounded", "Rounded Rectangle", ""], ["ellipse", "Ellipse", "L"], ["polygon", "Polygon", ""], ["star", "Star", ""]],
    [["line", "Line", "\\"], ["arc", "Arc", ""], ["spiral", "Spiral", ""], ["rgrid", "Rectangular Grid", ""], ["pgrid", "Polar Grid", ""]],
    [["pencil", "Pencil", "N"], ["brush", "Brush", "B"], ["blob", "Blob Brush", "shift+B"]],
    [["type", "Text", "T"], ["typepath", "Type on a Path", ""]],
    [["eraser", "Eraser", "shift+E"], ["scissors", "Scissors", "C"], ["knife", "Knife", ""]],
    "|",
    [["rotate", "Rotate", "R"], ["reflect", "Reflect", "O"]],
    [["scale", "Scale", "S"], ["shear", "Shear", ""], ["distort", "Free Distort", ""]],
    [["shapebuilder", "Shape Builder", "shift+M"]],
    [["eyedropper", "Eyedropper", "I"], ["measure", "Measure", ""]],
    [["gradient", "Gradient", "G"]],
    "|",
    [["hand", "Hand", "H"], ["zoom", "Zoom", "Z"]]
  ];
  const TOOL_INFO = Object.fromEntries(TOOL_GROUPS.filter(g => g !== "|").flat().map(([id, name, key]) => [id, { name, key }]));
  const TOOL_HINT = {
    select: "Click to select. Drag to move. Shift-drag a corner keeps proportions, Alt-drag copies.",
    direct: "Click a path to edit its anchor points. Drag points and handles. Alt-click a point to make it smooth or a corner.",
    pen: "Click to add corner points, drag to pull curves. Click the first point to close. Enter finishes an open path.",
    pencil: "Drag to draw a freehand line in the stroke colour.",
    brush: "Drag to paint a thick brush stroke in the stroke colour.",
    type: "Click to type a line of text, or drag to make a text box.",
    line: "Drag to draw a line. Shift keeps it straight or at 45°.",
    rect: "Drag to draw. Shift makes a square, Alt draws from the centre. Click for a 100 px square.",
    rounded: "Drag to draw a rounded rectangle. Shift makes a square.",
    ellipse: "Drag to draw. Shift makes a circle, Alt draws from the centre.",
    polygon: "Drag to draw a hexagon.", star: "Drag to draw a five-point star.",
    rotate: "Select something, then drag to rotate it around its centre. Shift snaps to 15°.",
    scale: "Select something, then drag away from or towards its centre to scale it.",
    eyedropper: "Click an object to copy its colours and text style onto what's selected.",
    gradient: "Click and drag across a selected object to fill it with a gradient.",
    artboard: "Click an artboard to select it, drag to move it with its artwork, or drag on the pasteboard to make a new one.",
    hand: "Drag to move around. Hold Space with any tool to pan.",
    lasso: "Drag around objects to select them.",
    "magic-wand": "Click an object to select everything with the same fill colour.",
    "crop-tool": "Select an image, then drag the handles to crop it. Press Enter or Esc when done.",
    curvature: "Click to place points: the curve flows through them. Alt-click makes a corner. Click the first point to close, Enter to finish.",
    "add-anchor": "Click a path to add an anchor point.",
    "del-anchor": "Click an anchor point to remove it.",
    anchor: "Click an anchor to switch it between smooth and corner. Drag from an anchor to pull out new handles.",
    arc: "Drag to draw an arc. Shift keeps it circular.",
    spiral: "Drag out from the centre to draw a spiral.",
    rgrid: "Drag to draw a grid of rows and columns.",
    pgrid: "Drag to draw a polar grid. Shift keeps it circular.",
    blob: "Paint filled shapes that merge with touching shapes of the same colour. [ and ] change the size.",
    typepath: "Click a path or shape to type along its outline.",
    eraser: "Drag across filled shapes to erase parts of them. [ and ] change the size.",
    scissors: "Click a path to cut it at that point.",
    knife: "Drag a line across filled shapes to slice them apart.",
    reflect: "Select something, then click to flip it across a vertical axis, or drag to set the axis angle. Alt keeps the original.",
    shear: "Select something, then drag sideways or up and down to slant it.",
    distort: "Select a shape or path, then drag its corner handles to distort it.",
    shapebuilder: "Select overlapping shapes first. Click or drag across areas to merge them; Alt-click or Alt-drag removes areas.",
    measure: "Drag to measure the distance and angle between two points.",
    zoom: "Click to zoom in, Alt-click to zoom out."
  };
  const SIZES = [
    ["Instagram post", 1080, 1080], ["Instagram portrait", 1080, 1350], ["Story", 1080, 1920],
    ["Poster", 1240, 1754], ["Presentation", 1920, 1080], ["YouTube thumbnail", 1280, 720],
    ["Facebook ad", 1200, 628], ["Business card", 1050, 600], ["Logo", 1000, 1000]
  ];
  // Fonts: the Google Fonts list in js/canvas-fonts.js plus Georgia. family -> weights, family -> style
  const FONTS = { "Georgia": [400, 700] }, FONT_CAT = { "Georgia": "Serif" };
  Object.entries(window.DS_CANVAS_FONTS || {}).forEach(([cat, list]) => list.forEach(([name, w]) => {
    FONTS[name] = String(w).split("").map(d => d * 100); FONT_CAT[name] = cat;
  }));
  const FONT_NAMES = Object.keys(FONTS).sort((a, b) => a.localeCompare(b));
  const FONT_TABS = [["", "All"], ["Sans", "Sans"], ["Serif", "Serif"], ["Display", "Display"], ["Handwriting", "Script"], ["Mono", "Mono"]];
  const WEIGHT_NAMES = { 100: "Thin", 200: "Extra light", 300: "Light", 400: "Regular", 500: "Medium", 600: "Semibold", 700: "Bold", 800: "Extra bold", 900: "Black" };
  const PAIRS = [["Bebas Neue", 400, "Inter", 400], ["Playfair Display", 700, "Lora", 400], ["Archivo Black", 400, "Inter", 400],
    ["Syne", 800, "Space Grotesk", 400], ["DM Serif Display", 400, "Inter", 400], ["Caveat", 700, "Poppins", 400]];
  const pal = name => ((DS.palettes || []).find(p => p.name === name) || { colors: ["#0f0f0f", "#1f7aff", "#ffffff"] }).colors;
  const BASIC = ["#ffffff", "#e5e5ea", "#aeaeb2", "#636366", "#2c2c2e", "#000000", "#ff453a", "#ff9f0a", "#ffd60a", "#32d74b", "#64d2ff",
    "#1f7aff", "#5e5ce6", "#bf5af2", "#ff375f", "#ac8e68"];
  const GRADIENTS = [["#1f7aff", "#7c5cff"], ["#ff6b35", "#ee4266"], ["#ffd23f", "#ff6b35"], ["#00c7be", "#1f7aff"], ["#ffffff", "#000000"], ["#f72585", "#4361ee"]];
  const BLENDS = [["source-over", "Normal"], ["multiply", "Multiply"], ["screen", "Screen"], ["overlay", "Overlay"], ["darken", "Darken"], ["lighten", "Lighten"],
    ["color-dodge", "Colour Dodge"], ["color-burn", "Colour Burn"], ["difference", "Difference"], ["hue", "Hue"], ["saturation", "Saturation"], ["color", "Colour"], ["luminosity", "Luminosity"]];
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

  /* =====================================================================
     Main menu (behind the logo) and its shortcuts
     ===================================================================== */
  // [label, shortcut, action, check?] · "-" separator · [label, [submenu]]
  const MENUS = [
    ["File", [["New Design", "mod+N", "new"], ["Open Project…", "mod+O", "open"], "-", ["Save", "mod+S", "save"], ["Save Project File…", "mod+shift+S", "save-file"], "-",
      ["Place Image…", "mod+shift+P", "place"], ["Insert QR Code…", "", "qr"], "-",
      ["Export…", "mod+shift+E", "export"], ["Export All Artboards (PNG)", "", "export-all"], ["Copy as PNG", "mod+shift+C", "copy-png"], ["Copy SVG Code", "", "copy-svg"], "-",
      ["Document Setup…", "mod+alt+P", "doc-setup"]]],
    ["Edit", [["Undo", "mod+Z", "undo"], ["Redo", "mod+shift+Z", "redo"], "-", ["Cut", "mod+X", "cut"], ["Copy", "mod+C", "copy"], ["Paste", "mod+V", "paste"],
      ["Paste in Place", "mod+shift+V", "paste-in-place"], ["Duplicate", "mod+D", "duplicate"], ["Delete", "Del", "delete"], "-",
      ["Select All", "mod+A", "select-all"], ["Deselect", "mod+shift+A", "deselect"], ["Select Inverse", "", "select-inverse"],
      ["Select Same", [["Fill Colour", "", "same:fill"], ["Stroke Colour", "", "same:stroke"], ["Font", "", "same:font"]]], "-",
      ["Preferences…", "mod+,", "prefs"]]],
    ["Object", [["Transform", [["Flip Horizontal", "shift+H", "flip-h"], ["Flip Vertical", "shift+V", "flip-v"], ["Reset Rotation", "", "reset-rot"], ["Reset Size", "", "reset-scale"]]],
      ["Arrange", [["Bring to Front", "mod+shift+]", "front"], ["Bring Forward", "mod+]", "forward"], ["Send Backward", "mod+[", "backward"], ["Send to Back", "mod+shift+[", "back"]]],
      ["Align", [["Left", "", "align:left"], ["Horizontal Centre", "", "align:center"], ["Right", "", "align:right"], ["Top", "", "align:top"], ["Vertical Centre", "", "align:middle"], ["Bottom", "", "align:bottom"], "-", ["Distribute Horizontally", "", "dist:h"], ["Distribute Vertically", "", "dist:v"]]],
      ["Combine Shapes", [["Union", "", "bool:unite"], ["Subtract", "", "bool:subtract"], ["Intersect", "", "bool:intersect"], ["Exclude", "", "bool:exclude"]]],
      ["Path", [["Join", "mod+J", "join"], ["Simplify", "", "simplify"], "-", ["Add Anchor Points", "", "tool:add-anchor"], ["Cut at Point", "", "tool:scissors"]]],
      ["Blend", [["Make Blend…", "mod+alt+B", "blend"]]],
      ["Crop Image", "", "crop-image"],
      "-", ["Group", "mod+G", "group"], ["Ungroup", "mod+shift+G", "ungroup"], ["Make Clipping Mask", "mod+7", "mask"], ["Release Clipping Mask", "mod+alt+7", "unmask"], "-",
      ["Repeat Grid…", "", "repeat"], ["Recolour Artwork…", "", "recolor"], ["Expand to Editable Path", "", "expand"], "-",
      ["Lock Selection", "mod+2", "lock"], ["Unlock All", "mod+alt+2", "unlock-all"], ["Hide Selection", "mod+3", "hide"], ["Show All", "mod+alt+3", "show-all"], "-",
      ["Artboards", [["New Artboard", "", "ab-new"], ["Duplicate Artboard", "", "ab-dup"], ["Fit to Artwork Bounds", "", "ab-fit"], ["Delete Artboard", "", "ab-delete"]]]]],
    ["Text", [["Change Case", [["UPPERCASE", "", "case:upper"], ["lowercase", "", "case:lower"], ["Title Case", "", "case:title"], ["Sentence case", "", "case:sentence"]]],
      ["Paragraph", [["Align Left", "", "talign:left"], ["Align Centre", "", "talign:center"], ["Align Right", "", "talign:right"], ["Justify", "", "talign:justify"]]], "-",
      ["Fill With Placeholder Text", "", "lorem"], ["Font Pairs", "", "assets:text"]]],
    ["Effect", [["Drop Shadow", "", "fx:shadow"], ["Remove Drop Shadow", "", "fx:noshadow"], "-",
      ["Image", [["Black and White", "", "fx:gray"], ["Sepia", "", "fx:sepia"], ["Invert", "", "fx:invert"], ["Blur", "", "fx:blur"], ["Clear Image Effects", "", "fx:clear"]]]]],
    ["View", [["Zoom In", "mod+=", "zoom-in"], ["Zoom Out", "mod+-", "zoom-out"], ["Zoom to Fit", "shift+1", "fit-all"], ["Zoom to Artboard", "shift+2", "fit"], ["Zoom to Selection", "shift+3", "fit-sel"], ["Actual Size", "mod+1", "actual"], "-",
      ["Preview", "mod+enter", "present"], ["Hide Interface", "mod+\\", "toggle:ui", "hideUI"], "-",
      ["Rulers", "shift+R", "toggle:rulers", "rulers"], ["Guides", "mod+;", "toggle:guides", "guides"], ["Lock Guides", "mod+alt+;", "toggle:lockGuides", "lockGuides"], ["Clear Guides", "", "clear-guides"], "-",
      ["Grid", "mod+'", "toggle:grid", "grid"], ["Snap to Grid", "mod+shift+'", "toggle:snapGrid", "snapGrid"], ["Smart Guides", "mod+U", "toggle:smart", "smart"], ["Snap to Whole Pixels", "", "toggle:pixel", "pixel"], "-",
      ["Minimap", "", "toggle:mini", "mini"], ["Artboard Names", "", "toggle:names", "names"], ["Light Interface", "", "toggle:light", "light"]]],
    ["Help", [["Command Palette", "mod+K", "palette"], ["Keyboard Shortcuts", "mod+/", "shortcuts"], "-", ["Design Basics course", "", "learn"], ["About Canvas", "", "about"]]]
  ];

  /* =====================================================================
     Markup
     ===================================================================== */
  const dockBtn = g => {
    const [id, name, key] = g[0];
    return `<span class="cx-tool-wrap"><button type="button" class="cx-tool" data-tool="${id}" data-group='${JSON.stringify(g.map(t => t[0]))}' aria-label="${name}" data-tip="${name}${key ? ` · ${keyLabel(key)}` : ""}">${ui(id)}</button>${g.length > 1 ? `<button type="button" class="cx-tool-more" data-more aria-label="More tools">${ui("up")}</button>` : ""}</span>`;
  };
  root.innerHTML = `
    <header class="cx-top">
      <div class="cx-bar">
        <div class="cx-top-l">
          <button type="button" class="cx-brand" data-act="main-menu" aria-haspopup="true" aria-label="Main menu">${MARK_SVG}</button>
          <nav class="cx-mbar" data-mbar aria-label="Menu">${MENUS.map(([m], i) => `<button type="button" data-act="menu:${i}" aria-haspopup="true">${m}</button>`).join("")}</nav>
        </div>
        <div class="cx-top-c">
          <input class="cx-docname" data-name value="" aria-label="Design name" spellcheck="false" maxlength="60">
          <span class="cx-saved" data-saved><i></i><em></em></span>
        </div>
        <div class="cx-top-r">
          <button type="button" class="cx-search" data-act="palette" aria-label="Command palette" data-tip="Command palette · ${keyLabel("mod+K")}">${ui("command")}<span>Search</span><kbd>${keyLabel("mod+K")}</kbd></button>
          <span class="cx-pair2"><button type="button" class="cx-ico" data-act="undo" aria-label="Undo" data-tip="Undo · ${keyLabel("mod+Z")}">${ui("undo")}</button><button type="button" class="cx-ico" data-act="redo" aria-label="Redo" data-tip="Redo · ${keyLabel("mod+shift+Z")}">${ui("redo")}</button></span>
          <button type="button" class="cx-ico" data-act="present" aria-label="Preview" data-tip="Preview · ${keyLabel("mod+enter")}">${ui("play")}</button>
          <button type="button" class="cx-primary" data-act="export">${ui("export")}<span>Export</span></button>
        </div>
      </div>
      <div class="cx-ctrl" data-ctrl aria-label="Control bar"></div>
    </header>
    <div class="cx-body" data-body>
      <div class="cx-stage" data-stage><canvas></canvas></div>
      <canvas class="cx-ruler h" data-ruler="h" aria-hidden="true"></canvas>
      <canvas class="cx-ruler v" data-ruler="v" aria-hidden="true"></canvas>
      <span class="cx-corner" aria-hidden="true"></span>
      <aside class="cx-panel cx-left" data-left>
        <div class="cx-tabs" data-ltabs></div>
        <div class="cx-panel-body" data-lbody></div>
      </aside>
      <aside class="cx-panel cx-right" data-right>
        <div class="cx-insp-head" data-ihead></div>
        <div class="cx-panel-body" data-rbody></div>
      </aside>
      <nav class="cx-dock" data-dock aria-label="Tools">
        ${TOOL_GROUPS.map(g => (g === "|" ? `<span class="cx-dock-sep"></span>` : dockBtn(g))).join("")}
        <span class="cx-dock-sep"></span>
        <div class="cx-paint" data-paint data-cp-side data-tip="Fill and stroke · X switches">
          <label class="cx-paint-s"><input type="color" data-paintin="stroke" aria-label="Stroke colour"></label>
          <label class="cx-paint-f"><input type="color" data-paintin="fill" aria-label="Fill colour"></label>
        </div>
        <button type="button" class="cx-tool" data-act="place" aria-label="Place image" data-tip="Place image · ${keyLabel("mod+shift+P")}">${ui("image")}</button>
      </nav>
      <footer class="cx-status" data-status>
        <div class="cx-navcard" data-navcard>
          <div class="cx-miniwrap"><canvas class="cx-minimap" data-mini aria-label="Minimap"></canvas></div>
          <div class="cx-zoomrow">
            <button type="button" data-act="zoom-out" aria-label="Zoom out" data-tip="Zoom out · ${keyLabel("mod+-")}">${ui("minus")}</button>
            <button type="button" class="cx-zoomval" data-act="zoom-menu" data-zoomval aria-label="Zoom presets">100%</button>
            <button type="button" data-act="zoom-in" aria-label="Zoom in" data-tip="Zoom in · ${keyLabel("mod+=")}">${ui("plus")}</button>
            <button type="button" data-act="fit" aria-label="Zoom to artboard" data-tip="Zoom to artboard · ${keyLabel("shift+2")}">${ui("fit")}</button>
          </div>
        </div>
        <span class="cx-st-sep"></span>
        <button type="button" class="cx-abchip" data-act="ab-menu" aria-haspopup="true" aria-label="Artboards"><span data-abchip></span>${ui("chev")}</button>
        <span class="cx-st-sep"></span>
        <span class="cx-hint" data-hint></span>
        <span class="cx-st-xy" data-xy data-no-i18n></span>
      </footer>
      <div class="cx-measure" data-measure data-no-i18n hidden></div>
      <div class="cx-drop" data-drop><span>${ui("upload")}Drop images to place them</span></div>
      <div class="cx-toast" data-toast role="status"></div>
      <div class="cx-present-bar" data-presentbar><button type="button" data-act="ab-prev" aria-label="Previous artboard">${ui("left")}</button><span data-presentlabel data-no-i18n></span><button type="button" data-act="ab-next" aria-label="Next artboard">${ui("right")}</button><button type="button" data-act="present" aria-label="Close preview">${ui("close")}</button></div>
      <button type="button" class="cx-mobpanel" data-act="toggle-sheet" aria-label="Panels" data-tip="Panels">${ui("panels")}</button>
    </div>
    <div class="cx-menu" data-menupop hidden role="menu"></div>
    <div class="cx-modal" data-modal hidden><div class="cx-dialog" role="dialog" aria-modal="true" data-dialog></div></div>
    <div class="cx-palette" data-palette hidden><div class="cx-palette-box" role="dialog" aria-label="Command palette">
      <label class="cx-palette-in">${ui("command")}<input data-pq placeholder="Type a command, tool, icon, font or template…" aria-label="Search" spellcheck="false" autocomplete="off"><kbd>Esc</kbd></label>
      <div class="cx-palette-list" data-plist role="listbox"></div>
    </div></div>
    <input type="file" accept="image/*" multiple hidden data-file-img>
    <input type="file" accept="image/*" hidden data-file-replace>
    <input type="file" accept=".json,application/json" hidden data-file-json>`;

  const stage = $("[data-stage]", root), body = $("[data-body]", root);
  const leftP = $("[data-left]", root), rightP = $("[data-right]", root), lBody = $("[data-lbody]", root), rBody = $("[data-rbody]", root);
  const lTabs = $("[data-ltabs]", root), iHead = $("[data-ihead]", root), dock = $("[data-dock]", root), ctrl = $("[data-ctrl]", root), mbar = $("[data-mbar]", root);
  const menuPop = $("[data-menupop]", root), modal = $("[data-modal]", root), dialog = $("[data-dialog]", root);
  const paletteEl = $("[data-palette]", root), pq = $("[data-pq]", root), plist = $("[data-plist]", root);
  const measureEl = $("[data-measure]", root), toastEl = $("[data-toast]", root), hintEl = $("[data-hint]", root);
  const nameIn = $("[data-name]", root), savedEl = $("[data-saved]", root), mini = $("[data-mini]", root);
  const rulerH = $("[data-ruler=h]", root), rulerV = $("[data-ruler=v]", root);

  /* =====================================================================
     Fabric setup
     ===================================================================== */
  F.Object.prototype.set({
    transparentCorners: false, cornerColor: "#ffffff", cornerStrokeColor: "#1f7aff", borderColor: "#1f7aff",
    cornerSize: 7, cornerStyle: "rect", borderScaleFactor: 1, padding: 0, borderOpacityWhenMoving: .6
  });
  F.IText.prototype.set({ editingBorderColor: "#1f7aff", cursorColor: "#1f7aff", selectionColor: "rgba(31, 122, 255, .3)" });
  if (F.Canvas2dFilterBackend) F.filterBackend = new F.Canvas2dFilterBackend();
  const PROPS = ["name", "locked", "kind", "kindRadius", "anchors", "closed", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "maskShape"];
  const cv = new F.Canvas($("canvas", stage), {
    preserveObjectStacking: true, stopContextMenu: true, fireRightClick: true, uniformScaling: false, uniScaleKey: "shiftKey",
    selectionColor: "rgba(31, 122, 255, .07)", selectionBorderColor: "#1f7aff", selectionLineWidth: 1, targetFindTolerance: 4
  });

  // Rotate, Scale, Reflect and Shear work on what's already selected: a click must not drop it
  const keepSelection = cv._shouldClearSelection.bind(cv);
  cv._shouldClearSelection = (e, target) => (["rotate", "scale", "reflect", "shear"].includes(tool) ? false : keepSelection(e, target));

  /* ---------- Document state ---------- */
  const GUIDE = "#24c1ff", SMART = "#ff3fa4";
  const doc = { name: tr("Untitled design"), artboards: [], active: 0, guides: { v: [], h: [] } };
  const view = { rulers: true, smart: true, guides: true, lockGuides: false, grid: false, snapGrid: false, pixel: true, names: true, mini: true, light: false, hideUI: false };
  const prefs = { nudge: 1, scaleStrokes: false, gridSize: 20, brush: 24 };
  const DEFAULT_PAINT = { fill: "#1f7aff", stroke: null, strokeWidth: 2 };
  const paint = Object.assign({ focus: "fill" }, DEFAULT_PAINT);
  const charState = { family: "Inter", weight: 600, size: 64 };
  let tool = "select", brief = null, abSelected = -1, present = false;
  const ab = () => doc.artboards[doc.active] || doc.artboards[0];
  const newArtboard = (w, h, x = 0, y = 0, bg = "#ffffff") => ({ name: `${tr("Artboard")} ${doc.artboards.length + 1}`, x, y, w, h, bg });
  const unit = () => { const a = ab(); return a ? Math.min(a.w, a.h) / 1080 : 1; };
  try { Object.assign(view, JSON.parse(localStorage.getItem("ds-canvas-view2") || "{}")); Object.assign(prefs, JSON.parse(localStorage.getItem("ds-canvas-prefs") || "{}")); } catch (e) { /* defaults */ }
  view.hideUI = false;
  const saveView = () => { try { localStorage.setItem("ds-canvas-view2", JSON.stringify(Object.assign({}, view, { hideUI: false }))); localStorage.setItem("ds-canvas-prefs", JSON.stringify(prefs)); } catch (e) { /* private mode */ } };
  const applyViewClasses = () => {
    root.classList.toggle("has-rulers", !!view.rulers);
    root.classList.toggle("is-light", !!view.light);
    root.classList.toggle("no-mini", !view.mini);
    root.classList.toggle("hide-ui", !!view.hideUI);
    root.classList.toggle("is-present", present);
    // the pasteboard colour comes from the theme (--x-paste in style.css)
    pasteCol = getComputedStyle(root).getPropertyValue("--x-paste").trim() || (view.light ? "#d9d9d9" : "#1b1b1b");
  };
  let pasteCol = "";
  applyViewClasses();
  const pasteColour = () => pasteCol;

  /* =====================================================================
     Pasteboard, artboards, grid (drawn under the artwork)
     ===================================================================== */
  const exporting = () => !cv.interactive;
  let exportBg = true;
  cv._renderBackground = function (ctx) {
    const v = this.viewportTransform;
    if (!exporting()) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = present ? "#000000" : pasteColour(); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
    ctx.save();
    ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    doc.artboards.forEach((a, i) => {
      if (exporting() && !exportBg) return;
      if (present && i !== doc.active) return;
      // a tight, crisp shadow, like a sheet of paper on the desk
      if (!exporting()) { ctx.shadowColor = view.light ? "rgba(0,0,0,.22)" : "rgba(0,0,0,.6)"; ctx.shadowBlur = 4 * (window.devicePixelRatio || 1); ctx.shadowOffsetY = 1 * (window.devicePixelRatio || 1); }
      ctx.fillStyle = a.bg || "#ffffff";
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.shadowColor = "transparent";
    });
    if (view.grid && !exporting() && !present) {
      const g = prefs.gridSize, z = v[0];
      if (g * z >= 5) {
        ctx.lineWidth = 1 / z;
        doc.artboards.forEach(a => {
          ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
          for (let x = a.x, i = 0; x <= a.x + a.w; x += g, i++) { ctx.strokeStyle = i % 5 ? "rgba(31,122,255,.08)" : "rgba(31,122,255,.18)"; ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); ctx.stroke(); }
          for (let y = a.y, i = 0; y <= a.y + a.h; y += g, i++) { ctx.strokeStyle = i % 5 ? "rgba(31,122,255,.08)" : "rgba(31,122,255,.18)"; ctx.beginPath(); ctx.moveTo(a.x, y); ctx.lineTo(a.x + a.w, y); ctx.stroke(); }
          ctx.restore();
        });
      }
    }
    ctx.restore();
  };
  // Artboard names, guides and point handles over the artwork (main layer only)
  cv.on("after:render", ({ ctx }) => {
    if (exporting() || ctx !== cv.contextContainer) return;
    const v = cv.viewportTransform, z = v[0];
    if (present) {
      // in preview, hide whatever sits outside the artboard
      const a = ab();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const d = window.devicePixelRatio || 1, x = (v[4] + a.x * z) * d, y = (v[5] + a.y * z) * d, w = a.w * z * d, h = a.h * z * d;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, ctx.canvas.width, y); ctx.fillRect(0, y + h, ctx.canvas.width, ctx.canvas.height); ctx.fillRect(0, y, x, h); ctx.fillRect(x + w, y, ctx.canvas.width, h);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    doc.artboards.forEach((a, i) => {
      const on = i === doc.active, sel = tool === "artboard" && i === abSelected;
      if (sel) { ctx.lineWidth = 2 / z; ctx.strokeStyle = "#1f7aff"; ctx.strokeRect(a.x, a.y, a.w, a.h); }
      if (view.names) {
        ctx.font = `${on ? 600 : 500} ${11.5 / z}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = sel ? "#1f7aff" : on ? (view.light ? "#1d1d1f" : "#f2f2f7") : "#8e8e93";
        ctx.fillText(a.name, a.x, a.y - 8 / z);
        const nameW = ctx.measureText(a.name).width;
        ctx.fillStyle = view.light ? "#aeaeb2" : "#636366";
        ctx.font = `500 ${11 / z}px Inter, system-ui, sans-serif`;
        ctx.fillText(`${a.w} × ${a.h}`, a.x + nameW + 8 / z, a.y - 8 / z);
      }
    });
    const co = tool === "crop-tool" && cv.getActiveObject();
    if (co && co.type === "image" && !exporting()) {
      ctx.save();
      const m = co.calcTransformMatrix();
      ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
      ctx.globalAlpha = .28;
      ctx.drawImage(co.getElement(), -co.width / 2 - (co.cropX || 0), -co.height / 2 - (co.cropY || 0));
      ctx.restore();
    }
    if (view.guides) {
      ctx.strokeStyle = GUIDE; ctx.lineWidth = 1 / z;
      const inv = F.util.invertTransform(v), tl = F.util.transformPoint(new F.Point(0, 0), inv), br = F.util.transformPoint(new F.Point(cv.width, cv.height), inv);
      doc.guides.v.forEach(x => { ctx.beginPath(); ctx.moveTo(x, tl.y); ctx.lineTo(x, br.y); ctx.stroke(); });
      doc.guides.h.forEach(y => { ctx.beginPath(); ctx.moveTo(tl.x, y); ctx.lineTo(br.x, y); ctx.stroke(); });
    }
    const o = cv.getActiveObject();
    if (tool === "direct" && o && o.kind === "vector" && o.anchors) {
      ctx.strokeStyle = "#1f7aff"; ctx.lineWidth = 1 / z;
      o.anchors.forEach(an => {
        const p = toScene(o, an.x, an.y);
        [[an.ix, an.iy], [an.ox, an.oy]].forEach(([hx, hy]) => {
          if (!hx && !hy) return;
          const q = toScene(o, an.x + hx, an.y + hy);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        });
      });
    }
    ctx.restore();
    drawRulers();
    scheduleOverlay();
  });

  /* ---------- View: zoom and pan ---------- */
  const zoom = () => cv.getZoom();
  // the part of the stage not covered by floating panels
  function insets() {
    const phone = innerWidth < 900;
    if (present || view.hideUI || phone) return { l: 16, r: 16, t: present ? 24 : 24, b: present ? 80 : (phone ? 96 : 24) };
    const S = stage.getBoundingClientRect(), L = leftP.getBoundingClientRect(), R = rightP.getBoundingClientRect();
    return { l: Math.max(16, L.right - S.left + 24), r: Math.max(16, S.right - R.left + 24), t: (view.rulers ? 18 : 0) + 40, b: 100 };
  }
  function fitRect(r) {
    const W = cv.width, H = cv.height;
    if (!W || !H || !r || !r.w || !r.h) return;
    const p = insets(), aw = Math.max(80, W - p.l - p.r), ah = Math.max(80, H - p.t - p.b);
    const z = clamp(Math.min(aw / r.w, ah / r.h), .02, 64);
    cv.setViewportTransform([z, 0, 0, z, p.l + (aw - r.w * z) / 2 - r.x * z, p.t + (ah - r.h * z) / 2 - r.y * z]);
    afterView();
  }
  const fitArtboard = () => fitRect(ab());
  const allBounds = () => {
    const rs = doc.artboards.map(a => ({ l: a.x, t: a.y, r: a.x + a.w, b: a.y + a.h }));
    cv.getObjects().forEach(o => { const b = o.getBoundingRect(true, true); rs.push({ l: b.left, t: b.top, r: b.left + b.width, b: b.top + b.height }); });
    const l = Math.min(...rs.map(r => r.l)), t = Math.min(...rs.map(r => r.t));
    return { x: l, y: t, w: Math.max(...rs.map(r => r.r)) - l, h: Math.max(...rs.map(r => r.b)) - t };
  };
  let navT = 0;
  // the minimap shows while the view moves, then fades away
  const pingNav = () => { if (!view.mini) return; root.classList.add("is-nav"); clearTimeout(navT); navT = setTimeout(() => root.classList.remove("is-nav"), 1400); };
  const zoomAt = (pt, z) => { cv.zoomToPoint(new F.Point(pt.x, pt.y), clamp(z, .02, 64)); pingNav(); afterView(); };
  const zoomCenter = z => { const p = insets(); zoomAt({ x: p.l + (cv.width - p.l - p.r) / 2, y: p.t + (cv.height - p.t - p.b) / 2 }, z); };
  function afterView() {
    cv.getObjects().forEach(o => o.setCoords());
    const a = cv.getActiveObject(); if (a) a.setCoords();
    $("[data-zoomval]", root).textContent = round(zoom() * 100, zoom() < .1 ? 1 : 0) + "%";
    cv.requestRenderAll();
  }
  const resize = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const first = !cv.width || cv.width === 300;
    cv.setDimensions({ width: Math.floor(r.width), height: Math.floor(r.height) });
    sizeRulers();
    if (first) fitArtboard(); else afterView();
  };
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
  // Status bar: the pointer's position, measured from the active artboard's top-left corner
  const xyEl = $("[data-xy]", root);
  let xyRaf = 0, xyEv = null;
  stage.addEventListener("pointermove", e => {
    xyEv = e;
    if (xyRaf) return;
    xyRaf = requestAnimationFrame(() => {
      xyRaf = 0;
      const r = stage.getBoundingClientRect(), p = F.util.transformPoint(new F.Point(xyEv.clientX - r.left, xyEv.clientY - r.top), F.util.invertTransform(cv.viewportTransform)), a = ab();
      xyEl.innerHTML = `<span>X</span>${Math.round(p.x - a.x)}<span>Y</span>${Math.round(p.y - a.y)}`;
    });
  });
  stage.addEventListener("pointerleave", () => { xyEl.textContent = ""; });
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || e.altKey) {
      const r = stage.getBoundingClientRect();
      zoomAt({ x: e.clientX - r.left, y: e.clientY - r.top }, zoom() * Math.pow(1.0018, -e.deltaY * (e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 50 ? 4 : 1)));
    } else {
      cv.relativePan(new F.Point(-(e.shiftKey ? e.deltaY : e.deltaX), -(e.shiftKey ? 0 : e.deltaY)));
      pingNav(); afterView();
    }
  }, { passive: false });

  /* ---------- Rulers ---------- */
  const DPR = () => window.devicePixelRatio || 1;
  function sizeRulers() {
    [rulerH, rulerV].forEach(c => { const r = c.getBoundingClientRect(); c.width = Math.round(r.width * DPR()); c.height = Math.round(r.height * DPR()); });
    drawRulers();
  }
  let mouseScreen = null;
  function drawRulers() {
    if (!view.rulers || present || !rulerH.width) return;
    const v = cv.viewportTransform, z = v[0], a = ab() || { x: 0, y: 0 };
    const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const major = steps.find(s => s * z >= 70) || 10000, minor = major / (major % 5 === 0 && major >= 5 ? 5 : 2);
    const selO = cv.getActiveObject(), sb = selO ? selO.getBoundingRect() : null;
    const bg = view.light ? "#f5f5f7" : "#18181b", fg = view.light ? "#8e8e93" : "#6e6e73", tick = view.light ? "#c7c7cc" : "#3a3a3c";
    [[rulerH, true], [rulerV, false]].forEach(([c, horiz]) => {
      const x = c.getContext("2d"), d = DPR(), W = c.width / d, H = c.height / d;
      x.setTransform(d, 0, 0, d, 0, 0);
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      const len = horiz ? W : H, off = horiz ? v[4] + a.x * z : v[5] + a.y * z;
      if (sb) { x.fillStyle = "rgba(31,122,255,.22)"; if (horiz) x.fillRect(sb.left, 0, sb.width, H); else x.fillRect(0, sb.top, W, sb.height); }
      x.strokeStyle = tick; x.fillStyle = fg; x.lineWidth = 1; x.font = "500 9px Inter, system-ui, sans-serif";
      const start = Math.floor(-off / z / minor) * minor, end = (len - off) / z;
      x.beginPath();
      for (let u = start; u <= end; u += minor) {
        const s = Math.round(off + u * z) + .5, isMajor = Math.abs(u / major - Math.round(u / major)) < 1e-6;
        const t = isMajor ? (horiz ? H : W) * .6 : (horiz ? H : W) * .25;
        if (horiz) { x.moveTo(s, H); x.lineTo(s, H - t); } else { x.moveTo(W, s); x.lineTo(W - t, s); }
        if (isMajor) {
          const label = String(round(u, 2));
          if (horiz) x.fillText(label, s + 3, 9);
          else { x.save(); x.translate(9, s + 3); x.rotate(-Math.PI / 2); x.fillText(label, -x.measureText(label).width - 3, 0); x.restore(); }
        }
      }
      x.stroke();
      if (mouseScreen) { x.strokeStyle = "#1f7aff"; x.beginPath(); const m = (horiz ? mouseScreen.x : mouseScreen.y) + .5; if (horiz) { x.moveTo(m, 0); x.lineTo(m, H); } else { x.moveTo(0, m); x.lineTo(W, m); } x.stroke(); }
    });
  }
  // Drag from a ruler to make a guide; drag a guide back onto a ruler to remove it
  let guideDrag = null;
  const stagePt = e => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left + (view.rulers ? 18 : 0) && e.clientX <= r.right && e.clientY >= r.top + (view.rulers ? 18 : 0) && e.clientY <= r.bottom }; };
  const sceneOf = sp => F.util.transformPoint(new F.Point(sp.x, sp.y), F.util.invertTransform(cv.viewportTransform));
  [[rulerH, "h"], [rulerV, "v"]].forEach(([c, axis]) => c.addEventListener("pointerdown", e => {
    if (view.lockGuides) return;
    e.preventDefault();
    guideDrag = { axis, index: doc.guides[axis].push(-1e9) - 1, ruler: true };
    view.guides = true;
  }));
  window.addEventListener("pointermove", e => {
    if (!guideDrag || !guideDrag.ruler) return;
    const p = sceneOf(stagePt(e));
    doc.guides[guideDrag.axis][guideDrag.index] = guideDrag.axis === "h" ? round(p.y) : round(p.x);
    showMeasure(e, guideDrag.axis === "h" ? `Y  ${round(p.y - ab().y)}` : `X  ${round(p.x - ab().x)}`);
    cv.requestRenderAll();
  });
  window.addEventListener("pointerup", e => {
    if (!guideDrag || !guideDrag.ruler) return;
    if (!stagePt(e).inside) doc.guides[guideDrag.axis].splice(guideDrag.index, 1);
    guideDrag = null; hideMeasure(); cv.requestRenderAll(); note("Guide"); changed();
  });

  /* =====================================================================
     Fonts
     ===================================================================== */
  const fontReady = {}, fontCss = {};
  const fontQ = f => encodeURIComponent(f).replace(/%20/g, "+");
  // A font's stylesheet goes in the first time a design uses it
  const ensureFontCss = family => {
    if (!FONTS[family] || family === "Georgia") return Promise.resolve();
    return fontCss[family] || (fontCss[family] = new Promise(res => {
      const l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = `https://fonts.googleapis.com/css2?family=${fontQ(family)}:wght@${FONTS[family].join(";")}&display=swap`;
      l.onload = l.onerror = () => res();
      document.head.appendChild(l);
    }));
  };
  // Font menu previews load just the letters of each name, under their own family name,
  // so a preview never stands in for the full font on the canvas
  const previewed = new Set();
  const previewFonts = names => {
    names = [...new Set(names)].filter(f => FONTS[f] && f !== "Georgia" && !previewed.has(f));
    if (!names.length) return;
    names.forEach(f => previewed.add(f));
    const fams = names.map(f => `family=${fontQ(f)}:wght@${FONTS[f].includes(400) ? 400 : FONTS[f][0]}`).join("&");
    fetch(`https://fonts.googleapis.com/css2?${fams}&text=${encodeURIComponent([...new Set(names.join(""))].join(""))}`)
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(css => { const st = document.createElement("style"); st.textContent = css.replace(/font-family: '([^']+)'/g, "font-family: '$1 Preview'"); document.head.appendChild(st); })
      .catch(() => names.forEach(f => previewed.delete(f)));
  };
  const fontFace = f => (f === "Georgia" ? "Georgia" : `'${f} Preview', '${f}'`);
  const loadFont = (family, weight = 400) => {
    if (family === "Georgia" || !document.fonts) return Promise.resolve();
    const key = family + weight;
    if (!fontReady[key]) fontReady[key] = ensureFontCss(family).then(() => document.fonts.load(`${weight} 40px "${family}"`)).then(() => { F.util.clearFabricFontCache(family); }).catch(() => {});
    return fontReady[key];
  };
  const isText = o => o && (o.type === "textbox" || o.type === "i-text" || o.type === "text");
  const flat = objs => objs.flatMap(o => (o.type === "group" ? flat(o.getObjects()) : [o]));
  const loadFontsOf = objs => Promise.all(flat(objs).filter(isText).map(o => loadFont(o.fontFamily, o.fontWeight)));
  const refreshText = () => { flat(cv.getObjects()).forEach(o => { if (o.initDimensions) { o.initDimensions(); o.setCoords(); o.dirty = true; } }); cv.requestRenderAll(); };

  /* =====================================================================
     Vector paths: anchors with handles, editable with Edit Points
     anchor = { x, y, ix, iy, ox, oy } in the path's own coordinates
     ===================================================================== */
  const f2 = n => (Math.round(n * 100) / 100).toString();
  const A = (x, y, ix = 0, iy = 0, ox = 0, oy = 0) => ({ x, y, ix, iy, ox, oy });
  const pathFrom = (pts, closed) => {
    if (!pts.length) return "M 0 0";
    const seg = (a, b) => ((a.ox || a.oy || b.ix || b.iy)
      ? ` C ${f2(a.x + a.ox)} ${f2(a.y + a.oy)} ${f2(b.x + b.ix)} ${f2(b.y + b.iy)} ${f2(b.x)} ${f2(b.y)}`
      : ` L ${f2(b.x)} ${f2(b.y)}`);
    let d = `M ${f2(pts[0].x)} ${f2(pts[0].y)}`;
    for (let i = 1; i < pts.length; i++) d += seg(pts[i - 1], pts[i]);
    if (closed && pts.length > 2) d += seg(pts[pts.length - 1], pts[0]) + " Z";
    return d;
  };
  const vector = (pts, closed, opts = {}) => new F.Path(pathFrom(pts, closed), Object.assign({ anchors: pts, closed, kind: "vector", objectCaching: false }, opts));
  const toScene = (o, x, y) => F.util.transformPoint(new F.Point(x - o.pathOffset.x, y - o.pathOffset.y), o.calcTransformMatrix());
  const toLocal = (o, x, y) => { const p = F.util.transformPoint(new F.Point(x, y), F.util.invertTransform(o.calcTransformMatrix())); return { x: p.x + o.pathOffset.x, y: p.y + o.pathOffset.y }; };
  function rebuild(o) {
    const M = o.calcTransformMatrix(), po = { x: o.pathOffset.x, y: o.pathOffset.y };
    o._setPath(pathFrom(o.anchors, o.closed));
    const c = F.util.transformPoint(new F.Point(o.pathOffset.x - po.x, o.pathOffset.y - po.y), M);
    o.setPositionByOrigin(c, "center", "center");
    o.dirty = true; o.setCoords();
  }
  const K = 0.5523;
  function shapeAnchors(o) {
    const w = o.width, h = o.height;
    switch (o.type) {
      case "rect": {
        const r = Math.min(o.rx || 0, w / 2, h / 2), k = K * r;
        if (!r) return [A(0, 0), A(w, 0), A(w, h), A(0, h)];
        return [A(r, 0, -k, 0, 0, 0), A(w - r, 0, 0, 0, k, 0), A(w, r, 0, -k, 0, 0), A(w, h - r, 0, 0, 0, k),
          A(w - r, h, k, 0, 0, 0), A(r, h, 0, 0, -k, 0), A(0, h - r, 0, k, 0, 0), A(0, r, 0, 0, 0, -k)];
      }
      case "circle": case "ellipse": {
        const rx = o.type === "circle" ? o.radius : o.rx, ry = o.type === "circle" ? o.radius : o.ry;
        return [A(rx, 0, -K * rx, 0, K * rx, 0), A(2 * rx, ry, 0, -K * ry, 0, K * ry), A(rx, 2 * ry, K * rx, 0, -K * rx, 0), A(0, ry, 0, K * ry, 0, -K * ry)];
      }
      case "triangle": return [A(w / 2, 0), A(w, h), A(0, h)];
      case "polygon": case "polyline": return o.points.map(p => A(p.x, p.y));
      case "line": { const p = o.calcLinePoints(); return [A(p.x1, p.y1), A(p.x2, p.y2)]; }
      case "path": { const r = pathAnchors(o); return r ? r.pts : null; }
      default: return null;
    }
  }
  // A single-outline path's commands as anchors (paths with several outlines stay as they are)
  function pathAnchors(o) {
    const cmds = o.path;
    if (!cmds || o.anchors || cmds.filter(c => c[0] === "M" || c[0] === "m").length !== 1) return null;
    const pts = [];
    let closed = false;
    for (const c of cmds) {
      const [k, ...n] = c, last = pts[pts.length - 1];
      if (k === "M" || k === "L") pts.push(A(n[0], n[1]));
      else if (k === "C") { last.ox = n[0] - last.x; last.oy = n[1] - last.y; pts.push(A(n[4], n[5], n[2] - n[4], n[3] - n[5])); }
      else if (k === "Q") { last.ox = (n[0] - last.x) * 2 / 3; last.oy = (n[1] - last.y) * 2 / 3; pts.push(A(n[2], n[3], (n[0] - n[2]) * 2 / 3, (n[1] - n[3]) * 2 / 3)); }
      else if (k === "Z" || k === "z") closed = true;
      else return null;
    }
    // "Z" draws the closing segment itself, so a repeated start point goes
    if (closed && pts.length > 2) { const f = pts[0], l = pts[pts.length - 1]; if (Math.hypot(f.x - l.x, f.y - l.y) < 1e-6) { f.ix = l.ix; f.iy = l.iy; pts.pop(); } }
    return pts.length > 1 ? { pts, closed } : null;
  }
  // A live shape as an editable path (detached; the caller decides whether to swap it in)
  function asVector(o) {
    if (o.kind === "vector") return o;
    const pts = shapeAnchors(o);
    if (!pts) return null;
    const closed = o.type === "path" ? pathAnchors(o).closed : !(o.type === "line" || o.type === "polyline");
    const p = vector(pts, closed, {
      fill: o.type === "line" ? null : o.fill, stroke: o.stroke, strokeWidth: o.strokeWidth, strokeUniform: o.strokeUniform, strokeDashArray: o.strokeDashArray,
      strokeLineCap: o.strokeLineCap, strokeLineJoin: o.strokeLineJoin, opacity: o.opacity, shadow: o.shadow, name: o.name, globalCompositeOperation: o.globalCompositeOperation,
      angle: o.angle, scaleX: o.scaleX, scaleY: o.scaleY, flipX: o.flipX, flipY: o.flipY, skewX: o.skewX, skewY: o.skewY
    });
    p.setPositionByOrigin(o.getCenterPoint(), "center", "center");
    return p;
  }
  function expand(o) {
    if (!o || o.kind === "vector") return o;
    const p = asVector(o);
    if (!p) return o;
    const i = cv.getObjects().indexOf(o);
    hist.busy++;
    cv.remove(o); cv.insertAt(p, i);
    hist.busy--;
    applyToolState(p);
    p.setCoords();
    return p;
  }
  let anchorSel = -1;
  function vectorControls(o) {
    const controls = {};
    const pos = (i, which) => (dim, finalMatrix, obj) => {
      const a = obj.anchors[i];
      if (!a) return new F.Point(-999, -999);
      const lx = a.x + (which === "i" ? a.ix : which === "o" ? a.ox : 0), ly = a.y + (which === "i" ? a.iy : which === "o" ? a.oy : 0);
      return F.util.transformPoint(new F.Point(lx - obj.pathOffset.x, ly - obj.pathOffset.y), F.util.multiplyTransformMatrices(obj.canvas.viewportTransform, obj.calcTransformMatrix()));
    };
    o.anchors.forEach((a, i) => {
      controls["a" + i] = new F.Control({
        positionHandler: pos(i, "a"), cursorStyle: "pointer", actionName: "modifyPath",
        mouseDownHandler: e => { anchorSel = i; if (e.altKey) { toggleSmooth(o, i); return true; } return false; },
        actionHandler: (e, t, x, y) => { const l = toLocal(o, x, y), an = o.anchors[i]; an.x = l.x; an.y = l.y; rebuild(o); showMeasure(e, `X  ${round(x - ab().x)}   Y  ${round(y - ab().y)}`); return true; },
        render: (ctx, left, top) => { ctx.save(); ctx.fillStyle = i === anchorSel ? "#1f7aff" : "#ffffff"; ctx.strokeStyle = "#1f7aff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.rect(left - 3.5, top - 3.5, 7, 7); ctx.fill(); ctx.stroke(); ctx.restore(); }
      });
      ["i", "o"].forEach(w => {
        controls[w + i] = new F.Control({
          positionHandler: pos(i, w), cursorStyle: "crosshair", actionName: "modifyPath",
          actionHandler: (e, t, x, y) => {
            const l = toLocal(o, x, y), an = o.anchors[i];
            an[w + "x"] = l.x - an.x; an[w + "y"] = l.y - an.y;
            if (!e.altKey) { const ow = w === "i" ? "o" : "i"; if (an[ow + "x"] || an[ow + "y"]) { an[ow + "x"] = -an[w + "x"]; an[ow + "y"] = -an[w + "y"]; } }
            rebuild(o); return true;
          },
          render: (ctx, left, top) => {
            const an = o.anchors[i];
            if (!an || (!an[w + "x"] && !an[w + "y"])) return;
            ctx.save(); ctx.fillStyle = "#1f7aff"; ctx.beginPath(); ctx.arc(left, top, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          }
        });
      });
    });
    return controls;
  }
  function toggleSmooth(o, i) {
    const a = o.anchors[i], n = o.anchors.length;
    if (a.ix || a.iy || a.ox || a.oy) { a.ix = a.iy = a.ox = a.oy = 0; }
    else {
      const p = o.anchors[(i - 1 + n) % n], q = o.anchors[(i + 1) % n];
      const dx = (q.x - p.x) / 6, dy = (q.y - p.y) / 6;
      a.ix = -dx; a.iy = -dy; a.ox = dx; a.oy = dy;
    }
    rebuild(o); cv.requestRenderAll(); note("Edit Points"); changed();
  }
  // Tools that give the selected object its own handles: Edit Points, Free Distort, Crop Image
  function setDirectControls() {
    const cur = cv.getActiveObject();
    cv.getObjects().forEach(o => { if (o.__direct && (o.__direct !== tool || o !== cur)) { delete o.controls; o.hasBorders = true; o.__direct = false; delete o.__dist; } });
    const o = cur;
    if (o && o.type !== "activeSelection" && o.__direct !== tool) {
      if (tool === "direct" || tool === "distort") {
        const v = o.kind === "vector" ? o : (isText(o) || o.type === "image" || o.type === "group") ? null : expand(o);
        if (v && v.kind === "vector") {
          if (v !== o) { cv.setActiveObject(v); note("Expand"); changed(); }
          if (tool === "direct") { v.controls = vectorControls(v); v.hasBorders = false; v.__direct = "direct"; anchorSel = -1; }
          else startDistort(v);
        } else if (tool === "distort") toast(tr("Free Distort works on shapes and paths."));
      } else if (tool === "crop-tool") {
        if (o.type === "image") { o.controls = cropControls(o); o.hasBorders = true; o.__direct = "crop-tool"; }
        else toast(tr("Select an image to crop it."));
      }
    }
    cv.requestRenderAll();
  }

  /* =====================================================================
     History (with labels) and autosave
     ===================================================================== */
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
  const hist = { stack: [], meta: [], i: -1, busy: 0 };
  let pending = "";
  // the label the next history step gets (the first one set wins)
  const note = l => { if (!pending && !hist.busy) pending = l; };
  const snapshot = () => JSON.stringify({
    app: "draft-studio-canvas", v: 2, name: doc.name, artboards: doc.artboards, active: doc.active, guides: doc.guides,
    brief: brief ? BRIEFS.indexOf(brief) : -1, canvas: cv.toJSON(PROPS)
  });
  let commitT = 0, saveT = 0;
  const changed = () => { if (hist.busy) return; clearTimeout(commitT); commitT = setTimeout(commit, 180); };
  function commit() {
    const s = snapshot();
    const label = pending || "Change"; pending = "";
    if (s === hist.stack[hist.i]) return;
    hist.stack = hist.stack.slice(0, hist.i + 1); hist.meta = hist.meta.slice(0, hist.i + 1);
    hist.stack.push(s); hist.meta.push({ label, time: Date.now() });
    if (hist.stack.length > 100) { hist.stack.shift(); hist.meta.shift(); }
    hist.i = hist.stack.length - 1;
    persist(s);
    refreshUI();
  }
  const setSaved = (state, text) => { savedEl.dataset.state = state; $("em", savedEl).textContent = tr(text); };
  const persist = s => {
    clearTimeout(saveT);
    setSaved("busy", "Saving…");
    saveT = setTimeout(() => store.set("current", s).then(() => setSaved("ok", "Saved"))
      .catch(() => setSaved("err", "Not saved: download a project file")), 450);
  };
  function restore(s, { keepHistory = true, refit = false } = {}) {
    let d;
    try { d = typeof s === "string" ? JSON.parse(s) : s; } catch (e) { return Promise.reject(e); }
    if (!d || !d.canvas) return Promise.reject(new Error("not a design"));
    hist.busy++;
    doc.name = d.name || tr("Untitled design");
    nameIn.value = doc.name;
    doc.artboards = d.artboards && d.artboards.length ? d.artboards : [{ name: `${tr("Artboard")} 1`, x: 0, y: 0, w: d.W || 1080, h: d.H || 1080, bg: d.canvas.background || "#ffffff" }];
    doc.active = clamp(d.active || 0, 0, doc.artboards.length - 1);
    doc.guides = d.guides || { v: [], h: [] };
    brief = BRIEFS[d.brief] || null;
    const json = Object.assign({}, d.canvas);
    delete json.background;
    return new Promise(res => {
      cv.loadFromJSON(json, () => {
        cv.backgroundColor = null;
        cv.getObjects().forEach(o => applyToolState(o));
        loadFontsOf(cv.getObjects()).then(refreshText);
        if (refit) fitArtboard();
        cv.renderAll();
        hist.busy--;
        if (!keepHistory) { hist.stack = [snapshot()]; hist.meta = [{ label: "Open", time: Date.now() }]; hist.i = 0; }
        refreshUI();
        res();
      });
    });
  }
  const jump = i => {
    if (i < 0 || i >= hist.stack.length || i === hist.i) return;
    hist.i = i;
    restore(hist.stack[i]).then(() => persist(hist.stack[i]));
  };
  const step = d => jump(hist.i + d);
  cv.on({
    "object:added": e => { note(tr("Add") + " " + tr(e.target.name || typeName(e.target))); changed(); },
    "object:removed": () => { note("Delete"); changed(); },
    "object:modified": e => { note(tr("Edit") + " " + tr((e.target && (e.target.name || typeName(e.target))) || "")); changed(); }
  });
  nameIn.addEventListener("change", () => { doc.name = nameIn.value.trim() || tr("Untitled design"); note("Rename"); changed(); });
  nameIn.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === "Escape") nameIn.blur(); });

  /* =====================================================================
     Selection helpers and object actions
     ===================================================================== */
  const active = () => cv.getActiveObjects();
  const kindOf = o => (!o ? "none" : o.type === "activeSelection" ? "multi" : o.kind === "icon" ? "icon" : isText(o) ? "text" : o.type === "image" ? "image"
    : o.type === "group" ? (o.clipPath ? "masked" : "group") : o.kind === "vector" || o.type === "path" ? "path" : "shape");
  const typeName = o => {
    if (!o) return "No Selection";
    if (o.type === "activeSelection") return "Mixed Objects";
    if (o.type === "group" && o.clipPath) return "Clipping Group";
    return { rect: "Rectangle", ellipse: "Ellipse", circle: "Ellipse", triangle: "Path", line: "Line", polygon: "Path", path: "Path", textbox: "Text", "i-text": "Text", image: "Image", group: o.kind === "icon" ? "Icon" : "Group" }[o.type] || "Object";
  };
  const reselect = list => {
    cv.discardActiveObject();
    if (list.length === 1) cv.setActiveObject(list[0]);
    else if (list.length > 1) cv.setActiveObject(new F.ActiveSelection(list, { canvas: cv }));
    cv.requestRenderAll();
  };
  const lockState = (o, on) => o.set({ locked: on, hasControls: !on, lockMovementX: on, lockMovementY: on, lockScalingX: on, lockScalingY: on, lockRotation: on });
  const iconParts = o => (o.kind === "icon" && o.type === "group" ? o.getObjects() : [o]);
  function applyToolState(o) {
    const s = ["select", "direct", "distort", "crop-tool"].includes(tool);
    o.selectable = s;
    o.evented = !(tool === "pen" || tool === "hand" || tool === "zoom" || tool === "artboard");
    if (o.strokeUniform === undefined || o.__new) o.strokeUniform = !prefs.scaleStrokes;
  }
  function addObject(o, { select = true, at = null } = {}) {
    o.__new = true; applyToolState(o); delete o.__new;
    if (at) o.setPositionByOrigin(new F.Point(at.x, at.y), "center", "center");
    cv.add(o);
    o.setCoords();
    if (select) cv.setActiveObject(o);
    cv.requestRenderAll();
    return o;
  }
  const placeCentre = (o, scale = true) => {
    const a = ab(), k = scale ? unit() : 1;
    if (k !== 1) { if (isText(o)) o.set({ fontSize: o.fontSize * k, width: o.width * k }); else o.set({ scaleX: (o.scaleX || 1) * k, scaleY: (o.scaleY || 1) * k }); }
    if (o.initDimensions) o.initDimensions();
    return addObject(o, { at: { x: a.x + a.w / 2, y: a.y + a.h / 2 } });
  };
  function removeSel() {
    const list = active().filter(o => !o.locked);
    if (!list.length) return;
    cv.discardActiveObject();
    note("Delete");
    list.forEach(o => cv.remove(o));
    cv.requestRenderAll();
  }
  let clip = null;
  const copy = () => { const o = cv.getActiveObject(); if (o) o.clone(c => { clip = c; }, PROPS); };
  function paste(inPlace = false) {
    if (!clip) return;
    clip.clone(c => {
      cv.discardActiveObject();
      const off = inPlace ? 0 : 20 / zoom();
      c.set({ left: c.left + off, top: c.top + off, evented: true });
      note("Paste");
      if (c.type === "activeSelection") { c.canvas = cv; c.forEachObject(o => { applyToolState(o); cv.add(o); }); c.setCoords(); }
      else { applyToolState(c); cv.add(c); }
      if (!inPlace) clip.set({ left: clip.left + off, top: clip.top + off });
      cv.setActiveObject(c);
      cv.requestRenderAll();
    }, PROPS);
  }
  const duplicate = () => { const o = cv.getActiveObject(); if (!o) return; o.clone(c => { clip = c; note("Duplicate"); paste(); }, PROPS); };
  const cut = () => { copy(); removeSel(); };
  function align(dir) {
    const list = active();
    if (!list.length) return;
    const multi = list.length > 1;
    cv.discardActiveObject();
    const boxes = list.map(o => o.getBoundingRect(true, true));
    const a = ab();
    const ref = multi ? boxes.reduce((p, b) => {
      const l = Math.min(p.left, b.left), t = Math.min(p.top, b.top);
      return { left: l, top: t, width: Math.max(p.left + p.width, b.left + b.width) - l, height: Math.max(p.top + p.height, b.top + b.height) - t };
    }) : { left: a.x, top: a.y, width: a.w, height: a.h };
    list.forEach((o, i) => {
      const b = boxes[i];
      const dx = { left: ref.left - b.left, center: ref.left + ref.width / 2 - (b.left + b.width / 2), right: ref.left + ref.width - (b.left + b.width) }[dir] || 0;
      const dy = { top: ref.top - b.top, middle: ref.top + ref.height / 2 - (b.top + b.height / 2), bottom: ref.top + ref.height - (b.top + b.height) }[dir] || 0;
      o.set({ left: o.left + dx, top: o.top + dy }); o.setCoords();
    });
    reselect(list);
    note("Align"); changed();
  }
  function distribute(axis) {
    const list = active();
    if (list.length < 3) { toast(tr("Select three or more objects to distribute them.")); return; }
    cv.discardActiveObject();
    const items = list.map(o => ({ o, b: o.getBoundingRect(true, true) })).sort((p, q) => (axis === "h" ? p.b.left - q.b.left : p.b.top - q.b.top));
    const first = items[0].b, last = items[items.length - 1].b;
    const span = axis === "h" ? last.left + last.width - first.left : last.top + last.height - first.top;
    const total = items.reduce((s, it) => s + (axis === "h" ? it.b.width : it.b.height), 0);
    const gap = (span - total) / (items.length - 1);
    let cur = axis === "h" ? first.left : first.top;
    items.forEach(({ o, b }) => {
      if (axis === "h") { o.set("left", o.left + (cur - b.left)); cur += b.width + gap; } else { o.set("top", o.top + (cur - b.top)); cur += b.height + gap; }
      o.setCoords();
    });
    reselect(list.slice());
    note("Distribute"); changed();
  }
  const arrange = how => {
    const o = cv.getActiveObject();
    if (!o) return;
    ({ front: () => cv.bringToFront(o), back: () => cv.sendToBack(o), forward: () => cv.bringForward(o), backward: () => cv.sendBackwards(o) })[how]();
    cv.requestRenderAll(); note("Arrange"); changed();
  };
  const group = () => { const o = cv.getActiveObject(); if (o && o.type === "activeSelection") { const g = o.toGroup(); g.set({ name: "Group" }); applyToolState(g); cv.requestRenderAll(); note("Group"); changed(); } };
  const ungroup = () => {
    const o = cv.getActiveObject();
    if (!o || o.type !== "group") return;
    if (o.clipPath) { unmask(); return; }
    o.toActiveSelection(); cv.getActiveObjects().forEach(applyToolState); cv.requestRenderAll(); note("Ungroup"); changed();
  };

  /* ---------- Clipping masks: the top object shapes what's under it ---------- */
  function mask() {
    const list = active();
    if (list.length < 2) { toast(tr("Select a shape on top of what it should mask.")); return; }
    const objs = cv.getObjects().filter(o => list.includes(o));
    const shape = objs[objs.length - 1], rest = objs.slice(0, -1);
    if (isText(shape) || shape.type === "image" || shape.type === "group") { toast(tr("The top object must be a shape.")); return; }
    cv.discardActiveObject();
    const index = cv.getObjects().indexOf(rest[0]);
    hist.busy++;
    objs.forEach(o => cv.remove(o));
    hist.busy--;
    const g = new F.Group(rest, { name: "Clipping Group" });
    shape.clone(c => {
      const gc = g.getCenterPoint(), sc = shape.getCenterPoint();
      c.set({ left: sc.x - gc.x, top: sc.y - gc.y, originX: "center", originY: "center", absolutePositioned: false, fill: "#000", stroke: null, opacity: 1, shadow: null });
      g.clipPath = c;
      g.maskShape = shape.toObject(PROPS);
      applyToolState(g);
      note("Make Clipping Mask");
      cv.insertAt(g, Math.max(0, index));
      cv.setActiveObject(g);
      cv.requestRenderAll(); changed();
    }, PROPS);
  }
  function unmask() {
    const g = cv.getActiveObject();
    if (!g || g.type !== "group" || !g.clipPath) return;
    const data = g.maskShape;
    g.clipPath = null; delete g.maskShape;
    note("Release Clipping Mask");
    g.toActiveSelection();
    cv.getActiveObjects().forEach(applyToolState);
    if (data) F.util.enlivenObjects([data], ([shape]) => { if (shape) { applyToolState(shape); cv.add(shape); } cv.requestRenderAll(); changed(); });
    else { cv.requestRenderAll(); changed(); }
  }

  /* ---------- Combine shapes (paper.js boolean operations) ---------- */
  let paperReady = null;
  const ensurePaper = () => paperReady || (paperReady = (window.paper ? Promise.resolve() : loadScript("js/vendor/paper-core.min.js"))
    .then(() => { window.paper.setup(document.createElement("canvas")); }));
  // Outline of an object as SVG path data in scene coordinates
  function sceneData(o, keepOpen = false) {
    if (o.type === "path" && !o.anchors) {
      // fabric keeps paths as absolute M, L, C, Q and Z commands
      return o.path.map(c => {
        const [cmd, ...n] = c, pts = [];
        for (let i = 0; i < n.length; i += 2) { const p = toScene(o, n[i], n[i + 1]); pts.push(f2(p.x), f2(p.y)); }
        return cmd + " " + pts.join(" ");
      }).join(" ");
    }
    const v = asVector(o);
    if (!v) return null;
    const P = (x, y) => toScene(v, x, y), an = v.anchors;
    const pt = an.map(a => ({ p: P(a.x, a.y), i: P(a.x + a.ix, a.y + a.iy), o: P(a.x + a.ox, a.y + a.oy) }));
    const seg = (j, k) => ((an[j].ox || an[j].oy || an[k].ix || an[k].iy)
      ? ` C ${f2(pt[j].o.x)} ${f2(pt[j].o.y)} ${f2(pt[k].i.x)} ${f2(pt[k].i.y)} ${f2(pt[k].p.x)} ${f2(pt[k].p.y)}`
      : ` L ${f2(pt[k].p.x)} ${f2(pt[k].p.y)}`);
    let d = `M ${f2(pt[0].p.x)} ${f2(pt[0].p.y)}`;
    for (let i = 1; i < an.length; i++) d += seg(i - 1, i);
    return keepOpen && !v.closed ? d : d + seg(an.length - 1, 0) + " Z";
  }
  const combinable = () => cv.getObjects().filter(o => active().includes(o)).filter(o => !isText(o) && o.type !== "image" && o.type !== "group");
  async function combine(op) {
    const list = combinable();
    if (list.length < 2) { toast(tr("Select two or more shapes to combine.")); return; }
    cv.discardActiveObject();
    try { await ensurePaper(); } catch (e) { paperReady = null; toast(tr("Couldn't load the shape tools. Check your connection.")); return; }
    const P = window.paper;
    const items = list.map(o => P.PathItem.create(sceneData(o)));
    let res = items[0];
    for (let i = 1; i < items.length; i++) res = res[op](items[i]);
    const d = res.pathData;
    if (!d) { P.project.clear(); reselect(list); toast(tr("Nothing left after combining.")); return; }
    const base = list[0], label = { unite: "Union", subtract: "Subtract", intersect: "Intersect", exclude: "Exclude" }[op];
    const one = op !== "exclude" && fromPaper(res, Object.assign(styleOf(base), { fill: base.fill || "#1f7aff" }), label);
    const out = one && one.length === 1 ? one[0] : new F.Path(d, { fill: base.fill || "#1f7aff", stroke: base.stroke, strokeWidth: base.strokeWidth, opacity: base.opacity, shadow: base.shadow,
      fillRule: op === "exclude" ? "evenodd" : "nonzero", name: label, kind: "shape", strokeUniform: !prefs.scaleStrokes });
    P.project.clear();
    const index = cv.getObjects().indexOf(base);
    hist.busy++;
    list.forEach(o => cv.remove(o));
    hist.busy--;
    applyToolState(out);
    note(label);
    cv.insertAt(out, index);
    cv.setActiveObject(out);
    cv.requestRenderAll();
    changed(); refreshUI();
  }

  /* =====================================================================
     Paint: fill and stroke
     ===================================================================== */
  const toHex = c => {
    if (!c || typeof c !== "string") return null;
    try { return "#" + new F.Color(c).toHex().toLowerCase(); } catch (e) { return null; }
  };
  const isGrad = c => c && typeof c === "object" && c.colorStops;
  const paintCss = c => (isGrad(c) ? `linear-gradient(90deg, ${c.colorStops.map(s => `${s.color} ${round(s.offset * 100)}%`).join(", ")})` : toHex(c) || "transparent");
  const firstOf = (k, o = cv.getActiveObject()) => {
    if (!o) return paint[k];
    const t = o.type === "activeSelection" ? o.getObjects()[0] : o;
    const p = iconParts(t)[0];
    if (t.type === "group" && t.kind !== "icon") { const f = flat([t])[0]; return f ? f[k] : null; }
    return t.kind === "icon" && k === "fill" ? p.stroke : t.kind === "icon" ? null : p[k];
  };
  function setPaint(k, v, commitNow = true) {
    const list = active();
    if (!list.length) { paint[k] = v; if (k === "stroke" && v && !paint.strokeWidth) paint.strokeWidth = 2; syncPaint(); return; }
    list.forEach(o => {
      if (o.kind === "icon") { if (k === "fill") iconParts(o).forEach(p => p.set("stroke", v)); o.dirty = true; return; }
      if (o.type === "group") { flat([o]).forEach(p => { if (k === "fill" ? p.fill : p.stroke) p.set(k, v); }); o.dirty = true; return; }
      if (k === "fill" && o.type === "line") { o.set("stroke", v); return; }
      o.set(k, v);
      if (k === "stroke" && v && !o.strokeWidth) o.set("strokeWidth", 2);
    });
    cv.requestRenderAll();
    syncPaint();
    if (commitNow) { note(k === "fill" ? "Fill" : "Stroke"); changed(); }
  }
  function syncPaint() {
    const f = $(".cx-paint-f", root), s = $(".cx-paint-s", root);
    // with a selection the swatches show its colours, otherwise the colours for new shapes
    const sel = active().length > 0, fill = sel ? firstOf("fill") : paint.fill, stroke = sel ? firstOf("stroke") : paint.stroke;
    f.style.setProperty("--c", paintCss(fill)); f.classList.toggle("is-none", !fill);
    s.style.setProperty("--c", paintCss(stroke)); s.classList.toggle("is-none", !stroke);
    $("[data-paintin=fill]", root).value = toHex(isGrad(fill) ? fill.colorStops[0].color : fill) || "#ffffff";
    $("[data-paintin=stroke]", root).value = toHex(isGrad(stroke) ? stroke.colorStops[0].color : stroke) || "#000000";
    $("[data-paint]", root).dataset.focus = paint.focus;
  }
  // The swatches recolour the selection live (one undo step when the picker closes),
  // or set the colours for the next shapes when nothing is selected
  const paintIn = (e, done) => {
    const k = e.target.dataset.paintin;
    if (!k) return;
    paint.focus = k;
    if (active().length) { setPaint(k, e.target.value, done); if (done) refreshUI(); return; }
    paint[k] = e.target.value;
    if (k === "stroke" && !paint.strokeWidth) paint.strokeWidth = 2;
    syncPaint();
  };
  $("[data-paint]", root).addEventListener("input", e => paintIn(e, false));
  $("[data-paint]", root).addEventListener("change", e => paintIn(e, true));
  const swapPaint = () => {
    const f = firstOf("fill"), s = firstOf("stroke");
    if (!active().length) { paint.fill = s; paint.stroke = f; syncPaint(); return; }
    active().forEach(o => { if (o.type !== "group" && o.kind !== "icon") o.set({ fill: s, stroke: f, strokeWidth: f && !o.strokeWidth ? 2 : o.strokeWidth }); });
    cv.requestRenderAll(); syncPaint(); note("Swap Fill and Stroke"); changed(); refreshUI();
  };
  const defaultPaint = () => { Object.assign(paint, DEFAULT_PAINT); if (active().length) { setPaint("fill", DEFAULT_PAINT.fill); setPaint("stroke", null); } syncPaint(); refreshUI(); };
  function gradientFor(o, stops, type = "linear", angle = 0) {
    const w = o.width || 100, h = o.height || 100;
    const r = angle * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r), L = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    const cx = w / 2, cy = h / 2;   // gradient coordinates start at the object's top-left
    const coords = type === "radial"
      ? { x1: cx, y1: cy, r1: 0, x2: cx, y2: cy, r2: Math.max(w, h) / 2 }
      : { x1: cx - dx * L, y1: cy - dy * L, x2: cx + dx * L, y2: cy + dy * L };
    const g = new F.Gradient({ type, coords, colorStops: stops.map((c, i) => ({ offset: i / (stops.length - 1), color: c })) });
    g.angle = angle;
    return g;
  }
  function setGradient(stops, type = "linear", angle = 0) {
    active().forEach(o => { if (o.type !== "group" && o.kind !== "icon" && o.type !== "line") { o.set("fill", gradientFor(o, stops, type, angle)); o.dirty = true; } });
    cv.requestRenderAll(); note("Gradient"); changed(); refreshUI();
  }
  const gradStops = c => (isGrad(c) ? c.colorStops.map(s => toHex(s.color) || "#000000") : [toHex(c) || "#1f7aff", "#7c5cff"]);

  /* =====================================================================
     Tools
     ===================================================================== */
  let drag = null, pen = null, spaceHeld = false, toolBeforeSpace = null;
  const groupTool = {};
  function setTool(id, temp = false) {
    if (pen && id !== "pen") finishPen(false);
    if (curv && id !== "curvature") finishCurv(false);
    t2 = null; mouseBrush = null; sb = null;
    if (cv.getActiveObject() && cv.getActiveObject().isEditing) cv.getActiveObject().exitEditing();
    tool = id;
    if (!temp) TOOL_GROUPS.forEach(g => { if (g !== "|" && g.some(t => t[0] === id)) groupTool[g[0][0]] = id; });
    $$(".cx-tool[data-group]", root).forEach(b => {
      const g = JSON.parse(b.dataset.group), cur = g.includes(id) ? id : (groupTool[g[0]] || g[0]);
      if (b.dataset.tool !== cur) { b.dataset.tool = cur; b.innerHTML = ui(cur); const info = TOOL_INFO[cur]; b.setAttribute("aria-label", tr(info.name)); b.dataset.tip = tr(info.name) + (info.key ? ` · ${keyLabel(info.key)}` : ""); }
      b.classList.toggle("is-on", g.includes(id));
    });
    const drawing = id === "pencil" || id === "brush";
    cv.isDrawingMode = drawing;
    if (drawing) {
      const b = new F.PencilBrush(cv);
      b.color = toHex(paint.stroke) || toHex(paint.fill) || "#000000";
      b.width = id === "brush" ? Math.max(8, (paint.strokeWidth || 2) * 5) : Math.max(2, paint.strokeWidth || 2);
      b.strokeLineCap = "round"; b.strokeLineJoin = "round"; b.decimate = id === "brush" ? 2.5 : 1.5;
      cv.freeDrawingBrush = b;
    }
    cv.selection = id === "select" || id === "direct";
    cv.skipTargetFind = !["select", "direct", "type", "eyedropper", "gradient", "magic-wand", "typepath", "distort", "crop-tool"].includes(id);
    if (["eraser", "blob", "knife", "shapebuilder"].includes(id)) ensurePaper().catch(() => {});
    if (id === "shapebuilder") sbStart().then(ok => { if (!ok && tool === "shapebuilder") toast(tr("Select two or more overlapping shapes, then use the Shape Builder.")); });
    cv.getObjects().forEach(applyToolState);
    const cursors = { select: "default", direct: "default", pen: "crosshair", type: "text", line: "crosshair", rect: "crosshair", rounded: "crosshair", ellipse: "crosshair",
      polygon: "crosshair", star: "crosshair", rotate: "crosshair", scale: "crosshair", eyedropper: "copy", gradient: "crosshair", artboard: "default", hand: "grab", zoom: "zoom-in",
      lasso: "crosshair", "magic-wand": "pointer", "crop-tool": "default", distort: "default", typepath: "text", eraser: "none", blob: "none", "add-anchor": "copy", "del-anchor": "pointer", anchor: "pointer", shapebuilder: "cell" };
    cv.defaultCursor = cursors[id] || "crosshair";
    cv.hoverCursor = id === "select" || id === "direct" ? "move" : cv.defaultCursor;
    if (id === "artboard") { abSelected = doc.active; cv.discardActiveObject(); }
    setDirectControls();
    if (!temp) showHint();
    cv.requestRenderAll();
    if (!temp) refreshUI();
  }
  // the status bar names the current tool and how to use it
  const showHint = () => { hintEl.innerHTML = `<b>${tr(TOOL_INFO[tool].name)}</b><span>${tr(TOOL_HINT[tool])}</span>`; };
  dock.addEventListener("click", e => {
    const more = e.target.closest("[data-more]");
    if (more) { openFlyout(more.previousElementSibling); return; }
    const b = e.target.closest(".cx-tool[data-group]");
    if (b) { setTool(b.dataset.tool); return; }
    const a = e.target.closest("[data-act]");
    if (a) { act(a.dataset.act, a, e); return; }
    const p = e.target.closest("[data-paint] label");
    if (p) { paint.focus = p.classList.contains("cx-paint-f") ? "fill" : "stroke"; syncPaint(); }
  });
  dock.addEventListener("contextmenu", e => { const b = e.target.closest(".cx-tool[data-group]"); if (b && JSON.parse(b.dataset.group).length > 1) { e.preventDefault(); openFlyout(b); } });
  function openFlyout(b) {
    const g = JSON.parse(b.dataset.group);
    menuPop.innerHTML = g.map(id => `<button type="button" data-fly="${id}" class="${id === tool ? "is-checked" : ""}"><i>${ui(id)}</i><span>${tr(TOOL_INFO[id].name)}</span><kbd>${keyLabel(TOOL_INFO[id].key)}</kbd></button>`).join("");
    menuPop.dataset.mode = "fly";
    menuPop.hidden = false;
    const R = root.getBoundingClientRect(), r = b.getBoundingClientRect();
    if (innerWidth >= 900) {
      // beside the tool column
      menuPop.style.left = (r.right - R.left + 6) + "px";
      menuPop.style.top = clamp(r.top - R.top - 4, 8, R.height - menuPop.offsetHeight - 8) + "px";
    } else {
      menuPop.style.left = clamp(r.left - R.left - 8, 8, R.width - menuPop.offsetWidth - 8) + "px";
      menuPop.style.top = (r.top - R.top - menuPop.offsetHeight - 12) + "px";
    }
  }

  /* ---------- Measurement tip ---------- */
  function showMeasure(e, text) {
    const R = body.getBoundingClientRect();
    measureEl.textContent = text; measureEl.hidden = false;
    measureEl.style.transform = `translate(${Math.round(e.clientX - R.left + 14)}px, ${Math.round(e.clientY - R.top + 18)}px)`;
  }
  const hideMeasure = () => { measureEl.hidden = true; };

  /* ---------- Smart guides: snap to artboard, objects, ruler guides and grid ---------- */
  let smart = [];
  const snapTargets = exclude => {
    const xs = [], ys = [];
    const a = ab();
    if (a) { xs.push(a.x, a.x + a.w / 2, a.x + a.w); ys.push(a.y, a.y + a.h / 2, a.y + a.h); }
    if (view.guides) { xs.push(...doc.guides.v); ys.push(...doc.guides.h); }
    cv.getObjects().forEach(t => {
      if (exclude(t) || !t.visible) return;
      const r = t.getBoundingRect(true, true);
      xs.push(r.left, r.left + r.width / 2, r.left + r.width); ys.push(r.top, r.top + r.height / 2, r.top + r.height);
    });
    return { xs, ys };
  };
  const nearest = (targets, mine, th) => {
    let best = null;
    targets.forEach(v => mine.forEach(m => { const d = v - m; if (Math.abs(d) < th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, v }; }));
    return best;
  };
  function snapPoint(p, exclude = () => false) {
    if (view.snapGrid) { const g = prefs.gridSize, a = ab(); p.x = a.x + Math.round((p.x - a.x) / g) * g; p.y = a.y + Math.round((p.y - a.y) / g) * g; }
    else if (view.pixel) { p.x = Math.round(p.x); p.y = Math.round(p.y); }
    if (!view.smart) return p;
    const { xs, ys } = snapTargets(exclude), th = 6 / zoom();
    const bx = nearest(xs, [p.x], th), by = nearest(ys, [p.y], th);
    smart = [];
    if (bx) { p.x += bx.d; smart.push({ x: bx.v }); }
    if (by) { p.y += by.d; smart.push({ y: by.v }); }
    return p;
  }
  cv.on("object:moving", e => {
    const o = e.target;
    if (view.snapGrid) {
      const g = prefs.gridSize, a = ab(), b = o.getBoundingRect(true, true);
      o.left += a.x + Math.round((b.left - a.x) / g) * g - b.left; o.top += a.y + Math.round((b.top - a.y) / g) * g - b.top;
    } else if (view.pixel) { o.left = Math.round(o.left); o.top = Math.round(o.top); }
    smart = [];
    if (view.smart) {
      const b = o.getBoundingRect(true, true);
      const { xs, ys } = snapTargets(t => t === o || (o.type === "activeSelection" && o.contains(t))), th = 6 / zoom();
      const bx = nearest(xs, [b.left, b.left + b.width / 2, b.left + b.width], th);
      const by = nearest(ys, [b.top, b.top + b.height / 2, b.top + b.height], th);
      if (bx) { o.left += bx.d; smart.push({ x: bx.v }); }
      if (by) { o.top += by.d; smart.push({ y: by.v }); }
    }
    o.setCoords();
    if (o.__start) showMeasure(e.e, `Δx  ${round(o.left - o.__start.left)}\nΔy  ${round(o.top - o.__start.top)}`);
  });
  cv.on("object:scaling", e => { const o = e.target; showMeasure(e.e, `W  ${round(o.getScaledWidth())}\nH  ${round(o.getScaledHeight())}`); });
  cv.on("object:rotating", e => { showMeasure(e.e, `${round(e.target.angle, 1)}°`); });
  cv.on("before:transform", e => { const o = e.transform.target; o.__start = { left: o.left, top: o.top }; });
  cv.on("before:render", () => { if (cv.contextTop && !cv.isDrawingMode) cv.clearContext(cv.contextTop); });
  cv.on("after:render", () => drawTop());
  function drawTop() {
    const c = cv.contextTop;
    if (!c || exporting() || cv.isDrawingMode) return;
    const v = cv.viewportTransform;
    c.save();
    c.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    const z = v[0];
    if (smart.length) {
      c.strokeStyle = SMART; c.lineWidth = 1 / z;
      const inv = F.util.invertTransform(v), tl = F.util.transformPoint(new F.Point(0, 0), inv), br = F.util.transformPoint(new F.Point(cv.width, cv.height), inv);
      smart.forEach(g => { c.beginPath(); if (g.x != null) { c.moveTo(g.x, tl.y); c.lineTo(g.x, br.y); } else { c.moveTo(tl.x, g.y); c.lineTo(br.x, g.y); } c.stroke(); });
    }
    if (pen && pen.pts.length) {
      c.strokeStyle = "#1f7aff"; c.lineWidth = 1.5 / z;
      c.stroke(new Path2D(pathFrom(pen.pts, false)));
      const last = pen.pts[pen.pts.length - 1];
      if (pen.hover && !pen.down) {
        c.setLineDash([4 / z, 3 / z]);
        c.beginPath(); c.moveTo(last.x, last.y);
        c.bezierCurveTo(last.x + last.ox, last.y + last.oy, pen.hover.x, pen.hover.y, pen.hover.x, pen.hover.y); c.stroke();
        c.setLineDash([]);
      }
      pen.pts.forEach((p, i) => {
        if (p === last) [[p.ix, p.iy], [p.ox, p.oy]].forEach(([hx, hy]) => { if (hx || hy) { c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + hx, p.y + hy); c.stroke(); c.beginPath(); c.arc(p.x + hx, p.y + hy, 3 / z, 0, Math.PI * 2); c.fillStyle = "#1f7aff"; c.fill(); } });
        const s = (i === 0 && pen.closeHover ? 10 : 7) / z;
        c.fillStyle = i === pen.pts.length - 1 ? "#1f7aff" : "#ffffff"; c.fillRect(p.x - s / 2, p.y - s / 2, s, s); c.strokeRect(p.x - s / 2, p.y - s / 2, s, s);
      });
    }
    if (drag && drag.abNew) {
      c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z; c.setLineDash([5 / z, 4 / z]);
      c.strokeRect(drag.abNew.x, drag.abNew.y, drag.abNew.w, drag.abNew.h); c.setLineDash([]);
    }
    if (drag && drag.box && drag.kind === "type") {
      c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z; c.strokeRect(drag.box.x, drag.box.y, drag.box.w, drag.box.h);
    }
    if (TOOLS2[tool] && TOOLS2[tool].draw) TOOLS2[tool].draw(c, z);
    c.restore();
  }
  const topRender = () => { if (cv.contextTop) cv.clearContext(cv.contextTop); drawTop(); };

  /* ---------- Shapes drawn by dragging ---------- */
  const SHAPE_TOOLS = ["rect", "rounded", "ellipse", "polygon", "star", "line", "arc", "spiral", "rgrid", "pgrid"];
  const STAR = (n, inner = .42) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? inner : 1, a = Math.PI / n * i - Math.PI / 2; return { x: .5 + .5 * r * Math.cos(a), y: .5 + .5 * r * Math.sin(a) }; });
  const POLY = n => Array.from({ length: n }, (_, i) => { const a = Math.PI * 2 / n * i - Math.PI / 2; return { x: .5 + .5 * Math.cos(a), y: .5 + .5 * Math.sin(a) }; });
  // open paths and grids are drawn with the stroke colour (or the fill colour when there's no stroke)
  const lineLook = () => ({ fill: null, stroke: toHex(paint.stroke) || toHex(isGrad(paint.fill) ? null : paint.fill) || "#000000", strokeWidth: Math.max(1, paint.strokeWidth || 2), strokeLineCap: "round", strokeLineJoin: "round", strokeUniform: !prefs.scaleStrokes });
  const shapePaint = () => ({ fill: paint.fill, stroke: paint.stroke, strokeWidth: paint.stroke ? paint.strokeWidth : 0, strokeUniform: !prefs.scaleStrokes });
  function shapeBox(p0, p, e) {
    let w = p.x - p0.x, h = p.y - p0.y;
    if (e && e.shiftKey) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
    if (e && e.altKey) return { x: p0.x - Math.abs(w), y: p0.y - Math.abs(h), w: Math.abs(w) * 2, h: Math.abs(h) * 2 };
    return { x: Math.min(p0.x, p0.x + w), y: Math.min(p0.y, p0.y + h), w: Math.abs(w), h: Math.abs(h) };
  }
  function makeShape(kind, b, p0, p1, e) {
    const st = shapePaint();
    switch (kind) {
      case "rect": return new F.Rect(Object.assign({ left: b.x, top: b.y, width: b.w, height: b.h, name: "Rectangle", kind: "shape" }, st));
      case "rounded": { const r = Math.min(24, b.w / 4, b.h / 4); return new F.Rect(Object.assign({ left: b.x, top: b.y, width: b.w, height: b.h, rx: r, ry: r, name: "Rounded Rectangle", kind: "shape" }, st)); }
      case "ellipse": return new F.Ellipse(Object.assign({ left: b.x, top: b.y, rx: b.w / 2, ry: b.h / 2, name: "Ellipse", kind: "shape" }, st));
      case "polygon": case "star": {
        const unitPts = kind === "star" ? STAR(5) : POLY(6);
        return vector(unitPts.map(q => A(b.x + q.x * b.w, b.y + q.y * b.h)), true, Object.assign({ name: kind === "star" ? "Star" : "Polygon" }, st));
      }
      case "line": {
        let x2 = p1.x, y2 = p1.y;
        if (e && e.shiftKey) { const ang = Math.round(Math.atan2(y2 - p0.y, x2 - p0.x) / (Math.PI / 4)) * Math.PI / 4, len = Math.hypot(x2 - p0.x, y2 - p0.y); x2 = p0.x + Math.cos(ang) * len; y2 = p0.y + Math.sin(ang) * len; }
        return new F.Line([p0.x, p0.y, x2, y2], { stroke: toHex(paint.stroke) || toHex(paint.fill) || "#000000", strokeWidth: Math.max(1, paint.strokeWidth || 2), strokeLineCap: "round", strokeUniform: !prefs.scaleStrokes, name: "Line", kind: "shape" });
      }
      case "arc": {
        // a quarter ellipse from where the drag starts to where it ends
        let x1 = p1.x, y1 = p1.y;
        if (e && e.shiftKey) { const m = Math.max(Math.abs(x1 - p0.x), Math.abs(y1 - p0.y)); x1 = p0.x + Math.sign(x1 - p0.x || 1) * m; y1 = p0.y + Math.sign(y1 - p0.y || 1) * m; }
        return vector([A(p0.x, p0.y, 0, 0, 0, K * (y1 - p0.y)), A(x1, y1, -K * (x1 - p0.x), 0, 0, 0)], false, Object.assign({ name: "Arc" }, lineLook()));
      }
      case "spiral": {
        // an Archimedean spiral: four turns, drawn out from the centre
        const R = Math.max(1, Math.hypot(p1.x - p0.x, p1.y - p0.y)), a0 = Math.atan2(p1.y - p0.y, p1.x - p0.x), turns = 4, n = turns * 8;
        const pts = Array.from({ length: n + 1 }, (_, i) => { const a = a0 + i / n * turns * Math.PI * 2, r = R * (1 - i / n); return { x: p0.x + Math.cos(a) * r, y: p0.y + Math.sin(a) * r }; });
        return vector(curvAnchors(pts, false), false, Object.assign({ name: "Spiral" }, lineLook()));
      }
      case "rgrid": {
        const cols = 5, rows = 5;
        let d = `M ${f2(b.x)} ${f2(b.y)} H ${f2(b.x + b.w)} V ${f2(b.y + b.h)} H ${f2(b.x)} Z`;
        for (let i = 1; i < cols; i++) d += ` M ${f2(b.x + b.w * i / cols)} ${f2(b.y)} V ${f2(b.y + b.h)}`;
        for (let i = 1; i < rows; i++) d += ` M ${f2(b.x)} ${f2(b.y + b.h * i / rows)} H ${f2(b.x + b.w)}`;
        return new F.Path(d, Object.assign({ name: "Rectangular Grid", kind: "shape" }, lineLook()));
      }
      case "pgrid": {
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2, rings = 4, spokes = 8;
        let d = "";
        for (let i = 1; i <= rings; i++) {
          const rx = b.w / 2 * i / rings, ry = b.h / 2 * i / rings, kx = K * rx, ky = K * ry;
          d += ` M ${f2(cx + rx)} ${f2(cy)} C ${f2(cx + rx)} ${f2(cy + ky)} ${f2(cx + kx)} ${f2(cy + ry)} ${f2(cx)} ${f2(cy + ry)} C ${f2(cx - kx)} ${f2(cy + ry)} ${f2(cx - rx)} ${f2(cy + ky)} ${f2(cx - rx)} ${f2(cy)}`
            + ` C ${f2(cx - rx)} ${f2(cy - ky)} ${f2(cx - kx)} ${f2(cy - ry)} ${f2(cx)} ${f2(cy - ry)} C ${f2(cx + kx)} ${f2(cy - ry)} ${f2(cx + rx)} ${f2(cy - ky)} ${f2(cx + rx)} ${f2(cy)} Z`;
        }
        for (let i = 0; i < spokes; i++) { const a = i / spokes * Math.PI * 2; d += ` M ${f2(cx)} ${f2(cy)} L ${f2(cx + Math.cos(a) * b.w / 2)} ${f2(cy + Math.sin(a) * b.h / 2)}`; }
        return new F.Path(d.trim(), Object.assign({ name: "Polar Grid", kind: "shape" }, lineLook()));
      }
      default: return null;
    }
  }

  /* ---------- Pen ---------- */
  function finishPen(closed) {
    if (!pen) return;
    const pts = pen.pts;
    pen = null;
    if (pts.length >= 2) {
      const o = vector(pts.map(p => Object.assign({}, p)), closed, {
        fill: closed ? paint.fill : null, stroke: paint.stroke || (closed ? null : "#000000"), strokeWidth: Math.max(1, paint.strokeWidth || 2), strokeUniform: !prefs.scaleStrokes, name: "Path"
      });
      if (!o.stroke && !o.fill) o.set({ stroke: "#000000" });
      addObject(o);
    }
    topRender();
  }

  /* ---------- Curvature: click points and the curve flows through them ---------- */
  let curv = null;
  const curvAnchors = (pts, closed) => {
    const n = pts.length;
    return pts.map((q, i) => {
      if (q.corner) return A(q.x, q.y);
      const prev = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], next = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      const tx = (next.x - prev.x) / 6, ty = (next.y - prev.y) / 6;
      return A(q.x, q.y, -tx, -ty, tx, ty);
    });
  };
  function finishCurv(closed) {
    if (!curv) return;
    const pts = curv.pts;
    curv = null;
    if (pts.length >= 2) {
      const o = vector(curvAnchors(pts, closed), closed, {
        fill: closed ? paint.fill : null, stroke: paint.stroke || (closed ? null : "#000000"), strokeWidth: Math.max(1, paint.strokeWidth || 2), strokeUniform: !prefs.scaleStrokes, name: "Path"
      });
      if (!o.stroke && !o.fill) o.set({ stroke: "#000000" });
      addObject(o);
    }
    topRender();
  }

  /* ---------- Path geometry shared by the anchor, cutting and distort tools ---------- */
  const editable = o => !!o && o.visible !== false && !o.locked && !isText(o) && o.type !== "image" && o.type !== "group" && o.type !== "activeSelection";
  const styleOf = o => ({ fill: o.fill, stroke: o.stroke, strokeWidth: o.strokeWidth, strokeUniform: o.strokeUniform, strokeDashArray: o.strokeDashArray,
    strokeLineCap: o.strokeLineCap, strokeLineJoin: o.strokeLineJoin, opacity: o.opacity, shadow: o.shadow, globalCompositeOperation: o.globalCompositeOperation });
  // anchors in scene coordinates (handles stay relative to their anchor)
  const sceneAnchors = v => v.anchors.map(a => {
    const p = toScene(v, a.x, a.y), i = toScene(v, a.x + a.ix, a.y + a.iy), q = toScene(v, a.x + a.ox, a.y + a.oy);
    return A(p.x, p.y, i.x - p.x, i.y - p.y, q.x - p.x, q.y - p.y);
  });
  const reversed = pts => pts.slice().reverse().map(a => A(a.x, a.y, a.ox, a.oy, a.ix, a.iy));
  const bez = (c, t) => { const u = 1 - t; return { x: u * u * u * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t * t * t * c[3].x, y: u * u * u * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t * t * t * c[3].y }; };
  const isOpenPath = o => (o.kind === "vector" ? !o.closed : o.type === "line" || o.type === "polyline" || (o.type === "path" && !o.fill));
  // the path segment nearest to p, on the top-most object within tol: { o, j, t, pt }
  function segmentAt(p, tol = 6 / zoom()) {
    for (const o of cv.getObjects().slice().reverse()) {
      if (!editable(o)) continue;
      const v = o.kind === "vector" ? o : asVector(o);
      if (!v) continue;
      const sa = sceneAnchors(v), n = sa.length;
      let best = null;
      for (let j = 0; j < (v.closed ? n : n - 1); j++) {
        const a = sa[j], b = sa[(j + 1) % n], c = [a, { x: a.x + a.ox, y: a.y + a.oy }, { x: b.x + b.ix, y: b.y + b.iy }, b];
        let bt = 0, bd = Infinity;
        for (let s = 0; s <= 48; s++) { const q = bez(c, s / 48), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; bt = s / 48; } }
        for (let st = 1 / 96; st > 1e-4; st /= 2) [bt - st, bt + st].forEach(t => { if (t < 0 || t > 1) return; const q = bez(c, t), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; bt = t; } });
        if (bd < tol && (!best || bd < best.d)) best = { o, j, t: bt, d: bd, pt: bez(c, bt) };
      }
      if (best) return best;
    }
    return null;
  }
  // the anchor point nearest to p: { o, i, pt }
  function anchorAt(p, tol = 7 / zoom()) {
    for (const o of cv.getObjects().slice().reverse()) {
      if (!editable(o)) continue;
      const v = o.kind === "vector" ? o : asVector(o);
      if (!v) continue;
      let best = null;
      sceneAnchors(v).forEach((a, i) => { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < tol && (!best || d < best.d)) best = { o, i, d, pt: a }; });
      if (best) return best;
    }
    return null;
  }
  // live shapes become editable paths the moment a tool needs their points
  const ensureVector = o => (o.kind === "vector" ? o : expand(o));
  // split segment j at t (de Casteljau); returns the new anchor's index
  function splitAt(v, j, t) {
    const an = v.anchors, n = an.length, a = an[j], b = an[(j + 1) % n];
    const curved = a.ox || a.oy || b.ix || b.iy;
    const L = (u, w) => ({ x: u.x + (w.x - u.x) * t, y: u.y + (w.y - u.y) * t });
    const p0 = { x: a.x, y: a.y }, p1 = { x: a.x + a.ox, y: a.y + a.oy }, p2 = { x: b.x + b.ix, y: b.y + b.iy }, p3 = { x: b.x, y: b.y };
    const p01 = L(p0, p1), p12 = L(p1, p2), p23 = L(p2, p3), p012 = L(p01, p12), p123 = L(p12, p23), m = L(p012, p123);
    const N = curved ? A(m.x, m.y, p012.x - m.x, p012.y - m.y, p123.x - m.x, p123.y - m.y) : A(m.x, m.y);
    if (curved) { a.ox = p01.x - a.x; a.oy = p01.y - a.y; b.ix = p23.x - b.x; b.iy = p23.y - b.y; }
    an.splice(j + 1, 0, N);
    return j + 1;
  }
  const refreshPath = v => { rebuild(v); if (v.__direct === "direct") v.controls = vectorControls(v); cv.requestRenderAll(); };
  function replaceObj(o, list) {
    const i = cv.getObjects().indexOf(o);
    hist.busy++;
    cv.remove(o);
    list.forEach((n, k) => { applyToolState(n); cv.insertAt(n, i + k); n.setCoords(); });
    hist.busy--;
  }

  function addAnchorAt(p) {
    const h = segmentAt(p);
    if (!h) return;
    const v = ensureVector(h.o);
    splitAt(v, h.j, h.t);
    refreshPath(v); note("Add Anchor Point"); changed();
  }
  function deleteAnchorAt(p) {
    const h = anchorAt(p);
    if (!h) return;
    const v = ensureVector(h.o);
    if (v.anchors.length <= (v.closed ? 3 : 2)) { toast(tr("A path needs at least that many points.")); return; }
    v.anchors.splice(h.i, 1);
    refreshPath(v); note("Delete Anchor Point"); changed();
  }
  function cutAt(p) {
    const h = segmentAt(p);
    if (!h) return;
    const v = ensureVector(h.o), k = splitAt(v, h.j, h.t), an = v.anchors;
    if (v.closed) {
      // the closed path opens at the cut
      const pts = [...an.slice(k), ...an.slice(0, k + 1)].map(a => Object.assign({}, a));
      pts[0].ix = pts[0].iy = 0; pts[pts.length - 1].ox = pts[pts.length - 1].oy = 0;
      v.anchors = pts; v.closed = false;
      refreshPath(v);
    } else {
      // an open path becomes two paths
      const sa = sceneAnchors(v), second = sa.slice(k).map(a => Object.assign({}, a));
      second[0].ix = second[0].iy = 0;
      v.anchors = an.slice(0, k + 1); v.anchors[k].ox = v.anchors[k].oy = 0;
      refreshPath(v);
      if (second.length > 1) { const w = vector(second, false, Object.assign(styleOf(v), { name: v.name || "Path" })); hist.busy++; applyToolState(w); cv.insertAt(w, cv.getObjects().indexOf(v) + 1); hist.busy--; }
    }
    note("Cut Path"); changed(); refreshUI();
  }

  /* ---------- paper.js results back into objects ---------- */
  // Single outlines become editable paths; outlines with holes stay compound paths
  function fromPaper(item, style, name) {
    const parts = (item.children ? item.children.slice() : [item]).filter(c => c.segments && c.segments.length > 1);
    if (!parts.length) return [];
    const toAnchors = path => path.segments.map(sg => A(sg.point.x, sg.point.y, sg.handleIn.x, sg.handleIn.y, sg.handleOut.x, sg.handleOut.y));
    const outerDir = parts.reduce((b, c) => (Math.abs(c.area) > Math.abs(b.area) ? c : b)).clockwise;
    const outers = parts.filter(c => c.clockwise === outerDir), holes = parts.filter(c => c.clockwise !== outerDir);
    return outers.map(out => {
      const mine = holes.filter(h => out.contains(h.interiorPoint));
      const opts = Object.assign({}, style, { name, strokeUniform: !prefs.scaleStrokes });
      if (!mine.length) return vector(toAnchors(out), out.closed, opts);
      return new F.Path([out, ...mine].map(c => c.pathData).join(" "), Object.assign(opts, { fillRule: "evenodd", kind: "shape" }));
    });
  }
  const paperOf = o => { const d = sceneData(o); return d ? window.paper.PathItem.create(d) : null; };
  const boxHit = (o, b) => { const r = o.getBoundingRect(true, true); return !(r.left > b.right || r.left + r.width < b.left || r.top > b.bottom || r.top + r.height < b.top); };
  // the outline of a round brush dragged through pts
  function strokeOutline(pts, r) {
    const P = window.paper;
    const kept = pts.filter((q, i) => i === 0 || i === pts.length - 1 || Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) > 0);
    const step = [kept[0]];
    kept.forEach(q => { const l = step[step.length - 1]; if (Math.hypot(q.x - l.x, q.y - l.y) >= r * .5) step.push(q); });
    if (step[step.length - 1] !== kept[kept.length - 1]) step.push(kept[kept.length - 1]);
    let res = new P.Path.Circle(new P.Point(step[0].x, step[0].y), r);
    for (let i = 1; i < step.length; i++) {
      const a = step[i - 1], b = step[i], L = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / L * r, ny = (b.x - a.x) / L * r;
      const quad = new P.Path({ segments: [[a.x + nx, a.y + ny], [b.x + nx, b.y + ny], [b.x - nx, b.y - ny], [a.x - nx, a.y - ny]], closed: true });
      const dot = new P.Path.Circle(new P.Point(b.x, b.y), r);
      const next = res.unite(quad).unite(dot);
      [res, quad, dot].forEach(x => x.remove());
      res = next;
    }
    return res;
  }
  // which objects a cutting stroke can change: filled, closed shapes and paths
  const cuttable = o => editable(o) && !!o.fill && !isOpenPath(o);

  async function eraseAlong(pts, r) {
    await ensurePaper();
    const cut = strokeOutline(pts, r), cb = cut.bounds;
    let touched = 0;
    cv.getObjects().slice().forEach(o => {
      if (!cuttable(o) || !boxHit(o, cb)) return;
      const item = paperOf(o);
      if (!item) return;
      const res = item.subtract(cut);
      if (Math.abs(Math.abs(res.area) - Math.abs(item.area)) < .5) return;
      touched++;
      replaceObj(o, fromPaper(res, styleOf(o), o.name || "Path"));
    });
    window.paper.project.clear();
    if (touched) { cv.discardActiveObject(); note("Erase"); changed(); refreshUI(); }
    cv.requestRenderAll();
  }
  async function blobAlong(pts, r) {
    await ensurePaper();
    let shape = strokeOutline(pts, r);
    const fill = toHex(isGrad(paint.fill) ? null : paint.fill) || toHex(paint.stroke) || "#000000";
    // touching blobs of the same colour join the new one
    const merge = cv.getObjects().filter(o => o.name === "Blob" && toHex(o.fill) === fill && editable(o) && boxHit(o, shape.bounds));
    let at = cv.getObjects().length;
    merge.forEach(o => {
      const item = paperOf(o);
      if (!item || !(item.intersects(shape) || item.contains(shape.interiorPoint) || shape.contains(item.interiorPoint))) return;
      shape = shape.unite(item);
      at = Math.min(at, cv.getObjects().indexOf(o));
      hist.busy++; cv.remove(o); hist.busy--;
    });
    const out = fromPaper(shape, { fill, stroke: null, strokeWidth: 0 }, "Blob");
    window.paper.project.clear();
    hist.busy++;
    out.forEach((n, k) => { applyToolState(n); cv.insertAt(n, at + k); n.setCoords(); });
    hist.busy--;
    note(tr("Draw") + " " + tr("Blob")); changed(); cv.requestRenderAll(); refreshUI();
  }
  async function knifeAlong(pts) {
    if (pts.length < 2) return;
    await ensurePaper();
    const blade = strokeOutline(pts, .35 / zoom()), bb = blade.bounds;
    let touched = 0;
    cv.getObjects().slice().forEach(o => {
      if (!cuttable(o) || !boxHit(o, bb)) return;
      const item = paperOf(o);
      if (!item || !item.intersects(blade)) return;
      const pieces = fromPaper(item.subtract(blade), styleOf(o), o.name || "Path");
      if (pieces.length < 2) return;
      touched++;
      replaceObj(o, pieces);
    });
    window.paper.project.clear();
    if (touched) { cv.discardActiveObject(); note("Knife"); changed(); refreshUI(); } else toast(tr("Drag all the way across a filled shape to slice it."));
    cv.requestRenderAll();
  }

  /* ---------- Shape Builder: merge or remove the areas where shapes overlap ---------- */
  let sb = null;
  async function sbStart(list = combinable()) {
    sb = null;
    if (list.length < 2) return false;
    // objects inside a multiple selection report positions relative to it, so let it go first
    if (cv.getActiveObject() && cv.getActiveObject().type === "activeSelection") cv.discardActiveObject();
    await ensurePaper();
    window.paper.project.clear();
    sb = { shapes: list, items: list.map(o => window.paper.PathItem.create(sceneData(o))), hover: null, picks: null };
    cv.requestRenderAll(); renderCtrl(); topRender();
    return true;
  }
  function sbRegion(p) {
    const P = window.paper, pt = new P.Point(p.x, p.y);
    const inside = sb.items.map((it, i) => (it.contains(pt) ? i : -1)).filter(i => i > -1);
    if (!inside.length) return null;
    let r = sb.items[inside[0]].clone({ insert: false });
    inside.slice(1).forEach(i => { r = r.intersect(sb.items[i], { insert: false }); });
    sb.items.forEach((it, i) => { if (!inside.includes(i)) r = r.subtract(it, { insert: false }); });
    return { key: inside.join(","), inside, path: r, d: r.pathData };
  }
  function sbFinish(remove) {
    const picks = Object.values(sb.picks || {});
    sb.picks = null;
    if (!picks.length) return;
    let area = picks[0].path;
    picks.slice(1).forEach(r => { area = area.unite(r.path, { insert: false }); });
    const order = cv.getObjects(), involved = [...new Set(picks.flatMap(r => r.inside))];
    const top = involved.reduce((b, i) => (order.indexOf(sb.shapes[i]) > order.indexOf(sb.shapes[b]) ? i : b), involved[0]);
    const kept = [];
    let insertAt = order.indexOf(sb.shapes[top]) + 1;
    sb.shapes.forEach((o, i) => {
      if (!involved.includes(i)) { kept.push(o); return; }
      const rest = fromPaper(sb.items[i].subtract(area, { insert: false }), styleOf(o), o.name || "Shape");
      if (cv.getObjects().indexOf(o) < insertAt) insertAt += rest.length - 1;
      replaceObj(o, rest);
      kept.push(...rest);
    });
    if (!remove) {
      const made = fromPaper(area, styleOf(sb.shapes[top]), "Shape");
      hist.busy++;
      made.forEach((n, k) => { applyToolState(n); cv.insertAt(n, Math.min(insertAt + k, cv.getObjects().length)); n.setCoords(); });
      hist.busy--;
      kept.push(...made);
    }
    note(remove ? "Shape Builder: Remove" : "Shape Builder: Merge"); changed();
    sbStart(kept.filter(o => cv.getObjects().includes(o))).then(() => { refreshUI(); topRender(); });
  }

  /* ---------- Type on a path ---------- */
  function typeOnPath(o) {
    const d = o && !isText(o) && sceneData(o, true);
    if (!d) { toast(tr("Click a path or shape to type along it.")); return; }
    const path = new F.Path(d, { fill: null, stroke: null, strokeWidth: 0 });
    const fill = toHex(paint.fill) && !["#ffffff", DEFAULT_PAINT.fill].includes(toHex(paint.fill)) ? paint.fill : "#0f0f0f";
    const size = Math.max(12, Math.round(Math.min(64 * unit(), Math.max(path.width, path.height) / 8)));
    const t = new F.IText(tr("Type along the path"), { fontFamily: charState.family, fontWeight: charState.weight, fontSize: size, fill, path, left: path.left, top: path.top, name: "Text on Path", kind: "text", charSpacing: 0 });
    loadFont(charState.family, charState.weight).then(() => {
      setTool("select");
      addObject(t);
      t.enterEditing(); t.selectAll();
      refreshUI();
    });
  }

  /* ---------- Free Distort: drag the four corners ---------- */
  function startDistort(v) {
    const xs = v.anchors.map(a => a.x), ys = v.anchors.map(a => a.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
    v.__dist = { x0, y0, w: Math.max(1e-6, x1 - x0), h: Math.max(1e-6, y1 - y0), a0: v.anchors.map(a => Object.assign({}, a)), c: [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x1, y: y1 }, { x: x0, y: y1 }] };
    const dist = v.__dist;
    const map = (x, y) => {
      const u = (x - dist.x0) / dist.w, w = (y - dist.y0) / dist.h, [a, b, c, d] = dist.c;
      return { x: (1 - u) * (1 - w) * a.x + u * (1 - w) * b.x + u * w * c.x + (1 - u) * w * d.x, y: (1 - u) * (1 - w) * a.y + u * (1 - w) * b.y + u * w * c.y + (1 - u) * w * d.y };
    };
    const controls = {};
    dist.c.forEach((cn, k) => {
      controls["d" + k] = new F.Control({
        positionHandler: (dim, m, obj) => F.util.transformPoint(new F.Point(dist.c[k].x - obj.pathOffset.x, dist.c[k].y - obj.pathOffset.y), F.util.multiplyTransformMatrices(obj.canvas.viewportTransform, obj.calcTransformMatrix())),
        cursorStyle: "crosshair", actionName: "distort",
        actionHandler: (e, tr2, x, y) => {
          dist.c[k] = toLocal(v, x, y);
          v.anchors = dist.a0.map(a => {
            const p = map(a.x, a.y), i = map(a.x + a.ix, a.y + a.iy), q = map(a.x + a.ox, a.y + a.oy);
            return A(p.x, p.y, i.x - p.x, i.y - p.y, q.x - p.x, q.y - p.y);
          });
          rebuild(v);
          return true;
        },
        render: (ctx, left, top) => { ctx.save(); ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#1f7aff"; ctx.lineWidth = 1.5; ctx.fillRect(left - 4, top - 4, 8, 8); ctx.strokeRect(left - 4, top - 4, 8, 8); ctx.restore(); }
      });
    });
    v.controls = controls; v.hasBorders = false; v.__direct = "distort";
  }

  /* ---------- Crop Image: drag the edges of a picture ---------- */
  function cropControls(o) {
    const el = o.getElement(), W = el.naturalWidth || el.width, H = el.naturalHeight || el.height;
    const M = () => o.calcTransformMatrix();
    const edges = { l: [-1, 0], r: [1, 0], t: [0, -1], b: [0, 1], tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1] };
    const controls = {};
    Object.entries(edges).forEach(([key, [ex, ey]]) => {
      controls["c" + key] = new F.Control({
        x: ex / 2, y: ey / 2, cursorStyle: ex && ey ? (ex * ey > 0 ? "nwse-resize" : "nesw-resize") : ex ? "ew-resize" : "ns-resize", actionName: "crop",
        actionHandler: (e, t, x, y) => {
          const l = F.util.transformPoint(new F.Point(x, y), F.util.invertTransform(M()));
          let dx = 0, dy = 0, cx = o.cropX || 0, cy = o.cropY || 0, w = o.width, h = o.height;
          if (ex < 0) { const nl = clamp(l.x, -w / 2 - cx, w / 2 - 8); dx = nl + w / 2; cx += dx; w -= dx; }
          if (ex > 0) { const nr = clamp(l.x, -w / 2 + 8, w / 2 + (W - cx - w)); dx = nr - w / 2; w += dx; }
          if (ey < 0) { const nt = clamp(l.y, -h / 2 - cy, h / 2 - 8); dy = nt + h / 2; cy += dy; h -= dy; }
          if (ey > 0) { const nb = clamp(l.y, -h / 2 + 8, h / 2 + (H - cy - h)); dy = nb - h / 2; h += dy; }
          const c = F.util.transformPoint(new F.Point(dx / 2, dy / 2), M());
          o.set({ cropX: cx, cropY: cy, width: w, height: h });
          if (o.kindRadius) { const r = o.kindRadius / (o.scaleX || 1); o.set("clipPath", new F.Rect({ width: w, height: h, rx: r, ry: r, originX: "center", originY: "center" })); }
          o.setPositionByOrigin(c, "center", "center");
          o.setCoords();
          return true;
        },
        render: (ctx, left, top) => {
          ctx.save(); ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#1f7aff"; ctx.lineWidth = 1.5;
          if (ex && ey) { ctx.fillRect(left - 4.5, top - 4.5, 9, 9); ctx.strokeRect(left - 4.5, top - 4.5, 9, 9); }
          else { const w2 = ex ? 4 : 12, h2 = ex ? 12 : 4; ctx.fillRect(left - w2 / 2, top - h2 / 2, w2, h2); ctx.strokeRect(left - w2 / 2, top - h2 / 2, w2, h2); }
          ctx.restore();
        }
      });
    });
    return controls;
  }

  /* ---------- Join, Simplify, Blend ---------- */
  function joinPaths() {
    const list = active().filter(o => editable(o) && isOpenPath(o));
    if (list.length === 1) { const v = ensureVector(list[0]); v.closed = true; refreshPath(v); note("Join"); changed(); refreshUI(); return; }
    if (list.length !== 2) { toast(tr("Select one or two open paths to join.")); return; }
    cv.discardActiveObject();
    const [v1, v2] = list.map(ensureVector);
    let a = sceneAnchors(v1), b = sceneAnchors(v2);
    const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y), ends = [[d(a[a.length - 1], b[0]), 0], [d(a[a.length - 1], b[b.length - 1]), 1], [d(a[0], b[0]), 2], [d(a[0], b[b.length - 1]), 3]].sort((x, y) => x[0] - y[0])[0];
    if (ends[1] === 1) b = reversed(b);
    if (ends[1] === 2) a = reversed(a);
    if (ends[1] === 3) { a = reversed(a); b = reversed(b); }
    const last = a[a.length - 1], first = b[0];
    const pts = d(last, first) < 4 / zoom() ? [...a.slice(0, -1), A((last.x + first.x) / 2, (last.y + first.y) / 2, last.ix, last.iy, first.ox, first.oy), ...b.slice(1)] : [...a, ...b];
    const out = vector(pts, false, Object.assign(styleOf(v1), { name: v1.name || "Path" }));
    hist.busy++; cv.remove(v2); hist.busy--;
    replaceObj(v1, [out]);
    cv.setActiveObject(out); note("Join"); changed(); refreshUI();
  }
  async function simplifyPaths() {
    const list = combinable();
    if (!list.length) { toast(tr("Select a path to simplify.")); return; }
    await ensurePaper();
    cv.discardActiveObject();
    const made = [];
    list.forEach(o => {
      const item = paperOf(o);
      if (!item) return;
      const tol = Math.max(.5, 2.5 / zoom());
      (item.children || [item]).forEach(c => c.simplify && c.simplify(tol));
      const out = fromPaper(item, styleOf(o), o.name || "Path");
      if (out.length) { replaceObj(o, out); made.push(...out); }
    });
    window.paper.project.clear();
    reselect(made); note("Simplify"); changed(); refreshUI();
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixColour = (x, y, t) => {
    const X = toHex(x), Y = toHex(y);
    if (!X || !Y) return t < .5 ? x : y;
    const p = new F.Color(X).getSource(), q = new F.Color(Y).getSource();
    return "#" + new F.Color(`rgb(${[0, 1, 2].map(i => Math.round(lerp(p[i], q[i], t))).join(",")})`).toHex().toLowerCase();
  };
  // evenly spaced points round an outline, starting from its top-most point
  function samplePoints(o, n) {
    const P = window.paper, item = paperOf(o);
    const path = item.children ? item.children[0] : item, L = path.length;
    const pts = Array.from({ length: n }, (_, i) => path.getPointAt(L * i / n));
    const s = pts.reduce((b, p, i) => (p.y < pts[b].y ? i : b), 0);
    const out = [...pts.slice(s), ...pts.slice(0, s)].map(p => A(p.x, p.y));
    return path.clockwise ? out : [out[0], ...out.slice(1).reverse()];
  }
  function blendDialog() {
    if (active().length !== 2) { toast(tr("Select two objects to blend between.")); return; }
    openDialog("Blend", `<div class="cx-form">${num("bl-steps", 6, { label: "Steps", min: 1, max: 100, d: 0, wide: true })}
      <p class="cx-note">Makes the in-between steps from one object to the other: position, size, rotation, colour and, for shapes, the outline.</p></div>`, [["Cancel", "close-dialog"], ["Blend", "do-blend", true]]);
  }
  async function doBlend() {
    const steps = clamp(+($('[data-k="bl-steps"]', dialog) || {}).value || 6, 1, 100);
    closeDialog();
    const [a, b] = cv.getObjects().filter(o => active().includes(o));
    if (!a || !b) return;
    cv.discardActiveObject();
    const va = editable(a) && asVector(a), vb = editable(b) && asVector(b);
    let sa = null, sb2 = null, closed = false;
    if (va && vb && va.closed === vb.closed) {
      closed = va.closed;
      if (va.anchors.length === vb.anchors.length) { sa = sceneAnchors(va); sb2 = sceneAnchors(vb); }
      else if (closed) { await ensurePaper(); sa = samplePoints(a, 72); sb2 = samplePoints(b, 72); window.paper.project.clear(); }
    }
    const ca = a.getCenterPoint(), cb = b.getCenterPoint(), made = [];
    for (let k = 1; k <= steps; k++) {
      const t = k / (steps + 1);
      const look = { fill: mixColour(a.fill, b.fill, t), stroke: mixColour(a.stroke, b.stroke, t), strokeWidth: lerp(a.strokeWidth || 0, b.strokeWidth || 0, t), opacity: lerp(a.opacity ?? 1, b.opacity ?? 1, t) };
      if (sa) {
        const pts = sa.map((p, i) => { const q = sb2[i]; return A(lerp(p.x, q.x, t), lerp(p.y, q.y, t), lerp(p.ix, q.ix, t), lerp(p.iy, q.iy, t), lerp(p.ox, q.ox, t), lerp(p.oy, q.oy, t)); });
        made.push(vector(pts, closed, Object.assign({ strokeUniform: !prefs.scaleStrokes, name: "Blend Step" }, look)));
      } else {
        const c = await new Promise(res => a.clone(res, PROPS));
        c.set({ scaleX: lerp(a.scaleX, b.scaleX * (b.width / (a.width || 1)), t), scaleY: lerp(a.scaleY, b.scaleY * (b.height / (a.height || 1)), t), angle: lerp(a.angle, b.angle, t), opacity: look.opacity, name: "Blend Step" });
        if (a.type !== "image" && a.type !== "group") c.set({ fill: look.fill, stroke: look.stroke });
        c.setPositionByOrigin(new F.Point(lerp(ca.x, cb.x, t), lerp(ca.y, cb.y, t)), "center", "center");
        made.push(c);
      }
    }
    const i = cv.getObjects().indexOf(a);
    hist.busy++;
    made.forEach((n, k) => { applyToolState(n); cv.insertAt(n, i + 1 + k); n.setCoords(); });
    hist.busy--;
    reselect([a, ...made, b]);
    group();
    const g = cv.getActiveObject();
    if (g && g.type === "group") g.set({ name: "Blend" });
    note("Blend"); changed(); refreshUI();
  }

  /* ---------- Tools that draw on top or need their own state ---------- */
  let t2 = null;   // the current drag of one of these tools
  const pointInPoly = (p, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside; } return inside; };
  const brushR = () => Math.max(.5, prefs.brush / 2);
  const needActive = () => { const o = cv.getActiveObject(); if (!o) toast(tr("Select something first.")); return o; };
  const TOOLS2 = {
    lasso: {
      down: p => { t2 = { pts: [p] }; },
      move: p => { if (!t2) return; const l = t2.pts[t2.pts.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) * zoom() > 2) { t2.pts.push(p); topRender(); } },
      up: (p, e) => {
        const poly = t2 ? t2.pts : []; t2 = null; topRender();
        if (poly.length < 3) { cv.discardActiveObject(); cv.requestRenderAll(); refreshUI(); return; }
        const hit = cv.getObjects().filter(o => {
          if (o.visible === false || o.locked) return false;
          const r = o.getBoundingRect(true, true), c = o.getCenterPoint();
          return [c, { x: r.left, y: r.top }, { x: r.left + r.width, y: r.top }, { x: r.left, y: r.top + r.height }, { x: r.left + r.width, y: r.top + r.height }].some(q => pointInPoly(q, poly));
        });
        reselect(e.shiftKey ? [...new Set([...active(), ...hit])] : hit); refreshUI();
      },
      draw: (c, z) => { if (!t2) return; c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z; c.setLineDash([4 / z, 3 / z]); c.fillStyle = "rgba(31,122,255,.06)"; c.beginPath(); t2.pts.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.closePath(); c.fill(); c.stroke(); c.setLineDash([]); }
    },
    "magic-wand": {
      down: (p, e, opt) => {
        const t = opt.target;
        if (!t) { cv.discardActiveObject(); cv.requestRenderAll(); refreshUI(); return; }
        const key = o => (o.kind === "icon" ? toHex(iconParts(o)[0].stroke) : toHex(isGrad(o.fill) ? null : o.fill) || "s:" + toHex(o.stroke));
        const k = key(t);
        const same = cv.getObjects().filter(o => o.visible !== false && !o.locked && key(o) === k);
        reselect(e.shiftKey ? [...new Set([...active(), ...same])] : same); refreshUI();
        toast(`${same.length} ${tr(same.length === 1 ? "object" : "objects")}`);
      }
    },
    curvature: {
      down: (p, e) => {
        if (!curv) curv = { pts: [] };
        const f = curv.pts[0];
        if (f && curv.pts.length > 2 && Math.hypot(p.x - f.x, p.y - f.y) * zoom() < 9) { finishCurv(true); return; }
        const q = snapPoint({ x: p.x, y: p.y });
        curv.pts.push({ x: q.x, y: q.y, corner: e.altKey }); topRender();
      },
      move: p => {
        if (!curv) return;
        const f = curv.pts[0];
        curv.closeHover = f && curv.pts.length > 2 && Math.hypot(p.x - f.x, p.y - f.y) * zoom() < 9;
        curv.hover = curv.closeHover ? null : snapPoint({ x: p.x, y: p.y });
        topRender();
      },
      draw: (c, z) => {
        if (!curv || !curv.pts.length) return;
        const pts = curv.hover ? [...curv.pts, curv.hover] : curv.pts;
        c.strokeStyle = "#1f7aff"; c.lineWidth = 1.5 / z;
        if (pts.length > 1) c.stroke(new Path2D(pathFrom(curvAnchors(pts, !!curv.closeHover), !!curv.closeHover)));
        curv.pts.forEach((q, i) => { const s = (i === 0 && curv.closeHover ? 10 : 7) / z; c.fillStyle = "#ffffff"; c.beginPath(); c.arc(q.x, q.y, s / 2, 0, Math.PI * 2); c.fill(); c.stroke(); });
      }
    },
    "add-anchor": { down: p => { addAnchorAt(p); t2 = { seg: segmentAt(p) }; topRender(); }, move: p => { t2 = { seg: segmentAt(p) }; topRender(); }, draw: (c, z) => drawHover(c, z, "seg") },
    "del-anchor": { down: p => { deleteAnchorAt(p); t2 = { anc: anchorAt(p) }; topRender(); }, move: p => { t2 = { anc: anchorAt(p) }; topRender(); }, draw: (c, z) => drawHover(c, z, "anc") },
    anchor: {
      down: p => { const h = anchorAt(p); if (!h) return; const v = ensureVector(h.o); t2 = { conv: { v, i: h.i, moved: false } }; },
      move: (p, e) => {
        if (t2 && t2.conv) {
          const { v, i } = t2.conv, a = v.anchors[i], l = toLocal(v, p.x, p.y);
          if (!t2.conv.moved && Math.hypot(l.x - a.x, l.y - a.y) * zoom() < 3) return;
          t2.conv.moved = true;
          a.ox = l.x - a.x; a.oy = l.y - a.y; a.ix = -a.ox; a.iy = -a.oy;
          rebuild(v); cv.requestRenderAll(); showMeasure(e, `${round(Math.hypot(a.ox, a.oy))} px`); return;
        }
        t2 = { anc: anchorAt(p) }; topRender();
      },
      up: () => { const cnv = t2 && t2.conv; t2 = null; if (!cnv) return; if (cnv.moved) { note("Convert Anchor Point"); changed(); } else toggleSmooth(cnv.v, cnv.i); refreshUI(); },
      draw: (c, z) => drawHover(c, z, "anc")
    },
    scissors: { down: p => { cutAt(p); t2 = null; topRender(); }, move: p => { t2 = { seg: segmentAt(p) }; topRender(); }, draw: (c, z) => drawHover(c, z, "seg") },
    eraser: brushTool(false),
    blob: brushTool(true),
    knife: {
      down: p => { t2 = { pts: [p] }; },
      move: p => { if (!t2) return; t2.pts.push(p); topRender(); },
      up: () => { const pts = t2 ? t2.pts : []; t2 = null; topRender(); knifeAlong(pts); },
      draw: (c, z) => { if (!t2) return; c.strokeStyle = "#ff3b30"; c.lineWidth = 1.25 / z; c.beginPath(); t2.pts.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); c.stroke(); }
    },
    typepath: { down: (p, e, opt) => typeOnPath(opt.target) },
    reflect: {
      down: p => { const o = needActive(); if (!o) return; t2 = { o, c: o.getCenterPoint(), p }; },
      move: (p, e) => { if (!t2) return; t2.p = p; t2.shift = e.shiftKey; const d = Math.hypot(p.x - t2.c.x, p.y - t2.c.y); if (d * zoom() > 4) showMeasure(e, `${round(axisAngle())}°`); topRender(); },
      up: (p, e) => {
        if (!t2) return;
        const { o, c } = t2, phi = Math.hypot(p.x - c.x, p.y - c.y) * zoom() > 4 ? axisAngle() : 90;
        t2 = null; topRender();
        const go = target => { target.set({ flipY: !target.flipY, angle: (((2 * phi - target.angle) % 360) + 360) % 360 }); target.setPositionByOrigin(c, "center", "center"); target.setCoords(); cv.requestRenderAll(); cv.fire("object:modified", { target }); note("Reflect"); changed(); refreshUI(); };
        if (e.altKey && o.type !== "activeSelection") o.clone(cp => { applyToolState(cp); hist.busy++; cv.insertAt(cp, cv.getObjects().indexOf(o) + 1); hist.busy--; cv.setActiveObject(cp); go(cp); }, PROPS);
        else go(o);
      },
      draw: (c, z) => {
        if (!t2 || Math.hypot(t2.p.x - t2.c.x, t2.p.y - t2.c.y) * zoom() < 4) return;
        const a = axisAngle() * Math.PI / 180, L = 4000;
        c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z; c.setLineDash([6 / z, 4 / z]);
        c.beginPath(); c.moveTo(t2.c.x - Math.cos(a) * L, t2.c.y - Math.sin(a) * L); c.lineTo(t2.c.x + Math.cos(a) * L, t2.c.y + Math.sin(a) * L); c.stroke(); c.setLineDash([]);
      }
    },
    shear: {
      down: p => { const o = needActive(); if (!o) return; t2 = { o, p0: p, c: o.getCenterPoint(), sx: o.skewX || 0, sy: o.skewY || 0, w: o.getScaledWidth(), h: o.getScaledHeight() }; },
      move: (p, e) => {
        if (!t2) return;
        const { o } = t2, dx = p.x - t2.p0.x, dy = p.y - t2.p0.y;
        if (Math.abs(dx) >= Math.abs(dy)) o.set({ skewX: clamp(t2.sx + Math.atan2(dx, t2.h / 2) * 180 / Math.PI, -80, 80), skewY: t2.sy });
        else o.set({ skewY: clamp(t2.sy + Math.atan2(dy, t2.w / 2) * 180 / Math.PI, -80, 80), skewX: t2.sx });
        o.setPositionByOrigin(t2.c, "center", "center"); o.setCoords(); cv.requestRenderAll();
        showMeasure(e, `${round(Math.abs(dx) >= Math.abs(dy) ? o.skewX : o.skewY, 1)}°`);
      },
      up: () => { if (!t2) return; const o = t2.o; t2 = null; cv.fire("object:modified", { target: o }); note("Shear"); changed(); refreshUI(); }
    },
    shapebuilder: {
      down: (p, e) => { if (!sb) { toast(tr("Select two or more overlapping shapes, then use the Shape Builder.")); return; } sb.picks = {}; sb.remove = e.altKey; const r = sbRegion(p); if (r) sb.picks[r.key] = r; topRender(); },
      move: (p, e) => {
        if (!sb) return;
        const r = sbRegion(p);
        if (sb.picks) { if (r && !sb.picks[r.key]) sb.picks[r.key] = r; }
        else sb.hover = r;
        sb.alt = e.altKey;
        topRender();
      },
      up: () => { if (sb && sb.picks) sbFinish(sb.remove); },
      draw: (c, z) => {
        if (!sb) return;
        c.strokeStyle = "rgba(31,122,255,.7)"; c.lineWidth = 1 / z;
        sb.items.forEach(it => c.stroke(new Path2D(it.pathData)));
        const list = sb.picks ? Object.values(sb.picks) : sb.hover ? [sb.hover] : [];
        const del = sb.picks ? sb.remove : sb.alt;
        c.fillStyle = del ? "rgba(255,59,48,.28)" : "rgba(31,122,255,.28)"; c.strokeStyle = del ? "#ff3b30" : "#1f7aff"; c.lineWidth = 1.5 / z;
        list.forEach(r => { if (!r.d) return; const p2 = new Path2D(r.d); c.fill(p2); c.stroke(p2); });
      }
    },
    measure: {
      down: p => { t2 = { p0: snapPoint({ x: p.x, y: p.y }), p1: null }; },
      move: (p, e) => {
        if (!t2 || t2.done) return;
        const q = snapPoint({ x: p.x, y: p.y });
        t2.p1 = q;
        const dx = q.x - t2.p0.x, dy = q.y - t2.p0.y, d = Math.hypot(dx, dy), ang = ((-Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
        t2.text = `${round(d, 1)} px · ${round(ang, 1)}° · W ${round(Math.abs(dx), 1)} · H ${round(Math.abs(dy), 1)}`;
        showMeasure(e, `${round(d, 1)} px\n${round(ang, 1)}°`);
        hintEl.innerHTML = `<b>${tr("Measure")}</b><span data-no-i18n>${t2.text}</span>`;
        topRender();
      },
      up: () => { if (t2) t2.done = true; },
      draw: (c, z) => {
        if (!t2 || !t2.p1) return;
        const { p0, p1 } = t2;
        c.strokeStyle = "#ff3fa4"; c.lineWidth = 1 / z;
        c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke();
        [p0, p1].forEach(q => { c.beginPath(); c.arc(q.x, q.y, 3 / z, 0, Math.PI * 2); c.fillStyle = "#ff3fa4"; c.fill(); });
      }
    }
  };
  function axisAngle() {
    let a = Math.atan2(t2.p.y - t2.c.y, t2.p.x - t2.c.x) * 180 / Math.PI;
    if (t2.shift) a = Math.round(a / 45) * 45;
    return a;
  }
  function brushTool(blob) {
    return {
      down: p => { t2 = { pts: [p] }; topRender(); },
      move: p => { if (t2) { t2.pts.push(p); } else t2 = null; mouseBrush = p; topRender(); },
      up: () => { const pts = t2 ? t2.pts : []; t2 = null; topRender(); if (pts.length) (blob ? blobAlong : eraseAlong)(pts, brushR()); },
      draw: (c, z) => {
        const r = brushR();
        if (t2 && t2.pts.length) {
          c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = r * 2;
          c.strokeStyle = blob ? (toHex(paint.fill) || "#000000") : "rgba(255,59,48,.35)"; c.globalAlpha = blob ? .55 : 1;
          c.beginPath(); t2.pts.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y))); if (t2.pts.length === 1) c.lineTo(t2.pts[0].x + .01, t2.pts[0].y); c.stroke(); c.restore();
        }
        if (mouseBrush) { c.strokeStyle = "rgba(127,127,127,.9)"; c.lineWidth = 1 / z; c.beginPath(); c.arc(mouseBrush.x, mouseBrush.y, r, 0, Math.PI * 2); c.stroke(); }
      }
    };
  }
  let mouseBrush = null;
  // hover feedback for the anchor tools: the point on the path, or the anchor
  function drawHover(c, z, what) {
    const h = t2 && t2[what];
    if (!h) return;
    const v = h.o.kind === "vector" ? h.o : asVector(h.o);
    if (v) { c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z; c.stroke(new Path2D(sceneData(v, true))); sceneAnchors(v).forEach(a => { const s = 6 / z; c.fillStyle = "#ffffff"; c.fillRect(a.x - s / 2, a.y - s / 2, s, s); c.strokeRect(a.x - s / 2, a.y - s / 2, s, s); }); }
    const q = h.pt, s = 9 / z;
    c.fillStyle = what === "anc" ? "#1f7aff" : "#ffffff"; c.strokeStyle = "#1f7aff"; c.lineWidth = 1.5 / z;
    if (what === "anc") { c.fillRect(q.x - s / 2, q.y - s / 2, s, s); c.strokeRect(q.x - s / 2, q.y - s / 2, s, s); }
    else { c.beginPath(); c.arc(q.x, q.y, 4 / z, 0, Math.PI * 2); c.fill(); c.stroke(); }
  }

  /* ---------- Mouse ---------- */
  let panning = null;
  cv.on("mouse:down", opt => {
    const e = opt.e;
    closeMenus();
    if (e.button === 2) { openContext(e, opt.target); return; }
    const sp = cv.getPointer(e, true), p = cv.getPointer(e);
    if (tool === "hand" || spaceHeld || e.button === 1 || present) { panning = { x: e.clientX, y: e.clientY }; cv.setCursor("grabbing"); return; }
    if ((tool === "select" || tool === "direct") && !opt.target && view.guides && !view.lockGuides) {
      const tol = 4 / zoom();
      const vi = doc.guides.v.findIndex(x => Math.abs(x - p.x) < tol), hi = doc.guides.h.findIndex(y => Math.abs(y - p.y) < tol);
      if (vi > -1 || hi > -1) { cv.selection = false; guideDrag = vi > -1 ? { axis: "v", index: vi } : { axis: "h", index: hi }; return; }
    }
    if (tool === "select" && e.altKey && opt.target && !opt.target.locked) {
      const t = opt.target;
      t.clone(c => { applyToolState(c); hist.busy++; cv.insertAt(c, cv.getObjects().indexOf(t)); hist.busy--; }, PROPS);
    }
    if (tool === "zoom") { zoomAt(sp, zoom() * (e.altKey ? 1 / 1.6 : 1.6)); return; }
    if (TOOLS2[tool]) {
      const sel = cv.getActiveObject();
      if (sel && sel.type === "activeSelection" && !["lasso", "magic-wand", "reflect", "shear", "shapebuilder"].includes(tool)) cv.discardActiveObject();
      if (TOOLS2[tool].down) TOOLS2[tool].down(p, e, opt);
      return;
    }
    if (tool === "pen") {
      if (!pen) pen = { pts: [] };
      const first = pen.pts[0];
      if (first && pen.pts.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) * zoom() < 9) { finishPen(true); return; }
      const q = snapPoint({ x: p.x, y: p.y });
      pen.pts.push(A(q.x, q.y)); pen.down = true;
      topRender();
      return;
    }
    if (SHAPE_TOOLS.includes(tool)) { const q = snapPoint({ x: p.x, y: p.y }); drag = { kind: tool, p0: q, obj: null }; return; }
    if (tool === "type") {
      if (opt.target && isText(opt.target)) { const t = opt.target; setTool("select"); cv.setActiveObject(t); t.enterEditing(); t.setCursorByClick(e); return; }
      drag = { kind: "type", p0: { x: p.x, y: p.y } }; return;
    }
    const o = cv.getActiveObject();
    if (tool === "rotate" && o) { const c = o.getCenterPoint(); drag = { kind: "rotate", o, c, a0: Math.atan2(p.y - c.y, p.x - c.x), angle0: o.angle }; return; }
    if (tool === "scale" && o) { const c = o.getCenterPoint(); drag = { kind: "scale", o, c, d0: Math.max(1, Math.hypot(p.x - c.x, p.y - c.y)), sx: o.scaleX, sy: o.scaleY }; return; }
    if (tool === "eyedropper") { eyedrop(opt.target); return; }
    if (tool === "gradient") {
      const t = (opt.target && !opt.target.locked) ? opt.target : o;
      if (!t) { toast(tr("Select an object, then drag across it.")); return; }
      if (t !== o) cv.setActiveObject(t);
      drag = { kind: "gradient", o: t, p0: { x: p.x, y: p.y }, stops: gradStops(t.fill), type: isGrad(t.fill) ? t.fill.type : "linear" };
      return;
    }
    if (tool === "artboard") {
      const i = doc.artboards.findIndex(a => p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h);
      if (i > -1) {
        abSelected = i; doc.active = i;
        const a = doc.artboards[i];
        const inside = cv.getObjects().filter(o2 => { const c = o2.getCenterPoint(); return c.x >= a.x && c.x <= a.x + a.w && c.y >= a.y && c.y <= a.y + a.h; });
        drag = { kind: "abmove", i, p0: { x: p.x, y: p.y }, start: { x: a.x, y: a.y }, objs: inside.map(o2 => ({ o: o2, left: o2.left, top: o2.top })) };
      } else drag = { kind: "abnew", p0: { x: p.x, y: p.y }, abNew: null };
      refreshUI();
      cv.requestRenderAll();
    }
  });
  cv.on("mouse:move", opt => {
    const e = opt.e, sp = cv.getPointer(e, true), p = cv.getPointer(e);
    mouseScreen = sp;
    if (view.rulers) drawRulers();
    if (panning) { cv.relativePan(new F.Point(e.clientX - panning.x, e.clientY - panning.y)); panning = { x: e.clientX, y: e.clientY }; pingNav(); afterView(); return; }
    if (guideDrag) {
      if (!guideDrag.ruler) { doc.guides[guideDrag.axis][guideDrag.index] = guideDrag.axis === "h" ? round(p.y) : round(p.x); cv.requestRenderAll(); }
      return;
    }
    if (tool === "pen" && pen) {
      const last = pen.pts[pen.pts.length - 1];
      if (pen.down && last) {
        last.ox = p.x - last.x; last.oy = p.y - last.y;
        if (Math.hypot(last.ox, last.oy) * zoom() < 3) { last.ox = last.oy = 0; }
        last.ix = -last.ox; last.iy = -last.oy;
        if (last.ox || last.oy) showMeasure(e, `${round(Math.hypot(last.ox, last.oy))} px`);
      } else {
        const first = pen.pts[0];
        pen.closeHover = first && pen.pts.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) * zoom() < 9;
        pen.hover = pen.closeHover ? { x: first.x, y: first.y } : snapPoint({ x: p.x, y: p.y });
      }
      topRender();
      return;
    }
    if (TOOLS2[tool]) { if (TOOLS2[tool].move) TOOLS2[tool].move(p, e, opt); return; }
    if (!drag) return;
    if (SHAPE_TOOLS.includes(drag.kind)) {
      const q = snapPoint({ x: p.x, y: p.y });
      const b = shapeBox(drag.p0, q, e);
      if (!drag.obj && b.w + b.h < 3 / zoom()) return;
      if (drag.obj) { hist.busy++; cv.remove(drag.obj); hist.busy--; }
      drag.obj = makeShape(drag.kind, b, drag.p0, q, e);
      applyToolState(drag.obj);
      hist.busy++; cv.add(drag.obj); hist.busy--;
      cv.requestRenderAll();
      showMeasure(e, drag.kind === "line" ? `${round(Math.hypot(q.x - drag.p0.x, q.y - drag.p0.y))} px` : `W  ${round(b.w)}\nH  ${round(b.h)}`);
    } else if (drag.kind === "type") {
      drag.box = shapeBox(drag.p0, p, e); topRender();
    } else if (drag.kind === "rotate") {
      let ang = drag.angle0 + (Math.atan2(p.y - drag.c.y, p.x - drag.c.x) - drag.a0) * 180 / Math.PI;
      if (e.shiftKey) ang = Math.round(ang / 15) * 15;
      drag.o.rotate(((ang % 360) + 360) % 360); drag.o.setPositionByOrigin(drag.c, "center", "center"); drag.o.setCoords();
      cv.requestRenderAll(); showMeasure(e, `${round(drag.o.angle, 1)}°`);
    } else if (drag.kind === "scale") {
      const k = Math.max(.01, Math.hypot(p.x - drag.c.x, p.y - drag.c.y) / drag.d0);
      drag.o.set({ scaleX: drag.sx * k, scaleY: drag.sy * k }); drag.o.setPositionByOrigin(drag.c, "center", "center"); drag.o.setCoords();
      cv.requestRenderAll(); showMeasure(e, `${round(k * 100)}%`);
    } else if (drag.kind === "gradient") {
      if (Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) * zoom() < 4) return;
      const ang = Math.atan2(p.y - drag.p0.y, p.x - drag.p0.x) * 180 / Math.PI - (drag.o.angle || 0);
      drag.o.set("fill", gradientFor(drag.o, drag.stops, drag.type, round(ang))); drag.o.dirty = true;
      cv.requestRenderAll(); showMeasure(e, `${round(ang)}°`);
    } else if (drag.kind === "abmove") {
      const a = doc.artboards[drag.i], dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
      a.x = round(drag.start.x + dx); a.y = round(drag.start.y + dy);
      drag.objs.forEach(it => { it.o.set({ left: it.left + (a.x - drag.start.x), top: it.top + (a.y - drag.start.y) }); it.o.setCoords(); });
      cv.requestRenderAll(); showMeasure(e, `X  ${a.x}   Y  ${a.y}`);
    } else if (drag.kind === "abnew") {
      const b = shapeBox(drag.p0, p, e);
      drag.abNew = { x: round(b.x), y: round(b.y), w: round(b.w), h: round(b.h) };
      topRender(); showMeasure(e, `W  ${drag.abNew.w}\nH  ${drag.abNew.h}`);
    }
  });
  cv.on("mouse:up", opt => {
    const e = opt.e;
    hideMeasure();
    if (panning) { panning = null; cv.setCursor(cv.defaultCursor); return; }
    if (guideDrag && !guideDrag.ruler) {
      if (!stagePt(e).inside) doc.guides[guideDrag.axis].splice(guideDrag.index, 1);
      guideDrag = null; cv.selection = tool === "select" || tool === "direct"; note("Guide"); changed(); cv.requestRenderAll(); return;
    }
    if (tool === "pen" && pen) { pen.down = false; topRender(); return; }
    if (TOOLS2[tool]) { if (TOOLS2[tool].up) TOOLS2[tool].up(cv.getPointer(e), e, opt); return; }
    if (smart.length) { smart = []; cv.requestRenderAll(); }
    if (!drag) return;
    const d = drag;
    drag = null;
    if (SHAPE_TOOLS.includes(d.kind)) {
      let o = d.obj;
      note(tr("Draw") + " " + tr((o && o.name) || TOOL_INFO[d.kind].name));
      if (!o) {
        const s = 100;
        o = makeShape(d.kind, { x: d.p0.x - s / 2, y: d.p0.y - s / 2, w: s, h: s }, d.p0, { x: d.p0.x + s, y: d.p0.y }, null);
        applyToolState(o); cv.add(o);
      } else changed();
      o.setCoords();
      cv.setActiveObject(o);
      cv.requestRenderAll();
      refreshUI();
    } else if (d.kind === "type") {
      const b = d.box && d.box.w > 8 / zoom() ? d.box : null;
      // text starts dark unless a colour other than the defaults was picked
      const fill = toHex(paint.fill) && !["#ffffff", DEFAULT_PAINT.fill].includes(toHex(paint.fill)) ? paint.fill : "#0f0f0f";
      const opts = { left: d.p0.x, top: d.p0.y, fontFamily: charState.family, fontWeight: charState.weight, fontSize: charState.size * unit(), fill, name: "Text", kind: "text", charSpacing: -10, lineHeight: 1.1 };
      const t = b ? new F.Textbox(tr("Type here"), Object.assign(opts, { left: b.x, top: b.y, width: b.w })) : new F.IText(tr("Type here"), opts);
      rtlFix(t);
      loadFont(charState.family, charState.weight).then(() => {
        setTool("select");
        addObject(t);
        t.enterEditing(); t.selectAll();
        refreshUI();
      });
      topRender();
    } else if (d.kind === "rotate" || d.kind === "scale" || d.kind === "gradient") {
      cv.fire("object:modified", { target: d.o }); refreshUI();
    } else if (d.kind === "abmove") {
      note("Move Artboard"); changed(); refreshUI();
    } else if (d.kind === "abnew" && d.abNew && d.abNew.w > 10 && d.abNew.h > 10) {
      doc.artboards.push(newArtboard(d.abNew.w, d.abNew.h, d.abNew.x, d.abNew.y));
      doc.active = abSelected = doc.artboards.length - 1;
      note("New Artboard"); changed(); refreshUI(); topRender(); cv.requestRenderAll();
    } else topRender();
  });
  cv.on("mouse:dblclick", opt => {
    if (tool === "pen" && pen) { finishPen(false); return; }
    if (tool === "curvature" && curv) { curv.pts.pop(); finishCurv(false); return; }
    const t = opt.target;
    if (tool === "select" && t && t.type === "group" && t.kind !== "icon") toast(tr(t.clipPath ? "Release the mask to edit what's inside." : "Ungroup to edit what's inside."));
    if (tool === "select" && t && t.kind === "vector") setTool("direct");
  });
  stage.addEventListener("pointerleave", () => { mouseScreen = null; drawRulers(); });
  cv.on("path:created", ({ path }) => {
    path.set({ name: tool === "brush" ? "Brush Stroke" : "Pencil Line", kind: "drawing", fill: null, strokeUniform: !prefs.scaleStrokes });
    applyToolState(path);
    pending = tr("Draw") + " " + tr(path.name); changed();
  });

  function eyedrop(t) {
    if (!t) return;
    const src = t.kind === "icon" ? iconParts(t)[0] : t;
    const style = { fill: t.kind === "icon" ? src.stroke : src.fill, stroke: t.kind === "icon" ? null : src.stroke, strokeWidth: src.strokeWidth };
    const list = active().filter(o => o !== t);
    if (!list.length) { paint.fill = style.fill; paint.stroke = style.stroke; paint.strokeWidth = style.strokeWidth || 2; syncPaint(); toast(tr("Colours picked up")); return; }
    list.forEach(o => {
      if (o.kind === "icon") iconParts(o).forEach(p => p.set("stroke", style.fill));
      else o.set({ fill: isGrad(style.fill) ? gradientFor(o, gradStops(style.fill), style.fill.type, style.fill.angle || 0) : style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth });
      if (isText(o) && isText(t)) o.set({ fontFamily: t.fontFamily, fontWeight: t.fontWeight, fontSize: t.fontSize, charSpacing: t.charSpacing, lineHeight: t.lineHeight, fontStyle: t.fontStyle });
      if (o.initDimensions) o.initDimensions();
      o.dirty = true;
    });
    cv.requestRenderAll(); note("Eyedropper"); changed(); refreshUI();
  }

  cv.on({
    "selection:created": () => { if (["direct", "distort", "crop-tool"].includes(tool)) setDirectControls(); if (tool === "shapebuilder") sbStart(); refreshUI(); },
    "selection:updated": () => { if (["direct", "distort", "crop-tool"].includes(tool)) setDirectControls(); if (tool === "shapebuilder") sbStart(); refreshUI(); },
    "selection:cleared": () => { anchorSel = -1; setDirectControls(); refreshUI(); }
  });
  cv.on("object:modified", e => {
    const o = e.target;
    if (!o) return;
    if (isText(o) && o.type === "textbox" && (o.scaleX !== 1 || o.scaleY !== 1)) {
      o.set({ fontSize: round(o.fontSize * o.scaleY, 2), width: o.width * o.scaleX, scaleX: 1, scaleY: 1 }); o.initDimensions(); o.setCoords();
    } else if (o.type === "rect" && (o.scaleX !== 1 || o.scaleY !== 1) && !o.angle) {
      o.set({ width: o.width * o.scaleX, height: o.height * o.scaleY, scaleX: 1, scaleY: 1 }); o.setCoords();
    }
    refreshUI();
  });
  const liveTransform = () => {
    const o = cv.getActiveObject();
    if (!o) return;
    const b = o.getBoundingRect(true, true), a = ab();
    const put = (k, v) => $$(`[data-k="${k}"]`, rightP).forEach(el => { if (document.activeElement !== el) el.value = round(v, 1); });
    put("x", b.left - a.x); put("y", b.top - a.y); put("w", o.getScaledWidth()); put("h", o.getScaledHeight()); put("angle", o.angle);
  };
  cv.on({ "object:moving": liveTransform, "object:scaling": liveTransform, "object:rotating": liveTransform });

  /* =====================================================================
     Property editing (inspector and selection toolbar share these)
     ===================================================================== */
  const PROP_LABEL = { x: "Move", y: "Move", w: "Resize", h: "Resize", angle: "Rotate", opacity: "Opacity", blend: "Blend Mode", strokeWidth: "Stroke Weight", rx: "Corner Radius",
    fontSize: "Font Size", fontWeight: "Font Weight", leading: "Leading", charSpacing: "Tracking", textAlign: "Text Alignment", shadow: "Drop Shadow", imgRadius: "Corner Radius" };
  const targetAb = () => doc.artboards[abSelected > -1 && tool === "artboard" ? abSelected : doc.active];
  function apply(k, v, done = true) {
    const list = active(), o = cv.getActiveObject(), a = ab();
    if (k.startsWith("ab-")) {
      const t = targetAb();
      if (!t) return;
      if (k === "ab-name") t.name = v; else if (k === "ab-bg") t.bg = v; else t[k.slice(3)] = Math.max(k === "ab-x" || k === "ab-y" ? -1e6 : 1, round(+v));
      cv.requestRenderAll(); if (done) { note("Artboard"); changed(); } return;
    }
    if (k === "pref-nudge") { prefs.nudge = Math.max(.1, +v); saveView(); return; }
    if (k === "pref-brush") { prefs.brush = clamp(+v, 1, 2000); saveView(); topRender(); return; }
    if (k === "pref-strokes") { prefs.scaleStrokes = !!v; saveView(); cv.getObjects().forEach(x => x.set("strokeUniform", !prefs.scaleStrokes)); cv.requestRenderAll(); return; }
    if (k === "pref-grid") { prefs.gridSize = Math.max(2, +v); saveView(); cv.requestRenderAll(); return; }
    if (!list.length) {
      if (k === "strokeWidth") paint.strokeWidth = +v;
      if (k === "fontFamily") charState.family = v;
      if (k === "fontSize") charState.size = +v;
      if (k === "fontWeight") charState.weight = +v;
      return;
    }
    list.forEach(t => {
      switch (k) {
        case "strokeWidth": if (t.kind === "icon") iconParts(t).forEach(p => p.set("strokeWidth", +v)); else { t.set("strokeWidth", +v); if (+v && !t.stroke) t.set("stroke", "#000000"); } break;
        case "opacity": t.set("opacity", clamp(+v, 0, 100) / 100); break;
        case "blend": t.set("globalCompositeOperation", v); break;
        case "dash": t.set("strokeDashArray", v === "dashed" ? [Math.max(4, t.strokeWidth * 3), Math.max(3, t.strokeWidth * 2)] : v === "dotted" ? [0.01, Math.max(3, t.strokeWidth * 2)] : null); if (v === "dotted") t.set("strokeLineCap", "round"); break;
        case "cap": t.set("strokeLineCap", v); break;
        case "join": t.set("strokeLineJoin", v); break;
        case "rx": if (t.type === "rect") t.set({ rx: +v, ry: +v }); break;
        case "fontSize": if (isText(t)) t.set("fontSize", +v); break;
        case "leading": if (isText(t)) t.set("lineHeight", Math.max(.5, +v / t.fontSize)); break;
        case "charSpacing": if (isText(t)) t.set("charSpacing", +v); break;
        case "fontWeight": if (isText(t)) { t.set("fontWeight", +v); loadFont(t.fontFamily, +v).then(() => { t.initDimensions(); cv.requestRenderAll(); }); } break;
        case "textAlign": if (isText(t)) t.set("textAlign", v); break;
        case "fontStyle": if (isText(t)) t.set("fontStyle", t.fontStyle === "italic" ? "normal" : "italic"); break;
        case "underline": if (isText(t)) t.set("underline", !t.underline); break;
        case "shadow": t.set("shadow", v ? new F.Shadow({ color: "rgba(0,0,0,0.3)", blur: 30, offsetX: 0, offsetY: 14 }) : null); break;
        case "sh-x": case "sh-y": case "sh-blur": case "sh-color": {
          if (!t.shadow) break;
          const map = { "sh-x": "offsetX", "sh-y": "offsetY", "sh-blur": "blur", "sh-color": "color" };
          t.shadow[map[k]] = k === "sh-color" ? v : +v; t.dirty = true; break;
        }
        case "imgRadius": {
          if (t.type !== "image") break;
          const r = +v / (t.scaleX || 1);
          t.kindRadius = +v;
          t.set("clipPath", r ? new F.Rect({ width: t.width, height: t.height, rx: r, ry: r, originX: "center", originY: "center" }) : null);
          break;
        }
        case "brightness": case "contrast": case "saturation": {
          if (t.type !== "image") break;
          const T = { brightness: "Brightness", contrast: "Contrast", saturation: "Saturation" }[k];
          t.filters = (t.filters || []).filter(f => f && f.type !== T);
          if (+v) t.filters.push(new F.Image.filters[T]({ [k]: +v / 100 }));
          t.applyFilters(); break;
        }
        case "grad-type": case "grad-angle": case "grad-0": case "grad-1": {
          if (!isGrad(t.fill)) break;
          const stops = gradStops(t.fill), type = k === "grad-type" ? v : t.fill.type, ang = k === "grad-angle" ? +v : (t.fill.angle || 0);
          if (k === "grad-0") stops[0] = v;
          if (k === "grad-1") stops[stops.length - 1] = v;
          t.set("fill", gradientFor(t, stops, type, ang)); break;
        }
        default: break;
      }
      if (t.initDimensions) t.initDimensions();
      t.dirty = true; t.setCoords();
    });
    if (o && list.length === 1) {
      const b = o.getBoundingRect(true, true);
      if (k === "x") o.set("left", o.left + (+v + a.x - b.left));
      if (k === "y") o.set("top", o.top + (+v + a.y - b.top));
      if (k === "w" && +v > 0) { if (o.type === "textbox") { o.set("width", +v / o.scaleX); o.initDimensions(); } else o.set("scaleX", +v / o.width); }
      if (k === "h" && +v > 0 && !isText(o)) o.set("scaleY", +v / o.height);
      if (k === "angle") { const c = o.getCenterPoint(); o.rotate(+v); o.setPositionByOrigin(c, "center", "center"); }
      o.setCoords();
    } else if (o && (k === "x" || k === "y")) {
      const b = o.getBoundingRect(true, true);
      if (k === "x") o.set("left", o.left + (+v + a.x - b.left)); else o.set("top", o.top + (+v + a.y - b.top));
      o.setCoords();
    }
    cv.requestRenderAll();
    if (done) { note(PROP_LABEL[k] || "Change"); changed(); }
  }
  let recentFonts = [];
  try { recentFonts = (JSON.parse(localStorage.getItem("ds-canvas-fonts")) || []).filter(f => FONTS[f]); } catch (e) { /* private mode */ }
  async function setFont(family) {
    charState.family = family;
    recentFonts = [family, ...recentFonts.filter(f => f !== family)].slice(0, 8);
    try { localStorage.setItem("ds-canvas-fonts", JSON.stringify(recentFonts)); } catch (e) { /* private mode */ }
    const list = flat(active()).filter(isText);
    const weights = FONTS[family] || [400];
    await Promise.all(list.map(o => {
      const w = weights.includes(+o.fontWeight) ? +o.fontWeight : weights.reduce((p, q) => (Math.abs(q - o.fontWeight) < Math.abs(p - o.fontWeight) ? q : p));
      o.set("fontWeight", w);
      return loadFont(family, w);
    }));
    list.forEach(o => { o.set("fontFamily", family); o.initDimensions(); o.setCoords(); });
    cv.requestRenderAll(); note("Font"); changed(); refreshUI();
  }
  function changeCase(how) {
    flat(active()).filter(isText).forEach(o => {
      const s = o.text;
      o.set("text", how === "upper" ? s.toUpperCase() : how === "lower" ? s.toLowerCase()
        : how === "title" ? s.toLowerCase().replace(/(^|\s)(\S)/g, (m, p, c) => p + c.toUpperCase())
          : s.toLowerCase().replace(/(^|[.!?]\s+|\n)(\S)/g, (m, p, c) => p + c.toUpperCase()));
      o.initDimensions();
    });
    cv.requestRenderAll(); note("Change Case"); changed();
  }
  function imageFx(kind) {
    active().filter(o => o.type === "image").forEach(o => {
      const T = { gray: "Grayscale", sepia: "Sepia", invert: "Invert", blur: "Blur" }[kind];
      if (kind === "clear") o.filters = [];
      else { o.filters = (o.filters || []).filter(f => f && f.type !== T); o.filters.push(kind === "blur" ? new F.Image.filters.Blur({ blur: .12 }) : new F.Image.filters[T]()); }
      o.applyFilters();
    });
    cv.requestRenderAll(); note("Image Effect"); changed(); refreshUI();
  }

  /* =====================================================================
     UI builders
     ===================================================================== */
  const num = (k, v, o = {}) => `<label class="cx-num${o.wide ? " is-wide" : ""}"${o.tip ? ` data-tip="${o.tip}"` : ""}>${o.label ? `<span>${o.label}</span>` : ""}<input type="number" inputmode="decimal" data-k="${k}" value="${v === "" ? "" : round(+v, o.d ?? 1)}" step="${o.step || 1}"${o.min != null ? ` min="${o.min}"` : ""}${o.max != null ? ` max="${o.max}"` : ""}>${o.unit ? `<em>${o.unit}</em>` : ""}</label>`;
  const swatchIn = (k, c, big = false) => `<label class="cx-sw${big ? " is-big" : ""}${!c ? " is-none" : ""}" style="--c:${paintCss(c)}"><input type="color" data-k="${k}" value="${toHex(isGrad(c) ? c.colorStops[0].color : c) || "#000000"}" aria-label="Colour"></label>`;
  // A dropdown: the hidden select keeps the value (panels read it and listen for "change"), the button opens a designed list
  const sel = (k, val, opts, label = "") => {
    const cur = opts.find(([v]) => String(v) === String(val)) || opts[0];
    return `<span class="cx-dd"><select class="cx-select" data-k="${k}" aria-label="${label}" tabindex="-1">${opts.map(([v, t]) => `<option value="${v}"${String(v) === String(val) ? " selected" : ""}>${t}</option>`).join("")}</select><button type="button" class="cx-dd-btn" data-act="dd" aria-haspopup="listbox" aria-expanded="false" aria-label="${label}"><span>${cur ? cur[1] : ""}</span>${ui("chev")}</button></span>`;
  };
  function openDropdown(btn) {
    const select = btn.parentNode.querySelector("select");
    const p = openPop(btn, `<div class="cx-ddlist" role="listbox">${[...select.options].map((o, i) => `<button type="button" role="option" data-ddi="${i}" aria-selected="${o.selected}"><i>${o.selected ? ui("check") : ""}</i><span>${esc(o.text)}</span></button>`).join("")}</div>`, "is-dd");
    p.style.minWidth = btn.offsetWidth + "px";
    p.__select = select; p.__btn = btn;
    btn.setAttribute("aria-expanded", "true");
    const on = p.querySelector('[aria-selected="true"]') || p.querySelector("button");
    if (on) { on.focus({ preventScroll: true }); on.scrollIntoView({ block: "nearest" }); }
    p.addEventListener("keydown", e => {
      const list = [...p.querySelectorAll("[data-ddi]")], i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); const n = list[clamp(i + (e.key === "ArrowDown" ? 1 : -1), 0, list.length - 1)]; if (n) n.focus(); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePop(); btn.focus(); }
      else if (e.key === "Tab") { closePop(); }
      else if (e.key === "Enter" || e.key === " ") e.stopPropagation(); // picks the option, not the dialog's main button
    });
  }
  const segBtns = (k, v, opts) => `<div class="cx-seg">${opts.map(([val, ic, label]) => `<button type="button" data-set="${k}" data-v="${val}" class="${String(v) === String(val) ? "is-on" : ""}" aria-label="${label}" data-tip="${label}">${ui(ic)}</button>`).join("")}</div>`;
  const ALIGN6 = [["left", "al-left", "Align Left"], ["center", "al-center", "Align Horizontal Centres"], ["right", "al-right", "Align Right"],
    ["top", "al-top", "Align Top"], ["middle", "al-middle", "Align Vertical Centres"], ["bottom", "al-bottom", "Align Bottom"]];
  const alignRow = () => `<div class="cx-iconrow">${ALIGN6.map(([v, ic, l]) => `<button type="button" class="cx-ib" data-set="align" data-v="${v}" aria-label="${l}" data-tip="${l}">${ui(ic)}</button>`).join("")}</div>`;
  const BOOLS = [["unite", "union", "Union"], ["subtract", "subtract", "Subtract"], ["intersect", "intersect", "Intersect"], ["exclude", "exclude", "Exclude"]];
  const boolRow = () => BOOLS.map(([op, ic, l]) => `<button type="button" class="cx-ib" data-act="bool:${op}" aria-label="${l}" data-tip="${l}">${ui(ic)}</button>`).join("");
  const fontBtn = o => `<button type="button" class="cx-fontbtn" data-act="font-menu" style="font-family:'${esc(o.fontFamily)}'"><span>${esc(o.fontFamily)}</span>${ui("chev")}</button>`;
  const paintRow = (label, k, c) => `
    <div class="cx-paintrow">
      ${swatchIn(k, c, true)}
      <div class="cx-paintinfo"><b>${label}</b><span>${!c ? tr("None") : isGrad(c) ? tr("Gradient") : (toHex(c) || "").toUpperCase()}</span></div>
      <button type="button" class="cx-tiny" data-act="swatch-pop:${k}" aria-label="Swatches" data-tip="Swatches">${ui("swatches")}</button>
      ${k === "fill" ? `<button type="button" class="cx-tiny${isGrad(c) ? " is-on" : ""}" data-act="paint-gradient" aria-label="Gradient" data-tip="Gradient">${ui("gradient")}</button>` : ""}
      <button type="button" class="cx-tiny${!c ? " is-on" : ""}" data-act="paint-none:${k}" aria-label="None" data-tip="None">${ui("none")}</button>
    </div>`;
  const collapsed = new Set((() => { try { return JSON.parse(localStorage.getItem("ds-canvas-collapsed") || "[]"); } catch (e) { return []; } })());
  const sec = (id, title, bodyHtml) => `<section class="cx-sec${collapsed.has(id) ? " is-closed" : ""}" data-sec="${id}"><button type="button" class="cx-sec-head" data-act="sec:${id}" aria-expanded="${!collapsed.has(id)}"><span>${title}</span>${ui("chev")}</button><div class="cx-sec-body">${bodyHtml}</div></section>`;

  /* ---------- Left panel: Layers, Assets, History ---------- */
  let ltab = "layers", assetTab = "brief", leftKey = "";
  const ASSET_TABS = [["brief", "Brief"], ["templates", "Templates"], ["text", "Text"], ["shapes", "Shapes"], ["icons", "Icons"], ["images", "Images"], ["colours", "Colours"]];
  function renderLeft() {
    lTabs.innerHTML = `<div class="cx-seg is-wide">${[["layers", "Layers"], ["assets", "Assets"], ["history", "History"]].map(([k, l]) => `<button type="button" data-ltab="${k}" class="${ltab === k ? "is-on" : ""}">${l}</button>`).join("")}</div>`
      + `<button type="button" class="cx-ib cx-panel-x" data-act="toggle:ui" aria-label="Hide panels" data-tip="Hide panels · ${keyLabel("mod+\\")}">${ui("sidebar")}</button>`;
    const keep = lBody.scrollTop;
    lBody.innerHTML = ltab === "layers" ? layersPanel() : ltab === "history" ? historyPanel() : assetsPanel();
    lBody.scrollTop = keep;
    leftKey = ltab + ":" + assetTab;
    if (ltab === "assets" && assetTab === "templates") thumbs();
    if (ltab === "assets" && assetTab === "text") PAIRS.forEach(([x, xw, y, yw]) => { loadFont(x, xw); loadFont(y, yw); });
  }
  const KIND_ICON = { text: "type", image: "image", icon: "smile", group: "group", masked: "mask", shape: "rect", path: "pen", multi: "group" };
  const SHAPE_ICON = { Rectangle: "rect", Ellipse: "ellipse", Circle: "ellipse", Line: "line", Star: "star", Polygon: "polygon", Badge: "star", "Rounded Rectangle": "rounded", "Brush Stroke": "brush", "Pencil Line": "pencil", "QR Code": "qr" };
  const layerIcon = o => SHAPE_ICON[o.name] || (o.type === "ellipse" || o.type === "circle" ? "ellipse" : o.type === "line" ? "line" : KIND_ICON[kindOf(o)] || "rect");
  function layersPanel() {
    const objs = cv.getObjects(), selList = active();
    if (!objs.length) return `<div class="cx-empty">${ui("layers")}<b>No layers yet</b><span>Draw with the tools below, or open Assets for templates, text and icons.</span><button type="button" class="cx-btn" data-ltab="assets">Open Assets</button></div>`;
    return `<ul class="cx-layers" data-layers>${objs.map((o, i) => [o, i]).reverse().map(([o, i]) => `
      <li draggable="true" data-ly="${i}" class="${selList.includes(o) ? "is-on" : ""}${o.visible === false ? " is-hidden" : ""}${o.locked ? " is-locked" : ""}">
        <span class="cx-ly-ic" style="--c:${paintCss(o.kind === "icon" ? iconParts(o)[0].stroke : o.fill || o.stroke)}">${ui(layerIcon(o))}</span>
        <span class="cx-ly-name"${isText(o) ? " data-no-i18n" : ""}>${esc(isText(o) ? (o.text || "").slice(0, 32) || o.name : o.name || typeName(o))}</span>
        <button type="button" data-ly-lock aria-label="${o.locked ? "Unlock" : "Lock"}" class="${o.locked ? "is-on" : ""}">${ui(o.locked ? "lock" : "unlock")}</button>
        <button type="button" data-ly-eye aria-label="${o.visible === false ? "Show" : "Hide"}" class="${o.visible === false ? "is-on" : ""}">${ui(o.visible === false ? "eye-off" : "eye")}</button>
      </li>`).join("")}</ul>
      <p class="cx-foot">${objs.length} ${objs.length === 1 ? tr("layer") : tr("layers")} · ${doc.artboards.length} ${doc.artboards.length === 1 ? tr("artboard") : tr("artboards")}</p>`;
  }
  const ago = t => { const s = Math.round((Date.now() - t) / 1000); return s < 10 ? tr("just now") : s < 60 ? `${s}s` : s < 3600 ? `${Math.round(s / 60)} min` : new Date(t).toTimeString().slice(0, 5); };
  function historyPanel() {
    return `<ol class="cx-history">${hist.meta.map((m, i) => [m, i]).reverse().map(([m, i]) => `<li><button type="button" data-hist="${i}" class="${i === hist.i ? "is-on" : ""}${i > hist.i ? " is-future" : ""}"><i></i><span>${esc(tr(m.label))}</span><em>${ago(m.time)}</em></button></li>`).join("")}</ol>
      <p class="cx-foot">Click a step to go back to it. The last 100 steps are kept.</p>`;
  }
  function assetsPanel() {
    const nav = `<div class="cx-chips">${ASSET_TABS.map(([k, l]) => `<button type="button" data-atab="${k}" class="${assetTab === k ? "is-on" : ""}">${l}</button>`).join("")}</div>`;
    return nav + ({ brief: briefPanel, templates: templatesPanel, text: textPanel, shapes: shapesPanel, icons: iconsPanel, images: imagesPanel, colours: coloursPanel }[assetTab])();
  }
  let briefPick = Math.floor(Math.random() * BRIEFS.length);
  function briefPanel() {
    const b = BRIEFS[briefPick], [sn, sw, sh] = SIZES[b.size], on = brief === b;
    return `<article class="cx-brief${on ? " is-on" : ""}">
        <span class="cx-brief-client">${esc(b.client)}</span>
        <h4>${esc(b.title)}</h4>
        <p>${esc(b.task)}</p>
        <dl><dt>Format</dt><dd>${sn} · ${sw} × ${sh}</dd><dt>Palette</dt><dd><span class="cx-brief-pal">${pal(b.palette).map(c => `<i style="--c:${c}"></i>`).join("")}</span></dd></dl>
        <p class="cx-brief-tip">${icon("lightbulb")}<span>${esc(b.tip)}</span></p>
      </article>
      <div class="cx-g2"><button type="button" class="cx-btn is-blue" data-act="brief-start">${on ? "Restart brief" : "Start this brief"}</button><button type="button" class="cx-btn" data-act="brief-next">${ui("shuffle")}<span>Another</span></button></div>
      <p class="cx-note">Practise like a real designer: take a brief, design it, then download it for your portfolio.</p>`;
  }
  const templatesPanel = () => `<p class="cx-note">Start from a layout, then make it yours.</p><div class="cx-tpls">${TEMPLATES.map((t, i) => `<button type="button" class="cx-tpl" data-tpl="${i}"><span class="cx-tpl-img" style="aspect-ratio:${t.w} / ${t.h}"><img alt="" data-tpl-img="${i}"></span><span>${t.name}</span></button>`).join("")}</div>`;
  function textPanel() {
    return `<button type="button" class="cx-addtext h" data-text="heading">Add a heading</button>
      <button type="button" class="cx-addtext s" data-text="sub">Add a subheading</button>
      <button type="button" class="cx-addtext b" data-text="body">Add body text</button>
      <h4 class="cx-h4">Font pairs</h4>
      ${PAIRS.map(([x, xw, y, yw], i) => `<button type="button" class="cx-fpair" data-pair="${i}"><b style="font-family:'${x}';font-weight:${xw}">${x}</b><span style="font-family:'${y}';font-weight:${yw}">with ${y}</span></button>`).join("")}`;
  }
  const LIB_SHAPES = {
    rect: ["Rectangle", '<rect x="5" y="7" width="30" height="26" rx="2"/>'], rounded: ["Rounded Rectangle", '<rect x="5" y="7" width="30" height="26" rx="8"/>'],
    ellipse: ["Ellipse", '<circle cx="20" cy="20" r="15"/>'], triangle: ["Triangle", '<path d="M20 5 36 34H4z"/>'],
    star: ["Star", '<path d="m20 4 4.4 10.2 11 .9-8.4 7.2 2.6 10.8L20 27.4l-9.6 5.7 2.6-10.8-8.4-7.2 11-.9z"/>'], polygon: ["Polygon", '<path d="m20 4 14 8v16l-14 8-14-8V12z"/>'],
    arrow: ["Arrow", '<path d="M4 16h18V9l14 11-14 11v-7H4z"/>'], heart: ["Heart", '<path d="M20 34C9 26 4 20 4 13.5 4 8.8 7.6 5 12.2 5c3.4 0 6 1.8 7.8 4.6C21.8 6.8 24.4 5 27.8 5 32.4 5 36 8.8 36 13.5 36 20 31 26 20 34z"/>'],
    bubble: ["Speech Bubble", '<path d="M8 6h24a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H18l-8 7v-7H8a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4z"/>'],
    badge: ["Badge", '<path d="m20 3 4 4.4 5.9-.6 1.2 5.8 5 3.2-2.4 5.2 2.4 5.2-5 3.2-1.2 5.8-5.9-.6L20 37l-4-4.4-5.9.6-1.2-5.8-5-3.2L6.3 19 3.9 13.8l5-3.2 1.2-5.8 5.9.6z"/>'],
    blob: ["Blob", '<path d="M24 5c7 1.4 12.6 6.5 13 14 .5 8-4.6 15.4-12 17.2C17.6 38 9 35.6 6 29 2.6 21.6 4.4 12.8 10 8.4 14.2 5 18.8 4 24 5z"/>'],
    line: ["Line", '<path d="M5 20h30" stroke-width="3.5" stroke-linecap="round" stroke="currentColor" fill="none"/>']
  };
  const shapesPanel = () => `<div class="cx-shapes">${Object.entries(LIB_SHAPES).map(([k, [n, svg]]) => `<button type="button" data-libshape="${k}" aria-label="${n}" data-tip="${n}"><svg viewBox="0 0 40 40" fill="currentColor">${svg}</svg></button>`).join("")}</div>
    <p class="cx-note">Tip: select two shapes and use Combine to make new ones.</p>
    <button type="button" class="cx-btn" data-act="qr">${ui("qr")}<span>Insert QR Code…</span></button>`;
  const iconsPanel = () => `<label class="cx-searchbox">${icon("search")}<input type="search" data-icon-q placeholder="Search icons" aria-label="Search icons"></label>
    <div class="cx-iconsgrid">${Object.keys(window.DS_ICONS || {}).map(n => `<button type="button" data-icon="${n}" aria-label="${n}" title="${n}">${libIcon(n)}</button>`).join("")}</div>`;
  const uploads = [];
  const imagesPanel = () => `<button type="button" class="cx-dropzone" data-act="place">${ui("upload")}<b>Place images</b><span>Or drop them on the canvas, or paste one. They stay on your device.</span></button>
    <div class="cx-uploads">${uploads.map((u, i) => `<button type="button" data-up="${i}" aria-label="Place again"><img src="${u}" alt=""></button>`).join("")}</div>`;
  function coloursPanel() {
    const docCols = [...new Set(flat(cv.getObjects()).flatMap(o => [o.fill, o.stroke]).map(c => toHex(c)).filter(Boolean))].slice(0, 24);
    const row = cols => `<div class="cx-swatches">${cols.map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}" title="${c}"></button>`).join("")}</div>`;
    return `<div class="cx-seg is-wide"><button type="button" data-focus="fill" class="${paint.focus === "fill" ? "is-on" : ""}">Fill</button><button type="button" data-focus="stroke" class="${paint.focus === "stroke" ? "is-on" : ""}">Stroke</button></div>
      <div class="cx-swatches"><button type="button" class="is-none" data-swatch="none" aria-label="None" title="None"></button>${BASIC.map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}" title="${c}"></button>`).join("")}</div>
      <h4 class="cx-h4">Gradients</h4><div class="cx-swatches">${GRADIENTS.map((g, i) => `<button type="button" style="--c:linear-gradient(135deg, ${g[0]}, ${g[1]})" data-gradient="${i}" aria-label="Gradient"></button>`).join("")}</div>
      ${brief ? `<h4 class="cx-h4">${esc(brief.title)}</h4>${row(pal(brief.palette))}` : ""}
      ${docCols.length ? `<h4 class="cx-h4">Document colours</h4>${row(docCols)}` : ""}
      ${(DS.palettes || []).map(p => `<h4 class="cx-h4">${esc(p.name)}</h4>${row(p.colors)}`).join("")}`;
  }

  /* ---------- Right panel: the inspector ---------- */
  function renderRight() {
    const o = cv.getActiveObject(), k = kindOf(o);
    iHead.innerHTML = tool === "artboard" ? `<span class="cx-kind">${ui("artboard")}</span><div><b>${esc(targetAb().name)}</b><em>${tr("Artboard")}</em></div>`
      : o ? `<span class="cx-kind">${ui(k === "multi" ? "group" : layerIcon(o))}</span><div><b${isText(o) ? " data-no-i18n" : ""}>${esc(o.type === "activeSelection" ? `${o.getObjects().length} ${tr("selected")}` : isText(o) ? ((o.text || "").slice(0, 24) || tr("Text")) : (o.name || typeName(o)))}</b><em>${typeName(o)}</em></div>`
        : `<span class="cx-kind">${ui("artboard")}</span><div><b>${esc(ab().name)}</b><em>${ab().w} × ${ab().h}</em></div>`;
    const keep = rBody.scrollTop;
    rBody.innerHTML = inspector();
    rBody.scrollTop = keep;
  }
  const presetSel = t => sel("ab-preset", SIZES.findIndex(([, w, h]) => w === t.w && h === t.h), [[-1, "Custom size"], ...SIZES.map(([n, w, h], j) => [j, `${n} · ${w} × ${h}`])], "Preset");
  function inspector() {
    const o = cv.getActiveObject(), k = kindOf(o), a = ab();
    if (tool === "artboard") {
      const t = targetAb();
      return sec("ab", "Artboard", `
        <input class="cx-text" data-k="ab-name" value="${esc(t.name)}" aria-label="Artboard name">
        ${presetSel(t)}
        <div class="cx-g2">${num("ab-w", t.w, { label: "W", min: 1, d: 0 })}${num("ab-h", t.h, { label: "H", min: 1, d: 0 })}</div>
        <div class="cx-g2">${num("ab-x", t.x, { label: "X", d: 0 })}${num("ab-y", t.y, { label: "Y", d: 0 })}</div>
        <div class="cx-row"><span class="cx-lbl">Background</span>${swatchIn("ab-bg", t.bg)}</div>`) +
        sec("abact", "Actions", `<div class="cx-g2"><button type="button" class="cx-btn" data-act="ab-new">${ui("plus")}<span>New</span></button><button type="button" class="cx-btn" data-act="ab-dup">${ui("copy")}<span>Duplicate</span></button></div>
          <div class="cx-g2"><button type="button" class="cx-btn" data-act="ab-fit">${ui("fit")}<span>Fit to Artwork</span></button><button type="button" class="cx-btn is-danger" data-act="ab-delete">${icon("trash")}<span>Delete</span></button></div>
          <button type="button" class="cx-btn is-blue" data-act="tool:select">Done</button>`);
    }
    if (!o) {
      return sec("doc", "Artboard", `
          ${presetSel(a)}
          <div class="cx-g2">${num("ab-w", a.w, { label: "W", min: 1, d: 0 })}${num("ab-h", a.h, { label: "H", min: 1, d: 0 })}</div>
          <div class="cx-row"><span class="cx-lbl">Background</span>${swatchIn("ab-bg", a.bg)}</div>
          <button type="button" class="cx-btn" data-act="tool:artboard">${ui("artboard")}<span>Edit Artboards</span></button>`) +
        sec("canvas", "Canvas", `<div class="cx-toggles">
          ${[["rulers", "rulers", "Rulers"], ["grid", "grid-lines", "Grid"], ["snapGrid", "snapgrid", "Snap to Grid"], ["smart", "smart", "Smart Guides"], ["guides", "guides", "Guides"], ["pixel", "pixel", "Whole Pixels"]]
            .map(([f, ic, l]) => `<button type="button" class="cx-toggle${view[f] ? " is-on" : ""}" data-act="toggle:${f}" aria-pressed="${!!view[f]}">${ui(ic)}<span>${l}</span></button>`).join("")}</div>
          <div class="cx-g2">${num("pref-grid", prefs.gridSize, { label: "Grid", unit: "px", min: 2, d: 0 })}${num("pref-nudge", prefs.nudge, { label: "Nudge", unit: "px", min: .1 })}</div>`);
    }
    const b = o.getBoundingRect(true, true);
    const fill = firstOf("fill"), stroke = firstOf("stroke"), target = o.type === "activeSelection" ? o.getObjects()[0] : o;
    const shapes = combinable();
    let h = "";
    if (k === "multi") h += sec("multi", "Selection", `<span class="cx-lbl">Align to each other</span>${alignRow()}
      <div class="cx-iconrow"><button type="button" class="cx-ib" data-act="dist:h" aria-label="Distribute Horizontally" data-tip="Distribute Horizontally">${ui("dist-h")}</button><button type="button" class="cx-ib" data-act="dist:v" aria-label="Distribute Vertically" data-tip="Distribute Vertically">${ui("dist-v")}</button></div>
      ${shapes.length > 1 ? `<span class="cx-lbl">Combine</span><div class="cx-iconrow is-big">${boolRow()}</div>` : ""}
      <div class="cx-g2"><button type="button" class="cx-btn" data-act="group">${ui("group")}<span>Group</span></button><button type="button" class="cx-btn" data-act="mask">${ui("mask")}<span>Mask</span></button></div>`);
    h += sec("layout", "Layout", `
      <div class="cx-g2">${num("x", b.left - a.x, { label: "X" })}${num("y", b.top - a.y, { label: "Y" })}</div>
      ${k !== "multi" ? `<div class="cx-g2">${num("w", o.getScaledWidth(), { label: "W", min: 1 })}${num("h", o.getScaledHeight(), { label: "H", min: 1 })}</div>
      <div class="cx-g2">${num("angle", o.angle, { label: "↻", unit: "°" })}<div class="cx-seg"><button type="button" data-act="flip-h" aria-label="Flip Horizontal" data-tip="Flip Horizontal">${ui("flip-h")}</button><button type="button" data-act="flip-v" aria-label="Flip Vertical" data-tip="Flip Vertical">${ui("flip-v")}</button></div></div>` : ""}
      ${o.type === "rect" ? num("rx", o.rx || 0, { label: "Corner radius", unit: "px", min: 0, wide: true }) : ""}
      ${k !== "multi" ? `<span class="cx-lbl">Align to artboard</span>${alignRow()}` : ""}`);
    if (k === "text") {
      h += sec("text", "Text", `${fontBtn(o)}
        <div class="cx-g2">${sel("fontWeight", o.fontWeight, (FONTS[o.fontFamily] || [400, 700]).map(w => [w, WEIGHT_NAMES[w]]), "Font style")}${num("fontSize", o.fontSize, { label: "Size", min: 1 })}</div>
        <div class="cx-g2">${num("leading", o.fontSize * o.lineHeight, { label: "Leading", tip: "Line height" })}${num("charSpacing", o.charSpacing, { label: "Tracking", step: 10, d: 0, tip: "Letter spacing" })}</div>
        ${segBtns("textAlign", o.textAlign, [["left", "t-left", "Align Left"], ["center", "t-center", "Align Centre"], ["right", "t-right", "Align Right"], ["justify", "t-justify", "Justify"]])}
        <div class="cx-seg"><button type="button" data-set="fontStyle" data-v="1" class="${o.fontStyle === "italic" ? "is-on" : ""}" aria-label="Italic" data-tip="Italic">${ui("italic")}</button><button type="button" data-set="underline" data-v="1" class="${o.underline ? "is-on" : ""}" aria-label="Underline" data-tip="Underline">${ui("underline")}</button><button type="button" data-act="case:upper" aria-label="UPPERCASE" data-tip="UPPERCASE"><b class="cx-aa">AA</b></button><button type="button" data-act="case:title" aria-label="Title Case" data-tip="Title Case"><b class="cx-aa">Aa</b></button></div>`);
    }
    if (k !== "image" && k !== "masked") {
      h += sec("fill", "Fill & Stroke", `
        ${paintRow(tr("Fill"), "fill", fill)}
        ${isGrad(target.fill) ? `<div class="cx-grad"><div class="cx-gradbar" style="--c:${paintCss(target.fill)}">${swatchIn("grad-0", gradStops(target.fill)[0])}${swatchIn("grad-1", gradStops(target.fill).slice(-1)[0])}</div>
          <div class="cx-g2">${sel("grad-type", target.fill.type, [["linear", "Linear"], ["radial", "Radial"]], "Type")}${num("grad-angle", target.fill.angle || 0, { label: "∠", unit: "°", d: 0 })}</div></div>` : ""}
        ${k !== "icon" ? paintRow(tr("Stroke"), "stroke", stroke) : ""}
        ${stroke || k === "icon" ? `<div class="cx-g2">${num("strokeWidth", (target.kind === "icon" ? iconParts(target)[0].strokeWidth : target.strokeWidth) || 0, { label: "Weight", unit: "px", min: 0, step: .5 })}
          ${k !== "icon" ? sel("dash", target.strokeDashArray ? (target.strokeDashArray[0] < .1 ? "dotted" : "dashed") : "solid", [["solid", "Solid"], ["dashed", "Dashed"], ["dotted", "Dotted"]], "Dash") : ""}</div>
          ${k !== "icon" && k !== "multi" ? `<div class="cx-g2">${sel("cap", target.strokeLineCap || "butt", [["butt", "Butt cap"], ["round", "Round cap"], ["square", "Square cap"]], "Cap")}${sel("join", target.strokeLineJoin || "miter", [["miter", "Miter join"], ["round", "Round join"], ["bevel", "Bevel join"]], "Join")}</div>` : ""}` : ""}`);
    }
    h += sec("effects", "Effects", `
      <div class="cx-g2">${num("opacity", round((o.opacity ?? 1) * 100), { label: "Opacity", unit: "%", min: 0, max: 100, d: 0 })}${sel("blend", target.globalCompositeOperation || "source-over", BLENDS, "Blend mode")}</div>
      <label class="cx-switch"><input type="checkbox" data-k="shadow"${target.shadow ? " checked" : ""}><i></i><span>Drop shadow</span></label>
      ${target.shadow && k !== "multi" ? `<div class="cx-g2">${num("sh-x", target.shadow.offsetX, { label: "X", d: 0 })}${num("sh-y", target.shadow.offsetY, { label: "Y", d: 0 })}</div>
        <div class="cx-g2">${num("sh-blur", target.shadow.blur, { label: "Blur", min: 0, d: 0 })}<div class="cx-row"><span class="cx-lbl">Colour</span>${swatchIn("sh-color", target.shadow.color)}</div></div>` : ""}`);
    if (k === "image") {
      const fl = o.filters || [], val = (T, key) => { const x = fl.find(t => t && t.type === T); return x ? round(x[key] * 100) : 0; };
      const rng = (key, l, v) => `<label class="cx-range"><span>${l}</span><input type="range" data-k="${key}" min="-100" max="100" step="any" value="${v}" style="--p:${(+v + 100) / 2}%"><output>${v}</output></label>`;
      h += sec("image", "Image", `${num("imgRadius", o.kindRadius || 0, { label: "Corner radius", unit: "px", min: 0, wide: true, d: 0 })}
        ${rng("brightness", tr("Brightness"), val("Brightness", "brightness"))}${rng("contrast", tr("Contrast"), val("Contrast", "contrast"))}${rng("saturation", tr("Saturation"), val("Saturation", "saturation"))}
        <div class="cx-chips is-fx">${[["gray", "Black and White"], ["sepia", "Sepia"], ["invert", "Invert"], ["blur", "Blur"]].map(([f, l]) => `<button type="button" data-act="fx:${f}">${l}</button>`).join("")}</div>
        <div class="cx-g2"><button type="button" class="cx-btn" data-act="crop-image">${ui("crop-tool")}<span>Crop</span></button><button type="button" class="cx-btn" data-act="replace-image">${ui("replace")}<span>Replace</span></button></div>
        <button type="button" class="cx-btn" data-act="fx:clear">Reset Adjustments</button>`);
    }
    h += sec("actions", "Actions", `<div class="cx-actgrid">
      ${k === "group" ? `<button type="button" data-act="ungroup">${ui("ungroup")}<span>Ungroup</span></button>` : ""}
      ${k === "masked" ? `<button type="button" data-act="unmask">${ui("mask")}<span>Release Mask</span></button>` : ""}
      ${k === "shape" ? `<button type="button" data-act="expand">${ui("expand")}<span>Expand</span></button>` : ""}
      ${k === "path" || k === "shape" ? `<button type="button" data-act="tool:direct">${ui("direct")}<span>Edit Points</span></button>` : ""}
      ${k !== "multi" ? `<button type="button" data-act="repeat">${ui("repeat")}<span>Repeat Grid</span></button>` : ""}
      <button type="button" data-act="recolor">${ui("recolor")}<span>Recolour</span></button>
      <button type="button" data-act="duplicate">${ui("copy")}<span>Duplicate</span></button>
      <button type="button" data-act="front">${ui("front")}<span>To Front</span></button>
      <button type="button" data-act="back">${ui("back")}<span>To Back</span></button>
      <button type="button" data-act="lock">${ui(o.locked ? "unlock" : "lock")}<span>${o.locked ? "Unlock" : "Lock"}</span></button>
      <button type="button" data-act="delete" class="is-danger">${icon("trash")}<span>Delete</span></button></div>`);
    return h;
  }

  /* ---------- Control bar (under the menu bar): the main settings of what's selected ---------- */
  function renderCtrl() {
    // don't rebuild while someone is typing a value into it
    const f = document.activeElement;
    if (f && ctrl.contains(f) && f.matches("input")) return;
    const o = cv.getActiveObject(), k = kindOf(o), a = ab();
    const head = t => `<span class="cx-ctrl-k"${o && isText(o) ? " data-no-i18n" : ""}>${t}</span>`, sep = `<span class="cx-ctrl-sep"></span>`;
    const ib = (act, ic, label, key = "") => `<button type="button" class="cx-ib" data-act="${act}" aria-label="${label}" data-tip="${label}${key ? ` · ${keyLabel(key)}` : ""}">${ic}</button>`;
    let h;
    if (tool === "eraser" || tool === "blob") {
      ctrl.innerHTML = head(tr(TOOL_INFO[tool].name)) + sep + num("pref-brush", prefs.brush, { label: "Size", unit: "px", min: 1, d: 0 }) +
        (tool === "blob" ? `<span class="cx-ctrl-paint"><span class="cx-lbl">Fill</span>${swatchIn("fill", paint.fill)}</span>` : "") +
        `<span class="cx-ctrl-note">${tr("[ and ] change the size")}</span>`;
      return;
    }
    if ((tool === "crop-tool" || tool === "distort") && o) {
      ctrl.innerHTML = head(tr(TOOL_INFO[tool].name)) + sep + `<span class="cx-ctrl-note">${tr(TOOL_HINT[tool])}</span><button type="button" class="cx-cbtn" data-act="tool:select">Done</button>`;
      return;
    }
    if (tool === "shapebuilder") {
      ctrl.innerHTML = head(tr("Shape Builder")) + sep + `<span class="cx-ctrl-note">${tr(sb ? "Drag across areas to merge them. Hold Alt to remove areas." : "Select two or more overlapping shapes first.")}</span>`;
      return;
    }
    if (tool === "artboard") {
      const t = targetAb();
      h = head(esc(t.name)) + sep + presetSel(t) + sep + num("ab-w", t.w, { label: "W", min: 1, d: 0 }) + num("ab-h", t.h, { label: "H", min: 1, d: 0 }) +
        num("ab-x", t.x, { label: "X", d: 0 }) + num("ab-y", t.y, { label: "Y", d: 0 }) + sep +
        ib("ab-new", ui("plus"), "New Artboard") + ib("ab-dup", ui("copy"), "Duplicate Artboard") + ib("ab-fit", ui("fit"), "Fit to Artwork Bounds") +
        `<button type="button" class="cx-cbtn" data-act="tool:select">Done</button>`;
    } else if (!o) {
      h = head(tr("No Selection")) + sep + `<button type="button" class="cx-cbtn" data-act="doc-setup">Document Setup</button><button type="button" class="cx-cbtn" data-act="prefs">Preferences</button>` +
        sep + presetSel(a) + num("ab-w", a.w, { label: "W", min: 1, d: 0 }) + num("ab-h", a.h, { label: "H", min: 1, d: 0 });
    } else {
      const b = o.getBoundingRect(true, true), fill = firstOf("fill"), stroke = firstOf("stroke"), target = o.type === "activeSelection" ? o.getObjects()[0] : o;
      h = head(esc(o.type === "activeSelection" ? `${o.getObjects().length} ${tr("selected")}` : typeName(o))) + sep;
      if (k !== "image" && k !== "masked") {
        h += `<span class="cx-ctrl-paint"><span class="cx-lbl">Fill</span>${swatchIn("fill", fill)}</span>`;
        if (k !== "text" && k !== "icon") h += `<span class="cx-ctrl-paint"><span class="cx-lbl">Stroke</span>${swatchIn("stroke", stroke)}</span>`;
        if (stroke || k === "icon") h += num("strokeWidth", (target.kind === "icon" ? iconParts(target)[0].strokeWidth : target.strokeWidth) || 0, { unit: "px", min: 0, step: .5, tip: "Stroke weight" });
        h += sep;
      }
      if (k === "text") h += fontBtn(o) + sel("fontWeight", o.fontWeight, (FONTS[o.fontFamily] || [400, 700]).map(w => [w, WEIGHT_NAMES[w]]), "Font style") + num("fontSize", o.fontSize, { unit: "px", min: 1, tip: "Font size" }) + sep;
      h += num("opacity", round((o.opacity ?? 1) * 100), { label: "Opacity", unit: "%", min: 0, max: 100, d: 0 }) + sep;
      h += num("x", b.left - a.x, { label: "X" }) + num("y", b.top - a.y, { label: "Y" });
      if (k !== "multi") h += num("w", o.getScaledWidth(), { label: "W", min: 1 }) + num("h", o.getScaledHeight(), { label: "H", min: 1 });
      h += sep + alignRow();
      if (k === "multi") h += ib("dist:h", ui("dist-h"), "Distribute Horizontally") + ib("dist:v", ui("dist-v"), "Distribute Vertically");
      h += sep;
      if (k === "multi" && combinable().length > 1) h += boolRow() + sep;
      if (k === "multi") h += ib("group", ui("group"), "Group", "mod+G") + ib("mask", ui("mask"), "Make Clipping Mask", "mod+7");
      if (k === "group") h += ib("ungroup", ui("ungroup"), "Ungroup", "mod+shift+G");
      if (k === "masked") h += ib("unmask", ui("mask"), "Release Clipping Mask", "mod+alt+7");
      h += ib("duplicate", ui("copy"), "Duplicate", "mod+D") + ib("lock", ui(o.locked ? "lock" : "unlock"), o.locked ? "Unlock" : "Lock", "mod+2") +
        ib("delete", icon("trash"), "Delete") + ib("more", ui("more"), "More");
    }
    ctrl.innerHTML = h;
  }

  /* ---------- Minimap ---------- */
  let miniT = 0;
  function drawMini() {
    if (!view.mini || present || view.hideUI) return;
    const d = DPR(), Wc = mini.clientWidth, Hc = mini.clientHeight;
    if (!Wc) return;
    if (mini.width !== Math.round(Wc * d)) { mini.width = Math.round(Wc * d); mini.height = Math.round(Hc * d); }
    const x = mini.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    x.clearRect(0, 0, Wc, Hc);
    const inv = F.util.invertTransform(cv.viewportTransform);
    const tl = F.util.transformPoint(new F.Point(0, 0), inv), br = F.util.transformPoint(new F.Point(cv.width, cv.height), inv);
    const b = allBounds();
    const L = Math.min(b.x, tl.x), T = Math.min(b.y, tl.y), R = Math.max(b.x + b.w, br.x), B = Math.max(b.y + b.h, br.y);
    const pad = 10, s = Math.min((Wc - pad * 2) / (R - L), (Hc - pad * 2) / (B - T));
    const ox = pad + ((Wc - pad * 2) - (R - L) * s) / 2 - L * s, oy = pad + ((Hc - pad * 2) - (B - T) * s) / 2 - T * s;
    mini.__map = { s, ox, oy };
    doc.artboards.forEach((a, i) => { x.fillStyle = a.bg || "#fff"; x.globalAlpha = i === doc.active ? 1 : .65; x.fillRect(ox + a.x * s, oy + a.y * s, a.w * s, a.h * s); });
    x.globalAlpha = .9;
    cv.getObjects().forEach(o => {
      if (o.visible === false) return;
      const r = o.getBoundingRect(true, true);
      const c = o.kind === "icon" ? iconParts(o)[0].stroke : (isGrad(o.fill) ? o.fill.colorStops[0].color : o.fill) || o.stroke || "#888";
      x.fillStyle = toHex(c) || "#888";
      x.fillRect(ox + r.left * s, oy + r.top * s, Math.max(1, r.width * s), Math.max(1, r.height * s));
    });
    x.globalAlpha = 1;
    x.strokeStyle = "#1f7aff"; x.lineWidth = 1.5;
    x.fillStyle = "rgba(31,122,255,.1)";
    x.fillRect(ox + tl.x * s, oy + tl.y * s, (br.x - tl.x) * s, (br.y - tl.y) * s);
    x.strokeRect(ox + tl.x * s, oy + tl.y * s, (br.x - tl.x) * s, (br.y - tl.y) * s);
  }
  const miniGo = e => {
    const m = mini.__map; if (!m) return;
    const r = mini.getBoundingClientRect(), sx = (e.clientX - r.left - m.ox) / m.s, sy = (e.clientY - r.top - m.oy) / m.s, z = zoom();
    cv.setViewportTransform([z, 0, 0, z, cv.width / 2 - sx * z, cv.height / 2 - sy * z]);
    pingNav(); afterView();
  };
  mini.addEventListener("pointerdown", e => {
    e.preventDefault(); mini.setPointerCapture(e.pointerId); miniGo(e);
    const mv = ev => miniGo(ev);
    mini.addEventListener("pointermove", mv);
    mini.addEventListener("pointerup", () => mini.removeEventListener("pointermove", mv), { once: true });
  });
  let overlayRaf = 0;
  function scheduleOverlay() {
    if (overlayRaf) return;
    overlayRaf = requestAnimationFrame(() => {
      overlayRaf = 0;
      const now = performance.now();
      if (now - miniT > 80) { miniT = now; drawMini(); }
    });
  }

  /* ---------- Top bar ---------- */
  const renderTop = () => {
    const a = ab();
    $("[data-abchip]", root).innerHTML = `<b>${esc(a.name)}</b><em>${a.w} × ${a.h}</em>`;
    if (document.activeElement !== nameIn) nameIn.value = doc.name;
    $("[data-act=undo]", root).disabled = hist.i <= 0;
    $("[data-act=redo]", root).disabled = hist.i >= hist.stack.length - 1;
    $("[data-presentlabel]", root).textContent = `${doc.active + 1} / ${doc.artboards.length} · ${a.name}`;
  };

  /* ---------- Refresh everything (batched to one frame) ---------- */
  let uiRaf = 0;
  function refreshUI() {
    cancelAnimationFrame(uiRaf);
    uiRaf = requestAnimationFrame(() => {
      renderTop();
      // asset lists don't change with the selection, so they keep their scroll and search
      if (ltab !== "assets" || assetTab === "colours" || leftKey !== ltab + ":" + assetTab) renderLeft();
      renderRight(); renderCtrl(); syncPaint();
      afterView();
    });
  }

  /* =====================================================================
     Panel and toolbar events
     ===================================================================== */
  let rangeRaf = 0, rangeNext = null;
  const onInput = (e, done) => {
    const el = e.target;
    if (!el.dataset.k) return;
    const k = el.dataset.k;
    if (/^(rc|rp|qr|ex|bl)-/.test(k)) return;
    if (el.type === "number" && el.value === "") return;
    const v = el.type === "checkbox" ? el.checked : el.value;
    if (el.type === "color") { const lab = el.closest(".cx-sw"); if (lab) { lab.style.setProperty("--c", v); lab.classList.remove("is-none"); } }
    if (el.type === "range") {
      const out = el.closest(".cx-range") && el.closest(".cx-range").querySelector("output"); if (out) out.textContent = Math.round(v);
      // image filters are heavy: apply the latest slider value once per frame
      if (!done) { rangeNext = [k, +v]; if (!rangeRaf) rangeRaf = requestAnimationFrame(() => { rangeRaf = 0; apply(rangeNext[0], rangeNext[1], false); }); return; }
      cancelAnimationFrame(rangeRaf); rangeRaf = 0;
    }
    if (k === "fill" || k === "stroke") { setPaint(k, v, done); if (done) refreshUI(); return; }
    if (k === "ab-preset") { if (+v > -1) { const [, w, h] = SIZES[+v], t = targetAb(); t.w = w; t.h = h; cv.requestRenderAll(); note("Resize Artboard"); changed(); fitArtboard(); refreshUI(); } return; }
    if (el.type === "checkbox") { apply(k, v, true); refreshUI(); return; }
    apply(k, el.type === "number" ? +v : v, done);
    if (done && (el.tagName === "SELECT" || k.startsWith("ab-") || k === "strokeWidth")) refreshUI();
  };
  const clickHandler = e => {
    const t = e.target.closest("button, li[data-ly]");
    if (!t) return;
    if (t.dataset.set) { if (t.dataset.set === "align") align(t.dataset.v); else { apply(t.dataset.set, t.dataset.v); refreshUI(); } return; }
    if (t.dataset.ltab) { ltab = t.dataset.ltab; renderLeft(); return; }
    if (t.dataset.atab) { assetTab = t.dataset.atab; ltab = "assets"; renderLeft(); return; }
    if (t.dataset.hist != null) { jump(+t.dataset.hist); return; }
    if (t.dataset.swatch) { setPaint(paint.focus, t.dataset.swatch === "none" ? null : t.dataset.swatch); refreshUI(); return; }
    if (t.dataset.gradient != null) { if (active().length) setGradient(GRADIENTS[+t.dataset.gradient]); else toast(tr("Select an object first.")); return; }
    if (t.dataset.focus) { paint.focus = t.dataset.focus; syncPaint(); renderLeft(); return; }
    if (t.dataset.tpl != null) { useTemplate(+t.dataset.tpl); return; }
    if (t.dataset.text) { addText(t.dataset.text); return; }
    if (t.dataset.pair != null) { addPair(+t.dataset.pair); return; }
    if (t.dataset.icon) { addIcon(t.dataset.icon); return; }
    if (t.dataset.libshape) { addLibShape(t.dataset.libshape); return; }
    if (t.dataset.up != null) { addImage(uploads[+t.dataset.up]); return; }
    const li = t.closest("li[data-ly]");
    if (li) {
      const o = cv.getObjects()[+li.dataset.ly];
      if (!o) return;
      if (e.target.closest("[data-ly-eye]")) { o.set("visible", o.visible === false); if (!o.visible) cv.discardActiveObject(); cv.requestRenderAll(); note(o.visible ? "Show" : "Hide"); changed(); renderLeft(); return; }
      if (e.target.closest("[data-ly-lock]")) { lockState(o, !o.locked); cv.requestRenderAll(); note(o.locked ? "Lock" : "Unlock"); changed(); renderLeft(); return; }
      if (o.visible !== false) {
        if (tool !== "select" && tool !== "direct") setTool("select");
        if ((e.shiftKey || e.metaKey || e.ctrlKey) && cv.getActiveObject()) reselect([...new Set([...active(), o])]); else cv.setActiveObject(o);
        cv.requestRenderAll(); refreshUI();
      }
      return;
    }
    if (t.dataset.act) act(t.dataset.act, t, e);
  };
  [leftP, rightP, ctrl, dialog].forEach(box => {
    box.addEventListener("input", e => onInput(e, false));
    box.addEventListener("change", e => onInput(e, true));
    box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("input")) e.target.blur(); });
    box.addEventListener("click", clickHandler);
  });
  // the top bar, navigator, preview bar and panels button
  [$(".cx-top", root), body].forEach(box => box.addEventListener("click", e => {
    if (e.target.closest(".cx-dock, .cx-panel, .cx-ctrl")) return;
    const b = e.target.closest("[data-act]");
    if (b) act(b.dataset.act, b, e);
  }));
  leftP.addEventListener("input", e => {
    if (!e.target.matches("[data-icon-q]")) return;
    const q = e.target.value.trim().toLowerCase();
    $$("[data-icon]", leftP).forEach(b => { b.hidden = !!q && !b.dataset.icon.includes(q); });
  });
  leftP.addEventListener("dblclick", e => {
    const li = e.target.closest("li[data-ly]");
    if (!li) return;
    const o = cv.getObjects()[+li.dataset.ly], nm = li.querySelector(".cx-ly-name");
    if (!o || isText(o) || !nm) return;
    const input = document.createElement("input");
    input.className = "cx-text"; input.value = o.name || "";
    nm.replaceWith(input); input.focus(); input.select();
    const done = () => { o.name = input.value.trim() || o.name; note("Rename Layer"); changed(); renderLeft(); };
    input.addEventListener("blur", done);
    input.addEventListener("keydown", ev => { ev.stopPropagation(); if (ev.key === "Enter") input.blur(); if (ev.key === "Escape") { input.value = o.name; input.blur(); } });
  });
  let dragLy = null;
  leftP.addEventListener("dragstart", e => { const li = e.target.closest("[data-ly]"); if (li) { dragLy = +li.dataset.ly; e.dataTransfer.effectAllowed = "move"; li.classList.add("is-dragging"); } });
  leftP.addEventListener("dragover", e => { const li = e.target.closest("[data-ly]"); if (dragLy != null && li) { e.preventDefault(); $$(".is-over", leftP).forEach(x => x.classList.remove("is-over")); li.classList.add("is-over"); } });
  leftP.addEventListener("drop", e => {
    const li = e.target.closest("[data-ly]");
    if (dragLy == null || !li) return;
    e.preventDefault();
    cv.moveTo(cv.getObjects()[dragLy], +li.dataset.ly);
    dragLy = null; cv.requestRenderAll(); note("Reorder Layers"); changed(); renderLeft();
  });
  leftP.addEventListener("dragend", () => { dragLy = null; $$(".is-over, .is-dragging", leftP).forEach(x => x.classList.remove("is-over", "is-dragging")); });

  /* ---------- Popovers, main menu, context menu ---------- */
  let pop = null;
  function closePop() { if (pop) { if (pop.__btn) pop.__btn.setAttribute("aria-expanded", "false"); pop.remove(); pop = null; } }
  // Font menu: search, a style filter, recently used fonts, then every font A to Z
  function fontMenu(el) {
    const cur = (flat(active()).find(isText) || {}).fontFamily || charState.family;
    let tab = "", q = "";
    const row = f => `<button type="button" data-font="${esc(f)}"${f === cur ? ' class="is-on"' : ""} data-no-i18n><b style="font-family:${esc(fontFace(f))}">${esc(f)}</b>${tab ? "" : `<em>${tr(FONT_TABS.find(t => t[0] === FONT_CAT[f])[1])}</em>`}</button>`;
    const listHtml = () => {
      const words = q.trim().toLowerCase();
      const hits = FONT_NAMES.filter(f => (!tab || FONT_CAT[f] === tab) && (!words || f.toLowerCase().includes(words)));
      const rec = !tab && !words ? recentFonts.slice(0, 5) : [];
      return (rec.length ? `<span class="cx-pop-title">${tr("Recent")}</span>${rec.map(row).join("")}<span class="cx-pop-title">${tr("All fonts")}</span>` : "")
        + (hits.length ? hits.map(row).join("") : `<p class="cx-fnone">${tr("No fonts match that search.")}</p>`);
    };
    const p = openPop(el, `<label class="cx-fsearch">${ui("search")}<input data-fq placeholder="${tr("Search fonts")}" aria-label="${tr("Search fonts")}" spellcheck="false" autocomplete="off"></label>
      <div class="cx-ftabs">${FONT_TABS.map(([k, t]) => `<button type="button" data-ftab="${k}" aria-pressed="${!k}">${tr(t)}</button>`).join("")}</div>
      <div class="cx-poplist is-fonts" data-flist>${listHtml()}</div>`, "is-fonts");
    const list = $("[data-flist]", p), input = $("[data-fq]", p);
    const io = "IntersectionObserver" in window ? new IntersectionObserver(es => {
      const seen = es.filter(x => x.isIntersecting).map(x => { io.unobserve(x.target); return x.target.dataset.font; });
      for (let i = 0; i < seen.length; i += 40) previewFonts(seen.slice(i, i + 40));
    }, { root: list, rootMargin: "240px 0px" }) : null;
    const watch = () => $$("[data-font]", list).forEach(b => { if (!previewed.has(b.dataset.font)) io ? io.observe(b) : previewFonts([b.dataset.font]); });
    const draw = () => { list.innerHTML = listHtml(); list.scrollTop = 0; watch(); };
    watch();
    const on = $(".is-on", list);
    if (on) list.scrollTop = on.offsetTop - list.clientHeight / 2;
    input.addEventListener("input", () => { q = input.value; draw(); });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter") { const b = $("[data-font]", list); if (b) { setFont(b.dataset.font); closePop(); } }
      if (e.key === "ArrowDown") { e.preventDefault(); const b = $("[data-font]", list); if (b) b.focus(); }
      if (e.key === "Escape") closePop();
    });
    p.addEventListener("click", e => {
      const t = e.target.closest("[data-ftab]");
      if (!t) return;
      tab = t.dataset.ftab;
      $$("[data-ftab]", p).forEach(b => b.setAttribute("aria-pressed", b === t));
      draw();
    });
    if (matchMedia("(pointer: fine)").matches) input.focus({ preventScroll: true });
  }
  function openPop(anchor, html, cls = "", above = false) {
    closePop();
    const R = root.getBoundingClientRect(), r = anchor.getBoundingClientRect();
    pop = document.createElement("div");
    pop.className = "cx-pop " + cls;
    pop.innerHTML = html;
    root.appendChild(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let x = cls.includes("is-dd") ? r.left - R.left : r.left - R.left + r.width / 2 - w / 2, y = above ? r.top - R.top - h - 8 : r.bottom - R.top + 8;
    x = clamp(x, 8, R.width - w - 8);
    if (y + h > R.height - 8) y = Math.max(8, r.top - R.top - h - 8);
    if (y < 8) y = r.bottom - R.top + 8;
    pop.style.left = x + "px"; pop.style.top = y + "px";
    pop.addEventListener("input", e => onInput(e, false));
    pop.addEventListener("change", e => onInput(e, true));
    pop.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.ddi != null) {
        const s2 = pop.__select, b2 = pop.__btn, o2 = s2.options[+t.dataset.ddi];
        closePop();
        if (o2 && !o2.selected) { s2.value = o2.value; b2.querySelector("span").textContent = o2.text; s2.dispatchEvent(new Event("change", { bubbles: true })); }
        if (b2.isConnected) b2.focus({ preventScroll: true });
        return;
      }
      if (t.dataset.swatch) { setPaint(paint.focus, t.dataset.swatch === "none" ? null : t.dataset.swatch); refreshUI(); closePop(); }
      else if (t.dataset.gradient != null) { if (active().length) setGradient(GRADIENTS[+t.dataset.gradient]); closePop(); }
      else if (t.dataset.font) { setFont(t.dataset.font); closePop(); }
      else if (t.dataset.zoom) { if (t.dataset.zoom === "fit") fitArtboard(); else zoomCenter(+t.dataset.zoom); closePop(); }
      else if (t.dataset.abgo != null) { doc.active = +t.dataset.abgo; fitArtboard(); refreshUI(); closePop(); }
      else if (t.dataset.set === "align") { align(t.dataset.v); closePop(); }
      else if (t.dataset.act) { closePop(); act(t.dataset.act, t, e); }
    });
    return pop;
  }
  const swatchPopHtml = () => `<div class="cx-pop-title">${paint.focus === "fill" ? tr("Fill") : tr("Stroke")}</div>
    <div class="cx-swatches"><button type="button" class="is-none" data-swatch="none" aria-label="None"></button>${BASIC.map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}"></button>`).join("")}</div>
    ${paint.focus === "fill" ? `<div class="cx-swatches">${GRADIENTS.map((g, i) => `<button type="button" style="--c:linear-gradient(135deg, ${g[0]}, ${g[1]})" data-gradient="${i}" aria-label="Gradient"></button>`).join("")}</div>` : ""}
    ${brief ? `<div class="cx-pop-title">${esc(brief.title)}</div><div class="cx-swatches">${pal(brief.palette).map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}"></button>`).join("")}</div>` : ""}
    <button type="button" class="cx-poplink" data-act="assets:colours">All colours and palettes</button>`;
  const checked = flag => !!(flag && view[flag]);
  const enabled = a => {
    const o = cv.getActiveObject(), n = active().length;
    if (["cut", "copy", "duplicate", "delete", "lock", "hide", "front", "back", "forward", "backward", "flip-h", "flip-v", "reset-rot", "reset-scale", "fit-sel"].includes(a) || a.startsWith("align:")) return n > 0;
    if (a === "paste" || a === "paste-in-place") return !!clip;
    if (a === "undo") return hist.i > 0;
    if (a === "redo") return hist.i < hist.stack.length - 1;
    if (a === "group" || a === "mask") return !!(o && o.type === "activeSelection");
    if (a === "ungroup") return !!(o && o.type === "group" && !o.clipPath);
    if (a === "unmask") return !!(o && o.clipPath && o.type === "group");
    if (a.startsWith("bool:")) return combinable().length > 1;
    if (a.startsWith("dist:")) return n > 2;
    if (a === "expand") return !!(o && kindOf(o) === "shape");
    if (a === "repeat") return !!(o && o.type !== "activeSelection");
    if (a.startsWith("same:")) return n > 0;
    if (a.startsWith("case:") || a.startsWith("talign:") || a === "lorem") return flat(active()).some(isText);
    if (a === "fx:shadow" || a === "fx:noshadow") return n > 0;
    if (a.startsWith("fx:")) return active().some(x => x.type === "image");
    if (a === "join") return active().some(x => editable(x) && isOpenPath(x));
    if (a === "simplify") return combinable().length > 0;
    if (a === "blend") return n === 2;
    if (a === "crop-image") return !!(o && o.type === "image");
    if (a === "ab-delete") return doc.artboards.length > 1;
    return true;
  };
  const menuItems = items => items.map(it => {
    if (it === "-") return "<hr>";
    const [label, b, c, flag] = it;
    if (Array.isArray(b)) return `<div class="cx-sub"><button type="button" class="cx-subbtn"><i></i><span>${label}</span>${ui("right")}</button><div class="cx-menu cx-submenu">${menuItems(b)}</div></div>`;
    return `<button type="button" data-mact="${c}"${enabled(c) ? "" : " disabled"} class="${checked(flag) ? "is-checked" : ""}"><i>${checked(flag) ? ui("check") : ""}</i><span>${label}</span><kbd>${keyLabel(b)}</kbd></button>`;
  }).join("");
  function openMenuAt(anchor, html, mode) {
    menuPop.innerHTML = html;
    menuPop.dataset.mode = mode;
    menuPop.hidden = false;
    const R = root.getBoundingClientRect(), r = anchor.getBoundingClientRect();
    menuPop.style.left = clamp(r.left - R.left, 8, R.width - menuPop.offsetWidth - 8) + "px";
    menuPop.style.top = (r.bottom - R.top + 8) + "px";
  }
  function openContext(e, target) {
    if (target && tool === "select" && !active().includes(target)) cv.setActiveObject(target);
    const o = cv.getActiveObject();
    const items = o ? [["Cut", "mod+X", "cut"], ["Copy", "mod+C", "copy"], ["Paste", "mod+V", "paste"], ["Duplicate", "mod+D", "duplicate"], ["Delete", "Del", "delete"], "-",
      ["Bring to Front", "mod+shift+]", "front"], ["Send to Back", "mod+shift+[", "back"], "-",
      o.type === "activeSelection" ? ["Group", "mod+G", "group"] : o.clipPath ? ["Release Clipping Mask", "mod+alt+7", "unmask"] : ["Ungroup", "mod+shift+G", "ungroup"],
      ...(o.type === "activeSelection" ? [["Make Clipping Mask", "mod+7", "mask"], ["Combine Shapes", BOOLS.map(([op, , l]) => [l, "", "bool:" + op])]] : [["Repeat Grid…", "", "repeat"]]), "-",
      [o.locked ? "Unlock" : "Lock", "mod+2", "lock"], ["Hide", "mod+3", "hide"], ["Recolour Artwork…", "", "recolor"], ["Copy as PNG", "mod+shift+C", "copy-png"]]
      : [["Paste", "mod+V", "paste"], ["Select All", "mod+A", "select-all"], "-", ["Zoom to Fit", "shift+1", "fit-all"], ["Rulers", "shift+R", "toggle:rulers", "rulers"], ["Grid", "mod+'", "toggle:grid", "grid"], "-", ["Command Palette", "mod+K", "palette"]];
    menuPop.innerHTML = menuItems(items);
    menuPop.dataset.mode = "ctx"; menuPop.hidden = false;
    const R = root.getBoundingClientRect();
    menuPop.style.left = clamp(e.clientX - R.left, 6, R.width - menuPop.offsetWidth - 6) + "px";
    menuPop.style.top = clamp(e.clientY - R.top, 6, R.height - menuPop.offsetHeight - 6) + "px";
  }
  const closeMenus = () => { menuPop.hidden = true; closePop(); $$(".cx-brand, .cx-mbar button", root).forEach(b => b.classList.remove("is-open")); };
  // Menu bar: click opens a menu; while one is open, hovering the others switches to them
  function openBarMenu(i, el) {
    if (!menuPop.hidden && menuPop.dataset.mode === "bar" + i) { closeMenus(); return; }
    closeMenus();
    el.classList.add("is-open");
    openMenuAt(el, menuItems(MENUS[i][1]), "bar" + i);
    menuPop.style.top = (el.getBoundingClientRect().bottom - root.getBoundingClientRect().top + 2) + "px";
  }
  mbar.addEventListener("pointerover", e => {
    const b = e.target.closest("[data-act^='menu:']");
    if (b && !menuPop.hidden && /^bar/.test(menuPop.dataset.mode) && menuPop.dataset.mode !== "bar" + b.dataset.act.split(":")[1]) openBarMenu(+b.dataset.act.split(":")[1], b);
  });
  menuPop.addEventListener("click", e => {
    const f = e.target.closest("[data-fly]");
    if (f) { setTool(f.dataset.fly); closeMenus(); return; }
    const b = e.target.closest("[data-mact]");
    if (b && !b.disabled) { closeMenus(); act(b.dataset.mact, b, e); }
  });
  menuPop.addEventListener("contextmenu", e => e.preventDefault());
  document.addEventListener("pointerdown", e => {
    if (e.button === 2 && stage.contains(e.target)) return;
    if (pop && !pop.contains(e.target) && !e.target.closest("[data-act^='swatch-pop'], [data-act='font-menu'], [data-act='zoom-menu'], [data-act='ab-menu'], [data-act='dd']")) closePop();
    if (!menuPop.hidden && !menuPop.contains(e.target) && !e.target.closest("[data-act='main-menu'], [data-act^='menu:'], [data-act='more'], [data-more]")) closeMenus();
  });

  /* =====================================================================
     Command palette
     ===================================================================== */
  let pItems = [], pSel = 0;
  function paletteSource() {
    const out = [];
    const walk = (items, path) => items.forEach(it => {
      if (it === "-") return;
      const [label, b, c] = it;
      if (Array.isArray(b)) walk(b, [...path, label]);
      else out.push({ group: path[0], label: [...path.slice(1), label].map(tr).join(" › "), key: keyLabel(b), run: () => act(c), on: () => enabled(c) });
    });
    MENUS.forEach(([m, items]) => walk(items, [m]));
    Object.entries(TOOL_INFO).forEach(([id, t]) => out.push({ group: "Tools", label: tr(t.name), key: keyLabel(t.key), icon: id, run: () => setTool(id) }));
    TEMPLATES.forEach((t, i) => out.push({ group: "Templates", label: tr(t.name), run: () => useTemplate(i) }));
    BRIEFS.forEach((b, i) => out.push({ group: "Briefs", label: tr(b.title), run: () => { briefPick = i; startBrief(); } }));
    SIZES.forEach(([n, w, h], i) => out.push({ group: "Artboard size", label: `${tr(n)} · ${w} × ${h}`, run: () => act("ab-size:" + i) }));
    Object.keys(FONTS).forEach(f => out.push({ group: "Fonts", label: f, font: f, run: () => setFont(f), on: () => flat(active()).some(isText) }));
    Object.entries(LIB_SHAPES).forEach(([k, [n]]) => out.push({ group: "Insert shape", label: tr(n), icon: UI[k] ? k : null, run: () => addLibShape(k) }));
    [["heading", "Heading"], ["sub", "Subheading"], ["body", "Body text"]].forEach(([k, l]) => out.push({ group: "Insert text", label: tr(l), run: () => addText(k) }));
    Object.keys(window.DS_ICONS || {}).forEach(n => out.push({ group: "Insert icon", label: n.replace(/-/g, " "), icon: n, run: () => addIcon(n) }));
    return out;
  }
  function openPalette(q = "") {
    closeMenus();
    pItems = paletteSource();
    paletteEl.hidden = false;
    pq.value = q;
    filterPalette();
    setTimeout(() => pq.focus(), 20);
  }
  const closePalette = () => { paletteEl.hidden = true; };
  function filterPalette() {
    const words = pq.value.toLowerCase().split(/\s+/).filter(Boolean);
    const list = pItems.filter(it => (!it.on || it.on()) && words.every(w => (it.label + " " + tr(it.group) + " " + it.group).toLowerCase().includes(w)));
    const shown = words.length ? list.slice(0, 60) : list.filter(it => ["Tools", "File", "Object", "Insert shape", "Templates"].includes(it.group)).slice(0, 48);
    pSel = 0;
    let last = "";
    plist.innerHTML = shown.map((it, i) => {
      const head = it.group !== last ? `<div class="cx-pgroup">${tr(it.group)}</div>` : "";
      last = it.group;
      const ic = !it.icon ? ui("command") : it.group === "Insert icon" ? libIcon(it.icon) : ui(it.icon);
      return `${head}<button type="button" class="cx-pitem${i === 0 ? " is-on" : ""}" data-pi="${i}" role="option" data-no-i18n>${ic}<span${it.font ? ` style="font-family:${esc(fontFace(it.font))}"` : ""}>${esc(it.label)}</span>${it.key ? `<kbd>${it.key}</kbd>` : ""}</button>`;
    }).join("") || `<p class="cx-pempty">${tr("No matches.")}</p>`;
    plist.__items = shown;
    previewFonts(shown.filter(it => it.font).map(it => it.font));
  }
  const runPalette = i => { const it = (plist.__items || [])[i]; if (!it) return; closePalette(); it.run(); };
  pq.addEventListener("input", filterPalette);
  pq.addEventListener("keydown", e => {
    const n = (plist.__items || []).length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      pSel = (pSel + (e.key === "ArrowDown" ? 1 : -1) + n) % Math.max(1, n);
      $$(".cx-pitem", plist).forEach((b, i) => b.classList.toggle("is-on", i === pSel));
      const on = $(".cx-pitem.is-on", plist); if (on) on.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") { e.preventDefault(); runPalette(pSel); }
    else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
  });
  plist.addEventListener("click", e => { const b = e.target.closest("[data-pi]"); if (b) runPalette(+b.dataset.pi); });
  plist.addEventListener("pointermove", e => { const b = e.target.closest("[data-pi]"); if (b && +b.dataset.pi !== pSel) { pSel = +b.dataset.pi; $$(".cx-pitem", plist).forEach(x => x.classList.toggle("is-on", x === b)); } });
  paletteEl.addEventListener("pointerdown", e => { if (e.target === paletteEl) closePalette(); });

  /* =====================================================================
     Adding things: text, icons, shapes, images, templates
     ===================================================================== */
  const RTL = /[֐-ࣿ]/;
  const rtlFix = t => { if (RTL.test(t.text || "")) t.set({ charSpacing: 0, direction: "rtl", textAlign: "right" }); return t; };
  const textbox = (str, o = {}) => rtlFix(new F.Textbox(str, Object.assign({
    fontFamily: "Inter", fontSize: 64, fontWeight: 700, fill: "#0f0f0f", width: 700, lineHeight: 1.1, charSpacing: -10, textAlign: "left", name: "Text", kind: "text"
  }, o)));
  function addText(which) {
    const T = {
      heading: [tr("Add a heading"), { fontSize: 110, fontWeight: 700, charSpacing: -20, width: 860, name: "Heading" }],
      sub: [tr("Add a subheading"), { fontSize: 56, fontWeight: 600, charSpacing: -10, width: 760, name: "Subheading" }],
      body: [tr("Add a little bit of body text. Keep lines short so they're easy to read."), { fontSize: 32, fontWeight: 400, charSpacing: 0, lineHeight: 1.45, width: 640, name: "Body text" }]
    }[which];
    setTool("select");
    placeCentre(textbox(T[0], T[1]));
  }
  async function addPair(i) {
    const [x, xw, y, yw] = PAIRS[i];
    await Promise.all([loadFont(x, xw), loadFont(y, yw)]);
    setTool("select");
    note("Font Pair");
    hist.busy++;
    const head = placeCentre(textbox(tr("Big ideas start here"), { fontFamily: x, fontWeight: xw, fontSize: 104, width: 820, lineHeight: 1, charSpacing: x === "Bebas Neue" ? 20 : -20, name: "Heading" }));
    const body2 = placeCentre(textbox(tr("A short line of supporting text that explains the idea."), { fontFamily: y, fontWeight: yw, fontSize: 34, width: 820, lineHeight: 1.4, charSpacing: 0, name: "Body text" }));
    hist.busy--;
    const gap = 28 * unit(), a = ab(), total = head.getScaledHeight() + gap + body2.getScaledHeight();
    head.set({ top: a.y + (a.h - total) / 2 }); body2.set({ top: head.top + head.getScaledHeight() + gap, left: head.left });
    head.setCoords(); body2.setCoords();
    reselect([head, body2]); changed();
  }
  function addIcon(name) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${window.DS_ICONS[name]}</svg>`;
    F.loadSVGFromString(svg, (objs, opts) => {
      const g = F.util.groupSVGElements(objs, opts);
      g.set({ name: name.replace(/-/g, " ").replace(/^./, c => c.toUpperCase()), kind: "icon", strokeUniform: false });
      g.scaleToWidth(240 * unit());
      setTool("select");
      placeCentre(g, false);
    });
  }
  function addLibShape(k) {
    const s = 360, st = { fill: paint.fill || "#1f7aff", stroke: paint.stroke, strokeWidth: paint.stroke ? paint.strokeWidth : 0 };
    let o;
    const unitPath = (d, n) => { const p = new F.Path(d, Object.assign({ name: n, kind: "shape" }, st)); p.scaleToWidth(s); return p; };
    switch (k) {
      case "rect": o = new F.Rect(Object.assign({ width: s, height: s * .8, name: "Rectangle", kind: "shape" }, st)); break;
      case "rounded": o = new F.Rect(Object.assign({ width: s, height: s * .8, rx: 48, ry: 48, name: "Rounded Rectangle", kind: "shape" }, st)); break;
      case "ellipse": o = new F.Ellipse(Object.assign({ rx: s / 2, ry: s / 2, name: "Ellipse", kind: "shape" }, st)); break;
      case "triangle": o = vector([A(s / 2, 0), A(s, s * .87), A(0, s * .87)], true, Object.assign({ name: "Triangle" }, st)); break;
      case "star": o = vector(STAR(5).map(q => A(q.x * s, q.y * s)), true, Object.assign({ name: "Star" }, st)); break;
      case "polygon": o = vector(POLY(6).map(q => A(q.x * s, q.y * s)), true, Object.assign({ name: "Polygon" }, st)); break;
      case "arrow": o = unitPath("M0 70 H230 V20 L330 110 L230 200 V150 H0 Z", "Arrow"); break;
      case "heart": o = unitPath("M170 300 C 60 220 0 160 0 95 C 0 40 42 0 95 0 C 128 0 155 18 170 45 C 185 18 212 0 245 0 C 298 0 340 40 340 95 C 340 160 280 220 170 300 Z", "Heart"); break;
      case "bubble": o = unitPath("M40 0 H320 A40 40 0 0 1 360 40 V200 A40 40 0 0 1 320 240 H150 L70 310 V240 H40 A40 40 0 0 1 0 200 V40 A40 40 0 0 1 40 0 Z", "Speech Bubble"); break;
      case "badge": o = vector(STAR(12, .84).map(q => A(q.x * s, q.y * s)), true, Object.assign({ name: "Badge" }, st)); break;
      case "blob": o = unitPath("M205 18C268 30 330 80 338 150C346 222 300 300 225 325C150 350 62 322 26 255C-10 188 10 102 66 55C112 16 152 8 205 18Z", "Blob"); break;
      case "line": o = new F.Line([0, 0, s, 0], { stroke: toHex(paint.stroke) || toHex(paint.fill) || "#0f0f0f", strokeWidth: 8, strokeLineCap: "round", name: "Line", kind: "shape" }); break;
      default: return;
    }
    setTool("select");
    placeCentre(o);
  }
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
      img.onerror = rej; img.src = r.result;
    };
    r.onerror = rej; r.readAsDataURL(file);
  });
  const addImage = url => F.Image.fromURL(url, img => {
    if (!img || !img.width) return;
    const a = ab(), k = Math.min(a.w * .7 / img.width, a.h * .7 / img.height, 1);
    img.set({ scaleX: k, scaleY: k, name: "Image", kind: "image" });
    setTool("select");
    placeCentre(img, false);
  });
  async function addFiles(files) {
    for (const f of [...files].filter(x => /^image\//.test(x.type))) {
      try { const url = await readImage(f); uploads.unshift(url); addImage(url); } catch (e) { /* unreadable image */ }
    }
    if (ltab === "assets" && assetTab === "images") renderLeft();
  }
  const fileImg = $("[data-file-img]", root), fileJson = $("[data-file-json]", root), fileReplace = $("[data-file-replace]", root);
  fileImg.addEventListener("change", () => { addFiles(fileImg.files); fileImg.value = ""; });
  fileReplace.addEventListener("change", async () => {
    const f = fileReplace.files[0], o = cv.getActiveObject();
    fileReplace.value = "";
    if (!f || !o || o.type !== "image") return;
    const url = await readImage(f), w = o.getScaledWidth(), h = o.getScaledHeight(), c = o.getCenterPoint();
    o.setSrc(url, () => {
      const k = Math.max(w / o.width, h / o.height);
      o.set({ scaleX: k, scaleY: k }); o.setPositionByOrigin(c, "center", "center"); o.applyFilters(); o.setCoords();
      cv.requestRenderAll(); note("Replace Image"); changed(); refreshUI();
    });
  });
  fileJson.addEventListener("change", () => {
    const f = fileJson.files[0];
    fileJson.value = "";
    if (f) f.text().then(s => restore(s, { refit: true }).then(() => { note("Open Project"); changed(); toast(tr("Project opened")); })).catch(() => toast(tr("That file isn't a Draft Studio design.")));
  });
  let dragDepth = 0;
  body.addEventListener("dragenter", e => { if ([...(e.dataTransfer.types || [])].includes("Files")) { dragDepth++; root.classList.add("is-dropping"); } });
  body.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; root.classList.remove("is-dropping"); } });
  body.addEventListener("dragover", e => { if ([...(e.dataTransfer.types || [])].includes("Files")) e.preventDefault(); });
  body.addEventListener("drop", e => { if (!e.dataTransfer.files.length) return; e.preventDefault(); dragDepth = 0; root.classList.remove("is-dropping"); addFiles(e.dataTransfer.files); });
  document.addEventListener("paste", e => {
    if (isTyping(e.target)) return;
    const o = cv.getActiveObject();
    if (o && o.isEditing) return;
    const files = [...(e.clipboardData && e.clipboardData.files || [])];
    if (files.length) { e.preventDefault(); addFiles(files); } else if (clip) { e.preventDefault(); paste(); }
  });

  /* ---------- Templates ---------- */
  const T = (str, o) => textbox(str, Object.assign({ charSpacing: 0 }, o));
  const TEMPLATES = [
    { name: "Bold poster", w: 1080, h: 1350, bg: "#0f0f0f", make: () => [
      new F.Circle({ radius: 300, fill: "#1f7aff", left: 430, top: 80, name: "Circle", kind: "shape" }),
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
      new F.Rect({ width: 380, height: 600, fill: "#0f0f0f", left: 0, top: 0, name: "Side", kind: "shape" }),
      T("AM", { fontFamily: "Syne", fontWeight: 800, fontSize: 130, charSpacing: -40, fill: "#ffffff", left: 70, top: 222, width: 260, name: "Monogram" }),
      T("Alex Morgan", { fontSize: 56, fontWeight: 700, charSpacing: -20, fill: "#0f0f0f", left: 440, top: 160, width: 560, name: "Name" }),
      T("Brand designer", { fontSize: 30, fontWeight: 400, fill: "#666666", left: 440, top: 232, width: 560, name: "Role" }),
      new F.Rect({ width: 60, height: 6, fill: "#1f7aff", left: 442, top: 316, name: "Line", kind: "shape" }),
      T("hello@alexmorgan.design\n+27 82 000 0000", { fontSize: 27, fontWeight: 400, lineHeight: 1.6, fill: "#0f0f0f", left: 440, top: 360, width: 560, name: "Contact" })] },
    { name: "YouTube thumbnail", w: 1280, h: 720, bg: "#1f7aff", make: () => [
      new F.Circle({ radius: 240, fill: "#ffffff", left: 760, top: 120, name: "Circle", kind: "shape" }),
      T("Aa", { fontFamily: "Playfair Display", fontWeight: 700, fontSize: 240, fill: "#1f7aff", left: 838, top: 210, width: 400, lineHeight: 1, name: "Letters" }),
      T("5 DESIGN\nTIPS", { fontFamily: "Archivo Black", fontWeight: 400, fontSize: 124, lineHeight: .95, charSpacing: -20, fill: "#ffffff", left: 70, top: 150, width: 900, name: "Headline" }),
      new F.Rect({ width: 390, height: 96, rx: 48, ry: 48, fill: "#ffd23f", left: 70, top: 500, name: "Tag", kind: "shape" }),
      T("for beginners", { fontSize: 44, fontWeight: 700, charSpacing: -10, fill: "#0f0f0f", left: 70, top: 521, width: 390, textAlign: "center", name: "Tag text" })] },
    { name: "Story", w: 1080, h: 1920, bg: "#ee4266", make: () => [
      new F.Rect({ width: 1080, height: 1920, left: 0, top: 0, name: "Background", kind: "shape",
        fill: new F.Gradient({ type: "linear", coords: { x1: 0, y1: 0, x2: 1080, y2: 1920 }, colorStops: [{ offset: 0, color: "#ff6b35" }, { offset: 1, color: "#ee4266" }] }) }),
      T("NEW\nDROP", { fontFamily: "Bebas Neue", fontWeight: 400, fontSize: 400, lineHeight: .82, charSpacing: 10, fill: "#ffffff", left: 80, top: 220, width: 920, name: "Headline" }),
      new F.Rect({ width: 920, height: 760, rx: 44, ry: 44, fill: "rgba(255,255,255,0.18)", left: 80, top: 940, name: "Card", kind: "shape" }),
      T("Limited edition", { fontSize: 46, fontWeight: 600, fill: "#ffffff", left: 140, top: 1000, width: 700, name: "Card title" }),
      T("Swipe up to shop", { fontSize: 44, fontWeight: 700, fill: "#ffffff", left: 80, top: 1770, width: 920, textAlign: "center", name: "Call to action" })] }
  ];
  const tplFonts = t => Promise.all(t.make().filter(isText).map(o => loadFont(o.fontFamily, o.fontWeight)));
  const thumbCache = {};
  async function thumbs() {
    for (let i = 0; i < TEMPLATES.length; i++) {
      if (!$(`[data-tpl-img="${i}"]`, root)) continue;
      if (!thumbCache[i]) {
        const t = TEMPLATES[i];
        await tplFonts(t);
        const sc = new F.StaticCanvas(null, { width: t.w, height: t.h, backgroundColor: t.bg, enableRetinaScaling: false });
        t.make().forEach(o => sc.add(o));
        sc.renderAll();
        thumbCache[i] = sc.toDataURL({ format: "jpeg", quality: .85, multiplier: 360 / Math.max(t.w, t.h) });
        sc.dispose();
      }
      $$(`[data-tpl-img="${i}"]`, root).forEach(el => { el.src = thumbCache[i]; });
    }
  }
  const isEmpty = () => !cv.getObjects().length;
  function freshDoc(w, h, bg, name) {
    hist.busy++;
    cv.clear(); cv.backgroundColor = null;
    doc.name = name || tr("Untitled design");
    doc.artboards = [{ name: `${tr("Artboard")} 1`, x: 0, y: 0, w, h, bg: bg || "#ffffff" }];
    doc.active = 0; doc.guides = { v: [], h: [] };
    hist.busy--;
    fitArtboard();
  }
  async function useTemplate(i) {
    if (!isEmpty() && !confirm(tr("Replace your design with this template? You can undo it."))) return;
    const t = TEMPLATES[i];
    await tplFonts(t);
    freshDoc(t.w, t.h, t.bg, tr(t.name));
    hist.busy++;
    t.make().forEach(o => { applyToolState(o); o.strokeUniform = true; cv.add(o); });
    hist.busy--;
    refreshText(); setTool("select"); note(tr("Template") + ": " + tr(t.name)); changed(); refreshUI();
    if (innerWidth < 900) root.classList.remove("show-left", "show-right");
  }
  function startBrief() {
    const b = BRIEFS[briefPick];
    if (!isEmpty() && !confirm(tr("Start a new design for this brief? Your current design will be replaced. You can undo it."))) return;
    const [, w, h] = SIZES[b.size], cols = pal(b.palette);
    freshDoc(w, h, cols[cols.length - 1], tr(b.title));
    brief = b;
    note(tr("Brief") + ": " + tr(b.title)); changed(); refreshUI();
    if (ltab === "assets") renderLeft();
    if (innerWidth < 900) root.classList.remove("show-left", "show-right");
  }

  /* =====================================================================
     Recolour, repeat grid, QR code
     ===================================================================== */
  function recolorDialog() {
    const targets = active().length ? flat(active()) : flat(cv.getObjects());
    const counts = {};
    targets.forEach(o => [o.fill, o.stroke].forEach(c => {
      if (isGrad(c)) c.colorStops.forEach(s => { const h = toHex(s.color); if (h) counts[h] = (counts[h] || 0) + 1; });
      else { const h = toHex(c); if (h) counts[h] = (counts[h] || 0) + 1; }
    }));
    if (!active().length) doc.artboards.forEach(a => { const h = toHex(a.bg); if (h) counts[h] = (counts[h] || 0) + 1; });
    const cols = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 12);
    if (!cols.length) { toast(tr("No colours to recolour.")); return; }
    openDialog("Recolour Artwork", `
      <p class="cx-note">${active().length ? tr("Recolours the selection.") : tr("Recolours the whole design.")} ${tr("Pick a new colour for each, or apply a palette.")}</p>
      <div class="cx-recolor">${cols.map((c, i) => `<div class="cx-rc-row"><span class="cx-sw is-static" style="--c:${c}"></span>${ui("right")}${swatchIn("rc-" + i, c)}<code data-rc-hex="${i}">${c.toUpperCase()}</code></div>`).join("")}</div>
      <label class="cx-field"><span>Apply a palette</span>${sel("rc-pal", "", [["", "—"], ...(DS.palettes || []).map(p => [p.name, p.name])], "Palette")}</label>`,
      [["Cancel", "close-dialog"], ["Recolour", "do-recolor", true]]);
    dialog.__cols = cols;
  }
  dialog.addEventListener("change", e => {
    if (e.target.dataset.k !== "rc-pal" || !e.target.value) return;
    const p = pal(e.target.value);
    dialog.__cols.forEach((c, i) => {
      const inp = $(`[data-k="rc-${i}"]`, dialog), v = p[i % p.length];
      inp.value = v; inp.closest(".cx-sw").style.setProperty("--c", v);
      $(`[data-rc-hex="${i}"]`, dialog).textContent = v.toUpperCase();
    });
  });
  dialog.addEventListener("input", e => {
    const m = /^rc-(\d+)$/.exec(e.target.dataset.k || "");
    if (!m) return;
    $(`[data-rc-hex="${m[1]}"]`, dialog).textContent = e.target.value.toUpperCase();
    e.target.closest(".cx-sw").style.setProperty("--c", e.target.value);
  });
  function doRecolor() {
    const map = {};
    dialog.__cols.forEach((c, i) => { const v = $(`[data-k="rc-${i}"]`, dialog).value.toLowerCase(); if (v !== c) map[c] = v; });
    closeDialog();
    const targets = active().length ? flat(active()) : flat(cv.getObjects());
    if (!active().length) doc.artboards.forEach(a => { const h = toHex(a.bg); if (map[h]) a.bg = map[h]; });
    targets.forEach(o => {
      ["fill", "stroke"].forEach(k => {
        const c = o[k];
        if (isGrad(c)) c.colorStops.forEach(s => { const h = toHex(s.color); if (map[h]) s.color = map[h]; });
        else { const h = toHex(c); if (h && map[h]) o.set(k, map[h]); }
      });
      o.dirty = true;
    });
    cv.getObjects().forEach(o => { o.dirty = true; });
    cv.requestRenderAll(); note("Recolour Artwork"); changed(); refreshUI();
  }
  function repeatDialog() {
    const o = cv.getActiveObject();
    if (!o || o.type === "activeSelection") { toast(tr("Select one object to repeat.")); return; }
    openDialog("Repeat Grid", `<div class="cx-form">
      <div class="cx-g2">${num("rp-cols", 3, { label: "Columns", min: 1, max: 30, d: 0 })}${num("rp-rows", 2, { label: "Rows", min: 1, max: 30, d: 0 })}</div>
      <div class="cx-g2">${num("rp-gx", 24, { label: "Gap X", unit: "px", d: 0 })}${num("rp-gy", 24, { label: "Gap Y", unit: "px", d: 0 })}</div>
      <p class="cx-note">Copies the selection into a grid, starting from where it is now.</p></div>`, [["Cancel", "close-dialog"], ["Repeat", "do-repeat", true]]);
  }
  function doRepeat() {
    const v = k => +$(`[data-k="${k}"]`, dialog).value || 0;
    const cols = clamp(v("rp-cols"), 1, 30), rows = clamp(v("rp-rows"), 1, 30), gx = v("rp-gx"), gy = v("rp-gy");
    closeDialog();
    const o = cv.getActiveObject();
    if (!o) return;
    const b = o.getBoundingRect(true, true), made = [o];
    let left = cols * rows - 1;
    if (!left) return;
    hist.busy++;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (!r && !c) continue;
      o.clone(cl => {
        cl.set({ left: o.left + c * (b.width + gx), top: o.top + r * (b.height + gy) });
        applyToolState(cl); cv.add(cl); made.push(cl);
        if (--left === 0) { hist.busy--; note("Repeat Grid"); reselect(made); changed(); refreshUI(); }
      }, PROPS);
    }
  }
  function qrDialog() {
    openDialog("Insert QR Code", `<div class="cx-form">
      <label class="cx-field"><span>Link or text</span><input class="cx-text" data-qr-text value="https://" spellcheck="false"></label>
      <div class="cx-row"><span class="cx-lbl">Colour</span>${swatchIn("qr-colour", "#0f0f0f")}</div>
      <p class="cx-note">Makes a crisp vector QR code you can recolour and resize. For styled codes, try QR Code Studio.</p></div>`, [["Cancel", "close-dialog"], ["Insert", "do-qr", true]]);
  }
  async function doQr() {
    const text = $("[data-qr-text]", dialog).value.trim(), colour = $("[data-k=qr-colour]", dialog).value;
    closeDialog();
    if (!text) return;
    try { if (!window.qrcode) await loadScript("js/vendor/qrcode.min.js"); } catch (e) { toast(tr("Couldn't load the QR maker. Check your connection.")); return; }
    const q = window.qrcode(0, "M"); q.addData(text); q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (!q.isDark(r, c)) { c++; continue; }
        const s = c;
        while (c < n && q.isDark(r, c)) c++;
        d += `M${s} ${r}h${c - s}v1h${s - c}z`;
      }
    }
    const p = new F.Path(d, { fill: colour, name: "QR Code", kind: "shape", strokeWidth: 0 });
    p.scaleToWidth(360 * unit());
    setTool("select");
    placeCentre(p, false);
  }

  /* =====================================================================
     Export
     ===================================================================== */
  const slug = s => (s || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "design";
  const saveBlob = (blob, file) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = file;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  async function renderArtboard(i, fmt, scale = 1, transparent = false) {
    const a = doc.artboards[i];
    const keep = cv.getActiveObject();
    cv.discardActiveObject(); smart = [];
    await loadFontsOf(cv.getObjects());
    let out;
    if (fmt === "svg") {
      const svg = cv.toSVG({ width: a.w, height: a.h, viewBox: { x: a.x, y: a.y, width: a.w, height: a.h } });
      const fonts = [...new Set(flat(cv.getObjects()).filter(isText).map(o => o.fontFamily).filter(f => f !== "Georgia"))];
      const gf = fonts.filter(f => FONTS[f] && f !== "Georgia");
      const css = gf.length ? `<style>@import url("https://fonts.googleapis.com/css2?${gf.map(f => "family=" + fontQ(f) + ":wght@" + FONTS[f].join(";")).join("&amp;")}&amp;display=swap");</style>` : "";
      const bg = transparent ? "" : `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="${a.bg}"/>`;
      out = svg.replace(/(<svg[^>]*>)/, `$1${css}`).replace(/(<\/defs>)/, `$1${bg}`);
    } else {
      exportBg = !(transparent && fmt === "png");
      const wasPresent = present; present = false;
      const v = cv.viewportTransform, z = v[0];
      const url = cv.toDataURL({ format: fmt === "jpg" ? "jpeg" : "png", quality: .92, multiplier: scale / z, left: v[4] + a.x * z, top: v[5] + a.y * z, width: a.w * z, height: a.h * z });
      present = wasPresent;
      exportBg = true;
      out = await (await fetch(url)).blob();
    }
    if (keep && cv.getObjects().includes(keep)) cv.setActiveObject(keep);
    else if (keep && keep.type === "activeSelection") reselect(keep.getObjects());
    cv.requestRenderAll();
    return out;
  }
  async function exportArtboard(i, fmt, scale, transparent) {
    const a = doc.artboards[i], out = await renderArtboard(i, fmt, scale, transparent);
    const name = slug(doc.name) + (doc.artboards.length > 1 ? "-" + slug(a.name) : "");
    saveBlob(fmt === "svg" ? new Blob([out], { type: "image/svg+xml" }) : out, `${name}.${fmt}`);
  }
  async function copyPng() {
    try {
      const blob = await renderArtboard(doc.active, "png", 1);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast(tr("Copied as PNG"));
    } catch (e) { toast(tr("Your browser blocked copying images. Use Export instead.")); }
  }
  async function copySvg() {
    try { await navigator.clipboard.writeText(await renderArtboard(doc.active, "svg")); toast(tr("SVG code copied")); }
    catch (e) { toast(tr("Your browser blocked the clipboard. Use Export instead.")); }
  }
  let exFmt = "png";
  function exportDialog(fmt = exFmt) {
    exFmt = fmt;
    const a = ab();
    openDialog("Export", `
      <div class="cx-export">
        <div class="cx-exprev"><span style="aspect-ratio:${a.w} / ${a.h};--ar:${round(a.w / a.h, 4)};background:${a.bg}"><img data-exprev alt=""></span></div>
        <div class="cx-form">
          <div class="cx-seg is-wide" data-exfmt>${["png", "jpg", "svg"].map(f => `<button type="button" data-v="${f}" class="${f === fmt ? "is-on" : ""}">${f.toUpperCase()}</button>`).join("")}</div>
          <label class="cx-field"><span>Scale</span>${sel("ex-scale", 1, [[0.5, "0.5×"], [1, "1×"], [2, "2×"], [3, "3×"], [4, "4×"]], "Scale")}</label>
          <label class="cx-field"><span>Artboards</span>${sel("ex-which", "current", [["current", `${tr("Current")} · ${esc(a.name)}`], ["all", `${tr("All")} (${doc.artboards.length})`]], "Artboards")}</label>
          <label class="cx-switch"><input type="checkbox" data-ex-transp><i></i><span>Transparent background</span></label>
          <p class="cx-exsize" data-exsize></p>
        </div>
      </div>`, [["Copy PNG", "copy-png"], ["Cancel", "close-dialog"], ["Export", "do-export", true]], "is-wide");
    const upd = () => { const s = +$("[data-k=ex-scale]", dialog).value; $("[data-exsize]", dialog).textContent = exFmt === "svg" ? tr("Vector file, any size.") : `${round(a.w * s)} × ${round(a.h * s)} px`; };
    upd();
    $("[data-k=ex-scale]", dialog).addEventListener("change", upd);
    $("[data-exfmt]", dialog).addEventListener("click", e => { const b = e.target.closest("[data-v]"); if (!b) return; exFmt = b.dataset.v; $$("[data-exfmt] button", dialog).forEach(x => x.classList.toggle("is-on", x === b)); upd(); });
    renderArtboard(doc.active, "png", Math.min(1, 520 / Math.max(a.w, a.h))).then(blob => { const im = $("[data-exprev]", dialog); if (im) im.src = URL.createObjectURL(blob); });
  }
  async function doExport() {
    const scale = +$("[data-k=ex-scale]", dialog).value, which = $("[data-k=ex-which]", dialog).value, tp = $("[data-ex-transp]", dialog).checked;
    closeDialog();
    const list = which === "all" ? doc.artboards.map((_, i) => i) : [doc.active];
    for (const i of list) await exportArtboard(i, exFmt, scale, tp);
    toast(tr("Exported"));
  }

  /* =====================================================================
     Dialogs
     ===================================================================== */
  function openDialog(title, bodyHtml, buttons = [["OK", "close-dialog", true]], cls = "") {
    closeMenus();
    dialog.className = "cx-dialog " + cls;
    dialog.innerHTML = `<header><strong>${title}</strong><button type="button" class="cx-ib" data-act="close-dialog" aria-label="Close">${ui("close")}</button></header>
      <div class="cx-dialog-body">${bodyHtml}</div>
      <footer>${buttons.map(([l, a, primary]) => `<button type="button" class="cx-btn${primary ? " is-blue" : ""}" data-act="${a}">${l}</button>`).join("")}</footer>`;
    modal.hidden = false;
    const f = $(".cx-dialog-body input:not([type=color]):not([type=checkbox]), footer .is-blue", dialog);
    if (f) setTimeout(() => f.focus(), 30);
  }
  const closeDialog = () => { modal.hidden = true; dialog.innerHTML = ""; };
  modal.addEventListener("pointerdown", e => { if (e.target === modal) closeDialog(); });
  function docSetup() {
    const a = ab();
    openDialog("Document Setup", `<div class="cx-form">
      <label class="cx-field"><span>Artboard</span>${presetSel(a)}</label>
      <div class="cx-g2">${num("ab-w", a.w, { label: "W", unit: "px", min: 1, d: 0 })}${num("ab-h", a.h, { label: "H", unit: "px", min: 1, d: 0 })}</div>
      <div class="cx-row"><span class="cx-lbl">Background</span>${swatchIn("ab-bg", a.bg)}</div></div>`, [["Edit Artboards", "edit-artboards"], ["Done", "close-dialog", true]]);
  }
  function prefsDialog() {
    openDialog("Preferences", `<div class="cx-form">
      <div class="cx-g2">${num("pref-nudge", prefs.nudge, { label: "Nudge", unit: "px", min: .1 })}${num("pref-grid", prefs.gridSize, { label: "Grid", unit: "px", min: 2, d: 0 })}</div>
      <label class="cx-switch"><input type="checkbox" data-k="pref-strokes"${prefs.scaleStrokes ? " checked" : ""}><i></i><span>Scale strokes with objects</span></label>
      ${[["smart", "Smart guides"], ["pixel", "Snap to whole pixels"], ["names", "Show artboard names"], ["mini", "Show minimap"], ["light", "Light interface"]]
        .map(([f, l]) => `<label class="cx-switch"><input type="checkbox" data-pref-view="${f}"${view[f] ? " checked" : ""}><i></i><span>${l}</span></label>`).join("")}</div>`, [["Done", "close-dialog", true]]);
  }
  dialog.addEventListener("change", e => { const v = e.target.dataset.prefView; if (v) { view[v] = e.target.checked; saveView(); applyViewClasses(); cv.requestRenderAll(); refreshUI(); } });
  const SHORTCUTS = [
    ["Tools", [["Move", "V"], ["Edit Points", "A"], ["Pen", "P"], ["Pencil", "N"], ["Brush", "B"], ["Text", "T"], ["Line", "\\"], ["Rectangle", "M"], ["Ellipse", "L"],
      ["Rotate", "R"], ["Scale", "S"], ["Eyedropper", "I"], ["Gradient", "G"], ["Artboard", "shift+O"], ["Hand", "H / Space"], ["Zoom", "Z"]]],
    ["Edit", [["Command palette", "mod+K"], ["Undo / Redo", "mod+Z / mod+shift+Z"], ["Copy / Cut / Paste", "mod+C / X / V"], ["Paste in Place", "mod+shift+V"], ["Duplicate", "mod+D"], ["Delete", "Del"], ["Nudge", "Arrows (Shift ×10)"], ["Copy while dragging", "Alt + drag"]]],
    ["Object", [["Group / Ungroup", "mod+G / mod+shift+G"], ["Clipping mask / Release", "mod+7 / mod+alt+7"], ["Bring Forward / Back", "mod+] / mod+["], ["To Front / Back", "mod+shift+] / ["], ["Lock / Unlock All", "mod+2 / mod+alt+2"], ["Hide / Show All", "mod+3 / mod+alt+3"], ["Flip", "shift+H / shift+V"]]],
    ["Paint", [["Default fill and stroke", "D"], ["Switch fill and stroke", "X"], ["Swap fill and stroke", "shift+X"], ["None", "/"]]],
    ["View", [["Zoom In / Out", "mod+= / mod+-"], ["Zoom to Fit / Artboard / Selection", "shift+1 / 2 / 3"], ["Actual Size", "mod+1"], ["Preview", "mod+enter"], ["Hide Interface", "mod+\\"], ["Rulers", "shift+R"], ["Smart Guides", "mod+U"], ["Grid", "mod+'"]]]
  ];
  function shortcutsDialog() {
    openDialog("Keyboard Shortcuts", `<div class="cx-keys">${SHORTCUTS.map(([g, rows]) => `<section><h4>${g}</h4>${rows.map(([l, k]) => `<div><span>${l}</span><kbd>${keyLabel(k)}</kbd></div>`).join("")}</section>`).join("")}</div>`, [["Done", "close-dialog", true]], "is-wide");
  }

  /* =====================================================================
     Actions
     ===================================================================== */
  function toggle(flag) {
    if (flag === "ui") { view.hideUI = !view.hideUI; applyViewClasses(); requestAnimationFrame(refreshUI); return; }
    view[flag] = !view[flag];
    saveView(); applyViewClasses();
    if (flag === "rulers") requestAnimationFrame(() => { sizeRulers(); refreshUI(); });
    cv.requestRenderAll(); refreshUI();
  }
  function setPresent(on) {
    present = on;
    try {
      if (on && root.requestFullscreen && !document.fullscreenElement) root.requestFullscreen().catch(() => {});
      if (!on && document.fullscreenElement === root) document.exitFullscreen().catch(() => {});
    } catch (e) { /* full screen isn't available */ }
    if (on) cv.discardActiveObject();
    closeMenus();
    applyViewClasses();
    requestAnimationFrame(() => { resize(); fitArtboard(); refreshUI(); });
  }
  const selectWhere = fn => { setTool("select"); reselect(cv.getObjects().filter(o => o.visible !== false && !o.locked && fn(o))); refreshUI(); };
  function act(a, el) {
    if (!a) return;
    const [name, arg] = a.split(":");
    switch (name) {
      case "menu": openBarMenu(+arg, el); break;
      case "main-menu": {
        if (!menuPop.hidden && menuPop.dataset.mode === "main") { closeMenus(); break; }
        $(".cx-brand", root).classList.add("is-open");
        openMenuAt(el, menuItems(MENUS) + `<hr>${menuItems([["Command Palette", "mod+K", "palette"], ["Keyboard Shortcuts", "mod+/", "shortcuts"]])}<hr><a class="cx-menu-home" href="index.html">${icon("arrow-left") || ""}<span>Back to Draft Studio</span></a>`, "main");
        break;
      }
      case "new":
        if (isEmpty() || confirm(tr("Start a new design? You can undo it."))) { brief = null; freshDoc(1080, 1350); note("New Design"); changed(); refreshUI(); }
        break;
      case "open": fileJson.click(); break;
      case "save": clearTimeout(commitT); commit(); store.set("current", snapshot()).then(() => { setSaved("ok", "Saved"); toast(tr("Saved on this device")); }).catch(() => toast(tr("Not saved: download a project file"))); break;
      case "save-file": saveBlob(new Blob([snapshot()], { type: "application/json" }), slug(doc.name) + ".design.json"); break;
      case "place": fileImg.click(); break;
      case "replace-image": fileReplace.click(); break;
      case "export": exportDialog(arg || exFmt); break;
      case "export-all": (async () => { for (let i = 0; i < doc.artboards.length; i++) await exportArtboard(i, "png", 1); })(); break;
      case "do-export": doExport(); break;
      case "copy-png": closeDialog(); copyPng(); break;
      case "copy-svg": copySvg(); break;
      case "qr": qrDialog(); break;
      case "do-qr": doQr(); break;
      case "recolor": recolorDialog(); break;
      case "do-recolor": doRecolor(); break;
      case "repeat": repeatDialog(); break;
      case "join": joinPaths(); break;
      case "simplify": simplifyPaths(); break;
      case "blend": blendDialog(); break;
      case "do-blend": doBlend(); break;
      case "crop-image": setTool("crop-tool"); break;
      case "do-repeat": doRepeat(); break;
      case "doc-setup": docSetup(); break;
      case "edit-artboards": closeDialog(); setTool("artboard"); break;
      case "prefs": prefsDialog(); break;
      case "shortcuts": shortcutsDialog(); break;
      case "palette": openPalette(); break;
      case "about": openDialog("About Canvas", `<div class="cx-about">${MARK_SVG}<p>Canvas is Draft Studio's free design studio. It runs entirely in your browser: nothing is uploaded, and your work autosaves on this device.</p><p class="cx-note">Built with Fabric.js and paper.js (MIT licence).</p></div>`); break;
      case "learn": location.href = "learn.html"; break;
      case "close-dialog": closeDialog(); break;
      case "undo": step(-1); break;
      case "redo": step(1); break;
      case "cut": cut(); break;
      case "copy": copy(); break;
      case "paste": paste(); break;
      case "paste-in-place": paste(true); break;
      case "duplicate": duplicate(); break;
      case "delete": removeSel(); break;
      case "flip-h": case "flip-v": { const k = name === "flip-h" ? "flipX" : "flipY"; active().forEach(o => o.set(k, !o[k])); cv.requestRenderAll(); note("Flip"); changed(); break; }
      case "reset-rot": active().forEach(o => { const c = o.getCenterPoint(); o.rotate(0); o.setPositionByOrigin(c, "center", "center"); o.setCoords(); }); cv.requestRenderAll(); note("Reset Rotation"); changed(); refreshUI(); break;
      case "reset-scale": active().forEach(o => { const c = o.getCenterPoint(); o.set({ scaleX: 1, scaleY: 1 }); o.setPositionByOrigin(c, "center", "center"); o.setCoords(); }); cv.requestRenderAll(); note("Reset Size"); changed(); refreshUI(); break;
      case "front": case "back": case "forward": case "backward": arrange(name); break;
      case "align": align(arg); break;
      case "more": { const r = el.getBoundingClientRect(); openContext({ clientX: r.left, clientY: r.bottom + 8 }, null); break; }
      case "dist": distribute(arg); break;
      case "bool": combine(arg); break;
      case "group": group(); break;
      case "ungroup": ungroup(); break;
      case "mask": mask(); break;
      case "unmask": unmask(); break;
      case "lock": { const list = active(); const lock = !list.every(o => o.locked); list.forEach(o => lockState(o, lock)); cv.requestRenderAll(); note(lock ? "Lock" : "Unlock"); changed(); refreshUI(); break; }
      case "unlock-all": cv.getObjects().forEach(o => lockState(o, false)); cv.requestRenderAll(); note("Unlock All"); changed(); refreshUI(); break;
      case "hide": active().forEach(o => o.set("visible", false)); cv.discardActiveObject(); cv.requestRenderAll(); note("Hide"); changed(); break;
      case "show-all": cv.getObjects().forEach(o => o.set("visible", true)); cv.requestRenderAll(); note("Show All"); changed(); break;
      case "expand": { const o = cv.getActiveObject(); if (o) { note("Expand"); const p = expand(o); cv.setActiveObject(p); changed(); refreshUI(); } break; }
      case "ab-menu": openPop(el, `<div class="cx-pop-title">Artboards</div><div class="cx-poplist">${doc.artboards.map((x, i) => `<button type="button" data-abgo="${i}" class="${i === doc.active ? "is-on" : ""}"><b>${esc(x.name)}</b><em>${x.w} × ${x.h}</em></button>`).join("")}</div>
        <div class="cx-pop-title">Resize this artboard</div><div class="cx-poplist">${SIZES.map(([n, w, h], i) => `<button type="button" data-act="ab-size:${i}"><b>${n}</b><em>${w} × ${h}</em></button>`).join("")}</div>
        <button type="button" class="cx-poplink" data-act="ab-new">+ ${tr("New Artboard")}</button>`, "is-wide"); break;
      case "ab-size": { const [, w, h] = SIZES[+arg], t = ab(); t.w = w; t.h = h; note("Resize Artboard"); changed(); fitArtboard(); refreshUI(); break; }
      case "ab-new": {
        const last = doc.artboards[doc.artboards.length - 1], c = ab();
        doc.artboards.push(newArtboard(c.w, c.h, last.x + last.w + 100, last.y));
        doc.active = abSelected = doc.artboards.length - 1; fitArtboard(); note("New Artboard"); changed(); refreshUI(); break;
      }
      case "ab-dup": {
        const c = ab(), last = doc.artboards[doc.artboards.length - 1], dx = last.x + last.w + 100 - c.x, dy = last.y - c.y;
        const copyAb = Object.assign({}, c, { name: c.name + " " + tr("copy"), x: c.x + dx, y: c.y + dy });
        const inside = cv.getObjects().filter(o => { const p = o.getCenterPoint(); return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h; });
        doc.artboards.push(copyAb); doc.active = abSelected = doc.artboards.length - 1;
        let left = inside.length;
        const done = () => { if (--left <= 0) { fitArtboard(); note("Duplicate Artboard"); changed(); refreshUI(); } };
        if (!left) done();
        inside.forEach(o => o.clone(cl => { cl.set({ left: cl.left + dx, top: cl.top + dy }); applyToolState(cl); hist.busy++; cv.add(cl); hist.busy--; done(); }, PROPS));
        break;
      }
      case "ab-fit": {
        const c = targetAb(), inside = cv.getObjects().filter(o => o.visible !== false);
        if (!inside.length) break;
        const bs = inside.map(o => o.getBoundingRect(true, true));
        const l = Math.min(...bs.map(b => b.left)), t = Math.min(...bs.map(b => b.top));
        c.x = round(l); c.y = round(t); c.w = round(Math.max(...bs.map(b => b.left + b.width)) - l); c.h = round(Math.max(...bs.map(b => b.top + b.height)) - t);
        cv.requestRenderAll(); note("Fit Artboard"); changed(); refreshUI(); break;
      }
      case "ab-delete": {
        if (doc.artboards.length < 2) { toast(tr("A document needs at least one artboard.")); break; }
        const i = abSelected > -1 && tool === "artboard" ? abSelected : doc.active;
        doc.artboards.splice(i, 1); doc.active = abSelected = clamp(i - 1, 0, doc.artboards.length - 1);
        cv.requestRenderAll(); note("Delete Artboard"); changed(); refreshUI(); break;
      }
      case "ab-prev": case "ab-next": {
        const n = doc.artboards.length;
        doc.active = (doc.active + (name === "ab-next" ? 1 : -1) + n) % n;
        fitArtboard(); refreshUI(); break;
      }
      case "case": changeCase(arg); break;
      case "talign": apply("textAlign", arg); refreshUI(); break;
      case "lorem": flat(active()).filter(isText).forEach(o => { o.set("text", "Good design is as little design as possible. Less, but better, because it concentrates on the essential."); o.initDimensions(); }); cv.requestRenderAll(); note("Placeholder Text"); changed(); break;
      case "select-all": selectWhere(() => true); break;
      case "deselect": cv.discardActiveObject(); cv.requestRenderAll(); break;
      case "select-inverse": { const now = active(); selectWhere(o => !now.includes(o)); break; }
      case "same": {
        const o = cv.getActiveObject(); if (!o) break;
        const t = o.type === "activeSelection" ? o.getObjects()[0] : o;
        if (arg === "font") selectWhere(x => isText(x) && x.fontFamily === t.fontFamily);
        else { const v = toHex(t[arg]); selectWhere(x => v && toHex(x[arg]) === v); }
        break;
      }
      case "fx": {
        if (arg === "shadow") { apply("shadow", true); refreshUI(); }
        else if (arg === "noshadow") { apply("shadow", false); refreshUI(); }
        else imageFx(arg);
        break;
      }
      case "zoom-in": zoomCenter(zoom() * 1.25); break;
      case "zoom-out": zoomCenter(zoom() / 1.25); break;
      case "fit": fitArtboard(); break;
      case "fit-all": fitRect(allBounds()); break;
      case "fit-sel": { const o = cv.getActiveObject(); if (o) { const b = o.getBoundingRect(true, true); fitRect({ x: b.left - b.width * .15, y: b.top - b.height * .15, w: b.width * 1.3, h: b.height * 1.3 }); } break; }
      case "actual": zoomCenter(1); break;
      case "zoom-menu": openPop(el, `<div class="cx-poplist">${[["fit", "Zoom to artboard"], [.25, "25%"], [.5, "50%"], [1, "100%"], [2, "200%"], [4, "400%"], [8, "800%"]].map(([v, l]) => `<button type="button" data-zoom="${v}"><b>${l}</b></button>`).join("")}</div>`, "is-narrow", true); break;
      case "toggle": toggle(arg); break;
      case "present": setPresent(!present); break;
      case "clear-guides": doc.guides = { v: [], h: [] }; cv.requestRenderAll(); note("Clear Guides"); changed(); break;
      case "assets":
        ltab = "assets"; if (arg) assetTab = arg;
        if (view.hideUI) { view.hideUI = false; applyViewClasses(); }
        renderLeft();
        if (innerWidth < 900) { root.classList.remove("show-right"); root.classList.add("show-left"); }
        break;
      case "toggle-sheet":
        if (view.hideUI && innerWidth >= 900) { toggle("ui"); break; }
        if (root.classList.contains("show-left") || root.classList.contains("show-right")) root.classList.remove("show-left", "show-right");
        else root.classList.add(cv.getActiveObject() ? "show-right" : "show-left");
        break;
      case "tool": setTool(arg); break;
      case "sec":
        if (collapsed.has(arg)) collapsed.delete(arg); else collapsed.add(arg);
        try { localStorage.setItem("ds-canvas-collapsed", JSON.stringify([...collapsed])); } catch (er) { /* private mode */ }
        renderRight(); break;
      case "dd": if (pop && pop.__btn === el) closePop(); else openDropdown(el); break;
      case "swatch-pop": paint.focus = arg; syncPaint(); openPop(el, swatchPopHtml(), "is-swatches"); break;
      case "font-menu": fontMenu(el); break;
      case "paint-none": setPaint(arg || paint.focus, null); refreshUI(); break;
      case "paint-gradient": if (active().length) setGradient(gradStops(firstOf("fill"))); else toast(tr("Select an object first.")); break;
      case "swap-paint": swapPaint(); break;
      case "default-paint": defaultPaint(); break;
      case "brief-start": startBrief(); break;
      case "brief-next": briefPick = (briefPick + 1 + Math.floor(Math.random() * (BRIEFS.length - 1))) % BRIEFS.length; renderLeft(); break;
      default: break;
    }
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  }

  /* =====================================================================
     Keyboard
     ===================================================================== */
  const TOOL_KEYS = { v: "select", a: "direct", q: "lasso", y: "magic-wand", p: "pen", "=": "add-anchor", "+": "add-anchor", "-": "del-anchor", n: "pencil", b: "brush", t: "type", "\\": "line", m: "rect", l: "ellipse",
    c: "scissors", r: "rotate", o: "reflect", s: "scale", i: "eyedropper", g: "gradient", h: "hand", z: "zoom" };
  document.addEventListener("keydown", e => {
    if (!paletteEl.hidden) return;
    if (!modal.hidden) { if (e.key === "Escape") closeDialog(); if (e.key === "Enter" && !isTyping(e.target)) { const p = $("footer .is-blue", dialog); if (p) p.click(); } return; }
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (mod && k === "k") { e.preventDefault(); openPalette(); return; }
    if (isTyping(e.target)) return;
    const o = cv.getActiveObject();
    if (o && o.isEditing) { if (e.key === "Escape") { o.exitEditing(); cv.requestRenderAll(); refreshUI(); } return; }
    if (present) {
      if (e.key === "Escape" || (mod && k === "enter")) setPresent(false);
      if (k === "arrowright" || k === " ") act("ab-next");
      if (k === "arrowleft") act("ab-prev");
      e.preventDefault(); return;
    }
    if (e.key === " " && !spaceHeld) { spaceHeld = true; toolBeforeSpace = tool; e.preventDefault(); cv.selection = false; cv.skipTargetFind = true; cv.isDrawingMode = false; cv.defaultCursor = "grab"; cv.setCursor("grab"); return; }
    if (e.key === " ") { e.preventDefault(); return; }
    if (e.key === "Escape") {
      if (pen) { finishPen(false); return; }
      if (curv) { finishCurv(false); return; }
      if (tool === "crop-tool" || tool === "distort") { setTool("select"); return; }
      if (!menuPop.hidden || pop) { closeMenus(); return; }
      if (view.hideUI) { toggle("ui"); return; }
      if (tool !== "select") { setTool("select"); return; }
      cv.discardActiveObject(); cv.requestRenderAll(); return;
    }
    if (e.key === "Enter" && pen) { finishPen(false); return; }
    if (e.key === "Enter" && curv) { finishCurv(false); return; }
    if (e.key === "Enter" && (tool === "crop-tool" || tool === "distort")) { setTool("select"); return; }
    const combos = {
      "z": () => (e.shiftKey ? step(1) : step(-1)), "y": () => step(1), "x": cut, "c": () => (e.shiftKey ? copyPng() : copy()), "v": () => paste(e.shiftKey), "d": duplicate,
      "a": () => act(e.shiftKey ? "deselect" : "select-all"), "g": () => (e.shiftKey ? ungroup() : group()),
      "]": () => arrange("forward"), "[": () => arrange("backward"), "}": () => arrange("front"), "{": () => arrange("back"),
      "2": () => act(e.altKey ? "unlock-all" : "lock"), "3": () => act(e.altKey ? "show-all" : "hide"), "7": () => act(e.altKey ? "unmask" : "mask"),
      "s": () => act(e.shiftKey ? "save-file" : "save"), "o": () => act("open"), "n": () => act("new"), "e": () => (e.shiftKey ? act("export") : null),
      "p": () => (e.shiftKey ? act("place") : e.altKey ? act("doc-setup") : null), ",": () => act("prefs"), "/": () => act("shortcuts"),
      "=": () => act("zoom-in"), "+": () => act("zoom-in"), "-": () => act("zoom-out"), "1": () => act("actual"),
      "enter": () => act("present"), "\\": () => toggle("ui"),
      "u": () => toggle("smart"), "j": () => act("join"), "b": () => (e.altKey ? act("blend") : null), ";": () => toggle(e.altKey ? "lockGuides" : "guides"), "'": () => toggle(e.shiftKey ? "snapGrid" : "grid")
    };
    if (mod) {
      const codeMap = { BracketRight: e.shiftKey ? "}" : "]", BracketLeft: e.shiftKey ? "{" : "[", Digit1: "1", Digit2: "2", Digit3: "3", Digit7: "7", Backslash: "\\", Slash: "/", Comma: ",", Semicolon: ";", Quote: "'", Equal: "=", Minus: "-" };
      const fn = combos[codeMap[e.code] || k];
      if (fn) { e.preventDefault(); fn(); }
      return;
    }
    if ((k === "delete" || k === "backspace") && o) {
      e.preventDefault();
      if (tool === "direct" && o.kind === "vector" && anchorSel > -1 && o.anchors.length > 2) { o.anchors.splice(anchorSel, 1); anchorSel = -1; rebuild(o); o.controls = vectorControls(o); cv.requestRenderAll(); note("Delete Point"); changed(); }
      else removeSel();
      return;
    }
    if (k.startsWith("arrow") && o && !o.locked) {
      e.preventDefault();
      const d = prefs.nudge * (e.shiftKey ? 10 : 1);
      o.set({ left: o.left + (k === "arrowleft" ? -d : k === "arrowright" ? d : 0), top: o.top + (k === "arrowup" ? -d : k === "arrowdown" ? d : 0) });
      o.setCoords(); cv.requestRenderAll(); liveTransform(); note("Nudge"); changed();
      return;
    }
    if (e.altKey) return;
    if (e.shiftKey) {
      if (e.code === "Digit1") { act("fit-all"); return; }
      if (e.code === "Digit2") { act("fit"); return; }
      if (e.code === "Digit3") { act("fit-sel"); return; }
      if (k === "o") { setTool("artboard"); return; }
      if (k === "e") { setTool("eraser"); return; }
      if (k === "m") { setTool("shapebuilder"); return; }
      if (k === "c") { setTool("anchor"); return; }
      if (k === "b") { setTool("blob"); return; }
      if (k === "x") { swapPaint(); return; }
      if (k === "r") { toggle("rulers"); return; }
      if (k === "h") { act("flip-h"); return; }
      if (k === "v") { act("flip-v"); return; }
      return;
    }
    if (k === "x") { paint.focus = paint.focus === "fill" ? "stroke" : "fill"; syncPaint(); return; }
    if (k === "d") { defaultPaint(); return; }
    if (k === "/") { setPaint(paint.focus, null); refreshUI(); return; }
    if ((k === "[" || k === "]") && (tool === "eraser" || tool === "blob")) { prefs.brush = clamp(prefs.brush + (k === "]" ? 1 : -1) * Math.max(2, Math.round(prefs.brush * .2)), 1, 2000); saveView(); topRender(); renderCtrl(); return; }
    if (TOOL_KEYS[k]) setTool(TOOL_KEYS[k]);
  });
  document.addEventListener("keyup", e => {
    if (e.key === " " && spaceHeld) { spaceHeld = false; panning = null; setTool(toolBeforeSpace || "select", true); toolBeforeSpace = null; }
  });
  document.addEventListener("fullscreenchange", () => { if (present && document.fullscreenElement !== root) setPresent(false); });
  addEventListener("resize", () => { if (innerWidth >= 900) root.classList.remove("show-left", "show-right"); refreshUI(); });

  /* =====================================================================
     Start: reopen the last design, or begin with a brief
     ===================================================================== */
  doc.artboards = [newArtboard(1080, 1350)];
  nameIn.value = doc.name;
  setSaved("ok", "Saved");
  setTool("select");
  resize();
  const qBrief = new URLSearchParams(location.search).get("brief");
  if (qBrief != null && BRIEFS[+qBrief]) { briefPick = +qBrief; ltab = "assets"; assetTab = "brief"; }
  store.get("current").then(s => (s ? restore(s, { keepHistory: false, refit: true }) : Promise.reject()))
    .then(() => setSaved("ok", "Saved"))
    .catch(() => {
      fitArtboard();
      hist.stack = [snapshot()]; hist.meta = [{ label: "New Design", time: Date.now() }]; hist.i = 0;
      refreshUI();
    });
  refreshUI();
};
