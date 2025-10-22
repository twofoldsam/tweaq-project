# Quick Start: Testing Workflow

## What You Can Do Now

Your Claude Agent V5 can now **automatically test changes before creating PRs**. This means designers can make changes and verify they work without needing a developer to pull and test the code.

## 5-Minute Setup

### 1. Install Dependencies (Already Done ✅)

```bash
cd packages/agent-v5
pnpm install  # Playwright is already installed
```

### 2. Basic Usage

```javascript
const { ClaudeAgentV5 } = require('./dist/ClaudeAgentV5');

const agent = new ClaudeAgentV5({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
  repository: {
    owner: 'your-org',
    repo: 'your-repo',
    branch: 'main'
  },
  options: {
    enableTesting: true,  // 👈 Enable automated testing
    buildCommand: 'npm run build'
  }
});

await agent.initialize();

// Make changes
const result = await agent.processTask('Change button color to blue');

// Create PR with automatic testing
await agent.createPullRequest(result, 'feat: Update button color', undefined, {
  runTests: true,           // Test before creating PR
  requireTestsPass: true    // Only create PR if tests pass
});
```

## What Gets Tested Automatically

✅ **Build Validation** - Ensures your code compiles  
✅ **TypeScript Type Check** - Catches type errors  
✅ **Linting** - Checks code quality  
✅ **Build Output** - Verifies dist/ artifacts  

## Test Results in Your PR

Every PR will include a test results table:

```markdown
## 🧪 Automated Testing Results

| Status | Check | Result |
|--------|-------|--------|
| ✅ | Build | Application built successfully in 12.5s |
| ✅ | TypeScript | Type checking passed |
| ⚠️ | Linting | 2 warnings (non-blocking) |
```

## Run the Demo

```bash
cd packages/agent-v5

# Set your credentials
export ANTHROPIC_API_KEY=your-key
export GITHUB_TOKEN=your-token
export TEST_REPO_OWNER=your-org
export TEST_REPO_NAME=your-repo

# Run demo
node demo-with-testing.js
```

## Two Ways to Test

### Option 1: Test Then Create PR

```javascript
// Make changes
const result = await agent.processTask(instruction);

// Test changes manually
const testResult = await agent.testChanges(result);

if (testResult.passed) {
  // Create PR
  await agent.createPullRequest(result);
} else {
  console.error('Tests failed:', testResult.summary);
}
```

### Option 2: Automatic Testing (Recommended)

```javascript
// Make changes and create PR with automatic testing
const result = await agent.processTask(instruction);

await agent.createPullRequest(result, 'feat: My changes', undefined, {
  runTests: true,          // Automatically test
  requireTestsPass: true   // Block PR if tests fail
});
```

## For Desktop App

Your desktop app build can also be tested:

```javascript
options: {
  enableTesting: true,
  buildCommand: 'npm run build:electron'
}
```

## Troubleshooting

### Build Fails
**Problem:** Tests show build failed  
**Solution:** Check the test logs in PR description for error details

### Tests Timeout
**Problem:** Tests taking too long  
**Solution:** Increase timeout:
```javascript
options: {
  buildCommand: 'npm run build',
  timeout: 120000  // 2 minutes
}
```

### Playwright Not Found
**Problem:** Visual testing fails  
**Solution:** Playwright is optional. Build testing works without it.

## Next Steps

1. ✅ Try the demo: `node demo-with-testing.js`
2. ✅ Enable testing in your workflows
3. ✅ Review test results in PRs
4. 🔜 Add visual testing (Phase 2)

## Benefits

**Before:** Designer → Agent → Untested PR → Developer pulls & tests (30-60 min)  
**After:** Designer → Agent → Tested PR → Developer reviews (2-5 min)  

**Time saved: 90%+ 🚀**

---

For complete documentation, see [TESTING_WORKFLOW.md](./TESTING_WORKFLOW.md)


