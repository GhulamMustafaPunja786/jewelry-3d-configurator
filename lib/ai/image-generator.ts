import type {
  ImageGenerationInput,
  ImageGenerationResult,
  JewelryImageGenerator,
} from "@/lib/ai/types";

/**
 * Local placeholder concepts (no paid API).
 * Diamond ring requests get a solitaire illustration.
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

    const prompt = input.prompt.toLowerCase();
    const wantsDiamond =
      input.jewelryType === "ring" &&
      (prompt.includes("diamond") ||
        prompt.includes("engagement") ||
        prompt.includes("oval") ||
        prompt.includes("brilliant") ||
        (!prompt.includes("ruby") &&
          !prompt.includes("sapphire") &&
          !prompt.includes("emerald")));

    const placeholder = wantsDiamond
      ? "/images/ai-placeholders/ring-diamond-concept.svg"
      : `/images/ai-placeholders/${input.jewelryType}-concept.svg`;

    return {
      available: true,
      imageUrl: placeholder,
      provider: this.id,
      warning:
        "Concept preview is an illustration. Connect Freepik (FREEPIK_API_KEY) or a local image model for photoreal concepts.",
    };
  }
}

/**
 * Optional Freepik stock search — uses YOUR key from env only.
 * Docs: https://docs.freepik.com/
 * Set FREEPIK_API_KEY in Vercel / .env yourself (never commit it).
 */
export class FreepikImageGenerator implements JewelryImageGenerator {
  readonly id = "freepik";

  async generateJewelryConcept(
    input: ImageGenerationInput,
  ): Promise<ImageGenerationResult> {
    const apiKey = process.env.FREEPIK_API_KEY?.trim();
    if (!apiKey) {
      return new MockImageGenerator().generateJewelryConcept(input);
    }

    const query = [
      input.jewelryType,
      "jewelry",
      "product photo",
      input.prompt.slice(0, 80),
    ]
      .filter(Boolean)
      .join(" ");

    try {
      const url = new URL("https://api.freepik.com/v1/resources");
      url.searchParams.set("locale", "en-US");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "1");
      url.searchParams.set("term", query);
      url.searchParams.set("order", "relevance");

      const res = await fetch(url.toString(), {
        headers: {
          "x-freepik-api-key": apiKey,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        console.error("[freepik]", res.status, await res.text());
        return {
          ...(await new MockImageGenerator().generateJewelryConcept(input)),
          warning: `Freepik API returned ${res.status}; using local concept fallback.`,
        };
      }

      const data = (await res.json()) as {
        data?: Array<{
          image?: { source?: { url?: string } };
          thumbnails?: Array<{ url?: string }>;
        }>;
      };

      const first = data.data?.[0];
      const imageUrl =
        first?.image?.source?.url ||
        first?.thumbnails?.[0]?.url ||
        undefined;

      if (!imageUrl) {
        return new MockImageGenerator().generateJewelryConcept(input);
      }

      return {
        available: true,
        imageUrl,
        provider: this.id,
        warning:
          "Concept image from Freepik stock (reference). Respect Freepik license terms for commercial use.",
      };
    } catch (error) {
      console.error("[freepik]", error);
      return {
        ...(await new MockImageGenerator().generateJewelryConcept(input)),
        warning: "Freepik unavailable; using local concept fallback.",
      };
    }
  }
}

export function createImageGenerator(
  provider = process.env.IMAGE_PROVIDER || "mock",
): JewelryImageGenerator {
  switch (provider.toLowerCase()) {
    case "freepik":
      return new FreepikImageGenerator();
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
