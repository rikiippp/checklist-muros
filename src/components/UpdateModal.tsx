import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Dialog, Portal } from 'react-native-paper';

interface UpdateModalProps {
  visible: boolean;
  message?: string;
}

export default function UpdateModal({ visible, message = 'Actualizando app...' }: UpdateModalProps) {
  return (
    <Portal>
      <Dialog visible={visible} dismissable={false} style={styles.dialog}>
        <Dialog.Content style={styles.content}>
          <ActivityIndicator size="large" color="#f07e0e" style={styles.spinner} />
          <Text variant="titleMedium" style={styles.text}>
            {message}
          </Text>
          <Text variant="bodySmall" style={styles.subtext}>
            Por favor, espera un momento...
          </Text>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtext: {
    textAlign: 'center',
    color: '#666',
  },
});

