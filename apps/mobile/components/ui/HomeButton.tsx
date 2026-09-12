import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, BorderRadius } from '@/constants/theme';

interface HomeButtonProps {
  /** Show with text label (full pill) or icon-only (compact pill) */
  showLabel?: boolean;
  onPress?: () => void;
}

export function HomeButton({ showLabel = false, onPress }: HomeButtonProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = onPress ?? (() => router.replace('/(tabs)/dashboard'));

  return (
    <Pressable
      style={showLabel ? styles.prominentButton : styles.iconButton}
      onPress={handlePress}
      hitSlop={8}
    >
      <Svg width={showLabel ? 20 : 16} height={showLabel ? 20 : 16} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M9 22V12H15V22"
          stroke="#ffffff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      {showLabel && <Text style={styles.label}>{t('preview.goHome')}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  prominentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
});
