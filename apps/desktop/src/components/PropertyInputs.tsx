import { useState } from 'react';
import './PropertyInputs.css';

// Helper functions
export const parseNumberValue = (value: string): number => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};

export const rgbToHex = (rgb: string): string => {
  if (rgb.startsWith('#')) return rgb;
  
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return '#000000';
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Color Input with Swatch
interface ColorInputProps {
  label: string;
  value: string;
  property: string;
  onChange: (property: string, value: string) => void;
}

export function ColorInput({ label, value, property, onChange }: ColorInputProps) {
  const hexValue = rgbToHex(value);
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(property, e.target.value);
  };

  return (
    <div className="property-row">
      <label className="property-name">{label}:</label>
      <div className="color-group">
        <input
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          className="color-swatch"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(property, e.target.value)}
          className="color-text-input"
        />
      </div>
    </div>
  );
}

// Number Input with Unit
interface NumberInputProps {
  label: string;
  value: string | number;
  property: string;
  unit?: string;
  min?: number;
  max?: number;
  readonly?: boolean;
  onChange: (property: string, value: string) => void;
}

export function NumberInput({ label, value, property, unit = 'px', min, max, readonly, onChange }: NumberInputProps) {
  const numValue = typeof value === 'string' ? parseNumberValue(value) : value;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const withUnit = unit === '%' && property === 'opacity' 
      ? (parseInt(newValue) / 100).toString()
      : unit === 'px' ? `${newValue}px` : newValue;
    onChange(property, withUnit);
  };

  return (
    <div className="property-row">
      <label className="property-name">{label}:</label>
      <div className="number-group">
        <input
          type="number"
          value={numValue}
          onChange={handleChange}
          className="number-input"
          min={min}
          max={max}
          readOnly={readonly}
        />
        <span className="unit-label">{unit}</span>
      </div>
    </div>
  );
}

// Select Dropdown
interface SelectInputProps {
  label: string;
  value: string;
  property: string;
  options: Array<{ value: string; label: string }>;
  onChange: (property: string, value: string) => void;
}

export function SelectInput({ label, value, property, options, onChange }: SelectInputProps) {
  return (
    <div className="property-row">
      <label className="property-name">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(property, e.target.value)}
        className="select-input"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Spacing Control (Padding/Margin)
interface SpacingInputProps {
  label: string;
  values: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  properties: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  onChange: (property: string, value: string) => void;
}

export function SpacingInput({ label, values, properties, onChange }: SpacingInputProps) {
  const [linked, setLinked] = useState(true);

  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    if (linked) {
      // Apply to all sides
      onChange(properties.top, `${value}px`);
      onChange(properties.right, `${value}px`);
      onChange(properties.bottom, `${value}px`);
      onChange(properties.left, `${value}px`);
    } else {
      // Apply to specific side
      onChange(properties[side], `${value}px`);
    }
  };

  return (
    <div className="property-row spacing-control">
      <label className="property-name">{label}:</label>
      <div className="spacing-inputs-container">
        <button
          className={`spacing-link-toggle ${linked ? 'linked' : ''}`}
          onClick={() => setLinked(!linked)}
          title={linked ? 'Unlink sides' : 'Link sides'}
        >
          {linked ? '🔗' : '⛓️‍💥'}
        </button>
        
        {linked ? (
          <div className="spacing-inputs-linked">
            <div className="spacing-input-group">
              <span className="spacing-icon">⇅</span>
              <input
                type="number"
                value={values.top}
                onChange={(e) => handleChange('top', e.target.value)}
                className="spacing-value"
                placeholder="0"
              />
            </div>
            <div className="spacing-input-group">
              <span className="spacing-icon">⇄</span>
              <input
                type="number"
                value={values.left}
                onChange={(e) => handleChange('left', e.target.value)}
                className="spacing-value"
                placeholder="0"
              />
            </div>
          </div>
        ) : (
          <div className="spacing-inputs-individual">
            <div className="spacing-input-group">
              <span className="spacing-icon">↑</span>
              <input
                type="number"
                value={values.top}
                onChange={(e) => handleChange('top', e.target.value)}
                className="spacing-value"
                placeholder="0"
              />
            </div>
            <div className="spacing-input-group">
              <span className="spacing-icon">→</span>
              <input
                type="number"
                value={values.right}
                onChange={(e) => handleChange('right', e.target.value)}
                className="spacing-value"
                placeholder="0"
              />
            </div>
            <div className="spacing-input-group">
              <span className="spacing-icon">↓</span>
              <input
                type="number"
                value={values.bottom}
                onChange={(e) => handleChange('bottom', e.target.value)}
                className="spacing-value"
                placeholder="0"
              />
            </div>
            <div className="spacing-input-group">
              <span className="spacing-icon">←</span>
              <input
                type="number"
                value={values.left}
                onChange={(e) => handleChange('left', e.target.value)}
                className="spacing-value"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Text Content Textarea
interface TextContentInputProps {
  label: string;
  value: string;
  property: string;
  onChange: (property: string, value: string) => void;
}

export function TextContentInput({ label, value, property, onChange }: TextContentInputProps) {
  return (
    <div className="property-row content-input">
      <label className="property-name">{label}:</label>
      <textarea
        value={value}
        onChange={(e) => onChange(property, e.target.value)}
        className="content-textarea"
        rows={3}
      />
    </div>
  );
}

