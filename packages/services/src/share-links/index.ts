import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { ShareLink, CreateShareLinkInput, ShareLinkValidationResult } from '@guidenav/types';
import { DEFAULT_LINK_EXPIRY_MINUTES } from '@guidenav/types';

const SHARE_LINKS_COLLECTION = 'shareLinks';

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createShareLink(input: CreateShareLinkInput): Promise<{ shareLinkId: string; token: string }> {
  const db = getFirebaseFirestore();
  const token = generateSecureToken();
  const tokenHash = await hashToken(token);
  const expiryMinutes = input.expiryDurationMinutes ?? DEFAULT_LINK_EXPIRY_MINUTES;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const docRef = await addDoc(collection(db, SHARE_LINKS_COLLECTION), {
    guidanceSetId: input.guidanceSetId,
    tokenHash,
    status: 'ACTIVE',
    expiresAt: expiresAt.toISOString(),
    expiryDurationMinutes: expiryMinutes,
    revokedAt: null,
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { shareLinkId: docRef.id, token };
}

export async function validateShareLinkToken(token: string): Promise<ShareLinkValidationResult> {
  const db = getFirebaseFirestore();
  const tokenHash = await hashToken(token);

  const q = query(
    collection(db, SHARE_LINKS_COLLECTION),
    where('tokenHash', '==', tokenHash)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { valid: false, error: 'NOT_FOUND' };
  }

  const shareLink = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as ShareLink;

  if (shareLink.status === 'REVOKED') {
    return { valid: false, error: 'REVOKED', shareLink };
  }

  if (new Date(shareLink.expiresAt) < new Date()) {
    return { valid: false, error: 'EXPIRED', shareLink };
  }

  return { valid: true, shareLink };
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

  return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as ShareLink;
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

export async function incrementAccessCount(shareLinkId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, SHARE_LINKS_COLLECTION, shareLinkId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const currentCount = docSnap.data().accessCount || 0;
    await updateDoc(docRef, {
      accessCount: currentCount + 1,
      lastAccessedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
