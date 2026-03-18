// ============================================================
// DOM Inspector Plus — Constants
// ============================================================

/** Max nodes to extract in a single subtree walk */
export const MAX_SUBTREE_NODES = 200;

/** Hover throttle in ms */
export const HOVER_THROTTLE_MS = 60;

/** Max levels to walk up for component boundary detection */
export const MAX_BOUNDARY_LEVELS = 5;

/** Max text content length to include */
export const MAX_TEXT_LENGTH = 200;

/** Highlight overlay colors */
export const HIGHLIGHT_COLORS = {
  element: 'rgba(59, 130, 246, 0.15)',
  elementBorder: 'rgba(59, 130, 246, 0.8)',
  component: 'rgba(139, 92, 246, 0.15)',
  componentBorder: 'rgba(139, 92, 246, 0.8)',
  margin: 'rgba(249, 115, 22, 0.3)',
  padding: 'rgba(52, 211, 153, 0.3)',
} as const;

/** Overlay z-index (very high to sit above page content) */
export const OVERLAY_Z_INDEX = 2147483640;

/** Semantic HTML elements that suggest component boundaries */
export const SEMANTIC_ELEMENTS = new Set([
  'article', 'section', 'nav', 'aside', 'header', 'footer',
  'main', 'figure', 'dialog', 'details', 'form', 'fieldset',
]);

/** Framework-specific attributes that suggest component boundaries */
export const FRAMEWORK_ATTRIBUTES = [
  'data-testid',
  'data-reactroot',
  'data-reactid',
  'data-component',
  'data-block',
  // Vue
  /^data-v-/,
  // Angular
  /^_ngcontent-/,
  /^_nghost-/,
  // Svelte
  /^svelte-/,
  // Styled Components
  /^sc-/,
];

/** ARIA roles that suggest meaningful component boundaries */
export const ARIA_COMPONENT_ROLES = new Set([
  'dialog', 'alert', 'alertdialog', 'navigation', 'banner',
  'complementary', 'contentinfo', 'form', 'main', 'region',
  'search', 'tabpanel', 'toolbar', 'menu', 'menubar', 'tree',
  'grid', 'listbox', 'radiogroup', 'tablist',
]);

/** CSS properties grouped by category */
export const STYLE_CATEGORIES = {
  layout: [
    'display', 'position', 'top', 'right', 'bottom', 'left',
    'float', 'clear', 'overflow', 'overflow-x', 'overflow-y',
    'z-index', 'flex-direction', 'flex-wrap', 'justify-content',
    'align-items', 'align-content', 'align-self', 'flex-grow',
    'flex-shrink', 'flex-basis', 'order', 'gap', 'row-gap',
    'column-gap', 'grid-template-columns', 'grid-template-rows',
    'grid-column', 'grid-row', 'grid-auto-flow',
  ],
  typography: [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-decoration',
    'text-transform', 'white-space', 'word-break', 'word-spacing',
    'text-overflow', 'text-indent',
  ],
  colors: [
    'color', 'background-color', 'background-image', 'background',
    'background-size', 'background-position', 'background-repeat',
    'opacity',
  ],
  borders: [
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-width', 'border-style', 'border-color',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'outline', 'outline-width', 'outline-style', 'outline-color', 'outline-offset',
  ],
  spacing: [
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  ],
  effects: [
    'box-shadow', 'text-shadow', 'transform', 'transition',
    'animation', 'filter', 'backdrop-filter', 'mix-blend-mode',
    'cursor', 'pointer-events', 'user-select', 'will-change',
    'clip-path', 'mask',
  ],
} as const;

/** Icon font class prefixes */
export const ICON_FONT_PREFIXES = [
  'fa-', 'fas ', 'far ', 'fab ', 'fal ', // Font Awesome
  'material-icons', 'material-symbols',   // Material
  'lucide-', 'icon-', 'bi-', 'bx-',      // Bootstrap/Boxicons
  'ri-',                                   // Remix Icons
  'ph-',                                   // Phosphor
  'tabler-icon-',                          // Tabler
];

/** Google Fonts detection patterns */
export const GOOGLE_FONTS_PATTERN = /fonts\.googleapis\.com|fonts\.gstatic\.com/;
