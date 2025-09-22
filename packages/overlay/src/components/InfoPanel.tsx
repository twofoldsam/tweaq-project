import React from 'react';
import { InfoPanelProps } from '../types';

const InfoPanel: React.FC<InfoPanelProps> = ({ elementInfo, onClose }) => {
  const { tagName, id, className, textContent, attributes, computedStyles, dimensions } = elementInfo;

  const formatValue = (value: string | number): string => {
    if (typeof value === 'number') {
      return Math.round(value * 100) / 100 + 'px';
    }
    return value || '—';
  };

  return (
    <div className="tweaq-overlay-panel tweaq-info-panel">
      <div className="tweaq-panel-header">
        <h3 className="tweaq-panel-title">Element Info</h3>
        <button className="tweaq-panel-close" onClick={onClose} title="Close panel">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      </div>
      
      <div className="tweaq-panel-content">
        <div className="tweaq-info-section">
          <h4 className="tweaq-section-title">Element</h4>
          <div className="tweaq-info-row">
            <span className="tweaq-info-label">Tag:</span>
            <span className="tweaq-info-value tweaq-tag">&lt;{tagName.toLowerCase()}&gt;</span>
          </div>
          {id && (
            <div className="tweaq-info-row">
              <span className="tweaq-info-label">ID:</span>
              <span className="tweaq-info-value tweaq-id">#{id}</span>
            </div>
          )}
          {className && (
            <div className="tweaq-info-row">
              <span className="tweaq-info-label">Class:</span>
              <span className="tweaq-info-value tweaq-class">.{className.split(' ').join(' .')}</span>
            </div>
          )}
        </div>

        <div className="tweaq-info-section">
          <h4 className="tweaq-section-title">Dimensions</h4>
          <div className="tweaq-info-row">
            <span className="tweaq-info-label">Size:</span>
            <span className="tweaq-info-value">{formatValue(dimensions.width)} × {formatValue(dimensions.height)}</span>
          </div>
          <div className="tweaq-info-row">
            <span className="tweaq-info-label">Position:</span>
            <span className="tweaq-info-value">{formatValue(dimensions.x)}, {formatValue(dimensions.y)}</span>
          </div>
        </div>

        <div className="tweaq-info-section">
          <h4 className="tweaq-section-title">Key Styles</h4>
          {['display', 'position', 'color', 'backgroundColor', 'fontSize', 'fontFamily'].map(prop => {
            const value = computedStyles[prop];
            if (!value || value === 'none' || value === 'auto') return null;
            return (
              <div key={prop} className="tweaq-info-row">
                <span className="tweaq-info-label">{prop.replace(/([A-Z])/g, '-$1').toLowerCase()}:</span>
                <span className="tweaq-info-value">{value}</span>
              </div>
            );
          })}
        </div>

        {textContent && textContent.trim() && (
          <div className="tweaq-info-section">
            <h4 className="tweaq-section-title">Content</h4>
            <div className="tweaq-text-content">
              {textContent.trim().length > 100 
                ? textContent.trim().substring(0, 100) + '...'
                : textContent.trim()
              }
            </div>
          </div>
        )}

        {Object.keys(attributes).length > 0 && (
          <div className="tweaq-info-section">
            <h4 className="tweaq-section-title">Attributes</h4>
            {Object.entries(attributes).slice(0, 5).map(([key, value]) => (
              <div key={key} className="tweaq-info-row">
                <span className="tweaq-info-label">{key}:</span>
                <span className="tweaq-info-value">
                  {value.length > 30 ? value.substring(0, 30) + '...' : value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoPanel;
