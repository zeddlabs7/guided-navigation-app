import { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import {
  getMetadataFieldConfigs,
  getMetadataSectionTitle,
} from '@guidenav/types';
import type { AddressType, MetadataFieldConfig, UnitType } from '@guidenav/types';

interface MetadataStepProps {
  addressType: AddressType;
  metadata: Record<string, string>;
  onMetadataChange: (field: string, value: string) => void;
  onContinue: () => void;
}

export function MetadataStep({
  addressType,
  metadata,
  onMetadataChange,
  onContinue,
}: MetadataStepProps) {
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, TextInput | null>>({});

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
          [field]: `${config.label.en} is required`,
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

  const handleContinue = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const newTouched = new Set(touchedFields);
    let allValid = true;

    for (const fc of visibleFields) {
      newTouched.add(fc.field);
      if (!validateField(fc)) {
        newErrors[fc.field] = `${fc.label.en} is required`;
        allValid = false;
      }
    }

    setTouchedFields(newTouched);
    setFieldErrors(newErrors);

    if (allValid) {
      onContinue();
    }
  }, [visibleFields, validateField, touchedFields, onContinue]);

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
      { value: 'villa', label: 'Villa' },
      { value: 'apartment', label: 'Apartment' },
    ];

    return (
      <View key={fieldConfig.field} style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>
          {fieldConfig.label.en}
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
          {fieldConfig.label.en}
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
          placeholder={fieldConfig.placeholder.en}
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

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>
          {sectionTitle?.en ?? 'Address Details'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          These details help couriers find you faster
        </Text>

        <View style={styles.fields}>
          {visibleFields.map((fc, idx) =>
            fc.field === 'unitType'
              ? renderUnitTypePicker(fc)
              : renderTextField(fc, textFields.indexOf(fc)),
          )}
        </View>

        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue to Steps</Text>
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
    marginBottom: Spacing.xl,
  },
  fieldWrapper: {
    gap: 6,
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
  },
  continueButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
});
