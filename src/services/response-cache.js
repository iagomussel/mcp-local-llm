import { createHash } from 'crypto';
import { CONFIG } from '../config/index.js';

/**
 * Response Cache Service
 * LRU cache for LLM responses with configurable TTL and max size.
 * Reduces redundant LLM calls by caching content-hash based results.
 *
 * Follows the Service pattern established by RequestQueue and ModelSelector.
 */
export class ResponseCache {
  constructor(config = CONFIG) {
    this.config = config;
    this.enabled = config.CACHE_ENABLED !== false;
    this.ttlMs = parseInt(config.CACHE_TTL_MS) || 300000; // 5 minutes default
    this.maxSize = parseInt(config.CACHE_MAX_SIZE) || 100;

    // LRU ordered map: oldest entries at the beginning
    this.cache = new Map();

    // Metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate a content-hash key from payload.
   * Uses SHA-256 for collision resistance with compact output.
   */
  _makeKey(payload) {
    const { model, messages, temperature, max_tokens } = payload;
    const raw = JSON.stringify({ model, messages, temperature, max_tokens });
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Look up a cached response.
   * Returns the cached result or null if not found/expired.
   */
  get(payload) {
    if (!this.enabled) return null;

    const key = this._makeKey(payload);
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check TTL expiration
    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      this.metrics.expirations++;
      this.metrics.misses++;
      return null;
    }

    // Move to end (most recently used) for LRU ordering
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.metrics.hits++;
    return entry.response;
  }

  /**
   * Store a response in the cache.
   * Evicts the oldest entry if the cache is at capacity.
   */
  set(payload, response) {
    if (!this.enabled) return;

    const key = this._makeKey(payload);

    // If key already exists, delete first to refresh LRU position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }

    this.cache.set(key, {
      response,
      createdAt: Date.now(),
    });
    this.metrics.sets++;
  }

  /**
   * Clear all cached entries.
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  /**
   * Get cache metrics snapshot.
   */
  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? Math.round((this.metrics.hits / total) * 10000) / 100 : 0;

    return {
      ...this.metrics,
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      enabled: this.enabled,
      hitRatePercent: hitRate,
    };
  }

  /**
   * Reset metrics counters.
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0,
      startedAt: new Date().toISOString(),
    };
  }
}
