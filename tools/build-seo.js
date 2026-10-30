// Search engines and share previews. Writes, from js/data.js:
//   • the tags between <!-- seo --> and <!-- /seo --> in every page: canonical
//     address, language links, and the preview card WhatsApp, X, Facebook,
//     LinkedIn and others show when someone shares a link
//   • d/<id>.html for every design: the item page with that design's own title,
//     description and picture baked in, since link previews don't run JavaScript
//   • sitemap.xml (submit it in Google Search Console; a project site under
//     github.io can't set robots.txt, which only counts at the domain root)
// tools/bump.sh runs this; run it by hand with: node tools/build-seo.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "js", "data.js"), "utf8"), sandbox);
const DS = sandbox.window.DS;
const SITE = DS.site.url.replace(/\/?$/, "/");
const LANGS = ["en", "fr", "es", "pt", "ar", "zh"];
const SHARE_IMAGE = "assets/og.jpg";  // 1200 × 630, the default preview picture (tools/og/)

const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true }); fs.writeFileSync(path.join(root, f), s); };
const meta = (html, name) => (html.match(new RegExp(`<meta name="${name}" content="([^"]*)"`)) || [])[1] || "";
const title = html => ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "").replace(/&amp;/g, "&");
const formatsOf = it => [...new Set((it.files || []).map(f => f.format.toUpperCase()).filter(f => f !== "ZIP"))];

function seoBlock({ url, title, description, image, imageAlt, type = "website", jsonld }) {
  const t = esc(title), d = esc(description), img = esc(image);
  return [
    "<!-- seo -->",
    `<link rel="canonical" href="${esc(url)}">`,
    ...LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="${esc(url)}${l === "en" ? "" : (url.includes("?") ? "&" : "?") + "lang=" + l}">`),
    `<link rel="alternate" hreflang="x-default" href="${esc(url)}">`,
    `<meta property="og:site_name" content="Draft Studio">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:image" content="${img}">`,
    `<meta property="og:image:alt" content="${esc(imageAlt || title)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    `<meta name="twitter:image" content="${img}">`,
    ...(jsonld ? [`<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>`] : []),
    "<!-- /seo -->"
  ].join("\n  ");
}
const putSeo = (html, block) => {
  if (!/<!-- seo -->[\s\S]*?<!-- \/seo -->/.test(html)) throw new Error("missing <!-- seo --> markers");
  return html.replace(/<!-- seo -->[\s\S]*?<!-- \/seo -->/, block);
};

// ---- Pages
const PAGES = ["index.html", "browse.html", "palettes.html", "qr.html", "barcode.html", "canvas.html", "learn.html", "license.html", "pricing.html", "item.html"];
for (const f of PAGES) {
  const html = read(f);
  const url = SITE + (f === "index.html" ? "" : f);
  const jsonld = f === "index.html" ? {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": SITE + "#site", url: SITE, name: "Draft Studio", inLanguage: LANGS,
        potentialAction: { "@type": "SearchAction", target: SITE + "browse.html?q={search_term_string}", "query-input": "required name=search_term_string" } },
      { "@type": "Organization", "@id": SITE + "#org", name: "Draft Studio", url: SITE, logo: SITE + "assets/logo-mark.svg", email: DS.site.email }
    ]
  } : null;
  write(f, putSeo(html, seoBlock({ url, title: title(html), description: meta(html, "description"), image: SITE + SHARE_IMAGE, jsonld })));
}

// ---- One page per design
const base = read("item.html");
const dir = path.join(root, "d");
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
for (const it of DS.items) {
  const url = `${SITE}d/${encodeURIComponent(it.id)}.html`;
  const fmts = formatsOf(it);
  const t = `${it.title} · ${it.price ? "Exclusive " + it.category.replace(/s$/, "").toLowerCase() : "Free " + fmts.join(", ")} · Draft Studio`;
  const desc = (it.description || "") + (it.price ? "" : " Free download, no sign-up.");
  const image = SITE + it.preview.replace(/^\//, "");
  const jsonld = {
    "@context": "https://schema.org",
    "@type": it.price ? "Product" : "CreativeWork",
    name: it.title, description: it.description, image, url,
    ...(it.date ? { datePublished: it.date } : {}),
    genre: it.category, encodingFormat: fmts,
    ...(it.price
      ? { offers: { "@type": "Offer", price: String(it.price).replace(/[^\d.]/g, ""), priceCurrency: /^R/.test(it.price) ? "ZAR" : "USD", availability: it.sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock", url } }
      : { isAccessibleForFree: true, license: SITE + "license.html" }),
    publisher: { "@id": SITE + "#org" }
  };
  let html = putSeo(base, seoBlock({ url, title: t, description: desc, image, imageAlt: `${it.title} preview`, type: "article", jsonld }));
  html = html
    .replace("<head>", '<head>\n  <base href="../">')  // the page lives in d/, everything else is one level up
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace('<body data-page="item"', `<body data-page="item" data-id="${esc(it.id)}"`)
    .replace("<!doctype html>", `<!doctype html>\n<!-- Generated by tools/build-seo.js from item.html and js/data.js. Don't edit by hand. -->`);
  fs.writeFileSync(path.join(dir, `${it.id}.html`), html);
}

// ---- Sitemap
const today = new Date().toISOString().slice(0, 10);
const latest = DS.items.map(i => i.date).filter(Boolean).sort().pop() || today;
const urls = [
  ...PAGES.filter(f => f !== "item.html").map(f => ({ loc: SITE + (f === "index.html" ? "" : f), mod: f === "index.html" || f === "browse.html" ? latest : today })),
  ...DS.items.map(it => ({ loc: `${SITE}d/${encodeURIComponent(it.id)}.html`, mod: it.date || today, img: SITE + it.preview }))
];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url>
    <loc>${esc(u.loc)}</loc>
    <lastmod>${u.mod}</lastmod>
${LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(u.loc)}${l === "en" ? "" : "?lang=" + l}"/>`).join("\n")}
${u.img ? `    <image:image><image:loc>${esc(u.img)}</image:loc></image:image>\n` : ""}  </url>`).join("\n")}
</urlset>
`);
console.log(`SEO: ${PAGES.length} pages, ${DS.items.length} design pages in d/, sitemap.xml (${urls.length} addresses)`);
