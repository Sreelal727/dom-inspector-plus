// ============================================================
// Export Panel — Format picker + AI tool buttons
// ============================================================

import { useState, useCallback } from 'preact/hooks';
import type { ComponentExtraction, ExportFormat, AITarget, Message } from '@/shared/types';
import { generateExport } from '@/shared/prompt-templates';
import { AI_INTEGRATIONS } from '@/shared/ai-integrations';

interface ExportPanelProps {
  extraction: ComponentExtraction;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'ai-prompt', label: 'AI Prompt', description: 'Natural language for AI tools' },
  { value: 'react-jsx', label: 'React JSX', description: 'Component with Tailwind classes' },
  { value: 'html-css', label: 'HTML + CSS', description: 'Raw HTML with scoped styles' },
  { value: 'tailwind-only', label: 'Tailwind', description: 'Class strings per element' },
  { value: 'json', label: 'JSON', description: 'Full structured data' },
  { value: 'toon', label: 'TOON', description: 'Token-optimized for LLMs' },
];

export function ExportPanel({ extraction }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>('ai-prompt');
  const [copied, setCopied] = useState(false);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  const handleExport = useCallback(async (target: AITarget) => {
    setActiveTarget(target);

    // Request export via service worker
    chrome.runtime.sendMessage({
      type: 'EXPORT_REQUEST',
      payload: { extraction, format, target },
    } as Message);

    // Also copy directly for immediate feedback
    const text = target === 'clipboard'
      ? generateExport(extraction, format)
      : AI_INTEGRATIONS.find(i => i.id === target)?.promptTemplate(extraction) || '';

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setActiveTarget(null);
      }, 2000);
    } catch {
      // Fallback handled by export engine
      setActiveTarget(null);
    }
  }, [extraction, format]);

  return (
    <div className="p-3 space-y-4">
      {/* Format selector */}
      <div>
        <div className="text-2xs text-inspector-muted uppercase tracking-wider mb-2">
          Export Format
        </div>
        <div className="grid grid-cols-2 gap-1">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFormat(opt.value)}
              className={`px-2 py-1.5 rounded text-left transition-colors ${
                format === opt.value
                  ? 'bg-inspector-accent text-inspector-bg'
                  : 'bg-inspector-surface text-inspector-text hover:bg-inspector-border'
              }`}
            >
              <div className="text-xs font-medium">{opt.label}</div>
              <div className={`text-2xs ${
                format === opt.value ? 'text-inspector-bg opacity-70' : 'text-inspector-muted'
              }`}>
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Integration buttons */}
      <div>
        <div className="text-2xs text-inspector-muted uppercase tracking-wider mb-2">
          Send To
        </div>
        <div className="space-y-1">
          {AI_INTEGRATIONS.map(integration => (
            <button
              key={integration.id}
              onClick={() => handleExport(integration.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                activeTarget === integration.id
                  ? 'bg-inspector-success text-inspector-bg'
                  : 'bg-inspector-surface text-inspector-text hover:bg-inspector-border'
              }`}
            >
              <span className="text-base">{integration.icon}</span>
              <span className="text-xs font-medium">{integration.name}</span>
              {activeTarget === integration.id && copied && (
                <span className="ml-auto text-2xs">Copied!</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick copy button */}
      <button
        onClick={() => handleExport('clipboard')}
        className={`w-full py-2 rounded font-medium text-sm transition-colors ${
          copied && activeTarget === 'clipboard'
            ? 'bg-inspector-success text-inspector-bg'
            : 'bg-inspector-accent text-inspector-bg hover:opacity-90'
        }`}
      >
        {copied && activeTarget === 'clipboard' ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
      </button>

      {/* Stats */}
      <div className="text-2xs text-inspector-muted space-y-0.5 pt-2 border-t border-inspector-border">
        <div>Nodes: {extraction.nodeCount}</div>
        <div>Colors: {extraction.designTokens.colors.length}</div>
        <div>Typography styles: {extraction.designTokens.typography.length}</div>
        <div>Source: {extraction.url}</div>
      </div>
    </div>
  );
}
