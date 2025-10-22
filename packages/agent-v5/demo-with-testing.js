#!/usr/bin/env node

/**
 * Demo: Claude Agent V5 with Automated Testing
 * 
 * This demo shows how the agent can:
 * 1. Make code changes autonomously
 * 2. Automatically test changes before creating PR
 * 3. Capture evidence (build output, validation results)
 * 4. Only create PR if tests pass
 */

const { ClaudeAgentV5 } = require('./dist/ClaudeAgentV5');
require('dotenv').config({ path: '../../.env' });

async function main() {
  // Configuration
  const config = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    githubToken: process.env.GITHUB_TOKEN,
    repository: {
      owner: process.env.TEST_REPO_OWNER || 'your-org',
      repo: process.env.TEST_REPO_NAME || 'your-repo',
      branch: process.env.TEST_REPO_BRANCH || 'main'
    },
    options: {
      maxTurns: 10,
      verbose: true,
      // Enable automated testing
      enableTesting: true,
      // Specify build command (defaults to 'npm run build')
      buildCommand: 'npm run build',
      // Optional: Test URL for live testing
      // testUrl: 'http://localhost:3000'
    }
  };

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CLAUDE AGENT V5 - TESTING DEMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This demo showcases the agent's ability to:
✅ Make code changes autonomously
🧪 Test changes before creating PR
📊 Capture evidence and validation results
🚫 Prevent PRs if critical tests fail

Repository: ${config.repository.owner}/${config.repository.repo}
Branch: ${config.repository.branch}
Testing: ${config.options.enableTesting ? '✅ ENABLED' : '❌ DISABLED'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Create agent
  const agent = new ClaudeAgentV5(config);

  try {
    // Initialize (clones repo)
    await agent.initialize();

    // Example task: Make a simple UI change
    const task = `
Update the primary button color in the app to use a new shade of blue.

Requirements:
- Find the button component(s)
- Change the background color to #3B82F6 (blue-500)
- Make sure the change is consistent across all primary buttons
- Preserve all other styles and functionality
    `.trim();

    console.log('\n📝 Task:', task);

    // Process task
    const result = await agent.processTask(task);

    if (!result.success) {
      console.error('\n❌ Task failed:', result.error);
      process.exit(1);
    }

    console.log('\n✅ Task completed successfully!');
    console.log(`   Files modified: ${result.filesModified.length}`);
    result.filesModified.forEach(f => console.log(`   - ${f}`));

    // Testing workflow demonstration
    console.log('\n' + '═'.repeat(50));
    console.log('🧪 AUTOMATED TESTING WORKFLOW');
    console.log('═'.repeat(50));

    // Option 1: Run tests separately
    console.log('\n📋 Option 1: Run tests before PR creation');
    const testResult = await agent.testChanges(result);

    console.log('\n' + testResult.summary);

    // Check if tests passed
    if (testResult.passed) {
      console.log('\n✅ All tests passed! Safe to create PR.');
      
      // Create PR with test results included
      const pr = await agent.createPullRequest(
        result,
        'feat: Update primary button color to blue-500',
        undefined, // Use auto-generated body with test results
        { runTests: false } // Tests already run
      );

      console.log(`\n🎉 Success! PR created: ${pr.prUrl}`);
      
    } else {
      const errors = testResult.evidence.validationResults.filter(
        v => !v.passed && v.severity === 'error'
      );
      
      console.log(`\n❌ Tests failed with ${errors.length} critical errors.`);
      console.log('   PR NOT created. Fix issues first:');
      errors.forEach(e => console.log(`   - ${e.message}`));
    }

    // Option 2: Create PR with automatic testing
    console.log('\n\n📋 Option 2: Automatic testing during PR creation');
    console.log('   (Commented out - uncomment to try)');
    /*
    const pr = await agent.createPullRequest(
      result,
      'feat: Update primary button color',
      undefined,
      {
        runTests: true,           // Run tests automatically
        requireTestsPass: true    // Only create PR if tests pass
      }
    );
    */

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await agent.cleanup();
  }

  console.log('\n✅ Demo completed!\n');
}

// Example: Testing workflow with different scenarios
async function testingScenarios() {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TESTING SCENARIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  // Scenario 1: Tests pass → PR created
  console.log(`
1️⃣  SCENARIO: Tests Pass
   - Agent makes changes
   - Build succeeds ✅
   - Type checking passes ✅
   - Linting passes ✅
   → PR created with test evidence
  `);

  // Scenario 2: Build fails → No PR
  console.log(`
2️⃣  SCENARIO: Build Fails
   - Agent makes changes
   - Build fails ❌ (syntax error)
   → PR NOT created
   → Error details captured for debugging
  `);

  // Scenario 3: Warnings but no errors → PR created
  console.log(`
3️⃣  SCENARIO: Warnings Only
   - Agent makes changes
   - Build succeeds ✅
   - Type checking passes ✅
   - Linting warnings ⚠️
   → PR created with warnings noted
  `);

  // Scenario 4: Visual validation
  console.log(`
4️⃣  SCENARIO: Visual Validation (Future)
   - Agent makes UI changes
   - Build succeeds ✅
   - Launch app in test mode
   - Capture screenshots 📸
   - Validate DOM changes via CDP
   → PR created with visual evidence
  `);
}

// Run demo
if (require.main === module) {
  // Check for required environment variables
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ Error: ANTHROPIC_API_KEY not set in environment');
    console.error('   Set it in .env file or export it:');
    console.error('   export ANTHROPIC_API_KEY=your-key-here');
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ Error: GITHUB_TOKEN not set in environment');
    console.error('   Set it in .env file or export it:');
    console.error('   export GITHUB_TOKEN=your-token-here');
    process.exit(1);
  }

  // Show testing scenarios first
  testingScenarios();

  console.log('\nStarting demo in 3 seconds...\n');
  setTimeout(() => {
    main().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }, 3000);
}

module.exports = { main, testingScenarios };


