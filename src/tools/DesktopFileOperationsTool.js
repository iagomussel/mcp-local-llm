import { BaseTool } from './BaseTool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { stat, readdir, mkdir, writeFile, readFile, unlink, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

const execAsync = promisify(exec);

export class DesktopFileOperationsTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'desktop_file_operations',
      description: 'Perform file operations: create, read, delete, list directory, reveal in file manager, and get file info.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            description: 'Operation to perform: create, read, delete, list, reveal, info',
            enum: ['create', 'read', 'delete', 'list', 'reveal', 'info'],
          },
          path: {
            type: 'string',
            description: 'File or directory path',
          },
          content: {
            type: 'string',
            description: 'Content to write (for create operation)',
          },
          recursive: {
            type: 'boolean',
            description: 'For list operation: list recursively',
            default: false,
          },
        },
        required: ['operation', 'path'],
      },
    };
  }

  async handle(args) {
    const { operation, path, content, recursive = false } = args;

    if (!operation || typeof operation !== 'string') {
      throw new Error('Operation is required and must be a string');
    }

    if (!path || typeof path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    try {
      let result;

      switch (operation) {
        case 'create':
          if (content === undefined) {
            throw new Error('Content is required for create operation');
          }
          await mkdir(dirname(path), { recursive: true });
          await writeFile(path, content, 'utf-8');
          result = { success: true, path, created: true };
          break;

        case 'read':
          const fileContent = await readFile(path, 'utf-8');
          result = { success: true, path, content: fileContent };
          break;

        case 'delete':
          const stats = await stat(path);
          if (stats.isDirectory()) {
            await rmdir(path, { recursive: true });
          } else {
            await unlink(path);
          }
          result = { success: true, path, deleted: true };
          break;

        case 'list':
          const entries = await readdir(path);
          const detailedEntries = [];
          for (const entry of entries) {
            const entryPath = join(path, entry);
            try {
              const entryStats = await stat(entryPath);
              detailedEntries.push({
                name: entry,
                type: entryStats.isDirectory() ? 'directory' : 'file',
                size: entryStats.size,
                modified: entryStats.mtime.toISOString(),
              });
            } catch (e) {
              detailedEntries.push({ name: entry, error: e.message });
            }
          }
          result = { success: true, path, entries: detailedEntries };
          break;

        case 'reveal':
          const osPlatform = platform();
          let revealCommand;
          if (osPlatform === 'win32') {
            revealCommand = `explorer /select,"${path}"`;
          } else if (osPlatform === 'darwin') {
            revealCommand = `open -R "${path}"`;
          } else {
            revealCommand = `xdg-open "${dirname(path)}"`;
          }
          execAsync(revealCommand).catch(() => {});
          result = { success: true, path, revealed: true };
          break;

        case 'info':
          const fileStats = await stat(path);
          result = {
            success: true,
            path,
            type: fileStats.isDirectory() ? 'directory' : 'file',
            size: fileStats.size,
            created: fileStats.birthtime.toISOString(),
            modified: fileStats.mtime.toISOString(),
            accessed: fileStats.atime.toISOString(),
            permissions: fileStats.mode.toString(8),
          };
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to perform ${operation} on ${path}: ${error.message}`);
    }
  }
}
