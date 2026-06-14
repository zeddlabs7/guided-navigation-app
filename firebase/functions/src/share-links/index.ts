import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const FUNCTIONS_REGION = 'me-central1';

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

// --- v2 courier-facing functions (same region as Firestore) ---

export const validateToken = onCall(
  { region: FUNCTIONS_REGION, concurrency: 80, memory: '256MiB' },
  async (request) => {
    const t0 = Date.now();
    const { token } = request.data as { token: string };

    if (!token) {
      throw new HttpsError('invalid-argument', 'Token is required');
    }

    const tokenHash = hashToken(token);
    const tHash = Date.now();

    const shareLinkSnap = await db.collection('shareLinks').doc(tokenHash).get();
    const tFirestore = Date.now();

    logger.info('validateToken timing', {
      hashMs: tHash - t0,
      firestoreMs: tFirestore - tHash,
      totalMs: tFirestore - t0,
    });

    if (!shareLinkSnap.exists) {
      return { valid: false, error: 'NOT_FOUND' };
    }

    const shareLink = shareLinkSnap.data()!;

    if (shareLink.status === 'REVOKED') {
      return { valid: false, error: 'REVOKED' };
    }

    if (new Date(shareLink.expiresAt) < new Date()) {
      return { valid: false, error: 'EXPIRED' };
    }

    return { valid: true };
  },
);

export const loadGuidanceData = onCall(
  { region: FUNCTIONS_REGION, concurrency: 80, memory: '256MiB' },
  async (request) => {
    const t0 = Date.now();
    const { token } = request.data as { token: string };

    if (!token) {
      throw new HttpsError('invalid-argument', 'Token is required');
    }

    const tokenHash = hashToken(token);

    const shareLinkSnap = await db.collection('shareLinks').doc(tokenHash).get();
    const tShareLink = Date.now();

    if (!shareLinkSnap.exists) {
      return { valid: false, error: 'NOT_FOUND' };
    }

    const shareLinkData = shareLinkSnap.data()!;

    if (shareLinkData.status === 'REVOKED') {
      return { valid: false, error: 'REVOKED' };
    }

    if (new Date(shareLinkData.expiresAt) < new Date()) {
      return { valid: false, error: 'EXPIRED' };
    }

    const shareLink = { id: shareLinkSnap.id, ...shareLinkData };
    const guidanceSetId = shareLinkData.guidanceSetId;

    const [guidanceSetSnap, stepsSnapshot] = await Promise.all([
      db.collection('guidanceSets').doc(guidanceSetId).get(),
      db.collection('guidanceSteps')
        .where('guidanceSetId', '==', guidanceSetId)
        .where('deletedAt', '==', null)
        .orderBy('stepIndex', 'asc')
        .get(),
      shareLinkSnap.ref.update({
        accessCount: admin.firestore.FieldValue.increment(1),
        lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    ]);
    const tData = Date.now();

    if (!guidanceSetSnap.exists) {
      return { valid: false, error: 'NOT_FOUND' };
    }

    const guidanceSetData = guidanceSetSnap.data() as admin.firestore.DocumentData;
    const guidanceSet = { id: guidanceSetSnap.id, ...guidanceSetData };

    if (guidanceSetData.status === 'DISABLED') {
      return { valid: false, error: 'GUIDANCE_DISABLED' };
    }

    const rawSteps = stepsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const courierSteps = rawSteps
      .filter((step) => isStepVisibleToCourier(step))
      .map((step) => applyPublishedSnapshotForCourier(step));

    if (courierSteps.length === 0) {
      return { valid: false, error: 'NO_STEPS' };
    }

    let recipientPhoneNumber: string | null = null;
    try {
      const recipientUserId = guidanceSetData.recipientUserId as string;
      if (recipientUserId) {
        const userSnap = await db.collection('users').doc(recipientUserId).get();
        if (userSnap.exists) {
          recipientPhoneNumber = userSnap.data()?.phoneNumber ?? null;
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch recipient phone:', err);
    }
    const tEnd = Date.now();

    logger.info('loadGuidanceData timing', {
      shareLinkMs: tShareLink - t0,
      dataMs: tData - tShareLink,
      phoneMs: tEnd - tData,
      totalMs: tEnd - t0,
    });

    return {
      valid: true,
      shareLink,
      guidanceSet,
      steps: courierSteps,
      recipientPhoneNumber,
    };
  },
);

// --- v1 functions (recipient-app, not on courier critical path) ---

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

    await db.collection('shareLinks').doc(tokenHash).set({
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
      shareLinkId: tokenHash,
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

  const shareLinkSnap = await db.collection('shareLinks').doc(tokenHash).get();

  if (!shareLinkSnap.exists) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const shareLink = shareLinkSnap.data()!;

  if (shareLink.status === 'REVOKED') {
    return { valid: false, error: 'REVOKED' };
  }

  if (new Date(shareLink.expiresAt) < new Date()) {
    return { valid: false, error: 'EXPIRED' };
  }

  await shareLinkSnap.ref.update({
    accessCount: admin.firestore.FieldValue.increment(1),
    lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    valid: true,
    shareLinkId: shareLinkSnap.id,
    guidanceSetId: shareLink.guidanceSetId,
  };
});

export const loadGuidanceByToken = functions.https.onCall(async (data: { token: string }) => {
  const { token } = data;

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'Token is required');
  }

  const tokenHash = hashToken(token);

  const shareLinkSnap = await db.collection('shareLinks').doc(tokenHash).get();

  if (!shareLinkSnap.exists) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const shareLinkData = shareLinkSnap.data()!;

  if (shareLinkData.status === 'REVOKED') {
    return { valid: false, error: 'REVOKED' };
  }

  if (new Date(shareLinkData.expiresAt) < new Date()) {
    return { valid: false, error: 'EXPIRED' };
  }

  const shareLink = { id: shareLinkSnap.id, ...shareLinkData };
  const guidanceSetId = shareLinkData.guidanceSetId;

  const [guidanceSetSnap, stepsSnapshot] = await Promise.all([
    db.collection('guidanceSets').doc(guidanceSetId).get(),
    db.collection('guidanceSteps')
      .where('guidanceSetId', '==', guidanceSetId)
      .where('deletedAt', '==', null)
      .orderBy('stepIndex', 'asc')
      .get(),
    shareLinkSnap.ref.update({
      accessCount: admin.firestore.FieldValue.increment(1),
      lastAccessedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }),
  ]);

  if (!guidanceSetSnap.exists) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const guidanceSetData = guidanceSetSnap.data() as admin.firestore.DocumentData;
  const guidanceSet = { id: guidanceSetSnap.id, ...guidanceSetData };

  if (guidanceSetData.status === 'DISABLED') {
    return { valid: false, error: 'GUIDANCE_DISABLED' };
  }

  const rawSteps = stepsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const courierSteps = rawSteps
    .filter((step) => isStepVisibleToCourier(step))
    .map((step) => applyPublishedSnapshotForCourier(step));

  if (courierSteps.length === 0) {
    return { valid: false, error: 'NO_STEPS' };
  }

  let recipientPhoneNumber: string | null = null;
  try {
    const recipientUserId = guidanceSetData.recipientUserId as string;
    if (recipientUserId) {
      const userSnap = await db.collection('users').doc(recipientUserId).get();
      if (userSnap.exists) {
        recipientPhoneNumber = userSnap.data()?.phoneNumber ?? null;
      }
    }
  } catch (err) {
    functions.logger.warn('Failed to fetch recipient phone:', err);
  }

  return {
    valid: true,
    shareLink,
    guidanceSet,
    steps: courierSteps,
    recipientPhoneNumber,
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

type StepDoc = { id: string; publishedSnapshot?: unknown; [key: string]: unknown };

/** Legacy steps (no field) use live data; explicit null = hidden until republish */
function isStepVisibleToCourier(step: StepDoc): boolean {
  if (!('publishedSnapshot' in step)) {
    return true;
  }
  return step.publishedSnapshot != null;
}

function applyPublishedSnapshotForCourier(step: StepDoc): StepDoc {
  const snapshot = step.publishedSnapshot;
  if (!snapshot || typeof snapshot !== 'object') {
    const { publishedSnapshot: _omit, ...rest } = step;
    return rest;
  }

  const {
    publishedSnapshot: _omit,
    stepType: _st,
    contentType: _ct,
    title: _t,
    instructionOriginal: _io,
    instructionTranslations: _it,
    image: _img,
    overlays: _ov,
    isRequired: _ir,
    locationData: _ld,
    ...meta
  } = step;

  return {
    ...meta,
    ...(snapshot as Record<string, unknown>),
  };
}
