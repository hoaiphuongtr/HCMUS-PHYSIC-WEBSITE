import { describe, expect, it } from 'vitest';
import { laterOf, pageBySince } from './integration-cursor';

const at = (ms: number) => new Date(2026, 0, 1, 0, 0, 0, ms);
const rows = (...msList: number[]) =>
  msList.map((ms, i) => ({ changedAt: at(ms), item: `r${i}` }));

describe('pageBySince', () => {
  it('xếp theo thời điểm đổi, không theo thứ tự đầu vào', () => {
    const r = pageBySince(rows(30, 10, 20));
    expect(r.items).toEqual(['r1', 'r2', 'r0']);
    expect(r.hasMore).toBe(false);
    expect(r.nextSince).toBe(at(30).toISOString());
  });

  it('rỗng thì không có mốc để đưa cho lần sau', () => {
    expect(pageBySince([])).toEqual({
      items: [],
      nextSince: null,
      hasMore: false,
    });
  });

  it('cắt theo limit và báo còn nữa', () => {
    const r = pageBySince(rows(1, 2, 3, 4), 2);
    expect(r.items).toEqual(['r0', 'r1']);
    expect(r.hasMore).toBe(true);
    expect(r.nextSince).toBe(at(2).toISOString());
  });

  it('không cắt giữa chừng một mốc thời gian — lấy trọn rồi mới dừng', () => {
    // Ba bản ghi cùng mốc 5ms: cắt ở limit=2 sẽ làm lần quét sau (dùng `gte`)
    // quay lại đúng chỗ này và không bao giờ tiến.
    const r = pageBySince(rows(5, 5, 5, 9), 2);
    expect(r.items).toEqual(['r0', 'r1', 'r2']);
    expect(r.nextSince).toBe(at(5).toISOString());
    expect(r.hasMore).toBe(true);
  });

  it('cả trang cùng một mốc thì vẫn tiến được ở lần gọi sau', () => {
    const all = rows(7, 7, 7);
    const first = pageBySince(all, 1);
    expect(first.items).toHaveLength(3);
    expect(first.hasMore).toBe(false);
    // Bên nhận gửi lại `nextSince` với `gte` → nhận trùng, nhưng không kẹt.
    const again = pageBySince(
      all.filter((r) => r.changedAt >= new Date(first.nextSince as string)),
      1,
    );
    expect(again.items).toHaveLength(3);
  });

  it('không đụng vào mảng gốc', () => {
    const src = rows(3, 1, 2);
    pageBySince(src);
    expect(src.map((r) => r.item)).toEqual(['r0', 'r1', 'r2']);
  });
});

describe('laterOf', () => {
  it('lấy mốc muộn hơn, bất kể thứ tự tham số', () => {
    expect(laterOf(at(1), at(2))).toEqual(at(2));
    expect(laterOf(at(2), at(1))).toEqual(at(2));
  });

  it('bằng nhau thì trả cái nào cũng đúng', () => {
    expect(laterOf(at(4), at(4)).getTime()).toBe(at(4).getTime());
  });
});
