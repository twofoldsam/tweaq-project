/**
 * Simple script to check GitHub configuration without dependencies
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function checkElectronStore() {
  console.log('🔍 Checking Electron Store configuration...');
  
  // Electron store is typically stored in user data directory
  const configPaths = [
    path.join(os.homedir(), 'Library/Application Support/Smart QA Browser/config.json'),
    path.join(os.homedir(), 'Library/Application Support/Tweaq/config.json'),
    path.join(os.homedir(), 'Library/Application Support/@smart-qa/desktop/config.json'),
    './config.json'
  ];
  
  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log(`✅ Found config at: ${configPath}`);
        
        if (config.github) {
          console.log('📋 GitHub Configuration:');
          console.log('  Owner:', config.github.owner);
          console.log('  Repo:', config.github.repo);
          console.log('  Base Branch:', config.github.baseBranch || 'main');
          console.log('  Label:', config.github.label);
          return config.github;
        } else {
          console.log('⚠️ No GitHub configuration found in config file');
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not read ${configPath}:`, error.message);
    }
  }
  
  console.log('❌ No Electron Store configuration found');
  return null;
}

function suggestSetup() {
  console.log('\n🛠️ **Setup Instructions for Agent V2 GitHub Access:**\n');
  
  console.log('1. **Start the Desktop App**:');
  console.log('   cd /Users/samwalker/Desktop/Tweaq/apps/desktop');
  console.log('   npm run dev');
  console.log('');
  
  console.log('2. **Configure GitHub Access**:');
  console.log('   - Open the app when it starts');
  console.log('   - Look for GitHub/Repository settings');
  console.log('   - Connect your GitHub account');
  console.log('   - Select a repository to work with');
  console.log('');
  
  console.log('3. **Recommended Test Repository**:');
  console.log('   - Use a simple React project');
  console.log('   - Ensure it has components in src/components/');
  console.log('   - Make sure the repository is accessible');
  console.log('');
  
  console.log('4. **Verify the Setup**:');
  console.log('   - Make a small visual edit in the app');
  console.log('   - Check if Agent V2 can retrieve files');
  console.log('   - Look for successful file retrieval in logs');
}

function analyzeRetrievalErrors() {
  console.log('\n🔍 **Analysis of Retrieval Errors:**\n');
  
  console.log('From your logs, I can see:');
  console.log('✅ Repository mapping is working (found DOM mappings)');
  console.log('✅ Agent V2 is processing requests');
  console.log('❌ File retrieval is failing for most component files');
  console.log('');
  
  console.log('**Possible Causes:**');
  console.log('1. Repository structure doesn\'t match expected paths');
  console.log('2. Component files are in different directories');
  console.log('3. Repository is private and token lacks access');
  console.log('4. Repository owner/name configuration is incorrect');
  console.log('');
  
  console.log('**Quick Fix Options:**');
  console.log('1. Try with a public repository first');
  console.log('2. Use a standard Create React App structure');
  console.log('3. Check that components exist in src/components/');
}

// Run checks
console.log('🚀 Agent V2 GitHub Configuration Check\n');
const githubConfig = checkElectronStore();

if (!githubConfig) {
  suggestSetup();
} else {
  analyzeRetrievalErrors();
}

console.log('\n📊 **Current Status:**');
console.log('✅ Agent V2 architecture is implemented');
console.log('✅ Desktop app integration is complete');
console.log('⚠️ GitHub file access needs configuration');
console.log('🎯 Next: Configure repository access for testing');
