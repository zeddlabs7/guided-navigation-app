import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type LabelPosition = 'left' | 'right' | 'top' | 'bottom';

interface MarkerDotProps {
  selected?: boolean;
}

export function MarkerDot({ selected = false }: MarkerDotProps) {
  return (
    <View style={[styles.dot, selected && styles.dotSelected]}>
      <View style={styles.dotInner} />
    </View>
  );
}

interface MarkerLabelProps {
  label: string;
  position: LabelPosition;
}

export function MarkerLabel({ label, position }: MarkerLabelProps) {
  const isHorizontal = position === 'left' || position === 'right';

  return (
    <View
      style={[
        styles.labelContainer,
        position === 'bottom' && styles.labelBottom,
        position === 'top' && styles.labelTop,
        position === 'left' && styles.labelLeft,
        position === 'right' && styles.labelRight,
      ]}
    >
      <View
        style={[
          styles.connector,
          isHorizontal ? styles.connectorHorizontal : styles.connectorVertical,
        ]}
      />
      <View style={styles.labelPill}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

export function computeLabelPosition(x: number, y: number): LabelPosition {
  const nearBottom = y > 0.7;
  const nearTop = y < 0.15;
  const nearRight = x > 0.75;
  const nearLeft = x < 0.25;

  if (nearBottom && nearRight) return 'left';
  if (nearBottom && nearLeft) return 'right';
  if (nearTop && nearRight) return 'left';
  if (nearTop && nearLeft) return 'right';
  if (nearBottom) return 'top';
  if (nearRight) return 'left';
  if (nearLeft) return 'right';
  return 'bottom';
}

const styles = StyleSheet.create({
  dot: {
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dotSelected: {
    borderWidth: 3,
    borderColor: '#2c3e50',
    zIndex: 2,
  },
  dotInner: {
    width: 14,
    height: 14,
    backgroundColor: '#ff6467',
    borderRadius: 7,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelBottom: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  labelTop: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  labelLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  labelRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    backgroundColor: '#ff6467',
  },
  connectorVertical: {
    width: 2,
    height: 16,
  },
  connectorHorizontal: {
    width: 16,
    height: 2,
  },
  labelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff6467',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  labelText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
});
