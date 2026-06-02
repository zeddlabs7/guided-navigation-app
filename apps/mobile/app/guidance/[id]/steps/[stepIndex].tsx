import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenFooter, useFooterScrollPadding } from '@/components/ui/ScreenFooter';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { StepType, AddressType, StepImage, GuidanceStep, Overlay, LocationData } from '@guidenav/types';
import { STEP_TYPE_LABELS, getStepTypesForAddressType } from '@guidenav/types';
import {
  createGuidanceStep,
  updateGuidanceStep,
  deleteGuidanceStep,
  getGuidanceSteps,
  getGuidanceSet,
  uploadStepImage,
  deleteStepImage,
} from '@/services/guidance';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { StepTypeDropdown, STEP_TYPE_COLORS, PhotoUpload, LocationPicker } from '@/components/steps';
import { OverlayEditor } from '@/components/overlay';

export default function StepBuilderScreen() {
  const footerScrollPadding = useFooterScrollPadding(56);
  const router = useRouter();
  const { id: guidanceSetId, stepIndex: stepIndexParam } = useLocalSearchParams<{
    id: string;
    stepIndex: string;
  }>();
  const searchParams = useLocalSearchParams<{
    edit?: string;
    addressType?: string;
  }>();

  const editStepId = searchParams.edit || null;
  const addressTypeParam = (searchParams.addressType as AddressType) || null;
  const stepIndex = stepIndexParam ? parseInt(stepIndexParam, 10) : 0;
  const isEditMode = !!editStepId;

  const [addressType, setAddressType] = useState<AddressType | null>(addressTypeParam);
  const [selectedStepType, setSelectedStepType] = useState<StepType>('LOCATION_CHECK');
  const [instructions, setInstructions] = useState('');
  const [instructionsArabic, setInstructionsArabic] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageStoragePath, setImageStoragePath] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<StepImage | null>(null);
  const [existingStep, setExistingStep] = useState<GuidanceStep | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [instructionsTouched, setInstructionsTouched] = useState(false);
  const [instructionsError, setInstructionsError] = useState<string | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const stepIdRef = useRef<string | null>(editStepId);
  const stepSavedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);
  const arabicInputRef = useRef<TextInput>(null);
  const locationSectionY = useRef(0);
  const instructionsSectionY = useRef(0);
  const arabicSectionY = useRef(0);

  const defaultStepType = useMemo((): StepType => {
    if (!addressType) return 'LOCATION_CHECK';
    const options = getStepTypesForAddressType(addressType);
    const match = options.find((o) => o.orderIndex === stepIndex + 1);
    if (match) return match.type;
    if (stepIndex >= options.length) return options[options.length - 1]?.type || 'LOCATION_CHECK';
    return options[stepIndex]?.type || options[0]?.type || 'LOCATION_CHECK';
  }, [addressType, stepIndex]);

  const selectedTypeColors = STEP_TYPE_COLORS[selectedStepType] || STEP_TYPE_COLORS.OTHER;
  const selectedTypeLabel = STEP_TYPE_LABELS[selectedStepType]?.en || selectedStepType;

  // Load address type if not provided
  useEffect(() => {
    if (addressType || !guidanceSetId) return;
    (async () => {
      try {
        const gs = await getGuidanceSet(guidanceSetId);
        if (gs?.addressType) setAddressType(gs.addressType);
      } catch (err) {
        console.error('Failed to load guidance set:', err);
      }
    })();
  }, [guidanceSetId, addressType]);

  // Initialize step
  useEffect(() => {
    if (!guidanceSetId) return;

    if (isEditMode && editStepId) {
      loadExistingStep();
    } else {
      createNewStep();
    }
  }, [guidanceSetId]);

  // Set default step type once address type is known (new step only)
  useEffect(() => {
    if (!isEditMode && addressType) {
      setSelectedStepType(defaultStepType);
    }
  }, [addressType, defaultStepType, isEditMode]);

  // Orphan cleanup on unmount
  useEffect(() => {
    return () => {
      if (!isEditMode && stepIdRef.current && !stepSavedRef.current) {
        const orphanId = stepIdRef.current;
        const orphanImagePath = imageStoragePath;
        deleteGuidanceStep(orphanId).catch(() => {});
        if (orphanImagePath) {
          deleteStepImage(orphanImagePath).catch(() => {});
        }
      }
    };
  }, []);

  async function loadExistingStep() {
    setLoading(true);
    setError(null);
    try {
      const steps = await getGuidanceSteps(guidanceSetId!);
      const step = steps.find((s) => s.id === editStepId);
      if (!step) {
        setError('Step not found');
        setLoading(false);
        return;
      }
      setExistingStep(step);
      setSelectedStepType(step.stepType);
      setInstructions(step.instructionOriginal || '');
      setOverlays(step.overlays || []);
      setLocationData(step.locationData || null);
      if (step.image?.publicUrl) {
        setImageUri(step.image.publicUrl);
        setImageStoragePath(step.image.storagePath);
      }
      stepIdRef.current = step.id;
    } catch (err) {
      console.error('Failed to load step:', err);
      setError('Failed to load step. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function createNewStep() {
    setLoading(true);
    setError(null);
    try {
      const newId = await createGuidanceStep(
        guidanceSetId!,
        {
          stepType: defaultStepType,
          contentType: 'TEXT',
          title: null,
          instructionOriginal: '',
        },
        stepIndex,
      );
      stepIdRef.current = newId;
    } catch (err) {
      console.error('Failed to create step:', err);
      setError('Failed to initialize step. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const validateLocation = useCallback((): boolean => {
    if (selectedStepType === 'LOCATION_CHECK' && !locationData) {
      setLocationError('Drop-off location is required');
      return false;
    }
    setLocationError(null);
    return true;
  }, [selectedStepType, locationData]);

  const validateInstructions = useCallback((): boolean => {
    if (selectedStepType !== 'LOCATION_CHECK' && !instructions.trim()) {
      setInstructionsError('Instructions are required');
      return false;
    }
    setInstructionsError(null);
    return true;
  }, [instructions, selectedStepType]);

  const handleInstructionsBlur = useCallback(() => {
    setInstructionsTouched(true);
    validateInstructions();
  }, [validateInstructions]);

  const handleSaveStep = useCallback(async () => {
    setLocationTouched(true);
    setInstructionsTouched(true);

    const locValid = validateLocation();
    const insValid = validateInstructions();

    if (!locValid) {
      scrollRef.current?.scrollTo({ y: locationSectionY.current, animated: true });
      return;
    }
    if (!insValid) {
      scrollRef.current?.scrollTo({ y: instructionsSectionY.current, animated: true });
      return;
    }

    if (!stepIdRef.current) {
      setError('Step not initialized. Please refresh and try again.');
      return;
    }
    if (uploading) {
      setError('Please wait for image upload to complete');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateGuidanceStep(stepIdRef.current, {
        stepType: selectedStepType,
        contentType: imageUri ? 'PHOTO' : 'TEXT',
        title: null,
        instructionOriginal: instructions.trim(),
        overlays: overlays,
        image: pendingImage ?? existingStep?.image ?? null,
        locationData: selectedStepType === 'LOCATION_CHECK' ? locationData : null,
      });
      stepSavedRef.current = true;
      if (!isEditMode) {
        router.replace(`/guidance/${guidanceSetId}/edit` as any);
      } else {
        router.back();
      }
    } catch (err: any) {
      console.error('Failed to save step:', err);
      setError('Failed to save step. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    validateLocation,
    validateInstructions,
    uploading,
    selectedStepType,
    imageUri,
    instructions,
    overlays,
    pendingImage,
    existingStep,
    locationData,
    router,
  ]);

  const handleImageSelected = useCallback(
    async (uri: string) => {
      if (!stepIdRef.current || !guidanceSetId) return;
      setImageUri(uri);
      setImageStoragePath(null);
      setPendingImage(null);
      setUploading(true);
      setError(null);

      try {
        const uploaded = await uploadStepImage(guidanceSetId, stepIdRef.current, uri);
        setImageStoragePath(uploaded.storagePath);
        setPendingImage(uploaded);
      } catch (err: any) {
        console.error('Failed to upload image:', err);
        setError('Failed to upload image. Please try again.');
        setImageStoragePath(null);
        setPendingImage(null);
      } finally {
        setUploading(false);
      }
    },
    [guidanceSetId],
  );

  const handleRemovePhoto = useCallback(() => {
    const pathToDelete = imageStoragePath;

    setImageUri(null);
    setImageStoragePath(null);
    setPendingImage(null);
    setOverlays([]);

    if (pathToDelete) {
      deleteStepImage(pathToDelete).catch((err) => {
        console.error('Failed to delete image from storage:', err);
      });
    }
  }, [imageStoragePath]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.text} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
          <Text style={styles.headerBackIcon}>←</Text>
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>
            {isEditMode ? 'EDIT STEP' : 'NEW STEP'}
          </Text>
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: selectedTypeColors.bg },
            ]}
          >
            <View
              style={[
                styles.headerBadgeDot,
                { backgroundColor: selectedTypeColors.dot },
              ]}
            />
            <Text
              style={[styles.headerBadgeText, { color: selectedTypeColors.text }]}
            >
              {selectedTypeLabel}
            </Text>
          </View>
        </View>
        <Pressable
          style={[
            styles.saveButton,
            (saving || uploading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveStep}
          disabled={saving || uploading || loading}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Step'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerScrollPadding }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <Pressable onPress={() => setError(null)}>
              <Text style={styles.errorDismiss}>✕</Text>
            </Pressable>
          </View>
        )}

        {/* Step Type Dropdown */}
        <View style={styles.section}>
          <StepTypeDropdown
            value={selectedStepType}
            onChange={setSelectedStepType}
            addressType={addressType}
            stepIndex={stepIndex}
            disabled={saving}
          />
        </View>

        <View style={styles.divider} />

        {/* Location Picker (LOCATION_CHECK steps only) */}
        {selectedStepType === 'LOCATION_CHECK' && (
          <>
            <View
              style={styles.section}
              onLayout={(e) => { locationSectionY.current = e.nativeEvent.layout.y; }}
            >
              <LocationPicker
                value={locationData}
                onChange={(data) => {
                  setLocationData(data);
                  if (data) setLocationError(null);
                }}
                disabled={saving}
                label="Drop-off Location"
                placeholder="Search for the delivery address..."
              />
              {locationTouched && locationError && (
                <Text style={styles.errorText}>{locationError}</Text>
              )}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Photo Upload + Overlay Editor */}
        <View style={styles.section}>
          {imageUri ? (
            <View style={styles.photoEditorSection}>
              <View style={styles.photoLabelRow}>
                <Text style={styles.photoLabel}>Upload Photo (optional)</Text>
                <Pressable onPress={handleRemovePhoto} disabled={saving || uploading}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
              <OverlayEditor
                imageUrl={imageUri}
                overlays={overlays}
                readonly={saving}
                onUpdateOverlays={setOverlays}
              />
              {uploading && (
                <View style={styles.uploadOverlay}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={styles.uploadOverlayText}>Uploading...</Text>
                </View>
              )}
            </View>
          ) : (
            <PhotoUpload
              imageUri={null}
              uploading={uploading}
              onImageSelected={handleImageSelected}
              onRemove={handleRemovePhoto}
              disabled={saving}
            />
          )}
        </View>

        <View style={styles.divider} />

        {/* Instructions */}
        <View
          style={styles.section}
          onLayout={(e) => { instructionsSectionY.current = e.nativeEvent.layout.y; }}
        >
          <View style={styles.fieldWrapper}>
            <Text style={selectedStepType === 'LOCATION_CHECK' ? styles.fieldLabelOptional : styles.fieldLabel}>
              {selectedStepType === 'LOCATION_CHECK' ? 'Notes (optional)' : (
                <>Instructions <Text style={styles.required}>*</Text></>
              )}
            </Text>
            <Text style={styles.helperText}>
              {selectedStepType === 'LOCATION_CHECK'
                ? 'Add any extra notes about this location for the courier.'
                : 'Add instructions that will help the courier navigate to this location.'}
            </Text>
            <TextInput
              style={[
                styles.textarea,
                instructionsTouched && instructionsError && styles.textareaError,
              ]}
              value={instructions}
              onChangeText={setInstructions}
              onBlur={handleInstructionsBlur}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: instructionsSectionY.current, animated: true });
                }, 250);
              }}
              onSubmitEditing={() => arabicInputRef.current?.focus()}
              placeholder={selectedStepType === 'LOCATION_CHECK'
                ? 'e.g. Ring the doorbell, leave at the gate...'
                : 'Enter instructions for the courier...'}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!saving}
              returnKeyType="next"
              blurOnSubmit={false}
            />
            {instructionsTouched && instructionsError && (
              <Text style={styles.errorText}>{instructionsError}</Text>
            )}
          </View>

          <View
            style={styles.fieldWrapper}
            onLayout={(e) => {
              arabicSectionY.current = instructionsSectionY.current + e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.fieldLabelOptional}>
              Arabic Instructions (optional)
            </Text>
            <TextInput
              ref={arabicInputRef}
              style={styles.textarea}
              value={instructionsArabic}
              onChangeText={setInstructionsArabic}
              onFocus={() => {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({ y: arabicSectionY.current, animated: true });
                }, 250);
              }}
              placeholder="أضف التعليمات بالعربية…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              textAlign="right"
              editable={!saving}
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>

      <ScreenFooter>
        <Pressable
          style={[
            styles.footerSaveButton,
            (saving || uploading) && styles.footerSaveButtonDisabled,
          ]}
          onPress={handleSaveStep}
          disabled={saving || uploading || loading}
        >
          <Text style={styles.footerSaveButtonText}>
            {saving ? 'Saving...' : 'Save Step'}
          </Text>
        </Pressable>
      </ScreenFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  headerBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  headerBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {},
  section: {
    padding: Spacing.xl,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    margin: Spacing.xl,
    marginBottom: 0,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  errorBannerText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    flex: 1,
  },
  errorDismiss: {
    fontSize: FontSize.base,
    color: Colors.danger,
    paddingLeft: Spacing.sm,
  },
  photoEditorSection: {
    gap: 10,
    position: 'relative',
  },
  photoLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  removeText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '500',
  },
  uploadOverlay: {
    position: 'absolute',
    top: 42,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  uploadOverlayText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: '#ffffff',
  },
  fieldWrapper: {
    gap: 6,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  fieldLabelOptional: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  required: {
    color: Colors.danger,
  },
  helperText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  textarea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    backgroundColor: Colors.surface,
    minHeight: 80,
  },
  textareaError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  footerSaveButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerSaveButtonDisabled: {
    opacity: 0.5,
  },
  footerSaveButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.surface,
  },
});
