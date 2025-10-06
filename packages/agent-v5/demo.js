#!/usr/bin/env node

/**
 * Demo script for Agent V5
 * 
 * This demonstrates how Claude Agent works autonomously with tool use
 * 
 * Usage:
 *   node demo.js
 * 
 * Environment variables required:
 *   ANTHROPIC_API_KEY - Your Anthropic API key
 *   GITHUB_TOKEN - Your GitHub personal access token
 */

import { createClaudeAgent } from './dist/index.js';
import { createValidationBridge } from './dist/ValidationBridge.js';

async function main() {
  console.log('🚀 Claude Agent V5 Demo\n');

  // Check environment variables
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!apiKey || !githubToken) {
    console.error('❌ Missing required environment variables:');
    if (!apiKey) console.error('   - ANTHROPIC_API_KEY');
    if (!githubToken) console.error('   - GITHUB_TOKEN');
    console.error('\nPlease set these environment variables and try again.');
    process.exit(1);
  }

  // Configuration
  const config = {
    anthropicApiKey: apiKey,
    githubToken: githubToken,
    repository: {
      owner: process.env.REPO_OWNER || 'your-username',
      repo: process.env.REPO_NAME || 'your-repo',
      branch: process.env.REPO_BRANCH || 'main'
    },
    options: {
      maxTurns: 15,
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0,
      verbose: true
    }
  };

  console.log('📋 Configuration:');
  console.log(`   Repository: ${config.repository.owner}/${config.repository.repo}`);
  console.log(`   Branch: ${config.repository.branch}`);
  console.log(`   Model: ${config.options.model}`);
  console.log(`   Max Turns: ${config.options.maxTurns}\n`);

  // Create agent
  const agent = createClaudeAgent(config);

  // Create validation bridge
  const validator = createValidationBridge();

  try {
    // Initialize (clones repo)
    await agent.initialize();

    // Example 1: Simple task
    console.log('\n📝 Example Task: "Find all button components and make them bounce on hover"\n');
    
    const taskResult = await agent.processTask(
      `Find all button components in the repository and add a bounce animation on hover.
      
      Use CSS animations with @keyframes. Make it smooth and professional.
      Apply consistently to all button components you find.`,
      {
        framework: 'React',
        stylingSystem: 'CSS Modules'
      }
    );

    // Validate results
    console.log('\n🔍 Validating changes...');
    const validation = await validator.validate(taskResult, {
      maxFiles: 10,
      maxLinesPerFile: 100,
      preventOverdeletion: true
    });

    taskResult.validation = validation;

    // Create PR if successful
    if (taskResult.success && validation.passed) {
      console.log('\n✅ Task completed successfully!');
      console.log('\n📝 Would you like to create a pull request? (y/n)');
      
      // For demo, we'll skip actual PR creation
      // Uncomment to enable:
      /*
      const prResult = await agent.createPullRequest(
        taskResult,
        'feat: Add bounce animation to buttons',
        'Automated changes by Claude Agent V5'
      );
      console.log(`\n🎉 Pull request created: ${prResult.prUrl}`);
      */
      
      console.log('\n(Skipping PR creation in demo mode)');
    } else {
      console.log('\n⚠️  Task completed with issues:');
      if (validation.issues.length > 0) {
        validation.issues.forEach(issue => {
          console.log(`   - ${issue.type}: ${issue.message}`);
        });
      }
    }

    // Show tool usage statistics
    console.log('\n📊 Tool Usage Statistics:');
    const toolStats = {};
    taskResult.toolCalls.forEach(call => {
      toolStats[call.tool] = (toolStats[call.tool] || 0) + 1;
    });
    Object.entries(toolStats).forEach(([tool, count]) => {
      console.log(`   ${tool}: ${count}x`);
    });

    // Show files modified
    console.log('\n📁 Files Modified:');
    taskResult.filesModified.forEach(file => {
      console.log(`   - ${file}`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    // Cleanup
    await agent.cleanup();
    console.log('\n✅ Demo complete');
  }
}

main().catch(console.error);

