import { adapterFactory } from '../adapters/index.js';
import { CONFIG } from '../config/index.js';

/**
 * Health Monitor Service
 * Periodically checks LLM provider health and performs automatic failover
 * when the active provider becomes unavailable.
 *
 * Follows the Service pattern established by RequestQueue and ResponseCache.
 *
 * Features:
 * - Heartbeat pings at configurable intervals
 * - Automatic fallback to secondary provider on failure
 * - Recovery detection and switch-back to primary provider
 * - Health metrics tracking (uptime, downtime, failover count)
 */
export class HealthMonitor {
  constructor(config = CONFIG) {
    this.config = config;
    this.intervalMs = parseInt(config.HEALTH_CHECK_INTERVAL_MS) || 30000;
    this.failureThreshold = parseInt(config.HEALTH_FAILURE_THRESHOLD) || 3;
    this.recoveryThreshold = parseInt(config.HEALTH_RECOVERY_THRESHOLD) || 2;
    this.enabled = config.HEALTH_MONITOR_ENABLED !== false;

    // Provider state
    this.primaryProvider = config.LLM_PROVIDER || 'ollama';
    this.fallbackOrder = this._buildFallbackOrder();
    this.activeProvider = this.primaryProvider;

    // Health tracking per provider
    this.providerHealth = new Map();
    this._initProviderHealth(this.primaryProvider);

    // Interval handle
    this._intervalHandle = null;

    // Callbacks
    this._onFailover = null;

    // Metrics
    this.metrics = {
      checksPerformed: 0,
      checksFailed: 0,
      failovers: 0,
      recoveries: 0,
      lastCheckAt: null,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Build the fallback order from available adapters, excluding the primary.
   */
  _buildFallbackOrder() {
    const available = adapterFactory.getAvailableAdapters();
    return available.filter(name => name !== this.primaryProvider);
  }

  /**
   * Initialize health state for a provider.
   */
  _initProviderHealth(provider) {
    if (!this.providerHealth.has(provider)) {
      this.providerHealth.set(provider, {
        status: 'unknown', // 'healthy', 'degraded', 'down', 'unknown'
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheckAt: null,
        lastHealthyAt: null,
        lastError: null,
      });
    }
  }

  /**
   * Set the failover callback. Called with (newProvider, oldProvider) on switch.
   */
  onFailover(callback) {
    this._onFailover = callback;
  }

  /**
   * Perform a single health check for a given provider.
   * Tries getAvailableModels() as a lightweight ping.
   */
  async _checkProvider(providerName) {
    this._initProviderHealth(providerName);
    const health = this.providerHealth.get(providerName);

    try {
      const adapter = adapterFactory.createAdapter(providerName, this.config);
      await adapter.getAvailableModels();

      health.consecutiveSuccesses++;
      health.consecutiveFailures = 0;
      health.lastHealthyAt = new Date().toISOString();
      health.lastError = null;

      if (health.consecutiveSuccesses >= this.recoveryThreshold || health.status === 'unknown') {
        health.status = 'healthy';
      }

      return true;
    } catch (error) {
      health.consecutiveFailures++;
      health.consecutiveSuccesses = 0;
      health.lastError = error.message;

      if (health.consecutiveFailures >= this.failureThreshold) {
        health.status = 'down';
      } else {
        health.status = 'degraded';
      }

      return false;
    } finally {
      health.lastCheckAt = new Date().toISOString();
    }
  }

  /**
   * Run a health check cycle: check active provider, failover if needed,
   * and attempt recovery of the primary provider.
   */
  async check() {
    if (!this.enabled) return;

    this.metrics.checksPerformed++;
    this.metrics.lastCheckAt = new Date().toISOString();

    const isHealthy = await this._checkProvider(this.activeProvider);

    if (!isHealthy) {
      this.metrics.checksFailed++;
      const activeHealth = this.providerHealth.get(this.activeProvider);

      // Trigger failover if threshold reached
      if (activeHealth.status === 'down') {
        await this._failover();
      }
    }

    // If we're on a fallback, periodically check if primary has recovered
    if (this.activeProvider !== this.primaryProvider) {
      const primaryRecovered = await this._checkProvider(this.primaryProvider);
      const primaryHealth = this.providerHealth.get(this.primaryProvider);

      if (primaryRecovered && primaryHealth.status === 'healthy') {
        this._switchTo(this.primaryProvider, 'recovery');
      }
    }
  }

  /**
   * Attempt failover to the next healthy provider in fallback order.
   */
  async _failover() {
    for (const candidate of this.fallbackOrder) {
      if (candidate === this.activeProvider) continue;

      const isHealthy = await this._checkProvider(candidate);
      if (isHealthy) {
        this._switchTo(candidate, 'failover');
        return;
      }
    }
    // No healthy fallback found - stay on current (degraded)
  }

  /**
   * Switch to a new provider and emit the failover callback.
   */
  _switchTo(newProvider, reason) {
    const oldProvider = this.activeProvider;
    if (newProvider === oldProvider) return;

    this.activeProvider = newProvider;

    if (reason === 'failover') {
      this.metrics.failovers++;
    } else if (reason === 'recovery') {
      this.metrics.recoveries++;
    }

    if (this._onFailover) {
      this._onFailover(newProvider, oldProvider, reason);
    }
  }

  /**
   * Start periodic health checks.
   */
  start() {
    if (!this.enabled || this._intervalHandle) return;

    // Run initial check asynchronously
    this.check().catch(() => {});

    this._intervalHandle = setInterval(() => {
      this.check().catch(() => {});
    }, this.intervalMs);

    // Unref so it doesn't prevent process exit
    if (this._intervalHandle.unref) {
      this._intervalHandle.unref();
    }
  }

  /**
   * Stop periodic health checks.
   */
  stop() {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = null;
    }
  }

  /**
   * Get current health status snapshot.
   */
  getStatus() {
    const providers = {};
    for (const [name, health] of this.providerHealth) {
      providers[name] = { ...health };
    }

    return {
      activeProvider: this.activeProvider,
      primaryProvider: this.primaryProvider,
      isOnPrimary: this.activeProvider === this.primaryProvider,
      providers,
    };
  }

  /**
   * Get health metrics snapshot.
   */
  getMetrics() {
    return {
      ...this.metrics,
      enabled: this.enabled,
      intervalMs: this.intervalMs,
      failureThreshold: this.failureThreshold,
      recoveryThreshold: this.recoveryThreshold,
      activeProvider: this.activeProvider,
      primaryProvider: this.primaryProvider,
      isOnPrimary: this.activeProvider === this.primaryProvider,
      uptime: this._getUptime(),
    };
  }

  _getUptime() {
    const started = new Date(this.metrics.startedAt);
    const diffMs = Date.now() - started.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
