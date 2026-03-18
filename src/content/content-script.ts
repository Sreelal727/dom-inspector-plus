// ============================================================
// Content Script — Orchestrates DOM inspection on the page
// ============================================================

import { HOVER_THROTTLE_MS } from '@/shared/constants';
import type {
  Message, ComponentExtraction, ExtractedNode, InteractionState,
  InteractionStateDiff,
} from '@/shared/types';
import { showHighlight, hideHighlight, removeOverlay, isOverlayElement } from './highlight-overlay';
import { walkSubtree, countNodes, getElementForNodeId } from './dom-walker';
import { applyTailwindMapping } from '@/lib/css-to-tailwind';
import { findComponentRoot, expandBoundary, contractBoundary } from '@/lib/component-boundary';
import { captureInteractionState } from './interaction-capture';
import { extractDesignTokens } from '@/lib/design-token-extractor';
import { startBridge } from './mcp-bridge-client';

let isInspecting = false;
let hoveredElement: Element | null = null;
let selectedElement: Element | null = null;
let currentRoot: Element | null = null;
let lastHoverTime = 0;

// ---- Throttled hover handler ----

function onMouseMove(e: MouseEvent) {
  if (!isInspecting) return;

  const now = Date.now();
  if (now - lastHoverTime < HOVER_THROTTLE_MS) return;
  lastHoverTime = now;

  const target = e.target as Element;
  if (!target || isOverlayElement(target)) return;
  if (target === hoveredElement) return;

  hoveredElement = target;
  showHighlight(target, false);
}

function onMouseLeave() {
  if (!isInspecting) return;
  hideHighlight();
  hoveredElement = null;
}

// ---- Click handler: full extraction ----

function onClick(e: MouseEvent) {
  if (!isInspecting) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const target = e.target as Element;
  if (!target || isOverlayElement(target)) return;

  selectedElement = target;

  // Find component root
  currentRoot = findComponentRoot(target);
  showHighlight(currentRoot, true);

  // Extract
  performExtraction(currentRoot);
}

async function performExtraction(root: Element) {
  const rootNode = walkSubtree(root);

  // Apply Tailwind mapping
  applyTailwindMapping(rootNode);

  // Extract design tokens from the subtree
  const designTokens = extractLocalDesignTokens(rootNode);

  const extraction: ComponentExtraction = {
    timestamp: Date.now(),
    url: window.location.href,
    pageTitle: document.title,
    rootNode,
    nodeCount: countNodes(rootNode),
    designTokens,
    interactionStates: [],
    mode: 'component',
  };

  // Send to service worker (may fail if service worker is inactive)
  chrome.runtime.sendMessage({
    type: 'INSPECTION_RESULT',
    payload: extraction,
  } as Message<ComponentExtraction>).catch(() => {});
}

function extractLocalDesignTokens(node: ExtractedNode) {
  const colors = new Map<string, { count: number; usages: Set<string> }>();
  const spacings = new Map<string, number>();
  const radii = new Map<string, number>();
  const shadows = new Map<string, number>();
  const typography: Array<{
    family: string; size: string; weight: string; lineHeight: string; usage: string;
  }> = [];

  function walk(n: ExtractedNode) {
    // Colors
    for (const [prop, value] of Object.entries(n.styles.colors)) {
      if (value === 'rgba(0, 0, 0, 0)' || value === 'transparent') continue;
      const usage = prop.includes('background') ? 'background' : 'text';
      const existing = colors.get(value);
      if (existing) { existing.count++; existing.usages.add(usage); }
      else colors.set(value, { count: 1, usages: new Set([usage]) });
    }

    // Spacing
    for (const [, value] of Object.entries(n.styles.spacing)) {
      if (value && value !== '0px') spacings.set(value, (spacings.get(value) || 0) + 1);
    }

    // Border radius
    if (n.styles.borders['border-radius']) {
      const v = n.styles.borders['border-radius'];
      radii.set(v, (radii.get(v) || 0) + 1);
    }

    // Shadows
    if (n.styles.effects['box-shadow']) {
      const v = n.styles.effects['box-shadow'];
      shadows.set(v, (shadows.get(v) || 0) + 1);
    }

    // Typography
    if (n.styles.typography['font-size']) {
      typography.push({
        family: n.styles.typography['font-family']?.split(',')[0]?.trim() || '',
        size: n.styles.typography['font-size'],
        weight: n.styles.typography['font-weight'] || '400',
        lineHeight: n.styles.typography['line-height'] || '',
        usage: n.tagName,
      });
    }

    for (const child of n.children) walk(child);
  }

  walk(node);

  return {
    colors: Array.from(colors.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([value, { count, usages }]) => ({
        value, count, usage: Array.from(usages).join(', '),
      })),
    typography,
    spacing: Array.from(spacings.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count })),
    borderRadius: Array.from(radii.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count })),
    shadows: Array.from(shadows.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count })),
  };
}

// ---- Keyboard shortcuts ----

function onKeyDown(e: KeyboardEvent) {
  if (!isInspecting) return;

  // Escape to stop inspecting
  if (e.key === 'Escape') {
    toggleInspector(false);
    return;
  }

  // [ to expand boundary
  if (e.key === '[' && currentRoot) {
    currentRoot = expandBoundary(currentRoot);
    showHighlight(currentRoot, true);
    performExtraction(currentRoot);
    return;
  }

  // ] to contract boundary
  if (e.key === ']' && currentRoot) {
    currentRoot = contractBoundary(currentRoot);
    showHighlight(currentRoot, true);
    performExtraction(currentRoot);
    return;
  }
}

// ---- Toggle inspector mode ----

function toggleInspector(active: boolean) {
  isInspecting = active;

  if (active) {
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseleave', onMouseLeave, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.body.style.cursor = 'crosshair';
  } else {
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('mouseleave', onMouseLeave, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.body.style.cursor = '';
    hideHighlight();
    removeOverlay();
    hoveredElement = null;
    selectedElement = null;
    currentRoot = null;
  }
}

// ---- Message listener ----

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case 'TOGGLE_INSPECTOR':
      toggleInspector(message.payload as boolean);
      sendResponse({ ok: true });
      break;

    case 'EXPAND_BOUNDARY':
      if (currentRoot) {
        currentRoot = expandBoundary(currentRoot);
        showHighlight(currentRoot, true);
        performExtraction(currentRoot);
      }
      sendResponse({ ok: true });
      break;

    case 'CONTRACT_BOUNDARY':
      if (currentRoot) {
        currentRoot = contractBoundary(currentRoot);
        showHighlight(currentRoot, true);
        performExtraction(currentRoot);
      }
      sendResponse({ ok: true });
      break;

    case 'CAPTURE_INTERACTION_STATE': {
      const state = message.payload as InteractionState;
      if (selectedElement) {
        captureInteractionState(selectedElement, state).then(diff => {
          sendResponse({ ok: true, diff });
        });
        return true; // async response
      }
      sendResponse({ ok: false });
      break;
    }

    case 'DESIGN_SYSTEM_SCAN': {
      const tokens = extractDesignTokens();
      chrome.runtime.sendMessage({
        type: 'DESIGN_SYSTEM_RESULT',
        payload: tokens,
      }).catch(() => {});
      sendResponse({ ok: true });
      break;
    }
  }
});

// Start MCP bridge connection (connects to local MCP server if running)
startBridge();
