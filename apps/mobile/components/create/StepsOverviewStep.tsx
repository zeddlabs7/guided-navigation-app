import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { ADDRESS_TYPE_LABELS, getMetadataFieldConfigs, getStepTypesForAddressType, STEP_TYPE_LABELS } from '@guidenav/types';
import type { AddressType, LocationData } from '@guidenav/types';
import { STEP_TYPE_COLORS } from '@/components/steps/StepTypeDropdown';
import { ScreenFooter, useFooterScrollPadding } from '@/components/ui/ScreenFooter';
import { useLanguage } from '@/contexts/LanguageContext';

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
  locationData: LocationData;
  saving: boolean;
  onPublish: () => void;
  onAddGuidanceSteps: () => void;
}

export function StepsOverviewStep({
  title,
  addressType,
  metadata,
  locationData,
  saving,
  onPublish,
  onAddGuidanceSteps,
}: StepsOverviewStepProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();

  const typeLabel = (ADDRESS_TYPE_LABELS[addressType] as any)?.[language] ?? ADDRESS_TYPE_LABELS[addressType]?.en ?? addressType;
  const fieldConfigs = getMetadataFieldConfigs(addressType);
  const footerScrollPadding = useFooterScrollPadding(120);

  const visibleMetadata = fieldConfigs
    .filter((fc) => {
      if (!fc.dependsOn) return true;
      return metadata[fc.dependsOn.field] === fc.dependsOn.value;
    })
    .filter((fc) => metadata[fc.field]?.trim());

  const suggestedSteps = getStepTypesForAddressType(addressType);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: footerScrollPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card with integrated status */}
        <View style={styles.card}>
          {/* Green status strip */}
          <View style={styles.statusStrip}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} fill="#16a34a" />
              <Path
                d="M8 12.5l2.5 2.5 5.5-5.5"
                stroke="#ffffff"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.statusText}>{t('create.readyToPublish')}</Text>
          </View>

          {/* Title */}
          <Text style={styles.cardTitle}>{title}</Text>

          {/* Type */}
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>{ADDRESS_TYPE_ICONS[addressType]}</Text>
            <Text style={styles.detailValue}>{typeLabel}</Text>
          </View>

          {/* Metadata */}
          {visibleMetadata.map((fc) => (
            <View key={fc.field} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{(fc.label as any)[language] ?? fc.label.en}</Text>
              <Text style={styles.detailValue}>{metadata[fc.field]}</Text>
            </View>
          ))}

          {/* Drop-off */}
          <View style={styles.locationRow}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill={Colors.danger}
              />
              <Circle cx={12} cy={9} r={2.5} fill="#ffffff" />
            </Svg>
            <Text style={styles.locationText} numberOfLines={2}>
              {locationData.formattedAddress}
            </Text>
          </View>
        </View>

        {/* Ready to publish message */}
        <Text style={styles.publishHint}>
          {t('create.readyToPublishDescription')}
        </Text>

        {/* Suggested steps card */}
        <View style={styles.suggestedCard}>
          <Text style={styles.suggestedTitle}>
            {t('create.suggestedSteps')}
          </Text>
          <View style={styles.chipsContainer}>
            {suggestedSteps.map((step) => {
              const colors = STEP_TYPE_COLORS[step.type] || STEP_TYPE_COLORS.OTHER;
              const label =
                (STEP_TYPE_LABELS[step.type] as any)?.[language] ??
                STEP_TYPE_LABELS[step.type]?.en ??
                step.type;
              return (
                <View
                  key={step.type}
                  style={[styles.chip, { backgroundColor: colors.bg }]}
                >
                  <View style={[styles.chipDot, { backgroundColor: colors.dot }]} />
                  <Text style={[styles.chipText, { color: colors.text }]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer with CTAs */}
      <ScreenFooter style={styles.footer}>
        <Pressable
          style={[styles.publishButton, saving && styles.buttonDisabled]}
          onPress={onPublish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          <Text style={styles.publishButtonText}>
            {saving ? t('create.publishing') : t('create.publishAddress')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.addStepsButton, saving && styles.buttonDisabled]}
          onPress={onAddGuidanceSteps}
          disabled={saving}
        >
          <Text style={styles.addStepsButtonText}>
            + {t('create.addGuidanceSteps')}
          </Text>
        </Pressable>
      </ScreenFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },

  // Summary Card
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: 8,
  },
  statusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    width: 100,
  },
  detailValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  locationText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },

  // Publish hint
  publishHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },

  // Suggested steps
  suggestedCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  suggestedTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Footer
  footer: {
    gap: Spacing.sm,
  },
  publishButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  publishButtonText: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: '#ffffff',
  },
  addStepsButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepsButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },

  // Shared
  buttonDisabled: {
    opacity: 0.5,
  },
});
