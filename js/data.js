/* =====================================================================
   DRAFT STUDIO — CONTENT
   Everything the site shows comes from this one file. Edit it on GitHub
   (pencil icon), click "Commit changes", and the site updates.

   ADDING A DESIGN
     1. Upload the files to a folder in files/, e.g. files/mockups/cap-mockup/
     2. Upload a preview image (JPG or PNG, about 1200px wide) to previews/
     3. Copy an entry below, paste it at the top of the `items` list,
        and change the details.

   Common mistakes that break the site:
     • a missing comma between two entries  },{
     • a file path that doesn't match the uploaded name exactly
       (names are case-sensitive: "Logo.svg" is not "logo.svg")

   FIELDS
     id           unique, lowercase, no spaces (used in the link)
     title        name shown on the site
     category     "Mockups", "Vectors", "Logos" or "Templates"
     description  one or two sentences
     specs        size or format, e.g. "A4 portrait" or "3456 × 4608 px"
     colors       main colours, for the Colour filter. Pick from the names in
                  `colors` below the items list, e.g. ["blue", "white"]
     orientation  (optional) "horizontal", "vertical", "square" or "panoramic"
                  for the Orientation filter. Leave it out and it's worked out
                  from the first "W × H" in specs.
     letter       (logos, optional) the logo's letter for the Letter filter, e.g. "K".
                  Leave it out and it's taken from "Letter K" in the title.
     type         (logos) the kind of brand it suits, for the Type filter. Pick
                  from `logoTypes` below the items list, e.g. "Tech" or
                  ["Sport", "Tech"]. Leave it out and it shows under "Other".
     requires     (optional) the app needed to open it, e.g. "Adobe Photoshop"
     tags         search words
     preview      path to the preview image
     gallery      (optional) more preview images, e.g. ["previews/cap-2.jpg"];
                  they show as thumbnails under the main preview
     files        one line per download: { format, path, size }
                  Files too big for GitHub can live on Google Drive: use the
                  share link as the path and add name: "file-name.psd".
                  A ZIP file becomes the "Download all" button.
     price        (optional) e.g. "R350" — shows a price and a
                  "Buy on WhatsApp" button instead of downloads
     priceFrom    (with price) true = show it as a starting price, "From R450"
     includes     (with price) the formats the buyer gets
     date         YYYY-MM-DD (newest designs are shown first)
     featured     true = show in the hero and "Fresh drops" first
   ===================================================================== */

window.DS = {
  site: {
    name: "Draft Studio",
    tagline: "Free mockups, vectors, logos and templates for people who make things.",
    // The site's public address, used for share previews and Google (tools/build-seo.js)
    url: "https://arclay2026.github.io/DraftStudio/",
    email: "thedraftstudio.design@gmail.com",
    whatsapp: "27736684875",          // country code + number, no spaces or +
    // Address of the AI chat server (see worker/README.md). Leave empty and
    // Drafty answers from the site's own data instead.
    chatEndpoint: "",
    // Visitor stats with GoatCounter (free, no cookies). Put your GoatCounter
    // code here, e.g. "draftstudio" for draftstudio.goatcounter.com. Empty = off.
    goatcounter: "",
    instagram: "",                    // e.g. "https://instagram.com/draftstudio"
    license:
      "Free for personal and commercial projects. Credit is appreciated but not required. " +
      "You may not resell or redistribute the files as-is."
  },

  items: [
    {
      id: "hoodie-mockup-one",
      title: "Hoodie Mockup — Flat Lay",
      category: "Mockups",
      description: "A two-tone hoodie laid flat on concrete, styled with a branded coffee cup and burger wrapper on a tray. Drop your artwork into the smart object layers.",
      specs: "3456 × 4608 px · portrait",
      requires: "Adobe Photoshop",
      tags: ["hoodie", "sweatshirt", "apparel", "merch", "flat lay", "cup", "packaging", "smart object"],
      preview: "previews/hoodie-mockup-one.jpg",
      files: [
        { format: "PSD", path: "https://drive.google.com/file/d/16XtB5is0IBh-21NNVC92bz6gr_rTmDUT/view?usp=sharing", name: "hoodie-mockup-one.psd" }
      ],
      colors: ["blue", "white", "grey"],
      date: "2026-09-29",
      featured: true
    },
    {
      id: "t-shirt-mockup-one",
      title: "T-Shirt Mockup — Held Up",
      category: "Mockups",
      description: "A ringer T-shirt held up against a clear blue sky. Place your artwork on the chest through the smart object layer.",
      specs: "3328 × 4864 px · portrait",
      requires: "Adobe Photoshop",
      tags: ["t-shirt", "tee", "apparel", "merch", "sky", "smart object"],
      preview: "previews/t-shirt-mockup-one.jpg",
      files: [
        { format: "PSD", path: "https://drive.google.com/file/d/1HXHTuVA8gntAGUeb1la18R-RaDOHxfpo/view?usp=sharing", name: "t-shirt-mockup-one.psd" }
      ],
      colors: ["blue", "white", "light-blue"],
      date: "2026-09-28",
      featured: true
    },
    {
      id: "kaven-logo",
      title: "Kaven — Letter K Logo",
      category: "Logos",
      description: "A sharp, chevron-cut K in burnt orange, paired with a strong uppercase KAVEN wordmark. Built for construction, logistics and outdoor brands. Exclusive: sold once.",
      specs: "Vector · any size (raster 2250 × 2250 px)",
      type: "Construction",
      tags: ["letter k", "lettermark", "monogram", "wordmark", "bold", "uppercase", "orange", "rust", "construction"],
      preview: "previews/kaven-logo.jpg",
      gallery: ["previews/kaven-logo-2.jpg"],
      price: "R250",
      includes: ["AI", "EPS", "SVG", "PDF", "PNG"],
      colors: ["orange", "red", "white"],
      date: "2026-10-26",
      featured: true
    },
    {
      id: "wiltz-logo",
      title: "Wiltz — Letter W Logo",
      category: "Logos",
      description: "A slanted, fast-moving W in electric indigo, paired with a bold italic Wiltz wordmark. Made for sport, motion and tech brands. Exclusive: sold once.",
      specs: "Vector · any size (raster 2250 × 2250 px)",
      type: ["Sport", "Tech"],
      tags: ["letter w", "lettermark", "monogram", "wordmark", "italic", "sport", "speed", "indigo", "blue", "purple"],
      preview: "previews/wiltz-logo.jpg",
      gallery: ["previews/wiltz-logo-2.jpg"],
      price: "R450",
      priceFrom: true,
      includes: ["AI", "EPS", "SVG", "PDF", "PNG"],
      colors: ["blue", "purple", "white"],
      date: "2026-10-25",
      featured: true
    },
    {
      id: "mato-logo",
      title: "Mato — Letter M Logo",
      category: "Logos",
      description: "A bold geometric M in coral red, paired with a crisp Mato wordmark whose t is capped with a matching red square. Exclusive: sold once.",
      specs: "Vector · any size (raster 2250 × 2250 px)",
      type: "Agency",
      tags: ["letter m", "lettermark", "monogram", "wordmark", "geometric", "red"],
      preview: "previews/mato-logo.jpg",
      gallery: ["previews/mato-logo-2.jpg"],
      price: "R450",
      priceFrom: true,
      includes: ["AI", "EPS", "SVG", "PDF", "PNG"],
      colors: ["red", "black", "white"],
      date: "2026-10-25",
      featured: true
    }
  ],

  // CLIENT LOGOS we designed, shown on portfolio.html (newest first). The page
  // joins the side menu as soon as there is at least one.
  //   file      the SVG, saved in assets/work/logos/ (cropped to the artwork, no background)
  //   client, industry   shown when the card is hovered ("Mabs Tech → E-commerce")
  clientLogos: [
    { id: "mabs-tech", client: "Mabs Tech", industry: "E-commerce", file: "assets/work/logos/mabs-tech.svg" },
    { id: "webgraphs", client: "WebGraphs", industry: "Tech", file: "assets/work/logos/webgraphs.svg" },
    { id: "vorne", client: "Vorne", industry: "Clothing", file: "assets/work/logos/vorne.svg" },
    { id: "orbi-crm", client: "Orbi CRM", industry: "CRM software", file: "assets/work/logos/orbi-crm.svg" },
  ],

  // WEBSITES we designed and built, shown as cards on websites.html.
  //   shot   a full-page screenshot, 1200px wide (it scrolls inside the card on hover)
  //   url    the real address; frame is the address loaded in the live preview,
  //          which must allow being framed (GitHub Pages does)
  sites: [
    {
      id: "webgraphs",
      name: "Web Graphs Technologies",
      type: "Business website",
      year: "2026",
      summary: "A fast, multi-page site for a Johannesburg tech and design studio.",
      tags: ["12 pages", "Mobile-first"],
      shot: "assets/sites/webgraphs/index.webp",
      url: "https://webgraphs.co.za",
      frame: "https://arclay2026.github.io/WebGraphs-/"
    }
  ],

  // WEBSITE PACKAGES on pricing.html (prices in rands, once-off).
  //   from: true shows "From" before the price; popular: true highlights the card.
  //   "Get started" opens WhatsApp with the package name filled in.
  webPackages: [
    { name: "Landing Page", price: "R3,500", desc: "One page that gets customers to call, book or message you.",
      items: ["Single-page, mobile-first design", "WhatsApp button and contact form", "Google Maps and opening hours", "Basic SEO setup", "1 month of free changes"] },
    { name: "Business Website", price: "R7,500", popular: true, desc: "A proper home for your business online, built to be found.",
      items: ["Up to 5 pages", "Custom design in your brand", "Contact form, WhatsApp and maps", "Google Business Profile setup", "3 months of support"] },
    { name: "Pro Website", price: "R14,500", desc: "For growing businesses that need bookings, a blog or more pages.",
      items: ["Up to 10 pages", "Booking system or blog", "Speed and SEO optimisation", "Visitor analytics", "3 months of support"] },
    { name: "Online Store", price: "R22,000", from: true, desc: "Sell online with card and instant EFT payments built in.",
      items: ["Up to 50 products to start", "PayFast or Yoco payments", "Delivery and collection options", "Order emails and stock control", "Training and 3 months of support"] }
  ],
  webPackagesNote: "Domain and hosting are not included. We'll help you set them up and quote them separately.",

  // LOGO TYPES for the Type filter on the Logos page
  logoTypes: ["Agency", "Tech", "Sport", "Construction", "Fashion & beauty", "Food & drink", "Finance", "Health", "Other"],

  // COLOURS for the Colour filter on the browse page (name: hex)
  colors: {
    black: "#1f2328", white: "#ffffff", teal: "#4fd9cf", "light-blue": "#92cdf8", blue: "#1673ea", purple: "#8582f0",
    pink: "#ffb8c9", red: "#ff5252", orange: "#ffa024", yellow: "#ffd77a", grey: "#c4c4c4"
  },

  /* ---------- Colour palettes (palettes.html) ----------
     name: shown on the card · mood: one of Warm, Cool, Pastel, Earthy, Bold, Dark, Neutral, Retro
     colors: hex values, light or dark in any order (5 reads best) */
  palettes: [
    { name: "Sunset Boulevard", mood: "Warm",    colors: ["#ff6b35", "#f7931e", "#ffd23f", "#ee4266", "#540d6e"] },
    { name: "Desert Clay",      mood: "Earthy",  colors: ["#e07a5f", "#3d405b", "#81b29a", "#f2cc8f", "#f4f1de"] },
    { name: "Nordic Frost",     mood: "Cool",    colors: ["#2e3440", "#3b4252", "#88c0d0", "#81a1c1", "#eceff4"] },
    { name: "Matcha Latte",     mood: "Earthy",  colors: ["#e9edc9", "#ccd5ae", "#fefae0", "#faedcd", "#d4a373"] },
    { name: "Midnight Neon",    mood: "Dark",    colors: ["#0d0221", "#261447", "#ff3864", "#2de2e6", "#f6019d"] },
    { name: "Cotton Candy",     mood: "Pastel",  colors: ["#cdb4db", "#ffc8dd", "#ffafcc", "#bde0fe", "#a2d2ff"] },
    { name: "Ocean Depths",     mood: "Cool",    colors: ["#03045e", "#0077b6", "#00b4d8", "#90e0ef", "#caf0f8"] },
    { name: "Vintage Poster",   mood: "Retro",   colors: ["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"] },
    { name: "Citrus Pop",       mood: "Bold",    colors: ["#ff9f1c", "#ffbf69", "#ffffff", "#cbf3f0", "#2ec4b6"] },
    { name: "Berry Smoothie",   mood: "Bold",    colors: ["#3a0ca3", "#7209b7", "#f72585", "#4361ee", "#4cc9f0"] },
    { name: "Monochrome Studio",mood: "Neutral", colors: ["#0f0f0f", "#3a3a3a", "#8a8a8a", "#d4d4d4", "#f5f5f5"] },
    { name: "Sage & Stone",     mood: "Earthy",  colors: ["#3f4238", "#6b705c", "#a5a58d", "#b7b7a4", "#ffe8d6"] },
    { name: "Peach Fuzz",       mood: "Pastel",  colors: ["#ffcdb2", "#ffb4a2", "#e5989b", "#b5838d", "#6d6875"] },
    { name: "Forest Floor",     mood: "Earthy",  colors: ["#283618", "#606c38", "#fefae0", "#dda15e", "#bc6c25"] },
    { name: "Black & Amber",    mood: "Dark",    colors: ["#000000", "#14213d", "#fca311", "#e5e5e5", "#ffffff"] },
    { name: "Ultra Violet",     mood: "Bold",    colors: ["#e0aaff", "#c77dff", "#9d4edd", "#7b2cbf", "#5a189a"] },
    { name: "Lavender Haze",    mood: "Pastel",  colors: ["#f8f7ff", "#e7e6f7", "#c8c6f0", "#a9a3e5", "#8b80d9"] },
    { name: "Miami Vice",       mood: "Retro",   colors: ["#f15bb5", "#fee440", "#00bbf9", "#00f5d4", "#9b5de5"] },
    { name: "Coffee House",     mood: "Earthy",  colors: ["#582f0e", "#7f4f24", "#936639", "#a68a64", "#b6ad90"] },
    { name: "Arctic Mint",      mood: "Cool",    colors: ["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d", "#40916c"] },
    { name: "Royal Ink",        mood: "Dark",    colors: ["#10002b", "#240046", "#3c096c", "#5a189a", "#e0aaff"] },
    { name: "Playground",       mood: "Bold",    colors: ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"] },
    { name: "Coral Reef",       mood: "Warm",    colors: ["#ff7f50", "#ff6f61", "#ffb5a7", "#fcd5ce", "#f8edeb"] },
    { name: "Deep Tech",        mood: "Dark",    colors: ["#0b132b", "#1c2541", "#3a506b", "#5bc0be", "#ffffff"] },
    { name: "Paper & Ink",      mood: "Neutral", colors: ["#fbf8f1", "#f0e9d8", "#c9bfa9", "#57534e", "#1c1917"] },
    { name: "Tokyo Night",      mood: "Dark",    colors: ["#1a1b26", "#24283b", "#7aa2f7", "#bb9af7", "#f7768e"] },
    { name: "Golden Hour",      mood: "Warm",    colors: ["#ffba08", "#faa307", "#f48c06", "#e85d04", "#d00000"] },
    { name: "Seventies Lounge", mood: "Retro",   colors: ["#f4a259", "#f4e285", "#8cb369", "#5b8e7d", "#bc4b51"] },
    { name: "Dusty Rose",       mood: "Neutral", colors: ["#f9dbdd", "#f4acb7", "#9d8189", "#4a4e69", "#22223b"] },
    { name: "Glacier",          mood: "Cool",    colors: ["#e3f2fd", "#bbdefb", "#64b5f6", "#1e88e5", "#0d47a1"] },
    { name: "Chilli Market",    mood: "Warm",    colors: ["#6a040f", "#9d0208", "#d00000", "#dc2f02", "#e85d04"] },
    { name: "Olive Grove",      mood: "Earthy",  colors: ["#414833", "#656d4a", "#a4ac86", "#c2c5aa", "#ebebeb"] },
    { name: "Bubblegum",        mood: "Pastel",  colors: ["#fff1e6", "#fde2e4", "#fad2e1", "#e2ece9", "#bee1e6"] },
    { name: "Brutalist",        mood: "Bold",    colors: ["#f5f0e1", "#ff6e40", "#ffc13b", "#1e3d59", "#0f0f0f"] },
    { name: "Aurora",           mood: "Dark",    colors: ["#0b090a", "#22333b", "#00a6a6", "#8ef6e4", "#c3f0ca"] },
    { name: "Retro Diner",      mood: "Retro",   colors: ["#d62828", "#f77f00", "#fcbf49", "#eae2b7", "#003049"] }
  ]
};
