// ============================================================
// Style Panel — Display extracted styles for selected node
// ============================================================

import { useState } from 'preact/hooks';
import type { ExtractedNode } from '@/shared/types';

interface StylePanelProps {
  node: ExtractedNode;
}

type StyleCategory = 'layout' | 'typography' | 'colors' | 'borders' | 'spacing' | 'effects' | 'customProperties';

const CATEGORY_LABELS: Record<StyleCategory, string> = {
  layout: 'Layout',
  typography: 'Typography',
  colors: 'Colors',
  borders: 'Borders',
  spacing: 'Spacing',
  effects: 'Effects',
  customProperties: 'CSS Variables',
};

export function StylePanel({ node }: StylePanelProps) {
  const [showTailwind, setShowTailwind] = useState(true);

  return (
    <div className="p-3 space-y-3">
      {/* Node header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-inspector-accent font-medium">
            {'<'}{node.tagName}{'>'}
          </span>
          {node.classNames.length > 0 && (
            <span className="text-inspector-muted text-2xs ml-2">
              .{node.classNames.slice(0, 3).join('.')}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowTailwind(!showTailwind)}
          className={`px-2 py-0.5 text-2xs rounded ${
            showTailwind
              ? 'bg-inspector-accent text-inspector-bg'
              : 'bg-inspector-border text-inspector-muted'
          }`}
        >
          Tailwind
        </button>
      </div>

      {/* Tailwind classes */}
      {showTailwind && node.tailwindClasses.length > 0 && (
        <div className="p-2 rounded bg-inspector-bg border border-inspector-border">
          <div className="text-2xs text-inspector-muted mb-1">Tailwind Classes</div>
          <div className="flex flex-wrap gap-1">
            {node.tailwindClasses.filter(Boolean).map((cls, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 text-2xs rounded bg-inspector-surface text-inspector-accent font-mono"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Style categories */}
      {(Object.keys(CATEGORY_LABELS) as StyleCategory[]).map(category => {
        const styles = node.styles[category];
        const entries = Object.entries(styles);
        if (entries.length === 0) return null;

        return (
          <StyleCategory
            key={category}
            label={CATEGORY_LABELS[category]}
            entries={entries}
          />
        );
      })}

      {/* Accessibility */}
      {(node.accessibility.role || node.accessibility.ariaLabel || node.accessibility.semanticTag) && (
        <div className="border border-inspector-border rounded overflow-hidden">
          <div className="px-2 py-1 bg-inspector-surface text-2xs font-medium text-inspector-muted uppercase tracking-wider">
            Accessibility
          </div>
          <div className="p-2 space-y-1">
            {node.accessibility.semanticTag && (
              <StyleRow prop="Semantic" value={`<${node.accessibility.semanticTag}>`} />
            )}
            {node.accessibility.role && (
              <StyleRow prop="Role" value={node.accessibility.role} />
            )}
            {node.accessibility.ariaLabel && (
              <StyleRow prop="aria-label" value={node.accessibility.ariaLabel} />
            )}
            {node.accessibility.alt && (
              <StyleRow prop="alt" value={node.accessibility.alt} />
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      {node.animations.length > 0 && (
        <div className="border border-inspector-border rounded overflow-hidden">
          <div className="px-2 py-1 bg-inspector-surface text-2xs font-medium text-inspector-muted uppercase tracking-wider">
            Animations
          </div>
          <div className="p-2 space-y-1">
            {node.animations.map((anim, i) => (
              <div key={i} className="text-2xs text-inspector-text">
                {anim.description}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StyleCategory({ label, entries }: { label: string; entries: [string, string][] }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-inspector-border rounded overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-2 py-1 bg-inspector-surface text-2xs font-medium text-inspector-muted uppercase tracking-wider hover:text-inspector-text"
      >
        <span>{label}</span>
        <span>{collapsed ? '\u25B6' : '\u25BC'}</span>
      </button>
      {!collapsed && (
        <div className="p-2 space-y-0.5">
          {entries.map(([prop, value]) => (
            <StyleRow key={prop} prop={prop} value={value} />
          ))}
        </div>
      )}
    </div>
  );
}

function StyleRow({ prop, value }: { prop: string; value: string }) {
  const isColor = value.match(/^(#|rgb|hsl)/);

  return (
    <div className="flex items-center gap-2 text-2xs font-mono">
      <span className="text-inspector-muted min-w-[100px] truncate">{prop}</span>
      <span className="text-inspector-text truncate flex items-center gap-1">
        {isColor && (
          <span
            className="inline-block w-3 h-3 rounded-sm border border-inspector-border flex-shrink-0"
            style={{ backgroundColor: value }}
          />
        )}
        {value}
      </span>
    </div>
  );
}
