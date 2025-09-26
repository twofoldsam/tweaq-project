import { BaseAction } from './base';
import { AgentContext, VisualEdit } from '../types';

export interface FileContext {
  filePath: string;
  content: string;
  componentName: string;
  mappingConfidence: number;
}

export class RetrieveFileContextAction extends BaseAction {
  readonly type = 'retrieve-file-context';
  readonly name = 'Retrieve File Context';
  readonly description = 'Retrieves actual file content for components being modified';
  readonly priority = 150; // Higher than change intent evaluation
  override dependencies: string[] = [];

  protected override canExecuteImpl(context: AgentContext): boolean {
    return context.visualEdits && context.visualEdits.length > 0;
  }

  protected override async executeImpl(context: AgentContext): Promise<{
    data: FileContext[];
    reasoning: string;
  }> {
    const fileContexts: FileContext[] = [];
    
    // Get unique file paths from visual edits
    const filePaths = this.extractFilePaths(context.visualEdits);
    
    console.log(`📖 Retrieving file content for ${filePaths.length} files...`);
    
    for (const { filePath, componentName, confidence } of filePaths) {
      try {
        const content = await this.retrieveFileContent(filePath, context);
        
        fileContexts.push({
          filePath,
          content,
          componentName,
          mappingConfidence: confidence
        });
        
        console.log(`📖 Retrieved ${filePath} (${content.length} chars)`);
      } catch (error) {
        console.warn(`⚠️ Could not retrieve ${filePath}:`, error);
        // Add empty context for failed retrievals
        fileContexts.push({
          filePath,
          content: '',
          componentName,
          mappingConfidence: 0
        });
      }
    }
    
    // Store file contexts in agent context for later use
    context.fileContexts = fileContexts;
    context.currentState.decisions['fileContextRetrieval'] = {
      filesRetrieved: fileContexts.length,
      totalSize: fileContexts.reduce((sum, fc) => sum + fc.content.length, 0),
      successfulRetrievals: fileContexts.filter(fc => fc.content.length > 0).length
    };
    
    const reasoning = `Retrieved ${fileContexts.length} file contexts. ${fileContexts.filter(fc => fc.content.length > 0).length} successful retrievals.`;
    
    return {
      data: fileContexts,
      reasoning
    };
  }
  
  private extractFilePaths(visualEdits: VisualEdit[]): Array<{
    filePath: string;
    componentName: string;
    confidence: number;
  }> {
    const pathMap = new Map<string, { componentName: string; confidence: number }>();
    
    for (const edit of visualEdits) {
      // Try to get file path from enhanced element context
      const filePath = edit.element.componentPath;
      const componentName = edit.element.componentName || edit.element.tagName || 'Unknown';
      
      if (filePath) {
        pathMap.set(filePath, { 
          componentName, 
          confidence: 0.9 // High confidence if we have explicit path
        });
      } else {
        // Fallback: infer from element info
        const inferredPath = this.inferFilePath(edit);
        if (inferredPath) {
          pathMap.set(inferredPath, { 
            componentName, 
            confidence: 0.6 // Lower confidence for inferred paths
          });
        }
      }
    }
    
    return Array.from(pathMap.entries()).map(([filePath, info]) => ({
      filePath,
      ...info
    }));
  }
  
  private inferFilePath(edit: VisualEdit): string | null {
    // Try to infer file path from element information
    const element = edit.element;
    
    if (element.componentName) {
      return `components/${element.componentName}.tsx`;
    }
    
    if (element.tagName && element.tagName !== 'div' && element.tagName !== 'span') {
      return `components/${element.tagName}.tsx`;
    }
    
    return null;
  }
  
  private async retrieveFileContent(filePath: string, _context: AgentContext): Promise<string> {
    // For now, we'll return empty content and let the main process handle file retrieval
    // This is a placeholder - the actual implementation would need RemoteRepo integration
    // The main process will handle file retrieval before calling the agent
    
    console.log(`📖 File retrieval for ${filePath} - delegated to main process`);
    return '';
  }
}
