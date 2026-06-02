import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import type { Overlay } from '@guidenav/types';
import { ArrowOverlay } from './ArrowOverlay';
import { MarkerDot, MarkerLabel, computeLabelPosition } from './MarkerOverlay';
import { OverlayEditorModal } from './OverlayEditorModal';

interface OverlayEditorProps {
  imageUrl: string;
  overlays: Overlay[];
  readonly?: boolean;
  userId?: string;
  onUpdateOverlays: (overlays: Overlay[]) => void;
}

export function OverlayEditor({
  imageUrl,
  overlays,
  readonly = false,
  userId = 'dev-user-placeholder',
  onUpdateOverlays,
}: OverlayEditorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpenEditor = useCallback(() => {
    if (readonly) return;
    setModalVisible(true);
  }, [readonly]);

  const handleSave = useCallback(
    (updatedOverlays: Overlay[]) => {
      onUpdateOverlays(updatedOverlays);
      setModalVisible(false);
    },
    [onUpdateOverlays],
  );

  const handleCancel = useCallback(() => {
    setModalVisible(false);
  }, []);

  return (
    <View style={styles.container}>
      {/* Inline preview - non-interactive thumbnail with overlays */}
      <Pressable onPress={handleOpenEditor} disabled={readonly} style={styles.previewWrapper}>
        <ImageWithOverlays imageUrl={imageUrl} overlays={overlays} />

        {!readonly && (
          <View style={styles.editBadge}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.editBadgeText}>
              {overlays.length > 0 ? 'Edit Overlays' : 'Add Overlays'}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Full-screen editor modal */}
      <OverlayEditorModal
        visible={modalVisible}
        imageUrl={imageUrl}
        overlays={overlays}
        userId={userId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </View>
  );
}

/**
 * Static (non-interactive) rendering of image + overlays for the preview thumbnail.
 */
function ImageWithOverlays({ imageUrl, overlays }: { imageUrl: string; overlays: Overlay[] }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [imageAspect, setImageAspect] = useState(4 / 3);

  const handleImageLoad = useCallback(
    (event: ImageLoadEventData) => {
      const { width, height } = event.source;
      if (width && height) {
        setImageAspect(width / height);
      }
    },
    [],
  );

  return (
    <View
      style={styles.previewCanvas}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={[styles.previewImage, { aspectRatio: imageAspect }]}
        contentFit="contain"
        cachePolicy="memory-disk"
        transition={200}
        onLoad={handleImageLoad}
      />

      {layout.width > 0 &&
        overlays.map((overlay) => (
          <PreviewOverlayItem key={overlay.id} overlay={overlay} layout={layout} />
        ))}
    </View>
  );
}

function PreviewOverlayItem({
  overlay,
  layout,
}: {
  overlay: Overlay;
  layout: { width: number; height: number };
}) {
  const pixelX = overlay.x * layout.width;
  const pixelY = overlay.y * layout.height;

  if (overlay.type === 'arrow') {
    return (
      <View
        style={[
          styles.previewOverlay,
          {
            left: pixelX,
            top: pixelY,
            transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
          },
        ]}
        pointerEvents="none"
      >
        <ArrowOverlay
          scale={overlay.scale * 0.7}
          rotation={overlay.rotation ?? 0}
          arrowDirection={overlay.arrowDirection || 'up-down'}
          selected={false}
        />
      </View>
    );
  }

  const labelPosition = computeLabelPosition(overlay.x, overlay.y);
  return (
    <>
      <View
        style={[styles.previewOverlay, { left: pixelX - 16, top: pixelY - 16 }]}
        pointerEvents="none"
      >
        <MarkerDot selected={false} />
      </View>
      {overlay.label && (
        <View
          style={[
            styles.previewOverlay,
            { left: pixelX, top: pixelY + 10 },
            { transform: [{ translateX: '-50%' }] },
          ]}
          pointerEvents="none"
        >
          <MarkerLabel label={overlay.label} position={labelPosition} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  previewWrapper: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewCanvas: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
  },
  editBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  editBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
