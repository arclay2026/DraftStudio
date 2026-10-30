#!/bin/sh
# Stamp a new version on every page after changing CSS or JS.
# Updates the ?v= stamps, the ds-version meta tag and version.json, so
# browsers fetch fresh files and open pages reload themselves once.
# Also rebuilds chat-knowledge.json for the chat's AI server, and the
# share previews, d/ design pages and sitemap.xml (tools/build-seo.js).
cd "$(dirname "$0")/.." || exit 1
V=$(date -u +%Y%m%d%H%M)
sed -i -E "s#\?v=[0-9]{12}#?v=$V#g; s#(name=\"ds-version\" content=\")[0-9]{12}#\1$V#" *.html
printf '{ "v": "%s" }\n' "$V" > version.json
# Refresh what the chat assistant's AI server knows about the site
command -v node >/dev/null 2>&1 && node tools/build-chat.js
# The lessons written into learn.html, for previews and search engines
command -v node >/dev/null 2>&1 && node tools/build-learn.js
# Lighter WebP copies of the preview images (needs Python with Pillow)
command -v python3 >/dev/null 2>&1 && python3 tools/build-images.py
# Rebuild share previews, the d/ design pages and sitemap.xml
command -v node >/dev/null 2>&1 && node tools/build-seo.js
echo "Stamped $V"
