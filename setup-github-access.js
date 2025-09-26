/**
 * Setup script to configure GitHub access for Agent V2
 */

const keytar = require('keytar');
const Store = require('electron-store');

async function setupGitHubAccess() {
  console.log('🔧 Setting up GitHub access for Agent V2...');
  
  try {
    // Initialize electron store
    const store = new Store();
    
    // Check if GitHub token exists
    let githubToken = await keytar.getPassword('smart-qa-github', 'github-token');
    
    if (!githubToken) {
      console.log('❌ No GitHub token found in keytar');
      console.log('💡 Please set up GitHub authentication first:');
      console.log('   1. Open the Tweaq desktop app');
      console.log('   2. Go to Settings > GitHub');
      console.log('   3. Connect your GitHub account');
      return false;
    }
    
    console.log('✅ GitHub token found in keytar');
    
    // Check if GitHub repository configuration exists
    const githubConfig = store.get('github');
    
    if (!githubConfig) {
      console.log('❌ No GitHub repository configuration found');
      console.log('💡 Please configure a repository:');
      console.log('   1. Open the Tweaq desktop app');
      console.log('   2. Go to Settings > Repository');
      console.log('   3. Select a repository to work with');
      return false;
    }
    
    console.log('✅ GitHub repository configuration found:', {
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      baseBranch: githubConfig.baseBranch || 'main'
    });
    
    // Test GitHub API access
    const { RemoteRepo } = require('./packages/github-remote/dist/index.js');
    const remoteRepo = new RemoteRepo(githubToken);
    
    try {
      console.log('🧪 Testing GitHub API access...');
      
      // Try to read a simple file (like README.md or package.json)
      const testFiles = ['README.md', 'package.json', 'App.tsx', 'index.html'];
      let accessWorking = false;
      
      for (const testFile of testFiles) {
        try {
          await remoteRepo.readFile({
            owner: githubConfig.owner,
            repo: githubConfig.repo,
            path: testFile
          });
          console.log(`✅ Successfully read ${testFile}`);
          accessWorking = true;
          break;
        } catch (error) {
          console.log(`⚠️ Could not read ${testFile}: ${error.message}`);
        }
      }
      
      if (!accessWorking) {
        console.log('❌ GitHub API access test failed');
        console.log('💡 Possible issues:');
        console.log('   - Repository does not exist or is private');
        console.log('   - GitHub token does not have sufficient permissions');
        console.log('   - Repository owner/name is incorrect');
        return false;
      }
      
      console.log('🎉 GitHub access is properly configured!');
      console.log('✅ Agent V2 should now be able to retrieve and modify files');
      
      return true;
      
    } catch (error) {
      console.log('❌ GitHub API test failed:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

async function suggestRepositoryFix() {
  console.log('\n🔧 Repository Access Troubleshooting:');
  console.log('');
  console.log('1. **Check Repository Structure**:');
  console.log('   - Ensure the repository has the expected files');
  console.log('   - Verify component files exist in the expected paths');
  console.log('');
  console.log('2. **Verify Repository Permissions**:');
  console.log('   - Repository should be public OR');
  console.log('   - GitHub token should have access to private repository');
  console.log('');
  console.log('3. **Test with a Simple Repository**:');
  console.log('   - Try with a simple React project first');
  console.log('   - Ensure it has basic components in src/components/');
  console.log('');
  console.log('4. **Repository Examples that Work Well**:');
  console.log('   - Create React App projects');
  console.log('   - Next.js projects');
  console.log('   - Simple React component libraries');
}

// Run setup if called directly
if (require.main === module) {
  setupGitHubAccess().then(success => {
    if (!success) {
      suggestRepositoryFix();
    }
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupGitHubAccess, suggestRepositoryFix };
