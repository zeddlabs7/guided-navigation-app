import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Path, Circle } from 'react-native-svg';
import type { GuidanceStatus } from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import { useGuidanceSets } from '@/hooks/useGuidanceSets';
import { deleteGuidanceSet } from '@/services/guidance';
import { AppHeader, FilterTabs, SearchInput, GuidanceSetCard, EmptyState } from '@/components/dashboard';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>{t('dashboard.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
          <Text style={styles.loadingText}>{t('dashboard.loading')}</Text>
        </View>
      ) : (
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

          <Pressable
            style={dashStyles.preferencesLink}
            onPress={() => router.push('/settings' as any)}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" stroke={Colors.primary} strokeWidth={1.5} />
              <Circle cx={12} cy={12} r={3} stroke={Colors.primary} strokeWidth={1.5} />
            </Svg>
            <Text style={dashStyles.preferencesText}>{t('dashboard.updatePreferences')}</Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18l6-6-6-6" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>

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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const dashStyles = StyleSheet.create({
  preferencesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  preferencesText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.primary,
  },
});

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
    flex: 1,
    justifyContent: 'center',
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
  },
  cardList: {
    paddingTop: Spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
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
    backgroundColor: Colors.primary,
  },
  retryText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
