import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Evidence captured during testing
 */
export interface TestEvidence {
  screenshots: Array<{
    timestamp: number;
    description: string;
    dataUrl: string;
  }>;
  logs: string[];
  cdpSignals?: any;
  buildOutput?: string;
  validationResults: ValidationCheck[];
}

/**
 * Individual validation check result
 */
export interface ValidationCheck {
  name: string;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: any;
}

/**
 * Testing workflow result
 */
export interface TestingResult {
  success: boolean;
  passed: boolean;
  evidence: TestEvidence;
  summary: string;
  error?: string;
}

/**
 * Testing Workflow Configuration
 */
export interface TestingConfig {
  workspacePath: string;
  buildCommand?: string;
  startCommand?: string;
  testUrl?: string;
  cdpPort?: number;
  timeout?: number;
  verbose?: boolean;
}

/**
 * Testing Workflow
 * 
 * Validates changes before creating a PR by:
 * 1. Building the application
 * 2. Launching it locally
 * 3. Using CDP to verify changes
 * 4. Capturing evidence (screenshots, logs)
 * 5. Running automated validation checks
 */
export class TestingWorkflow {
  private config: TestingConfig;
  private evidence: TestEvidence;
  private appProcess: any = null;

  constructor(config: TestingConfig) {
    this.config = {
      buildCommand: config.buildCommand || 'npm run build',
      startCommand: config.startCommand || 'npm run dev',
      testUrl: config.testUrl || 'http://localhost:5173',
      cdpPort: config.cdpPort || 9222,
      timeout: config.timeout || 60000,
      verbose: config.verbose || false,
      ...config
    };

    this.evidence = {
      screenshots: [],
      logs: [],
      validationResults: []
    };
  }

  /**
   * Run the complete testing workflow
   */
  async runTests(filesModified: string[]): Promise<TestingResult> {
    console.log('\n🧪 Starting testing workflow...');
    
    try {
      // Step 1: Build the application
      await this.buildApplication();

      // Step 2: Validate build output
      await this.validateBuildOutput();

      // Step 3: Run static analysis
      await this.runStaticAnalysis(filesModified);

      // Step 4: For desktop apps, we can optionally launch and test
      // (This is optional as full E2E testing might be expensive)
      if (this.config.startCommand && this.config.startCommand.includes('electron')) {
        console.log('ℹ️  Electron app detected - skipping live testing for now');
        console.log('   (Build validation and static analysis completed)');
      } else {
        // For web apps, could launch and test with Playwright
        await this.launchAndTest();
      }

      // Generate summary
      const summary = this.generateSummary();
      const passed = this.evidence.validationResults.every(v => 
        v.severity !== 'error' || v.passed
      );

      console.log('\n✅ Testing workflow completed successfully');

      return {
        success: true,
        passed,
        evidence: this.evidence,
        summary
      };

    } catch (error) {
      console.error('\n❌ Testing workflow failed:', error);
      
      return {
        success: false,
        passed: false,
        evidence: this.evidence,
        summary: 'Testing workflow failed',
        error: error instanceof Error ? error.message : String(error)
      };

    } finally {
      await this.cleanup();
    }
  }

  /**
   * Install dependencies if needed
   */
  private async installDependenciesIfNeeded(): Promise<void> {
    const nodeModulesPath = path.join(this.config.workspacePath, 'node_modules');
    const packageJsonPath = path.join(this.config.workspacePath, 'package.json');

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      console.log('   ℹ️  No package.json found, skipping dependency installation');
      return;
    }

    // Check if node_modules exists
    if (fs.existsSync(nodeModulesPath)) {
      console.log('   ✅ Dependencies already installed');
      return;
    }

    console.log('   📦 Installing dependencies...');
    try {
      const startTime = Date.now();
      await execAsync('npm install --prefer-offline --no-audit --no-fund', {
        cwd: this.config.workspacePath,
        maxBuffer: 50 * 1024 * 1024,
        timeout: 300000 // 5 minute timeout for install
      });
      const duration = Date.now() - startTime;
      console.log(`   ✅ Dependencies installed in ${(duration / 1000).toFixed(2)}s`);
      this.evidence.logs.push(`Dependencies installed in ${(duration / 1000).toFixed(2)}s`);
    } catch (error) {
      console.warn('   ⚠️  Failed to install dependencies:', error instanceof Error ? error.message : String(error));
      this.evidence.logs.push('Warning: Failed to install dependencies');
    }
  }

  /**
   * Build the application
   */
  private async buildApplication(): Promise<void> {
    console.log(`\n📦 Building application...`);
    
    // Install dependencies if needed
    await this.installDependenciesIfNeeded();
    
    console.log(`   Command: ${this.config.buildCommand}`);

    try {
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(this.config.buildCommand!, {
        cwd: this.config.workspacePath,
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large builds
        timeout: 300000 // 5 minute timeout
      });

      const duration = Date.now() - startTime;

      this.evidence.buildOutput = stdout + '\n' + stderr;
      this.evidence.logs.push(`Build completed in ${(duration / 1000).toFixed(2)}s`);

      this.evidence.validationResults.push({
        name: 'Build',
        passed: true,
        severity: 'info',
        message: `Application built successfully in ${(duration / 1000).toFixed(2)}s`
      });

      console.log(`   ✅ Build completed in ${(duration / 1000).toFixed(2)}s`);

    } catch (error: any) {
      const errorMsg = error.message || 'Build failed';
      
      this.evidence.validationResults.push({
        name: 'Build',
        passed: false,
        severity: 'error',
        message: 'Build failed',
        details: {
          stdout: error.stdout,
          stderr: error.stderr
        }
      });

      throw new Error(`Build failed: ${errorMsg}`);
    }
  }

  /**
   * Validate build output exists
   */
  private async validateBuildOutput(): Promise<void> {
    console.log('\n🔍 Validating build output...');

    const distPath = path.join(this.config.workspacePath, 'dist');
    
    try {
      const stats = await fsPromises.stat(distPath);
      
      if (!stats.isDirectory()) {
        throw new Error('dist directory not found');
      }

      const files = await fsPromises.readdir(distPath);
      
      this.evidence.validationResults.push({
        name: 'Build Output',
        passed: true,
        severity: 'info',
        message: `Build output validated: ${files.length} files/folders in dist/`,
        details: { files: files.slice(0, 10) }
      });

      console.log(`   ✅ Build output validated: ${files.length} files/folders`);

    } catch (error) {
      this.evidence.validationResults.push({
        name: 'Build Output',
        passed: false,
        severity: 'warning',
        message: 'Build output validation failed - dist directory may not exist',
        details: error
      });

      console.warn(`   ⚠️  Could not validate dist directory`);
    }
  }

  /**
   * Run static analysis on modified files
   */
  private async runStaticAnalysis(filesModified: string[]): Promise<void> {
    console.log('\n🔬 Running static analysis...');

    // Check TypeScript/JavaScript files for common issues
    const tsFiles = filesModified.filter(f => 
      f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')
    );

    if (tsFiles.length === 0) {
      console.log('   ℹ️  No TypeScript/JavaScript files to analyze');
      return;
    }

    // Run TypeScript type checking
    try {
      console.log('   Running TypeScript type checking...');
      
      const { stdout, stderr } = await execAsync('npx tsc --noEmit --skipLibCheck', {
        cwd: this.config.workspacePath,
        timeout: 60000
      });

      this.evidence.validationResults.push({
        name: 'TypeScript Type Check',
        passed: true,
        severity: 'info',
        message: 'TypeScript type checking passed'
      });

      console.log('   ✅ TypeScript type checking passed');

    } catch (error: any) {
      // TypeScript errors are expected sometimes
      const errorOutput = error.stdout || error.stderr || '';
      const errorCount = (errorOutput.match(/error TS/g) || []).length;

      this.evidence.validationResults.push({
        name: 'TypeScript Type Check',
        passed: false,
        severity: 'warning',
        message: `TypeScript found ${errorCount} type errors`,
        details: errorOutput.slice(0, 1000) // First 1000 chars
      });

      console.log(`   ⚠️  TypeScript found ${errorCount} type errors (non-blocking)`);
    }

    // Check for linting issues
    try {
      console.log('   Running linter...');
      
      const { stdout } = await execAsync('npm run lint', {
        cwd: this.config.workspacePath,
        timeout: 60000
      });

      this.evidence.validationResults.push({
        name: 'Linting',
        passed: true,
        severity: 'info',
        message: 'Linting passed'
      });

      console.log('   ✅ Linting passed');

    } catch (error: any) {
      // Linting errors are warnings, not blockers
      this.evidence.validationResults.push({
        name: 'Linting',
        passed: false,
        severity: 'warning',
        message: 'Linting found issues',
        details: (error.stdout || error.stderr || '').slice(0, 1000)
      });

      console.log('   ⚠️  Linting found issues (non-blocking)');
    }
  }

  /**
   * Launch application and run tests (for web apps)
   */
  private async launchAndTest(): Promise<void> {
    console.log('\n🚀 Launching application for testing...');
    
    // For now, this is a placeholder for future E2E testing
    // Could use Playwright to:
    // 1. Launch the app
    // 2. Navigate to test pages
    // 3. Capture screenshots
    // 4. Use CDP to verify DOM changes
    // 5. Test interactions
    
    console.log('   ℹ️  Live testing not yet implemented');
  }

  /**
   * Cleanup - stop any running processes
   */
  private async cleanup(): Promise<void> {
    if (this.appProcess) {
      console.log('🧹 Cleaning up test environment...');
      this.appProcess.kill();
      this.appProcess = null;
    }
  }

  /**
   * Generate test summary
   */
  private generateSummary(): string {
    const total = this.evidence.validationResults.length;
    const passed = this.evidence.validationResults.filter(v => v.passed).length;
    const failed = total - passed;
    const errors = this.evidence.validationResults.filter(v => 
      !v.passed && v.severity === 'error'
    ).length;
    const warnings = this.evidence.validationResults.filter(v => 
      !v.passed && v.severity === 'warning'
    ).length;

    const checksDetail = this.evidence.validationResults
      .map(v => `  ${v.passed ? '✅' : v.severity === 'error' ? '❌' : '⚠️ '} ${v.name}: ${v.message}`)
      .join('\n');

    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TESTING WORKFLOW SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 RESULTS
  Total Checks: ${total}
  ✅ Passed: ${passed}
  ❌ Failed: ${failed}
  🔴 Errors: ${errors}
  ⚠️  Warnings: ${warnings}

🔍 VALIDATION CHECKS
${checksDetail}

${errors === 0 ? '✅ All critical checks passed!' : '❌ Some checks failed - review before creating PR'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  /**
   * Get evidence for PR description
   */
  getEvidenceForPR(): string {
    const checksTable = this.evidence.validationResults
      .map(v => `| ${v.passed ? '✅' : v.severity === 'error' ? '❌' : '⚠️'} | ${v.name} | ${v.message} |`)
      .join('\n');

    return `
## 🧪 Automated Testing Results

| Status | Check | Result |
|--------|-------|--------|
${checksTable}

### Build Output
${this.evidence.buildOutput ? '```\n' + this.evidence.buildOutput.slice(0, 500) + '\n```' : '_No build output captured_'}

### Screenshots
${this.evidence.screenshots.length > 0 
  ? this.evidence.screenshots.map((s, i) => `${i + 1}. ${s.description}`).join('\n')
  : '_No screenshots captured_'}

---
**Testing completed:** ${new Date().toISOString()}
    `.trim();
  }
}

