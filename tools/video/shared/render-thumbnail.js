// Screenshots a lesson's thumbnail.html to <lesson>-thumbnail.png (1280×720) for the YouTube upload.
//   node render-thumbnail.js <lesson> [out.png]
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const lesson = process.argv[2], dir = path.join(__dirname, "..", lesson);
  await p.goto("file://" + path.join(dir, "thumbnail.html"));
  await p.evaluate(() => document.fonts.ready);
  const out = process.argv[3] || path.join(dir, `${lesson}-thumbnail.png`);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  await b.close(); console.log("Wrote", out);
})();
