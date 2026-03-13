import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

interface SubmitFeedbackData {
  guidanceSetId: string;
  guidanceStepId?: string;
  shareLinkId?: string;
  eventType: 'CANT_FIND_STEP';
  reasonCode?: string;
  metadata?: Record<string, unknown>;
}

export const submitFeedback = functions.https.onCall(async (data: SubmitFeedbackData) => {
  const { guidanceSetId, guidanceStepId, shareLinkId, eventType, reasonCode, metadata } = data;

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
});
