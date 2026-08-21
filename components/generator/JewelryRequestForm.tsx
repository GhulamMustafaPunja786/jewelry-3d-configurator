"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  jewelryRequestSchema,
  type JewelryRequestInput,
} from "@/lib/validation/jewelry-request";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import type { JewelryGenerationRequest } from "@/lib/ai/types";

const JEWELRY_TYPES = [
  { value: "ring", label: "Ring" },
  { value: "necklace", label: "Necklace" },
  { value: "chain", label: "Chain" },
  { value: "pendant", label: "Pendant" },
  { value: "bracelet", label: "Bracelet" },
  { value: "earrings", label: "Earrings" },
] as const;

const STYLES = [
  "classic",
  "luxury",
  "minimal",
  "modern",
  "vintage",
  "royal",
  "custom",
] as const;

const METALS = [
  { value: "yellow_gold", label: "Yellow gold" },
  { value: "white_gold", label: "White gold" },
  { value: "rose_gold", label: "Rose gold" },
  { value: "platinum", label: "Platinum" },
  { value: "silver", label: "Silver" },
  { value: "any", label: "Any / advise me" },
] as const;

const STONES = [
  { value: "diamond", label: "Diamond" },
  { value: "ruby", label: "Ruby" },
  { value: "sapphire", label: "Sapphire" },
  { value: "emerald", label: "Emerald" },
  { value: "any", label: "Any / advise me" },
] as const;

const BUDGETS = [
  { value: "under_500", label: "Under $500" },
  { value: "500_1000", label: "$500 – $1,000" },
  { value: "1000_2500", label: "$1,000 – $2,500" },
  { value: "2500_5000", label: "$2,500 – $5,000" },
  { value: "5000_plus", label: "$5,000+" },
  { value: "unspecified", label: "Not sure yet" },
] as const;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function JewelryRequestForm({
  defaultValues,
  submitting,
  onSubmit,
}: {
  defaultValues?: Partial<JewelryGenerationRequest>;
  submitting?: boolean;
  onSubmit: (data: JewelryGenerationRequest) => Promise<void> | void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JewelryRequestInput>({
    resolver: zodResolver(jewelryRequestSchema),
    defaultValues: {
      jewelryType: defaultValues?.jewelryType ?? "ring",
      description: defaultValues?.description ?? "",
      style: defaultValues?.style ?? "classic",
      metal: defaultValues?.metal ?? "yellow_gold",
      stone: defaultValues?.stone ?? "diamond",
      budget: defaultValues?.budget ?? "unspecified",
      additionalRequirements: defaultValues?.additionalRequirements ?? "",
      referenceImageUrl: defaultValues?.referenceImageUrl ?? null,
    },
  });

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (data) => {
        await onSubmit({
          jewelryType: data.jewelryType,
          description: data.description.trim(),
          style: data.style,
          metal: data.metal,
          stone: data.stone,
          budget: data.budget,
          additionalRequirements: data.additionalRequirements?.trim() || undefined,
          referenceImageUrl: data.referenceImageUrl ?? null,
        });
      })}
    >
      <div>
        <Label htmlFor="jewelryType">Jewelry type</Label>
        <Select id="jewelryType" {...register("jewelryType")}>
          {JEWELRY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <ErrorMessage message={errors.jewelryType?.message} />
      </div>

      <div>
        <Label htmlFor="description">Describe your piece</Label>
        <textarea
          id="description"
          rows={4}
          className="w-full rounded-sm border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-gold)]"
          placeholder="A slender diamond engagement ring with a soft cathedral setting…"
          {...register("description")}
        />
        <ErrorMessage message={errors.description?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="style">Style</Label>
          <Select id="style" {...register("style")}>
            {STYLES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="budget">Budget</Label>
          <Select id="budget" {...register("budget")}>
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="metal">Metal preference</Label>
          <Select id="metal" {...register("metal")}>
            {METALS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="stone">Stone preference</Label>
          <Select id="stone" {...register("stone")}>
            {STONES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="additionalRequirements">Additional notes</Label>
        <Input
          id="additionalRequirements"
          placeholder="Engraving, size hints, occasion…"
          {...register("additionalRequirements")}
        />
        <ErrorMessage message={errors.additionalRequirements?.message} />
      </div>

      <div>
        <Label htmlFor="referenceImage">Reference image (optional)</Label>
        <Input
          id="referenceImage"
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setValue("referenceImageUrl", null);
              return;
            }
            if (file.size > 1_500_000) {
              setValue("referenceImageUrl", null);
              return;
            }
            try {
              const dataUrl = await readFileAsDataUrl(file);
              setValue("referenceImageUrl", dataUrl.slice(0, 5000));
            } catch {
              setValue("referenceImageUrl", null);
            }
          }}
        />
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Optional inspiration photo (kept under 1.5&nbsp;MB for upload).
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Starting generation…" : "Generate my jewelry"}
      </Button>
    </form>
  );
}
