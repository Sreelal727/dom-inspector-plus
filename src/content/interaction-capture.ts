// ============================================================
// Interaction Capture — Hover/focus/active state extraction
// ============================================================

import type { InteractionState, InteractionStateDiff } from '@/shared/types';

/**
 * Capture the style differences when an element enters a given interaction state.
 * Uses programmatic event dispatch and style diffing.
 */
export async function captureInteractionState(
  element: Element,
  state: InteractionState
): Promise<InteractionStateDiff | null> {
  if (state === 'default') return null;

  // Capture base styles
  const baseStyles = captureRelevantStyles(element);

  // Trigger the interaction state
  await triggerState(element, state);

  // Wait for transitions
  await new Promise(resolve => setTimeout(resolve, 50));

  // Capture new styles
  const newStyles = captureRelevantStyles(element);

  // Reset state
  await resetState(element, state);

  // Compute diff
  const changes: Record<string, { from: string; to: string }> = {};
  for (const [prop, value] of Object.entries(newStyles)) {
    if (baseStyles[prop] !== value) {
      changes[prop] = { from: baseStyles[prop] || '', to: value };
    }
  }

  if (Object.keys(changes).length === 0) return null;

  return {
    state,
    changes,
    description: describeChanges(state, changes),
  };
}

const INTERACTION_PROPS = [
  'background-color', 'background', 'color', 'border-color',
  'box-shadow', 'text-shadow', 'transform', 'opacity',
  'outline', 'text-decoration', 'border-width', 'border-style',
  'font-weight', 'scale',
];

function captureRelevantStyles(element: Element): Record<string, string> {
  const computed = getComputedStyle(element);
  const styles: Record<string, string> = {};

  for (const prop of INTERACTION_PROPS) {
    styles[prop] = computed.getPropertyValue(prop);
  }

  return styles;
}

async function triggerState(element: Element, state: InteractionState): Promise<void> {
  switch (state) {
    case 'hover':
      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      break;
    case 'focus':
      if (element instanceof HTMLElement) element.focus();
      element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      break;
    case 'active':
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      break;
  }
}

async function resetState(element: Element, state: InteractionState): Promise<void> {
  switch (state) {
    case 'hover':
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
      break;
    case 'focus':
      if (element instanceof HTMLElement) element.blur();
      element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      break;
    case 'active':
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      break;
  }
}

function describeChanges(
  state: InteractionState,
  changes: Record<string, { from: string; to: string }>
): string {
  const descriptions: string[] = [];

  for (const [prop, { from, to }] of Object.entries(changes)) {
    switch (prop) {
      case 'background-color':
        descriptions.push(`background changes from ${from} to ${to}`);
        break;
      case 'color':
        descriptions.push(`text color changes from ${from} to ${to}`);
        break;
      case 'box-shadow':
        if (from === 'none') descriptions.push(`shadow appears: ${to}`);
        else descriptions.push(`shadow changes`);
        break;
      case 'transform':
        descriptions.push(`transform: ${to}`);
        break;
      case 'opacity':
        descriptions.push(`opacity changes from ${from} to ${to}`);
        break;
      case 'border-color':
        descriptions.push(`border color changes to ${to}`);
        break;
      case 'text-decoration':
        descriptions.push(`text decoration changes to ${to}`);
        break;
      default:
        descriptions.push(`${prop} changes from ${from} to ${to}`);
    }
  }

  const stateLabel = state.charAt(0).toUpperCase() + state.slice(1);
  return `On ${stateLabel}: ${descriptions.join(', ')}`;
}

/**
 * Detect animations and transitions on an element
 */
export function extractAnimations(element: Element): Array<{
  type: 'transition' | 'animation';
  property: string;
  duration: string;
  timing: string;
  delay: string;
  description: string;
}> {
  const computed = getComputedStyle(element);
  const results: Array<{
    type: 'transition' | 'animation';
    property: string;
    duration: string;
    timing: string;
    delay: string;
    description: string;
  }> = [];

  // Parse transitions
  const transitionProp = computed.transitionProperty;
  const transitionDur = computed.transitionDuration;
  const transitionTiming = computed.transitionTimingFunction;
  const transitionDelay = computed.transitionDelay;

  if (transitionProp && transitionProp !== 'all' && transitionDur !== '0s') {
    const props = transitionProp.split(',').map(s => s.trim());
    const durations = transitionDur.split(',').map(s => s.trim());
    const timings = transitionTiming.split(',').map(s => s.trim());
    const delays = transitionDelay.split(',').map(s => s.trim());

    for (let i = 0; i < props.length; i++) {
      const dur = durations[i % durations.length];
      const timing = timings[i % timings.length];
      const delay = delays[i % delays.length];

      results.push({
        type: 'transition',
        property: props[i],
        duration: dur,
        timing,
        delay: delay !== '0s' ? delay : '',
        description: `${props[i]} transitions over ${dur} with ${timing}${delay !== '0s' ? ` after ${delay} delay` : ''}`,
      });
    }
  } else if (transitionDur !== '0s' && transitionProp === 'all') {
    results.push({
      type: 'transition',
      property: 'all',
      duration: transitionDur,
      timing: transitionTiming,
      delay: transitionDelay !== '0s' ? transitionDelay : '',
      description: `all properties transition over ${transitionDur} with ${transitionTiming}`,
    });
  }

  // Parse animations
  const animName = computed.animationName;
  if (animName && animName !== 'none') {
    const names = animName.split(',').map(s => s.trim());
    const durations = computed.animationDuration.split(',').map(s => s.trim());
    const timings = computed.animationTimingFunction.split(',').map(s => s.trim());
    const delays = computed.animationDelay.split(',').map(s => s.trim());

    for (let i = 0; i < names.length; i++) {
      results.push({
        type: 'animation',
        property: names[i],
        duration: durations[i % durations.length],
        timing: timings[i % timings.length],
        delay: delays[i % delays.length] !== '0s' ? delays[i % delays.length] : '',
        description: `animation "${names[i]}" runs for ${durations[i % durations.length]}`,
      });
    }
  }

  return results;
}
