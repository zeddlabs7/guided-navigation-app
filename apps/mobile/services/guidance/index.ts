import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { buildStepPublishedSnapshot } from '@guidenav/core';
import type {
  GuidanceSet,
  GuidanceStep,
  CreateGuidanceSetInput,
  CreateGuidanceStepInput,
  UpdateGuidanceSetInput,
  UpdateGuidanceStepInput,
  StepImage,
  SupportedImageMimeType,
} from '@guidenav/types';

const GUIDANCE_SETS_COLLECTION = 'guidanceSets';
const GUIDANCE_STEPS_COLLECTION = 'guidanceSteps';
const FIRESTORE_IN_LIMIT = 30;

function mapDocToGuidanceSet(doc: { id: string; data: () => Record<string, any> }): GuidanceSet {
  const data = doc.data();
  return {
    id: doc.id,
    recipientUserId: data.recipientUserId,
    title: data.title,
    description: data.description ?? null,
    status: data.status,
    languageOriginal: data.languageOriginal,
    supportedLanguages: data.supportedLanguages ?? [],
    availabilityMode: data.availabilityMode,
    availabilityStartTs: data.availabilityStartTs ?? null,
    availabilityEndTs: data.availabilityEndTs ?? null,
    timezone: data.timezone ?? 'Asia/Riyadh',
    destinationCoordinates: data.destinationCoordinates ?? null,
    currentVersion: data.currentVersion ?? 1,
    publishedAt: data.publishedAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? null,
    addressType: data.addressType,
    buildingNumber: data.buildingNumber,
    floorNumber: data.floorNumber,
    doorNumber: data.doorNumber,
    compoundName: data.compoundName,
    gateNumber: data.gateNumber,
    unitType: data.unitType,
    villaNumber: data.villaNumber,
    apartmentNumber: data.apartmentNumber,
    locationDescription: data.locationDescription,
    recipientPhoneNumber: data.recipientPhoneNumber,
  } as GuidanceSet;
}

function mapDocToGuidanceStep(doc: { id: string; data: () => Record<string, any> }): GuidanceStep {
  const data = doc.data();
  return {
    id: doc.id,
    guidanceSetId: data.guidanceSetId,
    stepIndex: data.stepIndex,
    stepType: data.stepType,
    contentType: data.contentType,
    title: data.title ?? null,
    instructionOriginal: data.instructionOriginal,
    instructionTranslations: data.instructionTranslations ?? {},
    image: data.image ?? null,
    overlays: data.overlays ?? [],
    isRequired: data.isRequired ?? true,
    locationData: data.locationData ?? null,
    publishedSnapshot: 'publishedSnapshot' in data
      ? (data.publishedSnapshot ?? null)
      : undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? null,
  } as GuidanceStep;
}

export function subscribeToGuidanceSets(
  userId: string,
  onData: (sets: GuidanceSet[]) => void,
  onError: (error: Error) => void,
): () => void {
  return firestore()
    .collection(GUIDANCE_SETS_COLLECTION)
    .where('recipientUserId', '==', userId)
    .where('deletedAt', '==', null)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        const sets = snapshot.docs.map(mapDocToGuidanceSet);
        onData(sets);
      },
      (error) => {
        onError(error as Error);
      },
    );
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function getAllStepsForGuidanceSets(
  guidanceSetIds: string[],
): Promise<Map<string, GuidanceStep[]>> {
  const stepsMap = new Map<string, GuidanceStep[]>();

  if (guidanceSetIds.length === 0) return stepsMap;

  const chunks = chunkArray(guidanceSetIds, FIRESTORE_IN_LIMIT);

  const results = await Promise.all(
    chunks.map((chunk) =>
      firestore()
        .collection(GUIDANCE_STEPS_COLLECTION)
        .where('guidanceSetId', 'in', chunk)
        .where('deletedAt', '==', null)
        .orderBy('stepIndex', 'asc')
        .get(),
    ),
  );

  for (const snapshot of results) {
    for (const doc of snapshot.docs) {
      const step = mapDocToGuidanceStep(doc);
      const existing = stepsMap.get(step.guidanceSetId) ?? [];
      existing.push(step);
      stepsMap.set(step.guidanceSetId, existing);
    }
  }

  return stepsMap;
}

export async function deleteGuidanceSet(guidanceSetId: string): Promise<void> {
  await firestore()
    .collection(GUIDANCE_SETS_COLLECTION)
    .doc(guidanceSetId)
    .update({
      deletedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

export async function updateGuidanceSet(
  guidanceSetId: string,
  input: UpdateGuidanceSetInput,
): Promise<void> {
  await firestore()
    .collection(GUIDANCE_SETS_COLLECTION)
    .doc(guidanceSetId)
    .update({
      ...input,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Publishes guidance: writes publishedSnapshot on every non-deleted step, then sets status PUBLISHED.
 */
export async function publishGuidanceWithSteps(guidanceSetId: string): Promise<void> {
  const steps = await getGuidanceSteps(guidanceSetId);

  if (steps.length === 0) {
    throw new Error('Cannot publish guidance without steps');
  }

  const batch = firestore().batch();
  const now = firestore.FieldValue.serverTimestamp();

  for (const step of steps) {
    const stepRef = firestore().collection(GUIDANCE_STEPS_COLLECTION).doc(step.id);
    batch.update(stepRef, {
      publishedSnapshot: buildStepPublishedSnapshot(step),
      updatedAt: now,
    });
  }

  const setRef = firestore().collection(GUIDANCE_SETS_COLLECTION).doc(guidanceSetId);
  batch.update(setRef, {
    status: 'PUBLISHED',
    publishedAt: now,
    updatedAt: now,
  });

  await batch.commit();
}

export async function reorderGuidanceSteps(
  _guidanceSetId: string,
  stepIds: string[],
): Promise<void> {
  const batch = firestore().batch();

  stepIds.forEach((stepId, index) => {
    const docRef = firestore()
      .collection(GUIDANCE_STEPS_COLLECTION)
      .doc(stepId);
    batch.update(docRef, {
      stepIndex: index,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

export async function createGuidanceSet(
  userId: string,
  input: CreateGuidanceSetInput,
): Promise<string> {
  const now = firestore.FieldValue.serverTimestamp();

  const docData: Record<string, any> = {
    recipientUserId: userId,
    title: input.title,
    description: input.description ?? null,
    status: 'DRAFT',
    languageOriginal: input.languageOriginal,
    supportedLanguages: [input.languageOriginal],
    availabilityMode: input.availabilityMode,
    availabilityStartTs: input.availabilityStartTs ?? null,
    availabilityEndTs: input.availabilityEndTs ?? null,
    timezone: 'Asia/Riyadh',
    destinationCoordinates: input.destinationCoordinates ?? null,
    addressType: input.addressType,
    currentVersion: 1,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  if (input.buildingNumber) docData.buildingNumber = input.buildingNumber;
  if (input.floorNumber) docData.floorNumber = input.floorNumber;
  if (input.doorNumber) docData.doorNumber = input.doorNumber;
  if (input.compoundName) docData.compoundName = input.compoundName;
  if (input.gateNumber) docData.gateNumber = input.gateNumber;
  if (input.unitType) docData.unitType = input.unitType;
  if (input.villaNumber) docData.villaNumber = input.villaNumber;
  if (input.apartmentNumber) docData.apartmentNumber = input.apartmentNumber;
  if (input.locationDescription) docData.locationDescription = input.locationDescription;
  if (input.recipientPhoneNumber) docData.recipientPhoneNumber = input.recipientPhoneNumber;

  const docRef = await firestore()
    .collection(GUIDANCE_SETS_COLLECTION)
    .add(docData);

  return docRef.id;
}

export async function getGuidanceSet(guidanceSetId: string): Promise<GuidanceSet | null> {
  const doc = await firestore()
    .collection(GUIDANCE_SETS_COLLECTION)
    .doc(guidanceSetId)
    .get();

  if (!doc.exists) return null;
  return mapDocToGuidanceSet(doc as any);
}

export async function getGuidanceSteps(guidanceSetId: string): Promise<GuidanceStep[]> {
  const snapshot = await firestore()
    .collection(GUIDANCE_STEPS_COLLECTION)
    .where('guidanceSetId', '==', guidanceSetId)
    .where('deletedAt', '==', null)
    .orderBy('stepIndex', 'asc')
    .get();

  return snapshot.docs.map(mapDocToGuidanceStep);
}

export async function createGuidanceStep(
  guidanceSetId: string,
  input: CreateGuidanceStepInput,
  stepIndex: number,
): Promise<string> {
  const now = firestore.FieldValue.serverTimestamp();

  const { instructionTranslations: inputTranslations, ...restInput } = input;
  const docRef = await firestore()
    .collection(GUIDANCE_STEPS_COLLECTION)
    .add({
      ...restInput,
      guidanceSetId,
      stepIndex,
      instructionTranslations: inputTranslations || {},
      image: null,
      overlays: [],
      isRequired: true,
      locationData: input.locationData ?? null,
      publishedSnapshot: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
}

export async function updateGuidanceStep(
  stepId: string,
  input: UpdateGuidanceStepInput,
): Promise<void> {
  await firestore()
    .collection(GUIDANCE_STEPS_COLLECTION)
    .doc(stepId)
    .update({
      ...input,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

export async function deleteGuidanceStep(stepId: string): Promise<void> {
  await firestore()
    .collection(GUIDANCE_STEPS_COLLECTION)
    .doc(stepId)
    .update({
      deletedAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

const MAX_IMAGE_WIDTH = 1280;
const COMPRESS_QUALITY = 0.7;

async function compressImage(localUri: string): Promise<{
  uri: string;
  width: number;
  height: number;
}> {
  const { ImageManipulator, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');

  const pipeline = ImageManipulator.manipulate(localUri)
    .resize({ width: MAX_IMAGE_WIDTH });

  const imageRef = await pipeline.renderAsync();
  const saved = await imageRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: COMPRESS_QUALITY,
  });

  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
  };
}

export async function uploadStepImage(
  guidanceSetId: string,
  stepId: string,
  localUri: string,
): Promise<StepImage> {
  const compressed = await compressImage(localUri);
  const filePath = compressed.uri.replace(/^file:\/\//, '');

  const storagePath = `guidanceSets/${guidanceSetId}/steps/${stepId}/main.jpg`;
  const mimeType: SupportedImageMimeType = 'image/jpeg';

  const ref = storage().ref(storagePath);
  await ref.putFile(filePath, { contentType: 'image/jpeg' });
  const publicUrl = await ref.getDownloadURL();

  return {
    storagePath,
    publicUrl,
    width: compressed.width,
    height: compressed.height,
    fileSize: 0,
    mimeType,
  };
}

export async function deleteStepImage(storagePath: string): Promise<void> {
  try {
    await storage().ref(storagePath).delete();
  } catch (err: any) {
    if (err?.code !== 'storage/object-not-found') {
      throw err;
    }
  }
}
