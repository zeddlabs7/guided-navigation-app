import { View, Text, StyleSheet } from 'react-native';
import type { Coordinates, LocationData } from '@guidenav/types';

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (data: LocationData | null) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  defaultCenter?: Coordinates;
}

export function LocationPicker({ label = 'Address Location' }: LocationPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label} (native only)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  text: {
    color: '#6b7280',
    fontSize: 14,
  },
});
