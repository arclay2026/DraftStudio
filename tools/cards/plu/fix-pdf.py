# Sets exact print boxes on the exported PDFs: MediaBox = BleedBox = 92 x 60 mm, TrimBox = 86 x 54 mm.
# Chromium rounds the page up to whole CSS px; the artwork starts at the top-left, so trim from the bottom/right.
import sys, pypdf
MM = 72 / 25.4
for f in sys.argv[1:]:
    r = pypdf.PdfReader(f); w = pypdf.PdfWriter()
    for pg in r.pages:
        top = float(pg.mediabox.top)
        box = pypdf.generic.RectangleObject([0, top - 60 * MM, 92 * MM, top])
        pg.mediabox = box; pg.cropbox = box; pg.bleedbox = box
        pg.trimbox = pypdf.generic.RectangleObject([3 * MM, top - 57 * MM, 89 * MM, top - 3 * MM])
        w.add_page(pg)
    w.write(f)
