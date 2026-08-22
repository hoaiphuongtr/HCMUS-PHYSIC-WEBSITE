import { createZodDto } from 'nestjs-zod';
import {
  ClaimResponseBodySchema,
  CreatePublicationBodySchema,
  ImportFileBodySchema,
  ImportPreviewResSchema,
  IntegrationPublicationResSchema,
  IntegrationQuerySchema,
  ListPublicationsQuerySchema,
  OrcidImportBodySchema,
  PendingClaimListResSchema,
  PublicationListResSchema,
  PublicationResSchema,
  ResolveBodySchema,
  ResolvePreviewResSchema,
  ScholarProfileResSchema,
  SetNameVariantsBodySchema,
  StatsResSchema,
  UpdatePublicationBodySchema,
  UpdateScholarProfileBodySchema,
} from './scholar.model';

export class ScholarProfileResDTO extends createZodDto(
  ScholarProfileResSchema,
) {}
export class UpdateScholarProfileBodyDTO extends createZodDto(
  UpdateScholarProfileBodySchema,
) {}
export class SetNameVariantsBodyDTO extends createZodDto(
  SetNameVariantsBodySchema,
) {}

export class ResolveBodyDTO extends createZodDto(ResolveBodySchema) {}
export class ResolvePreviewResDTO extends createZodDto(
  ResolvePreviewResSchema,
) {}
export class ImportFileBodyDTO extends createZodDto(ImportFileBodySchema) {}
export class ImportPreviewResDTO extends createZodDto(ImportPreviewResSchema) {}
export class OrcidImportBodyDTO extends createZodDto(OrcidImportBodySchema) {}

export class PublicationResDTO extends createZodDto(PublicationResSchema) {}
export class PublicationListResDTO extends createZodDto(
  PublicationListResSchema,
) {}
export class CreatePublicationBodyDTO extends createZodDto(
  CreatePublicationBodySchema,
) {}
export class UpdatePublicationBodyDTO extends createZodDto(
  UpdatePublicationBodySchema,
) {}
export class ListPublicationsQueryDTO extends createZodDto(
  ListPublicationsQuerySchema,
) {}

export class ClaimResponseBodyDTO extends createZodDto(
  ClaimResponseBodySchema,
) {}
export class PendingClaimListResDTO extends createZodDto(
  PendingClaimListResSchema,
) {}

export class IntegrationQueryDTO extends createZodDto(IntegrationQuerySchema) {}
export class IntegrationPublicationResDTO extends createZodDto(
  IntegrationPublicationResSchema,
) {}

export class StatsResDTO extends createZodDto(StatsResSchema) {}
