#!/usr/bin/env python3
"""E2E: cập nhật bài đã xuất bản + lên lịch một bản cập nhật.

Dựng lại đúng tình huống đã báo lỗi: đặt hẹn 9h23 mà 9h22 web đã đổi sang bản
mới. Đi qua API thật của môi trường đang chạy (không mock), tạo một bài test,
xuất bản, sửa nội dung rồi hẹn giờ, và kiểm 5 mốc:

  B1 xuất bản ngay      → web hiện V1
  B2 trước giờ hẹn      → web VẪN là V1, không lộ V2
  B3 trước giờ hẹn      → bài không biến mất khỏi danh sách công khai
  B4 tới giờ hẹn        → web đổi sang V2
  B5 sau khi cron chạy  → trạng thái PUBLISHED, hết mốc hẹn

Bài test luôn được xoá hẳn ở cuối, kể cả khi có bước hỏng.

Chạy (mất ~3 phút vì phải chờ cron mỗi phút một lần):
  E2E_EMAIL=... E2E_PASSWORD=... python3 deploy/e2e-post-schedule.py
  E2E_BASE=http://localhost:3002 ... (mặc định là production)
"""
import json, os, ssl, sys, time, urllib.request, urllib.error
from datetime import datetime, timedelta, timezone

BASE = os.environ.get("E2E_BASE", "https://phys.hcmus.edu.vn")
API = os.environ.get("E2E_API", BASE + "/be")
USER = os.environ.get("E2E_EMAIL", "")
PW = os.environ.get("E2E_PASSWORD", "")
if not USER or not PW:
    sys.exit("Thiếu E2E_EMAIL / E2E_PASSWORD (không nhúng mật khẩu vào repo).")
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

fails = []


def call(method, path, body=None, token=None, base=API, raw=False):
    req = urllib.request.Request(base + path, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    data = json.dumps(body).encode() if body is not None else None
    try:
        with urllib.request.urlopen(req, data, timeout=60, context=CTX) as r:
            payload = r.read().decode("utf-8", "replace")
            return r.status, (payload if raw else json.loads(payload or "{}"))
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def check(name, ok, detail=""):
    print(f"  {'PASS' if ok else 'FAIL'}  {name}{'  — ' + detail if detail else ''}")
    if not ok:
        fails.append(name)


def public_body(slug):
    """HTML thân bài trên trang công khai (đọc trực tiếp, không qua cache CDN)."""
    st, html = call("GET", f"/vi/{slug}", base=BASE, raw=True)
    return st, (html if isinstance(html, str) else "")


st, res = call("POST", "/auth/login", {"email": USER, "password": PW})
assert st < 400, f"login {st} {res}"
token = res.get("accessToken") or res.get("access_token") or res.get("token")
assert token, res
print("đăng nhập OK")

stamp = datetime.now().strftime("%H%M%S")
slug = f"e2e-lich-hen-{stamp}"
V1 = f"NOI-DUNG-V1-{stamp}"
V2 = f"NOI-DUNG-V2-{stamp}"

# 1. Tạo bài nháp
st, post = call("POST", "/posts", {
    "title": {"vi": f"E2E lịch hẹn {stamp}"},
    "slug": slug,
    "body": {"vi": f"<p>{V1}</p>"},
    "excerpt": None, "status": "DRAFT", "scheduledAt": None,
    "coverMediaId": None, "coverUrl": None, "coverAlt": None,
    "tagSlugs": [], "eventStartAt": None, "eventEndAt": None, "eventLocation": None,
}, token)
assert st < 400, f"tạo bài {st} {post}"
pid = post["id"]
print(f"tạo bài {pid} slug={slug}")

try:
    # 2. Gắn vào layout tin tức rồi xuất bản ngay
    st, r = call("POST", f"/posts/{pid}/clone-into-layout",
                 {"templateLayoutId": "cat_tmpl_scientific-information"}, token)
    assert st < 400, f"clone {st} {r}"
    st, r = call("POST", f"/posts/{pid}/publish-layouts", {"scheduledAt": None}, token)
    assert st < 400, f"publish {st} {r}"
    st, detail = call("GET", f"/posts/{pid}", None, token)
    lslug = detail["layouts"][0]["slug"]
    print(f"đã xuất bản, layout slug = {lslug}")
    time.sleep(6)

    st, html = public_body(lslug)
    check("B1 xuất bản ngay → trang công khai hiện V1", st == 200 and V1 in html,
          f"http {st}")

    # 3. Sửa nội dung + hẹn giờ 2 phút nữa
    at = datetime.now(timezone.utc) + timedelta(minutes=2)
    st, r = call("PATCH", f"/posts/{pid}", {
        "title": {"vi": f"E2E lịch hẹn {stamp}"},
        "slug": slug,
        "body": {"vi": f"<p>{V2}</p>"},
        "excerpt": None, "status": "SCHEDULED",
        "scheduledAt": at.isoformat().replace("+00:00", "Z"),
        "coverMediaId": None, "coverUrl": None, "coverAlt": None,
        "tagSlugs": [], "eventStartAt": None, "eventEndAt": None, "eventLocation": None,
    }, token)
    assert st < 400, f"patch {st} {r}"
    st, r = call("POST", f"/posts/{pid}/publish-layouts",
                 {"scheduledAt": at.isoformat().replace("+00:00", "Z")}, token)
    assert st < 400, f"schedule {st} {r}"
    print(f"đã hẹn lúc {at.astimezone().strftime('%H:%M:%S')} (giờ VN)")
    time.sleep(8)

    # 4. TRƯỚC giờ hẹn: web phải còn V1, và bài vẫn nằm trong danh sách công khai
    st, html = public_body(lslug)
    check("B2 trước giờ hẹn → web vẫn là V1 (không lộ V2)",
          st == 200 and V1 in html and V2 not in html, f"http {st}")

    st, lst = call("GET", "/posts/public/list?page=1&pageSize=100", base=API)
    in_list = any(p.get("slug") == slug for p in (lst.get("data") or lst.get("items") or []))
    check("B3 trước giờ hẹn → bài KHÔNG biến mất khỏi danh sách công khai", in_list)

    # 5. Chờ cron chạy
    print("chờ cron tới giờ …")
    deadline = time.time() + 240
    seen_v2 = False
    while time.time() < deadline:
        time.sleep(15)
        st, html = public_body(lslug)
        if V2 in html:
            seen_v2 = True
            break
    check("B4 tới giờ hẹn → web đổi sang V2", seen_v2)

    st, detail = call("GET", f"/posts/{pid}", None, token)
    check("B5 sau khi chạy → trạng thái về PUBLISHED, hết mốc hẹn",
          detail.get("status") == "PUBLISHED" and not detail.get("scheduledAt"),
          f"status={detail.get('status')} scheduledAt={detail.get('scheduledAt')}")
finally:
    call("DELETE", f"/posts/{pid}", None, token)
    call("DELETE", f"/posts/{pid}/purge", None, token)
    print("đã dọn bài test")

print("\n" + ("TAT CA PASS" if not fails else f"CO {len(fails)} BUOC HONG: {fails}"))
sys.exit(1 if fails else 0)
