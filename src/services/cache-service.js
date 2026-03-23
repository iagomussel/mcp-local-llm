import { createHash } from 'crypto';

/**
 * CacheService
 * In-memory result cache with TTL support for expensive operations.
 * Follows the singleton pattern via CacheServiceSingleton.
 */
export class CacheService {
  constructor(options = {}) {
    this.maxEntries = options.maxEntries || 200;
    this.defaultTTL = options.defaultTTL || 300_000; // 5 minutes
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Generate a deterministic cache key from tool name + arguments
   */
  generateKey(toolName, args) {
    const payload = JSON.stringify({ tool: toolName, args });
    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Get a cached result if it exists and hasn't expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  /**
   * Store a result in the cache with TTL
   */
  set(key, value, ttl = this.defaultTTL) {
    if (this.cache.size >= this.maxEntries) {
      this._evictOldest();
    }

    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key) {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries for a specific tool
   */
  invalidateByTool(toolName) {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.toolName === toolName) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear the entire cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let activeEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        activeEntries++;
      }
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0.0';

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: `${hitRate}%`,
      totalEntries: this.cache.size,
      activeEntries,
      expiredEntries,
      maxEntries: this.maxEntries,
      defaultTTL: this.defaultTTL,
    };
  }

  /**
   * Evict the oldest (least recently accessed) entry
   */
  _evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }
}
