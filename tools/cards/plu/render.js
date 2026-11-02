// Exports every version of the PLU membership card into out/ (or the folder given):
//   V1-Heritage/ PLU-card-V1-print.pdf       blank front + back, 92 × 60 mm (86 × 54 + 3 mm bleed), vector
//                PLU-card-V1-front.png       sample member, 600 dpi, rounded corners
//                PLU-card-V1-front-blank.png / -back.png
//                PLU-card-V1-front-blank.svg / -back.svg   editable (fonts in fonts/)
//   PLU-cards-presentation.jpg + V1/V2/V3 boards (mockups)
//   node render.js [out folder]
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
const NAMES = { 1: "Heritage", 2: "Diplomat", 3: "Republic" };
(async () => {
  const out = path.resolve(process.argv[2] || path.join(__dirname, "out"));
  const url = q => "file://" + path.join(__dirname, "card.html") + "?" + q;
  const b = await chromium.launch();
  const page = async (q, scale = 1) => {
    const p = await b.newPage({ viewport: { width: 600, height: 400 }, deviceScaleFactor: scale });
    p.on("pageerror", e => { console.error("page error:", e.message); process.exit(1); });
    await p.goto(url(q)); await p.evaluate(() => window.ready); return p;
  };
  for (const v of [1, 2, 3]) {
    const dir = path.join(out, `V${v}-${NAMES[v]}`), base = path.join(dir, `PLU-card-V${v}`);
    fs.mkdirSync(dir, { recursive: true });
    let p = await page(`v=${v}&print=1&blank=1`);
    await p.pdf({ path: base + "-print.pdf", width: "92mm", height: "60mm", printBackground: true, pageRanges: "1-2" });
    await p.close();
    // 86 mm at 600 dpi = 2031 px; a CSS mm is 3.7795 px, so scale 6.25
    for (const [side, blank, suffix] of [["front", 0, "front"], ["front", 1, "front-blank"], ["back", 0, "back"]]) {
      p = await page(`v=${v}&side=${side}&blank=${blank}`, 6.25);
      await (await p.$(".card")).screenshot({ path: `${base}-${suffix}.png`, omitBackground: true });
      if (suffix !== "front")
        fs.writeFileSync(`${base}-${suffix}.svg`, '<?xml version="1.0" encoding="UTF-8"?>\n<!-- PLU membership card, 86 x 54 mm trim + 3 mm bleed. Fonts: Cinzel, Barlow Condensed, IBM Plex Mono (Google Fonts). -->\n' +
          await p.$eval("svg", s => s.outerHTML));
      await p.close();
    }
    console.log("V" + v, "done");
  }
  // presentation boards
  for (const m of ["hero", "v1", "v2", "v3"]) {
    const p = await b.newPage({ viewport: { width: 2400, height: 1500 } });
    await p.goto("file://" + path.join(__dirname, "mockup.html") + "?m=" + m); await p.evaluate(() => window.ready);
    await p.screenshot({ path: path.join(out, `PLU-cards-${m === "hero" ? "presentation" : m.toUpperCase() + "-board"}.jpg`), type: "jpeg", quality: 92 });
    await p.close();
  }
  await b.close();
  // exact trim / bleed boxes
  require("child_process").execFileSync("python3", [path.join(__dirname, "fix-pdf.py"), ...[1, 2, 3].map(v => path.join(out, `V${v}-${NAMES[v]}`, `PLU-card-V${v}-print.pdf`))]);
})();
