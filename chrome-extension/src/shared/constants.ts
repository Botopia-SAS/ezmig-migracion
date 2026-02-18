/** Extension version */
export const VERSION = '1.0.0';

/** USCIS URL patterns for form detection */
export const USCIS_BASE_URL = 'https://my.uscis.gov';

/** Custom event names for dashboard <-> extension communication */
export const EVENTS = {
  /** Extension signals it's installed and ready */
  EXTENSION_READY: 'ezmig:extension-ready',
  /** Dashboard pings to check if extension is installed */
  PING_EXTENSION: 'ezmig:ping-extension',
  /** Dashboard sends form data to extension */
  SEND_TO_EXTENSION: 'ezmig:send-to-extension',
  /** Extension responds to dashboard */
  EXTENSION_RESPONSE: 'ezmig:extension-response',
  /** Extension sends filling progress to dashboard */
  FILLING_PROGRESS: 'ezmig:filling-progress',
} as const;

/** Delay between filling each field (ms) */
export const FIELD_FILL_DELAY = 200;

/** Minimum confidence to auto-fill a field */
export const MIN_CONFIDENCE = 0.5;
