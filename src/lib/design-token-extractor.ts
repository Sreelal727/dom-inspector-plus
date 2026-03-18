// ============================================================
// Design Token Extractor — Extract design system from a page
// ============================================================

import type { DesignTokens } from '@/shared/types';

/**
 * Scan visible elements on the page and extract design tokens:
 * colors, typography, spacing, border-radius, shadows.
 */
export function extractDesignTokens(): DesignTokens {
  const colorMap = new Map<string, { count: number; usages: Set<string> }>();
  const fontMap = new Map<string, { count: number; usage: string }>();
  const spacingMap = new Map<string, number>();
  const radiusMap = new Map<string, number>();
  const shadowMap = new Map<string, number>();

  // Walk visible elements
  const elements = document.querySelectorAll('body *');
  for (const el of elements) {
    // Skip invisible elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const computed = getComputedStyle(el);

    // Colors
    trackColor(computed.color, 'text', colorMap);
    trackColor(computed.backgroundColor, 'background', colorMap);
    trackColor(computed.borderColor, 'border', colorMap);

    // Typography
    const fontKey = `${computed.fontFamily}|${computed.fontSize}|${computed.fontWeight}|${computed.lineHeight}`;
    const existing = fontMap.get(fontKey);
    if (existing) {
      existing.count++;
    } else {
      fontMap.set(fontKey, {
        count: 1,
        usage: describeTypoUsage(el),
      });
    }

    // Spacing (padding and gap)
    for (const prop of ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'gap']) {
      const val = computed.getPropertyValue(prop);
      if (val && val !== '0px' && val !== 'normal') {
        spacingMap.set(val, (spacingMap.get(val) || 0) + 1);
      }
    }

    // Border radius
    const br = computed.borderRadius;
    if (br && br !== '0px') {
      radiusMap.set(br, (radiusMap.get(br) || 0) + 1);
    }

    // Box shadow
    const bs = computed.boxShadow;
    if (bs && bs !== 'none') {
      shadowMap.set(bs, (shadowMap.get(bs) || 0) + 1);
    }
  }

  return {
    colors: processColors(colorMap),
    typography: processTypography(fontMap),
    spacing: mapToSorted(spacingMap),
    borderRadius: mapToSorted(radiusMap),
    shadows: mapToSorted(shadowMap),
  };
}

function trackColor(
  value: string,
  usage: string,
  map: Map<string, { count: number; usages: Set<string> }>
) {
  if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') return;

  const normalized = normalizeColor(value);
  if (!normalized) return;

  const existing = map.get(normalized);
  if (existing) {
    existing.count++;
    existing.usages.add(usage);
  } else {
    map.set(normalized, { count: 1, usages: new Set([usage]) });
  }
}

function normalizeColor(color: string): string | null {
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return color;
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function processColors(
  map: Map<string, { count: number; usages: Set<string> }>
): DesignTokens['colors'] {
  return Array.from(map.entries())
    .filter(([_, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([value, { count, usages }]) => ({
      value,
      usage: Array.from(usages).join(', '),
      count,
    }));
}

function processTypography(
  map: Map<string, { count: number; usage: string }>
): DesignTokens['typography'] {
  return Array.from(map.entries())
    .filter(([_, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([key, { usage }]) => {
      const [family, size, weight, lineHeight] = key.split('|');
      return { family, size, weight, lineHeight, usage };
    });
}

function mapToSorted(map: Map<string, number>): Array<{ value: string; count: number }> {
  return Array.from(map.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([value, count]) => ({ value, count }));
}

function describeTypoUsage(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return `heading (${tag})`;
  if (tag === 'p') return 'body text';
  if (tag === 'a') return 'link';
  if (tag === 'button') return 'button';
  if (tag === 'span') return 'inline text';
  if (tag === 'label') return 'label';
  if (tag === 'li') return 'list item';
  return tag;
}
