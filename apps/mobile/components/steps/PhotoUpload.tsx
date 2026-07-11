import { useCallback } from 'react';
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
import ImageCropPicker from 'react-native-image-crop-picker';
import { useTranslation } from 'react-i18next';

interface PhotoUploadProps {
  imageUri: string | null;
  uploading: boolean;
  onImageSelected: (uri: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const FIXED_ASPECT_RATIO = 4 / 5;
const CROP_WIDTH = 800;
const CROP_HEIGHT = 1000;

export function PhotoUpload({
  imageUri,
  uploading,
  onImageSelected,
  onRemove,
  disabled,
}: PhotoUploadProps) {
  const { t } = useTranslation();

  const handleResult = useCallback(
    (image: { path: string }) => {
      onImageSelected(image.path);
    },
    [onImageSelected],
  );

  const handleError = useCallback((err: any) => {
    if (err?.code === 'E_PICKER_CANCELLED') return;
    console.error('Image picker error:', err);
    Alert.alert(t('common.error'), t('steps.failedToPick'));
  }, []);

  const launchCamera = useCallback(async () => {
    try {
      const image = await ImageCropPicker.openCamera({
        width: CROP_WIDTH,
        height: CROP_HEIGHT,
        cropping: true,
        cropperToolbarTitle: t('steps.cropPhoto'),
        cropperChooseText: t('common.done'),
        cropperCancelText: t('common.cancel'),
        cropperChooseColor: '#ffffff',
        mediaType: 'photo',
        compressImageQuality: 0.7,
        freeStyleCropEnabled: false,
        hideBottomControls: true,
        enableRotationGesture: true,
        cropperActiveWidgetColor: '#2563eb',
        cropperStatusBarColor: '#000000',
        cropperToolbarColor: '#000000',
        cropperToolbarWidgetColor: '#ffffff',
        showCropGuidelines: false,
        showCropFrame: true,
      });
      handleResult(image);
    } catch (err: any) {
      handleError(err);
    }
  }, [handleResult, handleError, t]);

  const launchGallery = useCallback(async () => {
    try {
      const image = await ImageCropPicker.openPicker({
        width: CROP_WIDTH,
        height: CROP_HEIGHT,
        cropping: true,
        cropperToolbarTitle: t('steps.cropPhoto'),
        cropperChooseText: t('common.done'),
        cropperCancelText: t('common.cancel'),
        cropperChooseColor: '#ffffff',
        mediaType: 'photo',
        compressImageQuality: 0.7,
        freeStyleCropEnabled: false,
        hideBottomControls: true,
        enableRotationGesture: true,
        cropperActiveWidgetColor: '#2563eb',
        cropperStatusBarColor: '#000000',
        cropperToolbarColor: '#000000',
        cropperToolbarWidgetColor: '#ffffff',
        showCropGuidelines: false,
        showCropFrame: true,
      });
      handleResult(image);
    } catch (err: any) {
      handleError(err);
    }
  }, [handleResult, handleError, t]);

  const showPicker = useCallback(async () => {
    if (disabled) return;

    const options = [t('steps.camera'), t('steps.chooseGallery'), t('common.cancel')];
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
      Alert.alert(t('steps.uploadPhotoTitle'), t('steps.chooseSource'), [
        { text: t('steps.camera'), onPress: launchCamera },
        { text: t('steps.chooseGallery'), onPress: launchGallery },
        { text: t('common.cancel'), style: 'cancel' },
      ]);
    }
  }, [disabled, launchCamera, launchGallery, t]);

  if (imageUri) {
    return (
      <View style={styles.container}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{t('steps.uploadPhoto')}</Text>
          {!uploading && (
            <Pressable onPress={onRemove} disabled={disabled}>
              <Text style={styles.removeText}>{t('steps.remove')}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.privacyBanner}>
          <Text style={styles.privacyIcon}>🛡️</Text>
          <Text style={styles.privacyText}>
            {t('steps.privacyBanner')}
          </Text>
        </View>
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.previewImage, { aspectRatio: FIXED_ASPECT_RATIO }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={200}
          />
          {uploading && (
            <View style={styles.uploadIndicator}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.uploadIndicatorText}>{t('steps.uploading')}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('steps.uploadPhoto')}</Text>
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyIcon}>🛡️</Text>
        <Text style={styles.privacyText}>
          {t('steps.privacyBanner')}
        </Text>
      </View>
      <Pressable
        style={styles.uploadArea}
        onPress={showPicker}
        disabled={disabled}
      >
        <Text style={styles.uploadIcon}>📷</Text>
        <Text style={styles.uploadText}>{t('steps.tapToUpload')}</Text>
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
