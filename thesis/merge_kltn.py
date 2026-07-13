import zipfile, re, shutil, struct
from xml.sax.saxutils import escape

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
TPL = "/home/hoai/final-project/thesis/KLTN_TRANHOAIPHUONG_patched.docx"
OUT = "/home/hoai/final-project/thesis/KLTN_TRANHOAIPHUONG_moi.docx"
FIGDIR = "/home/hoai/final-project/thesis/figures/"
FALLBACKS = ["KLTN_TRANHOAIPHUONG.docx", "KLTN_TRANHOAIPHUONG_v2.docx", "KLTN_TRANHOAIPHUONG_v3.docx"]

FIG_MAP = {
    'HÌNH 3.1': 'hinh-3-1-kien-truc.png',
    'HÌNH 3.2': 'hinh-3-2-module.png',
    'HÌNH 3.3': 'hinh-3-3-erd.png',
    'HÌNH 3.4': 'hinh-3-4-dang-nhap.png',
    'HÌNH 3.5': 'hinh-3-5-trang-thai.png',
    'HÌNH 3.6': 'hinh-3-6-luong-xuat-ban.png',
    'HÌNH 3.7': 'hinh-3-7-login.png',
    'HÌNH 3.8': 'hinh-3-8-builder.png',
    'HÌNH 3.9': 'hinh-3-9-public.png',
    'HÌNH 3.10': 'hinh-3-10-di-tru.png',
    'HÌNH 3.11': 'hinh-3-11-trien-khai.png',
}
media_files, rels_entries, _img_seq = [], [], [0]

def png_size(path):
    with open(path, 'rb') as f: head = f.read(24)
    return struct.unpack('>II', head[16:24])

def image_para(path):
    _img_seq[0] += 1; n = _img_seq[0]
    rid = f'rIdKltnImg{n}'; zname = f'media/kltn_hinh_{n}.png'
    media_files.append((f'word/{zname}', path))
    rels_entries.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{zname}"/>')
    pw, ph = png_size(path)
    cx = 5400000; cy = int(cx * ph / pw)
    return ('<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="60"/></w:pPr>'
      '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0" '
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">'
      f'<wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{9000+n}" name="KltnHinh{n}"/>'
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
      '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
      f'<pic:nvPicPr><pic:cNvPr id="{9000+n}" name="KltnHinh{n}"/><pic:cNvPicPr/></pic:nvPicPr>'
      f'<pic:blipFill><a:blip r:embed="{rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>'
      '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
      f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
      '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>')

def runs(text, sz=26):
    out, pos = [], 0
    for m in re.finditer(r'\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`', text):
        if m.start() > pos: out.append((text[pos:m.start()], ''))
        if m.group(1) is not None: out.append((m.group(1), 'b'))
        elif m.group(2) is not None: out.append((m.group(2), 'i'))
        else: out.append((m.group(3), ''))
        pos = m.end()
    if pos < len(text): out.append((text[pos:], ''))
    xml = ''
    for t, fmt in out:
        if not t: continue
        rpr = '<w:rPr>'
        if 'b' in fmt: rpr += '<w:b/><w:bCs/>'
        if 'i' in fmt: rpr += '<w:i/><w:iCs/>'
        rpr += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr>'
        xml += f'<w:r>{rpr}<w:t xml:space="preserve">{escape(t)}</w:t></w:r>'
    return xml

def para(text, style=None, jc='both', spacing=True, pbb=False, numcancel=False):
    ppr = '<w:pPr>'
    if style: ppr += f'<w:pStyle w:val="{style}"/>'
    if numcancel: ppr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr>'
    if pbb: ppr += '<w:pageBreakBefore/>'
    if spacing: ppr += '<w:spacing w:after="120" w:line="360" w:lineRule="auto"/>'
    if jc: ppr += f'<w:jc w:val="{jc}"/>'
    ppr += '</w:pPr>'
    sz = 32 if style in ('u1', 'u2', 'u3') else 26   # heading 16pt cố định
    return f'<w:p>{ppr}{runs(text, sz=sz)}</w:p>'

def table(rows):
    borders = ('<w:tblBorders>' + ''.join(
        f'<w:{s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
        for s in ['top','left','bottom','right','insideH','insideV']) + '</w:tblBorders>')
    xml = ('<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>' + borders +
           '<w:tblLayout w:type="autofit"/></w:tblPr>')
    for ri, cells in enumerate(rows):
        xml += '<w:tr>'
        for c in cells:
            inner = runs(c, sz=24)
            if ri == 0: inner = inner.replace('<w:rPr>', '<w:rPr><w:b/><w:bCs/>')
            pcell = ('<w:p><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/>'
                     f'<w:jc w:val="left"/></w:pPr>{inner}</w:p>')
            xml += f'<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>{pcell}</w:tc>'
        xml += '</w:tr>'
    return xml + '</w:tbl>'

def md_to_blocks(path, first_heading_pbb):
    src = open(path).read().split('\n')
    blocks, i, first_h1 = [], 0, True
    while i < len(src):
        line = src[i].rstrip()
        if not line.strip(): i += 1; continue
        if line.startswith('# '):
            h = line[2:].strip()
            mch = re.match(r'CHƯƠNG \d+\.\s*(.*)', h)
            if mch:
                blocks.append(para(' ' + mch.group(1), style='u1', jc=None, spacing=False,
                                   pbb=(not first_h1) or first_heading_pbb))
            else:
                blocks.append(para(h, style='u1', jc=None, spacing=False, numcancel=True,
                                   pbb=(not first_h1) or first_heading_pbb))
            first_h1 = False
        elif line.startswith('## '):
            blocks.append(para(line[3:].strip(), style='u2', jc=None, spacing=False))
        elif line.startswith('### '):
            blocks.append(para(line[4:].strip(), style='u3', jc=None, spacing=False))
        elif line.startswith('|'):
            rows = []
            while i < len(src) and src[i].startswith('|'):
                cells = [c.strip() for c in src[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                    rows.append(cells)
                i += 1
            blocks.append(table(rows)); continue
        elif re.match(r'^\*(Bảng|Hình) ', line):
            blocks.append(para(line.strip('*'), style='Chuthich', jc='center'))
        elif line.startswith('【'):
            mfig = re.match(r'【(HÌNH \d+\.\d+)', line)
            key = mfig.group(1) if mfig and mfig.group(1) in FIG_MAP else None
            blocks.append(image_para(FIGDIR + FIG_MAP[key]) if key else para(line, jc='center'))
        elif line.startswith('> '):
            blocks.append(para(line[2:], jc='both'))
        else:
            blocks.append(para(line))
        i += 1
    return blocks

base = '/home/hoai/final-project/thesis/'
content = []
files = ['00-loi-mo-dau.md','01-chuong-1-tong-quan.md','02-chuong-2-co-so-ly-thuyet.md',
         '03-chuong-3-thiet-ke-va-hien-thuc.md','04-chuong-4-danh-gia-ket-qua.md',
         '05-ket-luan-va-kien-nghi.md']
for idx, f in enumerate(files):
    content += md_to_blocks(base + f, first_heading_pbb=(idx > 0))
tltk = []
for line in open(base + '06-tai-lieu-tham-khao.md').read().split('\n'):
    line = line.rstrip()
    if not line.strip() or line.startswith('#') or line.startswith('*('): continue
    line = re.sub(r'\s*\*\(mục [^)]*\)\*\s*$', '', line)
    tltk.append(para(line, jc='left'))

zin = zipfile.ZipFile(TPL)
doc = zin.read('word/document.xml').decode('utf-8')

def find_heading(doc, text_snip, from_pos=0):
    for m in re.finditer(r'<w:p\b.*?</w:p>', doc[from_pos:], re.S):
        chunk = m.group(0)
        if 'w:val="u1"' in chunk:
            t = ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', chunk))
            if text_snip in t:
                return from_pos + m.start(), from_pos + m.end()
    raise SystemExit(f'Không tìm thấy heading: {text_snip}')

s_lmd, _   = find_heading(doc, 'LỜI MỞ ĐẦU')
s_bb, _    = find_heading(doc, 'DANH MỤC CÁC BÀI BÁO')
s_tltk, e_tltk = find_heading(doc, 'DANH MỤC TÀI LIỆU THAM KHẢO')
s_pl, _    = find_heading(doc, 'PHỤ LỤC')
tail_zone = doc[e_tltk:s_pl]
msec = None
for m in re.finditer(r'<w:p\b.*?</w:p>', tail_zone, re.S):
    if '<w:sectPr' in m.group(0): msec = m
assert msec is not None
sect_para = msec.group(0)

new_doc = (doc[:s_lmd] + ''.join(content)
           + doc[s_bb:e_tltk] + ''.join(tltk) + sect_para + doc[s_pl:])

rels = zin.read('word/_rels/document.xml.rels').decode('utf-8')
rels = rels.replace('</Relationships>', ''.join(rels_entries) + '</Relationships>')
ct = zin.read('[Content_Types].xml').decode('utf-8')
if 'Extension="png"' not in ct:
    ct = ct.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>')

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == 'word/document.xml': data = new_doc.encode('utf-8')
        elif item.filename == 'word/_rels/document.xml.rels': data = rels.encode('utf-8')
        elif item.filename == '[Content_Types].xml': data = ct.encode('utf-8')
        zout.writestr(item, data)
    for zname, disk in media_files:
        zout.write(disk, zname)
zin.close()

from xml.etree import ElementTree as ET
z = zipfile.ZipFile(OUT); assert z.testzip() is None
Wns = '{%s}' % W
d = ET.fromstring(z.read('word/document.xml'))
ET.fromstring(z.read('word/_rels/document.xml.rels'))
drawings = len(list(d.iter('{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}inline')))
print('OK — paragraphs:', len(list(d.iter(Wns+'p'))), '| tables:', len(list(d.iter(Wns+'tbl'))),
      '| sectPr:', len(list(d.iter(Wns+'sectPr'))), '| ảnh nhúng:', drawings)
for name in FALLBACKS:
    try:
        shutil.copy(OUT, "/mnt/c/Users/Hoai Phuong/Downloads/" + name)
        print("Đã copy: Downloads/" + name); break
    except PermissionError:
        print(name, "đang mở trong Word — thử tên khác…")
