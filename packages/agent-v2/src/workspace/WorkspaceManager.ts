import * as fs from 'fs-extra';
import * as path from 'path';
import * as tmp from 'tmp';
import { simpleGit, SimpleGit } from 'simple-git';
import { AgentWorkspace, WorkspaceConfig, FileChange } from '../types';

export class WorkspaceManager {
  private git: SimpleGit;
  private workspace: AgentWorkspace | null = null;

  constructor() {
    this.git = simpleGit();
  }

  /**
   * Create a new workspace by cloning the repository
   */
  async createWorkspace(config: WorkspaceConfig): Promise<AgentWorkspace> {
    console.log('🏗️ Creating workspace for', `${config.owner}/${config.repo}`);

    // Create temporary directory
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const workspacePath = tmpDir.name;

    // Clone repository
    const repoUrl = `https://github.com/${config.owner}/${config.repo}.git`;
    console.log('📥 Cloning repository:', repoUrl);
    
    await this.git.clone(repoUrl, workspacePath, {
      '--depth': 1,
      '--branch': config.baseBranch || 'main'
    });

    // Initialize git in the workspace
    this.git = simpleGit(workspacePath);

    // Configure git user (required for commits)
    await this.git.addConfig('user.name', 'Tweaq Agent');
    await this.git.addConfig('user.email', 'agent@tweaq.ai');

    // Create workspace object
    this.workspace = {
      id: `workspace-${Date.now()}`,
      localPath: workspacePath,
      remoteOrigin: {
        owner: config.owner,
        repo: config.repo,
        branch: config.baseBranch || 'main'
      },
      currentBranch: config.baseBranch || 'main',
      isClean: true
    };

    console.log('✅ Workspace created at:', workspacePath);
    return this.workspace;
  }

  /**
   * Create a new working branch for changes
   */
  async createWorkingBranch(description: string): Promise<string> {
    if (!this.workspace) {
      throw new Error('No workspace available. Call createWorkspace first.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const sanitizedDescription = description.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    const branchName = `agent/${timestamp}-${sanitizedDescription}`;

    console.log('🌿 Creating branch:', branchName);

    // Ensure we're on the base branch
    await this.git.checkout(this.workspace.remoteOrigin.branch);
    
    // Pull latest changes
    await this.git.pull('origin', this.workspace.remoteOrigin.branch);
    
    // Create and checkout new branch
    await this.git.checkoutLocalBranch(branchName);

    this.workspace.currentBranch = branchName;
    console.log('✅ Branch created and checked out:', branchName);

    return branchName;
  }

  /**
   * Read file content from workspace
   */
  async readFile(filePath: string): Promise<string> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    const fullPath = path.join(this.workspace.localPath, filePath);
    
    if (!await fs.pathExists(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Write file content to workspace
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    const fullPath = path.join(this.workspace.localPath, filePath);
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath));
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
    
    console.log('📝 File written:', filePath);
    this.workspace.isClean = false;
  }

  /**
   * Check if file exists in workspace
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    const fullPath = path.join(this.workspace.localPath, filePath);
    return await fs.pathExists(fullPath);
  }

  /**
   * List files in directory
   */
  async listFiles(directory: string = '', pattern?: string): Promise<string[]> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    const fullPath = path.join(this.workspace.localPath, directory);
    
    if (!await fs.pathExists(fullPath)) {
      return [];
    }

    const files = await fs.readdir(fullPath, { withFileTypes: true });
    let result = files
      .filter(file => file.isFile())
      .map(file => path.join(directory, file.name));

    if (pattern) {
      const regex = new RegExp(pattern);
      result = result.filter(file => regex.test(file));
    }

    return result;
  }

  /**
   * Get all files matching patterns (for component discovery)
   */
  async findFiles(patterns: string[]): Promise<string[]> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    const glob = require('glob');
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await new Promise<string[]>((resolve, reject) => {
        glob(pattern, { cwd: this.workspace!.localPath }, (err: any, matches: string[]) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      allFiles.push(...files);
    }

    // Remove duplicates and sort
    return [...new Set(allFiles)].sort();
  }

  /**
   * Stage and commit changes
   */
  async commitChanges(message: string, files: string[]): Promise<string> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    console.log('📦 Staging files for commit:', files);

    // Stage specific files
    for (const file of files) {
      await this.git.add(file);
    }

    // Commit changes
    const result = await this.git.commit(message);
    console.log('✅ Changes committed:', result.commit);

    this.workspace.isClean = true;
    return result.commit;
  }

  /**
   * Push changes to remote
   */
  async pushChanges(): Promise<void> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    console.log('🚀 Pushing changes to remote...');
    await this.git.push('origin', this.workspace.currentBranch);
    console.log('✅ Changes pushed to remote');
  }

  /**
   * Get diff for staged/unstaged changes
   */
  async getDiff(staged: boolean = false): Promise<string> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    return staged ? await this.git.diff(['--cached']) : await this.git.diff();
  }

  /**
   * Get status of workspace
   */
  async getStatus(): Promise<{
    modified: string[];
    added: string[];
    deleted: string[];
    untracked: string[];
  }> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    const status = await this.git.status();
    
    return {
      modified: status.modified,
      added: status.created,
      deleted: status.deleted,
      untracked: status.not_added
    };
  }

  /**
   * Clean up workspace
   */
  async cleanup(): Promise<void> {
    if (!this.workspace) {
      return;
    }

    console.log('🧹 Cleaning up workspace:', this.workspace.localPath);
    
    try {
      await fs.remove(this.workspace.localPath);
      console.log('✅ Workspace cleaned up');
    } catch (error) {
      console.warn('⚠️ Failed to cleanup workspace:', error);
    }

    this.workspace = null;
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): AgentWorkspace | null {
    return this.workspace;
  }

  /**
   * Apply file changes to workspace
   */
  async applyFileChanges(changes: FileChange[]): Promise<void> {
    if (!this.workspace) {
      throw new Error('No workspace available');
    }

    console.log(`📝 Applying ${changes.length} file changes...`);

    for (const change of changes) {
      switch (change.action) {
        case 'create':
        case 'modify':
          if (!change.newContent) {
            throw new Error(`No content provided for ${change.action} action on ${change.filePath}`);
          }
          await this.writeFile(change.filePath, change.newContent);
          break;

        case 'delete':
          const fullPath = path.join(this.workspace.localPath, change.filePath);
          if (await fs.pathExists(fullPath)) {
            await fs.remove(fullPath);
            console.log('🗑️ File deleted:', change.filePath);
          }
          break;

        default:
          throw new Error(`Unknown file action: ${(change as any).action}`);
      }
    }

    console.log('✅ All file changes applied');
  }
}
