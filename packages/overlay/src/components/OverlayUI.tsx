import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OverlayMode, OverlayState, SelectedElement, ElementInfo, PendingEdit, VisualEdit } from '../types';
import { createOptimizedVisualEdit, generateElementSelector, initializeSession, analyzeEditRelationships } from '../utils/editOptimizer';
import Toolbar from './Toolbar';
// import InfoPanel from './InfoPanel'; // Replaced by Inspector
// import PropertiesPanel from './PropertiesPanel'; // Replaced by EditPanel
import Inspector from './Inspector';
import EditPanel from './EditPanel';
import Ruler from './Ruler';
import AlignmentGuides from './AlignmentGuides';
import ChatPanel from './ChatPanel';


interface OverlayUIProps {
  initialMode?: OverlayMode;
  onClose?: () => void;
}

const OverlayUI: React.FC<OverlayUIProps> = ({ 
  initialMode = 'measure', 
  onClose = () => {} 
}) => {
  const [state, setState] = useState<OverlayState>({
    mode: initialMode,
    selectedElement: null,
    selectedElements: [],
    hoveredElement: null,
    isVisible: true,
    showRuler: false,
    showAlignmentGuides: true,
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  const [pendingEdits, setPendingEdits] = useState<Map<string, PendingEdit>>(new Map());
  const [visualEdits, setVisualEdits] = useState<VisualEdit[]>([]);
  
  // Chat panel state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Get element information
  const getElementInfo = useCallback((element: HTMLElement): ElementInfo => {
    const rect = element.getBoundingClientRect();
    const computedStyles = window.getComputedStyle(element);
    const attributes: Record<string, string> = {};
    
    // Get all attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr) {
        attributes[attr.name] = attr.value;
      }
    }

    // Get key computed styles
    const styleProps = [
      'display', 'position', 'color', 'backgroundColor', 'fontSize', 
      'fontFamily', 'fontWeight', 'textAlign', 'padding', 'margin', 
      'border', 'borderRadius', 'width', 'height'
    ];
    
    const computedStylesObj: Record<string, string> = {};
    styleProps.forEach(prop => {
      computedStylesObj[prop] = computedStyles.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
    });

    return {
      tagName: element.tagName,
      id: element.id || undefined,
      className: element.className || undefined,
      textContent: element.textContent || undefined,
      attributes,
      computedStyles: computedStylesObj,
      dimensions: {
        width: rect.width,
        height: rect.height,
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      },
    };
  }, []);

  // Create or update element outline
  const updateOutline = useCallback((element: HTMLElement | null) => {
    if (!outlineRef.current) return;

    if (!element) {
      outlineRef.current.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    const outline = outlineRef.current;
    
    outline.style.display = 'block';
    outline.style.left = `${rect.left + window.scrollX}px`;
    outline.style.top = `${rect.top + window.scrollY}px`;
    outline.style.width = `${rect.width}px`;
    outline.style.height = `${rect.height}px`;
  }, []);

  // Handle mouse move for hover effects
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!state.isVisible) return;

    const target = e.target as HTMLElement;
    
    // Don't highlight overlay elements
    if (target.closest('.tweaq-overlay-toolbar') || 
        target.closest('.tweaq-overlay-panel') ||
        target.closest('.tweaq-element-outline')) {
      return;
    }

    setState(prev => ({ ...prev, hoveredElement: target }));
    
    // Only show outline for hovered element if no element is selected
    if (!state.selectedElement) {
      updateOutline(target);
    }
  }, [state.isVisible, state.selectedElement, updateOutline]);

  // Handle click for element selection
  const handleClick = useCallback((e: MouseEvent) => {
    if (!state.isVisible) return;

    const target = e.target as HTMLElement;
    
    // Don't select overlay elements
    if (target.closest('.tweaq-overlay-toolbar') || 
        target.closest('.tweaq-overlay-panel') ||
        target.closest('.tweaq-element-outline')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const elementInfo = getElementInfo(target);
    const selectedElement: SelectedElement = {
      element: target,
      info: elementInfo,
    };

    // Check for modifier key (Cmd/Ctrl) for multi-selection in measure mode
    const isMultiSelect = (e.metaKey || e.ctrlKey) && state.mode === 'measure';

    if (isMultiSelect) {
      setState(prev => {
        const newSelectedElements = [...prev.selectedElements];
        
        // Check if element is already selected
        const existingIndex = newSelectedElements.findIndex(sel => sel.element === target);
        
        if (existingIndex >= 0) {
          // Remove if already selected
          newSelectedElements.splice(existingIndex, 1);
        } else {
          // Add to selection (max 2 for ruler tool)
          newSelectedElements.push(selectedElement);
          if (newSelectedElements.length > 2) {
            newSelectedElements.shift(); // Remove first element
          }
        }

        return {
          ...prev,
          selectedElements: newSelectedElements,
          selectedElement: newSelectedElements.length === 1 ? newSelectedElements[0] || null : null,
          showRuler: newSelectedElements.length === 2,
          hoveredElement: null
        };
      });
    } else {
      setState(prev => ({ 
        ...prev, 
        selectedElement: selectedElement,
        selectedElements: [selectedElement],
        showRuler: false,
        hoveredElement: null 
      }));
    }
    
    updateOutline(target);
  }, [state.isVisible, state.mode, getElementInfo, updateOutline]);

  // Handle escape key to cancel selection
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setState(prev => ({ 
        ...prev, 
        selectedElement: null,
        selectedElements: [],
        showRuler: false,
        hoveredElement: null 
      }));
      updateOutline(null);
    }
  }, [updateOutline]);

  // Handle mode toggle
  const handleModeToggle = useCallback((mode: OverlayMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  // Handle property changes in edit mode with live preview
  const handlePropertyChange = useCallback((property: string, value: string, originalValue?: string) => {
    if (!state.selectedElement) return;

    const { element } = state.selectedElement;
    
    // Apply the change immediately for live preview
    if (property.startsWith('style.')) {
      const styleProp = property.replace('style.', '');
      (element.style as any)[styleProp] = value;
    } else if (property.startsWith('attribute.')) {
      const attrName = property.replace('attribute.', '');
      element.setAttribute(attrName, value);
    } else if (property === 'textContent') {
      element.textContent = value;
    } else {
      // Handle CSS properties directly
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      element.style.setProperty(cssProperty, value);
    }

    // Track the pending edit
    if (originalValue !== undefined) {
      setPendingEdits(prev => {
        const newMap = new Map(prev);
        newMap.set(property, {
          property,
          after: value,
          before: originalValue,
        });
        return newMap;
      });
    }

    // Update the selected element info
    const updatedInfo = getElementInfo(element);
    setState(prev => ({
      ...prev,
      selectedElement: prev.selectedElement ? {
        ...prev.selectedElement,
        info: updatedInfo,
      } : null,
    }));
  }, [state.selectedElement, getElementInfo]);

  // Initialize session on first load
  useEffect(() => {
    initializeSession();
  }, []);

  // Record the current edits as an optimized VisualEdit
  const handleRecordEdit = useCallback(() => {
    if (!state.selectedElement || pendingEdits.size === 0) return;

    const { element } = state.selectedElement;
    const selector = generateElementSelector(element);
    
    // Create optimized visual edit with enhanced context
    const visualEdit = createOptimizedVisualEdit(element, pendingEdits, selector);

    setVisualEdits(prev => {
      const newEdits = [...prev, visualEdit];
      // Analyze relationships between edits
      return analyzeEditRelationships(newEdits);
    });
    
    setPendingEdits(new Map()); // Clear pending edits

    console.log('📝 Recorded Optimized VisualEdit:', visualEdit);
    
    // TODO: Send to backend or store in localStorage
    // localStorage.setItem('tweaq-visual-edits', JSON.stringify(newEdits));
  }, [state.selectedElement, pendingEdits, visualEdits]);

  // Reset all pending changes
  const handleResetChanges = useCallback(() => {
    if (!state.selectedElement) return;

    const { element } = state.selectedElement;
    
    // Revert all pending changes
    pendingEdits.forEach(edit => {
      if (edit.property.startsWith('style.')) {
        const styleProp = edit.property.replace('style.', '');
        if (edit.before) {
          (element.style as any)[styleProp] = edit.before;
        } else {
          element.style.removeProperty(styleProp.replace(/([A-Z])/g, '-$1').toLowerCase());
        }
      } else if (edit.property.startsWith('attribute.')) {
        const attrName = edit.property.replace('attribute.', '');
        if (edit.before) {
          element.setAttribute(attrName, edit.before);
        } else {
          element.removeAttribute(attrName);
        }
      } else if (edit.property === 'textContent') {
        element.textContent = edit.before;
      } else {
        // Handle CSS properties directly
        const cssProperty = edit.property.replace(/([A-Z])/g, '-$1').toLowerCase();
        if (edit.before) {
          element.style.setProperty(cssProperty, edit.before);
        } else {
          element.style.removeProperty(cssProperty);
        }
      }
    });

    setPendingEdits(new Map());

    // Update the selected element info
    const updatedInfo = getElementInfo(element);
    setState(prev => ({
      ...prev,
      selectedElement: prev.selectedElement ? {
        ...prev.selectedElement,
        info: updatedInfo,
      } : null,
    }));
  }, [state.selectedElement, pendingEdits, getElementInfo]);

  // Chat handlers
  const handleChatToggle = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const handleTweaqsCreated = useCallback((tweaqs: any[]) => {
    console.log('✅ Tweaqs created from chat:', tweaqs);
    // Tweaqs are automatically applied via the browser overlay
    // Just close the chat panel
    setIsChatOpen(false);
  }, []);

  // Comment submission is now handled directly in browser-interaction.js
  // The comment pill appears on the webpage itself, not in the React overlay

  // Submit visual edits
  const handleSubmit = useCallback(async () => {
    if (visualEdits.length === 0) {
      console.warn('No changes to submit');
      return;
    }

    console.log('🚀 Submitting visual edits...');
    console.log('Visual edits:', visualEdits);

    try {
      // Check if electronAPI is available
      if (!(window as any).electronAPI?.processCombinedEdits) {
        console.error('❌ electronAPI.processCombinedEdits not available');
        alert('Error: Combined editing API not available. Please make sure the app is running in Electron.');
        return;
      }

      const request = {
        visualEdits,
        naturalLanguageEdits: [], // Chat creates tweaqs directly, doesn't go through this flow
        metadata: {
          sessionId: `session_${Date.now()}`,
          submittedAt: Date.now(),
          context: 'Overlay UI visual edits'
        }
      };

      const result = await (window as any).electronAPI.processCombinedEdits(request);

      if (result.success) {
        console.log('✅ Visual edits submitted successfully!');
        alert(`✅ Success! PR created:\n${result.pr?.url || 'Check your repository'}\n\n${result.summary || ''}`);
        
        // Clear all edits after successful submission
        setVisualEdits([]);
        setPendingEdits(new Map());
      } else {
        console.error('❌ Submission failed:', result.error);
        alert(`❌ Error: ${result.error || 'Failed to submit changes'}`);
      }
    } catch (error) {
      console.error('❌ Error submitting visual edits:', error);
      alert(`❌ Error: ${error instanceof Error ? error.message : 'Failed to submit changes'}`);
    }
  }, [visualEdits]);

  // Handle panel close
  const handlePanelClose = useCallback(() => {
    // Reset any pending changes before closing
    if (pendingEdits.size > 0) {
      handleResetChanges();
    }
    
    setState(prev => ({ 
      ...prev, 
      selectedElement: null,
      selectedElements: [],
      showRuler: false,
      hoveredElement: null 
    }));
    updateOutline(null);
  }, [updateOutline, pendingEdits.size, handleResetChanges]);

  // Handle ruler close
  const handleRulerClose = useCallback(() => {
    setState(prev => ({
      ...prev,
      showRuler: false,
      selectedElements: prev.selectedElements.slice(0, 1), // Keep only first element
      selectedElement: prev.selectedElements[0] || null,
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!state.isVisible) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isVisible, handleMouseMove, handleClick, handleKeyDown]);

  // Update outline when selected element changes
  useEffect(() => {
    if (state.selectedElement) {
      updateOutline(state.selectedElement.element);
    } else if (state.hoveredElement) {
      updateOutline(state.hoveredElement);
    } else {
      updateOutline(null);
    }
  }, [state.selectedElement, state.hoveredElement, updateOutline]);

  if (!state.isVisible) return null;

  return (
    <>
      {/* Element outline */}
      <div 
        ref={outlineRef}
        className="tweaq-element-outline"
        style={{ display: 'none' }}
      />

      {/* Main overlay container */}
      <div ref={overlayRef} className="tweaq-overlay-container">
        {/* Toolbar */}
        <Toolbar
          mode={state.mode}
          onModeToggle={handleModeToggle}
          onClose={onClose}
          onChatToggle={handleChatToggle}
          onSubmit={handleSubmit}
          isChatOpen={isChatOpen}
          visualEditCount={visualEdits.length}
          instructionCount={0}
        />

        {/* Chat Panel */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          {...(state.selectedElement && {
            selectedElement: {
              selector: generateElementSelector(state.selectedElement.element),
              tagName: state.selectedElement.element.tagName.toLowerCase(),
              className: state.selectedElement.element.className
            }
          })}
          onTweaqsCreated={handleTweaqsCreated}
        />

        {/* Panels */}
        {state.selectedElement && (
          <>
            {state.mode === 'measure' && (
              <Inspector
                elementInfo={state.selectedElement.info}
                onClose={handlePanelClose}
              />
            )}
            {state.mode === 'edit' && (
              <EditPanel
                elementInfo={state.selectedElement.info}
                selectedElement={state.selectedElement.element}
                pendingEdits={pendingEdits}
                onPropertyChange={handlePropertyChange}
                onRecordEdit={handleRecordEdit}
                onResetChanges={handleResetChanges}
                onClose={handlePanelClose}
                elementSelector={generateElementSelector(state.selectedElement.element)}
              />
            )}
          </>
        )}

        {/* Ruler Tool */}
        {state.showRuler && state.selectedElements.length === 2 && state.selectedElements[0] && state.selectedElements[1] && (
          <Ruler
            element1={state.selectedElements[0].element}
            element2={state.selectedElements[1].element}
            onClose={handleRulerClose}
          />
        )}

        {/* Alignment Guides */}
        {state.showAlignmentGuides && state.mode === 'measure' && (
          <AlignmentGuides
            selectedElement={state.selectedElement?.element || null}
            hoveredElement={state.hoveredElement}
          />
        )}

        {/* Comment Pill is now rendered directly on the webpage via browser-interaction.js */}
      </div>
    </>
  );
};

export default OverlayUI;
