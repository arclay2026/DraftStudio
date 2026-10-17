# Draft Studio

Free design files: **PSD mockups**, **vectors**, **logos in AI & SVG**, **design templates**
and a **free icon set**. A plain static site with no build step and no database. It runs on
GitHub Pages or any web host.

## Pages

| Page | What it does |
|------|--------------|
| `index.html` | Home: hero with a tilting "light table" of the latest previews, category shelves, fresh drops, a format guide, the icon wall, the license in plain words and a request call-to-action |
| `browse.html` | Every file, with category tabs, format filters, search and sort. Links like `browse.html?cat=logos` or `browse.html?q=hoodie` open pre-filtered |
| `item.html?id=…` | One design: large zoomable preview, specs, downloads (or a WhatsApp buy button for paid logos), share and related designs |
| `icons.html` | The icon set: search, filter, recolour, download SVG/PNG or copy the code |
| `license.html` | License and FAQ |

Everywhere: press `/` to search, and use the sun/moon button to switch light or dark mode.

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

- **Colours:** lime `#86de4e` (the brand colour), ink `#0c0c0b`, paper `#f4f3ef`, plus one colour
  per file format (PSD blue, AI orange, SVG green, PDF coral, EPS yellow).
- **Fonts:** Bricolage Grotesque (headlines), Geist (text), Geist Mono (labels), from Google Fonts.
- **Contact details and license text:** the `site` block at the top of `js/data.js`.
- **Logo:** `assets/logo.svg` (light mode), `assets/logo-dark.svg` (dark mode), `assets/favicon.svg`.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Publishing

`.github/workflows/pages.yml` publishes the site on every push to `main`. One-time setup on GitHub:
**Settings → Pages → Build and deployment → Source: GitHub Actions**.
