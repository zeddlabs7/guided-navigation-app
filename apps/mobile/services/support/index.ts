import firestore from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

const SUPPORT_REQUESTS_COLLECTION = 'supportRequests';
const STORAGE_BUCKET = 'guided-navigation-app.firebasestorage.app';
const MAX_IMAGE_WIDTH = 800;
const COMPRESS_QUALITY = 0.5;

export interface SupportRequestInput {
  userId: string;
  phoneNumber: string | null;
  email: string;
  description: string;
  imageUrls: string[];
}

export interface SupportRequestResult {
  requestId: string;
}

async function compressImage(localUri: string): Promise<{ uri: string }> {
  const { ImageManipulator, SaveFormat } = require('expo-image-manipulator') as typeof import('expo-image-manipulator');

  const pipeline = ImageManipulator.manipulate(localUri)
    .resize({ width: MAX_IMAGE_WIDTH });

  const imageRef = await pipeline.renderAsync();
  const saved = await imageRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: COMPRESS_QUALITY,
  });

  return { uri: saved.uri };
}

async function getAuthToken(): Promise<string> {
  const auth = require('@react-native-firebase/auth') as typeof import('@react-native-firebase/auth');
  const idToken = await auth.default().currentUser?.getIdToken();
  if (!idToken) throw new Error('Not authenticated');
  return idToken;
}

/** Generate a unique request ID upfront so uploads can start before submission. */
export function generateRequestId(): string {
  return firestore().collection(SUPPORT_REQUESTS_COLLECTION).doc().id;
}

/** Upload a single attachment eagerly. Returns the public download URL. */
export async function uploadSupportAttachment(
  requestId: string,
  index: number,
  localUri: string,
): Promise<string> {
  const compressed = await compressImage(localUri);

  const storagePath = `supportRequests/${requestId}/attachments/${index}.jpg`;
  const encodedPath = encodeURIComponent(storagePath);
  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}`;

  const localResponse = await fetch(compressed.uri);
  const fileBlob = await localResponse.blob();

  const idToken = await getAuthToken();

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'image/jpeg',
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: fileBlob,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Upload failed: ${response.status} — ${errText}`);
  }

  const metadata = await response.json();
  const downloadToken = metadata.downloadTokens;
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}

/** Submit the support request document. Images should already be uploaded. */
export async function submitSupportRequest(
  requestId: string,
  input: SupportRequestInput,
): Promise<SupportRequestResult> {
  const docRef = firestore().collection(SUPPORT_REQUESTS_COLLECTION).doc(requestId);

  await docRef.set({
    userId: input.userId,
    phoneNumber: input.phoneNumber,
    email: input.email.trim().toLowerCase(),
    description: input.description.trim(),
    imageUrls: input.imageUrls,
    status: 'open',
    platform: Platform.OS,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  return { requestId };
}
