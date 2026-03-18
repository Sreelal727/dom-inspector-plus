// ============================================================
// CSS-to-Tailwind Conversion Engine
// ============================================================

import type { ExtractedNode, ExtractedStyles } from '@/shared/types';

// Spacing scale (in px): value → Tailwind class number
const SPACING_SCALE: Record<number, string> = {
  0: '0', 1: 'px', 2: '0.5', 4: '1', 6: '1.5', 8: '2',
  10: '2.5', 12: '3', 14: '3.5', 16: '4', 20: '5', 24: '6',
  28: '7', 32: '8', 36: '9', 40: '10', 44: '11', 48: '12',
  56: '14', 64: '16', 72: '18', 80: '20', 96: '24',
  112: '28', 128: '32', 144: '36', 160: '40', 176: '44',
  192: '48', 208: '52', 224: '56', 240: '60', 256: '64',
  288: '72', 320: '80', 384: '96',
};

// Font size scale
const FONT_SIZE_SCALE: Record<string, string> = {
  '12px': 'text-xs', '14px': 'text-sm', '16px': 'text-base',
  '18px': 'text-lg', '20px': 'text-xl', '24px': 'text-2xl',
  '30px': 'text-3xl', '36px': 'text-4xl', '48px': 'text-5xl',
  '60px': 'text-6xl', '72px': 'text-7xl', '96px': 'text-8xl',
  '128px': 'text-9xl',
};

// Font weight scale
const FONT_WEIGHT_MAP: Record<string, string> = {
  '100': 'font-thin', '200': 'font-extralight', '300': 'font-light',
  '400': 'font-normal', '500': 'font-medium', '600': 'font-semibold',
  '700': 'font-bold', '800': 'font-extrabold', '900': 'font-black',
};

// Border radius scale
const BORDER_RADIUS_SCALE: Record<string, string> = {
  '0px': 'rounded-none', '2px': 'rounded-sm', '4px': 'rounded',
  '6px': 'rounded-md', '8px': 'rounded-lg', '12px': 'rounded-xl',
  '16px': 'rounded-2xl', '24px': 'rounded-3xl', '9999px': 'rounded-full',
};

// Common color mapping (hex → Tailwind)
const COMMON_COLORS: Record<string, string> = {
  '#000000': 'black', '#ffffff': 'white', '#f8fafc': 'slate-50',
  '#f1f5f9': 'slate-100', '#e2e8f0': 'slate-200', '#cbd5e1': 'slate-300',
  '#94a3b8': 'slate-400', '#64748b': 'slate-500', '#475569': 'slate-600',
  '#334155': 'slate-700', '#1e293b': 'slate-800', '#0f172a': 'slate-900',
  '#ef4444': 'red-500', '#f97316': 'orange-500', '#eab308': 'yellow-500',
  '#22c55e': 'green-500', '#3b82f6': 'blue-500', '#6366f1': 'indigo-500',
  '#8b5cf6': 'violet-500', '#a855f7': 'purple-500', '#ec4899': 'pink-500',
};

/**
 * Convert extracted styles to Tailwind classes
 */
export function mapStylesToTailwind(styles: ExtractedStyles): string[] {
  const classes: string[] = [];

  // Layout
  mapLayout(styles.layout, classes);
  // Typography
  mapTypography(styles.typography, classes);
  // Colors
  mapColors(styles.colors, classes);
  // Borders
  mapBorders(styles.borders, classes);
  // Spacing
  mapSpacing(styles.spacing, classes);
  // Effects
  mapEffects(styles.effects, classes);

  return classes;
}

function mapLayout(props: Record<string, string>, classes: string[]) {
  const displayMap: Record<string, string> = {
    'flex': 'flex', 'inline-flex': 'inline-flex',
    'grid': 'grid', 'inline-grid': 'inline-grid',
    'block': 'block', 'inline-block': 'inline-block',
    'inline': 'inline', 'none': 'hidden',
  };
  if (props['display']) classes.push(displayMap[props['display']] || `[display:${props['display']}]`);

  const posMap: Record<string, string> = {
    'relative': 'relative', 'absolute': 'absolute',
    'fixed': 'fixed', 'sticky': 'sticky',
  };
  if (props['position']) classes.push(posMap[props['position']] || '');

  // Flex properties
  const flexDirMap: Record<string, string> = {
    'row': 'flex-row', 'column': 'flex-col',
    'row-reverse': 'flex-row-reverse', 'column-reverse': 'flex-col-reverse',
  };
  if (props['flex-direction']) classes.push(flexDirMap[props['flex-direction']] || '');

  const justifyMap: Record<string, string> = {
    'flex-start': 'justify-start', 'flex-end': 'justify-end',
    'center': 'justify-center', 'space-between': 'justify-between',
    'space-around': 'justify-around', 'space-evenly': 'justify-evenly',
  };
  if (props['justify-content']) classes.push(justifyMap[props['justify-content']] || '');

  const alignMap: Record<string, string> = {
    'flex-start': 'items-start', 'flex-end': 'items-end',
    'center': 'items-center', 'baseline': 'items-baseline',
    'stretch': 'items-stretch',
  };
  if (props['align-items']) classes.push(alignMap[props['align-items']] || '');

  if (props['flex-wrap'] === 'wrap') classes.push('flex-wrap');
  if (props['flex-wrap'] === 'wrap-reverse') classes.push('flex-wrap-reverse');

  // Gap
  if (props['gap']) classes.push(spacingClass('gap', props['gap']));
  if (props['row-gap']) classes.push(spacingClass('gap-y', props['row-gap']));
  if (props['column-gap']) classes.push(spacingClass('gap-x', props['column-gap']));

  // Overflow
  const overflowMap: Record<string, string> = {
    'hidden': 'overflow-hidden', 'auto': 'overflow-auto',
    'scroll': 'overflow-scroll', 'visible': 'overflow-visible',
  };
  if (props['overflow']) classes.push(overflowMap[props['overflow']] || '');

  // Positioning values
  for (const side of ['top', 'right', 'bottom', 'left']) {
    if (props[side]) classes.push(spacingClass(side, props[side]));
  }

  // z-index
  const zMap: Record<string, string> = {
    '0': 'z-0', '10': 'z-10', '20': 'z-20', '30': 'z-30',
    '40': 'z-40', '50': 'z-50',
  };
  if (props['z-index']) classes.push(zMap[props['z-index']] || `z-[${props['z-index']}]`);

  // Grid
  if (props['grid-template-columns']) {
    const cols = props['grid-template-columns'];
    const colCount = cols.split(' ').length;
    if (cols === `repeat(${colCount}, minmax(0, 1fr))` || cols.split(' ').every(c => c === '1fr')) {
      classes.push(`grid-cols-${colCount}`);
    } else {
      classes.push(`grid-cols-[${cols.replace(/ /g, '_')}]`);
    }
  }
}

function mapTypography(props: Record<string, string>, classes: string[]) {
  if (props['font-size']) {
    classes.push(FONT_SIZE_SCALE[props['font-size']] || `text-[${props['font-size']}]`);
  }

  if (props['font-weight']) {
    classes.push(FONT_WEIGHT_MAP[props['font-weight']] || `font-[${props['font-weight']}]`);
  }

  if (props['line-height'] && props['font-size']) {
    const lh = parseFloat(props['line-height']);
    const fs = parseFloat(props['font-size']);
    if (lh && fs) {
      const ratio = lh / fs;
      if (Math.abs(ratio - 1) < 0.05) classes.push('leading-none');
      else if (Math.abs(ratio - 1.25) < 0.05) classes.push('leading-tight');
      else if (Math.abs(ratio - 1.375) < 0.05) classes.push('leading-snug');
      else if (Math.abs(ratio - 1.5) < 0.05) classes.push('leading-normal');
      else if (Math.abs(ratio - 1.625) < 0.05) classes.push('leading-relaxed');
      else if (Math.abs(ratio - 2) < 0.05) classes.push('leading-loose');
      else classes.push(`leading-[${props['line-height']}]`);
    }
  }

  if (props['letter-spacing']) {
    const lsMap: Record<string, string> = {
      '-0.05em': 'tracking-tighter', '-0.025em': 'tracking-tight',
      '0em': 'tracking-normal', '0.025em': 'tracking-wide',
      '0.05em': 'tracking-wider', '0.1em': 'tracking-widest',
    };
    classes.push(lsMap[props['letter-spacing']] || `tracking-[${props['letter-spacing']}]`);
  }

  const alignMap: Record<string, string> = {
    'left': 'text-left', 'center': 'text-center',
    'right': 'text-right', 'justify': 'text-justify',
  };
  if (props['text-align']) classes.push(alignMap[props['text-align']] || '');

  if (props['text-decoration'] && props['text-decoration'] !== 'none') {
    if (props['text-decoration'].includes('underline')) classes.push('underline');
    if (props['text-decoration'].includes('line-through')) classes.push('line-through');
  }

  if (props['text-transform']) {
    const ttMap: Record<string, string> = {
      'uppercase': 'uppercase', 'lowercase': 'lowercase',
      'capitalize': 'capitalize',
    };
    classes.push(ttMap[props['text-transform']] || '');
  }

  if (props['white-space'] === 'nowrap') classes.push('whitespace-nowrap');
  if (props['text-overflow'] === 'ellipsis') classes.push('truncate');
}

function mapColors(props: Record<string, string>, classes: string[]) {
  if (props['color']) classes.push(colorClass('text', props['color']));
  if (props['background-color']) classes.push(colorClass('bg', props['background-color']));
  if (props['opacity'] && props['opacity'] !== '1') {
    const pct = Math.round(parseFloat(props['opacity']) * 100);
    classes.push(`opacity-${pct}`);
  }
}

function mapBorders(props: Record<string, string>, classes: string[]) {
  // Border radius
  if (props['border-radius']) {
    const r = props['border-radius'];
    classes.push(BORDER_RADIUS_SCALE[r] || `rounded-[${r}]`);
  }
  for (const [prop, suffix] of [
    ['border-top-left-radius', 'tl'], ['border-top-right-radius', 'tr'],
    ['border-bottom-left-radius', 'bl'], ['border-bottom-right-radius', 'br'],
  ] as const) {
    if (props[prop] && !props['border-radius']) {
      classes.push(BORDER_RADIUS_SCALE[props[prop]]?.replace('rounded', `rounded-${suffix}`) || `rounded-${suffix}-[${props[prop]}]`);
    }
  }

  // Border width
  if (props['border-width']) {
    const w = props['border-width'];
    if (w === '1px') classes.push('border');
    else if (w === '2px') classes.push('border-2');
    else if (w === '4px') classes.push('border-4');
    else if (w === '8px') classes.push('border-8');
    else classes.push(`border-[${w}]`);
  }

  // Border color
  if (props['border-color']) classes.push(colorClass('border', props['border-color']));

  // Border style
  if (props['border-style'] && props['border-style'] !== 'solid') {
    classes.push(`border-${props['border-style']}`);
  }

  // Outline
  if (props['outline-style'] === 'none') classes.push('outline-none');
}

function mapSpacing(props: Record<string, string>, classes: string[]) {
  // Width / Height
  const sizeMap: Record<string, string> = {
    '100%': 'full', '100vw': 'screen', '100vh': 'screen',
    'auto': 'auto', 'min-content': 'min', 'max-content': 'max',
    'fit-content': 'fit',
  };

  if (props['width']) classes.push(`w-${sizeMap[props['width']] || spacingValue(props['width'])}`);
  if (props['height']) classes.push(`h-${sizeMap[props['height']] || spacingValue(props['height'])}`);
  if (props['min-width']) classes.push(`min-w-${sizeMap[props['min-width']] || spacingValue(props['min-width'])}`);
  if (props['max-width']) {
    const mwMap: Record<string, string> = {
      'none': 'max-w-none', '320px': 'max-w-xs', '384px': 'max-w-sm',
      '448px': 'max-w-md', '512px': 'max-w-lg', '576px': 'max-w-xl',
      '672px': 'max-w-2xl', '768px': 'max-w-3xl', '896px': 'max-w-4xl',
      '1024px': 'max-w-5xl', '1152px': 'max-w-6xl', '1280px': 'max-w-7xl',
    };
    classes.push(mwMap[props['max-width']] || `max-w-[${props['max-width']}]`);
  }

  // Margin
  mapBoxSpacing('m', props, classes, ['margin-top', 'margin-right', 'margin-bottom', 'margin-left']);
  // Padding
  mapBoxSpacing('p', props, classes, ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']);
}

function mapBoxSpacing(prefix: string, props: Record<string, string>, classes: string[], sides: string[]) {
  const values = sides.map(s => props[s]).filter(Boolean);
  if (values.length === 0) return;

  const [top, right, bottom, left] = sides.map(s => props[s] || '0px');

  if (top === right && right === bottom && bottom === left && top !== '0px') {
    classes.push(spacingClass(prefix, top));
  } else {
    if (top === bottom && left === right && top !== '0px' && left !== '0px') {
      classes.push(spacingClass(`${prefix}y`, top));
      classes.push(spacingClass(`${prefix}x`, left));
    } else {
      if (top && top !== '0px') classes.push(spacingClass(`${prefix}t`, top));
      if (right && right !== '0px') classes.push(spacingClass(`${prefix}r`, right));
      if (bottom && bottom !== '0px') classes.push(spacingClass(`${prefix}b`, bottom));
      if (left && left !== '0px') classes.push(spacingClass(`${prefix}l`, left));
    }
  }
}

function mapEffects(props: Record<string, string>, classes: string[]) {
  if (props['box-shadow'] && props['box-shadow'] !== 'none') {
    const shadow = props['box-shadow'];
    if (shadow.includes('0 1px 2px')) classes.push('shadow-sm');
    else if (shadow.includes('0 1px 3px')) classes.push('shadow');
    else if (shadow.includes('0 4px 6px')) classes.push('shadow-md');
    else if (shadow.includes('0 10px 15px')) classes.push('shadow-lg');
    else if (shadow.includes('0 20px 25px')) classes.push('shadow-xl');
    else if (shadow.includes('0 25px 50px')) classes.push('shadow-2xl');
    else classes.push(`shadow-[${shadow.replace(/ /g, '_')}]`);
  }

  if (props['transform'] && props['transform'] !== 'none') {
    const t = props['transform'];
    if (t.includes('scale')) {
      const match = t.match(/scale\(([^)]+)\)/);
      if (match) {
        const val = Math.round(parseFloat(match[1]) * 100);
        classes.push(`scale-${val}`);
      }
    }
    if (t.includes('rotate')) {
      const match = t.match(/rotate\(([^)]+)\)/);
      if (match) classes.push(`rotate-[${match[1]}]`);
    }
    if (t.includes('translate')) {
      const match = t.match(/translate(?:X|Y)?\(([^)]+)\)/);
      if (match) classes.push(`translate-[${match[1]}]`);
    }
  }

  if (props['cursor']) {
    const cursorMap: Record<string, string> = {
      'pointer': 'cursor-pointer', 'not-allowed': 'cursor-not-allowed',
      'wait': 'cursor-wait', 'text': 'cursor-text', 'move': 'cursor-move',
      'grab': 'cursor-grab', 'grabbing': 'cursor-grabbing',
    };
    if (cursorMap[props['cursor']]) classes.push(cursorMap[props['cursor']]);
  }

  if (props['pointer-events'] === 'none') classes.push('pointer-events-none');
  if (props['user-select'] === 'none') classes.push('select-none');
}

// Helpers

function spacingClass(prefix: string, value: string): string {
  const px = parseFloat(value);
  if (isNaN(px)) return `${prefix}-[${value}]`;
  const tw = SPACING_SCALE[px];
  if (tw !== undefined) return `${prefix}-${tw}`;
  return `${prefix}-[${value}]`;
}

function spacingValue(value: string): string {
  const px = parseFloat(value);
  if (isNaN(px)) return `[${value}]`;
  const tw = SPACING_SCALE[px];
  if (tw !== undefined) return tw;
  return `[${value}]`;
}

function colorClass(prefix: string, value: string): string {
  // Try hex match
  const hex = rgbToHex(value);
  if (hex && COMMON_COLORS[hex]) {
    return `${prefix}-${COMMON_COLORS[hex]}`;
  }
  // Arbitrary
  if (value.startsWith('rgb')) {
    return `${prefix}-[${value.replace(/ /g, '_')}]`;
  }
  return `${prefix}-[${value}]`;
}

function rgbToHex(color: string): string | null {
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    return null;
  }
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Apply Tailwind class mapping to a full extraction tree
 */
export function applyTailwindMapping(node: ExtractedNode): void {
  node.tailwindClasses = mapStylesToTailwind(node.styles);
  for (const child of node.children) {
    applyTailwindMapping(child);
  }
}
