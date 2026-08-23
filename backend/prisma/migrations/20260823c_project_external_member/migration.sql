-- Thành viên đề tài có thể KHÔNG phải người của Khoa.
--
-- Phụ lục 2 tr. 2.8: chủ nhiệm chia số giờ của nhiệm vụ "cho từng thành viên…
-- phù hợp với đóng góp của các thành viên trong nhiệm vụ" — mọi thành viên, kể
-- cả người ngoài Khoa và ngoài Trường. Chỉ chia 100% giữa vài người trong Khoa
-- là cho họ hưởng nhiều hơn phần thật, vì phần của cộng sự bên ngoài biến mất
-- khỏi mẫu số.
--
-- Nới `userId` thành cho phép NULL, và thêm hai cột ghi tên người ngoài. NULL
-- trong ràng buộc UNIQUE của Postgres không xung đột với nhau, nên nhiều người
-- ngoài trong cùng một đề tài vẫn hợp lệ.
--
-- Cộng thêm, chạy lại được nhiều lần. Không dòng nào đang có bị đụng tới: mọi
-- bản ghi hiện tại đều có userId.
ALTER TABLE "ProjectMember" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "ProjectMember"
  ADD COLUMN IF NOT EXISTS "externalName" TEXT,
  ADD COLUMN IF NOT EXISTS "externalOrg"  TEXT;
