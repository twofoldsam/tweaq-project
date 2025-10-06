#!/usr/bin/env node

/**
 * Simple V0 Demo for Agent V5
 * 
 * This is the SIMPLEST possible demo showing:
 * 1. Input (task instruction)
 * 2. Execution (autonomous tool use)
 * 3. Output (results + PR)
 */

import { createClaudeAgent } from './dist/index.js';

async function main() {
  console.log('🎯 Agent V5 - Simple Demo\n');

  // ═══════════════════════════════════════════════════════
  // 📥 INPUT: What you send to the agent
  // ═══════════════════════════════════════════════════════
  
  const INPUT = {
    task: "Make all the buttons bounce on hover",
    context: {
      framework: 'React',
      stylingSystem: 'CSS Modules'
    }
  };

  console.log('📥 INPUT:');
  console.log(`   Task: "${INPUT.task}"`);
  console.log(`   Context: ${JSON.stringify(INPUT.context)}\n`);

  // ═══════════════════════════════════════════════════════
  // ⚙️ SETUP: Create and initialize agent
  // ═══════════════════════════════════════════════════════

  const agent = createClaudeAgent({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    repository: {
      owner: process.env.REPO_OWNER || 'your-username',
      repo: process.env.REPO_NAME || 'your-repo',
      branch: process.env.REPO_BRANCH || 'main'
    },
    options: {
      maxTurns: 15,
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0,
      verbose: true  // Shows all tool calls
    }
  });

  try {
    // Initialize (clones repository locally)
    await agent.initialize();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('⚙️ EXECUTION: Agent working autonomously...');
    console.log('═══════════════════════════════════════════════════════\n');

    // ═══════════════════════════════════════════════════════
    // ⚙️ EXECUTION: Agent works autonomously
    // ═══════════════════════════════════════════════════════
    
    const result = await agent.processTask(INPUT.task, INPUT.context);

    // ═══════════════════════════════════════════════════════
    // 📤 OUTPUT: What you get back
    // ═══════════════════════════════════════════════════════

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📤 OUTPUT:');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ Task Result:');
    console.log(`   Success: ${result.success}`);
    console.log(`   Files Modified: ${result.filesModified.length}`);
    console.log(`   Tool Calls: ${result.toolCalls.length}`);
    console.log(`   Turns Used: ${result.toolCalls.length > 0 ? Math.max(...result.toolCalls.map(c => c.timestamp)) : 0}`);

    if (result.filesModified.length > 0) {
      console.log('\n📁 Modified Files:');
      result.filesModified.forEach(file => {
        console.log(`   - ${file}`);
      });
    }

    // Tool usage breakdown
    const toolStats = result.toolCalls.reduce((acc, call) => {
      acc[call.tool] = (acc[call.tool] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🔧 Tool Usage:');
    Object.entries(toolStats).forEach(([tool, count]) => {
      console.log(`   - ${tool}: ${count}x`);
    });

    // Show reasoning steps
    console.log('\n💭 Agent Reasoning:');
    result.reasoning.slice(0, 5).forEach((step, i) => {
      const preview = step.length > 80 ? step.substring(0, 80) + '...' : step;
      console.log(`   ${i + 1}. ${preview}`);
    });

    // ═══════════════════════════════════════════════════════
    // 🔀 Create Pull Request
    // ═══════════════════════════════════════════════════════

    if (result.success && result.filesModified.length > 0) {
      console.log('\n🔀 Creating Pull Request...');
      
      const pr = await agent.createPullRequest(
        result,
        'feat: Add bounce animation to buttons',
        'Automated changes by Claude Agent V5'
      );

      console.log('\n📤 OUTPUT (Pull Request):');
      console.log(`   PR Number: #${pr.prNumber}`);
      console.log(`   PR URL: ${pr.prUrl}`);
      console.log('\n✅ Demo Complete! Check the PR on GitHub.');
    } else {
      console.log('\n⚠️  No changes made - skipping PR creation');
    }

    // ═══════════════════════════════════════════════════════
    // 📊 JSON Output (for programmatic use)
    // ═══════════════════════════════════════════════════════

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 JSON OUTPUT (for API/programmatic use):');
    console.log('═══════════════════════════════════════════════════════\n');

    const jsonOutput = {
      success: result.success,
      filesModified: result.filesModified,
      metrics: {
        turnsUsed: result.toolCalls.length,
        filesChanged: result.filesModified.length,
        toolCallsTotal: result.toolCalls.length,
        toolsUsed: toolStats
      },
      reasoning: result.reasoning.slice(0, 3),
      summary: result.summary
    };

    console.log(JSON.stringify(jsonOutput, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    // Cleanup
    await agent.cleanup();
    console.log('\n🧹 Cleanup complete');
  }
}

// Run the demo
main().catch(console.error);

