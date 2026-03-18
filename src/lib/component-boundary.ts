// ============================================================
// Component Boundary Detection — Heuristic algorithm
// ============================================================

import {
  SEMANTIC_ELEMENTS,
  FRAMEWORK_ATTRIBUTES,
  ARIA_COMPONENT_ROLES,
  MAX_BOUNDARY_LEVELS,
} from '@/shared/constants';

interface BoundaryResult {
  isComponentRoot: boolean;
  componentScore: number;
}

/**
 * Score an element as a potential component root.
 * Higher score = more likely to be a component boundary.
 */
export function scoreComponentBoundary(element: Element): number {
  let score = 0;

  // 1. Framework attributes (+3 each)
  for (const attr of element.attributes) {
    for (const pattern of FRAMEWORK_ATTRIBUTES) {
      if (typeof pattern === 'string' && attr.name === pattern) {
        score += 3;
      } else if (pattern instanceof RegExp && pattern.test(attr.name)) {
        score += 3;
      }
    }
  }

  // 2. ARIA role (+2)
  const role = element.getAttribute('role');
  if (role && ARIA_COMPONENT_ROLES.has(role)) {
    score += 2;
  }

  // 3. Semantic HTML (+2)
  if (SEMANTIC_ELEMENTS.has(element.tagName.toLowerCase())) {
    score += 2;
  }

  // 4. BEM-style class names (+1)
  const classes = element.className;
  if (typeof classes === 'string') {
    // BEM block: a class without __ or -- that has children with __
    if (/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/i.test(classes.split(' ')[0])) {
      score += 1;
    }
    // Any class with component-like naming
    if (/component|widget|card|modal|dialog|panel|container|wrapper|section|block/i.test(classes)) {
      score += 1;
    }
  }

  // 5. Flex/Grid container (+1)
  const display = getComputedStyle(element).display;
  if (display === 'flex' || display === 'grid' || display === 'inline-flex' || display === 'inline-grid') {
    score += 1;
  }

  // 6. Visual boundary: has its own background/padding different from parent (+1)
  const parent = element.parentElement;
  if (parent) {
    const computed = getComputedStyle(element);
    const parentComputed = getComputedStyle(parent);

    const hasBg = computed.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
      computed.backgroundColor !== 'transparent' &&
      computed.backgroundColor !== parentComputed.backgroundColor;
    const hasPadding = parseFloat(computed.paddingTop) > 0 || parseFloat(computed.paddingLeft) > 0;
    const hasBorder = computed.borderWidth !== '0px' && computed.borderStyle !== 'none';
    const hasShadow = computed.boxShadow !== 'none';

    if (hasBg) score += 1;
    if (hasPadding && (hasBg || hasBorder || hasShadow)) score += 1;
  }

  // 7. Shadow DOM boundary (+3)
  if (element.shadowRoot) {
    score += 3;
  }

  // 8. Has an ID attribute (+1)
  if (element.id) {
    score += 1;
  }

  return score;
}

/**
 * Determine if this element should be treated as a component root.
 * Threshold: score >= 2
 */
export function detectComponentBoundary(element: Element): BoundaryResult {
  const score = scoreComponentBoundary(element);
  return {
    isComponentRoot: score >= 2,
    componentScore: score,
  };
}

/**
 * Walk up from a clicked element to find the best component root.
 * Returns the highest-scoring ancestor within MAX_BOUNDARY_LEVELS.
 */
export function findComponentRoot(
  element: Element,
  maxLevels: number = MAX_BOUNDARY_LEVELS
): Element {
  let bestElement = element;
  let bestScore = scoreComponentBoundary(element);
  let current = element.parentElement;
  let level = 0;

  while (current && level < maxLevels && current !== document.body && current !== document.documentElement) {
    const score = scoreComponentBoundary(current);
    if (score > bestScore) {
      bestScore = score;
      bestElement = current;
    }
    current = current.parentElement;
    level++;
  }

  return bestElement;
}

/**
 * Expand selection up one level from current root
 */
export function expandBoundary(currentRoot: Element): Element {
  const parent = currentRoot.parentElement;
  if (parent && parent !== document.body && parent !== document.documentElement) {
    return parent;
  }
  return currentRoot;
}

/**
 * Contract selection to the most prominent child
 */
export function contractBoundary(currentRoot: Element): Element {
  let bestChild: Element | null = null;
  let bestScore = -1;

  for (const child of currentRoot.children) {
    const score = scoreComponentBoundary(child);
    if (score > bestScore) {
      bestScore = score;
      bestChild = child;
    }
  }

  // If no child has a score, pick the first child with children
  if (!bestChild) {
    for (const child of currentRoot.children) {
      if (child.children.length > 0) {
        bestChild = child;
        break;
      }
    }
  }

  return bestChild || currentRoot;
}
