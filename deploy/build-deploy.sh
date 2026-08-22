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


# `python3` của Git Bash là bản msys2 và thường KHÔNG có paramiko, trong khi bản
# cài từ python.org thì có — gọi thẳng `python3` là dính "No module named
# 'paramiko'" dù đã pip install. Chọn trình thông dịch nào thật sự chạy được.
# Ép một bản cụ thể: PYTHON=/duong/dan/python.exe deploy/build-deploy.sh be
pick_python() {
  for p in ${PYTHON:-} python3 python       /c/Users/*/AppData/Local/Programs/Python/Python*/python.exe       /c/Program\ Files/Python*/python.exe; do
    [ -n "$p" ] || continue
    command -v "$p" >/dev/null 2>&1 || [ -x "$p" ] || continue
    if "$p" -c "import paramiko" >/dev/null 2>&1; then
      printf '%s' "$p"
      return 0
    fi
  done
  return 1
}

PY_BIN=$(pick_python) || {
  echo "DỪNG: không tìm được Python nào có paramiko." >&2
  echo "  Cài: python -m pip install paramiko" >&2
  echo "  Hoặc chỉ định: PYTHON=/c/Users/<ban>/AppData/Local/Programs/Python/Python313/python.exe deploy/build-deploy.sh be" >&2
  exit 1
}

# Docker phải đang chạy, nếu không thì `docker build` chết giữa chừng sau khi đã
# mất vài phút — kiểm trước cho biết ngay.
docker info >/dev/null 2>&1 || {
  echo "DỪNG: Docker chưa chạy. Mở Docker Desktop rồi thử lại." >&2
  exit 1
}

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
"$PY_BIN" "$ROOT/deploy/deploy-sandbox.py" "$ARCHIVE" $SERVICES
rm -f "$ARCHIVE"
echo "ALL_DONE $(date +%H:%M)"
