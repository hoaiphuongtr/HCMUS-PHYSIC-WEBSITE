import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../shared/decorators/auth.decorator';
import {
  IntegrationPublicationResDTO,
  IntegrationQueryDTO,
} from './scholar.dto';
import { IntegrationSecretGuard } from './integration-secret.guard';
import { ScholarService } from './scholar.service';

/**
 * Kênh máy-với-máy cho ACADsoom.
 *
 * @IsPublic() ở đây KHÔNG có nghĩa là mở: nó tắt lớp xác thực bằng phiên đăng
 * nhập, rồi IntegrationSecretGuard chắn lại bằng khoá bí mật dùng chung. Không
 * có khoá thì endpoint từ chối phục vụ.
 *
 * Trả DỮ KIỆN, không trả giờ quy đổi — hệ số là quy định của Trường/Khoa, đã cài
 * ở ACADsoom (src/lib/nv2Hours.js). Và chỉ trả bài ĐÃ PHÂN LOẠI: bài chưa chọn
 * mã Phụ lục 2 không tồn tại đối với ACADsoom, nên "không chỉnh thì không được
 * tính" là ràng buộc dữ liệu chứ không phải lời nhắc trên giao diện.
 */
@Controller('integration')
@IsPublic()
@UseGuards(IntegrationSecretGuard)
export class ScholarIntegrationController {
  constructor(private readonly service: ScholarService) {}

  @Get('publications')
  @ZodSerializerDto(IntegrationPublicationResDTO)
  publications(@Query() query: IntegrationQueryDTO) {
    return this.service.integrationList(query);
  }
}
