import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { OverlayType, ArrowDirection } from '@guidenav/types';

const DIRECTIONS: { value: ArrowDirection; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'up-down', label: 'Up/Down' },
  { value: 'forward-backward', label: 'Forward' },
];

function DirectionSvgIcon({ direction, size = 14, color = '#92400e' }: { direction: ArrowDirection; size?: number; color?: string }) {
  switch (direction) {
    case 'left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M20 18C20 18 16 14 12 14C8 14 4 18 4 18" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M4 18L4 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M4 18L10 18" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case 'right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 18C4 18 8 14 12 14C16 14 20 18 20 18" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M20 18L20 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
          <Path d="M20 18L14 18" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case 'up-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 20V4M12 4L6 10M12 4L18 10" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'forward-backward':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M12 20V6M12 6L6 12M12 6L18 12" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M6 20H18" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

interface OverlayToolbarProps {
  overlayType: OverlayType;
  arrowDirection?: ArrowDirection;
  hasLabel?: boolean;
  visible: boolean;
  onChangeDirection: (direction: ArrowDirection) => void;
  onEditLabel: () => void;
  onDelete: () => void;
  onDone: () => void;
}

export function OverlayToolbar({
  overlayType,
  arrowDirection,
  hasLabel = false,
  visible,
  onChangeDirection,
  onEditLabel,
  onDelete,
  onDone,
}: OverlayToolbarProps) {
  const [showDirectionPicker, setShowDirectionPicker] = useState(false);

  if (!visible) return null;

  function selectDirection(direction: ArrowDirection) {
    onChangeDirection(direction);
    setShowDirectionPicker(false);
  }

  return (
    <View style={styles.toolbar}>
      {overlayType === 'arrow' && (
        <View style={styles.directionPickerWrapper}>
          <Pressable
            style={styles.directionBtn}
            onPress={() => setShowDirectionPicker(!showDirectionPicker)}
          >
            <DirectionSvgIcon direction={arrowDirection || 'up-down'} size={16} color="#92400e" />
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 9L12 15L18 9"
                stroke="#92400e"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>

          {showDirectionPicker && (
            <View style={styles.directionPicker}>
              {DIRECTIONS.map((dir) => (
                <Pressable
                  key={dir.value}
                  style={[
                    styles.directionOption,
                    arrowDirection === dir.value &&
                      styles.directionOptionSelected,
                  ]}
                  onPress={() => selectDirection(dir.value)}
                >
                  <DirectionSvgIcon direction={dir.value} size={14} color="#101828" />
                  <Text style={styles.directionOptionLabel}>{dir.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {overlayType === 'marker' && (
        <Pressable style={styles.labelBtn} onPress={onEditLabel}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
              stroke="#4a5565"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
              stroke="#4a5565"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.labelBtnText}>
            {hasLabel ? 'Edit' : 'Add Label'}
          </Text>
        </Pressable>
      )}

      <View style={styles.divider} />

      {/* Delete button */}
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          pressed && styles.btnDangerPressed,
        ]}
        onPress={onDelete}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 6H5H21"
            stroke="#4a5565"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6"
            stroke="#4a5565"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>

      <View style={styles.divider} />

      {/* Done button */}
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          pressed && styles.btnDonePressed,
        ]}
        onPress={onDone}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 6L9 17L4 12"
            stroke="#2c3e50"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  btnDangerPressed: {
    backgroundColor: '#fee2e2',
  },
  btnDonePressed: {
    backgroundColor: '#eff6ff',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  directionPickerWrapper: {
    position: 'relative',
  },
  directionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    minWidth: 56,
    paddingHorizontal: 10,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
  },
  directionIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionPicker: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    marginBottom: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 160,
    gap: 4,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  directionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '48%',
  },
  directionOptionSelected: {
    backgroundColor: '#fef3c7',
  },
  directionOptionIconWrap: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionOptionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#101828',
  },
  labelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  labelBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4a5565',
  },
});
