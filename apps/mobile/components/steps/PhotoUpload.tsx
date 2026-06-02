import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { validateImageFile } from '@guidenav/core';

function getImagePicker() {
  return require('expo-image-picker') as typeof import('expo-image-picker');
}

interface PhotoUploadProps {
  imageUri: string | null;
  uploading: boolean;
  onImageSelected: (uri: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function PhotoUpload({
  imageUri,
  uploading,
  onImageSelected,
  onRemove,
  disabled,
}: PhotoUploadProps) {
  const [imageAspect, setImageAspect] = useState(4 / 3);

  const showPicker = useCallback(async () => {
    if (disabled) return;

    const options = ['Camera', 'Choose from Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) launchCamera();
          else if (buttonIndex === 1) launchGallery();
        },
      );
    } else {
      Alert.alert('Upload Photo', 'Choose a source', [
        { text: 'Camera', onPress: launchCamera },
        { text: 'Choose from Gallery', onPress: launchGallery },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [disabled]);

  const launchCamera = useCallback(async () => {
    const picker = getImagePicker();
    const { status } = await picker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }

    const result = await picker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      handleAsset(result.assets[0]);
    }
  }, []);

  const launchGallery = useCallback(async () => {
    const picker = getImagePicker();
    const { status } = await picker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.');
      return;
    }

    const result = await picker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.5,
      allowsEditing: false,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      handleAsset(result.assets[0]);
    }
  }, []);

  const handleAsset = useCallback(
    (asset: any) => {
      const fileSize = asset.fileSize ?? 0;
      const width = asset.width ?? 0;
      const height = asset.height ?? 0;
      const mimeType = asset.mimeType ?? 'image/jpeg';

      const validation = validateImageFile({
        size: fileSize,
        type: mimeType,
        width,
        height,
      });

      if (!validation.valid) {
        Alert.alert('Invalid Image', validation.errors.join('\n'));
        return;
      }

      if (width > 0 && height > 0) {
        setImageAspect(width / height);
      }

      onImageSelected(asset.uri);
    },
    [onImageSelected],
  );

  if (imageUri) {
    return (
      <View style={styles.container}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Upload Photo (optional)</Text>
          <Pressable onPress={onRemove} disabled={disabled || uploading}>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
        <View style={styles.privacyBanner}>
          <Text style={styles.privacyIcon}>🛡️</Text>
          <Text style={styles.privacyText}>
            For privacy, avoid uploading photos with faces, license plates, or
            private documents.
          </Text>
        </View>
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.previewImage, { aspectRatio: imageAspect }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
          {uploading && (
            <View style={styles.uploadIndicator}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.uploadIndicatorText}>Uploading...</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Upload Photo (optional)</Text>
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>🛡️</Text>
        <Text style={styles.privacyText}>
          For privacy, avoid uploading photos with faces, license plates, or
          private documents.
        </Text>
      </View>
      <Pressable
        style={styles.uploadArea}
        onPress={showPicker}
        disabled={disabled}
      >
        <Text style={styles.uploadIcon}>📷</Text>
        <Text style={styles.uploadText}>Tap to take or choose a photo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#99a1af',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 10,
  },
  privacyIcon: {
    fontSize: 14,
  },
  privacyText: {
    fontSize: 12,
    color: '#4a5565',
    flex: 1,
    lineHeight: 16,
  },
  uploadArea: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadText: {
    fontSize: 14,
    color: '#4a5565',
  },
  previewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
  },
  uploadIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  uploadIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
});
