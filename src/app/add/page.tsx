// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "~/components/app-header";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { useAccountingState } from "~/store/use-acccounting";
import { ProductCard } from "./productCard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ProtectedRoute } from "~/components/protected-routes";

type EditMap = Record<string, boolean>;

export default function HomePage() {
  const { state, actions } = useAccountingState();
  const [quantities, setQuantities] = useState<Record<string, number | "">>({});
  const [editAll, setEditAll] = useState(false);
  const [editing, setEditing] = useState<EditMap>({});
  const [products, setProducts] = useState(state.products);

  useEffect(() => {
    setProducts(state.products);
  }, [state.products]);

  const sensors = useSensors(useSensor(PointerSensor));

  const totals = useMemo(() => {
    const agg = products.reduce(
      (acc, p) => {
        const q = (quantities[p.id] ?? 0) as number;
        const unitCost = p.rawCosts
          .filter((rc) => (rc.mode ?? "per-unit") === "per-unit")
          .reduce((s, rc) => s + rc.amount, 0);
        acc.revenue += q * p.pricePerItem;
        acc.cost += q * unitCost;
        acc.profit += q * (p.pricePerItem - unitCost);
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0 }
    );
    return agg;
  }, [products, quantities]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        actions.importState(
          JSON.stringify({ ...state, products: newOrder })
        );
        return newOrder;
      });
    }
  }

  function commitSales() {
    let added = 0;
    Object.entries(quantities).forEach(([productId, q]) => {
      const qty = Number(q) || 0;
      if (qty > 0) {
        actions.addSalesEntry(productId, qty);
        added++;
      }
    });
    setQuantities({});
    if (added > 0) toast.success("Sales saved");
  }

  function setCardEdit(id: string, value: boolean) {
    setEditing((m) => ({ ...m, [id]: value }));
  }

  function isEditing(id: string) {
    return editAll || editing[id] === true;
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen text-zinc-100">
      <AppHeader />
      <main className="max-w-8xl mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Add Mode</h1>
            <p className="text-subtle text-sm">
              Input quantities. Hover a card to edit that product, or Edit all.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={editAll ? "secondary" : "default"}
              onClick={() => setEditAll((v) => !v)}
            >
              {editAll ? "Exit Edit All" : "Edit All"}
            </Button>
            <Button className="btn-accent" onClick={commitSales}>
              Save Sales
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={products.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    imageUrl={p.imageUrl}
                    rawCosts={p.rawCosts}
                    quantity={quantities[p.id] ?? ""}
                    onQuantityChange={(val) =>
                      setQuantities((q) => ({ ...q, [p.id]: val }))
                    }
                    editing={isEditing(p.id)}
                    onRequestEdit={() => setCardEdit(p.id, true)}
                    onSave={(patch, dirty) => {
                      if (patch.title !== undefined)
                        actions.updateProduct(p.id, { title: patch.title });
                      if (
                        patch.imageUrl !== undefined ||
                        patch.imagePublicId !== undefined
                      ) {
                        actions.updateProduct(p.id, {
                          imageUrl: patch.imageUrl,
                          imagePublicId: patch.imagePublicId,
                        });
                      }
                      if (patch.rawCosts) {
                        actions.updateProduct(p.id, {
                          rawCosts: patch.rawCosts,
                        });
                      }
                      setCardEdit(p.id, false);
                      if (dirty) toast.success("Saved");
                    }}
                    onCancel={() => setCardEdit(p.id, false)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="text-subtle mt-8 text-sm">
          Total Revenue: ${totals.revenue.toFixed(2)} | Total Cost: $
          {totals.cost.toFixed(2)} | Total Profit: ${totals.profit.toFixed(2)}
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}

function EmptyState() {
  return (
    <div className="relaxed-card mx-auto max-w-xl rounded-lg border p-8 text-center">
      <h2 className="mb-2 text-xl font-semibold">No products yet</h2>
      <p className="text-subtle text-sm">
        Go to Edit Mode to add a product and set price, image, and costs.
      </p>
    </div>
  );
}