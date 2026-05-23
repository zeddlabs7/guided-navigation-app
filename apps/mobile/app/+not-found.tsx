import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, FontSize, Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The screen you're looking for doesn't exist.
        </Text>
        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(tabs)/dashboard')}
        >
          <Text style={styles.buttonText}>Go to Dashboard</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  code: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.border,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: Colors.surface,
  },
});
