// ─── Form Schema Types (mirrored from lib/forms/service.ts) ─────

export interface FormSchema {
  formCode: string;
  parts: FormPart[];
}

export interface FormPart {
  id: string;
  title: string;
  sections: FormSection[];
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  helpText?: string;
  pdfField?: string;
  options?: Array<{ value: string; label: string }> | string[];
  conditionalDisplay?: {
    field: string;
    value: string | boolean | string[];
    operator?: 'equals' | 'notEquals' | 'in' | 'notIn';
  };
}

// ─── Extension Payload ──────────────────────────────────────────

/** Data sent from the EZMig dashboard to the extension */
export interface EFilingPayload {
  caseFormId: number;
  formCode: string;
  formSchema: FormSchema;
  formData: Record<string, unknown>;
  apiBaseUrl: string;
  sessionToken: string;
}

// ─── DOM Snapshot ───────────────────────────────────────────────

export interface DOMSnapshot {
  url: string;
  pageTitle: string;
  fields: DOMFieldInfo[];
  /** Compact HTML of the page body for full-page AI analysis */
  pageHTML?: string;
}

export interface DOMFieldInfo {
  tagName: string;
  type?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
  placeholder?: string;
  labels: string[];
  options?: string[];
  cssSelector: string;
  isVisible: boolean;
  isDisabled: boolean;
  currentValue?: string;
  nearbyText?: string;
  /** True if the element is inside a Material UI Select component */
  isMUISelect?: boolean;
}

// ─── AI Field Mapping ───────────────────────────────────────────

export interface AIFieldMapping {
  selector: string;
  value: string;
  /** AI-resolved value that matches the actual USCIS option text/value */
  resolvedValue?: string;
  fieldPath: string;
  label: string;
  inputType: 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'click-element' | 'click-sequence';
  confidence: number;
  /** For click-sequence: ordered steps to execute */
  clickSequence?: Array<{ selector: string; waitMs?: number }>;
  /** For select/radio: the visible text of the option to select */
  optionText?: string;
}

// ─── Filling Progress ───────────────────────────────────────────

export interface FillingProgress {
  type: 'status' | 'field' | 'complete' | 'error';
  step?: string;
  fieldName?: string;
  fieldPath?: string;
  status?: 'filled' | 'skipped' | 'failed';
  value?: string;
  reason?: string;
  fieldsAttempted?: number;
  fieldsFilled?: number;
  fieldsSkipped?: number;
  fieldsFailed?: number;
  message?: string;
}

// ─── Extension Storage ──────────────────────────────────────────

export type FillingState =
  | 'idle'
  | 'waiting_for_login'
  | 'waiting_for_page'
  | 'extracting'
  | 'mapping'
  | 'filling'
  | 'done'
  | 'error';

export interface ExtensionStorage {
  pendingPayload: EFilingPayload | null;
  fillingState: FillingState;
  lastProgress: FillingProgress | null;
  dashboardTabId: number | null;
  uscisTabId: number | null;
}
