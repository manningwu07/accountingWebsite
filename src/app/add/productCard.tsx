/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// app/productCard.tsx
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "~/components/ui/input";
import Image from "next/image";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import { nanoid } from "nanoid";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

type EditableCost = {
  id: string;
  label: string;
  amount: number;
  mode: "per-unit" | "total";
};

type SavePatch = {
  title?: string;
  imageUrl?: string;
  imagePublicId?: string;
  rawCosts?: EditableCost[];
};

type ProductCardProps = {
  id: string;
  title: string;
  imageUrl?: string;
  rawCosts: {
    id: string;
    label: string;
    amount: number;
    mode?: "per-unit" | "total";
  }[];
  quantity: number | "";
  onQuantityChange: (val: number | "") => void;
  editing: boolean;
  onRequestEdit: () => void;
  onSave: (patch: SavePatch, dirty: boolean) => void;
  onCancel: () => void;
};

export function ProductCard(props: ProductCardProps) {
  const [localTitle, setLocalTitle] = useState(props.title);
  const [localCosts, setLocalCosts] = useState<EditableCost[]>(
    () =>
      props.rawCosts.map((rc) => ({
        id: rc.id,
        label: rc.label,
        amount: rc.amount,
        mode: rc.mode ?? "per-unit",
      })) ?? []
  );
  const [localImageUrl, setLocalImageUrl] = useState<string | undefined>(
    props.imageUrl
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => setLocalTitle(props.title), [props.title]);
  useEffect(() => {
    setLocalCosts(
      props.rawCosts.map((rc) => ({
        id: rc.id,
        label: rc.label,
        amount: rc.amount,
        mode: rc.mode ?? "per-unit",
      }))
    );
  }, [props.rawCosts]);
  useEffect(() => setLocalImageUrl(props.imageUrl), [props.imageUrl]);

  const qtyValue = props.quantity;
  const handleQtyChange = (raw: string) => {
    if (raw === "") return props.onQuantityChange("");
    const sanitized = raw.replace(/[^\d]/g, "");
    const n = Number(sanitized);
    props.onQuantityChange(Number.isFinite(n) && n >= 0 ? n : 0);
  };

  const markDirty = () => setDirty(true);

  return (
    <Card className="group relative relaxed-card hover-soft flex flex-col">
      {!props.editing && (
        <button
          className="absolute right-3 top-3 hidden rounded-md bg-white/5 p-2 text-subtle transition hover:bg-white/10 group-hover:block"
          onClick={props.onRequestEdit}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      <CardContent className="flex flex-col gap-4 p-4">
        {props.editing ? (
          <UploadDropzone
            currentUrl={localImageUrl}
            onUploaded={(url) => {
              setLocalImageUrl(url);
              markDirty();
            }}
          />
        ) : localImageUrl ? (
          <div className="relative mx-auto overflow-hidden rounded-lg">
            <Image
              src={localImageUrl}
              alt={localTitle}
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
        ) : (
          <div className="mx-auto hidden h-[400px] w-[400px] rounded-lg bg-[hsl(var(--muted))] md:block" />
        )}

        {!props.editing ? (
          <div className="text-lg font-semibold text-zinc-100">{localTitle}</div>
        ) : (
          <div>
            <label className="mb-1 block text-sm text-zinc-100">Title</label>
            <Input
              value={localTitle}
              onChange={(e) => {
                setLocalTitle(e.target.value);
                markDirty();
              }}
            />
          </div>
        )}

        {!props.editing && (
          <div>
            <label className="mb-1 block text-sm text-zinc-100">Quantity</label>
            <Input
              className="no-spinner"
              inputMode="numeric"
              value={qtyValue}
              onChange={(e) => handleQtyChange(e.target.value)}
              placeholder="0"
            />
          </div>
        )}

        {props.editing && (
          <EditFields
            costs={localCosts}
            setCosts={(v) => {
              setLocalCosts(v);
              markDirty();
            }}
            onSave={() =>
              props.onSave(
                {
                  title: localTitle,
                  imageUrl: localImageUrl,
                  rawCosts: localCosts,
                },
                dirty
              )
            }
            onCancel={props.onCancel}
            onClickOutsideSave={() =>
              props.onSave(
                {
                  title: localTitle,
                  imageUrl: localImageUrl,
                  rawCosts: localCosts,
                },
                dirty
              )
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function EditFields(props: {
  costs: EditableCost[];
  setCosts: (v: EditableCost[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onClickOutsideSave: () => void;
}) {
  const ref = useOutsideSave(props.onClickOutsideSave);

  return (
    <div ref={ref} className="mt-4 space-y-4">
      <div>
        <div className="mb-2 text-sm font-medium text-zinc-100">Raw costs</div>
        <div className="space-y-2">
          {props.costs.map((rc, idx) => (
            <div key={rc.id} className="grid grid-cols-6 items-center gap-2">
              <Input
                className="col-span-3"
                placeholder="Label"
                value={rc.label}
                onChange={(e) => {
                  props.setCosts(
                    props.costs.map((c, i) =>
                      i === idx ? { ...c, label: e.target.value } : c
                    )
                  );
                }}
              />
              <Input
                className="col-span-2 no-spinner"
                type="number"
                inputMode="decimal"
                placeholder="Amount"
                value={rc.amount}
                onChange={(e) => {
                  const n = Number(e.target.value) || 0;
                  props.setCosts(
                    props.costs.map((c, i) =>
                      i === idx ? { ...c, amount: n } : c
                    )
                  );
                }}
              />
              <Select
                value={rc.mode}
                onValueChange={(val: "per-unit" | "total") => {
                  props.setCosts(
                    props.costs.map((c, i) =>
                      i === idx ? { ...c, mode: val } : c
                    )
                  );
                }}
              >
                <SelectTrigger className="col-span-1 focus:ring-[hsl(var(--accent))]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per-unit">Per unit</SelectItem>
                  <SelectItem value="total">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Button
            variant="secondary"
            onClick={() =>
              props.setCosts([
                ...props.costs,
                { id: nanoid(), label: "", amount: 0, mode: "per-unit" },
              ])
            }
          >
            Add cost
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button className="btn-accent" onClick={props.onSave}>
          Save
        </Button>
        <Button variant="secondary" onClick={props.onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function UploadDropzone({
  currentUrl,
  onUploaded,
}: {
  currentUrl?: string;
  onUploaded: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handlePick() {
    const file = await pickImageFile();
    if (!file) return;
    setLoading(true);
    try {
      const { uploadToCloudinary } = await import("~/lib/cloudinary");
      const res = await uploadToCloudinary(file, {
        folder:
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_FOLDER ??
          "accounting-products",
      });
      onUploaded(res.secure_url);
      toast.success("Image updated");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Error";
      toast.error("Upload failed", { description: String(msg) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePick}
      className="relative mx-auto hidden h-[400px] w-[400px] items-center justify-center overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--panel))] md:flex"
      title="Click to upload image"
    >
      {loading ? (
        <div className="text-subtle">Uploading…</div>
      ) : currentUrl ? (
        <div className="flex h-full w-full items-center justify-center text-subtle">
          Click to upload image (replace)
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-subtle">
          Click to upload image
        </div>
      )}
    </button>
  );
}

async function pickImageFile(): Promise<File | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => resolve(input.files?.[0] ?? undefined);
    input.click();
  });
}

function useOutsideSave(onClickOutside: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const node = ref.current;
      if (!node) return;
      if (!node.contains(e.target as Node)) onClickOutside();
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClickOutside]);
  return ref;
}