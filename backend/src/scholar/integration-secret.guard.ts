import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Chắn các endpoint /integration/* bằng khoá bí mật dùng chung với ACADsoom.
 * Đây là kênh máy-với-máy, không có phiên đăng nhập nào cả.
 *
 * Chưa đặt ACADSOOM_SYNC_SECRET thì endpoint TỪ CHỐI phục vụ, chứ không mở toang:
 * quên cấu hình là lỗi triển khai, không phải lý do để bỏ cổng.
 */
@Injectable()
export class IntegrationSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.ACADSOOM_SYNC_SECRET;
    if (!secret) {
      throw new ServiceUnavailableException(
        'Kênh tích hợp chưa được cấu hình (thiếu ACADSOOM_SYNC_SECRET)',
      );
    }
    const req = context.switchToHttp().getRequest();
    const given = String(req.headers?.['x-acadsoom-secret'] ?? '');
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
