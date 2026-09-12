import firestore, { type FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';
import type { ShareLink, CreateShareLinkInput } from '@guidenav/types';
import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

const SHARE_LINKS_COLLECTION = 'shareLinks';

const COURIER_APP_URL =
  process.env.EXPO_PUBLIC_COURIER_APP_URL ||
  'https://guided-navigation-app-courier.netlify.app';

const BASE62_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LINK_ID_LENGTH = 16;

function generateLinkId(): string {
  const bytes = Crypto.getRandomBytes(LINK_ID_LENGTH);
  return Array.from(bytes, (b) => BASE62_CHARS[b % BASE62_CHARS.length]).join('');
}

export function buildShareUrl(linkId: string): string {
  return `${COURIER_APP_URL}/g/${linkId}`;
}

export async function createShareLink(
  input: CreateShareLinkInput,
): Promise<{ shareLinkId: string; url: string }> {
  const linkId = generateLinkId();
  const expiryMinutes = input.expiryDurationMinutes ?? DEFAULT_LINK_EXPIRY_MINUTES;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const docRef = firestore()
    .collection(SHARE_LINKS_COLLECTION)
    .doc(linkId);

  await docRef.set({
    guidanceSetId: input.guidanceSetId,
    status: 'ACTIVE',
    expiresAt: expiresAt.toISOString(),
    expiryDurationMinutes: expiryMinutes,
    revokedAt: null,
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  return { shareLinkId: linkId, url: buildShareUrl(linkId) };
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

  const now = new Date();
  const expiredDocs: FirebaseFirestoreTypes.DocumentSnapshot[] = [];
  let activeLink: ShareLink | null = null;

  for (const doc of snapshot.docs) {
    const data = doc.data()!;
    if (data.expiresAt && new Date(data.expiresAt) < now) {
      expiredDocs.push(doc);
    } else if (!activeLink) {
      activeLink = { id: doc.id, ...data } as ShareLink;
    }
  }

  if (expiredDocs.length > 0) {
    const batch = firestore().batch();
    expiredDocs.forEach((doc) => batch.delete(doc.ref));
    batch.commit().catch((err) =>
      console.error('Failed to delete expired share links:', err),
    );
  }

  return activeLink;
}

export async function deleteShareLink(shareLinkId: string): Promise<void> {
  await firestore()
    .collection(SHARE_LINKS_COLLECTION)
    .doc(shareLinkId)
    .delete();
}

export async function deleteAllLinksForGuidance(guidanceSetId: string): Promise<void> {
  const snapshot = await firestore()
    .collection(SHARE_LINKS_COLLECTION)
    .where('guidanceSetId', '==', guidanceSetId)
    .where('status', '==', 'ACTIVE')
    .get();

  if (snapshot.empty) return;

  const batch = firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
