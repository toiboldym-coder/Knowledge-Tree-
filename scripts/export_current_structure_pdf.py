#!/usr/bin/env python3
"""Export the current Hubbard graph as a printable expander PDF."""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
JSON_PATH = ROOT / "src/data/Hubbard_Knowledge_Graph.json"
OUT_PATH = ROOT / "docs/Hubbard_Current_Structure.pdf"

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_UNI = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

PAPER = HexColor("#F3EFE6")
INK = HexColor("#1C1A16")
MUTED = HexColor("#5C574E")
LINE = HexColor("#C9C2B4")
ACCENT = HexColor("#C24A2A")

BRANCH_COLOR = {
    "B01": "#8B5A2B",
    "B02": "#C24A2A",
    "B03": "#3D5A4C",
    "B04": "#B07A2B",
    "B05": "#3E5C73",
    "B06": "#6B5344",
    "B07": "#4A5340",
    "B08": "#4A5C4A",
    "B09": "#5C4A3A",
    "B10": "#6A5A3A",
    "B11": "#3A3A3A",
    "B12": "#6B4035",
}

BRANCH_SHORT = {
    "B01": "Фундамент",
    "B02": "Этика",
    "B03": "Дианетика",
    "B04": "Тон",
    "B05": "Коммуникация",
    "B06": "Обучение",
    "B07": "Одитинг",
    "B08": "Онтология",
    "B09": "Админ",
    "B10": "Применение",
    "B11": "Аксиомы",
    "B12": "История",
}

CROSS = ["E03", "E04", "E02", "F02"]


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Body", FONT_REG if Path(FONT_REG).exists() else FONT_UNI))
    pdfmetrics.registerFont(TTFont("BodyBold", FONT_BOLD if Path(FONT_BOLD).exists() else FONT_UNI))


def load_graph() -> dict:
    return json.loads(JSON_PATH.read_text(encoding="utf-8"))


def index_graph(data: dict):
    nodes = {n["id"]: n for n in data["nodes"]}
    children = defaultdict(list)
    related = defaultdict(list)
    for e in data["edges"]:
        if e["type"] == "contains":
            children[e["source"]].append(e["target"])
        else:
            related[e["source"]].append(e["target"])
            related[e["target"]].append(e["source"])
    branches = [n for n in data["nodes"] if n["type"] == "branch"]
    branches.sort(key=lambda n: n["id"])
    return nodes, children, related, branches


def short_of(node: dict) -> str:
    example = node.get("example")
    if isinstance(example, list):
        return node.get("summary") or node.get("status") or ""
    return node.get("short") or node.get("summary") or ""


def wrap(c, text: str, font: str, size: float, max_w: float) -> list[str]:
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def draw_footer(c, page: int, total: int) -> None:
    w, h = c._pagesize
    c.setFillColor(MUTED)
    c.setFont("Body", 8)
    c.drawString(16 * mm, 10 * mm, "Текущая структура сайта  ·  не предложение новой иерархии")
    c.drawRightString(w - 16 * mm, 10 * mm, f"{page} / {total}")
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.line(16 * mm, 14 * mm, w - 16 * mm, 14 * mm)


def draw_radial(c, branches: list, children: dict, nodes: dict) -> None:
    w, h = landscape(A4)
    c.setFillColor(PAPER)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setFillColor(INK)
    c.setFont("BodyBold", 18)
    c.drawString(16 * mm, h - 18 * mm, "Hubbard Knowledge Map")
    c.setFont("Body", 10)
    c.setFillColor(MUTED)
    c.drawString(16 * mm, h - 24 * mm, "Текущая структура-expander  ·  центр = автор / корпус, не принцип Survive")

    cx, cy = w / 2, h / 2 - 6 * mm
    r_hub = 42
    r_ray = 168
    r_label = 198

    n = len(branches)
    for i, b in enumerate(branches):
        a = (i / n) * math.tau - math.pi / 2
        x = cx + math.cos(a) * r_ray
        y = cy + math.sin(a) * r_ray
        color = HexColor(BRANCH_COLOR[b["id"]])
        c.setStrokeColor(color)
        c.setLineWidth(1.4)
        c.line(cx + math.cos(a) * (r_hub + 6), cy + math.sin(a) * (r_hub + 6), x, y)
        c.setFillColor(color)
        c.circle(x, y, 7, fill=1, stroke=0)

        count = len([cid for cid in children[b["id"]] if nodes[cid]["type"] == "concept"])
        label = f"{BRANCH_SHORT[b['id']]}  ·  {count}"
        lines = wrap(c, label, "BodyBold", 9, 88)
        tx = cx + math.cos(a) * r_label
        ty = cy + math.sin(a) * r_label
        c.setFillColor(INK)
        c.setFont("BodyBold", 9)
        align_right = math.cos(a) < -0.25
        for li, line in enumerate(lines):
            yy = ty + 8 - li * 11
            if align_right:
                c.drawRightString(tx, yy, line)
            elif abs(math.cos(a)) < 0.25:
                c.drawCentredString(tx, yy, line)
            else:
                c.drawString(tx, yy, line)

        # first concepts as tiny expander tips
        kids = [nodes[cid] for cid in children[b["id"]] if nodes[cid]["type"] == "concept"][:4]
        c.setFont("Body", 6.5)
        c.setFillColor(MUTED)
        for ki, kid in enumerate(kids):
            tip = kid["title"]
            if len(tip) > 34:
                tip = tip[:33] + "…"
            ky = ty - 14 - ki * 8
            if align_right:
                c.drawRightString(tx, ky, tip)
            elif abs(math.cos(a)) < 0.25:
                c.drawCentredString(tx, ky, tip)
            else:
                c.drawString(tx, ky, tip)
        more = max(0, len([cid for cid in children[b["id"]] if nodes[cid]["type"] == "concept"]) - 4)
        if more:
            extra = f"+ ещё {more}"
            ky = ty - 14 - 4 * 8
            if align_right:
                c.drawRightString(tx, ky, extra)
            elif abs(math.cos(a)) < 0.25:
                c.drawCentredString(tx, ky, extra)
            else:
                c.drawString(tx, ky, extra)

    c.setFillColor(HexColor("#2A241C"))
    c.circle(cx, cy, r_hub, fill=1, stroke=0)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.6)
    c.circle(cx, cy, r_hub + 5, fill=0, stroke=1)
    c.setFillColor(white)
    c.setFont("BodyBold", 10)
    for i, line in enumerate(["Л. Рон", "Хаббард", "система работ"]):
        c.drawCentredString(cx, cy + 10 - i * 12, line)

    c.setFillColor(MUTED)
    c.setFont("Body", 8)
    c.drawCentredString(cx, 20 * mm, "12 разделов  ·  102 понятия  ·  contains = иерархия  ·  related = перекрёстные связи")


def styles():
    ss = getSampleStyleSheet()
    return {
        "h1": ParagraphStyle(
            "h1",
            parent=ss["Heading1"],
            fontName="BodyBold",
            fontSize=16,
            textColor=INK,
            leading=20,
            spaceAfter=4,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=ss["Heading2"],
            fontName="BodyBold",
            fontSize=12,
            textColor=INK,
            leading=16,
            spaceBefore=10,
            spaceAfter=4,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=ss["Normal"],
            fontName="Body",
            fontSize=9,
            textColor=MUTED,
            leading=12,
            spaceAfter=8,
        ),
        "body": ParagraphStyle(
            "body",
            parent=ss["Normal"],
            fontName="Body",
            fontSize=9,
            textColor=INK,
            leading=12,
            alignment=TA_LEFT,
        ),
        "id": ParagraphStyle(
            "id",
            parent=ss["Normal"],
            fontName="Body",
            fontSize=8,
            textColor=MUTED,
            leading=10,
        ),
        "title": ParagraphStyle(
            "title",
            parent=ss["Normal"],
            fontName="BodyBold",
            fontSize=9,
            textColor=INK,
            leading=12,
        ),
        "short": ParagraphStyle(
            "short",
            parent=ss["Normal"],
            fontName="Body",
            fontSize=8.5,
            textColor=MUTED,
            leading=11,
        ),
        "center": ParagraphStyle(
            "center",
            parent=ss["Normal"],
            fontName="Body",
            fontSize=10,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
    }


def branch_block(branch: dict, kids: list, st: dict, children_count: int):
    color = BRANCH_COLOR[branch["id"]]
    head = [
        Paragraph(f"{BRANCH_SHORT[branch['id']]}  ·  {branch['id']}", st["h1"]),
        Paragraph(f"{branch['title']}<br/>{branch.get('summary') or ''}<br/>понятий: {children_count}", st["meta"]),
    ]
    rows = [[
        Paragraph("ID", st["id"]),
        Paragraph("Понятие", st["id"]),
        Paragraph("Суть", st["id"]),
    ]]
    for kid in kids:
        rows.append([
            Paragraph(kid["id"], st["id"]),
            Paragraph(kid["title"].replace("&", "&amp;"), st["title"]),
            Paragraph((short_of(kid) or "—").replace("&", "&amp;"), st["short"]),
        ])
    table = Table(rows, colWidths=[22 * mm, 62 * mm, 96 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#E4DFD4")),
                ("TEXTCOLOR", (0, 0), (-1, -1), INK),
                ("FONTNAME", (0, 0), (-1, 0), "BodyBold"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LINEBELOW", (0, 0), (-1, -2), 0.3, LINE),
                ("LINEBELOW", (0, -1), (-1, -1), 0.6, HexColor(color)),
                ("LINEBEFORE", (0, 0), (0, -1), 2.2, HexColor(color)),
            ]
        )
    )
    return KeepTogether(head + [table, Spacer(1, 8)])


def cross_story(nodes, related, st):
    flow = [
        Paragraph("Где дерево врёт: перекрёстные связи", st["h1"]),
        Paragraph(
            "Иерархия contains идёт вверх в раздел. Смысловые мосты — related. "
            "Именно поэтому «Оверт» связан с «Висхолдом», «Ответственностью» и через неё с «Динамиками».",
            st["meta"],
        ),
    ]
    rows = [[
        Paragraph("Узел", st["id"]),
        Paragraph("Суть", st["id"]),
        Paragraph("Связан с", st["id"]),
    ]]
    for nid in CROSS:
        node = nodes[nid]
        rels = []
        for rid in related[nid]:
            if rid in nodes:
                rels.append(f"{nodes[rid]['id']} {nodes[rid]['title']}")
        for lid in node.get("links") or []:
            if lid in nodes and nodes[lid]["title"] not in " ".join(rels):
                rels.append(f"{lid} {nodes[lid]['title']}")
        rows.append([
            Paragraph(f"<b>{node['title']}</b><br/>{nid}", st["title"]),
            Paragraph(short_of(node).replace("&", "&amp;"), st["short"]),
            Paragraph("<br/>".join(rels).replace("&", "&amp;"), st["short"]),
        ])
    table = Table(rows, colWidths=[48 * mm, 62 * mm, 70 * mm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#E4DFD4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, LINE),
                ("LINEBEFORE", (0, 1), (0, -1), 2.2, ACCENT),
            ]
        )
    )
    flow.append(table)
    flow.append(Spacer(1, 10))
    flow.append(
        Paragraph(
            "Цепочка для проверки карты: Оверт → Висхолд → Ответственность → Восемь динамик. "
            "На сайте это chips Related / Cross-domain, не путь по дереву.",
            st["body"],
        )
    )
    return flow


def paint_text_bg(c, doc):
    c.setFillColor(PAPER)
    c.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=1, stroke=0)


def main() -> None:
    register_fonts()
    data = load_graph()
    nodes, children, related, branches = index_graph(data)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # We build: 1 landscape radial + portrait pages. reportlab one doc = one pagesize.
    # So write two files then merge, or use a raw canvas for all pages.
    # Simpler: one landscape PDF via canvas-only for page 1, then platypus portrait, merge with pypdf if available.
    # Fastest reliable: all A4 portrait; radial page drawn in portrait (slightly tighter).

    totals = {"pages": 10}

    def text_page(c, doc):
        paint_text_bg(c, doc)
        draw_footer(c, doc.page + 1, totals["pages"])

    st = styles()
    story = [
        Paragraph("Текущая иерархия contains", st["h1"]),
        Paragraph(
            "Ниже — та же схема, что на сайте: корень → 12 разделов → понятия. "
            "Это expander, не новая модель Survive.",
            st["meta"],
        ),
    ]
    for b in branches:
        kids = [nodes[cid] for cid in children[b["id"]] if cid in nodes and nodes[cid]["type"] == "concept"]
        # keep JSON order (children list follows edge order ≈ source order)
        story.append(branch_block(b, kids, st, len(kids)))

    story.append(PageBreak())
    story.extend(cross_story(nodes, related, st))

    # First pass to know page count of text part; we'll prefix radial as page 1 via two-pass merge.
    tmp_text = OUT_PATH.with_suffix(".text.pdf")
    doc = SimpleDocTemplate(
        str(tmp_text),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="Hubbard Knowledge Map — текущая структура",
        author="Hubbard Knowledge Map",
    )
    doc.build(story, onFirstPage=text_page, onLaterPages=text_page)
    from reportlab.pdfgen.canvas import Canvas

    try:
        from pypdf import PdfReader, PdfWriter
    except ImportError:
        import subprocess
        import sys

        subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", "pypdf"])
        from pypdf import PdfReader, PdfWriter

    reader = PdfReader(str(tmp_text))
    text_pages = len(reader.pages)
    total = text_pages + 1
    if totals["pages"] != total:
        totals["pages"] = total
        doc.build(story, onFirstPage=text_page, onLaterPages=text_page)
        reader = PdfReader(str(tmp_text))

    radial_path = OUT_PATH.with_suffix(".radial.pdf")
    c = Canvas(str(radial_path), pagesize=landscape(A4))
    c.setTitle("Hubbard Knowledge Map — текущая структура")
    draw_radial(c, branches, children, nodes)
    draw_footer(c, 1, total)
    c.showPage()
    c.save()

    # Stamp footers on text pages by rebuilding with canvas wrapper
    # pypdf merge: landscape page 1 + portrait rest. That's OK for reading.
    writer = PdfWriter()
    radial_reader = PdfReader(str(radial_path))
    writer.add_page(radial_reader.pages[0])
    for i, page in enumerate(reader.pages, start=2):
        writer.add_page(page)
    with OUT_PATH.open("wb") as f:
        writer.write(f)

    tmp_text.unlink(missing_ok=True)
    radial_path.unlink(missing_ok=True)
    print(f"Wrote {OUT_PATH}  ({total} pages)")


if __name__ == "__main__":
    main()
