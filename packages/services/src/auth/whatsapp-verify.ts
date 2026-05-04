import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseFunctions, getFirebaseAuth } from '../firebase/config';
import type { UserCredential } from 'firebase/auth';

interface CreateSessionResponse {
  sessionId: string;
  whatsappUrl: string;
}

interface VerificationStatusResponse {
  status: 'pending' | 'verified' | 'expired';
  customToken?: string;
}

interface RetryResponse {
  sessionId: string;
  whatsappUrl: string;
}

export async function createVerificationSession(
  phoneNumber: string,
): Promise<CreateSessionResponse> {
  const functions = getFirebaseFunctions();
  const fn = httpsCallable<{ phoneNumber: string }, CreateSessionResponse>(
    functions,
    'createVerificationSession',
  );
  const result = await fn({ phoneNumber });
  return result.data;
}

export async function getVerificationStatus(
  sessionId: string,
): Promise<VerificationStatusResponse> {
  const functions = getFirebaseFunctions();
  const fn = httpsCallable<{ sessionId: string }, VerificationStatusResponse>(
    functions,
    'getVerificationStatus',
  );
  const result = await fn({ sessionId });
  return result.data;
}

export async function completeWhatsAppVerification(
  sessionId: string,
): Promise<UserCredential> {
  const { status, customToken } = await getVerificationStatus(sessionId);

  if (status !== 'verified' || !customToken) {
    throw new Error('Session not verified yet.');
  }

  const auth = getFirebaseAuth();
  return signInWithCustomToken(auth, customToken);
}

export async function retryVerificationSession(
  sessionId: string,
): Promise<RetryResponse> {
  const functions = getFirebaseFunctions();
  const fn = httpsCallable<{ sessionId: string }, RetryResponse>(
    functions,
    'retryVerificationSession',
  );
  const result = await fn({ sessionId });
  return result.data;
}
