import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Pressable,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
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
  const imagePageOffset = useRef({ x: 0, y: 0 });
  const overlayTappedRef = useRef(false);

  const handleImageLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setImageLayout({ width, height });
    setTimeout(remeasure, 50);
  }, [remeasure]);

  const handleImageLoad = useCallback((event: any) => {
    const source = event?.nativeEvent?.source;
    if (source?.width && source?.height) {
      setImageAspect(source.width / source.height);
    }
  }, []);

  const canvasViewRef = useRef<View>(null);

  const remeasure = useCallback(() => {
    canvasViewRef.current?.measureInWindow((px, py) => {
      imagePageOffset.current = { x: px, y: py };
    });
  }, []);

  const screenToNormalized = useCallback(
    (absX: number, absY: number, padding: number = 0) => {
      const { width, height } = imageLayout;
      if (width === 0 || height === 0) return null;
      const rawX = (absX - imagePageOffset.current.x) / width;
      const rawY = (absY - imagePageOffset.current.y) / height;
      return {
        x: Math.max(padding, Math.min(1 - padding, rawX)),
        y: Math.max(padding, Math.min(1 - padding, rawY)),
      };
    },
    [imageLayout],
  );

  const screenToNormalizedForMarker = useCallback(
    (absX: number, absY: number) => {
      const { width, height } = imageLayout;
      if (width === 0 || height === 0) return null;
      const markerRadius = 16;
      const paddingX = markerRadius / width;
      const paddingY = markerRadius / height;
      const rawX = (absX - imagePageOffset.current.x) / width;
      const rawY = (absY - imagePageOffset.current.y) / height;
      return {
        x: Math.max(paddingX, Math.min(1 - paddingX, rawX)),
        y: Math.max(paddingY, Math.min(1 - paddingY, rawY)),
      };
    },
    [imageLayout],
  );

  // Handle tap on the canvas background (not on an overlay)
  const handleCanvasPress = useCallback(
    (event: GestureResponderEvent) => {
      // If an overlay was just tapped, ignore the canvas tap
      if (overlayTappedRef.current) {
        overlayTappedRef.current = false;
        return;
      }

      const { pageX, pageY } = event.nativeEvent;
      if (mode === 'add-arrow') {
        const pos = screenToNormalized(pageX, pageY, 0.05);
        if (pos) onAddOverlay(pos.x, pos.y);
      } else if (mode === 'add-marker') {
        const pos = screenToNormalizedForMarker(pageX, pageY);
        if (pos) onCanvasTap(pos.x, pos.y);
      } else {
        onSelectOverlay(null);
      }
    },
    [mode, screenToNormalized, screenToNormalizedForMarker, onAddOverlay, onCanvasTap, onSelectOverlay],
  );

  // Handle tap on a specific overlay
  const handleOverlayPress = useCallback(
    (id: string) => {
      overlayTappedRef.current = true;
      onSelectOverlay(id);
    },
    [onSelectOverlay],
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <Pressable
        ref={canvasViewRef}
        style={styles.canvas}
        onPress={handleCanvasPress}
      >
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { aspectRatio: imageAspect }]}
          resizeMode="contain"
          onLayout={handleImageLayout}
          onLoad={handleImageLoad}
        />

        <View style={styles.overlayLayer} pointerEvents="box-none">
          {overlays.map((overlay) => (
            <OverlayItem
              key={overlay.id}
              overlay={overlay}
              selectedId={selectedId}
              imageLayout={imageLayout}
              imagePageOffset={imagePageOffset}
              onPress={handleOverlayPress}
              onUpdateOverlay={onUpdateOverlay}
            />
          ))}
        </View>

        {(mode === 'add-arrow' || mode === 'add-marker') && (
          <View style={styles.hint} pointerEvents="none">
            <Text style={styles.hintText}>
              {mode === 'add-arrow'
                ? 'Tap to place arrow'
                : 'Tap to place marker'}
            </Text>
          </View>
        )}
      </Pressable>
    </GestureHandlerRootView>
  );
}

// --- Per-overlay item with properly scoped gestures ---

interface OverlayItemProps {
  overlay: Overlay;
  selectedId: string | null;
  imageLayout: { width: number; height: number };
  imagePageOffset: React.MutableRefObject<{ x: number; y: number }>;
  onPress: (id: string) => void;
  onUpdateOverlay: (id: string, updates: Partial<Overlay>) => void;
}

function OverlayItem({
  overlay,
  selectedId,
  imageLayout,
  imagePageOffset,
  onPress,
  onUpdateOverlay,
}: OverlayItemProps) {
  const isSelected = selectedId === overlay.id;
  const isArrow = overlay.type === 'arrow';
  const isMarker = overlay.type === 'marker';

  const dragStartRef = useRef({ overlayX: 0, overlayY: 0 });

  // Pan gesture to move the overlay (only when selected)
  const panGesture = Gesture.Pan()
    .enabled(isSelected)
    .runOnJS(true)
    .onStart(() => {
      dragStartRef.current = {
        overlayX: overlay.x,
        overlayY: overlay.y,
      };
    })
    .onUpdate((event) => {
      const deltaX = event.translationX / imageLayout.width;
      const deltaY = event.translationY / imageLayout.height;
      const newX = dragStartRef.current.overlayX + deltaX;
      const newY = dragStartRef.current.overlayY + deltaY;

      let pos;
      if (isMarker) {
        const markerRadius = 16;
        const paddingX = markerRadius / imageLayout.width;
        const paddingY = markerRadius / imageLayout.height;
        pos = {
          x: Math.max(paddingX, Math.min(1 - paddingX, newX)),
          y: Math.max(paddingY, Math.min(1 - paddingY, newY)),
        };
      } else {
        pos = {
          x: Math.max(0.02, Math.min(0.98, newX)),
          y: Math.max(0.02, Math.min(0.98, newY)),
        };
      }
      onUpdateOverlay(overlay.id, { x: pos.x, y: pos.y });
    });

  // The overlay position in pixels
  const pixelX = overlay.x * imageLayout.width;
  const pixelY = overlay.y * imageLayout.height;

  // Hit target for the overlay: centered on its position
  // Arrow: ~80x100 hit area (visual is ~60x80 at scale=1, but scaled)
  // Marker: 44x44 (slightly bigger than the 32px dot for easier tapping)
  const hitSize = isArrow ? 80 : 44;

  if (isArrow) {
    return (
      <>
        {/* Arrow visual + handles — positioned absolutely, handles interactive inside transform */}
        <View
          style={[
            styles.arrowVisualContainer,
            {
              left: pixelX,
              top: pixelY,
              transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
            },
          ]}
          pointerEvents="box-none"
        >
          <ArrowOverlay
            scale={overlay.scale}
            rotation={overlay.rotation ?? 0}
            arrowDirection={overlay.arrowDirection || 'up-down'}
            selected={isSelected}
            renderHandles={
              isSelected
                ? () => (
                    <ArrowHandles
                      overlay={overlay}
                      pixelX={pixelX}
                      pixelY={pixelY}
                      imagePageOffset={imagePageOffset}
                      onUpdateOverlay={onUpdateOverlay}
                    />
                  )
                : undefined
            }
          />
        </View>

        {/* Arrow hit target — handles tap and drag */}
        <GestureDetector gesture={panGesture}>
          <Pressable
            onPress={() => onPress(overlay.id)}
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
      </>
    );
  }

  // Marker
  const labelPosition = computeLabelPosition(overlay.x, overlay.y);
  const hasLabel = !!overlay.label;

  // Compute label pixel position — offset from dot center based on direction
  // Dot is 32px, label attaches at the edge with a small overlap
  const labelOffset = 12; // gap between dot edge and label start (16 dot radius - 4 overlap)
  let labelLeft = pixelX;
  let labelTop = pixelY;
  if (labelPosition === 'bottom') {
    labelTop = pixelY + labelOffset;
  } else if (labelPosition === 'top') {
    labelTop = pixelY - labelOffset;
  } else if (labelPosition === 'right') {
    labelLeft = pixelX + labelOffset;
  } else if (labelPosition === 'left') {
    labelLeft = pixelX - labelOffset;
  }

  // Hit target extends to cover both dot and label
  const labelExtension = hasLabel ? 80 : 0;
  let markerHitW = hitSize;
  let markerHitH = hitSize;
  let markerHitLeft = pixelX - hitSize / 2;
  let markerHitTop = pixelY - hitSize / 2;

  if (hasLabel) {
    if (labelPosition === 'bottom') {
      markerHitH += labelExtension;
    } else if (labelPosition === 'top') {
      markerHitH += labelExtension;
      markerHitTop -= labelExtension;
    } else if (labelPosition === 'right') {
      markerHitW += labelExtension;
    } else if (labelPosition === 'left') {
      markerHitW += labelExtension;
      markerHitLeft -= labelExtension;
    }
  }

  return (
    <>
      {/* Marker dot — positioned at center */}
      <View
        style={[
          styles.markerVisualContainer,
          {
            left: pixelX - 16,
            top: pixelY - 16,
          },
        ]}
        pointerEvents="none"
      >
        <MarkerDot selected={isSelected} />
      </View>

      {/* Label — positioned as separate element, no parent width constraints */}
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

      {/* Marker hit target — extends to cover label */}
      <GestureDetector gesture={panGesture}>
        <Pressable
          onPress={() => onPress(overlay.id)}
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
    </>
  );
}

// --- Scale / Rotation handles for arrows ---

interface ArrowHandlesProps {
  overlay: Overlay;
  pixelX: number;
  pixelY: number;
  imagePageOffset: React.MutableRefObject<{ x: number; y: number }>;
  onUpdateOverlay: (id: string, updates: Partial<Overlay>) => void;
}

function ArrowHandles({
  overlay,
  pixelX,
  pixelY,
  imagePageOffset,
  onUpdateOverlay,
}: ArrowHandlesProps) {
  const scaleStartRef = useRef({ startScale: 0 });
  const rotationStartRef = useRef({
    startAngle: 0,
    startRotation: 0,
    centerAbsX: 0,
    centerAbsY: 0,
  });

  const scaleGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart(() => {
      scaleStartRef.current = { startScale: overlay.scale };
    })
    .onUpdate((event) => {
      const scaleDelta = event.translationY / 100;
      const newScale = Math.max(
        0.4,
        Math.min(2.5, scaleStartRef.current.startScale + scaleDelta),
      );
      onUpdateOverlay(overlay.id, { scale: newScale });
    });

  const rotationGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((event) => {
      const centerAbsX = imagePageOffset.current.x + pixelX;
      const centerAbsY = imagePageOffset.current.y + pixelY;
      const startAngle = Math.atan2(
        event.absoluteY - centerAbsY,
        event.absoluteX - centerAbsX,
      );
      rotationStartRef.current = {
        centerAbsX,
        centerAbsY,
        startAngle,
        startRotation: overlay.rotation ?? 0,
      };
    })
    .onUpdate((event) => {
      const { centerAbsX, centerAbsY, startAngle, startRotation } = rotationStartRef.current;
      const currentAngle = Math.atan2(
        event.absoluteY - centerAbsY,
        event.absoluteX - centerAbsX,
      );
      const angleDelta = (currentAngle - startAngle) * (180 / Math.PI);
      onUpdateOverlay(overlay.id, { rotation: startRotation + angleDelta });
    });

  // Handles are rendered inside the arrow's transformed container.
  // Positions match PWA exactly: rotation top: -32, scale bottom: -28.
  // They rotate and scale with the arrow automatically.
  return (
    <>
      {/* Rotation handle — above the arrow */}
      <GestureDetector gesture={rotationGesture}>
        <View style={styles.rotationHandle}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M1 4V10H7"
              stroke="#C8A000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M3.51 15C4.15 16.82 5.36 18.38 6.96 19.45C8.56 20.53 10.45 21.06 12.37 20.98C14.29 20.89 16.14 20.19 17.66 18.97C19.17 17.76 20.27 16.09 20.79 14.2C21.32 12.32 21.25 10.32 20.6 8.48C19.95 6.64 18.75 5.06 17.17 3.96C15.59 2.86 13.72 2.29 11.81 2.34C9.89 2.38 8.05 3.03 6.51 4.19L1 9"
              stroke="#C8A000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </GestureDetector>

      {/* Scale handle — below the arrow */}
      <GestureDetector gesture={scaleGesture}>
        <View style={styles.scaleHandle}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 21L15 15M21 21V15M21 21H15"
              stroke="#C8A000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M3 3L9 9M3 3V9M3 3H9"
              stroke="#C8A000"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </GestureDetector>
    </>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    width: '100%',
  },
  canvas: {
    position: 'relative',
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
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
  arrowVisualContainer: {
    position: 'absolute',
    zIndex: 1,
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
  rotationHandle: {
    position: 'absolute',
    top: -32,
    alignSelf: 'center',
    width: 28,
    height: 28,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#C8A000',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  scaleHandle: {
    position: 'absolute',
    bottom: -28,
    alignSelf: 'center',
    width: 28,
    height: 28,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#C8A000',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
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
});
