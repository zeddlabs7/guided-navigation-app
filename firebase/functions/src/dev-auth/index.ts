import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const FUNCTIONS_REGION = 'me-central2';
const DEV_BYPASS_UID = 'YCAilJHBfpeqoSrInaYJeqQVmwp1';

export const devSignIn = onCall(
  { region: FUNCTIONS_REGION },
  async (request) => {
    const { uid } = request.data as { uid: string };

    if (uid !== DEV_BYPASS_UID) {
      throw new HttpsError(
        'permission-denied',
        'Dev sign-in is only allowed for the designated test account.',
      );
    }

    try {
      await admin.auth().getUser(uid);
    } catch (e: unknown) {
      const authError = e as { code?: string };
      if (authError.code === 'auth/user-not-found') {
        throw new HttpsError('not-found', 'User not found in Firebase Auth.');
      }
      throw new HttpsError('internal', 'Failed to look up user.');
    }

    const customToken = await admin.auth().createCustomToken(uid);

    return { customToken };
  }
);
