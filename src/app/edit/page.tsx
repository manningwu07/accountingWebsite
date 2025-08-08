/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

// app/edit/page.tsx
"use client";

import { AppHeader } from "~/components/app-header";
import { Button } from "~/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import Image from "next/image";
import { useState } from "react";
import { uploadToCloudinary } from "~/lib/cloudinary";
import { useAccountingState } from "~/store/use-acccounting";
import { toast } from "sonner";
import { ProtectedRoute } from "~/components/protected-routes";

export default function EditPage() {
  const { state, actions } = useAccountingState();
  const [open, setOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[hsl(var(--bg))] text-zinc-100">
        <AppHeader />
        <main className="mx-auto max-w-5xl p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">Edit Mode</h1>
            <p className="text-sm text-zinc-400">
              Manage products, images, price, and per-item raw costs.
            </p>
          </div>

          <div className="mb-4 flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="btn-accent">Add Product</Button>
              </DialogTrigger>
              <DialogContent className="bg-[hsl(var(--panel))] text-zinc-100">
                <DialogHeader>
                  <DialogTitle>New Product</DialogTitle>
                </DialogHeader>
                <NewProductForm
                  onCreate={(p) => {
                    actions.addProduct(p);
                    setOpen(false);
                    toast.success("Product created");
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {state.products.map((p) => (
              <Card
                key={p.id}
                className="relaxed-card border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              >
                <CardHeader className="flex flex-row items-center justify-between text-zinc-100">
                  <CardTitle>{p.title}</CardTitle>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      actions.deleteProduct(p.id);
                      toast.success("Product deleted");
                    }}
                  >
                    Delete
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-md bg-[hsl(var(--muted))]">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                          No image
                        </div>
                      )}
                    </div>
                    <UploadImageButton
                      onUpload={async (file) => {
                        try {
                          const res = await uploadToCloudinary(file, {
                            folder:
                              process.env.CLOUDINARY_UPLOAD_FOLDER ??
                              "accounting-products",
                          });
                          actions.updateProduct(p.id, {
                            imageUrl: res.secure_url,
                            imagePublicId: res.public_id,
                          });
                          toast.success("Image uploaded");
                        } catch (e) {
                          let message = "Unknown error";
                          if (e instanceof Error) {
                            message = e.message;
                          } else if (typeof e === "string") {
                            message = e;
                          }

                          // If the message looks like HTML, replace it
                          if (message.trim().startsWith("<")) {
                            message =
                              "Server returned an unexpected HTML response.";
                          }

                          toast.error("Upload failed", {
                            description: message,
                          });
                        }
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-zinc-100">
                      Title
                    </label>
                    <Input
                      className="bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
                      value={p.title}
                      onChange={(e) => {
                        actions.updateProduct(p.id, { title: e.target.value });
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-zinc-100">
                      Price per item
                    </label>
                    <Input
                      className="bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
                      type="number"
                      inputMode="decimal"
                      value={p.pricePerItem}
                      onChange={(e) =>
                        actions.updateProduct(p.id, {
                          pricePerItem: e.target.valueAsNumber,
                        })
                      }
                    />
                  </div>

                  <Separator className="bg-[hsl(var(--border))]" />

                  <div>
                    <div className="mb-2 text-sm font-medium text-zinc-100">
                      Raw costs
                    </div>
                    <div className="space-y-2">
                      {p.rawCosts.map((rc) => (
                        <div key={rc.id} className="grid grid-cols-6 gap-2">
                          {/* Label */}
                          <Input
                            className="col-span-2 bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
                            value={rc.label}
                            onChange={(e) =>
                              actions.updateRawCost(p.id, rc.id, {
                                label: e.target.value,
                              })
                            }
                          />

                          {/* Amount */}
                          <Input
                            className="no-spinner col-span-2 bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
                            type="number"
                            inputMode="decimal"
                            value={rc.amount}
                            onChange={(e) =>
                              actions.updateRawCost(p.id, rc.id, {
                                amount: Number(e.target.value),
                              })
                            }
                          />

                          {/* Mode selector */}
                          <select
                            className="col-span-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--panel))] px-2 py-1 text-sm text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
                            value={rc.mode ?? "per-unit"}
                            onChange={(e) =>
                              actions.updateRawCost(p.id, rc.id, {
                                mode: e.target.value as "per-unit" | "total",
                              })
                            }
                          >
                            <option value="per-unit">Per unit</option>
                            <option value="total">Total</option>
                          </select>

                          {/* Remove button */}
                          <div className="col-span-6">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                actions.deleteRawCost(p.id, rc.id);
                                toast.success("Raw cost removed");
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add new raw cost */}
                    <div className="mt-3">
                      <AddRawCostForm
                        onAdd={(label, amount) => {
                          actions.addRawCost(p.id, {
                            label,
                            amount,
                            mode: "per-unit",
                          });
                          toast.success("Raw cost added");
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function UploadImageButton({
  onUpload,
}: {
  onUpload: (file: File) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--panel))] px-3 py-2 text-sm text-zinc-100 hover:bg-[hsl(var(--muted))]">
        <Input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setLoading(true);
            try {
              await onUpload(file);
            } finally {
              setLoading(false);
            }
          }}
        />
        {loading ? "Uploading..." : "Upload Image"}
      </label>
    </div>
  );
}

function NewProductForm({
  onCreate,
}: {
  onCreate: (p: {
    title: string;
    pricePerItem: number;
    imageUrl?: string;
    imagePublicId?: string;
    rawCosts: { label: string; amount: number }[];
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-100">Title</label>
        <Input
          className="bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-zinc-100">
          Price per item
        </label>
        <Input
          type="number"
          className="no-spinner bg-[hsl(var(--panel))] text-zinc-100"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <Button
          className="btn-accent"
          onClick={() => {
            if (!title.trim()) return;
            onCreate({
              title: title.trim(),
              pricePerItem: price === "" ? 0 : Number(price),
              rawCosts: [],
            });
            setTitle("");
            setPrice("0");
          }}
        >
          Create
        </Button>
      </div>
    </div>
  );
}

function AddRawCostForm({
  onAdd,
}: {
  onAdd: (label: string, amount: number, mode: "per-unit" | "total") => void;
}) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [mode, setMode] = useState<"per-unit" | "total">("per-unit");

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-zinc-100">
          Label
        </label>
        <Input
          className="bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <div className="w-32">
        <label className="mb-1 block text-sm font-medium text-zinc-100">
          Amount
        </label>
        <Input
          className="no-spinner bg-[hsl(var(--panel))] text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>
      <div className="w-32">
        <label className="mb-1 block text-sm font-medium text-zinc-100">
          Mode
        </label>
        <select
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--panel))] px-2 py-1 text-sm text-zinc-100 focus:border-[hsl(var(--accent))] focus:ring-[hsl(var(--accent))]"
          value={mode}
          onChange={(e) => setMode(e.target.value as "per-unit" | "total")}
        >
          <option value="per-unit">Per unit</option>
          <option value="total">Total</option>
        </select>
      </div>
      <Button
        className="btn-accent"
        onClick={() => {
          if (!label.trim()) return;
          onAdd(label.trim(), amount, mode);
          setLabel("");
          setAmount(0);
          setMode("per-unit");
        }}
      >
        Add
      </Button>
    </div>
  );
}
