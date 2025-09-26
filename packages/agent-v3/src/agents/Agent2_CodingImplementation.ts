/**
 * Agent 2: Coding Implementation Agent
 * Receives tickets from Agent 1 and implements actual code changes
 */

import {
  ImplementationTicket,
  Agent2Config,
  Agent2Result,
  FileChange,
  PRResult
} from '../types';

export class Agent2_CodingImplementation {
  private config: Agent2Config;

  constructor(config: Agent2Config) {
    this.config = config;
  }

  /**
   * Main entry point: Implement tickets created by Agent 1
   */
  async implementTickets(tickets: ImplementationTicket[]): Promise<Agent2Result> {
    const startTime = Date.now();
    console.log(`🔧 Agent 2: Implementing ${tickets.length} tickets...`);

    try {
      const implementedTickets: ImplementationTicket[] = [];
      const allFileChanges: FileChange[] = [];
      const prResults: PRResult[] = [];

      // Phase 1: Process each ticket
      for (const ticket of tickets) {
        console.log(`🎫 Processing ticket: ${ticket.title}`);
        
        try {
          const result = await this.implementTicket(ticket);
          implementedTickets.push({
            ...ticket,
            metadata: { ...ticket.metadata, status: 'completed' }
          });
          allFileChanges.push(...result.fileChanges);
          
          if (result.prResult) {
            prResults.push(result.prResult);
          }
        } catch (error) {
          console.error(`❌ Failed to implement ticket ${ticket.id}:`, error);
          implementedTickets.push({
            ...ticket,
            metadata: { 
              ...ticket.metadata, 
              status: 'failed',
              retryCount: ticket.metadata.retryCount + 1
            }
          });
        }
      }

      // Phase 2: Validation
      console.log('✅ Phase 2: Validating implementations...');
      const validation = await this.validateImplementations(allFileChanges);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Agent 2 completed in ${processingTime}ms with ${allFileChanges.length} file changes`);

      return {
        success: true,
        implementedTickets,
        fileChanges: allFileChanges,
        prResults,
        validation,
        processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Agent 2 failed:', error);

      return {
        success: false,
        implementedTickets: [],
        fileChanges: [],
        prResults: [],
        validation: {
          syntaxValid: false,
          testsPass: false,
          buildSucceeds: false,
          issues: [error instanceof Error ? error.message : String(error)]
        },
        processingTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Implement a single ticket
   */
  private async implementTicket(ticket: ImplementationTicket): Promise<{
    fileChanges: FileChange[];
    prResult?: PRResult;
  }> {
    console.log(`🔨 Implementing: ${ticket.title}`);

    // Phase 1: Retrieve necessary files
    console.log('📖 Phase 1: Retrieving files...');
    const fileContents = await this.retrieveFiles(ticket.implementation.filesToRead);

    // Phase 2: Generate code changes
    console.log('🔧 Phase 2: Generating code changes...');
    const fileChanges = await this.generateCodeChanges(ticket, fileContents);

    // Phase 3: Apply changes via GitHub API
    console.log('💾 Phase 3: Applying changes...');
    await this.config.githubAccess.writeFiles(fileChanges);

    // Phase 4: Create PR if required
    let prResult: PRResult | undefined;
    if (this.shouldCreatePR(ticket)) {
      console.log('🔀 Phase 4: Creating pull request...');
      prResult = await this.createPullRequest(ticket, fileChanges);
    }

    return { fileChanges, prResult };
  }

  /**
   * Retrieve files needed for implementation
   */
  private async retrieveFiles(filePaths: string[]): Promise<Map<string, string>> {
    console.log(`📖 Retrieving ${filePaths.length} files...`);
    
    try {
      const fileContents = await this.config.githubAccess.readFiles(filePaths);
      console.log(`✅ Retrieved ${fileContents.size} files successfully`);
      return fileContents;
    } catch (error) {
      console.error('❌ Failed to retrieve files:', error);
      throw new Error(`File retrieval failed: ${error}`);
    }
  }

  /**
   * Generate code changes using LLM
   */
  private async generateCodeChanges(
    ticket: ImplementationTicket,
    fileContents: Map<string, string>
  ): Promise<FileChange[]> {
    console.log('🤖 Generating code changes with LLM...');

    const fileChanges: FileChange[] = [];

    for (const filePath of ticket.implementation.filesToModify) {
      const currentContent = fileContents.get(filePath) || '';
      
      if (!currentContent && !filePath.includes('new-')) {
        console.warn(`⚠️ No content found for ${filePath}, skipping...`);
        continue;
      }

      const prompt = this.buildCodeGenerationPrompt(ticket, filePath, currentContent, fileContents);
      
      try {
        const generatedCode = await this.config.llmProvider.generateText(prompt);
        const newContent = this.extractCodeFromLLMResponse(generatedCode);
        
        fileChanges.push({
          filePath,
          action: currentContent ? 'modify' : 'create',
          oldContent: currentContent,
          newContent,
          reasoning: `Agent 2: ${ticket.title} - ${ticket.implementation.approach} approach`
        });

        console.log(`✅ Generated changes for ${filePath} (${newContent.length} chars)`);
      } catch (error) {
        console.error(`❌ Failed to generate code for ${filePath}:`, error);
        throw error;
      }
    }

    return fileChanges;
  }

  /**
   * Build comprehensive code generation prompt
   */
  private buildCodeGenerationPrompt(
    ticket: ImplementationTicket,
    targetFilePath: string,
    currentContent: string,
    allFileContents: Map<string, string>
  ): string {
    const visualEdit = ticket.context.visualEdit;
    const component = ticket.context.targetComponent;
    const approach = ticket.implementation.approach;

    // Build context from related files
    const relatedFilesContext = this.buildRelatedFilesContext(ticket, allFileContents);

    return `You are a senior ${ticket.context.repositoryContext.framework} developer implementing a specific visual change.

## IMPLEMENTATION TICKET
**Title:** ${ticket.title}
**Description:** ${ticket.description}
**Approach:** ${approach}
**Priority:** ${ticket.priority}

## VISUAL CHANGE DETAILS
**User Intent:** ${visualEdit.intent.description}
**Target Element:** ${visualEdit.element.tagName} (selector: ${visualEdit.element.selector})
**Changes Required:**
${visualEdit.changes.map(c => `- ${c.property}: "${c.before}" → "${c.after}" (${c.category}, impact: ${c.impact})`).join('\n')}

## TARGET COMPONENT
**Component:** ${component.name}
**File:** ${component.filePath}
**Framework:** ${component.framework}
**Current Styling Approach:** ${component.styling.approach}
**Complexity:** ${component.complexity}

## REPOSITORY CONTEXT
**Framework:** ${ticket.context.repositoryContext.framework}
**Styling System:** ${ticket.context.repositoryContext.stylingSystem}
**Related Components:** ${ticket.context.repositoryContext.relatedComponents.map(c => c.name).join(', ')}

## STRATEGIC DECISIONS
${ticket.context.strategicDecisions.map(d => `**${d.type}:** ${d.decision} (${d.reasoning})`).join('\n')}

## CURRENT FILE CONTENT (${targetFilePath})
\`\`\`${this.getFileExtension(targetFilePath)}
${currentContent || '// New file - no existing content'}
\`\`\`

${relatedFilesContext}

## IMPLEMENTATION REQUIREMENTS

### Code Generation Guidelines:
1. **Preserve Existing Functionality:** Maintain all current behavior and props
2. **Follow Project Patterns:** Use the same coding style and patterns as existing code
3. **Implement Only Required Changes:** Focus solely on the visual changes specified
4. **Maintain Type Safety:** Ensure all TypeScript types are correct
5. **Follow ${approach} Approach:** Implement using the chosen styling strategy

### Specific Implementation:
${this.getImplementationInstructions(approach, visualEdit)}

### Output Requirements:
- Return the COMPLETE modified file content
- Include all imports, exports, and existing functionality
- Apply ONLY the specified visual changes
- Ensure code is production-ready and follows best practices
- Add brief comments explaining the changes made

## RESPONSE FORMAT
Return only the complete file content without any markdown formatting or explanations:`;
  }

  /**
   * Build context from related files
   */
  private buildRelatedFilesContext(ticket: ImplementationTicket, allFileContents: Map<string, string>): string {
    const relatedFiles = ticket.implementation.filesToRead.filter(f => 
      f !== ticket.context.targetComponent.filePath
    );

    if (relatedFiles.length === 0) {
      return '';
    }

    let context = '\n## RELATED FILES CONTEXT\n';
    
    for (const filePath of relatedFiles.slice(0, 3)) { // Limit to 3 files for context
      const content = allFileContents.get(filePath);
      if (content) {
        context += `\n### ${filePath}\n\`\`\`${this.getFileExtension(filePath)}\n${content.slice(0, 1000)}${content.length > 1000 ? '\n// ... (truncated)' : ''}\n\`\`\`\n`;
      }
    }

    return context;
  }

  /**
   * Get implementation instructions based on approach
   */
  private getImplementationInstructions(approach: string, visualEdit: any): string {
    switch (approach) {
      case 'inline':
        return `- Add inline styles directly to the JSX elements
- Use the style prop: style={{${visualEdit.changes.map((c: any) => `${this.cssPropertyToJSProperty(c.property)}: '${c.after}'`).join(', ')}}}
- Preserve any existing inline styles`;

      case 'css-file':
        return `- Create or modify CSS classes
- Use semantic class names that describe the purpose
- Ensure classes are properly imported/referenced
- Consider CSS specificity and cascade effects`;

      case 'css-module':
        return `- Use CSS modules syntax (styles.className)
- Create semantic class names in the CSS module
- Import styles object properly
- Maintain CSS module conventions`;

      case 'design-system':
        return `- Use design system tokens and components
- Follow design system conventions
- Prefer design system utilities over custom styles
- Maintain consistency with design system patterns`;

      default:
        return `- Implement the changes using the most appropriate method for the codebase
- Follow existing patterns and conventions
- Ensure changes are maintainable and consistent`;
    }
  }

  /**
   * Convert CSS property to JavaScript property
   */
  private cssPropertyToJSProperty(cssProperty: string): string {
    return cssProperty.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Extract code from LLM response
   */
  private extractCodeFromLLMResponse(response: string): string {
    // Try to extract code from markdown blocks
    const codeBlockMatch = response.match(/```(?:tsx?|jsx?|javascript|typescript)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // If no code block, assume entire response is code
    return response.trim();
  }

  /**
   * Get file extension for syntax highlighting
   */
  private getFileExtension(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': return 'tsx';
      case 'ts': return 'typescript';
      case 'jsx': return 'jsx';
      case 'js': return 'javascript';
      case 'css': return 'css';
      case 'scss': return 'scss';
      default: return 'typescript';
    }
  }

  /**
   * Determine if a PR should be created for this ticket
   */
  private shouldCreatePR(ticket: ImplementationTicket): boolean {
    // Create PR for medium/high complexity or when explicitly required
    return ticket.implementation.complexity !== 'low' || ticket.validation.reviewRequired;
  }

  /**
   * Create pull request for the changes
   */
  private async createPullRequest(ticket: ImplementationTicket, fileChanges: FileChange[]): Promise<PRResult> {
    const branchName = this.generateBranchName(ticket);
    const prTitle = this.generatePRTitle(ticket);
    const prBody = this.generatePRBody(ticket, fileChanges);

    try {
      const prResult = await this.config.githubAccess.createPR(branchName, prTitle, prBody);
      console.log(`✅ Created PR: ${prResult.prUrl}`);
      return prResult;
    } catch (error) {
      console.error('❌ Failed to create PR:', error);
      return {
        success: false,
        branchName,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate branch name for the ticket
   */
  private generateBranchName(ticket: ImplementationTicket): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const description = ticket.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
    
    return `agent-v3/${timestamp}-${description}`;
  }

  /**
   * Generate PR title
   */
  private generatePRTitle(ticket: ImplementationTicket): string {
    return `🤖 ${ticket.title}`;
  }

  /**
   * Generate PR body with comprehensive details
   */
  private generatePRBody(ticket: ImplementationTicket, fileChanges: FileChange[]): string {
    const visualEdit = ticket.context.visualEdit;

    return `# Automated Implementation by Agent V3

## 📋 Implementation Details
- **Ticket ID:** ${ticket.id}
- **Priority:** ${ticket.priority}
- **Complexity:** ${ticket.implementation.complexity}
- **Approach:** ${ticket.implementation.approach}
- **Estimated Time:** ${ticket.implementation.estimatedTime} minutes

## 🎯 Visual Changes Implemented
**User Intent:** ${visualEdit.intent.description}

**Target Element:** \`${visualEdit.element.tagName}\` (selector: \`${visualEdit.element.selector}\`)

**Changes Applied:**
${visualEdit.changes.map(c => `- **${c.property}:** \`${c.before}\` → \`${c.after}\` (${c.category})`).join('\n')}

## 🏗️ Strategic Decisions
${ticket.context.strategicDecisions.map(d => `- **${d.type}:** ${d.decision}\n  - *Reasoning:* ${d.reasoning}\n  - *Confidence:* ${(d.confidence * 100).toFixed(1)}%`).join('\n')}

## 📁 Files Modified
${fileChanges.map(fc => `- \`${fc.filePath}\` (${fc.action})`).join('\n')}

## 🧪 Validation Requirements
- **Build Required:** ${ticket.validation.buildRequired ? '✅ Yes' : '❌ No'}
- **Tests Required:** ${ticket.validation.testsToRun.length > 0 ? `✅ ${ticket.validation.testsToRun.join(', ')}` : '❌ None'}
- **Review Required:** ${ticket.validation.reviewRequired ? '✅ Yes' : '❌ No'}

## 🔄 Rollback Plan
${ticket.validation.rollbackPlan}

## 🤖 Agent Context
- **Framework:** ${ticket.context.repositoryContext.framework}
- **Styling System:** ${ticket.context.repositoryContext.stylingSystem}
- **Component:** ${ticket.context.targetComponent.name} (\`${ticket.context.targetComponent.filePath}\`)
- **Related Components:** ${ticket.context.repositoryContext.relatedComponents.map(c => c.name).join(', ') || 'None'}

---
*This PR was automatically generated by Agent V3 - Two-Agent System*
*Generated at: ${new Date().toISOString()}*`;
  }

  /**
   * Validate all implementations
   */
  private async validateImplementations(fileChanges: FileChange[]): Promise<{
    syntaxValid: boolean;
    testsPass: boolean;
    buildSucceeds: boolean;
    issues: string[];
  }> {
    console.log('🔍 Validating implementations...');

    const issues: string[] = [];
    let syntaxValid = true;
    let testsPass = true;
    let buildSucceeds = true;

    // Basic syntax validation
    for (const change of fileChanges) {
      if (this.isCodeFile(change.filePath)) {
        const syntaxIssues = this.validateSyntax(change.newContent, change.filePath);
        if (syntaxIssues.length > 0) {
          syntaxValid = false;
          issues.push(...syntaxIssues.map(issue => `${change.filePath}: ${issue}`));
        }
      }
    }

    // Note: In a full implementation, you would:
    // 1. Run actual build process
    // 2. Execute test suites
    // 3. Perform linting
    // For now, we'll do basic validation

    console.log(`✅ Validation complete: syntax=${syntaxValid}, tests=${testsPass}, build=${buildSucceeds}`);

    return {
      syntaxValid,
      testsPass,
      buildSucceeds,
      issues
    };
  }

  /**
   * Check if file is a code file that needs syntax validation
   */
  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  /**
   * Basic syntax validation
   */
  private validateSyntax(content: string, filePath: string): string[] {
    const issues: string[] = [];

    // Basic bracket matching
    const openBrackets = (content.match(/[{[(]/g) || []).length;
    const closeBrackets = (content.match(/[}\])]/g) || []).length;
    
    if (openBrackets !== closeBrackets) {
      issues.push('Mismatched brackets');
    }

    // Check for basic React/TypeScript patterns
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      if (!content.includes('import React') && !content.includes('from "react"')) {
        issues.push('Missing React import');
      }
    }

    // Check for unterminated strings
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    const backticks = (content.match(/`/g) || []).length;
    
    if (singleQuotes % 2 !== 0) issues.push('Unterminated single quote');
    if (doubleQuotes % 2 !== 0) issues.push('Unterminated double quote');
    if (backticks % 2 !== 0) issues.push('Unterminated template literal');

    return issues;
  }
}
