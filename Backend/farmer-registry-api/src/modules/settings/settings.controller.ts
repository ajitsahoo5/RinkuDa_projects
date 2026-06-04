import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/auth.guards';
import { UpdateAppSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('app')
  getAppSettings() {
    return this.settingsService.getAppSettings();
  }

  @Patch('app')
  updateAppSettings(@Body() dto: UpdateAppSettingsDto) {
    return this.settingsService.updateAppSettings(dto);
  }
}
