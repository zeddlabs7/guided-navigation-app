import * as functions from 'firebase-functions';

const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();

interface TranslateTextsData {
  texts: { key: string; text: string }[];
  targetLanguage: string;
}

export const translateTexts = functions.https.onCall(
  async (data: TranslateTextsData) => {
    const { texts, targetLanguage } = data;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'texts array is required');
    }

    if (!targetLanguage) {
      throw new functions.https.HttpsError('invalid-argument', 'targetLanguage is required');
    }

    const validLangs = ['ar', 'hi', 'ur', 'bn'];
    if (!validLangs.includes(targetLanguage)) {
      throw new functions.https.HttpsError(
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
      functions.logger.error('Translation failed:', err?.message || err, err?.stack);
      throw new functions.https.HttpsError(
        'internal',
        `Translation service failed: ${err?.message || 'unknown error'}`,
      );
    }
  },
);
