import translate from '@iamtraction/google-translate';

export interface TranslationResult {
  original: string;
  translated: string;
  from: string;
  to: string;
  didCorrect: boolean;
  correctedText?: string;
}

/**
 * Translate text from one language to another
 * @param text - Text to translate
 * @param from - Source language code (e.g., 'en', 'es', 'auto')
 * @param to - Target language code (e.g., 'en', 'es')
 * @returns Translation result
 */
export async function translateText(
  text: string,
  from: string = 'auto',
  to: string = 'en'
): Promise<TranslationResult> {
  const result = await translate(text, { from, to });

  return {
    original: text,
    translated: result.text,
    from: result.from.language.iso,
    to,
    didCorrect: result.from.text.didYouMean,
    correctedText: result.from.text.value || undefined,
  };
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(
  texts: string[],
  from: string = 'auto',
  to: string = 'en'
): Promise<TranslationResult[]> {
  const results = await Promise.all(
    texts.map((text) => translateText(text, from, to))
  );
  return results;
}

/**
 * Detect the language of a text
 */
export async function detectLanguage(text: string): Promise<string> {
  const result = await translate(text, { from: 'auto', to: 'en' });
  return result.from.language.iso;
}

/**
 * Supported language codes
 */
export const LANGUAGE_CODES = {
  en: 'English',
  es: 'Spanish',
  pt: 'Portuguese',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
  ar: 'Arabic',
  hi: 'Hindi',
  ru: 'Russian',
  vi: 'Vietnamese',
  th: 'Thai',
  tl: 'Tagalog',
  auto: 'Auto-detect',
} as const;

export type LanguageCode = keyof typeof LANGUAGE_CODES;

/**
 * Common translation pairs for immigration documents
 */
export const IMMIGRATION_TRANSLATIONS = {
  es_to_en: { from: 'es', to: 'en', label: 'Spanish → English' },
  en_to_es: { from: 'en', to: 'es', label: 'English → Spanish' },
  pt_to_en: { from: 'pt', to: 'en', label: 'Portuguese → English' },
  zh_to_en: { from: 'zh', to: 'en', label: 'Chinese → English' },
  vi_to_en: { from: 'vi', to: 'en', label: 'Vietnamese → English' },
  tl_to_en: { from: 'tl', to: 'en', label: 'Tagalog → English' },
} as const;
