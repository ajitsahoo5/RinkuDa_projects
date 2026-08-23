import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AppSettingsResponseDto,
  UpdateAppSettingsDto,
} from './dto/settings.dto';

const APP_SETTINGS_ID = 'app';

@Injectable()
export class RegistrySettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateDoc() {
    let doc = await this.prisma.settingsApp.findUnique({ where: { id: APP_SETTINGS_ID } });
    if (!doc) {
      doc = await this.prisma.settingsApp.create({ data: { id: APP_SETTINGS_ID } });
    }
    return doc;
  }

  async getAppSettings(): Promise<AppSettingsResponseDto> {
    const doc = await this.getOrCreateDoc();
    return this.toResponse(doc);
  }

  async updateAppSettings(dto: UpdateAppSettingsDto): Promise<AppSettingsResponseDto> {
    await this.getOrCreateDoc();
    const doc = await this.prisma.settingsApp.update({
      where: { id: APP_SETTINGS_ID },
      data: {
        ...(dto.googleSheetLink !== undefined
          ? { googleSheetLink: dto.googleSheetLink?.trim() || null }
          : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() || null } : {}),
        ...(dto.gstNumber !== undefined ? { gstNumber: dto.gstNumber?.trim() || null } : {}),
        ...(dto.mobileNumber !== undefined
          ? { mobileNumber: dto.mobileNumber?.trim() || null }
          : {}),
      },
    });
    return this.toResponse(doc);
  }

  private toResponse(doc: {
    googleSheetLink: string | null;
    address: string | null;
    gstNumber: string | null;
    mobileNumber: string | null;
  }): AppSettingsResponseDto {
    return {
      googleSheetLink: doc.googleSheetLink,
      address: doc.address,
      gstNumber: doc.gstNumber,
      mobileNumber: doc.mobileNumber,
    };
  }
}
