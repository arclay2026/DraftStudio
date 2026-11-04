// Renders a video (tools/video/<lesson>/index.html) to MP4, frame by frame, with Playwright and
// ffmpeg, at the size and frame rate the page sets (1920×1080 at 30 fps for the lessons).
//   node render.js <lesson> [out.mp4] [--audio narration.mp3] [--workers 3] [--from s] [--to s] [--no-sfx]
// The frames are split between parallel workers, whose clips are then joined losslessly.
// The soundtrack is mixed by mix.py: the sound effects the timeline scheduled (sfx()), plus, with
// --audio, the recorded narration starting when the logo intro ends (timing.js should then hold the
// cue times measured from that recording). The mix is levelled to -14 LUFS, YouTube's loudness.
const { chromium } = require("playwright");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os");

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i < 0 ? null : args.splice(i, 2)[1]; };
const noSfx = args.includes("--no-sfx"); if (noSfx) args.splice(args.indexOf("--no-sfx"), 1);
const audio = opt("--audio"), part = opt("--frames"), workers = +(opt("--workers") || 3);
const from = +(opt("--from") || 0), to = opt("--to");
const lesson = args[0];
if (!lesson) { console.error("Usage: node render.js <lesson> [out.mp4] [--audio file] [--workers n]"); process.exit(1); }
const dir = path.join(__dirname, "..", lesson);
const out = path.resolve(args[1] || path.join(dir, `${lesson}-lesson.mp4`));
const page0 = "file://" + path.join(dir, "index.html") + "?render";

async function open() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", e => { console.error("page error:", e.message); process.exit(1); });
  await page.goto(page0);
  await page.waitForFunction(() => window.ready, null, { timeout: 30000 });
  const [width, height] = await page.evaluate(() => window.SIZE);
  if (width !== 1920 || height !== 1080) await page.setViewportSize({ width, height });
  return { browser, page };
}

// one worker: frames [a, b) to a silent clip
async function renderPart(a, b, file) {
  const { browser, page } = await open();
  const FPS = await page.evaluate(() => window.FPS);
  const enc = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-profile:v", "high", "-g", String(FPS * 2), file], { stdio: ["pipe", "inherit", "inherit"] });
  const cdp = await page.context().newCDPSession(page);
  for (let f = a; f < b; f++) {
    await page.evaluate(t => window.seek(t), f / FPS);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
    if (!enc.stdin.write(Buffer.from(data, "base64"))) await new Promise(r => enc.stdin.once("drain", r));
    if ((f - a) % 300 === 0) process.stdout.write(`[${path.basename(file)}] ${f - a}/${b - a}\n`);
  }
  enc.stdin.end();
  await new Promise(r => enc.on("close", r));
  await browser.close();
}

(async () => {
  if (part) { const [a, b] = part.split(":").map(Number); return renderPart(a, b, out); }
  const { browser, page } = await open();
  const { DURATION, FPS, INTRO, SFX } = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS, INTRO: window.INTRO, SFX: window.SFX || [] }));
  await browser.close();
  const f0 = Math.round(from * FPS), f1 = Math.round((to ? Math.min(+to, DURATION) : DURATION) * FPS);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "render-"));
  const n = Math.max(1, workers), step = Math.ceil((f1 - f0) / n), t0 = Date.now();
  const parts = [];
  await Promise.all(Array.from({ length: n }, (_, k) => {
    const a = f0 + k * step, b = Math.min(f1, a + step), file = path.join(tmp, `part${k}.mp4`);
    if (a >= b) return null;
    parts.push(file);
    return new Promise((res, rej) => spawn(process.execPath, [__filename, lesson, file, "--frames", `${a}:${b}`], { stdio: "inherit" })
      .on("close", c => (c ? rej(new Error("worker failed")) : res())));
  }));
  fs.writeFileSync(path.join(tmp, "list.txt"), parts.sort().map(p => `file '${p}'`).join("\n"));
  const ff = ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt")];
  // the soundtrack: effects shifted to this render's start, the voice from the end of the logo intro
  // (written as one file with real silence, so every player and YouTube keep it in sync)
  const events = (noSfx ? [] : SFX).map(e => ({ ...e, t: e.t - from })).filter(e => e.t > -3);
  if (audio || events.length) {
    const ev = path.join(tmp, "sfx.json"), wav = path.join(tmp, "mix.wav");
    fs.writeFileSync(ev, JSON.stringify(events));
    const mx = ["-I", path.join(__dirname, "mix.py"), ev, String((f1 - f0) / FPS), wav];
    if (audio) mx.push("--voice", path.resolve(audio), "--offset", String(INTRO - from));
    const m = spawnSync("python3", mx, { stdio: "inherit" });
    if (m.status) process.exit(m.status);
    // with a voice the whole mix is levelled to -14 LUFS; effects alone sit about where they will under a voice
    ff.push("-i", wav, "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "256k", "-af", audio ? "loudnorm=I=-14:TP=-1.5:LRA=11" : "loudnorm=I=-24:TP=-3", "-shortest");
  }
  ff.push("-c:v", "copy", "-movflags", "+faststart", out);
  const r = spawnSync("ffmpeg", ff, { stdio: "inherit" });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status) process.exit(r.status);
  console.log(`Wrote ${out} (${((f1 - f0) / FPS).toFixed(1)} s) in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
