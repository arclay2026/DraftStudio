// Builds chat-knowledge.json: what the AI chat server (worker/) knows about
// the site — every design, the palette names, the file-format guide
// and the license. tools/bump.sh runs this, so it stays in step with js/data.js.
//
// Run: node tools/build-chat.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "js", "data.js"), "utf8"), sandbox);
const DS = sandbox.window.DS;

// The format guide lives in js/site.js as plain literals
const site = fs.readFileSync(path.join(root, "js", "site.js"), "utf8");
const literal = name => {
  const m = site.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n  \\]|\\{[\\s\\S]*?\\n  \\});`));
  if (!m) throw new Error(`couldn't find ${name} in js/site.js`);
  return vm.runInNewContext(`(${m[1]})`);
};
const APPS = literal("APPS"), FORMATS = literal("FORMATS");

const formatsOf = it => [...new Set((it.files || []).map(f => f.format.toUpperCase()).filter(f => f !== "ZIP"))];
const out = {
  name: DS.site.name,
  license: DS.site.license,
  contact: { whatsapp: "+" + DS.site.whatsapp, email: DS.site.email },
  files: DS.items.map(it => ({
    id: it.id, title: it.title, category: it.category, formats: formatsOf(it),
    description: it.description, specs: it.specs || "", tags: it.tags || [],
    price: it.price || "free", sold: !!it.sold, requires: it.requires || ""
  })),
  palettes: (DS.palettes || []).map(p => `${p.name} (${p.mood})`),
  formats: FORMATS.map(f => ({ ext: f.ext, what: f.desc, opensIn: f.apps.map(a => APPS[a].name + (APPS[a].free ? " (free)" : "")) }))
};
fs.writeFileSync(path.join(root, "chat-knowledge.json"), JSON.stringify(out, null, 1) + "\n");
console.log(`chat-knowledge.json: ${out.files.length} files, ${out.palettes.length} palettes`);
