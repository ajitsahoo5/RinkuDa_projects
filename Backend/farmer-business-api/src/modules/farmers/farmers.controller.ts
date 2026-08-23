import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RegistryRoles } from '../../common/decorators/registry-roles.decorator';
import { RegistryAuthGuard } from '../../common/guards/registry-auth.guard';
import { RegistryRolesGuard } from '../../common/guards/registry-roles.guard';
import {
  CreateFarmerDto,
  FarmerFilterQueryDto,
  UpdateFarmerDto,
} from './dto/farmer.dto';
import { FarmersService } from './farmers.service';

@ApiTags('Registry — Farmers')
@ApiBearerAuth('firebase')
@Controller('registry/farmers')
@UseGuards(RegistryAuthGuard, RegistryRolesGuard)
export class FarmersController {
  constructor(private readonly farmersService: FarmersService) {}

  @Get()
  @RegistryRoles('admin', 'client')
  @ApiOperation({ summary: 'List farmers with optional filters' })
  findAll(@Query() filter: FarmerFilterQueryDto) {
    return this.farmersService.findAll(filter);
  }

  @Get(':id')
  @RegistryRoles('admin', 'client')
  @ApiOperation({ summary: 'Get one farmer by external ID' })
  @ApiParam({ name: 'id', description: 'Farmer external_id (UUID)' })
  findOne(@Param('id') id: string) {
    return this.farmersService.findOne(id);
  }

  @Post()
  @RegistryRoles('admin', 'client')
  @ApiOperation({ summary: 'Create farmer and deduct catalog stock' })
  create(@Body() dto: CreateFarmerDto) {
    return this.farmersService.create(dto, true);
  }

  @Patch(':id')
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Update farmer (admin only)' })
  @ApiParam({ name: 'id', description: 'Farmer external_id (UUID)' })
  update(@Param('id') id: string, @Body() dto: UpdateFarmerDto) {
    return this.farmersService.update(id, dto);
  }

  @Patch(':id/sent-to-bank')
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Mark farmer as sent to bank docs' })
  @ApiParam({ name: 'id', description: 'Farmer external_id (UUID)' })
  markSentToBank(@Param('id') id: string) {
    return this.farmersService.markSentToBank(id);
  }

  @Patch(':id/remove-from-bank-docs')
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Remove farmer from bank docs list' })
  @ApiParam({ name: 'id', description: 'Farmer external_id (UUID)' })
  removeFromBankDocs(@Param('id') id: string) {
    return this.farmersService.removeFromBankDocs(id);
  }

  @Delete(':id')
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Delete farmer (admin only)' })
  @ApiParam({ name: 'id', description: 'Farmer external_id (UUID)' })
  remove(@Param('id') id: string) {
    return this.farmersService.remove(id);
  }
}
