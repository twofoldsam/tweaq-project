# Agent V5 - Demo Files

## 🎯 Quick Start

### 1. See Example Input/Output (No API calls - FREE)
```bash
node test-input-output.js
```
Shows what the agent input and output look like without making any API calls.

### 2. Run Full Demo (Makes API calls - ~$0.10)
```bash
# Set environment variables first
export ANTHROPIC_API_KEY="sk-ant-..."
export GITHUB_TOKEN="ghp_..."
export REPO_OWNER="your-username"
export REPO_NAME="your-repo"

# Run demo
node simple-demo.js
```
Runs the actual agent with Claude API and creates a real PR.

---

## 📁 Files in This Directory

### Demo Scripts
- **`simple-demo.js`** - Clean, simple demo showing input → execution → output
- **`test-input-output.js`** - Shows example I/O without API calls (FREE)
- **`demo.js`** - Original demo with validation integration

### Source Code
- **`src/ClaudeAgentV5.ts`** - Main agent implementation
- **`src/tools/ToolExecutor.ts`** - Tool implementations
- **`src/types/index.ts`** - TypeScript types
- **`src/ValidationBridge.ts`** - Integration with Agent V4 validation

### Documentation
- **`DEMO_README.md`** - This file
- **`README.md`** - Full API documentation
- **`package.json`** - Dependencies and scripts

---

## 📖 Full Documentation

Located in the project root:

| File | Description |
|------|-------------|
| `AGENT_V5_V0_DEMO_GUIDE.md` | ⭐ **Complete demo guide** |
| `AGENT_V5_DEMO_EXAMPLE.md` | Detailed input/output examples |
| `AGENT_V5_QUICK_REFERENCE.md` | One-page quick reference |
| `AGENT_V5_PROTOTYPE_COMPLETE.md` | Implementation details |
| `CLAUDE_AGENT_COMPARISON.md` | Comparison with Agent V4 |

---

## 🚀 What Each Demo Shows

### test-input-output.js (Start Here!)
```bash
node test-input-output.js
```

**Shows:**
- 5 example input formats
- Turn-by-turn execution flow
- Example output JSON
- PR structure
- No API calls (FREE)

**Use this to:** Understand what the agent does without spending money

---

### simple-demo.js (Real Demo)
```bash
node simple-demo.js
```

**Shows:**
- Real repository cloning
- Actual Claude API calls
- Autonomous tool usage
- Files being modified
- Real PR creation

**Use this to:** See the agent working on a real repository

---

### demo.js (Original)
```bash
node demo.js
```

**Shows:**
- Everything in simple-demo.js
- Plus: Integration with Agent V4 validation
- Plus: Validation metrics

**Use this to:** Test with validation enabled

---

## 💡 Example Task

All demos use this example task:

```typescript
"Find all button components and add a bounce animation on hover"
```

**What the agent does:**
1. Searches for all button components (3 found)
2. Reads each component to understand structure
3. Checks for associated CSS files
4. Reads existing styles
5. Adds bounce animation consistently to all 3
6. Creates PR with changes

---

## 📊 Expected Output

### Console Output
```
✅ Task Result:
   Success: true
   Files Modified: 3
   Tool Calls: 5
   Turns Used: 8

📁 Modified Files:
   - src/components/Button.module.css
   - src/components/IconButton.module.css
   - src/components/ActionButton.module.css

🔧 Tool Usage:
   - search_codebase: 1x
   - read_file: 2x
   - write_file: 3x
   - list_directory: 1x

📤 OUTPUT (Pull Request):
   PR Number: #42
   PR URL: https://github.com/your-org/your-repo/pull/42
```

### JSON Output
```json
{
  "success": true,
  "filesModified": ["Button.css", "IconButton.css", "ActionButton.css"],
  "metrics": {
    "turnsUsed": 8,
    "toolCallsTotal": 5,
    "filesModified": 3
  }
}
```

---

## 🔧 Environment Variables

Required for **simple-demo.js** and **demo.js**:

```bash
export ANTHROPIC_API_KEY="sk-ant-api03-..."  # From console.anthropic.com
export GITHUB_TOKEN="ghp_..."                 # From github.com/settings/tokens
export REPO_OWNER="your-username"             # GitHub username
export REPO_NAME="your-repo"                  # Repository name
export REPO_BRANCH="main"                     # Branch to work on (optional, default: main)
```

**Not required for test-input-output.js** (no API calls)

---

## 💰 Cost Estimate

| Demo | API Calls | Cost |
|------|-----------|------|
| `test-input-output.js` | ❌ None | FREE |
| `simple-demo.js` | ✅ Yes | ~$0.10 |
| `demo.js` | ✅ Yes | ~$0.10 |

---

## 🎯 Recommended Flow

1. **Start with test-input-output.js** (FREE)
   ```bash
   node test-input-output.js
   ```
   Understand what the agent does

2. **Read the documentation**
   ```bash
   cat ../../../AGENT_V5_QUICK_REFERENCE.md
   ```
   Get familiar with input/output format

3. **Set environment variables**
   ```bash
   export ANTHROPIC_API_KEY="..."
   export GITHUB_TOKEN="..."
   export REPO_OWNER="your-username"
   export REPO_NAME="test-repo"
   ```

4. **Run simple demo**
   ```bash
   node simple-demo.js
   ```
   See the agent work on a real repository

5. **Review the PR on GitHub**
   Check the changes, reasoning, and tool usage

---

## 🐛 Troubleshooting

### Error: "Missing ANTHROPIC_API_KEY"
```bash
# Check if set
echo $ANTHROPIC_API_KEY

# Set it
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Error: "Missing GITHUB_TOKEN"
```bash
# Check if set
echo $GITHUB_TOKEN

# Set it (get from https://github.com/settings/tokens)
export GITHUB_TOKEN="ghp_..."
```

### Error: "Repository not found"
```bash
# Check repository settings
echo $REPO_OWNER
echo $REPO_NAME
echo $REPO_BRANCH

# Make sure you have write access to the repository
```

### Want to see more detail?
The demos already have `verbose: true` enabled, showing all tool calls.

---

## 📚 Learn More

- **Quick Reference:** `../../../AGENT_V5_QUICK_REFERENCE.md`
- **Complete Guide:** `../../../AGENT_V5_V0_DEMO_GUIDE.md`
- **Detailed Examples:** `../../../AGENT_V5_DEMO_EXAMPLE.md`
- **API Docs:** `README.md`

---

## 🎬 Start Now

```bash
# See example I/O (FREE)
node test-input-output.js

# Then run real demo
node simple-demo.js
```

**That's it! You're ready to demo Agent V5!** 🚀
