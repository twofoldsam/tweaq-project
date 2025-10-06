import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { ClaudeTool, ToolResult } from '../types/index';

const execAsync = promisify(exec);

/**
 * Executes tools for Claude Agent
 * All tools operate on the local cloned repository
 */
export class ToolExecutor {
  private workspacePath: string;
  private verbose: boolean;

  constructor(workspacePath: string, verbose: boolean = false) {
    this.workspacePath = workspacePath;
    this.verbose = verbose;
  }

  /**
   * Get available tools for Claude
   */
  getTools(): ClaudeTool[] {
    return [
      {
        name: 'read_file',
        description: 'Read the contents of a file from the repository. Use this to examine code before making changes.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path relative to repository root (e.g., "src/components/Button.tsx")'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file in the repository. Use this to make code changes.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path relative to repository root'
            },
            content: {
              type: 'string',
              description: 'The complete new content for the file'
            }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'search_codebase',
        description: 'Search the codebase for patterns using ripgrep. Use this to find all files matching a pattern (e.g., find all button components).',
        input_schema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'The regex pattern to search for'
            },
            file_type: {
              type: 'string',
              description: 'Optional file type to filter (e.g., "tsx", "css", "js")'
            },
            context_lines: {
              type: 'number',
              description: 'Number of context lines to include around matches (default: 3)'
            }
          },
          required: ['pattern']
        }
      },
      {
        name: 'list_directory',
        description: 'List files and directories in a path. Use this to explore the repository structure.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Directory path relative to repository root (use "." for root)'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'run_command',
        description: 'Run a shell command in the repository directory. Use for linting, testing, or other validation.',
        input_schema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The shell command to execute (e.g., "npm test", "npm run lint")'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'get_file_info',
        description: 'Get information about a file (size, lines, last modified). Use this to understand file characteristics.',
        input_schema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The file path relative to repository root'
            }
          },
          required: ['path']
        }
      }
    ];
  }

  /**
   * Execute a tool
   */
  async execute(toolName: string, toolInput: any): Promise<ToolResult> {
    if (this.verbose) {
      console.log(`🔧 Executing tool: ${toolName}`, JSON.stringify(toolInput, null, 2));
    }

    try {
      let result: any;

      switch (toolName) {
        case 'read_file':
          result = await this.readFile(toolInput.path);
          break;

        case 'write_file':
          result = await this.writeFile(toolInput.path, toolInput.content);
          break;

        case 'search_codebase':
          result = await this.searchCodebase(
            toolInput.pattern,
            toolInput.file_type,
            toolInput.context_lines || 3
          );
          break;

        case 'list_directory':
          result = await this.listDirectory(toolInput.path);
          break;

        case 'run_command':
          result = await this.runCommand(toolInput.command);
          break;

        case 'get_file_info':
          result = await this.getFileInfo(toolInput.path);
          break;

        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`
          };
      }

      if (this.verbose) {
        console.log(`  ✅ Tool ${toolName} succeeded`);
      }

      return {
        success: true,
        output: result
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (this.verbose) {
        console.error(`  ❌ Tool ${toolName} failed:`, errorMessage);
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Tool implementations

  private async readFile(filePath: string): Promise<string> {
    const fullPath = path.join(this.workspacePath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    if (this.verbose) {
      console.log(`  📖 Read ${filePath} (${content.length} chars)`);
    }
    
    return content;
  }

  private async writeFile(filePath: string, content: string): Promise<{ success: true; message: string; stats: any }> {
    const fullPath = path.join(this.workspacePath, filePath);
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
    
    const stats = await fs.stat(fullPath);
    
    if (this.verbose) {
      console.log(`  ✍️  Wrote ${filePath} (${content.length} chars)`);
    }
    
    return {
      success: true,
      message: `Successfully wrote ${filePath}`,
      stats: {
        size: stats.size,
        lines: content.split('\n').length
      }
    };
  }

  private async searchCodebase(
    pattern: string,
    fileType?: string,
    contextLines: number = 3
  ): Promise<{ matches: any[]; count: number; files: string[] }> {
    try {
      let cmd = `rg "${pattern}" "${this.workspacePath}"`;
      
      if (fileType) {
        cmd += ` -t ${fileType}`;
      }
      
      cmd += ` -C ${contextLines} --json`;

      const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
      
      // Parse ripgrep JSON output
      const lines = stdout.trim().split('\n').filter(line => line);
      const matches = lines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(item => item && item.type === 'match');

      const files = [...new Set(matches.map((m: any) => m.data?.path?.text).filter(Boolean))];

      if (this.verbose) {
        console.log(`  🔍 Found ${matches.length} matches in ${files.length} files for "${pattern}"`);
      }

      return {
        matches,
        count: matches.length,
        files
      };

    } catch (error: any) {
      // ripgrep returns exit code 1 when no matches found
      if (error.code === 1) {
        if (this.verbose) {
          console.log(`  ℹ️  No matches found for "${pattern}"`);
        }
        return { matches: [], count: 0, files: [] };
      }
      throw error;
    }
  }

  private async listDirectory(dirPath: string): Promise<{ files: string[]; directories: string[]; count: number }> {
    const fullPath = path.join(this.workspacePath, dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const files = entries
      .filter(e => e.isFile())
      .map(e => e.name)
      .filter(name => !name.startsWith('.')); // Skip hidden files
    
    const directories = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !name.startsWith('.') && name !== 'node_modules'); // Skip hidden and node_modules

    if (this.verbose) {
      console.log(`  📁 Listed ${dirPath}: ${files.length} files, ${directories.length} directories`);
    }

    return {
      files,
      directories,
      count: files.length + directories.length
    };
  }

  private async runCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    if (this.verbose) {
      console.log(`  🚀 Running: ${command}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workspacePath,
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60000 // 60 second timeout
      });

      if (this.verbose) {
        console.log(`  ✅ Command completed successfully`);
      }

      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0
      };
    } catch (error: any) {
      return {
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        exitCode: error.code || 1
      };
    }
  }

  private async getFileInfo(filePath: string): Promise<{
    size: number;
    lines: number;
    extension: string;
    lastModified: Date;
  }> {
    const fullPath = path.join(this.workspacePath, filePath);
    const stats = await fs.stat(fullPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    return {
      size: stats.size,
      lines: content.split('\n').length,
      extension: path.extname(filePath),
      lastModified: stats.mtime
    };
  }
}

