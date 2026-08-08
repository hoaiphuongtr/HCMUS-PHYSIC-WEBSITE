#!/bin/sh
# Tìm và tải lại các tệp /uploads/legacy/... mà nội dung trang còn trỏ tới nhưng
# không có trong thư mục uploads (link tải trả 404).
#
# Đợt di trú đầu lấy tệp theo danh sách sinh từ dump; một số tệp hỏng hoặc bị bỏ
# sót nên trang vẫn trỏ tới mà máy chủ không có — người dùng bấm vào thì thấy
# JSON 404 của backend. Site cũ vẫn phục vụ được nên lấy thẳng từ đó.
#
# Chạy TRÊN BOX (cần thư mục uploads và mạng tới origin cũ):
#   sh fetch-missing-legacy-assets.sh            # chỉ liệt kê, không tải
#   sh fetch-missing-legacy-assets.sh --download # tải thật
set -u

UPLOADS="${UPLOADS:-/home/vlkt/hcmus-cms/backend/uploads}"
ORIGIN="${LEGACY_ORIGIN:-https://112.78.11.146}"
HOST_HEADER="${LEGACY_HOST:-phys.hcmus.edu.vn}"
DB_CONTAINER="${DB_CONTAINER:-hcmus-cms-db-1}"
WORK=/tmp/missing-assets
DOWNLOAD=0
[ "${1:-}" = "--download" ] && DOWNLOAD=1

mkdir -p "$WORK"

# Đường dẫn trong HTML là dạng URL đã mã hoá (%20, %C3%A0…), còn trên đĩa là tên
# thật. Box không có python nên giải mã bằng printf: %XX -> \xXX.
urldecode() {
  printf '%b' "$(printf '%s' "$1" | sed 's/+/ /g; s/%/\\x/g')"
}

echo "1/4 lấy mọi tham chiếu /uploads/legacy/ từ các trang đã xuất bản …"
docker exec -i "$DB_CONTAINER" psql -U physics -d hcmus_physics -t -A \
  -c 'SELECT "publishedPuckData"::text FROM "PageLayout" WHERE "deletedAt" IS NULL AND "isPublished"' \
  > "$WORK/dump.txt" 2>/dev/null

# Tham chiếu nằm trong HTML đã escape trong JSON: kết thúc ở dấu nháy hoặc dấu
# gạch chéo ngược. KHÔNG loại dấu ngoặc đơn — tên tệp legacy đầy "1_(7).jpg",
# cắt ở đó thì đường dẫn cụt và tải hỏng.
grep -oE '/uploads/legacy/[^"\\ <>]+' "$WORK/dump.txt" \
  | sed 's/&amp;/\&/g' | sort -u > "$WORK/refs.txt"
echo "    $(wc -l < "$WORK/refs.txt") tham chiếu khác nhau"

echo "2/4 đối chiếu với thư mục uploads …"
: > "$WORK/missing.txt"
while IFS= read -r ref; do
  # /uploads/legacy/x/y.pdf -> <UPLOADS>/legacy/x/y.pdf, giải mã %XX của URL.
  rel=$(urldecode "${ref#/uploads/}")
  [ -f "$UPLOADS/$rel" ] || echo "$ref" >> "$WORK/missing.txt"
done < "$WORK/refs.txt"
echo "    THIẾU $(wc -l < "$WORK/missing.txt") tệp"

echo "3/4 nhóm theo phần mở rộng:"
sed 's/.*\.//' "$WORK/missing.txt" | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn | head -10

if [ "$DOWNLOAD" -eq 0 ]; then
  echo "4/4 (chỉ liệt kê — thêm --download để tải thật)"
  echo "    danh sách: $WORK/missing.txt"
  exit 0
fi

echo "4/4 tải từ origin cũ …"
ok=0; fail=0
while IFS= read -r ref; do
  # Trên site cũ tệp nằm ở /uploads/<phần còn lại>, không có đoạn "legacy".
  src="$ORIGIN/uploads/${ref#/uploads/legacy/}"
  rel=$(urldecode "${ref#/uploads/}")
  dest="$UPLOADS/$rel"
  mkdir -p "$(dirname "$dest")"
  code=$(curl -sk -H "Host: $HOST_HEADER" -o "$dest.part" -w '%{http_code}' --max-time 180 "$src")
  size=$(wc -c < "$dest.part" 2>/dev/null || echo 0)
  # Site cũ trả 200 kèm trang soft-404 (~39KB HTML) → kiểm nội dung, không tin mã.
  if [ "$code" = "200" ] && [ "$size" -gt 1000 ] && ! head -c 200 "$dest.part" | grep -qi '<!DOCTYPE html'; then
    mv "$dest.part" "$dest"; ok=$((ok+1)); echo "  + $rel ($size bytes)"
  else
    rm -f "$dest.part"; fail=$((fail+1)); echo "  ! $code $rel"
  fi
done < "$WORK/missing.txt"
echo "Xong. tải được=$ok  không lấy được=$fail"
