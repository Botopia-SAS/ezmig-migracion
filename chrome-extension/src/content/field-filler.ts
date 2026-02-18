import type { AIFieldMapping } from '../shared/types';

/**
 * Fills a single DOM field using native APIs compatible with React/Angular change detection.
 * Ported from the Playwright-based bot.ts fillElement() logic.
 */
export async function fillField(
  mapping: AIFieldMapping,
): Promise<{ success: boolean; reason?: string }> {
  const el = document.querySelector(mapping.selector);
  if (!el) return { success: false, reason: 'Element not found' };

  const htmlEl = el as HTMLElement;

  // Scroll into view
  htmlEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(100);

  // Visual highlight: blue outline while filling
  const originalOutline = htmlEl.style.outline;
  const originalOutlineOffset = htmlEl.style.outlineOffset;
  htmlEl.style.outline = '2px solid #3b82f6';
  htmlEl.style.outlineOffset = '2px';

  try {
    const fillValue = mapping.resolvedValue || mapping.value;

    console.log(`[EZMig] Filling: ${mapping.label} | type: ${mapping.inputType} | value: "${mapping.value}" | resolved: "${mapping.resolvedValue || '(none)'}" | optionText: "${mapping.optionText || '(none)'}"`);

    // ── AI-directed interaction types ──
    if (mapping.inputType === 'click-element') {
      // Check if target is inside an MUI Select — use proper MUI handler instead of raw click
      const muiTrigger = detectMUISelect(htmlEl);
      if (muiTrigger) {
        // Use our value for matching — Claude's optionText may be wrong (e.g. "Select one" placeholder)
        const searchValue = mapping.value || mapping.optionText || fillValue;
        console.log(`[EZMig] click-element target is MUI Select child, redirecting to fillMUISelect with "${searchValue}"`);
        await fillMUISelect(muiTrigger, searchValue);
      } else {
        await fillByClick(htmlEl, mapping);
      }
    } else if (mapping.inputType === 'click-sequence') {
      await fillByClickSequence(mapping);
    } else {
      // ── Standard fill types ──
      const actualTag = htmlEl.tagName.toLowerCase();
      const actualType = (htmlEl as HTMLInputElement).type?.toLowerCase();
      const effectiveType = getEffectiveType(mapping.inputType, actualTag, actualType, htmlEl);

      // Detect MUI Select: hidden input inside MUI component, OR div[role="combobox"]
      const shouldTryMUI = (
        (mapping.inputType === 'radio' || mapping.inputType === 'select') &&
        (
          (actualTag === 'input' && actualType === 'text') ||
          (actualTag === 'div' && htmlEl.getAttribute('role') === 'combobox')
        )
      );
      const muiSelect = shouldTryMUI
        ? (detectMUISelect(htmlEl) || (actualTag === 'div' ? htmlEl : null))
        : null;

      if (muiSelect) {
        await fillMUISelect(muiSelect, mapping.optionText || fillValue);
      } else {
        switch (effectiveType) {
          case 'text':
          case 'date':
            fillTextInput(htmlEl as HTMLInputElement, fillValue);
            break;
          case 'select':
            await fillSelect(htmlEl, mapping.optionText || fillValue);
            break;
          case 'checkbox':
            fillCheckbox(htmlEl as HTMLInputElement, fillValue);
            break;
          case 'radio':
            await fillRadioByValue(htmlEl as HTMLInputElement, fillValue);
            break;
          case 'aria-radio':
            await fillARIARadio(htmlEl, fillValue);
            break;
        }
      }
    }

    // Success: green outline briefly
    htmlEl.style.outline = '2px solid #10b981';
    setTimeout(() => {
      htmlEl.style.outline = originalOutline;
      htmlEl.style.outlineOffset = originalOutlineOffset;
    }, 1500);

    return { success: true };
  } catch (error) {
    // Failure: red outline briefly
    htmlEl.style.outline = '2px solid #ef4444';
    setTimeout(() => {
      htmlEl.style.outline = originalOutline;
      htmlEl.style.outlineOffset = originalOutlineOffset;
    }, 1500);

    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── Input Type Handlers ────────────────────────────────────────

/**
 * Fills a text/date input using the native value setter pattern.
 * This triggers React/Angular change detection properly.
 */
function fillTextInput(input: HTMLInputElement, value: string): void {
  input.focus();

  // Use the native setter to bypass React's synthetic event system
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value'
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(input, value);
  } else {
    input.value = value;
  }

  // Dispatch events in order: input -> change -> blur
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  input.dispatchEvent(new Event('blur', { bubbles: true }));
}

/**
 * Fills a <select> or custom dropdown element.
 * Uses native setter + full event sequence for React/Angular compatibility.
 */
async function fillSelect(el: HTMLElement, value: string): Promise<void> {
  const tag = el.tagName.toLowerCase();

  if (tag === 'select') {
    const select = el as HTMLSelectElement;

    // Find matching option: exact text -> exact value -> partial text
    const matchOption = (v: string) => {
      const lower = v.toLowerCase();
      return (
        Array.from(select.options).find(
          (o) => o.text.trim().toLowerCase() === lower || o.value.toLowerCase() === lower
        ) ||
        Array.from(select.options).find(
          (o) => o.text.trim().toLowerCase().includes(lower) || lower.includes(o.text.trim().toLowerCase())
        )
      );
    };

    const option = matchOption(value);
    if (!option) {
      const allOptions = Array.from(select.options).map(o => `"${o.text}" (val=${o.value})`);
      console.error(`[EZMig] Select options available:`, allOptions);
      throw new Error(`Option "${value}" not found in select (${select.options.length} options)`);
    }

    console.log(`[EZMig] Select: matching "${value}" -> "${option.text}" (value="${option.value}", index=${option.index})`);

    // --- Strategy: Simulate full user interaction for Angular/React compatibility ---

    // 1. Focus the element
    select.focus();
    select.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    select.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    await sleep(50);

    // 2. Simulate mousedown (opens dropdown in some frameworks)
    select.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await sleep(50);

    // 3. Set the value using multiple methods
    // Method A: Set option.selected directly
    option.selected = true;

    // Method B: Set select.value via native setter
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype, 'value'
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(select, option.value);
    }

    // Method C: Set selectedIndex
    select.selectedIndex = option.index;

    // 4. Dispatch the full event sequence
    select.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    select.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    select.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    await sleep(50);

    // 5. Blur to finalize
    select.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    select.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    // 6. Verify
    console.log(`[EZMig] Select after fill: value="${select.value}", selectedIndex=${select.selectedIndex}, text="${select.options[select.selectedIndex]?.text}"`);
  } else {
    // Custom dropdown: click to open, then find and click matching option
    el.click();
    await sleep(300);

    const options = document.querySelectorAll(
      '[role="option"], [role="menuitem"], li[data-value]'
    );

    let found = false;
    for (const opt of options) {
      const text = opt.textContent?.trim().toLowerCase();
      if (text === value.toLowerCase() || text?.includes(value.toLowerCase())) {
        (opt as HTMLElement).click();
        found = true;
        break;
      }
    }

    if (!found) {
      throw new Error(`Option "${value}" not found in custom dropdown`);
    }
  }
}

/**
 * Fills a checkbox input.
 */
function fillCheckbox(input: HTMLInputElement, value: string): void {
  const shouldCheck = value === 'true' || value === '1' || value === 'yes';

  if (input.checked !== shouldCheck) {
    input.checked = shouldCheck;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('click', { bubbles: true }));
  }
}

/**
 * Finds the correct radio button in a group by matching the value against
 * each radio's value attribute and associated label text, then clicks it.
 *
 * USCIS radio values are like "spouse", "us_citizen", "lpr" and labels are
 * like "Spouse", "U.S. Citizen (by birth or naturalization)", etc.
 */
async function fillRadioByValue(input: HTMLInputElement, value: string): Promise<void> {
  const lower = value.toLowerCase().replace(/_/g, ' ');

  // Collect all radios in the same group
  const name = input.getAttribute('name');
  const radios: HTMLInputElement[] = name
    ? Array.from(document.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(name)}"]`))
    : [input];

  console.log(`[EZMig] Radio group "${name}": ${radios.length} buttons, looking for "${value}"`);

  // Score each radio against the target value
  let bestRadio: HTMLInputElement | null = null;
  let bestScore = 0;

  for (const radio of radios) {
    const radioValue = radio.value?.toLowerCase().replace(/_/g, ' ') || '';
    const labelText = getRadioLabel(radio).toLowerCase();

    let score = 0;

    // Exact value match (highest priority)
    if (radioValue === lower || radioValue === value.toLowerCase()) {
      score = 10;
    }
    // Label contains the value words
    else if (labelText.includes(lower)) {
      score = 8;
    }
    // Value contains label (e.g., value="us_citizen" -> "us citizen", label="citizen")
    else if (lower.includes(labelText) && labelText.length > 2) {
      score = 6;
    }
    // Token overlap: split both into words and count matches
    else {
      const valueTokens = lower.split(/[\s_-]+/).filter(t => t.length > 1);
      const labelTokens = labelText.split(/[\s_-]+/).filter(t => t.length > 1);
      const matches = valueTokens.filter(t => labelTokens.some(lt => lt.includes(t) || t.includes(lt))).length;
      if (matches > 0) {
        score = matches / Math.max(valueTokens.length, 1) * 5;
      }
    }

    console.log(`[EZMig] Radio option: value="${radio.value}", label="${getRadioLabel(radio)}", score=${score}`);

    if (score > bestScore) {
      bestScore = score;
      bestRadio = radio;
    }
  }

  if (!bestRadio) {
    const available = radios.map(r => `"${r.value}" (${getRadioLabel(r)})`);
    console.error(`[EZMig] Radio: no match for "${value}". Available:`, available);
    throw new Error(`Radio option "${value}" not found (${radios.length} options)`);
  }

  console.log(`[EZMig] Radio: selecting value="${bestRadio.value}", label="${getRadioLabel(bestRadio)}" (score=${bestScore})`);

  // Determine if the radio is visually hidden (framework-styled)
  const radioRect = bestRadio.getBoundingClientRect();
  const radioStyle = getComputedStyle(bestRadio);
  const isHidden =
    (radioRect.width === 0 && radioRect.height === 0) ||
    radioStyle.display === 'none' ||
    radioStyle.visibility === 'hidden' ||
    radioStyle.opacity === '0';

  if (isHidden) {
    // Framework-hidden radio: find and click the visible wrapper
    let visibleTarget: HTMLElement | null = null;
    if (bestRadio.id) {
      visibleTarget = document.querySelector<HTMLElement>(`label[for="${CSS.escape(bestRadio.id)}"]`);
    }
    if (!visibleTarget) visibleTarget = bestRadio.closest('label');
    if (!visibleTarget) visibleTarget = bestRadio.closest('[role="radio"]');
    if (!visibleTarget) visibleTarget = bestRadio.parentElement;

    if (visibleTarget) {
      console.log(`[EZMig] Radio is hidden, clicking visible wrapper: ${visibleTarget.tagName}.${visibleTarget.className}`);
      visibleTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      visibleTarget.click();
      await sleep(100);
    } else {
      bestRadio.click();
    }
  } else {
    // Radio is visible, click it directly
    bestRadio.focus();
    bestRadio.click();
  }

  await sleep(50);

  // Ensure checked state and dispatch events for framework compatibility
  if (!bestRadio.checked) {
    bestRadio.checked = true;
  }
  bestRadio.dispatchEvent(new Event('input', { bubbles: true }));
  bestRadio.dispatchEvent(new Event('change', { bubbles: true }));

  // Scroll to the selected radio for visual feedback
  bestRadio.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Gets the label text for a radio button by checking:
 * 1. <label for="id"> element
 * 2. Parent <label> element
 * 3. aria-label attribute
 * 4. Nearby text in the same container
 */
function getRadioLabel(radio: HTMLInputElement): string {
  // 1. <label for="id">
  if (radio.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(radio.id)}"]`);
    if (label) return label.textContent?.trim() || '';
  }

  // 2. Parent <label>
  const parentLabel = radio.closest('label');
  if (parentLabel) {
    // Get text excluding the radio input itself
    const clone = parentLabel.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input').forEach(i => i.remove());
    return clone.textContent?.trim() || '';
  }

  // 3. aria-label
  const ariaLabel = radio.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // 4. aria-labelledby
  const labelledBy = radio.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.textContent?.trim() || '';
  }

  // 5. Next sibling text
  const next = radio.nextElementSibling || radio.nextSibling;
  if (next) {
    const text = next.textContent?.trim();
    if (text) return text;
  }

  return '';
}

// ─── ARIA Radio Support (Angular/MUI styled radios) ──────────────

/**
 * Fills an ARIA-based radio group (div[role="radiogroup"] or div[role="radio"]).
 * Common in Angular/MUI where native <input type="radio"> is hidden.
 */
async function fillARIARadio(el: HTMLElement, value: string): Promise<void> {
  const lower = value.toLowerCase().replace(/_/g, ' ');

  // Find the radiogroup container
  const radioGroup = el.getAttribute('role') === 'radiogroup'
    ? el
    : el.closest('[role="radiogroup"]') || el.parentElement;

  if (!radioGroup) {
    throw new Error('Could not find ARIA radiogroup container');
  }

  const radios = radioGroup.querySelectorAll('[role="radio"]');
  console.log(`[EZMig] ARIA radio group: ${radios.length} options, looking for "${value}"`);

  let bestOption: HTMLElement | null = null;
  let bestScore = 0;

  for (const radio of radios) {
    const htmlRadio = radio as HTMLElement;
    const text = (htmlRadio.textContent?.trim() || '').toLowerCase();
    const ariaLabel = (htmlRadio.getAttribute('aria-label') || '').toLowerCase();
    const dataValue = (htmlRadio.dataset?.value || '').toLowerCase();
    const candidate = text || ariaLabel;

    let score = 0;
    if (dataValue === lower || dataValue === value.toLowerCase()) score = 10;
    else if (candidate === lower) score = 10;
    else if (candidate.includes(lower)) score = 8;
    else if (lower.includes(candidate) && candidate.length > 2) score = 6;
    else {
      const valTokens = lower.split(/[\s_-]+/).filter(t => t.length > 1);
      const optTokens = candidate.split(/[\s_\-,.()]+/).filter(t => t.length > 1);
      const matches = valTokens.filter(t => optTokens.some(ot => ot.includes(t) || t.includes(ot))).length;
      if (matches > 0) score = (matches / Math.max(valTokens.length, 1)) * 5;
    }

    console.log(`[EZMig] ARIA radio option: text="${text}", score=${score}`);

    if (score > bestScore) {
      bestScore = score;
      bestOption = htmlRadio;
    }
  }

  if (!bestOption) {
    throw new Error(`ARIA radio option "${value}" not found (${radios.length} options)`);
  }

  console.log(`[EZMig] ARIA radio: clicking "${bestOption.textContent?.trim()}" (score=${bestScore})`);
  bestOption.scrollIntoView({ behavior: 'smooth', block: 'center' });
  bestOption.click();
  await sleep(100);

  bestOption.dispatchEvent(new Event('change', { bubbles: true }));
  bestOption.dispatchEvent(new Event('input', { bubbles: true }));
}

// ─── AI-Directed Click Handlers ─────────────────────────────────

/**
 * Fills a non-standard control by directly clicking it.
 * Used for custom radio buttons, div-based toggles, etc.
 * If optionText is provided, searches within the element for matching text.
 */
async function fillByClick(el: HTMLElement, mapping: AIFieldMapping): Promise<void> {
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await sleep(100);

  console.log(`[EZMig] click-element: clicking ${el.tagName}#${el.id || ''} [data-ezmig-idx=${el.dataset?.ezmigIdx || '?'}]`);

  // Try mousedown first (MUI pattern), then click
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
  await sleep(50);
  el.click();
  await sleep(150);

  // Dispatch change events for framework compatibility
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Fills a control that requires a sequence of clicks.
 * Claude provides the exact sequence of selectors and wait times.
 * Example: open dropdown → wait → click option.
 */
async function fillByClickSequence(mapping: AIFieldMapping): Promise<void> {
  if (!mapping.clickSequence || mapping.clickSequence.length === 0) {
    throw new Error('click-sequence mapping has no clickSequence defined');
  }

  console.log(`[EZMig] click-sequence: ${mapping.clickSequence.length} steps for "${mapping.label}"`);

  for (let i = 0; i < mapping.clickSequence.length; i++) {
    const step = mapping.clickSequence[i];
    const el = document.querySelector(step.selector) as HTMLElement;
    if (!el) {
      throw new Error(`Sequence step ${i + 1} failed: element not found for "${step.selector}"`);
    }

    console.log(`[EZMig] click-sequence step ${i + 1}: ${el.tagName}#${el.id || ''} [${step.selector}]`);

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await sleep(50);

    // Try mousedown first (MUI pattern), then click
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    await sleep(50);
    el.click();

    await sleep(step.waitMs || 300);
  }

  // Dispatch change events on the last element
  const lastStep = mapping.clickSequence[mapping.clickSequence.length - 1];
  const lastEl = document.querySelector(lastStep.selector) as HTMLElement;
  if (lastEl) {
    lastEl.dispatchEvent(new Event('change', { bubbles: true }));
    lastEl.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// ─── MUI Select Support (USCIS uses Material UI) ────────────────

/**
 * Detects if an element is inside a Material UI Select component.
 * Returns the clickable trigger element if found.
 */
export function detectMUISelect(el: HTMLElement): HTMLElement | null {
  // Walk up the DOM looking STRICTLY for MuiSelect-specific classes.
  // MuiInputBase-root is too generic (wraps all MUI inputs, not just selects).
  // [role="button"] is too generic (matches navigation links).
  let current: HTMLElement | null = el;
  for (let i = 0; i < 5; i++) {
    if (!current) break;

    // Check if this element or a nearby child has MuiSelect-select class
    if (current.classList?.contains('MuiSelect-select')) {
      console.log(`[EZMig] MUI Select detected: direct MuiSelect-select`);
      return current;
    }

    // Check children for MuiSelect-select (the hidden input's parent may contain it)
    const selectChild = current.querySelector(':scope > .MuiSelect-select');
    if (selectChild) {
      console.log(`[EZMig] MUI Select detected: child MuiSelect-select`);
      return selectChild as HTMLElement;
    }

    current = current.parentElement;
  }
  return null;
}

/**
 * Fills a Material UI Select by clicking the trigger and selecting an option.
 * USCIS uses MUI Select for dropdowns like eligibility category.
 *
 * MUI Select opens on mousedown (not click). The dropdown is rendered in a
 * portal at the body level as .MuiPopover-paper > .MuiMenu-list with
 * role="listbox" or role="menu" depending on version.
 */
async function fillMUISelect(trigger: HTMLElement, value: string): Promise<void> {
  console.log(`[EZMig] MUI Select: opening dropdown via mousedown...`);

  // Snapshot ALL existing portal containers before opening
  const existingContainers = new Set(
    document.querySelectorAll(
      '[role="listbox"], [role="presentation"], .MuiPopover-paper, .MuiMenu-paper, .MuiModal-root'
    )
  );

  // MUI Select opens on mouseDown — dispatch it properly
  trigger.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));

  // Wait and retry — MUI dropdown may take a moment to render via portal
  let container: Element | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    await sleep(200 + attempt * 200);
    container = findNewMUIDropdown(existingContainers);
    if (container) break;
  }

  // Fallback: try a full click in case mousedown alone didn't work
  if (!container) {
    console.log(`[EZMig] MUI Select: mousedown didn't open dropdown, trying click...`);
    trigger.click();
    await sleep(600);
    container = findNewMUIDropdown(existingContainers);
  }

  if (!container) {
    // Log what we CAN see for debugging
    const allListboxes = document.querySelectorAll('[role="listbox"]');
    const allPopovers = document.querySelectorAll('.MuiPopover-paper');
    const allMenus = document.querySelectorAll('.MuiMenu-list, .MuiMenu-paper');
    console.error(`[EZMig] MUI dropdown debug: listboxes=${allListboxes.length}, popovers=${allPopovers.length}, menus=${allMenus.length}`);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    throw new Error(`MUI dropdown did not open (listboxes=${allListboxes.length}, popovers=${allPopovers.length})`);
  }

  // Query options ONLY within the opened container
  const options = container.querySelectorAll('[role="option"], .MuiMenuItem-root, li[data-value], li');

  console.log(`[EZMig] MUI Select: found ${options.length} options, searching for "${value}"`);

  const matched = matchMUIOption(options, value);

  if (!matched) {
    const allTexts = Array.from(options).map(o => `"${o.textContent?.trim()}" (data-value=${(o as HTMLElement).dataset?.value || 'n/a'})`);
    console.error(`[EZMig] MUI Select: no match for "${value}". Available:`, allTexts);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    throw new Error(`Option "${value}" not found in MUI Select (${options.length} options)`);
  }

  console.log(`[EZMig] MUI Select: clicking matched option "${matched.textContent?.trim()}"`);
  matched.click();
  await sleep(300);
  console.log(`[EZMig] MUI Select: option clicked successfully`);
}

/**
 * Finds a NEW MUI dropdown container that appeared after the trigger was clicked.
 * MUI renders dropdowns in portals at body level with various class/role combos.
 */
function findNewMUIDropdown(existingContainers: Set<Element>): Element | null {
  // Strategy 1: New [role="listbox"]
  for (const el of document.querySelectorAll('[role="listbox"]')) {
    if (!existingContainers.has(el)) return el;
  }

  // Strategy 2: New .MuiPopover-paper / .MuiMenu-paper (then find list inside)
  for (const el of document.querySelectorAll('.MuiPopover-paper, .MuiMenu-paper')) {
    if (!existingContainers.has(el)) {
      return el.querySelector('[role="listbox"], .MuiMenu-list, .MuiList-root, ul') || el;
    }
  }

  // Strategy 3: New [role="presentation"] portal (MUI Modal wrapper)
  for (const el of document.querySelectorAll('[role="presentation"]')) {
    if (!existingContainers.has(el)) {
      const inner = el.querySelector('[role="listbox"], .MuiMenu-list, .MuiList-root, .MuiPopover-paper ul, ul');
      if (inner) return inner;
    }
  }

  // Strategy 4: New .MuiModal-root
  for (const el of document.querySelectorAll('.MuiModal-root')) {
    if (!existingContainers.has(el)) {
      const inner = el.querySelector('[role="listbox"], .MuiMenu-list, ul');
      if (inner) return inner;
    }
  }

  return null;
}

/**
 * Fuzzy-matches a value against MUI dropdown options.
 * Handles cases like value="spouse" matching "I am filing for my spouse".
 * Uses a scoring system similar to fillRadioByValue.
 */
function matchMUIOption(options: NodeListOf<Element>, value: string): HTMLElement | null {
  const lower = value.toLowerCase().replace(/_/g, ' ').trim();
  const tokens = lower.split(/[\s_-]+/).filter(t => t.length > 1);

  let bestOption: HTMLElement | null = null;
  let bestScore = 0;

  for (const opt of options) {
    const text = (opt.textContent?.trim() || '').toLowerCase();
    const dataValue = ((opt as HTMLElement).dataset?.value || '').toLowerCase();

    if (!text && !dataValue) continue;

    let score = 0;

    // Exact match on text or data-value (highest)
    if (text === lower || dataValue === lower) {
      score = 10;
    }
    // Text contains the value verbatim (e.g. "spouse" in "I am filing for my spouse")
    else if (text.includes(lower)) {
      score = 8;
    }
    // data-value contains value
    else if (dataValue.includes(lower)) {
      score = 8;
    }
    // Value contains the full text (unlikely but handle)
    else if (lower.includes(text) && text.length > 2) {
      score = 6;
    }
    // Token overlap: e.g. "us citizen" tokens match "U.S. Citizen" tokens
    else {
      const optTokens = text.split(/[\s_\-,.()]+/).filter(t => t.length > 1);
      const matches = tokens.filter(t =>
        optTokens.some(ot => ot.includes(t) || t.includes(ot))
      ).length;
      if (matches > 0) {
        score = (matches / Math.max(tokens.length, 1)) * 5;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestOption = opt as HTMLElement;
    }
  }

  if (bestOption) {
    console.log(`[EZMig] MUI Select: best match "${bestOption.textContent?.trim()}" (score=${bestScore})`);
  }

  return bestScore >= 1 ? bestOption : null;
}

// ─── Utilities ──────────────────────────────────────────────────

/**
 * Resolves the actual fill strategy based on both the mapping type and the real DOM element.
 * USCIS often renders radio-like questions as <select> dropdowns.
 */
function getEffectiveType(
  mappedType: string,
  actualTag: string,
  actualType: string,
  el?: HTMLElement
): string {
  // If the DOM element is a <select>, always use select strategy
  if (actualTag === 'select') return 'select';
  // If the DOM element is a radio, always use radio
  if (actualType === 'radio') return 'radio';
  // If the DOM element is a checkbox, always use checkbox
  if (actualType === 'checkbox') return 'checkbox';
  // Handle ARIA role-based elements
  if (el) {
    const role = el.getAttribute('role');
    if (role === 'radio' || role === 'radiogroup') return 'aria-radio';
    if (role === 'checkbox') return 'checkbox';
  }
  // Otherwise trust the mapping
  return mappedType;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
