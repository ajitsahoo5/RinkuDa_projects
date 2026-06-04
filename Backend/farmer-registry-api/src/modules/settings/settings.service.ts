import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppSettingsResponseDto, UpdateAppSettingsDto } from './dto/settings.dto';
import { AppSettings, AppSettingsDocument } from './schemas/app-settings.schema';

const APP_SETTINGS_KEY = 'app';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(AppSettings.name)
    private readonly settingsModel: Model<AppSettingsDocument>,
  ) {}

  private async getOrCreateDoc(): Promise<AppSettingsDocument> {
    let doc = await this.settingsModel.findOne({ key: APP_SETTINGS_KEY }).exec();
    if (!doc) {
      doc = await this.settingsModel.create({ key: APP_SETTINGS_KEY, googleSheetLink: null });
    }
    return doc;
  }

  async getAppSettings(): Promise<AppSettingsResponseDto> {
    const doc = await this.getOrCreateDoc();
    return { googleSheetLink: doc.googleSheetLink };
  }

  async updateAppSettings(dto: UpdateAppSettingsDto): Promise<AppSettingsResponseDto> {
    const doc = await this.getOrCreateDoc();
    if (dto.googleSheetLink !== undefined) {
      doc.googleSheetLink = dto.googleSheetLink?.trim() || null;
    }
    await doc.save();
    return { googleSheetLink: doc.googleSheetLink };
  }
}
