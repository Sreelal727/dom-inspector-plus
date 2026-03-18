// ============================================================
// Prompt Preview — Live preview of generated AI prompt
// ============================================================

import { useState, useMemo } from 'preact/hooks';
import type { ComponentExtraction, ExportFormat } from '@/shared/types';
import { generateExport } from '@/shared/prompt-templates';

interface PromptPreviewProps {
  extraction: ComponentExtraction;
}

export function PromptPreview({ extraction }: PromptPreviewProps) {
  const [format, setFormat] = useState<ExportFormat>('ai-prompt');
  const [expanded, setExpanded] = useState(false);

  const preview = useMemo(
    () => generateExport(extraction, format),
    [extraction, format]
  );

  const lineCount = preview.split('\n').length;

  return (
    <div className="border-t border-inspector-border bg-inspector-bg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-2xs text-inspector-muted hover:text-inspector-text"
      >
        <span>Preview ({lineCount} lines)</span>
        <span>{expanded ? '\u25BC' : '\u25B2'}</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3">
          <div className="flex gap-1 mb-2">
            {(['ai-prompt', 'react-jsx', 'tailwind-only'] as ExportFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-2 py-0.5 text-2xs rounded ${
                  format === f
                    ? 'bg-inspector-accent text-inspector-bg'
                    : 'bg-inspector-surface text-inspector-muted'
                }`}
              >
                {f === 'ai-prompt' ? 'Prompt' : f === 'react-jsx' ? 'JSX' : 'TW'}
              </button>
            ))}
          </div>
          <pre className="p-2 rounded bg-inspector-surface border border-inspector-border text-2xs text-inspector-text font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
            {preview}
          </pre>
        </div>
      )}
    </div>
  );
}
