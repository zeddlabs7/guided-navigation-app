import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

const SESSIONS_COLLECTION = 'whatsappVerifySessions';
const TOKENS_COLLECTION = 'whatsappVerifyTokens';
const TOKEN_EXPIRY_MINUTES = 3;
const MAX_SESSIONS_PER_HOUR = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const GRAPH_API_VERSION = 'v21.0';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    appSecret: process.env.WHATSAPP_APP_SECRET!,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER!,
  };
}

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

function normalizeToE164(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  return `+${cleaned}`;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(3).toString('hex');
}

function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined,
  appSecret: string,
): boolean {
  if (!signature) return false;
  const expected =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function sendWhatsAppReply(
  to: string,
  text: string,
  accessToken: string,
  phoneNumberId: string,
): Promise<void> {
  const recipientNumber = to.replace('+', '');
  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientNumber,
        type: 'text',
        text: { body: text },
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    functions.logger.error('WhatsApp reply failed', {
      status: res.status,
      body,
    });
  }
}

async function getOrCreateFirebaseUser(
  phoneNumber: string,
): Promise<string> {
  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return userRecord.uid;
  } catch (e: unknown) {
    const authError = e as { code?: string };
    if (authError.code === 'auth/user-not-found') {
      const newUser = await admin.auth().createUser({ phoneNumber });
      return newUser.uid;
    }
    throw e;
  }
}

async function ensureFirestoreUser(
  uid: string,
  phoneNumber: string,
): Promise<void> {
  const userDocRef = db.collection('users').doc(uid);
  const userDoc = await userDocRef.get();
  if (!userDoc.exists) {
    await userDocRef.set({
      phoneNumber,
      email: null,
      languagePreference: 'en',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

// ---------------------------------------------------------------------------
// 1. createVerificationSession (Callable)
// ---------------------------------------------------------------------------

interface CreateSessionData {
  phoneNumber: string;
}

export const createVerificationSession = functions.https.onCall(
  async (data: CreateSessionData) => {
    const { phoneNumber } = data;

    if (!phoneNumber || !isValidE164(phoneNumber)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid E.164 phone number required.',
      );
    }

    const config = getWhatsAppConfig();
    if (!config.businessNumber) {
      throw new functions.https.HttpsError(
        'internal',
        'WhatsApp verification not configured.',
      );
    }

    // Rate-limit: max N sessions per phone per hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentSessions = await db
      .collection(SESSIONS_COLLECTION)
      .where('expectedPhone', '==', phoneNumber)
      .where('createdAtMs', '>', oneHourAgo)
      .get();

    if (recentSessions.size >= MAX_SESSIONS_PER_HOUR) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many verification requests. Please try again later.',
      );
    }

    // Invalidate any existing pending sessions for this phone
    const pendingSessions = await db
      .collection(SESSIONS_COLLECTION)
      .where('expectedPhone', '==', phoneNumber)
      .where('status', '==', 'pending')
      .get();

    const batch = db.batch();
    for (const doc of pendingSessions.docs) {
      batch.update(doc.ref, { status: 'expired' });
      const sessionData = doc.data();
      if (sessionData.tokenHash) {
        batch.update(db.collection(TOKENS_COLLECTION).doc(sessionData.tokenHash), {
          consumed: true,
        });
      }
    }

    // Generate token
    const token = generateToken();
    const tokenHashValue = hashToken(token);
    const now = Date.now();
    const expiresAt = now + TOKEN_EXPIRY_MINUTES * 60 * 1000;

    // Create session document
    const sessionRef = db.collection(SESSIONS_COLLECTION).doc();
    batch.set(sessionRef, {
      tokenHash: tokenHashValue,
      expectedPhone: phoneNumber,
      status: 'pending',
      consumed: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: now,
      verifiedPhone: null,
      verifiedAt: null,
      attemptCount: 0,
      webhookMessageIds: [],
    });

    // Create token lookup document (ID = tokenHash for O(1) lookup)
    batch.set(db.collection(TOKENS_COLLECTION).doc(tokenHashValue), {
      sessionId: sessionRef.id,
      expiresAt,
      consumed: false,
    });

    await batch.commit();

    const whatsappUrl = `https://wa.me/${config.businessNumber}?text=${encodeURIComponent(`VERIFY ${token}`)}`;

    functions.logger.info('Verification session created', {
      sessionId: sessionRef.id,
      phone: phoneNumber,
    });

    return { sessionId: sessionRef.id, whatsappUrl };
  },
);

// ---------------------------------------------------------------------------
// 2. whatsappVerifyWebhook (HTTPS endpoint)
// ---------------------------------------------------------------------------

export const whatsappVerifyWebhook = functions.https.onRequest(
  async (req, res) => {
    // GET: Meta webhook verification challenge
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      const { verifyToken } = getWhatsAppConfig();

      if (mode === 'subscribe' && token === verifyToken) {
        functions.logger.info('Webhook verified');
        res.status(200).send(challenge);
        return;
      }
      res.sendStatus(403);
      return;
    }

    // POST: inbound message
    if (req.method !== 'POST') {
      res.sendStatus(405);
      return;
    }

    const config = getWhatsAppConfig();

    // Validate webhook signature
    const signature = req.headers['x-hub-signature-256'] as string | undefined;
    if (!verifyWebhookSignature(req.rawBody, signature, config.appSecret)) {
      functions.logger.warn('Invalid webhook signature');
      res.sendStatus(401);
      return;
    }

    // Always return 200 immediately to Meta
    res.sendStatus(200);

    try {
      const body = req.body;
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message || message.type !== 'text') return;

      const messageId: string = message.id;
      const senderRaw: string = message.from;
      const text: string = (message.text?.body ?? '').trim();

      // Parse "VERIFY <TOKEN>" — case-insensitive on "VERIFY", exact on token
      const match = text.match(/^VERIFY\s+([a-f0-9]{6})$/i);
      if (!match) {
        await sendWhatsAppReply(
          normalizeToE164(senderRaw),
          'Invalid format. Please use the verification link from the app.',
          config.accessToken,
          config.phoneNumberId,
        );
        return;
      }

      const receivedToken = match[1].toLowerCase();
      const receivedHash = hashToken(receivedToken);
      const senderPhone = normalizeToE164(senderRaw);

      // Look up token
      const tokenDoc = await db
        .collection(TOKENS_COLLECTION)
        .doc(receivedHash)
        .get();

      if (!tokenDoc.exists) {
        await sendWhatsAppReply(
          senderPhone,
          'Verification failed. Please request a new link in the app.',
          config.accessToken,
          config.phoneNumberId,
        );
        return;
      }

      const tokenData = tokenDoc.data()!;
      const sessionId: string = tokenData.sessionId;

      // Run atomic transaction on the session
      const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
      const tokenRef = db.collection(TOKENS_COLLECTION).doc(receivedHash);

      let verified = false;

      await db.runTransaction(async (tx) => {
        const sessionSnap = await tx.get(sessionRef);
        if (!sessionSnap.exists) return;

        const session = sessionSnap.data()!;

        // Deduplicate webhook delivery
        if ((session.webhookMessageIds as string[]).includes(messageId)) {
          verified = session.status === 'verified';
          return;
        }

        // Check session validity
        if (session.status !== 'pending') return;
        if (session.consumed) return;
        if (Date.now() > session.expiresAt) {
          tx.update(sessionRef, { status: 'expired' });
          tx.update(tokenRef, { consumed: true });
          return;
        }
        if (session.attemptCount >= MAX_VERIFY_ATTEMPTS) {
          tx.update(sessionRef, { status: 'expired' });
          tx.update(tokenRef, { consumed: true });
          return;
        }

        // Verify sender phone matches expected phone
        if (session.expectedPhone !== senderPhone) {
          tx.update(sessionRef, {
            attemptCount: admin.firestore.FieldValue.increment(1),
            webhookMessageIds:
              admin.firestore.FieldValue.arrayUnion(messageId),
          });
          return;
        }

        // All checks passed — mark verified
        tx.update(sessionRef, {
          status: 'verified',
          consumed: true,
          verifiedPhone: senderPhone,
          verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
          webhookMessageIds:
            admin.firestore.FieldValue.arrayUnion(messageId),
        });
        tx.update(tokenRef, { consumed: true });
        verified = true;
      });

      if (verified) {
        await sendWhatsAppReply(
          senderPhone,
          'Verified ✅ You can return to the app.',
          config.accessToken,
          config.phoneNumberId,
        );
        functions.logger.info('Verification successful', {
          sessionId,
          phone: senderPhone,
        });
      } else {
        await sendWhatsAppReply(
          senderPhone,
          'Verification failed. Please request a new link in the app.',
          config.accessToken,
          config.phoneNumberId,
        );
      }
    } catch (err) {
      functions.logger.error('Webhook processing error', { error: err });
    }
  },
);

// ---------------------------------------------------------------------------
// 3. getVerificationStatus (Callable)
// ---------------------------------------------------------------------------

interface GetStatusData {
  sessionId: string;
}

export const getVerificationStatus = functions.https.onCall(
  async (data: GetStatusData) => {
    const { sessionId } = data;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Session ID required.',
      );
    }

    const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Session not found.',
      );
    }

    const session = sessionSnap.data()!;

    // Auto-expire if past deadline and still pending
    if (session.status === 'pending' && Date.now() > session.expiresAt) {
      await sessionRef.update({ status: 'expired' });
      return { status: 'expired' };
    }

    if (session.status === 'verified') {
      const phone = session.verifiedPhone as string;

      const uid = await getOrCreateFirebaseUser(phone);
      await ensureFirestoreUser(uid, phone);
      const customToken = await admin.auth().createCustomToken(uid);

      return {
        status: 'verified',
        customToken,
      };
    }

    return { status: session.status };
  },
);

// ---------------------------------------------------------------------------
// 4. retryVerificationSession (Callable)
// ---------------------------------------------------------------------------

interface RetryData {
  sessionId: string;
}

export const retryVerificationSession = functions.https.onCall(
  async (data: RetryData) => {
    const { sessionId } = data;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Session ID required.',
      );
    }

    const sessionRef = db.collection(SESSIONS_COLLECTION).doc(sessionId);
    const sessionSnap = await sessionRef.get();

    if (!sessionSnap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Session not found.',
      );
    }

    const session = sessionSnap.data()!;
    const phoneNumber = session.expectedPhone as string;

    // Invalidate the old session
    if (session.status === 'pending') {
      const batch = db.batch();
      batch.update(sessionRef, { status: 'expired' });
      if (session.tokenHash) {
        batch.update(
          db.collection(TOKENS_COLLECTION).doc(session.tokenHash as string),
          { consumed: true },
        );
      }
      await batch.commit();
    }

    // Delegate to createVerificationSession logic
    // We call the inner logic directly rather than the callable wrapper
    const config = getWhatsAppConfig();
    if (!config.businessNumber) {
      throw new functions.https.HttpsError(
        'internal',
        'WhatsApp verification not configured.',
      );
    }

    // Rate-limit check
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentSessions = await db
      .collection(SESSIONS_COLLECTION)
      .where('expectedPhone', '==', phoneNumber)
      .where('createdAtMs', '>', oneHourAgo)
      .get();

    if (recentSessions.size >= MAX_SESSIONS_PER_HOUR) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many verification requests. Please try again later.',
      );
    }

    const token = generateToken();
    const tokenHashValue = hashToken(token);
    const now = Date.now();
    const expiresAt = now + TOKEN_EXPIRY_MINUTES * 60 * 1000;

    const newSessionRef = db.collection(SESSIONS_COLLECTION).doc();
    const batch = db.batch();

    batch.set(newSessionRef, {
      tokenHash: tokenHashValue,
      expectedPhone: phoneNumber,
      status: 'pending',
      consumed: false,
      expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtMs: now,
      verifiedPhone: null,
      verifiedAt: null,
      attemptCount: 0,
      webhookMessageIds: [],
    });

    batch.set(db.collection(TOKENS_COLLECTION).doc(tokenHashValue), {
      sessionId: newSessionRef.id,
      expiresAt,
      consumed: false,
    });

    await batch.commit();

    const whatsappUrl = `https://wa.me/${config.businessNumber}?text=${encodeURIComponent(`VERIFY ${token}`)}`;

    functions.logger.info('Retry verification session created', {
      oldSessionId: sessionId,
      newSessionId: newSessionRef.id,
      phone: phoneNumber,
    });

    return { sessionId: newSessionRef.id, whatsappUrl };
  },
);
