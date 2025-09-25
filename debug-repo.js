// Debug script to explore repository structure
// Run this to see what files are available for mapping

const { buildRepoIndex } = require('./packages/mapping-remote/dist/index.js');
const keytar = require('keytar');

async function debugRepo() {
  try {
    console.log('🔍 Debugging repository structure...\n');
    
    // Get GitHub token
    const githubToken = await keytar.getPassword('smart-qa-github', 'github-token');
    if (!githubToken) {
      console.error('❌ No GitHub token found. Please authenticate first.');
      return;
    }
    
    // Build repository index
    const repoIndex = await buildRepoIndex({
      owner: 'twofoldsam',  // Replace with your GitHub username
      repo: 'picturist-website',  // Replace with your repository name
      ref: 'main',  // Replace with your default branch
      auth: githubToken
    });
    
    console.log(`✅ Repository indexed successfully!`);
    console.log(`📁 Total files: ${repoIndex.files.length}`);
    console.log(`📂 Common source folders: ${repoIndex.commonSourceFolders.join(', ')}\n`);
    
    // Show frontend-related files
    console.log('🎨 Frontend files found:');
    const frontendFiles = repoIndex.files
      .filter(file => 
        file.type === 'blob' && 
        /\.(tsx|jsx|ts|js|vue|svelte|astro)$/i.test(file.path)
      )
      .slice(0, 20); // Show first 20 files
      
    frontendFiles.forEach(file => {
      console.log(`  📄 ${file.path}`);
    });
    
    if (frontendFiles.length === 0) {
      console.log('  ❌ No frontend files found!');
      console.log('\n📋 All files in repository:');
      repoIndex.files.slice(0, 30).forEach(file => {
        console.log(`  ${file.type === 'blob' ? '📄' : '📁'} ${file.path}`);
      });
    }
    
    console.log(`\n${frontendFiles.length < repoIndex.files.length ? '... and ' + (repoIndex.files.length - frontendFiles.length) + ' more files' : ''}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugRepo();
