import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Chắn các endpoint /integration/physoom/* bằng khoá bí mật dùng chung với
 * Physoom (app xếp lịch phòng/giảng dạy). Kênh máy-với-máy, không có phiên đăng
 * nhập — Physoom gửi header `x-physoom-secret`.
 *
 * Cố ý TÁCH khỏi ACADSOOM_SYNC_SECRET: mỗi app một khoá riêng, lộ khoá app này
 * không kéo theo app kia, và thu hồi được từng cái độc lập.
 *
 * Chưa đặt PHYSOOM_SYNC_SECRET thì endpoint TỪ CHỐI phục vụ, chứ không mở toang:
 * quên cấu hình là lỗi triển khai, không phải lý do để bỏ cổng.
 */
@Injectable()
export class PhysoomSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.PHYSOOM_SYNC_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException(
        'Kênh tích hợp Physoom chưa được cấu hình (thiếu PHYSOOM_SYNC_SECRET)',
      );
    }
    const req = context.switchToHttp().getRequest();
    const given = String(req.headers?.['x-physoom-secret'] ?? '');
    if (!given || !safeEqual(given, secret)) {
      throw new UnauthorizedException('Khoá tích hợp không hợp lệ');
    }
    return true;
  }
}

/** So sánh không phụ thuộc thời gian; băm trước để hai chuỗi khác độ dài vẫn so được. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}
