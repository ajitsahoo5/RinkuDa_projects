export type FertilizerType = {
  id: string;
  name: string;
  amount: number;
  price: number;
  /** Quantity unit from catalog or legacy default (kg). */
  unit?: string;
};

export type Farmer = {
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
  fertilizers: FertilizerType[];
  pesticides: FertilizerType[];
  seeds: FertilizerType[];
  /** Other PECS consumables (matches `settings/catalog.otherPecsItems`). */
  otherPecsItems: FertilizerType[];
  remarks: string;
};

export function totalPrice(f: Farmer): number {
  const lines = [
    ...f.fertilizers,
    ...f.pesticides,
    ...f.seeds,
    ...f.otherPecsItems,
  ];
  return lines.reduce((s, x) => s + x.amount * x.price, 0);
}

export type FarmerFilter = {
  mouja: string | null;
  minAcre: number | null;
  maxAcre: number | null;
};

export function filterEmpty(f: FarmerFilter): boolean {
  return (
    (f.mouja == null || f.mouja.trim() === "") &&
    f.minAcre == null &&
    f.maxAcre == null
  );
}
