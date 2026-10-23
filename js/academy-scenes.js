/* =====================================================================
   DESIGN BASICS — the animated scenes on the lesson cards
   Each scene is a tiny design app at work: a cursor moves, clicks and
   drags, and the design responds live. A scene builds itself inside a
   stage element and returns { dur, measure(W, H), update(t, W, H) }:
   js/academy.js calls update every frame with t in seconds (0..dur),
   only while the scene is on screen. Cursor targets are measured from
   the layout, so scenes fit any size and any language.
   ===================================================================== */
(function () {
  /* ---------- Timeline helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const EASE = {
    lin: k => k,
    io: k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: k => 1 - Math.pow(1 - k, 3),
    in: k => k * k * k,
    back: k => { const c = 1.7; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    spring: k => (k >= 1 ? 1 : 1 - Math.exp(-6 * k) * Math.cos(10 * k))
  };
  // keys: [[time, value, ease?], ...]; a value is a number or an array of numbers
  const at = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i], [t0, v0] = keys[i - 1];
      if (t <= t1) {
        const k = EASE[e || "io"](clamp((t - t0) / (t1 - t0 || 1)));
        return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], k)) : lerp(v0, v1, k);
      }
    }
    return keys[keys.length - 1][1];
  };
  const ramp = (t, a, b, e = "io") => EASE[e](clamp((t - a) / (b - a)));
  const inside = (t, a, b) => t >= a && t < b;
  const hsl = (H, S, L) => `hsl(${(((H % 360) + 360) % 360).toFixed(1)} ${S}% ${L}%)`;
  const hex = (H, S, L) => {
    H = ((H % 360) + 360) % 360; S /= 100; L /= 100;
    const f = n => { const k = (n + H / 30) % 12, a = S * Math.min(L, 1 - L); return Math.round(255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
    return ("#" + f(0) + f(8) + f(4)).toUpperCase();
  };
  // Where an element sits inside the scene, from layout (ignores CSS transforms)
  const box = (el, root) => {
    let x = 0, y = 0, e = el;
    while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    const w = el.offsetWidth, h = el.offsetHeight;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  };
  const mid = b => [b.cx, b.cy];
  const setText = (el, s) => { s = String(s); if (el._t !== s) { el._t = s; el.textContent = s; } };
  const uid = () => Math.random().toString(36).slice(2, 8);

  /* ---------- Cursor with click ripples ---------- */
  const ARROW = `<svg viewBox="0 0 24 24"><path d="M5 2.6l14.4 8.6-6.3 1.5-3.4 6.7z" fill="#0f0f0f" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  const PEN = `<svg viewBox="0 0 24 24"><path d="M3 21l2.6-8.4L14.6 4.3l5.1 5.1-8.3 9z" fill="#fff" stroke="#0f0f0f" stroke-width="1.5" stroke-linejoin="round"/><circle cx="10.3" cy="13.7" r="1.7" fill="#0f0f0f"/><path d="M3 21l5.9-5.9" stroke="#0f0f0f" stroke-width="1.3"/></svg>`;
  function cursor(S, kind) {
    const el = document.createElement("span");
    el.className = "ax-cur" + (kind === "pen" ? " is-pen" : "");
    el.innerHTML = kind === "pen" ? PEN : ARROW;
    S.appendChild(el);
    let last = -1, x = 0, y = 0;
    return {
      el,
      get x() { return x; }, get y() { return y; },
      // path: [[t, [x, y] in px, ease]]; clicks: [t]; held: [[from, to]] while the button is down
      update(t, path, clicks = [], held = []) {
        [x, y] = at(t, path);
        const down = held.some(([a, b]) => inside(t, a, b)) || clicks.some(c => inside(t, c - .05, c + .1));
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${down ? .86 : 1})`;
        if (t >= last) for (const c of clicks) if (last < c && t >= c && t - c < .25) ripple(S, x, y);
        last = t;
      }
    };
  }
  function ripple(S, x, y) {
    const r = document.createElement("i");
    r.className = "ax-ripple";
    r.style.left = x + "px"; r.style.top = y + "px";
    S.appendChild(r);
    const a = r.animate([{ transform: "translate(-50%,-50%) scale(.15)", opacity: .9 }, { transform: "translate(-50%,-50%) scale(1)", opacity: 0 }],
      { duration: 560, easing: "cubic-bezier(.2,.75,.25,1)" });
    a.onfinish = () => r.remove();
  }
  const appWin = (cls, title, inner, extra = "") =>
    `<div class="ax-win ${cls}"><div class="ax-bar"><i></i><i></i><i></i><span class="ax-ttl">${title}</span>${extra}</div><div class="ax-body">${inner}</div></div>`;

  /* ---------- Hands-on mode ("Try it yourself") ----------
     Each scene's play() turns off the cursor's script and hands the controls
     to the visitor. It returns { art, render() } where art is the element the
     PNG download draws (or snap() for scenes that draw their own). */
  // Pointer position inside the scene, in scene px
  const local = (e, S) => { const r = S.getBoundingClientRect(); return [(e.clientX - r.left) * S.offsetWidth / r.width, (e.clientY - r.top) * S.offsetHeight / r.height]; };
  // Press and drag: fn(event, "down" | "move" | "up")
  const grab = (el, fn) => {
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", e => {
      if (e.button > 0) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
      fn(e, "down");
      const move = ev => fn(ev, "move");
      const up = ev => { fn(ev, "up"); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
      el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    });
  };
  const tween = (ms, fn, done) => {
    const t0 = performance.now();
    const step = now => { const k = clamp((now - t0) / ms); fn(k); if (k < 1) requestAnimationFrame(step); else if (done) done(); };
    requestAnimationFrame(step);
  };
  const tap = (el, fn) => { el.setAttribute("role", "button"); el.tabIndex = 0; el.addEventListener("click", fn); el.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(e); } }); };
  function toast(S, msg) {
    let el = S.querySelector(".ax-toast");
    if (!el) { el = document.createElement("span"); el.className = "ax-toast"; el.setAttribute("role", "status"); S.appendChild(el); }
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("is-on"), 2800);
  }
  // Text the visitor can retype; mirrors keep a copy in sync (the typeface cross-fade uses two)
  function editable(el, mirrors = [], max = 28) {
    el.contentEditable = "true"; el.spellcheck = false; el.classList.add("is-text");
    let last = el.innerHTML;
    el.addEventListener("paste", e => { e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData.getData("text/plain") || "").slice(0, max)); });
    el.addEventListener("input", () => {
      if (el.textContent.length > max) el.innerHTML = last;
      last = el.innerHTML;
      mirrors.forEach(m => { m.innerHTML = last; });
    });
  }

  /* =====================================================================
     01 COLOUR — drag round the wheel, switch harmonies; the poster
     recolours live
     ===================================================================== */
  function colour(S) {
    const stops = Array.from({ length: 13 }, (_, i) => hsl(i * 30, 90, 58)).join(",");
    S.innerHTML = `
      <div class="ax-panel ax-c-pick">
        <span class="ax-lbl">Colour</span>
        <div class="ax-c-wheel" style="background:conic-gradient(${stops})"><i class="ax-c-hole"></i><b class="ax-c-h"></b><b class="ax-c-h"></b><b class="ax-c-h"></b></div>
        <div class="ax-c-chips"><span>Analogous</span><span>Triadic</span><span>Complementary</span></div>
        <div class="ax-c-read"><i></i><em>#1F7AFF</em></div>
        <div class="ax-c-pal"><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      ${appWin("ax-c-poster", "poster.fig", `
        <div class="ax-c-art"><i></i><i></i><i></i><b></b></div>
        <strong class="ax-c-title" data-no-i18n>Summer<br>sale</strong>
        <span class="ax-c-txt"></span><span class="ax-c-txt short"></span>
        <span class="ax-c-btn">Shop now</span>`)}`;
    const q = s => S.querySelector(s), qa = s => [...S.querySelectorAll(s)];
    const wheel = q(".ax-c-wheel"), hole = q(".ax-c-hole"), hs = qa(".ax-c-h"), chips = qa(".ax-c-chips span");
    const readDot = q(".ax-c-read i"), readHex = q(".ax-c-read em"), pal = qa(".ax-c-pal i");
    const body = q(".ax-c-poster .ax-body"), blobs = qa(".ax-c-art i"), sun = q(".ax-c-art b"), title = q(".ax-c-title"), btn = q(".ax-c-btn");
    const cur = cursor(S);
    const DUR = 11.4;
    const MODES = [[0, 30, -30], [0, 120, 240], [0, 180, 180]];
    const SWITCH = [[0, 0], [4.7, 1], [8.3, 2], [10.95, 0]];
    const HUE = [[0, 214], [1.15, 214], [3.7, 334], [5.75, 334], [7.45, 36], [8.95, 36], [10.4, 214]];
    const DRAG = [[1.15, 3.7], [5.75, 7.45], [8.95, 10.4]];
    let m = null;
    const ring = deg => [m.c[0] + m.R * Math.sin(deg * Math.PI / 180), m.c[1] - m.R * Math.cos(deg * Math.PI / 180)];
    function paint(hue, off, mode, k) {
        hs.forEach((el, j) => {
          const [x, y] = ring(hue + off[j]);
          el.style.transform = `translate(${(x - m.c[0]).toFixed(1)}px, ${(y - m.c[1]).toFixed(1)}px) scale(${j ? .78 : 1})`;
          el.style.background = hsl(hue + off[j], 90, 58);
          el.style.opacity = j === 2 && mode === 2 ? clamp(1 - k * 3) : 1;
        });
        chips.forEach((c, j) => c.classList.toggle("is-on", j === mode));
        const c0 = hsl(hue, 90, 56), c1 = hsl(hue + off[1], 88, 60), c2 = hsl(hue + off[2], 82, 62);
        const ink = hsl(hue, 60, 14);
        hole.style.background = c0;
        hole.style.boxShadow = `0 10px 24px -8px ${c0}`;
        readDot.style.background = c0;
        setText(readHex, hex(hue, 90, 56));
        [c0, c1, mode === 2 ? hsl(hue, 35, 82) : c2, ink, hsl(hue, 70, 95)].forEach((c, j) => { pal[j].style.background = c; });
        body.style.background = hsl(hue, 75, 96);
        blobs[0].style.background = c0; blobs[1].style.background = c1; blobs[2].style.background = c2;
        sun.style.background = hsl(hue + off[1], 95, 84);
        title.style.color = ink;
        btn.style.background = c0;
        btn.style.boxShadow = `0 10px 22px -10px ${c0}`;
        S.style.setProperty("--amb", c0);
    }
    return {
      dur: DUR,
      measure() {
        const w = box(wheel, S);
        m = { c: [w.cx, w.cy], R: w.w * .385, chips: chips.map(c => mid(box(c, S))) };
      },
      update(t) {
        const hue = at(t, HUE);
        let i = 0;
        while (i + 1 < SWITCH.length && t >= SWITCH[i + 1][0]) i++;
        const mode = SWITCH[i][1], from = MODES[i ? SWITCH[i - 1][1] : 0], to = MODES[mode];
        const k = EASE.spring(clamp((t - SWITCH[i][0]) / 1.1));
        const off = from.map((o, j) => lerp(o, to[j], k));
        paint(hue, off, mode, k);
        S.classList.toggle("is-drag", DRAG.some(([a, b]) => inside(t, a, b)));
        // cursor: chip → grab handle → drag round → next chip …
        const on = tt => ring(at(tt, HUE));
        const along = (a, b, n) => Array.from({ length: n }, (_, j) => { const tt = a + (b - a) * (j + 1) / n; return [tt, on(tt), "lin"]; });
        const path = [
          [0, m.chips[0]], [.95, on(1.15), "io"], [1.15, on(1.15)], ...along(1.15, 3.7, 14),
          [4.5, m.chips[1], "io"], [4.85, m.chips[1]], [5.55, on(5.75), "io"], [5.75, on(5.75)], ...along(5.75, 7.45, 10),
          [8.1, m.chips[2], "io"], [8.45, m.chips[2]], [8.8, on(8.95), "io"], [8.95, on(8.95)], ...along(8.95, 10.4, 10),
          [10.8, m.chips[0], "io"], [DUR, m.chips[0]]
        ];
        cur.update(t, path, [1.15, 4.7, 5.75, 8.3, 8.95, 10.95], DRAG);
      },
      play() {
        let hue = 214, mode = 0, off = MODES[0].slice(), k = 1;
        const draw = () => paint(hue, off, mode, k);
        grab(wheel, (e, phase) => {
          const [x, y] = local(e, S);
          hue = (Math.atan2(x - m.c[0], m.c[1] - y) * 180 / Math.PI + 360) % 360;
          S.classList.toggle("is-drag", phase !== "up");
          draw();
        });
        chips.forEach((c, i) => tap(c, () => {
          if (i === mode) return;
          const from = off.slice();
          mode = i;
          tween(1100, kk => { k = EASE.spring(kk); off = from.map((o, j) => lerp(o, MODES[i][j], k)); draw(); });
        }));
        editable(title);
        draw();
        return { art: q(".ax-c-poster"), render: draw };
      }
    };
  }

  /* =====================================================================
     02 TYPOGRAPHY — drag the weight, switch the typeface, set tracking
     ===================================================================== */
  function type(S) {
    S.innerHTML = `
      ${appWin("ax-t-poster", "type.fig", `
        <div class="ax-t-spec">
          <span class="ax-t-guide g1"><em>Cap height</em></span><span class="ax-t-guide g2"><em>x-height</em></span><span class="ax-t-guide g3"><em>Baseline</em></span>
          <b class="ax-t-head sans" data-no-i18n>Bold<br>ideas.</b><b class="ax-t-head serif" data-no-i18n>Bold<br>ideas.</b>
        </div>
        <span class="ax-t-line"></span><span class="ax-t-line"></span><span class="ax-t-line short"></span>
        <span class="ax-t-tag"></span>`)}
      <div class="ax-panel ax-t-panel">
        <b class="ax-t-aa">Aa</b>
        <span class="ax-lbl">Font</span>
        <div class="ax-seg"><span class="is-on">Inter</span><span>Georgia</span></div>
        <span class="ax-lbl">Weight <em class="ax-t-wv">400</em></span>
        <div class="ax-slider s-w"><i></i><b></b></div>
        <span class="ax-lbl">Tracking <em class="ax-t-tv">0</em></span>
        <div class="ax-slider s-t"><i></i><b></b></div>
        <span class="ax-lbl">Size <em class="ax-t-sv">64</em></span>
        <div class="ax-slider s-s" style="--k:.5"><i></i><b></b></div>
      </div>`;
    const q = s => S.querySelector(s), qa = s => [...S.querySelectorAll(s)];
    const sans = q(".sans"), serif = q(".serif"), wv = q(".ax-t-wv"), tv = q(".ax-t-tv"), tag = q(".ax-t-tag");
    const sw = q(".s-w"), st = q(".s-t"), ss = q(".s-s"), sv = q(".ax-t-sv"), segs = qa(".ax-seg span"), spec = q(".ax-t-spec"), aa = q(".ax-t-aa");
    const cur = cursor(S);
    const DUR = 11;
    const WK = [[0, 0], [1.0, 0], [3.3, 1], [8.4, 1], [10.2, 0]];
    const TK = [[0, .5], [5.4, .5], [6.3, .08], [7.1, .9], [7.6, .5]];
    const DRAG = [[1.0, 3.3], [5.4, 7.6], [8.4, 10.2]];
    let m = null;
    // w: weight 0..1, tr: tracking 0..1, serifOn: 0 Inter … 1 Georgia, sz: size 0..1
    function paint(w, tr, serifOn, sz = .5) {
        const weight = Math.round(400 + 300 * w), track = Math.round((tr - .5) * 100), size = Math.round(40 + 48 * sz);
        const mixing = serifOn > .01 && serifOn < .99;
        sans.style.fontWeight = weight;
        serif.style.fontWeight = weight > 550 ? 700 : 400;
        sans.style.letterSpacing = (-.012 - w * .035 + track / 1000).toFixed(4) + "em";
        serif.style.letterSpacing = (-.01 + track / 1000).toFixed(4) + "em";
        sans.style.opacity = (1 - serifOn).toFixed(3); serif.style.opacity = serifOn.toFixed(3);
        sans.style.filter = mixing ? `blur(${(serifOn * 5).toFixed(2)}px)` : "none";
        serif.style.filter = mixing ? `blur(${((1 - serifOn) * 5).toFixed(2)}px)` : "none";
        sans.style.transform = `translateY(${(-serifOn * .08).toFixed(3)}em)`;
        serif.style.transform = `translateY(${((1 - serifOn) * .08).toFixed(3)}em)`;
        segs[0].classList.toggle("is-on", serifOn < .5); segs[1].classList.toggle("is-on", serifOn >= .5);
        aa.classList.toggle("is-serif", serifOn >= .5);
        aa.style.fontWeight = serifOn >= .5 ? (weight > 550 ? 700 : 400) : weight;
        setText(wv, weight); setText(tv, track);
        sw.style.setProperty("--k", w.toFixed(4)); st.style.setProperty("--k", tr.toFixed(4)); ss.style.setProperty("--k", sz.toFixed(4));
        setText(sv, size);
        spec.style.fontSize = (10 * size / 64).toFixed(3) + "cqw";
        sans.classList.toggle("is-front", serifOn < .5); serif.classList.toggle("is-front", serifOn >= .5);
        return { weight, track, size };
    }
    return {
      dur: DUR,
      measure(W, H) { m = { sw: box(sw, S), st: box(st, S), segs: segs.map(s => mid(box(s, S))), rest: [W * .56, H * .93] }; },
      update(t) {
        const w = at(t, WK), tr = at(t, TK);
        const serifOn = clamp(ramp(t, 3.9, 4.45) - ramp(t, 7.95, 8.5));
        const { weight, track } = paint(w, tr, serifOn);
        const dragging = DRAG.findIndex(([a, b]) => inside(t, a - .1, b + .5));
        spec.classList.toggle("is-guides", dragging >= 0);
        tag.classList.toggle("is-on", dragging >= 0);
        if (dragging >= 0) setText(tag, dragging === 1 ? `Tracking ${track}` : `Weight ${weight}`);
        const sx = (b, k) => [b.x + b.w * k, b.cy];
        const path = [
          [0, m.rest], [.85, sx(m.sw, 0), "io"], [1.0, sx(m.sw, 0)], [3.3, sx(m.sw, 1), "io"],
          [3.75, m.segs[1], "io"], [3.95, m.segs[1]],
          [5.25, sx(m.st, .5), "io"], [5.4, sx(m.st, .5)], [6.3, sx(m.st, .08), "io"], [7.1, sx(m.st, .9), "io"], [7.6, sx(m.st, .5), "io"],
          [7.85, m.segs[0], "io"], [8.0, m.segs[0]], [8.3, sx(m.sw, 1), "io"], [8.4, sx(m.sw, 1)], [10.2, sx(m.sw, 0), "io"], [DUR, m.rest, "io"]
        ];
        cur.update(t, path, [1.0, 3.95, 5.4, 7.95, 8.4], DRAG);
      },
      play() {
        let w = 0, tr = .5, sz = .5, serifOn = 0;
        const draw = () => paint(w, tr, serifOn, sz);
        const slide = (el, set, label) => grab(el, (e, phase) => {
          const b = box(el, S);
          set(clamp((local(e, S)[0] - b.x) / b.w));
          const v = draw(), held = phase !== "up";
          spec.classList.toggle("is-guides", held);
          tag.classList.toggle("is-on", held);
          setText(tag, label(v));
        });
        slide(sw, v => { w = v; }, v => `Weight ${v.weight}`);
        slide(st, v => { tr = v; }, v => `Tracking ${v.track}`);
        slide(ss, v => { sz = v; }, v => `Size ${v.size}`);
        segs.forEach((el, i) => tap(el, () => {
          const from = serifOn;
          if (from === i) return;
          tween(550, k => { serifOn = lerp(from, i, EASE.io(k)); draw(); });
        }));
        editable(sans, [serif], 24); editable(serif, [sans], 24);
        draw();
        return { art: q(".ax-t-poster"), render: draw };
      }
    };
  }

  /* =====================================================================
     03 LAYOUT — drag blocks into place: smart guides, spacing, snap;
     then the column grid sweeps in
     ===================================================================== */
  function layout(S) {
    S.innerHTML = appWin("ax-l-canvas", "page.fig", `
      <span class="ax-l-cols">${"<i></i>".repeat(6)}</span>
      <span class="ax-l-blk img" data-size="320 × 420"><span class="ax-pic"><b></b><i></i></span></span>
      <span class="ax-l-blk ttl"><i></i><i></i></span>
      <span class="ax-l-blk txt"><i></i><i></i><i></i></span>
      <span class="ax-l-blk cta" data-size="148 × 48">Get started</span>
      <span class="ax-l-guide h"></span><span class="ax-l-guide v"></span>
      <span class="ax-l-gap x"><em>24</em></span><span class="ax-l-gap y"><em>48</em></span>`,
      `<span class="ax-l-toggle"><i></i>Grid</span>`);
    const q = s => S.querySelector(s);
    const img = q(".img"), cta = q(".cta"), cols = q(".ax-l-cols"), tog = q(".ax-l-toggle");
    const gh = q(".ax-l-guide.h"), gv = q(".ax-l-guide.v"), gx = q(".ax-l-gap.x"), gy = q(".ax-l-gap.y");
    const cur = cursor(S);
    const DUR = 11;
    // [x %, y %, rotate deg] away from each block's final place (in % of the block's own size)
    const IK = [[0, [-8, 30, -6]], [1.05, [-8, 30, -6]], [1.75, [8, 9, -1.5], "io"], [2.35, [1.4, .8, 0], "io"], [2.75, [0, 0, 0], "spring"], [9.3, [0, 0, 0]], [10.6, [-8, 30, -6], "io"]];
    const CK = [[0, [70, 130, 8]], [3.35, [70, 130, 8]], [4.05, [18, 55, 2], "io"], [4.65, [2, 6, 0], "io"], [5.05, [0, 0, 0], "spring"], [9.4, [0, 0, 0]], [10.7, [70, 130, 8], "io"]];
    let m = null;
    const place = (el, k) => { el.style.transform = `translate(${k[0].toFixed(2)}%, ${k[1].toFixed(2)}%) rotate(${k[2].toFixed(2)}deg)`; };
    return {
      dur: DUR,
      measure(W, H) { m = { img: box(img, S), cta: box(cta, S), tog: mid(box(tog, S)), rest: [W * .9, H * .92] }; },
      update(t) {
        const ik = at(t, IK), ck = at(t, CK);
        place(img, ik); place(cta, ck);
        img.classList.toggle("is-sel", inside(t, 1.05, 3.1)); cta.classList.toggle("is-sel", inside(t, 3.35, 5.4));
        const g1 = inside(t, 2.1, 3.0), g2 = inside(t, 4.4, 5.3);
        gh.classList.toggle("is-on", g1); gx.classList.toggle("is-on", g1);
        gv.classList.toggle("is-on", g2); gy.classList.toggle("is-on", g2);
        img.classList.toggle("is-snap", inside(t, 2.6, 2.95)); cta.classList.toggle("is-snap", inside(t, 4.9, 5.25));
        cols.style.setProperty("--k", clamp(ramp(t, 6.25, 7.0) - ramp(t, 8.95, 9.5)).toFixed(4));
        tog.classList.toggle("is-on", t >= 6.2 && t < 8.95);
        const grab = (b, k) => [b.cx + b.w * k[0] / 100, b.cy + b.h * k[1] / 100];
        const gi = tt => grab(m.img, at(tt, IK)), gc = tt => grab(m.cta, at(tt, CK));
        const path = [
          [0, m.rest], [.9, gi(1.05), "io"], [1.05, gi(1.05)], [1.4, gi(1.4), "lin"], [1.75, gi(1.75), "lin"], [2.05, gi(2.05), "lin"], [2.35, gi(2.35), "lin"], [2.75, gi(2.75), "out"],
          [3.2, gc(3.35), "io"], [3.35, gc(3.35)], [3.7, gc(3.7), "lin"], [4.05, gc(4.05), "lin"], [4.35, gc(4.35), "lin"], [4.65, gc(4.65), "lin"], [5.05, gc(5.05), "out"],
          [5.95, m.tog, "io"], [6.2, m.tog], [8.6, m.tog], [8.75, m.tog], [10.1, m.rest, "io"]
        ];
        cur.update(t, path, [1.05, 3.35, 6.2, 8.95], [[1.05, 2.75], [3.35, 5.05]]);
      },
      play() {
        // every block starts out of place; [x %, y %, rotate] of its own size
        const START = [[-6, 12, -5], [8, 170, 3], [-30, 290, -3], [70, 130, 8]];
        const blocks = [img, q(".ttl"), q(".txt"), cta].map((el, i) => ({ el, dx: START[i][0] / 100 * el.offsetWidth, dy: START[i][1] / 100 * el.offsetHeight, r: START[i][2], ok: false }));
        const put = b => { b.el.style.transform = `translate(${b.dx.toFixed(1)}px, ${b.dy.toFixed(1)}px) rotate(${b.r.toFixed(2)}deg)`; };
        const select = b => blocks.forEach(o => o.el.classList.toggle("is-sel", o === b));
        [gx, gy].forEach(g => g.classList.remove("is-on"));
        blocks.forEach(b => {
          put(b);
          grab(b.el, (e, phase) => {
            const [x, y] = local(e, S);
            if (phase === "down") { b.px = x - b.dx; b.py = y - b.dy; b.r = 0; select(b); b.el.style.zIndex = 4; }
            const near = S.offsetWidth * .025;
            let dx = x - b.px, dy = y - b.py;
            const snapX = Math.abs(dx) < near, snapY = Math.abs(dy) < near;
            if (snapX) dx = 0;
            if (snapY) dy = 0;
            b.dx = dx; b.dy = dy;
            gv.style.left = b.el.offsetLeft + "px"; gh.style.top = b.el.offsetTop + "px";
            gv.classList.toggle("is-on", snapX && phase !== "up"); gh.classList.toggle("is-on", snapY && phase !== "up");
            put(b);
            if (phase === "up") {
              b.el.style.zIndex = "";
              b.ok = snapX && snapY;
              if (b.ok) { b.el.classList.add("is-snap"); setTimeout(() => b.el.classList.remove("is-snap"), 400); }
              if (blocks.every(o => o.ok)) toast(S, "Everything lines up. Nice work.");
            }
          });
        });
        q(".ax-l-canvas .ax-body").addEventListener("pointerdown", e => { if (!e.target.closest(".ax-l-blk")) select(null); });
        let grid = 0;
        tap(tog, () => {
          const from = grid, to = tog.classList.toggle("is-on") ? 1 : 0;
          tween(600, k => { grid = lerp(from, to, EASE.io(k)); cols.style.setProperty("--k", grid.toFixed(4)); });
        });
        return { art: q(".ax-l-canvas"), render() { blocks.forEach(put); } };
      }
    };
  }

  /* =====================================================================
     04 HIERARCHY — flip the switch: a flat page ranks itself, then the
     eye heatmap shows what people see first, second and third
     ===================================================================== */
  function hierarchy(S) {
    S.innerHTML = appWin("ax-h-page", "landing.html", `
      <div class="ax-h-col">
        <span class="ax-h-kick"></span>
        <span class="ax-h-title"><i></i><i></i></span>
        <span class="ax-h-sub"></span>
        <span class="ax-h-body"></span><span class="ax-h-body short"></span>
        <span class="ax-h-cta"><em>Get started</em></span>
      </div>
      <span class="ax-h-img ax-pic"><b></b><i></i></span>`,
      `<span class="ax-h-switch"><em>Hierarchy</em><i></i></span>`) + `
      <i class="ax-h-heat"></i><i class="ax-h-heat"></i><i class="ax-h-heat"></i>
      <svg class="ax-h-eye" aria-hidden="true"><path pathLength="1"/></svg>
      <em class="ax-h-n">1</em><em class="ax-h-n">2</em><em class="ax-h-n">3</em>`;
    const q = s => S.querySelector(s), qa = s => [...S.querySelectorAll(s)];
    const page = q(".ax-h-page"), sw = q(".ax-h-switch"), heat = qa(".ax-h-heat"), nums = qa(".ax-h-n");
    const eye = q(".ax-h-eye"), eyePath = q(".ax-h-eye path");
    const targets = [q(".ax-h-title"), q(".ax-h-img"), q(".ax-h-cta")];
    const cur = cursor(S);
    const DUR = 11;
    let m = null;
    return {
      dur: DUR,
      measure(W, H) { m = { sw: mid(box(q(".ax-h-switch i"), S)), rest: [W * .62, H * .93] }; eye.setAttribute("viewBox", `0 0 ${W} ${H}`); },
      update(t) {
        const on = t < 9.2 ? EASE.spring(clamp((t - 1.3) / 1.1)) : 1 - ramp(t, 9.2, 9.9);
        page.style.setProperty("--on", on.toFixed(4));
        page.style.setProperty("--c", clamp(on).toFixed(4));
        sw.classList.toggle("is-on", t >= 1.3 && t < 9.2);
        const hk = [0, 1, 2].map(i => clamp(ramp(t, 3.0 + i, 3.7 + i, "out") - ramp(t, 8.3 + i * .1, 8.9 + i * .1)));
        if (hk.some(k => k > 0)) {
          const pts = targets.map(el => mid(box(el, S)));
          heat.forEach((e, i) => {
            e.style.left = pts[i][0] + "px"; e.style.top = pts[i][1] + "px";
            e.style.opacity = (hk[i] * [.95, .7, .85][i]).toFixed(3);
            e.style.transform = `translate(-50%, -50%) scale(${(.55 + hk[i] * .45).toFixed(3)})`;
          });
          nums.forEach((e, i) => {
            const b = box(targets[i], S);
            e.style.left = b.x + "px"; e.style.top = b.y + "px";
            e.style.opacity = clamp(hk[i] * 2).toFixed(3);
            e.style.transform = `translate(-40%, -40%) scale(${clamp(EASE.back(clamp(hk[i] * 1.5)), 0, 2).toFixed(3)})`;
          });
          const [a, b, c] = pts;
          eyePath.setAttribute("d", `M${a[0]} ${a[1]} C ${(a[0] + b[0]) / 2} ${a[1] - 12}, ${b[0] - 24} ${b[1] - 28}, ${b[0]} ${b[1]} C ${b[0] + 18} ${b[1] + 26}, ${(b[0] + c[0]) / 2 + 30} ${c[1] + 4}, ${c[0]} ${c[1]}`);
          const draw = clamp(ramp(t, 3.2, 5.8) - ramp(t, 8.4, 9.0));
          eyePath.style.strokeDashoffset = (1 - draw).toFixed(4);
          eyePath.style.opacity = draw > .005 ? 1 : 0;
        } else {
          heat.forEach(e => { e.style.opacity = 0; }); nums.forEach(e => { e.style.opacity = 0; });
          eyePath.style.opacity = 0;
        }
        cur.update(t, [[0, m.rest], [1.1, m.sw, "io"], [1.3, m.sw], [2.5, m.rest, "io"], [8.55, m.rest], [9.05, m.sw, "io"], [9.2, m.sw], [10.4, m.rest, "io"]], [1.3, 9.2]);
      },
      play() {
        let on = 0, ranked = false, run = 0;
        const set = v => { page.style.setProperty("--on", v.toFixed(4)); page.style.setProperty("--c", clamp(v).toFixed(4)); };
        // where eyes go: ranked follows title → picture → button; flat wanders between equal blocks
        const heatmap = quiet => {
          const id = ++run;
          const els = ranked ? targets : [q(".ax-h-sub"), q(".ax-h-body.short"), q(".ax-h-img")];
          const strength = ranked ? [.95, .7, .85] : [.42, .4, .38];
          tween(1400, k => {
            if (id !== run) return;
            const pts = els.map(el => mid(box(el, S)));
            heat.forEach((e, i) => {
              const h = clamp(k * 3 - i * .9);
              e.style.left = pts[i][0] + "px"; e.style.top = pts[i][1] + "px";
              e.style.opacity = (h * strength[i]).toFixed(3);
              e.style.transform = `translate(-50%, -50%) scale(${(.55 + h * .45).toFixed(3)})`;
            });
            nums.forEach((e, i) => {
              const h = ranked ? clamp(k * 3 - i * .9) : 0, b = box(targets[i], S);
              e.style.left = b.x + "px"; e.style.top = b.y + "px";
              e.style.opacity = h.toFixed(3);
              e.style.transform = `translate(-40%, -40%) scale(${clamp(EASE.back(h), 0, 2).toFixed(3)})`;
            });
            if (ranked) {
              const [a, b, c] = pts;
              eyePath.setAttribute("d", `M${a[0]} ${a[1]} C ${(a[0] + b[0]) / 2} ${a[1] - 12}, ${b[0] - 24} ${b[1] - 28}, ${b[0]} ${b[1]} C ${b[0] + 18} ${b[1] + 26}, ${(b[0] + c[0]) / 2 + 30} ${c[1] + 4}, ${c[0]} ${c[1]}`);
              eyePath.style.strokeDashoffset = (1 - EASE.io(k)).toFixed(4);
            }
            eyePath.style.opacity = ranked ? 1 : 0;
          });
          if (!quiet) toast(S, ranked ? "Title first, picture second, button third." : "No clear order, so eyes wander.");
        };
        tap(sw, () => {
          const from = on;
          ranked = sw.classList.toggle("is-on");
          run++;
          heat.forEach(e => { e.style.opacity = 0; }); nums.forEach(e => { e.style.opacity = 0; }); eyePath.style.opacity = 0;
          tween(1100, k => { on = lerp(from, ranked ? 1 : 0, ranked ? EASE.spring(k) : EASE.io(k)); set(on); }, () => heatmap());
        });
        set(0);
        heatmap();
        return { art: page, render: () => heatmap(true) };
      }
    };
  }

  /* =====================================================================
     05 LOGOS — the pen tool plots a mark, pulls curve handles, closes
     the path, fills it, then tests it at icon sizes
     ===================================================================== */
  const MARK = "M70 34 L70 116 C112 116 150 106 150 75 C150 44 112 34 70 34 Z M90 56 L90 95 C110 95 128 89 128 75.5 C128 62 110 56 90 56 Z";
  function logos(S) {
    const id = uid();
    const mini = `<svg viewBox="58 24 104 102"><path d="${MARK}" fill="#fff" fill-rule="evenodd"/></svg>`;
    S.innerHTML = `
      <svg class="ax-g-svg" viewBox="0 0 200 150" aria-hidden="true">
        <defs>
          <linearGradient id="g${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b9bff"/><stop offset=".55" stop-color="#1f7aff"/><stop offset="1" stop-color="#1450e6"/></linearGradient>
          <clipPath id="c${id}"><circle class="ax-g-flood" cx="70" cy="34" r="0"/></clipPath>
        </defs>
        <g class="ax-g-keys"><circle cx="110" cy="75" r="41"/><circle cx="110" cy="75" r="19.5"/><path d="M20 34H190M20 116H190M70 10V140M150 10V140M110 10V140"/></g>
        <g class="ax-g-mark">
          <path class="ax-g-fill" d="${MARK}" fill="url(#g${id})" fill-rule="evenodd" clip-path="url(#c${id})"/>
          <path class="ax-g-seg" d="M70 34 L70 116" pathLength="1"/>
          <path class="ax-g-seg" pathLength="1"/>
          <path class="ax-g-seg" pathLength="1"/>
          <path class="ax-g-rub"/>
          <g class="ax-g-hdl"><line/><line/><circle r="2.3"/><circle r="2.3"/></g>
          <circle class="ax-g-close" cx="70" cy="34" r="6.5"/>
          <rect class="ax-g-a" x="67.2" y="31.2" width="5.6" height="5.6"/><rect class="ax-g-a" x="67.2" y="113.2" width="5.6" height="5.6"/><rect class="ax-g-a" x="147.2" y="72.2" width="5.6" height="5.6"/>
        </g>
      </svg>
      <div class="ax-g-sizes">
        <span><i>${mini}</i><em>64</em></span><span><i>${mini}</i><em>32</em></span><span><i>${mini}</i><em>16</em></span>
        <b>Clear at 16px</b>
      </div>`;
    const q = s => S.querySelector(s), qa = s => [...S.querySelectorAll(s)];
    const segs = qa(".ax-g-seg"), rub = q(".ax-g-rub"), flood = q(".ax-g-flood"), fill = q(".ax-g-fill"), keys = q(".ax-g-keys");
    const [hl1, hl2] = qa(".ax-g-hdl line"), [hd1, hd2] = qa(".ax-g-hdl circle"), hdl = q(".ax-g-hdl"), close = q(".ax-g-close");
    const anchors = qa(".ax-g-a"), mark = q(".ax-g-mark"), sizes = q(".ax-g-sizes"), tiles = qa(".ax-g-sizes span"), note = q(".ax-g-sizes b");
    const cur = cursor(S, "pen");
    const DUR = 11.6;
    const A = [70, 34], B = [70, 116], C = [150, 75];
    const set = (el, o) => { for (const k in o) el.setAttribute(k, typeof o[k] === "number" ? o[k].toFixed(2) : o[k]); };
    let sc = 1;
    return {
      dur: DUR,
      measure(W) { sc = W / 200; },
      update(t) {
        const u = p => [p[0] * sc, p[1] * sc];   // svg units → px
        const pull = EASE.out(clamp((t - 2.4) / .85));
        const hOut = [150, lerp(75, 106, pull)], hIn = [150, lerp(75, 44, pull)];
        const bx = lerp(70, 112, pull);
        segs[1].setAttribute("d", `M70 116 C ${bx.toFixed(2)} 116 ${hOut[0]} ${hOut[1].toFixed(2)} 150 75`);
        segs[2].setAttribute("d", `M150 75 C ${hIn[0]} ${hIn[1].toFixed(2)} ${bx.toFixed(2)} 34 70 34`);
        const lines = 1 - ramp(t, 4.7, 5.2);
        const drawn = [ramp(t, 1.2, 1.3, "lin"), t >= 1.95 ? 1 : 0, ramp(t, 3.72, 3.85, "lin")];
        segs.forEach((s, i) => { s.style.strokeDashoffset = (1 - drawn[i]).toFixed(3); s.style.opacity = lines.toFixed(3); });
        anchors.forEach((a, i) => {
          const k = EASE.back(clamp((t - [.7, 1.25, 1.95][i]) / .28));
          a.style.opacity = (clamp(k) * lines).toFixed(3); a.style.transform = `scale(${Math.max(0, k).toFixed(3)})`;
          a.classList.toggle("is-sel", (i === 2 && inside(t, 1.95, 3.6)) || (i === 0 && inside(t, 3.55, 4.6)));
        });
        // rubber band from the last anchor to the pen while it moves
        const pen = [cur.x / sc, cur.y / sc];
        let rb = "";
        if (inside(t, .75, 1.25)) rb = `M70 34 L${pen[0]} ${pen[1]}`;
        else if (inside(t, 1.3, 1.95)) rb = `M70 116 L${pen[0]} ${pen[1]}`;
        else if (inside(t, 3.25, 3.72)) rb = `M150 75 C ${hIn[0]} ${hIn[1]} ${pen[0] + 30} ${pen[1]} ${pen[0]} ${pen[1]}`;
        rub.setAttribute("d", rb || "M0 0");
        rub.style.opacity = rb ? 1 : 0;
        set(hl1, { x1: 150, y1: 75, x2: hOut[0], y2: hOut[1] }); set(hl2, { x1: 150, y1: 75, x2: hIn[0], y2: hIn[1] });
        set(hd1, { cx: hOut[0], cy: hOut[1] }); set(hd2, { cx: hIn[0], cy: hIn[1] });
        hdl.style.opacity = (t > 2.4 ? 1 : 0) * clamp(1 - ramp(t, 3.9, 4.4));
        close.style.opacity = inside(t, 3.45, 3.95) ? 1 : 0;
        keys.style.opacity = (.15 + .85 * clamp(ramp(t, 0, .8) - ramp(t, 4.6, 5.4) * .8 - ramp(t, 10.6, 11.2) * .2)).toFixed(3);
        // fill floods out from the closing click
        flood.setAttribute("r", (ramp(t, 3.85, 4.9, "out") * 175).toFixed(2));
        fill.style.opacity = (1 - ramp(t, 10.5, 11.2)).toFixed(3);
        // shrink the mark to the left and try it at icon sizes
        const sh = ramp(t, 5.7, 6.7) - ramp(t, 10.0, 10.8);
        mark.style.transform = `translate(${(-sh * 46).toFixed(2)}px, 0) scale(${(1 - sh * .36).toFixed(4)})`;
        tiles.forEach((el, i) => {
          const k = clamp(ramp(t, 6.2 + i * .14, 6.9 + i * .14, "back") - ramp(t, 9.7 + i * .06, 10.2 + i * .06), 0, 1.2);
          el.style.opacity = clamp(k * 1.5).toFixed(3);
          el.style.transform = `translateY(${((1 - k) * 18).toFixed(2)}px) scale(${(.7 + .3 * k).toFixed(3)})`;
        });
        note.style.opacity = clamp(ramp(t, 6.9, 7.4) - ramp(t, 9.6, 10)).toFixed(3);
        sizes.classList.toggle("is-ring", inside(t, 7.6, 9.4));
        const rest = [124, 138];
        cur.update(t, [
          [0, u(rest)], [.6, u(A), "io"], [.7, u(A)], [1.15, u(B), "io"], [1.25, u(B)], [1.85, u(C), "io"], [1.95, u(C)], [2.4, u(C)],
          [3.25, u(hOut), "out"], [3.65, u([70.6, 34.6]), "io"], [3.75, u(A)], [4.7, u(rest), "io"], [DUR, u(rest)]
        ], [.7, 1.25, 1.95, 3.75], [[2.4, 3.25]]);
        cur.el.style.opacity = (1 - ramp(t, 4.3, 4.8) + ramp(t, 11.1, 11.5)).toFixed(3);
      },
      play() {
        const svg = q(".ax-g-svg");
        mark.style.display = "none";
        keys.style.opacity = .55;
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "ax-g-user");
        g.innerHTML = `<path class="ax-g-fill" fill="url(#g${id})"/><path class="ax-g-line"/><path class="ax-g-rub"/>` +
          `<g class="ax-g-hdl"><line/><line/><circle r="2.3"/><circle r="2.3"/></g><g class="ax-g-pts"></g>`;
        svg.appendChild(g);
        const uFill = g.querySelector(".ax-g-fill"), uLine = g.querySelector(".ax-g-line"), uRub = g.querySelector(".ax-g-rub"), uPts = g.querySelector(".ax-g-pts");
        const uHdl = g.querySelector(".ax-g-hdl"), [l1, l2] = uHdl.querySelectorAll("line"), [c1, c2] = uHdl.querySelectorAll("circle");
        const pts = [];
        let held = null, hover = null, closed = false;
        const f = n => n.toFixed(2);
        const seg = (a, b) => ` C${f(a.x + a.hx)} ${f(a.y + a.hy)} ${f(b.x - b.hx)} ${f(b.y - b.hy)} ${f(b.x)} ${f(b.y)}`;
        const pathD = close => {
          if (!pts.length) return "";
          let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
          for (let i = 1; i < pts.length; i++) d += seg(pts[i - 1], pts[i]);
          return close ? d + seg(pts[pts.length - 1], pts[0]) + " Z" : d;
        };
        const svgPt = e => { const [x, y] = local(e, S); return { x: x / sc, y: y / sc }; };
        const nearFirst = p => pts.length > 2 && Math.hypot(p.x - pts[0].x, p.y - pts[0].y) < 6;
        const draw = () => {
          uLine.setAttribute("d", pathD(closed) || "M0 0");
          uPts.innerHTML = pts.map((p, i) => `<rect x="${f(p.x - 2.8)}" y="${f(p.y - 2.8)}" width="5.6" height="5.6"${i === 0 && hover && nearFirst(hover) ? ' class="is-sel"' : ""}/>`).join("");
          const last = held || pts[pts.length - 1];
          const show = last && !closed && Math.hypot(last.hx, last.hy) > 1;
          uHdl.style.opacity = show ? 1 : 0;
          if (show) {
            const a = [last.x + last.hx, last.y + last.hy], b = [last.x - last.hx, last.y - last.hy];
            [[l1, a], [l2, b]].forEach(([l, h]) => { l.setAttribute("x1", f(last.x)); l.setAttribute("y1", f(last.y)); l.setAttribute("x2", f(h[0])); l.setAttribute("y2", f(h[1])); });
            [[c1, a], [c2, b]].forEach(([c, h]) => { c.setAttribute("cx", f(h[0])); c.setAttribute("cy", f(h[1])); });
          }
          const end = pts[pts.length - 1];
          const rubber = end && hover && !held && !closed;
          uRub.style.opacity = rubber ? 1 : 0;
          if (rubber) uRub.setAttribute("d", `M${f(end.x)} ${f(end.y)} C${f(end.x + end.hx)} ${f(end.y + end.hy)} ${f(hover.x)} ${f(hover.y)} ${f(hover.x)} ${f(hover.y)}`);
        };
        const finish = () => {
          closed = true;
          const d = pathD(true);
          uFill.setAttribute("d", d);
          g.classList.add("is-closed");
          draw();
          // move the mark to the left and try it at icon sizes
          const b = uFill.getBBox(), L = { x: 12, y: 22, w: 82, h: 106 };
          const k = Math.min(L.w / b.width, L.h / b.height, 1.6);
          const tx = L.x + (L.w - b.width * k) / 2 - b.x * k, ty = L.y + (L.h - b.height * k) / 2 - b.y * k;
          tween(700, e => { const z = EASE.io(e); g.style.transform = `translate(${f(tx * z)}px, ${f(ty * z)}px) scale(${f(1 + (k - 1) * z)})`; });
          const pad = Math.max(b.width, b.height) * .14, side = Math.max(b.width, b.height) + pad * 2;
          const vb = `${f(b.x + b.width / 2 - side / 2)} ${f(b.y + b.height / 2 - side / 2)} ${f(side)} ${f(side)}`;
          tiles.forEach((el, i) => {
            el.querySelector("svg").setAttribute("viewBox", vb);
            el.querySelector("path").setAttribute("d", d);
            el.querySelector("path").removeAttribute("fill-rule");
            tween(600, e => { const z = clamp(EASE.back(clamp(e * 1.6 - i * .25)), 0, 1.2); el.style.opacity = clamp(z * 1.5); el.style.transform = `translateY(${f((1 - z) * 18)}px) scale(${f(.7 + .3 * z)})`; });
          });
          tween(500, e => { note.style.opacity = e; });
          toast(S, "Your mark, tested at 64, 32 and 16px.");
        };
        grab(svg, (e, phase) => {
          if (closed) return;
          const p = svgPt(e);
          hover = p;
          if (phase === "down") {
            if (nearFirst(p)) { finish(); return; }
            if (pts.length >= 24) return;
            held = { x: p.x, y: p.y, hx: 0, hy: 0 };
            pts.push(held);
          } else if (held) {
            held.hx = p.x - held.x; held.hy = p.y - held.y;
            if (Math.hypot(held.hx, held.hy) < 2) held.hx = held.hy = 0;
            if (phase === "up") held = null;
          }
          draw();
        });
        svg.addEventListener("pointermove", e => { if (!held && !closed) { hover = svgPt(e); draw(); } });
        svg.addEventListener("pointerleave", () => { if (!held) { hover = null; draw(); } });
        return {
          render() {},
          // the PNG: the visitor's mark, big and centred on white
          snap() {
            if (!closed) return null;
            const b = uFill.getBBox(), c = document.createElement("canvas");
            c.width = 1600; c.height = 1200;
            const x = c.getContext("2d");
            x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
            const k = Math.min(900 / b.width, 720 / b.height);
            x.translate(800 - (b.x + b.width / 2) * k, 600 - (b.y + b.height / 2) * k);
            x.scale(k, k);
            const gr = x.createLinearGradient(b.x, b.y, b.x + b.width, b.y + b.height);
            gr.addColorStop(0, "#5b9bff"); gr.addColorStop(.55, "#1f7aff"); gr.addColorStop(1, "#1450e6");
            x.fillStyle = gr;
            x.fill(new Path2D(pathD(true)));
            return c;
          }
        };
      }
    };
  }

  /* =====================================================================
     06 MOCKUPS — open the smart object, pick a new brand colour, save:
     the hoodie updates (a different colour every loop)
     ===================================================================== */
  function mockups(S) {
    const src = "previews/md/hoodie-mockup-one.webp", fall = "previews/hoodie-mockup-one.jpg";
    const img = cls => `<img class="${cls}" src="${src}" onerror="this.onerror=null;this.src='${fall}'" alt="" decoding="async">`;
    const mark = `<svg viewBox="58 24 104 102"><path d="${MARK}" fill="#fff" fill-rule="evenodd"/></svg>`;
    S.innerHTML = `
      <div class="ax-m-photo">${img("l0")}${img("l1")}${img("l2")}<i class="ax-m-sweep"></i><span class="ax-m-sel"></span></div>
      <div class="ax-panel ax-m-layers">
        <span class="ax-lbl">Layers</span>
        <span class="ax-m-row is-so"><i class="ax-m-th">${mark}</i><span>Print</span><em>Smart Object</em></span>
        <span class="ax-m-row"><i class="ax-m-th sh"></i><span>Shadows</span></span>
        <span class="ax-m-row"><i class="ax-m-th ph"></i><span>Hoodie</span></span>
      </div>
      <div class="ax-panel ax-m-props"><span class="ax-lbl">Brand colour</span><span class="ax-m-hex"><i></i><em></em></span></div>
      ${appWin("ax-m-psb", "Print.psb", `
        <div class="ax-m-art">${mark}<b data-no-i18n>Draft Studio</b></div>
        <div class="ax-m-foot"><span class="ax-m-sw"><i></i><i></i><i></i></span><span class="ax-m-save">Save</span></div>`)}`;
    const q = s => S.querySelector(s), qa = s => [...S.querySelectorAll(s)];
    const [, l1, l2] = qa(".ax-m-photo img"), sweep = q(".ax-m-sweep"), sel = q(".ax-m-sel"), props = q(".ax-m-props");
    const psb = q(".ax-m-psb"), art = q(".ax-m-art"), row = q(".is-so"), th = q(".is-so .ax-m-th"), save = q(".ax-m-save"), sws = qa(".ax-m-sw i");
    const hexDot = q(".ax-m-hex i"), hexTxt = q(".ax-m-hex em");
    const cur = cursor(S);
    const DUR = 11;
    const BASE = 228;                       // the hoodie's blue
    const ROTS = [0, 150, -78, 47];         // blue → orange → green → violet → blue
    const col = r => hsl(BASE + r, 78, 56);
    // the recoloured layers are masked to the blue fabric and print (assets/academy/hoodie-blue-mask.webp)
    let loop = 0, lastT = 0, m = null;
    return {
      dur: DUR,
      measure(W, H) { m = { row: mid(box(row, S)), sws: sws.map(s => mid(box(s, S))), save: mid(box(save, S)), rest: [W * .8, H * .94] }; },
      update(t) {
        if (t < lastT - 1) loop++;
        lastT = t;
        const prev = ROTS[loop % ROTS.length], next = ROTS[(loop + 1) % ROTS.length];
        const pick = loop % 3;
        const opts = [next, next + 120, next - 100];   // the picked swatch is the next colour
        sws.forEach((s, i) => { s.style.background = col(opts[(i - pick + 3) % 3]); s.classList.toggle("is-on", i === pick && t > 2.75); });
        l1.style.filter = `hue-rotate(${prev}deg)`;
        l2.style.filter = `hue-rotate(${next}deg)`;
        const wipe = ramp(t, 4.75, 6.1);
        l2.style.clipPath = `inset(0 0 ${(100 - wipe * 100).toFixed(2)}% 0)`;
        l2.style.visibility = wipe > 0 ? "visible" : "hidden";
        sweep.style.top = (wipe * 100).toFixed(2) + "%";
        sweep.style.opacity = wipe > 0 && wipe < 1 ? 1 : 0;
        const now = t > 2.75 ? col(next) : col(prev);
        art.style.background = now;
        th.style.background = now;
        const live = wipe > .5 ? next : prev;
        hexDot.style.background = col(live);
        setText(hexTxt, hex(BASE + live, 78, 56));
        props.classList.toggle("is-flash", inside(t, 5.2, 6.0));
        const pop = clamp(EASE.spring(clamp((t - 1.4) / .8)) - EASE.in(clamp((t - 4.0) / .4)));
        psb.style.opacity = clamp(pop * 1.4).toFixed(3);
        psb.style.transform = `scale(${(.7 + pop * .3).toFixed(4)})`;
        psb.style.visibility = pop > .01 ? "visible" : "hidden";
        save.classList.toggle("is-down", inside(t, 3.65, 4.0));
        row.classList.toggle("is-sel", inside(t, .95, 4.4));
        sel.classList.toggle("is-on", inside(t, .95, 4.4));
        cur.update(t, [
          [0, m.rest], [.85, m.row, "io"], [1.25, m.row], [2.55, m.sws[pick], "io"], [2.75, m.sws[pick]],
          [3.45, m.save, "io"], [3.7, m.save], [4.6, m.rest, "io"], [DUR, m.rest]
        ], [.95, 1.18, 2.75, 3.7]);
      },
      play() {
        S.classList.add("is-edit");
        Object.assign(psb.style, { visibility: "visible", opacity: 1, transform: "none" });
        const OPTS = [0, 150, -78, 47, 110, -40];   // blue, orange, green, violet, pink, teal
        const box6 = q(".ax-m-sw");
        box6.innerHTML = OPTS.map(r => `<i style="background:${col(r)}"></i>`).join("");
        const picks = [...box6.children];
        let rot = 0, pick = 0, busy = false;
        l1.style.filter = "hue-rotate(0deg)"; l2.style.visibility = "hidden";
        const show = r => { art.style.background = col(r); th.style.background = col(r); };
        const readout = r => { hexDot.style.background = col(r); setText(hexTxt, hex(BASE + r, 78, 56)); };
        picks.forEach((el, i) => tap(el, () => { pick = OPTS[i]; picks.forEach(o => o.classList.toggle("is-on", o === el)); show(pick); }));
        picks[0].classList.add("is-on");
        tap(save, () => {
          if (busy) return;
          if (pick === rot) { toast(S, "Pick a new colour first."); return; }
          busy = true;
          save.classList.add("is-down"); setTimeout(() => save.classList.remove("is-down"), 180);
          l1.style.filter = `hue-rotate(${rot}deg)`; l2.style.filter = `hue-rotate(${pick}deg)`;
          l2.style.visibility = "visible";
          tween(1300, k => {
            const w = EASE.io(k);
            l2.style.clipPath = `inset(0 0 ${(100 - w * 100).toFixed(2)}% 0)`;
            sweep.style.top = (w * 100).toFixed(2) + "%";
            sweep.style.opacity = k < 1 ? 1 : 0;
          }, () => {
            rot = pick;
            l1.style.filter = `hue-rotate(${rot}deg)`; l2.style.visibility = "hidden";
            readout(rot);
            props.classList.add("is-flash"); setTimeout(() => props.classList.remove("is-flash"), 800);
            toast(S, "Saved. The mockup updated.");
            busy = false;
          });
        });
        show(0); readout(0);
        return { art: q(".ax-m-photo"), render() {} };
      }
    };
  }

  /* ---------- Snapshot: draws a scene's artwork into a canvas for the PNG download ----------
     Covers what the artwork uses: background colours and linear gradients, rounded
     corners, overflow clipping, opacity, CSS filters, polygon and inset clip-paths,
     masked images (object-fit: cover) and text. Pseudo-elements and SVG are skipped. */
  async function snapshot(root, scale = 3) {
    const R = root.getBoundingClientRect();
    const cv = document.createElement("canvas");
    cv.width = Math.round(R.width * scale); cv.height = Math.round(R.height * scale);
    const ctx = cv.getContext("2d");
    ctx.scale(scale, scale);
    const cache = {};
    const load = src => cache[src] || (cache[src] = new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }));
    const split = str => { const out = []; let depth = 0, cur = ""; for (const ch of str) { if (ch === "(") depth++; if (ch === ")") depth--; if (ch === "," && !depth) { out.push(cur.trim()); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
    const len = (v, ref) => (String(v).endsWith("%") ? parseFloat(v) / 100 * ref : parseFloat(v) || 0);
    const filterOf = f => (!f || f === "none" ? "none" : f.replace(/blur\(([\d.]+)px\)/g, (_, n) => `blur(${n * scale}px)`));
    const gradient = (css, x, y, w, h) => {
      const m = /^linear-gradient\((.*)\)$/.exec(css);
      if (!m) return null;
      const parts = split(m[1]);
      let ang = 180;
      if (/deg$/.test(parts[0])) ang = parseFloat(parts.shift());
      else if (/^to /.test(parts[0])) ang = { "to top": 0, "to right": 90, "to bottom": 180, "to left": 270 }[parts.shift()] ?? 180;
      const a = ang * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), L = Math.abs(w * dx) + Math.abs(h * dy), cx = x + w / 2, cy = y + h / 2;
      const g = ctx.createLinearGradient(cx - dx * L / 2, cy - dy * L / 2, cx + dx * L / 2, cy + dy * L / 2);
      parts.forEach((p, i) => {
        const mm = /^(.*\)|\S+)\s*([\d.]+%)?$/.exec(p);
        const pos = mm && mm[2] ? parseFloat(mm[2]) / 100 : i / Math.max(1, parts.length - 1);
        try { g.addColorStop(clamp(pos), mm ? mm[1] : p); } catch (e) { /* colour the canvas can't read */ }
      });
      return g;
    };
    function text(node, cs) {
      const str = node.textContent;
      if (!str.trim()) return;
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      ctx.fillStyle = cs.color;
      if ("letterSpacing" in ctx) ctx.letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      ctx.textBaseline = "middle";
      const range = document.createRange(), re = /\S+/g;
      let m;
      while ((m = re.exec(str))) {
        range.setStart(node, m.index); range.setEnd(node, m.index + m[0].length);
        const r = range.getClientRects()[0];
        if (r) ctx.fillText(m[0], r.left - R.left, r.top - R.top + r.height / 2);
      }
    }
    async function image(el, cs, x, y, w, h) {
      const img = await load(el.currentSrc || el.src);
      if (!img) return;
      const k = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * k, ih = img.naturalHeight * k;
      const ox = (w - iw) / 2, oy = (h - ih) / 2;
      const mask = /url\("?(.*?)"?\)/.exec(cs.maskImage || cs.webkitMaskImage || "");
      if (!mask) { ctx.drawImage(img, x + ox, y + oy, iw, ih); return; }
      const mimg = await load(mask[1]);
      if (!mimg) return;
      const off = document.createElement("canvas");
      off.width = Math.round(w * scale); off.height = Math.round(h * scale);
      const o = off.getContext("2d");
      o.scale(scale, scale);
      o.filter = filterOf(cs.filter);
      o.drawImage(img, ox, oy, iw, ih);
      o.filter = "none";
      o.globalCompositeOperation = "destination-in";
      o.drawImage(mimg, 0, 0, w, h);
      const f = ctx.filter;
      ctx.filter = "none"; ctx.drawImage(off, x, y, w, h); ctx.filter = f;
    }
    async function draw(el, alpha) {
      if (el.nodeType !== 1 || el instanceof SVGElement) return;
      const cs = getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden") return;
      const a = alpha * parseFloat(cs.opacity);
      if (a < .01) return;
      const r = el.getBoundingClientRect(), x = r.left - R.left, y = r.top - R.top, w = r.width, h = r.height;
      const rv = cs.borderTopLeftRadius, rad = rv.endsWith("%") ? Math.min(w, h) * parseFloat(rv) / 100 : Math.min(parseFloat(rv) || 0, w / 2, h / 2);
      const shape = () => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad); else ctx.rect(x, y, w, h); };
      ctx.save();
      ctx.globalAlpha = a;
      const clip = /^(polygon|inset)\((.*)\)$/.exec(cs.clipPath || "");
      if (clip) {
        ctx.beginPath();
        if (clip[1] === "polygon") split(clip[2]).forEach((p, i) => { const [px, py] = p.split(/\s+/); ctx[i ? "lineTo" : "moveTo"](x + len(px, w), y + len(py, h)); });
        else { const v = clip[2].split(/\s+/), t = v[0], rr = v[1] ?? t, b = v[2] ?? t, l = v[3] ?? rr; ctx.rect(x + len(l, w), y + len(t, h), w - len(l, w) - len(rr, w), h - len(t, h) - len(b, h)); }
        ctx.clip();
      }
      if (el.tagName !== "IMG") ctx.filter = filterOf(cs.filter);
      const bg = cs.backgroundColor;
      if (bg && bg !== "transparent" && !/,\s*0\)$/.test(bg)) { shape(); ctx.fillStyle = bg; ctx.fill(); }
      const g = gradient(cs.backgroundImage, x, y, w, h);
      if (g) { shape(); ctx.fillStyle = g; ctx.fill(); }
      if (el.tagName === "IMG") { ctx.filter = cs.maskImage === "none" && !cs.webkitMaskImage?.startsWith("url") ? filterOf(cs.filter) : "none"; await image(el, cs, x, y, w, h); }
      if (cs.overflow !== "visible") { shape(); ctx.clip(); }
      for (const n of el.childNodes) {
        if (n.nodeType === 3) text(n, cs);
        else await draw(n, a);
      }
      ctx.restore();
    }
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await draw(root, 1);
    return cv;
  }

  window.DSScenes = { colour, type, layout, hierarchy, logos, mockups, snapshot };
})();
