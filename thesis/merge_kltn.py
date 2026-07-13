import zipfile, re, shutil, struct
from xml.sax.saxutils import escape

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
TPL = "/home/hoai/final-project/thesis/KLTN_TRANHOAIPHUONG_patched.docx"
OUT = "/home/hoai/final-project/thesis/KLTN_TRANHOAIPHUONG_moi.docx"
FIGDIR = "/home/hoai/final-project/thesis/figures/"
FALLBACKS = ["KLTN_TRANHOAIPHUONG.docx", "KLTN_TRANHOAIPHUONG_v2.docx", "KLTN_TRANHOAIPHUONG_v3.docx"]

FIG_MAP = {
    'HÌNH 3.1': 'hinh-3-1-kien-truc.png', 'HÌNH 3.2': 'hinh-3-2-module.png',
    'HÌNH 3.3': 'hinh-3-3-erd.png', 'HÌNH 3.4': 'hinh-3-4-dang-nhap.png',
    'HÌNH 3.5': 'hinh-3-5-trang-thai.png', 'HÌNH 3.6': 'hinh-3-6-luong-xuat-ban.png',
    'HÌNH 3.7': 'hinh-3-7-login.png', 'HÌNH 3.8': 'hinh-3-8-builder.png',
    'HÌNH 3.9': 'hinh-3-9-public.png', 'HÌNH 3.10': 'hinh-3-10-di-tru.png',
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

def runs(text, sz=26, italic_all=False):
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
        if 'i' in fmt or italic_all: rpr += '<w:i/><w:iCs/>'
        rpr += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr>'
        xml += f'<w:r>{rpr}<w:t xml:space="preserve">{escape(t)}</w:t></w:r>'
    return xml

# u1 = 16pt đậm; u2 = 14pt đậm; u3 = 13pt đậm nghiêng (yêu cầu 13/07)
HEAD_SZ = {'u1': 32, 'u2': 28, 'u3': 26}

def para(text, style=None, jc='both', spacing=True, pbb=False, numcancel=False, hanging=False):
    ppr = '<w:pPr>'
    if style: ppr += f'<w:pStyle w:val="{style}"/>'
    if numcancel: ppr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr>'
    if pbb: ppr += '<w:pageBreakBefore/>'
    if spacing: ppr += '<w:spacing w:after="120" w:line="360" w:lineRule="auto"/>'
    if hanging: ppr += '<w:ind w:left="567" w:hanging="567"/>'
    if jc: ppr += f'<w:jc w:val="{jc}"/>'
    ppr += '</w:pPr>'
    sz = HEAD_SZ.get(style, 26)
    return f'<w:p>{ppr}{runs(text, sz=sz, italic_all=(style == "u3"))}</w:p>'

def table(rows, header_bold=True, borderless=False, header_italic=False, cell_sz=24):
    if borderless:
        borders = '<w:tblBorders>' + ''.join(
            f'<w:{s} w:val="none" w:sz="0" w:space="0"/>'
            for s in ['top','left','bottom','right','insideH','insideV']) + '</w:tblBorders>'
    else:
        borders = '<w:tblBorders>' + ''.join(
            f'<w:{s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>'
            for s in ['top','left','bottom','right','insideH','insideV']) + '</w:tblBorders>'
    xml = ('<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>' + borders +
           '<w:tblLayout w:type="autofit"/></w:tblPr>')
    for ri, cells in enumerate(rows):
        xml += '<w:tr>'
        for c in cells:
            inner = runs(c, sz=cell_sz)
            if ri == 0 and header_italic: inner = inner.replace('<w:rPr>', '<w:rPr><w:i/><w:iCs/>')
            elif ri == 0 and header_bold: inner = inner.replace('<w:rPr>', '<w:rPr><w:b/><w:bCs/>')
            sp = '120' if borderless else '40'
            pcell = (f'<w:p><w:pPr><w:spacing w:after="{sp}" w:line="300" w:lineRule="auto"/>'
                     f'<w:jc w:val="left"/></w:pPr>{inner}</w:p>')
            xml += f'<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>{pcell}</w:tc>'
        xml += '</w:tr>'
    return xml + '</w:tbl>'

def toc_field(instr, placeholder):
    return ('<w:p><w:pPr><w:spacing w:after="120" w:line="360" w:lineRule="auto"/></w:pPr>'
            '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
            f'<w:r><w:instrText xml:space="preserve"> {escape(instr)} </w:instrText></w:r>'
            '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
            f'<w:r><w:rPr><w:i/><w:sz w:val="26"/></w:rPr><w:t>{escape(placeholder)}</w:t></w:r>'
            '<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>')

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
            st = 'ChuthichBang' if line.startswith('*Bảng') else 'ChuthichHinh'
            blocks.append(para(line.strip('*'), style=st, jc='center'))
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

# ---------- nội dung ----------
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
    tltk.append(para(line, jc='left', hanging=True))

# ---------- bảng viết tắt + chú thích thuật ngữ ----------
ABBR = [['Từ viết tắt', 'Tiếng Anh', 'Tiếng Việt'],
 ['API', 'Application Programming Interface', 'Giao diện lập trình ứng dụng'],
 ['CLS', 'Cumulative Layout Shift', 'Độ dịch chuyển bố cục tích lũy'],
 ['CMS', 'Content Management System', 'Hệ quản trị nội dung'],
 ['CRUD', 'Create – Read – Update – Delete', 'Tạo, đọc, cập nhật, xóa'],
 ['CSDL', 'Database', 'Cơ sở dữ liệu'],
 ['ERD', 'Entity–Relationship Diagram', 'Sơ đồ thực thể – liên kết'],
 ['FCP', 'First Contentful Paint', 'Thời điểm hiển thị nội dung đầu tiên'],
 ['GEO', 'Generative Engine Optimization', 'Tối ưu cho công cụ tìm kiếm dùng trí tuệ nhân tạo'],
 ['HTML', 'HyperText Markup Language', 'Ngôn ngữ đánh dấu siêu văn bản'],
 ['HTTP', 'HyperText Transfer Protocol', 'Giao thức truyền siêu văn bản'],
 ['INP', 'Interaction to Next Paint', 'Độ trễ từ tương tác đến khung hình kế tiếp'],
 ['ISR', 'Incremental Static Regeneration', 'Tạo tĩnh tăng dần'],
 ['JSON', 'JavaScript Object Notation', 'Định dạng dữ liệu dạng đối tượng'],
 ['JSON-LD', 'JSON for Linked Data', 'Dữ liệu có cấu trúc dạng JSON'],
 ['JWT', 'JSON Web Token', 'Mã thông báo web dạng JSON'],
 ['LCP', 'Largest Contentful Paint', 'Thời điểm hiển thị nội dung lớn nhất'],
 ['OTP', 'One-Time Password', 'Mật khẩu dùng một lần'],
 ['RBAC', 'Role-Based Access Control', 'Điều khiển truy cập theo vai trò'],
 ['SEO', 'Search Engine Optimization', 'Tối ưu hóa công cụ tìm kiếm'],
 ['SSR', 'Server-Side Rendering', 'Kết xuất phía máy chủ'],
 ['TBT', 'Total Blocking Time', 'Tổng thời gian luồng chính bị chặn'],
 ['TTFB', 'Time To First Byte', 'Thời gian nhận byte phản hồi đầu tiên'],
 ['URL', 'Uniform Resource Locator', 'Địa chỉ tài nguyên trên web'],
 ['XML', 'eXtensible Markup Language', 'Ngôn ngữ đánh dấu mở rộng']]

GLOSS = [['Thuật ngữ', 'Chú thích'],
 ['Headless CMS', 'Hệ quản trị nội dung phi giao diện: tách kho nội dung khỏi tầng hiển thị, cung cấp dữ liệu qua API'],
 ['Visual Builder (Puck)', 'Trình xây dựng giao diện trực quan kéo – thả; bố cục trang được lưu dưới dạng dữ liệu JSON'],
 ['monorepo', 'Kho mã nguồn hợp nhất chứa nhiều thành phần của cùng một hệ thống'],
 ['slug', 'Chuỗi định danh thân thiện xuất hiện trên URL của một trang hoặc bài viết'],
 ['Dependency Injection', 'Cơ chế tiêm phụ thuộc: thành phần nhận các dịch vụ cần dùng từ bên ngoài thay vì tự khởi tạo'],
 ['Guard', 'Lớp chốt chặn của NestJS, kiểm tra xác thực và quyền trước khi yêu cầu được xử lý'],
 ['cache', 'Bộ nhớ đệm: lưu tạm kết quả đọc để phục vụ nhanh các lần truy cập sau'],
 ['stateless', 'Không lưu trạng thái phiên trong tiến trình máy chủ; mọi trạng thái nằm ở tầng dữ liệu'],
 ['snapshot', 'Ảnh chụp trạng thái dữ liệu tại một thời điểm (bản công khai của bố cục, bản ghi phiên bản)'],
 ['placeholder', 'Khối giữ chỗ trong bố cục mẫu, được thay bằng dữ liệu thật của bài viết khi xuất bản'],
 ['puckData / publishedPuckData', 'Cột lưu cây bố cục bản nháp / bản đã xuất bản của một trang'],
 ['legacyId', 'Khóa gốc tham chiếu bản ghi ở hệ thống cũ, giúp di trú chạy lặp lại không tạo bản sao'],
 ['sitemap / robots.txt', 'Tệp khai báo danh sách trang và phạm vi thu thập dành cho máy tìm kiếm'],
 ['hreflang', 'Thẻ khai báo các phiên bản ngôn ngữ tương ứng của cùng một trang'],
 ['Docker / container', 'Công nghệ đóng gói ứng dụng cùng toàn bộ môi trường chạy thành đơn vị triển khai độc lập'],
 ['Lighthouse', 'Công cụ của Google đo hiệu năng, khả năng truy cập và SEO của trang web']]

# ---------- mở mẫu, dựng lại phần đầu ----------
zin = zipfile.ZipFile(TPL)
doc = zin.read('word/document.xml').decode('utf-8')

def ptext(chunk):
    return ''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', chunk))

def find_para(doc, pred, from_pos=0):
    for m in re.finditer(r'<w:p\b.*?</w:p>', doc[from_pos:], re.S):
        if pred(m.group(0)):
            return from_pos + m.start(), from_pos + m.end()
    raise SystemExit('không tìm thấy đoạn cần thiết')

def find_u1(doc, snip, from_pos=0):
    return find_para(doc, lambda c: 'w:val="u1"' in c and snip in ptext(c), from_pos)

# 1. BẢNG CHÚ THÍCH THUẬT NGỮ: thay nội dung tới trước đoạn sectPr
s, e = find_u1(doc, 'BẢNG CHÚ THÍCH THUẬT NGỮ')
s_sect, _ = find_para(doc, lambda c: '<w:sectPr' in c, e)
doc = doc[:e] + table(GLOSS, borderless=True, header_italic=True, header_bold=False, cell_sz=26) + '<w:p/>' + doc[s_sect:]

# 2. DANH MỤC KÝ HIỆU, CHỮ VIẾT TẮT
s, e = find_u1(doc, 'DANH MỤC CÁC KÝ HIỆU')
s2, _ = find_u1(doc, 'BẢNG CHÚ THÍCH THUẬT NGỮ')
doc = doc[:e] + table(ABBR, borderless=True, header_italic=True, header_bold=False, cell_sz=26) + '<w:p/>' + doc[s2:]

# 3. DANH MỤC BẢNG SỐ LIỆU -> field TOC theo style ChuthichBang
s, e = find_u1(doc, 'DANH MỤC CÁC BẢNG SỐ LIỆU')
s2, _ = find_u1(doc, 'DANH MỤC CÁC KÝ HIỆU')
doc = doc[:e] + toc_field('TOC \\h \\z \\t "ChuthichBang,1"',
        'Danh mục bảng sẽ tự cập nhật khi mở tệp (hoặc chọn toàn bộ rồi nhấn F9).') + '<w:p/>' + doc[s2:]

# 4. DANH MỤC HÌNH VẼ -> field TOC theo style ChuthichHinh
s, e = find_u1(doc, 'DANH MỤC CÁC HÌNH VẼ')
s2, _ = find_u1(doc, 'DANH MỤC CÁC BẢNG SỐ LIỆU')
doc = doc[:e] + toc_field('TOC \\h \\z \\t "ChuthichHinh,1"',
        'Danh mục hình sẽ tự cập nhật khi mở tệp (hoặc chọn toàn bộ rồi nhấn F9).') + '<w:p/>' + doc[s2:]

# 5. MỤC LỤC -> field TOC heading 1-3
s, e = find_para(doc, lambda c: ptext(c).strip() == 'MỤC LỤC')
s2, _ = find_u1(doc, 'DANH MỤC CÁC HÌNH VẼ')
doc = doc[:e] + toc_field('TOC \\o "1-3" \\h \\z \\u',
        'Mục lục sẽ tự cập nhật khi mở tệp (hoặc chọn toàn bộ rồi nhấn F9).') + '<w:p/>' + doc[s2:]

# ---------- ghép thân bài ----------
s_lmd, _   = find_u1(doc, 'LỜI MỞ ĐẦU')
s_bb, _    = find_u1(doc, 'DANH MỤC CÁC BÀI BÁO')
s_tltk, e_tltk = find_u1(doc, 'DANH MỤC TÀI LIỆU THAM KHẢO')
s_pl, _    = find_u1(doc, 'PHỤ LỤC')
tail_zone = doc[e_tltk:s_pl]
msec = None
for m in re.finditer(r'<w:p\b.*?</w:p>', tail_zone, re.S):
    if '<w:sectPr' in m.group(0): msec = m
assert msec is not None
sect_para = msec.group(0)

# bỏ hẳn mục DANH MỤC CÁC BÀI BÁO (không có công trình công bố)
new_doc = (doc[:s_lmd] + ''.join(content)
           + doc[s_tltk:e_tltk] + ''.join(tltk) + sect_para + doc[s_pl:])
# gỡ toàn bộ tham chiếu footnote hướng dẫn của file mẫu
new_doc = re.sub(r'<w:r\b[^>]*>(?:(?!</w:r>).)*?<w:footnoteReference[^>]*/>(?:(?!</w:r>).)*?</w:r>', '', new_doc, flags=re.S)

# ---------- styles: thêm 2 style caption con ----------
styles = zin.read('word/styles.xml').decode('utf-8')
for st in ('ChuthichHinh', 'ChuthichBang'):
    if f'w:styleId="{st}"' not in styles:
        styles = styles.replace('</w:styles>',
            f'<w:style w:type="paragraph" w:customStyle="1" w:styleId="{st}">'
            f'<w:name w:val="{st}"/><w:basedOn w:val="Chuthich"/><w:qFormat/></w:style></w:styles>')

settings = zin.read('word/settings.xml').decode('utf-8')
if '<w:updateFields' not in settings:
    settings = re.sub(r'(<w:settings\b[^>]*>)', r'\1<w:updateFields w:val="true"/>', settings, count=1)
rels = zin.read('word/_rels/document.xml.rels').decode('utf-8')
rels = rels.replace('</Relationships>', ''.join(rels_entries) + '</Relationships>')
ct = zin.read('[Content_Types].xml').decode('utf-8')
if 'Extension="png"' not in ct:
    ct = ct.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>')

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == 'word/document.xml': data = new_doc.encode('utf-8')
        elif item.filename == 'word/styles.xml': data = styles.encode('utf-8')
        elif item.filename == 'word/settings.xml': data = settings.encode('utf-8')
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
ET.fromstring(z.read('word/styles.xml'))
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
