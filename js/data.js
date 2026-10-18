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
     orientation  (optional) "horizontal", "vertical", "square" or "panoramic"
                  for the Orientation filter. Leave it out and it's worked out
                  from the first "W × H" in specs.
     requires     (optional) the app needed to open it, e.g. "Adobe Photoshop"
     tags         search words
     preview      path to the preview image
     files        one line per download: { format, path, size }
                  Files too big for GitHub can live on Google Drive: use the
                  share link as the path and add name: "file-name.psd".
                  A ZIP file becomes the "Download all" button.
     price        (optional) e.g. "R350" — shows a price and a
                  "Buy on WhatsApp" button instead of downloads
     includes     (with price) the formats the buyer gets
     date         YYYY-MM-DD (newest designs are shown first)
     featured     true = show in the hero and "Fresh drops" first
   ===================================================================== */

window.DS = {
  site: {
    name: "Draft Studio",
    tagline: "Free mockups, vectors, logos and templates for people who make things.",
    email: "thedraftstudio.design@gmail.com",
    whatsapp: "27736684875",          // country code + number, no spaces or +
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
      date: "2026-09-28",
      featured: true
    },
    {
      id: "dore-logo",
      title: "Dore — Letter D Logo",
      category: "Logos",
      description: "A letter D built from nested arcs in deep red, paired with a clean geometric DORE wordmark. Fully editable vector.",
      specs: "Vector · any size (raster 2250 × 2250 px)",
      tags: ["letter d", "lettermark", "monogram", "wordmark", "red", "arcs"],
      preview: "previews/dore-logo.jpg",
      files: [
        { format: "AI",  path: "files/logos/dore/dore-logo.ai",  size: "175 KB" },
        { format: "SVG", path: "files/logos/dore/dore-logo.svg", size: "4 KB" },
        { format: "PDF", path: "files/logos/dore/dore-logo.pdf", size: "43 KB" },
        { format: "PNG", path: "files/logos/dore/dore-logo.png", size: "64 KB" },
        { format: "JPG", path: "files/logos/dore/dore-logo.jpg", size: "134 KB" },
        { format: "ZIP", path: "files/logos/dore/dore-logo.zip", size: "271 KB" }
      ],
      date: "2026-09-28",
      featured: true
    },
    {
      id: "mato-logo",
      title: "Mato — Letter M Logo",
      category: "Logos",
      description: "A bold geometric M in coral red, paired with a crisp Mato wordmark whose t is capped with a matching red square. Exclusive: sold once.",
      specs: "Vector · any size (raster 2250 × 2250 px)",
      tags: ["letter m", "lettermark", "monogram", "wordmark", "geometric", "red"],
      preview: "previews/mato-logo.jpg",
      price: "R350",
      includes: ["AI", "SVG", "PDF", "PNG", "JPG"],
      date: "2026-09-27"
    }
  ],

  // ICONS — each one is files/icons/<id>.svg (24×24, stroke uses currentColor)
  icons: [
    // Interface
    { id: "home", name: "Home", group: "Interface", tags: ["house", "start"] },
    { id: "search", name: "Search", group: "Interface", tags: ["find", "magnifier", "look"] },
    { id: "menu", name: "Menu", group: "Interface", tags: ["hamburger", "list", "navigation"] },
    { id: "close", name: "Close", group: "Interface", tags: ["x", "cancel", "exit"] },
    { id: "plus", name: "Plus", group: "Interface", tags: ["add", "new", "create"] },
    { id: "check", name: "Check", group: "Interface", tags: ["tick", "done", "yes"] },
    { id: "arrow-right", name: "Arrow right", group: "Interface", tags: ["next", "forward"] },
    { id: "arrow-left", name: "Arrow left", group: "Interface", tags: ["back", "previous"] },
    { id: "arrow-up", name: "Arrow up", group: "Interface", tags: ["top", "increase"] },
    { id: "arrow-down", name: "Arrow down", group: "Interface", tags: ["bottom", "decrease"] },
    { id: "chevron-right", name: "Chevron right", group: "Interface", tags: ["next", "more"] },
    { id: "settings", name: "Settings", group: "Interface", tags: ["gear", "cog", "options"] },
    { id: "user", name: "User", group: "Interface", tags: ["person", "profile", "account"] },
    { id: "bell", name: "Bell", group: "Interface", tags: ["notification", "alert"] },
    { id: "filter", name: "Filter", group: "Interface", tags: ["funnel", "sort"] },
    { id: "more", name: "More", group: "Interface", tags: ["dots", "options", "ellipsis"] },
    { id: "external-link", name: "External link", group: "Interface", tags: ["open", "new tab"] },
    { id: "refresh", name: "Refresh", group: "Interface", tags: ["reload", "sync", "repeat"] },
    // Files
    { id: "download", name: "Download", group: "Files", tags: ["save", "get"] },
    { id: "upload", name: "Upload", group: "Files", tags: ["send", "share"] },
    { id: "share", name: "Share", group: "Files", tags: ["network", "send"] },
    { id: "link", name: "Link", group: "Files", tags: ["chain", "url"] },
    { id: "edit", name: "Edit", group: "Files", tags: ["write", "pen", "compose"] },
    { id: "trash", name: "Trash", group: "Files", tags: ["delete", "bin", "remove"] },
    { id: "copy", name: "Copy", group: "Files", tags: ["duplicate", "clone"] },
    { id: "folder", name: "Folder", group: "Files", tags: ["directory", "files"] },
    { id: "file", name: "File", group: "Files", tags: ["document", "page", "paper"] },
    { id: "image", name: "Image", group: "Files", tags: ["picture", "photo", "gallery"] },
    { id: "lock", name: "Lock", group: "Files", tags: ["secure", "private", "password"] },
    { id: "eye", name: "Eye", group: "Files", tags: ["view", "see", "preview"] },
    // Social
    { id: "mail", name: "Mail", group: "Social", tags: ["email", "envelope", "message"] },
    { id: "phone", name: "Phone", group: "Social", tags: ["call", "telephone"] },
    { id: "chat", name: "Chat", group: "Social", tags: ["message", "comment", "talk"] },
    { id: "send", name: "Send", group: "Social", tags: ["paper plane", "message"] },
    { id: "heart", name: "Heart", group: "Social", tags: ["love", "like", "favourite"] },
    { id: "star", name: "Star", group: "Social", tags: ["rating", "favourite", "review"] },
    { id: "bookmark", name: "Bookmark", group: "Social", tags: ["save", "saved"] },
    { id: "thumbs-up", name: "Thumbs up", group: "Social", tags: ["like", "approve", "good"] },
    { id: "at", name: "At sign", group: "Social", tags: ["email", "mention", "username"] },
    { id: "globe", name: "Globe", group: "Social", tags: ["world", "website", "internet"] },
    { id: "camera", name: "Camera", group: "Social", tags: ["photo", "picture", "instagram"] },
    { id: "video", name: "Video", group: "Social", tags: ["record", "film", "call"] },
    // Design
    { id: "pen-tool", name: "Pen tool", group: "Design", tags: ["vector", "nib", "illustrator"] },
    { id: "brush", name: "Brush", group: "Design", tags: ["paint", "art", "draw"] },
    { id: "pencil", name: "Pencil", group: "Design", tags: ["draw", "sketch", "write"] },
    { id: "palette", name: "Palette", group: "Design", tags: ["colour", "color", "paint"] },
    { id: "ruler", name: "Ruler", group: "Design", tags: ["measure", "size"] },
    { id: "crop", name: "Crop", group: "Design", tags: ["trim", "cut", "resize"] },
    { id: "layers", name: "Layers", group: "Design", tags: ["stack", "arrange", "photoshop"] },
    { id: "grid", name: "Grid", group: "Design", tags: ["layout", "columns", "guides"] },
    { id: "type", name: "Type", group: "Design", tags: ["text", "font", "typography"] },
    { id: "eyedropper", name: "Eyedropper", group: "Design", tags: ["colour picker", "sample", "pipette"] },
    { id: "vector", name: "Vector", group: "Design", tags: ["bezier", "curve", "anchor"] },
    { id: "artboard", name: "Artboard", group: "Design", tags: ["frame", "canvas", "page"] },
    { id: "align-center", name: "Align centre", group: "Design", tags: ["align", "center", "layout"] },
    { id: "magic", name: "Magic wand", group: "Design", tags: ["effects", "auto", "sparkle"] },
    { id: "t-shirt", name: "T-shirt", group: "Design", tags: ["mockup", "clothing", "merch"] },
    // Business
    { id: "cart", name: "Cart", group: "Business", tags: ["shopping", "buy", "store"] },
    { id: "bag", name: "Shopping bag", group: "Business", tags: ["shop", "buy", "store"] },
    { id: "tag", name: "Tag", group: "Business", tags: ["price", "label", "sale"] },
    { id: "wallet", name: "Wallet", group: "Business", tags: ["money", "pay", "cash"] },
    { id: "credit-card", name: "Credit card", group: "Business", tags: ["payment", "bank", "pay"] },
    { id: "receipt", name: "Receipt", group: "Business", tags: ["invoice", "bill", "order"] },
    { id: "bar-chart", name: "Bar chart", group: "Business", tags: ["stats", "graph", "growth"] },
    { id: "line-chart", name: "Line chart", group: "Business", tags: ["trend", "graph", "analytics"] },
    { id: "briefcase", name: "Briefcase", group: "Business", tags: ["work", "job", "business"] },
    { id: "store", name: "Store", group: "Business", tags: ["shop", "business", "market"] },
    { id: "gift", name: "Gift", group: "Business", tags: ["present", "reward", "birthday"] },
    { id: "calendar", name: "Calendar", group: "Business", tags: ["date", "event", "schedule"] },
    // Media
    { id: "play", name: "Play", group: "Media", tags: ["start", "video", "music"] },
    { id: "pause", name: "Pause", group: "Media", tags: ["stop", "hold"] },
    { id: "music", name: "Music", group: "Media", tags: ["song", "note", "audio"] },
    { id: "mic", name: "Microphone", group: "Media", tags: ["voice", "record", "podcast"] },
    { id: "volume", name: "Volume", group: "Media", tags: ["sound", "speaker", "audio"] },
    { id: "headphones", name: "Headphones", group: "Media", tags: ["listen", "audio", "music"] },
    { id: "film", name: "Film", group: "Media", tags: ["movie", "cinema", "video"] },
    { id: "monitor", name: "Monitor", group: "Media", tags: ["screen", "desktop", "computer"] },
    { id: "smartphone", name: "Smartphone", group: "Media", tags: ["mobile", "phone", "device"] },
    // Weather
    { id: "sun", name: "Sun", group: "Weather", tags: ["sunny", "day", "light"] },
    { id: "moon", name: "Moon", group: "Weather", tags: ["night", "dark", "sleep"] },
    { id: "cloud", name: "Cloud", group: "Weather", tags: ["cloudy", "weather", "storage"] },
    { id: "rain", name: "Rain", group: "Weather", tags: ["rainy", "weather", "storm"] },
    { id: "bolt", name: "Lightning", group: "Weather", tags: ["storm", "power", "fast"] },
    { id: "snow", name: "Snowflake", group: "Weather", tags: ["cold", "winter", "ice"] },
    { id: "wind", name: "Wind", group: "Weather", tags: ["breeze", "air", "weather"] },
    { id: "leaf", name: "Leaf", group: "Weather", tags: ["nature", "eco", "plant"] },
    { id: "tree", name: "Tree", group: "Weather", tags: ["nature", "forest", "park"] },
    { id: "flame", name: "Flame", group: "Weather", tags: ["fire", "hot", "trending"] },
    // Travel
    { id: "map-pin", name: "Map pin", group: "Travel", tags: ["location", "place", "address"] },
    { id: "map", name: "Map", group: "Travel", tags: ["directions", "travel", "route"] },
    { id: "compass", name: "Compass", group: "Travel", tags: ["explore", "direction", "navigate"] },
    { id: "car", name: "Car", group: "Travel", tags: ["drive", "transport", "taxi"] },
    { id: "plane", name: "Plane", group: "Travel", tags: ["flight", "travel", "airport"] },
    { id: "building", name: "Building", group: "Travel", tags: ["office", "city", "company"] },
    { id: "coffee", name: "Coffee", group: "Travel", tags: ["cafe", "drink", "break"] },
    // General
    { id: "clock", name: "Clock", group: "General", tags: ["time", "hour", "watch"] },
    { id: "lightbulb", name: "Lightbulb", group: "General", tags: ["idea", "tip", "creative"] },
    { id: "rocket", name: "Rocket", group: "General", tags: ["launch", "start", "fast"] },
    { id: "trophy", name: "Trophy", group: "General", tags: ["award", "winner", "prize"] },
    { id: "smile", name: "Smile", group: "General", tags: ["happy", "emoji", "face"] }
  ]
};
