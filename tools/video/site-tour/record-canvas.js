// Part three of the site tour: Canvas. Called by record.js with its timing helpers.
const path = require("path");
module.exports = async ({ go, press, type, key, until, T, p }) => {
  const tool = n => `button.cx-tool[aria-label='${n}']`;
  // drag from a to b, the real mouse following the drawn cursor
  const drag = async (a, b, at, dur = .7) => {
    await go(a, at - .15, .4);
    await p.mouse.down();
    await go(b, at + dur, dur);
    await p.mouse.up();
  };
  await go({ x: 840, y: 470 }, T("canvas") + .8, 1.1);
  // a preset: Instagram post
  await press("button.cx-dd-btn", T("preset") + .25, .9);
  await press("button:has-text('Instagram post · 1080')", T("preset") + 1.15, .5);
  // the tool column, and a rectangle drawn while it's introduced
  await press(tool("Rectangle"), T("tools") + .2, .9);
  await drag({ x: 650, y: 230 }, { x: 960, y: 420 }, T("tools") + 1.1, .8);
  // each tool as it's named
  await press(tool("Pen"), T("pen") + .05, .5);
  await press(tool("Rectangle"), T("shapes") + .05, .4);
  await press(tool("Pencil"), T("pencil") + .05, .4);
  await press(tool("Shape Builder"), T("builder") + .1, .4);
  await press(tool("Gradient"), T("gradient") + .1, .45);
  await go(tool("Eyedropper"), T("gradient") + .9, .4);
  // text, then its font
  await press(tool("Text"), T("text") - .1, .5);
  await press({ x: 700, y: 560 }, T("text") + .5, .6);
  await type("Drafty Labs", T("text") + .9, .09);
  await press(tool("Move"), T("fontsearch") - .7, .6);
  await press({ x: 760, y: 572 }, T("fontsearch") - .25, .4);
  await press("button.cx-fontbtn", T("fontsearch") + .25, .5);
  await type("Playfair", T("fontsearch") + .75, .08);
  await key("Enter", T("recolour") - .45);
  await key("Escape", T("recolour") - .25);
  // recolour the rectangle from the swatches
  await press({ x: 805, y: 325 }, T("recolour") + .2, .6);
  await press("button.cx-tiny[aria-label='Swatches']", T("recolour") + .9, .6);
  await press(".cx-swatches button[aria-label='#ff9f0a'], .cx-swatches button[title='#ff9f0a']", T("recolour") + 1.6, .5);
  await key("Escape", T("svg") - .5);
  // an SVG placed as editable vectors
  const chooser = p.waitForEvent("filechooser", { timeout: 4000 }).then(fc => fc.setFiles(path.resolve(__dirname, "canvas-mark.svg"))).catch(() => {});
  await press(tool("Place image"), T("svg") + .2, .8);
  await chooser;
  // layers and history
  await press("button:has-text('Layers')", T("layers") + .1, .8);
  await go({ x: 220, y: 160 }, T("layers") + .8, .5);
  await press("button:has-text('History')", T("layers") + 1.5, .5);
  // export
  await press("button.cx-primary", T("export") + .5, .8);
  await press("button:has-text('SVG')", T("export") + 1.5, .5);
  await go("button:has-text('Export') >> nth=-1", T("export") + 2.4, .6);
};
