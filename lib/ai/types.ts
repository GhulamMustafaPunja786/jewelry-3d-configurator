export type AiSuggestionRequest = {
  category: string;
  prompt: string;
  currentConfig?: Record<string, unknown>;
};

export type AiSuggestionResult = {
  available: boolean;
  suggestions?: string[];
  warning?: string;
};

export type AiAdapter = {
  suggest: (request: AiSuggestionRequest) => Promise<AiSuggestionResult>;
};

export const noopAiAdapter: AiAdapter = {
  async suggest(): Promise<AiSuggestionResult> {
    return {
      available: false,
      warning: "AI provider not configured.",
    };
  },
};
