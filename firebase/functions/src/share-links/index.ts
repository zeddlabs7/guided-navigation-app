import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

interface CreateShareLinkData {
  guidanceSetId: string;
  expiryDurationMinutes?: number;
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const createShareLink = functions.https.onCall(
  async (data: CreateShareLinkData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { guidanceSetId, expiryDurationMinutes = 1440 } = data;

    const guidanceSetRef = db.collection('guidanceSets').doc(guidanceSetId);
    const guidanceSet = await guidanceSetRef.get();

    if (!guidanceSet.exists) {
      throw new functions.https.HttpsError('not-found', 'Guidance set not found');
    }

    if (guidanceSet.data()?.recipientUserId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryDurationMinutes * 60 * 1000);

    const shareLinkRef = await db.collection('shareLinks').add({
      guidanceSetId,
      tokenHash,
      status: 'ACTIVE',
      expiresAt: expiresAt.toISOString(),
      expiryDurationMinutes,
      revokedAt: null,
      accessCount: 0,
      lastAccessedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      shareLinkId: shareLinkRef.id,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }
);

export const validateShareLink = functions.https.onCall(async (data: { token: string }) => {
  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token is required');
  }

  const tokenHash = hashToken(token);

  const shareLinksQuery = await db
    .collection('shareLinks')
    .where('tokenHash', '==', tokenHash)
    .limit(1)
    .get();

  if (shareLinksQuery.empty) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const shareLinkDoc = shareLinksQuery.docs[0];
  const shareLink = shareLinkDoc.data();

  if (shareLink.status === 'REVOKED') {
    return { valid: false, error: 'REVOKED' };
  }

  if (new Date(shareLink.expiresAt) < new Date()) {
    return { valid: false, error: 'EXPIRED' };
  }

  await shareLinkDoc.ref.update({
    accessCount: admin.firestore.FieldValue.increment(1),
    lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    valid: true,
    shareLinkId: shareLinkDoc.id,
    guidanceSetId: shareLink.guidanceSetId,
  };
});

export const revokeShareLink = functions.https.onCall(
  async (data: { shareLinkId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { shareLinkId } = data;

    const shareLinkRef = db.collection('shareLinks').doc(shareLinkId);
    const shareLink = await shareLinkRef.get();

    if (!shareLink.exists) {
      throw new functions.https.HttpsError('not-found', 'Share link not found');
    }

    const guidanceSetRef = db.collection('guidanceSets').doc(shareLink.data()?.guidanceSetId);
    const guidanceSet = await guidanceSetRef.get();

    if (guidanceSet.data()?.recipientUserId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized');
    }

    await shareLinkRef.update({
      status: 'REVOKED',
      revokedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);
