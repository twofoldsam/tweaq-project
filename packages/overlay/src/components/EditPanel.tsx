import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { EditPanelProps, PropertyGroup, PropertyControl, PreviewState, PreviewSource, ViewMode, AdapterPreview } from '../types';
import PreviewControls from './PreviewControls';
import { createAdapterPreview, generateAdapterCSS, injectAdapterCSS, removeAdapterCSS } from '../utils/cssAdapter';

const EditPanel: React.FC<EditPanelProps> = ({
  selectedElement,
  pendingEdits,
  onPropertyChange,
  onRecordEdit,
  onResetChanges,
  onClose,
  elementSelector,
}) => {
  // Preview state management
  const [previewState, setPreviewState] = useState<PreviewState>({
    source: 'inline',
    viewMode: 'after',
    splitPosition: 50,
  });
  
  const [adapterPreview, setAdapterPreview] = useState<AdapterPreview | null>(null);
  const [originalStyles, setOriginalStyles] = useState<Map<string, string>>(new Map());
  const getCurrentValue = (property: string): string => {
    if (pendingEdits.has(property)) {
      return pendingEdits.get(property)!.after;
    }
    const computedStyle = getComputedStyle(selectedElement);
    return computedStyle[property as any] || '';
  };

  // Get element info for display
  const elementInfo = useMemo(() => {
    return {
      tagName: selectedElement.tagName,
      id: selectedElement.id || undefined,
      className: selectedElement.className || undefined,
      textContent: selectedElement.textContent,
    };
  }, [selectedElement]);

  const propertyGroups: PropertyGroup[] = useMemo(() => [
    {
      id: 'typography',
      title: 'Typography',
      properties: [
        {
          key: 'fontSize',
          label: 'Size',
          type: 'number',
          unit: 'px',
          min: 8,
          max: 200,
        },
        {
          key: 'fontWeight',
          label: 'Weight',
          type: 'select',
          options: [
            { value: '100', label: '100' },
            { value: '200', label: '200' },
            { value: '300', label: '300' },
            { value: '400', label: '400' },
            { value: '500', label: '500' },
            { value: '600', label: '600' },
            { value: '700', label: '700' },
            { value: '800', label: '800' },
            { value: '900', label: '900' },
          ],
        },
        {
          key: 'color',
          label: 'Color',
          type: 'color',
        },
        {
          key: 'textAlign',
          label: 'Align',
          type: 'select',
          options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
            { value: 'justify', label: 'Justify' },
          ],
        },
      ],
    },
    {
      id: 'layout',
      title: 'Layout',
      properties: [
        {
          key: 'display',
          label: 'Display',
          type: 'select',
          options: [
            { value: 'block', label: 'Block' },
            { value: 'inline', label: 'Inline' },
            { value: 'inline-block', label: 'Inline Block' },
            { value: 'flex', label: 'Flex' },
            { value: 'grid', label: 'Grid' },
            { value: 'none', label: 'None' },
          ],
        },
        {
          key: 'width',
          label: 'Width',
          type: 'text',
        },
        {
          key: 'height',
          label: 'Height',
          type: 'text',
        },
      ],
    },
    {
      id: 'spacing',
      title: 'Spacing',
      properties: [
        {
          key: 'margin',
          label: 'Margin',
          type: 'multi-value',
          sides: ['Top', 'Right', 'Bottom', 'Left'],
        },
        {
          key: 'padding',
          label: 'Padding',
          type: 'multi-value',
          sides: ['Top', 'Right', 'Bottom', 'Left'],
        },
      ],
    },
    {
      id: 'appearance',
      title: 'Appearance',
      properties: [
        {
          key: 'backgroundColor',
          label: 'Background',
          type: 'color',
        },
        {
          key: 'borderRadius',
          label: 'Border Radius',
          type: 'number',
          unit: 'px',
          min: 0,
          max: 100,
        },
        {
          key: 'opacity',
          label: 'Opacity',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
        },
        {
          key: 'boxShadow',
          label: 'Box Shadow',
          type: 'text',
        },
      ],
    },
    ...(elementInfo.textContent ? [{
      id: 'content',
      title: 'Content',
      properties: [
        {
          key: 'textContent',
          label: 'Text Content',
          type: 'textarea',
        },
      ] as PropertyControl[],
    }] : []),
  ], [selectedElement, elementInfo]);

  const hasChanges = pendingEdits.size > 0;

  // Generate element selector if not provided
  const elementSelectorStr = useMemo(() => {
    if (elementSelector) return elementSelector;
    
    if (selectedElement.id) {
      return `#${selectedElement.id}`;
    }
    
    if (selectedElement.className && typeof selectedElement.className === 'string') {
      const classes = selectedElement.className.trim().split(/\s+/).join('.');
      if (classes) {
        return `.${classes}`;
      }
    }
    
    // Fallback to tag name with nth-child
    const parent = selectedElement.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(el => el.tagName === selectedElement.tagName);
      const index = siblings.indexOf(selectedElement);
      return `${selectedElement.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }
    
    return selectedElement.tagName.toLowerCase();
  }, [selectedElement, elementSelector]);

  // Store original styles when component mounts or element changes
  useEffect(() => {
    const styles = new Map<string, string>();
    const computedStyles = getComputedStyle(selectedElement);
    
    // Store original values for properties that might be changed
    const propertiesToStore = [
      'color', 'backgroundColor', 'fontSize', 'fontWeight', 'textAlign',
      'display', 'width', 'height', 'margin', 'padding', 'borderRadius',
      'opacity', 'boxShadow'
    ];
    
    propertiesToStore.forEach(prop => {
      styles.set(prop, computedStyles.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase()));
    });
    
    setOriginalStyles(styles);
  }, [selectedElement]);

  // Update adapter preview when pending edits change
  useEffect(() => {
    if (pendingEdits.size > 0) {
      const preview = createAdapterPreview(elementSelectorStr, pendingEdits);
      setAdapterPreview(preview);
    } else {
      setAdapterPreview(null);
    }
  }, [pendingEdits, elementSelectorStr]);

  // Handle preview source changes
  const handlePreviewSourceChange = useCallback((source: PreviewSource) => {
    setPreviewState(prev => ({ ...prev, source }));
    
    if (source === 'adapter' && adapterPreview) {
      // Remove inline styles and inject adapter CSS
      restoreOriginalStyles();
      const css = generateAdapterCSS(adapterPreview);
      injectAdapterCSS(css);
    } else if (source === 'inline') {
      // Remove adapter CSS and reapply inline styles
      removeAdapterCSS();
      reapplyInlineStyles();
    }
  }, [adapterPreview]);

  // Handle view mode changes
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setPreviewState(prev => ({ ...prev, viewMode: mode }));
    
    if (mode === 'before') {
      // Show original state
      if (previewState.source === 'inline') {
        restoreOriginalStyles();
      } else {
        removeAdapterCSS();
      }
    } else if (mode === 'after') {
      // Show modified state
      if (previewState.source === 'inline') {
        reapplyInlineStyles();
      } else if (adapterPreview) {
        const css = generateAdapterCSS(adapterPreview);
        injectAdapterCSS(css);
      }
    }
    // Split mode is handled by CSS overlays
  }, [previewState.source, adapterPreview]);

  // Handle split position changes
  const handleSplitPositionChange = useCallback((position: number) => {
    setPreviewState(prev => ({ ...prev, splitPosition: position }));
  }, []);

  // Restore original styles
  const restoreOriginalStyles = useCallback(() => {
    originalStyles.forEach((value, property) => {
      const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (value) {
        selectedElement.style.setProperty(cssProperty, value);
      } else {
        selectedElement.style.removeProperty(cssProperty);
      }
    });
  }, [selectedElement, originalStyles]);

  // Reapply inline styles from pending edits
  const reapplyInlineStyles = useCallback(() => {
    pendingEdits.forEach(edit => {
      if (edit.property.startsWith('style.')) {
        const styleProp = edit.property.replace('style.', '');
        (selectedElement.style as any)[styleProp] = edit.after;
      } else if (edit.property.startsWith('attribute.')) {
        const attrName = edit.property.replace('attribute.', '');
        selectedElement.setAttribute(attrName, edit.after);
      } else if (edit.property === 'textContent') {
        selectedElement.textContent = edit.after;
      } else {
        const cssProperty = edit.property.replace(/([A-Z])/g, '-$1').toLowerCase();
        selectedElement.style.setProperty(cssProperty, edit.after);
      }
    });
  }, [selectedElement, pendingEdits]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeAdapterCSS();
    };
  }, []);

  const renderPropertyControl = (property: PropertyControl) => {
    const currentValue = getCurrentValue(property.key);

    switch (property.type) {
      case 'text':
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onPropertyChange(property.key, e.target.value, getComputedStyle(selectedElement)[property.key as any])}
            className="tweaq-edit-input-inline"
            placeholder={property.placeholder}
          />
        );

      case 'number':
        return (
          <div className="tweaq-edit-input-wrapper">
            <input
              type="number"
              value={parseInt(currentValue) || ''}
              min={property.min}
              max={property.max}
              onChange={(e) => {
                const value = e.target.value ? `${e.target.value}${property.unit || ''}` : '';
                onPropertyChange(property.key, value, getComputedStyle(selectedElement)[property.key as any]);
              }}
              className="tweaq-edit-number-inline"
            />
            {property.unit && <span className="tweaq-unit-inline">{property.unit}</span>}
          </div>
        );

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => onPropertyChange(property.key, e.target.value, getComputedStyle(selectedElement)[property.key as any])}
            className="tweaq-edit-select-inline"
          >
            {property.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'color':
        return (
          <div className="tweaq-edit-color-inline">
            <input
              type="color"
              value={currentValue.startsWith('#') ? currentValue : '#000000'}
              onChange={(e) => onPropertyChange(property.key, e.target.value, getComputedStyle(selectedElement)[property.key as any])}
              className="tweaq-color-picker-inline"
            />
            <input
              type="text"
              value={currentValue}
              onChange={(e) => onPropertyChange(property.key, e.target.value, getComputedStyle(selectedElement)[property.key as any])}
              className="tweaq-color-text-inline"
            />
          </div>
        );

      case 'range':
        return (
          <div className="tweaq-range-wrapper">
            <input
              type="range"
              value={parseFloat(currentValue) || property.min || 0}
              min={property.min}
              max={property.max}
              step={property.step}
              onChange={(e) => onPropertyChange(property.key, e.target.value, getComputedStyle(selectedElement)[property.key as any])}
              className="tweaq-edit-range-inline"
            />
            <span className="tweaq-range-value-inline">{currentValue}</span>
          </div>
        );

      case 'textarea':
        return (
          <div className="tweaq-content-editor">
            <textarea
              value={property.key === 'textContent' ? selectedElement.textContent || '' : currentValue}
              onChange={(e) => {
                if (property.key === 'textContent') {
                  selectedElement.textContent = e.target.value;
                }
                onPropertyChange(property.key, e.target.value, property.key === 'textContent' ? selectedElement.textContent || '' : getComputedStyle(selectedElement)[property.key as any]);
              }}
              className="tweaq-edit-textarea-inline"
              rows={3}
            />
          </div>
        );

      case 'multi-value':
        return (
          <div className="tweaq-spacing-group">
            <div className="tweaq-spacing-box tweaq-spacing-editable">
              <div className="tweaq-spacing-grid">
                {['Top', 'Right', 'Bottom', 'Left'].map((side) => {
                  const sideProperty = `${property.key}${side}`;
                  const sideValue = getCurrentValue(sideProperty);
                  return (
                    <input
                      key={side}
                      type="text"
                      placeholder="0"
                      value={sideValue}
                      onChange={(e) => onPropertyChange(sideProperty, e.target.value, getComputedStyle(selectedElement)[sideProperty as any])}
                      className="tweaq-spacing-input"
                      title={side}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="tweaq-overlay-panel tweaq-inspector-panel tweaq-edit-panel">
      <div className="tweaq-panel-header">
        <h3 className="tweaq-panel-title">Edit Properties</h3>
        <button onClick={onClose} className="tweaq-panel-close">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      </div>

      <div className="tweaq-panel-content">
        {/* Preview Controls */}
        {hasChanges && (
          <PreviewControls
            previewState={previewState}
            onPreviewSourceChange={handlePreviewSourceChange}
            onViewModeChange={handleViewModeChange}
            onSplitPositionChange={handleSplitPositionChange}
            confidence={adapterPreview?.overallConfidence}
          />
        )}
        {/* Element Info Section */}
        <div className="tweaq-inspector-section">
          <div className="tweaq-element-tag">
            <span className="tweaq-tag-name">&lt;{elementInfo.tagName.toLowerCase()}&gt;</span>
            {elementInfo.id && <span className="tweaq-element-id">#{elementInfo.id}</span>}
            {elementInfo.className && (
              <span className="tweaq-element-classes">
                {elementInfo.className.split(' ').map(cls => `.${cls}`).join(' ')}
              </span>
            )}
          </div>
        </div>

        {/* Property Groups */}
        {propertyGroups.map((group) => (
          <div key={group.id} className={`tweaq-inspector-section ${hasChanges ? 'tweaq-section-changed' : ''}`}>
            <h4 className="tweaq-section-title">{group.title}</h4>
            
            {group.properties.map((property) => {              
              if (property.type === 'multi-value') {
                return (
                  <div key={property.key} className="tweaq-spacing-group">
                    <span className="tweaq-spacing-label">{property.label}</span>
                    {renderPropertyControl(property)}
                  </div>
                );
              }

              return (
                <div key={property.key} className="tweaq-property-row">
                  <span className="tweaq-property-label">{property.label}</span>
                  {renderPropertyControl(property)}
                </div>
              );
            })}
          </div>
        ))}

        {/* Actions */}
        <div className="tweaq-inspector-section tweaq-edit-actions-section">
          <div className="tweaq-edit-actions-inline">
            <button
              className="tweaq-edit-button tweaq-edit-reset"
              disabled={!hasChanges}
              onClick={onResetChanges}
            >
              Reset Changes
            </button>
            <button
              className="tweaq-edit-button tweaq-edit-record"
              disabled={!hasChanges}
              onClick={onRecordEdit}
            >
              Record Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPanel;