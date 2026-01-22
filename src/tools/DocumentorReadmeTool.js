import { BaseTool } from './BaseTool.js';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

export class DocumentorReadmeTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'documentor_readme',
      description: 'Generate a comprehensive README.md file for a project by analyzing the codebase structure, package.json, and key files.',
      inputSchema: {
        type: 'object',
        properties: {
          project_path: {
            type: 'string',
            description: 'Path to the project root directory',
            default: '.',
          },
          include_installation: {
            type: 'boolean',
            description: 'Whether to include installation instructions',
            default: true,
          },
          include_usage: {
            type: 'boolean',
            description: 'Whether to include usage examples',
            default: true,
          },
          include_api: {
            type: 'boolean',
            description: 'Whether to include API documentation section',
            default: true,
          },
        },
      },
    };
  }

  async handle(args) {
    const { 
      project_path = '.', 
      include_installation = true, 
      include_usage = true,
      include_api = true 
    } = args;

    try {
      const projectInfo = await this.analyzeProject(project_path);
      
      const prompt = `Generate a comprehensive README.md file for this project based on the following information:

Project Structure:
${JSON.stringify(projectInfo.structure, null, 2)}

Package.json:
${JSON.stringify(projectInfo.packageJson, null, 2)}

Key Files Summary:
${projectInfo.keyFilesSummary}

Main Entry Point: ${projectInfo.mainEntry || 'Not found'}

Generate a README.md that includes:
1. Project title and description
2. Features/Key capabilities
3. ${include_installation ? 'Installation instructions' : ''}
4. ${include_usage ? 'Usage examples and quick start guide' : ''}
5. ${include_api ? 'API documentation overview' : ''}
6. Project structure overview
7. Contributing guidelines (if applicable)
8. License information (if available)

Make it professional, well-structured, and easy to follow. Use proper markdown formatting with code blocks, badges (if applicable), and clear sections.`;

      const model = await this.selectBestModel(prompt);
      const temperature = this.getOptimalTemperature(prompt);
      const max_tokens = this.getOptimalMaxTokens(prompt);

      const response = await this.callModelRunner({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: Math.max(max_tokens, 2048),
      });

      const result = response.choices?.[0]?.message?.content || 'No README generated';

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate README: ${error.message}`);
    }
  }

  async analyzeProject(projectPath) {
    const structure = {};
    let packageJson = {};
    let mainEntry = null;
    const keyFiles = [];

    try {
      const entries = await readdir(projectPath);
      
      for (const entry of entries) {
        if (entry.startsWith('.') && entry !== '.git') continue;
        
        const fullPath = join(projectPath, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          structure[entry] = 'directory';
        } else {
          structure[entry] = 'file';
          const ext = extname(entry).toLowerCase();
          
          if (entry === 'package.json') {
            try {
              const content = await readFile(fullPath, 'utf-8');
              packageJson = JSON.parse(content);
              if (packageJson.main) {
                mainEntry = packageJson.main;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          if (['.js', '.ts', '.jsx', '.tsx', '.py'].includes(ext)) {
            keyFiles.push(entry);
          }
        }
      }

      let keyFilesSummary = 'No key files found';
      if (keyFiles.length > 0) {
        keyFilesSummary = keyFiles.slice(0, 10).join(', ') + (keyFiles.length > 10 ? ` and ${keyFiles.length - 10} more` : '');
      }

      return {
        structure,
        packageJson,
        mainEntry,
        keyFilesSummary,
      };
    } catch (error) {
      return {
        structure: {},
        packageJson: {},
        mainEntry: null,
        keyFilesSummary: 'Unable to analyze project structure',
      };
    }
  }
}
