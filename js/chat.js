/* =====================================================================
   DRAFTY — the Drafty Labs chat assistant
   A chat bubble on every page. Answers come from one of two brains:
   • the AI server (worker/), when DS.site.chatEndpoint is set and awake
   • a built-in brain that answers from the site's own data otherwise,
     so the chat always works, even with no server or after the AI's
     free daily allowance runs out.
   Answers can carry rich cards: files, palettes and links. The AI
   asks for them with tokens like [[file:mato-logo]] in its reply.
   site.js calls window.DSChat(kit) with the shared helpers.
   ===================================================================== */
window.DSChat = function (kit) {
  // Drafty's avatar: the official mark, white on the dark tile (black in dark mode, where the tile is light)
  // Drafty's face (assets/drafty.svg): the chat button and every message from Drafty
  const AV_MARK = '<img class="ch-drafty" src="assets/drafty.svg?v=d4" alt="">';
  // the chat button is Drafty himself, drawn inline so his eyes can follow the pointer
  // Drafty: a glossy marbled ball. Bands of five colours are swirled into veins by a fixed swirl field and turn
  // slowly underneath it, so the veins keep flowing. Lit like a real sphere: soft light top left, shaded edge, rim light.
  const DRAFTY_BALL = `<svg class="dr-ball" viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="drb-shade" cx=".4" cy=".34" r=".68"><stop offset=".45" stop-color="#140828" stop-opacity="0"/><stop offset="1" stop-color="#140828" stop-opacity=".58"/></radialGradient><radialGradient id="drb-light" cx=".3" cy=".24" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".6" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><radialGradient id="drb-rim" cx=".5" cy=".42" r=".6"><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset=".95" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="drb-rimfade" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient><mask id="drb-rm"><rect width="100" height="100" fill="url(#drb-rimfade)"/></mask><clipPath id="drb-clip"><circle cx="50" cy="50" r="49"/></clipPath><filter id="drb-vein" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".028" numOctaves="3" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="58" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation=".7"/></filter></defs>
    <g class="dr-body"><g clip-path="url(#drb-clip)"><circle cx="50" cy="50" r="49" fill="#7a5cff"/><g filter="url(#drb-vein)"><g class="dr-marble"><rect x="-40" y="-40" width="10.5" height="180" fill="#ff8a1a"/><rect x="-30" y="-40" width="10.5" height="180" fill="#ffd53d"/><rect x="-20" y="-40" width="10.5" height="180" fill="#1fc8e8"/><rect x="-10" y="-40" width="10.5" height="180" fill="#7a5cff"/><rect x="0" y="-40" width="10.5" height="180" fill="#ff3d8b"/><rect x="10" y="-40" width="10.5" height="180" fill="#ff8a1a"/><rect x="20" y="-40" width="10.5" height="180" fill="#ffd53d"/><rect x="30" y="-40" width="10.5" height="180" fill="#1fc8e8"/><rect x="40" y="-40" width="10.5" height="180" fill="#7a5cff"/><rect x="50" y="-40" width="10.5" height="180" fill="#ff3d8b"/><rect x="60" y="-40" width="10.5" height="180" fill="#ff8a1a"/><rect x="70" y="-40" width="10.5" height="180" fill="#ffd53d"/><rect x="80" y="-40" width="10.5" height="180" fill="#1fc8e8"/><rect x="90" y="-40" width="10.5" height="180" fill="#7a5cff"/><rect x="100" y="-40" width="10.5" height="180" fill="#ff3d8b"/><rect x="110" y="-40" width="10.5" height="180" fill="#ff8a1a"/><rect x="120" y="-40" width="10.5" height="180" fill="#ffd53d"/><rect x="130" y="-40" width="10.5" height="180" fill="#1fc8e8"/><rect x="140" y="-40" width="10.5" height="180" fill="#7a5cff"/></g></g></g><circle cx="50" cy="50" r="49" fill="url(#drb-shade)"/><circle cx="50" cy="50" r="49" fill="url(#drb-light)"/><circle cx="50" cy="50" r="49" fill="url(#drb-rim)" mask="url(#drb-rm)"/>
    <g class="dr-face"><g><rect class="dr-eye" x="35" y="33" width="10" height="24" rx="5" fill="#111114"/><rect class="dr-eye" x="55" y="33" width="10" height="24" rx="5" fill="#111114"/><circle cx="38.2" cy="37.4" r="1.7" fill="#fff" opacity=".9"/><circle cx="58.2" cy="37.4" r="1.7" fill="#fff" opacity=".9"/></g></g></g></svg>`;
  const { $, $$, esc, icon, imgSrc, items, DS, itemUrl, formatsOf, fmtBadge, waLink, mailLink, FORMATS, APPS, LANG } = kit;
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
    barcode: ["barcode", "bar code", "ean-13", "ean13", "ean-8", "upc-a", "upc code", "code 128", "code128", "code 39", "itf-14", "code-barre", "codigo de barras", "código de barras", "باركود", "条形码", "条码"],
    palette: ["palette", "colour", "color", "paleta", "couleur", "cores", "لون", "ألوان", "配色", "颜色", "调色"],
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

  // Everyday questions about the site. Each topic: trigger phrases, then the reply.
  const TOPICS = [
    { k: ["site about", "this site", "this website", "what is draft studio", "what's draft studio", "whats draft studio", "what is drafty labs", "what's drafty labs", "whats drafty labs", "drafty labs", "what is this", "what's this", "whats this", "what do you do", "what do you offer", "what do you have", "tell me about", "about you", "about the site", "about draft studio",
          "propos", "ce site", "quoi ce", "que es", "de que trata", "este sitio", "esta web", "este site", "esse site", "o que e", "sobre o site", "عن الموقع", "ما هو", "这个网站", "是什么网站", "关于"],
      a: () => ({ text: ["Drafty Labs is a library of free design files: PSD mockups, editable logos, vectors and templates.", "There are free tools too: a palette generator and QR Code Studio for custom QR codes. No sign-up, no watermark."],
        blocks: [{ type: "links", keys: ["browse", "palettes", "qr"] }] }) },
    { weak: true, k: ["what can you do", "how can you help", "who are you", "what are you", "help me", "can you help", "que peux-tu", "que puedes", "o que voce faz", "ماذا تستطيع", "你能做什么", "你是谁"],
      a: () => ({ text: [`I'm ${NAME}, the Drafty Labs assistant. I can find files and palettes, tell you which app opens a file, and answer license questions.`, "Try asking “show me logos” or “can I use this for a client?”"], blocks: [] }) },
    { k: ["who made", "who owns", "who runs", "who created", "who is behind", "who are the", "qui a cree", "quien hizo", "quem fez", "من صنع", "谁做的"],
      a: () => ({ text: ["Drafty Labs is made by a small design team.", "You can reach them directly on WhatsApp or email."], blocks: [{ type: "contact" }] }) },
    { k: ["sign up", "signup", "account", "register", "login", "log in", "inscription", "cuenta", "registr", "conta", "cadastro", "حساب", "تسجيل", "注册", "账号", "登录"],
      a: () => ({ text: ["No account needed. Open any file and press Download. That's it."], blocks: [] }) },
    { k: ["watermark", "filigrane", "marca de agua", "marca d", "علامة مائية", "水印"],
      a: () => ({ text: ["No watermarks, ever. You get the clean, full-quality file."], blocks: [] }) },
    { k: ["how do i download", "how to download", "how can i download", "where do i download", "can't download", "cant download", "download not", "telecharger", "descargar", "baixar", "تنزيل", "下载"],
      a: () => ({ text: ["Open a file, pick the format you want in the dropdown, then press the blue Download button. “Download all” gets every format at once.", "Big PSDs open in Google Drive: press Download there."], blocks: [{ type: "links", keys: ["browse"] }] }) },
    { k: ["no photoshop", "without photoshop", "don't have photoshop", "dont have photoshop", "free photoshop", "photopea", "sans photoshop", "pas photoshop", "pas de photoshop", "sin photoshop", "no tengo photoshop", "sem photoshop", "nao tenho photoshop", "بدون فوتوشوب", "没有 photoshop", "没有photoshop"],
      a: () => ({ text: ["No Photoshop? Use Photopea. It's free and runs in your browser, and it opens our PSD mockups with smart objects."], blocks: [{ type: "links", keys: ["learn"] }] }) },
    { k: ["smart object", "use a mockup", "use the mockup", "use mockup", "how do mockups", "how does a mockup", "put my design", "add my logo", "utiliser un mockup", "usar un mockup", "usar o mockup", "استخدام الموك", "怎么用样机", "如何使用样机"],
      a: () => ({ text: ["Open the PSD, double-click the smart object layer, paste your design, save, and close it. The mockup updates with realistic folds and lighting."], blocks: [{ type: "apps", ext: "PSD" }, { type: "links", keys: ["mockups"] }] }) },
    { weak: true, k: ["new", "latest", "recent", "nouveau", "nuevo", "novo", "جديد", "最新"],
      a: () => ({ text: ["Here are the latest drops:"], blocks: [{ type: "files", ids: items.slice(0, 4).map(i => i.id) }, { type: "links", keys: ["browse"] }] }) },
    { k: ["how many", "combien", "cuantos", "quantos", "كم عدد", "多少个"],
      a: () => ({ text: [`Right now there are ${items.length} designs and ${palettes.length} palettes, and new drops land regularly.`], blocks: [{ type: "links", keys: ["browse"] }] }) },
    { k: ["dark mode", "light mode", "language", "text size", "setting", "mode sombre", "modo oscuro", "modo escuro", "idioma", "langue", "الوضع الداكن", "اللغة", "深色", "语言", "设置"],
      a: () => ({ text: ["Open Settings at the bottom of the side menu. You can switch the theme (Light, Dark or Device), the language and the text size there."], blocks: [] }) },
    { weak: true, k: ["format", "file type", "which file", "difference between", "formats", "tipo de archivo", "صيغ", "格式"],
      a: () => ({ text: ["Quick guide: PSD for mockups (Photoshop or Photopea), AI for editing logos, SVG for web and Canva, PDF for print, PNG for posting right away."], blocks: [{ type: "links", keys: ["learn"] }] }) },
    { k: ["bug", "broken", "not working", "doesn't work", "doesnt work", "error", "problem", "issue", "ne marche", "no funciona", "nao funciona", "لا يعمل", "不能用", "坏了"],
      a: () => ({ text: ["Sorry about that. Tell the team what happened and they'll fix it quickly."], blocks: [{ type: "contact" }] }) },
    { k: ["bye", "goodbye", "see you", "later", "au revoir", "adios", "tchau", "مع السلامة", "再见"],
      a: () => ({ text: ["Bye! Come back anytime, there's always something new."], blocks: [] }) },
    { k: ["how are you", "how's it going", "hows it going", "ca va", "que tal", "tudo bem", "كيف حالك", "你好吗"],
      a: () => ({ text: ["All good, thanks for asking! What are you designing today?"], blocks: [] }) }
  ];
  const topic = q => TOPICS.find(t => t.k.some(k => k.length <= 3 && /^[a-z]+$/.test(k) ? new RegExp(`(^|[^\\p{L}])${k}([^\\p{L}]|$)`, "u").test(q) : q.includes(k)));

  function localAnswer(raw) {
    const q = fold(raw).trim();
    const say = (text, blocks = []) => ({ text: [].concat(text), blocks });
    if (!q) return greeting();
    const short = q.split(/\s+/).length <= 3;
    const words = q.split(/[^\p{L}\p{N}]+/u);
    if (short && KW.hello.some(h => words.includes(h) || (!/[a-z]/.test(h) && q.includes(h))) && !topic(q)) return greeting();
    if (short && has(q, KW.thanks)) return say("You're welcome. Anything else I can help with?");
    if (has(q, KW.human)) return say("Happy to connect you with a person. We usually reply within a few hours.", [{ type: "contact" }]);
    if (has(q, KW.request)) return say("We make custom designs too. Tell us what you need on WhatsApp.", [{ type: "contact" }]);
    const t = topic(q);
    if (t && !(t.weak && searchItems(q).length)) return t.a();

    // Formats: "what opens a PSD?", "what is an EPS file"
    const f = FORMATS.find(x => new RegExp(`(^|[^a-z])\\.?${x.ext.toLowerCase()}([^a-z]|$)`).test(q));
    if (f && (has(q, KW.open) || q.split(/\s+/).length <= 2)) {
      return say([f.desc], [{ type: "apps", ext: f.ext }, { type: "links", keys: ["learn"] }]);
    }
    if (has(q, KW.license)) return say(["Yes, you can.", DS.site.license, "Exclusive logos are the exception: they're sold once, with full rights to the buyer."], [{ type: "links", keys: ["license"] }]);
    // "how much for a logo?": say what each matching design costs
    if (has(q, KW.price) && searchItems(q).length) {
      const found = searchItems(q);
      const free = found.filter(it => !it.price), paid = found.filter(it => it.price && !it.sold);
      const lines = [];
      if (free.length) lines.push(`${free.map(it => it.title.split(" — ")[0]).join(" and ")} ${free.length > 1 ? "are" : "is"} free to download. No sign-up, no watermark.`);
      if (paid.length) lines.push(...paid.map(it => `${it.title.split(" — ")[0]} is exclusive: ${it.priceFrom ? "from " : ""}${it.price}, sold once, with full rights to the buyer. You buy it on WhatsApp.`));
      if (!lines.length) lines.push("Everything marked Free costs nothing. No sign-up, no watermark.");
      return say(lines, [{ type: "files", ids: found.slice(0, 4).map(i => i.id) }]);
    }
    if (has(q, KW.price)) return say(["Everything marked Free costs nothing. No sign-up, no watermark.", "Exclusive logos are the exception: they're sold once, with full rights to the buyer."], [{ type: "links", keys: ["browse"] }]);
    if (has(q, KW.barcode)) return say("Barcode Studio makes EAN-13, UPC-A, EAN-8, Code 128, Code 39 and ITF-14 barcodes. It adds the check digit for you and scan-checks every design live. For shop products, the number itself must be registered with GS1.", [{ type: "links", keys: ["barcode"] }]);
    if (has(q, KW.qr)) return say("QR Code Studio lets you design a QR code dot by dot, add your logo, and download it. Every design is scan-checked live.", [{ type: "links", keys: ["qr"] }]);
    if (has(q, KW.palette)) {
      const pick = palettes.filter(p => q.includes(fold(p.mood)) || q.includes(fold(p.name)));
      return say("Here are some palettes you can copy as CSS or download as PNG:", [{ type: "palettes", list: (pick.length ? pick : palettes).slice(0, 3).map(p => palettes.indexOf(p)) }, { type: "links", keys: ["palettes"] }]);
    }
    const empty = Object.keys(CAT_WORDS).find(c => has(q, CAT_WORDS[c]) && !items.some(it => it.category === c));
    if (empty) return say([`No ${empty.toLowerCase()} yet. They're on the way.`, "Want something specific? Ask the team and they can design it for you."], [{ type: "links", keys: ["browse"] }, { type: "contact" }]);
    const found = searchItems(q);
    if (found.length) return say(found.length === 1 ? "Found one for you:" : "Here's what I found:", [{ type: "files", ids: found.slice(0, 4).map(i => i.id) }, ...(found.length > 4 ? [{ type: "links", keys: ["browse"] }] : [])]);
    return say(["Hmm, I'm not sure about that one.", "I'm best at finding files and palettes, explaining file formats and answering license questions. You can also ask the team directly."], [{ type: "links", keys: ["browse"] }, { type: "contact" }]);
  }
  const greeting = () => ({ text: [`Hi, I'm ${NAME}.`, "I can find files, explain file formats and answer license questions. What are you working on?"], blocks: [] });

  /* ---------- AI brain (optional) ---------- */
  const TOKEN = /\[\[(file|icon|palette|link):([^\]]+)\]\]/g;
  const fromAI = reply => {
    const files = [], pals = [], links = [];
    const text = String(reply || "").replace(TOKEN, (_, kind, val) => {
      val = val.trim();
      if (kind === "file" && items.some(i => i.id === val)) files.push(val);
      if (kind === "palette") { const n = palettes.findIndex(p => fold(p.name) === fold(val)); if (n > -1) pals.push(n); }
      if (kind === "link" && LINKS[val]) links.push(val);
      return "";
    }).replace(/[ \t]+\n/g, "\n").trim();
    const blocks = [];
    if (files.length) blocks.push({ type: "files", ids: [...new Set(files)].slice(0, 4) });
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
    palettes: ["palettes.html", "Explore palettes", "palette"],
    qr: ["qr.html", "Open QR Code Studio", "ui-qr"],
    barcode: ["barcode.html", "Open Barcode Studio", "ui-barcode"],
    license: ["license.html", "Read the license", "file"],
    learn: ["learn.html", "Learn about formats", "lightbulb"],
    mockups: ["browse.html?cat=mockups", "Browse mockups", "t-shirt"],
    logos: ["browse.html?cat=logos", "Browse logos", "pen-tool"]
  };
  const block = b => {
    if (b.type === "files") return `<div class="ch-files">${b.ids.map(id => items.find(i => i.id === id)).filter(Boolean).map(it => `
      <a class="ch-file" href="${itemUrl(it)}">
        <span class="ch-thumb"><img ${imgSrc(it.preview, "sm")} alt="" loading="lazy"></span>
        <span class="ch-file-t"><b>${esc(it.title)}</b><small>${esc(it.category)} · ${formatsOf(it).join(", ")}</small></span>
        <em class="ch-price${it.price ? " is-paid" : ""}">${it.price ? (it.sold ? "Sold" : (it.priceFrom ? "From " : "") + esc(it.price)) : "Free"}</em>
        ${icon("chevron-right")}
      </a>`).join("")}</div>`;
    if (b.type === "palettes") return `<div class="ch-pals">${b.list.map(n => palettes[n]).filter(Boolean).map(p => `
      <a class="ch-pal" href="palettes.html"><span class="ch-sw">${p.colors.map(c => `<i style="background:${c}"></i>`).join("")}</span><small><b data-no-i18n>${esc(p.name)}</b> · ${esc(p.mood)}</small></a>`).join("")}</div>`;
    if (b.type === "apps") { const f = FORMATS.find(x => x.ext === b.ext); return f ? `<p class="ch-apps"><span>Opens in</span>${f.apps.map(a => `<b>${esc(APPS[a].name)}</b>${APPS[a].free ? ` <em>Free</em>` : ""}`).join(", ")}</p>` : ""; }
    if (b.type === "links") return `<div class="ch-links">${b.keys.filter(k => LINKS[k]).map(k => `<a href="${LINKS[k][0]}">${icon(LINKS[k][2])}<span>${LINKS[k][1]}</span></a>`).join("")}</div>`;
    if (b.type === "contact") return `<div class="ch-links"><a href="${waLink("Hi Drafty Labs, ")}" target="_blank" rel="noopener"><span class="wa-ic" aria-hidden="true"></span><span>WhatsApp</span></a><a href="${mailLink("Hello Drafty Labs")}">${icon("mail")}<span>Email</span></a></div>`;
    return "";
  };
  const para = s => `<p>${esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>")}</p>`;

  /* ---------- Conversation ---------- */
  let msgs = [];
  try { msgs = JSON.parse(sessionStorage.getItem(KEY)) || []; } catch (e) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch (e) {} };

  const CHIPS = ["Show me around", "Find a mockup", "Show me logos", "Can I use files commercially?", "Make a QR code", "What opens a PSD file?"];

  const el = document.createElement("div");
  el.className = "ch";
  el.innerHTML = `
    <button class="ch-fab" type="button" aria-label="Ask ${NAME}" aria-expanded="false" aria-controls="ch-panel">
      <span class="ch-fab-i ch-fab-chat">${DRAFTY_BALL}</span><span class="ch-fab-i ch-fab-x">${icon("close")}</span><i class="ch-dot"></i>
    </button>
    <span class="ch-hello" aria-hidden="true">Ask ${NAME}</span>
    <section class="ch-panel" id="ch-panel" role="dialog" aria-label="${NAME}, Drafty Labs assistant" hidden>
      <header class="ch-head">
        <span class="ch-av ch-av-lg" aria-hidden="true">${AV_MARK}</span>
        <span class="ch-who"><b data-no-i18n>${NAME}</b><small><i></i><span>Drafty Labs assistant</span></small></span>
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
      <p class="ch-note">${endpoint ? "AI answers can be wrong." : "Quick answers from the Drafty Labs site."} <a href="${waLink("Hi Drafty Labs, ")}" target="_blank" rel="noopener">Talk to a human</a></p>
    </section>`;
  document.body.appendChild(el);

  const fab = $(".ch-fab", el), panel = $(".ch-panel", el), log = $("[data-ch-log]", el), chips = $("[data-ch-chips]", el);
  const form = $("[data-ch-form]", el), input = $("textarea", el), hello = $(".ch-hello", el);

  const bubble = m => m.role === "user"
    ? `<div class="ch-msg ch-me"><div class="ch-body">${para(m.text[0])}</div></div>`
    : `<div class="ch-msg ch-bot"><span class="ch-av" aria-hidden="true">${AV_MARK}</span><div class="ch-body">${m.text.map(para).join("")}${(m.blocks || []).map(block).join("")}</div></div>`;
  const draw = () => {
    const all = msgs.length ? msgs : [Object.assign({ role: "bot" }, greeting())];
    log.innerHTML = all.map(bubble).join("");
    chips.hidden = msgs.some(m => m.role === "user");
    panel.classList.toggle("is-fresh", !chips.hidden);
    log.scrollTop = log.scrollHeight;
  };
  const typing = on => {
    const t = $(".ch-typing", log);
    if (on && !t) { log.insertAdjacentHTML("beforeend", `<div class="ch-msg ch-bot ch-typing"><span class="ch-av" aria-hidden="true">${AV_MARK}</span><div class="ch-body"><span class="ch-dots"><i></i><i></i><i></i></span></div></div>`); log.scrollTop = log.scrollHeight; }
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
      document.dispatchEvent(new Event("ds-chat-open"));
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
  // Drafty is alive: his eyes follow the pointer, and when the pointer rests he looks around on his own, glancing here and there
  {
    const face = $(".dr-face", fab), calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const GLANCES = [[-8, -8], [8, -6], [-9, 2], [6, 6], [0, -9], [-5, -9], [9, -1], [-7, 7], [3, -8]];
    let tx = -6, ty = -7, x = tx, y = ty, raf = 0, idle = 0, glance = 0, last = -1;
    const draw = () => { face.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`); };
    const tick = () => { x += (tx - x) * .22; y += (ty - y) * .22; draw(); raf = Math.abs(tx - x) + Math.abs(ty - y) > .05 ? requestAnimationFrame(tick) : 0; };
    const look = (nx, ny) => { tx = nx; ty = ny; if (!raf) raf = requestAnimationFrame(tick); };
    // on his own: a glance somewhere new every second or three, sometimes a quick double look
    const wander = () => {
      let k; do k = Math.floor(Math.random() * GLANCES.length); while (k === last); last = k;
      look(...GLANCES[k]);
      glance = setTimeout(wander, Math.random() < .2 ? 450 : 1300 + Math.random() * 2200);
    };
    draw();
    if (!calm) {
      glance = setTimeout(wander, 1200);
      addEventListener("pointermove", e => {
        clearTimeout(glance); clearTimeout(idle);
        const r = fab.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
        look(dx / d * 9 * k, dy / d * 9 * k);
        idle = setTimeout(wander, 2200);
      }, { passive: true });
      document.addEventListener("visibilitychange", () => { clearTimeout(glance); if (!document.hidden) glance = setTimeout(wander, 800); });
    }
  }
  hello.addEventListener("click", () => open(true));
  $("[data-ch-close]", el).addEventListener("click", () => open(false));
  $("[data-ch-new]", el).addEventListener("click", () => { msgs = []; save(); draw(); input.focus(); });
  // Chips send their English wording; the bubble still shows in the visitor's language
  chips.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; if (b.dataset.q === "Show me around") { open(false); tour(true); } else ask(b.dataset.q); });
  form.addEventListener("submit", e => { e.preventDefault(); const v = input.value; input.value = ""; grow(); ask(v); });
  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; };
  input.addEventListener("input", grow);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) open(false); });
  // Links inside answers close the chat on phones so the page is visible
  log.addEventListener("click", e => { if (e.target.closest("a") && innerWidth <= 640) open(false); });

  /* ---------- The tour: Drafty shows first-time visitors around ----------
     A dimmed page with a spotlight that glides from part to part, and Drafty beside a speech bubble,
     looking at what he's showing. It starts by itself on a visitor's first page (once), and from the
     "Show me around" chip any time after. Steps whose part isn't on screen (the side menu on phones)
     are skipped. Esc or "Skip" ends it; arrow keys step through. */
  function tour(force) {
    const SEEN = "ds-tour";
    try { if (!force && localStorage.getItem(SEEN)) return; } catch (e) {}
    if (document.querySelector(".tr") || /canvas\.html/.test(location.pathname)) return;
    const mac = /Mac|iPhone|iPad/.test(navigator.platform), touch = matchMedia("(pointer: coarse)").matches;
    const STEPS = [
      { t: "Hi, I’m Drafty! 👋", b: "Welcome to <b>Drafty Labs</b>: free design files, pro tools and lessons, all in one place. Can I show you around? It only takes half a minute.", go: "Show me around", no: "Maybe later" },
      { at: ["#side"], t: "This is your map", b: "Files, the studio, tools and help. Everything on the site is one click away from here." },
      { at: [".menu-btn"], t: "This is your map", b: "Tap the menu for files, the studio, tools and help. Everything on the site is right there." },
      { at: ["[data-hsearch]", ".side-search", "[data-open-search]"], t: "Find anything", b: touch ? "Type what you need here: files, tools and pages all show up as you type." : `Type what you need here, or press <kbd>${mac ? "⌘" : "Ctrl"}</kbd> <kbd>K</kbd> on any page to search the whole site.` },
      { at: ["a.side-link[href^='browse.html?cat=mockups']", "a.side-link[href^='browse.html?cat=templates']"], t: "Free files", b: "Mockups, logos, vectors and templates. Free for personal and commercial work, with no sign-up and no watermark." },
      { at: ["a.side-link[href='palettes.html']", "a.side-link[href='canvas.html']"], t: "Pro tools", b: "Design in your browser with <b>Canvas</b>, make QR codes and barcodes that look designed, and pick colour palettes in a click." },
      { at: ["a.side-link[href='websites.html']", "a.side-link[href='pricing.html']"], t: "The studio", b: "Need a website or a logo made just for you? The studio builds them." },
      { at: ["a.side-link[href='learn.html']"], t: "Learn design", b: "Six short, free lessons. Press play and I’ll read them to you, word by word." },
      { at: ["button.set-btn"], t: "Make it yours", b: "Dark mode, six languages and bigger text all live in Settings." },
      { at: [".ch-fab"], t: "I’m always here", b: "Stuck, or looking for something? Tap me and ask anything, any time.", go: "Let’s go!" }];
    // the rectangle a step points at: the union of its elements that are on screen
    const rectOf = step => {
      if (!step.at) return null;
      const rs = step.at.map(s => document.querySelector(s)).filter(Boolean).map(e => e.getBoundingClientRect())
        .filter(r => r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight);
      if (!rs.length) return null;
      const u = { left: Math.min(...rs.map(r => r.left)), top: Math.min(...rs.map(r => r.top)), right: Math.max(...rs.map(r => r.right)), bottom: Math.max(...rs.map(r => r.bottom)) };
      return { x: u.left - 8, y: u.top - 8, w: u.right - u.left + 16, h: u.bottom - u.top + 16 };
    };
    const steps = STEPS.filter((s, k) => !k || rectOf(s));
    const ball = DRAFTY_BALL.replace(/drb-/g, "drt-").replace('class="dr-ball"', 'class="dr-ball tr-ball"');
    const t = document.createElement("div");
    t.className = "tr"; t.setAttribute("role", "dialog"); t.setAttribute("aria-label", "A tour of Drafty Labs");
    t.innerHTML = `<div class="tr-spot"></div><div class="tr-host"><div class="tr-drafty">${ball}</div>
      <div class="tr-card" aria-live="polite"><b class="tr-t"></b><p class="tr-b"></p>
        <div class="tr-foot"><span class="tr-dots">${steps.slice(1).map(() => "<i></i>").join("")}</span>
          <button type="button" class="tr-skip" data-tr-skip>Skip</button><button type="button" class="tr-back" data-tr-back>Back</button><button type="button" class="tr-next btn btn-dark" data-tr-next>Next</button></div></div></div>`;
    document.body.append(t);
    const spot = $(".tr-spot", t), host = $(".tr-host", t), face = $(".dr-face", t);
    let k = 0;
    const end = () => { try { localStorage.setItem(SEEN, "done"); } catch (e) {} t.classList.remove("is-on"); removeEventListener("keydown", keys, true); removeEventListener("resize", show); setTimeout(() => t.remove(), 400); };
    const show = () => {
      // on narrow screens Drafty sits on top of his bubble instead of beside it
      const st = steps[k], r = rectOf(st), W = innerWidth, H = innerHeight, narrow = W < 560, cw = Math.min(360, W - 32), hw = narrow ? cw : cw + 74, hh = narrow ? 290 : 240;
      host.classList.toggle("is-narrow", narrow);
      // the spotlight: on the part, or shrunk to nothing in the middle for the welcome
      Object.assign(spot.style, r ? { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px", borderRadius: "16px" } : { left: W / 2 + "px", top: H / 2 + "px", width: 0, height: 0, borderRadius: "50%" });
      // Drafty and his bubble: beside the part where there's room, else above or below it, else centred
      let x = (W - hw) / 2, y = H / 2 - 110;
      if (r) {
        if (narrow) { if (r.y > H / 2) y = r.y - hh - 10; else y = r.y + r.h + 14; x = (W - hw) / 2; }
        else if (r.x + r.w + 24 + hw < W) { x = r.x + r.w + 24; y = r.y + Math.min(r.h, 220) / 2 - 70; }
        else if (r.x - 24 - hw > 0) { x = r.x - 24 - hw; y = r.y + Math.min(r.h, 220) / 2 - 70; }
        else if (r.y > H / 2) { y = r.y - hh; x = Math.min(Math.max(16, r.x + r.w - hw), W - hw - 16); }
        else { y = r.y + r.h + 20; x = Math.min(Math.max(16, r.x), W - hw - 16); }
      }
      host.style.width = hw + "px";
      host.style.left = Math.round(Math.min(Math.max(16, x), W - hw - 16)) + "px";
      host.style.top = Math.round(Math.min(Math.max(16, y), H - hh - 16)) + "px";
      // he looks at what he's showing (straight at you for the welcome)
      requestAnimationFrame(() => {
        const hb = $(".tr-drafty", t).getBoundingClientRect(), cx = hb.left + hb.width / 2, cy = hb.top + hb.height / 2;
        const tx = r ? r.x + r.w / 2 - cx : 0, ty = r ? r.y + r.h / 2 - cy : 3, d = Math.hypot(tx, ty) || 1;
        face.setAttribute("transform", r ? `translate(${(tx / d * 9).toFixed(1)} ${(ty / d * 9).toFixed(1)})` : "translate(0 3)");
      });
      $(".tr-t", t).textContent = st.t; $(".tr-b", t).innerHTML = st.b;
      $("[data-tr-next]", t).textContent = st.go || (k === steps.length - 1 ? "Done" : "Next");
      $("[data-tr-skip]", t).textContent = st.no || "Skip";
      $("[data-tr-back]", t).hidden = k < 2;
      $(".tr-dots", t).hidden = !k;
      $$(".tr-dots i", t).forEach((d, j) => d.classList.toggle("is-on", j === k - 1));
      host.classList.remove("is-pop"); void host.offsetWidth; host.classList.add("is-pop");
    };
    const step = d => { k += d; if (k >= steps.length) return end(); k = Math.max(0, k); show(); };
    const keys = e => { if (e.key === "Escape") { e.stopPropagation(); end(); } else if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); step(1); } else if (e.key === "ArrowLeft") step(-1); };
    t.addEventListener("click", e => { if (e.target.closest("[data-tr-next]")) step(1); else if (e.target.closest("[data-tr-back]")) step(-1); else if (e.target.closest("[data-tr-skip]")) end(); });
    addEventListener("keydown", keys, true); addEventListener("resize", show);
    show(); requestAnimationFrame(() => t.classList.add("is-on"));
    $("[data-tr-next]", t).focus({ preventScroll: true });
  }
  window.DSTour = () => tour(true);
  // a first visit: Drafty says hello once the page has settled
  setTimeout(() => { if (!document.hidden) tour(false); }, 1600);
};
