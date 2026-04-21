import {
  getAllUsers as fetchAllUsers,
  getAllGuidanceSets as fetchAllGuidanceSets,
  getAllGuidanceSteps as fetchAllGuidanceSteps,
  getAllShareLinks as fetchAllShareLinks,
  getAllFeedbackEvents as fetchAllFeedbackEvents,
  getUserStats as fetchUserStats,
  getGuidanceStats as fetchGuidanceStats,
  getDeliveryStats as fetchDeliveryStats,
  getShareLinkStats as fetchShareLinkStats,
  getFeedbackStats as fetchFeedbackStats,
  getProblematicGuidance as fetchProblematicGuidance,
} from '@guidenav/services';
import type { User, GuidanceSet, ShareLink, FeedbackEvent } from '@guidenav/types';

export async function getUserStats() {
  return fetchUserStats();
}

export async function getAllUsers(): Promise<(User & { guidanceCount?: number })[]> {
  const [users, guidanceSets] = await Promise.all([
    fetchAllUsers(),
    fetchAllGuidanceSets(),
  ]);

  const guidanceCountByUser: Record<string, number> = {};
  guidanceSets.forEach((g) => {
    if (g.recipientUserId) {
      guidanceCountByUser[g.recipientUserId] = (guidanceCountByUser[g.recipientUserId] || 0) + 1;
    }
  });

  return users.map((user) => ({
    ...user,
    guidanceCount: guidanceCountByUser[user.id] || 0,
  }));
}

export async function getGuidanceStats() {
  return fetchGuidanceStats();
}

export async function getAllGuidanceSets(): Promise<(GuidanceSet & { stepCount?: number; userName?: string })[]> {
  const [guidanceSets, steps, users] = await Promise.all([
    fetchAllGuidanceSets(),
    fetchAllGuidanceSteps(),
    fetchAllUsers(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  
  const stepCountByGuidance: Record<string, number> = {};
  steps.forEach((s) => {
    stepCountByGuidance[s.guidanceSetId] = (stepCountByGuidance[s.guidanceSetId] || 0) + 1;
  });

  return guidanceSets.map((guidance) => {
    const user = userMap.get(guidance.recipientUserId);
    return {
      ...guidance,
      stepCount: stepCountByGuidance[guidance.id] || 0,
      userName: user?.phoneNumber || undefined,
    };
  });
}

export async function getDeliveryStats() {
  return fetchDeliveryStats();
}

export async function getShareLinkStats() {
  return fetchShareLinkStats();
}

export async function getAllShareLinks(): Promise<(ShareLink & { guidanceTitle?: string })[]> {
  const [shareLinks, guidanceSets] = await Promise.all([
    fetchAllShareLinks(),
    fetchAllGuidanceSets(),
  ]);

  const guidanceMap = new Map(guidanceSets.map((g) => [g.id, g]));

  return shareLinks.map((link) => {
    const guidance = guidanceMap.get(link.guidanceSetId);
    return {
      ...link,
      guidanceTitle: guidance?.title || undefined,
    };
  });
}

export async function getFeedbackStats() {
  return fetchFeedbackStats();
}

export async function getAllFeedback(): Promise<(FeedbackEvent & { guidanceTitle?: string; stepType?: string })[]> {
  const [feedbackEvents, guidanceSets, steps] = await Promise.all([
    fetchAllFeedbackEvents(),
    fetchAllGuidanceSets(),
    fetchAllGuidanceSteps(),
  ]);

  const guidanceMap = new Map(guidanceSets.map((g) => [g.id, g]));
  const stepMap = new Map(steps.map((s) => [s.id, s]));

  return feedbackEvents.map((feedback) => {
    const guidance = guidanceMap.get(feedback.guidanceSetId);
    const step = feedback.guidanceStepId ? stepMap.get(feedback.guidanceStepId) : null;
    return {
      ...feedback,
      guidanceTitle: guidance?.title || undefined,
      stepType: step?.stepType || undefined,
    };
  });
}

export async function getProblematicGuidance() {
  return fetchProblematicGuidance();
}
