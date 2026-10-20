#!/bin/sh
# Stamp a new version on every page after changing CSS or JS.
# Updates the ?v= stamps, the ds-version meta tag and version.json, so
# browsers fetch fresh files and open pages reload themselves once.
cd "$(dirname "$0")/.." || exit 1
V=$(date -u +%Y%m%d%H%M)
sed -i -E "s#\?v=[0-9]{12}#?v=$V#g; s#(name=\"ds-version\" content=\")[0-9]{12}#\1$V#" *.html
printf '{ "v": "%s" }\n' "$V" > version.json
echo "Stamped $V"
