import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { ADDRESS_TYPE_LABELS, getMetadataFieldConfigs } from '@guidenav/types';
import type { AddressType } from '@guidenav/types';

const ADDRESS_TYPE_ICONS: Record<AddressType, string> = {
  APARTMENT_BUILDING: '🏢',
  VILLA: '🏠',
  RESIDENTIAL_COMPOUND: '🏘️',
  OFFICE_BUILDING: '🏛️',
  OTHER: '📍',
};

interface StepsOverviewStepProps {
  title: string;
  addressType: AddressType;
  metadata: Record<string, string>;
  saving: boolean;
  onAddFirstStep: () => void;
}

export function StepsOverviewStep({
  title,
  addressType,
  metadata,
  saving,
  onAddFirstStep,
}: StepsOverviewStepProps) {
  const typeLabel = ADDRESS_TYPE_LABELS[addressType]?.en ?? addressType;
  const fieldConfigs = getMetadataFieldConfigs(addressType);

  const visibleMetadata = fieldConfigs
    .filter((fc) => {
      if (!fc.dependsOn) return true;
      return metadata[fc.dependsOn.field] === fc.dependsOn.value;
    })
    .filter((fc) => metadata[fc.field]?.trim());

  const metadataSummary = visibleMetadata
    .map((fc) => `${fc.label.en}: ${metadata[fc.field]}`)
    .join(', ');

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Address summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>{ADDRESS_TYPE_ICONS[addressType]}</Text>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryType}>{typeLabel}</Text>
              {metadataSummary ? (
                <Text style={styles.summaryMeta} numberOfLines={2}>
                  {metadataSummary}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Steps header */}
        <View style={styles.stepsHeader}>
          <Text style={styles.stepsTitle}>Steps</Text>
          <View style={styles.stepsBadge}>
            <Text style={styles.stepsBadgeText}>0</Text>
          </View>
        </View>

        {/* Empty state */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛡️</Text>
          <Text style={styles.emptyTitle}>
            Add step-by-step guidance for couriers
          </Text>
          <Text style={styles.emptySubtitle}>
            Help delivery couriers complete deliveries by adding:
          </Text>
          <View style={styles.examplesList}>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleIcon}>🖼️</Text>
              <Text style={styles.exampleText}>
                Photos with arrows pointing to entrances
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleIcon}>📋</Text>
              <Text style={styles.exampleText}>
                Instructions for parking or access codes
              </Text>
            </View>
            <View style={styles.exampleRow}>
              <Text style={styles.exampleIcon}>📍</Text>
              <Text style={styles.exampleText}>
                Markers highlighting key landmarks
              </Text>
            </View>
          </View>
        </View>

        {/* Add First Step button */}
        <Pressable
          style={[styles.addStepButton, saving && styles.addStepButtonDisabled]}
          onPress={onAddFirstStep}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textSecondary} size="small" />
          ) : (
            <Text style={styles.addStepButtonText}>+ Add First Step</Text>
          )}
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
    paddingBottom: Spacing.xxxl,
  },
  summaryCard: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryIcon: {
    fontSize: 26,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryType: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryMeta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  stepsTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  stepsBadge: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepsBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  examplesList: {
    gap: Spacing.md,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.lg,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  exampleIcon: {
    fontSize: 18,
  },
  exampleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  addStepButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  addStepButtonDisabled: {
    opacity: 0.5,
  },
  addStepButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
