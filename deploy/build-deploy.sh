#!/bin/sh
# Build image rồi deploy lên sandbox phys.hcmus.edu.vn.
#
#   deploy/build-deploy.sh [fe|be|all]      # mặc định: all
#     fe   admin + public   (đổi giao diện)
#     be   backend          (đổi API/service)
#     all  cả ba
#
# LƯU Ý THỨ TỰ: luôn `git fetch` và kiểm remote TRƯỚC khi build. Cô Ngân cũng làm
# trên nhánh này và từng build thẳng trên box, nên build từ code cũ là ghi đè mất
# việc của người khác.
#
# Cảnh báo RAM: `nest build` của backend đặt heap 3GB. Nếu máy đang chạy stack
# docker khác (boompay-api ăn ~4GB) thì build backend sẽ OOM. Đóng bớt trước.
#
# Đổi DỮ LIỆU (sửa DB) thì không cần build — chỉ cần FLUSHALL redis và restart
# public, vì Next giữ bản render ISR trong bộ nhớ.
set -eu

TARGET="${1:-all}"
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ARCHIVE="${TMPDIR:-/tmp}/hcmus-deploy.tar.gz"
cd "$ROOT"

# Các biến này được BAKE vào bundle trình duyệt lúc build, không phải đọc lúc chạy.
ARGS="--build-arg NEXT_PUBLIC_API_URL=https://phys.hcmus.edu.vn/be \
--build-arg NEXT_PUBLIC_IMAGE_FETCH_ORIGIN=http://backend:3001 \
--build-arg NEXT_PUBLIC_SITE_URL=https://phys.hcmus.edu.vn"

behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo 0)
if [ "$behind" != "0" ]; then
  echo "DỪNG: nhánh đang đi sau remote $behind commit. Chạy 'git pull' trước." >&2
  exit 1
fi

IMAGES=""
case "$TARGET" in
  fe|all)
    echo "== admin $(date +%H:%M) =="
    docker build --network=host $ARGS -t hcmus-cms-admin ./frontend
    echo "== public $(date +%H:%M) =="
    # public build cần context ở gốc repo: nó import từ frontend/ (@admin/...)
    docker build --network=host $ARGS -f frontend-public/Dockerfile -t hcmus-cms-public .
    IMAGES="hcmus-cms-admin hcmus-cms-public"
    ;;
esac
case "$TARGET" in
  be|all)
    echo "== backend $(date +%H:%M) =="
    docker build --network=host -t hcmus-cms-backend ./backend
    IMAGES="$IMAGES hcmus-cms-backend"
    ;;
esac
[ -n "$IMAGES" ] || { echo "TARGET không hợp lệ: $TARGET (dùng fe|be|all)" >&2; exit 1; }

SERVICES=$(echo "$IMAGES" | sed 's/hcmus-cms-//g')

echo "== save $(date +%H:%M) =="
docker save $IMAGES | gzip -1 > "$ARCHIVE"

echo "== deploy $(date +%H:%M) =="
python3 "$ROOT/deploy/deploy-sandbox.py" "$ARCHIVE" $SERVICES
rm -f "$ARCHIVE"
echo "ALL_DONE $(date +%H:%M)"
