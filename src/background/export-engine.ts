// ============================================================
// Export Engine — Format conversion + clipboard
// ============================================================

import type { ComponentExtraction, ExportFormat, AITarget } from '@/shared/types';
import { generateExport } from '@/shared/prompt-templates';
import { getIntegration } from '@/shared/ai-integrations';

/**
 * Export a component extraction in the specified format and target
 */
export async function exportExtraction(
  extraction: ComponentExtraction,
  format: ExportFormat,
  target: AITarget
): Promise<{ success: boolean; text: string }> {
  const integration = getIntegration(target);

  let text: string;
  if (integration && target !== 'clipboard') {
    // Use the integration's custom prompt template
    text = integration.promptTemplate(extraction);
  } else {
    // Use the raw format export
    text = generateExport(extraction, format);
  }

  // Copy to clipboard
  await copyToClipboard(text);

  // Launch URL if the integration has one
  if (integration?.launchUrl) {
    chrome.tabs.create({ url: integration.launchUrl });
  }

  return { success: true, text };
}

/**
 * Copy text to clipboard.
 * Uses offscreen document API for MV3 service workers.
 */
async function copyToClipboard(text: string): Promise<void> {
  try {
    // Try using the offscreen API (MV3)
    await ensureOffscreenDocument();
    await chrome.runtime.sendMessage({
      type: 'CLIPBOARD_WRITE',
      payload: text,
    });
  } catch {
    // Fallback: store in session and let popup/sidepanel copy
    await chrome.storage.session.set({ pendingClipboard: text });
  }
}

let offscreenCreated = false;

async function ensureOffscreenDocument(): Promise<void> {
  if (offscreenCreated) return;

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD as chrome.offscreen.Reason],
      justification: 'Copy AI prompt to clipboard',
    });
    offscreenCreated = true;
  } catch {
    // Document may already exist
    offscreenCreated = true;
  }
}
