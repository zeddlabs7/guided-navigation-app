import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { validateGuidanceTitle } from '@guidenav/core';

interface TitleStepProps {
  title: string;
  onTitleChange: (title: string) => void;
  onContinue: () => void;
}

export function TitleStep({ title, onTitleChange, onContinue }: TitleStepProps) {
  const [touched, setTouched] = useState(false);
  const [titleArabic, setTitleArabic] = useState('');
  const arabicInputRef = useRef<TextInput>(null);

  const validation = validateGuidanceTitle(title);
  const showError = touched && !validation.valid && title.length > 0;

  const handleBlur = useCallback(() => {
    setTouched(true);
  }, []);

  const handleSubmit = useCallback(() => {
    setTouched(true);
    if (validation.valid) {
      onContinue();
    }
  }, [validation.valid, onContinue]);

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.sectionTitle}>Address Details</Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>
            Address Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, showError && styles.inputError]}
            value={title}
            onChangeText={onTitleChange}
            onBlur={handleBlur}
            onSubmitEditing={() => arabicInputRef.current?.focus()}
            placeholder="e.g. Al Nakheel Tower – Delivery Guide"
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
            autoFocus
            returnKeyType="next"
            blurOnSubmit={false}
          />
          {showError && <Text style={styles.errorText}>{validation.error}</Text>}
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelOptional}>Arabic Title (optional)</Text>
          <TextInput
            ref={arabicInputRef}
            style={styles.input}
            value={titleArabic}
            onChangeText={setTitleArabic}
            onSubmitEditing={handleSubmit}
            placeholder="عنوان عربي اختياري"
            placeholderTextColor={Colors.textMuted}
            textAlign="right"
            returnKeyType="done"
          />
        </View>

        <Pressable
          style={[
            styles.continueButton,
            !validation.valid && styles.continueButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!validation.valid}
        >
          <Text
            style={[
              styles.continueButtonText,
              !validation.valid && styles.continueButtonTextDisabled,
            ]}
          >
            Continue
          </Text>
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
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.xl,
  },
  fieldWrapper: {
    marginBottom: Spacing.xl,
    gap: 6,
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
  continueButton: {
    backgroundColor: Colors.text,
    borderRadius: BorderRadius.full,
    paddingVertical: 13,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: Colors.border,
  },
  continueButtonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueButtonTextDisabled: {
    color: Colors.textMuted,
  },
});
