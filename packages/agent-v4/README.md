# Agent V4 - Intelligent Coding Agent

Agent V4 is an intelligent coding agent with multi-modal reasoning and confidence-based decision making. It solves the over-deletion problem by using sophisticated analysis and validation to make precise, targeted changes.

## 🎯 Key Features

### 🧠 **Multi-Modal Intelligence**
- **Visual Change Analysis**: Understands visual intents and maps them to code changes
- **Code Intelligence**: Deep AST analysis and component understanding
- **Confidence Assessment**: Multi-factor confidence scoring for decision making
- **Reasoning Engine**: Orchestrates comprehensive analysis

### ⚡ **Adaptive Strategies**
- **High-Confidence Direct**: Fast execution for clear, simple changes
- **Medium-Confidence Guided**: Careful execution with constraints
- **Low-Confidence Conservative**: Minimal changes with strict validation
- **Human Review**: Proposal generation for uncertain changes

### 🔍 **Smart Validation**
- **Intent Alignment**: Ensures changes match visual intent
- **Preservation Validation**: Protects critical code sections
- **Scope Validation**: Prevents over-deletion and excessive changes
- **Syntax Validation**: Ensures code correctness

### 🎨 **Contextual Prompts**
- **Rich Repository Context**: Uses symbolic repository analysis
- **Component Understanding**: Leverages component analysis
- **Styling Context**: Understands design systems and patterns
- **Confidence-Based Instructions**: Adapts prompts to confidence level

## 🚀 Quick Start

```typescript
import { createAgentV4, defaultAgentV4Config } from '@tweaq/agent-v4';

// Create agent with LLM provider
const agent = createAgentV4({
  ...defaultAgentV4Config,
  llmProvider: yourLLMProvider
});

// Process visual edits
const result = await agent.processVisualEdits(visualEdits, symbolicRepo);

if (result.success) {
  console.log('Changes applied successfully!');
  console.log(result.summary);
} else {
  console.log('Issues found:', result.execution.validation.issues);
}
```

## 📊 How It Solves the Over-Deletion Problem

### **Problem**: Font size change deletes 217 lines of code

### **Solution**: Multi-layered protection

1. **Visual Analysis** identifies this as a simple styling change
2. **Confidence Engine** rates it as high-confidence (simple change)
3. **Impact Analysis** expects ~2 lines changed
4. **Smart Validation** catches 217 lines deleted ≠ font-size change
5. **Adaptive Strategy** retries with conservative approach

### **Result**: Precise, minimal changes that match the visual intent

## 🏗️ Architecture

```
AgentV4
├── ReasoningEngine (Orchestrates analysis)
│   ├── VisualChangeAnalyzer
│   ├── CodeIntelligenceEngine
│   └── ChangeConfidenceEngine
├── AdaptiveChangeEngine (Executes changes)
├── SmartValidationEngine (Validates results)
└── ContextualPromptBuilder (Builds prompts)
```

## 🎯 Confidence-Based Approaches

### High Confidence (≥80%)
- **Direct execution** with rich context
- **Standard validation**
- **Fast processing**

### Medium Confidence (60-80%)
- **Guided execution** with constraints
- **Strict validation**
- **Impact analysis integration**

### Low Confidence (40-60%)
- **Conservative execution**
- **Paranoid validation**
- **Minimal change scope**

### Very Low Confidence (<40%)
- **Human review proposal**
- **No automatic changes**
- **Detailed analysis provided**

## 🔍 Validation Levels

### **Scope Validation** (Prevents Over-Deletion)
```typescript
// Font-size change removing 217 lines = ERROR
if (isFontSizeChange(intent) && metrics.linesRemoved > 5) {
  issues.push({
    type: 'scope-exceeded',
    severity: 'error',
    message: 'Font size change should not remove 217 lines of code'
  });
}
```

### **Intent Alignment**
- Verifies changes match visual intent
- Checks for property-specific modifications
- Validates styling approach consistency

### **Preservation Rules**
- Protects imports/exports
- Maintains component interfaces
- Preserves functionality

## 📈 Usage Examples

### Simple Font Size Change
```typescript
const visualEdit = {
  element: { selector: '.button', tagName: 'button' },
  changes: [{ 
    property: 'font-size', 
    before: '14px', 
    after: '16px',
    category: 'styling'
  }]
};

// Agent V4 will:
// 1. Identify as high-confidence styling change
// 2. Use direct execution approach
// 3. Validate scope (expect ~1-2 lines changed)
// 4. Apply minimal, targeted change
```

### Complex Layout Change
```typescript
const visualEdit = {
  element: { selector: '.container', tagName: 'div' },
  changes: [
    { property: 'display', before: 'flex', after: 'grid' },
    { property: 'grid-template-columns', before: '', after: '1fr 1fr' }
  ]
};

// Agent V4 will:
// 1. Identify as medium-confidence layout change
// 2. Use guided execution with constraints
// 3. Apply strict validation
// 4. Consider responsive implications
```

## 🛠️ Configuration

```typescript
const config: AgentV4Config = {
  llmProvider: yourProvider,
  
  confidenceThresholds: {
    highConfidence: 0.8,
    mediumConfidence: 0.6,
    lowConfidence: 0.4
  },
  
  validation: {
    enableSyntaxCheck: true,
    enableIntentAlignment: true,
    enablePreservationCheck: true,
    enableScopeCheck: true, // Critical for preventing over-deletion
    enableBuildCheck: false,
    strictMode: false
  },
  
  strategies: {
    maxRetries: 3,
    fallbackEnabled: true,
    humanReviewThreshold: 0.3
  }
};
```

## 🧪 Testing

The agent includes comprehensive validation that would have caught the original over-deletion problem:

```typescript
// This would FAIL validation
const result = await agent.processVisualEdits([fontSizeEdit], symbolicRepo);

// result.execution.validation.issues would contain:
// - "Font size change should not remove 217 lines of code"
// - "Change ratio exceeded: 85% of file changed (threshold: 10%)"
// - "Excessive code deletion detected: 217 lines removed"
```

## 🔄 Integration with Existing Tweaq

Agent V4 is designed to integrate seamlessly with existing Tweaq infrastructure:

- Uses existing `RepoSymbolicModel` for context
- Compatible with existing `VisualEdit` types
- Integrates with current LLM providers
- Maintains existing PR creation workflow

## 📚 API Reference

### Main Methods

#### `processVisualEdits(visualEdits, symbolicRepo)`
Main processing method that analyzes and executes changes.

#### `dryRun(visualEdits, symbolicRepo)`
Analyzes changes without executing them.

#### `getCapabilities()`
Returns agent capabilities and features.

### Analysis Results

#### `ChangeIntent`
Analyzed intent with target component and scope.

#### `ChangeConfidenceAssessment`
Multi-factor confidence analysis with recommended approach.

#### `ValidationResult`
Comprehensive validation with issues, warnings, and metrics.

## 🎉 Benefits

1. **Prevents Over-Deletion**: Smart validation catches excessive changes
2. **Intelligent Decision Making**: Confidence-based approach selection
3. **Rich Context Awareness**: Uses full repository analysis
4. **Adaptive Execution**: Different strategies for different scenarios
5. **Comprehensive Validation**: Multiple layers of safety checks
6. **Human-Friendly**: Clear summaries and explanations

Agent V4 transforms Tweaq from a prototype into a production-ready intelligent coding agent that makes confident, accurate changes while preventing the over-deletion problems of previous versions.
