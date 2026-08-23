import { PrismaClient } from '@prisma/client';

type CatalogLine = {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
};

type NamedItem = { id: string; name: string };

type PurchaseLine = {
  id: string;
  name: string;
  amount: number;
  price: number;
  unit?: string;
};

export async function clearRegistryData(prisma: PrismaClient): Promise<void> {
  await prisma.farmer.deleteMany();
  await prisma.registryUser.deleteMany();
  await prisma.catalogFertilizer.deleteMany();
  await prisma.catalogPesticide.deleteMany();
  await prisma.catalogSeed.deleteMany();
  await prisma.catalogCscProduct.deleteMany();
  await prisma.catalogCrop.deleteMany();
  await prisma.catalogVillageMouza.deleteMany();
  await prisma.catalogRemarkPreset.deleteMany();
}

export async function upsertCatalogTables(
  prisma: PrismaClient,
  catalog: {
    fertilizers: CatalogLine[];
    pesticides: CatalogLine[];
    seeds: CatalogLine[];
    cscProducts: CatalogLine[];
  },
  crops: NamedItem[],
  villages: NamedItem[],
  remarks: NamedItem[],
): Promise<void> {
  for (const item of catalog.fertilizers) {
    await prisma.catalogFertilizer.upsert({
      where: { id: item.id },
      create: item,
      update: {
        name: item.name,
        unit: item.unit,
        price: item.price,
        stock: item.stock,
      },
    });
  }
  for (const item of catalog.pesticides) {
    await prisma.catalogPesticide.upsert({
      where: { id: item.id },
      create: item,
      update: {
        name: item.name,
        unit: item.unit,
        price: item.price,
        stock: item.stock,
      },
    });
  }
  for (const item of catalog.seeds) {
    await prisma.catalogSeed.upsert({
      where: { id: item.id },
      create: item,
      update: {
        name: item.name,
        unit: item.unit,
        price: item.price,
        stock: item.stock,
      },
    });
  }
  for (const item of catalog.cscProducts) {
    await prisma.catalogCscProduct.upsert({
      where: { id: item.id },
      create: item,
      update: {
        name: item.name,
        unit: item.unit,
        price: item.price,
        stock: item.stock,
      },
    });
  }
  for (const item of crops) {
    await prisma.catalogCrop.upsert({
      where: { id: item.id },
      create: { id: item.id, name: item.name },
      update: { name: item.name },
    });
  }
  for (const item of villages) {
    await prisma.catalogVillageMouza.upsert({
      where: { id: item.id },
      create: { id: item.id, name: item.name },
      update: { name: item.name },
    });
  }
  for (const item of remarks) {
    await prisma.catalogRemarkPreset.upsert({
      where: { id: item.id },
      create: { id: item.id, name: item.name },
      update: { name: item.name },
    });
  }
}

async function resolveCropId(prisma: PrismaClient, name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const row = await prisma.catalogCrop.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  return row?.id ?? null;
}

async function resolveVillageId(prisma: PrismaClient, name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const row = await prisma.catalogVillageMouza.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  return row?.id ?? null;
}

function lineCreates(lines: PurchaseLine[]) {
  return lines.map((line) => ({
    productId: line.id,
    productName: line.name,
    amount: line.amount,
    price: line.price,
    unit: line.unit?.trim() || null,
  }));
}

export async function createFarmerWithLines(
  prisma: PrismaClient,
  farmer: {
    externalId: string;
    slNo: number;
    dateOfPurchase: string;
    landOwnerName: string;
    villageOrMouza: string;
    khataNo: string;
    area: number;
    farmerName: string;
    aadharNo: string;
    mobileNo: string;
    cropsName: string;
    address: string;
    paymentRemark: string;
    fertilizers: PurchaseLine[];
    pesticides: PurchaseLine[];
    seeds: PurchaseLine[];
    cscProducts: PurchaseLine[];
    remarks: string;
    sentToBank?: boolean;
    sentToBankAt?: string | null;
  },
): Promise<void> {
  const cropId = await resolveCropId(prisma, farmer.cropsName);
  const villageMouzaId = await resolveVillageId(prisma, farmer.villageOrMouza);

  await prisma.farmer.create({
    data: {
      externalId: farmer.externalId,
      slNo: farmer.slNo,
      dateOfPurchase: farmer.dateOfPurchase,
      landOwnerName: farmer.landOwnerName,
      villageOrMouza: farmer.villageOrMouza,
      villageMouzaId,
      khataNo: farmer.khataNo,
      area: farmer.area,
      farmerName: farmer.farmerName,
      aadharNo: farmer.aadharNo,
      mobileNo: farmer.mobileNo,
      cropsName: farmer.cropsName,
      cropId,
      address: farmer.address,
      paymentRemark: farmer.paymentRemark,
      remarks: farmer.remarks,
      sentToBank: farmer.sentToBank ?? false,
      sentToBankAt: farmer.sentToBankAt ?? null,
      fertilizerLines: { create: lineCreates(farmer.fertilizers) },
      pesticideLines: { create: lineCreates(farmer.pesticides) },
      seedLines: { create: lineCreates(farmer.seeds) },
      cscProductLines: { create: lineCreates(farmer.cscProducts) },
    },
  });
}
