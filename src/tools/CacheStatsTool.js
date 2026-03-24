import { BaseTool } from './BaseTool.js';

export class CacheStatsTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'cache_stats',
      description: 'View response cache metrics: hit rate, size, evictions, and configuration',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  async handle() {
    const metrics = this.server.getCacheMetrics();
    const lines = [
      `Cache: ${metrics.enabled ? 'enabled' : 'disabled'}`,
      `Size: ${metrics.size}/${metrics.maxSize} entries`,
      `TTL: ${metrics.ttlMs / 1000}s`,
      `Hit rate: ${metrics.hitRatePercent}% (${metrics.hits} hits, ${metrics.misses} misses)`,
      `Evictions: ${metrics.evictions} | Expirations: ${metrics.expirations}`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  }
}
