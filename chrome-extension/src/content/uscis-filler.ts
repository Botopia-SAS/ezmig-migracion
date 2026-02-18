import type { AIFieldMapping, FillingProgress } from '../shared/types';
import { MSG } from '../shared/messages';
import { FIELD_FILL_DELAY, MIN_CONFIDENCE } from '../shared/constants';
import { extractDOMSnapshot, cleanupStampedAttributes } from './uscis-dom-extractor';
import { fillField } from './field-filler';

/**
 * Content script injected on USCIS pages (myaccount.uscis.gov).
 * Orchestrates DOM extraction, overlay management, and field filling.
 */

// ─── Notify background that we're on a USCIS page ──────────────

chrome.runtime.sendMessage({ type: MSG.PAGE_READY });

// ─── Overlay Management ─────────────────────────────────────────

let overlayRoot: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;

function injectOverlay() {
  if (overlayRoot) return;

  overlayRoot = document.createElement('div');
  overlayRoot.id = 'ezmig-efiling-overlay';
  shadowRoot = overlayRoot.attachShadow({ mode: 'closed' });

  // Inject styles
  const style = document.createElement('style');
  style.textContent = getOverlayStyles();
  shadowRoot.appendChild(style);

  // Create AI glow border (full-screen)
  const glowBorder = document.createElement('div');
  glowBorder.className = 'ezmig-glow-border';
  shadowRoot.appendChild(glowBorder);

  // Create container
  const container = document.createElement('div');
  container.className = 'ezmig-overlay';
  container.innerHTML = getOverlayHTML('ready');
  shadowRoot.appendChild(container);

  document.body.appendChild(overlayRoot);

  // Bind start button
  const startBtn = shadowRoot.querySelector('#ezmig-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', handleStartFilling);
  }

  // Bind minimize
  const minimizeBtn = shadowRoot.querySelector('#ezmig-minimize-btn');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      container.classList.toggle('minimized');
    });
  }
}

function updateOverlay(
  state: 'ready' | 'extracting' | 'mapping' | 'filling' | 'done' | 'error',
  message?: string
) {
  if (!shadowRoot) return;
  const container = shadowRoot.querySelector('.ezmig-overlay');
  if (!container) return;

  container.innerHTML = getOverlayHTML(state, message);

  // Toggle the full-screen AI glow border
  const glowBorder = shadowRoot.querySelector('.ezmig-glow-border');
  if (glowBorder) {
    const aiActive = state === 'extracting' || state === 'mapping' || state === 'filling';
    glowBorder.classList.toggle('active', aiActive);
    // Pulse faster during mapping (AI thinking)
    glowBorder.classList.toggle('pulse', state === 'mapping');
    // Success flash on done
    glowBorder.classList.toggle('success', state === 'done');
    // Error flash
    glowBorder.classList.toggle('error', state === 'error');
  }

  // Re-bind buttons based on state
  if (state === 'ready' || state === 'error') {
    const startBtn = shadowRoot.querySelector('#ezmig-start-btn');
    startBtn?.addEventListener('click', handleStartFilling);
  }

  const minimizeBtn = shadowRoot.querySelector('#ezmig-minimize-btn');
  minimizeBtn?.addEventListener('click', () => {
    container.classList.toggle('minimized');
  });
}

function getOverlayHTML(
  state: string,
  message?: string
): string {
  const header = `
    <div class="ezmig-header">
      <div class="ezmig-logo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span>EZMig</span>
      </div>
      <button id="ezmig-minimize-btn" class="ezmig-minimize">&#x2212;</button>
    </div>
  `;

  switch (state) {
    case 'ready':
      return `
        ${header}
        <div class="ezmig-body">
          <p class="ezmig-message">Ready to fill this form with your case data.</p>
          <button id="ezmig-start-btn" class="ezmig-btn ezmig-btn-primary">Fill Form</button>
        </div>
      `;
    case 'extracting':
      return `
        ${header}
        <div class="ezmig-body">
          <div class="ezmig-spinner"></div>
          <p class="ezmig-message">Analyzing page fields...</p>
        </div>
      `;
    case 'mapping':
      return `
        ${header}
        <div class="ezmig-body">
          <div class="ezmig-spinner"></div>
          <p class="ezmig-message">Mapping fields with AI...</p>
        </div>
      `;
    case 'filling':
      return `
        ${header}
        <div class="ezmig-body">
          <div class="ezmig-spinner"></div>
          <p class="ezmig-message">${message || 'Filling fields...'}</p>
          <div id="ezmig-progress-bar" class="ezmig-progress">
            <div class="ezmig-progress-fill" style="width: 0%"></div>
          </div>
        </div>
      `;
    case 'done':
      return `
        ${header}
        <div class="ezmig-body">
          <div class="ezmig-check">&#x2713;</div>
          <p class="ezmig-message">${message || 'Done! Review the fields before submitting.'}</p>
        </div>
      `;
    case 'error':
      return `
        ${header}
        <div class="ezmig-body">
          <div class="ezmig-error-icon">&#x2717;</div>
          <p class="ezmig-message ezmig-error">${message || 'An error occurred.'}</p>
          <button id="ezmig-start-btn" class="ezmig-btn ezmig-btn-primary">Retry</button>
        </div>
      `;
    default:
      return `${header}<div class="ezmig-body"><p class="ezmig-message">Loading...</p></div>`;
  }
}

function getOverlayStyles(): string {
  return `
    /* ── Full-screen AI glow border ─────────────────────── */
    .ezmig-glow-border {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483646;
      border: 2px solid transparent;
      border-radius: 0;
      opacity: 0;
      transition: opacity 0.6s ease, border-color 0.6s ease, box-shadow 0.6s ease;
    }

    .ezmig-glow-border.active {
      opacity: 1;
      border-color: rgba(139, 92, 246, 0.5);
      box-shadow:
        inset 0 0 30px rgba(139, 92, 246, 0.08),
        inset 0 0 60px rgba(139, 92, 246, 0.04),
        0 0 15px rgba(139, 92, 246, 0.15),
        0 0 30px rgba(139, 92, 246, 0.08);
      animation: ezmig-glow-breathe 3s ease-in-out infinite;
    }

    .ezmig-glow-border.active.pulse {
      border-color: rgba(139, 92, 246, 0.6);
      animation: ezmig-glow-pulse 1.5s ease-in-out infinite;
    }

    .ezmig-glow-border.success {
      opacity: 1;
      border-color: rgba(34, 197, 94, 0.5);
      box-shadow:
        inset 0 0 30px rgba(34, 197, 94, 0.08),
        0 0 15px rgba(34, 197, 94, 0.15);
      animation: ezmig-glow-fade-out 2s ease-out forwards;
    }

    .ezmig-glow-border.error {
      opacity: 1;
      border-color: rgba(239, 68, 68, 0.4);
      box-shadow:
        inset 0 0 20px rgba(239, 68, 68, 0.06),
        0 0 10px rgba(239, 68, 68, 0.1);
      animation: ezmig-glow-fade-out 2s ease-out forwards;
    }

    @keyframes ezmig-glow-breathe {
      0%, 100% {
        box-shadow:
          inset 0 0 30px rgba(139, 92, 246, 0.08),
          inset 0 0 60px rgba(139, 92, 246, 0.04),
          0 0 15px rgba(139, 92, 246, 0.15),
          0 0 30px rgba(139, 92, 246, 0.08);
      }
      50% {
        box-shadow:
          inset 0 0 40px rgba(139, 92, 246, 0.12),
          inset 0 0 80px rgba(139, 92, 246, 0.06),
          0 0 20px rgba(139, 92, 246, 0.2),
          0 0 40px rgba(139, 92, 246, 0.1);
      }
    }

    @keyframes ezmig-glow-pulse {
      0%, 100% {
        box-shadow:
          inset 0 0 30px rgba(139, 92, 246, 0.1),
          0 0 15px rgba(139, 92, 246, 0.2),
          0 0 30px rgba(139, 92, 246, 0.1);
        border-color: rgba(139, 92, 246, 0.5);
      }
      50% {
        box-shadow:
          inset 0 0 50px rgba(139, 92, 246, 0.15),
          0 0 25px rgba(139, 92, 246, 0.3),
          0 0 50px rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.7);
      }
    }

    @keyframes ezmig-glow-fade-out {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* ── Overlay panel ──────────────────────────────────── */
    .ezmig-overlay {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(139, 92, 246, 0.15);
      border-radius: 16px;
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(139, 92, 246, 0.05);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1f2937;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .ezmig-overlay.minimized {
      width: 120px;
      height: 36px;
    }

    .ezmig-overlay.minimized .ezmig-body {
      display: none;
    }

    .ezmig-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(124, 58, 237, 0.04));
      border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    }

    .ezmig-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 13px;
      color: #7c3aed;
      letter-spacing: -0.01em;
    }

    .ezmig-minimize {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: #9ca3af;
      padding: 2px 6px;
      line-height: 1;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    .ezmig-minimize:hover {
      background: rgba(139, 92, 246, 0.1);
      color: #7c3aed;
    }

    .ezmig-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .ezmig-message {
      text-align: center;
      margin: 0;
      font-size: 13px;
      color: #4b5563;
      line-height: 1.4;
    }

    .ezmig-btn {
      padding: 10px 24px;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      letter-spacing: -0.01em;
    }

    .ezmig-btn-primary {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      color: white;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
    }

    .ezmig-btn-primary:hover {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    }

    .ezmig-btn-primary:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(139, 92, 246, 0.3);
    }

    .ezmig-spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(139, 92, 246, 0.15);
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: ezmig-spin 0.7s linear infinite;
    }

    @keyframes ezmig-spin {
      to { transform: rotate(360deg); }
    }

    .ezmig-check {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
      animation: ezmig-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .ezmig-error-icon {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      animation: ezmig-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes ezmig-pop-in {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }

    .ezmig-error {
      color: #dc2626 !important;
    }

    .ezmig-progress {
      width: 100%;
      height: 6px;
      background: rgba(139, 92, 246, 0.1);
      border-radius: 3px;
      overflow: hidden;
    }

    .ezmig-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6, #7c3aed, #a78bfa);
      background-size: 200% 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
      animation: ezmig-shimmer 2s ease-in-out infinite;
    }

    @keyframes ezmig-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
}

// ─── Filling Logic ──────────────────────────────────────────────

async function handleStartFilling() {
  try {
    updateOverlay('extracting');

    const snapshot = extractDOMSnapshot();
    console.log('[EZMig] DOM snapshot extracted:', snapshot.fields.length, 'fields on', snapshot.url);

    updateOverlay('mapping');

    // Send snapshot to background -> API for field mapping.
    // Mappings are returned directly in the DOM_SNAPSHOT response.
    const response = await new Promise<{
      success?: boolean;
      error?: string;
      mappings?: AIFieldMapping[];
    }>((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ error: 'Mapping timed out. Check your server is running and try again.' });
      }, 60000);

      chrome.runtime.sendMessage(
        { type: MSG.DOM_SNAPSHOT, snapshot },
        (resp) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message || 'Extension communication error' });
          } else {
            resolve(resp || { error: 'Empty response from background' });
          }
        }
      );
    });

    if (response.error) {
      console.error('[EZMig] Mapping error:', response.error);
      updateOverlay('error', response.error);
      return;
    }

    const mappings = response.mappings || [];
    console.log('[EZMig] Received', mappings.length, 'mappings');
    console.log('[EZMig] Mappings detail:', JSON.stringify(mappings, null, 2));

    if (mappings.length === 0) {
      updateOverlay('done', 'No fillable fields found on this page.');
      return;
    }

    await executeFilling(mappings);
  } catch (error) {
    console.error('[EZMig] Error in handleStartFilling:', error);
    updateOverlay('error', error instanceof Error ? error.message : 'Unexpected error');
  }
}

async function executeFilling(mappings: AIFieldMapping[]) {
  const MAX_ROUNDS = 3;
  let totalFilled = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const filledPaths = new Set<string>();

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    // Filter out already-filled fields
    const roundMappings = mappings.filter(m => !filledPaths.has(m.fieldPath));

    if (roundMappings.length === 0) {
      console.log(`[EZMig] Round ${round}: no new fields to fill, stopping`);
      break;
    }

    console.log(`[EZMig] Round ${round}: filling ${roundMappings.length} fields`);
    updateOverlay('filling', `Round ${round}: Filling ${roundMappings.length} fields...`);

    for (let i = 0; i < roundMappings.length; i++) {
      const mapping = roundMappings[i];

      if (mapping.confidence < MIN_CONFIDENCE) {
        totalSkipped++;
        reportProgress({
          type: 'field',
          fieldName: mapping.label,
          fieldPath: mapping.fieldPath,
          status: 'skipped',
          reason: `Low confidence (${Math.round(mapping.confidence * 100)}%)`,
        });
        continue;
      }

      const result = await fillField(mapping);

      if (result.success) {
        totalFilled++;
        filledPaths.add(mapping.fieldPath);
        console.log(`[EZMig] FILLED: "${mapping.label}" = "${redactSensitive(mapping.value, mapping.fieldPath)}" (selector: ${mapping.selector})`);
        reportProgress({
          type: 'field',
          fieldName: mapping.label,
          fieldPath: mapping.fieldPath,
          status: 'filled',
          value: redactSensitive(mapping.value, mapping.fieldPath),
        });
      } else {
        totalFailed++;
        console.error(`[EZMig] FAILED: "${mapping.label}" - ${result.reason} (selector: ${mapping.selector}, value: "${mapping.value}", resolved: "${mapping.resolvedValue || '(none)'}")`);
        reportProgress({
          type: 'field',
          fieldName: mapping.label,
          fieldPath: mapping.fieldPath,
          status: 'failed',
          reason: result.reason,
        });
      }

      // Update progress bar
      const progress = Math.round(((i + 1) / roundMappings.length) * 100);
      updateOverlay('filling', `Round ${round}: Filling fields... (${i + 1}/${roundMappings.length})`);
      if (shadowRoot) {
        const bar = shadowRoot.querySelector('.ezmig-progress-fill') as HTMLElement;
        if (bar) bar.style.width = `${progress}%`;
      }

      await sleep(FIELD_FILL_DELAY);
    }

    // After filling fields, check if new fields appeared (dynamic form)
    if (round < MAX_ROUNDS && totalFilled > 0) {
      console.log(`[EZMig] Round ${round} complete. Waiting for page re-render...`);
      updateOverlay('mapping', `Checking for new fields after round ${round}...`);
      await sleep(1500); // Wait for dynamic content to render

      // Re-extract the page and request new mappings
      try {
        const newSnapshot = extractDOMSnapshot();
        console.log(`[EZMig] Re-extraction: ${newSnapshot.fields.length} fields, HTML: ${((newSnapshot.pageHTML?.length || 0) / 1024).toFixed(1)}KB`);

        const response = await new Promise<{ mappings?: AIFieldMapping[]; error?: string }>((resolve) => {
          const timeout = setTimeout(() => resolve({ error: 'Re-mapping timed out' }), 60000);
          chrome.runtime.sendMessage(
            { type: MSG.DOM_SNAPSHOT, snapshot: newSnapshot },
            (resp) => {
              clearTimeout(timeout);
              if (chrome.runtime.lastError) {
                resolve({ error: chrome.runtime.lastError.message });
              } else {
                resolve(resp || {});
              }
            }
          );
        });

        if (response?.error) {
          console.error(`[EZMig] Re-mapping error: ${response.error}`);
          break;
        }

        // Mappings come directly in the DOM_SNAPSHOT response
        const newMappings = (response as { mappings?: AIFieldMapping[] }).mappings || [];
        const newUnfilled = newMappings.filter(m => !filledPaths.has(m.fieldPath));
        console.log(`[EZMig] Re-mapping: ${newMappings.length} total, ${newUnfilled.length} new`);
        if (newUnfilled.length > 0) {
          mappings = newMappings; // Use new mappings for next round
        } else {
          console.log(`[EZMig] No new unfilled fields, stopping`);
          break;
        }
      } catch (err) {
        console.error(`[EZMig] Re-extraction failed:`, err);
        break;
      }
    }
  }

  // Complete
  const completeProgress: FillingProgress = {
    type: 'complete',
    fieldsAttempted: totalFilled + totalSkipped + totalFailed,
    fieldsFilled: totalFilled,
    fieldsSkipped: totalSkipped,
    fieldsFailed: totalFailed,
    message: `${totalFilled} filled, ${totalSkipped} skipped, ${totalFailed} failed`,
  };

  chrome.runtime.sendMessage({
    type: MSG.FILLING_COMPLETE,
    progress: completeProgress,
  });

  updateOverlay(
    'done',
    `Done! ${totalFilled} filled, ${totalSkipped} skipped, ${totalFailed} failed. Review before submitting.`
  );

  // Clean up stamped data-ezmig-idx attributes from the DOM
  cleanupStampedAttributes();
}

function reportProgress(progress: FillingProgress) {
  chrome.runtime.sendMessage({ type: MSG.FILLING_PROGRESS, progress });
}

function redactSensitive(value: string, fieldPath: string): string {
  const lower = fieldPath.toLowerCase();
  if (
    lower.includes('ssn') ||
    lower.includes('password') ||
    lower.includes('secret') ||
    lower.includes('alien_number')
  ) {
    return '***';
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Message Listener ───────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case MSG.MAPPING_ERROR: {
      console.error('[EZMig] Received MAPPING_ERROR:', message.error);
      updateOverlay('error', message.error || 'AI mapping failed');
      sendResponse({ success: true });
      break;
    }
  }
  return true;
});

// ─── Initialize ─────────────────────────────────────────────────

// Check if there's pending data and inject overlay on each USCIS page load.
// USCIS forms are multi-page wizards, so we show "Fill Form" on EVERY page.
(async () => {
  // Small delay to let the page settle
  await sleep(1000);

  // Ask background if we have pending data
  const response = await chrome.runtime.sendMessage({ type: MSG.GET_STATUS });
  console.log('[EZMig] Init - fillingState:', response?.fillingState, 'hasPendingPayload:', !!response?.pendingPayload);

  if (response?.pendingPayload) {
    injectOverlay();
    // On a new page, always show "ready" so user can fill this page's fields
    // (previous page may have been 'done' or 'error')
    if (response.fillingState === 'done' || response.fillingState === 'error') {
      updateOverlay('ready');
    }
  }
})();
