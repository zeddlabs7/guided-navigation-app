import type { GuidanceSet, GuidanceStep, ShareLink } from '@guidenav/types';

const FUNCTIONS_BASE_URL = '/api';

export interface ValidateTokenResult {
  valid: boolean;
  error?: string;
}

export interface LoadGuidanceDataResult {
  valid: boolean;
  error?: string;
  shareLink?: ShareLink;
  guidanceSet?: GuidanceSet;
  steps?: GuidanceStep[];
  recipientPhoneNumber?: string | null;
}

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const resp = await fetch(`${FUNCTIONS_BASE_URL}/validateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return resp.json();
}

export async function loadGuidanceData(token: string): Promise<LoadGuidanceDataResult> {
  const resp = await fetch(`${FUNCTIONS_BASE_URL}/loadGuidanceData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return resp.json();
}

export async function translateTexts(
  texts: { key: string; text: string }[],
  targetLanguage: string,
): Promise<Record<string, string>> {
  const resp = await fetch(`${FUNCTIONS_BASE_URL}/translateTexts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, targetLanguage }),
  });
  const json = (await resp.json()) as { translations: Record<string, string> };
  return json.translations;
}
