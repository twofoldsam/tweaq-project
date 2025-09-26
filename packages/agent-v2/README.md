# Agent V2 - Autonomous Code Generation Agent

A clean, production-ready autonomous coding agent that creates real pull requests from visual design changes, exactly like a human engineer would.

## 🏗️ Architecture

Agent V2 follows a **"Human Engineer" pattern** with these key phases:

1. **🏗️ Workspace Setup** - Clone repository locally
2. **🧠 Code Intelligence** - Understand project structure  
3. **🎯 Strategic Decisions** - Plan changes intelligently
4. **🔧 Code Generation** - Make actual file modifications
5. **🔍 Validation** - Test syntax, build, linting, tests
6. **🚀 PR Creation** - Create proper Git commits and PRs

## ✨ Key Features

### ✅ **Real File Operations**
- Local Git workspace with actual files
- No dependency on remote API file operations
- Handles any project structure

### ✅ **Intelligent Decision Making** 
- Framework detection (React, Vue, Svelte, Angular)
- Styling system analysis (CSS, Tailwind, Styled Components)
- Implementation strategy (inline vs external styles)
- PR organization strategy

### ✅ **Code Intelligence**
- AST-based code understanding
- Component discovery and mapping
- Dependency analysis
- Style impact assessment

### ✅ **Production Validation**
- Syntax validation
- Build verification
- Test execution
- Linting checks
- Quality scoring

### ✅ **Professional Git Workflow**
- Proper branch creation
- Semantic commit messages
- Comprehensive PR descriptions
- Risk assessment and metadata

## 🚀 Quick Start

### Installation

```bash
# Install the package
pnpm add @tweaq/agent-v2

# Install peer dependencies
pnpm add simple-git @babel/parser @babel/traverse prettier
```

### Basic Usage

```typescript
import { createAgentV2 } from '@tweaq/agent-v2';

const agent = createAgentV2({
  workspace: {
    owner: 'your-username',
    repo: 'your-repo',
    githubToken: 'your-github-token',
    baseBranch: 'main'
  },
  llmProvider: {
    generateText: async (prompt) => {
      // Your LLM integration (OpenAI, Claude, etc.)
      return await callYourLLM(prompt);
    }
  },
  validation: {
    runTests: true,
    runLinting: true,
    buildCheck: true
  },
  confidenceThreshold: 0.8
});

// Process visual edits
const result = await agent.processVisualEdits([
  {
    id: 'edit-1',
    timestamp: Date.now(),
    element: {
      selector: 'button.primary',
      tagName: 'button',
      className: 'bg-blue-500 text-white px-4 py-2'
    },
    changes: [
      {
        property: 'background-color',
        before: 'blue',
        after: 'green',
        category: 'color',
        impact: 'visual',
        confidence: 0.9
      }
    ],
    intent: {
      description: 'Change primary button color to green',
      userAction: 'direct-edit'
    }
  }
]);

if (result.success) {
  console.log('✅ PR created:', result.prResult?.prUrl);
} else {
  console.error('❌ Failed:', result.error);
}
```

### With OpenAI

```typescript
import { createAgentV2WithOpenAI } from '@tweaq/agent-v2';

const agent = createAgentV2WithOpenAI({
  workspace: {
    owner: 'your-username',
    repo: 'your-repo', 
    githubToken: 'your-github-token'
  },
  openaiApiKey: 'your-openai-key',
  model: 'gpt-4',
  confidenceThreshold: 0.8
});
```

### Dry Run Analysis

```typescript
// Analyze what would be changed without making actual changes
const analysis = await agent.dryRun(visualEdits);

console.log('Project Structure:', analysis.projectStructure);
console.log('Planned Changes:', analysis.changeAnalysis);
console.log('Style Impact:', analysis.styleImpactAnalysis);
console.log('PR Strategy:', analysis.prStrategy);
```

## 🎯 Strategic Decision Making

The agent makes intelligent decisions about:

### **Framework Detection**
- Automatically detects React, Vue, Svelte, Angular
- Adapts code generation accordingly
- Follows framework-specific best practices

### **Styling Strategy**
- **Inline**: Direct style modifications in components
- **CSS Files**: External stylesheet modifications  
- **CSS Modules**: Scoped styling approach
- **Styled Components**: CSS-in-JS approach

### **PR Organization**
- **Single PR**: For related changes
- **Component-based**: Separate PR per component
- **Feature-based**: Group by functionality

### **Risk Assessment**
- Analyzes impact on other components
- Assesses complexity and risk level
- Provides recommendations and warnings

## 🔧 Configuration

```typescript
interface AgentV2Config {
  workspace: {
    owner: string;           // GitHub username/org
    repo: string;            // Repository name
    githubToken: string;     // GitHub access token
    baseBranch?: string;     // Default: 'main'
    workingDirectory?: string; // Optional: custom workspace path
  };
  
  llmProvider: {
    generateText(prompt: string): Promise<string>;
  };
  
  validation: {
    runTests: boolean;       // Run test suite
    runLinting: boolean;     // Run linter
    buildCheck: boolean;     // Verify build
  };
  
  prSettings: {
    autoMerge: boolean;      // Auto-merge if validation passes
    reviewRequired: boolean;  // Require manual review
    branchNaming: string;    // Branch naming template
  };
  
  maxIterations: number;     // Max decision-making iterations
  confidenceThreshold: number; // Min confidence to create PR (0-1)
}
```

## 🏛️ Architecture Details

### **Workspace Management**
```typescript
// Local Git operations
const workspace = await workspaceManager.createWorkspace(config);
await workspace.createWorkingBranch('feature-description');
await workspace.writeFile('src/Component.tsx', newCode);
await workspace.commitChanges('feat: update component styling', ['src/Component.tsx']);
await workspace.pushChanges();
```

### **Code Intelligence**
```typescript
// Project structure analysis
const structure = await codeIntelligence.analyzeProject();
// {
//   framework: 'react',
//   stylingSystem: 'tailwind', 
//   components: [...],
//   styleFiles: [...]
// }

// Component mapping
const component = await codeIntelligence.findComponentForElement(domElement, structure);
```

### **Strategic Decisions**
```typescript
// Change intent analysis
const changeAnalysis = await strategicDecisions.evaluateChangeIntent(visualEdits, structure);

// Style impact analysis  
const styleImpact = await strategicDecisions.analyzeStyleImpact(changeIntents, structure);

// PR strategy
const prStrategy = await strategicDecisions.determinePRStrategy(changeIntents, styleImpact);
```

### **Code Generation**
```typescript
// AST-based modifications
const newCode = await codeGenerator.modifyReactComponent(filePath, currentCode, modifications);

// LLM-assisted generation for complex changes
const enhancedCode = await codeGenerator.generateWithLLM(filePath, currentCode, modifications);
```

### **Validation Pipeline**
```typescript
const validation = await validator.validateChanges(fileChanges, projectStructure);
// {
//   syntaxValid: true,
//   buildsSuccessfully: true, 
//   testsPass: true,
//   lintingPasses: true,
//   score: 0.95,
//   issues: []
// }
```

## 🔍 Comparison with Agent V1

| Feature | Agent V1 | Agent V2 |
|---------|----------|----------|
| **File Operations** | ❌ GitHub API only | ✅ Local Git workspace |
| **Component Discovery** | ❌ Inferred paths | ✅ AST-based analysis |
| **Code Generation** | ❌ String templates | ✅ AST manipulation + LLM |
| **Validation** | ❌ None | ✅ Syntax, build, tests, linting |
| **Git Workflow** | ❌ API commits | ✅ Proper branches, commits, PRs |
| **Strategic Decisions** | ✅ Basic | ✅ Enhanced with context |
| **Error Handling** | ❌ Brittle | ✅ Robust with fallbacks |

## 🤝 Contributing

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build the package: `pnpm build`
4. Run tests: `pnpm test`

## 📄 License

MIT License - see LICENSE file for details.

---

**Agent V2** - Creating real pull requests, exactly like a human engineer would. 🚀
