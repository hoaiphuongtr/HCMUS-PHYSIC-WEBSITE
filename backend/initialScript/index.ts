import envConfig from 'src/shared/config/config';
import { RoleName } from 'src/shared/constants/role.constants';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaClient } from 'src/generated/prisma/client';

const prisma = new PrismaClient({} as any);
const hashingService = new HashingService();

const main = async () => {
  const userCount = await prisma.user.count();
  if (userCount > 0) throw new Error('Users already exist. Seed aborted.');

  const hashedPassword = await hashingService.hash(envConfig.ADMIN_PASSWORD);
  const adminUser = await prisma.user.create({
    data: {
      email: envConfig.ADMIN_EMAIL,
      password: hashedPassword,
      name: envConfig.ADMIN_NAME,
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
