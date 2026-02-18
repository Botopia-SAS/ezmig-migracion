import type { FormSchema } from '@/lib/forms/service';

// ─── Step IDs ────────────────────────────────────────────────────

export type EFilingStepId =
  | 'prepare'
  | 'launch_browser'
  | 'navigate_uscis'
  | 'login'
  | 'captcha_wait'
  | 'navigate_form'
  | 'fill_fields'
  | 'review'
  | 'done';

export type StepStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'waiting'
  | 'skipped';

// ─── SSE Event Types ─────────────────────────────────────────────

export interface EFilingStepEvent {
  type: 'step';
  step: EFilingStepId;
  status: StepStatus;
  message: string;
  timestamp: number;
}

export interface EFilingFieldEvent {
  type: 'field';
  fieldName: string;
  fieldPath: string;
  status: 'filled' | 'skipped' | 'failed';
  value?: string;
  reason?: string;
}

export interface EFilingScreenshotEvent {
  type: 'screenshot';
  base64: string;
  label: string;
}

export interface EFilingErrorEvent {
  type: 'error';
  step: EFilingStepId;
  code: string;
  message: string;
  recoverable: boolean;
}

export interface EFilingCompleteEvent {
  type: 'complete';
  fieldsAttempted: number;
  fieldsFilled: number;
  fieldsSkipped: number;
  fieldsFailed: number;
  duration: number; // seconds
}

export type EFilingEvent =
  | EFilingStepEvent
  | EFilingFieldEvent
  | EFilingScreenshotEvent
  | EFilingErrorEvent
  | EFilingCompleteEvent;

// ─── Bot Config ──────────────────────────────────────────────────

export interface BotConfig {
  caseFormId: number;
  formCode: string;
  formData: Record<string, unknown>;
  formSchema: FormSchema;
  credentials?: {
    email: string;
    password: string;
  };
}

// ─── Chrome Extension Types ──────────────────────────────────────

export type ExtensionStepId =
  | 'prepare'
  | 'send_to_extension'
  | 'waiting_login'
  | 'extracting'
  | 'mapping'
  | 'filling'
  | 'done';

export interface DOMFieldInfo {
  tagName: string;
  type: string;
  id: string;
  name: string;
  ariaLabel: string;
  placeholder: string;
  labels: string[];
  options: string[];
  cssSelector: string;
  nearbyText: string;
}

export interface DOMSnapshot {
  url: string;
  title: string;
  fields: DOMFieldInfo[];
  timestamp: number;
}

export interface AIFieldMapping {
  selector: string;
  value: string;
  fieldPath: string;
  label: string;
  inputType: string;
  confidence: number;
}

export interface EFilingPayload {
  caseFormId: number;
  formCode: string;
  formSchema: FormSchema;
  formData: Record<string, unknown>;
  sessionToken: string;
  apiBaseUrl?: string;
}
