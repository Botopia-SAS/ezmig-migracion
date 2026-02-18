import type { ExtensionStorage } from './types';

const DEFAULTS: ExtensionStorage = {
  pendingPayload: null,
  fillingState: 'idle',
  lastProgress: null,
  dashboardTabId: null,
  uscisTabId: null,
};

export async function getStorage(): Promise<ExtensionStorage> {
  const data = await chrome.storage.local.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...data } as ExtensionStorage;
}

export async function setStorage(
  updates: Partial<ExtensionStorage>
): Promise<void> {
  await chrome.storage.local.set(updates);
}

export async function clearStorage(): Promise<void> {
  await chrome.storage.local.set(DEFAULTS);
}
