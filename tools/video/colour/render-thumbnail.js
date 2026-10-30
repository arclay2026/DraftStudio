// Screenshots thumbnail.html to colour-thumbnail.png (1280×720) for the YouTube upload.
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("file://" + path.join(__dirname, "thumbnail.html"));
  await p.evaluate(() => document.fonts.ready);
  const out = process.argv[2] || path.join(__dirname, "colour-thumbnail.png");
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  await b.close(); console.log("Wrote", out);
})();
