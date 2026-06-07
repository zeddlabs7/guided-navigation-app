import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../firebase/config';

interface TranslateTextsInput {
  texts: { key: string; text: string }[];
  targetLanguage: string;
}

interface TranslateTextsResult {
  translations: Record<string, string>;
}

export async function translateTexts(
  texts: { key: string; text: string }[],
  targetLanguage: string,
): Promise<Record<string, string>> {
  const functions = getFirebaseFunctions();
  const fn = httpsCallable<TranslateTextsInput, TranslateTextsResult>(
    functions,
    'translateTexts',
  );
  const result = await fn({ texts, targetLanguage });
  return result.data.translations;
}
