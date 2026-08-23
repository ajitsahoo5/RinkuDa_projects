/**
 * One-time import: Firestore (production) → PostgreSQL.
 *
 * Prerequisites:
 *   - DATABASE_URL in .env (or environment)
 *   - GOOGLE_APPLICATION_CREDENTIALS → Firebase service account JSON
 *
 * Dry run (default):
 *   npm run migrate:firestore-to-postgres
 *
 * Apply:
 *   npm run migrate:firestore-to-postgres -- --apply
 *
 * Clear registry tables first:
 *   npm run migrate:firestore-to-postgres -- --apply --drop
 */
import { PrismaClient, RegistryUserRole } from '@prisma/client';
import { config } from 'dotenv';
import * as admin from 'firebase-admin';
import {
  clearRegistryData,
  createFarmerWithLines,
  upsertCatalogTables,
} from './registry-db.helpers';

config();

type CliFlags = {
  apply: boolean;
  drop: boolean;
};

function parseArgs(argv: string[]): CliFlags {
  return {
    apply: argv.includes('--apply'),
    drop: argv.includes('--drop'),
  };
}

function displayNameFrom(data: Record<string, unknown>): string | null {
  const displayName = data.displayName;
  if (displayName != null && String(displayName).trim()) {
    return String(displayName).trim();
  }
  const name = data.name;
  if (name != null && String(name).trim()) {
    return String(name).trim();
  }
  return null;
}

function normalizedRole(raw: unknown): RegistryUserRole {
  const role = String(raw ?? 'client').toLowerCase();
  return role === 'admin' ? RegistryUserRole.admin : RegistryUserRole.client;
}

function parseNamedItem(raw: unknown): { id: string; name: string } | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const name = raw.trim();
    if (!name) return null;
    return { id: name.toLowerCase().replace(/\s+/g, '-'), name };
  }
  if (typeof raw === 'object') {
    const row = raw as Record<string, unknown>;
    const name = String(row.name ?? row.label ?? row.title ?? '').trim();
    if (!name) return null;
    const id = String(row.id ?? name.toLowerCase().replace(/\s+/g, '-')).trim();
    return { id, name };
  }
  return null;
}

function parseLineItem(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    unit: String(row.unit ?? 'kg').trim() || 'kg',
    price: Number(row.price ?? 0) || 0,
    stock: Number(row.stock ?? 0) || 0,
  };
}

function parsePurchaseLine(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? '').trim();
  const name = String(row.name ?? '').trim();
  if (!id || !name) return null;
  const unit = String(row.unit ?? '').trim();
  return {
    id,
    name,
    amount: Number(row.amount ?? 0) || 0,
    price: Number(row.price ?? 0) || 0,
    ...(unit ? { unit } : {}),
  };
}

function parseLineArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseLineItem).filter(Boolean) as Record<string, unknown>[];
}

function parsePurchaseArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parsePurchaseLine).filter(Boolean) as Record<string, unknown>[];
}

function parseNamedArray(raw: unknown): { id: string; name: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { id: string; name: string }[] = [];
  for (const item of raw) {
    const parsed = parseNamedItem(item);
    if (parsed) out.push(parsed);
  }
  return out;
}

async function main() {
  const { apply, drop } = parseArgs(process.argv.slice(2));

  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL in .env (PostgreSQL connection string).');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service-account JSON path.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }

  const firestore = admin.firestore();
  const prisma = new PrismaClient();

  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}${drop ? ' + DROP' : ''}`);
  console.log(`Firebase project: ${admin.app().options.projectId}`);
  console.log(`PostgreSQL: ${process.env.DATABASE_URL.replace(/:[^:@/]+@/, ':***@')}\n`);

  try {
    if (apply && drop) {
      await clearRegistryData(prisma);
      await prisma.settingsApp.deleteMany();
      console.log('Cleared registry tables.\n');
    }

    const usersSnap = await firestore.collection('users').get();
    let userCount = 0;
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const email = String(data.email ?? '').trim().toLowerCase();
      if (!email) continue;
      const payload = {
        firebaseUid: doc.id,
        email,
        displayName: displayNameFrom(data),
        role: normalizedRole(data.role),
        active: data.active !== false,
      };
      console.log(`registry_users/${doc.id} ← users (${payload.email}, ${payload.role})`);
      if (apply) {
        await prisma.registryUser.upsert({
          where: { firebaseUid: doc.id },
          create: payload,
          update: {
            email: payload.email,
            displayName: payload.displayName,
            role: payload.role,
            active: payload.active,
          },
        });
      }
      userCount++;
    }
    console.log(`Users: ${userCount} row(s) ${apply ? 'imported' : 'would import'}.\n`);

    const farmersSnap = await firestore.collection('farmers').get();
    let farmerCount = 0;
    for (const doc of farmersSnap.docs) {
      const data = doc.data();
      const cscProducts = Array.isArray(data.cscProducts)
        ? data.cscProducts
        : Array.isArray(data.otherPecsItems)
          ? data.otherPecsItems
          : [];

      const payload = {
        externalId: doc.id,
        slNo: Number(data.slNo ?? 0) || 0,
        dateOfPurchase: String(data.dateOfPurchase ?? ''),
        landOwnerName: String(data.landOwnerName ?? ''),
        villageOrMouza: String(data.villageOrMouza ?? ''),
        khataNo: String(data.khataNo ?? ''),
        area: Number(data.area ?? 0) || 0,
        farmerName: String(data.farmerName ?? ''),
        aadharNo: String(data.aadharNo ?? data.adharNo ?? ''),
        mobileNo: String(data.mobileNo ?? data.contactNo ?? ''),
        cropsName: String(data.cropsName ?? ''),
        address: String(data.address ?? ''),
        paymentRemark: String(data.paymentRemark ?? ''),
        fertilizers: parsePurchaseArray(data.fertilizers),
        pesticides: parsePurchaseArray(data.pesticides),
        seeds: parsePurchaseArray(data.seeds),
        cscProducts: parsePurchaseArray(cscProducts),
        remarks: String(data.remarks ?? ''),
        sentToBank: data.sentToBank === true,
        sentToBankAt: data.sentToBankAt ? String(data.sentToBankAt) : null,
      };

      console.log(
        `farmers/${doc.id} ← Firestore (${payload.farmerName || 'unnamed'}, SL ${payload.slNo})`,
      );
      if (apply) {
        await createFarmerWithLines(prisma, {
          externalId: doc.id,
          slNo: Number(data.slNo ?? 0) || 0,
          dateOfPurchase: String(data.dateOfPurchase ?? ''),
          landOwnerName: String(data.landOwnerName ?? ''),
          villageOrMouza: String(data.villageOrMouza ?? ''),
          khataNo: String(data.khataNo ?? ''),
          area: Number(data.area ?? 0) || 0,
          farmerName: String(data.farmerName ?? ''),
          aadharNo: String(data.aadharNo ?? data.adharNo ?? ''),
          mobileNo: String(data.mobileNo ?? data.contactNo ?? ''),
          cropsName: String(data.cropsName ?? ''),
          address: String(data.address ?? ''),
          paymentRemark: String(data.paymentRemark ?? ''),
          fertilizers: parsePurchaseArray(data.fertilizers) as never[],
          pesticides: parsePurchaseArray(data.pesticides) as never[],
          seeds: parsePurchaseArray(data.seeds) as never[],
          cscProducts: parsePurchaseArray(cscProducts) as never[],
          remarks: String(data.remarks ?? ''),
          sentToBank: data.sentToBank === true,
          sentToBankAt: data.sentToBankAt ? String(data.sentToBankAt) : null,
        });
      }
      farmerCount++;
    }
    console.log(`Farmers: ${farmerCount} row(s) ${apply ? 'imported' : 'would import'}.\n`);

    const catalogSnap = await firestore.collection('settings').doc('catalog').get();
    if (catalogSnap.exists) {
      const data = catalogSnap.data() ?? {};
      const cscRaw = data.cscProducts ?? data.otherPecsItems;
      const catalogPayload = {
        id: 'catalog',
        fertilizers: parseLineArray(data.fertilizers),
        pesticides: parseLineArray(data.pesticides),
        seeds: parseLineArray(data.seeds),
        cscProducts: parseLineArray(cscRaw),
        crops: parseNamedArray(data.crops),
        villageMouzas: parseNamedArray(data.villageMouzas),
        remarkPresets: parseNamedArray(data.remarkPresets),
      };
      console.log('catalog tables ← settings/catalog');
      if (apply) {
        await upsertCatalogTables(
          prisma,
          {
            fertilizers: parseLineArray(data.fertilizers) as never[],
            pesticides: parseLineArray(data.pesticides) as never[],
            seeds: parseLineArray(data.seeds) as never[],
            cscProducts: parseLineArray(cscRaw) as never[],
          },
          parseNamedArray(data.crops),
          parseNamedArray(data.villageMouzas),
          parseNamedArray(data.remarkPresets),
        );
      }
    } else {
      console.log('No Firestore settings/catalog document found.');
    }

    const appSnap = await firestore.collection('settings').doc('app').get();
    if (appSnap.exists) {
      const data = appSnap.data() ?? {};
      const appPayload = {
        id: 'app',
        googleSheetLink: data.googleSheetLink ? String(data.googleSheetLink) : null,
        address: data.address ? String(data.address) : null,
        gstNumber: data.gstNumber ? String(data.gstNumber) : null,
        mobileNumber: data.mobileNumber ? String(data.mobileNumber) : null,
      };
      console.log('settings_app ← settings/app');
      if (apply) {
        await prisma.settingsApp.upsert({
          where: { id: 'app' },
          create: appPayload,
          update: {
            googleSheetLink: appPayload.googleSheetLink,
            address: appPayload.address,
            gstNumber: appPayload.gstNumber,
            mobileNumber: appPayload.mobileNumber,
          },
        });
      }
    } else {
      console.log('No Firestore settings/app document found.');
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\nDone.');
  if (!apply) {
    console.log('Re-run with --apply to write to PostgreSQL.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
