import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import functions from '@react-native-firebase/functions';

export type FirebaseUser = FirebaseAuthTypes.User;
export type ConfirmationResult = FirebaseAuthTypes.ConfirmationResult;

let confirmation: ConfirmationResult | null = null;

/**
 * Sends an SMS verification code to the given phone number.
 * Native Firebase SDK handles everything — no reCAPTCHA needed.
 */
export async function sendVerificationCode(phoneNumber: string): Promise<void> {
  // Strip any invisible/RTL/LTR Unicode characters and whitespace
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  confirmation = await auth().signInWithPhoneNumber(cleaned);
}

/**
 * Confirms the SMS code and signs the user in.
 */
export async function confirmCode(code: string): Promise<void> {
  if (!confirmation) {
    throw new Error('No verification in progress. Request a new code.');
  }
  await confirmation.confirm(code);
  confirmation = null;
}

export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return auth().onAuthStateChanged(callback);
}

export async function signOut(): Promise<void> {
  return auth().signOut();
}

export function getCurrentUser(): FirebaseUser | null {
  return auth().currentUser;
}

const DEV_BYPASS_UID = 'YCAilJHBfpeqoSrInaYJeqQVmwp1';

/**
 * Dev-only: calls the devSignIn Cloud Function to get a custom token
 * and signs in as the designated test user (same as web app).
 */
export async function devSignIn(): Promise<void> {
  const fn = functions().httpsCallable('devSignIn');
  const result = await fn({ uid: DEV_BYPASS_UID });
  const { customToken } = result.data as { customToken: string };
  await auth().signInWithCustomToken(customToken);
}
