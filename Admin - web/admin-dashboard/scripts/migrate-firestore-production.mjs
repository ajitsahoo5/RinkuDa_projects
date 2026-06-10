/**
 * One-time production migration for Firestore data shared by Admin web + Mobile Flutter.
 *
 * 1) Normalizes `users/*` docs: `name` → `displayName`, role `user` → `client`
 * 2) Optionally imports farmers, catalog, and app settings from MongoDB (--from-mongodb)
 *
 * Prereqs: GOOGLE_APPLICATION_CREDENTIALS pointing at Firebase service account JSON.
 *
 * Dry run (default):
 *   npm run migrate:firestore
 *
 * Apply changes:
 *   npm run migrate:firestore -- --apply
 *
 * Also import MongoDB (uses MONGODB_URI env or --mongodb-uri):
 *   npm run migrate:firestore -- --apply --from-mongodb
 */
import admin from "firebase-admin";
import { MongoClient } from "mongodb";
import { argv } from "node:process";

function parseArgs(args) {
  const flags = new Map();
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--") continue;
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags.set(a.slice(2, eq), a.slice(eq + 1));
        continue;
      }
      const key = a.slice(2);
      const next = args[i + 1];
      if (next != null && !next.startsWith("--")) {
        flags.set(key, next);
        i++;
      } else {
        flags.set(key, "true");
      }
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

const { flags } = parseArgs(argv.slice(2));
const apply = flags.has("apply");
const fromMongo = flags.has("from-mongodb");
const mongoUri = flags.get("mongodb-uri") ?? process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/farmer_registry";

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service-account JSON path.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

const db = admin.firestore();
const batchLimit = 400;

function displayNameFrom(data) {
  if (data.displayName != null && String(data.displayName).trim()) {
    return String(data.displayName).trim();
  }
  if (data.name != null && String(data.name).trim()) {
    return String(data.name).trim();
  }
  return null;
}

function normalizedRole(raw) {
  const role = String(raw ?? "client").toLowerCase();
  if (role === "admin") return "admin";
  if (role === "user") return "client";
  return "client";
}

async function migrateUsers() {
  const snap = await db.collection("users").get();
  let changed = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const next = { ...data };
    let dirty = false;

    const dn = displayNameFrom(data);
    if (dn !== (data.displayName ?? null)) {
      next.displayName = dn;
      dirty = true;
    }
    if ("name" in next) {
      delete next.name;
      dirty = true;
    }

    const role = normalizedRole(data.role);
    if (role !== data.role) {
      next.role = role;
      dirty = true;
    }

    if (!dirty) continue;
    changed++;
    console.log(`users/${doc.id}: role=${data.role}→${next.role}, displayName=${JSON.stringify(next.displayName)}`);

    if (apply) {
      batch.set(doc.ref, next, { merge: false });
      batchCount++;
      if (batchCount >= batchLimit) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }
  }

  if (apply && batchCount > 0) await batch.commit();
  console.log(`Users: ${changed} document(s) ${apply ? "updated" : "would update"}.`);
}

function farmerToFirestore(doc) {
  const {
    externalId,
    slNo,
    dateOfPurchase,
    landOwnerName,
    villageOrMouza,
    khataNo,
    area,
    farmerName,
    aadharNo,
    mobileNo,
    cropsName,
    address,
    paymentRemark,
    fertilizers,
    pesticides,
    seeds,
    cscProducts,
    remarks,
  } = doc;
  return {
    slNo,
    dateOfPurchase,
    landOwnerName: landOwnerName ?? "",
    villageOrMouza: villageOrMouza ?? "",
    khataNo: khataNo ?? "",
    area: area ?? 0,
    farmerName: farmerName ?? "",
    aadharNo: aadharNo ?? "",
    mobileNo: mobileNo ?? "",
    cropsName: cropsName ?? "",
    address: address ?? "",
    paymentRemark: paymentRemark ?? "",
    fertilizers: fertilizers ?? [],
    pesticides: pesticides ?? [],
    seeds: seeds ?? [],
    cscProducts: cscProducts ?? [],
    remarks: remarks ?? "",
  };
}

async function importFromMongo() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const mongo = client.db();

  try {
    const farmers = await mongo.collection("farmers").find({}).toArray();
    let farmerWrites = 0;
    for (const f of farmers) {
      const id = f.externalId;
      if (!id) {
        console.warn("Skipping farmer without externalId:", f._id);
        continue;
      }
      const payload = farmerToFirestore(f);
      console.log(`farmers/${id} ← MongoDB (${f.farmerName || "unnamed"})`);
      if (apply) {
        await db.collection("farmers").doc(id).set(payload, { merge: true });
      }
      farmerWrites++;
    }
    console.log(`Farmers: ${farmerWrites} document(s) ${apply ? "imported" : "would import"}.`);

    const catalog = await mongo.collection("settings_catalog").findOne({ key: "catalog" });
    if (catalog) {
      const { _id, key, ...rest } = catalog;
      console.log("settings/catalog ← MongoDB settings_catalog");
      if (apply) {
        await db.collection("settings").doc("catalog").set(rest, { merge: true });
      }
    } else {
      console.log("No MongoDB settings_catalog document found.");
    }

    const appSettings = await mongo.collection("settings_app").findOne({ key: "app" });
    if (appSettings) {
      const { _id, key, googleSheetLink } = appSettings;
      console.log("settings/app ← MongoDB settings_app");
      if (apply) {
        await db.collection("settings").doc("app").set({ googleSheetLink: googleSheetLink ?? null }, { merge: true });
      }
    } else {
      console.log("No MongoDB settings_app document found.");
    }

    console.log(
      "Note: MongoDB users are JWT accounts (passwordHash) and are NOT copied to Firestore. " +
        "Use Firebase Auth + seed-admin / adminCreateUser for Firebase users.",
    );
  } finally {
    await client.close();
  }
}

console.log(`Mode: ${apply ? "APPLY" : "DRY RUN"}${fromMongo ? " + MongoDB import" : ""}`);
console.log(`Project: ${admin.app().options.projectId}\n`);

await migrateUsers();
if (fromMongo) {
  await importFromMongo();
}

console.log("\nDone.");
if (!apply) {
  console.log("Re-run with --apply to write changes.");
}
