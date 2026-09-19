import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

export function AppText({ style, children, ...props }: TextProps) {
  const { isRTL } = useLanguage();

  return (
    <Text
      {...props}
      style={[
        isRTL && styles.rtl,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  rtl: {
    writingDirection: 'rtl',
    textAlign: 'left',
  },
});
