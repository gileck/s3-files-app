/**
 * Server implementation for the AI usage monitoring API
 */

import { 
  getAllAIUsageRecords, 
  getAIUsageSummary 
} from '@/server/ai-usage-monitoring';
import { 
  GetAllAIUsageRequest, 
  GetAllAIUsageResponse, 
  GetAIUsageSummaryRequest, 
  GetAIUsageSummaryResponse 
} from './types';

// Export the API name
export const all = "monitoring/ai-usage/all";
export const summary = "monitoring/ai-usage/summary";

/**
 * Get all AI usage records with summary
 */
export const getAllUsage = async (
  params: GetAllAIUsageRequest
): Promise<GetAllAIUsageResponse> => {
  try {
    const records = await getAllAIUsageRecords({
      maxRecords: params.maxRecords
    });
    
    const summary = await getAIUsageSummary();
    
    return {
      records,
      summary,
      success: true
    };
  } catch (error) {
    console.error('Error getting AI usage records:', error);
    return {
      records: [],
      summary: {
        totalCost: 0,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        usageByModel: {},
        usageByDay: {}
      },
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Get AI usage summary
 */
export const getSummary = async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params: GetAIUsageSummaryRequest
): Promise<GetAIUsageSummaryResponse> => {
  try {
    const summary = await getAIUsageSummary();
    
    return {
      summary,
      success: true
    };
  } catch (error) {
    console.error('Error getting AI usage summary:', error);
    return {
      summary: {
        totalCost: 0,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        usageByModel: {},
        usageByDay: {}
      },
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
