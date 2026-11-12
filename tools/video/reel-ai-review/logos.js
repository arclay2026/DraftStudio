// The logos the reel reviews, as SVG strings (viewBox 0 0 600 600). Four are deliberately "AI-style" bad
// (garbled lettering, a melted croissant, gradient soup, detail that turns to mush when small); the last
// is the clean one a designer would make for the same brief. k makes the ids unique per copy.

// 1 · the spelling: a busy badge whose lettering falls apart
window.aiBadge = k => `
<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="b1${k}" cx=".45" cy=".38" r=".7"><stop offset="0" stop-color="#f3c46b"/><stop offset=".55" stop-color="#b8692a"/><stop offset="1" stop-color="#5b2d12"/></radialGradient>
    <filter id="wob${k}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="9"/></filter>
    <path id="arc${k}" d="M300 300 m-206 0 a206 206 0 1 1 412 0 a206 206 0 1 1 -412 0"/>
  </defs>
  <rect width="600" height="600" fill="#f4ebdd"/>
  <circle cx="300" cy="300" r="262" fill="url(#b1${k})"/>
  <circle cx="300" cy="300" r="236" fill="none" stroke="#fde7b8" stroke-width="5" stroke-dasharray="3 9"/>
  <circle cx="300" cy="300" r="168" fill="none" stroke="#fde7b8" stroke-width="3"/>
  <g filter="url(#wob${k})" font-family="Playfair, Georgia, serif" font-weight="700" fill="#fff4dc">
    <text font-size="40" letter-spacing="3"><textPath href="#arc${k}" startOffset="1%">BAKKEERY · FRESHH · ARTISAINAL · BRAED · BAKKEERY ·</textPath></text>
    <text x="300" y="318" font-size="104" text-anchor="middle" letter-spacing="-6">BAKRY</text>
    <text x="300" y="372" font-size="30" text-anchor="middle" letter-spacing="7">EST 20O6 · SINCE</text>
  </g>
  <g fill="#fde7b8" opacity=".9">${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${236 + i * 32}" cy="214" rx="9" ry="20" transform="rotate(${-30 + i * 15} ${236 + i * 32} 214)"/>`).join("")}</g>
  <g fill="#fff3d1">${[[120, 140], [470, 160], [140, 460], [455, 450]].map(([x, y]) => `<path d="M${x} ${y - 16}l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/>`).join("")}</g>
</svg>`;

// 2 · the croissant: too many lumps, one growing the wrong way, and it's melting
window.aiCroissant = k => {
  const lobes = [[175, 330, 30, 46, -62], [212, 290, 38, 58, -40], [262, 262, 44, 66, -14], [318, 258, 50, 70, 8], [370, 276, 40, 64, 30],
    [414, 312, 34, 52, 50], [446, 352, 22, 38, 72], [418, 205, 30, 44, 145]];
  return `
<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="c2${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf7a"/><stop offset=".6" stop-color="#d9822b"/><stop offset="1" stop-color="#8a4313"/></linearGradient>
    <linearGradient id="bg2${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1d6"/><stop offset="1" stop-color="#f1cfa0"/></linearGradient>
    <filter id="melt${k}" x="-20%" y="-20%" width="140%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".018 .045" numOctaves="3" seed="9"/><feDisplacementMap in="SourceGraphic" scale="26"/></filter>
    <filter id="wob2${k}"><feTurbulence type="fractalNoise" baseFrequency=".04" numOctaves="2" seed="2"/><feDisplacementMap in="SourceGraphic" scale="8"/></filter>
  </defs>
  <rect width="600" height="600" fill="url(#bg2${k})"/>
  <g filter="url(#melt${k})">
    <path d="M200 350 C 205 420, 215 440, 212 470 C 230 470, 228 420, 236 360 Z M330 330 C 333 400, 345 455, 338 500 C 360 498, 356 420, 352 335 Z M400 345 C 404 390, 412 410, 409 430 C 424 428, 420 390, 418 345 Z" fill="#c06a22"/>
    ${lobes.map(([x, y, rx, ry, r]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="url(#c2${k})" stroke="#7a3a10" stroke-width="3"/>`).join("")}
    ${lobes.map(([x, y, rx, ry, r]) => `<ellipse cx="${x - rx * .25}" cy="${y - ry * .35}" rx="${rx * .35}" ry="${ry * .18}" transform="rotate(${r} ${x} ${y})" fill="#fff" opacity=".55"/>`).join("")}
  </g>
  <g filter="url(#wob2${k})" font-family="Inter Display, sans-serif" font-weight="800" fill="#6b3410" text-anchor="middle">
    <text x="300" y="520" font-size="66" letter-spacing="-2">CROSSANT</text>
    <text x="300" y="560" font-size="26" letter-spacing="9" fill="#9b5a25">BAKREY HOUSSE</text>
  </g>
</svg>`;
};

// 3 · the colours: purple-to-orange glow, chrome, lens flare, sparkles on everything
window.aiCrypto = k => `
<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g3${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b0a6b"/><stop offset=".5" stop-color="#c2189b"/><stop offset="1" stop-color="#ff9a1a"/></linearGradient>
    <linearGradient id="ch${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9ff3ff"/><stop offset=".5" stop-color="#4a2a8a"/><stop offset="1" stop-color="#ffd1f2"/></linearGradient>
    <radialGradient id="fl${k}"><stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#ffe9a8" stop-opacity=".8"/><stop offset="1" stop-color="#ff7ad9" stop-opacity="0"/></radialGradient>
    <filter id="glow${k}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="600" height="600" fill="url(#g3${k})"/>
  <circle cx="300" cy="300" r="250" fill="none" stroke="#7df9ff" stroke-width="4" opacity=".6" filter="url(#glow${k})"/>
  <g filter="url(#glow${k})" fill="none" stroke="#7df9ff" stroke-width="7" stroke-linecap="round">
    <path d="M190 250 C 230 150, 370 150, 410 250"/><path d="M215 250 C 250 190, 350 190, 385 250"/><path d="M240 252 C 270 220, 330 220, 360 252"/>
  </g>
  <text x="300" y="380" text-anchor="middle" font-family="Inter Display, sans-serif" font-weight="800" font-size="110" letter-spacing="-4" fill="url(#ch${k})" stroke="#ff4fd8" stroke-width="2" filter="url(#glow${k})">BAKERY</text>
  <text x="300" y="430" text-anchor="middle" font-family="Inter Display, sans-serif" font-weight="700" font-size="26" letter-spacing="12" fill="#ffe3fb" filter="url(#glow${k})">NEXT-GEN BREAD</text>
  <circle cx="455" cy="140" r="120" fill="url(#fl${k})"/><circle cx="380" cy="215" r="18" fill="#fff" opacity=".35"/><circle cx="330" cy="260" r="9" fill="#fff" opacity=".3"/>
  <g fill="#fff">${[[120, 120, 1], [500, 470, 1.3], [110, 470, .9], [470, 300, .7], [160, 300, .6], [300, 520, .8]].map(([x, y, s]) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -26 L6 -6 26 0 6 6 0 26 -6 6 -26 0 -6 -6Z" opacity=".9"/>`).join("")}</g>
</svg>`;

// the clean logo: a croissant from five simple shapes, in a badge, with a calm wordmark
window.realLogo = (k, o = {}) => {
  const ink = o.ink || "#3b2416", fill = o.fill || "#e3a35b", bg = o.bg || "#f4ede2", accent = o.accent || "#9a6a43";
  const A = [-64, -32, 0, 32, 64], RX = [24, 32, 40, 32, 24], RY = [40, 52, 62, 52, 40];
  const seg = A.map((a, i) => { const r = a * Math.PI / 180, x = 300 + 95 * Math.sin(r), y = 300 - 95 * Math.cos(r) + 55;
    return `<ellipse class="rl-seg" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${RX[i]}" ry="${RY[i]}" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${fill}" stroke="${o.mono ? bg : ink}" stroke-width="8"/>`; }).join("");
  const markOnly = o.mark;
  return `
<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="600" height="600" fill="${bg}"/>
  <g class="rl-mark" transform="${markOnly ? "translate(0 30)" : "translate(0 -40) scale(.86) translate(49 49)"}">
    <circle class="rl-badge" cx="300" cy="300" r="190" fill="${ink}"/>
    ${seg}
  </g>
  ${markOnly ? "" : `<text class="rl-name" x="300" y="508" text-anchor="middle" font-family="Playfair, Georgia, serif" font-weight="700" font-size="78" fill="${ink}" letter-spacing="-1">Crumb &amp; Co.</text>
  <text class="rl-sub" x="300" y="556" text-anchor="middle" font-family="Inter, sans-serif" font-weight="600" font-size="22" letter-spacing="7" fill="${o.mono ? ink : accent}">BAKERY · EST. 2026</text>`}
</svg>`;
};
