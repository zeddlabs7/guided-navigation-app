import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenFooter, useFooterScrollPadding } from '@/components/ui/ScreenFooter';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import Svg, { Path } from 'react-native-svg';
import { BackChevron } from '@/components/ui/BackChevron';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { StepTypeDropdown, STEP_TYPE_COLORS, PhotoEditorWithUpload, LocationPicker } from '@/components/steps';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStepCreationOnboarding, type OnboardingPhase } from '@/hooks/useStepCreationOnboarding';
import { StepCreationCoachMarks } from '@/components/onboarding/StepCreationCoachMarks';

export default function StepBuilderScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const footerScrollPadding = useFooterScrollPadding(56);
  const router = useRouter();
  const { id: guidanceSetId, stepIndex: stepIndexParam } = useLocalSearchParams<{
    id: string;
    stepIndex: string;
  }>();
  const searchParams = useLocalSearchParams<{
    edit?: string;
    addressType?: string;
    userStepIndex?: string;
  }>();

  const editStepId = searchParams.edit || null;
  const addressTypeParam = (searchParams.addressType as AddressType) || null;
  const stepIndex = stepIndexParam ? parseInt(stepIndexParam, 10) : 0;
  const userStepIndex = searchParams.userStepIndex != null
    ? parseInt(searchParams.userStepIndex, 10)
    : stepIndex;
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
  const [overlayEditorRequest, setOverlayEditorRequest] = useState(0);
  const [locationData, setLocationData] = useState<LocationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [instructionsTouched, setInstructionsTouched] = useState(false);
  const [instructionsError, setInstructionsError] = useState<string | null>(null);
  const [locationTouched, setLocationTouched] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const stepIdRef = useRef<string | null>(editStepId);
  const stepSavedRef = useRef(false);
  const scrollRef = useRef<any>(null);
  const photoSectionRef = useRef<View>(null);
  const instructionsSectionRef = useRef<View>(null);
  const [coachAnchored, setCoachAnchored] = useState(true);
  const arabicInputRef = useRef<TextInput>(null);
  const locationSectionY = useRef(0);
  const instructionsSectionY = useRef(0);

  // Coach marks / onboarding
  const {
    currentPhase: onboardingPhase,
    isActive: onboardingActive,
    setPhase: setOnboardingPhase,
    dismiss: dismissOnboarding,
  } = useStepCreationOnboarding(isEditMode, overlays.length);
  const [helpFocusOnly, setHelpFocusOnly] = useState(false);

  const scrollOffsetRef = useRef(0);
  const headerHeightRef = useRef(0);

  // Layout-Y positions relative to scroll content for each coachable section
  const sectionLayoutY = useRef<Record<string, { y: number; height: number }>>({});

  // Save button is outside scroll — use measureInWindow for it only
  const saveBtnRef = useRef<View>(null);
  const [saveBtnScreenY, setSaveBtnScreenY] = useState<number | null>(null);
  const [coachLayoutVersion, setCoachLayoutVersion] = useState(0);

  const recordSectionLayout = useCallback(
    (key: string, y: number, height: number) => {
      sectionLayoutY.current[key] = { y, height };
    },
    [],
  );

  /** Convert a scroll-content-relative Y into an absolute screen Y. */
  const getScreenRect = useCallback(
    (key: string): { screenY: number; height: number } | null => {
      const info = sectionLayoutY.current[key];
      if (!info) return null;
      const screenY = info.y - scrollOffsetRef.current + headerHeightRef.current;
      return { screenY, height: info.height };
    },
    [],
  );

  const currentTargetRect = useMemo(() => {
    if (!onboardingActive) return null;
    if (onboardingPhase === 'save') {
      if (saveBtnScreenY != null) return { screenY: saveBtnScreenY, height: 48 };
      return null;
    }
    const keyMap: Record<string, string> = {
      photo: 'photo',
      mark: 'photo', // overlay tools live inside the photo section
      instruct: 'instruct',
    };
    const key = keyMap[onboardingPhase];
    return key ? getScreenRect(key) : null;
  }, [onboardingPhase, onboardingActive, getScreenRect, saveBtnScreenY, coachLayoutVersion]);

  /** Style applied to the currently-highlighted section */
  const highlightStyle = useMemo(
    () => ({
      borderWidth: 2,
      borderColor: Colors.primaryLight,
      borderRadius: BorderRadius.xl,
      ...Platform.select({
        ios: {
          shadowColor: Colors.primaryLight,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
    }),
    [],
  );

  const defaultStepType = useMemo((): StepType => {
    if (!addressType) return 'LOCATION_CHECK';
    const options = getStepTypesForAddressType(addressType);
    const match = options.find((o) => o.orderIndex === userStepIndex + 1);
    if (match) return match.type;
    if (userStepIndex >= options.length) return options[options.length - 1]?.type || 'LOCATION_CHECK';
    return options[userStepIndex]?.type || options[0]?.type || 'LOCATION_CHECK';
  }, [addressType, userStepIndex]);

  const selectedTypeColors = STEP_TYPE_COLORS[selectedStepType] || STEP_TYPE_COLORS.OTHER;
  const selectedTypeLabel = (STEP_TYPE_LABELS[selectedStepType] as any)?.[language] || STEP_TYPE_LABELS[selectedStepType]?.en || selectedStepType;

  const needsInstructions = selectedStepType !== 'LOCATION_CHECK';

  const isPhaseFilled = useCallback(
    (phase: OnboardingPhase) => {
      if (phase === 'photo' || phase === 'awaitingImage') return !!imageUri;
      if (phase === 'mark') return overlays.length > 0;
      if (phase === 'instruct') return !needsInstructions || instructions.trim().length > 0;
      return false;
    },
    [imageUri, overlays.length, needsInstructions, instructions],
  );

  const nextUnfilled = useCallback(
    (from: OnboardingPhase): OnboardingPhase => {
      const order: OnboardingPhase[] = ['photo', 'awaitingImage', 'mark', 'instruct', 'save'];
      const start = order.indexOf(from);
      for (let i = start + 1; i < order.length; i++) {
        const phase = order[i];
        if (phase === 'awaitingImage' && imageUri) continue;
        if (phase === 'save' || !isPhaseFilled(phase)) return phase;
      }
      return 'done';
    },
    [imageUri, isPhaseFilled],
  );

  const handleAdvanceCoach = useCallback(() => {
    if (helpFocusOnly) {
      setHelpFocusOnly(false);
      dismissOnboarding();
      return;
    }
    // Step 2: close the tip and open the arrow editor.
    if (onboardingPhase === 'mark') {
      setOnboardingPhase('awaitingMark');
      setOverlayEditorRequest((request) => request + 1);
      return;
    }
    // Step 4 stays hidden until the instruction (step 3) is actually entered.
    if (onboardingPhase === 'instruct') {
      setOnboardingPhase(instructions.trim() ? 'save' : 'awaitingInstruction');
      return;
    }
    const next = nextUnfilled(onboardingPhase);
    if (next === 'done') dismissOnboarding();
    else setOnboardingPhase(next);
  }, [
    helpFocusOnly,
    dismissOnboarding,
    nextUnfilled,
    onboardingPhase,
    instructions,
    setOnboardingPhase,
  ]);

  const handleSkipCoach = useCallback(() => {
    setHelpFocusOnly(false);
    dismissOnboarding();
  }, [dismissOnboarding]);

  const handleDismissCoach = useCallback(() => {
    setHelpFocusOnly(false);
    dismissOnboarding();
  }, [dismissOnboarding]);

  const handleHelp = useCallback(() => {
    const formIsEmpty = !imageUri && overlays.length === 0 && instructions.trim().length === 0;
    if (formIsEmpty) {
      setHelpFocusOnly(false);
      setCoachAnchored(true);
      setOnboardingPhase('photo');
      return;
    }
    const phase = imageUri ? nextUnfilled('awaitingImage') : 'photo';
    setHelpFocusOnly(true);
    setCoachAnchored(phase === 'photo' || phase === 'save');
    setOnboardingPhase(phase);
  }, [imageUri, overlays.length, instructions, nextUnfilled, setOnboardingPhase]);

  // After the photo is added, open only the next empty field.
  // Never jump to save here — step 4 waits until step 3 is finished.
  useEffect(() => {
    if (onboardingPhase !== 'awaitingImage' || !imageUri) return;
    const next = nextUnfilled('awaitingImage');
    setOnboardingPhase(next === 'save' || next === 'done' ? 'mark' : next);
  }, [imageUri, onboardingPhase, nextUnfilled, setOnboardingPhase]);

  // Scroll the highlighted section into view, then reveal that one tip.
  useEffect(() => {
    if (!onboardingActive || !imageUri) return;
    if (onboardingPhase !== 'mark' && onboardingPhase !== 'instruct') return;

    setCoachAnchored(false);
    let settle: ReturnType<typeof setTimeout> | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      const node = onboardingPhase === 'instruct' ? instructionsSectionRef : photoSectionRef;
      const finish = (target: number) => {
        scrollOffsetRef.current = target;
        setCoachLayoutVersion((version) => version + 1);
        setCoachAnchored(true);
      };
      if (!node.current?.measureInWindow) {
        finish(scrollOffsetRef.current);
        return;
      }
      node.current.measureInWindow((_x, y) => {
        const delta = y - headerHeightRef.current - Spacing.md;
        const target = Math.max(scrollOffsetRef.current + delta, 0);
        scrollRef.current?.scrollTo({ x: 0, y: target, animated: true });
        settle = setTimeout(() => finish(target), 450);
      });
      fallback = setTimeout(() => setCoachAnchored(true), 800);
    }, 300);
    return () => {
      clearTimeout(timer);
      if (settle) clearTimeout(settle);
      if (fallback) clearTimeout(fallback);
    };
  }, [onboardingActive, onboardingPhase, imageUri]);

  // Measure save button position (it's outside the scroll view)
  useEffect(() => {
    if (onboardingPhase !== 'save' || !onboardingActive) return;
    const timer = setTimeout(() => {
      saveBtnRef.current?.measureInWindow((_x, y, _w, _h) => {
        if (y > 0) setSaveBtnScreenY(y);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [onboardingPhase, onboardingActive]);

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
    } else if (!isEditMode) {
      createNewStep();
    }
  }, [guidanceSetId, isEditMode, editStepId]);

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
        setError(t('steps.stepNotFound'));
        setLoading(false);
        return;
      }
      setExistingStep(step);
      setSelectedStepType(step.stepType);
      setInstructions(step.instructionOriginal || '');
      setInstructionsArabic(step.instructionTranslations?.ar || '');
      setOverlays(step.overlays || []);
      setLocationData(step.locationData || null);
      if (step.image?.publicUrl) {
        setImageUri(step.image.publicUrl);
        setImageStoragePath(step.image.storagePath);
      }
      stepIdRef.current = step.id;
    } catch (err) {
      console.error('Failed to load step:', err);
      setError(t('steps.failedToLoad'));
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
      setError(t('steps.failedToInit'));
    } finally {
      setLoading(false);
    }
  }

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const validateLocation = useCallback((): boolean => {
    if (selectedStepType === 'LOCATION_CHECK' && !locationData) {
      setLocationError(t('steps.dropOffRequired'));
      return false;
    }
    setLocationError(null);
    return true;
  }, [selectedStepType, locationData]);

  const validateInstructions = useCallback((): boolean => {
    if (selectedStepType !== 'LOCATION_CHECK' && !instructions.trim()) {
      setInstructionsError(t('steps.instructionsRequired'));
      return false;
    }
    setInstructionsError(null);
    return true;
  }, [instructions, selectedStepType]);

  const handleInstructionsBlur = useCallback(() => {
    setInstructionsTouched(true);
    validateInstructions();
    if (onboardingPhase === 'awaitingInstruction' && instructions.trim()) {
      setOnboardingPhase('save');
    }
  }, [validateInstructions, onboardingPhase, instructions, setOnboardingPhase]);

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
      setError(t('steps.stepNotInit'));
      return;
    }
    if (uploading) {
      setError(t('steps.waitForUpload'));
      return;
    }
    if (uploadFailed) {
      setError(t('steps.uploadFailedRetryHint'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const arText = instructionsArabic.trim();
      await updateGuidanceStep(stepIdRef.current, {
        stepType: selectedStepType,
        contentType: imageUri ? 'PHOTO' : 'TEXT',
        title: null,
        instructionOriginal: instructions.trim(),
        instructionTranslations: arText ? { ar: arText } : {},
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
      setError(t('steps.failedToSave'));
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
    uploadFailed,
    router,
  ]);

  const doUpload = useCallback(
    async (uri: string) => {
      if (!stepIdRef.current || !guidanceSetId) return;
      setUploading(true);
      setUploadFailed(false);
      setError(null);

      try {
        const uploaded = await uploadStepImage(guidanceSetId, stepIdRef.current, uri);
        setImageStoragePath(uploaded.storagePath);
        setPendingImage(uploaded);
      } catch (err: any) {
        console.error('Failed to upload image:', err);
        setUploadFailed(true);
        setError(t('steps.uploadFailedHint'));
        setImageStoragePath(null);
        setPendingImage(null);
      } finally {
        setUploading(false);
      }
    },
    [guidanceSetId],
  );

  const handleImageSelected = useCallback(
    async (uri: string) => {
      if (!stepIdRef.current || !guidanceSetId) return;
      setImageUri(uri);
      setImageStoragePath(null);
      setPendingImage(null);
      doUpload(uri);
    },
    [guidanceSetId, doUpload],
  );

  const handleRetryUpload = useCallback(() => {
    if (!imageUri) return;
    doUpload(imageUri);
  }, [imageUri, doUpload]);

  const handleRemovePhoto = useCallback(() => {
    const pathToDelete = imageStoragePath;

    setImageUri(null);
    setImageStoragePath(null);
    setPendingImage(null);
    setUploadFailed(false);
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
      <View
        style={styles.header}
        onLayout={(e) => { headerHeightRef.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}
      >
        <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
          <BackChevron />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>
            {isEditMode ? t('steps.editStep') : t('steps.newStep')}
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
          style={styles.helpButton}
          onPress={handleHelp}
          hitSlop={8}
        >
          <Text style={styles.helpButtonText}>?</Text>
        </Pressable>
        <Pressable
          style={[
            styles.saveButton,
            (saving || uploading) && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveStep}
          disabled={saving || uploading || loading}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t('steps.saving') : t('steps.saveStep')}
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerScrollPadding }]}
        bottomOffset={62}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
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
                label={t('location.title')}
                placeholder={t('location.searchPlaceholder')}
              />
              {locationTouched && locationError && (
                <Text style={styles.errorText}>{locationError}</Text>
              )}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Photo Upload + Overlay Editor */}
        <View
          ref={photoSectionRef}
          style={[
            styles.section,
            (onboardingPhase === 'photo' || (onboardingPhase === 'mark' && coachAnchored)) &&
              onboardingActive &&
              highlightStyle,
          ]}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            recordSectionLayout('photo', y, height);
          }}
        >
          <PhotoEditorWithUpload
            imageUri={imageUri}
            overlays={overlays}
            uploading={uploading}
            uploadFailed={uploadFailed}
            saving={saving}
            onImageSelected={handleImageSelected}
            onRemove={handleRemovePhoto}
            onUpdateOverlays={setOverlays}
            onRetryUpload={handleRetryUpload}
            openOverlayRequest={overlayEditorRequest}
          />
        </View>

        <View style={styles.divider} />

        {/* Instructions */}
        <View
          ref={instructionsSectionRef}
          style={[
            styles.section,
            onboardingPhase === 'instruct' && onboardingActive && coachAnchored && highlightStyle,
          ]}
          onLayout={(e) => {
            const { y, height } = e.nativeEvent.layout;
            instructionsSectionY.current = y;
            recordSectionLayout('instruct', y, height);
          }}
        >
          <View style={styles.fieldWrapper}>
            <Text style={selectedStepType === 'LOCATION_CHECK' ? styles.fieldLabelOptional : styles.fieldLabel}>
              {selectedStepType === 'LOCATION_CHECK' ? t('steps.notes') : (
                <>{t('steps.instructions')} <Text style={styles.required}>*</Text></>
              )}
            </Text>
            <Text style={styles.helperText}>
              {selectedStepType === 'LOCATION_CHECK'
                ? t('steps.helperNotes')
                : t('steps.helperInstructions')}
            </Text>
            <TextInput
              style={[
                styles.textarea,
                instructionsTouched && instructionsError && styles.textareaError,
              ]}
              value={instructions}
              onChangeText={setInstructions}
              onBlur={handleInstructionsBlur}
              onSubmitEditing={() => arabicInputRef.current?.focus()}
              placeholder={selectedStepType === 'LOCATION_CHECK'
                ? t('steps.notesPlaceholder')
                : t('steps.instructionsPlaceholder')}
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

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabelOptional}>
              {t('steps.arabicInstructions')}
            </Text>
            <TextInput
              ref={arabicInputRef}
              style={[styles.textarea, styles.rtlInput]}
              value={instructionsArabic}
              onChangeText={setInstructionsArabic}
              placeholder={t('steps.arabicInstructionsPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!saving}
              returnKeyType="done"
            />
          </View>
        </View>

        {onboardingActive && (onboardingPhase === 'mark' || onboardingPhase === 'instruct') && (
          <View style={{ height: Dimensions.get('window').height * 0.45 }} />
        )}
      </KeyboardAwareScrollView>

      <ScreenFooter>
        <View
          ref={saveBtnRef}
          style={onboardingPhase === 'save' && onboardingActive ? highlightStyle : undefined}
        >
          <Pressable
            style={[
              styles.footerSaveButton,
              (saving || uploading) && styles.footerSaveButtonDisabled,
            ]}
            onPress={handleSaveStep}
            disabled={saving || uploading || loading}
          >
            <Text style={styles.footerSaveButtonText}>
              {saving ? t('steps.saving') : t('steps.saveStep')}
            </Text>
          </Pressable>
        </View>
      </ScreenFooter>

      {/* Coach marks overlay */}
      <StepCreationCoachMarks
        currentPhase={onboardingPhase}
        isActive={
          onboardingActive &&
          (onboardingPhase === 'photo' || onboardingPhase === 'save' || coachAnchored)
        }
        targetRect={currentTargetRect}
        showSteps={!helpFocusOnly}
        onAdvance={handleAdvanceCoach}
        onSkip={handleSkipCoach}
        onDismiss={handleDismissCoach}
      />
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
  headerInfo: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    includeFontPadding: false,
    lineHeight: 16,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    includeFontPadding: false,
  },
  helpButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
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
    includeFontPadding: false,
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
    paddingStart: Spacing.sm,
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
  rtlInput: {
    writingDirection: 'rtl',
  },
});
