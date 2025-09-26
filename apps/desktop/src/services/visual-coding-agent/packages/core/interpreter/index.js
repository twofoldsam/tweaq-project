"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterpretationUtils = exports.ClaudeNaturalLanguageInterpreter = void 0;
const types_1 = require("@/core/types");
class ClaudeNaturalLanguageInterpreter {
    claudeProvider;
    constructor(claudeProvider) {
        this.claudeProvider = claudeProvider;
    }
    async interpretRequest(description, context) {
        try {
            // Preprocess the description to handle common variations
            const normalizedDescription = this.preprocessDescription(description);
            // Use Claude to analyze the intent
            const intent = await this.claudeProvider.analyzeIntent(normalizedDescription, context);
            // Validate and enhance the intent
            const validatedIntent = this.validateIntent(intent, context);
            return validatedIntent;
        }
        catch (error) {
            throw new types_1.InterpretationError(`Failed to interpret request: "${description}"`, {
                originalDescription: description,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    preprocessDescription(description) {
        // Handle common variations and slang
        const substitutions = {
            'bigger': 'larger',
            'smaller': 'smaller',
            'pop': 'stand out more',
            'busy': 'cluttered and overwhelming',
            'clean': 'simple and minimal',
            'professional': 'corporate and polished',
            'modern': 'contemporary and sleek',
            'cramped': 'too tight spacing',
            'spread out': 'more spacing',
            'brand blue': 'primary blue color',
            'brand color': 'primary brand color',
        };
        let normalized = description.toLowerCase().trim();
        // Apply substitutions
        for (const [key, value] of Object.entries(substitutions)) {
            normalized = normalized.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
        }
        return normalized;
    }
    validateIntent(intent, context) {
        // Ensure the intent makes sense for the given context
        const validatedMethods = this.validateMethods(intent.methods, intent.property, context);
        return {
            ...intent,
            methods: validatedMethods,
            // Add context-specific enhancements
            designPrinciple: intent.designPrinciple ?? this.inferDesignPrinciple(intent),
        };
    }
    validateMethods(methods, property, _context) {
        const validMethodsForProperty = {
            size: ['scale', 'padding', 'font-size', 'width', 'height'],
            color: ['background-color', 'text-color', 'border-color', 'accent-color'],
            spacing: ['margin', 'padding', 'gap', 'line-height'],
            typography: ['font-size', 'font-weight', 'line-height', 'font-family'],
            layout: ['flexbox', 'grid', 'positioning', 'alignment'],
            emphasis: ['size', 'color', 'weight', 'contrast', 'shadow'],
            complexity: ['elements', 'colors', 'spacing', 'hierarchy'],
            style: ['theme', 'variant', 'mood', 'aesthetic'],
        };
        const validMethods = validMethodsForProperty[property] || [];
        // Filter methods to only include valid ones for this property
        const filteredMethods = methods.filter(method => validMethods.some(valid => method.includes(valid) || valid.includes(method)));
        // If no valid methods remain, use defaults for the property
        if (filteredMethods.length === 0) {
            return validMethods.slice(0, 2); // Take first 2 default methods
        }
        return filteredMethods;
    }
    inferDesignPrinciple(intent) {
        const principleMap = {
            'size-increase': 'Visual Hierarchy - Making important elements more prominent',
            'size-decrease': 'Visual Hierarchy - Reducing prominence for better balance',
            'color-change': 'Brand Consistency - Using design system colors',
            'spacing-increase': 'White Space - Improving readability and breathing room',
            'spacing-decrease': 'Density - Making better use of space',
            'emphasis-increase': 'Attention - Drawing user focus to key elements',
            'complexity-decrease': 'Simplicity - Reducing cognitive load',
            'typography-change': 'Readability - Improving text legibility and hierarchy',
        };
        const key = `${intent.property}-${intent.direction}`;
        return principleMap[key] || 'Design System Consistency';
    }
}
exports.ClaudeNaturalLanguageInterpreter = ClaudeNaturalLanguageInterpreter;
// Utility functions for common interpretation patterns
class InterpretationUtils {
    static extractSizeModifiers(description) {
        // Extract specific size amounts like "20% bigger", "twice as large", "2x"
        const percentMatch = description.match(/(\d+)%\s*(bigger|larger|smaller)/);
        if (percentMatch?.[1]) {
            return {
                amount: parseInt(percentMatch[1]) / 100,
                relative: true
            };
        }
        const multiplierMatch = description.match(/(\d+(?:\.\d+)?)\s*(?:x|times)/);
        if (multiplierMatch?.[1]) {
            return {
                amount: parseFloat(multiplierMatch[1]),
                relative: true
            };
        }
        return {};
    }
    static extractColorReferences(description, designTokens) {
        const colors = [];
        // Look for brand color references
        if (description.includes('brand')) {
            if (designTokens.colors?.primary)
                colors.push('primary');
            if (designTokens.colors?.brand)
                colors.push('brand');
        }
        // Look for specific color names
        const colorNames = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'gray', 'black', 'white'];
        for (const colorName of colorNames) {
            if (description.includes(colorName)) {
                colors.push(colorName);
            }
        }
        return colors;
    }
    static detectUrgency(description) {
        const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'broken', 'fix'];
        const casualWords = ['maybe', 'perhaps', 'consider', 'might', 'could'];
        if (urgentWords.some(word => description.toLowerCase().includes(word))) {
            return 'high';
        }
        if (casualWords.some(word => description.toLowerCase().includes(word))) {
            return 'low';
        }
        return 'medium';
    }
}
exports.InterpretationUtils = InterpretationUtils;
//# sourceMappingURL=index.js.map