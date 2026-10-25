import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useTranslation } from 'react-i18next';
import { Colors, FontSize, Spacing, BorderRadius } from '@/constants/theme';
import { PhotoUpload } from './PhotoUpload';
import { OverlayEditor } from '@/components/overlay';
import type { Overlay } from '@guidenav/types';

type UploadStatus = 'idle' | 'uploading' | 'failed';

interface PhotoEditorWithUploadProps {
  imageUri: string | null;
  overlays: Overlay[];
  uploading: boolean;
  uploadFailed?: boolean;
  saving?: boolean;
  label?: string;
  onImageSelected: (uri: string) => void;
  onRemove: () => void;
  onUpdateOverlays: (overlays: Overlay[]) => void;
  onRetryUpload?: () => void;
}

export function PhotoEditorWithUpload({
  imageUri,
  overlays,
  uploading,
  uploadFailed = false,
  saving = false,
  label,
  onImageSelected,
  onRemove,
  onUpdateOverlays,
  onRetryUpload,
}: PhotoEditorWithUploadProps) {
  const { t } = useTranslation();

  const uploadStatus: UploadStatus = uploading
    ? 'uploading'
    : uploadFailed
      ? 'failed'
      : 'idle';

  if (!imageUri) {
    return (
      <PhotoUpload
        imageUri={null}
        uploading={false}
        onImageSelected={onImageSelected}
        onRemove={onRemove}
        disabled={saving}
        label={label}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label ?? t('steps.uploadPhoto')}</Text>
        {!uploading && (
          <Pressable onPress={onRemove} disabled={saving}>
            <Text style={styles.removeText}>{t('steps.remove')}</Text>
          </Pressable>
        )}
      </View>
      <OverlayEditor
        imageUrl={imageUri}
        overlays={overlays}
        readonly={saving}
        uploadStatus={uploadStatus}
        onUpdateOverlays={onUpdateOverlays}
        onRetryUpload={onRetryUpload}
      />
      {uploading && (
        <View style={styles.uploadBadge}>
          <ActivityIndicator color="#ffffff" size="small" />
          <Text style={styles.uploadBadgeText}>{t('steps.uploading')}</Text>
        </View>
      )}
      {uploadFailed && !uploading && (
        <View style={styles.failedBanner}>
          <Text style={styles.failedText}>{t('steps.uploadFailed')}</Text>
          {onRetryUpload && (
            <Pressable style={styles.retryButton} onPress={onRetryUpload}>
              <Text style={styles.retryButtonText}>{t('steps.retryUpload')}</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    position: 'relative',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  removeText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '500',
  },
  uploadBadge: {
    position: 'absolute',
    top: 42,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  uploadBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
    color: '#ffffff',
  },
  failedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: 6,
  },
  failedText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: Colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
});
