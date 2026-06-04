import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Mirrors Firestore `settings/app` document. */
@Schema({ collection: 'settings_app', timestamps: true })
export class AppSettings {
  @Prop({ required: true, unique: true, default: 'app' })
  key!: string;

  @Prop({ default: null })
  googleSheetLink!: string | null;
}

export type AppSettingsDocument = HydratedDocument<AppSettings>;
export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings);
