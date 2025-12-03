import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Checkbox, IconButton, Text, Dialog, Button, Portal } from 'react-native-paper';
import { BRAND_COLORS } from '../theme.ts';

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
  requiresAttachment?: boolean;
  hasAttachments?: boolean;
  onAttachPress?: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
};

export default function TaskItem({
  title,
  description,
  color,
  colorLabel,
  done,
  createdAt,
  dueDate,
  assignedToLabel,
  canDelete = true,
  requiresAttachment,
  hasAttachments,
  onAttachPress,
  onToggleDone,
  onDelete,
}: Props) {
  const formatDate = (tsOrDate?: any) => {
    try {
      if (!tsOrDate) return '';
      const date: Date = typeof tsOrDate.toDate === 'function' ? tsOrDate.toDate() : new Date(tsOrDate);
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Verificar si la tarea está vencida (fecha límite es hoy o ya pasó, y no está completada)
  const isOverdue = (() => {
    if (!dueDate || done) return false;
    try {
      const deadline = typeof dueDate.toDate === 'function' ? dueDate.toDate() : new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);
      return deadlineDate <= today;
    } catch {
      return false;
    }
  })();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete();
  };

  return (
    <>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 4,
        backgroundColor: done ? '#c8e6c9' : (isOverdue ? '#ffebee' : 'rgba(255, 255, 255, 0.95)'),
        borderRadius: 8,
        marginVertical: 2,
        borderWidth: isOverdue && !done ? 2 : 1,
        borderColor: isOverdue && !done ? '#f44336' : 'rgba(200,200,200,0.4)',
        
      }}>
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
              {!!dueDate && (
                <Text 
                  variant="bodySmall" 
                  style={{ 
                    opacity: 0.7,
                    color: isOverdue && !done ? '#d32f2f' : undefined,
                    fontWeight: isOverdue && !done ? 'bold' : undefined
                  }}
                >
                  Límite: {formatDate(dueDate)}
                  {isOverdue && !done && ' ⚠️ VENCIDA'}
                </Text>
              )}
              {!!assignedToLabel && <Text variant="bodySmall" style={{ opacity: 0.7 }}>Asignada a: {assignedToLabel}</Text>}
            </View>
          )}
          {done && <Text variant="bodySmall" style={{ color: '#2e7d32', fontWeight: '600', marginTop: 6 }}>Completado</Text>}

          {/* Adjuntos */}
          {(requiresAttachment || hasAttachments) && (
            <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
              {requiresAttachment && (
                <Text
                  variant="bodySmall"
                  style={{ color: hasAttachments ? '#2e7d32' : '#d32f2f', marginRight: 8 }}
                >
                  {hasAttachments ? '📎 Archivo adjunto cargado' : '📎 Falta adjuntar archivo'}
                </Text>
              )}
              {onAttachPress && (
                <Button
                  mode="text"
                  compact
                  onPress={onAttachPress}
                  textColor={hasAttachments ? BRAND_COLORS.primary : '#d32f2f'}
                >
                  {hasAttachments ? 'Ver / agregar adjunto' : 'Adjuntar archivo'}
                </Button>
              )}
            </View>
          )}
        </View>
        {canDelete && (
          <TouchableOpacity
            onPressIn={() => setDeletePressed(true)}
            onPressOut={() => {
              setDeletePressed(false);
              handleDelete();
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
        {/* Diálogo de confirmación para desmarcar tarea */}
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

        {/* Diálogo de confirmación para eliminar tarea */}
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Eliminar tarea</Dialog.Title>
          <Dialog.Content>
            <Text>¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button onPress={confirmDelete} textColor="#d32f2f">Sí, eliminar</Button>
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


