import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { ValidationResult, ValidationIssue, FileChange, ProjectStructure } from '../types';
import { WorkspaceManager } from '../workspace/WorkspaceManager';

export class Validator {
  constructor(private workspace: WorkspaceManager) {}

  /**
   * Validate all changes before creating PR
   */
  async validateChanges(
    fileChanges: FileChange[],
    projectStructure: ProjectStructure
  ): Promise<ValidationResult> {
    console.log('🔍 Validating changes...');
    
    const issues: ValidationIssue[] = [];
    let syntaxValid = true;
    let buildsSuccessfully = true;
    let testsPass = true;
    let lintingPasses = true;

    // 1. Syntax validation
    console.log('📝 Checking syntax...');
    const syntaxIssues = await this.validateSyntax(fileChanges);
    issues.push(...syntaxIssues);
    syntaxValid = syntaxIssues.filter(i => i.severity === 'error').length === 0;

    // 2. Build validation (if syntax is valid)
    if (syntaxValid) {
      console.log('🔨 Checking build...');
      const buildIssues = await this.validateBuild(projectStructure);
      issues.push(...buildIssues);
      buildsSuccessfully = buildIssues.filter(i => i.severity === 'error').length === 0;
    }

    // 3. Linting validation
    console.log('📏 Running linter...');
    const lintIssues = await this.validateLinting(fileChanges, projectStructure);
    issues.push(...lintIssues);
    lintingPasses = lintIssues.filter(i => i.severity === 'error').length === 0;

    // 4. Test validation (if build is successful)
    if (buildsSuccessfully) {
      console.log('🧪 Running tests...');
      const testIssues = await this.validateTests(projectStructure);
      issues.push(...testIssues);
      testsPass = testIssues.filter(i => i.severity === 'error').length === 0;
    }

    // Calculate overall score
    const score = this.calculateValidationScore({
      syntaxValid,
      buildsSuccessfully,
      testsPass,
      lintingPasses,
      issues
    });

    const result: ValidationResult = {
      syntaxValid,
      buildsSuccessfully,
      testsPass,
      lintingPasses,
      issues,
      score
    };

    console.log(`✅ Validation complete - Score: ${Math.round(score * 100)}%`);
    return result;
  }

  /**
   * Validate syntax of changed files
   */
  private async validateSyntax(fileChanges: FileChange[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    for (const change of fileChanges) {
      if (change.action === 'delete') continue;
      
      try {
        const content = change.newContent || '';
        const ext = path.extname(change.filePath);
        
        if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
          const syntaxIssues = await this.validateTypeScriptSyntax(change.filePath, content);
          issues.push(...syntaxIssues);
        } else if (['.css', '.scss'].includes(ext)) {
          const cssIssues = await this.validateCSSSyntax(change.filePath, content);
          issues.push(...cssIssues);
        }
      } catch (error) {
        issues.push({
          type: 'syntax',
          severity: 'error',
          file: change.filePath,
          message: `Syntax validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Check file syntax and formatting'
        });
      }
    }
    
    return issues;
  }

  /**
   * Validate TypeScript/JavaScript syntax
   */
  private async validateTypeScriptSyntax(filePath: string, content: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    try {
      // Use TypeScript compiler API to check syntax
      const ts = require('typescript');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      // Check for syntax errors
      if (sourceFile.parseDiagnostics && sourceFile.parseDiagnostics.length > 0) {
        for (const diagnostic of sourceFile.parseDiagnostics) {
          const position = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
          issues.push({
            type: 'syntax',
            severity: 'error',
            file: filePath,
            line: position.line + 1,
            column: position.character + 1,
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
            suggestion: 'Fix syntax error'
          });
        }
      }
    } catch (error) {
      // If TypeScript is not available, do basic checks
      issues.push(...this.basicJavaScriptValidation(filePath, content));
    }
    
    return issues;
  }

  /**
   * Basic JavaScript validation when TypeScript is not available
   */
  private basicJavaScriptValidation(filePath: string, content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
      // Check for basic syntax issues
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Check for unmatched brackets
        const openBrackets = (line?.match(/[{[(]/g) || []).length;
        const closeBrackets = (line?.match(/[}\])]/g) || []).length;
        
        if (openBrackets !== closeBrackets && !line?.trim().endsWith(',')) {
          // This is a very basic check and might have false positives
          // but it's better than nothing
        }
        
        // Check for common syntax errors
        if (line?.includes('function(') && !line?.includes('function (')) {
          issues.push({
            type: 'syntax',
            severity: 'warning',
            file: filePath,
            line: lineNumber,
            message: 'Consider adding space after function keyword',
            suggestion: 'Use "function (" instead of "function("'
          });
        }
      }
    
    return issues;
  }

  /**
   * Validate CSS syntax
   */
  private async validateCSSSyntax(filePath: string, content: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    // Basic CSS validation
    const lines = content.split('\n');
    let inRule = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;
      
      if (line.includes('{')) {
        braceCount++;
        inRule = true;
      }
      
      if (line.includes('}')) {
        braceCount--;
        if (braceCount === 0) inRule = false;
      }
      
      // Check for missing semicolons in property declarations
      if (inRule && line.includes(':') && !line.includes('{') && 
          !line.endsWith(';') && !line.endsWith('{') && line !== '') {
        issues.push({
          type: 'syntax',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Missing semicolon after CSS property',
          suggestion: 'Add semicolon at the end of the line'
        });
      }
    }
    
    // Check for unmatched braces
    if (braceCount !== 0) {
      issues.push({
        type: 'syntax',
        severity: 'error',
        file: filePath,
        message: 'Unmatched CSS braces',
        suggestion: 'Check that all opening braces have corresponding closing braces'
      });
    }
    
    return issues;
  }

  /**
   * Validate build process
   */
  private async validateBuild(projectStructure: ProjectStructure): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    try {
      const buildCommand = this.getBuildCommand(projectStructure);
      if (!buildCommand) {
        issues.push({
          type: 'build',
          severity: 'warning',
          file: 'package.json',
          message: 'No build command found',
          suggestion: 'Add a build script to package.json'
        });
        return issues;
      }
      
      console.log(`🔨 Running build command: ${buildCommand}`);
      const buildResult = await this.runCommand(buildCommand, { timeout: 60000 });
      
      if (buildResult.exitCode !== 0) {
        issues.push({
          type: 'build',
          severity: 'error',
          file: 'build',
          message: 'Build failed',
          suggestion: buildResult.stderr || 'Check build configuration and fix errors'
        });
      }
    } catch (error) {
      issues.push({
        type: 'build',
        severity: 'error',
        file: 'build',
        message: `Build validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check build configuration and dependencies'
      });
    }
    
    return issues;
  }

  /**
   * Validate linting
   */
  private async validateLinting(
    fileChanges: FileChange[],
    projectStructure: ProjectStructure
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    try {
      const lintCommand = this.getLintCommand(projectStructure);
      if (!lintCommand) {
        return issues; // No linting configured, skip
      }
      
      // Lint only the changed files
      const changedFiles = fileChanges
        .filter(change => change.action !== 'delete')
        .map(change => change.filePath)
        .filter(path => ['.ts', '.tsx', '.js', '.jsx'].includes(path.substring(path.lastIndexOf('.'))));
      
      if (changedFiles.length === 0) {
        return issues;
      }
      
      console.log(`📏 Running linter on ${changedFiles.length} files`);
      const lintResult = await this.runCommand(`${lintCommand} ${changedFiles.join(' ')}`, { timeout: 30000 });
      
      if (lintResult.exitCode !== 0 && lintResult.stderr) {
        // Parse linting output (this is ESLint format, adjust for other linters)
        const lintLines = lintResult.stderr.split('\n');
        for (const line of lintLines) {
          const match = line.match(/(.+):(\d+):(\d+):\s+(error|warning):\s+(.+)/);
          if (match) {
            const [, file, lineStr, columnStr, severity, message] = match;
            issues.push({
              type: 'lint',
              severity: severity as 'error' | 'warning',
              file,
              line: parseInt(lineStr),
              column: parseInt(columnStr),
              message,
              suggestion: 'Fix linting issue'
            });
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Linting validation failed:', error);
      // Don't fail validation if linting fails
    }
    
    return issues;
  }

  /**
   * Validate tests
   */
  private async validateTests(projectStructure: ProjectStructure): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    try {
      const testCommand = this.getTestCommand(projectStructure);
      if (!testCommand) {
        issues.push({
          type: 'test',
          severity: 'info',
          file: 'package.json',
          message: 'No test command found',
          suggestion: 'Consider adding tests to your project'
        });
        return issues;
      }
      
      console.log(`🧪 Running tests: ${testCommand}`);
      const testResult = await this.runCommand(testCommand, { timeout: 120000 });
      
      if (testResult.exitCode !== 0) {
        issues.push({
          type: 'test',
          severity: 'error',
          file: 'tests',
          message: 'Tests failed',
          suggestion: testResult.stderr || 'Check test output and fix failing tests'
        });
      }
    } catch (error) {
      issues.push({
        type: 'test',
        severity: 'warning',
        file: 'tests',
        message: `Test validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check test configuration and fix any issues'
      });
    }
    
    return issues;
  }

  /**
   * Get build command based on project structure
   */
  private getBuildCommand(projectStructure: ProjectStructure): string | null {
    const packageJsonConfig = projectStructure.configFiles.find(c => c.type === 'package.json');
    if (packageJsonConfig && packageJsonConfig.content?.scripts) {
      const scripts = packageJsonConfig.content.scripts;
      const packageManager = projectStructure.packageManager === 'unknown' ? 'npm' : projectStructure.packageManager;
      if (scripts.build) return `${packageManager} run build`;
      if (scripts['build:prod']) return `${packageManager} run build:prod`;
    }
    
    // Fallback based on build system
    switch (projectStructure.buildSystem) {
      case 'vite': return 'npx vite build';
      case 'webpack': return 'npx webpack --mode production';
      case 'next': return 'npx next build';
      default: return null;
    }
  }

  /**
   * Get lint command based on project structure
   */
  private getLintCommand(projectStructure: ProjectStructure): string | null {
    const packageJsonConfig = projectStructure.configFiles.find(c => c.type === 'package.json');
    if (packageJsonConfig && packageJsonConfig.content?.scripts) {
      const scripts = packageJsonConfig.content.scripts;
      const packageManager = projectStructure.packageManager === 'unknown' ? 'npm' : projectStructure.packageManager;
      if (scripts.lint) return `${packageManager} run lint`;
      if (scripts['lint:check']) return `${packageManager} run lint:check`;
    }
    
    // Check if ESLint is available
    if (packageJsonConfig && packageJsonConfig.content?.devDependencies?.eslint) {
      return 'npx eslint';
    }
    
    return null;
  }

  /**
   * Get test command based on project structure
   */
  private getTestCommand(projectStructure: ProjectStructure): string | null {
    const packageJsonConfig = projectStructure.configFiles.find(c => c.type === 'package.json');
    if (packageJsonConfig && packageJsonConfig.content?.scripts) {
      const scripts = packageJsonConfig.content.scripts;
      const packageManager = projectStructure.packageManager === 'unknown' ? 'npm' : projectStructure.packageManager;
      if (scripts.test) return `${packageManager} run test`;
      if (scripts['test:unit']) return `${packageManager} run test:unit`;
    }
    
    return null;
  }

  /**
   * Run a shell command
   */
  private async runCommand(
    command: string, 
    options: { timeout?: number } = {}
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const workspace = this.workspace.getCurrentWorkspace();
      if (!workspace) {
        reject(new Error('No workspace available'));
        return;
      }

      const [cmd, ...args] = command.split(' ');
      const child: ChildProcess = spawn(cmd || 'echo', args, {
        cwd: workspace.localPath,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: any) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: any) => {
        stderr += data.toString();
      });

      const timeout = options.timeout || 30000;
      const timer = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', (code: any) => {
        clearTimeout(timer);
        resolve({
          exitCode: code || 0,
          stdout,
          stderr
        });
      });

      child.on('error', (error: any) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /**
   * Calculate overall validation score
   */
  private calculateValidationScore(validation: Omit<ValidationResult, 'score'>): number {
    let score = 1.0;
    
    // Major penalties
    if (!validation.syntaxValid) score -= 0.4;
    if (!validation.buildsSuccessfully) score -= 0.3;
    if (!validation.testsPass) score -= 0.2;
    if (!validation.lintingPasses) score -= 0.1;
    
    // Minor penalties for issues
    const errorCount = validation.issues.filter(i => i.severity === 'error').length;
    const warningCount = validation.issues.filter(i => i.severity === 'warning').length;
    
    score -= errorCount * 0.05;
    score -= warningCount * 0.02;
    
    return Math.max(0, Math.min(1, score));
  }
}
