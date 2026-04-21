import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../firebase/config';
import type { User, GuidanceSet, GuidanceStep, ShareLink, AnalyticsEvent, FeedbackEvent } from '@guidenav/types';

const USERS_COLLECTION = 'users';
const GUIDANCE_SETS_COLLECTION = 'guidanceSets';
const GUIDANCE_STEPS_COLLECTION = 'guidanceSteps';
const SHARE_LINKS_COLLECTION = 'shareLinks';
const ANALYTICS_EVENTS_COLLECTION = 'analyticsEvents';
const FEEDBACK_EVENTS_COLLECTION = 'feedbackEvents';

function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateFromTimestamp(timestamp: unknown): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (typeof timestamp === 'object' && 'toDate' in (timestamp as object)) {
    return (timestamp as { toDate: () => Date }).toDate();
  }
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, USERS_COLLECTION),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
}

export async function getAllGuidanceSets(): Promise<GuidanceSet[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, GUIDANCE_SETS_COLLECTION),
    where('deletedAt', '==', null),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GuidanceSet));
}

export async function getAllGuidanceSteps(): Promise<GuidanceStep[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, GUIDANCE_STEPS_COLLECTION),
    where('deletedAt', '==', null)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as GuidanceStep));
}

export async function getAllShareLinks(): Promise<ShareLink[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, SHARE_LINKS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShareLink));
}

export async function getAllAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, ANALYTICS_EVENTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(1000)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AnalyticsEvent));
}

export async function getAllFeedbackEvents(): Promise<FeedbackEvent[]> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, FEEDBACK_EVENTS_COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(500)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FeedbackEvent));
}

export interface UserStats {
  total: number;
  newThisWeek: number;
  active: number;
  inactive: number;
  languageBreakdown: Record<string, number>;
  growthData: { labels: string[]; data: number[] };
}

export async function getUserStats(): Promise<UserStats> {
  const users = await getAllUsers();
  const weekAgo = getDateDaysAgo(7);
  
  const stats: UserStats = {
    total: users.length,
    newThisWeek: 0,
    active: 0,
    inactive: 0,
    languageBreakdown: { English: 0, Arabic: 0 },
    growthData: { labels: [], data: [] },
  };

  const dailyCounts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = getDateDaysAgo(i);
    const key = date.toISOString().split('T')[0];
    dailyCounts[key] = 0;
  }

  users.forEach((user) => {
    if (user.isActive) {
      stats.active++;
    } else {
      stats.inactive++;
    }

    if (user.languagePreference === 'ar') {
      stats.languageBreakdown['Arabic']++;
    } else {
      stats.languageBreakdown['English']++;
    }

    const createdAt = getDateFromTimestamp(user.createdAt);
    if (createdAt) {
      if (createdAt >= weekAgo) {
        stats.newThisWeek++;
      }
      
      const dateKey = createdAt.toISOString().split('T')[0];
      if (dateKey in dailyCounts) {
        dailyCounts[dateKey]++;
      }
    }
  });

  stats.growthData.labels = Object.keys(dailyCounts).map((key) => {
    const date = new Date(key);
    return formatDateLabel(date);
  });
  stats.growthData.data = Object.values(dailyCounts);

  return stats;
}

export interface GuidanceStats {
  total: number;
  published: number;
  draft: number;
  disabled: number;
  addressTypeBreakdown: Record<string, number>;
  topCreators: { userId: string; phoneNumber: string; count: number }[];
  avgStepsPerGuidance: number;
}

export async function getGuidanceStats(): Promise<GuidanceStats> {
  const [guidanceSets, steps, users] = await Promise.all([
    getAllGuidanceSets(),
    getAllGuidanceSteps(),
    getAllUsers(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  
  const stats: GuidanceStats = {
    total: guidanceSets.length,
    published: 0,
    draft: 0,
    disabled: 0,
    addressTypeBreakdown: {},
    topCreators: [],
    avgStepsPerGuidance: 0,
  };

  const creatorCounts: Record<string, number> = {};
  const stepsPerGuidance: Record<string, number> = {};

  steps.forEach((step) => {
    stepsPerGuidance[step.guidanceSetId] = (stepsPerGuidance[step.guidanceSetId] || 0) + 1;
  });

  guidanceSets.forEach((guidance) => {
    switch (guidance.status) {
      case 'PUBLISHED':
        stats.published++;
        break;
      case 'DRAFT':
        stats.draft++;
        break;
      case 'DISABLED':
        stats.disabled++;
        break;
    }

    if (guidance.addressType) {
      const type = guidance.addressType.charAt(0).toUpperCase() + guidance.addressType.slice(1).toLowerCase();
      stats.addressTypeBreakdown[type] = (stats.addressTypeBreakdown[type] || 0) + 1;
    }

    if (guidance.recipientUserId) {
      creatorCounts[guidance.recipientUserId] = (creatorCounts[guidance.recipientUserId] || 0) + 1;
    }
  });

  stats.topCreators = Object.entries(creatorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, count]) => {
      const user = userMap.get(userId);
      return {
        userId,
        phoneNumber: user?.phoneNumber || 'Unknown',
        count,
      };
    });

  if (guidanceSets.length > 0) {
    const totalSteps = Object.values(stepsPerGuidance).reduce((a, b) => a + b, 0);
    stats.avgStepsPerGuidance = totalSteps / guidanceSets.length;
  }

  return stats;
}

export interface DeliveryStats {
  total: number;
  thisWeek: number;
  completionRate: number;
  trendData: { labels: string[]; data: number[] };
}

export async function getDeliveryStats(): Promise<DeliveryStats> {
  const events = await getAllAnalyticsEvents();
  const weekAgo = getDateDaysAgo(7);

  const deliveryEvents = events.filter((e) => e.eventType === 'DELIVERY_CONFIRMED');
  const openedEvents = events.filter((e) => e.eventType === 'GUIDANCE_OPENED');

  const stats: DeliveryStats = {
    total: deliveryEvents.length,
    thisWeek: 0,
    completionRate: 0,
    trendData: { labels: [], data: [] },
  };

  const dailyCounts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = getDateDaysAgo(i);
    const key = date.toISOString().split('T')[0];
    dailyCounts[key] = 0;
  }

  deliveryEvents.forEach((event) => {
    const createdAt = getDateFromTimestamp(event.createdAt);
    if (createdAt) {
      if (createdAt >= weekAgo) {
        stats.thisWeek++;
      }
      const dateKey = createdAt.toISOString().split('T')[0];
      if (dateKey in dailyCounts) {
        dailyCounts[dateKey]++;
      }
    }
  });

  if (openedEvents.length > 0) {
    stats.completionRate = Math.round((deliveryEvents.length / openedEvents.length) * 100);
  }

  stats.trendData.labels = Object.keys(dailyCounts).map((key) => {
    const date = new Date(key);
    return formatDateLabel(date);
  });
  stats.trendData.data = Object.values(dailyCounts);

  return stats;
}

export interface ShareLinkStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  totalAccesses: number;
  validationErrors: Record<string, number>;
}

export async function getShareLinkStats(): Promise<ShareLinkStats> {
  const shareLinks = await getAllShareLinks();

  const now = new Date();
  
  const stats: ShareLinkStats = {
    total: shareLinks.length,
    active: 0,
    revoked: 0,
    expired: 0,
    totalAccesses: 0,
    validationErrors: {},
  };

  shareLinks.forEach((link) => {
    stats.totalAccesses += link.accessCount || 0;
    
    if (link.status === 'REVOKED') {
      stats.revoked++;
    } else if (link.status === 'ACTIVE') {
      const expiresAt = getDateFromTimestamp(link.expiresAt);
      if (expiresAt && expiresAt < now) {
        stats.expired++;
      } else {
        stats.active++;
      }
    } else if (link.status === 'EXPIRED') {
      stats.expired++;
    }
  });

  return stats;
}

export interface FeedbackStats {
  total: number;
  thisWeek: number;
  byReason: Record<string, number>;
  trendData: { labels: string[]; data: number[] };
}

export async function getFeedbackStats(): Promise<FeedbackStats> {
  const feedbackEvents = await getAllFeedbackEvents();
  const weekAgo = getDateDaysAgo(7);

  const stats: FeedbackStats = {
    total: feedbackEvents.length,
    thisWeek: 0,
    byReason: {},
    trendData: { labels: [], data: [] },
  };

  const dailyCounts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = getDateDaysAgo(i);
    const key = date.toISOString().split('T')[0];
    dailyCounts[key] = 0;
  }

  feedbackEvents.forEach((event) => {
    if (event.reasonCode) {
      stats.byReason[event.reasonCode] = (stats.byReason[event.reasonCode] || 0) + 1;
    }

    const createdAt = getDateFromTimestamp(event.createdAt);
    if (createdAt) {
      if (createdAt >= weekAgo) {
        stats.thisWeek++;
      }
      const dateKey = createdAt.toISOString().split('T')[0];
      if (dateKey in dailyCounts) {
        dailyCounts[dateKey]++;
      }
    }
  });

  stats.trendData.labels = Object.keys(dailyCounts).map((key) => {
    const date = new Date(key);
    return formatDateLabel(date);
  });
  stats.trendData.data = Object.values(dailyCounts);

  return stats;
}

export interface ProblematicGuidance {
  id: string;
  title: string;
  feedbackCount: number;
}

export async function getProblematicGuidance(): Promise<ProblematicGuidance[]> {
  const [feedbackEvents, guidanceSets] = await Promise.all([
    getAllFeedbackEvents(),
    getAllGuidanceSets(),
  ]);

  const guidanceMap = new Map(guidanceSets.map((g) => [g.id, g]));
  const feedbackCounts: Record<string, number> = {};

  feedbackEvents.forEach((event) => {
    if (event.guidanceSetId) {
      feedbackCounts[event.guidanceSetId] = (feedbackCounts[event.guidanceSetId] || 0) + 1;
    }
  });

  return Object.entries(feedbackCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => {
      const guidance = guidanceMap.get(id);
      return {
        id,
        title: guidance?.title || 'Unknown',
        feedbackCount: count,
      };
    });
}
