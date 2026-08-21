"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  "NEW",
  "IN_REVIEW",
  "QUOTED",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
] as const;

export function DesignStatusSelect({
  designId,
  status,
}: {
  designId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    setValue(next);
    setSaving(true);
    try {
      await fetch(`/api/admin/designs/${encodeURIComponent(designId)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="rounded-sm border border-[var(--color-border)] bg-white px-2 py-1 text-xs"
      value={value}
      disabled={saving}
      onChange={(e) => onChange(e.target.value)}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
