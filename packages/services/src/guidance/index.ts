import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type {
  GuidanceSet,
  GuidanceStep,
  CreateGuidanceSetInput,
  UpdateGuidanceSetInput,
  CreateGuidanceStepInput,
  UpdateGuidanceStepInput,
} from '@guidenav/types';

const GUIDANCE_SETS_COLLECTION = 'guidanceSets';
const GUIDANCE_STEPS_COLLECTION = 'guidanceSteps';

export async function createGuidanceSet(
  userId: string,
  input: CreateGuidanceSetInput
): Promise<string> {
  const db = getFirebaseFirestore();
  const docRef = await addDoc(collection(db, GUIDANCE_SETS_COLLECTION), {
    ...input,
    recipientUserId: userId,
    status: 'DRAFT',
    supportedLanguages: [input.languageOriginal],
    timezone: 'Asia/Riyadh',
    currentVersion: 1,
    publishedAt: null,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getGuidanceSet(guidanceSetId: string): Promise<GuidanceSet | null> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, GUIDANCE_SETS_COLLECTION, guidanceSetId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as GuidanceSet;
}

export async function getUserGuidanceSets(userId: string): Promise<GuidanceSet[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, GUIDANCE_SETS_COLLECTION),
    where('recipientUserId', '==', userId),
    where('deletedAt', '==', null),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GuidanceSet));
}

export async function updateGuidanceSet(
  guidanceSetId: string,
  input: UpdateGuidanceSetInput
): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, GUIDANCE_SETS_COLLECTION, guidanceSetId);
  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function publishGuidanceSet(guidanceSetId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, GUIDANCE_SETS_COLLECTION, guidanceSetId);
  await updateDoc(docRef, {
    status: 'PUBLISHED',
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGuidanceSet(guidanceSetId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, GUIDANCE_SETS_COLLECTION, guidanceSetId);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getGuidanceSteps(guidanceSetId: string): Promise<GuidanceStep[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, GUIDANCE_STEPS_COLLECTION),
    where('guidanceSetId', '==', guidanceSetId),
    where('deletedAt', '==', null),
    orderBy('stepIndex', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GuidanceStep));
}

export async function createGuidanceStep(
  guidanceSetId: string,
  input: CreateGuidanceStepInput,
  stepIndex?: number
): Promise<string> {
  const db = getFirebaseFirestore();

  let finalStepIndex = stepIndex;
  if (finalStepIndex === undefined) {
    const existingSteps = await getGuidanceSteps(guidanceSetId);
    finalStepIndex = existingSteps.length;
  }

  const docRef = await addDoc(collection(db, GUIDANCE_STEPS_COLLECTION), {
    ...input,
    guidanceSetId,
    stepIndex: finalStepIndex,
    instructionTranslations: {},
    image: null,
    overlays: [],
    isRequired: true,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateGuidanceStep(
  stepId: string,
  input: UpdateGuidanceStepInput
): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, GUIDANCE_STEPS_COLLECTION, stepId);
  await updateDoc(docRef, {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGuidanceStep(stepId: string): Promise<void> {
  const db = getFirebaseFirestore();
  const docRef = doc(db, GUIDANCE_STEPS_COLLECTION, stepId);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function reorderGuidanceSteps(
  guidanceSetId: string,
  stepIds: string[]
): Promise<void> {
  const db = getFirebaseFirestore();
  const batch = writeBatch(db);

  stepIds.forEach((stepId, index) => {
    const docRef = doc(db, GUIDANCE_STEPS_COLLECTION, stepId);
    batch.update(docRef, {
      stepIndex: index,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
}
