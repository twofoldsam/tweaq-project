"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExplanationFormatter = exports.ClaudeUserExplainer = void 0;
class ClaudeUserExplainer {
    claudeProvider;
    constructor(claudeProvider) {
        this.claudeProvider = claudeProvider;
    }
    async explainChanges(changes, intent, context) {
        try {
            // Use Claude to generate user-friendly explanation
            const explanation = await this.claudeProvider.explainChanges(changes, intent, context);
            // Enhance with additional context
            const enhancedExplanation = this.enhanceExplanation(explanation, changes, intent, context);
            return enhancedExplanation;
        }
        catch (error) {
            // Fallback to template-based explanation
            return this.generateTemplateExplanation(changes, intent, context);
        }
    }
    async explainAlternatives(alternatives, intent, context) {
        if (alternatives.length === 0) {
            return "I've provided the best approach for your request.";
        }
        const explanations = [];
        for (let i = 0; i < alternatives.length; i++) {
            const alt = alternatives[i];
            if (!alt)
                continue;
            const explanation = await this.explainSingleAlternative(alt, i + 1, intent, context);
            explanations.push(explanation);
        }
        return this.combineAlternativeExplanations(explanations);
    }
    async explainDesignPrinciples(intent) {
        const principles = [];
        // Add principle based on the intent
        switch (intent.property) {
            case 'size':
                if (intent.direction === 'increase') {
                    principles.push('Visual Hierarchy: Larger elements naturally draw more attention');
                    principles.push('Accessibility: Bigger text and buttons are easier to interact with');
                }
                else {
                    principles.push('Visual Balance: Smaller elements create better proportional relationships');
                    principles.push('Content Density: Reducing size allows more content in the same space');
                }
                break;
            case 'color':
                principles.push('Brand Consistency: Using your design system colors maintains visual coherence');
                principles.push('User Experience: Consistent colors help users understand your interface patterns');
                if (intent.methods.includes('contrast')) {
                    principles.push('Accessibility: Proper color contrast ensures readability for all users');
                }
                break;
            case 'spacing':
                if (intent.direction === 'increase') {
                    principles.push('White Space: More spacing improves readability and reduces cognitive load');
                    principles.push('Visual Breathing Room: Proper spacing makes interfaces feel less cramped');
                }
                else {
                    principles.push('Content Density: Tighter spacing allows more information in limited space');
                    principles.push('Visual Grouping: Reduced spacing can show relationships between elements');
                }
                break;
            case 'emphasis':
                principles.push('Information Architecture: Emphasis guides users to the most important content');
                principles.push('Visual Hierarchy: Different levels of emphasis create clear content structure');
                break;
            case 'complexity':
                if (intent.direction === 'decrease') {
                    principles.push('Simplicity: Reducing visual complexity improves user comprehension');
                    principles.push('Focus: Fewer elements help users concentrate on what matters most');
                }
                break;
            case 'typography':
                principles.push('Readability: Typography choices directly impact how easily users consume content');
                principles.push('Brand Voice: Font choices communicate personality and professionalism');
                break;
            default:
                principles.push('Design System Consistency: Following established patterns creates predictable user experiences');
        }
        // Add urgency-based principles
        if (intent.urgency === 'high') {
            principles.push('User Impact: This change addresses a critical user experience issue');
        }
        return principles;
    }
    enhanceExplanation(baseExplanation, changes, intent, context) {
        let enhanced = baseExplanation;
        // Add technical context if helpful
        if (changes.length > 1) {
            enhanced += `\n\nThis change involves updating ${changes.length} files to maintain consistency across your codebase.`;
        }
        // Add design system context
        const designSystemInfo = this.getDesignSystemInfo(context);
        if (designSystemInfo) {
            enhanced += `\n\n${designSystemInfo}`;
        }
        // Add confidence indicator
        const confidence = this.estimateConfidence(changes, intent, context);
        if (confidence < 0.8) {
            enhanced += `\n\n💡 Since your request was somewhat open to interpretation, I chose the approach that best follows your design system patterns. Feel free to ask for adjustments!`;
        }
        return enhanced;
    }
    generateTemplateExplanation(_changes, intent, _context) {
        const templates = {
            'size-increase': (method) => `I made the element larger by ${method === 'font-size' ? 'increasing the text size' : 'adding more padding'}. This creates better visual hierarchy and makes it easier for users to notice and interact with.`,
            'size-decrease': (method) => `I reduced the element size by ${method === 'font-size' ? 'decreasing the text size' : 'reducing padding'}. This creates better proportional balance and allows more content to fit comfortably.`,
            'color-change': () => `I updated the color to use your design system's color palette. This maintains brand consistency and ensures the color works well with your overall theme.`,
            'spacing-increase': () => `I added more spacing around the element. This improves readability by giving the content more breathing room and makes the interface feel less cramped.`,
            'spacing-decrease': () => `I reduced the spacing to create a more compact layout. This allows more content to be visible and creates tighter visual relationships between related elements.`,
            'emphasis-increase': () => `I enhanced the visual emphasis by making the element more prominent. This helps draw user attention to this important part of your interface.`,
            'complexity-decrease': () => `I simplified the visual design by reducing unnecessary elements or styling. This makes the interface cleaner and easier for users to understand.`,
        };
        const key = `${intent.property}-${intent.direction}`;
        const template = templates[key];
        if (template) {
            const primaryMethod = intent.methods[0] || 'styling';
            return template(primaryMethod);
        }
        // Fallback generic explanation
        return `I've updated the element to better match your design intent. The changes use your design system tokens to maintain consistency with the rest of your interface.`;
    }
    async explainSingleAlternative(alternative, number, intent, context) {
        const approach = alternative.description;
        const tradeoffs = alternative.tradeoffs;
        const confidence = Math.round(alternative.confidence * 100);
        return `**Option ${number}: ${approach}** (${confidence}% confidence)
${await this.explainChanges(alternative.changes, intent, context)}

*Trade-offs: ${tradeoffs}*`;
    }
    combineAlternativeExplanations(explanations) {
        return `I've prepared ${explanations.length} different approaches for your request:\n\n${explanations.join('\n\n---\n\n')}

Choose the option that best fits your needs, or let me know if you'd like me to adjust any of these approaches!`;
    }
    getDesignSystemInfo(context) {
        const { stylingSystem, designTokens } = context;
        switch (stylingSystem) {
            case 'tailwind':
                const colorCount = Object.keys(designTokens['colors'] || {}).length;
                return `I used your Tailwind design system, which includes ${colorCount} color tokens and consistent spacing values.`;
            case 'mui':
                return `I used Material-UI's theme system to ensure the changes follow Material Design principles.`;
            case 'chakra':
                return `I used Chakra UI's design tokens to maintain consistency with your component library.`;
            case 'styled-components':
                return `I used your styled-components theme to ensure consistent styling across your application.`;
            default:
                return null;
        }
    }
    estimateConfidence(changes, intent, context) {
        let confidence = 0.8;
        // Higher confidence for specific intents
        if (intent.specificity && intent.specificity > 0.7) {
            confidence += 0.1;
        }
        // Higher confidence for single file changes
        if (changes.length === 1) {
            confidence += 0.05;
        }
        // Higher confidence when using design tokens
        const usesTokens = changes.some(change => this.changeUsesDesignTokens(change, context));
        if (usesTokens) {
            confidence += 0.05;
        }
        return Math.min(confidence, 1.0);
    }
    changeUsesDesignTokens(change, context) {
        const { newContent } = change;
        const { stylingSystem } = context;
        switch (stylingSystem) {
            case 'tailwind':
                // Check for Tailwind utility classes
                return /className="[^"]*(?:bg-|text-|p-|m-|space-)[a-z-]+/.test(newContent);
            case 'mui':
                // Check for theme usage
                return newContent.includes('theme.') || newContent.includes('palette.');
            case 'styled-components':
                // Check for theme props
                return newContent.includes('props.theme') || newContent.includes('${props');
            default:
                return true;
        }
    }
}
exports.ClaudeUserExplainer = ClaudeUserExplainer;
// Utility class for explanation formatting
class ExplanationFormatter {
    static formatTechnicalChange(change) {
        const changeType = change.changeType === 'modify' ? 'Updated' :
            change.changeType === 'create' ? 'Created' : 'Removed';
        return `${changeType} ${change.filePath}`;
    }
    static formatDesignPrinciples(principles) {
        if (principles.length === 0)
            return '';
        return `\n\n**Design Principles Applied:**\n${principles.map(p => `• ${p}`).join('\n')}`;
    }
    static formatConfidenceLevel(confidence) {
        if (confidence >= 0.9)
            return 'Very confident';
        if (confidence >= 0.8)
            return 'Confident';
        if (confidence >= 0.7)
            return 'Moderately confident';
        return 'Less confident - may need refinement';
    }
    static addPersonalTouch(explanation) {
        const personalTouches = [
            "I hope this helps achieve the look you're going for!",
            "Let me know if you'd like me to adjust anything!",
            "This should give your interface the improvement you're looking for.",
            "Feel free to ask if you want to explore other approaches!",
        ];
        const randomTouch = personalTouches[Math.floor(Math.random() * personalTouches.length)];
        return `${explanation}\n\n${randomTouch}`;
    }
}
exports.ExplanationFormatter = ExplanationFormatter;
//# sourceMappingURL=index.js.map