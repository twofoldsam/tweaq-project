import { promises as fs } from 'fs';
import path from 'path';
import type { FileUpdate, ChangeContext } from './types';

export class FileUpdater {
  private context: ChangeContext;

  constructor(context: ChangeContext) {
    this.context = context;
  }

  /**
   * Applies file updates to the file system
   */
  async applyUpdates(updates: FileUpdate[]): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const update of updates) {
      try {
        await this.applyUpdate(update);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to update ${update.path}: ${message}`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  }

  private async applyUpdate(update: FileUpdate): Promise<void> {
    const fullPath = path.resolve(this.context.workingDirectory, update.path);
    
    switch (update.action) {
      case 'create':
      case 'update':
        await this.ensureDirectoryExists(path.dirname(fullPath));
        await fs.writeFile(fullPath, update.content, update.encoding || 'utf8');
        break;
      
      case 'delete':
        try {
          await fs.unlink(fullPath);
        } catch (error) {
          // Ignore if file doesn't exist
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
          }
        }
        break;
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Creates a backup of files before applying updates
   */
  async createBackup(updates: FileUpdate[]): Promise<string> {
    const backupDir = path.join(this.context.workingDirectory, '.smart-qa-backups', Date.now().toString());
    await fs.mkdir(backupDir, { recursive: true });

    for (const update of updates) {
      if (update.action === 'update' || update.action === 'delete') {
        const originalPath = path.resolve(this.context.workingDirectory, update.path);
        const backupPath = path.join(backupDir, update.path);
        
        try {
          await this.ensureDirectoryExists(path.dirname(backupPath));
          await fs.copyFile(originalPath, backupPath);
        } catch (error) {
          // File might not exist, which is okay for some operations
          console.warn(`Could not backup ${originalPath}:`, error);
        }
      }
    }

    return backupDir;
  }

  /**
   * Restores files from a backup
   */
  async restoreFromBackup(backupDir: string): Promise<void> {
    // This is a simplified implementation
    // In practice, you'd want to recursively restore all files from the backup
    console.log(`Restoring from backup: ${backupDir}`);
    // Implementation would go here
  }
}
