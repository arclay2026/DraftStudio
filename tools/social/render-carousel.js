// Renders an Instagram carousel: every <section class="slide"> in tools/social/<name>/carousel.html
// becomes <name>/slide-1.png, slide-2.png… at 1080×1350.
//   node render-carousel.js <name> [out folder]
const { chromium } = require("playwright"), path = require("path"), fs = require("fs");
(async () => {
  const name = process.argv[2];
  if (!name) { console.error("Usage: node render-carousel.js <name> [out folder]"); process.exit(1); }
  const dir = path.join(__dirname, name), out = path.resolve(process.argv[3] || dir);
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1200, height: 1500 } });
  p.on("pageerror", e => { console.error("page error:", e.message); process.exit(1); });
  await p.goto("file://" + path.join(dir, "carousel.html"));
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  const slides = await p.$$(".slide");
  for (const [k, s] of slides.entries()) await s.screenshot({ path: path.join(out, `slide-${k + 1}.png`) });
  await b.close();
  console.log(`Wrote ${slides.length} slides to ${out}`);
})();
