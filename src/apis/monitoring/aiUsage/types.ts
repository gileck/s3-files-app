/**
 * Types for the AI usage monitoring API
 */

import { AIUsageRecord, AIUsageSummary } from '@/server/ai-usage-monitoring/types';

// Request type for getting all AI usage records
export interface GetAllAIUsageRequest {
  maxRecords?: number;
}

// Response type for getting all AI usage records
export interface GetAllAIUsageResponse {
  records: AIUsageRecord[];
  summary: AIUsageSummary;
  success: boolean;
  error?: string;
}

// Request type for getting AI usage summary
export type GetAIUsageSummaryRequest = Record<string, never>;

// Response type for getting AI usage summary
export interface GetAIUsageSummaryResponse {
  summary: AIUsageSummary;
  success: boolean;
  error?: string;
}
