"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { METALS } from "@/data/metals";
import { RING_MODELS } from "@/data/models";
import { STONES } from "@/data/stones";
import { ringConfigSchema, type RingConfigInput } from "@/lib/validation/ring";
import { useConfiguratorStore } from "@/store/configurator-store";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export function RingConfiguratorForm({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const { config, pricing, updateConfig, recalculatePricing } =
    useConfiguratorStore();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RingConfigInput>({
    resolver: zodResolver(ringConfigSchema),
    defaultValues: config,
  });

  const values = watch();

  useEffect(() => {
    recalculatePricing();
  }, [recalculatePricing]);

  useEffect(() => {
    const parsed = ringConfigSchema.safeParse(values);
    if (parsed.success) {
      updateConfig(parsed.data);
    }
  }, [values, updateConfig]);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(() => {
        recalculatePricing();
        onContinue();
      })}
    >
      <div>
        <Label htmlFor="modelSlug">Model</Label>
        <Select id="modelSlug" {...register("modelSlug")}>
          {RING_MODELS.map((model) => (
            <option key={model.slug} value={model.slug}>
              {model.name}
            </option>
          ))}
        </Select>
        <ErrorMessage message={errors.modelSlug?.message} />
      </div>

      <div>
        <Label htmlFor="metalCode">Metal</Label>
        <Select id="metalCode" {...register("metalCode")}>
          {METALS.map((metal) => (
            <option key={metal.code} value={metal.code}>
              {metal.name}
            </option>
          ))}
        </Select>
        <ErrorMessage message={errors.metalCode?.message} />
      </div>

      <div>
        <Label htmlFor="stoneCode">Center stone</Label>
        <Select id="stoneCode" {...register("stoneCode")}>
          {STONES.map((stone) => (
            <option key={stone.code} value={stone.code}>
              {stone.name}
            </option>
          ))}
        </Select>
        <ErrorMessage message={errors.stoneCode?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="stoneCarats">Carats</Label>
          <Controller
            name="stoneCarats"
            control={control}
            render={({ field }) => (
              <Input
                id="stoneCarats"
                type="number"
                step="0.1"
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          <ErrorMessage message={errors.stoneCarats?.message} />
        </div>
        <div>
          <Label htmlFor="ringSize">Ring size</Label>
          <Controller
            name="ringSize"
            control={control}
            render={({ field }) => (
              <Input
                id="ringSize"
                type="number"
                step="0.5"
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          <ErrorMessage message={errors.ringSize?.message} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="bandWidthMm">Band width (mm)</Label>
          <Controller
            name="bandWidthMm"
            control={control}
            render={({ field }) => (
              <Input
                id="bandWidthMm"
                type="number"
                step="0.1"
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          <ErrorMessage message={errors.bandWidthMm?.message} />
        </div>
        <div>
          <Label htmlFor="finish">Finish</Label>
          <Select id="finish" {...register("finish")}>
            <option value="polished">Polished</option>
            <option value="matte">Matte</option>
            <option value="brushed">Brushed</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="engraving">Engraving (optional)</Label>
        <Input id="engraving" maxLength={40} {...register("engraving")} />
        <ErrorMessage message={errors.engraving?.message} />
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
          Estimated total
        </p>
        <p className="font-display mt-1 text-3xl text-[var(--color-ink)]">
          {pricing ? formatCurrency(pricing.total, pricing.currency) : "—"}
        </p>
      </div>

      <Button type="submit" className="w-full">
        View quotation
      </Button>
    </form>
  );
}
