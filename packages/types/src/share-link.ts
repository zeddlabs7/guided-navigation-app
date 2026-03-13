import type { Timestamp } from './common';

export type ShareLinkStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';

export interface ShareLink {
  id: string;
  guidanceSetId: string;
  tokenHash: string;
  status: ShareLinkStatus;
  expiresAt: Timestamp;
  expiryDurationMinutes: number;
  revokedAt: Timestamp | null;
  accessCount: number;
  lastAccessedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateShareLinkInput {
  guidanceSetId: string;
  expiryDurationMinutes?: number;
}

export interface ShareLinkValidationResult {
  valid: boolean;
  shareLink?: ShareLink;
  error?: 'EXPIRED' | 'REVOKED' | 'NOT_FOUND' | 'GUIDANCE_DISABLED';
}
