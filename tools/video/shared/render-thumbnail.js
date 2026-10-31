// Screenshots a video's thumbnail.html (the size of its #t element: 1280×720 for YouTube) to <lesson>-thumbnail.png.
//   node render-thumbnail.js <lesson> [out.png]
const { chromium } = require("playwright"), path = require("path");
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const lesson = process.argv[2], dir = path.join(__dirname, "..", lesson);
  await p.goto("file://" + path.join(dir, "thumbnail.html"));
  await p.evaluate(() => document.fonts.ready);
  // a cover can be any size (the vertical videos' covers are 1080×1920): it's the size of #t
  const box = await p.evaluate(() => { const r = document.getElementById("t").getBoundingClientRect(); return { width: r.width, height: r.height }; });
  await p.setViewportSize(box);
  const out = process.argv[3] || path.join(dir, `${lesson}-thumbnail.png`);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, ...box } });
  await b.close(); console.log("Wrote", out);
})();
