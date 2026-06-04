import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class PurchaseLine {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: 0 })
  amount!: number;

  @Prop({ required: true, default: 0 })
  price!: number;

  @Prop()
  unit?: string;
}

export const PurchaseLineSchema = SchemaFactory.createForClass(PurchaseLine);

@Schema({ timestamps: true, collection: 'farmers' })
export class Farmer {
  @Prop({ required: true, unique: true, index: true })
  externalId!: string;

  @Prop({ required: true, index: true })
  slNo!: number;

  @Prop({ required: true })
  dateOfPurchase!: string;

  @Prop({ default: '' })
  landOwnerName!: string;

  @Prop({ default: '', index: true })
  villageOrMouza!: string;

  @Prop({ default: '' })
  khataNo!: string;

  @Prop({ default: 0 })
  area!: number;

  @Prop({ default: '' })
  farmerName!: string;

  @Prop({ default: '', index: true })
  aadharNo!: string;

  @Prop({ default: '', index: true })
  mobileNo!: string;

  @Prop({ default: '' })
  cropsName!: string;

  @Prop({ default: '' })
  address!: string;

  @Prop({ default: '' })
  paymentRemark!: string;

  @Prop({ type: [PurchaseLineSchema], default: [] })
  fertilizers!: PurchaseLine[];

  @Prop({ type: [PurchaseLineSchema], default: [] })
  pesticides!: PurchaseLine[];

  @Prop({ type: [PurchaseLineSchema], default: [] })
  seeds!: PurchaseLine[];

  @Prop({ type: [PurchaseLineSchema], default: [] })
  cscProducts!: PurchaseLine[];

  @Prop({ default: '' })
  remarks!: string;
}

export type FarmerDocument = HydratedDocument<Farmer>;
export const FarmerSchema = SchemaFactory.createForClass(Farmer);

FarmerSchema.index({ slNo: 1 });
