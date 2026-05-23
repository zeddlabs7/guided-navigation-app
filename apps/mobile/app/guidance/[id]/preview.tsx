import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import type { GuidanceSet, GuidanceStep, GuidanceStatus, Overlay, ArrowDirection, AddressType } from '@guidenav/types';
import { STEP_TYPE_LABELS, ADDRESS_TYPE_LABELS } from '@guidenav/types';
import { getMetadataFieldConfigs, requiresMetadata as checkRequiresMetadata } from '@guidenav/types';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { getGuidanceSet, getGuidanceSteps, updateGuidanceSet } from '@/services/guidance';

const arrowCurvedLeft = require('@/assets/arrows/arrow-curved-left.png');
const arrowCurvedRight = require('@/assets/arrows/arrow-curved-right.png');
const arrowForward = require('@/assets/arrows/arrow-forward.png');

const STATUS_CONFIG: Record<GuidanceStatus, { bg: string; dot: string; text: string; label: string }> = {
  PUBLISHED: { bg: '#dcfce7', dot: '#22c55e', text: '#16a34a', label: 'Published' },
  DRAFT: { bg: '#fef3c7', dot: '#f59e0b', text: '#d97706', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

const ADDRESS_TYPE_ICONS: Record<AddressType, string> = {
  APARTMENT_BUILDING: '🏢',
  VILLA: '🏠',
  RESIDENTIAL_COMPOUND: '🏘️',
  OFFICE_BUILDING: '🏛️',
  OTHER: '📍',
};

const FIELD_SHORT_LABELS: Record<string, string> = {
  buildingNumber: 'Bldg',
  floorNumber: 'Floor',
  doorNumber: 'Unit',
  compoundName: 'Compound',
  gateNumber: 'Gate',
  unitType: 'Type',
  villaNumber: 'Villa',
  apartmentNumber: 'Apt',
  locationDescription: 'Location',
};

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function getArrowImage(direction?: ArrowDirection) {
  switch (direction) {
    case 'right': return arrowCurvedRight;
    case 'left': return arrowCurvedLeft;
    case 'forward-backward': return arrowForward;
    default: return null;
  }
}

export default function PreviewScreen() {
  const router = useRouter();
  const { id: guidanceSetId } = useLocalSearchParams<{ id: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const imageContainerWidth = screenWidth - 32; // 16px padding on each side
  const imageHeight = imageContainerWidth * 0.75; // 4:3 aspect ratio

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidanceSet, setGuidanceSet] = useState<GuidanceSet | null>(null);
  const [steps, setSteps] = useState<GuidanceStep[]>([]);

  const status = guidanceSet?.status ?? 'DRAFT';
  const isPublished = status === 'PUBLISHED';
  const statusCfg = STATUS_CONFIG[status];
  const totalSteps = steps.length;

  const loadData = useCallback(async () => {
    if (!guidanceSetId) return;
    setLoading(true);
    setError(null);
    try {
      const [gs, gSteps] = await Promise.all([
        getGuidanceSet(guidanceSetId),
        getGuidanceSteps(guidanceSetId),
      ]);
      if (!gs) {
        setError('Address set not found');
        return;
      }
      setGuidanceSet(gs);
      setSteps(gSteps);
    } catch (err) {
      console.error('Failed to load preview data:', err);
      setError('Failed to load preview data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [guidanceSetId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handlePublish = useCallback(async () => {
    if (!guidanceSetId) return;
    setPublishing(true);
    setError(null);
    try {
      await updateGuidanceSet(guidanceSetId, { status: 'PUBLISHED' });
      setGuidanceSet((prev) => prev ? { ...prev, status: 'PUBLISHED' } : prev);
    } catch (err) {
      console.error('Failed to publish:', err);
      setError('Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [guidanceSetId]);

  const handleUnpublish = useCallback(async () => {
    if (!guidanceSetId) return;
    Alert.alert('Unpublish', 'This will deactivate any existing share links. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unpublish',
        style: 'destructive',
        onPress: async () => {
          setPublishing(true);
          setError(null);
          try {
            await updateGuidanceSet(guidanceSetId, { status: 'DRAFT' });
            setGuidanceSet((prev) => prev ? { ...prev, status: 'DRAFT' } : prev);
          } catch (err) {
            console.error('Failed to unpublish:', err);
            setError('Failed to unpublish. Please try again.');
          } finally {
            setPublishing(false);
          }
        },
      },
    ]);
  }, [guidanceSetId]);

  const handleShareLink = useCallback(() => {
    router.push(`/guidance/${guidanceSetId}/share` as any);
  }, [router, guidanceSetId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleAddSteps = useCallback(() => {
    router.push(`/guidance/${guidanceSetId}/edit` as any);
  }, [router, guidanceSetId]);

  const renderOverlay = (overlay: Overlay, containerWidth: number, containerHeight: number) => {
    const x = overlay.x * containerWidth;
    const y = overlay.y * containerHeight;
    const rotation = overlay.rotation ?? 0;

    if (overlay.type === 'marker') {
      const dotSize = 16;
      return (
        <View
          key={overlay.id}
          style={{
            position: 'absolute',
            left: x - dotSize / 2,
            top: y - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: '#ff6467',
            borderWidth: 3,
            borderColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 4,
          }}
        />
      );
    }

    if (overlay.type === 'arrow') {
      const direction = overlay.arrowDirection;

      if (direction === 'up-down' || !direction) {
        const svgW = 60 * overlay.scale;
        const svgH = 80 * overlay.scale;
        return (
          <View
            key={overlay.id}
            style={{
              position: 'absolute',
              left: x - svgW / 2,
              top: y - svgH / 2,
              transform: [{ rotate: `${rotation}deg` }],
            }}
          >
            <Svg width={svgW} height={svgH} viewBox="0 0 450 600">
              <Path d="M225 0 L60 180 L150 180 L150 480 L300 480 L300 180 L390 180 Z" fill="#ffde53" />
            </Svg>
          </View>
        );
      }

      const isCurved = direction === 'right' || direction === 'left';
      const baseSize = isCurved ? 80 : 60;
      const scaledSize = baseSize * overlay.scale;
      const arrowImg = getArrowImage(direction);
      if (!arrowImg) return null;

      return (
        <View
          key={overlay.id}
          style={{
            position: 'absolute',
            left: x - scaledSize / 2,
            top: y - scaledSize / 2,
            transform: [{ rotate: `${rotation}deg` }],
          }}
        >
          <Image
            source={arrowImg}
            style={{ width: scaledSize, height: scaledSize }}
            resizeMode="contain"
          />
        </View>
      );
    }

    return null;
  };

  const renderStepCard = (step: GuidanceStep, index: number) => {
    const overlayCount = step.overlays?.length ?? 0;
    const typeLabel = STEP_TYPE_LABELS[step.stepType]?.en ?? step.stepType;
    const hasImage = !!step.image?.publicUrl;

    return (
      <View key={step.id} style={styles.stepCard}>
        {/* Header */}
        <View style={styles.stepCardHeader}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.stepTypeBadge}>
            <View style={styles.stepTypeDot} />
            <Text style={styles.stepTypeText}>{typeLabel}</Text>
          </View>
          {overlayCount > 0 && (
            <View style={styles.overlayCount}>
              <View style={styles.overlayCountDot} />
              <Text style={styles.overlayCountText}>
                {overlayCount} {overlayCount === 1 ? 'overlay' : 'overlays'}
              </Text>
            </View>
          )}
        </View>

        {/* Image with overlays */}
        {hasImage && (
          <View style={[styles.stepImageContainer, { height: imageHeight }]}>
            <Image
              source={{ uri: step.image!.publicUrl }}
              style={styles.stepImage}
              resizeMode="cover"
            />
            {step.overlays && step.overlays.length > 0 && (
              <View style={StyleSheet.absoluteFill}>
                {step.overlays.map((overlay) =>
                  renderOverlay(overlay, imageContainerWidth, imageHeight)
                )}
              </View>
            )}
          </View>
        )}

        {/* Location data for LOCATION_CHECK steps */}
        {step.stepType === 'LOCATION_CHECK' && step.locationData && (
          <View style={styles.stepLocationCard}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 10c0 7-9 13-9 13s-9-6-9-13C3 5.03 7.03 1 12 1s9 4.03 9 9z"
                stroke={Colors.text}
                strokeWidth={2}
              />
              <Circle cx={12} cy={10} r={3} stroke={Colors.text} strokeWidth={2} />
            </Svg>
            <View style={styles.stepLocationText}>
              <Text style={styles.stepLocationAddress} numberOfLines={2}>
                {step.locationData.formattedAddress}
              </Text>
              <Text style={styles.stepLocationCoords}>
                {step.locationData.coordinates.latitude.toFixed(6)}, {step.locationData.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.stepCardContent}>
          {step.title ? <Text style={styles.stepTitle}>{step.title}</Text> : null}
          {step.instructionOriginal ? (
            <Text style={styles.stepInstructions}>{step.instructionOriginal}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !guidanceSet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M19 12H5M5 12L12 19M5 12L12 5" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Preview & Publish</Text>

        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryTitle}>{guidanceSet?.title}</Text>
            <Text style={styles.summaryDescription}>Review your address before sharing with couriers.</Text>
            <View style={styles.summaryMeta}>
              <Text style={styles.summaryMetaText}>
                {totalSteps} {totalSteps === 1 ? 'step' : 'steps'}
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.summaryMetaText}>
                Modified {formatDate(guidanceSet?.updatedAt || guidanceSet?.createdAt || '')}
              </Text>
            </View>
          </View>
        </View>

        {/* Address Details */}
        {guidanceSet?.addressType && (
          <View style={styles.addressSummary}>
            <View style={styles.addressSummaryType}>
              <Text style={styles.addressSummaryIcon}>
                {ADDRESS_TYPE_ICONS[guidanceSet.addressType]}
              </Text>
              <Text style={styles.addressSummaryLabel}>
                {ADDRESS_TYPE_LABELS[guidanceSet.addressType]?.en ?? guidanceSet.addressType}
              </Text>
            </View>
            {checkRequiresMetadata(guidanceSet.addressType) && (() => {
              const fieldConfigs = getMetadataFieldConfigs(guidanceSet.addressType);
              const gs = guidanceSet as Record<string, any>;
              const visibleMeta = fieldConfigs.filter((fc) => {
                if (!fc.dependsOn) return !!gs[fc.field];
                return gs[fc.dependsOn.field] === fc.dependsOn.value && !!gs[fc.field];
              });
              if (visibleMeta.length === 0) return null;
              return (
                <View style={styles.addressSummaryDetails}>
                  {visibleMeta.map((fc) => (
                    <Text key={fc.field} style={styles.addressSummaryDetail}>
                      {FIELD_SHORT_LABELS[fc.field] || fc.label.en}: {gs[fc.field]}
                    </Text>
                  ))}
                </View>
              );
            })()}
          </View>
        )}

        {/* Steps */}
        <View style={styles.stepsSection}>
          <Text style={styles.stepsSectionTitle}>Steps ({totalSteps})</Text>

          {totalSteps === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No steps added yet.</Text>
              <Pressable style={styles.emptyStateButton} onPress={handleAddSteps}>
                <Text style={styles.emptyStateButtonText}>Add Steps</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stepsList}>
              {steps.map((step, index) => renderStepCard(step, index))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      {totalSteps > 0 && (
        <View style={styles.footer}>
          {!isPublished ? (
            <>
              <View style={styles.footerButtons}>
                <Pressable
                  style={[styles.footerBtn, styles.footerBtnPrimary, publishing && styles.footerBtnDisabled]}
                  onPress={handlePublish}
                  disabled={publishing}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.footerBtnPrimaryText}>
                    {publishing ? 'Publishing...' : 'Publish'}
                  </Text>
                </Pressable>
                <Pressable style={[styles.footerBtn, styles.footerBtnSecondary, styles.footerBtnDisabled]} disabled>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke="#99a1af" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                  <Text style={styles.footerBtnSecondaryText}>Share Link</Text>
                </Pressable>
              </View>
              <Text style={styles.footerHint}>Publish to generate a shareable link for couriers</Text>
            </>
          ) : (
            <View style={styles.footerButtons}>
              <Pressable
                style={[styles.footerBtn, styles.footerBtnOutline, publishing && styles.footerBtnDisabled]}
                onPress={handleUnpublish}
                disabled={publishing}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} stroke={Colors.textSecondary} strokeWidth={2} />
                  <Path d="M15 9L9 15M9 9L15 15" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.footerBtnOutlineText}>
                  {publishing ? 'Unpublishing...' : 'Unpublish'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.footerBtn, styles.footerBtnSecondary, publishing && styles.footerBtnDisabled]}
                onPress={handleShareLink}
                disabled={publishing}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M8.59 13.51L15.42 17.49M15.41 6.51L8.59 10.49" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <Text style={styles.footerBtnSecondaryText}>Share Link</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.lg,
  },
  errorBannerText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
  },

  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentInner: {
    padding: Spacing.xl,
    paddingBottom: 180,
  },

  summaryCard: {
    flexDirection: 'row',
    gap: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xxl,
    marginBottom: Spacing.xl,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  summaryDescription: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  summaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryMetaText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: FontSize.xs,
    color: Colors.border,
  },

  addressSummary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: 6,
  },
  addressSummaryType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressSummaryIcon: {
    fontSize: 18,
  },
  addressSummaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  addressSummaryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  addressSummaryDetail: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  stepsSection: {
    gap: Spacing.lg,
  },
  stepsSectionTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.2,
  },

  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxl,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  emptyStateButton: {
    paddingVertical: 7,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
  },
  emptyStateButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },

  stepsList: {
    gap: Spacing.lg,
  },

  stepCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#dcfce7',
    borderRadius: BorderRadius.full,
  },
  stepTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  stepTypeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: '#16a34a',
  },
  overlayCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
  },
  overlayCountDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.text,
  },
  overlayCountText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  stepImageContainer: {
    width: '100%',
    backgroundColor: Colors.background,
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },

  stepLocationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
    borderRadius: BorderRadius.lg,
  },
  stepLocationText: {
    flex: 1,
    gap: 2,
  },
  stepLocationAddress: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  stepLocationCoords: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  stepCardContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  stepInstructions: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  footerBtnPrimary: {
    backgroundColor: Colors.text,
  },
  footerBtnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
  footerBtnSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerBtnSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footerBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerBtnOutlineText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footerBtnDisabled: {
    opacity: 0.5,
  },
  footerHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
