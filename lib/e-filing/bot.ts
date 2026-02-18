import type { Browser, Page } from 'playwright';
import type { BotConfig, EFilingStepId } from './types';
import type { SSEEmitter } from './sse-emitter';
import { buildFieldMappings, type WebFieldMapping } from './uscis-field-map';

const GLOBAL_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const STEP_TIMEOUT = 2 * 60 * 1000; // 2 minutes per navigation step
const FIELD_TIMEOUT = 30 * 1000; // 30 seconds per field
const WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes for manual actions
const FIELD_DELAY = 300; // ms between fields for visual effect

/**
 * Run the e-filing demo bot.
 * Opens a headful browser, navigates to USCIS, and attempts to fill form fields.
 * Emits real-time progress events via the SSE emitter.
 */
export async function runEFilingBot(
  config: BotConfig,
  emitter: SSEEmitter
): Promise<void> {
  let browser: Browser | null = null;
  const startTime = Date.now();

  // Global timeout guard
  const globalTimer = setTimeout(() => {
    emitter.emit({
      type: 'error',
      step: 'done',
      code: 'GLOBAL_TIMEOUT',
      message: 'Demo timed out after 10 minutes',
      recoverable: false,
    });
    browser?.close().catch(() => {});
    emitter.close();
  }, GLOBAL_TIMEOUT);

  try {
    // ── Step: prepare ──────────────────────────────────────────
    emitStep(emitter, 'prepare', 'in_progress', 'Preparing form data...');
    const mappings = buildFieldMappings(config.formSchema, config.formData);
    emitStep(emitter, 'prepare', 'completed', `${mappings.length} fields ready to fill`);

    // ── Step: launch_browser ───────────────────────────────────
    emitStep(emitter, 'launch_browser', 'in_progress', 'Launching browser...');
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized'],
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    emitStep(emitter, 'launch_browser', 'completed', 'Browser launched');

    // ── Step: navigate_uscis ───────────────────────────────────
    emitStep(emitter, 'navigate_uscis', 'in_progress', 'Navigating to USCIS...');
    await page.goto('https://myaccount.uscis.gov', {
      waitUntil: 'domcontentloaded',
      timeout: STEP_TIMEOUT,
    });
    await takeScreenshot(page, emitter, 'USCIS login page');
    emitStep(emitter, 'navigate_uscis', 'completed', 'USCIS page loaded');

    // ── Step: login ────────────────────────────────────────────
    await handleLogin(page, emitter, config.credentials);

    // ── Step: captcha_wait ─────────────────────────────────────
    await handleCaptcha(page, emitter);

    // ── Step: navigate_form ────────────────────────────────────
    await handleFormNavigation(page, emitter, config.formCode);

    // ── Step: fill_fields ──────────────────────────────────────
    const stats = await fillFields(page, emitter, mappings);

    // ── Step: review ───────────────────────────────────────────
    emitStep(emitter, 'review', 'in_progress', 'Taking final screenshot...');
    await takeScreenshot(page, emitter, 'Form filled — review before submitting');
    emitStep(
      emitter,
      'review',
      'completed',
      'Form filled. Review the browser window before submitting.'
    );

    // ── Step: done ─────────────────────────────────────────────
    const duration = Math.round((Date.now() - startTime) / 1000);
    emitter.emit({
      type: 'complete',
      fieldsAttempted: stats.attempted,
      fieldsFilled: stats.filled,
      fieldsSkipped: stats.skipped,
      fieldsFailed: stats.failed,
      duration,
    });
    emitStep(emitter, 'done', 'completed', `Demo complete in ${duration}s`);

    // Leave browser open for attorney to review
  } catch (error) {
    emitter.emit({
      type: 'error',
      step: 'done',
      code: 'UNEXPECTED_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      recoverable: false,
    });
    emitStep(emitter, 'done', 'failed', 'Demo ended with an error');
  } finally {
    clearTimeout(globalTimer);
    // Don't close browser — let attorney review
    emitter.close();
  }
}

// ─── Step handlers ───────────────────────────────────────────────

async function handleLogin(
  page: Page,
  emitter: SSEEmitter,
  credentials?: { email: string; password: string }
): Promise<void> {
  emitStep(emitter, 'login', 'in_progress', 'Filling login fields...');

  try {
    // USCIS myaccount uses: #email-address (type=text), #password (type=password)
    const emailField = await findInput(page, [
      '#email-address',
      'input[aria-label="Email Address"]',
      'input[type="email"]',
      'input[name="email"]',
      '#email',
    ]);
    const passwordField = await findInput(page, [
      '#password',
      'input[type="password"]',
      'input[aria-label="Password"]',
    ]);

    if (emailField) {
      const email = credentials?.email || 'attorney@lawfirm.com';
      // Type character by character for visual demo effect
      await emailField.click({ timeout: 5000 });
      await emailField.fill('');
      await page.keyboard.type(email, { delay: 50 });
      emitter.emit({
        type: 'field',
        fieldName: 'Email Address',
        fieldPath: 'login.email',
        status: 'filled',
        value: email,
      });
      await page.waitForTimeout(300);
    }

    if (passwordField) {
      const pass = credentials?.password || 'SecureP@ss2026!';
      await passwordField.click({ timeout: 5000 });
      await passwordField.fill('');
      await page.keyboard.type(pass, { delay: 50 });
      emitter.emit({
        type: 'field',
        fieldName: 'Password',
        fieldPath: 'login.password',
        status: 'filled',
        value: '••••••••',
      });
      await page.waitForTimeout(300);
    }

    await takeScreenshot(page, emitter, 'Login fields filled');

    if (emailField && passwordField) {
      emitStep(emitter, 'login', 'completed', 'Login fields filled');

      // If real credentials were provided, try clicking Sign In
      if (credentials?.email && credentials?.password) {
        const signInBtn = await findInput(page, [
          'button:has-text("Sign In")',
          'button[type="submit"]',
        ]);
        if (signInBtn) {
          await signInBtn.click({ timeout: 5000 });
          await page.waitForTimeout(3000);
          await takeScreenshot(page, emitter, 'After sign-in attempt');
        }
      } else {
        // Demo mode: don't click sign in, just show fields filled
        emitStep(
          emitter,
          'login',
          'waiting',
          'Login fields filled with demo data. Click Sign In in the browser to continue, or the demo will end here.'
        );
        // Wait a bit for the attorney to see, then continue
        await page.waitForTimeout(5000);
      }
    } else {
      emitStep(emitter, 'login', 'failed', 'Could not find login fields on page');
    }
  } catch (error) {
    emitter.emit({
      type: 'error',
      step: 'login',
      code: 'LOGIN_FAILED',
      message: error instanceof Error ? error.message : 'Login step failed',
      recoverable: true,
    });
    emitStep(emitter, 'login', 'failed', 'Login step failed');
  }
}

async function handleCaptcha(page: Page, emitter: SSEEmitter): Promise<void> {
  const captchaSelectors = [
    'iframe[src*="recaptcha"]',
    'iframe[src*="captcha"]',
    '.g-recaptcha',
    '#captcha',
    '[data-captcha]',
    'iframe[title*="reCAPTCHA"]',
  ];

  const hasCaptcha = await page
    .locator(captchaSelectors.join(', '))
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);

  if (hasCaptcha) {
    emitStep(
      emitter,
      'captcha_wait',
      'waiting',
      'CAPTCHA detected. Please solve it in the browser window.'
    );

    // Poll until CAPTCHA is gone or timeout
    const deadline = Date.now() + WAIT_TIMEOUT;
    while (Date.now() < deadline) {
      await page.waitForTimeout(3000);
      const stillVisible = await page
        .locator(captchaSelectors.join(', '))
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      if (!stillVisible) break;
    }

    await takeScreenshot(page, emitter, 'After CAPTCHA');
    emitStep(emitter, 'captcha_wait', 'completed', 'CAPTCHA resolved');
  } else {
    emitStep(emitter, 'captcha_wait', 'skipped', 'No CAPTCHA detected');
  }
}

async function handleFormNavigation(
  page: Page,
  emitter: SSEEmitter,
  formCode: string
): Promise<void> {
  emitStep(emitter, 'navigate_form', 'in_progress', `Looking for ${formCode} filing section...`);

  try {
    // Try to find "File a Form" or similar navigation links
    const navLinks = [
      `a:has-text("File a Form")`,
      `a:has-text("File Online")`,
      `button:has-text("File a Form")`,
      `a:has-text("${formCode}")`,
      `a[href*="file"]`,
      `a[href*="form"]`,
    ];

    for (const selector of navLinks) {
      const el = await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false);
      if (el) {
        await page.locator(selector).first().click({ timeout: 5000 });
        await page.waitForTimeout(2000);
        break;
      }
    }

    await takeScreenshot(page, emitter, `Navigated to form section`);
    emitStep(emitter, 'navigate_form', 'completed', `On form filing page`);
  } catch (error) {
    emitter.emit({
      type: 'error',
      step: 'navigate_form',
      code: 'NAV_FAILED',
      message: `Could not navigate to ${formCode} form. The attorney can navigate manually.`,
      recoverable: true,
    });
    emitStep(
      emitter,
      'navigate_form',
      'waiting',
      `Please navigate to the ${formCode} form in the browser window.`
    );
    await waitForUrlChange(page, WAIT_TIMEOUT);
    emitStep(emitter, 'navigate_form', 'completed', 'On form page');
  }
}

async function fillFields(
  page: Page,
  emitter: SSEEmitter,
  mappings: WebFieldMapping[]
): Promise<{ attempted: number; filled: number; skipped: number; failed: number }> {
  emitStep(emitter, 'fill_fields', 'in_progress', `Filling ${mappings.length} fields...`);

  let filled = 0;
  let skipped = 0;
  let failed = 0;

  for (const mapping of mappings) {
    try {
      const success = await fillSingleField(page, mapping);

      if (success) {
        filled++;
        emitter.emit({
          type: 'field',
          fieldName: mapping.label,
          fieldPath: mapping.fieldPath,
          status: 'filled',
          value: redactSensitive(mapping.value, mapping.fieldPath),
        });
      } else {
        skipped++;
        emitter.emit({
          type: 'field',
          fieldName: mapping.label,
          fieldPath: mapping.fieldPath,
          status: 'skipped',
          reason: 'Element not found on page',
        });
      }
    } catch (error) {
      failed++;
      emitter.emit({
        type: 'field',
        fieldName: mapping.label,
        fieldPath: mapping.fieldPath,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    await page.waitForTimeout(FIELD_DELAY);
  }

  emitStep(
    emitter,
    'fill_fields',
    'completed',
    `Fields: ${filled} filled, ${skipped} skipped, ${failed} failed`
  );

  return { attempted: mappings.length, filled, skipped, failed };
}

async function fillSingleField(
  page: Page,
  mapping: WebFieldMapping
): Promise<boolean> {
  // Strategy 1: Try CSS selectors from the mapping
  if (mapping.selectors) {
    for (const selector of mapping.selectors) {
      try {
        const el = page.locator(selector).first();
        const visible = await el.isVisible({ timeout: 1000 }).catch(() => false);
        if (visible) {
          await fillElement(page, el, mapping);
          return true;
        }
      } catch {
        // Try next selector
      }
    }
  }

  // Strategy 2: Find by label text
  try {
    const labelEl = page.locator(`label:has-text("${mapping.label}")`).first();
    const labelVisible = await labelEl.isVisible({ timeout: 1000 }).catch(() => false);
    if (labelVisible) {
      // Try to find the associated input
      const forAttr = await labelEl.getAttribute('for').catch(() => null);
      if (forAttr) {
        const input = page.locator(`#${CSS.escape(forAttr)}`);
        const inputVisible = await input.isVisible({ timeout: 1000 }).catch(() => false);
        if (inputVisible) {
          await fillElement(page, input, mapping);
          return true;
        }
      }

      // Try input as a sibling/descendant of label
      const nearbyInput = labelEl.locator('~ input, ~ select, ~ textarea, input, select, textarea').first();
      const nearbyVisible = await nearbyInput.isVisible({ timeout: 1000 }).catch(() => false);
      if (nearbyVisible) {
        await fillElement(page, nearbyInput, mapping);
        return true;
      }
    }
  } catch {
    // Label strategy failed
  }

  // Strategy 3: Try partial text matching on placeholders
  try {
    const words = mapping.label.split(/\s+/).slice(0, 2).join(' ');
    const placeholderEl = page.locator(`input[placeholder*="${words}" i], textarea[placeholder*="${words}" i]`).first();
    const placeholderVisible = await placeholderEl.isVisible({ timeout: 1000 }).catch(() => false);
    if (placeholderVisible) {
      await fillElement(page, placeholderEl, mapping);
      return true;
    }
  } catch {
    // Placeholder strategy failed
  }

  return false;
}

async function fillElement(
  page: Page,
  el: ReturnType<Page['locator']>,
  mapping: WebFieldMapping
): Promise<void> {
  const tagName = await el.evaluate((e) => e.tagName.toLowerCase()).catch(() => '');

  switch (mapping.inputType) {
    case 'select':
      if (tagName === 'select') {
        await el.selectOption({ label: mapping.value }, { timeout: FIELD_TIMEOUT });
      } else {
        // May be a custom dropdown — try clicking and selecting
        await el.click({ timeout: 5000 });
        await page.waitForTimeout(300);
        const option = page.locator(`[role="option"]:has-text("${mapping.value}")`).first();
        const optionVisible = await option.isVisible({ timeout: 2000 }).catch(() => false);
        if (optionVisible) {
          await option.click({ timeout: 5000 });
        }
      }
      break;

    case 'checkbox':
      if (mapping.value === 'true') {
        await el.check({ timeout: FIELD_TIMEOUT });
      } else {
        await el.uncheck({ timeout: FIELD_TIMEOUT });
      }
      break;

    case 'radio':
      await el.check({ timeout: FIELD_TIMEOUT });
      break;

    default:
      // text, date, etc.
      await el.fill(mapping.value, { timeout: FIELD_TIMEOUT });
      break;
  }
}

// ─── Utilities ───────────────────────────────────────────────────

function emitStep(
  emitter: SSEEmitter,
  step: EFilingStepId,
  status: import('./types').StepStatus,
  message: string
): void {
  emitter.emit({
    type: 'step',
    step,
    status,
    message,
    timestamp: Date.now(),
  });
}

async function takeScreenshot(
  page: Page,
  emitter: SSEEmitter,
  label: string
): Promise<void> {
  try {
    const buffer = await page.screenshot({ type: 'jpeg', quality: 60 });
    emitter.emit({
      type: 'screenshot',
      base64: buffer.toString('base64'),
      label,
    });
  } catch {
    // Screenshot failed — not critical
  }
}

async function findInput(
  page: Page,
  selectors: string[]
): Promise<ReturnType<Page['locator']> | null> {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      const visible = await el.isVisible({ timeout: 2000 }).catch(() => false);
      if (visible) return el;
    } catch {
      continue;
    }
  }
  return null;
}

async function waitForUrlChange(page: Page, timeout: number): Promise<void> {
  const originalUrl = page.url();
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    await page.waitForTimeout(2000);
    if (page.url() !== originalUrl) return;
  }
}

function redactSensitive(value: string, fieldPath: string): string {
  const lower = fieldPath.toLowerCase();
  if (lower.includes('ssn') || lower.includes('password') || lower.includes('secret')) {
    return '***';
  }
  return value;
}
