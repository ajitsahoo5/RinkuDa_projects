import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegistryRoles } from '../../common/decorators/registry-roles.decorator';
import { RegistryAuthGuard } from '../../common/guards/registry-auth.guard';
import { RegistryRolesGuard } from '../../common/guards/registry-roles.guard';
import { AppSettingsResponseDto, UpdateAppSettingsDto } from './dto/settings.dto';
import { RegistrySettingsService } from './registry-settings.service';

@ApiTags('Registry — Settings')
@ApiBearerAuth('firebase')
@Controller('registry/settings/app')
@UseGuards(RegistryAuthGuard, RegistryRolesGuard)
export class RegistrySettingsController {
  constructor(private readonly settingsService: RegistrySettingsService) {}

  @Get()
  @RegistryRoles('admin', 'client')
  @ApiOperation({ summary: 'Get shared app settings' })
  getAppSettings(): Promise<AppSettingsResponseDto> {
    return this.settingsService.getAppSettings();
  }

  @Patch()
  @RegistryRoles('admin')
  @ApiOperation({ summary: 'Update app settings (admin only)' })
  updateAppSettings(@Body() dto: UpdateAppSettingsDto): Promise<AppSettingsResponseDto> {
    return this.settingsService.updateAppSettings(dto);
  }
}
