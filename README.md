# Draft Studio

Free design files: **PSD mockups**, **vectors**, **logos in AI & SVG**, **design templates**
and a **free icon set**. A plain static site with no build step and no database. It runs on
GitHub Pages or any web host.

## Pages

| Page | What it does |
|------|--------------|
| `index.html` | Home: a grey rounded hero panel with the headline, highlighted keywords, two buttons, a photo card and a dark dot card; then category shelves, fresh drops and the icon wall |
| `browse.html` | Every file, with category tabs, format filters, search and sort. Links like `browse.html?cat=logos` or `browse.html?q=hoodie` open pre-filtered |
| `item.html?id=…` | One design: large zoomable preview, specs, downloads (or a WhatsApp buy button for paid logos), share and related designs |
| `icons.html` | The icon set: search, filter, recolour, download SVG/PNG or copy the code |
| `palettes.html` | Colour palettes: a palette generator (harmonies, locks, base colour, shareable link) and 36 hand-picked palettes, each downloadable as PNG or copyable as CSS. Add palettes in `js/data.js` under `palettes` |
| `qr.html` | QR Code Studio: a QR code designer (8 content types, 10 dot patterns, corner frames and centres, solid or gradient colour, icon or uploaded logo, labels, presets, Surprise me). Every design is scan-checked live with jsQR; downloads as SVG, PNG or JPG. Libraries in `js/vendor/` (qrcode-generator, MIT; jsQR, Apache-2.0) |
| `canvas.html` | Canvas: a free design app laid out like a desktop vector editor. Menu bar (File, Edit, Object, Type, Select, Effect, View, Window, Help) with shortcuts; control bar; toolbox with Selection, Direct Selection (edit anchor points and curve handles), Pen, Pencil, Paintbrush, Type, Line, Rectangle, Rounded Rectangle, Ellipse, Polygon, Star, Rotate, Scale, Eyedropper, Gradient, Artboard, Hand and Zoom; Fill and Stroke swatches; rulers you drag guides from; multiple artboards on a pasteboard; smart guides, grid and snapping; panels for Properties, Layers, Artboards, Swatches and Libraries (12 practice briefs, 6 templates, font pairs, the site's icons, your images). Designs autosave on the visitor's device (IndexedDB) and export as PNG, JPG or SVG (one or all artboards) or as a project file. Nothing is uploaded. Built on Fabric.js (`js/vendor/fabric.min.js`, MIT) in `js/canvas.js` |
| `learn.html` | Learn: **Design Basics**, a free six-lesson beginner course (Colour, Typography, Layout, Hierarchy, Logos, Mockups). Each card plays a live scene (`js/academy-scenes.js`); the lesson view has **Try it yourself**, a hands-on version with a task and a PNG download. Then the file format guide. Lessons live in `js/academy.js` |
| `license.html` | License and FAQ |

Everywhere: press `/` to search (on the home page it jumps to the big search bar).

**Drafty**, the chat bubble in the corner of every page (`js/chat.js`), finds files, icons and palettes, explains formats and answers license questions. On its own it answers from the site's data; connect the free AI server in `worker/` (see `worker/README.md`) and it becomes a real AI assistant.

## Adding a design

1. **Upload the files** on GitHub to a folder in `files/` (e.g. `files/mockups/cap-mockup/`):
   open the folder, *Add file → Upload files*, drag them in, **Commit changes**.
   GitHub takes files up to 25 MB in the browser. For bigger PSDs, upload to Google Drive
   and use the share link as the file path.
2. **Upload a preview image** (JPG or PNG, about 1200px wide) to `previews/`.
3. **Add an entry** at the top of the `items` list in `js/data.js`. The comments at the top of
   that file explain every field; copy an existing entry and change it.

The category shelves, counts, search, filters and "Coming soon" labels all update by themselves.

## Adding an icon

Upload a 24×24 SVG that uses `stroke="currentColor"` to `files/icons/`, add a line for it in the
`icons` list in `js/data.js`, then run `node tools/build-icons.js` to refresh `js/icons.js`.

## Customising the look

All colours, fonts and sizes are tokens at the top of `css/style.css`:

- **Colours:** black and white only — white page, grey panels `#f0f0f0`, brand black `#0f0f0f` for ink,
  buttons and dark panels, with white as the accent on dark surfaces and light grey `#e8e8e8` for soft highlights.
- **Font:** Inter everywhere (with optical sizing), from Google Fonts.
- **Nav links:** the `header` function in `js/site.js`.
- **Contact details and license text:** the `site` block at the top of `js/data.js`.
- **Logo:** `assets/logo.svg`, `assets/favicon.svg`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Publishing

The site is live at https://arclay2026.github.io/DraftStudio/ and is published by GitHub Pages
straight from the `main` branch (Settings → Pages → Deploy from a branch → `main` / root).
Every change to `main` goes live within a minute or two.

## Publishing changes

The pages load `css/style.css` and `js/*.js` with a `?v=` stamp so browsers fetch fresh copies after a change. After editing CSS or JS, run `tools/bump.sh`: it stamps a new version on every `.html` file, writes `version.json` and rebuilds `chat-knowledge.json` (what Drafty's AI knows). GitHub Pages lets browsers keep a page for up to 10 minutes, so each page also checks `version.json` when it opens and reloads itself once if a newer version is live.

## Languages

The site speaks English, French, Spanish, Portuguese, Arabic (right to left) and Chinese. Visitors get their browser's language automatically, or pick one under Settings › Language.

- The markup stays in English. `i18n/<code>.json` maps each English string to its translation (`strings`), plus a few patterns for text with numbers in it (`patterns`).
- `i18n/_source.json` is the list of English strings to translate.
- After editing a translation, run `node tools/build-i18n.js` to rebuild `js/i18n/<code>.js`, then `tools/bump.sh`.
- New English text shows in English until it's added to every `i18n/<code>.json`.

## Google and share previews

`tools/build-seo.js` (run by `tools/bump.sh`) keeps the site findable and good-looking when shared:

- Every page gets a canonical address, language links (`?lang=fr` opens a page in French) and a
  preview card for WhatsApp, X, Facebook and LinkedIn using `assets/og.jpg` (source: `tools/og/`).
- Every design gets its own page, `d/<id>.html`, with its title, description and picture, so shared
  links show that design. The Share button on a file uses this address. Don't edit `d/` by hand.
- `sitemap.xml` lists every page and design. To get on Google faster, add the site in
  **Google Search Console** (search.google.com/search-console, "URL prefix"
  `https://arclay2026.github.io/DraftStudio/`, verify with the HTML-tag method), then submit
  `sitemap.xml` under **Sitemaps**.
- The site's address lives in `js/data.js` as `site.url`; change it there if the site moves.

## Images

`tools/build-images.py` (run by `tools/bump.sh`, needs Python with Pillow) makes lighter WebP copies of
everything in `previews/`: `previews/sm/` (640px, for cards and thumbnails) and `previews/md/` (1400px,
for big previews), plus `js/preview-sizes.js` so pages reserve the right space before pictures load.
Just upload the original JPG/PNG to `previews/`; until the copies exist the site uses the original.

## Visitor stats (GoatCounter)

Free, no cookies and no personal data, so no cookie banner is needed. To switch it on:

1. Sign up at **goatcounter.com** (free) and pick a code, e.g. `draftstudio` (your dashboard is then
   `draftstudio.goatcounter.com`).
2. In `js/data.js` set `goatcounter: "draftstudio"`, run `tools/bump.sh` and publish.

The dashboard shows visits per page, countries, devices and where visitors came from, plus these
actions: `download/<file>` (every file, icon, palette and QR download), `search/<words>`,
`share/<design>`, `contact/whatsapp`, `contact/email` and `chat/open`. Nothing is counted when the
site runs on your own computer (localhost).

