import { RemoteRepo } from './remote-repo.js';

/**
 * Example demonstrating the acceptance criteria:
 * 1. Read a file by path@ref
 * 2. Create a new empty commit on a new branch
 * 3. Open a PR
 */
async function demonstrateAcceptanceCriteria() {
  // Initialize RemoteRepo with GitHub token
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const repo = new RemoteRepo(token);
  const owner = 'your-username';
  const repoName = 'your-repo';
  const baseBranch = 'main';
  const newBranch = 'feature/empty-commit-example';

  try {
    console.log('🔍 Reading file by path@ref...');
    
    // 1. Read a file by path@ref (acceptance criteria)
    const fileContent = await repo.readFile({
      owner,
      repo: repoName,
      path: 'README.md',
      ref: baseBranch,
    });
    
    console.log(`✅ Successfully read file content (${fileContent.length} characters)`);
    console.log('First 100 characters:', fileContent.substring(0, 100) + '...');

    console.log('🌿 Creating new branch...');
    
    // 2. Create a new branch from the base branch
    await repo.createBranchFrom({
      owner,
      repo: repoName,
      newRef: newBranch,
      fromRef: baseBranch,
    });
    
    console.log(`✅ Created branch: ${newBranch}`);

    console.log('📝 Creating empty commit...');
    
    // 3. Create an empty commit on the new branch
    // First get the current tree SHA from the base branch
    const tree = await repo.getRepoTree({
      owner,
      repo: repoName,
      ref: baseBranch,
    });
    
    // Create a commit with the same tree (empty commit)
    const commit = await repo.createCommit({
      owner,
      repo: repoName,
      message: 'Empty commit for demonstration',
      treeSha: tree.sha,
      parentSha: tree.sha, // This makes it an empty commit
    });
    
    console.log(`✅ Created empty commit: ${commit.sha}`);

    console.log('🔄 Updating branch reference...');
    
    // Update the new branch to point to the new commit
    await repo.updateRef({
      owner,
      repo: repoName,
      ref: newBranch,
      sha: commit.sha,
    });
    
    console.log(`✅ Updated ${newBranch} to point to ${commit.sha}`);

    console.log('🔃 Opening pull request...');
    
    // 4. Open a PR (acceptance criteria)
    const pr = await repo.openPR({
      owner,
      repo: repoName,
      base: baseBranch,
      head: newBranch,
      title: 'Demo: Empty commit via RemoteRepo',
      body: `This PR demonstrates the RemoteRepo acceptance criteria:
      
1. ✅ Read file by path@ref: Successfully read README.md from ${baseBranch}
2. ✅ Create empty commit: Created commit ${commit.sha}
3. ✅ Open PR: This pull request

Created using the @smart-qa/github-remote package.`,
      labels: ['demo', 'automated'],
    });
    
    console.log(`✅ Opened PR #${pr.number}: ${pr.html_url}`);
    
    // Display cache stats
    const stats = repo.getCacheStats();
    console.log('📊 Cache statistics:', stats);
    
    console.log('🎉 All acceptance criteria completed successfully!');
    
    return {
      fileContent,
      branch: newBranch,
      commit: commit.sha,
      pr: pr.number,
      prUrl: pr.html_url,
    };
    
  } catch (error) {
    console.error('❌ Error during demonstration:', error);
    throw error;
  }
}

/**
 * Alternative example showing more advanced features
 */
async function advancedExample() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const repo = new RemoteRepo(token, {
    ttl: 10 * 60 * 1000, // 10 minutes cache TTL
    maxSize: 500, // Cache up to 500 responses
  });

  const owner = 'your-username';
  const repoName = 'your-repo';

  try {
    console.log('🔍 Searching code...');
    
    // Search for TypeScript files containing 'interface'
    const searchResults = await repo.searchCode({
      owner,
      repo: repoName,
      q: 'interface extension:ts',
      per_page: 5,
    });
    
    console.log(`Found ${searchResults.total_count} results`);
    searchResults.items.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.path} (${item.name})`);
    });

    console.log('🌳 Getting repository tree...');
    
    // Get repo tree with caching
    const tree = await repo.getRepoTree({
      owner,
      repo: repoName,
      ref: 'main',
      recursive: false, // Shallow first
    });
    
    console.log(`Tree has ${tree.tree.length} entries`);
    
    // Find a directory and get its subtree
    const srcDir = tree.tree.find(entry => entry.path === 'src' && entry.type === 'tree');
    if (srcDir) {
      console.log('📁 Getting src/ subtree...');
      const srcTree = await repo.getSubtree({
        owner,
        repo: repoName,
        ref: 'main',
        path: 'src',
      });
      console.log(`src/ has ${srcTree.tree.length} entries`);
    }

    console.log('📖 Reading multiple files...');
    
    // Read multiple files in parallel
    const filesToRead = ['package.json', 'README.md', 'tsconfig.json'];
    const fileContents = await Promise.allSettled(
      filesToRead.map(path =>
        repo.readFile({
          owner,
          repo: repoName,
          path,
          ref: 'main',
        })
      )
    );
    
    fileContents.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${filesToRead[i]}: ${result.value.length} characters`);
      } else {
        console.log(`❌ ${filesToRead[i]}: ${result.reason.message}`);
      }
    });

    // Show cache efficiency
    const stats = repo.getCacheStats();
    console.log('📊 Final cache statistics:', stats);

  } catch (error) {
    console.error('❌ Error in advanced example:', error);
    throw error;
  }
}

// Export examples for use
export { demonstrateAcceptanceCriteria, advancedExample };

// If run directly
if (require.main === module) {
  demonstrateAcceptanceCriteria()
    .then(() => console.log('Demo completed'))
    .catch(console.error);
}
