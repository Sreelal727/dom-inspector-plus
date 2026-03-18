// ============================================================
// Message Router — Central message hub for the extension
// ============================================================

import type { Message, ComponentExtraction, DesignTokens } from '@/shared/types';

type MessageHandler = (message: Message, sender: chrome.runtime.MessageSender) => void;

const handlers = new Map<string, MessageHandler[]>();

export function onMessage(type: string, handler: MessageHandler): void {
  const existing = handlers.get(type) || [];
  existing.push(handler);
  handlers.set(type, existing);
}

export function initMessageRouter(): void {
  chrome.runtime.onMessage.addListener(
    (message: Message, sender, sendResponse) => {
      const messageHandlers = handlers.get(message.type);
      if (messageHandlers) {
        for (const handler of messageHandlers) {
          handler(message, sender);
        }
      }

      // Forward messages to side panel if applicable
      if (
        message.type === 'INSPECTION_RESULT' ||
        message.type === 'DESIGN_SYSTEM_RESULT'
      ) {
        // Store in session storage for side panel to access
        chrome.storage.session.set({
          [`latest_${message.type}`]: message.payload,
        });
      }

      sendResponse({ ok: true });
      return false;
    }
  );
}
