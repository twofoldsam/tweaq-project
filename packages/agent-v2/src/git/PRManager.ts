// GitHub client types - will be properly typed when integrated
import { 
  FileChange, 
  PRResult, 
  ExecutionPlan, 
  ValidationResult,
  PRGroup
} from '../types';
import { WorkspaceManager } from '../workspace/WorkspaceManager';

export class PRManager {
  constructor(
    private workspace: WorkspaceManager,
    private githubClient: any // GitHub client from @smart-qa/github
  ) {}

  /**
   * Create pull request(s) based on execution plan
   */
  async createPullRequests(
    executionPlan: ExecutionPlan,
    fileChanges: FileChange[],
    validation: ValidationResult
  ): Promise<PRResult[]> {
    console.log('🚀 Creating pull requests...');
    
    const results: PRResult[] = [];
    
    for (const prGroup of executionPlan.prStrategy.prGroups) {
      try {
        const result = await this.createSinglePR(prGroup, fileChanges, validation, executionPlan);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to create PR for group ${prGroup.id}:`, error);
        results.push({
          success: false,
          branchName: executionPlan.branchName,
          commitSha: '',
          filesChanged: [],
          validation,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Create a single pull request
   */
  private async createSinglePR(
    prGroup: PRGroup,
    fileChanges: FileChange[],
    validation: ValidationResult,
    executionPlan: ExecutionPlan
  ): Promise<PRResult> {
    const workspace = this.workspace.getCurrentWorkspace();
    if (!workspace) {
      throw new Error('No workspace available');
    }

    console.log(`📝 Creating PR: ${prGroup.title}`);

    // Filter file changes for this PR group
    const relevantChanges = this.filterChangesForPRGroup(prGroup, fileChanges);
    
    // Apply changes to workspace
    await this.workspace.applyFileChanges(relevantChanges);

    // Get the files that were actually changed
    const changedFiles = relevantChanges.map(change => change.filePath);

    // Create commit message
    const commitMessage = this.generateCommitMessage(prGroup, relevantChanges);

    // Commit changes
    const commitSha = await this.workspace.commitChanges(commitMessage, changedFiles);

    // Push to remote
    await this.workspace.pushChanges();

    // Create PR via GitHub API
    const prTitle = this.generatePRTitle(prGroup);
    const prBody = this.generatePRBody(prGroup, relevantChanges, validation, executionPlan);

    const pr = await this.githubClient.createPR({
      title: prTitle,
      body: prBody,
      head: workspace.currentBranch,
      base: workspace.remoteOrigin.branch,
      draft: validation.score < 0.8 // Create as draft if validation score is low
    });

    console.log(`✅ PR created: ${pr.html_url}`);

    return {
      success: true,
      prUrl: pr.html_url,
      prNumber: pr.number,
      branchName: workspace.currentBranch,
      commitSha,
      filesChanged: changedFiles,
      validation
    };
  }

  /**
   * Filter file changes relevant to a specific PR group
   */
  private filterChangesForPRGroup(prGroup: PRGroup, fileChanges: FileChange[]): FileChange[] {
    // Get all file paths that should be affected by this PR group's changes
    const relevantPaths = new Set<string>();
    
    for (const change of prGroup.changes) {
      relevantPaths.add(change.targetComponent.filePath);
      // Add style files if using external CSS
      if (change.implementationStrategy.approach !== 'inline') {
        change.implementationStrategy.affectedFiles.forEach(file => relevantPaths.add(file));
      }
    }

    return fileChanges.filter(change => relevantPaths.has(change.filePath));
  }

  /**
   * Generate commit message
   */
  private generateCommitMessage(prGroup: PRGroup, fileChanges: FileChange[]): string {
    const scope = this.inferCommitScope(fileChanges);
    const type = this.inferCommitType(prGroup);
    
    const title = `${type}${scope ? `(${scope})` : ''}: ${prGroup.title.toLowerCase()}`;
    
    const body = [
      prGroup.description,
      '',
      'Changes:',
      ...fileChanges.map(change => `- ${change.action} ${change.filePath}`),
      '',
      `Affects ${prGroup.changes.length} component${prGroup.changes.length !== 1 ? 's' : ''}`,
      `Priority: ${prGroup.priority}`
    ].join('\n');

    return `${title}\n\n${body}`;
  }

  /**
   * Infer commit scope from file changes
   */
  private inferCommitScope(fileChanges: FileChange[]): string {
    const scopes = new Set<string>();
    
    for (const change of fileChanges) {
      if (change.filePath.includes('components/')) {
        scopes.add('components');
      } else if (change.filePath.includes('styles/')) {
        scopes.add('styles');
      } else if (change.filePath.includes('pages/')) {
        scopes.add('pages');
      }
    }

    if (scopes.size === 1) {
      return Array.from(scopes)[0];
    } else if (scopes.size > 1) {
      return 'ui';
    }

    return 'ui';
  }

  /**
   * Infer commit type from PR group
   */
  private inferCommitType(prGroup: PRGroup): string {
    const description = prGroup.description.toLowerCase();
    
    if (description.includes('fix') || description.includes('bug')) {
      return 'fix';
    } else if (description.includes('add') || description.includes('new')) {
      return 'feat';
    } else if (description.includes('update') || description.includes('change')) {
      return 'style';
    } else if (description.includes('refactor')) {
      return 'refactor';
    }
    
    return 'style'; // Default for visual changes
  }

  /**
   * Generate PR title
   */
  private generatePRTitle(prGroup: PRGroup): string {
    const emoji = this.getPREmoji(prGroup);
    return `${emoji} ${prGroup.title}`;
  }

  /**
   * Get appropriate emoji for PR
   */
  private getPREmoji(prGroup: PRGroup): string {
    const description = prGroup.description.toLowerCase();
    
    if (description.includes('color') || description.includes('theme')) return '🎨';
    if (description.includes('layout') || description.includes('spacing')) return '📐';
    if (description.includes('font') || description.includes('text')) return '✏️';
    if (description.includes('button') || description.includes('interactive')) return '🔘';
    if (description.includes('mobile') || description.includes('responsive')) return '📱';
    if (description.includes('animation') || description.includes('transition')) return '✨';
    
    return '🎨'; // Default design emoji
  }

  /**
   * Generate PR body
   */
  private generatePRBody(
    prGroup: PRGroup,
    fileChanges: FileChange[],
    validation: ValidationResult,
    executionPlan: ExecutionPlan
  ): string {
    const sections = [];

    // Description
    sections.push('## 📝 Description');
    sections.push(prGroup.description);
    sections.push('');

    // Changes summary
    sections.push('## 🔄 Changes Made');
    sections.push(`- **Components affected:** ${prGroup.changes.length}`);
    sections.push(`- **Files modified:** ${fileChanges.length}`);
    sections.push(`- **Implementation approach:** ${executionPlan.styleImpactAnalysis.recommendation}`);
    sections.push(`- **Estimated complexity:** ${executionPlan.changeAnalysis.complexity}`);
    sections.push('');

    // Detailed changes
    sections.push('## 📋 Detailed Changes');
    for (const change of prGroup.changes) {
      sections.push(`### ${change.targetComponent.name}`);
      sections.push(`- **Type:** ${change.changeType}`);
      sections.push(`- **Complexity:** ${Math.round(change.complexity * 100)}%`);
      sections.push(`- **Strategy:** ${change.implementationStrategy.approach}`);
      
      if (change.changes.length > 0) {
        sections.push('- **Properties modified:**');
        change.changes.forEach(prop => {
          sections.push(`  - \`${prop.property}\`: ${prop.before} → ${prop.after}`);
        });
      }
      sections.push('');
    }

    // File changes
    sections.push('## 📁 Files Changed');
    for (const fileChange of fileChanges) {
      const action = fileChange.action === 'create' ? '🆕' : 
                    fileChange.action === 'modify' ? '✏️' : '🗑️';
      sections.push(`- ${action} \`${fileChange.filePath}\``);
    }
    sections.push('');

    // Validation results
    sections.push('## ✅ Validation Results');
    sections.push(`- **Overall Score:** ${Math.round(validation.score * 100)}%`);
    sections.push(`- **Syntax Valid:** ${validation.syntaxValid ? '✅' : '❌'}`);
    sections.push(`- **Build Check:** ${validation.buildsSuccessfully ? '✅' : '❌'}`);
    sections.push(`- **Tests Pass:** ${validation.testsPass ? '✅' : '❌'}`);
    sections.push(`- **Linting:** ${validation.lintingPasses ? '✅' : '❌'}`);
    
    if (validation.issues.length > 0) {
      sections.push('');
      sections.push('### ⚠️ Issues Found');
      validation.issues.forEach(issue => {
        const severity = issue.severity === 'error' ? '❌' : 
                        issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        sections.push(`- ${severity} **${issue.type}** in \`${issue.file}\`: ${issue.message}`);
      });
    }
    sections.push('');

    // Agent metadata
    sections.push('## 🤖 Agent Information');
    sections.push('This PR was created by the Tweaq autonomous coding agent.');
    sections.push(`- **Processing time:** ${Math.round(executionPlan.changeAnalysis.estimatedChanges * 2)} minutes`);
    sections.push(`- **Decisions made:** ${executionPlan.changeAnalysis.changeIntents.length}`);
    sections.push(`- **Strategy reasoning:** ${executionPlan.styleImpactAnalysis.reasoning}`);
    sections.push('');

    // Risk assessment
    if (executionPlan.styleImpactAnalysis.riskAssessment.level !== 'low') {
      sections.push('## ⚠️ Risk Assessment');
      sections.push(`**Risk Level:** ${executionPlan.styleImpactAnalysis.riskAssessment.level.toUpperCase()}`);
      sections.push('**Risk Factors:**');
      executionPlan.styleImpactAnalysis.riskAssessment.factors.forEach(factor => {
        sections.push(`- ${factor}`);
      });
      sections.push('');
    }

    // Next steps
    sections.push('## 🚀 Next Steps');
    sections.push('1. Review the changes in the Files Changed tab');
    sections.push('2. Test the visual changes in your development environment');
    sections.push('3. Verify that no existing functionality is broken');
    if (validation.score < 0.9) {
      sections.push('4. Address any validation issues mentioned above');
    }
    sections.push('5. Merge when satisfied with the changes');

    return sections.join('\n');
  }

  /**
   * Update PR with additional information
   */
  async updatePR(
    prNumber: number,
    _additionalInfo: {
      validationResults?: ValidationResult;
      testResults?: any;
      screenshots?: string[];
    }
  ): Promise<void> {
    // Implementation for updating PR with additional information
    // This could include test results, screenshots, etc.
    console.log(`📝 Updating PR #${prNumber} with additional information`);
    
    // TODO: Implement PR update logic
  }

  /**
   * Add labels to PR based on changes
   */
  private generatePRLabels(prGroup: PRGroup, validation: ValidationResult): string[] {
    const labels: string[] = ['agent-generated'];
    
    // Add priority label
    labels.push(`priority-${prGroup.priority}`);
    
    // Add change type labels
    const changeTypes = new Set(prGroup.changes.map(c => c.changeType));
    changeTypes.forEach(type => labels.push(`type-${type}`));
    
    // Add complexity label
    const avgComplexity = prGroup.changes.reduce((sum, c) => sum + c.complexity, 0) / prGroup.changes.length;
    if (avgComplexity > 0.7) labels.push('complexity-high');
    else if (avgComplexity > 0.4) labels.push('complexity-medium');
    else labels.push('complexity-low');
    
    // Add validation labels
    if (validation.score < 0.7) labels.push('needs-review');
    if (!validation.testsPass) labels.push('tests-failing');
    
    return labels;
  }
}
