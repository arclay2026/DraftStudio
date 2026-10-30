// Writes the six lessons into learn.html as plain HTML (between <!-- lessons:start -->
// and <!-- lessons:end -->), so the page lists them even where scripts don't run:
// file previews, readers, search engines. js/academy.js replaces it with the full cards.
// Run: node tools/build-learn.js (tools/bump.sh runs it too)
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "js", "academy-lessons.js"), "utf8"), sandbox);
const LESSONS = sandbox.window.DS_LESSONS;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const cards = LESSONS.map((l, i) => `
        <a class="ac-static-card" href="#lesson-${l.key}">
          <span class="ac-meta"><b>Lesson ${i + 1}</b><span>${esc(l.time)}</span></span>
          <strong>${esc(l.title)}</strong>
          <span class="ac-line">${esc(l.line)}</span>
          <ol>${l.sections.map(s => `<li>${esc(s.h)}</li>`).join("")}</ol>
        </a>`).join("");
const block = `<!-- lessons:start --><div class="ac-static">${cards}
      </div><!-- lessons:end -->`;

const file = path.join(root, "learn.html");
const html = fs.readFileSync(file, "utf8");
if (!/<!-- lessons:start -->[\s\S]*?<!-- lessons:end -->/.test(html)) throw new Error("learn.html has no lessons markers");
fs.writeFileSync(file, html.replace(/<!-- lessons:start -->[\s\S]*?<!-- lessons:end -->/, block));
console.log(`learn.html: ${LESSONS.length} lessons written in`);
