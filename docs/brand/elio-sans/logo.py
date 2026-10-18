# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools>=4.55", "skia-pathops"]
# ///
"""The name of the logo, outlined from Elio Sans: "Elio" 900 and "Blocks" 400, of one size.

Writes docs/brand/elio-blocks-wordmark.svg (the name alone, its capitals 100 high, in currentColor) and
the full logo, elio-blocks-logo.svg (name in ink) and elio-blocks-logo-light.svg (name in white): the
tile of src/icons/brand/svg/elio-logo.svg, the capitals 49% of its height and centered on it.

    uv run docs/brand/elio-sans/logo.py

after build.py, which writes the font it outlines.
"""
import math
import re
from functools import cache
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import OverlapMode, instantiateVariableFont

HERE = Path(__file__).parent
BRAND = HERE.parent
TILE_SOURCE = BRAND.parents[1] / "src/icons/brand/svg/elio-logo.svg"
FONT = HERE / "ElioSans[wght].ttf"
CAP = 740
WORDS = (("Elio", 900), ("Blocks", 400))
TRACK, WORD_SPACE = -0.01, 0.15  # em
# The capitals 49% of the tile; the name starts 0.2275 of the tile after it (its first side bearing included).
TILE, RATIO, GAP = 128, 0.49, 0.2275


@cache
def instance(wght):
    return instantiateVariableFont(TTFont(FONT), {"wght": wght}, overlap=OverlapMode.REMOVE)


def name(cap, x, baseline):
    """The name with its capitals `cap` high, from x on the baseline (y down): its path, its advance
    end and its ink bounds."""
    em = cap / CAP * 1000
    scale = em / 1000
    path = SVGPathPen(None, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    bounds = BoundsPen(None)
    for i, (text, wght) in enumerate(WORDS):
        font = instance(wght)
        glyphs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
        if i:
            x += (WORD_SPACE - TRACK) * em
        for ch in text:
            glyph = cmap[ord(ch)]
            for pen in (path, bounds):
                glyphs[glyph].draw(TransformPen(pen, (scale, 0, 0, -scale, x, baseline)))
            x += hmtx[glyph][0] * scale + TRACK * em
    return path.getCommands(), x - TRACK * em, bounds.bounds


def svg(width, height, body):
    return (
        f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" fill="none" '
        f'xmlns="http://www.w3.org/2000/svg">\n{body}\n</svg>\n'
    )


def main():
    # The name alone, framed from the top of its letters to the bottom of its rounds.
    _, _, (_, top, _, _) = name(100, 0, 0)
    path, end, (left, _, right, bottom) = name(100, 0, -top)
    width, height = round(end, 2), round(bottom, 2)
    (BRAND / "elio-blocks-wordmark.svg").write_text(svg(width, height, f'<path d="{path}" fill="currentColor"/>'))
    print(f"wordmark {width} x {height}, ink {left:.2f} to {right:.2f}, capitals {-top - 100:.2f} to {-top:.2f}")

    tile = re.search(r"<svg[^>]*>\n?([\s\S]*?)\n?</svg>", TILE_SOURCE.read_text()).group(1)
    cap = RATIO * TILE
    path, end, (left, _, right, _) = name(cap, TILE * (1 + GAP), TILE / 2 + cap / 2)
    width = math.ceil(end)
    for file, color in (("elio-blocks-logo.svg", "#1A1611"), ("elio-blocks-logo-light.svg", "#FFFFFF")):
        (BRAND / file).write_text(svg(width, TILE, f'{tile}\n<path d="{path}" fill="{color}"/>'))
    print(f"logo {width} x {TILE}, ink of the name from {left:.2f} ({(left - TILE) / TILE:.3f} of the tile after it)")


if __name__ == "__main__":
    main()
