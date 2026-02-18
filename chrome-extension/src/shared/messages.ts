/** Message types for chrome.runtime.sendMessage communication */
export const MSG = {
  // Dashboard -> Extension (via EZMig content script bridge)
  SEND_FORM_DATA: 'SEND_FORM_DATA',

  // Background -> USCIS content script
  MAPPING_ERROR: 'MAPPING_ERROR',

  // USCIS content script -> Background
  PAGE_READY: 'PAGE_READY',
  DOM_SNAPSHOT: 'DOM_SNAPSHOT',
  FILLING_PROGRESS: 'FILLING_PROGRESS',
  FILLING_COMPLETE: 'FILLING_COMPLETE',
  START_EXTRACTION: 'START_EXTRACTION',

  // Background -> EZMig content script (progress feedback)
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',

  // Popup
  GET_STATUS: 'GET_STATUS',
  RESET: 'RESET',
} as const;

export type MessageType = (typeof MSG)[keyof typeof MSG];
