import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';

const { Translate } = require('@google-cloud/translate').v2;
const translate = new Translate();

const FUNCTIONS_REGION = 'me-central1';
const CORS_ORIGINS = [
  'https://guided-navigation-app-courier.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3001',
];

interface TranslateTextsData {
  texts: { key: string; text: string }[];
  targetLanguage: string;
}

export const translateTexts = onRequest(
  { region: FUNCTIONS_REGION, concurrency: 80, memory: '256MiB', cors: CORS_ORIGINS },
  async (req, res) => {
    const { texts, targetLanguage } = req.body as TranslateTextsData;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      res.status(400).json({ error: 'TEXTS_REQUIRED' });
      return;
    }

    if (!targetLanguage) {
      res.status(400).json({ error: 'TARGET_LANGUAGE_REQUIRED' });
      return;
    }

    const validLangs = ['ar', 'hi', 'ur', 'bn'];
    if (!validLangs.includes(targetLanguage)) {
      res.status(400).json({
        error: 'INVALID_TARGET_LANGUAGE',
        message: `targetLanguage must be one of: ${validLangs.join(', ')}`,
      });
      return;
    }

    const nonEmpty = texts.filter((t) => t.text && t.text.trim());
    if (nonEmpty.length === 0) {
      const result: Record<string, string> = {};
      for (const t of texts) {
        result[t.key] = t.text;
      }
      res.json({ translations: result });
      return;
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

      res.json({ translations: result });
    } catch (err: any) {
      logger.error('Translation failed:', err?.message || err, err?.stack);
      res.status(500).json({
        error: 'TRANSLATION_FAILED',
        message: err?.message || 'unknown error',
      });
    }
  },
);
