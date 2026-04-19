import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

export const MediaNotFoundException = new NotFoundException([
  { field: 'id', error: 'Media not found' },
]);

export const InvalidFileTypeException = new BadRequestException([
  { field: 'file', error: 'Only image files are allowed' },
]);

export const FileRequiredException = new BadRequestException([
  { field: 'file', error: 'File is required' },
]);

export const FileTooLargeException = new PayloadTooLargeException([
  { field: 'file', error: 'File exceeds 10MB limit' },
]);
