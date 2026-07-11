import React from 'react';
import { TouchableOpacity, Text, View, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { GuidanceStatus } from '@guidenav/types';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

type FilterKey = 'all' | GuidanceStatus;

interface FilterTabsProps {
  activeFilter: FilterKey;
  onFilterChange: (filter: FilterKey) => void;
  counts: Record<FilterKey, number>;
}

const TAB_KEYS: { key: FilterKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'dashboard.filterAll' },
  { key: 'PUBLISHED', labelKey: 'dashboard.filterPublished' },
  { key: 'DRAFT', labelKey: 'dashboard.filterDraft' },
  // { key: 'DISABLED', labelKey: 'dashboard.filterDisabled' },
];

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.wrapper}
    >
      {TAB_KEYS.map((tab) => {
        const isActive = activeFilter === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onFilterChange(tab.key)}
            style={[styles.tab, isActive && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {t(tab.labelKey)}
            </Text>
            <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
              <Text style={[styles.countText, isActive && styles.countTextActive]}>
                {counts[tab.key]}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
    width: '100%'
  },
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    width: '100%',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    justifyContent: 'space-between',
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  tabLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: Colors.background,
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  countTextActive: {
    color: '#FFFFFF',
  },
});
