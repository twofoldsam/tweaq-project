/**
 * Bridge to integrate Agent V4's validation engine with Agent V5
 * This keeps the over-deletion prevention from Agent V4
 */

import type { AgentTaskResult, ValidationResult } from './types/index';

/**
 * Validate changes using Agent V4's validation engine
 * This is a placeholder - you would import the actual validation engine
 */
export class ValidationBridge {
  
  /**
   * Validate that the changes are reasonable and don't over-delete
   */
  async validate(
    taskResult: AgentTaskResult,
    expectedScope: {
      maxFiles?: number;
      maxLinesPerFile?: number;
      preventOverdeletion?: boolean;
    }
  ): Promise<ValidationResult> {
    console.log('\n🔍 Running validation checks...');

    const issues: ValidationResult['issues'] = [];
    const warnings: ValidationResult['warnings'] = [];

    // Check number of files modified
    if (expectedScope.maxFiles && taskResult.filesModified.length > expectedScope.maxFiles) {
      issues.push({
        type: 'scope-exceeded',
        severity: 'warning',
        message: `Modified ${taskResult.filesModified.length} files (expected max: ${expectedScope.maxFiles})`
      });
    }

    // TODO: Import and use Agent V4's SmartValidationEngine
    // For now, this is a simple placeholder
    
    const passed = issues.filter(i => i.severity === 'error').length === 0;

    const validation: ValidationResult = {
      passed,
      confidence: passed ? 0.9 : 0.5,
      issues,
      warnings,
      metrics: {
        linesChanged: 0, // TODO: Calculate from taskResult
        linesAdded: 0,
        linesRemoved: 0,
        filesModified: taskResult.filesModified.length,
        changeRatio: 0,
        complexityDelta: 0
      }
    };

    if (passed) {
      console.log('✅ Validation passed');
    } else {
      console.log(`⚠️  Validation issues: ${issues.length}`);
      issues.forEach(issue => {
        console.log(`   - ${issue.type}: ${issue.message}`);
      });
    }

    return validation;
  }

  /**
   * Validate and retry if needed
   * If validation fails, ask Claude to retry more conservatively
   */
  async validateWithRetry(
    agent: any, // ClaudeAgentV5 instance
    taskResult: AgentTaskResult,
    originalInstruction: string,
    expectedScope: any
  ): Promise<{ result: AgentTaskResult; validation: ValidationResult }> {
    
    // First validation attempt
    let validation = await this.validate(taskResult, expectedScope);
    
    if (validation.passed) {
      return { result: taskResult, validation };
    }

    // Validation failed - ask Claude to retry with constraints
    console.log('\n🔄 Validation failed, asking Claude to retry more conservatively...');
    
    const retryInstruction = `${originalInstruction}

IMPORTANT: The previous attempt failed validation with these issues:
${validation.issues.map(i => `- ${i.message}`).join('\n')}

Please retry with these constraints:
- Make more minimal changes
- Only modify necessary files
- Preserve existing code structure
- Don't delete code unnecessarily
`;

    const retryResult = await agent.processTask(retryInstruction);
    const retryValidation = await this.validate(retryResult, expectedScope);

    return { result: retryResult, validation: retryValidation };
  }
}

export function createValidationBridge(): ValidationBridge {
  return new ValidationBridge();
}

