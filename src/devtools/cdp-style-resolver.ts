// ============================================================
// CDP Style Resolver — CSS.getMatchedStylesForNode via CDP
// ============================================================

import type { MatchedCSSRule } from '@/shared/types';

/**
 * Get matched CSS rules for a DOM node using CDP.
 * Only works when DevTools panel is open.
 */
export async function getMatchedStyles(nodeSelector: string): Promise<MatchedCSSRule[]> {
  return new Promise((resolve) => {
    const script = `
      (function() {
        const el = document.querySelector(${JSON.stringify(nodeSelector)});
        if (!el) return JSON.stringify([]);

        const rules = [];
        try {
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules) {
                if (rule instanceof CSSStyleRule) {
                  try {
                    if (el.matches(rule.selectorText)) {
                      const props = {};
                      for (let i = 0; i < rule.style.length; i++) {
                        const prop = rule.style[i];
                        props[prop] = rule.style.getPropertyValue(prop);
                      }
                      rules.push({
                        selector: rule.selectorText,
                        properties: props,
                        source: sheet.href || 'inline',
                        mediaQuery: rule.parentRule instanceof CSSMediaRule
                          ? rule.parentRule.conditionText
                          : undefined,
                      });
                    }
                  } catch (e) {}
                }
              }
            } catch (e) {
              // Cross-origin stylesheet
            }
          }
        } catch (e) {}
        return JSON.stringify(rules);
      })()
    `;

    chrome.devtools.inspectedWindow.eval(script, (result: string, error) => {
      if (error || !result) {
        resolve([]);
        return;
      }
      try {
        resolve(JSON.parse(result as string));
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Force a pseudo-state on an element via CDP
 */
export async function forcePseudoState(
  nodeSelector: string,
  state: 'hover' | 'focus' | 'active'
): Promise<void> {
  const stateClass = `__dip-force-${state}__`;

  const script = `
    (function() {
      const el = document.querySelector(${JSON.stringify(nodeSelector)});
      if (el) el.classList.add(${JSON.stringify(stateClass)});
    })()
  `;

  chrome.devtools.inspectedWindow.eval(script);
}

/**
 * Clear forced pseudo-states
 */
export async function clearPseudoStates(nodeSelector: string): Promise<void> {
  const script = `
    (function() {
      const el = document.querySelector(${JSON.stringify(nodeSelector)});
      if (el) {
        el.classList.remove('__dip-force-hover__', '__dip-force-focus__', '__dip-force-active__');
      }
    })()
  `;

  chrome.devtools.inspectedWindow.eval(script);
}
