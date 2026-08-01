import firestore from '@react-native-firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { User, UpdateUserInput } from '@guidenav/types';

const USERS_COLLECTION = 'users';

export async function getOrCreateUser(
  userId: string,
  phoneNumber: string | null
): Promise<User> {
  const db = getFirebaseFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    return { id: userSnap.id, ...userSnap.data() } as User;
  }

  const now = new Date().toISOString();
  const userData = {
    email: null,
    phoneNumber,
    languagePreference: 'en' as const,
    defaultAvailabilityMode: 'ANYTIME_TODAY' as const,
    defaultAvailabilityStartTime: null,
    defaultAvailabilityEndTime: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await userRef.set(userData);

  return {
    id: userId,
    ...userData,
  };
}

export async function getUser(userId: string): Promise<User | null> {
  const db = getFirebaseFirestore();
  const snap = await db.collection(USERS_COLLECTION).doc(userId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as User;
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
): Promise<void> {
  await firestore()
    .collection(USERS_COLLECTION)
    .doc(userId)
    .update({
      ...input,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}
