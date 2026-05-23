import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { ADDRESS_TYPE_LABELS } from '@guidenav/types';
import type { AddressType } from '@guidenav/types';

const ADDRESS_TYPE_ICONS: Record<AddressType, string> = {
  APARTMENT_BUILDING: '🏢',
  VILLA: '🏠',
  RESIDENTIAL_COMPOUND: '🏘️',
  OFFICE_BUILDING: '🏛️',
  OTHER: '📍',
};

const addressTypes = Object.entries(ADDRESS_TYPE_LABELS) as [
  AddressType,
  { en: string; ar: string },
][];

interface AddressTypeStepProps {
  selectedType: AddressType | null;
  onTypeSelect: (type: AddressType) => void;
  onContinue: () => void;
}

export function AddressTypeStep({
  selectedType,
  onTypeSelect,
  onContinue,
}: AddressTypeStepProps) {
  const handleContinue = useCallback(() => {
    if (selectedType) {
      onContinue();
    }
  }, [selectedType, onContinue]);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Address Type</Text>
        <Text style={styles.sectionSubtitle}>What type of address is this?</Text>

        <View style={styles.grid}>
          {addressTypes.map(([type, labels]) => {
            const isSelected = selectedType === type;
            return (
              <Pressable
                key={type}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => onTypeSelect(type)}
              >
                <Text style={styles.cardIcon}>
                  {ADDRESS_TYPE_ICONS[type]}
                </Text>
                <Text
                  style={[
                    styles.cardLabel,
                    isSelected && styles.cardLabelSelected,
                  ]}
                >
                  {labels.en}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.continueButton,
            !selectedType && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedType}
        >
          <Text
            style={[
              styles.continueButtonText,
              !selectedType && styles.continueButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  grid: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  cardSelected: {
    borderColor: Colors.text,
    backgroundColor: Colors.background,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  cardLabelSelected: {
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingVertical: 13,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: Colors.border,
  },
  continueButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
