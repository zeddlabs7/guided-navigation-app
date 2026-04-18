import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { CreateFeedbackEventInput } from '@guidenav/types';

const FEEDBACK_EVENTS_COLLECTION = 'feedbackEvents';

export async function submitFeedback(input: CreateFeedbackEventInput): Promise<string> {
  const db = getFirebaseFirestore();

  const docRef = await addDoc(collection(db, FEEDBACK_EVENTS_COLLECTION), {
    guidanceSetId: input.guidanceSetId,
    guidanceStepId: input.guidanceStepId ?? null,
    shareLinkId: input.shareLinkId ?? null,
    eventType: input.eventType,
    reasonCode: input.reasonCode ?? null,
    metadata: input.metadata ?? {},
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
