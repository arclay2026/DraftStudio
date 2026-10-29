/* =====================================================================
   DESIGN BASICS — the free beginner course on the Learn page
   Six lesson cards, each with a labelled diagram (js/academy-figures.js).
   A card opens the full written lesson in a reader: sections with figures,
   common mistakes, a recap and a tool to practise in. Lessons have their
   own address (learn.html#lesson-colour) so they can be shared.
   site.js calls window.DSAcademy(kit) on the Learn page.
   ===================================================================== */
window.DSAcademy = function (kit) {
  const { $, $$, esc, icon } = kit;
  const root = $("[data-academy]");
  const FIG = window.DSFigures;
  if (!root || !FIG) return;

  /* ---------- The lessons ----------
     Paragraphs are our own trusted HTML (<b>, <em> only). */
  const LESSONS = [
    {
      key: "colour", title: "Colour", time: "9 min read",
      line: "Pick colours that work together, every time.",
      intro: "Colour is the first thing people notice, often before they read a single word. It sets the mood, tells people what kind of brand you are, and points their eyes to what matters. The good news: you don't need “an eye for colour”. Designers use a few simple tools and rules, and in this lesson you'll learn all of them.",
      sections: [
        {
          h: "The colour wheel",
          body: [
            "The colour wheel arranges hues (the pure colours: red, orange, yellow and so on) in a circle, in the same order you see in a rainbow. Our wheel has 12 hues, each 30 degrees apart. Designers use it like a map: where two colours sit on the wheel tells you how they will behave together.",
            "<b>Neighbours</b> (hues side by side) share a base colour, so they always blend smoothly. <b>Opposites</b> (hues straight across the wheel) are as different as two colours can be, so they create strong contrast and energy.",
            "The wheel also splits into a <b>warm half</b> (reds, oranges, yellows) and a <b>cool half</b> (greens, blues, violets). Warm colours feel energetic, friendly and urgent, which is why food brands and sales use them. Cool colours feel calm, clean and trustworthy, which is why banks, health and tech brands lean blue."
          ],
          fig: "colourWheel", caption: "The 12-hue wheel. The dashed line joins two opposites: red and cyan."
        },
        {
          h: "Hue, saturation and lightness",
          body: [
            "Every colour on a screen can be described with three numbers, called <b>HSL</b>. Learning them makes choosing colours much less of a guessing game.",
            "<b>Hue</b> is which colour it is, as a position on the wheel from 0° to 360° (0° is red, 120° green, 240° blue). <b>Saturation</b> is how strong or vivid it is, from 0% (grey) to 100% (as intense as possible). <b>Lightness</b> is how light or dark it is, from 0% (black) to 100% (white).",
            "Here's the trick professionals use: keep the hue, change the other two. A brand blue at 55% lightness for buttons, the same hue at 95% for a soft background, and at 15% for dark text. They all match, because they are the same colour family."
          ],
          fig: "colourHsl", caption: "The three dials of a colour. The card on the right breaks one blue into its three numbers.",
          tip: "Muddy, dull colours usually have low saturation in the middle of the lightness range. Fix them by raising saturation or moving lightness up or down."
        },
        {
          h: "Colour harmonies",
          body: [
            "A harmony is a recipe for picking colours that look good together, based on their positions on the wheel. Four recipes cover almost every design.",
            "<b>Complementary:</b> two opposite hues, like blue and orange. Bold and eye-catching; let one colour lead and use the other for small accents. <b>Analogous:</b> three neighbours, like pink, red and orange. Calm and natural, great for backgrounds and gentle brands.",
            "<b>Triadic:</b> three hues spaced evenly (120° apart), like red, green and blue. Playful and balanced; works best when one hue dominates. <b>Split complementary:</b> one hue plus the two hues next to its opposite. It has the punch of complementary but is easier to balance, which makes it a great default."
          ],
          fig: "colourHarmony", caption: "Each recipe as dots on the wheel, and a five-colour palette built from it (the hues plus a light and a dark)."
        },
        {
          h: "The 60-30-10 rule",
          body: [
            "Even a perfect palette looks messy if every colour is used equally. The 60-30-10 rule fixes that by giving each colour a job and a share of the space.",
            "About <b>60%</b> goes to a dominant colour, usually the background and large areas. It sets the mood. About <b>30%</b> goes to a secondary colour for text, image panels and cards. It builds structure. The last <b>10%</b> is the accent: buttons, badges, a highlighted word. Because it's rare, the accent is what people notice.",
            "The numbers are a guide, not maths homework. The point is <em>uneven</em> amounts: one colour clearly in charge, one supporting, one that pops."
          ],
          fig: "colour603010", caption: "A café poster: cream sets the mood, deep green gives structure, orange marks the action."
        },
        {
          h: "Contrast keeps text readable",
          body: [
            "Contrast is the difference in lightness between text and its background. It's measured as a ratio, from 1:1 (no difference) to 21:1 (black on white). The web accessibility guidelines (WCAG) ask for at least <b>4.5:1</b> for normal text and <b>3:1</b> for large headings.",
            "Hue doesn't count, only lightness. Red text on a green background can look vivid but be almost unreadable, because the two are equally light. Light grey on white is the most common mistake on the web: it looks elegant on a big bright monitor and disappears on a phone in the sun.",
            "Check every text colour you use. Most design tools, and many free websites, show the ratio instantly when you enter two colours."
          ],
          fig: "colourContrast", caption: "Six real pairs and their measured ratios. Green ticks pass for body text."
        }
      ],
      mistakes: ["Using five colours in equal amounts, so nothing stands out.", "Grey text on white that's too light to read.", "Pure, fully saturated colours everywhere; they tire the eye. Tone most of them down.", "Choosing colours you like instead of colours that suit the brand and its customers."],
      recap: ["Hues sit on a wheel: neighbours blend, opposites contrast.", "Describe colours with hue, saturation and lightness, and keep one hue across light and dark shades.", "Use a harmony recipe to pick a palette.", "Share space 60-30-10 so one colour leads and the accent pops.", "Keep text contrast at 4.5:1 or more."],
      practise: ["palettes.html", "Open the palette generator", "Pick a base colour, try each harmony, and check the text contrast it shows for every swatch."]
    },
    {
      key: "type", title: "Typography", time: "10 min read",
      line: "Choose fonts and pair them like a pro.",
      intro: "Typography is the art of arranging text so it's easy and pleasant to read. Most designs are mostly words, so good typography does more for your work than any other single skill. This lesson covers how letters are built, the main kinds of font, and the sizing and spacing rules that make text look professional.",
      sections: [
        {
          h: "The anatomy of a letter",
          body: [
            "Every letter in a font sits on the same set of invisible lines. Knowing their names helps you compare fonts and talk to other designers.",
            "The <b>baseline</b> is the line letters stand on. The <b>x-height</b> is the height of a lowercase x, which is roughly the height of most lowercase letters. The <b>cap height</b> is the height of capital letters. Tall lowercase letters like d, h and k rise to the <b>ascender line</b>, and letters with tails like g, p and y drop to the <b>descender line</b>.",
            "The x-height matters most in everyday use. Fonts with a large x-height look bigger and stay readable at small sizes, which is why they are popular for screens and captions."
          ],
          fig: "typeAnatomy", caption: "Five guide lines, measured from the real font. The blue band is the x-height."
        },
        {
          h: "The main kinds of font",
          body: [
            "<b>Serif</b> fonts have small strokes, called serifs, at the ends of letters. They feel classic, literary and trustworthy, and suit books, newspapers and luxury brands. <b>Sans-serif</b> fonts (sans means “without”) have clean strokes with no feet. They feel modern and neutral, and they're the default for apps, websites and signs.",
            "<b>Monospace</b> fonts give every letter exactly the same width, like an old typewriter. Use them for code, numbers in tables, or a technical look. <b>Display</b> fonts are drawn to be used big: heavy, condensed or decorative. They make great headlines and are tiring to read in paragraphs.",
            "A word about the word: a <em>typeface</em> is the design (say, Inter), and a <em>font</em> is one style of it (Inter Bold). In everyday talk, people use both to mean the same thing."
          ],
          fig: "typeFamilies", caption: "The same two letters in four kinds of typeface. Monospace letters each fill an equal box."
        },
        {
          h: "Size and a type scale",
          body: [
            "Beginners often pick font sizes by eye (17, 22, 29) and end up with a page where nothing quite relates. Professionals use a <b>type scale</b>: a short list of sizes where each one is the previous size multiplied by the same number.",
            "A popular ratio is 1.25. Starting from 16 px body text, that gives 20, 25, 31, 39 and 49 px for bigger text, and 12.8 px for captions. Use only sizes from your scale, and your design will feel orderly even if nobody knows why.",
            "For body text on screens, 16 px is a sensible minimum. For printed body text, 9 to 12 point is typical."
          ],
          fig: "typeScale", caption: "A 1.25 type scale. Seven sizes cover captions to the biggest headline."
        },
        {
          h: "Weight: from light to black",
          body: [
            "Weight is how thick the strokes are. Most modern font families come in several weights, from Thin and Light through Regular and Medium to Bold and Black, often numbered 100 to 900.",
            "Weight is the easiest way to create contrast without adding a second font. Bold headings over Regular body text already look designed. A common, safe set is three weights: Regular (400) for reading, Medium or Semibold (500 to 600) for buttons and labels, and Bold (700 or more) for headings."
          ],
          fig: "typeWeights", caption: "Six weights of one family. Each number is the weight you choose in a design tool."
        },
        {
          h: "Line height and line length",
          body: [
            "<b>Line height</b> (also called leading) is the distance from one line of text to the next. When lines are too close, the eye slips onto the wrong line. For body text, set line height to about <b>1.4 to 1.6 times</b> the font size. Big headlines need less, around 1.0 to 1.2, or the lines drift apart.",
            "<b>Line length</b> (the measure) is how many characters fit on one line. Lines that are too long make it hard to find the start of the next one; lines that are too short break the flow. Aim for <b>45 to 75 characters</b> per line, about 10 to 12 words. On a wide screen, that means a narrow text column, not text from edge to edge."
          ],
          fig: "typeLeading", caption: "The same paragraph cramped and comfortable, and the ideal range for line length."
        },
        {
          h: "Letter spacing",
          body: [
            "Letter spacing, or <b>tracking</b>, adds or removes space between all the letters in a block of text. Font designers already spaced the letters perfectly for normal reading sizes, so leave body text at 0.",
            "Adjust it at the extremes. <b>Big headlines</b> look better slightly tighter, about −1% to −3%, because the gaps grow with the size. <b>Small uppercase labels</b> look better opened up, about +5% to +12%, because capitals are designed to sit next to lowercase letters. Never spread out lowercase body text: words start to fall apart."
          ],
          fig: "typeTracking", caption: "Tighten big type, open up small capitals, leave body text alone."
        },
        {
          h: "Pairing two fonts",
          body: [
            "Most designs need only two fonts: one for headings and one for body text. Many need just one family in two weights.",
            "The secret of a good pair is <b>clear contrast</b>. A serif heading with a sans-serif body is a classic for a reason: the shapes are obviously different, so it looks intentional. Two fonts that are almost the same (two similar sans-serifs, or Medium next to Regular) look like a mistake, as if you meant to use one font and slipped.",
            "If you're not sure, use one family and let size and weight do the work."
          ],
          fig: "typePairing", caption: "Two pairs that work and one that's too similar to read as a choice."
        }
      ],
      mistakes: ["Using three or more fonts in one design.", "Body text smaller than 16 px on a screen.", "Paragraphs stretched across the whole width of a wide screen.", "Writing headlines in ALL CAPS with no extra letter spacing.", "Centring long paragraphs: centred text is fine for one or two lines only."],
      recap: ["Learn the five guide lines: ascender, cap height, x-height, baseline, descender.", "Serif feels classic, sans-serif modern, monospace technical, display loud.", "Pick sizes from a type scale, with 16 px body text.", "Set body line height to about 1.5 and keep lines to 45 to 75 characters.", "Pair two clearly different fonts, or one family in two weights."],
      practise: ["canvas.html", "Practise in Canvas", "Add a heading and a paragraph, then try different fonts from the font menu. Aim for clear contrast between the two."]
    },
    {
      key: "layout", title: "Layout", time: "8 min read",
      line: "Grids, spacing and alignment that feel calm.",
      intro: "Layout is where things go on the page. A good layout feels calm and obvious, as if nothing could be anywhere else. That feeling doesn't come from talent; it comes from a few tools designers use on every project: grids, a spacing scale, alignment, grouping and white space.",
      sections: [
        {
          h: "Grids: margins, columns and gutters",
          body: [
            "A grid is a set of invisible columns that you place content on. It's the main reason professional layouts look tidy: every edge lands on a line the others share.",
            "A grid has three parts. The <b>margins</b> are the empty space on the left and right of the page. The <b>columns</b> are the vertical strips content sits in. The <b>gutters</b> are the gaps between columns. Websites often use 12 columns, because 12 divides neatly into halves, thirds, quarters and sixths.",
            "To use a grid, make each element span a whole number of columns. An image could span 7 columns and the text beside it 5. Never stop halfway across a column or a gutter."
          ],
          fig: "layoutGrid", caption: "A 12-column grid. The image takes 7 columns, the text 5, and the header all 12."
        },
        {
          h: "A spacing scale",
          body: [
            "Just as with font sizes, picking every gap by eye (13 px here, 18 px there) makes a design feel slightly off. Instead, choose a <b>spacing scale</b>: a short list of numbers, usually multiples of 4 or 8, such as 4, 8, 16, 24, 32, 48 and 64.",
            "Use only these numbers for padding, margins and gaps. Small numbers (4, 8) go between things that belong tightly together, like an icon and its label. Middle numbers (16, 24) go inside cards and between paragraphs. Big numbers (48, 64) separate whole sections.",
            "Design tools like Figma, and the Canvas here, let you nudge objects by exact amounts, which makes a scale easy to stick to."
          ],
          fig: "layoutSpacing", caption: "A spacing scale, and a card where every gap is 16 or 24."
        },
        {
          h: "Alignment",
          body: [
            "Alignment means lining elements up along a shared edge or centre. Our eyes notice edges that almost line up even more than edges that are far apart, so small misalignments make a design feel careless.",
            "Pick one alignment and stick to it. <b>Left alignment</b> is the safest choice for most designs, because it's how we read (in left-to-right languages) and it creates one strong, straight edge. Centre alignment works for short, formal pieces like invitations, but becomes hard to read for longer text.",
            "Don't trust your eye. Use the snapping guides and the align buttons in your design tool, which line things up perfectly in one click."
          ],
          fig: "layoutAlign", caption: "Four slightly different edges on the left. One red line through everything on the right."
        },
        {
          h: "Proximity: group what belongs together",
          body: [
            "People assume that things close together are related. This is called <b>proximity</b>, and it lets you organise information without drawing a single box or line.",
            "Put related items close together, and leave more space between unrelated groups. A heading should sit closer to the paragraph it introduces than to the paragraph above it. A price should sit next to the product it belongs to.",
            "When every gap is the same, the reader has to work out the groups for themselves. When the gaps differ on purpose, the structure is obvious at a glance."
          ],
          fig: "layoutProximity", caption: "Six identical items. On the right, one bigger gap creates two clear groups."
        },
        {
          h: "White space",
          body: [
            "White space (or negative space) is the empty area around and between elements. It doesn't have to be white; it's simply space with nothing in it.",
            "Beginners often see empty space as wasted and fill it. But space is what lets each element breathe and be noticed. Cramped designs feel cheap and stressful; roomy designs feel calm and premium. Think of a luxury shop window with three products, compared to a market stall piled high.",
            "If a design feels busy, the fix is usually not to make things smaller. Remove something, and give what's left more room."
          ],
          fig: "layoutWhitespace", caption: "The same flyer, crammed and then given room. Less content, more impact."
        }
      ],
      mistakes: ["Placing elements by eye instead of on a grid.", "Using a different gap size everywhere.", "Mixing left, centre and right alignment in one design.", "Filling every empty space with more content.", "Text running right up to the edge of the page or a card."],
      recap: ["Place content on columns; respect the margins and gutters.", "Choose gaps from a spacing scale, like 4, 8, 16, 24, 32, 48, 64.", "Line things up along one shared edge.", "Small gaps inside groups, big gaps between them.", "White space makes designs feel calm and premium."],
      practise: ["canvas.html", "Practise in Canvas", "Turn on the grid and smart guides from the View menu, then lay out a simple poster where every edge lines up."]
    },
    {
      key: "hierarchy", title: "Hierarchy", time: "7 min read",
      line: "Make the important thing impossible to miss.",
      intro: "People don't read designs; they scan them. In a second or two they decide what it's about and whether to look closer. Visual hierarchy is how you control that scan: you decide what people see first, second and third, using size, weight, colour, contrast and position.",
      sections: [
        {
          h: "What the eye sees first",
          body: [
            "Eye-tracking studies, where cameras record exactly where people look, show the same pattern again and again. Our eyes jump first to the <b>biggest</b>, <b>darkest</b> or most <b>colourful</b> thing, then to faces and pictures, then to whatever stands out next.",
            "So every design should have a planned reading order. On a poster that's usually: 1, the headline (what is it?); 2, the picture (what does it look like?); 3, the details (when, where, how much?); 4, the action (what should I do?).",
            "Before you design, write that order down. Then make sure step 1 really is the most noticeable thing on the page."
          ],
          fig: "hierOrder", caption: "A planned reading order. Warm areas show where attention lands."
        },
        {
          h: "Size and weight rank information",
          body: [
            "Size is the strongest tool you have. The bigger something is, the more important it looks. Weight (how bold it is) is next.",
            "Give each level of information a clearly different size or weight. If two things are almost the same size, the reader can't tell which matters more, and the design feels flat. A useful test: if you have to ask “is this a heading?”, the difference isn't big enough.",
            "Three or four levels are plenty for most designs: a headline, a subheading, body text and small details."
          ],
          fig: "hierSize", caption: "The same text at one size, then ranked. The numbers show the new reading order."
        },
        {
          h: "Colour and contrast for emphasis",
          body: [
            "Colour attracts attention, but only when it's rare. If everything is bright, nothing stands out.",
            "Keep most of your design in calm colours (white, greys, black, or soft tints) and save your strongest colour for the most important thing, usually the main button. This is the accent from the 60-30-10 rule in the Colour lesson.",
            "Contrast works in both directions: a dark card among light cards stands out just as much as a bright one among dark cards. What matters is being different from the surroundings."
          ],
          fig: "hierColour", caption: "Three price cards. Contrast and one blue button make the middle plan the obvious choice."
        },
        {
          h: "Scanning patterns: F and Z",
          body: [
            "When people scan, their eyes follow predictable paths. On text-heavy pages like articles and search results, they read in an <b>F pattern</b>: across the top, across a little lower, then down the left side, reading only the first words of each line. So put the most important words at the start of headings and list items.",
            "On simple pages with little text, like adverts, posters and landing pages, the eye follows a <b>Z pattern</b>: top left to top right, diagonally down, then across the bottom. Put your logo at the start of the Z and your button at the end."
          ],
          fig: "hierPatterns", caption: "The two scanning paths. Design along them instead of against them."
        },
        {
          h: "Test it: the squint test",
          body: [
            "Here's a test professional designers use daily. Step back from your design and squint, or blur it in your design tool. The details disappear and only the big shapes remain.",
            "What's still visible is your real hierarchy. If you can still see the headline and the button, the design works. If you see a blur of equal grey blocks, or the wrong thing stands out (a decoration, a logo, a photo of a hand), go back and make the important parts bigger, bolder or more contrasting."
          ],
          fig: "hierSquint", caption: "Blurred, only the headline and the button survive: a clear hierarchy.",
          tip: "Show your design to a friend for five seconds, then hide it. Ask what it was about and what they were supposed to do. If they can't say, the hierarchy needs work."
        }
      ],
      mistakes: ["Making everything big and bold, so nothing stands out.", "Two competing focal points of the same size.", "Using the accent colour on many things instead of one.", "Hiding the main button in a corner or in a weak colour."],
      recap: ["Plan a reading order: what's first, second, third.", "Size and weight rank information; make the differences obvious.", "Save your strongest colour for the one main action.", "Design along the F and Z scanning paths.", "Squint or blur to test what really stands out."],
      practise: ["canvas.html", "Practise in Canvas", "Make a simple event poster. Write down the reading order first, then use size, weight and one accent colour to make it happen."]
    },
    {
      key: "logos", title: "Logos", time: "8 min read",
      line: "What makes a logo simple, memorable and yours.",
      intro: "A logo is a signature: a small mark people use to recognise a brand at a glance. The best logos are surprisingly simple; you could draw most famous ones from memory. In this lesson you'll learn the five kinds of logo, how designers build marks from simple shapes, and the tests every logo has to pass.",
      sections: [
        {
          h: "The five kinds of logo",
          body: [
            "<b>Wordmarks</b> are the brand name set in a chosen or custom-drawn font. They're the simplest and the best way to make a new name memorable. <b>Lettermarks</b> use just the initials, which helps when the full name is long.",
            "<b>Symbols</b> (or pictorial marks) are pictures with no words, like a bird or an apple. They're powerful but only work once people already know the brand. <b>Combination marks</b> put a symbol and a wordmark together, and can be split apart later. They're the most common kind. <b>Emblems</b> place the words inside a shape, like a badge or seal, and suit traditional brands, schools and sports clubs.",
            "For a new, small business, a wordmark or combination mark is almost always the right start."
          ],
          fig: "logoTypes", caption: "Five kinds of logo, all for an imaginary brand called Nova."
        },
        {
          h: "Build the mark from simple shapes",
          body: [
            "Professional marks are rarely drawn freehand. Designers construct them from basic geometry (circles, squares and straight lines) placed on a grid, so every curve is smooth and every proportion is deliberate.",
            "The Nova mark below is just one big circle, a smaller circle cut out of it, and a dot. Because the sizes relate (the small circle is 0.62 of the big one), it feels balanced even though most people would never measure it.",
            "Simple shapes also make a logo easy to remember, easy to reproduce, and sharp at any size."
          ],
          fig: "logoGrid", caption: "Construction circles (dashed) on a grid, and the finished mark."
        },
        {
          h: "One colour first, then colour",
          body: [
            "A logo has to work in many places: on a white website, a dark app screen, a black-and-white invoice, embroidered on a cap. So design it in <b>black first</b>. If the shape is strong in one flat colour, it will work everywhere.",
            "Then prepare a small set of versions: full colour for normal use, one colour (black) for print, reversed (white) for dark backgrounds, and one that sits on the brand colour. Keep each version as a separate file so nobody has to improvise.",
            "Choose the brand colour for meaning, not personal taste: think back to warm versus cool in the Colour lesson."
          ],
          fig: "logoColour", caption: "Four versions of one logo. The shape does the work; colour adds feeling."
        },
        {
          h: "Clear space and the small-size test",
          body: [
            "<b>Clear space</b> is a protected zone around the logo where nothing else may go: no text, no edges, no other logos. It's usually measured with a part of the logo itself (here, the dot's circle, called x), so it scales with the logo.",
            "Then do the <b>small-size test</b>. Shrink the logo to the size of an app icon or a browser tab, about 16 to 32 pixels. Thin lines, tiny details and small text vanish first. If the logo turns into a smudge, simplify it. A great logo is still recognisable when it's tiny, blurred or seen from across the street."
          ],
          fig: "logoSize", caption: "Clear space measured with x, and the logo shrunk to four small sizes."
        }
      ],
      mistakes: ["Too many details, colours or effects that vanish when small.", "Using a trendy font that will look dated next year.", "A picture that literally shows the product (a cake for a bakery) instead of something distinctive.", "Only ever designing the full-colour version.", "Stretching or squashing the logo to fit a space."],
      recap: ["Start with a wordmark or combination mark for new brands.", "Build marks from simple shapes on a grid.", "Design in black first; then make colour, one-colour and reversed versions.", "Protect a clear space around the logo.", "Test it at 16 to 32 pixels and simplify until it survives."],
      practise: ["browse.html?cat=logos", "Pull apart an editable logo", "Open one of the free vector logos in Illustrator, Inkscape or Figma and look at how it's built from simple shapes."]
    },
    {
      key: "mockups", title: "Mockups", time: "7 min read",
      line: "Present your work so clients say yes.",
      intro: "A mockup shows a design on a real object (a T-shirt, a phone, a coffee cup) so people can picture it in real life. Clients rarely get excited by a flat logo on a white page, but show the same logo on a shop sign or a hoodie and they understand it instantly. This lesson explains how mockups work and how to present your designs well.",
      sections: [
        {
          h: "Why mockups matter",
          body: [
            "Most clients aren't designers. Looking at a flat file, they have to imagine how it will look on their product, and most people can't. A mockup does the imagining for them.",
            "Mockups also catch problems before money is spent on printing: a logo that's too small on a sign, a colour that disappears on a dark bag, text that's unreadable from a distance.",
            "A good mockup is realistic but not distracting. The design should be the hero, not the fancy background."
          ],
          fig: "mockFlat", caption: "The same artwork, flat and in a T-shirt mockup."
        },
        {
          h: "How smart objects work",
          body: [
            "Most professional mockups are Photoshop files (PSD) built with <b>smart objects</b>. A smart object is a container layer: a box that holds your design inside the mockup.",
            "To use it: <b>1.</b> In the Layers panel, find the layer marked as a smart object (it's usually called “Your design” or “Place design here”) and double-click its thumbnail. <b>2.</b> A new document opens. Paste or place your artwork there, then save it with Ctrl+S (⌘+S on a Mac) and close it. <b>3.</b> Back in the mockup, your design now appears on the object, already bent, shaded and lit to match the photo.",
            "It works because the mockup's layers of shadows and folds sit above the smart object. Your design is printed onto the scene, not just pasted on top. If you don't have Photoshop, the free web app Photopea opens PSD mockups and handles smart objects the same way."
          ],
          fig: "mockSmart", caption: "Double-click the smart object, replace the art, save: the scene updates."
        },
        {
          h: "Choose the right scene",
          body: [
            "Match the mockup to where the client's customers will really see the design. A café cares about cups, bags and menus. A clothing brand needs T-shirts, hoodies and labels. A tech startup wants phones, laptops and app icons.",
            "Also match the mood. A luxury brand looks wrong on a cluttered, brightly lit desk; a playful brand looks dull on grey concrete. Pay attention to lighting, colours and props, and choose scenes whose style fits the brand."
          ],
          fig: "mockScenes", caption: "Six kinds of business, and the mockups that suit them."
        },
        {
          h: "Present work like a professional",
          body: [
            "When you show your work, make a <b>presentation board</b> (or a few slides) instead of sending loose files. Put one strong mockup first, as the hero. Then show the logo flat on light and dark backgrounds, the colour palette with its codes, and the fonts.",
            "Explain your thinking in a sentence or two for each choice: why this colour, why this font. Clients trust decisions they understand. Show two or three strong options at most; ten options suggests you aren't sure, and makes the client do your job.",
            "Finally, export at a good size (at least 2000 pixels wide for images) so nothing looks blurry on a large screen."
          ],
          fig: "mockBoard", caption: "A simple presentation board: hero mockup, logo versions, palette and type."
        }
      ],
      mistakes: ["Using a low-resolution or obviously fake-looking mockup.", "Picking a scene that doesn't match the brand or its customers.", "Showing only mockups and never the flat logo files.", "Sending ten options instead of two or three considered ones.", "Forgetting to check the design at the size it will really be used."],
      recap: ["Mockups help clients picture the design in real life.", "Smart objects: double-click, place your art, save.", "Choose scenes where the brand's customers will see it.", "Present on a board: hero mockup, flat logo, palette, fonts.", "Explain your choices and keep options few."],
      practise: ["browse.html?cat=mockups", "Use a free mockup", "Download a free PSD mockup, open it in Photoshop or the free Photopea, and replace the smart object with your own design."]
    }
  ];

  /* ---------- Cards ---------- */
  const cover = l => (FIG.cover[l.key] ? FIG.cover[l.key]() : "");
  const card = (l, i) => `
    <button class="ac-card reveal" type="button" data-ac="${i}" style="--d:${i}">
      <span class="ac-stage" aria-hidden="true">${cover(l)}</span>
      <span class="ac-info">
        <span class="ac-meta"><b>Lesson ${i + 1}</b><span>${l.time} · ${l.sections.length} parts</span></span>
        <span class="ac-title-row"><strong>${l.title}</strong>${icon("arrow-right")}</span>
        <span class="ac-line">${l.line}</span>
      </span>
    </button>`;
  const drawCards = () => { root.innerHTML = `<div class="ac-grid">${LESSONS.map(card).join("")}</div>`; };
  drawCards();

  /* ---------- The reader ---------- */
  const reader = document.createElement("div");
  reader.className = "ac-reader";
  reader.hidden = true;
  reader.innerHTML = `
    <div class="ac-backdrop" data-ac-close></div>
    <article class="ac-panel" role="dialog" aria-modal="true" aria-labelledby="ac-title" tabindex="-1">
      <header class="ac-bar">
        <span class="ac-step" data-ac-step></span>
        <span class="ac-nav">
          <button type="button" data-ac-go="-1" aria-label="Previous lesson">${icon("arrow-left")}</button>
          <button type="button" data-ac-go="1" aria-label="Next lesson">${icon("arrow-right")}</button>
          <button type="button" data-ac-close aria-label="Close">${icon("close")}</button>
        </span>
        <i class="ac-progress" data-ac-progress></i>
      </header>
      <div class="ac-scroll" data-ac-scroll><div class="ac-doc" data-ac-doc></div></div>
    </article>`;
  document.body.appendChild(reader);
  const panel = $(".ac-panel", reader), scroller = $("[data-ac-scroll]", reader), doc = $("[data-ac-doc]", reader);
  let cur = 0, lastCard = null;

  const figure = (name, caption, n) => `<figure class="ac-fig">${FIG.fig[name] ? FIG.fig[name]() : ""}<figcaption><b>Figure ${n}</b> ${esc(caption)}</figcaption></figure>`;
  const lessonHtml = (l, i) => {
    const next = LESSONS[(i + 1) % LESSONS.length];
    return `
      <p class="ac-kicker">Design Basics · Lesson ${i + 1} of ${LESSONS.length}</p>
      <h1 id="ac-title">${esc(l.title)}</h1>
      <p class="ac-lead">${esc(l.intro)}</p>
      <nav class="ac-toc" aria-label="In this lesson">
        <p class="ac-label">In this lesson</p>
        <ol>${l.sections.map((s, k) => `<li><a href="#ac-s${k + 1}" data-ac-jump="${k + 1}">${esc(s.h)}</a></li>`).join("")}</ol>
      </nav>
      ${l.sections.map((s, k) => `
        <section class="ac-sec" id="ac-s${k + 1}">
          <h2><span>${k + 1}</span>${esc(s.h)}</h2>
          ${s.body.map(p => `<p>${p}</p>`).join("")}
          ${figure(s.fig, s.caption, k + 1)}
          ${s.tip ? `<aside class="ac-tip"><b>Pro tip</b><p>${esc(s.tip)}</p></aside>` : ""}
        </section>`).join("")}
      <section class="ac-sec ac-end">
        <h2>Common mistakes</h2>
        <ul class="ac-bad">${l.mistakes.map(m => `<li>${esc(m)}</li>`).join("")}</ul>
        <h2>Recap</h2>
        <ul class="ac-good">${l.recap.map(m => `<li>${icon("check")}<span>${esc(m)}</span></li>`).join("")}</ul>
        <div class="ac-practise">
          <div><p class="ac-label">Practise it</p><p>${esc(l.practise[2])}</p></div>
          <a class="btn btn-dark" href="${l.practise[0]}">${esc(l.practise[1])} <span class="arr">${icon("arrow-right")}</span></a>
        </div>
        <button type="button" class="ac-next" data-ac-go="1">
          <span class="ac-next-cover" aria-hidden="true">${cover(next)}</span>
          <span><small>Next lesson</small><b>${esc(next.title)}</b><span>${esc(next.line)}</span></span>
          ${icon("arrow-right")}
        </button>
      </section>`;
  };
  const fill = i => {
    cur = (i + LESSONS.length) % LESSONS.length;
    const l = LESSONS[cur];
    $("[data-ac-step]", reader).textContent = `Lesson ${cur + 1} of ${LESSONS.length} · ${l.time}`;
    doc.innerHTML = lessonHtml(l, cur);
    scroller.scrollTop = 0;
    progress();
    if (location.hash !== "#lesson-" + l.key) history.replaceState(null, "", "#lesson-" + l.key);
  };
  const progress = () => {
    const max = scroller.scrollHeight - scroller.clientHeight;
    $("[data-ac-progress]", reader).style.transform = `scaleX(${max > 0 ? Math.min(1, scroller.scrollTop / max) : 0})`;
  };
  scroller.addEventListener("scroll", progress, { passive: true });

  const open = i => {
    fill(i);
    clearTimeout(reader._t);
    reader.hidden = false;
    document.documentElement.style.overflow = "hidden";
    requestAnimationFrame(() => reader.classList.add("is-open"));
    setTimeout(() => panel.focus({ preventScroll: true }), 50);
  };
  const close = () => {
    reader.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    reader._t = setTimeout(() => { reader.hidden = true; }, 300);
    if (/^#lesson-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
    if (lastCard) lastCard.focus({ preventScroll: true });
  };
  root.addEventListener("click", e => { const c = e.target.closest("[data-ac]"); if (c) { lastCard = c; open(+c.dataset.ac); } });
  reader.addEventListener("click", e => {
    if (e.target.closest("[data-ac-close]")) { close(); return; }
    const g = e.target.closest("[data-ac-go]");
    if (g) { fill(cur + +g.dataset.acGo); return; }
    const j = e.target.closest("[data-ac-jump]");
    if (j) { e.preventDefault(); const t = $("#ac-s" + j.dataset.acJump, doc); if (t) scroller.scrollTo({ top: t.offsetTop - 70, behavior: "smooth" }); }
  });
  document.addEventListener("keydown", e => {
    if (reader.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") fill(cur + (e.key === "ArrowRight" ? 1 : -1));
  });

  // Open a lesson from its address (learn.html#lesson-colour)
  const fromHash = () => { const k = (/^#lesson-(\w+)/.exec(location.hash) || [])[1], i = LESSONS.findIndex(l => l.key === k); if (i > -1) open(i); };
  fromHash();
  addEventListener("hashchange", () => { if (reader.hidden) fromHash(); });

  // The type figures measure real fonts: draw again once the web fonts have arrived
  if (document.fonts && document.fonts.status !== "loaded") document.fonts.ready.then(() => { drawCards(); if (!reader.hidden) { const y = scroller.scrollTop; fill(cur); scroller.scrollTop = y; } });
};
