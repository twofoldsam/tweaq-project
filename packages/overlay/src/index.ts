// Legacy exports
export { default as OverlayEditor } from './components/OverlayEditor';
export { default as CodeHighlighter } from './components/CodeHighlighter';
export type { OverlayEditorProps, CodeSelection } from './types';

// New overlay exports
export { default as OverlayUI } from './components/OverlayUI';
export { default as Toolbar } from './components/Toolbar';
export { default as InfoPanel } from './components/InfoPanel';
export { default as PropertiesPanel } from './components/PropertiesPanel';
export { default as Inspector } from './components/Inspector';
export { default as EditPanel } from './components/EditPanel';
export { default as PreviewControls } from './components/PreviewControls';
export { default as Ruler } from './components/Ruler';
export { default as AlignmentGuides } from './components/AlignmentGuides';
export { injectOverlay, removeOverlay, toggleOverlay } from './utils/injector';

// CSS Adapter utilities
export {
  mapCSSToTailwind,
  createAdapterPreview,
  generateAdapterCSS,
  injectAdapterCSS,
  removeAdapterCSS,
} from './utils/cssAdapter';

// GitHub integration utilities
export {
  detectProjectContext,
  enhanceCSSMappingsWithContext,
  generatePullRequestDiff,
  createEnhancedAdapterPreview,
} from './utils/githubIntegration';

export type {
  OverlayMode,
  ElementInfo,
  SelectedElement,
  OverlayState,
  ToolbarProps,
  InfoPanelProps,
  PropertiesPanelProps,
  EditPanelProps,
  VisualEdit,
  PendingEdit,
  PropertyGroup,
  PropertyControl,
  // Enhanced preview types
  PreviewSource,
  ViewMode,
  ConfidenceLevel,
  CSSMapping,
  AdapterPreview,
  PreviewState,
  PreviewControlsProps,
} from './types';
