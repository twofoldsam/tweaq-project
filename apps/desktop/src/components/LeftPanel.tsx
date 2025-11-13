import { useState, useEffect } from 'react';
import './LeftPanel.css';
import './PropertyInputs.css';
import { ToolbarMode } from './LeftToolbar';
import { 
  ColorInput, 
  NumberInput, 
  SelectInput, 
  SpacingInput, 
  TextContentInput,
  parseNumberValue 
} from './PropertyInputs';

interface ElementData {
  tagName: string;
  id: string;
  className: string;
  textContent: string;
  properties: Record<string, string>;
  selector: string;
}

interface LeftPanelProps {
  mode: ToolbarMode;
  width: number;
  onWidthChange: (width: number) => void;
  visible: boolean;
  onTweaqCountChange?: (count: number) => void;
}

interface RecordedEdit {
  id: string;
  timestamp: number;
  elementName: string;
  changes: Array<{
    property: string;
    before: string;
    after: string;
  }>;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  type?: 'property-change' | 'structured-change';
  actionType?: string;
  target?: {
    identifier: string;
    type: string;
  };
  specifics?: Array<{
    field: string;
    value: string;
  }>;
  prUrl?: string;
  error?: string;
  metadata?: {
    generatedByAI?: boolean;
  };
}

export function LeftPanel({ mode, width, onWidthChange, visible, onTweaqCountChange }: LeftPanelProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null);
  const [editedProperties, setEditedProperties] = useState<Record<string, string>>({});
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [recordedEdits, setRecordedEdits] = useState<RecordedEdit[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isConvertingComments, setIsConvertingComments] = useState(false);

  // Helper function to categorize property changes
  const categorizeChange = (property: string) => {
    const categories: Record<string, { type: string; icon: string; color: string }> = {
      'textContent': { type: 'Copy Change', icon: '✏️', color: '#667eea' },
      'color': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
      'backgroundColor': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
      'borderColor': { type: 'Color Change', icon: '🎨', color: '#f093fb' },
      'fontSize': { type: 'Size Change', icon: '📏', color: '#4facfe' },
      'width': { type: 'Size Change', icon: '📏', color: '#4facfe' },
      'height': { type: 'Size Change', icon: '📏', color: '#4facfe' },
      'padding': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'margin': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingTop': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingRight': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingBottom': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'paddingLeft': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginTop': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginRight': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginBottom': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'marginLeft': { type: 'Spacing Change', icon: '📐', color: '#43e97b' },
      'fontWeight': { type: 'Style Change', icon: '💎', color: '#fa709a' },
    };
    return categories[property] || { type: 'Style Change', icon: '✨', color: '#a8edea' };
  };

  // Helper function to generate plain English summary
  const generateSummary = (changes: any[], elementName: string) => {
    if (changes.length === 1) {
      const change = changes[0];
      const property = change.property;
      
      if (property === 'textContent') {
        return `Change text to "${change.after.substring(0, 30)}${change.after.length > 30 ? '...' : ''}"`;
      } else if (property === 'color' || property === 'backgroundColor') {
        return `Change ${property === 'color' ? 'text' : 'background'} color to ${change.after}`;
      } else if (property === 'fontSize') {
        return `Change font size from ${change.before} to ${change.after}`;
      } else if (property.includes('padding') || property.includes('margin')) {
        const type = property.includes('padding') ? 'padding' : 'margin';
        return `Adjust ${type} to ${change.after}`;
      } else {
        return `Update ${property} to ${change.after}`;
      }
    } else {
      const types = [...new Set(changes.map(c => categorizeChange(c.property).type))];
      if (types.length === 1) {
        return `${changes.length} ${types[0].toLowerCase()} updates`;
      } else {
        return `${changes.length} property changes`;
      }
    }
  };
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [readyTickets, setReadyTickets] = useState<any[]>([]);
  const [conversationState, setConversationState] = useState<any>(null);
  const [isSelectModeActive, setIsSelectModeActive] = useState(true); // Default to true for design mode

  useEffect(() => {
    // Listen for element selection from BrowserView
    const cleanup = window.electronAPI.onElementSelected?.((data: ElementData) => {
      console.log('Element selected in React:', data);
      setSelectedElement(data);
      setEditedProperties({}); // Reset edits when new element selected
      setHasPendingChanges(false);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Auto-select page root element when in design mode with nothing selected
  useEffect(() => {
    const selectRootElement = async () => {
      if (mode === 'design' && !selectedElement && visible) {
        try {
          // Try to select common root containers first, fallback to body
          const selectors = [
            '#root',           // React apps
            '#__next',         // Next.js apps
            '#app',            // Vue apps
            '[data-reactroot]', // React apps
            'body > div:first-child', // First child of body
            'body'            // Fallback
          ];
          
          // Try each selector until one works
          for (const selector of selectors) {
            try {
              await window.electronAPI.overlaySelectElement(selector);
              console.log(`Selected page root: ${selector}`);
              break;
            } catch (error) {
              // Try next selector
              continue;
            }
          }
        } catch (error) {
          console.error('Failed to auto-select root element:', error);
        }
      }
    };

    selectRootElement();
  }, [mode, visible]);

  useEffect(() => {
    // Fetch recorded edits and comments when switching to tickets mode
    if (mode === 'tickets') {
      fetchRecordedEdits();
      fetchComments();
    }
  }, [mode]);

  const fetchComments = async () => {
    try {
      const result = await window.electronAPI.overlayGetComments();
      if (result.success && result.comments) {
        setComments(result.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchRecordedEdits = async () => {
    try {
      const result = await window.electronAPI.overlayGetRecordedEdits();
      if (result.success && result.edits) {
        setRecordedEdits(result.edits);
      }
    } catch (error) {
      console.error('Failed to fetch recorded edits:', error);
    }
  };

  const handleDeleteTicket = async (index: number) => {
    try {
      const result = await window.electronAPI.overlayDeleteEdit(index);
      if (result.success) {
        // Refresh the list
        await fetchRecordedEdits();
        
        // Update tweaq count immediately
        if (onTweaqCountChange) {
          const countResult = await window.electronAPI.overlayGetRecordedEdits();
          if (countResult.success && countResult.edits) {
            onTweaqCountChange(countResult.edits.length);
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error);
    }
  };

  const handleConvertComments = async () => {
    setIsConvertingComments(true);
    try {
      console.log('Converting comments to tweaqs...');
      
      // Get comments data from the overlay
      const commentsResult = await window.electronAPI.overlayGetComments();
      if (!commentsResult.success || !commentsResult.comments || commentsResult.comments.length === 0) {
        alert('No comments found to convert');
        return;
      }

      // Call Claude to analyze comments and generate tweaqs
      const result = await window.electronAPI.convertCommentsToTweaqs(commentsResult.comments);
      
      if (result.success && result.tweaqs) {
        console.log('✅ Received tweaqs from LLM:', result.tweaqs);
        
        // Convert each tweaq into a recorded edit and add to BrowserView
        for (const tweaq of result.tweaqs) {
          const editData = convertTweaqToEdit(tweaq);
          if (editData) {
            await window.electronAPI.overlayRecordEdit(editData);
          }
        }
        
        // Remove all comments from the page
        await window.electronAPI.overlayRemoveAllComments();
        
        // Refresh the edits and comments lists
        await fetchRecordedEdits();
        await fetchComments();
        
        console.log('✅ Successfully converted comments to tweaqs');
      } else {
        console.error('Failed to convert comments:', result.error);
        alert(`Failed to convert comments to tweaqs: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to convert comments:', error);
      alert('An error occurred while converting comments.');
    } finally {
      setIsConvertingComments(false);
    }
  };

  const convertTweaqToEdit = (tweaq: any) => {
    try {
      // Convert LLM-generated tweaq into edit format
      const categoryToActionType: Record<string, string> = {
        'copy': 'content',
        'style': 'styling',
        'layout': 'layout',
        'color': 'styling',
        'spacing': 'layout',
        'size': 'layout',
        'visibility': 'styling'
      };
      
      const actionType = categoryToActionType[tweaq.category] || 'mixed';
      
      // Create specifics array from changes
      const specifics: Array<{ field: string; value: string }> = [];
      if (tweaq.changes && Array.isArray(tweaq.changes)) {
        tweaq.changes.forEach((change: any) => {
          if (change.description) {
            specifics.push({ field: change.property || 'change', value: change.description });
          } else {
            const propName = change.property === 'textContent' ? 'text' : change.property;
            specifics.push({
              field: propName,
              value: `${change.currentValue || 'current'} → ${change.newValue}`
            });
          }
        });
      }
      
      // Build the edit object
      return {
        type: 'structured-change',
        actionType: actionType,
        target: tweaq.target,
        instruction: tweaq.instruction,
        specifics: specifics,
        sourceComments: tweaq.sourceComments || [],
        reasoning: tweaq.reasoning,
        confidence: tweaq.confidence,
        changes: tweaq.changes || [],
        metadata: {
          generatedByAI: true,
          category: tweaq.category
        }
      };
    } catch (error) {
      console.error('Failed to convert tweaq to edit:', error);
      return null;
    }
  };

  const handleSendToAgent = async () => {
    try {
      // TODO: Implement sending to Agent V4
      console.log('Sending tweaqs to Agent V4...');
      // This would trigger the PR creation workflow
    } catch (error) {
      console.error('Failed to send to agent:', error);
    }
  };

  // Helper to find selectors for a target description
  const findSelectorsForTarget = async (targetDescription: string): Promise<string[]> => {
    try {
      const script = `
        (function() {
          const target = ${JSON.stringify(targetDescription.toLowerCase())};
          const selectors = [];
          
          console.log('🔍 Searching for:', target);
          
          // Helper to check if element is in a section (hero, header, footer, etc.)
          const isInSection = (el, sectionType) => {
            let current = el;
            while (current && current !== document.body) {
              const tag = current.tagName?.toLowerCase();
              const classes = current.className?.toLowerCase() || '';
              const id = current.id?.toLowerCase() || '';
              
              // Check for hero section
              if (sectionType === 'hero') {
                if (tag === 'header' || tag === 'section' || tag === 'div') {
                  if (classes.includes('hero') || 
                      classes.includes('banner') || 
                      id.includes('hero') ||
                      classes.includes('jumbotron')) {
                    return true;
                  }
                  // Hero is usually first major section
                  if (current.parentElement === document.body || 
                      current.parentElement?.tagName === 'MAIN') {
                    const siblings = Array.from(current.parentElement.children);
                    if (siblings.indexOf(current) <= 1) return true;
                  }
                }
              }
              
              // Check for header
              if (sectionType === 'header') {
                if (tag === 'header' || tag === 'nav' || 
                    classes.includes('header') || 
                    classes.includes('navbar') ||
                    id.includes('header')) {
                  return true;
                }
              }
              
              // Check for footer
              if (sectionType === 'footer') {
                if (tag === 'footer' || 
                    classes.includes('footer') || 
                    id.includes('footer')) {
                  return true;
                }
              }
              
              current = current.parentElement;
            }
            return false;
          };
          
          // Extract section context from target
          let sectionContext = null;
          if (target.includes('hero')) sectionContext = 'hero';
          else if (target.includes('header')) sectionContext = 'header';
          else if (target.includes('footer')) sectionContext = 'footer';
          
          // Find buttons/CTAs
          const buttonPatterns = [
            'button',
            'a[href]',
            '[role="button"]',
            'input[type="submit"]',
            '.btn',
            '.button',
            '.cta'
          ];
          
          const allButtons = [];
          buttonPatterns.forEach(pattern => {
            try {
              document.querySelectorAll(pattern).forEach(el => allButtons.push(el));
            } catch (e) {}
          });
          
          console.log('Found', allButtons.length, 'total buttons');
          
          // Filter by section if specified
          let candidates = allButtons;
          if (sectionContext) {
            candidates = allButtons.filter(el => isInSection(el, sectionContext));
            console.log('Filtered to', candidates.length, 'buttons in', sectionContext);
          }
          
          // Further filter by CTA characteristics
          if (target.includes('cta') || target.includes('call to action') || target.includes('primary')) {
            candidates = candidates.filter(el => {
              const text = el.textContent?.toLowerCase() || '';
              const classes = el.className?.toLowerCase() || '';
              const id = el.id?.toLowerCase() || '';
              
              return (
                text.includes('get started') ||
                text.includes('sign up') ||
                text.includes('start') ||
                text.includes('try') ||
                text.includes('buy') ||
                text.includes('subscribe') ||
                text.includes('learn more') ||
                text.includes('apply') ||
                classes.includes('primary') ||
                classes.includes('cta') ||
                id.includes('primary') ||
                id.includes('cta')
              );
            });
            console.log('Filtered to', candidates.length, 'CTA buttons');
          }
          
          // Smart prioritization: score elements by prominence
          if (candidates.length > 0) {
            candidates = candidates.map(el => {
              const rect = el.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(el);
              
              let score = 0;
              
              // Prioritize elements higher on the page (in viewport or just below)
              if (rect.top < window.innerHeight) {
                score += 100;
              }
              score -= Math.min(rect.top / 100, 50); // Penalize elements further down
              
              // Prioritize larger elements (more prominent)
              const area = rect.width * rect.height;
              score += Math.min(area / 100, 50);
              
              // Prioritize visible elements
              if (rect.width > 0 && rect.height > 0 && computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none') {
                score += 50;
              }
              
              // Prioritize elements with primary/CTA styling
              const bgColor = computedStyle.backgroundColor;
              const text = el.textContent?.toLowerCase() || '';
              const classes = el.className?.toLowerCase() || '';
              
              if (classes.includes('primary') || classes.includes('cta')) {
                score += 30;
              }
              
              // Prioritize specific CTA text
              if (text.includes('apply') || text.includes('get started') || text.includes('sign up')) {
                score += 20;
              }
              
              return { el, score };
            }).sort((a, b) => b.score - a.score);
            
            console.log('Scored candidates:', candidates.map(c => ({ 
              text: c.el.textContent?.trim().slice(0, 30), 
              score: c.score.toFixed(1) 
            })));
            
            // CRITICAL: Only take the top 1-2 most relevant elements
            const maxElements = target.includes('button') && !target.includes('buttons') ? 1 : 2;
            candidates = candidates.slice(0, maxElements).map(c => c.el);
            console.log('⚠️ LIMITED to top', candidates.length, 'most relevant element(s)');
          }
          
          // If still nothing, take first button only
          if (candidates.length === 0 && allButtons.length > 0) {
            candidates = allButtons.slice(0, 1);
            console.log('Using first button as fallback');
          }
          
          // Generate selectors using the overlay's method
          candidates.forEach(el => {
            // Use nth-of-type for reliability
            const path = [];
            let current = el;
            let depth = 0;
            
            while (current && current !== document.body && depth < 4) {
              let selector = current.tagName.toLowerCase();
              
              if (current.id) {
                selector = '#' + current.id;
                path.unshift(selector);
                break;
              }
              
              if (current.parentElement) {
                const siblings = Array.from(current.parentElement.children);
                const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
                if (sameTagSiblings.length > 1) {
                  const index = sameTagSiblings.indexOf(current);
                  selector += \`:nth-of-type(\${index + 1})\`;
                }
              }
              
              path.unshift(selector);
              current = current.parentElement;
              depth++;
            }
            
            const fullSelector = path.join(' > ');
            selectors.push(fullSelector);
          });
          
          console.log('Generated selectors:', selectors);
          return [...new Set(selectors)];
        })()
      `;
      
      const result = await window.electronAPI.executeScript(script);
      return result || [];
    } catch (error) {
      console.error('Error finding selectors:', error);
      return [];
    }
  };

  // Helper to parse action specifics into CSS changes and text changes
  const parseActionToChanges = (specifics: string[]): Array<{property: string, value: string}> => {
    const changes: Array<{property: string, value: string}> = [];
    
    console.log('📝 Parsing action specifics:', specifics);
    
    specifics.forEach(specific => {
      const lower = specific.toLowerCase();
      
      // Text content changes - look for various patterns
      // Pattern 1: say 'text' or text 'text'
      let textMatch = specific.match(/(?:say|text|reads|says|read)\s+['""]([^'""]+)['""]?/i);
      if (!textMatch) {
        // Pattern 2: to say 'text'
        textMatch = specific.match(/to\s+say\s+['""]([^'""]+)['""]?/i);
      }
      if (!textMatch) {
        // Pattern 3: change text to 'text'
        textMatch = specific.match(/(?:change|set)\s+(?:text|label|content)\s+to\s+['""]([^'""]+)['""]?/i);
      }
      if (!textMatch) {
        // Pattern 4: just quoted text
        textMatch = specific.match(/['""]([^'""]+)['""]?/);
      }
      
      if (textMatch) {
        const newText = textMatch[1];
        if (newText && newText.length > 0) {
          console.log('📝 Extracted text:', newText);
          changes.push({ property: 'textContent', value: newText.trim() });
          return; // Don't process this specific for other changes
        }
      }
      
      // Color changes
      if (lower.includes('purple')) {
        changes.push({ property: 'backgroundColor', value: '#8b5cf6' });
        changes.push({ property: 'color', value: 'white' });
      } else if (lower.includes('blue')) {
        changes.push({ property: 'backgroundColor', value: '#3b82f6' });
        changes.push({ property: 'color', value: 'white' });
      } else if (lower.includes('red')) {
        changes.push({ property: 'backgroundColor', value: '#ef4444' });
        changes.push({ property: 'color', value: 'white' });
      } else if (lower.includes('green')) {
        changes.push({ property: 'backgroundColor', value: '#22c55e' });
        changes.push({ property: 'color', value: 'white' });
      } else if (lower.includes('orange')) {
        changes.push({ property: 'backgroundColor', value: '#f97316' });
        changes.push({ property: 'color', value: 'white' });
      } else if (lower.includes('yellow')) {
        changes.push({ property: 'backgroundColor', value: '#eab308' });
        changes.push({ property: 'color', value: '#000' });
      } else if (lower.includes('pink')) {
        changes.push({ property: 'backgroundColor', value: '#ec4899' });
        changes.push({ property: 'color', value: 'white' });
      }
      
      // Dark mode  
      if (lower.includes('dark mode') || lower.includes('dark')) {
        changes.push({ property: 'backgroundColor', value: '#1f2937' });
        changes.push({ property: 'color', value: '#f9fafb' });
      }
      
      // Style changes
      if (lower.includes('vibrant') || lower.includes('bold')) {
        changes.push({ property: 'fontWeight', value: 'bold' });
        changes.push({ property: 'filter', value: 'saturate(1.5) brightness(1.1)' });
      }
      
      if (lower.includes('larger') || lower.includes('bigger')) {
        changes.push({ property: 'fontSize', value: '1.2em' });
        changes.push({ property: 'padding', value: '14px 28px' });
      }
      
      if (lower.includes('smaller')) {
        changes.push({ property: 'fontSize', value: '0.9em' });
        changes.push({ property: 'padding', value: '8px 16px' });
      }
      
      if (lower.includes('rounded')) {
        changes.push({ property: 'borderRadius', value: '8px' });
      }
    });
    
    return changes;
  };

  const createReadyTickets = (state: any) => {
    const { target, action } = state.extractedInfo;
    
    if (!target || !action) {
      console.error('Cannot create tweaqs: missing target or action');
      return;
    }

    // Smart identifier combining: detect compound targets like "hero button"
    let identifiers = [...target.identifiers];
    
    // Section keywords that modify other elements
    const sectionKeywords = ['hero', 'header', 'footer', 'nav', 'navigation'];
    const elementKeywords = ['button', 'cta', 'link', 'text', 'heading', 'image', 'icon'];
    
    // Check if we have a section + element combination
    const hasSectionKeyword = identifiers.some(id => 
      sectionKeywords.some(section => id.toLowerCase().includes(section))
    );
    const hasElementKeyword = identifiers.some(id => 
      elementKeywords.some(element => id.toLowerCase().includes(element))
    );
    
    // If we have both a section and an element, combine them
    if (hasSectionKeyword && hasElementKeyword && identifiers.length > 1) {
      const section = identifiers.find(id => 
        sectionKeywords.some(s => id.toLowerCase().includes(s))
      );
      const element = identifiers.find(id => 
        elementKeywords.some(e => id.toLowerCase().includes(e))
      );
      
      if (section && element) {
        // Combine into a single compound identifier
        identifiers = [`${element} in the ${section} section`];
        console.log(`🔄 Combined identifiers into: "${identifiers[0]}"`);
      }
    }

    // Create ready tickets (one per identifier)
    const tickets = identifiers.map((identifier: string) => {
      const specificsStr = action.specifics.join(' and ');
      return {
        instruction: `Make the ${identifier} ${specificsStr}`,
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

    setReadyTickets(tickets);
    console.log('✅ Created ready tweaqs:', tickets);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    try {
      console.log('🗣️ Sending chat message:', userMessage);
      
      // Call the conversational intelligence API
      const result = await (window as any).electronAPI.analyzeConversationMessage({
        message: userMessage,
        conversationState: conversationState
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze message');
      }

      const analysis = result.analysis;

      // Update conversation state
      setConversationState(analysis.conversationState);

      // Add AI response
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: analysis.response
      }]);

      console.log(`✅ Analysis complete - Completeness: ${(analysis.completeness * 100).toFixed(1)}%`);
      console.log(`   Next Action: ${analysis.nextAction}`);

      // If ready for confirmation, create ready tickets
      if (analysis.nextAction === 'confirm') {
        createReadyTickets(analysis.conversationState);
      }

      setIsChatLoading(false);
    } catch (error) {
      console.error('❌ Failed to send chat message:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, something went wrong: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      setIsChatLoading(false);
    }
  };

  const handleConfirmTweaqs = async () => {
    // Apply tweaqs to the BrowserView and record them
    if (readyTickets && readyTickets.length > 0) {
      console.log('✅ Confirming and applying tweaqs:', readyTickets);
      
      const newEdits: RecordedEdit[] = [];
      
      // Process each tweaq
      for (const tweaq of readyTickets) {
        try {
          // Find actual selectors for the target
          const selectors = await findSelectorsForTarget(tweaq.target.identifier);
          
          if (selectors.length === 0) {
            console.warn(`⚠️ No elements found for: ${tweaq.target.identifier}`);
            continue;
          }
          
          console.log(`✅ Found ${selectors.length} elements for "${tweaq.target.identifier}":`, selectors);
          
          // CRITICAL: For singular targets, only use the first (most relevant) selector
          const isSingular = !tweaq.target.identifier.toLowerCase().includes('buttons') && 
                            !tweaq.target.identifier.toLowerCase().includes('links') &&
                            !tweaq.target.identifier.toLowerCase().includes('all');
          
          const selectorsToApply = isSingular ? [selectors[0]] : selectors;
          console.log(`⚠️ Applying to ${selectorsToApply.length} element(s) (singular: ${isSingular})`);
          
          // Apply changes to each element
          for (const selector of selectorsToApply) {
            // Parse the action specifics and apply
            const changes = parseActionToChanges(tweaq.action.specifics);
            
            // Build the edit data structure
            const editData = {
              elementSelector: selector,
              elementName: tweaq.target.identifier,
              changes: changes.map(c => ({
                property: c.property,
                before: 'original',
                after: c.value
              })),
              timestamp: Date.now(),
              visible: true,
              source: 'chat'
            };
            
            // Apply each change to the element AND record in the overlay
            for (const change of changes) {
              try {
                // Handle textContent separately from style changes
                if (change.property === 'textContent') {
                  const textScript = `
                    (function() {
                      try {
                        const elements = document.querySelectorAll(${JSON.stringify(selector)});
                        elements.forEach(el => {
                          el.textContent = ${JSON.stringify(change.value)};
                        });
                        return true;
                      } catch (e) {
                        console.error('Error setting text:', e);
                        return false;
                      }
                    })()
                  `;
                  await window.electronAPI.executeScript(textScript);
                  console.log(`⚡ Applied textContent: "${change.value}" to ${selector}`);
                } else {
                  await window.electronAPI.overlayApplyStyle(selector, change.property, change.value);
                  console.log(`⚡ Applied ${change.property}: ${change.value} to ${selector}`);
                }
              } catch (error) {
                console.error(`❌ Error applying change to ${selector}:`, error);
              }
            }
            
            // Record the edit in the BrowserView overlay
            try {
              await window.electronAPI.overlayRecordEdit(editData);
              console.log(`✅ Recorded edit in overlay for ${selector}`);
            } catch (error) {
              console.error(`❌ Error recording edit in overlay:`, error);
            }
            
            // Also keep in local state for immediate display
            const edit: RecordedEdit = {
              id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              elementSelector: selector,
              elementName: tweaq.target.identifier,
              changes: changes.map(c => ({
                property: c.property,
                before: 'original',
                after: c.value
              })),
              timestamp: Date.now(),
              visible: true,
              source: 'chat',
              status: 'pending',
              type: 'property-change'
            };
            
            newEdits.push(edit);
          }
        } catch (error) {
          console.error('❌ Error processing tweaq:', error);
        }
      }
      
      // Refresh edits from the overlay (now that we've recorded them there)
      await fetchRecordedEdits();
      
      // Clear conversation and tickets
      setReadyTickets([]);
      setChatMessages([]);
      setConversationState(null);
      
      console.log(`✅ Created and applied ${newEdits.length} tweaqs from chat`);
    }
  };

  const handleCancelTweaqs = () => {
    setReadyTickets([]);
    setChatMessages([]);
    setConversationState(null);
    console.log('❌ Cancelled tweaqs');
  };

  const handleToggleSelectMode = async () => {
    const newState = !isSelectModeActive;
    setIsSelectModeActive(newState);
    
    try {
      // Toggle select mode in the BrowserView overlay
      await window.electronAPI.overlayToggleSelectMode();
      
      // If disabling select mode, reset to page root element
      if (!newState) {
        // Clear pending changes
        setEditedProperties({});
        setHasPendingChanges(false);
        
        // Auto-select page root to show background properties
        // Don't clear selectedElement first to avoid flash - let root selection replace it
        try {
          // Try to select common root containers first, fallback to body
          const selectors = [
            '#root',           // React apps
            '#__next',         // Next.js apps
            '#app',            // Vue apps
            '[data-reactroot]', // React apps
            'body > div:first-child', // First child of body
            'body'            // Fallback
          ];
          
          // Try each selector until one works
          let selected = false;
          for (const selector of selectors) {
            try {
              await window.electronAPI.overlaySelectElement(selector);
              console.log(`Selected page root on deselect: ${selector}`);
              selected = true;
              break;
            } catch (error) {
              continue;
            }
          }
          
          if (!selected) {
            setSelectedElement(null);
          }
        } catch (error) {
          console.error('Failed to select root element:', error);
          setSelectedElement(null);
        }
      }
    } catch (error) {
      console.error('Failed to toggle select mode:', error);
    }
  };

  const handleTicketHover = async (index: number) => {
    try {
      // Highlight the element in the BrowserView
      await window.electronAPI.overlayHighlightEdit(index);
    } catch (error) {
      console.error('Failed to highlight element:', error);
    }
  };

  const handleTicketLeave = async () => {
    try {
      // Clear the highlight in the BrowserView
      await window.electronAPI.overlayClearHighlight();
    } catch (error) {
      console.error('Failed to clear highlight:', error);
    }
  };

  // Simple markdown renderer (supports bold, italic, code, links)
  const renderMarkdown = (text: string) => {
    let html = text;
    
    // Code blocks ```code```
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br/>');
    
    return html;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(280, Math.min(800, startWidth + deltaX));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };

  const handlePropertyChange = async (property: string, value: string) => {
    if (!selectedElement) return;

    // Update local state
    setEditedProperties(prev => ({ ...prev, [property]: value }));
    setHasPendingChanges(true);

    // Apply change live to the element in BrowserView
    try {
      await window.electronAPI.overlayApplyStyle(selectedElement.selector, property, value);
    } catch (error) {
      console.error('Failed to apply style:', error);
    }
  };

  const handleRecordEdit = async () => {
    if (!selectedElement || !hasPendingChanges) return;

    const changes = Object.entries(editedProperties).map(([property, after]) => {
      // Get the before value correctly (handle textContent specially)
      let before = '';
      if (property === 'textContent') {
        before = selectedElement.textContent || '';
      } else {
        before = selectedElement.properties[property] || '';
      }
      
      return {
        property,
        before,
        after
      };
    });

    console.log('Recording edit with changes:', changes);

    try {
      await window.electronAPI.overlayRecordEdit({
        element: selectedElement,
        changes
      });

      // Reset state after recording
      setEditedProperties({});
      setHasPendingChanges(false);
      
      // Update tweaq count immediately
      if (onTweaqCountChange) {
        const result = await window.electronAPI.overlayGetRecordedEdits();
        if (result.success && result.edits) {
          onTweaqCountChange(result.edits.length);
        }
      }

      console.log('Edit recorded successfully');
    } catch (error) {
      console.error('Failed to record edit:', error);
    }
  };

  const getCurrentValue = (property: string) => {
    // Check edited properties first
    if (editedProperties[property] !== undefined) {
      return editedProperties[property];
    }
    
    // Handle textContent specially (it's top-level, not in properties)
    if (property === 'textContent') {
      return selectedElement?.textContent || '';
    }
    
    // Default to properties record
    return selectedElement?.properties[property] || '';
  };

  // Check if a property has been recorded in a tweaq for the current element
  const hasRecordedChange = (property: string): boolean => {
    if (!selectedElement) return false;
    
    return recordedEdits.some(edit => {
      // Check if the edit is for the current element
      const matchesElement = edit.elementSelector === selectedElement.selector ||
                            edit.elementName === selectedElement.tagName.toLowerCase();
      
      // Check if this property was changed
      const hasPropertyChange = edit.changes?.some((change: any) => 
        change.property === property
      );
      
      return matchesElement && hasPropertyChange;
    });
  };

  const getRect = () => {
    // Parse width and height from properties if available
    const width = parseNumberValue(getCurrentValue('width'));
    const height = parseNumberValue(getCurrentValue('height'));
    return { width, height };
  };

  const hasTextContent = () => {
    return selectedElement?.textContent && selectedElement.textContent.trim().length > 0;
  };

  const isFlexOrGrid = () => {
    const display = getCurrentValue('display');
    return display === 'flex' || display === 'grid';
  };

  const renderPanelContent = () => {
    switch (mode) {
      case 'design':
        if (selectedElement) {
          const rect = getRect();
          
          return (
            <div className="panel-content">
              {/* Element Header */}
              <div className="element-header-section">
                <div className="element-info">
                  <div className="element-tag">
                    &lt;{selectedElement.tagName}&gt;
                    {selectedElement.id && <span className="element-id">#{selectedElement.id}</span>}
                    {selectedElement.className && (
                      <span className="element-class">.{selectedElement.className.split(' ')[0]}</span>
                    )}
                  </div>
                  {selectedElement.textContent && (
                    <div className="element-text">{selectedElement.textContent}</div>
                  )}
                </div>
              </div>
              
              {/* Design Section */}
              <div className="properties-section">
                <h3 className="section-header">Design</h3>
                <ColorInput
                  label="Fill"
                  value={getCurrentValue('backgroundColor')}
                  property="backgroundColor"
                  onChange={handlePropertyChange}
                  hasRecordedChange={hasRecordedChange('backgroundColor')}
                />
                <NumberInput
                  label="Corner Radius"
                  value={parseNumberValue(getCurrentValue('borderRadius'))}
                  property="borderRadius"
                  unit="px"
                  onChange={handlePropertyChange}
                  hasRecordedChange={hasRecordedChange('borderRadius')}
                />
              </div>

              {/* Layout Section */}
              <div className="properties-section">
                <h3 className="section-header">Layout</h3>
                <SelectInput
                  label="Position"
                  value={getCurrentValue('position')}
                  property="position"
                  options={[
                    { value: 'static', label: 'Static' },
                    { value: 'relative', label: 'Relative' },
                    { value: 'absolute', label: 'Absolute' },
                    { value: 'fixed', label: 'Fixed' },
                    { value: 'sticky', label: 'Sticky' }
                  ]}
                  onChange={handlePropertyChange}
                  hasRecordedChange={hasRecordedChange('position')}
                />
                <SelectInput
                  label="Display"
                  value={getCurrentValue('display')}
                  property="display"
                  options={[
                    { value: 'block', label: 'Block' },
                    { value: 'inline', label: 'Inline' },
                    { value: 'inline-block', label: 'Inline Block' },
                    { value: 'flex', label: 'Flex' },
                    { value: 'grid', label: 'Grid' },
                    { value: 'none', label: 'None' }
                  ]}
                  onChange={handlePropertyChange}
                  hasRecordedChange={hasRecordedChange('display')}
                />
                {isFlexOrGrid() && (
                  <NumberInput
                    label="Gap"
                    value={parseNumberValue(getCurrentValue('gap'))}
                    property="gap"
                    unit="px"
                    onChange={handlePropertyChange}
                  />
                )}
                <div className="property-row">
                  <label className="property-name">Size:</label>
                  <div className="dimension-grid">
                    <NumberInput
                      label=""
                      value={rect.width}
                      property="width"
                      unit="W"
                      readonly
                      onChange={handlePropertyChange}
                    />
                    <NumberInput
                      label=""
                      value={rect.height}
                      property="height"
                      unit="H"
                      readonly
                      onChange={handlePropertyChange}
                    />
                  </div>
                </div>
                <SpacingInput
                  label="Padding"
                  values={{
                    top: parseNumberValue(getCurrentValue('paddingTop')),
                    right: parseNumberValue(getCurrentValue('paddingRight')),
                    bottom: parseNumberValue(getCurrentValue('paddingBottom')),
                    left: parseNumberValue(getCurrentValue('paddingLeft'))
                  }}
                  properties={{
                    top: 'paddingTop',
                    right: 'paddingRight',
                    bottom: 'paddingBottom',
                    left: 'paddingLeft'
                  }}
                  onChange={handlePropertyChange}
                />
                <SpacingInput
                  label="Margin"
                  values={{
                    top: parseNumberValue(getCurrentValue('marginTop')),
                    right: parseNumberValue(getCurrentValue('marginRight')),
                    bottom: parseNumberValue(getCurrentValue('marginBottom')),
                    left: parseNumberValue(getCurrentValue('marginLeft'))
                  }}
                  properties={{
                    top: 'marginTop',
                    right: 'marginRight',
                    bottom: 'marginBottom',
                    left: 'marginLeft'
                  }}
                  onChange={handlePropertyChange}
                />
              </div>

              {/* Text Section - only show if element has text */}
              {hasTextContent() && (
                <div className="properties-section">
                  <h3 className="section-header">Text</h3>
                  <TextContentInput
                    label="Content"
                    value={getCurrentValue('textContent')}
                    property="textContent"
                    onChange={handlePropertyChange}
                    hasRecordedChange={hasRecordedChange('textContent')}
                  />
                  <NumberInput
                    label="Size"
                    value={parseNumberValue(getCurrentValue('fontSize'))}
                    property="fontSize"
                    unit="px"
                    onChange={handlePropertyChange}
                    hasRecordedChange={hasRecordedChange('fontSize')}
                  />
                  <SelectInput
                    label="Weight"
                    value={getCurrentValue('fontWeight')}
                    property="fontWeight"
                    options={[
                      { value: '100', label: 'Thin' },
                      { value: '200', label: 'Extra Light' },
                      { value: '300', label: 'Light' },
                      { value: '400', label: 'Regular' },
                      { value: '500', label: 'Medium' },
                      { value: '600', label: 'Semi Bold' },
                      { value: '700', label: 'Bold' },
                      { value: '800', label: 'Extra Bold' },
                      { value: '900', label: 'Black' }
                    ]}
                    onChange={handlePropertyChange}
                    hasRecordedChange={hasRecordedChange('fontWeight')}
                  />
                  <ColorInput
                    label="Color"
                    value={getCurrentValue('color')}
                    property="color"
                    onChange={handlePropertyChange}
                    hasRecordedChange={hasRecordedChange('color')}
                  />
                  <SelectInput
                    label="Align"
                    value={getCurrentValue('textAlign')}
                    property="textAlign"
                    options={[
                      { value: 'left', label: 'Left' },
                      { value: 'center', label: 'Center' },
                      { value: 'right', label: 'Right' },
                      { value: 'justify', label: 'Justify' }
                    ]}
                    onChange={handlePropertyChange}
                    hasRecordedChange={hasRecordedChange('textAlign')}
                  />
                </div>
              )}

              {/* Effects Section */}
              <div className="properties-section">
                <h3 className="section-header">Effects</h3>
                <NumberInput
                  label="Opacity"
                  value={Math.round(parseFloat(getCurrentValue('opacity') || '1') * 100)}
                  property="opacity"
                  unit="%"
                  min={0}
                  max={100}
                  onChange={handlePropertyChange}
                  hasRecordedChange={hasRecordedChange('opacity')}
                />
                {getCurrentValue('boxShadow') && getCurrentValue('boxShadow') !== 'none' && (
                  <div className="property-row">
                    <label className="property-name">Shadow:</label>
                    <input
                      type="text"
                      value={getCurrentValue('boxShadow')}
                      onChange={(e) => handlePropertyChange('boxShadow', e.target.value)}
                      className="property-input"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="panel-content">
            <div className="design-empty-state">
              <p>
                {isSelectModeActive 
                  ? 'Click on any element on the page to view and edit its properties.'
                  : 'Click "Select" below to start selecting elements.'}
              </p>
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="panel-content chat-view">
            {/* Messages Container */}
            <div className="chat-messages-container">
              {chatMessages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">💬</div>
                  <p className="chat-welcome-text">Start a conversation to make changes</p>
                  
                  {/* Example Chips */}
                  <div className="chat-examples">
                    <div className="examples-label">Examples:</div>
                    <div className="example-chips">
                      <button className="example-chip" onClick={() => setChatInput('Make the copy more friendly')}>
                        Make the copy more friendly
                      </button>
                      <button className="example-chip" onClick={() => setChatInput('Condense the footer')}>
                        Condense the footer
                      </button>
                      <button className="example-chip" onClick={() => setChatInput('Make buttons more vibrant')}>
                        Make buttons more vibrant
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`}>
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content }}
                    />
                  </div>
                ))
              )}
              
              {/* Loading indicator */}
              {isChatLoading && (
                <div className="chat-loading">
                  <div className="spinner"></div>
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Confirmation UI for Ready Tweaqs */}
            {readyTickets && readyTickets.length > 0 && (
              <div className="chat-confirmation">
                <div className="confirmation-header">Ready to create tweaqs?</div>
                <div className="confirmation-tickets">
                  {readyTickets.map((ticket, i) => (
                    <div key={i} className="confirmation-ticket">
                      <div className="confirmation-ticket-icon">⚡</div>
                      <div className="confirmation-ticket-info">
                        <div className="confirmation-ticket-instruction">{ticket.instruction}</div>
                        <div className="confirmation-ticket-meta">
                          Target: {ticket.target?.identifier} • Confidence: {Math.round((ticket.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="confirmation-actions">
                  <button className="btn-secondary" onClick={handleCancelTweaqs}>
                    Cancel
                  </button>
                  <button className="btn-primary" onClick={handleConfirmTweaqs}>
                    Create Tweaqs
                  </button>
                </div>
              </div>
            )}

            {/* Chat Input */}
            {!readyTickets || readyTickets.length === 0 ? (
              <div className="chat-input-wrapper">
                <textarea
                  className="chat-input"
                  placeholder={chatMessages.length === 0 ? 'Describe the change you want to make...' : 'Type your message...'}
                  rows={3}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  disabled={isChatLoading}
                />
                <button 
                  className="chat-send-btn"
                  onClick={handleSendChatMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                >
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163Z"/>
                  </svg>
                </button>
              </div>
            ) : null}
          </div>
        );
      case 'comment':
        // Comment mode shows the same properties panel as Design when an element is selected
        if (selectedElement) {
          const rect = getRect();
          
          return (
            <div className="panel-content">
              {/* Element Header */}
              <div className="element-header-section">
                <div className="element-info">
                  <div className="element-tag">
                    &lt;{selectedElement.tagName}&gt;
                    {selectedElement.id && <span className="element-id">#{selectedElement.id}</span>}
                    {selectedElement.className && (
                      <span className="element-class">.{selectedElement.className.split(' ')[0]}</span>
                    )}
                  </div>
                  {selectedElement.textContent && (
                    <div className="element-text">{selectedElement.textContent}</div>
                  )}
                </div>
              </div>
              
              {/* Comment Panel - TODO: Add comment input and display */}
              <div className="comment-section">
                <h3 className="section-header">Add Comment</h3>
                <textarea
                  className="comment-textarea"
                  placeholder="Add a comment about this element..."
                  rows={4}
                />
                <button className="comment-submit-btn">
                  Submit Comment
                </button>
              </div>
              
              {/* Show element properties below comment input */}
              <div className="properties-section">
                <h3 className="section-header">Element Properties</h3>
                {Object.entries(selectedElement.properties).slice(0, 8).map(([key, value]) => (
                  <div key={key} className="property-row">
                    <span className="property-name">{key}:</span>
                    <span className="property-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return (
          <div className="panel-content">
            <h2>Comments</h2>
            <p>Click on any element on the page to add a comment.</p>
          </div>
        );
      case 'tickets':
        const ticketCount = recordedEdits.length;
        const commentCount = comments.length;
        
        const renderTicketStatus = (edit: RecordedEdit) => {
          const status = edit.status || 'pending';
          
          if (status === 'pending') return null;
          
          if (status === 'processing') {
            return (
              <div className="ticket-status processing">
                <div className="ticket-status-badge">
                  <div className="spinner"></div>
                  Processing
                </div>
                <span className="ticket-status-text">Agent V4 is analyzing and creating PR...</span>
              </div>
            );
          }
          
          if (status === 'completed') {
            return (
              <div className="ticket-status completed">
                <div className="ticket-status-badge">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
                  </svg>
                  Completed
                </div>
                {edit.prUrl && (
                  <a href={edit.prUrl} className="pr-link" target="_blank" rel="noopener noreferrer">
                    View Pull Request
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.75 2a.75.75 0 000 1.5h7.19L1.22 13.22a.75.75 0 101.06 1.06L12 4.56v7.19a.75.75 0 001.5 0v-9a.75.75 0 00-.75-.75h-9z"/>
                    </svg>
                  </a>
                )}
              </div>
            );
          }
          
          if (status === 'failed') {
            return (
              <div className="ticket-status failed">
                <div className="ticket-status-badge">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z"/>
                  </svg>
                  Failed
                </div>
                {edit.error && <p className="ticket-error">{edit.error}</p>}
              </div>
            );
          }
          
          return null;
        };
        
        return (
          <div className="panel-content">
            {/* Comments Conversion Card */}
            {commentCount > 0 && (
              <div className="comments-conversion-card">
                <div className="conversion-header">
                  <div className="conversion-icon">💬</div>
                  <div className="conversion-info">
                    <h4 className="conversion-title">
                      {commentCount} Comment{commentCount !== 1 ? 's' : ''} on Page
                    </h4>
                    <p className="conversion-subtitle">Convert comments into actionable tweaqs</p>
                  </div>
                </div>
                {isConvertingComments ? (
                  <div className="conversion-loading">
                    <div className="spinner"></div>
                    <span>Analyzing comments with AI...</span>
                  </div>
                ) : (
                  <button className="conversion-button" onClick={handleConvertComments}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5z"/>
                    </svg>
                    Create Tweaqs
                  </button>
                )}
              </div>
            )}
            
            {/* Tickets List */}
            {ticketCount === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">⚡</div>
                <h3>No tweaqs yet</h3>
                <p>Edit in Design, add Comments, or Chat to create tweaqs</p>
              </div>
            ) : (
              <div className="tickets-list">
                {recordedEdits.map((edit, index) => {
                  const status = edit.status || 'pending';
                  
                  // Determine the change type
                  const changeTypes = edit.changes.map((c: any) => categorizeChange(c.property));
                  const primaryType = changeTypes[0];
                  const allSameType = changeTypes.every((ct: any) => ct.type === primaryType.type);
                  const displayType = allSameType ? primaryType : { 
                    type: 'Mixed Changes', 
                    icon: '🔄', 
                    color: '#a8edea' 
                  };
                  
                  const summary = generateSummary(edit.changes, edit.elementName);
                  
                  return (
                    <div 
                      key={edit.id} 
                      className={`ticket-card ${status}`}
                      onMouseEnter={() => handleTicketHover(index)}
                      onMouseLeave={handleTicketLeave}
                    >
                      <div className="ticket-card-header">
                        <div 
                          className="ticket-type-badge" 
                          style={{
                            background: `${displayType.color}20`,
                            color: displayType.color,
                            borderColor: `${displayType.color}40`
                          }}
                        >
                          <span className="ticket-badge-icon">{displayType.icon}</span>
                          <span className="ticket-badge-text">{displayType.type}</span>
                        </div>
                        <div className="ticket-actions">
                          {status === 'pending' && (
                            <button 
                              className="ticket-delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTicket(index);
                              }}
                              title="Delete"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="ticket-card-body">
                        <div className="ticket-summary">{summary}</div>
                        
                        <div className="ticket-target">
                          <span className="target-label">TARGET:</span>
                          <code className="target-selector">{edit.elementSelector || edit.elementName}</code>
                        </div>
                        
                        {edit.changes && edit.changes.length > 0 && (
                          <div className="ticket-details">
                            <div className="details-header">PROPERTY CHANGES:</div>
                            <div className="details-list">
                              {edit.changes.map((change: any, i: number) => (
                                <div key={i} className="detail-item">
                                  <div className="detail-property">
                                    {change.property === 'textContent' ? 'TEXT CONTENT' : change.property.toUpperCase()}
                                  </div>
                                  <div className="detail-change">
                                    <span className="detail-before">
                                      {String(change.before).substring(0, 40)}{String(change.before).length > 40 ? '...' : ''}
                                    </span>
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{opacity: 0.5, margin: '0 4px'}}>
                                      <path d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
                                    </svg>
                                    <span className="detail-after">
                                      {String(change.after).substring(0, 40)}{String(change.after).length > 40 ? '...' : ''}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Indicator */}
                      {renderTicketStatus(edit)}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Send to Agent Button */}
            {ticketCount > 0 && (
              <button className="send-tweaqs-button" onClick={handleSendToAgent}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                </svg>
                Send {ticketCount} {ticketCount === 1 ? 'Tweaq' : 'Tweaqs'} to Agent
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div 
        className={`left-panel ${visible ? 'visible' : ''} ${isResizing ? 'resizing' : ''} ${mode === 'design' ? 'no-header' : ''}`}
        style={{ width: `${width}px`, left: '56px' }}
      >
        {mode !== 'design' && (
          <div className="panel-header">
            <h3>{mode.charAt(0).toUpperCase() + mode.slice(1)}</h3>
          </div>
        )}
        {renderPanelContent()}
        
        {/* Command Bar - Design Mode */}
        {mode === 'design' && (
          <div className="panel-command-bar">
            <button 
              className={`command-bar-icon-button ${isSelectModeActive ? 'active' : ''}`}
              onClick={handleToggleSelectMode}
              title={isSelectModeActive ? 'Exit select mode' : 'Enter select mode'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.348 5.706c-.486-1.457.9-2.844 2.358-2.358L18.645 7.66c1.627.543 1.72 2.808.145 3.483l-4.61 1.976 6.35 6.35a.75.75 0 1 1-1.06 1.061l-6.35-6.35-1.977 4.61c-.675 1.576-2.94 1.481-3.482-.145z"/>
              </svg>
            </button>
            <button 
              className={`command-bar-button record ${hasPendingChanges ? 'active' : 'disabled'}`}
              onClick={handleRecordEdit}
              disabled={!hasPendingChanges}
              title={hasPendingChanges ? 'Record this edit' : 'Make changes to record'}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>
              </svg>
              <span>Record</span>
            </button>
          </div>
        )}
      </div>
      
      <div
        className={`panel-resize-handle ${visible ? 'visible' : ''}`}
        style={{ left: `${56 + width}px` }}
        onMouseDown={handleMouseDown}
      >
        <div className="resize-handle-indicator" />
      </div>
    </>
  );
}

