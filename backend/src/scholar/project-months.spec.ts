import { describe, expect, it } from 'vitest';
import { soThang } from './project.service';

/**
 * Số tháng thực hiện là MẪU SỐ của phép chia giờ theo năm học (Phụ lục 2 tr.
 * 2.7). Lệch một tháng là lệch giờ của mọi thành viên, ở mọi năm — nên nó đáng
 * có test riêng dù chỉ là một phép trừ.
 */
describe('soThang', () => {
  it('tính CẢ tháng đầu lẫn tháng cuối', () => {
    // 1/2025 → 12/2025 là 12 tháng, không phải 11.
    expect(soThang(2025, 1, 2025, 12)).toBe(12);
  });

  it('cùng một tháng thì vẫn là một tháng', () => {
    expect(soThang(2025, 6, 2025, 6)).toBe(1);
  });

  it('bắc qua nhiều năm', () => {
    expect(soThang(2024, 7, 2027, 6)).toBe(36);
  });

  it('bắc qua ranh giới năm dương lịch', () => {
    expect(soThang(2025, 11, 2026, 2)).toBe(4);
  });

  it('thiếu bất kỳ mốc nào thì không suy được — trả null để dùng số nhập tay', () => {
    expect(soThang(null, 1, 2025, 12)).toBeNull();
    expect(soThang(2025, null, 2025, 12)).toBeNull();
    expect(soThang(2025, 1, null, 12)).toBeNull();
    expect(soThang(2025, 1, 2025, null)).toBeNull();
    expect(soThang(undefined, undefined, undefined, undefined)).toBeNull();
  });

  it('kết thúc trước khi bắt đầu là dữ liệu sai — trả null, KHÔNG trả số âm', () => {
    // Trả số âm thì nó chảy thẳng vào mẫu số và cho ra giờ âm mà không ai thấy.
    expect(soThang(2026, 5, 2025, 3)).toBeNull();
  });
});
