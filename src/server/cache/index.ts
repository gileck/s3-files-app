import * as fsCache from './fsCache';
import * as s3Cache from './s3Cache';
import { CacheOptions, CacheParams, CacheResult, CacheStatus } from './types';
import { getCacheConfig } from './cacheConfig';

/**
 * Gets the appropriate cache implementation based on configuration
 */
const getCacheImplementation = () => {
  const { provider } = getCacheConfig();
  return provider === 's3' ? s3Cache : fsCache;
};

/**
 * Default cache options
 */
const DEFAULT_OPTIONS: CacheOptions = {
  ttl: getCacheConfig().ttl, // Use TTL from config
  bypassCache: false,
};

/**
 * Executes a function with caching
 * @param callback The function to execute and cache
 * @param params Cache parameters for generating the cache key
 * @param options Cache options
 * @returns The result of the function execution and whether it came from cache
 */
export const withCache = async <T>(
  callback: () => Promise<T>,
  params: CacheParams,
  options?: CacheOptions
): Promise<CacheResult<T>> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cache = getCacheImplementation();
  const cacheKey = cache.generateCacheKey(params);

  // If disable cache is set, skip cache lookup
  if (opts.disableCache) {
    const result = await callback();
    return { data: result, isFromCache: false };
  }
  
  // If bypass cache is set, skip cache lookup but save the result to cache
  if (opts.bypassCache) {
    const result = await callback();
    
    // Only cache successful results (no error property)
    if (!hasErrorProperty(result)) {
      const metadata = await cache.writeCache(cacheKey, result);
      return { data: result, isFromCache: false, metadata };
    }
    
    return { data: result, isFromCache: false };
  }
  
  // Try to get from cache first
  const cached = await cache.readCache<T>(cacheKey);
  
  if (cached) {
    return {
      data: cached.data,
      isFromCache: true,
      metadata: cached.metadata,
    };
  }
  
  // Execute the function and cache the result
  const result = await callback();
  
  // Only cache successful results (no error property)
  if (!hasErrorProperty(result)) {
    const metadata = await cache.writeCache(cacheKey, result);
    return {
      data: result,
      isFromCache: false,
      metadata,
    };
  }
  
  return {
    data: result,
    isFromCache: false,
  };
};

/**
 * Helper function to check if a result has an error property
 */
function hasErrorProperty(result: unknown): boolean {
  return (
    result !== null &&
    typeof result === 'object' &&
    'error' in result &&
    result.error !== undefined &&
    result.error !== null
  );
}

/**
 * Clears the cache for specific parameters
 * @param params Cache parameters for generating the cache key
 * @returns Whether the cache was successfully cleared
 */
export const clearCache = async (params: CacheParams): Promise<boolean> => {
  const cache = getCacheImplementation();
  const cacheKey = cache.generateCacheKey(params);
  return await cache.deleteCache(cacheKey);
};

/**
 * Gets the status of a cache entry
 * @param params Cache parameters for generating the cache key
 * @returns The status of the cache entry
 */
export const getCacheStatus = async (params: CacheParams): Promise<CacheStatus> => {
  const cache = getCacheImplementation();
  return await cache.getCacheStatus(params);
};

/**
 * Clears all cache entries
 * @returns Whether all cache entries were successfully cleared
 */
export const clearAllCache = async (): Promise<boolean> => {
  const cache = getCacheImplementation();
  return await cache.clearAllCache();
};

export type { CacheOptions, CacheParams, CacheResult, CacheStatus } from './types';
