import { View, Image, StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { Colors, FontSize } from '@/constants/theme';

const logo = require('@/assets/logo-eng.png');

export function LanguageSplash() {
  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={styles.text}>Switching language...</Text>
      <Text style={styles.textAr}>...جارٍ تغيير اللغة</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    gap: 16,
  },
  logo: {
    height: 36,
    width: 130,
    marginBottom: 8,
  },
  text: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  textAr: {
    fontSize: FontSize.base,
    color: Colors.textMuted,
    fontWeight: '500',
    writingDirection: 'rtl',
  },
});
