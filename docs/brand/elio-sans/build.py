# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]>=4.55", "ufoLib2", "ufo2ft"]
# ///
"""Elio Sans: a geometric display sans for the logo, variable in weight.

Each letter is a skeleton (the centerlines of its strokes) drawn as a function
of the stroke width, then expanded at the width of each master with the same
structure, so the masters interpolate: the wght axis. Strokes overlap where they
meet, as a pen would draw them. Horizontals are thinner than verticals
(`contrast`), the lowercase rounds are squarish (`K`), as the tile of the logo, and the
capitals wide and round, as Chillax's.

    uv run docs/brand/elio-sans/build.py
"""

import base64
import math
from pathlib import Path

import ufo2ft
from fontTools.designspaceLib import (
    AxisDescriptor,
    DesignSpaceDocument,
    InstanceDescriptor,
    SourceDescriptor,
)
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib.tables._g_l_y_f import flagOverlapSimple
from ufoLib2 import Font

HERE = Path(__file__).parent
FAMILY = "Elio Sans"
UPM = 1000
XH, CAP, ASC, OS = 540, 740, 740, 10
# wght → stem width.
MASTERS = {300: 56, 900: 170}
INSTANCES = {300: "Light", 400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold",
             900: "Black"}
# Handle of a quarter arc, as a fraction of its box: 0.552 draws a circle, more a squarer round.
K = 0.62
# The capitals are rounder, as Chillax's.
K_CAP = 0.57


# Geometry ------------------------------------------------------------------

def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def mul(a, k):
    return (a[0] * k, a[1] * k)


def lerp(a, b, t):
    return add(a, mul(sub(b, a), t))


def norm(a):
    return math.hypot(a[0], a[1])


def unit(a):
    n = norm(a)
    return (a[0] / n, a[1] / n)


def left(t):
    return (-t[1], t[0])


def line(a, b):
    return (a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b)


def arc(a, b, corner, k=K):
    """Quarter round from a to b inside the box whose third corner is `corner`."""
    return (a, lerp(a, corner, k), lerp(b, corner, k), b)


def split(seg, t):
    p0, p1, p2, p3 = seg
    a, b, c = lerp(p0, p1, t), lerp(p1, p2, t), lerp(p2, p3, t)
    d, e = lerp(a, b, t), lerp(b, c, t)
    f = lerp(d, e, t)
    return (p0, a, d, f), (f, e, c, p3)


def catmull_rom(points):
    """Open centripetal Catmull-Rom spline through `points`, as cubic segments."""
    p = [add(points[0], sub(points[0], points[1]))] + list(points)
    p.append(add(points[-1], sub(points[-1], points[-2])))
    segments = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        d1, d2, d3 = (math.sqrt(norm(sub(b, a))) for a, b in ((p0, p1), (p1, p2), (p2, p3)))
        b1 = mul(add(add(mul(p2, d1 * d1), mul(p0, -d2 * d2)), mul(p1, 2 * d1 * d1 + 3 * d1 * d2 + d2 * d2)),
                 1 / (3 * d1 * (d1 + d2)))
        b2 = mul(add(add(mul(p1, d3 * d3), mul(p3, -d2 * d2)), mul(p2, 2 * d3 * d3 + 3 * d3 * d2 + d2 * d2)),
                 1 / (3 * d3 * (d3 + d2)))
        segments.append((p1, b1, b2, p2))
    return segments


# Pieces of each segment, counted on the first master and reused for the others,
# whose rounds turn a little differently: the masters keep the same points.
SUBDIVISIONS = {}


def subdivide(seg, key):
    """Pieces of at most 12° of turn each: one cubic follows the offset of each of them closely,
    even on the inside of the tightest curves of the heaviest weight."""
    if key not in SUBDIVISIONS:
        legs = [leg for leg in (sub(seg[1], seg[0]), sub(seg[2], seg[1]), sub(seg[3], seg[2])) if norm(leg) > 1e-6]
        turn = sum(abs(math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]))
                   for a, b in zip(legs, legs[1:]))
        SUBDIVISIONS[key] = max(1, math.ceil(math.degrees(turn) / 12))
    n = SUBDIVISIONS[key]
    pieces = []
    for i in range(n, 1, -1):
        head, seg = split(seg, 1 / i)
        pieces.append(head)
    return pieces + [seg]


def tangents(seg):
    p0, p1, p2, p3 = seg
    t0 = sub(p1, p0) if norm(sub(p1, p0)) > 1e-6 else sub(p2, p0)
    t1 = sub(p3, p2) if norm(sub(p3, p2)) > 1e-6 else sub(p3, p1)
    return unit(t0), unit(t1)


def reverse(seg):
    return tuple(reversed(seg))


def offset(seg, half):
    """Offset of a cubic to its left, at the distance `half` gives for the tangent at each point."""
    p0, p1, p2, p3 = seg

    def at(t):
        u = 1 - t
        pos = add(add(mul(p0, u ** 3), mul(p1, 3 * u * u * t)), add(mul(p2, 3 * u * t * t), mul(p3, t ** 3)))
        speed = add(add(mul(sub(p1, p0), u * u), mul(sub(p2, p1), 2 * u * t)), mul(sub(p3, p2), t * t))
        tangent = unit(speed) if norm(speed) > 1e-9 else tangents(seg)[0 if t < 0.5 else 1]
        return add(pos, mul(left(tangent), half(tangent)))

    # Hermite: the handles follow the derivative of the offset curve, the change of width included.
    e = 1e-4
    q0, q3 = at(0), at(1)
    return [q0, add(q0, mul(sub(at(e), q0), 1 / (3 * e))), sub(q3, mul(sub(q3, at(1 - e)), 1 / (3 * e))), q3]


def cut(curve, end, t, point, kind):
    """Slide the end of a side curve along the stroke so the cap is horizontal ('h') or vertical ('v')."""
    axis = {"h": 1, "v": 0}.get(kind)
    if axis is None or abs(t[axis]) < 0.5:
        return
    move = mul(t, (point[axis] - curve[end][axis]) / t[axis])
    handle = 2 if end == 3 else 1
    curve[end], curve[handle] = add(curve[end], move), add(curve[handle], move)


def expand_open(segs, half, caps, key):
    """Outline of an open stroke: left side, end cap, right side back, start cap."""
    pieces = [piece for i, seg in enumerate(segs) for piece in subdivide(seg, (*key, i))]
    lefts = [offset(piece, half) for piece in pieces]
    rights = [offset(reverse(piece), half) for piece in reversed(pieces)]
    start, end = pieces[0][0], pieces[-1][3]
    t_start, t_end = tangents(pieces[0])[0], tangents(pieces[-1])[1]
    cut(lefts[0], 0, t_start, start, caps[0])
    cut(rights[-1], 3, t_start, start, caps[0])
    cut(lefts[-1], 3, t_end, end, caps[1])
    cut(rights[0], 0, t_end, end, caps[1])
    return [lefts + [[lefts[-1][3], None, None, rights[0][0]]] + rights
            + [[rights[-1][3], None, None, lefts[0][0]]]]


def expand_closed(segs, half, key):
    """Outlines of a closed stroke: its outer and its inner side."""
    pieces = [piece for i, seg in enumerate(segs) for piece in subdivide(seg, (*key, i))]
    contours = [[offset(piece, half) for piece in pieces],
                [offset(reverse(piece), half) for piece in reversed(pieces)]]
    for contour in contours:
        contour[-1][3] = contour[0][0]
    return contours


def disk(center, r):
    x, y = center
    pts = [(x + r, y), (x, y + r), (x - r, y), (x, y - r)]
    corners = [(x + r, y + r), (x - r, y + r), (x - r, y - r), (x + r, y - r)]
    contour = [list(arc(pts[i], pts[(i + 1) % 4], corners[i], 0.5523)) for i in range(4)]
    contour[-1][3] = contour[0][0]
    return contour


def area(contour):
    pts = [p for seg in contour for p in (seg[0], seg[1], seg[2]) if p is not None]
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(pts, pts[1:] + pts[:1])) / 2


def emit(pen, contour, ccw):
    if (area(contour) > 0) != ccw:
        contour = [list(reversed(seg)) for seg in reversed(contour)]
    pen.moveTo(contour[0][0])
    for _, c1, c2, p in contour:
        if c1 is None:
            pen.lineTo(p)
        else:
            pen.curveTo(c1, c2, p)
    pen.closePath()


# Letters -------------------------------------------------------------------
# Each takes the stem width w and the contrast, and returns its strokes, its
# disks and its side bearings. x = 0 is the left of the skeleton.

def stem(x, y0, y1):
    return ("open", [line((x, y0), (x, y1))], ("butt", "butt"))


def bowl(cx, cy, rx, ry, k):
    r, t, lt, b = (cx + rx, cy), (cx, cy + ry), (cx - rx, cy), (cx, cy - ry)
    return [arc(r, t, (cx + rx, cy + ry), k), arc(t, lt, (cx - rx, cy + ry), k),
            arc(lt, b, (cx - rx, cy - ry), k), arc(b, r, (cx + rx, cy - ry), k)]


def round_box(w, c, height, half_width):
    """Skeleton radii of a round whose outer edges reach half_width and the overshoots."""
    return half_width - w / 2, height / 2 + OS - w / 2 * (1 - c)


def sb(kind, w):
    return {"stem": 50 + 0.25 * w, "round": 32 + 0.15 * w, "open": 18 + 0.1 * w}[kind]


def letter_o(w, c, height, half_width, k=K):
    rx, ry = round_box(w, c, height, half_width)
    return [("closed", bowl(rx, height / 2, rx, ry, k))], [], (sb("round", w), sb("round", w))


def letter_c(w, c, height, half_width, k=K):
    rx, ry = round_box(w, c, height, half_width)
    q1, q2, q3, q4 = bowl(rx, height / 2, rx, ry, k)
    segs = [split(q1, 0.42)[1], q2, q3, split(q4, 0.58)[0]]
    return [("open", segs, ("butt", "butt"))], [], (sb("round", w), sb("open", w))


def letter_s(w, c, height, width, k=K):
    """On the balance of Chillax's S, measured on its centerline: round bowls, the upper one a little narrower
    and shorter, a spine crossing the middle at S_SLOPE, a little above it. S_POINTS places the terminals, the
    sides and the middle of the spine as fractions of the box of the skeleton (x from the left, y from the
    bottom)."""
    dv, dh = w / 2, w / 2 * (1 - c)
    x0, x1 = dv, width - dv
    yb, yt = -OS + dh, height + OS - dh

    def at(name):
        u, v = S_POINTS[name]
        return (x0 + u * (x1 - x0), yb + v * (yt - yb))

    top, bottom, middle = at("top"), at("bottom"), at("middle")
    left, right = at("upper side"), at("lower side")
    upper_right = (x1 - (left[0] - x0), left[1])  # the side of the upper bowl the terminal is cut from
    lower_left = (x0, right[1])
    slope = (math.cos(math.radians(S_SLOPE)), -math.sin(math.radians(S_SLOPE)))

    def cut_at(seg, y):
        """The parameter where a quarter round reaches the height y, by bisection."""
        low, high = 0.0, 1.0
        rising = seg[3][1] > seg[0][1]
        for _ in range(40):
            mid = (low + high) / 2
            if (split(seg, mid)[0][3][1] < y) == rising:
                low = mid
            else:
                high = mid
        return low

    first = arc(upper_right, top, (upper_right[0], top[1]), k)
    last = arc(bottom, lower_left, (lower_left[0], bottom[1]), k)
    segs = [
        split(first, cut_at(first, at("upper terminal")[1]))[1],
        arc(top, left, (left[0], top[1]), k),
        (left, sub(left, (0, S_EASE * (left[1] - middle[1]))),
         sub(middle, mul(slope, S_REACH * norm(sub(middle, left)))), middle),
        (middle, add(middle, mul(slope, S_REACH * norm(sub(right, middle)))),
         add(right, (0, S_EASE * (middle[1] - right[1]))), right),
        arc(right, bottom, (right[0], bottom[1]), k),
        split(last, cut_at(last, at("lower terminal")[1]))[0],
    ]
    return [("open", segs, ("butt", "butt"))], [], (sb("round", w) - 8, sb("round", w) - 8)


S_POINTS = {
    "upper terminal": (0.95, 0.825),
    "top": (0.5, 1.0),
    "upper side": (0.052, 0.743),
    "middle": (0.5, 0.519),
    "lower side": (1.0, 0.266),
    "bottom": (0.5, 0.0),
    "lower terminal": (0.0, 0.202),
}
S_SLOPE, S_EASE, S_REACH = 16, 0.6, 0.45


def letter_k(w, c, height, ascender, arm, leg):
    j, t = (0, 0.37 * height), (arm, height)
    return [stem(0, 0, ascender), ("open", [line(j, t)], ("butt", "h")),
            ("open", [line(lerp(j, t, 0.42), (leg, 0))], ("butt", "h"))], [], (sb("stem", w), sb("open", w))


def letter_b(w, c):
    dh = w / 2 * (1 - c)
    top, mid, bottom = CAP - dh, CAP * 0.54, dh
    # Wide at every weight, as Chillax's: 0.66 of the cap height in Light, 0.83 in Black.
    upper, lower = 378 + 0.08 * w, 426 + 0.1 * w
    # Vertical radii of the bowls, and their horizontal radii, wider: bowls that bulge.
    ru, rl = (top - mid) / 2, (mid - bottom) / 2
    hu, hl = 1.2 * ru, 1.15 * rl
    return [
        stem(0, 0, CAP),
        ("open", [line((0, top), (upper - hu, top)), arc((upper - hu, top), (upper, top - ru), (upper, top), K_CAP),
                  arc((upper, top - ru), (upper - hu, mid), (upper, mid), K_CAP), line((upper - hu, mid), (0, mid))],
         ("butt", "butt")),
        ("open", [line((0, mid), (lower - hl, mid)), arc((lower - hl, mid), (lower, mid - rl), (lower, mid), K_CAP),
                  arc((lower, mid - rl), (lower - hl, bottom), (lower, bottom), K_CAP),
                  line((lower - hl, bottom), (0, bottom))],
         ("butt", "butt")),
    ], [], (sb("stem", w), sb("round", w))


def rounded_stem(w, top, bottom):
    """A cap-height stem whose outer left corners are rounded, as Chillax's. Its arms start at `flat`, where
    its top or bottom is flat again, so their square corners stay inside the round."""
    dv, r = w / 2, 0.9 * w
    flat = r - dv
    contour = [[(dv, 0), None, None, (dv, CAP)]]
    if top:
        contour += [[(dv, CAP), None, None, (flat, CAP)], list(arc((flat, CAP), (-dv, CAP - r), (-dv, CAP), K_CAP))]
    else:
        contour += [[(dv, CAP), None, None, (-dv, CAP)]]
    contour += [[contour[-1][3], None, None, (-dv, r if bottom else 0)]]
    if bottom:
        contour += [list(arc((-dv, r), (flat, 0), (-dv, 0), K_CAP)), [(flat, 0), None, None, (dv, 0)]]
    else:
        contour += [[(-dv, 0), None, None, (dv, 0)]]
    return ("shape", contour), flat


def letter_e(w, c):
    dh = w / 2 * (1 - c)
    spine, flat = rounded_stem(w, top=True, bottom=True)
    arms = [(flat, CAP - dh, 330 + 0.45 * w), (0, CAP * 0.52, 300 + 0.4 * w), (flat, dh, 350 + 0.48 * w)]
    return [spine] + [("open", [line((x0, y), (x1, y))], ("butt", "butt")) for x0, y, x1 in arms], [], \
        (sb("stem", w), sb("open", w))


def letter_l_cap(w, c):
    dh = w / 2 * (1 - c)
    spine, flat = rounded_stem(w, top=False, bottom=True)
    return [spine, ("open", [line((flat, dh), (330 + 0.48 * w, dh))], ("butt", "butt"))], [], \
        (sb("stem", w), sb("open", w))


def letter_i(w, c):
    r = 0.6 * w + 4
    return [stem(0, 0, XH)], [((0, XH + 95 - 0.15 * w + r), r)], (sb("stem", w), sb("stem", w))


GLYPHS = {
    "E": lambda w, c: letter_e(w, c),
    "l": lambda w, c: ([stem(0, 0, ASC)], [], (sb("stem", w), sb("stem", w))),
    "i": letter_i,
    "o": lambda w, c: letter_o(w, c, XH, 258 + 0.3 * w),
    "B": letter_b,
    "c": lambda w, c: letter_c(w, c, XH, 245 + 0.3 * w),
    "k": lambda w, c: letter_k(w, c, XH, ASC, 285 + 0.45 * w, 300 + 0.5 * w),
    "s": lambda w, c: letter_s(w, c, XH, 400 + 0.3 * w),
    "L": letter_l_cap,
    "I": lambda w, c: ([stem(0, 0, CAP)], [], (sb("stem", w), sb("stem", w))),
    "O": lambda w, c: letter_o(w, c, CAP, 362 + 0.3 * w, K_CAP),
    "C": lambda w, c: letter_c(w, c, CAP, 345 + 0.3 * w, K_CAP),
    "K": lambda w, c: letter_k(w, c, CAP, CAP, 400 + 0.45 * w, 420 + 0.5 * w),
    "S": lambda w, c: letter_s(w, c, CAP, 480 + 0.75 * w, K_CAP),
}


# Font ----------------------------------------------------------------------

# Stroke of a letter at the heaviest weight, as a fraction of the stem.
LIGHTER = {"s": 0.75}


def contrast(w):
    """Horizontals thinner than verticals, more so as the weight grows."""
    return 0.06 + 0.0012 * (w - 50)


def draw_glyph(ufo, name, w):
    # The bold s turns tighter than its stroke: it is drawn a little lighter, as type designers do.
    w *= 1 - (1 - LIGHTER.get(name, 1)) * (w - min(MASTERS.values())) / (max(MASTERS.values()) - min(MASTERS.values()))
    c = contrast(w)
    strokes, disks, (lsb, rsb) = GLYPHS[name](w, c)

    def half(t):
        # To the 4th power: the stroke keeps its width around the verticals, so the inside of a tight round
        # does not wave where it thins.
        return w / 2 * (1 - c * t[0] ** 4)

    body = RecordingPen()
    for n, (kind, segs, *caps) in enumerate(strokes):
        key = (name, n)
        if kind == "shape":
            contours = [segs]
        elif kind == "open":
            contours = expand_open(segs, half, caps[0], key)
        else:
            contours = expand_closed(segs, half, key)
        outer = max(contours, key=lambda contour: abs(area(contour)))
        for contour in contours:
            # Counter-clockwise outlines, clockwise counters (PostScript direction).
            emit(body, contour, ccw=contour is outer)
    bounds = BoundsPen(None)
    body.replay(bounds)
    xmin, _, xmax, _ = bounds.bounds
    glyph = ufo.newGlyph(name)
    glyph.unicodes = [ord(name)]
    glyph.width = round(xmax - xmin + lsb + rsb)
    pen = TransformPen(glyph.getPen(), (1, 0, 0, 1, lsb - xmin, 0))
    body.replay(pen)
    for center, r in disks:
        emit(pen, disk(center, r), ccw=True)


def build_master(wght, w):
    ufo = Font()
    ufo.info.familyName = FAMILY
    ufo.info.styleName = INSTANCES[wght]
    ufo.info.unitsPerEm = UPM
    ufo.info.ascender = 900
    ufo.info.descender = -240
    ufo.info.xHeight = XH
    ufo.info.capHeight = CAP
    ufo.info.versionMajor, ufo.info.versionMinor = 0, 1
    ufo.info.copyright = "Copyright 2026 Alexandre Buffet"
    ufo.info.openTypeOS2WeightClass = wght
    for name in GLYPHS:
        draw_glyph(ufo, name, w)
    space = ufo.newGlyph("space")
    space.unicodes = [0x20]
    space.width = round(240 + 0.2 * w)
    return ufo


def build():
    doc = DesignSpaceDocument()
    doc.addAxis(AxisDescriptor(tag="wght", name="Weight", minimum=min(MASTERS), default=min(MASTERS),
                               maximum=max(MASTERS)))
    for wght, w in MASTERS.items():
        doc.addSource(SourceDescriptor(font=build_master(wght, w), location={"Weight": wght}, name=f"master.{wght}",
                                       familyName=FAMILY, styleName=INSTANCES[wght]))
    for wght, style in INSTANCES.items():
        doc.addInstance(InstanceDescriptor(familyName=FAMILY, styleName=style, location={"Weight": wght}))
    font = ufo2ft.compileVariableTTF(doc)
    # Strokes overlap: tell the rasterizers so.
    for name in font.getGlyphOrder():
        glyph = font["glyf"][name]
        if glyph.numberOfContours > 0:
            glyph.flags[0] |= flagOverlapSimple
    ttf = HERE / "ElioSans[wght].ttf"
    font.save(ttf)
    font.flavor = "woff2"
    woff2 = HERE / "ElioSans[wght].woff2"
    font.save(woff2)
    specimen = (HERE / "specimen.template.html").read_text()
    data = base64.b64encode(woff2.read_bytes()).decode()
    (HERE / "specimen.html").write_text(specimen.replace("{{FONT}}", data))
    print(f"{ttf.name}: {ttf.stat().st_size} B, {woff2.name}: {woff2.stat().st_size} B")


if __name__ == "__main__":
    build()
