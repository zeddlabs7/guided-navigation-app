import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { CourierContactPreference } from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import { getUser, updateUser } from '@/services/users';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

const OPTIONS: {
  value: CourierContactPreference;
  shortLabelKey: string;
  emoji: string;
}[] = [
  { value: 'CALL_ON_ARRIVAL', shortLabelKey: 'dashboard.contactCall', emoji: '📞' },
  { value: 'NO_CALL_LEAVE_PHOTO', shortLabelKey: 'dashboard.contactNoCall', emoji: '🔕' },
];

export function ContactPreferenceToggle() {
  const { t } = useTranslation();
  const { firebaseUser } = useAuth();

  const [selected, setSelected] = useState<CourierContactPreference>('CALL_ON_ARRIVAL');
  const [saving, setSaving] = useState<CourierContactPreference | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!firebaseUser) return;
      getUser(firebaseUser.uid).then((user) => {
        if (user?.courierContactPreference) {
          setSelected(user.courierContactPreference);
        }
        setLoaded(true);
      }).catch(() => setLoaded(true));
    }, [firebaseUser]),
  );

  async function handleTap(value: CourierContactPreference) {
    if (!firebaseUser || value === selected || saving !== null) return;
    const previous = selected;
    setSelected(value);
    setSaving(value);
    try {
      await updateUser(firebaseUser.uid, { courierContactPreference: value });
    } catch {
      setSelected(previous);
      Alert.alert(t('common.error'), t('settings.contactSaveError'));
    } finally {
      setSaving(null);
    }
  }

  if (!loaded) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonRow}>
          <View style={[styles.skeleton, { height: 44 }]} />
          <View style={[styles.skeleton, { height: 44 }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.courierContact')}</Text>
      <View style={styles.toggleRow}>
        {OPTIONS.map((option) => {
          const isSelected = option.value === selected;
          const isSaving = option.value === saving;
          return (
            <Pressable
              key={option.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleTap(option.value)}
              disabled={saving !== null}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.surface} />
              ) : (
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              )}
              <Text
                style={[styles.optionText, isSelected && styles.optionTextSelected]}
                numberOfLines={2}
              >
                {t(option.shortLabelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  optionEmoji: {
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    includeFontPadding: false,
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  skeleton: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
  },
});
