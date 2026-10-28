#!/usr/bin/env python3
"""outline-text.py — turn 1–2 letters of a font into an SVG <path> for a master.

Icon masters must not depend on installed fonts: rsvg-convert, Chrome, Xcode
and every teammate's machine would each substitute a different fallback. Set
the letterform live in the workbench while exploring, then outline it here and
paste the <path> into the concept's art() in place of the <text>.

    pip install fonttools          # once (a venv is fine)
    python3 outline-text.py FONT.ttf "F" --size 620 --x 512 --y 700 --anchor middle \
        --fill '${p.ink}' [--var wght=500] [--tracking -8]

Arguments mirror SVG <text>: x/y is the baseline origin, --anchor start|middle|end,
--size is font-size in master units, --tracking is extra advance per glyph in
master units (like letter-spacing). Variable fonts take --var axis=value pairs.
Kerning (GPOS) is not applied — fine for one or two letters; adjust --tracking
by eye against the workbench study if a pair needs it.

Prints the <path> element to stdout. The fill string is passed through
verbatim, so a template placeholder like '${p.ink}' keeps the path recolorable
per appearance (light / dark / tinted).
"""
import argparse
import sys

try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
except ImportError:  # pragma: no cover
    sys.exit("needs fontTools: pip install fonttools")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("font")
    ap.add_argument("text")
    ap.add_argument("--size", type=float, default=600)
    ap.add_argument("--x", type=float, default=512)
    ap.add_argument("--y", type=float, default=700)
    ap.add_argument("--anchor", choices=["start", "middle", "end"], default="middle")
    ap.add_argument("--tracking", type=float, default=0)
    ap.add_argument("--fill", default="#000")
    ap.add_argument("--var", action="append", default=[], help="axis=value, e.g. wght=500")
    ap.add_argument("--index", type=int, default=0, help="face index inside a .ttc collection")
    a = ap.parse_args()

    font = TTFont(a.font, fontNumber=a.index)
    if a.var:
        from fontTools.varLib.instancer import instantiateVariableFont

        axes = {k: float(v) for k, v in (s.split("=") for s in a.var)}
        font = instantiateVariableFont(font, axes)

    upm = font["head"].unitsPerEm
    scale = a.size / upm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]

    names = []
    for ch in a.text:
        g = cmap.get(ord(ch))
        if g is None:
            sys.exit(f"glyph for {ch!r} not in font")
        names.append(g)

    advances = [hmtx[g][0] * scale + a.tracking for g in names]
    width = sum(advances) - a.tracking
    x = a.x - {"start": 0, "middle": width / 2, "end": width}[a.anchor]

    pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    for g, adv in zip(names, advances):
        # font units are y-up; SVG is y-down, baseline at a.y
        glyphs[g].draw(TransformPen(pen, (scale, 0, 0, -scale, x, a.y)))
        x += adv

    print(f'<path fill="{a.fill}" d="{pen.getCommands()}"/>')


if __name__ == "__main__":
    main()
