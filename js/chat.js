/* =====================================================================
   DRAFTY — the Draft Studio chat assistant
   A chat bubble on every page. Answers come from one of two brains:
   • the AI server (worker/), when DS.site.chatEndpoint is set and awake
   • a built-in brain that answers from the site's own data otherwise,
     so the chat always works, even with no server or after the AI's
     free daily allowance runs out.
   Answers can carry rich cards: files, icons, palettes and links. The AI
   asks for them with tokens like [[file:dore-logo]] in its reply.
   site.js calls window.DSChat(kit) with the shared helpers.
   ===================================================================== */
window.DSChat = function (kit) {
  const { $, $$, esc, icon, items, DS, itemUrl, formatsOf, fmtBadge, waLink, mailLink, FORMATS, APPS, LANG } = kit;
  const KEY = "ds-chat";
  const NAME = "Drafty";
  const endpoint = (DS.site && DS.site.chatEndpoint) || "";
  const palettes = DS.palettes || [];

  /* ---------- Built-in brain ---------- */
  const fold = s => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
  const has = (q, words) => words.some(w => q.includes(w));
  const KW = {
    hello: ["hi", "hello", "hey", "yo", "bonjour", "salut", "hola", "ola", "مرحبا", "السلام", "你好", "嗨"],
    thanks: ["thank", "thx", "cheers", "merci", "gracias", "obrigad", "شكرا", "谢谢"],
    human: ["human", "person", "someone", "whatsapp", "contact", "talk to", "email", "support", "humain", "humano", "persona", "pessoa", "تواصل", "بشري", "人工", "联系"],
    request: ["request", "custom", "commission", "make me", "design for me", "can you make", "demande", "sur mesure", "encargo", "a medida", "pedido", "طلب", "تصميم خاص", "定制"],
    license: ["licen", "commercial", "sell", "resell", "credit", "attribution", "allowed", "legal", "client", "comercial", "vend", "ترخيص", "تجاري", "许可", "商用", "商业", "版权"],
    price: ["free", "price", "cost", "pay", "how much", "gratuit", "gratis", "prix", "precio", "preco", "مجان", "سعر", "免费", "价格", "多少钱"],
    qr: ["qr"],
    palette: ["palette", "colour", "color", "paleta", "couleur", "cores", "لون", "ألوان", "配色", "颜色", "调色"],
    icon: ["icon", "icone", "icono", "أيقون", "图标"],
    open: ["open", "what is", "which app", "what app", "edit", "ouvr", "abr", "edit", "يفت", "فتح", "تعديل", "打开", "编辑", "什么是"]
  };
  const CAT_WORDS = {
    Mockups: ["mockup", "maquette", "maqueta", "موك", "样机"],
    Logos: ["logo", "شعار", "标志"],
    Vectors: ["vector", "vecteur", "vetor", "فيكتور", "矢量"],
    Templates: ["template", "modele", "plantilla", "قالب", "قوالب", "模板"]
  };
  const STOP = new Set(("a an the i im i'm me my you your we our for of to in on with and or is are do does have has any some can could show find get give need want looking look please file files design designs free " +
    "how much what which where when why who this that it its be was were will would about from at by as if so very just also not no yes too all more one ones got " +
    "un une le la les des de du en et pour avec je tu vous il est sont ai avez une el los las por para con o yo tienes tiene hay um uma os as em ao e eu voce tem").split(" "));

  const searchItems = q => {
    const words = q.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 1 && !STOP.has(w));
    const cats = Object.keys(CAT_WORDS).filter(c => has(q, CAT_WORDS[c]));
    const rest = words.filter(w => !Object.values(CAT_WORDS).flat().some(c => w.startsWith(c)));
    const pool = cats.length ? items.filter(it => cats.includes(it.category)) : items;
    const hits = pool.filter(it => {
      const hay = fold([it.title, it.category, (it.tags || []).join(" "), formatsOf(it).join(" "), it.description].join(" "));
      return rest.some(w => hay.includes(w));
    });
    // "show me logos" (or "un logo"): the whole category when nothing narrows it
    return hits.length || !cats.length ? hits : pool;
  };

  function localAnswer(raw) {
    const q = fold(raw).trim();
    const say = (text, blocks = []) => ({ text: [].concat(text), blocks });
    if (!q) return greeting();
    const short = q.split(/\s+/).length <= 3;
    if (short && has(q, KW.hello) && !has(q, KW.qr)) return greeting();
    if (short && has(q, KW.thanks)) return say("You're welcome. Anything else I can help with?");
    if (has(q, KW.human)) return say("Happy to connect you with a person. We usually reply within a few hours.", [{ type: "contact" }]);
    if (has(q, KW.request)) return say("We make custom designs too. Tell us what you need on WhatsApp.", [{ type: "contact" }]);

    // Formats: "what opens a PSD?", "what is an EPS file"
    const f = FORMATS.find(x => new RegExp(`(^|[^a-z])\\.?${x.ext.toLowerCase()}([^a-z]|$)`).test(q));
    if (f && (has(q, KW.open) || q.split(/\s+/).length <= 2)) {
      return say([f.desc], [{ type: "apps", ext: f.ext }, { type: "links", keys: ["learn"] }]);
    }
    if (has(q, KW.license)) return say(["Yes, you can.", DS.site.license, "Exclusive logos are the exception: they're sold once, with full rights to the buyer."], [{ type: "links", keys: ["license"] }]);
    if (has(q, KW.price) && !Object.values(CAT_WORDS).flat().some(c => q.includes(c))) return say(["Everything marked Free costs nothing. No sign-up, no watermark.", "Exclusive logos are the exception: they're sold once, with full rights to the buyer."], [{ type: "links", keys: ["browse"] }]);
    if (has(q, KW.qr)) return say("QR Code Studio lets you design a QR code dot by dot, add your logo, and download it. Every design is scan-checked live.", [{ type: "links", keys: ["qr"] }]);
    if (has(q, KW.palette)) {
      const pick = palettes.filter(p => q.includes(fold(p.mood)) || q.includes(fold(p.name)));
      return say("Here are some palettes you can copy as CSS or download as PNG:", [{ type: "palettes", list: (pick.length ? pick : palettes).slice(0, 3).map(p => palettes.indexOf(p)) }, { type: "links", keys: ["palettes"] }]);
    }
    if (has(q, KW.icon)) {
      const words = q.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2 && !STOP.has(w) && !KW.icon.some(k => w.startsWith(k)));
      let ics = DS.icons.filter(i => words.some(w => fold([i.name, i.group, i.tags.join(" ")].join(" ")).includes(w)));
      if (!ics.length) ics = DS.icons.slice(0, 12);
      return say("Here are some icons. Open one to recolour it and download SVG or PNG:", [{ type: "icons", ids: ics.slice(0, 12).map(i => i.id) }, { type: "links", keys: ["icons"] }]);
    }
    const found = searchItems(q);
    if (found.length) return say("Here's what I found:", [{ type: "files", ids: found.slice(0, 4).map(i => i.id) }, ...(found.length > 4 ? [{ type: "links", keys: ["browse"] }] : [])]);
    return say(["Nothing matched that yet.", "Try other words, browse everything, or ask us to make it."], [{ type: "links", keys: ["browse"] }, { type: "contact" }]);
  }
  const greeting = () => ({ text: [`Hi, I'm ${NAME}.`, "I can find files, explain file formats and answer license questions. What are you working on?"], blocks: [] });

  /* ---------- AI brain (optional) ---------- */
  const TOKEN = /\[\[(file|icon|palette|link):([^\]]+)\]\]/g;
  const fromAI = reply => {
    const files = [], ics = [], pals = [], links = [];
    const text = String(reply || "").replace(TOKEN, (_, kind, val) => {
      val = val.trim();
      if (kind === "file" && items.some(i => i.id === val)) files.push(val);
      if (kind === "icon" && DS.icons.some(i => i.id === val)) ics.push(val);
      if (kind === "palette") { const n = palettes.findIndex(p => fold(p.name) === fold(val)); if (n > -1) pals.push(n); }
      if (kind === "link" && LINKS[val]) links.push(val);
      return "";
    }).replace(/[ \t]+\n/g, "\n").trim();
    const blocks = [];
    if (files.length) blocks.push({ type: "files", ids: [...new Set(files)].slice(0, 4) });
    if (ics.length) blocks.push({ type: "icons", ids: [...new Set(ics)].slice(0, 12) });
    if (pals.length) blocks.push({ type: "palettes", list: [...new Set(pals)].slice(0, 3) });
    if (links.length) blocks.push({ type: "links", keys: [...new Set(links)].slice(0, 3) });
    return { text: text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean), blocks, ai: true };
  };
  async function aiAnswer(history) {
    const res = await fetch(endpoint, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang: LANG, messages: history.slice(-10).map(m => ({ role: m.role === "bot" ? "assistant" : "user", content: m.raw || m.text.join("\n\n") })) })
    });
    if (!res.ok) throw new Error(res.status);
    const j = await res.json();
    if (!j.reply) throw new Error("empty");
    return fromAI(j.reply);
  }

  /* ---------- Rich blocks ---------- */
  const LINKS = {
    browse: ["browse.html", "Browse all files", "grid"],
    icons: ["icons.html", "Open the icon set", "smile"],
    palettes: ["palettes.html", "Explore palettes", "palette"],
    qr: ["qr.html", "Open QR Code Studio", "ui-qr"],
    license: ["license.html", "Read the license", "file"],
    learn: ["learn.html", "Learn about formats", "lightbulb"],
    mockups: ["browse.html?cat=mockups", "Browse mockups", "t-shirt"],
    logos: ["browse.html?cat=logos", "Browse logos", "pen-tool"]
  };
  const block = b => {
    if (b.type === "files") return `<div class="ch-files">${b.ids.map(id => items.find(i => i.id === id)).filter(Boolean).map(it => `
      <a class="ch-file" href="${itemUrl(it)}">
        <span class="ch-thumb"><img src="${esc(it.preview)}" alt="" loading="lazy"></span>
        <span class="ch-file-t"><b>${esc(it.title)}</b><small>${esc(it.category)} · ${formatsOf(it).join(", ")}</small></span>
        ${icon("chevron-right")}
      </a>`).join("")}</div>`;
    if (b.type === "icons") return `<div class="ch-icons">${b.ids.map(id => `<a href="icons.html#${id}" data-tip="${esc((DS.icons.find(i => i.id === id) || {}).name || id)}">${icon(id)}</a>`).join("")}</div>`;
    if (b.type === "palettes") return `<div class="ch-pals">${b.list.map(n => palettes[n]).filter(Boolean).map(p => `
      <a class="ch-pal" href="palettes.html"><span class="ch-sw">${p.colors.map(c => `<i style="background:${c}"></i>`).join("")}</span><small><b data-no-i18n>${esc(p.name)}</b> · ${esc(p.mood)}</small></a>`).join("")}</div>`;
    if (b.type === "apps") { const f = FORMATS.find(x => x.ext === b.ext); return f ? `<p class="ch-apps"><span>Opens in</span>${f.apps.map(a => `<b>${esc(APPS[a].name)}</b>${APPS[a].free ? ` <em>Free</em>` : ""}`).join(", ")}</p>` : ""; }
    if (b.type === "links") return `<div class="ch-links">${b.keys.filter(k => LINKS[k]).map(k => `<a href="${LINKS[k][0]}">${icon(LINKS[k][2])}<span>${LINKS[k][1]}</span></a>`).join("")}</div>`;
    if (b.type === "contact") return `<div class="ch-links"><a href="${waLink("Hi Draft Studio, ")}" target="_blank" rel="noopener">${icon("chat")}<span>WhatsApp</span></a><a href="${mailLink("Hello Draft Studio")}">${icon("mail")}<span>Email</span></a></div>`;
    return "";
  };
  const para = s => `<p>${esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>`;

  /* ---------- Conversation ---------- */
  let msgs = [];
  try { msgs = JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch (e) {} };

  const CHIPS = ["Find a mockup", "Show me logos", "Can I use files commercially?", "Make a QR code", "What opens a PSD file?"];

  const el = document.createElement("div");
  el.className = "ch";
  el.innerHTML = `
    <button class="ch-fab" type="button" aria-label="Ask ${NAME}" aria-expanded="false" aria-controls="ch-panel">
      <span class="ch-fab-i ch-fab-chat">${icon("chat")}</span><span class="ch-fab-i ch-fab-x">${icon("close")}</span><i class="ch-dot"></i>
    </button>
    <span class="ch-hello" aria-hidden="true">Ask ${NAME}</span>
    <section class="ch-panel" id="ch-panel" role="dialog" aria-label="${NAME}, Draft Studio assistant" hidden>
      <header class="ch-head">
        <span class="ch-av ch-av-lg" aria-hidden="true">D</span>
        <span class="ch-who"><b data-no-i18n>${NAME}</b><small><i></i><span>Draft Studio assistant</span></small></span>
        <button class="ch-hbtn" type="button" data-ch-new aria-label="New chat" data-tip="New chat">${icon("refresh")}</button>
        <button class="ch-hbtn" type="button" data-ch-close aria-label="Close chat">${icon("close")}</button>
      </header>
      <div class="ch-log" data-ch-log aria-live="polite"></div>
      <div class="ch-chips" data-ch-chips>${CHIPS.map(c => `<button type="button" data-q="${c}">${c}</button>`).join("")}</div>
      <form class="ch-form" data-ch-form>
        <label class="sr-only" for="ch-input">Message</label>
        <textarea id="ch-input" rows="1" placeholder="Ask anything…" maxlength="600"></textarea>
        <button class="ch-send" type="submit" aria-label="Send">${icon("send")}</button>
      </form>
      <p class="ch-note">${endpoint ? "AI answers can be wrong." : "Quick answers from the Draft Studio site."} <a href="${waLink("Hi Draft Studio, ")}" target="_blank" rel="noopener">Talk to a human</a></p>
    </section>`;
  document.body.appendChild(el);

  const fab = $(".ch-fab", el), panel = $(".ch-panel", el), log = $("[data-ch-log]", el), chips = $("[data-ch-chips]", el);
  const form = $("[data-ch-form]", el), input = $("textarea", el), hello = $(".ch-hello", el);

  const bubble = m => m.role === "user"
    ? `<div class="ch-msg ch-me"><div class="ch-body">${para(m.text[0])}</div></div>`
    : `<div class="ch-msg ch-bot"><span class="ch-av" aria-hidden="true">D</span><div class="ch-body">${m.text.map(para).join("")}${(m.blocks || []).map(block).join("")}</div></div>`;
  const draw = () => {
    const all = msgs.length ? msgs : [Object.assign({ role: "bot" }, greeting())];
    log.innerHTML = all.map(bubble).join("");
    chips.hidden = msgs.some(m => m.role === "user");
    panel.classList.toggle("is-fresh", !chips.hidden);
    log.scrollTop = log.scrollHeight;
  };
  const typing = on => {
    const t = $(".ch-typing", log);
    if (on && !t) { log.insertAdjacentHTML("beforeend", `<div class="ch-msg ch-bot ch-typing"><span class="ch-av" aria-hidden="true">D</span><div class="ch-body"><span class="ch-dots"><i></i><i></i><i></i></span></div></div>`); log.scrollTop = log.scrollHeight; }
    if (!on && t) t.remove();
  };

  let busy = false;
  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    msgs.push({ role: "user", text: [text] });
    draw(); typing(true);
    let ans;
    const t0 = performance.now();
    if (endpoint) {
      try { ans = await aiAnswer(msgs); }
      catch (e) { ans = localAnswer(text); }
    } else ans = localAnswer(text);
    // A short beat so instant answers still feel like a reply
    const wait = Math.max(0, 550 - (performance.now() - t0));
    setTimeout(() => {
      typing(false);
      msgs.push(Object.assign({ role: "bot" }, ans));
      save(); draw();
      busy = false;
    }, wait);
  }

  /* ---------- Open, close, type ---------- */
  const open = on => {
    if (on === !panel.hidden) return;
    clearTimeout(panel._t);
    if (on) {
      panel.hidden = false;
      requestAnimationFrame(() => el.classList.add("is-open"));
      draw();
      try { localStorage.setItem("ds-chat-seen", "1"); } catch (e) {}
      el.classList.add("is-seen");
      setTimeout(() => input.focus({ preventScroll: true }), 200);
    } else {
      el.classList.remove("is-open");
      panel._t = setTimeout(() => { panel.hidden = true; }, 300);
      fab.focus({ preventScroll: true });
    }
    fab.setAttribute("aria-expanded", on);
    document.documentElement.classList.toggle("ch-lock", on && innerWidth <= 640);
  };
  try { if (localStorage.getItem("ds-chat-seen")) el.classList.add("is-seen"); } catch (e) {}
  // First visit: say hello once the visitor scrolls a little, then tuck it away
  if (!el.classList.contains("is-seen")) {
    const hi = () => {
      if (scrollY < 300) return;
      removeEventListener("scroll", hi);
      el.classList.add("is-hello");
      setTimeout(() => el.classList.remove("is-hello"), 7000);
    };
    addEventListener("scroll", hi, { passive: true });
  }

  fab.addEventListener("click", () => open(panel.hidden));
  hello.addEventListener("click", () => open(true));
  $("[data-ch-close]", el).addEventListener("click", () => open(false));
  $("[data-ch-new]", el).addEventListener("click", () => { msgs = []; save(); draw(); input.focus(); });
  // Chips send their English wording; the bubble still shows in the visitor's language
  chips.addEventListener("click", e => { const b = e.target.closest("button"); if (b) ask(b.dataset.q); });
  form.addEventListener("submit", e => { e.preventDefault(); const v = input.value; input.value = ""; grow(); ask(v); });
  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; };
  input.addEventListener("input", grow);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) open(false); });
  // Links inside answers close the chat on phones so the page is visible
  log.addEventListener("click", e => { if (e.target.closest("a") && innerWidth <= 640) open(false); });
};
