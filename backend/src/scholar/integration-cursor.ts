/**
 * Cắt trang cho chế độ `?since=` của kênh tích hợp.
 *
 * Xếp theo THỜI ĐIỂM ĐỔI tăng dần rồi lấy `limit` cái đầu, và trả mốc để gọi
 * lần sau. Không xếp theo năm công bố: cái bên nhận cần là "có gì mới", không
 * phải "bài nào mới ra".
 *
 * Mốc dùng `gte`, nên lần sau bên nhận sẽ nhận lại vài bản ghi ở ranh giới. Cố
 * ý: gửi trùng thì bên nhận ghi đè theo id, vô hại; còn bỏ sót thì không có gì
 * sửa được. Thà thừa còn hơn thiếu.
 */
export function pageBySince<T>(
  rows: { changedAt: Date; item: T }[],
  limit = 500,
) {
  const sorted = [...rows].sort(
    (a, b) => a.changedAt.getTime() - b.changedAt.getTime(),
  );

  let end = Math.min(limit, sorted.length);
  // Không cắt giữa chừng một mốc thời gian. Nếu cắt, lần sau `gte` đưa ta về
  // đúng chỗ cũ (quét mãi không tiến), còn nhích mốc lên thì mất phần còn lại
  // của mốc đó. Lấy trọn mốc rồi mới dừng — có thể hơi quá `limit`, chấp nhận.
  if (end > 0) {
    const edge = sorted[end - 1].changedAt.getTime();
    while (end < sorted.length && sorted[end].changedAt.getTime() === edge)
      end++;
  }

  const page = sorted.slice(0, end);
  return {
    items: page.map((p) => p.item),
    nextSince: page.length
      ? page[page.length - 1].changedAt.toISOString()
      : null,
    hasMore: end < sorted.length,
  };
}

/** Mốc đổi của một cặp (bản ghi con, bản ghi cha) là cái muộn hơn. */
export function laterOf(a: Date, b: Date): Date {
  return a.getTime() > b.getTime() ? a : b;
}
