"""Genera documentación PDF desde los Markdown actuales y capturas verificadas."""
from pathlib import Path
from html import escape
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodySM',fontName='Helvetica',fontSize=10,leading=14,spaceAfter=8,textColor=colors.HexColor('#263147')))
styles.add(ParagraphStyle(name='TitleSM',fontName='Helvetica-Bold',fontSize=25,leading=30,spaceBefore=12,spaceAfter=22,textColor=colors.HexColor('#6539b5')))
styles.add(ParagraphStyle(name='HeadingSM',fontName='Helvetica-Bold',fontSize=14,leading=19,spaceBefore=13,spaceAfter=9,keepWithNext=True,textColor=colors.HexColor('#6539b5')))
styles.add(ParagraphStyle(name='SubSM',fontName='Helvetica-Bold',fontSize=11,leading=15,spaceBefore=9,spaceAfter=7,keepWithNext=True))
styles.add(ParagraphStyle(name='CellSM',fontSize=8,leading=11,spaceAfter=2))
styles.add(ParagraphStyle(name='CaptionSM',fontSize=8,leading=11,spaceAfter=9,textColor=colors.HexColor('#586278')))
def markup(s):
    s=escape(s).replace('—','-').replace('–','-').replace('…','...')
    s=re.sub(r'`([^`]+)`',r'<font name="Courier">\1</font>',s)
    s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'\[([^]]+)\]\(([^)]+)\)',r'\1',s)
    return s
def para(s,style='BodySM'): return Paragraph(markup(s),styles[style])
def build(source,target):
    lines=source.read_text(encoding='utf-8').splitlines();story=[];i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line:i+=1;continue
        if line.startswith('**Figura '):
            title = para(line, 'SubSM')
            i += 1
            while not lines[i].strip(): i += 1
            match=re.match(r'!\[([^]]+)\]\(([^)]+)\)',lines[i].strip())
            asset=source.parent/match[2]
            if not asset.exists():raise FileNotFoundError(asset)
            image=Image(str(asset)); ratio=min((168*mm)/image.imageWidth,(133*mm)/image.imageHeight)
            image.drawWidth=image.imageWidth*ratio;image.drawHeight=image.imageHeight*ratio;image.hAlign='LEFT'
            framed=Table([[image]],colWidths=[image.drawWidth],hAlign='LEFT')
            framed.setStyle(TableStyle([('BOX',(0,0),(-1,-1),0.75,colors.black),
                ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0),
                ('TOPPADDING',(0,0),(-1,-1),0),('BOTTOMPADDING',(0,0),(-1,-1),0)]))
            i += 1
            while not lines[i].strip(): i += 1
            story.append(KeepTogether([title,framed,Spacer(1,5),para(lines[i],'CaptionSM')]))
        elif line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[-: ]+',c) for c in cells):rows.append([para(c,'CellSM') for c in cells])
                i+=1
            widths=[55*mm,115*mm] if len(rows[0])==2 else [64*mm,47*mm,59*mm]
            table=Table(rows,colWidths=widths,repeatRows=1,hAlign='LEFT')
            table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#eae2f6')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f7f8fa')]),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
            story.extend([table,Spacer(1,10)]);continue
        elif line.startswith('### '):story.append(para(line[4:],'SubSM'))
        elif line.startswith('## '):story.append(para(line[3:],'HeadingSM'))
        elif line.startswith('# '):story.append(para(line[2:],'TitleSM'))
        else:story.append(para(line))
        i+=1
    def frame(c,d):
        c.saveState();c.setFont('Helvetica',8);c.setFillColor(colors.HexColor('#586278'))
        c.drawString(20*mm,A4[1]-13*mm,'SKINMARKET PRO | REACT + SPRING BOOT + MYSQL')
        c.setStrokeColor(colors.HexColor('#ded9e7'));c.line(20*mm,18*mm,190*mm,18*mm)
        c.drawString(20*mm,13*mm,'Documentación técnica | SkinMarket Pro');c.drawRightString(190*mm,13*mm,str(d.page));c.restoreState()
    target.parent.mkdir(parents=True,exist_ok=True)
    SimpleDocTemplate(str(target),pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=22*mm,bottomMargin=24*mm,title=lines[0].lstrip('# '),author='Equipo SkinMarket').build(story,onFirstPage=frame,onLaterPages=frame)
    print(target.name)
if __name__=='__main__':
    for source,target in [('ERS_SkinMarket_FullStack.md','SkinMarket_ERS_FullStack.pdf'),('Arquitectura_API.md','SkinMarket_Arquitectura_API.pdf'),('Manual_Usuario.md','SkinMarket_Manual_Usuario.pdf'),('Informe_Testing.md','SkinMarket_Informe_Testing.pdf')]:
        build(ROOT/'docs'/source,ROOT/'output/pdf'/target)
