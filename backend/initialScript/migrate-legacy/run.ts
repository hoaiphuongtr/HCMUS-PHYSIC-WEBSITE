import { PrismaPg } from '@prisma/adapter-pg';
import * as mysql from 'mysql2/promise';
import { Pool } from 'pg';
import { Prisma, PrismaClient } from '../../src/generated/prisma/client';

type LangId = 1 | 2;
type LegacyLocalized = Record<LangId, string | null | undefined>;

const SUPER_ADMIN_EMAIL = 'phuong@boompay.app';

const LEGACY = {
  host: 'localhost',
  port: 3309,
  user: 'root',
  password: 'root',
  database: 'legacy',
};

const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pgPool) });

function buildLocalized(rows: { langid: number; title?: string | null; content?: string | null; excerpt?: string | null }[], field: 'title' | 'content' | 'excerpt'): { vi: string; en?: string } {
  let vi = '';
  let en: string | undefined;
  for (const r of rows) {
    const value = (r[field] ?? '').toString().trim();
    if (!value) continue;
    if (r.langid === 1) vi = value;
    if (r.langid === 2) en = value;
  }
  return en ? { vi, en } : { vi };
}

function chooseSlug(base: string, taken: Set<string>): string {
  let candidate = base.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'item';
  if (!taken.has(candidate)) {
    taken.add(candidate);
    return candidate;
  }
  let n = 2;
  while (taken.has(`${candidate}-${n}`)) n++;
  const final = `${candidate}-${n}`;
  taken.add(final);
  return final;
}

function mapStatus(legacyStatus: number): 'DRAFT' | 'PUBLISHED' {
  return legacyStatus === 1 ? 'PUBLISHED' : 'DRAFT';
}

function parseDate(raw: Date | string | null | undefined): Date | null {
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function migrateDepartments(legacy: mysql.Connection): Promise<Map<number, string>> {
  const [rows] = await legacy.query<mysql.RowDataPacket[]>(`
    SELECT d.id, d.slug, d.email, d.phone,
           GROUP_CONCAT(DISTINCT CONCAT(dl.langid, ':', dl.title) ORDER BY dl.langid SEPARATOR '||') AS titles
    FROM depts d
    LEFT JOIN deptslang dl ON dl.deptid = d.id
    WHERE d.deleted = 0
    GROUP BY d.id
  `);
  const existingSlugs = new Set<string>(
    (await prisma.department.findMany({ select: { id: true, slug: true } }))
      .filter((d) => !d.id.startsWith('dept_legacy_'))
      .map((d) => d.slug),
  );
  const map = new Map<number, string>();
  for (const r of rows) {
    const titleParts = (r.titles as string | null)?.split('||') ?? [];
    const titles: LegacyLocalized = { 1: null, 2: null };
    for (const p of titleParts) {
      const [lang, ...rest] = p.split(':');
      const value = rest.join(':');
      titles[Number(lang) as LangId] = value;
    }
    const viName = titles[1] || titles[2] || `Khoa ${r.id}`;
    const id = `dept_legacy_${r.id}`;
    const existing = await prisma.department.findUnique({ where: { id } });
    const slug = existing?.slug ?? chooseSlug((r.slug as string) || `dept-${r.id}`, existingSlugs);
    await prisma.department.upsert({
      where: { id },
      update: { name: viName, email: r.email ?? null, phone: r.phone ?? null },
      create: { id, name: viName, slug, email: r.email ?? null, phone: r.phone ?? null },
    });
    map.set(r.id as number, id);
  }
  return map;
}

async function ensureSuperAdmin(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: SUPER_ADMIN_EMAIL } });
  if (existing) return existing.id;
  const created = await prisma.user.create({
    data: {
      email: SUPER_ADMIN_EMAIL,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      hasSetPreferences: true,
    },
  });
  return created.id;
}

async function migrateUsers(
  legacy: mysql.Connection,
  deptMap: Map<number, string>,
): Promise<Map<number, string>> {
  const [rows] = await legacy.query<mysql.RowDataPacket[]>(`
    SELECT id, deptid, fullname, username, email, phone, avatar, roleid, status
    FROM users
    WHERE deleted = 0
  `);
  const existingEmails = new Set<string>(
    (await prisma.user.findMany({ select: { id: true, email: true } }))
      .filter((u) => !u.id.startsWith('legacy_user_'))
      .map((u) => u.email),
  );
  const map = new Map<number, string>();
  for (const r of rows) {
    const id = `legacy_user_${r.id}`;
    let email = ((r.email as string | null) ?? `${r.username}@legacy.local`).toLowerCase();
    if (existingEmails.has(email)) {
      email = `${(r.username as string) || 'legacy'}_${r.id}@legacy.local`;
    }
    existingEmails.add(email);
    const fullname = ((r.fullname as string) ?? '').trim();
    const firstSpace = fullname.lastIndexOf(' ');
    const firstName = firstSpace > 0 ? fullname.slice(firstSpace + 1) : fullname || 'Legacy';
    const lastName = firstSpace > 0 ? fullname.slice(0, firstSpace) : '';
    const role: 'SUPER_ADMIN' | 'ADMIN' = r.roleid === 1 ? 'SUPER_ADMIN' : 'ADMIN';
    const deptId = deptMap.get(r.deptid as number) ?? null;
    await prisma.user.upsert({
      where: { id },
      update: {
        firstName,
        lastName,
        role,
        isActive: r.status === 1,
        avatarUrl: (r.avatar as string | null) || null,
        phone: (r.phone as string | null) || null,
        departmentId: deptId,
      },
      create: {
        id,
        email,
        firstName,
        lastName,
        role,
        isActive: r.status === 1,
        avatarUrl: (r.avatar as string | null) || null,
        phone: (r.phone as string | null) || null,
        departmentId: deptId,
      },
    });
    map.set(r.id as number, id);
  }
  return map;
}

async function migrateCategories(legacy: mysql.Connection): Promise<Map<number, string>> {
  const [rows] = await legacy.query<mysql.RowDataPacket[]>(`
    SELECT c.id, c.slug, c.image, c.status,
           cl.langid, cl.title, cl.excerpt
    FROM categories c
    LEFT JOIN categorieslang cl ON cl.catid = c.id
    WHERE c.deleted = 0
    ORDER BY c.id, cl.langid
  `);
  type Acc = {
    id: number;
    slug: string;
    image: string | null;
    status: number;
    langs: { langid: number; title: string; excerpt: string | null }[];
  };
  const grouped = new Map<number, Acc>();
  for (const r of rows) {
    const id = r.id as number;
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        slug: (r.slug as string) ?? `category-${id}`,
        image: (r.image as string) ?? null,
        status: r.status as number,
        langs: [],
      });
    }
    if (r.langid != null) {
      grouped.get(id)!.langs.push({
        langid: r.langid as number,
        title: (r.title as string) ?? '',
        excerpt: (r.excerpt as string) ?? null,
      });
    }
  }
  const existingSlugs = new Set<string>(
    (await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug),
  );
  const map = new Map<number, string>();
  for (const cat of grouped.values()) {
    const existing = await prisma.category.findUnique({ where: { legacyId: cat.id } });
    const name = buildLocalized(cat.langs, 'title') as unknown as Prisma.InputJsonValue;
    const excerptRaw = buildLocalized(cat.langs, 'excerpt');
    const excerpt: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
      excerptRaw.vi || excerptRaw.en ? (excerptRaw as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          name,
          excerpt,
          image: cat.image,
          status: cat.status === 1,
        },
      });
      map.set(cat.id, existing.id);
      continue;
    }
    const slug = chooseSlug(cat.slug, existingSlugs);
    const id = `cat_legacy_${cat.id}`;
    await prisma.category.create({
      data: {
        id,
        slug,
        name,
        excerpt,
        image: cat.image,
        status: cat.status === 1,
        legacyId: cat.id,
      },
    });
    map.set(cat.id, id);
  }
  return map;
}

async function migratePosts(
  legacy: mysql.Connection,
  catMap: Map<number, string>,
  userMap: Map<number, string>,
  superAdminId: string,
): Promise<{ inserted: number; updated: number; skipped: number }> {
  const [rows] = await legacy.query<mysql.RowDataPacket[]>(`
    SELECT p.id, p.slug, p.catid, p.status, p.image, p.deptid, p.calendar,
           p.createdat, p.updatedat, p.createdby,
           pl.langid, pl.title, pl.content, pl.excerpt
    FROM posts p
    LEFT JOIN postslang pl ON pl.postid = p.id
    WHERE p.deleted = 0
    ORDER BY p.id, pl.langid
  `);
  type Acc = {
    id: number;
    slug: string;
    catid: number;
    status: number;
    image: string | null;
    calendar: Date | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    createdBy: number | null;
    langs: { langid: number; title: string; content: string | null; excerpt: string | null }[];
  };
  const grouped = new Map<number, Acc>();
  for (const r of rows) {
    const id = r.id as number;
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        slug: (r.slug as string) ?? `post-${id}`,
        catid: r.catid as number,
        status: r.status as number,
        image: (r.image as string) ?? null,
        calendar: parseDate(r.calendar as Date | string | null),
        createdAt: parseDate(r.createdat as Date | string | null),
        updatedAt: parseDate(r.updatedat as Date | string | null),
        createdBy: r.createdby as number | null,
        langs: [],
      });
    }
    if (r.langid != null) {
      grouped.get(id)!.langs.push({
        langid: r.langid as number,
        title: (r.title as string) ?? '',
        content: (r.content as string) ?? null,
        excerpt: (r.excerpt as string) ?? null,
      });
    }
  }
  const existingSlugs = new Set<string>(
    (await prisma.post.findMany({ select: { slug: true, legacyId: true } }))
      .filter((p) => p.legacyId == null)
      .map((p) => p.slug),
  );
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const p of grouped.values()) {
    const title = buildLocalized(p.langs, 'title');
    if (!title.vi && !title.en) {
      skipped++;
      continue;
    }
    const bodyRaw = buildLocalized(p.langs, 'content');
    const excerptRaw = buildLocalized(p.langs, 'excerpt');
    const categoryId = catMap.get(p.catid) ?? 'cat_default_educational';
    const createdBy = (p.createdBy ? userMap.get(p.createdBy) : null) ?? superAdminId;
    const existing = await prisma.post.findUnique({ where: { legacyId: p.id } });
    const titleJson = title as unknown as Prisma.InputJsonValue;
    const bodyJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
      bodyRaw.vi || bodyRaw.en ? (bodyRaw as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
    const excerptJson: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue =
      excerptRaw.vi || excerptRaw.en ? (excerptRaw as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
    const baseData = {
      title: titleJson,
      body: bodyJson,
      excerpt: excerptJson,
      categoryId,
      status: mapStatus(p.status) as 'DRAFT' | 'PUBLISHED',
      coverUrl: p.image,
      coverAlt: title.vi || null,
      publishedAt: p.status === 1 ? (p.calendar ?? p.createdAt ?? new Date(0)) : null,
      createdBy,
    };
    if (existing) {
      await prisma.post.update({ where: { id: existing.id }, data: baseData });
      updated++;
      continue;
    }
    const slug = chooseSlug(p.slug, existingSlugs);
    await prisma.post.create({
      data: {
        ...baseData,
        id: `post_legacy_${p.id}`,
        slug,
        legacyId: p.id,
        createdAt: p.createdAt ?? new Date(),
        updatedAt: p.updatedAt ?? p.createdAt ?? new Date(),
      },
    });
    inserted++;
  }
  return { inserted, updated, skipped };
}

async function main() {
  console.log('Connecting to legacy MariaDB at 127.0.0.1:3309...');
  const legacy = await mysql.createConnection(LEGACY);
  try {
    console.log('Step 1/4 — Departments');
    const deptMap = await migrateDepartments(legacy);
    console.log(`  ${deptMap.size} departments mapped`);

    console.log('Step 2/4 — Super admin + Users');
    const superAdminId = await ensureSuperAdmin();
    const userMap = await migrateUsers(legacy, deptMap);
    console.log(`  ${userMap.size} legacy users mapped (super-admin: ${superAdminId})`);

    console.log('Step 3/4 — Categories');
    const catMap = await migrateCategories(legacy);
    console.log(`  ${catMap.size} categories mapped`);

    console.log('Step 4/4 — Posts');
    const postStats = await migratePosts(legacy, catMap, userMap, superAdminId);
    console.log(`  posts inserted=${postStats.inserted} updated=${postStats.updated} skipped(no title)=${postStats.skipped}`);

    console.log('Done.');
  } finally {
    await legacy.end();
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  void prisma.$disconnect();
  process.exit(1);
});
