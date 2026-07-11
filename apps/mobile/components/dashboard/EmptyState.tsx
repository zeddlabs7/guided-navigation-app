import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface EmptyStateProps {
  hasSearchQuery: boolean;
}

export function EmptyState({ hasSearchQuery }: EmptyStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {hasSearchQuery ? t('dashboard.emptySearchTitle') : t('dashboard.emptyTitle')}
        </Text>
        <Text style={styles.description}>
          {hasSearchQuery
            ? t('dashboard.emptySearchDescription')
            : t('dashboard.emptyDescription')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
