import { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import Svg, { Path } from 'react-native-svg';
import { HomeButton } from '@/components/ui/HomeButton';
import { validateGuidanceTitle } from '@guidenav/core';
import { requiresMetadata as checkRequiresMetadata } from '@guidenav/types';
import type { AddressType, CreateGuidanceSetInput, LocationData, Overlay } from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  createGuidanceSet,
  createGuidanceStep,
  updateGuidanceSet,
  updateGuidanceStep,
  uploadStepImage,
  deleteStepImage,
} from '@/services/guidance';
import {
  StepIndicator,
  TitleStep,
  AddressTypeStep,
  MetadataStep,
} from '@/components/create';

type FormStep = 'title' | 'addressType' | 'metadata';

export default function CreateGuidanceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { firebaseUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<FormStep>('title');
  const [title, setTitle] = useState('');
  const [titleArabic, setTitleArabic] = useState('');
  const [addressType, setAddressType] = useState<AddressType | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Early-creation IDs (refs for mutex correctness, state for re-renders)
  const [guidanceSetId, setGuidanceSetId] = useState<string | null>(null);
  const [locationStepId, setLocationStepId] = useState<string | null>(null);
  const guidanceSetIdRef = useRef<string | null>(null);
  const locationStepIdRef = useRef<string | null>(null);
  const creatingRef = useRef(false);

  // Location & photo state
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationPhotoUri, setLocationPhotoUri] = useState<string | null>(null);
  const [locationOverlays, setLocationOverlays] = useState<Overlay[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);
  const imageStoragePathRef = useRef<string | null>(null);

  // Landmark state
  const [landmarkDescription, setLandmarkDescription] = useState('');
  const [landmarkDescriptionArabic, setLandmarkDescriptionArabic] = useState('');

  const displayTitle = title.trim() || t('create.untitledAddress');

  const stepIndicatorConfig = useMemo(
    () => [
      { key: 'title', label: t('create.stepTitle'), enabled: true },
      { key: 'addressType', label: t('create.stepType'), enabled: true },
      { key: 'metadata', label: t('create.stepDetails'), enabled: addressType !== null },
      { key: 'steps', label: t('create.stepSteps'), enabled: false },
    ],
    [addressType, t],
  );

  const buildMetadataPayload = useCallback((): Partial<CreateGuidanceSetInput> => {
    const payload: Partial<CreateGuidanceSetInput> = {};
    if (metadata.buildingNumber) payload.buildingNumber = metadata.buildingNumber;
    if (metadata.floorNumber) payload.floorNumber = metadata.floorNumber;
    if (metadata.doorNumber) payload.doorNumber = metadata.doorNumber;
    if (metadata.compoundName) payload.compoundName = metadata.compoundName;
    if (metadata.gateNumber) payload.gateNumber = metadata.gateNumber;
    if (metadata.unitType) payload.unitType = metadata.unitType as 'villa' | 'apartment';
    if (metadata.villaNumber) payload.villaNumber = metadata.villaNumber;
    if (metadata.apartmentNumber) payload.apartmentNumber = metadata.apartmentNumber;
    if (metadata.locationDescription) payload.locationDescription = metadata.locationDescription;
    return payload;
  }, [metadata]);

  // ── Shared helper: ensure guidance set + LOCATION_CHECK step exist ──

  const ensureGuidanceSetAndStep = useCallback(async (
    locData?: LocationData | null,
  ): Promise<{ setId: string; stepId: string }> => {
    // Use refs (not state) so concurrent callers see the latest value
    if (guidanceSetIdRef.current && locationStepIdRef.current) {
      return { setId: guidanceSetIdRef.current, stepId: locationStepIdRef.current };
    }

    if (creatingRef.current) {
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (!creatingRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 100);
      });
      if (guidanceSetIdRef.current && locationStepIdRef.current) {
        return { setId: guidanceSetIdRef.current, stepId: locationStepIdRef.current };
      }
    }

    creatingRef.current = true;
    try {
      const uid = firebaseUser?.uid;
      if (!uid || !addressType) throw new Error('Missing user or address type');

      const metadataPayload = buildMetadataPayload();
      const arTitle = titleArabic.trim();
      const input: CreateGuidanceSetInput = {
        title: title.trim() || t('create.untitledAddress'),
        ...(arTitle ? { titleArabic: arTitle } : {}),
        description: null,
        languageOriginal: 'en',
        availabilityMode: 'ANYTIME_TODAY',
        destinationCoordinates: locData?.coordinates ?? locationData?.coordinates ?? null,
        addressType,
        ...metadataPayload,
      };

      let setId = guidanceSetIdRef.current;
      if (!setId) {
        setId = await createGuidanceSet(uid, input);
        guidanceSetIdRef.current = setId;
        setGuidanceSetId(setId);
      }

      let stepId = locationStepIdRef.current;
      if (!stepId) {
        stepId = await createGuidanceStep(
          setId,
          {
            stepType: 'LOCATION_CHECK',
            contentType: 'TEXT',
            title: null,
            instructionOriginal: '',
            locationData: locData ?? locationData ?? undefined,
          },
          0,
        );
        locationStepIdRef.current = stepId;
        setLocationStepId(stepId);
      }

      return { setId, stepId };
    } finally {
      creatingRef.current = false;
    }
  }, [firebaseUser, addressType, title, titleArabic, locationData, buildMetadataPayload, t]);

  // ── Navigation ──

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
    }
  }, [currentStep, router]);

  const handleGoToDashboard = useCallback(() => {
    router.replace('/(tabs)/dashboard');
  }, [router]);

  const handleTitleContinue = useCallback(() => {
    const validation = validateGuidanceTitle(title);
    if (validation.valid) {
      setCurrentStep('addressType');
    }
  }, [title]);

  const handleAddressTypeContinue = useCallback(() => {
    if (!addressType) return;
    setCurrentStep('metadata');
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

  // ── Location handlers (trigger early creation) ──

  const handleLocationChange = useCallback(async (data: LocationData | null) => {
    setLocationData(data);
    if (!data) return;

    try {
      const { stepId } = await ensureGuidanceSetAndStep(data);
      await updateGuidanceStep(stepId, { locationData: data });
    } catch (err) {
      console.error('[Create] Failed to save location:', err);
    }
  }, [ensureGuidanceSetAndStep]);

  const doLocationUpload = useCallback(async (uri: string) => {
    setUploading(true);
    setUploadFailed(false);
    try {
      const { setId, stepId } = await ensureGuidanceSetAndStep();
      const uploaded = await uploadStepImage(setId, stepId, uri);
      imageStoragePathRef.current = uploaded.storagePath;
      await updateGuidanceStep(stepId, {
        image: uploaded,
        contentType: 'PHOTO',
      });
    } catch (err: any) {
      console.error('[Create] Failed to upload location photo:', err);
      setUploadFailed(true);
      imageStoragePathRef.current = null;
    } finally {
      setUploading(false);
    }
  }, [ensureGuidanceSetAndStep]);

  const handleLocationPhotoSelected = useCallback(async (uri: string) => {
    setLocationPhotoUri(uri);
    doLocationUpload(uri);
  }, [doLocationUpload]);

  const handleRetryLocationUpload = useCallback(() => {
    if (locationPhotoUri) doLocationUpload(locationPhotoUri);
  }, [locationPhotoUri, doLocationUpload]);

  const handleLocationPhotoRemoved = useCallback(async () => {
    const storagePath = imageStoragePathRef.current;
    setLocationPhotoUri(null);
    setLocationOverlays([]);
    setUploadFailed(false);
    imageStoragePathRef.current = null;

    const stepId = locationStepIdRef.current;
    if (storagePath && stepId) {
      try {
        await deleteStepImage(storagePath);
        await updateGuidanceStep(stepId, {
          image: null as any,
          contentType: 'TEXT',
          overlays: [],
        });
      } catch (err) {
        console.error('[Create] Failed to remove photo:', err);
      }
    }
  }, []);

  const handleUpdateOverlays = useCallback(async (overlays: Overlay[]) => {
    setLocationOverlays(overlays);
    const stepId = locationStepIdRef.current;
    if (stepId) {
      try {
        await updateGuidanceStep(stepId, { overlays });
      } catch (err) {
        console.error('[Create] Failed to save overlays:', err);
      }
    }
  }, []);

  // ── Step 4 actions (update existing set, then navigate) ──

  const updateExistingSet = useCallback(async (): Promise<string | null> => {
    const setId = guidanceSetIdRef.current;
    if (!setId || !firebaseUser?.uid || !addressType) return null;

    const metadataPayload = buildMetadataPayload();
    const arTitle = titleArabic.trim();
    await updateGuidanceSet(setId, {
      title: title.trim(),
      ...(arTitle ? { titleArabic: arTitle } : {}),
      addressType,
      destinationCoordinates: locationData?.coordinates ?? null,
      ...metadataPayload,
    });

    // Create LANDMARK_REFERENCE if needed
    const hasLandmark = landmarkDescription.trim() || landmarkDescriptionArabic.trim();
    if (hasLandmark) {
      await createGuidanceStep(
        setId,
        {
          stepType: 'LANDMARK_REFERENCE',
          contentType: 'TEXT',
          title: null,
          instructionOriginal: landmarkDescription.trim(),
          ...(landmarkDescriptionArabic.trim()
            ? { instructionTranslations: { ar: landmarkDescriptionArabic.trim() } }
            : {}),
        },
        1,
      );
    }

    return setId;
  }, [firebaseUser, addressType, title, titleArabic, locationData, landmarkDescription, landmarkDescriptionArabic, buildMetadataPayload]);

  const handleMetadataContinue = useCallback(async () => {
    if (!firebaseUser?.uid || !addressType) return;
    if (uploading) {
      Alert.alert(t('common.error'), t('create.waitForUpload'));
      return;
    }
    if (uploadFailed) {
      Alert.alert(t('common.error'), t('create.uploadFailedRetry'));
      return;
    }
    setSaving(true);
    try {
      const setId = await updateExistingSet();
      if (setId) {
        router.replace(`/guidance/${setId}/edit` as any);
      }
    } catch (error: any) {
      console.error('[MetadataContinue] Failed:', error);
      Alert.alert(t('common.error'), error?.message ?? t('create.errorSave'));
    } finally {
      setSaving(false);
    }
  }, [firebaseUser, addressType, uploading, uploadFailed, updateExistingSet, router, t]);

  // ── Render ──

  const renderStep = () => {
    switch (currentStep) {
      case 'title':
        return (
          <TitleStep
            title={title}
            titleArabic={titleArabic}
            onTitleChange={setTitle}
            onTitleArabicChange={setTitleArabic}
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
            locationData={locationData}
            onLocationChange={handleLocationChange}
            locationPhotoUri={locationPhotoUri}
            onPhotoSelected={handleLocationPhotoSelected}
            onPhotoRemoved={handleLocationPhotoRemoved}
            locationOverlays={locationOverlays}
            onUpdateLocationOverlays={handleUpdateOverlays}
            landmarkDescription={landmarkDescription}
            onLandmarkDescriptionChange={setLandmarkDescription}
            landmarkDescriptionArabic={landmarkDescriptionArabic}
            onLandmarkDescriptionArabicChange={setLandmarkDescriptionArabic}
            uploading={uploading}
            uploadFailed={uploadFailed}
            onRetryUpload={handleRetryLocationUpload}
            saving={saving}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke={Colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <HomeButton onPress={handleGoToDashboard} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>{t('create.newAddress')}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>

      </View>

      <StepIndicator steps={stepIndicatorConfig} currentStep={currentStep} />

      <View style={styles.stepContent}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
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
  stepContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
