import { describe, expect, it } from 'vitest';
import { extract, parseLine } from './import-staff-education';

/**
 * Bộ ca kiểm lấy NGUYÊN VĂN từ trang nhân sự thật trên box (24/8/2026), kể cả
 * các dòng KHÔNG được nhận. Đổ sai vào lý lịch khoa học là thứ không ai soi
 * lại — nó chỉ lộ ra lúc hồ sơ đã nộp đi đâu đó.
 */
describe('parseLine', () => {
  it('đọc dạng đầy đủ: trường, nước, năm', () => {
    expect(parseLine('B.S.: VNU-HCM University of Science, Vietnam, 2024.')).toEqual(
      {
        level: 'BACHELOR',
        institution: 'VNU-HCM University of Science',
        country: 'Vietnam',
        year: 2024,
      },
    );
  });

  it('ăn được hai dấu ngăn liền nhau của "PhD.:"', () => {
    // Cắt ở dấu ngăn đầu tiên thì tên trường mang theo dấu hai chấm ở đầu.
    expect(parseLine('PhD.: Grenoble Alpes University, France, 2014.')).toEqual({
      level: 'PHD',
      institution: 'Grenoble Alpes University',
      country: 'France',
      year: 2014,
    });
  });

  it('không cắt nhầm dấu chấm NẰM TRONG cụm bậc', () => {
    // "M.S." có dấu chấm ở giữa. Cắt ở dấu chấm đầu là ra cụm "M", trượt hết.
    const r = parseLine('M.S.: VNUHCM - University of Science, Vietnam, 2008');
    expect(r?.level).toBe('MASTER');
    expect(r?.institution).toBe('VNUHCM - University of Science');
    expect(r?.year).toBe(2008);
  });

  it('thiếu năm vẫn nhận — phần lớn trang cũ chỉ ghi trường', () => {
    expect(parseLine('PhD: VNUHCM - University of Science, Vietnam')).toEqual({
      level: 'PHD',
      institution: 'VNUHCM - University of Science',
      country: 'Vietnam',
      year: null,
    });
  });

  it('không có nước thì để trống, không đoán', () => {
    // Đoán "đoạn cuối là tên nước" sẽ biến một cái khoa thành một quốc gia.
    const r = parseLine('M.S.: VNUHCM - University of Science, Faculty of Physics');
    expect(r?.country).toBeNull();
    expect(r?.institution).toBe('VNUHCM - University of Science, Faculty of Physics');
  });

  it('Postdoc không bị xếp thành tiến sĩ', () => {
    expect(parseLine('Postdoctoral: RIKEN, Japan, 2019')?.level).toBe('POSTDOC');
  });

  // ── Những dòng PHẢI bị bỏ ────────────────────────────────────────────────
  it('bỏ dòng tên người mở đầu bằng học vị viết tắt', () => {
    // Trang `vat-ly-dien-tu/nhan-su/ths-cao-minh-khoi` mở đầu đúng như vậy.
    // Nhận nó là gán "nơi đào tạo: Cao Minh Khôi" cho chính người đó.
    expect(parseLine('ThS. Cao Minh Khôi')).toBeNull();
    expect(parseLine('TS. Trần Quang Nguyên')).toBeNull();
    expect(parseLine('CN. Lê Đức Anh')).toBeNull();
  });

  it('bỏ các dòng nhãn khác trong cùng khối', () => {
    expect(parseLine('Academic title: Bachelor of Science')).toBeNull();
    expect(parseLine('Position: Visiting Lecturer')).toBeNull();
    expect(parseLine('Full name: Le Duc Anh')).toBeNull();
    expect(parseLine('Phone: +84 347 902 484')).toBeNull();
    expect(parseLine('Email: ldanh@hcmus.edu.vn')).toBeNull();
  });

  it('bỏ dòng có bậc nhưng không nói học ở đâu', () => {
    expect(parseLine('PhD: 2014')).toBeNull();
  });

  it('bỏ dòng công bố lọt vào', () => {
    expect(
      parseLine(
        '1. Nguyen Chi Nhan, Cao Minh Khoi. Automatic prediction system, 2023',
      ),
    ).toBeNull();
  });
});

describe('extract', () => {
  it('lấy khối dưới tiêu đề Education và dừng đúng chỗ', () => {
    // Nguyên văn `vat-ly-chat-ran/nhan-su/cn-le-duc-anh`.
    const rows = extract(
      [
        'Full name: Le Duc Anh',
        'Academic title: Bachelor of Science',
        'Education:',
        'B.S.: VNU-HCM University of Science, Vietnam, 2024.',
        'Phone:+84 347 902 484',
        'Email: ldanh@hcmus.edu.vn',
      ].join('\n'),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].level).toBe('BACHELOR');
  });

  it('lấy nhiều bậc, giữ nguyên thứ tự trên trang', () => {
    const rows = extract(
      [
        'Education:',
        'PhD.: VNUHCM - University of Science, Vietnam, 2008.',
        'M.S.: Moncton University, Canada, 1997.',
        '1. Research Areas:',
        'Thin films',
      ].join('\n'),
    );
    expect(rows.map((r) => r.level)).toEqual(['PHD', 'MASTER']);
    expect(rows[1].country).toBe('Canada');
  });

  it('không có tiêu đề thì chỉ nhận dòng CÓ NĂM', () => {
    // Không tiêu đề nghĩa là không biết mình đang đọc mục gì; bắt buộc có năm
    // để khỏi vơ nhầm một dòng trong danh mục công bố.
    expect(extract('PhD: Some University, Vietnam')).toHaveLength(0);
    expect(extract('PhD: Some University, Vietnam, 2010')).toHaveLength(1);
  });

  it('trang chỉ có hướng nghiên cứu và công bố thì không lấy gì', () => {
    // Nguyên văn `vat-ly-dien-tu/nhan-su/ths-cao-minh-khoi` — 68/88 trang kiểu này.
    const rows = extract(
      [
        'ThS. Cao Minh Khôi',
        '/Email: cmkhoi@hcmus.edu.vn',
        'Hướng nghiên cứu chính: thiết kế hệ thống nhúng, IoT, AI.',
        'Các công bố gần đây:',
        '1. Nguyen Chi Nhan, Cao Minh Khoi. Automatic prediction system.',
      ].join('\n'),
    );
    expect(rows).toEqual([]);
  });

  it('khử trùng dòng lặp của trang song ngữ', () => {
    const rows = extract(
      [
        'Education:',
        'PhD.: Grenoble Alpes University, France, 2014.',
        'PhD.: Grenoble Alpes University, France, 2014.',
      ].join('\n'),
    );
    expect(rows).toHaveLength(1);
  });
});
