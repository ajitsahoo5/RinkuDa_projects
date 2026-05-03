import { deleteField } from "firebase/firestore";
import type { Farmer, FertilizerType } from "../types/farmer";
import { getDefaultFertilizers } from "./defaultFertilizers";

function parseFertilizer(raw: unknown): FertilizerType | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const u = String(j.unit ?? "").trim();
  return {
    id: String(j.id ?? ""),
    name: String(j.name ?? ""),
    amount: Number((j.amount as number) ?? 0) || 0,
    price: Number((j.price as number) ?? 0) || 0,
    ...(u ? { unit: u } : {}),
  };
}

function parseLineArray(raw: unknown): FertilizerType[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(parseFertilizer).filter(Boolean) as FertilizerType[];
}

/** Reads `cscProducts`; if absent, legacy `otherPecsItems`. */
function parseCscProductsFarmer(data: Record<string, unknown>): FertilizerType[] {
  if (Array.isArray(data.cscProducts)) {
    return parseLineArray(data.cscProducts);
  }
  return parseLineArray(data.otherPecsItems);
}

export function docToFarmer(id: string, data: Record<string, unknown>): Farmer {
  const fertilizersRaw = data.fertilizers;
  let fertilizers: FertilizerType[] = getDefaultFertilizers();
  if (Array.isArray(fertilizersRaw)) {
    const parsed = fertilizersRaw.map(parseFertilizer).filter(Boolean) as FertilizerType[];
    if (parsed.length > 0) fertilizers = parsed;
  }

  const pesticides = parseLineArray(data.pesticides);
  const seeds = parseLineArray(data.seeds);
  const cscProducts = parseCscProductsFarmer(data);

  const dateRaw = data.dateOfPurchase;
  let dateOfPurchase =
    typeof dateRaw === "string" && dateRaw
      ? dateRaw
      : new Date().toISOString();

  return {
    id,
    slNo: Number(data.slNo ?? 0) || 0,
    dateOfPurchase,
    landOwnerName: String(data.landOwnerName ?? ""),
    villageOrMouza: String(data.villageOrMouza ?? ""),
    khataNo: String(data.khataNo ?? ""),
    area: Number(data.area ?? 0) || 0,
    farmerName: String(data.farmerName ?? ""),
    aadharNo: String(data.aadharNo ?? data.adharNo ?? ""),
    mobileNo: String(data.mobileNo ?? data.contactNo ?? ""),
    cropsName: String(data.cropsName ?? ""),
    fertilizers,
    pesticides,
    seeds,
    cscProducts,
    remarks: String(data.remarks ?? ""),
  };
}

/** Payload for Firestore `set` — same shape as Flutter `Farmer.toJson` without `id`. */
export function farmerToFirestorePayload(f: Farmer): Record<string, unknown> {
  return {
    slNo: f.slNo,
    dateOfPurchase: f.dateOfPurchase,
    landOwnerName: f.landOwnerName,
    villageOrMouza: f.villageOrMouza,
    khataNo: f.khataNo,
    area: f.area,
    farmerName: f.farmerName,
    aadharNo: f.aadharNo,
    mobileNo: f.mobileNo,
    cropsName: f.cropsName,
    fertilizers: f.fertilizers.map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount,
      price: x.price,
      ...(x.unit != null && x.unit.trim() !== "" ? { unit: x.unit.trim() } : {}),
    })),
    pesticides: f.pesticides.map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount,
      price: x.price,
      ...(x.unit != null && x.unit.trim() !== "" ? { unit: x.unit.trim() } : {}),
    })),
    seeds: f.seeds.map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount,
      price: x.price,
      ...(x.unit != null && x.unit.trim() !== "" ? { unit: x.unit.trim() } : {}),
    })),
    cscProducts: f.cscProducts.map((x) => ({
      id: x.id,
      name: x.name,
      amount: x.amount,
      price: x.price,
      ...(x.unit != null && x.unit.trim() !== "" ? { unit: x.unit.trim() } : {}),
    })),
    otherPecsItems: deleteField(),
    remarks: f.remarks,
  };
}
