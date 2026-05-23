import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { StepType, Overlay } from '@guidenav/types';
import { STEP_TYPE_LABELS } from '@guidenav/types';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { STEP_TYPE_COLORS } from '@/components/steps';
import { StepThumbnail } from './StepThumbnail';
import Svg, { Path, Circle } from 'react-native-svg';

interface StepCardProps {
  stepNumber: number;
  stepType: StepType;
  instructions: string;
  imageUrl: string | null;
  overlays?: Overlay[];
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function StepCard({
  stepNumber,
  stepType,
  instructions,
  imageUrl,
  overlays = [],
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: StepCardProps) {
  const colors = STEP_TYPE_COLORS[stepType] || STEP_TYPE_COLORS.OTHER;
  const label = STEP_TYPE_LABELS[stepType]?.en || stepType;

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.header}>
        {/* Drag handle (decorative) */}
        <View style={styles.dragHandle}>
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Circle cx={9} cy={6} r={1.5} fill={Colors.textMuted} />
            <Circle cx={15} cy={6} r={1.5} fill={Colors.textMuted} />
            <Circle cx={9} cy={12} r={1.5} fill={Colors.textMuted} />
            <Circle cx={15} cy={12} r={1.5} fill={Colors.textMuted} />
            <Circle cx={9} cy={18} r={1.5} fill={Colors.textMuted} />
            <Circle cx={15} cy={18} r={1.5} fill={Colors.textMuted} />
          </Svg>
        </View>

        {/* Step number */}
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{stepNumber}</Text>
        </View>

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
          <View style={[styles.typeDot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.typeLabel, { color: colors.text }]} numberOfLines={1}>
            {label}
          </Text>
        </View>

        <View style={styles.spacer} />

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, isFirst && styles.actionBtnDisabled]}
            onPress={onMoveUp}
            disabled={isFirst}
            hitSlop={4}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 19V5M12 5L5 12M12 5L19 12"
                stroke={isFirst ? Colors.border : Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <Pressable
            style={[styles.actionBtn, isLast && styles.actionBtnDisabled]}
            onPress={onMoveDown}
            disabled={isLast}
            hitSlop={4}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5V19M12 19L19 12M12 19L5 12"
                stroke={isLast ? Colors.border : Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable style={styles.actionBtn} onPress={onEdit} hitSlop={4}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                stroke={Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                stroke={Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={onDelete} hitSlop={4}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6H5H21"
                stroke={Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
                stroke={Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </View>

      {/* Content row */}
      <View style={styles.content}>
        <StepThumbnail imageUrl={imageUrl} overlays={overlays} size="md" />
        <View style={styles.details}>
          <Text style={styles.instructions} numberOfLines={2}>
            {instructions}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dragHandle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: '#ffffff',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    flexShrink: 1,
    minWidth: 0,
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    lineHeight: 16,
    flexShrink: 1,
  },
  spacer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  actionBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  actionBtnDisabled: {
    opacity: 0.25,
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  content: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingLeft: 52,
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  instructions: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
  },
});
