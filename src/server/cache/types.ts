/**
 * Types for the caching system
 */

export interface CacheOptions {
  /** Time-to-live in milliseconds. Default: 1 hour */
  ttl?: number;
  /** Whether to bypass cache and force a fresh execution. Default: false */
  bypassCache?: boolean;
  /** Whether to disable cache and force a fresh execution, and not save the result to cache. Default: false */
  disableCache?: boolean
}

export interface CacheMetadata {
  /** When the cache entry was created */
  createdAt: string;
  /** The cache key used to store this entry */
  key: string;
  /** The cache provider used (fs or s3) */
  provider: 'fs' | 's3';
}

export interface CacheResult<T> { 
  /** The result of the cached function */
  data: T;
  /** Whether the result was retrieved from cache */
  isFromCache: boolean;
  /** Metadata about the cache entry */
  metadata?: CacheMetadata;
}

export interface CacheStatus {
  /** Whether the cache entry exists */
  exists: boolean;
  /** Metadata about the cache entry if it exists */
  metadata?: CacheMetadata;
  /** Whether the cache entry has expired */
  isExpired?: boolean;
} // Added closing bracket here

export interface CacheParams {
  /** Unique identifier for the cache entry */
  key: string;
  /** Additional parameters to include in the cache key */
  params?: Record<string, unknown>;
}
