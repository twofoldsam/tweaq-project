/**
 * Basic usage example for @smart-qa/mapping-remote
 * 
 * This example demonstrates how to:
 * 1. Build a repository index
 * 2. Get deterministic hints
 * 3. Augment with LLM analysis when hints are weak
 */

import { 
  buildRepoIndex, 
  getDeterministicHints, 
  llmAugmentHints,
  MappingEngine,
  MockLLMProvider,
  OpenAIProvider 
} from '@smart-qa/mapping-remote';

async function basicExample() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Optional

  // 1. Build repository index
  console.log('Building repository index...');
  const repoIndex = await buildRepoIndex({
    owner: 'facebook',
    repo: 'react',
    ref: 'main',
    auth: GITHUB_TOKEN
  });

  console.log(`Indexed ${repoIndex.files.length} files from ${repoIndex.commonSourceFolders.length} source folders`);

  // 2. Example DOM node to find source for
  const nodeSnapshot = {
    'data-testid': 'submit-button',
    className: 'btn btn-primary',
    id: 'checkout-submit',
    tagName: 'button',
    textContent: 'Complete Purchase'
  };

  const urlPath = '/checkout';

  // 3. Get deterministic hints
  console.log('\nGetting deterministic hints...');
  const deterministicHints = await getDeterministicHints({
    nodeSnapshot,
    urlPath,
    repoIndex,
    auth: GITHUB_TOKEN
  });

  console.log(`Found ${deterministicHints.length} deterministic hints:`);
  deterministicHints.forEach((hint, i) => {
    console.log(`${i + 1}. ${hint.filePath} (${hint.evidence}, confidence: ${hint.confidence.toFixed(2)})`);
  });

  // 4. Check if we need LLM augmentation
  const highConfidenceHints = deterministicHints.filter(h => h.confidence >= 0.7);
  const needsAugmentation = deterministicHints.length < 3 || highConfidenceHints.length === 0;

  if (needsAugmentation) {
    console.log('\nDeterministic hints are weak, augmenting with LLM analysis...');
    
    // Use mock provider if no OpenAI key available
    const llmProvider = OPENAI_API_KEY 
      ? new OpenAIProvider(OPENAI_API_KEY, 'gpt-4')
      : new MockLLMProvider();

    const augmentedHints = await llmAugmentHints({
      nodeSnapshot,
      urlPath,
      deterministicHints,
      repoIndex,
      auth: GITHUB_TOKEN,
      llmProvider
    });

    console.log(`\nAugmented to ${augmentedHints.length} total hints:`);
    augmentedHints.forEach((hint, i) => {
      console.log(`${i + 1}. ${hint.filePath}`);
      console.log(`   Evidence: ${hint.evidence}, Confidence: ${hint.confidence.toFixed(2)}`);
      if (hint.rationale) {
        console.log(`   Rationale: ${hint.rationale}`);
      }
      console.log();
    });
  } else {
    console.log('\nDeterministic hints are strong enough, no LLM augmentation needed.');
  }
}

async function advancedExample() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // Initialize engine with LLM provider
  const llmProvider = OPENAI_API_KEY 
    ? new OpenAIProvider(OPENAI_API_KEY, 'gpt-4')
    : new MockLLMProvider();

  const engine = new MappingEngine(GITHUB_TOKEN, llmProvider);

  // Build index for a more complex repository
  console.log('\n=== Advanced Example ===');
  console.log('Building index for a complex repository...');
  
  const repoIndex = await engine.buildRepoIndex({
    owner: 'vercel',
    repo: 'next.js',
    ref: 'canary'
  });

  console.log(`Indexed ${repoIndex.files.length} files`);

  // Complex DOM node scenario
  const complexNode = {
    className: 'navigation-item active',
    'data-testid': 'nav-dashboard',
    tagName: 'a',
    textContent: 'Dashboard',
    attributes: {
      'href': '/dashboard',
      'aria-current': 'page'
    }
  };

  // Get hints with full workflow
  const deterministicHints = await engine.getDeterministicHints({
    nodeSnapshot: complexNode,
    urlPath: '/dashboard',
    repoIndex
  });

  const finalHints = await engine.llmAugmentHints({
    nodeSnapshot: complexNode,
    urlPath: '/dashboard',
    deterministicHints,
    repoIndex
  });

  // Get statistics
  const stats = engine.getHintStatistics(finalHints);
  console.log('\nFinal Results:');
  console.log(`Total hints: ${stats.total}`);
  console.log(`By evidence type:`, stats.byEvidence);
  console.log(`Average confidence: ${stats.averageConfidence.toFixed(2)}`);
  console.log(`High confidence hints: ${stats.highConfidenceCount}`);

  // Show top 3 hints with details
  console.log('\nTop 3 hints:');
  finalHints.slice(0, 3).forEach((hint, i) => {
    console.log(`${i + 1}. ${hint.filePath}`);
    console.log(`   Evidence: ${hint.evidence}, Confidence: ${hint.confidence.toFixed(2)}`);
    if (hint.matchedValue) {
      console.log(`   Matched: "${hint.matchedValue}"`);
    }
    if (hint.rationale) {
      console.log(`   Rationale: ${hint.rationale}`);
    }
    console.log();
  });
}

// Run examples
if (require.main === module) {
  Promise.resolve()
    .then(() => basicExample())
    .then(() => advancedExample())
    .catch(console.error);
}

export { basicExample, advancedExample };
