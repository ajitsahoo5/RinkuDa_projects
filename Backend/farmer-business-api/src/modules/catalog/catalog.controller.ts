import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegistryRoles } from '../../common/decorators/registry-roles.decorator';
import { RegistryAuthGuard } from '../../common/guards/registry-auth.guard';
import { RegistryRolesGuard } from '../../common/guards/registry-roles.guard';
import { CatalogService } from './catalog.service';
import { CatalogResponseDto, UpdateCatalogSectionDto } from './dto/catalog.dto';

@ApiTags('Registry — Catalog')
@ApiBearerAuth('firebase')
@Controller('registry/catalog')
@UseGuards(RegistryAuthGuard, RegistryRolesGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @RegistryRoles('admin', 'client')
  @ApiOperation({ summary: 'Get full product catalog and lookup lists' })
  getCatalog(): Promise<CatalogResponseDto> {
    return this.catalogService.getCatalog();
  }

  @Patch()
  @RegistryRoles('admin', 'client')
  @ApiOperation({ summary: 'Update one or more catalog sections' })
  updateCatalog(@Body() dto: UpdateCatalogSectionDto): Promise<CatalogResponseDto> {
    return this.catalogService.updateCatalog(dto);
  }
}
