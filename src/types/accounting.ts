// src/types/accounting.ts
export type RawCost = {
  id: string;
  label: string;
  amount: number;
  mode: "per-unit" | "total";
};

export type Product = {
  id: string;
  title: string;
  pricePerItem: number;
  imageUrl?: string;
  imagePublicId?: string;
  rawCosts: RawCost[]; // per item raw costs
};

export type SalesEntry = {
  productId: string;
  quantitySold: number;
  soldAt: string; // ISO date
};

export type AccountingState = {
  products: Product[];
  sales: SalesEntry[]; // entries captured in Add Mode
};