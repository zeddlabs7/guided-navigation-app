import { Alert, Linking, Platform } from 'react-native';

async function openWhatsAppUrl(url: string): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Linking.openURL(url);
      return;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'WhatsApp not available',
      'Could not open WhatsApp. Please make sure it is installed, then try again.',
    );
  }
}

export async function openWhatsAppShare(message: string): Promise<void> {
  const nativeUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
  await openWhatsAppUrl(nativeUrl);
}

export async function openWhatsAppShareToNumber(phone: string, message: string): Promise<void> {
  const digits = phone.replace(/[^\d]/g, '');
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  await openWhatsAppUrl(url);
}
