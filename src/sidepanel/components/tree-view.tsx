// ============================================================
// Tree View — Component tree visualization
// ============================================================

import { useState } from 'preact/hooks';
import type { ExtractedNode } from '@/shared/types';

interface TreeViewProps {
  node: ExtractedNode;
  selectedNode: ExtractedNode | null;
  onSelect: (node: ExtractedNode) => void;
  depth?: number;
}

export function TreeView({ node, selectedNode, onSelect, depth = 0 }: TreeViewProps) {
  const [expanded, setExpanded] = useState(depth < 3);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedNode?.id === node.id;
  const indent = depth * 16;

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-inspector-surface transition-colors ${
          isSelected ? 'bg-inspector-border' : ''
        }`}
        style={{ paddingLeft: `${indent + 8}px` }}
        onClick={() => onSelect(node)}
      >
        {/* Expand/collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-4 h-4 flex items-center justify-center text-inspector-muted hover:text-inspector-text text-2xs"
          >
            {expanded ? '\u25BC' : '\u25B6'}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Tag name */}
        <span className="text-inspector-accent text-xs">
          {'<'}{node.tagName}
        </span>

        {/* ID */}
        {node.attributes.id && (
          <span className="text-inspector-warning text-xs">
            #{node.attributes.id}
          </span>
        )}

        {/* Classes (first 2) */}
        {node.classNames.length > 0 && (
          <span className="text-inspector-muted text-2xs truncate max-w-[120px]">
            .{node.classNames.slice(0, 2).join('.')}
            {node.classNames.length > 2 ? `+${node.classNames.length - 2}` : ''}
          </span>
        )}

        <span className="text-inspector-accent text-xs">{'>'}</span>

        {/* Component boundary indicator */}
        {node.isComponentRoot && (
          <span className="ml-1 px-1 py-0 text-2xs rounded bg-purple-900 text-purple-300">
            component
          </span>
        )}

        {/* Text content preview */}
        {node.textContent && node.children.length === 0 && (
          <span className="text-inspector-muted text-2xs truncate max-w-[100px] ml-1">
            {node.textContent.slice(0, 30)}
          </span>
        )}

        {/* Dimensions */}
        <span className="ml-auto text-2xs text-inspector-muted opacity-50">
          {Math.round(node.boundingRect.width)}x{Math.round(node.boundingRect.height)}
        </span>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TreeView
              key={child.id}
              node={child}
              selectedNode={selectedNode}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
