import firestore from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';
import type { ShareLink, CreateShareLinkInput } from '@guidenav/types';
import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

const SHARE_LINKS_COLLECTION = 'shareLinks';

const COURIER_APP_URL =
  process.env.EXPO_PUBLIC_COURIER_APP_URL ||
  'https://guided-navigation-app-courier.netlify.app';

function generateSecureToken(): string {
  const bytes = Crypto.getRandomBytes(32);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    token,
  );
}

export function buildShareUrl(token: string): string {
  return `${COURIER_APP_URL}/g/${token}`;
}

export async function createShareLink(
  input: CreateShareLinkInput,
): Promise<{ shareLinkId: string; token: string; url: string }> {
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const expiryMinutes = input.expiryDurationMinutes ?? DEFAULT_LINK_EXPIRY_MINUTES;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const docRef = firestore()
    .collection(SHARE_LINKS_COLLECTION)
    .doc(tokenHash);

  await docRef.set({
    guidanceSetId: input.guidanceSetId,
    tokenHash,
    status: 'ACTIVE',
    expiresAt: expiresAt.toISOString(),
    expiryDurationMinutes: expiryMinutes,
    revokedAt: null,
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  return { shareLinkId: tokenHash, token, url: buildShareUrl(token) };
}

export async function getShareLinkForGuidance(
  guidanceSetId: string,
): Promise<ShareLink | null> {
  const snapshot = await firestore()
    .collection(SHARE_LINKS_COLLECTION)
    .where('guidanceSetId', '==', guidanceSetId)
    .where('status', '==', 'ACTIVE')
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as ShareLink;
}

export async function revokeShareLink(shareLinkId: string): Promise<void> {
  await firestore()
    .collection(SHARE_LINKS_COLLECTION)
    .doc(shareLinkId)
    .update({
      status: 'REVOKED',
      revokedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}
