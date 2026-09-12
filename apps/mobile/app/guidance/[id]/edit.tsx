import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { ScreenFooter, useFooterScrollPadding } from '@/components/ui/ScreenFooter';
import { HomeButton } from '@/components/ui/HomeButton';
import { requiresMetadata as checkRequiresMetadata } from '@guidenav/types';
import { ADDRESS_TYPE_LABELS, getMetadataFieldConfigs } from '@guidenav/types';
import type {
  AddressType,
  GuidanceStatus,
  LocationData,
  StepType,
  Overlay,
} from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getGuidanceSet,
  getGuidanceSteps,
  createGuidanceStep,
  updateGuidanceSet,
  updateGuidanceStep,
  uploadStepImage,
  deleteStepImage,
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
  { bg: string; dot: string; text: string; labelKey: string }
> = {
  PUBLISHED: { bg: '#f0fdf4', dot: '#00c950', text: '#008236', labelKey: 'card.published' },
  DRAFT: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00', labelKey: 'card.draft' },
  DISABLED: { bg: '#f3f4f6', dot: '#99a1af', text: '#6a7282', labelKey: 'card.disabled' },
};

interface StepData {
  id: string;
  stepType: StepType;
  instructions: string;
  imageUrl: string | null;
  overlays: Overlay[];
}

export default function EditGuidanceScreen() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const router = useRouter();
  const { id: guidanceSetId } = useLocalSearchParams<{ id: string }>();
  const { firebaseUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<FormStep>('steps');
  const [title, setTitle] = useState('');
  const [titleArabic, setTitleArabic] = useState('');
  const [status, setStatus] = useState<GuidanceStatus>('DRAFT');
  const [addressType, setAddressType] = useState<AddressType | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [steps, setSteps] = useState<StepData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Location / landmark state (from system steps)
  const [locationStepId, setLocationStepId] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationPhotoUri, setLocationPhotoUri] = useState<string | null>(null);
  const [locationOverlays, setLocationOverlays] = useState<Overlay[]>([]);
  const [uploading, setUploading] = useState(false);
  const imageStoragePathRef = useRef<string | null>(null);
  const [landmarkStepId, setLandmarkStepId] = useState<string | null>(null);
  const [landmarkDescription, setLandmarkDescription] = useState('');
  const [landmarkDescriptionArabic, setLandmarkDescriptionArabic] = useState('');

  const displayTitle = title.trim() || t('edit.untitledAddress');
  const footerScrollPadding = useFooterScrollPadding(60);

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
        setError(t('edit.errorTitle'));
        setLoading(false);
        return;
      }

      setTitle(guidanceSet.title);
      setTitleArabic(guidanceSet.titleArabic || '');
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

      // Separate system steps from user steps
      const locStep = guidanceSteps.find((s) => s.stepType === 'LOCATION_CHECK');
      const lmStep = guidanceSteps.find((s) => s.stepType === 'LANDMARK_REFERENCE');
      const userSteps = guidanceSteps.filter(
        (s) => s.stepType !== 'LOCATION_CHECK' && s.stepType !== 'LANDMARK_REFERENCE',
      );

      // Initialize location state from LOCATION_CHECK step
      if (locStep) {
        setLocationStepId(locStep.id);
        setLocationData(locStep.locationData ?? null);
        setLocationPhotoUri(locStep.image?.publicUrl ?? null);
        setLocationOverlays(locStep.overlays ?? []);
        imageStoragePathRef.current = locStep.image?.storagePath ?? null;
      } else {
        setLocationStepId(null);
        setLocationData(null);
        setLocationPhotoUri(null);
        setLocationOverlays([]);
        imageStoragePathRef.current = null;
      }

      // Initialize landmark state from LANDMARK_REFERENCE step
      if (lmStep) {
        setLandmarkStepId(lmStep.id);
        setLandmarkDescription(lmStep.instructionOriginal || '');
        setLandmarkDescriptionArabic(
          (lmStep as any).instructionTranslations?.ar || '',
        );
      } else {
        setLandmarkStepId(null);
        setLandmarkDescription('');
        setLandmarkDescriptionArabic('');
      }

      setSteps(
        userSteps.map((s) => ({
          id: s.id,
          stepType: s.stepType,
          instructions: s.instructionOriginal,
          imageUrl: s.image?.publicUrl || null,
          overlays: s.overlays || [],
        })),
      );
    } catch (err) {
      console.error('Failed to load address set:', err);
      setError(t('edit.errorSave'));
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
      { key: 'title', label: t('create.stepTitle'), enabled: true },
      { key: 'addressType', label: t('create.stepType'), enabled: true },
      ...(addressType && checkRequiresMetadata(addressType)
        ? [{ key: 'metadata', label: t('create.stepDetails'), enabled: true }]
        : []),
      { key: 'steps', label: t('create.stepSteps'), enabled: true },
    ],
    [addressType, t],
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

  // --- Location / Landmark handlers ---

  const ensureLocationStep = useCallback(async (): Promise<string> => {
    if (locationStepId) return locationStepId;
    if (!guidanceSetId) throw new Error('No guidance set');
    const stepId = await createGuidanceStep(
      guidanceSetId,
      {
        stepType: 'LOCATION_CHECK',
        contentType: 'TEXT',
        title: null,
        instructionOriginal: '',
        locationData: locationData ?? undefined,
      },
      0,
    );
    setLocationStepId(stepId);
    return stepId;
  }, [locationStepId, guidanceSetId, locationData]);

  const handleLocationChange = useCallback(async (data: LocationData | null) => {
    setLocationData(data);
    if (!data) return;
    try {
      const stepId = await ensureLocationStep();
      await updateGuidanceStep(stepId, { locationData: data });
    } catch (err) {
      console.error('[Edit] Failed to save location:', err);
    }
  }, [ensureLocationStep]);

  const handleLocationPhotoSelected = useCallback(async (uri: string) => {
    setLocationPhotoUri(uri);
    setUploading(true);
    try {
      const stepId = await ensureLocationStep();
      const uploaded = await uploadStepImage(guidanceSetId!, stepId, uri);
      imageStoragePathRef.current = uploaded.storagePath;
      await updateGuidanceStep(stepId, {
        image: uploaded,
        contentType: 'PHOTO',
      });
    } catch (err: any) {
      console.error('[Edit] Failed to upload location photo:', err);
      Alert.alert(t('common.error'), err?.message ?? t('edit.errorSave'));
    } finally {
      setUploading(false);
    }
  }, [ensureLocationStep, guidanceSetId, t]);

  const handleLocationPhotoRemoved = useCallback(async () => {
    const storagePath = imageStoragePathRef.current;
    setLocationPhotoUri(null);
    setLocationOverlays([]);
    imageStoragePathRef.current = null;

    if (storagePath && locationStepId) {
      try {
        await deleteStepImage(storagePath);
        await updateGuidanceStep(locationStepId, {
          image: null as any,
          contentType: 'TEXT',
          overlays: [],
        });
      } catch (err) {
        console.error('[Edit] Failed to remove photo:', err);
      }
    }
  }, [locationStepId]);

  const handleUpdateOverlays = useCallback(async (overlays: Overlay[]) => {
    setLocationOverlays(overlays);
    if (locationStepId) {
      try {
        await updateGuidanceStep(locationStepId, { overlays });
      } catch (err) {
        console.error('[Edit] Failed to save overlays:', err);
      }
    }
  }, [locationStepId]);

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

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!guidanceSetId || !title.trim() || !addressType) return false;
    setSaving(true);
    setError(null);
    try {
      const metaPayload =
        addressType && checkRequiresMetadata(addressType)
          ? buildMetadataPayload()
          : {};
      const arTitle = titleArabic.trim();
      await updateGuidanceSet(guidanceSetId, {
        title: title.trim(),
        ...(arTitle ? { titleArabic: arTitle } : {}),
        addressType,
        destinationCoordinates: locationData?.coordinates ?? null,
        ...metaPayload,
      });

      // Save or delete landmark step
      const hasLandmark = landmarkDescription.trim() || landmarkDescriptionArabic.trim();
      let currentLandmarkId = landmarkStepId;
      if (hasLandmark) {
        if (currentLandmarkId) {
          await updateGuidanceStep(currentLandmarkId, {
            instructionOriginal: landmarkDescription.trim(),
            ...(landmarkDescriptionArabic.trim()
              ? { instructionTranslations: { ar: landmarkDescriptionArabic.trim() } }
              : { instructionTranslations: {} }),
          });
        } else {
          const lmId = await createGuidanceStep(
            guidanceSetId,
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
          currentLandmarkId = lmId;
          setLandmarkStepId(lmId);
        }
      } else if (currentLandmarkId) {
        await deleteGuidanceStep(currentLandmarkId);
        setLandmarkStepId(null);
        currentLandmarkId = null;
      }

      const allStepIds: string[] = [];
      if (locationStepId) allStepIds.push(locationStepId);
      if (currentLandmarkId) allStepIds.push(currentLandmarkId);
      allStepIds.push(...steps.map((s) => s.id));
      if (allStepIds.length > 0) {
        await reorderGuidanceSteps(guidanceSetId, allStepIds);
      }
      return true;
    } catch (err) {
      console.error('Failed to save guidance set:', err);
      setError(t('edit.errorSave'));
      return false;
    } finally {
      setSaving(false);
    }
  }, [guidanceSetId, title, titleArabic, addressType, steps, buildMetadataPayload, locationData, locationStepId, landmarkDescription, landmarkDescriptionArabic, landmarkStepId]);

  const handlePreviewAndPublish = useCallback(async () => {
    if (!locationData || !locationPhotoUri) {
      Alert.alert(
        t('preview.locationRequired'),
        t('preview.locationRequiredMessage'),
      );
      return;
    }
    const saved = await handleSave();
    if (saved) {
      router.push(`/guidance/${guidanceSetId}/preview` as any);
    }
  }, [router, guidanceSetId, locationData, locationPhotoUri, t, handleSave]);

  const handleAddStep = useCallback(() => {
    const systemStepCount = (locationStepId ? 1 : 0) + (landmarkStepId ? 1 : 0);
    const nextIndex = systemStepCount + steps.length;
    const params = new URLSearchParams();
    if (addressType) {
      params.set('addressType', addressType);
    }
    params.set('userStepIndex', String(steps.length));
    router.push(
      `/guidance/${guidanceSetId}/steps/${nextIndex}?${params.toString()}` as any,
    );
  }, [router, guidanceSetId, steps.length, addressType, locationStepId, landmarkStepId]);

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

  const buildAllStepIds = useCallback((userSteps: StepData[]): string[] => {
    const ids: string[] = [];
    if (locationStepId) ids.push(locationStepId);
    if (landmarkStepId) ids.push(landmarkStepId);
    ids.push(...userSteps.map((s) => s.id));
    return ids;
  }, [locationStepId, landmarkStepId]);

  const handleMoveUp = useCallback(
    async (index: number) => {
      if (index <= 0 || !guidanceSetId) return;
      const newSteps = [...steps];
      const temp = newSteps[index];
      newSteps[index] = newSteps[index - 1];
      newSteps[index - 1] = temp;
      setSteps(newSteps);
      try {
        await reorderGuidanceSteps(guidanceSetId, buildAllStepIds(newSteps));
      } catch (err) {
        console.error('Failed to reorder steps:', err);
        const revert = [...newSteps];
        revert[index - 1] = revert[index];
        revert[index] = temp;
        setSteps(revert);
      }
    },
    [steps, guidanceSetId, buildAllStepIds],
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
        await reorderGuidanceSteps(guidanceSetId, buildAllStepIds(newSteps));
      } catch (err) {
        console.error('Failed to reorder steps:', err);
        const revert = [...newSteps];
        revert[index + 1] = revert[index];
        revert[index] = temp;
        setSteps(revert);
      }
    },
    [steps, guidanceSetId, buildAllStepIds],
  );

  const handleDeleteStep = useCallback(
    (index: number) => {
      Alert.alert(
        t('edit.deleteStepTitle'),
        t('edit.deleteStepMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
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
                Alert.alert(t('common.error'), t('edit.errorDelete'));
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
      t('edit.deleteAddressTitle'),
      t('edit.deleteAddressMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await deleteGuidanceSet(guidanceSetId!);
              router.replace('/(tabs)/dashboard');
            } catch (err) {
              console.error('Failed to delete guidance set:', err);
              Alert.alert(t('common.error'), t('edit.errorDelete'));
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
      ? ADDRESS_TYPE_LABELS[addressType]?.[language] ?? ADDRESS_TYPE_LABELS[addressType]?.en ?? addressType
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
          contentContainerStyle={[styles.stepsScrollContent, { paddingBottom: footerScrollPadding }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Address summary card */}
          {addressType && (
            <Pressable
              style={({ pressed }) => [
                styles.addressCard,
                pressed && styles.addressCardPressed,
              ]}
              onPress={() => setCurrentStep('title')}
            >
              {/* Card header: icon + type label + edit */}
              <View style={styles.addressCardHeader}>
                <View style={styles.addressCardTypeRow}>
                  <View style={styles.addressCardIconWrap}>
                    <Text style={styles.addressCardIcon}>
                      {ADDRESS_TYPE_ICONS[addressType]}
                    </Text>
                  </View>
                  <View style={styles.addressCardTypeInfo}>
                    <Text style={styles.addressCardTypeLabel}>{typeLabel}</Text>
                    <Text style={styles.addressCardTitle} numberOfLines={1}>
                      {displayTitle}
                    </Text>
                  </View>
                </View>
                <Pressable
                  style={styles.addressCardEditBtn}
                  onPress={() => setCurrentStep('title')}
                  hitSlop={8}
                >
                  <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                      stroke={Colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                      stroke={Colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                  <Text style={styles.addressCardEditText}>{t('edit.editInfo')}</Text>
                </Pressable>
              </View>

              {/* Address line */}
              {locationData?.formattedAddress && (
                <View style={styles.addressCardLocationRow}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill={Colors.danger}
                    />
                    <Path d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="#ffffff" />
                  </Svg>
                  <Text style={styles.addressCardLocationText} numberOfLines={2}>
                    {locationData.formattedAddress}
                  </Text>
                </View>
              )}

              {/* Metadata grid */}
              {visibleMeta.length > 0 && (
                <View style={styles.addressCardMetaGrid}>
                  {visibleMeta.map((fc) => (
                    <View key={fc.field} style={styles.addressCardMetaItem}>
                      <Text style={styles.addressCardMetaLabel}>
                        {getFieldShortLabel(fc.field)}
                      </Text>
                      <Text style={styles.addressCardMetaValue} numberOfLines={1}>
                        {getDisplayValue(fc.field)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          )}

          {/* Steps header */}
          <View style={styles.stepsHeader}>
            <Text style={styles.stepsTitle}>{t('edit.stepsSection')}</Text>
            <View style={styles.stepsCountBadge}>
              <Text style={styles.stepsCountText}>{steps.length}</Text>
            </View>
          </View>

          {/* Empty state or step list */}
          {steps.length === 0 ? (
            <View style={styles.emptyState}>
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
                <Text style={styles.addStepButtonText}>{t('edit.addFirstStep')}</Text>
              </Pressable>
              <Text style={styles.emptyTitle}>
                {t('edit.emptyTitle')}
              </Text>
              <Text style={styles.emptySubtitle}>
                {t('edit.emptySubtitle')}
              </Text>
              <View style={styles.examplesList}>
                <Text style={styles.exampleText}>📷  {t('edit.emptyBullet1')}</Text>
                <Text style={styles.exampleText}>↗️  {t('edit.emptyBullet2')}</Text>
                <Text style={styles.exampleText}>📝  {t('edit.emptyBullet3')}</Text>
                <Text style={styles.exampleText}>🚗  {t('edit.emptyBullet4')}</Text>
              </View>
              <Text style={styles.emptyHint}>
                {t('edit.emptyHint')}
              </Text>
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

          {/* Add step button (shown only when steps exist) */}
          {steps.length > 0 && (
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
              <Text style={styles.addStepButtonText}>{t('edit.addStep')}</Text>
            </Pressable>
          )}

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
            <Text style={styles.deleteButtonText}>{t('edit.deleteAddress')}</Text>
          </Pressable>
        </ScrollView>

        <ScreenFooter style={styles.footer}>
          <Pressable
            style={[styles.footerBtnSecondary, saving && styles.footerBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.footerBtnSecondaryText}>
              {saving ? t('edit.saving') : t('edit.saveDraft')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.footerBtnPrimary, saving && styles.footerBtnDisabled]}
            onPress={handlePreviewAndPublish}
            disabled={saving}
          >
            <Text style={styles.footerBtnPrimaryText}>{t('edit.previewPublish')}</Text>
          </Pressable>
        </ScreenFooter>
      </View>
    );
  };

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
          <Text style={styles.errorTitle}>{t('edit.errorTitle')}</Text>
          <Text style={styles.errorDescription}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </Pressable>
          <Pressable
            style={styles.backToDashboardButton}
            onPress={handleGoToDashboard}
          >
            <Text style={styles.backToDashboardText}>{t('edit.backToDashboard')}</Text>
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
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M15 18L9 12L15 6" stroke={Colors.text} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
          <HomeButton onPress={handleGoToDashboard} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>{t('edit.title')}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusConf.dot }]} />
          <Text style={[styles.statusText, { color: statusConf.text }]}>
            {t(statusConf.labelKey)}
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
              {saving ? t('edit.saving') : t('edit.save')}
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
  },
  addressCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addressCardPressed: {
    backgroundColor: '#FAFAFA',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  addressCardTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  addressCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCardIcon: {
    fontSize: 20,
  },
  addressCardTypeInfo: {
    flex: 1,
    gap: 1,
  },
  addressCardTypeLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressCardTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
  },
  addressCardEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  addressCardEditText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressCardLocationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  addressCardLocationText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  addressCardMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 1,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  addressCardMetaItem: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    minWidth: '30%',
    flexGrow: 1,
    flexBasis: '30%',
  },
  addressCardMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  addressCardMetaValue: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
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
    paddingVertical: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  examplesList: {
    gap: 6,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exampleText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  stepsList: {
    gap: Spacing.md,
  },

  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    marginVertical: Spacing.md,
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
    marginVertical: Spacing.md,
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
