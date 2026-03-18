// ============================================================
// DevTools Panel — CDP access for Tier 2 style extraction
// ============================================================

// Notify that DevTools is open (enables Tier 2 extraction)
chrome.runtime.sendMessage({
  type: 'DEVTOOLS_CONNECTED',
  payload: { tabId: chrome.devtools.inspectedWindow.tabId },
}).catch(() => {});
