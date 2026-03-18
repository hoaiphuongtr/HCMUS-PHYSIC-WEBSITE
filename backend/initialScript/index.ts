import envConfig from 'src/shared/config/config';
import { RoleName } from 'src/shared/constants/role.constants';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: envConfig.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter } as any);
const hashingService = new HashingService();

const main = async () => {
  const userCount = await prisma.user.count();
  if (userCount > 0) throw new Error('Users already exist. Seed aborted.');

  const hashedPassword = await hashingService.hash(envConfig.ADMIN_PASSWORD);
  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.ADMIN_EMAIL,
      password: hashedPassword,
      firstName: envConfig.ADMIN_FIRST_NAME,
      lastName: envConfig.ADMIN_LAST_NAME,
      role: RoleName.SuperAdmin,
      isActive: true,
    },
  });

  return { adminUser };
};

main()
  .then(({ adminUser }) => {
    console.log(`Created super admin user: ${adminUser.email}`);
  })
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
