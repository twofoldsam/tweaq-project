import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import * as prettier from 'prettier';
import { 
  ChangeIntent, 
  ExecutionPlan, 
  FileChange, 
  CodeModification,
  ProjectStructure,
  StyleImpactAnalysis
} from '../types';
import { WorkspaceManager } from '../workspace/WorkspaceManager';

export class CodeGenerator {
  constructor(
    private workspace: WorkspaceManager,
    private llmProvider: { generateText(prompt: string): Promise<string> }
  ) {}

  /**
   * Generate code changes based on execution plan
   */
  async generateChanges(
    executionPlan: ExecutionPlan,
    projectStructure: ProjectStructure
  ): Promise<FileChange[]> {
    console.log('🔧 Generating code changes...');
    
    const fileChanges: FileChange[] = [];

    for (const step of executionPlan.steps) {
      if (step.type === 'file-modify' || step.type === 'file-create') {
        try {
          const change = await this.generateFileChange(step.action, projectStructure);
          if (change) {
            fileChanges.push(change);
          }
        } catch (error) {
          console.warn(`⚠️ Error generating change for ${step.targetFile}:`, error);
        }
      }
    }

    console.log(`✅ Generated ${fileChanges.length} file changes`);
    return fileChanges;
  }

  /**
   * Generate a single file change
   */
  private async generateFileChange(
    action: any,
    projectStructure: ProjectStructure
  ): Promise<FileChange | null> {
    const filePath = action.filePath;
    
    if (action.type === 'create') {
      return {
        filePath,
        action: 'create',
        newContent: action.content || '',
        diff: `+++ ${filePath}\n${action.content || ''}`
      };
    }

    if (action.type === 'delete') {
      const oldContent = await this.workspace.readFile(filePath);
      return {
        filePath,
        action: 'delete',
        oldContent,
        diff: `--- ${filePath}\n${oldContent}`
      };
    }

    if (action.type === 'modify') {
      const oldContent = await this.workspace.readFile(filePath);
      
      // Use different strategies based on file type
      let newContent: string;
      
      if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
        newContent = await this.modifyReactComponent(filePath, oldContent, action.modifications || [], projectStructure);
      } else if (filePath.endsWith('.css') || filePath.endsWith('.scss')) {
        newContent = await this.modifyStyleFile(filePath, oldContent, action.modifications || []);
      } else {
        newContent = await this.modifyGenericFile(filePath, oldContent, action.modifications || []);
      }

      return {
        filePath,
        action: 'modify',
        oldContent,
        newContent,
        diff: this.generateDiff(oldContent, newContent)
      };
    }

    return null;
  }

  /**
   * Modify React component using AST manipulation
   */
  private async modifyReactComponent(
    filePath: string,
    content: string,
    modifications: CodeModification[],
    projectStructure: ProjectStructure
  ): Promise<string> {
    console.log('⚛️ Modifying React component:', filePath);

    // If we have complex modifications, use LLM-assisted generation
    if (modifications.length > 0) {
      return await this.generateWithLLM(filePath, content, modifications, projectStructure);
    }

    // For simple modifications, use AST manipulation
    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      let modified = false;

      traverse(ast, {
        JSXAttribute(path: any) {
          // Example: Modify className attributes
          if (t.isJSXIdentifier(path.node.name) && path.node.name.name === 'className') {
            if (t.isStringLiteral(path.node.value)) {
              // Modify class names here
              modified = true;
            }
          }
        },

        JSXExpressionContainer(path: any) {
          // Example: Modify inline styles
          if (path.parent && t.isJSXAttribute(path.parent) && 
              t.isJSXIdentifier(path.parent.name) && path.parent.name.name === 'style') {
            // Modify inline styles here
            modified = true;
          }
        }
      });

      if (modified) {
        const output = generate(ast, {}, content);
        return await this.formatCode(output.code);
      }
    } catch (error) {
      console.warn('⚠️ AST modification failed, falling back to LLM:', error);
    }

    // Fallback to LLM if AST manipulation fails
    return await this.generateWithLLM(filePath, content, modifications, projectStructure);
  }

  /**
   * Modify style files (CSS/SCSS)
   */
  private async modifyStyleFile(
    filePath: string,
    content: string,
    modifications: CodeModification[]
  ): Promise<string> {
    console.log('🎨 Modifying style file:', filePath);
    
    let modifiedContent = content;

    for (const mod of modifications) {
      if (mod.type === 'replace' && mod.oldContent && mod.newContent) {
        modifiedContent = modifiedContent.replace(mod.oldContent, mod.newContent);
      } else if (mod.type === 'insert' && mod.newContent) {
        if (mod.location.line) {
          const lines = modifiedContent.split('\n');
          lines.splice(mod.location.line - 1, 0, mod.newContent);
          modifiedContent = lines.join('\n');
        } else {
          modifiedContent += '\n' + mod.newContent;
        }
      }
    }

    return modifiedContent;
  }

  /**
   * Modify generic files with simple string operations
   */
  private async modifyGenericFile(
    _filePath: string,
    content: string,
    modifications: CodeModification[]
  ): Promise<string> {
    let modifiedContent = content;

    for (const mod of modifications) {
      if (mod.type === 'replace' && mod.oldContent && mod.newContent) {
        modifiedContent = modifiedContent.replace(mod.oldContent, mod.newContent);
      }
    }

    return modifiedContent;
  }

  /**
   * Generate code using LLM assistance
   */
  private async generateWithLLM(
    _filePath: string,
    currentContent: string,
    modifications: CodeModification[],
    projectStructure: ProjectStructure
  ): Promise<string> {
    const prompt = this.buildCodeGenerationPrompt(_filePath, currentContent, modifications, projectStructure);
    const response = await this.llmProvider.generateText(prompt);
    
    // Extract code from LLM response
    const codeMatch = response.match(/```(?:tsx?|jsx?|javascript|typescript)?\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1]) {
      return await this.formatCode(codeMatch[1]);
    }
    
    // If no code block found, assume the entire response is code
    return await this.formatCode(response);
  }

  /**
   * Build LLM prompt for code generation
   */
  private buildCodeGenerationPrompt(
    filePath: string,
    currentContent: string,
    modifications: CodeModification[],
    projectStructure: ProjectStructure
  ): string {
    const modificationsDescription = modifications.map(mod => 
      `- ${mod.type}: ${mod.oldContent || 'N/A'} → ${mod.newContent || 'N/A'} ${mod.location.line ? `(line ${mod.location.line})` : ''}`
    ).join('\n');

    return `You are an expert ${projectStructure.framework} developer. Modify this component file according to the specified changes.

**File:** ${filePath}
**Framework:** ${projectStructure.framework}
**Styling System:** ${projectStructure.stylingSystem}
**Build System:** ${projectStructure.buildSystem}

**Current Code:**
\`\`\`tsx
${currentContent}
\`\`\`

**Required Modifications:**
${modificationsDescription}

**Instructions:**
1. Apply the specified modifications to the code
2. Maintain all existing functionality
3. Follow ${projectStructure.framework} best practices
4. Use the project's ${projectStructure.stylingSystem} styling approach
5. Ensure the code is syntactically correct and properly formatted
6. Preserve all imports and exports
7. Keep the same component structure unless explicitly changing it

**Return only the complete modified code without explanation:**`;
  }

  /**
   * Format code using Prettier
   */
  private async formatCode(code: string): Promise<string> {
    try {
      const formatted = await prettier.format(code, {
        parser: 'typescript',
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5'
      });
      return formatted;
    } catch (error) {
      console.warn('⚠️ Code formatting failed:', error);
      return code; // Return unformatted code if formatting fails
    }
  }

  /**
   * Generate diff between old and new content
   */
  private generateDiff(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    // Simple diff generation (could be enhanced with a proper diff library)
    const diff: string[] = [];
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];
      
      if (oldLine !== newLine) {
        if (oldLine && !newLine) {
          diff.push(`-${oldLine}`);
        } else if (!oldLine && newLine) {
          diff.push(`+${newLine}`);
        } else if (oldLine && newLine) {
          diff.push(`-${oldLine}`);
          diff.push(`+${newLine}`);
        }
      }
    }
    
    return diff.join('\n');
  }

  /**
   * Create execution plan from strategic decisions
   */
  async createExecutionPlan(
    changeIntents: ChangeIntent[],
    styleImpact: StyleImpactAnalysis,
    _projectStructure: ProjectStructure
  ): Promise<ExecutionPlan> {
    console.log('📋 Creating execution plan...');

    const steps = await this.createExecutionSteps(changeIntents, styleImpact);
    
    const branchName = this.generateBranchName(changeIntents);
    const estimatedDuration = this.estimateDuration(changeIntents);

    return {
      id: `plan-${Date.now()}`,
      changeAnalysis: {
        changeIntents,
        complexity: this.calculateComplexity(changeIntents),
        affectedComponents: changeIntents.map(intent => intent.targetComponent.name),
        estimatedChanges: changeIntents.length
      },
      styleImpactAnalysis: styleImpact,
      prStrategy: {
        numberOfPRs: 1,
        prGroups: [{
          id: 'main-pr',
          title: 'Visual Design Updates',
          description: `Apply ${changeIntents.length} visual changes`,
          changes: changeIntents,
          priority: 'medium',
          dependencies: []
        }],
        strategy: 'single',
        reasoning: 'Single PR for related visual changes',
        totalComplexity: changeIntents.reduce((sum, intent) => sum + intent.complexity, 0)
      },
      steps,
      branchName,
      estimatedDuration
    };
  }

  /**
   * Create execution steps from change intents
   */
  private async createExecutionSteps(
    changeIntents: ChangeIntent[],
    _styleImpact: StyleImpactAnalysis
  ): Promise<any[]> {
    const steps: any[] = [];
    
    for (const intent of changeIntents) {
      // Determine if we need to modify the component file or create/modify style files
      if (intent.implementationStrategy.approach === 'inline') {
        steps.push({
          id: `modify-${intent.id}`,
          type: 'file-modify',
          description: `Apply inline styles to ${intent.targetComponent.name}`,
          targetFile: intent.targetComponent.filePath,
          action: {
            type: 'modify',
            filePath: intent.targetComponent.filePath,
            modifications: this.createModificationsFromIntent(intent)
          },
          dependencies: []
        });
      } else if (intent.implementationStrategy.approach === 'css-file') {
        // Create or modify CSS file
        const cssFile = this.determineCSSFile(intent, _styleImpact);
        steps.push({
          id: `modify-css-${intent.id}`,
          type: 'file-modify',
          description: `Update CSS for ${intent.description}`,
          targetFile: cssFile,
          action: {
            type: 'modify',
            filePath: cssFile,
            modifications: this.createCSSModifications(intent)
          },
          dependencies: []
        });
      }
    }

    return steps;
  }

  /**
   * Create code modifications from change intent
   */
  private createModificationsFromIntent(intent: ChangeIntent): CodeModification[] {
    return intent.changes.map(change => ({
      type: 'replace' as const,
      location: { selector: `[data-property="${change.property}"]` },
      oldContent: change.before,
      newContent: change.after
    }));
  }

  /**
   * Create CSS modifications from change intent
   */
  private createCSSModifications(intent: ChangeIntent): CodeModification[] {
    return intent.changes.map(change => ({
      type: 'replace' as const,
      location: { line: 1 }, // TODO: Better CSS location detection
      oldContent: `${change.property}: ${change.before}`,
      newContent: `${change.property}: ${change.after}`
    }));
  }

  /**
   * Determine which CSS file to modify
   */
  private determineCSSFile(intent: ChangeIntent, _styleImpact: StyleImpactAnalysis): string {
    // Use existing style files from the component
    if (intent.targetComponent.styling.styleFiles.length > 0) {
      return intent.targetComponent.styling.styleFiles[0];
    }
    
    // Create new CSS file based on component name
    return `src/styles/${intent.targetComponent.name || 'Component'}.css`;
  }

  /**
   * Generate branch name from change intents
   */
  private generateBranchName(changeIntents: ChangeIntent[]): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const description = changeIntents.length === 1 
      ? (changeIntents[0]?.description || 'visual-change').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30)
      : `${changeIntents.length}-visual-changes`;
    
    return `agent/${timestamp}-${description}`;
  }

  /**
   * Estimate duration in minutes
   */
  private estimateDuration(changeIntents: ChangeIntent[]): number {
    return changeIntents.reduce((sum, intent) => {
      // Base time + complexity factor
      return sum + 2 + (intent.complexity * 5);
    }, 0);
  }

  /**
   * Calculate overall complexity
   */
  private calculateComplexity(changeIntents: ChangeIntent[]): 'simple' | 'medium' | 'complex' {
    const avgComplexity = changeIntents.reduce((sum, intent) => sum + intent.complexity, 0) / changeIntents.length;
    
    if (avgComplexity < 0.3) return 'simple';
    if (avgComplexity < 0.7) return 'medium';
    return 'complex';
  }
}
