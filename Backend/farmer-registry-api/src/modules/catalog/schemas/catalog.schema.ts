import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class CatalogLineItem {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ default: 'kg' })
  unit!: string;

  @Prop({ default: 0 })
  price!: number;

  @Prop({ default: 0 })
  stock!: number;
}

export const CatalogLineItemSchema = SchemaFactory.createForClass(CatalogLineItem);

@Schema({ _id: false })
export class NamedCatalogItem {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;
}

export const NamedCatalogItemSchema = SchemaFactory.createForClass(NamedCatalogItem);

/** Mirrors Firestore `settings/catalog` document. */
@Schema({ collection: 'settings_catalog', timestamps: true })
export class CatalogDocument {
  @Prop({ required: true, unique: true, default: 'catalog' })
  key!: string;

  @Prop({ type: [CatalogLineItemSchema], default: [] })
  fertilizers!: CatalogLineItem[];

  @Prop({ type: [CatalogLineItemSchema], default: [] })
  pesticides!: CatalogLineItem[];

  @Prop({ type: [CatalogLineItemSchema], default: [] })
  seeds!: CatalogLineItem[];

  @Prop({ type: [CatalogLineItemSchema], default: [] })
  cscProducts!: CatalogLineItem[];

  @Prop({ type: [NamedCatalogItemSchema], default: [] })
  crops!: NamedCatalogItem[];

  @Prop({ type: [NamedCatalogItemSchema], default: [] })
  remarkPresets!: NamedCatalogItem[];
}

export type CatalogDocumentDoc = HydratedDocument<CatalogDocument>;
export const CatalogDocumentSchema = SchemaFactory.createForClass(CatalogDocument);
