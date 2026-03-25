/**
 * Unit tests for HealthMonitor
 */

import { test, mock } from 'node:test';
import assert from 'node:assert';
import { HealthMonitor } from '../../src/services/health-monitor.js';

const baseConfig = {
  LLM_PROVIDER: 'ollama',
  HEALTH_MONITOR_ENABLED: true,
  HEALTH_CHECK_INTERVAL_MS: 60000,
  HEALTH_FAILURE_THRESHOLD: 3,
  HEALTH_RECOVERY_THRESHOLD: 2,
  OLLAMA_URL: 'http://localhost:11434',
};

test('HealthMonitor should initialize with defaults', () => {
  const monitor = new HealthMonitor({});
  assert.ok(monitor);
  assert.strictEqual(monitor.enabled, true);
  assert.strictEqual(monitor.intervalMs, 30000);
  assert.strictEqual(monitor.failureThreshold, 3);
  assert.strictEqual(monitor.recoveryThreshold, 2);
  assert.strictEqual(monitor.primaryProvider, 'ollama');
  assert.strictEqual(monitor.activeProvider, 'ollama');
});

test('HealthMonitor should respect HEALTH_MONITOR_ENABLED=false', async () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_MONITOR_ENABLED: false });
  assert.strictEqual(monitor.enabled, false);

  // check() should be a no-op when disabled
  await monitor.check();
  assert.strictEqual(monitor.metrics.checksPerformed, 0);
});

test('HealthMonitor should use configured provider as primary', () => {
  const monitor = new HealthMonitor({ ...baseConfig, LLM_PROVIDER: 'openai' });
  assert.strictEqual(monitor.primaryProvider, 'openai');
  assert.strictEqual(monitor.activeProvider, 'openai');
});

test('HealthMonitor should build fallback order excluding primary', () => {
  const monitor = new HealthMonitor({ ...baseConfig, LLM_PROVIDER: 'ollama' });
  assert.ok(!monitor.fallbackOrder.includes('ollama'));
  assert.ok(monitor.fallbackOrder.length > 0);
});

test('HealthMonitor getStatus should return expected shape', () => {
  const monitor = new HealthMonitor(baseConfig);
  const status = monitor.getStatus();

  assert.strictEqual(status.activeProvider, 'ollama');
  assert.strictEqual(status.primaryProvider, 'ollama');
  assert.strictEqual(status.isOnPrimary, true);
  assert.strictEqual(typeof status.providers, 'object');
});

test('HealthMonitor getMetrics should return expected shape', () => {
  const monitor = new HealthMonitor(baseConfig);
  const metrics = monitor.getMetrics();

  assert.strictEqual(typeof metrics.checksPerformed, 'number');
  assert.strictEqual(typeof metrics.checksFailed, 'number');
  assert.strictEqual(typeof metrics.failovers, 'number');
  assert.strictEqual(typeof metrics.recoveries, 'number');
  assert.strictEqual(typeof metrics.enabled, 'boolean');
  assert.strictEqual(typeof metrics.intervalMs, 'number');
  assert.strictEqual(typeof metrics.uptime, 'string');
  assert.strictEqual(metrics.activeProvider, 'ollama');
  assert.strictEqual(metrics.primaryProvider, 'ollama');
  assert.strictEqual(metrics.isOnPrimary, true);
});

test('HealthMonitor _checkProvider should mark healthy on success', async () => {
  const monitor = new HealthMonitor(baseConfig);

  // Mock the adapter factory to return a successful adapter
  const originalCheckProvider = monitor._checkProvider.bind(monitor);
  monitor._checkProvider = async (provider) => {
    monitor._initProviderHealth(provider);
    const health = monitor.providerHealth.get(provider);
    health.consecutiveSuccesses++;
    health.consecutiveFailures = 0;
    health.status = 'healthy';
    health.lastHealthyAt = new Date().toISOString();
    health.lastCheckAt = new Date().toISOString();
    return true;
  };

  await monitor.check();
  assert.strictEqual(monitor.metrics.checksPerformed, 1);
  assert.strictEqual(monitor.metrics.checksFailed, 0);
});

test('HealthMonitor _checkProvider should mark down after threshold failures', async () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_FAILURE_THRESHOLD: 2 });

  // Simulate failures
  monitor._checkProvider = async (provider) => {
    monitor._initProviderHealth(provider);
    const health = monitor.providerHealth.get(provider);
    health.consecutiveFailures++;
    health.consecutiveSuccesses = 0;
    health.lastError = 'Connection refused';
    health.lastCheckAt = new Date().toISOString();
    if (health.consecutiveFailures >= monitor.failureThreshold) {
      health.status = 'down';
    } else {
      health.status = 'degraded';
    }
    return false;
  };

  await monitor.check();
  await monitor.check();

  const health = monitor.providerHealth.get('ollama');
  assert.strictEqual(health.status, 'down');
  assert.strictEqual(monitor.metrics.checksFailed, 2);
});

test('HealthMonitor should invoke onFailover callback', async () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_FAILURE_THRESHOLD: 1 });

  let failoverCalled = false;
  let failoverArgs = {};
  monitor.onFailover((newP, oldP, reason) => {
    failoverCalled = true;
    failoverArgs = { newP, oldP, reason };
  });

  // Simulate: primary fails, then fallback to first available
  const callCount = { primary: 0, fallback: 0 };
  monitor._checkProvider = async (provider) => {
    monitor._initProviderHealth(provider);
    const health = monitor.providerHealth.get(provider);
    health.lastCheckAt = new Date().toISOString();

    if (provider === 'ollama') {
      callCount.primary++;
      health.consecutiveFailures++;
      health.status = 'down';
      health.lastError = 'Connection refused';
      return false;
    }
    // Fallback provider succeeds
    callCount.fallback++;
    health.consecutiveSuccesses++;
    health.status = 'healthy';
    return true;
  };

  await monitor.check();

  assert.strictEqual(failoverCalled, true);
  assert.strictEqual(failoverArgs.oldP, 'ollama');
  assert.strictEqual(failoverArgs.reason, 'failover');
  assert.strictEqual(monitor.metrics.failovers, 1);
  assert.notStrictEqual(monitor.activeProvider, 'ollama');
});

test('HealthMonitor should recover to primary when it becomes healthy', async () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_RECOVERY_THRESHOLD: 1 });

  // Force monitor into failover state
  monitor.activeProvider = 'openai';
  monitor._initProviderHealth('openai');
  monitor.providerHealth.get('openai').status = 'healthy';

  let recoveryArgs = {};
  monitor.onFailover((newP, oldP, reason) => {
    recoveryArgs = { newP, oldP, reason };
  });

  // Primary recovers
  monitor._checkProvider = async (provider) => {
    monitor._initProviderHealth(provider);
    const health = monitor.providerHealth.get(provider);
    health.lastCheckAt = new Date().toISOString();
    health.consecutiveSuccesses = monitor.recoveryThreshold;
    health.status = 'healthy';
    return true;
  };

  await monitor.check();

  assert.strictEqual(monitor.activeProvider, 'ollama');
  assert.strictEqual(recoveryArgs.reason, 'recovery');
  assert.strictEqual(monitor.metrics.recoveries, 1);
});

test('HealthMonitor start/stop should manage interval', () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_CHECK_INTERVAL_MS: 100000 });

  monitor.start();
  assert.ok(monitor._intervalHandle);

  monitor.stop();
  assert.strictEqual(monitor._intervalHandle, null);
});

test('HealthMonitor start should be idempotent', () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_CHECK_INTERVAL_MS: 100000 });

  monitor.start();
  const handle = monitor._intervalHandle;
  monitor.start(); // second call should not create a new interval
  assert.strictEqual(monitor._intervalHandle, handle);

  monitor.stop();
});

test('HealthMonitor should not start when disabled', () => {
  const monitor = new HealthMonitor({ ...baseConfig, HEALTH_MONITOR_ENABLED: false });
  monitor.start();
  assert.strictEqual(monitor._intervalHandle, null);
});

test('HealthMonitor _getUptime should return a formatted string', () => {
  const monitor = new HealthMonitor(baseConfig);
  const uptime = monitor._getUptime();
  assert.strictEqual(typeof uptime, 'string');
  assert.ok(uptime.includes('s'));
});
