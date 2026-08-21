import { createAI3DProvider } from "@/lib/ai/adapter";
import { generateJewelryConcept } from "@/lib/ai/image-generator";
import { buildJewelryPrompt } from "@/lib/ai/prompt-builder";
import type {
  GenerationJobStatus,
  JewelryGenerationRequest,
} from "@/lib/ai/types";
import { generateDesignId } from "@/lib/design-id";
import { prisma } from "@/lib/database/prisma";

export type StartGenerationInput = {
  request: JewelryGenerationRequest;
  designId?: string;
  feedback?: string;
};

export type GenerationJobView = {
  id: string;
  designId: string | null;
  internalDesignCuid: string | null;
  status: GenerationJobStatus;
  progressMessage: string | null;
  error: string | null;
  modelUrl: string | null;
  previewUrl: string | null;
  provider: string;
  version?: {
    id: string;
    versionNumber: number;
    modelUrl: string | null;
    previewUrl: string | null;
    prompt: string;
    selected: boolean;
  };
};

function asJobStatus(value: string): GenerationJobStatus {
  if (
    value === "QUEUED" ||
    value === "PROCESSING" ||
    value === "COMPLETED" ||
    value === "FAILED"
  ) {
    return value;
  }
  return "FAILED";
}

function toJobView(
  job: {
    id: string;
    designId: string | null;
    status: string;
    progressMessage: string | null;
    error: string | null;
    modelUrl: string | null;
    previewUrl: string | null;
    provider: string;
    design?: { designId: string } | null;
  },
  version?: GenerationJobView["version"],
): GenerationJobView {
  return {
    id: job.id,
    designId: job.design?.designId ?? null,
    internalDesignCuid: job.designId,
    status: asJobStatus(job.status),
    progressMessage: job.progressMessage,
    error: job.error,
    modelUrl: job.modelUrl,
    previewUrl: job.previewUrl,
    provider: job.provider,
    version,
  };
}

/**
 * Starts an AI jewelry generation job.
 * Creates a provisional Design (public JWL- id) on first start so versions attach.
 */
export async function startGeneration(
  input: StartGenerationInput,
): Promise<GenerationJobView> {
  const { request, feedback } = input;
  const provider = createAI3DProvider();
  const built = buildJewelryPrompt(request);

  const prompt = feedback?.trim()
    ? `${built.prompt}. Customer feedback for revision: ${feedback.trim()}`
    : built.prompt;

  const concept = await generateJewelryConcept({
    prompt,
    negativePrompt: built.negativePrompt,
    jewelryType: request.jewelryType,
    referenceImageUrl: request.referenceImageUrl,
  });

  let design =
    input.designId != null
      ? await prisma.design.findFirst({
          where: {
            OR: [{ designId: input.designId }, { id: input.designId }],
          },
        })
      : null;

  if (!design) {
    const publicId = await generateDesignId();
    design = await prisma.design.create({
      data: {
        designId: publicId,
        status: "DRAFT",
        jewelryType: request.jewelryType,
        configurationJson: "{}",
        requestJson: JSON.stringify(request),
        aiPrompt: prompt,
      },
    });
  } else {
    design = await prisma.design.update({
      where: { id: design.id },
      data: {
        jewelryType: request.jewelryType,
        requestJson: JSON.stringify(request),
        aiPrompt: prompt,
        status: design.status === "NEW" ? "NEW" : "DRAFT",
      },
    });
  }

  const job = await prisma.generationJob.create({
    data: {
      designId: design.id,
      status: "QUEUED",
      provider: provider.id,
      prompt,
      negativePrompt: built.negativePrompt,
      jewelryType: request.jewelryType,
      requestJson: JSON.stringify(request),
      referenceImageUrl: request.referenceImageUrl ?? null,
      conceptImageUrl: concept.imageUrl ?? null,
      progressMessage: "Understanding your design...",
    },
    include: { design: { select: { designId: true } } },
  });

  const providerInput = {
    prompt,
    negativePrompt: built.negativePrompt,
    jewelryType: request.jewelryType,
    conceptImageUrl: concept.imageUrl ?? null,
    referenceImageUrl: request.referenceImageUrl ?? null,
    clientJobId: job.id,
  };

  const ref =
    concept.imageUrl || request.referenceImageUrl
      ? await provider.generateFromImage(providerInput)
      : await provider.generateFromText(providerInput);

  const updated = await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      providerJobId: ref.jobId,
      status: ref.status,
      progressMessage:
        ref.status === "FAILED"
          ? "Generation could not be started."
          : "Understanding your design...",
      error: ref.status === "FAILED" ? "Provider rejected the job." : null,
    },
    include: { design: { select: { designId: true } } },
  });

  return toJobView(updated);
}

/**
 * Polls the AI provider and syncs GenerationJob + DesignVersion on completion.
 */
export async function pollAndSyncJob(
  jobDbId: string,
): Promise<GenerationJobView> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobDbId },
    include: { design: { select: { designId: true, id: true } } },
  });

  if (!job) {
    throw new Error("Generation job not found");
  }

  if (job.status === "COMPLETED" || job.status === "FAILED") {
    const existingVersion = job.designId
      ? await prisma.designVersion.findFirst({
          where: { jobId: job.id },
        })
      : null;

    return toJobView(
      job,
      existingVersion
        ? {
            id: existingVersion.id,
            versionNumber: existingVersion.versionNumber,
            modelUrl: existingVersion.modelUrl,
            previewUrl: existingVersion.imageUrl,
            prompt: existingVersion.prompt,
            selected: existingVersion.selected,
          }
        : undefined,
    );
  }

  const provider = createAI3DProvider();
  const providerJobId = job.providerJobId ?? job.id;
  const status = await provider.getJobStatus(providerJobId);

  if (status.status === "FAILED") {
    const failed = await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        progressMessage: status.progressMessage ?? "Generation failed",
        error: status.error ?? "Generation failed",
        completedAt: new Date(),
      },
      include: { design: { select: { designId: true } } },
    });
    return toJobView(failed);
  }

  if (status.status !== "COMPLETED") {
    const mid = await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: status.status,
        progressMessage:
          status.progressMessage ??
          (status.status === "PROCESSING"
            ? "Building your 3D model..."
            : "Understanding your design..."),
      },
      include: { design: { select: { designId: true } } },
    });
    return toJobView(mid);
  }

  const result = await provider.getResult(providerJobId);
  if (!result?.modelUrl) {
    const waiting = await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "PROCESSING",
        progressMessage: "Preparing your interactive preview...",
      },
      include: { design: { select: { designId: true } } },
    });
    return toJobView(waiting);
  }

  const completed = await prisma.generationJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      modelUrl: result.modelUrl,
      previewUrl: result.previewImageUrl ?? job.conceptImageUrl,
      progressMessage: "Preparing your interactive preview...",
      completedAt: new Date(),
      error: null,
    },
    include: { design: { select: { designId: true, id: true } } },
  });

  let versionView: GenerationJobView["version"];

  if (completed.designId) {
    const versionCount = await prisma.designVersion.count({
      where: { designId: completed.designId },
    });
    const versionNumber = versionCount + 1;

    await prisma.designVersion.updateMany({
      where: { designId: completed.designId, selected: true },
      data: { selected: false },
    });

    const version = await prisma.designVersion.create({
      data: {
        designId: completed.designId,
        versionNumber,
        prompt: completed.prompt,
        imageUrl: completed.previewUrl,
        modelUrl: completed.modelUrl,
        provider: completed.provider,
        selected: true,
        jobId: completed.id,
      },
    });

    await prisma.design.update({
      where: { id: completed.designId },
      data: {
        modelUrl: completed.modelUrl,
        previewPath: completed.previewUrl,
        selectedVersionId: version.id,
        status: "DRAFT",
      },
    });

    versionView = {
      id: version.id,
      versionNumber: version.versionNumber,
      modelUrl: version.modelUrl,
      previewUrl: version.imageUrl,
      prompt: version.prompt,
      selected: version.selected,
    };
  }

  return toJobView(completed, versionView);
}

export async function selectDesignVersion(input: {
  designId: string;
  versionId: string;
}): Promise<{ designId: string; versionId: string }> {
  const design = await prisma.design.findFirst({
    where: {
      OR: [{ designId: input.designId }, { id: input.designId }],
    },
  });

  if (!design) {
    throw new Error("Design not found");
  }

  const version = await prisma.designVersion.findFirst({
    where: { id: input.versionId, designId: design.id },
  });

  if (!version) {
    throw new Error("Version not found for this design");
  }

  await prisma.$transaction([
    prisma.designVersion.updateMany({
      where: { designId: design.id, selected: true },
      data: { selected: false },
    }),
    prisma.designVersion.update({
      where: { id: version.id },
      data: { selected: true },
    }),
    prisma.design.update({
      where: { id: design.id },
      data: {
        selectedVersionId: version.id,
        modelUrl: version.modelUrl,
        previewPath: version.imageUrl,
      },
    }),
  ]);

  return { designId: design.designId, versionId: version.id };
}
