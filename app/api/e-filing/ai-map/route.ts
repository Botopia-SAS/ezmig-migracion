import { NextRequest, NextResponse } from 'next/server';
import { successResponse, handleRouteError, errorResponse } from '@/lib/api/response';
import { buildFieldMappings } from '@/lib/e-filing/uscis-field-map';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { jwtVerify } from 'jose';
import type { FormSchema } from '@/lib/forms/service';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface DOMFieldInfo {
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
  nearbyText?: string;
}

interface DOMSnapshot {
  url: string;
  pageTitle: string;
  fields: DOMFieldInfo[];
  pageHTML?: string;
}

interface AIFieldMapping {
  selector: string;
  value: string;
  resolvedValue?: string;
  fieldPath: string;
  label: string;
  inputType: 'text' | 'select' | 'radio' | 'checkbox' | 'date' | 'click-element' | 'click-sequence';
  confidence: number;
  clickSequence?: Array<{ selector: string; waitMs?: number }>;
  optionText?: string;
}

// ─── JSON Parsing Helper ────────────────────────────────────────

/**
 * Robustly extract and parse a JSON array from Claude's response.
 * Handles: raw JSON, markdown-wrapped JSON, text before/after JSON.
 */
function parseJSONArray(raw: string): unknown[] {
  let text = raw.trim();

  // Strip markdown code blocks
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // If text doesn't start with [, try to find the JSON array
  if (!text.startsWith('[')) {
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
  }

  return JSON.parse(text);
}

// ─── CORS Handler ───────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ─── Main Handler ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid Authorization header', 401);
    }

    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || 'fallback-secret-for-development'
    );

    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.purpose !== 'e-filing-extension') {
        return errorResponse('Invalid token purpose', 403);
      }
    } catch {
      return errorResponse('Invalid or expired token', 401);
    }

    const body = await request.json();
    const { formCode, formSchema, formData, domSnapshot } = body as {
      formCode: string;
      formSchema: FormSchema;
      formData: Record<string, unknown>;
      domSnapshot: DOMSnapshot;
    };

    if (!formSchema || !formData || !domSnapshot) {
      return errorResponse('Missing required fields', 400);
    }

    const fieldsToFill = buildFieldMappings(formSchema, formData);
    console.log(`[AI Map] Form: ${formCode}, DOM fields: ${domSnapshot.fields.length}, Schema mappings: ${fieldsToFill.length}, pageHTML: ${domSnapshot.pageHTML ? `${(domSnapshot.pageHTML.length / 1024).toFixed(1)}KB` : 'none'}`);
    console.log(`[AI Map] Fields to fill:`, fieldsToFill.map(f => `${f.fieldPath}: "${f.label.slice(0, 40)}" = "${f.value}" (${f.inputType})`));

    let matched: AIFieldMapping[];

    // ── Primary: Full-page AI analysis (when compact HTML is available) ──
    if (domSnapshot.pageHTML && process.env.ANTHROPIC_API_KEY) {
      console.log(`[AI Map] Using full-page AI analysis`);
      matched = await fullPageAIAnalysis(fieldsToFill, domSnapshot as DOMSnapshot & { pageHTML: string }, formSchema);
      console.log(`[AI Map] Full-page AI: ${matched.length} mappings returned`);
    } else {
      // ── Fallback: Legacy tier-based approach ──
      console.log(`[AI Map] Falling back to legacy tier-based matching`);
      matched = await legacyTierMatching(fieldsToFill, domSnapshot);
    }

    console.log(`[AI Map] TOTAL: ${matched.length} mappings returned`);
    const response = NextResponse.json({ mappings: matched });
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  } catch (error) {
    return handleRouteError(error, 'Failed to generate field mappings');
  }
}

// ─── Full-Page AI Analysis ──────────────────────────────────────

interface WebFieldMapping {
  fieldPath: string;
  label: string;
  value: string;
  inputType: 'text' | 'select' | 'radio' | 'checkbox' | 'date';
  selectors?: string[];
}

/**
 * Finds a field definition in the raw form schema by its fieldPath.
 * Returns the raw schema field which includes fallbackLabel, options, etc.
 */
function findFieldInSchema(schema: FormSchema, fieldPath: string): Record<string, unknown> | null {
  const [partId, sectionId, fieldId] = fieldPath.split('.');
  const parts = (schema as unknown as { parts: Array<Record<string, unknown>> }).parts;
  const part = parts?.find((p: Record<string, unknown>) => p.id === partId) as Record<string, unknown> | undefined;
  const sections = part?.sections as Array<Record<string, unknown>> | undefined;
  const section = sections?.find((s: Record<string, unknown>) => s.id === sectionId) as Record<string, unknown> | undefined;
  const fields = section?.fields as Array<Record<string, unknown>> | undefined;
  return fields?.find((f: Record<string, unknown>) => f.id === fieldId) ?? null;
}

/**
 * Strips {{...}} template placeholders from a label.
 */
function cleanLabel(label: string): string {
  return label
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

async function fullPageAIAnalysis(
  fieldsToFill: WebFieldMapping[],
  domSnapshot: DOMSnapshot & { pageHTML: string },
  formSchema: FormSchema
): Promise<AIFieldMapping[]> {
  if (fieldsToFill.length === 0) {
    console.log('[AI Map] Full-page: No fields to fill, returning empty');
    return [];
  }

  // Enrich fields with clean labels, options, and selector hints from the schema
  const enrichedFields = fieldsToFill.map(f => {
    const schemaField = findFieldInSchema(formSchema, f.fieldPath);
    const fallbackLabel = schemaField?.fallbackLabel as string | undefined;
    const label = fallbackLabel || cleanLabel(f.label) || f.label;

    // Get options for select/radio fields
    let optionsStr = '';
    if (f.inputType === 'radio' || f.inputType === 'select') {
      const options = schemaField?.options as Array<{ value: string; label: string } | string> | undefined;
      if (options) {
        optionsStr = options.map(o =>
          typeof o === 'object' ? `${o.value}=${o.label}` : o
        ).join(', ');
      }
    }

    const selectorHints = f.selectors?.join(', ') || '';

    return { ...f, label, optionsStr, selectorHints };
  });

  console.log(`[AI Map] Enriched fields:`, enrichedFields.map(f => `${f.fieldPath}: "${f.label.slice(0, 50)}" val="${f.value}" opts=[${f.optionsStr.slice(0, 60)}]`));

  const prompt = `You are analyzing a USCIS immigration form webpage to map form data to interactive HTML elements.

## Page HTML
The cleaned HTML of the USCIS form page at ${domSnapshot.url}.
Each element has a unique "data-ezmig-idx" attribute you MUST use for selectors.

<page_html>
${domSnapshot.pageHTML}
</page_html>

## Form Data to Fill
Match each field below to an interactive element in the HTML. The "value" is our internal identifier — find the USCIS element that represents this choice.

${enrichedFields.map(f => {
  let entry = `- fieldPath: "${f.fieldPath}"\n  label: "${f.label}"\n  value: "${f.value}"\n  expectedType: ${f.inputType}`;
  if (f.optionsStr) entry += `\n  possibleOptions: [${f.optionsStr}]`;
  if (f.selectorHints) entry += `\n  selectorHints: [${f.selectorHints}]`;
  return entry;
}).join('\n\n')}

## Instructions
1. For each field, find the matching interactive element in the HTML.
2. Elements include: <input>, <select>, <textarea>, divs with role="combobox" (MUI Select), custom styled radio/checkbox elements, clickable divs/spans.
3. ALWAYS use data-ezmig-idx selectors: [data-ezmig-idx="N"]
4. For MUI Select dropdowns (role="combobox"): use inputType "select". Set optionText to the visible option text that matches our value.
5. For non-standard radio controls (divs/spans that act as radio options): use inputType "click-element". Set the selector to the SPECIFIC OPTION to click (not the group).
6. For multi-step interactions (open dropdown then pick option): use inputType "click-sequence" with clickSequence array.
7. The "value" field is our internal identifier (e.g., "spouse", "us_citizen"). Match it semantically to USCIS options (e.g., "spouse" → "Petition for Spouse" or "Spouse").

Return a JSON array. Each element:
- "fieldPath": exact fieldPath from above
- "selector": [data-ezmig-idx="N"] selector
- "inputType": "text" | "select" | "radio" | "checkbox" | "date" | "click-element" | "click-sequence"
- "value": the value to fill
- "optionText": (for select/click) the exact visible text of the option to select
- "clickSequence": (for click-sequence) array of {"selector": "[data-ezmig-idx=\\"N\\"]", "waitMs": 300}
- "confidence": 0.0-1.0

Only include fields with a matching element on THIS page. Omit fields not present.
Return ONLY the JSON array, no markdown, no explanation.`;

  console.log(`[AI Map] Full-page prompt: ${enrichedFields.length} fields, HTML: ${(domSnapshot.pageHTML.length / 1024).toFixed(1)}KB, prompt: ${(prompt.length / 1024).toFixed(1)}KB`);

  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a JSON-only API. You MUST respond with a raw JSON array and nothing else. No text before or after. No markdown fences. No explanations. If no fields match, return an empty array: []',
    prompt,
    maxTokens: 8192,
  });

  console.log(`[AI Map] Claude raw response (first 500 chars): ${result.text.slice(0, 500)}`);

  try {
    const aiResults = parseJSONArray(result.text) as Array<{
      fieldPath: string;
      selector: string;
      inputType: string;
      value: string;
      optionText?: string;
      clickSequence?: Array<{ selector: string; waitMs?: number }>;
      confidence: number;
    }>;

    console.log(`[AI Map] Claude returned ${aiResults.length} raw mappings:`, aiResults.map(r => `${r.fieldPath}: ${r.selector} (${r.inputType}, conf=${r.confidence})`));

    return aiResults
      .filter(r => r.confidence >= 0.5)
      .map(r => {
        const field = fieldsToFill.find(f => f.fieldPath === r.fieldPath);
        return {
          selector: r.selector,
          value: r.value || field?.value || '',
          resolvedValue: r.optionText,
          fieldPath: r.fieldPath,
          label: field?.label || r.fieldPath,
          inputType: r.inputType as AIFieldMapping['inputType'],
          confidence: r.confidence,
          clickSequence: r.clickSequence,
          optionText: r.optionText,
        };
      })
      .filter(m => m.value !== '');
  } catch (err) {
    console.error('[AI Map] Failed to parse full-page AI response:', result.text.slice(0, 1000));
    return [];
  }
}

// ─── Legacy Tier-Based Matching (fallback) ──────────────────────

async function legacyTierMatching(
  deterministicMappings: WebFieldMapping[],
  domSnapshot: DOMSnapshot
): Promise<AIFieldMapping[]> {
  const matched: AIFieldMapping[] = [];
  const unmatched: typeof deterministicMappings = [];

  // Tier 1: Deterministic
  for (const mapping of deterministicMappings) {
    const domField = findMatchInDOM(mapping, domSnapshot.fields);
    if (domField) {
      matched.push({
        selector: domField.cssSelector,
        value: mapping.value,
        fieldPath: mapping.fieldPath,
        label: mapping.label,
        inputType: mapping.inputType,
        confidence: 0.95,
      });
    } else {
      unmatched.push(mapping);
    }
  }

  // Tier 2: Fuzzy label
  const stillUnmatched: typeof deterministicMappings = [];
  for (const mapping of unmatched) {
    const domField = fuzzyLabelMatch(mapping, domSnapshot.fields);
    if (domField) {
      matched.push({
        selector: domField.cssSelector,
        value: mapping.value,
        fieldPath: mapping.fieldPath,
        label: mapping.label,
        inputType: mapping.inputType,
        confidence: 0.75,
      });
    } else {
      stillUnmatched.push(mapping);
    }
  }

  // Tier 3: Claude AI
  if (stillUnmatched.length > 0 && domSnapshot.fields.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      const aiMappings = await callClaudeForMapping(stillUnmatched, domSnapshot);
      matched.push(...aiMappings);
    } catch (err) {
      console.error('[AI Map] Legacy Tier 3 failed:', err);
    }
  }

  // Value resolution
  if (matched.length > 0 && process.env.ANTHROPIC_API_KEY) {
    try {
      await resolveValuesWithAI(matched, domSnapshot.fields);
    } catch (err) {
      console.error('[AI Map] Value resolution failed:', err);
    }
  }

  return matched;
}

// ─── Tier 1: Deterministic Matching ─────────────────────────────

function findMatchInDOM(
  mapping: { selectors?: string[]; label: string; inputType: string },
  domFields: DOMFieldInfo[]
): DOMFieldInfo | null {
  if (!mapping.selectors) return null;

  for (const selector of mapping.selectors) {
    // Extract the key part from the selector (e.g., [name*="FamilyName"] -> FamilyName)
    const match = selector.match(/\*="([^"]+)"/);
    if (!match) continue;

    const searchTerm = match[1].toLowerCase();

    for (const domField of domFields) {
      if (domField.isDisabled) continue;

      // Check id, name, aria-label
      if (
        domField.id?.toLowerCase().includes(searchTerm) ||
        domField.name?.toLowerCase().includes(searchTerm) ||
        domField.ariaLabel?.toLowerCase().includes(searchTerm)
      ) {
        // Verify type compatibility
        if (isTypeCompatible(mapping.inputType, domField)) {
          return domField;
        }
      }
    }
  }

  return null;
}

// ─── Tier 2: Fuzzy Label Matching ───────────────────────────────

function fuzzyLabelMatch(
  mapping: { label: string; inputType: string },
  domFields: DOMFieldInfo[]
): DOMFieldInfo | null {
  const labelTokens = tokenize(mapping.label);
  let bestMatch: DOMFieldInfo | null = null;
  let bestScore = 0;

  for (const domField of domFields) {
    if (domField.isDisabled) continue;

    // Compare with all text sources
    const candidates = [
      ...domField.labels,
      domField.ariaLabel || '',
      domField.placeholder || '',
      domField.nearbyText || '',
    ].filter(Boolean);

    for (const candidate of candidates) {
      const candidateTokens = tokenize(candidate);
      const score = tokenOverlap(labelTokens, candidateTokens);

      if (score > bestScore && score > 0.5 && isTypeCompatible(mapping.inputType, domField)) {
        bestScore = score;
        bestMatch = domField;
      }
    }
  }

  return bestMatch;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function tokenOverlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  const matches = a.filter((t) => setB.has(t)).length;
  return matches / Math.max(a.length, b.length);
}

function isTypeCompatible(inputType: string, domField: DOMFieldInfo): boolean {
  switch (inputType) {
    case 'select':
      return (
        domField.tagName === 'select' ||
        domField.tagName === 'div' ||
        domField.type === 'combobox'
      );
    case 'checkbox':
      return domField.type === 'checkbox';
    case 'radio':
      // USCIS renders radios as: native input[type=radio], <select> dropdowns,
      // div[role="radio"], or div[role="radiogroup"]
      return (
        domField.type === 'radio' ||
        domField.type === 'radiogroup' ||
        domField.tagName === 'select' ||
        domField.tagName === 'div'
      );
    case 'text':
    case 'date':
      return (
        domField.tagName === 'input' ||
        domField.tagName === 'textarea'
      );
    default:
      return true;
  }
}

// ─── Tier 3: Claude AI Mapping ──────────────────────────────────

async function callClaudeForMapping(
  unmatchedFields: Array<{
    fieldPath: string;
    label: string;
    value: string;
    inputType: string;
  }>,
  domSnapshot: DOMSnapshot
): Promise<AIFieldMapping[]> {
  // Limit DOM fields to avoid token overflow
  const relevantDOMFields = domSnapshot.fields
    .filter((f) => !f.isDisabled && f.isVisible)
    .slice(0, 100);

  const prompt = `You are a USCIS form field mapping assistant. Match form data fields to DOM elements on the USCIS website.

## Form Data Fields (to fill):
${unmatchedFields.map((f) => `- Path: "${f.fieldPath}", Label: "${f.label}", Type: ${f.inputType}`).join('\n')}

## DOM Fields on Page (${domSnapshot.url}):
${relevantDOMFields.map((f) => `- Selector: "${f.cssSelector}", Tag: ${f.tagName}, Type: ${f.type || 'N/A'}, ID: ${f.id || 'N/A'}, Name: ${f.name || 'N/A'}, Labels: [${f.labels.map((l) => `"${l}"`).join(', ')}], Placeholder: ${f.placeholder || 'N/A'}${f.options ? ', Options: [' + f.options.slice(0, 10).join(', ') + ']' : ''}`).join('\n')}

## Instructions:
Match each form data field to the best corresponding DOM field.
Return a JSON array where each element has:
- "fieldPath": the form data field path (exact match from above)
- "selector": the cssSelector of the matching DOM element
- "inputType": "text", "select", "radio", "checkbox", or "date"
- "confidence": 0.0-1.0 confidence score

Only include matches where confidence >= 0.5. If a field has no good match, omit it.
Return ONLY the JSON array, no markdown, no explanation.`;

  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a JSON-only API. Respond with a raw JSON array and nothing else. No text, no markdown.',
    prompt,
    maxTokens: 4096,
  });

  try {
    const aiMatches = parseJSONArray(result.text) as Array<{
      fieldPath: string;
      selector: string;
      inputType: string;
      confidence: number;
    }>;

    return aiMatches
      .filter((m) => m.confidence >= 0.5)
      .map((m) => {
        const field = unmatchedFields.find((f) => f.fieldPath === m.fieldPath);
        return {
          selector: m.selector,
          value: field?.value || '',
          fieldPath: m.fieldPath,
          label: field?.label || m.fieldPath,
          inputType: m.inputType as AIFieldMapping['inputType'],
          confidence: m.confidence,
        };
      })
      .filter((m) => m.value !== '');
  } catch (err) {
    console.error('[AI Map] Failed to parse Claude response:', result.text);
    return [];
  }
}

// ─── Value Resolution with AI ────────────────────────────────────

/**
 * For radio/select fields, resolves our internal values (e.g., "spouse", "us_citizen")
 * to the actual USCIS option values/labels. This prevents mismatches when our schema
 * uses different identifiers than the USCIS website.
 */
async function resolveValuesWithAI(
  mappings: AIFieldMapping[],
  domFields: DOMFieldInfo[]
): Promise<void> {
  // Find mappings that need value resolution (radio/select with DOM options)
  const needsResolution: Array<{
    index: number;
    mapping: AIFieldMapping;
    domOptions: string[];
  }> = [];

  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    if (m.inputType !== 'radio' && m.inputType !== 'select') continue;

    // Find the DOM field to get its options
    const domField = domFields.find((f) => f.cssSelector === m.selector);
    if (!domField?.options || domField.options.length === 0) continue;

    // Try deterministic resolution first
    const resolved = deterministicValueResolve(m.value, domField.options, m.inputType);
    if (resolved) {
      console.log(`[AI Map] Value resolved deterministically: "${m.value}" -> "${resolved}"`);
      m.resolvedValue = resolved;
      continue;
    }

    needsResolution.push({ index: i, mapping: m, domOptions: domField.options });
  }

  if (needsResolution.length === 0) return;

  console.log(`[AI Map] Value resolution: ${needsResolution.length} fields need AI resolution`);

  // Batch all unresolved fields into a single Claude call
  const prompt = `You are matching form field values to USCIS website options. For each field below, determine which USCIS option best matches the given value.

## Fields to resolve:
${needsResolution.map((nr, i) => `${i + 1}. Field: "${nr.mapping.label}" (${nr.mapping.inputType})
   Our value: "${nr.mapping.value}"
   USCIS options: [${nr.domOptions.map((o) => `"${o}"`).join(', ')}]`).join('\n\n')}

## Instructions:
For each field, return the EXACT text of the matching USCIS option. For radio options in format "value=label", return ONLY the "value" part (before the =).

Return a JSON array where each element has:
- "index": the field number (1-based)
- "resolvedValue": the exact USCIS option value to use
- "confidence": 0.0-1.0

Return ONLY the JSON array.`;

  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: 'You are a JSON-only API. Respond with a raw JSON array and nothing else. No text, no markdown.',
    prompt,
    maxTokens: 2048,
  });

  try {
    const resolutions = parseJSONArray(result.text) as Array<{
      index: number;
      resolvedValue: string;
      confidence: number;
    }>;

    for (const res of resolutions) {
      if (res.confidence < 0.5) continue;
      const nr = needsResolution[res.index - 1];
      if (!nr) continue;

      console.log(`[AI Map] AI resolved: "${nr.mapping.value}" -> "${res.resolvedValue}" (confidence: ${res.confidence})`);
      mappings[nr.index].resolvedValue = res.resolvedValue;
    }
  } catch (err) {
    console.error('[AI Map] Failed to parse value resolution response:', result.text);
  }
}

/**
 * Try to resolve a value to an option without AI.
 * Returns the resolved value or null if no confident match.
 */
function deterministicValueResolve(
  value: string,
  options: string[],
  inputType: string
): string | null {
  const lower = value.toLowerCase().replace(/_/g, ' ');

  for (const opt of options) {
    // Radio options come as "value=label" from the extractor
    const isRadioFormat = opt.includes('=');
    const optValue = isRadioFormat ? opt.split('=')[0].trim() : opt;
    const optLabel = isRadioFormat ? opt.split('=').slice(1).join('=').trim() : opt;
    const optLower = optLabel.toLowerCase();
    const optValueLower = optValue.toLowerCase();

    // Exact match on value
    if (optValueLower === value.toLowerCase() || optValueLower === lower) {
      return optValue;
    }

    // Exact match on label
    if (optLower === lower) {
      return optValue;
    }

    // Label contains our value
    if (optLower.includes(lower) && lower.length >= 3) {
      return optValue;
    }
  }

  // For select elements, also try matching against just the text
  if (inputType === 'select') {
    for (const opt of options) {
      if (opt.toLowerCase().includes(lower) && lower.length >= 3) {
        return opt;
      }
    }
  }

  return null;
}
