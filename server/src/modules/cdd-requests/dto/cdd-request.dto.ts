import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CddRequestStatus, CddPriority } from '../../../common/enums';
import { SortQueryDto } from '../../../common/dto/sorting.dto';

export class CreateCddRequestDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ enum: CddPriority })
  @IsOptional()
  @IsEnum(CddPriority)
  priority?: CddPriority;

  @ApiProperty()
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCddRequestDto {
  @ApiPropertyOptional({ enum: CddPriority })
  @IsOptional()
  @IsEnum(CddPriority)
  priority?: CddPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class TransitionStatusDto {
  @ApiProperty({ enum: CddRequestStatus })
  @IsEnum(CddRequestStatus)
  status: CddRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CddRequestQueryDto extends SortQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: CddRequestStatus })
  @IsOptional()
  @IsEnum(CddRequestStatus)
  status?: CddRequestStatus;

  @ApiPropertyOptional({ enum: CddPriority })
  @IsOptional()
  @IsEnum(CddPriority)
  priority?: CddPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
