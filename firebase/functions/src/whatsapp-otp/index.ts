import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();

const WHATSAPP_OTP_COLLECTION = 'whatsappOtpCodes';
const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 3;
const GRAPH_API_VERSION = 'v21.0';

function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME,
  };
}

function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

interface SendData {
  phoneNumber: string;
}

export const sendWhatsAppOTP = functions.https.onCall(async (data: SendData) => {
    const { phoneNumber } = data;

    if (!phoneNumber || !isValidE164(phoneNumber)) {
      throw new functions.https.HttpsError('invalid-argument', 'Valid E.164 phone number required');
    }

    const docId = hashPhone(phoneNumber);
    const docRef = db.collection(WHATSAPP_OTP_COLLECTION).doc(docId);
    const existing = await docRef.get();

    if (existing.exists) {
      const docData = existing.data()!;
      const sends: number[] = docData.sendTimestamps ?? [];
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const recentSends = sends.filter((t: number) => t > oneHourAgo);

      if (recentSends.length >= MAX_SENDS_PER_HOUR) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many OTP requests. Please try again later.'
        );
      }
    }

    const code = generateOTP();
    const now = Date.now();
    const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;

    const existingSends: number[] = existing.exists
      ? (existing.data()!.sendTimestamps ?? []).filter((t: number) => t > now - 60 * 60 * 1000)
      : [];

    await docRef.set({
      codeHash: hashCode(code),
      phoneNumber,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      attempts: 0,
      sendTimestamps: [...existingSends, now],
    });

    const { accessToken, phoneNumberId, templateName } = getWhatsAppConfig();

    if (!accessToken || !phoneNumberId || !templateName) {
      functions.logger.error('WhatsApp secrets not configured');
      throw new functions.https.HttpsError('internal', 'WhatsApp service not configured');
    }

    const recipientNumber = phoneNumber.replace('+', '');

    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipientNumber,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', parameter_name: 'code', text: code },
                  { type: 'text', parameter_name: 'text', text: 'Arriveo' },
                ],
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      functions.logger.error('WhatsApp API error', { status: response.status, body: errorBody });
      throw new functions.https.HttpsError('internal', 'Failed to send WhatsApp message');
    }

    functions.logger.info('WhatsApp OTP sent', { phoneNumber, messageStatus: response.status });

    return { success: true };
  });

interface VerifyData {
  phoneNumber: string;
  code: string;
}

export const verifyWhatsAppOTP = functions.https.onCall(async (data: VerifyData) => {
  const { phoneNumber, code } = data;

  if (!phoneNumber || !isValidE164(phoneNumber)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid E.164 phone number required');
  }

  if (!code || !/^\d{6}$/.test(code)) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid 6-digit code required');
  }

  const docId = hashPhone(phoneNumber);
  const docRef = db.collection(WHATSAPP_OTP_COLLECTION).doc(docId);
  const otpDoc = await docRef.get();

  if (!otpDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'No OTP request found. Please request a new code.');
  }

  const otpData = otpDoc.data()!;

  if (Date.now() > otpData.expiresAt) {
    await docRef.delete();
    throw new functions.https.HttpsError('deadline-exceeded', 'Code has expired. Please request a new one.');
  }

  if (otpData.attempts >= MAX_VERIFY_ATTEMPTS) {
    await docRef.delete();
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many failed attempts. Please request a new code.'
    );
  }

  if (hashCode(code) !== otpData.codeHash) {
    await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
    throw new functions.https.HttpsError('permission-denied', 'Invalid code. Please try again.');
  }

  await docRef.delete();

  let uid: string;
  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    uid = userRecord.uid;
  } catch (e: unknown) {
    const authError = e as { code?: string };
    if (authError.code === 'auth/user-not-found') {
      const newUser = await admin.auth().createUser({ phoneNumber });
      uid = newUser.uid;
    } else {
      throw new functions.https.HttpsError('internal', 'Failed to look up user');
    }
  }

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

  const customToken = await admin.auth().createCustomToken(uid);

  functions.logger.info('WhatsApp OTP verified, custom token issued', { phoneNumber, uid });

  return { customToken };
});
