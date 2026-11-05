import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

const FUNCTIONS_REGION = 'me-central2';
const db = admin.firestore();

interface SubmitFeedbackData {
  guidanceSetId: string;
  guidanceStepId?: string;
  shareLinkId?: string;
  eventType: 'CANT_FIND_STEP';
  reasonCode?: string;
  metadata?: Record<string, unknown>;
}

export const submitFeedback = onCall(
  { region: FUNCTIONS_REGION },
  async (request) => {
    const { guidanceSetId, guidanceStepId, shareLinkId, eventType, reasonCode, metadata } =
      request.data as SubmitFeedbackData;

    const feedbackRef = await db.collection('feedbackEvents').add({
      guidanceSetId,
      guidanceStepId: guidanceStepId || null,
      shareLinkId: shareLinkId || null,
      eventType,
      reasonCode: reasonCode || null,
      metadata: metadata || {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { feedbackId: feedbackRef.id };
  }
);
