// ============================================================
// History Panel — Inspection history list
// ============================================================

import { useState, useEffect, useCallback } from 'preact/hooks';
import type { ComponentExtraction, InspectionRecord } from '@/shared/types';

interface HistoryPanelProps {
  onSelect: (extraction: ComponentExtraction) => void;
}

export function HistoryPanel({ onSelect }: HistoryPanelProps) {
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    chrome.storage.local.get('history', (result) => {
      setRecords(result.history || []);
    });

    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes.history) {
        setRecords(changes.history.newValue || []);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.pageTitle.toLowerCase().includes(q) ||
      r.url.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  const toggleFavorite = useCallback(async (id: string) => {
    const updated = records.map(r =>
      r.id === id ? { ...r, favorite: !r.favorite } : r
    );
    setRecords(updated);
    await chrome.storage.local.set({ history: updated });
  }, [records]);

  const deleteRecord = useCallback(async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    await chrome.storage.local.set({ history: updated });
  }, [records]);

  const clearAll = useCallback(async () => {
    setRecords([]);
    await chrome.storage.local.set({ history: [] });
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2 border-b border-inspector-border">
        <input
          type="text"
          placeholder="Search history..."
          value={searchQuery}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          className="w-full px-2 py-1 text-xs bg-inspector-bg border border-inspector-border rounded text-inspector-text placeholder-inspector-muted focus:outline-none focus:border-inspector-accent"
        />
      </div>

      {/* Records */}
      <div className="flex-1 overflow-auto">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-inspector-muted text-xs">
            <p>No inspections yet</p>
          </div>
        ) : (
          filteredRecords.map(record => (
            <div
              key={record.id}
              className="flex items-start gap-2 px-3 py-2 border-b border-inspector-border hover:bg-inspector-surface cursor-pointer"
              onClick={() => onSelect(record.extraction)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-inspector-text truncate">
                    {'<'}{record.extraction.rootNode.tagName}{'>'}
                  </span>
                  <span className="text-2xs text-inspector-muted">
                    {record.extraction.nodeCount} nodes
                  </span>
                </div>
                <div className="text-2xs text-inspector-muted truncate">
                  {record.pageTitle || record.url}
                </div>
                <div className="text-2xs text-inspector-muted opacity-50">
                  {formatTime(record.timestamp)}
                </div>
                {record.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {record.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-1 py-0 text-2xs rounded bg-inspector-border text-inspector-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(record.id); }}
                  className={`text-xs ${record.favorite ? 'text-inspector-warning' : 'text-inspector-muted opacity-30 hover:opacity-100'}`}
                  title="Favorite"
                >
                  {record.favorite ? '\u2605' : '\u2606'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRecord(record.id); }}
                  className="text-xs text-inspector-muted opacity-30 hover:opacity-100 hover:text-inspector-error"
                  title="Delete"
                >
                  x
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {records.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-inspector-border text-2xs text-inspector-muted">
          <span>{records.length} inspections</span>
          <button
            onClick={clearAll}
            className="text-inspector-error hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleDateString();
}
