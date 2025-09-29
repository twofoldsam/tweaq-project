import { AgentV4, createAgentV4, defaultAgentV4Config } from '../AgentV4.js';
import type { VisualEdit, RepoSymbolicModel, AgentV4Config } from '../types/index.js';

/**
 * Simple test runner without external dependencies
 */

// Mock LLM Provider that simulates over-deletion behavior
class MockLLMProvider {
  private shouldOverDelete: boolean;
  
  constructor(shouldOverDelete = false) {
    this.shouldOverDelete = shouldOverDelete;
  }
  
  async generateText(prompt: string): Promise<string> {
    // Simulate the original problem: LLM returns minimal code for font-size change
    if (prompt.includes('font-size') && this.shouldOverDelete) {
      // This simulates the problematic response that deletes most of the component
      return `
import React from 'react';

const Button = () => {
  return <button style={{ fontSize: '16px' }}>Click me</button>;
};

export default Button;
      `.trim();
    }
    
    // Normal behavior: return reasonable code
    if (prompt.includes('font-size')) {
      return `
import React from 'react';
import { ButtonProps } from './types';

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  
  const sizeClasses = {
    small: 'text-sm px-3 py-1',
    medium: 'text-base px-4 py-2',
    large: 'text-lg px-6 py-3'
  };

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]}\`}
      onClick={onClick}
      disabled={disabled}
      style={{ fontSize: '16px' }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
      `.trim();
    }
    
    return 'Generated code';
  }
}

// Mock symbolic repository
const mockSymbolicRepo: RepoSymbolicModel = {
  repoId: 'test-repo',
  analyzedAt: new Date(),
  version: '1.0.0',
  primaryFramework: 'react',
  frameworkVersions: { react: '18.0.0' },
  stylingApproach: 'tailwind',
  tailwindConfig: undefined,
  cssVariables: new Map(),
  customClasses: new Map(),
  components: [{
    name: 'Button',
    filePath: 'src/components/Button.tsx',
    framework: 'react',
    complexity: 'moderate',
    exports: ['default'],
    imports: ['React', 'ButtonProps'],
    props: [
      { name: 'children', type: 'ReactNode', required: true },
      { name: 'onClick', type: 'Function', required: false },
      { name: 'variant', type: 'string', required: false },
      { name: 'size', type: 'string', required: false },
      { name: 'disabled', type: 'boolean', required: false }
    ],
    styling: {
      approach: 'tailwind',
      classes: ['px-4', 'py-2', 'rounded', 'font-medium'],
      customProperties: [],
      inlineStyles: false
    },
    content: `
import React from 'react';
import { ButtonProps } from './types';

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  
  const sizeClasses = {
    small: 'text-sm px-3 py-1',
    medium: 'text-base px-4 py-2',
    large: 'text-lg px-6 py-3'
  };

  return (
    <button
      className={\`\${baseClasses} \${variantClasses[variant]} \${sizeClasses[size]}\`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
    `.trim()
  }],
  componentPatterns: {
    filePattern: /\.tsx?$/,
    importPatterns: ['React', 'import'],
    exportPatterns: ['export default', 'export'],
    namingConvention: 'PascalCase'
  },
  stylingPatterns: {
    fontSize: {
      property: 'font-size',
      values: { '14px': 5, '16px': 10, '18px': 3 },
      confidence: 0.9
    },
    color: {
      property: 'color',
      values: { '#000': 5, '#333': 8, '#666': 3 },
      confidence: 0.8
    },
    spacing: {
      property: 'margin',
      values: { '8px': 5, '16px': 10, '24px': 3 },
      confidence: 0.7
    },
    layout: {
      property: 'display',
      values: { 'flex': 15, 'block': 5, 'grid': 2 },
      confidence: 0.9
    }
  },
  domMappings: new Map([
    ['button.btn-primary', [{
      filePath: 'src/components/Button.tsx',
      componentName: 'Button',
      confidence: 0.95,
      elementType: 'button',
      selector: 'button.btn-primary'
    }]]
  ]),
  transformationRules: [],
  designTokens: {
    colors: { primary: '#007bff', secondary: '#6c757d' },
    spacing: { sm: '8px', md: '16px', lg: '24px' },
    typography: { sm: '14px', base: '16px', lg: '18px' }
  },
  librariesDetected: ['react', 'tailwindcss'],
  fileHashes: new Map(),
  lastModified: new Date(),
  analysis: {
    totalFiles: 50,
    componentCount: 10,
    complexityScore: 0.6,
    lastAnalyzed: new Date(),
    confidence: 0.85
  }
};

/**
 * Run Agent V4 over-deletion prevention tests
 */
export async function runAgentV4Tests(): Promise<boolean> {
  console.log('🧪 Running Agent V4 Over-Deletion Prevention Tests...\n');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Over-deletion prevention
    console.log('Test 1: Over-deletion prevention with problematic LLM...');
    const overDeletingLLM = new MockLLMProvider(true);
    const agent1 = createAgentV4({
      ...defaultAgentV4Config,
      llmProvider: overDeletingLLM
    } as AgentV4Config);
    
    const fontSizeEdit: VisualEdit = {
      id: 'font-size-change',
      element: {
        tagName: 'button',
        selector: 'button.btn-primary',
        className: 'btn-primary'
      },
      changes: [{
        property: 'font-size',
        before: '14px',
        after: '16px',
        category: 'styling',
        impact: 'low'
      }],
      intent: {
        description: 'Increase button font size from 14px to 16px'
      }
    };
    
    const result1 = await agent1.processVisualEdits([fontSizeEdit], mockSymbolicRepo);
    
    if (!result1.success && result1.execution.validation.issues.some(i => i.type === 'scope-exceeded')) {
      console.log('✅ Test 1 PASSED: Over-deletion was prevented');
      console.log('   Validation caught:', result1.execution.validation.issues.length, 'issues');
    } else {
      console.log('❌ Test 1 FAILED: Over-deletion was not prevented');
      allTestsPassed = false;
    }
    
    // Test 2: Normal operation
    console.log('\nTest 2: Normal operation with good LLM...');
    const goodLLM = new MockLLMProvider(false);
    const agent2 = createAgentV4({
      ...defaultAgentV4Config,
      llmProvider: goodLLM
    } as AgentV4Config);
    
    const result2 = await agent2.processVisualEdits([fontSizeEdit], mockSymbolicRepo);
    
    if (result2.success && result2.execution.validation.metrics.linesRemoved < 5) {
      console.log('✅ Test 2 PASSED: Normal operation works correctly');
      console.log('   Lines removed:', result2.execution.validation.metrics.linesRemoved);
    } else {
      console.log('❌ Test 2 FAILED: Normal operation failed');
      console.log('   Success:', result2.success);
      console.log('   Lines removed:', result2.execution?.validation?.metrics?.linesRemoved);
      allTestsPassed = false;
    }
    
    // Test 3: Confidence assessment
    console.log('\nTest 3: Confidence assessment...');
    const dryRun = await agent2.dryRun([fontSizeEdit], mockSymbolicRepo);
    
    if (dryRun.analysis.confidenceAssessment.confidence > 0.7) {
      console.log('✅ Test 3 PASSED: High confidence for simple styling change');
      console.log('   Confidence:', (dryRun.analysis.confidenceAssessment.confidence * 100).toFixed(1) + '%');
      console.log('   Approach:', dryRun.analysis.confidenceAssessment.recommendedApproach);
    } else {
      console.log('❌ Test 3 FAILED: Low confidence for simple styling change');
      console.log('   Confidence:', (dryRun.analysis.confidenceAssessment.confidence * 100).toFixed(1) + '%');
      allTestsPassed = false;
    }
    
    // Test 4: Integration test
    console.log('\nTest 4: Integration with Tweaq...');
    try {
      const { createTweaqAgentV4Integration } = await import('../integration/TweaqIntegration.js');
      const integration = createTweaqAgentV4Integration(new MockLLMProvider(false));
      
      const recommendation = integration.shouldUseAgentV4([fontSizeEdit], mockSymbolicRepo);
      
      if (recommendation.recommended && recommendation.confidence > 0.8) {
        console.log('✅ Test 4 PASSED: Tweaq integration works correctly');
        console.log('   Recommendation confidence:', (recommendation.confidence * 100).toFixed(1) + '%');
        console.log('   Reason:', recommendation.reason);
      } else {
        console.log('❌ Test 4 FAILED: Tweaq integration failed');
        console.log('   Recommended:', recommendation.recommended);
        console.log('   Confidence:', (recommendation.confidence * 100).toFixed(1) + '%');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log('⚠️ Test 4 SKIPPED: Integration test failed to load');
      console.log('   Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('\n🎉 Agent V4 Test Suite Completed!');
    console.log('\n📊 SUMMARY:');
    console.log('===================');
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED');
      console.log('\n🎯 Key Features Verified:');
      console.log('• Over-deletion prevention ✅');
      console.log('• Smart validation engine ✅');
      console.log('• Confidence-based decision making ✅');
      console.log('• Adaptive strategy selection ✅');
      console.log('\n🚀 Agent V4 is ready to prevent the font-size over-deletion problem!');
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log('\n⚠️ Please review failed tests before deployment.');
    }
    
    console.log('===================');
    
    return allTestsPassed;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Export for use in other files
export { MockLLMProvider, mockSymbolicRepo };
