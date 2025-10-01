#!/usr/bin/env node

/**
 * Test script for Combined Editing Workflow (Visual + Natural Language)
 * 
 * This demonstrates the end-to-end flow of:
 * 1. Making visual tweaks (button color, font size, padding)
 * 2. Giving natural language instructions ("Make copy more friendly", "Condense footer")
 * 3. Submitting everything together
 * 4. Agent processing and creating a PR
 */

import { AgentV4 } from './packages/agent-v4/dist/AgentV4.js';

console.log('🧪 Testing Combined Editing Workflow');
console.log('=====================================\n');

// Mock LLM Provider for testing
const mockLLMProvider = {
  async generateText(prompt) {
    console.log('📝 LLM called with prompt length:', prompt.length);
    
    // Return mock modified code
    return `
import React from 'react';

export function Button() {
  return (
    <button 
      style={{
        backgroundColor: '#3B82F6',  // Changed from #1F2937
        padding: '16px',              // Changed from 12px
        borderRadius: '8px',          // Changed from 4px
        fontSize: '16px',             // Changed from 14px
        color: 'white',
        border: 'none'
      }}
    >
      Get Started Now!  // More action-oriented
    </button>
  );
}
    `.trim();
  }
};

// Mock Symbolic Repository
const mockSymbolicRepo = {
  repoId: 'test-repo',
  analyzedAt: new Date(),
  version: '1.0.0',
  primaryFramework: 'react',
  frameworkVersions: { 'react': '18.0.0' },
  stylingApproach: 'css',
  cssVariables: new Map(),
  customClasses: new Map(),
  components: [
    {
      name: 'Button',
      filePath: 'src/components/Button.tsx',
      framework: 'react',
      complexity: 'simple',
      styling: {
        approach: 'css',
        inlineStyles: true
      },
      content: `
import React from 'react';

export function Button() {
  return (
    <button 
      style={{
        backgroundColor: '#1F2937',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '14px',
        color: 'white',
        border: 'none'
      }}
    >
      Submit
    </button>
  );
}
      `.trim()
    },
    {
      name: 'Footer',
      filePath: 'src/components/Footer.tsx',
      framework: 'react',
      complexity: 'moderate',
      styling: {
        approach: 'css',
        inlineStyles: false
      },
      content: `
import React from 'react';

export function Footer() {
  return (
    <footer style={{ padding: '40px', marginTop: '60px' }}>
      <div>Footer content here</div>
    </footer>
  );
}
      `.trim()
    }
  ],
  componentPatterns: {
    filePattern: /\.tsx$/,
    importPatterns: ['import'],
    exportPatterns: ['export'],
    namingConvention: 'PascalCase'
  },
  stylingPatterns: {
    fontSize: { property: 'fontSize', values: {}, confidence: 0.8 },
    color: { property: 'color', values: {}, confidence: 0.8 },
    spacing: { property: 'padding', values: {}, confidence: 0.8 },
    layout: { property: 'display', values: {}, confidence: 0.8 }
  },
  domMappings: new Map([
    ['.btn-primary', [{
      filePath: 'src/components/Button.tsx',
      componentName: 'Button',
      confidence: 0.95,
      elementType: 'button',
      selector: '.btn-primary'
    }]],
    ['footer', [{
      filePath: 'src/components/Footer.tsx',
      componentName: 'Footer',
      confidence: 0.95,
      elementType: 'footer',
      selector: 'footer'
    }]]
  ]),
  transformationRules: [],
  fileHashes: new Map(),
  lastModified: new Date(),
  analysis: {
    totalFiles: 2,
    componentCount: 2,
    complexityScore: 0.3,
    lastAnalyzed: new Date(),
    confidence: 0.85
  }
};

// Build Combined Edit Request
const combinedEditRequest = {
  // Visual edits from direct manipulation
  visualEdits: [
    {
      id: 'edit_1',
      element: {
        selector: '.btn-primary',
        tagName: 'button',
        className: 'btn btn-primary'
      },
      changes: [
        {
          property: 'background-color',
          before: '#1F2937',
          after: '#3B82F6',
          category: 'styling',
          impact: 'low'
        },
        {
          property: 'padding',
          before: '12px',
          after: '16px',
          category: 'styling',
          impact: 'low'
        },
        {
          property: 'border-radius',
          before: '4px',
          after: '8px',
          category: 'styling',
          impact: 'low'
        }
      ],
      intent: {
        description: 'Update button styling'
      }
    },
    {
      id: 'edit_2',
      element: {
        selector: '.btn-primary',
        tagName: 'button'
      },
      changes: [
        {
          property: 'font-size',
          before: '14px',
          after: '16px',
          category: 'styling',
          impact: 'low'
        }
      ]
    }
  ],
  
  // Natural language instructions from chat
  naturalLanguageEdits: [
    {
      id: 'nl_1',
      type: 'natural-language',
      instruction: 'Make the button text more action-oriented and exciting',
      targetElement: {
        selector: '.btn-primary',
        tagName: 'button'
      },
      context: {
        scope: 'element',
        userIntent: 'improve call-to-action'
      },
      timestamp: Date.now()
    },
    {
      id: 'nl_2',
      type: 'natural-language',
      instruction: 'Condense the footer to be more compact',
      targetElement: {
        selector: 'footer',
        tagName: 'footer'
      },
      context: {
        scope: 'component',
        userIntent: 'reduce spacing'
      },
      timestamp: Date.now()
    }
  ],
  
  metadata: {
    sessionId: `session_${Date.now()}`,
    submittedAt: Date.now(),
    context: 'Homepage polish - button styling and footer cleanup'
  }
};

// Create Agent V4 instance
const agent = new AgentV4({
  llmProvider: mockLLMProvider,
  confidenceThresholds: {
    highConfidence: 0.8,
    mediumConfidence: 0.6,
    lowConfidence: 0.4
  },
  validation: {
    enableSyntaxCheck: true,
    enableIntentAlignment: true,
    enablePreservationCheck: true,
    enableScopeCheck: true,
    enableBuildCheck: false,
    strictMode: false
  },
  strategies: {
    maxRetries: 3,
    fallbackEnabled: true,
    humanReviewThreshold: 0.3
  },
  performance: {
    maxContextTokens: 8000,
    parallelValidation: true,
    cacheEnabled: true
  }
});

// Run the test
async function runTest() {
  try {
    console.log('📊 COMBINED EDIT REQUEST');
    console.log('========================');
    console.log(`Visual Edits: ${combinedEditRequest.visualEdits.length}`);
    combinedEditRequest.visualEdits.forEach((edit, i) => {
      console.log(`  ${i + 1}. ${edit.element.selector}: ${edit.changes.length} changes`);
    });
    console.log();
    console.log(`Natural Language Instructions: ${combinedEditRequest.naturalLanguageEdits.length}`);
    combinedEditRequest.naturalLanguageEdits.forEach((edit, i) => {
      console.log(`  ${i + 1}. "${edit.instruction}"`);
    });
    console.log();
    
    console.log('🚀 PROCESSING WITH AGENT V4');
    console.log('============================\n');
    
    const result = await agent.processCombinedEdits(combinedEditRequest, mockSymbolicRepo);
    
    console.log('\n📋 RESULT');
    console.log('=========\n');
    console.log('Success:', result.success ? '✅ YES' : '❌ NO');
    console.log('Files Changed:', result.fileChanges.length);
    console.log('Analyses:', result.analyses.length);
    
    if (result.success) {
      console.log('\n📝 FILE CHANGES');
      console.log('===============');
      result.fileChanges.forEach((change, i) => {
        console.log(`\n${i + 1}. ${change.filePath}`);
        console.log(`   Action: ${change.action}`);
        console.log(`   New length: ${change.newContent.length} characters`);
        console.log(`   Reasoning: ${change.reasoning}`);
      });
      
      console.log('\n📊 SUMMARY');
      console.log('==========');
      console.log(result.summary);
      
      console.log('\n✅ TEST PASSED - Combined editing workflow working!');
    } else {
      console.log('\n❌ TEST FAILED');
      console.log('Error:', result.error);
      
      if (result.execution?.validation?.issues) {
        console.log('\nValidation Issues:');
        result.execution.validation.issues.forEach(issue => {
          console.log(`  - ${issue.type}: ${issue.message}`);
        });
      }
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    process.exit(1);
  }
}

runTest();

