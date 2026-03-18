// ============================================================
// Style Extractor — Computed styles with default-diffing
// ============================================================

import { STYLE_CATEGORIES } from '@/shared/constants';
import type { ExtractedStyles, PseudoElementStyles } from '@/shared/types';

// Browser default styles per element type (populated lazily)
const defaultStyleCache = new Map<string, Record<string, string>>();

/**
 * Get browser default computed styles for a given tag by creating
 * a temporary element in an iframe.
 */
function getDefaultStyles(tagName: string): Record<string, string> {
  const cached = defaultStyleCache.get(tagName);
  if (cached) return cached;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;visibility:hidden;';
  document.documentElement.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;
  const el = iframeDoc.createElement(tagName);
  iframeDoc.body.appendChild(el);

  const defaultComputed = iframeDoc.defaultView!.getComputedStyle(el);
  const defaults: Record<string, string> = {};

  const allProps = getAllTrackedProperties();
  for (const prop of allProps) {
    defaults[prop] = defaultComputed.getPropertyValue(prop);
  }

  iframe.remove();
  defaultStyleCache.set(tagName, defaults);
  return defaults;
}

/** Get all CSS properties we track across all categories */
function getAllTrackedProperties(): string[] {
  return Object.values(STYLE_CATEGORIES).flat();
}

/**
 * Extract styles from an element, diffing against browser defaults.
 * Returns only the non-default, meaningful styles.
 */
export function extractStyles(element: Element): ExtractedStyles {
  const computed = getComputedStyle(element);
  const tagName = element.tagName.toLowerCase();
  const defaults = getDefaultStyles(tagName);

  const result: ExtractedStyles = {
    layout: {},
    typography: {},
    colors: {},
    borders: {},
    spacing: {},
    effects: {},
    customProperties: {},
    all: {},
  };

  // Extract each category, only including non-default values
  for (const [category, props] of Object.entries(STYLE_CATEGORIES)) {
    for (const prop of props) {
      const value = computed.getPropertyValue(prop);
      const defaultValue = defaults[prop] || '';

      if (value && value !== defaultValue && value !== 'none' && value !== 'normal' && value !== 'auto') {
        // Skip zero values for spacing
        if (category === 'spacing' && (value === '0px' || value === '0')) continue;
        // Skip transparent colors
        if (category === 'colors' && (value === 'rgba(0, 0, 0, 0)' || value === 'transparent')) continue;

        (result as unknown as Record<string, Record<string, string>>)[category][prop] = value;
        result.all[prop] = value;
      }
    }
  }

  // Extract CSS custom properties
  extractCustomProperties(element, result);

  return result;
}

/**
 * Walk up the DOM tree to find CSS custom properties (CSS variables)
 */
function extractCustomProperties(element: Element, result: ExtractedStyles): void {
  // Try to get custom properties from stylesheets
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith('--')) {
                const value = rule.style.getPropertyValue(prop).trim();
                if (value) {
                  result.customProperties[prop] = value;
                }
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheet, skip
      }
    }
  } catch {
    // Graceful degradation
  }

  // Also check inline custom properties on the element and ancestors
  let current: Element | null = element;
  let depth = 0;
  while (current && depth < 10) {
    const style = (current as HTMLElement).style;
    if (style) {
      for (let i = 0; i < style.length; i++) {
        const prop = style[i];
        if (prop.startsWith('--') && !result.customProperties[prop]) {
          result.customProperties[prop] = style.getPropertyValue(prop).trim();
        }
      }
    }
    current = current.parentElement;
    depth++;
  }
}

/**
 * Extract pseudo-element styles (::before, ::after)
 */
export function extractPseudoStyles(element: Element): PseudoElementStyles | undefined {
  const result: PseudoElementStyles = {};
  let hasPseudo = false;

  for (const pseudo of ['::before', '::after'] as const) {
    const computed = getComputedStyle(element, pseudo);
    const content = computed.getPropertyValue('content');

    // Only include if pseudo-element has content
    if (content && content !== 'none' && content !== 'normal') {
      const styles: Record<string, string> = { content };
      const key = pseudo === '::before' ? 'before' : 'after';

      // Get a few key properties
      const propsToCheck = [
        'display', 'position', 'width', 'height',
        'background-color', 'color', 'font-size',
        'border-radius', 'top', 'left', 'right', 'bottom',
        'transform',
      ];

      for (const prop of propsToCheck) {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
          styles[prop] = value;
        }
      }

      result[key] = styles;
      hasPseudo = true;
    }
  }

  return hasPseudo ? result : undefined;
}

/**
 * Extract styles as a simple diff from parent element
 * (for detecting what's unique about this element vs inherited)
 */
export function extractStyleDiffFromParent(
  element: Element,
  parentElement: Element | null
): Record<string, string> {
  if (!parentElement) return {};

  const computed = getComputedStyle(element);
  const parentComputed = getComputedStyle(parentElement);
  const diff: Record<string, string> = {};

  // Only check inheritable properties
  const inheritableProps = [
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-transform',
    'white-space', 'word-spacing', 'cursor',
  ];

  for (const prop of inheritableProps) {
    const value = computed.getPropertyValue(prop);
    const parentValue = parentComputed.getPropertyValue(prop);
    if (value !== parentValue) {
      diff[prop] = value;
    }
  }

  return diff;
}
