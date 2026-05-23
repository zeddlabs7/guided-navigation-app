import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { GuidanceSet, GuidanceStep, GuidanceStatus } from '@guidenav/types';
import { STEP_TYPE_LABELS } from '@guidenav/types';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface GuidanceSetCardProps {
  guidanceSet: GuidanceSet;
  steps: GuidanceStep[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  isDeleting?: boolean;
}

const STATUS_CONFIG: Record<GuidanceStatus, { bg: string; text: string; dot: string; label: string }> = {
  PUBLISHED: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Published' },
  DRAFT: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', label: 'Draft' },
  DISABLED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', label: 'Disabled' },
};

function formatDate(timestamp: unknown): string {
  if (!timestamp) return '';
  let date: Date;
  if (typeof timestamp === 'object' && timestamp !== null && 'toDate' in timestamp) {
    date = (timestamp as { toDate: () => Date }).toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return '';
  }

  const day = date.getDate();
  const month = date.toLocaleString('en', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

const MAX_THUMBNAILS = 3;

export const GuidanceSetCard = memo(function GuidanceSetCard({
  guidanceSet,
  steps,
  onEdit,
  onDelete,
  onShare,
  isDeleting = false,
}: GuidanceSetCardProps) {
  const status = STATUS_CONFIG[guidanceSet.status];
  const stepsWithImages = steps.filter((s) => s.image?.publicUrl);
  const visibleSteps = stepsWithImages.slice(0, MAX_THUMBNAILS);
  const overflowCount = stepsWithImages.length - MAX_THUMBNAILS;

  return (
    <TouchableOpacity
      style={[styles.card, isDeleting && styles.cardDeleting]}
      onPress={() => onEdit(guidanceSet.id)}
      activeOpacity={0.8}
      disabled={isDeleting}
    >
      {/* Thumbnail section */}
      {visibleSteps.length > 0 && (
        <View style={styles.thumbnailSection}>
          <View style={styles.thumbnailRow}>
            {visibleSteps.map((step) => (
              <View key={step.id} style={styles.thumbnailWrapper}>
                <Image
                  source={{ uri: step.image!.publicUrl!, cache: 'force-cache' }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.stepBadge}>
                  <View style={[styles.stepDot, { backgroundColor: status.dot }]} />
                  <Text style={styles.stepBadgeText} numberOfLines={1}>
                    {STEP_TYPE_LABELS[step.stepType]?.en ?? step.stepType}
                  </Text>
                </View>
              </View>
            ))}
            {overflowCount > 0 && (
              <View style={[styles.thumbnailWrapper, styles.overflowThumbnail]}>
                <Text style={styles.overflowText}>+{overflowCount}</Text>
              </View>
            )}
          </View>

          {/* Status badge overlaid on thumbnails */}
          <View style={[styles.statusOverlay, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusLabel, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
        </View>
      )}

      {/* Content section */}
      <View style={styles.content}>
        {/* Title row with status (shown inline if no thumbnails) */}
        {visibleSteps.length === 0 && (
          <View style={styles.inlineStatusRow}>
            <Text style={styles.title} numberOfLines={1}>
              {guidanceSet.title}
            </Text>
            <View style={[styles.statusBadgeInline, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusLabelInline, { color: status.text }]}>
                {status.label}
              </Text>
            </View>
          </View>
        )}

        {visibleSteps.length > 0 && (
          <Text style={styles.title} numberOfLines={1}>
            {guidanceSet.title}
          </Text>
        )}

        {/* Meta info */}
        <View style={styles.meta}>
          <View style={styles.stepCountBadge}>
            <Text style={styles.stepCountText}>
              {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            </Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>
            Modified {formatDate(guidanceSet.updatedAt)}
          </Text>
        </View>

        {guidanceSet.status === 'DISABLED' && (
          <Text style={styles.disabledNotice}>
            Link disabled — not accessible to couriers.
          </Text>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {guidanceSet.status === 'PUBLISHED' && (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => onShare(guidanceSet.id)}
            >
              <Text style={styles.shareIcon}>↗</Text>
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(guidanceSet.id)}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6H5H21"
                stroke={Colors.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M8 6V4C8 3.47 8.21 2.96 8.59 2.59C8.96 2.21 9.47 2 10 2H14C14.53 2 15.04 2.21 15.41 2.59C15.79 2.96 16 3.47 16 4V6M19 6V20C19 20.53 18.79 21.04 18.41 21.41C18.04 21.79 17.53 22 17 22H7C6.47 22 5.96 21.79 5.59 21.41C5.21 21.04 5 20.53 5 20V6H19Z"
                stroke={Colors.textMuted}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onEdit(guidanceSet.id)}
          >
            <Text style={styles.editIcon}>✎</Text>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardDeleting: {
    opacity: 0.4,
    pointerEvents: 'none',
  },
  thumbnailSection: {
    position: 'relative',
  },
  thumbnailRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  thumbnailWrapper: {
    flex: 1,
    height: 110,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  stepBadge: {
    position: 'absolute',
    bottom: 6,
    left: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  stepDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    flex: 1,
  },
  overflowThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  overflowText: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  statusOverlay: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  inlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statusBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusLabelInline: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepCountBadge: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  stepCountText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  metaDot: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  disabledNotice: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  shareIcon: {
    fontSize: 13,
    marginRight: 4,
    color: Colors.text,
  },
  shareText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  deleteButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
    marginRight: 6,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text,
  },
  editIcon: {
    fontSize: 13,
    marginRight: 5,
    color: '#FFFFFF',
  },
  editText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
