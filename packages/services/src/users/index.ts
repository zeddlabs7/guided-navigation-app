import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { User, CreateUserInput, UpdateUserInput } from '@guidenav/types';

const USERS_COLLECTION = 'users';

export async function getUser(userId: string): Promise<User | null> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, USERS_COLLECTION, userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    return null;
  }
  
  return { id: userSnap.id, ...userSnap.data() } as User;
}

export async function createUser(userId: string, data: CreateUserInput): Promise<User> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  const userData = {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  await setDoc(userRef, userData);
  
  return {
    id: userId,
    ...data,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateUser(userId: string, data: UpdateUserInput): Promise<void> {
  const db = getFirebaseFirestore();
  const userRef = doc(db, USERS_COLLECTION, userId);
  
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getOrCreateUser(
  userId: string,
  phoneNumber: string | null
): Promise<User> {
  const existingUser = await getUser(userId);
  
  if (existingUser) {
    return existingUser;
  }
  
  return createUser(userId, {
    email: null,
    phoneNumber,
    languagePreference: 'en',
  });
}
