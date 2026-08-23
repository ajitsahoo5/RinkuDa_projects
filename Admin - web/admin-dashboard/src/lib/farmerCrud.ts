import {
  createFarmer as apiCreateFarmer,
  deleteFarmer as apiDeleteFarmer,
  markFarmerSentToBank as apiMarkFarmerSentToBank,
  removeFarmerFromBankDocs as apiRemoveFarmerFromBankDocs,
  updateFarmer as apiUpdateFarmer,
} from "./api/registry/farmersApi";
import { invalidateCatalog, invalidateFarmers } from "./api/invalidate";
import { setGoogleSheetLink as apiSetGoogleSheetLink } from "./api/registry/settingsApi";
import type { Farmer } from "../types/farmer";

export async function upsertFarmer(farmer: Farmer, options?: { create?: boolean }): Promise<void> {
  if (options?.create) {
    await apiCreateFarmer(farmer);
  } else {
    await apiUpdateFarmer(farmer.id, farmer);
  }
  invalidateFarmers();
  invalidateCatalog();
}

export async function deleteFarmer(id: string): Promise<void> {
  await apiDeleteFarmer(id);
  invalidateFarmers();
}

export async function markFarmerSentToBank(id: string): Promise<void> {
  await apiMarkFarmerSentToBank(id);
  invalidateFarmers();
}

export async function removeFarmerFromBankDocs(id: string): Promise<void> {
  await apiRemoveFarmerFromBankDocs(id);
  invalidateFarmers();
}

export async function setGoogleSheetLink(link: string | null): Promise<void> {
  await apiSetGoogleSheetLink(link);
}
