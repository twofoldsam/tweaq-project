import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const rmdir = promisify(fs.rmdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

export interface LocalRepoConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export class LocalRepo {
  private repoPath: string;
  private config: LocalRepoConfig;
  private isCloned: boolean = false;

  constructor(config: LocalRepoConfig) {
    this.config = config;
    // Create a unique temp directory for this repo
    const tempDir = os.tmpdir();
    const repoId = `${config.owner}-${config.repo}-${Date.now()}`;
    this.repoPath = path.join(tempDir, 'smart-qa-repos', repoId);
  }

  /**
   * Clone the repository to local temp directory
   */
  async clone(): Promise<void> {
    if (this.isCloned) {
      console.log(`📁 Repository already cloned at: ${this.repoPath}`);
      return;
    }

    console.log(`🔄 Cloning ${this.config.owner}/${this.config.repo} to ${this.repoPath}...`);

    try {
      // Ensure parent directory exists
      await mkdir(path.dirname(this.repoPath), { recursive: true });

      // Clone the repository
      const cloneUrl = `https://${this.config.token}@github.com/${this.config.owner}/${this.config.repo}.git`;
      const cloneCommand = `git clone --branch ${this.config.branch} --single-branch --depth 1 "${cloneUrl}" "${this.repoPath}"`;
      
      execSync(cloneCommand, { 
        stdio: 'pipe',
        timeout: 60000, // 60 second timeout
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      });

      this.isCloned = true;
      console.log(`✅ Successfully cloned repository to: ${this.repoPath}`);
    } catch (error) {
      console.error(`❌ Failed to clone repository:`, error);
      throw new Error(`Failed to clone ${this.config.owner}/${this.config.repo}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read a file from the local repository
   */
  async readFile(filePath: string): Promise<string> {
    if (!this.isCloned) {
      await this.clone();
    }

    const fullPath = path.join(this.repoPath, filePath);
    
    try {
      const content = await readFile(fullPath, 'utf-8');
      console.log(`📖 Read local file: ${filePath} (${content.length} chars)`);
      return content;
    } catch (error) {
      console.error(`❌ Failed to read local file ${filePath}:`, error);
      throw new Error(`File ${filePath} not found in local repository`);
    }
  }

  /**
   * Write a file to the local repository
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isCloned) {
      await this.clone();
    }

    const fullPath = path.join(this.repoPath, filePath);
    
    try {
      // Ensure directory exists
      await mkdir(path.dirname(fullPath), { recursive: true });
      
      await writeFile(fullPath, content, 'utf-8');
      console.log(`✍️ Wrote local file: ${filePath} (${content.length} chars)`);
    } catch (error) {
      console.error(`❌ Failed to write local file ${filePath}:`, error);
      throw new Error(`Failed to write file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if a file exists in the local repository
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!this.isCloned) {
      await this.clone();
    }

    const fullPath = path.join(this.repoPath, filePath);
    
    try {
      await stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all files in the repository (for analysis)
   */
  async listFiles(extensions: string[] = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.svelte']): Promise<Array<{ path: string; size: number }>> {
    if (!this.isCloned) {
      await this.clone();
    }

    const files: Array<{ path: string; size: number }> = [];
    
    const walkDir = async (dir: string, relativePath: string = '') => {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);
        
        // Skip hidden files/directories and node_modules
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }
        
        if (entry.isDirectory()) {
          await walkDir(fullPath, relPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            const stats = await stat(fullPath);
            files.push({
              path: relPath.replace(/\\/g, '/'), // Normalize path separators
              size: stats.size
            });
          }
        }
      }
    };

    await walkDir(this.repoPath);
    return files;
  }

  /**
   * Get all modified files (for PR creation)
   */
  async getModifiedFiles(): Promise<Array<{ path: string; content: string }>> {
    if (!this.isCloned) {
      throw new Error('Repository not cloned');
    }

    try {
      // Get list of modified files using git status
      const statusOutput = execSync('git status --porcelain', { 
        cwd: this.repoPath, 
        encoding: 'utf-8' 
      });

      const modifiedFiles: Array<{ path: string; content: string }> = [];
      
      for (const line of statusOutput.split('\n')) {
        if (line.trim()) {
          const status = line.substring(0, 2);
          const filePath = line.substring(3);
          
          // Handle modified (M) and added (A) files
          if (status.includes('M') || status.includes('A')) {
            const content = await this.readFile(filePath);
            modifiedFiles.push({ path: filePath, content });
          }
        }
      }

      console.log(`📋 Found ${modifiedFiles.length} modified files`);
      return modifiedFiles;
    } catch (error) {
      console.error('❌ Failed to get modified files:', error);
      return [];
    }
  }

  /**
   * Clean up the local repository
   */
  async cleanup(): Promise<void> {
    if (!this.isCloned) {
      return;
    }

    try {
      // Use rm -rf for reliable cleanup on all platforms
      execSync(`rm -rf "${this.repoPath}"`, { stdio: 'pipe' });
      console.log(`🗑️ Cleaned up local repository: ${this.repoPath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to cleanup local repository: ${error}`);
    }
  }

  /**
   * Get the local repository path
   */
  getLocalPath(): string {
    return this.repoPath;
  }
}
