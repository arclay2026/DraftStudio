// Writes a lesson's narration as plain text, without the cue marks, for pasting into ElevenLabs.
// Run: node tools/video/shared/make-script.js <lesson folder name, e.g. typography>
const fs = require("fs"), path = require("path");
const name = process.argv[2];
if (!name) { console.error("Usage: node make-script.js <lesson>"); process.exit(1); }
const dir = path.join(__dirname, "..", name);
global.window = {};
require(path.join(dir, "script.js"));
const text = window.NARRATION.trim().replace(/\{\w+\}/g, "").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n") + "\n";
fs.writeFileSync(path.join(dir, `${name}-narration.txt`), text);
console.log(text.split(/\s+/).length - 1, `words written to ${name}/${name}-narration.txt`);
