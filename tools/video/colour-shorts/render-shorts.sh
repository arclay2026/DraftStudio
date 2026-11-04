#!/bin/sh
# Renders the five Colour Shorts (1080×1920) from the lesson's recording:
#   sh render-shorts.sh [out folder]      → colour-short-1.mp4 … colour-short-5.mp4
cd "$(dirname "$0")/.." || exit 1
OUT="${1:-colour-shorts}"
for P in 1 2 3 4 5; do
  node shared/render.js colour-shorts "$OUT/colour-short-$P.mp4" --audio colour-shorts/colour-narration.mp3 --query part=$P --workers 4 || exit 1
done
