import { View, Image, StyleSheet } from 'react-native';
import type { Overlay, ArrowDirection } from '@guidenav/types';
import { Colors, BorderRadius } from '@/constants/theme';
import Svg, { Path } from 'react-native-svg';

const arrowCurvedLeft = require('@/assets/arrows/arrow-curved-left.png');
const arrowCurvedRight = require('@/assets/arrows/arrow-curved-right.png');
const arrowForward = require('@/assets/arrows/arrow-forward.png');

type ThumbnailSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<ThumbnailSize, number> = {
  sm: 48,
  md: 64,
  lg: 88,
};

const SCALE_FACTORS: Record<ThumbnailSize, number> = {
  sm: 0.25,
  md: 0.35,
  lg: 0.5,
};

interface StepThumbnailProps {
  imageUrl: string | null;
  overlays?: Overlay[];
  size?: ThumbnailSize;
}

type LabelPosition = 'left' | 'right' | 'top' | 'bottom';

function getLabelPosition(overlay: Overlay): LabelPosition {
  const nearBottom = overlay.y > 0.7;
  const nearTop = overlay.y < 0.15;
  const nearRight = overlay.x > 0.75;
  const nearLeft = overlay.x < 0.25;

  if (nearBottom && nearRight) return 'left';
  if (nearBottom && nearLeft) return 'right';
  if (nearTop && nearRight) return 'left';
  if (nearTop && nearLeft) return 'right';
  if (nearBottom) return 'top';
  if (nearRight) return 'left';
  if (nearLeft) return 'right';

  return 'bottom';
}

function getArrowImage(direction?: ArrowDirection) {
  switch (direction) {
    case 'right':
      return arrowCurvedRight;
    case 'left':
      return arrowCurvedLeft;
    case 'forward-backward':
      return arrowForward;
    default:
      return null;
  }
}

export function StepThumbnail({
  imageUrl,
  overlays = [],
  size = 'md',
}: StepThumbnailProps) {
  const dimension = SIZE_MAP[size];
  const scaleFactor = SCALE_FACTORS[size];

  const renderArrowOverlay = (overlay: Overlay) => {
    const baseScale = overlay.scale * scaleFactor;
    const arrowSize = overlay.arrowDirection === 'right' || overlay.arrowDirection === 'left' ? 80 : 60;
    const scaledSize = arrowSize * baseScale;

    if (overlay.arrowDirection === 'up-down' || !overlay.arrowDirection) {
      const svgSize = 60 * baseScale;
      return (
        <View
          key={overlay.id}
          style={[
            styles.overlayItem,
            {
              left: overlay.x * dimension - svgSize / 2,
              top: overlay.y * dimension - (svgSize * 80 / 60) / 2,
              transform: [{ rotate: `${overlay.rotation ?? 0}deg` }],
            },
          ]}
        >
          <Svg width={svgSize} height={svgSize * 80 / 60} viewBox="0 0 450 600">
            <Path d="M225 0 L60 180 L150 180 L150 480 L300 480 L300 180 L390 180 Z" fill="#ffde53" />
          </Svg>
        </View>
      );
    }

    const arrowImg = getArrowImage(overlay.arrowDirection);
    if (!arrowImg) return null;

    return (
      <View
        key={overlay.id}
        style={[
          styles.overlayItem,
          {
            left: overlay.x * dimension - scaledSize / 2,
            top: overlay.y * dimension - scaledSize / 2,
            transform: [{ rotate: `${overlay.rotation ?? 0}deg` }],
          },
        ]}
      >
        <Image
          source={arrowImg}
          style={{ width: scaledSize, height: scaledSize }}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderMarkerOverlay = (overlay: Overlay) => {
    const dotSize = 32 * scaleFactor;
    const innerSize = 14 * scaleFactor;
    const _labelPosition = getLabelPosition(overlay);

    return (
      <View
        key={overlay.id}
        style={[
          styles.overlayItem,
          {
            left: overlay.x * dimension - dotSize / 2,
            top: overlay.y * dimension - dotSize / 2,
          },
        ]}
      >
        <View style={[styles.markerDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]}>
          <View style={[styles.markerInner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholder} />
      )}
      {imageUrl && overlays.length > 0 && (
        <View style={styles.overlayContainer}>
          {overlays.map((overlay) => {
            if (overlay.type === 'arrow') return renderArrowOverlay(overlay);
            if (overlay.type === 'marker') return renderMarkerOverlay(overlay);
            return null;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.background,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayItem: {
    position: 'absolute',
  },
  markerDot: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  markerInner: {
    backgroundColor: '#ff6467',
  },
});
