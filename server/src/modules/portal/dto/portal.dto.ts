import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../../../common/enums';

export class RiskFieldDto {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty()
  @IsBoolean()
  noChange: boolean;

  @ApiProperty()
  @IsBoolean()
  change: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedValue?: string;
}

export class SubmitRiskDataDto {
  @ApiProperty({ type: [RiskFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskFieldDto)
  fields: RiskFieldDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}

export class PortalUploadDto {
  @ApiProperty({ enum: DocumentType })
  @IsString()
  documentType: DocumentType;
}
