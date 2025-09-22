import React, { useEffect, useState, useRef } from 'react';

interface AlignmentGuidesProps {
  selectedElement: HTMLElement | null;
  hoveredElement: HTMLElement | null;
}

interface Guide {
  type: 'horizontal' | 'vertical';
  position: number;
  elements: HTMLElement[];
}

interface ElementBounds {
  element: HTMLElement;
  top: number;
  left: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ selectedElement, hoveredElement }) => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [allElements, setAllElements] = useState<ElementBounds[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const ALIGNMENT_THRESHOLD = 3; // pixels

  const getElementBounds = (element: HTMLElement): ElementBounds => {
    const rect = element.getBoundingClientRect();
    return {
      element,
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      centerX: rect.left + window.scrollX + rect.width / 2,
      centerY: rect.top + window.scrollY + rect.height / 2,
    };
  };

  const getAllVisibleElements = (): ElementBounds[] => {
    const elements: ElementBounds[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const element = node as HTMLElement;
          
          // Skip overlay elements
          if (element.closest('.tweaq-overlay-container') ||
              element.closest('.tweaq-element-outline') ||
              element.classList.contains('tweaq-ruler-overlay')) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip hidden elements
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || 
              style.visibility === 'hidden' || 
              style.opacity === '0') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip very small elements
          const rect = element.getBoundingClientRect();
          if (rect.width < 10 || rect.height < 10) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    let node;
    while (node = walker.nextNode()) {
      const element = node as HTMLElement;
      elements.push(getElementBounds(element));
    }

    return elements;
  };

  const findAlignmentGuides = (targetElement: HTMLElement): Guide[] => {
    if (!targetElement) return [];

    const targetBounds = getElementBounds(targetElement);
    const guides: Guide[] = [];
    const horizontalAlignments: Map<number, HTMLElement[]> = new Map();
    const verticalAlignments: Map<number, HTMLElement[]> = new Map();

    allElements.forEach(bounds => {
      if (bounds.element === targetElement) return;

      // Check horizontal alignments (tops, centers, bottoms)
      const horizontalPositions = [
        { pos: bounds.top, type: 'top' },
        { pos: bounds.centerY, type: 'centerY' },
        { pos: bounds.bottom, type: 'bottom' }
      ];

      horizontalPositions.forEach(({ pos }) => {
        const targetPositions = [targetBounds.top, targetBounds.centerY, targetBounds.bottom];
        
        targetPositions.forEach(targetPos => {
          if (Math.abs(pos - targetPos) <= ALIGNMENT_THRESHOLD) {
            const alignmentPos = Math.round((pos + targetPos) / 2);
            if (!horizontalAlignments.has(alignmentPos)) {
              horizontalAlignments.set(alignmentPos, []);
            }
            horizontalAlignments.get(alignmentPos)!.push(bounds.element);
          }
        });
      });

      // Check vertical alignments (lefts, centers, rights)
      const verticalPositions = [
        { pos: bounds.left, type: 'left' },
        { pos: bounds.centerX, type: 'centerX' },
        { pos: bounds.right, type: 'right' }
      ];

      verticalPositions.forEach(({ pos }) => {
        const targetPositions = [targetBounds.left, targetBounds.centerX, targetBounds.right];
        
        targetPositions.forEach(targetPos => {
          if (Math.abs(pos - targetPos) <= ALIGNMENT_THRESHOLD) {
            const alignmentPos = Math.round((pos + targetPos) / 2);
            if (!verticalAlignments.has(alignmentPos)) {
              verticalAlignments.set(alignmentPos, []);
            }
            verticalAlignments.get(alignmentPos)!.push(bounds.element);
          }
        });
      });
    });

    // Create guides for alignments with multiple elements
    horizontalAlignments.forEach((elements, position) => {
      if (elements.length > 0) {
        guides.push({
          type: 'horizontal',
          position,
          elements: [...elements, targetElement]
        });
      }
    });

    verticalAlignments.forEach((elements, position) => {
      if (elements.length > 0) {
        guides.push({
          type: 'vertical',
          position,
          elements: [...elements, targetElement]
        });
      }
    });

    return guides;
  };

  const updateGuides = () => {
    const elements = getAllVisibleElements();
    setAllElements(elements);

    const activeElement = hoveredElement || selectedElement;
    if (activeElement) {
      const newGuides = findAlignmentGuides(activeElement);
      setGuides(newGuides);
    } else {
      setGuides([]);
    }
  };

  useEffect(() => {
    updateGuides();

    const handleUpdate = () => updateGuides();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    // Throttle updates for better performance
    let timeout: number;
    const throttledUpdate = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleUpdate, 16); // ~60fps
    };

    window.addEventListener('scroll', throttledUpdate);
    window.addEventListener('resize', throttledUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', throttledUpdate);
      window.removeEventListener('resize', throttledUpdate);
      clearTimeout(timeout);
    };
  }, [selectedElement, hoveredElement]);

  if (guides.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="tweaq-alignment-guides"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: document.body.scrollHeight,
        pointerEvents: 'none',
        zIndex: 999997,
      }}
    >
      {guides.map((guide, index) => {
        if (guide.type === 'horizontal') {
          // Find the leftmost and rightmost bounds of aligned elements
          let minLeft = Infinity;
          let maxRight = -Infinity;

          guide.elements.forEach(element => {
            const bounds = getElementBounds(element);
            minLeft = Math.min(minLeft, bounds.left);
            maxRight = Math.max(maxRight, bounds.right);
          });

          // Extend the guide line beyond the elements
          const padding = 20;
          const startX = Math.max(0, minLeft - padding);
          const endX = Math.min(document.body.scrollWidth, maxRight + padding);

          return (
            <g key={`h-${index}`}>
              <line
                x1={startX}
                y1={guide.position}
                x2={endX}
                y2={guide.position}
                stroke="#ff6b6b"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.8"
              />
              {/* Small indicators at element positions */}
              {guide.elements.map((element, elemIndex) => {
                const bounds = getElementBounds(element);
                return (
                  <circle
                    key={elemIndex}
                    cx={bounds.centerX}
                    cy={guide.position}
                    r="2"
                    fill="#ff6b6b"
                    opacity="0.8"
                  />
                );
              })}
            </g>
          );
        } else {
          // Vertical guide
          let minTop = Infinity;
          let maxBottom = -Infinity;

          guide.elements.forEach(element => {
            const bounds = getElementBounds(element);
            minTop = Math.min(minTop, bounds.top);
            maxBottom = Math.max(maxBottom, bounds.bottom);
          });

          // Extend the guide line beyond the elements
          const padding = 20;
          const startY = Math.max(0, minTop - padding);
          const endY = Math.min(document.body.scrollHeight, maxBottom + padding);

          return (
            <g key={`v-${index}`}>
              <line
                x1={guide.position}
                y1={startY}
                x2={guide.position}
                y2={endY}
                stroke="#ff6b6b"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.8"
              />
              {/* Small indicators at element positions */}
              {guide.elements.map((element, elemIndex) => {
                const bounds = getElementBounds(element);
                return (
                  <circle
                    key={elemIndex}
                    cx={guide.position}
                    cy={bounds.centerY}
                    r="2"
                    fill="#ff6b6b"
                    opacity="0.8"
                  />
                );
              })}
            </g>
          );
        }
      })}
    </svg>
  );
};

export default AlignmentGuides;
