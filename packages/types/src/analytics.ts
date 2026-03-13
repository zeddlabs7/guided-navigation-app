import type { Timestamp } from './common';

export type AppType = 'RECIPIENT' | 'COURIER';

export type AnalyticsEventType =
  | 'GUIDANCE_OPENED'
  | 'STEP_VIEWED'
  | 'STEP_COMPLETED'
  | 'LINK_GENERATED'
  | 'LINK_REVOKED'
  | 'GUIDANCE_PUBLISHED'
  | 'GUIDANCE_CREATED'
  | 'FEEDBACK_SUBMITTED';

export interface AnalyticsEvent {
  id: string;
  app: AppType;
  eventType: AnalyticsEventType;
  guidanceSetId: string | null;
  guidanceStepId: string | null;
  shareLinkId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface CreateAnalyticsEventInput {
  app: AppType;
  eventType: AnalyticsEventType;
  guidanceSetId?: string;
  guidanceStepId?: string;
  shareLinkId?: string;
  metadata?: Record<string, unknown>;
}
