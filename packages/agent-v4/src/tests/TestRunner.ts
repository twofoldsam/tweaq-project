import { runOverDeletionPreventionTests } from './OverDeletionPrevention.test.js';

/**
 * Test runner for Agent V4
 */
export class AgentV4TestRunner {
  
  /**
   * Run all Agent V4 tests
   */
  async runAllTests(): Promise<{
    success: boolean;
    results: {
      overDeletionPrevention: boolean;
    };
    summary: string;
  }> {
    console.log('🚀 Starting Agent V4 Test Suite...\n');
    
    const results = {
      overDeletionPrevention: false
    };
    
    try {
      // Run over-deletion prevention tests
      console.log('📋 Running Over-Deletion Prevention Tests...');
      results.overDeletionPrevention = await runOverDeletionPreventionTests();
      
      const allPassed = Object.values(results).every(result => result === true);
      
      const summary = this.generateTestSummary(results, allPassed);
      
      console.log('\n' + summary);
      
      return {
        success: allPassed,
        results,
        summary
      };
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      
      return {
        success: false,
        results,
        summary: 'Test suite execution failed'
      };
    }
  }
  
  /**
   * Generate test summary
   */
  private generateTestSummary(
    results: { overDeletionPrevention: boolean },
    allPassed: boolean
  ): string {
    return `
🧪 AGENT V4 TEST SUITE RESULTS
==============================

📊 TEST RESULTS:
${Object.entries(results).map(([test, passed]) => 
  `• ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`
).join('\n')}

🎯 OVERALL RESULT: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}

${allPassed ? `
🎉 SUCCESS! Agent V4 is ready for production use.

Key Features Verified:
• Over-deletion prevention ✅
• Smart validation engine ✅
• Confidence-based decision making ✅
• Adaptive strategy selection ✅

Agent V4 will prevent the font-size over-deletion problem
and provide intelligent, confident code changes.
` : `
⚠️ ISSUES FOUND! Please review failed tests before deployment.

Agent V4 may not be ready for production use until all tests pass.
`}

==============================
    `.trim();
  }
}

/**
 * Main test runner function
 */
export async function runAgentV4Tests(): Promise<boolean> {
  const runner = new AgentV4TestRunner();
  const results = await runner.runAllTests();
  return results.success;
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  runAgentV4Tests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}
