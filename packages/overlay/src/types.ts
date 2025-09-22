export interface CodeSelection {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  text: string;
}

export interface OverlayEditorProps {
  selection: CodeSelection;
  onEdit: (newText: string) => void;
  onCancel: () => void;
  language?: string;
}

// New overlay types
export type OverlayMode = 'measure' | 'edit';

export interface ElementInfo {
  tagName: string;
  id: string | undefined;
  className: string | undefined;
  textContent: string | undefined;
  attributes: Record<string, string>;
  computedStyles: Record<string, string>;
  dimensions: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export interface SelectedElement {
  element: HTMLElement;
  info: ElementInfo;
}

export interface OverlayState {
  mode: OverlayMode;
  selectedElement: SelectedElement | null;
  selectedElements: SelectedElement[]; // For multi-selection (ruler tool)
  hoveredElement: HTMLElement | null;
  isVisible: boolean;
  showRuler: boolean;
  showAlignmentGuides: boolean;
}

export interface ToolbarProps {
  mode: OverlayMode;
  onModeToggle: (mode: OverlayMode) => void;
  onClose: () => void;
}

export interface InfoPanelProps {
  elementInfo: ElementInfo;
  onClose: () => void;
}

export interface PropertiesPanelProps {
  elementInfo: ElementInfo;
  onPropertyChange: (property: string, value: string) => void;
  onClose: () => void;
}

// Enhanced Edit mode types
export interface VisualEdit {
  id: string;
  timestamp: number;
  element: {
    selector: string;
    tagName: string;
    id: string | undefined;
    className: string | undefined;
  };
  changes: {
    property: string;
    before: string;
    after: string;
  }[];
}

export interface PendingEdit {
  property: string;
  after: string;
  before: string;
}

export interface EditPanelProps {
  elementInfo: ElementInfo;
  selectedElement: HTMLElement;
  pendingEdits: Map<string, PendingEdit>;
  onPropertyChange: (property: string, value: string, originalValue?: string) => void;
  onRecordEdit: () => void;
  onResetChanges: () => void;
  onClose: () => void;
  elementSelector?: string;
}

export interface PropertyGroup {
  id: string;
  title: string;
  properties: PropertyControl[];
}

export interface PropertyControl {
  key: string;
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'textarea' | 'range' | 'multi-value';
  options?: { value: string; label: string }[];
  sides?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
}

// Enhanced preview types
export type PreviewSource = 'inline' | 'adapter';
export type ViewMode = 'before' | 'after' | 'split';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CSSMapping {
  property: string;
  value: string;
  tailwindClass?: string | undefined;
  rawCSS?: string | undefined;
  confidence: ConfidenceLevel;
}

export interface AdapterPreview {
  id: string;
  selector: string;
  mappings: CSSMapping[];
  overallConfidence: ConfidenceLevel;
}

export interface PreviewState {
  source: PreviewSource;
  viewMode: ViewMode;
  splitPosition: number; // 0-100 percentage for split view
}

export interface PreviewControlsProps {
  previewState: PreviewState;
  onPreviewSourceChange: (source: PreviewSource) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSplitPositionChange: (position: number) => void;
  confidence?: ConfidenceLevel | undefined;
}
