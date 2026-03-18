// ============================================================
// Highlight Overlay — Visual highlight on hover/click
// ============================================================

import { HIGHLIGHT_COLORS, OVERLAY_Z_INDEX } from '@/shared/constants';
import type { BoundingRect } from '@/shared/types';

interface OverlayElements {
  container: HTMLDivElement;
  content: HTMLDivElement;
  padding: HTMLDivElement;
  margin: HTMLDivElement;
  tooltip: HTMLDivElement;
}

let overlay: OverlayElements | null = null;
let isActive = false;

function createOverlay(): OverlayElements {
  const container = document.createElement('div');
  container.id = '__dom-inspector-plus-overlay__';
  container.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: ${OVERLAY_Z_INDEX};
    top: 0; left: 0; right: 0; bottom: 0;
  `;

  const margin = document.createElement('div');
  margin.style.cssText = `
    position: absolute;
    background: ${HIGHLIGHT_COLORS.margin};
    pointer-events: none;
  `;

  const padding = document.createElement('div');
  padding.style.cssText = `
    position: absolute;
    background: ${HIGHLIGHT_COLORS.padding};
    pointer-events: none;
  `;

  const content = document.createElement('div');
  content.style.cssText = `
    position: absolute;
    background: ${HIGHLIGHT_COLORS.element};
    border: 2px solid ${HIGHLIGHT_COLORS.elementBorder};
    pointer-events: none;
    border-radius: 2px;
  `;

  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: absolute;
    background: #1e1e2e;
    color: #cdd6f4;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    border: 1px solid #3b3b5c;
  `;

  container.appendChild(margin);
  container.appendChild(padding);
  container.appendChild(content);
  container.appendChild(tooltip);

  return { container, content, padding, margin, tooltip };
}

function getBoxModel(element: Element) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  const marginTop = parseFloat(style.marginTop) || 0;
  const marginRight = parseFloat(style.marginRight) || 0;
  const marginBottom = parseFloat(style.marginBottom) || 0;
  const marginLeft = parseFloat(style.marginLeft) || 0;

  const paddingTop = parseFloat(style.paddingTop) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const paddingBottom = parseFloat(style.paddingBottom) || 0;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;

  return {
    rect,
    margin: { top: marginTop, right: marginRight, bottom: marginBottom, left: marginLeft },
    padding: { top: paddingTop, right: paddingRight, bottom: paddingBottom, left: paddingLeft },
  };
}

function buildTooltipText(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = Array.from(element.classList)
    .slice(0, 3)
    .map(c => `.${c}`)
    .join('');
  const more = element.classList.length > 3 ? `+${element.classList.length - 3}` : '';
  const rect = element.getBoundingClientRect();
  const dims = `${Math.round(rect.width)} x ${Math.round(rect.height)}`;
  return `${tag}${id}${classes}${more}  ${dims}`;
}

export function showHighlight(element: Element, isComponent = false): void {
  if (!overlay) {
    overlay = createOverlay();
    document.documentElement.appendChild(overlay.container);
  }

  const { rect, margin, padding } = getBoxModel(element);

  // Content box
  overlay.content.style.left = `${rect.left}px`;
  overlay.content.style.top = `${rect.top}px`;
  overlay.content.style.width = `${rect.width}px`;
  overlay.content.style.height = `${rect.height}px`;
  overlay.content.style.background = isComponent ? HIGHLIGHT_COLORS.component : HIGHLIGHT_COLORS.element;
  overlay.content.style.borderColor = isComponent ? HIGHLIGHT_COLORS.componentBorder : HIGHLIGHT_COLORS.elementBorder;

  // Margin overlay (show each side as a separate box area)
  overlay.margin.style.left = `${rect.left - margin.left}px`;
  overlay.margin.style.top = `${rect.top - margin.top}px`;
  overlay.margin.style.width = `${rect.width + margin.left + margin.right}px`;
  overlay.margin.style.height = `${rect.height + margin.top + margin.bottom}px`;

  // Padding overlay
  overlay.padding.style.left = `${rect.left}px`;
  overlay.padding.style.top = `${rect.top}px`;
  overlay.padding.style.width = `${rect.width}px`;
  overlay.padding.style.height = `${rect.height}px`;

  // Tooltip
  overlay.tooltip.textContent = buildTooltipText(element);
  const tooltipTop = rect.top - 28;
  overlay.tooltip.style.left = `${Math.max(4, rect.left)}px`;
  overlay.tooltip.style.top = tooltipTop > 4 ? `${tooltipTop}px` : `${rect.bottom + 4}px`;

  overlay.container.style.display = 'block';
}

export function hideHighlight(): void {
  if (overlay) {
    overlay.container.style.display = 'none';
  }
}

export function removeOverlay(): void {
  if (overlay) {
    overlay.container.remove();
    overlay = null;
  }
}

export function isOverlayElement(element: Element): boolean {
  if (!overlay) return false;
  return overlay.container.contains(element);
}
