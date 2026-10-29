/* Canvas fonts: Google Fonts families (SIL Open Font License or Apache 2.0), checked against
 fonts.googleapis.com. Each entry is [family, weights], where the weight digits are hundreds:
 4567 means 400, 500, 600 and 700. js/canvas.js loads a font only when a design uses it. */
window.DS_CANVAS_FONTS = {
  Sans: [
    ["Afacad", 4567], ["Albert Sans", 123456789], ["Alexandria", 123456789], ["Anek Latin", 12345678], ["Archivo", 123456789], ["Archivo Narrow", 4567],
    ["Asap", 123456789], ["Assistant", 2345678], ["Atkinson Hyperlegible", 47], ["Barlow", 123456789], ["Barlow Condensed", 123456789],
    ["Be Vietnam Pro", 123456789], ["Bricolage Grotesque", 2345678], ["Cabin", 4567], ["Catamaran", 123456789], ["Chivo", 123456789],
    ["Commissioner", 123456789], ["DM Sans", 123456789], ["Darker Grotesque", 3456789], ["Didact Gothic", 4], ["Encode Sans", 123456789],
    ["Epilogue", 123456789], ["Exo 2", 123456789], ["Familjen Grotesk", 4567], ["Figtree", 3456789], ["Fira Sans", 123456789],
    ["Fira Sans Condensed", 123456789], ["Funnel Display", 345678], ["Gantari", 123456789], ["Geist", 123456789], ["Golos Text", 456789],
    ["Hanken Grotesk", 123456789], ["Heebo", 123456789], ["Hind", 34567], ["Host Grotesk", 345678], ["Hubot Sans", 23456789],
    ["IBM Plex Sans", 1234567], ["IBM Plex Sans Condensed", 1234567], ["Inclusive Sans", 34567], ["Instrument Sans", 4567], ["Inter", 123456789],
    ["Josefin Sans", 1234567], ["Jost", 123456789], ["Kanit", 123456789], ["Karla", 2345678], ["Lato", 13479], ["League Spartan", 123456789],
    ["Lexend", 123456789], ["Lexend Deca", 123456789], ["Libre Franklin", 123456789], ["Lunasima", 47], ["Manrope", 2345678], ["Maven Pro", 456789],
    ["Mona Sans", 23456789], ["Montserrat", 123456789], ["Montserrat Alternates", 123456789], ["Mukta", 2345678], ["Mulish", 23456789],
    ["Noto Sans", 123456789], ["Nunito", 23456789], ["Nunito Sans", 23456789], ["Onest", 123456789], ["Open Sans", 345678], ["Outfit", 123456789],
    ["Overpass", 123456789], ["PT Sans", 47], ["Plus Jakarta Sans", 2345678], ["Poppins", 123456789], ["Prompt", 123456789], ["Public Sans", 123456789],
    ["Questrial", 4], ["Quicksand", 34567], ["Radio Canada", 34567], ["Raleway", 123456789], ["Readex Pro", 234567], ["Red Hat Display", 3456789],
    ["Red Hat Text", 34567], ["Reddit Sans", 23456789], ["Rethink Sans", 45678], ["Roboto", 123456789], ["Rubik", 3456789], ["Saira", 123456789],
    ["Saira Condensed", 123456789], ["Schibsted Grotesk", 456789], ["Signika", 34567], ["Sora", 12345678], ["Source Sans 3", 23456789],
    ["Space Grotesk", 34567], ["Spline Sans", 34567], ["Syne", 45678], ["Tenor Sans", 4], ["Titillium Web", 234679], ["Ubuntu", 3457],
    ["Unbounded", 23456789], ["Urbanist", 123456789], ["Varela Round", 4], ["Wix Madefor Display", 45678], ["Work Sans", 123456789]
  ],
  Serif: [
    ["Abril Fatface", 4], ["Alegreya", 456789], ["Aleo", 123456789], ["Arvo", 47], ["Bellefair", 4], ["Besley", 456789], ["Bitter", 123456789],
    ["Bodoni Moda", 456789], ["Bona Nova", 47], ["Brygada 1918", 4567], ["Cardo", 47], ["Castoro", 4567], ["Cinzel", 456789],
    ["Cinzel Decorative", 479], ["Cormorant", 34567], ["Cormorant Garamond", 34567], ["Crimson Pro", 23456789], ["Crimson Text", 467],
    ["DM Serif Display", 4], ["DM Serif Text", 4], ["Domine", 4567], ["EB Garamond", 45678], ["Frank Ruhl Libre", 3456789], ["Fraunces", 123456789],
    ["Gelasio", 4567], ["Gilda Display", 4], ["Gloock", 4], ["Hedvig Letters Serif", 4], ["IBM Plex Serif", 1234567], ["Ibarra Real Nova", 4567],
    ["Instrument Serif", 4], ["Italiana", 4], ["Josefin Slab", 1234567], ["Kaisei Decol", 457], ["Libre Baskerville", 4567],
    ["Libre Caslon Display", 4], ["Libre Caslon Text", 47], ["Literata", 23456789], ["Lora", 4567], ["Marcellus", 4], ["Merriweather", 3456789],
    ["Merriweather Sans", 345678], ["Newsreader", 2345678], ["Noticia Text", 47], ["Noto Serif", 123456789], ["Old Standard TT", 47], ["PT Serif", 47],
    ["Petrona", 123456789], ["Playfair", 3456789], ["Playfair Display", 456789], ["Prata", 4], ["Radley", 4], ["Roboto Serif", 123456789],
    ["Roboto Slab", 123456789], ["Rokkitt", 123456789], ["Rozha One", 4], ["Slabo 27px", 4], ["Source Serif 4", 23456789], ["Spectral", 2345678],
    ["Tinos", 47], ["Unna", 47], ["Vollkorn", 456789], ["Yeseva One", 4], ["Young Serif", 4], ["Zilla Slab", 34567]
  ],
  Display: [
    ["Alfa Slab One", 4], ["Anton", 4], ["Antonio", 1234567], ["Archivo Black", 4], ["Audiowide", 4], ["Bagel Fat One", 4], ["Baloo 2", 45678],
    ["Bangers", 4], ["Bayon", 4], ["Bebas Neue", 4], ["Big Shoulders Display", 123456789], ["Black Ops One", 4], ["Boogaloo", 4], ["Bowlby One", 4],
    ["Bungee", 4], ["Bungee Inline", 4], ["Bungee Shade", 4], ["Calistoga", 4], ["Chakra Petch", 34567], ["Changa One", 4], ["Chango", 4],
    ["Climate Crisis", 4], ["Coiny", 4], ["Comfortaa", 34567], ["Concert One", 4], ["Darumadrop One", 4], ["Days One", 4], ["Dela Gothic One", 4],
    ["Erica One", 4], ["Faster One", 4], ["Fjalla One", 4], ["Fredoka", 34567], ["Gravitas One", 4], ["Holtwood One SC", 4], ["Krona One", 4],
    ["Kumar One", 4], ["League Gothic", 4], ["Lilita One", 4], ["Lobster", 4], ["Lobster Two", 47], ["Londrina Solid", 1349], ["Luckiest Guy", 4],
    ["Major Mono Display", 4], ["Michroma", 4], ["Modak", 4], ["Monoton", 4], ["Notable", 4], ["Orbitron", 456789], ["Oswald", 234567],
    ["Passion One", 479], ["Pathway Gothic One", 4], ["Paytone One", 4], ["Poiret One", 4], ["Press Start 2P", 4], ["Racing Sans One", 4],
    ["Rajdhani", 34567], ["Rammetto One", 4], ["Righteous", 4], ["Rubik Bubbles", 4], ["Rubik Glitch", 4], ["Rubik Mono One", 4],
    ["Rubik Wet Paint", 4], ["Russo One", 4], ["Shrikhand", 4], ["Sigmar One", 4], ["Silkscreen", 47], ["Six Caps", 4], ["Sniglet", 48],
    ["Squada One", 4], ["Staatliches", 4], ["Syncopate", 47], ["Teko", 34567], ["Tilt Warp", 4], ["Titan One", 4], ["Ultra", 4], ["VT323", 4],
    ["Wallpoet", 4]
  ],
  Handwriting: [
    ["Alex Brush", 4], ["Allura", 4], ["Amatic SC", 47], ["Architects Daughter", 4], ["Birthstone", 4], ["Bonheur Royale", 4], ["Caveat", 4567],
    ["Caveat Brush", 4], ["Comic Neue", 347], ["Coming Soon", 4], ["Cookie", 4], ["Corinthia", 47], ["Courgette", 4], ["Covered By Your Grace", 4],
    ["Damion", 4], ["Dancing Script", 4567], ["Delius", 4], ["Ephesis", 4], ["Gloria Hallelujah", 4], ["Gochi Hand", 4], ["Great Vibes", 4],
    ["Handlee", 4], ["Herr Von Muellerhoff", 4], ["Homemade Apple", 4], ["Imperial Script", 4], ["Indie Flower", 4], ["Italianno", 4],
    ["Just Another Hand", 4], ["Kalam", 347], ["Kaushan Script", 4], ["La Belle Aurore", 4], ["Marck Script", 4], ["Meow Script", 4],
    ["Monsieur La Doulaise", 4], ["Mr Dafoe", 4], ["Mrs Saint Delafield", 4], ["Mynerve", 4], ["Nanum Pen Script", 4], ["Nothing You Could Do", 4],
    ["Pacifico", 4], ["Parisienne", 4], ["Patrick Hand", 4], ["Permanent Marker", 4], ["Petit Formal Script", 4], ["Pinyon Script", 4], ["Playball", 4],
    ["Reenie Beanie", 4], ["Rock Salt", 4], ["Sacramento", 4], ["Satisfy", 4], ["Schoolbell", 4], ["Shadows Into Light", 4], ["Sriracha", 4],
    ["Tangerine", 47], ["Water Brush", 4], ["WindSong", 45], ["Yellowtail", 4]
  ],
  Mono: [
    ["Anonymous Pro", 47], ["Azeret Mono", 123456789], ["Courier Prime", 47], ["Cutive Mono", 4], ["DM Mono", 345], ["Fira Code", 34567],
    ["Geist Mono", 123456789], ["IBM Plex Mono", 1234567], ["Inconsolata", 23456789], ["JetBrains Mono", 12345678], ["Martian Mono", 12345678],
    ["Overpass Mono", 34567], ["Red Hat Mono", 34567], ["Roboto Mono", 1234567], ["Share Tech Mono", 4], ["Sometype Mono", 4567],
    ["Source Code Pro", 23456789], ["Space Mono", 47], ["Spline Sans Mono", 34567], ["Syne Mono", 4], ["Ubuntu Mono", 47], ["Victor Mono", 1234567],
    ["Xanh Mono", 4]
  ]
};
