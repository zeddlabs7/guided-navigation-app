import { View, Text, StyleSheet } from 'react-native';

interface PhotoUploadProps {
  imageUri: string | null;
  uploading: boolean;
  onImageSelected: (uri: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function PhotoUpload(_props: PhotoUploadProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Photo upload (native only)</Text>
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
