import { MSG } from '../shared/messages';
import { getStorage, setStorage, clearStorage } from '../shared/storage';
import type { EFilingPayload, DOMSnapshot, FillingProgress } from '../shared/types';
import { USCIS_BASE_URL } from '../shared/constants';

/**
 * Background service worker (Manifest V3).
 * Orchestrates communication between the EZMig dashboard and the USCIS content script.
 *
 * State is stored in chrome.storage.local (not in-memory) because MV3 service
 * workers can be terminated at any time and must be stateless.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    console.error('[EZMig SW] Error handling message:', err);
    sendResponse({ error: err.message });
  });
  return true; // Keep message channel open for async response
});

async function handleMessage(
  message: { type: string; [key: string]: unknown },
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    // ── Dashboard sends form data via the EZMig bridge ──────────
    case MSG.SEND_FORM_DATA: {
      const payload = message.payload as EFilingPayload;

      await setStorage({
        pendingPayload: payload,
        fillingState: 'waiting_for_login',
        dashboardTabId: sender.tab?.id ?? null,
        lastProgress: null,
      });

      // Open USCIS in a new tab
      const tab = await chrome.tabs.create({ url: USCIS_BASE_URL });
      await setStorage({ uscisTabId: tab.id ?? null });

      return { success: true, message: 'USCIS tab opened. Please log in.' };
    }

    // ── USCIS content script reports it loaded on a page ────────
    case MSG.PAGE_READY: {
      await setStorage({ fillingState: 'waiting_for_page' });
      return { success: true };
    }

    // ── USCIS content script sends DOM snapshot for mapping ─────
    case MSG.DOM_SNAPSHOT: {
      const snapshot = message.snapshot as DOMSnapshot;
      const storage = await getStorage();
      const payload = storage.pendingPayload;

      console.log('[EZMig SW] DOM_SNAPSHOT received:', snapshot.fields?.length, 'fields');

      if (!payload) {
        console.error('[EZMig SW] No pending payload in storage');
        return { error: 'No pending payload. Please send form data again from the dashboard.' };
      }

      console.log('[EZMig SW] Payload found, formCode:', payload.formCode, 'apiBaseUrl:', payload.apiBaseUrl);
      await setStorage({ fillingState: 'mapping' });

      // Notify dashboard that we're mapping
      await relayProgress(storage.dashboardTabId, {
        type: 'status',
        step: 'mapping',
        message: 'Mapping fields with AI...',
      });

      // Track the sender tab as USCIS tab (in case the stored one is stale)
      const uscisTabId = sender.tab?.id ?? storage.uscisTabId;
      if (sender.tab?.id && sender.tab.id !== storage.uscisTabId) {
        console.log('[EZMig SW] Updating uscisTabId from', storage.uscisTabId, 'to', sender.tab.id);
        await setStorage({ uscisTabId: sender.tab.id });
      }

      try {
        // Call AI mapping API
        console.log('[EZMig SW] Calling AI mapping API...');
        const mappings = await callAIMappingAPI(payload, snapshot);
        console.log('[EZMig SW] AI mapping returned', mappings.length, 'mappings');

        await setStorage({ fillingState: 'filling' });

        await relayProgress(storage.dashboardTabId, {
          type: 'status',
          step: 'filling',
          message: `Filling ${mappings.length} fields...`,
        });

        // Return mappings directly in the response (no separate START_FILLING message)
        return { success: true, fieldCount: mappings.length, mappings };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'AI mapping failed';
        console.error('[EZMig SW] AI mapping error:', errorMsg);

        await setStorage({ fillingState: 'error' });

        // Notify the USCIS content script about the error
        if (uscisTabId) {
          try {
            await chrome.tabs.sendMessage(uscisTabId, {
              type: MSG.MAPPING_ERROR,
              error: errorMsg,
            });
          } catch { /* tab may have been closed */ }
        }

        await relayProgress(storage.dashboardTabId, {
          type: 'error',
          message: errorMsg,
        });

        return { error: errorMsg };
      }
    }

    // ── USCIS content script reports field filling progress ─────
    case MSG.FILLING_PROGRESS: {
      const progress = message.progress as FillingProgress;
      const storage = await getStorage();

      await setStorage({ lastProgress: progress });
      await relayProgress(storage.dashboardTabId, progress);

      return { success: true };
    }

    // ── Filling complete ────────────────────────────────────────
    case MSG.FILLING_COMPLETE: {
      const progress = message.progress as FillingProgress;
      const storage = await getStorage();

      await setStorage({
        fillingState: 'done',
        lastProgress: progress,
      });

      await relayProgress(storage.dashboardTabId, progress);

      return { success: true };
    }

    // ── Popup requests current status ───────────────────────────
    case MSG.GET_STATUS: {
      return await getStorage();
    }

    // ── Reset extension state ───────────────────────────────────
    case MSG.RESET: {
      await clearStorage();
      return { success: true };
    }

    default:
      return { error: `Unknown message type: ${message.type}` };
  }
}

// ─── AI Mapping API Call ────────────────────────────────────────

async function callAIMappingAPI(
  payload: EFilingPayload,
  snapshot: DOMSnapshot
): Promise<unknown[]> {
  const url = `${payload.apiBaseUrl}/api/e-filing/ai-map`;
  console.log('[EZMig SW] Fetching:', url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout (matches API maxDuration)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payload.sessionToken}`,
      },
      body: JSON.stringify({
        formCode: payload.formCode,
        formSchema: payload.formSchema,
        formData: payload.formData,
        domSnapshot: snapshot,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('[EZMig SW] API response status:', response.status);

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      console.error('[EZMig SW] API error body:', text);
      throw new Error(`API returned ${response.status}: ${text}`);
    }

    const data = await response.json();
    console.log('[EZMig SW] Mappings received:', data.mappings?.length ?? 0);
    return data.mappings || [];
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('API request timed out (60s). Is the server running?');
    }
    throw err;
  }
}

// ─── Progress Relay ─────────────────────────────────────────────

async function relayProgress(
  dashboardTabId: number | null,
  progress: FillingProgress
): Promise<void> {
  if (!dashboardTabId) return;

  try {
    await chrome.tabs.sendMessage(dashboardTabId, {
      type: MSG.PROGRESS_UPDATE,
      progress,
    });
  } catch {
    // Dashboard tab may have been closed — ignore
  }
}

// ─── Tab Close Detection ────────────────────────────────────────

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const storage = await getStorage();

  if (tabId === storage.uscisTabId) {
    // USCIS tab was closed — reset if still in progress
    if (
      storage.fillingState !== 'done' &&
      storage.fillingState !== 'idle'
    ) {
      await setStorage({
        fillingState: 'error',
        uscisTabId: null,
        lastProgress: {
          type: 'error',
          message: 'USCIS tab was closed before filling completed.',
        },
      });

      await relayProgress(storage.dashboardTabId, {
        type: 'error',
        message: 'USCIS tab was closed before filling completed.',
      });
    }
  }
});
