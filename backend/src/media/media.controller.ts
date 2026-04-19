import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { ZodSerializerDto } from 'nestjs-zod';
import { MediaService } from './media.service';
import {
  CreateFromUrlBodyDTO,
  ListMediaQueryDTO,
  MediaListResDTO,
  MediaResDTO,
  UpdateMediaBodyDTO,
  UploadMediaBodyDTO,
} from './media.dto';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';
import { ActiveUser } from '../shared/decorators/active-user.decorator';
import { FileRequiredException, InvalidFileTypeException } from './media.error';

const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const uploadStorage = diskStorage({
  destination: UPLOADS_DIR,
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

@Controller('media')
export class MediaController {
  constructor(private readonly service: MediaService) {}

  @Post('upload')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: uploadStorage,
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/'))
          return cb(InvalidFileTypeException, false);
        cb(null, true);
      },
    }),
  )
  @ZodSerializerDto(MediaResDTO)
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: UploadMediaBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    if (!file) throw FileRequiredException;
    return this.service.upload(file, body, userId);
  }

  @Post('from-url')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(MediaResDTO)
  createFromUrl(
    @Body() body: CreateFromUrlBodyDTO,
    @ActiveUser('userId') userId: string,
  ) {
    return this.service.createFromUrl(body, userId);
  }

  @Get()
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(MediaListResDTO)
  list(@Query() query: ListMediaQueryDTO) {
    return this.service.list(query);
  }

  @Get('tags-in-use')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  tagsInUse() {
    return this.service.listTagsInUse();
  }

  @Get(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(MediaResDTO)
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  @ZodSerializerDto(MediaResDTO)
  update(@Param('id') id: string, @Body() body: UpdateMediaBodyDTO) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles(RoleName.Admin, RoleName.SuperAdmin)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
