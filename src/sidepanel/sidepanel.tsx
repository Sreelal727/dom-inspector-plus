// ============================================================
// Side Panel — Main UI surface (Preact)
// ============================================================

import { render } from 'preact';
import { useState, useEffect, useCallback } from 'preact/hooks';
import type {
  ComponentExtraction, ExportFormat, AITarget,
  ExtractedNode, Message,
} from '@/shared/types';
import { TreeView } from './components/tree-view';
import { StylePanel } from './components/style-panel';
import { ExportPanel } from './components/export-panel';
import { PromptPreview } from './components/prompt-preview';
import { HistoryPanel } from './components/history-panel';

type Tab = 'tree' | 'styles' | 'export' | 'history';

function App() {
  const [extraction, setExtraction] = useState<ComponentExtraction | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('tree');
  const [selectedNode, setSelectedNode] = useState<ExtractedNode | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Listen for extraction updates
  useEffect(() => {
    const listener = () => {
      chrome.storage.session.get('latest_INSPECTION_RESULT', (result) => {
        const data = result.latest_INSPECTION_RESULT as ComponentExtraction | undefined;
        if (data) {
          setExtraction(data);
          setSelectedNode(data.rootNode);
          setActiveTab('tree');
        }
      });
    };

    // Poll for changes (session storage doesn't have a change listener for session)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'session' && changes.latest_INSPECTION_RESULT) {
        setExtraction(changes.latest_INSPECTION_RESULT.newValue);
        setSelectedNode(changes.latest_INSPECTION_RESULT.newValue?.rootNode || null);
      }
    });

    // Initial load
    listener();
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
  }, [isInspecting]);

  const expandBoundary = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'EXPAND_BOUNDARY', payload: null });
    }
  }, []);

  const contractBoundary = useCallback(async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'CONTRACT_BOUNDARY', payload: null });
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-inspector-border bg-inspector-surface">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-inspector-accent">DOM Inspector+</span>
        </div>
        <div className="flex items-center gap-1">
          {extraction && (
            <>
              <button
                onClick={expandBoundary}
                className="px-2 py-1 text-xs rounded hover:bg-inspector-border text-inspector-muted"
                title="Expand boundary [["
              >
                [
              </button>
              <button
                onClick={contractBoundary}
                className="px-2 py-1 text-xs rounded hover:bg-inspector-border text-inspector-muted"
                title="Contract boundary ]"
              >
                ]
              </button>
            </>
          )}
          <button
            onClick={toggleInspector}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              isInspecting
                ? 'bg-inspector-accent text-inspector-bg'
                : 'bg-inspector-border text-inspector-text hover:bg-inspector-muted'
            }`}
          >
            {isInspecting ? 'Stop' : 'Inspect'}
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-inspector-border bg-inspector-surface">
        {(['tree', 'styles', 'export', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-inspector-accent border-b-2 border-inspector-accent'
                : 'text-inspector-muted hover:text-inspector-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {!extraction ? (
          <EmptyState onInspect={toggleInspector} />
        ) : (
          <>
            {activeTab === 'tree' && (
              <TreeView
                node={extraction.rootNode}
                selectedNode={selectedNode}
                onSelect={setSelectedNode}
              />
            )}
            {activeTab === 'styles' && selectedNode && (
              <StylePanel node={selectedNode} />
            )}
            {activeTab === 'export' && (
              <ExportPanel extraction={extraction} />
            )}
            {activeTab === 'history' && (
              <HistoryPanel onSelect={setExtraction} />
            )}
          </>
        )}
      </main>

      {/* Prompt preview (always visible when extraction exists) */}
      {extraction && activeTab === 'export' && (
        <PromptPreview extraction={extraction} />
      )}

      {/* Status bar */}
      {extraction && (
        <footer className="flex items-center justify-between px-3 py-1 text-2xs border-t border-inspector-border bg-inspector-surface text-inspector-muted">
          <span>{extraction.nodeCount} nodes</span>
          <span>{new URL(extraction.url).hostname}</span>
        </footer>
      )}
    </div>
  );
}

function EmptyState({ onInspect }: { onInspect: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="text-4xl mb-4 opacity-30">+</div>
      <h2 className="text-sm font-medium text-inspector-text mb-2">
        No element selected
      </h2>
      <p className="text-xs text-inspector-muted mb-4">
        Click "Inspect" or press Cmd+Shift+X to start inspecting elements on the page.
      </p>
      <button
        onClick={onInspect}
        className="px-4 py-2 text-xs font-medium rounded-md bg-inspector-accent text-inspector-bg hover:opacity-90 transition-opacity"
      >
        Start Inspecting
      </button>
      <div className="mt-6 text-2xs text-inspector-muted space-y-1">
        <p>Click any element to extract it</p>
        <p>[ / ] to expand/contract component boundary</p>
        <p>Esc to stop inspecting</p>
      </div>
    </div>
  );
}

render(<App />, document.getElementById('app')!);
