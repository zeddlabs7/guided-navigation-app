import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

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
