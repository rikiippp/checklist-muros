import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Checkbox, IconButton, Text, Dialog, Button, Portal } from 'react-native-paper';
import { BRAND_COLORS } from '../theme';

type Props = {
  title: string;
  description?: string;
  color: string;
  colorLabel?: string;
  done: boolean;
  createdAt?: any;
  dueDate?: any;
  assignedToLabel?: string;
  canDelete?: boolean;
  onToggleDone: () => void;
  onDelete: () => void;
};

export default function TaskItem({ title, description, color, colorLabel, done, createdAt, dueDate, assignedToLabel, canDelete = true, onToggleDone, onDelete }: Props) {
  const formatDate = (tsOrDate?: any) => {
    try {
      if (!tsOrDate) return '';
      const date: Date = typeof tsOrDate.toDate === 'function' ? tsOrDate.toDate() : new Date(tsOrDate);
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletePressed, setDeletePressed] = useState(false);

  const handleToggle = () => {
    if (done) {
      setShowConfirmDialog(true);
    } else {
      onToggleDone();
    }
  };

  const confirmUncheck = () => {
    setShowConfirmDialog(false);
    onToggleDone();
  };

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, backgroundColor: done ? '#c8e6c9' : 'transparent', borderRadius: 8, marginVertical: 4 }}>
        <View style={{ width: 6, height: 40, backgroundColor: color, borderRadius: 4, marginRight: 8 }} />
        <Checkbox status={done ? 'checked' : 'unchecked'} onPress={handleToggle} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
            <Text variant="titleMedium" style={{ textDecorationLine: done ? 'line-through' : 'none' }}>{title}</Text>
            {colorLabel && (
              <Text 
                variant="titleMedium" 
                style={{ 
                  textDecorationLine: done ? 'line-through' : 'none',
                  fontWeight: 'bold',
                  color: color,
                  marginLeft: 4
                }}
              >
                ({colorLabel})
              </Text>
            )}
          </View>
          {!!description && <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 2 }}>{description}</Text>}
          {!!(createdAt || dueDate || assignedToLabel) && (
            <View style={{ marginTop: 6 }}>
              {!!createdAt && <Text variant="bodySmall" style={{ opacity: 0.7 }}>Creada: {formatDate(createdAt)}</Text>}
              {!!dueDate && <Text variant="bodySmall" style={{ opacity: 0.7 }}>Límite: {formatDate(dueDate)}</Text>}
              {!!assignedToLabel && <Text variant="bodySmall" style={{ opacity: 0.7 }}>Asignada a: {assignedToLabel}</Text>}
            </View>
          )}
          {done && <Text variant="bodySmall" style={{ color: '#2e7d32', fontWeight: '600', marginTop: 6 }}>Completado</Text>}
        </View>
        {canDelete && (
          <TouchableOpacity
            onPressIn={() => setDeletePressed(true)}
            onPressOut={() => {
              setDeletePressed(false);
              onDelete();
            }}
            style={[
              styles.deleteButton,
              deletePressed && styles.deleteButtonPressed
            ]}
            activeOpacity={0.7}
          >
            <IconButton 
              icon="delete" 
              iconColor={deletePressed ? BRAND_COLORS.primary : undefined}
            />
          </TouchableOpacity>
        )}
      </View>
      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>Desmarcar tarea</Dialog.Title>
          <Dialog.Content>
            <Text>¿Estás seguro de que deseas sacar esta tarea de completadas?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>Cancelar</Button>
            <Button onPress={confirmUncheck}>Sí, desmarcar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  deleteButtonPressed: {
    backgroundColor: BRAND_COLORS.primary + '20', // 20% opacity
  },
});


