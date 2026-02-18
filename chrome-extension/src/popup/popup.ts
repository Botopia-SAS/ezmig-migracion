import { MSG } from '../shared/messages';
import type { ExtensionStorage, FillingState } from '../shared/types';

const STATUS_LABELS: Record<FillingState, { text: string; class: string }> = {
  idle: { text: 'Idle — No active e-filing', class: 'status-idle' },
  waiting_for_login: { text: 'Waiting for USCIS login...', class: 'status-active' },
  waiting_for_page: { text: 'Waiting for form page...', class: 'status-active' },
  extracting: { text: 'Analyzing page fields...', class: 'status-active' },
  mapping: { text: 'Mapping fields with AI...', class: 'status-active' },
  filling: { text: 'Filling form fields...', class: 'status-active' },
  done: { text: 'Filling complete!', class: 'status-done' },
  error: { text: 'Error occurred', class: 'status-error' },
};

async function updatePopup() {
  const storage = (await chrome.runtime.sendMessage({
    type: MSG.GET_STATUS,
  })) as ExtensionStorage;

  const statusEl = document.getElementById('status-value')!;
  const formCodeEl = document.getElementById('form-code')!;
  const progressEl = document.getElementById('progress-summary')!;
  const resetBtn = document.getElementById('reset-btn')! as HTMLButtonElement;

  // Status
  const info = STATUS_LABELS[storage.fillingState] || STATUS_LABELS.idle;
  statusEl.textContent = info.text;
  statusEl.className = `status-value ${info.class}`;

  // Form code
  if (storage.pendingPayload) {
    formCodeEl.textContent = `Form: ${storage.pendingPayload.formCode}`;
    formCodeEl.style.display = 'block';
  } else {
    formCodeEl.style.display = 'none';
  }

  // Progress summary
  const progress = storage.lastProgress;
  if (progress && progress.type === 'complete') {
    progressEl.innerHTML = `
      <div class="stat"><span>Filled:</span><span>${progress.fieldsFilled || 0}</span></div>
      <div class="stat"><span>Skipped:</span><span>${progress.fieldsSkipped || 0}</span></div>
      <div class="stat"><span>Failed:</span><span>${progress.fieldsFailed || 0}</span></div>
    `;
    progressEl.style.display = 'block';
  } else if (progress && progress.type === 'error') {
    progressEl.innerHTML = `<div style="color: #dc2626">${progress.message || 'Unknown error'}</div>`;
    progressEl.style.display = 'block';
  } else {
    progressEl.style.display = 'none';
  }

  // Reset button visibility
  resetBtn.style.display = storage.fillingState !== 'idle' ? 'block' : 'none';
}

// Reset handler
document.getElementById('reset-btn')?.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: MSG.RESET });
  await updatePopup();
});

// Initial render + poll every 2s
updatePopup();
setInterval(updatePopup, 2000);
