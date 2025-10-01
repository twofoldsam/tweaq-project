/**
 * Test for the Conversational Intelligence System
 * Demonstrates natural, multi-turn conversation before creating agent tickets
 */

import { ConversationalIntelligence } from './packages/agent-v4/dist/conversation/index.js';

// Mock LLM Provider for testing
const mockLLMProvider = {
  async generateText(prompt) {
    console.log('\n📝 LLM Prompt (truncated):');
    console.log(prompt.substring(0, 200) + '...\n');

    // Simulate extraction based on prompt content
    if (prompt.includes('"Make it more friendly"')) {
      return JSON.stringify({
        action: {
          type: "content",
          specifics: ["friendly"],
          confidence: 0.5
        }
      });
    }

    if (prompt.includes('"Hero and buttons"')) {
      return JSON.stringify({
        target: {
          type: "section",
          identifiers: ["hero", "buttons"],
          confidence: 0.9
        }
      });
    }

    if (prompt.includes('"Both warmer colours and casual language"')) {
      return JSON.stringify({
        action: {
          type: "mixed",
          specifics: ["warmer colors", "casual language"],
          confidence: 0.95
        }
      });
    }

    // Confirmation prompt
    if (prompt.includes('CONFIRMATION')) {
      return 'Looks good!';
    }

    return JSON.stringify({});
  }
};

async function runConversationDemo() {
  console.log('🗣️  CONVERSATIONAL INTELLIGENCE SYSTEM DEMO');
  console.log('===========================================\n');

  const convo = new ConversationalIntelligence(mockLLMProvider);

  // Turn 1: Vague initial message
  console.log('👤 USER: "Make it more friendly"');
  console.log('─────────────────────────────────');
  
  let state = convo.startConversation("Make it more friendly");
  let analysis = await convo.analyzeMessage("Make it more friendly", state);
  
  console.log('🤖 ANALYSIS:');
  console.log(`   Completeness: ${(analysis.completeness * 100).toFixed(1)}%`);
  console.log(`   Missing: ${analysis.missingInfo.join(', ')}`);
  console.log(`   Next Action: ${analysis.nextAction}`);
  console.log(`\n🤖 ASSISTANT:\n   "${analysis.response}"`);
  if (analysis.suggestions) {
    console.log(`   💡 Suggestions: ${analysis.suggestions.join(', ')}`);
  }
  console.log();

  // Turn 2: User provides target
  console.log('👤 USER: "Hero and buttons"');
  console.log('─────────────────────────────────');
  
  analysis = await convo.analyzeMessage("Hero and buttons", state);
  
  console.log('🤖 ANALYSIS:');
  console.log(`   Extracted Target: ${state.extractedInfo.target?.identifiers.join(', ')}`);
  console.log(`   Completeness: ${(analysis.completeness * 100).toFixed(1)}%`);
  console.log(`   Missing: ${analysis.missingInfo.join(', ')}`);
  console.log(`   Next Action: ${analysis.nextAction}`);
  console.log(`\n🤖 ASSISTANT:\n   "${analysis.response}"`);
  console.log();

  // Turn 3: User provides multiple action specifics
  console.log('👤 USER: "Both warmer colours and casual language"');
  console.log('─────────────────────────────────');
  
  analysis = await convo.analyzeMessage("Both warmer colours and casual language", state);
  
  console.log('🤖 ANALYSIS:');
  console.log(`   Extracted Action: ${state.extractedInfo.action?.specifics.join(', ')}`);
  console.log(`   Completeness: ${(analysis.completeness * 100).toFixed(1)}%`);
  console.log(`   Missing: ${analysis.missingInfo.join(', ') || 'Nothing! ✅'}`);
  console.log(`   Status: ${state.status}`);
  console.log(`   Next Action: ${analysis.nextAction}`);
  console.log(`\n🤖 ASSISTANT:\n   ${analysis.response}`);
  console.log();

  // User confirms
  if (analysis.nextAction === 'confirm') {
    console.log('👤 USER: [Clicks Confirm]');
    console.log('─────────────────────────────────');
    
    convo.markReady(state);
    const tickets = convo.createTickets(state);
    
    console.log(`\n✅ CREATED ${tickets.length} READY TICKETS:\n`);
    tickets.forEach((ticket, i) => {
      console.log(`${i + 1}. "${ticket.instruction}"`);
      console.log(`   Target: ${ticket.target.identifier} (${ticket.target.type})`);
      console.log(`   Action: ${ticket.action.type}`);
      console.log(`   Specifics: ${ticket.action.specifics.join(', ')}`);
      console.log(`   Confidence: ${(ticket.confidence * 100).toFixed(1)}%`);
      console.log();
    });
  }

  console.log('===========================================');
  console.log('✨ Conversation complete! Tickets ready for agent execution.');
}

// Run the demo
runConversationDemo().catch(console.error);

