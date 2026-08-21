import type { AI3DProvider } from "@/lib/ai/types";
import { Hunyuan3DProvider } from "@/lib/ai/providers/hunyuan-3d";
import { Mock3DProvider } from "@/lib/ai/providers/mock-3d";

/**
 * Selects the 3D generation provider from AI3D_PROVIDER.
 * Default: mock (safe for UI without GPU / without ai-service).
 */
export function createAI3DProvider(
  provider = process.env.AI3D_PROVIDER || "mock",
): AI3DProvider {
  switch (provider.toLowerCase()) {
    case "hunyuan":
    case "hunyuan3d":
      return new Hunyuan3DProvider();
    case "mock":
    default:
      return new Mock3DProvider();
  }
}

export function getAI3DProviderInfo(): {
  id: string;
  displayName: string;
  apiUrl: string | null;
} {
  const provider = createAI3DProvider();
  return {
    id: provider.id,
    displayName: provider.displayName,
    apiUrl: process.env.AI3D_API_URL || null,
  };
}
