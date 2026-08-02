#!/bin/sh
# Watchdog cho sandbox phys.hcmus.edu.vn.
#
# Lý do tồn tại: 02/08 container public treo CÂM — tiến trình còn sống, cổng còn
# LISTEN, nên "restart: unless-stopped" của Docker không kích hoạt; site 502 suốt
# 5 tiếng tới khi có người phát hiện. Docker chỉ tự restart khi tiến trình THOÁT,
# không xử lý trường hợp treo.
#
# Cách làm: mỗi phút gọi thử một đường dẫn nhẹ của từng service. Hỏng liên tiếp
# FAILS_NEEDED lần mới restart (tránh restart oan vì một nhịp mạng chập chờn).
set -u
LOG=/home/vlkt/deploy/watchdog.log
STATE=/tmp/watchdog-state
FAILS_NEEDED=3
TIMEOUT=25
mkdir -p "$STATE"

# Đĩa / đang ~99% (docker.img chiếm sẵn 32G) nên tự cắt log, đừng để nó góp phần làm đầy.
[ -f "$LOG" ] && [ "$(stat -c%s "$LOG")" -gt 5242880 ] && tail -c 1048576 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"

check() { # check <ten container> <url>
  name=$1; url=$2; f="$STATE/$name"
  code=$(curl -s -o /dev/null -m "$TIMEOUT" -w '%{http_code}' "$url" 2>/dev/null)
  # 2xx/3xx là sống; 000 (không nối được/timeout) hoặc 5xx là hỏng
  case "$code" in
    2*|3*|404) [ -f "$f" ] && rm -f "$f"; return 0;;
  esac
  n=$(( $(cat "$f" 2>/dev/null || echo 0) + 1 ))
  echo "$n" > "$f"
  echo "$(date '+%F %T') $name hong lan $n/$FAILS_NEEDED (http=$code) $url" >> "$LOG"
  if [ "$n" -ge "$FAILS_NEEDED" ]; then
    echo "$(date '+%F %T') $name -> RESTART" >> "$LOG"
    docker restart "$name" >> "$LOG" 2>&1
    rm -f "$f"
  fi
}

# Gọi từ BÊN TRONG mạng docker (dùng cho service không expose HTTP trần ra host).
check_internal() {
  name=$1; url=$2; f="$STATE/$name"
  code=$(docker exec hcmus-cms-public-1 node -e "fetch('$url').then(r=>console.log(r.status)).catch(()=>console.log('000'))" 2>/dev/null | tail -1)
  case "$code" in
    2*|3*|404) [ -f "$f" ] && rm -f "$f"; return 0;;
  esac
  n=$(( $(cat "$f" 2>/dev/null || echo 0) + 1 ))
  echo "$n" > "$f"
  echo "$(date '+%F %T') $name hong lan $n/$FAILS_NEEDED (http=$code) $url" >> "$LOG"
  if [ "$n" -ge "$FAILS_NEEDED" ]; then
    echo "$(date '+%F %T') $name -> RESTART" >> "$LOG"
    docker restart "$name" >> "$LOG" 2>&1
    rm -f "$f"
  fi
}

check hcmus-cms-public-1  http://localhost:3002/vi
check hcmus-cms-backend-1 http://localhost:3001/categories
# Cổng 3000 trên host là cổng TLS của Caddy, gọi HTTP trần vào đó bị 400 — phải
# gọi thẳng container admin qua mạng nội bộ của docker.
check_internal hcmus-cms-admin-1 http://admin:3000/login
