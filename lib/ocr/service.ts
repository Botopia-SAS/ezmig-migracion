import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
}

/**
 * Extract text from an image using Tesseract.js OCR
 * @param imageSource - URL, file path, or base64 encoded image
 * @param lang - Language(s) to use (e.g., 'eng', 'spa', 'eng+spa')
 * @returns OCR result with extracted text and confidence
 */
export async function extractTextFromImage(
  imageSource: string | Buffer,
  lang = 'eng+spa'
): Promise<OCRResult> {
  const { data } = await Tesseract.recognize(imageSource, lang, {
    logger: (m) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`OCR Progress: ${m.status} - ${Math.round((m.progress || 0) * 100)}%`);
      }
    },
  });

  // Extract words from all blocks/paragraphs/lines
  const words: OCRResult['words'] = [];
  if (data.blocks) {
    for (const block of data.blocks) {
      if (block.paragraphs) {
        for (const paragraph of block.paragraphs) {
          if (paragraph.lines) {
            for (const line of paragraph.lines) {
              if (line.words) {
                for (const word of line.words) {
                  words.push({
                    text: word.text,
                    confidence: word.confidence,
                    bbox: word.bbox,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    text: data.text,
    confidence: data.confidence,
    words,
  };
}

/**
 * Extract text from multiple images
 */
export async function extractTextFromImages(
  images: Array<string | Buffer>,
  lang = 'eng+spa'
): Promise<OCRResult[]> {
  const results = await Promise.all(
    images.map((img) => extractTextFromImage(img, lang))
  );
  return results;
}

/**
 * Supported languages for OCR
 */
export const SUPPORTED_LANGUAGES = {
  eng: 'English',
  spa: 'Spanish',
  por: 'Portuguese',
  fra: 'French',
  deu: 'German',
  ita: 'Italian',
  chi_sim: 'Chinese (Simplified)',
  chi_tra: 'Chinese (Traditional)',
  jpn: 'Japanese',
  kor: 'Korean',
  ara: 'Arabic',
  hin: 'Hindi',
  vie: 'Vietnamese',
  tha: 'Thai',
  rus: 'Russian',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;
