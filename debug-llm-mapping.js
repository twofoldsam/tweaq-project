// Debug script to test LLM-based mapping
// This simulates what the LLM would see and how it would analyze the mapping

const { buildRepoIndex } = require('./packages/mapping-remote/dist/index.js');
const { MockLLMProvider } = require('./packages/mapping-remote/dist/llm-provider.js');
const keytar = require('keytar');

// Mock visual edit for testing
const mockVisualEdit = {
  id: 'test-edit-1',
  timestamp: Date.now(),
  element: {
    selector: 'p.text-lg.md:text-xl.lg:text-2xl.text-[var(--picturist-text-muted)].max-w-3xl',
    tagName: 'P',
    id: undefined,
    className: 'text-lg md:text-xl lg:text-2xl text-[var(--picturist-text-muted)] max-w-3xl'
  },
  changes: [
    {
      property: 'fontSize',
      before: '24px',
      after: '32px'
    }
  ]
};

async function debugLLMMapping() {
  try {
    console.log('🧠 Testing LLM-based Visual Change Mapping\n');
    
    // Get GitHub token
    const githubToken = await keytar.getPassword('smart-qa-github', 'github-token');
    if (!githubToken) {
      console.error('❌ No GitHub token found. Please authenticate first.');
      return;
    }
    
    // Build repository index
    console.log('📂 Building repository index...');
    const repoIndex = await buildRepoIndex({
      owner: 'twofoldsam',  // Replace with your username
      repo: 'picturist-website',  // Replace with your repo
      ref: 'main',
      auth: githubToken
    });
    
    console.log(`✅ Repository indexed: ${repoIndex.files.length} files\n`);
    
    // Simulate the LLM analysis context
    const currentUrl = 'https://picturist.vercel.app/'; // Replace with your site URL
    const urlPath = new URL(currentUrl).pathname;
    const elementDescription = `${mockVisualEdit.element.tagName}${mockVisualEdit.element.id ? '#' + mockVisualEdit.element.id : ''}${mockVisualEdit.element.className ? '.' + mockVisualEdit.element.className.split(' ').join('.') : ''}`;
    
    // Get frontend files
    const relevantFiles = repoIndex.files
      .filter(file => 
        file.type === 'blob' && 
        /\.(tsx|jsx|ts|js|vue|svelte|astro|html)$/i.test(file.path)
      )
      .slice(0, 30)
      .map(file => ({
        path: file.path,
        size: file.size || 0
      }));
    
    const changesDescription = mockVisualEdit.changes.map(change => 
      `${change.property}: "${change.before}" → "${change.after}"`
    ).join(', ');
    
    console.log('🎯 LLM Analysis Context:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Website URL: ${currentUrl}`);
    console.log(`📍 URL Path: ${urlPath}`);
    console.log(`🎨 Element: ${elementDescription}`);
    console.log(`🔄 Changes: ${changesDescription}`);
    console.log(`📁 Source folders: ${repoIndex.commonSourceFolders.join(', ')}\n`);
    
    console.log('📋 Frontend Files Available:');
    relevantFiles.forEach(file => {
      console.log(`  📄 ${file.path} (${file.size} bytes)`);
    });
    
    console.log('\n🤖 What the LLM would analyze:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. URL pattern matching (/ → index, layout, or main page files)');
    console.log('2. Element analysis (P tag with Tailwind classes)');
    console.log('3. Class pattern analysis (text-lg, md:text-xl suggests responsive design)');
    console.log('4. Repository structure (Next.js, React, or other framework patterns)');
    console.log('5. File size heuristics (larger files might be main pages)');
    
    // Simulate what a smart LLM might conclude
    console.log('\n🎯 Likely LLM Analysis Result:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Find likely candidates based on patterns
    const indexFiles = relevantFiles.filter(f => f.path.includes('index.'));
    const pageFiles = relevantFiles.filter(f => f.path.includes('page.') || f.path.includes('Page.'));
    const componentFiles = relevantFiles.filter(f => f.path.includes('component') || f.path.includes('Component'));
    const appFiles = relevantFiles.filter(f => f.path.includes('app.') || f.path.includes('App.'));
    
    console.log(`📊 Analysis:`);
    console.log(`   • Index files found: ${indexFiles.length}`);
    console.log(`   • Page files found: ${pageFiles.length}`);
    console.log(`   • Component files found: ${componentFiles.length}`);
    console.log(`   • App files found: ${appFiles.length}`);
    
    if (indexFiles.length > 0) {
      console.log(`\n🎯 Most likely target: ${indexFiles[0].path}`);
      console.log(`   Confidence: 0.8`);
      console.log(`   Reasoning: Root path (/) typically maps to index files, and the element appears to be main content`);
    } else if (appFiles.length > 0) {
      console.log(`\n🎯 Most likely target: ${appFiles[0].path}`);
      console.log(`   Confidence: 0.7`);
      console.log(`   Reasoning: App files often contain main layout and content for root pages`);
    } else if (pageFiles.length > 0) {
      console.log(`\n🎯 Most likely target: ${pageFiles[0].path}`);
      console.log(`   Confidence: 0.6`);
      console.log(`   Reasoning: Page files are likely candidates for main content`);
    } else {
      console.log(`\n⚠️  No obvious candidates found`);
      console.log(`   Would fall back to deterministic or URL-based mapping`);
    }
    
    console.log('\n💡 To test with a real LLM:');
    console.log('   1. Configure OpenAI or Claude API key in LLM Settings');
    console.log('   2. Make a visual edit and confirm it');
    console.log('   3. Check console for "🧠 Using LLM to analyze visual change..."');
    console.log('   4. Look for "🎯 LLM mapped to: [file] (confidence: X)"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugLLMMapping();
