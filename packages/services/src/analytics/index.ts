import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { CreateAnalyticsEventInput } from '@guidenav/types';

const ANALYTICS_EVENTS_COLLECTION = 'analyticsEvents';

export async function logAnalyticsEvent(input: CreateAnalyticsEventInput): Promise<string> {
  const db = getFirebaseFirestore();

  const docRef = await addDoc(collection(db, ANALYTICS_EVENTS_COLLECTION), {
    ...input,
    metadata: input.metadata ?? {},
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function logGuidanceOpened(
  guidanceSetId: string,
  shareLinkId: string,
  app: 'RECIPIENT' | 'COURIER'
): Promise<void> {
  await logAnalyticsEvent({
    app,
    eventType: 'GUIDANCE_OPENED',
    guidanceSetId,
    shareLinkId,
  });
}

export async function logStepViewed(
  guidanceSetId: string,
  guidanceStepId: string,
  shareLinkId: string | undefined,
  stepIndex: number,
  app: 'RECIPIENT' | 'COURIER'
): Promise<void> {
  await logAnalyticsEvent({
    app,
    eventType: 'STEP_VIEWED',
    guidanceSetId,
    guidanceStepId,
    shareLinkId,
    metadata: { stepIndex },
  });
}

export async function logGuidancePublished(guidanceSetId: string): Promise<void> {
  await logAnalyticsEvent({
    app: 'RECIPIENT',
    eventType: 'GUIDANCE_PUBLISHED',
    guidanceSetId,
  });
}

export async function logLinkGenerated(guidanceSetId: string, shareLinkId: string): Promise<void> {
  await logAnalyticsEvent({
    app: 'RECIPIENT',
    eventType: 'LINK_GENERATED',
    guidanceSetId,
    shareLinkId,
  });
}
