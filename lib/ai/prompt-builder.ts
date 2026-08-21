import type {
  BuiltJewelryPrompt,
  JewelryGenerationRequest,
  JewelryMetalPreference,
  JewelryStonePreference,
  JewelryStyleOption,
} from "@/lib/ai/types";

const STYLE_PHRASES: Record<JewelryStyleOption, string> = {
  classic: "classic fine jewelry aesthetic",
  luxury: "luxury high-end fine jewelry",
  minimal: "minimal clean contemporary jewelry",
  modern: "modern contemporary jewelry design",
  vintage: "vintage inspired fine jewelry",
  royal: "royal opulent jewelry design",
  custom: "bespoke custom jewelry design",
};

const METAL_PHRASES: Record<JewelryMetalPreference, string> = {
  yellow_gold: "18K yellow gold",
  white_gold: "18K white gold",
  rose_gold: "18K rose gold",
  platinum: "platinum",
  silver: "sterling silver",
  any: "precious metal",
};

const STONE_PHRASES: Record<JewelryStonePreference, string> = {
  diamond: "diamond gemstone",
  ruby: "ruby gemstone",
  sapphire: "sapphire gemstone",
  emerald: "emerald gemstone",
  any: "fine gemstone",
};

const TYPE_PHRASES: Record<JewelryGenerationRequest["jewelryType"], string> = {
  ring: "fine jewelry ring",
  necklace: "fine jewelry necklace",
  chain: "fine jewelry chain",
  pendant: "fine jewelry pendant",
  bracelet: "fine jewelry bracelet",
  earrings: "fine jewelry earrings",
};

/**
 * Builds an internal generation prompt from the simple customer request.
 * Not shown to customers in full — used by image / 3D stages.
 */
export function buildJewelryPrompt(
  request: JewelryGenerationRequest,
): BuiltJewelryPrompt {
  const typePhrase = TYPE_PHRASES[request.jewelryType];
  const stylePhrase = request.style
    ? STYLE_PHRASES[request.style]
    : "premium fine jewelry";
  const metalPhrase = request.metal
    ? METAL_PHRASES[request.metal]
    : "precious metal";
  const stonePhrase = request.stone
    ? STONE_PHRASES[request.stone]
    : undefined;

  const parts = [
    `Luxury ${typePhrase}`,
    stylePhrase,
    metalPhrase,
    stonePhrase,
    request.description.trim(),
    request.additionalRequirements?.trim(),
    "realistic jewelry proportions",
    "clean symmetrical geometry",
    "premium jewelry product photography appearance",
    "physically plausible gemstone",
    "isolated object",
    "centered composition",
    "studio lighting",
    "no hands",
    "no human body",
    "no text",
    "no logo",
    "no watermark",
  ].filter(Boolean);

  const prompt = parts.join(", ");

  const negativePrompt = [
    "hands",
    "fingers",
    "human",
    "body",
    "face",
    "text",
    "logo",
    "watermark",
    "blurry",
    "low quality",
    "cartoon",
    "plastic toy",
    "deformed gemstone",
    "extra limbs",
  ].join(", ");

  return {
    prompt,
    negativePrompt,
    jewelryType: request.jewelryType,
    metadata: {
      jewelryType: request.jewelryType,
      style: request.style ?? "unspecified",
      metal: request.metal ?? "any",
      stone: request.stone ?? "any",
      budget: request.budget ?? "unspecified",
    },
  };
}
