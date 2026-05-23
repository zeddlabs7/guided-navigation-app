import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, FontSize, Spacing } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { firebaseUser, signOut, isAuthenticated, isLoading } = useAuth();

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Phone</Text>
            <Text style={styles.rowValue}>
              {firebaseUser?.phoneNumber ?? 'Not signed in'}
            </Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App Language</Text>
            <Text style={styles.rowValue}>English</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    marginBottom: Spacing.sm,
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowLabel: {
    fontSize: FontSize.base,
    color: Colors.text,
  },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  logoutButton: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.danger,
  },
});
