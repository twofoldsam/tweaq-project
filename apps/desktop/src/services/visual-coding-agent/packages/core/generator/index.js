"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeGenerator = void 0;
const types_1 = require("@/core/types");
class ClaudeCodeGenerator {
    claudeProvider;
    constructor(claudeProvider) {
        this.claudeProvider = claudeProvider;
    }
    async generateChanges(intent, context) {
        try {
            // Use Claude to generate the code changes
            const changes = await this.claudeProvider.generateCode(intent, context);
            // Post-process and validate the changes
            const processedChanges = await this.postProcessChanges(changes, intent, context);
            // Validate the changes
            const isValid = await this.validateChanges(processedChanges);
            if (!isValid) {
                throw new Error('Generated changes failed validation');
            }
            return processedChanges;
        }
        catch (error) {
            throw new types_1.CodeGenerationError(`Failed to generate code changes`, {
                intent,
                context: { framework: context.framework, stylingSystem: context.stylingSystem },
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async generateAlternatives(intent, context) {
        try {
            const alternativeChanges = await this.claudeProvider.generateAlternatives(intent, context) || [];
            const alternatives = [];
            for (let i = 0; i < alternativeChanges.length; i++) {
                const rawChanges = alternativeChanges[i];
                if (!rawChanges)
                    continue;
                const changes = await this.postProcessChanges(rawChanges, intent, context);
                if (changes) {
                    alternatives.push({
                        description: this.generateAlternativeDescription(changes, intent, i),
                        changes,
                        tradeoffs: this.analyzeTradeoffs(changes, intent, context),
                        confidence: this.calculateConfidence(changes, intent, context),
                    });
                }
            }
            return alternatives;
        }
        catch (error) {
            throw new types_1.CodeGenerationError(`Failed to generate alternative changes`, {
                intent,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    async validateChanges(changes) {
        try {
            for (const change of changes) {
                // Basic validation checks
                if (!change.filePath || !change.newContent) {
                    return false;
                }
                // Syntax validation would go here
                // For now, we'll do basic checks
                if (change.filePath.endsWith('.tsx') || change.filePath.endsWith('.jsx')) {
                    if (!this.validateReactSyntax(change.newContent)) {
                        return false;
                    }
                }
                if (change.filePath.endsWith('.vue')) {
                    if (!this.validateVueSyntax(change.newContent)) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch {
            return false;
        }
    }
    async postProcessChanges(changes, intent, context) {
        const processedChanges = [];
        for (const change of changes) {
            let processedChange = { ...change };
            // Apply framework-specific post-processing
            switch (context.framework) {
                case 'react':
                    processedChange = await this.postProcessReactChange(processedChange, intent, context);
                    break;
                case 'vue':
                    processedChange = await this.postProcessVueChange(processedChange, intent, context);
                    break;
                case 'svelte':
                    processedChange = await this.postProcessSvelteChange(processedChange, intent, context);
                    break;
            }
            // Apply styling system specific post-processing
            switch (context.stylingSystem) {
                case 'tailwind':
                    processedChange = await this.postProcessTailwindChange(processedChange, intent, context);
                    break;
                case 'mui':
                    processedChange = await this.postProcessMuiChange(processedChange, intent, context);
                    break;
                case 'styled-components':
                    processedChange = await this.postProcessStyledComponentsChange(processedChange, intent, context);
                    break;
            }
            processedChanges.push(processedChange);
        }
        return processedChanges;
    }
    async postProcessReactChange(change, _intent, _context) {
        let { newContent } = change;
        // Ensure proper React patterns
        if (!newContent.includes('import React') && newContent.includes('React.')) {
            newContent = `import React from 'react';\n${newContent}`;
        }
        // Add TypeScript types if missing and file is .tsx
        if (change.filePath.endsWith('.tsx') && !newContent.includes(': React.FC')) {
            newContent = this.addReactTypes(newContent);
        }
        return {
            ...change,
            newContent,
        };
    }
    async postProcessVueChange(change, _intent, _context) {
        // Vue-specific post-processing
        return change;
    }
    async postProcessSvelteChange(change, _intent, _context) {
        // Svelte-specific post-processing
        return change;
    }
    async postProcessTailwindChange(change, _intent, context) {
        let { newContent } = change;
        // Ensure we're using design tokens from the context
        newContent = this.replaceTailwindArbitraryValues(newContent, context);
        // Optimize class combinations
        newContent = this.optimizeTailwindClasses(newContent);
        return {
            ...change,
            newContent,
        };
    }
    async postProcessMuiChange(change, _intent, context) {
        let { newContent } = change;
        // Ensure MUI theme usage
        if (newContent.includes('color:') && !newContent.includes('theme.palette')) {
            newContent = this.replaceMuiArbitraryColors(newContent, context);
        }
        return {
            ...change,
            newContent,
        };
    }
    async postProcessStyledComponentsChange(change, _intent, context) {
        let { newContent } = change;
        // Ensure theme usage in styled-components
        if (!newContent.includes('${props => props.theme') && newContent.includes('color:')) {
            newContent = this.replaceStyledComponentsArbitraryValues(newContent, context);
        }
        return {
            ...change,
            newContent,
        };
    }
    replaceTailwindArbitraryValues(content, context) {
        // Replace arbitrary values with design tokens
        let processed = content;
        // Replace arbitrary colors like bg-[#ff0000] with design tokens
        processed = processed.replace(/bg-\[#([a-fA-F0-9]{6})\]/g, (match, hex) => {
            const tokenColor = this.findClosestColorToken(hex, context.designTokens);
            return tokenColor ? `bg-${tokenColor}` : match;
        });
        // Replace arbitrary sizes
        processed = processed.replace(/text-\[(\d+(?:\.\d+)?)(px|rem|em)\]/g, (_match, size, unit) => {
            const tokenSize = this.findClosestSizeToken(size + unit, context.designTokens);
            return tokenSize ? `text-${tokenSize}` : _match;
        });
        return processed;
    }
    replaceMuiArbitraryColors(content, context) {
        // Replace hardcoded colors with theme.palette references
        return content.replace(/color:\s*['"]#([a-fA-F0-9]{6})['"]/, (match, hex) => {
            const tokenColor = this.findClosestColorToken(hex, context.designTokens);
            return tokenColor ? `color: theme.palette.${tokenColor}.main` : match;
        });
    }
    replaceStyledComponentsArbitraryValues(content, context) {
        // Replace hardcoded values with theme references
        return content.replace(/color:\s*['"]#([a-fA-F0-9]{6})['"]/, (match, hex) => {
            const tokenColor = this.findClosestColorToken(hex, context.designTokens);
            return tokenColor ? `color: \${props => props.theme.colors.${tokenColor}}` : match;
        });
    }
    findClosestColorToken(hex, designTokens) {
        // Simple color matching - in practice, you'd want more sophisticated color distance calculation
        const colors = designTokens.colors || {};
        for (const [name, value] of Object.entries(colors)) {
            if (typeof value === 'string' && value.replace('#', '').toLowerCase() === hex.toLowerCase()) {
                return name;
            }
            if (typeof value === 'object') {
                for (const [shade, shadeValue] of Object.entries(value)) {
                    if (shadeValue.replace('#', '').toLowerCase() === hex.toLowerCase()) {
                        return `${name}-${shade}`;
                    }
                }
            }
        }
        return null;
    }
    findClosestSizeToken(size, designTokens) {
        const fontSizes = designTokens.typography?.fontSizes || {};
        for (const [name, value] of Object.entries(fontSizes)) {
            if (value === size) {
                return name;
            }
        }
        return null;
    }
    optimizeTailwindClasses(content) {
        // Remove duplicate classes and optimize combinations
        return content.replace(/className="([^"]+)"/g, (_match, classes) => {
            const classArray = classes.split(/\s+/);
            const uniqueClasses = [...new Set(classArray)];
            return `className="${uniqueClasses.join(' ')}"`;
        });
    }
    addReactTypes(content) {
        // Add basic React TypeScript types
        if (content.includes('function ') && !content.includes(': React.FC')) {
            return content.replace(/function\s+(\w+)\s*\(([^)]*)\)/, 'const $1: React.FC<{ $2 }> = ($2) =>');
        }
        return content;
    }
    validateReactSyntax(content) {
        // Basic React syntax validation
        try {
            // Check for balanced JSX tags
            const openTags = (content.match(/<[a-zA-Z][^>]*[^/]>/g) || []).length;
            const closeTags = (content.match(/<\/[a-zA-Z][^>]*>/g) || []).length;
            const selfClosingTags = (content.match(/<[a-zA-Z][^>]*\/>/g) || []).length;
            return openTags === closeTags + selfClosingTags;
        }
        catch {
            return false;
        }
    }
    validateVueSyntax(content) {
        // Basic Vue syntax validation
        return content.includes('<template>') && content.includes('</template>');
    }
    generateAlternativeDescription(_changes, _intent, index) {
        const approaches = [
            'Conservative approach',
            'Bold approach',
            'Minimalist approach',
            'Comprehensive approach',
        ];
        return approaches[index] || `Alternative ${index + 1}`;
    }
    analyzeTradeoffs(changes, _intent, _context) {
        // Analyze the tradeoffs of the changes
        const tradeoffs = [];
        if (changes.length > 1) {
            tradeoffs.push('Multiple file changes required');
        }
        if (changes.some(c => c.changeType === 'create')) {
            tradeoffs.push('Creates new files');
        }
        const hasLargeChanges = changes.some(c => c.newContent.length - c.oldContent.length > 100);
        if (hasLargeChanges) {
            tradeoffs.push('Significant code changes');
        }
        return tradeoffs.join(', ') || 'Minimal impact';
    }
    calculateConfidence(changes, intent, context) {
        let confidence = 0.8; // Base confidence
        // Adjust based on intent specificity
        if (intent.specificity !== undefined && intent.specificity !== null) {
            confidence *= intent.specificity;
        }
        // Adjust based on design token usage
        const usesDesignTokens = changes.every(change => this.usesDesignTokens(change.newContent, context));
        if (usesDesignTokens) {
            confidence += 0.1;
        }
        // Adjust based on change complexity
        if (changes.length === 1 && changes[0]?.changeType === 'modify') {
            confidence += 0.05;
        }
        return Math.min(confidence, 1.0);
    }
    usesDesignTokens(content, context) {
        switch (context.stylingSystem) {
            case 'tailwind':
                // Check if using Tailwind classes instead of arbitrary values
                return !content.includes('[') || content.includes('bg-') || content.includes('text-');
            case 'mui':
                // Check if using theme references
                return content.includes('theme.') || content.includes('palette.');
            case 'styled-components':
                // Check if using theme props
                return content.includes('props.theme');
            default:
                return true; // Assume it's fine for other systems
        }
    }
}
exports.ClaudeCodeGenerator = ClaudeCodeGenerator;
//# sourceMappingURL=index.js.map