/**
 * Types for the Conversational Intelligence System
 * This system handles natural language conversation BEFORE sending to the agent
 */

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ExtractedTarget {
  type: 'component' | 'section' | 'element-type' | 'page-wide';
  identifiers: string[];  // Can be multiple: ["hero", "buttons"]
  confidence: number;     // 0-1
}

export interface ExtractedAction {
  type: 'content' | 'styling' | 'layout' | 'structure' | 'mixed';
  specifics: string[];    // ["casual language", "warmer colors"]
  confidence: number;     // 0-1
}

export interface ExtractedContext {
  currentState?: string;      // "The page looks too formal"
  desiredOutcome?: string;    // "Want it to feel welcoming"
  constraints?: string[];     // ["Keep it professional", "Don't change layout"]
}

export interface ExtractedInfo {
  target?: ExtractedTarget;
  action?: ExtractedAction;
  context?: ExtractedContext;
}

export interface ConversationState {
  id: string;
  messages: ConversationMessage[];
  extractedInfo: ExtractedInfo;
  completenessScore: number;
  missingInfo: string[];      // ["target", "action-specifics"]
  status: 'gathering' | 'confirming' | 'ready';
  createdAt: number;
  updatedAt: number;
}

export interface ConversationAnalysis {
  extractedInfo: Partial<ExtractedInfo>;
  completeness: number;
  missingInfo: string[];
  nextAction: 'clarify' | 'confirm' | 'ready';
  response: string;
  suggestions?: string[];  // Optional suggestions for the user
}

export interface ReadyTicket {
  instruction: string;  // Final, clear instruction for the agent
  target: {
    type: string;
    identifier: string;
  };
  action: {
    type: string;
    specifics: string[];
  };
  confidence: number;
}

