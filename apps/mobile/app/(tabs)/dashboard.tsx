import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { GuidanceStatus } from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import { useGuidanceSets } from '@/hooks/useGuidanceSets';
import { deleteGuidanceSet } from '@/services/guidance';
import { AppHeader, FilterTabs, SearchInput, GuidanceSetCard, EmptyState, ContactPreferenceToggle } from '@/components/dashboard';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { SupportFAB } from '@/components/ui/SupportFAB';
import { AppText as Text } from '@/components/ui/AppText';

type FilterKey = 'all' | GuidanceStatus;

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  const { guidanceSets, stepsMap, loading, error, refresh, counts } = useGuidanceSets(userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const optimisticDeletedRef = useRef<Set<string>>(new Set());

  const filteredSets = useMemo(() => {
    let result = guidanceSets.filter(
      (set) => !optimisticDeletedRef.current.has(set.id),
    );

    if (activeFilter !== 'all') {
      result = result.filter((set) => set.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((set) => set.title.toLowerCase().includes(query));
    }

    return result;
  }, [guidanceSets, activeFilter, searchQuery]);

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/guidance/${id}/edit`);
    },
    [router],
  );

  const handleShare = useCallback(
    (id: string) => {
      router.push(`/guidance/${id}/share`);
    },
    [router],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const set = guidanceSets.find((s) => s.id === id);
      Alert.alert(
        t('dashboard.deleteTitle'),
        t('dashboard.deleteMessage', { title: set?.title ?? 'this address' }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: async () => {
              optimisticDeletedRef.current.add(id);
              setDeletingIds((prev) => new Set(prev).add(id));

              try {
                await deleteGuidanceSet(id);
              } catch {
                optimisticDeletedRef.current.delete(id);
                setDeletingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(id);
                  return next;
                });
                Alert.alert(t('common.error'), t('dashboard.deleteError'));
              }
            },
          },
        ],
      );
    },
    [guidanceSets],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.text}
          />
        }
      >
        <View style={styles.pageTitle}>
          <Text style={styles.title}>{t('dashboard.title')}</Text>
          <Text style={styles.subtitle}>
            {t('dashboard.subtitle')}
          </Text>
        </View>

        <ContactPreferenceToggle />

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>{t('dashboard.errorTitle')}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.text} />
            <Text style={styles.loadingText}>{t('dashboard.loading')}</Text>
          </View>
        ) : (
          <>
            <SearchInput value={searchQuery} onChangeText={setSearchQuery} />
            <FilterTabs
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
            />

            <View style={styles.cardList}>
              {filteredSets.length === 0 ? (
                <EmptyState hasSearchQuery={searchQuery.trim().length > 0} />
              ) : (
                filteredSets.map((item) => (
                  <GuidanceSetCard
                    key={item.id}
                    guidanceSet={item}
                    steps={stepsMap.get(item.id) ?? []}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onShare={handleShare}
                    isDeleting={deletingIds.has(item.id)}
                  />
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      <SupportFAB />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  pageTitle: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  loadingContainer: {
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.base,
    color: Colors.textMuted,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
    flexGrow: 1,
  },
  cardList: {
    paddingTop: Spacing.xs,
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.button,
  },
  retryText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
