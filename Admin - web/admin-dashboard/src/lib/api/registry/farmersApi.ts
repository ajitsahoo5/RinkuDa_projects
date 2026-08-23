import type { Farmer, FertilizerType } from "../../../types/farmer";
import { omitZeroAmountLines } from "../../../types/farmer";
import { apiRequest } from "../client";

type ApiPurchaseLine = {
  id: string;
  name: string;
  amount: number;
  price: number;
  unit?: string;
};

export type ApiFarmer = {
  id: string;
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
  fertilizers: ApiPurchaseLine[];
  pesticides: ApiPurchaseLine[];
  seeds: ApiPurchaseLine[];
  cscProducts: ApiPurchaseLine[];
  remarks: string;
  sentToBank: boolean;
  sentToBankAt: string | null;
  totalPrice?: number;
};

function toLines(lines: ApiPurchaseLine[] | undefined): FertilizerType[] {
  if (!Array.isArray(lines)) return [];
  return omitZeroAmountLines(lines);
}

export function apiFarmerToFarmer(row: ApiFarmer): Farmer {
  return {
    id: row.id,
    slNo: row.slNo,
    dateOfPurchase: row.dateOfPurchase,
    landOwnerName: row.landOwnerName,
    villageOrMouza: row.villageOrMouza,
    khataNo: row.khataNo,
    area: row.area,
    farmerName: row.farmerName,
    aadharNo: row.aadharNo,
    mobileNo: row.mobileNo,
    cropsName: row.cropsName,
    address: row.address,
    paymentRemark: row.paymentRemark,
    fertilizers: toLines(row.fertilizers),
    pesticides: toLines(row.pesticides),
    seeds: toLines(row.seeds),
    cscProducts: toLines(row.cscProducts),
    remarks: row.remarks,
    sentToBank: row.sentToBank === true,
    sentToBankAt: row.sentToBankAt ?? undefined,
  };
}

function linePayload(lines: FertilizerType[]) {
  return omitZeroAmountLines(lines).map((x) => ({
    id: x.id,
    name: x.name,
    amount: x.amount,
    price: x.price,
    ...(x.unit?.trim() ? { unit: x.unit.trim() } : {}),
  }));
}

export function farmerToApiPayload(f: Farmer, includeId = false): Record<string, unknown> {
  return {
    ...(includeId ? { id: f.id } : {}),
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
    address: f.address,
    paymentRemark: f.paymentRemark,
    fertilizers: linePayload(f.fertilizers),
    pesticides: linePayload(f.pesticides),
    seeds: linePayload(f.seeds),
    cscProducts: linePayload(f.cscProducts),
    remarks: f.remarks,
    sentToBank: f.sentToBank ?? false,
    sentToBankAt: f.sentToBankAt ?? null,
  };
}

export async function listFarmers(): Promise<Farmer[]> {
  const rows = await apiRequest<ApiFarmer[]>("/registry/farmers");
  return rows.map(apiFarmerToFarmer).sort((a, b) => a.slNo - b.slNo);
}

export async function getFarmer(id: string): Promise<Farmer> {
  const row = await apiRequest<ApiFarmer>(`/registry/farmers/${encodeURIComponent(id)}`);
  return apiFarmerToFarmer(row);
}

export async function createFarmer(farmer: Farmer): Promise<Farmer> {
  const row = await apiRequest<ApiFarmer>("/registry/farmers", {
    method: "POST",
    body: JSON.stringify(farmerToApiPayload(farmer, true)),
  });
  return apiFarmerToFarmer(row);
}

export async function updateFarmer(id: string, farmer: Farmer): Promise<Farmer> {
  const row = await apiRequest<ApiFarmer>(`/registry/farmers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(farmerToApiPayload(farmer)),
  });
  return apiFarmerToFarmer(row);
}

export async function deleteFarmer(id: string): Promise<void> {
  await apiRequest<void>(`/registry/farmers/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function markFarmerSentToBank(id: string): Promise<Farmer> {
  const row = await apiRequest<ApiFarmer>(
    `/registry/farmers/${encodeURIComponent(id)}/sent-to-bank`,
    { method: "PATCH" },
  );
  return apiFarmerToFarmer(row);
}

export async function removeFarmerFromBankDocs(id: string): Promise<Farmer> {
  const row = await apiRequest<ApiFarmer>(
    `/registry/farmers/${encodeURIComponent(id)}/remove-from-bank-docs`,
    { method: "PATCH" },
  );
  return apiFarmerToFarmer(row);
}
