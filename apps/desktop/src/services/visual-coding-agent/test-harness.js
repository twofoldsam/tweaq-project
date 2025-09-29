#!/usr/bin/env tsx
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultContext = exports.testCases = void 0;
exports.runTests = runTests;
exports.runInteractiveTest = runInteractiveTest;
// Load environment variables from .env file
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const index_1 = require("./index");
const claude_1 = require("./packages/providers/claude");
// Test cases for the visual coding agent
const testCases = [
    {
        name: "Make button bigger",
        description: "make the button bigger",
        element: {
            tagName: 'button',
            classes: ['btn-sm', 'bg-blue-500', 'text-white'],
            textContent: 'Click me',
        },
    },
    {
        name: "Use brand blue",
        description: "use our brand blue",
        element: {
            tagName: 'div',
            style: { color: '#FF0000' },
            textContent: 'Important text',
        },
    },
    {
        name: "Text too small",
        description: "this text is too small to read",
        element: {
            tagName: 'p',
            classes: ['text-xs'],
            textContent: 'Small paragraph text',
        },
    },
    {
        name: "Make it pop",
        description: "make this element pop more",
        element: {
            tagName: 'div',
            classes: ['card', 'bg-white', 'p-4'],
            textContent: 'Card content',
        },
    },
    {
        name: "Too busy",
        description: "this section feels too busy and cluttered",
        element: {
            tagName: 'section',
            classes: ['grid', 'grid-cols-4', 'gap-2', 'p-2'],
            innerHTML: '<div>Item 1</div><div>Item 2</div><div>Item 3</div><div>Item 4</div>',
        },
    },
    {
        name: "More professional",
        description: "make this look more professional",
        element: {
            tagName: 'header',
            classes: ['bg-gradient-to-r', 'from-purple-500', 'to-pink-500', 'text-white', 'p-8'],
            textContent: 'Welcome to our site!',
        },
    }
];
exports.testCases = testCases;
// Default design context for testing
const createDefaultContext = (stylingSystem = 'tailwind') => ({
    designTokens: {
        colors: {
            primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
            secondary: { 50: '#f0f9ff', 500: '#0ea5e9', 900: '#0c4a6e' },
            success: { 50: '#f0fdf4', 500: '#22c55e', 900: '#14532d' },
            warning: { 50: '#fffbeb', 500: '#f59e0b', 900: '#78350f' },
            error: { 50: '#fef2f2', 500: '#ef4444', 900: '#7f1d1d' },
            gray: { 50: '#f9fafb', 100: '#f3f4f6', 500: '#6b7280', 900: '#111827' },
        },
        typography: {
            fontSizes: {
                xs: '0.75rem',
                sm: '0.875rem',
                base: '1rem',
                lg: '1.125rem',
                xl: '1.25rem',
                '2xl': '1.5rem',
                '3xl': '1.875rem',
            },
            fontWeights: {
                light: '300',
                normal: '400',
                medium: '500',
                semibold: '600',
                bold: '700',
            },
            lineHeights: {
                tight: '1.25',
                normal: '1.5',
                relaxed: '1.625',
            },
            fontFamilies: {
                sans: 'Inter, system-ui, sans-serif',
                mono: 'Fira Code, monospace',
            },
        },
        spacing: {
            1: '0.25rem',
            2: '0.5rem',
            3: '0.75rem',
            4: '1rem',
            6: '1.5rem',
            8: '2rem',
            12: '3rem',
            16: '4rem',
        },
        shadows: {
            sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        },
        borderRadius: {
            sm: '0.125rem',
            md: '0.375rem',
            lg: '0.5rem',
            xl: '0.75rem',
        },
        breakpoints: {
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
        },
    },
    framework: 'react',
    stylingSystem,
    fileStructure: ['components/', 'styles/', 'utils/'],
    componentPatterns: {
        namingConventions: ['PascalCase'],
        importPatterns: ['import React from "react"'],
        propPatterns: {},
        stylePatterns: ['className'],
    },
    existingCode: `
import React from 'react';

export const Button: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <button className={\`btn-sm bg-blue-500 text-white \${className}\`}>
      {children}
    </button>
  );
};
  `.trim(),
    filePath: 'components/Button.tsx',
});
exports.createDefaultContext = createDefaultContext;
// Test runner
async function runTests() {
    console.log('🚀 Starting Visual Coding Agent Demo\n');
    // Check for API key
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
        console.error('❌ ANTHROPIC_API_KEY environment variable is required');
        console.log('Please set your Anthropic API key:');
        console.log('export ANTHROPIC_API_KEY="your-api-key-here"');
        process.exit(1);
    }
    const claudeProvider = new claude_1.AnthropicClaudeProvider();
    const agent = (0, index_1.createVisualCodingAgent)(claudeProvider, {});
    let passedTests = 0;
    let totalTests = testCases.length;
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        if (!testCase)
            continue;
        console.log(`\n📝 Demo ${i + 1}/${totalTests}: ${testCase.name}`);
        console.log(`Request: "${testCase.description}"`);
        console.log(`Target: <${testCase.element.tagName}> ${testCase.element.classes ? `(${testCase.element.classes.join(', ')})` : ''}`);
        try {
            const request = {
                description: testCase.description,
                element: testCase.element,
                context: createDefaultContext(),
                framework: 'react',
            };
            const startTime = Date.now();
            const response = await agent.processRequest(request);
            const duration = Date.now() - startTime;
            console.log(`✅ Processing complete (${duration}ms)`);
            console.log(`🎯 Confidence: ${Math.round(response.confidence * 100)}%`);
            console.log(`📄 Files modified: ${response.changes.length}`);
            if (response.changes.length > 0) {
                console.log('\n📄 Generated Changes:');
                response.changes.forEach((change, idx) => {
                    console.log(`  ${idx + 1}. ${change.filePath} (${change.changeType})`);
                    console.log(`     Reasoning: ${change.reasoning}`);
                });
            }
            console.log('\n💬 Explanation:');
            console.log(`"${response.explanation}"`);
            if (response.alternatives && response.alternatives.length > 0) {
                console.log(`\n🔄 Alternatives: ${response.alternatives.length} options provided`);
            }
            if (response.designPrinciples && response.designPrinciples.length > 0) {
                console.log('\n🎨 Design Principles:');
                response.designPrinciples.forEach(principle => {
                    console.log(`  • ${principle}`);
                });
            }
            // Basic validation
            if (response.changes.length > 0 && response.explanation && response.confidence > 0) {
                passedTests++;
                console.log('✅ Demo successful');
            }
            else {
                console.log('❌ Demo incomplete - insufficient response');
            }
        }
        catch (error) {
            console.log(`❌ Demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Add separator between tests
        console.log('─'.repeat(80));
    }
    console.log(`\n🎯 Demo Results: ${passedTests}/${totalTests} scenarios completed successfully`);
    if (passedTests === totalTests) {
        console.log('🎉 All demo scenarios completed successfully! The agent is performing optimally.');
    }
    else {
        console.log(`⚠️  ${totalTests - passedTests} scenarios had issues. Review the output above for details.`);
    }
}
// Interactive test mode
async function runInteractiveTest() {
    console.log('🎮 Interactive Test Mode');
    console.log('Enter your visual change requests (type "exit" to quit)\n');
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
        console.error('❌ ANTHROPIC_API_KEY environment variable is required');
        return;
    }
    const claudeProvider = new claude_1.AnthropicClaudeProvider();
    const agent = (0, index_1.createVisualCodingAgent)(claudeProvider, {});
    // Simple REPL simulation
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const askQuestion = (question) => {
        return new Promise(resolve => {
            rl.question(question, resolve);
        });
    };
    while (true) {
        try {
            const description = await askQuestion('👉 Describe your visual change: ');
            if (description.toLowerCase() === 'exit') {
                break;
            }
            if (!description.trim()) {
                continue;
            }
            // Create a generic test element
            const element = {
                tagName: 'div',
                classes: ['p-4', 'bg-white', 'border'],
                textContent: 'Sample element',
            };
            const request = {
                description,
                element,
                context: createDefaultContext(),
                framework: 'react',
            };
            console.log('\n⏳ Processing...');
            const response = await agent.processRequest(request);
            console.log(`\n✅ Response (${Math.round(response.confidence * 100)}% confidence):`);
            console.log(response.explanation);
            if (response.changes.length > 0) {
                console.log('\n📝 Code Changes:');
                response.changes.forEach(change => {
                    console.log(`  • ${change.reasoning}`);
                });
            }
            console.log('\n' + '─'.repeat(50));
        }
        catch (error) {
            console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    rl.close();
}
// Main execution
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--interactive') || args.includes('-i')) {
        await runInteractiveTest();
    }
    else {
        await runTests();
    }
}
// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=test-harness.js.map