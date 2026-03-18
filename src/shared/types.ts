// ============================================================
// DOM Inspector Plus — Core Type Definitions
// ============================================================

/** Unique identifier for DOM nodes within an inspection session */
export type NodeId = string;

/** Inspection modes */
export type InspectionMode = 'element' | 'component' | 'design-system';

/** Export formats */
export type ExportFormat = 'ai-prompt' | 'json' | 'react-jsx' | 'html-css' | 'tailwind-only';

/** AI integration targets */
export type AITarget = 'claude' | 'v0' | 'cursor' | 'clipboard';

/** Interaction states that can be captured */
export type InteractionState = 'default' | 'hover' | 'focus' | 'active';

// ---- Extracted Node Data ----

export interface ExtractedNode {
  id: NodeId;
  tagName: string;
  /** CSS classes on the element */
  classNames: string[];
  /** Key HTML attributes (id, data-*, aria-*, role, href, src, alt, etc.) */
  attributes: Record<string, string>;
  /** Inner text content (truncated for display) */
  textContent: string;
  /** Extracted and diffed styles (only non-default values) */
  styles: ExtractedStyles;
  /** Tailwind class equivalents */
  tailwindClasses: string[];
  /** Layout information */
  layout: LayoutInfo;
  /** Bounding rect relative to viewport */
  boundingRect: BoundingRect;
  /** Children nodes */
  children: ExtractedNode[];
  /** Pseudo-element styles (::before, ::after) */
  pseudoElements?: PseudoElementStyles;
  /** Accessibility attributes */
  accessibility: AccessibilityInfo;
  /** Asset references */
  assets: AssetInfo[];
  /** Animation/transition info */
  animations: AnimationInfo[];
  /** Whether this node was detected as a component boundary */
  isComponentRoot: boolean;
  /** Component boundary detection score */
  componentScore: number;
}

export interface ExtractedStyles {
  /** Display and positioning */
  layout: Record<string, string>;
  /** Typography */
  typography: Record<string, string>;
  /** Colors and backgrounds */
  colors: Record<string, string>;
  /** Borders and outlines */
  borders: Record<string, string>;
  /** Margin and padding */
  spacing: Record<string, string>;
  /** Shadows, opacity, transforms, etc. */
  effects: Record<string, string>;
  /** CSS custom properties used */
  customProperties: Record<string, string>;
  /** All extracted properties flat (for export) */
  all: Record<string, string>;
}

export interface LayoutInfo {
  display: string;
  position: string;
  /** Flex-specific */
  flex?: {
    direction: string;
    justifyContent: string;
    alignItems: string;
    gap: string;
    wrap: string;
    grow: string;
    shrink: string;
    basis: string;
  };
  /** Grid-specific */
  grid?: {
    templateColumns: string;
    templateRows: string;
    gap: string;
    autoFlow: string;
    column: string;
    row: string;
  };
  /** Width/height */
  dimensions: {
    width: string;
    height: string;
    minWidth: string;
    maxWidth: string;
    minHeight: string;
    maxHeight: string;
  };
}

export interface BoundingRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface PseudoElementStyles {
  before?: Record<string, string>;
  after?: Record<string, string>;
}

export interface AccessibilityInfo {
  role: string;
  ariaLabel: string;
  ariaLabelledBy: string;
  ariaDescribedBy: string;
  tabIndex: number | null;
  alt: string;
  semanticTag: string;
}

export interface AssetInfo {
  type: 'svg' | 'image' | 'icon-font' | 'background-image';
  /** SVG markup, image src, icon class, or bg URL */
  value: string;
  /** Additional metadata */
  meta: Record<string, string>;
}

export interface AnimationInfo {
  type: 'transition' | 'animation';
  property: string;
  duration: string;
  timing: string;
  delay: string;
  /** Natural language description */
  description: string;
}

// ---- Interaction State Diff ----

export interface InteractionStateDiff {
  state: InteractionState;
  changes: Record<string, { from: string; to: string }>;
  description: string;
}

// ---- Component Extraction (full result) ----

export interface ComponentExtraction {
  /** Timestamp */
  timestamp: number;
  /** Source URL */
  url: string;
  /** Page title */
  pageTitle: string;
  /** Root node of extraction */
  rootNode: ExtractedNode;
  /** Flattened node count */
  nodeCount: number;
  /** Design tokens detected */
  designTokens: DesignTokens;
  /** Interaction state diffs */
  interactionStates: InteractionStateDiff[];
  /** Matched CSS rules (Tier 2, when available) */
  matchedRules?: MatchedCSSRule[];
  /** Extraction mode used */
  mode: InspectionMode;
}

export interface DesignTokens {
  colors: Array<{ value: string; usage: string; count: number }>;
  typography: Array<{
    family: string;
    size: string;
    weight: string;
    lineHeight: string;
    usage: string;
  }>;
  spacing: Array<{ value: string; count: number }>;
  borderRadius: Array<{ value: string; count: number }>;
  shadows: Array<{ value: string; count: number }>;
}

export interface MatchedCSSRule {
  selector: string;
  properties: Record<string, string>;
  source: string;
  mediaQuery?: string;
}

// ---- Inspection History ----

export interface InspectionRecord {
  id: string;
  timestamp: number;
  url: string;
  pageTitle: string;
  extraction: ComponentExtraction;
  /** Data URL thumbnail */
  thumbnail?: string;
  tags: string[];
  favorite: boolean;
  collectionId?: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  inspectionIds: string[];
}

// ---- Settings ----

export interface Settings {
  /** Default export format */
  defaultFormat: ExportFormat;
  /** Default AI target */
  defaultTarget: AITarget;
  /** Max subtree nodes to extract */
  maxNodes: number;
  /** Show Tailwind classes */
  showTailwind: boolean;
  /** Include accessibility info */
  includeAccessibility: boolean;
  /** Include animations */
  includeAnimations: boolean;
  /** Auto-detect component boundaries */
  autoComponentBoundary: boolean;
  /** Keyboard shortcut overrides */
  shortcuts: Record<string, string>;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultFormat: 'ai-prompt',
  defaultTarget: 'clipboard',
  maxNodes: 200,
  showTailwind: true,
  includeAccessibility: true,
  includeAnimations: true,
  autoComponentBoundary: true,
  shortcuts: {},
};

// ---- Message Passing ----

export type MessageType =
  | 'TOGGLE_INSPECTOR'
  | 'INSPECTION_RESULT'
  | 'HOVER_ELEMENT'
  | 'CLICK_ELEMENT'
  | 'EXPAND_BOUNDARY'
  | 'CONTRACT_BOUNDARY'
  | 'EXPORT_REQUEST'
  | 'EXPORT_RESULT'
  | 'CAPTURE_INTERACTION_STATE'
  | 'SETTINGS_UPDATE'
  | 'HISTORY_UPDATE'
  | 'DEVTOOLS_CONNECTED'
  | 'CDP_REQUEST'
  | 'CDP_RESPONSE'
  | 'DESIGN_SYSTEM_SCAN'
  | 'DESIGN_SYSTEM_RESULT';

export interface Message<T = unknown> {
  type: MessageType;
  payload: T;
  tabId?: number;
}

// ---- AI Integration ----

export interface AIIntegration {
  id: AITarget;
  name: string;
  icon: string;
  promptTemplate: (extraction: ComponentExtraction) => string;
  launchUrl?: string;
  protocolHandler?: string;
}
