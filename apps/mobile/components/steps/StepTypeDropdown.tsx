import { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import type { StepType } from '@guidenav/types';
import { STEP_TYPE_LABELS, getStepTypesForAddressType } from '@guidenav/types';
import type { AddressType } from '@guidenav/types';

const STEP_TYPE_COLORS: Record<StepType, { bg: string; dot: string; text: string }> = {
  LOCATION_CHECK: { bg: '#fffbeb', dot: '#ffb900', text: '#bb4d00' },
  LANDMARK_REFERENCE: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  PARKING_LOCATION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  BUILDING_ENTRY: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
  RECEPTION_OR_SECURITY: { bg: '#faf5ff', dot: '#ad46ff', text: '#8200db' },
  LOBBY_NAVIGATION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  ELEVATOR_ENTRY: { bg: '#faf5ff', dot: '#ad46ff', text: '#8200db' },
  STAIRS_ENTRY: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  FLOOR_NUMBER: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
  CORRIDOR_OR_PATH: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  DOOR_IDENTIFICATION: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
  DROP_OFF_POINT: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
  GATE_ENTRY: { bg: '#f0fdf4', dot: '#00c950', text: '#008236' },
  UNIT_OR_DOOR_IDENTIFICATION: { bg: '#eff6ff', dot: '#2b7fff', text: '#1447e6' },
  FLOOR_NAVIGATION: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
  OTHER: { bg: '#f3f4f6', dot: '#99a1af', text: '#4a5565' },
};

export { STEP_TYPE_COLORS };

interface StepTypeOption {
  type: StepType;
  label: string;
  orderHint: string;
  orderIndex: number;
}

interface StepTypeDropdownProps {
  value: StepType;
  onChange: (type: StepType) => void;
  addressType: AddressType | null;
  stepIndex: number;
  disabled?: boolean;
}

export function StepTypeDropdown({
  value,
  onChange,
  addressType,
  stepIndex,
  disabled,
}: StepTypeDropdownProps) {
  const [expanded, setExpanded] = useState(false);

  const options = useMemo<StepTypeOption[]>(() => {
    if (!addressType) {
      return Object.entries(STEP_TYPE_LABELS).map(([type, labels]) => ({
        type: type as StepType,
        label: labels.en,
        orderHint: '',
        orderIndex: 99,
      }));
    }
    return getStepTypesForAddressType(addressType).map((config) => ({
      type: config.type,
      label: STEP_TYPE_LABELS[config.type].en,
      orderHint: config.orderHint,
      orderIndex: config.orderIndex,
    }));
  }, [addressType]);

  const suggestedType = useMemo<StepType | null>(() => {
    if (options.length === 0) return null;
    const match = options.find((o) => o.orderIndex === stepIndex + 1);
    if (match) return match.type;
    if (stepIndex >= options.length) return options[options.length - 1].type;
    return options[stepIndex]?.type || options[0].type;
  }, [options, stepIndex]);

  const selectedOption = options.find((o) => o.type === value);
  const selectedColors = STEP_TYPE_COLORS[value] || STEP_TYPE_COLORS.OTHER;

  const handleSelect = useCallback(
    (type: StepType) => {
      onChange(type);
      setExpanded(false);
    },
    [onChange],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>STEP TYPE</Text>
      <Pressable
        style={[styles.trigger, { borderColor: expanded ? selectedColors.dot : '#e5e7eb' }]}
        onPress={() => !disabled && setExpanded(!expanded)}
        disabled={disabled}
      >
        <View style={[styles.triggerBadge, { backgroundColor: selectedColors.bg }]}>
          <View style={[styles.triggerDot, { backgroundColor: selectedColors.dot }]} />
          <Text style={[styles.triggerLabel, { color: selectedColors.text }]}>
            {selectedOption?.label || STEP_TYPE_LABELS[value]?.en || value}
          </Text>
          {selectedOption?.orderHint ? (
            <View style={styles.triggerHintBadge}>
              <Text style={styles.triggerHintText}>{selectedOption.orderHint}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>

      {expanded && (
        <View style={styles.dropdown}>
          <Text style={styles.dropdownHelper}>Hints show typical delivery order</Text>
          <ScrollView
            style={styles.dropdownScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {options.map((option) => {
              const colors = STEP_TYPE_COLORS[option.type] || STEP_TYPE_COLORS.OTHER;
              const isSelected = option.type === value;
              const isSuggested = option.type === suggestedType;

              return (
                <Pressable
                  key={option.type}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(option.type)}
                >
                  <View style={styles.optionLeft}>
                    <View
                      style={[
                        styles.optionDot,
                        { backgroundColor: colors.dot },
                      ]}
                    />
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionLabel, { color: colors.text }]}>
                        {option.label}
                      </Text>
                      {option.orderHint ? (
                        <Text style={styles.optionHint}>{option.orderHint}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.optionRight}>
                    {isSuggested && (
                      <Text style={styles.suggestedText}>Suggested</Text>
                    )}
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5565',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  triggerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  triggerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  triggerLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  triggerHintBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  triggerHintText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#4a5565',
  },
  chevron: {
    fontSize: 14,
    color: '#99a1af',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    maxHeight: 320,
    overflow: 'hidden',
  },
  dropdownHelper: {
    fontSize: 13,
    color: '#99a1af',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  dropdownScroll: {
    maxHeight: 280,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionSelected: {
    backgroundColor: '#f9fafb',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  optionHint: {
    fontSize: 12,
    color: '#99a1af',
    marginTop: 2,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#008236',
  },
  checkmark: {
    fontSize: 18,
    color: '#4a5565',
    fontWeight: '600',
  },
});
