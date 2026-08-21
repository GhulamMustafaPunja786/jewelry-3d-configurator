"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerSchema,
  normalizeCustomer,
  type CustomerInput,
} from "@/lib/validation/customer";
import { useConfiguratorStore } from "@/store/configurator-store";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Button } from "@/components/ui/Button";

export function CustomerForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (data: CustomerInput) => Promise<void> | void;
  submitting?: boolean;
}) {
  const customer = useConfiguratorStore((s) => s.customer);
  const setCustomer = useConfiguratorStore((s) => s.setCustomer);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit(async (data) => {
        const normalized = normalizeCustomer(data);
        setCustomer(normalized);
        await onSubmit(normalized);
      })}
    >
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input id="name" {...register("name")} />
        <ErrorMessage message={errors.name?.message} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        <ErrorMessage message={errors.email?.message} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...register("country")} />
        </div>
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Input id="message" {...register("message")} />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit design"}
      </Button>
    </form>
  );
}
