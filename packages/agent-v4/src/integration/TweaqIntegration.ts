import type { VisualEdit, RepoSymbolicModel } from '../types/index.js';
import { AgentV4, defaultAgentV4Config } from '../AgentV4.js';
import type { AgentV4Config } from '../types/index.js';

/**
 * Integration layer for Agent V4 with existing Tweaq infrastructure
 */
export class TweaqAgentV4Integration {
  private agent: AgentV4;
  
  constructor(llmProvider: any, config?: Partial<AgentV4Config>) {
    const fullConfig: AgentV4Config = {
      ...defaultAgentV4Config,
      llmProvider,
      ...config
    } as AgentV4Config;
    
    this.agent = new AgentV4(fullConfig);
  }
  
  /**
   * Process visual edits using Agent V4 (main integration point)
   */
  async processVisualEdits(
    visualEdits: VisualEdit[],
    symbolicRepo: RepoSymbolicModel,
    options: {
      dryRun?: boolean;
      enableLogging?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    fileChanges: any[];
    summary: string;
    confidence: number;
    approach: string;
    validation: {
      passed: boolean;
      issues: any[];
      warnings: any[];
      metrics: any;
    };
    error?: string;
  }> {
    const { dryRun = false, enableLogging = true } = options;
    
    if (enableLogging) {
      console.log('🤖 Agent V4 Integration: Processing visual edits...');
    }
    
    try {
      if (dryRun) {
        const dryRunResult = await this.agent.dryRun(visualEdits, symbolicRepo);
        
        return {
          success: true,
          fileChanges: [],
          summary: this.generateDryRunSummary(dryRunResult),
          confidence: dryRunResult.analysis?.confidenceAssessment?.confidence || 0,
          approach: dryRunResult.preview?.approach || 'error',
          validation: {
            passed: true,
            issues: [],
            warnings: [],
            metrics: {}
          }
        };
      }
      
      const result = await this.agent.processVisualEdits(visualEdits, symbolicRepo);
      
      return {
        success: result.success,
        fileChanges: this.convertFileChanges(result.fileChanges),
        summary: result.summary,
        confidence: result.analysis?.confidenceAssessment?.confidence || 0,
        approach: result.analysis?.confidenceAssessment?.recommendedApproach || 'error',
        validation: {
          passed: result.execution?.validation?.passed || false,
          issues: result.execution?.validation?.issues || [],
          warnings: result.execution?.validation?.warnings || [],
          metrics: result.execution?.validation?.metrics || {}
        },
        error: result.error
      };
      
    } catch (error) {
      console.error('❌ Agent V4 Integration error:', error);
      
      return {
        success: false,
        fileChanges: [],
        summary: 'Agent V4 processing failed',
        confidence: 0,
        approach: 'error',
        validation: {
          passed: false,
          issues: [{
            type: 'execution-error',
            severity: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }],
          warnings: [],
          metrics: {}
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check if Agent V4 should be used for this request
   */
  shouldUseAgentV4(
    visualEdits: VisualEdit[],
    symbolicRepo: RepoSymbolicModel
  ): {
    recommended: boolean;
    reason: string;
    confidence: number;
  } {
    // Agent V4 is recommended for most scenarios, especially:
    // 1. When we have good symbolic repo analysis
    // 2. When changes are well-defined
    // 3. When we want to prevent over-deletion
    
    let confidence = 0.7; // Base confidence in Agent V4
    let reason = 'Agent V4 provides intelligent analysis and validation';
    
    // Boost confidence for good symbolic repo analysis
    if (symbolicRepo.components && symbolicRepo.components.length > 0) {
      confidence += 0.2;
      reason = 'High-quality repository analysis available';
    }
    
    // Boost confidence for well-defined visual edits
    if (visualEdits.length === 1 && visualEdits[0].changes && visualEdits[0].changes.length > 0) {
      confidence += 0.1;
      reason = 'Well-defined visual changes detected';
    }
    
    // Always recommend Agent V4 for styling changes (prevents over-deletion)
    const hasStylingChanges = visualEdits.some(edit => 
      edit.changes?.some(change => 
        ['font-size', 'color', 'background-color', 'margin', 'padding'].includes(change.property)
      )
    );
    
    if (hasStylingChanges) {
      confidence = Math.max(confidence, 0.9);
      reason = 'Styling changes detected - Agent V4 prevents over-deletion';
    }
    
    return {
      recommended: confidence > 0.6,
      reason,
      confidence
    };
  }
  
  /**
   * Get Agent V4 capabilities for integration
   */
  getCapabilities() {
    return this.agent.getCapabilities();
  }
  
  /**
   * Convert Agent V4 file changes to Tweaq format
   */
  private convertFileChanges(fileChanges: any[]): any[] {
    return fileChanges.map(change => ({
      path: change.filePath,
      content: change.newContent,
      action: change.action,
      reasoning: change.reasoning,
      oldContent: change.oldContent
    }));
  }
  
  /**
   * Generate dry run summary
   */
  private generateDryRunSummary(dryRunResult: any): string {
    const { analysis, preview } = dryRunResult;
    
    return `
🔍 AGENT V4 DRY RUN ANALYSIS
===========================

📊 CONFIDENCE: ${(analysis.confidenceAssessment.confidence * 100).toFixed(1)}%
🎯 APPROACH: ${preview.approach}
⚠️ RISK LEVEL: ${analysis.confidenceAssessment.riskLevel}

📋 EXPECTED CHANGES:
        ${preview.expectedChanges.map((change: any) => `• ${change}`).join('\n')}

⚠️ RISKS:
${preview.risks.map((risk: any) => `• ${risk}`).join('\n')}

💡 RECOMMENDATIONS:
${preview.recommendations.map((rec: any) => `• ${rec}`).join('\n')}

===========================
Ready to execute with ${preview.approach} approach.
    `.trim();
  }
}

/**
 * Factory function to create TweaqAgentV4Integration instance
 */
export function createTweaqAgentV4Integration(llmProvider: any, config?: Partial<AgentV4Config>): TweaqAgentV4Integration {
  return new TweaqAgentV4Integration(llmProvider, config);
}


/**
 * Integration helper for existing Tweaq workflows
 */
export async function processWithAgentV4(
  visualEdits: VisualEdit[],
  symbolicRepo: RepoSymbolicModel,
  llmProvider: any,
  options: {
    dryRun?: boolean;
    enableLogging?: boolean;
    config?: Partial<AgentV4Config>;
  } = {}
): Promise<any> {
  const integration = createTweaqAgentV4Integration(llmProvider, options.config);
  
  return integration.processVisualEdits(visualEdits, symbolicRepo, {
    dryRun: options.dryRun,
    enableLogging: options.enableLogging
  });
}
