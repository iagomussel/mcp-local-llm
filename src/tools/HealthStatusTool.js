import { BaseTool } from './BaseTool.js';

export class HealthStatusTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'health_status',
      description: 'View provider health status: active/primary provider, failover state, and per-provider health details',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  async handle() {
    const status = this.server.getHealthStatus();
    const metrics = this.server.getHealthMetrics();

    const lines = [
      `Active provider: ${status.activeProvider}${status.isOnPrimary ? ' (primary)' : ' (failover)'}`,
      `Primary provider: ${status.primaryProvider}`,
      `Health checks: ${metrics.checksPerformed} (${metrics.checksFailed} failed)`,
      `Failovers: ${metrics.failovers} | Recoveries: ${metrics.recoveries}`,
      `Interval: ${metrics.intervalMs / 1000}s | Failure threshold: ${metrics.failureThreshold}`,
      '',
      'Provider details:',
    ];

    for (const [name, health] of Object.entries(status.providers)) {
      const marker = name === status.activeProvider ? '→' : ' ';
      lines.push(`${marker} ${name}: ${health.status} (failures: ${health.consecutiveFailures}, last: ${health.lastCheckAt || 'never'})`);
      if (health.lastError) {
        lines.push(`    error: ${health.lastError}`);
      }
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  }
}
