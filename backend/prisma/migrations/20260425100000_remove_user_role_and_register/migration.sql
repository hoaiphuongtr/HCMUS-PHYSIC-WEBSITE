-- Drop any existing USER-role accounts before narrowing the enum
DELETE FROM "User" WHERE "role" = 'USER';

-- Drop pending REGISTER verification codes before narrowing the enum
DELETE FROM "VerificationCode" WHERE "type" = 'REGISTER';

-- Switch Role enum to ADMIN/SUPER_ADMIN only
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
DROP TYPE "Role_old";

-- Switch VerificationCodeType enum to FORGOT_PASSWORD only
ALTER TYPE "VerificationCodeType" RENAME TO "VerificationCodeType_old";
CREATE TYPE "VerificationCodeType" AS ENUM ('FORGOT_PASSWORD');
ALTER TABLE "VerificationCode" ALTER COLUMN "type" TYPE "VerificationCodeType" USING "type"::text::"VerificationCodeType";
DROP TYPE "VerificationCodeType_old";
