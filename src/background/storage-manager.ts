// ============================================================
// Storage Manager — chrome.storage abstraction
// ============================================================

import type {
  Settings, InspectionRecord, Collection,
  ComponentExtraction, DEFAULT_SETTINGS,
} from '@/shared/types';

const MAX_HISTORY = 100;

// ---- Settings ----

export async function getSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.local.get('settings');
  return settings || (await import('@/shared/types')).DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await chrome.storage.local.set({ settings: { ...current, ...settings } });
}

// ---- Session data (current inspection) ----

export async function setCurrentExtraction(extraction: ComponentExtraction): Promise<void> {
  await chrome.storage.session.set({ currentExtraction: extraction });
}

export async function getCurrentExtraction(): Promise<ComponentExtraction | null> {
  const { currentExtraction } = await chrome.storage.session.get('currentExtraction');
  return currentExtraction || null;
}

// ---- History ----

export async function getHistory(): Promise<InspectionRecord[]> {
  const { history } = await chrome.storage.local.get('history');
  return history || [];
}

export async function addToHistory(record: InspectionRecord): Promise<void> {
  const history = await getHistory();

  // Prepend new record
  history.unshift(record);

  // Trim to max
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }

  await chrome.storage.local.set({ history });
}

export async function removeFromHistory(id: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter(r => r.id !== id);
  await chrome.storage.local.set({ history: filtered });
}

export async function updateHistoryRecord(
  id: string,
  updates: Partial<InspectionRecord>
): Promise<void> {
  const history = await getHistory();
  const index = history.findIndex(r => r.id === id);
  if (index >= 0) {
    history[index] = { ...history[index], ...updates };
    await chrome.storage.local.set({ history });
  }
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.set({ history: [] });
}

// ---- Collections ----

export async function getCollections(): Promise<Collection[]> {
  const { collections } = await chrome.storage.local.get('collections');
  return collections || [];
}

export async function saveCollection(collection: Collection): Promise<void> {
  const collections = await getCollections();
  const index = collections.findIndex(c => c.id === collection.id);
  if (index >= 0) {
    collections[index] = collection;
  } else {
    collections.push(collection);
  }
  await chrome.storage.local.set({ collections });
}

export async function deleteCollection(id: string): Promise<void> {
  const collections = await getCollections();
  await chrome.storage.local.set({
    collections: collections.filter(c => c.id !== id),
  });
}
