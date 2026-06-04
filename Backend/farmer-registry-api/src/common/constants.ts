export type UserRole = 'admin' | 'client';

export const PURCHASE_LINE_AMOUNT_EPSILON = 1e-9;

export function omitZeroAmountLines<T extends { amount: number }>(lines: T[]): T[] {
  return lines.filter((x) => Number(x.amount) > PURCHASE_LINE_AMOUNT_EPSILON);
}

export function normalizedAadharDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function normalizedMobileDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function isValidIndianMobile(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}
