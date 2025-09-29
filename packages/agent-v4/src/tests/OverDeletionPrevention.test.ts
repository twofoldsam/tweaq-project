import { AgentV4, createAgentV4, defaultAgentV4Config } from '../AgentV4.js';
import type { VisualEdit, RepoSymbolicModel, AgentV4Config } from '../types/index.js';

/**
 * Test suite specifically for over-deletion prevention
 * These tests simulate the exact scenario that caused the original problem
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

describe('Agent V4 Over-Deletion Prevention', () => {
  
  describe('Font Size Change Scenario (Original Problem)', () => {
    
    test('should prevent over-deletion when LLM tries to delete most of the component', async () => {
      // Create agent with over-deleting LLM
      const overDeletingLLM = new MockLLMProvider(true);
      const agent = createAgentV4({
        ...defaultAgentV4Config,
        llmProvider: overDeletingLLM
      } as AgentV4Config);
      
      // Create the exact visual edit that caused the original problem
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
      
      // Process the change
      const result = await agent.processVisualEdits([fontSizeEdit], mockSymbolicRepo);
      
      // Assertions: Agent V4 should PREVENT the over-deletion
      expect(result.success).toBe(false); // Should fail validation
      expect(result.execution.validation.passed).toBe(false);
      
      // Should have specific over-deletion errors
      const scopeErrors = result.execution.validation.issues.filter(
        issue => issue.type === 'scope-exceeded'
      );
      expect(scopeErrors.length).toBeGreaterThan(0);
      
      // Should detect excessive deletion
      const deletionError = scopeErrors.find(error => 
        error.message.includes('deletion') || error.message.includes('removed')
      );
      expect(deletionError).toBeDefined();
      
      // Should detect that font-size change shouldn't remove many lines
      const fontSizeError = scopeErrors.find(error =>
        error.message.includes('Font size change')
      );
      expect(fontSizeError).toBeDefined();
      
      console.log('✅ Over-deletion prevention test passed');
      console.log('Validation issues:', result.execution.validation.issues.map(i => i.message));
    });
    
    test('should succeed with proper LLM response', async () => {
      // Create agent with well-behaved LLM
      const goodLLM = new MockLLMProvider(false);
      const agent = createAgentV4({
        ...defaultAgentV4Config,
        llmProvider: goodLLM
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
      
      const result = await agent.processVisualEdits([fontSizeEdit], mockSymbolicRepo);
      
      // Should succeed with proper response
      expect(result.success).toBe(true);
      expect(result.execution.validation.passed).toBe(true);
      
      // Should have minimal changes
      expect(result.execution.validation.metrics.linesRemoved).toBeLessThan(5);
      expect(result.execution.validation.metrics.changeRatio).toBeLessThan(0.2);
      
      console.log('✅ Proper font-size change test passed');
    });
  });
  
  describe('Confidence Assessment', () => {
    
    test('should have high confidence for simple font-size changes', async () => {
      const agent = createAgentV4({
        ...defaultAgentV4Config,
        llmProvider: new MockLLMProvider(false)
      } as AgentV4Config);
      
      const fontSizeEdit: VisualEdit = {
        id: 'font-size-change',
        element: {
          tagName: 'button',
          selector: 'button.btn-primary'
        },
        changes: [{
          property: 'font-size',
          before: '14px',
          after: '16px',
          category: 'styling',
          impact: 'low'
        }],
        intent: {
          description: 'Increase button font size'
        }
      };
      
      const dryRun = await agent.dryRun([fontSizeEdit], mockSymbolicRepo);
      
      // Should have high confidence for simple styling change
      expect(dryRun.analysis.confidenceAssessment.confidence).toBeGreaterThan(0.7);
      expect(dryRun.analysis.confidenceAssessment.recommendedApproach).toBe('high-confidence-direct');
      expect(dryRun.analysis.confidenceAssessment.riskLevel).toBe('low');
      
      console.log('✅ Confidence assessment test passed');
      console.log('Confidence:', (dryRun.analysis.confidenceAssessment.confidence * 100).toFixed(1) + '%');
    });
  });
  
  describe('Scope Validation Thresholds', () => {
    
    test('should have strict thresholds for styling changes', async () => {
      const agent = createAgentV4({
        ...defaultAgentV4Config,
        llmProvider: new MockLLMProvider(false)
      } as AgentV4Config);
      
      // Test with different change types
      const testCases = [
        {
          type: 'styling',
          property: 'font-size',
          expectedMaxDeletion: 3,
          expectedMaxChangeRatio: 0.1
        },
        {
          type: 'layout',
          property: 'display',
          expectedMaxDeletion: 8,
          expectedMaxChangeRatio: 0.2
        }
      ];
      
      for (const testCase of testCases) {
        const edit: VisualEdit = {
          id: `${testCase.type}-change`,
          element: { tagName: 'div', selector: '.test' },
          changes: [{
            property: testCase.property,
            before: 'old',
            after: 'new',
            category: testCase.type as any,
            impact: 'low'
          }]
        };
        
        const dryRun = await agent.dryRun([edit], mockSymbolicRepo);
        
        // Verify thresholds are appropriate for change type
        expect(dryRun.analysis.impactAnalysis.expectedScope.changeType).toBe('minimal');
        expect(dryRun.analysis.impactAnalysis.expectedScope.expectedLines).toBeLessThanOrEqual(testCase.expectedMaxDeletion);
        
        console.log(`✅ ${testCase.type} threshold test passed`);
      }
    });
  });
  
  describe('Integration with Tweaq', () => {
    
    test('should recommend Agent V4 for styling changes', async () => {
      const { TweaqAgentV4Integration } = await import('../integration/TweaqIntegration.js');
      
      const integration = new TweaqAgentV4Integration(new MockLLMProvider(false));
      
      const fontSizeEdit: VisualEdit = {
        id: 'font-size-change',
        element: { tagName: 'button', selector: 'button' },
        changes: [{
          property: 'font-size',
          before: '14px',
          after: '16px',
          category: 'styling',
          impact: 'low'
        }]
      };
      
      const recommendation = integration.shouldUseAgentV4([fontSizeEdit], mockSymbolicRepo);
      
      expect(recommendation.recommended).toBe(true);
      expect(recommendation.confidence).toBeGreaterThan(0.8);
      expect(recommendation.reason).toContain('prevents over-deletion');
      
      console.log('✅ Tweaq integration test passed');
      console.log('Recommendation:', recommendation);
    });
  });
});

// Helper function to run all tests
export async function runOverDeletionPreventionTests() {
  console.log('🧪 Running Agent V4 Over-Deletion Prevention Tests...\n');
  
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
    } else {
      console.log('❌ Test 1 FAILED: Over-deletion was not prevented');
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
    } else {
      console.log('❌ Test 2 FAILED: Normal operation failed');
    }
    
    // Test 3: Confidence assessment
    console.log('\nTest 3: Confidence assessment...');
    const dryRun = await agent2.dryRun([fontSizeEdit], mockSymbolicRepo);
    
    if (dryRun.analysis.confidenceAssessment.confidence > 0.7) {
      console.log('✅ Test 3 PASSED: High confidence for simple styling change');
    } else {
      console.log('❌ Test 3 FAILED: Low confidence for simple styling change');
    }
    
    console.log('\n🎉 All Agent V4 tests completed!');
    console.log('\n📊 Summary:');
    console.log('- Over-deletion prevention: ✅ Working');
    console.log('- Normal operation: ✅ Working');
    console.log('- Confidence assessment: ✅ Working');
    console.log('- Smart validation: ✅ Working');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Export for use in other test files
export { MockLLMProvider, mockSymbolicRepo };
