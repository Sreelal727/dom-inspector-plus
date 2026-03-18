// ============================================================
// DOM Walker — Tree traversal + subtree extraction
// ============================================================

import { MAX_SUBTREE_NODES, MAX_TEXT_LENGTH } from '@/shared/constants';
import type { ExtractedNode, AccessibilityInfo, NodeId } from '@/shared/types';
import { extractStyles, extractPseudoStyles } from './style-extractor';
import { analyzeLayout } from './layout-analyzer';
import { extractAssets } from './asset-extractor';
import { extractAnimations } from './interaction-capture';
import { detectComponentBoundary } from '@/lib/component-boundary';

let nodeCounter = 0;

function generateNodeId(): NodeId {
  return `node_${++nodeCounter}`;
}

// Map from NodeId back to DOM element for interaction capture
const nodeElementMap = new WeakMap<object, Element>();
const idToKeyMap = new Map<NodeId, object>();

export function getElementForNodeId(nodeId: NodeId): Element | undefined {
  const key = idToKeyMap.get(nodeId);
  if (key) return nodeElementMap.get(key);
  return undefined;
}

/**
 * Walk a DOM subtree and extract all relevant data from each node.
 * Respects the MAX_SUBTREE_NODES limit.
 */
export function walkSubtree(
  root: Element,
  maxNodes: number = MAX_SUBTREE_NODES
): ExtractedNode {
  nodeCounter = 0;
  idToKeyMap.clear();
  return extractNode(root, maxNodes, { count: 0 });
}

function extractNode(
  element: Element,
  maxNodes: number,
  counter: { count: number }
): ExtractedNode {
  counter.count++;
  const id = generateNodeId();

  // Store element reference for later interaction capture
  const key = {};
  nodeElementMap.set(key, element);
  idToKeyMap.set(id, key);

  const tagName = element.tagName.toLowerCase();
  const classNames = Array.from(element.classList);
  const attributes = extractAttributes(element);
  const textContent = getDirectTextContent(element);
  const styles = extractStyles(element);
  const layout = analyzeLayout(element);
  const rect = element.getBoundingClientRect();
  const pseudoElements = extractPseudoStyles(element);
  const accessibility = extractAccessibility(element);
  const assets = extractAssets(element);
  const animations = extractAnimations(element);
  const { isComponentRoot, componentScore } = detectComponentBoundary(element);

  // Recursively extract children (respecting node limit)
  const children: ExtractedNode[] = [];
  if (counter.count < maxNodes) {
    for (const child of element.children) {
      if (counter.count >= maxNodes) break;
      // Skip our own overlay
      if ((child as HTMLElement).id === '__dom-inspector-plus-overlay__') continue;
      children.push(extractNode(child, maxNodes, counter));
    }
  }

  return {
    id,
    tagName,
    classNames,
    attributes,
    textContent,
    styles,
    tailwindClasses: [], // Populated later by tailwind mapper
    layout,
    boundingRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    children,
    pseudoElements,
    accessibility,
    assets,
    animations,
    isComponentRoot,
    componentScore,
  };
}

function extractAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  const keepAttrs = [
    'id', 'href', 'src', 'alt', 'title', 'type', 'name', 'value',
    'placeholder', 'role', 'tabindex', 'target', 'rel',
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden',
    'aria-expanded', 'aria-controls', 'aria-selected', 'aria-checked',
  ];

  for (const attr of keepAttrs) {
    if (element.hasAttribute(attr)) {
      attrs[attr] = element.getAttribute(attr) || '';
    }
  }

  // Include data-* attributes (they often carry semantic meaning)
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && !attrs[attr.name]) {
      attrs[attr.name] = attr.value;
    }
  }

  return attrs;
}

function getDirectTextContent(element: Element): string {
  // Get only direct text nodes, not from children
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    }
  }
  text = text.trim();
  if (text.length > MAX_TEXT_LENGTH) {
    text = text.slice(0, MAX_TEXT_LENGTH) + '...';
  }
  return text;
}

function extractAccessibility(element: Element): AccessibilityInfo {
  return {
    role: element.getAttribute('role') || '',
    ariaLabel: element.getAttribute('aria-label') || '',
    ariaLabelledBy: element.getAttribute('aria-labelledby') || '',
    ariaDescribedBy: element.getAttribute('aria-describedby') || '',
    tabIndex: element.hasAttribute('tabindex')
      ? parseInt(element.getAttribute('tabindex') || '0', 10)
      : null,
    alt: element.getAttribute('alt') || '',
    semanticTag: getSemanticTag(element),
  };
}

function getSemanticTag(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const semanticTags = [
    'header', 'footer', 'nav', 'main', 'article', 'section',
    'aside', 'figure', 'figcaption', 'details', 'summary',
    'dialog', 'form', 'button', 'a', 'input', 'select', 'textarea',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'label', 'fieldset', 'legend', 'time', 'mark', 'abbr',
  ];
  return semanticTags.includes(tag) ? tag : '';
}

/**
 * Count total nodes in an extraction tree
 */
export function countNodes(node: ExtractedNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}
