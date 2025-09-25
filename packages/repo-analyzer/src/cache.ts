import { RepoSymbolicModel } from './types.js';
const fs = require('fs');
const path = require('path');
const os = require('os');

export class RepoCache {
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(os.homedir(), '.smart-qa', 'repo-cache');
    this.ensureCacheDir();
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.promises.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.warn('⚠️ Failed to create cache directory:', error);
    }
  }

  async get(repoId: string): Promise<RepoSymbolicModel | null> {
    try {
      const cacheFile = this.getCacheFilePath(repoId);
      const content = await fs.promises.readFile(cacheFile, 'utf-8');
      const data = JSON.parse(content);
      
      // Convert serialized Maps back to Map objects
      const model = this.deserializeModel(data);
      
      console.log(`📦 Loaded cached analysis for ${repoId}`);
      return model;
    } catch (error) {
      // Cache miss is normal
      return null;
    }
  }

  async set(repoId: string, model: RepoSymbolicModel): Promise<void> {
    try {
      const cacheFile = this.getCacheFilePath(repoId);
      
      // Convert Maps to serializable objects
      const serializable = this.serializeModel(model);
      
      await fs.promises.writeFile(cacheFile, JSON.stringify(serializable, null, 2), 'utf-8');
      console.log(`💾 Cached analysis for ${repoId}`);
    } catch (error) {
      console.warn('⚠️ Failed to cache analysis:', error);
    }
  }

  async invalidate(repoId: string): Promise<void> {
    try {
      const cacheFile = this.getCacheFilePath(repoId);
      await fs.promises.unlink(cacheFile);
      console.log(`🗑️ Invalidated cache for ${repoId}`);
    } catch (error) {
      // File not existing is fine
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.cacheDir);
      await Promise.all(
        files.map((file: string) => fs.promises.unlink(path.join(this.cacheDir, file)))
      );
      console.log('🧹 Cleared all cache');
    } catch (error) {
      console.warn('⚠️ Failed to clear cache:', error);
    }
  }

  private getCacheFilePath(repoId: string): string {
    // Replace slashes and other invalid characters
    const safeRepoId = repoId.replace(/[/\\:*?"<>|]/g, '_');
    return path.join(this.cacheDir, `${safeRepoId}.json`);
  }

  private serializeModel(model: RepoSymbolicModel): any {
    return {
      ...model,
      cssVariables: Array.from(model.cssVariables.entries()),
      customClasses: Array.from(model.customClasses.entries()),
      domMappings: Array.from(model.domMappings.entries()),
      fileHashes: Array.from(model.fileHashes.entries()),
      stylingPatterns: {
        fontSize: this.serializeStylingPattern(model.stylingPatterns.fontSize),
        color: this.serializeStylingPattern(model.stylingPatterns.color),
        spacing: this.serializeStylingPattern(model.stylingPatterns.spacing),
        layout: this.serializeStylingPattern(model.stylingPatterns.layout)
      }
    };
  }

  private deserializeModel(data: any): RepoSymbolicModel {
    return {
      ...data,
      analyzedAt: new Date(data.analyzedAt),
      lastModified: new Date(data.lastModified),
      cssVariables: new Map(data.cssVariables),
      customClasses: new Map(data.customClasses),
      domMappings: new Map(data.domMappings),
      fileHashes: new Map(data.fileHashes),
      stylingPatterns: {
        fontSize: this.deserializeStylingPattern(data.stylingPatterns.fontSize),
        color: this.deserializeStylingPattern(data.stylingPatterns.color),
        spacing: this.deserializeStylingPattern(data.stylingPatterns.spacing),
        layout: this.deserializeStylingPattern(data.stylingPatterns.layout)
      }
    };
  }

  private serializeStylingPattern(pattern: any): any {
    return {
      ...pattern,
      values: Array.from(pattern.values.entries()),
      customClasses: Array.from(pattern.customClasses.entries()),
      variables: Array.from(pattern.variables.entries())
    };
  }

  private deserializeStylingPattern(data: any): any {
    return {
      ...data,
      values: new Map(data.values),
      customClasses: new Map(data.customClasses),
      variables: new Map(data.variables)
    };
  }
}
