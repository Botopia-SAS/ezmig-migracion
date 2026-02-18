import { readFile } from 'node:fs/promises';
import path from 'path';

import { USCIS_FORMS, type USCISFormCode } from './uscis-forms';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  buffer: ArrayBuffer;
  fetchedAt: number;
}

const templateCache = new Map<string, CacheEntry>();

/**
 * Get a USCIS PDF template, using an in-memory cache with 24h TTL.
 *
 * Resolution order:
 *  1. In-memory cache (if not expired)
 *  2. Local pre-processed AcroForm file at public/pdf-templates/{formCode}.pdf
 *  3. Remote download from USCIS (fallback — note: raw USCIS PDFs are XFA and
 *     won't work with pdf-lib, so the local file is the primary source)
 */
export async function getTemplate(formCode: string): Promise<ArrayBuffer> {
  const key = formCode.toUpperCase();

  // 1. Check cache
  const cached = templateCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.buffer;
  }

  // 2. Try local file first (pre-processed AcroForm PDF)
  const localPath = path.join(
    process.cwd(),
    'public',
    'pdf-templates',
    `${formCode.toLowerCase()}.pdf`
  );

  let buffer: ArrayBuffer;

  try {
    console.log(`[PDF Template] Attempting to load local template from: ${localPath}`);
    const fileBuffer = await readFile(localPath);
    buffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );
    console.log(`[PDF Template] Successfully loaded local template: ${formCode} (${buffer.byteLength} bytes)`);
  } catch (localError) {
    console.warn(`[PDF Template] Local file not found at ${localPath}, attempting remote download`);

    // 3. Fall back to USCIS download
    const formEntry = USCIS_FORMS[key as USCISFormCode];
    if (!formEntry) {
      throw new Error(
        `Template not found: no local file at ${localPath} and no USCIS URL configured for "${formCode}"`
      );
    }

    console.log(`[PDF Template] Downloading from USCIS: ${formEntry.url}`);
    const response = await fetch(formEntry.url);
    if (!response.ok) {
      throw new Error(
        `Failed to download template for ${formCode} from ${formEntry.url} (HTTP ${response.status})`
      );
    }

    buffer = await response.arrayBuffer();
    console.log(`[PDF Template] Successfully downloaded from USCIS: ${formCode} (${buffer.byteLength} bytes)`);
  }

  // Validate buffer before caching
  if (!buffer || buffer.byteLength === 0) {
    throw new Error(`Invalid PDF template buffer for ${formCode}: empty or undefined`);
  }

  // Store in cache
  templateCache.set(key, { buffer, fetchedAt: Date.now() });

  return buffer;
}

/**
 * Clear the template cache. Useful for testing.
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}
