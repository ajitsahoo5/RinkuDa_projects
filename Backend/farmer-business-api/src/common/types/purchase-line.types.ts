export type PurchaseLine = {
  id: string;
  name: string;
  amount: number;
  price: number;
  unit?: string;
};

export type CatalogLineItem = {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
};

export type NamedCatalogItem = {
  id: string;
  name: string;
};

export function parsePurchaseLines(value: unknown): PurchaseLine[] {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean) as PurchaseLine[];
}

export function parseCatalogLineItems(value: unknown): CatalogLineItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean) as CatalogLineItem[];
}

export function parseNamedCatalogItems(value: unknown): NamedCatalogItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean) as NamedCatalogItem[];
}
