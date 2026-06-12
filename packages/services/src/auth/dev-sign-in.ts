import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseFunctions, getFirebaseAuth } from '../firebase/config';
import type { UserCredential } from 'firebase/auth';

interface DevSignInResponse {
  customToken: string;
}

export async function devSignIn(uid: string): Promise<UserCredential> {
  const functions = getFirebaseFunctions();
  const fn = httpsCallable<{ uid: string }, DevSignInResponse>(functions, 'devSignIn');
  const result = await fn({ uid });
  const auth = getFirebaseAuth();
  return signInWithCustomToken(auth, result.data.customToken);
}
