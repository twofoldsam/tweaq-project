/**
 * Direct test of Agent V2 functionality
 * This script sends a test request directly to the agent
 */

const { ipcRenderer } = require('electron');

// Test visual edit request
const testRequest = {
  element: {
    tagName: 'button',
    className: 'btn btn-primary',
    textContent: 'Click Me',
    selector: 'button.btn-primary'
  },
  description: 'Change button background color from blue to green and increase font size',
  context: {
    framework: 'react',
    stylingSystem: 'css-modules'
  }
};

async function testAgentV2Direct() {
  console.log('🧪 Testing Agent V2 directly...');
  console.log('📝 Test request:', JSON.stringify(testRequest, null, 2));
  
  try {
    // Send request to the main process
    const result = await ipcRenderer.invoke('process-visual-request', testRequest);
    
    console.log('✅ Agent V2 Response:', JSON.stringify(result, null, 2));
    
    if (result.changes && result.changes.length > 0) {
      console.log('🎉 Success! Agent V2 generated code changes:');
      result.changes.forEach((change, index) => {
        console.log(`  ${index + 1}. ${change.filePath}`);
        console.log(`     Action: ${change.changeType}`);
        console.log(`     Reasoning: ${change.reasoning}`);
      });
    }
    
    if (result.agentV2Result) {
      console.log('📊 Agent V2 Metadata:');
      console.log(`  - File Changes: ${result.agentV2Result.fileChanges?.length || 0}`);
      console.log(`  - Validation Score: ${((result.agentV2Result.validation?.score || 0) * 100).toFixed(1)}%`);
      console.log(`  - PR Created: ${result.agentV2Result.prResult ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    console.error('❌ Agent V2 test failed:', error);
  }
}

// Export for use in renderer process
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testAgentV2Direct, testRequest };
}

// Run if called directly (in main process context)
if (typeof window === 'undefined' && require.main === module) {
  console.log('⚠️ This script should be run in the Electron renderer process');
  console.log('💡 Use the browser console in the Tweaq desktop app instead');
}
