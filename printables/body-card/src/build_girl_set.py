#!/usr/bin/env python3
"""
يبني مجموعة «اقصص وركّب» للفتاة (سنتان) — طبقات الجسم والهيكل والأعضاء،
مع بطاقات منفصلة للرأس واليد والرجل.

    python3 src/build_girl_set.py

المخرجات:
    girl-card-a4.svg       صفحة ١ — البطاقة المقلوبة (فتاة / هيكل)
    girl-organs-a4.svg     صفحة ٢ — طبقة الأعضاء + مفتاح الأسماء
    girl-parts-a4.svg      صفحة ٣ — بطاقات القص: الرأس، اليد، الرجل
    girl-activity-a4.svg   صفحة ٤ — ورقة نشاط (تسمية + تلوين)
"""
from __future__ import annotations

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

W, H = 794, 1123

INK = "#2B2F57"
INK_SOFT = "#6C719A"
CREAM = "#FFFCF6"
ROSE = "#FFF0F6"
ROSE_SOFT = "#FFE3EF"
MINT = "#EDF7F1"
LINE = "#E3D9EA"
PINK = "#E85D96"
PINK_DARK = "#C7407A"
VIOLET = "#6C5CE7"

FONT_HEAD = "BalooAR"
FONT_BODY = "CairoAR"


# --------------------------------------------------------------------------- #
def viewbox(path: pathlib.Path) -> tuple[float, float]:
    """يرجع (عرض، ارتفاع) من viewBox للملف."""
    src = path.read_text(encoding="utf-8")
    m = re.search(r'viewBox="([\d.\-\s]+)"', src)
    if not m:
        return 400.0, 800.0
    parts = [float(v) for v in m.group(1).replace(",", " ").split()]
    return parts[2], parts[3]


def clipped_svg(path: pathlib.Path, uid: str) -> str:
    """يرجع محتوى SVG مقصوصًا على حدود viewBox (اللازم عند التضمين داخل SVG آخر)."""
    vw, vh = viewbox(path)
    body = inner_svg(path)
    return (f'<defs><clipPath id="{uid}"><rect x="0" y="0" '
            f'width="{vw}" height="{vh}"/></clipPath></defs>'
            f'<g clip-path="url(#{uid})">{body}</g>')


def inner_svg(path: pathlib.Path) -> str:
    src = path.read_text(encoding="utf-8")
    body = re.sub(r"^.*?<svg[^>]*>", "", src, flags=re.S)
    return body.rsplit("</svg>", 1)[0]


def text(x, y, s, size=16, weight=400, fill=INK, anchor="middle",
         family=FONT_BODY):
    return (f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
            f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" '
            f'direction="rtl">{s}</text>')


def rect(x, y, w, h, r, fill, stroke="none", sw=1, extra=""):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')


def badge(x, y, label, w=190, fill=ROSE_SOFT, color=PINK_DARK, anchor="start"):
    """شارة صغيرة؛ anchor='start' يعني أن النص يبدأ من اليمين (RTL)."""
    tx = x + 16 if anchor == "start" else x + w - 16
    return (rect(x, y, w, 30, 15, fill)
            + text(tx, y + 20.5, label, 13.5, 600, color,
                   "start" if anchor == "start" else "end"))


SCISSORS = """
<g transform="translate({x},{y})" fill="none" stroke="{c}" stroke-width="2.4"
   stroke-linecap="round" stroke-linejoin="round">
  <circle cx="-4.6" cy="-4.6" r="3.3"/><circle cx="-4.6" cy="4.6" r="3.3"/>
  <path d="M-1.4 -3 L10 4.6"/><path d="M-1.4 3 L10 -4.6"/>
</g>"""


def dashed_cut(x1, y1, x2, y2, c="#C9BFD6"):
    return (f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{c}" stroke-width="1.8" '
            f'stroke-dasharray="7 8" stroke-linecap="round"/>')


def header(title, subtitle, badges, accent=PINK_DARK):
    out = [text(W - 40, 74, title, 38, 700, INK, "end", FONT_HEAD),
           text(W - 40, 104, subtitle, 15.5, 400, INK_SOFT, "end")]
    for i, b in enumerate(badges):
        out.append(badge(40, 44 + i * 40, b))
    return "\n".join(out)


def page_frame():
    return (f'<rect width="{W}" height="{H}" fill="{CREAM}"/>'
            f'<rect x="18" y="18" width="{W-36}" height="{H-36}" rx="26" '
            f'fill="none" stroke="{LINE}" stroke-width="1.6"/>')


def footer(msg):
    return text(W / 2, H - 26, msg, 11.5, 400, INK_SOFT)


# --------------------------------------------------------------------------- #
def build_card() -> str:
    girl = inner_svg(ASSETS / "girl.svg")
    skel = inner_svg(ASSETS / "girl-skeleton.svg")

    PAD = 40
    panel_w = 344
    p1x, p2x = PAD, W - PAD - panel_w
    py, ph = 168, 742
    scale = 0.735
    fig_w = 400 * scale
    fig_y = py + 92

    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" '
             f'height="297mm" viewBox="0 0 {W} {H}">', page_frame(),
             header("جِسمي مِن الدَّاخل", "اقلب البطاقة… لتكتشف ما تحت الجلد!",
                    ["نشاط علوم  •  سنتان", "صفحة ١ من ٤  •  اطبع ثم اقصص"])]

    for x, tint, kicker, cap, color, body in (
        (p1x, "#EDF6FF", "مِن الخارِج", "نُور", "#2A5CC4", girl),
        (p2x, ROSE, "مِن الدَّاخل", "هَيكَل نُور", PINK_DARK, skel),
    ):
        parts.append(rect(x, py, panel_w, ph, 24, tint))
        parts.append(rect(x, py, panel_w, 50, 22, "#FFFFFF", extra='opacity="0.92"'))
        parts.append(text(x + panel_w / 2, py + 33, kicker, 18, 700, color,
                          "middle", FONT_HEAD))
        parts.append(rect(x + 12, py + 60, panel_w - 24, ph - 132, 18, "#FFFFFF",
                          extra='opacity="0.45"'))
        parts.append(f'<g transform="translate({x + (panel_w - fig_w) / 2:.1f},'
                     f'{fig_y}) scale({scale})">{body}</g>')
        parts.append(text(x + panel_w / 2, py + ph - 28, cap, 25, 700, INK,
                          "middle", FONT_HEAD))

    fold_x = (p1x + panel_w + p2x) / 2
    parts.append(dashed_cut(fold_x, py + 12, fold_x, py + ph - 8, "#C2B8D2"))
    parts.append(SCISSORS.format(x=fold_x, y=py - 12, c="#9A8FB5"))

    by = py + ph + 16
    parts.append(rect(PAD, by, W - 2 * PAD, 84, 18, ROSE))
    steps = [("١", "اطبع على ورق A4 سميك"), ("٢", "اقصص على الخط المنقّط"),
             ("٣", "الصق الوجهين ظهرًا لظهر")]
    seg = (W - 2 * PAD) / 3
    for i, (n, label) in enumerate(steps):
        right = W - PAD - seg * i - 18
        parts.append(f'<circle cx="{right - 16}" cy="{by+42}" r="16" '
                     f'fill="{PINK}" opacity="{1 - i * 0.16:.2f}"/>')
        parts.append(text(right - 16, by + 48.5, n, 18, 700, "#FFFFFF",
                          "middle", FONT_HEAD))
        parts.append(text(right - 42, by + 48, label, 14, 600, INK, "end"))

    parts += [footer("بطاقة تعليمية قابلة للطباعة  •  اقصص الوجهين ثم الصقهما "
                     "ظهرًا لظهر لتحصل على بطاقة تُقلَب"), "</svg>"]
    return "\n".join(parts)


# --------------------------------------------------------------------------- #
def build_organs_page() -> str:
    organs = inner_svg(ASSETS / "girl-organs.svg")
    PAD = 40
    scale = 0.78
    fig_w = 400 * scale
    fx = PAD + 40
    fy = 190

    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" '
             f'height="297mm" viewBox="0 0 {W} {H}">', page_frame(),
             header("أعضاء نُور الدَّاخليّة",
                    "طبقة الأعضاء مطابقة لموضعها في الجسم — اقصصها وضعها فوق البطاقة.",
                    ["نشاط علوم  •  سنتان", "صفحة ٢ من ٤  •  طبقة الأعضاء"])]

    parts.append(rect(PAD, 168, 360, 640, 24, ROSE))
    parts.append(f'<g transform="translate({fx},{fy}) scale({scale})">{organs}</g>')

    # مفتاح الأسماء
    key_x = 452
    parts.append(text(W - 40, 196, "مِفتاح الأعضاء", 24, 700, INK, "end",
                      FONT_HEAD))
    items = [
        ("١", "الدماغ", "#FFB7C8"),
        ("٢", "الرئتان", "#FF9DB1"),
        ("٣", "القلب", "#E8455F"),
        ("٤", "الكبد", "#A75F3D"),
        ("٥", "المعدة", "#F2A35F"),
        ("٦", "الكليتان", "#B16246"),
        ("٧", "الأمعاء", "#F2A38B"),
        ("٨", "المثانة", "#F6D07C"),
    ]
    for i, (n, name, color) in enumerate(items):
        y = 236 + i * 62
        parts.append(rect(key_x, y - 26, W - PAD - key_x, 50, 14, "#FFFFFF",
                          stroke=LINE, sw=1.2))
        parts.append(f'<circle cx="{W-PAD-30}" cy="{y}" r="15" fill="{color}"/>')
        parts.append(text(W - PAD - 30, y + 5.6, n, 15, 700, "#FFFFFF", "middle",
                          FONT_HEAD))
        parts.append(text(W - PAD - 58, y + 6, name, 17, 600, INK, "end"))

    ty = 760
    parts.append(rect(PAD, ty, W - 2 * PAD, 110, 18, MINT))
    parts.append(text(W - PAD - 24, ty + 36, "طريقة التركيب", 18, 700,
                      PINK_DARK, "end", FONT_HEAD))
    parts.append(text(W - PAD - 24, ty + 68,
                      "اطبع هذه الصفحة على ورق شفاف (أو اقصص الأعضاء وحدها)، ثم ضعها",
                      13.5, 600, "#2C6B4F", "end"))
    parts.append(text(W - PAD - 24, ty + 92,
                      "فوق بطاقة الهيكل لتتكوّن صورة كاملة للجسم من الداخل.",
                      13.5, 600, "#2C6B4F", "end"))

    parts += [footer("نصيحة: اطبع الصفحة على ورق شفاف (Overhead) لتحصل على طبقة "
                     "تُركَّب فوق الهيكل مباشرة"), "</svg>"]
    return "\n".join(parts)


# --------------------------------------------------------------------------- #
def build_parts_page() -> str:
    part_files = {
        "head": ASSETS / "girl-part-head.svg",
        "hand": ASSETS / "girl-part-hand.svg",
        "leg": ASSETS / "girl-part-leg.svg",
    }
    head = clipped_svg(part_files["head"], "clipHead")
    hand = clipped_svg(part_files["hand"], "clipHand")
    leg = clipped_svg(part_files["leg"], "clipLeg")

    PAD = 40
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" '
             f'height="297mm" viewBox="0 0 {W} {H}">', page_frame(),
             header("اقصص ورَكّب: الرَّأس • اليَد • الرِّجل",
                    "ثلاث بطاقات منفصلة — اقصصها من الإطار المنقّط.",
                    ["نشاط قصّ ولصق  •  سنتان", "صفحة ٣ من ٤  •  بطاقات الأجزاء"])]

    cards = [
        ("الرَّأس", "الجُمجُمة والبَيَضة",
         "الدماغ داخل الجمجمة، والعينان في تجويفهما.", head,
         "#EAF4FF", "#2A5CC4", viewbox(part_files["head"])),
        ("اليَد", "عِظام الكَفّ والأصابِع",
         "٢٧ عظمة صغيرة في كل يد تتحرّك معًا.", hand,
         "#FFF3E8", "#C26A2E", viewbox(part_files["hand"])),
        ("الرِّجل", "عَظم الفَخذ والرُّكبة والقَدَم",
         "أطول عظمة في الجسم هي عظم الفخذ.", leg,
         "#F3EFFF", VIOLET, viewbox(part_files["leg"])),
    ]

    margin = 34
    gap = 16
    card_w = (W - 2 * margin - 2 * gap) / 3
    card_h = 720
    top = 176

    for i, (title, sub, note, body, tint, accent, (vw, vh)) in enumerate(cards):
        x = W - margin - card_w - i * (card_w + gap)      # من اليمين لليسار
        parts.append(rect(x, top, card_w, card_h, 22, tint))
        parts.append(rect(x, top, card_w, 62, 20, "#FFFFFF", extra='opacity="0.9"'))
        parts.append(text(x + card_w / 2, top + 30, title, 24, 700, INK,
                          "middle", FONT_HEAD))
        parts.append(text(x + card_w / 2, top + 52, sub, 12, 600, accent,
                          "middle"))

        # منطقة الرسم
        box_y = top + 74
        box_h = 470
        # ظل ناعم أسفل الرسم ليعطي عمقًا
        parts.append(f'<ellipse cx="{x + card_w/2}" cy="{box_y + box_h - 40}" '
                     f'rx="{card_w*0.28:.1f}" ry="10" fill="{accent}" opacity="0.07"/>')
        parts.append(rect(x + 12, box_y, card_w - 24, box_h, 16, "#FFFFFF"))
        bw = card_w - 36
        bh = box_h - 24
        k = min(bw / vw, bh / vh)
        ox = x + 12 + (bw - vw * k) / 2
        oy = box_y + 12 + (bh - vh * k) / 2
        parts.append(f'<g transform="translate({ox:.2f},{oy:.2f}) '
                     f'scale({k:.4f})">{body}</g>')

        # الإطار المنقّط للقص
        parts.append(f'<rect x="{x}" y="{top}" width="{card_w}" '
                     f'height="{card_h}" rx="22" fill="none" stroke="#B9AFCB" '
                     f'stroke-width="1.8" stroke-dasharray="8 8"/>')
        parts.append(SCISSORS.format(x=x + 22, y=top - 10, c="#9A8FB5"))

        # ملاحظة
        ny = box_y + box_h + 22
        words = note.split(" ")
        line1, line2 = " ".join(words[:4]), " ".join(words[4:])
        parts.append(text(x + card_w / 2, ny + 12, line1, 12.5, 600, INK_SOFT))
        if line2:
            parts.append(text(x + card_w / 2, ny + 34, line2, 12.5, 600,
                              INK_SOFT))

        # سطر الاسم
        parts.append(f'<path d="M{x+24} {top+card_h-26} H{x+card_w-24}" '
                     f'stroke="#C9BFD6" stroke-width="1.6" '
                     f'stroke-dasharray="3 6"/>')
        parts.append(text(x + card_w - 24, top + card_h - 36, "اسمي:",
                          12.5, 600, INK_SOFT, "end"))

    parts += [footer("اقصص البطاقات الثلاث من الإطار المنقّط — كل بطاقة تُستخدم "
                     "وحدها أو تُلصق في دفتر النشاط"), "</svg>"]
    return "\n".join(parts)


# --------------------------------------------------------------------------- #
def build_activity() -> str:
    skel = inner_svg(ASSETS / "girl-skeleton.svg")
    PAD = 40
    RIGHT = W - PAD
    scale = 0.68
    fx, fy = 34, 196
    fig_scale = scale

    def px_(x):
        return fx + fig_scale * x

    def py_(y):
        return fy + fig_scale * y

    bones = [
        ("١", px_(284), py_(210)),   # الجمجمة
        ("٢", px_(276), py_(384)),   # القفص الصدري
        ("٣", px_(200), py_(452)),   # العمود الفقري
        ("٤", px_(272), py_(512)),   # الحوض
        ("٥", px_(258), py_(574)),   # عظم الفخذ
        ("٦", px_(96), py_(478)),    # عظام الذراع
    ]

    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" '
             f'height="297mm" viewBox="0 0 {W} {H}">', page_frame(),
             header("هيا نُسمّي العِظام!", "اكتب اسم كل عظم أمام رقمه، ثم لوّن الهيكل.",
                    ["ورقة نشاط  •  سنتان", "صفحة ٤ من ٤  •  تسمية وتلوين"])]

    parts.append(rect(PAD, 146, 324, 596, 24, ROSE))
    parts.append(f'<g transform="translate({fx},{fy}) scale({fig_scale})">{skel}</g>')

    for n, bx, by in bones:
        parts.append(f'<circle cx="{bx}" cy="{by}" r="16" fill="{PINK}" '
                     f'stroke="#FFFFFF" stroke-width="2.4"/>')
        parts.append(text(bx, by + 6, n, 16, 700, "#FFFFFF", "middle", FONT_HEAD))

    line_r, line_l = RIGHT - 44, 452
    for i, (n, _bx, _by) in enumerate(bones):
        y = 208 + i * 82
        parts.append(rect(RIGHT - 34, y - 23, 34, 34, 11, ROSE_SOFT))
        parts.append(text(RIGHT - 17, y + 2, n, 17, 700, PINK_DARK, "middle",
                          FONT_HEAD))
        parts.append(f'<path d="M{line_r} {y + 28} H{line_l}" stroke="#D3C6DD" '
                     f'stroke-width="1.8" stroke-dasharray="3 7" '
                     f'stroke-linecap="round"/>')

    # بنك الكلمات
    wy = 758
    parts.append(rect(PAD, wy, W - 2 * PAD, 112, 20, MINT))
    parts.append(text(RIGHT - 26, wy + 30, "بنك الكلمات — اختر الاسم المناسب:",
                      15.5, 700, "#1F6B4A", "end"))
    rows = [["الحَوض", "عَظم الفَخذ", "الجُمجُمة"],
            ["عِظام الذِّراع", "العَمود الفِقري", "القَفَص الصَّدري"]]
    avail = (W - 2 * PAD) - 52
    for r, group in enumerate(rows):
        widths = [max(76, len(w) * 9.2 + 34) for w in group]
        total = sum(widths) + 10 * (len(group) - 1)
        k = min(1.0, avail / total)
        widths = [w * k for w in widths]
        gap = min(46, (avail - sum(widths)) / (len(group) - 1))
        cr = RIGHT - 26
        for wd, cw in zip(group, widths):
            cr -= cw
            ty = wy + 46 + r * 38
            parts.append(rect(cr, ty, cw, 32, 16, "#FFFFFF", stroke="#B7DCC8",
                              sw=1.4))
            parts.append(text(cr + cw / 2, ty + 21.5, wd,
                              12.6 if k < 0.9 else 13.6, 600, "#1F6B4A"))
            cr -= gap

    ty = 892
    parts.append(rect(PAD, ty, W - 2 * PAD, 108, 20, "#FFF3E2"))
    parts.append(f'<circle cx="{RIGHT-34}" cy="{ty+34}" r="16" fill="#F5A524"/>')
    parts.append(text(RIGHT - 34, ty + 40.5, "؟", 20, 700, "#FFFFFF", "middle",
                      FONT_HEAD))
    parts.append(text(RIGHT - 60, ty + 40, "هَل تَعلَم؟", 19, 700, "#8A5A00",
                      "end", FONT_HEAD))
    parts.append(text(RIGHT - 26, ty + 70,
                      "في سنّ الثانية يمتلك الطفل نحو ٣٠٠ عظم، بعضها يلتحم لاحقًا",
                      13.5, 600, "#7A5418", "end"))
    parts.append(text(RIGHT - 26, ty + 93,
                      "حتى تصبح ٢٠٦ عظمة عند الشخص البالغ.",
                      13.5, 600, "#7A5418", "end"))

    parts.append(text(RIGHT, H - 56, "اسمي: ............................",
                      14, 600, INK_SOFT, "end"))
    parts.append(text(PAD + 210, H - 56, "الصف: .................",
                      14, 600, INK_SOFT, "start"))
    parts += ["</svg>"]
    return "\n".join(parts)


def main() -> None:
    outputs = {
        "girl-card-a4.svg": build_card(),
        "girl-organs-a4.svg": build_organs_page(),
        "girl-parts-a4.svg": build_parts_page(),
        "girl-activity-a4.svg": build_activity(),
    }
    for name, content in outputs.items():
        (ROOT / name).write_text(content, encoding="utf-8")
    print("تم إنشاء:", ", ".join(outputs))


if __name__ == "__main__":
    main()
