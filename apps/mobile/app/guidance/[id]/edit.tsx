import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { requiresMetadata as checkRequiresMetadata } from '@guidenav/types';
import { ADDRESS_TYPE_LABELS, getMetadataFieldConfigs } from '@guidenav/types';
import type {
  AddressType,
  GuidanceStatus,
  StepType,
  Overlay,
} from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGuidanceSet,
  getGuidanceSteps,
  updateGuidanceSet,
  reorderGuidanceSteps,
  deleteGuidanceStep,
  deleteGuidanceSet,
} from '@/services/guidance';
import {
  StepIndicator,
  TitleStep,
  AddressTypeStep,
  MetadataStep,
} from '@/components/create';
import { StepCard } from '@/components/edit';
import Svg, { Path } from 'react-native-svg';

type FormStep = 'title' | 'addressType' | 'metadata' | 'steps';

const ADDRESS_TYPE_ICONS: Record<AddressType, string> = {
  APARTMENT_BUILDING: '🏢',
  VILLA: '🏠',
  RESIDENTIAL_COMPOUND: '🏘️',
  OFFICE_BUILDING: '🏛️',
  OTHER: '📍',
};

const STATUS_CONFIG: Record<
  GuidanceStatus,
  { bg: string; dot: string; text: string; label: string }
> = {
  PUBLISHED: { bg: '#f0fdf4', dot: '#00c950', text: '#008236', label: 'Published' },
  DRAFT: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00', label: 'Draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', label: 'Disabled' },
};

interface StepData {
  id: string;
  stepType: StepType;
  instructions: string;
  imageUrl: string | null;
  overlays: Overlay[];
}

export default function EditGuidanceScreen() {
  const router = useRouter();
  const { id: guidanceSetId } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<FormStep>('steps');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<GuidanceStatus>('DRAFT');
  const [addressType, setAddressType] = useState<AddressType | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = title.trim() || 'Untitled Address';

  const loadData = useCallback(async () => {
    if (!guidanceSetId) return;
    setLoading(true);
    setError(null);
    try {
      const [guidanceSet, guidanceSteps] = await Promise.all([
        getGuidanceSet(guidanceSetId),
        getGuidanceSteps(guidanceSetId),
      ]);

      if (!guidanceSet) {
        setError('Address set not found');
        setLoading(false);
        return;
      }

      setTitle(guidanceSet.title);
      setStatus(guidanceSet.status);
      setAddressType(guidanceSet.addressType || null);
      setMetadata({
        buildingNumber: guidanceSet.buildingNumber || '',
        floorNumber: guidanceSet.floorNumber || '',
        doorNumber: guidanceSet.doorNumber || '',
        compoundName: guidanceSet.compoundName || '',
        gateNumber: guidanceSet.gateNumber || '',
        unitType: guidanceSet.unitType || '',
        villaNumber: guidanceSet.villaNumber || '',
        apartmentNumber: guidanceSet.apartmentNumber || '',
        locationDescription: guidanceSet.locationDescription || '',
      });
      setSteps(
        guidanceSteps.map((s) => ({
          id: s.id,
          stepType: s.stepType,
          instructions: s.instructionOriginal,
          imageUrl: s.image?.publicUrl || null,
          overlays: s.overlays || [],
        })),
      );
    } catch (err) {
      console.error('Failed to load address set:', err);
      setError('Failed to load address set. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [guidanceSetId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const stepIndicatorConfig = useMemo(
    () => [
      { key: 'title', label: 'Title', enabled: true },
      { key: 'addressType', label: 'Type', enabled: true },
      ...(addressType && checkRequiresMetadata(addressType)
        ? [{ key: 'metadata', label: 'Details', enabled: true }]
        : []),
      { key: 'steps', label: 'Steps', enabled: true },
    ],
    [addressType],
  );

  const handleStepPress = useCallback((stepKey: string) => {
    setCurrentStep(stepKey as FormStep);
  }, []);

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'title':
        router.back();
        break;
      case 'addressType':
        setCurrentStep('title');
        break;
      case 'metadata':
        setCurrentStep('addressType');
        break;
      case 'steps':
        if (addressType && checkRequiresMetadata(addressType)) {
          setCurrentStep('metadata');
        } else {
          setCurrentStep('addressType');
        }
        break;
    }
  }, [currentStep, addressType, router]);

  const handleGoToDashboard = useCallback(() => {
    router.replace('/(tabs)/dashboard');
  }, [router]);

  const handleTitleContinue = useCallback(() => {
    if (title.trim()) {
      setCurrentStep('addressType');
    }
  }, [title]);

  const handleAddressTypeContinue = useCallback(() => {
    if (!addressType) return;
    if (checkRequiresMetadata(addressType)) {
      setCurrentStep('metadata');
    } else {
      setCurrentStep('steps');
    }
  }, [addressType]);

  const handleAddressTypeSelect = useCallback((type: AddressType) => {
    setAddressType((prev) => {
      if (prev !== type) {
        setMetadata({});
      }
      return type;
    });
  }, []);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleMetadataContinue = useCallback(() => {
    setCurrentStep('steps');
  }, []);

  // --- Steps tab actions ---

  const buildMetadataPayload = useCallback(() => {
    if (!addressType) return {};
    const fieldConfigs = getMetadataFieldConfigs(addressType);
    const visibleFields = fieldConfigs.filter((fc) => {
      if (!fc.dependsOn) return true;
      return metadata[fc.dependsOn.field] === fc.dependsOn.value;
    });
    const payload: Record<string, string> = {};
    for (const fc of visibleFields) {
      const value = metadata[fc.field]?.trim();
      if (value) {
        payload[fc.field] = value;
      }
    }
    return payload;
  }, [addressType, metadata]);

  const handleSave = useCallback(async () => {
    if (!guidanceSetId || !title.trim() || !addressType) return;
    setSaving(true);
    setError(null);
    try {
      const metaPayload =
        addressType && checkRequiresMetadata(addressType)
          ? buildMetadataPayload()
          : {};
      await updateGuidanceSet(guidanceSetId, {
        title: title.trim(),
        addressType,
        ...metaPayload,
      });
      const currentStepIds = steps.map((s) => s.id);
      if (currentStepIds.length > 0) {
        await reorderGuidanceSteps(guidanceSetId, currentStepIds);
      }
    } catch (err) {
      console.error('Failed to save guidance set:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [guidanceSetId, title, addressType, steps, buildMetadataPayload]);

  const handlePreviewAndPublish = useCallback(() => {
    router.push(`/guidance/${guidanceSetId}/preview` as any);
  }, [router, guidanceSetId]);

  const handleAddStep = useCallback(() => {
    const params = new URLSearchParams();
    if (addressType) {
      params.set('addressType', addressType);
    }
    router.push(
      `/guidance/${guidanceSetId}/steps/${steps.length}?${params.toString()}` as any,
    );
  }, [router, guidanceSetId, steps.length, addressType]);

  const handleEditStep = useCallback(
    (stepId: string) => {
      const params = new URLSearchParams();
      params.set('edit', stepId);
      if (addressType) {
        params.set('addressType', addressType);
      }
      router.push(
        `/guidance/${guidanceSetId}/steps/0?${params.toString()}` as any,
      );
    },
    [router, guidanceSetId, addressType],
  );

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index <= 0 || !guidanceSetId) return;
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index - 1];
      newSteps[index - 1] = temp;
      setSteps(newSteps);
      try {
        await reorderGuidanceSteps(
          guidanceSetId,
          newSteps.map((s) => s.id),
        );
      } catch (err) {
        console.error('Failed to reorder steps:', err);
        const revert = [...newSteps];
        revert[index - 1] = revert[index];
        revert[index] = temp;
        setSteps(revert);
      }
    },
    [steps, guidanceSetId],
  );

  const handleMoveDown = useCallback(
    async (index: number) => {
      if (index >= steps.length - 1 || !guidanceSetId) return;
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index + 1];
      newSteps[index + 1] = temp;
      setSteps(newSteps);
      try {
        await reorderGuidanceSteps(
          guidanceSetId,
          newSteps.map((s) => s.id),
        );
      } catch (err) {
        console.error('Failed to reorder steps:', err);
        const revert = [...newSteps];
        revert[index + 1] = revert[index];
        revert[index] = temp;
        setSteps(revert);
      }
    },
    [steps, guidanceSetId],
  );

  const handleDeleteStep = useCallback(
    (index: number) => {
      Alert.alert(
        'Delete Step',
        'Are you sure you want to delete this step?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              const step = steps[index];
              const newSteps = [...steps];
              newSteps.splice(index, 1);
              setSteps(newSteps);
              try {
                await deleteGuidanceStep(step.id);
              } catch (err) {
                console.error('Failed to delete step:', err);
                const revert = [...newSteps];
                revert.splice(index, 0, step);
                setSteps(revert);
                Alert.alert('Error', 'Failed to delete step. Please try again.');
              }
            },
          },
        ],
      );
    },
    [steps],
  );

  const handleDeleteGuidance = useCallback(() => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteGuidanceSet(guidanceSetId!);
              router.replace('/(tabs)/dashboard');
            } catch (err) {
              console.error('Failed to delete guidance set:', err);
              Alert.alert('Error', 'Failed to delete. Please try again.');
              setSaving(false);
            }
          },
        },
      ],
    );
  }, [title, guidanceSetId, router]);

  // --- Steps tab UI ---

  const renderStepsContent = () => {
    const typeLabel = addressType
      ? ADDRESS_TYPE_LABELS[addressType]?.en ?? addressType
      : '';
    const fieldConfigs = addressType ? getMetadataFieldConfigs(addressType) : [];
    const visibleMeta = fieldConfigs
      .filter((fc) => {
        if (!fc.dependsOn) return true;
        return metadata[fc.dependsOn.field] === fc.dependsOn.value;
      })
      .filter((fc) => metadata[fc.field]?.trim());

    const getFieldShortLabel = (field: string): string => {
      const shortLabels: Record<string, string> = {
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
      return shortLabels[field] || field;
    };

    const getDisplayValue = (field: string): string => {
      const value = metadata[field];
      if (field === 'unitType') {
        return value === 'villa' ? 'Villa' : value === 'apartment' ? 'Apartment' : value;
      }
      return value;
    };

    return (
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.stepsScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Address summary */}
          {addressType && (
            <View style={styles.addressSummary}>
              <View style={styles.addressSummaryType}>
                <Text style={styles.addressSummaryIcon}>
                  {ADDRESS_TYPE_ICONS[addressType]}
                </Text>
                <Text style={styles.addressSummaryLabel}>{typeLabel}</Text>
              </View>
              {visibleMeta.length > 0 && (
                <View style={styles.addressSummaryDetails}>
                  {visibleMeta.map((fc) => (
                    <Text key={fc.field} style={styles.addressSummaryDetail}>
                      {getFieldShortLabel(fc.field)}: {getDisplayValue(fc.field)}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Steps header */}
          <View style={styles.stepsHeader}>
            <Text style={styles.stepsTitle}>Steps</Text>
            <View style={styles.stepsCountBadge}>
              <Text style={styles.stepsCountText}>{steps.length}</Text>
            </View>
          </View>

          {/* Empty state or step list */}
          {steps.length === 0 ? (
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
                  <Text style={styles.exampleEmoji}>🖼️</Text>
                  <Text style={styles.exampleText}>
                    Photos with arrows pointing to entrances
                  </Text>
                </View>
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleEmoji}>📋</Text>
                  <Text style={styles.exampleText}>
                    Instructions for parking or access codes
                  </Text>
                </View>
                <View style={styles.exampleRow}>
                  <Text style={styles.exampleEmoji}>📍</Text>
                  <Text style={styles.exampleText}>
                    Markers highlighting key landmarks
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.stepsList}>
              {steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  stepNumber={index + 1}
                  stepType={step.stepType}
                  instructions={step.instructions}
                  imageUrl={step.imageUrl}
                  overlays={step.overlays}
                  isFirst={index === 0}
                  isLast={index === steps.length - 1}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                  onEdit={() => handleEditStep(step.id)}
                  onDelete={() => handleDeleteStep(index)}
                />
              ))}
            </View>
          )}

          {/* Add step button */}
          <Pressable
            style={styles.addStepButton}
            onPress={handleAddStep}
            disabled={saving}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 5V19M5 12H19"
                stroke={Colors.textSecondary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.addStepButtonText}>
              {steps.length === 0 ? 'Add First Step' : 'Add Step'}
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Delete address */}
          <Pressable
            style={styles.deleteButton}
            onPress={handleDeleteGuidance}
            disabled={saving}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
                stroke={Colors.danger}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.deleteButtonText}>Delete Address</Text>
          </Pressable>
        </ScrollView>

        {/* Fixed footer */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.footerBtnSecondary, saving && styles.footerBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.footerBtnSecondaryText}>
              {saving ? 'Saving...' : 'Save Draft'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.footerBtnPrimary, saving && styles.footerBtnDisabled]}
            onPress={handlePreviewAndPublish}
            disabled={saving}
          >
            <Text style={styles.footerBtnPrimaryText}>Preview & Publish</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'title':
        return (
          <TitleStep
            title={title}
            onTitleChange={setTitle}
            onContinue={handleTitleContinue}
          />
        );
      case 'addressType':
        return (
          <AddressTypeStep
            selectedType={addressType}
            onTypeSelect={handleAddressTypeSelect}
            onContinue={handleAddressTypeContinue}
          />
        );
      case 'metadata':
        if (!addressType) return null;
        return (
          <MetadataStep
            addressType={addressType}
            metadata={metadata}
            onMetadataChange={handleMetadataChange}
            onContinue={handleMetadataContinue}
          />
        );
      case 'steps':
        return renderStepsContent();
    }
  };

  // --- Error / Loading states ---

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !title) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
          <Pressable
            style={styles.backToDashboardButton}
            onPress={handleGoToDashboard}
          >
            <Text style={styles.backToDashboardText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusConf = STATUS_CONFIG[status];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
            <Text style={styles.headerBackIcon}>←</Text>
          </Pressable>
          <Pressable
            onPress={handleGoToDashboard}
            style={styles.headerButton}
            hitSlop={8}
          >
            <Text style={styles.headerHomeIcon}>⌂</Text>
          </Pressable>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>EDIT ADDRESS</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConf.dot }]} />
          <Text style={[styles.statusText, { color: statusConf.text }]}>
            {statusConf.label}
          </Text>
        </View>

        {/* Save button (only on steps tab) */}
        {currentStep === 'steps' && (
          <Pressable
            style={[styles.headerSaveBtn, saving && styles.headerSaveBtnDisabled]}
            onPress={handleSave}
            disabled={saving || loading}
          >
            <Text style={styles.headerSaveBtnText}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <Pressable onPress={() => setError(null)} hitSlop={8}>
            <Text style={styles.errorBannerDismiss}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* Progress indicator */}
      <StepIndicator
        steps={stepIndicatorConfig}
        currentStep={currentStep}
        onStepPress={handleStepPress}
      />

      {/* Step content */}
      <View style={styles.stepContent}>{renderStep()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flex: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
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
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    width: 200,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  backToDashboardButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    width: 200,
    alignItems: 'center',
  },
  backToDashboardText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
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
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  headerBackIcon: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  headerHomeIcon: {
    fontSize: 20,
    color: Colors.textMuted,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    lineHeight: 16,
  },
  headerSaveBtn: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  headerSaveBtnDisabled: {
    opacity: 0.5,
  },
  headerSaveBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.danger,
    lineHeight: 20,
  },
  errorBannerDismiss: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '600',
  },

  stepContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  stepsScrollContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  addressSummary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  stepsTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  stepsCountBadge: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCountText: {
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
  exampleEmoji: {
    fontSize: 18,
  },
  exampleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },

  stepsList: {
    gap: Spacing.md,
  },

  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    marginTop: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  addStepButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.textSecondary,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
  },
  deleteButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.danger,
  },

  footer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  footerBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerBtnPrimary: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text,
  },
  footerBtnDisabled: {
    opacity: 0.5,
  },
  footerBtnSecondaryText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footerBtnPrimaryText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
});
