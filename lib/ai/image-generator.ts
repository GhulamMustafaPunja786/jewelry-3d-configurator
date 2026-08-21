import type {
  ImageGenerationInput,
  ImageGenerationResult,
  JewelryImageGenerator,
} from "@/lib/ai/types";

/**
 * Local UI / CI stub — does not call paid APIs.
 * Returns a placeholder concept image path for pipeline wiring.
 */
export class MockImageGenerator implements JewelryImageGenerator {
  readonly id = "mock-image";

  async generateJewelryConcept(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult> {
    if (!input.prompt.trim()) {
      return {
        available: false,
        provider: this.id,
        warning: "Prompt is required for concept generation.",
      };
    }

    // Deterministic placeholder for development (not a real AI render)
    const placeholder = `/images/ai-placeholders/${input.jewelryType}-concept.svg`;

    return {
      available: true,
      imageUrl: placeholder,
      provider: this.id,
      warning:
        "MockImageGenerator: placeholder concept only. Connect a local open-source image model for real concepts.",
    };
  }
}

export function createImageGenerator(
  provider = process.env.IMAGE_PROVIDER || "mock",
): JewelryImageGenerator {
  switch (provider.toLowerCase()) {
    case "mock":
    default:
      return new MockImageGenerator();
  }
}

export async function generateJewelryConcept(
  input: ImageGenerationInput,
): Promise<ImageGenerationResult> {
  return createImageGenerator().generateJewelryConcept(input);
}
