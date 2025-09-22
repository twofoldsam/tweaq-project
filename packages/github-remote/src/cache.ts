import { CacheEntry, CacheOptions } from './types.js';

export class ResponseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize ?? 1000; // 1000 entries default
  }

  /**
   * Generate a cache key from request parameters
   */
  private generateKey(method: string, url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${method}:${url}:${paramStr}`;
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < this.ttl;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Ensure cache doesn't exceed max size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxSize) return;

    // Remove oldest entries first
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = this.cache.size - this.maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Get cached response if available and valid
   */
  get<T>(method: string, url: string, params?: any): CacheEntry<T> | null {
    const key = this.generateKey(method, url, params);
    const entry = this.cache.get(key);
    
    if (!entry || !this.isValid(entry)) {
      if (entry) this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Store response in cache with ETag and Last-Modified headers
   */
  set<T>(
    method: string,
    url: string,
    data: T,
    headers: Record<string, any> = {},
    params?: any
  ): void {
    this.cleanup();
    this.enforceMaxSize();

    const key = this.generateKey(method, url, params);
    const entry: CacheEntry<T> = {
      data,
      etag: headers.etag,
      lastModified: headers['last-modified'],
      timestamp: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * Get conditional headers for request (If-None-Match, If-Modified-Since)
   */
  getConditionalHeaders(method: string, url: string, params?: any): Record<string, string> {
    const entry = this.get(method, url, params);
    if (!entry) return {};

    const headers: Record<string, string> = {};
    if (entry.etag) {
      headers['If-None-Match'] = entry.etag;
    }
    if (entry.lastModified) {
      headers['If-Modified-Since'] = entry.lastModified;
    }

    return headers;
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    this.cleanup();
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
    };
  }
}
