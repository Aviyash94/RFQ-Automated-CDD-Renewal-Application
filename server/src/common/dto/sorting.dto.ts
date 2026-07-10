import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SortQueryDto {
  @ApiPropertyOptional({ description: 'Column to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export function applySort(
  qb: { orderBy: (column: string, order: 'ASC' | 'DESC') => unknown },
  sortBy: string | undefined,
  sortOrder: 'asc' | 'desc' | undefined,
  allowedColumns: Record<string, string>,
  defaultColumn: string,
) {
  const column =
    sortBy && allowedColumns[sortBy] ? allowedColumns[sortBy] : defaultColumn;
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  qb.orderBy(column, order);
}
