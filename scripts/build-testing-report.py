"""Genera el PDF del informe desde docs/Informe_Testing.md.

Utilidad documental opcional: requiere reportlab. No interviene en npm ni en el sitio.
"""
from pathlib import Path
from html import escape
import re
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'output/pdf/SkinMarket_Informe_Testing.pdf'
TARGET.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ReportBody', fontName='Helvetica', fontSize=10, leading=14,
    textColor=colors.HexColor('#273244'), spaceAfter=8, alignment=TA_LEFT))
styles.add(ParagraphStyle(name='ReportTitle', fontName='Helvetica-Bold', fontSize=23, leading=28,
    textColor=colors.HexColor('#6235a5'), spaceAfter=16))
styles.add(ParagraphStyle(name='ReportHeading', fontName='Helvetica-Bold', fontSize=13, leading=17,
    textColor=colors.HexColor('#6235a5'), spaceBefore=13, spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle(name='Cell', fontName='Helvetica', fontSize=8.3, leading=11))
styles.add(ParagraphStyle(name='CodeBlock', fontName='Courier', fontSize=9, leading=13,
    backColor=colors.HexColor('#f0edf7'), borderPadding=9, spaceAfter=12))

def paragraph(text, style='ReportBody'):
    safe = escape(text)
    safe = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', safe)
    return Paragraph(safe, styles[style])

lines = (ROOT / 'docs/Informe_Testing.md').read_text(encoding='utf-8').splitlines()
story = []
i = 0
while i < len(lines):
    line = lines[i]
    if not line.strip():
        i += 1
        continue
    if line.startswith('```'):
        code = []
        i += 1
        while i < len(lines) and not lines[i].startswith('```'):
            code.append(escape(lines[i]))
            i += 1
        story.append(Paragraph('<br/>'.join(code), styles['CodeBlock']))
    elif line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            cells = [cell.strip() for cell in lines[i].strip('|').split('|')]
            if not all(re.fullmatch(r'[:\- ]+', cell) for cell in cells):
                rows.append([paragraph(cell, 'Cell') for cell in cells])
            i += 1
        widths = [115*mm, 18*mm, 37*mm] if len(rows[0]) == 3 else [36*mm, 46*mm, 42*mm, 46*mm]
        # El catálogo usa columna de archivo, cantidad y descripción.
        if len(rows[0]) == 3:
            widths = [43*mm, 13*mm, 114*mm]
        table = Table(rows, colWidths=widths, repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e9e0f6')),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f7f8fa')]),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 7), ('BOTTOMPADDING', (0,0), (-1,-1), 7),
            ('LINEBELOW', (0,0), (-1,0), .6, colors.HexColor('#a48bc5')),
            ('LINEBELOW', (0,-1), (-1,-1), .4, colors.HexColor('#d5d9e1')),
        ]))
        story.extend([table, Spacer(1, 9)])
        continue
    elif line.startswith('# '):
        story.append(paragraph(line[2:], 'ReportTitle'))
    elif line.startswith('## '):
        story.append(paragraph(line[3:], 'ReportHeading'))
    else:
        story.append(paragraph(line))
    i += 1

def page_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#ded8e8'))
    canvas.line(20*mm, 18*mm, 190*mm, 18*mm)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#657085'))
    canvas.drawString(20*mm, 13*mm, 'SkinMarket Pro | Informe de pruebas | 19/10/2026')
    canvas.drawRightString(190*mm, 13*mm, str(doc.page))
    canvas.restoreState()

doc = SimpleDocTemplate(str(TARGET), pagesize=A4, rightMargin=20*mm, leftMargin=20*mm,
    topMargin=19*mm, bottomMargin=25*mm, title='SkinMarket Pro - Informe de pruebas y cobertura',
    author='SkinMarket Pro')
doc.build(story, onFirstPage=page_footer, onLaterPages=page_footer)
print(TARGET)
