import { clearAllCache } from '@/server/cache';
import { ClearCacheResponse } from './types';
export { name } from './index'
/**
 * Clear all cache entries
 * This function contains the core business logic for the clear cache API
 */
export const process = async (): Promise<ClearCacheResponse> => {
  try {
    const success = await clearAllCache();
    
    return {
      success,
      message: success ? 'Cache cleared successfully' : 'Failed to clear cache'
    };
  } catch (error) {
    console.error('Error clearing cache:', error);
    
    return {
      success: false,
      message: `Error clearing cache: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
