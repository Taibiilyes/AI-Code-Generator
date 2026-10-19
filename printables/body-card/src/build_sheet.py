#!/usr/bin/env python3
"""
يبني أوراق الطباعة (A4) لبطاقة «جسمي من الداخل» من ملفات SVG الأصلية.

    python3 src/build_sheet.py

يُنتج:
    card-a4.svg      صفحة 1 — البطاقة المطوية (من الخارج / من الداخل)
    activity-a4.svg  صفحة 2 — ورقة نشاط (تسمية العظام + هل تعلم)
    preview.png      صورة معاينة عالية الدقة لصفحة 1
"""
from __future__ import annotations

import re
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

# أبعاد A4 بنسبة 96dpi  →  210mm × 297mm
W, H = 794, 1123

INK = "#2B2F57"
INK_SOFT = "#6C719A"
CREAM = "#FFFCF6"
BLUE_TINT = "#EDF4FF"
VIOLET_TINT = "#F1EFFF"
ACCENT = "#2F6FED"
ACCENT_2 = "#7A5AF8"
LINE = "#D7DCEF"

FONT_HEAD = "BalooAR"
FONT_BODY = "CairoAR"


# --------------------------------------------------------------------------- #
# أدوات مساعدة
# --------------------------------------------------------------------------- #
def inner_svg(path: pathlib.Path) -> str:
    """يرجع محتوى ملف SVG بدون الوسم الخارجي، مع تمييز معرّفات التدرّجات."""
    src = path.read_text(encoding="utf-8")
    body = re.sub(r"^.*?<svg[^>]*>", "", src, flags=re.S)
    body = body.rsplit("</svg>", 1)[0]
    return body


def text(x, y, s, size=16, weight=400, fill=INK, anchor="middle",
         family=FONT_BODY, extra=""):
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" '
        f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" '
        f'direction="rtl" {extra}>{s}</text>'
    )


def rounded(x, y, w, h, r, fill, stroke="none", sw=1, extra=""):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" ry="{r}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>')


SCISSORS = """
<g transform="translate({x},{y})" fill="none" stroke="{c}" stroke-width="2.6"
   stroke-linecap="round" stroke-linejoin="round">
  <circle cx="-5" cy="-5" r="3.6"/><circle cx="-5" cy="5" r="3.6"/>
  <path d="M-1.6 -3.2 L11 5"/><path d="M-1.6 3.2 L11 -5"/>
  <circle cx="11.6" cy="-5.4" r="0.9" fill="{c}" stroke="none"/>
  <circle cx="11.6" cy="5.4" r="0.9" fill="{c}" stroke="none"/>
</g>"""


def badge(x, y, label, fill=BLUE_TINT, color="#2A5CC4", w=150, h=30):
    return (rounded(x, y, w, h, h / 2, fill)
            + text(x + w / 2, y + h / 2 + 5.4, label, 14, 600, color))


# --------------------------------------------------------------------------- #
# صفحة 1 — البطاقة
# --------------------------------------------------------------------------- #
def build_card() -> str:
    boy = inner_svg(ASSETS / "boy.svg")
    skel = inner_svg(ASSETS / "skeleton.svg")

    PAD = 40
    panel_w = 344
    p1x, p2x = PAD, W - PAD - panel_w
    py, ph = 176, 726
    fig_scale = 0.735
    fig_w, fig_h = 400 * fig_scale, 800 * fig_scale
    fig_y = py + 96

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" '
        f'viewBox="0 0 {W} {H}">',

        # خلفية
        f'<rect width="{W}" height="{H}" fill="{CREAM}"/>',
        f'<rect x="18" y="18" width="{W-36}" height="{H-36}" rx="26" '
        f'fill="none" stroke="{LINE}" stroke-width="1.6"/>',

        # -------------------------- الترويسة --------------------------
        text(W - PAD, 78, "جِسمي مِن الدَّاخل", 44, 700, INK, "end", FONT_HEAD),
        text(W - PAD, 112, "اقلب البطاقة… لتكتشف ما تحت الجلد!",
             18, 400, INK_SOFT, "end"),
        badge(PAD, 56, "نشاط علوم  •  ٤ – ٧ سنوات", w=196),
        badge(PAD, 96, "ورقة A4  •  اطبع ثم اقصص", fill=VIOLET_TINT,
              color="#6344C9", w=196),
        f'<path d="M{PAD} 146 H{W-PAD}" stroke="{LINE}" stroke-width="1.6" '
        f'stroke-dasharray="2 7" stroke-linecap="round"/>',
    ]

    # -------------------------- اللوحتان --------------------------
    for x, tint, kicker, cap, color, body_svg in (
        (p1x, BLUE_TINT, "مِن الخارِج", "وَلِيد", "#2A5CC4", boy),
        (p2x, VIOLET_TINT, "مِن الدَّاخل", "هَيكَل وَلِيد", "#6344C9", skel),
    ):
        parts.append(rounded(x, py, panel_w, ph, 24, tint))
        parts.append(rounded(x, py, panel_w, 50, 22, "#FFFFFF",
                             extra='opacity="0.9"'))
        parts.append(text(x + panel_w / 2, py + 34, kicker, 19, 700, color,
                          "middle", FONT_HEAD))
        # الإطار الداخلي
        parts.append(rounded(x + 12, py + 62, panel_w - 24, ph - 134, 18,
                             "#FFFFFF", extra='opacity="0.45"'))
        parts.append(
            f'<g transform="translate({x + (panel_w - fig_w) / 2:.2f},{fig_y}) '
            f'scale({fig_scale})">{body_svg}</g>'
        )
        parts.append(text(x + panel_w / 2, py + ph - 30, cap, 26, 700, INK,
                          "middle", FONT_HEAD))

    # -------------------------- خط الطيّ --------------------------
    fold_x = (p1x + panel_w + p2x) / 2
    parts.append(f'<path d="M{fold_x} {py+16} V{py+ph-10}" stroke="#B9C1DE" '
                 f'stroke-width="2" stroke-dasharray="9 9" '
                 f'stroke-linecap="round"/>')
    parts.append(SCISSORS.format(x=fold_x, y=py - 12, c="#8E97BE"))
    parts.append(f'<path d="M{fold_x} {py+ph-4} l-6 10 h12 z" fill="#8E97BE"/>')

    # -------------------------- شريط الخطوات --------------------------
    by = py + ph + 18
    parts.append(rounded(PAD, by, W - 2 * PAD, 88, 18, "#F6F4FF"))
    steps = [
        ("١", "اطبع على ورق A4 سميك"),
        ("٢", "اقصص على الخط المنقّط"),
        ("٣", "الصق الوجهين ظهرًا لظهر"),
    ]
    inner_w = (W - 2 * PAD) / 3
    for i, (num, label) in enumerate(steps):
        right = W - PAD - inner_w * i - 18        # يمين الشريحة (RTL)
        parts.append(f'<circle cx="{right - 17}" cy="{by+44}" r="17" '
                     f'fill="{ACCENT}" opacity="{1 - i * 0.18:.2f}"/>')
        parts.append(text(right - 17, by + 51, num, 19, 700, "#FFFFFF",
                          "middle", FONT_HEAD))
        parts.append(text(right - 44, by + 51, label, 14.5, 600, INK, "end"))

    # -------------------------- التذييل --------------------------
    parts.append(text(W / 2, H - 30,
                      "بطاقة تعليمية قابلة للطباعة  •  اقصص الوجهين ثم الصقهما ظهرًا لظهر "
                      "لتحصل على بطاقة تُقلَب", 12, 400, INK_SOFT))
    parts.append("</svg>")
    return "\n".join(parts)


# --------------------------------------------------------------------------- #
# صفحة 2 — ورقة النشاط
# --------------------------------------------------------------------------- #
def build_activity() -> str:
    skel = inner_svg(ASSETS / "skeleton.svg")
    PAD = 40
    RIGHT = W - PAD
    fig_scale = 0.70
    fx, fy = 34, 200
    fig_w = 400 * fig_scale

    def px(x):
        return fx + fig_scale * x

    def py_(y):
        return fy + fig_scale * y

    bones = [
        ("١", "الجُمجُمة", px(263), py_(156)),
        ("٢", "القَفَص الصَّدري", px(262), py_(366)),
        ("٣", "العَمود الفِقري", px(200), py_(452)),
        ("٤", "الحَوض", px(256), py_(520)),
        ("٥", "عَظم الفَخذ", px(240), py_(576)),
        ("٦", "عِظام الذِّراع", px(120), py_(430)),
    ]

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" '
        f'viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="{CREAM}"/>',
        f'<rect x="18" y="18" width="{W-36}" height="{H-36}" rx="26" '
        f'fill="none" stroke="{LINE}" stroke-width="1.6"/>',

        text(RIGHT, 74, "هيا نُسمّي العِظام!", 40, 700, INK, "end", FONT_HEAD),
        text(RIGHT, 104,
             "اكتب اسم كل عظم أمام رقمه، ثم لوّن الهيكل كما تشاء.",
             16.5, 400, INK_SOFT, "end"),
        badge(PAD, 52, "ورقة نشاط  •  الهيكل العظمي", w=212),
    ]

    # ------------------------- مجسّم الهيكل -------------------------
    parts.append(rounded(PAD, 146, 324, 592, 24, VIOLET_TINT))
    parts.append(
        f'<g transform="translate({fx},{fy}) scale({fig_scale})">{skel}</g>'
    )
    for num, _n, bx, by in bones:
        parts.append(f'<circle cx="{bx}" cy="{by}" r="16" fill="{ACCENT}" '
                     f'stroke="#FFFFFF" stroke-width="2.5"/>')
        parts.append(text(bx, by + 6, num, 16, 700, "#FFFFFF", "middle",
                          FONT_HEAD))

    # ------------------------- أسطر الكتابة -------------------------
    line_r, line_l = RIGHT - 44, 452
    for i, (num, _n, _bx, _by) in enumerate(bones):
        y = 208 + i * 82
        parts.append(rounded(RIGHT - 34, y - 23, 34, 34, 11, BLUE_TINT))
        parts.append(text(RIGHT - 17, y + 2, num, 17, 700, "#2A5CC4",
                          "middle", FONT_HEAD))
        parts.append(f'<path d="M{line_r} {y + 28} H{line_l}" '
                     f'stroke="#C3CAE0" stroke-width="1.8" '
                     f'stroke-dasharray="3 7" stroke-linecap="round"/>')

    # ------------------------- بنك الكلمات -------------------------
    wy = 736
    parts.append(rounded(PAD, wy, W - 2 * PAD, 118, 20, "#EDF7F1"))
    parts.append(text(RIGHT - 26, wy + 30,
                      "بنك الكلمات — اختر الاسم المناسب:",
                      15.5, 700, "#1F6B4A", "end"))
    words = [["الحَوض", "عَظم الفَخذ", "الجُمجُمة"],
             ["عِظام الذِّراع", "العَمود الفِقري", "القَفَص الصَّدري"]]
    available = (W - 2 * PAD) - 52
    for row, group in enumerate(words):
        gap = 10
        widths = [max(74, len(wd) * 9.2 + 34) for wd in group]
        total = sum(widths) + gap * (len(group) - 1)
        scale_w = min(1.0, available / total)
        widths = [w * scale_w for w in widths]
        gap_used = (available - sum(widths)) / (len(group) - 1)
        gap_used = min(gap_used, 46)
        chip_r = W - PAD - 26
        for wd, cw in zip(group, widths):
            chip_r -= cw
            top = wy + 46 + row * 38
            parts.append(rounded(chip_r, top, cw, 32, 16, "#FFFFFF",
                                 stroke="#B7DCC8", sw=1.4))
            parts.append(text(chip_r + cw / 2, top + 21.5, wd,
                              12.8 if scale_w < 0.9 else 14, 600, "#1F6B4A"))
            chip_r -= gap_used

    # ------------------------- هل تعلم -------------------------
    ty = 878
    parts.append(rounded(PAD, ty, W - 2 * PAD, 118, 20, "#FFF3E2"))
    parts.append(f'<circle cx="{RIGHT-34}" cy="{ty+36}" r="17" fill="#F5A524"/>')
    parts.append(text(RIGHT - 34, ty + 43, "؟", 21, 700, "#FFFFFF", "middle",
                      FONT_HEAD))
    parts.append(text(RIGHT - 62, ty + 43, "هَل تَعلَم؟", 20, 700, "#8A5A00",
                      "end", FONT_HEAD))
    parts.append(text(RIGHT - 26, ty + 76,
                      "يُولَد الإنسان وفي جسمه نحو ٣٠٠ عظم، ثم يلتحم بعضها مع النمو",
                      14, 600, "#7A5418", "end"))
    parts.append(text(RIGHT - 26, ty + 100,
                      "حتى تصبح ٢٠٦ عظمة عند الشخص البالغ.",
                      14, 600, "#7A5418", "end"))

    # ------------------------- التوقيع -------------------------
    parts.append(text(RIGHT, H - 36, "اسمي: ............................",
                      14.5, 600, INK_SOFT, "end"))
    parts.append(text(PAD + 200, H - 36, "الصف: .................",
                      14.5, 600, INK_SOFT, "start"))
    parts.append("</svg>")
    return "\n".join(parts)


def main() -> None:
    (ROOT / "card-a4.svg").write_text(build_card(), encoding="utf-8")
    (ROOT / "activity-a4.svg").write_text(build_activity(), encoding="utf-8")
    print("تم إنشاء card-a4.svg و activity-a4.svg")


if __name__ == "__main__":
    main()
