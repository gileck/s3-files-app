/**
 * Cost estimate for an AI model operation
 */
export interface AIModelCostEstimate {
  totalCost: number;
}

/**
 * Base response with usage and cost information
 */
export interface AIModelBaseResponse {
  cost: {
    totalCost: number;
  };
}

export type Usage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type AIModelResponse<T> = {
  result: T;
  usage: Usage
} 


export type AIModelAdapterResponse<T> = AIModelResponse<T> & AIModelBaseResponse;
/**
 * AI model adapter interface
 * Defines the contract for all AI model adapters
 */
export interface AIModel {
  processPromptToText: (
    prompt: string,
    modelId: string,
  ) => Promise<AIModelResponse<string>>;
  processPromptToJSON: <T>(
    prompt: string,
    modelId: string,
  ) => Promise<AIModelResponse<T>>;
}

export interface AIModelBaseAdapter {
  estimateCost: (
    prompt: string,
    expectedOutputTokens?: number
  ) => AIModelCostEstimate

  processPromptToText: (
    prompt: string,
    modelId: string,
  ) => Promise<AIModelAdapterResponse<string>>;
  processPromptToJSON: <T>(
    prompt: string,
    modelId: string,
  ) => Promise<AIModelAdapterResponse<T>>;

}
  


