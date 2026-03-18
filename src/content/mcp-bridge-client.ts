// ============================================================
// MCP Bridge Client — Connects content script to local MCP server
// ============================================================

import type { Message, ComponentExtraction } from '@/shared/types';
import { walkSubtree, countNodes } from './dom-walker';
import { applyTailwindMapping } from '@/lib/css-to-tailwind';
import { extractDesignTokens } from '@/lib/design-token-extractor';
import { captureInteractionState } from './interaction-capture';

const BRIDGE_URL = 'http://localhost:18432';
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let commandPollInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the bridge connection — heartbeat + command polling
 */
export function startBridge(): void {
  if (heartbeatInterval) return;

  // Send heartbeat every 3 seconds
  heartbeatInterval = setInterval(sendHeartbeat, 3000);
  sendHeartbeat();

  // Poll for commands every 500ms
  commandPollInterval = setInterval(pollForCommands, 500);
}

/**
 * Stop the bridge connection
 */
export function stopBridge(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (commandPollInterval) {
    clearInterval(commandPollInterval);
    commandPollInterval = null;
  }

  fetch(`${BRIDGE_URL}/disconnect`, { method: 'POST' }).catch(() => {});
}

async function sendHeartbeat(): Promise<void> {
  try {
    await fetch(`${BRIDGE_URL}/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: window.location.href,
        pageTitle: document.title,
      }),
    });
  } catch {
    // Bridge server not running — that's fine
  }
}

async function pollForCommands(): Promise<void> {
  try {
    const res = await fetch(`${BRIDGE_URL}/command`);
    const cmd = await res.json();
    if (cmd) {
      const result = await handleCommand(cmd.type, cmd.payload);
      await fetch(`${BRIDGE_URL}/command-result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
    }
  } catch {
    // Bridge server not running
  }
}

async function handleCommand(type: string, payload: Record<string, unknown>): Promise<unknown> {
  switch (type) {
    case 'TOGGLE_INSPECTOR': {
      // Forward to content script's message handler
      chrome.runtime.sendMessage({
        type: 'TOGGLE_INSPECTOR',
        payload: payload,
      } as Message).catch(() => {});
      return { ok: true };
    }

    case 'EXTRACT_ELEMENT': {
      const selector = payload.selector as string;
      const maxDepth = (payload.maxDepth as number) || 10;
      const element = document.querySelector(selector);

      if (!element) {
        return { error: `No element found for selector: ${selector}` };
      }

      const rootNode = walkSubtree(element, Math.min(maxDepth * 20, 200));
      applyTailwindMapping(rootNode);

      return {
        url: window.location.href,
        pageTitle: document.title,
        rootNode,
        nodeCount: countNodes(rootNode),
      };
    }

    case 'FORMAT_EXTRACTION': {
      // Import prompt templates dynamically to keep initial bundle small
      const { generateExport } = await import('@/shared/prompt-templates');
      const format = payload.format as string;
      const extraction = payload.extraction as ComponentExtraction;
      return generateExport(extraction, format as 'ai-prompt' | 'json' | 'react-jsx' | 'html-css' | 'tailwind-only');
    }

    case 'EXTRACT_DESIGN_TOKENS': {
      const tokens = extractDesignTokens();
      return tokens;
    }

    case 'GET_PAGE_STRUCTURE': {
      const maxDepth = (payload.maxDepth as number) || 3;
      return getPageStructure(document.body, maxDepth);
    }

    case 'FIND_ELEMENTS': {
      const selector = payload.selector as string;
      const limit = (payload.limit as number) || 10;
      return findElements(selector, limit);
    }

    case 'CAPTURE_INTERACTION': {
      const selector = payload.selector as string;
      const state = payload.state as 'hover' | 'focus' | 'active';
      const element = document.querySelector(selector);
      if (!element) return { error: `No element found for selector: ${selector}` };
      const diff = await captureInteractionState(element, state);
      return diff || { state, changes: {}, description: 'No style changes detected' };
    }

    default:
      return { error: `Unknown command: ${type}` };
  }
}

function getPageStructure(root: Element, maxDepth: number, depth = 0): unknown {
  if (depth >= maxDepth) return null;

  const tag = root.tagName.toLowerCase();
  const id = root.id ? `#${root.id}` : '';
  const classes = Array.from(root.classList).slice(0, 3).join('.');
  const role = root.getAttribute('role') || '';
  const text = getShortText(root);
  const rect = root.getBoundingClientRect();

  const children: unknown[] = [];
  for (const child of root.children) {
    // Skip script, style, invisible elements
    if (['script', 'style', 'noscript', 'link', 'meta'].includes(child.tagName.toLowerCase())) continue;
    if (rect.width === 0 && rect.height === 0) continue;

    const childResult = getPageStructure(child, maxDepth, depth + 1);
    if (childResult) children.push(childResult);
  }

  // Skip generic wrappers with single children
  if (tag === 'div' && !id && !classes && !role && children.length === 1) {
    return children[0];
  }

  return {
    element: `${tag}${id}${classes ? '.' + classes : ''}`,
    role: role || undefined,
    text: text || undefined,
    size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
    children: children.length > 0 ? children : undefined,
  };
}

function findElements(selector: string, limit: number): unknown {
  try {
    const elements = document.querySelectorAll(selector);
    const results: unknown[] = [];

    for (let i = 0; i < Math.min(elements.length, limit); i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      results.push({
        index: i,
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: Array.from(el.classList).slice(0, 5),
        text: getShortText(el),
        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        visible: rect.width > 0 && rect.height > 0,
        selector: generateUniqueSelector(el),
      });
    }

    return { count: elements.length, showing: results.length, results };
  } catch (e) {
    return { error: `Invalid selector: ${selector}` };
  }
}

function getShortText(el: Element): string {
  let text = '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) text += node.textContent || '';
  }
  text = text.trim();
  return text.length > 80 ? text.slice(0, 80) + '...' : text;
}

function generateUniqueSelector(el: Element): string {
  if (el.id) return `#${el.id}`;

  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (!parent) return tag;

  const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
  if (siblings.length === 1) {
    const parentSelector = generateUniqueSelector(parent);
    return `${parentSelector} > ${tag}`;
  }

  const index = siblings.indexOf(el) + 1;
  const parentSelector = generateUniqueSelector(parent);
  return `${parentSelector} > ${tag}:nth-of-type(${index})`;
}
