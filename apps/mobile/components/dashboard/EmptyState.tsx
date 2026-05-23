import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

interface EmptyStateProps {
  hasSearchQuery: boolean;
}

export function EmptyState({ hasSearchQuery }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {hasSearchQuery ? 'No results found' : 'No address created yet'}
        </Text>
        <Text style={styles.description}>
          {hasSearchQuery
            ? 'Try adjusting your search or filter criteria.'
            : 'Create your first delivery address to help couriers find your location.'}
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
