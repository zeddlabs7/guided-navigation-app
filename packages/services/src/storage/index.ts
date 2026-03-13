import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebaseStorage } from '../firebase/config';
import type { StepImage, SupportedImageMimeType } from '@guidenav/types';

export async function uploadStepImage(
  guidanceSetId: string,
  stepId: string,
  file: File
): Promise<StepImage> {
  const storage = getFirebaseStorage();
  const extension = file.name.split('.').pop() || 'jpg';
  const storagePath = `guidanceSets/${guidanceSetId}/steps/${stepId}/main.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file);
  const publicUrl = await getDownloadURL(storageRef);

  const dimensions = await getImageDimensions(file);

  return {
    storagePath,
    publicUrl,
    width: dimensions.width,
    height: dimensions.height,
    fileSize: file.size,
    mimeType: file.type as SupportedImageMimeType,
  };
}

export async function deleteStepImage(storagePath: string): Promise<void> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export function getStorageUrl(storagePath: string): Promise<string> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, storagePath);
  return getDownloadURL(storageRef);
}
