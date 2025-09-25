import { Project, SourceFile, SyntaxKind, Node } from 'ts-morph';
import type { SourceHint, PatchResult, PrepareFilesOptions, FileReader, LLMProvider } from './types';

export class InMemoryPatcher {
  private project: Project;
  private fileReader: FileReader | undefined;
  private llmProvider: LLMProvider | undefined;

  constructor(fileReader?: FileReader, llmProvider?: LLMProvider) {
    this.project = new Project({
      useInMemoryFileSystem: true,
    });
    this.fileReader = fileReader;
    this.llmProvider = llmProvider;
  }

  /**
   * Prepares files for intent-based modifications using LLM-powered code generation
   */
  async prepareFilesForIntent(options: PrepareFilesOptions): Promise<PatchResult> {
    const { owner, repo, ref, hints } = options;
    const fileUpdates: Array<{ path: string; newContent: string }> = [];
    let changelogEntry: string | undefined;

    for (const hint of hints) {
      try {
        console.log(`🧠 Processing LLM-powered code change for ${hint.filePath}`);
        
        // Fetch the file content
        const fileContent = await this.readFile(hint.filePath, { owner, repo, ref });
        console.log(`📖 Read file content: ${fileContent.length} characters`);

        // Use LLM to generate code changes if available
        if (this.llmProvider) {
          console.log(`🤖 Using LLM to generate code changes...`);
          
          const llmResult = await this.llmProvider.generateCodeChanges({
            fileContent,
            filePath: hint.filePath,
            intent: hint.intent,
            ...(hint.targetElement && { targetElement: hint.targetElement }),
            context: `This is a ${this.getFileType(hint.filePath)} file. Please apply the requested changes precisely and return the complete modified file content.`
          });

          if (llmResult.success && llmResult.modifiedContent) {
            console.log(`✅ LLM generated modified content: ${llmResult.modifiedContent.length} characters`);
            
            // Only add to file updates if the content actually changed
            if (llmResult.modifiedContent !== fileContent) {
              fileUpdates.push({
                path: hint.filePath,
                newContent: llmResult.modifiedContent,
              });
              console.log(`📝 Added file update for ${hint.filePath}`);
            } else {
              console.log(`ℹ️ No changes needed for ${hint.filePath}`);
            }
          } else {
            console.warn(`❌ LLM failed to generate changes: ${llmResult.error}`);
            // Fallback to deterministic approach
            const fallbackResult = await this.applyDeterministicChanges(fileContent, hint);
            if (fallbackResult !== fileContent) {
              fileUpdates.push({
                path: hint.filePath,
                newContent: fallbackResult,
              });
            } else {
              // Fallback to changelog entry
              if (!changelogEntry) {
                changelogEntry = this.generateChangelogEntry(hints);
              }
            }
          }
        } else {
          console.log(`🔧 No LLM provider available, using deterministic approach`);
          // Fallback to deterministic approach
          const fallbackResult = await this.applyDeterministicChanges(fileContent, hint);
          if (fallbackResult !== fileContent) {
            fileUpdates.push({
              path: hint.filePath,
              newContent: fallbackResult,
            });
          } else {
            // Fallback to changelog entry
            if (!changelogEntry) {
              changelogEntry = this.generateChangelogEntry(hints);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to process file ${hint.filePath}:`, error);
        // Continue processing other files
      }
    }

    const result: PatchResult = {
      fileUpdates,
    };

    if (fileUpdates.length === 0 && changelogEntry) {
      result.changelogEntry = changelogEntry;
    }

    console.log(`🔧 InMemoryPatcher result: ${fileUpdates.length} file updates, changelog: ${changelogEntry ? 'yes' : 'no'}`);
    return result;
  }

  /**
   * Gets the file type based on extension
   */
  private getFileType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'React/JSX';
      case 'ts':
        return 'TypeScript';
      case 'js':
        return 'JavaScript';
      case 'vue':
        return 'Vue';
      case 'svelte':
        return 'Svelte';
      default:
        return 'source code';
    }
  }

  /**
   * Applies deterministic changes (fallback when LLM is not available)
   */
  private async applyDeterministicChanges(fileContent: string, hint: SourceHint): Promise<string> {
    // Add file to in-memory project for AST manipulation
    const sourceFile = this.project.createSourceFile(hint.filePath, fileContent, { overwrite: true });

    // Determine if this is a Tailwind-compatible file
    if (this.isTailwindCompatible(sourceFile, hint)) {
      return await this.applyTailwindChanges(sourceFile, hint);
    }

    // No changes could be applied deterministically
    return fileContent;
  }

  /**
   * Determines if a file is compatible with Tailwind modifications
   */
  private isTailwindCompatible(sourceFile: SourceFile, hint: SourceHint): boolean {
    // Check if file is a React/JSX file
    const isReactFile = sourceFile.getFilePath().match(/\.(tsx|jsx)$/i) !== null;
    
    if (!isReactFile) {
      return false;
    }

    // Check if file contains JSX elements with className attributes
    const hasClassNames = this.findJSXElementsWithClassName(sourceFile).length > 0;
    
    // Check if hint specifies Tailwind changes
    const hasTailwindChanges = Boolean(hint.tailwindChanges && Object.keys(hint.tailwindChanges).length > 0);

    return hasClassNames && hasTailwindChanges;
  }

  /**
   * Applies Tailwind utility class changes to JSX elements
   */
  private async applyTailwindChanges(sourceFile: SourceFile, hint: SourceHint): Promise<string> {
    const jsxElements = this.findJSXElementsWithClassName(sourceFile);
    
    if (jsxElements.length === 0) {
      return sourceFile.getFullText();
    }

    // If a specific target element is specified, filter to that element
    let targetElements = jsxElements;
    if (hint.targetElement) {
      targetElements = jsxElements.filter(element => 
        this.matchesTargetElement(element, hint.targetElement!)
      );
    }

    // Apply Tailwind changes to each target element
    for (const element of targetElements) {
      this.modifyTailwindClasses(element, hint.tailwindChanges || {});
    }

    return sourceFile.getFullText();
  }

  /**
   * Finds JSX elements with className attributes
   */
  private findJSXElementsWithClassName(sourceFile: SourceFile): Node[] {
    const jsxElements: Node[] = [];

    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.JsxOpeningElement || node.getKind() === SyntaxKind.JsxSelfClosingElement) {
        const attributes = node.getChildren().find(child => child.getKind() === SyntaxKind.JsxAttributes);
        if (attributes) {
          const hasClassName = attributes.getChildren().some(attr => {
            if (attr.getKind() === SyntaxKind.JsxAttribute) {
              const nameNode = attr.getChildren().find(child => child.getKind() === SyntaxKind.Identifier);
              return nameNode?.getText() === 'className';
            }
            return false;
          });
          
          if (hasClassName) {
            jsxElements.push(node);
          }
        }
      }
    });

    return jsxElements;
  }

  /**
   * Checks if a JSX element matches the target element specification
   */
  private matchesTargetElement(element: Node, targetElement: string): boolean {
    // Simple matching by tag name for now
    // In a more sophisticated implementation, this could support CSS selectors or other patterns
    const tagName = this.getJSXElementTagName(element);
    return tagName === targetElement;
  }

  /**
   * Gets the tag name of a JSX element
   */
  private getJSXElementTagName(element: Node): string {
    const identifier = element.getChildren().find(child => child.getKind() === SyntaxKind.Identifier);
    return identifier?.getText() || '';
  }

  /**
   * Modifies Tailwind classes on a JSX element
   */
  private modifyTailwindClasses(element: Node, changes: Record<string, string | undefined>): void {
    const attributes = element.getChildren().find(child => child.getKind() === SyntaxKind.JsxAttributes);
    if (!attributes) return;

    const classNameAttr = attributes.getChildren().find(attr => {
      if (attr.getKind() === SyntaxKind.JsxAttribute) {
        const nameNode = attr.getChildren().find(child => child.getKind() === SyntaxKind.Identifier);
        return nameNode?.getText() === 'className';
      }
      return false;
    });

    if (!classNameAttr) return;

    // Find the string literal containing the class names
    const stringLiteral = classNameAttr.getChildren().find(child => 
      child.getKind() === SyntaxKind.StringLiteral || child.getKind() === SyntaxKind.JsxExpression
    );

    if (!stringLiteral) return;

    let currentClasses = '';
    if (stringLiteral.getKind() === SyntaxKind.StringLiteral) {
      currentClasses = stringLiteral.getText().slice(1, -1); // Remove quotes
    } else if (stringLiteral.getKind() === SyntaxKind.JsxExpression) {
      // Handle template literals or expressions - simplified for now
      const expression = stringLiteral.getChildren().find(child => 
        child.getKind() === SyntaxKind.StringLiteral || child.getKind() === SyntaxKind.TemplateExpression
      );
      if (expression && expression.getKind() === SyntaxKind.StringLiteral) {
        currentClasses = expression.getText().slice(1, -1);
      }
    }

    const newClasses = this.applyTailwindUtilityChanges(currentClasses, changes);
    
    if (newClasses !== currentClasses) {
      // Replace the class string
      if (stringLiteral.getKind() === SyntaxKind.StringLiteral) {
        stringLiteral.replaceWithText(`"${newClasses}"`);
      }
    }
  }

  /**
   * Applies Tailwind utility changes to a class string
   */
  private applyTailwindUtilityChanges(currentClasses: string, changes: Record<string, string | undefined>): string {
    const classes = currentClasses.split(/\s+/).filter(cls => cls.length > 0);
    const newClasses = [...classes];

    // Apply each type of change
    for (const [changeType, newValue] of Object.entries(changes)) {
      if (!newValue) continue;

      switch (changeType) {
        case 'fontSize':
          this.replaceTailwindUtility(newClasses, /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/, `text-${newValue}`);
          break;
        case 'spacing':
          // Handle padding and margin
          this.replaceTailwindUtility(newClasses, /^[pm][trblxy]?-\d+(\.\d+)?$/, `p-${newValue}`);
          break;
        case 'colors':
          // Handle text and background colors
          this.replaceTailwindUtility(newClasses, /^(text|bg)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/, `text-${newValue}`);
          break;
        case 'radius':
          this.replaceTailwindUtility(newClasses, /^rounded(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/, `rounded-${newValue}`);
          break;
        default:
          // Custom utility - add if not present
          if (!newClasses.includes(newValue)) {
            newClasses.push(newValue);
          }
          break;
      }
    }

    return newClasses.join(' ');
  }

  /**
   * Replaces Tailwind utility classes matching a pattern
   */
  private replaceTailwindUtility(classes: string[], pattern: RegExp, replacement: string): void {
    const existingIndex = classes.findIndex(cls => pattern.test(cls));
    if (existingIndex >= 0) {
      classes[existingIndex] = replacement;
    } else {
      classes.push(replacement);
    }
  }

  /**
   * Generates a changelog entry for non-Tailwind changes
   */
  private generateChangelogEntry(hints: SourceHint[]): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const changes = hints.map(hint => `- ${hint.intent} in ${hint.filePath}`).join('\n');
    
    return `## ${timestamp}\n\n### Changes\n${changes}\n\nNote: Some changes could not be automatically applied and require manual review.\n`;
  }

  /**
   * Reads a file from the repository using the injected file reader
   */
  private async readFile(filePath: string, options: { owner: string; repo: string; ref: string }): Promise<string> {
    if (!this.fileReader) {
      throw new Error(`File reading not implemented. No file reader provided to InMemoryPatcher. Would read ${filePath} from ${options.owner}/${options.repo}@${options.ref}`);
    }
    
    return this.fileReader.readFile({
      owner: options.owner,
      repo: options.repo,
      path: filePath,
      ref: options.ref
    });
  }
}
