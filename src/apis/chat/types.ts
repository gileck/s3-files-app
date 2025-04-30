// Shared types between client and server for the chat API

export type ChatRequest = {
  modelId: string;
  text: string;
};

export type ChatResponse = {
  result: string;
  cost: {
    totalCost: number;
  };
  error?: string;
};
