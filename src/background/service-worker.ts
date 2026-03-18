// ============================================================
// Service Worker — Event-driven background logic
// ============================================================

import { initMessageRouter, onMessage } from './message-router';
import { exportExtraction } from './export-engine';
import {
  setCurrentExtraction,
  addToHistory,
  getSettings,
} from './storage-manager';
import type {
  Message, ComponentExtraction, ExportFormat, AITarget,
  InspectionRecord,
} from '@/shared/types';

// Initialize message routing
initMessageRouter();

// ---- Handle inspection results ----

onMessage('INSPECTION_RESULT', async (message) => {
  const extraction = message.payload as ComponentExtraction;
  await setCurrentExtraction(extraction);

  // Auto-save to history
  const record: InspectionRecord = {
    id: `insp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: extraction.timestamp,
    url: extraction.url,
    pageTitle: extraction.pageTitle,
    extraction,
    tags: [],
    favorite: false,
  };
  await addToHistory(record);
});

// ---- Handle export requests ----

onMessage('EXPORT_REQUEST', async (message) => {
  const { extraction, format, target } = message.payload as {
    extraction: ComponentExtraction;
    format: ExportFormat;
    target: AITarget;
  };

  const result = await exportExtraction(extraction, format, target);

  // Broadcast result (may fail if no listener is open)
  chrome.runtime.sendMessage({
    type: 'EXPORT_RESULT',
    payload: result,
  }).catch(() => {});
});

// ---- Toggle inspector via action click ----

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  // Open side panel
  await chrome.sidePanel.open({ tabId: tab.id });
});

// ---- Keyboard command handling ----

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  switch (command) {
    case 'toggle-inspector':
      // Toggle inspection mode in content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_INSPECTOR',
          payload: true,
        });
      } catch {
        // Content script not loaded yet — inject it
      }
      break;

    case 'copy-prompt': {
      const { currentExtraction } = await chrome.storage.session.get('currentExtraction');
      if (currentExtraction) {
        const settings = await getSettings();
        await exportExtraction(currentExtraction, settings.defaultFormat, settings.defaultTarget);
      }
      break;
    }
  }
});

// ---- Side panel behavior ----

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(() => { /* Side panel API might not be available */ });
