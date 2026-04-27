import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseFunctions } from '../firebase/config';
import { getFirebaseAuth } from '../firebase/config';
import type { UserCredential } from 'firebase/auth';

interface SendResponse {
  success: boolean;
}

interface VerifyResponse {
  customToken: string;
}

export async function sendWhatsAppOTP(phoneNumber: string): Promise<void> {
  const functions = getFirebaseFunctions();
  const sendFn = httpsCallable<{ phoneNumber: string }, SendResponse>(functions, 'sendWhatsAppOTP');
  await sendFn({ phoneNumber });
}

export async function verifyWhatsAppOTP(
  phoneNumber: string,
  code: string
): Promise<UserCredential> {
  const functions = getFirebaseFunctions();
  const verifyFn = httpsCallable<{ phoneNumber: string; code: string }, VerifyResponse>(
    functions,
    'verifyWhatsAppOTP'
  );
  const result = await verifyFn({ phoneNumber, code });

  const auth = getFirebaseAuth();
  return signInWithCustomToken(auth, result.data.customToken);
}
