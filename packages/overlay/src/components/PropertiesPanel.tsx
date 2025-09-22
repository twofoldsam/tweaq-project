import React, { useState } from 'react';
import { PropertiesPanelProps } from '../types';

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  elementInfo, 
  onPropertyChange, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'attributes' | 'content'>('styles');
  const { textContent, attributes, computedStyles } = elementInfo;

  // Common editable CSS properties
  const editableStyles = [
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background', type: 'color' },
    { key: 'fontSize', label: 'Font Size', type: 'text' },
    { key: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
    { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
    { key: 'display', label: 'Display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
    { key: 'padding', label: 'Padding', type: 'text' },
    { key: 'margin', label: 'Margin', type: 'text' },
    { key: 'border', label: 'Border', type: 'text' },
    { key: 'borderRadius', label: 'Border Radius', type: 'text' },
  ];

  const handleStyleChange = (property: string, value: string) => {
    onPropertyChange(`style.${property}`, value);
  };

  const handleAttributeChange = (attribute: string, value: string) => {
    onPropertyChange(`attribute.${attribute}`, value);
  };

  const handleContentChange = (value: string) => {
    onPropertyChange('textContent', value);
  };

  const renderStyleEditor = (style: typeof editableStyles[0]) => {
    const currentValue = computedStyles[style.key] || '';

    switch (style.type) {
      case 'color':
        return (
          <input
            type="color"
            value={currentValue.startsWith('#') ? currentValue : '#000000'}
            onChange={(e) => handleStyleChange(style.key, e.target.value)}
            className="tweaq-color-input"
          />
        );
      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => handleStyleChange(style.key, e.target.value)}
            className="tweaq-select-input"
          >
            <option value="">Default</option>
            {style.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleStyleChange(style.key, e.target.value)}
            placeholder="Enter value"
            className="tweaq-text-input"
          />
        );
    }
  };

  return (
    <div className="tweaq-overlay-panel tweaq-properties-panel">
      <div className="tweaq-panel-header">
        <h3 className="tweaq-panel-title">Properties</h3>
        <button className="tweaq-panel-close" onClick={onClose} title="Close panel">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      </div>

      <div className="tweaq-panel-tabs">
        <button
          className={`tweaq-tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
        <button
          className={`tweaq-tab ${activeTab === 'attributes' ? 'active' : ''}`}
          onClick={() => setActiveTab('attributes')}
        >
          Attributes
        </button>
        <button
          className={`tweaq-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content
        </button>
      </div>
      
      <div className="tweaq-panel-content">
        {activeTab === 'styles' && (
          <div className="tweaq-styles-editor">
            {editableStyles.map(style => (
              <div key={style.key} className="tweaq-property-row">
                <label className="tweaq-property-label">{style.label}</label>
                <div className="tweaq-property-input">
                  {renderStyleEditor(style)}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'attributes' && (
          <div className="tweaq-attributes-editor">
            {Object.entries(attributes).map(([key, value]) => (
              <div key={key} className="tweaq-property-row">
                <label className="tweaq-property-label">{key}</label>
                <div className="tweaq-property-input">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleAttributeChange(key, e.target.value)}
                    className="tweaq-text-input"
                  />
                </div>
              </div>
            ))}
            <div className="tweaq-add-attribute">
              <button 
                className="tweaq-add-btn"
                onClick={() => {
                  const name = prompt('Attribute name:');
                  if (name) {
                    handleAttributeChange(name, '');
                  }
                }}
              >
                + Add Attribute
              </button>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="tweaq-content-editor">
            <div className="tweaq-property-row">
              <label className="tweaq-property-label">Text Content</label>
              <div className="tweaq-property-input">
                <textarea
                  value={textContent || ''}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Enter text content"
                  className="tweaq-textarea-input"
                  rows={4}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
