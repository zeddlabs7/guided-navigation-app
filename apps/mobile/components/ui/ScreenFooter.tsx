import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';

/** Fallback when Android reports 0 bottom inset (3-button nav bar). */
const ANDROID_NAV_BAR_FALLBACK = 48;

export function getBottomInset(insets: { bottom: number }): number {
  if (insets.bottom > 0) return insets.bottom;
  if (Platform.OS === 'android') return ANDROID_NAV_BAR_FALLBACK;
  return 0;
}

/** Bottom padding for scroll content that sits above a fixed footer. */
export function useFooterScrollPadding(footerContentHeight = 56): number {
  const insets = useSafeAreaInsets();
  const bottomInset = getBottomInset(insets);
  return footerContentHeight + bottomInset + Spacing.md * 2;
}

interface ScreenFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenFooter({ children, style }: ScreenFooterProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(getBottomInset(insets), Spacing.md);

  return (
    <View style={[styles.footer, { paddingBottom: bottomPad }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
