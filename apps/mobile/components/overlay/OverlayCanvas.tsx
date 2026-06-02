import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import type { Overlay } from '@guidenav/types';
import { ArrowOverlay } from './ArrowOverlay';
import { MarkerDot, MarkerLabel, computeLabelPosition } from './MarkerOverlay';

export type EditorMode = 'view' | 'add-arrow' | 'add-marker' | 'select';

interface OverlayCanvasProps {
  imageUrl: string;
  overlays: Overlay[];
  selectedId: string | null;
  mode: EditorMode;
  onSelectOverlay: (id: string | null) => void;
  onAddOverlay: (x: number, y: number) => void;
  onUpdateOverlay: (id: string, updates: Partial<Overlay>) => void;
  onCanvasTap: (x: number, y: number) => void;
}

interface CanvasLayout {
  width: number;
  height: number;
  pageX: number;
  pageY: number;
}

const INITIAL_LAYOUT: CanvasLayout = { width: 0, height: 0, pageX: 0, pageY: 0 };

const HANDLE_SIZE = 32;
const HANDLE_OFFSET_SIDE = 28; // resize handle offset to the right
const HANDLE_OFFSET_BOTTOM = 28; // rotate handle offset below

export function OverlayCanvas({
  imageUrl,
  overlays,
  selectedId,
  mode,
  onSelectOverlay,
  onAddOverlay,
  onUpdateOverlay,
  onCanvasTap,
}: OverlayCanvasProps) {
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [imageAspect, setImageAspect] = useState(4 / 3);
  const canvasLayoutRef = useRef<CanvasLayout>(INITIAL_LAYOUT);
  const overlayLayerRef = useRef<View>(null);

  const syncCanvasLayout = useCallback(() => {
    overlayLayerRef.current?.measureInWindow((pageX, pageY, width, height) => {
      if (width <= 0 || height <= 0) return;
      canvasLayoutRef.current = { width, height, pageX, pageY };
      setImageLayout({ width, height });
    });
  }, []);

  const handleOverlayLayerLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      syncCanvasLayout();
    },
    [syncCanvasLayout],
  );

  const handleImageLoad = useCallback(
    (event: ImageLoadEventData) => {
      const { width, height } = event.source;
      if (width && height) {
        setImageAspect(width / height);
      }
      syncCanvasLayout();
    },
    [syncCanvasLayout],
  );

  const screenToNormalized = useCallback(
    (absX: number, absY: number, padding: number = 0) => {
      const { width, height, pageX, pageY } = canvasLayoutRef.current;
      if (width === 0 || height === 0) return null;
      const rawX = (absX - pageX) / width;
      const rawY = (absY - pageY) / height;
      return {
        x: Math.max(padding, Math.min(1 - padding, rawX)),
        y: Math.max(padding, Math.min(1 - padding, rawY)),
      };
    },
    [],
  );

  const screenToNormalizedForMarker = useCallback((absX: number, absY: number) => {
    const { width, height, pageX, pageY } = canvasLayoutRef.current;
    if (width === 0 || height === 0) return null;
    const markerRadius = 16;
    const paddingX = markerRadius / width;
    const paddingY = markerRadius / height;
    const rawX = (absX - pageX) / width;
    const rawY = (absY - pageY) / height;
    return {
      x: Math.max(paddingX, Math.min(1 - paddingX, rawX)),
      y: Math.max(paddingY, Math.min(1 - paddingY, rawY)),
    };
  }, []);

  const handleCanvasTapAt = useCallback(
    (absX: number, absY: number) => {
      if (mode === 'add-arrow') {
        const pos = screenToNormalized(absX, absY, 0.05);
        if (pos) onAddOverlay(pos.x, pos.y);
      } else if (mode === 'add-marker') {
        const pos = screenToNormalizedForMarker(absX, absY);
        if (pos) onCanvasTap(pos.x, pos.y);
      } else {
        onSelectOverlay(null);
      }
    },
    [mode, screenToNormalized, screenToNormalizedForMarker, onAddOverlay, onCanvasTap, onSelectOverlay],
  );

  const canvasTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd((event) => {
          handleCanvasTapAt(event.absoluteX, event.absoluteY);
        }),
    [handleCanvasTapAt],
  );

  const overlayInteractionEnabled = mode === 'view' || mode === 'select';

  return (
    <View style={styles.canvas}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { aspectRatio: imageAspect }]}
        contentFit="contain"
        cachePolicy="memory-disk"
        onLoad={handleImageLoad}
      />

      <View
        ref={overlayLayerRef}
        style={styles.overlayLayer}
        pointerEvents="box-none"
        onLayout={handleOverlayLayerLayout}
      >
        <GestureDetector gesture={canvasTapGesture}>
          <View style={styles.canvasTapCatcher} />
        </GestureDetector>

        {overlays.map((overlay) => (
          <OverlayItem
            key={overlay.id}
            overlay={overlay}
            selectedId={selectedId}
            imageLayout={imageLayout}
            interactive={overlayInteractionEnabled}
            canvasLayoutRef={canvasLayoutRef}
            onPress={onSelectOverlay}
            onUpdateOverlay={onUpdateOverlay}
          />
        ))}
      </View>

      {(mode === 'add-arrow' || mode === 'add-marker') && (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>
            {mode === 'add-arrow' ? 'Tap to place arrow' : 'Tap to place marker'}
          </Text>
        </View>
      )}
    </View>
  );
}

interface OverlayItemProps {
  overlay: Overlay;
  selectedId: string | null;
  imageLayout: { width: number; height: number };
  interactive: boolean;
  canvasLayoutRef: React.RefObject<CanvasLayout>;
  onPress: (id: string | null) => void;
  onUpdateOverlay: (id: string, updates: Partial<Overlay>) => void;
}

function OverlayItem({
  overlay,
  selectedId,
  imageLayout,
  interactive,
  canvasLayoutRef,
  onPress,
  onUpdateOverlay,
}: OverlayItemProps) {
  const isSelected = selectedId === overlay.id;
  const isArrow = overlay.type === 'arrow';

  const overlayRef = useRef(overlay);
  overlayRef.current = overlay;

  const dragStartRef = useRef({ overlayX: 0, overlayY: 0 });
  const scaleStartRef = useRef(1);
  const rotationStartRef = useRef(0);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .onEnd(() => {
          onPress(overlayRef.current.id);
        }),
    [onPress],
  );

  // One-finger pan to move (only when selected)
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSelected)
        .minPointers(1)
        .maxPointers(1)
        .minDistance(2)
        .runOnJS(true)
        .onStart(() => {
          const current = overlayRef.current;
          dragStartRef.current = { overlayX: current.x, overlayY: current.y };
        })
        .onUpdate((event) => {
          const { width, height } = imageLayout;
          if (width === 0 || height === 0) return;

          const current = overlayRef.current;
          const deltaX = event.translationX / width;
          const deltaY = event.translationY / height;
          const newX = dragStartRef.current.overlayX + deltaX;
          const newY = dragStartRef.current.overlayY + deltaY;

          if (current.type === 'marker') {
            const markerRadius = 16;
            const paddingX = markerRadius / width;
            const paddingY = markerRadius / height;
            onUpdateOverlay(current.id, {
              x: Math.max(paddingX, Math.min(1 - paddingX, newX)),
              y: Math.max(paddingY, Math.min(1 - paddingY, newY)),
            });
          } else {
            onUpdateOverlay(current.id, {
              x: Math.max(0.02, Math.min(0.98, newX)),
              y: Math.max(0.02, Math.min(0.98, newY)),
            });
          }
        }),
    [isSelected, imageLayout, onUpdateOverlay],
  );

  // Resize handle: drag vertically to scale
  const resizeHandlePan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSelected && isArrow)
        .runOnJS(true)
        .onStart(() => {
          scaleStartRef.current = overlayRef.current.scale;
        })
        .onUpdate((event) => {
          // Drag up = bigger, drag down = smaller
          const delta = -event.translationY / 80;
          const newScale = Math.max(0.5, Math.min(3.5, scaleStartRef.current + delta));
          onUpdateOverlay(overlayRef.current.id, { scale: newScale });
        }),
    [isSelected, isArrow, onUpdateOverlay],
  );

  // Rotation handle: drag to rotate (relative — no jump on start)
  const initialAngleRef = useRef(0);
  const rotationHandlePan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isSelected && isArrow)
        .runOnJS(true)
        .onStart((event) => {
          rotationStartRef.current = overlayRef.current.rotation ?? 0;
          const layout = canvasLayoutRef.current;
          if (!layout || layout.width === 0) return;
          const current = overlayRef.current;
          const centerPixelX = current.x * layout.width + layout.pageX;
          const centerPixelY = current.y * layout.height + layout.pageY;
          const dx = event.absoluteX - centerPixelX;
          const dy = event.absoluteY - centerPixelY;
          initialAngleRef.current = Math.atan2(dx, -dy) * (180 / Math.PI);
        })
        .onUpdate((event) => {
          const layout = canvasLayoutRef.current;
          if (!layout || layout.width === 0 || layout.height === 0) return;

          const current = overlayRef.current;
          const centerPixelX = current.x * layout.width + layout.pageX;
          const centerPixelY = current.y * layout.height + layout.pageY;

          const dx = event.absoluteX - centerPixelX;
          const dy = event.absoluteY - centerPixelY;
          const currentAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
          const delta = currentAngle - initialAngleRef.current;

          onUpdateOverlay(current.id, { rotation: rotationStartRef.current + delta });
        }),
    [isSelected, isArrow, canvasLayoutRef, onUpdateOverlay],
  );

  const composedGesture = useMemo(() => {
    return Gesture.Exclusive(panGesture, tapGesture);
  }, [panGesture, tapGesture]);

  const pixelX = overlay.x * imageLayout.width;
  const pixelY = overlay.y * imageLayout.height;

  const hitSize = isArrow ? (isSelected ? 100 : 80) : 44;

  if (isArrow) {
    return (
      <>
        {interactive && (
          <GestureDetector gesture={composedGesture}>
            <View
              style={[
                styles.hitTarget,
                {
                  width: hitSize,
                  height: hitSize,
                  left: pixelX - hitSize / 2,
                  top: pixelY - hitSize / 2,
                },
              ]}
            />
          </GestureDetector>
        )}

        <View
          style={[
            styles.arrowVisualContainer,
            {
              left: pixelX,
              top: pixelY,
              transform: [{ translateX: '-50%' as const }, { translateY: '-50%' as const }],
            },
          ]}
          pointerEvents="none"
        >
          <ArrowOverlay
            scale={overlay.scale}
            rotation={overlay.rotation ?? 0}
            arrowDirection={overlay.arrowDirection || 'up-down'}
            selected={isSelected}
          />
        </View>

        {/* Resize handle on the right, Rotate handle below (only when selected) */}
        {isSelected && interactive && (
          <>
            <GestureDetector gesture={resizeHandlePan}>
              <View
                style={[
                  styles.handleBtn,
                  {
                    position: 'absolute',
                    left: pixelX + HANDLE_OFFSET_SIDE,
                    top: pixelY - HANDLE_SIZE / 2,
                    zIndex: 10,
                  },
                ]}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                    stroke="#92400e"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </GestureDetector>
            <GestureDetector gesture={rotationHandlePan}>
              <View
                style={[
                  styles.handleBtn,
                  {
                    position: 'absolute',
                    left: pixelX - HANDLE_SIZE / 2,
                    top: pixelY + HANDLE_OFFSET_BOTTOM,
                    zIndex: 10,
                  },
                ]}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M1 4v6h6M23 20v-6h-6"
                    stroke="#92400e"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
                    stroke="#92400e"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </GestureDetector>
          </>
        )}
      </>
    );
  }

  // Marker rendering
  const labelPosition = computeLabelPosition(overlay.x, overlay.y);
  const hasLabel = !!overlay.label;
  const labelOffset = 12;
  let labelLeft = pixelX;
  let labelTop = pixelY;
  if (labelPosition === 'bottom') labelTop = pixelY + labelOffset;
  else if (labelPosition === 'top') labelTop = pixelY - labelOffset;
  else if (labelPosition === 'right') labelLeft = pixelX + labelOffset;
  else if (labelPosition === 'left') labelLeft = pixelX - labelOffset;

  const labelExtension = hasLabel ? 80 : 0;
  let markerHitW = hitSize;
  let markerHitH = hitSize;
  let markerHitLeft = pixelX - hitSize / 2;
  let markerHitTop = pixelY - hitSize / 2;

  if (hasLabel) {
    if (labelPosition === 'bottom') markerHitH += labelExtension;
    else if (labelPosition === 'top') { markerHitH += labelExtension; markerHitTop -= labelExtension; }
    else if (labelPosition === 'right') markerHitW += labelExtension;
    else if (labelPosition === 'left') { markerHitW += labelExtension; markerHitLeft -= labelExtension; }
  }

  const markerGesture = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  return (
    <>
      {interactive && (
        <GestureDetector gesture={markerGesture}>
          <View
            style={[
              styles.hitTarget,
              {
                width: markerHitW,
                height: markerHitH,
                left: markerHitLeft,
                top: markerHitTop,
              },
            ]}
          />
        </GestureDetector>
      )}

      <View
        style={[styles.markerVisualContainer, { left: pixelX - 16, top: pixelY - 16 }]}
        pointerEvents="none"
      >
        <MarkerDot selected={isSelected} />
      </View>

      {hasLabel && overlay.label && (
        <View
          style={[
            styles.labelVisualContainer,
            { left: labelLeft, top: labelTop },
            labelPosition === 'bottom' && styles.labelAlignBottom,
            labelPosition === 'top' && styles.labelAlignTop,
            labelPosition === 'left' && styles.labelAlignLeft,
            labelPosition === 'right' && styles.labelAlignRight,
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
  canvas: {
    position: 'relative',
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
  },
  image: {
    width: '100%',
  },
  overlayLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  canvasTapCatcher: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  arrowVisualContainer: {
    position: 'absolute',
    zIndex: 2,
  },
  markerVisualContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  labelVisualContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  labelAlignBottom: {
    transform: [{ translateX: '-50%' }],
  },
  labelAlignTop: {
    transform: [{ translateX: '-50%' }, { translateY: '-100%' }],
  },
  labelAlignLeft: {
    transform: [{ translateX: '-100%' }, { translateY: '-50%' }],
  },
  labelAlignRight: {
    transform: [{ translateY: '-50%' }],
  },
  hitTarget: {
    position: 'absolute',
    zIndex: 5,
  },
  hint: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
  },
  hintText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  handleBtn: {
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    backgroundColor: 'rgba(255, 222, 83, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
