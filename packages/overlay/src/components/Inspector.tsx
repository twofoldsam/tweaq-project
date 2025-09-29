import React from 'react';
import { ElementInfo } from '../types';

interface InspectorProps {
  elementInfo: ElementInfo;
  designTokens?: DesignTokens;
  onClose: () => void;
}

interface DesignTokens {
  colors?: Record<string, string>;
  typography?: {
    fontFamilies?: Record<string, string>;
    fontSizes?: Record<string, string>;
    fontWeights?: Record<string, string>;
    lineHeights?: Record<string, string>;
  };
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
}

interface TokenMatch {
  value: string;
  token?: string;
  isMatch: boolean;
}

const Inspector: React.FC<InspectorProps> = ({ elementInfo, designTokens, onClose }) => {
  const { computedStyles, dimensions } = elementInfo;

  // Helper function to match values against design tokens
  const matchToken = (value: string, tokenSet?: Record<string, string>): TokenMatch => {
    if (!tokenSet || !value) {
      return { value, isMatch: false };
    }

    // Find exact match
    const exactMatch = Object.entries(tokenSet).find(([_, tokenValue]) => tokenValue === value);
    if (exactMatch) {
      return { value, token: exactMatch[0], isMatch: true };
    }

    // Find close match for colors (hex/rgb conversion)
    if (value.startsWith('#') || value.startsWith('rgb')) {
      const normalizedValue = normalizeColor(value);
      const closeMatch = Object.entries(tokenSet).find(([_, tokenValue]) => 
        normalizeColor(tokenValue) === normalizedValue
      );
      if (closeMatch) {
        return { value, token: closeMatch[0], isMatch: true };
      }
    }

    return { value, isMatch: false };
  };

  const normalizeColor = (color: string): string => {
    // Simple color normalization - in practice, you'd want a more robust solution
    if (color.startsWith('rgb(')) {
      // Convert rgb to hex for comparison
      const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (matches && matches[1] && matches[2] && matches[3]) {
        const r = parseInt(matches[1]).toString(16).padStart(2, '0');
        const g = parseInt(matches[2]).toString(16).padStart(2, '0');
        const b = parseInt(matches[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    }
    return color.toLowerCase();
  };

  const formatSpacing = (value: string): string => {
    if (!value || value === '0px') return '0';
    return value.replace('px', '');
  };

  const formatFontWeight = (weight: string): string => {
    const weightMap: Record<string, string> = {
      '100': 'Thin',
      '200': 'Extra Light',
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semi Bold',
      '700': 'Bold',
      '800': 'Extra Bold',
      '900': 'Black'
    };
    return weightMap[weight] || weight;
  };

  // Token matching
  const colorMatch = matchToken(computedStyles.color || '', designTokens?.colors);
  const backgroundMatch = matchToken(computedStyles.backgroundColor || '', designTokens?.colors);
  const fontFamilyMatch = matchToken(computedStyles.fontFamily || '', designTokens?.typography?.fontFamilies);
  const fontSizeMatch = matchToken(computedStyles.fontSize || '', designTokens?.typography?.fontSizes);
  const fontWeightMatch = matchToken(computedStyles.fontWeight || '', designTokens?.typography?.fontWeights);
  const lineHeightMatch = matchToken(computedStyles.lineHeight || '', designTokens?.typography?.lineHeights);

  const renderTokenValue = (match: TokenMatch, showColor = false) => (
    <div className="tweaq-token-value">
      <span className={`tweaq-value ${match.isMatch ? 'tweaq-token-match' : 'tweaq-token-mismatch'}`}>
        {match.value}
        {showColor && (
          <span 
            className="tweaq-color-swatch" 
            style={{ backgroundColor: match.value }}
          />
        )}
      </span>
      {match.token && (
        <span className="tweaq-token-name">{match.token}</span>
      )}
      {!match.isMatch && designTokens && (
        <span className="tweaq-token-status">⚠️</span>
      )}
    </div>
  );

  return (
    <div className="tweaq-overlay-panel tweaq-inspector-panel tweaq-panel-visible">
      <div className="tweaq-panel-header">
        <h3 className="tweaq-panel-title">Measure</h3>
        <button className="tweaq-panel-close" onClick={onClose} title="Close panel">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854z"/>
          </svg>
        </button>
      </div>
      
      <div className="tweaq-panel-content">
        {/* Element Info */}
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

        {/* Dimensions */}
        <div className="tweaq-inspector-section">
          <h4 className="tweaq-section-title">Size</h4>
          <div className="tweaq-dimension-grid">
            <div className="tweaq-dimension-item">
              <span className="tweaq-dimension-label">W</span>
              <span className="tweaq-dimension-value">{Math.round(dimensions.width)}</span>
            </div>
            <div className="tweaq-dimension-item">
              <span className="tweaq-dimension-label">H</span>
              <span className="tweaq-dimension-value">{Math.round(dimensions.height)}</span>
            </div>
          </div>
        </div>

        {/* Typography */}
        {(computedStyles.fontFamily || computedStyles.fontSize || computedStyles.fontWeight) && (
          <div className="tweaq-inspector-section">
            <h4 className="tweaq-section-title">Typography</h4>
            
            {computedStyles.fontFamily && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Font</span>
                {renderTokenValue(fontFamilyMatch)}
              </div>
            )}
            
            {computedStyles.fontSize && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Size</span>
                {renderTokenValue(fontSizeMatch)}
              </div>
            )}
            
            {computedStyles.fontWeight && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Weight</span>
                {renderTokenValue({
                  ...fontWeightMatch,
                  value: formatFontWeight(fontWeightMatch.value)
                })}
              </div>
            )}
            
            {computedStyles.lineHeight && computedStyles.lineHeight !== 'normal' && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Line Height</span>
                {renderTokenValue(lineHeightMatch)}
              </div>
            )}
            
            {computedStyles.color && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Color</span>
                {renderTokenValue(colorMatch, true)}
              </div>
            )}
          </div>
        )}

        {/* Spacing */}
        {(computedStyles.margin || computedStyles.padding) && (
          <div className="tweaq-inspector-section">
            <h4 className="tweaq-section-title">Spacing</h4>
            
            {computedStyles.padding && computedStyles.padding !== '0px' && (
              <div className="tweaq-spacing-group">
                <span className="tweaq-spacing-label">Padding</span>
                <div className="tweaq-spacing-box">
                  <div className="tweaq-spacing-values">
                    {formatSpacing(computedStyles.paddingTop || computedStyles.padding)}
                    {computedStyles.paddingRight && ` ${formatSpacing(computedStyles.paddingRight)}`}
                    {computedStyles.paddingBottom && ` ${formatSpacing(computedStyles.paddingBottom)}`}
                    {computedStyles.paddingLeft && ` ${formatSpacing(computedStyles.paddingLeft)}`}
                  </div>
                </div>
              </div>
            )}
            
            {computedStyles.margin && computedStyles.margin !== '0px' && (
              <div className="tweaq-spacing-group">
                <span className="tweaq-spacing-label">Margin</span>
                <div className="tweaq-spacing-box">
                  <div className="tweaq-spacing-values">
                    {formatSpacing(computedStyles.marginTop || computedStyles.margin)}
                    {computedStyles.marginRight && ` ${formatSpacing(computedStyles.marginRight)}`}
                    {computedStyles.marginBottom && ` ${formatSpacing(computedStyles.marginBottom)}`}
                    {computedStyles.marginLeft && ` ${formatSpacing(computedStyles.marginLeft)}`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layout */}
        <div className="tweaq-inspector-section">
          <h4 className="tweaq-section-title">Layout</h4>
          
          {computedStyles.display && (
            <div className="tweaq-property-row">
              <span className="tweaq-property-label">Display</span>
              <span className="tweaq-property-value">{computedStyles.display}</span>
            </div>
          )}
          
          {computedStyles.position && computedStyles.position !== 'static' && (
            <div className="tweaq-property-row">
              <span className="tweaq-property-label">Position</span>
              <span className="tweaq-property-value">{computedStyles.position}</span>
            </div>
          )}
          
          {computedStyles.width && computedStyles.width !== 'auto' && (
            <div className="tweaq-property-row">
              <span className="tweaq-property-label">Width</span>
              <span className="tweaq-property-value">{computedStyles.width}</span>
            </div>
          )}
          
          {computedStyles.height && computedStyles.height !== 'auto' && (
            <div className="tweaq-property-row">
              <span className="tweaq-property-label">Height</span>
              <span className="tweaq-property-value">{computedStyles.height}</span>
            </div>
          )}
        </div>

        {/* Background & Border */}
        {(computedStyles.backgroundColor || computedStyles.border || computedStyles.borderRadius) && (
          <div className="tweaq-inspector-section">
            <h4 className="tweaq-section-title">Appearance</h4>
            
            {computedStyles.backgroundColor && 
             computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
             computedStyles.backgroundColor !== 'transparent' && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Background</span>
                {renderTokenValue(backgroundMatch, true)}
              </div>
            )}
            
            {computedStyles.border && computedStyles.border !== 'none' && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Border</span>
                <span className="tweaq-property-value">{computedStyles.border}</span>
              </div>
            )}
            
            {computedStyles.borderRadius && computedStyles.borderRadius !== '0px' && (
              <div className="tweaq-property-row">
                <span className="tweaq-property-label">Border Radius</span>
                <span className="tweaq-property-value">{computedStyles.borderRadius}</span>
              </div>
            )}
          </div>
        )}

        {/* Token Status Summary */}
        {designTokens && (
          <div className="tweaq-inspector-section tweaq-token-summary">
            <h4 className="tweaq-section-title">Design Tokens</h4>
            <div className="tweaq-token-status-summary">
              {[colorMatch, backgroundMatch, fontFamilyMatch, fontSizeMatch, fontWeightMatch].filter(m => m.value).map((match, index) => (
                <div key={index} className={`tweaq-token-indicator ${match.isMatch ? 'match' : 'mismatch'}`}>
                  {match.isMatch ? '✓' : '⚠️'}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inspector;
