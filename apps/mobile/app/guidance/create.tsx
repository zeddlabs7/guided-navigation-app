import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { validateGuidanceTitle } from '@guidenav/core';
import { requiresMetadata as checkRequiresMetadata } from '@guidenav/types';
import type { AddressType, CreateGuidanceSetInput } from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import { createGuidanceSet } from '@/services/guidance';
import {
  StepIndicator,
  TitleStep,
  AddressTypeStep,
  MetadataStep,
  StepsOverviewStep,
} from '@/components/create';

type FormStep = 'title' | 'addressType' | 'metadata' | 'steps';

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

  const displayTitle = title.trim() || t('create.untitledAddress');

  const stepIndicatorConfig = useMemo(
    () => [
      { key: 'title', label: t('create.stepTitle'), enabled: true },
      { key: 'addressType', label: t('create.stepType'), enabled: true },
      { key: 'metadata', label: t('create.stepDetails'), enabled: addressType !== null },
      { key: 'steps', label: t('create.stepSteps'), enabled: addressType !== null },
    ],
    [addressType, t],
  );

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
    const validation = validateGuidanceTitle(title);
    if (validation.valid) {
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

  const buildAndCreate = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser?.uid || !addressType) return null;

    const metadataPayload: Partial<CreateGuidanceSetInput> = {};
    if (metadata.buildingNumber) metadataPayload.buildingNumber = metadata.buildingNumber;
    if (metadata.floorNumber) metadataPayload.floorNumber = metadata.floorNumber;
    if (metadata.doorNumber) metadataPayload.doorNumber = metadata.doorNumber;
    if (metadata.compoundName) metadataPayload.compoundName = metadata.compoundName;
    if (metadata.gateNumber) metadataPayload.gateNumber = metadata.gateNumber;
    if (metadata.unitType) metadataPayload.unitType = metadata.unitType as 'villa' | 'apartment';
    if (metadata.villaNumber) metadataPayload.villaNumber = metadata.villaNumber;
    if (metadata.apartmentNumber) metadataPayload.apartmentNumber = metadata.apartmentNumber;
    if (metadata.locationDescription) metadataPayload.locationDescription = metadata.locationDescription;

    const arTitle = titleArabic.trim();
    const input: CreateGuidanceSetInput = {
      title: title.trim(),
      ...(arTitle ? { titleArabic: arTitle } : {}),
      description: null,
      languageOriginal: 'en',
      availabilityMode: 'ANYTIME_TODAY',
      destinationCoordinates: null,
      addressType,
      ...metadataPayload,
    };

    return createGuidanceSet(firebaseUser.uid, input);
  }, [firebaseUser, title, titleArabic, addressType, metadata]);

  const handleSaveDraft = useCallback(async () => {
    if (!firebaseUser?.uid || !addressType) return;
    setSaving(true);
    try {
      const guidanceSetId = await buildAndCreate();
      if (guidanceSetId) {
        router.replace(`/guidance/${guidanceSetId}/edit`);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('create.errorSave'));
    } finally {
      setSaving(false);
    }
  }, [firebaseUser, addressType, buildAndCreate, router, t]);

  const handleAddFirstStep = useCallback(async () => {
    if (!firebaseUser?.uid || !addressType) return;
    setSaving(true);
    try {
      const guidanceSetId = await buildAndCreate();
      if (guidanceSetId) {
        router.replace(
          `/guidance/${guidanceSetId}/steps/0?addressType=${addressType}` as any,
        );
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.message ?? t('create.errorSave'));
    } finally {
      setSaving(false);
    }
  }, [firebaseUser, addressType, buildAndCreate, router, t]);

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
          />
        );
      case 'steps':
        if (!addressType) return null;
        return (
          <StepsOverviewStep
            title={title}
            addressType={addressType}
            metadata={metadata}
            saving={saving}
            onAddFirstStep={handleAddFirstStep}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header matching PWA */}
      <View style={styles.header}>
        <View style={styles.headerNav}>
          <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
            <Text style={styles.headerBackIcon}>←</Text>
          </Pressable>
          <Pressable onPress={handleGoToDashboard} style={styles.headerButton} hitSlop={8}>
            <Text style={styles.headerHomeIcon}>⌂</Text>
          </Pressable>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerLabel}>{t('create.newAddress')}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
        </View>

        {currentStep === 'steps' && (
          <Pressable
            style={[styles.saveDraftButton, saving && styles.saveDraftButtonDisabled]}
            onPress={handleSaveDraft}
            disabled={saving}
          >
            <Text style={styles.saveDraftButtonText}>
              {saving ? t('create.saving') : t('create.saveDraft')}
            </Text>
          </Pressable>
        )}
      </View>

      <StepIndicator steps={stepIndicatorConfig} currentStep={currentStep} />

      <View style={styles.stepContent}>{renderStep()}</View>
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
  saveDraftButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveDraftButtonDisabled: {
    opacity: 0.5,
  },
  saveDraftButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.text,
  },
  stepContent: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
