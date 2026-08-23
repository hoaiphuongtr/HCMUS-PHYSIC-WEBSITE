/**
 * sync-physoom-members.ts — dựng tài khoản + hồ sơ khoa học từ danh sách nhân sự
 * của PHYsoom.
 *
 * PHYsoom mới là nơi giữ hồ sơ nhân sự thật; trang web Khoa chỉ là bản chép lại,
 * và bản chép đó thiếu email của hơn một nửa số người. Vì vậy lấy thẳng từ nguồn:
 *
 *   GET {PHYSOOM_BASE_URL}/api/integration/members?client=physprofile
 *   header x-physprofile-secret: {PHYSOOM_SYNC_SECRET}
 *   → { departments, members: [{ email, name, department, teacher_id, rank, degree }] }
 *
 * Thứ PHYsoom KHÔNG biết là trang nhân sự trên web Khoa. Script tự dò theo tên đã
 * chuẩn hoá để nối `staffPageSlug`.
 *
 * Cần trong backend/.env:
 *   PHYSOOM_BASE_URL=https://physoom.vercel.app
 *   PHYSOOM_SYNC_SECRET=...
 *
 * Chạy thử (không ghi gì):
 *   docker compose -f docker-compose.sandbox.yml exec backend \
 *     node_modules/.bin/tsx initialScript/migrate-legacy/sync-physoom-members.ts
 * Ghi:
 *   ... sync-physoom-members.ts --apply
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import {
  normalizeName,
  suggestNameVariants,
} from '../../src/scholar/name-match';

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    new Pool({ connectionString: process.env.DATABASE_URL }),
  ),
});

const APPLY = process.argv.includes('--apply');

type Member = {
  email: string;
  name: string;
  department: string;
  teacher_id: string;
  rank: string;
  degree: string;
};

/**
 * Suy "cơ hữu" từ NGẠCH viên chức mà PHYsoom ghi.
 *
 * PHYsoom KHÔNG có trường hình thức công tác — payload chỉ có
 * `id, email, name, department, teacher_id, rank, degree`. Nhưng `rank` là ngạch
 * viên chức (GV, GVC, GVCC, TrG, CV, NCV): giữ ngạch ở Trường nghĩa là đang
 * trong biên chế, tức cơ hữu. Thỉnh giảng không giữ ngạch.
 *
 * CHIỀU NGƯỢC LẠI KHÔNG ĐÚNG. Trống ngạch là THIẾU DỮ LIỆU, không phải bằng
 * chứng thỉnh giảng — 40/135 người đang trống. Đoán họ là thỉnh giảng sẽ gạt
 * người thật ra khỏi định mức NCKH của Khoa, nên để trống và chờ họ tự khai.
 */
const coHuu = (m: Member) => Boolean((m.rank || '').trim());

/** Học hàm học vị đứng trước tên trên trang nhân sự. */
const TITLE_RE = /^((GS|PGS|TS|ThS|Ths|CN|KS|NCS|GVC|GVCC|BS|TrG)[.\s]*)+/i;
const stripTitles = (n: string) => n.replace(TITLE_RE, '').trim();

/**
 * Email có dùng được không. Danh sách của PHYsoom có cả lỗi gõ thật
 * (hcmus.edu.vvn) — tạo tài khoản bằng địa chỉ sai là người đó vĩnh viễn không
 * đăng nhập được, mà lỗi lại rất khó thấy về sau.
 */
function emailProblem(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e)) return 'sai định dạng';
  const domain = e.split('@')[1];
  // Lỗi gõ đã gặp thật trong danh sách: hcmus.edu.vvn, hcmut.edu.com.
  // `.edu.<gì đó không phải vn>` ở một trường Việt Nam gần như luôn là gõ nhầm.
  if (/\.vvn$|\.con$|\.cm$|\.vnn$|\.vm$/.test(domain))
    return `tên miền đáng ngờ (${domain})`;
  if (/\.edu\.(?!vn$)[a-z]+$/.test(domain))
    return `tên miền đáng ngờ (${domain}) — có phải .edu.vn không?`;
  return null;
}

/** Hộp thư ngoài trường: hợp lệ, nhưng nên biết là ai để khỏi bất ngờ. */
const isExternal = (email: string) =>
  !/@([a-z0-9-]+\.)?hcmus\.edu\.vn$/i.test(email.trim());

/** Đi hết cây Puck; khối con nằm trong props của khối cha, không ở data.zones. */
function walk(
  node: unknown,
  visit: (n: { type?: string; props?: Record<string, unknown> }) => void,
): void {
  if (Array.isArray(node)) return node.forEach((c) => walk(c, visit));
  if (!node || typeof node !== 'object') return;
  const n = node as { type?: string; props?: Record<string, unknown> };
  if (typeof n.type === 'string') visit(n);
  for (const v of Object.values(n)) {
    if (v && typeof v === 'object') walk(v, visit);
  }
}

function staffName(puckData: unknown): string {
  let found = '';
  walk(puckData, (n) => {
    if (found) return;
    if (n.type !== 'StaffProfileEditorial' && n.type !== 'StaffProfile') return;
    const raw = (n.props ?? {}).name;
    const v =
      typeof raw === 'string'
        ? raw
        : ((raw as { vi?: string; en?: string } | undefined)?.vi ??
          (raw as { vi?: string; en?: string } | undefined)?.en ??
          '');
    if (v) found = String(v);
  });
  return found;
}

async function main(): Promise<void> {
  const base = (process.env.PHYSOOM_BASE_URL ?? '').replace(/\/$/, '');
  const secret = process.env.PHYSOOM_SYNC_SECRET ?? '';
  if (!base || !secret) {
    console.error(
      'Thiếu PHYSOOM_BASE_URL hoặc PHYSOOM_SYNC_SECRET trong backend/.env',
    );
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const res = await fetch(
    `${base}/api/integration/members?client=physprofile`,
    { headers: { 'x-physprofile-secret': secret } },
  );
  if (!res.ok) {
    console.error(`PHYsoom trả ${res.status} — kiểm lại khoá đồng bộ.`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }
  const data = (await res.json()) as { members?: Member[] };
  const members = (data.members ?? []).filter((m) => m.email);
  console.log(`PHYsoom trả ${members.length} nhân sự.\n`);

  // ── Nối với trang nhân sự trên web Khoa theo tên ───────────────────────────
  const layouts = await prisma.pageLayout.findMany({
    where: {
      deletedAt: null,
      isPublished: true,
      slug: { contains: '/nhan-su/' },
    },
    select: { slug: true, puckData: true },
  });
  const slugByName = new Map<string, string>();
  for (const l of layouts) {
    const n = normalizeName(stripTitles(staffName(l.puckData)));
    // Một người có thể có nhiều trang — giữ trang đầu, đủ để trỏ tới.
    if (n && !slugByName.has(n)) slugByName.set(n, l.slug);
  }
  console.log(`Đọc được tên từ ${slugByName.size} trang nhân sự.\n`);

  // ── Bộ môn: khớp theo tên đã chuẩn hoá ────────────────────────────────────
  const departments = await prisma.department.findMany({
    select: { id: true, name: true, slug: true },
  });
  const deptByName = new Map(
    departments.map((d) => [normalizeName(d.name), d.id]),
  );

  const bad: Array<{ m: Member; why: string }> = [];
  const good: Member[] = [];
  for (const m of members) {
    const why = emailProblem(m.email);
    if (why) bad.push({ m, why });
    else good.push(m);
  }

  let linked = 0;
  let unlinked = 0;
  for (const m of good) {
    if (slugByName.has(normalizeName(stripTitles(m.name)))) linked += 1;
    else unlinked += 1;
  }

  console.log(`Email dùng được : ${good.length}`);
  console.log(`Email có vấn đề : ${bad.length}  (BỎ QUA)`);
  console.log(`Nối được trang nhân sự: ${linked}`);
  console.log(`Không tìm thấy trang  : ${unlinked}\n`);

  const external = good.filter((m) => isExternal(m.email));
  if (external.length) {
    console.log('── Email NGOÀI trường (vẫn dùng được, chỉ để biết) ──');
    for (const m of external) {
      console.log(
        `  ${m.email.padEnd(32)} ${m.name.padEnd(26)} ${m.department || '(không rõ bộ môn)'}`,
      );
    }
    console.log(
      '  Phần lớn là người đã nghỉ hoặc thỉnh giảng. SSO vẫn đăng nhập được vì' +
        ' PHYsoom xác thực bằng chính địa chỉ này.\n',
    );
  }

  if (bad.length) {
    console.log('── Email có vấn đề, phải sửa bên PHYsoom ──');
    for (const b of bad) {
      console.log(
        `  ${b.m.email.padEnd(32)} ${b.m.name.padEnd(28)} ← ${b.why}`,
      );
    }
    console.log();
  }

  if (!APPLY) {
    // Hình thức công tác ảnh hưởng tới ĐỊNH MỨC NCKH, nên phải soi được TRƯỚC khi
    // ghi. Liệt kê riêng thay vì nhét thêm một cột: người cần xem là người sắp bị
    // gán "cơ hữu", và họ phải đọc được lý do — ngạch nào.
    const seCoHuu = good.filter(coHuu);
    const chuaRo = good.filter((m) => !coHuu(m));
    const theoNgach = new Map<string, number>();
    for (const m of seCoHuu) {
      const k = (m.rank || '').trim();
      theoNgach.set(k, (theoNgach.get(k) ?? 0) + 1);
    }

    console.log('── Hình thức công tác sẽ điền sẵn ──');
    console.log(
      `  ${seCoHuu.length} người CÓ NGẠCH → điền "cơ hữu"; ` +
        `${chuaRo.length} người trống ngạch → ĐỂ TRỐNG, chờ họ tự khai.`,
    );
    console.log(
      '  Theo ngạch: ' +
        [...theoNgach.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([k, n]) => `${k} ${n}`)
          .join(' · '),
    );
    console.log(
      '  Chỉ ghi vào hồ sơ đang TRỐNG trường này — không đè lên ai đã tự khai.',
    );
    if (chuaRo.length) {
      console.log('  Trống ngạch (để trống, KHÔNG đoán là thỉnh giảng):');
      for (const m of chuaRo.slice(0, 12)) {
        console.log(
          `    ${m.email.padEnd(32)} ${m.name.padEnd(26)} ${m.department || '(không rõ bộ môn)'}`,
        );
      }
      if (chuaRo.length > 12) {
        console.log(`    … còn ${chuaRo.length - 12} người nữa`);
      }
    }
    console.log();

    console.log('── 15 dòng đầu sẽ ghi ──');
    for (const m of good.slice(0, 15)) {
      const slug = slugByName.get(normalizeName(stripTitles(m.name)));
      console.log(
        `  ${m.email.padEnd(30)} ${m.name.padEnd(26)} ${(m.degree || '—').padEnd(5)} ` +
          `${(m.rank || '—').padEnd(5)} ${coHuu(m) ? 'cơ hữu' : '  —   '} ` +
          `${(m.department || '—').padEnd(24)} ${slug ? '→ ' + slug : '(chưa có trang)'}`,
      );
    }
    console.log('\n(chạy thử — chưa ghi gì; thêm --apply để tạo thật)');
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let updated = 0;
  let profiles = 0;

  for (const m of good) {
    const email = m.email.trim().toLowerCase();
    const key = normalizeName(stripTitles(m.name));
    const slug = slugByName.get(key) ?? null;
    const deptId = m.department
      ? (deptByName.get(normalizeName(m.department)) ?? null)
      : null;

    const parts = stripTitles(m.name).trim().split(/\s+/).filter(Boolean);
    const firstName =
      parts.length > 1 ? parts[parts.length - 1] : (parts[0] ?? '');
    const lastName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Tên và học vị lấy lại từ PHYsoom mỗi lần đồng bộ — đó là nguồn sự thật.
    // VAI TRÒ và bộ môn chỉ đặt lúc TẠO MỚI: một quản trị viên cũng có mặt trong
    // danh sách này, hạ họ xuống LECTURER là mất luôn trang quản trị.
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        position: m.degree || undefined,
      },
      create: {
        email,
        firstName,
        lastName,
        position: m.degree || null,
        departmentId: deptId,
        role: 'LECTURER',
        isActive: true,
      },
      select: { id: true },
    });
    if (existing) updated += 1;
    else created += 1;

    const profile = await prisma.scholarProfile.findUnique({
      where: { userId: user.id },
      select: { id: true, staffPageSlug: true, affiliationType: true },
    });

    if (!profile) {
      const p = await prisma.scholarProfile.create({
        data: {
          userId: user.id,
          staffPageSlug: slug,
          affiliationType: coHuu(m) ? 'FULL_TIME' : null,
        },
        select: { id: true },
      });
      // Gợi sẵn các dạng tên hay dùng khi đăng báo — người dùng bỏ bớt dạng nào
      // họ không dùng, nhanh hơn hẳn tự gõ ra.
      const variants = suggestNameVariants(stripTitles(m.name));
      if (variants.length) {
        await prisma.scholarNameVariant.createMany({
          data: variants.map((raw, i) => ({
            profileId: p.id,
            raw,
            normalized: normalizeName(raw),
            isPrimary: i === 0,
          })),
          skipDuplicates: true,
        });
      }
      profiles += 1;
    } else if (
      (!profile.staffPageSlug && slug) ||
      (!profile.affiliationType && coHuu(m))
    ) {
      // Chỉ điền chỗ còn trống, không ghi đè thứ người dùng đã tự sửa. Ghi từng
      // trường có điều kiện chứ không gộp một cục: vào nhánh này vì lý do cơ hữu
      // mà `slug` đang rỗng thì gộp cả cục sẽ XOÁ MẤT slug đã nối được trước đó.
      await prisma.scholarProfile.update({
        where: { id: profile.id },
        data: {
          ...(!profile.staffPageSlug && slug ? { staffPageSlug: slug } : {}),
          ...(!profile.affiliationType && coHuu(m)
            ? { affiliationType: 'FULL_TIME' as const }
            : {}),
        },
      });
    }
  }

  console.log(
    `Đã tạo ${created} tài khoản, cập nhật ${updated}, dựng ${profiles} hồ sơ khoa học.`,
  );
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
