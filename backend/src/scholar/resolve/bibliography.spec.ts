import { describe, expect, it } from 'vitest';
import {
  parseBibliographyFile,
  parseBibtex,
  parseCslJson,
  parseRis,
} from './bibliography';

// Dùng nối chuỗi thường thay vì template literal: fixture BibTeX có dấu huyền
// LaTeX (\`) sẽ kết thúc template literal giữa chừng.
const BIB =
  '@article{ngan2024,\n' +
  '  title = {Spin-orbit coupling in {MoS} monolayers},\n' +
  '  author = {Nguyen, Ngan V. T. and Tr{\\^a}n, B{\\`i}nh and Lee, J.},\n' +
  '  journal = {Physical Review B},\n' +
  '  volume = {109},\n' +
  '  number = {3},\n' +
  '  pages = {035101--035112},\n' +
  '  year = {2024},\n' +
  '  month = jan,\n' +
  '  doi = {10.1103/PhysRevB.109.035101},\n' +
  '  issn = {2469-9950}\n' +
  '}\n' +
  '@inproceedings{tran2023,\n' +
  '  title = {A fast solver},\n' +
  '  author = {Binh Tran and Ngan V. T. Nguyen},\n' +
  '  booktitle = {Proceedings of NeurIPS},\n' +
  '  year = {2023}\n' +
  '}\n';

const RIS = [
  'TY  - JOUR',
  'AU  - Nguyen, Ngan V. T.',
  'AU  - Lee, Jun',
  'TI  - Thermal transport in layered materials',
  'JO  - Journal of Applied Physics',
  'VL  - 135',
  'IS  - 12',
  'SP  - 124301',
  'EP  - 124310',
  'PY  - 2024',
  'DA  - 2024/03/22/',
  'DO  - 10.1063/5.0198765',
  'SN  - 0021-8979',
  'PB  - AIP Publishing',
  'ER  - ',
  '',
].join('\n');

describe('parseBibtex', () => {
  const rows = parseBibtex(BIB);

  it('đọc được cả hai mục', () => {
    expect(rows).toHaveLength(2);
  });

  it('lấy đúng trường thư mục', () => {
    const a = rows[0];
    expect(a.doi).toBe('10.1103/physrevb.109.035101');
    expect(a.type).toBe('journal-article');
    expect(a.containerTitle).toBe('Physical Review B');
    expect(a.volume).toBe('109');
    expect(a.issue).toBe('3');
    expect(a.publishedYear).toBe(2024);
    expect(a.publishedMonth).toBe(1); // "jan"
    expect(a.issn).toBe('2469-9950');
  });

  it('gỡ dấu LaTeX trong tên tác giả', () => {
    expect(rows[0].authors.map((x) => `${x.given} ${x.family}`)).toEqual([
      'Ngan V. T. Nguyen',
      'Binh Tran',
      'J. Lee',
    ]);
  });

  it('đánh dấu tác giả đứng đầu', () => {
    expect(rows[0].authors[0].sequence).toBe('first');
    expect(rows[0].authors[1].sequence).toBe('additional');
  });

  it('bỏ ngoặc nhóm trong tiêu đề', () => {
    expect(rows[0].title).toBe('Spin-orbit coupling in MoS monolayers');
  });

  it('inproceedings → proceedings-article, tên hội nghị lấy từ booktitle', () => {
    expect(rows[1].type).toBe('proceedings-article');
    expect(rows[1].containerTitle).toBe('Proceedings of NeurIPS');
    expect(rows[1].doi).toBeNull();
  });

  it('tách tác giả dạng "Tên Họ" (không có dấu phẩy)', () => {
    expect(rows[1].authors[0]).toMatchObject({ given: 'Binh', family: 'Tran' });
  });
});

describe('parseRis', () => {
  const rows = parseRis(RIS);

  it('đọc được một bản ghi', () => {
    expect(rows).toHaveLength(1);
  });

  it('lấy đúng trường, ghép trang đầu–cuối', () => {
    const r = rows[0];
    expect(r.doi).toBe('10.1063/5.0198765');
    expect(r.title).toBe('Thermal transport in layered materials');
    expect(r.containerTitle).toBe('Journal of Applied Physics');
    expect(r.pages).toBe('124301–124310');
    expect(r.publishedYear).toBe(2024);
    expect(r.publishedMonth).toBe(3); // từ DA "2024/03/22/"
    expect(r.issn).toBe('0021-8979');
    expect(r.publisher).toBe('AIP Publishing');
  });

  it('lấy đủ tác giả theo thứ tự', () => {
    expect(rows[0].authors.map((a) => a.family)).toEqual(['Nguyen', 'Lee']);
  });

  it('nhiều bản ghi nối nhau', () => {
    expect(parseRis(RIS + RIS)).toHaveLength(2);
  });
});

describe('parseCslJson', () => {
  it('đọc bản xuất của Zotero', () => {
    const rows = parseCslJson(
      JSON.stringify([
        {
          type: 'article-journal',
          title: 'A study',
          'container-title': 'Nature',
          DOI: '10.1038/abc',
          ISSN: ['0028-0836'],
          issued: { 'date-parts': [[2023, 7]] },
          author: [{ family: 'Nguyen', given: 'Ngan V. T.' }],
        },
      ]),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      doi: '10.1038/abc',
      type: 'journal-article',
      containerTitle: 'Nature',
      publishedYear: 2023,
      publishedMonth: 7,
      issn: '0028-0836',
    });
  });

  it('JSON hỏng thì trả rỗng chứ không ném lỗi', () => {
    expect(parseCslJson('{ khong phai json')).toEqual([]);
  });
});

describe('parseBibliographyFile', () => {
  it('tự nhận ra định dạng', () => {
    expect(parseBibliographyFile(BIB)).toHaveLength(2);
    expect(parseBibliographyFile(RIS)).toHaveLength(1);
    expect(parseBibliographyFile('[]')).toHaveLength(0);
  });
  it('nội dung không phải thư mục thì trả rỗng, không ném lỗi', () => {
    expect(parseBibliographyFile('xin chào')).toEqual([]);
  });
});
