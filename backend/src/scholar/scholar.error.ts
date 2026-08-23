import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

export const ProfileNotFoundException = new NotFoundException([
  { field: 'userId', error: 'Chưa có hồ sơ khoa học cho tài khoản này' },
]);

export const PublicationNotFoundException = new NotFoundException([
  { field: 'id', error: 'Không tìm thấy công trình' },
]);

export const OrcidTakenException = new ConflictException([
  { field: 'orcid', error: 'ORCID này đã gắn với một tài khoản khác' },
]);

export const NotAnAuthorException = new ForbiddenException([
  {
    field: 'id',
    error: 'Chỉ tác giả đã xác nhận của công trình mới được sửa',
  },
]);

export const NoClaimException = new NotFoundException([
  {
    field: 'id',
    error: 'Không có lời mời xác nhận nào cho bạn ở công trình này',
  },
]);

export const NoOrcidException = new UnprocessableEntityException([
  {
    field: 'orcid',
    error: 'Hãy khai ORCID trong hồ sơ trước khi nhập hàng loạt',
  },
]);

export const CannotResolveException = new UnprocessableEntityException([
  {
    field: 'input',
    error:
      'Không nhận ra DOI, arXiv ID hay ISBN trong nội dung đã dán. Kiểm tra lại hoặc nhập tay.',
  },
]);

/**
 * Phụ lục 2 (tr. 2.5): người đứng ra khai giờ cho nhóm phải là First,
 * Corresponding hoặc Last Author. Chặn ngay ở tầng nhập liệu chứ không để tới
 * lúc người duyệt mới phát hiện.
 */
export const NotEligibleRepresentativeException =
  new UnprocessableEntityException([
    {
      field: 'sharePercent',
      error:
        'Chỉ First Author, Corresponding Author hoặc Last Author mới được khai tỷ lệ chia giờ cho nhóm',
    },
  ]);

export const TooFewAuthorsException = new UnprocessableEntityException([
  {
    field: 'totalAuthors',
    error: 'Tổng số tác giả phải lớn hơn hoặc bằng số tác giả thuộc Trường',
  },
]);

export const NoStaffPageException = new NotFoundException([
  {
    field: 'staffPageSlug',
    error:
      'Hồ sơ của bạn chưa nối với trang nhân sự nào. Điền địa chỉ trang ở mục Lý lịch khoa học.',
  },
]);

export const StaffBlockNotFoundException = new UnprocessableEntityException([
  {
    field: 'staffPageSlug',
    error:
      'Trang nhân sự này không có khối hồ sơ để sửa — nhờ quản trị dựng lại trang.',
  },
]);

export const PhotoRequiredException = new UnprocessableEntityException([
  {
    field: 'file',
    error: 'Cần chọn một tệp ảnh (JPG, PNG, WebP), tối đa 8 MB',
  },
]);

export const ProjectNotFoundException = new NotFoundException([
  { field: 'id', error: 'Không tìm thấy đề tài' },
]);

export const NotAProjectMemberException = new ForbiddenException([
  {
    field: 'id',
    error: 'Chỉ thành viên đã xác nhận của đề tài mới được sửa',
  },
]);

export const ActivityNotFoundException = new NotFoundException([
  { field: 'id', error: 'Không tìm thấy hoạt động khoa học' },
]);
