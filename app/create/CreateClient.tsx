"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { JewelryRequestForm } from "@/components/generator/JewelryRequestForm";
import { GenerationProgress } from "@/components/generator/GenerationProgress";
import { DesignReview } from "@/components/generator/DesignReview";
import { AiQuotationView } from "@/components/quotation/AiQuotationView";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { estimateAiJewelryPrice } from "@/lib/pricing/ai-estimate";
import type {
  GenerationJobStatus,
  JewelryGenerationRequest,
  JewelryRequestType,
} from "@/lib/ai/types";
import {
  customerSchema,
  normalizeCustomer,
  type CustomerInput,
} from "@/lib/validation/customer";
import { useGeneratorStore } from "@/store/generator-store";
import { QUOTATION_TERMS, QUOTATION_VALID_DAYS } from "@/data/terms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const VALID_TYPES: JewelryRequestType[] = [
  "ring",
  "necklace",
  "chain",
  "pendant",
  "bracelet",
  "earrings",
];

function isJewelryType(value: string | null): value is JewelryRequestType {
  return Boolean(value && VALID_TYPES.includes(value as JewelryRequestType));
}

function asJobStatus(value: string | undefined): GenerationJobStatus {
  if (
    value === "QUEUED" ||
    value === "PROCESSING" ||
    value === "COMPLETED" ||
    value === "FAILED"
  ) {
    return value;
  }
  return "QUEUED";
}

function friendlyError(message: string | null | undefined): string | null {
  if (!message) return null;
  const lower = message.toLowerCase();
  if (
    lower.includes("unknown job") ||
    lower.includes("job not found") ||
    lower.includes("provider rejected")
  ) {
    return "That generation session expired. Use Edit request or Start over to try again.";
  }
  return message;
}

type StartResponse = {
  jobId?: string;
  designId?: string;
  internalDesignCuid?: string;
  status?: string;
  progressMessage?: string;
  error?: string;
};

type PollResponse = {
  jobId?: string;
  designId?: string | null;
  internalDesignCuid?: string | null;
  status?: string;
  progressMessage?: string | null;
  error?: string | null;
  modelUrl?: string | null;
  versions?: Array<{
    id: string;
    versionNumber: number;
    modelUrl: string | null;
    previewUrl: string | null;
    prompt: string;
    selected: boolean;
  }>;
};

function CreateFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const {
    request,
    draftDesignId,
    currentJobId,
    jobStatus,
    progressMessage,
    versions,
    selectedVersionId,
    pricing,
    customer,
    step,
    emailWarning,
    setRequest,
    setJob,
    setVersions,
    selectVersion,
    setPricing,
    setCustomer,
    setStep,
    setSubmitted,
    reset,
    backToForm,
  } = useGeneratorStore();

  const typeParam = params.get("type");

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isJewelryType(typeParam) && request.jewelryType !== typeParam) {
      setRequest({ jewelryType: typeParam });
    }
  }, [typeParam, request.jewelryType, setRequest]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer,
  });

  const quotationView = useMemo(() => {
    if (!pricing) return null;
    return {
      designId: draftDesignId ?? undefined,
      category: request.jewelryType,
      request,
      pricing,
      customer,
      terms: QUOTATION_TERMS,
      validDays: QUOTATION_VALID_DAYS,
    };
  }, [pricing, draftDesignId, request, customer]);

  function handleBackToForm() {
    setError(null);
    backToForm();
  }

  function handleStartOver() {
    setError(null);
    reset();
  }

  async function startJob(
    nextRequest: JewelryGenerationRequest,
    feedback?: string,
  ) {
    setBusy(true);
    setError(null);
    setRequest(nextRequest);
    setStep("generating");

    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: nextRequest,
          designId: draftDesignId ?? undefined,
          feedback,
        }),
      });
      const data = (await res.json()) as StartResponse;
      if (!res.ok || !data.jobId) {
        throw new Error(data.error || "Could not start generation");
      }

      setJob({
        jobId: data.jobId,
        status: asJobStatus(data.status),
        progressMessage: data.progressMessage ?? "Understanding your design...",
        draftDesignId: data.designId ?? null,
        internalDesignCuid: data.internalDesignCuid ?? null,
      });
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : "Generation failed",
        ),
      );
      setStep("request");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    if (step !== "generating" || !currentJobId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/generations/${encodeURIComponent(currentJobId)}`,
        );
        const data = (await res.json()) as PollResponse;
        if (cancelled) return;

        if (!res.ok) {
          setError(friendlyError(data.error || "Polling failed"));
          setStep(versions.length ? "review" : "request");
          return;
        }

        setJob({
          jobId: currentJobId,
          status: asJobStatus(data.status),
          progressMessage: data.progressMessage,
          draftDesignId: data.designId ?? undefined,
          internalDesignCuid: data.internalDesignCuid ?? undefined,
        });

        if (data.versions?.length) {
          setVersions(data.versions);
        }

        if (data.status === "COMPLETED") {
          if (data.versions?.length) setVersions(data.versions);
          setError(null);
          setStep("review");
          return;
        }

        if (data.status === "FAILED") {
          setError(friendlyError(data.error || "Generation failed"));
          setStep(versions.length ? "review" : "request");
          return;
        }

        timer = setTimeout(poll, 1200);
      } catch (err) {
        if (cancelled) return;
        setError(
          friendlyError(
            err instanceof Error ? err.message : "Polling failed",
          ),
        );
        setStep(versions.length ? "review" : "request");
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    hydrated,
    step,
    currentJobId,
    setJob,
    setVersions,
    setStep,
    versions.length,
  ]);

  async function handleSelectVersion(versionId: string) {
    selectVersion(versionId);
    if (!draftDesignId) return;
    try {
      await fetch("/api/designs/select-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId: draftDesignId, versionId }),
      });
    } catch (err) {
      console.error("[create] select-version", err);
    }
  }

  function handleUseDesign() {
    const estimate = estimateAiJewelryPrice(request);
    setPricing(estimate);
    setError(null);
    setStep("quotation");
  }

  async function handleFinalSubmit(data: CustomerInput) {
    if (!draftDesignId || !selectedVersionId || !pricing) {
      setError("Missing design, version, or pricing");
      return;
    }

    setBusy(true);
    setError(null);
    const normalized = normalizeCustomer(data);
    setCustomer(normalized);

    try {
      const res = await fetch("/api/designs/ai-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designId: draftDesignId,
          versionId: selectedVersionId,
          customer: normalized,
          pricing,
        }),
      });
      const payload = (await res.json()) as {
        designId?: string;
        emailWarning?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.designId) {
        throw new Error(payload.error || "Submission failed");
      }
      setSubmitted(payload.designId, Boolean(payload.emailWarning));
      router.push(
        `/submit?designId=${encodeURIComponent(payload.designId)}&ai=1`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <LoadingSpinner label="Loading studio…" />
      </main>
    );
  }

  if (step === "submitted") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-gold-deep)]">
          Submitted
        </p>
        <h1 className="font-display mt-3 text-4xl">Thank you</h1>
        <p className="mt-4 text-[var(--color-ink-muted)]">
          Your AI design draft{" "}
          <strong className="text-[var(--color-ink)]">{draftDesignId}</strong>{" "}
          is with the atelier.
        </p>
        {emailWarning ? (
          <p className="mt-3 text-sm text-amber-800">
            Email notifications are not configured — your design was still saved.
          </p>
        ) : null}
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={handleStartOver}>Create another</Button>
          <Link href="/">
            <Button variant="secondary">Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-gold-deep)]">
            AI jewelry studio
          </p>
          <h1 className="font-display mt-2 text-4xl text-[var(--color-ink)] sm:text-5xl">
            Create your jewelry
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-muted)]">
            Describe the piece you imagine. We generate an interactive 3D
            visualization and an atelier estimate for specialist review.
          </p>
        </div>
        {step !== "request" ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" onClick={handleBackToForm}>
              Back to form
            </Button>
            <Button type="button" variant="secondary" onClick={handleStartOver}>
              Start over
            </Button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p>{error}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleBackToForm}>
              Edit request
            </Button>
            <Button type="button" variant="ghost" onClick={handleStartOver}>
              Start over
            </Button>
          </div>
        </div>
      ) : null}

      {step === "request" ? (
        <div className="mx-auto max-w-xl border border-[var(--color-border)] bg-white/80 p-6">
          <JewelryRequestForm
            defaultValues={request}
            submitting={busy}
            onSubmit={(data) => startJob(data)}
          />
        </div>
      ) : null}

      {step === "generating" ? (
        <GenerationProgress
          progressMessage={progressMessage}
          designId={draftDesignId}
          onCancel={handleBackToForm}
        />
      ) : null}

      {step === "review" ? (
        <DesignReview
          versions={versions}
          selectedVersionId={selectedVersionId}
          onSelectVersion={handleSelectVersion}
          onUseDesign={handleUseDesign}
          regenerating={busy}
          onEditRequest={handleBackToForm}
          onStartOver={handleStartOver}
          onGenerateAnother={async (feedback) => {
            await startJob(request, feedback);
          }}
        />
      ) : null}

      {step === "quotation" && quotationView ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <AiQuotationView view={quotationView} />
          <div className="space-y-4 border border-[var(--color-border)] bg-white/80 p-6">
            <h2 className="font-display text-2xl">Your details</h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Share contact information so the atelier can refine materials and
              confirm manufacturing details.
            </p>
            <form
              className="space-y-4"
              onSubmit={handleSubmit(handleFinalSubmit)}
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
              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={busy}>
                  {busy ? "Submitting…" : "Submit to atelier"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("review")}
                >
                  Back to review
                </Button>
                <Button type="button" variant="ghost" onClick={handleBackToForm}>
                  Back to form
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {jobStatus === "FAILED" && step === "review" ? (
        <p className="mt-4 text-sm text-amber-800">
          The latest generation attempt failed. Use a previous version, generate
          again, or go back to the form.
        </p>
      ) : null}
    </main>
  );
}

export function CreateClient() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading studio…" />}>
      <CreateFlow />
    </Suspense>
  );
}
