import { BaseTool } from './BaseTool.js';
import { platform, arch, cpus, totalmem, freemem, hostname, uptime, userInfo } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DesktopSystemInfoTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'desktop_system_info',
      description: 'Get comprehensive system information including OS, CPU, memory, disk space, and network details.',
      inputSchema: {
        type: 'object',
        properties: {
          include_disk: {
            type: 'boolean',
            description: 'Include disk space information',
            default: true,
          },
          include_network: {
            type: 'boolean',
            description: 'Include network interface information',
            default: false,
          },
        },
      },
    };
  }

  async handle(args) {
    const { include_disk = true, include_network = false } = args;

    try {
      const osPlatform = platform();
      const systemInfo = {
        platform: osPlatform,
        arch: arch(),
        hostname: hostname(),
        cpus: {
          count: cpus().length,
          model: cpus()[0]?.model || 'Unknown',
          speed: cpus()[0]?.speed || 0,
        },
        memory: {
          total: Math.round(totalmem() / 1024 / 1024 / 1024 * 100) / 100,
          free: Math.round(freemem() / 1024 / 1024 / 1024 * 100) / 100,
          used: Math.round((totalmem() - freemem()) / 1024 / 1024 / 1024 * 100) / 100,
          unit: 'GB',
        },
        uptime: {
          seconds: uptime(),
          formatted: this.formatUptime(uptime()),
        },
        user: userInfo(),
      };

      if (include_disk) {
        try {
          systemInfo.disk = await this.getDiskInfo(osPlatform);
        } catch (error) {
          systemInfo.disk = { error: error.message };
        }
      }

      if (include_network) {
        try {
          systemInfo.network = await this.getNetworkInfo(osPlatform);
        } catch (error) {
          systemInfo.network = { error: error.message };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(systemInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get system info: ${error.message}`);
    }
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  async getDiskInfo(osPlatform) {
    if (osPlatform === 'win32') {
      const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption');
      return { raw: stdout, note: 'Parse output for disk information' };
    } else {
      const { stdout } = await execAsync('df -h');
      return { raw: stdout, note: 'Parse output for disk information' };
    }
  }

  async getNetworkInfo(osPlatform) {
    if (osPlatform === 'win32') {
      const { stdout } = await execAsync('ipconfig');
      return { raw: stdout, note: 'Parse output for network interfaces' };
    } else if (osPlatform === 'darwin') {
      const { stdout } = await execAsync('ifconfig');
      return { raw: stdout, note: 'Parse output for network interfaces' };
    } else {
      const { stdout } = await execAsync('ip addr');
      return { raw: stdout, note: 'Parse output for network interfaces' };
    }
  }
}
