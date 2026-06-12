import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const DEV_BYPASS_UID = 'YCAilJHBfpeqoSrInaYJeqQVmwp1';

export const devSignIn = functions.https.onCall(async (data: { uid: string }) => {
  const { uid } = data;

  if (uid !== DEV_BYPASS_UID) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Dev sign-in is only allowed for the designated test account.',
    );
  }

  try {
    await admin.auth().getUser(uid);
  } catch (e: unknown) {
    const authError = e as { code?: string };
    if (authError.code === 'auth/user-not-found') {
      throw new functions.https.HttpsError('not-found', 'User not found in Firebase Auth.');
    }
    throw new functions.https.HttpsError('internal', 'Failed to look up user.');
  }

  const customToken = await admin.auth().createCustomToken(uid);

  functions.logger.info('Dev bypass sign-in token issued', { uid });

  return { customToken };
});
