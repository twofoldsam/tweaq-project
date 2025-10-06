# Agent V5 - Desktop App Integration Guide

## ✅ Using Existing Credentials

Agent V5 seamlessly integrates with your existing Tweaq desktop app by using:
1. **GitHub OAuth token** - Already stored in keytar from user authentication
2. **Anthropic API key** - Already configured via llm-config.js, env vars, or UI settings

**No new authentication needed!**

---

## 🚀 Quick Integration

### Step 1: Import Integration Module

```typescript
// In apps/desktop/electron/main.ts

import { 
  processVisualRequestIPC,
  checkAgentV5StatusIPC 
} from '../../../packages/agent-v5/dist/integration/MainProcessIntegration.js';
```

### Step 2: Add IPC Handlers

```typescript
// Add these handlers to your main.ts

// Process requests with Agent V5
ipcMain.handle('process-visual-request-agent-v5', async (event, request) => {
  return await processVisualRequestIPC(request);
});

// Check if Agent V5 is available
ipcMain.handle('check-agent-v5-status', async () => {
  return await checkAgentV5StatusIPC();
});
```

### Step 3: Use in Renderer (React)

```typescript
// In your React component

async function handleAgentV5Request() {
  // Check status first
  const status = await window.electronAPI.invoke('check-agent-v5-status');
  
  if (!status.available) {
    alert(status.message); // e.g., "Missing: GitHub authentication"
    return;
  }

  // Process with Agent V5
  const result = await window.electronAPI.invoke('process-visual-request-agent-v5', {
    instruction: "make all the buttons bounce on hover",
    owner: "your-username",
    repo: "your-repo",
    branch: "main",
    repoContext: {
      framework: "React",
      stylingSystem: "Tailwind"
    }
  });

  if (result.success) {
    console.log(`✅ PR created: ${result.prUrl}`);
    console.log(`📁 Files modified: ${result.filesModified.length}`);
    console.log(`🔧 Tool calls: ${result.toolCalls}`);
  } else {
    console.error(`❌ Failed: ${result.error}`);
  }
}
```

---

## 📋 Complete Example

### Main Process (main.ts)

```typescript
// After your existing imports
import { 
  processVisualRequestIPC,
  checkAgentV5StatusIPC 
} from '../../../packages/agent-v5/dist/integration/MainProcessIntegration.js';

// ... existing code ...

// Add IPC handlers after your other handlers
safeIpcHandle('process-visual-request-agent-v5', async (event, request) => {
  console.log('🤖 IPC: Process with Agent V5');
  return await processVisualRequestIPC(request);
});

safeIpcHandle('check-agent-v5-status', async () => {
  console.log('🤖 IPC: Check Agent V5 status');
  return await checkAgentV5StatusIPC();
});
```

### Renderer Process (React Component)

```typescript
import { useState } from 'react';

export function AgentV5Panel() {
  const [status, setStatus] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    const result = await window.electronAPI.invoke('check-agent-v5-status');
    setStatus(result);
  }

  async function processWithAgentV5() {
    setProcessing(true);
    try {
      const result = await window.electronAPI.invoke('process-visual-request-agent-v5', {
        instruction: "make all the buttons bounce on hover",
        owner: "your-username",
        repo: "your-repo",
        branch: "main",
        repoContext: {
          framework: "React",
          stylingSystem: "Tailwind"
        }
      });

      if (result.success) {
        alert(`Success! PR created: ${result.prUrl}`);
      } else {
        alert(`Failed: ${result.error}`);
      }
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div>
      <h2>Agent V5 - Claude Agentic System</h2>
      
      {status && (
        <div className={status.available ? 'status-good' : 'status-warning'}>
          {status.message}
          <ul>
            <li>GitHub Auth: {status.githubAuth ? '✅' : '❌'}</li>
            <li>Anthropic Key: {status.anthropicKey ? '✅' : '❌'}</li>
          </ul>
        </div>
      )}

      <button 
        onClick={processWithAgentV5}
        disabled={!status?.available || processing}
      >
        {processing ? 'Processing...' : 'Process with Agent V5'}
      </button>
    </div>
  );
}
```

---

## 🔑 Credential Management

### GitHub Token (Already Handled)
```typescript
// Your app already does this via OAuth
// Stored in: keytar.getPassword('smart-qa-github', 'github-token')
// Agent V5 automatically uses it!
```

### Anthropic API Key (Already Handled)
```typescript
// Your app already checks (in priority order):
// 1. llm-config.js: llmConfig.claude.apiKey
// 2. Environment: process.env.ANTHROPIC_API_KEY
// 3. UI Settings: keytar.getPassword('smart-qa-llm', 'claude-api-key')
// Agent V5 automatically uses it!
```

**No changes needed to your existing credential management!**

---

## 🎯 API Reference

### `processVisualRequestIPC(request)`

Process a task with Agent V5.

**Request:**
```typescript
{
  instruction: string;        // "make all the buttons bounce on hover"
  owner: string;             // GitHub owner
  repo: string;              // GitHub repo
  branch: string;            // Branch to work on
  repoContext?: {            // Optional context
    framework?: string;      // e.g., "React"
    stylingSystem?: string;  // e.g., "Tailwind"
    components?: any[];
  }
}
```

**Response:**
```typescript
{
  success: boolean;
  prUrl?: string;           // GitHub PR URL
  prNumber?: number;        // PR number
  filesModified?: string[]; // List of modified files
  toolCalls?: number;       // Number of tool calls made
  reasoning?: string[];     // Agent's reasoning steps
  error?: string;           // Error message if failed
}
```

### `checkAgentV5StatusIPC()`

Check if Agent V5 can be used.

**Response:**
```typescript
{
  available: boolean;       // Can Agent V5 be used?
  githubAuth: boolean;      // GitHub token available?
  anthropicKey: boolean;    // Anthropic key available?
  message: string;          // Status message for UI
}
```

---

## 🔄 Migration from Agent V4

### Before (Agent V4):
```typescript
ipcMain.handle('process-visual-request', async (event, request) => {
  return await processVisualRequestWithAgentV4(request);
});
```

### After (Add Agent V5 alongside):
```typescript
// Keep Agent V4 for safety
ipcMain.handle('process-visual-request', async (event, request) => {
  return await processVisualRequestWithAgentV4(request);
});

// Add Agent V5 as new option
ipcMain.handle('process-visual-request-agent-v5', async (event, request) => {
  return await processVisualRequestIPC(request);
});
```

### UI - Let User Choose:
```typescript
<select onChange={(e) => setAgentVersion(e.target.value)}>
  <option value="v4">Agent V4 (Safe, Validated)</option>
  <option value="v5">Agent V5 (Powerful, Autonomous)</option>
</select>

<button onClick={() => {
  if (agentVersion === 'v5') {
    processWithAgentV5();
  } else {
    processWithAgentV4();
  }
}}>
  Process Changes
</button>
```

---

## ✅ Benefits

### 1. **No New Authentication**
- Uses existing GitHub OAuth
- Uses existing Anthropic API key
- Zero user friction

### 2. **Drop-in Integration**
- Add 2 IPC handlers
- Everything else works automatically
- No changes to existing code

### 3. **Backward Compatible**
- Agent V4 still works
- Agent V5 is an addition
- Users can choose

### 4. **Automatic Credential Discovery**
```typescript
// Agent V5 automatically finds:
// ✅ GitHub token from keytar
// ✅ Anthropic key from config/env/UI
// ✅ No manual configuration needed!
```

---

## 🧪 Testing

### Test Credential Discovery:
```typescript
// In main.ts console
import { getGitHubTokenForAgent, getClaudeApiKeyForAgent } from './packages/agent-v5/dist/integration/MainProcessIntegration.js';

// Test GitHub token
const githubToken = await getGitHubTokenForAgent();
console.log('GitHub token:', githubToken ? 'Found ✅' : 'Missing ❌');

// Test Anthropic key
const anthropicKey = await getClaudeApiKeyForAgent();
console.log('Anthropic key:', anthropicKey ? 'Found ✅' : 'Missing ❌');
```

### Test Status Check:
```typescript
// In renderer
const status = await window.electronAPI.invoke('check-agent-v5-status');
console.log('Agent V5 status:', status);
// Expected: { available: true, githubAuth: true, anthropicKey: true, message: "✅ Agent V5 ready to use" }
```

### Test Full Flow:
```typescript
// In renderer
const result = await window.electronAPI.invoke('process-visual-request-agent-v5', {
  instruction: "add a comment to the Button component",
  owner: "your-username",
  repo: "test-repo",
  branch: "main"
});

console.log('Result:', result);
// Expected: { success: true, prUrl: "https://github.com/...", filesModified: [...], ... }
```

---

## 🚨 Error Handling

The integration automatically handles common errors:

### Missing GitHub Token:
```json
{
  "success": false,
  "error": "GitHub authentication required. Please sign in via OAuth in the app."
}
```
**Solution:** User needs to authenticate via GitHub OAuth (your existing flow)

### Missing Anthropic Key:
```json
{
  "success": false,
  "error": "Anthropic API key required. Please configure in LLM Settings."
}
```
**Solution:** User needs to configure API key (your existing LLM settings)

### Task Failed:
```json
{
  "success": false,
  "error": "Task completed but no files were modified"
}
```
**Solution:** Check instruction clarity or repository structure

---

## 📊 Status Display

Show Agent V5 availability in your UI:

```typescript
// Check on mount
const status = await window.electronAPI.invoke('check-agent-v5-status');

// Display in UI
<div className="agent-status">
  {status.available ? (
    <span className="status-available">
      ✅ Agent V5 Available
    </span>
  ) : (
    <span className="status-unavailable">
      ⚠️ {status.message}
      <ul>
        <li>GitHub: {status.githubAuth ? '✅' : '❌ Not authenticated'}</li>
        <li>Anthropic: {status.anthropicKey ? '✅' : '❌ Key not configured'}</li>
      </ul>
    </span>
  )}
</div>
```

---

## 🎉 Ready to Use!

With these integration modules, Agent V5:
- ✅ Uses your existing GitHub OAuth token
- ✅ Uses your existing Anthropic API key
- ✅ Requires no new user authentication
- ✅ Integrates with 2 simple IPC handlers
- ✅ Works alongside Agent V4
- ✅ Ready for production use!

**Next step:** Add the IPC handlers to `main.ts` and you're done! 🚀

