// store/use-accounting.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import type {
  AccountingState,
  Product,
  RawCost,
  SalesEntry,
} from "~/types/accounting";

const STORAGE_KEY = "acct_state_v1";

function loadState(): AccountingState {
  if (typeof window === "undefined") return { products: [], sales: [] };
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return { products: [], sales: [] };
    return JSON.parse(data) as AccountingState;
  } catch {
    return { products: [], sales: [] };
  }
}

function saveState(state: AccountingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAccountingState() {
  const [state, setState] = useState<AccountingState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions = useMemo(() => {
    return {
      addProduct: (p: {
        title: string;
        pricePerItem: number;
        imageUrl?: string;
        imagePublicId?: string;
        rawCosts: { label: string; amount: number }[];
      }) => {
        const newP: Product = {
          id: nanoid(),
          title: p.title,
          pricePerItem: p.pricePerItem,
          imageUrl: p.imageUrl,
          imagePublicId: p.imagePublicId,
          rawCosts: p.rawCosts.map((rc) => ({
            id: nanoid(),
            label: rc.label,
            amount: rc.amount,
          })),
        };
        setState((s) => ({ ...s, products: [...s.products, newP] }));
      },
      updateProduct: (id: string, patch: Partial<Product>) => {
        setState((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        }));
      },
      deleteProduct: (id: string) => {
        setState((s) => ({
          ...s,
          products: s.products.filter((p) => p.id !== id),
          sales: s.sales.filter((se) => se.productId !== id),
        }));
      },
      addRawCost: (productId: string, rc: Omit<RawCost, "id">) => {
        const newRc: RawCost = { ...rc, id: nanoid() };
        setState((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === productId ? { ...p, rawCosts: [...p.rawCosts, newRc] } : p,
          ),
        }));
      },
      updateRawCost: (
        productId: string,
        rawCostId: string,
        patch: Partial<RawCost>,
      ) => {
        setState((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  rawCosts: p.rawCosts.map((rc) =>
                    rc.id === rawCostId ? { ...rc, ...patch } : rc,
                  ),
                }
              : p,
          ),
        }));
      },
      deleteRawCost: (productId: string, rawCostId: string) => {
        setState((s) => ({
          ...s,
          products: s.products.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  rawCosts: p.rawCosts.filter((rc) => rc.id !== rawCostId),
                }
              : p,
          ),
        }));
      },
      addSalesEntry: (productId: string, quantitySold: number) => {
        const entry: SalesEntry = {
          productId,
          quantitySold,
          soldAt: new Date().toISOString(),
        };
        setState((s) => ({ ...s, sales: [...s.sales, entry] }));
      },
      exportState: () => JSON.stringify(state, null, 2),
      importState: (json: string) => {
        try {
          const parsed = JSON.parse(json) as AccountingState;
          setState(parsed);
        } catch {
          // noop
        }
      },
    };
  }, [state]);

  const selectors = useMemo(() => {
    return {
      getProductById: (id: string) => state.products.find((p) => p.id === id),
      computeUnitCost: (productId: string) => {
        const p = state.products.find((x) => x.id === productId);
        if (!p) return 0;
        return p.rawCosts
          .filter((rc) => (rc.mode ?? "per-unit") === "per-unit")
          .reduce((sum, rc) => sum + rc.amount, 0);
      },
      computeUnitProfit: (productId: string) => {
        const p = state.products.find((x) => x.id === productId);
        if (!p) return 0;
        const unitCost = p.rawCosts.reduce((sum, rc) => sum + rc.amount, 0);
        return p.pricePerItem - unitCost;
      },
    };
  }, [state]);

  return { state, actions, selectors };
}
