// The narration for the Typography lesson video. {name} marks a cue: the moment the voice
// reaches that word, which the animation is timed to. Blank lines are paragraph breaks.
// node ../shared/make-script.js typography writes the plain text to typography-narration.txt for ElevenLabs.
window.NARRATION = `
{title}Typography is the art of arranging text so it's easy, and pleasant, to read. {words}Most designs are mostly words, {skill}so good typography does more for your work than any other single skill.

{promise}The good news? It's not about owning a hundred fonts. {rules}It's about a few simple rules. {learn}Let's learn them.

{ch1}Part one: the anatomy of a letter.

{lines}Every letter in a font sits on the same set of invisible lines. {baseline}The baseline is the line letters stand on. {xheight}The x-height is the height of a lowercase x. {cap}The cap height is the height of capital letters. {asc}Tall letters, like d, h and k, rise to the ascender line, {desc}and letters with tails, like g, p and y, drop to the descender line.

{xmatter}The x-height matters most. {bigx}Fonts with a large x-height look bigger, {small}and stay readable at small sizes.

{ch2}Part two: the main kinds of font.

{serif}Serif fonts have small strokes at the ends of their letters. {classic}They feel classic and trustworthy. {sans}Sans-serif fonts have none. {modern}They feel modern and clean, and they're the default for apps and websites. {mono}Monospace fonts give every letter the same width, {code}perfect for code and numbers. {display}And display fonts are made to be used big, {headlines}for headlines, never for paragraphs.

{ch3}Part three: size and weight.

{random}Beginners pick font sizes by eye, and nothing quite relates. {scale}Professionals use a type scale: {multiply}each size is the one before it, multiplied by the same number. {ratio}With a ratio of one point two five, {steps}sixteen pixel body text grows to twenty, twenty-five, thirty-one and thirty-nine. {body16}And for reading on screens, sixteen pixels is the minimum.

{weight}Weight is how thick the strokes are, {range}from thin, all the way to black. {three}Three weights are enough: {regular}regular for reading, {semibold}semibold for buttons and labels, {bold}and bold for headings.

{ch4}Part four: spacing.

{leading}Line height is the space from one line to the next. {cramped}Too tight, and the eye slips onto the wrong line. {comfy}For body text, use about one and a half times the font size. {measure}Line length matters too. {chars}Aim for forty-five to seventy-five characters per line, {column}so on a wide screen, use a narrow column.

{tracking}Letter spacing should stay at zero for body text. {tight}Big headlines look better slightly tighter, {caps}and small capital labels look better opened up.

{ch5}Part five: pairing fonts.

{two}Most designs need only two fonts: {headfont}one for headings, {bodyfont}and one for body text. {contrastp}The secret is clear contrast. {classicpair}A serif heading with a sans-serif body looks intentional. {similar}Two fonts that are almost the same look like a mistake. {onefamily}When in doubt, use one family, and let size and weight do the work.

{recap}Let's recap. {rc1}Letters sit on five guide lines, and the x-height matters most. {rc2}Serif feels classic, sans-serif modern, monospace technical, display loud. {rc3}Pick sizes from a type scale, with sixteen pixel body text. {rc4}Set line height to about one and a half, and keep lines to forty-five to seventy-five characters. {rc5}And pair two clearly different fonts, or one family in two weights.

{outro}That's typography. {tryit}Now try it yourself in Draft Studio's Canvas, {next}and I'll see you in the next lesson.{end}
`;
