interface TranslateTextsResult {
  translations: Record<string, string>;
}

export async function translateTexts(
  texts: { key: string; text: string }[],
  targetLanguage: string,
): Promise<Record<string, string>> {
  const resp = await fetch('/api/translateTexts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLanguage }),
  });
  const json = (await resp.json()) as TranslateTextsResult;
  return json.translations;
}
