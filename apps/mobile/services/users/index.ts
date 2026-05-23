import { getFirebaseFirestore } from '../firebase/config';
import type { User } from '@guidenav/types';

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
