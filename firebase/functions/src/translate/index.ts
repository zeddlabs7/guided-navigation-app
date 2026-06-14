import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();

interface TranslateTextsData {
  texts: { key: string; text: string }[];
  targetLanguage: string;
}

export const translateTexts = onCall(
  { region: 'me-central1', concurrency: 80, memory: '256MiB' },
  async (request) => {
    const { texts, targetLanguage } = request.data as TranslateTextsData;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new HttpsError('invalid-argument', 'texts array is required');
    }

    if (!targetLanguage) {
      throw new HttpsError('invalid-argument', 'targetLanguage is required');
    }

    const validLangs = ['ar', 'hi', 'ur', 'bn'];
    if (!validLangs.includes(targetLanguage)) {
      throw new HttpsError(
        'invalid-argument',
        `targetLanguage must be one of: ${validLangs.join(', ')}`,
      );
    }

    const nonEmpty = texts.filter((t) => t.text && t.text.trim());
    if (nonEmpty.length === 0) {
      const result: Record<string, string> = {};
      for (const t of texts) {
        result[t.key] = t.text;
      }
      return { translations: result };
    }

    try {
      const stringsToTranslate = nonEmpty.map((t) => t.text);

      const [translatedArray] = await translate.translate(stringsToTranslate, targetLanguage);

      const translated: string[] = Array.isArray(translatedArray)
        ? translatedArray
        : [translatedArray];

      const result: Record<string, string> = {};
      for (const t of texts) {
        result[t.key] = t.text;
      }
      for (let i = 0; i < nonEmpty.length; i++) {
        result[nonEmpty[i].key] = translated[i] || nonEmpty[i].text;
      }

      return { translations: result };
    } catch (err: any) {
      logger.error('Translation failed:', err?.message || err, err?.stack);
      throw new HttpsError(
        'internal',
        `Translation service failed: ${err?.message || 'unknown error'}`,
      );
    }
  },
);
