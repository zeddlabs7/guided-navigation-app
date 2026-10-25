import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import type { OnboardingPhase } from '@/hooks/useStepCreationOnboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOOLTIP_MAX_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

interface PhaseConfig {
  titleKey: string;
  descKey: string;
}

const PHASE_CONFIG: Record<string, PhaseConfig> = {
  photo: {
    titleKey: 'onboarding.photoTitle',
    descKey: 'onboarding.photoDesc',
  },
  mark: {
    titleKey: 'onboarding.markTitle',
    descKey: 'onboarding.markDesc',
  },
  instruct: {
    titleKey: 'onboarding.instructTitle',
    descKey: 'onboarding.instructDesc',
  },
  save: {
    titleKey: 'onboarding.saveTitle',
    descKey: 'onboarding.saveDesc',
  },
};

export interface CoachTargetRect {
  /** Y position of the target section relative to the screen (absolute). */
  screenY: number;
  height: number;
}

interface StepCreationCoachMarksProps {
  currentPhase: OnboardingPhase;
  isActive: boolean;
  /** Absolute screen-Y + height of the highlighted section for the current phase. */
  targetRect: CoachTargetRect | null;
  onAdvance: () => void;
  onDismiss: () => void;
}

export function StepCreationCoachMarks({
  currentPhase,
  isActive,
  targetRect,
  onAdvance,
  onDismiss,
}: StepCreationCoachMarksProps) {
  const { t } = useTranslation();
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const config = PHASE_CONFIG[currentPhase];
  const visible = isActive && !!config;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, currentPhase]);

  if (!visible || !config) return null;

  const tooltipTop = targetRect
    ? targetRect.screenY + targetRect.height + 12
    : Dimensions.get('window').height * 0.35;

  const screenH = Dimensions.get('window').height;
  const placeAbove = tooltipTop + 160 > screenH && targetRect;
  const finalTop = placeAbove
    ? Math.max(targetRect!.screenY - 170, Spacing.xxl)
    : tooltipTop;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Tap backdrop to dismiss */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        {/* Tooltip card */}
        <Animated.View
          style={[
            styles.tooltip,
            {
              top: finalTop,
              start: Spacing.xl,
              maxWidth: TOOLTIP_MAX_WIDTH,
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* Phase indicator dots */}
          <View style={styles.phaseDots}>
            {['photo', 'mark', 'instruct', 'save'].map((p) => (
              <View
                key={p}
                style={[
                  styles.phaseDot,
                  p === currentPhase && styles.phaseDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.tooltipTitle}>{t(config.titleKey)}</Text>
          <Text style={styles.tooltipDesc}>{t(config.descKey)}</Text>
          <Pressable style={styles.gotItBtn} onPress={onAdvance}>
            <Text style={styles.gotItText}>{t('onboarding.gotIt')}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  phaseDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  phaseDotActive: {
    backgroundColor: Colors.primary,
    width: 18,
    borderRadius: 3,
  },
  tooltipTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  tooltipDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  gotItBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    marginTop: Spacing.xs,
  },
  gotItText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
});
