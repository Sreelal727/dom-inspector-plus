// ============================================================
// Popup — Quick toggle, export, and settings
// ============================================================

import { render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import type { ComponentExtraction, ExportFormat, Message } from '@/shared/types';
import { generateExport } from '@/shared/prompt-templates';
import { AI_INTEGRATIONS } from '@/shared/ai-integrations';

function Popup() {
  const [isInspecting, setIsInspecting] = useState(false);
  const [hasExtraction, setHasExtraction] = useState(false);
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('ai-prompt');

  useEffect(() => {
    chrome.storage.session.get('currentExtraction', (result) => {
      setHasExtraction(!!result.currentExtraction);
    });
  }, []);

  const toggleInspector = useCallback(async () => {
    const newState = !isInspecting;
    setIsInspecting(newState);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'TOGGLE_INSPECTOR',
        payload: newState,
      } as Message);
    }

    if (newState) window.close();
  }, [isInspecting]);

  const quickCopy = useCallback(async () => {
    const { currentExtraction } = await chrome.storage.session.get('currentExtraction');
    if (!currentExtraction) return;

    const text = generateExport(currentExtraction, format);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [format]);

  const openSidePanel = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.sidePanel.open({ tabId: tab.id });
    }
    window.close();
  }, []);

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-inspector-accent">
          DOM Inspector+
        </h1>
        <span className="text-2xs text-inspector-muted">v0.1.0</span>
      </div>

      {/* Inspect button */}
      <button
        onClick={toggleInspector}
        className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
          isInspecting
            ? 'bg-inspector-error text-white'
            : 'bg-inspector-accent text-inspector-bg hover:opacity-90'
        }`}
      >
        {isInspecting ? 'Stop Inspecting' : 'Start Inspecting'}
      </button>

      {/* Quick actions */}
      {hasExtraction && (
        <div className="space-y-2 pt-2 border-t border-inspector-border">
          <div className="text-2xs text-inspector-muted uppercase tracking-wider">
            Quick Export
          </div>

          <div className="flex gap-1">
            {(['ai-prompt', 'react-jsx', 'tailwind-only'] as ExportFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 px-2 py-1 text-2xs rounded ${
                  format === f
                    ? 'bg-inspector-accent text-inspector-bg'
                    : 'bg-inspector-surface text-inspector-muted hover:text-inspector-text'
                }`}
              >
                {f === 'ai-prompt' ? 'Prompt' : f === 'react-jsx' ? 'JSX' : 'TW'}
              </button>
            ))}
          </div>

          <button
            onClick={quickCopy}
            className={`w-full py-2 rounded font-medium text-xs transition-colors ${
              copied
                ? 'bg-inspector-success text-inspector-bg'
                : 'bg-inspector-surface text-inspector-text hover:bg-inspector-border'
            }`}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>

          {/* AI targets */}
          <div className="grid grid-cols-3 gap-1">
            {AI_INTEGRATIONS.filter(i => i.id !== 'clipboard').map(integration => (
              <button
                key={integration.id}
                onClick={async () => {
                  chrome.runtime.sendMessage({
                    type: 'EXPORT_REQUEST',
                    payload: {
                      extraction: (await chrome.storage.session.get('currentExtraction')).currentExtraction,
                      format,
                      target: integration.id,
                    },
                  });
                  window.close();
                }}
                className="flex flex-col items-center gap-1 p-2 rounded bg-inspector-surface hover:bg-inspector-border text-inspector-text"
              >
                <span className="text-base">{integration.icon}</span>
                <span className="text-2xs">{integration.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Open side panel */}
      <button
        onClick={openSidePanel}
        className="w-full py-1.5 rounded text-xs text-inspector-muted hover:text-inspector-text hover:bg-inspector-surface transition-colors"
      >
        Open Side Panel
      </button>

      {/* Shortcuts hint */}
      <div className="text-2xs text-inspector-muted text-center space-y-0.5 pt-2 border-t border-inspector-border">
        <p>Cmd+Shift+X — Toggle inspector</p>
        <p>Cmd+Shift+C — Quick copy</p>
      </div>
    </div>
  );
}

render(<Popup />, document.getElementById('popup')!);
