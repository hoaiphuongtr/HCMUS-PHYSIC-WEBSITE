import envConfig from 'src/shared/config/config';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);

/**
 * Curated, evergreen Q&A the faculty wants answered authoritatively (leadership,
 * department heads, official contact). Stored in ChatbotTraining and tagged with
 * a `seed:*` context so this seed OWNS those rows and can re-run idempotently.
 *
 * Why this matters: reindexAll re-embeds all active ChatbotTraining rows, so once
 * seeded these answers survive EVERY reindex and are never lost even if the
 * scattered mentions across news posts drop out of the index. This file is the
 * version-controlled source of truth (source: phys.hcmus.edu.vn "giảng viên cơ hữu").
 *
 * Run standalone:  pnpm run db:seed-chatbot-training   (also part of db:seed-all)
 * NOTE: this only writes the ChatbotTraining rows. To make them searchable,
 * trigger a chatbot reindex afterwards (POST /chatbot/reindex) — reindex embeds them.
 */
const CURATED: { context: string; question: string; answer: string }[] = [
  {
    context: 'seed:leadership',
    question:
      'Ban lãnh đạo Khoa Vật lý – Vật lý Kỹ thuật gồm những ai? Trưởng khoa và phó trưởng khoa là ai?',
    answer:
      'Ban lãnh đạo Khoa Vật lý – Vật lý Kỹ thuật (Trường ĐH Khoa học Tự nhiên, ĐHQG-HCM):\n' +
      '- Trưởng khoa: PGS.TS. Huỳnh Văn Tuấn\n' +
      '- Phó Trưởng khoa: PGS.TS. Trần Thiện Thanh và TS. Đặng Hoài Trung',
  },
  {
    context: 'seed:department-heads',
    question: 'Trưởng các bộ môn của Khoa Vật lý – Vật lý Kỹ thuật là ai?',
    answer:
      'Trưởng các bộ môn của Khoa Vật lý – Vật lý Kỹ thuật:\n' +
      '- Vật lý Lý thuyết: TS. Vũ Quang Tuyên\n' +
      '- Vật lý Điện tử: TS. Nguyễn Chí Nhân\n' +
      '- Vật lý Tin học: PGS.TS. Huỳnh Văn Tuấn\n' +
      '- Vật lý Hạt nhân – Kỹ thuật hạt nhân – Vật lý Y khoa: PGS.TS. Trần Thiện Thanh\n' +
      '- Vật lý Chất rắn: PGS.TS. Trần Quang Trung\n' +
      '- Vật lý Địa cầu: PGS.TS. Lê Văn Anh Cường\n' +
      '- Vật lý Ứng dụng: PGS.TS. Lê Vũ Tuấn Hùng\n' +
      '- Hải dương – Khí tượng – Thủy văn: PGS.TS. Võ Lương Hồng Phước',
  },
  {
    context: 'seed:staff-count',
    question:
      'Đội ngũ giảng viên cơ hữu của Khoa Vật lý – Vật lý Kỹ thuật gồm bao nhiêu người?',
    answer:
      'Đội ngũ giảng viên cơ hữu của Khoa gồm 1 Giáo sư, 9 Phó Giáo sư, 40 Tiến sĩ và 34 Thạc sĩ. ' +
      'Chi tiết xem tại https://phys.hcmus.edu.vn/',
  },
  {
    context: 'seed:contact',
    question:
      'Liên hệ Khoa / Giáo vụ Khoa như thế nào? Thắc mắc tuyển sinh liên hệ ai?',
    answer:
      'Mọi thắc mắc về tuyển sinh, chương trình học và thủ tục, vui lòng liên hệ Giáo vụ Khoa Vật lý – Vật lý Kỹ thuật qua kênh chính thức:\n' +
      '- Email: giaovu.phys@hcmus.edu.vn\n' +
      '- Website: https://phys.hcmus.edu.vn/',
  },
];

async function main() {
  const admin = await prisma.user.findFirst({ select: { id: true } });
  if (!admin) {
    console.log('[seed-chatbot-training] no user found — skipping');
    return;
  }
  // Idempotent: this seed owns only the `seed:*` rows — drop and re-insert them,
  // leaving any admin-authored ChatbotTraining rows untouched.
  const removed = await prisma.chatbotTraining.deleteMany({
    where: { context: { startsWith: 'seed:' } },
  });
  for (const c of CURATED) {
    await prisma.chatbotTraining.create({
      data: {
        question: c.question,
        answer: c.answer,
        context: c.context,
        language: 'VI',
        createdBy: admin.id,
      },
    });
  }
  console.log(
    `[seed-chatbot-training] removed ${removed.count} old, seeded ${CURATED.length} curated Q&A. Run a chatbot reindex to embed them.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
