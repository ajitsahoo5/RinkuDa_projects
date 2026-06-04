import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { CatalogService } from './catalog.service';
import { UpdateCatalogSectionDto } from './dto/catalog.dto';

@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  getCatalog() {
    return this.catalogService.getCatalog();
  }

  @Patch()
  updateCatalog(@Body() dto: UpdateCatalogSectionDto) {
    return this.catalogService.updateCatalog(dto);
  }
}
