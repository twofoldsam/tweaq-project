import type {
  ConversationState,
  ConversationMessage,
  ConversationAnalysis,
  ExtractedInfo,
  ExtractedTarget,
  ExtractedAction,
  ReadyTicket
} from './types.js';

/**
 * Conversational Intelligence System
 * Handles natural language conversation to gather sufficient detail before execution
 */
export class ConversationalIntelligence {
  private llmProvider: any;

  constructor(llmProvider: any) {
    this.llmProvider = llmProvider;
  }

  /**
   * Create a new conversation
   */
  startConversation(initialMessage: string): ConversationState {
    return {
      id: `conv_${Date.now()}`,
      messages: [
        {
          role: 'user',
          content: initialMessage,
          timestamp: Date.now()
        }
      ],
      extractedInfo: {},
      completenessScore: 0,
      missingInfo: [],
      status: 'gathering',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  /**
   * Analyze a user message in the context of the conversation
   */
  async analyzeMessage(
    userMessage: string,
    state: ConversationState
  ): Promise<ConversationAnalysis> {
    // Add user message to state
    state.messages.push({
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    });

    // Extract information from the message using LLM
    const newInfo = await this.extractInformation(userMessage, state);

    // Merge with existing extracted info
    this.mergeExtractedInfo(state, newInfo);

    // Calculate completeness
    const completeness = this.calculateCompleteness(state.extractedInfo);
    state.completenessScore = completeness;

    // Determine what's missing
    const missingInfo = this.determineMissingInfo(state.extractedInfo);
    state.missingInfo = missingInfo;

    // Determine next action
    let nextAction: 'clarify' | 'confirm' | 'ready';
    if (completeness >= 0.8) {
      nextAction = 'confirm';
      state.status = 'confirming';
    } else if (completeness >= 0.4) {
      nextAction = 'clarify';
      state.status = 'gathering';
    } else {
      nextAction = 'clarify';
      state.status = 'gathering';
    }

    // Generate natural response
    const response = await this.generateResponse(state, nextAction, missingInfo);
    const suggestions = nextAction === 'clarify' ? this.generateSuggestions(state) : undefined;

    state.updatedAt = Date.now();

    return {
      extractedInfo: newInfo,
      completeness,
      missingInfo,
      nextAction,
      response,
      suggestions
    };
  }

  /**
   * Extract information from user message using LLM
   */
  private async extractInformation(
    message: string,
    state: ConversationState
  ): Promise<Partial<ExtractedInfo>> {
    const conversationContext = state.messages
      .slice(-4) // Last 4 messages for context
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = `You are analyzing a conversation about making changes to a website. Be STRICT with confidence scores.

CONVERSATION SO FAR:
${conversationContext}

CURRENT EXTRACTED INFO:
${JSON.stringify(state.extractedInfo, null, 2)}

USER'S LATEST MESSAGE:
"${message}"

TASK:
Extract any NEW information about:
1. TARGET (what part of the page): Specific component, section, or element
2. ACTION (what to change): Concrete, actionable changes
3. SPECIFICS: Detailed, specific modifications

CONFIDENCE SCORING (be STRICT):
- 0.9-1.0: Explicit, specific, unambiguous (e.g., "the hero section", "increase padding to 20px")
- 0.6-0.8: Clear but could be more specific (e.g., "buttons", "larger text")
- 0.3-0.5: Vague or ambiguous (e.g., "it", "make it better", "friendlier")
- 0.0-0.2: Not mentioned or extremely vague

EXAMPLES:
- "Make it friendlier" → NO target (omit), action confidence: 0.3 (too vague)
- "The hero section" → target confidence: 0.9 (specific)
- "Make buttons blue" → target confidence: 0.8, action confidence: 0.9 (both specific)
- "All of it" → target type: "page-wide", confidence: 0.4 (vague scope)

Return ONLY a JSON object with the NEW information extracted from this message:
{
  "target": {
    "type": "component" | "section" | "element-type" | "page-wide",
    "identifiers": ["hero"],  // ONLY if explicitly mentioned
    "confidence": 0.0-1.0  // BE STRICT
  },
  "action": {
    "type": "content" | "styling" | "layout" | "structure" | "mixed",
    "specifics": ["specific details"],  // ONLY concrete specifics
    "confidence": 0.0-1.0  // BE STRICT
  }
}

CRITICAL: If target or action is vague/missing, OMIT it or use LOW confidence (0.2-0.4).
Return ONLY valid JSON, no other text.`;

    try {
      const response = await this.llmProvider.generateText(prompt);
      const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to extract information:', error);
      return {};
    }
  }

  /**
   * Merge new extracted info with existing info
   */
  private mergeExtractedInfo(state: ConversationState, newInfo: Partial<ExtractedInfo>): void {
    // Merge target
    if (newInfo.target) {
      if (!state.extractedInfo.target) {
        state.extractedInfo.target = newInfo.target;
      } else {
        // Merge identifiers (avoid duplicates)
        const existing = state.extractedInfo.target.identifiers || [];
        const newIds = newInfo.target.identifiers || [];
        state.extractedInfo.target.identifiers = [...new Set([...existing, ...newIds])];
        state.extractedInfo.target.confidence = Math.max(
          state.extractedInfo.target.confidence,
          newInfo.target.confidence || 0
        );
      }
    }

    // Merge action
    if (newInfo.action) {
      if (!state.extractedInfo.action) {
        state.extractedInfo.action = newInfo.action;
      } else {
        // Merge specifics (avoid duplicates)
        const existing = state.extractedInfo.action.specifics || [];
        const newSpecs = newInfo.action.specifics || [];
        state.extractedInfo.action.specifics = [...new Set([...existing, ...newSpecs])];
        state.extractedInfo.action.confidence = Math.max(
          state.extractedInfo.action.confidence,
          newInfo.action.confidence || 0
        );
        // Update type if mixed
        if (state.extractedInfo.action.specifics.length > 1) {
          state.extractedInfo.action.type = 'mixed';
        }
      }
    }

    // Merge context
    if (newInfo.context) {
      state.extractedInfo.context = {
        ...state.extractedInfo.context,
        ...newInfo.context
      };
    }
  }

  /**
   * Calculate how complete the extracted information is
   */
  private calculateCompleteness(info: ExtractedInfo): number {
    let score = 0;
    let weights = 0;

    // Target (40% weight)
    if (info.target) {
      score += info.target.confidence * 0.4;
      weights += 0.4;
    }

    // Action (40% weight)
    if (info.action) {
      // Higher score if we have specifics
      const specificScore = info.action.specifics && info.action.specifics.length > 0 ? 1.0 : 0.5;
      score += info.action.confidence * specificScore * 0.4;
      weights += 0.4;
    }

    // Context (20% weight) - optional but helpful
    if (info.context && (info.context.desiredOutcome || info.context.currentState)) {
      score += 0.2;
      weights += 0.2;
    }

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Determine what information is still missing
   */
  private determineMissingInfo(info: ExtractedInfo): string[] {
    const missing: string[] = [];

    if (!info.target || info.target.confidence < 0.6) {
      missing.push('target');
    }

    if (!info.action || info.action.confidence < 0.6) {
      missing.push('action-type');
    }

    if (info.action && (!info.action.specifics || info.action.specifics.length === 0)) {
      missing.push('action-specifics');
    }

    return missing;
  }

  /**
   * Generate a natural response based on conversation state
   */
  private async generateResponse(
    state: ConversationState,
    nextAction: 'clarify' | 'confirm' | 'ready',
    missingInfo: string[]
  ): Promise<string> {
    if (nextAction === 'confirm') {
      // Generate confirmation message
      return this.generateConfirmation(state);
    } else {
      // Generate suggestive clarifying question (async)
      return await this.generateClarifyingQuestion(state, missingInfo);
    }
  }

  /**
   * Generate a confirmation message showing what will be changed
   */
  private generateConfirmation(state: ConversationState): string {
    const { target, action } = state.extractedInfo;

    if (!target || !action) {
      return "I think I understand, but let me confirm...";
    }

    const targets = target.identifiers.join(' and ');
    const specifics = action.specifics.join(' and ');

    return `Perfect! I'll make the following changes:

${target.identifiers.map(t => `• **${t}**: ${specifics}`).join('\n')}

Ready to create ${target.identifiers.length > 1 ? 'these tickets' : 'this ticket'}?`;
  }

  /**
   * Generate a helpful, suggestive clarifying question (like Claude in Cursor)
   */
  private async generateClarifyingQuestion(
    state: ConversationState,
    missingInfo: string[]
  ): Promise<string> {
    const { target, action } = state.extractedInfo;
    const conversationContext = state.messages
      .slice(-4)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    // Build prompt for suggestive, helpful response
    const prompt = `You are a helpful AI assistant guiding a user to specify changes to a website. Be SPECIFIC and SUGGESTIVE in your questions, like Claude in Cursor.

CONVERSATION SO FAR:
${conversationContext}

WHAT WE KNOW:
${target ? `- Target: ${target.identifiers.join(', ')} (confidence: ${(target.confidence * 100).toFixed(0)}%)` : '- Target: Not specified'}
${action ? `- Action: ${action.type}, specifics: ${action.specifics.join(', ')} (confidence: ${(action.confidence * 100).toFixed(0)}%)` : '- Action: Not specified'}

WHAT'S MISSING: ${missingInfo.join(', ')}

YOUR TASK:
Generate a helpful response that:
1. Acknowledges what they've told you
2. Asks a SPECIFIC question about what's missing
3. Provides 3-4 CONCRETE SUGGESTIONS or examples
4. Keeps it conversational and friendly

EXAMPLES OF GOOD RESPONSES:

Missing target:
"I can help make that friendlier! Which part of the page are you focusing on?
• The hero section (headline and intro)
• Navigation menu
• Button text
• Footer content
• Or something else?"

Missing action specifics:
"Got it - let's make the hero warmer! What specific changes did you have in mind?
• Use warmer color palette (oranges, reds)
• Friendlier, more casual copy
• Add welcoming imagery
• Adjust spacing to feel more inviting"

Has both but low confidence:
"I want to make sure I get this right. For making the hero colors warmer, are you thinking:
• Background colors (like adding warm tones)
• Text colors (making them more inviting)
• Accent colors (buttons, links)
• Or a combination?"

Generate a response now (keep it under 100 words, be specific and helpful):`;

    try {
      const response = await this.llmProvider.generateText(prompt);
      return response.trim();
    } catch (error) {
      console.error('Failed to generate suggestive question:', error);
      // Fallback to simple question
      const targetStr = target?.identifiers.join(' and ') || 'that';
      return missingInfo.includes('target')
        ? "Which part of the page would you like to change?"
        : `What would you like to change about the ${targetStr}?`;
    }
  }

  /**
   * Generate contextual suggestions for the user
   */
  private generateSuggestions(state: ConversationState): string[] {
    const { target, action } = state.extractedInfo;
    const missingInfo = state.missingInfo;

    if (missingInfo.includes('target')) {
      return ['hero section', 'buttons', 'footer', 'navigation', 'entire page'];
    }

    if (missingInfo.includes('action-type') || missingInfo.includes('action-specifics')) {
      if (target?.identifiers.some(id => /button/i.test(id))) {
        return ['change color', 'make larger', 'more rounded', 'add shadow'];
      }
      return ['casual language', 'warmer colors', 'increase spacing', 'larger text'];
    }

    return [];
  }

  /**
   * Create ready-to-execute tickets from a completed conversation
   */
  createTickets(state: ConversationState): ReadyTicket[] {
    if (state.status !== 'ready' && state.completenessScore < 0.8) {
      throw new Error('Conversation is not ready to create tickets');
    }

    const { target, action } = state.extractedInfo;

    if (!target || !action) {
      throw new Error('Missing target or action information');
    }

    // Create one ticket per target
    return target.identifiers.map(identifier => {
      const specificsStr = action.specifics.join(' and ');
      const instruction = `Make the ${identifier} ${specificsStr}`;

      return {
        instruction,
        target: {
          type: target.type,
          identifier
        },
        action: {
          type: action.type,
          specifics: action.specifics
        },
        confidence: Math.min(target.confidence, action.confidence)
      };
    });
  }

  /**
   * Mark conversation as ready to create tickets
   */
  markReady(state: ConversationState): void {
    state.status = 'ready';
    state.updatedAt = Date.now();
  }
}

