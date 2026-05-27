import { Alert, Linking, Platform } from 'react-native';

export async function openWhatsAppShare(message: string): Promise<void> {
  const nativeUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

  try {
    if (Platform.OS === 'android') {
      // Skip canOpenURL — on Android 11+ it often returns false even when WhatsApp is installed.
      await Linking.openURL(nativeUrl);
      return;
    }

    const canOpen = await Linking.canOpenURL(nativeUrl);
    if (canOpen) {
      await Linking.openURL(nativeUrl);
      return;
    }

    // iOS: try opening anyway in case canOpenURL was overly restrictive
    await Linking.openURL(nativeUrl);
  } catch {
    Alert.alert(
      'WhatsApp not available',
      'Could not open WhatsApp. Please make sure it is installed, then try again.',
    );
  }
}
