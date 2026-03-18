// ============================================================
// DevTools Panel — CDP access for Tier 2 style extraction
// ============================================================

// Notify that DevTools is open (enables Tier 2 extraction)
chrome.runtime.sendMessage({
  type: 'DEVTOOLS_CONNECTED',
  payload: { tabId: chrome.devtools.inspectedWindow.tabId },
});

// Create a panel in DevTools
chrome.devtools.panels.create(
  'DOM Inspector+',
  '',
  'src/devtools/panel.html',
  (_panel) => {
    // Panel created
  }
);
