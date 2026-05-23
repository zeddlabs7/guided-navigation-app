import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

interface LabelInputModalProps {
  visible: boolean;
  initialValue?: string;
  title?: string;
  onSave: (label: string) => void;
  onCancel: () => void;
}

export function LabelInputModal({
  visible,
  initialValue = '',
  title = 'Add Label',
  onSave,
  onCancel,
}: LabelInputModalProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setInputValue(initialValue);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible, initialValue]);

  function handleSave() {
    const trimmed = inputValue.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  }

  function handleCancel() {
    onCancel();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdropPress} onPress={handleCancel}>
          <Pressable
            style={styles.modal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.title}>{title}</Text>

            <TextInput
              ref={inputRef}
              style={[
                styles.input,
                inputRef.current?.isFocused() && styles.inputFocused,
              ]}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="e.g. PIN Keypad, Elevator Button"
              placeholderTextColor="#99a1af"
              maxLength={50}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoFocus
            />

            <View style={styles.actions}>
              <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.saveBtn,
                  !inputValue.trim() && styles.saveBtnDisabled,
                ]}
                onPress={handleSave}
                disabled={!inputValue.trim()}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  backdropPress: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#101828',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    color: '#1a252f',
  },
  inputFocused: {
    borderColor: '#2c3e50',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4a5565',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#2c3e50',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
  },
});
