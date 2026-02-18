import { MSG } from '../shared/messages';
import { EVENTS, VERSION } from '../shared/constants';

/**
 * Content script injected on EZMig pages (localhost:3000 / *.ezmig.com).
 * Bridges CustomEvents on the page DOM with chrome.runtime messaging.
 */

// ─── Safe messaging (handles extension reload gracefully) ────

function safeSendMessage(
  message: unknown,
  callback?: (response: unknown) => void
) {
  try {
    chrome.runtime.sendMessage(message, callback);
  } catch {
    console.warn('[EZMig Bridge] Extension context invalidated. Please refresh the page.');
    window.dispatchEvent(
      new CustomEvent(EVENTS.EXTENSION_RESPONSE, {
        detail: { error: 'Extension was updated. Please refresh this page.' },
      })
    );
  }
}

// ─── Signal extension is installed ──────────────────────────

function signalReady() {
  // chrome.runtime.id is undefined when the extension context is invalidated
  // (e.g., after extension reload). Don't signal ready in that case —
  // the dashboard will show "Install Extension" which prompts a page refresh.
  if (!chrome.runtime?.id) return;

  window.dispatchEvent(
    new CustomEvent(EVENTS.EXTENSION_READY, { detail: { version: VERSION } })
  );
}

// Signal immediately and on ping
signalReady();
window.addEventListener(EVENTS.PING_EXTENSION, signalReady);

// ─── Listen for form data from dashboard ────────────────────

window.addEventListener(EVENTS.SEND_TO_EXTENSION, ((event: CustomEvent) => {
  if (!chrome.runtime?.id) {
    window.dispatchEvent(
      new CustomEvent(EVENTS.EXTENSION_RESPONSE, {
        detail: { error: 'Extension was updated. Please refresh this page.' },
      })
    );
    return;
  }

  const payload = event.detail;

  safeSendMessage(
    { type: MSG.SEND_FORM_DATA, payload },
    (response) => {
      window.dispatchEvent(
        new CustomEvent(EVENTS.EXTENSION_RESPONSE, { detail: response })
      );
    }
  );
}) as EventListener);

// ─── Listen for progress updates from background ────────────

try {
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === MSG.PROGRESS_UPDATE) {
      window.dispatchEvent(
        new CustomEvent(EVENTS.FILLING_PROGRESS, { detail: message.progress })
      );
    }
  });
} catch {
  console.warn('[EZMig Bridge] Could not register message listener — extension context invalidated.');
}
