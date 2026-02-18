import type { DOMSnapshot, DOMFieldInfo } from '../shared/types';
import { detectMUISelect } from './field-filler';

/**
 * Extracts a structured snapshot of all form fields on the current USCIS page,
 * plus a compact HTML representation for full-page AI analysis.
 */
export function extractDOMSnapshot(): DOMSnapshot {
  // ── Stamp elements with unique indices for AI targeting ──
  stampElements();

  // ── Traditional field extraction (kept as fallback data) ──
  const fields: DOMFieldInfo[] = [];

  const elements = document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), ' +
      'select, textarea, ' +
      '[role="combobox"], [role="listbox"], ' +
      '[role="radio"], [role="radiogroup"], [role="checkbox"]'
  );

  for (const el of elements) {
    const info = extractFieldInfo(el as HTMLElement);
    if (info) fields.push(info);
  }

  // De-duplicate: if a radiogroup is present, remove its child [role="radio"] entries
  const radiogroupSelectors = new Set(
    fields.filter(f => f.type === 'radiogroup').map(f => f.cssSelector)
  );
  const deduped = radiogroupSelectors.size > 0
    ? fields.filter(f => {
        if (f.type !== 'radio') return true;
        const el = document.querySelector(f.cssSelector);
        if (el) {
          const parentGroup = el.closest('[role="radiogroup"]');
          if (parentGroup) {
            const parentSel = buildUniqueSelector(parentGroup as HTMLElement);
            if (radiogroupSelectors.has(parentSel)) return false;
          }
        }
        return true;
      })
    : fields;

  // ── Extract compact HTML for full-page AI analysis ──
  const pageHTML = extractCompactHTML();

  console.log(`[EZMig] DOM extraction: ${deduped.length} fields found, compact HTML: ${(pageHTML.length / 1024).toFixed(1)}KB`);
  for (const f of deduped) {
    console.log(`[EZMig]   - ${f.tagName}#${f.id || '?'} type=${f.type || 'N/A'} labels=[${f.labels.join(', ')}] options=${f.options?.length || 0}`);
  }

  return {
    url: window.location.href,
    pageTitle: document.title,
    fields: deduped,
    pageHTML,
  };
}

// ─── Element Stamping ────────────────────────────────────────────

/**
 * Stamps every element in the live DOM with a unique `data-ezmig-idx` attribute.
 * This allows Claude to reference elements with simple `[data-ezmig-idx="N"]` selectors.
 */
function stampElements(): void {
  // Remove any previous stamps first
  const existing = document.querySelectorAll('[data-ezmig-idx]');
  for (const el of existing) el.removeAttribute('data-ezmig-idx');

  let idx = 0;
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT
  );
  let node: Node | null = walker.currentNode;
  while (node) {
    (node as HTMLElement).setAttribute('data-ezmig-idx', String(idx++));
    node = walker.nextNode();
  }
  console.log(`[EZMig] Stamped ${idx} elements with data-ezmig-idx`);
}

// ─── Compact HTML Extraction ─────────────────────────────────────

const REMOVE_TAGS = new Set([
  'SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT', 'IFRAME', 'IMG',
  'VIDEO', 'AUDIO', 'CANVAS', 'LINK', 'META', 'HEAD',
]);

const KEEP_ATTRS = new Set([
  'data-ezmig-idx', 'data-value', 'data-testid',
  'id', 'name', 'type', 'value', 'role',
  'aria-label', 'aria-labelledby', 'aria-checked', 'aria-selected',
  'aria-disabled', 'aria-expanded', 'aria-haspopup',
  'for', 'placeholder', 'disabled', 'checked', 'selected', 'tabindex',
]);

const FRAMEWORK_CLASS_RE = /mui|mat-|radio|select|checkbox|button|input|combobox|listbox|menu|form|field|control|toggle|option|choice|eligib/i;

/**
 * Creates a compact HTML representation of the page body.
 * Removes noise (scripts, styles, images) and strips non-essential attributes,
 * keeping only what Claude needs to identify interactive form elements.
 */
function extractCompactHTML(): string {
  const clone = document.body.cloneNode(true) as HTMLElement;

  // Remove noise elements
  const toRemove: Element[] = [];
  clone.querySelectorAll('*').forEach(el => {
    if (REMOVE_TAGS.has(el.tagName)) toRemove.push(el);
  });
  for (const el of toRemove) el.remove();

  // Clean attributes on remaining elements
  const allElements = clone.querySelectorAll('*');
  for (const el of allElements) {
    const attrsToRemove: string[] = [];
    for (const attr of el.attributes) {
      if (KEEP_ATTRS.has(attr.name)) continue;
      // Keep aria-* attributes
      if (attr.name.startsWith('aria-')) continue;
      // Keep class only if it contains framework-identifying keywords
      if (attr.name === 'class') {
        if (FRAMEWORK_CLASS_RE.test(attr.value)) {
          // Truncate to relevant class names only
          const trimmed = attr.value.split(/\s+/)
            .filter(c => FRAMEWORK_CLASS_RE.test(c))
            .slice(0, 5)
            .join(' ');
          el.setAttribute('class', trimmed);
        } else {
          attrsToRemove.push('class');
        }
        continue;
      }
      attrsToRemove.push(attr.name);
    }
    for (const attr of attrsToRemove) {
      el.removeAttribute(attr);
    }
  }

  // Collapse whitespace
  let html = clone.innerHTML;
  html = html.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');

  // If over 60KB, remove common non-form regions
  if (html.length > 60000) {
    clone.querySelectorAll(
      'header, footer, nav, [role="banner"], [role="navigation"], [role="contentinfo"]'
    ).forEach(el => el.remove());
    html = clone.innerHTML.replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><');
  }

  // Hard cap at 80KB
  if (html.length > 80000) {
    html = html.substring(0, 80000) + '<!-- truncated -->';
  }

  return html;
}

// ─── Cleanup ─────────────────────────────────────────────────────

/**
 * Removes all data-ezmig-idx attributes from the live DOM.
 * Called after filling completes.
 */
export function cleanupStampedAttributes(): void {
  const stamped = document.querySelectorAll('[data-ezmig-idx]');
  for (const el of stamped) el.removeAttribute('data-ezmig-idx');
  console.log(`[EZMig] Cleaned up ${stamped.length} data-ezmig-idx attributes`);
}

// ─── Field Info Extraction (existing logic) ──────────────────────

function extractFieldInfo(el: HTMLElement): DOMFieldInfo | null {
  const tagName = el.tagName.toLowerCase();
  const input = el as HTMLInputElement;
  const role = el.getAttribute('role');

  const isRadioOrCheckbox =
    input.type === 'radio' ||
    input.type === 'checkbox' ||
    role === 'radio' ||
    role === 'radiogroup' ||
    role === 'checkbox';

  if (!isRadioOrCheckbox) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return null;
  }

  const labels = findLabels(el);
  const cssSelector = buildUniqueSelector(el);

  let options: string[] | undefined;
  let isMUISelect = false;

  if (tagName === 'select') {
    options = Array.from((el as HTMLSelectElement).options)
      .filter((o) => o.value !== '')
      .map((o) => o.text.trim());
  } else if (input.type === 'radio' && input.name) {
    const radios = document.querySelectorAll<HTMLInputElement>(
      `input[type="radio"][name="${CSS.escape(input.name)}"]`
    );
    if (radios.length > 1) {
      options = Array.from(radios).map((r) => {
        const label = findLabels(r).join(' ') || r.value;
        return `${r.value}=${label}`;
      });
    }
  } else if (role === 'radiogroup') {
    const ariaRadios = el.querySelectorAll('[role="radio"]');
    if (ariaRadios.length > 0) {
      options = Array.from(ariaRadios).map((r) => {
        const htmlR = r as HTMLElement;
        const label = htmlR.textContent?.trim() ||
          htmlR.getAttribute('aria-label') || '';
        const val = htmlR.getAttribute('data-value') ||
          htmlR.getAttribute('value') || label;
        return `${val}=${label}`;
      });
    }
  } else if (role === 'radio') {
    const radioGroup = el.closest('[role="radiogroup"]');
    if (radioGroup) {
      const ariaRadios = radioGroup.querySelectorAll('[role="radio"]');
      if (ariaRadios.length > 1) {
        options = Array.from(ariaRadios).map((r) => {
          const htmlR = r as HTMLElement;
          const label = htmlR.textContent?.trim() ||
            htmlR.getAttribute('aria-label') || '';
          const val = htmlR.getAttribute('data-value') ||
            htmlR.getAttribute('value') || label;
          return `${val}=${label}`;
        });
      }
    }
  } else if (tagName === 'input' && input.type === 'text') {
    isMUISelect = detectMUISelect(el) !== null;
  }

  const effectiveType = input.type ||
    (role === 'radio' ? 'radio' : undefined) ||
    (role === 'radiogroup' ? 'radiogroup' : undefined) ||
    (role === 'checkbox' ? 'checkbox' : undefined) ||
    (role === 'combobox' ? 'combobox' : undefined) ||
    undefined;

  const nearbyText = getNearbyText(el);

  return {
    tagName,
    type: effectiveType,
    id: el.id || undefined,
    name: input.name || undefined,
    ariaLabel: el.getAttribute('aria-label') || undefined,
    placeholder: input.placeholder || undefined,
    labels,
    options,
    cssSelector,
    isVisible: true,
    isDisabled: input.disabled || el.getAttribute('aria-disabled') === 'true',
    currentValue: input.value || undefined,
    nearbyText,
    ...(isMUISelect ? { isMUISelect: true } : {}),
  };
}

// ─── Label Finding ──────────────────────────────────────────────

function findLabels(el: HTMLElement): string[] {
  const labels: string[] = [];

  if (el.id) {
    const labelEls = document.querySelectorAll(
      `label[for="${CSS.escape(el.id)}"]`
    );
    for (const l of labelEls) {
      const text = l.textContent?.trim();
      if (text) labels.push(text);
    }
  }

  const parentLabel = el.closest('label');
  if (parentLabel) {
    const text = parentLabel.textContent?.trim();
    if (text && !labels.includes(text)) labels.push(text);
  }

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    for (const id of labelledBy.split(/\s+/)) {
      const labelEl = document.getElementById(id);
      if (labelEl) {
        const text = labelEl.textContent?.trim();
        if (text && !labels.includes(text)) labels.push(text);
      }
    }
  }

  return labels;
}

// ─── Unique Selector Building ───────────────────────────────────

function buildUniqueSelector(el: HTMLElement): string {
  if (el.id) {
    return `#${CSS.escape(el.id)}`;
  }

  const tag = el.tagName.toLowerCase();
  const name = (el as HTMLInputElement).name;
  const type = (el as HTMLInputElement).type;

  if (name) {
    const selector = `${tag}[name="${CSS.escape(name)}"]`;
    if (document.querySelectorAll(selector).length === 1) return selector;

    if (type) {
      const typedSelector = `${tag}[name="${CSS.escape(name)}"][type="${CSS.escape(type)}"]`;
      if (document.querySelectorAll(typedSelector).length === 1)
        return typedSelector;
    }
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) {
    const selector = `${tag}[aria-label="${CSS.escape(ariaLabel)}"]`;
    if (document.querySelectorAll(selector).length === 1) return selector;
  }

  return generatePathSelector(el);
}

function generatePathSelector(el: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();

    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`);
      break;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (c) => c.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tag}:nth-of-type(${index})`);
      } else {
        parts.unshift(tag);
      }
    } else {
      parts.unshift(tag);
    }

    current = parent;
  }

  return parts.join(' > ');
}

// ─── Nearby Text Extraction ─────────────────────────────────────

function getNearbyText(el: HTMLElement): string {
  const texts: string[] = [];

  const prev = el.previousElementSibling;
  if (prev) {
    const text = prev.textContent?.trim();
    if (text && text.length < 100) texts.push(text);
  }

  const parent = el.parentElement;
  if (parent) {
    for (const node of parent.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length < 100) texts.push(text);
      }
    }
  }

  return texts.join(' | ').slice(0, 200);
}
