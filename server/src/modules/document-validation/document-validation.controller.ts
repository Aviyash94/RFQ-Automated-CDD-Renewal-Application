import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DocumentValidationService } from './document-validation.service';
import {
  ValidateDocumentDto,
  OverrideValidationDto,
  ValidationQueryDto,
} from './dto/validation.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Document Validation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('document-validation')
export class DocumentValidationController {
  constructor(private validationService: DocumentValidationService) {}

  @Get()
  @Permissions('document-validation:read')
  @ApiOperation({ summary: 'List validation results' })
  findAll(@Query() query: ValidationQueryDto) {
    return this.validationService.findAll(query);
  }

  @Get(':id')
  @Permissions('document-validation:read')
  @ApiOperation({ summary: 'Get validation result by ID' })
  findOne(@Param('id') id: string) {
    return this.validationService.findOne(id);
  }

  @Post('validate')
  @Permissions('document-validation:write')
  @ApiOperation({ summary: 'Queue document for AI validation' })
  validate(@Body() dto: ValidateDocumentDto) {
    return this.validationService.validate(dto);
  }

  @Patch(':id/override')
  @Permissions('document-validation:override')
  @ApiOperation({ summary: 'Human review override of validation result' })
  override(
    @Param('id') id: string,
    @Body() dto: OverrideValidationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.validationService.override(id, dto, user);
  }
}
