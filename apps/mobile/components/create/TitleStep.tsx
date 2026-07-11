import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { validateGuidanceTitle } from '@guidenav/core';

interface TitleStepProps {
  title: string;
  titleArabic: string;
  onTitleChange: (title: string) => void;
  onTitleArabicChange: (titleArabic: string) => void;
  onContinue: () => void;
}

export function TitleStep({ title, titleArabic, onTitleChange, onTitleArabicChange, onContinue }: TitleStepProps) {
  const { t } = useTranslation();
  const [touched, setTouched] = useState(false);
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
        <Text style={styles.sectionTitle}>{t('create.titleLabel')}</Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>
            {t('create.titleField')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, showError && styles.inputError]}
            value={title}
            onChangeText={onTitleChange}
            onBlur={handleBlur}
            onSubmitEditing={() => arabicInputRef.current?.focus()}
            placeholder={t('create.titlePlaceholder')}
            placeholderTextColor={Colors.textMuted}
            maxLength={100}
            autoFocus
            returnKeyType="next"
            blurOnSubmit={false}
          />
          {showError && <Text style={styles.errorText}>{validation.error}</Text>}
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabelOptional}>{t('create.arabicTitleLabel')}</Text>
          <TextInput
            ref={arabicInputRef}
            style={styles.input}
            value={titleArabic}
            onChangeText={onTitleArabicChange}
            onSubmitEditing={handleSubmit}
            placeholder={t('create.arabicTitlePlaceholder')}
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
            {t('create.continue')}
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
