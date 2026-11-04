// Records the real site for the tour, one take per part, timed to the recorded narration (timing.js).
//   node record.js [part…]      → clips/partN.webm (1920×1080) + clips/partN.json (cursor and clicks)
// Chrome's screencast captures every painted frame with its timestamp; the frames are resampled to a
// steady 30 fps. The cursor is not filmed: each move and click is logged, and video.js draws the cursor
// on top, perfectly smooth. The real mouse still travels the same path, so hovers and menus react.
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path"), vm = require("vm"), { spawnSync } = require("child_process");
const ROOT = path.resolve(__dirname, "../../.."), OUT = path.join(__dirname, "clips");
const VW = 1600, VH = 900, DPR = 1.2, FPS = 30;
const sb = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "timing.js"), "utf8"), sb);
const T = n => { const v = sb.window.TIMING[n]; if (v == null) throw new Error("no cue " + n); return v; };
// served over http, like the live site (quick view and history need a real origin)
const PORT = 8765, url = p => `http://127.0.0.1:${PORT}/${p}`;
let server = null;
const serve = () => new Promise(res => { server = require("child_process").spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], { cwd: ROOT, stdio: "ignore" }); setTimeout(res, 800); });
const ease = u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;

// ---------- one take ----------
async function take(name, start, end, page0, script) {
  const b = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  // the Canvas page is heavy to stream: it is captured at 1×, which still matches the window 1:1
  const dpr = name === "part3" ? 1 : DPR;
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: dpr, acceptDownloads: true });
  // links that would leave the site (WhatsApp, Google Drive) stay put: the click shows, nothing opens
  await ctx.addInitScript(() => {
    document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a[href]"); if (a && /wa\.me|whatsapp|drive\.google|mailto:|tel:/.test(a.href)) e.preventDefault(); }, true);
    window.open = () => null;
  });
  await ctx.route(/wa\.me|drive\.google|googleusercontent/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url(page0)); await p.evaluate(() => { try { localStorage.clear(); localStorage.setItem("ds-tour", "done"); } catch (e) {} }); await p.reload();   // fresh settings, no welcome tour
  await p.mouse.move(VW * .55, VH * .6);   // the real mouse starts mid-screen, off the side menu (which opens on hover)
  await p.waitForTimeout(1800);
  const cdp = await ctx.newCDPSession(p);
  const dir = path.join(OUT, name + "-frames"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const frames = [];
  cdp.on("Page.screencastFrame", f => {
    const file = path.join(dir, `f${String(frames.length).padStart(5, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, "base64")); frames.push([f.metadata.timestamp, file]);
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  // the clock: clip time 0 is video time `start`
  const log = { start, end, w: VW, h: VH, moves: [], clicks: [] };
  let cur = { x: VW * .55, y: VH * .6 }; log.moves.push({ t0: start, t1: start, from: cur, to: cur });
  let t0 = 0; const now = () => Date.now() / 1000 - t0 + start;
  const until = async t => { const d = t - now(); if (d > 0) await p.waitForTimeout(d * 1000); };
  const box = async sel => { const l = typeof sel === "string" ? p.locator(sel + " >> visible=true").first() : sel; for (let k = 0; k < 8; k++) {   // panels slide between views: retry for a moment
      await l.scrollIntoViewIfNeeded({ timeout: 150 }).catch(() => {}); const b = await l.boundingBox({ timeout: 150 }).catch(() => null); if (b) return b; }
    throw new Error("not found: " + sel); };
  const api = {
    p, T,
    // glide the cursor to an element (or {x,y}) so it arrives at `arrive`
    async go(sel, arrive, dur = .8, dx = .5, dy = .5) {
      const t1 = arrive, ts = Math.max(now(), t1 - dur), from = { ...cur };
      await until(ts);   // measure the target as the move starts, after any panel has finished sliding
      let to;
      try { to = sel.x != null ? sel : await box(sel).then(b => ({ x: b.x + b.width * dx, y: b.y + b.height * dy })); }
      catch (e) { console.error(`  ! ${e.message.split("\n")[0]}`); log.missed = (log.missed || 0) + 1; return; }
      log.moves.push({ t0: ts, t1, from, to });
      const n = Math.max(4, Math.round((t1 - ts) * 20));
      for (let i = 1; i <= n; i++) { const u = ease(i / n); await p.mouse.move(from.x + (to.x - from.x) * u, from.y + (to.y - from.y) * u); await until(ts + (t1 - ts) * i / n); }
      cur = to;
    },
    async click(at) { await until(at); log.clicks.push({ t: now(), ...cur }); await p.mouse.down(); await p.mouse.up(); },
    async press(sel, arrive, dur = .8, dx, dy) { await api.go(sel, arrive, dur, dx, dy); await api.click(arrive); },
    async type(text, at, per = .085) { for (const [i, ch] of [...text].entries()) { await until(at + i * per); await p.keyboard.type(ch); } },
    async key(k, at) { await until(at); await p.keyboard.press(k); },
    // a smooth wheel scroll of dy pixels over `dur`, from `at`
    async scroll(dy, at, dur = 1) { await until(at); const n = Math.round(dur * 30); for (let i = 1; i <= n; i++) { await p.mouse.wheel(0, dy * (ease(i / n) - ease((i - 1) / n))); await until(at + dur * i / n); } },
    until, now
  };
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: VW * dpr, maxHeight: VH * dpr, everyNthFrame: 1 });
  t0 = Date.now() / 1000;
  try { await script(api); } catch (e) { console.error(`[${name}]`, e.message); }
  await until(end);
  await cdp.send("Page.stopScreencast"); await b.close();
  // steady 30 fps: each frame lasts until the next one; the clip starts exactly at t0
  const rel = frames.map(([ts, f]) => [ts - t0, f]).filter(([t]) => t <= end - start + .5);
  const list = []; let prev = rel[0];
  list.push(`file '${prev[1]}'\nduration ${Math.max(.001, rel[0][0]).toFixed(4)}`);
  for (let i = 0; i < rel.length; i++) { const nx = rel[i + 1] ? rel[i + 1][0] : end - start; list.push(`file '${rel[i][1]}'\nduration ${Math.max(.001, nx - rel[i][0]).toFixed(4)}`); }
  list.push(`file '${rel[rel.length - 1][1]}'`);
  fs.writeFileSync(path.join(dir, "list.txt"), list.join("\n") + "\n");
  const webm = path.join(OUT, name + ".webm");
  spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"), "-vf", `fps=${FPS},scale=${VW * DPR}:${VH * DPR},format=yuv420p`,
    "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "20", "-row-mt", "1", "-deadline", "good", "-cpu-used", "3", "-g", "15", webm], { stdio: "inherit" });
  fs.writeFileSync(path.join(OUT, name + ".json"), JSON.stringify(log));
  fs.rmSync(dir, { recursive: true, force: true });
  const span = rel.length ? rel[rel.length - 1][0] - rel[0][0] : 0;
  console.log(`${name}: ${rel.length} frames in ${span.toFixed(1)} s (${(rel.length / span).toFixed(0)} fps captured), ${log.moves.length} moves, ${log.clicks.length} clicks`);
}

// ---------- the seven parts ----------
const PARTS = {
  // 1 · finding your way around: the sidebar, Ctrl+K, settings, Drafty
  part1: [T("side") - 1, T("ch2") + .2, "index.html", async ({ go, press, type, key, until, T, p }) => {
    await go({ x: 400, y: 160 }, T("side") + .2, 1.1);
    await go("a.side-link[href^='browse.html?cat=mockups']", T("sfiles") + .1, .6);
    await go("a.side-link[href='websites.html']", T("sstudio") + .15, .55);
    await go("a.side-link[href='palettes.html']", T("stools") + .15, .55);
    await go("a.side-link[href='learn.html']", T("shelp") + .15, .5);
    await go({ x: 820, y: 330 }, T("cmd") + .2, .7);
    await key("Control+k", T("cmd") + .5);
    await type("logo", T("cmd") + 1.2, .14);
    await key("Escape", T("settings") - .55);
    await press("button.set-btn", T("settings") + .25, .8);
    await press(".set-view.is-on button.set-row:has-text('Appearance')", T("settings") + .95, .45);
    await press(".set-view.is-on button.set-theme:has-text('Dark')", T("lang") - .7, .45);
    await press(".set-view.is-on button.set-back", T("lang"), .45);
    await press(".set-view.is-on button.set-row:has-text('Language')", T("lang") + .75, .4);
    await go(".set-view.is-on button.set-opt:has-text('Français')", T("lang") + 1.35, .45);
    await go(".set-view.is-on button.set-opt:has-text('中文')", T("size") - .45, .55);
    await press(".set-view.is-on button.set-back", T("size"), .4);
    await press(".set-view.is-on button.set-row:has-text('Text size')", T("size") + .7, .4);
    await press(".set-view.is-on button.set-opt:has-text('Large')", T("size") + 1.25, .4);
    await press(".set-view.is-on button.set-opt:has-text('Default')", T("drafty") - .45, .4);
    await press("button.set-x", T("drafty"), .4);
    await press("button.ch-fab", T("drafty") + .8, .8);
    await go({ x: 1380, y: 752 }, T("ask") - .7, .6);
    await type("Are the files free?", T("ask") - .45, .055);
    await key("Enter", T("ask") + .75);
  }],
  // 2 · free files: shelves, search, browse filters, save, a design, download, license, exclusive logos
  part2: [T("home") - 1, T("ch3") + .2, "index.html", async ({ go, press, type, key, scroll, until, T, p }) => {
    await go({ x: 900, y: 520 }, T("home") + .4, 1);
    await scroll(1180, T("shelves") - .2, 1.3);
    await go({ x: 700, y: 520 }, T("shelves") + 1.3, .9);
    await go({ x: 1100, y: 520 }, T("shelves") + 2.4, .9);
    await scroll(-1180, T("search") - 1.1, .9);
    await press("input[type=search]", T("search") + .1, .7, .3);
    await type("logo", T("search") + .9, .16);
    await press("a.side-link[href='browse.html']", T("browse") - .15, .9);
    await press("button.dd-toggle", T("ftype") - .05, .7);
    await key("Escape", T("flicense") - .25);
    await press("label.sel-wrap:has-text('License') button.sel-toggle", T("flicense") + .05, .4);
    await key("Escape", T("forient") - .25);
    await press("label.sel-wrap:has-text('Orientation') button.sel-toggle", T("forient") + .05, .45);
    await key("Escape", T("fcolour") - .3);
    await press("button.sel-toggle[aria-label='Colour']", T("fcolour") + .05, .5);
    await press("button.sw[aria-label='Blue']", T("fcolour") + .85, .5);
    await key("Escape", T("save") - .9);
    await press("button.card-save", T("save") + .3, .9);
    await press("a:has-text('Hoodie Mockup')", T("open") + .1, .8);
    await press("button.dlx-btn", T("formats") + .2, .9);
    await press("button:has-text('hoodie-mockup-one.psd')", T("download") + .55, .6);
    await go("a:has-text('Read the license')", T("free") + .7, .9);
    await press("a:has-text('Read the license')", T("license") - .05, .4);
    await scroll(420, T("license") + 1.2, 1.2);
    await press("a.side-link[href^='browse.html?cat=logos']", T("premium") - .1, .9);
    await press("a:has-text('Kaven — Letter K Logo')", T("premium") + 1.1, .8);
    await go("a:has-text('Buy on WhatsApp')", T("exclusive") + .2, .9);
    await press("a:has-text('Buy on WhatsApp')", T("request") + .4, .3);
  }],
  // 3 · Canvas
  part3: [T("canvas") - 1, T("ch4") + .2, "canvas.html", async api => require("./record-canvas.js")(api)],
  // 4 · QR Code Studio
  part4: [T("qr") - 1, T("ch5") + .2, "qr.html", async ({ go, press, type, key, scroll, until, T, p }) => {
    await go({ x: 560, y: 470 }, T("qr") + .6, 1.1);
    await press("input.qs-input", T("qrcontent") + .1, .8);
    await p.locator("input.qs-input").first().fill(""); await type("draftylabs.com", T("qrcontent") + .35, .06);
    await press("button.qs-type:has-text('Wi-Fi')", T("qrwifi") + .15, .6);
    await press("button.qs-type:has-text('WhatsApp')", T("qrwa") + .15, .5);
    await press("button.qs-type:has-text('Email')", T("qrmore") + .1, .5);
    await press("button.qs-type:has-text('Contact')", T("qrmore") + 1.2, .5);
    await press("button.qs-type:has-text('Link')", T("qrpattern") - .5, .4);
    await scroll(330, T("qrpattern") - .2, .7);
    await press("button.qs-tile:has-text('Dots')", T("qrpattern") + .5, .6);
    await scroll(330, T("qrcorners") - .45, .55);
    await press("button.qs-tile:has-text('Circle')", T("qrcorners") + .3, .5);
    await press("button.qs-look:has-text('Ocean')", T("qrcolour") + .25, .6);
    await scroll(420, T("qrlogo") - .4, .5);
    await press("button.qs-ico[aria-label='chat logo']", T("qrlogo") + .45, .6);
    await scroll(-1080, T("qrcheck") - .3, .9);
    await go({ x: 470, y: 760 }, T("qrcheck") + .9, .8);
    await press("label.sel-wrap.qs-px button.sel-toggle", T("qrexport") + .6, .9);
    await press("button:has-text('4096 px')", T("qrexport") + 1.5, .5);
    await press("button.btn-dl", T("qrexport") + 2.6, .6);
  }],
  // 5 · Barcode Studio, then Palettes
  part5: [T("barcode") - 1, T("ch6") + .2, "barcode.html", async ({ go, press, type, key, scroll, until, T, p }) => {
    await go({ x: 560, y: 470 }, T("barcode") + .6, 1);
    for (const [k, f] of ["UPC-A", "EAN-8", "Code 128", "ITF-14"].entries()) await press(`button.bs-type:has-text('${f}')`, T("bformats") + .3 + k * .75, .45);
    await press("button.bs-look:has-text('Studio')", T("blooks") - .2, .5);
    await press("button.bs-look:has-text('Forest')", T("blooks") + .45, .4);
    await go({ x: 470, y: 760 }, T("bcheck") + .6, .7);
    await press("a.side-link[href='palettes.html']", T("palettes") - .2, .9);
    await scroll(900, T("palettes") + .6, 1.3);
    await scroll(-900, T("generate") - .9, .8);
    await press("button:has-text('Generate')", T("generate") + .2, .6);
    await press("label.sel-wrap:has-text('Harmony') button.sel-toggle", T("pmodes") + .1, .6);
    await press("button:has-text('Pastel')", T("pmodes") + 1.6, .5);
    await go({ x: 820, y: 640 }, T("space") - .1, .5);
    await key("Space", T("space") + .45); await key("Space", T("space") + 1.4);
    await go("button.ps-hex", T("roles") + .4, .7);
    await press("button:has-text('Dark')", T("preview") + .9, .8);
    await press("button:has-text('Light')", T("copy") - .4, .5);
    await press("button:has-text('Copy HEX')", T("copy") + .25, .7);
    await press("button:has-text('Copy CSS')", T("copy") + 1.05, .4);
    await press("button:has-text('Download PNG')", T("png") + .4, .6);
  }],
  // 6 · Learn
  part6: [T("learn") - 1, T("ch7") + .2, "learn.html", async ({ go, press, type, key, scroll, until, T, p }) => {
    await go({ x: 900, y: 420 }, T("learn") + .5, 1);
    await scroll(560, T("lessons") - .1, 2.6);
    await scroll(-560, T("diagrams") - 1.4, .9);
    await press("a:has-text('Colour'), button:has-text('Colour')", T("diagrams") - .1, .8);
    await scroll(500, T("diagrams") + .9, 1);
    await press("[aria-label*='Play'], button.ac-vn-play, .ac-vn-slot button", T("listen") + .5, .9);
    await go({ x: 900, y: 520 }, T("highlight") + .6, 1.2);
  }],
  // 7 · the studio: websites, pricing, portfolio
  part7: [T("studio") - 1, T("outro") + .2, "websites.html", async ({ go, press, scroll, T }) => {
    await go({ x: 900, y: 500 }, T("studio") + .6, 1);
    await scroll(360, T("websites") + .3, 1.4);
    await press("a.side-link[href='pricing.html']", T("pricing") - .2, .9);
    await go({ x: 900, y: 520 }, T("pricing") + 1.2, 1);
    await press("a.side-link[href='portfolio.html']", T("portfolio") - .2, .9);
    await go({ x: 900, y: 460 }, T("portfolio") + 1.2, 1);
  }]
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await serve();
  process.on("exit", () => server && server.kill());
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PARTS);
  for (const name of want) { const [s, e, pg, fn] = PARTS[name]; await take(name, s, e, pg, fn); }
  // the cursor logs, for video.js (pages opened from disk can't fetch JSON)
  const all = {}; for (const f of fs.readdirSync(OUT).filter(f => /^part\d\.json$/.test(f))) all[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(OUT, f)));
  fs.writeFileSync(path.join(OUT, "clips.js"), "// written by record.js\nwindow.CLIPS = " + JSON.stringify(all) + ";\n");
  server.kill();
})();
