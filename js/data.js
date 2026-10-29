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
    { id: "minus", name: "Minus", group: "Interface", tags: ["remove", "subtract", "less"] },
    { id: "chevron-left", name: "Chevron left", group: "Interface", tags: ["back", "previous"] },
    { id: "chevron-up", name: "Chevron up", group: "Interface", tags: ["collapse", "top"] },
    { id: "chevron-down", name: "Chevron down", group: "Interface", tags: ["expand", "dropdown"] },
    { id: "check-circle", name: "Check circle", group: "Interface", tags: ["done", "success", "complete"] },
    { id: "close-circle", name: "Close circle", group: "Interface", tags: ["cancel", "error", "x"] },
    { id: "plus-circle", name: "Plus circle", group: "Interface", tags: ["add", "new", "create"] },
    { id: "minus-circle", name: "Minus circle", group: "Interface", tags: ["remove", "subtract"] },
    { id: "info", name: "Info", group: "Interface", tags: ["about", "help", "details"] },
    { id: "warning", name: "Warning", group: "Interface", tags: ["alert", "caution", "triangle"] },
    { id: "alert-circle", name: "Alert circle", group: "Interface", tags: ["error", "attention", "important"] },
    { id: "help-circle", name: "Help circle", group: "Interface", tags: ["question", "faq", "support"] },
    { id: "log-in", name: "Log in", group: "Interface", tags: ["sign in", "enter", "account"] },
    { id: "log-out", name: "Log out", group: "Interface", tags: ["sign out", "exit", "leave"] },
    { id: "sliders", name: "Sliders", group: "Interface", tags: ["adjust", "controls", "settings"] },
    { id: "toggle", name: "Toggle", group: "Interface", tags: ["switch", "on", "off"] },
    { id: "bell-off", name: "Bell off", group: "Interface", tags: ["mute", "silent", "notifications"] },
    { id: "eye-off", name: "Eye off", group: "Interface", tags: ["hide", "hidden", "private"] },
    { id: "maximize", name: "Maximize", group: "Interface", tags: ["fullscreen", "expand", "enlarge"] },
    { id: "minimize", name: "Minimize", group: "Interface", tags: ["shrink", "collapse", "exit fullscreen"] },
    { id: "sidebar", name: "Sidebar", group: "Interface", tags: ["panel", "layout", "navigation"] },
    { id: "dashboard", name: "Dashboard", group: "Interface", tags: ["layout", "overview", "panels"] },
    { id: "list", name: "List", group: "Interface", tags: ["bullets", "items", "menu"] },
    { id: "more-vertical", name: "More vertical", group: "Interface", tags: ["dots", "options", "kebab"] },
    { id: "power", name: "Power", group: "Interface", tags: ["on", "off", "shutdown"] },
    // Arrows
    { id: "arrow-up-right", name: "Arrow up right", group: "Arrows", tags: ["diagonal", "open", "external"] },
    { id: "arrow-down-left", name: "Arrow down left", group: "Arrows", tags: ["diagonal", "return"] },
    { id: "arrow-up-down", name: "Arrow up down", group: "Arrows", tags: ["sort", "order", "swap"] },
    { id: "arrow-left-right", name: "Arrow left right", group: "Arrows", tags: ["swap", "exchange", "transfer"] },
    { id: "undo", name: "Undo", group: "Arrows", tags: ["back", "revert"] },
    { id: "redo", name: "Redo", group: "Arrows", tags: ["forward", "repeat"] },
    { id: "reply", name: "Reply", group: "Arrows", tags: ["respond", "answer", "message"] },
    { id: "chevrons-right", name: "Chevrons right", group: "Arrows", tags: ["fast forward", "skip", "next"] },
    { id: "chevrons-left", name: "Chevrons left", group: "Arrows", tags: ["rewind", "back", "previous"] },
    { id: "move", name: "Move", group: "Arrows", tags: ["drag", "arrows", "position"] },
    { id: "shuffle", name: "Shuffle", group: "Arrows", tags: ["random", "mix"] },
    { id: "repeat", name: "Repeat", group: "Arrows", tags: ["loop", "again", "cycle"] },
    { id: "trending-up", name: "Trending up", group: "Arrows", tags: ["growth", "increase", "stocks"] },
    { id: "trending-down", name: "Trending down", group: "Arrows", tags: ["decline", "decrease", "loss"] },
    // Text
    { id: "bold", name: "Bold", group: "Text", tags: ["text", "strong", "format"] },
    { id: "italic", name: "Italic", group: "Text", tags: ["text", "slant", "format"] },
    { id: "underline", name: "Underline", group: "Text", tags: ["text", "format"] },
    { id: "strikethrough", name: "Strikethrough", group: "Text", tags: ["text", "delete", "format"] },
    { id: "align-left", name: "Align left", group: "Text", tags: ["text", "paragraph"] },
    { id: "align-right", name: "Align right", group: "Text", tags: ["text", "paragraph"] },
    { id: "list-ordered", name: "Numbered list", group: "Text", tags: ["list", "steps", "order"] },
    { id: "quote", name: "Quote", group: "Text", tags: ["testimonial", "citation"] },
    { id: "heading", name: "Heading", group: "Text", tags: ["title", "h1", "text"] },
    { id: "paragraph", name: "Paragraph", group: "Text", tags: ["pilcrow", "text"] },
    { id: "translate", name: "Translate", group: "Text", tags: ["language", "i18n", "locale"] },
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
    { id: "file-plus", name: "File plus", group: "Files", tags: ["new file", "add", "document"] },
    { id: "file-check", name: "File check", group: "Files", tags: ["approved", "document", "done"] },
    { id: "file-code", name: "File code", group: "Files", tags: ["source", "script", "document"] },
    { id: "folder-open", name: "Folder open", group: "Files", tags: ["directory", "browse", "files"] },
    { id: "folder-plus", name: "Folder plus", group: "Files", tags: ["new folder", "add", "directory"] },
    { id: "archive", name: "Archive", group: "Files", tags: ["box", "storage", "store"] },
    { id: "clipboard", name: "Clipboard", group: "Files", tags: ["paste", "notes", "tasks"] },
    { id: "clipboard-check", name: "Clipboard check", group: "Files", tags: ["tasks", "done", "checklist"] },
    { id: "paperclip", name: "Paperclip", group: "Files", tags: ["attach", "attachment"] },
    { id: "book-open", name: "Book open", group: "Files", tags: ["read", "docs", "guide"] },
    { id: "book", name: "Book", group: "Files", tags: ["read", "library", "notes"] },
    { id: "inbox", name: "Inbox", group: "Files", tags: ["mail", "tray", "messages"] },
    { id: "save", name: "Save", group: "Files", tags: ["disk", "store", "floppy"] },
    // Communication
    { id: "phone-call", name: "Phone call", group: "Communication", tags: ["ringing", "calling", "contact"] },
    { id: "messages", name: "Messages", group: "Communication", tags: ["conversation", "chat", "comments"] },
    { id: "message-dots", name: "Message dots", group: "Communication", tags: ["typing", "chat", "comment"] },
    { id: "mail-open", name: "Mail open", group: "Communication", tags: ["read", "email", "envelope"] },
    { id: "megaphone", name: "Megaphone", group: "Communication", tags: ["announce", "marketing", "loud"] },
    { id: "rss", name: "RSS", group: "Communication", tags: ["feed", "blog", "subscribe"] },
    { id: "wifi", name: "Wi-Fi", group: "Communication", tags: ["internet", "wireless", "network"] },
    { id: "wifi-off", name: "Wi-Fi off", group: "Communication", tags: ["offline", "no internet"] },
    { id: "signal", name: "Signal", group: "Communication", tags: ["bars", "reception", "network"] },
    { id: "bluetooth", name: "Bluetooth", group: "Communication", tags: ["wireless", "connect", "pair"] },
    { id: "contacts", name: "Contacts", group: "Communication", tags: ["address book", "people", "directory"] },
    { id: "inbox-in", name: "Inbox in", group: "Communication", tags: ["receive", "incoming", "download"] },
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
    // People
    { id: "users", name: "Users", group: "People", tags: ["team", "group", "people"] },
    { id: "user-plus", name: "Add user", group: "People", tags: ["invite", "new member", "person"] },
    { id: "user-check", name: "User check", group: "People", tags: ["verified", "approved", "person"] },
    { id: "user-minus", name: "Remove user", group: "People", tags: ["delete", "member", "person"] },
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
    { id: "skip-forward", name: "Skip forward", group: "Media", tags: ["next", "track"] },
    { id: "skip-back", name: "Skip back", group: "Media", tags: ["previous", "track"] },
    { id: "stop", name: "Stop", group: "Media", tags: ["end", "square"] },
    { id: "record", name: "Record", group: "Media", tags: ["rec", "capture", "live"] },
    { id: "volume-off", name: "Mute", group: "Media", tags: ["sound off", "silent", "volume"] },
    { id: "radio", name: "Radio", group: "Media", tags: ["fm", "broadcast", "audio"] },
    { id: "tv", name: "TV", group: "Media", tags: ["television", "screen", "watch"] },
    { id: "speaker", name: "Speaker", group: "Media", tags: ["audio", "sound", "music"] },
    { id: "playlist", name: "Playlist", group: "Media", tags: ["queue", "songs", "music"] },
    { id: "podcast", name: "Podcast", group: "Media", tags: ["audio", "show", "broadcast"] },
    { id: "gamepad", name: "Gamepad", group: "Media", tags: ["games", "controller", "play"] },
    { id: "gallery", name: "Gallery", group: "Media", tags: ["photos", "images", "album"] },
    { id: "clapperboard", name: "Clapperboard", group: "Media", tags: ["film", "movie", "scene"] },
    // Devices
    { id: "laptop", name: "Laptop", group: "Devices", tags: ["computer", "notebook", "work"] },
    { id: "tablet", name: "Tablet", group: "Devices", tags: ["ipad", "device", "screen"] },
    { id: "watch", name: "Watch", group: "Devices", tags: ["smartwatch", "time", "wearable"] },
    { id: "keyboard", name: "Keyboard", group: "Devices", tags: ["type", "keys", "input"] },
    { id: "mouse", name: "Mouse", group: "Devices", tags: ["click", "pointer", "computer"] },
    { id: "server", name: "Server", group: "Devices", tags: ["hosting", "rack", "backend"] },
    { id: "hard-drive", name: "Hard drive", group: "Devices", tags: ["storage", "disk", "backup"] },
    { id: "cpu", name: "Chip", group: "Devices", tags: ["cpu", "processor", "hardware"] },
    { id: "battery", name: "Battery", group: "Devices", tags: ["power", "charge", "energy"] },
    { id: "battery-charging", name: "Charging", group: "Devices", tags: ["battery", "power", "plugged in"] },
    { id: "plug", name: "Plug", group: "Devices", tags: ["power", "socket", "electric"] },
    { id: "printer", name: "Printer", group: "Devices", tags: ["print", "paper", "office"] },
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
    { id: "scissors", name: "Scissors", group: "Design", tags: ["cut", "trim", "crop"] },
    { id: "paint-bucket", name: "Paint bucket", group: "Design", tags: ["fill", "colour", "paint"] },
    { id: "droplet", name: "Droplet", group: "Design", tags: ["water", "ink", "colour"] },
    { id: "shapes", name: "Shapes", group: "Design", tags: ["geometry", "elements", "objects"] },
    { id: "contrast", name: "Contrast", group: "Design", tags: ["brightness", "theme", "dark mode"] },
    { id: "sparkles", name: "Sparkles", group: "Design", tags: ["ai", "magic", "new"] },
    { id: "aperture", name: "Aperture", group: "Design", tags: ["camera", "lens", "photo"] },
    { id: "crosshair", name: "Crosshair", group: "Design", tags: ["target", "precision", "focus"] },
    { id: "cursor", name: "Cursor", group: "Design", tags: ["pointer", "select", "click"] },
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
    { id: "pie-chart", name: "Pie chart", group: "Business", tags: ["chart", "share", "analytics"] },
    { id: "presentation", name: "Presentation", group: "Business", tags: ["slides", "pitch", "meeting"] },
    { id: "target", name: "Target", group: "Business", tags: ["goal", "aim", "focus"] },
    { id: "award", name: "Award", group: "Business", tags: ["medal", "prize", "winner"] },
    { id: "verified", name: "Verified", group: "Business", tags: ["badge", "check", "trusted"] },
    { id: "calculator", name: "Calculator", group: "Business", tags: ["math", "finance", "sum"] },
    { id: "scale", name: "Scale", group: "Business", tags: ["balance", "legal", "justice"] },
    { id: "kanban", name: "Kanban", group: "Business", tags: ["board", "tasks", "project"] },
    { id: "id-card", name: "ID card", group: "Business", tags: ["badge", "identity", "member"] },
    { id: "crown", name: "Crown", group: "Business", tags: ["premium", "king", "vip"] },
    { id: "flag", name: "Flag", group: "Business", tags: ["report", "milestone", "country"] },
    { id: "calendar-check", name: "Calendar check", group: "Business", tags: ["booked", "scheduled", "event"] },
    // Commerce
    { id: "package", name: "Package", group: "Commerce", tags: ["box", "delivery", "shipping"] },
    { id: "truck", name: "Truck", group: "Commerce", tags: ["delivery", "shipping", "transport"] },
    { id: "percent", name: "Percent", group: "Commerce", tags: ["discount", "sale", "offer"] },
    { id: "coins", name: "Coins", group: "Commerce", tags: ["money", "cash", "savings"] },
    { id: "banknote", name: "Banknote", group: "Commerce", tags: ["cash", "money", "payment"] },
    { id: "piggy-bank", name: "Piggy bank", group: "Commerce", tags: ["savings", "money", "budget"] },
    { id: "barcode", name: "Barcode", group: "Commerce", tags: ["scan", "product", "sku"] },
    { id: "qr-code", name: "QR code", group: "Commerce", tags: ["scan", "link", "code"] },
    { id: "basket", name: "Basket", group: "Commerce", tags: ["shopping", "groceries", "cart"] },
    { id: "cart-plus", name: "Add to cart", group: "Commerce", tags: ["cart", "buy", "shop"] },
    { id: "dollar", name: "Dollar", group: "Commerce", tags: ["money", "usd", "currency"] },
    { id: "rand", name: "Rand", group: "Commerce", tags: ["money", "zar", "currency", "south africa"] },
    { id: "sale", name: "Sale", group: "Commerce", tags: ["discount", "badge", "offer"] },
    // Development
    { id: "code", name: "Code", group: "Development", tags: ["developer", "html", "brackets"] },
    { id: "terminal", name: "Terminal", group: "Development", tags: ["console", "command line", "shell"] },
    { id: "git-branch", name: "Branch", group: "Development", tags: ["git", "version", "fork"] },
    { id: "git-merge", name: "Merge", group: "Development", tags: ["git", "combine", "pull request"] },
    { id: "database", name: "Database", group: "Development", tags: ["data", "storage", "sql"] },
    { id: "cloud-upload", name: "Cloud upload", group: "Development", tags: ["upload", "backup", "sync"] },
    { id: "cloud-download", name: "Cloud download", group: "Development", tags: ["download", "sync", "save"] },
    { id: "command", name: "Command", group: "Development", tags: ["shortcut", "mac", "keyboard"] },
    { id: "bug", name: "Bug", group: "Development", tags: ["debug", "error", "insect"] },
    // Security
    { id: "shield", name: "Shield", group: "Security", tags: ["security", "protect", "safe"] },
    { id: "shield-check", name: "Shield check", group: "Security", tags: ["secure", "verified", "protected"] },
    { id: "key", name: "Key", group: "Security", tags: ["password", "access", "unlock"] },
    { id: "unlock", name: "Unlock", group: "Security", tags: ["open", "unsecure", "access"] },
    { id: "fingerprint", name: "Fingerprint", group: "Security", tags: ["biometric", "touch id", "identity"] },
    { id: "scan", name: "Scan", group: "Security", tags: ["scanner", "capture", "qr"] },
    { id: "ban", name: "Ban", group: "Security", tags: ["block", "forbidden", "not allowed"] },
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
    { id: "cloud-sun", name: "Partly cloudy", group: "Weather", tags: ["weather", "cloud", "sun"] },
    { id: "cloud-moon", name: "Cloudy night", group: "Weather", tags: ["weather", "night", "moon"] },
    { id: "sunrise", name: "Sunrise", group: "Weather", tags: ["morning", "dawn", "sun"] },
    { id: "sunset", name: "Sunset", group: "Weather", tags: ["evening", "dusk", "sun"] },
    { id: "thermometer", name: "Thermometer", group: "Weather", tags: ["temperature", "heat", "weather"] },
    { id: "umbrella", name: "Umbrella", group: "Weather", tags: ["rain", "insurance", "protect"] },
    { id: "storm", name: "Storm", group: "Weather", tags: ["lightning", "thunder", "weather"] },
    { id: "rainbow", name: "Rainbow", group: "Weather", tags: ["weather", "colour", "pride"] },
    // Nature
    { id: "flower", name: "Flower", group: "Nature", tags: ["tulip", "spring", "garden"] },
    { id: "sprout", name: "Sprout", group: "Nature", tags: ["plant", "grow", "eco"] },
    { id: "mountain", name: "Mountain", group: "Nature", tags: ["hike", "peak", "outdoors"] },
    { id: "waves", name: "Waves", group: "Nature", tags: ["water", "sea", "ocean"] },
    { id: "paw", name: "Paw", group: "Nature", tags: ["pet", "dog", "cat"] },
    { id: "campfire", name: "Campfire", group: "Nature", tags: ["fire", "camping", "outdoors"] },
    { id: "fish", name: "Fish", group: "Nature", tags: ["sea", "food", "ocean"] },
    { id: "cactus", name: "Cactus", group: "Nature", tags: ["plant", "desert", "succulent"] },
    // Travel
    { id: "map-pin", name: "Map pin", group: "Travel", tags: ["location", "place", "address"] },
    { id: "map", name: "Map", group: "Travel", tags: ["directions", "travel", "route"] },
    { id: "compass", name: "Compass", group: "Travel", tags: ["explore", "direction", "navigate"] },
    { id: "car", name: "Car", group: "Travel", tags: ["drive", "transport", "taxi"] },
    { id: "plane", name: "Plane", group: "Travel", tags: ["flight", "travel", "airport"] },
    { id: "building", name: "Building", group: "Travel", tags: ["office", "city", "company"] },
    { id: "coffee", name: "Coffee", group: "Travel", tags: ["cafe", "drink", "break"] },
    { id: "train", name: "Train", group: "Travel", tags: ["rail", "transport", "commute"] },
    { id: "bus", name: "Bus", group: "Travel", tags: ["transport", "commute", "public"] },
    { id: "bike", name: "Bike", group: "Travel", tags: ["bicycle", "cycling", "ride"] },
    { id: "ship", name: "Ship", group: "Travel", tags: ["boat", "cruise", "sea"] },
    { id: "luggage", name: "Luggage", group: "Travel", tags: ["suitcase", "travel", "bag"] },
    { id: "bed", name: "Bed", group: "Travel", tags: ["hotel", "sleep", "stay"] },
    { id: "ticket", name: "Ticket", group: "Travel", tags: ["event", "pass", "admission"] },
    { id: "navigation", name: "Navigation", group: "Travel", tags: ["direction", "gps", "location"] },
    { id: "anchor", name: "Anchor", group: "Travel", tags: ["port", "marine", "harbour"] },
    // Health
    { id: "heart-pulse", name: "Heart rate", group: "Health", tags: ["health", "pulse", "cardio"] },
    { id: "pill", name: "Pill", group: "Health", tags: ["medicine", "pharmacy", "capsule"] },
    { id: "stethoscope", name: "Stethoscope", group: "Health", tags: ["doctor", "medical", "checkup"] },
    { id: "first-aid", name: "First aid", group: "Health", tags: ["medical", "kit", "emergency"] },
    { id: "syringe", name: "Syringe", group: "Health", tags: ["vaccine", "injection", "medical"] },
    { id: "dumbbell", name: "Dumbbell", group: "Health", tags: ["gym", "fitness", "workout"] },
    // Food
    { id: "utensils", name: "Utensils", group: "Food", tags: ["restaurant", "food", "dining"] },
    { id: "pizza", name: "Pizza", group: "Food", tags: ["food", "slice", "takeaway"] },
    { id: "cake", name: "Cake", group: "Food", tags: ["birthday", "celebrate", "party"] },
    { id: "wine", name: "Wine", group: "Food", tags: ["drink", "glass", "bar"] },
    { id: "ice-cream", name: "Ice cream", group: "Food", tags: ["dessert", "sweet", "summer"] },
    { id: "apple", name: "Apple", group: "Food", tags: ["fruit", "healthy", "food"] },
    // Education
    { id: "graduation-cap", name: "Graduation cap", group: "Education", tags: ["education", "school", "degree"] },
    { id: "backpack", name: "Backpack", group: "Education", tags: ["school", "bag", "travel"] },
    { id: "notebook", name: "Notebook", group: "Education", tags: ["notes", "journal", "study"] },
    { id: "flask", name: "Flask", group: "Education", tags: ["science", "chemistry", "lab"] },
    { id: "atom", name: "Atom", group: "Education", tags: ["science", "physics", "react"] },
    // General
    { id: "clock", name: "Clock", group: "General", tags: ["time", "hour", "watch"] },
    { id: "lightbulb", name: "Lightbulb", group: "General", tags: ["idea", "tip", "creative"] },
    { id: "rocket", name: "Rocket", group: "General", tags: ["launch", "start", "fast"] },
    { id: "trophy", name: "Trophy", group: "General", tags: ["award", "winner", "prize"] },
    { id: "smile", name: "Smile", group: "General", tags: ["happy", "emoji", "face"] },
    { id: "hourglass", name: "Hourglass", group: "General", tags: ["time", "waiting", "loading"] },
    { id: "wrench", name: "Wrench", group: "General", tags: ["tool", "fix", "settings"] },
    { id: "lamp", name: "Lamp", group: "General", tags: ["light", "desk", "interior"] },
    { id: "dice", name: "Dice", group: "General", tags: ["game", "random", "chance"] }
  ],

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
