import type { Timestamp } from './common';

export type FeedbackEventType = 'CANT_FIND_STEP';

export type FeedbackReasonCode =
  | 'WRONG_PHOTO'
  | 'UNCLEAR_DIRECTION'
  | 'MISSING_STEP'
  | 'LOCATION_CONFUSING'
  | 'OTHER';

export interface FeedbackEvent {
  id: string;
  guidanceSetId: string;
  guidanceStepId: string | null;
  shareLinkId: string | null;
  eventType: FeedbackEventType;
  reasonCode: FeedbackReasonCode | null;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface CreateFeedbackEventInput {
  guidanceSetId: string;
  guidanceStepId?: string;
  shareLinkId?: string;
  eventType: FeedbackEventType;
  reasonCode?: FeedbackReasonCode;
  metadata?: Record<string, unknown>;
}
