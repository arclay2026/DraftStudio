# Draft Studio

Free design files: **PSD mockups**, **vectors**, **logos in AI & SVG**, **design templates**
and a **free icon set**. A plain static site with no build step and no database. It runs on
GitHub Pages or any web host.

## Pages

| Page | What it does |
|------|--------------|
| `index.html` | Home: a grey rounded hero panel with the headline, highlighted keywords, two buttons, a photo card and a dark dot card; then category shelves, fresh drops, a format guide, the icon wall, the license in plain words and a request call-to-action |
| `browse.html` | Every file, with category tabs, format filters, search and sort. Links like `browse.html?cat=logos` or `browse.html?q=hoodie` open pre-filtered |
| `item.html?id=…` | One design: large zoomable preview, specs, downloads (or a WhatsApp buy button for paid logos), share and related designs |
| `icons.html` | The icon set: search, filter, recolour, download SVG/PNG or copy the code |
| `license.html` | License and FAQ |

Everywhere: press `/` to search (also under **More** in the nav).

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

- **Colours:** white page, grey panels `#f0f0f0`, ink `#0f0f0f`, lime accent `#a3f25d`, pink highlight
  `#f7c6f4`, dark green card `#18201d`, plus one colour per file format (PSD blue, AI orange, SVG green, PDF red, EPS yellow).
- **Font:** Plus Jakarta Sans everywhere, from Google Fonts.
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
