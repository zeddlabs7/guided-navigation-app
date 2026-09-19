import {
  useState,
  useCallback,
  useMemo,
  useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  type LayoutChangeEvent,
} from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  getMetadataFieldConfigs,
  getMetadataSectionTitle,
} from '@guidenav/types';
import type { AddressType, MetadataFieldConfig, UnitType, LocationData, Overlay } from '@guidenav/types';
import { LocationPicker } from '@/components/steps/LocationPicker';
import { PhotoEditorWithUpload } from '@/components/steps/PhotoEditorWithUpload';
import { ScreenFooter, useFooterScrollPadding } from '@/components/ui/ScreenFooter';
import { useLanguage } from '@/contexts/LanguageContext';

interface MetadataStepProps {
  addressType: AddressType;
  metadata: Record<string, string>;
  onMetadataChange: (field: string, value: string) => void;
  onContinue: () => void;
  locationData?: LocationData | null;
  onLocationChange?: (data: LocationData | null) => void;
  locationPhotoUri?: string | null;
  onPhotoSelected?: (uri: string) => void;
  onPhotoRemoved?: () => void;
  locationOverlays?: Overlay[];
  onUpdateLocationOverlays?: (overlays: Overlay[]) => void;
  landmarkDescription?: string;
  onLandmarkDescriptionChange?: (text: string) => void;
  landmarkDescriptionArabic?: string;
  onLandmarkDescriptionArabicChange?: (text: string) => void;
  uploading?: boolean;
  uploadFailed?: boolean;
  onRetryUpload?: () => void;
  saving?: boolean;
}

export function MetadataStep({
  addressType,
  metadata,
  onMetadataChange,
  onContinue,
  locationData,
  onLocationChange,
  locationPhotoUri,
  onPhotoSelected,
  onPhotoRemoved,
  locationOverlays,
  onUpdateLocationOverlays,
  landmarkDescription,
  onLandmarkDescriptionChange,
  landmarkDescriptionArabic,
  onLandmarkDescriptionArabicChange,
  uploading,
  uploadFailed,
  onRetryUpload,
  saving,
}: MetadataStepProps) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const scrollRef = useRef<any>(null);

  const [locationPinTouched, setLocationPinTouched] = useState(false);
  const [locationPinError, setLocationPinError] = useState<string | null>(null);
  const [locationPhotoTouched, setLocationPhotoTouched] = useState(false);
  const [locationPhotoError, setLocationPhotoError] = useState<string | null>(null);

  const locationPinLayoutY = useRef(0);
  const locationPhotoLayoutY = useRef(0);

  const fieldConfigs = useMemo(
    () => getMetadataFieldConfigs(addressType),
    [addressType],
  );

  const sectionTitle = useMemo(
    () => getMetadataSectionTitle(addressType),
    [addressType],
  );

  const visibleFields = useMemo(() => {
    return fieldConfigs.filter((fc) => {
      if (!fc.dependsOn) return true;
      return metadata[fc.dependsOn.field] === fc.dependsOn.value;
    });
  }, [fieldConfigs, metadata]);

  const textFields = useMemo(() => {
    return visibleFields.filter((fc) => fc.field !== 'unitType');
  }, [visibleFields]);

  const validateField = useCallback(
    (fieldConfig: MetadataFieldConfig): boolean => {
      if (fieldConfig.dependsOn) {
        const depValue = metadata[fieldConfig.dependsOn.field];
        if (depValue !== fieldConfig.dependsOn.value) {
          return true;
        }
      }
      if (fieldConfig.required && !metadata[fieldConfig.field]?.trim()) {
        return false;
      }
      return true;
    },
    [metadata],
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouchedFields((prev) => new Set(prev).add(field));
      const config = fieldConfigs.find((fc) => fc.field === field);
      if (config && !validateField(config)) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: t('create.fieldRequired', { field: (config.label as any)[language] ?? config.label.en }),
        }));
      } else {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [fieldConfigs, validateField],
  );

  const showLocationFields = Boolean(onLocationChange);

  const handleContinue = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const newTouched = new Set(touchedFields);
    let allValid = true;

    for (const fc of visibleFields) {
      newTouched.add(fc.field);
      if (!validateField(fc)) {
        newErrors[fc.field] = t('create.fieldRequired', { field: (fc.label as any)[language] ?? fc.label.en });
        allValid = false;
      }
    }

    setTouchedFields(newTouched);
    setFieldErrors(newErrors);

    if (showLocationFields) {
      setLocationPinTouched(true);
      setLocationPhotoTouched(true);

      let locPinErr: string | null = null;
      let locPhotoErr: string | null = null;

      if (!locationData) {
        locPinErr = t('create.locationPinRequired');
        allValid = false;
      }
      if (!locationPhotoUri) {
        locPhotoErr = t('create.locationPhotoRequired');
        allValid = false;
      }

      setLocationPinError(locPinErr);
      setLocationPhotoError(locPhotoErr);

      if (!allValid) {
        if (locPinErr) {
          scrollRef.current?.scrollTo({ y: locationPinLayoutY.current, animated: true });
        } else if (locPhotoErr) {
          scrollRef.current?.scrollTo({ y: locationPhotoLayoutY.current, animated: true });
        }
        return;
      }
    }

    if (!allValid) return;

    onContinue();
  }, [visibleFields, validateField, touchedFields, onContinue, locationData, locationPhotoUri, showLocationFields]);

  const focusNextField = useCallback(
    (currentField: string) => {
      const currentIndex = textFields.findIndex((fc) => fc.field === currentField);
      if (currentIndex < textFields.length - 1) {
        const nextField = textFields[currentIndex + 1].field;
        inputRefs.current[nextField]?.focus();
      }
    },
    [textFields],
  );

  const renderUnitTypePicker = (fieldConfig: MetadataFieldConfig) => {
    const currentValue = metadata[fieldConfig.field] || '';
    const options: { value: UnitType; label: string }[] = [
      { value: 'villa', label: language === 'ar' ? 'فيلا' : 'Villa' },
      { value: 'apartment', label: language === 'ar' ? 'شقة' : 'Apartment' },
    ];

    return (
      <View key={fieldConfig.field} style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>
          {(fieldConfig.label as any)[language] ?? fieldConfig.label.en}
          {fieldConfig.required && <Text style={styles.required}> *</Text>}
        </Text>
        <View style={styles.segmentedControl}>
          {options.map((option) => {
            const isSelected = currentValue === option.value;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.segment,
                  isSelected && styles.segmentSelected,
                ]}
                onPress={() =>
                  onMetadataChange(fieldConfig.field, option.value)
                }
              >
                <Text
                  style={[
                    styles.segmentText,
                    isSelected && styles.segmentTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {touchedFields.has(fieldConfig.field) &&
          fieldErrors[fieldConfig.field] && (
            <Text style={styles.errorText}>
              {fieldErrors[fieldConfig.field]}
            </Text>
          )}
      </View>
    );
  };

  const renderTextField = (fieldConfig: MetadataFieldConfig, index: number) => {
    const value = metadata[fieldConfig.field] || '';
    const hasError =
      touchedFields.has(fieldConfig.field) && fieldErrors[fieldConfig.field];
    const isLast = index === textFields.length - 1;

    return (
      <View key={fieldConfig.field} style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>
          {(fieldConfig.label as any)[language] ?? fieldConfig.label.en}
          {fieldConfig.required && <Text style={styles.required}> *</Text>}
        </Text>
        <TextInput
          ref={(ref) => { inputRefs.current[fieldConfig.field] = ref; }}
          style={[styles.input, hasError && styles.inputError]}
          value={value}
          onChangeText={(text) => onMetadataChange(fieldConfig.field, text)}
          onBlur={() => handleBlur(fieldConfig.field)}
          onSubmitEditing={() => {
            if (isLast) {
              handleContinue();
            } else {
              focusNextField(fieldConfig.field);
            }
          }}
          placeholder={(fieldConfig.placeholder as any)[language] ?? fieldConfig.placeholder.en}
          placeholderTextColor={Colors.textMuted}
          returnKeyType={isLast ? 'done' : 'next'}
          blurOnSubmit={isLast}
        />
        {hasError && (
          <Text style={styles.errorText}>
            {fieldErrors[fieldConfig.field]}
          </Text>
        )}
      </View>
    );
  };

  const handleLocationPinLayout = (e: LayoutChangeEvent) => {
    locationPinLayoutY.current = e.nativeEvent.layout.y;
  };

  const footerScrollPadding = useFooterScrollPadding();

  const handleLocationPhotoLayout = (e: LayoutChangeEvent) => {
    locationPhotoLayoutY.current = e.nativeEvent.layout.y;
  };

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: footerScrollPadding }]}
        bottomOffset={62}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {(sectionTitle as any)?.[language] ?? sectionTitle?.en ?? t('create.titleLabel')}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {t('create.detailsSubtitle')}
        </Text>

        <View style={styles.fields}>
          {visibleFields.map((fc) =>
            fc.field === 'unitType'
              ? renderUnitTypePicker(fc)
              : renderTextField(fc, textFields.indexOf(fc)),
          )}
        </View>

        {showLocationFields && (
          <>
            {/* Delivery Location Section — distinct card */}
            <View style={styles.locationSection} onLayout={handleLocationPinLayout}>
              <Text style={styles.locationSectionTitle}>
                {t('create.locationPinLabel')}
                <Text style={styles.required}> *</Text>
              </Text>
              <Text style={styles.sectionHelper}>
                {t('create.locationPinHelper')}
              </Text>

              <LocationPicker
                value={locationData ?? null}
                onChange={(data) => {
                  onLocationChange?.(data);
                  if (data) setLocationPinError(null);
                }}
                disabled={false}
                label={t('location.title')}
                placeholder={t('location.searchPlaceholder')}
                showRequired={false}
              />
              {locationPinTouched && locationPinError && (
                <Text style={styles.errorText}>{locationPinError}</Text>
              )}

              <View style={styles.locationDivider} />

              <View onLayout={handleLocationPhotoLayout}>
                <Text style={styles.locationSubLabel}>
                  {t('create.locationPhotoLabel')}
                </Text>
                <Text style={styles.sectionHelper}>
                  {t('create.locationPhotoHelper')}
                </Text>
                <PhotoEditorWithUpload
                  imageUri={locationPhotoUri ?? null}
                  overlays={locationOverlays ?? []}
                  uploading={uploading ?? false}
                  uploadFailed={uploadFailed}
                  label={t('create.locationPhotoLabel')}
                  onImageSelected={onPhotoSelected!}
                  onRemove={onPhotoRemoved!}
                  onUpdateOverlays={onUpdateLocationOverlays!}
                  onRetryUpload={onRetryUpload}
                />
                {locationPhotoTouched && locationPhotoError && (
                  <Text style={styles.errorText}>{locationPhotoError}</Text>
                )}
              </View>
            </View>

            {/* Nearby Landmark (optional) */}
            <View style={styles.sectionDivider} />
            <Text style={styles.landmarkTitle}>
              {t('create.landmarkLabel')}
            </Text>
            <Text style={styles.sectionHelper}>
              {t('create.landmarkHelper')}
            </Text>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>
                {t('create.landmarkDescriptionLabel')}
              </Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={landmarkDescription ?? ''}
                onChangeText={onLandmarkDescriptionChange}
                placeholder={t('create.landmarkDescriptionPlaceholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>
                {t('create.landmarkDescriptionArabicLabel')}
              </Text>
              <TextInput
                style={[styles.input, styles.textarea, styles.rtlInput]}
                value={landmarkDescriptionArabic ?? ''}
                onChangeText={onLandmarkDescriptionArabicChange}
                placeholder={t('create.landmarkDescriptionArabicPlaceholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <ScreenFooter>
        <Pressable
          style={[styles.continueButton, (saving || uploading) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={saving || uploading}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>{t('create.continue')}</Text>
          )}
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
    padding: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
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
  fields: {
    gap: Spacing.lg,
  },
  fieldWrapper: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  required: {
    color: Colors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  segmentSelected: {
    backgroundColor: Colors.text,
  },
  segmentText: {
    fontSize: FontSize.base,
    fontWeight: '500',
    color: Colors.text,
  },
  segmentTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  locationSection: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  locationSectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  locationSubLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  locationDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xl,
  },
  sectionHelper: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: Spacing.md,
  },
  landmarkTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  textarea: {
    minHeight: 80,
  },
  rtlInput: {
    writingDirection: 'rtl',
  },
});
