/**
 * Agent V3: Two-Agent System Orchestrator
 * Coordinates between Strategic Planning Agent and Coding Implementation Agent
 */

import { Agent1_StrategicPlanning } from './agents/Agent1_StrategicPlanning';
import { Agent2_CodingImplementation } from './agents/Agent2_CodingImplementation';
import { SymbolicRepoBuilder } from './analysis/SymbolicRepoBuilder';
import {
  VisualEdit,
  AgentV3Result,
  RepoAnalysisConfig,
  SymbolicRepo,
  Agent1Config,
  Agent2Config
} from './types';

export interface AgentV3Config {
  // Repository configuration
  workspace: {
    owner: string;
    repo: string;
    baseBranch: string;
    githubToken: string;
  };

  // LLM provider for both agents
  llmProvider: {
    generateText: (prompt: string) => Promise<string>;
  };

  // GitHub access for Agent 2
  githubAccess: {
    readFiles: (paths: string[]) => Promise<Map<string, string>>;
    writeFiles: (changes: any[]) => Promise<void>;
    createPR: (branch: string, title: string, body: string) => Promise<any>;
  };

  // Configuration options
  options?: {
    analysisDepth?: 'basic' | 'comprehensive' | 'deep';
    cacheEnabled?: boolean;
    maxFiles?: number;
    confidenceThreshold?: number;
  };
}

export class AgentV3 {
  private config: AgentV3Config;
  private symbolicRepo: SymbolicRepo | null = null;
  private agent1: Agent1_StrategicPlanning | null = null;
  private agent2: Agent2_CodingImplementation | null = null;

  constructor(config: AgentV3Config) {
    this.config = config;
  }

  /**
   * Initialize the agent system by analyzing the repository
   */
  async initialize(): Promise<{ success: boolean; error?: string; analysisTime?: number }> {
    console.log('🚀 Initializing Agent V3 system...');
    
    try {
      // Phase 1: Build symbolic repository representation
      console.log('🔍 Phase 1: Analyzing repository structure...');
      const repoAnalysisConfig: RepoAnalysisConfig = {
        owner: this.config.workspace.owner,
        repo: this.config.workspace.repo,
        baseBranch: this.config.workspace.baseBranch,
        githubToken: this.config.workspace.githubToken,
        analysisDepth: this.config.options?.analysisDepth || 'comprehensive',
        cacheEnabled: this.config.options?.cacheEnabled ?? true,
        maxFiles: this.config.options?.maxFiles || 1000
      };

      const repoBuilder = new SymbolicRepoBuilder(repoAnalysisConfig);
      const analysisResult = await repoBuilder.buildSymbolicRepo();

      if (!analysisResult.success || !analysisResult.symbolicRepo) {
        throw new Error(`Repository analysis failed: ${analysisResult.errors.join(', ')}`);
      }

      this.symbolicRepo = analysisResult.symbolicRepo;
      console.log(`✅ Repository analysis completed: ${analysisResult.filesAnalyzed} files, ${analysisResult.confidence * 100}% confidence`);

      // Phase 2: Initialize Agent 1 (Strategic Planning)
      console.log('🧠 Phase 2: Initializing Strategic Planning Agent...');
      const agent1Config: Agent1Config = {
        llmProvider: this.config.llmProvider,
        symbolicRepo: this.symbolicRepo,
        maxDecisionTime: 30000, // 30 seconds
        confidenceThreshold: this.config.options?.confidenceThreshold || 0.7
      };

      this.agent1 = new Agent1_StrategicPlanning(agent1Config);
      console.log('✅ Agent 1 initialized');

      // Phase 3: Initialize Agent 2 (Coding Implementation)
      console.log('🔧 Phase 3: Initializing Coding Implementation Agent...');
      const agent2Config: Agent2Config = {
        llmProvider: this.config.llmProvider,
        githubAccess: this.config.githubAccess,
        workspace: this.config.workspace,
        maxImplementationTime: 120000 // 2 minutes
      };

      this.agent2 = new Agent2_CodingImplementation(agent2Config);
      console.log('✅ Agent 2 initialized');

      console.log('🎉 Agent V3 system initialization complete!');
      return { 
        success: true, 
        analysisTime: analysisResult.analysisTime 
      };

    } catch (error) {
      console.error('❌ Agent V3 initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Process visual edits through the two-agent system
   */
  async processVisualEdits(visualEdits: VisualEdit[]): Promise<AgentV3Result> {
    const totalStartTime = Date.now();
    console.log(`🎯 Agent V3: Processing ${visualEdits.length} visual edits...`);

    // Validate initialization
    if (!this.symbolicRepo || !this.agent1 || !this.agent2) {
      return {
        success: false,
        agent1Result: {
          success: false,
          decisions: [],
          tickets: [],
          reasoning: 'System not initialized',
          confidence: 0,
          processingTime: 0,
          error: 'Agent V3 not initialized. Call initialize() first.'
        },
        agent2Result: {
          success: false,
          implementedTickets: [],
          fileChanges: [],
          prResults: [],
          validation: { syntaxValid: false, testsPass: false, buildSucceeds: false, issues: [] },
          processingTime: 0,
          error: 'Agent V3 not initialized'
        },
        totalProcessingTime: 0,
        prUrls: [],
        summary: 'Processing failed - system not initialized',
        error: 'Agent V3 not initialized. Call initialize() first.'
      };
    }

    try {
      // Phase 1: Strategic Planning (Agent 1)
      console.log('🧠 Phase 1: Strategic Planning Agent processing...');
      const agent1Result = await this.agent1.processVisualEdits(visualEdits);

      if (!agent1Result.success) {
        throw new Error(`Agent 1 failed: ${agent1Result.error}`);
      }

      console.log(`✅ Agent 1 completed: ${agent1Result.tickets.length} tickets created`);

      // Phase 2: Code Implementation (Agent 2)
      console.log('🔧 Phase 2: Coding Implementation Agent processing...');
      const agent2Result = await this.agent2.implementTickets(agent1Result.tickets);

      if (!agent2Result.success) {
        console.warn(`⚠️ Agent 2 had issues: ${agent2Result.error}`);
      }

      console.log(`✅ Agent 2 completed: ${agent2Result.fileChanges.length} files changed, ${agent2Result.prResults.length} PRs created`);

      // Phase 3: Generate summary
      const totalProcessingTime = Date.now() - totalStartTime;
      const prUrls = agent2Result.prResults.map(pr => pr.prUrl).filter(Boolean) as string[];
      const summary = this.generateSummary(agent1Result, agent2Result, visualEdits);

      console.log(`🎉 Agent V3 processing complete in ${totalProcessingTime}ms`);

      return {
        success: agent1Result.success && agent2Result.success,
        agent1Result,
        agent2Result,
        totalProcessingTime,
        prUrls,
        summary,
        error: agent2Result.error || undefined
      };

    } catch (error) {
      const totalProcessingTime = Date.now() - totalStartTime;
      console.error('❌ Agent V3 processing failed:', error);

      return {
        success: false,
        agent1Result: {
          success: false,
          decisions: [],
          tickets: [],
          reasoning: 'Processing failed',
          confidence: 0,
          processingTime: 0,
          error: error instanceof Error ? error.message : String(error)
        },
        agent2Result: {
          success: false,
          implementedTickets: [],
          fileChanges: [],
          prResults: [],
          validation: { syntaxValid: false, testsPass: false, buildSucceeds: false, issues: [] },
          processingTime: 0,
          error: error instanceof Error ? error.message : String(error)
        },
        totalProcessingTime,
        prUrls: [],
        summary: 'Processing failed due to error',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Get current repository analysis
   */
  getRepositoryAnalysis(): SymbolicRepo | null {
    return this.symbolicRepo;
  }

  /**
   * Get system status
   */
  getStatus(): {
    initialized: boolean;
    repositoryAnalyzed: boolean;
    agent1Ready: boolean;
    agent2Ready: boolean;
    componentsFound: number;
    lastAnalyzed?: Date;
  } {
    return {
      initialized: !!(this.symbolicRepo && this.agent1 && this.agent2),
      repositoryAnalyzed: !!this.symbolicRepo,
      agent1Ready: !!this.agent1,
      agent2Ready: !!this.agent2,
      componentsFound: this.symbolicRepo?.structure.components.length || 0,
      lastAnalyzed: this.symbolicRepo?.analysis.lastAnalyzed
    };
  }

  /**
   * Refresh repository analysis (useful when repository changes)
   */
  async refreshAnalysis(): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Refreshing repository analysis...');
    
    try {
      const repoAnalysisConfig: RepoAnalysisConfig = {
        owner: this.config.workspace.owner,
        repo: this.config.workspace.repo,
        baseBranch: this.config.workspace.baseBranch,
        githubToken: this.config.workspace.githubToken,
        analysisDepth: this.config.options?.analysisDepth || 'comprehensive',
        cacheEnabled: false, // Force fresh analysis
        maxFiles: this.config.options?.maxFiles || 1000
      };

      const repoBuilder = new SymbolicRepoBuilder(repoAnalysisConfig);
      const analysisResult = await repoBuilder.buildSymbolicRepo();

      if (!analysisResult.success || !analysisResult.symbolicRepo) {
        throw new Error(`Repository analysis failed: ${analysisResult.errors.join(', ')}`);
      }

      this.symbolicRepo = analysisResult.symbolicRepo;

      // Update Agent 1 with new symbolic repo
      if (this.agent1) {
        const agent1Config: Agent1Config = {
          llmProvider: this.config.llmProvider,
          symbolicRepo: this.symbolicRepo,
          maxDecisionTime: 30000,
          confidenceThreshold: this.config.options?.confidenceThreshold || 0.7
        };
        this.agent1 = new Agent1_StrategicPlanning(agent1Config);
      }

      console.log('✅ Repository analysis refreshed');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to refresh repository analysis:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Generate comprehensive summary of the processing
   */
  private generateSummary(
    agent1Result: any,
    agent2Result: any,
    visualEdits: VisualEdit[]
  ): string {
    const successfulTickets = agent2Result.implementedTickets.filter((t: any) => t.metadata.status === 'completed');
    const failedTickets = agent2Result.implementedTickets.filter((t: any) => t.metadata.status === 'failed');

    let summary = `Agent V3 processed ${visualEdits.length} visual edit(s) through two-agent system:\n\n`;

    // Agent 1 Summary
    summary += `🧠 **Strategic Planning Agent (Agent 1):**\n`;
    summary += `- Made ${agent1Result.decisions.length} strategic decisions\n`;
    summary += `- Created ${agent1Result.tickets.length} implementation tickets\n`;
    summary += `- Overall confidence: ${(agent1Result.confidence * 100).toFixed(1)}%\n`;
    summary += `- Processing time: ${agent1Result.processingTime}ms\n\n`;

    // Agent 2 Summary
    summary += `🔧 **Coding Implementation Agent (Agent 2):**\n`;
    summary += `- Successfully implemented ${successfulTickets.length}/${agent1Result.tickets.length} tickets\n`;
    summary += `- Modified ${agent2Result.fileChanges.length} files\n`;
    summary += `- Created ${agent2Result.prResults.length} pull requests\n`;
    summary += `- Processing time: ${agent2Result.processingTime}ms\n\n`;

    // Results Summary
    if (agent2Result.prResults.length > 0) {
      summary += `📋 **Pull Requests Created:**\n`;
      agent2Result.prResults.forEach((pr: any, index: number) => {
        summary += `${index + 1}. ${pr.prUrl || pr.branchName}\n`;
      });
      summary += '\n';
    }

    // Issues Summary
    if (failedTickets.length > 0 || agent2Result.validation.issues.length > 0) {
      summary += `⚠️ **Issues Encountered:**\n`;
      if (failedTickets.length > 0) {
        summary += `- ${failedTickets.length} tickets failed implementation\n`;
      }
      if (agent2Result.validation.issues.length > 0) {
        summary += `- ${agent2Result.validation.issues.length} validation issues\n`;
      }
    } else {
      summary += `✅ **All implementations completed successfully!**\n`;
    }

    return summary;
  }
}

/**
 * Factory function to create Agent V3 instance
 */
export function createAgentV3(config: AgentV3Config): AgentV3 {
  return new AgentV3(config);
}

/**
 * Validation function for visual edits
 */
export function validateVisualEdits(visualEdits: VisualEdit[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(visualEdits)) {
    errors.push('Visual edits must be an array');
    return { valid: false, errors, warnings };
  }

  if (visualEdits.length === 0) {
    warnings.push('No visual edits provided');
  }

  for (let i = 0; i < visualEdits.length; i++) {
    const edit = visualEdits[i];
    const prefix = `Visual edit ${i + 1}:`;

    if (!edit.id) {
      errors.push(`${prefix} Missing required 'id' field`);
    }

    if (!edit.element || !edit.element.selector) {
      errors.push(`${prefix} Missing required 'element.selector' field`);
    }

    if (!edit.intent || !edit.intent.description) {
      errors.push(`${prefix} Missing required 'intent.description' field`);
    }

    if (!Array.isArray(edit.changes) || edit.changes.length === 0) {
      warnings.push(`${prefix} No changes specified`);
    }

    // Validate changes
    if (edit.changes) {
      for (let j = 0; j < edit.changes.length; j++) {
        const change = edit.changes[j];
        const changePrefix = `${prefix} Change ${j + 1}:`;

        if (!change.property) {
          errors.push(`${changePrefix} Missing 'property' field`);
        }

        if (change.confidence !== undefined && (change.confidence < 0 || change.confidence > 1)) {
          errors.push(`${changePrefix} Confidence must be between 0 and 1`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
