/* =====================================================================
   CANVAS — a free vector design app in the browser (canvas.html)
   Laid out like a desktop design app: menu bar, control bar, toolbox,
   rulers with guides, a pasteboard with artboards, panels and a status
   bar. Built on Fabric.js 5 (js/vendor/fabric.min.js, MIT licence).
   Everything stays in the browser: designs autosave to this device
   (IndexedDB) and export as PNG, JPG, SVG or a project file.
   site.js calls window.DSCanvas(kit) on the Canvas page.
   ===================================================================== */
window.DSCanvas = function (kit) {
  const { $, $$, esc, icon, DS } = kit;
  const root = $("[data-canvas]");
  if (!root || !window.fabric) return;
  const F = window.fabric;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k; };
  // Text that isn't in the page (dialogs, default words on the canvas) in the visitor's language
  const tr = s => (window.DS_I18N && window.DS_I18N.strings && window.DS_I18N.strings[s]) || s;
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const keyLabel = k => (k || "").replace("mod+", mac ? "⌘" : "Ctrl+").replace("shift+", mac ? "⇧" : "Shift+").replace("alt+", mac ? "⌥" : "Alt+");
  const isTyping = t => t && t.closest && t.closest("input, textarea, select, [contenteditable]");

  /* =====================================================================
     Icons
     ===================================================================== */
  const UI = {
    select: '<path d="M6 3.5l12.5 9.6-5.6 1 3.1 5.8-2.3 1.2-3.1-5.8-4.6 3.7z" fill="currentColor" stroke="none"/>',
    direct: '<path d="M6 3.5l12.5 9.6-5.6 1 3.1 5.8-2.3 1.2-3.1-5.8-4.6 3.7z"/>',
    pen: '<path d="M12 3.5 18.5 12l-3.2 7.5H8.7L5.5 12z"/><path d="M12 3.5v7"/><circle cx="12" cy="12.2" r="1.4"/><path d="M8.7 21h6.6"/>',
    pencil: '<path d="M4 20l1.4-4.6L15.6 5.2a2 2 0 0 1 2.9 0l.3.3a2 2 0 0 1 0 2.9L8.6 18.6z"/><path d="M13.8 7l3.2 3.2"/>',
    brush: '<path d="M20 4 11 13"/><path d="M11 13c-2.6-.6-4.6.6-5 3.2-.3 1.9-1 2.8-2 3.3 3.3.9 7 .2 7.9-2.6.4-1.3.1-2.8-.9-3.9z"/>',
    type: '<path d="M5 5.5h14M12 5.5v13M9 18.5h6"/>',
    line: '<path d="M5 19 19 5"/>',
    rect: '<rect x="4" y="5.5" width="16" height="13"/>',
    rounded: '<rect x="4" y="5.5" width="16" height="13" rx="3.5"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6.8"/>',
    polygon: '<path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8z"/>',
    star: '<path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>',
    rotate: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.8 4.2v4.6h-4.6"/>',
    scale: '<rect x="3.5" y="11" width="9.5" height="9.5"/><path d="M9 3.5h11.5V15M20.5 3.5 12 12"/>',
    eyedropper: '<path d="M14.5 4.5a2.5 2.5 0 0 1 3.5 0l1.5 1.5a2.5 2.5 0 0 1 0 3.5L17 12l-5-5z"/><path d="m12.5 7.5-8 8V19h3.5l8-8"/>',
    gradient: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 4v16" opacity=".85"/><path d="M12 4v16" opacity=".55"/><path d="M16 4v16" opacity=".25"/>',
    artboard: '<path d="M7.5 3v18M16.5 3v18M3 7.5h18M3 16.5h18"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.8a1.5 1.5 0 0 1 3 0V11M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 4-2.6 6.8-6.2 6.8-2.3 0-3.9-1-5.3-3L3.7 15a1.5 1.5 0 0 1 2.4-1.8L8 15.2"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.7-4.7M8 10.5h5M10.5 8v5"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    swap: '<path d="M7 4h8a3 3 0 0 1 3 3v8"/><path d="m15 13 3 3 3-3M9 1.5 6.5 4 9 6.5"/>',
    none: '<path d="M5 19 19 5" stroke="#ff3b30" stroke-width="2.2"/>',
    "eye-off": '<path d="M3 3l18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.9 3.7M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 5.1-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.2"/>',
    front: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5.5A1.5 1.5 0 0 1 5.5 4H16"/>',
    back: '<rect x="4" y="4" width="12" height="12" rx="1.5"/><path d="M20 8v10.5a1.5 1.5 0 0 1-1.5 1.5H8"/>',
    "al-left": '<path d="M4 3v18"/><rect x="7.5" y="6" width="12" height="4" rx="1"/><rect x="7.5" y="14" width="7" height="4" rx="1"/>',
    "al-center": '<path d="M12 3v18"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
    "al-right": '<path d="M20 3v18"/><rect x="4.5" y="6" width="12" height="4" rx="1"/><rect x="9.5" y="14" width="7" height="4" rx="1"/>',
    "al-top": '<path d="M3 4h18"/><rect x="6" y="7.5" width="4" height="12" rx="1"/><rect x="14" y="7.5" width="4" height="7" rx="1"/>',
    "al-middle": '<path d="M3 12h18"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
    "al-bottom": '<path d="M3 20h18"/><rect x="6" y="4.5" width="4" height="12" rx="1"/><rect x="14" y="9.5" width="4" height="7" rx="1"/>',
    "dist-h": '<path d="M4 3v18M20 3v18"/><rect x="9.5" y="7" width="5" height="10" rx="1"/>',
    "dist-v": '<path d="M3 4h18M3 20h18"/><rect x="7" y="9.5" width="10" height="5" rx="1"/>',
    "t-left": '<path d="M4 6h16M4 12h10M4 18h13"/>', "t-center": '<path d="M4 6h16M7 12h10M5.5 18h13"/>',
    "t-right": '<path d="M4 6h16M10 12h10M7 18h13"/>', "t-justify": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "flip-h": '<path d="M12 3v18"/><path d="M9 7 3 17h6zM15 7l6 10h-6z"/>',
    "flip-v": '<path d="M3 12h18"/><path d="M7 9 17 3v6zM7 15l10 6v-6z"/>',
    group: '<rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><rect x="7" y="7" width="5" height="5" rx="1"/><rect x="12" y="12" width="5" height="5" rx="1"/>',
    ungroup: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    expand: '<path d="M4 4h16v16H4z" stroke-dasharray="2 2"/><circle cx="4" cy="4" r="1.6" fill="currentColor"/><circle cx="20" cy="4" r="1.6" fill="currentColor"/><circle cx="20" cy="20" r="1.6" fill="currentColor"/><circle cx="4" cy="20" r="1.6" fill="currentColor"/>',
    rulers: '<path d="M3 3h18v6H9v12H3z"/><path d="M7 3v3M11 3v3M15 3v3M3 13h3M3 17h3"/>',
    grid: '<path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"/>',
    guides: '<path d="M8 3v18M3 15h18" stroke-dasharray="3 2"/>',
    smart: '<path d="M4 12h16M12 4v16" stroke="#ff2fa4"/><rect x="8" y="8" width="8" height="8"/>',
    snapgrid: '<path d="M3 9h18M9 3v18" opacity=".5"/><rect x="9" y="9" width="8" height="8" fill="currentColor"/>',
    chev: '<path d="m7 10 5 5 5-5"/>', right: '<path d="m10 7 5 5-5 5"/>', left: '<path d="m14 7-5 5 5 5"/>',
    first: '<path d="m13 7-5 5 5 5M6 6v12"/>', last: '<path d="m11 7 5 5-5 5M18 6v12"/>',
    panels: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>',
    swatches: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    italic: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>', underline: '<path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    export: '<path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    fonts: '<path d="M4 19 9.5 5h1L16 19M6.2 14h7.6"/><path d="M17 19v-6.5a2.5 2.5 0 0 1 5 0V19M17 15.5h5"/>'
  };
  const ui = (id, cls = "") => (UI[id]
    ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${UI[id]}</svg>`
    : icon(id, cls));

  /* =====================================================================
     Data: tools, sizes, fonts, briefs, swatches
     ===================================================================== */
  // Toolbox groups: the first tool shows; the rest open from a flyout (long-press or right-click)
  const TOOL_GROUPS = [
    [["select", "Selection Tool", "V"]], [["direct", "Direct Selection Tool", "A"]],
    [["pen", "Pen Tool", "P"]], [["pencil", "Pencil Tool", "N"], ["brush", "Paintbrush Tool", "B"]],
    [["type", "Type Tool", "T"]], [["line", "Line Segment Tool", "\\"]],
    [["rect", "Rectangle Tool", "M"], ["rounded", "Rounded Rectangle Tool", ""], ["ellipse", "Ellipse Tool", "L"], ["polygon", "Polygon Tool", ""], ["star", "Star Tool", ""]],
    [["rotate", "Rotate Tool", "R"]], [["scale", "Scale Tool", "S"]], [["eyedropper", "Eyedropper Tool", "I"]],
    [["gradient", "Gradient Tool", "G"]], [["artboard", "Artboard Tool", "shift+O"]],
    [["hand", "Hand Tool", "H"]], [["zoom", "Zoom Tool", "Z"]]
  ];
  const TOOL_INFO = Object.fromEntries(TOOL_GROUPS.flat().map(([id, name, key]) => [id, { name, key }]));
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
    zoom: "Click to zoom in, Alt-click to zoom out."
  };
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
  const pal = name => ((DS.palettes || []).find(p => p.name === name) || { colors: ["#0f0f0f", "#1f7aff", "#ffffff"] }).colors;
  const BASIC = ["#ffffff", "#d9d9d9", "#a6a6a6", "#737373", "#404040", "#000000", "#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#00c7be",
    "#1f7aff", "#5856d6", "#af52de", "#ff2d55", "#a2845e"];
  const GRADIENTS = [["#1f7aff", "#7c5cff"], ["#ff6b35", "#ee4266"], ["#ffd23f", "#ff6b35"], ["#00c7be", "#1f7aff"], ["#ffffff", "#000000"]];
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
     Menus
     ===================================================================== */
  // [label, shortcut, action, check?] · "-" separator · [label, [submenu]]
  const MENUS = [
    ["File", [["New", "mod+N", "new"], ["Open…", "mod+O", "open"], "-", ["Save", "mod+S", "save"], ["Save a Copy (project file)…", "mod+shift+S", "save-file"], "-",
      ["Place Image…", "mod+shift+P", "place"], "-",
      ["Export", [["Export as PNG…", "", "export:png"], ["Export as JPG…", "", "export:jpg"], ["Export as SVG…", "", "export:svg"], "-", ["Export All Artboards (PNG)", "", "export-all"]]],
      ["Export As…", "mod+shift+E", "export"], "-", ["Document Setup…", "mod+alt+P", "doc-setup"]]],
    ["Edit", [["Undo", "mod+Z", "undo"], ["Redo", "mod+shift+Z", "redo"], "-", ["Cut", "mod+X", "cut"], ["Copy", "mod+C", "copy"], ["Paste", "mod+V", "paste"],
      ["Paste in Place", "mod+shift+V", "paste-in-place"], ["Duplicate", "mod+D", "duplicate"], ["Clear", "Del", "delete"], "-",
      ["Preferences…", "mod+K", "prefs"], ["Keyboard Shortcuts…", "mod+alt+shift+K", "shortcuts"]]],
    ["Object", [["Transform", [["Flip Horizontal", "", "flip-h"], ["Flip Vertical", "", "flip-v"], ["Reset Rotation", "", "reset-rot"], ["Reset Size", "", "reset-scale"]]],
      ["Arrange", [["Bring to Front", "mod+shift+]", "front"], ["Bring Forward", "mod+]", "forward"], ["Send Backward", "mod+[", "backward"], ["Send to Back", "mod+shift+[", "back"]]],
      ["Align", [["Left", "", "align:left"], ["Horizontal Centre", "", "align:center"], ["Right", "", "align:right"], ["Top", "", "align:top"], ["Vertical Centre", "", "align:middle"], ["Bottom", "", "align:bottom"], "-", ["Distribute Horizontally", "", "dist:h"], ["Distribute Vertically", "", "dist:v"]]],
      "-", ["Group", "mod+G", "group"], ["Ungroup", "mod+shift+G", "ungroup"], "-",
      ["Lock Selection", "mod+2", "lock"], ["Unlock All", "mod+alt+2", "unlock-all"], ["Hide Selection", "mod+3", "hide"], ["Show All", "mod+alt+3", "show-all"], "-",
      ["Expand to Editable Path", "", "expand"],
      ["Artboards", [["New Artboard", "", "ab-new"], ["Duplicate Artboard", "", "ab-dup"], ["Fit to Artwork Bounds", "", "ab-fit"], ["Delete Artboard", "", "ab-delete"]]]]],
    ["Type", [["Font Pairs…", "", "panel:text"], "-",
      ["Change Case", [["UPPERCASE", "", "case:upper"], ["lowercase", "", "case:lower"], ["Title Case", "", "case:title"], ["Sentence case", "", "case:sentence"]]],
      ["Paragraph", [["Align Left", "", "talign:left"], ["Align Centre", "", "talign:center"], ["Align Right", "", "talign:right"], ["Justify", "", "talign:justify"]]], "-",
      ["Fill With Placeholder Text", "", "lorem"]]],
    ["Select", [["All", "mod+A", "select-all"], ["All on Active Artboard", "mod+alt+A", "select-artboard"], ["Deselect", "mod+shift+A", "deselect"], ["Inverse", "", "select-inverse"], "-",
      ["Same", [["Fill Colour", "", "same:fill"], ["Stroke Colour", "", "same:stroke"], ["Font", "", "same:font"]]]]],
    ["Effect", [["Drop Shadow", "", "fx:shadow"], ["Remove Drop Shadow", "", "fx:noshadow"], "-",
      ["Image", [["Black and White", "", "fx:gray"], ["Sepia", "", "fx:sepia"], ["Invert", "", "fx:invert"], ["Blur", "", "fx:blur"], ["Clear Image Effects", "", "fx:clear"]]]]],
    ["View", [["Zoom In", "mod+=", "zoom-in"], ["Zoom Out", "mod+-", "zoom-out"], ["Fit Artboard in Window", "mod+0", "fit"], ["Fit All in Window", "mod+alt+0", "fit-all"], ["Actual Size", "mod+1", "actual"], "-",
      ["Rulers", "mod+R", "toggle:rulers", "rulers"], ["Smart Guides", "mod+U", "toggle:smart", "smart"], ["Guides", "mod+;", "toggle:guides", "guides"],
      ["Lock Guides", "mod+alt+;", "toggle:lockGuides", "lockGuides"], ["Clear Guides", "", "clear-guides"], "-",
      ["Grid", "mod+'", "toggle:grid", "grid"], ["Snap to Grid", "mod+shift+'", "toggle:snapGrid", "snapGrid"], ["Artboard Names", "", "toggle:names", "names"]]],
    ["Window", [["Properties", "", "panel:properties", "panel:properties"], ["Layers", "F7", "panel:layers", "panel:layers"], ["Artboards", "", "panel:artboards", "panel:artboards"],
      ["Swatches", "", "panel:swatches", "panel:swatches"], ["Libraries", "", "panel:libraries", "panel:libraries"], ["Brief", "", "panel:brief", "panel:brief"], "-",
      ["Control Bar", "", "toggle:control", "control"], ["Tools", "", "toggle:tools", "tools"], "-", ["Reset Workspace", "", "reset-ws"]]],
    ["Help", [["Canvas Help", "F1", "shortcuts"], ["Keyboard Shortcuts…", "", "shortcuts"], "-", ["Design Basics course", "", "learn"], ["About Canvas", "", "about"]]]
  ];

  /* =====================================================================
     Markup
     ===================================================================== */
  const toolBtn = g => {
    const [id, name, key] = g[0];
    return `<button type="button" class="ai-tool${g.length > 1 ? " has-more" : ""}" data-tool="${id}" data-group='${JSON.stringify(g.map(t => t[0]))}' aria-label="${name}" data-tip="${name}${key ? ` (${keyLabel(key.toLowerCase().startsWith("shift+") ? key : key)})` : ""}">${ui(id)}</button>`;
  };
  const RIGHT_STRIP = [["swatches", "swatches", "Swatches"], ["artboards", "artboard", "Artboards"], ["brief", "target", "Brief"], ["templates", "grid", "Templates"],
    ["text", "fonts", "Font Pairs"], ["icons", "smile", "Icons"], ["images", "image", "Images"], ["layers", "layers", "Layers"]];
  root.innerHTML = `
    <div class="ai-menubar" role="menubar">
      <span class="ai-logo" aria-hidden="true">Ds</span>
      <span class="ai-menus">${MENUS.map(([m], i) => `<button type="button" class="ai-menu-btn" data-menu="${i}" role="menuitem" aria-haspopup="true">${m}</button>`).join("")}</span>
      <span class="ai-saved" data-saved></span>
      <button type="button" class="ai-icon-btn ai-mob-panels" data-act="toggle-dock" aria-label="Panels">${ui("panels")}</button>
      <button type="button" class="ai-share" data-act="export">${ui("export")}<span>Export</span></button>
    </div>
    <div class="ai-control" data-control></div>
    <div class="ai-main">
      <div class="ai-tools" data-tools>
        <div class="ai-toolgrid">${TOOL_GROUPS.map(toolBtn).join("")}</div>
        <div class="ai-paint" data-paint>
          <label class="ai-fillsw" data-tip="Fill (X switches)"><input type="color" data-paintin="fill" aria-label="Fill colour"><i></i></label>
          <label class="ai-strokesw" data-tip="Stroke (X switches)"><input type="color" data-paintin="stroke" aria-label="Stroke colour"><i></i></label>
          <button type="button" class="ai-swap" data-act="swap-paint" aria-label="Swap fill and stroke" data-tip="Swap Fill and Stroke (Shift+X)">${ui("swap")}</button>
          <button type="button" class="ai-default" data-act="default-paint" aria-label="Default fill and stroke" data-tip="Default Fill and Stroke (D)"><i></i><i></i></button>
        </div>
        <div class="ai-paintmode">
          <button type="button" data-act="paint-colour" aria-label="Colour" data-tip="Colour"><i class="pm-colour"></i></button>
          <button type="button" data-act="paint-gradient" aria-label="Gradient" data-tip="Gradient"><i class="pm-grad"></i></button>
          <button type="button" data-act="paint-none" aria-label="None" data-tip="None"><i class="pm-none"></i></button>
        </div>
      </div>
      <div class="ai-center">
        <div class="ai-tabs"><div class="ai-doctab is-on"><span data-doctab></span><button type="button" data-act="new" aria-label="Close and start a new document">${ui("close")}</button></div></div>
        <div class="ai-viewport" data-viewport>
          <span class="ai-corner" data-act="toggle:rulers" aria-hidden="true"></span>
          <canvas class="ai-ruler h" data-ruler="h" aria-hidden="true"></canvas>
          <canvas class="ai-ruler v" data-ruler="v" aria-hidden="true"></canvas>
          <div class="ai-stage" data-stage><canvas></canvas></div>
          <div class="ai-measure" data-measure hidden></div>
          <div class="ai-drop" data-drop><span>${ui("upload")}Drop images to place them</span></div>
          <div class="ai-toast" data-toast role="status"></div>
        </div>
        <div class="ai-status">
          <label class="ai-zoomsel"><input data-zoomin value="100%" aria-label="Zoom" spellcheck="false"><button type="button" data-act="zoom-menu" aria-label="Zoom presets">${ui("chev")}</button></label>
          <span class="ai-abnav">
            <button type="button" data-act="ab-first" aria-label="First artboard">${ui("first")}</button>
            <button type="button" data-act="ab-prev" aria-label="Previous artboard">${ui("left")}</button>
            <select data-absel aria-label="Artboard"></select>
            <button type="button" data-act="ab-next" aria-label="Next artboard">${ui("right")}</button>
            <button type="button" data-act="ab-last" aria-label="Last artboard">${ui("last")}</button>
          </span>
          <span class="ai-hint" data-hint></span>
        </div>
      </div>
      <div class="ai-strip" aria-label="Panels">
        ${RIGHT_STRIP.map(([k, ic, label]) => `<button type="button" data-panel="${k}" aria-label="${label}" data-tip="${label}">${ui(ic)}</button>`).join("")}
      </div>
      <aside class="ai-dock" data-dock>
        <div class="ai-docktabs" data-docktabs></div>
        <div class="ai-dockbody" data-dockbody></div>
      </aside>
    </div>
    <div class="ai-menu" data-menupop hidden role="menu"></div>
    <div class="ai-flyout" data-flyout hidden></div>
    <div class="ai-modal" data-modal hidden><div class="ai-dialog" role="dialog" aria-modal="true" data-dialog></div></div>
    <input type="file" accept="image/*" multiple hidden data-file-img>
    <input type="file" accept=".json,application/json" hidden data-file-json>`;

  const stage = $("[data-stage]", root), viewport = $("[data-viewport]", root), control = $("[data-control]", root);
  const dockBody = $("[data-dockbody]", root), dockTabs = $("[data-docktabs]", root), menuPop = $("[data-menupop]", root);
  const flyout = $("[data-flyout]", root), modal = $("[data-modal]", root), dialog = $("[data-dialog]", root);
  const measureEl = $("[data-measure]", root), toastEl = $("[data-toast]", root), hintEl = $("[data-hint]", root);
  const zoomIn = $("[data-zoomin]", root), abSel = $("[data-absel]", root), savedEl = $("[data-saved]", root);
  const rulerH = $("[data-ruler=h]", root), rulerV = $("[data-ruler=v]", root);

  /* =====================================================================
     Fabric setup
     ===================================================================== */
  F.Object.prototype.set({
    transparentCorners: false, cornerColor: "#ffffff", cornerStrokeColor: "#1f7aff", borderColor: "#1f7aff",
    cornerSize: 8, cornerStyle: "rect", borderScaleFactor: 1, padding: 0, borderOpacityWhenMoving: .6
  });
  F.IText.prototype.set({ editingBorderColor: "#1f7aff", cursorColor: "#1f7aff", selectionColor: "rgba(31, 122, 255, .3)" });
  if (F.Canvas2dFilterBackend) F.filterBackend = new F.Canvas2dFilterBackend();
  const PROPS = ["name", "locked", "kind", "kindRadius", "anchors", "closed", "hasControls", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation"];
  const cv = new F.Canvas($("canvas", stage), {
    preserveObjectStacking: true, stopContextMenu: true, fireRightClick: true, uniformScaling: false, uniScaleKey: "shiftKey",
    selectionColor: "rgba(31, 122, 255, .06)", selectionBorderColor: "#1f7aff", selectionLineWidth: 1, targetFindTolerance: 4
  });

  /* ---------- Document state ---------- */
  const PASTE = "#3c3c3c", GUIDE = "#24c1ff", SMART = "#ff2fa4";
  const doc = { name: tr("Untitled design"), artboards: [], active: 0, guides: { v: [], h: [] } };
  const view = { rulers: true, smart: true, guides: true, lockGuides: false, grid: false, snapGrid: false, names: true, control: true, tools: true };
  const prefs = { nudge: 1, scaleStrokes: false, gridSize: 20 };
  const paint = { fill: "#ffffff", stroke: "#000000", strokeWidth: 1, focus: "fill" };
  const charState = { family: "Inter", weight: 400, size: 48 };
  let tool = "select", brief = null, abSelected = -1;
  const ab = () => doc.artboards[doc.active] || doc.artboards[0];
  const newArtboard = (w, h, x = 0, y = 0, bg = "#ffffff") => ({ name: `${tr("Artboard")} ${doc.artboards.length + 1}`, x, y, w, h, bg });
  const unit = () => { const a = ab(); return a ? Math.min(a.w, a.h) / 1080 : 1; };
  try { Object.assign(view, JSON.parse(localStorage.getItem("ds-canvas-view") || "{}")); Object.assign(prefs, JSON.parse(localStorage.getItem("ds-canvas-prefs") || "{}")); } catch (e) { /* defaults */ }
  const saveView = () => { try { localStorage.setItem("ds-canvas-view", JSON.stringify(view)); localStorage.setItem("ds-canvas-prefs", JSON.stringify(prefs)); } catch (e) { /* private mode */ } };
  root.classList.toggle("no-rulers", !view.rulers);
  root.classList.toggle("no-control", !view.control);
  root.classList.toggle("no-tools", !view.tools);

  /* =====================================================================
     Pasteboard, artboards, grid (drawn under the artwork)
     ===================================================================== */
  const exporting = () => !cv.interactive;
  let exportBg = true;
  cv._renderBackground = function (ctx) {
    const v = this.viewportTransform;
    if (!exporting()) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = PASTE; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
    }
    ctx.save();
    ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    doc.artboards.forEach(a => {
      if (exporting() && !exportBg) return;
      if (!exporting()) { ctx.shadowColor = "rgba(0,0,0,.35)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 2; }
      ctx.fillStyle = a.bg || "#ffffff";
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.shadowColor = "transparent";
    });
    if (view.grid && !exporting()) {
      const g = prefs.gridSize, z = v[0];
      if (g * z >= 5) {
        ctx.lineWidth = 1 / z;
        doc.artboards.forEach(a => {
          ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
          for (let x = a.x, i = 0; x <= a.x + a.w; x += g, i++) { ctx.strokeStyle = i % 5 ? "rgba(0,0,0,.06)" : "rgba(0,0,0,.13)"; ctx.beginPath(); ctx.moveTo(x, a.y); ctx.lineTo(x, a.y + a.h); ctx.stroke(); }
          for (let y = a.y, i = 0; y <= a.y + a.h; y += g, i++) { ctx.strokeStyle = i % 5 ? "rgba(0,0,0,.06)" : "rgba(0,0,0,.13)"; ctx.beginPath(); ctx.moveTo(a.x, y); ctx.lineTo(a.x + a.w, y); ctx.stroke(); }
          ctx.restore();
        });
      }
    }
    ctx.restore();
  };
  // Over the artwork: artboard frames and names, ruler guides, anchor handles
  cv.on("after:render", ({ ctx }) => {
    if (exporting()) return;
    const v = cv.viewportTransform, z = v[0];
    ctx.save();
    ctx.transform(v[0], v[1], v[2], v[3], v[4], v[5]);
    doc.artboards.forEach((a, i) => {
      const on = i === doc.active, sel = tool === "artboard" && i === abSelected;
      ctx.lineWidth = (sel ? 2 : 1) / z;
      ctx.strokeStyle = sel ? "#1f7aff" : on ? "rgba(0,0,0,.55)" : "rgba(0,0,0,.25)";
      ctx.strokeRect(a.x, a.y, a.w, a.h);
      if (view.names) {
        ctx.font = `${11 / z}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = on ? "#e6e6e6" : "#a8a8a8";
        ctx.fillText(`${String(i + 1).padStart(2, "0")} - ${a.name}`, a.x, a.y - 6 / z);
      }
    });
    if (view.guides) {
      ctx.strokeStyle = GUIDE; ctx.lineWidth = 1 / z;
      const inv = F.util.invertTransform(v), tl = F.util.transformPoint(new F.Point(0, 0), inv), br = F.util.transformPoint(new F.Point(cv.width, cv.height), inv);
      doc.guides.v.forEach(x => { ctx.beginPath(); ctx.moveTo(x, tl.y); ctx.lineTo(x, br.y); ctx.stroke(); });
      doc.guides.h.forEach(y => { ctx.beginPath(); ctx.moveTo(tl.x, y); ctx.lineTo(br.x, y); ctx.stroke(); });
    }
    // anchor handles of the path being edited
    const o = cv.getActiveObject();
    if (tool === "direct" && o && o.kind === "vector" && o.anchors) {
      const m = o.calcTransformMatrix();
      ctx.strokeStyle = "#1f7aff"; ctx.lineWidth = 1 / z;
      o.anchors.forEach(a => {
        const p = toScene(o, a.x, a.y);
        [[a.ix, a.iy], [a.ox, a.oy]].forEach(([hx, hy]) => {
          if (!hx && !hy) return;
          const q = toScene(o, a.x + hx, a.y + hy);
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        });
      });
      void m;
    }
    ctx.restore();
    drawRulers();
  });

  /* ---------- View: zoom and pan ---------- */
  const zoom = () => cv.getZoom();
  function fitRect(r, pad = 60) {
    const W = cv.width, H = cv.height;
    if (!W || !H || !r) return;
    const z = clamp(Math.min((W - pad * 2) / r.w, (H - pad * 2) / r.h), .02, 64);
    cv.setViewportTransform([z, 0, 0, z, (W - r.w * z) / 2 - r.x * z, (H - r.h * z) / 2 - r.y * z]);
    afterView();
  }
  const fitArtboard = () => fitRect(ab(), innerWidth < 900 ? 24 : 60);
  const allBounds = () => {
    const rs = doc.artboards.map(a => ({ l: a.x, t: a.y, r: a.x + a.w, b: a.y + a.h }));
    cv.getObjects().forEach(o => { const b = o.getBoundingRect(true, true); rs.push({ l: b.left, t: b.top, r: b.left + b.width, b: b.top + b.height }); });
    const l = Math.min(...rs.map(r => r.l)), t = Math.min(...rs.map(r => r.t));
    return { x: l, y: t, w: Math.max(...rs.map(r => r.r)) - l, h: Math.max(...rs.map(r => r.b)) - t };
  };
  const zoomAt = (pt, z) => { cv.zoomToPoint(new F.Point(pt.x, pt.y), clamp(z, .02, 64)); afterView(); };
  const zoomCenter = z => zoomAt({ x: cv.width / 2, y: cv.height / 2 }, z);
  function afterView() {
    cv.getObjects().forEach(o => o.setCoords());
    const a = cv.getActiveObject(); if (a) a.setCoords();
    if (document.activeElement !== zoomIn) zoomIn.value = round(zoom() * 100, zoom() < .1 ? 1 : 0) + "%";
    $("[data-doctab]", root).textContent = `${doc.name} @ ${round(zoom() * 100, 1)}% (RGB/Preview)`;
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
  stage.addEventListener("wheel", e => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || e.altKey) {
      const r = stage.getBoundingClientRect();
      zoomAt({ x: e.clientX - r.left, y: e.clientY - r.top }, zoom() * Math.pow(1.0018, -e.deltaY * (e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 50 ? 4 : 1)));
    } else {
      cv.relativePan(new F.Point(-(e.shiftKey ? e.deltaY : e.deltaX), -(e.shiftKey ? 0 : e.deltaY)));
      afterView();
    }
  }, { passive: false });
  zoomIn.addEventListener("change", () => { const v = parseFloat(zoomIn.value); if (v > 0) zoomCenter(v / 100); else afterView(); zoomIn.blur(); });
  zoomIn.addEventListener("keydown", e => { if (e.key === "Enter") zoomIn.blur(); });

  /* ---------- Rulers ---------- */
  const DPR = () => window.devicePixelRatio || 1;
  function sizeRulers() {
    [[rulerH, "h"], [rulerV, "v"]].forEach(([c]) => { const r = c.getBoundingClientRect(); c.width = Math.round(r.width * DPR()); c.height = Math.round(r.height * DPR()); });
    drawRulers();
  }
  let mouseScreen = null;
  function drawRulers() {
    if (!view.rulers) return;
    const v = cv.viewportTransform, z = v[0], a = ab() || { x: 0, y: 0 };
    const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const major = steps.find(s => s * z >= 64) || 10000, minor = major / (major % 5 === 0 && major >= 5 ? 5 : 2);
    const sel = cv.getActiveObject(), sb = sel ? sel.getBoundingRect() : null;
    [[rulerH, true], [rulerV, false]].forEach(([c, horiz]) => {
      const x = c.getContext("2d"), d = DPR(), W = c.width / d, H = c.height / d;
      x.setTransform(d, 0, 0, d, 0, 0);
      x.fillStyle = "#2b2b2b"; x.fillRect(0, 0, W, H);
      const len = horiz ? W : H, off = horiz ? v[4] + a.x * z : v[5] + a.y * z;   // screen position of the artboard's 0
      if (sb) { x.fillStyle = "rgba(31,122,255,.28)"; if (horiz) x.fillRect(sb.left, 0, sb.width, H); else x.fillRect(0, sb.top, W, sb.height); }
      x.strokeStyle = "#7a7a7a"; x.fillStyle = "#a3a3a3"; x.lineWidth = 1; x.font = "9px Inter, system-ui, sans-serif";
      const start = Math.floor(-off / z / minor) * minor, end = (len - off) / z;
      x.beginPath();
      for (let u = start; u <= end; u += minor) {
        const s = Math.round(off + u * z) + .5, isMajor = Math.abs(u / major - Math.round(u / major)) < 1e-6;
        const t = isMajor ? (horiz ? H : W) : (horiz ? H : W) * .3;
        if (horiz) { x.moveTo(s, H); x.lineTo(s, H - t); } else { x.moveTo(W, s); x.lineTo(W - t, s); }
        if (isMajor) {
          const label = String(round(u, 2));
          if (horiz) x.fillText(label, s + 3, 9);
          else { x.save(); x.translate(9, s + 3); x.rotate(-Math.PI / 2); x.fillText(label, -x.measureText(label).width - 3, 0); x.restore(); }
        }
      }
      x.stroke();
      if (mouseScreen) { x.strokeStyle = "#1f7aff"; x.beginPath(); const m = (horiz ? mouseScreen.x : mouseScreen.y) + .5; if (horiz) { x.moveTo(m, 0); x.lineTo(m, H); } else { x.moveTo(0, m); x.lineTo(W, m); } x.stroke(); }
      x.fillStyle = "#3d3d3d"; if (horiz) x.fillRect(0, H - 1, W, 1); else x.fillRect(W - 1, 0, 1, H);
    });
  }
  // Drag from a ruler to make a guide; drag a guide back onto a ruler to remove it
  let guideDrag = null;
  const stagePt = e => { const r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }; };
  const sceneOf = sp => F.util.transformPoint(new F.Point(sp.x, sp.y), F.util.invertTransform(cv.viewportTransform));
  [[rulerH, "h"], [rulerV, "v"]].forEach(([c, axis]) => c.addEventListener("pointerdown", e => {
    if (view.lockGuides) return;
    e.preventDefault();
    guideDrag = { axis, index: doc.guides[axis].push(-1e9) - 1 };
    view.guides = true;
  }));
  window.addEventListener("pointermove", e => {
    if (!guideDrag) return;
    const sp = stagePt(e), p = sceneOf(sp);
    doc.guides[guideDrag.axis][guideDrag.index] = guideDrag.axis === "h" ? round(p.y) : round(p.x);
    showMeasure(e, guideDrag.axis === "h" ? `Y: ${round(p.y - ab().y)} px` : `X: ${round(p.x - ab().x)} px`);
    cv.requestRenderAll();
  });
  window.addEventListener("pointerup", e => {
    if (!guideDrag) return;
    const sp = stagePt(e);
    if (!sp.inside) doc.guides[guideDrag.axis].splice(guideDrag.index, 1);
    guideDrag = null; hideMeasure(); cv.requestRenderAll(); changed();
  });

  /* =====================================================================
     Fonts
     ===================================================================== */
  const fontReady = {};
  const loadFont = (family, weight = 400) => {
    if (family === "Georgia" || !document.fonts) return Promise.resolve();
    const key = family + weight;
    if (!fontReady[key]) fontReady[key] = document.fonts.load(`${weight} 40px "${family}"`).then(() => { F.util.clearFabricFontCache(family); }).catch(() => {});
    return fontReady[key];
  };
  const isText = o => o && (o.type === "textbox" || o.type === "i-text" || o.type === "text");
  const flat = objs => objs.flatMap(o => (o.type === "group" ? flat(o.getObjects()) : [o]));
  const loadFontsOf = objs => Promise.all(flat(objs).filter(isText).map(o => loadFont(o.fontFamily, o.fontWeight)));
  const refreshText = () => { flat(cv.getObjects()).forEach(o => { if (o.initDimensions) { o.initDimensions(); o.setCoords(); } }); cv.requestRenderAll(); };

  /* =====================================================================
     Vector paths: anchors with handles, editable with Direct Selection
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
  // path coordinates ↔ scene
  const toScene = (o, x, y) => F.util.transformPoint(new F.Point(x - o.pathOffset.x, y - o.pathOffset.y), o.calcTransformMatrix());
  const toLocal = (o, x, y) => { const p = F.util.transformPoint(new F.Point(x, y), F.util.invertTransform(o.calcTransformMatrix())); return { x: p.x + o.pathOffset.x, y: p.y + o.pathOffset.y }; };
  // Rebuild the path from its anchors without moving the parts that didn't change
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
      default: return null;
    }
  }
  // Turn a live shape into an editable path (Object › Expand)
  function expand(o) {
    if (!o || o.kind === "vector") return o;
    const pts = shapeAnchors(o);
    if (!pts) return o;
    const closed = !(o.type === "line" || o.type === "polyline");
    const p = vector(pts, closed, {
      fill: o.type === "line" ? null : o.fill, stroke: o.stroke, strokeWidth: o.strokeWidth, strokeUniform: o.strokeUniform, strokeDashArray: o.strokeDashArray,
      strokeLineCap: o.strokeLineCap, strokeLineJoin: o.strokeLineJoin, opacity: o.opacity, shadow: o.shadow, name: o.name,
      angle: o.angle, scaleX: o.scaleX, scaleY: o.scaleY, flipX: o.flipX, flipY: o.flipY, skewX: o.skewX, skewY: o.skewY
    });
    p.setPositionByOrigin(o.getCenterPoint(), "center", "center");
    const i = cv.getObjects().indexOf(o);
    hist.busy++;
    cv.remove(o); cv.insertAt(p, i);
    hist.busy--;
    applyToolState(p);
    p.setCoords();
    return p;
  }
  // Direct Selection: one control per anchor and per handle
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
        mouseDownHandler: (e) => {
          anchorSel = i;
          if (e.altKey) { toggleSmooth(o, i); return true; }
          return false;
        },
        actionHandler: (e, t, x, y) => { const l = toLocal(o, x, y), an = o.anchors[i]; an.x = l.x; an.y = l.y; rebuild(o); showMeasure(e, `X: ${round(x - ab().x)}  Y: ${round(y - ab().y)}`); return true; },
        render: (ctx, left, top) => { ctx.save(); ctx.fillStyle = i === anchorSel ? "#1f7aff" : "#ffffff"; ctx.strokeStyle = "#1f7aff"; ctx.lineWidth = 1; ctx.fillRect(left - 3.5, top - 3.5, 7, 7); ctx.strokeRect(left - 3.5, top - 3.5, 7, 7); ctx.restore(); }
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
    rebuild(o); cv.requestRenderAll(); changed();
  }
  function setDirectControls() {
    cv.getObjects().forEach(o => { if (o.__direct && (tool !== "direct" || o !== cv.getActiveObject())) { delete o.controls; o.hasBorders = true; o.__direct = false; } });
    const o = cv.getActiveObject();
    if (tool === "direct" && o && o.type !== "activeSelection") {
      const v = o.kind === "vector" ? o : expand(o);
      if (v && v.kind === "vector") {
        if (v !== o) { cv.setActiveObject(v); changed(); }
        v.controls = vectorControls(v); v.hasBorders = false; v.__direct = true; anchorSel = -1;
      }
    }
    cv.requestRenderAll();
  }

  /* =====================================================================
     History and autosave
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
  const hist = { stack: [], i: -1, busy: 0 };
  const snapshot = () => JSON.stringify({
    app: "draft-studio-canvas", v: 2, name: doc.name, artboards: doc.artboards, active: doc.active, guides: doc.guides,
    brief: brief ? BRIEFS.indexOf(brief) : -1, canvas: cv.toJSON(PROPS)
  });
  let commitT = 0, saveT = 0;
  const changed = () => { if (hist.busy) return; clearTimeout(commitT); commitT = setTimeout(commit, 180); };
  function commit() {
    const s = snapshot();
    if (s === hist.stack[hist.i]) return;
    hist.stack = hist.stack.slice(0, hist.i + 1);
    hist.stack.push(s);
    if (hist.stack.length > 100) hist.stack.shift();
    hist.i = hist.stack.length - 1;
    persist(s);
    refreshUI();
  }
  const persist = s => {
    clearTimeout(saveT);
    savedEl.textContent = tr("Saving…");
    saveT = setTimeout(() => store.set("current", s).then(() => { savedEl.textContent = tr("Saved on this device"); })
      .catch(() => { savedEl.textContent = tr("Not saved: download a project file"); }), 450);
  };
  function restore(s, { keepHistory = true, refit = false } = {}) {
    let d;
    try { d = typeof s === "string" ? JSON.parse(s) : s; } catch (e) { return Promise.reject(e); }
    if (!d || !d.canvas) return Promise.reject(new Error("not a design"));
    hist.busy++;
    doc.name = d.name || tr("Untitled design");
    // version 1 files had one page and its colour on the canvas
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
        if (!keepHistory) { hist.stack = [snapshot()]; hist.i = 0; }
        refreshUI();
        res();
      });
    });
  }
  const step = d => {
    const i = hist.i + d;
    if (i < 0 || i >= hist.stack.length) return;
    hist.i = i;
    restore(hist.stack[i]).then(() => persist(hist.stack[i]));
  };
  cv.on({ "object:added": changed, "object:removed": changed, "object:modified": changed });

  /* =====================================================================
     Selection helpers and object actions
     ===================================================================== */
  const active = () => cv.getActiveObjects();
  const kindOf = o => (!o ? "none" : o.type === "activeSelection" ? "multi" : o.kind === "icon" ? "icon" : isText(o) ? "text" : o.type === "image" ? "image"
    : o.type === "group" ? "group" : o.kind === "vector" ? "path" : o.type === "path" ? "path" : "shape");
  const typeName = o => {
    if (!o) return "No Selection";
    if (o.type === "activeSelection") return "Mixed Objects";
    return { rect: "Rectangle", ellipse: "Ellipse", circle: "Ellipse", triangle: "Path", line: "Line", polygon: "Path", path: "Path", textbox: "Type", "i-text": "Type", image: "Image", group: o.kind === "icon" ? "Icon" : "Group" }[o.type] || "Object";
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
    const sel = tool === "select" || tool === "direct";
    o.selectable = sel;
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
      if (c.type === "activeSelection") { c.canvas = cv; c.forEachObject(o => { applyToolState(o); cv.add(o); }); c.setCoords(); }
      else { applyToolState(c); cv.add(c); }
      if (!inPlace) clip.set({ left: clip.left + off, top: clip.top + off });
      cv.setActiveObject(c);
      cv.requestRenderAll();
    }, PROPS);
  }
  const duplicate = () => { const o = cv.getActiveObject(); if (!o) return; o.clone(c => { clip = c; paste(); }, PROPS); };
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
    changed();
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
    changed();
  }
  const arrange = how => {
    const o = cv.getActiveObject();
    if (!o) return;
    ({ front: () => cv.bringToFront(o), back: () => cv.sendToBack(o), forward: () => cv.bringForward(o), backward: () => cv.sendBackwards(o) })[how]();
    cv.requestRenderAll(); changed();
  };
  const group = () => { const o = cv.getActiveObject(); if (o && o.type === "activeSelection") { const g = o.toGroup(); g.set({ name: "Group" }); applyToolState(g); cv.requestRenderAll(); changed(); } };
  const ungroup = () => { const o = cv.getActiveObject(); if (o && o.type === "group") { o.toActiveSelection(); cv.getActiveObjects().forEach(applyToolState); cv.requestRenderAll(); changed(); } };

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
    return t.kind === "icon" && k === "fill" ? p.stroke : p[k];
  };
  // Apply fill or stroke to the selection (or to new objects when nothing is selected)
  function setPaint(k, v, commitNow = true) {
    const list = active();
    if (!list.length) { paint[k] = v; if (k === "stroke" && v && !paint.strokeWidth) paint.strokeWidth = 1; syncPaint(); return; }
    list.forEach(o => {
      if (o.kind === "icon") { iconParts(o).forEach(p => p.set("stroke", v)); o.dirty = true; return; }
      if (o.type === "group") { o.getObjects().forEach(p => { if (k === "fill" ? p.fill : true) p.set(k, v); }); o.dirty = true; return; }
      if (k === "fill" && o.type === "line") { o.set("stroke", v); return; }
      o.set(k, v);
      if (k === "stroke" && v && !o.strokeWidth) o.set("strokeWidth", 1);
    });
    cv.requestRenderAll();
    syncPaint();
    if (commitNow) changed();
  }
  function syncPaint() {
    const fill = firstOf("fill"), stroke = firstOf("stroke");
    const fsw = $(".ai-fillsw", root), ssw = $(".ai-strokesw", root);
    fsw.style.setProperty("--c", paintCss(fill)); fsw.classList.toggle("is-none", !fill);
    ssw.style.setProperty("--c", paintCss(stroke)); ssw.classList.toggle("is-none", !stroke);
    $("[data-paintin=fill]", root).value = toHex(isGrad(fill) ? fill.colorStops[0].color : fill) || "#ffffff";
    $("[data-paintin=stroke]", root).value = toHex(isGrad(stroke) ? stroke.colorStops[0].color : stroke) || "#000000";
    $("[data-paint]", root).dataset.focus = paint.focus;
  }
  $("[data-paint]", root).addEventListener("pointerdown", e => {
    const sw = e.target.closest(".ai-fillsw, .ai-strokesw");
    if (sw) { paint.focus = sw.classList.contains("ai-fillsw") ? "fill" : "stroke"; syncPaint(); }
  });
  $("[data-paint]", root).addEventListener("input", e => { if (e.target.dataset.paintin) setPaint(e.target.dataset.paintin, e.target.value, false); });
  $("[data-paint]", root).addEventListener("change", e => { if (e.target.dataset.paintin) { changed(); refreshUI(); } });
  const swapPaint = () => {
    const f = firstOf("fill"), s = firstOf("stroke");
    if (!active().length) { paint.fill = s; paint.stroke = f; syncPaint(); return; }
    active().forEach(o => { if (o.type !== "group" && o.kind !== "icon") o.set({ fill: s, stroke: f, strokeWidth: f && !o.strokeWidth ? 1 : o.strokeWidth }); });
    cv.requestRenderAll(); syncPaint(); changed(); refreshUI();
  };
  const defaultPaint = () => { paint.fill = "#ffffff"; paint.stroke = "#000000"; paint.strokeWidth = 1; if (active().length) { setPaint("fill", "#ffffff"); setPaint("stroke", "#000000"); } syncPaint(); refreshUI(); };
  // Gradients: linear at an angle across the object's box, or radial from its centre
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
    cv.requestRenderAll(); changed(); refreshUI();
  }
  const gradStops = c => (isGrad(c) ? c.colorStops.map(s => toHex(s.color) || "#000000") : [toHex(c) || "#1f7aff", "#000000"]);

  /* =====================================================================
     Tools
     ===================================================================== */
  let drag = null, pen = null, spaceHeld = false, toolBeforeSpace = null;
  const groupTool = {};
  function setTool(id, temp = false) {
    if (pen && id !== "pen") finishPen(false);
    if (cv.getActiveObject() && cv.getActiveObject().isEditing) cv.getActiveObject().exitEditing();
    tool = id;
    if (!temp) TOOL_GROUPS.forEach(g => { if (g.some(t => t[0] === id)) groupTool[g[0][0]] = id; });
    $$(".ai-tool", root).forEach(b => {
      const g = JSON.parse(b.dataset.group), cur = g.includes(id) ? id : (groupTool[g[0]] || g[0]);
      if (b.dataset.tool !== cur) { b.dataset.tool = cur; b.innerHTML = ui(cur); const info = TOOL_INFO[cur]; b.setAttribute("aria-label", info.name); b.dataset.tip = info.name + (info.key ? ` (${keyLabel(info.key)})` : ""); }
      b.classList.toggle("is-on", g.includes(id));
    });
    const drawing = id === "pencil" || id === "brush";
    cv.isDrawingMode = drawing;
    if (drawing) {
      const b = new F.PencilBrush(cv);
      b.color = toHex(paint.stroke) || (toHex(paint.fill) !== "#ffffff" && toHex(paint.fill)) || "#000000";
      b.width = id === "brush" ? Math.max(6, paint.strokeWidth * 6) : Math.max(1, paint.strokeWidth);
      b.strokeLineCap = "round"; b.strokeLineJoin = "round"; b.decimate = id === "brush" ? 2.5 : 1.5;
      cv.freeDrawingBrush = b;
    }
    cv.selection = id === "select" || id === "direct";
    cv.skipTargetFind = !(id === "select" || id === "direct" || id === "type" || id === "eyedropper" || id === "gradient");
    cv.getObjects().forEach(applyToolState);
    const cursors = { select: "default", direct: "default", pen: "crosshair", type: "text", line: "crosshair", rect: "crosshair", rounded: "crosshair", ellipse: "crosshair",
      polygon: "crosshair", star: "crosshair", rotate: "crosshair", scale: "crosshair", eyedropper: "copy", gradient: "crosshair", artboard: "default", hand: "grab", zoom: "zoom-in" };
    cv.defaultCursor = cursors[id] || "crosshair";
    cv.hoverCursor = id === "select" || id === "direct" ? "move" : cv.defaultCursor;
    if (id === "artboard") { abSelected = doc.active; cv.discardActiveObject(); }
    setDirectControls();
    hintEl.textContent = tr(TOOL_INFO[id].name) + " · " + tr(TOOL_HINT[id]);
    cv.requestRenderAll();
    if (!temp) refreshUI();
  }
  $("[data-tools]", root).addEventListener("click", e => {
    const b = e.target.closest(".ai-tool");
    if (b && !b.__long) setTool(b.dataset.tool);
    if (b) b.__long = false;
    const a = e.target.closest("[data-act]");
    if (a) act(a.dataset.act);
  });
  // Flyouts for grouped tools
  let pressT = 0;
  const openFlyout = b => {
    const g = JSON.parse(b.dataset.group);
    if (g.length < 2) return;
    const r = b.getBoundingClientRect(), R = root.getBoundingClientRect();
    flyout.innerHTML = g.map(id => `<button type="button" data-fly="${id}" class="${id === tool ? "is-on" : ""}">${ui(id)}<span>${tr(TOOL_INFO[id].name)}</span><kbd>${keyLabel(TOOL_INFO[id].key)}</kbd></button>`).join("");
    flyout.style.left = (r.right - R.left + 4) + "px"; flyout.style.top = (r.top - R.top) + "px";
    flyout.hidden = false;
  };
  $("[data-tools]", root).addEventListener("pointerdown", e => {
    const b = e.target.closest(".ai-tool.has-more");
    if (!b) return;
    clearTimeout(pressT);
    pressT = setTimeout(() => { b.__long = true; openFlyout(b); }, 380);
  });
  $("[data-tools]", root).addEventListener("pointerup", () => clearTimeout(pressT));
  $("[data-tools]", root).addEventListener("contextmenu", e => { const b = e.target.closest(".ai-tool.has-more"); if (b) { e.preventDefault(); openFlyout(b); } });
  flyout.addEventListener("click", e => { const b = e.target.closest("[data-fly]"); if (b) { setTool(b.dataset.fly); flyout.hidden = true; } });

  /* ---------- Measurement tip (like the grey label next to the cursor) ---------- */
  function showMeasure(e, text) {
    const R = viewport.getBoundingClientRect();
    measureEl.textContent = text; measureEl.hidden = false;
    measureEl.style.left = (e.clientX - R.left + 14) + "px"; measureEl.style.top = (e.clientY - R.top + 16) + "px";
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
    }
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
    if (o.__start) showMeasure(e.e, `dX: ${round(o.left - o.__start.left)} px\ndY: ${round(o.top - o.__start.top)} px`);
  });
  cv.on("object:scaling", e => { const o = e.target; showMeasure(e.e, `W: ${round(o.getScaledWidth())} px\nH: ${round(o.getScaledHeight())} px`); });
  cv.on("object:rotating", e => { showMeasure(e.e, `${round(e.target.angle, 1)}°`); });
  cv.on("before:transform", e => { const o = e.transform.target; o.__start = { left: o.left, top: o.top }; });
  // transient overlays (smart guides, pen preview) live on the top layer
  cv.on("before:render", () => { if (cv.contextTop) cv.clearContext(cv.contextTop); });
  cv.on("after:render", () => drawTop());
  function drawTop() {
    const c = cv.contextTop;
    if (!c || exporting()) return;
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
      c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z;
      c.beginPath();
      const d = new Path2D(pathFrom(pen.pts, false).replace(/ /g, " "));
      c.stroke(d);
      const last = pen.pts[pen.pts.length - 1];
      if (pen.hover && !pen.down) {
        c.setLineDash([4 / z, 3 / z]);
        c.beginPath(); c.moveTo(last.x, last.y);
        c.bezierCurveTo(last.x + last.ox, last.y + last.oy, pen.hover.x, pen.hover.y, pen.hover.x, pen.hover.y); c.stroke();
        c.setLineDash([]);
      }
      pen.pts.forEach((p, i) => {
        if (p === last) [[p.ix, p.iy], [p.ox, p.oy]].forEach(([hx, hy]) => { if (hx || hy) { c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + hx, p.y + hy); c.stroke(); c.beginPath(); c.arc(p.x + hx, p.y + hy, 3 / z, 0, Math.PI * 2); c.fillStyle = "#1f7aff"; c.fill(); } });
        const s = (i === 0 && pen.closeHover ? 9 : 7) / z;
        c.fillStyle = i === pen.pts.length - 1 ? "#1f7aff" : "#ffffff"; c.fillRect(p.x - s / 2, p.y - s / 2, s, s); c.strokeRect(p.x - s / 2, p.y - s / 2, s, s);
      });
    }
    if (drag && drag.abNew) {
      c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / z; c.setLineDash([5 / z, 4 / z]);
      c.strokeRect(drag.abNew.x, drag.abNew.y, drag.abNew.w, drag.abNew.h); c.setLineDash([]);
    }
    c.restore();
  }
  const topRender = () => { if (cv.contextTop) cv.clearContext(cv.contextTop); drawTop(); };

  /* ---------- Shapes drawn by dragging ---------- */
  const SHAPE_TOOLS = ["rect", "rounded", "ellipse", "polygon", "star", "line"];
  const STAR = (n, inner = .42) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? inner : 1, a = Math.PI / n * i - Math.PI / 2; return { x: .5 + .5 * r * Math.cos(a), y: .5 + .5 * r * Math.sin(a) }; });
  const POLY = n => Array.from({ length: n }, (_, i) => { const a = Math.PI * 2 / n * i - Math.PI / 2; return { x: .5 + .5 * Math.cos(a), y: .5 + .5 * Math.sin(a) }; });
  const shapePaint = () => ({ fill: paint.fill, stroke: paint.stroke, strokeWidth: paint.stroke ? paint.strokeWidth : 0, strokeUniform: !prefs.scaleStrokes });
  function shapeBox(p0, p, e) {
    let w = p.x - p0.x, h = p.y - p0.y;
    if (e.shiftKey) { const m = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * m; h = Math.sign(h || 1) * m; }
    let x = Math.min(p0.x, p0.x + w), y = Math.min(p0.y, p0.y + h);
    if (e.altKey) { x = p0.x - Math.abs(w); y = p0.y - Math.abs(h); return { x, y, w: Math.abs(w) * 2, h: Math.abs(h) * 2 }; }
    return { x, y, w: Math.abs(w), h: Math.abs(h) };
  }
  function makeShape(kind, b, p0, p1, e) {
    const st = shapePaint();
    switch (kind) {
      case "rect": return new F.Rect(Object.assign({ left: b.x, top: b.y, width: b.w, height: b.h, name: "Rectangle", kind: "shape" }, st));
      case "rounded": return new F.Rect(Object.assign({ left: b.x, top: b.y, width: b.w, height: b.h, rx: Math.min(24, b.w / 4, b.h / 4), ry: Math.min(24, b.w / 4, b.h / 4), name: "Rounded Rectangle", kind: "shape" }, st));
      case "ellipse": return new F.Ellipse(Object.assign({ left: b.x, top: b.y, rx: b.w / 2, ry: b.h / 2, name: "Ellipse", kind: "shape" }, st));
      case "polygon": case "star": {
        const unitPts = kind === "star" ? STAR(5) : POLY(6);
        return vector(unitPts.map(q => A(b.x + q.x * b.w, b.y + q.y * b.h)), true, Object.assign({ name: kind === "star" ? "Star" : "Polygon" }, st));
      }
      case "line": {
        let x2 = p1.x, y2 = p1.y;
        if (e && e.shiftKey) { const ang = Math.round(Math.atan2(y2 - p0.y, x2 - p0.x) / (Math.PI / 4)) * Math.PI / 4, len = Math.hypot(x2 - p0.x, y2 - p0.y); x2 = p0.x + Math.cos(ang) * len; y2 = p0.y + Math.sin(ang) * len; }
        return new F.Line([p0.x, p0.y, x2, y2], { stroke: toHex(paint.stroke) || "#000000", strokeWidth: Math.max(1, paint.strokeWidth), strokeLineCap: "round", strokeUniform: !prefs.scaleStrokes, name: "Line", kind: "shape" });
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
      // anchors are in scene coordinates, which become the path's own coordinates
      const o = vector(pts.map(p => Object.assign({}, p)), closed, {
        fill: closed ? paint.fill : null, stroke: paint.stroke || "#000000", strokeWidth: Math.max(1, paint.strokeWidth), strokeUniform: !prefs.scaleStrokes, name: "Path"
      });
      addObject(o);
    }
    topRender();
    hintEl.textContent = tr(TOOL_INFO[tool].name) + " · " + tr(TOOL_HINT[tool]);
  }

  /* ---------- Mouse ---------- */
  let panning = null;
  cv.on("mouse:down", opt => {
    const e = opt.e;
    if (e.button === 2) { openContext(e, opt.target); return; }
    const sp = cv.getPointer(e, true), p = cv.getPointer(e);
    if (tool === "hand" || spaceHeld || e.button === 1) { panning = { x: e.clientX, y: e.clientY }; cv.setCursor("grabbing"); return; }
    // drag a ruler guide with the selection tools
    if ((tool === "select" || tool === "direct") && !opt.target && view.guides && !view.lockGuides) {
      const tol = 4 / zoom();
      const vi = doc.guides.v.findIndex(x => Math.abs(x - p.x) < tol), hi = doc.guides.h.findIndex(y => Math.abs(y - p.y) < tol);
      if (vi > -1 || hi > -1) { cv.selection = false; guideDrag = vi > -1 ? { axis: "v", index: vi } : { axis: "h", index: hi }; return; }
    }
    // Alt-drag copies
    if (tool === "select" && e.altKey && opt.target && !opt.target.locked) {
      const t = opt.target;
      t.clone(c => { applyToolState(c); hist.busy++; cv.insertAt(c, cv.getObjects().indexOf(t)); hist.busy--; }, PROPS);
    }
    if (tool === "zoom") { zoomAt(sp, zoom() * (e.altKey ? 1 / 1.6 : 1.6)); return; }
    if (tool === "pen") {
      if (!pen) pen = { pts: [] };
      const first = pen.pts[0];
      if (first && pen.pts.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) * zoom() < 8) { finishPen(true); return; }
      const q = snapPoint({ x: p.x, y: p.y });
      pen.pts.push(A(q.x, q.y)); pen.down = true;
      topRender();
      return;
    }
    if (SHAPE_TOOLS.includes(tool)) { const q = snapPoint({ x: p.x, y: p.y }); drag = { kind: tool, p0: q, obj: null }; return; }
    if (tool === "type") {
      if (opt.target && isText(opt.target)) { const t = opt.target; t.selectable = true; cv.setActiveObject(t); t.enterEditing(); t.setCursorByClick(e); setTool("select"); return; }
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
    if (panning) { cv.relativePan(new F.Point(e.clientX - panning.x, e.clientY - panning.y)); panning = { x: e.clientX, y: e.clientY }; afterView(); return; }
    if (guideDrag) return;
    if (tool === "pen" && pen) {
      const last = pen.pts[pen.pts.length - 1];
      if (pen.down && last) {
        last.ox = p.x - last.x; last.oy = p.y - last.y;
        if (Math.hypot(last.ox, last.oy) * zoom() < 3) { last.ox = last.oy = 0; }
        last.ix = -last.ox; last.iy = -last.oy;
        showMeasure(e, `${round(Math.hypot(last.ox, last.oy))} px`);
      } else {
        const first = pen.pts[0];
        pen.closeHover = first && pen.pts.length > 2 && Math.hypot(p.x - first.x, p.y - first.y) * zoom() < 8;
        pen.hover = pen.closeHover ? { x: first.x, y: first.y } : snapPoint({ x: p.x, y: p.y });
      }
      topRender();
      return;
    }
    if (!drag) return;
    if (SHAPE_TOOLS.includes(drag.kind)) {
      const q = drag.kind === "line" ? snapPoint({ x: p.x, y: p.y }) : snapPoint({ x: p.x, y: p.y });
      const b = shapeBox(drag.p0, q, e);
      if (!drag.obj && b.w + b.h < 3 / zoom()) return;
      if (drag.obj) { hist.busy++; cv.remove(drag.obj); hist.busy--; }
      drag.obj = makeShape(drag.kind, b, drag.p0, q, e);
      applyToolState(drag.obj);
      hist.busy++; cv.add(drag.obj); hist.busy--;
      cv.requestRenderAll();
      showMeasure(e, drag.kind === "line" ? `${round(Math.hypot(q.x - drag.p0.x, q.y - drag.p0.y))} px` : `W: ${round(b.w)} px\nH: ${round(b.h)} px`);
    } else if (drag.kind === "type") {
      drag.box = shapeBox(drag.p0, p, e);
      if (cv.contextTop) { topRender(); const c = cv.contextTop, v = cv.viewportTransform; c.save(); c.transform(...v); c.strokeStyle = "#1f7aff"; c.lineWidth = 1 / v[0]; c.strokeRect(drag.box.x, drag.box.y, drag.box.w, drag.box.h); c.restore(); }
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
      const ang = Math.atan2(p.y - drag.p0.y, p.x - drag.p0.x) * 180 / Math.PI - (drag.o.angle || 0);
      if (Math.hypot(p.x - drag.p0.x, p.y - drag.p0.y) * zoom() < 4) return;
      drag.o.set("fill", gradientFor(drag.o, drag.stops, drag.type, round(ang))); drag.o.dirty = true;
      cv.requestRenderAll(); showMeasure(e, `${round(ang)}°`);
    } else if (drag.kind === "abmove") {
      const a = doc.artboards[drag.i], dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
      a.x = round(drag.start.x + dx); a.y = round(drag.start.y + dy);
      drag.objs.forEach(it => { it.o.set({ left: it.left + (a.x - drag.start.x), top: it.top + (a.y - drag.start.y) }); it.o.setCoords(); });
      cv.requestRenderAll(); showMeasure(e, `X: ${a.x}  Y: ${a.y}`);
    } else if (drag.kind === "abnew") {
      const b = shapeBox(drag.p0, p, e);
      drag.abNew = { x: round(b.x), y: round(b.y), w: round(b.w), h: round(b.h) };
      topRender(); showMeasure(e, `W: ${drag.abNew.w} px\nH: ${drag.abNew.h} px`);
    }
  });
  cv.on("mouse:up", opt => {
    const e = opt.e;
    hideMeasure();
    if (panning) { panning = null; cv.setCursor(cv.defaultCursor); return; }
    if (guideDrag) { const sp = stagePt(e); if (!sp.inside) doc.guides[guideDrag.axis].splice(guideDrag.index, 1); guideDrag = null; cv.selection = tool === "select" || tool === "direct"; changed(); cv.requestRenderAll(); return; }
    if (tool === "pen" && pen) { pen.down = false; topRender(); return; }
    if (smart.length) { smart = []; cv.requestRenderAll(); }
    if (!drag) return;
    const d = drag;
    drag = null;
    if (SHAPE_TOOLS.includes(d.kind)) {
      let o = d.obj;
      if (!o) {   // a click makes a 100 px shape
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
      const fill = (toHex(paint.fill) && toHex(paint.fill) !== "#ffffff") ? paint.fill : "#000000";
      const str = tr("Type here");
      const opts = { left: d.p0.x, top: d.p0.y, fontFamily: charState.family, fontWeight: charState.weight, fontSize: charState.size * unit(), fill, name: "Type", kind: "text" };
      const t = b ? new F.Textbox(str, Object.assign(opts, { left: b.x, top: b.y, width: b.w })) : new F.IText(str, opts);
      rtlFix(t);
      loadFont(charState.family, charState.weight).then(() => {
        setTool("select");
        addObject(t);
        t.enterEditing(); t.selectAll();
        refreshUI();
      });
    } else if (d.kind === "rotate" || d.kind === "scale" || d.kind === "gradient") {
      cv.fire("object:modified", { target: d.o }); refreshUI();
    } else if (d.kind === "abmove") {
      changed(); refreshUI();
    } else if (d.kind === "abnew" && d.abNew && d.abNew.w > 10 && d.abNew.h > 10) {
      doc.artboards.push(Object.assign(newArtboard(d.abNew.w, d.abNew.h, d.abNew.x, d.abNew.y), {}));
      doc.active = abSelected = doc.artboards.length - 1;
      changed(); refreshUI(); topRender(); cv.requestRenderAll();
    } else topRender();
  });
  cv.on("mouse:dblclick", opt => {
    if (tool === "pen" && pen) { finishPen(false); return; }
    const t = opt.target;
    if (tool === "select" && t && t.type === "group" && t.kind !== "icon") toast(tr("Ungroup (Shift+Ctrl+G) to edit what's inside."));
    if (tool === "select" && t && t.kind === "vector") setTool("direct");
  });
  stage.addEventListener("pointerleave", () => { mouseScreen = null; drawRulers(); });
  cv.on("path:created", ({ path }) => {
    path.set({ name: tool === "brush" ? "Brush Stroke" : "Pencil Line", kind: "drawing", fill: null, strokeUniform: !prefs.scaleStrokes });
    applyToolState(path);
    changed();
  });

  function eyedrop(t) {
    if (!t) return;
    const src = t.kind === "icon" ? iconParts(t)[0] : t;
    const style = { fill: t.kind === "icon" ? src.stroke : src.fill, stroke: t.kind === "icon" ? null : src.stroke, strokeWidth: src.strokeWidth };
    const list = active().filter(o => o !== t);
    if (!list.length) { paint.fill = style.fill; paint.stroke = style.stroke; paint.strokeWidth = style.strokeWidth || 1; syncPaint(); toast(tr("Colours picked up")); return; }
    list.forEach(o => {
      if (o.kind === "icon") iconParts(o).forEach(p => p.set("stroke", style.fill));
      else { o.set({ fill: isGrad(style.fill) ? gradientFor(o, gradStops(style.fill), style.fill.type, style.fill.angle || 0) : style.fill, stroke: style.stroke, strokeWidth: style.strokeWidth }); }
      if (isText(o) && isText(t)) o.set({ fontFamily: t.fontFamily, fontWeight: t.fontWeight, fontSize: t.fontSize, charSpacing: t.charSpacing, lineHeight: t.lineHeight, fontStyle: t.fontStyle });
      if (o.initDimensions) o.initDimensions();
      o.dirty = true;
    });
    cv.requestRenderAll(); changed(); refreshUI();
  }

  /* ---------- Selection events keep the panels in step ---------- */
  cv.on({
    "selection:created": () => { if (tool === "direct") setDirectControls(); refreshUI(); openDockOnPhone(); },
    "selection:updated": () => { if (tool === "direct") setDirectControls(); refreshUI(); },
    "selection:cleared": () => { anchorSel = -1; setDirectControls(); refreshUI(); root.classList.remove("show-dock"); }
  });
  // Text and rectangles keep true sizes instead of a stretch factor
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
    const put = (k, v) => $$(`[data-k="${k}"]`, root).forEach(el => { if (document.activeElement !== el) el.value = round(v, 2); });
    put("x", b.left - a.x); put("y", b.top - a.y); put("w", o.getScaledWidth()); put("h", o.getScaledHeight()); put("angle", o.angle);
  };
  cv.on({ "object:moving": liveTransform, "object:scaling": liveTransform, "object:rotating": liveTransform });

  /* =====================================================================
     Property editing (control bar and Properties panel share these)
     ===================================================================== */
  function apply(k, v, done = true) {
    const list = active(), o = cv.getActiveObject(), a = ab();
    if (k.startsWith("ab-")) {
      const t = doc.artboards[abSelected > -1 ? abSelected : doc.active];
      if (!t) return;
      if (k === "ab-name") t.name = v; else if (k === "ab-bg") t.bg = v; else t[k.slice(3)] = Math.max(k === "ab-x" || k === "ab-y" ? -1e6 : 1, round(+v));
      cv.requestRenderAll(); if (done) changed(); return;
    }
    if (k === "pref-nudge") { prefs.nudge = Math.max(.1, +v); saveView(); return; }
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
        case "dash": t.set("strokeDashArray", v === "dashed" ? [Math.max(4, t.strokeWidth * 3), Math.max(3, t.strokeWidth * 2)] : v === "dotted" ? [0.01, Math.max(3, t.strokeWidth * 2)] : null); t.set("strokeLineCap", v === "dotted" ? "round" : t.strokeLineCap); break;
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
        case "shadow": t.set("shadow", v ? new F.Shadow({ color: "rgba(0,0,0,0.35)", blur: 24, offsetX: 6, offsetY: 10 }) : null); break;
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
          if (k === "grad-0") stops[0] = v; if (k === "grad-1") stops[stops.length - 1] = v;
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
    if (done) changed();
  }
  async function setFont(family) {
    charState.family = family;
    const list = flat(active()).filter(isText);
    const weights = FONTS[family] || [400];
    await Promise.all(list.map(o => {
      const w = weights.includes(+o.fontWeight) ? +o.fontWeight : weights.reduce((p, q) => (Math.abs(q - o.fontWeight) < Math.abs(p - o.fontWeight) ? q : p));
      o.set("fontWeight", w);
      return loadFont(family, w);
    }));
    list.forEach(o => { o.set("fontFamily", family); o.initDimensions(); o.setCoords(); });
    cv.requestRenderAll(); changed(); refreshUI();
  }
  function changeCase(how) {
    flat(active()).filter(isText).forEach(o => {
      const s = o.text;
      o.set("text", how === "upper" ? s.toUpperCase() : how === "lower" ? s.toLowerCase()
        : how === "title" ? s.toLowerCase().replace(/(^|\s)(\S)/g, (m, p, c) => p + c.toUpperCase())
          : s.toLowerCase().replace(/(^|[.!?]\s+|\n)(\S)/g, (m, p, c) => p + c.toUpperCase()));
      o.initDimensions();
    });
    cv.requestRenderAll(); changed();
  }
  function imageFx(kind) {
    active().filter(o => o.type === "image").forEach(o => {
      const T = { gray: "Grayscale", sepia: "Sepia", invert: "Invert", blur: "Blur" }[kind];
      if (kind === "clear") o.filters = [];
      else { o.filters = (o.filters || []).filter(f => f && f.type !== T); o.filters.push(kind === "blur" ? new F.Image.filters.Blur({ blur: .12 }) : new F.Image.filters[T]()); }
      o.applyFilters();
    });
    cv.requestRenderAll(); changed();
  }

  /* =====================================================================
     UI builders
     ===================================================================== */
  const num = (k, v, o = {}) => `<label class="ai-num${o.wide ? " is-wide" : ""}"${o.tip ? ` data-tip="${o.tip}"` : ""}>${o.label ? `<span>${o.label}</span>` : ""}<input type="number" inputmode="decimal" data-k="${k}" value="${v === "" ? "" : round(+v, o.d ?? 2)}" step="${o.step || 1}"${o.min != null ? ` min="${o.min}"` : ""}${o.max != null ? ` max="${o.max}"` : ""}>${o.unit ? `<em>${o.unit}</em>` : ""}</label>`;
  const swatchIn = (k, c) => `<label class="ai-sw${!c ? " is-none" : ""}" style="--c:${paintCss(c)}"><input type="color" data-k="${k}" value="${toHex(isGrad(c) ? c.colorStops[0].color : c) || "#000000"}" aria-label="Colour"></label>`;
  const sel = (k, val, opts, label = "") => `<select class="ai-select" data-k="${k}" aria-label="${label}">${opts.map(([v, t]) => `<option value="${v}"${String(v) === String(val) ? " selected" : ""}>${t}</option>`).join("")}</select>`;
  const segBtns = (k, v, opts) => `<div class="ai-seg">${opts.map(([val, ic, label]) => `<button type="button" data-set="${k}" data-v="${val}" class="${String(v) === String(val) ? "is-on" : ""}" aria-label="${label}" data-tip="${label}">${ui(ic)}</button>`).join("")}</div>`;
  const ALIGN6 = [["left", "al-left", "Horizontal Align Left"], ["center", "al-center", "Horizontal Align Centre"], ["right", "al-right", "Horizontal Align Right"],
    ["top", "al-top", "Vertical Align Top"], ["middle", "al-middle", "Vertical Align Centre"], ["bottom", "al-bottom", "Vertical Align Bottom"]];
  const fontBtn = o => `<button type="button" class="ai-fontbtn" data-act="font-menu" style="font-family:'${esc(o.fontFamily)}'">${esc(o.fontFamily)}${ui("chev")}</button>`;
  const paintRow = (label, k, c) => `
    <div class="ai-paintrow" data-paintrow="${k}">
      ${swatchIn(k, c)}
      <span class="ai-paintname">${label}</span>
      <button type="button" class="ai-mini" data-act="swatch-pop:${k}" aria-label="Swatches">${ui("swatches")}</button>
      <button type="button" class="ai-mini${!c ? " is-on" : ""}" data-act="paint-none:${k}" aria-label="None" data-tip="None">${ui("none")}</button>
      <button type="button" class="ai-mini${isGrad(c) ? " is-on" : ""}" data-act="paint-gradient:${k}" aria-label="Gradient" data-tip="Gradient"><i class="pm-grad"></i></button>
    </div>`;

  /* ---------- Control bar ---------- */
  function renderControl() {
    const o = cv.getActiveObject(), k = kindOf(o), a = ab();
    let h = `<span class="ai-ctl-label">${typeName(o)}</span>`;
    if (tool === "artboard") {
      const t = doc.artboards[abSelected > -1 ? abSelected : doc.active];
      h = `<span class="ai-ctl-label">Artboard</span>
        <span class="ai-ctl-grp">${sel("ab-preset", SIZES.findIndex(([, w, hh]) => w === t.w && hh === t.h), [[-1, "Custom"], ...SIZES.map(([n, w, hh], i) => [i, `${n} · ${w} × ${hh}`])], "Preset")}</span>
        <span class="ai-ctl-grp">${num("ab-w", t.w, { label: "W", min: 1 })}${num("ab-h", t.h, { label: "H", min: 1 })}</span>
        <span class="ai-ctl-grp">${num("ab-x", t.x, { label: "X" })}${num("ab-y", t.y, { label: "Y" })}</span>
        <span class="ai-ctl-grp"><label class="ai-ctl-txt">Name</label><input class="ai-text" data-k="ab-name" value="${esc(t.name)}"></span>
        <button type="button" class="ai-btn" data-act="ab-new">New Artboard</button>
        <button type="button" class="ai-btn" data-act="ab-delete">Delete</button>`;
      control.innerHTML = h;
      return;
    }
    const fill = firstOf("fill"), stroke = firstOf("stroke"), sw = o ? (o.kind === "icon" ? iconParts(o)[0].strokeWidth : (o.type === "activeSelection" ? o.getObjects()[0].strokeWidth : o.strokeWidth)) : paint.strokeWidth;
    h += `<span class="ai-ctl-grp">${swatchIn("ctl-fill", fill)}<button type="button" class="ai-drop-btn" data-act="swatch-pop:fill" aria-label="Fill swatches">${ui("chev")}</button>
      ${swatchIn("ctl-stroke", stroke)}<button type="button" class="ai-drop-btn" data-act="swatch-pop:stroke" aria-label="Stroke swatches">${ui("chev")}</button></span>
      <span class="ai-ctl-grp"><label class="ai-ctl-txt">Stroke:</label>${num("strokeWidth", sw || 0, { min: 0, step: .5, unit: "px", d: 2 })}</span>`;
    if (o) h += `<span class="ai-ctl-grp"><label class="ai-ctl-txt">Opacity:</label>${num("opacity", round((o.opacity ?? 1) * 100), { min: 0, max: 100, unit: "%" })}</span>`;
    if (k === "text") {
      h += `<span class="ai-ctl-grp"><label class="ai-ctl-txt">Character:</label>${fontBtn(o)}
        ${sel("fontWeight", o.fontWeight, (FONTS[o.fontFamily] || [400, 700]).map(w => [w, WEIGHT_NAMES[w]]), "Font style")}
        ${num("fontSize", o.fontSize, { unit: "px", min: 1, d: 1 })}</span>
        <span class="ai-ctl-grp">${segBtns("textAlign", o.textAlign, [["left", "t-left", "Align Left"], ["center", "t-center", "Align Centre"], ["right", "t-right", "Align Right"]])}</span>`;
    }
    if (o) {
      const b = o.getBoundingRect(true, true);
      h += `<span class="ai-ctl-grp ai-ctl-align">${ALIGN6.map(([v, ic, l]) => `<button type="button" class="ai-ib" data-set="align" data-v="${v}" aria-label="${l}" data-tip="${l}">${ui(ic)}</button>`).join("")}</span>
        <span class="ai-ctl-grp">${num("x", b.left - a.x, { label: "X:", unit: "px" })}${num("y", b.top - a.y, { label: "Y:", unit: "px" })}${k !== "multi" ? num("w", o.getScaledWidth(), { label: "W:", unit: "px", min: 1 }) + num("h", o.getScaledHeight(), { label: "H:", unit: "px", min: 1 }) : ""}</span>`;
    } else {
      h += `<button type="button" class="ai-btn" data-act="doc-setup">Document Setup</button><button type="button" class="ai-btn" data-act="prefs">Preferences</button>`;
    }
    control.innerHTML = h;
  }

  /* ---------- Right dock: tabs and panels ---------- */
  let panel = "properties";
  const PANEL_TITLES = { properties: "Properties", layers: "Layers", libraries: "Libraries", swatches: "Swatches", artboards: "Artboards", brief: "Brief", templates: "Templates", text: "Font Pairs", icons: "Icons", images: "Images" };
  const collapsed = new Set();
  const sec = (id, title, body) => `<section class="ai-sec${collapsed.has(id) ? " is-closed" : ""}" data-sec="${id}"><button type="button" class="ai-sec-head" data-act="sec:${id}">${ui("chev")}<span>${title}</span></button><div class="ai-sec-body">${body}</div></section>`;
  function renderDock() {
    const main = ["properties", "layers", "libraries"];
    const tabs = main.includes(panel) ? main : [...main, panel];
    dockTabs.innerHTML = tabs.map(t => `<button type="button" data-panel="${t}" class="${t === panel ? "is-on" : ""}">${PANEL_TITLES[t]}</button>`).join("");
    $$(".ai-strip [data-panel]", root).forEach(b => b.classList.toggle("is-on", b.dataset.panel === panel));
    const r = { properties: propsPanel, layers: layersPanel, libraries: librariesPanel, swatches: swatchesPanel, artboards: artboardsPanel, brief: briefPanel, templates: templatesPanel, text: textPanel, icons: iconsPanel, images: imagesPanel }[panel];
    dockBody.innerHTML = r();
    if (panel === "templates" || panel === "libraries") thumbs();
    if (panel === "text") PAIRS.forEach(([x, xw, y, yw]) => { loadFont(x, xw); loadFont(y, yw); });
  }
  function propsPanel() {
    const o = cv.getActiveObject(), k = kindOf(o), a = ab();
    if (tool === "artboard") {
      const i = abSelected > -1 ? abSelected : doc.active, t = doc.artboards[i];
      return sec("ab", "Artboard", `
        <input class="ai-text is-full" data-k="ab-name" value="${esc(t.name)}" aria-label="Artboard name">
        ${sel("ab-preset", SIZES.findIndex(([, w, h]) => w === t.w && h === t.h), [[-1, "Custom"], ...SIZES.map(([n, w, h], j) => [j, `${n} · ${w} × ${h}`])], "Preset")}
        <div class="ai-g2">${num("ab-w", t.w, { label: "W", min: 1 })}${num("ab-h", t.h, { label: "H", min: 1 })}</div>
        <div class="ai-g2">${num("ab-x", t.x, { label: "X" })}${num("ab-y", t.y, { label: "Y" })}</div>
        <div class="ai-row"><span class="ai-lbl">Background</span>${swatchIn("ab-bg", t.bg)}</div>
        <div class="ai-g2"><button type="button" class="ai-btn" data-act="ab-fit">Fit to Artwork</button><button type="button" class="ai-btn" data-act="ab-dup">Duplicate</button></div>
        <div class="ai-g2"><button type="button" class="ai-btn" data-act="ab-new">New Artboard</button><button type="button" class="ai-btn is-danger" data-act="ab-delete">Delete</button></div>
        <button type="button" class="ai-btn is-blue" data-act="tool:select">Exit Artboard Edit Mode</button>`);
    }
    if (!o) {
      return `<p class="ai-note">No Selection</p>` +
        sec("doc", "Document", `
          <div class="ai-row"><span class="ai-lbl">Units:</span><span class="ai-val">Pixels</span></div>
          <div class="ai-row"><span class="ai-lbl">Artboard:</span>${sel("active-ab", doc.active, doc.artboards.map((x, i) => [i, `${i + 1} · ${x.name}`]), "Artboard")}</div>
          <button type="button" class="ai-btn is-full" data-act="tool:artboard">Edit Artboards</button>
          <div class="ai-row"><span class="ai-lbl">Background</span>${swatchIn("ab-bg", a.bg)}</div>`) +
        sec("rulers", "Ruler & Grids", `<div class="ai-icons">
          <button type="button" class="ai-ib${view.rulers ? " is-on" : ""}" data-act="toggle:rulers" aria-label="Rulers" data-tip="Rulers">${ui("rulers")}</button>
          <button type="button" class="ai-ib${view.grid ? " is-on" : ""}" data-act="toggle:grid" aria-label="Grid" data-tip="Grid">${ui("grid")}</button>
          <button type="button" class="ai-ib${view.snapGrid ? " is-on" : ""}" data-act="toggle:snapGrid" aria-label="Snap to Grid" data-tip="Snap to Grid">${ui("snapgrid")}</button></div>
          ${num("pref-grid", prefs.gridSize, { label: "Grid", unit: "px", min: 2 })}`) +
        sec("guides", "Guides", `<div class="ai-icons">
          <button type="button" class="ai-ib${view.guides ? " is-on" : ""}" data-act="toggle:guides" aria-label="Show Guides" data-tip="Show Guides">${ui("guides")}</button>
          <button type="button" class="ai-ib${view.lockGuides ? " is-on" : ""}" data-act="toggle:lockGuides" aria-label="Lock Guides" data-tip="Lock Guides">${ui("lock")}</button>
          <button type="button" class="ai-ib" data-act="clear-guides" aria-label="Clear Guides" data-tip="Clear Guides">${ui("trash")}</button></div>
          <p class="ai-note">Drag from a ruler to make a guide.</p>`) +
        sec("snap", "Snap Options", `<div class="ai-icons">
          <button type="button" class="ai-ib${view.smart ? " is-on" : ""}" data-act="toggle:smart" aria-label="Smart Guides" data-tip="Smart Guides">${ui("smart")}</button></div>`) +
        sec("prefs", "Preferences", `${num("pref-nudge", prefs.nudge, { label: "Keyboard Increment:", unit: "px", min: .1, wide: true })}
          <label class="ai-check"><input type="checkbox" data-k="pref-strokes"${prefs.scaleStrokes ? " checked" : ""}><span>Scale Strokes & Effects</span></label>`) +
        sec("quick", "Quick Actions", `<div class="ai-g2"><button type="button" class="ai-btn" data-act="doc-setup">Document Setup</button><button type="button" class="ai-btn" data-act="prefs">Preferences</button></div>
          <button type="button" class="ai-btn is-full" data-act="export">Export</button>`);
    }
    const b = o.getBoundingRect(true, true);
    const fill = firstOf("fill"), stroke = firstOf("stroke"), target = o.type === "activeSelection" ? o.getObjects()[0] : o;
    let h = `<p class="ai-note is-strong">${typeName(o)}</p>`;
    h += sec("transform", "Transform", `
      <div class="ai-g2">${num("x", b.left - a.x, { label: "X", unit: "px" })}${num("y", b.top - a.y, { label: "Y", unit: "px" })}</div>
      ${k !== "multi" ? `<div class="ai-g2">${num("w", o.getScaledWidth(), { label: "W", unit: "px", min: 1 })}${num("h", o.getScaledHeight(), { label: "H", unit: "px", min: 1 })}</div>
      <div class="ai-g2">${num("angle", o.angle, { label: "∠", unit: "°" })}<div class="ai-seg"><button type="button" data-act="flip-h" aria-label="Flip Horizontal" data-tip="Flip Horizontal">${ui("flip-h")}</button><button type="button" data-act="flip-v" aria-label="Flip Vertical" data-tip="Flip Vertical">${ui("flip-v")}</button></div></div>` : ""}
      ${o.type === "rect" ? num("rx", o.rx || 0, { label: "Corner", unit: "px", min: 0, wide: true }) : ""}`);
    if (k === "text") {
      h += sec("char", "Character", `${fontBtn(o)}
        <div class="ai-g2">${sel("fontWeight", o.fontWeight, (FONTS[o.fontFamily] || [400, 700]).map(w => [w, WEIGHT_NAMES[w]]), "Font style")}${num("fontSize", o.fontSize, { label: "T", unit: "px", min: 1, d: 1, tip: "Font size" })}</div>
        <div class="ai-g2">${num("leading", o.fontSize * o.lineHeight, { label: "A", unit: "px", d: 1, tip: "Leading" })}${num("charSpacing", o.charSpacing, { label: "VA", step: 10, tip: "Tracking" })}</div>
        <div class="ai-g2"><div class="ai-seg"><button type="button" data-set="fontStyle" data-v="1" class="${o.fontStyle === "italic" ? "is-on" : ""}" aria-label="Italic" data-tip="Italic">${ui("italic")}</button><button type="button" data-set="underline" data-v="1" class="${o.underline ? "is-on" : ""}" aria-label="Underline" data-tip="Underline">${ui("underline")}</button></div>
        <button type="button" class="ai-btn" data-act="case:upper">AA</button></div>`) +
        sec("para", "Paragraph", segBtns("textAlign", o.textAlign, [["left", "t-left", "Align Left"], ["center", "t-center", "Align Centre"], ["right", "t-right", "Align Right"], ["justify", "t-justify", "Justify"]]));
    }
    h += sec("appearance", "Appearance", `
      ${paintRow("Fill", "fill", fill)}
      ${paintRow("Stroke", "stroke", stroke)}
      <div class="ai-g2">${num("strokeWidth", (target.kind === "icon" ? iconParts(target)[0].strokeWidth : target.strokeWidth) || 0, { label: "Weight", unit: "px", min: 0, step: .5 })}
        ${sel("dash", target.strokeDashArray ? (target.strokeDashArray[0] < .1 ? "dotted" : "dashed") : "solid", [["solid", "Solid"], ["dashed", "Dashed"], ["dotted", "Dotted"]], "Dash")}</div>
      ${o.type !== "activeSelection" && (target.stroke) ? `<div class="ai-g2">${sel("cap", target.strokeLineCap || "butt", [["butt", "Butt cap"], ["round", "Round cap"], ["square", "Square cap"]], "Cap")}${sel("join", target.strokeLineJoin || "miter", [["miter", "Miter join"], ["round", "Round join"], ["bevel", "Bevel join"]], "Join")}</div>` : ""}
      ${isGrad(target.fill) ? `<div class="ai-grad"><span class="ai-lbl">Gradient</span>
        <div class="ai-gradbar" style="background:${paintCss(target.fill)}"></div>
        <div class="ai-g2">${swatchIn("grad-0", gradStops(target.fill)[0])}${swatchIn("grad-1", gradStops(target.fill).slice(-1)[0])}</div>
        <div class="ai-g2">${sel("grad-type", target.fill.type, [["linear", "Linear"], ["radial", "Radial"]], "Type")}${num("grad-angle", target.fill.angle || 0, { label: "∠", unit: "°" })}</div></div>` : ""}
      ${num("opacity", round((o.opacity ?? 1) * 100), { label: "Opacity", unit: "%", min: 0, max: 100, wide: true })}
      <label class="ai-check"><input type="checkbox" data-k="shadow"${target.shadow ? " checked" : ""}><span>Drop Shadow</span></label>
      ${target.shadow && k !== "multi" ? `<div class="ai-g2">${num("sh-x", target.shadow.offsetX, { label: "X", unit: "px" })}${num("sh-y", target.shadow.offsetY, { label: "Y", unit: "px" })}</div>
        <div class="ai-g2">${num("sh-blur", target.shadow.blur, { label: "Blur", unit: "px", min: 0 })}${swatchIn("sh-color", target.shadow.color)}</div>` : ""}`);
    if (k === "image") {
      const fl = o.filters || [], val = (T, key) => { const x = fl.find(t => t && t.type === T); return x ? round(x[key] * 100) : 0; };
      h += sec("image", "Image", `${num("imgRadius", o.kindRadius || 0, { label: "Corner", unit: "px", min: 0, wide: true })}
        ${num("brightness", val("Brightness", "brightness"), { label: "Brightness", min: -100, max: 100, wide: true })}
        ${num("contrast", val("Contrast", "contrast"), { label: "Contrast", min: -100, max: 100, wide: true })}
        ${num("saturation", val("Saturation", "saturation"), { label: "Saturation", min: -100, max: 100, wide: true })}
        <div class="ai-g2"><button type="button" class="ai-btn" data-act="fx:gray">B&amp;W</button><button type="button" class="ai-btn" data-act="fx:clear">Reset</button></div>`);
    }
    h += sec("align", "Align", `<div class="ai-icons">${ALIGN6.map(([v, ic, l]) => `<button type="button" class="ai-ib" data-set="align" data-v="${v}" aria-label="${l}" data-tip="${l}">${ui(ic)}</button>`).join("")}</div>
      ${k === "multi" ? `<div class="ai-icons"><button type="button" class="ai-ib" data-act="dist:h" aria-label="Distribute Horizontally" data-tip="Distribute Horizontally">${ui("dist-h")}</button><button type="button" class="ai-ib" data-act="dist:v" aria-label="Distribute Vertically" data-tip="Distribute Vertically">${ui("dist-v")}</button></div><p class="ai-note">Aligns to the selection.</p>` : `<p class="ai-note">Aligns to the artboard.</p>`}`);
    h += sec("quick", "Quick Actions", `<div class="ai-g2">
      ${k === "multi" ? `<button type="button" class="ai-btn" data-act="group">Group</button>` : k === "group" ? `<button type="button" class="ai-btn" data-act="ungroup">Ungroup</button>` : `<button type="button" class="ai-btn" data-act="duplicate">Duplicate</button>`}
      <button type="button" class="ai-btn" data-act="lock">${o.locked ? "Unlock" : "Lock"}</button>
      <button type="button" class="ai-btn" data-act="front">Bring to Front</button><button type="button" class="ai-btn" data-act="back">Send to Back</button>
      ${k === "shape" ? `<button type="button" class="ai-btn" data-act="expand">Expand</button>` : ""}${k === "path" || k === "shape" ? `<button type="button" class="ai-btn" data-act="tool:direct">Edit Points</button>` : ""}
      <button type="button" class="ai-btn is-danger" data-act="delete">Delete</button></div>`);
    return h;
  }
  const KIND_ICON = { text: "type", image: "image", icon: "smile", group: "layers", shape: "rect", path: "pen", multi: "layers" };
  function layersPanel() {
    const objs = cv.getObjects(), selList = active();
    const allHidden = objs.length && objs.every(o => o.visible === false), allLocked = objs.length && objs.every(o => o.locked);
    return `<div class="ai-layers">
      <div class="ai-layer-top"><button type="button" data-ly-all="eye" aria-label="Show or hide all">${ui(allHidden ? "eye-off" : "eye")}</button><button type="button" data-ly-all="lock" aria-label="Lock or unlock all">${ui(allLocked ? "lock" : "unlock")}</button><span class="ai-ly-sw" style="--c:#1f7aff"></span><strong>Layer 1</strong><em>${objs.length}</em></div>
      <ul data-layers>${objs.map((o, i) => [o, i]).reverse().map(([o, i]) => `
        <li draggable="true" data-ly="${i}" class="${selList.includes(o) ? "is-on" : ""}${o.visible === false ? " is-hidden" : ""}">
          <button type="button" data-ly-eye aria-label="${o.visible === false ? "Show" : "Hide"}">${ui(o.visible === false ? "eye-off" : "eye")}</button>
          <button type="button" data-ly-lock aria-label="${o.locked ? "Unlock" : "Lock"}" class="${o.locked ? "is-on" : ""}">${ui(o.locked ? "lock" : "unlock")}</button>
          <span class="ai-ly-thumb" style="--c:${paintCss(o.kind === "icon" ? iconParts(o)[0].stroke : o.fill || o.stroke)}">${ui(KIND_ICON[kindOf(o)] || "rect")}</span>
          <span class="ai-ly-name"${isText(o) ? " data-no-i18n" : ""}>${esc(isText(o) ? (o.text || "").slice(0, 32) || o.name : o.name || typeName(o))}</span>
          <i class="ai-ly-sel"></i>
        </li>`).join("") || `<li class="ai-empty">Nothing on the page yet.</li>`}</ul></div>`;
  }
  function artboardsPanel() {
    return `<ul class="ai-abs">${doc.artboards.map((a, i) => `<li data-ab="${i}" class="${i === doc.active ? "is-on" : ""}"><b>${i + 1}</b><span>${esc(a.name)}</span><em>${a.w} × ${a.h}</em></li>`).join("")}</ul>
      <div class="ai-g2"><button type="button" class="ai-btn" data-act="ab-new">New Artboard</button><button type="button" class="ai-btn" data-act="tool:artboard">Edit Artboards</button></div>`;
  }
  function swatchesPanel() {
    const docCols = [...new Set(flat(cv.getObjects()).flatMap(o => [o.fill, o.stroke]).map(c => toHex(c)).filter(Boolean))].slice(0, 24);
    const row = cols => `<div class="ai-swatches">${cols.map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}" title="${c}"></button>`).join("")}</div>`;
    return `<div class="ai-swatch-target">${["fill", "stroke"].map(t => `<button type="button" data-focus="${t}" class="${paint.focus === t ? "is-on" : ""}">${t === "fill" ? "Fill" : "Stroke"}</button>`).join("")}</div>
      <div class="ai-swatches"><button type="button" class="is-none" data-swatch="none" aria-label="None" title="None"></button>${BASIC.map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}" title="${c}"></button>`).join("")}</div>
      <h4 class="ai-h4">Gradients</h4><div class="ai-swatches">${GRADIENTS.map((g, i) => `<button type="button" style="--c:linear-gradient(135deg, ${g[0]}, ${g[1]})" data-gradient="${i}" aria-label="Gradient"></button>`).join("")}</div>
      ${brief ? `<h4 class="ai-h4">${esc(brief.title)}</h4>${row(pal(brief.palette))}` : ""}
      ${docCols.length ? `<h4 class="ai-h4">Document colours</h4>${row(docCols)}` : ""}
      ${(DS.palettes || []).map(p => `<h4 class="ai-h4">${esc(p.name)}</h4>${row(p.colors)}`).join("")}`;
  }
  function librariesPanel() {
    return `<p class="ai-note">Ready-made pieces for your design.</p>
      <div class="ai-libgrid">
        ${[["brief", "target", "Practice briefs"], ["templates", "grid", "Templates"], ["text", "fonts", "Font pairs"], ["icons", "smile", "Icons"], ["images", "image", "Your images"], ["swatches", "swatches", "Swatches"]]
          .map(([p, ic, l]) => `<button type="button" class="ai-lib" data-panel="${p}">${ui(ic)}<span>${l}</span></button>`).join("")}
      </div>
      <h4 class="ai-h4">Templates</h4>${tplGrid()}`;
  }
  let briefPick = Math.floor(Math.random() * BRIEFS.length);
  function briefPanel() {
    const b = BRIEFS[briefPick], [sn, sw, sh] = SIZES[b.size], on = brief === b;
    return `<p class="ai-note">Practise like a real designer: take a brief, design it, then download it for your portfolio.</p>
      <article class="ai-brief${on ? " is-on" : ""}">
        <span class="ai-brief-client">${esc(b.client)}</span>
        <h4>${esc(b.title)}</h4>
        <p>${esc(b.task)}</p>
        <dl><dt>Format</dt><dd>${sn} · ${sw} × ${sh}</dd><dt>Palette</dt><dd><span class="ai-brief-pal">${pal(b.palette).map(c => `<i style="--c:${c}"></i>`).join("")}</span></dd></dl>
        <p class="ai-brief-tip">${icon("lightbulb")}<span>${esc(b.tip)}</span></p>
      </article>
      <div class="ai-g2"><button type="button" class="ai-btn is-blue" data-act="brief-start">${on ? "Restart brief" : "Start this brief"}</button><button type="button" class="ai-btn" data-act="brief-next">${ui("shuffle")}<span>Another</span></button></div>
      ${brief && !on ? `<p class="ai-note">Working on: <b>${esc(brief.title)}</b></p>` : ""}`;
  }
  const tplGrid = () => `<div class="ai-tpls">${TEMPLATES.map((t, i) => `<button type="button" class="ai-tpl" data-tpl="${i}"><img alt="" data-tpl-img="${i}" width="${t.w}" height="${t.h}"><span>${t.name}</span></button>`).join("")}</div>`;
  const templatesPanel = () => `<p class="ai-note">Start from a layout, then make it yours.</p>${tplGrid()}`;
  function textPanel() {
    return `<button type="button" class="ai-addtext h" data-text="heading">Add a heading</button>
      <button type="button" class="ai-addtext s" data-text="sub">Add a subheading</button>
      <button type="button" class="ai-addtext b" data-text="body">Add body text</button>
      <h4 class="ai-h4">Font pairs</h4>
      ${PAIRS.map(([x, xw, y, yw], i) => `<button type="button" class="ai-pair" data-pair="${i}"><b style="font-family:'${x}';font-weight:${xw}">${x}</b><span style="font-family:'${y}';font-weight:${yw}">with ${y}</span></button>`).join("")}`;
  }
  const iconsPanel = () => `<label class="ai-search">${icon("search")}<input type="search" data-icon-q placeholder="Search icons" aria-label="Search icons"></label>
    <div class="ai-iconsgrid">${Object.keys(window.DS_ICONS || {}).map(n => `<button type="button" data-icon="${n}" aria-label="${n}" title="${n}">${icon(n)}</button>`).join("")}</div>`;
  const uploads = [];
  const imagesPanel = () => `<button type="button" class="ai-btn is-blue is-full" data-act="place">${ui("upload")}<span>Place images</span></button>
    <p class="ai-note">Or drag images onto the canvas, or paste one. They stay on your device.</p>
    <div class="ai-uploads">${uploads.map((u, i) => `<button type="button" data-up="${i}" aria-label="Place again"><img src="${u}" alt=""></button>`).join("")}</div>`;

  /* ---------- Status bar, refresh ---------- */
  let uiRaf = 0;
  function refreshUI() {
    cancelAnimationFrame(uiRaf);
    uiRaf = requestAnimationFrame(() => {
      const keepScroll = dockBody.scrollTop;
      renderControl(); renderDock(); syncPaint();
      dockBody.scrollTop = keepScroll;
      abSel.innerHTML = doc.artboards.map((a, i) => `<option value="${i}"${i === doc.active ? " selected" : ""}>${i + 1}</option>`).join("");
      afterView();
      $$("[data-act=undo]", root).forEach(b => { b.disabled = hist.i <= 0; });
    });
  }

  /* =====================================================================
     Dock, control bar and dialog events
     ===================================================================== */
  const onInput = (e, done) => {
    const el = e.target;
    if (!el.dataset.k) return;
    const k = el.dataset.k;
    if (el.type === "number" && el.value === "") return;
    let v = el.type === "checkbox" ? el.checked : el.value;
    if (el.type === "color") { const lab = el.closest(".ai-sw"); if (lab) { lab.style.setProperty("--c", v); lab.classList.remove("is-none"); } }
    if (k === "ctl-fill" || k === "ctl-stroke" || k === "fill" || k === "stroke") { setPaint(k.replace("ctl-", ""), v, done); if (done) refreshUI(); return; }
    if (k === "ab-preset") { if (+v > -1) { const [, w, h] = SIZES[+v], t = doc.artboards[abSelected > -1 ? abSelected : doc.active]; t.w = w; t.h = h; cv.requestRenderAll(); changed(); refreshUI(); } return; }
    if (k === "active-ab") { doc.active = +v; fitArtboard(); refreshUI(); return; }
    if (el.type === "checkbox") { apply(k, v, true); refreshUI(); return; }
    apply(k, el.type === "number" ? +v : v, done);
    if (done && (el.tagName === "SELECT" || k === "grad-type")) refreshUI();
  };
  [control, dockBody, dialog].forEach(box => {
    box.addEventListener("input", e => onInput(e, false));
    box.addEventListener("change", e => { onInput(e, true); });
    box.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.matches("input")) e.target.blur(); });
    box.addEventListener("click", e => {
      const t = e.target.closest("button, li[data-ly], li[data-ab]");
      if (!t) return;
      if (t.dataset.set) {
        if (t.dataset.set === "align") align(t.dataset.v);
        else { apply(t.dataset.set, t.dataset.v); refreshUI(); }
        return;
      }
      if (t.dataset.panel) { setPanel(t.dataset.panel); return; }
      if (t.dataset.swatch) { const v = t.dataset.swatch === "none" ? null : t.dataset.swatch; setPaint(paint.focus, v); refreshUI(); closePop(); return; }
      if (t.dataset.gradient != null) { const g = GRADIENTS[+t.dataset.gradient]; if (active().length) setGradient(g); closePop(); return; }
      if (t.dataset.focus) { paint.focus = t.dataset.focus; syncPaint(); renderDock(); return; }
      if (t.dataset.font) { setFont(t.dataset.font); closePop(); return; }
      if (t.dataset.tpl != null) { useTemplate(+t.dataset.tpl); return; }
      if (t.dataset.text) { addText(t.dataset.text); return; }
      if (t.dataset.pair != null) { addPair(+t.dataset.pair); return; }
      if (t.dataset.icon) { addIcon(t.dataset.icon); return; }
      if (t.dataset.up != null) { addImage(uploads[+t.dataset.up]); return; }
      if (t.dataset.ab != null) { doc.active = +t.dataset.ab; abSelected = doc.active; fitArtboard(); refreshUI(); return; }
      if (t.dataset.lyAll) {
        const objs = cv.getObjects();
        if (t.dataset.lyAll === "eye") { const show = objs.every(o => o.visible === false); objs.forEach(o => o.set("visible", show)); }
        else { const lock = !objs.every(o => o.locked); objs.forEach(o => lockState(o, lock)); }
        cv.discardActiveObject(); cv.requestRenderAll(); changed(); return;
      }
      const li = t.closest("li[data-ly]");
      if (li) {
        const o = cv.getObjects()[+li.dataset.ly];
        if (!o) return;
        if (e.target.closest("[data-ly-eye]")) { o.set("visible", o.visible === false); if (!o.visible) cv.discardActiveObject(); cv.requestRenderAll(); changed(); return; }
        if (e.target.closest("[data-ly-lock]")) { lockState(o, !o.locked); cv.requestRenderAll(); changed(); return; }
        if (o.visible !== false) {
          if (tool !== "select" && tool !== "direct") setTool("select");
          if (e.shiftKey && cv.getActiveObject()) reselect([...new Set([...active(), o])]); else cv.setActiveObject(o);
          cv.requestRenderAll(); refreshUI();
        }
        return;
      }
      if (t.dataset.act) act(t.dataset.act, t, e);
    });
  });
  dockTabs.addEventListener("click", e => { const b = e.target.closest("[data-panel]"); if (b) setPanel(b.dataset.panel); });
  $(".ai-strip", root).addEventListener("click", e => { const b = e.target.closest("[data-panel]"); if (b) setPanel(b.dataset.panel); });
  dockBody.addEventListener("input", e => {
    if (!e.target.matches("[data-icon-q]")) return;
    const q = e.target.value.trim().toLowerCase();
    $$("[data-icon]", dockBody).forEach(b => { b.hidden = q && !b.dataset.icon.includes(q); });
  });
  dockBody.addEventListener("dblclick", e => {
    const li = e.target.closest("li[data-ly]"), abLi = e.target.closest("li[data-ab]");
    if (li) {
      const o = cv.getObjects()[+li.dataset.ly], nm = li.querySelector(".ai-ly-name");
      if (!o || isText(o)) return;
      const input = document.createElement("input");
      input.className = "ai-text"; input.value = o.name || "";
      nm.replaceWith(input); input.focus(); input.select();
      const done = () => { o.name = input.value.trim() || o.name; changed(); refreshUI(); };
      input.addEventListener("blur", done); input.addEventListener("keydown", ev => { if (ev.key === "Enter") input.blur(); if (ev.key === "Escape") { input.value = o.name; input.blur(); } });
    } else if (abLi) { doc.active = abSelected = +abLi.dataset.ab; setTool("artboard"); }
  });
  let dragLy = null;
  dockBody.addEventListener("dragstart", e => { const li = e.target.closest("[data-ly]"); if (li) { dragLy = +li.dataset.ly; e.dataTransfer.effectAllowed = "move"; } });
  dockBody.addEventListener("dragover", e => { if (dragLy != null && e.target.closest("[data-ly]")) e.preventDefault(); });
  dockBody.addEventListener("drop", e => {
    const li = e.target.closest("[data-ly]");
    if (dragLy == null || !li) return;
    e.preventDefault();
    cv.moveTo(cv.getObjects()[dragLy], +li.dataset.ly);
    dragLy = null; cv.requestRenderAll(); changed();
  });
  const setPanel = p => { if (p === "properties" && panel === "properties" && innerWidth < 900) { root.classList.toggle("show-dock"); return; } panel = p; root.classList.add("show-dock-ok"); if (innerWidth < 900) root.classList.add("show-dock"); renderDock(); };
  const openDockOnPhone = () => { if (innerWidth < 900 && panel === "properties") root.classList.add("show-dock"); };

  /* ---------- Popovers: swatches, fonts, zoom presets, context menu ---------- */
  let pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function openPop(anchor, html, cls = "") {
    closePop();
    const R = root.getBoundingClientRect(), r = anchor.getBoundingClientRect();
    pop = document.createElement("div");
    pop.className = "ai-pop " + cls;
    pop.innerHTML = html;
    root.appendChild(pop);
    const w = pop.offsetWidth, h = pop.offsetHeight;
    let x = r.left - R.left, y = r.bottom - R.top + 4;
    if (x + w > R.width - 8) x = R.width - w - 8;
    if (y + h > R.height - 8) y = Math.max(8, r.top - R.top - h - 4);
    pop.style.left = Math.max(8, x) + "px"; pop.style.top = y + "px";
    pop.addEventListener("click", e => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.swatch) { setPaint(paint.focus, t.dataset.swatch === "none" ? null : t.dataset.swatch); refreshUI(); closePop(); }
      else if (t.dataset.gradient != null) { setGradient(GRADIENTS[+t.dataset.gradient]); closePop(); }
      else if (t.dataset.font) { setFont(t.dataset.font); closePop(); }
      else if (t.dataset.zoom) { if (t.dataset.zoom === "fit") fitArtboard(); else zoomCenter(+t.dataset.zoom); closePop(); }
      else if (t.dataset.act) { closePop(); act(t.dataset.act); }
    });
    return pop;
  }
  document.addEventListener("pointerdown", e => {
    if (pop && !pop.contains(e.target) && !e.target.closest("[data-act^='swatch-pop'], [data-act='font-menu'], [data-act='zoom-menu']")) closePop();
    if (!flyout.hidden && !flyout.contains(e.target)) flyout.hidden = true;
    if (!menuPop.hidden && !menuPop.contains(e.target) && !e.target.closest(".ai-menu-btn")) closeMenu();
  });
  const swatchPopHtml = () => `<div class="ai-swatches"><button type="button" class="is-none" data-swatch="none" aria-label="None"></button>${BASIC.map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}"></button>`).join("")}</div>
    <div class="ai-swatches">${GRADIENTS.map((g, i) => `<button type="button" style="--c:linear-gradient(135deg, ${g[0]}, ${g[1]})" data-gradient="${i}" aria-label="Gradient"></button>`).join("")}</div>
    ${brief ? `<div class="ai-swatches">${pal(brief.palette).map(c => `<button type="button" style="--c:${c}" data-swatch="${c}" aria-label="${c}"></button>`).join("")}</div>` : ""}
    <button type="button" class="ai-poplink" data-act="panel:swatches">All swatches…</button>`;
  function openContext(e, target) {
    if (target && tool === "select" && !active().includes(target)) cv.setActiveObject(target);
    const has = !!cv.getActiveObject(), o = cv.getActiveObject();
    const items = [["Undo", "mod+Z", "undo", hist.i > 0], ["Redo", "mod+shift+Z", "redo", hist.i < hist.stack.length - 1], "-",
      ["Cut", "mod+X", "cut", has], ["Copy", "mod+C", "copy", has], ["Paste", "mod+V", "paste", !!clip], ["Duplicate", "mod+D", "duplicate", has], ["Delete", "Del", "delete", has], "-",
      ["Bring to Front", "mod+shift+]", "front", has], ["Send to Back", "mod+shift+[", "back", has],
      o && o.type === "activeSelection" ? ["Group", "mod+G", "group", true] : ["Ungroup", "mod+shift+G", "ungroup", !!(o && o.type === "group")],
      [o && o.locked ? "Unlock" : "Lock", "mod+2", "lock", has], ["Hide", "mod+3", "hide", has], "-", ["Select All", "mod+A", "select-all", true]];
    const R = root.getBoundingClientRect();
    menuPop.innerHTML = items.map(it => it === "-" ? `<hr>` : `<button type="button" data-mact="${it[2]}"${it[3] ? "" : " disabled"}><span>${it[0]}</span><kbd>${keyLabel(it[1])}</kbd></button>`).join("");
    menuPop.hidden = false; menuPop.dataset.ctx = "1";
    const x = Math.min(e.clientX - R.left, R.width - menuPop.offsetWidth - 6), y = Math.min(e.clientY - R.top, R.height - menuPop.offsetHeight - 6);
    menuPop.style.left = x + "px"; menuPop.style.top = y + "px";
  }

  /* ---------- Menu bar ---------- */
  let menuOpen = -1;
  const checked = flag => {
    if (!flag) return false;
    if (flag.startsWith("panel:")) return panel === flag.slice(6);
    return !!view[flag];
  };
  const enabled = a => {
    const o = cv.getActiveObject(), n = active().length;
    if (["cut", "copy", "duplicate", "delete", "lock", "hide", "front", "back", "forward", "backward", "flip-h", "flip-v", "reset-rot", "reset-scale"].includes(a) || a.startsWith("align:") || a.startsWith("fx:shadow")) return n > 0;
    if (a === "paste" || a === "paste-in-place") return !!clip;
    if (a === "undo") return hist.i > 0;
    if (a === "redo") return hist.i < hist.stack.length - 1;
    if (a === "group") return !!(o && o.type === "activeSelection");
    if (a === "ungroup") return !!(o && o.type === "group");
    if (a.startsWith("dist:")) return n > 2;
    if (a === "expand") return !!(o && kindOf(o) === "shape");
    if (a.startsWith("case:") || a.startsWith("talign:") || a === "lorem") return flat(active()).some(isText);
    if (a === "fx:noshadow") return n > 0;
    if (a.startsWith("fx:")) return active().some(x => x.type === "image");
    if (a === "ab-delete") return doc.artboards.length > 1;
    return true;
  };
  const menuItems = (items) => items.map(it => {
    if (it === "-") return "<hr>";
    const [label, b, c, flag] = it;
    if (Array.isArray(b)) return `<div class="ai-sub"><button type="button" class="ai-subbtn"><span>${label}</span>${ui("right")}</button><div class="ai-submenu">${menuItems(b)}</div></div>`;
    return `<button type="button" data-mact="${c}"${enabled(c) ? "" : " disabled"} class="${checked(flag) ? "is-checked" : ""}"><i>${checked(flag) ? ui("check") : ""}</i><span>${label}</span><kbd>${keyLabel(b)}</kbd></button>`;
  }).join("");
  function openMenu(i) {
    const btn = $(`[data-menu="${i}"]`, root);
    menuOpen = i;
    $$(".ai-menu-btn", root).forEach(b => b.classList.toggle("is-open", b === btn));
    menuPop.innerHTML = menuItems(MENUS[i][1]);
    delete menuPop.dataset.ctx;
    menuPop.hidden = false;
    const R = root.getBoundingClientRect(), r = btn.getBoundingClientRect();
    menuPop.style.left = Math.min(r.left - R.left, R.width - menuPop.offsetWidth - 4) + "px";
    menuPop.style.top = (r.bottom - R.top) + "px";
  }
  function closeMenu() { menuOpen = -1; menuPop.hidden = true; $$(".ai-menu-btn", root).forEach(b => b.classList.remove("is-open")); }
  $(".ai-menubar", root).addEventListener("click", e => {
    const b = e.target.closest("[data-menu]");
    if (b) { if (menuOpen === +b.dataset.menu) closeMenu(); else openMenu(+b.dataset.menu); return; }
    const a = e.target.closest("[data-act]");
    if (a) act(a.dataset.act, a, e);
  });
  $(".ai-menubar", root).addEventListener("pointerover", e => { const b = e.target.closest("[data-menu]"); if (b && menuOpen > -1 && +b.dataset.menu !== menuOpen) openMenu(+b.dataset.menu); });
  menuPop.addEventListener("click", e => { const b = e.target.closest("[data-mact]"); if (b && !b.disabled) { closeMenu(); act(b.dataset.mact, b, e); } });

  /* =====================================================================
     Adding things: text, icons, images, templates
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
    const head = placeCentre(textbox(tr("Big ideas start here"), { fontFamily: x, fontWeight: xw, fontSize: 104, width: 820, lineHeight: 1, charSpacing: x === "Bebas Neue" ? 20 : -20, name: "Heading" }));
    const body = placeCentre(textbox(tr("A short line of supporting text that explains the idea."), { fontFamily: y, fontWeight: yw, fontSize: 34, width: 820, lineHeight: 1.4, charSpacing: 0, name: "Body text" }));
    const gap = 28 * unit(), a = ab(), total = head.getScaledHeight() + gap + body.getScaledHeight();
    head.set({ top: a.y + (a.h - total) / 2 }); body.set({ top: head.top + head.getScaledHeight() + gap, left: head.left });
    head.setCoords(); body.setCoords();
    reselect([head, body]); changed();
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
    if (panel === "images") renderDock();
  }
  const fileImg = $("[data-file-img]", root), fileJson = $("[data-file-json]", root);
  fileImg.addEventListener("change", () => { addFiles(fileImg.files); fileImg.value = ""; });
  fileJson.addEventListener("change", () => {
    const f = fileJson.files[0];
    fileJson.value = "";
    if (f) f.text().then(s => restore(s, { refit: true }).then(() => { changed(); toast(tr("Project opened")); })).catch(() => toast(tr("That file isn't a Draft Studio design.")));
  });
  let dragDepth = 0;
  viewport.addEventListener("dragenter", e => { if ([...(e.dataTransfer.types || [])].includes("Files")) { dragDepth++; root.classList.add("is-dropping"); } });
  viewport.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; root.classList.remove("is-dropping"); } });
  viewport.addEventListener("dragover", e => e.preventDefault());
  viewport.addEventListener("drop", e => { e.preventDefault(); dragDepth = 0; root.classList.remove("is-dropping"); addFiles(e.dataTransfer.files); });
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
    freshDoc(t.w, t.h, t.bg, t.name);
    hist.busy++;
    t.make().forEach(o => { applyToolState(o); o.strokeUniform = true; cv.add(o); });
    hist.busy--;
    refreshText(); setTool("select"); changed(); refreshUI();
  }
  function startBrief() {
    const b = BRIEFS[briefPick];
    if (!isEmpty() && !confirm(tr("Start a new design for this brief? Your current design will be replaced. You can undo it."))) return;
    const [, w, h] = SIZES[b.size], cols = pal(b.palette);
    freshDoc(w, h, cols[cols.length - 1], tr(b.title));
    brief = b;
    changed(); refreshUI();
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
  async function exportArtboard(i, fmt, scale = 1, transparent = false) {
    const a = doc.artboards[i];
    const keep = cv.getActiveObject();
    cv.discardActiveObject(); smart = [];
    await loadFontsOf(cv.getObjects());
    const name = slug(doc.name) + (doc.artboards.length > 1 ? "-" + slug(a.name) : "");
    if (fmt === "svg") {
      const svg = cv.toSVG({ width: a.w, height: a.h, viewBox: { x: a.x, y: a.y, width: a.w, height: a.h } });
      const fonts = [...new Set(flat(cv.getObjects()).filter(isText).map(o => o.fontFamily).filter(f => f !== "Georgia"))];
      const css = fonts.length ? `<style>@import url("https://fonts.googleapis.com/css2?${fonts.map(f => "family=" + f.replace(/ /g, "+") + ":wght@400;500;600;700;800").join("&")}&display=swap");</style>` : "";
      const bg = transparent ? "" : `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="${a.bg}"/>`;
      saveBlob(new Blob([svg.replace(/(<svg[^>]*>)/, `$1${css}`).replace(/(<\/defs>)/, `$1${bg}`)], { type: "image/svg+xml" }), name + ".svg");
    } else {
      exportBg = !(transparent && fmt === "png");
      const v = cv.viewportTransform, z = v[0];
      const url = cv.toDataURL({ format: fmt === "jpg" ? "jpeg" : "png", quality: .92, multiplier: scale / z,
        left: v[4] + a.x * z, top: v[5] + a.y * z, width: a.w * z, height: a.h * z });
      exportBg = true;
      saveBlob(await (await fetch(url)).blob(), `${name}.${fmt}`);
    }
    if (keep) cv.setActiveObject(keep);
    cv.requestRenderAll();
  }
  function exportDialog(fmt = "png") {
    openDialog("Export", `
      <div class="ai-form">
        <label>Format ${sel("ex-fmt", fmt, [["png", "PNG"], ["jpg", "JPG"], ["svg", "SVG"]], "Format")}</label>
        <label>Scale ${sel("ex-scale", 1, [[0.5, "0.5×"], [1, "1×"], [2, "2×"], [3, "3×"], [4, "4×"]], "Scale")}</label>
        <label>Artboards ${sel("ex-which", "current", [["current", `${tr("Current")} (${doc.active + 1})`], ["all", tr("All")]], "Artboards")}</label>
        <label class="ai-check"><input type="checkbox" data-ex-transp><span>Transparent background (PNG and SVG)</span></label>
      </div>`, [["Cancel", "close-dialog"], ["Export", "do-export", true]]);
  }
  async function doExport() {
    const fmt = $("[data-k=ex-fmt]", dialog).value, scale = +$("[data-k=ex-scale]", dialog).value, which = $("[data-k=ex-which]", dialog).value, tp = $("[data-ex-transp]", dialog).checked;
    closeDialog();
    const list = which === "all" ? doc.artboards.map((_, i) => i) : [doc.active];
    for (const i of list) await exportArtboard(i, fmt, scale, tp);
    toast(tr("Exported"));
  }

  /* =====================================================================
     Dialogs
     ===================================================================== */
  function openDialog(title, body, buttons = [["OK", "close-dialog", true]]) {
    dialog.innerHTML = `<header><strong>${title}</strong><button type="button" class="ai-ib" data-act="close-dialog" aria-label="Close">${ui("close")}</button></header>
      <div class="ai-dialog-body">${body}</div>
      <footer>${buttons.map(([l, a, primary]) => `<button type="button" class="ai-btn${primary ? " is-blue" : ""}" data-act="${a}">${l}</button>`).join("")}</footer>`;
    modal.hidden = false;
    const f = $("input, select, button.is-blue", dialog);
    if (f) setTimeout(() => f.focus(), 30);
  }
  const closeDialog = () => { modal.hidden = true; dialog.innerHTML = ""; };
  modal.addEventListener("pointerdown", e => { if (e.target === modal) closeDialog(); });
  function docSetup() {
    const a = ab();
    openDialog("Document Setup", `<div class="ai-form">
      <label>Artboard ${sel("ab-preset", SIZES.findIndex(([, w, h]) => w === a.w && h === a.h), [[-1, "Custom"], ...SIZES.map(([n, w, h], i) => [i, `${n} · ${w} × ${h}`])], "Preset")}</label>
      <div class="ai-g2">${num("ab-w", a.w, { label: "Width", unit: "px", min: 1 })}${num("ab-h", a.h, { label: "Height", unit: "px", min: 1 })}</div>
      <div class="ai-row"><span class="ai-lbl">Background</span>${swatchIn("ab-bg", a.bg)}</div>
      <button type="button" class="ai-btn" data-act="edit-artboards">Edit Artboards</button></div>`, [["OK", "close-dialog", true]]);
  }
  function prefsDialog() {
    openDialog("Preferences", `<div class="ai-form">
      ${num("pref-nudge", prefs.nudge, { label: "Keyboard Increment", unit: "px", min: .1, wide: true })}
      ${num("pref-grid", prefs.gridSize, { label: "Gridline every", unit: "px", min: 2, wide: true })}
      <label class="ai-check"><input type="checkbox" data-k="pref-strokes"${prefs.scaleStrokes ? " checked" : ""}><span>Scale Strokes & Effects</span></label>
      <label class="ai-check"><input type="checkbox" data-pref-view="smart"${view.smart ? " checked" : ""}><span>Smart Guides</span></label>
      <label class="ai-check"><input type="checkbox" data-pref-view="names"${view.names ? " checked" : ""}><span>Show Artboard Names</span></label></div>`, [["OK", "close-dialog", true]]);
  }
  dialog.addEventListener("change", e => { const v = e.target.dataset.prefView; if (v) { view[v] = e.target.checked; saveView(); cv.requestRenderAll(); } });
  const SHORTCUTS = [
    ["Tools", [["Selection", "V"], ["Direct Selection", "A"], ["Pen", "P"], ["Pencil", "N"], ["Paintbrush", "B"], ["Type", "T"], ["Line Segment", "\\"], ["Rectangle", "M"], ["Ellipse", "L"],
      ["Rotate", "R"], ["Scale", "S"], ["Eyedropper", "I"], ["Gradient", "G"], ["Artboard", "shift+O"], ["Hand", "H / Space"], ["Zoom", "Z"]]],
    ["Edit", [["Undo", "mod+Z"], ["Redo", "mod+shift+Z"], ["Copy / Cut / Paste", "mod+C / X / V"], ["Paste in Place", "mod+shift+V"], ["Duplicate", "mod+D"], ["Delete", "Del"], ["Nudge", "Arrows (Shift ×10)"], ["Copy while dragging", "Alt + drag"]]],
    ["Object", [["Group / Ungroup", "mod+G / mod+shift+G"], ["Bring Forward / Back", "mod+] / mod+["], ["To Front / Back", "mod+shift+] / ["], ["Lock / Unlock All", "mod+2 / mod+alt+2"], ["Hide / Show All", "mod+3 / mod+alt+3"]]],
    ["Paint", [["Default Fill and Stroke", "D"], ["Switch Fill and Stroke", "X"], ["Swap Fill and Stroke", "shift+X"], ["None", "/"]]],
    ["View", [["Zoom In / Out", "mod+= / mod+-"], ["Fit Artboard", "mod+0"], ["Fit All", "mod+alt+0"], ["Actual Size", "mod+1"], ["Rulers", "mod+R"], ["Smart Guides", "mod+U"], ["Guides", "mod+;"], ["Grid", "mod+'"]]]
  ];
  function shortcutsDialog() {
    openDialog("Keyboard Shortcuts", `<div class="ai-keys">${SHORTCUTS.map(([g, rows]) => `<section><h4>${g}</h4>${rows.map(([l, k]) => `<div><span>${l}</span><kbd>${keyLabel(k)}</kbd></div>`).join("")}</section>`).join("")}</div>`, [["OK", "close-dialog", true]]);
  }

  /* =====================================================================
     Actions
     ===================================================================== */
  function toggle(flag) {
    view[flag] = !view[flag];
    if (flag === "rulers") { root.classList.toggle("no-rulers", !view.rulers); requestAnimationFrame(() => { resize(); sizeRulers(); }); }
    if (flag === "control") root.classList.toggle("no-control", !view.control);
    if (flag === "tools") root.classList.toggle("no-tools", !view.tools);
    saveView(); cv.requestRenderAll(); refreshUI();
  }
  const selectWhere = fn => { setTool("select"); reselect(cv.getObjects().filter(o => o.visible !== false && !o.locked && fn(o))); refreshUI(); };
  function act(a, el, e) {
    if (!a) return;
    const [name, arg] = a.split(":");
    switch (name) {
      case "new":
        if (isEmpty() || confirm(tr("Start a new design? You can undo it."))) { brief = null; freshDoc(1080, 1350); changed(); refreshUI(); }
        break;
      case "open": fileJson.click(); break;
      case "save": commit(); toast(tr("Saved on this device")); break;
      case "save-file": saveBlob(new Blob([snapshot()], { type: "application/json" }), slug(doc.name) + ".design.json"); break;
      case "place": fileImg.click(); break;
      case "export": exportDialog(arg || "png"); break;
      case "export-all": doc.artboards.forEach((_, i) => exportArtboard(i, "png")); break;
      case "do-export": doExport(); break;
      case "doc-setup": docSetup(); break;
      case "edit-artboards": closeDialog(); setTool("artboard"); break;
      case "prefs": prefsDialog(); break;
      case "shortcuts": shortcutsDialog(); break;
      case "about": openDialog("About Canvas", `<p class="ai-note">Canvas is Draft Studio's free design app. It runs entirely in your browser: nothing is uploaded, and your work autosaves on this device.</p><p class="ai-note">Built with Fabric.js (MIT licence).</p>`); break;
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
      case "flip-h": case "flip-v": active().forEach(o => o.set(name === "flip-h" ? "flipX" : "flipY", !o[name === "flip-h" ? "flipX" : "flipY"])); cv.requestRenderAll(); changed(); break;
      case "reset-rot": active().forEach(o => { const c = o.getCenterPoint(); o.rotate(0); o.setPositionByOrigin(c, "center", "center"); o.setCoords(); }); cv.requestRenderAll(); changed(); refreshUI(); break;
      case "reset-scale": active().forEach(o => { const c = o.getCenterPoint(); o.set({ scaleX: 1, scaleY: 1 }); o.setPositionByOrigin(c, "center", "center"); o.setCoords(); }); cv.requestRenderAll(); changed(); refreshUI(); break;
      case "front": case "back": case "forward": case "backward": arrange(name); break;
      case "align": align(arg); break;
      case "dist": distribute(arg); break;
      case "group": group(); break;
      case "ungroup": ungroup(); break;
      case "lock": { const list = active(); const lock = !list.every(o => o.locked); list.forEach(o => lockState(o, lock)); if (lock) cv.discardActiveObject(); cv.requestRenderAll(); changed(); refreshUI(); break; }
      case "unlock-all": cv.getObjects().forEach(o => lockState(o, false)); cv.requestRenderAll(); changed(); refreshUI(); break;
      case "hide": active().forEach(o => o.set("visible", false)); cv.discardActiveObject(); cv.requestRenderAll(); changed(); break;
      case "show-all": cv.getObjects().forEach(o => o.set("visible", true)); cv.requestRenderAll(); changed(); break;
      case "expand": { const o = cv.getActiveObject(); if (o) { const p = expand(o); cv.setActiveObject(p); changed(); refreshUI(); } break; }
      case "ab-new": {
        const last = doc.artboards[doc.artboards.length - 1], c = ab();
        doc.artboards.push(newArtboard(c.w, c.h, last.x + last.w + 80, last.y));
        doc.active = abSelected = doc.artboards.length - 1; fitArtboard(); changed(); refreshUI(); break;
      }
      case "ab-dup": {
        const c = ab(), last = doc.artboards[doc.artboards.length - 1], dx = last.x + last.w + 80 - c.x, dy = last.y - c.y;
        const copyAb = Object.assign({}, c, { name: c.name + " " + tr("copy"), x: c.x + dx, y: c.y + dy });
        const inside = cv.getObjects().filter(o => { const p = o.getCenterPoint(); return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h; });
        doc.artboards.push(copyAb); doc.active = abSelected = doc.artboards.length - 1;
        let left = inside.length;
        const done = () => { if (--left <= 0) { fitArtboard(); changed(); refreshUI(); } };
        if (!left) done();
        inside.forEach(o => o.clone(cl => { cl.set({ left: cl.left + dx, top: cl.top + dy }); applyToolState(cl); cv.add(cl); done(); }, PROPS));
        break;
      }
      case "ab-fit": {
        const c = doc.artboards[abSelected > -1 ? abSelected : doc.active], inside = cv.getObjects().filter(o => o.visible !== false);
        if (!inside.length) break;
        const bs = inside.map(o => o.getBoundingRect(true, true));
        const l = Math.min(...bs.map(b => b.left)), t = Math.min(...bs.map(b => b.top));
        c.x = round(l); c.y = round(t); c.w = round(Math.max(...bs.map(b => b.left + b.width)) - l); c.h = round(Math.max(...bs.map(b => b.top + b.height)) - t);
        cv.requestRenderAll(); changed(); refreshUI(); break;
      }
      case "ab-delete": {
        if (doc.artboards.length < 2) { toast(tr("A document needs at least one artboard.")); break; }
        const i = abSelected > -1 ? abSelected : doc.active;
        doc.artboards.splice(i, 1); doc.active = abSelected = clamp(i - 1, 0, doc.artboards.length - 1);
        cv.requestRenderAll(); changed(); refreshUI(); break;
      }
      case "ab-first": case "ab-prev": case "ab-next": case "ab-last": {
        const n = doc.artboards.length;
        doc.active = { "ab-first": 0, "ab-prev": Math.max(0, doc.active - 1), "ab-next": Math.min(n - 1, doc.active + 1), "ab-last": n - 1 }[name];
        fitArtboard(); refreshUI(); break;
      }
      case "case": changeCase(arg); break;
      case "talign": apply("textAlign", arg); refreshUI(); break;
      case "lorem": flat(active()).filter(isText).forEach(o => { o.set("text", "Good design is as little design as possible. Less, but better, because it concentrates on the essential."); o.initDimensions(); }); cv.requestRenderAll(); changed(); break;
      case "select-all": selectWhere(() => true); break;
      case "select-artboard": { const c = ab(); selectWhere(o => { const p = o.getCenterPoint(); return p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h; }); break; }
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
      case "actual": zoomCenter(1); break;
      case "zoom-menu": openPop(el, `<div class="ai-poplist">${[["fit", "Fit Artboard"], [.25, "25%"], [.5, "50%"], [.75, "75%"], [1, "100%"], [1.5, "150%"], [2, "200%"], [4, "400%"], [8, "800%"]].map(([v, l]) => `<button type="button" data-zoom="${v}">${l}</button>`).join("")}</div>`); break;
      case "toggle": toggle(arg); break;
      case "clear-guides": doc.guides = { v: [], h: [] }; cv.requestRenderAll(); changed(); break;
      case "panel": setPanel(arg); break;
      case "toggle-dock": root.classList.toggle("show-dock"); break;
      case "reset-ws": Object.assign(view, { rulers: true, smart: true, guides: true, control: true, tools: true }); ["no-rulers", "no-control", "no-tools"].forEach(c => root.classList.remove(c)); panel = "properties"; collapsed.clear(); saveView(); requestAnimationFrame(resize); refreshUI(); break;
      case "tool": setTool(arg); break;
      case "sec": collapsed.has(arg) ? collapsed.delete(arg) : collapsed.add(arg); renderDock(); break;
      case "swatch-pop": paint.focus = arg; syncPaint(); openPop(el, swatchPopHtml(), "is-swatches"); break;
      case "font-menu": openPop(el, `<div class="ai-poplist is-fonts">${Object.keys(FONTS).map(f => `<button type="button" data-font="${esc(f)}" style="font-family:'${esc(f)}'">${esc(f)}</button>`).join("")}</div>`); break;
      case "paint-none": setPaint(arg || paint.focus, null); refreshUI(); break;
      case "paint-colour": { const k = arg || paint.focus, c = firstOf(k); setPaint(k, isGrad(c) ? gradStops(c)[0] : (c || (k === "fill" ? "#ffffff" : "#000000"))); refreshUI(); break; }
      case "paint-gradient": { const c = firstOf("fill"); if (active().length) setGradient(gradStops(c)); else toast(tr("Select an object first.")); break; }
      case "swap-paint": swapPaint(); break;
      case "default-paint": defaultPaint(); break;
      case "brief-start": startBrief(); break;
      case "brief-next": briefPick = (briefPick + 1 + Math.floor(Math.random() * (BRIEFS.length - 1))) % BRIEFS.length; renderDock(); break;
      default: break;
    }
    void e;
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove("is-on"), 2200);
  }

  /* =====================================================================
     Keyboard
     ===================================================================== */
  const TOOL_KEYS = { v: "select", a: "direct", p: "pen", n: "pencil", b: "brush", t: "type", "\\": "line", m: "rect", l: "ellipse", r: "rotate", s: "scale", i: "eyedropper", g: "gradient", h: "hand", z: "zoom" };
  document.addEventListener("keydown", e => {
    if (!modal.hidden) { if (e.key === "Escape") closeDialog(); return; }
    if (isTyping(e.target)) return;
    const o = cv.getActiveObject();
    if (o && o.isEditing) { if (e.key === "Escape") { o.exitEditing(); cv.requestRenderAll(); } return; }
    const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
    if (e.key === " " && !spaceHeld) { spaceHeld = true; toolBeforeSpace = tool; e.preventDefault(); cv.selection = false; cv.skipTargetFind = true; cv.isDrawingMode = false; cv.defaultCursor = "grab"; cv.setCursor("grab"); return; }
    if (e.key === "Escape") {
      if (pen) { finishPen(false); return; }
      if (menuOpen > -1 || !menuPop.hidden) { closeMenu(); return; }
      closePop(); cv.discardActiveObject(); cv.requestRenderAll(); return;
    }
    if (e.key === "Enter" && pen) { finishPen(false); return; }
    const combos = {
      "z": () => (e.shiftKey ? step(1) : step(-1)), "y": () => step(1), "x": cut, "c": copy, "v": () => paste(e.shiftKey), "d": duplicate,
      "a": () => act(e.altKey ? "select-artboard" : e.shiftKey ? "deselect" : "select-all"), "g": () => (e.shiftKey ? ungroup() : group()),
      "]": () => arrange(e.shiftKey ? "front" : "forward"), "[": () => arrange(e.shiftKey ? "back" : "backward"),
      "}": () => arrange("front"), "{": () => arrange("back"),
      "2": () => act(e.altKey ? "unlock-all" : "lock"), "3": () => act(e.altKey ? "show-all" : "hide"),
      "s": () => (e.shiftKey ? act("save-file") : act("save")), "o": () => act("open"), "n": () => act("new"), "e": () => (e.shiftKey ? act("export") : null),
      "p": () => (e.shiftKey ? act("place") : e.altKey ? act("doc-setup") : null), "k": () => (e.altKey && e.shiftKey ? act("shortcuts") : act("prefs")),
      "=": () => act("zoom-in"), "+": () => act("zoom-in"), "-": () => act("zoom-out"), "0": () => act(e.altKey ? "fit-all" : "fit"), "1": () => act("actual"),
      "r": () => toggle("rulers"), "u": () => toggle("smart"), ";": () => toggle(e.altKey ? "lockGuides" : "guides"), "'": () => toggle(e.shiftKey ? "snapGrid" : "grid")
    };
    if (mod) {
      const fn = combos[e.code === "BracketRight" ? (e.shiftKey ? "}" : "]") : e.code === "BracketLeft" ? (e.shiftKey ? "{" : "[") : e.code === "Digit2" ? "2" : e.code === "Digit3" ? "3" : e.code === "Digit0" ? "0" : e.code === "Digit1" ? "1" : k];
      if (fn) { e.preventDefault(); fn(); }
      return;
    }
    if ((k === "delete" || k === "backspace") && o) {
      e.preventDefault();
      if (tool === "direct" && o.kind === "vector" && anchorSel > -1 && o.anchors.length > 2) { o.anchors.splice(anchorSel, 1); anchorSel = -1; rebuild(o); o.controls = vectorControls(o); cv.requestRenderAll(); changed(); }
      else removeSel();
      return;
    }
    if (k.startsWith("arrow") && o && !o.locked) {
      e.preventDefault();
      const d = prefs.nudge * (e.shiftKey ? 10 : 1);
      o.set({ left: o.left + (k === "arrowleft" ? -d : k === "arrowright" ? d : 0), top: o.top + (k === "arrowup" ? -d : k === "arrowdown" ? d : 0) });
      o.setCoords(); cv.requestRenderAll(); liveTransform(); changed();
      return;
    }
    if (e.altKey) return;
    if (e.shiftKey && k === "o") { setTool("artboard"); return; }
    if (e.shiftKey && k === "x") { swapPaint(); return; }
    if (!e.shiftKey && k === "x") { paint.focus = paint.focus === "fill" ? "stroke" : "fill"; syncPaint(); if (panel === "swatches") renderDock(); return; }
    if (k === "d") { defaultPaint(); return; }
    if (k === "/") { setPaint(paint.focus, null); refreshUI(); return; }
    if (k === "f7") { e.preventDefault(); setPanel("layers"); return; }
    if (k === "f1") { e.preventDefault(); shortcutsDialog(); return; }
    if (TOOL_KEYS[k]) setTool(TOOL_KEYS[k]);
  });
  document.addEventListener("keyup", e => {
    if (e.key === " " && spaceHeld) { spaceHeld = false; panning = null; setTool(toolBeforeSpace || "select", true); toolBeforeSpace = null; }
  });

  /* =====================================================================
     Start: reopen the last design, or begin with a brief
     ===================================================================== */
  doc.artboards = [newArtboard(1080, 1350)];
  setTool("select");
  resize();
  store.get("current").then(s => (s ? restore(s, { keepHistory: false, refit: true }) : Promise.reject()))
    .then(() => { savedEl.textContent = tr("Saved on this device"); })
    .catch(() => {
      fitArtboard();
      hist.stack = [snapshot()]; hist.i = 0;
      if (innerWidth >= 900) setPanel("brief");
      refreshUI();
    });
  const qBrief = new URLSearchParams(location.search).get("brief");
  if (qBrief != null && BRIEFS[+qBrief]) { briefPick = +qBrief; setPanel("brief"); }
  refreshUI();
};
