import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export interface StepConfig {
  key: string;
  label: string;
  enabled: boolean;
}

interface StepIndicatorProps {
  steps: StepConfig[];
  currentStep: string;
  onStepPress?: (stepKey: string) => void;
}

const COLORS = {
  default: Colors.background,
  defaultText: Colors.textMuted,
  active: Colors.text,
  completed: Colors.success,
  white: '#ffffff',
};

export function StepIndicator({ steps, currentStep, onStepPress }: StepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = step.key === currentStep;
        const isCompleted = index < currentIndex;
        const isClickable = isCompleted && !!onStepPress;

        const content = (
          <View style={styles.stepContent}>
            <View
              style={[
                styles.dot,
                isActive && styles.dotActive,
                isCompleted && styles.dotCompleted,
              ]}
            >
              <Text
                style={[
                  styles.dotText,
                  (isActive || isCompleted) && styles.dotTextWhite,
                ]}
              >
                {index + 1}
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          </View>
        );

        return (
          <View key={step.key} style={styles.stepRow}>
            {index > 0 && (
              <View
                style={[
                  styles.line,
                  index <= currentIndex && styles.lineCompleted,
                ]}
              />
            )}
            {isClickable ? (
              <Pressable onPress={() => onStepPress(step.key)} hitSlop={4}>
                {content}
              </Pressable>
            ) : (
              content
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  line: {
    width: 36,
    height: 2,
    backgroundColor: COLORS.default,
    marginTop: 12,
    marginRight: 8,
  },
  lineCompleted: {
    backgroundColor: COLORS.completed,
  },
  stepContent: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: COLORS.active,
  },
  dotCompleted: {
    backgroundColor: COLORS.completed,
  },
  dotText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: COLORS.defaultText,
  },
  dotTextWhite: {
    color: COLORS.white,
  },
  label: {
    fontSize: 10,
    color: COLORS.defaultText,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  labelActive: {
    color: COLORS.active,
    fontWeight: '600',
  },
});
