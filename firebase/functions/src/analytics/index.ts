import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const FUNCTIONS_REGION = 'me-central2';
const db = admin.firestore();

interface LogAnalyticsEventData {
  app: 'RECIPIENT' | 'COURIER';
  eventType: string;
  guidanceSetId?: string;
  guidanceStepId?: string;
  shareLinkId?: string;
  metadata?: Record<string, unknown>;
}

export const logAnalyticsEvent = onCall(
  { region: FUNCTIONS_REGION },
  async (request) => {
    const { app, eventType, guidanceSetId, guidanceStepId, shareLinkId, metadata } =
      request.data as LogAnalyticsEventData;

    const eventRef = await db.collection('analyticsEvents').add({
      app,
      eventType,
      guidanceSetId: guidanceSetId || null,
      guidanceStepId: guidanceStepId || null,
      shareLinkId: shareLinkId || null,
      metadata: metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { eventId: eventRef.id };
  }
);
