import { describe, expect, it } from 'vitest';
import {
  looselyMatches,
  matchAuthors,
  normalizeName,
  suggestNameVariants,
  type CandidateProfile,
} from './name-match';

describe('normalizeName', () => {
  it('bỏ dấu tiếng Việt', () => {
    expect(normalizeName('Nguyễn Vương Thuỳ Ngân')).toBe(
      'nguyen vuong thuy ngan',
    );
    expect(normalizeName('Đặng Văn Liệt')).toBe('dang van liet');
  });
  it('bỏ dấu câu và gom khoảng trắng', () => {
    expect(normalizeName('  Ngan  V. T.  Nguyen ')).toBe('ngan v t nguyen');
    expect(normalizeName('Thuy-Ngan V. Nguyen')).toBe('thuy ngan v nguyen');
  });
  it('chịu được đầu vào rỗng', () => {
    expect(normalizeName('')).toBe('');
  });
});

describe('looselyMatches', () => {
  it('khớp các dạng viết khác nhau của cùng một người', () => {
    expect(looselyMatches('Nguyen Vuong Thuy Ngan', 'Ngan V. T. Nguyen')).toBe(
      true,
    );
    expect(looselyMatches('Nguyễn Vương Thuỳ Ngân', 'N. V. T. Nguyen')).toBe(
      true,
    );
  });
  it('không khớp khi khác bộ chữ cái đầu', () => {
    expect(looselyMatches('Nguyen Vuong Thuy Ngan', 'Tran Binh')).toBe(false);
  });
  it('không khớp khi trùng chữ cái đầu nhưng không chung từ nào', () => {
    // "nntv" cả hai, nhưng không có từ đầy đủ nào trùng.
    expect(looselyMatches('N. N. T. V.', 'Vu Thanh Nam Nghia')).toBe(false);
  });
});

const NGAN: CandidateProfile = {
  userId: 'u-ngan',
  orcid: '0000-0002-1825-0097',
  normalizedVariants: ['nguyen vuong thuy ngan', 'ngan v t nguyen'],
  displayName: 'Nguyễn Vương Thuỳ Ngân',
};
const BINH: CandidateProfile = {
  userId: 'u-binh',
  orcid: null,
  normalizedVariants: ['tran binh'],
  displayName: 'Trần Bình',
};

describe('matchAuthors', () => {
  it('ORCID trùng thì khớp chắc chắn, kể cả khi tên viết lạ', () => {
    const out = matchAuthors(
      [
        { family: 'Lee', given: 'Jun' },
        {
          family: 'X',
          given: 'Y',
          orcid: 'https://orcid.org/0000-0002-1825-0097',
        },
      ],
      [NGAN, BINH],
    );
    expect(out).toEqual([
      { authorIndex: 1, userId: 'u-ngan', reason: 'orcid' },
    ]);
  });

  it('khớp theo dạng tên đã đăng ký', () => {
    const out = matchAuthors(
      [
        { family: 'Nguyen', given: 'Ngan V. T.' },
        { family: 'Lee', given: 'Jun' },
      ],
      [NGAN],
    );
    expect(out).toEqual([
      { authorIndex: 0, userId: 'u-ngan', reason: 'variant' },
    ]);
  });

  it('khớp lỏng khi chưa đăng ký dạng tên đó', () => {
    const out = matchAuthors([{ family: 'Nguyen', given: 'N. V. T.' }], [NGAN]);
    expect(out).toEqual([
      { authorIndex: 0, userId: 'u-ngan', reason: 'loose' },
    ]);
  });

  it('mỗi người chỉ khớp một vị trí, mỗi vị trí một người', () => {
    const out = matchAuthors(
      [
        { family: 'Nguyen', given: 'Ngan V. T.' },
        { family: 'Nguyen', given: 'N. V. T.' },
      ],
      [NGAN],
    );
    expect(out).toHaveLength(1);
    expect(out[0].authorIndex).toBe(0);
  });

  it('không khớp ai thì trả mảng rỗng, không đoán bừa', () => {
    expect(
      matchAuthors([{ family: 'Smith', given: 'John' }], [NGAN, BINH]),
    ).toEqual([]);
  });

  it('bằng chứng mạnh thắng bằng chứng yếu', () => {
    // Ngân xuất hiện hai lần: vị trí 0 khớp lỏng, vị trí 1 khớp ORCID.
    const out = matchAuthors(
      [
        { family: 'Nguyen', given: 'N. V. T.' },
        { family: 'Nguyen', given: 'Ngan', orcid: '0000-0002-1825-0097' },
      ],
      [NGAN],
    );
    expect(out).toEqual([
      { authorIndex: 1, userId: 'u-ngan', reason: 'orcid' },
    ]);
  });
});

describe('suggestNameVariants', () => {
  it('sinh các dạng hay dùng khi đăng báo', () => {
    const out = suggestNameVariants('Nguyễn Vương Thuỳ Ngân');
    expect(out).toContain('Nguyen Vuong Thuy Ngan');
    expect(out).toContain('Ngan V. T. Nguyen');
    expect(out).toContain('N. V. T. Nguyen');
    expect(new Set(out).size).toBe(out.length); // không trùng lặp
  });
  it('tên một chữ thì không gợi ý gì', () => {
    expect(suggestNameVariants('Ngan')).toEqual([]);
  });
});
