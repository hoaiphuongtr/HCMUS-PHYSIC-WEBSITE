#!/usr/bin/env python3
"""Đẩy image đã build lên sandbox rồi recreate service.

Dùng qua deploy/build-deploy.sh, không gọi trực tiếp.

    deploy-sandbox.py <file.tar.gz> <service...>

Việc nó làm: sftp image → docker load → compose up --force-recreate các service →
FLUSHALL redis → xoá cache render của Next (GIỮ cache ảnh đã tối ưu, mất là phải
tối ưu lại nguội ~1s/ảnh) → prune image cũ.

Cần mật khẩu ở ~/.hcmus-sbpass.
"""
import os
import sys
import time

import paramiko

HOST, PORT, USER = "103.88.121.212", 63379, "vlkt"
REMOTE_DIR = "/home/vlkt/hcmus-cms"
COMPOSE = f"docker compose -f {REMOTE_DIR}/docker-compose.sandbox.yml"

if len(sys.argv) < 3:
    sys.exit(__doc__)
archive, services = sys.argv[1], sys.argv[2:]

pw = open(os.path.expanduser("~/.hcmus-sbpass")).read().strip()
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, port=PORT, username=USER, password=pw, timeout=30)


def sh(cmd: str, timeout: int = 1200) -> str:
    _, out, err = c.exec_command(cmd, timeout=timeout)
    return out.read().decode() + err.read().decode()


t0 = time.time()
sf = c.open_sftp()
sf.put(archive, "/tmp/deploy.tar.gz")
sf.close()
print(f"uploaded {os.path.getsize(archive) // 1048576}MB in {int(time.time() - t0)}s", flush=True)

print(sh("gunzip -c /tmp/deploy.tar.gz | docker load 2>&1 | tail -4"), flush=True)
print(sh(f"cd {REMOTE_DIR} && {COMPOSE} up -d --no-deps --no-build --force-recreate {' '.join(services)} 2>&1 | tail -10"), flush=True)
print(sh("docker exec hcmus-cms-redis-1 redis-cli FLUSHALL"), flush=True)
print(
    sh(
        "docker exec hcmus-cms-public-1 sh -c 'find /app/frontend-public/.next/cache "
        "-mindepth 1 -maxdepth 1 ! -name images -exec rm -rf {} + 2>/dev/null'"
    ),
    flush=True,
)
print(sh("docker image prune -f 2>&1 | tail -1; rm -f /tmp/deploy.tar.gz; df -h /var/lib/docker | tail -1"), flush=True)
print(sh(f"cd {REMOTE_DIR} && {COMPOSE} ps {' '.join(services)} --format '{{{{.Service}}}} {{{{.Status}}}}'"), flush=True)
print("DEPLOY_DONE", flush=True)
c.close()
