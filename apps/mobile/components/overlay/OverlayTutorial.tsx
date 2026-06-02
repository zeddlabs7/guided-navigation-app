import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

export type OverlayTutorialType = 'arrow' | 'marker';

interface TutorialStep {
  title: string;
  description: string;
  icon: string;
  forTypes: OverlayTutorialType[];
}

const ALL_STEPS: TutorialStep[] = [
  {
    title: 'Drag to Move',
    description: 'Tap and hold the arrow, then drag your finger to move it anywhere on the image.',
    icon: 'drag',
    forTypes: ['arrow', 'marker'],
  },
  {
    title: 'Resize with Handle',
    description: 'See the resize icon on the right side of the arrow? Drag it UP to make the arrow bigger, or DOWN to make it smaller.',
    icon: 'resize',
    forTypes: ['arrow'],
  },
  {
    title: 'Rotate with Handle',
    description:
      'See the rotate icon below the arrow? Drag it LEFT or RIGHT in a circular motion to point the arrow in any direction.',
    icon: 'rotate',
    forTypes: ['arrow'],
  },
  {
    title: 'Drag to Move',
    description:
      'Tap and hold the marker, then drag your finger to move it anywhere on the image.',
    icon: 'drag',
    forTypes: ['marker'],
  },
  {
    title: 'Add Note on the Marker',
    description:
      'Use the "Add Note" button at the bottom to label your marker with helpful text for the courier.',
    icon: 'label',
    forTypes: ['marker'],
  },
];

interface OverlayTutorialProps {
  visible: boolean;
  type?: OverlayTutorialType;
  onComplete: () => void;
  onSkip: () => void;
}

export function OverlayTutorial({
  visible,
  type = 'arrow',
  onComplete,
  onSkip,
}: OverlayTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = ALL_STEPS.filter((step) => step.forTypes.includes(type));
  const totalSteps = steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (visible) setCurrentStep(0);
  }, [visible]);

  useEffect(() => {
    setCurrentStep(0);
  }, [type]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onComplete();
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [isLastStep, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    onSkip();
    setCurrentStep(0);
  }, [onSkip]);

  if (!visible || !currentStepData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleSkip}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          <View style={styles.content}>
            <View
              style={[
                styles.iconCircle,
                currentStepData.icon === 'drag' && styles.iconCircleDrag,
                currentStepData.icon === 'resize' && styles.iconCircleResize,
                currentStepData.icon === 'rotate' && styles.iconCircleRotate,
                currentStepData.icon === 'label' && styles.iconCircleLabel,
              ]}
            >
              <TutorialIcon icon={currentStepData.icon} />
            </View>

            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.description}>
              {currentStepData.description}
            </Text>
          </View>

          <View style={styles.pagination}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            {currentStep > 0 && (
              <Pressable style={styles.btnSecondary} onPress={handleBack}>
                <Text style={styles.btnSecondaryText}>Back</Text>
              </Pressable>
            )}
            <Pressable
              style={[styles.btnPrimary, currentStep === 0 && { flex: 1 }]}
              onPress={handleNext}
            >
              <Text style={styles.btnPrimaryText}>
                {isLastStep ? 'Got it!' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TutorialIcon({ icon }: { icon: string }) {
  const color =
    icon === 'drag'
      ? '#2c3e50'
      : icon === 'resize'
        ? '#16a34a'
        : icon === 'rotate'
          ? '#d97706'
          : '#db2777';

  switch (icon) {
    case 'drag':
      return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path d="M5 9L2 12L5 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 5L12 2L15 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M15 19L12 22L9 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M19 9L22 12L19 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2 12H22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 2V22" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'resize':
      return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path d="M21 21L15 15M21 21V15M21 21H15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M3 3L9 9M3 3V9M3 3H9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'rotate':
      return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path d="M1 4V10H7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Path
            d="M3.51 15C4.15 16.82 5.36 18.38 6.96 19.45C8.56 20.53 10.45 21.06 12.37 20.98C14.29 20.89 16.14 20.19 17.66 18.97C19.17 17.76 20.27 16.09 20.79 14.2C21.32 12.32 21.25 10.32 20.6 8.48C19.95 6.64 18.75 5.06 17.17 3.96C15.59 2.86 13.72 2.29 11.81 2.34C9.89 2.38 8.05 3.03 6.51 4.19L1 9"
            stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      );
    case 'label':
      return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
            stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />
          <Path
            d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
            stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 60,
    elevation: 20,
  },
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#99a1af',
  },
  content: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircleDrag: {
    backgroundColor: '#eff6ff',
  },
  iconCircleResize: {
    backgroundColor: '#dcfce7',
  },
  iconCircleRotate: {
    backgroundColor: '#fef3c7',
  },
  iconCircleLabel: {
    backgroundColor: '#fce7f3',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#6a7282',
    lineHeight: 22.5,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
  },
  dotActive: {
    backgroundColor: '#2c3e50',
    width: 24,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a5565',
  },
});
