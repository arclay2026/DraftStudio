// Writes the narration as plain text, without the cue marks, for pasting into ElevenLabs.
// Run: node make-script.js
const fs = require("fs"), path = require("path");
global.window = {};
require("./script.js");
const text = window.NARRATION.trim().replace(/\{\w+\}/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n") + "\n";
fs.writeFileSync(path.join(__dirname, "colour-narration.txt"), text);
console.log(text.split(/\s+/).length - 1, "words written to colour-narration.txt");
