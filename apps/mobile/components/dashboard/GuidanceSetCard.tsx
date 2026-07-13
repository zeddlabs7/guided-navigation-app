import React, { memo, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
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

const STATUS_CONFIG: Record<GuidanceStatus, { bg: string; text: string; dot: string; labelKey: string }> = {
  PUBLISHED: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', labelKey: 'card.published' },
  DRAFT: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B', labelKey: 'card.draft' },
  DISABLED: { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444', labelKey: 'card.disabled' },
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

function ThumbnailImage({ uri, recyclingKey }: { uri: string; recyclingKey: string }) {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Image
        source={{ uri }}
        style={styles.thumbnail}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={recyclingKey}
        transition={200}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.thumbnailLoading}>
          <ActivityIndicator size="small" color={Colors.textMuted} />
        </View>
      )}
    </>
  );
}

export const GuidanceSetCard = memo(function GuidanceSetCard({
  guidanceSet,
  steps,
  onEdit,
  onDelete,
  onShare,
  isDeleting = false,
}: GuidanceSetCardProps) {
  const { t } = useTranslation();
  const status = STATUS_CONFIG[guidanceSet.status];
  const stepsWithImages = steps.filter((s) => s.image?.publicUrl);
  const visibleSteps = stepsWithImages.slice(0, MAX_THUMBNAILS);
  const overflowCount = stepsWithImages.length - MAX_THUMBNAILS;

  const isDraft = guidanceSet.status === 'DRAFT';
  const isPublished = guidanceSet.status === 'PUBLISHED';

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const moreButtonRef = useRef<View>(null);

  const openMenu = () => {
    moreButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ top: y + height + 4, right: Spacing.xl + Spacing.lg });
      setMenuVisible(true);
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isDeleting && styles.cardDeleting]}
      onPress={() => onEdit(guidanceSet.id)}
      activeOpacity={0.8}
      disabled={isDeleting}
    >
      {/* Thumbnail section — published cards with images */}
      {visibleSteps.length > 0 && (
        <View style={styles.thumbnailSection}>
          <View style={styles.thumbnailRow}>
            {visibleSteps.map((step) => (
              <View key={step.id} style={styles.thumbnailWrapper}>
                <ThumbnailImage uri={step.image!.publicUrl!} recyclingKey={step.id} />
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

          <View style={[styles.statusOverlay, { backgroundColor: status.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusLabel, { color: status.text }]}>
              {t(status.labelKey)}
            </Text>
          </View>
        </View>
      )}

      {/* Content section */}
      <View style={styles.content}>
        {visibleSteps.length === 0 && (
          <View style={styles.inlineStatusRow}>
            <Text style={styles.title} numberOfLines={1}>
              {guidanceSet.title}
            </Text>
            <View style={[styles.statusBadgeInline, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusLabelInline, { color: status.text }]}>
                {t(status.labelKey)}
              </Text>
            </View>
          </View>
        )}

        {visibleSteps.length > 0 && (
          <Text style={styles.title} numberOfLines={1}>
            {guidanceSet.title}
          </Text>
        )}

        {/* Meta info — draft with 0 steps gets special treatment */}
        <View style={styles.meta}>
          {isDraft && steps.length === 0 ? (
            <Text style={styles.metaTextMuted}>{t('card.setupNotStarted')}</Text>
          ) : (
            <>
              <View style={styles.stepCountBadge}>
                <Text style={styles.stepCountText}>
                  {steps.length} {steps.length === 1 ? t('card.step') : t('card.steps')}
                </Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>
                {t('card.modified', { date: formatDate(guidanceSet.updatedAt) })}
              </Text>
            </>
          )}
        </View>

        {/* Draft empty-state prompt */}
        {isDraft && steps.length === 0 && (
          <Text style={styles.draftPrompt}>{t('card.addFirstGuidanceStep')}</Text>
        )}

        {guidanceSet.status === 'DISABLED' && (
          <Text style={styles.disabledNotice}>
            {t('card.disabledHint')}
          </Text>
        )}

        {/* Action buttons — different layout per status */}
        <View style={styles.actions}>
          {isPublished ? (
            <>
              {/* Primary: Send to courier */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onShare(guidanceSet.id)}
              >
                <Text style={styles.primaryIcon}>↗</Text>
                <Text style={styles.primaryText}>{t('common.sendToCourier')}</Text>
              </TouchableOpacity>

              {/* Secondary: Edit */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => onEdit(guidanceSet.id)}
              >
                <Text style={styles.secondaryIcon}>✎</Text>
                <Text style={styles.secondaryText}>{t('common.edit')}</Text>
              </TouchableOpacity>

              {/* Overflow: ⋮ menu with Delete */}
              <View ref={moreButtonRef} collapsable={false}>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={openMenu}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.moreIcon}>⋮</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Draft / Disabled: primary is Continue setup (or Edit for disabled) */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => onEdit(guidanceSet.id)}
              >
                <Text style={styles.primaryText}>
                  {isDraft ? t('common.continueSetup') : t('common.edit')}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionSpacer} />

              {/* Overflow: ⋮ menu with Delete */}
              <View ref={moreButtonRef} collapsable={false}>
                <TouchableOpacity
                  style={styles.moreButton}
                  onPress={openMenu}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.moreIcon}>⋮</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Overflow menu modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuDropdown, { top: menuPosition.top, right: menuPosition.right }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                onDelete(guidanceSet.id);
              }}
            >
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 6H5H21"
                  stroke={Colors.danger}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M8 6V4C8 3.47 8.21 2.96 8.59 2.59C8.96 2.21 9.47 2 10 2H14C14.53 2 15.04 2.21 15.41 2.59C15.79 2.96 16 3.47 16 4V6M19 6V20C19 20.53 18.79 21.04 18.41 21.41C18.04 21.79 17.53 22 17 22H7C6.47 22 5.96 21.79 5.59 21.41C5.21 21.04 5 20.53 5 20V6H19Z"
                  stroke={Colors.danger}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.menuItemTextDanger}>{t('common.delete')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  thumbnailLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
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
  draftPrompt: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  disabledNotice: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  metaTextMuted: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text,
  },
  primaryIcon: {
    fontSize: 13,
    marginRight: 5,
    color: '#FFFFFF',
  },
  primaryText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: Spacing.sm,
  },
  secondaryIcon: {
    fontSize: 13,
    marginRight: 4,
    color: Colors.text,
  },
  secondaryText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  actionSpacer: {
    flex: 1,
  },
  moreButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  moreIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textMuted,
    lineHeight: 22,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menuDropdown: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemTextDanger: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.danger,
  },
});
