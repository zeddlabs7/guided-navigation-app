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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { GuidanceStatus } from '@guidenav/types';
import { useAuth } from '@/contexts/AuthContext';
import { useGuidanceSets } from '@/hooks/useGuidanceSets';
import { deleteGuidanceSet } from '@/services/guidance';
import { AppHeader, FilterTabs, SearchInput, GuidanceSetCard, EmptyState } from '@/components/dashboard';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';

type FilterKey = 'all' | GuidanceStatus;

export default function DashboardScreen() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  const { guidanceSets, stepsMap, loading, error, refresh, counts } = useGuidanceSets(userId);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'ar'>('en');

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
        'Delete Address',
        `Are you sure you want to delete "${set?.title ?? 'this address'}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
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
                Alert.alert('Error', 'Failed to delete. Please try again.');
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
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        currentLanguage={currentLanguage}
        onLanguageToggle={() => setCurrentLanguage((l) => (l === 'en' ? 'ar' : 'en'))}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.text} />
          <Text style={styles.loadingText}>Loading your addresses...</Text>
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
            <Text style={styles.title}>My Addresses</Text>
            <Text style={styles.subtitle}>
              Create and manage step-by-step delivery addresses for couriers.
            </Text>
          </View>

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
