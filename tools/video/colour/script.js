// The narration for the Colour lesson video. {name} marks a cue: the moment the voice
// reaches that word, which the animation is timed to. Blank lines are paragraph breaks.
// node make-script.js writes the plain text (no cues) to colour-narration.txt for ElevenLabs.
window.NARRATION = `
{title}Colour is the first thing people notice, often before they read a single word. {mood}It sets the mood, {identity}tells people who you are, {focus}and guides their eyes to what matters.

{promise}The good news? You don't need "an eye for colour". {rules}You need a few simple rules. {learn}In the next few minutes, you'll learn all of them.

{ch1}Part one: the colour wheel.

{wheel}The colour wheel arranges the pure colours, {c_red}red, {c_orange}orange, {c_yellow}yellow, {c_green}green, {c_blue}blue {c_violet}and violet, {circle}in a circle. {neighbours}Colours side by side are neighbours. {blend}They share a base, so they always blend smoothly. {opposites}Colours straight across are opposites. {energy}They're as different as two colours can be, so together they create contrast and energy.

{split}The wheel also splits in two. {warm}Warm colours, reds, oranges and yellows, feel energetic and urgent. {food}That's why food brands love them. {cool}Cool colours, greens, blues and violets, feel calm and trustworthy. {banks}That's why banks and tech companies lean blue.

{ch2}Part two: hue, saturation and lightness.

{hsl}Every colour on a screen can be described with three numbers. {hue}Hue is which colour it is: a position on the wheel, {degrees}from zero to three hundred and sixty degrees. {sat}Saturation is how strong it is, {grey}from flat grey to fully vivid. {light}And lightness is how light or dark it is, {bw}from black to white.

{trick}Here's the trick professionals use: {keep}keep the hue, {change}and change the other two. {family}One brand blue becomes {f_bg}a soft background, {f_btn}a bright button, {f_text}and deep, dark text. {match}They all match, because they belong to the same colour family.

{ch3}Part three: colour harmonies.

{harmony}A harmony is a recipe for picking colours that work together, {where}based on where they sit on the wheel. {comp}Complementary uses two opposites, like blue and orange. {comp2}Bold and eye-catching. {analog}Analogous uses three neighbours, like blue, teal and green. {analog2}Calm and natural. {triad}Triadic uses three hues, spaced evenly around the wheel. {triad2}Playful, but balanced. {pick}Pick a recipe, and the wheel does the hard work for you.

{ch4}Part four: the sixty, thirty, ten rule.

{messy}Even a perfect palette looks messy if every colour is used equally. {r60}So give sixty percent to a dominant colour: {r60b}the background and large areas. {r30}Thirty percent goes to a secondary colour, {r30b}for structure. {r10}And just ten percent goes to an accent, {r10b}for buttons and the things you want people to notice. {uneven}Uneven amounts are what make a design feel calm and clear.

{ch5}Part five: contrast keeps text readable.

{contrast}Contrast is the difference in lightness between text and its background, {measured}measured as a ratio. {ratio}For body text, aim for at least four point five to one. {huefail}And remember: hue doesn't count, {onlylight}only lightness. {redgreen}Red text on a green background looks vivid, {hard}but it's hard to read. {check}So check every text colour you use.

{recap}Let's recap. {rc1}Colours sit on a wheel: neighbours blend, opposites contrast. {rc2}Describe colours with hue, saturation and lightness. {rc3}Use a harmony to pick a palette. {rc4}Share space sixty, thirty, ten. {rc5}And keep text contrast at four point five to one or more.

{outro}That's colour. {tryit}Now try it yourself on Draft Studio, {next}and I'll see you in the next lesson.{end}
`;
