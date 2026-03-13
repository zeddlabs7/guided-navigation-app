import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface LogAnalyticsEventData {
  app: 'RECIPIENT' | 'COURIER';
  eventType: string;
  guidanceSetId?: string;
  guidanceStepId?: string;
  shareLinkId?: string;
  metadata?: Record<string, unknown>;
}

export const logAnalyticsEvent = functions.https.onCall(
  async (data: LogAnalyticsEventData) => {
    const { app, eventType, guidanceSetId, guidanceStepId, shareLinkId, metadata } = data;

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
