// ============================================================
// Layout Analyzer — Flexbox/Grid/spacing detection
// ============================================================

import type { LayoutInfo } from '@/shared/types';

/**
 * Analyze the layout properties of an element, detecting
 * flexbox, grid, and basic dimension/position information.
 */
export function analyzeLayout(element: Element): LayoutInfo {
  const computed = getComputedStyle(element);

  const layout: LayoutInfo = {
    display: computed.display,
    position: computed.position,
    dimensions: {
      width: computed.width,
      height: computed.height,
      minWidth: computed.minWidth !== '0px' ? computed.minWidth : '',
      maxWidth: computed.maxWidth !== 'none' ? computed.maxWidth : '',
      minHeight: computed.minHeight !== '0px' ? computed.minHeight : '',
      maxHeight: computed.maxHeight !== 'none' ? computed.maxHeight : '',
    },
  };

  // Flex container detection
  if (computed.display === 'flex' || computed.display === 'inline-flex') {
    layout.flex = {
      direction: computed.flexDirection,
      justifyContent: computed.justifyContent,
      alignItems: computed.alignItems,
      gap: computed.gap,
      wrap: computed.flexWrap,
      grow: computed.flexGrow,
      shrink: computed.flexShrink,
      basis: computed.flexBasis,
    };
  }

  // Grid container detection
  if (computed.display === 'grid' || computed.display === 'inline-grid') {
    layout.grid = {
      templateColumns: computed.gridTemplateColumns,
      templateRows: computed.gridTemplateRows,
      gap: computed.gap,
      autoFlow: computed.gridAutoFlow,
      column: computed.gridColumn,
      row: computed.gridRow,
    };
  }

  // For flex/grid children, capture their specific properties
  const parent = element.parentElement;
  if (parent) {
    const parentDisplay = getComputedStyle(parent).display;
    if (parentDisplay === 'flex' || parentDisplay === 'inline-flex') {
      if (!layout.flex) layout.flex = {} as LayoutInfo['flex'];
      layout.flex = {
        ...layout.flex!,
        grow: computed.flexGrow,
        shrink: computed.flexShrink,
        basis: computed.flexBasis,
      };
    }
    if (parentDisplay === 'grid' || parentDisplay === 'inline-grid') {
      if (!layout.grid) layout.grid = {} as LayoutInfo['grid'];
      layout.grid = {
        ...layout.grid!,
        column: computed.gridColumn,
        row: computed.gridRow,
      };
    }
  }

  return layout;
}

/**
 * Describe layout in natural language for AI prompts
 */
export function describeLayout(layout: LayoutInfo): string {
  const parts: string[] = [];

  if (layout.flex) {
    const dir = layout.flex.direction === 'row' ? 'horizontal' : 'vertical';
    parts.push(`Flex ${dir}`);

    if (layout.flex.justifyContent && layout.flex.justifyContent !== 'normal') {
      parts.push(`justify: ${layout.flex.justifyContent}`);
    }
    if (layout.flex.alignItems && layout.flex.alignItems !== 'normal') {
      parts.push(`align: ${layout.flex.alignItems}`);
    }
    if (layout.flex.gap && layout.flex.gap !== 'normal' && layout.flex.gap !== '0px') {
      parts.push(`gap: ${layout.flex.gap}`);
    }
    if (layout.flex.wrap === 'wrap') {
      parts.push('wrapping');
    }
  } else if (layout.grid) {
    parts.push('Grid layout');
    if (layout.grid.templateColumns && layout.grid.templateColumns !== 'none') {
      parts.push(`columns: ${layout.grid.templateColumns}`);
    }
    if (layout.grid.gap && layout.grid.gap !== 'normal' && layout.grid.gap !== '0px') {
      parts.push(`gap: ${layout.grid.gap}`);
    }
  } else if (layout.display === 'inline' || layout.display === 'inline-block') {
    parts.push(`Inline${layout.display === 'inline-block' ? ' block' : ''}`);
  } else {
    parts.push('Block layout');
  }

  if (layout.position !== 'static') {
    parts.push(`position: ${layout.position}`);
  }

  return parts.join(', ');
}

/**
 * Detect consistent spacing patterns among children
 */
export function detectSpacingPatterns(element: Element): {
  childGap: string | null;
  paddingPattern: string | null;
} {
  const children = Array.from(element.children);
  if (children.length < 2) return { childGap: null, paddingPattern: null };

  const computed = getComputedStyle(element);

  // Check CSS gap first
  if (computed.gap && computed.gap !== 'normal' && computed.gap !== '0px') {
    return {
      childGap: computed.gap,
      paddingPattern: formatPadding(computed),
    };
  }

  // Check margin-based spacing between children
  const margins: number[] = [];
  for (let i = 1; i < children.length; i++) {
    const prevStyle = getComputedStyle(children[i - 1]);
    const currStyle = getComputedStyle(children[i]);
    const isVertical = computed.flexDirection !== 'row';

    if (isVertical) {
      margins.push(
        Math.max(parseFloat(prevStyle.marginBottom) || 0, parseFloat(currStyle.marginTop) || 0)
      );
    } else {
      margins.push(
        Math.max(parseFloat(prevStyle.marginRight) || 0, parseFloat(currStyle.marginLeft) || 0)
      );
    }
  }

  const allSame = margins.every(m => m === margins[0]);
  const childGap = allSame && margins[0] > 0 ? `${margins[0]}px` : null;

  return {
    childGap,
    paddingPattern: formatPadding(computed),
  };
}

function formatPadding(computed: CSSStyleDeclaration): string | null {
  const pt = computed.paddingTop;
  const pr = computed.paddingRight;
  const pb = computed.paddingBottom;
  const pl = computed.paddingLeft;

  if (pt === '0px' && pr === '0px' && pb === '0px' && pl === '0px') return null;

  // Collapse to shorthand
  if (pt === pr && pr === pb && pb === pl) return pt;
  if (pt === pb && pr === pl) return `${pt} ${pr}`;
  if (pr === pl) return `${pt} ${pr} ${pb}`;
  return `${pt} ${pr} ${pb} ${pl}`;
}
