import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationVerdict, ValidationStatus } from '../../../common/enums';

export class ValidateDocumentDto {
  @ApiProperty()
  @IsUUID()
  documentId: string;
}

export class OverrideValidationDto {
  @ApiProperty({ enum: ValidationVerdict })
  @IsEnum(ValidationVerdict)
  verdict: ValidationVerdict;

  @ApiProperty()
  @IsString()
  overrideReason: string;
}

export class ValidationQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @ApiPropertyOptional({ enum: ValidationVerdict })
  @IsOptional()
  @IsEnum(ValidationVerdict)
  verdict?: ValidationVerdict;

  @ApiPropertyOptional({ enum: ValidationStatus, description: 'Filter by document validation status' })
  @IsOptional()
  @IsEnum(ValidationStatus)
  status?: ValidationStatus;
}
