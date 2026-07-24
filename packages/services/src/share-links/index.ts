import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { ShareLink, CreateShareLinkInput, ShareLinkValidationResult, GuidanceSet, GuidanceStep } from '@guidenav/types';
import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

const SHARE_LINKS_COLLECTION = 'shareLinks';

const BASE62_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LINK_ID_LENGTH = 16;

function generateLinkId(): string {
  const array = new Uint8Array(LINK_ID_LENGTH);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => BASE62_CHARS[b % BASE62_CHARS.length]).join('');
}

export async function createShareLink(input: CreateShareLinkInput): Promise<{ shareLinkId: string; token: string }> {
  const db = getFirebaseFirestore();
  const linkId = generateLinkId();
  const expiryMinutes = input.expiryDurationMinutes ?? DEFAULT_LINK_EXPIRY_MINUTES;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const docRef = doc(db, SHARE_LINKS_COLLECTION, linkId);
  await setDoc(docRef, {
    guidanceSetId: input.guidanceSetId,
    status: 'ACTIVE',
    expiresAt: expiresAt.toISOString(),
    expiryDurationMinutes: expiryMinutes,
    revokedAt: null,
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { shareLinkId: linkId, token: linkId };
}

export async function getShareLinkForGuidance(guidanceSetId: string): Promise<ShareLink | null> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, SHARE_LINKS_COLLECTION),
    where('guidanceSetId', '==', guidanceSetId),
    where('status', '==', 'ACTIVE')
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const docSnap = querySnapshot.docs[0];
  const data = docSnap.data();

  if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
    return null;
  }

  return { id: docSnap.id, ...data } as ShareLink;
}

export async function revokeShareLink(shareLinkId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, SHARE_LINKS_COLLECTION, shareLinkId);
  await updateDoc(docRef, {
    status: 'REVOKED',
    revokedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function revokeAllLinksForGuidance(guidanceSetId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, SHARE_LINKS_COLLECTION),
    where('guidanceSetId', '==', guidanceSetId),
    where('status', '==', 'ACTIVE')
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return;

  const batch = writeBatch(db);
  const now = serverTimestamp();
  querySnapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, {
      status: 'REVOKED',
      revokedAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
}

export async function incrementAccessCount(shareLinkId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, SHARE_LINKS_COLLECTION, shareLinkId);
  await updateDoc(docRef, {
    accessCount: increment(1),
    lastAccessedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

const FUNCTIONS_BASE_URL = '/api';

export interface ValidateTokenResult {
  valid: boolean;
  error?: string;
}

export async function validateToken(token: string): Promise<ValidateTokenResult> {
  const resp = await fetch(`${FUNCTIONS_BASE_URL}/validateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return resp.json();
}

export interface LoadGuidanceDataResult {
  valid: boolean;
  error?: string;
  shareLink?: ShareLink;
  guidanceSet?: GuidanceSet;
  steps?: GuidanceStep[];
  recipientPhoneNumber?: string | null;
}

export async function loadGuidanceData(token: string): Promise<LoadGuidanceDataResult> {
  const resp = await fetch(`${FUNCTIONS_BASE_URL}/loadGuidanceData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return resp.json();
}
