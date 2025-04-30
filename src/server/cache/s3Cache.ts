import crypto from 'crypto';
import { CacheMetadata } from './types';
import { 
  uploadFile, 
  getFileAsString, 
  deleteFile, 
  listFiles
} from '@/server/s3/sdk';
import { getCacheConfig } from './cacheConfig';

/**
 * Generates a cache key from the provided parameters
 */
export const generateCacheKey = (params: { key: string; params?: Record<string, unknown> }): string => {
  const { key, params: additionalParams } = params;
  
  // Create a stable representation of the parameters
  const paramsString = additionalParams 
    ? JSON.stringify(sortObjectKeys(additionalParams))
    : '';
  
  // Generate a hash of the key and parameters
  const hash = crypto
    .createHash('md5')
    .update(`${key}:${paramsString}`)
    .digest('hex');
  
  return hash;
};

/**
 * Sorts object keys recursively to ensure consistent serialization
 */
const sortObjectKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys) as unknown as Record<string, unknown>;
  }
  
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = sortObjectKeys(obj[key] as Record<string, unknown>);
      return result;
    }, {} as Record<string, unknown>);
};

/**
 * Gets the path to a cache file in S3
 */
const getCacheFilePath = (cacheKey: string): string => {
  const { s3CachePrefix } = getCacheConfig();
  return `${s3CachePrefix}${cacheKey}.json`;
};

/**
 * Reads a cache entry from S3
 */
export const readCache = async <T>(cacheKey: string): Promise<{ data: T; metadata: CacheMetadata } | null> => {
  const filePath = getCacheFilePath(cacheKey);
  
  try {
    const fileContent = await getFileAsString(filePath);
    const { data, metadata } = JSON.parse(fileContent);
    
    // Check if the cache has expired
    if (new Date(metadata.createdAt).getTime() + 3600000 < Date.now()) {
      return null;
    }
    
    return { data, metadata };
  } catch {
    // File not found or other error
    return null;
  }
};

/**
 * Writes a cache entry to S3
 */
export const writeCache = async <T>(cacheKey: string, data: T): Promise<CacheMetadata> => {
  const filePath = getCacheFilePath(cacheKey);
  
  const now = new Date();
  
  const metadata: CacheMetadata = {
    createdAt: now.toISOString(),
    key: cacheKey,
    provider: 's3'
  };
  
  try {
    const cacheContent = JSON.stringify({ data, metadata });
    await uploadFile({
      content: cacheContent,
      fileName: filePath,
      contentType: 'application/json'
    });
    
    return metadata;
  } catch (error) {
    console.error('Failed to write cache to S3:', error);
    throw new Error('Failed to write to S3 cache');
  }
};

/**
 * Deletes a cache entry from S3
 */
export const deleteCache = async (cacheKey: string): Promise<boolean> => {
  const filePath = getCacheFilePath(cacheKey);
  
  try {
    await deleteFile(filePath);
    return true;
  } catch (error) {
    console.error('Failed to delete cache from S3:', error);
    return false;
  }
};

/**
 * Clears all cache entries from S3
 */
export const clearAllCache = async (): Promise<boolean> => {
  const { s3CachePrefix } = getCacheConfig();
  
  try {
    const files = await listFiles(s3CachePrefix);
    
    // Delete all files in the cache folder
    for (const file of files) {
      if (file.key.endsWith('.json')) {
        await deleteFile(file.key);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to clear all cache from S3:', error);
    return false;
  }
};

/**
 * Gets the status of a cache entry in S3
 */
export const getCacheStatus = async (params: { key: string; params?: Record<string, unknown> }): Promise<{ 
  exists: boolean; 
  metadata?: CacheMetadata; 
  isExpired?: boolean; 
}> => {
  const cacheKey = generateCacheKey(params);
  const filePath = getCacheFilePath(cacheKey);
  
  try {
    const fileContent = await getFileAsString(filePath);
    const { metadata } = JSON.parse(fileContent);
    const isExpired = new Date(metadata.createdAt).getTime() + 3600000 < Date.now();
    
    return {
      exists: true,
      metadata,
      isExpired,
    };
  } catch {
    // File not found or other error
    return { exists: false };
  }
};
