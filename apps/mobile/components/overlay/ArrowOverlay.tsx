import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { ArrowDirection } from '@guidenav/types';

const arrowCurvedLeft = require('@/assets/arrows/arrow-curved-left.png');
const arrowCurvedRight = require('@/assets/arrows/arrow-curved-right.png');
const arrowForward = require('@/assets/arrows/arrow-forward.png');

interface ArrowOverlayProps {
  scale: number;
  rotation?: number;
  arrowDirection?: ArrowDirection;
  selected?: boolean;
}

export function ArrowOverlay({
  scale = 1,
  rotation = 0,
  arrowDirection = 'up-down',
  selected = false,
}: ArrowOverlayProps) {
  const arrowConfig = useMemo((): { type: string; image: any } => {
    switch (arrowDirection) {
      case 'right':
        return { type: 'curved', image: arrowCurvedRight };
      case 'left':
        return { type: 'curved', image: arrowCurvedLeft };
      case 'up-down':
        return { type: '2d', image: undefined };
      case 'forward-backward':
        return { type: 'forward', image: arrowForward };
      default:
        return { type: '2d', image: undefined };
    }
  }, [arrowDirection]);

  const isCurved = arrowConfig.type === 'curved';
  const is2D = arrowConfig.type === '2d';
  const isForward = arrowConfig.type === 'forward';

  return (
    <View
      style={[
        styles.container,
        {
          transform: [
            { rotate: `${rotation}deg` },
            { scale },
          ],
        },
        selected && styles.containerSelected,
      ]}
      pointerEvents="box-none"
    >
      {isCurved && (
        <Image
          source={arrowConfig.image}
          style={[
            styles.imageCurved,
            selected ? styles.imageSelectedShadow : styles.imageShadow,
          ]}
          resizeMode="contain"
        />
      )}

      {is2D && (
        <View style={selected ? styles.svgSelectedShadow : styles.svgShadow}>
          <Svg width={60} height={80} viewBox="0 0 450 600" fill="none">
            <Path
              d="M225 0 L60 180 L150 180 L150 480 L300 480 L300 180 L390 180 Z"
              fill="#ffde53"
            />
          </Svg>
        </View>
      )}

      {isForward && (
        <Image
          source={arrowConfig.image}
          style={[
            styles.imageForward,
            selected ? styles.imageSelectedShadow : styles.imageShadow,
          ]}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerSelected: {
    zIndex: 10,
  },
  imageCurved: {
    width: 80,
    height: undefined,
    aspectRatio: 1,
  },
  imageForward: {
    width: 60,
    height: undefined,
    aspectRatio: 1,
  },
  imageShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  imageSelectedShadow: {
    shadowColor: '#C8B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 6,
  },
  svgShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  svgSelectedShadow: {
    shadowColor: '#C8B400',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
});
