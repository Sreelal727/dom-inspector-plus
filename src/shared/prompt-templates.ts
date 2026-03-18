// ============================================================
// AI Prompt Generation Templates
// ============================================================

import type {
  ComponentExtraction, ExtractedNode, ExportFormat,
  InteractionStateDiff, DesignTokens,
} from './types';

/**
 * Generate output in the requested format
 */
export function generateExport(
  extraction: ComponentExtraction,
  format: ExportFormat
): string {
  switch (format) {
    case 'ai-prompt': return generateAIPrompt(extraction);
    case 'json': return generateJSON(extraction);
    case 'react-jsx': return generateReactJSX(extraction);
    case 'html-css': return generateHTMLCSS(extraction);
    case 'tailwind-only': return generateTailwindOnly(extraction);
  }
}

// ---- Format 1: AI Prompt (Natural Language) ----

function generateAIPrompt(extraction: ComponentExtraction): string {
  const { rootNode, designTokens, interactionStates } = extraction;
  const sections: string[] = [];

  sections.push('Recreate this UI component:\n');

  // Structure
  sections.push('## Structure');
  sections.push(describeStructure(rootNode, 0));

  // Layout
  sections.push('\n## Layout');
  sections.push(describeLayoutSection(rootNode));

  // Styles
  sections.push('\n## Styles');
  sections.push(describeStyles(rootNode, 0));

  // Colors
  if (designTokens.colors.length > 0) {
    sections.push('\n## Colors');
    sections.push(
      designTokens.colors
        .slice(0, 8)
        .map(c => `${c.usage}: ${c.value}`)
        .join(' | ')
    );
  }

  // Interactions
  if (interactionStates.length > 0) {
    sections.push('\n## Interactions');
    for (const state of interactionStates) {
      sections.push(state.description);
    }
  }

  // Accessibility
  const a11y = describeAccessibility(rootNode);
  if (a11y) {
    sections.push('\n## Accessibility');
    sections.push(a11y);
  }

  // Animations
  const anims = describeAnimations(rootNode);
  if (anims) {
    sections.push('\n## Animations');
    sections.push(anims);
  }

  return sections.join('\n');
}

function describeStructure(node: ExtractedNode, depth: number): string {
  const indent = '  '.repeat(depth);
  const prefix = depth === 0 ? '' : '- ';
  let desc = `${indent}${prefix}`;

  // Tag + semantic info
  const tag = node.tagName;
  const role = node.accessibility.role;
  const semantic = node.accessibility.semanticTag;

  if (semantic) {
    desc += `<${semantic}>`;
  } else {
    desc += `<${tag}>`;
  }

  // Describe what this element is
  if (node.textContent) {
    const text = node.textContent.length > 60
      ? node.textContent.slice(0, 60) + '...'
      : node.textContent;
    desc += ` "${text}"`;
  }
  if (role) desc += ` (role=${role})`;

  // Asset descriptions
  for (const asset of node.assets) {
    if (asset.type === 'image') desc += ` [image: ${asset.meta.alt || 'no alt'}]`;
    if (asset.type === 'svg') desc += ` [SVG icon]`;
    if (asset.type === 'icon-font') desc += ` [${asset.meta.library} icon]`;
  }

  if (node.classNames.length > 0) {
    desc += ` (${node.classNames.slice(0, 3).join(' ')})`;
  }

  let result = desc + '\n';

  for (const child of node.children) {
    result += describeStructure(child, depth + 1);
  }

  return result;
}

function describeLayoutSection(node: ExtractedNode): string {
  const parts: string[] = [];

  const { layout, styles } = node;

  if (layout.flex) {
    const dir = layout.flex.direction === 'column' ? 'vertical' : 'horizontal';
    parts.push(`${dir} flex`);
    if (layout.flex.gap && layout.flex.gap !== 'normal' && layout.flex.gap !== '0px') {
      parts.push(`${layout.flex.gap} gap`);
    }
    if (layout.flex.justifyContent !== 'normal') parts.push(`justify: ${layout.flex.justifyContent}`);
    if (layout.flex.alignItems !== 'normal') parts.push(`align: ${layout.flex.alignItems}`);
  } else if (layout.grid) {
    parts.push('Grid layout');
    if (layout.grid.templateColumns !== 'none') parts.push(`columns: ${layout.grid.templateColumns}`);
    if (layout.grid.gap !== 'normal') parts.push(`gap: ${layout.grid.gap}`);
  }

  // Padding
  const padding = styles.spacing['padding-top'] || styles.spacing['padding'];
  if (padding) {
    const pt = styles.spacing['padding-top'] || '0';
    const pr = styles.spacing['padding-right'] || '0';
    const pb = styles.spacing['padding-bottom'] || '0';
    const pl = styles.spacing['padding-left'] || '0';
    if (pt === pr && pr === pb && pb === pl) {
      parts.push(`${pt} padding`);
    } else {
      parts.push(`padding: ${pt} ${pr} ${pb} ${pl}`);
    }
  }

  return parts.join(', ') + '.';
}

function describeStyles(node: ExtractedNode, depth: number): string {
  const indent = '  '.repeat(depth);
  const parts: string[] = [];

  const label = node.tagName + (node.classNames[0] ? `.${node.classNames[0]}` : '');
  const styleDescriptions: string[] = [];

  // Typography
  if (node.styles.typography['font-size']) {
    const fs = node.styles.typography['font-size'];
    const lh = node.styles.typography['line-height'] || '';
    const fw = node.styles.typography['font-weight'] || '';
    const ff = node.styles.typography['font-family']?.split(',')[0]?.trim() || '';

    let typo = `${fs}`;
    if (lh) typo += `/${lh}`;
    if (fw) typo += ` ${weightToName(fw)}`;
    if (ff) typo += ` ${ff}`;
    styleDescriptions.push(typo);
  }

  // Colors
  if (node.styles.colors['color']) styleDescriptions.push(`color: ${node.styles.colors['color']}`);
  if (node.styles.colors['background-color']) {
    styleDescriptions.push(`bg: ${node.styles.colors['background-color']}`);
  }

  // Borders
  if (node.styles.borders['border-radius']) {
    styleDescriptions.push(`rounded: ${node.styles.borders['border-radius']}`);
  }

  // Shadows
  if (node.styles.effects['box-shadow']) {
    styleDescriptions.push(`shadow: ${node.styles.effects['box-shadow']}`);
  }

  if (styleDescriptions.length > 0) {
    parts.push(`${indent}${label}: ${styleDescriptions.join(', ')}`);
  }

  for (const child of node.children) {
    const childStyles = describeStyles(child, depth + 1);
    if (childStyles) parts.push(childStyles);
  }

  return parts.join('\n');
}

function describeAccessibility(node: ExtractedNode): string {
  const parts: string[] = [];

  function walk(n: ExtractedNode) {
    const { accessibility } = n;
    if (accessibility.semanticTag) parts.push(`Semantic <${accessibility.semanticTag}>`);
    if (accessibility.role) parts.push(`role="${accessibility.role}"`);
    if (accessibility.ariaLabel) parts.push(`aria-label="${accessibility.ariaLabel}"`);
    if (accessibility.alt) parts.push(`alt="${accessibility.alt}"`);
    if (accessibility.tabIndex !== null) parts.push(`tabindex=${accessibility.tabIndex}`);
    for (const child of n.children) walk(child);
  }

  walk(node);
  // Deduplicate
  return [...new Set(parts)].join(', ');
}

function describeAnimations(node: ExtractedNode): string {
  const descriptions: string[] = [];

  function walk(n: ExtractedNode) {
    for (const anim of n.animations) {
      descriptions.push(anim.description);
    }
    for (const child of n.children) walk(child);
  }

  walk(node);
  return descriptions.join('\n');
}

function weightToName(w: string): string {
  const map: Record<string, string> = {
    '100': 'thin', '200': 'extra-light', '300': 'light',
    '400': 'regular', '500': 'medium', '600': 'semibold',
    '700': 'bold', '800': 'extra-bold', '900': 'black',
  };
  return map[w] || w;
}

// ---- Format 2: Structured JSON ----

function generateJSON(extraction: ComponentExtraction): string {
  return JSON.stringify(extraction, null, 2);
}

// ---- Format 3: React JSX Skeleton ----

function generateReactJSX(extraction: ComponentExtraction): string {
  const { rootNode } = extraction;
  const lines: string[] = [];

  lines.push('export default function Component() {');
  lines.push('  return (');
  lines.push(nodeToJSX(rootNode, 4));
  lines.push('  );');
  lines.push('}');

  return lines.join('\n');
}

function nodeToJSX(node: ExtractedNode, indent: number): string {
  const pad = ' '.repeat(indent);
  const tag = mapToReactTag(node);
  const classes = node.tailwindClasses.filter(Boolean).join(' ');
  const classAttr = classes ? ` className="${classes}"` : '';

  // Self-closing tags
  if (['img', 'input', 'br', 'hr'].includes(node.tagName)) {
    const attrs = buildJSXAttrs(node);
    return `${pad}<${tag}${classAttr}${attrs} />`;
  }

  if (node.children.length === 0 && node.textContent) {
    return `${pad}<${tag}${classAttr}>${escapeJSX(node.textContent)}</${tag}>`;
  }

  const lines: string[] = [];
  lines.push(`${pad}<${tag}${classAttr}>`);

  if (node.textContent && node.children.length === 0) {
    lines.push(`${pad}  ${escapeJSX(node.textContent)}`);
  }

  for (const child of node.children) {
    lines.push(nodeToJSX(child, indent + 2));
  }

  lines.push(`${pad}</${tag}>`);
  return lines.join('\n');
}

function mapToReactTag(node: ExtractedNode): string {
  return node.tagName;
}

function buildJSXAttrs(node: ExtractedNode): string {
  const attrs: string[] = [];
  if (node.attributes.src) attrs.push(`src="${node.attributes.src}"`);
  if (node.attributes.alt) attrs.push(`alt="${node.attributes.alt}"`);
  if (node.attributes.href) attrs.push(`href="${node.attributes.href}"`);
  if (node.attributes.type) attrs.push(`type="${node.attributes.type}"`);
  if (node.attributes.placeholder) attrs.push(`placeholder="${node.attributes.placeholder}"`);
  return attrs.length > 0 ? ' ' + attrs.join(' ') : '';
}

function escapeJSX(text: string): string {
  return text.replace(/[{}<>&]/g, c => {
    const map: Record<string, string> = { '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;', '&': '&amp;' };
    return map[c] || c;
  });
}

// ---- Format 4: HTML + CSS ----

function generateHTMLCSS(extraction: ComponentExtraction): string {
  const { rootNode } = extraction;
  const cssRules: string[] = [];
  const html = nodeToHTML(rootNode, 0, cssRules);

  let output = '<style>\n';
  output += cssRules.join('\n\n');
  output += '\n</style>\n\n';
  output += html;
  return output;
}

function nodeToHTML(node: ExtractedNode, indent: number, cssRules: string[]): string {
  const pad = ' '.repeat(indent);
  const tag = node.tagName;
  const className = `el-${node.id.replace('node_', '')}`;

  // Generate CSS rule
  const styleEntries = Object.entries(node.styles.all);
  if (styleEntries.length > 0) {
    let rule = `.${className} {\n`;
    for (const [prop, value] of styleEntries) {
      rule += `  ${prop}: ${value};\n`;
    }
    rule += '}';
    cssRules.push(rule);
  }

  const attrs = [`class="${className}"`];
  if (node.attributes.href) attrs.push(`href="${node.attributes.href}"`);
  if (node.attributes.src) attrs.push(`src="${node.attributes.src}"`);
  if (node.attributes.alt) attrs.push(`alt="${node.attributes.alt}"`);

  if (['img', 'input', 'br', 'hr'].includes(tag)) {
    return `${pad}<${tag} ${attrs.join(' ')} />`;
  }

  const lines: string[] = [];
  lines.push(`${pad}<${tag} ${attrs.join(' ')}>`);

  if (node.textContent && node.children.length === 0) {
    lines.push(`${pad}  ${node.textContent}`);
  }

  for (const child of node.children) {
    lines.push(nodeToHTML(child, indent + 2, cssRules));
  }

  lines.push(`${pad}</${tag}>`);
  return lines.join('\n');
}

// ---- Format 5: Tailwind Only ----

function generateTailwindOnly(extraction: ComponentExtraction): string {
  const lines: string[] = [];
  collectTailwind(extraction.rootNode, 0, lines);
  return lines.join('\n');
}

function collectTailwind(node: ExtractedNode, depth: number, lines: string[]) {
  const indent = '  '.repeat(depth);
  const tag = node.tagName;
  const tw = node.tailwindClasses.filter(Boolean).join(' ');
  lines.push(`${indent}<${tag}> ${tw}`);

  for (const child of node.children) {
    collectTailwind(child, depth + 1, lines);
  }
}
