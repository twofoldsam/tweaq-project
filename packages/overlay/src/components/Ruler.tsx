import React, { useEffect, useState, useRef } from 'react';

interface RulerProps {
  element1: HTMLElement;
  element2: HTMLElement;
  onClose: () => void;
}

interface Distance {
  horizontal: number;
  vertical: number;
  diagonal: number;
}

interface ElementRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

const Ruler: React.FC<RulerProps> = ({ element1, element2, onClose }) => {
  const [distance, setDistance] = useState<Distance>({ horizontal: 0, vertical: 0, diagonal: 0 });
  const [rect1, setRect1] = useState<ElementRect | null>(null);
  const [rect2, setRect2] = useState<ElementRect | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const getElementRect = (element: HTMLElement): ElementRect => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + window.scrollX + rect.width / 2,
      centerY: rect.top + window.scrollY + rect.height / 2,
    };
  };

  const calculateDistance = (r1: ElementRect, r2: ElementRect): Distance => {
    // Calculate the closest distance between the edges of two rectangles
    let horizontal = 0;
    let vertical = 0;

    // Horizontal distance
    if (r1.right < r2.left) {
      // element1 is to the left of element2
      horizontal = r2.left - r1.right;
    } else if (r2.right < r1.left) {
      // element2 is to the left of element1
      horizontal = r1.left - r2.right;
    } else {
      // Elements overlap horizontally
      horizontal = 0;
    }

    // Vertical distance
    if (r1.bottom < r2.top) {
      // element1 is above element2
      vertical = r2.top - r1.bottom;
    } else if (r2.bottom < r1.top) {
      // element2 is above element1
      vertical = r1.top - r2.bottom;
    } else {
      // Elements overlap vertically
      vertical = 0;
    }

    // Diagonal distance (center to center)
    const diagonal = Math.sqrt(
      Math.pow(r2.centerX - r1.centerX, 2) + Math.pow(r2.centerY - r1.centerY, 2)
    );

    return {
      horizontal: Math.round(horizontal),
      vertical: Math.round(vertical),
      diagonal: Math.round(diagonal),
    };
  };

  const updateMeasurements = () => {
    const r1 = getElementRect(element1);
    const r2 = getElementRect(element2);
    const dist = calculateDistance(r1, r2);
    
    setRect1(r1);
    setRect2(r2);
    setDistance(dist);
  };

  useEffect(() => {
    updateMeasurements();

    // Update measurements on scroll and resize
    const handleUpdate = () => updateMeasurements();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [element1, element2]);

  if (!rect1 || !rect2) return null;

  // Calculate line positions for drawing
  const getConnectionPoints = () => {
    // Find the closest edges for horizontal and vertical measurements
    let startX, startY, endX, endY;
    let hStartX, hStartY, hEndX, hEndY;
    let vStartX, vStartY, vEndX, vEndY;

    // Horizontal measurement line
    if (rect1.right < rect2.left) {
      // element1 left of element2
      hStartX = rect1.right;
      hEndX = rect2.left;
      hStartY = hEndY = (Math.max(rect1.top, rect2.top) + Math.min(rect1.bottom, rect2.bottom)) / 2;
    } else if (rect2.right < rect1.left) {
      // element2 left of element1
      hStartX = rect2.right;
      hEndX = rect1.left;
      hStartY = hEndY = (Math.max(rect1.top, rect2.top) + Math.min(rect1.bottom, rect2.bottom)) / 2;
    }

    // Vertical measurement line
    if (rect1.bottom < rect2.top) {
      // element1 above element2
      vStartY = rect1.bottom;
      vEndY = rect2.top;
      vStartX = vEndX = (Math.max(rect1.left, rect2.left) + Math.min(rect1.right, rect2.right)) / 2;
    } else if (rect2.bottom < rect1.top) {
      // element2 above element1
      vStartY = rect2.bottom;
      vEndY = rect1.top;
      vStartX = vEndX = (Math.max(rect1.left, rect2.left) + Math.min(rect1.right, rect2.right)) / 2;
    }

    // Center-to-center diagonal line
    startX = rect1.centerX;
    startY = rect1.centerY;
    endX = rect2.centerX;
    endY = rect2.centerY;

    return {
      diagonal: { startX, startY, endX, endY },
      horizontal: hStartX !== undefined ? { startX: hStartX, startY: hStartY, endX: hEndX, endY: hEndY } : null,
      vertical: vStartX !== undefined ? { startX: vStartX, startY: vStartY, endX: vEndX, endY: vEndY } : null,
    };
  };

  const connections = getConnectionPoints();

  return (
    <>
      {/* SVG overlay for drawing measurement lines */}
      <svg
        ref={svgRef}
        className="tweaq-ruler-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 999998,
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#ff6b6b"
            />
          </marker>
        </defs>

        {/* Diagonal line (center to center) */}
        <line
          x1={connections.diagonal.startX}
          y1={connections.diagonal.startY}
          x2={connections.diagonal.endX}
          y2={connections.diagonal.endY}
          stroke="#ff6b6b"
          strokeWidth="2"
          strokeDasharray="5,5"
          markerEnd="url(#arrowhead)"
        />

        {/* Horizontal measurement line */}
        {connections.horizontal && distance.horizontal > 0 && (
          <>
            <line
              x1={connections.horizontal.startX}
              y1={connections.horizontal.startY}
              x2={connections.horizontal.endX}
              y2={connections.horizontal.endY}
              stroke="#007acc"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <text
              x={(connections.horizontal.startX! + connections.horizontal.endX!) / 2}
              y={connections.horizontal.startY! - 10}
              fill="#007acc"
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              className="tweaq-ruler-label"
            >
              {distance.horizontal}px
            </text>
          </>
        )}

        {/* Vertical measurement line */}
        {connections.vertical && distance.vertical > 0 && (
          <>
            <line
              x1={connections.vertical.startX}
              y1={connections.vertical.startY}
              x2={connections.vertical.endX}
              y2={connections.vertical.endY}
              stroke="#007acc"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
            <text
              x={connections.vertical.startX! + 15}
              y={(connections.vertical.startY! + connections.vertical.endY!) / 2}
              fill="#007acc"
              fontSize="12"
              fontWeight="600"
              textAnchor="start"
              className="tweaq-ruler-label"
            >
              {distance.vertical}px
            </text>
          </>
        )}

        {/* Center distance label */}
        <circle
          cx={connections.diagonal.endX}
          cy={connections.diagonal.endY}
          r="4"
          fill="#ff6b6b"
        />
        <text
          x={connections.diagonal.endX + 10}
          y={connections.diagonal.endY - 10}
          fill="#ff6b6b"
          fontSize="12"
          fontWeight="600"
          textAnchor="start"
          className="tweaq-ruler-label"
        >
          {distance.diagonal}px
        </text>
      </svg>

      {/* Measurement panel */}
      <div className="tweaq-overlay-panel tweaq-ruler-panel">
        <div className="tweaq-panel-header">
          <h3 className="tweaq-panel-title">Ruler</h3>
          <button className="tweaq-panel-close" onClick={onClose} title="Close ruler">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
            </svg>
          </button>
        </div>
        
        <div className="tweaq-panel-content">
          <div className="tweaq-ruler-measurements">
            <div className="tweaq-measurement-item">
              <div className="tweaq-measurement-label">
                <span className="tweaq-measurement-color" style={{ backgroundColor: '#007acc' }}></span>
                Horizontal Distance
              </div>
              <div className="tweaq-measurement-value">{distance.horizontal}px</div>
            </div>
            
            <div className="tweaq-measurement-item">
              <div className="tweaq-measurement-label">
                <span className="tweaq-measurement-color" style={{ backgroundColor: '#007acc' }}></span>
                Vertical Distance
              </div>
              <div className="tweaq-measurement-value">{distance.vertical}px</div>
            </div>
            
            <div className="tweaq-measurement-item">
              <div className="tweaq-measurement-label">
                <span className="tweaq-measurement-color" style={{ backgroundColor: '#ff6b6b' }}></span>
                Center Distance
              </div>
              <div className="tweaq-measurement-value">{distance.diagonal}px</div>
            </div>
          </div>
          
          <div className="tweaq-ruler-instructions">
            <p>📐 Measuring distance between two elements</p>
            <p>Click elsewhere to select different elements</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Ruler;
